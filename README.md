# Harness

## Current skills

The active catalog mirrors the personal skills installed in Codex as of
2026-10-03: `implement-spec`, `create-spec`, `analyze-review-issues`,
`test-feature`, `refactor-project`, `upsert-skill`, `grill-me`, `handoff`, and
`create-slides`. Their prompts, references, assets, and Codex metadata are
preserved from that installation, with `/skill` references retained in the
repository for provider-specific installation; system skills and SkillStore
are outside this repository's catalog.

`implement-spec` runs `code-writer`, two independent `reviewer` agents, and
`arbiter` in a repair loop before creating a PR. It does not launch `tester`;
that profile remains available for separate testing with its existing settings.
The three workflow agent profiles mirror the installed presets and use
`gpt-6.1-sol` with medium reasoning effort.

Skills absent from the personal Codex installation are archived under
`skills/deprecated/` and excluded from both installers. This includes
`implement-feature`, `review-changes`, `read-docs`, `split-feature`, and
`grill`. The earlier archived version of `implement-feature` was removed.

The imported prompts still contain legacy references to `/grill` and
`/read-docs`, and `grill-me` still declares `requires: [grill]`, although it
now embeds the grilling instructions. These references are preserved from
the installed versions; installing the active catalog does not install the
archived skills. The archived coding conventions remain with `read-docs`.

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
