# 09 – Google Calendar & Settings (WEB)

## Settings layout (`/settings`)
Left tabs / top tabs on mobile: Profile · Appearance · Notifications · Integrations · Group (link).
- **Profile:** name, avatar colour picker (10 swatches), email (read-only), timezone select (searchable list from `Intl.supportedValuesOf('timeZone')`).
- **Appearance:** theme Light/Dark/System with live preview cards; density Comfortable/Compact; week starts on Sunday/Monday.
- **Notifications:** see 08.

## Integrations → Google Calendar card (`/settings/integrations`)
States:
1. **Not connected:** description ("Sync SyncMate events into your Google Calendar. You choose what syncs."), button "Connect Google Calendar" → `GET /auth-url?platform=web` → `window.location = url`. On return `?google=connected` → toast + refetch status.
2. **Connected:** show Google email, last sync time, status badge, buttons: **Sync now** (spinner), **Disconnect** (ConfirmDialog with checkbox "Also remove SyncMate events from my Google Calendar").
3. **Sync preferences** (radio cards, saved via PATCH immediately with optimistic UI): *All group events* · *Only selected categories/priorities* (reveals category + priority checkboxes) · *Only events assigned to me* · *Pause sync*. Switch: "Also add registration deadlines as all-day events".
4. Info note: "Sync is one-way. Changes made in Google Calendar to SyncMate events will be overwritten. No duplicates are created."
5. Error banner if backend reports `connected=false` after invalid grant ("Reconnect Google").
Add a small "Synced to Google ✓" indicator on EventDetails when sync is enabled (optional, if backend exposes it later).
