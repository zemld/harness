---
name: test-feature
description: Runs a feature's real API and verifies it against the acceptance criteria — brings the service up locally, calls its live HTTP/gRPC endpoints, and reports pass/fail per criterion.
disable-model-invocation: true
---

Bring the service up and drive its **real** API until the feature's intended behavior is observed live.

## Inputs

Settle both before running:

- **Acceptance criteria** — the observable outcomes the feature must satisfy.
- **Scope** — which endpoints or feature area to exercise. Call only these.

## Step 1 — Build the checklist

Turn every acceptance criterion into one `(input → expected response)` row: the request to send and the status/code plus body fields to expect. Done when each criterion maps to exactly one row and nothing in scope is left unrepresented.

## Step 2 — Bring the service up

Launch through the project's documented path.

## Step 3 — Exercise

Call every checklist row through its real transport: `curl` or `grpcurl`. Send each row's input. Done when every row has an observed live response — no row left un-called and no failure swallowed as "probably fine".

## Step 4 — Verdict and teardown

Compare each response — status/code and the named body fields — to its expected row. Tear the stack down. Then emit:

```
## Test: <one-line feature recap>

| Acceptance criterion | Input | Expected | Observed | Pass? |

### Overall verdict
PASS — every criterion observed passing.
  OR
FAIL — the rows marked ✗ above; live behavior diverges from the acceptance criteria.
```

`PASS` only when every criterion is observed passing; a single divergence or unreachable endpoint is `FAIL`.
