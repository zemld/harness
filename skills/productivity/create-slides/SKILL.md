---
name: create-slides
description: Builds a slide deck to the user's design brief.
argument-hint: "Topic of the deck plus optional design brief."
disable-model-invocation: true
---

Build a Marp deck (`slides.md`) plus a brief-matched `theme.css` under `<working_dir>/presentations/<slug>/` (default `working_dir` = cwd; `slug` = kebab-case summary of the topic). The deck's text follows the language the user used for the topic unless they say otherwise.

The topic comes from the skill argument — never re-confirm it. Synthesize audience, length, angle, and screenshot mode from the conversation; ask only for a structural gap you cannot infer. Run a `/grill` session first only when the conversation lacks the core material to build the deck — no clear angle/thesis or no known audience. Otherwise infer what you can and ask at most one follow-up for a lone gap.

Resolve the design brief: synthesize a theme; if no brief exists anywhere, ask one design question and wait — offer examples (anthropic-cream minimalist, dark tech with neon accent, academic on white, in the style of Stripe, or their own). Never guess a visual identity from the topic.

Screenshots have three modes: placeholders (emit `blockquote.screenshot` + `screenshots/NEEDED.md`), an existing image folder (reference as `![w:880](path)`), or none.

## Rules

- **Minimum text is the prime rule:** a slide reads in two seconds — one takeaway title plus at most one paragraph, one 3-item list, or one diagram. White space is content; split a dense slide rather than shrink the font.
- One idea per slide; order the deck as an argument, not a tour.
- Never overwrite an existing deck folder — use a fresh `<slug>`. If the user's design wishes fight the contract (five accents, 18px body), push back once and keep legibility. If the topic is huge or thesis-less, ask for the angle first. Speaker-notes-only is a different task — not this skill.

## Phase 1 — Plan the slides

- Write a numbered outline, one line naming each slide's takeaway; share it with the user only if the deck exceeds ~8 slides.
- Structure: title → why-it-exists → one-idea content slides → optional `.flow` diagrams → closing bookend.
- Word budget: title ~10 words; content slide ≤8-word title + ≤30-word body (or one diagram/screenshot), ~40-word hard ceiling; divider one or two words.

## Phase 2 — Write the files

- Create `<working_dir>/presentations/<slug>/` (add `screenshots/` when using placeholders).
- Produce `theme.css`: either copy the `anthropic-minimal` preset verbatim, or synthesize a new theme — pick palette and typography from `references/theme-palettes.md`, implement every token and layout class `references/theme-contract.md` requires, using `assets/themes/anthropic-minimal/theme.css` as the structural template. Write it into the deck folder, never back into `assets/themes/`.
- Write `slides.md` from `assets/slides-template.md`: set `title`, `description`, `lang`, replace `__THEME_NAME__` with your theme name, keep the build-command comment intact.
- Add `.gitignore` (`slides.{pdf,html,pptx}`) and `screenshots/NEEDED.md` when placeholders are used.

## Phase 3 — Render and verify

- Run the HTML build from the deck folder — it must succeed:
  ```bash
  cd <working_dir>/presentations/<slug>
  npx --yes @marp-team/marp-cli@latest slides.md --theme theme.css --html
  ```
- Success means the markdown is structurally valid; delete `slides.html`, then point the user at the PDF / live-preview commands (with the `CHROME_PATH` fallback) in the template's HTML comment.

## Phase 4 — Review in a subagent

- Spawn one subagent with the resolved brief (topic, thesis, audience, design brief) and the paths to `slides.md`, `references/theme-contract.md`, and `references/slide-review.md`; have it judge the deck against that rubric.
- It returns a verdict plus a fix list covering requirements (word budget, minimum text, one idea per slide, theme matches brief) and substance (the deck argues the stated thesis for the stated audience).
- Apply every fix before finishing; do not ship a deck the review flagged.

## References

- Required tokens, layout classes, contrast, forbidden effects: `references/theme-contract.md`.
- Palette and typography starting points: `references/theme-palettes.md`.
- Special block patterns (title, divider, flow, screenshot, page break): `assets/slides-template.md`.
