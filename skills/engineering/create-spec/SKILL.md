---
name: create-spec
description: Captures the design settled in this session into a specification in the project issue tracker.
disable-model-invocation: true
---

## Process

1. Read the project GLOSSARY.md and use its vocabulary. Collect the material settled in this session and codebase. Never infer missing behavior, constraints, rationale, or technical design.
2. Write and publish spec using template below.

<spec-template>

## Problem

The problem and who encounters it.

## User stories

A numbered list in the form "As an <actor>, I want <capability>, so that <benefit>".

## Decisions

What was chosen and why, including constraints and trade-offs discussed in this session.

## Acceptance criteria

Externally observable outcomes: what to do and what to see.

## Technical design

Required: the agreed implementation structure, including applicable data models, components, contracts, and flows.
Describe the resulting structure without repeating the decisions and their rationale.
Use Mermaid diagrams when they clarify interactions or flows.

## Non-functional requirements

Optional: agreed performance, size, rate, compatibility, and security constraints.

## Out of scope

Explicitly agreed exclusions from this spec.

</spec-template>
