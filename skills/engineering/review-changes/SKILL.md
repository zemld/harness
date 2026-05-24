---
name: review-changes
description: Review uncommitted changes against a stated intent and the repository's standards. Use when the user asks to review changes, check work before commit, mentions "review" / "ревью" / "проверь изменения", or provides context like "I was implementing X — check if it's done right". Trigger even when the user says "посмотри что я сделал", "check my changes", or describes a feature and asks if it looks right.
---

Review the user's uncommitted work by running three verification checks in parallel — logic against intent, code style, and test quality — then aggregate the results.

## Step 1: Establish the intent

If the user's message already states what they were trying to do, extract it and move to Step 2 without asking.

If no intent is stated, ask:

> What were you trying to do in these changes? One or two sentences — the goal, not the implementation.

Wait for the answer before proceeding.

## Step 2: Collect the diff

Run from the repository root:

```
git status
git diff
git diff --staged
git ls-files --others --exclude-standard
```

Derive from the output:

- **`production_files`** — modified/added `.go` files that are not `_test.go`, not under `mocks/`, `generated/`, or `ogen/`.
- **`test_files`** — modified/added `_test.go` files.

If there are no changed files, stop and tell the user there is nothing to review.

## Step 3: Launch three checks in parallel

Spawn three **Agent** subagents in a single message. Each invokes one skill via the Skill tool.

---

**Subagent A — Logic**

Prompt:
```
Use the `verify-logic` skill.

Intent: <INTENT FROM STEP 1>

Files:
<production_files, one per line>
```

---

**Subagent B — Style**

Prompt:
```
Use the `verify-style` skill.

Context: <INTENT FROM STEP 1>

Files:
<production_files, one per line>
```

---

**Subagent C — Tests**

Prompt:
```
Use the `verify-tests` skill with these test files:
<test_files, one per line>
```

If `test_files` is empty, skip this subagent and note "No test files changed — test quality check skipped."

---

## Step 4: Aggregate and report

Wait for all subagents. Render a unified report:

```
## Review: <one-line intent recap>

### Logic
<subagent A output verbatim>

---

### Style
<subagent B output verbatim>

---

### Tests
<subagent C output verbatim>

---

### Overall verdict
PASS — ready to commit.
  OR
FAIL — fix the items marked blocking before committing.

### Next actions
<ordered list of issues to fix, highest priority first>
```

End with:

> Let me know which of these you'd like me to address, and I'll make the changes. Or if you disagree with any finding, push back — I may have missed context.
