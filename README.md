# Harness

## Installation

```
npx github:zemld/harness add
```

Select skills for any supported provider and custom agents for Codex. Choose
project scope to install Codex agents under `.codex/agents/`, or global scope to
install them under `~/.codex/agents/`. The installer previews new and replaced
destinations before writing; use `--dry-run` to preview without installing.

## Delta subagent profiles

The Delta equivalents of the Codex agents are in `agents/delta/`. To use them,
open **Settings > Subagents > Open in Zed** in Delta and copy the four TOML files
into that `profiles/` directory. The `add` installer does not install Delta
profiles. Delta keeps profiles in its machine-local configuration directory,
not in the project's `.delta/` directory; `DELTA_CONFIG_DIR` can change that
location.

All four profiles use a shared worktree, so wait for `code-writer` to finish
before starting review and testing. The `reviewer` file extends Delta's built-in
reviewer; the other three files define custom profiles. They pin ChatGPT
subscription models via `[model.any]`; users without access to those models
must change the model selections in their local profile files. Instructions
not to edit code are behavioral rules, not enforced read-only permissions.
