# Go Testing Conventions

## Contents
- Framework
- Structure
- Mocks
- Example

## Framework

Use [testify](https://github.com/stretchr/testify): `require` for assertions that must stop the test on failure, `assert` for non-fatal checks that let the test continue.

## Structure

**Table-driven for multiple scenarios.** Use a table when a function has two or more scenarios; keep a single-scenario test linear.

**AAA.** Each table case body follows Arrange / Act / Assert with an explicit blank line between each section.

**One behavior per test function.** Each `TestXxx` covers exactly one public method or function. If two methods need testing, write two `TestXxx` functions.

**Co-located, same package.** `_test.go` files live next to the file they test — no separate `test/` directory. Use the same package name (e.g. `package creation`), not the `_test` suffix variant.

**Parallel by default.** Call `t.Parallel()` at the top of the test function and at the top of each `t.Run` subtest unless the test explicitly requires serial execution.

**Assertion placement — data-driven or closure-driven.** Two styles are allowed; pick whichever reads cleaner for the case at hand.

- *Data-driven* (default): the table holds expected values (`wantID int64`, `wantErr error`) and the loop body does the asserting. Best when every case checks the same things.
- *Closure-driven*: a case carries its assertions in a field, e.g. `check func(t *testing.T, id int64, err error)` or a narrower `checkErr func(t *testing.T, err error)`. Best when cases check different things and you want each case to declare its own expectations inline.

## Review-derived rules

### `GO-TEST-COVERAGE-01` — scenario matrix (`MUST`)

- **Condition:** the change modifies observable behavior of an operation.
- **Requirement:** add a separate scenario for every valid outcome and every significant error or boundary branch in the changed contract.
- **PASS:** the test table covers all changed outcomes, including success and failure paths.
- **FAIL:** only an error path is covered, one success path is covered when several outcomes exist, or a changed boundary branch is missing.
- **BLOCKED:** valid outcomes are not defined in the contract or ticket.

### `GO-TEST-CHECK-01` — expectation belongs to the scenario (`DEFAULT`)

- **Condition:** scenarios verify different result or error shapes.
- **Requirement:** store scenario-specific assertions in a `check` or `checkErr` closure inside the case; the shared loop performs only common actions.
- **PASS:** each distinct expectation is declared beside its input and mock setup.
- **FAIL:** the shared Assert section branches on the scenario name, flags, or type.
- **N/A:** every scenario verifies the same fields; use `want*` fields instead.

### `GO-TEST-DEDUP-01` — one test table per operation (`MUST`)

- **Condition:** a scenario is added for an operation that already has tests.
- **Requirement:** add the scenario to the existing table instead of creating a duplicate `TestXxx`.
- **PASS:** the operation has one scenario table.
- **FAIL:** several test functions repeat the same Arrange and Act steps and differ only in input or expectation.

### `GO-TEST-EXACT-01` — exact comparison (`MUST`)

- **Condition:** a result or error is typed and deterministic.
- **Requirement:** compare the exact value or typed or sentinel error; use a fragment only for unstable external text without a complete contract.
- **PASS:** the assertion checks the typed value with `Equal`, `ErrorIs`, or `ErrorAs`.
- **FAIL:** a stable typed contract is checked through a message fragment.

### `GO-TEST-BOUNDARY-01` — test level (`DEFAULT`)

- **Condition:** an integration or E2E test is proposed.
- **Requirement:** use it only for a real infrastructure boundary that a unit test cannot prove, and do not duplicate behavior already covered below that boundary.
- **PASS:** the test starts or calls the real boundary and verifies a contract unique to it.
- **FAIL:** the test repeats a unit scenario without covering additional infrastructure risk.
- **Exception:** a regression requires that exact integration; cite the reproducible defect.

### `GO-TEST-BEHAVIOR-01` — observable behavior (`MUST`)

- **Condition:** the change adds a test for a migration, configuration, DI wiring, pool, constructor, or another structural element.
- **Requirement:** verify an observable contract that can break; the mere presence of a file, field, or call is not behavior.
- **PASS:** the test has an input, action, and result meaningful to a caller or infrastructure boundary.
- **FAIL:** the assertion only confirms that structure exists or that a constructor returns a non-nil value without its own contract.

## Mocks

**mockery v3.** All mocks are generated with mockery v3. Never write mocks by hand. Configuration lives in `.mockery.yml` at the service root.

**Mock location.** The `mocks/` subdirectory lives next to the **implementation** being mocked — not next to the interface definition and not next to the test file. Interfaces may live in `ports/` (for clients and repositories) or `domain/` (for services); the mock always follows the implementation, not the interface. For repositories and clients, where the implementation lives in its own subdirectory (e.g. `adapters/postgres/`), `mocks/` is a sibling of that directory — not a subpackage inside it (e.g. `adapters/mocks/`, not `adapters/postgres/mocks/`).

**Regeneration.** After adding or changing any interface, run `mockery` from the service root before writing tests. Never edit files inside `mocks/` by hand — they are fully regenerated on each run.

## Example

```go
package creation

import (
    "context"
    "errors"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"

    "github.com/example/service/internal/domain"
    "github.com/example/service/internal/services/users/creation"
    "github.com/example/service/internal/services/users/creation/mocks"
)

func TestService_CreateUser(t *testing.T) {
    t.Parallel()

    tests := []struct {
        name    string
        input   domain.CreateUserInput
        setup   func(saver *mocks.Saver)
        wantID  int64
        wantErr bool
    }{
        {
            name:  "returns new user ID on success",
            input: domain.CreateUserInput{Name: "Alice", Email: "alice@example.com"},
            setup: func(saver *mocks.Saver) {
                saver.On("Save", mock.Anything, domain.CreateUserInput{
                    Name:  "Alice",
                    Email: "alice@example.com",
                }).Return(int64(42), nil)
            },
            wantID: 42,
        },
        {
            name:  "propagates repository error",
            input: domain.CreateUserInput{Name: "Bob", Email: "bob@example.com"},
            setup: func(saver *mocks.Saver) {
                saver.On("Save", mock.Anything, mock.AnythingOfType("domain.CreateUserInput")).
                    Return(int64(0), errors.New("db unavailable"))
            },
            wantErr: true,
        },
        {
            name:    "rejects empty name without calling repository",
            input:   domain.CreateUserInput{Email: "noname@example.com"},
            setup:   func(_ *mocks.Saver) {},
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()

            // Arrange
            saver := mocks.NewSaver(t)
            tt.setup(saver)
            svc := creation.New(saver)

            // Act
            id, err := svc.CreateUser(context.Background(), tt.input)

            // Assert
            if tt.wantErr {
                require.Error(t, err)
                return
            }
            require.NoError(t, err)
            assert.Equal(t, tt.wantID, id)
        })
    }
}
```
