---
name: write-prd
description: Designs a feature or subtask by writing a PRD file under `features/<slug>/`. Use proactively when the user expresses intent to build something — phrases like "хочу добавить", "давай реализуем", "новая фича", "let's build", "implement X end-to-end", "I want to add Y", "разбери задачу N", "детально разбери пункт", "сделай дизайн фичи". Same skill whether the PRD is a top-level design or a detailed PRD for one item from an existing PRD's subtasks list — the invocation differs only by the optional `<parent-path>#<id>` argument. Trigger even when "PRD" or "feature" is not said: if the user describes new behaviour they want built and the change is more than a one-liner, this is the design starting point. Synthesizes the file from the existing conversation and from a quick read of the code; never interviews the user. Anything that cannot be answered that way goes into `## Open questions` for the user to resolve later. Do NOT use for bug fixes, single-line tweaks, refactors with no new behaviour, or code reviews — those are other skills.
---

Capture the design of a feature into one PRD file. Output is `<working_dir>/features/<feature-slug>/PRD.md`, or `<working_dir>/features/<feature-slug>/subtasks/<id>-<slug>.md` when invoked with a `<parent-path>#<id>` argument. One schema covers both — see `references/prd-schema.md` for file format, layout, ids, and the no-paths rule. Skill instructions are in English; respond in the user's language.

## Rules

- **Never interview.** No inline questions, no interview step of any kind. Pull each section from what the user already said and from a quick read of the surrounding code. Anything that cannot be answered that way goes into `## Open questions` — one bullet per gap, naming the section it blocks. The user resolves them later by editing the file or by regenerating the PRD from fuller context.
- **PRD is self-contained.** No references to other design files. A reader can review, implement, or throw away one PRD without opening any other file. This applies equally to top-level and nested PRDs.
- **`## Architecture` is non-skippable.** Synthesize structure, data flow, and at least one invariant from the conversation and from a code skim that names existing modules and seams by role. Push specific structural unknowns into `## Open questions` rather than leaving the section blank.
- **Design only.** Never write code from this skill, and never start the implementation step — that runs in a separate session.

## Phase 1 — Resolve target

- **`working_dir`** — absolute path to the project root. Default `cwd`. Ask once only if `cwd` is clearly not a project root, or the feature targets a different project.
- **`feature-slug`** — kebab-case from the description. Confirm only if non-obvious.
- **Output path** — if invoked with `<parent-path>#<id>` (e.g. `features/foo/PRD.md#02`), write to `features/<feature-slug>/subtasks/<id>-<slug>.md` and carry `parent: ../PRD.md` + `id: <id>` in `## Meta`. Otherwise write to `features/<feature-slug>/PRD.md`.

## Phase 2 — Synthesize

Read enough of `working_dir` to ground the design: nearby modules in the same area as the feature, existing seams test code already uses, conventions in `docs/engineering/<stack>/` that apply. Skim, do not exhaustively load — enough to name modules, seams, and contracts by role without inventing them.

For each section the schema names, ask: is the answer present in the conversation or recoverable from the code? If yes — synthesize. If no — record the specific question in `## Open questions` with a note like `(blocks ## Success criteria)` so the user can see what each gap costs.

`## Architecture` is the one section that must end up with content even when material is thin — synthesize the best structural picture from the code skim and from whatever the user did say; push structural unknowns into `## Open questions` rather than leaving the section blank.

Optional sections without supporting material stay absent — no `(not discussed)` placeholders.

## Phase 3 — Write and confirm

Create the directory if needed, write the file per `references/prd-schema.md`. `## Meta` first, with `created` (current ISO 8601) and `working_dir` always; `parent` and `id` only when invoked with `<parent-path>#<id>`. `## Subtasks` is a plain list (no checkboxes) when present.

Render the PRD inline and ask the user, in their language, what is wrong, missing, or worth adding before this becomes the working document. Apply edits. Close with one line telling them to hand the file to the implementation step in a fresh session.
