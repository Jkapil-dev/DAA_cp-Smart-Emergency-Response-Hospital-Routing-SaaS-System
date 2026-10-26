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
  X,
  Upload,
  AlertOctagon,
  Image as ImageIcon,
  Info,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { network, createIncident } = useSimulation();

  const [title, setTitle] = useState('');
  const [locationNodeId, setLocationNodeId] = useState('N-07');
  const [injuredCount, setInjuredCount] = useState(1);
  const [consciousness, setConsciousness] = useState<ConsciousnessStatus>('conscious');
  const [breathing, setBreathing] = useState<BreathingStatus>('normal');
  const [bleeding, setBleeding] = useState<BleedingStatus>('none');
  const [suspectedMajorInjury, setSuspectedMajorInjury] = useState(false);
  const [trappedInVehicle, setTrappedInVehicle] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  // Real-time deterministic evaluation preview
  const previewObservations: IncidentObservations = useMemo(() => {
    return {
      injuredCount,
      consciousness,
      breathing,
      bleeding,
      suspectedMajorInjury,
      trappedInVehicle,
      additionalNotes,
      photoUrls,
    };
  }, [
    injuredCount,
    consciousness,
    breathing,
    bleeding,
    suspectedMajorInjury,
    trappedInVehicle,
    additionalNotes,
    photoUrls,
  ]);

  const liveEvaluation = useMemo(() => {
    return evaluateSeverity(previewObservations);
  }, [previewObservations]);

  if (!isOpen) return null;

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

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || `Accident Report @ Node ${locationNodeId}`;
    createIncident(finalTitle, locationNodeId, previewObservations);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Report New Incident</h2>
              <p className="text-xs text-slate-500">
                Rule-based deterministic emergency triage & routing intake
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Real-time Triage Banner */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Deterministic Rule Evaluation (Live Preview)
              </span>
              <div className="flex items-center gap-2">
                <SeverityBadge severity={liveEvaluation.severity} />
                <span className="text-xs text-slate-600 font-medium">
                  {liveEvaluation.reasons[0] || 'Awaiting clinical observations'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-semibold">
                Mandatory Destination:
              </span>
              <span className="text-xs font-bold text-blue-700 capitalize">
                {liveEvaluation.requiredFacilityType.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Incident Title */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Incident Title / Call Descriptor
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Rollover accident with vehicle intrusion"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Accident Location Node */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Accident Location (City Intersection)
              </label>
              <select
                value={locationNodeId}
                onChange={(e) => setLocationNodeId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              >
                {network.nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    [{node.id}] {node.name} ({node.zone || 'Zone'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clinical Triage Form Inputs */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Standardized Triage Observations
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Number of Injured */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Victims / Injured Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={injuredCount}
                  onChange={(e) => setInjuredCount(parseInt(e.target.value) || 1)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Consciousness */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Consciousness Status
                </label>
                <select
                  value={consciousness}
                  onChange={(e) => setConsciousness(e.target.value as ConsciousnessStatus)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="conscious">Conscious (Alert)</option>
                  <option value="semi-conscious">Semi-Conscious (Confused)</option>
                  <option value="unconscious">Unconscious (Unresponsive) [CRITICAL]</option>
                </select>
              </div>

              {/* Breathing Status */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Respiration / Breathing
                </label>
                <select
                  value={breathing}
                  onChange={(e) => setBreathing(e.target.value as BreathingStatus)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="normal">Normal Respiration</option>
                  <option value="difficult">Labored / Difficult [SEVERE]</option>
                  <option value="absent">Absent / Compromised [CRITICAL]</option>
                </select>
              </div>

              {/* Bleeding Status */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Visible Bleeding Severity
                </label>
                <select
                  value={bleeding}
                  onChange={(e) => setBleeding(e.target.value as BleedingStatus)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="none">No Significant Bleeding</option>
                  <option value="controlled">Controlled (Bandaged) [MODERATE]</option>
                  <option value="severe_uncontrolled">Severe / Uncontrolled [CRITICAL]</option>
                </select>
              </div>
            </div>

            {/* Checkbox Triggers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={suspectedMajorInjury}
                  onChange={(e) => setSuspectedMajorInjury(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Suspected Major / Polytrauma
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Suspected head, spinal, cervical spine, or blunt chest trauma.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={trappedInVehicle}
                  onChange={(e) => setTrappedInVehicle(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Victim Trapped in Vehicle [CRITICAL]
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Requires mechanical extrication or jaws of life.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Dispatcher / Responder Observations & Notes
            </label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Hazardous materials spill reported, oncoming traffic partially restricted..."
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Scene Photographs Section */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-700">Scene Photographs (Supporting Evidence)</h4>
                <p className="text-[11px] text-slate-500">
                  Images provide visual reference for human responders only and do not alter deterministic triage rules.
                </p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Upload Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Photo Previews */}
            {photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {photoUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shadow-sm group"
                  >
                    <img
                      src={url}
                      alt={`Scene Evidence #${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition shadow"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Register & Compute Route</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
