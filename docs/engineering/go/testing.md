# Go Testing Conventions

## Contents
- Framework
- Structure
- Mocks
- Example

## Framework

Use [testify](https://github.com/stretchr/testify): `require` for assertions that must stop the test on failure, `assert` for non-fatal checks that let the test continue.

## Structure

**Table-driven only.** Every test function is table-driven — even a single-case test. Consistency matters more than brevity.

**AAA.** Each table case body follows Arrange / Act / Assert with an explicit blank line between each section.

**One behavior per test function.** Each `TestXxx` covers exactly one public method or function. If two methods need testing, write two `TestXxx` functions.

**Co-located, same package.** `_test.go` files live next to the file they test — no separate `test/` directory. Use the same package name (e.g. `package creation`), not the `_test` suffix variant.

**Parallel by default.** Call `t.Parallel()` at the top of the test function and at the top of each `t.Run` subtest unless the test explicitly requires serial execution.

**Assertion placement — data-driven or closure-driven.** Two styles are allowed; pick whichever reads cleaner for the case at hand.

- *Data-driven* (default): the table holds expected values (`wantID int64`, `wantErr error`) and the loop body does the asserting. Best when every case checks the same things.
- *Closure-driven*: a case carries its assertions in a field, e.g. `check func(t *testing.T, id int64, err error)` or a narrower `checkErr func(t *testing.T, err error)`. Best when cases check different things and you want each case to declare its own expectations inline.

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
