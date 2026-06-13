---
name: analyze-cases
description: Generates a complete table of test cases (happy path, edge, error, corner) for a function, method, handler, or repository operation, with the input condition and expected behavior for each.
---

Analyze the implementation described in context and produce a comprehensive table of all possible test cases. Cover every scenario — happy path, edge cases, error cases, and corner cases.

**Before building the table, answer these questions internally:**

- What is being implemented? (function, method, HTTP handler, gRPC method, repository operation)
- What are the inputs? (parameters, request fields, database state)
- What are the external dependencies? (database, third-party API, cache)
- What are the preconditions and postconditions? (auth, access rights, required system state)
- What can go wrong? (which error types must be distinguished)

**Case categories:**
- **Happy Path** — valid inputs, all dependencies succeed
- **Edge Case** — boundary values: empty string, nil/null, zero, empty collection, max/min allowed values
- **Error Case** — invalid input or external system failure
- **Corner Case** — unusual combinations of conditions, domain-specific invariants

**Table columns:** `#` | `Type` | `Scenario` | `Input Conditions` | `Expected Behavior` | `Notes`

**Rules:**

- Do not limit yourself to obvious cases — reason about domain invariants
- The table may be as long as necessary; missing a scenario is worse than an extra row
- Output only the table — no introduction, no summary after
