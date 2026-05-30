# Knowledge Base Structure

This document is the single source of truth for how a personal knowledge base is laid out and how to navigate it. All KB skills (write-kb, answer-kb) follow these rules.

---

## KB root discovery

Walk up from the current working directory, looking for a file named `Entrypoint.md`. The directory that contains it is the KB root.

If no `Entrypoint.md` is found anywhere up the tree and the task requires creating content, treat CWD as the root and create a minimal `Entrypoint.md` there:

```markdown
# Knowledge Base

## Категории
```

---

## File layout

```
<kb-root>/
├── Entrypoint.md                  # master index — lists all top-level categories
├── <category-slug>/
│   ├── overview.md                # category hub — lists every subtopic with a one-line description
│   ├── <subtopic-slug>.md         # leaf note — covers one focused concept
│   └── <subtopic-slug>.md
└── <another-category>/
    ├── overview.md
    └── ...
```

- **`Entrypoint.md`** is the entry point. It lists every category with a short description and a wiki-link to its `overview.md`.
- **`overview.md`** is the hub for a category. It lists every subtopic file under a `## Разделы` heading.
- **Leaf files** each cover one focused concept, technique, or definition.

---

## Navigation pattern

To find information, follow this path:

1. Read `Entrypoint.md` — identify which categories are relevant.
2. Read `overview.md` in each promising category — identify which subtopic files to read.
3. Read the specific leaf files — synthesize the answer from their content.

For broad or cross-cutting questions, read overview files from multiple categories before narrowing down to leaf files.

---

## Conventions

Match whatever conventions already exist in the KB. Before writing anything, observe:

- **Language** — Russian is the default for a freshly bootstrapped KB (the `Entrypoint.md` template above seeds Russian headings: `## Категории`, `## Разделы`). For an existing KB in another language, match what is there — if every file is in English, keep writing in English. Never mix languages within a file.
- **File naming** — use kebab-case slugs (e.g., `gradient-descent.md`, `sql-window-functions.md`).
- **Heading levels** — match the depth used in existing files (typically `#` for title, `##` for sections).
- **Section names** — use the same language and style as existing files (e.g., "Связанные темы" or "Related topics").

---

## Wiki-link syntax

All internal cross-references use Obsidian wiki-link format:

```
[[relative/path/from/kb-root|Display Name]]
```

Examples:
- `[[machine-learning/gradient-descent|Gradient Descent]]`
- `[[../other-category/overview|Other Category]]`

Rules:
- Paths are always relative to the KB root.
- Only link to files that actually exist in the KB. Never create dangling links.
- Omit the "Связанные темы" section entirely if there is nothing to link to yet.

---

## Summary callout

Every file must open with a one-sentence summary in a blockquote immediately after the title:

```markdown
# Topic Name

> One sentence explaining what this is and why it matters.
```

This is the first thing a reader sees when scanning the KB and must always be present.
