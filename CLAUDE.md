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
- **Only orchestrators spawn subagents.** A leaf skill never spawns a subagent of its own — it runs inline in whatever context invokes it. If a leaf's work should run with fresh eyes in an isolated context, the *caller* spawns the leaf; the leaf does not spawn itself. Only an orchestrator dispatches work into subagents, and it is the sole spawner — so there is exactly one level of spawning and never a subagent-spawning-a-subagent (which the harness cannot do reliably).
- **Large skills decompose downward — unless the work is one dependent chain.** If a skill is getting long or multi-step, extract the sub-steps into separate leaf skills and have the orchestrator skill reference them. The exception is a sequential chain where each step depends on the last (write contracts → tests → implementation → drive to green): splitting that across isolated subagents fragments one dependent task across many contexts and loses state. Keep such a chain in one skill (`write-code` is the sanctioned example) and reserve separate subagents for genuinely independent or parallel work and for independent review.
- **Skill = behavior, docs = structure.** A skill describes *behavior* — the order of operations, what to do and in what sequence ("to do X, first do this, then this"). Static, structural facts — style rules, layering, where files go, how a test is shaped, which tool stands in for dependencies — are *docs*. A behavioral sequence belongs in the skill and must never be pushed into a doc; a structural rule belongs in `docs/` and must never be duplicated into a skill.
- **Docs over inline knowledge.** If a skill needs to convey structural *how* (conventions, patterns, placement rules), put that content in `docs/` and have the skill reference the doc path. The skill prompt stays short.

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

All reference documentation lives in `./docs/`. The directory layout is self-explanatory — browse it to find conventions for a given stack or topic. `docs/` is the single source of truth for conventions and practices: when a skill or CLAUDE.md needs to reference a rule, link to the relevant doc instead of duplicating it.

## Feature workflow

Features are designed and implemented iteratively, one subtask at a time, with file-based state under `<working_dir>/features/<feature-slug>/`:

```
<working_dir>/features/<feature-slug>/
├── PRD.md           # top-level: problem, success criteria, ## Architecture, ## Subtasks list
└── subtasks/
    ├── 01-<slug>.md       # nested PRD: detailed design of one item from ## Subtasks
    ├── 02-<slug>.md       # nested PRD for subtask 02
    └── ...
```

The directory is checked into git; it travels with the code change and is removed after merge.

### Single entry point

Feature design has one entry point — `write-prd`. The same skill writes both shapes:

- **No argument** (e.g. `/write-prd`, or "хочу добавить X") → writes a top-level `PRD.md` for the feature.
- **Path + `#<id>` argument** (e.g. `features/foo/PRD.md#02`) → writes a nested PRD at `subtasks/<id>-<slug>.md` for one item from the parent's `## Subtasks` list, inheriting architecture from the parent.

There is one schema for both — the shape difference is `Meta.parent`/`Meta.id` (absent for top-level, present for nested) and which optional sections are filled (top-level usually has `## Subtasks`; nested has `## Contracts` and `## Edge cases` instead).

Decomposition is one level deep — nested PRDs go straight into implementation. If a nested PRD comes back too large, the top-level `## Subtasks` was too coarse: rewrite the top-level with finer items rather than nest another level. Plain ids (`01`, `02`, `03`, …) keep the flat `subtasks/` layout searchable.

### One subtask cycle (manual)

For each item in the top-level PRD's `## Subtasks` list, the user runs a fresh session:

1. Write the nested PRD for the next item, producing `subtasks/<id>-<slug>.md`. The discovery conversation must restate any top-level invariant that bears on this subtask — the skill does not read the parent.
2. If the nested PRD comes back too large to implement honestly, rewrite the top-level `## Subtasks` with finer items rather than nest deeper. Otherwise, implement.
3. Implement the nested PRD end-to-end — design becomes code, with tests, format, and style verification along the way.
4. Review the change against the nested PRD's intent.
5. Run the stack's Definition of Done: tests, format, OpenAPI regen, infra updates as applicable. Per-stack details live in `docs/engineering/<stack>/index.md`.

The PRD itself never tracks progress — no checkboxes, no status fields. Git history is the source of truth for what is done.

### Closing the feature

After every subtask in the top-level `## Subtasks` list is implemented:

- Read the top-level PRD; confirm `## Architecture > Invariants` still hold against the actual code.
- Verify the logic at the key entry points the top-level PRD names as success criteria.
- Run the full Definition of Done across the feature, not just per-subtask.
- Delete `features/<feature-slug>/` before merging the PR — it has served its purpose and would only add noise to future diffs.
