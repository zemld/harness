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
