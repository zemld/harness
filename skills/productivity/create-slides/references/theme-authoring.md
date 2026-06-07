# Theme authoring

How to write a `theme.css` under a user's design brief. Use this together with `theme-contract.md` (the API every theme must satisfy) and `assets/themes/anthropic-minimal/theme.css` (a worked example of the structure — read it for *organisation*, not for *colors*).

## Step 1 — Parse the brief

A design brief is the free-text description the user gave. Read it and pull out four things:

| Dimension | What you're looking for | Examples in a brief |
|---|---|---|
| **Palette** | The dominant color family and contrast direction (light-on-dark, dark-on-light, warm, cool). | "dark tech", "cream and warm", "white academic", "in the style of Stripe" (light, cool blues/purples), "vaporwave" (pink/cyan on near-black). |
| **Typography** | Serif vs sans for headlines, mono vibe for code. | "editorial minimal" → serif headlines. "tech / startup" → sans. "academic" → serif. "playful" → rounded sans. |
| **Accent** | The single accent color, derived from the brief. | "neon accent" → cyan or magenta. "in Stripe style" → indigo/violet. "academic" → ink-blue or burgundy. "playful" → coral or teal. |
| **Vibe modifiers** | Specific feel words that shape padding, density, line height. | "spacious" → wider padding, looser line height. "dense slide notes" → tighter (but still ≥ 24px body). "elegant" → tighter letter-spacing on headlines, wider padding. |

If the brief is purely abstract ("make it look cool"), pick a coherent direction and proceed — do not block to ask. The user can iterate after seeing the first version.

## Step 2 — Choose tokens

Pick concrete values for every required token in `theme-contract.md`. Some worked starting points (use as inspiration, not as a fixed catalogue):

**Dark tech / neon accent**
```css
--bg: #0E1116;
--bg-soft: #1A1F26;
--ink: #E6E6E6;
--ink-soft: #B0B0B0;
--ink-muted: #7A7A7A;
--accent: #00E1FF;   /* cyan; magenta #FF3B9A also works */
--rule: #2A2F36;
```

**Academic / white on black**
```css
--bg: #FFFFFF;
--bg-soft: #F2F2F2;
--ink: #111111;
--ink-soft: #444444;
--ink-muted: #888888;
--accent: #8A1538;   /* deep burgundy; or ink-blue #1F3A93 */
--rule: #D9D9D9;
```

**Playful / pastel**
```css
--bg: #FFF8F2;
--bg-soft: #FDEDE3;
--ink: #2C2C2C;
--ink-soft: #5A5A5A;
--ink-muted: #9A9A9A;
--accent: #FF6B6B;   /* coral; or teal #3ABEB1 */
--rule: #E8DCCF;
```

**Stripe-style / cool indigo**
```css
--bg: #FFFFFF;
--bg-soft: #F6F9FC;
--ink: #0A2540;
--ink-soft: #425466;
--ink-muted: #8898AA;
--accent: #635BFF;   /* Stripe indigo */
--rule: #E3E8EE;
```

These are not the only correct answers. Adapt to the brief. Check contrast on `--ink` vs `--bg` (4.5:1 minimum) — pick a darker `--ink` or lighter `--bg` if it falls short.

## Step 3 — Pick typography

Use a stack with safe fallbacks; never depend on a single web font being installed.

**Serif headline stack** (editorial, academic, anthropic-like):
```css
font-family: "Tiempos Headline", "Charter", Georgia, "Times New Roman", serif;
```

**Sans headline stack** (tech, startup, modern):
```css
font-family: "Inter", "Söhne", -apple-system, "Helvetica Neue", system-ui, sans-serif;
```

**Body stack** (almost always sans, paired with either headline style):
```css
font-family: "Söhne", "Inter", -apple-system, "Helvetica Neue", system-ui, sans-serif;
```

**Mono stack** (code, flow diagrams, footer):
```css
font-family: "JetBrains Mono", "SF Mono", "Menlo", monospace;
```

Headline sizing scale that reads well at projection distance: `h1` 80–120px, `h2` 56–72px, `h3` 32–40px. Body 26–32px. Tighten `letter-spacing` on large headlines (-0.02em to -0.03em) and keep body at 0 to slightly negative.

## Step 4 — Implement the layout classes

Read `assets/themes/anthropic-minimal/theme.css` for how to structure the CSS file. Translate each class (`section.title`, `section.divider`, `.flow`, `blockquote.screenshot`, `.lead`) into your chosen palette and typography. The class names, behaviour, and roles stay identical — only the visual realization changes.

A useful trick when generating a new theme: open the anthropic-minimal CSS, copy its structure into your output, then walk top-to-bottom replacing color/font/size values to match the brief. The structural decisions (which selector targets what, which class composes which property) are already worked out — do not redesign them.

## Step 5 — Sanity-check before finishing

Before declaring the theme done, scan for these red flags:

- **Body text smaller than 24px** — fails the back-of-the-room test.
- **`--ink` vs `--bg` contrast under 4.5:1** — fails accessibility and projection rooms.
- **More than one accent color** — pick one, demote the rest to `--ink-*` shades.
- **A gradient on `section { background }`** — almost always wrong; flat backgrounds project cleaner.
- **Drop shadows on `.step`, `pre`, blockquotes** — drop them.
- **Hard-coded pixel margins above the headline causing a top-heavy layout** — keep `h1, h2, h3 { margin-top: 0 }`; Marp slides handle the top padding via `section { padding }`.
- **Forgotten layout classes** — re-check every class in `theme-contract.md` is present in the output CSS.

If the brief and the contract are at war (e.g. user asks for "a wild design with five accent colors"), favour the contract for the parts that affect readability and push back on the conflicting wishes — explain in the response that you went with one accent for legibility and offer to iterate.

## Note on placement

The synthesized `theme.css` is written **directly to the deck directory** at `<working_dir>/presentations/<slug>/theme.css`. It is one-off, tied to that deck. Do not save it back into `skills/productivity/create-slides/assets/themes/` — that directory is reserved for hand-curated reference themes only.
