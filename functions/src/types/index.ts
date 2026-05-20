// ============================================================================
// RozgarSync — Cloud Functions Type Definitions
// ============================================================================
// IMPORTANT: This file mirrors src/types/index.ts but uses firebase-admin
// Timestamp instead of the client SDK Timestamp. Keep in sync manually
// until a shared types package is implemented.
// ============================================================================

import type { Timestamp } from "firebase-admin/firestore";

// ============================================================================
// 1. GEO TYPES
// ============================================================================

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoLocation {
  geopoint: GeoPoint;
  geohash: string;
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
  profile: WorkerProfile | EmployerProfile;
}

// ============================================================================
// 3. WORKER TYPES
// ============================================================================

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

export interface WorkerSkill {
  id: string;
  category: ServiceCategory;
  name: string;
  nameUrdu: string;
  level: "beginner" | "intermediate" | "expert";
  yearsExperience: number;
  isVerified: boolean;
  endorsementCount: number;
  recentEndorsers?: string[];
}

export interface WorkerSafetyProfile {
  isBackgroundChecked: boolean;
  verificationLevel: VerificationLevel;
  lastBackgroundCheckDate?: string;
  incidentCount: number;
  resolvedIncidentCount: number;
  safetyScore: number;
}

export type VerificationLevel = "none" | "basic" | "verified" | "trusted";

export interface WorkerPrivateData {
  uid: string;
  encryptedCnic: EncryptedCnic;
  financialProfile: WorkerFinancialProfile;
}

export interface EncryptedCnic {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: string;
  encryptedAt: string;
  cnicHash: string;
}

export interface WorkerFinancialProfile {
  totalEarnings: number;
  withdrawableBalance: number;
  pendingBalance: number;
  lifetimePlatformFees: number;
  eobiTracker: EobiTracker;
  paymentMethods: PaymentMethod[];
  currency: "PKR";
}

export interface EobiTracker {
  isRegistered: boolean;
  eobiNumber?: string;
  totalContributions: number;
  lastContributionDate?: Timestamp;
  contributionHistory: EobiContribution[];
}

export interface EobiContribution {
  amount: number;
  transactionId: string;
  gigId: string;
  date: Timestamp;
}

export interface PaymentMethod {
  id: string;
  type: "bank_account" | "mobile_wallet";
  last4: string;
  provider: string;
  isDefault: boolean;
  addedAt: string;
}

export interface WorkerAvailability {
  isAvailable: boolean;
  schedule: WeeklySchedule;
  preferredAreas: string[];
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
  start: string;
  end: string;
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

export interface EmployerProfile {
  companyName?: string;
  industry?: string;
  isVerified: boolean;
  totalHires: number;
  totalSpent: number;
  activeGigs: number;
  safetyScoring: EmployerSafetyScoring;
}

export interface EmployerSafetyScoring {
  overallScore: number;
  paymentReliability: number;
  disputeRate: number;
  workerFeedbackAvg: number;
  incidentCount: number;
  cancellationCount: number;
  completedGigCount: number;
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

export interface Gig {
  id: string;
  title: string;
  titleUrdu?: string;
  description: string;
  descriptionUrdu?: string;
  category: ServiceCategory;
  employerId: string;
  employerName: string;
  employerSafetyScore: number;
  location: GeoLocation;
  city: string;
  budget: PriceRange;
  duration: string;
  status: GigStatus;
  applicants: GigApplicant[];
  applicantCount: number;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  escrow: EscrowState;
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

export interface GigApplicant {
  workerId: string;
  workerName: string;
  workerPhotoURL?: string;
  workerRating: number;
  workerVerificationLevel: VerificationLevel;
  proposedRate?: number;
  proposedRateUnit?: "fixed" | "hourly" | "daily";
  coverNote?: string;
  availableFrom?: string;
  estimatedDuration?: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  appliedAt: Timestamp;
}

export interface EscrowState {
  isFunded: boolean;
  amount: number;
  currency: "PKR";
  fundingTransactionId?: string;
  releaseStatus: EscrowReleaseStatus;
  releaseTransactionId?: string;
  disputeLogId?: string;
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
// 6. SERVICE DIRECTORY
// ============================================================================

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

export interface Transaction {
  id: string;
  amount: number;
  currency: "PKR";
  type: TransactionType;
  sourceId: string;
  destinationId: string;
  relatedGigId?: string;
  status: TransactionStatus;
  idempotencyKey: string;
  integrityHash: string;
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// 8. AGENT DECISION LOG
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

export interface AgentDecisionLog {
  id: string;
  decisionType: AgentDecisionType;
  agentVersion: string;
  modelId: string;
  inputHash: string;
  outputHash: string;
  parentTraceId: string | null;
  sessionTraceId: string;
  traceChainHash: string;
  rationale: string;
  gigId?: string;
  workerId?: string;
  employerId?: string;
  confidence?: number;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  timestamp: Timestamp;
  triggeredBy: string;
}

// ============================================================================
// 9. REVIEW TYPES
// ============================================================================

export interface Review {
  id: string;
  gigId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: "worker" | "employer";
  revieweeId: string;
  revieweeName: string;
  rating: number;
  comment: string;
  commentUrdu?: string;
  evidence?: ReviewEvidence[];
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

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleUrdu: string;
  message: string;
  messageUrdu: string;
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

export interface AIJob {
  id: string;
  type: AIJobType;
  status: AIJobStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  userId: string;
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
