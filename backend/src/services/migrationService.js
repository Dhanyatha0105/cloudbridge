const { v4: uuidv4 } = require('uuid');
const { findOne, findAll, upsert, readTable, writeTable } = require('../config/database');
const logger = require('../utils/logger');

const getAllPhases = async (tenantId) => {
  return findAll('migration_phases', p => p.tenantId === tenantId)
    .sort((a, b) => a.id.localeCompare(b.id));
};

const getPhase = async (phaseId, tenantId) => {
  return findOne('migration_phases', p => p.id === phaseId && p.tenantId === tenantId);
};

const startPhase = async (phaseId, userId, tenantId) => {
  const phase = findOne('migration_phases', p => p.id === phaseId && p.tenantId === tenantId);
  if (!phase) throw Object.assign(new Error('Phase not found'), { status: 404 });
  if (phase.status === 'running') throw Object.assign(new Error('Phase already running'), { status: 409 });
  if (phase.status === 'completed') throw Object.assign(new Error('Phase already completed'), { status: 409 });

  const updated = upsert('migration_phases', {
    ...phase,
    status: 'running',
    progress: 0,
    startedAt: new Date().toISOString(),
    startedBy: userId,
    executionId: uuidv4(),
    logs: [{ ts: new Date().toISOString(), level: 'info', msg: `Phase started by ${userId}` }],
  });

  // Mark target workloads as in-progress
  phase.targetWorkloads.forEach(wlId => {
    const wl = findOne('workloads', w => w.id === wlId);
    if (wl) upsert('workloads', { ...wl, status: 'in-progress', migrationStartedAt: new Date().toISOString() });
  });

  _simulateProgress(phaseId, tenantId, phase.targetWorkloads);
  logger.info('Migration phase started', { phaseId, userId, tenantId });
  return updated;
};

const rollbackPhase = async (phaseId, userId, tenantId) => {
  const phase = findOne('migration_phases', p => p.id === phaseId && p.tenantId === tenantId);
  if (!phase) throw Object.assign(new Error('Phase not found'), { status: 404 });
  if (phase.status !== 'running') throw Object.assign(new Error('Only running phases can be rolled back'), { status: 409 });

  const updated = upsert('migration_phases', {
    ...phase,
    status: 'rolled_back',
    rolledBackAt: new Date().toISOString(),
    rolledBackBy: userId,
    logs: [...(phase.logs || []), { ts: new Date().toISOString(), level: 'warn', msg: `Rollback initiated by ${userId}` }],
  });

  // Revert workloads to planned
  phase.targetWorkloads.forEach(wlId => {
    const wl = findOne('workloads', w => w.id === wlId);
    if (wl && wl.status === 'in-progress') upsert('workloads', { ...wl, status: 'planned', migrationStartedAt: null });
  });

  logger.warn('Migration phase rolled back', { phaseId, userId, tenantId });
  return updated;
};

const getOverallStatus = async (tenantId) => {
  const phases = await getAllPhases(tenantId);
  const workloads = findAll('workloads', w => w.tenantId === tenantId);
  return {
    totalPhases: phases.length,
    completed: phases.filter(p => p.status === 'completed').length,
    running: phases.filter(p => p.status === 'running').length,
    planned: phases.filter(p => p.status === 'planned' || !p.status).length,
    rolledBack: phases.filter(p => p.status === 'rolled_back').length,
    overallProgress: phases.length
      ? Math.round(phases.reduce((sum, p) => sum + (p.progress || 0), 0) / phases.length)
      : 0,
    totalWorkloads: workloads.length,
    migratedWorkloads: workloads.filter(w => w.status === 'migrated').length,
    inProgressWorkloads: workloads.filter(w => w.status === 'in-progress').length,
  };
};

const getTimeline = async (tenantId) => {
  const phases = await getAllPhases(tenantId);
  let cursor = new Date();
  return phases.map(phase => {
    const start = new Date(cursor);
    const end = new Date(cursor.getTime() + phase.estimatedDurationDays * 86400000);
    cursor = end;
    return {
      ...phase,
      plannedStartDate: start.toISOString().split('T')[0],
      plannedEndDate: end.toISOString().split('T')[0],
    };
  });
};

// Advances phase progress on a timer and writes state to disk
const _simulateProgress = (phaseId, tenantId, workloadIds) => {
  let tick = 0;
  const interval = setInterval(() => {
    const phase = findOne('migration_phases', p => p.id === phaseId && p.tenantId === tenantId);
    if (!phase || phase.status === 'rolled_back') { clearInterval(interval); return; }

    tick += 1;
    const progress = Math.min(phase.progress + Math.floor(8 + Math.random() * 7), 100);
    const logEntry = { ts: new Date().toISOString(), level: 'info', msg: `Progress ${progress}% — validating network connectivity` };

    const isComplete = progress === 100;
    upsert('migration_phases', {
      ...phase,
      progress,
      status: isComplete ? 'completed' : 'running',
      logs: [...(phase.logs || []).slice(-20), logEntry],
      ...(isComplete && { completedAt: new Date().toISOString() }),
    });

    if (isComplete) {
      workloadIds.forEach(wlId => {
        const wl = findOne('workloads', w => w.id === wlId);
        if (wl) upsert('workloads', { ...wl, status: 'migrated', environment: 'cloud', migratedAt: new Date().toISOString() });
      });
      clearInterval(interval);
      logger.info('Migration phase completed', { phaseId });
    }
  }, 4000);
};

module.exports = { getAllPhases, getPhase, startPhase, rollbackPhase, getOverallStatus, getTimeline };
