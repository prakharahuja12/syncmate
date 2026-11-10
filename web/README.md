# SyncMate Web Client

The official modern web application for **SyncMate** — a shared team & group calendar with realtime sync, hackathon tracking, watchlist participation, and Google Calendar integration.

Built with **React 18**, **Vite**, **TypeScript** (`strict: true`), **Tailwind CSS**, **TanStack Query v5**, and **Zustand**.

---

## 🚀 Key Features

1. **Responsive Dual Layout Shell**:
   - **Desktop (≥1024px)**: Collapsible sidebar, category filters, quick stats, topbar notifications bell, theme switcher, and profile jump.
   - **Mobile (<1024px)**: Bottom navigation with elevated center FAB (`+ New Event`), full touch accessibility.

2. **Full-Featured Interactive Calendar**:
   - **Month, Week, and Day Views**: Smooth navigation, category legend toggles, and "Today" jump.
   - **Event Styling**: Category color pills/accents, priority dots (🔴 High, 🟡 Medium, 🟢 Low), and red left borders for urgent events (`computeIsUrgent`).
   - **Direct Hackathon Navigation**: Tapping a hackathon chip immediately opens the official registration URL in a new tab (configurable in Settings), with full event details accessible via the ⓘ button.

3. **Dashboard & Tasks**:
   - **Next High-Priority Hero Card**: Nearest critical milestone with relative countdown, date/time, and direct "Register ↗" button.
   - **Widgets**: Today's schedule timeline, upcoming 7-day events, important deadlines (event date & registration close), high-priority checklist, upcoming hackathons, recently added, and group activity feed.
   - **Tasks Page**: Pending and Completed tabs, priority grouping, search, and category filters.

4. **Watchlist & Participation**:
   - **Pin Any Event**: Save hackathons or deadlines for later (group or private).
   - **Group Status Tally**: Realtime member participation glyphs (👀 Interested, 🗓️ Planning, ✅ Registered, ✖️ Not Interested, ○ No response).
   - **Registration Deadlines**: Dynamic countdown chips (amber ≤ 3d, red ≤ 24h, overdue tags).
   - **Smart Reminders**: 7d, 3d, 1d presets anchored to registration close.

5. **Realtime Socket.IO Sync**:
   - In-place TanStack Query cache patching on events (`event:created`, `event:updated`, `event:deleted`, `event:completed`, `pin:changed`, `status:changed`, `activity:new`, `notification:new`).
   - Reconnection resilience and toast notifications for team activities.

6. **Google Calendar Integration**:
   - Connect via OAuth2 (`/integrations/google/auth-url?platform=web`).
   - Customizable sync mode (`all`, `categories`, `assigned_to_me`, `none`) and toggle for registration deadline all-day events.
   - Instant "Sync now" and safe disconnect with optional event removal.

---

## 🛠️ Scripts & Verification

```bash
# Start local development server
npm run dev

# Run TypeScript strict typecheck
npm run typecheck

# Run Vitest unit tests
npm test

# Build production bundle
npm run build
```

