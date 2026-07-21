# Security Changes Documentation

## Overview

This document covers all security fixes applied to the Epress Attendance application to address vulnerabilities identified during a full security audit.

---

## Critical Fixes

### 1. Password Hashing (bcrypt)

**Before:** Passwords stored and compared as plaintext (`admin123`, `acquiline123`, `pride123`).

**After:** All passwords are hashed with bcrypt (12 rounds) before storage. Login uses `bcrypt.compare()` for verification.

**Files changed:**
- `server/routes/auth.js` — Login uses `bcrypt.compare()`, register hashes with `bcrypt.hash(password, 12)`
- `server/routes/employees.js` — Employee creation hashes the password
- `server/db.js` — Seed data passwords are now hashed during initialization

**Migration required:** Existing plaintext passwords in the database must be re-hashed. Drop the `users` table and re-run, or manually update with a one-time script.

### 2. JWT Authentication

**Before:** Token was `'mock-jwt-token-' + Date.now()` — predictable and never verified. No middleware checked tokens.

**After:** Real JWT tokens (24h expiry) signed with `JWT_SECRET`. All API endpoints require a valid `Bearer` token in the `Authorization` header.

**Files changed:**
- `server/middleware.js` — New file with `signToken()`, `requireAuth`, `requireAdmin`
- `server/index.js` — All routes wrapped with `requireAuth`; revenue routes also require `requireAdmin`
- `src/lib/api.ts` — Sends `Authorization: Bearer <token>` on every request; auto-redirects to login on 401
- `src/contexts/AuthContext.tsx` — Stores JWT in `localStorage` under `auth_token` key

### 3. CORS Restriction

**Before:** `app.use(cors())` — any origin allowed.

**After:** Only configured origins accepted:
- `FRONTEND_URL` env var
- `https://epress-attendance.vercel.app`
- `http://localhost:5173` (dev)
- `http://localhost:5000` (dev)

**File changed:** `server/index.js`

---

## High Severity Fixes

### 4. Authorization Middleware

**Before:** Every endpoint was unauthenticated — anyone could create/delete employees, toggle attendance, modify settings.

**After:** Role-based access control:
- **Any authenticated user:** Read attendance, employees, departments, shifts, notifications, dashboard stats, business settings, messages, leave creation
- **Admin only:** Create/update/delete employees, departments, shifts, approve/reject leaves, modify business settings, view revenue data, admin check-in
- **OTP-based (no JWT):** Employee check-in via OTP, OTP request/verify

**Files changed:** `server/index.js`, `server/routes/employees.js`, `server/routes/departments.js`, `server/routes/shifts.js`, `server/routes/business.js`, `server/routes/leaves.js`, `server/routes/attendance.js`, `server/routes/auth.js`

### 5. Rate Limiting

**Before:** No rate limiting — brute-force attacks possible on login, OTP, and all endpoints.

**After:**
| Endpoint | Limit | Window |
|----------|-------|--------|
| Login / Register | 20 requests | 15 min |
| OTP Request | 10 requests | 15 min |
| OTP Verify | 5 requests | 15 min |
| All other API routes | 120 requests | 1 min |

**Files changed:** `server/middleware.js`, `server/index.js`, `server/routes/worker.js`

---

## Medium Severity Fixes

### 6. OTP Security

**Before:** Used `Math.random()` (not cryptographically secure), no brute-force protection, old OTPs not invalidated.

**After:**
- Uses `crypto.randomInt()` for cryptographically secure code generation
- Previous unused OTPs are invalidated when a new one is requested
- Brute-force protection: max 5 OTP verification attempts per 15-minute window

**File changed:** `server/otpUtils.js`

### 7. Security Headers (Helmet)

**Before:** No security headers.

**After:** Helmet middleware adds:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0`
- `Strict-Transport-Security` (in production)
- And other standard security headers

**File changed:** `server/index.js`

### 8. Error Response Sanitization

**Before:** Global error handler returned `err.message` directly — could expose stack traces, file paths, SQL errors.

**After:** Returns generic `"Internal server error"` to clients; detailed errors only logged server-side.

**File changed:** `server/index.js`

### 9. SSL Verification

**Before:** `ssl: { rejectUnauthorized: false }` in all environments.

**After:** Production uses `rejectUnauthorized: true`. Development retains `false` for local DB connections.

**File changed:** `server/db.js`

### 10. Input Validation

**Before:** No size limits on request body or fields.

**After:**
- JSON body limited to 1MB
- Avatar data limited to 100KB string length
- Registration requires minimum 8-character password

**Files changed:** `server/index.js`, `server/routes/auth.js`

---

## Low Severity Fixes

### 11. Security Headers

Helmet provides additional protections:
- `Content-Security-Policy` (disabled for PWA compatibility)
- `Cross-Origin-Embedder-Policy` (disabled for external resources)

### 12. Auth Token Lifecycle

**Before:** Token stored in localStorage but never sent to the server.

**After:** Token is:
- Sent on every API request via `Authorization` header
- Automatically cleared on 401 response
- Stored separately from user data (`auth_token` key)

**Files changed:** `src/lib/api.ts`, `src/contexts/AuthContext.tsx`

---

## New File

### `server/middleware.js`

Contains all security middleware:
- `signToken(user)` — Creates a JWT with user id, email, role
- `requireAuth` — Validates JWT from Authorization header
- `requireAdmin` — Checks `role === 'admin'` after `requireAuth`
- `authLimiter` — Rate limit for login/register (20/15min)
- `otpLimiter` — Rate limit for OTP requests (10/15min)
- `otpVerifyLimiter` — Rate limit for OTP verification (5/15min)
- `apiLimiter` — Rate limit for all API routes (120/min)

### `.env.example`

Documents required environment variables for new deployments.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing (use a strong random string) |
| `FRONTEND_URL` | No | Allowed CORS origin (defaults to Vercel URL) |
| `PORT` | No | Server port (defaults to 5000) |

---

## Migration Steps

1. Install new dependencies: `npm install bcryptjs jsonwebtoken express-rate-limit helmet`
2. Set `JWT_SECRET` in Vercel environment variables (strong random string)
3. Re-seed the database (existing passwords are plaintext):
   ```sql
   DROP TABLE IF EXISTS users CASCADE;
   -- Then restart the server to re-run init()
   ```
4. Deploy and verify login works with hashed passwords
5. Update any scripts or tools that used the old mock token

---

## Remaining Recommendations

- **Email OTP delivery:** OTPs are still logged to console. Implement email or SMS delivery for production.
- **HTTPS enforcement:** Add middleware to redirect HTTP to HTTPS in production.
- **CSP headers:** Configure Content-Security-Policy for your specific asset needs.
- **Database credentials:** Rotate the Neon database password if it was ever committed to version control.
- **Session management:** Consider adding refresh tokens for better token lifecycle management.
