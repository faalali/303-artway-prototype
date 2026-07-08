/**
 * syncQueue.js — Firestore-backed retry queue for failed Google Sheets syncs
 *
 * When the Google Sheets sync fails after 3 exponential-backoff retries,
 * the payload is enqueued here in Firestore. The queue is drained automatically:
 *   - When the admin dashboard loads (see App.jsx → drainSyncQueue())
 *   - When the browser comes back online (navigator 'online' event)
 *   - Manually via retrySheetSync()
 */
import { db, ensureAuth } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';

const QUEUE_COLLECTION = 'sync_queue';
const SHEETS_URL = import.meta.env.VITE_GOOGLE_SHEETS_SCRIPT_URL;
const API_TOKEN  = import.meta.env.VITE_API_ACCESS_TOKEN;

/**
 * Add a failed Sheets sync payload to the Firestore queue.
 * @param {object} payload  — The same payload object that failed to sync
 * @param {string} type     — 'artist' | 'opportunity'
 * @returns {string} queueDocId
 */
export async function enqueue(payload, type = 'artist') {
  try {
    await ensureAuth();
    const docRef = await addDoc(collection(db, QUEUE_COLLECTION), {
      type,
      payload,
      createdAt: serverTimestamp(),
      attempts: 0,
      lastError: null,
    });
    console.log(`[SyncQueue] Enqueued ${type} ${payload.id} for retry. Queue doc: ${docRef.id}`);
    return docRef.id;
  } catch (err) {
    // Queue enqueue itself failed — log and continue (Firebase might be offline too)
    console.error('[SyncQueue] Failed to enqueue item:', err);
    return null;
  }
}

/**
 * Attempt to sync a single item to Google Sheets.
 * Uses CORS-enabled GET with base64 payload so we can read the response status.
 */
async function syncItemToSheets(item) {
  const { type, payload } = item;

  // Strip base64 attachments from the Sheets payload (too large for URL params)
  const cleanPayload = { ...payload };
  if (cleanPayload.attachedBriefs) {
    cleanPayload.attachedBriefs = (cleanPayload.attachedBriefs || []).map(f => ({
      name: f.name,
      type: f.type,
      size: f.size,
      base64Data: '[Attachment]',
    }));
  }
  if (cleanPayload.workExamples) {
    cleanPayload.workExamples = (cleanPayload.workExamples || []).map(e => ({
      ...e,
      base64Data: '[Image]',
    }));
  }

  const action = type === 'artist' ? 'syncArtist' : 'syncOpportunity';
  const encodedPayload = btoa(JSON.stringify(cleanPayload));
  const url = `${SHEETS_URL}?action=${action}&token=${encodeURIComponent(API_TOKEN)}&data=${encodeURIComponent(encodedPayload)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Sheets returned success:false');
    return { success: true };
  } catch (err) {
    clearTimeout(timeout);
    return { success: false, error: err.message };
  }
}

/**
 * Drain all items from the sync_queue Firestore collection.
 * Called on admin login and when the browser comes back online.
 * Returns { drained, failed } counts.
 */
export async function drainQueue() {
  let drained = 0;
  let failed  = 0;

  try {
    await ensureAuth();
    const q = query(
      collection(db, QUEUE_COLLECTION),
      orderBy('createdAt', 'asc'),
      limit(50),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('[SyncQueue] Queue is empty — nothing to drain.');
      return { drained: 0, failed: 0 };
    }

    console.log(`[SyncQueue] Draining ${snapshot.size} queued item(s)...`);

    for (const qDoc of snapshot.docs) {
      const item = qDoc.data();
      const result = await syncItemToSheets(item);
      if (result.success) {
        await deleteDoc(doc(db, QUEUE_COLLECTION, qDoc.id));
        console.log(`[SyncQueue] ✓ Drained queue item ${qDoc.id} (${item.type})`);
        drained++;
      } else {
        console.warn(`[SyncQueue] ✗ Queue item ${qDoc.id} still failing:`, result.error);
        failed++;
      }
    }
  } catch (err) {
    console.error('[SyncQueue] drainQueue error:', err);
  }

  return { drained, failed };
}

export { syncItemToSheets };
