import { Ambulance, AmbulanceRecommendation } from '../types/ambulance';
import { CityNetwork, RoutingObjective } from '../types/graph';
import { Incident } from '../types/incident';
import { dijkstra } from '../algorithms/dijkstra';
import { aStar } from '../algorithms/astar';

export interface AmbulanceEngineOptions {
  algorithm?: 'dijkstra' | 'astar';
  objective?: RoutingObjective;
}

export function selectBestAmbulance(
  ambulances: Ambulance[],
  incident: Incident,
  network: CityNetwork,
  options: AmbulanceEngineOptions = {}
): AmbulanceRecommendation | null {
  const algorithm = options.algorithm || 'dijkstra';
  const objective = options.objective || 'travelTime';
  const router = algorithm === 'astar' ? aStar : dijkstra;

  const requiresALS = incident.severityEvaluation.requiresALSAmbulance;

  // Evaluate all ambulances
  const evaluatedCandidates: AmbulanceRecommendation['candidateRankings'] = [];

  for (const amb of ambulances) {
    const isAvailable = amb.status === 'available';
    if (!isAvailable) {
      evaluatedCandidates.push({
        ambulance: amb,
        travelTimeMinutes: Infinity,
        distanceKm: Infinity,
        isEligible: false,
        ineligibilityReason: `Ambulance is currently ${amb.status} (Occupied on other duty)`,
      });
      continue;
    }

    // Check capability match
    const meetsCapability = !requiresALS || amb.type === 'ALS';
    let ineligibilityReason: string | undefined;

    if (!meetsCapability) {
      ineligibilityReason = `Incident requires Advanced Life Support (ALS) for ${incident.severityEvaluation.severity} triage; unit provides BLS only.`;
    }

    // Calculate route from ambulance location to incident
    const route = router(network, amb.currentNodeId, incident.locationNodeId, objective);

    if (!route.found) {
      evaluatedCandidates.push({
        ambulance: amb,
        travelTimeMinutes: Infinity,
        distanceKm: Infinity,
        isEligible: false,
        ineligibilityReason: `No feasible road route to scene (Blocked by road closures)`,
      });
      continue;
    }

    evaluatedCandidates.push({
      ambulance: amb,
      travelTimeMinutes: route.totalTravelTimeMinutes,
      distanceKm: route.totalDistanceKm,
      isEligible: meetsCapability,
      ineligibilityReason,
    });
  }

  // Rank eligible ambulances first by travel time
  const eligibleCandidates = evaluatedCandidates
    .filter((c) => c.isEligible && c.travelTimeMinutes < Infinity)
    .sort((a, b) => a.travelTimeMinutes - b.travelTimeMinutes);

  // Fallback: If no ALS unit is available for critical/severe, pick the fastest available BLS unit with a clear warning
  let selected = eligibleCandidates[0];
  let isFallback = false;

  if (!selected) {
    const availableAny = evaluatedCandidates
      .filter((c) => c.ambulance.status === 'available' && c.travelTimeMinutes < Infinity)
      .sort((a, b) => a.travelTimeMinutes - b.travelTimeMinutes);

    if (availableAny.length > 0) {
      selected = availableAny[0];
      isFallback = true;
    } else {
      return null; // Zero available ambulances reachable
    }
  }

  // Calculate final route for the winner
  const bestRoute = router(
    network,
    selected.ambulance.currentNodeId,
    incident.locationNodeId,
    objective
  );

  let selectionReason = '';
  if (isFallback) {
    selectionReason = `FALLBACK WARNING: No ALS unit available. Dispatched closest available unit ${selected.ambulance.callSign} (${selected.ambulance.type}) with ETA ${selected.travelTimeMinutes} min. ALS rendezvous or flight medic support requested.`;
  } else {
    selectionReason = `Selected ${selected.ambulance.callSign} (${selected.ambulance.type}): Optimal travel time (${selected.travelTimeMinutes} min, ${selected.distanceKm} km). Fully satisfies ${incident.severityEvaluation.severity.toUpperCase()} incident capability requirements.`;
  }

  return {
    recommendedAmbulance: selected.ambulance,
    routeToIncident: {
      path: bestRoute.path,
      travelTimeMinutes: bestRoute.totalTravelTimeMinutes,
      distanceKm: bestRoute.totalDistanceKm,
    },
    selectionReason,
    candidateRankings: evaluatedCandidates.sort((a, b) => a.travelTimeMinutes - b.travelTimeMinutes),
  };
}
