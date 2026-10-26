import { describe, it, expect } from 'vitest';
import { getInitialCityNetwork } from '../data/cityGraph';
import { dijkstra } from '../algorithms/dijkstra';
import { aStar } from '../algorithms/astar';
import { compareAlgorithms } from '../algorithms/comparison';

describe('Graph Routing Algorithms: Dijkstra & A*', () => {
  const network = getInitialCityNetwork();

  it('Dijkstra finds optimal path on connected graph', () => {
    const res = dijkstra(network, 'N-01', 'N-06', 'travelTime');
    expect(res.found).toBe(true);
    expect(res.path[0]).toBe('N-01');
    expect(res.path[res.path.length - 1]).toBe('N-06');
    expect(res.totalTravelTimeMinutes).toBeGreaterThan(0);
    expect(res.totalDistanceKm).toBeGreaterThan(0);
  });

  it('A* finds equivalent optimal cost to Dijkstra', () => {
    const dij = dijkstra(network, 'N-01', 'N-18', 'travelTime');
    const ast = aStar(network, 'N-01', 'N-18', 'travelTime');

    expect(dij.found).toBe(true);
    expect(ast.found).toBe(true);
    expect(dij.totalCost).toBeCloseTo(ast.totalCost, 1);
  });

  it('A* explores fewer or equal nodes compared to Dijkstra due to heuristic pruning', () => {
    const comparison = compareAlgorithms(network, 'N-01', 'N-18', 'travelTime');
    expect(comparison.astar.exploredNodesCount).toBeLessThanOrEqual(
      comparison.dijkstra.exploredNodesCount
    );
  });

  it('Handles source === target', () => {
    const res = dijkstra(network, 'N-05', 'N-05');
    expect(res.found).toBe(true);
    expect(res.totalCost).toBe(0);
    expect(res.path).toEqual(['N-05']);
  });

  it('Reports failure when node does not exist', () => {
    const res = dijkstra(network, 'INVALID_1', 'N-05');
    expect(res.found).toBe(false);
    expect(res.totalCost).toBe(Infinity);
  });
});
