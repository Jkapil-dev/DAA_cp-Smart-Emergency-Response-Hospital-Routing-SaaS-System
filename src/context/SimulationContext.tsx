import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { CityNetwork, RoutingObjective, RouteResult } from '../types/graph';
import { Incident, IncidentObservations, DispatchStage } from '../types/incident';
import { MedicalFacility, HospitalRecommendationResult } from '../types/hospital';
import { Ambulance, AmbulanceRecommendation } from '../types/ambulance';
import { GridConfig, GridSearchResult } from '../types/grid';
import { PoliceAlert, TrafficIntervention } from '../types/police';
import { AuditEvent, AuditCategory } from '../types/audit';
import { getInitialCityNetwork } from '../data/cityGraph';
import { getInitialFacilities } from '../data/facilities';
import { getInitialAmbulances } from '../data/ambulances';
import { getInitialIncidents } from '../data/defaultIncidents';
import { evaluateSeverity } from '../engine/severityEngine';
import { selectBestAmbulance } from '../engine/ambulanceEngine';
import { recommendHospital, createHospitalIncomingNotice } from '../engine/hospitalEngine';
import { searchAmbulanceExpandingGrid, DEFAULT_GRID_CONFIG } from '../engine/gridDiscoveryEngine';
import { createPoliceAlertForIncident, generateTrafficControlIntervention } from '../engine/policeEngine';
import { aStar } from '../algorithms/astar';
import { dijkstra } from '../algorithms/dijkstra';

export type UserRole = 'reporter' | 'driver' | 'hospital' | 'dispatcher' | 'algorithm_lab' | 'scenarios';

interface SimulationContextValue {
  network: CityNetwork;
  facilities: MedicalFacility[];
  ambulances: Ambulance[];
  incidents: Incident[];
  activeIncidentId: string | null;
  activeIncident: Incident | null;
  routingAlgorithm: 'dijkstra' | 'astar';
  routingObjective: RoutingObjective;
  highlightedRoute: RouteResult | null;
  activeHospitalRecommendation: HospitalRecommendationResult | null;
  activeAmbulanceRecommendation: AmbulanceRecommendation | null;

  // Multi-role & Simulation state
  activeRole: UserRole;
  selectedHospitalId: string;
  selectedAmbulanceId: string;
  gridConfig: GridConfig;
  latestGridResult: GridSearchResult | null;
  policeAlerts: PoliceAlert[];
  auditEvents: AuditEvent[];

  // Setters & Role Switching
  setActiveRole: (role: UserRole) => void;
  setSelectedHospitalId: (id: string) => void;
  setSelectedAmbulanceId: (id: string) => void;
  setActiveIncidentId: (id: string | null) => void;
  setRoutingAlgorithm: (algo: 'dijkstra' | 'astar') => void;
  setRoutingObjective: (obj: RoutingObjective) => void;
  setHighlightedRoute: (route: RouteResult | null) => void;
  setGridConfig: (config: GridConfig) => void;

  // Workflow Actions
  createIncident: (
    title: string,
    locationNodeId: string,
    observations: IncidentObservations
  ) => Incident;
  updateIncidentObservations: (
    incidentId: string,
    newObs: IncidentObservations,
    noteText?: string
  ) => void;
  dispatchAmbulanceToIncident: (incidentId: string, ambulanceId: string) => void;
  driverAcknowledgeDispatch: (
    ambulanceId: string,
    incidentId: string,
    accept: boolean,
    declineReason?: string
  ) => void;
  driverStepMovement: (ambulanceId: string) => void;
  driverMarkArrivalAtScene: (ambulanceId: string, incidentId: string) => void;
  driverSubmitOnSceneReport: (
    ambulanceId: string,
    incidentId: string,
    newObs: IncidentObservations,
    equipment: string[],
    noteText: string
  ) => void;
  driverMarkPatientLoaded: (ambulanceId: string, incidentId: string) => void;
  driverMarkArrivalAtHospital: (ambulanceId: string, incidentId: string) => void;
  confirmHospitalDestination: (
    incidentId: string,
    hospitalId: string,
    overrideConfirmed?: boolean
  ) => void;
  hospitalRespond: (
    hospitalId: string,
    incidentId: string,
    response: 'accepted' | 'divert' | 'capacity_override',
    notes?: string
  ) => void;
  policeAcknowledgeAlert: (alertId: string, officerId?: string) => void;
  policeAddIntervention: (
    alertId: string,
    type: TrafficIntervention['type'],
    targetLocation: string,
    notes?: string
  ) => void;
  advanceIncidentStage: (incidentId: string, newStage: DispatchStage) => void;
  toggleRoadBlock: (edgeId: string) => void;
  updateFacilityBeds: (facilityId: string, newAvailableBeds: number) => void;
  updateFacilityResources: (facilityId: string, updates: Partial<MedicalFacility>) => void;
  resetSimulationData: () => void;
  triggerGridSearchForIncident: (incidentId: string) => GridSearchResult | null;
  updateAmbulanceCrewReport: (
    ambulanceId: string,
    incidentId: string,
    newObservations: IncidentObservations,
    crewNote: string
  ) => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [network, setNetwork] = useState<CityNetwork>(getInitialCityNetwork);
  const [facilities, setFacilities] = useState<MedicalFacility[]>(getInitialFacilities);
  const [ambulances, setAmbulances] = useState<Ambulance[]>(getInitialAmbulances);
  const [incidents, setIncidents] = useState<Incident[]>(getInitialIncidents);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>('INC-2026-081');
  const [routingAlgorithm, setRoutingAlgorithm] = useState<'dijkstra' | 'astar'>('dijkstra');
  const [routingObjective, setRoutingObjective] = useState<RoutingObjective>('travelTime');
  const [highlightedRoute, setHighlightedRoute] = useState<RouteResult | null>(null);

  // Multi-role state
  const [activeRole, setActiveRole] = useState<UserRole>('dispatcher');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('HOSP-TRAUMA-1');
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>('AMB-101');
  const [gridConfig, setGridConfig] = useState<GridConfig>(DEFAULT_GRID_CONFIG);
  const [latestGridResult, setLatestGridResult] = useState<GridSearchResult | null>(null);
  const [declinedMap, setDeclinedMap] = useState<Record<string, string[]>>({}); // incidentId -> declined ambulanceIds

  // Initial police alerts from initial incidents
  const [policeAlerts, setPoliceAlerts] = useState<PoliceAlert[]>(() => {
    const initNet = getInitialCityNetwork();
    const initIncs = getInitialIncidents();
    return initIncs.map((inc) => createPoliceAlertForIncident(inc, initNet, inc.assignedAmbulanceId));
  });

  // Audit event log
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => [
    {
      id: 'AUD-001',
      timestamp: new Date().toISOString(),
      category: 'incident',
      action: 'System Initialized',
      actor: 'Simulation Engine',
      input: { initialIncidents: 3, ambulances: 4, hospitals: 5 },
      outcome: 'Ready',
      reason: 'Deterministic benchmark state loaded.',
    },
  ]);

  const logAudit = useCallback(
    (
      category: AuditCategory,
      action: string,
      actor: string,
      input: Record<string, any>,
      outcome: string,
      reason: string,
      incidentId?: string
    ) => {
      const newEvent: AuditEvent = {
        id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: new Date().toISOString(),
        incidentId,
        category,
        action,
        actor,
        input,
        outcome,
        reason,
      };
      setAuditEvents((prev) => [newEvent, ...prev.slice(0, 199)]); // keep recent 200
    },
    []
  );

  // Active Incident
  const activeIncident = useMemo(() => {
    return incidents.find((inc) => inc.id === activeIncidentId) || null;
  }, [incidents, activeIncidentId]);

  // Dynamic recommendations for active incident
  const activeAmbulanceRecommendation = useMemo(() => {
    if (!activeIncident) return null;
    const excluded = declinedMap[activeIncident.id] || [];
    return selectBestAmbulance(ambulances, activeIncident, network, {
      algorithm: routingAlgorithm,
      objective: routingObjective,
      discoveryMethod: 'grid_expansion',
      excludedAmbulanceIds: excluded,
    });
  }, [ambulances, activeIncident, network, routingAlgorithm, routingObjective, declinedMap]);

  const activeHospitalRecommendation = useMemo(() => {
    if (!activeIncident) return null;
    return recommendHospital(facilities, activeIncident, network, {
      algorithm: routingAlgorithm,
      objective: routingObjective,
      isProvisional:
        activeIncident.stage !== 'destination_confirmed' && activeIncident.stage !== 'en_route_hospital',
    });
  }, [facilities, activeIncident, network, routingAlgorithm, routingObjective]);

  // Trigger grid search explicitly for an incident
  const triggerGridSearchForIncident = useCallback(
    (incidentId: string): GridSearchResult | null => {
      const inc = incidents.find((i) => i.id === incidentId);
      if (!inc) return null;
      const excluded = declinedMap[incidentId] || [];
      const res = searchAmbulanceExpandingGrid(ambulances, inc, network, {
        config: gridConfig,
        algorithm: routingAlgorithm,
        objective: routingObjective,
        excludedAmbulanceIds: excluded,
      });
      setLatestGridResult(res);
      logAudit(
        'grid_discovery',
        'Expanding Grid Search Executed',
        'GridDiscoveryEngine',
        { incidentId, ringsSearched: res.searchedRings.length, candidatesEvaluated: res.evaluatedCandidates.length },
        res.selectedAmbulanceId ? `Discovered ${res.selectedAmbulanceId}` : 'Escalated / No Unit Found',
        res.selectionReason,
        incidentId
      );
      return res;
    },
    [incidents, ambulances, network, gridConfig, routingAlgorithm, routingObjective, declinedMap, logAudit]
  );

  // Action: Create Incident (Complete automated pipeline)
  const createIncident = useCallback(
    (title: string, locationNodeId: string, observations: IncidentObservations): Incident => {
      const evaluation = evaluateSeverity(observations);
      const newId = `INC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const node = network.nodes.find((n) => n.id === locationNodeId);

      const newIncident: Incident = {
        id: newId,
        title,
        locationNodeId,
        locationAddress: node ? `${node.name} (${node.zone} Sector)` : `Node ${locationNodeId}`,
        coordinates: node ? { x: node.x, y: node.y } : { x: 500, y: 300 },
        reportedAt: new Date().toISOString(),
        stage: 'ambulance_searching',
        initialObservations: observations,
        currentObservations: observations,
        severityEvaluation: evaluation,
        notesHistory: [
          {
            timestamp: new Date().toISOString(),
            note: `Emergency reported. Deterministic triage assessed as ${evaluation.severity.toUpperCase()}.${
              evaluation.missingInformation.length > 0 ? ` (Preserving ${evaluation.missingInformation.length} unknown fields)` : ''
            }`,
            author: 'Triage Rule Engine',
          },
        ],
      };

      logAudit(
        'incident',
        'Incident Created',
        observations.callerName ? `Reporter: ${observations.callerName}` : 'Citizen Portal',
        { title, locationNodeId, severity: evaluation.severity },
        newId,
        'Deterministic rules evaluated intake criteria.',
        newId
      );

      // Automated Step 1: Create simulated police alert
      const polAlert = createPoliceAlertForIncident(newIncident, network);
      newIncident.policeAlertId = polAlert.id;
      setPoliceAlerts((prev) => [polAlert, ...prev]);
      logAudit(
        'police_traffic',
        'Police Alert Dispatched',
        'Automated Workflow',
        { alertId: polAlert.id, assistance: polAlert.assistanceTypeRequested },
        polAlert.status,
        'Simulated police traffic assistance alert queued and delivered.',
        newId
      );

      // Automated Step 2: Notify suitable candidate hospitals with provisional resource requests
      const hospitalRec = recommendHospital(facilities, newIncident, network, {
        algorithm: routingAlgorithm,
        objective: routingObjective,
      });

      if (hospitalRec.recommendedFacility) {
        newIncident.provisionalHospitalId = hospitalRec.recommendedFacility.id;
        const notice = createHospitalIncomingNotice(hospitalRec.recommendedFacility, newIncident, 12);
        setFacilities((prev) =>
          prev.map((f) => {
            if (f.id === hospitalRec.recommendedFacility!.id) {
              const currentRequests = f.incomingRequests || [];
              return {
                ...f,
                incomingRequests: [notice, ...currentRequests],
              };
            }
            return f;
          })
        );
        logAudit(
          'hospital_coordination',
          'Provisional Hospital Notification',
          'Automated Workflow',
          { hospitalId: hospitalRec.recommendedFacility.id, bedsRequested: notice.resourceRequest.bedsRequested },
          'Notification Queued',
          hospitalRec.justification,
          newId
        );
      }

      // Automated Step 3: Execute expanding square-grid ambulance discovery
      const gridResult = searchAmbulanceExpandingGrid(ambulances, newIncident, network, {
        config: gridConfig,
        algorithm: routingAlgorithm,
        objective: routingObjective,
      });
      setLatestGridResult(gridResult);

      let finalIncident = { ...newIncident };

      if (gridResult.selectedAmbulanceId) {
        const selectedId = gridResult.selectedAmbulanceId;
        finalIncident.stage = 'ambulance_assigned';
        finalIncident.assignedAmbulanceId = selectedId;
        finalIncident.notesHistory.push({
          timestamp: new Date().toISOString(),
          note: `Expanding grid search assigned candidate ${selectedId} from Ring ${gridResult.selectedRingIndex}. Pending driver acknowledgement.`,
          author: 'Grid Discovery Engine',
        });

        // Reserve ambulance so it cannot be double-assigned
        setAmbulances((prev) =>
          prev.map((a) => {
            if (a.id === selectedId) {
              return {
                ...a,
                status: 'reserved',
                reservedForIncidentId: newId,
                currentIncidentId: newId,
              };
            }
            return a;
          })
        );

        setSelectedAmbulanceId(selectedId);
      } else {
        finalIncident.stage = 'escalated';
        finalIncident.notesHistory.push({
          timestamp: new Date().toISOString(),
          note: gridResult.escalationReason || 'Fleet exhausted during grid search. Mutual aid required.',
          author: 'Grid Discovery Engine',
        });
      }

      setIncidents((prev) => [finalIncident, ...prev]);
      setActiveIncidentId(newId);
      return finalIncident;
    },
    [network, facilities, ambulances, routingAlgorithm, routingObjective, gridConfig, logAudit]
  );

  // Action: Driver Acknowledges Dispatch (Accept or Decline with Reason)
  const driverAcknowledgeDispatch = useCallback(
    (ambulanceId: string, incidentId: string, accept: boolean, declineReason?: string) => {
      const inc = incidents.find((i) => i.id === incidentId);
      const amb = ambulances.find((a) => a.id === ambulanceId);
      if (!inc || !amb) return;

      const router = routingAlgorithm === 'astar' ? aStar : dijkstra;

      if (accept) {
        // Driver accepted!
        const route = router(network, amb.currentNodeId, inc.locationNodeId, routingObjective);
        const node = network.nodes.find((n) => n.id === amb.currentNodeId);

        setAmbulances((prev) =>
          prev.map((a) => {
            if (a.id === ambulanceId) {
              return {
                ...a,
                status: 'en_route_scene',
                currentIncidentId: incidentId,
                reservedForIncidentId: undefined,
                currentRoutePath: route.path,
                routeProgressIndex: 0,
                simulatedCoordinates: node ? { x: node.x, y: node.y } : undefined,
              };
            }
            return a;
          })
        );

        setIncidents((prev) =>
          prev.map((i) => {
            if (i.id === incidentId) {
              return {
                ...i,
                stage: 'en_route_scene',
                assignedAmbulanceId: ambulanceId,
                notesHistory: [
                  {
                    timestamp: new Date().toISOString(),
                    note: `Driver ${amb.callSign} accepted dispatch. Unit en route to scene (ETA: ${route.totalTravelTimeMinutes} min).`,
                    author: `Unit ${amb.callSign} Driver`,
                  },
                  ...i.notesHistory,
                ],
              };
            }
            return i;
          })
        );

        // Update police alert with assigned vehicle
        setPoliceAlerts((prev) =>
          prev.map((p) => {
            if (p.incidentId === incidentId) {
              return {
                ...p,
                ambulanceAssignedCallSign: amb.callSign,
                status: 'intervention_active',
              };
            }
            return p;
          })
        );

        logAudit(
          'driver_action',
          'Dispatch Accepted',
          amb.callSign,
          { incidentId, ambulanceId, etaMinutes: route.totalTravelTimeMinutes },
          'En Route to Scene',
          'Driver acknowledged dispatch and activated GPS route guidance.',
          incidentId
        );
      } else {
        // Driver declined with reason!
        const reasonText = declineReason || 'Driver reporting technical or crew issue';

        // 1. Release reservation on declining ambulance
        setAmbulances((prev) =>
          prev.map((a) => {
            if (a.id === ambulanceId) {
              const hist = a.declineHistory || [];
              return {
                ...a,
                status: 'available',
                currentIncidentId: undefined,
                reservedForIncidentId: undefined,
                declineHistory: [
                  ...hist,
                  { incidentId, reason: reasonText, timestamp: new Date().toISOString() },
                ],
              };
            }
            return a;
          })
        );

        // 2. Track in declined map
        const newDeclined = [...(declinedMap[incidentId] || []), ambulanceId];
        setDeclinedMap((prev) => ({ ...prev, [incidentId]: newDeclined }));

        logAudit(
          'driver_action',
          'Dispatch Declined',
          amb.callSign,
          { incidentId, ambulanceId, declineReason: reasonText },
          'Reservation Released',
          `Driver declined assignment: ${reasonText}. Triggering expanding grid retry.`,
          incidentId
        );

        // 3. Automated retry: search next candidate or expand grid ring
        const retryResult = searchAmbulanceExpandingGrid(ambulances, inc, network, {
          config: gridConfig,
          algorithm: routingAlgorithm,
          objective: routingObjective,
          excludedAmbulanceIds: newDeclined,
        });
        setLatestGridResult(retryResult);

        if (retryResult.selectedAmbulanceId) {
          const nextId = retryResult.selectedAmbulanceId;
          setAmbulances((prev) =>
            prev.map((a) => {
              if (a.id === nextId) {
                return {
                  ...a,
                  status: 'reserved',
                  reservedForIncidentId: incidentId,
                  currentIncidentId: incidentId,
                };
              }
              return a;
            })
          );

          setIncidents((prev) =>
            prev.map((i) => {
              if (i.id === incidentId) {
                return {
                  ...i,
                  stage: 'ambulance_assigned',
                  assignedAmbulanceId: nextId,
                  notesHistory: [
                    {
                      timestamp: new Date().toISOString(),
                      note: `Unit ${ambulanceId} declined (${reasonText}). Expanding grid re-assigned next candidate ${nextId}.`,
                      author: 'Grid Discovery Engine',
                    },
                    ...i.notesHistory,
                  ],
                };
              }
              return i;
            })
          );
          setSelectedAmbulanceId(nextId);
        } else {
          setIncidents((prev) =>
            prev.map((i) => {
              if (i.id === incidentId) {
                return {
                  ...i,
                  stage: 'escalated',
                  notesHistory: [
                    {
                      timestamp: new Date().toISOString(),
                      note: `Unit ${ambulanceId} declined (${reasonText}). Fleet search exhausted across all rings. Escalated to regional mutual aid.`,
                      author: 'Grid Discovery Engine',
                    },
                    ...i.notesHistory,
                  ],
                };
              }
              return i;
            })
          );
        }
      }
    },
    [incidents, ambulances, network, routingAlgorithm, routingObjective, gridConfig, declinedMap, logAudit]
  );

  // Action: Step Driver Simulated Movement along Route
  const driverStepMovement = useCallback(
    (ambulanceId: string) => {
      setAmbulances((prev) =>
        prev.map((amb) => {
          if (amb.id !== ambulanceId) return amb;
          if (!amb.currentRoutePath || amb.currentRoutePath.length === 0) return amb;

          const currentIndex = amb.routeProgressIndex ?? 0;
          const nextIndex = Math.min(currentIndex + 1, amb.currentRoutePath.length - 1);
          const nextNodeId = amb.currentRoutePath[nextIndex];
          const node = network.nodes.find((n) => n.id === nextNodeId);

          return {
            ...amb,
            currentNodeId: nextNodeId,
            routeProgressIndex: nextIndex,
            simulatedCoordinates: node ? { x: node.x, y: node.y } : amb.simulatedCoordinates,
          };
        })
      );
    },
    [network]
  );

  // Action: Mark Arrival at Scene
  const driverMarkArrivalAtScene = useCallback(
    (ambulanceId: string, incidentId: string) => {
      setAmbulances((prev) =>
        prev.map((a) => {
          if (a.id === ambulanceId) {
            return { ...a, status: 'on_scene' };
          }
          return a;
        })
      );

      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              stage: 'scene_arrived',
              notesHistory: [
                {
                  timestamp: new Date().toISOString(),
                  note: `Unit ${ambulanceId} arrived at accident scene. On-scene triage commencing.`,
                  author: `Unit ${ambulanceId} Crew`,
                },
                ...inc.notesHistory,
              ],
            };
          }
          return inc;
        })
      );

      logAudit(
        'driver_action',
        'Arrival at Scene',
        `Ambulance ${ambulanceId}`,
        { incidentId },
        'On Scene',
        'Ambulance confirmed physical arrival at accident scene.',
        incidentId
      );
    },
    [logAudit]
  );

  // Action: Driver Submits Updated On-Scene Field Report
  const driverSubmitOnSceneReport = useCallback(
    (
      ambulanceId: string,
      incidentId: string,
      newObs: IncidentObservations,
      equipment: string[],
      noteText: string
    ) => {
      const newEvaluation = evaluateSeverity(newObs);

      setAmbulances((prev) =>
        prev.map((a) => {
          if (a.id === ambulanceId) {
            return { ...a, verifiedEquipment: equipment };
          }
          return a;
        })
      );

      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              stage: 'assessment_updated',
              currentObservations: newObs,
              severityEvaluation: newEvaluation,
              notesHistory: [
                {
                  timestamp: new Date().toISOString(),
                  note: `[Field Paramedic Assessment]: Severity evaluated as ${newEvaluation.severity.toUpperCase()}. ${noteText}`,
                  author: `Crew ${ambulanceId}`,
                },
                ...inc.notesHistory,
              ],
            };
          }
          return inc;
        })
      );

      logAudit(
        'triage_severity',
        'Field Assessment Updated',
        `Paramedic Unit ${ambulanceId}`,
        { incidentId, newSeverity: newEvaluation.severity, equipmentCount: equipment.length },
        newEvaluation.severity,
        `On-scene observation update re-triggered triage rules: ${newEvaluation.reasons.join('; ')}`,
        incidentId
      );
    },
    [logAudit]
  );

  // Action: Confirm Destination Hospital
  const confirmHospitalDestination = useCallback(
    (incidentId: string, hospitalId: string, overrideConfirmed?: boolean) => {
      const router = routingAlgorithm === 'astar' ? aStar : dijkstra;
      const inc = incidents.find((i) => i.id === incidentId);
      const hosp = facilities.find((f) => f.id === hospitalId);

      setIncidents((prev) =>
        prev.map((i) => {
          if (i.id === incidentId) {
            return {
              ...i,
              stage: 'destination_confirmed',
              confirmedHospitalId: hospitalId,
              capacityOverrideConfirmed: overrideConfirmed ?? i.capacityOverrideConfirmed,
              notesHistory: [
                {
                  timestamp: new Date().toISOString(),
                  note: `Destination confirmed: ${hosp ? hosp.name : hospitalId}${
                    overrideConfirmed ? ' [Emergency Capacity Override Authorized]' : ''
                  }.`,
                  author: 'Hospital Coordination',
                },
                ...i.notesHistory,
              ],
            };
          }
          return i;
        })
      );

      // Pre-calculate route to hospital for assigned ambulance
      if (inc && hosp && inc.assignedAmbulanceId) {
        const route = router(network, inc.locationNodeId, hosp.nodeId, routingObjective);
        setHighlightedRoute(route);
      }

      logAudit(
        'hospital_coordination',
        'Destination Confirmed',
        'Hospital Coordinator',
        { incidentId, hospitalId, overrideConfirmed },
        'Confirmed',
        `Destination finalized to ${hosp?.name || hospitalId}.`,
        incidentId
      );
    },
    [incidents, facilities, network, routingAlgorithm, routingObjective, logAudit]
  );

  // Action: Hospital Responds to Incoming Emergency
  const hospitalRespond = useCallback(
    (
      hospitalId: string,
      incidentId: string,
      response: 'accepted' | 'divert' | 'capacity_override',
      notes?: string
    ) => {
      setFacilities((prev) =>
        prev.map((f) => {
          if (f.id === hospitalId) {
            const reqs = (f.incomingRequests || []).map((r) => {
              if (r.incidentId === incidentId) {
                return { ...r, status: response, notes: notes || r.notes };
              }
              return r;
            });
            return { ...f, incomingRequests: reqs };
          }
          return f;
        })
      );

      if (response === 'accepted' || response === 'capacity_override') {
        confirmHospitalDestination(incidentId, hospitalId, response === 'capacity_override');
      }

      logAudit(
        'hospital_coordination',
        `Hospital Response: ${response.toUpperCase()}`,
        `Facility ${hospitalId}`,
        { hospitalId, incidentId, response },
        response,
        notes || `Hospital coordinator recorded status ${response}.`,
        incidentId
      );
    },
    [confirmHospitalDestination, logAudit]
  );

  // Action: Driver Marks Patient Loaded & Begins Transport
  const driverMarkPatientLoaded = useCallback(
    (ambulanceId: string, incidentId: string) => {
      const inc = incidents.find((i) => i.id === incidentId);
      const targetHospitalId = inc?.confirmedHospitalId || inc?.provisionalHospitalId || 'HOSP-TRAUMA-1';
      const hosp = facilities.find((f) => f.id === targetHospitalId);
      const router = routingAlgorithm === 'astar' ? aStar : dijkstra;

      const destNodeId = hosp ? hosp.nodeId : 'N-06';
      const route = router(network, inc?.locationNodeId || 'N-07', destNodeId, routingObjective);

      setAmbulances((prev) =>
        prev.map((a) => {
          if (a.id === ambulanceId) {
            return {
              ...a,
              status: 'transporting',
              currentRoutePath: route.path,
              routeProgressIndex: 0,
            };
          }
          return a;
        })
      );

      setIncidents((prev) =>
        prev.map((i) => {
          if (i.id === incidentId) {
            return {
              ...i,
              stage: 'en_route_hospital',
              notesHistory: [
                {
                  timestamp: new Date().toISOString(),
                  note: `Patient loaded. Transporting to ${hosp?.name || targetHospitalId} via ${route.totalDistanceKm}km corridor.`,
                  author: `Crew ${ambulanceId}`,
                },
                ...i.notesHistory,
              ],
            };
          }
          return i;
        })
      );

      setHighlightedRoute(route);

      logAudit(
        'driver_action',
        'Patient Transport Initiated',
        `Ambulance ${ambulanceId}`,
        { incidentId, destination: hosp?.name, etaMinutes: route.totalTravelTimeMinutes },
        'Transporting to Hospital',
        'Patient secured on board. Emergency transport route activated.',
        incidentId
      );
    },
    [incidents, facilities, network, routingAlgorithm, routingObjective, logAudit]
  );

  // Action: Driver Marks Arrival at Hospital & Closes Incident
  const driverMarkArrivalAtHospital = useCallback(
    (ambulanceId: string, incidentId: string) => {
      const inc = incidents.find((i) => i.id === incidentId);
      const hospId = inc?.confirmedHospitalId || inc?.provisionalHospitalId;

      // Update hospital bed capacity to reflect patient admission
      if (hospId) {
        setFacilities((prev) =>
          prev.map((f) => {
            if (f.id === hospId) {
              return {
                ...f,
                availableBeds: Math.max(0, f.availableBeds - (inc?.currentObservations.injuredCount || 1)),
              };
            }
            return f;
          })
        );
      }

      setAmbulances((prev) =>
        prev.map((a) => {
          if (a.id === ambulanceId) {
            return {
              ...a,
              status: 'available',
              currentIncidentId: undefined,
              currentRoutePath: [],
              routeProgressIndex: 0,
            };
          }
          return a;
        })
      );

      setIncidents((prev) =>
        prev.map((i) => {
          if (i.id === incidentId) {
            return {
              ...i,
              stage: 'completed',
              notesHistory: [
                {
                  timestamp: new Date().toISOString(),
                  note: 'Patient transferred to emergency resuscitation team. Incident lifecycle successfully completed.',
                  author: `Hospital ER Receiving Desk`,
                },
                ...i.notesHistory,
              ],
            };
          }
          return i;
        })
      );

      setHighlightedRoute(null);

      logAudit(
        'incident',
        'Incident Completed',
        'Emergency Coordinator',
        { incidentId, ambulanceId, hospitalId: hospId },
        'Closed',
        'End-to-end simulated emergency workflow successfully completed.',
        incidentId
      );
    },
    [incidents, logAudit]
  );

  // Action: Police Acknowledges Alert
  const policeAcknowledgeAlert = useCallback(
    (alertId: string, officerId: string = 'Traffic Dispatcher #12') => {
      setPoliceAlerts((prev) =>
        prev.map((p) => {
          if (p.id === alertId) {
            return {
              ...p,
              status: 'acknowledged',
              acknowledgedAt: new Date().toISOString(),
              acknowledgedBy: officerId,
            };
          }
          return p;
        })
      );
      logAudit(
        'police_traffic',
        'Police Alert Acknowledged',
        officerId,
        { alertId },
        'Acknowledged',
        'Officer confirmed situational awareness and active corridor monitoring.'
      );
    },
    [logAudit]
  );

  // Action: Police Adds Traffic Intervention
  const policeAddIntervention = useCallback(
    (
      alertId: string,
      type: TrafficIntervention['type'],
      targetLocation: string,
      notes?: string
    ) => {
      setPoliceAlerts((prev) =>
        prev.map((p) => {
          if (p.id === alertId) {
            const intervention = generateTrafficControlIntervention(p, type, targetLocation);
            if (notes) intervention.notes = notes;
            return {
              ...p,
              status: 'intervention_active',
              interventions: [...p.interventions, intervention],
            };
          }
          return p;
        })
      );
      logAudit(
        'police_traffic',
        `Intervention Active: ${type}`,
        'Traffic Division',
        { alertId, type, targetLocation },
        'Active',
        notes || `Traffic control intervention deployed at ${targetLocation}.`
      );
    },
    [logAudit]
  );

  // Action: Update Incident Observations
  const updateIncidentObservations = useCallback(
    (incidentId: string, newObs: IncidentObservations, noteText?: string) => {
      const newEvaluation = evaluateSeverity(newObs);

      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id !== incidentId) return inc;

          const historyEntry = {
            timestamp: new Date().toISOString(),
            note:
              noteText ||
              `Assessment updated: Severity re-evaluated from ${inc.severityEvaluation.severity} to ${newEvaluation.severity}.`,
            author: 'Incident Coordinator',
          };

          return {
            ...inc,
            stage: inc.stage === 'reported' ? 'reported' : 'assessment_updated',
            currentObservations: newObs,
            severityEvaluation: newEvaluation,
            notesHistory: [historyEntry, ...inc.notesHistory],
          };
        })
      );
    },
    []
  );

  // Action: Dispatch Ambulance Directly
  const dispatchAmbulanceToIncident = useCallback(
    (incidentId: string, ambulanceId: string) => {
      driverAcknowledgeDispatch(ambulanceId, incidentId, true);
    },
    [driverAcknowledgeDispatch]
  );

  // Action: Crew Report
  const updateAmbulanceCrewReport = useCallback(
    (
      ambulanceId: string,
      incidentId: string,
      newObservations: IncidentObservations,
      crewNote: string
    ) => {
      driverSubmitOnSceneReport(ambulanceId, incidentId, newObservations, [], crewNote);
    },
    [driverSubmitOnSceneReport]
  );

  // Action: Advance Stage
  const advanceIncidentStage = useCallback((incidentId: string, newStage: DispatchStage) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== incidentId) return inc;
        return {
          ...inc,
          stage: newStage,
          notesHistory: [
            {
              timestamp: new Date().toISOString(),
              note: `Status updated to ${newStage.replace(/_/g, ' ').toUpperCase()}.`,
              author: 'System Workflow',
            },
            ...inc.notesHistory,
          ],
        };
      })
    );
  }, []);

  // Action: Toggle Road Blockage
  const toggleRoadBlock = useCallback((edgeId: string) => {
    setNetwork((prev) => ({
      ...prev,
      edges: prev.edges.map((e) => {
        if (e.id === edgeId) {
          return { ...e, isBlocked: !e.isBlocked };
        }
        return e;
      }),
    }));
  }, []);

  // Action: Update Facility Beds
  const updateFacilityBeds = useCallback((facilityId: string, newAvailableBeds: number) => {
    setFacilities((prev) =>
      prev.map((f) => {
        if (f.id === facilityId) {
          return {
            ...f,
            availableBeds: Math.max(0, newAvailableBeds),
            emergencyStatus: newAvailableBeds === 0 ? 'divert' : 'open',
          };
        }
        return f;
      })
    );
  }, []);

  // Action: Update Facility Resources
  const updateFacilityResources = useCallback((facilityId: string, updates: Partial<MedicalFacility>) => {
    setFacilities((prev) =>
      prev.map((f) => {
        if (f.id === facilityId) {
          return { ...f, ...updates };
        }
        return f;
      })
    );
  }, []);

  // Action: Reset Data
  const resetSimulationData = useCallback(() => {
    setNetwork(getInitialCityNetwork());
    const initFac = getInitialFacilities();
    setFacilities(initFac);
    setAmbulances(getInitialAmbulances());
    const initIncs = getInitialIncidents();
    setIncidents(initIncs);
    setActiveIncidentId('INC-2026-081');
    setHighlightedRoute(null);
    setDeclinedMap({});
    const initNet = getInitialCityNetwork();
    setPoliceAlerts(initIncs.map((inc) => createPoliceAlertForIncident(inc, initNet, inc.assignedAmbulanceId)));
    setAuditEvents([
      {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        category: 'incident',
        action: 'Simulation Reset',
        actor: 'Dispatcher',
        input: {},
        outcome: 'Initial State Restored',
        reason: 'Manual reset requested.',
      },
    ]);
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        network,
        facilities,
        ambulances,
        incidents,
        activeIncidentId,
        activeIncident,
        routingAlgorithm,
        routingObjective,
        highlightedRoute,
        activeHospitalRecommendation,
        activeAmbulanceRecommendation,
        activeRole,
        selectedHospitalId,
        selectedAmbulanceId,
        gridConfig,
        latestGridResult,
        policeAlerts,
        auditEvents,
        setActiveRole,
        setSelectedHospitalId,
        setSelectedAmbulanceId,
        setActiveIncidentId,
        setRoutingAlgorithm,
        setRoutingObjective,
        setHighlightedRoute,
        setGridConfig,
        createIncident,
        updateIncidentObservations,
        dispatchAmbulanceToIncident,
        driverAcknowledgeDispatch,
        driverStepMovement,
        driverMarkArrivalAtScene,
        driverSubmitOnSceneReport,
        driverMarkPatientLoaded,
        driverMarkArrivalAtHospital,
        confirmHospitalDestination,
        hospitalRespond,
        policeAcknowledgeAlert,
        policeAddIntervention,
        advanceIncidentStage,
        toggleRoadBlock,
        updateFacilityBeds,
        updateFacilityResources,
        resetSimulationData,
        triggerGridSearchForIncident,
        updateAmbulanceCrewReport,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export function useSimulation(): SimulationContextValue {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
