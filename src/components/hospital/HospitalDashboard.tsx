import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { SeverityBadge } from '../common/SeverityBadge';
import {
  Building2,
  Bed,
  Activity,
  Heart,
  Wind,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Plus,
  Minus,
  ShieldAlert,
  Radio,
  FileText,
} from 'lucide-react';

export const HospitalDashboard: React.FC<{ facilityId: string }> = ({ facilityId }) => {
  const {
    facilities,
    // selectedHospitalId,
    // setSelectedHospitalId,
    incidents,
    updateFacilityBeds,
    updateFacilityResources,
    hospitalRespond,
    confirmHospitalDestination,
  } = useSimulation();
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(facilityId);

  const currentHospital =
    facilities.find((f) => f.id === selectedHospitalId) || facilities[0];

  const incomingRequests = currentHospital.incomingRequests || [];

  const handleBedDelta = (delta: number) => {
    updateFacilityBeds(currentHospital.id, currentHospital.availableBeds + delta);
  };

  const handleIcuDelta = (delta: number) => {
    const nextVal = Math.max(0, currentHospital.availableIcuBeds + delta);
    updateFacilityResources(currentHospital.id, { availableIcuBeds: nextVal });
  };

  const handleBloodDelta = (delta: number) => {
    const nextVal = Math.max(0, currentHospital.bloodUnitsO + delta);
    updateFacilityResources(currentHospital.id, { bloodUnitsO: nextVal });
  };

  const handleVentilatorDelta = (delta: number) => {
    const nextVal = Math.max(0, currentHospital.ventilatorsAvailable + delta);
    updateFacilityResources(currentHospital.id, { ventilatorsAvailable: nextVal });
  };

  const handleToggleTraumaTeam = () => {
    updateFacilityResources(currentHospital.id, {
      traumaTeamReady: !currentHospital.traumaTeamReady,
    });
  };

  const isTrauma = currentHospital.type === 'trauma_center';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Hospital Selector */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">{currentHospital.name}</h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  isTrauma
                    ? 'bg-rose-500 text-white'
                    : currentHospital.type === 'general_hospital'
                    ? 'bg-blue-500 text-white'
                    : 'bg-teal-500 text-white'
                }`}
              >
                {currentHospital.type.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {currentHospital.address} • Contact: {currentHospital.contactPhone}
            </p>
          </div>
        </div>

        {/* Hospital Switcher */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Switch Hospital Coordinator View
          </label>
          <select
            value={selectedHospitalId}
            onChange={(e) => setSelectedHospitalId(e.target.value)}
            className="text-xs font-bold bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-400"
          >
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name} ({fac.availableBeds} beds available)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Incoming Emergency Queue (Left) & Resource Census Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Incoming Emergency Queue & Requests (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>Incoming Emergency Requests Queue ({incomingRequests.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Provisional notifications generated upon incident intake. Coordinator response required.
              </p>
            </div>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">
                No active incoming requests for {currentHospital.name}.
              </p>
              <p className="text-[11px] text-slate-400">
                When a new incident matches this facility's triage criteria, provisional bed and resource alerts appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map((req) => {
                const targetIncident = incidents.find((i) => i.id === req.incidentId);
                const isAccepted = req.status === 'accepted';
                const isDiverted = req.status === 'divert';
                const isOverride = req.status === 'capacity_override';

                return (
                  <div
                    key={req.id}
                    className={`p-4 rounded-xl border transition space-y-3 ${
                      isAccepted
                        ? 'bg-emerald-50/60 border-emerald-300'
                        : isDiverted
                        ? 'bg-rose-50/50 border-rose-200 opacity-60'
                        : isOverride
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">
                          {req.incidentId}
                        </span>
                        <SeverityBadge severity={req.severity} size="sm" />
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          isAccepted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDiverted
                            ? 'bg-rose-100 text-rose-800'
                            : isOverride
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Provisional Resource Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Beds Requested</span>
                        <span className="font-extrabold text-slate-800">
                          {req.resourceRequest.bedsRequested} Standard Bed(s)
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">ICU Beds</span>
                        <span className="font-extrabold text-slate-800">
                          {req.resourceRequest.icuBedsRequested} Bed(s)
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">O-Neg Blood</span>
                        <span className="font-extrabold text-slate-800">
                          {req.resourceRequest.bloodUnitsRequested} Unit(s)
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Trauma Bay</span>
                        <span className="font-extrabold text-slate-800">
                          {req.resourceRequest.traumaBayRequired ? 'Required' : 'Standard'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      <strong>Reason for Contact:</strong> {req.resourceRequest.reason}
                    </p>

                    {/* Special Override Warning for Critical 0-bed cases */}
                    {currentHospital.availableBeds <= 0 && isTrauma && (
                      <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-lg text-[11px] text-amber-950 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Emergency Capacity Override Rule:</strong> Nominal available bed count is 0,
                          but critical life-saving trauma resuscitation capabilities mandate facility eligibility.
                          Authorized coordinator may confirm emergency corridor admission.
                        </span>
                      </div>
                    )}

                    {/* Response Controls */}
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/60">
                      <button
                        onClick={() =>
                          hospitalRespond(
                            currentHospital.id,
                            req.incidentId,
                            currentHospital.availableBeds <= 0 && isTrauma ? 'capacity_override' : 'accepted',
                            'Accepted by hospital triage physician.'
                          )
                        }
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {currentHospital.availableBeds <= 0 && isTrauma
                            ? 'Authorize Emergency Capacity Override'
                            : 'Accept Incoming Request'}
                        </span>
                      </button>

                      <button
                        onClick={() =>
                          hospitalRespond(
                            currentHospital.id,
                            req.incidentId,
                            'divert',
                            'Facility at operational limit. Re-routing requested.'
                          )
                        }
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <XCircle className="w-3.5 h-3.5 text-slate-500" />
                        <span>Report Divert / Limit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Resource & Census Management (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Bed className="w-5 h-5 text-blue-600" />
              <span>Simulated Resource Census</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live capacity steppers for demonstration. Changes re-trigger suitability ranking.
            </p>
          </div>

          {/* Steppers Grid */}
          <div className="space-y-4">
            {/* Standard Beds */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Available Standard Beds</span>
                <span className="text-[11px] text-slate-400">Total: {currentHospital.totalBeds} beds</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBedDelta(-1)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center font-black text-sm text-slate-900">
                  {currentHospital.availableBeds}
                </span>
                <button
                  onClick={() => handleBedDelta(1)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* ICU Beds */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Available ICU Beds</span>
                <span className="text-[11px] text-slate-400">Total: {currentHospital.totalIcuBeds} critical beds</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleIcuDelta(-1)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center font-black text-sm text-slate-900">
                  {currentHospital.availableIcuBeds}
                </span>
                <button
                  onClick={() => handleIcuDelta(1)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Blood Bank (O-Neg) */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                  <span>O-Neg Blood Reserves</span>
                </span>
                <span className="text-[11px] text-slate-400">Emergency transfusion units</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBloodDelta(-1)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center font-black text-sm text-slate-900">
                  {currentHospital.bloodUnitsO}
                </span>
                <button
                  onClick={() => handleBloodDelta(1)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Ventilators */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-teal-500" />
                  <span>Available Ventilators</span>
                </span>
                <span className="text-[11px] text-slate-400">Mechanical respiration slots</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVentilatorDelta(-1)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center font-black text-sm text-slate-900">
                  {currentHospital.ventilatorsAvailable}
                </span>
                <button
                  onClick={() => handleVentilatorDelta(1)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Trauma Resuscitation Team Ready Toggle */}
            {isTrauma && (
              <div className="flex items-center justify-between p-3 bg-rose-50/60 rounded-xl border border-rose-200">
                <div>
                  <span className="text-xs font-bold text-rose-950 block">Trauma Surgical Bay</span>
                  <span className="text-[11px] text-rose-700">
                    {currentHospital.traumaTeamReady ? '✓ Team On Standby' : '✕ Team Occupied'}
                  </span>
                </div>
                <button
                  onClick={handleToggleTraumaTeam}
                  className={`py-1 px-3 rounded-lg text-xs font-bold transition ${
                    currentHospital.traumaTeamReady
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {currentHospital.traumaTeamReady ? 'READY' : 'OFFLINE'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
