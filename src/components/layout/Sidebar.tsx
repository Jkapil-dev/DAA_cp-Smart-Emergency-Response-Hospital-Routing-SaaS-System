import React from 'react';
import {
  Building2,
  ShieldCheck,
  RefreshCw,
  Radio,
  User,
  Navigation,
  LogOut,
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { UserRole } from '../auth/AuthPage';

export type NavTab =
  | 'reporter'
  | 'driver'
  | 'hospital'
  | 'police'
  | 'overview'
  | 'incidents'
  | 'dispatch'
  | 'hospitals'
  | 'algorithm-lab'
  | 'scenarios'
  | 'profile';

interface SidebarProps {
  activeTab: NavTab;
  role: UserRole;
  userName: string;
  onSelectTab: (tab: NavTab) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  role,
  userName,
  onSelectTab,
  onLogout,
}) => {
  const { policeAlerts, resetSimulationData } = useSimulation();

  const roleLabels: Record<UserRole, string> = {
    reporter: 'Emergency Reporter',
    driver: 'Ambulance Driver',
    hospital: 'Hospital Coordinator',
  };

  const roleDashboards = [
    {
      id: 'reporter' as NavTab,
      label: 'Incident Reporter (A)',
      icon: User,
      badge: 'Citizen',
      badgeColor: 'bg-rose-950 text-rose-300 border border-rose-800',
    },
    {
      id: 'driver' as NavTab,
      label: 'Ambulance Driver (B)',
      icon: Navigation,
      badge: 'Cockpit',
      badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-800',
    },
    {
      id: 'hospital' as NavTab,
      label: 'Hospital Coord (C)',
      icon: Building2,
      badge: 'ER Queue',
      badgeColor: 'bg-blue-950 text-blue-300 border border-blue-800',
    },
    {
      id: 'police' as NavTab,
      label: 'Police & Traffic Panel',
      icon: Radio,
      badge: `${policeAlerts.length} Alerts`,
      badgeColor: 'bg-purple-950 text-purple-300 border border-purple-800',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 min-h-screen text-slate-200">
      {/* Brand & App Title */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white">ResQRoutes SaaS</h1>
            <p className="text-[11px] text-slate-400 font-medium">Emergency Response Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
        {/* Section 1: 3 Role-Based Dashboards */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 py-1">
            {roleLabels[role]} Workspace
          </div>
          {roleDashboards.filter((item) => item.id === role).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-blue-700 text-blue-100' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-xs font-bold text-slate-300">Dedicated workspace</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            This account can only access its assigned role dashboard.
          </p>
        </div>
        
      </nav>

      {/* Bottom Controls */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
            <span>Simulation State</span>
            <span className="text-emerald-400 font-semibold">Active & Live</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Deterministic rule engine • Expanding square grid • No AI / ML
          </p>
        </div>

        {role !== 'reporter' && (
          <button
            onClick={resetSimulationData}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition"
          >
            <RefreshCw className="w-3 h-3 text-slate-400" />
            <span>Reset Simulation Data</span>
          </button>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-rose-900/60 text-rose-300 hover:bg-rose-950/50 text-xs font-medium transition"
        >
          <LogOut className="w-3 h-3" />
          <span>Logout {userName}</span>
        </button>
      </div>
    </aside>
  );
};
