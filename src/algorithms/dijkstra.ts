import { CityNetwork, GraphEdge, RouteResult, RoutingObjective } from '../types/graph';
import { MinPriorityQueue } from './priorityQueue';

export interface DijkstraOptions {
  excludeEdgeIds?: Set<string>;
}

export function dijkstra(
  network: CityNetwork,
  sourceId: string,
  targetId: string,
  objective: RoutingObjective = 'travelTime',
  options: DijkstraOptions = {}
): RouteResult {
  const startTime = performance.now();
  let operationsCount = 0;

  // Validation
  const nodeExists = (id: string) => network.nodes.some((n) => n.id === id);
  if (!nodeExists(sourceId) || !nodeExists(targetId)) {
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
      algorithm: 'dijkstra',
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
      algorithm: 'dijkstra',
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

  const dist = new Map<string, number>();
  const prevNode = new Map<string, string | null>();
  const prevEdge = new Map<string, GraphEdge | null>();
  const visited = new Set<string>();
  const exploredNodeIds: string[] = [];

  for (const node of network.nodes) {
    dist.set(node.id, Infinity);
    prevNode.set(node.id, null);
    prevEdge.set(node.id, null);
  }

  const pq = new MinPriorityQueue<string>();
  dist.set(sourceId, 0);
  pq.enqueue(sourceId, 0);
  operationsCount++;

  let targetReached = false;

  while (!pq.isEmpty()) {
    const current = pq.dequeue();
    if (!current) break;
    operationsCount++;

    if (visited.has(current)) continue;
    visited.add(current);
    exploredNodeIds.push(current);

    if (current === targetId) {
      targetReached = true;
      break;
    }

    const currentDist = dist.get(current) ?? Infinity;
    const neighbors = adjacency.get(current) || [];

    for (const { neighborId, edge, weight } of neighbors) {
      operationsCount++;
      if (visited.has(neighborId)) continue;

      const newDist = currentDist + weight;
      const existingDist = dist.get(neighborId) ?? Infinity;

      if (newDist < existingDist) {
        dist.set(neighborId, newDist);
        prevNode.set(neighborId, current);
        prevEdge.set(neighborId, edge);
        pq.enqueue(neighborId, newDist);
        operationsCount++;
      }
    }
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(3));

  if (!targetReached || (dist.get(targetId) ?? Infinity) === Infinity) {
    return {
      path: [],
      edges: [],
      totalDistanceKm: 0,
      totalTravelTimeMinutes: 0,
      totalCost: Infinity,
      exploredNodesCount: visited.size,
      exploredNodeIds,
      executionTimeMs,
      operationsCount,
      algorithm: 'dijkstra',
      objective,
      found: false,
      message: `No feasible route found from ${sourceId} to ${targetId} due to network disconnection or road closures.`,
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
  const totalCost = Number((dist.get(targetId) ?? 0).toFixed(2));

  return {
    path,
    edges,
    totalDistanceKm,
    totalTravelTimeMinutes,
    totalCost,
    exploredNodesCount: visited.size,
    exploredNodeIds,
    executionTimeMs,
    operationsCount,
    algorithm: 'dijkstra',
    objective,
    found: true,
  };
}
