# Technical design

Include only applicable subsections from `### Data model`, `### Components and
interactions`, `### Contracts`, and `### Flows`; add another descriptive
subsection when settled material does not fit them, and omit empty subsections.

- Data model records tables, fields, types, relations, constraints, and indexes.
- Components and interactions records component responsibilities, dependencies,
  and connections.
- Contracts records external and internal requests, responses, events, and
  errors.
- Flows records data and control flows.

Use a Mermaid `flowchart` for settled component links, data movement, or
conditional paths, and a Mermaid `sequenceDiagram` when the settled order of
interactions matters. Do not add missing nodes, transitions, or behavior to
complete a diagram.
