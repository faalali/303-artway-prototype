import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Creates a secure audit log trace in Firestore.
 * @param {object} event - Audit details including actor, description, and action
 */
export async function createAuditLog(event) {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      ...event,
      createdAt: Date.now()
    });
    console.log('[AuditLogger] Event logged successfully.');
  } catch (err) {
    console.error('[AuditLogger] Failed to write audit log:', err);
  }
}

/**
 * Export client event logging function to POST diagnostics to the backend.
 */
export async function logClientEvent(eventType, data = {}) {
  try {
    const payload = {
      eventType,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    console.log("[ILA DEBUG]", payload);
    
    // Non-blocking fire-and-forget fetch call
    fetch("/api/debug-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }).catch(err => console.error("Telemetry report failed:", err));

  } catch (err) {
    console.error("Debug logging failed:", err);
  }
}
