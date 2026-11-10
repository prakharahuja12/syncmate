# 02 – Design System (MOBILE)

Same visual language as web (see tokens): minimal, calm, Linear/Notion feel with Google-Calendar clarity.

## Tokens (`theme/tokens.ts`) – identical values to web
Light: bg `#FFFFFF`, surface `#F7F7F8`, card `#FFFFFF`, border `#E7E7EA`, text `#18181B`, muted `#6B6B76`, primary `#5B5BD6`.
Dark: bg `#0F0F11`, surface `#16161A`, card `#1A1A1F`, border `#2A2A31`, text `#EDEDEF`, muted `#9A9AA6`, primary `#7C7CF0`.
Priority: high `#E5484D`🔴, medium `#F5A524`🟡, low `#30A46C`🟢. Categories: hackathon `#8E4EC6`, college `#3E63DD`, personal `#30A46C`, meeting `#F5A524`, competition `#D6409F`, other `#8B8D98`. Urgent: red accent border + tinted bg.
Spacing 4/8/12/16/24/32; radius 8/12/16/24; type scale 12/14/16/18/22/28 with Inter (`@expo-google-fonts/inter`) 400/500/600; tabular nums for times.
ThemeProvider: Light/Dark/System (`useColorScheme`), persisted in `uiStore` (AsyncStorage) and synced to `PATCH /users/me`. StatusBar style follows theme; Android navigation bar colour matches.

## Mobile UX patterns
- Bottom tabs with filled-icon active state; centre ＋ button elevated (56dp) opens EventForm.
- Details & pickers in **bottom sheets** (`@gorhom/bottom-sheet`), swipe-to-dismiss, backdrop.
- Large collapsing headers on Dashboard/Watchlist; pull-to-refresh everywhere.
- Swipe actions on list rows: Tasks → swipe right complete, swipe left delete (with confirm); Notifications → swipe to mark read.
- Haptic feedback on key actions; subtle Reanimated animations (150–200ms): pin fill, checkmark, card press scale 0.98.
- Skeleton shimmer for loading; Toasts at top for realtime updates ("Rahul added SIH 2026" tap → opens event).
- Offline banner when no connection (`@react-native-community/netinfo`), cached data remains readable; mutations disabled with message.
- Components identical in naming to web where possible: PriorityBadge, CategoryBadge, Avatar/AvatarStack, EventCard, EmptyState, ExternalLinkButton (opens browser; shows ↗).
