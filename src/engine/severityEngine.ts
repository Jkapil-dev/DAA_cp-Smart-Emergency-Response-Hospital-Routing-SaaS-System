import {
  IncidentObservations,
  SeverityEvaluation,
  SeverityLevel,
} from '../types/incident';

export interface SeverityRule {
  id: string;
  level: SeverityLevel;
  description: string;
  condition: (obs: IncidentObservations) => boolean;
  priority: number; // 1 = highest (Critical), 2 = Severe, 3 = Moderate, 4 = Minor
}

export const SEVERITY_RULES: SeverityRule[] = [
  // --- CRITICAL RULES (Priority 1) ---
  {
    id: 'CRIT_UNCONSCIOUS',
    level: 'critical',
    priority: 1,
    description: 'Patient is unresponsive / unconscious (GCS compromised)',
    condition: (obs) => obs.consciousness === 'unconscious',
  },
  {
    id: 'CRIT_BREATHING_ABSENT',
    level: 'critical',
    priority: 1,
    description: 'Breathing is absent or severely compromised (Respiratory arrest risk)',
    condition: (obs) => obs.breathing === 'absent',
  },
  {
    id: 'CRIT_BLEEDING_UNCONTROLLED',
    level: 'critical',
    priority: 1,
    description: 'Uncontrolled heavy / arterial bleeding (Hemorrhagic shock risk)',
    condition: (obs) => obs.bleeding === 'severe_uncontrolled',
  },
  {
    id: 'CRIT_TRAPPED',
    level: 'critical',
    priority: 1,
    description: 'Victim is physically trapped inside vehicle (Prolonged extrication / crush injury risk)',
    condition: (obs) => obs.trappedInVehicle === true,
  },

  // --- SEVERE RULES (Priority 2) ---
  {
    id: 'SEV_SEMICONSCIOUS',
    level: 'severe',
    priority: 2,
    description: 'Altered mental status / semi-conscious state',
    condition: (obs) => obs.consciousness === 'semi-conscious',
  },
  {
    id: 'SEV_BREATHING_DIFFICULT',
    level: 'severe',
    priority: 2,
    description: 'Severe respiratory distress or labored breathing',
    condition: (obs) => obs.breathing === 'difficult',
  },
  {
    id: 'SEV_MAJOR_INJURY',
    level: 'severe',
    priority: 2,
    description: 'Suspected major trauma (Head, neck, spine, chest, or multi-system injury)',
    condition: (obs) => obs.suspectedMajorInjury === true,
  },
  {
    id: 'SEV_MASS_CASUALTY',
    level: 'severe',
    priority: 2,
    description: 'Three or more victims involved requiring advanced triage coordination',
    condition: (obs) => obs.injuredCount >= 3,
  },

  // --- MODERATE RULES (Priority 3) ---
  {
    id: 'MOD_CONTROLLED_BLEEDING',
    level: 'moderate',
    priority: 3,
    description: 'Controlled significant bleeding requiring surgical suturing / physician assessment',
    condition: (obs) => obs.bleeding === 'controlled',
  },
  {
    id: 'MOD_MULTIPLE_INJURED',
    level: 'moderate',
    priority: 3,
    description: 'Two injured persons requiring diagnostic evaluation and hospital admission screening',
    condition: (obs) => obs.injuredCount === 2,
  },

  // --- MINOR DEFAULT RULE (Priority 4) ---
  {
    id: 'MIN_SUPERFICIAL',
    level: 'minor',
    priority: 4,
    description: 'Conscious, normal respiration, no uncontrolled bleeding or major injury (outpatient or clinic suitable)',
    condition: () => true,
  },
];

/**
 * Deterministic rule-based evaluation of incident observations.
 * Critical rules strictly take precedence over lower-tier rules.
 * Photographs are strictly supporting visual evidence and do NOT affect severity.
 */
export function evaluateSeverity(observations: IncidentObservations): SeverityEvaluation {
  const triggeredCritical: string[] = [];
  const triggeredSevere: string[] = [];
  const triggeredModerate: string[] = [];
  const overrides: string[] = [];

  for (const rule of SEVERITY_RULES) {
    if (rule.priority === 1 && rule.condition(observations)) {
      triggeredCritical.push(rule.description);
    } else if (rule.priority === 2 && rule.condition(observations)) {
      triggeredSevere.push(rule.description);
    } else if (rule.priority === 3 && rule.condition(observations)) {
      triggeredModerate.push(rule.description);
    }
  }

  let finalSeverity: SeverityLevel = 'minor';
  let decisiveReasons: string[] = [];

  if (triggeredCritical.length > 0) {
    finalSeverity = 'critical';
    decisiveReasons = triggeredCritical;

    if (triggeredSevere.length > 0) {
      overrides.push(`Critical status overrode severe secondary indicators (${triggeredSevere.length} indicators)`);
    }
    if (triggeredModerate.length > 0) {
      overrides.push(`Critical status overrode moderate indicators (${triggeredModerate.length} indicators)`);
    }
  } else if (triggeredSevere.length > 0) {
    finalSeverity = 'severe';
    decisiveReasons = triggeredSevere;

    if (triggeredModerate.length > 0) {
      overrides.push(`Severe status overrode moderate indicators (${triggeredModerate.length} indicators)`);
    }
  } else if (triggeredModerate.length > 0) {
    finalSeverity = 'moderate';
    decisiveReasons = triggeredModerate;
  } else {
    finalSeverity = 'minor';
    decisiveReasons = ['All vital signs stable; single casualty with superficial or minor complaints. Suitable for outpatient clinic.'];
  }

  // Facility and equipment requirements based on deterministic triage level
  const requiredFacilityType =
    finalSeverity === 'critical' || finalSeverity === 'severe'
      ? 'trauma_center'
      : finalSeverity === 'moderate'
      ? 'general_hospital'
      : 'clinic';

  const requiresALSAmbulance = finalSeverity === 'critical' || finalSeverity === 'severe';

  return {
    severity: finalSeverity,
    reasons: decisiveReasons,
    overrides,
    requiredFacilityType,
    requiresALSAmbulance,
    timestamp: new Date().toISOString(),
  };
}
