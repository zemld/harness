---
name: review-changes
description: Use for a skeptical review of current-branch changes against an identified task, including incremental review after fixes.
---

Read the authoritative spec directly, `CONTEXT.md` if present, and applicable conventions through `/read-docs`; use the glossary's vocabulary in the report.
Pin the spec locator and expected SHA-256 digest, base revision, current diff identity, and any prior coverage and arbitration records.
Account for committed, staged, unstaged, and untracked changes against the base; track coverage by changed file and hunk.
Use full review initially; before a repeat review, read [incremental review boundaries](references/incremental-review.md) and reuse only eligible evidence.

Dispatch four independent reviewers, one per focus: intent and logic, architectural fit, mandatory conventions, and tests.
Use the configured `reviewer` agent when available; otherwise use separate reviewer subagents.
Give each reviewer the spec locator, expected digest, base revision, assigned focus, relevant prior evidence, and check results; require it to verify the spec, retrieve the complete diff, and report both identities it inspected.
Ask each reviewer to report confirmed defects with file and line, reachable scenario, consequence, and violated requirement or rule, plus examined and unexamined areas.
For incremental review, dispatch only affected focuses and cite valid prior reports for the others.
Verify that every changed hunk has current or eligible prior inspection under every relevant focus; dispatch follow-ups for gaps.

Skeptically reconcile each reported finding and coverage claim with its cited evidence, recording a match or a specific gap; leave merits of disputed findings to `/analyze-review-issues`.
Return reports by focus, coverage, diff identity, and in-scope requirement or mandatory-rule violations separately from verification blockers.
Return PASS only when coverage is complete and no such violation remains, FAIL for an evidenced violation, or BLOCKED for missing evidence.
