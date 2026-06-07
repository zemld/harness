---
name: create-slides
description: Builds a slide deck as a Marp markdown file with a CSS theme matched to the user's design brief — any visual style, not a fixed look. Use whenever the user wants a presentation, slide deck, talk, lightning talk, lecture, or "set of slides" on any topic — including "make a presentation", "build slides", "deck about X", "сделай презентацию", "нужны слайды про X", "talk about Y for a meetup", "slides for tomorrow's review", "minimalist slides", "dark tech slides", "academic deck", "deck in the style of Stripe", "презентация в тёмной теме", "презентация в стиле Anthropic / Notion / Linear", "playful slides with pastel colors". Be eager to trigger — better to fire than to miss. The skill argument carries both the topic and (optionally) the design brief; treat it as the brief, do not re-ask "what is it about". The default output format is Marp + a synthesized or preset CSS theme — switch to Slidev / Reveal.js / Keynote outline / PowerPoint only when the user explicitly asks. Do NOT use for reviewing an existing deck, editing a single existing slide, or designing speaker notes only.
argument-hint: "Topic of the deck plus optional design brief (e.g. 'harness overview, dark tech with neon accent' or 'Q4 roadmap, academic look on white')"
---

Build a presentation as a Marp markdown deck (`slides.md`) plus a tailored CSS theme (`theme.css`), organised under `presentations/<slug>/`. Skill instructions are in English; respond in the user's language. The output deck's text language follows whichever language the user used to describe the topic — Russian topic → Russian slides, English topic → English slides — unless the user says otherwise.

**The topic and the design come from the skill argument and the surrounding conversation, not from a follow-up interrogation.** The argument may carry a topic alone ("my harness"), a topic plus a design brief ("Q4 roadmap, academic look on white"), or a paragraph. Treat it as the brief, synthesise the rest from prior context, and only ask follow-ups about *structural* gaps (audience, length, screenshot mode, or — if no design hint exists anywhere — the design direction). Never re-confirm the topic itself.

## What this skill produces

```
<working_dir>/presentations/<slug>/
├── slides.md            # Marp markdown — content of all slides
├── theme.css            # CSS theme — either copied preset or synthesized under the brief
├── .gitignore           # ignores slides.{pdf,html,pptx}
└── screenshots/
    └── NEEDED.md        # list of screenshots to capture later (only when placeholders are used)
```

The build commands live as an HTML comment at the top of `slides.md` — there is no separate README.

## Rules

- **Minimum text per slide — this is the prime rule.** A slide should be readable in two seconds: one title line that *is the takeaway*, and at most one of: a 1–2 sentence paragraph, a list of 3 items (4 only when truly unavoidable), or a single diagram. If a slide has more than ~40 words of body copy, it is wrong — split it, cut it, or move the detail to speaker notes. The audience reads the slide in passing; the speaker carries the substance. White space is content. This rule holds regardless of the visual theme.
- **Marp is the default format.** It compiles to PDF/HTML/PPTX with `marp-cli`, lives in plain markdown, and renders the same on any machine. Switch to Slidev / Reveal.js / a Keynote outline only when the user explicitly asks.
- **The theme follows the brief.** There is no single canonical look. Every deck gets a theme that matches the user's design brief — either an existing preset (when the brief matches one) or a freshly synthesized `theme.css` (when it does not). The theme must satisfy `references/theme-contract.md` so the deck template can rely on it.
- **Speak to one audience.** Confirm the audience once if it is not obvious from the conversation (engineers, managers, mixed) — vocabulary and depth follow from this.
- **Skill body is in English; deck content follows the user.** The deck's slide text is in the user's language. The bundled `slides-template.md` example is in English; translate the boilerplate when the deck is in another language. Build commands stay in English.

## Phase 1 — Resolve target

The topic is the skill argument; do not re-elicit it. Synthesize everything else from the surrounding conversation; ask only when a structural piece is missing and cannot be inferred.

- **`working_dir`** — absolute path. Default `cwd`.
- **`slug`** — kebab-case derived from the topic argument (e.g. argument *"my harness and how I use it"* → slug `harness-overview`; *"Q4 roadmap"* → `q4-roadmap`).
- **Angle / thesis** — the *claim* the talk makes. "About X" is not enough. Pull this from the argument and surrounding conversation; if neither contains it, ask a single targeted question ("what's the one thing you want them to walk away believing?").
- **Audience** — who is in the room (engineers, managers, mixed). Drives vocabulary and depth.
- **Length** — rough slide count or talk duration. A 5-minute lightning talk is 5–7 slides; a 20-minute walkthrough is 12–18.
- **Screenshots / images** — three modes:
  1. *Placeholders.* User will add screenshots later; emit `blockquote.screenshot` blocks and a `screenshots/NEEDED.md` checklist. Use this as the default when the user mentions screenshots but has not provided them.
  2. *Existing path.* User has a folder of images; reference them as `![w:880](path/to/file.png)`.
  3. *No images.* Pure text/diagrams.
- **Language** — defaults to the language of the argument and surrounding conversation.
- **Design brief** — see the next subsection.

### Resolve the design brief

The design brief is a free-text description of the visual look — palette, typography, vibe, references. It can live in the skill argument itself ("..., dark tech with neon accent"), in the surrounding conversation ("I want it to feel academic"), or be absent entirely.

Decide which of three modes applies:

1. **Brief matches a preset.** If the brief mentions Anthropic, Claude, "Claude-style", "cream and serif", "minimalist editorial", or asks for the default/standard look, use the `anthropic-minimal` preset — see Phase 3.
2. **Brief is present and specific.** If the brief gives a clear direction ("dark tech", "academic on white", "in the style of Stripe", "pastel playful", a moodboard description), synthesize a new theme under it — see Phase 3.
3. **No brief anywhere.** Ask exactly **one** focused question and wait for the answer before proceeding:

   > "What design do you want for the slides? For example: `anthropic-cream minimalist` (default editorial look), `dark tech with neon accent`, `academic on white`, `in the style of Stripe`, or describe it yourself."

   Do not guess the design from the topic — surprising the user with an unrequested visual identity is worse than asking once.

When the argument plus the conversation cover angle, audience, length, screenshot mode, and design brief, skip the questions and proceed directly to Phase 2. Batch any unavoidable questions into a single round.

## Phase 2 — Plan the slides

Before writing markdown, write a numbered outline — one line per slide, naming the *takeaway* of each. Share it with the user only if the deck is more than ~8 slides or the angle is ambiguous; otherwise just proceed.

A typical structure:

1. **Title slide** — title + one-line subtitle + author/date. `<!-- _class: title -->`.
2. **Why this exists** — the problem the talk addresses. One thesis line.
3. **Content slides** — one idea each, ordered as an argument, not a tour. Group with `<!-- _class: divider -->` slides between major sections when the deck is long.
4. **Diagram slide(s)** — pipelines and flows render well as `<div class="flow">…</div>` chains.
5. **Closing slide** — thanks, links, call to action. Use the `section.title` class again so it feels like a bookend.

Default to fewer slides with more weight than many slides with one bullet each.

**Word budget per slide:**

- Title slide: title + one-line subtitle. ~10 words total.
- Content slide: title (≤8 words) + body (≤30 words OR a single diagram OR a single screenshot). Hard ceiling ~40 words. If you cannot fit it, the slide is doing two things — split it.
- Divider slide: one or two words. Nothing else.

If a slide ends up looking dense in markdown — multiple long bullets, multi-line paragraphs — that is a signal to cut, not a signal to shrink the font.

## Phase 3 — Write the files

1. **Create the directory.** `<working_dir>/presentations/<slug>/` with a `screenshots/` subdirectory if screenshots are in play.

2. **Produce `theme.css`.** Two paths depending on the design brief:

   - **Preset path (brief matches `anthropic-minimal`):** copy the preset verbatim.

     ```
     cp <skill-path>/assets/themes/anthropic-minimal/theme.css <working_dir>/presentations/<slug>/theme.css
     ```

     Do not modify the file. The theme name in the CSS header is `anthropic-minimal`.

   - **Synthesis path (brief is specific or custom):** read `references/theme-contract.md` (what every theme must provide) and `references/theme-authoring.md` (how to translate a brief into CSS). Use `assets/themes/anthropic-minimal/theme.css` as a structural reference — its organisation and class set are the worked example to copy; the colors, fonts, and proportions come from the brief.

     Write the synthesized CSS directly to `<working_dir>/presentations/<slug>/theme.css`. Pick a kebab-case theme name for the `/* @theme <name> */` header (e.g. `dark-tech-neon`, `academic-white`, `stripe-style`) — this name goes into the `slides.md` frontmatter too.

     Do not save the synthesized theme back into `skills/productivity/create-slides/assets/themes/` — that directory is reserved for hand-curated reference themes only.

3. **Write `slides.md`.** Start from `assets/slides-template.md`, then replace section by section using the outline from Phase 2. Front-matter fields to set:
   - `title`, `description`, `lang`
   - `theme:` — replace the `__THEME_NAME__` placeholder with the theme name you chose in step 2 (e.g. `anthropic-minimal`, `dark-tech-neon`).

   Keep the build-command HTML comment at the top intact.

4. **Add `.gitignore`** with `slides.pdf`, `slides.html`, `slides.pptx` — generated artifacts should not be committed.

5. **If using placeholders, write `screenshots/NEEDED.md`** with one row per screenshot: filename, what to capture, where to capture it from, and the substitution instruction (`![w:880](screenshots/<file>.png)`).

## Phase 4 — Render and verify

Run a build to confirm the markdown is valid:

```bash
cd <working_dir>/presentations/<slug>
npx --yes @marp-team/marp-cli@latest slides.md --theme theme.css --html
```

HTML rendering does not require a browser — if it succeeds, the markdown is structurally valid. Then offer the user the PDF command:

```bash
npx @marp-team/marp-cli@latest slides.md --theme theme.css --pdf
```

PDF requires a Chromium-based browser. If `marp-cli` reports *"No suitable browser found"*, propose pointing it at any installed Chromium-based browser via `CHROME_PATH`:

```bash
CHROME_PATH="/Applications/Yandex.app/Contents/MacOS/Yandex" \
  npx @marp-team/marp-cli@latest slides.md --theme theme.css --pdf
```

Common Chromium fallbacks on macOS: Yandex Browser, Brave, Arc, Vivaldi, Chromium. On Linux: `chromium`, `chromium-browser`, `brave-browser`. The path should point at the actual executable inside the `.app` bundle on macOS, e.g. `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`.

Add `--allow-local-files` when the deck embeds local images (`screenshots/*.png` etc.).

After the HTML build, delete `slides.html` — `.gitignore` already excludes it, but no stale artifact should land in the directory either.

## Universal design discipline

These rules apply to every deck this skill produces, regardless of theme. Theme-specific aesthetics (colors, fonts) come from `references/theme-authoring.md` and the brief; this list is about composition and legibility.

- **Body text ≥ 24px**; headlines scale up from there. Slides get read from the back of the room.
- **One accent color per theme.** Two accents fight each other and dilute emphasis.
- **Generous padding** (≥ 56px horizontal). Slides should feel half-empty by mainstream-deck standards — that is correct.
- **No drop shadows, no gradients, no rounded card stacks, no emoji in the CSS itself.**
- **Contrast first.** Text against background must hit WCAG AA (4.5:1) at minimum.
- **One idea per slide.** If a slide has two thoughts, it is two slides.

If the deck content does not fit comfortably with these constraints, the content is wrong, not the constraints — split slides, cut words, or pick a different structure.

## Special blocks

Use these patterns from `slides-template.md`. They depend on layout classes that every theme implements per `references/theme-contract.md`.

**Title slide** — `<!-- _class: title -->` directive on the slide, `<!-- _paginate: false -->` to hide page number, optional `<div class="date">` for the corner.

**Divider slide** — `<!-- _class: divider -->`. One large word centered. Use to mark act breaks in a long deck.

**Flow diagram** — `<div class="flow">…</div>` containing `<span class="step">` boxes separated by `<span class="arrow">→</span>`. Renders as a horizontal pipeline. Stack multiple `.flow` divs to wrap long chains.

**Screenshot placeholder** — `<blockquote class="screenshot">SCREENSHOT · <filename><br>short description</blockquote>`. Renders as a dashed-bordered frame. Replace with a real image when available: `![w:880](screenshots/<filename>)`.

**Page break** — `---` on its own line.

## Edge cases

- **User asks for Slidev / Reveal.js / PowerPoint / Keynote.** Switch format, but keep the same content-planning discipline (one idea per slide, theme matched to brief, screenshots as placeholders).
- **User wants to tweak an existing deck's theme.** Edit the *copy* of `theme.css` inside the deck folder, not the bundled preset under `assets/themes/`. Change the CSS variables at the `:root` block first — they parameterise the whole theme.
- **User gives conflicting design wishes** (e.g. "five accent colors", "use 18px body"). Push back once: explain the legibility cost, propose a single accent + readable size, and offer to iterate. The contract wins ties.
- **User already has a `presentations/` directory with content.** Use a fresh `<slug>` subdirectory, never overwrite.
- **User explicitly wants speaker notes only, not slides.** This is a different task — do not run this skill.
- **User wants the deck in Russian/another non-English language.** Translate all body copy, but keep the build-command comment in English (commands are universal).
- **Topic is huge ("the whole company strategy").** Push back once and ask for the angle. A deck without a thesis is a meeting agenda.
