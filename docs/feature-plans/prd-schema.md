# `PRD.md` schema — file format

`PRD.md` captures the **why** of a feature: the problem, the users, the success criteria, the constraints. It is the product document — what the feature must accomplish and for whom — kept separate from `spec.md`, which describes how it is built.

This file documents the layout. Section headings are stable; anything that reads or writes `PRD.md` parses by exact heading.

## Location

`PRD.md` lives at:

```
<working_dir>/.feature-plans/<feature-slug>/PRD.md
```

`<working_dir>` is the project root the feature targets. `<feature-slug>` is a kebab-case identifier derived from the feature name. `spec.md` is a sibling in the same directory.

## Full template

```markdown
# <Human-readable feature name> — PRD

## Problem & motivation
<What goes wrong without this? Who feels it? Why now?>

## Users / personas
<Who interacts with this feature? Internal devs, end users, ops, external API consumers?>

## Success criteria
<Observable outcomes that mean "it works":
- <criterion 1>
- <criterion 2>
Each criterion must be checkable — either by code, by a metric, or by user observation.>

## Use cases / key flows
<Numbered scenarios describing the main interactions:
1. <flow description>
2. <flow description>>

## Functional requirements
<What the feature must do, in terms users / callers can observe:
- <requirement>
- <requirement>>

## Non-functional requirements
<Perf budgets, security, scale, compatibility, observability:
- <requirement>
- <requirement>>

## Out of scope
<What is explicitly NOT part of this feature, to prevent scope creep:
- <not doing X>
- <not doing Y>>

## Constraints
<Deadlines, platform restrictions, dependency constraints, budgets:
- <constraint>
- <constraint>>

## Open questions
<Things that came up during discovery but were deferred:
- <question>
- <question>>
```

## Field-by-field meaning

- **`Problem & motivation`** — the gap or pain that justifies building this. Capture concrete consequences of doing nothing.
- **`Users / personas`** — who the feature serves. Even internal-only features have a user.
- **`Success criteria`** — observable, checkable outcomes. "It works correctly" is not a criterion. "Endpoint returns 200 with the expected JSON shape for a valid input" is.
- **`Use cases`** — the main flows in user terms. These map to integration tests later.
- **`Functional requirements`** — what the feature must accomplish, behavior-level.
- **`Non-functional requirements`** — perf (latency, throughput), scale (RPS, data volume), security (auth, audit), compatibility (backwards compat with X version).
- **`Out of scope`** — explicit boundary. Used downstream to reject scope creep.
- **`Constraints`** — fixed conditions that cannot be traded away. Hard deadlines, platform restrictions, mandatory dependencies.
- **`Open questions`** — things surfaced during discovery but not resolved. May be answered later; serve as flags for downstream consumers to revisit if a design decision exposes them.

## Rules for filling in PRD.md

1. **The PRD is a record of the discovery conversation, not a wish list.** Do not invent fields. If a section was not discussed, leave it as `(not discussed)` rather than guessing.
2. **Confirm with the human before downstream consumers read it.** Once written, show the file; let the human edit; only then move on.
3. **Do not include tech-spec material.** PRD.md says "must handle 1k RPS"; spec.md says "uses Redis with two-second TTL." Keep the boundary clean.
4. **No code, no signatures, no file paths.** This is the product document, not the design.
5. **Open questions stay open.** If something was deferred, list it under Open questions. Downstream consumers may answer them or surface them again — the PRD itself does not force resolution.

## Example — small feature

```markdown
# Add CanonizePerfumeName helper — PRD

## Problem & motivation
User-submitted perfume names vary in case and whitespace, causing duplicate-detection logic to miss obvious duplicates. Without canonization, the dedupe pipeline lets through 5–10% of true duplicates daily.

## Users / personas
Internal: the dedupe pipeline. Indirect: end users who see duplicate perfume entries in search results.

## Success criteria
- Calling the helper with `"  Chanel No. 5  "` returns `"chanel no. 5"`.
- The helper is invoked on every name before it enters the dedupe pipeline.
- The duplicate-rate metric drops below 1% within one day of deployment.

## Use cases / key flows
1. New perfume submitted → name passed to canonizer → canonized name used as the dedupe key.

## Functional requirements
- Lowercase the input.
- Trim leading and trailing whitespace.
- Collapse internal multi-space runs to a single space.

## Non-functional requirements
- Pure function, no I/O. Must be safe on the hot path (called per submission).
- Allocation-light: should not box more than necessary.

## Out of scope
- Unicode normalization (no NFC/NFD).
- Removing punctuation or diacritics.
- Stemming or fuzzy matching.

## Constraints
- Go standard library only — no third-party deps.

## Open questions
- (not discussed)
```
