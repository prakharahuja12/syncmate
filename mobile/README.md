# SyncMate Mobile Application

> Shared group calendar for teams of 3–5 users built with **React Native (Expo SDK 52)** and **TypeScript** (`strict: true`).  
> Designed with a minimal, gesture-driven visual language combining the best of Google Calendar, Notion, and Linear.

---

## 🚀 Key Features

1. **Shared Team Calendar**:
   - Month, Week, and Day view switcher with category-colored dots and urgency accents.
   - Real-time instant synchronization powered by Socket.IO (`event:created`, `event:updated`, `event:deleted`, `event:completed`).
2. **Hackathons & Competitions**:
   - Rich metadata: official website, registration link, problem statements, prize pool, mode, and deadlines.
   - **Spec Rule**: Tapping a hackathon opens its `primaryUrl` directly in the browser via `expo-web-browser` (default ON in Settings).
3. **Saved Events & Watchlist**:
   - Filter by `All`, `Mine`, and `Group`.
   - Per-user independent participation statuses: `👀 Interested`, `🗓️ Planning`, `✅ Registered`, `✖️ Not interested`.
   - Setting status to **Registered** activates the green ribbon and automatically suspends registration reminders.
4. **Push Notifications & Reminders**:
   - Native device tokens via `expo-notifications` (FCM on Android, APNs on iOS).
   - Dedicated Android notification channels: `syncmate-default` and `syncmate-reminders`.
   - Background push deep-linking (`syncmate://event/:id`, `syncmate://join/:code`).
5. **Google Calendar One-Way Sync**:
   - OAuth2 flow via `WebBrowser.openAuthSessionAsync`.
   - Configurable preferences: All events, Assigned to me, or Paused.
   - Duplicate prevention guarantee via private extended properties.

---

## 🛠️ Environment Configuration & The Emulator Gotcha

SyncMate uses `EXPO_PUBLIC_*` environment variables.

| Variable | Default (Android) | Default (iOS) | Description |
| :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | `http://10.0.2.2:5000/api/v1` | `http://localhost:5000/api/v1` | Backend REST API endpoint |
| `EXPO_PUBLIC_SOCKET_URL` | `http://10.0.2.2:5000` | `http://localhost:5000` | Realtime Socket.IO server |
| `EXPO_PUBLIC_WEB_URL` | `https://syncmate.app` | `https://syncmate.app` | Base URL for invite links |

> [!IMPORTANT]
> **The Emulator Localhost Gotcha**:
> - **Android Emulator**: `localhost` inside the Android VM refers to the emulator itself, NOT your development PC. Always use `http://10.0.2.2:5000` to reach your host backend.
> - **iOS Simulator**: Runs on the host Darwin kernel, so `http://localhost:5000` works as expected.
> - **Physical Devices (Expo Go or Dev Client)**: Use your local Wi-Fi IP address (e.g., `http://192.168.1.100:5000`).

---

## 📲 Deep Linking Architecture

SyncMate handles custom URL schemes and universal app links:
- `syncmate://join/:code` -> Opens Join Group screen with prefilled code and team preview.
- `syncmate://event/:id` -> Opens Event Details modal.
- `syncmate://watchlist` -> Navigates to Saved Events tab.
- `syncmate://notifications` -> Navigates to Notification Center.
- `syncmate://integrations?google=connected` -> Returns from Google OAuth authentication.

---

## 🧪 Testing & Verification

```bash
# Typecheck TypeScript strictly
npm run typecheck

# Run unit tests
npm test

# Start Expo development server
npm start
```

