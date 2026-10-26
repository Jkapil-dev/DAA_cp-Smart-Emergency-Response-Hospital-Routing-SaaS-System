export type SeverityLevel = 'critical' | 'severe' | 'moderate' | 'minor';

export type ConsciousnessStatus = 'conscious' | 'semi-conscious' | 'unconscious';
export type BreathingStatus = 'normal' | 'difficult' | 'absent';
export type BleedingStatus = 'none' | 'controlled' | 'severe_uncontrolled';

export interface IncidentObservations {
  injuredCount: number;
  consciousness: ConsciousnessStatus;
  breathing: BreathingStatus;
  bleeding: BleedingStatus;
  suspectedMajorInjury: boolean; // e.g., head, neck, spinal, chest, major polytrauma
  trappedInVehicle: boolean;
  additionalNotes: string;
  photoUrls?: string[]; // Supporting evidence only (previews, does not alter rule logic)
}

export interface SeverityEvaluation {
  severity: SeverityLevel;
  reasons: string[];
  overrides: string[];
  requiredFacilityType: 'clinic' | 'general_hospital' | 'trauma_center';
  requiresALSAmbulance: boolean;
  timestamp: string;
}

export type DispatchStage =
  | 'reported'
  | 'ambulance_assigned'
  | 'en_route_scene'
  | 'scene_arrived'
  | 'assessment_updated'
  | 'destination_confirmed'
  | 'en_route_hospital'
  | 'completed';

export interface Incident {
  id: string;
  title: string;
  locationNodeId: string;
  reportedAt: string;
  stage: DispatchStage;
  initialObservations: IncidentObservations;
  currentObservations: IncidentObservations;
  severityEvaluation: SeverityEvaluation;
  assignedAmbulanceId?: string;
  provisionalHospitalId?: string;
  confirmedHospitalId?: string;
  capacityOverrideConfirmed?: boolean;
  notesHistory: Array<{ timestamp: string; note: string; author: string }>;
}
