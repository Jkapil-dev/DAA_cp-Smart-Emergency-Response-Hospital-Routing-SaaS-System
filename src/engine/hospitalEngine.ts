import { MedicalFacility, HospitalCandidateEvaluation, HospitalRecommendationResult } from '../types/hospital';
import { CityNetwork, RoutingObjective } from '../types/graph';
import { Incident } from '../types/incident';
import { dijkstra } from '../algorithms/dijkstra';
import { aStar } from '../algorithms/astar';

export interface HospitalEngineOptions {
  algorithm?: 'dijkstra' | 'astar';
  objective?: RoutingObjective;
  isProvisional?: boolean;
}

/**
 * Deterministic Hospital Recommendation Engine.
 * Applies hard capability and suitability constraints BEFORE comparing route travel times.
 */
export function recommendHospital(
  facilities: MedicalFacility[],
  incident: Incident,
  network: CityNetwork,
  options: HospitalEngineOptions = {}
): HospitalRecommendationResult {
  const algorithm = options.algorithm || 'dijkstra';
  const objective = options.objective || 'travelTime';
  const isProvisional = options.isProvisional ?? (incident.stage !== 'destination_confirmed' && incident.stage !== 'en_route_hospital');
  const router = algorithm === 'astar' ? aStar : dijkstra;

  const severity = incident.severityEvaluation.severity;
  const candidates: HospitalCandidateEvaluation[] = [];

  for (const facility of facilities) {
    let isEligible = true;
    let exclusionReason: string | undefined;
    let hasCapacityOverride = false;
    let requiresDispatcherOverrideConfirmation = false;
    const matchReasons: string[] = [];

    // --- HARD CONSTRAINT 1: FACILITY TYPE & CAPABILITY SUITABILITY ---
    if (severity === 'critical' || severity === 'severe') {
      if (facility.type !== 'trauma_center') {
        isEligible = false;
        exclusionReason = `Facility is a ${facility.type.replace('_', ' ')} lacking Level 1/2 Trauma Resuscitation, surgical teams, and ICU capabilities required for ${severity.toUpperCase()} trauma triage.`;
      } else {
        matchReasons.push('Trauma-certified facility with specialized surgical resuscitation');
      }
    } else if (severity === 'moderate') {
      if (facility.type === 'clinic') {
        isEligible = false;
        exclusionReason = 'Community clinics lack emergency department, continuous observation beds, and advanced radiology required for MODERATE injury triage.';
      } else {
        matchReasons.push('Emergency department capable with inpatient diagnostic services');
      }
    } else {
      // Minor: Clinics are ideal
      if (facility.type === 'clinic') {
        matchReasons.push('Appropriate low-acuity urgent care clinic, preserves emergency hospital capacity');
      } else {
        matchReasons.push('Capable hospital, but higher acuity than strictly necessary for minor injury');
      }
    }

    // --- HARD CONSTRAINT 2: BED CAPACITY HANDLING BY SEVERITY ---
    if (facility.availableBeds <= 0) {
      if (severity === 'critical' || severity === 'severe') {
        // RULE 4: Trauma hospital with 0 beds is NOT excluded solely on capacity!
        // It triggers an emergency capacity override for life-saving trauma care.
        if (facility.type === 'trauma_center') {
          hasCapacityOverride = true;
          requiresDispatcherOverrideConfirmation = true;
          matchReasons.push('CAPACITY OVERRIDE: 0 standard beds available, but essential trauma resuscitation capabilities mandate destination eligibility. Emergency corridor confirmation required.');
        } else {
          isEligible = false;
          exclusionReason = 'Zero beds available in non-trauma facility.';
        }
      } else if (severity === 'moderate') {
        // RULE 5: Moderate cases require available beds or are de-prioritized/diverted
        isEligible = false;
        exclusionReason = 'Facility at 0 bed capacity (Divert status). Ineligible for moderate admissions to avoid ER overcrowding.';
      } else {
        // Minor: Clinic with 0 beds cannot accept patients
        isEligible = false;
        exclusionReason = 'Clinic has 0 available observation slots.';
      }
    } else {
      matchReasons.push(`${facility.availableBeds} beds available in current operational census`);
    }

    // --- ROUTE CALCULATION FROM INCIDENT LOCATION TO FACILITY ---
    const route = router(network, incident.locationNodeId, facility.nodeId, objective);

    if (!route.found) {
      isEligible = false;
      exclusionReason = exclusionReason
        ? `${exclusionReason} | Road access unreachable (road closures).`
        : 'Road route unreachable due to active road closures.';
    }

    // Calculate suitability score (higher is better)
    // Suitability considers type appropriateness, capacity margin, and travel time
    let suitabilityScore = 0;
    if (isEligible) {
      suitabilityScore = 1000 - (route.found ? route.totalTravelTimeMinutes * 10 : 999);
      if (severity === 'minor' && facility.type === 'clinic') {
        suitabilityScore += 150; // Bonus for clinic triage of minor injuries
      }
      if (severity === 'critical' && facility.type === 'trauma_center') {
        suitabilityScore += 200;
      }
      if (facility.availableBeds > 0) {
        suitabilityScore += Math.min(facility.availableBeds * 5, 50);
      }
      if (hasCapacityOverride) {
        suitabilityScore -= 50; // Slight penalty when capacity override is needed vs an open trauma bed
      }
    }

    candidates.push({
      facility,
      isEligible,
      exclusionReason,
      hasCapacityOverride,
      requiresDispatcherOverrideConfirmation,
      travelTimeMinutes: route.found ? route.totalTravelTimeMinutes : Infinity,
      distanceKm: route.found ? route.totalDistanceKm : Infinity,
      routeResult: route,
      suitabilityScore,
      matchReasons,
    });
  }

  // Filter eligible candidates
  const eligibleCandidates = candidates
    .filter((c) => c.isEligible && c.travelTimeMinutes < Infinity)
    .sort((a, b) => {
      // Prioritize primary suitability score, which factors travel time and acuity match
      if (a.hasCapacityOverride !== b.hasCapacityOverride) {
        // Prefer facility with actual beds over capacity override if both are eligible
        return a.hasCapacityOverride ? 1 : -1;
      }
      return a.travelTimeMinutes - b.travelTimeMinutes;
    });

  if (eligibleCandidates.length === 0) {
    return {
      recommendedFacility: null,
      recommendedRoute: null,
      hasCapacityOverride: false,
      isProvisional,
      justification: `NO SUITABLE FACILITY AVAILABLE: All simulated facilities were either excluded by medical suitability constraints (e.g. clinics ineligible for ${severity} triage), have zero capacity without override eligibility, or are blocked by road closures. IMMEDIATE DISPATCHER MUTUAL-AID INTERVENTION REQUIRED.`,
      candidates,
      requiresIntervention: true,
      interventionReason: `All facilities are either medically inadequate for ${severity} triage or unreachable via current road network. Contact regional emergency dispatch for inter-county trauma transport.`,
    };
  }

  const bestCandidate = eligibleCandidates[0];
  const facility = bestCandidate.facility;

  let justification = '';
  if (bestCandidate.hasCapacityOverride) {
    justification = `CRITICAL OVERRIDE SELECTION: Recommended ${facility.name} (${bestCandidate.travelTimeMinutes} min, ${bestCandidate.distanceKm} km). Facility reports 0 available beds, but life-saving trauma capability is mandatory. Emergency bay override must be confirmed with charge physician.`;
  } else if (severity === 'minor') {
    justification = `Recommended ${facility.name} (${bestCandidate.travelTimeMinutes} min, ${bestCandidate.distanceKm} km). Ideal low-acuity destination with ${facility.availableBeds} beds available, preserving emergency hospital bays.`;
  } else {
    justification = `Recommended ${facility.name} (${bestCandidate.travelTimeMinutes} min, ${bestCandidate.distanceKm} km). Matches required ${facility.type.replace('_', ' ')} capabilities with ${facility.availableBeds} operational beds available.`;
  }

  return {
    recommendedFacility: facility,
    recommendedRoute: bestCandidate.routeResult,
    hasCapacityOverride: bestCandidate.hasCapacityOverride,
    isProvisional,
    justification,
    candidates,
    requiresIntervention: false,
  };
}
