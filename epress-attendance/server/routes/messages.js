import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { since } = req.query;
  let query = 'SELECT * FROM messages';
  const params = [];
  if (since) {
    query += ' WHERE id > ?';
    params.push(Number(since));
  }
  query += ' ORDER BY created_at ASC LIMIT 100';
  const messages = db.prepare(query).all(...params);
  res.json(messages);
});

router.post('/', (req, res) => {
  const { sender_id, sender_name, message } = req.body;
  if (!sender_id || !sender_name || !message || !message.trim()) {
    return res.status(400).json({ message: 'sender_id, sender_name, and message are required.' });
  }

  const result = db.prepare(
    'INSERT INTO messages (sender_id, sender_name, message) VALUES (?, ?, ?)'
  ).run(sender_id, sender_name, message.trim());

  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(msg);
});

export default router;
