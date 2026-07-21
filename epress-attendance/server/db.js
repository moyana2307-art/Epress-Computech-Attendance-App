import pkg from 'pg';
import bcrypt from 'bcryptjs';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

const db = {
  query: (text, params) => pool.query(text, params),
  prepare: (text) => ({
    get: async (...params) => {
      const { rows } = await pool.query(convert(text), params);
      return rows[0] || null;
    },
    all: async (...params) => {
      const { rows } = await pool.query(convert(text), params);
      return rows;
    },
    run: async (...params) => {
      const sql = convert(text);
      const isInsert = /^\s*INSERT\s/i.test(sql);
      const result = await pool.query(isInsert ? `${sql} RETURNING id` : sql, params);
      return { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id || null };
    },
  }),
  transaction: (fn) => async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
  close: () => pool.end(),
};

function convert(sql) {
  let idx = 0;
  return sql.replace(/\?/g, () => `$${++idx}`);
}

async function init() {
  try {
    const alreadyInit = await pool.query("SELECT id FROM business_settings WHERE id = 1");
    if (alreadyInit.rows.length > 0) {
      console.log('Database already initialized, skipping seed');
      return;
    }
  } catch {
    // Table doesn't exist yet — proceed with initialization
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'employee',
      avatar TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      head TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      description TEXT DEFAULT '',
      responsibilities TEXT DEFAULT '',
      department TEXT DEFAULT 'General',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      department TEXT DEFAULT 'General',
      position TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      shift_id INTEGER REFERENCES shifts(id),
      responsibilities TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      shift_id INTEGER REFERENCES shifts(id),
      date TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT,
      status TEXT DEFAULT 'Present',
      late_minutes INTEGER DEFAULT 0,
      note TEXT DEFAULT '',
      cash_up_amount REAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(employee_id, date)
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER,
      employee_name TEXT NOT NULL,
      type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS shift_logs (
      id SERIAL PRIMARY KEY,
      shift_id INTEGER REFERENCES shifts(id),
      employee_id INTEGER REFERENCES employees(id),
      action TEXT NOT NULL,
      logged_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS business_hours (
      id SERIAL PRIMARY KEY,
      day_of_week INTEGER NOT NULL UNIQUE,
      opening_time TEXT NOT NULL DEFAULT '08:00',
      closing_time TEXT NOT NULL DEFAULT '20:15'
    );

    CREATE TABLE IF NOT EXISTS employee_schedules (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      day_of_week INTEGER,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT 'General'
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      sender_name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS business_settings (
      id SERIAL PRIMARY KEY,
      opening_time TEXT NOT NULL DEFAULT '08:00',
      closing_time TEXT NOT NULL DEFAULT '20:15',
      grace_period_minutes INTEGER NOT NULL DEFAULT 10,
      early_checkin_minutes INTEGER NOT NULL DEFAULT 15,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Seed default admin (hashed password)
  const adminHash = await bcrypt.hash('admin123', 12);
  await pool.query(
    `INSERT INTO users (name, email, password, role)
     SELECT 'Admin User', 'admin@epressattendance.co.zw', $1, 'admin'
     WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@epressattendance.co.zw')`,
    [adminHash]
  );

  // Seed departments
  for (const name of ['Printing', 'EcoCash', 'Customer Service']) {
    await pool.query(
      'INSERT INTO departments (name) SELECT $1 WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = $1)',
      [name]
    );
  }

  // Seed shifts
  const shifts = [
    ['Morning Block', '08:00', '17:00', 'Morning shift: Printing + EcoCash', 'Printing Services, EcoCash Transactions', 'Printing'],
    ['Evening Block', '17:00', '20:15', 'Evening shift: Printing only', 'Printing Services', 'Printing'],
    ['EcoCash Block', '17:00', '20:15', 'EcoCash only (Acquiline moves from Printing)', 'EcoCash Transactions', 'EcoCash'],
    ['Sat Morning', '08:00', '13:30', 'Saturday morning: Printing + EcoCash', 'Printing Services, EcoCash Transactions', 'Printing'],
    ['Sat Evening', '13:30', '20:15', 'Saturday afternoon: Printing only', 'Printing Services', 'Printing'],
    ['Sunday Shift', '14:00', '20:15', 'Sunday: Printing only', 'Printing Services', 'Printing'],
  ];
  for (const [name, start, end, desc, resp, dept] of shifts) {
    await pool.query(
      'INSERT INTO shifts (name, start_time, end_time, description, responsibilities, department) SELECT $1,$2,$3,$4,$5,$6 WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name = $1)',
      [name, start, end, desc, resp, dept]
    );
  }

  // Seed users (hashed passwords)
  const seedUsers = [
    ['Acquiline', 'acquiline@epressattendance.co.zw', 'acquiline123', 'employee'],
    ['Pride', 'pride@epressattendance.co.zw', 'pride123', 'employee'],
  ];
  for (const [name, email, pw, role] of seedUsers) {
    const hash = await bcrypt.hash(pw, 12);
    await pool.query(
      'INSERT INTO users (name, email, password, role) SELECT $1,$2,$3,$4 WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = $2)',
      [name, email, hash, role]
    );
  }

  // Seed employees
  for (const [name, email, dept, pos, resp] of [
    ['Acquiline', 'acquiline@epressattendance.co.zw', 'Printing', 'Senior Attendant', 'Printing Services, EcoCash Transactions'],
    ['Pride', 'pride@epressattendance.co.zw', 'Printing', 'Attendant', 'Printing Services only'],
  ]) {
    await pool.query(
      'INSERT INTO employees (name, email, department, position, status, responsibilities) SELECT $1,$2,$3,$4,$5,$6 WHERE NOT EXISTS (SELECT 1 FROM employees WHERE name = $1)',
      [name, email, dept, pos, 'active', resp]
    );
  }

  // Seed business_hours
  const hours = [
    [0, '14:00', '20:15'], [1, '08:00', '20:15'], [2, '08:00', '20:15'],
    [3, '08:00', '20:15'], [4, '08:00', '20:15'], [5, '08:00', '20:15'], [6, '08:00', '20:15'],
  ];
  for (const [dow, open, close] of hours) {
    await pool.query(
      'INSERT INTO business_hours (day_of_week, opening_time, closing_time) SELECT $1,$2,$3 WHERE NOT EXISTS (SELECT 1 FROM business_hours WHERE day_of_week = $1)',
      [dow, open, close]
    );
  }

  // Seed employee_schedules
  const acq = (await pool.query("SELECT id FROM employees WHERE name = 'Acquiline'")).rows[0];
  const pride = (await pool.query("SELECT id FROM employees WHERE name = 'Pride'")).rows[0];

  if (acq) {
    const exists = await pool.query('SELECT id FROM employee_schedules WHERE employee_id = $1 LIMIT 1', [acq.id]);
    if (exists.rows.length === 0) {
      for (let d = 1; d <= 5; d++) {
        await pool.query(
          'INSERT INTO employee_schedules (employee_id, day_of_week, start_time, end_time, department) VALUES ($1,$2,$3,$4,$5)',
          [acq.id, d, '08:00', '17:00', 'Printing']
        );
        await pool.query(
          'INSERT INTO employee_schedules (employee_id, day_of_week, start_time, end_time, department) VALUES ($1,$2,$3,$4,$5)',
          [acq.id, d, '17:00', '20:15', 'EcoCash']
        );
      }
      await pool.query(
        'INSERT INTO employee_schedules (employee_id, day_of_week, start_time, end_time, department) VALUES ($1,$2,$3,$4,$5)',
        [acq.id, 6, '08:00', '13:30', 'Printing']
      );
    }
  }

  if (pride) {
    const exists = await pool.query('SELECT id FROM employee_schedules WHERE employee_id = $1 LIMIT 1', [pride.id]);
    if (exists.rows.length === 0) {
      for (let d = 1; d <= 5; d++) {
        await pool.query(
          'INSERT INTO employee_schedules (employee_id, day_of_week, start_time, end_time, department) VALUES ($1,$2,$3,$4,$5)',
          [pride.id, d, '17:00', '20:15', 'Printing']
        );
      }
      await pool.query(
        'INSERT INTO employee_schedules (employee_id, day_of_week, start_time, end_time, department) VALUES ($1,$2,$3,$4,$5)',
        [pride.id, 6, '13:30', '20:15', 'Printing']
      );
      await pool.query(
        'INSERT INTO employee_schedules (employee_id, day_of_week, start_time, end_time, department) VALUES ($1,$2,$3,$4,$5)',
        [pride.id, 0, '14:00', '20:15', 'Printing']
      );
    }
  }

  // Seed business_settings
  await pool.query(`
    INSERT INTO business_settings (id, opening_time, closing_time, grace_period_minutes, early_checkin_minutes)
    SELECT 1, '08:00', '20:15', 10, 15
    WHERE NOT EXISTS (SELECT 1 FROM business_settings WHERE id = 1)
  `);

  // Seed sample leave requests
  const leavesExist = await pool.query('SELECT id FROM leave_requests LIMIT 1');
  if (leavesExist.rows.length === 0) {
    await pool.query(
      "INSERT INTO leave_requests (employee_name, type, start_date, end_date, reason, status) VALUES ($1,$2,CURRENT_DATE - INTERVAL '5 days',CURRENT_DATE - INTERVAL '3 days',$3,$4)",
      ['Acquiline', 'sick', 'Flu symptoms', 'approved']
    );
    await pool.query(
      "INSERT INTO leave_requests (employee_name, type, start_date, end_date, reason, status) VALUES ($1,$2,CURRENT_DATE + INTERVAL '10 days',CURRENT_DATE + INTERVAL '14 days',$3,$4)",
      ['Acquiline', 'vacation', 'Family trip', 'approved']
    );
    await pool.query(
      "INSERT INTO leave_requests (employee_name, type, start_date, end_date, reason, status) VALUES ($1,$2,CURRENT_DATE - INTERVAL '2 days',CURRENT_DATE - INTERVAL '1 day',$3,$4)",
      ['Pride', 'personal', 'Personal matters', 'rejected']
    );
    await pool.query(
      "INSERT INTO leave_requests (employee_name, type, start_date, end_date, reason, status) VALUES ($1,$2,CURRENT_DATE + INTERVAL '20 days',CURRENT_DATE + INTERVAL '21 days',$3,$4)",
      ['Acquiline', 'sick', 'Medical appointment', 'pending']
    );
    await pool.query(
      "INSERT INTO leave_requests (employee_name, type, start_date, end_date, reason, status) VALUES ($1,$2,CURRENT_DATE + INTERVAL '25 days',CURRENT_DATE + INTERVAL '27 days',$3,$4)",
      ['Pride', 'vacation', 'Weekend getaway', 'pending']
    );
  }

  // Migrate plaintext passwords to bcrypt hashes
  const allUsers = await pool.query('SELECT id, password FROM users');
  let migrated = 0;
  for (const user of allUsers.rows) {
    if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      const hash = await bcrypt.hash(user.password, 12);
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, user.id]);
      migrated++;
    }
  }
  if (migrated > 0) {
    console.log(`Migrated ${migrated} plaintext password(s) to bcrypt hashes`);
  }

  console.log('Database initialized successfully');
}

const initPromise = init().catch(err => console.error('Database initialization error:', err));

export { initPromise };
export default db;
