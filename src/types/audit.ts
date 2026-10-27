export type AuditCategory =
  | 'incident'
  | 'triage_severity'
  | 'grid_discovery'
  | 'dispatch'
  | 'driver_action'
  | 'hospital_coordination'
  | 'police_traffic'
  | 'routing';

export interface AuditEvent {
  id: string;
  timestamp: string;
  incidentId?: string;
  category: AuditCategory;
  action: string;
  actor: string; // e.g. "RuleEngine", "GridDiscoveryEngine", "Driver Unit AMB-101", "Hospital St. Jude", "Police Officer"
  input: Record<string, any>;
  outcome: string;
  reason: string;
}
