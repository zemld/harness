---
name: review-changes
description: Reviews a described code change against its intent and the project's own documented engineering standards — checking logic-vs-intent, structure/style, and test quality plus coverage — over the scope you hand it, not a whole-repo sweep. Use when the user asks to review changes, check work before commit, mentions "review" / "ревью" / "проверь изменения" / "посмотри что я сделал" / "check my changes", or describes what they built and asks whether it is done right. Wants a one-line intent and a set of files/area to review; if either is missing, it asks rather than guessing.
---

Review one code change end-to-end against two things: the **intent** it was supposed to satisfy, and the **engineering conventions this project documents for itself**. Produce a single report covering logic, structure/style, and tests. This skill is self-contained and read-only — it never modifies a file and never delegates to another skill.

Carry no assumptions about language, framework, or where the conventions live. The same skill must work for any stack the repository documents. Everything stack-specific is discovered from the repository at review time; nothing is hardcoded here.

## Inputs

Two inputs drive the review. If the user's message already supplies one, use it; ask only for what is genuinely missing.

- **Intent** — what the change was supposed to accomplish, in a sentence or two (the goal, not the implementation). If absent, ask: *"What was this change supposed to do? One or two sentences — the goal, not the implementation."*
- **Scope** — the specific files (or a clearly locatable area) to review. Review only this. Do **not** run `git diff`/`git status` to discover files, and do not pull in changes outside the stated scope. If no files or locatable area are given, ask which files or area to review.

Wait until both are settled before launching the analysis.

## Step 1 — Launch the analysis subagent

Spawn one read-only **Explore** subagent. Substitute `<intent>` and `<scope files>` (one path per line). Hand it this prompt verbatim:

---
You are a code-change reviewer. You are strictly read-only: never modify, create, or suggest editing any file. Your output is a verdict, not a change.

**Intent** (what the change was supposed to accomplish):
<intent>

**Scope** (the only files you may review — do not pull in anything outside this list):
<scope files>

Carry no built-in assumptions about programming language, framework, or project layout, and do not assume where the project keeps its standards. Discover everything from the repository.

**Procedure:**

1. **Find the project's documented engineering conventions.** These are the authoritative rule docs that define how code in this project must be written — style, file/package structure, layering, and testing standards — and how reviewing them is routed per area of work. Locate them by following the repository's own signposts: a `CLAUDE.md` (project and/or user level) typically names where conventions live and links the relevant docs; a documentation tree or a standards/contributing section is another common home. Find where they actually are; do not assume a fixed path.

2. **Determine which conventions govern the scope files.** A project may document standards for more than one stack. Match the files in front of you — by their layout, file types, and idioms as the docs themselves describe them — to the right set of conventions. Read whatever the docs route to for *style/structure review* and for *test review* of that stack. If you cannot find conventions that plausibly govern these files, say so explicitly and review only against the intent.

3. **Read the governing convention docs in full** before judging anything. They are the sole source of truth for structure/style and test rules — apply their exact rule names and categories. Do not invent rules from general knowledge or memory.

4. **Read every scope file in full** — production and test files alike — not just excerpts.

5. **Evaluate the change across three dimensions:**

   - **Logic vs intent.** Where does the code diverge from what the intent requires? Classify each as missing behaviour, wrong behaviour, or an unintended side effect the intent does not authorize. Cite `file:line`. "There's a bug" is not a finding — be specific about expected vs. actual.

   - **Structure & style.** Check the scope files against the structure/style conventions found in step 1–3. Use the exact rule names and the categories those docs define. One row per violation, cited at `file:line`.

   - **Tests.** Two parts:
       - *Conventions* — check the test files against the project's documented test conventions (naming, shape, assertion style, placement — whatever the docs require).
       - *Completeness* — derive from the intent the full set of scenarios the change should cover (happy path, edges, error/failure paths, boundary/corner cases) and check each against the tests actually present. Flag every scenario from the intent that has no corresponding test. If there are no test files in scope at all, state that plainly and list the scenarios that therefore go untested.

**Output** — return exactly this structure:

```
Conventions consulted: <where you found them + which stack's rules applied, or "none found — reviewed against intent only">
Docs read: <comma-separated list of the rule docs you read>

### Logic
| File:Line | Expected (from intent) | Actual (in code) | Type |
|-----------|------------------------|------------------|------|
(or: "Matches intent — no divergences found.")

### Style
| File:Line | Category | Rule | Violation |
|-----------|----------|------|-----------|
(or: "No structure/style violations found.")

### Tests
Conventions:
| File:Line | Rule | Violation |
|-----------|------|-----------|
(or: "No test-convention violations found.")

Completeness:
| Scenario (from intent) | Covered? | Missing test |
|------------------------|----------|--------------|
(or: "All scenarios implied by the intent are covered.")
```

Be precise and cite `file:line` for every code-side finding. Do not suggest fixes — only report.
---

## Step 2 — Present the unified report

Relay the subagent's findings under one report. Add the verdict and next actions yourself.

```
## Review: <one-line intent recap>

<subagent output: Conventions consulted / Docs read / Logic / Style / Tests sections, verbatim>

### Overall verdict
PASS — ready to commit.
  OR
FAIL — address the items below before committing.

### Next actions
<ordered list of the issues to fix, highest priority first; logic and missing-test gaps rank above stylistic nits>
```

End with:

> Tell me which of these you'd like me to fix and I'll make the changes. If you disagree with any finding, push back — I may have missed context.
