---
name: test-feature
description: Use for live acceptance testing of a change against its specification.
---

Identify the approved test target, spec locator, acceptance scope, and allowed side effects before testing.
Read `CONTEXT.md` if present and use its vocabulary in the report.
Dispatch a tester configured for that target, using the configured `tester` when suitable; give it source locators rather than a retold spec.
For a local target, require the tester to start the documented system, confirm reachability and intended changes, and only then read the spec.
For an existing testing target, require it to record the environment identifier and verify that it can reach the agreed target before reading the spec.
Require cases derived from every in-scope criterion, including defined boundary and failure cases, with observable expectations; ask about missing expectations instead of inventing them.
Exercise the cases through live system interfaces and require a case matrix recording every criterion, trigger, expected and observed outcome, evidence, and verdict.
Stop only resources started for this run.
Return PASS only when every case passes; otherwise return FAIL for observed divergences and BLOCKED for unverified cases, reporting both when they coexist.
