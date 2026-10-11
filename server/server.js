require('dotenv').config();
const connectDB = require('./config/db');
const createApp = require('./app');
const { devUser } = require('./middleware/auth');

function start() {
  if (process.env.AUTH_DISABLED === 'true') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_DISABLED=true is not allowed in production. Remove it from the environment.');
    }
    console.warn(`⚠ Authentication is DISABLED (dev mode) — all requests act as student ${devUser().id}.`);
  } else if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set. Copy server/.env.example to server/.env and configure it.');
  }

  // Listen immediately so the client never sees "connection refused" while MongoDB is
  // still connecting; Mongoose buffers queries until the connection is ready.
  const port = process.env.PORT || 4000;
  const server = createApp().listen(port, () => {
    console.log(`NexStep API listening on http://localhost:${port}/api/v1`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${port} is already in use — another NexStep server (an older "npm run dev") is probably still running. ` +
          'Stop it (close that terminal or press Ctrl+C there) and start again, or set PORT in server/.env.'
      );
    } else {
      console.error(err.message);
    }
    process.exit(1);
  });

  connectDB().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

try {
  start();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
