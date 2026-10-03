---
name: refactor-project
description: Audits a project against its stack's harness conventions, applies the direct fixes, and writes up complex behavioral changes as scoped follow-ups.
disable-model-invocation: true
---

Audit a project end-to-end against its stack's conventions, fix every direct violation, and surface behavioral ones as scoped follow-ups. This skill is a generic **runner**: every category, fix pattern, and command is stack-specific and lives in the stack's index — never hardcode them here.

**Input** — absolute path to the project root; ask if missing.

## Step 1 — Detect the stack and read the procedure

1. Inspect the project root and judge which stack it uses.
2. Invoke the `/read-docs` skill for that stack's `Refactor project` conventions — it routes to the stack index and reads every doc that section lists. These are the source of truth for the rules you audit.
3. If `/read-docs` reports the stack has no conventions, stop and report the gap.

Done when you can name the stack, its category list, and its format/check command from the docs `/read-docs` returned.

## Step 2 — Audit (inline, read-only)

Run the audit in this context — never spawn a subagent (an isolating caller spawns this skill itself). Stay **read-only**: modify no file until Step 4.

1. Read every source file plus the manifest and config files the index's categories name.
2. Record each violation as one row under its category, using the exact category list from the index's Refactor section.
3. Mark each violation's complexity: `direct` (rename, move, fix import, add config, swap library) or `behavioral` (logic rewrite, state-model change, API-contract migration, test rewrite).

Build the report in this exact structure:

```
# Audit Report: <project name>

**Path:** <project_path>
**Stack:** <stack>
**Date:** <today's date>

## Summary

| Category | Direct | Behavioral | Total |
|----------|--------|------------|-------|
| <one row per index category> |  |  |  |
| **Total** |  |  |  |

---

## <Category>

| # | File:Line | Rule | Violation | Complexity |
|---|-----------|------|-----------|------------|

(one table per category with at least one violation; omit empty ones)

---

**N violation(s): D direct, B behavioral.**
```

All categories clean → replace the tables with `All rules satisfied — no violations found.`

Done when every source file is read and every violation has a row with file:line, exact rule name, and complexity.

## Step 3 — Persist and confirm

Write the report to `<project_path>/audit-report.md`, tell the user its path, and render the Summary and violation tables inline.

Zero violations → report success and stop.

Otherwise ask *"Found N violation(s): D direct (I'll fix now) and B behavioral (I'll write each up as a scoped follow-up). Proceed?"* and wait for confirmation before fixing.

## Step 4 — Final verification

Re-run the Step 2 audit scoped to only the files you changed, against the same docs, to confirm the fixes introduced no new violation. Fix any direct regression inline; report the rest.

Final report: D direct fixed, B behavioral written up, the audit-report.md path, and any open issues.

## Anti-pattern

- **Inventing a category.** A violation that fits no index category means the index is incomplete — surface that gap; don't improvise a category.
