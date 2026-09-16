---
name: implement-feature
description: Implements one spec in stable batches, reviews and acceptance-tests it, then publishes the resulting changes as a pull request.
disable-model-invocation: true
---

## Fit

Read the supplied spec and `CONTEXT.md` if present, using its vocabulary for naming.
Run `/read-docs` for the project stack before editing.
Trace the affected entry points, services, ports, adapters, consumers, and nearest reusable implementations.
Build a compact implementation map referencing the spec revision, parent requirements applicable to this task, approved clarifications, and explicit non-goals.
For every in-scope requirement, record the owning layer, reused components, minimal additions, affected consumers, invariants, and acceptance method.
Justify each new entity, queue, or lifecycle against a requirement and an inspected existing pattern.
Keep business requirements in the spec; the map indexes their implementation and verification rather than becoming another spec.
Retrieve missing facts independently and ask the user only about unresolved requirements, scope, or contradictory decisions.
Identify the documented build, codegen, formatting, static-check, full-test, and acceptance commands.
Identify the intended integration branch and ensure the work is on a publishable non-default branch without discarding unrelated user changes.
Check prerequisites and acceptance feasibility before implementation, including transport availability, environment access, remote authentication, and pull-request tooling.
A foundation task may use integration acceptance instead of live API acceptance only when the agreed criteria explicitly allow it.
Close fit only when every requirement has an implementation and verification mapping and no unresolved prerequisite blocks that plan.

## Batch implementation and checks

Complete one implementation batch, including its interfaces, models, behavior tests, implementation, and required infrastructure.
Do not trigger full tests merely because a file changed or an implementation stage ended.
On the completed batch, run required codegen, formatting, and static checks before the project's required full test command.
Do not substitute targeted tests for a mandatory full suite without explicit user authorization.
Repair failures as a batch and repeat the affected checks before review, without weakening correct expectations.
Record commands, verdict-bearing output, diff identity, and relevant environment identity for each check.
Close the batch only when required checks pass on its stable diff and every new behavior has its required tests.
For a blocked check, record the failing command and evidence distinguishing code failure from an environment blocker.
Do not repeat an identical blocked command without changed conditions; report the blocker without claiming the gate passed.

## Review and repair

Run `/review-changes` in a separate subagent with the source spec, implementation map, base revision, complete current diff, and check evidence.
For later rounds, also supply the previous reviewed diff, coverage ledger, reports, and arbitration record for incremental review.
After all requested reviews return, spawn a fresh independent `/analyze-review-issues` subagent with the same context and complete issue history.
Retain its stable issue decisions and root-cause groups across rounds, resolving `WAITING FOR USER` before review-driven edits.
Apply all accepted fixes as one batch, with a regression check for each root-cause group.
After that batch, return to batch checks and review rather than restarting fit unless requirements or architectural assumptions changed.
Track open root-cause groups after arbitration in each round.
After two consecutive repair rounds without reducing their count, pause automatic edits and diagnose the repeated cause before recording a revised repair plan.
This pause never dismisses unresolved defects; ask the user only if the revised plan requires a scope or requirements decision.
Close review only when coverage is complete and arbitration is `CLEAR` on the current diff.

## Acceptance

After review closes, run `/test-feature` for all in-scope real-API criteria and run the mapped checks for other agreed acceptance criteria.
Repair acceptance failures as a batch and return through checks and review.
Reuse passing check evidence only while its diff, requirements, and relevant environment remain unchanged.
Do not rerun full tests solely because a read-only review finished.

## Pull request publication

Treat explicit invocation of this skill as authorization to commit the in-scope changes, push the implementation branch, and create or update its pull request.
Do not wait for a separate request to create the pull request.
Follow the repository's documented branch, commit, push, and pull-request workflow, and never merge the pull request.
Inspect the current branch for an existing pull request before publishing and update it instead of creating a duplicate.
Commit only the in-scope files, push the branch, and create or update a pull request against the intended integration branch.
When all required gates pass, publish a ready-for-review pull request.
If a meaningful in-scope diff remains but a required check or acceptance criterion is still failing or blocked after the required repair attempts, publish or update a draft pull request and state the exact failure, evidence, and unverified criteria.
Do not use draft status to bypass a repairable failure.
Include the implementation summary, verification commands and verdicts, and every remaining blocker in the pull-request body.
Read the published pull request back and verify its URL, base and head branches, draft state, head commit, changed-file set, and reported checks against the final local diff.
Close publication only when the pull request exists and its remote head contains the final local diff.
If there is no meaningful diff, or authentication, push, or pull-request creation is unavailable, return BLOCKED with the failing command and evidence instead of claiming publication.

## Completion

Report changed files, commands and verdicts, the final diff identity, every unverified criterion, and the pull-request URL, state, and head commit.
Return PASS only when fit, batch checks, review, and all in-scope acceptance criteria pass for the final unchanged diff and its ready-for-review pull request is verified.
A local diff, commit, pushed branch, or statement that the work is ready for a pull request is not completion.
Otherwise return FAIL or BLOCKED with the remaining defects or evidenced prerequisites and the draft pull-request URL when one was published; arbitration cannot waive those gates.
