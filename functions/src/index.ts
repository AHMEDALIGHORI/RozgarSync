import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import * as crypto from "crypto";
import type {
  Gig,
  Transaction,
  TransactionType,
  TransactionStatus,
  WorkerPrivateData,
  AgentDecisionLog,
  AgentDecisionType,
  EobiContribution,
} from "./types";

admin.initializeApp();
const db = admin.firestore();

// --- Constants ---
const PLATFORM_FEE_PERCENTAGE = 0.05; // 5%
const EOBI_CONTRIBUTION_PERCENTAGE = 0.05; // 5%
const SYSTEM_FEE_ACCOUNT = "SYSTEM_FEE_ACCOUNT";
const SYSTEM_EOBI_ACCOUNT = "SYSTEM_EOBI_ACCOUNT";

// ============================================================================
// UTILITY: SHA-256 hash of a string
// ============================================================================
function sha256(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

// ============================================================================
// UTILITY: Generate idempotency key for transactions
// ============================================================================
function generateIdempotencyKey(
  action: string,
  gigId: string,
  uid: string
): string {
  return sha256(`${action}:${gigId}:${uid}:${Date.now()}`);
}

// ============================================================================
// UTILITY: Compute transaction integrity hash
// ============================================================================
function computeIntegrityHash(
  amount: number,
  type: TransactionType,
  sourceId: string,
  destinationId: string,
  idempotencyKey: string
): string {
  return sha256(
    `${amount}|${type}|${sourceId}|${destinationId}|${idempotencyKey}`
  );
}

// ============================================================================
// UTILITY: Build a Transaction document
// ============================================================================
function buildTransaction(params: {
  amount: number;
  type: TransactionType;
  sourceId: string;
  destinationId: string;
  relatedGigId: string;
  status: TransactionStatus;
  description: string;
  idempotencyKey: string;
}): Omit<Transaction, "id"> & { id: string } {
  const ref = db.collection("transactions").doc();
  const integrityHash = computeIntegrityHash(
    params.amount,
    params.type,
    params.sourceId,
    params.destinationId,
    params.idempotencyKey
  );
  return {
    id: ref.id,
    amount: params.amount,
    currency: "PKR",
    type: params.type,
    sourceId: params.sourceId,
    destinationId: params.destinationId,
    relatedGigId: params.relatedGigId,
    status: params.status,
    idempotencyKey: params.idempotencyKey,
    integrityHash,
    description: params.description,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

// ============================================================================
// MANAGE GIG ESCROW (FUND & RELEASE)
// ============================================================================
export const manageGigEscrow = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { gigId, action } = request.data;
  if (!gigId || !["fund", "release"].includes(action)) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid gigId or action (fund/release)."
    );
  }

  const uid = request.auth.uid;
  const gigRef = db.collection("gigs").doc(gigId);
  const batch = db.batch();

  try {
    const gigSnap = await gigRef.get();
    if (!gigSnap.exists) {
      throw new HttpsError("not-found", "Gig not found.");
    }

    const gig = gigSnap.data() as Gig;

    if (gig.employerId !== uid) {
      throw new HttpsError(
        "permission-denied",
        "Only the employer can manage escrow."
      );
    }

    if (action === "fund") {
      // --- FUND ESCROW ---
      if (gig.escrow.isFunded) {
        throw new HttpsError("failed-precondition", "Gig is already funded.");
      }

      const idempotencyKey = generateIdempotencyKey("fund", gigId, uid);
      const tx = buildTransaction({
        amount: gig.escrow.amount,
        type: "escrow_deposit",
        sourceId: uid,
        destinationId: gigId,
        relatedGigId: gigId,
        status: "completed",
        description: `Escrow deposit for gig ${gigId}`,
        idempotencyKey,
      });

      const txRef = db.collection("transactions").doc(tx.id);
      batch.set(txRef, tx);
      batch.update(gigRef, {
        "escrow.isFunded": true,
        "escrow.fundingTransactionId": tx.id,
        "escrow.releaseStatus": "funded",
        "escrow.fundedAt": FieldValue.serverTimestamp(),
        status: "assigned",
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else if (action === "release") {
      // --- RELEASE ESCROW ---
      if (
        !gig.escrow.isFunded ||
        gig.escrow.releaseStatus === "released"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Escrow not funded or already released."
        );
      }
      if (!gig.assignedWorkerId) {
        throw new HttpsError(
          "failed-precondition",
          "No worker assigned to release funds to."
        );
      }

      const totalAmount = gig.escrow.amount;
      const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENTAGE);
      const eobiContribution = Math.round(
        totalAmount * EOBI_CONTRIBUTION_PERCENTAGE
      );
      const workerPayout = totalAmount - platformFee - eobiContribution;
      const workerId = gig.assignedWorkerId;

      // 1. Escrow Release → Worker
      const releaseKey = generateIdempotencyKey("release", gigId, uid);
      const releaseTx = buildTransaction({
        amount: workerPayout,
        type: "escrow_release",
        sourceId: gigId,
        destinationId: workerId,
        relatedGigId: gigId,
        status: "completed",
        description: `Worker payout (90%) for gig ${gigId}`,
        idempotencyKey: releaseKey,
      });
      batch.set(db.collection("transactions").doc(releaseTx.id), releaseTx);

      // 2. Platform Fee → System
      const feeKey = generateIdempotencyKey("fee", gigId, uid);
      const feeTx = buildTransaction({
        amount: platformFee,
        type: "platform_fee",
        sourceId: gigId,
        destinationId: SYSTEM_FEE_ACCOUNT,
        relatedGigId: gigId,
        status: "completed",
        description: `Platform fee (5%) for gig ${gigId}`,
        idempotencyKey: feeKey,
      });
      batch.set(db.collection("transactions").doc(feeTx.id), feeTx);

      // 3. EOBI Contribution → EOBI Pool
      const eobiKey = generateIdempotencyKey("eobi", gigId, uid);
      const eobiTx = buildTransaction({
        amount: eobiContribution,
        type: "eobi_contribution",
        sourceId: workerId,
        destinationId: SYSTEM_EOBI_ACCOUNT,
        relatedGigId: gigId,
        status: "completed",
        description: `EOBI contribution (5%) for gig ${gigId}`,
        idempotencyKey: eobiKey,
      });
      batch.set(db.collection("transactions").doc(eobiTx.id), eobiTx);

      // 4. Update Gig Status
      batch.update(gigRef, {
        status: "completed",
        "escrow.releaseStatus": "released",
        "escrow.releaseTransactionId": releaseTx.id,
        "escrow.releasedAmount": workerPayout,
        "escrow.releasedAt": FieldValue.serverTimestamp(),
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 5. Update Worker's Financial Profile (Private Data)
      const workerPrivateRef = db
        .collection("users")
        .doc(workerId)
        .collection("private")
        .doc("data");

      // Build the new EOBI contribution entry
      const eobiEntry: EobiContribution = {
        amount: eobiContribution,
        transactionId: eobiTx.id,
        gigId,
        date: Timestamp.now(),
      };

      // Atomically update financial totals + append EOBI history
      batch.set(
        workerPrivateRef,
        {
          financialProfile: {
            totalEarnings: FieldValue.increment(workerPayout),
            withdrawableBalance: FieldValue.increment(workerPayout),
            lifetimePlatformFees: FieldValue.increment(platformFee),
            eobiTracker: {
              totalContributions: FieldValue.increment(eobiContribution),
              lastContributionDate: FieldValue.serverTimestamp(),
              contributionHistory: FieldValue.arrayUnion(eobiEntry),
            },
          },
        },
        { merge: true }
      );
    }

    await batch.commit();
    return { success: true, message: `Gig escrow ${action}ed successfully.` };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "An error occurred.";
    console.error(`Error in manageGigEscrow (${action}):`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", msg);
  }
});

// ============================================================================
// LOG AGENT DECISION (IMMUTABLE AUDIT TRAIL)
// ============================================================================
export const logAgentDecision = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const {
    decisionType,
    agentVersion,
    modelId,
    inputHash,
    outputHash,
    parentTraceId,
    sessionTraceId,
    rationale,
    gigId,
    workerId,
    employerId,
    confidence,
    latencyMs,
    inputTokens,
    outputTokens,
  } = request.data;

  // Validate required fields
  if (
    !decisionType ||
    !agentVersion ||
    !modelId ||
    !inputHash ||
    !outputHash ||
    !sessionTraceId ||
    !rationale
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required audit fields: decisionType, agentVersion, modelId, inputHash, outputHash, sessionTraceId, rationale."
    );
  }

  // Validate decisionType enum
  const validTypes: AgentDecisionType[] = [
    "skill_matching",
    "price_suggestion",
    "demand_forecast",
    "route_optimization",
    "review_sentiment",
    "fraud_detection",
    "dispute_resolution",
    "safety_scoring",
    "gig_recommendation",
    "employer_risk_assessment",
  ];
  if (!validTypes.includes(decisionType)) {
    throw new HttpsError(
      "invalid-argument",
      `Invalid decisionType: ${decisionType}`
    );
  }

  // Compute the trace chain hash:
  // SHA-256(parentTraceId + inputHash + outputHash)
  // This creates a tamper-evident chain.
  const chainInput = `${parentTraceId || "ROOT"}|${inputHash}|${outputHash}`;
  const traceChainHash = sha256(chainInput);

  const logRef = db.collection("agent_decision_logs").doc();
  const log: AgentDecisionLog = {
    id: logRef.id,
    decisionType,
    agentVersion,
    modelId,
    inputHash,
    outputHash,
    parentTraceId: parentTraceId || null,
    sessionTraceId,
    traceChainHash,
    rationale,
    gigId: gigId || undefined,
    workerId: workerId || undefined,
    employerId: employerId || undefined,
    confidence: confidence ?? undefined,
    latencyMs: latencyMs ?? undefined,
    inputTokens: inputTokens ?? undefined,
    outputTokens: outputTokens ?? undefined,
    timestamp: Timestamp.now(),
    triggeredBy: request.auth.uid,
  };

  try {
    await logRef.set(log);
    return {
      success: true,
      logId: logRef.id,
      traceChainHash,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to write audit log.";
    console.error("Error logging agent decision:", error);
    throw new HttpsError("internal", msg);
  }
});

// ============================================================================
// VERIFY TRACE CHAIN INTEGRITY
// ============================================================================
/**
 * Callable function that verifies the integrity of an agent decision
 * trace chain for a given session.
 *
 * It reads all logs for the sessionTraceId, re-computes each
 * traceChainHash, and reports any mismatches.
 */
export const verifyTraceChain = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  // Only admins can verify chains
  if (!request.auth.token.admin) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can verify trace chains."
    );
  }

  const { sessionTraceId } = request.data;
  if (!sessionTraceId) {
    throw new HttpsError("invalid-argument", "sessionTraceId is required.");
  }

  try {
    const snapshot = await db
      .collection("agent_decision_logs")
      .where("sessionTraceId", "==", sessionTraceId)
      .orderBy("timestamp", "asc")
      .get();

    if (snapshot.empty) {
      return { valid: false, error: "No logs found for this session." };
    }

    const logs = snapshot.docs.map((doc) => doc.data() as AgentDecisionLog);
    const mismatches: Array<{
      logId: string;
      expected: string;
      actual: string;
    }> = [];

    for (const log of logs) {
      const expectedHash = sha256(
        `${log.parentTraceId || "ROOT"}|${log.inputHash}|${log.outputHash}`
      );

      if (expectedHash !== log.traceChainHash) {
        mismatches.push({
          logId: log.id,
          expected: expectedHash,
          actual: log.traceChainHash,
        });
      }
    }

    return {
      valid: mismatches.length === 0,
      totalLogs: logs.length,
      mismatches,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Verification failed.";
    console.error("Error verifying trace chain:", error);
    throw new HttpsError("internal", msg);
  }
});
