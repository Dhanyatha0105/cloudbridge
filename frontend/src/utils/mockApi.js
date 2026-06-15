// Demo mock layer — serves canned sample data so the dashboard works on static
// hosting with no backend. Mirrors the API response shapes of the Node/Express
// backend (see backend/src). NOTE: sample data only — nothing is persisted.

const EU_GRID = 0.233;

// ── Seed-derived sample data ────────────────────────────────────────────────
const clusters = [
  { id: 'cluster-hci-01', name: 'Frankfurt HCI Cluster', type: 'azure-stack-hci', location: 'Frankfurt DC', nodes: 5, workloads: 4, status: 'healthy', arcManaged: true },
  { id: 'cluster-aks-01', name: 'Azure West Europe (AKS)', type: 'aks', location: 'West Europe', nodes: 4, workloads: 3, status: 'healthy', arcManaged: true },
  { id: 'cluster-aks-dr', name: 'Azure North Europe (DR)', type: 'aks', location: 'North Europe', nodes: 3, workloads: 2, status: 'standby', arcManaged: true },
];

const mkNodes = () => {
  const out = [];
  for (let i = 0; i < 5; i++) out.push({ id: `node-hci-${String(i + 1).padStart(2, '0')}`, name: `hci-node-${i + 1}.frankfurt.internal`, clusterId: 'cluster-hci-01', type: 'on-prem', status: 'healthy', arcManaged: true, os: 'Windows Server 2022 Datacenter', cpu: 38 + i * 4, memory: 52 + i * 3, disk: 44 + i * 2 });
  for (let i = 0; i < 4; i++) out.push({ id: `node-aks-weu-${String(i + 1).padStart(2, '0')}`, name: `aks-weu-node-${i + 1}`, clusterId: 'cluster-aks-01', type: 'cloud', status: i === 3 ? 'warning' : 'healthy', arcManaged: true, os: 'Ubuntu 22.04 LTS', cpu: 61 + i * 5, memory: 58 + i * 4, disk: 39 + i * 3 });
  for (let i = 0; i < 3; i++) out.push({ id: `node-aks-neu-${String(i + 1).padStart(2, '0')}`, name: `aks-neu-node-${i + 1}`, clusterId: 'cluster-aks-dr', type: 'cloud', status: 'healthy', arcManaged: true, os: 'Ubuntu 22.04 LTS', cpu: 22 + i * 3, memory: 31 + i * 2, disk: 28 + i });
  return out;
};
const nodes = mkNodes();

const workloads = [
  { id: 'wl-customer-portal', name: 'Customer Portal', type: 'web-app', environment: 'cloud', status: 'migrated', cpuCores: 4, memoryGB: 8, diskGB: 100, carbonKgCO2ePerMonth: 8.2, migrationPhase: 'phase-1', tenantId: 'tenant-main' },
  { id: 'wl-auth-service', name: 'Authentication Service', type: 'api-service', environment: 'cloud', status: 'migrated', cpuCores: 2, memoryGB: 4, diskGB: 50, carbonKgCO2ePerMonth: 3.1, migrationPhase: 'phase-1', tenantId: 'tenant-main' },
  { id: 'wl-notification-hub', name: 'Notification Hub', type: 'api-service', environment: 'on-prem', status: 'in-progress', cpuCores: 2, memoryGB: 4, diskGB: 40, carbonKgCO2ePerMonth: 2.7, migrationPhase: 'phase-1', tenantId: 'tenant-main' },
  { id: 'wl-crm-platform', name: 'CRM Platform', type: 'web-app', environment: 'on-prem', status: 'in-progress', cpuCores: 8, memoryGB: 32, diskGB: 500, carbonKgCO2ePerMonth: 18.4, migrationPhase: 'phase-2', tenantId: 'tenant-main' },
  { id: 'wl-finance-api', name: 'Finance API', type: 'api-service', environment: 'on-prem', status: 'in-progress', cpuCores: 4, memoryGB: 16, diskGB: 200, carbonKgCO2ePerMonth: 11.2, migrationPhase: 'phase-2', tenantId: 'tenant-main' },
  { id: 'wl-sap-cpi-adapter', name: 'SAP CPI Adapter', type: 'integration', environment: 'on-prem', status: 'planned', cpuCores: 4, memoryGB: 8, diskGB: 100, carbonKgCO2ePerMonth: 6.8, migrationPhase: 'phase-2', tenantId: 'tenant-main' },
  { id: 'wl-erp-database', name: 'ERP Database', type: 'database', environment: 'on-prem', status: 'planned', cpuCores: 16, memoryGB: 64, diskGB: 2000, carbonKgCO2ePerMonth: 42.1, migrationPhase: 'phase-3', tenantId: 'tenant-main' },
  { id: 'wl-hr-legacy', name: 'HR Legacy System', type: 'legacy-vm', environment: 'on-prem', status: 'planned', cpuCores: 8, memoryGB: 16, diskGB: 800, carbonKgCO2ePerMonth: 22.6, migrationPhase: 'phase-3', tenantId: 'tenant-main' },
  { id: 'wl-data-warehouse', name: 'Data Warehouse', type: 'database', environment: 'on-prem', status: 'planned', cpuCores: 16, memoryGB: 128, diskGB: 5000, carbonKgCO2ePerMonth: 38.4, migrationPhase: 'phase-3', tenantId: 'tenant-main' },
];

const phases = [
  { id: 'phase-1', name: 'Phase 1 — Pilot: Non-Critical Web Services', description: 'Migrate stateless web applications and static services to validate the Azure Arc onboarding pipeline with minimal business risk.', targetWorkloads: ['wl-customer-portal', 'wl-auth-service', 'wl-notification-hub'], estimatedDurationDays: 28, riskLevel: 'low', requiredApprovals: 1, rollbackStrategy: 'DNS failback to on-premises within 5 minutes via Azure Traffic Manager policy', carbonSavingKgCO2ePerMonth: 38.4, status: 'running', progress: 72, tenantId: 'tenant-main', logs: [{ ts: '2026-05-02T09:00:00Z', msg: 'wl-customer-portal cutover complete' }, { ts: '2026-05-09T14:20:00Z', msg: 'wl-auth-service cutover complete' }, { ts: '2026-06-01T10:05:00Z', msg: 'wl-notification-hub blue-green sync in progress' }] },
  { id: 'phase-2', name: 'Phase 2 — Core Business Services', description: 'Migrate CRM, Finance API, and SAP-connected adapters with blue-green deployment and 48-hour parallel run before traffic cutover.', targetWorkloads: ['wl-crm-platform', 'wl-finance-api', 'wl-sap-cpi-adapter'], estimatedDurationDays: 56, riskLevel: 'medium', requiredApprovals: 2, rollbackStrategy: 'Blue-green cutback via weighted routing; data sync validated before cutover window', carbonSavingKgCO2ePerMonth: 61.2, status: 'running', progress: 28, tenantId: 'tenant-main', logs: [{ ts: '2026-06-05T08:00:00Z', msg: 'wl-crm-platform parallel run started' }] },
  { id: 'phase-3', name: 'Phase 3 — Legacy Decommission', description: 'Final cutover for legacy ERP databases and HR systems. On-premises VMs decommissioned after a 30-day hypercare period with daily snapshots.', targetWorkloads: ['wl-erp-database', 'wl-hr-legacy', 'wl-data-warehouse'], estimatedDurationDays: 42, riskLevel: 'high', requiredApprovals: 3, rollbackStrategy: 'Full restore from automated daily snapshots to Azure Stack HCI; RTO < 4 hours', carbonSavingKgCO2ePerMonth: 84.6, status: 'planned', progress: 0, tenantId: 'tenant-main', logs: [] },
];

const flows = [
  { id: 'iflow-workload-sync', name: 'Workload Migration Status → SAP Maintenance (XSLT)', status: 'active', lastRun: '2026-06-15T22:14:00Z', messages24h: 1284, errorRate: 0.2 },
  { id: 'iflow-carbon-analytics', name: 'Carbon Telemetry → SAP Analytics Cloud (Groovy)', status: 'active', lastRun: '2026-06-16T00:02:00Z', messages24h: 8640, errorRate: 0.0 },
  { id: 'iflow-snow-maintenance', name: 'ServiceNow Incident → SAP PM Order (ODATA)', status: 'active', lastRun: '2026-06-15T19:48:00Z', messages24h: 312, errorRate: 1.6 },
  { id: 'iflow-inventory-sftp', name: 'Inventory SFTP → SAP ERP Material Master (B2B EDI)', status: 'configured', lastRun: '2026-06-14T03:00:00Z', messages24h: 42, errorRate: 0.0 },
  { id: 'iflow-hr-successfactors', name: 'HR Legacy Export → SAP SuccessFactors (Groovy/XSLT)', status: 'pending-config', lastRun: null, messages24h: 0, errorRate: 0 },
];

const messages = Array.from({ length: 12 }, (_, i) => ({
  id: `msg-${1000 + i}`,
  flowId: flows[i % 3].id,
  status: i % 7 === 0 ? 'failed' : 'completed',
  direction: i % 2 === 0 ? 'inbound' : 'outbound',
  receivedAt: new Date(Date.now() - i * 1800000).toISOString(),
  sizeBytes: 2048 + i * 320,
  protocol: ['ODATA', 'SFTP', 'HTTPS', 'IDoc'][i % 4],
}));

const carbonCurrent = () => {
  const cloud = workloads.filter(w => w.environment === 'cloud');
  const onPremCount = workloads.filter(w => w.environment === 'on-prem').length;
  const dcPowerKW = parseFloat((onPremCount * 15 + 20).toFixed(1));
  const onPremKg = parseFloat((dcPowerKW * EU_GRID).toFixed(2));
  const cloudKg = parseFloat((cloud.reduce((s, w) => s + w.cpuCores * 0.00036 * 0.019, 0)).toFixed(2));
  const current = parseFloat((onPremKg + cloudKg).toFixed(2));
  const baseline = 42.8;
  const total = onPremKg + cloudKg;
  return {
    currentKgCO2ePerHour: current,
    baselineKgCO2ePerHour: baseline,
    reductionPercent: Math.max(parseFloat(((baseline - current) / baseline * 100).toFixed(1)), 0),
    dcPowerKW,
    cloudKgCO2ePerHour: cloudKg,
    onPremKgCO2ePerHour: onPremKg,
    sources: [
      { source: 'On-Premises DC (Frankfurt)', kgCO2ePerHour: onPremKg, percent: parseFloat(((onPremKg / total) * 100).toFixed(1)) },
      { source: 'Azure West Europe', kgCO2ePerHour: cloudKg, percent: parseFloat(((cloudKg / total) * 100).toFixed(1)) },
    ],
    timestamp: new Date().toISOString(),
    dataSource: 'workload-model',
  };
};

const carbonHistory = (resolution = 'hour') => {
  const base = 42.8;
  const points = resolution === 'day' ? 30 : 24;
  const intervalMs = resolution === 'day' ? 86400000 : 3600000;
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => {
    const t = now - (points - 1 - i) * intervalMs;
    const decay = 1 - (i / points) * 0.22;
    return { timestamp: new Date(t).toISOString(), kgCO2e: parseFloat((base * decay + Math.sin(i) * 0.8).toFixed(2)), baseline: base, source: 'modelled' };
  });
};

const carbonSavings = () => {
  const cur = carbonCurrent();
  const hoursYTD = (new Date().getMonth() + 1) * 30 * 24;
  return {
    totalSavingsKgCO2eThisYear: Math.round((42.8 - cur.currentKgCO2ePerHour) * hoursYTD),
    reductionPercent: cur.reductionPercent,
    cloudVsOnPremEfficiencyGain: 91.8,
    remanufacturedDevicesTracked: 148,
    refurbishedDevicesTracked: 96,
    refurbishedDevicesCO2Saved: 38064,
    estimatedCO2SavedByDeviceReuse: 38064,
    netZeroTrajectory: { baseline2023: 374800, current: Math.round(cur.currentKgCO2ePerHour * 8760), target2030: 187400, target2050: 0, onTrack: true },
  };
};

const carbonWorkloads = () => workloads.map(w => ({
  workloadId: w.id, workload: w.name, type: w.type, environment: w.environment,
  kgCO2ePerMonth: w.carbonKgCO2ePerMonth, status: w.status, optimizable: w.environment === 'on-prem',
  estimatedSavingKgCO2ePerMonth: w.environment === 'on-prem' ? parseFloat((w.carbonKgCO2ePerMonth * 0.4).toFixed(2)) : null,
}));

const infraOverview = () => ({
  totalClusters: clusters.length,
  totalNodes: nodes.length,
  totalWorkloads: workloads.length,
  onPremNodes: nodes.filter(n => n.type === 'on-prem').length,
  cloudNodes: nodes.filter(n => n.type === 'cloud').length,
  azureArcManaged: nodes.filter(n => n.arcManaged).length,
  healthyNodes: nodes.filter(n => n.status === 'healthy').length,
  alertingNodes: nodes.filter(n => n.status !== 'healthy').length,
  hybridUtilization: parseFloat((nodes.reduce((s, n) => s + n.cpu, 0) / nodes.length).toFixed(1)),
  lastUpdated: new Date().toISOString(),
});

const migrationStatus = () => ({
  totalPhases: phases.length,
  completed: phases.filter(p => p.status === 'completed').length,
  running: phases.filter(p => p.status === 'running').length,
  planned: phases.filter(p => p.status === 'planned').length,
  rolledBack: 0,
  overallProgress: Math.round(phases.reduce((s, p) => s + p.progress, 0) / phases.length),
  migrationPercent: Math.round(phases.reduce((s, p) => s + p.progress, 0) / phases.length),
  totalWorkloads: workloads.length,
  migratedWorkloads: workloads.filter(w => w.status === 'migrated').length,
  inProgressWorkloads: workloads.filter(w => w.status === 'in-progress').length,
});

const migrationPhasesTimeline = () => {
  let cursor = new Date('2026-04-01T00:00:00Z');
  return phases.map(p => {
    const start = new Date(cursor);
    const end = new Date(cursor.getTime() + p.estimatedDurationDays * 86400000);
    cursor = end;
    return { ...p, plannedStartDate: start.toISOString().split('T')[0], plannedEndDate: end.toISOString().split('T')[0] };
  });
};

const demoUser = { id: 'usr-demo', name: 'Cloud Engineer', email: 'engineer@cloudbridge.internal', role: 'engineer', tenantId: 'tenant-main' };

// ── Router ──────────────────────────────────────────────────────────────────
function resolve(config) {
  const method = (config.method || 'get').toLowerCase();
  const url = (config.url || '').split('?')[0];
  const params = config.params || {};

  // auth
  if (method === 'post' && url === '/auth/login') return { user: demoUser, accessToken: 'demo-access-token', refreshToken: 'demo-refresh-token' };
  if (method === 'get' && url === '/auth/me') return { ...demoUser, lastLogin: new Date().toISOString() };
  if (method === 'post' && url === '/auth/logout') return { message: 'Session terminated' };
  if (method === 'post' && url === '/auth/refresh') return { accessToken: 'demo-access-token', refreshToken: 'demo-refresh-token' };

  // infrastructure
  if (url === '/infrastructure/overview') return infraOverview();
  if (url === '/infrastructure/clusters') return clusters;
  if (url === '/infrastructure/nodes') {
    let n = nodes;
    if (params.clusterId) n = n.filter(x => x.clusterId === params.clusterId);
    if (params.type) n = n.filter(x => x.type === params.type);
    return n;
  }
  if (url === '/infrastructure/compliance') return { zeroTrustScore: 87, patchCompliancePercent: 96, encryptedVolumesPercent: 100, openFindings: 12, criticalFindings: 1, gdprCompliant: true, lastAudit: '2026-06-10T00:00:00Z', sovereigntyControls: { dataResidency: 'EU', vendorLockInRisk: 'low', openStandards: true } };

  // migration
  if (url === '/migration/status') return migrationStatus();
  if (url === '/migration/phases') return migrationPhasesTimeline();
  if (method === 'post' && /\/migration\/phases\/.+\/start/.test(url)) {
    const id = url.split('/')[3];
    return { ...phases.find(p => p.id === id), status: 'running' };
  }
  if (method === 'post' && /\/migration\/phases\/.+\/rollback/.test(url)) {
    const id = url.split('/')[3];
    return { ...phases.find(p => p.id === id), status: 'rolled_back' };
  }

  // carbon
  if (url === '/carbon/current') return carbonCurrent();
  if (url === '/carbon/history') return carbonHistory(params.resolution);
  if (url === '/carbon/savings') return carbonSavings();
  if (url === '/carbon/workloads') return carbonWorkloads();

  // integration
  if (url === '/integration/sap/status') return { btpConfigured: true, cpiConfigured: true, btpConnected: true, host: 'btp.eu10.hana.ondemand.com', integrationSuiteVersion: '2.0.1', lastChecked: new Date().toISOString() };
  if (url === '/integration/sap/flows') return flows;
  if (url === '/integration/sap/messages') return messages;
  if (url === '/integration/servicenow/status') return { configured: true, instance: 'cloudbridge.service-now.com', aiIgniteEnabled: true, lastChecked: new Date().toISOString() };
  if (method === 'post' && /\/integration\/sap\/flows\/.+\/trigger/.test(url)) return { id: `run-${Date.now()}`, flowId: url.split('/')[4], status: 'triggered', triggeredAt: new Date().toISOString() };
  if (method === 'post' && url === '/integration/sap/transform') return { mappingType: config.data ? JSON.parse(config.data).mappingType : 'workload-to-sap-maintenance', result: { transformed: true, sample: 'Demo transform — no live SAP connection', preview: { docType: 'PM_ORDER', priority: 'HIGH', plant: 'DE10' } } };

  return null; // unknown -> 404
}

// Axios adapter
export default function mockAdapter(config) {
  return new Promise((resolveP, rejectP) => {
    setTimeout(() => {
      const data = resolve(config);
      if (data === null) {
        rejectP({ response: { status: 404, data: { error: 'Not found (demo mock)' } }, config });
      } else {
        resolveP({ data, status: 200, statusText: 'OK', headers: {}, config, request: {} });
      }
    }, 250);
  });
}
