const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const sapService = require('../services/sapIntegrationService');
const { findAll, upsert } = require('../config/database');

router.get('/sap/status', authenticate, async (_req, res, next) => {
  try {
    res.json(await sapService.getConnectionStatus());
  } catch (err) { next(err); }
});

router.get('/sap/flows', authenticate, async (_req, res, next) => {
  try {
    res.json(await sapService.getIntegrationFlows());
  } catch (err) { next(err); }
});

router.post(
  '/sap/flows/:flowId/trigger',
  authenticate,
  authorize('admin', 'engineer'),
  async (req, res, next) => {
    try {
      const result = await sapService.triggerFlow(req.params.flowId, req.body);
      res.status(202).json(result);
    } catch (err) { next(err); }
  }
);

router.get(
  '/sap/runs',
  authenticate,
  [
    query('flowId').optional().isString(),
    query('status').optional().isIn(['pending', 'triggered', 'failed', 'queued']),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      res.json(await sapService.getFlowRuns(req.query));
    } catch (err) { next(err); }
  }
);

router.post(
  '/sap/transform',
  authenticate,
  [
    body('payload').isObject().withMessage('payload must be a JSON object'),
    body('mappingType')
      .isIn(['workload-to-sap-maintenance', 'carbon-to-sac', 'incident-to-pm-order'])
      .withMessage('mappingType must be one of: workload-to-sap-maintenance, carbon-to-sac, incident-to-pm-order'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const result = await sapService.transformPayload(req.body.payload, req.body.mappingType);
      res.json({ mappingType: req.body.mappingType, result });
    } catch (err) { next(err); }
  }
);

router.get('/servicenow/status', authenticate, async (_req, res, next) => {
  try {
    const snowHost = process.env.SERVICENOW_HOST;
    res.json({
      configured: !!snowHost,
      instance: snowHost || null,
      aiIgniteEnabled: !!process.env.SNOW_AI_IGNITE_ENABLED,
      ...(snowHost ? {} : { note: 'Set SERVICENOW_HOST to connect' }),
      lastChecked: new Date().toISOString(),
    });
  } catch (err) { next(err); }
});

router.get('/servicenow/incidents', authenticate, async (req, res, next) => {
  try {
    const incidents = findAll('snow_incidents',
      i => i.tenantId === req.tenantId || i.tenantId === 'tenant-main'
    )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);
    res.json(incidents);
  } catch (err) { next(err); }
});

// Inbound webhook from ServiceNow Business Rule — HMAC-verified
router.post('/servicenow/webhook', async (req, res, next) => {
  try {
    const hmacSecret = process.env.SNOW_WEBHOOK_SECRET;
    if (hmacSecret) {
      const sig = req.headers['x-sn-signature'];
      const expected = crypto
        .createHmac('sha256', hmacSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      if (sig !== expected) return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    upsert('snow_incidents', {
      ...req.body,
      tenantId: 'tenant-main',
      receivedAt: new Date().toISOString(),
    }, 'sys_id');

    res.json({ received: true });
  } catch (err) { next(err); }
});

module.exports = router;
