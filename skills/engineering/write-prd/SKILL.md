---
name: write-prd
description: Designs a feature by writing a PRD file — top-level `PRD.md` for a new feature, or a sub-PRD in `subtasks/<id>.md` when breaking down one checklist item from an existing PRD. Use proactively when the user expresses intent to build something — phrases like "хочу добавить", "давай реализуем", "новая фича", "let's build", "implement X end-to-end", "I want to add Y", "разбери задачу N из PRD", "детально разбери пункт", "сделай дизайн фичи". Trigger even when "PRD" or "feature" is not said — if the user describes new behavior they want built and the change is more than a one-liner, this is the design starting point. Runs grill-me first, then writes the file with a mandatory `## Architecture` section in top-level mode, or with parent-architecture inheritance in sub-PRD mode. Do NOT use for bug fixes, single-line tweaks, refactors with no new behavior, or code reviews — those are other skills.
---

Capture the design of a feature into a persistent PRD file. One invocation produces one file: either the top-level `PRD.md` for a brand-new feature or one sub-PRD for a single checklist item from an existing PRD. The user — not this skill — decides whether to recurse into deeper sub-PRDs after reading the result.

This skill is the **only entry point** for feature design in the iterative workflow. Everything else (implementing, reviewing, ticking checkboxes, appending decisions) happens manually with existing tools after the file is written.

## Pipeline integrity — read before anything else

- **Never enter plan mode** during this skill. If the system activates plan mode mid-flow, call `ExitPlanMode` immediately and return to the next step.
- **Never write code** in this flow. This skill produces design documents only. Implementation is a separate, user-initiated step (`implement-feature`).
- **Never skip `grill-me`.** Even a trivial PRD benefits from one or two clarifying questions — the file is the record of that conversation, and an empty record is worse than a missing one.

## Mode detection

The skill runs in one of two modes based on the user's invocation:

| Invocation pattern | Mode |
|---|---|
| No path argument (e.g. just `/write-prd`, or "хочу добавить X") | **Top-level mode** — create `<working_dir>/features/<feature-slug>/PRD.md` |
| Path to an existing PRD or sub-PRD, optionally with `#<id>` anchor (e.g. `features/foo/PRD.md#02`) | **Sub-PRD mode** — create `<working_dir>/features/<feature-slug>/subtasks/<id>.md` |

If the user's intent is ambiguous (e.g. they reference a feature name without saying whether it exists), check the filesystem: if `<working_dir>/features/<feature-slug>/PRD.md` exists, default to sub-PRD mode and ask which checklist item; if it does not exist, default to top-level mode.

## References

Read the relevant schema before writing the file:

- Top-level PRD format: `skills/engineering/write-prd/references/prd-schema.md`
- Sub-PRD format: `skills/engineering/write-prd/references/sub-prd-schema.md`
- `decisions.md` format (for reading the parent's decisions log in sub-PRD mode): `skills/engineering/write-prd/references/decisions-schema.md`

The schemas are stable contracts — match the section headings exactly so downstream consumers (`implement-feature` in particular) can parse the result.

## Language

Skill instructions are in English. **Respond in the user's language** during clarifying questions and review. Section headings in PRD.md and sub-PRDs stay in English (downstream consumers key off them).

## Top-level mode

### Phase 1: Capture initial intent

If the user invoked the skill via a phrase ("хочу добавить X"), the rough description is in their message. If they invoked via `/write-prd <name>`, treat `<name>` as the kebab-case slug and ask:

> *"What are we building? Describe what should exist and in which project."*

Translate to the user's language.

### Phase 2: Identify `working_dir` and `feature-slug`

- **`working_dir`** — path to the project root the feature targets. If the user is currently in a project directory and has not said otherwise, default to the current working directory. If unclear or the feature spans multiple projects, ask once.
- **`feature-slug`** — kebab-case, descriptive (e.g. `add-perfume-notes`, `sso-google`, `canonize-perfume-name`). Derive from the user's description; confirm with them if non-obvious.

The feature directory will be `<working_dir>/features/<feature-slug>/`.

### Phase 3: Invoke `grill-me`

Run the `grill-me` skill. It interviews the user one question at a time and ends when the user signals readiness ("давай начнём", "хватит", "ok let's design") or you've exhausted meaningful questions.

Cover at minimum these dimensions (skip those the user already answered):

- **Problem framing** — what problem does this solve, for whom, why now?
- **Success criteria** — how do we know it's done well?
- **Hard constraints** — deadlines, compatibility, performance budgets.
- **Scope boundaries** — what's IN, what's explicitly OUT.
- **Failure behavior** — retries, user-facing errors, data-loss tolerance.
- **Architecture commitments** — which components / services / layers will be touched, how data flows through them, what invariants every subtask must preserve. The `## Architecture` section depends on these answers; if the conversation has not landed on enough structural commitment to fill that section, **keep grilling** rather than writing a PRD with a placeholder Architecture.

The grill output stays in conversation context. The next phase persists it.

### Phase 4: Create the feature directory and write `PRD.md`

Create the directory:

```
mkdir -p <working_dir>/features/<feature-slug>/
```

Read `references/prd-schema.md` (if not already read) and synthesize `PRD.md` from the grill-me conversation. Fill each section from the corresponding dimensions:

- **Problem & motivation, Users / personas, Success criteria, Use cases, Functional / Non-functional requirements, Out of scope, Constraints** — from the dimensions above.
- **Architecture** — mandatory. Structure (components and where they live), Data flow (how data moves through), Invariants (single-line statements every subtask must preserve).
- **Subtasks** — checklist of decomposition. Use kebab-case slugs, hierarchical IDs starting at `01`. Each item is one line, unchecked.
- **Open questions** — anything `grill-me` surfaced but deferred.

If a section was not touched during the interview, write `(not discussed)` — do NOT invent content. The PRD is a record of the conversation. The **only exception** is `## Architecture`: if it cannot be filled, the PRD is not ready and you must return to Phase 3.

Write the file to `<working_dir>/features/<feature-slug>/PRD.md`.

### Phase 5: Show and confirm

Render the PRD inline and ask:

> *"This is the PRD I distilled from our conversation. Anything wrong, missing, or to add before this becomes the working document?"*

Wait for confirmation or edits. Apply edits, then close out:

> *"PRD ready at `<working_dir>/features/<feature-slug>/PRD.md`. Open each subtask in a new session with `write-prd features/<feature-slug>/PRD.md#<id>` when ready to implement."*

Do not invoke any other skill. Top-level mode ends here.

## Sub-PRD mode

### Phase 1: Resolve parent and target subtask

Parse the invocation:

- The path component identifies the parent document (`features/<feature-slug>/PRD.md` for a top-level subtask, or `features/<feature-slug>/subtasks/<parent-id>.md` for a recursive sub-subtask).
- The `#<id>` anchor identifies which checklist item from the parent this sub-PRD will detail.

If the anchor is missing, read the parent's `## Subtasks` checklist (top-level PRD) or `## Decomposition hint` (sibling sub-PRD) and ask the user which item to expand.

Determine the new sub-PRD's ID:
- Subtask `02` from a top-level PRD → new file `subtasks/02-<slug>.md`, ID `02`.
- Recursing on subtask `02`, picking the first sub-sub-item → new file `subtasks/02.01-<slug>.md`, ID `02.01`.
- The `<slug>` portion is kebab-case derived from the subtask name.

Depth beyond `01.01.01` is a smell — pause and ask the user whether the top-level PRD's decomposition should be reshaped instead of recursing further.

### Phase 2: Read parent context

Read, in order:

1. The parent document in full (top-level `PRD.md` or the immediate parent sub-PRD).
2. If a top-level `PRD.md` exists higher up the parent chain, read its `## Architecture` section — invariants from there are transitively inherited.
3. `<working_dir>/features/<feature-slug>/decisions.md` if it exists. Pull only entries whose `Affects subtasks` field includes the new ID, the parent ID, or `all`.
4. Sibling sub-PRDs that the parent's checklist marks as already implemented (`[x]`). Read their `### intent` and `### interfaces` only — they describe the code the new subtask must integrate with.

Skim, do not exhaustively load. Enough to fill the new sub-PRD's `## Inherited architecture` and `## Consumed decisions` sections.

### Phase 3: Invoke `grill-me` (focused)

Run `grill-me` again, but tighter. The top-level PRD already resolved most product questions; the subtask interview narrows on:

- Concrete file paths and packages this subtask creates or modifies.
- The exact public surface: types, function signatures, method names.
- Edge cases the tests must cover (at least happy / one edge / one error).
- Constraints inherited from `## Inherited architecture` that this subtask is at risk of violating — confirm the user has thought about each.

Ask at most 5–8 questions in one cluster. If the conversation goes wider, the parent PRD is probably too thin — surface that rather than running a second discovery round.

### Phase 4: Write the sub-PRD

Read `references/sub-prd-schema.md` if not already read. Synthesize the file in `<working_dir>/features/<feature-slug>/subtasks/<id>-<slug>.md`:

- **`## Meta`** — `id`, `parent` (relative path back to parent), `created` (current timestamp).
- **`## Inherited architecture`** — invariants from the parent chain that this subtask must preserve. Copy or paraphrase verbatim; do not invent new ones.
- **`## Consumed decisions`** — entries pulled from `decisions.md` in Phase 2.
- **`## Chunk <id> — <name>`** — the `implement-feature`-ready section. Fill every field:
  - `intent` — 1–3 sentences.
  - `working_dir` — from the parent's working_dir.
  - `files` — every file, with one-line purpose. Be exhaustive — no "and other files".
  - `interfaces` — name + location + method names (one-line purpose each). `—` if none.
  - `edge_cases` — at least 3 cases for non-trivial logic.
  - `dependencies` — packages or ports consumed.
  - `notes` — only fill if there's a real constraint; empty otherwise.
  - `status` — `- implement: pending`.
- **`## Decomposition hint`** — include only if the subtask is clearly too large for one implementation pass; list candidate sub-subtasks. Absent by default.

**Every Chunk field must be filled** before handoff. If a field cannot be filled, the subtask is not ready — write the `## Decomposition hint` section listing what sub-subtasks would cover the gap, and tell the user the subtask needs recursion before implementation.

### Phase 5: Show and hand off the decision

Render the sub-PRD inline and ask:

> *"This is the sub-PRD for `<id>`. Two options:*
> *(1) implement now — open a new session and run `implement-feature` with `spec_path=<path>`, `chunk_id=<id>`;*
> *(2) recurse — this subtask is still too large, run `write-prd <path>#<sub-id>` to break it down further.*
> *Or push back on something specific in the sub-PRD."*

Translate to the user's language.

Do not invoke `implement-feature` yourself. The user opens a new session for that — the whole point of the iterative workflow is fresh-dialog isolation per subtask.

If the user picks recursion, do not start it in the same session either: a recursive `write-prd` should run with a clean context to avoid the parent's discussion polluting the child's interview.

## Layout and ID rules

- **Flat layout under `subtasks/`.** Every sub-PRD is a direct file, never nested into subdirectories. The hierarchy lives in the ID, not in the filesystem.
- **Hierarchical IDs.** Top-level subtasks use `01`, `02`, … Recursive sub-subtasks of `02` use `02.01`, `02.02`, … and so on.
- **IDs are stable.** Once an ID is assigned, it never points to anything else. Removed subtasks leave a gap rather than renumbering siblings.
- **Filename = `<id>-<slug>.md`.** The slug is kebab-case, descriptive. The ID prefix is the parsing key — the slug is for humans.
- **Checklist consistency.** The parent PRD's `## Subtasks` checklist and the files in `subtasks/` must be in sync. When creating a new sub-PRD, add its line to the parent's checklist if it is not already there (unchecked).

## After this skill returns — the manual operational model

The user's responsibility, not the skill's, but document it here so the skill output can remind them:

1. Implement the subtask: `implement-feature` with `spec_path=<sub-PRD path>`, `chunk_id=<id>`.
2. Tick the matching checkbox in the parent PRD (`[ ]` → `[x]`).
3. If a cross-subtask insight came up, append an entry to `decisions.md` using the template in `references/decisions-schema.md`.
4. Run `review-changes` against the subtask intent.
5. Run the stack's Definition of Done (e.g. `go test ./...`, `make format`, OpenAPI regen, infra updates) — see the harness `CLAUDE.md`.

After every checklist item is ticked, run a final pass: read the top-level PRD, confirm Architecture invariants hold, run `verify-logic` on the key functions, run the DoD over the full feature.

## Anti-patterns

- **Writing the PRD before grill-me finishes.** The PRD is the record of the interview. Skipping the interview produces a document that says nothing meaningful.
- **Inventing PRD content the user did not say.** Mark `(not discussed)` instead. The PRD is a record, not a wish list.
- **Skipping `## Architecture`.** Without it, sub-PRDs have no shared structural anchor and will drift from each other. If the conversation has not produced enough commitment, keep grilling.
- **Recursing inside the same session.** Each subtask gets a fresh dialog. Running `write-prd` recursively in one session pollutes the child with the parent's context.
- **Calling `implement-feature` from this skill.** The user opens a separate session for implementation. This skill writes a file and stops.
- **Editing prior `decisions.md` entries.** Append-only. Corrections become new entries that explicitly supersede the old.
- **Hand-formatting around the schema.** Match the schema section headings exactly. `implement-feature` and future readers depend on the structure.
- **Triggering on bug fixes or refactors.** This skill is for *new design*. If the user says "fix bug X" or "rename Y", this is not the right tool.
