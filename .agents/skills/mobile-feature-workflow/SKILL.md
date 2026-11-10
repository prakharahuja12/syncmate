---
name: mobile-feature-workflow
description: Guides the implementation of React Native (Expo) mobile features following strict API contracts, design tokens, safe areas, TanStack Query persistence, and responsive mobile patterns.
---

# Mobile Feature Implementation Workflow

This skill standardizes the lifecycle for building and verifying SyncMate Expo React Native features.

---

## 1. Core Principles
1. **API Contract Is Law**: All payloads, responses, query params, and error codes must strictly mirror `API_CONTRACT.md`. Use types from `src/types/api.ts`.
2. **Server State vs UI State**:
   - Server state: TanStack Query (v5) with offline persistence.
   - UI/Session state: Zustand (`authStore.ts`, `uiStore.ts`).
   - Tokens: Stored strictly in `expo-secure-store`.
3. **Design System & Parity**:
   - Use theme tokens from `src/theme/tokens.ts` (Light/Dark/System). Never hardcode hex values.
   - Touch targets must be >= 44x44dp.
   - Support safe areas via `react-native-safe-area-context`.
4. **Resilience & Feedback**:
   - Every screen has loading skeleton, empty state, and error state with retry.
   - Optimistic updates with rollback and toast feedback on mutations.
   - Haptic feedback (`expo-haptics`) on interactive actions (pins, status changes, task completion).
5. **External Links**:
   - External links validated for `http/https` and opened via `expo-web-browser` or system browser.
6. **File Size**:
   - Keep files modular and under 250 lines.

---

## 2. Feature Implementation Pipeline
```
1. Types & Schema: Update src/types/api.ts and Zod validation schemas
2. Service/API Layer: Add typed endpoints in src/features/<feature>/api.ts
3. State & Hooks: Implement TanStack Query queries/mutations with optimistic cache patching
4. UI Components: Build accessible atomic components (>= 44dp, theme tokens, safe areas)
5. Screens: Integrate views, error/loading/empty states, and pull-to-refresh
6. Verification: Typecheck (tsc --noEmit), lint, and unit tests
```

