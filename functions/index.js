/**
 * ILA Gallery Cloud Functions — Enterprise Sync Queue Worker
 *
 * Designed to process submissions across Arges Registry, Intake Portal, and Art & Need.
 * Binds Firestore primary database writes with Google Sheets webhook reporting pools.
 */

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const fetch     = require('node-fetch');

// Lazy initialization: calling admin.initializeApp() + admin.firestore() at
// module top-level causes the Firebase CLI to hang during its 10-second load
// analysis window. Instead, initialize on first use inside a function call.
let _db = null;
function getDb() {
  if (!_db) {
    if (!admin.apps.length) admin.initializeApp();
    _db = admin.firestore();
  }
  return _db;
}


// ── Webhook Configurations ──────────────────────────────────────────────────
// Note: functions.config() is removed in firebase-functions v6.
// All config is now read from environment variables (set via:
//   firebase functions:secrets:set GOOGLE_SHEETS_WEBHOOK
//   firebase functions:secrets:set API_TOKEN
// or via .env files in the functions/ directory for non-secret values).
const GOOGLE_SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK || '';
const API_TOKEN                 = process.env.API_TOKEN || '';

/**
 * Dispatches a POST transaction to the Google Sheets Apps Script endpoint.
 */
async function sendToGoogleSheets(payload, sheetType, jobId) {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) {
    throw new Error('GOOGLE_SHEETS_WEBHOOK_URL is not configured in Firebase Cloud Functions env.');
  }

  // Sanitize binary fields before passing to standard POST (too large for Google Sheets cells)
  const cleanPayload = { ...payload };
  if (cleanPayload.workExamples) cleanPayload.workExamples = '[stored in Firestore]';
  if (cleanPayload.attachedBriefs) cleanPayload.attachedBriefs = '[stored in Firestore]';

  const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      submissionId: jobId || payload.id || 'N/A',
      payload: cleanPayload,
      token: API_TOKEN,
      sheetType: sheetType || cleanPayload.type || 'REGISTRY',
    }),
  });

  try {
    await getDb().collection("debug_logs").add({
      type: "SHEETS_RESPONSE",
      status: response.status,
      submissionId: jobId || payload.id || 'unknown',
      createdAt: Date.now()
    });
  } catch (err) {
    functions.logger.error('[SyncQueue] Failed to write SHEETS_RESPONSE to debug_logs:', err);
  }

  if (!response.ok) {
    throw new Error(`Google Sheets Webhook Sync failed: HTTP ${response.status}`);
  }

  return true;
}

/**
 * Triggers failure alerts inside the 'alerts' collection.
 */
async function triggerFailureAlert(job, error) {
  try {
    await getDb().collection('alerts').add({
      level: 'critical',
      message: error.message || String(error),
      job,
      createdAt: Date.now()
    });
    functions.logger.error(`[AlertSystem] CRITICAL SYNC FAILURE: ${error.message}`);
  } catch (err) {
    functions.logger.error('[AlertSystem] Failed to trigger failure alert:', err);
  }
}

/**
 * Retry worker logic: schedules incremental backoff or pushes to Dead Letter Queue (DLQ)
 */
async function handleRetry(snap, job, error) {
  const attempts = (job.attempts || 0) + 1;

  if (attempts >= 3) {
    // 1. Move to Dead Letter Queue
    try {
      await getDb().collection('dead_letter_queue').add({
        ...job,
        error: error.message || String(error),
        failedAt: Date.now()
      });
      functions.logger.warn(`[RetryWorker] Job ${snap.id} entered Dead Letter Queue (DLQ).`);
    } catch (dlqErr) {
      functions.logger.error('[RetryWorker] DLQ write failed:', dlqErr);
    }

    // 2. Set status to 'dead' (or failed)
    await snap.ref.update({
      status: 'dead',
      lastError: error.message || String(error),
      attempts
    });

    // 3. Trigger Critical failure alert
    await triggerFailureAlert(job, error);
    return;
  }

  // Dynamic backoff delay
  const delay = attempts * 3000;

  functions.logger.warn(`[RetryWorker] Retry attempt ${attempts}/3 scheduled in ${delay}ms for job: ${snap.id}`);

  await snap.ref.update({
    status: 'retry_pending',
    attempts,
    nextRetryAt: Date.now() + delay,
    lastError: error.message || String(error)
  });
}

// ── processSyncQueue trigger ────────────────────────────────────────────────
// Note: runWith() removed in firebase-functions v6; options are passed directly.
exports.processSyncQueue = functions
  .firestore
  .document('sync_queue/{jobId}')
  .onCreate(async (snap, context) => {
    const job = snap.data();
    const submissionId = context.params.jobId;

    try {
      await getDb().collection("debug_logs").add({
        type: "FUNCTION_STARTED",
        submissionId,
        createdAt: Date.now()
      });
    } catch (err) {
      functions.logger.error('[SyncQueue] Failed to write FUNCTION_STARTED:', err);
    }

    functions.logger.info(`[SyncQueue] Processing new job: ${submissionId}`);

    try {
      await sendToGoogleSheets(job.payload, job.targetSheet, snap.id);

      // Successful sync status update
      await snap.ref.update({
        status: 'success',
        processedAt: Date.now()
      });

      // Write transaction history to audit_logs
      await getDb().collection('audit_logs').add({
        type: 'sync_success',
        jobId: snap.id,
        createdAt: Date.now()
      });

      try {
        await getDb().collection("debug_logs").add({
          type: "FUNCTION_SUCCESS",
          submissionId,
          createdAt: Date.now()
        });
      } catch (err) {
        functions.logger.error('[SyncQueue] Failed to write FUNCTION_SUCCESS:', err);
      }

      functions.logger.info(`[SyncQueue] Successfully synchronized job: ${submissionId}`);

    } catch (error) {
      try {
        await getDb().collection("debug_logs").add({
          type: "FUNCTION_ERROR",
          submissionId,
          error: error.message || String(error),
          createdAt: Date.now()
        });
      } catch (err) {
        functions.logger.error('[SyncQueue] Failed to write FUNCTION_ERROR:', err);
      }

      await handleRetry(snap, job, error);
    }

    return null;
  });

// ── retryFailedJobs pubsub sweep trigger ────────────────────────────────────
exports.retryFailedJobs = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const now = Date.now();
    functions.logger.info('[SyncQueue] Running scheduled retry sweeping processor...');

    const snapshot = await getDb().collection('sync_queue')
      .where('status', '==', 'retry_pending')
      .get();

    functions.logger.info(`[SyncQueue] Sweeper found ${snapshot.size} job(s) in retry_pending state.`);

    for (const doc of snapshot.docs) {
      const job = doc.data();

      if (job.nextRetryAt <= now) {
        functions.logger.info(`[SyncQueue] Sweeper retrying job: ${doc.id}`);

        try {
          await getDb().collection("debug_logs").add({
            type: "FUNCTION_STARTED",
            submissionId: doc.id,
            createdAt: now
          });
        } catch (err) {}

        try {
          await sendToGoogleSheets(job.payload, job.targetSheet, doc.id);

          await doc.ref.update({
            status: 'success',
            processedAt: now
          });

          await getDb().collection('audit_logs').add({
            type: 'sync_success',
            jobId: doc.id,
            createdAt: now
          });

          try {
            await getDb().collection("debug_logs").add({
              type: "FUNCTION_SUCCESS",
              submissionId: doc.id,
              createdAt: now
            });
          } catch (err) {}

          functions.logger.info(`[SyncQueue] Scheduled sweeper successfully processed job: ${doc.id}`);

        } catch (error) {
          try {
            await getDb().collection("debug_logs").add({
              type: "FUNCTION_ERROR",
              submissionId: doc.id,
              error: error.message || String(error),
              createdAt: now
            });
          } catch (err) {}

          await handleRetry(doc, job, error);
        }
      }
    }

    return null;
  });

// ── HTTP API Endpoint: Client Event Logging ─────────────────────────────────
exports.api = functions.https.onRequest(async (req, res) => {
  // CORS Headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const path = req.path || req.url;
  if (path.endsWith('/debug-log')) {
    try {
      const payload = req.body || {};

      // Write full body to debug_logs collection with source: "frontend"
      await getDb().collection('debug_logs').add({
        ...payload,
        source: 'frontend',
        createdAt: Date.now()
      });

      // Also copy to audit_logs if payload contains standard client event properties
      if (payload.eventType) {
        await getDb().collection('audit_logs').add({
          type: 'client_event',
          eventType: payload.eventType,
          data: payload.data || {},
          clientTimestamp: payload.timestamp || new Date().toISOString(),
          url: payload.url || 'unknown',
          userAgent: payload.userAgent || 'unknown',
          createdAt: Date.now()
        });
      }

      functions.logger.info(`[API] Successfully logged debug event: ${payload.eventType || payload.type || 'unknown'}`);
      res.status(200).json({ success: true });
    } catch (err) {
      functions.logger.error('[API] Debug log write failed:', err);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.status(404).send('Not Found');
  }
});

// ── helper for healthCheck alerts ──────────────────────────────────────────
async function sendAlert(message) {
  try {
    await getDb().collection('alerts').add({
      level: 'critical',
      message,
      createdAt: Date.now()
    });
    functions.logger.error(`[AlertSystem] healthCheck alert triggered: ${message}`);
  } catch (err) {
    functions.logger.error('[AlertSystem] Failed to write alert:', err);
  }
}

// ── healthCheck scheduled sweep trigger ─────────────────────────────────────
exports.healthCheck = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    try {
      const deadJobs = await db
        .collection("sync_queue")
        .where("status", "in", ["failed", "dead"])
        .get();

      if (deadJobs.size > 0) {
        await sendAlert(`${deadJobs.size} sync failures detected`);
      }
    } catch (err) {
      functions.logger.error('[healthCheck] Failed to run sweep:', err);
    }
    return null;
  });

// ── Admin Role Management (SECURE) ──────────────────────────────────────────
//
// SECURITY MODEL:
//   Admin status is stored ONLY as a Firebase Custom Auth Claim (server-side,
//   set exclusively via the Admin SDK). The Firestore `role` field on a
//   /users/{uid} document is a DISPLAY MIRROR written here by the Admin SDK —
//   it is NOT used by Firestore security rules to grant access.
//
//   The corrected firestore.rules checks ONLY:
//     request.auth.token.admin == true
//   and explicitly blocks client writes to `role`, `isAdmin`, or `admin` fields.
//
// USAGE (client-side, authenticated as an existing admin):
//   const setAdminRole = httpsCallable(getFunctions(), 'setAdminRole');
//   await setAdminRole({ targetUid: 'uid-here', grant: true });   // promote
//   await setAdminRole({ targetUid: 'uid-here', grant: false });  // revoke

exports.setAdminRole = functions.https.onCall(async (data, context) => {
  // ── 1. Require caller to be an authenticated existing admin ─────────────────
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only existing admins can assign or revoke the admin role.'
    );
  }

  const { targetUid, grant } = data;

  if (!targetUid || typeof targetUid !== 'string' || targetUid.trim() === '') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'targetUid must be a non-empty string.'
    );
  }
  if (typeof grant !== 'boolean') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'grant must be a boolean (true = promote, false = revoke).'
    );
  }

  // ── 2. Verify the target user actually exists ───────────────────────────────
  let targetUser;
  try {
    targetUser = await admin.auth().getUser(targetUid);
  } catch (err) {
    throw new functions.https.HttpsError(
      'not-found',
      `No Firebase Auth user found with uid "${targetUid}".`
    );
  }

  // ── 3. Set (or revoke) the custom claim via Admin SDK ──────────────────────
  //      This is the ONLY authoritative source of admin status.
  //      Firestore rules DO NOT fall back to a role field anymore.
  await admin.auth().setCustomUserClaims(targetUid, { admin: grant });

  // ── 4. Mirror role to Firestore user doc for UI display ONLY ───────────────
  //      This write uses the Admin SDK (bypasses client-facing rules).
  //      The display value is not trusted by security rules — the claim is.
  await admin.firestore().collection('users').doc(targetUid).set(
    {
      role: grant ? 'admin' : 'user',
      roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      roleUpdatedBy: context.auth.uid,
    },
    { merge: true }
  );

  // ── 5. Write immutable audit log entry ─────────────────────────────────────
  await admin.firestore().collection('audit_logs').add({
    action: grant ? 'ADMIN_ROLE_GRANTED' : 'ADMIN_ROLE_REVOKED',
    targetUid,
    targetEmail: targetUser.email || null,
    grantedBy: context.auth.uid,
    grantedByEmail: context.auth.token.email || null,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  functions.logger.info(
    `[setAdminRole] ${grant ? 'GRANTED' : 'REVOKED'} admin for uid=${targetUid} by uid=${context.auth.uid}`
  );

  return { success: true, targetUid, admin: grant };
});

