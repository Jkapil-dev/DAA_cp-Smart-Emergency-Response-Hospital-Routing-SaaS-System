export interface GraphNode {
  id: string;
  name: string;
  x: number; // SVG coordinate X (0 - 1000)
  y: number; // SVG coordinate Y (0 - 600)
  type: 'intersection' | 'depot' | 'hospital' | 'clinic' | 'landmark';
  zone?: string;
  facilityId?: string;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  distanceKm: number; // Road distance in kilometers
  speedLimitKmh: number; // Speed limit in km/h
  travelTimeMinutes: number; // Calculated or adjusted travel time in minutes
  roadName: string;
  roadType: 'highway' | 'arterial' | 'local';
  isBlocked: boolean; // Simulates road closure
  bidirectional?: boolean;
}

export type RoutingObjective = 'travelTime' | 'distance';

export interface RouteResult {
  path: string[]; // List of node IDs
  edges: GraphEdge[];
  totalDistanceKm: number;
  totalTravelTimeMinutes: number;
  totalCost: number;
  exploredNodesCount: number;
  exploredNodeIds: string[];
  executionTimeMs: number;
  operationsCount: number;
  algorithm: 'dijkstra' | 'astar';
  objective: RoutingObjective;
  found: boolean;
  message?: string;
}

export interface CityNetwork {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
