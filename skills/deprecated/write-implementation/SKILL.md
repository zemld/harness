---
name: write-implementation
description: Writes production code that makes the existing tests pass. The conventions per stack live in the docs listed by `docs/engineering/<stack>/index.md` Write-implementation section; this skill detects the stack and writes code per those docs. Test files are FROZEN — never modify them. Use after `write-tests` and `verify-tests` have produced compiling tests. Trigger on "implement the code", "fill in the stubs", "write the implementation", "напиши имплементацию", "реализуй", or when `implement-feature` reaches its implementation stage.
---

Write production code that satisfies the existing tests. The tests are the contract — read them, understand what they expect, implement to match.

The implementation rules — layering, file placement, idioms, naming — are not in this skill. They live in the docs listed by the target stack's `docs/engineering/<stack>/index.md` under the Write-implementation section.

## Standing constraints

- **Test files are FROZEN.** The test-freeze rule from the stack's index applies. Do not open, modify, or write any test file. If a test appears wrong, stop and escalate — never edit a test.
- **Stay in scope.** Only touch files listed in `files`. Never silently expand.
- **Style is non-negotiable.** Whatever the docs listed by the index say, follow it. If you open a file to make any edit, fix any style violation already in that file before moving on.

## Inputs

- **`working_dir`** — absolute path to the project root.
- **`files`** — list of file paths (relative to `working_dir`) the implementation may touch.
- **`intent`** — 1–3 sentences explaining what the code does and why.
- **`dependencies`** *(optional)* — other packages, ports, or modules the implementation uses.
- **`notes`** *(optional)* — additional constraints.

If any required input is missing, ask once.

## Step 1: Detect the stack and load its Write-implementation guidance

Inspect `working_dir`'s manifest to determine the stack. Read `docs/engineering/<stack>/index.md` and locate the `## Write implementation` section. If the index doesn't exist or has no Write-implementation section, stop and report the gap.

Read every doc the section lists. The section describes:

- Which sibling docs are always-relevant (style, structure) vs. conditionally-relevant (state, forms, API integration, routing — only when the chunk touches those concerns).
- The layer walking order for this stack (deepest first vs. bottom-up vs. flat).
- The type-check / build command to run at the end.

## Step 2: Read the tests

For each non-test file in `files`, find its companion test file in the same directory and read every test in full. The tests define the behavioral contract.

If a test contradicts the `intent`, stop and escalate.

## Step 3: Implement

Implement per the docs and the walking order from step 1. The docs decide layering, file placement, allowed imports, naming, transactional boundaries, prop conventions, hook composition — whatever applies to this stack.

## Step 4: Build check

Run the type-check / build command named in the index's Write-implementation section, from `working_dir`. Fix every error before reporting done. **Do not run the test suite** — that's the orchestrator's job.

If the build reveals that the spec contradicts existing code, stop and escalate.

## Report

When complete, report in 2–3 sentences:

- Files created / modified.
- Any deviations from the spec, and why.
- "Ready for test run and `verify-logic`."

## Anti-patterns

- **Applying rules from memory.** The docs are authoritative; this skill body is not. If a rule is not in the docs, do not invent one.
- **Editing a test file.** Forbidden. If a test seems wrong, escalate.
- **Running the test suite.** That's the orchestrator's job.
- **Expanding scope.** Only files in `files` are touched.
