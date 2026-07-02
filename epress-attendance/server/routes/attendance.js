import { Router } from 'express';
import db from '../db.js';
import { nowHHMM, todayStr, canCheckIn, canCheckOut } from '../shiftUtils.js';

const router = Router();

router.get('/', (req, res) => {
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
    conditions.push('a.date = ?');
    params.push(date);
  }
  if (employee_id) {
    conditions.push('a.employee_id = ?');
    params.push(employee_id);
  }
  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY a.created_at DESC';

  const records = db.prepare(query).all(...params);
  res.json(records);
});

router.get('/stats', (req, res) => {
  const { date } = req.query;
  const today = date || new Date().toISOString().split('T')[0];

  const total = db.prepare(
    'SELECT COUNT(*) as count FROM attendance WHERE date = ?'
  ).get(today);

  const present = db.prepare(
    "SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'Present'"
  ).get(today);

  const late = db.prepare(
    "SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'Late'"
  ).get(today);

  const checkedOut = db.prepare(
    'SELECT COUNT(*) as count FROM attendance WHERE date = ? AND check_out IS NOT NULL'
  ).get(today);

  res.json({
    total: total.count,
    present: present.count,
    late: late.count,
    checkedOut: checkedOut.count,
  });
});

router.get('/today', (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const records = db.prepare(`
    SELECT a.*, e.name as employee_name, e.department, s.name as shift_name
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN shifts s ON a.shift_id = s.id
    WHERE a.date = ?
    ORDER BY a.check_in ASC
  `).all(today);

  res.json(records);
});

router.post('/toggle', (req, res) => {
  const { employeeName } = req.body;
  if (!employeeName || !employeeName.trim()) {
    return res.status(400).json({ message: 'Employee name is required.' });
  }

  const employee = db.prepare(
    'SELECT * FROM employees WHERE LOWER(name) = LOWER(?) AND status = ?'
  ).get(employeeName.trim(), 'active');

  if (!employee) {
    return res.status(400).json({ message: 'Employee not found or inactive.' });
  }

  const today = todayStr();
  const currentTime = nowHHMM();

  const existing = db.prepare(
    'SELECT * FROM attendance WHERE employee_id = ? AND date = ?'
  ).get(employee.id, today);

  if (!existing) {
    const settings = db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
    const cin = canCheckIn(employee.id, currentTime, settings);

    if (!cin.available) {
      return res.status(400).json({
        message: cin.reason === 'Check-in window closed (grace period expired)'
          ? 'Check-in window closed. Ask Admin to check you in.'
          : (cin.reason || 'Check-in not available right now.'),
      });
    }

    const schedule = cin.schedule;
    const shift = schedule ? db.prepare(
      'SELECT id FROM shifts WHERE LOWER(department) = LOWER(?) AND start_time = ? AND end_time = ? LIMIT 1'
    ).get(schedule.department, schedule.start_time, schedule.end_time) : null;

    db.prepare(
      'INSERT INTO attendance (employee_id, shift_id, date, check_in, status, late_minutes, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      employee.id,
      shift?.id || null,
      today,
      currentTime,
      cin.isLate ? 'Late' : 'Present',
      cin.lateMinutes || 0,
      '',
    );

    db.prepare(
      'INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)'
    ).run('Check-In', `${employee.name} checked in at ${currentTime}`, 'info');

    if (cin.isLate) {
      db.prepare(
        'INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)'
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

    const settings = db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
    const cout = canCheckOut(employee.id, currentTime, settings);

    if (!cout.available) {
      return res.status(400).json({ message: cout.reason || 'Check-out not available right now.' });
    }

    db.prepare(
      'UPDATE attendance SET check_out = ?, cash_up_amount = ? WHERE id = ?'
    ).run(currentTime, cashUpAmount || 0, existing.id);

    db.prepare(
      'INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)'
    ).run('Check-Out', `${employee.name} checked out at ${currentTime}`, 'info');

    const updated = db.prepare('SELECT * FROM attendance WHERE id = ?').get(existing.id);

    return res.json({
      message: `Checked out successfully at ${currentTime}`,
      data: updated,
    });
  }

  if (existing.check_in && existing.check_out) {
    return res.status(400).json({ message: 'Already checked in and out today.' });
  }

  return res.status(400).json({ message: 'No attendance action available.' });
});

router.post('/admin-checkin', (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) {
    return res.status(400).json({ message: 'Employee ID is required.' });
  }

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);
  if (!employee) {
    return res.status(400).json({ message: 'Employee not found.' });
  }

  const today = todayStr();
  const currentTime = nowHHMM();

  const existing = db.prepare(
    'SELECT * FROM attendance WHERE employee_id = ? AND date = ?'
  ).get(employee.id, today);

  if (existing?.check_in) {
    return res.status(400).json({ message: `${employee.name} already checked in today at ${existing.check_in}.` });
  }

  if (existing && !existing.check_in) {
    db.prepare('UPDATE attendance SET check_in = ?, status = ?, note = ? WHERE id = ?')
      .run(currentTime, 'Present', 'Admin check-in', existing.id);
  } else {
    db.prepare(
      'INSERT INTO attendance (employee_id, date, check_in, status, note) VALUES (?, ?, ?, ?, ?)'
    ).run(employee.id, today, currentTime, 'Present', 'Admin check-in');
  }

  db.prepare(
    'INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)'
  ).run('Admin Check-In', `${employee.name} checked in by Admin at ${currentTime}`, 'info');

  return res.json({
    message: `${employee.name} checked in successfully by Admin at ${currentTime}`,
  });
});

export default router;
