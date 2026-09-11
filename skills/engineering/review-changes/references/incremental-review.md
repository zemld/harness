# Incremental review boundaries

## Eligibility

Reuse requires the reviewed diff identity, requirement revisions, applicable conventions, coverage ledger, role reports, and arbitration decisions.
Missing evidence, a new base revision, or changed business scope, architectural ownership, or public contracts requires full review.

## Coverage and role selection

Incremental scope includes the delta, accepted fixes, and affected callers or dependencies; keep the complete diff available for context.
Map ledger rows by file and hunk content rather than line numbers, reusing only rows with unaffected code, requirements, rules, dependencies, and reasoning.
For each role, record a review assignment or prior evidence supporting reuse; uncertain impact requires inspection by that role.

## Reopened findings

Allow new findings in changed or newly affected behavior, including regressions from fixes.
Reopen resolved or rejected issues only with changed code, requirements, rules, or evidence invalidating their basis, never just a different reviewer's preference.
