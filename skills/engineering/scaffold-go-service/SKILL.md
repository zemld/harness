---
name: scaffold-go-service
description: Scaffold a new Go microservice from scratch — full directory layout, boilerplate files, and transport stubs. Use this skill whenever the user wants to start a new Go service, backend microservice, or Go project from zero. Trigger on phrases like "new Go service", "scaffold a service", "create a microservice", "bootstrap a Go project", "set up a new backend service", or any concrete description of starting a Go service that needs a project skeleton, even if the word "scaffold" isn't used.
---

Scaffold a new Go microservice following the canonical layout in `docs/engineering/go/service-structure.md`.

## 1. Gather inputs

Ask for anything not already provided:

| Input | Format | Example |
|---|---|---|
| **Service name** | kebab-case | `user-service` |
| **Go module path** | full module path | `github.com/org/project/user-service` |
| **Output directory** | absolute or relative path | `backend/services/user-service` |
| **Transport** | `rest`, `grpc`, or `both` | `both` (default) |

## 2. Run the scaffold script

Locate the script relative to the harness root and run:

```bash
python skills/engineering/scaffold-go-service/scripts/scaffold.py \
  --name <name> \
  --module <module> \
  --out <out> \
  --transport <transport>
```

The script prints every file it creates and a post-scaffold checklist when done.

## 3. Post-scaffold steps

Walk the user through these after the script finishes:

**Rename the placeholder packages**

The script generates a skeleton `example` service and repository so the project compiles from day one. Help the user rename them to their domain:
- `internal/services/example/` → `internal/services/<domain>/`
- `internal/adapters/repository/example/` → `internal/adapters/repository/<domain>/`
- Update all import paths and the `var _ Interface = (*Impl)(nil)` compile-time checks.

**Add domain models**

`internal/domain/errors.go` is the only domain file created. Guide the user to add entities and value objects. Consult `docs/engineering/go/service-structure.md` for the scoping rule: models start in a service-scoped subdirectory and get promoted to the top level only when a second service needs them.

**Wire `app.go`**

`internal/app/app.go` has TODO stubs. Help the user wire their adapters and services using the constructor-injection pattern from the reference service (`backend/services/perfumist/internal/app/app.go`).

**Register mocks in `.mockery.yml`**

After creating interfaces that tests will depend on, add them to `.mockery.yml` and run `mockery` from the service directory. Never edit generated files in `mocks/` by hand.

**Infra (new services only)**

If this service is being added to an existing project, remind the user to:
- Add a service entry to `infra/testing/docker-compose.yaml`
- Add Kubernetes manifests under `infra/production/k8s/`

## Reference docs

Read these when answering "how do I do X in this service?":

- `docs/engineering/go/service-structure.md` — layers, layout, interface rules
- `docs/engineering/go/dependencies.md` — which library to use for each concern
- `docs/engineering/go/testing.md` — table-driven tests, mockery v3, AAA
- `docs/engineering/go/style.md` — nesting limits, function length, parameters
