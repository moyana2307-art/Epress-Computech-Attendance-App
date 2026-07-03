import { Router } from 'express';
import db from '../db.js';
import { asyncHandler } from '../asyncHandler.js';

const router = Router();

router.get('/', async (_req, res) => {
  const departments = await db.prepare(`
    SELECT d.*, (SELECT COUNT(*) FROM employees e WHERE e.department = d.name) as employee_count
    FROM departments d ORDER BY d.name ASC
  `).all();
  res.json(departments);
});

router.post('/', asyncHandler(async (req, res) => {
  const { name, head } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Department name is required.' });
  }
  try {
    const result = await db.prepare('INSERT INTO departments (name, head) VALUES ($1, $2)').run(name.trim(), head || '');
    const dept = await db.prepare('SELECT * FROM departments WHERE id = $1').get(result.lastInsertRowid);
    res.status(201).json({ ...dept, employee_count: 0 });
  } catch (err) {
    if (err.message?.includes('unique') || err.code === '23505') {
      return res.status(409).json({ message: 'Department already exists.' });
    }
    throw err;
  }
}));

export default router;
