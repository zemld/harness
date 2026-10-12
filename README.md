# Harness

## Current skills

The active catalog mirrors the personal harness skills installed in Codex as
of 2026-10-12: `implement-spec`, `create-spec`, `analyze-review-issues`,
`test-feature`, `refactor-project`, `tdd`, `upsert-skill`, `grill-me`,
`handoff`, and `create-slides`. Prompts, references, assets, and Codex metadata
are preserved, with `/skill` references retained in the repository for
provider-specific installation. External skills (`pr`, `retro`, and
`codebase-design`), system skills, SkillStore, and plugin-managed skills are
outside this repository's catalog; editor backups and filesystem metadata
are excluded.

`create-spec` publishes the design settled in the session to the project's
issue tracker using a template with required technical design. `tdd` defines
the red → green loop at seams agreed with the user.

`implement-spec` runs `code-writer`, two independent `reviewer` agents, and
`arbiter` in a repair loop before creating a PR with the externally installed
`pr` skill; install that dependency separately.
`code-writer` loads the installed `tdd` skill without relying on a personal
absolute path. `reviewer` reads the project's `CODING_STANDARDS.md` if present.
The workflow does not launch `tester`; that profile remains available for
separate testing. All four Codex profiles use `gpt-6.1-sol` with medium
reasoning effort. Delta profiles carry the same updated instructions while
retaining their existing model choices and shared worktree settings.

Skills absent from the personal Codex installation are archived under
`skills/deprecated/` and excluded from both installers. This includes
`implement-feature`, `review-changes`, `read-docs`, `split-feature`, and
`grill`. The archived coding conventions remain with `read-docs`.

The imported prompts still reference `/grill` and `/read-docs`, and
`grill-me` still declares `requires: [grill]`, although it embeds the
grilling instructions. These dependencies are preserved
from the installed versions; installing the active catalog does not supply
them. Existing prompts are synchronized rather than redesigned.

## Installation

```
npx github:zemld/harness add
```

Select skills for any supported provider and custom agents for Codex and Delta.
Project scope installs Codex skills under `.codex/skills/` and agents under
`.codex/agents/`; global scope uses `~/.codex/skills/` and `~/.codex/agents/`.
Delta profiles are always installed to Delta's machine-local
`profiles/` directory, regardless of skill scope. The installer previews new
and replaced destinations before writing; use `--dry-run` to preview without
installing.

## Delta subagent profiles

The Delta equivalents of the Codex agents are in `agents/delta/`. Select Delta
in `add` to install its skills and optionally its subagents. Project skills go
under `.delta/skills/` (a Delta-specific override), and global skills under
`~/.agents/skills/`. Delta keeps profiles in its machine-local configuration
directory, not in the project's `.delta/` directory; `DELTA_CONFIG_DIR` can
change that location. The default macOS destination is
`~/Library/Application Support/delta/profiles/`; for a development build,
set `DELTA_CONFIG_DIR` to its `delta-dev` configuration directory. Global Codex
and Delta skills can be installed together because they use separate directories.
Existing Codex skills in `.agents/skills/` are not moved or removed automatically.
Re-running `add` overwrites selected Delta profile files, including model choices
changed locally in Delta's settings; check the preview before confirming.

All four profiles use a shared worktree, so wait for `code-writer` to finish
before starting review and testing. The `reviewer` file extends Delta's built-in
reviewer; the other three files define custom profiles. They pin ChatGPT
subscription models via `[model.any]`; users without access to those models
must change the model selections in their local profile files. Instructions
not to edit code are behavioral rules, not enforced read-only permissions.
