import { RouteResult } from './graph';

export type FacilityType = 'clinic' | 'general_hospital' | 'trauma_center';

export interface MedicalFacility {
  id: string;
  name: string;
  nodeId: string;
  type: FacilityType;
  totalBeds: number;
  availableBeds: number;
  emergencyStatus: 'open' | 'divert' | 'full';
  capabilities: string[];
  contactPhone: string;
  address: string;
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
}
