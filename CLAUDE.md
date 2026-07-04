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

Author and refactor skills with the `/upsert-skill` skill — it enforces the rules below.

### Base rules

- **English only.** All skill content — `name`, `description`, and prompt body — must be written in English.
- **Clear and unambiguous.** Every instruction must be precise enough that two readers interpret it identically. Avoid vague verbs ("handle", "process", "manage").
- **Concise.** No more than 40 short sentences per skill body.

A skill exists to wrangle determinism out of a stochastic system. The root virtue is **predictability**: the agent follows the same *process* on every run. The 8 rules are each a lever on it:

1. **Invocation** — model-invoked (agent can fire it, costs context load) only if the agent or another skill must reach it; otherwise user-invoked (costs cognitive load).
2. **Description** — model-invoked = triggers only, worded with the exact prompt terms; user-invoked = one human-facing line.
3. **Information hierarchy** — steps and every-run reference inline; some-paths reference behind a pointer (progressive disclosure); co-locate a concept's rules.
4. **Leading words** — anchor a behavior in one pretrained token (*tight*, *red*, *relentless*) and repeat the token, not the sentence.
5. **Completion criteria** — end every step on a criterion that is checkable (done vs not-done) and demanding (forces exhaustive work), to prevent premature completion.
6. **Pruning** — single source of truth; delete any sentence that doesn't change behavior versus the default; disclose or split when it sprawls.
7. **Splitting** — extract a skill only when a distinct trigger needs it or observed premature completion forces a sequence boundary; prefer thin wrappers.
8. **Shared vocabulary** — keep `CONTEXT.md` as a glossary and record hard, surprising trade-offs as minimal ADRs; create both lazily.

Full rules with examples + the skill file format: `skills/engineering/upsert-skill/references/authoring-rules.md`.

## Docs

All reference documentation lives in `./docs/`. The directory layout is self-explanatory — browse it to find conventions for a given stack or topic. `docs/` is the single source of truth for conventions and practices: when a skill or CLAUDE.md needs to reference a rule, link to the relevant doc instead of duplicating it.
