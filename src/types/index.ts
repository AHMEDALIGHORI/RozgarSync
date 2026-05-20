// ============================================================================
// RozgarSync — Complete Domain Type System
// ============================================================================
// This file is the SINGLE SOURCE OF TRUTH for all Firestore document shapes.
// It is duplicated to functions/src/types/index.ts for Cloud Functions.
// Keep both files in sync. A shared package is the long-term solution.
// ============================================================================

import type { Timestamp } from "firebase/firestore";

// ============================================================================
// 1. GEO TYPES
// ============================================================================

/** Lightweight lat/lng pair for embedding in documents. */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * GeoHash for proximity indexing.
 * Store alongside the GeoPoint so composite indexes can filter by
 * geohash prefix + other fields without a full GeoPoint comparison.
 * @see https://firebase.google.com/docs/firestore/solutions/geoqueries
 */
export interface GeoLocation {
  geopoint: GeoPoint;
  geohash: string; // e.g. "ttq0y1" — precision 6 ≈ ±0.6 km
  city: string;
  area?: string;
  province?: string;
  formattedAddress?: string;
}

// ============================================================================
// 2. USER / AUTH TYPES
// ============================================================================

export type UserRole = "worker" | "employer" | "admin" | "moderator";
export type SupportedLocale = "ur" | "en";

/**
 * Firestore: `users/{uid}`
 * Public profile visible to all authenticated users.
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  phone?: string;
  role: UserRole;
  locale: SupportedLocale;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** Embedded sub-document — shape depends on role. */
  profile: WorkerProfile | EmployerProfile;
}

// ============================================================================
// 3. WORKER TYPES
// ============================================================================

/**
 * Embedded in `UserProfile.profile` when `role === "worker"`.
 * Public-facing worker information.
 */
export interface WorkerProfile {
  phone: string;
  city: string;
  skills: WorkerSkill[];
  rating: number;
  totalReviews: number;
  completedJobs: number;
  isVerified: boolean;
  location?: GeoLocation;
  bio?: string;
  availability?: WorkerAvailability;
  hourlyRate?: number;
  languages?: string[];
  portfolio?: PortfolioItem[];
  safetyProfile: WorkerSafetyProfile;
}

/** Individual skill entry with category binding and endorsement tracking. */
export interface WorkerSkill {
  id: string;
  category: ServiceCategory;
  name: string;
  nameUrdu: string;
  level: "beginner" | "intermediate" | "expert";
  yearsExperience: number;
  isVerified: boolean;
  /** Number of employers who endorsed this skill after a completed gig. */
  endorsementCount: number;
  /** UIDs of the last N endorsers — kept for display, not auth. */
  recentEndorsers?: string[];
}

/** Public safety signals — never contains raw PII. */
export interface WorkerSafetyProfile {
  isBackgroundChecked: boolean;
  verificationLevel: VerificationLevel;
  /** ISO 8601 date string of last background check. */
  lastBackgroundCheckDate?: string;
  /** Number of safety incidents reported against this worker. */
  incidentCount: number;
  /** Number of incidents that were resolved in the worker's favour. */
  resolvedIncidentCount: number;
  /** Composite safety score 0–100 computed by Cloud Function. */
  safetyScore: number;
}

export type VerificationLevel = "none" | "basic" | "verified" | "trusted";

// --- Worker Private Data ---

/**
 * Firestore: `users/{uid}/private/data`
 * Contains PII and financial data. Only readable by the owner and admins.
 * Financial mutations are restricted to Cloud Functions (Admin SDK).
 */
export interface WorkerPrivateData {
  uid: string;

  // --- Identity ---
  encryptedCnic: EncryptedCnic;

  // --- Financial ---
  financialProfile: WorkerFinancialProfile;
}

/**
 * CNIC encrypted at rest with AES-256-GCM.
 * The encryption key is managed outside Firestore (e.g. Cloud KMS).
 * Key rotation metadata is stored alongside the ciphertext.
 */
export interface EncryptedCnic {
  /** Base64-encoded AES-256-GCM ciphertext of the 13-digit CNIC. */
  ciphertext: string;
  /** Base64-encoded 12-byte IV/nonce used for encryption. */
  iv: string;
  /** Base64-encoded 16-byte GCM auth tag. */
  authTag: string;
  /** Identifier of the KMS key version used — enables key rotation. */
  keyVersion: string;
  /** ISO 8601 timestamp of when this CNIC blob was last re-encrypted. */
  encryptedAt: string;
  /** SHA-256 hash of the plaintext CNIC — used for duplicate detection
   *  without decrypting. */
  cnicHash: string;
}

export interface WorkerFinancialProfile {
  totalEarnings: number;
  withdrawableBalance: number;
  pendingBalance: number;
  lifetimePlatformFees: number;
  eobiTracker: EobiTracker;
  paymentMethods: PaymentMethod[];
  /** ISO 4217 currency code — always PKR for now. */
  currency: "PKR";
}

export interface EobiTracker {
  /** Whether the worker is enrolled in EOBI. */
  isRegistered: boolean;
  /** EOBI registration number (e.g. "EOBI-PK-XXXXXXXXX"). */
  eobiNumber?: string;
  /** Cumulative EOBI contributions in PKR. */
  totalContributions: number;
  /** Timestamp of the last contribution. */
  lastContributionDate?: Timestamp;
  /** Individual contribution line items — most recent first. */
  contributionHistory: EobiContribution[];
}

/** One EOBI deduction line item — appended by Cloud Functions only. */
export interface EobiContribution {
  amount: number;
  /** Reference to the Transaction document that records this deduction. */
  transactionId: string;
  /** Reference to the completed Gig this was deducted from. */
  gigId: string;
  date: Timestamp;
}

export interface PaymentMethod {
  id: string;
  type: "bank_account" | "mobile_wallet";
  /** Last 4 digits of account/phone for display. */
  last4: string;
  /** Provider name — e.g. "Easypaisa", "JazzCash", "Meezan Bank". */
  provider: string;
  isDefault: boolean;
  /** ISO 8601 date string of when this method was added. */
  addedAt: string;
}

// --- Worker Availability ---

export interface WorkerAvailability {
  isAvailable: boolean;
  schedule: WeeklySchedule;
  preferredAreas: string[];
  /** Maximum travel radius in km from the worker's location. */
  maxTravelRadiusKm?: number;
}

export interface WeeklySchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string; // "09:00" HH:mm
  end: string;   // "17:00" HH:mm
}

export interface PortfolioItem {
  id: string;
  title: string;
  titleUrdu?: string;
  description: string;
  imageUrl: string;
  gigId?: string;
  createdAt: Timestamp;
}

// ============================================================================
// 4. EMPLOYER TYPES
// ============================================================================

/**
 * Embedded in `UserProfile.profile` when `role === "employer"`.
 */
export interface EmployerProfile {
  companyName?: string;
  industry?: string;
  isVerified: boolean;
  totalHires: number;
  totalSpent: number;
  activeGigs: number;
  safetyScoring: EmployerSafetyScoring;
}

/**
 * Multi-dimensional employer safety score.
 * Recomputed by a scheduled Cloud Function.
 */
export interface EmployerSafetyScoring {
  /** Overall composite score 0–100. */
  overallScore: number;
  /** Percentage of gigs where escrow was funded before work started. */
  paymentReliability: number;
  /** Ratio of disputes filed against this employer vs total gigs. */
  disputeRate: number;
  /** Average rating given by workers after completed gigs. */
  workerFeedbackAvg: number;
  /** Number of safety incidents filed against this employer. */
  incidentCount: number;
  /** Number of gigs cancelled after worker assignment. */
  cancellationCount: number;
  /** Total number of completed gigs (denominator for rates). */
  completedGigCount: number;
  /** ISO 8601 date of last recomputation. */
  lastComputedAt: string;
}

// ============================================================================
// 5. GIG TYPES
// ============================================================================

export type ServiceCategory =
  | "plumbing"
  | "electrical"
  | "carpentry"
  | "painting"
  | "cleaning"
  | "moving"
  | "tailoring"
  | "cooking"
  | "driving"
  | "tutoring"
  | "beauty"
  | "gardening"
  | "ac_repair"
  | "mobile_repair"
  | "other";

export type GigStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

export type EscrowReleaseStatus =
  | "unfunded"
  | "funded"
  | "released"
  | "refunded"
  | "disputed"
  | "partial_release";

/**
 * Firestore: `gigs/{gigId}`
 */
export interface Gig {
  id: string;
  title: string;
  titleUrdu?: string;
  description: string;
  descriptionUrdu?: string;
  category: ServiceCategory;

  // --- Employer ---
  employerId: string;
  employerName: string;
  employerSafetyScore: number;

  // --- Location ---
  location: GeoLocation;
  city: string;

  // --- Budget ---
  budget: PriceRange;
  duration: string;

  // --- Status & Assignment ---
  status: GigStatus;
  /**
   * First-class applicant objects — not just UIDs.
   * This allows querying applicant details without extra reads.
   * For gigs with many applicants, consider a subcollection instead.
   */
  applicants: GigApplicant[];
  applicantCount: number;
  assignedWorkerId?: string;
  assignedWorkerName?: string;

  // --- Escrow ---
  escrow: EscrowState;

  // --- Metadata ---
  requirements?: string[];
  images?: string[];
  tags?: string[];
  urgency: "low" | "medium" | "high" | "emergency";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  cancelledAt?: Timestamp;
}

/** A worker's application to a gig — embedded in the Gig document. */
export interface GigApplicant {
  workerId: string;
  workerName: string;
  workerPhotoURL?: string;
  workerRating: number;
  workerVerificationLevel: VerificationLevel;
  /** Worker's proposed rate (may differ from gig budget). */
  proposedRate?: number;
  proposedRateUnit?: "fixed" | "hourly" | "daily";
  coverNote?: string;
  /** When the worker can start — ISO 8601 date. */
  availableFrom?: string;
  /** Estimated completion duration — e.g. "3 days". */
  estimatedDuration?: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  appliedAt: Timestamp;
}

/** Escrow lifecycle state for a single gig. */
export interface EscrowState {
  isFunded: boolean;
  amount: number;
  currency: "PKR";
  /** Reference to the escrow_deposit Transaction document. */
  fundingTransactionId?: string;
  releaseStatus: EscrowReleaseStatus;
  /** Reference to the escrow_release Transaction document. */
  releaseTransactionId?: string;
  /** If disputed, the ID of the dispute resolution AgentDecisionLog. */
  disputeLogId?: string;
  /** Amount actually released to worker (after platform fee + EOBI). */
  releasedAmount?: number;
  fundedAt?: Timestamp;
  releasedAt?: Timestamp;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: "PKR";
  unit: "fixed" | "hourly" | "daily";
}

// ============================================================================
// 6. SERVICE DIRECTORY (kept for public listings)
// ============================================================================

/**
 * Firestore: `services/{serviceId}`
 * Public directory listing — a worker's advertised service.
 */
export interface Service {
  id: string;
  title: string;
  titleUrdu: string;
  description: string;
  descriptionUrdu: string;
  category: ServiceCategory;
  subcategory: string;
  priceRange: PriceRange;
  duration: string;
  workerId: string;
  workerName: string;
  workerPhotoURL: string;
  workerRating: number;
  location: GeoLocation;
  city: string;
  images: string[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  bookingCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// 7. TRANSACTION TYPES
// ============================================================================

export type TransactionType =
  | "escrow_deposit"
  | "escrow_release"
  | "platform_fee"
  | "eobi_contribution"
  | "withdrawal"
  | "refund"
  | "penalty"
  | "bonus";

export type TransactionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "reversed"
  | "cancelled";

/**
 * Firestore: `transactions/{transactionId}`
 * Immutable ledger entry. ALL writes go through Admin SDK (Cloud Functions).
 * Client-side reads are scoped to sourceId or destinationId matching the
 * authenticated user's UID.
 */
export interface Transaction {
  id: string;
  amount: number;
  currency: "PKR";
  type: TransactionType;
  /** UID of payer, system account, or gig escrow reference. */
  sourceId: string;
  /** UID of payee, system account (e.g. SYSTEM_FEE_ACCOUNT). */
  destinationId: string;
  relatedGigId?: string;
  status: TransactionStatus;
  /** Prevents duplicate transactions from retried Cloud Function invocations. */
  idempotencyKey: string;
  /** SHA-256 hash of (amount + type + sourceId + destinationId + idempotencyKey).
   *  Used for tamper detection in audit queries. */
  integrityHash: string;
  /** Optional human-readable description — e.g. "EOBI deduction for gig xyz". */
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// 8. AGENT DECISION LOG (Immutable Audit Trail)
// ============================================================================

export type AgentDecisionType =
  | "skill_matching"
  | "price_suggestion"
  | "demand_forecast"
  | "route_optimization"
  | "review_sentiment"
  | "fraud_detection"
  | "dispute_resolution"
  | "safety_scoring"
  | "gig_recommendation"
  | "employer_risk_assessment";

/**
 * Firestore: `agent_decision_logs/{logId}`
 *
 * Immutable audit trail for every AI agent decision.
 * - Client writes are BLOCKED in Firestore rules.
 * - Only the Admin SDK (Cloud Functions) can create documents.
 * - Updates and deletes are permanently forbidden.
 *
 * SHA Trace Hashes:
 * - `inputHash`:  SHA-256 of the serialised input payload.
 * - `outputHash`: SHA-256 of the serialised output/decision payload.
 * - `traceChainHash`: SHA-256(parentTraceId + inputHash + outputHash).
 *   This creates a tamper-evident chain: changing any earlier log
 *   breaks the chain verification for all subsequent logs in the session.
 */
export interface AgentDecisionLog {
  id: string;

  // --- Decision Classification ---
  decisionType: AgentDecisionType;
  /** Semantic version of the agent model used — e.g. "v2.3.1". */
  agentVersion: string;
  /** Identifier of the model checkpoint — e.g. "gemini-1.5-pro-002". */
  modelId: string;

  // --- SHA Trace Hashes ---
  /** SHA-256 hash of the serialised input parameters. */
  inputHash: string;
  /** SHA-256 hash of the serialised decision output. */
  outputHash: string;
  /** Links this decision to its predecessor in a multi-step reasoning chain.
   *  null for the first decision in a session. */
  parentTraceId: string | null;
  /** Groups all decisions within one user-facing AI interaction session. */
  sessionTraceId: string;
  /**
   * SHA-256(parentTraceId + inputHash + outputHash).
   * Creates a hash chain — tampering with any log in the chain
   * will invalidate all downstream traceChainHash values.
   */
  traceChainHash: string;

  // --- Context References ---
  /** Human-readable explanation of the decision/rationale from the LLM. */
  rationale: string;
  gigId?: string;
  workerId?: string;
  employerId?: string;

  // --- Confidence & Performance ---
  /** Model confidence score 0.0–1.0 if available. */
  confidence?: number;
  /** Latency of the decision in milliseconds. */
  latencyMs?: number;
  /** Number of input tokens consumed. */
  inputTokens?: number;
  /** Number of output tokens generated. */
  outputTokens?: number;

  // --- Immutability ---
  timestamp: Timestamp;
  /** UID of the user or system that triggered this decision. */
  triggeredBy: string;
}

// ============================================================================
// 9. REVIEW & DISPUTE TYPES
// ============================================================================

/**
 * Firestore: `reviews/{reviewId}`
 */
export interface Review {
  id: string;
  gigId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: "worker" | "employer";
  revieweeId: string;
  revieweeName: string;
  rating: number; // 1–5
  comment: string;
  commentUrdu?: string;
  /** Optional evidence attachments (photos of completed work, etc.). */
  evidence?: ReviewEvidence[];
  /** Whether this review was flagged by the AI for potential fraud. */
  isFlagged: boolean;
  flagReason?: string;
  createdAt: Timestamp;
}

export interface ReviewEvidence {
  type: "image" | "document";
  url: string;
  description?: string;
}

// ============================================================================
// 10. NOTIFICATION TYPES
// ============================================================================

export type NotificationType =
  | "gig_invite"
  | "gig_assigned"
  | "application_received"
  | "application_accepted"
  | "application_rejected"
  | "escrow_funded"
  | "escrow_released"
  | "payment_received"
  | "new_review"
  | "safety_alert"
  | "dispute_opened"
  | "dispute_resolved"
  | "eobi_contribution"
  | "system";

/**
 * Firestore: `notifications/{notificationId}`
 * Created by Cloud Functions only. Users can only update `isRead`.
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleUrdu: string;
  message: string;
  messageUrdu: string;
  /** Deep-link data for navigating to the relevant screen. */
  data: Record<string, string>;
  isRead: boolean;
  createdAt: Timestamp;
}

// ============================================================================
// 11. AI JOB TYPES
// ============================================================================

export type AIJobType =
  | "skill_matching"
  | "price_suggestion"
  | "demand_forecast"
  | "route_optimization"
  | "review_sentiment"
  | "fraud_detection"
  | "dispute_resolution"
  | "safety_scoring"
  | "gig_recommendation"
  | "employer_risk_assessment";

export type AIJobStatus = "queued" | "processing" | "completed" | "failed";

/**
 * Firestore: `ai_jobs/{jobId}`
 */
export interface AIJob {
  id: string;
  type: AIJobType;
  status: AIJobStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  userId: string;
  /** Reference to the AgentDecisionLog created by this job. */
  decisionLogId?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  error?: string;
}

// ============================================================================
// 12. MAP & UI TYPES
// ============================================================================

export interface MapMarker {
  id: string;
  position: GeoPoint;
  type: "worker" | "gig" | "employer";
  title: string;
  subtitle?: string;
  rating?: number;
  photoURL?: string;
  category?: ServiceCategory;
}

// ============================================================================
// 13. i18n TYPES
// ============================================================================

export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  direction: "rtl" | "ltr";
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: "ur", name: "Urdu", nativeName: "اردو", direction: "rtl", flag: "🇵🇰" },
  { code: "en", name: "English", nativeName: "English", direction: "ltr", flag: "🇬🇧" },
];
