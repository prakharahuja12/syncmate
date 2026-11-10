# 03 – Auth & Group Flows (MOBILE)

## Boot
Splash → read refresh token from SecureStore → `POST /auth/refresh` → `GET /auth/me` → route: no token → AuthStack; token & no group → Onboarding; else Main. Handle pending deep link after resolving.

## Auth screens
Login & Signup: scrollable, keyboard-aware, labelled inputs (email keyboard, `autoComplete`, `textContentType` for password managers), show/hide password, inline zod + server errors, loading button state, "Sign up/Log in" switch link. Biometric unlock (optional stretch): `expo-local-authentication` guarding app resume after 5 min.

## Onboarding
Two large cards: **Create a group** (name → POST /groups → success screen with invite sharing) and **Join with code** (8 chars, uppercase, paste button via `expo-clipboard`, preview before joining "Join Team Alpha (3/5)").
Deep link `syncmate://join/CODE`: open JoinGroup with code prefilled and preview loaded; if not logged in, store code (SecureStore/uiStore) → after signup/login auto-continue. Errors `INVITE_INVALID`, `GROUP_FULL` → friendly states.

## Group screen (More → Group)
Members list (avatar, name, role, joined), "You" tag. Owner: **Invite** card with code (tap to copy + haptic + toast), **Share invite** (native `Share.share({message: 'Join my SyncMate group: https://…/join/CODE'})`), regenerate (confirm), remove member (swipe or menu + confirm), rename, transfer ownership, delete group (type name to confirm). Members: leave group (confirm). Realtime updates of members list.

## Logout
Confirm → `DELETE /users/me/push-tokens`, API logout, clear SecureStore + Query cache + persisted cache, disconnect socket, reset navigation.
