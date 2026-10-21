---
name: implement-spec
description: Orchestrates a specification through implementation, independent verification, and a pull request.
disable-model-invocation: true
---

# Very important rule

Implement only what is required by the specification. Never think by yourself and never make decision what another should be done. Only the specification should guide you. You do not allowed to create code outside of the specification.

Same rules must be followed by all agents.

## Workflow

Follow these workflow stages:

1. Prepare
2. Implement until feature is done - repeat steps:
   1. Launch `code-writer` subagent with given specification source and task to make realization for it. If it isn't first iteration, also give subagent review results. Written code must be correctly built and formatted.
   2. Launch two independent `reviewer` subagent with given specification source. First must check alignment between realization and specification. And second must do general code review: project conventions, style, mistakes.
3. When all implementation is done and clear, use `pr` skill to make a pr

## Prepare

Read the original specification, `CONTEXT.md` if present.
Store each round's reports in `<project-root>/.features/<task-slug>/runs/round-N/`, using a task-derived kebab-case slug and consecutive round numbers; exclude this directory from implementation, review scope, and PR commits.
