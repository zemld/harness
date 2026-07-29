---
name: create-spec
description: Captures the design settled in this session into one spec file.
allowed-tools: Read(references/**), Write(.features/**)
disable-model-invocation: true
---

Capture what this session settled into one spec file.
Read `references/spec-schema.md` for the sections and what belongs in each.

## Step 1 — Settle

Fill every section only from what this session settled. Never infer material now to complete a section — the spec is the only carrier of this design into a clean implementation session, and an invented acceptance criterion reads exactly like a real one.

Completion: every section the schema names carries settled material, or you have stopped and named each unsettled section instead of writing the file.

## Step 2 — Write

Write `<working_dir>/.features/<feature-slug>/<spec-slug>.md`, creating the directory if needed. `working_dir` is the project root (default `cwd`). `feature-slug` is kebab-case for the whole feature; `spec-slug` is kebab-case for what this spec covers, and equals `feature-slug` when the feature was never split.

Completion: the file is written and its shape is exactly the one in `references/spec-schema.md`.
