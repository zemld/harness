# `PRD.md` schema — file format

## Contents
- What a PRD is
- Location
- Full template
- Section-by-section meaning
- The no-paths rule
- Rules for filling in a PRD
- Example — top-level PRD (decomposes into subtasks)
- Example — nested PRD (implementation-ready, has a parent)

## What a PRD is

A PRD captures **what** to build and **why** — the problem, the users, the success criteria, the architecture, the contracts. It does not capture **where** the code lives. Where each module sits is dictated by stack conventions (`docs/engineering/<stack>/`) at the implementation stage, not at the design stage.

There is exactly one schema. A PRD sits at one of two levels:

- **Top-level PRD** (`features/<slug>/PRD.md`) — no `parent` in `## Meta`. Drives the feature as a whole. Has a populated `## Subtasks` list when the feature needs more than one implementation pass; otherwise leaf, with `## Contracts` / `## Edge cases` filled.
- **Nested PRD** (`features/<slug>/subtasks/<id>-<slug>.md`) — has `parent: ../PRD.md` in `## Meta` as a human-navigation pointer (nothing more — the PRD itself is self-contained). Always leaf: fills `## Contracts` / `## Edge cases`, goes straight into implementation. Nested PRDs never have a `## Subtasks` list of their own.

Each PRD stands on its own. The skill does not read the parent when writing a nested PRD, and the implementer does not consult the parent when implementing one — every fact the PRD relies on must be inside that PRD. If a top-level invariant matters for a subtask, the user names it in the discovery conversation for that subtask and it enters the nested PRD's `## Architecture` directly. This costs a little duplication and buys complete independence: a nested PRD can be reviewed, implemented, or thrown away without touching anything else.

Decomposition is exactly one level deep. If a nested PRD would need its own subtasks to be honest, the top-level `## Subtasks` was too coarse — rewrite it with finer items rather than nest deeper. The same skill, `write-prd`, writes both shapes; the difference is purely a function of `Meta.parent` presence.

## Location

```
<working_dir>/features/<feature-slug>/
├── PRD.md                        # top-level
└── subtasks/
    ├── 01-<slug>.md              # nested PRD for subtask 01
    ├── 02-<slug>.md              # nested PRD for subtask 02
    └── ...
```

`<feature-slug>` is kebab-case. The numeric prefix on nested files matches the `id` from `## Meta` and the entry in the parent's `## Subtasks` list. Ids are plain integers (`01`, `02`, …) — no recursion, no dots. The whole directory is checked into git and removed after merge.

## Full template

```markdown
# <Feature or subtask name> — PRD

## Meta
- created: <ISO 8601>
- working_dir: <absolute path to project root>
- parent: ../PRD.md                              # omit for top-level; always `../PRD.md` for nested
- id: <plain integer, e.g. 01, 02>               # omit for top-level

## Problem & motivation
<What goes wrong without this? Who feels it? Why now? Concrete consequences of doing nothing.>

## User stories
<Numbered list in "As <actor>, I want <capability>, so that <benefit>" form. Cover the main flows. Even internal-only features have an actor (the calling service, the on-call engineer, etc.).

1. As <actor>, I want <capability>, so that <benefit>.
2. ...>

## Success criteria
<Observable, checkable outcomes. "It works correctly" is not a criterion; "endpoint returns the expected JSON shape for a valid input under p99 < 100ms" is.

- <criterion>
- <criterion>>

## Architecture
<Mandatory at every level. Describes structure, data flow, and invariants in terms of modules, seams, and contracts — never in terms of file paths or code snippets.

**Structure.** Which logical components the feature touches and how they relate. Name the modules and the seams between them. Use a mermaid diagram if relationships are non-trivial.

**Data flow.** How data moves from trigger to result. Numbered steps or a sequence diagram.

**Invariants.** Single-line rules every part of the implementation must preserve. Examples: "domain entity X stays immutable after creation", "no synchronous I/O on the hot path", "RPC contract Y is append-only".

For nested PRDs, any invariant from the top-level that bears on this subtask must be stated here as a first-class item — the user names it during the discovery conversation for the nested PRD. No automatic copying from the parent.>

## Testing decisions
<What we will test and at which seam. Pick the highest existing seam that captures real behaviour — prefer reusing seams over inventing new ones.

- **What to test:** <observable behaviour, in terms users / callers can see>
- **Seam:** <the module or boundary the tests sit against, named by role — not by file path>
- **Prior art:** <similar tests already in the project, named by what they exercise; "none" if greenfield>

The implementation skill will turn this into concrete test files at the right locations per stack conventions.>

## Contracts
<The public surface this PRD introduces or modifies. For each:

- **<ContractName>** — purpose in one line
  - <method or operation>(<arg shape>) <return shape> — what it does
  - <method or operation>(...) — ...

Name and signature only. No package paths, no file paths, no code snippets. The implementation skill places each contract per stack conventions.

Empty (`—`) when the PRD introduces no new public surface (pure refactor, internal helper, etc.).>

## Edge cases
<Input conditions and expected behaviour. At least one happy path, one edge, one error case for any non-trivial logic.

- <input condition>: <expected behaviour>
- <input condition>: <expected behaviour>>

## Subtasks
<List of subtasks this PRD decomposes into. Present only in top-level PRDs that need more than one implementation pass; absent when the top-level PRD is leaf, and always absent in nested PRDs.

Each item:
- One line, descriptive
- Plain id (`01`, `02`, …) matching the nested PRD file's `## Meta.id`

The list is a static index of decomposition. The PRD does not track which subtasks are done — that is what git history is for.

Example:
- 01 — Domain types
- 02 — Service layer
- 03 — REST handler>

## Out of scope
<Explicit boundary. What this PRD does NOT cover, to prevent scope creep downstream.

- <not doing X>
- <not doing Y>>

## Open questions
<The working escape valve for gaps in the design — not just deferred decisions. Anything that cannot be filled honestly from the conversation or from a code skim lands here, with a note naming the section it blocks. Resolved later by editing the PRD or by regenerating it from fuller context.

- <question> (blocks `## <section>`)
- <question> (blocks `## <section>`)>
```

## Section-by-section meaning

### Meta

- **`created`** — when this PRD was written. Useful for spotting staleness against the code.
- **`working_dir`** — absolute path to the project root the PRD targets. The only path allowed anywhere in the document, because `implement-prd` physically needs a project root to start from.
- **`parent`** — present only for nested PRDs. Always `../PRD.md`. A pure human-navigation pointer — nothing in the toolchain reads the parent file based on this value.
- **`id`** — present only for nested PRDs. Plain integer matching the filename prefix and the parent's `## Subtasks` entry. Stable for the lifetime of the PRD.

### Problem & motivation

The gap or pain that justifies building this. Concrete consequences of doing nothing. Not a wish list — name the failure mode that exists today.

### User stories

The main flows in user terms, in the standard "As <actor>, I want <capability>, so that <benefit>" form. Forces user-perspective framing and disambiguates whose problem is being solved. Maps to integration tests later. Cover all flows the PRD enables.

### Success criteria

Observable, checkable outcomes — by code, by metric, or by user observation. The reader should be able to answer "is the feature done?" without subjective judgement.

### Architecture

The structural anchor. Names components, data flow, and invariants in terms of modules, seams, and contracts. No file paths, no package paths, no code snippets — these belong to the implementation, not the design.

For nested PRDs, this section stands alone — there is no inheritance from the parent at the file level. Any invariant from the top-level that matters for this subtask is restated here directly, named by the user during the discovery conversation. The cost is a little duplication; the benefit is that the nested PRD can be read, reviewed, implemented, or thrown away without consulting any other file.

### Testing decisions

What will be tested and at which seam. Pick the highest existing seam that captures real behaviour — Mike Feathers' rule "prefer existing seams, use the highest one possible" applies. Prior art names similar tests already in the project. Naming by role, not by file path, keeps this stable as code moves around.

### Contracts

The public surface introduced or modified — interface and operation names plus signatures. No package paths, no file paths, no code snippets. The implementation skill places each contract at the right location per stack conventions. `—` if the PRD adds no new public surface.

### Edge cases

Input conditions and expected behaviour. Three is the floor for any non-trivial logic: happy path, one edge, one error. The tests derive from this list.

### Subtasks

Present only in top-level PRDs that need more than one implementation pass. Absent in leaf PRDs (top-level or nested) — those go straight into `implement-prd`. Ids are plain integers matching the nested PRD filenames. The list is a static index, not a progress tracker — git history shows what is done.

### Out of scope

Explicit boundary used by downstream consumers (including `implement-prd`) to reject scope creep.

### Open questions

The working escape valve for design gaps. Anything that cannot be filled honestly from the conversation or from a code skim lands here, with a note naming the section it blocks (e.g. `What is the cache TTL? (blocks ## Success criteria)`). Resolved later by editing the PRD or by regenerating it from fuller context — not just "deferred decisions".

## The no-paths rule

Anywhere in the PRD body except `Meta.working_dir`: no file paths, no package paths, no relative paths, no import statements, no code snippets, no filename references.

**Why.** Two reasons:

1. **Staleness.** A path written into the design freezes a structural assumption. The day the code reorganises, the PRD silently rots. Names of modules, seams, and contracts are stable across reorganisations; paths are not.
2. **Layering.** Design (this skill) and implementation (`implement-prd`) are separate stages on purpose. Implementation knows the stack conventions and chooses placement. Design that prescribes paths skips the conventions and produces work that conflicts with them.

The only legitimate path is `Meta.working_dir`, because the implementation skill physically needs a project root to start from.

If you find yourself wanting to write a path because the design feels incomplete without it, that is a signal the Architecture section is naming the wrong unit — name the module or seam by role instead of by location.

## Rules for filling in a PRD

1. **The PRD is a record of the design conversation, not invention.** Pull each section from what the user actually said in this session, from the code that the skill can read, or from what the user confirms in a single targeted question. If nothing supports a section, leave it absent — do not fabricate. (Architecture is the one exception: it must be filled before the file is written.)
2. **Each PRD is self-contained.** Nothing in the toolchain reads the parent of a nested PRD when writing or implementing it. If a top-level invariant matters for a subtask, the user names it during the discovery conversation for that subtask and it enters the nested PRD's `## Architecture` directly.
3. **Synthesize, don't interview.** The conversation has already happened. Pull from it. Ask a clarifying question only when leaving a section absent would make the PRD useless and the conversation gave nothing to lean on.
4. **No paths in the body.** Per the no-paths rule above. The single permitted path is `Meta.working_dir`.
5. **`## Architecture` is not optional.** Without it, the PRD has no structural anchor and drifts in implementation. If the conversation has not produced enough structural commitment, synthesize the best structural picture from the code skim and from what the user did say, and push specific structural unknowns into `## Open questions` — never write a placeholder, never interview the user inline.
6. **Decomposition is one level deep.** Nested PRDs never have a `## Subtasks` list of their own. If a nested PRD would need one to be honest, the top-level `## Subtasks` was too coarse — rewrite the top-level rather than nest deeper.
7. **Ids are stable.** Once `02` is assigned, that id never points to anything else. Removed subtasks leave gaps rather than renumber siblings.
8. **Stale PRDs are regenerated, not patched.** If the conversation, the user's intent, or the surrounding code moves after a PRD was written, regenerate the PRD rather than editing it field-by-field. Files are snapshots.
9. **Confirm with the user before downstream consumers read it.** Once written, show the file inline; let the user edit; only then close out.

## Example — top-level PRD (decomposes into subtasks)

```markdown
# Perfume similarity endpoint — PRD

## Meta
- created: 2026-05-30T12:00:00Z
- working_dir: /Users/zemld/code/perfumist

## Problem & motivation
Users browsing a perfume page have no way to discover similar perfumes. Manual curation does not scale past the top-50 catalogue. Without an automatic similarity surface, engagement on the long tail stays flat and recommendation tickets dominate the support queue.

## User stories
1. As a perfume catalogue user, I want to see the ten most similar perfumes to the one I'm viewing, so that I can discover alternatives without leaving the page.
2. As a recommendation analyst, I want similarity scores to be reproducible, so that I can audit unexpected results against the underlying notes vectors.

## Success criteria
- A GET request against the similarity endpoint with a valid perfume id returns ten results ranked by similarity score, p99 latency under 100ms on the production data set.
- Re-running the same request against an unchanged catalogue returns the same ten results in the same order.
- The endpoint surfaces no perfume that has been soft-deleted.

## Architecture
**Structure.** A new similarity service sits next to the existing perfume catalogue service. The HTTP handler delegates to the similarity service, which composes a notes-vector repository (reading the existing `notes_vector` column) with a cosine scoring strategy. No new persistence — reuses the existing perfume store.

**Data flow.**
1. Handler receives perfume id from the URL.
2. Service loads the source perfume's notes vector via the repository.
3. Service asks the repository for candidate vectors (excludes the source, excludes soft-deleted).
4. Scoring strategy ranks candidates by cosine distance.
5. Service returns top ten ids.
6. Handler renders them as JSON.

**Invariants.**
- Scoring is pure and synchronous — no I/O inside the scoring strategy.
- Soft-deleted perfumes never appear in any result set, at any layer.
- The repository never returns the source perfume in the candidate list.

## Testing decisions
- **What to test:** end-to-end behaviour of the similarity endpoint (input id → ranked JSON) and the scoring strategy in isolation.
- **Seam:** integration tests at the HTTP handler seam; unit tests at the scoring strategy seam. The repository is exercised through the integration tests against a seeded test database — no separate repository-level test layer.
- **Prior art:** the existing perfume catalogue tests at the HTTP handler seam. Same shape — table-driven, real database, golden JSON.

## Contracts
- **SimilarityService** — finds perfumes similar to a given one
  - `FindSimilar(ctx, perfumeID, limit) ([]PerfumeID, error)` — returns ids ranked by similarity, excluding the source and soft-deleted

- **NotesVectorRepository** — reads notes vectors for the similarity service
  - `LoadVector(ctx, perfumeID) (NotesVector, error)` — fetches one vector
  - `LoadCandidates(ctx, excludeID) ([]CandidateVector, error)` — fetches candidate vectors, excluding the source

- **ScoringStrategy** — ranks candidates against a source
  - `Rank(source NotesVector, candidates []CandidateVector, limit) []PerfumeID` — pure, returns ids in similarity order

## Edge cases
- Source perfume does not exist: handler returns 404, no scoring is performed.
- Source perfume has a null notes vector: handler returns 422 with an explicit reason.
- Candidate set is smaller than the requested limit: return whatever exists, ranked.

## Subtasks
- 01 — Domain types and NotesVectorRepository port
- 02 — Cosine scoring strategy
- 03 — SimilarityService implementation
- 04 — REST handler + OpenAPI surface

## Out of scope
- Personalised similarity (user preferences).
- Online retraining or vector recomputation.
- Caching the result set.

## Open questions
- Whether to back-fill missing notes vectors as part of this feature or defer to a separate data-quality initiative.
```

## Example — nested PRD (implementation-ready, has a parent)

```markdown
# Cosine scoring strategy — PRD

## Meta
- created: 2026-05-30T14:30:00Z
- working_dir: /Users/zemld/code/perfumist
- parent: ../PRD.md
- id: 02

## Problem & motivation
The similarity feature needs a deterministic, pure ranking step. Cosine distance over notes vectors is the chosen metric: well-defined, cheap to compute, and easy to audit.

## User stories
1. As the SimilarityService, I want a pure ranking function over a source vector and a list of candidate vectors, so that I can return a deterministic top-N without owning the math.

## Success criteria
- Given a source vector and a candidate set, the strategy returns the candidates sorted by cosine similarity to the source in descending order, truncated to the requested limit.
- Calling the strategy twice with the same inputs returns the same ordering.
- The strategy performs no I/O — repeated calls in a tight loop do not allocate beyond the result slice.

## Architecture
**Structure.** A single ScoringStrategy implementation sitting alongside the SimilarityService. No new dependencies. The strategy depends only on the standard library and on the notes-vector domain type.

**Data flow.**
1. Caller passes a source vector, a candidate slice, and a limit.
2. Strategy computes cosine similarity for each candidate against the source.
3. Strategy sorts by score descending, truncates to limit, returns ids.

**Invariants.**
- Pure: same inputs always produce the same output.
- No I/O.
- The source vector is never mutated.
- The strategy never sees soft-deleted entries — the caller filters them upstream. The strategy may assume the candidate set is clean and must document that precondition.
- Similarity is not symmetric: `Rank(A, [B])` need not agree with `Rank(B, [A])`. The strategy operates strictly source-to-candidates, never the reverse.

## Testing decisions
- **What to test:** the ranking output for representative input shapes — orthogonal vectors, identical vectors, zero-magnitude edge case.
- **Seam:** the ScoringStrategy public method, called directly. No mocks needed — pure function.
- **Prior art:** existing canonization helper tests in the same project — same shape, table-driven over `(input, expected)`.

## Contracts
- **ScoringStrategy** — ranks candidates against a source
  - `Rank(source NotesVector, candidates []CandidateVector, limit int) []PerfumeID` — pure ranking, descending score, length ≤ limit

## Edge cases
- Empty candidate set: returns an empty slice, no error.
- Source vector has zero magnitude: returns an empty slice (cosine is undefined; defer the decision to the caller upstream).
- Two candidates score equally: stable ordering by candidate input order — preserves caller's intent.
- Limit is zero or negative: returns an empty slice.

## Out of scope
- Loading vectors from storage (handled by NotesVectorRepository).
- Validating soft-deleted state (handled upstream by the repository).
- Alternative metrics (Euclidean, Jaccard) — left for future iteration.
```
