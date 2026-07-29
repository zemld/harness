# Task file schema — format

## What a task is

One self-contained unit of work. An executor implements one task from its file
alone, in the order the set defines.

One file per task:

```
tasks/<order>-<slug>.md
```

`<order>` is the integer from the `order` field (zero-padded: `01`, `02`, …).
`<slug>` is kebab-case from the task name.

## Template

```markdown
# <Task name>

- PRD: <path to PRD file, from which tasks were created>
- order: <integer; lower runs first>
- depends-on: [<order>, ...]   # empty list [] if the task is independent

## What to do
<One paragraph. Concrete and actionable — an executor needs no context beyond
this to start.>

## Done when
<Checkable outcome(s). Not "it works" — a condition you can verify by code, test,
or observation.>
```

## Field meaning

- **order** — the execution position. Lower runs first. Tasks with the same
  prerequisites may share neighbouring orders; the integer is what names the file
  and sequences the work.
- **depends-on** — the orders this task cannot start before. `order` alone
  implies a sequence; `depends-on` makes a real dependency explicit when the
  sequence is otherwise ambiguous (e.g. two parallel tracks that converge).
- **What to do** — the action, in one paragraph. If it needs "and then", it is
  two tasks — split it.
- **Done when** — the condition that closes the task. Verifiable, not subjective.
