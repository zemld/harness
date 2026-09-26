---
name: review-changes
description: Use for a skeptical review of current-branch changes against an identified task, including incremental review after fixes.
---

## Input and evidence

Require a task identifier or spec path and retrieve the authoritative task or spec directly.
Ask only for an unavailable identifier or an unresolved intent or scope decision after retrieving related context.
Read `CONTEXT.md` if present and run `/read-docs` for applicable conventions.
Use its vocabulary and cite the exact rules consulted.
Read the supplied implementation map, clarifications, and arbitration history without treating them as new business requirements.
Resolve disagreements with the authoritative spec before reviewing affected behavior.
Capture the complete current-branch diff against the agreed base, including staged, unstaged, untracked, generated, configuration, and test changes.
Use full review for the first round or when prior review evidence is unavailable.
For a repeat round, read [incremental review boundaries](references/incremental-review.md) before choosing incremental or full scope.
Read every file in the selected scope in full and inspect its affected callers, boundaries, and repository precedents.
Maintain one coverage-ledger row per changed file and per diff hunk, recording behavior, inspected context, and evidence identity.
Close evidence only when every row in the complete diff has current inspection or eligible prior coverage.

## Independent review

For full review, spawn four fresh independent subagents concurrently, one for each role below.
For incremental review, reuse available independent reviewers and dispatch only roles affected by the selected scope, spawning replacements when necessary.
Give each reviewer the source spec, agreed scope, complete diff, selected scope, coverage ledger, check evidence, and prior issue decisions.
Review only defects introduced or exposed by the current change, not unrelated pre-existing cleanup.

- **Intent and logic** — inspect acceptance criteria, errors, boundaries, retries, concurrency, and unauthorized side effects.
- **Architectural fit** — inspect ownership, dependency direction, duplicated work or I/O, and compatibility with existing integrations.
- **Conventions** — apply exact documented mandatory rules, including structure, style, dependencies, generation, and testing.
- **Tests** — map in-scope invariants and reachable failure cases to assertions, identifying concrete gaps rather than requiring every conceivable scenario.

Require each dispatched reviewer to mark every selected ledger row as checked or not applicable, with a reason for its role.
Close independent review only when all dispatched reports arrive and all four roles have complete current or eligible prior coverage.

## Findings and verdict

Skeptically verify every candidate against the source requirement or mandatory rule and repository evidence.
Each finding must cite a reachable scenario, consequence, `file:line` evidence, and the minimum correction.
Classify findings as behavior defects, mandatory convention violations, specific invariant test gaps, optional improvements, or environment blockers.
Do not make speculative hardening, preferred test shape, or undocumented style preferences blocking findings.
Preserve stable issue IDs and prior arbitration decisions, identifying the changed evidence before reopening an issue.
Group duplicate claims by root cause while preserving their original sources.
Return the coverage ledger, reviewed diff identity, inspected task and conventions, and one section per review role.
For reused sections, cite the prior report and why its coverage remains valid.
Separate blocking findings from optional improvements and environment blockers.
Return PASS only when every coverage row is accounted for and no blocking finding remains; otherwise return FAIL or BLOCKED with the missing evidence or findings.
Do not edit the reviewed change; the caller owns arbitration and repair.
