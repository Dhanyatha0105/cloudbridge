import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInfraOverview, fetchClusters, fetchNodes, fetchCompliance } from '../store/slices/infrastructureSlice';
import { Server, Cloud, HardDrive, Activity, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';

const UtilBar = ({ value, color = 'bg-atos-blue' }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full ${value > 80 ? 'bg-red-500' : value > 60 ? 'bg-amber-500' : color}`} style={{ width: `${value}%` }} />
    </div>
    <span className="text-xs text-gray-500 w-8 text-right">{value}%</span>
  </div>
);

export default function InfrastructurePage() {
  const dispatch = useDispatch();
  const { overview, clusters, nodes, compliance } = useSelector(s => s.infrastructure);

  useEffect(() => {
    dispatch(fetchInfraOverview());
    dispatch(fetchClusters());
    dispatch(fetchNodes());
    dispatch(fetchCompliance());
  }, [dispatch]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-atos-dark">Infrastructure — Azure Arc</h2>
        <p className="text-sm text-gray-500 mt-0.5">Azure Arc control plane · Azure Stack HCI on-prem · Unified hybrid management</p>
      </div>

      {/* Overview KPIs */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Clusters', value: overview.totalClusters, icon: Cloud, color: 'text-atos-blue bg-blue-50' },
            { label: 'Managed Nodes', value: overview.totalNodes, icon: Server, color: 'text-purple-600 bg-purple-50' },
            { label: 'Arc Managed', value: overview.azureArcManaged, icon: Activity, color: 'text-atos-cyan bg-cyan-50' },
            { label: 'Hybrid Utilization', value: `${overview.hybridUtilization}%`, icon: HardDrive, color: 'text-teal-600 bg-teal-50' },
            { label: 'Healthy Nodes', value: `${overview.healthyNodes}/${overview.totalNodes}`, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${color}`}>
                <Icon size={18} />
              </div>
              <p className="stat-value">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Clusters */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Clusters</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {['Cluster', 'Type', 'Location', 'Nodes', 'Workloads', 'Status'].map(h => (
                  <th key={h} className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clusters.map(cluster => (
                <tr key={cluster.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-800">{cluster.name}</td>
                  <td className="py-3">
                    <span className={cluster.type === 'azure-stack-hci' ? 'badge-blue' : 'badge-green'}>
                      {cluster.type}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{cluster.location}</td>
                  <td className="py-3 text-gray-700">{cluster.nodes}</td>
                  <td className="py-3 text-gray-700">{cluster.workloads}</td>
                  <td className="py-3">
                    <span className={cluster.status === 'healthy' ? 'badge-green' : 'badge-gray'}>{cluster.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nodes grid */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Node Resource Utilization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map(node => (
            <div key={node.id} className={`border rounded-xl p-4 ${node.status === 'warning' ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-white'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {node.status === 'warning' ? <AlertTriangle size={14} className="text-amber-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                  <span className="text-sm font-medium text-gray-800">{node.name}</span>
                </div>
                <span className={node.type === 'on-prem' ? 'badge-blue' : 'badge-green'}>{node.type}</span>
              </div>
              <div className="space-y-2">
                <div><p className="text-xs text-gray-500 mb-1">CPU</p><UtilBar value={node.cpu} /></div>
                <div><p className="text-xs text-gray-500 mb-1">Memory</p><UtilBar value={node.memory} /></div>
                <div><p className="text-xs text-gray-500 mb-1">Disk</p><UtilBar value={node.disk} color="bg-purple-500" /></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{node.arcManaged && '⚡ Arc Managed · '}{node.os}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance */}
      {compliance && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-atos-blue" />
            <h3 className="font-semibold text-gray-800">Zero Trust Compliance</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Zero Trust Score', value: `${compliance.zeroTrustScore}%`, ok: compliance.zeroTrustScore > 90 },
              { label: 'Patch Compliance', value: `${compliance.patchCompliancePercent}%`, ok: true },
              { label: 'Encrypted Volumes', value: `${compliance.encryptedVolumesPercent}%`, ok: true },
              { label: 'Open Findings', value: compliance.openFindings, ok: compliance.criticalFindings === 0 },
            ].map(({ label, value, ok }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold ${ok ? 'text-emerald-600' : 'text-amber-500'}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="font-semibold text-atos-blue text-xs">Data Residency</p>
              <p className="text-gray-700 mt-1">{compliance.sovereigntyControls?.dataResidency}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="font-semibold text-emerald-700 text-xs">Vendor Lock-In Risk</p>
              <p className="text-gray-700 mt-1 capitalize">{compliance.sovereigntyControls?.vendorLockInRisk}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="font-semibold text-purple-700 text-xs">Open Standards</p>
              <p className="text-gray-700 mt-1">{compliance.sovereigntyControls?.openStandards ? 'Enforced' : 'Partial'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
