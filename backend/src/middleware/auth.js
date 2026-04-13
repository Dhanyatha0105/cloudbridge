const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Zero Trust: every request must carry a valid, unexpired token — no implicit trust
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.tenantId = decoded.tenantId || req.headers['x-tenant-id'];
    next();
  } catch (err) {
    logger.warn(`Auth failure: ${err.message} | IP: ${req.ip}`);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    logger.warn(`Unauthorized role access: user=${req.user?.id} role=${req.user?.role} required=${roles}`);
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, authorize };
