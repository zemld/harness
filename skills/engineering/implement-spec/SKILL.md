---
name: implement-spec
description: Orchestrates a specification through implementation, independent verification, and a pull request.
disable-model-invocation: true
requires: [read-docs]
---

## Workflow

1. **Prepare**
2. **Implement until it's done**
   1. **Implement**
   2. **Verify**
   3. **Decide**
   4. **Repair**
3. **Create PR**

## Prepare

Read the original specification, `CONTEXT.md` if present, and run `/read-docs` for the project stack.
Use the glossary's canonical vocabulary for naming.
Identify the specification path or URL, project root, comparison base revision, implementation scope, and testing target.
Store each round's reports in `<project-root>/.features/<task-slug>/runs/round-N/`, using a task-derived kebab-case slug and consecutive round numbers; exclude this directory from implementation, review scope, and PR commits.
Preparation is complete when every agent has the specification source, base revision, scope, and convention sources, and `tester` also has its target.

## Implement until it's done

Repeat the stages below until required checks and tests pass, review coverage is complete, arbitration is CLEAR, and all in-scope acceptance criteria pass for the current changes.

### Implement

Launch `code-writer` with the prepared inputs and save its complete report as `implementation.md`.
Proceed only when all required project checks and tests pass for the current changes; report unavailable checks as BLOCKED.

### Verify

Launch four independent `reviewer` agents for intent and logic, architectural fit, mandatory conventions, and tests, alongside `tester`.
Wait for all five reports before further implementation edits, saving them as `review-logic.md`, `review-architecture.md`, `review-conventions.md`, `review-tests.md`, and `testing.md` in the round directory.
Verification is complete when review coverage is complete and every in-scope acceptance criterion has a testing result.

### Decide

Launch an independent `arbiter` with the prepared inputs, reviewer and testing report paths, and prior arbitration report paths, identifying the specification as settled in its task.
Save its complete decision record as `arbitration.md`.
Decision is complete when every review finding has an arbitration decision and no blocker remains.
Continue to Repair for accepted fixes or observed testing failures; otherwise proceed to Create PR only when the loop's completion criteria hold.

### Repair

Send accepted review fixes and observed testing failures to `code-writer` with their original report paths and accepted issue IDs.
Wait for its complete repair report, including affected check results, and save it as `repair.md`.
If the same defects remain, have `code-writer` diagnose the failed approach before retrying.
Repair is complete when the report and check results are saved in the round directory; return to Implement with prior decisions for a new round of full review and testing.
