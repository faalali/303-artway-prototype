import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

/**
 * Initializes App Check for the Firebase application.
 * Protects database against automated bots.
 *
 * @param {object} app — The initialized Firebase app
 */
export function initAppCheck(app) {
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (!recaptchaKey) {
    console.warn('[AppCheck] VITE_RECAPTCHA_SITE_KEY not configured. App Check skipped.');
    return null;
  }

  try {
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaKey),
      isTokenAutoRefreshEnabled: true
    });
    console.log('[AppCheck] Successfully initialized reCAPTCHA v3 provider protection.');
    return appCheck;
  } catch (err) {
    console.error('[AppCheck] Failed to initialize App Check:', err);
    return null;
  }
}
