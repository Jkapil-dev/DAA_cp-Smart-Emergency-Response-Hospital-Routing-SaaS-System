import { RouteResult } from './graph';
import { SeverityLevel } from './incident';

export type FacilityType = 'clinic' | 'general_hospital' | 'trauma_center';

export interface ProvisionalResourceRequest {
  bedsRequested: number;
  icuBedsRequested: number;
  bloodUnitsRequested: number;
  traumaBayRequired: boolean;
  reason: string;
}

export interface HospitalIncomingRequest {
  id: string;
  incidentId: string;
  severity: SeverityLevel;
  locationNodeId: string;
  injuredCount: number;
  estimatedArrivalMinutes: number;
  resourceRequest: ProvisionalResourceRequest;
  status: 'pending' | 'accepted' | 'divert' | 'capacity_override';
  timestamp: string;
  notes?: string;
}

export interface MedicalFacility {
  id: string;
  name: string;
  nodeId: string;
  type: FacilityType;
  totalBeds: number;
  availableBeds: number;
  totalIcuBeds: number;
  availableIcuBeds: number;
  bloodUnitsO: number; // O-Negative emergency units
  ventilatorsAvailable: number;
  traumaTeamsAvailable: number;
  traumaTeamReady: boolean;
  emergencyStatus: 'open' | 'divert' | 'full';
  capabilities: string[];
  contactPhone: string;
  address: string;
  incomingRequests?: HospitalIncomingRequest[];
}

export interface HospitalCandidateEvaluation {
  facility: MedicalFacility;
  isEligible: boolean;
  exclusionReason?: string;
  hasCapacityOverride: boolean; // Flagged when severe/critical patient is sent to trauma center with 0 available beds
  requiresDispatcherOverrideConfirmation: boolean;
  travelTimeMinutes: number;
  distanceKm: number;
  routeResult: RouteResult;
  suitabilityScore: number;
  matchReasons: string[];
}

export interface HospitalRecommendationResult {
  recommendedFacility: MedicalFacility | null;
  recommendedRoute: RouteResult | null;
  hasCapacityOverride: boolean;
  isProvisional: boolean;
  justification: string;
  candidates: HospitalCandidateEvaluation[];
  requiresIntervention: boolean;
  interventionReason?: string;
  provisionalResourceRequest?: ProvisionalResourceRequest;
}
