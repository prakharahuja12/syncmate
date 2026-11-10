# 10 – Testing, Performance, Release & Acceptance (MOBILE)

## Tests
Jest (jest-expo) unit: date utils/timezones, priority sorting, urgency display, realtime cache handlers, schemas, token refresh queue. RNTL component tests: EventForm (hackathon validation, reminders), PinButton optimistic, StatusPicker, NotificationRow. Optional Detox/Maestro E2E: login → create group → join via deep link → create event → hackathon link opens → pin → status.
## Performance & quality
FlashList for long lists, memoised rows, images avoided, Hermes enabled, avoid re-renders (selectors in Zustand), startup < 2s on mid-range Android, no JS thread jank on calendar swipe (use Reanimated worklets for gestures), bundle analysis. Accessibility: roles/labels, VoiceOver/TalkBack pass, contrast AA, font scaling, reduced motion. Offline: cached reads, offline banner, queued failures show retry.
## Release
`eas build` profiles: development (dev client), preview (APK/TestFlight internal), production (AAB/IPA). Configure icons, adaptive icon, splash (light/dark), permissions strings (iOS `NSUserTrackingUsage` not needed; notifications text), Android `POST_NOTIFICATIONS`, deep link associations (`assetlinks.json` / `apple-app-site-association` – document what the web host must serve), versioning, privacy policy URL, store listing checklist. Crash reporting (Sentry) optional with env flag.
## FINAL ACCEPTANCE CHECKLIST
- [ ] Sign up/log in; create group; join through code and through `syncmate://join/CODE`.
- [ ] Month/Week/Day views; add/edit/delete; category colours.
- [ ] Event created by another member appears instantly (foreground) and arrives as push (background/killed).
- [ ] Tapping a push opens the right event (cold start + warm).
- [ ] Hackathon form has all fields; tapping a hackathon opens its registration/official page.
- [ ] Priority 🔴🟡🟢, sort, urgent highlight, nearest high-priority card on Home.
- [ ] Reminders 1d/12h/1h/30m/custom work and notify at the right time.
- [ ] Saved Events: pin, group visibility (who/when), statuses, deadline + links, reminders 7d/3d/1d/custom, stops after Registered.
- [ ] Notification center: unread badge, mark read/all read.
- [ ] Google connect/preferences/sync/disconnect via in-app browser.
- [ ] Dark/light, small phones & tablets, offline read, no warnings on Android + iOS.
