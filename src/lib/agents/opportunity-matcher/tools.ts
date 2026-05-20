// @ts-nocheck
// ============================================================================
// RozgarSync â€” OpportunityMatcher Tools
// ============================================================================
// Tool implementations for the OpportunityMatcher agent:
// - compute_haversine_distance: Geospatial distance between two GeoPoints
// - query_worker_gig_history: Fairness data â€” recent gig counts
// - check_worker_availability: Schedule overlap validation
// ============================================================================

import type { GeoPoint, WorkerAvailability, WeeklySchedule, TimeSlot } from '@/types';
import type { AgentTool } from '../core/types';

// ============================================================================
// 1. HAVERSINE DISTANCE TOOL
// ============================================================================

/** Input for the Haversine distance computation. */
export interface HaversineInput {
  /** Origin point (typically the gig location). */
  readonly from: GeoPoint;
  /** Destination point (typically the worker location). */
  readonly to: GeoPoint;
}

/** Output of the Haversine distance computation. */
export interface HaversineOutput {
  /** Distance in kilometres, rounded to 2 decimal places. */
  readonly distanceKm: number;
  /** Whether the worker is within a reasonable urban travel radius (â‰¤ 50 km). */
  readonly isWithinUrbanRadius: boolean;
}

/** Mean radius of the Earth in kilometres. */
const EARTH_RADIUS_KM = 6_371;

/** Maximum radius (km) considered "urban" in Pakistan's major cities. */
const URBAN_RADIUS_KM = 50;

/**
 * Compute the great-circle distance between two GeoPoints using the
 * Haversine formula. Handles edge cases like identical points and antipodal
 * coordinates.
 *
 * @see https://en.wikipedia.org/wiki/Haversine_formula
 */
function computeHaversine(from: GeoPoint, to: GeoPoint): HaversineOutput {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);

  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(EARTH_RADIUS_KM * c * 100) / 100;

  return {
    distanceKm,
    isWithinUrbanRadius: distanceKm <= URBAN_RADIUS_KM,
  };
}

/**
 * Creates the `compute_haversine_distance` tool.
 * Pure computation â€” no side effects, no external dependencies.
 */
export function createHaversineTool(): AgentTool<HaversineInput, HaversineOutput> {
  return {
    name: 'compute_haversine_distance',
    description:
      'Computes the great-circle distance between two geographic points using the Haversine formula. Returns distance in km and urban-radius check.',
    async execute(input: HaversineInput): Promise<HaversineOutput> {
      return computeHaversine(input.from, input.to);
    },
  };
}

// ============================================================================
// 2. WORKER GIG HISTORY TOOL
// ============================================================================

/** Input for querying a worker's recent gig history. */
export interface WorkerGigHistoryInput {
  /** The worker's UID. */
  readonly workerId: string;
  /** How many days back to look (default: 7). */
  readonly lookbackDays: number;
}

/** Output of the gig history query. */
export interface WorkerGigHistoryOutput {
  /** Number of gigs completed in the lookback window. */
  readonly recentGigCount: number;
  /** Number of gigs assigned (including in-progress) in the lookback window. */
  readonly recentAssignedCount: number;
  /** Average number of gigs per day in the window. */
  readonly averageGigsPerDay: number;
  /** Whether this worker is at risk of monopolizing the market (â‰¥ 3 per day). */
  readonly isHighFrequency: boolean;
  /** Gig IDs in the window (for deduplication and audit). */
  readonly recentGigIds: ReadonlyArray<string>;
}

/**
 * Simulated worker gig history provider.
 *
 * In production, this queries Firestore:
 * ```
 * db.collection('gigs')
 *   .where('assignedWorkerId', '==', workerId)
 *   .where('completedAt', '>=', cutoffTimestamp)
 *   .get()
 * ```
 *
 * For now, returns deterministic mock data seeded by workerId hash
 * to enable end-to-end testing without Firestore.
 */
function queryWorkerGigHistoryMock(
  input: WorkerGigHistoryInput
): WorkerGigHistoryOutput {
  // Deterministic hash from workerId to simulate varying history
  let hash = 0;
  for (let i = 0; i < input.workerId.length; i++) {
    hash = ((hash << 5) - hash + input.workerId.charCodeAt(i)) | 0;
  }
  const seed = Math.abs(hash) % 10;

  const recentGigCount = seed;
  const recentAssignedCount = seed + (seed > 5 ? 2 : 0);
  const averageGigsPerDay =
    Math.round((recentGigCount / Math.max(input.lookbackDays, 1)) * 100) / 100;

  const recentGigIds: string[] = [];
  for (let i = 0; i < recentGigCount; i++) {
    recentGigIds.push(`gig_${input.workerId}_${i}`);
  }

  return {
    recentGigCount,
    recentAssignedCount,
    averageGigsPerDay,
    isHighFrequency: averageGigsPerDay >= 3,
    recentGigIds,
  };
}

/**
 * Creates the `query_worker_gig_history` tool.
 * Uses mock data in development; swap `queryWorkerGigHistoryMock` for
 * a Firestore implementation in production.
 */
export function createWorkerGigHistoryTool(): AgentTool<
  WorkerGigHistoryInput,
  WorkerGigHistoryOutput
> {
  return {
    name: 'query_worker_gig_history',
    description:
      'Queries a worker\'s recent gig history to compute fairness/anti-starvation scores. Returns gig counts and frequency metrics for the specified lookback window.',
    async execute(
      input: WorkerGigHistoryInput
    ): Promise<WorkerGigHistoryOutput> {
      return queryWorkerGigHistoryMock(input);
    },
  };
}

// ============================================================================
// 3. WORKER AVAILABILITY TOOL
// ============================================================================

/** Input for checking worker availability. */
export interface WorkerAvailabilityInput {
  /** The worker's availability profile. */
  readonly availability: WorkerAvailability;
  /** ISO 8601 timestamp of when the gig is scheduled to start. */
  readonly gigStartTime?: string;
  /** Duration of the gig in hours (estimated). */
  readonly gigDurationHours?: number;
}

/** Output of the availability check. */
export interface WorkerAvailabilityOutput {
  /** Whether the worker is currently marked as available. */
  readonly isCurrentlyAvailable: boolean;
  /** Whether the worker's schedule overlaps with the gig time. */
  readonly hasScheduleOverlap: boolean;
  /** Computed availability score 0.0â€“1.0. */
  readonly availabilityScore: number;
  /** Human-readable explanation. */
  readonly reason: string;
}

/** Day-of-week keys matching WeeklySchedule. */
type DayOfWeek = keyof WeeklySchedule;

/** Map JS Date.getDay() to WeeklySchedule keys. */
const DAY_INDEX_MAP: ReadonlyArray<DayOfWeek> = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * Parse an "HH:mm" string into minutes since midnight.
 * Returns NaN for invalid input (handled gracefully downstream).
 */
function parseTimeToMinutes(time: string): number {
  const parts = time.split(':');
  const hours = parseInt(parts[0] ?? '0', 10);
  const minutes = parseInt(parts[1] ?? '0', 10);
  return hours * 60 + minutes;
}

/**
 * Check if a given time (in minutes since midnight) falls within a TimeSlot.
 */
function isWithinSlot(timeMinutes: number, slot: TimeSlot): boolean {
  const start = parseTimeToMinutes(slot.start);
  const end = parseTimeToMinutes(slot.end);
  return timeMinutes >= start && timeMinutes <= end;
}

/**
 * Check worker availability against gig timing requirements.
 */
function checkAvailability(
  input: WorkerAvailabilityInput
): WorkerAvailabilityOutput {
  const { availability, gigStartTime } = input;

  // Not available at all
  if (!availability.isAvailable) {
    return {
      isCurrentlyAvailable: false,
      hasScheduleOverlap: false,
      availabilityScore: 0,
      reason: 'Worker has marked themselves as unavailable.',
    };
  }

  // No specific gig time â€” just check general availability flag
  if (!gigStartTime) {
    return {
      isCurrentlyAvailable: true,
      hasScheduleOverlap: true,
      availabilityScore: 0.8,
      reason: 'Worker is available; no specific gig time to validate against schedule.',
    };
  }

  // Check schedule overlap
  const gigDate = new Date(gigStartTime);
  const dayIndex = gigDate.getDay();
  const dayKey = DAY_INDEX_MAP[dayIndex];
  if (!dayKey) {
    return {
      isCurrentlyAvailable: true,
      hasScheduleOverlap: false,
      availabilityScore: 0.3,
      reason: 'Could not determine day of week from gig start time.',
    };
  }

  const daySlots: TimeSlot[] = availability.schedule[dayKey];
  if (daySlots.length === 0) {
    return {
      isCurrentlyAvailable: true,
      hasScheduleOverlap: false,
      availabilityScore: 0.2,
      reason: `Worker has no scheduled availability on ${dayKey}.`,
    };
  }

  const gigMinutes = gigDate.getHours() * 60 + gigDate.getMinutes();
  const overlaps = daySlots.some((slot) => isWithinSlot(gigMinutes, slot));

  return {
    isCurrentlyAvailable: true,
    hasScheduleOverlap: overlaps,
    availabilityScore: overlaps ? 1.0 : 0.4,
    reason: overlaps
      ? `Worker is available on ${dayKey} at the requested time.`
      : `Worker's ${dayKey} schedule does not overlap with the gig start time.`,
  };
}

/**
 * Creates the `check_worker_availability` tool.
 */
export function createWorkerAvailabilityTool(): AgentTool<
  WorkerAvailabilityInput,
  WorkerAvailabilityOutput
> {
  return {
    name: 'check_worker_availability',
    description:
      'Checks whether a worker is available for a gig by validating their availability flag and schedule overlap with the gig timing.',
    async execute(
      input: WorkerAvailabilityInput
    ): Promise<WorkerAvailabilityOutput> {
      return checkAvailability(input);
    },
  };
}

// ============================================================================
// 4. TOOL FACTORY
// ============================================================================

/**
 * Create all OpportunityMatcher tools.
 * Call this during agent initialization.
 */
export function createOpportunityMatcherTools(): {
  haversineTool: AgentTool<HaversineInput, HaversineOutput>;
  gigHistoryTool: AgentTool<WorkerGigHistoryInput, WorkerGigHistoryOutput>;
  availabilityTool: AgentTool<WorkerAvailabilityInput, WorkerAvailabilityOutput>;
} {
  return {
    haversineTool: createHaversineTool(),
    gigHistoryTool: createWorkerGigHistoryTool(),
    availabilityTool: createWorkerAvailabilityTool(),
  };
}

