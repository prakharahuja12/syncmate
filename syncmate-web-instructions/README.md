# SyncMate WEB – Antigravity Instruction Pack

Stack: **React 18 + TypeScript (strict) + Vite**, Tailwind CSS, shadcn/ui (Radix), React Router v6, TanStack Query v5, Zustand, React Hook Form + Zod, FullCalendar (React), socket.io-client, Firebase Web SDK (FCM), date-fns / date-fns-tz, lucide-react, Vitest + React Testing Library + Playwright.

## How to use with Antigravity
1. Create folder `syncmate-web`, open in Antigravity. Unzip this pack to `docs/`.
2. Paste `PROMPT_FOR_ANTIGRAVITY.txt` into Agent Manager.
3. Approve each phase's Implementation Plan; ask the agent to open the **browser agent** at each phase end to verify the UI (screenshots as artifacts) in both light and dark mode and at 375px / 768px / 1440px widths.

## Index
| File | Purpose |
|---|---|
| 00_AGENT_RULES.md | Rules, phases, definition of done |
| 01_SETUP_AND_STRUCTURE.md | Dependencies, folders, env, API client, state architecture |
| 02_DESIGN_SYSTEM.md | Tokens, colours, typography, components, dark mode |
| 03_AUTH_AND_GROUP_FLOWS.md | Login, signup, create/join group, invite |
| 04_CALENDAR.md | Month/week/day views, colours, interactions |
| 05_EVENT_FORM_AND_HACKATHONS.md | Create/edit form, hackathon section, link click behaviour, priority |
| 06_DASHBOARD_TASKS.md | Dashboard widgets, tasks list, priority/urgency UI |
| 07_WATCHLIST.md | Pin/save, Saved Events page, statuses, reminders |
| 08_NOTIFICATIONS_REALTIME.md | Socket, in-app notifications, push (FCM), settings |
| 09_GOOGLE_AND_SETTINGS.md | Google Calendar connect UI, preferences, settings page |
| 10_TESTING_A11Y_DEPLOY.md | Testing, accessibility, performance, deploy, acceptance checklist |
| API_CONTRACT.md / DATA_MODEL.md | Shared with backend – never deviate |
