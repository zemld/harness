# Harness

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
