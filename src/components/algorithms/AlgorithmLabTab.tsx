import React, { useState, useMemo } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { RoutingObjective } from '../../types/graph';
import { compareAlgorithms } from '../../algorithms/comparison';
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
} from 'lucide-react';

export const AlgorithmLabTab: React.FC = () => {
  const { network } = useSimulation();

  const [sourceId, setSourceId] = useState('N-01');
  const [targetId, setTargetId] = useState('N-18');
  const [objective, setObjective] = useState<RoutingObjective>('travelTime');
  const [activeViewAlgorithm, setActiveViewAlgorithm] = useState<'dijkstra' | 'astar'>('astar');

  // Compute real benchmark comparison on the active graph state
  const comparison = useMemo(() => {
    return compareAlgorithms(network, sourceId, targetId, objective);
  }, [network, sourceId, targetId, objective]);

  const activeRoute =
    activeViewAlgorithm === 'astar'
      ? comparison.astar.routeResult
      : comparison.dijkstra.routeResult;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-600" />
          <span>Graph Algorithm Comparison Lab (DAA)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Empirical and theoretical benchmark between Dijkstra's Algorithm and Admissible A* Search
        </p>
      </div>

      {/* Control Strip */}
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
                <span>Travel Time (Minutes)</span>
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
                <span>Distance (Km)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Efficiency Gain Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-purple-50 border border-purple-200 px-3 py-2 rounded-xl text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block">
              A* Pruning Efficiency
            </span>
            <span className="text-base font-black text-purple-800">
              {comparison.searchEfficiencyGainPercent >= 0
                ? `${comparison.searchEfficiencyGainPercent}% fewer vertices explored`
                : 'Identical expansion'}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Analysis Banner */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Empirical Verification: </span>
          {comparison.analysisSummary}
        </div>
      </div>

      {/* Side-by-Side Algorithm Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dijkstra Card */}
        <div
          className={`bg-white rounded-xl border p-5 space-y-4 shadow-sm transition ${
            activeViewAlgorithm === 'dijkstra'
              ? 'ring-2 ring-blue-500 border-blue-500'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Exhaustive / Uniform Cost
              </span>
              <h3 className="text-base font-black text-slate-900">Dijkstra's Algorithm</h3>
            </div>
            <button
              onClick={() => setActiveViewAlgorithm('dijkstra')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                activeViewAlgorithm === 'dijkstra'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {activeViewAlgorithm === 'dijkstra' ? 'Viewing on Map' : 'View Route'}
            </button>
          </div>

          {/* Metric Stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px]">
                Explored Vertices
              </span>
              <span className="text-lg font-black text-slate-900">
                {comparison.dijkstra.exploredNodesCount} nodes
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px]">
                Measured Execution Time
              </span>
              <span className="text-lg font-black text-slate-900">
                {comparison.dijkstra.executionTimeMs} ms
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px]">
                Relaxations & Ops
              </span>
              <span className="text-lg font-black text-slate-900">
                {comparison.dijkstra.operationsCount}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px]">
                Optimal Path Cost
              </span>
              <span className="text-lg font-black text-blue-700">
                {comparison.dijkstra.totalCost}{' '}
                {objective === 'travelTime' ? 'min' : 'km'}
              </span>
            </div>
          </div>

          {/* Complexity analysis */}
          <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Theoretical Time Complexity:</span>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-bold text-slate-800">
                {comparison.dijkstra.timeComplexityTheoretical}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Theoretical Space Complexity:</span>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-bold text-slate-800">
                {comparison.dijkstra.spaceComplexityTheoretical}
              </code>
            </div>
          </div>

          {/* Path Trace */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Calculated Path ({comparison.dijkstra.pathLengthNodes} nodes):
            </span>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 break-words">
              {comparison.dijkstra.routeResult.found
                ? comparison.dijkstra.routeResult.path.join(' → ')
                : 'No path found'}
            </div>
          </div>
        </div>

        {/* A* Search Card */}
        <div
          className={`bg-white rounded-xl border p-5 space-y-4 shadow-sm transition ${
            activeViewAlgorithm === 'astar'
              ? 'ring-2 ring-purple-500 border-purple-500'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block">
                Heuristic-Guided Search
              </span>
              <h3 className="text-base font-black text-slate-900">A* Search (Admissible)</h3>
            </div>
            <button
              onClick={() => setActiveViewAlgorithm('astar')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                activeViewAlgorithm === 'astar'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {activeViewAlgorithm === 'astar' ? 'Viewing on Map' : 'View Route'}
            </button>
          </div>

          {/* Metric Stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-purple-50/60 rounded-lg border border-purple-100">
              <span className="text-purple-600 font-semibold block text-[10px]">
                Explored Vertices
              </span>
              <span className="text-lg font-black text-purple-900">
                {comparison.astar.exploredNodesCount} nodes
              </span>
            </div>

            <div className="p-2.5 bg-purple-50/60 rounded-lg border border-purple-100">
              <span className="text-purple-600 font-semibold block text-[10px]">
                Measured Execution Time
              </span>
              <span className="text-lg font-black text-purple-900">
                {comparison.astar.executionTimeMs} ms
              </span>
            </div>

            <div className="p-2.5 bg-purple-50/60 rounded-lg border border-purple-100">
              <span className="text-purple-600 font-semibold block text-[10px]">
                Relaxations & Ops
              </span>
              <span className="text-lg font-black text-purple-900">
                {comparison.astar.operationsCount}
              </span>
            </div>

            <div className="p-2.5 bg-purple-50/60 rounded-lg border border-purple-100">
              <span className="text-purple-600 font-semibold block text-[10px]">
                Optimal Path Cost
              </span>
              <span className="text-lg font-black text-purple-900">
                {comparison.astar.totalCost}{' '}
                {objective === 'travelTime' ? 'min' : 'km'}
              </span>
            </div>
          </div>

          {/* Complexity analysis */}
          <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Theoretical Time Complexity:</span>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-bold text-slate-800">
                {comparison.astar.timeComplexityTheoretical}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Theoretical Space Complexity:</span>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-bold text-slate-800">
                {comparison.astar.spaceComplexityTheoretical}
              </code>
            </div>
          </div>

          {/* Path Trace */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Calculated Path ({comparison.astar.pathLengthNodes} nodes):
            </span>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 break-words">
              {comparison.astar.routeResult.found
                ? comparison.astar.routeResult.path.join(' → ')
                : 'No path found'}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Route Visualizer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>Visual Route Path:</span>
            <span className="text-purple-700 font-extrabold uppercase">
              {activeViewAlgorithm.toUpperCase()}
            </span>
            <span className="text-slate-500 font-normal">
              ({activeRoute.totalTravelTimeMinutes} min • {activeRoute.totalDistanceKm} km)
            </span>
          </h3>
          <span className="text-xs text-slate-400">
            Click any road link on map to toggle closure and observe dynamic re-routing
          </span>
        </div>

        <CityMapVisualizer customRoute={activeRoute} height="h-[480px]" />
      </div>
    </div>
  );
};
