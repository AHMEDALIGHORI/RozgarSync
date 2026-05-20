// @ts-nocheck
// ============================================================================
// RozgarSync â€” UpskillingCoach: Course & Skill Gap Engine
// ============================================================================

import type { ServiceCategory, SkillProfile } from '@/types';
import type { AgentTool } from '../core/types';

// ============================================================================
// TYPES
// ============================================================================

export interface Course {
  readonly id: string;
  readonly title: string;
  readonly titleUrdu: string;
  readonly category: ServiceCategory;
  readonly targetSkill: string;
  readonly durationHours: number;
  readonly provider: string; // TEVTA, NAVTTC, Coursera, etc.
  readonly url: string;
  readonly cost: number;
  readonly difficulty: 'beginner' | 'intermediate' | 'expert';
}

export interface SkillGapAnalysis {
  readonly gaps: string[];
  readonly recommendedCourses: Course[];
  readonly estimatedIncomeBoostPercentage: number;
  readonly rationale: string;
  readonly rationaleUrdu: string;
}

export interface CareerPathNode {
  readonly currentLevel: 'beginner' | 'intermediate' | 'expert';
  readonly nextLevel: 'beginner' | 'intermediate' | 'expert';
  readonly requiredSkills: string[];
  readonly averageWageIncrease: number;
}

// ============================================================================
// CATALOGS & PATHWAYS
// ============================================================================

const COURSE_CATALOG: Course[] = [
  {
    id: 'c-elec-1',
    title: 'Advanced Circuit Troubleshooting',
    titleUrdu: 'Ø§ÛŒÚˆÙˆØ§Ù†Ø³Úˆ Ø³Ø±Ú©Ù¹ Ù¹Ø±Ø¨Ù„ Ø´ÙˆÙ¹Ù†Ú¯',
    category: 'electrical',
    targetSkill: 'circuit_diagnostics',
    durationHours: 10,
    provider: 'TEVTA e-Learning',
    url: 'https://tevta.gop.pk/elearning/elec-adv',
    cost: 0,
    difficulty: 'intermediate',
  },
  {
    id: 'c-elec-2',
    title: 'Solar Panel Installation Certification',
    titleUrdu: 'Ø³ÙˆÙ„Ø± Ù¾ÛŒÙ†Ù„ Ú©ÛŒ ØªÙ†ØµÛŒØ¨ Ú©Ø§ Ø³Ø±Ù¹ÛŒÙÚ©ÛŒÙ¹',
    category: 'electrical',
    targetSkill: 'solar_installation',
    durationHours: 20,
    provider: 'NAVTTC',
    url: 'https://navttc.gov.pk/solar',
    cost: 0,
    difficulty: 'expert',
  },
  {
    id: 'c-plumb-1',
    title: 'Modern PPRC Pipe Welding',
    titleUrdu: 'Ø¬Ø¯ÛŒØ¯ Ù¾ÛŒ Ù¾ÛŒ Ø¢Ø± Ø³ÛŒ Ù¾Ø§Ø¦Ù¾ ÙˆÛŒÙ„ÚˆÙ†Ú¯',
    category: 'plumbing',
    targetSkill: 'pprc_welding',
    durationHours: 5,
    provider: 'TEVTA',
    url: 'https://tevta.gop.pk/plumb-pprc',
    cost: 0,
    difficulty: 'intermediate',
  },
  {
    id: 'c-ac-1',
    title: 'Inverter AC Repair Masterclass',
    titleUrdu: 'Ø§Ù†ÙˆØ±Ù¹Ø± Ø§Û’ Ø³ÛŒ Ú©ÛŒ Ù…Ø±Ù…Øª Ú©Ø§ Ù…Ø§Ø³Ù¹Ø± Ú©Ù„Ø§Ø³',
    category: 'ac_repair',
    targetSkill: 'inverter_pcb_repair',
    durationHours: 15,
    provider: 'RozgarSync Academy',
    url: '/academy/ac-inverter',
    cost: 0,
    difficulty: 'expert',
  },
  {
    id: 'c-soft-1',
    title: 'Customer Communication for Freelancers',
    titleUrdu: 'ÙØ±ÛŒ Ù„Ø§Ù†Ø³Ø±Ø² Ú©Û’ Ù„ÛŒÛ’ Ú©Ø³Ù¹Ù…Ø± Ú©Ù…ÛŒÙˆÙ†ÛŒÚ©ÛŒØ´Ù†',
    category: 'other',
    targetSkill: 'customer_service',
    durationHours: 2,
    provider: 'RozgarSync Academy',
    url: '/academy/soft-skills',
    cost: 0,
    difficulty: 'beginner',
  },
];

const SKILL_REQUIREMENTS: Record<ServiceCategory, Record<'intermediate' | 'expert', string[]>> = {
  electrical: {
    intermediate: ['wiring', 'circuit_diagnostics', 'customer_service'],
    expert: ['circuit_diagnostics', 'solar_installation', '3_phase_wiring'],
  },
  ac_repair: {
    intermediate: ['gas_refill', 'split_ac_service', 'customer_service'],
    expert: ['inverter_pcb_repair', 'chiller_plants'],
  },
  plumbing: {
    intermediate: ['pipe_fitting', 'pprc_welding', 'customer_service'],
    expert: ['geyser_repair', 'water_motor_winding'],
  },
  carpentry: {
    intermediate: ['furniture_repair', 'door_fitting', 'customer_service'],
    expert: ['custom_wardrobes', 'wood_polish'],
  },
  painting: {
    intermediate: ['wall_painting', 'distemper', 'customer_service'],
    expert: ['weather_sheet', 'texture_painting'],
  },
  moving: {
    intermediate: ['packing', 'loading', 'customer_service'],
    expert: ['heavy_machinery_moving'],
  },
  driving: {
    intermediate: ['htv_license', 'customer_service'],
    expert: ['heavy_trailer', 'defensive_driving'],
  },
  mobile_repair: {
    intermediate: ['screen_replacement', 'battery_change', 'customer_service'],
    expert: ['ic_reballing', 'water_damage_recovery'],
  },
  cleaning: {
    intermediate: ['deep_cleaning', 'customer_service'],
    expert: ['sofa_carpet_cleaning'],
  },
  cooking: {
    intermediate: ['local_cuisine', 'hygiene'],
    expert: ['catering', 'baking'],
  },
  tailoring: {
    intermediate: ['stitching', 'alteration'],
    expert: ['designer_wear', 'embroidery'],
  },
  tutoring: {
    intermediate: ['primary_subjects', 'communication'],
    expert: ['o_a_levels', 'mdcat_prep'],
  },
  beauty: {
    intermediate: ['hair_styling', 'makeup'],
    expert: ['bridal_makeup', 'skin_treatment'],
  },
  gardening: {
    intermediate: ['lawn_maintenance', 'planting'],
    expert: ['landscape_design', 'grafting'],
  },
  other: {
    intermediate: ['customer_service'],
    expert: [],
  },
};

// ============================================================================
// ANALYSIS ENGINE
// ============================================================================

/**
 * Identify missing skills for the next career level and recommend courses.
 */
export function analyzeSkillGaps(
  category: ServiceCategory,
  currentSkills: SkillProfile[],
  currentLevel: 'beginner' | 'intermediate' | 'expert'
): SkillGapAnalysis {
  // If already expert, focus on cross-skilling or soft skills
  if (currentLevel === 'expert') {
    const softSkillMissing = !currentSkills.some(s => s.name === 'customer_service');
    const courses = COURSE_CATALOG.filter(c => c.targetSkill === 'customer_service');
    
    if (softSkillMissing) {
      return {
        gaps: ['customer_service'],
        recommendedCourses: courses,
        estimatedIncomeBoostPercentage: 5,
        rationale: 'As an expert, improving customer communication can lead to better reviews and higher tips.',
        rationaleUrdu: 'Ø§ÛŒÚ© Ù…Ø§ÛØ± Ú©Û’ Ø·ÙˆØ± Ù¾Ø±ØŒ Ú©Ø³Ù¹Ù…Ø± Ú©Ù…ÛŒÙˆÙ†ÛŒÚ©ÛŒØ´Ù† Ú©Ùˆ Ø¨ÛØªØ± Ø¨Ù†Ø§Ù†Û’ Ø³Û’ Ø¨ÛØªØ± Ø¬Ø§Ø¦Ø²Û’ Ø§ÙˆØ± Ø²ÛŒØ§Ø¯Û Ù¹Ù¾Ø³ Ù…Ù„ Ø³Ú©ØªÛŒ ÛÛŒÚºÛ”',
      };
    }
    
    return {
      gaps: [],
      recommendedCourses: [],
      estimatedIncomeBoostPercentage: 0,
      rationale: 'You are at the top level for your category.',
      rationaleUrdu: 'Ø¢Ù¾ Ø§Ù¾Ù†ÛŒ Ú©ÛŒÙ¹ÛŒÚ¯Ø±ÛŒ Ù…ÛŒÚº Ø§Ø¹Ù„ÛŒÙ° ØªØ±ÛŒÙ† Ø³Ø·Ø­ Ù¾Ø± ÛÛŒÚºÛ”',
    };
  }

  // Determine next level requirements
  const nextLevel = currentLevel === 'beginner' ? 'intermediate' : 'expert';
  const requiredSkills = SKILL_REQUIREMENTS[category][nextLevel] || [];
  
  // Find gaps
  const currentSkillNames = new Set(currentSkills.map(s => s.name));
  const gaps = requiredSkills.filter(skill => !currentSkillNames.has(skill));
  
  if (gaps.length === 0) {
    return {
      gaps: [],
      recommendedCourses: [],
      estimatedIncomeBoostPercentage: 0,
      rationale: 'You have the skills needed to level up. Complete more gigs to increase your experience rating.',
      rationaleUrdu: 'Ø¢Ù¾ Ú©Û’ Ù¾Ø§Ø³ Ø§Ú¯Ù„ÛŒ Ø³Ø·Ø­ Ú©Û’ Ù„ÛŒÛ’ Ø¯Ø±Ú©Ø§Ø± Ù…ÛØ§Ø±ØªÛŒÚº ÛÛŒÚºÛ” Ø§Ù¾Ù†Û’ ØªØ¬Ø±Ø¨Û’ Ú©ÛŒ Ø±ÛŒÙ¹Ù†Ú¯ Ø¨Ú‘Ú¾Ø§Ù†Û’ Ú©Û’ Ù„ÛŒÛ’ Ù…Ø²ÛŒØ¯ Ú¯Ú¯Ø³ Ù…Ú©Ù…Ù„ Ú©Ø±ÛŒÚºÛ”',
    };
  }

  // Find relevant courses
  const recommendedCourses = COURSE_CATALOG.filter(c => 
    (c.category === category || c.category === 'other') && gaps.includes(c.targetSkill)
  );

  // Estimate boost
  const estimatedIncomeBoostPercentage = nextLevel === 'intermediate' ? 15 : 30;

  const rationale = `To reach ${nextLevel} level and earn ~${estimatedIncomeBoostPercentage}% more, you need: ${gaps.join(', ')}.`;
  const rationaleUrdu = `Ø§Ú¯Ù„ÛŒ Ø³Ø·Ø­ ØªÚ© Ù¾ÛÙ†Ú†Ù†Û’ Ø§ÙˆØ± ~${estimatedIncomeBoostPercentage}% Ø²ÛŒØ§Ø¯Û Ú©Ù…Ø§Ù†Û’ Ú©Û’ Ù„ÛŒÛ’ØŒ Ø¢Ù¾ Ú©Ùˆ Ø¯Ø±Ú©Ø§Ø± ÛÛ’: ${gaps.join(', ')}Û”`;

  return {
    gaps,
    recommendedCourses,
    estimatedIncomeBoostPercentage,
    rationale,
    rationaleUrdu,
  };
}

// ============================================================================
// TOOLS
// ============================================================================

export function createSkillGapAnalysisTool(): AgentTool<
  { category: ServiceCategory; currentSkills: SkillProfile[]; currentLevel: 'beginner' | 'intermediate' | 'expert' },
  SkillGapAnalysis
> {
  return {
    name: 'analyze_skill_gaps',
    description: 'Analyze worker skills against category requirements and recommend courses to level up.',
    execute: async (input) => analyzeSkillGaps(input.category, input.currentSkills, input.currentLevel),
  };
}

