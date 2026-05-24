---
name: scaffold-stubs
description: Create empty Go struct files implementing a set of interfaces, with constructor and one stub method per interface method whose body is exactly `panic("not implemented")`. Use immediately after `write-interfaces` to give the next stage (tests) something to compile against. Trigger on "scaffold stubs", "create stub structs", "make panic skeletons", "сделай заглушки", "набросай скелеты структур".
---

Create the concrete struct files that implement contracts produced by `write-interfaces`. Each struct contains only its definition, its constructor, and one stub method per interface method — never any real logic.

## Reference

File placement follows `docs/engineering/go/service-structure.md`. Read it before writing anything.

## Inputs

- **`working_dir`** — absolute path to the Go service root.
- **Structs to scaffold** — for each struct: package path (e.g. `internal/services/users/creation`), struct name (e.g. `Service`), the port interfaces it depends on (e.g. `repository.Saver`), and the list of method signatures from the interface(s) it implements.

If any input is missing, ask once.

## Step 1: Create the struct definition file

For each struct, create exactly one file:

- Service struct → `<package>/service.go`
- Repository struct → `<package>/repository.go`
- Client struct → `<package>/client.go`

The file contains only:

- `package` declaration
- Imports
- Struct definition with port-interface dependencies as fields
- Constructor named `New<StructName>` accepting those same interfaces as parameters

Example:

```go
package creation

import (
    "<module>/internal/ports/repository"
)

type Service struct {
    repo repository.Saver
}

func NewService(repo repository.Saver) *Service {
    return &Service{repo: repo}
}
```

No methods in this file. No initialization logic beyond the constructor.

## Step 2: Create one stub file per method

For each public method on each interface the struct implements, create one file named after the operation in snake_case: `create_user.go`, `find_by_id.go`, `charge_payment.go`.

Each file contains only:

- `package` declaration
- Imports
- One method with the exact signature from the interface
- Body: a single line — `panic("not implemented")`

Example:

```go
package creation

import (
    "context"

    "<module>/internal/domain/users/entities"
)

func (s *Service) CreateUser(ctx context.Context, req entities.CreateUserRequest) (entities.User, error) {
    panic("not implemented")
}
```

The panic string must be exactly `"not implemented"`. Downstream skills key on this exact string to distinguish "implementation stage hasn't run yet" from a real runtime bug.

## Step 3: Mocks

For every new port interface that tests or other code will mock:

1. Add the interface to `.mockery.yml` at the service root.
2. Run `mockery` from the service root.

Never hand-edit files under `mocks/`.

## Step 4: Build check

From `working_dir`:

```
go build ./...
```

Fix every compilation error before reporting done. Common causes: missing import, wrong receiver type (pointer vs value), signature mismatch with the interface.

## Anti-patterns

- **Writing real logic.** This skill produces panic stubs only. Implementation is `write-implementation`'s job.
- **Stacking methods in `service.go` / `repository.go` / `client.go`.** Those files contain struct + constructor only. Methods live in their own files.
- **Skipping `mockery`.** If a new port interface isn't in `.mockery.yml`, tests against it cannot compile.
- **Touching `_test.go` files.** This skill creates production code only.
- **Overwriting existing stubs.** If a stub already exists for an operation, leave it alone.
