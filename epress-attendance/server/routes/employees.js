import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const employees = db.prepare(`
    SELECT e.*, s.name as shift_name
    FROM employees e
    LEFT JOIN shifts s ON e.shift_id = s.id
    ORDER BY e.name ASC
  `).all();
  res.json(employees);
});

router.get('/:id', (req, res) => {
  const employee = db.prepare(`
    SELECT e.*, s.name as shift_name
    FROM employees e
    LEFT JOIN shifts s ON e.shift_id = s.id
    WHERE e.id = ?
  `).get(req.params.id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found.' });
  }
  res.json(employee);
});

router.post('/', (req, res) => {
  const { name, email, department, position, phone, shift_id, responsibilities } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Employee name is required.' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO employees (name, email, department, position, phone, shift_id, responsibilities) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      name.trim(),
      email || null,
      department || 'General',
      position || '',
      phone || '',
      shift_id || null,
      responsibilities || ''
    );

    const employee = db.prepare(`
      SELECT e.*, s.name as shift_name
      FROM employees e
      LEFT JOIN shifts s ON e.shift_id = s.id
      WHERE e.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(employee);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ message: 'Employee with this name already exists.' });
    }
    throw err;
  }
});

router.put('/:id', (req, res) => {
  const { name, email, department, position, phone, status, shift_id, responsibilities } = req.body;
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);

  if (!employee) {
    return res.status(404).json({ message: 'Employee not found.' });
  }

  try {
    db.prepare(
      'UPDATE employees SET name = ?, email = ?, department = ?, position = ?, phone = ?, status = ?, shift_id = ?, responsibilities = ? WHERE id = ?'
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

    const updated = db.prepare(`
      SELECT e.*, s.name as shift_name
      FROM employees e
      LEFT JOIN shifts s ON e.shift_id = s.id
      WHERE e.id = ?
    `).get(req.params.id);
    res.json(updated);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ message: 'Employee with this name already exists.' });
    }
    throw err;
  }
});

router.delete('/:id', (req, res) => {
  try {
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    db.prepare('DELETE FROM attendance WHERE employee_id = ?').run(req.params.id);
    db.prepare('DELETE FROM employee_schedules WHERE employee_id = ?').run(req.params.id);
    db.prepare('DELETE FROM otp_codes WHERE employee_id = ?').run(req.params.id);
    db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);

    res.json({ message: 'Employee deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err?.message || 'Failed to delete employee.' });
  }
});

export default router;
