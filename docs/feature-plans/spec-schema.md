# `spec.md` schema — file format

`spec.md` is the master engineering document for a feature: architecture, decomposition into chunks, and the per-chunk design used to drive implementation. This file describes its layout. Section headings and per-chunk field names are stable — anything that reads or writes this file parses by exact heading.

## Location

`spec.md` lives at:

```
<working_dir>/.feature-plans/<feature-slug>/spec.md
```

`<working_dir>` is the project root the feature targets. `<feature-slug>` is a kebab-case identifier derived from the feature name. `PRD.md` is a sibling in the same directory — the schema requires them to live side by side so the relative `prd: ./PRD.md` reference in Meta resolves.

## Full template

```markdown
# <Human-readable feature name> — Spec

## Meta
- slug: <feature-slug>
- size: small | big
- created: <ISO 8601 timestamp>
- status: in-progress | done
- working_dir: <absolute path to the service repo root>
- bootstrap_services: []   # or [name1, name2] when new services must be scaffolded
- prd: ./PRD.md

## Architecture
<1–2 paragraphs describing the chosen approach,
followed by a mermaid diagram, followed by a single line:
"Why this approach: <reference to PRD constraints that justify the choice>".
For small features, the diagram may be omitted.>

## Chunks
| ID | Name                 | Depends on | Status   | Owner |
| -- | -------------------- | ---------- | -------- | ----- |
| C1 | domain types         | —          | pending  | —     |
| C2 | service.SaveX        | C1         | pending  | —     |
| C3 | repository.SaveX     | C1         | pending  | —     |
| C4 | REST handler POST X  | C2, C3     | pending  | —     |

## Chunk <ID> — <name>

### intent
<1–3 sentences. What this chunk delivers, why it exists.>

### working_dir
<absolute path — usually matches Meta.working_dir; may differ for multi-service features>

### files
- <relative path to working_dir>: <one-line purpose>
- <relative path>: <one-line purpose>

### interfaces
<List of interfaces this chunk introduces or consumes, formatted as:
- <InterfaceName> in <package path>:
  - <method signature>
  - <method signature>
Use "—" if the chunk is a pure entity / no interfaces.>

### edge_cases
- <input condition>: <expected behavior>
- <input condition>: <expected behavior>

### dependencies
- <package or port name>: <how this chunk depends on it>

### notes
<Free-form constraints: perf budgets, no-go APIs, transactional requirements, etc.
Empty by default.>

### status
- implement: pending | done | failed
```

## Field-by-field meaning

### Meta

- **`slug`** — kebab-case feature identifier; matches the directory name under `feature-plans/`.
- **`size`** — `small` (single chunk, no architectural variants explored) or `big` (multi-chunk, three variants discussed).
- **`status`** — `in-progress` while chunks are running, `done` when every chunk's status is `done`.
- **`working_dir`** — default working directory for chunks. Each chunk's section may override.
- **`bootstrap_services`** — list of new Go service names that don't yet exist and must be scaffolded before any chunk runs. `[]` means the feature only extends existing services.
- **`prd`** — relative path to the PRD.md file, always `./PRD.md`.

### Chunks table

- **`ID`** — `C1`, `C2`, … in declaration order. Stable for the lifetime of the spec.
- **`Name`** — short human label (matches the `## Chunk <ID> — <name>` heading).
- **`Depends on`** — comma-separated chunk IDs that must finish before this chunk can start. `—` if independent.
- **`Status`** — `pending` → `in-progress` → `done` (or → `failed`).
- **`Owner`** — identifier of whoever is currently running this chunk, empty otherwise.

### Per-chunk section

Every chunk in the Chunks table has a `## Chunk <ID> — <name>` section with these fields:

- **`intent`** — what this chunk delivers, in 1–3 sentences.
- **`working_dir`** — absolute path; usually mirrors Meta.working_dir.
- **`files`** — explicit list of files this chunk creates or modifies. Each entry has a one-line purpose.
- **`interfaces`** — interfaces this chunk defines or consumes. Each interface lists its package path and method signatures.
- **`edge_cases`** — cases that the tests must cover (happy / edge / error). Each entry: input condition + expected behavior.
- **`dependencies`** — other packages or port interfaces this chunk uses.
- **`notes`** — non-functional constraints (perf, security, transactional invariants). Optional.
- **`status`** — `implement` field tracks the chunk's overall lifecycle.

## Invariants

1. **One file per feature.** No `spec-v2.md`, no `spec.draft.md`. Edit `spec.md` in place.
2. **Section headings are stable.** Use `## Meta`, `## Architecture`, `## Chunks`, `## Chunk <ID> — <name>`. Do not rename.
3. **Chunk IDs are stable for the lifetime of the spec.** Once `C3` is assigned, that ID never points to anything else.
4. **The Chunks table is the index of truth.** Every `## Chunk <ID>` section has a matching row; every row has a section.
5. **Status fields advance monotonically:** `pending` → `in-progress` → `done` (or → `failed`, which is terminal until manual reset).
6. **Per-chunk sections are scoped state.** When the file is updated concurrently (e.g. parallel work on independent chunks), each writer edits only its own chunk's section and its own row of the Chunks table. No writer touches other chunks.
7. **Per-chunk fields are complete.** Every field of every chunk is filled when the spec is handed off for implementation. No placeholders, no "to be filled later".

## Detecting "all chunks done"

Parse the Chunks table. Every row's Status column must equal `done`. When that holds, set Meta.status to `done`.

## Finding chunks ready to run

Parse the Chunks table. Select rows whose Status is `pending` AND whose `Depends on` chunks are all already `done`. Those are the next batch.

## Example — minimal small-feature spec

```markdown
# Add CanonizePerfumeName helper — Spec

## Meta
- slug: canonize-perfume-name-helper
- size: small
- created: 2026-05-24T11:00:00Z
- status: in-progress
- working_dir: ~/code/backend/services/perfumist
- bootstrap_services: []
- prd: ./PRD.md

## Architecture
Single helper function in `internal/utils/canonization`. Pure, no I/O. Lowercase + trim + collapse whitespace.

Why this approach: the PRD's "Success criteria" item 1 requires deterministic normalization with no external state — a pure helper meets this with the smallest possible surface.

## Chunks

| ID | Name                  | Depends on | Status   | Owner |
| -- | --------------------- | ---------- | -------- | ----- |
| C1 | CanonizePerfumeName   | —          | pending  | —     |

## Chunk C1 — CanonizePerfumeName

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
