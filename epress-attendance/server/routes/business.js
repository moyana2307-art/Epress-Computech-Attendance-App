import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const settings = await db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
  if (!settings) {
    return res.status(404).json({ message: 'Business settings not found.' });
  }
  res.json(settings);
});

router.put('/', async (req, res) => {
  const { opening_time, closing_time, grace_period_minutes, early_checkin_minutes } = req.body;
  const existing = await db.prepare('SELECT id FROM business_settings WHERE id = 1').get();
  if (!existing) {
    return res.status(404).json({ message: 'Business settings not found. Reinitialize database.' });
  }
  await db.prepare(
    'UPDATE business_settings SET opening_time = $1, closing_time = $2, grace_period_minutes = $3, early_checkin_minutes = $4 WHERE id = 1'
  ).run(
    opening_time || '08:00',
    closing_time || '20:15',
    grace_period_minutes ?? 10,
    early_checkin_minutes ?? 15
  );
  const updated = await db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
  res.json(updated);
});

export default router;
