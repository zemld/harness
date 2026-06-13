# Go engineering — docs index

This file routes generic skills to the rule-bearing docs that apply for a given engineering task in this stack. Each section lists which docs to read; the `Scaffold project` section additionally describes its procedure inline, because that procedure is Go-specific and lives nowhere else.

Sibling docs in this directory:

- [service-structure.md](./service-structure.md) — layers, layout, interface segregation, transactions.
- [style.md](./style.md) — function size, nesting, parameter count, early returns, comment policy.
- [testing.md](./testing.md) — table-driven, parallel, AAA, mockery v3.
- [dependencies.md](./dependencies.md) — which library to use for each concern.

## Scaffold project

Read:

- [service-structure.md](./service-structure.md) — canonical layout the scaffold must produce.
- [dependencies.md](./dependencies.md) — libraries that must be pinned in `go.mod`.

Conventions a fresh Go service must satisfy:

- **Inputs the scaffold consumes:** service name (kebab-case), Go module path (full, e.g. `github.com/org/project/user-service`), output directory, transport choice (`rest`, `grpc`, or `both` — `both` by default).
- **Top-level layout** (per [service-structure.md](./service-structure.md)): `cmd/`, `internal/{domain,services,adapters,ports,app,api}/`, `api/openapi.yaml` (for REST), `mocks/`, `infra/`.
- **Required files at the service root:** `go.mod`, `Makefile` (must define a `format` target), `.golangci.yml`, `.mockery.yml`.
- **Required boilerplate files:**
  - `internal/domain/errors.go` (the only domain file the scaffold seeds; entity types are added later per the scoping rule in [service-structure.md](./service-structure.md)).
  - `internal/app/app.go` (DI wiring stub — the only place that may import concrete adapter types).
  - One placeholder service package + one placeholder repository package that demonstrate the one-operation-per-file rule and let the project compile from day one.
- **Post-scaffold hand-off conventions:** the placeholder packages must be renamed by the user to their domain (`example` → `<domain>`), all import paths and the `var _ Interface = (*Impl)(nil)` compile-time checks updated, real entities added per [service-structure.md](./service-structure.md), `internal/app/app.go` wired, mocks registered in `.mockery.yml` then generated via `mockery` (never by hand), and infra entries added under `infra/testing/docker-compose.yaml` + `infra/production/k8s/` if the service joins an existing project.

The runner that produces this layout is the responsibility of the scaffolding skill; this index does not prescribe its implementation.

## Refactor project

Read every rule doc in this directory: [service-structure.md](./service-structure.md), [style.md](./style.md), [testing.md](./testing.md), [dependencies.md](./dependencies.md).

Audit the entire service (every `.go` file, plus `go.mod`, `Makefile`, `.golangci.yml`, `.mockery.yml`, `api/openapi.yaml`). For each violation record one row in the relevant category table.

Categories:

- **Structure** — [service-structure.md](./service-structure.md) rules on file/package layout.
- **Dependency** — [service-structure.md](./service-structure.md) rules on layering.
- **Style** — [style.md](./style.md).
- **Testing** — [testing.md](./testing.md).
- **Transaction** — repository writes wrap all operations in a single `pgx` transaction (CLAUDE.md rule).
- **Tooling** — `.golangci.yml` exists; `.mockery.yml` exists if mocks are present; `Makefile` has a `format` target.

Per-violation row: `File:Line | Rule | Violation | Complexity (direct | behavioral)`.

Direct fixes (apply in-session): file renames, moving operations out of `service.go`, fixing interface names, splitting merged operations, adding missing `.golangci.yml` / `.mockery.yml`, correcting import paths, removing locally redeclared port interfaces, extracting nested blocks, splitting long functions, merging extra return values into a struct, removing bool flag params by splitting into two functions, inverting conditions for early returns.

Behavioral fixes (carve out as a scoped follow-up feature and run through the standard feature pipeline — design, tests, implementation, verification):

- Missing transaction wrapper in repository method.
- Missing tests for an operation.
- Tests not table-driven / wrong structure.

After all direct fixes: `make format` from the service root.
