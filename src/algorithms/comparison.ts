import { CityNetwork, RoutingObjective } from '../types/graph';
import { AlgorithmComparisonResult, AlgorithmMetrics } from '../types/algorithm';
import { dijkstra } from './dijkstra';
import { aStar } from './astar';

export function compareAlgorithms(
  network: CityNetwork,
  sourceId: string,
  targetId: string,
  objective: RoutingObjective = 'travelTime'
): AlgorithmComparisonResult {
  // Execute Dijkstra
  const dijkstraResult = dijkstra(network, sourceId, targetId, objective);

  // Execute A*
  const astarResult = aStar(network, sourceId, targetId, objective);

  const dijkstraMetrics: AlgorithmMetrics = {
    name: 'Dijkstra',
    timeComplexityTheoretical: 'O((|V| + |E|) · log |V|)',
    spaceComplexityTheoretical: 'O(|V| + |E|)',
    executionTimeMs: dijkstraResult.executionTimeMs,
    exploredNodesCount: dijkstraResult.exploredNodesCount,
    operationsCount: dijkstraResult.operationsCount,
    pathLengthNodes: dijkstraResult.path.length,
    totalDistanceKm: dijkstraResult.totalDistanceKm,
    totalTravelTimeMinutes: dijkstraResult.totalTravelTimeMinutes,
    totalCost: dijkstraResult.totalCost,
    routeResult: dijkstraResult,
  };

  const astarMetrics: AlgorithmMetrics = {
    name: 'A* Search',
    timeComplexityTheoretical: 'O((|V| + |E|) · log |V|) [Worst] / O(b^d) [Average heuristic-guided]',
    spaceComplexityTheoretical: 'O(|V|)',
    executionTimeMs: astarResult.executionTimeMs,
    exploredNodesCount: astarResult.exploredNodesCount,
    operationsCount: astarResult.operationsCount,
    pathLengthNodes: astarResult.path.length,
    totalDistanceKm: astarResult.totalDistanceKm,
    totalTravelTimeMinutes: astarResult.totalTravelTimeMinutes,
    totalCost: astarResult.totalCost,
    routeResult: astarResult,
  };

  const samePathFound =
    dijkstraResult.found &&
    astarResult.found &&
    JSON.stringify(dijkstraResult.path) === JSON.stringify(astarResult.path);

  const costDifference = Number(Math.abs(dijkstraResult.totalCost - astarResult.totalCost).toFixed(2));
  const exploredNodeDifference = dijkstraResult.exploredNodesCount - astarResult.exploredNodesCount;
  
  const searchEfficiencyGainPercent =
    dijkstraResult.exploredNodesCount > 0
      ? Number(
          (
            ((dijkstraResult.exploredNodesCount - astarResult.exploredNodesCount) /
              dijkstraResult.exploredNodesCount) *
            100
          ).toFixed(1)
        )
      : 0;

  let analysisSummary = '';
  if (!dijkstraResult.found || !astarResult.found) {
    analysisSummary = 'One or both algorithms could not reach the target vertex due to blocked roads or disconnected components.';
  } else if (samePathFound) {
    analysisSummary = `Both Dijkstra and A* identified the optimal path with identical cost (${dijkstraResult.totalCost} ${objective === 'travelTime' ? 'min' : 'km'}). A* evaluated ${astarResult.exploredNodesCount} nodes vs Dijkstra's ${dijkstraResult.exploredNodesCount} nodes (${searchEfficiencyGainPercent >= 0 ? `${searchEfficiencyGainPercent}% fewer vertices explored` : 'similar exploration'}).`;
  } else {
    analysisSummary = `Both algorithms found valid paths. Path cost delta: ${costDifference} ${objective === 'travelTime' ? 'min' : 'km'}.`;
  }

  return {
    sourceNodeId: sourceId,
    targetNodeId: targetId,
    objective,
    dijkstra: dijkstraMetrics,
    astar: astarMetrics,
    samePathFound,
    costDifference,
    exploredNodeDifference,
    searchEfficiencyGainPercent,
    analysisSummary,
  };
}
