import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPhases, startPhase, rollbackPhase } from '../store/slices/migrationSlice';
import { Play, RotateCcw, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const RISK_COLORS = { low: 'badge-green', medium: 'badge-amber', high: 'badge-red' };

const StatusIcon = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 size={16} className="text-emerald-500" />;
  if (status === 'running') return <Loader2 size={16} className="text-atos-blue animate-spin" />;
  if (status === 'rolled_back') return <AlertTriangle size={16} className="text-amber-500" />;
  return <Clock size={16} className="text-gray-400" />;
};

export default function MigrationPage() {
  const dispatch = useDispatch();
  const { phases, loading } = useSelector(s => s.migration);
  const { user } = useSelector(s => s.auth);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { dispatch(fetchPhases()); }, [dispatch]);

  // Poll running phases
  useEffect(() => {
    const hasRunning = phases.some(p => p.status === 'running');
    if (!hasRunning) return;
    const interval = setInterval(() => dispatch(fetchPhases()), 3000);
    return () => clearInterval(interval);
  }, [phases, dispatch]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-atos-dark">Migration Engine</h2>
        <p className="text-sm text-gray-500 mt-0.5">Phased low-risk workload migration · Blue-green rollback support</p>
      </div>

      {/* Overall progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Overall Progress</h3>
          <span className="text-sm text-gray-500">3 phases · 47 workloads</span>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: 'Completed', value: phases.filter(p => p.status === 'completed').length, color: 'text-emerald-600' },
            { label: 'Running', value: phases.filter(p => p.status === 'running').length, color: 'text-atos-blue' },
            { label: 'Planned', value: phases.filter(p => p.status === 'planned' || !p.status).length, color: 'text-gray-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center bg-gray-50 rounded-xl p-4">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          {phases.length > 0 && (
            <div
              className="bg-gradient-to-r from-atos-blue to-atos-cyan h-3 rounded-full transition-all duration-700"
              style={{ width: `${Math.round(phases.filter(p => p.status === 'completed').length / phases.length * 100)}%` }}
            />
          )}
        </div>
      </div>

      {/* Phases */}
      {loading && phases.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="animate-spin mr-2" size={20} /> Loading migration phases...
        </div>
      ) : (
        <div className="space-y-4">
          {phases.map((phase) => (
            <div key={phase.id} className="card-hover">
              <div className="flex items-center gap-4">
                <StatusIcon status={phase.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800 text-sm">{phase.name}</h3>
                    <span className={RISK_COLORS[phase.riskLevel]}>{phase.riskLevel} risk</span>
                    <span className={
                      phase.status === 'completed' ? 'badge-green' :
                      phase.status === 'running' ? 'badge-blue' :
                      phase.status === 'rolled_back' ? 'badge-amber' : 'badge-gray'
                    }>{phase.status || 'planned'}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{phase.description}</p>
                </div>

                {/* Progress bar */}
                {(phase.status === 'running' || phase.status === 'completed') && (
                  <div className="hidden md:block w-32">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-atos-blue h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${phase.progress || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 text-right mt-0.5">{phase.progress || 0}%</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {(phase.status === 'planned' || !phase.status) && (user?.role === 'admin' || user?.role === 'engineer') && (
                    <button onClick={() => dispatch(startPhase(phase.id))} className="btn-primary flex items-center gap-1.5">
                      <Play size={12} /> Start
                    </button>
                  )}
                  {phase.status === 'running' && user?.role === 'admin' && (
                    <button onClick={() => dispatch(rollbackPhase(phase.id))} className="btn-danger flex items-center gap-1.5">
                      <RotateCcw size={12} /> Rollback
                    </button>
                  )}
                  <button onClick={() => setExpanded(expanded === phase.id ? null : phase.id)} className="text-gray-400 hover:text-gray-600">
                    {expanded === phase.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === phase.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Target Workloads</p>
                    <div className="space-y-1">
                      {phase.targetWorkloads?.map(wl => (
                        <span key={wl} className="inline-block badge-blue mr-1 mb-1">{wl}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rollback Strategy</p>
                    <p className="text-xs text-gray-600">{phase.rollbackStrategy}</p>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-1">Duration</p>
                    <p className="text-xs text-gray-600">{phase.estimatedDuration}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sustainability Gain</p>
                    <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">{phase.sustainabilityGain}</p>
                    {phase.logs?.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Recent Logs</p>
                        <div className="space-y-1 max-h-20 overflow-y-auto scrollbar-thin">
                          {phase.logs.slice(-3).map((log, i) => (
                            <p key={i} className="text-xs text-gray-500 font-mono">{log.msg}</p>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
