import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentEmissions, fetchEmissionHistory, fetchCarbonSavings, fetchWorkloadEmissions } from '../store/slices/carbonSlice';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend
} from 'recharts';
import { Leaf, Thermometer, Cpu, Laptop, Target, TrendingDown } from 'lucide-react';

export default function CarbonPage() {
  const dispatch = useDispatch();
  const { current, history, savings, workloads } = useSelector(s => s.carbon);

  useEffect(() => {
    dispatch(fetchCurrentEmissions());
    dispatch(fetchEmissionHistory({ resolution: 'hour' }));
    dispatch(fetchCarbonSavings());
    dispatch(fetchWorkloadEmissions());
  }, [dispatch]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-atos-dark">Carbon Tracker — D+ Initiative</h2>
          <p className="text-sm text-gray-500 mt-0.5">IoT-driven real-time CO₂ monitoring · Atos Decarbonization Plus</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium">
          <Leaf size={16} />
          Net Zero Target: 2050
        </div>
      </div>

      {/* Current emissions hero */}
      {current && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card col-span-1 bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-none">
            <p className="text-sm opacity-80">Current Emissions</p>
            <p className="text-4xl font-bold mt-1">{current.currentKgCO2ePerHour}</p>
            <p className="text-sm opacity-80">kgCO₂e/hour</p>
            <div className="mt-3 bg-white/20 rounded-lg px-3 py-2">
              <p className="text-sm font-semibold">-{current.reductionPercent}% vs baseline</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="w-9 h-9 bg-blue-50 text-atos-blue rounded-lg flex items-center justify-center mb-2">
              <Target size={18} />
            </div>
            <p className="stat-value">{current.baselineKgCO2ePerHour}</p>
            <p className="text-xs font-medium text-gray-700">Baseline (2023)</p>
            <p className="text-xs text-gray-400">kgCO₂e/hour</p>
          </div>
          <div className="stat-card">
            <div className="w-9 h-9 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center mb-2">
              <TrendingDown size={18} />
            </div>
            <p className="stat-value">{savings?.totalSavingsKgCO2eThisYear?.toLocaleString()}</p>
            <p className="text-xs font-medium text-gray-700">CO₂ Saved This Year</p>
            <p className="text-xs text-gray-400">kgCO₂e total</p>
          </div>
          <div className="stat-card">
            <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-2">
              <Laptop size={18} />
            </div>
            <p className="stat-value">{savings?.remanufacturedDevicesTracked}</p>
            <p className="text-xs font-medium text-gray-700">Remanufactured Devices</p>
            <p className="text-xs text-gray-400">{savings?.refurbishedDevicesCO2Saved} kgCO₂ saved</p>
          </div>
        </div>
      )}

      {/* Emission sources */}
      {current?.sources && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Emission Sources — Live IoT Feed</h3>
          <div className="space-y-3">
            {current.sources.map(({ source, kgCO2ePerHour, percent }) => (
              <div key={source} className="flex items-center gap-3">
                <p className="text-sm text-gray-700 w-40 shrink-0">{source}</p>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-atos-blue to-atos-cyan"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 w-28 text-right shrink-0">{kgCO2ePerHour} kgCO₂e/h ({percent}%)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical chart */}
      {history.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-1">24-Hour Emissions History</h3>
          <p className="text-xs text-gray-400 mb-4">Hourly kgCO₂e — green fill shows cloud efficiency gains</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} tickFormatter={v => new Date(v).getHours() + ':00'} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} kgCO₂e/h`]} labelFormatter={v => new Date(v).toLocaleTimeString()} />
              <Area type="monotone" dataKey="baseline" stroke="#E5E7EB" strokeDasharray="4 4" fill="none" name="Baseline" />
              <Area type="monotone" dataKey="kgCO2e" stroke="#10B981" fill="url(#histGrad)" strokeWidth={2} name="Actual" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Workload emissions */}
      {workloads.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Carbon by Workload</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={workloads} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="workload" tick={{ fontSize: 11 }} width={140} />
              <Tooltip formatter={(v) => [`${v} kgCO₂e/mo`]} />
              <Bar dataKey="kgCO2ePerMonth" name="CO₂/month" radius={[0, 4, 4, 0]}
                fill="#003189" label={{ position: 'right', fontSize: 10, formatter: v => `${v}kg` }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Net Zero trajectory */}
      {savings?.netZeroTrajectory && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Net Zero Trajectory — 2050</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { year: '2023', value: savings.netZeroTrajectory.baseline2023, label: 'Baseline' },
              { year: '2026', value: savings.netZeroTrajectory.current2026, label: 'Current' },
              { year: '2030', value: savings.netZeroTrajectory.target2030, label: 'Target' },
              { year: '2040', value: Math.round(savings.netZeroTrajectory.target2030 * 0.6), label: 'Forecast' },
              { year: '2050', value: 0, label: 'Net Zero' },
            ].map(({ year, value, label }) => (
              <div key={year} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-atos-dark">{value === 0 ? '0' : (value / 1000).toFixed(0) + 'K'}</p>
                <p className="text-xs text-gray-500">kgCO₂e/yr</p>
                <p className="text-xs font-semibold text-atos-blue mt-1">{year}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full" style={{ width: '20%' }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">20% of Net Zero journey complete · On track for 2050 target</p>
        </div>
      )}
    </div>
  );
}
