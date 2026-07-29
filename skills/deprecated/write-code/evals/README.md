# `write-code` evals — light-weight manual workflow

Same philosophy as `write-prd/evals` — no benchmarks, no grader subagent. `write-code` absorbed seven
former skills (`write-interfaces`, `scaffold-stubs`, `write-tests`, `write-implementation`) so these
evals exist mainly to prove the **full write sequence** survives edits: contracts/types → test doubles →
cases (feature + unit) → tests-first → implementation → build/tests/format green, with the test-freeze
rule held.

## Layout

```
evals/
├── evals.json   # 3 positive prompts + 2 triggering negatives
└── README.md
```

## Fixtures

Unlike `write-prd`, `write-code` operates on a real project, so each positive eval needs a workspace under
`/tmp/write-code-eval/`. These are **not committed** (same as the `review-changes` workspace). Materialize
them before running:

- `/tmp/write-code-eval/go-billing` — a minimal Go service. Quickest path: run the `scaffold-project` skill
  for the `go` stack into that path, or copy an existing small service. It must contain a `CLAUDE.md` (or
  inherit the user-level one) that routes to `docs/engineering/go/`, plus the `Makefile` `format` target and
  `.golangci.yml` the Go docs require, so the skill can discover conventions and the build/test/format
  commands from the project itself.
- `/tmp/write-code-eval/frontend-shop` — a minimal frontend project, scaffolded the same way for the
  `frontend` stack, with `package.json` scripts (`test`, `typecheck`, `format`/`lint`) present.

Eval 3 (`fix-list-intent-on-existing-code`) reuses the `go-billing` workspace **after** eval 1 has run, so
there is existing code to fix.

## What the 5 evals check

| ID | Name                                   | What it probes |
|----|----------------------------------------|----------------|
| 1  | go-feature-full-sequence               | Triggers, reads Go docs first, writes in documented order, covers the case categories, drives to green, respects test-freeze, reports files. |
| 2  | frontend-feature-ordering              | Triggers, reads frontend docs, uses MSW (not mockery) for doubles, frontend style honored, drives tsc/vitest/biome to green. |
| 3  | fix-list-intent-on-existing-code       | Treats a `## Review found these` fix-list as spec: surveys named files, makes the precise fix + missing test, does not rebuild from scratch, distinguishes adding a test from editing a frozen one. |
| 4  | negative-pure-review-should-not-trigger | Stays silent on a read-only review request (that's `review-changes`). |
| 5  | negative-project-wide-refactor-…       | Stays silent on an audit-the-whole-project request (that's `refactor-project`). |

Evals 1–3 cover happy paths and the fix-list path; 4 and 5 are triggering negatives that keep `write-code`
from grabbing requests that belong to `review-changes` or `refactor-project`.

## Manual run — one eval at a time

1. Pick an eval from `evals.json`; materialize its workspace (see Fixtures).
2. Spawn a `general-purpose` subagent. Hand it the prompt verbatim and tell it the skill it has access to
   is the one at `skills/engineering/write-code/SKILL.md`. Example dispatcher prompt:

   ```
   Use the write-code skill at /Users/zemld/dev/projects/harness/skills/engineering/write-code/SKILL.md
   to handle this user request:

   "<prompt from evals.json>"

   Report which files you created/modified and whether build, tests, and format are clean.
   ```

3. Inspect the output against the eval's `expectations`. For positives, check the produced files and that
   build/tests/format are green. For negatives (4, 5), check that no files were written and write-code was
   not invoked.
4. If anything fails, edit `SKILL.md`, rerun the same eval. Iterate until the expectations hold.

## Updating the evals

- Keep `id` stable when editing; it anchors any future benchmark history.
- Add a new eval when a real prompt surfaces a behavior the set didn't catch — lift the prompt verbatim.
- The triggering negatives (4, 5) are precious — they keep the boundary with `review-changes` and
  `refactor-project` honest. Do not delete them.
