import {
  IncidentObservations,
  SeverityEvaluation,
  SeverityLevel,
} from '../types/incident';
import { ProvisionalResourceRequest } from '../types/hospital';

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
 * Unknown fields remain recorded as missingInformation and never default to negative.
 */
export function evaluateSeverity(observations: IncidentObservations): SeverityEvaluation {
  const triggeredCritical: string[] = [];
  const triggeredSevere: string[] = [];
  const triggeredModerate: string[] = [];
  const overrides: string[] = [];
  const missingInformation: string[] = [];

  // Identify unknown fields to preserve caller uncertainty
  if (observations.consciousness === 'unknown') {
    missingInformation.push('Consciousness state unknown / unconfirmed by caller');
  }
  if (observations.breathing === 'unknown') {
    missingInformation.push('Breathing adequacy unknown');
  }
  if (observations.bleeding === 'unknown') {
    missingInformation.push('Bleeding severity unobserved');
  }
  if (observations.suspectedMajorInjury === 'unknown') {
    missingInformation.push('Major trauma presence unverified');
  }
  if (observations.trappedInVehicle === 'unknown') {
    missingInformation.push('Vehicle entrapment status unconfirmed');
  }

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

  // Manual review required if critical fields were unknown or multiple injuries with missing vitals
  const requiresManualReview =
    missingInformation.length >= 2 ||
    (finalSeverity === 'minor' && missingInformation.length > 0);

  return {
    severity: finalSeverity,
    reasons: decisiveReasons,
    overrides,
    missingInformation,
    requiresManualReview,
    requiredFacilityType,
    requiresALSAmbulance,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Deterministic calculation of provisional hospital support resources requested
 * based on severity level, casualties count, and reported signs.
 */
export function calculateProvisionalResourceRequest(
  severity: SeverityLevel,
  injuredCount: number,
  observations: IncidentObservations
): ProvisionalResourceRequest {
  const count = Math.max(1, injuredCount || 1);

  if (severity === 'critical') {
    return {
      bedsRequested: count,
      icuBedsRequested: Math.min(count, 2),
      bloodUnitsRequested: observations.bleeding === 'severe_uncontrolled' ? 4 : 2,
      traumaBayRequired: true,
      reason: `Provisional Level 1 trauma alert: ${count} critical patient(s). Immediate trauma bay preparation and blood cross-match requested.`,
    };
  }

  if (severity === 'severe') {
    return {
      bedsRequested: count,
      icuBedsRequested: 1,
      bloodUnitsRequested: observations.bleeding === 'severe_uncontrolled' ? 2 : 0,
      traumaBayRequired: true,
      reason: `Provisional trauma admission: ${count} severe patient(s). Surgical observation bed and resuscitation readiness requested.`,
    };
  }

  if (severity === 'moderate') {
    return {
      bedsRequested: count,
      icuBedsRequested: 0,
      bloodUnitsRequested: 0,
      traumaBayRequired: false,
      reason: `General emergency admission: ${count} moderate patient(s). Standard ED acute care bed and diagnostic radiology requested.`,
    };
  }

  return {
    bedsRequested: 1,
    icuBedsRequested: 0,
    bloodUnitsRequested: 0,
    traumaBayRequired: false,
    reason: `Outpatient urgent care slot: 1 minor casualty. Basic assessment and wound treatment requested.`,
  };
}
