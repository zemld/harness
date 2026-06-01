# Final report template

`implement-prd` emits a single report when the pipeline ends — success, stop-on-failure, or pre-pipeline gap. The shape is fixed; the exact stage list comes from the stack's index, not from this template.

## Template

```
## implement-prd: <first line of the PRD's intent — top heading or first paragraph>

Pipeline: <stack pipeline label from the index, e.g. Go | Frontend>
Verdict: PASS | FAIL — <stage that stopped, if FAIL> | NOT STARTED — <reason, if pre-pipeline stop>

| # | Stage              | Status              | Notes |
|---|--------------------|---------------------|-------|
| <one row per stage that the stack's index lists, in order; status ∈ {✓, ✗, skipped, not-run} > |

Files created / modified:
- <one per line, aggregated from what each subagent reported>

Blocking issues (if FAIL):
- <one per line, with the failing subagent's output verbatim where useful>
```

## Conventions

- **Stage list**: comes from the `## Implementation pipeline` table of the stack's index, in the order the index lists. Never hardcoded here.
- **Pipeline label**: comes from the stack's index `Final report shape (pipeline label …)` line.
- **Status symbols**: `✓` success, `✗` failure, `skipped` conditional skip (precondition false), `not-run` reached only when an earlier stage stopped the pipeline.
- **Files list**: the orchestrator does not track a frozen scope; it just collects the file paths each subagent reports as touched and lists them deduplicated.
