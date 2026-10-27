import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { GraphNode, GraphEdge, RouteResult } from '../../types/graph';
import { buildGrid, getCellForNode } from '../../engine/gridDiscoveryEngine';
import {
  AlertTriangle,
  Hospital,
  Cross,
  Navigation,
  ShieldAlert,
  Info,
  Maximize2,
  CheckCircle2,
  XCircle,
  Grid,
  Radio,
} from 'lucide-react';

interface CityMapVisualizerProps {
  customRoute?: RouteResult | null;
  interactiveRoadToggling?: boolean;
  selectedNodeId?: string;
  onSelectNode?: (nodeId: string) => void;
  height?: string;
  initialShowGrid?: boolean;
}

export const CityMapVisualizer: React.FC<CityMapVisualizerProps> = ({
  customRoute,
  interactiveRoadToggling = true,
  selectedNodeId,
  onSelectNode,
  height = 'h-[540px]',
  initialShowGrid = true,
}) => {
  const {
    network,
    facilities,
    ambulances,
    activeIncident,
    highlightedRoute,
    toggleRoadBlock,
    gridConfig,
    latestGridResult,
  } = useSimulation();

  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<GraphEdge | null>(null);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(initialShowGrid);

  const displayRoute = customRoute || highlightedRoute;

  const nodeMap = new Map<string, GraphNode>();
  network.nodes.forEach((n) => nodeMap.set(n.id, n));

  // Determine which edges are in the displayed route
  const routeEdgeIds = new Set<string>();
  if (displayRoute && displayRoute.path.length > 1) {
    for (let i = 0; i < displayRoute.path.length - 1; i++) {
      const u = displayRoute.path[i];
      const v = displayRoute.path[i + 1];
      const edge = network.edges.find(
        (e) => (e.from === u && e.to === v) || (e.bidirectional !== false && e.from === v && e.to === u)
      );
      if (edge) routeEdgeIds.add(edge.id);
    }
  }

  // Build grid cells
  const gridCells = buildGrid(network, gridConfig);
  const incidentCell = activeIncident
    ? getCellForNode(activeIncident.locationNodeId, network, gridConfig)
    : null;

  return (
    <div
      className={`relative w-full ${height} bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner select-none flex flex-col`}
    >
      {/* Top Map HUD Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300 shadow-md">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-100">Live City Road Network</span>
          <span className="text-slate-500">|</span>
          <span>{network.nodes.length} Intersections</span>
          <span className="text-slate-500">•</span>
          <span>{network.edges.length} Road Links</span>
          {interactiveRoadToggling && (
            <span className="text-amber-400 ml-2 hidden sm:inline">(Click road to toggle closure)</span>
          )}
        </div>

        {/* Right HUD Controls: Grid Toggle & Legend */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Toggle Grid Overlay */}
          <button
            onClick={() => setShowGridOverlay(!showGridOverlay)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition shadow-sm ${
              showGridOverlay
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
                : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Square Grid {showGridOverlay ? 'ON' : 'OFF'}</span>
          </button>

          {/* Legend */}
          <div className="hidden xl:flex items-center gap-3 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span>Trauma</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span>General Hosp</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-400" />
              <span>Clinic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40" />
              <span>Ambulance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded bg-rose-500 border border-dashed border-rose-300" />
              <span>Blocked</span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <svg
        viewBox="0 0 1000 600"
        className="w-full h-full object-contain"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Fine pattern */}
          <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>

          {/* Glow filter for active route */}
          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Map Background */}
        <rect width="1000" height="600" fill="#090d16" />
        <rect width="1000" height="600" fill="url(#gridPattern)" opacity="0.4" />

        {/* Water Feature */}
        <path
          d="M 0 150 Q 80 180 110 280 T 60 400 L 0 400 Z"
          fill="#0c1e33"
          opacity="0.4"
        />

        {/* EXPANDING SQUARE-GRID OVERLAY (Uber-inspired partition) */}
        {showGridOverlay && (
          <g id="expanding-square-grid-layer" pointerEvents="none">
            {gridCells.map((cell) => {
              const isIncidentCell = incidentCell?.cellId === cell.id;
              const isSearched = latestGridResult?.allSearchedCellIds.includes(cell.id);

              return (
                <g key={cell.id}>
                  {/* Cell Box */}
                  <rect
                    x={cell.bounds.minX}
                    y={cell.bounds.minY}
                    width={gridConfig.cellWidth}
                    height={gridConfig.cellHeight}
                    fill={
                      isIncidentCell
                        ? 'rgba(239, 68, 68, 0.08)'
                        : isSearched
                        ? 'rgba(56, 189, 248, 0.04)'
                        : 'transparent'
                    }
                    stroke={
                      isIncidentCell
                        ? '#ef4444'
                        : isSearched
                        ? '#38bdf8'
                        : '#334155'
                    }
                    strokeWidth={isIncidentCell ? 2 : isSearched ? 1.5 : 0.75}
                    strokeDasharray={isIncidentCell ? undefined : '4 4'}
                    opacity={isIncidentCell ? 0.9 : 0.5}
                  />

                  {/* Cell Label Pill */}
                  <g
                    transform={`translate(${cell.bounds.minX + 8}, ${cell.bounds.minY + 14})`}
                  >
                    <rect
                      x="0"
                      y="-10"
                      width={isIncidentCell ? 90 : 54}
                      height="15"
                      rx="3"
                      fill={isIncidentCell ? '#7f1d1d' : '#0f172a'}
                      stroke={isIncidentCell ? '#f87171' : '#334155'}
                      strokeWidth="0.75"
                    />
                    <text
                      x={isIncidentCell ? 45 : 27}
                      y="1"
                      textAnchor="middle"
                      fill={isIncidentCell ? '#fecaca' : '#94a3b8'}
                      fontSize="7.5"
                      fontWeight="bold"
                    >
                      {isIncidentCell ? `[${cell.col},${cell.row}] RING 0` : `[${cell.col},${cell.row}]`}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        )}

        {/* EDGES / ROADS */}
        <g id="roads-layer">
          {network.edges.map((edge) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return null;

            const isRouteEdge = routeEdgeIds.has(edge.id);
            const isBlocked = edge.isBlocked;
            const isHighway = edge.roadType === 'highway';

            const x1 = fromNode.x;
            const y1 = fromNode.y;
            const x2 = toNode.x;
            const y2 = toNode.y;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            let strokeColor = isHighway ? '#334155' : '#1e293b';
            let strokeWidth = isHighway ? 4.5 : 2.5;

            if (isBlocked) {
              strokeColor = '#e11d48';
              strokeWidth = 3;
            } else if (isRouteEdge) {
              strokeColor = '#38bdf8';
              strokeWidth = 5.5;
            }

            return (
              <g
                key={edge.id}
                className="cursor-pointer group"
                onClick={() => {
                  if (interactiveRoadToggling) {
                    toggleRoadBlock(edge.id);
                  }
                }}
                onMouseEnter={() => setHoveredEdge(edge)}
                onMouseLeave={() => setHoveredEdge(null)}
              >
                {/* Hitbox */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth="18"
                />

                {/* Road Stroke */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={isBlocked ? '6 4' : undefined}
                  filter={isRouteEdge ? 'url(#routeGlow)' : undefined}
                />

                {/* Road closure marker */}
                {isBlocked && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <circle r="9" fill="#991b1b" stroke="#ffffff" strokeWidth="1.5" />
                    <text
                      y="3.5"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      ✕
                    </text>
                  </g>
                )}

                {/* Road hover popup */}
                {hoveredEdge?.id === edge.id && (
                  <g transform={`translate(${midX}, ${midY - 14})`} pointerEvents="none">
                    <rect
                      x="-70"
                      y="-12"
                      width="140"
                      height="24"
                      rx="4"
                      fill="#020617"
                      stroke="#475569"
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      y="4"
                      fill="#e2e8f0"
                      fontSize="9"
                      fontWeight="500"
                    >
                      {edge.roadName} ({edge.travelTimeMinutes}m | {edge.distanceKm}km)
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* HIGHLIGHTED ROUTE ANIMATED OVERLAY */}
        {displayRoute && displayRoute.path.length > 1 && (
          <g id="active-route-overlay" pointerEvents="none">
            {displayRoute.edges.map((edge, idx) => {
              const u = nodeMap.get(edge.from);
              const v = nodeMap.get(edge.to);
              if (!u || !v) return null;
              return (
                <line
                  key={`route-${edge.id}-${idx}`}
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke="#38bdf8"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="8 6"
                  opacity="0.95"
                  className="animate-pulse"
                />
              );
            })}
          </g>
        )}

        {/* NODES / INTERSECTIONS */}
        <g id="nodes-layer">
          {network.nodes.map((node) => {
            const isHovered = hoveredNode?.id === node.id;
            const isSelected = selectedNodeId === node.id;
            const isIncidentHere = activeIncident?.locationNodeId === node.id;

            const ambulanceHere = ambulances.find((a) => a.currentNodeId === node.id);
            const facilityHere = facilities.find((f) => f.nodeId === node.id);

            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onClick={() => onSelectNode?.(node.id)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Node Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected || isIncidentHere ? 10 : facilityHere ? 11 : ambulanceHere ? 9 : 5}
                  fill={
                    isIncidentHere
                      ? '#ef4444'
                      : facilityHere?.type === 'trauma_center'
                      ? '#dc2626'
                      : facilityHere?.type === 'general_hospital'
                      ? '#2563eb'
                      : facilityHere?.type === 'clinic'
                      ? '#0d9488'
                      : ambulanceHere
                      ? '#10b981'
                      : isSelected
                      ? '#38bdf8'
                      : '#64748b'
                  }
                  stroke={isSelected || isIncidentHere ? '#ffffff' : '#0f172a'}
                  strokeWidth={isSelected || isIncidentHere ? 2.5 : 1.5}
                />

                {/* Incident Pulse Ring */}
                {isIncidentHere && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="18"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    className="animate-ping"
                    opacity="0.75"
                  />
                )}

                {/* Facility Badge */}
                {facilityHere && (
                  <g transform={`translate(${node.x}, ${node.y - 15})`} pointerEvents="none">
                    <rect
                      x="-28"
                      y="-10"
                      width="56"
                      height="16"
                      rx="3"
                      fill={
                        facilityHere.type === 'trauma_center'
                          ? '#7f1d1d'
                          : facilityHere.type === 'general_hospital'
                          ? '#1e3a8a'
                          : '#134e4a'
                      }
                      stroke="#cbd5e1"
                      strokeWidth="0.7"
                    />
                    <text
                      textAnchor="middle"
                      y="2"
                      fill="#ffffff"
                      fontSize="8"
                      fontWeight="bold"
                    >
                      {facilityHere.availableBeds} beds
                    </text>
                  </g>
                )}

                {/* Ambulance Unit Badge */}
                {ambulanceHere && !facilityHere && (
                  <g transform={`translate(${node.x}, ${node.y - 14})`} pointerEvents="none">
                    <rect
                      x="-26"
                      y="-10"
                      width="52"
                      height="15"
                      rx="3"
                      fill={
                        ambulanceHere.status === 'en_route_scene' || ambulanceHere.status === 'transporting'
                          ? '#1e3a8a'
                          : ambulanceHere.status === 'reserved'
                          ? '#78350f'
                          : '#064e3b'
                      }
                      stroke={
                        ambulanceHere.status === 'en_route_scene' || ambulanceHere.status === 'transporting'
                          ? '#60a5fa'
                          : ambulanceHere.status === 'reserved'
                          ? '#f59e0b'
                          : '#34d399'
                      }
                      strokeWidth="0.75"
                    />
                    <text
                      textAnchor="middle"
                      y="1.5"
                      fill="#ffffff"
                      fontSize="7.5"
                      fontWeight="bold"
                    >
                      {ambulanceHere.callSign}
                    </text>
                  </g>
                )}

                {/* Node Label */}
                <text
                  x={node.x}
                  y={node.y + 16}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8"
                  fontWeight="600"
                  pointerEvents="none"
                >
                  {node.id}
                </text>

                {/* Tooltip on hover */}
                {isHovered && (
                  <g transform={`translate(${node.x}, ${node.y - 35})`} pointerEvents="none">
                    <rect
                      x="-90"
                      y="-26"
                      width="180"
                      height="38"
                      rx="6"
                      fill="#020617"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                    />
                    <text
                      textAnchor="middle"
                      y="-11"
                      fill="#f8fafc"
                      fontSize="9.5"
                      fontWeight="bold"
                    >
                      {node.name}
                    </text>
                    <text
                      textAnchor="middle"
                      y="4"
                      fill="#94a3b8"
                      fontSize="8"
                    >
                      Node {node.id} • {node.zone || 'District'}
                      {facilityHere ? ` • ${facilityHere.type.replace('_', ' ')}` : ''}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Bottom Map Info Footer */}
      <div className="bg-slate-950/90 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          {displayRoute ? (
            <div className="flex items-center gap-2 text-sky-400 font-medium">
              <Navigation className="w-3.5 h-3.5" />
              <span>
                Active Route: {displayRoute.path.join(' → ')}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-200 font-semibold">
                {displayRoute.totalTravelTimeMinutes} min
              </span>
              <span className="text-slate-500">({displayRoute.totalDistanceKm} km)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Select an incident or hospital to inspect routing.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500">
            Road Status:{' '}
            <strong className="text-slate-300">
              {network.edges.filter((e) => e.isBlocked).length} Closed
            </strong>{' '}
            /{' '}
            <strong className="text-emerald-400">
              {network.edges.filter((e) => !e.isBlocked).length} Open
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
