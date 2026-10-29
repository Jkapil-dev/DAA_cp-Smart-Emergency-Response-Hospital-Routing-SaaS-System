import React, { useState, useMemo } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { SeverityBadge } from '../common/SeverityBadge';
import { IncidentObservations, ConsciousnessStatus, BreathingStatus, BleedingStatus } from '../../types/incident';
import { aStar } from '../../algorithms/astar';
import { dijkstra } from '../../algorithms/dijkstra';
import {
  Ambulance as AmbulanceIcon,
  CheckCircle2,
  XCircle,
  Navigation,
  MapPin,
  Clock,
  Ruler,
  AlertTriangle,
  Play,
  Activity,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  Radio,
  FileText,
  RotateCcw,
} from 'lucide-react';

export const DriverDashboard: React.FC<{ ambulanceId: string }> = ({ ambulanceId }) => {
  const {
    ambulances,
    incidents,
    facilities,
    network,
    // selectedAmbulanceId,
    // setSelectedAmbulanceId,
    routingAlgorithm,
    routingObjective,
    driverRespondToRequest,
    driverAcknowledgeDispatch,
    driverStepMovement,
    driverMarkArrivalAtScene,
    driverSubmitOnSceneReport,
    driverMarkPatientLoaded,
    driverMarkArrivalAtHospital,
    confirmHospitalDestination,
  } = useSimulation();
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>(ambulanceId);

  const currentAmbulance =
    ambulances.find((a) => a.id === selectedAmbulanceId) || ambulances[0];

  const assignedIncident = currentAmbulance?.status === 'available'
    ? undefined
    : incidents.find(
      (inc) =>
        inc.id === currentAmbulance?.currentIncidentId ||
        inc.id === currentAmbulance?.reservedForIncidentId ||
        inc.assignedAmbulanceId === currentAmbulance?.id
    );

  const passedIncidentIds = new Set(
    currentAmbulance?.declineHistory?.map((entry) => entry.incidentId) || []
  );
  const availableRequests = incidents.filter((incident) =>
    incident.stage === 'reported'
      && !incident.assignedAmbulanceId
      && !passedIncidentIds.has(incident.id)
  );

  // Decline modal / reason selector state
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('Critical vehicle mechanical warning');

  // Field On-Scene Assessment state
  const [showFieldReportModal, setShowFieldReportModal] = useState(false);
  const [fieldConscious, setFieldConscious] = useState<ConsciousnessStatus>('unconscious');
  const [fieldBreathing, setFieldBreathing] = useState<BreathingStatus>('difficult');
  const [fieldBleeding, setFieldBleeding] = useState<BleedingStatus>('severe_uncontrolled');
  const [fieldMajorInjury, setFieldMajorInjury] = useState<boolean>(true);
  const [fieldTrapped, setFieldTrapped] = useState<boolean>(false);
  const [fieldNote, setFieldNote] = useState('');
  const [verifiedEquipment, setVerifiedEquipment] = useState<string[]>([
    'Defibrillator / Monitor Checked',
    'Portable Ventilator Primed',
    'IV Trauma Access Kit Prepared',
  ]);

  const router = routingAlgorithm === 'astar' ? aStar : dijkstra;

  // Active Route Calculation
  const activeRoute = useMemo(() => {
    if (!currentAmbulance || !assignedIncident) return null;

    if (
      currentAmbulance.status === 'en_route_scene' ||
      currentAmbulance.status === 'dispatched' ||
      currentAmbulance.status === 'reserved'
    ) {
      return router(
        network,
        currentAmbulance.currentNodeId,
        assignedIncident.locationNodeId,
        routingObjective
      );
    }

    if (currentAmbulance.status === 'transporting') {
      const destFacilityId =
        assignedIncident.confirmedHospitalId ||
        assignedIncident.provisionalHospitalId ||
        'HOSP-TRAUMA-1';
      const facility = facilities.find((f) => f.id === destFacilityId);
      const destNode = facility ? facility.nodeId : 'N-06';
      return router(network, currentAmbulance.currentNodeId, destNode, routingObjective);
    }

    return null;
  }, [currentAmbulance, assignedIncident, network, routingAlgorithm, routingObjective, facilities]);

  // Turn-by-turn next road segment
  const nextRoadSegment = useMemo(() => {
    if (!activeRoute || activeRoute.edges.length === 0) return null;
    return activeRoute.edges[0];
  }, [activeRoute]);

  const handleAccept = () => {
    if (!assignedIncident || !currentAmbulance) return;
    driverAcknowledgeDispatch(currentAmbulance.id, assignedIncident.id, true);
  };

  const handleRequestResponse = (incidentId: string, accept: boolean) => {
    if (!currentAmbulance) return;
    driverRespondToRequest(currentAmbulance.id, incidentId, accept);
  };

  const handleConfirmDecline = () => {
    if (!assignedIncident || !currentAmbulance) return;
    driverAcknowledgeDispatch(currentAmbulance.id, assignedIncident.id, false, declineReason);
    setShowDeclineModal(false);
  };

  const handleSaveFieldReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedIncident || !currentAmbulance) return;
    const updatedObs: IncidentObservations = {
      ...assignedIncident.currentObservations,
      consciousness: fieldConscious,
      breathing: fieldBreathing,
      bleeding: fieldBleeding,
      suspectedMajorInjury: fieldMajorInjury,
      trappedInVehicle: fieldTrapped,
      additionalNotes: fieldNote
        ? `${assignedIncident.currentObservations.additionalNotes} | [Field]: ${fieldNote}`
        : assignedIncident.currentObservations.additionalNotes,
    };
    driverSubmitOnSceneReport(
      currentAmbulance.id,
      assignedIncident.id,
      updatedObs,
      verifiedEquipment,
      fieldNote || 'Paramedic rapid trauma assessment completed.'
    );
    setShowFieldReportModal(false);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Top Cockpit Header: Mobile/Tablet Optimized */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <AmbulanceIcon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">{currentAmbulance?.callSign}</h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-emerald-400 text-slate-950 uppercase tracking-wide">
                {currentAmbulance?.type} Unit
              </span>
            </div>
            <p className="text-xs text-slate-400">{currentAmbulance?.crewSummary}</p>
          </div>
        </div>

        {/* Unit Selector */}
        <div className="flex items-center gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Switch Vehicle Cockpit
            </label>
            <select
              value={selectedAmbulanceId}
              onChange={(e) => setSelectedAmbulanceId(e.target.value)}
              className="text-xs font-bold bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2 focus:ring-2 focus:ring-emerald-400"
            >
              {ambulances.map((amb) => (
                <option key={amb.id} value={amb.id}>
                  {amb.callSign} ({amb.type}) — {amb.status.toUpperCase()} @ Node {amb.currentNodeId}
                </option>
              ))}
            </select>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Current Location
            </span>
            <span className="text-sm font-black text-slate-100">Node {currentAmbulance?.currentNodeId}</span>
          </div>
        </div>
      </div>

      {/* Main Cockpit Flow */}
      {assignedIncident ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Turn-by-Turn GPS Navigation & Step Controls (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            {/* Guidance HUD Header */}
            <div className="bg-slate-950 text-white rounded-xl p-4 space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-400">
                  <Navigation className="w-4 h-4 fill-current animate-pulse" />
                  <span>
                    {currentAmbulance.status === 'transporting'
                      ? 'Hospital Transport Corridor'
                      : 'Emergency Response Route'}
                  </span>
                </span>
                <span className="font-semibold">{routingAlgorithm.toUpperCase()} Routing</span>
              </div>

              {nextRoadSegment ? (
                <div className="pt-1">
                  <div className="text-xs text-slate-400">Next Segment:</div>
                  <div className="text-lg font-black text-white flex items-center gap-2">
                    <span>{nextRoadSegment.roadName}</span>
                    <span className="text-xs font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                      {nextRoadSegment.speedLimitKmh} km/h
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-base font-bold text-slate-200">
                  Arrived at destination waypoint.
                </div>
              )}

              {/* ETA & Distance Metric Pill */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Estimated Travel Time</span>
                  <span className="text-xl font-black text-emerald-400">
                    {activeRoute ? `${activeRoute.totalTravelTimeMinutes} min` : '0 min'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Remaining Distance</span>
                  <span className="text-xl font-black text-white">
                    {activeRoute ? `${activeRoute.totalDistanceKm} km` : '0 km'}
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated Movement Control */}
            {(currentAmbulance.status === 'en_route_scene' ||
              currentAmbulance.status === 'transporting') && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-emerald-600 fill-current" />
                    <span>Simulated Location Progression</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Current Node: <strong>{currentAmbulance.currentNodeId}</strong>
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => driverStepMovement(currentAmbulance.id)}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold rounded-xl shadow-sm text-xs flex items-center justify-center gap-2 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>Advance 1 Intersection Waypoint</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Coordinates refresh continuously and are shared with the police traffic coordination module.
                </p>
              </div>
            )}

            {/* Current Route Path Sequence */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Calculated Route Sequence ({activeRoute?.path.length || 0} Nodes)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeRoute?.path.map((nodeId, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-1 rounded text-[11px] font-bold border ${
                      nodeId === currentAmbulance.currentNodeId
                        ? 'bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {nodeId}
                    {idx < activeRoute.path.length - 1 && ' →'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: High-Urgency Dispatch Controls & Lifecycle Actions (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            {/* Dispatch Target Card */}
            <div className="border-b border-slate-100 pb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target Incident Call
                </span>
                <SeverityBadge
                  severity={assignedIncident.severityEvaluation.severity}
                  size="sm"
                />
              </div>

              <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                {assignedIncident.title}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                <span>{assignedIncident.locationAddress || `Node ${assignedIncident.locationNodeId}`}</span>
              </p>
            </div>

            {/* Key Observations Summary */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block">Injured Count:</span>
                  <strong className="text-slate-800">
                    {assignedIncident.currentObservations.injuredCount} Person(s)
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Consciousness:</span>
                  <strong className="text-slate-800 capitalize">
                    {assignedIncident.currentObservations.consciousness}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Breathing:</span>
                  <strong className="text-slate-800 capitalize">
                    {assignedIncident.currentObservations.breathing}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Bleeding:</span>
                  <strong className="text-slate-800 capitalize">
                    {assignedIncident.currentObservations.bleeding.replace('_', ' ')}
                  </strong>
                </div>
              </div>

              {assignedIncident.currentObservations.additionalNotes && (
                <div className="pt-2 border-t border-slate-200 text-slate-700 italic">
                  "{assignedIncident.currentObservations.additionalNotes}"
                </div>
              )}
            </div>

            {/* Explicit Driver State Control Buttons */}
            <div className="space-y-3 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Responder Actions (Current Status: {currentAmbulance.status.toUpperCase()})
              </span>

              {/* 1. Pending Dispatch: Accept or Decline */}
              {currentAmbulance.status === 'reserved' && (
                <div className="space-y-2">
                  <button
                    onClick={handleAccept}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-md shadow-emerald-900/20 text-sm flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>ACCEPT DISPATCH</span>
                  </button>

                  <button
                    onClick={() => setShowDeclineModal(true)}
                    className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 text-xs flex items-center justify-center gap-2 transition"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>DECLINE DISPATCH (WITH REASON)</span>
                  </button>
                </div>
              )}

              {/* 2. En Route Scene: Mark Arrival */}
              {currentAmbulance.status === 'en_route_scene' && (
                <button
                  onClick={() => driverMarkArrivalAtScene(currentAmbulance.id, assignedIncident.id)}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-md shadow-blue-900/20 text-sm flex items-center justify-center gap-2 transition"
                >
                  <MapPin className="w-5 h-5" />
                  <span>MARK ARRIVAL AT SCENE</span>
                </button>
              )}

              {/* 3. On Scene: Update Field Report & Load Patient */}
              {currentAmbulance.status === 'on_scene' && (
                <div className="space-y-2.5">
                  <button
                    onClick={() => setShowFieldReportModal(true)}
                    className="w-full py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-xl border border-purple-200 text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Stethoscope className="w-4 h-4 text-purple-700" />
                    <span>UPDATE ON-SCENE INJURY TRIAGE</span>
                  </button>

                  <button
                    onClick={() => driverMarkPatientLoaded(currentAmbulance.id, assignedIncident.id)}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-md text-sm flex items-center justify-center gap-2 transition"
                  >
                    <Navigation className="w-5 h-5 fill-current" />
                    <span>PATIENT LOADED — BEGIN TRANSPORT</span>
                  </button>
                </div>
              )}

              {/* 4. Transporting: Mark Hospital Arrival */}
              {currentAmbulance.status === 'transporting' && (
                <button
                  onClick={() => driverMarkArrivalAtHospital(currentAmbulance.id, assignedIncident.id)}
                  className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-xl shadow-md text-sm flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>MARK ARRIVAL AT HOSPITAL (TRANSFER CARE)</span>
                </button>
              )}

              {/* Completed / Available State */}
              {currentAmbulance.status === 'available' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-bold">
                  ✓ Unit {currentAmbulance.callSign} is Available & In Service. Standing by for next dispatch.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Dispatch console</p>
              <h3 className="mt-1 text-xl font-black text-slate-900">Available emergency requests</h3>
              <p className="mt-1 text-xs text-slate-500">Unit {currentAmbulance?.callSign} · {availableRequests.length} real-time {availableRequests.length === 1 ? 'request' : 'requests'} visible</p>
            </div>
            <span className="flex h-10 items-center gap-2 rounded-full bg-emerald-50 px-3 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Ready
            </span>
          </div>

          {availableRequests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><AmbulanceIcon className="h-6 w-6" /></div>
              <h3 className="mt-3 text-base font-extrabold text-slate-800">No open requests</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">New emergency reports will appear here immediately. Units that accept a request remove it from every other dashboard.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {availableRequests.map((incident) => {
                const requestRoute = router(network, currentAmbulance.currentNodeId, incident.locationNodeId, routingObjective);
                const observer = incident.initialObservations;
                return (
                  <article key={incident.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                      <div className="min-w-0"><div className="flex items-center gap-2"><span className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">New request</span><span className="font-black text-slate-900">{incident.id}</span></div><h4 className="mt-3 truncate text-base font-black text-slate-900">{incident.title}</h4><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5 shrink-0 text-rose-500" />{incident.locationAddress || `Node ${incident.locationNodeId}`}</p></div>
                      <SeverityBadge severity={incident.severityEvaluation.severity} size="sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 px-5 py-4">
                      <div className="rounded-xl bg-slate-50 px-3 py-2.5"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Distance</p><p className="mt-1 text-sm font-black text-slate-800">{requestRoute.totalDistanceKm} km</p></div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2.5"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Arrival</p><p className="mt-1 text-sm font-black text-slate-800">{requestRoute.totalTravelTimeMinutes} min</p></div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2.5"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Injured</p><p className="mt-1 text-sm font-black text-slate-800">{observer.injuredCount}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 px-5 pb-5">
                      <button type="button" onClick={() => handleRequestResponse(incident.id, false)} className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"><XCircle className="h-4 w-4" />Pass</button>
                      <button type="button" onClick={() => handleRequestResponse(incident.id, true)} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-xs font-black text-white shadow-md shadow-emerald-900/15 transition hover:bg-emerald-500"><CheckCircle2 className="h-4 w-4" />Accept & route</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Decline Dispatch Modal with Reason */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-extrabold text-slate-900">Decline Dispatch Assignment</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Declining will immediately release your unit's reservation and trigger an automated
              expanding grid search for the next available unit. Please select an operational reason:
            </p>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Operational Reason
              </label>
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800"
              >
                <option value="Mechanical / Vehicle Warning Indicator">
                  Mechanical / Vehicle Warning Indicator
                </option>
                <option value="Stuck in Localized Heavy Traffic / Obstruction">
                  Stuck in Localized Heavy Traffic / Obstruction
                </option>
                <option value="Medical Equipment Defect / Oxygen Depleted">
                  Medical Equipment Defect / Oxygen Depleted
                </option>
                <option value="Paramedic Crew Fatigue / Rest Mandate">
                  Paramedic Crew Fatigue / Rest Mandate
                </option>
                <option value="Delayed Transfer at Hospital ER Receiving">
                  Delayed Transfer at Hospital ER Receiving
                </option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecline}
                className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-sm"
              >
                Confirm Decline & Release
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field On-Scene Triage Update Modal */}
      {showFieldReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveFieldReport}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center gap-2 text-purple-700 border-b border-slate-100 pb-3">
              <Stethoscope className="w-5 h-5" />
              <h3 className="text-base font-extrabold text-slate-900">
                Paramedic On-Scene Trauma Assessment
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Consciousness
                </label>
                <select
                  value={fieldConscious}
                  onChange={(e) => setFieldConscious(e.target.value as ConsciousnessStatus)}
                  className="w-full p-2 border rounded-lg bg-slate-50 font-semibold"
                >
                  <option value="conscious">Conscious & Alert</option>
                  <option value="semi-conscious">Semi-Conscious</option>
                  <option value="unconscious">Unconscious / GCS &lt; 8</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Breathing</label>
                <select
                  value={fieldBreathing}
                  onChange={(e) => setFieldBreathing(e.target.value as BreathingStatus)}
                  className="w-full p-2 border rounded-lg bg-slate-50 font-semibold"
                >
                  <option value="normal">Normal</option>
                  <option value="difficult">Labored / Stridor</option>
                  <option value="absent">Apneic / Arrest</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Bleeding</label>
                <select
                  value={fieldBleeding}
                  onChange={(e) => setFieldBleeding(e.target.value as BleedingStatus)}
                  className="w-full p-2 border rounded-lg bg-slate-50 font-semibold"
                >
                  <option value="none">None</option>
                  <option value="controlled">Controlled</option>
                  <option value="severe_uncontrolled">Severe Uncontrolled</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Major Trauma
                </label>
                <select
                  value={String(fieldMajorInjury)}
                  onChange={(e) => setFieldMajorInjury(e.target.value === 'true')}
                  className="w-full p-2 border rounded-lg bg-slate-50 font-semibold"
                >
                  <option value="true">Yes (Head/Spine/Polytrauma)</option>
                  <option value="false">No Major Trauma</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Paramedic Clinical Notes
              </label>
              <textarea
                rows={2}
                placeholder="E.g. Intubation completed, C-collar applied, 2x large-bore IVs placed..."
                value={fieldNote}
                onChange={(e) => setFieldNote(e.target.value)}
                className="w-full p-2 border rounded-lg text-xs bg-slate-50"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFieldReportModal(false)}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-3 rounded-lg bg-purple-700 hover:bg-purple-600 text-xs font-bold text-white shadow-sm"
              >
                Submit & Recalculate Destination
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
