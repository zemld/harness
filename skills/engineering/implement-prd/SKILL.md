---
name: implement-prd
description: Drives end-to-end implementation of a feature from a single PRD-style markdown document — detects the target stack, walks the pipeline in `docs/engineering/<stack>/index.md#implementation-pipeline` by dispatching each stage into an isolated subagent. Use when the user wants to implement a PRD (top-level or nested) or any freeform requirements doc. Trigger on "implement this PRD", "implement the PRD at <path>", "run the implementation pipeline", "implement feature from doc", "реализуй PRD", "реализуй фичу по PRD", "запусти имплементацию", "имплементируй фичу", "имплементируй по PRD", or any phrasing where the user hands over a markdown design doc and asks for code. Be eager to trigger — better to fire than to miss. Do NOT use for design or decomposition (those are `write-prd`) and do NOT use for post-implementation review (that is `review-changes`, a separate manual step).
---

Take one markdown document, detect the target stack, look up the pipeline for that stack in `docs/engineering/<stack>/index.md#implementation-pipeline`, and execute the stages it lists. Every skill-backed stage runs inside a dedicated `Agent` subagent for context isolation. The orchestrator never edits files itself — not production code, not the PRD; it dispatches, then reports.

This skill is a generic stage runner. Stack-specific stage lists, commands, retry caps, and test-freeze patterns live entirely in the index. Adding a new stack means writing its index — no edit to this skill.

## Input

`prd_path` — absolute path to a markdown document describing the work to do. The body of this document is the design contract for every subagent the orchestrator spawns.

## Step 0 — Resolve runtime

### 0a. `working_dir`

Read the `## Meta` section of `prd_path`. If it contains a `working_dir:` line, use that absolute path. Otherwise default to the current working directory. If `cwd` does not look like a project root (no `go.mod`, no `package.json` directly inside it) and `## Meta` provides no `working_dir`, ask the user once for the absolute path. This is the only interactive prompt this skill performs.

### 0b. Detect target stack

Inspect `working_dir`: `go.mod` present → stack `go`; `package.json` present → stack `frontend`; both or neither → stop and report the ambiguity. A single PRD targets exactly one stack.

### 0c. Load the pipeline

Read `docs/engineering/<stack>/index.md` and locate its `## Implementation pipeline` section. Capture: pipeline-level commands (test, format, type-check, OpenAPI regen where listed), the stage table with retry caps, the test-freeze rule, and the pipeline label for the final report. If the section is missing, stop with a gap report.

## Subagent prompts

Build every subagent prompt per `references/subagent-prompt.md`. The PRD body is substituted verbatim; the index's test-freeze rule is appended verbatim from the Implementation stage onward; the cases table returned by `Analyze cases` is the only stage-specific carry-over today and is slotted into the next stage's prompt under `## Cases table`.

## Stage → skill mapping

The index describes stages as engineering actions. Map them to skills as follows:

| Stage name (from any stack's index) | How to run it |
|---|---|
| Contracts | `Agent` → `write-interfaces` |
| Stubs | `Agent` → `scaffold-stubs` |
| Analyze cases | `Agent` → `analyze-cases` |
| Tests | `Agent` → `write-tests` |
| Verify tests | `Agent` → `verify-tests` |
| Implementation | `Agent` → `write-implementation` |
| Verify logic | `Agent` → `verify-logic` |
| Verify style | `Agent` → `verify-style` |
| Run tests / Run tests + type-check / Format / OpenAPI regen | Inline `Bash` from `working_dir`, using the pipeline-level command from the index. No skill invoked. |

The mapping is a superset across all stacks: a stack whose pipeline omits a row simply never triggers that row. If the index lists a stage name not in this table, that is a contract mismatch — stop and report.

## Pipeline dispatch

Walk stages in the order the index lists them. For each stage: skill-backed → spawn one `Agent` (default `subagent_type=general-purpose`) whose prompt invokes the mapped skill via `Skill`; shell-backed → run the pipeline-level command via `Bash` from `working_dir`; conditional → evaluate the precondition documented in the index, mark `skipped` if false. Verification stages loop up to the index's per-stage retry cap; on the final failure within the cap, stop and report.

## Failure handling

From the Implementation stage onward, test files are frozen — the index's test-freeze rule is in every prompt. If a subagent reports that the only correct fix would require editing a test, stop and escalate to the user; never auto-rewind to an earlier stage. Any other failure that exhausts its index-declared retry cap also stops the pipeline.

## Final report

Emit the report per `references/final-report.md`. Pipeline label and stage list come from the index.
