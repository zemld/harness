---
name: test-feature
description: Use for live acceptance testing of a change against its specification.
---

Identify the approved target, spec locator and SHA-256 digest, acceptance scope, and allowed side effects.
Read `CONTEXT.md` if present and use its vocabulary in the report.
Read each available tester's instructions and record whether it starts a local system or uses an existing target.
Use the configured `tester` if its recorded setup matches the approved target; otherwise use a separate subagent.
Give the tester the source locator and digest, not a retold spec.

For a local target, require startup through the documented path and confirmation of reachability and intended changes before reading the spec.
For an existing target, require its environment identifier and confirmation of reachability before reading the spec.
Require the tester to verify the spec digest and derive cases for every in-scope criterion.
Include boundary and failure cases with defined expectations; ask about missing expectations instead of inventing them.
Exercise the cases through live interfaces and stop only resources started for this run.

Wait for a complete case matrix with criterion, trigger, expected and observed outcome, evidence, and verdict for every case.
Return PASS only when every case passes; otherwise report observed divergences as FAIL and unverified cases as BLOCKED.
