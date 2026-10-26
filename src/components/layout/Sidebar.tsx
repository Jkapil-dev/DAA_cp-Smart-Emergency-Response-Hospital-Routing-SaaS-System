import React from 'react';
import {
  LayoutDashboard,
  AlertOctagon,
  Ambulance as AmbulanceIcon,
  Building2,
  Cpu,
  CheckSquare,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export type NavTab =
  | 'overview'
  | 'incidents'
  | 'dispatch'
  | 'hospitals'
  | 'algorithm-lab'
  | 'scenarios';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenReportModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenReportModal,
}) => {
  const { incidents, ambulances, facilities, resetSimulationData } = useSimulation();

  const activeIncidentsCount = incidents.filter((i) => i.stage !== 'completed').length;
  const availableAmbulancesCount = ambulances.filter((a) => a.status === 'available').length;
  const openFacilitiesCount = facilities.filter((f) => f.emergencyStatus === 'open').length;

  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'incidents' as NavTab,
      label: 'Incidents & Triage',
      icon: AlertOctagon,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : null,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      id: 'dispatch' as NavTab,
      label: 'Ambulance Dispatch',
      icon: AmbulanceIcon,
      badge: `${availableAmbulancesCount}/${ambulances.length}`,
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'hospitals' as NavTab,
      label: 'Hospitals & Beds',
      icon: Building2,
      badge: `${openFacilitiesCount}/${facilities.length}`,
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'algorithm-lab' as NavTab,
      label: 'Algorithm Lab',
      icon: Cpu,
      badge: 'DAA',
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'scenarios' as NavTab,
      label: 'Test Scenarios',
      icon: CheckSquare,
      badge: '14/14',
      badgeColor: 'bg-teal-100 text-teal-700',
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
            <h1 className="font-extrabold text-sm tracking-tight text-white">ResQRoute SaaS</h1>
            <p className="text-[11px] text-slate-400 font-medium">DAA Emergency Engine</p>
          </div>
        </div>
      </div>

      {/* Quick Action: Report Incident */}
      <div className="p-4">
        <button
          onClick={onOpenReportModal}
          className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-semibold py-2.5 px-3 rounded-lg shadow-sm shadow-rose-900/30 transition text-xs"
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Report New Incident</span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 py-1.5">
          Operational Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-700 text-blue-100' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Operational Controls */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/50">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Simulation State</span>
            <span className="text-emerald-400 font-semibold">Active & Stable</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Deterministic graph algorithm simulation. No AI or live APIs.
          </p>
        </div>

        <button
          onClick={resetSimulationData}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition"
          title="Reset simulated roads, beds, and ambulance fleet to initial benchmark state"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Simulation Data</span>
        </button>
      </div>
    </aside>
  );
};
