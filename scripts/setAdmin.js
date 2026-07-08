/**
 * setAdmin.js
 *
 * Administrative script to assign super_admin custom claims to a specific Firebase User UID.
 * Running this script grants the UID full administrative access bypass in Firestore rules.
 */
const admin = require('firebase-admin');

// Initialize Firebase Admin using default credentials (configured in local env)
admin.initializeApp();

async function makeAdmin(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, {
      admin: true,
      role: 'super_admin'
    });
    console.log(`[setAdmin] Success: admin custom claims successfully assigned to UID: ${uid}`);
    process.exit(0);
  } catch (err) {
    console.error('[setAdmin] Error assigning admin claims:', err.message);
    process.exit(1);
  }
}

// Replace with target administrator UID
const targetUid = process.env.TARGET_ADMIN_UID || 'USER_UID_HERE';
makeAdmin(targetUid);
