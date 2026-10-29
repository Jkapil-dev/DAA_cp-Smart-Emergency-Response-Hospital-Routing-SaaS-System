export type SeverityLevel = 'critical' | 'severe' | 'moderate' | 'minor';

export type ConsciousnessStatus = 'conscious' | 'semi-conscious' | 'unconscious' | 'unknown';
export type BreathingStatus = 'normal' | 'difficult' | 'absent' | 'unknown';
export type BleedingStatus = 'none' | 'controlled' | 'severe_uncontrolled' | 'unknown';

export interface IncidentObservations {
  injuredCount: number;
  consciousness: ConsciousnessStatus;
  breathing: BreathingStatus;
  bleeding: BleedingStatus;
  suspectedMajorInjury: boolean | 'unknown'; // head, neck, spinal, chest, major trauma
  trappedInVehicle: boolean | 'unknown';
  additionalNotes: string;
  callerName?: string;
  callerPhone?: string;
  callerId?: string;
  photoUrls?: string[]; // Supporting evidence only (previews, does not alter rule logic)
}

export interface SeverityEvaluation {
  severity: SeverityLevel;
  reasons: string[];
  overrides: string[];
  missingInformation: string[];
  requiresManualReview: boolean;
  requiredFacilityType: 'clinic' | 'general_hospital' | 'trauma_center';
  requiresALSAmbulance: boolean;
  timestamp: string;
}

export type DispatchStage =
  | 'reported'
  | 'ambulance_searching'
  | 'ambulance_assigned'
  | 'en_route_scene'
  | 'scene_arrived'
  | 'assessment_updated'
  | 'destination_confirmed'
  | 'en_route_hospital'
  | 'hospital_arrived'
  | 'completed'
  | 'escalated';

export interface Incident {
  id: string;
  title: string;
  locationNodeId: string;
  locationAddress?: string;
  coordinates?: { x: number; y: number };
  reportedAt: string;
  stage: DispatchStage;
  initialObservations: IncidentObservations;
  currentObservations: IncidentObservations;
  severityEvaluation: SeverityEvaluation;
  assignedAmbulanceId?: string;
  provisionalHospitalId?: string;
  confirmedHospitalId?: string;
  capacityOverrideConfirmed?: boolean;
  policeAlertId?: string;
  notesHistory: Array<{ timestamp: string; note: string; author: string }>;
}
