import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'attendance.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'employee',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    department TEXT DEFAULT 'General',
    position TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    shift_id INTEGER,
    responsibilities TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    shift_id INTEGER,
    date TEXT NOT NULL,
    check_in TEXT,
    check_out TEXT,
    status TEXT DEFAULT 'Present',
    late_minutes INTEGER DEFAULT 0,
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (shift_id) REFERENCES shifts(id),
    UNIQUE(employee_id, date)
  );

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    head TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    employee_name TEXT NOT NULL,
    type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    description TEXT DEFAULT '',
    responsibilities TEXT DEFAULT '',
    department TEXT DEFAULT 'General',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS business_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opening_time TEXT NOT NULL DEFAULT '08:00',
    closing_time TEXT NOT NULL DEFAULT '20:15',
    grace_period_minutes INTEGER NOT NULL DEFAULT 10,
    early_checkin_minutes INTEGER NOT NULL DEFAULT 15,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shift_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id INTEGER,
    employee_id INTEGER,
    action TEXT NOT NULL,
    logged_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (shift_id) REFERENCES shifts(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS business_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER NOT NULL UNIQUE,
    opening_time TEXT NOT NULL DEFAULT '08:00',
    closing_time TEXT NOT NULL DEFAULT '20:15'
  );

  CREATE TABLE IF NOT EXISTS employee_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    day_of_week INTEGER,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'General',
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS otp_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );
`);

// Seed default admin
const admin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@epress.com');
if (!admin) {
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Admin User', 'admin@epress.com', 'admin123', 'admin'
  );
}

// Seed departments
const depts = ['Printing', 'EcoCash', 'Customer Service'];
for (const dept of depts) {
  if (!db.prepare('SELECT id FROM departments WHERE name = ?').get(dept)) {
    db.prepare('INSERT INTO departments (name) VALUES (?)').run(dept);
  }
}

// Seed shifts
if (!db.prepare("SELECT id FROM shifts WHERE name = 'Morning Shift'").get()) {
  db.prepare(
    'INSERT INTO shifts (name, start_time, end_time, description, responsibilities, department) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('Morning Block', '08:00', '17:00', 'Morning shift: Printing + EcoCash', 'Printing Services, EcoCash Transactions', 'Printing');
}
if (!db.prepare("SELECT id FROM shifts WHERE name = 'Evening Shift'").get()) {
  db.prepare(
    'INSERT INTO shifts (name, start_time, end_time, description, responsibilities, department) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('Evening Block', '17:00', '20:15', 'Evening shift: Printing only', 'Printing Services', 'Printing');
}
if (!db.prepare("SELECT id FROM shifts WHERE name = 'EcoCash Block'").get()) {
  db.prepare(
    'INSERT INTO shifts (name, start_time, end_time, description, responsibilities, department) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('EcoCash Block', '17:00', '20:15', 'EcoCash only (Acquiline moves from Printing)', 'EcoCash Transactions', 'EcoCash');
}
if (!db.prepare("SELECT id FROM shifts WHERE name = 'Sat Morning'").get()) {
  db.prepare(
    'INSERT INTO shifts (name, start_time, end_time, description, responsibilities, department) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('Sat Morning', '08:00', '13:30', 'Saturday morning: Printing + EcoCash', 'Printing Services, EcoCash Transactions', 'Printing');
}
if (!db.prepare("SELECT id FROM shifts WHERE name = 'Sat Evening'").get()) {
  db.prepare(
    'INSERT INTO shifts (name, start_time, end_time, description, responsibilities, department) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('Sat Evening', '13:30', '20:15', 'Saturday afternoon: Printing only', 'Printing Services', 'Printing');
}
if (!db.prepare("SELECT id FROM shifts WHERE name = 'Sunday Shift'").get()) {
  db.prepare(
    'INSERT INTO shifts (name, start_time, end_time, description, responsibilities, department) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('Sunday Shift', '14:00', '20:15', 'Sunday: Printing only', 'Printing Services', 'Printing');
}

// Seed users
if (!db.prepare("SELECT id FROM users WHERE name = 'Acquiline'").get()) {
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Acquiline', 'acquiline@epress.com', 'acquiline123', 'employee'
  );
}
if (!db.prepare("SELECT id FROM users WHERE name = 'Pride'").get()) {
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Pride', 'pride@epress.com', 'pride123', 'employee'
  );
}

// Seed employees
if (!db.prepare("SELECT id FROM employees WHERE name = 'Acquiline'").get()) {
  db.prepare(
    'INSERT INTO employees (name, email, department, position, status, responsibilities) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('Acquiline', 'acquiline@epress.com', 'Printing', 'Senior Attendant', 'active', 'Printing Services, EcoCash Transactions');
}
if (!db.prepare("SELECT id FROM employees WHERE name = 'Pride'").get()) {
  db.prepare(
    'INSERT INTO employees (name, email, department, position, status, responsibilities) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('Pride', 'pride@epress.com', 'Printing', 'Attendant', 'active', 'Printing Services only');
}

// Seed business_hours (day_of_week: 0=Sun, 1=Mon, ..., 6=Sat)
const bh = db.prepare('SELECT id FROM business_hours WHERE day_of_week = ?');
const hoursData = [
  [0, '14:00', '20:15'], // Sunday
  [1, '08:00', '20:15'], // Monday
  [2, '08:00', '20:15'], // Tuesday
  [3, '08:00', '20:15'], // Wednesday
  [4, '08:00', '20:15'], // Thursday
  [5, '08:00', '20:15'], // Friday
  [6, '08:00', '20:15'], // Saturday
];
for (const [dow, open, close] of hoursData) {
  if (!bh.get(dow)) {
    db.prepare('INSERT INTO business_hours (day_of_week, opening_time, closing_time) VALUES (?, ?, ?)').run(dow, open, close);
  }
}

// Seed employee_schedules
const acquiline = db.prepare("SELECT id FROM employees WHERE name = 'Acquiline'").get();
const pride = db.prepare("SELECT id FROM employees WHERE name = 'Pride'").get();
const es = db.prepare('SELECT id FROM employee_schedules');

if (acquiline && es.get({ employee_id: acquiline.id }) === undefined) {
  const ins = db.prepare('INSERT INTO employee_schedules (employee_id, day_of_week, start_time, end_time, department) VALUES (?, ?, ?, ?, ?)');
  // Weekdays (1-5): 08:00-17:00 Printing, 17:00-close EcoCash
  for (let d = 1; d <= 5; d++) {
    ins.run(acquiline.id, d, '08:00', '17:00', 'Printing');
    ins.run(acquiline.id, d, '17:00', '20:15', 'EcoCash');
  }
  // Saturday: 08:00-13:30 Printing
  ins.run(acquiline.id, 6, '08:00', '13:30', 'Printing');
  // Sunday: off
}

if (pride && es.get({ employee_id: pride.id }) === undefined) {
  const ins = db.prepare('INSERT INTO employee_schedules (employee_id, day_of_week, start_time, end_time, department) VALUES (?, ?, ?, ?, ?)');
  // Weekdays: 17:00-close Printing
  for (let d = 1; d <= 5; d++) {
    ins.run(pride.id, d, '17:00', '20:15', 'Printing');
  }
  // Saturday: 13:30-close Printing
  ins.run(pride.id, 6, '13:30', '20:15', 'Printing');
  // Sunday: 14:00-close Printing
  ins.run(pride.id, 0, '14:00', '20:15', 'Printing');
}

// Seed default business_settings
if (!db.prepare('SELECT id FROM business_settings WHERE id = 1').get()) {
  db.prepare(
    'INSERT INTO business_settings (id, opening_time, closing_time, grace_period_minutes, early_checkin_minutes) VALUES (?, ?, ?, ?, ?)'
  ).run(1, '08:00', '20:15', 10, 15);
}

export default db;
