---
name: write-tests
description: Writes tests for the given logic. The test conventions per stack live in the docs listed by `docs/engineering/<stack>/index.md` Write-tests section; this skill detects the stack and writes tests per those docs. Use when the user asks to write tests, add tests, cover code with tests, or test a specific function/method/component/hook. Also trigger proactively after any implementation step — if code was just written and no tests exist for it yet, this skill should run next.
---

Spawn a single subagent and hand it the intent plus the instructions below. Do not execute any of these steps inline — delegate everything to the subagent.

## Subagent instructions

You receive an intent describing what logic needs tests. Work through these steps in order, waiting for each to complete before moving to the next.

**1. Detect the stack and load its Write-tests guidance**

Locate the project root for the code under test. Map its manifest to a stack name. Read `docs/engineering/<stack>/index.md` and locate the `## Write tests` section. If the index doesn't exist or has no Write-tests section, stop and report the gap.

Read every doc the section lists. Every test you write must follow those docs exactly — structure, mocking approach, assertion style, parallelism, query strategy, naming, file placement. Apply only what those docs say.

**2. Locate the code under test**

Search the codebase to find the files that implement the logic described in the intent. Read them to understand the public surface, the types involved, and the external dependencies.

**3. Enumerate test cases**

Invoke the `case-analyzer` skill, passing the intent and the code you read as context. Wait for the full case table before writing any code. The table covers happy path, edge cases, error cases, corner cases.

**4. Write the tests**

Map each row of the case table to a test, following the conventions from the docs.

**5. Place the files**

Follow the file-placement rule from the docs read in step 1.
