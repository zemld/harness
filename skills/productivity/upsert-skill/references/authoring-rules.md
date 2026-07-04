# Skill-authoring rules

The canonical rules for writing skills in this harness. `CLAUDE.md` carries a
one-sentence gist of each; this file is the full version with examples, and the
grading rubric for the verifier.

## Base rules

- **English only.** All skill content — `name`, `description`, and prompt body — must be written in English.
- **Clear and unambiguous.** Every instruction in the prompt body must be precise enough that two different readers would interpret it identically. Avoid vague verbs ("handle", "process", "manage") — say exactly what action to take.
- **Skill body must be concise**. Total amount of skill length must be kept to no more than 40 short sentences.

A skill exists to wrangle determinism out of a stochastic system. The root virtue is **predictability**: the agent follows the same *process* on every run (not the same output). Every rule below is a lever on predictability.

## 1. Invocation — choose who can fire the skill

- **Model-invoked** (default): the `description` stays visible to the agent every turn. The agent can fire it autonomously, and other skills can invoke it. Cost: **context load** — the description consumes tokens and attention permanently.
- **User-invoked** (`disable-model-invocation: true`): only a human typing `/name` can fire it. Zero context load. Cost: **cognitive load** — the human must remember it exists.

Rules:
- Make a skill model-invoked only if the agent must reach it on its own, or another skill must invoke it. Otherwise make it user-invoked.
- Cognitive load is the price of human agency — spend it where human judgement matters (e.g. deciding when to plan or review); don't automate those decisions away.
- A user-invoked skill can invoke model-invoked skills, but never another user-invoked one (no description = nothing to invoke it by).
- When user-invoked skills exceed what a human can remember, add one **router skill** that lists them and when to reach for each.
- Express dependencies as prose invocation ("Run the `/grilling` skill"), never as file paths into another skill's folder.

## 2. Description — the trigger

- Model-invoked description = triggers only: what the skill is + distinct trigger phrases ("Use when the user wants…, mentions…").
- One trigger per distinct use case. Synonyms restating the same case are duplication — collapse them.
- Word the description with the exact terms you actually use in prompts — matching is more reliable.
- User-invoked description = one human-facing summary line; strip trigger lists.

## 3. Information hierarchy — where content lives

Content is **steps** (ordered actions) or **reference** (rules, definitions, facts). Rank by how immediately the agent needs it:

1. Steps — inline in SKILL.md.
2. Reference needed on every run — inline in SKILL.md.
3. Reference needed only on some paths — a separate file behind a link (**progressive disclosure**).

Rules:
- Inline what every execution path needs; push behind a pointer what only some paths reach.
- A pointer's *wording* decides whether the agent follows it. If the agent skips a must-read file, sharpen the pointer wording first ("Before writing ANY test, read tests.md"); inline the material only if that fails.
- Keep a concept's definition, rules, and caveats under one heading (**co-location**) — never scattered.

## 4. Leading words — anchor behavior in one token

A **leading word** is a concept already in the model's pretraining that encodes a behavior in one token (*tight* loop instead of "fast, deterministic, low-overhead"; goes *red* instead of "a test you trust to catch the bug"). Repeat the token, never the sentence.

- Prefer existing words — invented terms recruit no priors and cost definition tokens.
- Use them in the body (anchors execution) and in the description (anchors invocation).
- If a leading word is too weak to change behavior ("be thorough"), replace it with a stronger one ("relentless") — don't switch technique.

## 5. Completion criteria — how steps end

Every step ends on a completion criterion with two properties:

- **Checkable**: the agent can tell done from not-done. Bad: "achieve understanding". Good: "name one command you have already run; paste the invocation and its output".
- **Demanding**: it forces exhaustive work. Bad: "produce a change list". Good: "every modified model accounted for".

A vague criterion invites **premature completion**: the agent quits a step early, pulled forward by visible later steps. Fix in order: (1) sharpen the criterion — cheap and local; (2) only if it's irreducibly fuzzy AND you observe the rush, split the sequence so later steps sit behind a real context boundary (subagent or handoff — an inline call hides nothing).

## 6. Pruning — keep it lean

- **Single source of truth**: each meaning lives in exactly one place. Duplication costs maintenance, tokens, and inflates the meaning's apparent importance.
- **No-op test, per sentence**: does this sentence change behavior versus the model's default? If not, delete the whole sentence — don't trim it. The verdict is settled by running the skill, not by debate.
- **Relevance**: delete lines that no longer bear on what the skill does (stale = sediment).
- **Sprawl**: even all-live, all-unique content can be too long. Cure: disclose reference down the hierarchy, split by path or sequence.

## 7. Splitting — only when a cut pays

Every new skill spends one of the two loads. Split only:

- **By invocation**: a distinct leading word should trigger it on its own, or another skill must invoke it. (Reuse justifies extracting a skill; it does not justify making it model-invoked.)
- **By sequence**: visible later steps cause observed premature completion (see §5).

Prefer thin wrappers: a user-invoked entry point can be one line ("Run a `/grilling` session") delegating to a model-invoked skill that holds the reusable discipline.

## 8. Shared vocabulary — CONTEXT.md

- `CONTEXT.md` at the repo root is a glossary and nothing else: canonical terms, 1–2 sentence definitions ("what it IS, not what it does"), and an `_Avoid_:` list of banned synonyms per term. No implementation details, only project-specific concepts.
- Reading it is a one-line habit in any skill ("read `CONTEXT.md` if it exists, use its vocabulary for naming"). Changing it is an active discipline: challenge conflicting terms immediately, sharpen fuzzy ones, and update the file inline the moment a term is resolved — never batch.
- Record decisions as minimal ADRs (`docs/adr/NNNN-slug.md`, a paragraph is enough) only when all three hold: hard to reverse, surprising without context, the result of a real trade-off.
- Create these files lazily — only when there is something to write.

## Skill file format

```markdown
---
name: <kebab-case>
description: <one sentence — used by Claude to decide when to trigger this skill>
allowed-tools: <optional — comma-separated tools, optionally path-scoped>
---

<prompt body>
```

The `description` field is the trigger signal. Make it specific enough that Claude won't fire the skill by accident, but broad enough to catch all intended phrasings.

`allowed-tools` is optional. It pre-authorizes the tools a skill needs so it runs without permission prompts — declared *in the skill*, not in any one agent's settings, so it stays agent-agnostic. Scope each tool to a relative path glob (relative paths keep it location-independent across install locations): e.g. `Read(references/**), Write(features/**)`.
