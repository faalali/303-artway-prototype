/**
 * autosaveDraft.js
 *
 * Persists temporary user registration entries inside localStorage
 * to ensure submission data is never lost during accidental reloads or navigation actions.
 */

const STORAGE_KEY = 'ila_draft';

/**
 * Save draft data to localStorage.
 * @param {object} formData - Current inputs
 */
export function saveDraft(formData) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...formData,
        updatedAt: Date.now()
      })
    );
  } catch (err) {
    console.warn('[Autosave] Failed to write draft to storage:', err);
  }
}

/**
 * Retrieve current draft data from localStorage.
 * @returns {object|null} The cached draft or null if none exists.
 */
export function loadDraft() {
  try {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (!draft) return null;
    return JSON.parse(draft);
  } catch (err) {
    console.warn('[Autosave] Failed to read draft from storage:', err);
    return null;
  }
}

/**
 * Permanently purge the cached draft.
 */
export function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[Autosave] Failed to clear draft from storage:', err);
  }
}
