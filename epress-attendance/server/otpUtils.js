import db from './db.js';

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function requestOTP(employee) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await db.prepare(
    'INSERT INTO otp_codes (employee_id, email, code, expires_at) VALUES ($1, $2, $3, $4)'
  ).run(employee.id, employee.email, code, expiresAt);

  console.log(`\n========== OTP for ${employee.name} ==========`);
  console.log(`Email: ${employee.email}`);
  console.log(`OTP Code: ${code}`);
  console.log(`Expires: ${expiresAt}`);
  console.log(`==============================================\n`);

  return { message: `OTP sent to ${employee.email}`, expiresIn: 300 };
}

export async function verifyOTP(employeeId, code) {
  const now = new Date().toISOString();
  const record = await db.prepare(`
    SELECT * FROM otp_codes
    WHERE employee_id = $1 AND code = $2 AND used = 0 AND expires_at > $3
    ORDER BY created_at DESC LIMIT 1
  `).get(employeeId, code, now);

  if (!record) {
    const expired = await db.prepare(`
      SELECT id FROM otp_codes
      WHERE employee_id = $1 AND code = $2 AND used = 0
    `).get(employeeId, code);
    if (expired) {
      return { valid: false, reason: 'OTP has expired. Request a new one.' };
    }
    return { valid: false, reason: 'Invalid OTP code.' };
  }

  await db.prepare('UPDATE otp_codes SET used = 1 WHERE id = $1').run(record.id);
  return { valid: true };
}

export async function cleanupExpiredOTPs() {
  await db.prepare("DELETE FROM otp_codes WHERE expires_at < NOW()").run();
}
