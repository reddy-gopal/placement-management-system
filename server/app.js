const express = require('express');
const cors = require('cors');
const studentRoutes = require('./routes/student');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

  app.disable('x-powered-by');
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/v1/health', (req, res) => res.json({ success: true, status: 'ok' }));
  app.use('/api/v1/student', studentRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
