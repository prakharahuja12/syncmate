# 08 – Notifications & Realtime (WEB)

## Socket (`lib/socket.ts`, `hooks/useRealtime.ts`)
Mount once in AppShell when authenticated and group exists. `io(VITE_SOCKET_URL, {auth: cb => cb({token: getAccessToken()}), transports:['websocket','polling'], reconnection:true})`. On `connect_error` with UNAUTHORIZED → refresh token then reconnect. Show a subtle "Reconnecting…" pill in Topbar when disconnected; on reconnect invalidate `['events']`, `['dashboard']`, `['notifications']` to catch missed changes.
Event → cache handlers (central file `realtime/handlers.ts`, unit-tested):
- `event:created` → insert into overlapping event queries + invalidate dashboard; flash + toast (skip toast if actor is me).
- `event:updated` → replace in all caches by id, if `updatedAt` is not older than cached. `event:deleted` → remove from caches, close drawer if open, toast "Event deleted by X".
- `event:completed` → update.
- `pin:changed`, `status:changed` → patch (see 07). `notification:new` → prepend to notifications cache, increment unread count, toast + (if tab hidden and permission granted) nothing extra since FCM handles. `activity:new` → prepend. `group:member-*` → invalidate `['group']`. `group:deleted` → clear group state, go to onboarding.

## In-app notifications UI
- **Bell** in topbar with unread badge (cap "9+"). Click → popover panel (last 10, "Mark all as read", "See all").
- **Notifications page** `/notifications`: tabs All / Unread; infinite scroll; each item: icon by type, title, body, actor avatar, relative time, unread dot. Click → mark read (optimistic) + navigate via `data.deepLink` mapped to web route. Swipe/hover action "Mark as read". Empty state.
- Toast (sonner) for realtime items with action buttons (View).

## Web Push (FCM)
- `public/firebase-messaging-sw.js` using Firebase compat scripts, handles `onBackgroundMessage` → `showNotification(title, {body, icon, data:{url}})` and `notificationclick` → focus existing tab or open `data.url`.
- `lib/firebase.ts`: init app; `requestPermissionAndRegister()`: ask permission **only from a user gesture** (a "Enable notifications" banner in dashboard/settings, never on page load), `getToken({vapidKey, serviceWorkerRegistration})`, then `POST /users/me/push-tokens {token, platform:'web', deviceId}` (deviceId = random id in localStorage). Handle denied state with helper text. Foreground messages: `onMessage` → show sonner toast (don't duplicate if socket already delivered same notificationId – dedupe by id).
- On logout: `DELETE /users/me/push-tokens` + `deleteToken`.
- Settings toggles (Settings → Notifications): Push on/off, In-app on/off, Email on/off (optional), **Default reminder** presets (stored as `defaultReminderOffsets`), "Clicking hackathon opens link directly" (local pref).
