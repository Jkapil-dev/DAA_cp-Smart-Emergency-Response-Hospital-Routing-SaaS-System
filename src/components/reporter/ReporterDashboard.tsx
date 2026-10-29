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
import { dijkstra } from '../../algorithms/dijkstra';
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  ArrowRight,
  ShieldAlert,
  Ambulance,
  Building2,
  Radio,
  Search,
  Navigation,
} from 'lucide-react';

interface ReporterDashboardProps {
  callerId: string;
  callerName: string;
  callerPhone: string;
}

export const ReporterDashboard: React.FC<ReporterDashboardProps> = ({ callerId, callerName, callerPhone }) => {
  const {
    network,
    ambulances,
    incidents,
    createIncident,
    setActiveIncidentId,
  } = useSimulation();

  // Form State
  const [selectedLocationNodeId, setSelectedLocationNodeId] = useState('N-07');
  const [locationQuery, setLocationQuery] = useState('');
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [injuredCount, setInjuredCount] = useState(1);
  const [consciousness, setConsciousness] = useState<ConsciousnessStatus>('conscious');
  const [breathing, setBreathing] = useState<BreathingStatus>('normal');
  const [bleeding, setBleeding] = useState<BleedingStatus>('none');
  const [suspectedMajorInjury, setSuspectedMajorInjury] = useState<boolean | 'unknown'>('unknown');
  const [trappedInVehicle, setTrappedInVehicle] = useState<boolean | 'unknown'>('unknown');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [gpsSimulated, setGpsSimulated] = useState(false);
  const [submittedIncidentId, setSubmittedIncidentId] = useState<string | null>(null);

  const selectedNode = network.nodes.find((n) => n.id === selectedLocationNodeId);
  const myIncidents = useMemo(() => incidents.filter((incident) => {
    const observations = incident.initialObservations;
    if (observations.callerId) return observations.callerId === callerId;
    return observations.callerName?.trim().toLowerCase() === callerName.trim().toLowerCase();
  }), [callerId, callerName, incidents]);
  const locationResults = useMemo(() => {
    const query = locationQuery.trim().toLowerCase();
    if (!query) return network.nodes.slice(0, 6);
    return network.nodes
      .filter((node) => `${node.name} ${node.id} ${node.zone}`.toLowerCase().includes(query))
      .slice(0, 6);
  }, [locationQuery, network.nodes]);

  const handleSimulateGPS = () => {
    // Pick a high-density intersection
    setSelectedLocationNodeId('N-08');
    setLocationQuery('Civic Center Cross');
    setShowLocationResults(false);
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
      callerId,
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
    myIncidents.find((incident) => incident.id === submittedIncidentId) ||
    myIncidents[0];
  const acceptedAmbulance = trackedIncident?.assignedAmbulanceId
    ? ambulances.find((ambulance) => ambulance.id === trackedIncident.assignedAmbulanceId)
    : undefined;
  const acceptedRoute = useMemo(() => {
    if (!acceptedAmbulance || !trackedIncident) return null;
    return dijkstra(
      network,
      acceptedAmbulance.currentNodeId,
      trackedIncident.locationNodeId,
      'travelTime'
    );
  }, [acceptedAmbulance, network, trackedIncident]);

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
    <div className="mx-auto max-w-6xl space-y-5 px-1 sm:px-2">
      <section className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 px-5 py-5 text-white sm:px-7 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-100">
                <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_0_5px_rgba(255,255,255,.14)]" />
                Emergency reporting
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Do you need emergency help?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-50">
                Share the location and what you can see. It takes less than a minute, and an unknown answer will not delay help.
              </p>
            </div>
            <div className="hidden rounded-xl border border-white/20 bg-white/10 p-3 sm:block">
              <Radio className="h-5 w-5" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-3 text-xs text-rose-50">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Your location is sent with the report</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Live progress appears below</span>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-sm font-black text-rose-700">1</span>
                <div>
                  <h3 className="font-extrabold text-slate-900">Where is the emergency?</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Choose the closest known location.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 px-5 py-5 sm:px-6">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <MapPin className="h-4 w-4 text-rose-600" /> Accident location
                  </label>
                  <button
                    type="button"
                    onClick={handleSimulateGPS}
                    className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                  >
                    {gpsSimulated ? '✓ Location set' : 'Use my location'}
                  </button>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    value={locationQuery}
                    onChange={(event) => {
                      setLocationQuery(event.target.value);
                      setGpsSimulated(false);
                      setShowLocationResults(true);
                    }}
                    onFocus={() => setShowLocationResults(true)}
                    placeholder="Search by place, road, hospital, or landmark"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                    aria-label="Search emergency location"
                  />
                  {showLocationResults && (
                    <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      {locationResults.length > 0 ? locationResults.map((node) => (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => {
                            setSelectedLocationNodeId(node.id);
                            setLocationQuery(node.name);
                            setShowLocationResults(false);
                            setGpsSimulated(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${selectedLocationNodeId === node.id ? 'bg-rose-50' : 'hover:bg-slate-50'}`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <MapPin className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-slate-800">{node.name}</span>
                            <span className="mt-0.5 block text-[11px] text-slate-500">{node.zone} area · {node.id}</span>
                          </span>
                        </button>
                      )) : (
                        <p className="px-3 py-4 text-center text-xs text-slate-500">No matching location. Try a road or landmark name.</p>
                      )}
                    </div>
                  )}
                </div>
                {selectedNode && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
                    <Navigation className="mt-0.5 h-4 w-4 shrink-0" />
                    <span><span className="font-bold">Selected:</span> {selectedNode.name} · {selectedNode.zone} area</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-sm font-black text-rose-700">2</span>
                  <div>
                    <h3 className="font-extrabold text-slate-900">What is happening?</h3>
                    <p className="mt-0.5 text-xs text-slate-500">Give the dispatcher the quickest possible picture.</p>
                  </div>
                </div>

                <fieldset>
                  <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">People needing help</legend>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setInjuredCount(count)}
                        aria-pressed={injuredCount === count}
                        className={`h-11 rounded-xl border text-sm font-black transition ${injuredCount === count ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        {count === 5 ? '5+' : count}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <ChoiceField
                    label="Is anyone conscious?"
                    value={consciousness}
                    options={[
                      ['conscious', 'Yes, responsive'],
                      ['semi-conscious', 'Confused / dazed'],
                      ['unconscious', 'No response'],
                      ['unknown', 'Not sure'],
                    ]}
                    onChange={(value) => setConsciousness(value as ConsciousnessStatus)}
                  />
                  <ChoiceField
                    label="Is anyone bleeding?"
                    value={bleeding}
                    options={[
                      ['none', 'No'],
                      ['controlled', 'Yes, controlled'],
                      ['severe_uncontrolled', 'Heavy bleeding'],
                      ['unknown', 'Not sure'],
                    ]}
                    onChange={(value) => setBleeding(value as BleedingStatus)}
                  />
                  <ChoiceField
                    label="Can they breathe normally?"
                    value={breathing}
                    options={[
                      ['normal', 'Yes, normally'],
                      ['difficult', 'Breathing difficulty'],
                      ['absent', 'Not breathing'],
                      ['unknown', 'Not sure'],
                    ]}
                    onChange={(value) => setBreathing(value as BreathingStatus)}
                  />
                  <ChoiceField
                    label="Is anyone trapped?"
                    value={String(trappedInVehicle)}
                    options={[
                      ['false', 'No'],
                      ['true', 'Yes, trapped'],
                      ['unknown', 'Not sure'],
                    ]}
                    onChange={(value) => setTrappedInVehicle(value === 'true' ? true : value === 'false' ? false : 'unknown')}
                  />
                </div>

                <fieldset className="mt-5">
                  <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Suspected serious injury?
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      { value: true as const, label: 'Yes', detail: 'Major trauma or a broken limb', active: 'border-amber-400 bg-amber-50 text-amber-950 ring-amber-100' },
                      { value: false as const, label: 'No', detail: 'No obvious serious injury', active: 'border-emerald-400 bg-emerald-50 text-emerald-950 ring-emerald-100' },
                      { value: 'unknown' as const, label: 'Not sure', detail: 'It is unclear or hard to see', active: 'border-slate-500 bg-slate-100 text-slate-950 ring-slate-100' },
                    ].map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setSuspectedMajorInjury(option.value)}
                        aria-pressed={suspectedMajorInjury === option.value}
                        className={`rounded-xl border px-3 py-3 text-left transition hover:border-slate-400 ${suspectedMajorInjury === option.value ? `${option.active} ring-4` : 'border-slate-200 bg-white text-slate-700'}`}
                      >
                        <span className="block text-sm font-black">{option.label}</span>
                        <span className="mt-1 block text-[11px] leading-4 text-slate-500">{option.detail}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <details className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-slate-700">
                    Add a photo or short note <span className="float-right text-slate-400">Optional</span>
                  </summary>
                  <div className="space-y-4 border-t border-slate-200 p-4">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-600">Additional observation</span>
                      <textarea rows={3} value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} placeholder="Example: vehicle overturned, smoke visible, two vehicles involved" className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600"><Camera className="h-4 w-4" /> Scene photo</span>
                      <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-blue-700" />
                    </label>
                    {photoUrls.length > 0 && <div className="flex gap-2 overflow-x-auto">{photoUrls.map((url, index) => <img key={index} src={url} alt="Scene evidence" className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover" />)}</div>}
                  </div>
                </details>
              </div>

              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-rose-900/20 transition hover:bg-rose-700 active:scale-[0.99]">
                <AlertOctagon className="h-5 w-5" /> Send emergency report
              </button>
              <p className="text-center text-[11px] leading-5 text-slate-400">Only send a report for a real or simulated emergency. This demonstration does not contact real emergency services.</p>
            </div>
          </form>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24">
          {trackedIncident ? (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Your active report</p>
                    <h3 className="mt-1 font-black text-slate-900">{trackedIncident.id}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{trackedIncident.locationAddress}</p>
                  </div>
                  <SeverityBadge severity={trackedIncident.severityEvaluation.severity} size="sm" />
                </div>
              </div>

              <div className="px-5 py-5">
                {acceptedAmbulance ? (
                  <div className="mb-5 overflow-hidden rounded-2xl border border-emerald-300 bg-emerald-600 text-white shadow-lg shadow-emerald-900/10" role="status">
                    <div className="flex items-start gap-3 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                        <Ambulance className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">Request accepted</p>
                        <p className="mt-1 text-base font-black">{acceptedAmbulance.callSign} is on the way</p>
                        <p className="mt-1 text-xs leading-5 text-emerald-50">The ambulance driver accepted your emergency and has started responding.</p>
                      </div>
                    </div>
                    {acceptedRoute?.found && (
                      <div className="grid grid-cols-2 border-t border-emerald-500 bg-emerald-700/40">
                        <div className="px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-wide text-emerald-100">Estimated arrival</p><p className="mt-0.5 text-lg font-black">{acceptedRoute.totalTravelTimeMinutes} min</p></div>
                        <div className="border-l border-emerald-500 px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-wide text-emerald-100">Distance</p><p className="mt-0.5 text-lg font-black">{acceptedRoute.totalDistanceKm} km</p></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-5 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-3 text-sm font-bold text-amber-800">
                    <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" /><span className="relative h-2.5 w-2.5 rounded-full bg-amber-500" /></span>
                    Waiting for an ambulance to accept
                  </div>
                )}

                <ol className="space-y-0">
                  {stages.map((stage, index) => {
                    const isDone = index < currentStageIndex;
                    const isCurrent = index === currentStageIndex;
                    return (
                      <li key={stage.key} className="relative flex gap-3 pb-4 last:pb-0">
                        {index < stages.length - 1 && <span className={`absolute left-[11px] top-6 h-full w-0.5 ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                        <span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${isDone ? 'border-emerald-500 bg-emerald-500 text-white' : isCurrent ? 'border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100' : 'border-slate-300 bg-white'}`}>
                          {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className={`h-1.5 w-1.5 rounded-full ${isCurrent ? 'bg-white' : 'bg-slate-300'}`} />}
                        </span>
                        <div className="pt-0.5">
                          <p className={`text-sm ${isCurrent ? 'font-black text-blue-700' : isDone ? 'font-bold text-slate-700' : 'font-medium text-slate-400'}`}>{stage.label}</p>
                          {isCurrent && <p className="mt-1 text-xs text-slate-500">We are currently working on this step.</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs">
                  <StatusRow label="Ambulance" value={acceptedAmbulance ? `${acceptedAmbulance.callSign} accepted and is coming` : 'Finding the nearest unit'} />
                  <StatusRow label="Hospital" value={trackedIncident.confirmedHospitalId ? 'Receiving hospital confirmed' : 'Coordination in progress'} />
                </div>

                <div className="mt-4 flex gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-900">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Stay in a safe place and follow responder instructions. Do not enter a hazardous area.</span>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <Ambulance className="mx-auto h-8 w-8 text-slate-300" />
              <h3 className="mt-3 font-bold text-slate-700">Waiting for a report</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">Once submitted, your emergency status and response updates will appear here.</p>
            </section>
          )}

          {myIncidents.length > 1 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">My recent reports</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{myIncidents.length}</span>
              </div>
              <div className="mt-3 space-y-1.5">
                {myIncidents.slice(0, 4).map((incident) => (
                  <button key={incident.id} onClick={() => { setSubmittedIncidentId(incident.id); setActiveIncidentId(incident.id); }} className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs transition ${trackedIncident?.id === incident.id ? 'bg-slate-900 font-bold text-white shadow-sm' : 'border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'}`}>
                    <span className="truncate font-bold">{incident.id}</span>
                    <span className="shrink-0 text-[10px] opacity-70">{incident.stage.replace(/_/g, ' ')}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

interface ChoiceFieldProps {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}

const ChoiceField: React.FC<ChoiceFieldProps> = ({ label, value, options, onChange }) => (
  <fieldset>
    <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</legend>
    <div className="grid grid-cols-2 gap-2">
      {options.map(([optionValue, optionLabel]) => (
        <button
          key={optionValue}
          type="button"
          onClick={() => onChange(optionValue)}
          aria-pressed={value === optionValue}
          className={`min-h-10 rounded-lg border px-2 py-2.5 text-xs font-bold leading-4 transition ${value === optionValue ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
        >
          {optionLabel}
        </button>
      ))}
    </div>
  </fieldset>
);

const StatusRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
    <span className="text-slate-500">{label}</span>
    <span className="text-right font-bold text-slate-800">{value}</span>
  </div>
);
