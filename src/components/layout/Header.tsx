import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { ChevronRight, Clock, Layers, LogOut, Ruler } from 'lucide-react';

interface HeaderProps {
  role: 'reporter' | 'driver' | 'hospital';
  userName: string;
  onLogout: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ role, userName, onLogout, onOpenProfile }) => {
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
        <button
          type="button"
          onClick={onOpenProfile}
          className="group flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 text-left transition hover:border-slate-200 hover:bg-slate-50"
          aria-label="Open my profile"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-slate-100 shadow-sm ring-2 ring-white">
            {userName.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
          </span>
          <span className="hidden sm:block">
            <span className="block max-w-40 truncate text-xs font-black text-slate-800">{userName}</span>
            <span className="mt-0.5 block text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {role === 'reporter' ? 'Emergency Reporter' : role === 'driver' ? 'Ambulance Driver' : 'Hospital Coordinator'}
            </span>
          </span>
          <ChevronRight className="hidden h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500 sm:block" />
        </button>
        <span className="h-7 w-px bg-slate-200" />
        <button type="button" onClick={onLogout} className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700">
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Logout</span>
        </button>

        {role !== 'reporter' && (
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
        )}

        {role !== 'reporter' && blockedRoadsCount > 0 && (
          <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>{blockedRoadsCount} Road Closed</span>
          </div>
        )}
      </div>

      {/* Right: Driver-only routing controls */}
      {role === 'driver' && (
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
      )}
    </header>
  );
};
