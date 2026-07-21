import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { asyncHandler } from '../asyncHandler.js';
import { signToken, requireAuth, requireAdmin } from '../middleware.js';

const router = Router();

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await db.prepare('SELECT * FROM users WHERE email = $1').get(email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = signToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
    },
  });
}));

router.post('/register', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  const hash = await bcrypt.hash(password, 12);

  try {
    await db.prepare('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)').run(
      name, email, hash, 'employee'
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
}));

router.post('/upload-avatar', requireAuth, asyncHandler(async (req, res) => {
  const { avatar } = req.body;
  if (!avatar) {
    return res.status(400).json({ message: 'Avatar data is required.' });
  }

  if (typeof avatar !== 'string' || avatar.length > 100000) {
    return res.status(400).json({ message: 'Invalid avatar data.' });
  }

  await db.prepare('UPDATE users SET avatar = $1 WHERE id = $2').run(avatar, req.user.id);
  res.json({ message: 'Avatar updated successfully.', avatar });
}));

export default router;
