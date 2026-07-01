import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const settings = db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
  if (!settings) {
    return res.status(404).json({ message: 'Business settings not found.' });
  }
  res.json(settings);
});

router.put('/', (req, res) => {
  const { opening_time, closing_time, grace_period_minutes, early_checkin_minutes } = req.body;
  const existing = db.prepare('SELECT id FROM business_settings WHERE id = 1').get();
  if (!existing) {
    return res.status(404).json({ message: 'Business settings not found. Reinitialize database.' });
  }
  db.prepare(
    'UPDATE business_settings SET opening_time = ?, closing_time = ?, grace_period_minutes = ?, early_checkin_minutes = ? WHERE id = 1'
  ).run(
    opening_time || '08:00',
    closing_time || '20:15',
    grace_period_minutes ?? 10,
    early_checkin_minutes ?? 15
  );
  const updated = db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
  res.json(updated);
});

export default router;
