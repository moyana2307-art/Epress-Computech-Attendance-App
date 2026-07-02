import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/monthly', (req, res) => {
  const { month, year, employee_id } = req.query;
  const now = new Date();
  const y = year || now.getFullYear();
  const m = month ? String(month).padStart(2, '0') : String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `${y}-${m}`;

  let data;
  const isEmployeeView = !!employee_id;

  if (isEmployeeView) {
    data = db.prepare(`
      SELECT 
        e.id as employee_id,
        e.name as employee_name,
        e.department,
        COUNT(a.id) as work_days,
        SUM(COALESCE(a.cash_up_amount, 0)) as total_revenue,
        ROUND(AVG(COALESCE(a.cash_up_amount, 0)), 2) as avg_daily_revenue
      FROM employees e
      LEFT JOIN attendance a ON a.employee_id = e.id AND a.date LIKE ?
      WHERE e.id = ? AND e.status = 'active'
      GROUP BY e.id
    `).all(`${prefix}%`, Number(employee_id));
  } else {
    data = db.prepare(`
      SELECT 
        e.id as employee_id,
        e.name as employee_name,
        e.department,
        COUNT(a.id) as work_days,
        SUM(COALESCE(a.cash_up_amount, 0)) as total_revenue,
        ROUND(AVG(COALESCE(a.cash_up_amount, 0)), 2) as avg_daily_revenue
      FROM employees e
      LEFT JOIN attendance a ON a.employee_id = e.id AND a.date LIKE ?
      WHERE e.status = 'active'
      GROUP BY e.id
      ORDER BY total_revenue DESC
    `).all(`${prefix}%`);
  }

  const total_revenue = data.reduce((sum, r) => sum + r.total_revenue, 0);

  res.json({ month: m, year: y, total_revenue, employees: data });
});

router.get('/employee/:id', (req, res) => {
  const { id } = req.params;
  const now = new Date();
  const month = req.query.month || String(now.getMonth() + 1).padStart(2, '0');
  const year = req.query.year || now.getFullYear();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  if (!employee) return res.status(404).json({ message: 'Employee not found' });

  const records = db.prepare(`
    SELECT id, date, check_in, check_out, cash_up_amount, status, note
    FROM attendance
    WHERE employee_id = ? AND date LIKE ?
    ORDER BY date ASC
  `).all(id, `${prefix}%`);

  const total = records.reduce((sum, r) => sum + (r.cash_up_amount || 0), 0);

  res.json({ employee, month, year, total, records });
});

router.get('/all', (_req, res) => {
  const data = db.prepare(`
    SELECT 
      e.id as employee_id,
      e.name as employee_name,
      e.department,
      strftime('%Y-%m', a.date) as month,
      SUM(COALESCE(a.cash_up_amount, 0)) as total_revenue,
      COUNT(a.id) as work_days
    FROM employees e
    JOIN attendance a ON a.employee_id = e.id
    WHERE e.status = 'active' AND a.cash_up_amount > 0
    GROUP BY e.id, strftime('%Y-%m', a.date)
    ORDER BY month DESC, total_revenue DESC
  `).all();

  res.json(data);
});

export default router;
