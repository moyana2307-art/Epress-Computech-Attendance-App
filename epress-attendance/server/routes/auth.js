import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await db.prepare('SELECT * FROM users WHERE email = $1').get(email);
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

router.post('/register', async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    await db.prepare('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)').run(
      name, email, password, 'employee'
    );
    await db.prepare('INSERT INTO employees (name, email, department) VALUES ($1, $2, $3)').run(
      name, email, department || 'General'
    );
    res.status(201).json({ message: 'Registration successful.' });
  } catch (err) {
    if (err.message?.includes('unique') || err.code === '23505') {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    throw err;
  }
});

router.post('/upload-avatar', async (req, res) => {
  const { userId, avatar } = req.body;
  if (!userId || !avatar) {
    return res.status(400).json({ message: 'User ID and avatar data are required.' });
  }

  await db.prepare('UPDATE users SET avatar = $1 WHERE id = $2').run(avatar, userId);
  res.json({ message: 'Avatar updated successfully.', avatar });
});

export default router;
