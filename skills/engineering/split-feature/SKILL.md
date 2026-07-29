---
name: split-feature
description: Splits a feature into independent tracks and writes them to one TRACKS.md file.
allowed-tools: Write(.features/**)
disable-model-invocation: true
---

Cut the feature into independent tracks and write them to one file.

## Step 1 — Cut

A track delivers an outcome observable from outside the system. A layer — domain, transport, storage — is not a track. A cross-cutting requirement — audit, error format, tenancy — is not a track either; it is an invariant every track obeys.

Default to one track. Cut only where the pieces carry different decisions: pieces settled by the same decisions are one track, however many verbs or endpoints they span.

Test every cut you do make: what a track takes from its neighbour must fit in one line — a data shape or a call signature, plus the invariant the neighbour may rely on. A cut that needs more than that line exposes a neighbour's internals. Cut again.

List only the invariants the feature statement itself carries. Never add one of your own — an invented invariant binds every track to a requirement nobody asked for.

Completion: every cut is forced by differing decisions, every track passes the one-line test, and every invariant traces back to the feature statement.

## Step 2 — Write

Write `<working_dir>/.features/<feature-slug>/TRACKS.md`, creating the directory if needed. `working_dir` is the project root (default `cwd`); `feature-slug` is kebab-case from the feature description. Use this shape:

```markdown
# <Feature name>

## Goal
<One or two sentences: what the feature delivers from outside.>

## Invariants
- <Cross-cutting requirement, one line. Omit this section when there are none.>

## Tracks
- **<track-slug>** — <what this track delivers, one line>
```

List a track that consumes another track's contract after the track providing it — the list order is the order to design them in.

Completion: the file is written, every track is one line, and no provider is listed after its consumer.
