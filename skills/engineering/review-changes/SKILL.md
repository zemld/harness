---
name: review-changes
<<<<<<< Updated upstream
description: Reviews a code change against its stated intent and the project's documented standards — logic, structure/style, and test quality — over the scope you give it rather than the whole repo. Needs a one-line intent and the set of files/area to review.
---

Review one code change end-to-end against two things: the **intent** it was meant to satisfy, and the **engineering conventions this project documents for itself**. Produce one report covering logic, structure/style, and tests.

## Inputs

Two inputs drive the review. Use whatever the user already supplied; ask only for what is missing. Settle both before analysing.

- **Intent** — what the change was meant to accomplish, in a sentence or two (the goal, not the implementation). If absent, ask: *"What was this change supposed to do? One or two sentences — the goal, not the implementation."*
- **Scope** — the specific files or one clearly locatable area to review. Review only this; pull in nothing outside it. If none is given, ask which files or area to review.
=======
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
>>>>>>> Stashed changes

## Step 1 — Analyse (inline)

<<<<<<< Updated upstream
Do the review yourself in this context; never spawn a subagent (a caller wanting fresh eyes spawns this skill itself).

1. **Invoke `/read-docs` to get code conventions by project stack.**
2. **Read the governing docs** before judging. They are the sole source of truth for structure/style and test rules — apply their exact rule names and categories; invent nothing from memory.
3. **Read every scope file** — production and test alike, not excerpts.
4. **Evaluate three dimensions:**
   - **Logic vs intent.** Where does the code diverge from what the intent requires? Classify each divergence as missing behaviour, wrong behaviour, or an unauthorized side effect. "There's a bug" is not a finding — state expected vs. actual and cite `file:line`.
   - **Structure & style.** Check scope files against the style/structure docs. Use their exact rule names and categories; one row per violation at `file:line`.
   - **Tests.** *Conventions* — check test files against the documented test conventions (naming, shape, assertion style, placement). *Completeness* — derive from the intent every scenario the change should cover (happy path, edges, error/failure, boundary), and flag each one with no matching test. If no test files are in scope, state that and list every scenario left untested.

Assemble the findings into this structure:

```
Conventions consulted: <where found + which stack's rules applied, or "none found — reviewed against intent only">
Docs read: <comma-separated rule docs read>

### Logic
| File:Line | Expected (from intent) | Actual (in code) | Type |
(or: "Matches intent — no divergences found.")

### Style
| File:Line | Category | Rule | Violation |
(or: "No structure/style violations found.")

### Tests
Conventions:
| File:Line | Rule | Violation |
(or: "No test-convention violations found.")
Completeness:
| Scenario (from intent) | Covered? | Missing test |
(or: "All scenarios implied by the intent are covered.")
```
### Overall verdict
PASS — ready to commit.
  OR
FAIL — address the items below before committing.

### Next actions
<issues to fix, highest priority first; logic and missing-test gaps rank above stylistic nits>
```

End with:

> Tell me which of these you'd like me to fix and I'll make the changes. If you disagree with any finding, push back — I may have missed context.
=======
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

Verify every candidate against the source requirement or mandatory rule and repository evidence.
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
>>>>>>> Stashed changes
