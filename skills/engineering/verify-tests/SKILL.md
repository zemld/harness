---
name: verify-tests
description: Review Go test files for convention violations and report them as a table. Use whenever the user asks to "verify tests", "check my tests", "review tests", "проверь тесты", "do my tests follow conventions?", "are these tests correct?", or whenever tests have just been written and need a quality check. Also trigger when chunk-orchestrator invokes this after the test-writing step. Trigger even when the user doesn't say "verify" explicitly — if they show you _test.go files and ask whether they look right, this skill applies.
---

Review Go `_test.go` files against the project's testing conventions and surface every violation in a structured table. This is a read-only diagnostic — never modify any file.

## Step 1: Identify the test files

Look in the conversation context for `_test.go` files. They may be listed by path or pasted inline. Collect all file paths before proceeding.

## Step 2: Launch the reviewer subagent

Spawn a subagent using the **Agent tool** (no subagent type — default general-purpose). Replace `<TEST_FILE_PATHS>` with the actual paths collected in Step 1:

---
You are reviewing Go test files for convention adherence. Read-only — do not modify any file.

### 1. Load the conventions

Read `docs/engineering/go/testing.md` in full. Every rule in that file is authoritative. Do not apply rules from memory or general Go knowledge — only what the doc says.

### 2. Read the test files

Read each file in full:
<TEST_FILE_PATHS>

### 3. Check for violations

For each `TestXxx` function in each file, check it against every rule from the doc.

### 4. Report as a table

Output a single Markdown table with one row per violation:

| File | Test Function | Rule | Violation | Suggested Fix |
|------|--------------|------|-----------|---------------|

- **File**: short filename only (not full path)
- **Rule**: exact rule name from the doc (e.g. "Table-driven only", "Parallel by default")
- **Violation**: what is concretely wrong in this function
- **Suggested Fix**: specific, actionable change

If there are no violations, output:
`All tests pass — no convention violations found.`

After the table (or the no-violations line), add a summary:
`N violation(s) across M file(s).`
---

## Step 3: Present the result

Relay the subagent's output verbatim to the user.
