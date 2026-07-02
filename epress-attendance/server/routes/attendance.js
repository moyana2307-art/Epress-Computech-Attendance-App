import { Router } from 'express';
import db from '../db.js';

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

  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  const existing = db.prepare(
    'SELECT * FROM attendance WHERE employee_id = ? AND date = ?'
  ).get(employee.id, today);

  if (!existing) {
    db.prepare(
      'INSERT INTO attendance (employee_id, date, check_in, status) VALUES (?, ?, ?, ?)'
    ).run(employee.id, today, currentTime, 'Present');

    db.prepare(
      'INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)'
    ).run('Check-In', `${employee.name} checked in at ${currentTime}`, 'info');

    return res.json({
      message: `Checked in successfully at ${currentTime}`,
      data: { employee_id: employee.id, date: today, check_in: currentTime, status: 'Present' },
    });
  }

  if (existing.check_in && !existing.check_out) {
    db.prepare('UPDATE attendance SET check_out = ? WHERE id = ?').run(currentTime, existing.id);

    db.prepare(
      'INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)'
    ).run('Check-Out', `${employee.name} checked out at ${currentTime}`, 'info');

    return res.json({
      message: `Checked out successfully at ${currentTime}`,
      data: { ...existing, check_out: currentTime },
    });
  }

  if (existing.check_in && existing.check_out) {
    return res.status(400).json({ message: 'Already checked in and out today.' });
  }

  return res.status(400).json({ message: 'No attendance action available.' });
});

export default router;
