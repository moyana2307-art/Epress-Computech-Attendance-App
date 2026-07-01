import db from './db.js';

export function nowHHMM() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function getDayOfWeek() {
  return new Date().getDay();
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function isBusinessOpen(currentTime) {
  const dow = getDayOfWeek();
  const hours = db.prepare('SELECT * FROM business_hours WHERE day_of_week = ?').get(dow);
  if (!hours) return { open: false, hours: null };
  const now = timeToMinutes(currentTime);
  const open = timeToMinutes(hours.opening_time);
  const close = timeToMinutes(hours.closing_time);
  return {
    open: now >= open && now < close,
    hours: { opening_time: hours.opening_time, closing_time: hours.closing_time },
  };
}

export function getActiveSchedules() {
  const dow = getDayOfWeek();
  const currentTime = nowHHMM();
  const now = timeToMinutes(currentTime);
  const all = db.prepare(`
    SELECT es.*, e.name as employee_name, e.email
    FROM employee_schedules es
    JOIN employees e ON es.employee_id = e.id
    WHERE (es.day_of_week = ? OR es.day_of_week IS NULL)
    AND e.status = 'active'
    ORDER BY es.start_time ASC
  `).all(dow);

  return all.filter(s => {
    const start = timeToMinutes(s.start_time);
    const end = timeToMinutes(s.end_time);
    return now >= start && now < end;
  });
}

export function getActiveEmployees() {
  const active = getActiveSchedules();
  const seen = new Set();
  const result = [];
  for (const s of active) {
    if (!seen.has(s.employee_id)) {
      seen.add(s.employee_id);
      result.push({
        id: s.employee_id,
        name: s.employee_name,
        email: s.email,
      });
    }
  }
  return result;
}

export function getDepartmentAssignments() {
  const active = getActiveSchedules();
  const map = {};
  for (const s of active) {
    const dept = s.department;
    if (!map[dept]) {
      map[dept] = {
        department: dept,
        employee_id: s.employee_id,
        employee_name: s.employee_name,
        start_time: s.start_time,
        end_time: s.end_time,
      };
    }
  }
  return Object.values(map);
}

export function getEmployeeSchedule(employeeId) {
  const dow = getDayOfWeek();
  const currentTime = nowHHMM();
  const now = timeToMinutes(currentTime);
  return db.prepare(`
    SELECT * FROM employee_schedules
    WHERE employee_id = ? AND (day_of_week = ? OR day_of_week IS NULL)
    ORDER BY start_time ASC
  `).all(employeeId, dow).find(s => {
    const start = timeToMinutes(s.start_time);
    const end = timeToMinutes(s.end_time);
    return now >= start && now < end;
  }) || null;
}

export function canCheckIn(employeeId, currentTime, settings) {
  const dow = getDayOfWeek();
  const now = timeToMinutes(currentTime);
  const all = db.prepare(`
    SELECT * FROM employee_schedules
    WHERE employee_id = ? AND (day_of_week = ? OR day_of_week IS NULL)
    ORDER BY start_time ASC
  `).all(employeeId, dow);

  const activeSchedule = all.find(s => {
    const start = timeToMinutes(s.start_time);
    const end = timeToMinutes(s.end_time);
    return now >= start && now < end;
  });

  if (!activeSchedule) {
    const nextSchedule = all.find(s => timeToMinutes(s.start_time) > now);
    if (nextSchedule) {
      const start = timeToMinutes(nextSchedule.start_time);
      const earliest = start - (settings?.early_checkin_minutes || 15);
      if (now >= earliest && now < start) {
        return { available: true, schedule: nextSchedule, isLate: false, lateMinutes: 0 };
      }
      if (now < earliest) {
        return { available: false, reason: `Your shift starts at ${nextSchedule.start_time}`, schedule: null };
      }
    }
    return { available: false, reason: 'No active schedule at this time', schedule: null };
  }

  const start = timeToMinutes(activeSchedule.start_time);
  const grace = settings?.grace_period_minutes || 10;
  const early = settings?.early_checkin_minutes || 15;
  const earliest = start - early;
  const latest = start + grace;

  if (now < earliest) {
    return { available: false, reason: `Check-in opens at ${activeSchedule.start_time}`, schedule: activeSchedule };
  }
  if (now > latest) {
    return { available: false, reason: 'Check-in window closed (grace period expired)', schedule: activeSchedule, isLate: true };
  }

  const isLate = now > start;
  return { available: true, schedule: activeSchedule, isLate, lateMinutes: isLate ? now - start : 0 };
}

export function canCheckOut(employeeId, currentTime, settings) {
  const schedule = getEmployeeSchedule(employeeId);
  if (!schedule) return { available: false, reason: 'No active schedule' };

  const now = timeToMinutes(currentTime);
  const end = timeToMinutes(schedule.end_time);
  const earlyOut = 15;
  const earliest = end - earlyOut;

  if (now < earliest) {
    return { available: false, reason: `Check-out available from ${schedule.end_time}` };
  }

  return { available: true, schedule };
}

export function handleAutoCheckout() {
  const currentTime = nowHHMM();
  const now = timeToMinutes(currentTime);
  const today = todayStr();
  const employees = db.prepare("SELECT id, name FROM employees WHERE status = 'active'").all();

  for (const emp of employees) {
    const schedules = db.prepare(`
      SELECT * FROM employee_schedules
      WHERE employee_id = ? AND (day_of_week = ? OR day_of_week IS NULL)
      ORDER BY end_time DESC
    `).all(emp.id, getDayOfWeek());

    for (const s of schedules) {
      const end = timeToMinutes(s.end_time);
      if (now >= end && now < end + 5) {
        const att = db.prepare(
          'SELECT * FROM attendance WHERE employee_id = ? AND date = ?'
        ).get(emp.id, today);
        if (att && !att.check_out) {
          db.prepare('UPDATE attendance SET check_out = ? WHERE id = ?').run(s.end_time, att.id);
          db.prepare(
            'INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)'
          ).run(
            'Auto Check-Out',
            `${emp.name} auto checked-out at ${s.end_time} (${s.department})`,
            'info'
          );
        }
      }
    }
  }
}
