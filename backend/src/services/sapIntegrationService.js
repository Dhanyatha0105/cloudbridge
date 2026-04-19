const axios = require('axios');
const { upsert, findAll } = require('../config/database');
const logger = require('../utils/logger');

// SAP BTP token cache — OAuth 2.0 Client Credentials flow
let _tokenCache = null;

const _getSapToken = async () => {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) return _tokenCache.token;

  const tokenUrl = process.env.SAP_TOKEN_URL;
  const clientId = process.env.SAP_CLIENT_ID;
  const clientSecret = process.env.SAP_CLIENT_SECRET;

  if (!tokenUrl || !clientId || !clientSecret) {
    // Not configured — record status but do not crash
    logger.warn('SAP BTP credentials not configured; integration running in disconnected mode');
    return null;
  }

  try {
    const resp = await axios.post(tokenUrl, 'grant_type=client_credentials', {
      auth: { username: clientId, password: clientSecret },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 8000,
    });
    _tokenCache = {
      token: resp.data.access_token,
      expiresAt: Date.now() + (resp.data.expires_in - 60) * 1000,
    };
    logger.info('SAP BTP token refreshed');
    return _tokenCache.token;
  } catch (err) {
    logger.error('SAP BTP token fetch failed', { error: err.message });
    throw Object.assign(new Error('SAP BTP authentication failed'), { status: 502 });
  }
};

const getConnectionStatus = async () => {
  const configured = !!(process.env.SAP_TOKEN_URL && process.env.SAP_CLIENT_ID);
  const status = {
    btpConfigured: configured,
    cpiConfigured: !!process.env.SAP_CPI_HOST,
    host: process.env.SAP_BTP_HOST || null,
    lastChecked: new Date().toISOString(),
    integrationSuiteVersion: '2.0.1',
  };

  if (configured) {
    try {
      await _getSapToken();
      status.btpConnected = true;
    } catch {
      status.btpConnected = false;
    }
  } else {
    status.btpConnected = false;
    status.note = 'Set SAP_BTP_HOST, SAP_CLIENT_ID, SAP_CLIENT_SECRET, SAP_TOKEN_URL to connect';
  }

  return status;
};

const getIntegrationFlows = async () => {
  // Return persisted flow definitions — updated by triggerFlow calls
  const persisted = findAll('integration_flows');
  if (persisted.length > 0) return persisted;

  // Initial definitions — no mock data, just config-time known iFlows
  const defaults = [
    { id: 'iflow-workload-sync', name: 'Workload Migration Status → SAP Maintenance (XSLT)', status: 'configured', lastRun: null, messages24h: 0, errorRate: 0 },
    { id: 'iflow-carbon-analytics', name: 'Carbon Telemetry → SAP Analytics Cloud (Groovy)', status: 'configured', lastRun: null, messages24h: 0, errorRate: 0 },
    { id: 'iflow-snow-maintenance', name: 'ServiceNow Incident → SAP PM Order (ODATA)', status: 'configured', lastRun: null, messages24h: 0, errorRate: 0 },
    { id: 'iflow-inventory-sftp', name: 'Inventory SFTP → SAP ERP Material Master (B2B EDI)', status: 'configured', lastRun: null, messages24h: 0, errorRate: 0 },
    { id: 'iflow-hr-successfactors', name: 'HR Legacy Export → SAP SuccessFactors (Groovy/XSLT)', status: 'pending-config', lastRun: null, messages24h: 0, errorRate: 0 },
  ];
  defaults.forEach(f => upsert('integration_flows', f));
  return defaults;
};

const triggerFlow = async (flowId, payload) => {
  const token = await _getSapToken();
  const cpiHost = process.env.SAP_CPI_HOST;

  // Persist trigger attempt regardless of outcome
  const run = {
    id: `run-${Date.now()}`,
    flowId,
    triggeredAt: new Date().toISOString(),
    payload: payload ? JSON.stringify(payload).substring(0, 500) : null,
    status: 'pending',
  };
  upsert('flow_runs', run);

  if (token && cpiHost) {
    try {
      await axios.post(`${cpiHost}/api/v1/MessageProcessingLogs`, payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      upsert('flow_runs', { ...run, status: 'triggered' });
      logger.info('SAP CPI flow triggered', { flowId });
    } catch (err) {
      upsert('flow_runs', { ...run, status: 'failed', error: err.message });
      logger.error('SAP CPI flow trigger failed', { flowId, error: err.message });
      throw Object.assign(new Error(`CPI flow trigger failed: ${err.message}`), { status: 502 });
    }
  } else {
    // Not connected — record as queued for when credentials are configured
    upsert('flow_runs', { ...run, status: 'queued' });
    logger.info('SAP flow queued (BTP not configured)', { flowId });
  }

  return upsert('flow_runs', { ...run });
};

const getFlowRuns = async (params = {}) => {
  let runs = findAll('flow_runs');
  if (params.flowId) runs = runs.filter(r => r.flowId === params.flowId);
  if (params.status) runs = runs.filter(r => r.status === params.status);
  return runs
    .sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt))
    .slice(0, params.limit || 50);
};

// Groovy-equivalent XSLT transformation (runs in-process for non-BTP environments)
const transformPayload = async (payload, mappingType) => {
  switch (mappingType) {
    case 'workload-to-sap-maintenance':
      return {
        MaintenanceNotification: {
          ExternalRef: payload.id,
          ShortText: `Workload migration: ${payload.name} [${payload.status}]`,
          Priority: payload.riskLevel === 'high' ? 1 : payload.riskLevel === 'medium' ? 2 : 3,
          FunctionalLocation: (payload.environment || 'CLOUD').toUpperCase(),
          DPlusFlag: true,
          CO2KgPerMonth: payload.carbonKgCO2ePerMonth,
          MigrationPhase: payload.migrationPhase,
        },
      };
    case 'carbon-to-sac':
      return {
        CarbonReport: {
          Timestamp: new Date().toISOString(),
          TotalEmissionsKgCO2ePerHour: payload.currentKgCO2ePerHour,
          BaselineKgCO2ePerHour: payload.baselineKgCO2ePerHour,
          ReductionPct: payload.reductionPercent,
          GHGProtocolScope: 1,
          DPlusCompliant: true,
          DataResidency: 'EU',
        },
      };
    case 'incident-to-pm-order':
      return {
        PMOrder: {
          ExternalIncidentId: payload.id,
          OrderType: 'PM01',
          ShortDescription: payload.title,
          Priority: { critical: 1, high: 2, medium: 3, low: 4 }[payload.priority] ?? 4,
          PlannerGroup: 'CLOUD-OPS',
          RequestedStartDate: new Date().toISOString().split('T')[0],
        },
      };
    default:
      throw Object.assign(new Error(`Unknown mapping type: ${mappingType}`), { status: 400 });
  }
};

module.exports = { getConnectionStatus, getIntegrationFlows, triggerFlow, getFlowRuns, transformPayload };
