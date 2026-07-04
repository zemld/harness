---
name: write-prd
description: Designs a feature. Writes a PRD file.
allowed-tools: Read(references/**), Write(.features/**)
disable-model-invocation: true

---

Capture the design of a feature into one PRD file.
Read `references/prd-schema.md` to know what you need to write.

## Step 1 — Synthesize

Synthesize the PRD from what the user already said plus a quick code read. If needed, run a `/grill` session.
Completion: every section the schema names is accounted for.

## Step 2 — Write

Write the file to `<working_dir>/.features/<feature-slug>/PRD.md`, creating the directory if needed. `working_dir` is the project root (default `cwd`); `feature-slug` is kebab-case from the description only.
Completion: the file is written and it's format is exactly as specified in `references/prd-schema.md`.
