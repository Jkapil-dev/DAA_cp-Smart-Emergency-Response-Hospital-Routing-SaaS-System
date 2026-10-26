import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { CityNetwork, GraphEdge, RoutingObjective, RouteResult } from '../types/graph';
import { Incident, IncidentObservations, DispatchStage } from '../types/incident';
import { MedicalFacility, HospitalRecommendationResult } from '../types/hospital';
import { Ambulance, AmbulanceRecommendation } from '../types/ambulance';
import { getInitialCityNetwork } from '../data/cityGraph';
import { getInitialFacilities } from '../data/facilities';
import { getInitialAmbulances } from '../data/ambulances';
import { getInitialIncidents } from '../data/defaultIncidents';
import { evaluateSeverity } from '../engine/severityEngine';
import { selectBestAmbulance } from '../engine/ambulanceEngine';
import { recommendHospital } from '../engine/hospitalEngine';

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

  // Setters & Actions
  setActiveIncidentId: (id: string | null) => void;
  setRoutingAlgorithm: (algo: 'dijkstra' | 'astar') => void;
  setRoutingObjective: (obj: RoutingObjective) => void;
  setHighlightedRoute: (route: RouteResult | null) => void;

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
  updateAmbulanceCrewReport: (
    ambulanceId: string,
    incidentId: string,
    newObservations: IncidentObservations,
    crewNote: string
  ) => void;
  confirmHospitalDestination: (
    incidentId: string,
    hospitalId: string,
    overrideConfirmed?: boolean
  ) => void;
  advanceIncidentStage: (incidentId: string, newStage: DispatchStage) => void;
  toggleRoadBlock: (edgeId: string) => void;
  updateFacilityBeds: (facilityId: string, newAvailableBeds: number) => void;
  resetSimulationData: () => void;
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

  // Active Incident
  const activeIncident = useMemo(() => {
    return incidents.find((inc) => inc.id === activeIncidentId) || null;
  }, [incidents, activeIncidentId]);

  // Dynamic recommendations for active incident
  const activeAmbulanceRecommendation = useMemo(() => {
    if (!activeIncident) return null;
    return selectBestAmbulance(ambulances, activeIncident, network, {
      algorithm: routingAlgorithm,
      objective: routingObjective,
    });
  }, [ambulances, activeIncident, network, routingAlgorithm, routingObjective]);

  const activeHospitalRecommendation = useMemo(() => {
    if (!activeIncident) return null;
    return recommendHospital(facilities, activeIncident, network, {
      algorithm: routingAlgorithm,
      objective: routingObjective,
      isProvisional: activeIncident.stage !== 'destination_confirmed' && activeIncident.stage !== 'en_route_hospital',
    });
  }, [facilities, activeIncident, network, routingAlgorithm, routingObjective]);

  // Action: Create Incident
  const createIncident = useCallback(
    (title: string, locationNodeId: string, observations: IncidentObservations): Incident => {
      const evaluation = evaluateSeverity(observations);
      const newId = `INC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

      const newIncident: Incident = {
        id: newId,
        title,
        locationNodeId,
        reportedAt: new Date().toISOString(),
        stage: 'reported',
        initialObservations: observations,
        currentObservations: observations,
        severityEvaluation: evaluation,
        notesHistory: [
          {
            timestamp: new Date().toISOString(),
            note: `Incident registered. Initial triage evaluated as ${evaluation.severity.toUpperCase()} via deterministic rule engine.`,
            author: 'Dispatcher',
          },
        ],
      };

      setIncidents((prev) => [newIncident, ...prev]);
      setActiveIncidentId(newId);
      return newIncident;
    },
    []
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

  // Action: Dispatch Ambulance
  const dispatchAmbulanceToIncident = useCallback(
    (incidentId: string, ambulanceId: string) => {
      setAmbulances((prev) =>
        prev.map((amb) => {
          if (amb.id === ambulanceId) {
            return {
              ...amb,
              status: 'en_route_scene',
              currentIncidentId: incidentId,
            };
          }
          return amb;
        })
      );

      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id !== incidentId) return inc;
          return {
            ...inc,
            stage: 'en_route_scene',
            assignedAmbulanceId: ambulanceId,
            notesHistory: [
              {
                timestamp: new Date().toISOString(),
                note: `Unit ${ambulanceId} assigned and en route to accident scene.`,
                author: 'Dispatcher',
              },
              ...inc.notesHistory,
            ],
          };
        })
      );
    },
    []
  );

  // Action: Crew Report
  const updateAmbulanceCrewReport = useCallback(
    (
      ambulanceId: string,
      incidentId: string,
      newObservations: IncidentObservations,
      crewNote: string
    ) => {
      const newEvaluation = evaluateSeverity(newObservations);

      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id !== incidentId) return inc;
          return {
            ...inc,
            stage: 'assessment_updated',
            currentObservations: newObservations,
            severityEvaluation: newEvaluation,
            notesHistory: [
              {
                timestamp: new Date().toISOString(),
                note: `[Crew ${ambulanceId} On-Scene Report]: ${crewNote}`,
                author: `Unit ${ambulanceId} Paramedic`,
              },
              ...inc.notesHistory,
            ],
          };
        })
      );
    },
    []
  );

  // Action: Confirm Destination
  const confirmHospitalDestination = useCallback(
    (incidentId: string, hospitalId: string, overrideConfirmed?: boolean) => {
      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id !== incidentId) return inc;
          return {
            ...inc,
            stage: 'destination_confirmed',
            confirmedHospitalId: hospitalId,
            capacityOverrideConfirmed: overrideConfirmed ?? inc.capacityOverrideConfirmed,
            notesHistory: [
              {
                timestamp: new Date().toISOString(),
                note: `Destination confirmed: Facility ${hospitalId}${
                  overrideConfirmed ? ' (Emergency Capacity Override Authorized)' : ''
                }.`,
                author: 'Dispatcher',
              },
              ...inc.notesHistory,
            ],
          };
        })
      );
    },
    []
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

  // Action: Reset Data
  const resetSimulationData = useCallback(() => {
    setNetwork(getInitialCityNetwork());
    setFacilities(getInitialFacilities());
    setAmbulances(getInitialAmbulances());
    setIncidents(getInitialIncidents());
    setActiveIncidentId('INC-2026-081');
    setHighlightedRoute(null);
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
        setActiveIncidentId,
        setRoutingAlgorithm,
        setRoutingObjective,
        setHighlightedRoute,
        createIncident,
        updateIncidentObservations,
        dispatchAmbulanceToIncident,
        updateAmbulanceCrewReport,
        confirmHospitalDestination,
        advanceIncidentStage,
        toggleRoadBlock,
        updateFacilityBeds,
        resetSimulationData,
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
