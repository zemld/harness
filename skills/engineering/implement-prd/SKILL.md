---
name: implement-prd
description: Drives a feature from a PRD-style markdown document to finished code by running an autonomous write→review loop — a writer subagent produces the whole change following the project's engineering docs, an independent reviewer subagent checks it, and the writer fixes any findings, repeating until the review passes. Use when the user hands over a markdown design doc (top-level or nested PRD) or freeform requirements and asks for code. Trigger on "implement this PRD", "implement the PRD at <path>", "implement feature from doc", "реализуй PRD", "реализуй фичу по PRD", "запусти имплементацию", "имплементируй фичу", "имплементируй по PRD", or any phrasing where the user hands over a markdown design doc and asks for code. Be eager to trigger — better to fire than to miss. Do NOT use for design or decomposition (those are `write-prd`) and do NOT use for standalone post-implementation review (that is `review-changes`).
---

Take one markdown document and drive it to finished code: enumerate the test cases once, then run an autonomous loop where a **writer** produces the whole change, an independent **reviewer** checks it, and the writer fixes what the review finds — repeating until the review passes or a retry cap is hit. The orchestrator never edits files itself — not production code, not the PRD; it dispatches the roles, carries context between them, and reports.

This skill holds no stack knowledge and no engineering rules. The case analyst (`analyze-cases`), the writer (`write-code`), and the reviewer (`review-changes`) each read what they need for themselves. Adding or changing a stack means editing that stack's docs — never this skill.

## Input

`prd_path` — absolute path to a markdown document describing the work to do. Its body is the **intent**: the design contract handed to the writer and the goal handed to the reviewer.

## Step 0 — Resolve `working_dir`

Read the `## Meta` section of `prd_path`. If it has a `working_dir:` line, use that absolute path. Otherwise default to the current working directory. If `cwd` is clearly not a project root and `## Meta` gives no `working_dir`, ask the user once for the absolute path. This is the only interactive prompt this skill performs. The stack is determined by the subagents themselves — the orchestrator does not need it.

## Step 1 — Analyze cases (once)

Before the loop, spawn one `Agent` subagent that invokes `analyze-cases` on the PRD body. It returns a table of the scenarios the change must cover — happy path, edges, errors, corners. This runs **once**: the table is the writer's test contract for every iteration, it is not recomputed on fix rounds, and it is **not** handed to the reviewer (the reviewer derives coverage independently so it can catch cases this analysis missed). Carry the table forward as `<cases_table>`.

## Step 2 — Write → review loop

Each step below spawns one `Agent` subagent whose prompt just invokes the named skill with the inputs described — the skill itself carries the procedure, so no elaborate prompt construction is needed. Run the loop with a cap of **2 fix iterations** (so at most 3 reviews total). It runs autonomously — do not pause for the user between iterations.

1. **Write.** Spawn an `Agent` subagent that invokes `write-code` with `intent` = the PRD body **plus `<cases_table>` under a `## Cases` heading**, and the resolved `working_dir`. It returns the list of files it created/modified and confirms the change builds, its tests pass, and it is formatted.

2. **Review.** Spawn an `Agent` subagent that invokes `review-changes` with `intent` = the PRD body (**not** the cases table) and `scope` = the files the writer just reported; tell it to return only the verdict and `file:line` findings, not to ask what to fix. Consume its result as **data**. Do not surface its "tell me what to fix" tail to the user; that decision is the loop's, not the user's.

3. **Decide.**
   - Review **PASS** → done; emit the final report.
   - Review **FAIL** and fixes remain under the cap → spawn `write-code` again with `intent` = the PRD body + `<cases_table>` under `## Cases` **plus** the review findings appended under a heading like `## Review found these — fix them`, same `working_dir`. The findings are precise (`file:line`, expected vs. actual) and the code is on disk, so a fresh writer acts on them directly. Then go back to step 2.
   - Review **FAIL** and the cap is exhausted → stop; emit the final report with the residual findings for the user to resolve by hand.

## Escalation

If the writer stops because the only correct fix would require editing a frozen test, do not loop or rewind — stop immediately and surface that escalation to the user verbatim in the final report.

## Final report

Emit one report when the loop ends:

```
## implement-prd: <first line of the PRD's intent>

Verdict: PASS | FAIL (findings remain) | ESCALATED (test-freeze) | NOT STARTED — <reason>
Iterations: <N writes, M reviews>

Files created / modified:
- <deduplicated paths the writer reported>

Outstanding findings (FAIL only):
- <the reviewer's residual file:line findings, verbatim>

Escalation (ESCALATED only):
- <which frozen test would have to change, and why, verbatim>
```

Relay the subagents' words verbatim; do not re-judge them. The orchestrator tracks no frozen scope — it just collects the paths the writer reported as touched.
