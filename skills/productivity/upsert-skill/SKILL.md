---
name: upsert-skill
description: Creates a new skill or refactors an existing one.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Bash, Agent
---

Read `references/authoring-rules.md` before writing anything — it is the full rule set and the grading rubric.

Pick the path: a described new behavior with no existing file → CREATE; a named existing SKILL.md → REFACTOR.

## CREATE

1. Run the `/grill` skill to nail down: what the skill does, its distinct triggers, the ordered steps, model- vs user-invoked, and each step's completion criterion. Do not draft until grilling reaches shared understanding.
2. Write `skills/<category>/<name>/SKILL.md` applying every rule in `references/authoring-rules.md`. Keep the body under 40 short sentences. Inline every-run content; push some-paths reference into a sibling `references/` file.

## REFACTOR

1. Read the target SKILL.md and every file under its `references/`.
2. Audit it rule-by-rule against `references/authoring-rules.md`. Fix mechanical violations directly (duplication, vague verbs, wrong invocation type, sprawl, weak completion criteria).
3. Run `/grill` only where a fix needs a judgement call about intent — changing triggers, scope, or invocation model. Otherwise skip the interview.

## VERIFY (both paths)

Spawn a subagent that reads ONLY the finished SKILL.md and its `references/`, and grades it against `references/authoring-rules.md`. The subagent returns one line of PASS/FAIL per numbered rule, plus the ≤40-sentence and English-only checks, each FAIL naming the exact line to fix. Apply every fix and re-spawn a fresh subagent until every line reads PASS.
