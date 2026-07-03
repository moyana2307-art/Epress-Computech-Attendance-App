import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/stats', async (_req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const total_employees = (await db.prepare('SELECT COUNT(*) as count FROM employees').get()).count;

  const present_today = (await db.prepare(
    "SELECT COUNT(*) as count FROM attendance WHERE date = $1 AND status = 'Present'"
  ).get(today)).count;

  const late_today = (await db.prepare(
    "SELECT COUNT(*) as count FROM attendance WHERE date = $1 AND status = 'Late'"
  ).get(today)).count;

  const on_leave = (await db.prepare(
    "SELECT COUNT(*) as count FROM leave_requests WHERE $1 BETWEEN start_date AND end_date AND status = 'approved'"
  ).get(today)).count;

  const checked_in = (await db.prepare(
    'SELECT COUNT(*) as count FROM attendance WHERE date = $1 AND check_in IS NOT NULL'
  ).get(today)).count;

  const checked_out = (await db.prepare(
    'SELECT COUNT(*) as count FROM attendance WHERE date = $1 AND check_out IS NOT NULL'
  ).get(today)).count;

  const absent_today = Math.max(0, total_employees - checked_in - on_leave);

  const weeklyData = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const p = (await db.prepare(
      "SELECT COUNT(*) as count FROM attendance WHERE date = $1 AND status IN ('Present','Late')"
    ).get(ds)).count;
    const a = (await db.prepare(
      "SELECT COUNT(*) as count FROM attendance WHERE date = $1 AND status = 'Absent'"
    ).get(ds)).count;
    weeklyData.push({ day: dayName, present: p, absent: a || Math.max(0, total_employees - p) });
  }

  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const p = (await db.prepare(
      "SELECT COUNT(*) as count FROM attendance WHERE date LIKE $1 AND status IN ('Present','Late')"
    ).get(`${monthStr}%`)).count;
    const a = daysInMonth * total_employees - p;
    monthlyData.push({ month: monthName, present: p, absent: Math.max(0, a) });
  }

  const attendance_percentage = checked_in > 0
    ? Math.round(((present_today + late_today) / Math.max(total_employees, 1)) * 100)
    : 0;

  const department_attendance = await db.prepare(`
    SELECT d.name as department,
      COALESCE((SELECT COUNT(*) FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE e.department = d.name AND a.date = $1 AND a.check_in IS NOT NULL), 0) as present,
      COALESCE((SELECT COUNT(*) FROM employees e WHERE e.department = d.name), 0) as total
    FROM departments d
  `).all(today);

  res.json({
    total_employees,
    present_today,
    absent_today,
    on_leave,
    late_arrivals: late_today,
    checked_in,
    checked_out,
    attendance_percentage: `${attendance_percentage}%`,
    weekly_trend: weeklyData,
    monthly_summary: monthlyData,
    department_attendance,
  });
});

export default router;
