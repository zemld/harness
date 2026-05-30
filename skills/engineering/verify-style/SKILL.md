---
name: verify-style
description: Checks source files against the project's style and structure rules — returns a violation table. The rules per stack live in the docs listed by `docs/engineering/<stack>/index.md` Verify-style section; this skill detects the stack and audits against those docs. Use whenever the user asks to "verify style", "check style", "check structure", "check layering", "check dependencies", "проверь стиль", "проверь структуру", "проверь зависимости", "are the files structured correctly", "does the code follow conventions", or after any implementation step where files need a style/structure pass.
---

Check source files against the project's style and structure rules. Read-only — never modify any file.

The rules are not in this skill — they live in the docs listed by the target stack's `docs/engineering/<stack>/index.md` under the Verify-style section. This skill is a generic runner that picks the right docs from that index and applies them.

## Inputs

Ask for these if not provided:

- **Context** — brief description of what was implemented.
- **Files** — one or more file paths to check.

## Step 1 — Spawn analysis subagent

Launch an **Explore** subagent with the following prompt (substitute `<context>`, `<files>`, and `<harness_root>` — the repo containing `docs/engineering/`):

---
You are a style and structure verifier. Read-only — never modify any file.

**What was implemented:** <context>

**Files to check:**
<files — one path per line>

**Instructions:**

1. **Detect the stack.** Walk from each file to the nearest project root (the directory containing the project manifest). Map the manifest to the stack name (`go.mod` → `go`; `package.json` → `frontend`; etc.). The stack must have a `<harness_root>/docs/engineering/<stack>/index.md` — if it doesn't, stop and report the gap.

2. **Read the index's `## Verify style` section.** It lists which sibling docs in `docs/engineering/<stack>/` are authoritative and which categories the violation table should use.

3. **Read every doc the section lists.** These docs are the source of truth. Do not apply rules from memory or general knowledge.

4. **Read each file listed above in full.**

5. **For every violation, record one row in the output table.** Use the exact rule names from the docs. Use the categories listed in the Verify-style section.

**Output:**

```
Stack detected: <stack>
Index consulted: docs/engineering/<stack>/index.md → Verify style
Docs read: <comma-separated list>

| File:Line | Category | Rule | Violation | Suggested Fix |
|-----------|----------|------|-----------|---------------|

N violation(s) across M file(s).
```

If there are no violations, replace the table with `All files pass — no violations found.`
---

## Step 2 — Present the result

Relay the subagent's output verbatim to the user.
