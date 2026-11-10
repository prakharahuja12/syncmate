# Workspace Rules: Prompt Review, Progress Tracking & Error Prevention

Whenever the user provides a prompt or instructions, follow these rules:

## 1. Prompt Review & Validation
- **Review every prompt** thoroughly before writing code or running commands.
- Verify user requests against existing project contracts (such as `API_CONTRACT.md`, `DATA_MODEL.md`, or architecture rules in `docs/`).
- Clarify any ambiguities or potential breaking changes upfront.

## 2. Maintain Progress Tracker (`docs/` or `research/`)
- Maintain a running log in either:
  - `docs/task_tracker.md` (or `docs/progress.md`), or
  - `research/task_tracker.md`.
- Keep this file updated with:
  - **What you had done**: Concrete record of completed tasks, modified files, and test results.
  - **What you will do**: Explicit checklist of immediate next steps and upcoming roadmap.
  - **Current status**: Active task, phase, and any blockers.
- Provide a clickable link to this tracking file in your responses.

## 3. Error Prevention Protocol
- **Read before modifying**: Inspect relevant files completely before editing. Never assume file structures or signatures.
- **Contract adherence**: Strictly adhere to API contracts, types, schema validations, and response envelopes.
- **Verification on change**: After modifications, run tests (`npm test`, pytest, etc.) and linters (`npm run lint`) to catch regressions.
- **Careful error resolution**: If a failure happens, analyze logs and error traces directly. Do not make blind guesses. Document fixes in the tracker.

## 4. Just-In-Time Skill Creation
- If a task or review reveals the need for a specialized workflow, runbook, or procedural skill not currently available, **create the skill instantly** in `.agents/skills/<name>/SKILL.md` and use it right away.
- Record newly created skills in the progress tracker.

## 5. Web Research for Missing Information
- If lacking details, facing uncertain library APIs, missing external documentation, or encountering unexplained errors, **search the web immediately** to retrieve accurate, current information before proceeding.

For full guidelines and skills reference:
- [Prompt Review Tracker Skill](file:///c:/Users/prakh/OneDrive/Desktop/projects/.agents/skills/prompt-review-tracker/SKILL.md)
- [Dynamic Skill Creation & Web Research Skill](file:///c:/Users/prakh/OneDrive/Desktop/projects/.agents/skills/dynamic-skill-and-research/SKILL.md)
- [Instant Skill & Web Search Skill](file:///c:/Users/prakh/OneDrive/Desktop/projects/.agents/skills/instant-skill-and-web-search/SKILL.md)

