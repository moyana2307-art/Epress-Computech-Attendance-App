import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleAutoCheckout } from './shiftUtils.js';
import { cleanupExpiredOTPs } from './otpUtils.js';
import { requireAuth, requireAdmin, apiLimiter } from './middleware.js';

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'https://epress-attendance.vercel.app',
  'http://localhost:5173',
  'http://localhost:5000',
].filter(Boolean);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : false,
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

import authRoutes from './routes/auth.js';
import attendanceRoutes from './routes/attendance.js';
import employeeRoutes from './routes/employees.js';
import departmentRoutes from './routes/departments.js';
import leaveRoutes from './routes/leaves.js';
import notificationRoutes from './routes/notifications.js';
import shiftRoutes from './routes/shifts.js';
import dashboardRoutes from './routes/dashboard.js';
import businessRoutes from './routes/business.js';
import workerRoutes from './routes/worker.js';
import messageRoutes from './routes/messages.js';
import revenueRoutes from './routes/revenue.js';

app.use('/api/auth', authRoutes);
app.use('/api/attendance', apiLimiter, requireAuth, attendanceRoutes);
app.use('/api/employees', apiLimiter, requireAuth, employeeRoutes);
app.use('/api/departments', apiLimiter, requireAuth, departmentRoutes);
app.use('/api/leaves', apiLimiter, requireAuth, leaveRoutes);
app.use('/api/notifications', apiLimiter, requireAuth, notificationRoutes);
app.use('/api/shifts', apiLimiter, requireAuth, shiftRoutes);
app.use('/api/dashboard', apiLimiter, requireAuth, dashboardRoutes);
app.use('/api/business', apiLimiter, requireAuth, businessRoutes);
app.use('/api/messages', apiLimiter, requireAuth, messageRoutes);
app.use('/api/revenue', apiLimiter, requireAuth, requireAdmin, revenueRoutes);
app.use('/api/worker', apiLimiter, workerRoutes);

try {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) res.status(404).send('Not found');
    });
  });
} catch { /* static serving not available (serverless) */ }

handleAutoCheckout().catch(() => {});
setInterval(() => { handleAutoCheckout().catch(() => {}); }, 60000);
cleanupExpiredOTPs().catch(() => {});
setInterval(() => { cleanupExpiredOTPs().catch(() => {}); }, 300000);

app.use((err, _req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(err?.status || err?.statusCode || 500);
  res.json({ error: 'Internal server error' });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Epress Computech Backend running on port ${PORT}`);
  });
}

export default app;
