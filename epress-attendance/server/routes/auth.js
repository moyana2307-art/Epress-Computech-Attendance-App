import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  res.json({
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
    },
  });
});

router.post('/register', (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      name, email, password, 'employee'
    );
    // Also add to employees table
    db.prepare('INSERT INTO employees (name, email, department) VALUES (?, ?, ?)').run(
      name, email, department || 'General'
    );
    res.status(201).json({ message: 'Registration successful.' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    throw err;
  }
});

router.post('/upload-avatar', (req, res) => {
  const { userId, avatar } = req.body;
  if (!userId || !avatar) {
    return res.status(400).json({ message: 'User ID and avatar data are required.' });
  }

  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, userId);
  res.json({ message: 'Avatar updated successfully.', avatar });
});

export default router;
