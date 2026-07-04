---
name: review-changes
description: Reviews a code change against its stated intent and the project's documented standards — logic, structure/style, and test quality — over the scope you give it rather than the whole repo. Needs a one-line intent and the set of files/area to review.
---

Review one code change end-to-end against two things: the **intent** it was meant to satisfy, and the **engineering conventions this project documents for itself**. Produce one report covering logic, structure/style, and tests.

This skill is **read-only** and self-contained: never modify, create, or suggest editing a file, never run `git diff`/`git status`, and never delegate to another skill. The output is a verdict, not a change. Carry no assumptions about language, framework, or where conventions live — discover everything from the repository at review time.

## Inputs

Two inputs drive the review. Use whatever the user already supplied; ask only for what is missing. Settle both before analysing.

- **Intent** — what the change was meant to accomplish, in a sentence or two (the goal, not the implementation). If absent, ask: *"What was this change supposed to do? One or two sentences — the goal, not the implementation."*
- **Scope** — the specific files or one clearly locatable area to review. Review only this; pull in nothing outside it. If none is given, ask which files or area to review.

## Step 1 — Analyse (inline)

Do the review yourself in this context; never spawn a subagent (a caller wanting fresh eyes spawns this skill itself).

1. **Find the project's documented conventions.** These authoritative docs define how code here must be written — style, structure, layering, testing — and how review is routed per area. Follow the repository's own signposts: `CLAUDE.md` (project and user level) usually names where conventions live; a docs tree or a contributing/standards section is another common home. Do not assume a fixed path.
2. **Match conventions to the scope files.** A project may document several stacks. Match the files — by layout, file types, and idioms as the docs describe them — to the right convention set for style/structure and for tests. If none plausibly govern these files, say so and review against intent only.
3. **Read the governing docs in full** before judging. They are the sole source of truth for structure/style and test rules — apply their exact rule names and categories; invent nothing from memory.
4. **Read every scope file in full** — production and test alike, not excerpts.
5. **Evaluate three dimensions:**
   - **Logic vs intent.** Where does the code diverge from what the intent requires? Classify each divergence as missing behaviour, wrong behaviour, or an unauthorized side effect. "There's a bug" is not a finding — state expected vs. actual and cite `file:line`.
   - **Structure & style.** Check scope files against the style/structure docs. Use their exact rule names and categories; one row per violation at `file:line`.
   - **Tests.** *Conventions* — check test files against the documented test conventions (naming, shape, assertion style, placement). *Completeness* — derive from the intent every scenario the change should cover (happy path, edges, error/failure, boundary), and flag each one with no matching test. If no test files are in scope, state that and list every scenario left untested.

Assemble the findings into this structure:

```
Conventions consulted: <where found + which stack's rules applied, or "none found — reviewed against intent only">
Docs read: <comma-separated rule docs read>

### Logic
| File:Line | Expected (from intent) | Actual (in code) | Type |
(or: "Matches intent — no divergences found.")

### Style
| File:Line | Category | Rule | Violation |
(or: "No structure/style violations found.")

### Tests
Conventions:
| File:Line | Rule | Violation |
(or: "No test-convention violations found.")
Completeness:
| Scenario (from intent) | Covered? | Missing test |
(or: "All scenarios implied by the intent are covered.")
```

## Step 2 — Present the report

Assemble the Step 1 findings into one report; add the verdict and next actions yourself.

```
## Review: <one-line intent recap>

<Step 1 findings: Conventions consulted / Docs read / Logic / Style / Tests>

### Overall verdict
PASS — ready to commit.
  OR
FAIL — address the items below before committing.

### Next actions
<issues to fix, highest priority first; logic and missing-test gaps rank above stylistic nits>
```

End with:

> Tell me which of these you'd like me to fix and I'll make the changes. If you disagree with any finding, push back — I may have missed context.
