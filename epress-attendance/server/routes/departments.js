import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const departments = db.prepare(`
    SELECT d.*, (SELECT COUNT(*) FROM employees e WHERE e.department = d.name) as employee_count
    FROM departments d ORDER BY d.name ASC
  `).all();
  res.json(departments);
});

router.post('/', (req, res) => {
  const { name, head } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Department name is required.' });
  }
  try {
    const result = db.prepare('INSERT INTO departments (name, head) VALUES (?, ?)').run(name.trim(), head || '');
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ ...dept, employee_count: 0 });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ message: 'Department already exists.' });
    throw err;
  }
});

export default router;
