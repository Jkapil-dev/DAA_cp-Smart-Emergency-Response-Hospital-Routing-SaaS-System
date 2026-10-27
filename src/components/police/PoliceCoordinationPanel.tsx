import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { TrafficIntervention } from '../../types/police';
import { SeverityBadge } from '../common/SeverityBadge';
import {
  ShieldAlert,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Car,
  Clock,
  MapPin,
  Plus,
} from 'lucide-react';

export const PoliceCoordinationPanel: React.FC = () => {
  const {
    policeAlerts,
    policeAcknowledgeAlert,
    policeAddIntervention,
    ambulances,
    network,
  } = useSimulation();

  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(
    policeAlerts[0]?.id || null
  );
  const [selectedInterventionType, setSelectedInterventionType] =
    useState<TrafficIntervention['type']>('Green Wave Preemption');
  const [customLocation, setCustomLocation] = useState('');

  const activeAlert = policeAlerts.find((a) => a.id === selectedAlertId) || policeAlerts[0];

  const handleAddIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAlert) return;
    const targetLoc = customLocation.trim() || activeAlert.nodeName;
    policeAddIntervention(activeAlert.id, selectedInterventionType, targetLoc);
    setCustomLocation('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Police & Traffic Coordination Center</h3>
            <p className="text-[11px] text-slate-400">
              Automated transit priority, corridor alerts, and simulated signal preemption
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-blue-900/60 text-blue-300 font-semibold border border-blue-800">
            {policeAlerts.length} Active Alert(s)
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-900/60 text-emerald-300 font-semibold border border-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Police Radio Channel
          </span>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Alerts Queue */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Incoming Emergency Alerts
          </h4>
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {policeAlerts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active police alerts.</p>
            ) : (
              policeAlerts.map((alert) => {
                const isSelected = activeAlert?.id === alert.id;
                return (
                  <button
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-400'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-xs text-slate-900">{alert.incidentId}</span>
                      <SeverityBadge severity={alert.severity} size="sm" />
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{alert.nodeName}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{alert.assistanceTypeRequested}</span>
                      <span
                        className={`font-semibold capitalize px-1.5 py-0.5 rounded text-[10px] ${
                          alert.status === 'intervention_active'
                            ? 'bg-purple-100 text-purple-700'
                            : alert.status === 'acknowledged'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {alert.status.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center & Right: Selected Alert Details & Traffic Interventions */}
        {activeAlert ? (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Alert Record
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{activeAlert.id}</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({activeAlert.nodeName})
                    </span>
                  </h4>
                </div>

                {activeAlert.status === 'delivered' ? (
                  <button
                    onClick={() => policeAcknowledgeAlert(activeAlert.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Acknowledge Alert</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Acknowledged by {activeAlert.acknowledgedBy || 'Traffic Control'}</span>
                  </span>
                )}
              </div>

              {/* Alert details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Triage Severity</span>
                  <span className="font-bold uppercase text-slate-800">{activeAlert.severity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Casualties</span>
                  <span className="font-bold text-slate-800">{activeAlert.injuredCount} Victim(s)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Entrapment</span>
                  <span
                    className={`font-bold ${
                      activeAlert.entrapment ? 'text-rose-600' : 'text-slate-700'
                    }`}
                  >
                    {activeAlert.entrapment ? 'YES (Trapped in Car)' : 'No Entrapment'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Assigned Unit</span>
                  <span className="font-bold text-emerald-700">
                    {activeAlert.ambulanceAssignedCallSign || 'Search in Progress'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-800 font-semibold">Priority Action Requested:</strong>{' '}
                {activeAlert.assistanceTypeRequested}
              </div>
            </div>

            {/* Active Interventions List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Deployed Traffic Interventions ({activeAlert.interventions.length})
                </h5>
              </div>

              {activeAlert.interventions.length === 0 ? (
                <div className="p-3 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                  No traffic interventions currently deployed for this incident. Select an action below to pre-empt signals or dispatch an escort.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeAlert.interventions.map((int) => (
                    <div
                      key={int.id}
                      className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs text-purple-900 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-purple-950 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-purple-700" />
                          <span>{int.type}</span>
                          <span className="font-normal text-purple-700 text-[11px]">
                            @ {int.targetLocation}
                          </span>
                        </div>
                        <p className="text-[11px] text-purple-800 mt-0.5">{int.notes}</p>
                      </div>
                      <span className="text-[10px] text-purple-600 whitespace-nowrap">
                        {new Date(int.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Bar: Deploy Intervention */}
            <form
              onSubmit={handleAddIntervention}
              className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3"
            >
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Deploy Traffic Intervention / Signal Priority</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <select
                    value={selectedInterventionType}
                    onChange={(e) =>
                      setSelectedInterventionType(e.target.value as TrafficIntervention['type'])
                    }
                    className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Green Wave Preemption">Green Wave Preemption</option>
                    <option value="Intersection Clearing">Intersection Clearing</option>
                    <option value="Road Closure Detour">Road Closure Detour</option>
                    <option value="Motorcycle Escort">Motorcycle Escort</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <input
                    type="text"
                    placeholder={`Location (Default: ${activeAlert.nodeName})`}
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="sm:col-span-1">
                  <button
                    type="submit"
                    className="w-full h-full bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold py-2 px-3 rounded-lg text-xs shadow-sm transition"
                  >
                    Deploy Intervention
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center p-8 text-xs text-slate-400">
            Select an alert from the left queue to view details and deploy interventions.
          </div>
        )}
      </div>
    </div>
  );
};
