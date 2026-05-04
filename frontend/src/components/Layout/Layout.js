import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
  LayoutDashboard, GitBranch, Leaf, Server, Plug, Shield,
  Menu, X, LogOut, ChevronDown, Bell, User
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/migration', label: 'Migration', icon: GitBranch },
  { to: '/carbon', label: 'Carbon / D+', icon: Leaf },
  { to: '/infrastructure', label: 'Infrastructure', icon: Server },
  { to: '/integration', label: 'SAP / ServiceNow', icon: Plug },
  { to: '/security', label: 'Security', icon: Shield },
];

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-atos-gray overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-atos-blue flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">CB</span>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="font-bold text-atos-dark text-sm truncate">CloudBridge</p>
              <p className="text-xs text-gray-400 truncate">Hybrid-Cloud Platform</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(v => !v)} className="ml-auto text-gray-400 hover:text-gray-600">
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
            >
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>


        {/* User */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-atos-blue flex items-center justify-center shrink-0">
              <User size={14} className="text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate capitalize">{user?.role}</p>
              </div>
            )}
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 shrink-0" title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-sm font-semibold text-gray-800">CloudBridge</h1>
            <p className="text-xs text-gray-400">Hybrid-Cloud Operations Platform</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-slow" />
              D+ Active
            </div>
            <button className="relative text-gray-400 hover:text-gray-600">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center leading-none">3</span>
            </button>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
