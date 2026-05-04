import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSapStatus, fetchIntegrationFlows, fetchMessageLogs, fetchServiceNowStatus } from '../store/slices/integrationSlice';
import { Plug, Play, CheckCircle2, XCircle, Clock, RefreshCw, Loader2 } from 'lucide-react';
import api from '../utils/api';

export default function IntegrationPage() {
  const dispatch = useDispatch();
  const { sapStatus, flows, messages, snowStatus, loading } = useSelector(s => s.integration);
  const [triggering, setTriggering] = useState(null);

  useEffect(() => {
    dispatch(fetchSapStatus());
    dispatch(fetchIntegrationFlows());
    dispatch(fetchMessageLogs());
    dispatch(fetchServiceNowStatus());
  }, [dispatch]);

  const triggerFlow = async (flowId) => {
    setTriggering(flowId);
    try {
      await api.post(`/integration/sap/flows/${flowId}/trigger`);
      dispatch(fetchMessageLogs());
    } finally {
      setTriggering(null);
    }
  };

  const statusIcon = (status) => {
    if (status === 'COMPLETED') return <CheckCircle2 size={14} className="text-emerald-500" />;
    if (status === 'FAILED') return <XCircle size={14} className="text-red-500" />;
    return <Clock size={14} className="text-amber-500" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-atos-dark">SAP BTP / CPI · ServiceNow AI Ignite</h2>
        <p className="text-sm text-gray-500 mt-0.5">Elite Partner platform integration · ODATA · Groovy · XSLT transformations</p>
      </div>

      {/* Connection status row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SAP BTP */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Plug size={16} className="text-atos-blue" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">SAP BTP / CPI</p>
                <p className="text-xs text-gray-400">Integration Suite {sapStatus?.integrationSuiteVersion}</p>
              </div>
            </div>
            {sapStatus?.btpConnected
              ? <span className="badge-green">Connected</span>
              : <span className="badge-red">Disconnected</span>}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-lg font-bold text-atos-dark">{sapStatus?.odataServicesAvailable || 7}</p>
              <p className="text-xs text-gray-500">ODATA Services</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-lg font-bold text-atos-dark">{flows.length}</p>
              <p className="text-xs text-gray-500">iFlows</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-2">
              <p className="text-xs font-bold text-emerald-700 leading-tight">Elite Partner</p>
              <p className="text-xs text-emerald-600">Active</p>
            </div>
          </div>
        </div>

        {/* ServiceNow */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <RefreshCw size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">ServiceNow AI Ignite</p>
                <p className="text-xs text-gray-400">v{snowStatus?.aiIgnite?.version || '2.4.1'}</p>
              </div>
            </div>
            {snowStatus?.connected
              ? <span className="badge-green">Connected</span>
              : <span className="badge-gray">Loading...</span>}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-lg font-bold text-atos-dark">{snowStatus?.openTickets || 12}</p>
              <p className="text-xs text-gray-500">Open Tickets</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-lg font-bold text-atos-dark">AI</p>
              <p className="text-xs text-gray-500">Ignite Active</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2">
              <p className="text-xs font-bold text-amber-700 leading-tight">Elite Partner</p>
              <p className="text-xs text-amber-600">Platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Flows */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">SAP CPI Integration Flows (iFlows)</h3>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-4"><Loader2 className="animate-spin" size={16} />Loading flows...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Flow Name', 'Status', '24h Messages', 'Error Rate', 'Last Run', 'Action'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {flows.map(flow => (
                  <tr key={flow.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-800 max-w-xs">
                      <p className="truncate">{flow.name}</p>
                    </td>
                    <td className="py-3">
                      <span className={flow.status === 'started' ? 'badge-green' : 'badge-gray'}>{flow.status}</span>
                    </td>
                    <td className="py-3 text-gray-600">{flow.messages24h.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={flow.errorRate > 0.02 ? 'text-amber-500' : 'text-emerald-600'}>
                        {(flow.errorRate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">{new Date(flow.lastRun).toLocaleTimeString()}</td>
                    <td className="py-3">
                      <button
                        onClick={() => triggerFlow(flow.id)}
                        disabled={triggering === flow.id || flow.status === 'stopped'}
                        className="flex items-center gap-1 text-xs text-atos-blue hover:text-blue-800 disabled:opacity-40"
                      >
                        {triggering === flow.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                        Trigger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Processing Logs */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Message Processing Log</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
          {messages.map((msg, i) => (
            <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 text-sm">
              {statusIcon(msg.status)}
              <span className="font-mono text-xs text-gray-400 w-40 shrink-0">{msg.messageId}</span>
              <span className={`text-xs w-24 shrink-0 ${msg.status === 'COMPLETED' ? 'text-emerald-600' : msg.status === 'FAILED' ? 'text-red-500' : 'text-amber-500'}`}>
                {msg.status}
              </span>
              <span className="text-gray-600 text-xs flex-1 truncate">{msg.sender} → {msg.receiver}</span>
              <span className="text-gray-400 text-xs shrink-0">{msg.duration}ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
