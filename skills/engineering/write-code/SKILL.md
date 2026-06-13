---
name: write-code
description: Writes the production code and tests for a stated intent, following the project's own engineering docs, and returns only once the build/type-check passes, the affected tests pass, and the code is formatted. The intent is any natural-language description of the desired code — a PRD body, a freeform feature request, or a list of issues to fix in code that already exists. Use whenever the user wants code written or changed to match a description: "write the code for this", "implement this", "make these fixes", "напиши код по этому", "реализуй это", "внеси эти правки". Stack-agnostic — it detects the stack and reads that stack's write conventions itself. Do NOT use for read-only review (that reports, it does not write) or for project-wide refactors against conventions.
---

Write the code that satisfies an intent, end to end, in this one context, and do not return until it builds, the affected tests pass, and it is formatted.

This skill is the **behavioral pattern** — the order of operations for writing code. What each step means concretely in a given stack — where files go, how layers depend, how a test is shaped, which tool stands in for dependencies, what the build/test/format commands are — is **structural** and lives in the project's engineering docs. Read those for the specifics; do not hardcode any one stack's specifics here.

## Inputs

- **`intent`** — what the code must become, in natural language. It may describe a brand-new feature, or it may be a list of problems to fix in existing code (e.g. the output of a review). Treat a fix-list exactly like any other intent: the named files and the "expected vs. actual" it carries are your spec. Read it fully. Ignore sections titled "Alternatives", "Rejected designs", "Open questions", or "Subtasks" (discarded paths or downstream decomposition); treat "Out of scope" as a boundary — respect it, do not build it.
- **`working_dir`** — absolute path to the project root. If not given, default to the current directory; if that is clearly not a project root, ask once.

## Procedure

1. **Load the structural conventions.** Work out which engineering stack the project uses (your own judgment from the project's files — there is no fixed list of signals) and read the matching `docs/engineering/<stack>/` docs that govern style, structure/layering, and tests. These are the sole source of truth for everything stack-specific in the steps below; do not invent rules from memory. If you cannot confidently match the project to one stack's docs, stop and report.

2. **Survey what exists.** Read the files the intent touches. This tells you whether you are writing greenfield or changing existing code, and — for a fix-list — exactly what to edit. Read enough to act precisely; do not edit a file you have not read.

3. **Write, in this order, in this one context:**
   1. **Contracts / types** — define the interfaces, types, or schemas the work introduces or consumes, placed per the structure docs.
   2. **Test doubles** — set up whatever the tests will need to stand in for dependencies, using the stack's documented approach (generated mocks, network mocks, etc. — read the testing docs for which). If the work depends on generated artifacts (API types and the like), regenerate those first.
   3. **Cases** — work out every scenario the tests must cover, at two levels. (a) **Feature level:** if the intent carries a `## Cases` table, that is your floor — every row must end up covered by a test somewhere. If it carries none, enumerate the feature's scenarios yourself. (b) **Unit level:** for each function, method, or component you are about to test, enumerate its own cases — happy path, boundary, error, corner. Your tests must cover the union of both.
   4. **Tests, first** — write the tests from the cases, following the testing conventions. The production code does not exist yet, so they will not pass — that is expected; the tests drive the code.
   5. **Implementation** — write the production code that makes the tests pass, working from the innermost (least-dependent) layer outward per the structure docs. Skip layers the work does not touch.

4. **Drive to green.** Run the project's build/type-check, then the affected tests, then the formatter (find these commands from the project itself — Makefile targets, package scripts, or the project's docs). Fix **production** code until the build is clean, the affected tests pass, and the formatter exits clean.

**Test-freeze** (applies from step 3.4 onward): once tests exist, never edit a test to make things pass. If the only correct fix would require changing a test, stop and report it rather than editing the test — that is an escalation, not a decision you make.

## Output

Report:

- **Files created / modified** — one path per line. (A reviewer or caller uses this as the scope to check.)
- **State** — confirm build/type-check passes, affected tests pass, and the code is formatted; or, if you stopped on the test-freeze escalation, say exactly which test would have to change and why.
- **Deviations** — anything in the intent you could not satisfy, and why.

Stay in scope: build what the intent asks for and nothing more. Fix style violations only in files you are already editing.
