---
name: write-implementation
description: Replace `panic("not implemented")` stubs with real Go logic that makes the existing tests pass. Test files (`_test.go`) are FROZEN — never modify them. Follows Clean Architecture (domain → service → adapter → transport). Use after `write-tests` and `verify-tests` have produced compiling-but-failing tests. Trigger on "implement the code", "fill in the stubs", "write the implementation", "напиши имплементацию", "реализуй заглушки", or when `implement-feature` reaches its implementation stage.
---

Write production code that satisfies the existing tests. The tests are the contract — read them, understand what they expect, implement to match.

## Reference

Read all three before writing anything:

- `docs/engineering/go/style.md` — function size, nesting, parameter count, early returns, no flag args
- `docs/engineering/go/service-structure.md` — layer placement, one operation per file, transactions
- `docs/engineering/go/dependencies.md` — what can import what

## Standing constraints

- **Test files are FROZEN.** Do not open, modify, or write any `_test.go` file. If a test appears wrong, stop and escalate to the caller — never edit a test.
- **Stay in scope.** Only touch files listed in `files`. Never silently expand to other packages.
- **Style is non-negotiable.** Functions ≤ ~30 lines of logic, nesting ≤ 2 levels, params ≤ 3–4 (`context.Context` excluded), early returns, no flag (`bool`) arguments. If you open a file to make any edit, fix any style violation already in that file before moving on.

## Inputs

- **`working_dir`** — absolute path to the Go service root.
- **`files`** — list of file paths (relative to `working_dir`) the implementation may touch.
- **`intent`** — 1–3 sentences explaining what the code does and why.
- **`dependencies`** *(optional)* — other packages or ports the implementation uses.
- **`notes`** *(optional)* — additional constraints (perf budgets, no-go APIs, etc.).

If any required input is missing, ask once.

## Step 1: Read the tests

For each non-test file in `files`, find its `_test.go` companion in the same package. Read every test in full. The tests define the behavioral contract: input shapes, expected outputs, error types, side effects, mock expectations.

If a test contradicts the `intent`, stop and escalate. Do not silently resolve the conflict.

## Step 2: Layered walk

Implement in dependency order: deepest layer first, outward last. Skip any layer not present in `files`.

### Domain (`internal/domain/`)

Pure types, no I/O, no imports from `internal/`. Add only types the spec or existing tests require.

### Service (`internal/services/<context>/<name>/`)

- `service.go` contains only struct + constructor (already produced by `scaffold-stubs`). Do not stack operations here.
- Each operation lives in its own file named after the operation (`create_user.go`, `cancel_order.go`).
- Service code imports only `domain/` types and `ports/` interfaces — never concrete adapters.
- If a service needs a new port interface, add it to `internal/ports/<type>/<name>.go` first, then to the service struct and constructor, then write the operation body.

### Adapter (`internal/adapters/`)

- Repositories → `internal/adapters/repository/<name>/<impl>/`.
- Clients → `internal/adapters/clients/<name>/<impl>/`.
- `repository.go` / `client.go` contain only struct + constructor.
- One file per operation.
- **Repository writes must wrap every operation in a single transaction.** Begin → `defer Rollback` → pass `pgx.Tx` to helpers → Commit. Helpers accept `pgx.Tx`, never `r.pool`.

### Transport (`internal/api/rest/` or `internal/api/grpc/`)

- REST: DTOs → convert → handler → server registration. Update `api/openapi.yaml` and re-run `go generate ./...` if endpoints changed.
- gRPC: update `.proto` → regenerate → convert → handler → server wiring.

## Step 3: Wire in `app.go`

If a new concrete type was added, register it in `internal/app/app.go`. This is the only place that may import concretes. Do not sneak concrete imports into services or adapters.

## Step 4: Build check

From `working_dir`:

```
go build ./...
```

Fix every compilation error before reporting done. **Do not run `go test`** — that is the orchestrator's job. This skill ends when the package compiles cleanly.

If `go build` reveals that the spec contradicts existing code (e.g. the spec assumed a type that doesn't exist), stop and escalate. Do not paper over the mismatch.

## Report

When complete, report in 2–3 sentences:

- Files created / modified.
- Any deviations from the spec, and why.
- "Ready for `go test` and `verify-logic`."

## Anti-patterns

- **Editing a `_test.go` file.** Forbidden under any circumstances. If a test seems wrong, escalate.
- **Stacking multiple operations in `service.go` / `repository.go` / `client.go`.** Each operation gets its own file.
- **Importing SDK packages inside `internal/services/`.** I/O goes through adapter interfaces.
- **Editing files under `mocks/` by hand.** Always regenerate via `mockery`.
- **Running `go test`.** That's the orchestrator's job; this skill stops at `go build`.
- **Expanding scope.** Only files in `files` are touched. If you discover work needed in another package, stop and report.
