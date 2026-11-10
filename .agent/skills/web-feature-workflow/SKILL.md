---
name: web-feature-workflow
description: Guides the implementation of React (Vite) web features following strict API contracts, design tokens, responsive layouts, TanStack Query cache patching, and accessible web patterns.
---

# Web Feature Implementation Workflow

This skill standardizes the lifecycle for building and verifying SyncMate Vite React web features.

---

## 1. Core Principles
1. **API Contract Is Law**: All payloads, responses, query params, and error codes must strictly mirror `API_CONTRACT.md`. Use types from `src/types/api.ts`.
2. **Server State vs UI State**:
   - Server state: TanStack Query (v5). Never copy server state into Zustand.
   - UI/Session state: Zustand (`authStore.ts`, `uiStore.ts`).
   - Tokens: Access token in memory/Zustand; refresh token in `tokenStorage.ts`.
3. **Design System & Parity**:
   - Use theme tokens (Light/Dark/System) via CSS variables and Tailwind classes.
   - Semantic HTML and keyboard accessibility (focus rings, ARIA roles/labels).
   - Responsive layouts: Desktop sidebar (≥1024px) / Mobile bottom navigation (<1024px).
4. **Resilience & Feedback**:
   - Every screen has loading skeleton, empty state, and error state with retry.
   - Optimistic updates with rollback and toast feedback on mutations.
   - In-place query cache patching (`setQueryData`) on realtime socket events.
5. **External Links**:
   - External links validated for `http/https` and opened with `target="_blank" rel="noopener noreferrer"`.
6. **File Size**:
   - Keep files modular and under 250 lines.

---

## 2. Feature Implementation Pipeline
```
1. Types & Schema: Update src/types/api.ts and Zod validation schemas
2. Service/API Layer: Add typed endpoints in src/features/<feature>/api.ts
3. State & Hooks: Implement TanStack Query queries/mutations with optimistic cache patching
4. UI Components: Build accessible atomic components (design tokens, ARIA labels, responsive)
5. Screens/Pages: Integrate views, error/loading/empty states
6. Verification: Typecheck (tsc --noEmit), lint, and unit tests
```
