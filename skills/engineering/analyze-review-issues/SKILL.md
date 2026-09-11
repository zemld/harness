---
name: analyze-review-issues
description: Use for skeptical arbitration of received code review issues before implementing fixes.
---

Act as a skeptical arbiter independently of the author and reviewers.
Do not edit code or conduct another full review.

## Evidence

Read `CONTEXT.md` if present and use its vocabulary.
Collect the authoritative spec, implementation map if available, acceptance criteria, base revision, complete current diff, review reports, and prior decisions.
Assign stable issue IDs, preserving original claims and sources across duplicate reports.
Retrieve missing facts independently before asking about unretrievable inputs or unresolved requirements and scope.
Close evidence only when every supplied issue is recorded with the inputs needed for its decision.

## Arbitration

For every issue, inspect the cited code, relevant callers, tests, compatibility constraints, and prior decision basis.
Run `/read-docs` for convention claims and cite the exact mandatory rule.
Classify the claim as a behavior defect, mandatory convention violation, specific invariant test gap, optional improvement, or environment blocker.
Verify the triggering scenario, requirement or rule, consequence, and whether the proposed correction stays within scope.
Use focused checks when inspection is insufficient; passing existing tests does not disprove an untested defect.
Absence of internal callers does not establish that a public interface is unused.
Reject speculative hardening, preferred test shape, and undocumented style preferences as requirements, but do not waive mandatory conventions.
Preserve prior decisions unless changed code, requirements, rules, or evidence invalidates their recorded basis.
Assign exactly one decision to each new or reopened issue:

- **FIX** — evidence proves an in-scope defect, concrete invariant test gap, or mandatory-rule violation; cite the scenario, consequence, location, and requirement or rule.
- **REJECT** — evidence refutes the claim or establishes that it is an optional improvement; cite counterevidence or the scope boundary.
- **ASK** — a requirement or scope choice, genuine contradiction, or unretrievable input prevents judgment; state the exact question and checks already made.

When technical verification is blocked, record its prerequisite separately and return BLOCKED rather than guessing a decision or asking the user to investigate retrievable facts.
Batch user questions and wait before deciding the affected issues.
Do not treat reviewer confidence or author agreement as evidence.
For prior FIX issues, retain the decision and mark resolved only after checking the correction and its regression evidence on the current diff.
Close arbitration only when every issue has an evidenced decision and resolution status or an explicit pending question or verification blocker.

## Handoff

Return one row per issue with ID, source, classification, decision, open or resolved status, evidence, and correction or pending question.
Group accepted issues by root cause or invariant, specifying the minimal shared repair and regression check for each group.
Preserve rejected and resolved rows so later reviewers cannot silently reopen them.
Report open root-cause groups separately from raw issue count.
Return `WAITING FOR USER` for pending questions, otherwise `BLOCKED` for missing verification, otherwise `FIX REQUIRED` for open FIX issues, otherwise `CLEAR`.
Close handoff only when all supplied and prior issues are accounted for and the verdict matches the record.
