const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { findOne, upsert } = require('../config/database');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRES_IN || '8h';

if (!JWT_SECRET || !REFRESH_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET and REFRESH_TOKEN_SECRET must be set in production');
  }
}

const issueTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
  const accessToken = jwt.sign(payload, JWT_SECRET || 'dev-only-secret', {
    expiresIn: JWT_EXPIRY,
    jwtid: uuidv4(),
    issuer: 'cloudbridge-api',
  });
  const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET || 'dev-only-refresh', {
    expiresIn: '7d',
    jwtid: uuidv4(),
  });
  return { accessToken, refreshToken };
};

router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = findOne('users', u => u.email === email && u.active !== false);

    if (!user) {
      // Timing-safe: always hash even on miss to prevent user enumeration
      await bcrypt.compare(password, '$2b$12$invalidhashfortimingnormalisation');
      logger.warn('Login attempt for unknown email', { email, ip: req.ip });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      logger.warn('Failed login attempt', { userId: user.id, ip: req.ip });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokens = issueTokens(user);
    upsert('users', { ...user, lastLogin: new Date().toISOString() });
    logger.info('User authenticated', { userId: user.id, role: user.role });

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId },
      ...tokens,
    });
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET || 'dev-only-refresh');
    const user = findOne('users', u => u.id === decoded.id && u.active !== false);
    if (!user) return res.status(401).json({ error: 'User not found or deactivated' });

    res.json(issueTokens(user));
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    next(err);
  }
});

router.get('/me', authenticate, (req, res) => {
  const user = findOne('users', u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId, lastLogin: user.lastLogin });
});

router.post('/logout', authenticate, (req, res) => {
  logger.info('User logged out', { userId: req.user.id });
  res.json({ message: 'Session terminated' });
});

module.exports = router;
