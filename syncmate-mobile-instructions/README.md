# SyncMate MOBILE APP – Antigravity Instruction Pack

Stack: **React Native with Expo (SDK 52+, managed workflow, dev-client/EAS build) + TypeScript (strict)**. Navigation: React Navigation v7 (native-stack + bottom-tabs). Server state: TanStack Query v5. App state: Zustand. Forms: React Hook Form + zod. Realtime: socket.io-client. Push: `expo-notifications` + FCM (Android) / APNs (iOS) via Expo push-token → **we use native device tokens** (`getDevicePushTokenAsync`) so the backend's Firebase Admin can send directly. Secure storage: `expo-secure-store`. Dates: date-fns / date-fns-tz.

> Note: you asked for "React Native"; Expo is React Native with tooling that makes push notifications, deep links, secure storage and builds far easier. Everything is still standard RN and can be ejected (`expo prebuild`) any time. TypeScript is used so the app shares the same types as the web app.

## How to use with Antigravity
1. Create folder `syncmate-mobile`, open in Antigravity, unzip this pack to `docs/`.
2. Paste `PROMPT_FOR_ANTIGRAVITY.txt` into Agent Manager.
3. Approve each phase plan. Ask the agent to run the app on an Android emulator / iOS simulator (or Expo Go for phases without push) and attach screenshots.

## Index
| File | Purpose |
|---|---|
| 00_AGENT_RULES.md | Rules, phases, definition of done |
| 01_SETUP_AND_STRUCTURE.md | Packages, folders, env, API client, navigation map |
| 02_DESIGN_SYSTEM.md | Theme tokens, components, dark mode, mobile UX patterns |
| 03_AUTH_AND_GROUP_FLOWS.md | Auth, onboarding, join via link/code, group screen |
| 04_CALENDAR.md | Month/week/day views, interactions |
| 05_EVENT_FORM_AND_HACKATHONS.md | Event form, hackathon section, opening links, priority |
| 06_DASHBOARD_TASKS.md | Dashboard widgets, tasks screen |
| 07_WATCHLIST.md | Pin/save, Saved Events, statuses, reminders |
| 08_NOTIFICATIONS_REALTIME_PUSH.md | Socket, in-app notifications, push setup (Android/iOS), local fallback |
| 09_GOOGLE_AND_SETTINGS.md | Google connect (browser flow), preferences, settings |
| 10_TESTING_RELEASE.md | Tests, performance, EAS build, store release, acceptance checklist |
| API_CONTRACT.md / DATA_MODEL.md | Shared with backend & web – never deviate |
