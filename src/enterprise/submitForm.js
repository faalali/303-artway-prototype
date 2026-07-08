import {
  addDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore';

import { db } from '../firebase';

/**
 * Standard enterprise form submission handler.
 * Writes to Firestore submissions collection first, and then creates a sync job.
 *
 * @param {object} data  — Raw payload
 * @param {string} type  — 'REGISTRY' | 'INTAKE' | 'ART_NEED'
 */
export async function submitForm(data, type) {
  try {
    const duplicateKey = `${data.email || 'anonymous'}_${type}`;

    const payload = {
      ...data,
      type,
      duplicateKey,
      status: 'submitted',
      createdAt: serverTimestamp()
    };

    // 1. Primary write to Firestore submissions collection
    const submission = await addDoc(
      collection(db, 'submissions'),
      payload
    );

    console.log(`[submitForm] Submission saved: submissions/${submission.id}`);

    // 2. Queue sync job for Google Sheets integration
    const jobRef = await addDoc(collection(db, 'sync_queue'), {
      submissionId: submission.id,
      payload,
      targetSheet: type,
      status: 'pending',
      attempts: 0,
      createdAt: Date.now(),
      nextRetryAt: Date.now()
    });

    console.log(`[submitForm] Sync job enqueued: sync_queue/${jobRef.id}`);

    return {
      success: true,
      submissionId: submission.id,
      jobId: jobRef.id
    };

  } catch (error) {
    console.error('[submitForm] Submission pipeline failed:', error);

    return {
      success: false,
      error: error.message
    };
  }
}
