---
name: refactor-project
description: Audits a project against the conventions documented in `docs/engineering/<stack>/` and fixes every violation — restructures files, corrects imports, applies style fixes, and surfaces complex behavioral changes as scoped follow-up features for the user to implement separately. Works for any stack the harness has docs for (Go service, frontend project, etc.). Use proactively when the user says "refactor the service", "refactor the frontend", "приведи сервис к стандартам", "приведи фронт к стандартам", "audit the project", "проверь проект по конвенциям", "сервис не соответствует конвенциям", "check the project against conventions", or asks whether a project matches the harness conventions.
---

Audit a project end-to-end against the conventions for its stack and fix every violation. The category list and procedure are stack-specific and documented in each stack's index; this skill is a generic runner.

## Inputs

Ask for any missing input:

- **Project path** — absolute path to the project root.

## Step 1 — Detect the stack and read the Refactor procedure

1. Inspect the project root and work out which stack it uses, matching it to an existing `docs/engineering/<stack>/` directory. Use your own judgment from the project's files — there is no fixed list of signals to rely on.
2. If no matching `docs/engineering/<stack>/index.md` exists, stop and report the gap.
3. Read `docs/engineering/<stack>/index.md` in full. Locate the `## Refactor project` section.
4. Read every doc listed there. These docs are the source of truth for the rules being audited.

## Step 2 — Spawn the audit subagent

Spawn an **Explore** subagent. Substitute `<project_path>` and `<harness_root>` (the repo containing `docs/engineering/`):

---
You are a project conventions auditor. Read-only — never modify any file.

**Project to audit:** `<project_path>`
**Stack:** `<stack>`
**Index:** `<harness_root>/docs/engineering/<stack>/index.md`

**Instructions:**

1. Read the index's `## Refactor project` section in full.
2. Read every doc the section lists.
3. Read the full contents of `<project_path>` — every source file plus the manifest and config files the index's category list mentions.
4. For each violation, record one row per category table below. Use the category list defined in the index's Refactor section (e.g. Structure, Style, Testing, Dependency, Transaction, Tooling for Go; Structure, State, Forms, API, Routing, Testing, Style, Tooling for frontend).

**Output format:**

Write a Markdown report to `<project_path>/audit-report.md` using this exact structure:

```
# Audit Report: <project name>

**Path:** <project_path>
**Stack:** <stack>
**Date:** <today's date>

## Summary

| Category | Direct | Behavioral | Total |
|----------|--------|------------|-------|
| <one row per category from the index's Refactor section> |
| **Total**   | ...    | ...        | ...   |

---

## <Category 1>

| # | File:Line | Rule | Violation | Complexity |
|---|-----------|------|-----------|------------|

## <Category 2>

| # | File:Line | Rule | Violation | Complexity |
|---|-----------|------|-----------|------------|

... (one table per category that has at least one violation; omit empty ones)

---

**N violation(s): D direct, B behavioral.**
```

- **File:Line** — exact path and line.
- **Rule** — exact rule name from the relevant doc.
- **Violation** — what is concretely wrong at this location.
- **Complexity** — `direct` (rename, move, fix import, add missing config file, swap library) or `behavioral` (logic rewrite, state model change, API contract migration, test rewrite). The index's Refactor section names the typical examples per stack.

If all categories are clean, replace the tables with `All rules satisfied — no violations found.`
---

## Step 3 — Present audit and confirm

Tell the user the full report is at `<project_path>/audit-report.md`. Render the Summary table and all violation tables inline in chat.

If zero violations → report success and stop.

Otherwise ask:

> *"Found N violation(s): D direct (I'll fix those now) and B behavioral (I'll write each up as a scoped follow-up feature for you to implement separately). Shall I proceed?"*

Wait for confirmation before fixing.

## Step 4 — Apply direct fixes

For each `direct` violation, apply the fix in the current session. The index's Refactor section lists the typical direct-fix patterns for the stack — follow them. After all direct fixes, run the stack's format/check command as named in the index's Refactor section (or, if absent, find it from the project itself — a Makefile target or package script).

## Step 5 — Write up behavioral violations as follow-ups

Do not auto-fix behavioral violations — they need design, tests, and review that exceed an in-session edit. For each, write a focused, self-contained description of the scoped follow-up feature it implies: what to change, where (paths under `<project_path>`), and why. The index's Refactor section lists the typical behavioral examples for the stack — use those as templates. Collect these descriptions and present them to the user as recommended follow-ups to run through the project's normal feature design-and-implementation process. This skill stops at direct fixes; it does not implement behavioral changes itself.

## Step 6 — Final verification

Re-run the Step 2 audit, scoped to only the files you modified, against the same convention docs, to confirm the direct fixes introduced no new violations. If any appear, apply remaining direct fixes inline or report them to the user.

Final report:

- Direct violations fixed: D.
- Behavioral violations written up as scoped follow-up features for you to implement: B.
- Audit report: `<project_path>/audit-report.md`.
- Any remaining open issues.

## Anti-patterns

- **Hardcoding stack-specific knowledge in this skill body.** Categories and fix patterns live in the index. This skill is a runner.
- **Inventing categories not in the index.** If you see a violation that doesn't fit any category from the index, that's a signal the index is incomplete — surface it to the user rather than improvising a new category.
- **Auto-fixing behavioral violations.** Behavioral fixes need design, tests, and review — surface them as scoped follow-up features for the user to implement separately, rather than patching them inline. Don't shortcut.
