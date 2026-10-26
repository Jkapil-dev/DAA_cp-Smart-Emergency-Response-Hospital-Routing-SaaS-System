import { CityNetwork, GraphEdge, GraphNode, RouteResult, RoutingObjective } from '../types/graph';
import { MinPriorityQueue } from './priorityQueue';

export interface AStarOptions {
  excludeEdgeIds?: Set<string>;
}

/**
 * Admissible and consistent heuristic calculation.
 * Ensures h(n) <= true remaining cost to target.
 */
export function calculateHeuristic(
  node: GraphNode,
  target: GraphNode,
  objective: RoutingObjective
): number {
  const dx = node.x - target.x;
  const dy = node.y - target.y;
  const euclideanSvgDistance = Math.hypot(dx, dy);

  // Conservative scale factor: 1 SVG unit is at least 0.008 km.
  // Straight-line physical distance lower bound in km:
  const lowerBoundDistanceKm = euclideanSvgDistance * 0.008;

  if (objective === 'distance') {
    return lowerBoundDistanceKm;
  }

  // For travel time: Max network speed limit is 80 km/h = (80 / 60) km/min = 1.333 km/min.
  // Minimum time needed at maximum network speed:
  const maxNetworkSpeedKmPerMin = 80 / 60;
  const lowerBoundTravelTimeMinutes = lowerBoundDistanceKm / maxNetworkSpeedKmPerMin;

  return lowerBoundTravelTimeMinutes;
}

export function aStar(
  network: CityNetwork,
  sourceId: string,
  targetId: string,
  objective: RoutingObjective = 'travelTime',
  options: AStarOptions = {}
): RouteResult {
  const startTime = performance.now();
  let operationsCount = 0;

  const nodeMap = new Map<string, GraphNode>();
  for (const n of network.nodes) {
    nodeMap.set(n.id, n);
  }

  const sourceNode = nodeMap.get(sourceId);
  const targetNode = nodeMap.get(targetId);

  if (!sourceNode || !targetNode) {
    return {
      path: [],
      edges: [],
      totalDistanceKm: 0,
      totalTravelTimeMinutes: 0,
      totalCost: Infinity,
      exploredNodesCount: 0,
      exploredNodeIds: [],
      executionTimeMs: performance.now() - startTime,
      operationsCount: 0,
      algorithm: 'astar',
      objective,
      found: false,
      message: `Invalid source or target node: ${sourceId} -> ${targetId}`,
    };
  }

  if (sourceId === targetId) {
    return {
      path: [sourceId],
      edges: [],
      totalDistanceKm: 0,
      totalTravelTimeMinutes: 0,
      totalCost: 0,
      exploredNodesCount: 1,
      exploredNodeIds: [sourceId],
      executionTimeMs: performance.now() - startTime,
      operationsCount: 1,
      algorithm: 'astar',
      objective,
      found: true,
      message: 'Source and target are identical.',
    };
  }

  // Build Adjacency List
  const adjacency = new Map<string, Array<{ neighborId: string; edge: GraphEdge; weight: number }>>();
  for (const node of network.nodes) {
    adjacency.set(node.id, []);
  }

  const excludeEdges = options.excludeEdgeIds || new Set<string>();

  for (const edge of network.edges) {
    if (edge.isBlocked || excludeEdges.has(edge.id)) {
      continue;
    }
    const weight = objective === 'travelTime' ? edge.travelTimeMinutes : edge.distanceKm;

    adjacency.get(edge.from)?.push({ neighborId: edge.to, edge, weight });
    if (edge.bidirectional !== false) {
      adjacency.get(edge.to)?.push({ neighborId: edge.from, edge, weight });
    }
  }

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const prevNode = new Map<string, string | null>();
  const prevEdge = new Map<string, GraphEdge | null>();
  const closedSet = new Set<string>();
  const exploredNodeIds: string[] = [];

  for (const node of network.nodes) {
    gScore.set(node.id, Infinity);
    fScore.set(node.id, Infinity);
    prevNode.set(node.id, null);
    prevEdge.set(node.id, null);
  }

  const openQueue = new MinPriorityQueue<string>();
  gScore.set(sourceId, 0);

  const initialH = calculateHeuristic(sourceNode, targetNode, objective);
  fScore.set(sourceId, initialH);
  openQueue.enqueue(sourceId, initialH);
  operationsCount++;

  let targetReached = false;

  while (!openQueue.isEmpty()) {
    const current = openQueue.dequeue();
    if (!current) break;
    operationsCount++;

    if (closedSet.has(current)) continue;
    closedSet.add(current);
    exploredNodeIds.push(current);

    if (current === targetId) {
      targetReached = true;
      break;
    }

    const currentG = gScore.get(current) ?? Infinity;
    const neighbors = adjacency.get(current) || [];

    for (const { neighborId, edge, weight } of neighbors) {
      operationsCount++;
      if (closedSet.has(neighborId)) continue;

      const tentativeG = currentG + weight;
      const neighborG = gScore.get(neighborId) ?? Infinity;

      if (tentativeG < neighborG) {
        gScore.set(neighborId, tentativeG);
        prevNode.set(neighborId, current);
        prevEdge.set(neighborId, edge);

        const neighborNode = nodeMap.get(neighborId)!;
        const h = calculateHeuristic(neighborNode, targetNode, objective);
        const f = tentativeG + h;
        fScore.set(neighborId, f);

        openQueue.enqueue(neighborId, f);
        operationsCount++;
      }
    }
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(3));

  if (!targetReached || (gScore.get(targetId) ?? Infinity) === Infinity) {
    return {
      path: [],
      edges: [],
      totalDistanceKm: 0,
      totalTravelTimeMinutes: 0,
      totalCost: Infinity,
      exploredNodesCount: closedSet.size,
      exploredNodeIds,
      executionTimeMs,
      operationsCount,
      algorithm: 'astar',
      objective,
      found: false,
      message: `No feasible route found from ${sourceId} to ${targetId} via A* search.`,
    };
  }

  // Reconstruct path
  const path: string[] = [];
  const edges: GraphEdge[] = [];
  let curr: string | null = targetId;

  while (curr !== null) {
    path.unshift(curr);
    const edge = prevEdge.get(curr);
    if (edge) edges.unshift(edge);
    curr = prevNode.get(curr) ?? null;
  }

  const totalDistanceKm = Number(edges.reduce((sum, e) => sum + e.distanceKm, 0).toFixed(2));
  const totalTravelTimeMinutes = Number(edges.reduce((sum, e) => sum + e.travelTimeMinutes, 0).toFixed(2));
  const totalCost = Number((gScore.get(targetId) ?? 0).toFixed(2));

  return {
    path,
    edges,
    totalDistanceKm,
    totalTravelTimeMinutes,
    totalCost,
    exploredNodesCount: closedSet.size,
    exploredNodeIds,
    executionTimeMs,
    operationsCount,
    algorithm: 'astar',
    objective,
    found: true,
  };
}
