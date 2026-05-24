---
name: service-refactor
description: Audit a Go service against project conventions (docs/engineering/go/) and fix every violation — restructures files, corrects imports, applies style fixes, and delegates complex behavioral changes to feature-workflow. Use proactively when the user says "refactor the service", "приведи сервис к стандартам", "audit the service", "проверь сервис по конвенциям", "сервис не соответствует конвенциям", "check the service against conventions", or asks whether a service matches the project's Go standards.
---

Audit a Go service end-to-end against the project's conventions and fix every violation. Covers structure, layering, style, testing, transactions, and tooling. Mechanical violations are fixed directly in-session; behavioral ones are delegated to `feature-workflow`.

## Inputs

Ask for these if not provided:

- **Service path** — absolute path to the Go service root (the directory containing `go.mod`).

## Step 1 — Audit

Spawn an **Explore** subagent with the following prompt (substitute `<service_path>` and `<harness_root>` — the repo containing `docs/engineering/go/`):

---
You are a Go conventions auditor. Read-only — never modify any file.

**Service to audit:** `<service_path>`

**Instructions:**

1. Read the following docs in full. Paths are relative to `<harness_root>`:
   - `docs/engineering/go/service-structure.md`
   - `docs/engineering/go/style.md`
   - `docs/engineering/go/testing.md`
   - `docs/engineering/go/dependencies.md`

2. Read the full contents of `<service_path>`: every `.go` file, `go.mod`, `Makefile`, `.golangci.yml`, `.mockery.yml`, and `api/openapi.yaml` if present.

3. For every violation, record one row per category table below. Be exhaustive — every rule in every doc applies.

**Category definitions and rules to check:**

**Structure** (`service-structure.md`):
- `service.go` / `repository.go` hold only struct + constructor — no operation methods
- One public operation per file, file named after the operation
- `ports/repository/<name>.go`: small segregated interfaces + one aggregate `Repository` embedding all (used only in `app.go`)
- No interface name stutter (package `perfume` → `Saver`, not `PerfumeSaver`)
- Domain entities in `internal/domain/<bounded_context>/entities/`; moved to `shared/` only when a second bounded context needs them
- `internal/app/app.go` is the only file that imports concrete adapter types
- `utils/` only for fully generic, domain-free helpers
- `_test.go` files co-located next to the code they test

**Dependency** (`service-structure.md`):
- `domain/` has zero imports from `internal/`
- `services/` imports only `domain/` types and `ports/` interfaces — never concrete adapters
- Services import from `ports/`, never redeclare port interfaces locally
- Only `internal/app/app.go` may import and wire concrete implementations

**Style** (`style.md`):
- Maximum 2 levels of nested control flow
- Function body under 30 lines of logic
- Maximum 3 parameters (`context.Context` excluded)
- Maximum 2 return values total
- No bool flag arguments that switch behavior
- Early returns for errors/edge cases; happy path at lowest indentation
- Comments only when the WHY is non-obvious

**Testing** (`testing.md`):
- Every test function is table-driven (even single-case)
- `t.Parallel()` at the top of every test function and every `t.Run` subtest
- AAA structure with a blank line between Arrange / Act / Assert
- One `TestXxx` per public method or function
- All mocks generated with mockery v3 — never hand-written

**Transaction** (CLAUDE.md rule):
- Every repository write method wraps all operations in a single `pgx` transaction:
  `tx, err := r.pool.Begin(ctx)` + `defer tx.Rollback(ctx)` + `tx.Commit(ctx)`
- Helper methods accept `pgx.Tx`, never call `r.pool` directly

**Tooling**:
- `.golangci.yml` exists at the service root
- `.mockery.yml` exists at the service root if the service has any mocks
- `Makefile` has a `format` target

**Output format:**

Write a Markdown report to `<service_path>/audit-report.md` using this exact structure:

```
# Audit Report: <service name>

**Path:** <service_path>
**Date:** <today's date>

## Summary

| Category    | Direct | Behavioral | Total |
|-------------|--------|------------|-------|
| Structure   | ...    | ...        | ...   |
| Dependency  | ...    | ...        | ...   |
| Style       | ...    | ...        | ...   |
| Testing     | ...    | ...        | ...   |
| Transaction | ...    | ...        | ...   |
| Tooling     | ...    | ...        | ...   |
| **Total**   | ...    | ...        | ...   |

---

## Structure

| # | File:Line | Rule | Violation | Complexity |
|---|-----------|------|-----------|------------|

## Dependency

| # | File:Line | Rule | Violation | Complexity |
|---|-----------|------|-----------|------------|

## Style

| # | File:Line | Rule | Violation | Complexity |
|---|-----------|------|-----------|------------|

## Testing

| # | File:Line | Rule | Violation | Complexity |
|---|-----------|------|-----------|------------|

## Transaction

| # | File:Line | Rule | Violation | Complexity |
|---|-----------|------|-----------|------------|

## Tooling

| # | File:Line | Rule | Violation | Complexity |
|---|-----------|------|-----------|------------|

---

**N violation(s): D direct, B behavioral.**
```

- **File:Line** — e.g. `internal/services/foo/service.go:15`
- **Rule** — exact rule name (e.g. "service.go is minimal", "One operation per file")
- **Violation** — what is concretely wrong at this location
- **Complexity** — `direct` (rename, move, fix import, add missing file) or `behavioral` (new logic, transaction wrapping, test rewrite)

Omit a category's table entirely if it has zero violations. If all categories are clean, replace all tables with:

`All rules satisfied — no violations found.`
---

## Step 2 — Present audit and confirm

Tell the user the full report is at `<service_path>/audit-report.md`. Render the Summary table and all violation tables inline in chat.

If zero violations → report success and stop.

Otherwise ask:

> *"Found N violation(s): D direct (I'll fix those now) and B behavioral (I'll hand those to feature-workflow). Shall I proceed?"*

Wait for confirmation before fixing.

## Step 3 — Apply direct fixes

For each `direct` violation, apply the fix in the current session:

- **Structure violations** — rename files to match operation names; move operation methods out of `service.go` into their own files; fix interface names; split merged operations into separate files; create missing `.golangci.yml` or `.mockery.yml` using the service's Go version.
- **Dependency violations** — correct import paths; remove locally redeclared port interfaces; replace with imports from `ports/`.
- **Style violations** — extract nested blocks into helpers; split long functions; merge extra return values into a struct; remove bool flag parameters by splitting into two functions; invert conditions to produce early returns.
- **Tooling violations** — add missing `.golangci.yml` (copy structure from `docs/engineering/go/service-structure.md` guidance); add `format` target to `Makefile`.

After all direct fixes, run:

```bash
cd <service_path> && make format
```

Fix any failures before continuing.

## Step 4 — Delegate behavioral violations

For each `behavioral` violation, invoke the `feature-workflow` skill with a focused, self-contained feature description. Pass `working_dir = <service_path>`. Frame each as a minimal, scoped task:

| Violation type | feature-workflow prompt |
|---|---|
| Transaction missing in repository method `X` | "Wrap all database operations in repository `X` in a single pgx transaction following the CLAUDE.md transaction convention." |
| Test missing for operation `X` | "Write tests for `X` in `<file>` following `docs/engineering/go/testing.md`: table-driven, parallel, AAA, mockery mocks." |
| Test not table-driven / wrong structure | "Rewrite tests for `<file>` to be table-driven with `t.Parallel()` and AAA structure per `docs/engineering/go/testing.md`." |

Wait for each feature-workflow invocation to complete before starting the next.

## Step 5 — Final verification

Invoke the `verify-style` skill with all modified files and the service context. If it surfaces new violations, apply remaining direct fixes inline or report them to the user.

Final report to the user:

- Direct violations fixed: D.
- Behavioral violations delegated to feature-workflow: B.
- Audit report: `<service_path>/audit-report.md`.
- Any remaining open issues (violations that couldn't be auto-fixed).
