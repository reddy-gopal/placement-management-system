/**
 * LOCAL DEVELOPMENT ONLY — prints a signed JWT so the student profile
 * page can be exercised before the auth/login module (M1) lands.
 *
 * Usage: npm run dev:token -- [userId] [role]
 */
require('dotenv').config();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

if (process.env.NODE_ENV === 'production') {
  console.error('dev:token is disabled in production.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set in server/.env');
  process.exit(1);
}

const userId = process.argv[2] || crypto.randomBytes(12).toString('hex');
const role = process.argv[3] || 'STUDENT';
const token = jwt.sign({ id: userId, role, email: 'dev.student@example.com' }, process.env.JWT_SECRET, {
  expiresIn: '7d',
});

console.log(`userId: ${userId}\nrole:   ${role}\n\nIn the browser console on the client run:\n`);
console.log(`localStorage.setItem('nexstep_token', '${token}')`);
