import { Router } from 'express';
import db from '../db.js';
import {
  getAllActiveEmployees, getDepartmentAssignments,
  getEmployeeSchedule, isBusinessOpen, canCheckIn, canCheckOut,
  nowHHMM, todayStr,
} from '../shiftUtils.js';
import { requestOTP, verifyOTP } from '../otpUtils.js';
import { requireAuth, otpLimiter, otpVerifyLimiter } from '../middleware.js';

const router = Router();

router.get('/dashboard', requireAuth, async (req, res) => {
  const currentTime = nowHHMM();
  const today = todayStr();
  const settings = await db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
  const biz = await isBusinessOpen(currentTime);
  const allEmployees = await getAllActiveEmployees();
  const deptAssignments = await getDepartmentAssignments();

  const attRecords = await db.prepare(`
    SELECT a.*, e.name as employee_name, e.department, s.name as shift_name
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN shifts s ON a.shift_id = s.id
    WHERE a.date = $1 ORDER BY a.check_in ASC
  `).all(today);

  const recentActivity = await db.prepare(`
    SELECT title, message, type, created_at FROM notifications
    ORDER BY created_at DESC LIMIT 10
  `).all();

  const employeeStatuses = [];
  for (const emp of allEmployees) {
    const currentSchedule = await getEmployeeSchedule(emp.id);
    const cin = await canCheckIn(emp.id, currentTime, settings);
    const cout = await canCheckOut(emp.id, currentTime, settings);
    const schedule = cin.schedule || currentSchedule || cout.schedule || null;
    const att = await db.prepare(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2'
    ).get(emp.id, today);

    let minutes = 0;
    if (att?.check_in) {
      const [h, m] = att.check_in.split(':').map(Number);
      const ci = new Date(); ci.setHours(h, m, 0, 0);
      const now = new Date();
      minutes = Math.max(0, Math.floor((now.getTime() - ci.getTime()) / 60000));
    }

    employeeStatuses.push({
      employee: { id: emp.id, name: emp.name, email: emp.email },
      schedule: schedule ? {
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        department: schedule.department,
      } : null,
      attendance: att ? {
        id: att.id,
        check_in: att.check_in,
        check_out: att.check_out,
        status: att.status,
        late_minutes: att.late_minutes,
      } : null,
      todayMinutes: minutes,
      checkInAvailable: !att?.check_in && cin.available,
      checkInStatus: cin.available ? 'ready' : (att?.check_in ? (att?.check_out ? 'completed' : 'checked_in') : (cin.reason || 'unavailable')),
      checkOutAvailable: att?.check_in && !att?.check_out && cout.available,
      checkOutStatus: !att?.check_in ? 'not_checked_in' : att?.check_out ? 'completed' : (cout.available ? 'ready' : 'waiting'),
    });
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStart = weekAgo.toISOString().split('T')[0];

  const weekly = await db.prepare(`
    SELECT employee_id, date, check_in, check_out, status FROM attendance
    WHERE date >= $1 AND date <= $2 ORDER BY date DESC
  `).all(weekStart, today);

  res.json({
    businessOpen: biz.open,
    businessHours: biz.hours,
    currentTime,
    employees: employeeStatuses,
    departmentAssignments: deptAssignments,
    todayRecords: attRecords,
    recentActivity,
    weeklyAttendance: weekly,
    settings: {
      gracePeriodMinutes: settings.grace_period_minutes,
      earlyCheckinMinutes: settings.early_checkin_minutes,
    },
  });
});

router.post('/request-otp', otpLimiter, async (req, res) => {
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

  const currentTime = nowHHMM();
  const settings = await db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
  const cin = await canCheckIn(employee.id, currentTime, settings);

  if (!cin.available) {
    return res.status(400).json({ message: cin.reason || 'Check-in not available right now.' });
  }

  const today = todayStr();
  const existing = await db.prepare(
    'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2'
  ).get(employee.id, today);

  if (existing?.check_in) {
    return res.status(400).json({ message: 'Already checked in today.' });
  }

  const result = await requestOTP(employee);
  res.json(result);
});

router.post('/verify-otp', otpVerifyLimiter, async (req, res) => {
  const { employeeName, code } = req.body;
  if (!employeeName || !code) {
    return res.status(400).json({ message: 'Employee name and OTP code are required.' });
  }

  const employee = await db.prepare(
    'SELECT * FROM employees WHERE LOWER(name) = LOWER($1) AND status = $2'
  ).get(employeeName.trim(), 'active');

  if (!employee) {
    return res.status(400).json({ message: 'Employee not found.' });
  }

  const verification = await verifyOTP(employee.id, code);
  if (!verification.valid) {
    return res.status(400).json({ message: verification.reason });
  }

  const currentTime = nowHHMM();
  const today = todayStr();
  const settings = await db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
  const cin = await canCheckIn(employee.id, currentTime, settings);

  if (!cin.available) {
    return res.status(400).json({ message: cin.reason || 'Check-in window has closed.' });
  }

  const schedule = cin.schedule;
  if (!schedule) {
    return res.status(400).json({ message: 'No active schedule found.' });
  }

  const shift = await db.prepare(
    'SELECT id FROM shifts WHERE LOWER(department) = LOWER($1) AND start_time = $2 AND end_time = $3 LIMIT 1'
  ).get(schedule.department, schedule.start_time, schedule.end_time);

  const existing = await db.prepare(
    'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2'
  ).get(employee.id, today);

  if (existing) {
    if (existing.check_in) {
      return res.status(400).json({ message: 'Already checked in today.' });
    }
    await db.prepare(
      'UPDATE attendance SET check_in = $1, status = $2, late_minutes = $3, shift_id = $4 WHERE id = $5'
    ).run(
      currentTime,
      cin.isLate ? 'Late' : 'Present',
      cin.lateMinutes || 0,
      shift?.id || null,
      existing.id
    );
  } else {
    await db.prepare(
      'INSERT INTO attendance (employee_id, shift_id, date, check_in, status, late_minutes, note) VALUES ($1, $2, $3, $4, $5, $6, $7)'
    ).run(
      employee.id,
      shift?.id || null,
      today,
      currentTime,
      cin.isLate ? 'Late' : 'Present',
      cin.lateMinutes || 0,
      `OTP verified · ${schedule.department}`
    );
  }

  await db.prepare(
    'INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)'
  ).run('Check-In', `${employee.name} checked in at ${currentTime} (${schedule.department})`, 'info');

  if (cin.isLate) {
    await db.prepare(
      'INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)'
    ).run('Late Arrival', `${employee.name} was ${cin.lateMinutes} min late`, 'warning');
  }

  res.json({
    message: `Checked in successfully at ${currentTime}`,
    late: cin.isLate,
    department: schedule.department,
  });
});

router.post('/checkout', requireAuth, async (req, res) => {
  const { employeeName, cashUpAmount } = req.body;
  if (!employeeName || !employeeName.trim()) {
    return res.status(400).json({ message: 'Employee name is required.' });
  }

  const employee = await db.prepare(
    'SELECT * FROM employees WHERE LOWER(name) = LOWER($1) AND status = $2'
  ).get(employeeName.trim(), 'active');

  if (!employee) {
    return res.status(400).json({ message: 'Employee not found.' });
  }

  const currentTime = nowHHMM();
  const today = todayStr();
  const settings = await db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
  const cout = await canCheckOut(employee.id, currentTime, settings);

  if (!cout.available) {
    return res.status(400).json({ message: cout.reason || 'Check-out not available.' });
  }

  const existing = await db.prepare(
    'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2'
  ).get(employee.id, today);

  if (!existing?.check_in) {
    return res.status(400).json({ message: 'You have not checked in today.' });
  }
  if (existing.check_out) {
    return res.status(400).json({ message: 'Already checked out today.' });
  }

  await db.prepare('UPDATE attendance SET check_out = $1, cash_up_amount = $2 WHERE id = $3')
    .run(currentTime, cashUpAmount || 0, existing.id);

  await db.prepare(
    'INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)'
  ).run('Check-Out', `${employee.name} checked out at ${currentTime}`, 'info');

  res.json({ message: `Checked out successfully at ${currentTime}` });
});

export default router;
