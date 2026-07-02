import { supabase } from '../supabase';

// Shared audit logger — call after any notification attempt
export async function logNotification({ userId, channel, type, title, body, refType, refId, status = 'sent', error = null }) {
  try {
    await supabase.from('notification_log').insert({
      user_id:  userId  || null,
      channel,
      type,
      title:    title   || null,
      body:     body    || null,
      ref_type: refType || null,
      ref_id:   refId   || null,
      status,
      error:    error   || null,
    });
  } catch (_) { /* never block the caller */ }
}

// ─────────────────────────────────────────────────────────────
//  FCM Push registration — DORMANT until Firebase is configured.
//  It activates automatically once these env vars are set:
//    VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID,
//    VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID,
//    VITE_FIREBASE_VAPID_KEY
//  Until then it is a safe no-op (no Firebase import, no errors).
//  Full setup steps: see FCM-SETUP.md at the repo root.
// ─────────────────────────────────────────────────────────────

const cfg = {
  apiKey:            import.meta.env?.VITE_FIREBASE_API_KEY,
  projectId:         import.meta.env?.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env?.VITE_FIREBASE_APP_ID,
  vapidKey:          import.meta.env?.VITE_FIREBASE_VAPID_KEY,
};

export function pushConfigured() {
  return !!(cfg.apiKey && cfg.projectId && cfg.messagingSenderId && cfg.appId && cfg.vapidKey);
}

// Call after login. No-ops cleanly until Firebase is configured.
export async function registerPush(userId, app = 'customer') {
  if (!userId || !pushConfigured()) return { active: false };
  if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return { active: false };
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return { active: false, reason: 'denied' };

    // Dynamic import, @vite-ignore so the build doesn't require firebase
    // to be installed yet. Install `firebase` when you configure FCM.
    const { initializeApp } = await import(/* @vite-ignore */ 'firebase/app');
    const { getMessaging, getToken } = await import(/* @vite-ignore */ 'firebase/messaging');
    const fb = initializeApp({
      apiKey: cfg.apiKey, projectId: cfg.projectId,
      messagingSenderId: cfg.messagingSenderId, appId: cfg.appId,
    });
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessaging(fb);
    const token = await getToken(messaging, { vapidKey: cfg.vapidKey, serviceWorkerRegistration: reg });
    if (!token) return { active: false };

    await supabase.from('notification_tokens')
      .upsert({ user_id: userId, token, platform: 'web', app }, { onConflict: 'user_id,token' });
    return { active: true, token };
  } catch (e) {
    console.warn('push registration skipped:', e.message);
    return { active: false, error: e.message };
  }
}
