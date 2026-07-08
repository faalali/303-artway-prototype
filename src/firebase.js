/**
 * Firebase initialization for ILA Gallery
 * 
 * Exports:
 *  - db       : Firestore instance (primary source of truth)
 *  - auth     : Firebase Auth instance
 *  - ensureAuth : ensures an anonymous session exists before any Firestore write
 */
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Prevent double-initialization during hot reloads in development
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db   = getFirestore(app);
export const auth = getAuth(app);

/**
 * Ensures the user has an anonymous Firebase Auth session.
 * Public form users (artists, commissioners) never sign in with a real account —
 * anonymous auth gives them a UID so Firestore security rules can accept their writes.
 * Returns the uid string on success.
 */
export async function ensureAuth() {
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }

  return new Promise((resolve) => {
    let resolved = false;

    // Fallback timer: resolve to 'anonymous' if Auth takes more than 10 seconds
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('[Firebase Auth] ensureAuth timed out, falling back to anonymous');
        resolve('anonymous');
      }
    }, 10000);

    // Wait for the auth state to initialize (handles page reload case)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (resolved) return;
      unsubscribe();
      clearTimeout(timeout);
      resolved = true;

      if (user) {
        resolve(user.uid);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user.uid);
        } catch (err) {
          console.error('[Firebase Auth] Anonymous sign-in failed:', err);
          resolve('anonymous');
        }
      }
    });
  });
}
