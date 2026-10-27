import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import {
  ConsciousnessStatus,
  BreathingStatus,
  BleedingStatus,
  IncidentObservations,
} from '../../types/incident';
import { evaluateSeverity } from '../../engine/severityEngine';
import { SeverityBadge } from '../common/SeverityBadge';
import { X, CheckCircle, Radio, Stethoscope } from 'lucide-react';

interface CrewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ambulanceId: string;
  incidentId: string;
}

export const CrewReportModal: React.FC<CrewReportModalProps> = ({
  isOpen,
  onClose,
  ambulanceId,
  incidentId,
}) => {
  const { incidents, ambulances, updateAmbulanceCrewReport } = useSimulation();

  const incident = incidents.find((i) => i.id === incidentId);
  const ambulance = ambulances.find((a) => a.id === ambulanceId);

  const initialObs = incident?.currentObservations || {
    injuredCount: 1,
    consciousness: 'conscious' as ConsciousnessStatus,
    breathing: 'normal' as BreathingStatus,
    bleeding: 'none' as BleedingStatus,
    suspectedMajorInjury: false,
    trappedInVehicle: false,
    additionalNotes: '',
  };

  const [injuredCount, setInjuredCount] = useState(initialObs.injuredCount);
  const [consciousness, setConsciousness] = useState<ConsciousnessStatus>(initialObs.consciousness);
  const [breathing, setBreathing] = useState<BreathingStatus>(initialObs.breathing);
  const [bleeding, setBleeding] = useState<BleedingStatus>(initialObs.bleeding);
  const [suspectedMajorInjury, setSuspectedMajorInjury] = useState(initialObs.suspectedMajorInjury);
  const [trappedInVehicle, setTrappedInVehicle] = useState(initialObs.trappedInVehicle);
  const [crewNote, setCrewNote] = useState('');

  if (!isOpen || !incident || !ambulance) return null;

  const currentEvaluation = evaluateSeverity({
    injuredCount,
    consciousness,
    breathing,
    bleeding,
    suspectedMajorInjury,
    trappedInVehicle,
    additionalNotes: crewNote,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedObs: IncidentObservations = {
      ...initialObs,
      injuredCount,
      consciousness,
      breathing,
      bleeding,
      suspectedMajorInjury,
      trappedInVehicle,
      additionalNotes: crewNote || initialObs.additionalNotes,
    };

    updateAmbulanceCrewReport(
      ambulanceId,
      incidentId,
      updatedObs,
      crewNote || 'Crew on-scene vitals updated.'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Paramedic On-Scene Assessment Update
              </h2>
              <p className="text-xs text-slate-500">
                Unit {ambulance.callSign} • Incident {incident.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span>
              Recalculates triage severity & hospital destination in Stage 2.
            </span>
            <SeverityBadge severity={currentEvaluation.severity} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Consciousness (GCS)
              </label>
              <select
                value={consciousness}
                onChange={(e) => setConsciousness(e.target.value as ConsciousnessStatus)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="conscious">Conscious</option>
                <option value="semi-conscious">Semi-Conscious</option>
                <option value="unconscious">Unconscious (Critical)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Breathing / Airway
              </label>
              <select
                value={breathing}
                onChange={(e) => setBreathing(e.target.value as BreathingStatus)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="normal">Normal</option>
                <option value="difficult">Difficult / Labored</option>
                <option value="absent">Absent / Compromised</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Bleeding Status
              </label>
              <select
                value={bleeding}
                onChange={(e) => setBleeding(e.target.value as BleedingStatus)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="none">None</option>
                <option value="controlled">Controlled</option>
                <option value="severe_uncontrolled">Severe / Uncontrolled</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Victim Count
              </label>
              <input
                type="number"
                min="1"
                value={injuredCount}
                onChange={(e) => setInjuredCount(parseInt(e.target.value) || 1)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={suspectedMajorInjury === true}
                onChange={(e) => setSuspectedMajorInjury(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Suspected Major Trauma (Head, Spine, Chest, Internal)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={trappedInVehicle === true}
                onChange={(e) => setTrappedInVehicle(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Patient Entrapped in Vehicle</span>
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Field Paramedic Notes
            </label>
            <textarea
              rows={3}
              value={crewNote}
              onChange={(e) => setCrewNote(e.target.value)}
              placeholder="e.g. IV access established, cervical collar placed, blood pressure 85/50, initiating transport..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm"
            >
              Submit & Recalculate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
