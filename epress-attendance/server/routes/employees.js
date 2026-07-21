import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { asyncHandler } from '../asyncHandler.js';
import { requireAdmin } from '../middleware.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const employees = await db.prepare(`
    SELECT e.*, s.name as shift_name
    FROM employees e
    LEFT JOIN shifts s ON e.shift_id = s.id
    ORDER BY e.name ASC
  `).all();
  res.json(employees);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const employee = await db.prepare(`
    SELECT e.*, s.name as shift_name
    FROM employees e
    LEFT JOIN shifts s ON e.shift_id = s.id
    WHERE e.id = $1
  `).get(req.params.id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found.' });
  }
  res.json(employee);
}));

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const { name, email, password, department, position, phone, shift_id, responsibilities } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Employee name is required.' });
  }

  try {
    const result = await db.transaction(async (client) => {
      const userPw = password ? await bcrypt.hash(password, 12) : await bcrypt.hash('default123', 12);
      await client.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        [name.trim(), email || null, userPw, 'employee']
      );

      const empResult = await client.query(
        'INSERT INTO employees (name, email, department, position, phone, shift_id, responsibilities) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [name.trim(), email || null, department || 'General', position || '', phone || '', shift_id || null, responsibilities || '']
      );

      const emp = await client.query(`
        SELECT e.*, s.name as shift_name
        FROM employees e
        LEFT JOIN shifts s ON e.shift_id = s.id
        WHERE e.id = $1
      `, [empResult.rows[0].id]);

      return emp.rows[0];
    })();

    res.status(201).json(result);
  } catch (err) {
    if (err.message?.includes('unique') || err.code === '23505') {
      return res.status(409).json({ message: 'An account with this name or email already exists.' });
    }
    throw err;
  }
}));

router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { name, email, department, position, phone, status, shift_id, responsibilities } = req.body;
  const employee = await db.prepare('SELECT * FROM employees WHERE id = $1').get(req.params.id);

  if (!employee) {
    return res.status(404).json({ message: 'Employee not found.' });
  }

  try {
    await db.prepare(
      'UPDATE employees SET name = $1, email = $2, department = $3, position = $4, phone = $5, status = $6, shift_id = $7, responsibilities = $8 WHERE id = $9'
    ).run(
      (name || employee.name).trim(),
      email !== undefined ? email : employee.email,
      department || employee.department,
      position !== undefined ? position : employee.position,
      phone !== undefined ? phone : employee.phone,
      status || employee.status,
      shift_id !== undefined ? shift_id : employee.shift_id,
      responsibilities !== undefined ? responsibilities : employee.responsibilities,
      req.params.id
    );

    const updated = await db.prepare(`
      SELECT e.*, s.name as shift_name
      FROM employees e
      LEFT JOIN shifts s ON e.shift_id = s.id
      WHERE e.id = $1
    `).get(req.params.id);
    res.json(updated);
  } catch (err) {
    if (err.message?.includes('unique') || err.code === '23505') {
      return res.status(409).json({ message: 'Employee with this name already exists.' });
    }
    throw err;
  }
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  try {
    const employee = await db.prepare('SELECT * FROM employees WHERE id = $1').get(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    await db.prepare('DELETE FROM attendance WHERE employee_id = $1').run(req.params.id);
    await db.prepare('DELETE FROM employee_schedules WHERE employee_id = $1').run(req.params.id);
    await db.prepare('DELETE FROM otp_codes WHERE employee_id = $1').run(req.params.id);
    await db.prepare('DELETE FROM shift_logs WHERE employee_id = $1').run(req.params.id);
    await db.prepare("DELETE FROM users WHERE name = $1 AND role = 'employee'").run(employee.name);
    await db.prepare('DELETE FROM employees WHERE id = $1').run(req.params.id);

    res.json({ message: 'Employee deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err?.message || 'Failed to delete employee.' });
  }
}));

export default router;
