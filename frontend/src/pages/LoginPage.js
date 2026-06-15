import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/slices/authSlice';
import { Shield, Loader2, Cloud } from 'lucide-react';

export default function LoginPage() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: 'engineer@cloudbridge.internal', password: 'demo' });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(login(form));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-atos-dark via-blue-900 to-atos-blue flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />

      <div className="w-full max-w-md relative">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-atos-blue mb-4">
              <Cloud className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-atos-dark">CloudBridge</h1>
            <p className="text-gray-500 text-sm mt-1">Hybrid-Cloud Operations Platform</p>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 text-atos-blue px-3 py-1 rounded-full text-xs font-medium">
              <Shield size={11} />
              Zero Trust · JWT Auth
            </div>
            <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg">
              Demo — sample data, no backend. Click <strong>Sign In</strong> (any credentials work).
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-atos-blue focus:border-transparent"
                placeholder="you@yourorg.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm(v => ({ ...v, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-atos-blue focus:border-transparent"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !form.email || !form.password}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Authenticating...</>
                : 'Sign In'
              }
            </button>
          </form>
        </div>

        <p className="text-center text-blue-200 text-xs mt-4">
          CloudBridge Platform · Hybrid-Cloud Operations
        </p>
      </div>
    </div>
  );
}
