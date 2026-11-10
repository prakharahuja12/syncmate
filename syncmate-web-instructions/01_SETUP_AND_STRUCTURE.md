# 01 – Setup & Structure (WEB)

## Dependencies
`react react-dom react-router-dom @tanstack/react-query zustand axios zod react-hook-form @hookform/resolvers socket.io-client firebase date-fns date-fns-tz lucide-react clsx tailwind-merge class-variance-authority sonner @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/list`
Dev: `vite typescript tailwindcss postcss autoprefixer eslint prettier vitest @testing-library/react @testing-library/user-event msw playwright vite-plugin-pwa @tanstack/react-query-devtools`
Use shadcn/ui components: button, input, textarea, select, dialog, sheet, popover, calendar, tabs, badge, avatar, dropdown-menu, tooltip, switch, checkbox, toast (sonner), skeleton, command, separator, scroll-area.

## Structure
```
src/
├─ main.tsx, App.tsx, router.tsx
├─ types/api.ts                 # types from API_CONTRACT
├─ lib/{api.ts,socket.ts,queryClient.ts,dates.ts,utils.ts,firebase.ts,constants.ts}
├─ stores/{authStore.ts,uiStore.ts}       # tokens, user, theme, sidebar, calendar view/date
├─ hooks/{useAuth.ts,useRealtime.ts,useGroup.ts,useEvents.ts,useNotifications.ts,useWatchlist.ts,useDashboard.ts,useDebounce.ts,useMediaQuery.ts}
├─ features/
│  ├─ auth/ (LoginPage, SignupPage, schemas)
│  ├─ group/ (CreateGroupPage, JoinGroupPage, InvitePanel, MembersList)
│  ├─ calendar/ (CalendarPage, CalendarToolbar, EventChip, EventPopover, MiniCalendar, CategoryLegend)
│  ├─ events/ (EventDialog, EventForm, HackathonFields, ReminderPicker, AssigneePicker, EventDetailsDrawer, PriorityBadge, CategoryBadge, api.ts)
│  ├─ dashboard/ (DashboardPage, widgets/*)
│  ├─ tasks/ (TasksPage, TaskRow, filters)
│  ├─ watchlist/ (WatchlistPage, WatchCard, PinButton, StatusSelect, ParticipantsStack)
│  ├─ notifications/ (NotificationBell, NotificationPanel, NotificationsPage)
│  ├─ integrations/ (GoogleCalendarCard, SyncPreferences)
│  └─ settings/ (SettingsPage, ProfileForm, AppearanceForm, NotificationSettings)
├─ components/{ui/* (shadcn), layout/{AppShell,Sidebar,Topbar,BottomNav}, common/{EmptyState,ErrorState,Skeletons,Avatar,ConfirmDialog,ExternalLink}}
├─ mocks/ (MSW handlers + fixtures)
├─ styles/globals.css (CSS variables for tokens)
public/{firebase-messaging-sw.js, manifest.webmanifest, icons}
```

## Env (.env.example)
`VITE_API_URL=http://localhost:5000/api/v1`, `VITE_SOCKET_URL=http://localhost:5000`, `VITE_USE_MOCKS=false`, `VITE_FIREBASE_API_KEY, _AUTH_DOMAIN, _PROJECT_ID, _MESSAGING_SENDER_ID, _APP_ID, VITE_FIREBASE_VAPID_KEY`.

## Routing
Public: `/login`, `/signup`, `/join/:code` (shows group preview; if logged out, remember code in sessionStorage and redirect to signup/login, then auto-join).
Protected (need token): `/` Dashboard, `/calendar`, `/tasks`, `/watchlist`, `/notifications`, `/event/:id` (opens details drawer over calendar), `/settings`, `/settings/integrations`, `/group` (members & invite).
Guards: no token → /login; token but no group → `/onboarding` (create or join); group exists → app.

## Query keys (central file `lib/queryKeys.ts`)
`['me']`, `['group']`, `['events', {from,to,filters}]`, `['event', id]`, `['dashboard']`, `['watchlist', scope]`, `['notifications', {unread}]`, `['notifications','count']`, `['activity']`, `['google','status']`.

## Auth storage
Access token in memory (Zustand, not persisted). Refresh token in `localStorage` (documented trade-off; acceptable for v1) – wrap in `lib/tokenStorage.ts` so it can be swapped for httpOnly cookie later. On app start: if refresh token exists → refresh → `/auth/me`.
