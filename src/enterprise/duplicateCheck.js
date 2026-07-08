import {
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

import { db } from '../firebase';

/**
 * Determine if a submission with this email and type is already present.
 *
 * @param {string} email
 * @param {string} type   — e.g. 'REGISTRY' | 'INTAKE' | 'ART_NEED'
 * @returns {boolean} True if duplicate exists, false otherwise
 */
export async function isDuplicate(email, type) {
  try {
    const q = query(
      collection(db, 'submissions'),
      where('duplicateKey', '==', `${email}_${type}`)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (err) {
    console.error('[DuplicateCheck] Error conducting check:', err);
    return false;
  }
}
