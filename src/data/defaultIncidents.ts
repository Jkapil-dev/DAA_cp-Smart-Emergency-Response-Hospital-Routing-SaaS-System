import { Incident } from '../types/incident';
import { evaluateSeverity } from '../engine/severityEngine';

const initialObs1 = {
  injuredCount: 2,
  consciousness: 'unconscious' as const,
  breathing: 'difficult' as const,
  bleeding: 'severe_uncontrolled' as const,
  suspectedMajorInjury: true,
  trappedInVehicle: true,
  additionalNotes: 'Two-car high-speed collision on Highway 101 interchange. Driver trapped in crushed sedan, unresponsive.',
  photoUrls: ['https://images.unsplash.com/photo-1543465077-db45d34b88a5?auto=format&fit=crop&w=400&q=80'],
};

const initialObs2 = {
  injuredCount: 1,
  consciousness: 'conscious' as const,
  breathing: 'normal' as const,
  bleeding: 'controlled' as const,
  suspectedMajorInjury: false,
  trappedInVehicle: false,
  additionalNotes: 'Motorcycle low-speed spill near intersection. Deep leg laceration, pressure applied, alert and oriented.',
  photoUrls: [],
};

const initialObs3 = {
  injuredCount: 1,
  consciousness: 'conscious' as const,
  breathing: 'normal' as const,
  bleeding: 'none' as const,
  suspectedMajorInjury: false,
  trappedInVehicle: false,
  additionalNotes: 'Pedestrian sprained ankle on curb near Harbor crossing. Ambulatory with limp, vitals normal.',
  photoUrls: [],
};

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-081',
    title: 'High-Speed Collision at Hwy 101 North',
    locationNodeId: 'N-07',
    reportedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    stage: 'en_route_scene',
    initialObservations: initialObs1,
    currentObservations: initialObs1,
    severityEvaluation: evaluateSeverity(initialObs1),
    assignedAmbulanceId: 'AMB-101',
    provisionalHospitalId: 'HOSP-TRAUMA-1',
    capacityOverrideConfirmed: false,
    notesHistory: [
      {
        timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
        note: '911 call received: caller reports rollover with entrapment and heavy smoke.',
        author: 'Dispatch Operator #4',
      },
      {
        timestamp: new Date(Date.now() - 9 * 60000).toISOString(),
        note: 'Medic 1 dispatched with ALS capability. ETA 2.5 mins.',
        author: 'Automated Dispatch',
      },
    ],
  },
  {
    id: 'INC-2026-082',
    title: 'Motorcycle Spill at Civic Center Cross',
    locationNodeId: 'N-08',
    reportedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    stage: 'reported',
    initialObservations: initialObs2,
    currentObservations: initialObs2,
    severityEvaluation: evaluateSeverity(initialObs2),
    notesHistory: [
      {
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        note: 'Incident registered from bystander report. Moderate bleeding controlled with tourniquet.',
        author: 'Dispatch Operator #2',
      },
    ],
  },
  {
    id: 'INC-2026-083',
    title: 'Ankle Trauma at Harbor Crossing',
    locationNodeId: 'N-03',
    reportedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    stage: 'destination_confirmed',
    initialObservations: initialObs3,
    currentObservations: initialObs3,
    severityEvaluation: evaluateSeverity(initialObs3),
    assignedAmbulanceId: 'AMB-103',
    provisionalHospitalId: 'CLINIC-EAST',
    confirmedHospitalId: 'CLINIC-EAST',
    notesHistory: [
      {
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        note: 'Transit 3 completed on-scene assessment: minor ankle sprain. Destination confirmed to Eastside Urgent Care.',
        author: 'Crew Chief Miller',
      },
    ],
  },
];

export function getInitialIncidents(): Incident[] {
  return JSON.parse(JSON.stringify(INITIAL_INCIDENTS));
}
