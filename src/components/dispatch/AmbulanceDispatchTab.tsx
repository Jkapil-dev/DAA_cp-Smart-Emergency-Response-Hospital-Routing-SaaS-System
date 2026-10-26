import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { AmbulanceStatusBadge } from '../common/StatusBadge';
import { SeverityBadge } from '../common/SeverityBadge';
import {
  Ambulance as AmbulanceIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Stethoscope,
  Activity,
  Navigation,
  FileText,
  UserCheck,
} from 'lucide-react';
import { CrewReportModal } from './CrewReportModal';

export const AmbulanceDispatchTab: React.FC = () => {
  const {
    ambulances,
    activeIncident,
    activeAmbulanceRecommendation,
    dispatchAmbulanceToIncident,
    setHighlightedRoute,
  } = useSimulation();

  const [selectedAmbulanceForReport, setSelectedAmbulanceForReport] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Ambulance Fleet & Dispatch Coordination
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Capability-aware unit selection, ETA optimization, and on-scene field reporting
        </p>
      </div>

      {/* Recommended Dispatch Decision Card (for Active Incident) */}
      {activeIncident && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Active Incident Dispatch Target
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <h3 className="text-sm font-bold text-slate-900">
                  {activeIncident.id}: {activeIncident.title}
                </h3>
                <SeverityBadge severity={activeIncident.severityEvaluation.severity} size="sm" />
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Required Capability:{' '}
              <strong className="text-slate-800">
                {activeIncident.severityEvaluation.requiresALSAmbulance
                  ? 'ALS (Advanced Life Support)'
                  : 'BLS / ALS Acceptable'}
              </strong>
            </div>
          </div>

          {activeAmbulanceRecommendation ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    RECOMMENDED UNIT: {activeAmbulanceRecommendation.recommendedAmbulance.callSign} (
                    {activeAmbulanceRecommendation.recommendedAmbulance.type})
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Stationed at Node {activeAmbulanceRecommendation.recommendedAmbulance.currentNodeId}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeAmbulanceRecommendation.selectionReason}
                </p>

                {/* Candidate alternatives breakdown */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    Evaluated Fleet Candidates:
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {activeAmbulanceRecommendation.candidateRankings.map((c) => (
                      <span
                        key={c.ambulance.id}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
                          c.ambulance.id ===
                          activeAmbulanceRecommendation.recommendedAmbulance.id
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                            : c.isEligible
                            ? 'bg-slate-50 border-slate-200 text-slate-700'
                            : 'bg-rose-50/50 border-rose-200 text-slate-400 line-through'
                        }`}
                        title={c.ineligibilityReason}
                      >
                        {c.ambulance.callSign} ({c.ambulance.type}) -{' '}
                        {c.travelTimeMinutes < Infinity
                          ? `${c.travelTimeMinutes}m`
                          : 'Unreachable'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Column */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Estimated Travel Time:</span>
                  <span className="text-lg font-black text-slate-900">
                    {activeAmbulanceRecommendation.routeToIncident.travelTimeMinutes} min
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Route Distance:</span>
                  <span className="font-semibold text-slate-700">
                    {activeAmbulanceRecommendation.routeToIncident.distanceKm} km
                  </span>
                </div>

                {activeIncident.stage === 'reported' ? (
                  <button
                    onClick={() =>
                      dispatchAmbulanceToIncident(
                        activeIncident.id,
                        activeAmbulanceRecommendation.recommendedAmbulance.id
                      )
                    }
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dispatch {activeAmbulanceRecommendation.recommendedAmbulance.callSign}</span>
                  </button>
                ) : (
                  <div className="text-center py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold border border-blue-200">
                    Assigned: {activeIncident.assignedAmbulanceId || 'None'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Alert: Zero available ambulances are currently reachable to this incident location!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Ambulance Fleet Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Simulated Emergency Fleet Roster</h3>
            <p className="text-xs text-slate-500">
              Station locations, life-support classification, and onboard equipment
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Unit / Call Sign</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Station Node</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Crew Capability</th>
                <th className="px-4 py-3">Onboard Equipment</th>
                <th className="px-4 py-3 text-right">Field Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ambulances.map((amb) => {
                const isAssignedToActive = activeIncident?.assignedAmbulanceId === amb.id;
                return (
                  <tr
                    key={amb.id}
                    className={`hover:bg-slate-50/70 transition ${
                      isAssignedToActive ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                          <AmbulanceIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{amb.callSign}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{amb.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          amb.type === 'ALS'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {amb.type}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-medium text-slate-700">
                      Node {amb.currentNodeId}
                    </td>

                    <td className="px-4 py-3.5">
                      <AmbulanceStatusBadge status={amb.status} />
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="font-medium text-slate-800">{amb.crewSummary}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {amb.capabilities.join(' • ')}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {amb.equipment.slice(0, 2).map((eq, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]"
                          >
                            {eq}
                          </span>
                        ))}
                        {amb.equipment.length > 2 && (
                          <span className="text-[10px] text-slate-400">
                            +{amb.equipment.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {isAssignedToActive && (
                        <button
                          onClick={() => setSelectedAmbulanceForReport(amb.id)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded text-xs font-semibold transition"
                        >
                          Field Report
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crew Report Modal Trigger */}
      {selectedAmbulanceForReport && activeIncident && (
        <CrewReportModal
          isOpen={true}
          onClose={() => setSelectedAmbulanceForReport(null)}
          ambulanceId={selectedAmbulanceForReport}
          incidentId={activeIncident.id}
        />
      )}
    </div>
  );
};
