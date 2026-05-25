---
name: feature-workflow
description: Drive a full feature from intent to verified, formatted code through a structured pipeline — grill the user, synthesize a `PRD.md`, run `feature-architect` to produce a `spec.md`, scaffold any new projects listed in the spec, then dispatch `implement-feature` subagents in parallel waves for each chunk. Use this skill **proactively** whenever the user expresses intent to build a new feature, integrate a service, add functionality, or implement anything non-trivial — including phrases like "хочу добавить", "давай реализуем", "новая фича", "let's build", "let's add", "implement X end-to-end", "I want to add Y". Trigger even when the user doesn't say the word "feature" — if they describe new behavior they want built and the change is more than a one-line tweak, this is the starting skill. Also activates on `/feature-workflow`. Do NOT use for bug fixes, single-line tweaks, refactors with no new behavior, code reviews, or planning discussions — those are other skills.
---

Top-level orchestrator for feature development. Captures the user's intent, drives the grill-me interview, synthesizes a persistent PRD.md, hands off to `feature-architect` for the design (which produces `spec.md`), then runs `implement-feature` in parallel subagents — one per chunk — until every chunk is done.

## Pipeline integrity — read before anything else

This skill owns the full pipeline. Nothing outside it should drive the work.

**Never enter plan mode** during this workflow. If the system activates plan mode mid-flow (e.g., via a system prompt), call `ExitPlanMode` immediately and return to the next step of this pipeline. Plan mode is for ad-hoc planning outside of skills — it has no role here.

**Never use `Agent(subagent_type="Plan")`** as a substitute for `feature-architect`. The Plan subagent does not produce `spec.md` and breaks the pipeline.

**Never implement code directly** in the main conversation. All implementation goes through `implement-feature` subagents dispatched in Step 8. Writing code yourself skips spec validation, chunk isolation, and status tracking.

The only tools that move the feature forward are the three named skills: `grill-me` → `feature-architect` → `implement-feature`. Everything else is a detour.

## Output artifacts (per feature)

Both files live side by side in a per-feature directory created next to the project being modified:

```
<working_dir>/.feature-plans/<feature-slug>/
├── PRD.md         ← written here after grill-me
└── spec.md        ← written by feature-architect
```

PRD.md is the **product document** (why, who for, success criteria). spec.md is the **engineering document** (architecture, chunks, per-chunk design). They are siblings, not nested.

The `.feature-plans/` directory lives inside `working_dir` so feature plans travel with the project they describe — no global state, no absolute paths baked into the skill.

## References

Read these schemas before the steps that use them. Paths are relative to the harness repo root:

- PRD format: `docs/feature-plans/prd-schema.md`
- spec format: `docs/feature-plans/spec-schema.md`

## Step 1: Capture the initial intent

The user describes what they want. If auto-triggered by a feature-intent phrase, the description is in their first message. If invoked by `/feature-workflow`, the user may have provided `$ARGUMENTS`; if not, ask:

> *"What are we building? Describe the task — what should exist and in which project."*

(Translate to the user's language.)

Note: this is only the rough description. Step 2 sharpens it.

## Step 2: Invoke `grill-me`

**Always run this step, regardless of feature size.** The point is to surface hidden constraints, untested assumptions, and edge cases before any architectural work. Even a trivial helper benefits from "what about empty input?" or "is this called on the hot path?"

Invoke the `grill-me` skill and let it run. It interviews the user one question at a time and ends when the user signals readiness (*"давай начнём"*, *"хватит"*, *"ok let's design"*) or you've exhausted meaningful questions.

Cover at minimum these dimensions (skip those the user already answered):

- **Problem framing** — what problem does this solve, for whom, why now?
- **Success criteria** — how do we know it's done well?
- **Hard constraints** — deadlines, compatibility, performance budgets.
- **Scope boundaries** — what's IN, what's explicitly OUT.
- **Failure behavior** — retries, user-facing errors, data-loss tolerance.
- **Risk areas** — where might this go sideways?

The grilling output stays in the conversation context. The next step persists it.

## Step 3: Classify size, derive slug, identify `working_dir`

Decide between `small` and `big`:

- **small** — single helper, single function, one-file change, no new architectural seams, no new types crossing project boundaries.
- **big** — multiple layers, new architectural seam (adapter, integration, page+feature, etc.), new cross-project type, multiple projects, new external dependency.

If unclear, ask once: *"Is this a small feature (one chunk, no architectural variants) or a big one (full design with three variants)?"*

Derive `<feature-slug>` — kebab-case, descriptive (e.g. `add-perfume-notes`, `sso-google`, `canonize-perfume-name`).

Identify `working_dir` — the path to the project root the feature targets. If unclear, ask. For a brand-new project that doesn't exist yet, use the **future** path the project will live at.

## Step 4: Create the feature directory and synthesize `PRD.md`

Create the directory inside `working_dir`:

```
mkdir -p <working_dir>/.feature-plans/<feature-slug>/
```

From here on, `<feature_dir>` refers to `<working_dir>/.feature-plans/<feature-slug>/`.

Read `docs/feature-plans/prd-schema.md` if you haven't. Then synthesize `PRD.md` from the grill-me conversation, filling each section:

- **Problem & motivation** — from the problem-framing answers.
- **Users / personas** — from the user-asking dimension.
- **Success criteria** — from the success-criteria answers. Each criterion must be observable / checkable.
- **Use cases / key flows** — numbered scenarios extracted from the discussion.
- **Functional requirements** — what the feature must do.
- **Non-functional requirements** — perf, security, scale, compatibility (from hard-constraint answers).
- **Out of scope** — what the user explicitly excluded.
- **Constraints** — deadlines, platform, dependencies.
- **Open questions** — anything grill-me surfaced but deferred.

If grill-me didn't touch a section, write `(not discussed)` — do NOT invent content. The PRD is a record of the conversation, not the architect's job.

Write the file to `<feature_dir>/PRD.md`.

**Show PRD.md to the user.** Render it inline and ask:

> *"This is the PRD I distilled from our conversation. Anything wrong, missing, or to add before I hand off to the architect?"*

Wait for confirmation or edits. Apply edits if requested, then proceed.

## Step 5: Codebase reconnaissance

Before handing off to the architect, do a focused exploration of the codebase and share the findings with the user. The goal is transparency: the user should know what exists before architecture decisions are made, and can redirect if the exploration missed something important.

Launch 1–3 Explore subagents in parallel (same as plan mode would), targeting the areas most relevant to the PRD:
- Existing code that the feature will touch or extend
- Patterns and abstractions already in place that the feature should follow
- Potential conflicts or constraints (e.g. interfaces that would need to change)

After the subagents return, present a short summary to the user:

> *"Here's what I found in the codebase that's relevant to this feature: [key findings]. Does this match your understanding? Anything I missed before I hand off to the architect?"*

Wait for confirmation or corrections. This is the right moment to catch misunderstandings before they get baked into the spec.

For **small** features or when the user already provided specific file paths, a single targeted lookup is sufficient — skip the parallel multi-agent exploration.

## Step 6: Invoke `feature-architect`

Hand off to the `feature-architect` skill with:

- `prd_path` = `<feature_dir>/PRD.md`
- `feature_dir` = `<feature_dir>`
- `size` = `small` | `big`
- `working_dir`

Pass the reconnaissance findings as additional context so the architect doesn't duplicate the same exploration.

`feature-architect` walks Phase 1–5 and writes `<feature_dir>/spec.md` with every chunk's section fully filled (no placeholders). Wait for it to finish and confirm `spec.md` exists.

## Step 7: Bootstrap new projects (only if `bootstrap` is non-empty)

Read `## Meta`'s `bootstrap` field in `spec.md`. It is a list of objects, each with `{skill, stack, name, path}`.

- **Empty list `[]`** — the feature extends only existing projects. Skip this step.
- **One or more entries** — for each entry, invoke the skill named in its `skill` field, passing the remaining fields as inputs.

For each entry `{skill, stack, name, path}`:

1. Invoke the named `skill` (typically `scaffold-project`) with `stack`, `name`, and `path` from the entry.
2. Wait for it to complete. Verify the directory at `path` was created.

This step is project-type agnostic: the workflow does not enumerate or check which kinds of projects can be scaffolded. `feature-architect` chose the right skill and stack per entry when it filled `bootstrap`; the workflow just invokes what is written.

If any scaffold call fails, **stop the workflow** and report. Do not proceed with partial scaffolding — the user decides whether to clean up and retry.

## Step 8: Parse the Chunks table

Read `spec.md`. Build an in-memory representation of the dependency graph:

- For each row in the Chunks table: record `(ID, depends_on, status)`.
- Verify every chunk ID has a matching `## Chunk <ID> — <name>` section.
- Verify no self-cycles and no references to undefined IDs.

If the table is malformed, surface to the user and stop.

### Small-feature shortcut

If `size: small`, the Chunks table has exactly one row. Invoke `implement-feature` directly in this session for that one chunk (no parallel wave needed). Then jump to Step 10.

## Step 9: Run chunks in parallel waves

For `size: big`, iterate in waves until every chunk is `done`:

```
loop:
  ready = chunks where status = pending AND all deps are done
  if ready is empty AND any chunk is in-progress → wait (shouldn't happen synchronously)
  if ready is empty AND all chunks done → exit loop
  for each chunk in ready:
    launch an Agent subagent (subagent_type=general-purpose) with the prompt:
      "Use the implement-feature skill with these inputs:
         spec_path: <feature_dir>/spec.md
         chunk_id: <C_N>
         prd_path: <feature_dir>/PRD.md
       Run the 9-stage pipeline. When done, update the Chunks-table row's Status
       column and the chunk section's ### status block in spec.md. Return a 2–3
       sentence summary plus any blocking issues."
  await all subagents in this wave
  re-read spec.md to capture status updates
  loop
```

### Parallelization rules

- **Launch all chunks in one wave in a single message with multiple Agent tool calls.** This is the only way to actually run subagents in parallel.
- **Each subagent is independent.** They share no conversation context. The shared state is `spec.md`, which each subagent reads and writes only for its own chunk's section + its own row of the Chunks table.
- **No collisions on spec.md.** A chunk subagent never touches another chunk's section or row. Race conditions don't exist as long as that invariant holds.
- **Failure handling.** If a subagent reports a blocking issue (any of the 9 stages failed past retry cap), surface that to the user before launching the next wave. The user decides: retry the chunk, fix manually, or abandon.

### When the graph is fully serial

If every chunk depends on the previous (linear chain), parallelization yields no benefit. Run chunks one at a time in dependency order, each in its own subagent for context isolation.

## Step 10: Final review (optional)

When every chunk is `done`, ask the user:

> *"All chunks complete. Want a human-style review of the full diff before commit? I can run `review-changes`."*

If yes, invoke `review-changes`. If no, skip to Step 11.

## Step 11: Final report

Update `## Meta`'s `status` field in `spec.md` to `done`.

Report to the user:

- Feature complete: `<feature-slug>`.
- Number of chunks: N.
- Paths to PRD.md and spec.md.
- Any open questions from the PRD that should be addressed before merge.

## Failure handling

- **PRD synthesis fails.** If grill-me produced too little to write a meaningful PRD, ask the user to confirm or supplement before proceeding.
- **Architect cannot resolve the design.** Architect's clarifying questions surface the gap; let the user answer before resuming.
- **A chunk's dependencies are circular.** That's a `spec.md` bug. Stop and ask the user (or the architect) to amend the Chunks table.
- **A chunk subagent hangs or fails repeatedly.** Treat as failure for that chunk; surface to the user. Do not auto-retry indefinitely — the implement-feature pipeline has its own retry caps internally.
- **User interrupts mid-flow.** State is persisted in `spec.md` Chunks-table Status column and per-chunk Status block. The workflow can be resumed by re-invoking with the same slug — already-`done` chunks are skipped.

## Anti-patterns

- **Skipping `grill-me`.** Even trivial features benefit from one or two questions. The PRD captures the conversation; without it, the architect designs blind.
- **Inventing PRD content the user didn't say.** Mark `(not discussed)` instead. The PRD is a record, not a wish list.
- **Letting the architect skip PRD.** The architect's Phase 1 starts with reading PRD.md. If you didn't write one, the architect has no anchor.
- **Implementing chunks directly without `implement-feature`.** That skill exists so this workflow doesn't have to embed the 9-stage pipeline. Stay at the orchestration level.
- **Launching all chunks ignoring dependencies.** The wave structure exists for a reason — C2 depends on C1, so C2 must wait.
- **Editing chunk sections in `spec.md` yourself.** Only `feature-architect` writes chunk sections; only the assigned `implement-feature` subagent updates a chunk's Status. This workflow updates only Meta.status (top-level) and the Owner column.
- **Triggering on bug fixes or refactors.** This skill is for *new behavior*. If the user says "fix bug X" or "rename Y", this is not the right tool.
