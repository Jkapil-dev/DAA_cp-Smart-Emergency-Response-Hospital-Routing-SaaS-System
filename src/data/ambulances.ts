import { Ambulance } from '../types/ambulance';

export const INITIAL_AMBULANCES: Ambulance[] = [
  {
    id: 'AMB-101',
    callSign: 'Medic 1',
    type: 'ALS',
    currentNodeId: 'N-02',
    status: 'available',
    crewSummary: 'Lead Paramedic + Critical Care EMT',
    capabilities: [
      'Advanced Airway Management / Rapid Intubation',
      'Cardiopulmonary Resuscitation & Defibrillation',
      'Emergency IV/IO Access & Critical Meds',
      'Advanced Spinal Immobilization',
    ],
    equipment: [
      'Portable Ventilator',
      '12-Lead Cardiac Defibrillator / Monitor',
      'Surgical Airway & Trauma Kit',
      'Lucas Mechanical CPR Device',
      'Suction & Oxygen Tanks',
    ],
  },
  {
    id: 'AMB-102',
    callSign: 'Rescue 2',
    type: 'ALS',
    currentNodeId: 'N-10',
    status: 'dispatched', // Occupied on another incident
    crewSummary: 'Paramedic + EMT',
    capabilities: [
      'Advanced Airway Management',
      'Cardiac Monitoring',
      'Trauma Resuscitation',
    ],
    equipment: [
      'Cardiac Monitor',
      'Ventilator',
      'Extrication Spine Board',
    ],
    currentIncidentId: 'INC-ACTIVE-PREV',
  },
  {
    id: 'AMB-103',
    callSign: 'Transit 3',
    type: 'BLS',
    currentNodeId: 'N-03',
    status: 'available',
    crewSummary: '2x Certified Emergency Medical Technicians (EMT-Basic)',
    capabilities: [
      'Basic Life Support & Wound Management',
      'Automated External Defibrillation (AED)',
      'Oxygen Administration',
      'Fracture Splinting & Patient Transport',
    ],
    equipment: [
      'Automated External Defibrillator (AED)',
      'Oxygen Cylinders & Bag-Valve Masks',
      'Extrication Collar & Splints',
      'Basic Trauma Dressings',
    ],
  },
  {
    id: 'AMB-104',
    callSign: 'Medic 4',
    type: 'ALS',
    currentNodeId: 'N-16',
    status: 'available',
    crewSummary: '2x Trauma Paramedics',
    capabilities: [
      'Advanced Trauma Resuscitation',
      'Surgical Cricothyrotomy',
      'Chest Decompression Kit',
      'Blood Transfusion Warming Equipment',
    ],
    equipment: [
      'Ventilator & Oxygen System',
      'Multi-Parameter Defibrillator',
      'Advanced Hemostatic Gauze & Tourniquets',
      'Vacuum Spine Immobilizer',
    ],
  },
];

export function getInitialAmbulances(): Ambulance[] {
  return JSON.parse(JSON.stringify(INITIAL_AMBULANCES));
}
