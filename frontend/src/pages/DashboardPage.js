import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMigrationStatus } from '../store/slices/migrationSlice';
import { fetchCurrentEmissions, fetchCarbonSavings } from '../store/slices/carbonSlice';
import { fetchInfraOverview } from '../store/slices/infrastructureSlice';
import { fetchSapStatus } from '../store/slices/integrationSlice';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import { Leaf, Server, GitBranch, Plug, TrendingDown, Zap, Loader2 } from 'lucide-react';

const PIE_COLORS = { migrated: '#10B981', 'in-progress': '#F59E0B', planned: '#E5E7EB' };

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { status: migStatus } = useSelector(s => s.migration);
  const { current: carbonCurrent, savings, history } = useSelector(s => s.carbon);
  const { overview } = useSelector(s => s.infrastructure);
  const { sapStatus } = useSelector(s => s.integration);

  useEffect(() => {
    dispatch(fetchMigrationStatus());
    dispatch(fetchCurrentEmissions());
    dispatch(fetchCarbonSavings());
    dispatch(fetchInfraOverview());
    dispatch(fetchSapStatus());
  }, [dispatch]);

  const migrationPieData = migStatus
    ? [
        { name: 'Migrated',     value: migStatus.migratedWorkloads,  color: PIE_COLORS.migrated },
        { name: 'In Progress',  value: migStatus.inProgressWorkloads, color: PIE_COLORS['in-progress'] },
        { name: 'Planned',      value: migStatus.totalWorkloads - migStatus.migratedWorkloads - migStatus.inProgressWorkloads, color: PIE_COLORS.planned },
      ].filter(d => d.value > 0)
    : [];

  const kpis = [
    {
      label: 'Carbon Reduction',
      value: carbonCurrent ? `${carbonCurrent.reductionPercent}%` : '—',
      sub: 'vs 2023 baseline',
      icon: Leaf,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Workloads Migrated',
      value: migStatus ? `${migStatus.migrationPercent ?? migStatus.overallProgress}%` : '—',
      sub: migStatus ? `${migStatus.migratedWorkloads} of ${migStatus.totalWorkloads}` : 'Loading...',
      icon: GitBranch,
      color: 'text-atos-blue',
      bg: 'bg-blue-50',
    },
    {
      label: 'Infrastructure Nodes',
      value: overview?.totalNodes ?? '—',
      sub: overview ? `${overview.onPremNodes} on-prem · ${overview.cloudNodes} cloud` : 'Loading...',
      icon: Server,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'SAP Integration',
      value: sapStatus?.btpConnected ? 'Connected' : sapStatus?.btpConfigured ? 'Connecting' : 'Not configured',
      sub: sapStatus?.btpConnected ? 'BTP Elite Partner' : 'Set SAP_BTP_HOST to connect',
      icon: Plug,
      color: sapStatus?.btpConnected ? 'text-orange-600' : 'text-gray-400',
      bg: sapStatus?.btpConnected ? 'bg-orange-50' : 'bg-gray-50',
    },
    {
      label: 'CO₂ Saved This Year',
      value: savings ? `${(savings.totalSavingsKgCO2eThisYear / 1000).toFixed(1)}t` : '—',
      sub: 'kgCO₂e vs baseline',
      icon: TrendingDown,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      label: 'DC Power Draw',
      value: carbonCurrent ? `${carbonCurrent.dcPowerKW} kW` : '—',
      sub: carbonCurrent?.dataSource === 'iot-sensor' ? 'Live IoT sensor' : 'Workload model',
      icon: Zap,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-atos-dark">Platform Overview</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Hybrid-cloud modernisation · Atos D+ sustainability tracking
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className={`w-9 h-9 ${bg} ${color} rounded-lg flex items-center justify-center mb-2`}>
              <Icon size={18} />
            </div>
            <p className="stat-value">{value}</p>
            <p className="text-xs font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Emissions trend from real history */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">CO₂ Emission Trend</h3>
              <p className="text-xs text-gray-400">
                {history.length > 0 && history[0].source === 'modelled'
                  ? 'Workload-modelled — connect IoT sensors for live data'
                  : 'kgCO₂e/hour · D+ Initiative'}
              </p>
            </div>
            {carbonCurrent && (
              <span className="badge-green">-{carbonCurrent.reductionPercent}% vs baseline</span>
            )}
          </div>
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-gray-400 gap-2">
              <Loader2 size={16} className="animate-spin" /> Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="emissionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 10 }}
                  tickFormatter={v => {
                    const d = new Date(v);
                    return `${d.getHours()}:00`;
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={v => [`${v} kgCO₂e/h`]}
                  labelFormatter={v => new Date(v).toLocaleString()}
                />
                {history[0]?.baseline && (
                  <Area
                    type="monotone"
                    dataKey="baseline"
                    stroke="#E5E7EB"
                    strokeDasharray="4 4"
                    fill="none"
                    name="Baseline"
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="kgCO2e"
                  stroke="#10B981"
                  fill="url(#emissionGrad)"
                  strokeWidth={2}
                  name="Actual"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Migration donut from real state */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-1">Migration Progress</h3>
          <p className="text-xs text-gray-400 mb-4">
            {migStatus ? `${migStatus.totalWorkloads} workloads · ${migStatus.totalPhases} phases` : 'Loading...'}
          </p>
          {migrationPieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 gap-2">
              <Loader2 size={16} className="animate-spin" />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={migrationPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {migrationPieData.map(({ name, color }) => (
                      <Cell key={name} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {migrationPieData.map(({ name, value, color }) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-gray-600">{name}</span>
                    </div>
                    <span className="font-medium text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Platform health — real connection/data state */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Platform Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Hybrid Infrastructure',
              detail: overview
                ? `${overview.healthyNodes}/${overview.totalNodes} nodes healthy`
                : 'Connecting...',
              status: overview ? (overview.alertingNodes === 0 ? 'healthy' : 'warning') : 'unknown',
            },
            {
              label: 'Security Posture',
              detail: 'Zero Trust · PGP · EU data residency',
              status: 'healthy',
            },
            {
              label: 'SAP Integration',
              detail: sapStatus?.btpConnected
                ? 'BTP connected · iFlows running'
                : 'Awaiting credentials',
              status: sapStatus?.btpConnected ? 'healthy' : 'pending',
            },
            {
              label: 'Carbon Monitoring',
              detail: carbonCurrent
                ? `${carbonCurrent.dataSource === 'iot-sensor' ? 'Live IoT' : 'Workload model'} · ${carbonCurrent.reductionPercent}% below baseline`
                : 'Connecting...',
              status: carbonCurrent ? 'healthy' : 'unknown',
            },
          ].map(({ label, detail, status }) => {
            const dot = { healthy: 'bg-emerald-500', warning: 'bg-amber-500', pending: 'bg-blue-400', unknown: 'bg-gray-300' }[status];
            return (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <p className="text-sm font-semibold text-atos-dark">{label}</p>
                </div>
                <p className="text-xs text-gray-500">{detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
