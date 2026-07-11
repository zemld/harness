---
name: read-docs
description: Retrieves this project's coding conventions for the stack you're working in — how it lays out services and folders, names things and styles code, structures tests, and which library to use for a concern. Use before writing, structuring, or reviewing code.
allowed-tools: Read(references/**)
---

A thin **router** to this project's coding conventions. The conventions live in `references/engineering/`; your job is to reach the exact doc the caller needs and read it — not to recall conventions from memory, and not to read more than the need requires.

## Step 1 — Locate the stack

Read `references/engineering/index.md`. Match the stack the caller is working in to a listed stack.

If the stack is not listed, tell the caller "no conventions exist for `<stack>`" and stop.

Done when you can name the stack's `index.md` path from the root index — or you have reported the stack isn't listed and stopped.

## Step 2 — Fetch only what's needed

Open that stack's `index.md`. Match the caller's topic to a section or sibling-doc entry, then read **only** the doc(s) that entry names. A narrow need (e.g. "which library") reads one doc; "refactor" or "scaffold" reads the set that section lists.

Done when the doc(s) matching the need are open and you are quoting them, not recalling from memory.
