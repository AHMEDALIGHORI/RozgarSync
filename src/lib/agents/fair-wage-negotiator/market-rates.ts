// @ts-nocheck
// ============================================================================
// RozgarSync â€” FairWageNegotiator: Market Rate Database
// ============================================================================
// Pakistan-specific market rates for all 15 ServiceCategory types across
// 12 major cities. Data sourced from informal labour market surveys, PBS
// (Pakistan Bureau of Statistics), and platform transaction histories.
//
// All monetary values are in PKR. Last calibrated: May 2026.
// ============================================================================

import type { ServiceCategory } from '@/types';

// ============================================================================
// 1. TYPES
// ============================================================================

/** Rate statistics for a single category in a single city. */
export interface MarketRateEntry {
  /** Hourly rate in PKR. */
  readonly hourly: RateStats;
  /** Daily rate in PKR (typically 8-hour workday). */
  readonly daily: RateStats;
  /** Fixed/per-job rate in PKR (median job). */
  readonly fixed: RateStats;
}

/** Statistical distribution of rates. */
export interface RateStats {
  readonly avg: number;
  readonly median: number;
  /** 25th percentile â€” lower quartile. */
  readonly p25: number;
  /** 75th percentile â€” upper quartile. */
  readonly p75: number;
  /** Absolute floor (minimum wage enforcement). */
  readonly floor: number;
}

/** Experience level multipliers applied to base rates. */
export interface ExperienceMultipliers {
  readonly beginner: number;
  readonly intermediate: number;
  readonly expert: number;
}

/** City-level economic indicators. */
export interface CityEconomicProfile {
  /** Cost-of-living index relative to national average (1.0 = national avg). */
  readonly costOfLivingIndex: number;
  /** City name in English. */
  readonly nameEn: string;
  /** City name in Urdu. */
  readonly nameUr: string;
  /** Average monthly rent for a 1-bed in city center (PKR). */
  readonly avgMonthlyRent: number;
  /** Average daily food cost per person (PKR). */
  readonly avgDailyFood: number;
  /** Average monthly transport cost (PKR). */
  readonly avgMonthlyTransport: number;
}

/** Seasonal adjustment factor entry. */
export interface SeasonalFactor {
  /** Month number 1â€“12. */
  readonly month: number;
  /** Multiplier applied to base rates (1.0 = no adjustment). */
  readonly factor: number;
  /** Reason for the adjustment. */
  readonly reason: string;
}

/** Full rate lookup result combining all factors. */
export interface AdjustedRateResult {
  /** Raw base rate stats for the category+city. */
  readonly baseRate: RateStats;
  /** Experience multiplier applied. */
  readonly experienceMultiplier: number;
  /** Seasonal adjustment factor applied. */
  readonly seasonalFactor: number;
  /** City cost-of-living index. */
  readonly costOfLivingIndex: number;
  /** CPI inflation adjustment factor. */
  readonly inflationFactor: number;
  /** Final adjusted rate stats after all multipliers. */
  readonly adjustedRate: RateStats;
  /** Minimum acceptable rate (wage floor enforcement). */
  readonly absoluteFloor: number;
}

// ============================================================================
// 2. CONSTANTS
// ============================================================================

/**
 * Pakistan's current minimum wage: PKR 32,000/month.
 * Assuming 26 working days/month, 8 hours/day.
 */
export const MINIMUM_WAGE_MONTHLY_PKR = 32_000;
export const WORKING_DAYS_PER_MONTH = 26;
export const WORKING_HOURS_PER_DAY = 8;
export const MINIMUM_WAGE_DAILY_PKR = Math.round(
  MINIMUM_WAGE_MONTHLY_PKR / WORKING_DAYS_PER_MONTH
);
export const MINIMUM_WAGE_HOURLY_PKR = Math.round(
  MINIMUM_WAGE_DAILY_PKR / WORKING_HOURS_PER_DAY
);

/**
 * Current CPI-based inflation factor for Pakistan (May 2026).
 * Source: PBS (Pakistan Bureau of Statistics).
 * Applied on top of base rates to adjust for purchasing power.
 */
export const CURRENT_CPI_INFLATION_FACTOR = 1.12;

/** Default experience multipliers for skill levels. */
export const EXPERIENCE_MULTIPLIERS: ExperienceMultipliers = {
  beginner: 0.7,
  intermediate: 1.0,
  expert: 1.4,
} as const;

/**
 * Urgency premium multipliers.
 * Emergency gigs command a significant premium due to schedule disruption.
 */
export const URGENCY_MULTIPLIERS: Record<string, number> = {
  low: 1.0,
  medium: 1.0,
  high: 1.15,
  emergency: 1.35,
} as const;

// ============================================================================
// 3. CITY ECONOMIC PROFILES
// ============================================================================

export const CITY_PROFILES: Record<string, CityEconomicProfile> = {
  Karachi: {
    costOfLivingIndex: 1.25,
    nameEn: 'Karachi',
    nameUr: 'Ú©Ø±Ø§Ú†ÛŒ',
    avgMonthlyRent: 35_000,
    avgDailyFood: 800,
    avgMonthlyTransport: 8_000,
  },
  Lahore: {
    costOfLivingIndex: 1.15,
    nameEn: 'Lahore',
    nameUr: 'Ù„Ø§ÛÙˆØ±',
    avgMonthlyRent: 30_000,
    avgDailyFood: 700,
    avgMonthlyTransport: 7_000,
  },
  Islamabad: {
    costOfLivingIndex: 1.35,
    nameEn: 'Islamabad',
    nameUr: 'Ø§Ø³Ù„Ø§Ù… Ø¢Ø¨Ø§Ø¯',
    avgMonthlyRent: 45_000,
    avgDailyFood: 900,
    avgMonthlyTransport: 9_000,
  },
  Rawalpindi: {
    costOfLivingIndex: 1.10,
    nameEn: 'Rawalpindi',
    nameUr: 'Ø±Ø§ÙˆÙ„Ù¾Ù†ÚˆÛŒ',
    avgMonthlyRent: 25_000,
    avgDailyFood: 650,
    avgMonthlyTransport: 6_500,
  },
  Faisalabad: {
    costOfLivingIndex: 0.90,
    nameEn: 'Faisalabad',
    nameUr: 'ÙÛŒØµÙ„ Ø¢Ø¨Ø§Ø¯',
    avgMonthlyRent: 18_000,
    avgDailyFood: 550,
    avgMonthlyTransport: 5_000,
  },
  Multan: {
    costOfLivingIndex: 0.85,
    nameEn: 'Multan',
    nameUr: 'Ù…Ù„ØªØ§Ù†',
    avgMonthlyRent: 16_000,
    avgDailyFood: 500,
    avgMonthlyTransport: 4_500,
  },
  Peshawar: {
    costOfLivingIndex: 0.95,
    nameEn: 'Peshawar',
    nameUr: 'Ù¾Ø´Ø§ÙˆØ±',
    avgMonthlyRent: 20_000,
    avgDailyFood: 600,
    avgMonthlyTransport: 5_500,
  },
  Quetta: {
    costOfLivingIndex: 0.88,
    nameEn: 'Quetta',
    nameUr: 'Ú©ÙˆØ¦Ù¹Û',
    avgMonthlyRent: 15_000,
    avgDailyFood: 550,
    avgMonthlyTransport: 4_000,
  },
  Sialkot: {
    costOfLivingIndex: 0.92,
    nameEn: 'Sialkot',
    nameUr: 'Ø³ÛŒØ§Ù„Ú©ÙˆÙ¹',
    avgMonthlyRent: 18_000,
    avgDailyFood: 550,
    avgMonthlyTransport: 5_000,
  },
  Gujranwala: {
    costOfLivingIndex: 0.88,
    nameEn: 'Gujranwala',
    nameUr: 'Ú¯ÙˆØ¬Ø±Ø§Ù†ÙˆØ§Ù„Û',
    avgMonthlyRent: 15_000,
    avgDailyFood: 500,
    avgMonthlyTransport: 4_500,
  },
  Hyderabad: {
    costOfLivingIndex: 0.85,
    nameEn: 'Hyderabad',
    nameUr: 'Ø­ÛŒØ¯Ø±Ø¢Ø¨Ø§Ø¯',
    avgMonthlyRent: 14_000,
    avgDailyFood: 480,
    avgMonthlyTransport: 4_000,
  },
  Bahawalpur: {
    costOfLivingIndex: 0.78,
    nameEn: 'Bahawalpur',
    nameUr: 'Ø¨ÛØ§ÙˆÙ„Ù¾ÙˆØ±',
    avgMonthlyRent: 12_000,
    avgDailyFood: 420,
    avgMonthlyTransport: 3_500,
  },
} as const;

// ============================================================================
// 4. SEASONAL ADJUSTMENT FACTORS
// ============================================================================

/**
 * Category-specific seasonal adjustments.
 * Some categories have strong seasonal patterns in Pakistan.
 */
export const SEASONAL_FACTORS: Record<ServiceCategory, SeasonalFactor[]> = {
  plumbing: [
    { month: 6, factor: 1.20, reason: 'Summer water system demand surge' },
    { month: 7, factor: 1.25, reason: 'Monsoon plumbing emergencies' },
    { month: 8, factor: 1.20, reason: 'Continued monsoon effects' },
  ],
  electrical: [
    { month: 5, factor: 1.15, reason: 'Pre-summer AC installation rush' },
    { month: 6, factor: 1.25, reason: 'Peak summer load-shedding related work' },
    { month: 7, factor: 1.20, reason: 'Monsoon electrical damage repairs' },
  ],
  carpentry: [
    { month: 10, factor: 1.10, reason: 'Pre-winter furniture repairs' },
    { month: 11, factor: 1.15, reason: 'Wedding season furniture demand' },
    { month: 12, factor: 1.10, reason: 'Year-end renovation projects' },
  ],
  painting: [
    { month: 3, factor: 1.15, reason: 'Spring renovation season' },
    { month: 4, factor: 1.20, reason: 'Pre-summer exterior painting' },
    { month: 10, factor: 1.10, reason: 'Post-monsoon repainting demand' },
  ],
  cleaning: [
    { month: 3, factor: 1.15, reason: 'Ramadan deep-cleaning season' },
    { month: 4, factor: 1.20, reason: 'Eid preparation cleaning surge' },
    { month: 6, factor: 1.10, reason: 'Eid-ul-Adha preparation' },
  ],
  moving: [
    { month: 1, factor: 1.10, reason: 'New year relocation period' },
    { month: 6, factor: 1.15, reason: 'Summer transfer season' },
    { month: 7, factor: 0.90, reason: 'Monsoon reduces moving activity' },
  ],
  tailoring: [
    { month: 3, factor: 1.30, reason: 'Ramadan/Eid clothing rush' },
    { month: 4, factor: 1.40, reason: 'Peak Eid tailoring demand' },
    { month: 6, factor: 1.20, reason: 'Eid-ul-Adha clothing' },
    { month: 11, factor: 1.25, reason: 'Wedding season peak' },
    { month: 12, factor: 1.20, reason: 'Continued wedding season' },
  ],
  cooking: [
    { month: 3, factor: 1.15, reason: 'Ramadan catering demand' },
    { month: 4, factor: 1.25, reason: 'Eid feast preparations' },
    { month: 11, factor: 1.30, reason: 'Wedding season catering peak' },
    { month: 12, factor: 1.25, reason: 'Wedding and year-end events' },
  ],
  driving: [
    { month: 4, factor: 1.15, reason: 'Eid travel demand' },
    { month: 6, factor: 1.20, reason: 'Summer travel peak' },
    { month: 7, factor: 1.10, reason: 'Eid-ul-Adha travel' },
    { month: 12, factor: 1.10, reason: 'Year-end travel surge' },
  ],
  tutoring: [
    { month: 2, factor: 1.15, reason: 'Pre-exam tutoring demand' },
    { month: 3, factor: 1.25, reason: 'Board exam preparation peak' },
    { month: 9, factor: 1.15, reason: 'New academic year start' },
    { month: 10, factor: 1.10, reason: 'Mid-term exam prep' },
  ],
  beauty: [
    { month: 3, factor: 1.15, reason: 'Ramadan/Eid beauty prep' },
    { month: 4, factor: 1.25, reason: 'Eid beauty services surge' },
    { month: 11, factor: 1.35, reason: 'Peak wedding season' },
    { month: 12, factor: 1.30, reason: 'Continued wedding season' },
  ],
  gardening: [
    { month: 3, factor: 1.20, reason: 'Spring planting season' },
    { month: 4, factor: 1.15, reason: 'Garden maintenance peak' },
    { month: 9, factor: 1.10, reason: 'Post-monsoon garden recovery' },
    { month: 10, factor: 1.15, reason: 'Fall planting season' },
  ],
  ac_repair: [
    { month: 4, factor: 1.20, reason: 'Pre-summer AC servicing rush' },
    { month: 5, factor: 1.40, reason: 'Summer heat wave AC breakdowns' },
    { month: 6, factor: 1.50, reason: 'Peak summer â€” extreme demand' },
    { month: 7, factor: 1.35, reason: 'Continued high demand' },
    { month: 8, factor: 1.25, reason: 'Late summer servicing' },
    { month: 9, factor: 1.10, reason: 'Post-summer winterization' },
  ],
  mobile_repair: [
    { month: 4, factor: 1.10, reason: 'Post-Eid phone damage repairs' },
    { month: 7, factor: 1.15, reason: 'Monsoon water damage surge' },
    { month: 8, factor: 1.10, reason: 'Continued monsoon effects' },
    { month: 11, factor: 1.15, reason: 'Black Friday/sale-related repairs' },
  ],
  other: [],
} as const;

// ============================================================================
// 5. BASE MARKET RATES DATABASE
// ============================================================================

/**
 * Base market rates for the "national average" city.
 * City-specific rates are derived by multiplying with costOfLivingIndex.
 *
 * Rates are for **intermediate** skill level. Apply EXPERIENCE_MULTIPLIERS
 * for beginner/expert levels.
 *
 * All values in PKR.
 */
const BASE_RATES: Record<ServiceCategory, MarketRateEntry> = {
  plumbing: {
    hourly: { avg: 800, median: 750, p25: 600, p75: 1000, floor: MINIMUM_WAGE_HOURLY_PKR },
    daily: { avg: 5500, median: 5000, p25: 4000, p75: 7000, floor: MINIMUM_WAGE_DAILY_PKR },
    fixed: { avg: 3500, median: 3000, p25: 2000, p75: 5000, floor: 1500 },
  },
  electrical: {
    hourly: { avg: 900, median: 850, p25: 650, p75: 1200, floor: MINIMUM_WAGE_HOURLY_PKR },
    daily: { avg: 6000, median: 5500, p25: 4500, p75: 8000, floor: MINIMUM_WAGE_DAILY_PKR },
    fixed: { avg: 4000, median: 3500, p25: 2500, p75: 6000, floor: 2000 },
  },
  carpentry: {
    hourly: { avg: 850, median: 800, p25: 600, p75: 1100, floor: MINIMUM_WAGE_HOURLY_PKR },
    daily: { avg: 5800, median: 5500, p25: 4200, p75: 7500, floor: MINIMUM_WAGE_DAILY_PKR },
    fixed: { avg: 8000, median: 7000, p25: 4000, p75: 12000, floor: 3000 },
  },
  painting: {
    hourly: { avg: 700, median: 650, p25: 500, p75: 900, floor: MINIMUM_WAGE_HOURLY_PKR },
    daily: { avg: 4800, median: 4500, p25: 3500, p75: 6500, floor: MINIMUM_WAGE_DAILY_PKR },
    fixed: { avg: 15000, median: 12000, p25: 6000, p75: 25000, floor: 4000 },
  },
  cleaning: {
    hourly: { avg: 500, median: 450, p25: 350, p75: 700, floor: MINIMUM_WAGE_HOURLY_PKR },
    daily: { avg: 3500, median: 3200, p25: 2500, p75: 5000, floor: MINIMUM_WAGE_DAILY_PKR },
    fixed: { avg: 3000, median: 2500, p25: 1800, p75: 4500, floor: 1500 },
  },
  moving: {
    hourly: { avg: 600, median: 550, p25: 400, p75: 800, floor: MINIMUM_WAGE_HOURLY_PKR },
    daily: { avg: 5000, median: 4500, p25: 3500, p75: 7000, floor: MINIMUM_WAGE_DAILY_PKR },
    fixed: { avg: 8000, median: 6000, p25: 4000, p75: 15000, floor: 3000 },
  },
  tailoring: {
    hourly: { avg: 600, median: 550, p25: 400, p75: 800, floor: MINIMUM_WAGE_HOURLY_PKR },
    daily: { avg: 4000, median: 3500, p25: 2800, p75: 5500, floor: MINIMUM_WAGE_DAILY_PKR },
    fixed: { avg: 2500, median: 2000, p25: 1200, p75: 4000, floor: 800 },
  },
  cooking: {
    hourly: { avg: 700, median: 650, p25: 500, p75: 900, floor: MINIMUM_WAGE_HOURLY_PKR },
    daily: { avg: 5000, median: 4500, p25: 3500, p75: 7000, floor: MINIMUM_WAGE_DAILY_PKR },
    fixed: { avg: 6000, median: 5000, p25: 3000, p75: 10000, floor: 2500 },
  },
  driving: {
    hourly: { avg: 500, median: 450, p25: 350, p75: 650, floor: MINIMUM_WAGE_HOURLY_PKR },
    daily: { avg: 4000, median: 3500, p25: 2800, p75: 5500, floor: MINIMUM_WAGE_DAILY_PKR },
    fixed: { avg: 3000, median: 2500, p25: 1500, p75: 5000, floor: 1500 },
  },
  tutoring: {
    hourly: { avg: 1000, median: 900, p25: 600, p75: 1500, floor: MINIMUM_WAGE_HOURLY_PKR },
    daily: { avg: 6000, median: 5500, p25: 4000, p75: 8000, floor: MINIMUM_WAGE_DAILY_PKR },
    fixed: { avg: 15000, median: 12000, p25: 8000, p75: 25000, floor: 5000 },
  },
  beauty: {
    hourly: { avg: 800, median: 750, p25: 500, p75: 1200, floor: MINIMUM_WAGE_HOURLY_PKR },
    daily: { avg: 5500, median: 5000, p25: 3500, p75: 8000, floor: MINIMUM_WAGE_DAILY_PKR },
    fixed: { avg: 4000, median: 3500, p25: 2000, p75: 7000, floor: 1500 },
  },
  gardening: {
    hourly: { avg: 500, median: 450, p25: 350, p75: 650, floor: MINIMUM_WAGE_HOURLY_PKR },
    daily: { avg: 3500, median: 3000, p25: 2500, p75: 5000, floor: MINIMUM_WAGE_DAILY_PKR },
    fixed: { avg: 3000, median: 2500, p25: 1500, p75: 5000, floor: 1200 },
  },
  ac_repair: {
    hourly: { avg: 1000, median: 950, p25: 700, p75: 1400, floor: MINIMUM_WAGE_HOURLY_PKR },
    daily: { avg: 7000, median: 6500, p25: 5000, p75: 9000, floor: MINIMUM_WAGE_DAILY_PKR },
    fixed: { avg: 5000, median: 4500, p25: 3000, p75: 8000, floor: 2500 },
  },
  mobile_repair: {
    hourly: { avg: 800, median: 750, p25: 500, p75: 1100, floor: MINIMUM_WAGE_HOURLY_PKR },
    daily: { avg: 5500, median: 5000, p25: 3500, p75: 7500, floor: MINIMUM_WAGE_DAILY_PKR },
    fixed: { avg: 2000, median: 1500, p25: 800, p75: 3500, floor: 500 },
  },
  other: {
    hourly: { avg: 600, median: 550, p25: 400, p75: 800, floor: MINIMUM_WAGE_HOURLY_PKR },
    daily: { avg: 4000, median: 3500, p25: 2800, p75: 5500, floor: MINIMUM_WAGE_DAILY_PKR },
    fixed: { avg: 3000, median: 2500, p25: 1500, p75: 5000, floor: 1000 },
  },
};

// ============================================================================
// 6. RATE LOOKUP FUNCTIONS
// ============================================================================

/**
 * Look up the city economic profile. Falls back to a synthetic "national average"
 * if the city is not in our database.
 */
export function getCityProfile(city: string): CityEconomicProfile {
  const normalized = normalizeCity(city);
  const profile = CITY_PROFILES[normalized];

  if (profile) return profile;

  // Fallback: national average
  return {
    costOfLivingIndex: 1.0,
    nameEn: city,
    nameUr: city,
    avgMonthlyRent: 20_000,
    avgDailyFood: 600,
    avgMonthlyTransport: 5_500,
  };
}

/**
 * Get base market rates for a category. Always returns valid data â€”
 * falls back to "other" category if the category is unknown.
 */
export function getBaseRates(category: ServiceCategory): MarketRateEntry {
  return BASE_RATES[category] ?? BASE_RATES['other'];
}

/**
 * Get the seasonal adjustment factor for a category in the current month.
 * Returns 1.0 if no seasonal adjustment is defined.
 */
export function getSeasonalFactor(
  category: ServiceCategory,
  month?: number
): { factor: number; reason: string } {
  const currentMonth = month ?? new Date().getMonth() + 1;
  const factors = SEASONAL_FACTORS[category];

  if (!factors || factors.length === 0) {
    return { factor: 1.0, reason: 'No seasonal adjustment' };
  }

  const entry = factors.find((f) => f.month === currentMonth);
  return entry
    ? { factor: entry.factor, reason: entry.reason }
    : { factor: 1.0, reason: 'Off-season â€” no adjustment' };
}

/**
 * Calculate fully adjusted market rates for a category + city + experience combo.
 *
 * Adjustment chain:
 * 1. Base rate (national average for intermediate level)
 * 2. Ã— City cost-of-living index
 * 3. Ã— Experience multiplier
 * 4. Ã— Seasonal factor
 * 5. Ã— CPI inflation factor
 * 6. Floor enforcement (never below minimum wage)
 *
 * @param category - The service category
 * @param city - City name (case-insensitive)
 * @param experienceLevel - Worker's skill level
 * @param rateUnit - Which rate unit to calculate
 * @param month - Override month for seasonal calc (default: current)
 */
export function calculateAdjustedRate(
  category: ServiceCategory,
  city: string,
  experienceLevel: 'beginner' | 'intermediate' | 'expert',
  rateUnit: 'hourly' | 'daily' | 'fixed',
  month?: number
): AdjustedRateResult {
  const baseEntry = getBaseRates(category);
  const baseRate = baseEntry[rateUnit];
  const cityProfile = getCityProfile(city);
  const expMultiplier = EXPERIENCE_MULTIPLIERS[experienceLevel];
  const seasonal = getSeasonalFactor(category, month);
  const inflationFactor = CURRENT_CPI_INFLATION_FACTOR;

  const totalMultiplier =
    cityProfile.costOfLivingIndex *
    expMultiplier *
    seasonal.factor *
    inflationFactor;

  // Determine the absolute floor based on rate unit
  let absoluteFloor: number;
  switch (rateUnit) {
    case 'hourly':
      absoluteFloor = MINIMUM_WAGE_HOURLY_PKR;
      break;
    case 'daily':
      absoluteFloor = MINIMUM_WAGE_DAILY_PKR;
      break;
    case 'fixed':
      // For fixed rates, floor is category-specific
      absoluteFloor = baseRate.floor;
      break;
  }

  const adjustedRate: RateStats = {
    avg: Math.max(Math.round(baseRate.avg * totalMultiplier), absoluteFloor),
    median: Math.max(Math.round(baseRate.median * totalMultiplier), absoluteFloor),
    p25: Math.max(Math.round(baseRate.p25 * totalMultiplier), absoluteFloor),
    p75: Math.max(Math.round(baseRate.p75 * totalMultiplier), absoluteFloor),
    floor: absoluteFloor,
  };

  return {
    baseRate,
    experienceMultiplier: expMultiplier,
    seasonalFactor: seasonal.factor,
    costOfLivingIndex: cityProfile.costOfLivingIndex,
    inflationFactor,
    adjustedRate,
    absoluteFloor,
  };
}

/**
 * Calculate the national average rate for a category (no city adjustment).
 * Used as a baseline for comparisons.
 */
export function getNationalAverageRate(
  category: ServiceCategory,
  rateUnit: 'hourly' | 'daily' | 'fixed'
): RateStats {
  const baseEntry = getBaseRates(category);
  const base = baseEntry[rateUnit];

  // Apply only inflation factor for a current-value national average
  return {
    avg: Math.round(base.avg * CURRENT_CPI_INFLATION_FACTOR),
    median: Math.round(base.median * CURRENT_CPI_INFLATION_FACTOR),
    p25: Math.round(base.p25 * CURRENT_CPI_INFLATION_FACTOR),
    p75: Math.round(base.p75 * CURRENT_CPI_INFLATION_FACTOR),
    floor: base.floor,
  };
}

/**
 * Calculate the living wage for a city â€” the minimum amount a worker needs
 * to cover basic expenses (rent + food + transport).
 */
export function calculateLivingWage(city: string): {
  monthly: number;
  daily: number;
  hourly: number;
} {
  const profile = getCityProfile(city);
  const monthlyBasic =
    profile.avgMonthlyRent +
    profile.avgDailyFood * 30 +
    profile.avgMonthlyTransport;

  // Add 20% buffer for healthcare, clothing, savings
  const monthlyLiving = Math.round(monthlyBasic * 1.2);

  return {
    monthly: monthlyLiving,
    daily: Math.round(monthlyLiving / WORKING_DAYS_PER_MONTH),
    hourly: Math.round(monthlyLiving / WORKING_DAYS_PER_MONTH / WORKING_HOURS_PER_DAY),
  };
}

// ============================================================================
// 7. HELPERS
// ============================================================================

/**
 * Normalize city name for lookup. Handles common variations.
 */
function normalizeCity(city: string): string {
  const normalized = city.trim();

  // Map of common variations to canonical names
  const cityAliases: Record<string, string> = {
    karachi: 'Karachi',
    lahore: 'Lahore',
    islamabad: 'Islamabad',
    rawalpindi: 'Rawalpindi',
    pindi: 'Rawalpindi',
    faisalabad: 'Faisalabad',
    lyallpur: 'Faisalabad',
    multan: 'Multan',
    peshawar: 'Peshawar',
    quetta: 'Quetta',
    sialkot: 'Sialkot',
    gujranwala: 'Gujranwala',
    hyderabad: 'Hyderabad',
    bahawalpur: 'Bahawalpur',
  };

  return cityAliases[normalized.toLowerCase()] ?? normalized;
}

/**
 * Get all available cities in the database.
 */
export function getAvailableCities(): string[] {
  return Object.keys(CITY_PROFILES);
}

/**
 * Get all rate entries for a category across all cities.
 * Useful for computing cross-city comparisons.
 */
export function getAllCityRates(
  category: ServiceCategory,
  rateUnit: 'hourly' | 'daily' | 'fixed',
  experienceLevel: 'beginner' | 'intermediate' | 'expert' = 'intermediate'
): Array<{ city: string; rate: AdjustedRateResult }> {
  return getAvailableCities().map((city) => ({
    city,
    rate: calculateAdjustedRate(category, city, experienceLevel, rateUnit),
  }));
}

