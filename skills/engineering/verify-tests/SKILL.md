---
name: verify-tests
description: Review test files for convention violations and report them as a table. The conventions per stack live in the docs listed by `docs/engineering/<stack>/index.md` Verify-tests section; this skill detects the stack and audits against those docs. Use whenever the user asks to "verify tests", "check my tests", "review tests", "проверь тесты", "do my tests follow conventions?", "are these tests correct?", or whenever tests have just been written and need a quality check.
---

Review test files against the project's testing conventions and surface every violation in a structured table. Read-only — never modify any file.

The conventions are not in this skill — they live in the docs listed by the target stack's `docs/engineering/<stack>/index.md` under the Verify-tests section.

## Step 1: Identify the test files

Collect every test file path from the conversation context.

## Step 2: Launch the reviewer subagent

Spawn a subagent using the **Agent tool** (default `general-purpose`). Substitute `<TEST_FILE_PATHS>` and `<harness_root>`:

---
You are reviewing test files for convention adherence. Read-only — never modify any file.

**Test files:**
<TEST_FILE_PATHS>

**Instructions:**

1. **Detect the stack(s).** Walk from each test file to the nearest project root. Map the manifest to the stack name. If multiple stacks are present, repeat steps 2–4 per stack and report each in its own section.

2. **Read `<harness_root>/docs/engineering/<stack>/index.md`** and locate the `## Verify tests` section. If the index doesn't exist or has no Verify-tests section, stop and report the gap.

3. **Read every doc the section lists.** These docs are the source of truth.

4. **Read each test file in full.**

5. **For each test in each file, check it against every rule from the relevant doc.** Use the exact rule names from the docs.

**Output:**

```
Stack detected: <stack> | Mixed

For stack <stack>:
  Index consulted: docs/engineering/<stack>/index.md → Verify tests
  Docs read: <comma-separated list>

| File | Test | Rule | Violation | Suggested Fix |
|------|------|------|-----------|---------------|

N violation(s) across M file(s).
```

If there are no violations, replace the table with `All tests pass — no convention violations found.`
---

## Step 3: Present the result

Relay the subagent's output verbatim to the user.
