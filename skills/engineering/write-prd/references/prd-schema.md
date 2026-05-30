# `PRD.md` schema — file format

## Contents
- Location
- Full template
- Field-by-field meaning
- Rules for filling in PRD.md
- Example — small feature

`PRD.md` is the top-level document for a feature. It captures **why** the feature exists (problem, users, success criteria, constraints) and **how it is laid out globally** (architecture, data flow, invariants). The checklist at the end is the index of subtasks that decompose the feature.

This file documents the layout. Section headings are stable; anything that reads or writes `PRD.md` parses by exact heading.

## Location

`PRD.md` lives at:

```
<working_dir>/features/<feature-slug>/PRD.md
```

`<working_dir>` is the project root the feature targets. `<feature-slug>` is a kebab-case identifier derived from the feature name. `decisions.md` and the `subtasks/` directory are siblings in the same directory:

```
<working_dir>/features/<feature-slug>/
├── PRD.md
├── decisions.md
└── subtasks/
    ├── 01-<slug>.md
    ├── 01.01-<slug>.md
    └── ...
```

The whole directory is checked into git, removed after merge.

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

## Architecture
<Mandatory section. Two parts:

**Structure** — which projects, services, modules, or layers the feature touches and how they relate. 1–2 paragraphs naming the components and where each lives. A mermaid diagram if the relationships are non-trivial.

**Data flow** — how data moves through those components from trigger to result. Numbered steps or a sequence diagram.

**Invariants** — single-line statements every subtask must preserve. Examples: "domain entity X stays immutable after creation", "no synchronous DB calls in the request handler", "RPC contract Y is append-only".>

## Subtasks
<Checklist of subtasks the feature decomposes into. Each item:
- One line, descriptive. Hierarchical numbering matches subtasks/ filenames (01, 01.01, 02, …).
- Unchecked `[ ]` initially, ticked `[x]` after the subtask is implemented and reviewed.
- Nested items represent recursive decomposition: a parent subtask spawned its own sub-PRD with its own subtasks.

Example:
- [ ] 01 — Domain types for X
- [ ] 02 — Service layer
  - [ ] 02.01 — Save operation
  - [ ] 02.02 — Lookup operation
- [ ] 03 — REST handler>

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
- **`Architecture`** — the structural anchor shared by every subtask. Without it, sub-PRDs written later have no consistent ground to stand on and risk drifting from each other. The Invariants list is the contract every sub-PRD must inherit explicitly.
- **`Subtasks`** — index of decomposition. The numbering scheme is the same one used for `subtasks/<id>.md` filenames. The list also doubles as the progress tracker: ticking items is the manual close-out signal.
- **`Open questions`** — things surfaced during discovery but not resolved. May be answered later; serve as flags for downstream consumers to revisit if a design decision exposes them.

## Rules for filling in PRD.md

1. **The PRD is a record of the discovery conversation, not a wish list.** Do not invent fields. If a section was not discussed, leave it as `(not discussed)` rather than guessing.
2. **`Architecture` is not optional.** If the conversation has not landed on enough structural commitment to fill it, the PRD is not ready — return to the interview.
3. **Confirm with the human before downstream consumers read it.** Once written, show the file; let the human edit; only then move on.
4. **`Subtasks` numbering is stable.** Once `01` is assigned, that number never points to anything else. New items get fresh numbers; removed items leave a gap.
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

## Architecture
**Structure.** Single pure helper in `internal/utils/canonization/canonize_perfume_name.go`. No new package boundaries, no new dependencies — sits inside the existing `utils/canonization` package next to similar helpers.

**Data flow.** Caller passes `string` → helper returns canonized `string` synchronously, no I/O.

**Invariants.**
- Pure: same input always produces same output, no global state.
- No allocation beyond what `strings.ToLower` and `strings.Fields` already do.

## Subtasks
- [ ] 01 — CanonizePerfumeName helper + tests

## Open questions
- (not discussed)
```
