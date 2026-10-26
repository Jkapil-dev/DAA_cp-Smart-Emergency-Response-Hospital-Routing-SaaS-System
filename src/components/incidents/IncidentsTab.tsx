import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { SeverityBadge } from '../common/SeverityBadge';
import { StageBadge } from '../common/StatusBadge';
import { Incident, DispatchStage, IncidentObservations } from '../../types/incident';
import {
  AlertOctagon,
  MapPin,
  Clock,
  CheckCircle2,
  Ambulance,
  Building2,
  FileText,
  Upload,
  Plus,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { CrewReportModal } from '../dispatch/CrewReportModal';

interface IncidentsTabProps {
  onOpenReportModal: () => void;
}

export const IncidentsTab: React.FC<IncidentsTabProps> = ({ onOpenReportModal }) => {
  const {
    incidents,
    activeIncidentId,
    setActiveIncidentId,
    activeIncident,
    ambulances,
    facilities,
    activeHospitalRecommendation,
    activeAmbulanceRecommendation,
    advanceIncidentStage,
    confirmHospitalDestination,
    dispatchAmbulanceToIncident,
    updateIncidentObservations,
  } = useSimulation();

  const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);
  const [isEditingObservations, setIsEditingObservations] = useState(false);

  // Editable observation states for active incident
  const [editInjured, setEditInjured] = useState(activeIncident?.currentObservations.injuredCount || 1);
  const [editConscious, setEditConscious] = useState(activeIncident?.currentObservations.consciousness || 'conscious');
  const [editBreathing, setEditBreathing] = useState(activeIncident?.currentObservations.breathing || 'normal');
  const [editBleeding, setEditBleeding] = useState(activeIncident?.currentObservations.bleeding || 'none');
  const [editMajorInjury, setEditMajorInjury] = useState(activeIncident?.currentObservations.suspectedMajorInjury || false);
  const [editTrapped, setEditTrapped] = useState(activeIncident?.currentObservations.trappedInVehicle || false);

  const handleSaveObservationEdit = () => {
    if (!activeIncident) return;
    const updated: IncidentObservations = {
      ...activeIncident.currentObservations,
      injuredCount: editInjured,
      consciousness: editConscious,
      breathing: editBreathing,
      bleeding: editBleeding,
      suspectedMajorInjury: editMajorInjury,
      trappedInVehicle: editTrapped,
    };
    updateIncidentObservations(activeIncident.id, updated, 'Dispatcher manual observation re-assessment.');
    setIsEditingObservations(false);
  };

  const assignedAmbulance = ambulances.find((a) => a.id === activeIncident?.assignedAmbulanceId);
  const confirmedFacility = facilities.find((f) => f.id === activeIncident?.confirmedHospitalId);
  const provisionalFacility = facilities.find((f) => f.id === activeIncident?.provisionalHospitalId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Incident Management & Triage Protocol
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Two-stage emergency intake, deterministic severity rules, and destination decisioning
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold py-2 px-3.5 rounded-lg text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Incident</span>
        </button>
      </div>

      {/* Incidents Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Incident List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Call Queue ({incidents.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {incidents.map((inc) => {
              const isSelected = inc.id === activeIncidentId;
              return (
                <div
                  key={inc.id}
                  onClick={() => {
                    setActiveIncidentId(inc.id);
                    setIsEditingObservations(false);
                    setEditInjured(inc.currentObservations.injuredCount);
                    setEditConscious(inc.currentObservations.consciousness);
                    setEditBreathing(inc.currentObservations.breathing);
                    setEditBleeding(inc.currentObservations.bleeding);
                    setEditMajorInjury(inc.currentObservations.suspectedMajorInjury);
                    setEditTrapped(inc.currentObservations.trappedInVehicle);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-50/60 border-blue-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-500">{inc.id}</span>
                    <SeverityBadge severity={inc.severityEvaluation.severity} size="sm" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{inc.title}</h3>

                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Node {inc.locationNodeId}</span>
                    </div>
                    <StageBadge stage={inc.stage} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): Selected Incident Deep Drilldown */}
        <div className="lg:col-span-7">
          {activeIncident ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{activeIncident.id}</span>
                    <SeverityBadge severity={activeIncident.severityEvaluation.severity} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">{activeIncident.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Location: Intersection <strong>{activeIncident.locationNodeId}</strong></span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reported: {new Date(activeIncident.reportedAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Dispatch Stage Progress Pill */}
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Workflow Status
                  </span>
                  <StageBadge stage={activeIncident.stage} />
                </div>
              </div>

              {/* Two-Stage Workflow Actions */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Workflow Dispatch Actions
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {activeIncident.stage === 'reported' && activeAmbulanceRecommendation && (
                    <button
                      onClick={() =>
                        dispatchAmbulanceToIncident(
                          activeIncident.id,
                          activeAmbulanceRecommendation.recommendedAmbulance.id
                        )
                      }
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Ambulance className="w-3.5 h-3.5" />
                      <span>
                        Assign {activeAmbulanceRecommendation.recommendedAmbulance.callSign} (Stage 1)
                      </span>
                    </button>
                  )}

                  {activeIncident.stage === 'en_route_scene' && (
                    <button
                      onClick={() => advanceIncidentStage(activeIncident.id, 'scene_arrived')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Unit Arrived on Scene</span>
                    </button>
                  )}

                  {(activeIncident.stage === 'scene_arrived' ||
                    activeIncident.stage === 'en_route_scene' ||
                    activeIncident.stage === 'assessment_updated') &&
                    assignedAmbulance && (
                      <button
                        onClick={() => setIsCrewModalOpen(true)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Submit Paramedic Crew Report (Stage 2)</span>
                      </button>
                    )}

                  {activeIncident.stage !== 'destination_confirmed' &&
                    activeIncident.stage !== 'en_route_hospital' &&
                    activeIncident.stage !== 'completed' &&
                    activeHospitalRecommendation?.recommendedFacility && (
                      <button
                        onClick={() =>
                          confirmHospitalDestination(
                            activeIncident.id,
                            activeHospitalRecommendation.recommendedFacility!.id,
                            activeHospitalRecommendation.hasCapacityOverride
                          )
                        }
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Hospital Destination</span>
                      </button>
                    )}

                  {activeIncident.stage === 'destination_confirmed' && (
                    <button
                      onClick={() => advanceIncidentStage(activeIncident.id, 'en_route_hospital')}
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Initiate Hospital Transport</span>
                    </button>
                  )}

                  {activeIncident.stage === 'en_route_hospital' && (
                    <button
                      onClick={() => advanceIncidentStage(activeIncident.id, 'completed')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Handover Completed</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Triage Decision Justification & Overrides */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Deterministic Triage Protocol
                  </h4>
                  <button
                    onClick={() => setIsEditingObservations(!isEditingObservations)}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    {isEditingObservations ? 'Cancel Edit' : 'Edit Observations'}
                  </button>
                </div>

                {isEditingObservations ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-blue-300 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-semibold block mb-1">Consciousness</label>
                        <select
                          value={editConscious}
                          onChange={(e: any) => setEditConscious(e.target.value)}
                          className="w-full p-2 border rounded bg-white"
                        >
                          <option value="conscious">Conscious</option>
                          <option value="semi-conscious">Semi-Conscious</option>
                          <option value="unconscious">Unconscious (Critical)</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">Breathing</label>
                        <select
                          value={editBreathing}
                          onChange={(e: any) => setEditBreathing(e.target.value)}
                          className="w-full p-2 border rounded bg-white"
                        >
                          <option value="normal">Normal</option>
                          <option value="difficult">Difficult</option>
                          <option value="absent">Absent (Critical)</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">Bleeding</label>
                        <select
                          value={editBleeding}
                          onChange={(e: any) => setEditBleeding(e.target.value)}
                          className="w-full p-2 border rounded bg-white"
                        >
                          <option value="none">None</option>
                          <option value="controlled">Controlled</option>
                          <option value="severe_uncontrolled">Severe / Uncontrolled</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">Injured Count</label>
                        <input
                          type="number"
                          value={editInjured}
                          onChange={(e) => setEditInjured(parseInt(e.target.value) || 1)}
                          className="w-full p-2 border rounded bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editMajorInjury}
                          onChange={(e) => setEditMajorInjury(e.target.checked)}
                        />
                        <span>Suspected Major Trauma</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editTrapped}
                          onChange={(e) => setEditTrapped(e.target.checked)}
                        />
                        <span>Trapped in Vehicle</span>
                      </label>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSaveObservationEdit}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-bold"
                      >
                        Recalculate Severity
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div>
                      <span className="font-bold text-slate-700 block">Triggered Decisive Rules:</span>
                      <ul className="list-disc list-inside text-slate-600 mt-1 space-y-0.5">
                        {activeIncident.severityEvaluation.reasons.map((reason, idx) => (
                          <li key={idx} className="font-medium text-slate-800">
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {activeIncident.severityEvaluation.overrides.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 text-[11px] text-amber-800">
                        <strong>Rule Precedence Overrides:</strong>{' '}
                        {activeIncident.severityEvaluation.overrides.join('; ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Supporting Photographs Preview Gallery */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Scene Photographs (Supporting Visual Evidence)
                </h4>
                {activeIncident.currentObservations.photoUrls &&
                activeIncident.currentObservations.photoUrls.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {activeIncident.currentObservations.photoUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="w-28 h-28 rounded-lg overflow-hidden border border-slate-200 shadow-sm"
                      >
                        <img
                          src={url}
                          alt="Incident scene preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No photographs attached. (Photographs serve as manual operator reference and do not alter rule logic).
                  </p>
                )}
              </div>

              {/* Hospital Candidates Ranking Table */}
              {activeHospitalRecommendation && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Evaluated Destination Facilities
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Hard Suitability Constraints Applied Prior to Route Cost
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/60 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                        <tr>
                          <th className="px-3 py-2">Facility</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2">Beds</th>
                          <th className="px-3 py-2">Travel Time</th>
                          <th className="px-3 py-2">Suitability</th>
                          <th className="px-3 py-2">Eligibility Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeHospitalRecommendation.candidates.map((c) => (
                          <tr
                            key={c.facility.id}
                            className={
                              activeHospitalRecommendation.recommendedFacility?.id === c.facility.id
                                ? 'bg-blue-50/70 font-semibold'
                                : !c.isEligible
                                ? 'bg-slate-50/50 text-slate-400'
                                : ''
                            }
                          >
                            <td className="px-3 py-2.5 font-medium text-slate-900">
                              {c.facility.name}
                            </td>
                            <td className="px-3 py-2.5 capitalize">
                              {c.facility.type.replace('_', ' ')}
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={
                                  c.facility.availableBeds === 0 ? 'text-rose-600 font-bold' : ''
                                }
                              >
                                {c.facility.availableBeds} / {c.facility.totalBeds}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              {c.travelTimeMinutes < Infinity
                                ? `${c.travelTimeMinutes} min (${c.distanceKm} km)`
                                : 'Unreachable'}
                            </td>
                            <td className="px-3 py-2.5">{c.suitabilityScore} pts</td>
                            <td className="px-3 py-2.5">
                              {c.isEligible ? (
                                c.hasCapacityOverride ? (
                                  <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-200">
                                    Override Required
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                                    Eligible
                                  </span>
                                )
                              ) : (
                                <span className="text-slate-500 text-[10px]" title={c.exclusionReason}>
                                  Excluded: {c.exclusionReason?.slice(0, 30)}...
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes & Audit History */}
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Dispatcher Audit & Notes Log
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {activeIncident.notesHistory.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs flex items-start justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{entry.author}: </span>
                        <span className="text-slate-600">{entry.note}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              Select an incident from the left queue to view details.
            </div>
          )}
        </div>
      </div>

      {/* Crew Report Modal */}
      {assignedAmbulance && activeIncident && (
        <CrewReportModal
          isOpen={isCrewModalOpen}
          onClose={() => setIsCrewModalOpen(false)}
          ambulanceId={assignedAmbulance.id}
          incidentId={activeIncident.id}
        />
      )}
    </div>
  );
};
