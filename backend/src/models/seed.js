const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readTable, writeTable } = require('../config/database');
const logger = require('../utils/logger');

const seed = async () => {
  if (readTable('users').length === 0) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const engineerPassword = process.env.ENGINEER_PASSWORD;
    if (process.env.NODE_ENV === 'production' && (!adminPassword || !engineerPassword)) {
      throw new Error('ADMIN_PASSWORD and ENGINEER_PASSWORD must be set in production');
    }
    writeTable('users', [
      {
        id: 'usr-' + uuidv4(),
        name: 'Platform Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@cloudbridge.internal',
        passwordHash: await bcrypt.hash(adminPassword || 'ChangeMe@Prod1!', 12),
        role: 'admin',
        tenantId: 'tenant-main',
        active: true,
      },
      {
        id: 'usr-' + uuidv4(),
        name: 'Cloud Engineer',
        email: process.env.ENGINEER_EMAIL || 'engineer@cloudbridge.internal',
        passwordHash: await bcrypt.hash(engineerPassword || 'ChangeMe@Eng1!', 12),
        role: 'engineer',
        tenantId: 'tenant-main',
        active: true,
      },
    ]);
    logger.info('Seeded users');
  }

  if (readTable('migration_phases').length === 0) {
    writeTable('migration_phases', [
      {
        id: 'phase-1',
        name: 'Phase 1 — Pilot: Non-Critical Web Services',
        description: 'Migrate stateless web applications and static services. Target group selected to validate the Azure Arc onboarding pipeline with minimal business risk.',
        targetWorkloads: ['wl-customer-portal', 'wl-auth-service', 'wl-notification-hub'],
        estimatedDurationDays: 28,
        riskLevel: 'low',
        requiredApprovals: 1,
        rollbackStrategy: 'DNS failback to on-premises within 5 minutes via Azure Traffic Manager policy',
        carbonSavingKgCO2ePerMonth: 38.4,
        status: 'planned',
        progress: 0,
        tenantId: 'tenant-main',
      },
      {
        id: 'phase-2',
        name: 'Phase 2 — Core Business Services',
        description: 'Migrate CRM, Finance API, and SAP-connected adapters with blue-green deployment and 48-hour parallel run before traffic cutover.',
        targetWorkloads: ['wl-crm-platform', 'wl-finance-api', 'wl-sap-cpi-adapter'],
        estimatedDurationDays: 56,
        riskLevel: 'medium',
        requiredApprovals: 2,
        rollbackStrategy: 'Blue-green cutback via weighted routing; data sync validated before cutover window',
        carbonSavingKgCO2ePerMonth: 61.2,
        status: 'planned',
        progress: 0,
        tenantId: 'tenant-main',
      },
      {
        id: 'phase-3',
        name: 'Phase 3 — Legacy Decommission',
        description: 'Final cutover for legacy ERP databases and HR systems. On-premises VMs decommissioned after 30-day hypercare period with daily snapshots.',
        targetWorkloads: ['wl-erp-database', 'wl-hr-legacy', 'wl-data-warehouse'],
        estimatedDurationDays: 42,
        riskLevel: 'high',
        requiredApprovals: 3,
        rollbackStrategy: 'Full restore from automated daily snapshots to Azure Stack HCI; RTO < 4 hours',
        carbonSavingKgCO2ePerMonth: 84.6,
        status: 'planned',
        progress: 0,
        tenantId: 'tenant-main',
      },
    ]);
    logger.info('Seeded migration_phases');
  }

  if (readTable('workloads').length === 0) {
    writeTable('workloads', [
      { id: 'wl-customer-portal',  name: 'Customer Portal',       type: 'web-app',     environment: 'on-prem', status: 'planned', cpuCores: 4,  memoryGB: 8,   diskGB: 100,  carbonKgCO2ePerMonth: 8.2,  migrationPhase: 'phase-1', tenantId: 'tenant-main' },
      { id: 'wl-auth-service',     name: 'Authentication Service', type: 'api-service', environment: 'on-prem', status: 'planned', cpuCores: 2,  memoryGB: 4,   diskGB: 50,   carbonKgCO2ePerMonth: 3.1,  migrationPhase: 'phase-1', tenantId: 'tenant-main' },
      { id: 'wl-notification-hub', name: 'Notification Hub',       type: 'api-service', environment: 'on-prem', status: 'planned', cpuCores: 2,  memoryGB: 4,   diskGB: 40,   carbonKgCO2ePerMonth: 2.7,  migrationPhase: 'phase-1', tenantId: 'tenant-main' },
      { id: 'wl-crm-platform',     name: 'CRM Platform',           type: 'web-app',     environment: 'on-prem', status: 'planned', cpuCores: 8,  memoryGB: 32,  diskGB: 500,  carbonKgCO2ePerMonth: 18.4, migrationPhase: 'phase-2', tenantId: 'tenant-main' },
      { id: 'wl-finance-api',      name: 'Finance API',            type: 'api-service', environment: 'on-prem', status: 'planned', cpuCores: 4,  memoryGB: 16,  diskGB: 200,  carbonKgCO2ePerMonth: 11.2, migrationPhase: 'phase-2', tenantId: 'tenant-main' },
      { id: 'wl-sap-cpi-adapter',  name: 'SAP CPI Adapter',        type: 'integration', environment: 'on-prem', status: 'planned', cpuCores: 4,  memoryGB: 8,   diskGB: 100,  carbonKgCO2ePerMonth: 6.8,  migrationPhase: 'phase-2', tenantId: 'tenant-main' },
      { id: 'wl-erp-database',     name: 'ERP Database',           type: 'database',    environment: 'on-prem', status: 'planned', cpuCores: 16, memoryGB: 64,  diskGB: 2000, carbonKgCO2ePerMonth: 42.1, migrationPhase: 'phase-3', tenantId: 'tenant-main' },
      { id: 'wl-hr-legacy',        name: 'HR Legacy System',       type: 'legacy-vm',   environment: 'on-prem', status: 'planned', cpuCores: 8,  memoryGB: 16,  diskGB: 800,  carbonKgCO2ePerMonth: 22.6, migrationPhase: 'phase-3', tenantId: 'tenant-main' },
      { id: 'wl-data-warehouse',   name: 'Data Warehouse',         type: 'database',    environment: 'on-prem', status: 'planned', cpuCores: 16, memoryGB: 128, diskGB: 5000, carbonKgCO2ePerMonth: 38.4, migrationPhase: 'phase-3', tenantId: 'tenant-main' },
    ]);
    logger.info('Seeded workloads');
  }

  if (readTable('clusters').length === 0) {
    writeTable('clusters', [
      { id: 'cluster-hci-01',  name: 'Frankfurt HCI Cluster',  type: 'azure-stack-hci', location: 'Frankfurt DC', nodes: 5, status: 'healthy', arcManaged: true },
      { id: 'cluster-aks-01',  name: 'Azure West Europe (AKS)', type: 'aks',             location: 'West Europe',  nodes: 4, status: 'healthy', arcManaged: true },
      { id: 'cluster-aks-dr',  name: 'Azure North Europe (DR)', type: 'aks',             location: 'North Europe', nodes: 3, status: 'standby', arcManaged: true },
    ]);
    logger.info('Seeded clusters');
  }

  if (readTable('nodes').length === 0) {
    const nodes = [
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `node-hci-${String(i + 1).padStart(2, '0')}`,
        name: `hci-node-${i + 1}.frankfurt.internal`,
        clusterId: 'cluster-hci-01',
        type: 'on-prem',
        status: 'healthy',
        arcManaged: true,
        os: 'Windows Server 2022 Datacenter',
        cpu: 0, memory: 0, disk: 0,
      })),
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `node-aks-weu-${String(i + 1).padStart(2, '0')}`,
        name: `aks-weu-node-${i + 1}`,
        clusterId: 'cluster-aks-01',
        type: 'cloud',
        status: i === 3 ? 'warning' : 'healthy',
        arcManaged: true,
        os: 'Ubuntu 22.04 LTS',
        cpu: 0, memory: 0, disk: 0,
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `node-aks-neu-${String(i + 1).padStart(2, '0')}`,
        name: `aks-neu-node-${i + 1}`,
        clusterId: 'cluster-aks-dr',
        type: 'cloud',
        status: 'healthy',
        arcManaged: true,
        os: 'Ubuntu 22.04 LTS',
        cpu: 0, memory: 0, disk: 0,
      })),
    ];
    writeTable('nodes', nodes);
    logger.info('Seeded nodes');
  }

  if (readTable('carbon_baselines').length === 0) {
    writeTable('carbon_baselines', [{
      id: 'baseline-main',
      tenantId: 'tenant-main',
      year: 2023,
      totalKgCO2ePerYear: 374800,
      avgKgCO2ePerHour: 42.8,
      dcPowerKW: 168.4,
      notes: 'Full on-premises baseline before hybrid-cloud migration',
    }]);
    logger.info('Seeded carbon_baselines');
  }
};

module.exports = seed;
