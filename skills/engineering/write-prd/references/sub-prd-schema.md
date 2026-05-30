# `subtasks/<id>.md` schema — file format

## Contents
- Location
- Full template
- Field-by-field meaning (Meta · Inherited architecture · Consumed decisions · Chunk section · Decomposition hint)
- Rules for filling in a sub-PRD
- Example — leaf subtask, implementation-ready
- Example — recursive parent, points downstream

A sub-PRD is the detailed design of one subtask from a top-level PRD's checklist. It carries enough context for the user to decide whether to implement directly or decompose further, and — when implementation is the next step — feeds `implement-feature` without further rewriting.

This file documents the layout. Section headings and per-chunk field names are stable; anything that reads or writes a sub-PRD parses by exact heading.

## Location

Sub-PRDs live flat inside the feature directory's `subtasks/` folder:

```
<working_dir>/features/<feature-slug>/subtasks/
├── 01-<slug>.md
├── 01.01-<slug>.md
├── 01.02-<slug>.md
├── 02-<slug>.md
└── ...
```

The numeric prefix is the subtask ID and matches an item in the parent PRD's `## Subtasks` checklist. Hierarchical IDs (`01.01`, `01.02`) denote recursive decomposition — a sub-PRD spawned its own sub-sub-PRDs. The layout stays flat; the hierarchy lives in the ID, not in nested directories.

Depth beyond three levels (`01.01.01`) is a smell: the top-level decomposition is probably too coarse. Pause and reshape the parent PRD's checklist rather than burrowing deeper.

## Full template

```markdown
# <Subtask name> — Sub-PRD

## Meta
- id: <hierarchical ID, e.g. 01, 01.02>
- parent: ../PRD.md   # or ./<sibling-sub-PRD>.md for recursive decomposition
- created: <ISO 8601 timestamp>

## Inherited architecture
<List the invariants from the parent PRD's ## Architecture > Invariants section that this subtask must preserve. Copy them verbatim or paraphrase, then add subtask-specific clarifications inline.

If this subtask is recursive (parent is another sub-PRD), inheritance is transitive — copy the relevant invariants from the chain.

- <invariant 1>
- <invariant 2>>

## Consumed decisions
<List decisions.md entries (by title) this subtask depends on. Empty if none apply yet.

- <decision title>: <one-line summary of how it constrains this subtask>>

## Chunk <id> — <name>

### intent
<1–3 sentences. What this subtask delivers, why it exists.>

### working_dir
<absolute path — usually matches the parent PRD's working_dir; may differ for multi-service features>

### files
- <relative path to working_dir>: <one-line purpose>
- <relative path>: <one-line purpose>

### interfaces
<List of interfaces this subtask introduces or consumes:
- <InterfaceName> in <package path>:
  - <method name + one-line purpose>
Use "—" if the subtask is a pure entity / no interfaces.>

### edge_cases
- <input condition>: <expected behavior>
- <input condition>: <expected behavior>

### dependencies
- <package or port name>: <how this subtask depends on it>

### notes
<Free-form constraints: perf budgets, no-go APIs, transactional requirements, etc. Empty by default.>

### status
- implement: pending | done | failed

## Decomposition hint
<Optional. Filled only when the subtask is clearly too large for one implementation pass and the user is likely to recurse.

If present, list candidate sub-subtasks the next `write-prd` run could expand into:
- <candidate 1>
- <candidate 2>

If the subtask is implementation-ready as written, leave this section absent.>
```

## Field-by-field meaning

### Meta

- **`id`** — hierarchical ID matching the filename prefix and the parent PRD's checklist item. Stable for the lifetime of the sub-PRD.
- **`parent`** — relative path to the parent document (top-level `PRD.md` or another sub-PRD). Enables tooling to walk back up the inheritance chain.
- **`created`** — when this sub-PRD was written. Useful for spotting stale sub-PRDs after the parent's architecture moved.

### Inherited architecture

The top-level PRD's `## Architecture > Invariants` list is the contract every subtask must respect. This section copies (or paraphrases) the entries that bear on this subtask, so the implementer doesn't have to re-derive them. For recursive subtasks, the inheritance is transitive: pull invariants from the whole parent chain.

### Consumed decisions

Cross-subtask decisions captured in `decisions.md` (see `decisions-schema.md`) constrain later subtasks. If this subtask is downstream of such a decision, list it here with a one-line summary so the implementer reads it as part of the spec rather than as background noise.

### Chunk section — implement-feature contract

The `## Chunk <id>` section is the implementation-ready spec, identical in shape to the per-chunk sections in the legacy `spec.md`. `implement-feature` (Mode A) consumes this section directly:

- pass `spec_path = <path-to-sub-PRD>`, `chunk_id = <id>` → it reads the same fields it always read.

Field meanings are unchanged from the legacy chunk format:

- **`intent`** — what this subtask delivers, in 1–3 sentences. Source of truth for `verify-logic` later.
- **`working_dir`** — absolute path; usually mirrors the parent PRD's working_dir.
- **`files`** — every file this subtask creates or modifies, each with a one-line purpose. No "and other files" — be exhaustive.
- **`interfaces`** — for each interface or contract the subtask introduces or consumes: name, location, and the public surface. `—` if no formal interface.
- **`edge_cases`** — at least 3 cases when the logic is non-trivial: happy path, one edge, one error. The tests derive from this list.
- **`dependencies`** — packages or ports this subtask consumes.
- **`notes`** — only fill when there's a real constraint (perf budget, transactional invariant, no-go API). Empty otherwise.
- **`status`** — `implement` field tracks lifecycle: `pending` → `done` (or `failed`). The orchestrator (or the user, manually) updates it after `implement-feature` returns.

### Decomposition hint

A safety valve. If the subtask is too large but the user hasn't yet decided to recurse, listing candidate sub-subtasks here gives them a starting point for the next `write-prd` invocation. Absent by default — most subtasks are implementation-ready as written.

## Rules for filling in a sub-PRD

1. **Architecture is inherited, not redesigned.** A sub-PRD that contradicts the parent's invariants is a bug. If a sub-PRD would have to break an invariant, that's a signal to revisit the parent PRD, not to silently diverge.
2. **Every Chunk field is filled.** No placeholders. If a field cannot be filled, the subtask is not ready — decompose it (Decomposition hint) and recurse rather than ship a half-spec.
3. **Hierarchical IDs are stable.** Once `01.02` is assigned, that ID never points to anything else.
4. **`implement-feature` is the only consumer of the Chunk section.** Do not put non-spec material there. Discovery, alternatives, and rejected designs stay in conversation, not on disk.
5. **Stale sub-PRDs are regenerated, not patched.** If the parent PRD's architecture moves after this sub-PRD was written, regenerate the sub-PRD with `write-prd` rather than editing field-by-field. Persistent files are snapshots — staleness is signalled by `created` versus the parent's mtime.

## Example — leaf subtask, implementation-ready

```markdown
# CanonizePerfumeName helper — Sub-PRD

## Meta
- id: 01
- parent: ../PRD.md
- created: 2026-05-30T14:00:00Z

## Inherited architecture
- Pure helper, no I/O — must remain safe on the hot path.
- Standard library only.

## Consumed decisions
(none yet)

## Chunk 01 — CanonizePerfumeName

### intent
Add `CanonizePerfumeName(string) string` so callers can normalize user input before lookup.

### working_dir
~/code/backend/services/perfumist

### files
- internal/utils/canonization/canonize_perfume_name.go: the helper itself
- internal/utils/canonization/canonize_perfume_name_test.go: table-driven tests

### interfaces
—

### edge_cases
- empty string: returns empty string
- string with leading/trailing whitespace: returns trimmed value
- string with multiple internal spaces: collapses to single space
- mixed-case input: returns lowercase

### dependencies
- standard library `strings` only

### notes
Pure function, no I/O. Must be safe to call on the hot path.

### status
- implement: pending
```

## Example — recursive parent, points downstream

```markdown
# Service layer — Sub-PRD

## Meta
- id: 02
- parent: ../PRD.md
- created: 2026-05-30T14:30:00Z

## Inherited architecture
- Service depends on ports, never on concrete adapters.
- All write paths wrap their work in a single transaction.

## Consumed decisions
- Repository interface segmentation: each operation has its own small interface in `ports/repository/`.

## Chunk 02 — Service layer

### intent
Expose the service entry points the REST handler will call.

### working_dir
~/code/backend/services/perfumist

### files
- internal/services/perfume/service.go: struct + constructor
- (further files are introduced by sub-subtasks 02.01 and 02.02)

### interfaces
- Service in internal/services/perfume:
  - Save(ctx, Perfume) error
  - FindByID(ctx, ID) (Perfume, error)

### edge_cases
- Subtask is itself a decomposition step — concrete cases live in 02.01 and 02.02.

### dependencies
- ports/repository/perfume (Saver, ByIDGetter)

### notes
This subtask is decomposition-heavy. See Decomposition hint below.

### status
- implement: pending

## Decomposition hint
- 02.01 — Save operation
- 02.02 — FindByID operation
```
