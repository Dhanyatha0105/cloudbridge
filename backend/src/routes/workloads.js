const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { findAll, findOne } = require('../config/database');

router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['planned', 'in-progress', 'migrated']),
    query('environment').optional().isIn(['on-prem', 'cloud']),
    query('type').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      let workloads = findAll('workloads', w => w.tenantId === (req.tenantId || 'tenant-main'));
      if (req.query.status) workloads = workloads.filter(w => w.status === req.query.status);
      if (req.query.environment) workloads = workloads.filter(w => w.environment === req.query.environment);
      if (req.query.type) workloads = workloads.filter(w => w.type === req.query.type);
      res.json(workloads);
    } catch (err) { next(err); }
  }
);

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const workload = findOne('workloads',
      w => w.id === req.params.id && w.tenantId === (req.tenantId || 'tenant-main')
    );
    if (!workload) return res.status(404).json({ error: 'Workload not found' });
    res.json(workload);
  } catch (err) { next(err); }
});

router.get('/kpis/summary', authenticate, async (req, res, next) => {
  try {
    const workloads = findAll('workloads', w => w.tenantId === (req.tenantId || 'tenant-main'));
    const migrated = workloads.filter(w => w.status === 'migrated');
    const inProgress = workloads.filter(w => w.status === 'in-progress');
    const totalCarbonOnPrem = workloads
      .filter(w => w.environment === 'on-prem')
      .reduce((s, w) => s + (w.carbonKgCO2ePerMonth || 0), 0);
    const totalCarbonCloud = workloads
      .filter(w => w.environment === 'cloud')
      .reduce((s, w) => s + (w.carbonKgCO2ePerMonth || 0), 0);

    res.json({
      totalWorkloads: workloads.length,
      migrated: migrated.length,
      inProgress: inProgress.length,
      planned: workloads.filter(w => w.status === 'planned').length,
      migrationPercent: workloads.length
        ? Math.round((migrated.length / workloads.length) * 100)
        : 0,
      totalCarbonOnPremKgCO2ePerMonth: parseFloat(totalCarbonOnPrem.toFixed(2)),
      totalCarbonCloudKgCO2ePerMonth: parseFloat(totalCarbonCloud.toFixed(2)),
    });
  } catch (err) { next(err); }
});

module.exports = router;
