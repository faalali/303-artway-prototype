import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Log analytics event to Firestore.
 * @param {string} eventType  — Action/Category name
 * @param {object} metadata   — Associated details
 */
export async function trackAnalytics(eventType, metadata = {}) {
  try {
    await addDoc(collection(db, 'analytics'), {
      eventType,
      metadata,
      createdAt: Date.now()
    });
    console.log(`[Analytics] Tracked event: ${eventType}`);
  } catch (err) {
    console.error('[Analytics] Failed tracking event:', err);
  }
}
