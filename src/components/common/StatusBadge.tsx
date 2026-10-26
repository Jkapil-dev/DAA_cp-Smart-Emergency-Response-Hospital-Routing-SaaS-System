import React from 'react';
import { DispatchStage } from '../../types/incident';
import { AmbulanceStatus } from '../../types/ambulance';

export const StageBadge: React.FC<{ stage: DispatchStage }> = ({ stage }) => {
  const configs: Record<DispatchStage, { label: string; style: string }> = {
    reported: { label: 'Incident Reported', style: 'bg-slate-100 text-slate-700 border-slate-300' },
    ambulance_assigned: { label: 'Ambulance Assigned', style: 'bg-blue-50 text-blue-700 border-blue-300' },
    en_route_scene: { label: 'En Route to Scene', style: 'bg-indigo-50 text-indigo-700 border-indigo-300' },
    scene_arrived: { label: 'On Scene', style: 'bg-purple-50 text-purple-700 border-purple-300' },
    assessment_updated: { label: 'Assessment Updated', style: 'bg-amber-50 text-amber-700 border-amber-300' },
    destination_confirmed: { label: 'Destination Confirmed', style: 'bg-teal-50 text-teal-700 border-teal-300' },
    en_route_hospital: { label: 'En Route to Hospital', style: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
    completed: { label: 'Completed / Handover', style: 'bg-slate-100 text-slate-600 border-slate-200' },
  };

  const item = configs[stage] || { label: stage, style: 'bg-slate-100 text-slate-700 border-slate-300' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {item.label}
    </span>
  );
};

export const AmbulanceStatusBadge: React.FC<{ status: AmbulanceStatus }> = ({ status }) => {
  const configs: Record<AmbulanceStatus, { label: string; style: string }> = {
    available: { label: 'Available', style: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    dispatched: { label: 'Dispatched', style: 'bg-blue-50 text-blue-700 border-blue-300' },
    en_route_scene: { label: 'En Route Scene', style: 'bg-indigo-50 text-indigo-700 border-indigo-300' },
    on_scene: { label: 'On Scene', style: 'bg-amber-50 text-amber-700 border-amber-300' },
    transporting: { label: 'Transporting', style: 'bg-teal-50 text-teal-700 border-teal-300' },
    maintenance: { label: 'Maintenance', style: 'bg-slate-100 text-slate-600 border-slate-300' },
  };

  const item = configs[status] || { label: status, style: 'bg-slate-100 text-slate-600 border-slate-300' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${item.style}`}>
      {item.label}
    </span>
  );
};
