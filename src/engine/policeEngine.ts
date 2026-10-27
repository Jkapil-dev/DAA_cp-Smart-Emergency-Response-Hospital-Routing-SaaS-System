import { Incident } from '../types/incident';
import { CityNetwork } from '../types/graph';
import { PoliceAlert, TrafficIntervention } from '../types/police';

export function createPoliceAlertForIncident(
  incident: Incident,
  network: CityNetwork,
  ambulanceCallSign?: string
): PoliceAlert {
  const node = network.nodes.find((n) => n.id === incident.locationNodeId);
  const nodeName = node ? node.name : `Node ${incident.locationNodeId}`;
  const coordinates = node ? { x: node.x, y: node.y } : { x: 500, y: 300 };

  const isCritical = incident.severityEvaluation.severity === 'critical';
  const isSevere = incident.severityEvaluation.severity === 'severe';
  const trapped = incident.currentObservations.trappedInVehicle === true;

  let assistanceTypeRequested = 'Traffic Flow & Scene Safety';
  if (trapped) {
    assistanceTypeRequested = 'Corridor Priority & Heavy Rescue Extrication Perimeter';
  } else if (isCritical) {
    assistanceTypeRequested = 'Emergency Intersection Clearing & Signal Preemption';
  } else if (isSevere) {
    assistanceTypeRequested = 'Traffic Congestion Control & Hospital Transit Escort';
  }

  const alertId = `POL-ALERT-${incident.id.replace('INC-', '')}-${Math.floor(100 + Math.random() * 900)}`;

  return {
    id: alertId,
    incidentId: incident.id,
    timestamp: new Date().toISOString(),
    locationNodeId: incident.locationNodeId,
    nodeName,
    coordinates,
    severity: incident.severityEvaluation.severity,
    injuredCount: incident.currentObservations.injuredCount,
    entrapment: trapped,
    assistanceTypeRequested,
    ambulanceAssignedCallSign: ambulanceCallSign,
    status: 'delivered',
    interventions: [],
  };
}

export function generateTrafficControlIntervention(
  alert: PoliceAlert,
  type: TrafficIntervention['type'],
  targetLocation: string,
  officerId: string = 'Unit 404 (Traffic Division)'
): TrafficIntervention {
  const descriptions: Record<TrafficIntervention['type'], string> = {
    'Green Wave Preemption': `Automated signal timing synchronized along transit corridor approaching ${targetLocation}.`,
    'Road Closure Detour': `Temporary traffic cones and directional officers deployed around ${targetLocation} to reroute civilian traffic.`,
    'Intersection Clearing': `Manual officer intersection control active at ${targetLocation} for priority emergency vehicle passage.`,
    'Motorcycle Escort': `Two patrol motorcycles dispatched to escort emergency ambulance through heavy traffic into ${targetLocation}.`,
  };

  return {
    id: `INT-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`,
    timestamp: new Date().toISOString(),
    type,
    targetLocation,
    notes: descriptions[type] || `Simulated intervention executed at ${targetLocation}.`,
    officerId,
  };
}
