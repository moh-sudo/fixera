# 🔔 FCM Push Notifications — Setup Guide

**Status:** Scaffolding is built and DORMANT. Push works the moment you
complete the steps below. Until then, nothing breaks — the code no-ops.

In-app notifications + browser alerts (while the app is open) **already
work** without this. FCM adds **push when the app is fully closed**.

---

## What's already built
- `migrations/create_notification_tokens.sql` — table storing device tokens
- `web/src/services/pushService.js` — `registerPush(userId, app)` (guarded;
  no-op until env vars are set)
- `web/public/firebase-messaging-sw.js` — background-message service worker (template)

## What YOU must do (one-time, ~20 min)

### 1. Create a Firebase project
- Go to https://console.firebase.google.com → Add project → name it "Fixera"
- In the project: **Build → Cloud Messaging** (enable)
- Project settings → General → "Your apps" → add a **Web app** → copy the config
- Project settings → **Cloud Messaging** → Web Push certificates → **Generate key pair** → copy the **VAPID key**

### 2. Run the migration
`migrations/create_notification_tokens.sql` in Supabase SQL Editor.

### 3. Install Firebase in each app that should receive push
```
cd C:\fixera\web    && npm install firebase
cd C:\fixera\worker && npm install firebase   # (mirror pushService.js + sw there)
```

### 4. Set env vars (Vercel → each app → Settings → Environment Variables)
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

### 5. Fill the service worker
Edit `web/public/firebase-messaging-sw.js`:
- set `FIREBASE_CONFIGURED = true`
- paste the same config values into `firebase.initializeApp({...})`

### 6. Call registerPush after login
In the app's post-login (e.g. in `useAuth` once `user` is set):
```js
import { registerPush } from '../services/pushService';
// ...
useEffect(() => { if (user) registerPush(user.id, 'customer'); }, [user]);
```

### 7. Sending pushes (server side)
Add a serverless function (or Supabase Edge Function) that, on key events
(quote accepted, order assigned, status change), reads the recipient's
tokens from `notification_tokens` and calls the FCM HTTP v1 API with your
service-account key. (This is the only piece that needs a server secret.)

---

## Why it's dormant now
- `pushService.registerPush` returns `{ active: false }` while env vars are
  unset, so it never errors.
- The Firebase imports are `@vite-ignore`'d, so the app builds without the
  `firebase` package installed.
- The service worker self-disables via `FIREBASE_CONFIGURED = false`.

Result: zero impact today; flip it on when you're ready.
