# 00 – Agent Rules & Phases (WEB)

## Product summary
Shared calendar for one small group. Everything created/changed by anyone appears instantly for everyone (WebSocket). Hackathons carry registration/official links; clicking a hackathon opens its page. Priority (🔴 high 🟡 medium 🟢 low) drives sorting and urgency highlighting. A Watchlist lets members pin events and mark Interested / Planning to Register / Registered / Not Interested, visible to the whole group.

## Non-negotiables
1. TypeScript `strict: true`, no `any`, no `@ts-ignore` without a comment. Types from API_CONTRACT in `src/types/api.ts`.
2. **Server state = TanStack Query; UI/session state = Zustand.** Never copy server data into Zustand.
3. All HTTP via a single axios instance (`src/lib/api.ts`) with: base URL, Bearer token injection, automatic refresh on 401 `TOKEN_EXPIRED` (queue concurrent requests, retry once), logout on refresh failure, envelope unwrapping, typed `ApiError`.
4. All forms: React Hook Form + zod resolver; inline field errors; disabled submit while pending.
5. Every list/page has **loading skeleton, empty state, error state** (with retry).
6. Realtime updates patch the Query cache in place (`setQueryData`), no full refetch (see 08).
7. Optimistic updates for: complete/uncomplete, pin/unpin, my-status, mark-notification-read, drag-reschedule. Roll back on error + toast.
8. Accessibility: semantic HTML, focus rings, ARIA labels on icon buttons, colour never the only signal (priority also has icon/text), WCAG AA contrast in both themes, full keyboard operation of dialogs & calendar.
9. Dates: store/transport UTC; display with `date-fns-tz` in the user's timezone from profile. Time format 12h/24h follows browser locale.
10. All external links: `target="_blank" rel="noopener noreferrer"`. Only render http/https hrefs.
11. No hard-coded colours – only design tokens (02).
12. Files < 250 lines; components are small and typed; feature-folder architecture.

## Phases
1. **Foundation**: Vite+TS+Tailwind+shadcn setup, theme (light/dark/system), layout shell (sidebar desktop / bottom-nav mobile), router + protected routes, API client, MSW mocks, auth screens.
2. **Group flows**: create group, join via `/join/:code`, invite panel (copy code/link, regenerate), members list.
3. **Calendar + Event form**: FullCalendar views, event dialog/drawer, create/edit/delete, categories colours, hackathon fields, link click.
4. **Dashboard + Tasks/Priority**: all widgets, tasks page with filters/sorting, urgency styling.
5. **Realtime + Notifications**: socket, notification bell/panel/page, toasts, FCM web push.
6. **Watchlist**: pin button everywhere, Saved Events page, statuses, group visibility, reminders.
7. **Google + Settings**: integration UI, preferences, profile/theme/notification settings.
8. **Polish & QA**: a11y audit, performance, E2E tests, PWA manifest, README.

## Definition of done per phase
Typecheck + lint + unit tests pass; screens verified light/dark at 375/768/1440; no console errors; matches contract; short walkthrough artifact with screenshots.
