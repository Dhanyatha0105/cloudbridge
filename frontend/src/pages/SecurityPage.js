import React, { useState } from 'react';
import { Shield, Lock, Key, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

export default function SecurityPage() {
  const [transformTester, setTransformTester] = useState({ input: '', output: null, loading: false, error: null });

  const runTransformTest = async () => {
    setTransformTester(v => ({ ...v, loading: true, error: null }));
    try {
      const parsed = JSON.parse(transformTester.input);
      const { data } = await api.post('/integration/sap/transform', {
        payload: parsed,
        mappingType: 'workload-to-sap-maintenance',
      });
      setTransformTester(v => ({ ...v, output: JSON.stringify(data, null, 2), loading: false }));
    } catch (e) {
      setTransformTester(v => ({
        ...v,
        output: null,
        error: e.response?.data?.errors?.[0]?.msg || e.message,
        loading: false,
      }));
    }
  };

  const zeroTrustPrinciples = [
    { principle: 'Never Trust, Always Verify', impl: 'JWT tokens verified on every request — no session state server-side', status: 'active' },
    { principle: 'Least Privilege Access', impl: 'RBAC roles: admin / engineer / viewer — fine-grained route authorization', status: 'active' },
    { principle: 'Assume Breach', impl: 'All API routes rate-limited, request logging with correlation IDs, anomaly alerting', status: 'active' },
    { principle: 'Explicit Data Verification', impl: 'express-validator input sanitization + PGP payload encryption for cross-system messages', status: 'active' },
    { principle: 'EU Data Residency', impl: 'Azure West Europe + Frankfurt DC — no data leaves EU jurisdiction', status: 'active' },
    { principle: 'Open Standards (No Vendor Lock-In)', impl: 'OAuth 2.0, ODATA, REST — interoperable with BullSequana and Azure Stack HCI', status: 'active' },
  ];

  const complianceFrameworks = [
    { name: 'GDPR', score: 98, region: 'EU', critical: false },
    { name: 'ISO 27001', score: 94, region: 'Global', critical: false },
    { name: 'NIS2 Directive', score: 91, region: 'EU', critical: false },
    { name: 'Atos D+ ESG', score: 87, region: 'Internal', critical: false },
    { name: 'SOC 2 Type II', score: 89, region: 'Global', critical: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-atos-dark">Security — Zero Trust Architecture</h2>
        <p className="text-sm text-gray-500 mt-0.5">PGP payload encryption · JWT/OAuth 2.0 · EU data sovereignty · Atos Eviden alignment</p>
      </div>

      {/* Zero Trust principles */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-atos-blue" />
          <h3 className="font-semibold text-gray-800">Zero Trust Implementation</h3>
        </div>
        <div className="space-y-3">
          {zeroTrustPrinciples.map(({ principle, impl, status }) => (
            <div key={principle} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800">{principle}</p>
                <p className="text-xs text-gray-500 mt-0.5">{impl}</p>
              </div>
              <span className="badge-green ml-auto shrink-0">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Auth flow diagram */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Authentication Flow</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { step: '1', label: 'Client Login', detail: 'email + password', color: 'bg-atos-blue text-white' },
            { step: '→', label: '', detail: '', color: 'text-gray-300 text-xl' },
            { step: '2', label: 'Bcrypt Verify', detail: '12 rounds', color: 'bg-purple-600 text-white' },
            { step: '→', label: '', detail: '', color: 'text-gray-300 text-xl' },
            { step: '3', label: 'JWT Issued', detail: 'RS256 · 8h expiry', color: 'bg-indigo-600 text-white' },
            { step: '→', label: '', detail: '', color: 'text-gray-300 text-xl' },
            { step: '4', label: 'RBAC Check', detail: 'role-scoped routes', color: 'bg-teal-600 text-white' },
            { step: '→', label: '', detail: '', color: 'text-gray-300 text-xl' },
            { step: '5', label: 'Audit Log', detail: 'Winston + correlation ID', color: 'bg-emerald-600 text-white' },
          ].map(({ step, label, detail, color }, i) => (
            step === '→'
              ? <span key={i} className="text-gray-300 text-xl font-light">→</span>
              : (
                <div key={i} className={`rounded-xl px-4 py-3 text-center min-w-[100px] ${color}`}>
                  <p className="text-xs opacity-70 mb-0.5">Step {step}</p>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs opacity-80 mt-0.5">{detail}</p>
                </div>
              )
          ))}
        </div>
      </div>

      {/* CPI Payload Mapping Tester */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Key size={18} className="text-amber-500" />
          <h3 className="font-semibold text-gray-800">CPI Payload Mapping Tester</h3>
          <span className="badge-amber">RSA-OAEP + AES-256-GCM</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Test the <code className="bg-gray-100 px-1 rounded">workload-to-sap-maintenance</code> mapping before deploying an iFlow.
          Paste a workload JSON, run the transform, and verify the SAP PM Order structure.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Workload Payload (JSON)</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-xs font-mono h-32 focus:ring-2 focus:ring-atos-blue focus:outline-none"
              placeholder={'{\n  "id": "wl-crm-platform",\n  "name": "CRM Platform",\n  "status": "in-progress",\n  "riskLevel": "medium",\n  "environment": "on-prem",\n  "carbonKgCO2ePerMonth": 18.4\n}'}
              value={transformTester.input}
              onChange={e => setTransformTester(v => ({ ...v, input: e.target.value }))}
            />
            <button
              onClick={runTransformTest}
              disabled={transformTester.loading || !transformTester.input.trim()}
              className="btn-primary mt-2 flex items-center gap-1.5"
            >
              <Lock size={13} />
              {transformTester.loading ? 'Running...' : 'Run Transform'}
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">SAP PM Order Output</label>
            {transformTester.error ? (
              <div className="w-full border border-red-200 rounded-lg p-3 text-xs font-mono h-32 bg-red-50 text-red-700 overflow-auto">
                {transformTester.error}
              </div>
            ) : (
              <pre className="w-full border border-gray-200 rounded-lg p-3 text-xs font-mono h-32 overflow-auto bg-gray-50 text-gray-700">
                {transformTester.output || '// Output appears here after running the transform'}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Compliance frameworks */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Compliance Frameworks</h3>
        <div className="space-y-3">
          {complianceFrameworks.map(({ name, score, region }) => (
            <div key={name} className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-800 w-28">{name}</span>
              <span className="badge-blue text-xs w-16">{region}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${score >= 95 ? 'bg-emerald-500' : score >= 90 ? 'bg-teal-500' : 'bg-atos-blue'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700 w-12 text-right">{score}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
