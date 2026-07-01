import app from '../server/index.js';

export default function handler(req, res) {
  const contentType = req.headers['content-type'];
  const contentLength = req.headers['content-length'];
  const hasBody = 'body' in req;
  const bodyType = hasBody ? typeof req.body : 'N/A';
  const bodyIs = hasBody ? JSON.stringify(req.body).substring(0, 200) : 'N/A';
  const hasRawBody = 'rawBody' in req;
  const keys = Object.keys(req).join(', ');
  
  res.status(200).json({
    method: req.method,
    url: req.url,
    contentType,
    contentLength,
    hasBody,
    bodyType,
    bodyIs,
    hasRawBody,
    keys,
    msg: 'diagnostic, not using app'
  });
}
