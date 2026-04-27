require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./src/config/database');
const logger = require('./src/config/logger');

// Routes
const authRoutes = require('./src/routes/auth.routes');
const patientRoutes = require('./src/routes/patient.routes');
const cardRoutes = require('./src/routes/card.routes');
const hospitalRoutes = require('./src/routes/hospital.routes');
const planRoutes = require('./src/routes/plan.routes');
const serviceRoutes = require('./src/routes/service.routes');
const fieldRoutes = require('./src/routes/field.routes');
const adminRoutes = require('./src/routes/admin.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const { initCronJobs } = require('./src/utils/cron');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    process.env.APP_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:8081', // Expo Web
    'http://localhost:19006', // Old Expo
  ],
  credentials: true,
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Auth routes get stricter limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) },
}));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Namma Health Card API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/field', fieldRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
async function startServer() {
  try {
    await testConnection();
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Namma Health Card API running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      initCronJobs();
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
