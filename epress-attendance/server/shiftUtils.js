import db from './db.js';

const TZ = 'Africa/Harare';

export function nowHHMM() {
  const d = new Date();
  const opts = { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false };
  return new Intl.DateTimeFormat('en-GB', opts).format(d);
}

export function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function getDayOfWeek() {
  const dayName = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long' }).format(new Date());
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayName);
}

export function todayStr() {
  const opts = { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Intl.DateTimeFormat('en-CA', opts).format(new Date());
}

export async function isBusinessOpen(currentTime) {
  const dow = getDayOfWeek();
  const hours = await db.prepare('SELECT * FROM business_hours WHERE day_of_week = $1').get(dow);
  if (!hours) return { open: false, hours: null };
  const now = timeToMinutes(currentTime);
  const open = timeToMinutes(hours.opening_time);
  const close = timeToMinutes(hours.closing_time);
  return {
    open: now >= open && now < close,
    hours: { opening_time: hours.opening_time, closing_time: hours.closing_time },
  };
}

export async function getActiveSchedules() {
  const dow = getDayOfWeek();
  const currentTime = nowHHMM();
  const now = timeToMinutes(currentTime);
  const all = await db.prepare(`
    SELECT es.*, e.name as employee_name, e.email
    FROM employee_schedules es
    JOIN employees e ON es.employee_id = e.id
    WHERE (es.day_of_week = $1 OR es.day_of_week IS NULL)
    AND e.status = 'active'
    ORDER BY es.start_time ASC
  `).all(dow);

  return all.filter(s => {
    const start = timeToMinutes(s.start_time);
    const end = timeToMinutes(s.end_time);
    return now >= start && now < end;
  });
}

export async function getActiveEmployees() {
  const active = await getActiveSchedules();
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

export async function getDepartmentAssignments() {
  const active = await getActiveSchedules();
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

export async function getEmployeeSchedule(employeeId) {
  const dow = getDayOfWeek();
  const currentTime = nowHHMM();
  const now = timeToMinutes(currentTime);
  const schedules = await db.prepare(`
    SELECT * FROM employee_schedules
    WHERE employee_id = $1 AND (day_of_week = $2 OR day_of_week IS NULL)
    ORDER BY start_time ASC
  `).all(employeeId, dow);

  return schedules.find(s => {
    const start = timeToMinutes(s.start_time);
    const end = timeToMinutes(s.end_time);
    return now >= start && now < end;
  }) || null;
}

export async function canCheckIn(employeeId, currentTime, settings) {
  const dow = getDayOfWeek();
  const now = timeToMinutes(currentTime);
  const all = await db.prepare(`
    SELECT * FROM employee_schedules
    WHERE employee_id = $1 AND (day_of_week = $2 OR day_of_week IS NULL)
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

export async function canCheckOut(employeeId, currentTime, settings) {
  const schedule = await getEmployeeSchedule(employeeId);
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

export async function handleAutoCheckout() {
  const currentTime = nowHHMM();
  const now = timeToMinutes(currentTime);
  const today = todayStr();
  const employees = await db.prepare("SELECT id, name FROM employees WHERE status = 'active'").all();

  for (const emp of employees) {
    const schedules = await db.prepare(`
      SELECT * FROM employee_schedules
      WHERE employee_id = $1 AND (day_of_week = $2 OR day_of_week IS NULL)
      ORDER BY end_time DESC
    `).all(emp.id, getDayOfWeek());

    for (const s of schedules) {
      const end = timeToMinutes(s.end_time);
      if (now >= end && now < end + 5) {
        const att = await db.prepare(
          'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2'
        ).get(emp.id, today);
        if (att && !att.check_out) {
          await db.prepare('UPDATE attendance SET check_out = $1 WHERE id = $2').run(s.end_time, att.id);
          await db.prepare(
            'INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)'
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
