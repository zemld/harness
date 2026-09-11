---
name: test-feature
description: Use for live acceptance testing through real HTTP/gRPC APIs when implementation is ready or another skill requests `/test-feature`.
---

Read `CONTEXT.md` if present and use its vocabulary in the report.

## Inputs and checklist

Collect the source acceptance criteria, endpoint scope, intended build identity, and approved local or testing environment.
Resolve missing scope or target decisions before sending requests.
Map every in-scope criterion to requests, expected status codes, response fields, and observable side effects.
Use multiple cases when one request cannot establish a criterion.
Close the checklist only when every criterion has a concrete live observation plan.
Do not replace required API acceptance with mocks or introduce new public endpoints to make a test possible.

## Readiness

Check environment access, documented readiness, and availability of every scoped transport before starting scenarios.
Launch a local stack through the documented path only when local execution is the chosen target.
Verify that the running build contains the intended diff; record the target and build evidence.
Close readiness only when the intended build is reachable through every required transport.
If a prerequisite is unavailable, report BLOCKED with its evidence instead of repeatedly retrying unchanged conditions.

## Exercise

Call every checklist case through real HTTP/gRPC transport using the project's supported client or `curl`/`grpcurl`.
Restrict calls to the agreed scope and record each input, response, and required side-effect observation.
Close execution only when every case has an observed result or an explicit failure or blocker.

## Verdict and teardown

Compare every observed status, named field, and side effect with its expected value.
Tear down only resources started by this run, including after failures; never stop a shared testing environment.
Report one row per case with criterion, input, expected, observed, and verdict, followed by target and build identity.
Return PASS only when every in-scope criterion is observed passing on the intended build.
Otherwise return FAIL for demonstrated behavior divergences or BLOCKED for missing verification, listing both when they coexist.
