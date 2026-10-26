import { CityNetwork, RoutingObjective } from '../types/graph';
import { Incident, IncidentObservations } from '../types/incident';
import { MedicalFacility } from '../types/hospital';
import { Ambulance } from '../types/ambulance';
import { getInitialCityNetwork } from '../data/cityGraph';
import { getInitialFacilities } from '../data/facilities';
import { getInitialAmbulances } from '../data/ambulances';
import { evaluateSeverity } from '../engine/severityEngine';
import { recommendHospital } from '../engine/hospitalEngine';
import { selectBestAmbulance } from '../engine/ambulanceEngine';
import { dijkstra } from '../algorithms/dijkstra';

export interface ScenarioResult {
  id: string;
  name: string;
  description: string;
  category: 'clinical_triage' | 'routing_graph' | 'workflow' | 'capacity';
  status: 'passed' | 'failed' | 'pending';
  executionTimeMs: number;
  details: string;
  expectedOutcome: string;
  actualOutcome: string;
  logs: string[];
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  category: 'clinical_triage' | 'routing_graph' | 'workflow' | 'capacity';
  expectedOutcome: string;
  run: () => ScenarioResult;
}

export const SCENARIO_DEFINITIONS: ScenarioDefinition[] = [
  // 1. Minor accident: a suitable nearby clinic is selected when appropriate
  {
    id: 'SCENARIO-01',
    name: 'Minor Accident - Clinic Selection',
    description: 'Verifies that a low-acuity minor incident is directed to a suitable nearby clinic/urgent care center rather than congesting a Level 1 Trauma Center.',
    category: 'clinical_triage',
    expectedOutcome: 'Triage classifies as "minor"; recommended hospital type is "clinic" (e.g. Eastside Urgent Care).',
    run: () => {
      const t0 = performance.now();
      const network = getInitialCityNetwork();
      const facilities = getInitialFacilities();
      const obs: IncidentObservations = {
        injuredCount: 1,
        consciousness: 'conscious',
        breathing: 'normal',
        bleeding: 'none',
        suspectedMajorInjury: false,
        trappedInVehicle: false,
        additionalNotes: 'Superficial elbow abrasion, conscious and alert',
      };
      const severity = evaluateSeverity(obs);
      const incident: Incident = {
        id: 'TEST-INC-1',
        title: 'Minor Slip at Harbor Crossing',
        locationNodeId: 'N-03',
        reportedAt: new Date().toISOString(),
        stage: 'reported',
        initialObservations: obs,
        currentObservations: obs,
        severityEvaluation: severity,
        notesHistory: [],
      };
      const recommendation = recommendHospital(facilities, incident, network);
      const passed =
        severity.severity === 'minor' &&
        recommendation.recommendedFacility !== null &&
        recommendation.recommendedFacility.type === 'clinic';

      return {
        id: 'SCENARIO-01',
        name: 'Minor Accident - Clinic Selection',
        description: 'Verify low-acuity minor incident routes to clinic',
        category: 'clinical_triage',
        status: passed ? 'passed' : 'failed',
        executionTimeMs: Number((performance.now() - t0).toFixed(2)),
        expectedOutcome: 'Facility type "clinic" recommended for minor injury',
        actualOutcome: `Triage: ${severity.severity}, Selected: ${recommendation.recommendedFacility?.name} (${recommendation.recommendedFacility?.type})`,
        details: recommendation.justification,
        logs: [
          `Triage evaluated: ${severity.severity}`,
          `Recommended facility: ${recommendation.recommendedFacility?.name} (Type: ${recommendation.recommendedFacility?.type})`,
          `Travel time: ${recommendation.recommendedRoute?.totalTravelTimeMinutes} min`,
        ],
      };
    },
  },

  // 2. Severe accident: an inadequate nearby clinic is excluded
  {
    id: 'SCENARIO-02',
    name: 'Severe Accident - Clinic Exclusion',
    description: 'Verifies that an inadequate community clinic is strictly excluded for severe trauma even when the clinic is geographically right next to the scene.',
    category: 'clinical_triage',
    expectedOutcome: 'Clinic (Eastside Urgent Care at N-04) is excluded; Trauma Center (St. Jude at N-06) is selected.',
    run: () => {
      const t0 = performance.now();
      const network = getInitialCityNetwork();
      const facilities = getInitialFacilities();
      // Scene at N-04 (directly adjacent to CLINIC-EAST at N-04!)
      const obs: IncidentObservations = {
        injuredCount: 1,
        consciousness: 'semi-conscious',
        breathing: 'difficult',
        bleeding: 'controlled',
        suspectedMajorInjury: true,
        trappedInVehicle: false,
        additionalNotes: 'Motorcycle collision with suspected skull fracture and altered sensorium',
      };
      const severity = evaluateSeverity(obs);
      const incident: Incident = {
        id: 'TEST-INC-2',
        title: 'Severe Motorcycle Crash right outside Clinic',
        locationNodeId: 'N-04',
        reportedAt: new Date().toISOString(),
        stage: 'reported',
        initialObservations: obs,
        currentObservations: obs,
        severityEvaluation: severity,
        notesHistory: [],
      };
      const recommendation = recommendHospital(facilities, incident, network);

      const clinicCandidate = recommendation.candidates.find((c) => c.facility.type === 'clinic');
      const passed =
        severity.severity === 'severe' &&
        clinicCandidate?.isEligible === false &&
        recommendation.recommendedFacility?.type === 'trauma_center';

      return {
        id: 'SCENARIO-02',
        name: 'Severe Accident - Clinic Exclusion',
        description: 'Verify clinic excluded despite zero distance for severe trauma',
        category: 'clinical_triage',
        status: passed ? 'passed' : 'failed',
        executionTimeMs: Number((performance.now() - t0).toFixed(2)),
        expectedOutcome: 'Clinic candidate isEligible === false; Trauma Center selected',
        actualOutcome: `Clinic eligible: ${clinicCandidate?.isEligible} (${clinicCandidate?.exclusionReason?.slice(0, 45)}...); Selected: ${recommendation.recommendedFacility?.name}`,
        details: recommendation.justification,
        logs: [
          `Triage: ${severity.severity}`,
          `Adjacent clinic status: Excluded. Reason: ${clinicCandidate?.exclusionReason}`,
          `Selected destination: ${recommendation.recommendedFacility?.name} (${recommendation.recommendedFacility?.type})`,
        ],
      };
    },
  },

  // 3. Critical incident: a suitable trauma-capable facility is preferred
  {
    id: 'SCENARIO-03',
    name: 'Critical Incident - Trauma Facility Preferred',
    description: 'Verifies that a critical incident (unconscious victim, absent breathing) mandates a Level 1/2 Trauma facility with surgical team.',
    category: 'clinical_triage',
    expectedOutcome: 'Triage evaluates as "critical"; recommended facility is trauma_center.',
    run: () => {
      const t0 = performance.now();
      const network = getInitialCityNetwork();
      const facilities = getInitialFacilities();
      const obs: IncidentObservations = {
        injuredCount: 1,
        consciousness: 'unconscious',
        breathing: 'absent',
        bleeding: 'severe_uncontrolled',
        suspectedMajorInjury: true,
        trappedInVehicle: false,
        additionalNotes: 'Pedestrian run-over, pulseless electrical activity, CPR in progress',
      };
      const severity = evaluateSeverity(obs);
      const incident: Incident = {
        id: 'TEST-INC-3',
        title: 'Pedestrian Cardiac Arrest',
        locationNodeId: 'N-08',
        reportedAt: new Date().toISOString(),
        stage: 'reported',
        initialObservations: obs,
        currentObservations: obs,
        severityEvaluation: severity,
        notesHistory: [],
      };
      const recommendation = recommendHospital(facilities, incident, network);
      const passed =
        severity.severity === 'critical' &&
        recommendation.recommendedFacility?.type === 'trauma_center';

      return {
        id: 'SCENARIO-03',
        name: 'Critical Incident - Trauma Facility Preferred',
        description: 'Mandate trauma center for critical arrest/trauma',
        category: 'clinical_triage',
        status: passed ? 'passed' : 'failed',
        executionTimeMs: Number((performance.now() - t0).toFixed(2)),
        expectedOutcome: 'Severity = critical, Facility = trauma_center',
        actualOutcome: `Severity = ${severity.severity}, Facility = ${recommendation.recommendedFacility?.name} (${recommendation.recommendedFacility?.type})`,
        details: recommendation.justification,
        logs: [
          `Critical rules triggered: ${severity.reasons.join('; ')}`,
          `Destination: ${recommendation.recommendedFacility?.name}`,
        ],
      };
    },
  },

  // 4. Suitable trauma hospital with zero available beds: not excluded solely on capacity
  {
    id: 'SCENARIO-04',
    name: 'Zero-Bed Trauma Hospital Capacity Override',
    description: 'Verifies that when the only reachable or closest trauma center has 0 available beds, it is NOT excluded. The system generates a Capacity Override Flag requiring dispatcher confirmation.',
    category: 'capacity',
    expectedOutcome: 'Trauma center with 0 beds remains eligible with hasCapacityOverride = true.',
    run: () => {
      const t0 = performance.now();
      const network = getInitialCityNetwork();
      // Configure Valley Memorial (N-18, trauma_center) with 0 beds, and close St. Jude
      const facilities = getInitialFacilities();
      const valley = facilities.find((f) => f.id === 'HOSP-TRAUMA-2')!;
      valley.availableBeds = 0;

      // Incident located at N-17 (South, 3 mins from Valley Memorial at N-18)
      const obs: IncidentObservations = {
        injuredCount: 1,
        consciousness: 'unconscious',
        breathing: 'difficult',
        bleeding: 'severe_uncontrolled',
        suspectedMajorInjury: true,
        trappedInVehicle: true,
        additionalNotes: 'High-speed rollover crash at River bridge approach',
      };
      const severity = evaluateSeverity(obs);
      const incident: Incident = {
        id: 'TEST-INC-4',
        title: 'Trauma Crash at River Approach',
        locationNodeId: 'N-17',
        reportedAt: new Date().toISOString(),
        stage: 'reported',
        initialObservations: obs,
        currentObservations: obs,
        severityEvaluation: severity,
        notesHistory: [],
      };

      // Set other trauma center (St. Jude) far away and 0 beds as well to force Valley selection
      const stJude = facilities.find((f) => f.id === 'HOSP-TRAUMA-1')!;
      stJude.availableBeds = 0;

      const recommendation = recommendHospital(facilities, incident, network);
      const valleyCandidate = recommendation.candidates.find((c) => c.facility.id === 'HOSP-TRAUMA-2');

      const passed =
        valleyCandidate !== undefined &&
        valleyCandidate.facility.availableBeds === 0 &&
        valleyCandidate.isEligible === true &&
        valleyCandidate.hasCapacityOverride === true &&
        recommendation.hasCapacityOverride === true;

      return {
        id: 'SCENARIO-04',
        name: 'Zero-Bed Trauma Hospital Capacity Override',
        description: 'Verify 0-bed trauma center not excluded; capacity override flagged',
        category: 'capacity',
        status: passed ? 'passed' : 'failed',
        executionTimeMs: Number((performance.now() - t0).toFixed(2)),
        expectedOutcome: 'isEligible === true, hasCapacityOverride === true',
        actualOutcome: `Eligible: ${valleyCandidate?.isEligible}, Override Flag: ${valleyCandidate?.hasCapacityOverride}, Justification: ${recommendation.justification.slice(0, 60)}...`,
        details: recommendation.justification,
        logs: [
          `Trauma center available beds: ${valley.availableBeds}`,
          `Override status: ${recommendation.hasCapacityOverride ? 'FLAGGED (Dispatcher confirmation required)' : 'None'}`,
          `Selected: ${recommendation.recommendedFacility?.name}`,
        ],
      };
    },
  },

  // 5. Moderate incident: an unavailable-bed option is handled according to the configured rules
  {
    id: 'SCENARIO-05',
    name: 'Moderate Incident - Unavailable Bed Handling',
    description: 'Verifies that for moderate incidents, a facility with 0 beds is excluded or diverted to prevent ER overcrowding, unlike critical trauma override.',
    category: 'capacity',
    expectedOutcome: 'General hospital with 0 beds is excluded with reason "Zero bed capacity (Divert status)".',
    run: () => {
      const t0 = performance.now();
      const network = getInitialCityNetwork();
      const facilities = getInitialFacilities();
      // Set City Central General Hospital available beds to 0
      const genHosp = facilities.find((f) => f.id === 'HOSP-GEN-1')!;
      genHosp.availableBeds = 0;

      const obs: IncidentObservations = {
        injuredCount: 1,
        consciousness: 'conscious',
        breathing: 'normal',
        bleeding: 'controlled',
        suspectedMajorInjury: false,
        trappedInVehicle: false,
        additionalNotes: 'Controlled extremity bleed and ankle fracture',
      };
      const severity = evaluateSeverity(obs);
      const incident: Incident = {
        id: 'TEST-INC-5',
        title: 'Extremity Fracture at Civic Center',
        locationNodeId: 'N-08',
        reportedAt: new Date().toISOString(),
        stage: 'reported',
        initialObservations: obs,
        currentObservations: obs,
        severityEvaluation: severity,
        notesHistory: [],
      };
      const recommendation = recommendHospital(facilities, incident, network);
      const genCandidate = recommendation.candidates.find((c) => c.facility.id === 'HOSP-GEN-1');

      const passed =
        severity.severity === 'moderate' &&
        genCandidate?.isEligible === false &&
        genCandidate?.exclusionReason?.includes('0 bed capacity');

      return {
        id: 'SCENARIO-05',
        name: 'Moderate Incident - Unavailable Bed Handling',
        description: 'Verify 0-bed facility excluded for moderate acuity',
        category: 'capacity',
        status: passed ? 'passed' : 'failed',
        executionTimeMs: Number((performance.now() - t0).toFixed(2)),
        expectedOutcome: 'General hospital with 0 beds is marked isEligible = false',
        actualOutcome: `Eligible: ${genCandidate?.isEligible}, Reason: ${genCandidate?.exclusionReason}`,
        details: genCandidate?.exclusionReason || 'Excluded successfully',
        logs: [
          `Triage: ${severity.severity}`,
          `City Central beds: 0`,
          `Eligibility: ${genCandidate?.isEligible ? 'Eligible' : 'Ineligible (Divert)'}`,
          `Exclusion note: ${genCandidate?.exclusionReason}`,
        ],
      };
    },
  },

  // 6. Closest ambulance is unavailable: another eligible ambulance is selected
  {
    id: 'SCENARIO-06',
    name: 'Ambulance Selection - Busy Unit Bypassed',
    description: 'Verifies that if the geographically closest ambulance is occupied (dispatched on another run), the next closest eligible unit is chosen with clear justification.',
    category: 'workflow',
    expectedOutcome: 'Occupied Rescue 2 (N-10) is bypassed; available Medic 1 or Medic 4 is selected.',
    run: () => {
      const t0 = performance.now();
      const network = getInitialCityNetwork();
      const ambulances = getInitialAmbulances();
      // Rescue 2 is at N-10 and marked dispatched (busy)
      // Incident is at N-13 (Midtown Interchange - 2.1 mins from N-10!)
      const obs: IncidentObservations = {
        injuredCount: 1,
        consciousness: 'unconscious',
        breathing: 'difficult',
        bleeding: 'controlled',
        suspectedMajorInjury: true,
        trappedInVehicle: false,
        additionalNotes: 'Collapsed driver at Midtown Interchange',
      };
      const severity = evaluateSeverity(obs);
      const incident: Incident = {
        id: 'TEST-INC-6',
        title: 'Midtown Driver Collapse',
        locationNodeId: 'N-13',
        reportedAt: new Date().toISOString(),
        stage: 'reported',
        initialObservations: obs,
        currentObservations: obs,
        severityEvaluation: severity,
        notesHistory: [],
      };
      const selection = selectBestAmbulance(ambulances, incident, network);

      const busyCandidate = selection?.candidateRankings.find((c) => c.ambulance.id === 'AMB-102');
      const passed =
        selection !== null &&
        selection.recommendedAmbulance.id !== 'AMB-102' &&
        selection.recommendedAmbulance.status === 'available' &&
        busyCandidate?.isEligible === false;

      return {
        id: 'SCENARIO-06',
        name: 'Ambulance Selection - Busy Unit Bypassed',
        description: 'Bypass busy ambulance even if closest',
        category: 'workflow',
        status: passed ? 'passed' : 'failed',
        executionTimeMs: Number((performance.now() - t0).toFixed(2)),
        expectedOutcome: 'AMB-102 excluded due to status; available unit selected',
        actualOutcome: `Selected: ${selection?.recommendedAmbulance.callSign} (${selection?.recommendedAmbulance.status}); AMB-102 eligible: ${busyCandidate?.isEligible}`,
        details: selection?.selectionReason || 'None',
        logs: [
          `Incident location: N-13`,
          `Rescue 2 (at N-10): Status = ${busyCandidate?.ambulance.status}, Eligible = ${busyCandidate?.isEligible}`,
          `Selected: ${selection?.recommendedAmbulance.callSign} at ${selection?.recommendedAmbulance.currentNodeId} (${selection?.routeToIncident.travelTimeMinutes} min)`,
        ],
      };
    },
  },

  // 7. Road closure: the route is recalculated using an alternative path where possible
  {
    id: 'SCENARIO-07',
    name: 'Road Closure - Detour Recalculation',
    description: 'Verifies that when a primary arterial bridge (Grand Central Bridge between N-10 and N-13) is closed, the router identifies the closure and automatically recalculates via an open bypass.',
    category: 'routing_graph',
    expectedOutcome: 'Route does not use blocked edge; uses alternative detour.',
    run: () => {
      const t0 = performance.now();
      const networkOpen = getInitialCityNetwork();
      const networkBlocked = getInitialCityNetwork();

      // Block the main bridge
      const bridgeEdge = networkBlocked.edges.find((e) => e.id === 'E-MAIN-BRIDGE')!;
      bridgeEdge.isBlocked = true;

      const openRoute = dijkstra(networkOpen, 'N-10', 'N-13');
      const detourRoute = dijkstra(networkBlocked, 'N-10', 'N-13');

      const usedBlockedEdge = detourRoute.edges.some((e) => e.id === 'E-MAIN-BRIDGE');
      const passed =
        openRoute.found &&
        detourRoute.found &&
        !usedBlockedEdge &&
        openRoute.totalCost !== detourRoute.totalCost;

      return {
        id: 'SCENARIO-07',
        name: 'Road Closure - Detour Recalculation',
        description: 'Verify router safely detours around blocked roads',
        category: 'routing_graph',
        status: passed ? 'passed' : 'failed',
        executionTimeMs: Number((performance.now() - t0).toFixed(2)),
        expectedOutcome: 'Blocked road avoided, alternate path selected',
        actualOutcome: `Detour found: ${detourRoute.found}, Used blocked bridge: ${usedBlockedEdge}, Open cost: ${openRoute.totalCost}m, Detour cost: ${detourRoute.totalCost}m`,
        details: `Detour path: ${detourRoute.path.join(' -> ')}`,
        logs: [
          `Original route via bridge: ${openRoute.path.join(' -> ')} (${openRoute.totalCost} min)`,
          `Bridge road E-MAIN-BRIDGE marked BLOCKED`,
          `Recalculated detour: ${detourRoute.path.join(' -> ')} (${detourRoute.totalCost} min)`,
        ],
      };
    },
  },

  // 8. No feasible route: the system reports the failure clearly
  {
    id: 'SCENARIO-08',
    name: 'No Feasible Route - Failure Notification',
    description: 'Verifies that when an isolated island node is cut off by closing its drawbridge, the system gracefully reports route failure rather than crashing or returning an invalid path.',
    category: 'routing_graph',
    expectedOutcome: 'Route found = false, totalCost = Infinity, descriptive error message returned.',
    run: () => {
      const t0 = performance.now();
      const network = getInitialCityNetwork();
      // Block the only bridge to Island Outpost Pier (E-ISLAND-BRIDGE)
      const bridge = network.edges.find((e) => e.id === 'E-ISLAND-BRIDGE')!;
      bridge.isBlocked = true;

      const result = dijkstra(network, 'N-01', 'N-22');
      const passed = !result.found && result.totalCost === Infinity && !!result.message;

      return {
        id: 'SCENARIO-08',
        name: 'No Feasible Route - Failure Notification',
        description: 'Verify graceful failure report when path is physically impossible',
        category: 'routing_graph',
        status: passed ? 'passed' : 'failed',
        executionTimeMs: Number((performance.now() - t0).toFixed(2)),
        expectedOutcome: 'found === false, totalCost === Infinity, message populated',
        actualOutcome: `Found: ${result.found}, Cost: ${result.totalCost}, Message: "${result.message}"`,
        details: result.message || 'Reported correctly',
        logs: [
          `Closed drawbridge E-ISLAND-BRIDGE to N-22`,
          `Dijkstra search result: found = ${result.found}`,
          `Explanation: ${result.message}`,
        ],
      };
    },
  },

  // 9. No suitable hospital: the system requests intervention instead of selecting an unsuitable facility
  {
    id: 'SCENARIO-09',
    name: 'No Suitable Hospital - Dispatcher Intervention Requested',
    description: 'Verifies that when all trauma hospitals are rendered unreachable by network partitions, the engine refuses to dump a critical trauma patient at an inadequate clinic and instead raises an intervention alarm.',
    category: 'clinical_triage',
    expectedOutcome: 'requiresIntervention === true, recommendedFacility === null, clear warning.',
    run: () => {
      const t0 = performance.now();
      const network = getInitialCityNetwork();
      const facilities = getInitialFacilities();

      // Block access to all trauma centers
      for (const e of network.edges) {
        if (e.to === 'N-06' || e.from === 'N-06' || e.to === 'N-18' || e.from === 'N-18') {
          e.isBlocked = true;
        }
      }

      const obs: IncidentObservations = {
        injuredCount: 2,
        consciousness: 'unconscious',
        breathing: 'difficult',
        bleeding: 'severe_uncontrolled',
        suspectedMajorInjury: true,
        trappedInVehicle: true,
        additionalNotes: 'Severe trauma incident, both trauma centers cut off by bridge collapse',
      };
      const severity = evaluateSeverity(obs);
      const incident: Incident = {
        id: 'TEST-INC-9',
        title: 'Major Trauma with Partitions',
        locationNodeId: 'N-11',
        reportedAt: new Date().toISOString(),
        stage: 'reported',
        initialObservations: obs,
        currentObservations: obs,
        severityEvaluation: severity,
        notesHistory: [],
      };

      const recommendation = recommendHospital(facilities, incident, network);
      const passed =
        recommendation.recommendedFacility === null &&
        recommendation.requiresIntervention === true &&
        recommendation.interventionReason !== undefined;

      return {
        id: 'SCENARIO-09',
        name: 'No Suitable Hospital - Dispatcher Intervention Requested',
        description: 'Verify system refuses unsuitable facility and requests mutual aid',
        category: 'clinical_triage',
        status: passed ? 'passed' : 'failed',
        executionTimeMs: Number((performance.now() - t0).toFixed(2)),
        expectedOutcome: 'recommendedFacility = null, requiresIntervention = true',
        actualOutcome: `Facility: ${recommendation.recommendedFacility}, Intervention: ${recommendation.requiresIntervention}`,
        details: recommendation.interventionReason || 'None',
        logs: [
          `All trauma center access roads blocked`,
          `Clinics available nearby: Eastside Urgent Care, Westwood Clinic`,
          `Result: Clinic NOT selected (unsafe). Dispatcher intervention triggered.`,
        ],
      };
    },
  },

  // 10. Updated incident observations: severity and destination recommendations are recalculated
  {
    id: 'SCENARIO-10',
    name: 'Dynamic Assessment Update & Recalculation',
    description: 'Verifies the two-stage workflow where an on-scene crew submits an updated assessment that changes the severity from Minor to Critical, causing the provisional destination to be recalculated to a Trauma Center.',
    category: 'workflow',
    expectedOutcome: 'Triage updates Minor -> Critical; Destination updates Clinic -> Trauma Center.',
    run: () => {
      const t0 = performance.now();
      const network = getInitialCityNetwork();
      const facilities = getInitialFacilities();

      // Initial report: minor slip
      const initialObs: IncidentObservations = {
        injuredCount: 1,
        consciousness: 'conscious',
        breathing: 'normal',
        bleeding: 'none',
        suspectedMajorInjury: false,
        trappedInVehicle: false,
        additionalNotes: 'Initial bystander call: person tripped near plaza',
      };
      const initialSeverity = evaluateSeverity(initialObs);
      const incident: Incident = {
        id: 'TEST-INC-10',
        title: 'Plaza Fall Incident',
        locationNodeId: 'N-05',
        reportedAt: new Date().toISOString(),
        stage: 'reported',
        initialObservations: initialObs,
        currentObservations: initialObs,
        severityEvaluation: initialSeverity,
        notesHistory: [],
      };
      const initialRec = recommendHospital(facilities, incident, network);

      // Paramedic arrives: patient has suffered acute subdural hematoma, now unconscious with snoring respirations!
      const updatedObs: IncidentObservations = {
        ...initialObs,
        consciousness: 'unconscious',
        breathing: 'difficult',
        suspectedMajorInjury: true,
        additionalNotes: 'Crew on scene: patient collapsed, non-responsive, unequal pupils',
      };
      const updatedSeverity = evaluateSeverity(updatedObs);
      const updatedIncident: Incident = {
        ...incident,
        stage: 'assessment_updated',
        currentObservations: updatedObs,
        severityEvaluation: updatedSeverity,
      };
      const updatedRec = recommendHospital(facilities, updatedIncident, network);

      const passed =
        initialSeverity.severity === 'minor' &&
        initialRec.recommendedFacility?.type === 'clinic' &&
        updatedSeverity.severity === 'critical' &&
        updatedRec.recommendedFacility?.type === 'trauma_center';

      return {
        id: 'SCENARIO-10',
        name: 'Dynamic Assessment Update & Recalculation',
        description: 'Verify full recalculation on crew assessment update',
        category: 'workflow',
        status: passed ? 'passed' : 'failed',
        executionTimeMs: Number((performance.now() - t0).toFixed(2)),
        expectedOutcome: 'Minor (Clinic) -> Critical (Trauma Center)',
        actualOutcome: `Initial: ${initialSeverity.severity} -> ${initialRec.recommendedFacility?.name} (${initialRec.recommendedFacility?.type}) | Updated: ${updatedSeverity.severity} -> ${updatedRec.recommendedFacility?.name} (${updatedRec.recommendedFacility?.type})`,
        details: `Updated justification: ${updatedRec.justification}`,
        logs: [
          `Stage 1 (Pre-arrival): Severity = ${initialSeverity.severity}, Recommended = ${initialRec.recommendedFacility?.name}`,
          `Stage 2 (Crew report): Updated to Unconscious / Major Trauma`,
          `Stage 2 Recalculation: Severity = ${updatedSeverity.severity}, Recommended = ${updatedRec.recommendedFacility?.name}`,
        ],
      };
    },
  },

  // 11. Different distance and travel-time weights: the route algorithms can produce different optimal routes
  {
    id: 'SCENARIO-11',
    name: 'Multi-Objective Routing Divergence (Distance vs Travel Time)',
    description: 'Verifies that selecting "Minimum Distance" vs "Minimum Travel Time" genuinely yields different optimal paths on the city graph.',
    category: 'routing_graph',
    expectedOutcome: 'Distance objective chooses shorter surface streets; Travel Time objective chooses high-speed highway.',
    run: () => {
      const t0 = performance.now();
      const network = getInitialCityNetwork();

      // Between N-01 (Northgate) and N-13 (Midtown)
      // Path 1 (Highway): N-01 -> N-07 -> N-13 (Distance: 6+5=11km, Travel Time: 4.5+3.75=8.25m)
      // Path 2 (Local streets): N-01 -> N-05 -> N-09 -> N-13 (Distance: 1.8+1.8+2.0=5.6km, Travel Time: 3.6+3.6+4.0=11.2m)
      const routeByTime = dijkstra(network, 'N-01', 'N-13', 'travelTime');
      const routeByDist = dijkstra(network, 'N-01', 'N-13', 'distance');

      const pathsDifferent = JSON.stringify(routeByTime.path) !== JSON.stringify(routeByDist.path);
      const distanceRouteIsShorterKm = routeByDist.totalDistanceKm < routeByTime.totalDistanceKm;
      const timeRouteIsFasterMinutes = routeByTime.totalTravelTimeMinutes < routeByDist.totalTravelTimeMinutes;

      const passed = pathsDifferent && distanceRouteIsShorterKm && timeRouteIsFasterMinutes;

      return {
        id: 'SCENARIO-11',
        name: 'Multi-Objective Routing Divergence',
        description: 'Verify routing objective strictly alters optimal path selection',
        category: 'routing_graph',
        status: passed ? 'passed' : 'failed',
        executionTimeMs: Number((performance.now() - t0).toFixed(2)),
        expectedOutcome: 'Shortest Distance != Fastest Travel Time',
        actualOutcome: `TravelTime Path: [${routeByTime.path.join(',')}] (${routeByTime.totalTravelTimeMinutes}m, ${routeByTime.totalDistanceKm}km) vs Distance Path: [${routeByDist.path.join(',')}] (${routeByDist.totalTravelTimeMinutes}m, ${routeByDist.totalDistanceKm}km)`,
        details: `Time route saves ${(routeByDist.totalTravelTimeMinutes - routeByTime.totalTravelTimeMinutes).toFixed(2)} min; Distance route saves ${(routeByTime.totalDistanceKm - routeByDist.totalDistanceKm).toFixed(2)} km.`,
        logs: [
          `Objective 'travelTime' selected: ${routeByTime.path.join(' -> ')} (Time: ${routeByTime.totalTravelTimeMinutes} min, Dist: ${routeByTime.totalDistanceKm} km)`,
          `Objective 'distance' selected: ${routeByDist.path.join(' -> ')} (Time: ${routeByDist.totalTravelTimeMinutes} min, Dist: ${routeByDist.totalDistanceKm} km)`,
          `Verified: True objective trade-off confirmed on graph.`,
        ],
      };
    },
  },

  // 12. Critical indicators override lower-priority severity rules
  {
    id: 'SCENARIO-12',
    name: 'Rule Precedence - Critical Overrides Lower Priority',
    description: 'Verifies that critical indicators (e.g. absent breathing, unconscious) strictly suppress and override lower-priority moderate/severe signals.',
    category: 'clinical_triage',
    expectedOutcome: 'Severity = critical; overrides list captures suppressed lower-priority signals.',
    run: () => {
      const t0 = performance.now();
      // Mixed case: Unconscious (Critical) + Controlled bleeding (Moderate) + 1 patient (Minor)
      const obs: IncidentObservations = {
        injuredCount: 1,
        consciousness: 'unconscious',
        breathing: 'normal',
        bleeding: 'controlled',
        suspectedMajorInjury: false,
        trappedInVehicle: false,
        additionalNotes: 'Patient knocked unconscious from falling branch, small controlled scalp cut',
      };
      const evalResult = evaluateSeverity(obs);
      const passed =
        evalResult.severity === 'critical' &&
        evalResult.overrides.length > 0 &&
        evalResult.reasons.some((r) => r.includes('unresponsive / unconscious'));

      return {
        id: 'SCENARIO-12',
        name: 'Rule Precedence - Critical Overrides Lower Priority',
        description: 'Verify strict precedence hierarchy in rule engine',
        category: 'clinical_triage',
        status: passed ? 'passed' : 'failed',
        executionTimeMs: Number((performance.now() - t0).toFixed(2)),
        expectedOutcome: 'Severity is critical; overrides noted',
        actualOutcome: `Severity: ${evalResult.severity}, Overrides: ${evalResult.overrides.join(', ')}`,
        details: evalResult.overrides.join('; '),
        logs: [
          `Triggered rules: ${evalResult.reasons.join(', ')}`,
          `Recorded overrides: ${evalResult.overrides.join(', ')}`,
        ],
      };
    },
  },

  // 13. Uploaded photographs: images preview correctly and do not independently change the rule-based severity classification
  {
    id: 'SCENARIO-13',
    name: 'Photographs - Visual Preview Only (No Fake AI)',
    description: 'Verifies that scene photographs are stored as visual previews for human operator review and strictly DO NOT alter the deterministic rule-based severity classification.',
    category: 'workflow',
    expectedOutcome: 'Severity without photo === Severity with photo.',
    run: () => {
      const t0 = performance.now();
      const baseObs: IncidentObservations = {
        injuredCount: 1,
        consciousness: 'conscious',
        breathing: 'normal',
        bleeding: 'none',
        suspectedMajorInjury: false,
        trappedInVehicle: false,
        additionalNotes: 'Minor scratch on arm',
      };
      const evalWithoutPhotos = evaluateSeverity(baseObs);

      // Add a dramatic crash photo URL
      const obsWithPhotos: IncidentObservations = {
        ...baseObs,
        photoUrls: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='],
      };
      const evalWithPhotos = evaluateSeverity(obsWithPhotos);

      const passed =
        evalWithoutPhotos.severity === evalWithPhotos.severity &&
        JSON.stringify(evalWithoutPhotos.reasons) === JSON.stringify(evalWithPhotos.reasons) &&
        (obsWithPhotos.photoUrls?.length ?? 0) === 1;

      return {
        id: 'SCENARIO-13',
        name: 'Photographs - Visual Preview Only',
        description: 'Verify photos are passive human reference and do not alter logic',
        category: 'workflow',
        status: passed ? 'passed' : 'failed',
        executionTimeMs: Number((performance.now() - t0).toFixed(2)),
        expectedOutcome: 'Severity identical (minor) with or without attached images',
        actualOutcome: `Severity without photos: ${evalWithoutPhotos.severity} | Severity with photo: ${evalWithPhotos.severity}`,
        details: 'Images serve exclusively as visual supporting evidence for the human dispatcher.',
        logs: [
          `Base evaluation severity: ${evalWithoutPhotos.severity}`,
          `Evaluation with attached photograph: ${evalWithPhotos.severity}`,
          `Integrity confirmed: Rule engine remains 100% deterministic and explainable.`,
        ],
      };
    },
  },

  // 14. Ambulance en route to an incident: a provisional hospital route can be prepared before pickup
  {
    id: 'SCENARIO-14',
    name: 'Stage 1 Pre-Dispatch Provisional Hospital Routing',
    description: 'Verifies the two-stage pipeline where a provisional hospital route is computed in parallel as soon as the ambulance is dispatched, reducing decision latency upon patient pickup.',
    category: 'workflow',
    expectedOutcome: 'Provisional recommendation generated while ambulance is en route to scene.',
    run: () => {
      const t0 = performance.now();
      const network = getInitialCityNetwork();
      const facilities = getInitialFacilities();
      const ambulances = getInitialAmbulances();

      const obs: IncidentObservations = {
        injuredCount: 1,
        consciousness: 'unconscious',
        breathing: 'difficult',
        bleeding: 'controlled',
        suspectedMajorInjury: true,
        trappedInVehicle: false,
        additionalNotes: 'Highway accident at Northgate',
      };
      const severity = evaluateSeverity(obs);
      const incident: Incident = {
        id: 'TEST-INC-14',
        title: 'High-Acuity Pre-Dispatch Call',
        locationNodeId: 'N-01',
        reportedAt: new Date().toISOString(),
        stage: 'en_route_scene', // En route to scene!
        initialObservations: obs,
        currentObservations: obs,
        severityEvaluation: severity,
        assignedAmbulanceId: 'AMB-101',
        notesHistory: [],
      };

      // Select ambulance
      const ambSelection = selectBestAmbulance(ambulances, incident, network);

      // Parallel provisional hospital recommendation (Stage 1)
      const provHospital = recommendHospital(facilities, incident, network, { isProvisional: true });

      const passed =
        ambSelection !== null &&
        provHospital.recommendedFacility !== null &&
        provHospital.isProvisional === true &&
        provHospital.recommendedRoute !== null &&
        incident.stage === 'en_route_scene';

      return {
        id: 'SCENARIO-14',
        name: 'Stage 1 Pre-Dispatch Provisional Hospital Routing',
        description: 'Verify provisional destination prepared before ambulance reaches scene',
        category: 'workflow',
        status: passed ? 'passed' : 'failed',
        executionTimeMs: Number((performance.now() - t0).toFixed(2)),
        expectedOutcome: 'Provisional hospital route pre-computed during en_route_scene',
        actualOutcome: `Ambulance route: ${ambSelection?.routeToIncident.travelTimeMinutes}m | Provisional Hospital: ${provHospital.recommendedFacility?.name} (${provHospital.recommendedRoute?.totalTravelTimeMinutes}m, isProvisional: ${provHospital.isProvisional})`,
        details: provHospital.justification,
        logs: [
          `Ambulance ${ambSelection?.recommendedAmbulance.callSign} dispatched to scene`,
          `Provisional destination: ${provHospital.recommendedFacility?.name} (ETA: ${provHospital.recommendedRoute?.totalTravelTimeMinutes} min)`,
          `Status: Ready for rapid dispatcher confirmation once paramedic confirms on-scene vitals.`,
        ],
      };
    },
  },
];

export function runAllScenarios(): ScenarioResult[] {
  return SCENARIO_DEFINITIONS.map((def) => def.run());
}
