# 10 – Testing, A11y, Performance, Deploy, Acceptance (WEB)

## Testing
- Unit (Vitest): date utils (timezone), priority sort, urgency display logic, realtime cache handlers, zod schemas, token refresh queue.
- Component (RTL): EventForm (hackathon validation, reminders), PinButton optimistic, StatusSelect, NotificationPanel.
- E2E (Playwright, against MSW or real backend): signup → create group → copy invite → second browser context joins → A creates event on 15 Nov → B sees it instantly; hackathon click opens link (assert popup URL); pin → other user sees "Pinned by"; mark registered; notification appears + mark read; dark mode toggle; mobile viewport.
## Accessibility & quality
axe-core in E2E for each page (no serious violations), focus trap in dialogs, labels on all inputs, `aria-live` for toasts, reduced-motion support, tab order logical, colour contrast AA both themes.
## Performance
Route-level code splitting (`React.lazy`), FullCalendar loaded only on `/calendar`, images none/SVG, Lighthouse ≥ 90 perf/a11y/best practices on dashboard, bundle < 250KB gz initial. PWA via vite-plugin-pwa (installable, offline shell, update prompt) – don't cache API responses.
## Deploy
`npm run build`, host on Vercel/Netlify with SPA fallback rewrite to `index.html`; env vars via dashboard; `firebase-messaging-sw.js` served from root. Document CORS origin to whitelist in backend.
## FINAL ACCEPTANCE CHECKLIST
- [ ] Sign up, log in, create group, invite via link/code, join works end-to-end.
- [ ] Month/Week/Day views; add/edit/delete; colours per category; drag to reschedule.
- [ ] Event created by one user appears for all others instantly (no refresh) with "added by".
- [ ] Hackathon form has every spec field; clicking a hackathon opens its registration/official page.
- [ ] Priority 🔴🟡🟢, sorting, urgent highlight, nearest high-priority on dashboard.
- [ ] Dashboard has all 9 widgets with loading/empty states.
- [ ] Notifications: bell, unread count, mark read, mark all read, push permission flow.
- [ ] Reminders (1d, 12h, 1h, 30m, custom) selectable and saved.
- [ ] Watchlist: pin, group visibility (who/when), statuses, deadline + links shown, reminders (7d/3d/1d/custom).
- [ ] Google connect, preferences, sync-now, disconnect.
- [ ] Light/dark, responsive 375→1440, keyboard accessible, no console errors.
