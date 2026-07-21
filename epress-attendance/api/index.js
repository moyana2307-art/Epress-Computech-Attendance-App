import app from '../server/index.js';
import { initPromise } from '../server/db.js';

export default async function handler(req, res) {
  try {
    await initPromise;
    await app(req, res);
  } catch (err) {
    console.error('Serverless error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
