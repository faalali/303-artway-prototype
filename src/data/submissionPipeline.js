/**
 * submissionPipeline.js — Guaranteed 4-step delivery pipeline with timeouts
 *
 * EXACT FLOW:
 *   1. Validate form fields (never send nulls/undefined)
 *   2. Write to Firestore (submissions/{type}/{docId})  ← PRIMARY, must succeed (10s timeout)
 *   3. Only after success → enqueue to sync_queue       ← jobId = uid + timestamp
 *   4. Cloud Function picks up queue → Google Sheets
 *
 * USER MESSAGES (exact):
 *   Firebase success + queued : "Submission saved successfully."
 *   Firebase success + queued : "Saved successfully. Backup sync is in progress."
 *   Firebase failure          : "Submission failed. Please try again."
 *
 * Collections:
 *   submissions_registry/{docId}   — Artist Registry
 *   submissions_intake/{docId}     — Intake Portal
 *   submissions_artNeeds/{docId}   — Art & Need / RFQ
 *   sync_queue/{uid}_{timestamp}   — Worker queue
 */

import { db, ensureAuth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { saveArtist, saveFundingSource } from './mockDatabase';
import { logClientEvent } from '../enterprise/auditLogger';

const API_TOKEN = import.meta.env.VITE_API_ACCESS_TOKEN || '';

/** Helper to wrap a promise in a timeout */
function withTimeout(promise, timeoutMs, errorMessage = 'Operation timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs))
  ]);
}

/** Remove undefined/null, convert arrays → keep as-is (Firestore handles arrays) */
function cleanPayload(data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    // Strip base64 blobs from Firestore doc — too large, store as reference flag
    if (k === 'base64Data') { out[k] = '[stored separately]'; continue; }
    out[k] = v;
  }
  return out;
}

/** Build job document for sync_queue */
function buildQueueJob(uid, payload, targetSheet) {
  const jobId = `${uid}_${Date.now()}`;
  return {
    jobId,
    payload: cleanPayload(payload),
    targetSheet,
    attempts:    0,
    status:      'pending',
    lastError:   null,
    createdAt:   Date.now(),
    nextRetryAt: Date.now(),
  };
}

// ── ARTIST REGISTRY ───────────────────────────────────────────────────────────

/**
 * @param {object}   formData      — raw form fields
 * @param {function} onStageChange — (stage, message) → void
 *
 * Stages: 'validating' | 'saving' | 'queuing' | 'success' | 'firebase_error' | 'sheets_pending'
 */
export async function submitArtistPipeline(formData, onStageChange = () => {}) {
  // Telemetry is non-blocking (fire-and-forget)
  logClientEvent("FORM_SUBMIT_STARTED", {
    portal: "artist_registry",
    email: formData.email
  });

  try {
    // ── 1. Validate ─────────────────────────────────────────────────────────────
    onStageChange('validating', 'Validating your information...');

    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      onStageChange('firebase_error', 'Submission failed. Please try again.');
      logClientEvent("FORM_SUBMIT_FAILED", {
        error: 'First name and last name are required.'
      });
      return { success: false, error: 'First name and last name are required.' };
    }
    if (!formData.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      onStageChange('firebase_error', 'Submission failed. Please try again.');
      logClientEvent("FORM_SUBMIT_FAILED", {
        error: 'A valid email address is required.'
      });
      return { success: false, error: 'A valid email address is required.' };
    }

    // ── 2. Auth ──────────────────────────────────────────────────────────────────
    let uid = 'anonymous';
    try {
      uid = await ensureAuth();
    } catch (e) {
      console.warn('[Pipeline] Auth skipped:', e.message);
    }

    // Build normalized payload
    const year    = new Date().getFullYear();
    const suffix  = String(Date.now()).slice(-5) + Math.floor(Math.random() * 10);
    const docId   = formData.id || `ILA-${year}-${suffix}`;
    const payload = cleanPayload({ ...formData, id: docId, token: API_TOKEN });

    // ── 3. Firebase Write (PRIMARY — must succeed before anything else) ──────────
    onStageChange('saving', 'Saving to database...');

    let firestoreId = null;
    try {
      const docRef = await withTimeout(
        addDoc(collection(db, 'submissions_registry'), {
          ...payload,
          createdAt: new Date().toISOString(),
          submitterUid: uid,
          formType: 'REGISTRY',
        }),
        10000,
        'Database write timed out. Please check your connection and try again.'
      );
      firestoreId = docRef.id;
      console.log(`[Firebase] ✓ Write success: submissions_registry/${firestoreId}`);
      logClientEvent("FORM_SUBMIT_SUCCESS", {
        submissionId: firestoreId
      });
    } catch (err) {
      console.error('[Firebase] ✗ Artist write FAILED:', {
        error:   err.message,
        code:    err.code,
        email:   formData.email,
      });
      onStageChange('firebase_error', 'Submission failed. Please try again.');
      logClientEvent("FORM_SUBMIT_FAILED", {
        error: err.message
      });
      return { success: false, stage: 'firebase', error: err.message };
    }

    // ── 4. Cache in localStorage (non-blocking, best-effort) ───────────────────
    try {
      const { list: updatedList, savedId } = saveArtist({ ...payload, id: docId });
      var savedArtist = updatedList.find(a => a.id === savedId) || updatedList[updatedList.length - 1];
      var updatedArtists = updatedList;
    } catch (cacheErr) {
      console.warn('[Pipeline] localStorage cache failed (non-fatal):', cacheErr.message);
    }

    // ── 5. Enqueue to sync_queue (ONLY after Firebase success) ─────────────────
    onStageChange('queuing', 'Queuing backup sync...');

    try {
      const job = buildQueueJob(uid, { ...payload, firestoreId }, 'REGISTRY');
      
      await withTimeout(
        addDoc(collection(db, 'sync_queue'), job),
        8000,
        'Sync queue database write timed out.'
      );
      console.log(`[SyncQueue] ✓ Job enqueued: ${job.jobId} → REGISTRY`);

      try {
        await withTimeout(
          addDoc(collection(db, 'debug_logs'), {
            type: 'QUEUE_CREATED',
            submissionId: firestoreId,
            createdAt: Date.now()
          }),
          5000,
          'Debug logs write timed out.'
        );
      } catch (logErr) {
        console.warn('[Pipeline] Telemetry debug log skipped:', logErr.message);
      }

      // Firebase succeeded + Sheets job queued = SUCCESS
      onStageChange('success', 'Submission saved successfully.');
      return {
        success:      true,
        firestoreId,
        savedArtist,
        updated:      updatedArtists,
        sheetsSynced: false,   // Cloud Function handles this async
        sheetsQueued: true,
        message:      'Submission saved successfully.',
      };

    } catch (queueErr) {
      // Firebase write succeeded but queue enqueue failed
      // Data is safe in Firestore — do NOT show full failure
      console.error('[SyncQueue] ✗ Enqueue failed (Firebase write was successful):', queueErr.message);
      onStageChange('sheets_pending', 'Saved successfully. Backup sync is in progress.');
      return {
        success:      true,
        firestoreId,
        savedArtist,
        updated:      updatedArtists,
        sheetsSynced: false,
        sheetsQueued: false,
        message:      'Saved successfully. Backup sync is in progress.',
      };
    }
  } catch (error) {
    console.error('[Pipeline] Unexpected error in artist pipeline:', error);
    logClientEvent("FORM_SUBMIT_FAILED", {
      error: error.message
    });
    onStageChange('firebase_error', 'Submission failed. Please try again.');
    return { success: false, error: error.message };
  }
}

// ── OPPORTUNITY / ART & NEED ──────────────────────────────────────────────────

/**
 * @param {object}   opportunityData — raw opportunity fields
 * @param {function} onStageChange    — (stage, message) → void
 */
export async function submitOpportunityPipeline(opportunityData, onStageChange = () => {}) {
  logClientEvent("FORM_SUBMIT_STARTED", {
    portal: "art_need",
    email: opportunityData.contactEmail || opportunityData.email
  });

  try {
    onStageChange('validating', 'Validating your information...');

    if (!opportunityData.title?.trim()) {
      onStageChange('firebase_error', 'Submission failed. Please try again.');
      logClientEvent("FORM_SUBMIT_FAILED", {
        error: 'Title is required.'
      });
      return { success: false, error: 'Title is required.' };
    }

    let uid = 'anonymous';
    try { uid = await ensureAuth(); } catch (e) { /* non-fatal */ }

    const payload = cleanPayload({ ...opportunityData, token: API_TOKEN });

    onStageChange('saving', 'Saving to database...');

    let firestoreId = null;
    try {
      const docRef = await withTimeout(
        addDoc(collection(db, 'submissions_artNeeds'), {
          ...payload,
          createdAt:    new Date().toISOString(),
          submitterUid: uid,
          formType:     'ART_NEED',
        }),
        10000,
        'Database write timed out. Please check your connection and try again.'
      );
      firestoreId = docRef.id;
      console.log(`[Firebase] ✓ Write success: submissions_artNeeds/${firestoreId}`);
      logClientEvent("FORM_SUBMIT_SUCCESS", {
        submissionId: firestoreId
      });
    } catch (err) {
      console.error('[Firebase] ✗ Opportunity write FAILED:', { error: err.message, code: err.code });
      onStageChange('firebase_error', 'Submission failed. Please try again.');
      logClientEvent("FORM_SUBMIT_FAILED", {
        error: err.message
      });
      return { success: false, stage: 'firebase', error: err.message };
    }

    try { saveFundingSource(payload); } catch (e) { /* non-fatal cache */ }

    onStageChange('queuing', 'Queuing backup sync...');

    try {
      const job = buildQueueJob(uid, { ...payload, firestoreId }, 'ART_NEED');
      
      await withTimeout(
        addDoc(collection(db, 'sync_queue'), job),
        8000,
        'Sync queue write timed out.'
      );
      console.log(`[SyncQueue] ✓ Job enqueued: ${job.jobId} → ART_NEED`);

      try {
        await withTimeout(
          addDoc(collection(db, 'debug_logs'), {
            type: 'QUEUE_CREATED',
            submissionId: firestoreId,
            createdAt: Date.now()
          }),
          5000,
          'Debug logs write timed out.'
        );
      } catch (logErr) {
        console.warn('[Pipeline] Telemetry debug log skipped:', logErr.message);
      }

      onStageChange('success', 'Submission saved successfully.');
      return { success: true, firestoreId, sheetsSynced: false, sheetsQueued: true, message: 'Submission saved successfully.' };

    } catch (queueErr) {
      console.error('[SyncQueue] ✗ Enqueue failed (Firebase write was successful):', queueErr.message);
      onStageChange('sheets_pending', 'Saved successfully. Backup sync is in progress.');
      return { success: true, firestoreId, sheetsSynced: false, sheetsQueued: false, message: 'Saved successfully. Backup sync is in progress.' };
    }
  } catch (error) {
    console.error('[Pipeline] Unexpected error in opportunity pipeline:', error);
    logClientEvent("FORM_SUBMIT_FAILED", {
      error: error.message
    });
    onStageChange('firebase_error', 'Submission failed. Please try again.');
    return { success: false, error: error.message };
  }
}

// ── INTAKE PORTAL ─────────────────────────────────────────────────────────────

/**
 * @param {object}   intakeData    — raw intake fields
 * @param {function} onStageChange — (stage, message) → void
 */
export async function submitIntakePipeline(intakeData, onStageChange = () => {}) {
  logClientEvent("FORM_SUBMIT_STARTED", {
    portal: "intake",
    email: intakeData.email
  });

  try {
    onStageChange('validating', 'Validating your information...');

    if (!intakeData.name?.trim() && !intakeData.firstName?.trim()) {
      onStageChange('firebase_error', 'Submission failed. Please try again.');
      logClientEvent("FORM_SUBMIT_FAILED", {
        error: 'Name is required.'
      });
      return { success: false, error: 'Name is required.' };
    }

    let uid = 'anonymous';
    try { uid = await ensureAuth(); } catch (e) { /* non-fatal */ }

    const payload = cleanPayload({ ...intakeData, token: API_TOKEN });

    onStageChange('saving', 'Saving to database...');

    let firestoreId = null;
    try {
      const docRef = await withTimeout(
        addDoc(collection(db, 'submissions_intake'), {
          ...payload,
          createdAt:    new Date().toISOString(),
          submitterUid: uid,
          formType:     'INTAKE',
        }),
        10000,
        'Database write timed out. Please check your connection and try again.'
      );
      firestoreId = docRef.id;
      console.log(`[Firebase] ✓ Write success: submissions_intake/${firestoreId}`);
      logClientEvent("FORM_SUBMIT_SUCCESS", {
        submissionId: firestoreId
      });
    } catch (err) {
      console.error('[Firebase] ✗ Intake write FAILED:', { error: err.message, code: err.code });
      onStageChange('firebase_error', 'Submission failed. Please try again.');
      logClientEvent("FORM_SUBMIT_FAILED", {
        error: err.message
      });
      return { success: false, stage: 'firebase', error: err.message };
    }

    onStageChange('queuing', 'Queuing backup sync...');

    try {
      const job = buildQueueJob(uid, { ...payload, firestoreId }, 'INTAKE');
      
      await withTimeout(
        addDoc(collection(db, 'sync_queue'), job),
        8000,
        'Sync queue write timed out.'
      );
      console.log(`[SyncQueue] ✓ Job enqueued: ${job.jobId} → INTAKE`);

      try {
        await withTimeout(
          addDoc(collection(db, 'debug_logs'), {
            type: 'QUEUE_CREATED',
            submissionId: firestoreId,
            createdAt: Date.now()
          }),
          5000,
          'Debug logs write timed out.'
        );
      } catch (logErr) {
        console.warn('[Pipeline] Telemetry debug log skipped:', logErr.message);
      }

      onStageChange('success', 'Submission saved successfully.');
      return { success: true, firestoreId, sheetsQueued: true, message: 'Submission saved successfully.' };
    } catch (queueErr) {
      console.error('[SyncQueue] ✗ Enqueue failed:', queueErr.message);
      onStageChange('sheets_pending', 'Saved successfully. Backup sync is in progress.');
      return { success: true, firestoreId, sheetsQueued: false, message: 'Saved successfully. Backup sync is in progress.' };
    }
  } catch (error) {
    console.error('[Pipeline] Unexpected error in intake pipeline:', error);
    logClientEvent("FORM_SUBMIT_FAILED", {
      error: error.message
    });
    onStageChange('firebase_error', 'Submission failed. Please try again.');
    return { success: false, error: error.message };
  }
}
