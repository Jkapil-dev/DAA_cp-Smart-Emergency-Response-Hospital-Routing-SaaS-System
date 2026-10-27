import React, { useState, useMemo } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { RoutingObjective } from '../../types/graph';
import { compareAlgorithms } from '../../algorithms/comparison';
import { compareGridVsFullFleet } from '../../engine/gridDiscoveryEngine';
import { CityMapVisualizer } from '../map/CityMapVisualizer';
import {
  Cpu,
  Play,
  RotateCcw,
  Zap,
  TrendingDown,
  Layers,
  Clock,
  Ruler,
  CheckCircle2,
  Info,
  Scale,
  Grid,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const AlgorithmLabTab: React.FC = () => {
  const { network, ambulances, incidents, activeIncident, gridConfig } = useSimulation();

  const [activeLabSection, setActiveLabSection] = useState<'routing' | 'grid_discovery'>('routing');

  // Routing Lab states
  const [sourceId, setSourceId] = useState('N-01');
  const [targetId, setTargetId] = useState('N-18');
  const [objective, setObjective] = useState<RoutingObjective>('travelTime');
  const [activeViewAlgorithm, setActiveViewAlgorithm] = useState<'dijkstra' | 'astar'>('astar');

  // Grid Discovery Lab state
  const [selectedIncidentId, setSelectedIncidentId] = useState(
    activeIncident?.id || incidents[0]?.id || 'INC-2026-081'
  );

  const selectedIncident =
    incidents.find((i) => i.id === selectedIncidentId) || activeIncident || incidents[0];

  // Routing benchmark
  const comparison = useMemo(() => {
    return compareAlgorithms(network, sourceId, targetId, objective);
  }, [network, sourceId, targetId, objective]);

  // Grid vs Full Fleet benchmark
  const gridComparison = useMemo(() => {
    if (!selectedIncident) return null;
    return compareGridVsFullFleet(ambulances, selectedIncident, network, {
      config: gridConfig,
      algorithm: 'dijkstra',
      objective: 'travelTime',
    });
  }, [ambulances, selectedIncident, network, gridConfig]);

  const activeRoute =
    activeViewAlgorithm === 'astar'
      ? comparison.astar.routeResult
      : comparison.dijkstra.routeResult;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-600" />
            <span>Algorithm & DAA Benchmark Lab</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Empirical runtime performance, theoretical complexity bounds, and graph search optimization
          </p>
        </div>

        {/* Lab Switcher */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl border border-slate-300">
          <button
            onClick={() => setActiveLabSection('routing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeLabSection === 'routing'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dijkstra vs A* Routing</span>
          </button>
          <button
            onClick={() => setActiveLabSection('grid_discovery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeLabSection === 'grid_discovery'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Expanding Grid vs Full-Fleet Scan</span>
          </button>
        </div>
      </div>

      {activeLabSection === 'routing' ? (
        <>
          {/* Routing Control Strip */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Source Node */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Source Vertex (Start)
                </label>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-slate-50"
                >
                  {network.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      [{n.id}] {n.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Node */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Target Vertex (Destination)
                </label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-slate-50"
                >
                  {network.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      [{n.id}] {n.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cost Objective */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Cost Objective Function
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setObjective('travelTime')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition ${
                      objective === 'travelTime'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Fastest Time</span>
                  </button>
                  <button
                    onClick={() => setObjective('distance')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition ${
                      objective === 'distance'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Ruler className="w-3 h-3" />
                    <span>Shortest Distance</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Algorithm Visualizer Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Render on Map:</span>
              <button
                onClick={() => setActiveViewAlgorithm('astar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeViewAlgorithm === 'astar'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                A* Search Path
              </button>
              <button
                onClick={() => setActiveViewAlgorithm('dijkstra')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeViewAlgorithm === 'dijkstra'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Dijkstra Path
              </button>
            </div>
          </div>

          {/* Side-by-Side Algorithm Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Dijkstra Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs">
                    D
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Dijkstra's Algorithm</h3>
                </div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Uniform Cost Search
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Nodes Explored</span>
                  <span className="text-lg font-black text-slate-800">
                    {comparison.dijkstra.exploredNodesCount}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Priority Q Ops</span>
                  <span className="text-lg font-black text-slate-800">
                    {comparison.dijkstra.operationsCount}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Route Cost</span>
                  <span className="text-lg font-black text-blue-600">
                    {comparison.dijkstra.totalCost} {objective === 'travelTime' ? 'min' : 'km'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <div>
                  Time Complexity: <strong>{comparison.dijkstra.timeComplexityTheoretical}</strong>
                </div>
                <div>
                  Space Complexity: <strong>{comparison.dijkstra.spaceComplexityTheoretical}</strong>
                </div>
                <div>
                  Path: <span className="font-mono text-slate-700">{comparison.dijkstra.routeResult.path.join(' → ')}</span>
                </div>
              </div>
            </div>

            {/* A* Search Card */}
            <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm space-y-4 ring-1 ring-blue-500/20">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                    A*
                  </div>
                  <h3 className="font-extrabold text-blue-900 text-sm">Admissible A* Search</h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  Heuristic Guided
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-blue-600 block font-semibold">Nodes Explored</span>
                  <span className="text-lg font-black text-blue-900">
                    {comparison.astar.exploredNodesCount}
                  </span>
                </div>
                <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-blue-600 block font-semibold">Priority Q Ops</span>
                  <span className="text-lg font-black text-blue-900">
                    {comparison.astar.operationsCount}
                  </span>
                </div>
                <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-blue-600 block font-semibold">Route Cost</span>
                  <span className="text-lg font-black text-blue-600">
                    {comparison.astar.totalCost} {objective === 'travelTime' ? 'min' : 'km'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <div>
                  Time Complexity: <strong>{comparison.astar.timeComplexityTheoretical}</strong>
                </div>
                <div>
                  Space Complexity: <strong>{comparison.astar.spaceComplexityTheoretical}</strong>
                </div>
                <div>
                  Path: <span className="font-mono text-slate-700">{comparison.astar.routeResult.path.join(' → ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* DAA Summary Callout */}
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed flex items-start gap-2.5">
            <Scale className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-purple-950">Empirical DAA Analysis:</strong>{' '}
              {comparison.analysisSummary} Both algorithms preserve path optimality because the Euclidean
              admissible heuristic never overestimates true travel time under highway speed limits.
            </div>
          </div>

          {/* Visualizer */}
          <CityMapVisualizer customRoute={activeRoute} />
        </>
      ) : (
        /* Grid Discovery vs Full-Fleet Scan Section */
        <div className="space-y-5">
          {/* Control Strip */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Benchmark Scenario Incident
              </label>
              <select
                value={selectedIncidentId}
                onChange={(e) => setSelectedIncidentId(e.target.value)}
                className="text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-slate-50"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    [{inc.severityEvaluation.severity.toUpperCase()}] {inc.id}: {inc.title} (@ Node{' '}
                    {inc.locationNodeId})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Grid Partition: <strong>4 columns × 3 rows (12 cells)</strong> • Expansion Ring Step: 1
            </div>
          </div>

          {gridComparison && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Expanding Square-Grid Card */}
              <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm space-y-4 ring-1 ring-blue-500/20">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                      <Grid className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-blue-900 text-sm">
                      Expanding Square-Grid Discovery
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {gridComparison.fleetReductionPercent}% Scope Reduction
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-blue-500 block font-semibold">Cells Examined</span>
                    <span className="text-lg font-black text-blue-950">
                      {gridComparison.grid.cellsExamined} / {gridComparison.grid.totalCells}
                    </span>
                  </div>
                  <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-blue-500 block font-semibold">Rings Reached</span>
                    <span className="text-lg font-black text-blue-950">
                      Ring {gridComparison.grid.expansionRingsReached - 1}
                    </span>
                  </div>
                  <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-blue-500 block font-semibold">Units Evaluated</span>
                    <span className="text-lg font-black text-blue-950">
                      {gridComparison.grid.ambulancesEvaluated}
                    </span>
                  </div>
                  <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-blue-500 block font-semibold">Route Calculations</span>
                    <span className="text-lg font-black text-emerald-600">
                      {gridComparison.grid.routeCalculationsCount}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  Winner Selected:{' '}
                  <strong className="text-slate-900">
                    {gridComparison.grid.selectedAmbulanceId || 'None'}
                  </strong>{' '}
                  ({gridComparison.grid.travelTimeMinutes} min ETA)
                </div>
              </div>

              {/* Full-Fleet Scan Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs">
                      F
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Full-Fleet Global Scan</h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Brute Force Scan
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Total Fleet Size</span>
                    <span className="text-lg font-black text-slate-800">
                      {gridComparison.fullFleet.ambulancesEvaluated} Units
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Route Calculations</span>
                    <span className="text-lg font-black text-slate-800">
                      {gridComparison.fullFleet.routeCalculationsCount}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Unnecessary Routes</span>
                    <span className="text-lg font-black text-rose-600">
                      +{gridComparison.fullFleet.routeCalculationsCount - gridComparison.grid.routeCalculationsCount}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  Winner Selected:{' '}
                  <strong className="text-slate-900">
                    {gridComparison.fullFleet.selectedAmbulanceId || 'None'}
                  </strong>{' '}
                  ({gridComparison.fullFleet.travelTimeMinutes} min ETA)
                </div>
              </div>
            </div>
          )}

          {/* DAA Algorithmic Insight Callout */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-blue-950">Computational Scalability Comparison:</strong>{' '}
              A full-fleet scan evaluates graph routes of complexity <em>O(N · (|V| + |E|) log |V|)</em>,
              which scales poorly as emergency fleets grow to hundreds of vehicles across a metropolitan area.
              The Uber-inspired expanding square-grid bounds candidate discovery locally in <em>O(K · (|V| + |E|) log |V|)</em> where <em>K &lt;&lt; N</em> is limited to the local geographic ring density.
            </div>
          </div>

          <CityMapVisualizer initialShowGrid={true} />
        </div>
      )}
    </div>
  );
};
