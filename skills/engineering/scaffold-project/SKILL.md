---
name: scaffold-project
description: Scaffolds a new project for any stack the harness has docs for (Go service, frontend project, etc.). The skill body is a generic runner; the conventions a fresh project must satisfy live in `docs/engineering/<stack>/index.md` under the Scaffold section, and the implementation that produces those conventions ships as `scripts/<stack>/scaffold.py` next to this skill. Use this skill whenever the user wants to start a new project from scratch — Go service, backend microservice, frontend SPA, React project, web app, or any other supported stack. Trigger on phrases like "new Go service", "scaffold a service", "new frontend project", "scaffold a frontend", "create a microservice", "bootstrap a React project", "start a new web app", or any concrete description of starting a project that needs a skeleton, even if the word "scaffold" isn't used.
---

Scaffold a new project. Conventions per stack live in `docs/engineering/<stack>/index.md`; the runner that materializes them ships bundled with this skill.

## Inputs

Ask for any missing input:

- **`stack`** — name of the target stack (e.g. `go`, `frontend`). Must match a directory under `docs/engineering/<stack>/` that contains an `index.md`.
- **`name`** — project name in kebab-case.
- **`path`** — absolute path where the project must live after scaffolding.
- **Additional stack-specific inputs** — the runner for the stack declares its own CLI arguments. Read `scripts/<stack>/scaffold.py --help` (or the script's docstring) to learn what else to ask.

## Step 1 — Read the stack's Scaffold conventions

1. Verify `docs/engineering/<stack>/index.md` exists. If it doesn't, stop and report the gap — the stack is not supported.
2. Read its `## Scaffold project` section in full. It lists the sibling docs that govern the layout (`stack.md`, `project-structure.md`, `service-structure.md`, `dependencies.md`, `deploy.md` — whatever applies) and enumerates the conventions a fresh project must satisfy.
3. Read every doc the section lists. These are the source of truth — the runner is expected to produce exactly what they describe.

## Step 2 — Locate and run the stack's runner

The runner for stack `<stack>` is `skills/engineering/scaffold-project/scripts/<stack>/scaffold.py`. Locate it from the harness root.

If no runner exists for the requested stack, stop and report the gap — the stack has conventions documented but no implementation to materialize them yet.

Invoke the runner with the inputs gathered in step 0 plus any stack-specific arguments. Example:

```bash
python skills/engineering/scaffold-project/scripts/<stack>/scaffold.py \
  --name <name> \
  --out <path> \
  [stack-specific flags]
```

The runner prints every file it creates and a post-scaffold checklist.

If the runner fails (non-zero exit), stop and report its verbatim output. Do not partial-scaffold and continue — the user decides whether to clean up and retry.

## Step 3 — Walk the user through the post-scaffold checklist

The runner's output ends with a post-scaffold checklist (rename placeholder packages, wire DI, configure codegen scripts, add infra entries, etc.). The checklist mirrors the "post-scaffold hand-off conventions" the index documents — walk the user through the items.

## Anti-patterns

- **Hardcoding stack-specific knowledge in this skill body.** Conventions live in the stack's index; the runner that materializes them lives in `scripts/<stack>/`. This skill is a dispatcher.
- **Improvising the layout without reading the index.** The index is the contract — the runner is expected to satisfy it. If you skip reading the index, you can't verify the runner did the right thing.
- **Partial scaffolding on failure.** If the runner fails, stop. Do not push through to the next step.
