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

export default router;
