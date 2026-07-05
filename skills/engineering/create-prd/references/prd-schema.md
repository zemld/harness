# PRD Structure

A PRD (Product Requirements Document) answers three questions: **why** we are doing this, **what** exactly we are building, and **how** we will know it worked.

## Meta

- Author
- DateTime

## Overview

The essence of the feature in 2–3 paragraphs: what it is, who it's for, and why. Metadata: author, status, date, links to design and tech spec.

## Problem & Motivation

- What user problem we are solving (with evidence: analytics, interviews, support tickets)
- Why it matters to solve it now
- What happens if we do nothing

Frame the problem in the user's terms, not in terms of the solution.

## Goals & Success Metrics

- Goals: what we want to change in user behavior or business outcomes
- Metrics: measurable indicators with target values
- Counter-metrics: what must not get worse (guardrails)

## Non-goals (Out of Scope)

An explicit list of what the feature does **not** do. Protection against scope creep.

## Users & Personas

Target segments, roles, their context and level of expertise.

## User Scenarios

The core of the document.

- **User stories**: "As a [role], I want [action], so that [value]"
- **User flows** for each scenario:
  - Entry point and context
  - Happy path
  - Alternative paths
  - Edge cases and errors (empty states, invalid input, timeouts, missing permissions)
  - Exit point

For each scenario — frequency and priority (P0/P1/P2). Flow diagrams are helpful.

Optionally — Given/When/Then format for testability:

```
Given: the user is on the search page
When: they enter a query
Then: the system shows results with an auto-applied filter
```

## Functional Requirements

A numbered list (FR-1, FR-2...) of verifiable statements, grouped by scenario, with priorities.

## Non-functional Requirements

Performance, security, privacy, accessibility, localization, compatibility.

## Design & UX

Links to mockups (Figma), key interface states: empty, loading, error.

## Dependencies, Risks, Open Questions

- Dependencies on teams, APIs, infrastructure
- Risks with mitigation plans
- Open questions with owners

## Launch Plan (Optional)

Stages (MVP → v1), feature flags, A/B tests, rollout criteria, rollback plan.

---

## Principles

- **Size follows scope**: a one-pager is enough for a small feature
- **A PRD is not a tech spec**: it describes *what* and *why*, not *how* to implement
- **Scenarios matter more than requirements**: edge cases surface there first
