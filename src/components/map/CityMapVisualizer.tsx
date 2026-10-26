import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { GraphNode, GraphEdge, RouteResult } from '../../types/graph';
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
} from 'lucide-react';

interface CityMapVisualizerProps {
  customRoute?: RouteResult | null;
  interactiveRoadToggling?: boolean;
  selectedNodeId?: string;
  onSelectNode?: (nodeId: string) => void;
  height?: string;
}

export const CityMapVisualizer: React.FC<CityMapVisualizerProps> = ({
  customRoute,
  interactiveRoadToggling = true,
  selectedNodeId,
  onSelectNode,
  height = 'h-[520px]',
}) => {
  const {
    network,
    facilities,
    ambulances,
    activeIncident,
    highlightedRoute,
    toggleRoadBlock,
  } = useSimulation();

  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<GraphEdge | null>(null);

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

  return (
    <div className={`relative w-full ${height} bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner select-none flex flex-col`}>
      {/* Top Map HUD Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-100">Live City Road Network</span>
          <span className="text-slate-500">|</span>
          <span>{network.nodes.length} Intersections</span>
          <span className="text-slate-500">•</span>
          <span>{network.edges.length} Road Links</span>
          {interactiveRoadToggling && (
            <span className="text-amber-400 ml-2 hidden sm:inline">(Click any road to toggle closure)</span>
          )}
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span>Trauma Center</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            <span>General Hosp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-teal-400" />
            <span>Clinic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40" />
            <span>Ambulance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded bg-rose-500 border border-dashed border-rose-300" />
            <span>Blocked Road</span>
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
          {/* Grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" />
          </pattern>

          {/* Glow filter for active route */}
          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="incidentGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>
        </defs>

        {/* Map Background Grid */}
        <rect width="1000" height="600" fill="#090d16" />
        <rect width="1000" height="600" fill="url(#grid)" opacity="0.6" />

        {/* Draw Water / Island feature for visual realism */}
        <path
          d="M 0 150 Q 80 180 110 280 T 60 400 L 0 400 Z"
          fill="#0c1e33"
          opacity="0.4"
        />

        {/* EDGES / ROADS */}
        <g id="roads-layer">
          {network.edges.map((edge) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return null;

            const isRouteEdge = routeEdgeIds.has(edge.id);
            const isBlocked = edge.isBlocked;
            const isHighway = edge.roadType === 'highway';

            // Coordinates
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
                {/* Invisible wider hit-box for easy clicking */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth="18"
                />

                {/* Base Road Stroke */}
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

                {/* Road label / Blocked badge indicator */}
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

                {/* Road info pill on hover */}
                {hoveredEdge?.id === edge.id && (
                  <g transform={`translate(${midX}, ${midY - 14})`}>
                    <rect
                      x="-65"
                      y="-12"
                      width="130"
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
                  opacity="0.9"
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

            // Check if ambulance is here
            const ambulanceHere = ambulances.find((a) => a.currentNodeId === node.id);
            // Check if hospital is here
            const facilityHere = facilities.find((f) => f.nodeId === node.id);

            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onClick={() => onSelectNode?.(node.id)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Node Base Circle */}
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

                {/* Pulse ring for active incident location */}
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

                {/* Hospital Badge Label on Map */}
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
                      x="-24"
                      y="-10"
                      width="48"
                      height="15"
                      rx="3"
                      fill="#064e3b"
                      stroke="#34d399"
                      strokeWidth="0.7"
                    />
                    <text
                      textAnchor="middle"
                      y="1.5"
                      fill="#a7f3d0"
                      fontSize="7.5"
                      fontWeight="bold"
                    >
                      {ambulanceHere.callSign}
                    </text>
                  </g>
                )}

                {/* Intersection Node ID text */}
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

                {/* Hover Tooltip Card */}
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
                      filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
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
