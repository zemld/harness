# `decisions.md` schema — file format

## Contents
- Location
- File structure
- Field meanings
- What goes here, what does not
- Rules for using `decisions.md`
- Example

`decisions.md` is an append-only log of decisions that came up during the implementation of one subtask but that other subtasks need to know about. It is the bridge between sub-PRDs: without it, cross-subtask context dies inside whichever session produced it.

The file is **always appended manually by the user** — there is no automation that writes here in the MVP. The schema exists so the format stays consistent regardless of when entries get written.

## Location

`decisions.md` lives at:

```
<working_dir>/features/<feature-slug>/decisions.md
```

Sibling to `PRD.md` and `subtasks/`. The directory is checked into git; the file accumulates over the lifetime of the feature and is removed together with the rest of `features/<feature-slug>/` after merge.

## File structure

A header sentence, then one section per decision in order of insertion. New entries go at the end — never edit prior entries except to fix factual errors.

```markdown
# Decisions — <feature-slug>

Append-only log of cross-subtask decisions. Each entry follows the schema in
`skills/engineering/write-prd/references/decisions-schema.md`.

---

## <short decision title>
**Date:** YYYY-MM-DD
**Subtask:** <id of the subtask that introduced this decision>
**Decision:** <what was decided, 1–2 sentences>
**Why:** <the constraint, trade-off, or observation that drove the decision>
**Affects subtasks:** [<id>, <id>, ...] | all

---

## <next decision title>
**Date:** ...
...
```

The `---` horizontal rules are mandatory between entries — they make the file easy to scan and easy to grep.

## Field meanings

- **Title** — a short noun phrase summarising the decision. Used as the anchor that sub-PRDs cite in their `## Consumed decisions` section.
- **`Date`** — when the decision was made, in ISO date form. Useful for spotting stale decisions during long-running features.
- **`Subtask`** — the ID of the subtask whose implementation surfaced the decision. Anchors the decision to where it came from so future readers can chase the context.
- **`Decision`** — the actual conclusion, in 1–2 sentences. No prose, no padding.
- **`Why`** — the constraint or trade-off that justified the conclusion. Future sub-PRDs reading this entry need the reason, not just the outcome, so they can apply the same logic to adjacent cases.
- **`Affects subtasks`** — list of subtask IDs constrained by this decision, or `all` if every subtask in the feature should respect it. This is the search key: `write-prd` reads `decisions.md` and pulls only the entries that name the current subtask (or `all`).

## What goes here, what does not

**Add an entry when:**
- A subtask picked one approach where multiple were viable, and the rejected ones would have been reasonable choices for other subtasks.
- A subtask introduced a constraint another subtask cannot infer from the code alone (e.g. "all writes go through this transaction wrapper, even though nothing in the type system enforces it").
- A subtask resolved an open question from the parent PRD and the resolution shapes downstream work.

**Do not add an entry when:**
- The decision is visible in the diff (interface signatures, struct fields, package layout). Code is the source of truth; do not duplicate it here.
- The decision is local to one subtask and no later subtask will care.
- The decision is purely aesthetic.

The discipline is: *the absence of this entry would cause a future subtask to do the wrong thing*. If you cannot picture such a subtask, the entry does not belong here.

## Rules for using `decisions.md`

1. **Append only.** Old entries are facts about what was decided, not draft text. Do not edit history. Corrections go in a new entry that supersedes the old one (state the supersession explicitly).
2. **The user writes it, not an agent.** In the MVP, `write-prd` reads `decisions.md` to inform sub-PRDs; no skill writes here. The user appends entries after a subtask is implemented, when the cross-subtask insight is still fresh.
3. **Stay within the template.** Free-form decision logs degrade into noise. The five fields are the contract — fill all five every time, even if a field is `all` or `(none — the diff makes it obvious why)`.
4. **One file per feature.** No splitting into `decisions-v2.md` or topic-specific files. The single append-only stream is the point.

## Example

```markdown
# Decisions — perfume-similarity

Append-only log of cross-subtask decisions. Each entry follows the schema in
`skills/engineering/write-prd/references/decisions-schema.md`.

---

## Repository interface segmentation
**Date:** 2026-05-30
**Subtask:** 01
**Decision:** Each repository operation gets its own small interface in `ports/repository/`, named after the operation (e.g. `Saver`, `ByIDGetter`). An aggregating `Repository` interface embeds the small ones and is used only in `app.go`.
**Why:** Services depend only on the methods they actually call — this keeps mocks small and decouples unrelated changes. The aggregating interface preserves single-point DI without polluting downstream callers.
**Affects subtasks:** all

---

## Similarity score is non-symmetric
**Date:** 2026-05-30
**Subtask:** 02.01
**Decision:** `Score(A, B)` is allowed to differ from `Score(B, A)`. Callers that need a symmetric metric must average the two directions explicitly.
**Why:** Some perfume-attribute distances are inherently directional (e.g. base-note dominance). Forcing symmetry at this layer would lose signal.
**Affects subtasks:** [02.02, 03]
```
