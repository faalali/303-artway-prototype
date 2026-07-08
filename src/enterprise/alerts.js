import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Trigger failure alert in Firestore.
 * Used when a queue job hits 3 failed retries.
 *
 * @param {object} job   — Job details
 * @param {object} error — Sync error details
 */
export async function triggerFailureAlert(job, error) {
  try {
    await addDoc(collection(db, 'alerts'), {
      level: 'critical',
      message: error.message || String(error),
      job,
      createdAt: Date.now()
    });
    console.error('CRITICAL FAILURE ALERT:', error.message);
  } catch (err) {
    console.error('[Alerts] Failed saving alert document:', err);
  }
}
