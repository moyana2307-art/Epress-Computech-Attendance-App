import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const shifts = await db.prepare(`
    SELECT s.*,
      (SELECT e.name FROM employees e WHERE e.shift_id = s.id AND e.status = 'active' LIMIT 1) as assigned_employee
    FROM shifts s ORDER BY s.start_time ASC
  `).all();
  res.json(shifts);
});

router.get('/current', async (_req, res) => {
  const now = new Date();
  const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const currentMinutes = hhmmToMin(currentTime);

  const shifts = await db.prepare('SELECT * FROM shifts ORDER BY start_time ASC').all();
  for (const shift of shifts) {
    const start = hhmmToMin(shift.start_time);
    const end = hhmmToMin(shift.end_time);
    if (currentMinutes >= start && currentMinutes < end) {
      const employee = await db.prepare(
        'SELECT * FROM employees WHERE shift_id = $1 AND status = $2'
      ).get(shift.id, 'active');
      return res.json({ shift, employee: employee || null });
    }
  }
  res.json({ shift: null, employee: null });
});

function hhmmToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

router.post('/', async (req, res) => {
  const { name, start_time, end_time, description, responsibilities, department } = req.body;
  if (!name || !start_time || !end_time) {
    return res.status(400).json({ message: 'Name, start time, and end time are required.' });
  }
  const result = await db.prepare(
    'INSERT INTO shifts (name, start_time, end_time, description, responsibilities, department) VALUES ($1, $2, $3, $4, $5, $6)'
  ).run(name, start_time, end_time, description || '', responsibilities || '', department || 'General');

  const shift = await db.prepare('SELECT * FROM shifts WHERE id = $1').get(result.lastInsertRowid);
  res.status(201).json(shift);
});

router.put('/:id', async (req, res) => {
  const { name, start_time, end_time, description, responsibilities, department } = req.body;
  const existing = await db.prepare('SELECT * FROM shifts WHERE id = $1').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Shift not found.' });
  }
  await db.prepare(
    'UPDATE shifts SET name = $1, start_time = $2, end_time = $3, description = $4, responsibilities = $5, department = $6 WHERE id = $7'
  ).run(
    name || existing.name,
    start_time || existing.start_time,
    end_time || existing.end_time,
    description !== undefined ? description : existing.description,
    responsibilities !== undefined ? responsibilities : existing.responsibilities,
    department || existing.department,
    req.params.id
  );
  const updated = await db.prepare('SELECT * FROM shifts WHERE id = $1').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const existing = await db.prepare('SELECT * FROM shifts WHERE id = $1').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Shift not found.' });
  }
  await db.prepare('UPDATE employees SET shift_id = NULL WHERE shift_id = $1').run(req.params.id);
  await db.prepare('DELETE FROM shifts WHERE id = $1').run(req.params.id);
  res.json({ message: 'Shift deleted successfully.' });
});

export default router;
