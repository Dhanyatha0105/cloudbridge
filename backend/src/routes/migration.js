const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const migrationService = require('../services/migrationService');

router.get('/phases', authenticate, async (req, res, next) => {
  try {
    res.json(await migrationService.getAllPhases(req.tenantId || 'tenant-main'));
  } catch (err) { next(err); }
});

router.get('/phases/:phaseId', authenticate, async (req, res, next) => {
  try {
    const phase = await migrationService.getPhase(req.params.phaseId, req.tenantId || 'tenant-main');
    if (!phase) return res.status(404).json({ error: 'Phase not found' });
    res.json(phase);
  } catch (err) { next(err); }
});

router.post(
  '/phases/:phaseId/start',
  authenticate,
  authorize('admin', 'engineer'),
  async (req, res, next) => {
    try {
      const result = await migrationService.startPhase(
        req.params.phaseId,
        req.user.id,
        req.tenantId || 'tenant-main'
      );
      res.json(result);
    } catch (err) { next(err); }
  }
);

router.post(
  '/phases/:phaseId/rollback',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const result = await migrationService.rollbackPhase(
        req.params.phaseId,
        req.user.id,
        req.tenantId || 'tenant-main'
      );
      res.json(result);
    } catch (err) { next(err); }
  }
);

router.get('/status', authenticate, async (req, res, next) => {
  try {
    res.json(await migrationService.getOverallStatus(req.tenantId || 'tenant-main'));
  } catch (err) { next(err); }
});

router.get('/timeline', authenticate, async (req, res, next) => {
  try {
    res.json(await migrationService.getTimeline(req.tenantId || 'tenant-main'));
  } catch (err) { next(err); }
});

module.exports = router;
