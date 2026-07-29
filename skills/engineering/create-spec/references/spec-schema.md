# Spec structure

A spec describes one thing to build: a whole feature, or one track of a feature
that was split. It records **what** is built and **what was decided**, never the
order in which to build it.

## Template

```markdown
# <Name>

## Meta

- Author
- Date

## Scope

What this spec covers, and — as its own short list — what sits next to it and is
explicitly out.

## Decisions

### Key

Decisions whose reversal drags other decisions in this spec with it, or changes
the contract this thing exposes to the outside. One entry each:

- **<Decision>** — what was chosen; why; what it cost.

### Rest

Every other decision taken, one line each: what was chosen. No rationale.

## Functional requirements

Numbered verifiable statements — FR-1, FR-2, … Each one is a claim that can be
checked against the built thing.

## Non-functional requirements

Only the binding ones: latency budget, size or rate limits, compatibility,
security constraints. Omit the section when nothing binds.

## Acceptance criteria

Outcomes observable from outside the system, one per line. These are read
directly by `/test-feature`, so each must name what to do and what to see.
```

## Rules

- **Key vs Rest**: a decision is Key only if reversing it forces other decisions
  here to change, or changes the contract exposed outside. A decision reversed by
  editing one place — a constant, a name, a log format — is Rest.
  Example: "sessions live in Redis, not Postgres" is Key; "session TTL is 15
  minutes" is Rest.
- Many Key decisions in one spec means the thing it covers is too big — split the
  feature into tracks before specifying it.
- Requirements state the outcome, not the implementation route to it.
