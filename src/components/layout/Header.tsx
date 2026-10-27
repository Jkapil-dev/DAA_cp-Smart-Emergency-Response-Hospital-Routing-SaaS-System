import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { RoutingObjective } from '../../types/graph';
import { NavTab } from './Sidebar';
import { Route, Clock, Ruler, Shield, Layers, Radio, User, Navigation, Building2 } from 'lucide-react';

interface HeaderProps {
  activeTab?: NavTab;
  onSelectTab?: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  const {
    routingAlgorithm,
    setRoutingAlgorithm,
    routingObjective,
    setRoutingObjective,
    incidents,
    activeIncidentId,
    setActiveIncidentId,
    network,
  } = useSimulation();

  const blockedRoadsCount = network.edges.filter((e) => e.isBlocked).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
      {/* Left: Role Switcher & Incident Picker */}
      <div className="flex flex-wrap items-center gap-4">
        {onSelectTab && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 hidden sm:inline">
              Role:
            </span>
            <button
              onClick={() => onSelectTab('reporter')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'reporter'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Reporter (A)</span>
            </button>
            <button
              onClick={() => onSelectTab('driver')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'driver'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Driver (B)</span>
            </button>
            <button
              onClick={() => onSelectTab('hospital')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'hospital'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Hospital (C)</span>
            </button>
            <button
              onClick={() => onSelectTab('overview')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Command Center
            </button>
          </div>
        )}

        <div>
          <select
            value={activeIncidentId || ''}
            onChange={(e) => setActiveIncidentId(e.target.value || null)}
            className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[220px] truncate"
            title="Focus incident"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                [{inc.severityEvaluation.severity.toUpperCase()}] {inc.id}: {inc.title}
              </option>
            ))}
          </select>
        </div>

        {blockedRoadsCount > 0 && (
          <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>{blockedRoadsCount} Road Closed</span>
          </div>
        )}
      </div>

      {/* Right: Routing Controls */}
      <div className="flex items-center gap-3">
        {/* Algorithm Switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 px-1.5 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Algo:</span>
          </span>
          <button
            onClick={() => setRoutingAlgorithm('dijkstra')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition ${
              routingAlgorithm === 'dijkstra'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dijkstra
          </button>
          <button
            onClick={() => setRoutingAlgorithm('astar')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition ${
              routingAlgorithm === 'astar'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            A* Search
          </button>
        </div>

        {/* Objective Switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setRoutingObjective('travelTime')}
            className={`px-2 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition ${
              routingObjective === 'travelTime'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span className="hidden sm:inline">Fastest</span>
          </button>
          <button
            onClick={() => setRoutingObjective('distance')}
            className={`px-2 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition ${
              routingObjective === 'distance'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ruler className="w-3 h-3" />
            <span className="hidden sm:inline">Shortest</span>
          </button>
        </div>
      </div>
    </header>
  );
};
