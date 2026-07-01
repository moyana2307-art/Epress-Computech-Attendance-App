import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const notifs = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all();
  res.json(notifs);
});

router.put('/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Marked as read.' });
});

router.put('/read-all', (_req, res) => {
  db.prepare('UPDATE notifications SET read = 1').run();
  res.json({ message: 'All marked as read.' });
});

export default router;
