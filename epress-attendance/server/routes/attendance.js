import { Router } from 'express';
import db from '../db.js';
import { nowHHMM, todayStr, canCheckIn, canCheckOut } from '../shiftUtils.js';
import { asyncHandler } from '../asyncHandler.js';
import { requireAdmin } from '../middleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { date, employee_id } = req.query;
  let query = `
    SELECT a.*, e.name as employee_name, e.department, s.name as shift_name
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN shifts s ON a.shift_id = s.id
  `;
  const params = [];
  const conditions = [];

  if (date) {
    conditions.push(`a.date = $${params.length + 1}`);
    params.push(date);
  }
  if (employee_id) {
    conditions.push(`a.employee_id = $${params.length + 1}`);
    params.push(employee_id);
  }
  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY a.created_at DESC';

  const records = await db.prepare(query).all(...params);
  res.json(records);
}));

router.get('/stats', asyncHandler(async (req, res) => {
  const { date } = req.query;
  const today = date || todayStr();

  const total = await db.prepare(
    'SELECT COUNT(*) as count FROM attendance WHERE date = $1'
  ).get(today);

  const present = await db.prepare(
    "SELECT COUNT(*) as count FROM attendance WHERE date = $1 AND status = 'Present'"
  ).get(today);

  const late = await db.prepare(
    "SELECT COUNT(*) as count FROM attendance WHERE date = $1 AND status = 'Late'"
  ).get(today);

  const checkedOut = await db.prepare(
    'SELECT COUNT(*) as count FROM attendance WHERE date = $1 AND check_out IS NOT NULL'
  ).get(today);

  res.json({
    total: total.count,
    present: present.count,
    late: late.count,
    checkedOut: checkedOut.count,
  });
}));

router.get('/today', asyncHandler(async (_req, res) => {
  const today = todayStr();
  const records = await db.prepare(`
    SELECT a.*, e.name as employee_name, e.department, s.name as shift_name
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN shifts s ON a.shift_id = s.id
    WHERE a.date = $1
    ORDER BY a.check_in ASC
  `).all(today);

  res.json(records);
}));

router.post('/toggle', asyncHandler(async (req, res) => {
  const { employeeName } = req.body;
  if (!employeeName || !employeeName.trim()) {
    return res.status(400).json({ message: 'Employee name is required.' });
  }

  const employee = await db.prepare(
    'SELECT * FROM employees WHERE LOWER(name) = LOWER($1) AND status = $2'
  ).get(employeeName.trim(), 'active');

  if (!employee) {
    return res.status(400).json({ message: 'Employee not found or inactive.' });
  }

  const today = todayStr();
  const currentTime = nowHHMM();

  const existing = await db.prepare(
    'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2'
  ).get(employee.id, today);

  if (!existing) {
    const settings = await db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
    const cin = await canCheckIn(employee.id, currentTime, settings);

    if (!cin.available) {
      return res.status(400).json({
        message: cin.reason === 'Check-in window closed (grace period expired)'
          ? 'Check-in window closed. Ask Admin to check you in.'
          : (cin.reason || 'Check-in not available right now.'),
      });
    }

    const schedule = cin.schedule;
    const shift = schedule ? await db.prepare(
      'SELECT id FROM shifts WHERE LOWER(department) = LOWER($1) AND start_time = $2 AND end_time = $3 LIMIT 1'
    ).get(schedule.department, schedule.start_time, schedule.end_time) : null;

    await db.prepare(
      'INSERT INTO attendance (employee_id, shift_id, date, check_in, status, late_minutes, note) VALUES ($1, $2, $3, $4, $5, $6, $7)'
    ).run(
      employee.id,
      shift?.id || null,
      today,
      currentTime,
      cin.isLate ? 'Late' : 'Present',
      cin.lateMinutes || 0,
      '',
    );

    await db.prepare(
      'INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)'
    ).run('Check-In', `${employee.name} checked in at ${currentTime}`, 'info');

    if (cin.isLate) {
      await db.prepare(
        'INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)'
      ).run('Late Arrival', `${employee.name} was ${cin.lateMinutes} min late`, 'warning');
    }

    return res.json({
      message: `Checked in successfully at ${currentTime}`,
      data: { employee_id: employee.id, date: today, check_in: currentTime, status: cin.isLate ? 'Late' : 'Present' },
    });
  }

  if (existing.check_in && !existing.check_out) {
    const { cashUpAmount } = req.body;

    if (cashUpAmount === undefined) {
      return res.json({
        message: 'Enter cash-up amount to complete check-out',
        requiresRevenue: true,
        employee_id: employee.id,
        date: today,
      });
    }

    const settings = await db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
    const cout = await canCheckOut(employee.id, currentTime, settings);

    if (!cout.available) {
      return res.status(400).json({ message: cout.reason || 'Check-out not available right now.' });
    }

    await db.prepare(
      'UPDATE attendance SET check_out = $1, cash_up_amount = $2 WHERE id = $3'
    ).run(currentTime, cashUpAmount || 0, existing.id);

    await db.prepare(
      'INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)'
    ).run('Check-Out', `${employee.name} checked out at ${currentTime}`, 'info');

    const updated = await db.prepare('SELECT * FROM attendance WHERE id = $1').get(existing.id);

    return res.json({
      message: `Checked out successfully at ${currentTime}`,
      data: updated,
    });
  }

  if (existing.check_in && existing.check_out) {
    return res.status(400).json({ message: 'Already checked in and out today.' });
  }

  return res.status(400).json({ message: 'No attendance action available.' });
}));

router.post('/admin-checkin', requireAdmin, asyncHandler(async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) {
    return res.status(400).json({ message: 'Employee ID is required.' });
  }

  const employee = await db.prepare('SELECT * FROM employees WHERE id = $1').get(employeeId);
  if (!employee) {
    return res.status(400).json({ message: 'Employee not found.' });
  }

  const today = todayStr();
  const currentTime = nowHHMM();

  const existing = await db.prepare(
    'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2'
  ).get(employee.id, today);

  if (existing?.check_in) {
    return res.status(400).json({ message: `${employee.name} already checked in today at ${existing.check_in}.` });
  }

  if (existing && !existing.check_in) {
    await db.prepare('UPDATE attendance SET check_in = $1, status = $2, note = $3 WHERE id = $4')
      .run(currentTime, 'Present', 'Admin check-in', existing.id);
  } else {
    await db.prepare(
      'INSERT INTO attendance (employee_id, date, check_in, status, note) VALUES ($1, $2, $3, $4, $5)'
    ).run(employee.id, today, currentTime, 'Present', 'Admin check-in');
  }

  await db.prepare(
    'INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)'
  ).run('Admin Check-In', `${employee.name} checked in by Admin at ${currentTime}`, 'info');

  return res.json({
    message: `${employee.name} checked in successfully by Admin at ${currentTime}`,
  });
}));

export default router;
