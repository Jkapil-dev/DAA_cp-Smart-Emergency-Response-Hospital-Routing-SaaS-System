import { Ambulance, AmbulanceRecommendation } from '../types/ambulance';
import { CityNetwork, RoutingObjective } from '../types/graph';
import { Incident } from '../types/incident';
import { dijkstra } from '../algorithms/dijkstra';
import { aStar } from '../algorithms/astar';
import { searchAmbulanceExpandingGrid } from './gridDiscoveryEngine';

export interface AmbulanceEngineOptions {
  algorithm?: 'dijkstra' | 'astar';
  objective?: RoutingObjective;
  discoveryMethod?: 'grid_expansion' | 'full_fleet_scan';
  excludedAmbulanceIds?: string[];
}

export function selectBestAmbulance(
  ambulances: Ambulance[],
  incident: Incident,
  network: CityNetwork,
  options: AmbulanceEngineOptions = {}
): AmbulanceRecommendation | null {
  const algorithm = options.algorithm || 'dijkstra';
  const objective = options.objective || 'travelTime';
  const discoveryMethod = options.discoveryMethod || 'grid_expansion';
  const router = algorithm === 'astar' ? aStar : dijkstra;
  const requiresALS = incident.severityEvaluation.requiresALSAmbulance;

  if (discoveryMethod === 'grid_expansion') {
    const gridResult = searchAmbulanceExpandingGrid(ambulances, incident, network, {
      algorithm,
      objective,
      excludedAmbulanceIds: options.excludedAmbulanceIds,
    });

    if (!gridResult.selectedAmbulanceId) {
      return null;
    }

    const winner = ambulances.find((a) => a.id === gridResult.selectedAmbulanceId)!;
    const route = router(network, winner.currentNodeId, incident.locationNodeId, objective);

    // Build candidateRankings ensuring ALL ambulances in fleet are accounted for
    const evaluatedMap = new Map(gridResult.evaluatedCandidates.map((c) => [c.ambulanceId, c]));

    const candidateRankings: AmbulanceRecommendation['candidateRankings'] = ambulances.map((amb) => {
      const evalTrace = evaluatedMap.get(amb.id);
      if (evalTrace) {
        return {
          ambulance: amb,
          travelTimeMinutes: evalTrace.travelTimeMinutes,
          distanceKm: evalTrace.distanceKm,
          isEligible: evalTrace.isEligible,
          ineligibilityReason: evalTrace.isEligible ? undefined : evalTrace.reason,
        };
      }

      // If outside searched rings because a winner was discovered in an inner ring:
      const isAvailable = amb.status === 'available';
      const meetsCap = !requiresALS || amb.type === 'ALS';
      let ineligibilityReason: string | undefined;

      if (!isAvailable) {
        ineligibilityReason = `Ambulance is currently ${amb.status} (Occupied on other duty)`;
      } else if (!meetsCap) {
        ineligibilityReason = `Triage requires ALS; unit provides ${amb.type} only.`;
      } else {
        ineligibilityReason = `Outside expanding grid ring (Winner discovered in Ring ${gridResult.selectedRingIndex}).`;
      }

      return {
        ambulance: amb,
        travelTimeMinutes: Infinity,
        distanceKm: Infinity,
        isEligible: false,
        ineligibilityReason,
      };
    });

    return {
      recommendedAmbulance: winner,
      routeToIncident: {
        path: route.path,
        travelTimeMinutes: route.totalTravelTimeMinutes,
        distanceKm: route.totalDistanceKm,
      },
      selectionReason: gridResult.selectionReason,
      discoveryMethod: 'grid_expansion',
      gridRingDiscovered: gridResult.selectedRingIndex ?? undefined,
      candidateRankings: candidateRankings.sort((a, b) => a.travelTimeMinutes - b.travelTimeMinutes),
    };
  }

  // Full-fleet scan implementation
  const excludedIds = new Set(options.excludedAmbulanceIds || []);
  const evaluatedCandidates: AmbulanceRecommendation['candidateRankings'] = [];

  for (const amb of ambulances) {
    if (excludedIds.has(amb.id)) {
      evaluatedCandidates.push({
        ambulance: amb,
        travelTimeMinutes: Infinity,
        distanceKm: Infinity,
        isEligible: false,
        ineligibilityReason: 'Driver previously declined assignment.',
      });
      continue;
    }

    const isAvailable = amb.status === 'available' || (amb.status === 'reserved' && amb.reservedForIncidentId === incident.id);
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

    const meetsCapability = !requiresALS || amb.type === 'ALS';
    let ineligibilityReason: string | undefined;

    if (!meetsCapability) {
      ineligibilityReason = `Incident requires Advanced Life Support (ALS) for ${incident.severityEvaluation.severity} triage; unit provides BLS only.`;
    }

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

  const eligibleCandidates = evaluatedCandidates
    .filter((c) => c.isEligible && c.travelTimeMinutes < Infinity)
    .sort((a, b) => a.travelTimeMinutes - b.travelTimeMinutes);

  let selected = eligibleCandidates[0];
  let isFallback = false;

  if (!selected) {
    const availableAny = evaluatedCandidates
      .filter((c) => (c.ambulance.status === 'available' || c.ambulance.reservedForIncidentId === incident.id) && c.travelTimeMinutes < Infinity)
      .sort((a, b) => a.travelTimeMinutes - b.travelTimeMinutes);

    if (availableAny.length > 0) {
      selected = availableAny[0];
      isFallback = true;
    } else {
      return null;
    }
  }

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
    discoveryMethod: 'full_fleet_scan',
    candidateRankings: evaluatedCandidates.sort((a, b) => a.travelTimeMinutes - b.travelTimeMinutes),
  };
}
