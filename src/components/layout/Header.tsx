import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { RoutingObjective } from '../../types/graph';
import { Route, Clock, Ruler, Shield, Layers, Radio } from 'lucide-react';

export const Header: React.FC = () => {
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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm">
      {/* Left: Active Incident Quick Picker & Network Alert */}
      <div className="flex items-center gap-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Active Incident Focus
          </label>
          <select
            value={activeIncidentId || ''}
            onChange={(e) => setActiveIncidentId(e.target.value || null)}
            className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                [{inc.severityEvaluation.severity.toUpperCase()}] {inc.id}: {inc.title}
              </option>
            ))}
          </select>
        </div>

        {blockedRoadsCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{blockedRoadsCount} Road Closure Active</span>
          </div>
        )}
      </div>

      {/* Right: Routing Controls */}
      <div className="flex items-center gap-3">
        {/* Algorithm Switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Algorithm:
          </span>
          <button
            onClick={() => setRoutingAlgorithm('dijkstra')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
              routingAlgorithm === 'dijkstra'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dijkstra
          </button>
          <button
            onClick={() => setRoutingAlgorithm('astar')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
              routingAlgorithm === 'astar'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            A* Search
          </button>
        </div>

        {/* Objective Switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
            <Route className="w-3.5 h-3.5" />
            Objective:
          </span>
          <button
            onClick={() => setRoutingObjective('travelTime')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition ${
              routingObjective === 'travelTime'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Fastest (Time)</span>
          </button>
          <button
            onClick={() => setRoutingObjective('distance')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition ${
              routingObjective === 'distance'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ruler className="w-3 h-3" />
            <span>Shortest (Dist)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
