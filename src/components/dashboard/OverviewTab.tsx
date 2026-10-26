import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { CityMapVisualizer } from '../map/CityMapVisualizer';
import { SeverityBadge } from '../common/SeverityBadge';
import { StageBadge } from '../common/StatusBadge';
import {
  AlertOctagon,
  Ambulance,
  Building2,
  Bed,
  Clock,
  ArrowRight,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';
import { NavTab } from '../layout/Sidebar';

interface OverviewTabProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenReportModal: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  onSelectTab,
  onOpenReportModal,
}) => {
  const {
    incidents,
    ambulances,
    facilities,
    network,
    activeIncident,
    activeHospitalRecommendation,
    activeAmbulanceRecommendation,
    setActiveIncidentId,
    setHighlightedRoute,
    dispatchAmbulanceToIncident,
    confirmHospitalDestination,
  } = useSimulation();

  // Dynamic KPI Metrics directly computed from simulation state
  const totalActiveIncidents = incidents.filter((i) => i.stage !== 'completed').length;
  const availableAmbulances = ambulances.filter((a) => a.status === 'available').length;
  const occupiedAmbulances = ambulances.length - availableAmbulances;
  const totalBeds = facilities.reduce((sum, f) => sum + f.totalBeds, 0);
  const availableBeds = facilities.reduce((sum, f) => sum + f.availableBeds, 0);
  const bedUtilizationPercent = Math.round(((totalBeds - availableBeds) / totalBeds) * 100);

  const closedRoads = network.edges.filter((e) => e.isBlocked);

  return (
    <div className="space-y-6">
      {/* Page Title & Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Operational Dispatch & Routing Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time DAA graph-optimized dispatch and rule-based medical triage monitoring
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenReportModal}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold py-2 px-3.5 rounded-lg text-xs shadow-sm shadow-rose-900/20 transition"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Incidents */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Active Incidents
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{totalActiveIncidents}</span>
              <span className="text-xs text-rose-600 font-semibold">
                {incidents.filter((i) => i.severityEvaluation.severity === 'critical').length} Critical
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {incidents.length} total logged incidents
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        {/* Ambulance Fleet Status */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Ambulance Availability
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{availableAmbulances}</span>
              <span className="text-xs text-slate-500 font-semibold">/ {ambulances.length} Ready</span>
            </div>
            <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">
              {occupiedAmbulances} units on active run
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Ambulance className="w-6 h-6" />
          </div>
        </div>

        {/* Hospital Bed Availability */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Bed Capacity Census
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{availableBeds}</span>
              <span className="text-xs text-slate-500 font-semibold">/ {totalBeds} Available</span>
            </div>
            <div className="w-28 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  bedUtilizationPercent > 80 ? 'bg-rose-500' : 'bg-blue-600'
                }`}
                style={{ width: `${bedUtilizationPercent}%` }}
              />
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Bed className="w-6 h-6" />
          </div>
        </div>

        {/* Facilities & Road Status */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Simulated Facilities
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{facilities.length}</span>
              <span className="text-xs text-emerald-600 font-semibold">All Online</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {closedRoads.length > 0 ? (
                <span className="text-rose-600 font-semibold">{closedRoads.length} Road Closures Active</span>
              ) : (
                <span className="text-emerald-600">All Road Links Clear</span>
              )}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map & Live Active Incident Dispatch Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Simulated Road Network */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Simulated City Network</h3>
            </div>
            <div className="text-xs text-slate-500">
              Interactive SVG Graph • Click road to simulate closure
            </div>
          </div>

          <CityMapVisualizer
            height="h-[460px]"
            customRoute={activeHospitalRecommendation?.recommendedRoute}
          />
        </div>

        {/* Right 1 Col: Active Dispatch Focus Card */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Active Incident Focus
            </h3>
            {activeIncident && (
              <StageBadge stage={activeIncident.stage} />
            )}
          </div>

          {activeIncident ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
              {/* Incident header info */}
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {activeIncident.id}
                  </span>
                  <SeverityBadge severity={activeIncident.severityEvaluation.severity} size="sm" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1">{activeIncident.title}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Location: Intersection <strong>{activeIncident.locationNodeId}</strong>
                  </span>
                </div>
              </div>

              {/* Triage Decision Justification */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1">Triage Decision Basis:</span>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
                  {activeIncident.severityEvaluation.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* Recommended Ambulance Selection */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Stage 1: Recommended Ambulance
                </span>
                {activeAmbulanceRecommendation ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ambulance className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900">
                          {activeAmbulanceRecommendation.recommendedAmbulance.callSign} (
                          {activeAmbulanceRecommendation.recommendedAmbulance.type})
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {activeAmbulanceRecommendation.routeToIncident.travelTimeMinutes} min ETA
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                      {activeAmbulanceRecommendation.selectionReason}
                    </p>

                    {activeIncident.stage === 'reported' && (
                      <button
                        onClick={() =>
                          dispatchAmbulanceToIncident(
                            activeIncident.id,
                            activeAmbulanceRecommendation.recommendedAmbulance.id
                          )
                        }
                        className="mt-2.5 w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Dispatch {activeAmbulanceRecommendation.recommendedAmbulance.callSign}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-rose-600 font-semibold">
                    No available ambulance reachable via open roads!
                  </span>
                )}
              </div>

              {/* Recommended Hospital */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Hospital Destination Recommendation
                  </span>
                  {activeHospitalRecommendation?.isProvisional && (
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      Provisional
                    </span>
                  )}
                </div>

                {activeHospitalRecommendation?.recommendedFacility ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {activeHospitalRecommendation.recommendedFacility.name}
                      </span>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {activeHospitalRecommendation.recommendedRoute?.totalTravelTimeMinutes} min
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>
                        Type:{' '}
                        <strong className="text-slate-700 capitalize">
                          {activeHospitalRecommendation.recommendedFacility.type.replace('_', ' ')}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Beds:{' '}
                        <strong
                          className={
                            activeHospitalRecommendation.recommendedFacility.availableBeds === 0
                              ? 'text-rose-600 font-bold'
                              : 'text-emerald-600'
                          }
                        >
                          {activeHospitalRecommendation.recommendedFacility.availableBeds} avail
                        </strong>
                      </span>
                    </div>

                    {activeHospitalRecommendation.hasCapacityOverride && (
                      <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-800">
                        <strong>CAPACITY OVERRIDE:</strong> Facility at nominal capacity, but trauma
                        acuity is mandatory. Dispatcher confirmation required.
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                      {activeHospitalRecommendation.justification}
                    </p>

                    {activeIncident.stage !== 'destination_confirmed' &&
                      activeIncident.stage !== 'en_route_hospital' &&
                      activeIncident.stage !== 'completed' && (
                        <button
                          onClick={() =>
                            confirmHospitalDestination(
                              activeIncident.id,
                              activeHospitalRecommendation.recommendedFacility!.id,
                              activeHospitalRecommendation.hasCapacityOverride
                            )
                          }
                          className="mt-2.5 w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Hospital Destination</span>
                        </button>
                      )}
                  </div>
                ) : (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                    <strong>DISPATCHER INTERVENTION NEEDED:</strong>{' '}
                    {activeHospitalRecommendation?.interventionReason}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              No active incident selected. Select one from the top header or report a new incident.
            </div>
          )}
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Recent Incident Triage & Dispatch Log</h3>
          <button
            onClick={() => onSelectTab('incidents')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All Incidents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Incident ID</th>
                <th className="px-4 py-2.5">Title & Location</th>
                <th className="px-4 py-2.5">Severity</th>
                <th className="px-4 py-2.5">Workflow Stage</th>
                <th className="px-4 py-2.5">Assigned Unit</th>
                <th className="px-4 py-2.5">Recommended Facility</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incidents.slice(0, 5).map((inc) => {
                const assignedAmb = ambulances.find((a) => a.id === inc.assignedAmbulanceId);
                const confirmedHosp = facilities.find(
                  (f) => f.id === (inc.confirmedHospitalId || inc.provisionalHospitalId)
                );

                return (
                  <tr
                    key={inc.id}
                    className={`hover:bg-slate-50/80 transition ${
                      activeIncident?.id === inc.id ? 'bg-blue-50/40 font-medium' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{inc.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{inc.title}</div>
                      <div className="text-[11px] text-slate-400">Node {inc.locationNodeId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={inc.severityEvaluation.severity} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <StageBadge stage={inc.stage} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {assignedAmb ? `${assignedAmb.callSign} (${assignedAmb.type})` : 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {confirmedHosp ? confirmedHosp.name : 'Computing...'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setActiveIncidentId(inc.id);
                          onSelectTab('incidents');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
