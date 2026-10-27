import { SeverityLevel } from './incident';

export type PoliceAlertStatus = 'queued' | 'delivered' | 'acknowledged' | 'intervention_active' | 'resolved';

export interface TrafficIntervention {
  id: string;
  timestamp: string;
  type: 'Green Wave Preemption' | 'Road Closure Detour' | 'Intersection Clearing' | 'Motorcycle Escort';
  targetLocation: string;
  notes: string;
  officerId: string;
}

export interface PoliceAlert {
  id: string;
  incidentId: string;
  timestamp: string;
  locationNodeId: string;
  nodeName: string;
  coordinates: { x: number; y: number };
  severity: SeverityLevel;
  injuredCount: number;
  entrapment: boolean;
  assistanceTypeRequested: string;
  ambulanceAssignedCallSign?: string;
  status: PoliceAlertStatus;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  interventions: TrafficIntervention[];
  trafficCongestionWarning?: string;
}
