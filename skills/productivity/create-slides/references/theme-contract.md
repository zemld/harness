# Theme contract

Every `theme.css` produced by this skill — preset or synthesized — must satisfy this contract. The Marp template `assets/slides-template.md` is written against it; if a theme omits a required token or class, slides render broken (wrong background, missing flow boxes, invisible screenshot placeholders, etc.).

This contract is small on purpose. It describes the design *API* — what the template can rely on — and leaves all design *realization* (palette, typography, vibe) to the theme author.

## File header

The CSS file starts with:

```css
/* @theme <theme-name> */

@import 'default';
```

`<theme-name>` is a kebab-case identifier (e.g. `anthropic-minimal`, `dark-tech-neon`). It must match the `theme:` field in the `slides.md` frontmatter for Marp to recognise the theme name even though `marp-cli --theme theme.css` overrides it at build time.

## Required design tokens

Declare these CSS variables on `:root`. They form the palette the rest of the theme reads from:

| Token | Role | Where it appears |
|---|---|---|
| `--bg` | Slide background. The dominant color of the deck. | `section { background: var(--bg) }` |
| `--bg-soft` | Subtle alternate fill — slightly different from `--bg`. | code blocks, `.flow .step` boxes |
| `--ink` | Primary text color. Must hit AA contrast against `--bg`. | body text, `h1`, `h2` |
| `--ink-soft` | Secondary text — quieter than `--ink` but still readable. | `h3`, `em`, blockquote body, lead paragraph |
| `--ink-muted` | Tertiary text — for hints, footers, placeholders. Must still be readable on `--bg`. | page numbers, `.date`, screenshot placeholder text |
| `--accent` | The one accent color. Used sparingly for emphasis. | bullet markers, link underlines, blockquote border, `.flow .arrow`, code-block left border |
| `--rule` | Quiet separator color. Lower contrast than `--ink-muted`. | `<hr>`, table cell borders |

Two non-negotiable invariants:

- `--ink` against `--bg` must be **WCAG AA** contrast (4.5:1 for body text). A deck unreadable from the back of the room is a failed deck.
- Use **one** `--accent`. Never introduce a second accent color — if the brief asks for two, treat one as `--accent` and the other as a deeper shade of `--ink-*`.

## Required layout classes

The template uses these classes by name. Implement each — the look can be anything that fits the brief, but the class must exist and produce a recognisable variant of the slide.

### `section.title`

Title slide. Visually distinct from content slides.

Required behaviour:
- A larger `h1` than on content slides (typically 1.3×–1.5× the regular `h1`).
- An `h3` styled as a subtitle (italic and/or color-shifted).
- A `.date` element absolutely positioned in a corner for "year · author" or similar.

### `section.divider`

Section-break slide between major parts of a long deck. One huge word or short phrase, centered.

Required behaviour:
- Centered both horizontally and vertically.
- The `h1` here is the dominant element of the slide — same size or larger than `section.title h1`.
- Optional small subtitle under it (single line).

### `.flow`, `.flow .step`, `.flow .arrow`

Horizontal pipeline diagram: a row of boxes connected by arrows.

Required behaviour:
- `.flow` is a flex container with wrapping enabled (so long chains break to the next line).
- `.flow .step` is a labelled box — distinct fill (typically `--bg-soft`), comfortable padding.
- `.flow .arrow` renders the connector character (`→`) in `--accent`, visually weighted.
- Monospace font here reads as "system pipeline".

### `blockquote.screenshot`

Placeholder for a screenshot that has not been captured yet.

Required behaviour:
- A dashed border in `--ink-muted` (so it reads as "to be filled in", not as a quote).
- Monospace font, centered text, muted color.
- Generous internal padding — it should occupy real estate on the slide so the speaker can see what is missing.

### `.lead` (and `h2 + p` as alias)

Lead paragraph immediately under a slide title — the thesis line.

Required behaviour:
- Larger than body (~32px vs 28px).
- Color shifted to `--ink-soft`.
- Constrained line length (`max-width` ~ 22em) so it does not stretch into a banner.

### `.muted` and `.accent`

Utility text classes.
- `.muted` → `color: var(--ink-muted)`.
- `.accent` → `color: var(--accent)`.

## Required base styles

Beyond the named classes, the theme must also style:

- `section` — sets the slide background, default font family/size, padding. Body font size must be ≥ 24px (read from the back of a room). Padding must be ≥ 56px horizontal — slides need breathing room.
- `h1`, `h2`, `h3` — headline scale. Each must be visually distinct in size.
- `p`, `li`, `strong`, `em` — body text variants.
- `ul`, `ol`, `li::marker` — list marker should use `--accent`.
- `a` — link color and decoration in `--accent`.
- `code`, `pre`, `pre code` — monospace font, `--bg-soft` background, `--accent` left border on `pre` blocks.
- `blockquote` — quote styling with `--accent` left border (distinct from `blockquote.screenshot`).
- `table`, `th`, `td` — minimal borders using `--rule`, no zebra stripes.
- `hr` — single quiet line in `--rule`.
- `section::after` — page number footer in monospace, `--ink-muted`.

## Marp / aspect ratio

The template sets `size: 16:9` in the Marp frontmatter. Do not override this in CSS — keep slides 16:9 always.

## Forbidden in any theme

- Drop shadows on text, cards, or boxes.
- Gradients on backgrounds or fills (a single subtle gradient on `--bg` is borderline — avoid unless the brief explicitly calls for it).
- Rounded card stacks ("Material-style" elevation).
- Multiple accent colors.
- Background images on `section`.
- Animated CSS (slides are PDFs in the end).
- Emoji in the theme itself (decorative emoji belongs in deck content, never in the CSS).

These rules exist because slides are read at distance, in dim rooms, sometimes printed. Visual noise costs comprehension.
