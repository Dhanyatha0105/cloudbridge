require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { collectDefaultMetrics, register } = require('prom-client');

const authRoutes = require('./routes/auth');
const migrationRoutes = require('./routes/migration');
const integrationRoutes = require('./routes/integration');
const carbonRoutes = require('./routes/carbon');
const infrastructureRoutes = require('./routes/infrastructure');
const workloadRoutes = require('./routes/workloads');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const logger = require('./utils/logger');
const seed = require('./models/seed');

const app = express();
const PORT = process.env.PORT || 4000;

collectDefaultMetrics({ prefix: 'cloudbridge_' });

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Tenant-ID'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(morgan('combined', { stream: { write: msg => logger.http(msg.trim()) } }));

app.use('/api/', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Please retry after the window resets.' },
}));

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cloudbridge-api',
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV,
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/api/auth', authRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/infrastructure', infrastructureRoutes);
app.use('/api/workloads', workloadRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.path }));
app.use(errorHandler);

const start = async () => {
  await seed();
  app.listen(PORT, () => {
    logger.info(`CloudBridge API running on :${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
};

start().catch(err => {
  logger.error('Startup failed', { error: err.message });
  process.exit(1);
});

module.exports = app;
