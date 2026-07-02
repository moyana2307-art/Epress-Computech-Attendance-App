import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const leaves = db.prepare('SELECT * FROM leave_requests ORDER BY created_at DESC').all();
  res.json(leaves);
});

router.post('/', (req, res) => {
  const { employee_name, type, start_date, end_date, reason } = req.body;
  if (!employee_name || !type || !start_date || !end_date || !reason) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  const result = db.prepare(
    'INSERT INTO leave_requests (employee_name, type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)'
  ).run(employee_name, type, start_date, end_date, reason);

  // Create notification
  db.prepare('INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)').run(
    'New Leave Request',
    `${employee_name} requested ${type} leave from ${start_date} to ${end_date}`,
    'info'
  );

  const leave = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(leave);
});

router.put('/:id', (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid leave request ID.' });
  const leave = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(id);
  if (!leave) return res.status(404).json({ message: `Leave request #${req.params.id} not found. It may have been deleted or the database was reset.` });

  db.prepare('UPDATE leave_requests SET status = ? WHERE id = ?').run(status, req.params.id);

  db.prepare('INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)').run(
    `Leave ${status}`,
    `${leave.employee_name}'s leave request has been ${status}`,
    status === 'approved' ? 'success' : 'warning'
  );

  const updated = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(req.params.id);
  res.json(updated);
});

export default router;
