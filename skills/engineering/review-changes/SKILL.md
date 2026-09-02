---
name: review-changes
description: Use when reviewing current-branch changes against a task identifier before a commit or pull request.
---

Review the current branch as a skeptical pull-request review team.

## Input and evidence

Require one task identifier.
Ask only when it is missing.
Discover where this project stores tasks and read the task directly.
Stop if the task is inaccessible or does not state enough intent to review without guessing.
Read `CONTEXT.md` if it exists and use its vocabulary for naming.
Run `/read-docs` for the project stack and read every convention applicable to the changed code.
Use the project's current-branch comparison workflow to obtain every committed branch change.
Add every staged, unstaged, and untracked file to the scope, including generated, configuration, production, and test files.
Read every changed file in full.
Inspect the callers, consumers, boundaries, and repository precedents needed to understand each change.
Build a coverage ledger with one file-level row for every changed file.
Add one hunk-level row for every diff hunk.
Record the changed behavior, relevant callers or boundaries, and repository context inspected in each row.

The evidence gate closes when the task intent is sourced and every changed file and diff hunk has a complete coverage-ledger row.

## Independent review

Spawn four fresh subagents concurrently for a skeptical independent review.
Give each the task identifier, verbatim task content, complete diff, changed-file list, coverage ledger, and its role below.
Each subagent may read additional repository context but must report only findings caused by the current-branch diff.

- **Intent and logic** — verify the change against the task's intent and acceptance criteria. Inspect errors, boundaries, retries, concurrency, and unauthorized side effects.
- **Architectural fit** — inspect responsibility and type ownership, dependency direction, duplicated work or I/O, and integration behavior. Compare the change with applicable repository precedents.
- **Conventions** — run `/read-docs` and apply the exact documented structure, style, dependency, generated-code, and testing rules. Cite each violated rule.
- **Tests** — derive happy, edge, failure, boundary, and regression scenarios from the task and changed behavior. Verify that every meaningful branch and side effect is asserted at the right level.

Each review closes only after it marks every coverage-ledger row as `checked` or `not applicable` with a reason for its role.
For every finding, state the expected behavior or design, actual code, consequence, and `file:line` evidence.

## Verdict

Wait for all four reviews.
Skeptically verify every candidate finding against the task, conventions, and code.
Synthesize one report without unsupported findings.
Emit `Task inspected`, `Conventions consulted`, and `Context inspected`.
Add sections named `Intent and logic`, `Architectural fit`, `Conventions`, and `Tests`.
Use one table row per confirmed finding, or state that the section passed with no findings.
End with `PASS — review passed` only when all four sections pass.
Otherwise end with `FAIL` and ordered next actions.
Do not modify the reviewed change or offer to fix it because the caller owns the repair loop.
