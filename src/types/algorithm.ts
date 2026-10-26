import { RouteResult, RoutingObjective } from './graph';

export interface AlgorithmMetrics {
  name: 'Dijkstra' | 'A* Search';
  timeComplexityTheoretical: string;
  spaceComplexityTheoretical: string;
  executionTimeMs: number;
  exploredNodesCount: number;
  operationsCount: number;
  pathLengthNodes: number;
  totalDistanceKm: number;
  totalTravelTimeMinutes: number;
  totalCost: number;
  routeResult: RouteResult;
}

export interface AlgorithmComparisonResult {
  sourceNodeId: string;
  targetNodeId: string;
  objective: RoutingObjective;
  dijkstra: AlgorithmMetrics;
  astar: AlgorithmMetrics;
  samePathFound: boolean;
  costDifference: number;
  exploredNodeDifference: number; // dijkstra.explored - astar.explored
  searchEfficiencyGainPercent: number; // ((dijkstra.explored - astar.explored) / dijkstra.explored) * 100
  analysisSummary: string;
}
