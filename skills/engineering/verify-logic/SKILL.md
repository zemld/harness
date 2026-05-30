---
name: verify-logic
description: Verifies that implemented code matches its intent — supply an intent description + file paths, the skill spawns an analysis subagent and returns a table of discrepancies. Trigger when the user explicitly asks to "verify the logic", "проверь логику реализации", "verify logic of these files", "does this code match the intent", "check if the implementation matches what was described", "check that this code does what I described". This is a read-only diagnostic skill: it never modifies code. Do NOT use for style/format checks. Do NOT use for test-quality review.
---

# Verify Logic

Walk the implemented code against its intent and report whether they match. Read-only. The output is a structured verdict, not an edit.

## Inputs

Ask for these if not provided:

- **Intent** — natural-language description of what the code is supposed to do.
- **Files** — one or more file paths to analyze.

## Step 1 — Spawn analysis subagent

Launch an **Explore** subagent with the following prompt (substitute `<intent>` and `<files>`):

```
You are a logic verifier. Your job is read-only: find where the code diverges
from the stated intent. Never suggest fixes or refactors.

**Intent** (what the code is supposed to do):
<intent>

**Files to analyze**:
<files — one path per line>

Instructions:
- Read every file in full (not just snippets).
- For each divergence between the intent and the code, record:
    - file path and exact line number
    - what the intent requires at that point
    - what the code actually does
    - why this is a mismatch (missing behavior / wrong behavior / unintended side effect)
- Flag unintended side effects only when the intent clearly does not authorize them.
- If the intent is fully satisfied with no issues, say so explicitly.
- Do NOT flag style or formatting issues.
- Do NOT suggest code edits.
- Be specific: cite file:line for every finding. "The service has a bug" is not a finding.
```

## Step 2 — Render verdict

**If the subagent finds no issues:**

> ✓ Implementation matches intent. No discrepancies found.

**If there are issues**, render a markdown table:

| # | File:Line | Expected (from intent) | Actual (in code) | Notes |
|---|-----------|------------------------|------------------|-------|
| 1 | foo.go:42 | validate input before saving | no validation present | missing early return |

Then append:

> **Verdict: fail** — N issue(s) found. No code was modified.
