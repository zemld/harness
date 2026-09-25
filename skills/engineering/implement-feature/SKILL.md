---
name: implement-feature
description: Implements one spec to a stable, reviewed, acceptance-tested diff.
disable-model-invocation: true
---

## Fit

Read the authoritative spec directly and `CONTEXT.md` if present, using its vocabulary for names; run `/read-docs` for the project stack.
Pin the spec locator and revision or digest, the diff base revision, approved clarifications, and explicit non-goals.
Map every in-scope requirement to its affected code and acceptance method, using existing patterns where suitable.
Identify required codegen, formatting, static, full-test, and acceptance checks and confirm their prerequisites.
Resolve missing requirements or scope decisions before coding; fit closes when every requirement has a code and verification path.

## Implement and verify

Give a code-writer subagent the spec locator, pinned identity, base revision, scope, and any prior arbitration record; use the configured `code-writer` when available.
Require it to read the source itself and return a local diff with check results; do not substitute a retold spec for the source.
On the stable diff, run the project's required checks, including the full suite when mandatory; record commands, results, diff identity, and environment.
Repair code failures as one batch and repeat affected checks; report an unchanged environment blocker without repeating the same command.
Implementation closes when the required checks pass on the current diff and each new behavior has tests.

## Review and acceptance

Run `/review-changes` against the pinned spec and current diff, then run `/analyze-review-issues` on every review report.
Give accepted root-cause groups to the code writer, then repeat affected checks and review on the repaired diff.
After two repair rounds without reducing open root-cause groups, diagnose the repeated cause and revise the repair plan before further edits.
Review closes only when `/review-changes` accounts for every changed hunk and arbitration returns `CLEAR` for the current stable diff.
Run `/test-feature` for applicable live acceptance criteria and the mapped checks for other criteria; send failures back through implementation, checks, and review.
Reuse passing evidence only while its diff, requirements, and relevant environment remain unchanged.
Return PASS only when fit, required checks, review, and every in-scope acceptance criterion pass on the final diff; otherwise report FAIL or BLOCKED with evidence and unverified criteria.
