---
name: instant-skill-and-web-search
description: Dynamically creates new specialized skills on demand and executes web searches for missing technical documentation during prompt reviews. Trigger on "need skill", "create skill", "search web", "missing docs", or when reviewing new SyncMate prompts.
---

# Instant Skill Creation & Web Search (SyncMate)

## Purpose
Enables the agent to dynamically synthesize and install new specialized skills on the fly whenever a SyncMate workflow requires one, and executes web research whenever critical information, library documentation, or external API contracts are missing or uncertain.

## When to use
- During prompt review when a task requires a specialized runbook, workflow, or multi-step procedure not covered by existing skills.
- When encountering undocumented third-party libraries (e.g. `googleapis` Calendar v3 updates, `firebase-admin` FCM token errors, `node-cron` nuances, or Socket.IO v4 room mechanics).
- When a bug or build failure cannot be resolved with local codebase knowledge.
- Trigger phrases: "need skill", "create skill", "search web", "missing docs", "lagging from information".

## Step-by-step procedure
1. **Deconstruct Incoming Prompt & Identify Gaps**:
   - Parse the prompt against `docs/API_CONTRACT.md`, `docs/DATA_MODEL.md`, and `docs/00_AGENT_RULES.md`.
   - Identify if the task requires:
     - An unmapped procedural workflow (e.g. database migration, external OAuth flow, webhook handler).
     - Missing external API or library documentation.
2. **Execute Web Search if Lagging Information**:
   - If missing external documentation, perform targeted queries via `search_web`:
     - Example: `googleapis google calendar nodejs insert event extendedProperties`
     - Example: `firebase-admin sendEachForMulticast error handling token cleanup`
   - Validate findings against project constraints (Node.js >= 20 ES Modules, Mongoose, Express).
3. **Instantly Create the Missing Skill**:
   - Determine `<kebab-case-name>`.
   - Create `.agent/skills/<kebab-case-name>/SKILL.md` (and mirror to `.agents/skills/<kebab-case-name>/SKILL.md`).
   - Include required frontmatter (`name`, `description` with triggers).
   - Write standard sections: `Purpose`, `When to use`, `Step-by-step procedure`, `Rules / do-not list`, `Checklist before finishing`, `Example`.
   - Keep under 200 lines; use `templates/`, `scripts/`, or `references/` for long assets.
4. **Apply Skill & Execute Task**:
   - Immediately follow the newly minted skill to fulfill the user's prompt.
5. **Update Trackers & Log Verification**:
   - Record the new skill under "What Was Done" in `docs/task_tracker.md` and `research/task_tracker.md`.
   - Run `npm run lint` and `npm test` and report results.

## Rules / Do-Not List
- **DO NOT proceed with guesswork**: If an external library's method or signature is uncertain, search the web before writing code.
- **DO NOT create generic skills**: Every created skill must use SyncMate's real paths (`src/services/`, `src/routes/`, `docs/API_CONTRACT.md`).
- **DO NOT omit verification**: Every created code-generating skill must conclude with lint and test verification.
- **DO NOT violate contract first**: Custom skills must never contradict `API_CONTRACT.md` or `DATA_MODEL.md`.

## Checklist before finishing
- [ ] Required external documentation fetched and verified.
- [ ] New skill created with valid frontmatter and standard sections.
- [ ] Skill placed in `.agent/skills/<kebab-case-name>/SKILL.md`.
- [ ] Documented in `docs/task_tracker.md` and `research/task_tracker.md`.
- [ ] Linters and tests executed cleanly (`npm run lint`, `npm test`).

## Example: JIT Skill for FCM Token Cleanup
```markdown
---
name: fcm-token-cleanup
description: Handles Firebase Cloud Messaging dead token pruning on invalid registration token errors. Trigger on "FCM token cleanup", "dead push tokens", or push notification errors.
---

# FCM Token Cleanup Procedure
1. Catch `messaging/registration-token-not-registered` or `messaging/invalid-registration-token` during `firebase-admin` dispatch in `src/services/push.service.js`.
2. Extract dead token from error response.
3. Update User document: `await User.updateOne({ _id: userId }, { $pull: { pushTokens: { token } } })`.
4. Run integration test verifying dead token is pruned.
```
