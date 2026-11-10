# 02 – Design System (Google Calendar × Notion × Linear)

## Principles
Minimal, calm, dense-but-airy. Lots of whitespace, subtle 1px borders instead of heavy shadows, rounded-xl cards, quick 150ms transitions, no gratuitous gradients. Content first, chrome second. Keyboard shortcuts like Linear: `C` new event, `T` today, `M/W/D` switch view, `←/→` prev/next, `G then D/C/T/W` navigate, `/` focus search, `Esc` close.

## Typography
Inter (variable). Scale: 12 / 13 / 14 (body) / 16 / 20 / 24 / 30. Weights 400/500/600. Tabular numerals for times.

## Tokens (CSS variables, HSL; Tailwind maps to them)
Light: bg `#FFFFFF`, surface `#F7F7F8`, card `#FFFFFF`, border `#E7E7EA`, text `#18181B`, muted `#6B6B76`, primary `#5B5BD6` (indigo), primary-fg `#fff`, ring `#5B5BD680`.
Dark: bg `#0F0F11`, surface `#16161A`, card `#1A1A1F`, border `#2A2A31`, text `#EDEDEF`, muted `#9A9AA6`, primary `#7C7CF0`.
Priority: high `#E5484D` 🔴, medium `#F5A524` 🟡, low `#30A46C` 🟢 (each with soft bg variant at 12% alpha, and text colours passing AA).
Category colours (event chip bg soft + left border solid): hackathon violet `#8E4EC6`, college `#3E63DD` blue, personal `#30A46C` green, meeting `#F5A524` amber, competition `#D6409F` pink, other `#8B8D98` gray. Keep a single `CATEGORY_STYLES` map in `lib/constants.ts` used by calendar, badges, legend, dashboard.
Radius: 8 (inputs/buttons), 12 (cards), 16 (dialogs). Spacing 4px grid.

## Theme
Light / Dark / System toggle (topbar + settings). Implement by toggling `class="dark"` on `<html>`; persist in `uiStore` + localStorage; sync with `PATCH /users/me {settings.theme}`. Avoid flash: inline script in `index.html` to set the class before paint.

## Layout
- Desktop ≥1024: left sidebar 240px (collapsible to 64px icons): logo, Dashboard, Calendar, Tasks, Watchlist (with count badge), Notifications (unread badge), Group, Settings; bottom: user menu. Topbar: global search (command palette `⌘K`), "+ New event" primary button, notification bell, theme toggle, avatar.
- Tablet/Mobile <1024: sidebar hidden; **bottom navigation** (Dashboard, Calendar, ＋ (center FAB), Watchlist, More). Dialogs become bottom sheets.
- Max content width 1280px for dashboard; calendar uses full width.

## Core components (build once, reuse)
PriorityBadge (dot + label; 🔴🟡🟢 emoji allowed in text but dot is the primary), CategoryBadge, UserAvatar (initials on `avatarColor`) + AvatarStack (max 4 + "+n"), EventCard (title, time, category, priority, creator avatar, pin button, link icon if `primaryUrl`), StatCard, EmptyState (icon + sentence + CTA), Skeletons, ConfirmDialog, ExternalLink (adds ↗ icon, safe attrs), Toast (sonner), SegmentedControl (Month/Week/Day).
Urgent styling: `isUrgent` → red left border, subtle red-tinted background, a "Due soon" pill with countdown (e.g. "in 5h"), pulsing dot only when `prefers-reduced-motion` is not set.

## Micro-interactions
Skeleton shimmer, 150ms fade/slide for dialogs, hover lift on cards (border colour change, no big shadows), checkmark animation on complete, pin icon fill animation, realtime "new" highlight (1.5s ring) when an event arrives via socket.
