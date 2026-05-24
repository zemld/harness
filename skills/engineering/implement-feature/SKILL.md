---
name: implement-feature
description: Drive a complete Go code-writing flow from a structured spec — interfaces, stubs, tests, verify-tests, implementation (tests frozen), go test, verify-logic, format, verify-style. The spec is the design; this skill is pure execution. Use when the caller has a finished design spec (intent, working_dir, files, interfaces) and wants verified, formatted, style-clean code. Trigger on "implement this feature", "run the implementation flow", "execute the spec", "реализуй фичу по спеке", "запусти имплементацию", or when an upstream skill hands off a completed design spec. Do NOT use for design or decomposition — those are upstream concerns the spec must already resolve.
---

Take a completed design spec and walk it through nine stages: contracts → stubs → tests → verify-tests → implementation → `go test` → verify-logic → format → verify-style. Every skill stage runs inside a dedicated `Agent` subagent for context isolation. The orchestrator never edits production code itself.

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
working_dir:      # absolute path to the Go service root
files:            # list of file paths (relative to working_dir) the change creates/modifies
interfaces:       # list of interfaces: name, package path, method signatures
```

Optional fields:

```yaml
edge_cases:       # list of cases the tests must cover (happy / edge / error)
dependencies:     # other packages/ports the implementation uses
notes:            # constraints to respect (perf budgets, no-go APIs, etc.)
prd_path:         # absolute path to PRD.md, used only as secondary reference for ambiguity
```

## Step 0: Validate the spec

Verify every required field is present and non-empty. If anything is missing, **stop and report the missing fields in the final report**. Do not invent missing fields and do not attempt to ask back interactively — the caller is typically a subagent and will re-invoke after correcting the spec.

Derive once and reuse throughout:

- `production_files` = files in `files` not ending in `_test.go`
- `test_files` = files in `files` ending in `_test.go`
- `affected_packages` = unique directory paths from `files` (used by Stage 6)

## Pipeline

Run the 9 stages in order. Maintain a status table internally: stage number, status (pending / running / done / failed), retry count. Every stage that invokes a skill runs inside an `Agent` subagent (default `subagent_type=general-purpose`). The Agent prompt invokes the named skill via the `Skill` tool, supplying the inputs that skill needs.

### Stage 1 — Contracts (`write-interfaces`)

Spawn Agent:

> "Use the `write-interfaces` skill. Feature intent: \<intent\>. Working dir: \<working_dir\>. Interfaces to define: \<interfaces, formatted as name + package path + method signatures\>."

Cap: 0 retries. On failure → stop and report.

### Stage 2 — Stub structs (`scaffold-stubs`)

Spawn Agent:

> "Use the `scaffold-stubs` skill. Working dir: \<working_dir\>. For each interface produced in stage 1, scaffold the implementing struct in its target package (per `files`), with constructor and one `panic('not implemented')` method per interface method."

Cap: 0 retries. On failure → stop and report.

### Stage 3 — Tests (`write-tests`)

Spawn Agent:

> "Use the `write-tests` skill. Intent: \<intent\>. Working dir: \<working_dir\>. Files to test: \<production_files\>. Edge cases to cover: \<edge_cases\>. Implementation stubs currently panic('not implemented') — tests are expected to FAIL at runtime. Your job is to write tests that COMPILE; do not check that they pass."

Cap: 0 retries. On failure → stop and report.

### Stage 4 — Verify tests (`verify-tests`)

Spawn Agent:

> "Use the `verify-tests` skill. Test files to review: \<test_files\>. Implementation stubs still panic — that is expected. Audit structure, AAA layout, table-driven form, parallelism, mockery usage, and coverage against the edge cases. Do NOT check whether tests pass."

If verdict is clean → continue.

If verdict has violations → spawn `write-tests` Agent with the verify-tests findings prepended to the original Stage 3 prompt, then re-run verify-tests. Cap: 1 retry. On final failure → stop and report.

### Stage 5 — Implementation (`write-implementation`)

Spawn Agent:

> "Use the `write-implementation` skill. Working dir: \<working_dir\>. Files: \<files\>. Intent: \<intent\>. Dependencies: \<dependencies or 'none'\>. Notes: \<notes or 'none'\>. CONSTRAINT: Test files (`_test.go`) are FROZEN — do not open, modify, or write any test file. Goal: replace `panic('not implemented')` stubs with real logic that makes the existing tests pass. If \<prd_path\> is provided and the spec design is ambiguous, you may consult it as a secondary reference for the original intent. Do NOT redesign based on PRD — read it only to resolve genuine ambiguity in the spec."

Cap: 0 retries at this stage. Retries happen via stage 6 and stage 7 loops below.

### Stage 6 — `go test` (inline)

Scope the run to `affected_packages` (derived in Step 0 from `files`). Run from `working_dir`:

```
go test ./<pkg1>/... ./<pkg2>/...
```

One invocation covering all affected packages. Do not run `./...` for the whole module — that wastes time on unrelated tests and noises up the output.

If tests pass → continue to Stage 7.

If tests fail → spawn an ad-hoc debug-failing-tests Agent (not a named skill — a one-off Agent with this prompt):

> "Diagnose and fix failing tests for this change in `<working_dir>`. CONSTRAINT: you may only modify production code. Do NOT modify any `_test.go` file under any circumstances. If the only correct fix would require changing a test, stop and report — do not attempt the change.
>
> `go test` output:
> \<full output verbatim\>"

Re-run `go test` after the Agent returns. Cap: 2 retries. On final failure → stop and report.

### Stage 7 — Verify logic (`verify-logic`)

Spawn Agent:

> "Use the `verify-logic` skill. Intent: \<intent\>. Files: \<production_files\>."

If verdict is pass → continue.

If verdict is fail → spawn `write-implementation` Agent with the same prompt as Stage 5 plus the verify-logic findings prepended. **The test-freeze constraint must be included verbatim.** Then re-run Stage 6 (`go test`) and Stage 7 (`verify-logic`). Cap: 1 retry. On final failure → stop and report.

### Stage 8 — Format (inline)

Run from `working_dir`:

```
make format
```

If exit code is 0 → continue.

If non-zero → stop and report the verbatim output.

### Stage 9 — Verify style (`verify-style`)

Spawn Agent:

> "Use the `verify-style` skill. Context: \<intent\>. Files: \<production_files\>."

If verdict is clean → pipeline complete.

If verdict has violations → spawn an ad-hoc fix-style Agent (this is not a named skill — it is a one-off Agent prompted to apply the violations table):

> "Fix the following style/structure/dependency violations in the listed files. Each row has File:Line, Category, Rule, Violation, and Suggested Fix — apply each fix exactly. CONSTRAINTS: do NOT modify `_test.go` files; do NOT expand scope beyond files listed in the violations table. After fixing, run `make format` in `<working_dir>`. Report when done.
>
> Violations:
> \<verify-style table verbatim\>"

Re-run `verify-style` after the Agent returns. Cap: 1 retry. On final failure → stop and report both the latest violations and the fix Agent's report.

## Failure handling — general

- **Past cap → stop.** Surface the last failure output to the user along with the stage name. The user decides whether to retry manually, amend the spec, or abandon.
- **Test-freeze constraint propagates.** Every Agent that touches production code in retry loops (Stage 6 debug, Stage 7 retry, Stage 9 fix) must include the test-freeze instruction verbatim.
- **Never edit code yourself.** The orchestrator only spawns subagents and runs `go test` / `make format`. No `Edit` or `Write` tool calls from the orchestrator's own context against production files.
- **Never expand `files`.** If a subagent reports it needs to touch a file not in `files`, that is a spec gap — escalate to the user, do not silently widen scope.

## Final report

When the pipeline ends (success or stop-on-failure), output:

```
## implement-feature: <first line of intent>

Verdict: PASS | FAIL — <stage that stopped, if FAIL>

| # | Stage              | Status | Notes |
|---|--------------------|--------|-------|
| 1 | Contracts          | ✓ / ✗  | <files created>                |
| 2 | Stubs              | ✓ / ✗  | <files created>                |
| 3 | Tests              | ✓ / ✗  | <files created>                |
| 4 | Verify tests       | ✓ / ✗  | <violations / clean>           |
| 5 | Implementation     | ✓ / ✗  | <files modified>               |
| 6 | go test            | ✓ / ✗  | <pass / N failures>            |
| 7 | Verify logic       | ✓ / ✗  | <matches intent / N issues>    |
| 8 | Format             | ✓ / ✗  | <clean / output>               |
| 9 | Verify style       | ✓ / ✗  | <violations / clean>           |

Files created / modified:
- <one per line>

Blocking issues (if FAIL):
- <one per line>
```

## Anti-patterns

- **Editing code directly.** The orchestrator spawns subagents; it never opens production files itself.
- **Skipping stages.** Every stage runs in order. Skipping `verify-tests` means tests are not vetted; skipping `verify-style` means style debt accumulates.
- **Running stages out of order.** The order is fixed: contracts → stubs → tests → verify-tests → implement → go test → verify-logic → format → verify-style. Implementing before tests means tests rubber-stamp the implementation.
- **Expanding scope.** The `files` list is the boundary. If a subagent needs a file not in `files`, escalate.
- **Looping past caps.** The retry caps are explicit. Past cap → stop.
- **Calling `review-changes`.** It runs at the feature-workflow level (after all chunks are done), not per-chunk. Calling it here would duplicate work and dilute its feature-wide view. If a final human-style review is wanted, `feature-workflow` or the user invokes `/review-changes` after this orchestrator finishes.
- **Treating the spec as advisory.** The spec is the contract. Do not redesign mid-flow.
- **Writing back to `spec.md`.** This skill is pure execution. It reads from `spec.md` in Mode A but never writes there. The Agent / parent that invoked this skill is responsible for updating the chunk's Status row after the pipeline returns.
