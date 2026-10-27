import { CityNetwork, RoutingObjective } from '../types/graph';
import { Ambulance } from '../types/ambulance';
import { Incident } from '../types/incident';
import {
  GridCell,
  GridConfig,
  GridSearchResult,
  RingSearchStep,
  CandidateEvaluationTrace,
  GridScanComparison,
} from '../types/grid';
import { dijkstra } from '../algorithms/dijkstra';
import { aStar } from '../algorithms/astar';

export const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: 4,
  rows: 3,
  totalWidth: 1000,
  totalHeight: 600,
  cellWidth: 250,
  cellHeight: 200,
  maxRings: 4,
  acknowledgementTimeoutSeconds: 15,
};

/**
 * Generates the grid cells based on configuration and maps all network nodes to cells.
 */
export function buildGrid(network: CityNetwork, config: GridConfig = DEFAULT_GRID_CONFIG): GridCell[] {
  const cells: GridCell[] = [];

  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.columns; c++) {
      const minX = c * config.cellWidth;
      const maxX = (c + 1) * config.cellWidth;
      const minY = r * config.cellHeight;
      const maxY = (r + 1) * config.cellHeight;

      // Find all nodes in this cell's bounding box
      const nodeIds = network.nodes
        .filter((n) => {
          const inX = n.x >= minX && (c === config.columns - 1 ? n.x <= maxX : n.x < maxX);
          const inY = n.y >= minY && (r === config.rows - 1 ? n.y <= maxY : n.y < maxY);
          return inX && inY;
        })
        .map((n) => n.id);

      cells.push({
        id: `CELL-${c}-${r}`,
        col: c,
        row: r,
        bounds: { minX, maxX, minY, maxY },
        nodeIds,
      });
    }
  }

  return cells;
}

/**
 * Maps a specific node ID or coordinate to its grid cell.
 */
export function getCellForNode(
  nodeId: string,
  network: CityNetwork,
  config: GridConfig = DEFAULT_GRID_CONFIG
): { col: number; row: number; cellId: string } | null {
  const node = network.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const col = Math.min(
    config.columns - 1,
    Math.max(0, Math.floor(node.x / config.cellWidth))
  );
  const row = Math.min(
    config.rows - 1,
    Math.max(0, Math.floor(node.y / config.cellHeight))
  );

  return {
    col,
    row,
    cellId: `CELL-${col}-${row}`,
  };
}

/**
 * Returns all cells that are at Chebyshev distance = ringIndex from (incidentCol, incidentRow).
 */
export function getCellsAtRing(
  incidentCol: number,
  incidentRow: number,
  ringIndex: number,
  config: GridConfig = DEFAULT_GRID_CONFIG
): Array<{ col: number; row: number; cellId: string }> {
  const result: Array<{ col: number; row: number; cellId: string }> = [];

  if (ringIndex === 0) {
    if (
      incidentCol >= 0 &&
      incidentCol < config.columns &&
      incidentRow >= 0 &&
      incidentRow < config.rows
    ) {
      result.push({
        col: incidentCol,
        row: incidentRow,
        cellId: `CELL-${incidentCol}-${incidentRow}`,
      });
    }
    return result;
  }

  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.columns; c++) {
      const chebyshevDist = Math.max(Math.abs(c - incidentCol), Math.abs(r - incidentRow));
      if (chebyshevDist === ringIndex) {
        result.push({ col: c, row: r, cellId: `CELL-${c}-${r}` });
      }
    }
  }

  return result;
}

export interface GridSearchOptions {
  config?: GridConfig;
  algorithm?: 'dijkstra' | 'astar';
  objective?: RoutingObjective;
  excludedAmbulanceIds?: string[]; // E.g., ambulances that previously declined this incident
}

/**
 * Executes expanding square-grid ambulance discovery.
 * Step 1: Identify incident cell.
 * Step 2: Search nearest cell (Ring 0).
 * Step 3: Expand outward in square rings (Ring 1, 2, ...).
 * Step 4: For ambulances found in discovered area, evaluate feasibility and rank by graph travel time.
 * Step 5: Stop when eligible candidate found or escalate if fleet exhausted.
 */
export function searchAmbulanceExpandingGrid(
  ambulances: Ambulance[],
  incident: Incident,
  network: CityNetwork,
  options: GridSearchOptions = {}
): GridSearchResult {
  const config = options.config || DEFAULT_GRID_CONFIG;
  const algorithm = options.algorithm || 'dijkstra';
  const objective = options.objective || 'travelTime';
  const excludedIds = new Set(options.excludedAmbulanceIds || []);
  const router = algorithm === 'astar' ? aStar : dijkstra;

  const requiresALS = incident.severityEvaluation.requiresALSAmbulance;
  const incidentCell = getCellForNode(incident.locationNodeId, network, config);

  if (!incidentCell) {
    return {
      incidentNodeId: incident.locationNodeId,
      incidentCellId: 'UNKNOWN',
      incidentCell: { col: 0, row: 0 },
      searchedRings: [],
      allSearchedCellIds: [],
      evaluatedCandidates: [],
      selectedAmbulanceId: null,
      selectedRingIndex: null,
      selectionReason: 'Incident node not found in city network graph.',
      escalated: true,
      escalationReason: 'Invalid incident location coordinates.',
      timestamp: new Date().toISOString(),
    };
  }

  // Pre-map ambulance current node to cell
  const ambulanceCellMap = new Map<string, { col: number; row: number; cellId: string }>();
  ambulances.forEach((amb) => {
    const cell = getCellForNode(amb.currentNodeId, network, config);
    if (cell) ambulanceCellMap.set(amb.id, cell);
  });

  const searchedRings: RingSearchStep[] = [];
  const allSearchedCellIds: string[] = [];
  const evaluatedCandidates: CandidateEvaluationTrace[] = [];

  let selectedAmbulance: Ambulance | null = null;
  let selectedRing: number | null = null;
  let selectionReason = '';

  // Max search rings based on grid dimensions
  const maxSearchRings = Math.min(
    config.maxRings,
    Math.max(config.columns, config.rows)
  );

  // Expanding ring loop
  for (let ring = 0; ring <= maxSearchRings; ring++) {
    const ringCells = getCellsAtRing(incidentCell.col, incidentCell.row, ring, config);
    if (ringCells.length === 0) continue;

    const ringCellIds = ringCells.map((c) => c.cellId);
    allSearchedCellIds.push(...ringCellIds);

    // Find ambulances physically located in these ring cells
    const ambulancesInRing = ambulances.filter((amb) => {
      const ambCell = ambulanceCellMap.get(amb.id);
      return ambCell && ringCellIds.includes(ambCell.cellId);
    });

    searchedRings.push({
      ringIndex: ring,
      cellIds: ringCellIds,
      candidateAmbulanceIds: ambulancesInRing.map((a) => a.id),
    });

    // Evaluate candidates discovered in this ring
    const ringEvaluations: CandidateEvaluationTrace[] = [];

    for (const amb of ambulancesInRing) {
      const ambCell = ambulanceCellMap.get(amb.id)!;

      // Check exclusions (e.g. driver declined)
      if (excludedIds.has(amb.id)) {
        ringEvaluations.push({
          ambulanceId: amb.id,
          callSign: amb.callSign,
          type: amb.type,
          status: 'declined_retry',
          cellId: ambCell.cellId,
          ringIndex: ring,
          travelTimeMinutes: Infinity,
          distanceKm: Infinity,
          isEligible: false,
          reason: 'Ambulance driver previously declined this incident dispatch.',
        });
        continue;
      }

      // Check availability (must be available, not reserved for another incident)
      if (amb.status !== 'available' && !(amb.status === 'reserved' && amb.reservedForIncidentId === incident.id)) {
        ringEvaluations.push({
          ambulanceId: amb.id,
          callSign: amb.callSign,
          type: amb.type,
          status: amb.status,
          cellId: ambCell.cellId,
          ringIndex: ring,
          travelTimeMinutes: Infinity,
          distanceKm: Infinity,
          isEligible: false,
          reason: `Ambulance currently ${amb.status} (Occupied on other duty).`,
        });
        continue;
      }

      // Check ALS / BLS capability requirement
      const meetsCapability = !requiresALS || amb.type === 'ALS';
      if (!meetsCapability) {
        ringEvaluations.push({
          ambulanceId: amb.id,
          callSign: amb.callSign,
          type: amb.type,
          status: amb.status,
          cellId: ambCell.cellId,
          ringIndex: ring,
          travelTimeMinutes: Infinity,
          distanceKm: Infinity,
          isEligible: false,
          reason: `Triage requires Advanced Life Support (ALS); unit provides Basic Life Support (${amb.type}) only.`,
        });
        continue;
      }

      // Step 4: Calculate actual graph route travel time over the road network
      const route = router(network, amb.currentNodeId, incident.locationNodeId, objective);

      if (!route.found) {
        ringEvaluations.push({
          ambulanceId: amb.id,
          callSign: amb.callSign,
          type: amb.type,
          status: amb.status,
          cellId: ambCell.cellId,
          ringIndex: ring,
          travelTimeMinutes: Infinity,
          distanceKm: Infinity,
          isEligible: false,
          reason: 'No feasible road route to scene (Blocked by road closures).',
        });
        continue;
      }

      ringEvaluations.push({
        ambulanceId: amb.id,
        callSign: amb.callSign,
        type: amb.type,
        status: amb.status,
        cellId: ambCell.cellId,
        ringIndex: ring,
        travelTimeMinutes: route.totalTravelTimeMinutes,
        distanceKm: route.totalDistanceKm,
        isEligible: true,
        reason: `Discovered in Ring ${ring} (${ambCell.cellId}): Feasible road route ${route.totalTravelTimeMinutes}m (${route.totalDistanceKm}km).`,
      });
    }

    evaluatedCandidates.push(...ringEvaluations);

    // Filter eligible candidates found in this ring
    const eligibleInRing = ringEvaluations
      .filter((c) => c.isEligible && c.travelTimeMinutes < Infinity)
      .sort((a, b) => a.travelTimeMinutes - b.travelTimeMinutes);

    if (eligibleInRing.length > 0) {
      // Pick best candidate by graph route travel time within discovered ring
      const winner = eligibleInRing[0];
      selectedAmbulance = ambulances.find((a) => a.id === winner.ambulanceId) || null;
      selectedRing = ring;
      selectionReason = `Discovered ${winner.callSign} (${winner.type}) in Ring ${ring} (${winner.cellId}): Optimal travel time ${winner.travelTimeMinutes} min (${winner.distanceKm} km). Fully satisfies ${incident.severityEvaluation.severity.toUpperCase()} incident capability requirements.`;
      break; // Stop expanding; we found an eligible candidate!
    }
  }

  // Fallback: If no ALS found after all rings, check for available BLS fallback in all searched candidates
  if (!selectedAmbulance) {
    const availableAny = evaluatedCandidates
      .filter((c) => c.travelTimeMinutes < Infinity && !excludedIds.has(c.ambulanceId))
      .sort((a, b) => a.travelTimeMinutes - b.travelTimeMinutes);

    if (availableAny.length > 0) {
      const fallbackWinner = availableAny[0];
      selectedAmbulance = ambulances.find((a) => a.id === fallbackWinner.ambulanceId) || null;
      selectedRing = fallbackWinner.ringIndex;
      selectionReason = `FALLBACK WARNING: No ALS unit available in searched grid. Dispatched closest available unit ${fallbackWinner.callSign} (${fallbackWinner.type}) from Ring ${fallbackWinner.ringIndex} with ETA ${fallbackWinner.travelTimeMinutes} min. ALS rendezvous or flight medic support requested.`;
    }
  }

  const escalated = !selectedAmbulance;
  const escalationReason = escalated
    ? `FLEET EXHAUSTED: Expanded search across ${searchedRings.length} square rings (${allSearchedCellIds.length} cells). No eligible, available ambulances with feasible road access to node ${incident.locationNodeId}. Regional mutual-aid emergency dispatch escalation triggered.`
    : undefined;

  return {
    incidentNodeId: incident.locationNodeId,
    incidentCellId: incidentCell.cellId,
    incidentCell: { col: incidentCell.col, row: incidentCell.row },
    searchedRings,
    allSearchedCellIds,
    evaluatedCandidates,
    selectedAmbulanceId: selectedAmbulance?.id || null,
    selectedRingIndex: selectedRing,
    selectionReason,
    escalated,
    escalationReason,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Compares Grid-Based Discovery against Full-Fleet Scan for Algorithm Lab benchmarking.
 */
export function compareGridVsFullFleet(
  ambulances: Ambulance[],
  incident: Incident,
  network: CityNetwork,
  options: GridSearchOptions = {}
): GridScanComparison {
  const tGridStart = performance.now();
  const gridResult = searchAmbulanceExpandingGrid(ambulances, incident, network, options);
  const tGridEnd = performance.now();

  // Full fleet scan calculates routes for ALL ambulances regardless of distance or grid
  const tFullStart = performance.now();
  const router = options.algorithm === 'astar' ? aStar : dijkstra;
  const objective = options.objective || 'travelTime';
  const requiresALS = incident.severityEvaluation.requiresALSAmbulance;

  let fullFleetSelectedId: string | null = null;
  let fullFleetBestTime = Infinity;

  const fullFleetEvaluated = ambulances.map((amb) => {
    const isAvailable = amb.status === 'available';
    const meetsCapability = !requiresALS || amb.type === 'ALS';
    if (!isAvailable || !meetsCapability) {
      return { id: amb.id, time: Infinity, eligible: false };
    }
    const route = router(network, amb.currentNodeId, incident.locationNodeId, objective);
    if (route.found && route.totalTravelTimeMinutes < fullFleetBestTime) {
      fullFleetBestTime = route.totalTravelTimeMinutes;
      fullFleetSelectedId = amb.id;
    }
    return { id: amb.id, time: route.found ? route.totalTravelTimeMinutes : Infinity, eligible: route.found };
  });
  const tFullEnd = performance.now();

  const totalGridCells = (options.config || DEFAULT_GRID_CONFIG).columns * (options.config || DEFAULT_GRID_CONFIG).rows;
  const gridAmbulancesEvaluated = gridResult.evaluatedCandidates.length;
  const fleetReductionPercent =
    ambulances.length > 0
      ? Number((((ambulances.length - gridAmbulancesEvaluated) / ambulances.length) * 100).toFixed(1))
      : 0;

  const summary = `Expanding square-grid examined ${gridResult.allSearchedCellIds.length}/${totalGridCells} cells across ${gridResult.searchedRings.length} ring(s). Evaluated ${gridAmbulancesEvaluated} fleet candidate(s) vs ${ambulances.length} in full-fleet scan (${fleetReductionPercent}% reduction in initial graph search scope).`;

  return {
    grid: {
      cellsExamined: gridResult.allSearchedCellIds.length,
      totalCells: totalGridCells,
      ambulancesEvaluated: gridAmbulancesEvaluated,
      routeCalculationsCount: gridResult.evaluatedCandidates.filter((c) => c.travelTimeMinutes < Infinity).length,
      expansionRingsReached: gridResult.searchedRings.length,
      executionTimeMs: Number((tGridEnd - tGridStart).toFixed(2)),
      selectedAmbulanceId: gridResult.selectedAmbulanceId,
      travelTimeMinutes:
        gridResult.evaluatedCandidates.find((c) => c.ambulanceId === gridResult.selectedAmbulanceId)?.travelTimeMinutes || 0,
    },
    fullFleet: {
      ambulancesEvaluated: fullFleetEvaluated.length,
      routeCalculationsCount: fullFleetEvaluated.filter((e) => e.eligible).length,
      executionTimeMs: Number((tFullEnd - tFullStart).toFixed(2)),
      selectedAmbulanceId: fullFleetSelectedId,
      travelTimeMinutes: fullFleetBestTime < Infinity ? fullFleetBestTime : 0,
    },
    fleetReductionPercent,
    summary,
  };
}
