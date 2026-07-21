import { Router } from 'express';
import db from '../db.js';
import { requireAdmin } from '../middleware.js';

const router = Router();

router.get('/', async (_req, res) => {
  const leaves = await db.prepare('SELECT * FROM leave_requests ORDER BY created_at DESC').all();
  res.json(leaves);
});

router.post('/', async (req, res) => {
  const { employee_name, type, start_date, end_date, reason } = req.body;
  if (!employee_name || !type || !start_date || !end_date || !reason) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  const result = await db.prepare(
    'INSERT INTO leave_requests (employee_name, type, start_date, end_date, reason) VALUES ($1, $2, $3, $4, $5)'
  ).run(employee_name, type, start_date, end_date, reason);

  await db.prepare('INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)').run(
    'New Leave Request',
    `${employee_name} requested ${type} leave from ${start_date} to ${end_date}`,
    'info'
  );

  const leave = await db.prepare('SELECT * FROM leave_requests WHERE id = $1').get(result.lastInsertRowid);
  res.status(201).json(leave);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid leave request ID.' });
  const leave = await db.prepare('SELECT * FROM leave_requests WHERE id = $1').get(id);
  if (!leave) return res.status(404).json({ message: `Leave request #${req.params.id} not found. It may have been deleted or the database was reset.` });

  await db.prepare('UPDATE leave_requests SET status = $1 WHERE id = $2').run(status, req.params.id);

  await db.prepare('INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)').run(
    `Leave ${status}`,
    `${leave.employee_name}'s leave request has been ${status}`,
    status === 'approved' ? 'success' : 'warning'
  );

  const updated = await db.prepare('SELECT * FROM leave_requests WHERE id = $1').get(req.params.id);
  res.json(updated);
});

export default router;
