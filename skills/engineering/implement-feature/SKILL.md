---
name: implement-feature
description: Implements one spec end to end — writes the code, reviews it, and verifies it against the spec's acceptance criteria.
requires: [read-docs, review-changes, test-feature]
disable-model-invocation: true
---

Implement the spec at the path you were given.

## Order

Work the stages in this order:

1. **Interfaces and models** — closed when the build passes.
2. **Tests** — closed when the new test goes red for the reason it is meant to catch.
3. **Implementation** — closed when that same test run is green.
4. **Infrastructure** — closed when the service starts.

A stage is closed only after you have run its command and shown the output; your own assessment closes nothing. Never open a stage while the one before it is unclosed. Show the lines of output that carry the verdict, not the whole log.

Skip a stage only when the spec requires nothing of it, and say which stage you skipped and why.

## Gates

Then spawn a `/review-changes` subagent over the changed files, giving it the spec as the intent.

Then run `/test-feature` against the spec's acceptance criteria.

Fix everything either gate reports, then run that same gate again.

## Completion

Every stage closed by shown output, `/review-changes` reports no issues, and `/test-feature` returns PASS on every acceptance criterion.
