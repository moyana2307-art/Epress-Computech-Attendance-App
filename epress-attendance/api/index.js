import app from '../server/index.js';

export default async function handler(req, res) {
  try {
    let raw = '';
    for await (const chunk of req) {
      raw += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString();
    }
    if (raw) {
      try { req.body = JSON.parse(raw); } catch { req.body = { _raw: raw }; }
    } else {
      req.body = { _note: 'empty body' };
    }
  } catch (e) {
    req.body = { _error: e.message };
  }
  return app(req, res);
}
