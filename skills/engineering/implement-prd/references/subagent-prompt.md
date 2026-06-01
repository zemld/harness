# Subagent prompt template

Every content-producing or verification subagent that `implement-prd` spawns receives a prompt built from this template. The orchestrator constructs each prompt by substituting three slots into the body below and dispatching the resulting text via `Agent` to the skill mapped to the current stage.

## Template

```
The intent and constraints for this work are in the markdown document below. Read it fully.

Ignore any section titled "Alternatives", "Rejected designs", "Open questions", or "Subtasks" — those record discarded paths or downstream decomposition, not work to do at this stage.

Treat any section titled "Out of scope" as boundary information: it describes what NOT to build. Read it, respect it, but do not implement it.

<PRD_BODY>

<STAGE_CARRY_OVER>

<TEST_FREEZE_RULE>
```

## Substitutions

- `<PRD_BODY>` — the full body of `prd_path`, verbatim. No summarization, no pre-extraction of structured fields.
- `<STAGE_CARRY_OVER>` — stage-specific context produced by the previous stage. Currently used for the cases table returned by `Analyze cases`: prepend it under a heading `## Cases table` to the prompts for the next stage (`Tests` for frontend, also `Tests` for Go). Empty for all other stages.
- `<TEST_FREEZE_RULE>` — the test-freeze rule copied verbatim from the loaded `## Implementation pipeline` section of the stack's index. Included only for prompts at or after the stack's Implementation stage. Empty for earlier stages.

The orchestrator builds the prompt by string substitution; the resulting text is the entire prompt sent to the subagent (any tool-invocation preamble the subagent needs is the responsibility of the skill it invokes, not of this orchestrator).
