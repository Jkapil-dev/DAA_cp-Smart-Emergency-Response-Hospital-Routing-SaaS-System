import React, { useState, useMemo } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import {
  ConsciousnessStatus,
  BreathingStatus,
  BleedingStatus,
  IncidentObservations,
} from '../../types/incident';
import { evaluateSeverity } from '../../engine/severityEngine';
import { SeverityBadge } from '../common/SeverityBadge';
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  User,
  Phone,
  ArrowRight,
  ShieldAlert,
  Ambulance,
  Building2,
  HelpCircle,
  Upload,
  Radio,
} from 'lucide-react';

export const ReporterDashboard: React.FC = () => {
  const { network, incidents, createIncident, activeIncident, setActiveIncidentId } =
    useSimulation();

  // Form State
  const [selectedLocationNodeId, setSelectedLocationNodeId] = useState('N-07');
  const [injuredCount, setInjuredCount] = useState(1);
  const [consciousness, setConsciousness] = useState<ConsciousnessStatus>('conscious');
  const [breathing, setBreathing] = useState<BreathingStatus>('normal');
  const [bleeding, setBleeding] = useState<BleedingStatus>('none');
  const [suspectedMajorInjury, setSuspectedMajorInjury] = useState<boolean | 'unknown'>('unknown');
  const [trappedInVehicle, setTrappedInVehicle] = useState<boolean | 'unknown'>('unknown');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [gpsSimulated, setGpsSimulated] = useState(false);
  const [submittedIncidentId, setSubmittedIncidentId] = useState<string | null>(
    activeIncident?.id || incidents[0]?.id || null
  );

  const selectedNode = network.nodes.find((n) => n.id === selectedLocationNodeId);

  const handleSimulateGPS = () => {
    // Pick a high-density intersection
    setSelectedLocationNodeId('N-08');
    setGpsSimulated(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrls((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const obs: IncidentObservations = {
      injuredCount,
      consciousness,
      breathing,
      bleeding,
      suspectedMajorInjury,
      trappedInVehicle,
      additionalNotes,
      callerName: callerName.trim() || undefined,
      callerPhone: callerPhone.trim() || undefined,
      photoUrls,
    };

    const nodeName = selectedNode ? selectedNode.name : `Node ${selectedLocationNodeId}`;
    const title = `Accident @ ${nodeName}`;

    const created = createIncident(title, selectedLocationNodeId, obs);
    setSubmittedIncidentId(created.id);
  };

  const trackedIncident =
    incidents.find((i) => i.id === submittedIncidentId) ||
    activeIncident ||
    incidents[0];

  // Lifecycle steps for the citizen view
  const stages = [
    { key: 'reported', label: 'Incident Received' },
    { key: 'ambulance_searching', label: 'Finding Ambulance' },
    { key: 'ambulance_assigned', label: 'Ambulance Assigned' },
    { key: 'en_route_scene', label: 'Approaching Scene' },
    { key: 'scene_arrived', label: 'Responder On-Scene' },
    { key: 'destination_confirmed', label: 'Hospital Confirmed' },
    { key: 'en_route_hospital', label: 'Transport in Progress' },
    { key: 'completed', label: 'Arrival at Hospital / Resolved' },
  ];

  const currentStageIndex = useMemo(() => {
    if (!trackedIncident) return 0;
    const stage = trackedIncident.stage;
    if (stage === 'completed') return 7;
    if (stage === 'en_route_hospital' || stage === 'hospital_arrived') return 6;
    if (stage === 'destination_confirmed') return 5;
    if (stage === 'scene_arrived' || stage === 'assessment_updated') return 4;
    if (stage === 'en_route_scene') return 3;
    if (stage === 'ambulance_assigned') return 2;
    if (stage === 'ambulance_searching') return 1;
    return 0;
  }, [trackedIncident]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Citizen Emergency Banner */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl p-6 shadow-md shadow-rose-900/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-100">
              Emergency Dispatch Portal
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Report an Emergency Incident</h2>
          <p className="text-xs text-rose-100 mt-1 max-w-xl leading-relaxed">
            Immediate dispatch response. Fill in what you observe—unknown details can remain unknown.
            Automated location routing and hospital pre-alerts activate immediately.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-xs flex items-center gap-2.5">
          <Radio className="w-5 h-5 text-white animate-pulse" />
          <div>
            <div className="font-bold">Automated 911 Simulation</div>
            <div className="text-[11px] text-rose-100">No real emergency calls generated</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Reporting Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
              <span>Step 1: Emergency Details</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select what is happening right now. Unsure answers will not delay dispatch.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Location Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  <span>Accident Location</span>
                </label>
                <button
                  type="button"
                  onClick={handleSimulateGPS}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 underline"
                >
                  {gpsSimulated ? '✓ GPS Acquired (Civic Center)' : 'Use Simulated GPS'}
                </button>
              </div>

              <select
                value={selectedLocationNodeId}
                onChange={(e) => {
                  setSelectedLocationNodeId(e.target.value);
                  setGpsSimulated(false);
                }}
                className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800"
              >
                {network.nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    [{node.id}] {node.name} ({node.zone} Sector)
                  </option>
                ))}
              </select>
            </div>

            {/* Injured Count */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Number of Injured Persons
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setInjuredCount(cnt)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${
                      injuredCount === cnt
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cnt === 5 ? '5+' : cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* Rapid Symptom Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Consciousness */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Consciousness
                </label>
                <select
                  value={consciousness}
                  onChange={(e) => setConsciousness(e.target.value as ConsciousnessStatus)}
                  className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg bg-slate-50"
                >
                  <option value="conscious">Conscious & Responsive</option>
                  <option value="semi-conscious">Semi-Conscious / Dazed</option>
                  <option value="unconscious">Unconscious / Unresponsive</option>
                  <option value="unknown">Unknown / Cannot Tell</option>
                </select>
              </div>

              {/* Breathing */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Breathing</label>
                <select
                  value={breathing}
                  onChange={(e) => setBreathing(e.target.value as BreathingStatus)}
                  className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg bg-slate-50"
                >
                  <option value="normal">Normal Respiration</option>
                  <option value="difficult">Difficult / Labored Gasping</option>
                  <option value="absent">Absent / Stopped Breathing</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              {/* Bleeding */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Bleeding</label>
                <select
                  value={bleeding}
                  onChange={(e) => setBleeding(e.target.value as BleedingStatus)}
                  className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg bg-slate-50"
                >
                  <option value="none">None Visible</option>
                  <option value="controlled">Controlled / Moderate Bleed</option>
                  <option value="severe_uncontrolled">Severe / Heavy Uncontrolled</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              {/* Trapped */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Vehicle Entrapment
                </label>
                <select
                  value={String(trappedInVehicle)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTrappedInVehicle(val === 'true' ? true : val === 'false' ? false : 'unknown');
                  }}
                  className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg bg-slate-50"
                >
                  <option value="unknown">Unknown / Not Sure</option>
                  <option value="true">Yes, Person is Trapped in Car</option>
                  <option value="false">No, Person is Extricated / Outside</option>
                </select>
              </div>
            </div>

            {/* Optional Caller Info & Notes */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-600 block">
                Additional Observations (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="E.g., Vehicle overturned, smoke from engine, 2 cars collided..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. Sarah M."
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Callback Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="E.g. +1 (555) 019-2834"
                    value={callerPhone}
                    onChange={(e) => setCallerPhone(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* Scene Photo Upload */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1.5">
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                <span>Upload Scene Photo (Supporting Visual Evidence Only)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />

              {photoUrls.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {photoUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Uploaded scene evidence"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-xs"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-extrabold rounded-xl shadow-md shadow-rose-900/20 text-sm flex items-center justify-center gap-2 transition"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Submit Emergency Report Now</span>
            </button>
          </form>
        </div>

        {/* Right Column: Live Incident Status & Dispatch Tracking (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {trackedIncident ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Active Incident Tracker
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {trackedIncident.id}
                  </h3>
                  <p className="text-xs text-slate-500">{trackedIncident.locationAddress}</p>
                </div>

                <SeverityBadge
                  severity={trackedIncident.severityEvaluation.severity}
                  size="sm"
                />
              </div>

              {/* Citizen friendly status tracker steps */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Simulated Response Progress
                </span>

                <div className="relative pl-6 space-y-4 border-l-2 border-slate-200">
                  {stages.map((st, idx) => {
                    const isDone = idx < currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    return (
                      <div key={st.key} className="relative">
                        <div
                          className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : isCurrent
                              ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-100 text-white animate-pulse'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <div
                          className={`text-xs ${
                            isCurrent
                              ? 'font-bold text-blue-700'
                              : isDone
                              ? 'font-semibold text-slate-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {st.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Update Card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Assigned Unit:</span>
                  <span className="font-bold text-slate-800">
                    {trackedIncident.assignedAmbulanceId ? 'Emergency Ambulance Dispatched' : 'Finding Nearest Available Unit...'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Destination:</span>
                  <span className="font-bold text-slate-800">
                    {trackedIncident.confirmedHospitalId
                      ? 'Trauma Receiving Center Confirmed'
                      : 'Hospital Coordination in Progress'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Police Traffic Assistance:</span>
                  <span className="font-bold text-emerald-700">Simulated Alert Active</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  Stay in a safe location. Responders have received your coordinates. If conditions change, emergency coordinators will update arrival instructions automatically.
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
              Submit an incident on the left to activate the live emergency response tracker.
            </div>
          )}

          {/* Quick Switcher for Demo */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Simulated Incidents in System
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {incidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => {
                    setSubmittedIncidentId(inc.id);
                    setActiveIncidentId(inc.id);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition ${
                    trackedIncident?.id === inc.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{inc.id}: {inc.title}</span>
                  <span className="uppercase text-[10px] font-semibold">{inc.stage.replace(/_/g, ' ')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
