import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleAutoCheckout } from './shiftUtils.js';
import { cleanupExpiredOTPs } from './otpUtils.js';

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.post('/api/debug-body', (req, res) => {
  const raw = [];
  req.on('data', chunk => raw.push(chunk));
  req.on('end', () => {
    const buf = Buffer.concat(raw);
    res.json({
      bodyType: typeof req.body,
      hasBody: !!req.body,
      isBuffer: Buffer.isBuffer(req.body),
      isSealed: Object.isSealed(req.body),
      bodyConstructor: req.body?.constructor?.name,
      rawBody: buf.toString().slice(0, 200),
      rawBodyType: typeof buf,
      rawBodyConstructor: buf.constructor.name,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
    });
  });
});

app.use(express.json());

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

app.post('/api/debug-body', (req, res) => {
  res.json({
    bodyType: typeof req.body,
    isBuffer: Buffer.isBuffer(req.body),
    isArray: Array.isArray(req.body),
    keys: req.body ? Object.keys(req.body).slice(0, 5) : [],
    bodyPreview: req.body ? JSON.stringify(req.body).slice(0, 200) : null,
    bodyConstructor: req.body?.constructor?.name,
    hasBody: !!req.body,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/worker', workerRoutes);

try {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) res.status(404).send('Not found');
    });
  });
} catch {} // static serving not available (serverless)

handleAutoCheckout();
setInterval(handleAutoCheckout, 60000);
cleanupExpiredOTPs();
setInterval(cleanupExpiredOTPs, 300000);

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Epress Computech Backend running on port ${PORT}`);
  });
}

export default app;
