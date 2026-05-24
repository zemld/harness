---
name: feature-architect
description: Design the architecture of a Go feature from a PRD and produce a complete `spec.md` — architecture overview, chunk decomposition, and per-chunk design with `intent`/`working_dir`/`files`/`interfaces`/`edge_cases`/`dependencies`/`notes` all filled. Use when the user asks to "design the architecture", "split this into chunks", "напиши спеку фичи", "сделай дизайн фичи", or when a PRD exists and the next step is engineering design. Do NOT use for gathering product requirements (that belongs in the PRD step that runs before this), or for writing code.
---

Turn a finished PRD into a complete `spec.md`. Make every architectural trade-off explicit, decompose the feature into chunks that can be implemented and tested in isolation, and fill each chunk's section with everything an implementer needs to write code without further design decisions — no lazy placeholders, no follow-up design step.

## Inputs

All four are mandatory. If anything is missing, stop and report.

Path inputs may be absolute or relative to the current working directory — the architect does not interpret them, only passes them to file reads.

- **`prd_path`** — path to `PRD.md`. The architect reads this first.
- **`feature_dir`** — path to the per-feature directory the caller has already created. `spec.md` will be written here as a sibling of `PRD.md`.
- **`size`** — `small` or `big`. Determines chunk count: `small` produces a single-chunk spec, `big` produces multiple chunks with a dependency graph. Does not change the design process.
- **`working_dir`** — path to the Go service repo root the feature targets. For multi-service features, this is the primary service; individual chunks may override.

## Output

A single file written to `<feature_dir>/spec.md`.

The format is fixed. Read the schema before writing Phase 5 — section names, the Chunks table, and per-chunk field shape must match exactly so downstream consumers can parse them. The schema lives at `docs/feature-plans/spec-schema.md` relative to the harness repo root.

## Language

Skill instructions are in English. **Respond in the user's language** during clarifying questions and design discussion. Headings in `spec.md` stay in English (downstream consumers key off them).

## Phase 1: Context gathering

Silent — do not narrate tool calls.

1. **Read `PRD.md` in full.** This is the primary source of truth for intent, constraints, and success criteria.
2. **Skim the target codebase.** Look at `working_dir`'s top-level layout, the manifest (`go.mod`), and the directories the feature most likely touches (`internal/services/`, `internal/adapters/`, `internal/domain/`).
3. **Note the existing patterns.** Repository layout (one operation per file, `service.go` shape), interface segregation (`ports/`), naming conventions, where tests live.

Keep this to a handful of file reads. Enough to understand the shape — not a full audit.

## Phase 2: Clarifying questions (only if PRD left gaps)

The PRD should already resolve most architectural unknowns. Ask only when:

- A required architectural decision has no PRD signal (e.g. PRD doesn't say whether the feature is sync or async, but it materially changes the design).
- An "Open question" in the PRD is one you cannot proceed without.

Ask **at most 3 questions in one batch**. If you find yourself wanting to ask more, the PRD is incomplete — surface that to the caller rather than running a deep interview on your own.

Skip this phase entirely if the PRD is sufficient.

## Phase 3: Design proposal

Propose a single concrete design that satisfies the PRD's constraints and fits the codebase patterns observed in Phase 1. The design must include:

```markdown
### <design name>

**How it works:**
<2–4 paragraphs: components, where they live, how they interact, data flow.>

**Interaction diagram:**

```mermaid
<sequence or flowchart — whichever shows the interaction best>
```

**Why this approach:**
<1–2 sentences referencing the specific PRD items that drove the choice — constraints, success criteria, non-functional requirements, out-of-scope boundaries.>
```

Do not present multiple "options" or "variants" by default. The PRD already narrowed the design space; your job is to pick the most direct path through it and justify it concretely.

### When to offer an alternative

Present an alternative only when there is a **genuine, unresolved fork** — usually because the PRD did not commit on a dimension that materially changes the design (e.g. sync vs async pipeline, separate service vs in-process module, shared DB vs dedicated store). In that case, present the two paths with concrete trade-offs and ask the user to pick:

```markdown
**Open trade-off:** <one-line description of the fork>

**Path A: <name>** — <one-line description>
- ✓ <concrete pro tied to a PRD item>
- ✗ <honest con>

**Path B: <name>** — <one-line description>
- ✓ <concrete pro tied to a PRD item>
- ✗ <honest con>
```

If you can resolve the fork yourself by re-reading the PRD or the codebase, do that instead of asking. Alternatives exist for genuine forks, not for showmanship.

### Quality bar

- **Concrete.** Components named, data flows shown, state ownership clear. No labelled boxes floating in space.
- **Justified.** Every architectural choice traces to a PRD item. "Why this approach" must reference specifics, not platitudes.
- **Honest about open ends.** If something is genuinely undecided, surface it as an open trade-off rather than papering over it.

## Phase 4: Discussion and convergence

Invite reaction. Expect:

- Accept and refine details.
- Push back on a specific choice — adjust it.
- Surface a concern that affects the design — iterate.
- Pick between alternatives (if you offered any in Phase 3).

Iterate until the user is confident. Before Phase 5, confirm: *"So we're going with <approach>. I'll write `spec.md` now."* Wait for yes.

## Phase 5: Writing `spec.md`

The file must match `docs/feature-plans/spec-schema.md` exactly. Read that schema before writing if you haven't already.

### What to write

1. **`## Meta`** — `slug` (derive from the basename of `feature_dir`), `size`, current timestamp, `status: in-progress`, `working_dir`, `bootstrap_services`, `prd: ./PRD.md`. See "Detecting new services" below.
2. **`## Architecture`** — 1–2 paragraphs of the chosen approach, the mermaid diagram, and a single line `Why this approach: <reference to PRD constraints>`.
3. **`## Chunks`** — the dependency table, all `pending`, no owners.
4. **`## Chunk <ID> — <name>`** for every row — every field filled at a **descriptive** level (not code level):
   - `### intent` (1–3 sentences — what this chunk delivers)
   - `### working_dir` (path)
   - `### files` (every file the chunk creates or modifies, with one-line purpose)
   - `### interfaces` (each interface: name, package, list of methods by name + one-line purpose — no Go signatures)
   - `### edge_cases` (input condition + expected behavior — happy / edge / error)
   - `### dependencies` (other packages or ports this chunk consumes)
   - `### notes` (perf / security / transactional constraints — or empty)
   - `### status` block initialized to `implement: pending`

**Level of detail.** The spec describes **what** each chunk does and **what shape** its API has, not **how** it's written in Go. Exact method signatures, struct field types, error types — all that is the implementer's responsibility, derived from the intent and edge cases. The architect's job is to leave no ambiguity about behavior, files, and component boundaries; the implementer's job is to choose the Go-level surface that satisfies the spec.

**Do not leave any placeholder.** If you cannot describe a field at the descriptive level above, the chunk is not ready — split it further or surface the gap to the user.

### Detecting new services (`bootstrap_services`)

A new service is needed when the architecture introduces a component that doesn't yet exist as a Go service under `working_dir`'s parent directory:

- If yes: set `working_dir` in Meta to the **future** path of the primary new service, and list new service names in `bootstrap_services`. Scaffolding will happen later, before any chunk runs — declaring the names here is enough.
- If no: set `bootstrap_services: []`.

Do **not** scaffold yourself. Your job is only to declare the need.

When chunks reference files inside a service that's still in `bootstrap_services`, use the standard layout (`internal/domain/`, `internal/services/<svc>/`, `internal/adapters/...`, `cmd/main.go`). The scaffolding step that runs before chunks will produce this structure deterministically, so those paths will exist by the time chunks run.

### Decomposing into chunks

A chunk is a unit of work that can be implemented and tested in isolation once its dependencies are done. Good chunks:

- **Map to layers or components, not phases.** `C1: domain types`, `C2: service.SaveX`, `C3: repository.SaveX`, `C4: REST handler` — not `C1: design`, `C2: code`, `C3: tests`.
- **Are independent where possible.** Two chunks sharing no files and no in-flight types get no edge between them — downstream consumers can run independent chunks in parallel.
- **Have a clear handoff.** `C2 depends on C1` means C2 imports or consumes types introduced by C1. Coincidental package sharing is not a dependency.
- **Are small enough to verify.** One or two new files plus minimal edits per chunk. If a chunk needs ten files, split it.

### Per-chunk fields — quality bar

- **`intent`** — answers "what does this chunk deliver, and why" in 1–3 sentences. Source of truth for `verify-logic` later.
- **`files`** — every file, with one-line purpose. No "and other files" — be exhaustive.
- **`interfaces`** — for each interface: name, package path, full method signatures. If the chunk consumes an interface from another chunk, list it here too with a note like "consumed from C1".
- **`edge_cases`** — at least 3 cases when the chunk has non-trivial logic: happy path, one edge, one error. The tests will be derived from this list.
- **`dependencies`** — packages or ports this chunk imports from. Helps the implementer wire imports without re-reading the whole codebase.
- **`notes`** — only fill when there's a real constraint (perf budget, transactional invariant, no-go API). Empty otherwise — don't pad.

### Small-feature shortcut

For `size: small`, skip Phase 3 (three variants) entirely. The Chunks table has one row; the Architecture section is a paragraph; the single chunk's section is filled fully like any other.

### Handoff

After writing `spec.md`, do not invoke any other skill. Return control to whoever called you. If invoked directly by a human, tell them:

> `spec.md` is ready at `<feature_dir>/spec.md`. Each chunk is now ready to be implemented from its section in the file.

## Anti-patterns

- **Skipping the PRD read.** The PRD is not optional context — every architectural decision must be justifiable against it.
- **Leaving placeholders in chunk sections.** Every field of every chunk must be filled before you hand off. There is no later step that completes the design. If you cannot fill a field, you are not done — split the chunk or surface the gap.
- **Running a deep interview in Phase 2.** That phase is for narrow gap-filling, not a second discovery round. If the PRD is too thin, escalate.
- **Pasting all three variants in Architecture.** Only the chosen one goes in. Rejected variants live in conversation context.
- **Faking parallel chunks.** Only declare independence (no dep edge) when it's true. False parallelism breaks the workflow's wave logic.
- **Re-running yourself.** If the user wants a fundamentally different design after you've written `spec.md`, that's a re-architect, not a tweak — escalate, don't quietly rewrite.
