const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { findAll, findOne, readTable } = require('../config/database');

router.get('/overview', authenticate, async (_req, res, next) => {
  try {
    const clusters = findAll('clusters');
    const nodes = readTable('nodes');
    const workloads = findAll('workloads', w => w.tenantId === 'tenant-main');

    res.json({
      totalClusters: clusters.length,
      totalNodes: nodes.length,
      totalWorkloads: workloads.length,
      onPremNodes: nodes.filter(n => n.type === 'on-prem').length,
      cloudNodes: nodes.filter(n => n.type === 'cloud').length,
      azureArcManaged: nodes.filter(n => n.arcManaged).length,
      healthyNodes: nodes.filter(n => n.status === 'healthy').length,
      alertingNodes: nodes.filter(n => n.status === 'warning' || n.status === 'critical').length,
      hybridUtilization: nodes.length
        ? parseFloat((nodes.reduce((s, n) => s + (n.cpu || 0), 0) / nodes.length).toFixed(1))
        : 0,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) { next(err); }
});

router.get('/clusters', authenticate, async (_req, res, next) => {
  try {
    res.json(findAll('clusters'));
  } catch (err) { next(err); }
});

router.get('/clusters/:id', authenticate, async (req, res, next) => {
  try {
    const cluster = findOne('clusters', c => c.id === req.params.id);
    if (!cluster) return res.status(404).json({ error: 'Cluster not found' });
    res.json(cluster);
  } catch (err) { next(err); }
});

router.get('/nodes', authenticate, async (req, res, next) => {
  try {
    let nodes = readTable('nodes');
    if (req.query.clusterId) nodes = nodes.filter(n => n.clusterId === req.query.clusterId);
    if (req.query.type) nodes = nodes.filter(n => n.type === req.query.type);
    res.json(nodes);
  } catch (err) { next(err); }
});

router.get('/compliance', authenticate, async (_req, res, next) => {
  try {
    const compliance = findOne('compliance_snapshots', () => true);
    if (compliance) return res.json(compliance);

    // Return a neutral unconfigured state rather than fake data
    res.json({
      zeroTrustScore: null,
      patchCompliancePercent: null,
      encryptedVolumesPercent: null,
      openFindings: null,
      criticalFindings: null,
      gdprCompliant: null,
      lastAudit: null,
      note: 'Connect Azure Policy and Microsoft Defender to populate compliance data',
      sovereigntyControls: {
        dataResidency: process.env.DATA_RESIDENCY_REGION || 'EU',
        vendorLockInRisk: 'low',
        openStandards: true,
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
