# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A personal harness of agent skills and documentation. Skills are reusable instruction sets that any agent can execute; docs are the single source of truth for how any given practice or convention is done. Skills are not tied to any specific platform — they are plain prompt files that describe behavior.

## Repository layout

```
skills/          # Skill definitions (one subdirectory per skill)
  <name>/
    SKILL.md     # Frontmatter + prompt body
docs/            # Reference documentation
  <topic>/
    *.md
```

## Skill rules

- **English only.** All skill content — `name`, `description`, and prompt body — must be written in English.
- **One scenario per skill.** A skill covers exactly one use case. If you find yourself writing "and then" or "or", split it.
- **Clear and unambiguous.** Every instruction in the prompt body must be precise enough that two different readers would interpret it identically. Avoid vague verbs ("handle", "process", "manage") — say exactly what action to take.
- **No inter-skill dependencies for leaf skills.** A leaf skill must be self-contained — it does not call or depend on another skill. Only orchestrator skills may reference other skills by name.
- **Large skills decompose downward.** If a skill is getting long or multi-step, extract the sub-steps into separate leaf skills and have the orchestrator skill reference them.
- **Docs over inline knowledge.** If a skill needs to convey *how* to do something (conventions, patterns, rules), put that content in `docs/` and have the skill reference the doc path. The skill prompt stays short.

## Skill file format

```markdown
---
name: <kebab-case>
description: <one sentence — used by Claude to decide when to trigger this skill>
---

<prompt body>
```

The `description` field is the trigger signal. Make it specific enough that Claude won't fire the skill by accident, but broad enough to catch all intended phrasings.

## Docs

`docs/` is the single source of truth for conventions and practices. When a skill or CLAUDE.md needs to reference a rule, link to the relevant doc instead of duplicating it.

## Feature workflow

Features are designed and implemented iteratively, one subtask at a time, with file-based state under `<working_dir>/features/<feature-slug>/`:

```
<working_dir>/features/<feature-slug>/
├── PRD.md           # top-level: problem, success criteria, ## Architecture, ## Subtasks checklist
├── decisions.md     # append-only log of cross-subtask decisions
└── subtasks/
    ├── 01-<slug>.md       # sub-PRD: detailed design of one checklist item
    ├── 01.01-<slug>.md    # recursive sub-PRD (decomposition of 01)
    └── ...
```

The directory is checked into git; it travels with the code change and is removed after merge.

### Single entry point

`write-prd` is the only skill that drives feature design. It runs in two modes:

- **No argument** → top-level mode: writes `PRD.md` for a new feature (grills, captures, fixes `## Architecture` and the subtask checklist).
- **Path + `#<id>` argument** (e.g. `features/foo/PRD.md#02`) → sub-PRD mode: writes `subtasks/<id>-<slug>.md` for one checklist item, inheriting architecture from the parent.

Recursion (a sub-PRD that itself needs decomposition) is started by the user in a fresh session: `write-prd subtasks/02-x.md#02.01`. Hierarchical IDs (`01`, `01.01`, `02`) keep the flat `subtasks/` layout searchable.

Schemas for every file the workflow produces live with the skill — see `skills/engineering/write-prd/references/{prd-schema,sub-prd-schema,decisions-schema}.md`.

### One subtask cycle (manual)

For each item in the top-level PRD's checklist, the user runs a fresh session:

1. Open the subtask: `write-prd features/<slug>/PRD.md#<id>` — produces `subtasks/<id>-<slug>.md`.
2. Read the sub-PRD. If it is still too large, recurse: `write-prd subtasks/<id>-<slug>.md#<sub-id>` in another fresh session. Otherwise, implement.
3. Implement: `implement-feature` with `spec_path=<sub-PRD path>`, `chunk_id=<id>` (Mode A — it reads the sub-PRD's `## Chunk <id>` section directly).
4. Tick the matching `[ ]` → `[x]` in the parent PRD's `## Subtasks` checklist.
5. If a cross-subtask insight came up, append an entry to `decisions.md` using the template in `references/decisions-schema.md`.
6. Run `review-changes` against the sub-PRD's intent.
7. Run the stack's Definition of Done: tests, format, OpenAPI regen, infra updates as applicable. Per-stack details live in `docs/engineering/<stack>/index.md`.

### Closing the feature

After every checklist item is ticked:

- Read the top-level PRD; confirm `## Architecture > Invariants` still hold against the actual code.
- Run `verify-logic` on the key entry points (PRD's success criteria).
- Run the full Definition of Done across the feature, not just per-subtask.
- Delete `features/<feature-slug>/` before merging the PR — it has served its purpose and would only add noise to future diffs.
