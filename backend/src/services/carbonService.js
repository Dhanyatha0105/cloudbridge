const { findOne, findAll, upsert, readTable } = require('../config/database');
const logger = require('../utils/logger');

// Carbon intensity constants (EU grid averages, source: electricitymaps.com 2024)
const EU_GRID_INTENSITY_KG_CO2E_PER_KWH = 0.233;
const CLOUD_INTENSITY_AZURE_WEU = 0.019; // Azure carbon-neutral infrastructure

const getCurrentEmissions = async (tenantId) => {
  const baseline = findOne('carbon_baselines', b => b.tenantId === tenantId);
  const workloads = findAll('workloads', w => w.tenantId === tenantId);
  const readings = readTable('sensor_readings').filter(r => r.tenantId === tenantId);

  // Use latest sensor readings if available, otherwise derive from workload inventory
  const latestDcReading = readings
    .filter(r => r.type === 'power_meter')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  const dcPowerKW = latestDcReading?.valueKW ?? _estimateDcPowerKW(workloads);
  const cloudWorkloads = workloads.filter(w => w.environment === 'cloud');
  const cloudKgCO2ePerHour = cloudWorkloads.reduce((sum, w) => sum + _estimateCloudEmissions(w), 0);
  const dcKgCO2ePerHour = parseFloat((dcPowerKW * EU_GRID_INTENSITY_KG_CO2E_PER_KWH).toFixed(2));
  const currentKgCO2ePerHour = parseFloat((dcKgCO2ePerHour + cloudKgCO2ePerHour).toFixed(2));
  const baselineKgCO2ePerHour = baseline?.avgKgCO2ePerHour ?? 42.8;
  const reductionPercent = parseFloat(((baselineKgCO2ePerHour - currentKgCO2ePerHour) / baselineKgCO2ePerHour * 100).toFixed(1));

  return {
    currentKgCO2ePerHour,
    baselineKgCO2ePerHour,
    reductionPercent: Math.max(reductionPercent, 0),
    dcPowerKW,
    cloudKgCO2ePerHour,
    onPremKgCO2ePerHour: dcKgCO2ePerHour,
    sources: _buildSourceBreakdown(dcKgCO2ePerHour, cloudKgCO2ePerHour),
    timestamp: new Date().toISOString(),
    dataSource: latestDcReading ? 'iot-sensor' : 'workload-model',
  };
};

const getEmissionHistory = async (tenantId, { resolution = 'hour' }) => {
  const readings = readTable('sensor_readings')
    .filter(r => r.tenantId === tenantId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  if (readings.length > 10) {
    return _aggregateReadings(readings, resolution);
  }

  // Generate modelled history if insufficient sensor data
  return _modelledHistory(tenantId, resolution);
};

const getCarbonSavings = async (tenantId) => {
  const baseline = findOne('carbon_baselines', b => b.tenantId === tenantId);
  const current = await getCurrentEmissions(tenantId);
  const workloads = findAll('workloads', w => w.tenantId === tenantId);
  const devices = findAll('devices', d => d.tenantId === tenantId);

  const hoursYTD = (new Date().getMonth() + 1) * 30 * 24;
  const baselineKgYTD = (baseline?.avgKgCO2ePerHour ?? 42.8) * hoursYTD;
  const currentKgYTD = current.currentKgCO2ePerHour * hoursYTD;

  return {
    totalSavingsKgCO2eThisYear: Math.round(baselineKgYTD - currentKgYTD),
    reductionPercent: current.reductionPercent,
    cloudVsOnPremEfficiencyGain: parseFloat(
      ((1 - CLOUD_INTENSITY_AZURE_WEU / EU_GRID_INTENSITY_KG_CO2E_PER_KWH) * 100).toFixed(1)
    ),
    remanufacturedDevicesTracked: devices.filter(d => d.type === 'remanufactured').length,
    refurbishedDevicesTracked: devices.filter(d => d.type === 'refurbished').length,
    estimatedCO2SavedByDeviceReuse: devices
      .filter(d => d.type === 'remanufactured' || d.type === 'refurbished')
      .reduce((sum, d) => sum + (d.co2SavedKg || 156), 0),
    netZeroTrajectory: _computeTrajectory(baseline, current),
  };
};

const getWorkloadEmissions = async (tenantId) => {
  return findAll('workloads', w => w.tenantId === tenantId).map(w => ({
    workloadId: w.id,
    workload: w.name,
    type: w.type,
    environment: w.environment,
    kgCO2ePerMonth: w.carbonKgCO2ePerMonth,
    status: w.status,
    optimizable: w.environment === 'on-prem',
    estimatedSavingKgCO2ePerMonth: w.environment === 'on-prem'
      ? parseFloat((w.carbonKgCO2ePerMonth * 0.4).toFixed(2))
      : null,
  }));
};

const getNetZeroTargets = async (tenantId) => {
  const baseline = findOne('carbon_baselines', b => b.tenantId === tenantId);
  return {
    baselineYear: baseline?.year ?? 2023,
    baselineKgCO2ePerYear: baseline?.totalKgCO2ePerYear ?? 374800,
    milestones: [
      { year: 2025, targetReductionPct: 15, description: 'DC PUE below 1.4; pilot workloads to cloud' },
      { year: 2026, targetReductionPct: 20, description: 'Phase 1–2 migration complete; IoT monitoring active' },
      { year: 2028, targetReductionPct: 40, description: 'Full hybrid-cloud; legacy DC decommission' },
      { year: 2030, targetReductionPct: 50, description: 'Scope 3 suppliers enrolled' },
      { year: 2050, targetReductionPct: 100, description: 'Net Zero — residual offset via verified carbon credits' },
    ],
    dPlusControls: {
      scope1Covered: true,
      scope2Covered: true,
      scope3InProgress: true,
      iotSensorsActive: readTable('sensor_readings').filter(r => r.tenantId === tenantId && _isRecent(r.timestamp)).length,
      reportingStandard: 'GHG Protocol Corporate Standard',
    },
  };
};

const ingestSensorData = async ({ deviceId, readings, tenantId }) => {
  const stamped = readings.map(r => ({
    ...r,
    deviceId,
    tenantId,
    ingestedAt: new Date().toISOString(),
  }));
  const existing = readTable('sensor_readings');
  // Keep last 10,000 readings to prevent unbounded growth
  const updated = [...existing, ...stamped].slice(-10000);
  require('../config/database').writeTable('sensor_readings', updated);
  logger.info('Sensor data ingested', { deviceId, count: readings.length });
};

const getDeviceInventory = async (tenantId) => {
  const devices = findAll('devices', d => d.tenantId === tenantId);
  const total = devices.length;
  const remanufactured = devices.filter(d => d.type === 'remanufactured').length;
  const refurbished = devices.filter(d => d.type === 'refurbished').length;
  return {
    total,
    remanufactured,
    refurbished,
    new: total - remanufactured - refurbished,
    remanufacturedPercent: total ? parseFloat(((remanufactured / total) * 100).toFixed(1)) : 0,
    co2SavedByReuseKg: (remanufactured + refurbished) * 156,
    lastAudit: devices.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]?.updatedAt ?? null,
  };
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const _estimateDcPowerKW = (workloads) => {
  const onPremCount = workloads.filter(w => w.environment === 'on-prem').length;
  // ~15 kW per on-prem workload (servers + cooling overhead at PUE 1.4)
  return parseFloat((onPremCount * 15 + 20).toFixed(1)); // 20 kW base network/storage
};

const _estimateCloudEmissions = (workload) => {
  const cpuHours = workload.cpuCores * 1;
  return parseFloat((cpuHours * 0.00036 * CLOUD_INTENSITY_AZURE_WEU).toFixed(4));
};

const _buildSourceBreakdown = (dcKg, cloudKg) => {
  const total = dcKg + cloudKg;
  if (total === 0) return [];
  return [
    { source: 'On-Premises DC (Frankfurt)', kgCO2ePerHour: dcKg, percent: parseFloat(((dcKg / total) * 100).toFixed(1)) },
    { source: 'Azure West Europe', kgCO2ePerHour: cloudKg, percent: parseFloat(((cloudKg / total) * 100).toFixed(1)) },
  ];
};

const _computeTrajectory = (baseline, current) => {
  const base = baseline?.totalKgCO2ePerYear ?? 374800;
  return {
    baseline2023: base,
    current: Math.round(current.currentKgCO2ePerHour * 8760),
    target2030: Math.round(base * 0.5),
    target2050: 0,
    onTrack: current.reductionPercent >= 15,
  };
};

const _aggregateReadings = (readings, resolution) => {
  const msPerBucket = resolution === 'day' ? 86400000 : resolution === 'hour' ? 3600000 : 60000;
  const buckets = new Map();
  readings.forEach(r => {
    const key = Math.floor(new Date(r.timestamp).getTime() / msPerBucket) * msPerBucket;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(r.valueKW * EU_GRID_INTENSITY_KG_CO2E_PER_KWH);
  });
  return Array.from(buckets.entries()).map(([ts, vals]) => ({
    timestamp: new Date(ts).toISOString(),
    kgCO2e: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
  }));
};

const _modelledHistory = (tenantId, resolution) => {
  const baseline = findOne('carbon_baselines', b => b.tenantId === tenantId);
  const base = baseline?.avgKgCO2ePerHour ?? 42.8;
  const points = resolution === 'day' ? 30 : 24;
  const intervalMs = resolution === 'day' ? 86400000 : 3600000;
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => {
    const t = now - (points - 1 - i) * intervalMs;
    const decay = 1 - (i / points) * 0.22; // model ~22% reduction by end of window
    return {
      timestamp: new Date(t).toISOString(),
      kgCO2e: parseFloat((base * decay + (Math.random() - 0.5) * 1.5).toFixed(2)),
      baseline: base,
      source: 'modelled',
    };
  });
};

const _isRecent = (timestamp) => Date.now() - new Date(timestamp).getTime() < 3600000;

module.exports = {
  getCurrentEmissions, getEmissionHistory, getCarbonSavings,
  getWorkloadEmissions, getNetZeroTargets, ingestSensorData, getDeviceInventory,
};
