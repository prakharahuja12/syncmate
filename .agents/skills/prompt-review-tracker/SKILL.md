---
name: prompt-review-tracker
description: Reviews incoming user prompts, verifies requirements and constraints, maintains a progress and planning log in docs/ or research/ (tracking what was done and what will be done next), and applies strict pre-flight and post-flight verification to prevent errors.
---

# Prompt Review, Progress Tracking & Error Prevention Skill

This skill enforces a disciplined workflow: **Review Prompt -> Update Tracker -> Safe Execution -> Verify -> Record Progress**.

---

## 1. When to Use This Skill
Use this skill whenever:
- A user gives a new prompt, task, or phase to execute.
- Work progress needs to be audited or tracked across multiple turns.
- Ensuring zero regressions, contract adherence, and error prevention is critical.

---

## 2. Core Workflow Steps

### Step 1: Prompt Review & Analysis
Before making any changes or running commands:
1. **Deconstruct the prompt**:
   - What is the primary objective?
   - What are the explicit constraints, non-negotiables, and conventions?
   - What contracts, data models, or files are involved?
2. **Identify Potential Risks & Ambiguities**:
   - Are there missing inputs, breaking changes, or conflicting instructions?
   - If a prompt contradicts existing contracts (e.g., `API_CONTRACT.md` or `DATA_MODEL.md`), stop or highlight the discrepancy before proceeding.
3. **Formulate a safe step-by-step plan**:
   - Determine exact files to read, modify, or create.
   - Plan pre-checks and post-verification commands.

---

### Step 2: Maintain Progress in `docs/` or `research/`
Always locate or create a dedicated progress tracking file in the project's `docs/` or `research/` directory.

- Preferred file location:
  - If a `docs/` folder exists in the project: use `docs/task_tracker.md` (or `docs/progress.md`).
  - If a `research/` folder exists or is preferred: use `research/task_tracker.md`.
  - If neither exists, create `docs/task_tracker.md`.

#### Tracker File Structure:
```markdown
# Project Task Tracker & Progress Log

## Current Objective
- **Active Task**: <Brief summary of current user prompt>
- **Status**: [IN_PROGRESS | COMPLETED | BLOCKED]
- **Target Files**: <Files being modified or created>

## What Will You Do (Planned Next Steps)
- [ ] Step 1: <Immediate next step>
- [ ] Step 2: <Subsequent step>
- [ ] Step 3: <Verification / Testing step>

## What Was Done (Completed Work History)
### [YYYY-MM-DD HH:mm] - <Task Name>
- **Objective**: <What was requested>
- **Actions Taken**:
  - <Specific change or implementation detail>
  - <Files modified/created>
- **Verification & Testing**:
  - <Test commands run, lint results, or manual verification steps>
  - <Status: PASSED / FAILED / RESOLVED>
- **Notes / Decisions**:
  - <Any architectural decisions or caveats noted>

## Known Issues & Blockers
- None / <List issues being resolved>
```

**Rule for updating the tracker**:
- **At task start**: Update "Current Objective" and "What Will You Do".
- **At task completion**: Move completed items into "What Was Done" with verification results, and update "What Will You Do" with upcoming items.

---

### Step 3: Error Prevention Protocol ("Try Not to Make Error")
To minimize errors, follow these strict execution rules:

1. **Read Before Writing**:
   - Never assume file contents, API schemas, or function signatures.
   - Always read the relevant source files and contracts before modifying them.
2. **Respect Existing Contracts**:
   - Field names, route paths, error formats, and status codes must strictly match specifications (e.g. `API_CONTRACT.md`).
3. **Atomic, Targeted Changes**:
   - Only edit the lines/functions that need changing.
   - Avoid rewriting entire files or modifying unrelated code.
   - Maintain documentation, comments, and docstrings.
4. **Pre-flight & Post-flight Verification**:
   - **Pre-flight**: Ensure dependencies are installed and configuration exists (`.env`, config files).
   - **Post-flight**:
     - Run linter/type-check: e.g. `npm run lint` or `tsc --noEmit` if available.
     - Run tests: e.g. `npm test` or specific unit test for modified logic.
     - Verify syntax or startup: test run or build to ensure no broken imports or runtime crashes.
5. **Systematic Debugging on Failure**:
   - If a test or command fails, do NOT blindly guess patches.
   - Read the exact error message and stack trace.
   - Diagnose root cause, fix it deliberately, and re-verify.
   - Document the resolution in the tracker log.

---

### Step 4: Transparent User Communication
When responding to the user:
1. Provide a concise summary of what was accomplished.
2. Provide a clickable link to the updated tracker file (e.g., `[docs/task_tracker.md](file:///.../docs/task_tracker.md)`).
3. Clearly state:
   - **What was done**
   - **Verification results** (tests/linters passed)
   - **What will be done next** (and ask for approval if entering a new phase).

