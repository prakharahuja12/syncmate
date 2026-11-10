# 09 – Google Calendar & Settings (MOBILE)

## Settings (More → Settings)
Sections: Profile (name, avatar colour, timezone – default from `expo-localization`), Appearance (Light/Dark/System, week start), Notifications (push/in-app/email toggles, default reminder presets, "Tapping hackathon opens link" toggle), Integrations, About (version, privacy policy, logout).

## Google Calendar (Settings → Integrations)
- Not connected: explanation + **Connect Google Calendar** → `GET /integrations/google/auth-url?platform=mobile` → `WebBrowser.openAuthSessionAsync(url, 'syncmate://integrations')`. Backend redirects to `syncmate://integrations?google=connected`. On success → refetch status + toast. Handle cancel/dismiss gracefully.
- Connected: Google email, last sync, **Sync now**, **Disconnect** (confirm sheet with "Also remove SyncMate events from Google Calendar" switch).
- **Preferences** (radio list, optimistic): All group events · Selected categories/priorities (multi-select chips) · Only events assigned to me · Pause sync; switch "Add registration deadlines as all-day events".
- Note text: "Sync is one-way and never creates duplicates."
- Error state banner if `connected=false` → "Reconnect".
