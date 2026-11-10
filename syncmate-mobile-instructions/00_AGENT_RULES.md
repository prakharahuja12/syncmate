# 00 – Agent Rules & Phases (MOBILE)

## Product summary
Same product as web: one shared group calendar; changes by anyone appear instantly for all (WebSocket) and trigger push + in-app notifications; hackathons carry registration/official links (tap opens the page in the browser); priority 🔴🟡🟢; watchlist ("Saved Events") with per-user statuses visible to the group; Google Calendar sync.

## Non-negotiables
1. TypeScript strict, no `any`. Types from API_CONTRACT.
2. Server state in TanStack Query; UI/session state in Zustand. Persist Query cache for offline read (`@tanstack/query-async-storage-persister` + AsyncStorage, maxAge 24h, exclude auth/notification count).
3. One axios instance with token injection, 401 refresh-and-retry queue, envelope unwrapping, typed errors, 15s timeout.
4. Tokens ONLY in `expo-secure-store` (never AsyncStorage).
5. Every screen has loading skeleton, empty state, error state with retry, pull-to-refresh where a list exists.
6. Use `FlatList/SectionList/FlashList` for lists (never `ScrollView` + map for long lists). Memoise rows.
7. Safe areas (`react-native-safe-area-context`), keyboard avoidance on all forms, `KeyboardAvoidingView`/`react-native-keyboard-controller`, scroll-on-focus.
8. Touch targets ≥ 44×44dp; haptics (`expo-haptics`) on pin/complete/status change; accessibility labels/roles on all touchables; support dynamic font scaling up to 130%.
9. External links via `Linking.openURL` after `Linking.canOpenURL` check (or `expo-web-browser` `openBrowserAsync` for in-app browser); only http/https.
10. Optimistic updates for complete, pin, my-status, mark-read, reschedule; roll back + toast on error.
11. No hard-coded colours – theme tokens only. Support Android + iOS parity; platform-specific code isolated in `*.ios.ts / *.android.ts` when needed.
12. Files < 250 lines; feature-folder architecture.

## Phases
1. **Foundation:** Expo TS project, theme (light/dark/system), navigation skeleton, API client, secure token storage, mocks, auth screens.
2. **Group flows:** onboarding, create/join (code + deep link), group screen & invite sharing (native Share sheet).
3. **Calendar + Event form:** month/week/day, event bottom-sheet details, create/edit/delete, hackathon fields, open links.
4. **Dashboard + Tasks/Priority.**
5. **Realtime + Notifications + Push:** socket, notification center, push registration (FCM/APNs), deep-link handling, local reminder fallback.
6. **Watchlist.**
7. **Google + Settings.**
8. **Polish & release:** perf, a11y, tests, EAS builds, icons/splash.

## Definition of done per phase
Typecheck + lint + tests pass; runs on Android and iOS; light/dark verified; no yellow/red-box warnings; matches contract; walkthrough artifact with screenshots.
