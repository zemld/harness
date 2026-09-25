---
name: analyze-review-issues
description: Use for skeptical arbitration of received code review issues before implementing fixes.
---

Read `CONTEXT.md` if present and use its vocabulary in the decision record.
Collect the authoritative spec locator and revision or digest, pinned base, complete review reports, and prior decisions.
Send those locators and every reported issue to a skeptical independent arbiter; use the configured `arbiter` when available.
Require the arbiter to read the sources and current diff itself and return one evidenced FIX, REJECT, or ASK decision per issue, preserving stable IDs and prior decisions unless evidence changed.
Require root-cause groups for open fixes, separate technical blockers and user questions, and a verdict of `WAITING FOR USER`, `BLOCKED`, `FIX REQUIRED`, or `CLEAR`.
Ask about unresolved requirements or scope only after the arbiter has attempted to retrieve the spec, reports, prior decisions, and relevant code and has named any unavailable source.
Return the decision record and verdict only when every supplied and prior issue is accounted for.
