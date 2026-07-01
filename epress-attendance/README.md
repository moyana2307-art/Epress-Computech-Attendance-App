# Epress Attendance

A premium, role-based employee attendance management SaaS platform for Epress Computech — a Printing & EcoCash business. Built with React 19 + TypeScript + Tailwind CSS v4 frontend and Express + SQLite backend.

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Framer Motion, Recharts, Lucide React Icons, Radix UI Primitives
- **Backend:** Express 5, better-sqlite3
- **Build:** Vite 8 with @tailwindcss/vite, `@` path alias
- **Auth:** Basic email/password, OTP-based check-in (6-digit code, 5-min expiry)

## Features

- **Role-Based Dashboards** — Workers get personalized check-in/out + shift timer; admins get full CRUD + business settings + oversight
- **OTP Secure Check-In** — Request a 6-digit code, verify to clock in. Codes expire in 5 minutes with resend support
- **Complex Schedules** — Day-specific employee schedules with department switching (e.g. Acquiline moves from Printing to EcoCash at 17:00)
- **Day-Aware Business Hours** — Different hours per day of week (weekdays 08:00–20:15, Saturday 08:00–20:15, Sunday 14:00–20:15)
- **Grace & Early Windows** — 15-min early check-in window, 10-min grace period after shift start
- **Auto Check-Out** — Automatically clocks out employees when their schedule ends
- **Department Rotation** — Shift handover at 17:00, department reassignment tracked in real-time
- **Live Updates** — Dashboard auto-refreshes every 30 seconds
- **Glassmorphism UI** — White sidebar, gradient hero banners, soft shadows, micro-interactions

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
cd epress-attendance
npm install
```

### Run

Start both backend (port 5000) and frontend (port 5173) concurrently:

```bash
npm run dev
```

Or start them separately:

```bash
npm run dev:server    # Backend on :5000
npm run dev:frontend  # Frontend on :5173
```

The Vite dev server proxies `/api` requests to the backend.

Open **http://localhost:5173** in your browser.

## Demo Accounts

| Role     | Email                   | Password    |
| -------- | ----------------------- | ----------- |
| Admin    | admin@epress.com        | admin123    |
| Employee | acquiline@epress.com    | acquiline123 |
| Employee | pride@epress.com        | pride123    |

> **Note:** OTP codes are logged to the server console (no email server configured).

## Employees & Schedules

### Acquiline
- **Weekdays:** 08:00–17:00 (Printing) → 17:00–20:15 (EcoCash)
- **Saturday:** 08:00–13:30 (Printing)
- **Sunday:** Off

### Pride
- **Weekdays:** 17:00–20:15 (Printing)
- **Saturday:** 13:30–20:15 (Printing)
- **Sunday:** 14:00–20:15 (Printing)

## Business Hours

| Day      | Hours            |
| -------- | ---------------- |
| Weekdays | 08:00 – 20:15    |
| Saturday | 08:00 – 20:15    |
| Sunday   | 14:00 – 20:15    |

## API Endpoints

| Endpoint                     | Method | Description                  |
| ---------------------------- | ------ | ---------------------------- |
| `/api/auth/login`            | POST   | Login                        |
| `/api/employee/list`         | GET    | List employees               |
| `/api/shifts/list`           | GET    | List shifts                  |
| `/api/business/get`          | GET    | Get business settings        |
| `/api/business/update`       | POST   | Update business settings     |
| `/api/worker/dashboard`      | GET    | Worker dashboard data        |
| `/api/worker/request-otp`    | POST   | Request OTP code             |
| `/api/worker/verify-otp`     | POST   | Verify OTP + check in        |
| `/api/worker/checkout`       | POST   | Check out                    |

## Project Structure

```
epress-attendance/
├── index.html
├── vite.config.ts          # Vite + Tailwind + proxy config
├── package.json
├── server/
│   ├── index.js            # Express entry point
│   ├── db.js               # SQLite schema + seeds
│   ├── shiftUtils.js       # Business hours, schedules, check-in/out logic
│   ├── otpUtils.js         # OTP generation + verification
│   └── routes/
│       ├── auth.js
│       ├── employees.js
│       ├── shifts.js
│       ├── business.js
│       ├── worker.js       # Dashboard + OTP check-in/out
│       ├── attendance.js
│       ├── departments.js
│       ├── leaves.js
│       └── notifications.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css           # Tailwind v4 @theme + glassmorphism
    ├── pages/
    │   ├── Login.tsx
    │   ├── WorkerDashboard.tsx
    │   └── AdminDashboard.tsx
    ├── components/
    │   ├── layout/         # Sidebar, Topbar
    │   ├── ui/             # Button, Card, Input, Badge, Modal, etc.
    │   ├── shared/         # StatsCard, DataTable, LoadingSkeleton
    │   └── charts/
    ├── contexts/
    │   ├── AuthContext.tsx
    │   └── ThemeContext.tsx
    └── lib/
        ├── api.ts          # API client
        ├── types.ts        # TypeScript interfaces
        └── utils.ts        # cn(), formatDate(), getGreeting(), etc.
```

## Database

The SQLite database (`server/attendance.db`) is auto-created on first run with full schema and seed data. Delete the file to reset.

Key tables:
- `employees` — Employee profiles
- `users` — Login accounts
- `attendance` — Daily check-in/out records
- `shifts` — Named shift templates
- `employee_schedules` — Day-specific time + department blocks
- `business_hours` — Per-day operating hours
- `otp_codes` — 6-digit verification codes with expiry
- `business_settings` — Grace period, early check-in window
- `departments` — Department list
- `leave_requests` — Leave applications
- `notifications` — System notifications

## Color Palette

| Token        | Color    | Hex       |
| ------------ | -------- | --------- |
| Primary      | Navy     | `#10367D` |
| Secondary    | Sky Blue | `#74B4D9` |
| Background   | Light    | `#EBEBEB` |
| Card/Surface | White    | `#FFFFFF` |
| Success      | Green    | `#22C55E` |
| Warning      | Amber    | `#F59E0B` |
| Danger       | Red      | `#EF4444` |

## Design System

- **Fonts:** Inter (body), Poppins (headings) — Google Fonts
- **Glassmorphism:** `backdrop-blur-sm bg-white/10` on overlays
- **Border radius:** `rounded-xl` (12px) as default card radius
- **Shadows:** Soft `shadow-sm` / `shadow-md`
- **Icons:** Lucide React

## License

Private — Epress Computech
