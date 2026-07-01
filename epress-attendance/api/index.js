import app from '../server/index.js';

export default async function handler(req, res) {
  if (!req.body || typeof req.body !== 'object') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString();
      if (raw) req.body = JSON.parse(raw);
    } catch (e) {
      console.error('Body parse error:', e.message);
      req.body = req.body || {};
    }
  }
  app(req, res);
}
