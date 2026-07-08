/**
 * offlineQueue.js
 *
 * Cache submissions locally when the user is offline, and drain the queue
 * automatically when internet connectivity is re-established.
 */

const STORAGE_KEY = 'offline_submissions';

/**
 * Cache a submission offline.
 * @param {object} data - Form data
 */
export function cacheSubmissionOffline(data) {
  try {
    const pending = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );

    pending.push({
      data,
      createdAt: Date.now()
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    console.log('[OfflineQueue] Submissions cached locally:', pending.length);
  } catch (err) {
    console.error('[OfflineQueue] Failed to write to localStorage:', err);
  }
}

/**
 * Drain the offline queue by submitting each item.
 * @param {function} submitFn - The submitForm submit function
 */
export async function retryOfflineSubmissions(submitFn) {
  try {
    const pending = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );

    if (pending.length === 0) return;

    console.log(`[OfflineQueue] Found ${pending.length} offline submission(s). Retrying sync...`);

    const failed = [];

    for (const item of pending) {
      try {
        const result = await submitFn(item.data);
        if (!result.success) throw new Error(result.error);
        console.log('[OfflineQueue] Successfully recovered offline submission.');
      } catch (err) {
        console.error('[OfflineQueue] Offline recovery failed for item:', err);
        // Keep failed items to retry next time
        failed.push(item);
      }
    }

    if (failed.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(failed));
    } else {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[OfflineQueue] All cached offline submissions cleared successfully!');
    }
  } catch (err) {
    console.error('[OfflineQueue] Error during offline recovery drain:', err);
  }
}
