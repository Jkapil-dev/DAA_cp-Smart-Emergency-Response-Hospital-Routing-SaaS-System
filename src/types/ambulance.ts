export type AmbulanceType = 'ALS' | 'BLS'; // Advanced Life Support vs Basic Life Support

export type AmbulanceStatus =
  | 'available'
  | 'reserved'
  | 'dispatched'
  | 'en_route_scene'
  | 'on_scene'
  | 'transporting'
  | 'completed'
  | 'maintenance';

export interface Ambulance {
  id: string;
  callSign: string;
  type: AmbulanceType;
  currentNodeId: string;
  status: AmbulanceStatus;
  crewSummary: string; // e.g. "Lead Paramedic + Critical Care EMT"
  capabilities: string[];
  equipment: string[];
  currentIncidentId?: string;
  reservedForIncidentId?: string;
  reservationExpiresAt?: string;
  simulatedCoordinates?: { x: number; y: number };
  currentRoutePath?: string[];
  routeProgressIndex?: number;
  declineHistory?: Array<{ incidentId: string; reason: string; timestamp: string }>;
  verifiedEquipment?: string[];
}

export interface AmbulanceRecommendation {
  recommendedAmbulance: Ambulance;
  routeToIncident: {
    path: string[];
    travelTimeMinutes: number;
    distanceKm: number;
  };
  selectionReason: string;
  discoveryMethod?: 'grid_expansion' | 'full_fleet_scan';
  gridRingDiscovered?: number;
  candidateRankings: Array<{
    ambulance: Ambulance;
    travelTimeMinutes: number;
    distanceKm: number;
    isEligible: boolean;
    ineligibilityReason?: string;
  }>;
}
