---
name: verify-style
description: Check Go files against project style, structure, and dependency rules — returns a violation table. Use whenever the user asks to "verify style", "check style", "check structure", "check layering", "check dependencies", "проверь стиль", "проверь структуру", "проверь зависимости", "are the files structured correctly", "does the code follow conventions", or after any implementation step where files need a style/structure pass. Trigger even when the user doesn't say "style" explicitly — if they show you Go files and ask whether they look right from a structure or conventions standpoint, this skill applies.
---

Check Go files against the project's style, structure, and dependency rules. This is a read-only diagnostic — never modify any file.

## Inputs

Ask for these if not provided:

- **Context** — brief description of what was implemented (helps the subagent understand intent and scope).
- **Files** — one or more file paths to check.

## Step 1 — Spawn analysis subagent

Launch an **Explore** subagent with the following prompt (substitute `<context>` and `<files>`):

---
You are a style and structure verifier. Your job is read-only: find where the files violate the project's conventions. Never suggest architectural rewrites — only flag concrete rule violations with a specific fix.

**What was implemented:**
<context>

**Files to check:**
<files — one path per line>

**Instructions:**

1. Read `docs/engineering/go/style.md` in full. Every rule in that file is authoritative.
2. Read `docs/engineering/go/service-structure.md` in full. Every rule in that file is authoritative.
3. Read each file listed above in full.
4. For each violation, record:
   - exact file path and line number
   - which category it falls into: `Style`, `Structure`, or `Dependency`
   - the exact rule name from the doc
   - what is concretely wrong at that location
   - a specific, actionable fix

**Category definitions:**
- **Style** — code style rules from `style.md`: nesting depth, function body length, parameter count, return value count, flag (bool) arguments, early returns, comment content.
- **Structure** — file and package layout rules from `service-structure.md`: `service.go`/`repository.go` must contain only struct + constructor; one public operation per file named after the operation; domain entities scoped to one bounded context until a second needs them; `utils/` only for domain-free helpers; `ports/` contains interfaces only; no stutter in interface names.
- **Dependency** — layering rules from `service-structure.md`: `domain/` has zero imports from `internal/`; `services/` imports only `domain/` types and `ports/` interfaces, never concrete adapters; only `internal/app/app.go` may import concrete types; services must import from `ports/`, never redeclare port interfaces locally.

**Output:**

A single Markdown table with one row per violation:

| File:Line | Category | Rule | Violation | Suggested Fix |
|-----------|----------|------|-----------|---------------|

- **File:Line**: e.g. `internal/services/users/creation/create_user.go:42`
- **Category**: `Style`, `Structure`, or `Dependency`
- **Rule**: exact rule name from the doc (e.g. "Function body", "One operation per file", "services/ imports")
- **Violation**: what is concretely wrong at this location
- **Suggested Fix**: specific, actionable change

If there are no violations, output:
`All files pass — no violations found.`

After the table (or the no-violations line), add:
`N violation(s) across M file(s).`
---

## Step 2 — Present the result

Relay the subagent's output verbatim to the user.
