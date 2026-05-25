---
name: implement-feature
description: Drive a complete code-writing flow from a structured spec by running the chunk through the pipeline defined for its stack in `docs/engineering/<stack>/index.md`. The spec is the design; this skill is pure execution. Use when the caller has a finished design spec (intent, working_dir, files, interfaces) and wants verified, formatted code. Trigger on "implement this feature", "run the implementation flow", "execute the spec", "реализуй фичу по спеке", "запусти имплементацию", or when an upstream skill hands off a completed design spec. Do NOT use for design or decomposition — those are upstream concerns the spec must already resolve.
---

Take a completed design spec, detect what kind of project the chunk targets, look up the implementation pipeline for that stack in `docs/engineering/<stack>/index.md`, and execute the stages it lists. Every skill stage runs inside a dedicated `Agent` subagent for context isolation. The orchestrator never edits production code itself.

This skill is a generic stage runner. Stack-specific stage lists, commands, retry caps, and test-freeze patterns all live in the index. Adding a new stack means writing its index — no edit to this skill.

## Inputs

Two invocation modes:

**Mode A — From `feature-workflow` (preferred).** Caller passes:
- `spec_path` — absolute path to `spec.md`
- `chunk_id` — chunk identifier (e.g. `C2`)
- `prd_path` — absolute path to `PRD.md` (optional but usually present)

Read the chunk's section `## Chunk <chunk_id> — <name>` from `spec.md`. Extract the structured fields below from its subsections.

**Mode B — Direct invocation.** Caller passes the structured spec inline in the prompt.

Either way, the resolved spec must contain:

Required fields:

```yaml
intent:           # 1–3 sentences — what this code does and why
working_dir:      # absolute path to the project root
files:            # list of file paths (relative to working_dir) the change creates/modifies
interfaces:       # list of interfaces/contracts: name, location, signatures (may be "—" for stacks without formal interfaces)
```

Optional fields:

```yaml
edge_cases:       # list of cases the tests must cover (happy / edge / error)
dependencies:     # other packages/ports/modules the implementation uses
notes:            # constraints to respect (perf budgets, no-go APIs, etc.)
prd_path:         # absolute path to PRD.md, used only as secondary reference for ambiguity
```

## Step 0 — Validate and load the pipeline

### 0a. Validate the spec

Verify every required field is present and non-empty. If anything is missing, **stop and report the missing fields in the final report**. Do not invent missing fields and do not attempt to ask back interactively — the caller is typically a subagent and will re-invoke after correcting the spec.

### 0b. Detect the target stack

Determine the stack from the chunk's context, in this order:

1. **`working_dir` manifest.** `go.mod` → stack `go`. `package.json` (typically with `vite.config.ts`) → stack `frontend`. Other manifests map to other stacks the harness has indexes for.
2. **Chunk's `files` paths.** Used when `working_dir` has multiple manifests or doesn't exist yet (pending bootstrap). Map file extensions and top-level directories to a stack — `.go` files / `internal/` / `cmd/` → `go`; `.ts(x)` / `src/features/` / `src/pages/` → `frontend`.
3. **Ambiguous.** If neither signal resolves cleanly, stop and report. A single chunk targets exactly one stack — cross-stack work splits into separate chunks linked by `Depends on`.

### 0c. Load the pipeline from the stack's index

Read `docs/engineering/<stack>/index.md`. Locate the `## Implementation pipeline` section. Read:

- The pipeline-level constants (test command, format command, type-check command, OpenAPI regen command if listed).
- The stage table (stage number, name, action, retry cap).
- The test-freeze rule and the scope rule.
- The final report pipeline label.

If no `## Implementation pipeline` section exists in the index, stop and report the gap.

The index describes each stage as an engineering action — it does not name skills. The mapping from stage name to the skill that performs it lives in this orchestrator (see "Stage → skill mapping" below).

### 0d. Derive reusable values

Compute these from the chunk's `files`:

- `production_files` = files that don't match the stack's test-file patterns (the index's test-freeze rule defines those patterns).
- `test_files` = files matching the test-file patterns.
- `affected_paths` = unique directory paths from `files`, used by stages that scope test or type-check runs.
- For stages with conditional preconditions (such as a Frontend pipeline's Stage 0 OpenAPI regen): evaluate the precondition. The index documents the precondition for each conditional stage.

## Stage → skill mapping

The index describes stages as engineering actions. Map them to skills as follows:

| Stage name (from any stack's index) | Skill to invoke |
|---|---|
| Contracts | `write-interfaces` |
| Stubs | `scaffold-stubs` |
| Tests | `write-tests` |
| Verify tests | `verify-tests` |
| Implementation | `write-implementation` |
| Verify logic | `verify-logic` |
| Verify style | `verify-style` |
| Run tests / Run tests + type-check / Format / OpenAPI regen | inline shell — use the pipeline-level command from the index, run via `Bash` from `working_dir`. No skill invoked. |

If a stack's index introduces a stage name not in this table, treat that as a contract mismatch — stop and report. Adding a stage means updating this mapping (and likely the harness's skill set).

## Pipeline dispatch

Run the stages from the loaded pipeline in order. Maintain a status table internally: stage number, status (pending / running / done / skipped / failed), retry count.

For each stage:

- **Skill-backed stage.** Look up the skill in the mapping above. Spawn an `Agent` subagent (default `subagent_type=general-purpose`) whose prompt invokes that skill via the `Skill` tool and supplies the inputs the skill needs: chunk `intent`, `working_dir`, the relevant files from `production_files` / `test_files`, plus the stage's documented constraints from the index (e.g. "stubs panic — tests must compile but may fail at runtime", "test files are FROZEN", "production files do not exist yet").
- **Shell-backed stage.** Run the pipeline-level command from the index via `Bash` from `working_dir`.
- **Conditional stage.** Evaluate the precondition documented in the index. If false, mark the stage `skipped` and continue.
- **Loop stages.** Some stages are loops with their own retry cap (verify steps, run-tests, format/verify-style). The index describes the loop body. Honour the documented cap. On final failure within the cap, stop and report.

### Failure handling — general

- **Past cap → stop.** Surface the last failure output to the user along with the stage name. The user decides whether to retry manually, amend the spec, or abandon.
- **Test-freeze constraint propagates.** Whenever a retry / debug / fix Agent touches production code, include the stack's test-freeze rule (from the index) verbatim in its prompt. Without it the agent may edit tests to make them pass — a failure mode the pipeline exists to prevent.
- **Never edit code yourself.** The orchestrator spawns subagents and runs the index's inline shell commands. No `Edit` or `Write` tool calls from the orchestrator's own context against production files.
- **Never expand `files`.** If a subagent reports it needs to touch a file outside the chunk's `files` list, that is a spec gap — escalate, do not silently widen scope.

## Final report

When the pipeline ends (success or stop-on-failure), output:

```
## implement-feature: <first line of intent>

Pipeline: <stack name from the index, e.g. Go | Frontend>
Verdict: PASS | FAIL — <stage that stopped, if FAIL>

| # | Stage              | Status              | Notes |
|---|--------------------|---------------------|-------|
| <one row per stage in the pipeline, in order; status ∈ {✓, ✗, skipped} > |

Files created / modified:
- <one per line>

Blocking issues (if FAIL):
- <one per line>
```

The exact stage list comes from the index — do not hardcode it here. The status column uses `✓` for success, `✗` for failure, `skipped` for conditional stages whose precondition didn't hold.

## Anti-patterns

- **Hardcoding pipeline stages in this skill body.** The pipeline lives in the index. If you find yourself listing stages here, you're drifting from the design.
- **Editing code directly.** The orchestrator spawns subagents; it never opens production files itself.
- **Skipping stages.** Every stage runs in order unless the index marks it conditional.
- **Running stages out of order.** The order in the index is the order of execution. Implementing before tests means tests rubber-stamp the implementation.
- **Looping past caps.** The retry caps are explicit in the index. Past cap → stop.
- **Calling `review-changes`.** It runs at the feature-workflow level (after all chunks are done), not per-chunk. Calling it here duplicates work and dilutes its feature-wide view.
- **Treating the spec as advisory.** The spec is the contract. Do not redesign mid-flow.
- **Writing back to `spec.md`.** This skill is pure execution. It reads from `spec.md` in Mode A but never writes there. The Agent / parent that invoked this skill is responsible for updating the chunk's Status row after the pipeline returns.
