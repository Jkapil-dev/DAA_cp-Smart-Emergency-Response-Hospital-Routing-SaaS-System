export type AmbulanceType = 'ALS' | 'BLS'; // Advanced Life Support vs Basic Life Support

export type AmbulanceStatus = 'available' | 'dispatched' | 'en_route_scene' | 'on_scene' | 'transporting' | 'maintenance';

export interface Ambulance {
  id: string;
  callSign: string;
  type: AmbulanceType;
  currentNodeId: string;
  status: AmbulanceStatus;
  crewSummary: string; // e.g. "Paramedic + EMT" or "2x EMT-Basic"
  capabilities: string[];
  equipment: string[];
  currentIncidentId?: string;
}

export interface AmbulanceRecommendation {
  recommendedAmbulance: Ambulance;
  routeToIncident: {
    path: string[];
    travelTimeMinutes: number;
    distanceKm: number;
  };
  selectionReason: string;
  candidateRankings: Array<{
    ambulance: Ambulance;
    travelTimeMinutes: number;
    distanceKm: number;
    isEligible: boolean;
    ineligibilityReason?: string;
  }>;
}
