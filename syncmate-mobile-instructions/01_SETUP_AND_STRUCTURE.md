# 01 – Setup & Structure (MOBILE)

## Create
`npx create-expo-app syncmate-mobile --template blank-typescript`
Packages: `@react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated @gorhom/bottom-sheet @tanstack/react-query zustand axios zod react-hook-form @hookform/resolvers socket.io-client date-fns date-fns-tz expo-secure-store expo-notifications expo-device expo-linking expo-web-browser expo-haptics expo-clipboard expo-constants expo-localization @react-native-async-storage/async-storage @react-native-community/datetimepicker react-native-calendars @shopify/flash-list lucide-react-native react-native-svg @tanstack/query-async-storage-persister @tanstack/react-query-persist-client react-native-toast-message`
Dev: `eslint prettier jest jest-expo @testing-library/react-native detox (optional) typescript`
Use a dev client (`expo-dev-client`) because push + FCM need native config. Configure `app.config.ts` (scheme `syncmate`, bundle ids `com.syncmate.app`, `googleServicesFile` for Android/iOS from env path, notification icon/colour, `expo-notifications` plugin, intent filters for `https://syncmate.app/join/*` and scheme links).

## Structure
```
src/
├─ app/ (App.tsx providers, navigation/{RootNavigator,AuthStack,OnboardingStack,MainTabs,linking.ts})
├─ types/api.ts
├─ lib/{api.ts,socket.ts,queryClient.ts,secureStorage.ts,dates.ts,constants.ts,push.ts,links.ts,haptics.ts}
├─ theme/{tokens.ts,ThemeProvider.tsx,useTheme.ts}
├─ stores/{authStore.ts,uiStore.ts}
├─ hooks/{useRealtime.ts,useEvents.ts,useDashboard.ts,useWatchlist.ts,useNotifications.ts,useNow.ts}
├─ features/{auth,group,calendar,events,dashboard,tasks,watchlist,notifications,integrations,settings}/ (screens, components, api.ts, schema.ts)
├─ components/{ui/* (Button, Input, Card, Chip, Badge, Avatar, AvatarStack, Skeleton, EmptyState, ErrorState, Sheet, Switch, SegmentedControl, ListRow), common/{ExternalLinkButton,PriorityBadge,CategoryBadge,PinButton,Screen}}
├─ mocks/
assets/ (icon, splash, notification-icon)
```

## Env (`.env` / EAS secrets, `EXPO_PUBLIC_*`)
`EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api/v1` (Android emulator; iOS sim uses localhost; real device uses LAN IP) · `EXPO_PUBLIC_SOCKET_URL` · `EXPO_PUBLIC_WEB_URL` · `EXPO_PUBLIC_USE_MOCKS`. Document the emulator-localhost gotcha in the README.

## Navigation map
RootNavigator: Splash/boot (refresh token → `/auth/me`) → **AuthStack** (Login, Signup) | **Onboarding** (CreateOrJoin, CreateGroup, JoinGroup) | **Main**.
**MainTabs (bottom):** Home (Dashboard) · Calendar · [＋ center action → EventForm modal] · Saved (Watchlist) · More (Tasks, Notifications, Group, Settings).
Notifications bell lives in the Home and Calendar headers with unread badge.
Stack screens above tabs (modal/pushed): EventDetails (bottom-sheet style), EventForm (full-screen modal), Tasks, Notifications, Group, Settings (+ Appearance, Notifications, Integrations, Profile).
Deep links (`linking.ts`): `syncmate://join/:code`, `syncmate://event/:id`, `syncmate://watchlist`, `syncmate://notifications`, `https://syncmate.app/join/:code` (universal/app links). If logged out → store pending link, handle after login/boot.
