const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const carbonService = require('../services/carbonService');

router.get('/current', authenticate, async (_req, res, next) => {
  try {
    res.json(await carbonService.getCurrentEmissions('tenant-main'));
  } catch (err) { next(err); }
});

router.get(
  '/history',
  authenticate,
  [query('resolution').optional().isIn(['minute', 'hour', 'day'])],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      res.json(await carbonService.getEmissionHistory('tenant-main', req.query));
    } catch (err) { next(err); }
  }
);

router.get('/workloads', authenticate, async (_req, res, next) => {
  try {
    res.json(await carbonService.getWorkloadEmissions('tenant-main'));
  } catch (err) { next(err); }
});

router.get('/savings', authenticate, async (_req, res, next) => {
  try {
    res.json(await carbonService.getCarbonSavings('tenant-main'));
  } catch (err) { next(err); }
});

router.get('/targets', authenticate, async (_req, res, next) => {
  try {
    res.json(await carbonService.getNetZeroTargets('tenant-main'));
  } catch (err) { next(err); }
});

router.get('/devices', authenticate, async (_req, res, next) => {
  try {
    res.json(await carbonService.getDeviceInventory('tenant-main'));
  } catch (err) { next(err); }
});

router.post(
  '/sensors/ingest',
  [
    body('deviceId').isString().notEmpty(),
    body('deviceToken').isString().notEmpty(),
    body('readings').isArray({ min: 1 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { deviceId, readings } = req.body;
      await carbonService.ingestSensorData({ deviceId, readings, tenantId: 'tenant-main' });
      res.json({ status: 'ingested', count: readings.length });
    } catch (err) { next(err); }
  }
);

module.exports = router;
