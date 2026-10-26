import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { FacilityType } from '../../types/hospital';
import {
  Building2,
  Bed,
  Plus,
  Minus,
  CheckCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  Phone,
  MapPin,
} from 'lucide-react';

export const HospitalsTab: React.FC = () => {
  const { facilities, updateFacilityBeds, activeHospitalRecommendation } = useSimulation();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Hospitals, Clinics & Capacity Census
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Live hospital bed availability, emergency divert status, and medical capability profiles
        </p>
      </div>

      {/* Transparency & Safety Callout */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-bold">Capacity & Admission Transparency Policy:</strong> Nominal bed
          status reflects simulated census reports. Occupied facilities must never be represented as
          guaranteed admissions. For critical trauma triage, trauma-certified facilities remain eligible
          under emergency override rules even at 0 beds, requiring coordinator radio authorization.
        </div>
      </div>

      {/* Medical Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {facilities.map((facility) => {
          const isTrauma = facility.type === 'trauma_center';
          const isGeneral = facility.type === 'general_hospital';
          const isClinic = facility.type === 'clinic';
          const isFull = facility.availableBeds === 0;

          const isCurrentlyRecommended =
            activeHospitalRecommendation?.recommendedFacility?.id === facility.id;

          return (
            <div
              key={facility.id}
              className={`bg-white rounded-xl border p-5 flex flex-col justify-between shadow-sm transition ${
                isCurrentlyRecommended
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Facility Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                      isTrauma
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : isGeneral
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-teal-50 text-teal-700 border-teal-200'
                    }`}
                  >
                    {facility.type.replace('_', ' ')}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isFull
                        ? 'bg-rose-100 text-rose-800'
                        : facility.emergencyStatus === 'open'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isFull ? 'NOMINAL FULL (0 BEDS)' : facility.emergencyStatus.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">{facility.name}</h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Location: <strong>Node {facility.nodeId}</strong>
                  </span>
                </div>

                {/* Bed Capacity Controls */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Simulated Bed Census:</span>
                    <span className="font-bold text-slate-900">
                      <strong
                        className={`text-sm ${
                          isFull ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {facility.availableBeds}
                      </strong>{' '}
                      / {facility.totalBeds} Available
                    </span>
                  </div>

                  {/* Bed adjuster buttons for demonstration */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-medium">Adjust Beds:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateFacilityBeds(facility.id, facility.availableBeds - 1)}
                        disabled={facility.availableBeds <= 0}
                        className="w-6 h-6 rounded bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center text-slate-700 transition"
                        title="Decrease available beds"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => updateFacilityBeds(facility.id, facility.availableBeds + 1)}
                        disabled={facility.availableBeds >= facility.totalBeds}
                        className="w-6 h-6 rounded bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center text-slate-700 transition"
                        title="Increase available beds"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => updateFacilityBeds(facility.id, 0)}
                        className="px-1.5 py-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 ml-1 transition"
                        title="Set to 0 beds (Test full capacity)"
                      >
                        Set 0
                      </button>
                    </div>
                  </div>
                </div>

                {/* Capabilities list */}
                <div className="mt-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Supported Capabilities
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {facility.capabilities.map((cap, i) => (
                      <span
                        key={i}
                        className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{facility.address}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Medical Acuity Suitability Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">
            Rule-Based Facility Triage Suitability Matrix
          </h3>
          <p className="text-xs text-slate-500">
            Hard constraints applied prior to route cost calculations
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/60 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Triage Level</th>
                <th className="px-4 py-3">Eligible Facility Types</th>
                <th className="px-4 py-3">Clinics Ineligible?</th>
                <th className="px-4 py-3">0-Bed Capacity Rule</th>
                <th className="px-4 py-3">Ranking Metric</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="px-4 py-3 font-bold text-rose-600">CRITICAL</td>
                <td className="px-4 py-3 font-semibold">Trauma Center (Level 1 / 2)</td>
                <td className="px-4 py-3 text-rose-700 font-bold">Strictly Excluded</td>
                <td className="px-4 py-3 text-amber-700">
                  Capacity Override Allowed (Not excluded on 0 beds)
                </td>
                <td className="px-4 py-3">Travel Time (Fastest)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-orange-600">SEVERE</td>
                <td className="px-4 py-3 font-semibold">Trauma Center (Level 1 / 2)</td>
                <td className="px-4 py-3 text-rose-700 font-bold">Strictly Excluded</td>
                <td className="px-4 py-3 text-amber-700">
                  Capacity Override Allowed with Dispatcher Confirmation
                </td>
                <td className="px-4 py-3">Travel Time (Fastest)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-amber-600">MODERATE</td>
                <td className="px-4 py-3 font-semibold">General Hospital or Trauma Center</td>
                <td className="px-4 py-3 text-slate-500">Excluded (Lacks ER/Surgical Beds)</td>
                <td className="px-4 py-3 text-slate-500">Excluded / Diverted if 0 beds</td>
                <td className="px-4 py-3">Travel Time + Bed Margin</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-emerald-600">MINOR</td>
                <td className="px-4 py-3 font-semibold">Urgent Care Clinic (Preferred), Hospital</td>
                <td className="px-4 py-3 text-emerald-700">Preferred to save ER capacity</td>
                <td className="px-4 py-3 text-slate-500">Excluded if 0 observation beds</td>
                <td className="px-4 py-3">Travel Time to Clinic</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
