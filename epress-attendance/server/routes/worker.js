import { Router } from 'express';
import db from '../db.js';
import {
  getActiveSchedules, getActiveEmployees, getDepartmentAssignments,
  getEmployeeSchedule, isBusinessOpen, canCheckIn, canCheckOut,
  nowHHMM, todayStr, handleAutoCheckout,
} from '../shiftUtils.js';
import { requestOTP, verifyOTP } from '../otpUtils.js';

const router = Router();

router.get('/dashboard', (req, res) => {
  const currentTime = nowHHMM();
  const today = todayStr();
  const settings = db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
  const biz = isBusinessOpen(currentTime);
  const employees = getActiveEmployees();
  const deptAssignments = getDepartmentAssignments();
  const activeSchedules = getActiveSchedules();

  const attRecords = db.prepare(`
    SELECT a.*, e.name as employee_name, e.department, s.name as shift_name
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN shifts s ON a.shift_id = s.id
    WHERE a.date = ? ORDER BY a.check_in ASC
  `).all(today);

  const recentActivity = db.prepare(`
    SELECT title, message, type, created_at FROM notifications
    ORDER BY created_at DESC LIMIT 10
  `).all();

  // Build response with all employees on duty
  const employeeStatuses = employees.map(emp => {
    const schedule = getEmployeeSchedule(emp.id);
    const att = db.prepare(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?'
    ).get(emp.id, today);

    const cin = emp && schedule ? canCheckIn(emp.id, currentTime, settings) : { available: false };
    const cout = emp && schedule ? canCheckOut(emp.id, currentTime, settings) : { available: false };

    let minutes = 0;
    if (att?.check_in) {
      const [h, m] = att.check_in.split(':').map(Number);
      const ci = new Date(); ci.setHours(h, m, 0, 0);
      const now = new Date();
      minutes = Math.max(0, Math.floor((now.getTime() - ci.getTime()) / 60000));
    }

    return {
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
    };
  });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStart = weekAgo.toISOString().split('T')[0];

  const weekly = db.prepare(`
    SELECT employee_id, date, check_in, check_out, status FROM attendance
    WHERE date >= ? AND date <= ? ORDER BY date DESC
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

router.post('/request-otp', (req, res) => {
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

  const currentTime = nowHHMM();
  const settings = db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
  const cin = canCheckIn(employee.id, currentTime, settings);

  if (!cin.available) {
    return res.status(400).json({ message: cin.reason || 'Check-in not available right now.' });
  }

  const today = todayStr();
  const existing = db.prepare(
    'SELECT * FROM attendance WHERE employee_id = ? AND date = ?'
  ).get(employee.id, today);

  if (existing?.check_in) {
    return res.status(400).json({ message: 'Already checked in today.' });
  }

  const result = requestOTP(employee);
  res.json(result);
});

router.post('/verify-otp', (req, res) => {
  const { employeeName, code } = req.body;
  if (!employeeName || !code) {
    return res.status(400).json({ message: 'Employee name and OTP code are required.' });
  }

  const employee = db.prepare(
    'SELECT * FROM employees WHERE LOWER(name) = LOWER(?) AND status = ?'
  ).get(employeeName.trim(), 'active');

  if (!employee) {
    return res.status(400).json({ message: 'Employee not found.' });
  }

  const verification = verifyOTP(employee.id, code);
  if (!verification.valid) {
    return res.status(400).json({ message: verification.reason });
  }

  const currentTime = nowHHMM();
  const today = todayStr();
  const settings = db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
  const cin = canCheckIn(employee.id, currentTime, settings);

  if (!cin.available) {
    return res.status(400).json({ message: cin.reason || 'Check-in window has closed.' });
  }

  const schedule = cin.schedule;
  if (!schedule) {
    return res.status(400).json({ message: 'No active schedule found.' });
  }

  const shift = db.prepare(
    'SELECT id FROM shifts WHERE LOWER(department) = LOWER(?) AND start_time = ? AND end_time = ? LIMIT 1'
  ).get(schedule.department, schedule.start_time, schedule.end_time);

  const existing = db.prepare(
    'SELECT * FROM attendance WHERE employee_id = ? AND date = ?'
  ).get(employee.id, today);

  if (existing) {
    if (existing.check_in) {
      return res.status(400).json({ message: 'Already checked in today.' });
    }
    db.prepare(
      'UPDATE attendance SET check_in = ?, status = ?, late_minutes = ?, shift_id = ? WHERE id = ?'
    ).run(
      currentTime,
      cin.isLate ? 'Late' : 'Present',
      cin.lateMinutes || 0,
      shift?.id || null,
      existing.id
    );
  } else {
    db.prepare(
      'INSERT INTO attendance (employee_id, shift_id, date, check_in, status, late_minutes, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
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

  db.prepare(
    'INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)'
  ).run('Check-In', `${employee.name} checked in at ${currentTime} (${schedule.department})`, 'info');

  if (cin.isLate) {
    db.prepare(
      'INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)'
    ).run('Late Arrival', `${employee.name} was ${cin.lateMinutes} min late`, 'warning');
  }

  res.json({
    message: `Checked in successfully at ${currentTime}`,
    late: cin.isLate,
    department: schedule.department,
  });
});

router.post('/checkout', (req, res) => {
  const { employeeName, cashUpAmount } = req.body;
  if (!employeeName || !employeeName.trim()) {
    return res.status(400).json({ message: 'Employee name is required.' });
  }

  const employee = db.prepare(
    'SELECT * FROM employees WHERE LOWER(name) = LOWER(?) AND status = ?'
  ).get(employeeName.trim(), 'active');

  if (!employee) {
    return res.status(400).json({ message: 'Employee not found.' });
  }

  const currentTime = nowHHMM();
  const today = todayStr();
  const settings = db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
  const cout = canCheckOut(employee.id, currentTime, settings);

  if (!cout.available) {
    return res.status(400).json({ message: cout.reason || 'Check-out not available.' });
  }

  const existing = db.prepare(
    'SELECT * FROM attendance WHERE employee_id = ? AND date = ?'
  ).get(employee.id, today);

  if (!existing?.check_in) {
    return res.status(400).json({ message: 'You have not checked in today.' });
  }
  if (existing.check_out) {
    return res.status(400).json({ message: 'Already checked out today.' });
  }

  db.prepare('UPDATE attendance SET check_out = ?, cash_up_amount = ? WHERE id = ?')
    .run(currentTime, cashUpAmount || 0, existing.id);

  db.prepare(
    'INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)'
  ).run('Check-Out', `${employee.name} checked out at ${currentTime}`, 'info');

  res.json({ message: `Checked out successfully at ${currentTime}` });
});

export default router;
