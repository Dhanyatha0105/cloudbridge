const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);

  const start = Date.now();
  res.on('finish', () => {
    logger.info('HTTP Request', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
      user: req.user?.id || 'anonymous',
      tenant: req.tenantId || 'none',
    });
  });
  next();
};

module.exports = { requestLogger };
