import app from '../server/index.js';

export default function handler(req, res) {
  try {
    const buf = req.read();
    const raw = buf ? (Buffer.isBuffer(buf) ? buf.toString() : String(buf)) : '';
    if (raw) req.body = JSON.parse(raw);
    else req.body = {};
  } catch { req.body = {}; }
  return app(req, res);
}
