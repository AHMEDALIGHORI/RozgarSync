// @ts-nocheck
// ============================================================================
// RozgarSync â€” SafetyGuardian Agent: SOS Protocol
// ============================================================================

import type { GeoPoint } from '@/types';
import type { AgentTool, BilingualText } from '../core/types';

// ============================================================================
// TYPES
// ============================================================================

export type SOSSeverity = 'low' | 'medium' | 'high' | 'critical';
export type SOSAction = 'acknowledge' | 'dispatch' | 'escalate';

export interface SOSRequest {
  readonly workerId: string;
  readonly workerName: string;
  readonly workerPhone: string;
  readonly gigId: string;
  readonly employerId: string;
  readonly location: GeoPoint;
  readonly emergencyType: SOSEmergencyType;
  readonly description?: string;
  readonly timestamp: string;
}

export type SOSEmergencyType =
  | 'physical_threat'
  | 'workplace_accident'
  | 'harassment'
  | 'non_payment_threat'
  | 'equipment_failure'
  | 'medical'
  | 'other';

export interface SOSAssessment {
  readonly severity: SOSSeverity;
  readonly action: SOSAction;
  readonly escalationTimeMinutes: number;
  readonly contacts: EmergencyContact[];
  readonly instructions: BilingualText;
  readonly autoActions: string[];
}

export interface EmergencyContact {
  readonly name: string;
  readonly role: 'police' | 'rescue' | 'platform_support' | 'employer' | 'trusted_contact';
  readonly phone: string;
  readonly priority: number;
}

// ============================================================================
// SEVERITY CLASSIFICATION
// ============================================================================

/** Emergency type â†’ base severity mapping. */
const EMERGENCY_SEVERITY: Record<SOSEmergencyType, SOSSeverity> = {
  physical_threat: 'critical',
  workplace_accident: 'high',
  harassment: 'high',
  medical: 'critical',
  equipment_failure: 'medium',
  non_payment_threat: 'low',
  other: 'medium',
};

/** Escalation timelines by severity. */
const ESCALATION_TIMELINE: Record<SOSSeverity, number> = {
  critical: 0,    // Immediate
  high: 5,        // 5 minutes
  medium: 15,     // 15 minutes
  low: 30,        // 30 minutes
};

// ============================================================================
// PAKISTAN EMERGENCY CONTACTS
// ============================================================================

const PAKISTAN_EMERGENCY_CONTACTS: EmergencyContact[] = [
  { name: 'Police Emergency', role: 'police', phone: '15', priority: 1 },
  { name: 'Rescue 1122', role: 'rescue', phone: '1122', priority: 1 },
  { name: 'Edhi Foundation', role: 'rescue', phone: '115', priority: 2 },
  { name: 'RozgarSync Emergency Support', role: 'platform_support', phone: '+92-XXX-XXXXXXX', priority: 1 },
];

// ============================================================================
// SOS PROTOCOL LOGIC
// ============================================================================

/**
 * Classify SOS severity and determine response protocol.
 */
export function assessSOS(request: SOSRequest): SOSAssessment {
  const severity = EMERGENCY_SEVERITY[request.emergencyType];
  const escalationTimeMinutes = ESCALATION_TIMELINE[severity];

  // Determine action based on severity
  let action: SOSAction;
  switch (severity) {
    case 'critical':
      action = 'escalate';
      break;
    case 'high':
      action = 'dispatch';
      break;
    case 'medium':
      action = 'dispatch';
      break;
    case 'low':
      action = 'acknowledge';
      break;
  }

  // Select relevant contacts based on emergency type
  const contacts = selectContacts(request.emergencyType, severity);

  // Generate bilingual safety instructions
  const instructions = generateInstructions(request.emergencyType, severity);

  // Determine auto-actions
  const autoActions = determineAutoActions(severity, request.emergencyType);

  return {
    severity,
    action,
    escalationTimeMinutes,
    contacts,
    instructions,
    autoActions,
  };
}

/**
 * Select and prioritize emergency contacts based on emergency type.
 */
function selectContacts(emergencyType: SOSEmergencyType, severity: SOSSeverity): EmergencyContact[] {
  const contacts: EmergencyContact[] = [
    // Platform support is always included
    ...PAKISTAN_EMERGENCY_CONTACTS.filter(c => c.role === 'platform_support'),
  ];

  switch (emergencyType) {
    case 'physical_threat':
    case 'harassment':
      contacts.push(...PAKISTAN_EMERGENCY_CONTACTS.filter(c => c.role === 'police'));
      break;
    case 'workplace_accident':
    case 'medical':
      contacts.push(...PAKISTAN_EMERGENCY_CONTACTS.filter(c => c.role === 'rescue'));
      break;
    case 'equipment_failure':
    case 'non_payment_threat':
    case 'other':
      // Platform support handles these
      break;
  }

  // Critical severity â†’ all emergency contacts
  if (severity === 'critical') {
    return PAKISTAN_EMERGENCY_CONTACTS.sort((a, b) => a.priority - b.priority);
  }

  return contacts.sort((a, b) => a.priority - b.priority);
}

/**
 * Generate bilingual safety instructions.
 */
function generateInstructions(emergencyType: SOSEmergencyType, severity: SOSSeverity): BilingualText {
  const urgencyPrefix = severity === 'critical'
    ? { en: 'âš ï¸ CRITICAL EMERGENCY: ', ur: 'âš ï¸ Ù†Ø§Ø²Ú© Ø§ÛŒÙ…Ø±Ø¬Ù†Ø³ÛŒ: ' }
    : { en: '', ur: '' };

  const instructionMap: Record<SOSEmergencyType, BilingualText> = {
    physical_threat: {
      en: `${urgencyPrefix.en}Move to a safe location immediately. Do not confront the threat. Call 15 (Police). Stay on the line until help arrives.`,
      ur: `${urgencyPrefix.ur}ÙÙˆØ±ÛŒ Ø·ÙˆØ± Ù¾Ø± Ù…Ø­ÙÙˆØ¸ Ù…Ù‚Ø§Ù… Ù¾Ø± Ø¬Ø§Ø¦ÛŒÚºÛ” Ø®Ø·Ø±Û’ Ú©Ø§ Ù…Ù‚Ø§Ø¨Ù„Û Ù†Û Ú©Ø±ÛŒÚºÛ” 15 (Ù¾ÙˆÙ„ÛŒØ³) Ú©Ùˆ ÙÙˆÙ† Ú©Ø±ÛŒÚºÛ” Ù…Ø¯Ø¯ Ø¢Ù†Û’ ØªÚ© Ù„Ø§Ø¦Ù† Ù¾Ø± Ø±ÛÛŒÚºÛ”`,
    },
    workplace_accident: {
      en: `${urgencyPrefix.en}Do not move if injured. Call 1122 (Rescue). Apply first aid if possible. Wait for emergency services.`,
      ur: `${urgencyPrefix.ur}Ø§Ú¯Ø± Ø²Ø®Ù…ÛŒ ÛÛŒÚº ØªÙˆ Ø­Ø±Ú©Øª Ù†Û Ú©Ø±ÛŒÚºÛ” 1122 (Ø±ÛŒØ³Ú©ÛŒÙˆ) Ú©Ùˆ ÙÙˆÙ† Ú©Ø±ÛŒÚºÛ” Ø§Ú¯Ø± Ù…Ù…Ú©Ù† ÛÙˆ ØªÙˆ ÙØ±Ø³Ù¹ Ø§ÛŒÚˆ Ø¯ÛŒÚºÛ” Ø§ÛŒÙ…Ø±Ø¬Ù†Ø³ÛŒ Ø³Ø±ÙˆØ³Ø² Ú©Ø§ Ø§Ù†ØªØ¸Ø§Ø± Ú©Ø±ÛŒÚºÛ”`,
    },
    harassment: {
      en: `${urgencyPrefix.en}Leave the location if safe to do so. Document the incident. Call 15 (Police). Contact RozgarSync support immediately.`,
      ur: `${urgencyPrefix.ur}Ø§Ú¯Ø± Ù…Ø­ÙÙˆØ¸ ÛÙˆ ØªÙˆ Ù…Ù‚Ø§Ù… Ú†Ú¾ÙˆÚ‘ Ø¯ÛŒÚºÛ” ÙˆØ§Ù‚Ø¹Û’ Ú©Ùˆ Ø±ÛŒÚ©Ø§Ø±Úˆ Ú©Ø±ÛŒÚºÛ” 15 (Ù¾ÙˆÙ„ÛŒØ³) Ú©Ùˆ Ú©Ø§Ù„ Ú©Ø±ÛŒÚºÛ” ÙÙˆØ±ÛŒ Ø·ÙˆØ± Ù¾Ø± Ø±ÙˆØ²Ú¯Ø§Ø± Ø³Ù†Ú© Ø³Ù¾ÙˆØ±Ù¹ Ø³Û’ Ø±Ø§Ø¨Ø·Û Ú©Ø±ÛŒÚºÛ”`,
    },
    medical: {
      en: `${urgencyPrefix.en}Call 1122 (Rescue) or 115 (Edhi) immediately. Describe your symptoms. Stay calm and wait for help.`,
      ur: `${urgencyPrefix.ur}ÙÙˆØ±ÛŒ Ø·ÙˆØ± Ù¾Ø± 1122 (Ø±ÛŒØ³Ú©ÛŒÙˆ) ÛŒØ§ 115 (Ø§ÛŒØ¯Ú¾ÛŒ) Ú©Ùˆ Ú©Ø§Ù„ Ú©Ø±ÛŒÚºÛ” Ø§Ù¾Ù†ÛŒ Ø¹Ù„Ø§Ù…Ø§Øª Ø¨ÛŒØ§Ù† Ú©Ø±ÛŒÚºÛ” Ù¾Ø±Ø³Ú©ÙˆÙ† Ø±ÛÛŒÚº Ø§ÙˆØ± Ù…Ø¯Ø¯ Ú©Ø§ Ø§Ù†ØªØ¸Ø§Ø± Ú©Ø±ÛŒÚºÛ”`,
    },
    equipment_failure: {
      en: 'Stop work immediately. Move away from the equipment. Report to the employer. Contact RozgarSync support for dispute resolution.',
      ur: 'ÙÙˆØ±ÛŒ Ø·ÙˆØ± Ù¾Ø± Ú©Ø§Ù… Ø¨Ù†Ø¯ Ú©Ø±ÛŒÚºÛ” Ø¢Ù„Ø§Øª Ø³Û’ Ø¯ÙˆØ± ÛÙˆ Ø¬Ø§Ø¦ÛŒÚºÛ” Ø¢Ø¬Ø± Ú©Ùˆ Ø§Ø·Ù„Ø§Ø¹ Ø¯ÛŒÚºÛ” ØªÙ†Ø§Ø²Ø¹Ø§Øª Ú©Û’ Ø­Ù„ Ú©Û’ Ù„ÛŒÛ’ Ø±ÙˆØ²Ú¯Ø§Ø± Ø³Ù†Ú© Ø³Ù¾ÙˆØ±Ù¹ Ø³Û’ Ø±Ø§Ø¨Ø·Û Ú©Ø±ÛŒÚºÛ”',
    },
    non_payment_threat: {
      en: 'Do not escalate the situation. Document all communication. Contact RozgarSync support â€” we will mediate. Your escrow funds are protected.',
      ur: 'ØµÙˆØ±ØªØ­Ø§Ù„ Ú©Ùˆ Ù…Ø²ÛŒØ¯ Ø®Ø±Ø§Ø¨ Ù†Û Ú©Ø±ÛŒÚºÛ” ØªÙ…Ø§Ù… Ø¨Ø§Øª Ú†ÛŒØª Ø±ÛŒÚ©Ø§Ø±Úˆ Ú©Ø±ÛŒÚºÛ” Ø±ÙˆØ²Ú¯Ø§Ø± Ø³Ù†Ú© Ø³Ù¾ÙˆØ±Ù¹ Ø³Û’ Ø±Ø§Ø¨Ø·Û Ú©Ø±ÛŒÚº â€” ÛÙ… Ø«Ø§Ù„Ø«ÛŒ Ú©Ø±ÛŒÚº Ú¯Û’Û” Ø¢Ù¾ Ú©Û’ Ø§ÛŒØ³Ú©Ø±Ùˆ ÙÙ†ÚˆØ² Ù…Ø­ÙÙˆØ¸ ÛÛŒÚºÛ”',
    },
    other: {
      en: 'Contact RozgarSync support. Describe the situation in detail. We will respond within 15 minutes.',
      ur: 'Ø±ÙˆØ²Ú¯Ø§Ø± Ø³Ù†Ú© Ø³Ù¾ÙˆØ±Ù¹ Ø³Û’ Ø±Ø§Ø¨Ø·Û Ú©Ø±ÛŒÚºÛ” ØµÙˆØ±ØªØ­Ø§Ù„ Ú©ÛŒ ØªÙØµÛŒÙ„ Ø¨ÛŒØ§Ù† Ú©Ø±ÛŒÚºÛ” ÛÙ… 15 Ù…Ù†Ù¹ Ù…ÛŒÚº Ø¬ÙˆØ§Ø¨ Ø¯ÛŒÚº Ú¯Û’Û”',
    },
  };

  return instructionMap[emergencyType];
}

/**
 * Determine automated actions based on severity.
 */
function determineAutoActions(severity: SOSSeverity, emergencyType: SOSEmergencyType): string[] {
  const actions: string[] = ['log_incident', 'notify_platform_support'];

  if (severity === 'critical' || severity === 'high') {
    actions.push('freeze_gig', 'share_worker_location', 'notify_emergency_contacts');
  }

  if (emergencyType === 'physical_threat' || emergencyType === 'harassment') {
    actions.push('flag_employer_account', 'preserve_chat_evidence');
  }

  if (severity === 'critical') {
    actions.push('auto_escalate_to_admin', 'suspend_employer_pending_review');
  }

  return actions;
}

// ============================================================================
// TOOL FACTORY
// ============================================================================

/** Create the `trigger_sos_protocol` tool. */
export function createSOSProtocolTool(): AgentTool<SOSRequest, SOSAssessment> {
  return {
    name: 'trigger_sos_protocol',
    description: 'Classify SOS severity, select emergency contacts, and generate response protocol.',
    execute: async (input) => assessSOS(input),
  };
}

