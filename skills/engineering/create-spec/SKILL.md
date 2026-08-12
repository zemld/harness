---
name: create-spec
description: Captures the design settled in this session into one spec file.
allowed-tools: Read(references/**), Write(.features/**)
disable-model-invocation: true
---

Capture what this session settled into one spec file.

## Step 1 — Settle

Fill the spec only from material settled in this session. Never infer, complete, or derive missing material — the spec is the only carrier of this design into a clean implementation session, and an invention reads exactly like a settled fact.

Completion: every settled item belongs in a section below, and every absent item and inapplicable optional section is omitted.

## Step 2 — Write

Write `<working_dir>/.features/<feature-slug>/<spec-slug>.md`, creating the directory if needed. `working_dir` is the project root (default `cwd`). `feature-slug` is kebab-case for the whole feature; `spec-slug` is kebab-case for what this spec covers, and equals `feature-slug` when the feature was never split.

Use this section order:

1. `# <Name>`.
2. `## Meta` — author and date.
3. `## Scope` — what this spec covers, followed by a short list of what sits next to it and is explicitly out.
4. `## Decisions`, split into `### Key` and `### Rest`.
5. `## Functional requirements` — numbered verifiable claims, `FR-1`, `FR-2`, and so on.
6. Optional `## Non-functional requirements` — only binding latency budgets, size or rate limits, compatibility, and security constraints.
7. `## Acceptance criteria` — externally observable outcomes, one per line, each naming what to do and what to see for `/test-feature`.
8. Optional `## Technical design` — only technical design settled in this session.

Under `Decisions`, write one Key entry as `- **<Decision>** — what was chosen; why; what it cost.` when reversing it would force other decisions in this spec to change or would change the externally exposed contract. Write every other decision under Rest as one line stating what was chosen, without rationale.

Requirements state outcomes, not implementation routes. Record a choice and its rationale under Decisions; record its resulting structure under Technical design without repeating the same material.

When this session settled technical design, read `references/technical-design.md` before writing that section.

Completion: the file is written with every applicable section in the order above and no inapplicable optional section.
