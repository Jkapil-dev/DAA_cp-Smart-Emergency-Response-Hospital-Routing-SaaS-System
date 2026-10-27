export interface GridCell {
  id: string; // e.g. "CELL-0-0"
  col: number; // 0-indexed column
  row: number; // 0-indexed row
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  nodeIds: string[];
}

export interface GridConfig {
  columns: number;
  rows: number;
  totalWidth: number;
  totalHeight: number;
  cellWidth: number;
  cellHeight: number;
  maxRings: number;
  acknowledgementTimeoutSeconds: number;
}

export interface CandidateEvaluationTrace {
  ambulanceId: string;
  callSign: string;
  type: 'ALS' | 'BLS';
  status: string;
  cellId: string;
  ringIndex: number;
  travelTimeMinutes: number;
  distanceKm: number;
  isEligible: boolean;
  reason: string;
}

export interface RingSearchStep {
  ringIndex: number;
  cellIds: string[];
  candidateAmbulanceIds: string[];
}

export interface GridSearchResult {
  incidentNodeId: string;
  incidentCellId: string;
  incidentCell: { col: number; row: number };
  searchedRings: RingSearchStep[];
  allSearchedCellIds: string[];
  evaluatedCandidates: CandidateEvaluationTrace[];
  selectedAmbulanceId: string | null;
  selectedRingIndex: number | null;
  selectionReason: string;
  escalated: boolean;
  escalationReason?: string;
  timestamp: string;
}

export interface GridScanComparison {
  grid: {
    cellsExamined: number;
    totalCells: number;
    ambulancesEvaluated: number;
    routeCalculationsCount: number;
    expansionRingsReached: number;
    executionTimeMs: number;
    selectedAmbulanceId: string | null;
    travelTimeMinutes: number;
  };
  fullFleet: {
    ambulancesEvaluated: number;
    routeCalculationsCount: number;
    executionTimeMs: number;
    selectedAmbulanceId: string | null;
    travelTimeMinutes: number;
  };
  fleetReductionPercent: number;
  summary: string;
}
