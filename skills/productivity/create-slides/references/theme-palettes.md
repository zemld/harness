# Theme palettes & typography

Material for synthesizing a `theme.css` under a design brief. This file holds only starting
values — palettes, font stacks, sizing numbers. The design *API* every theme must implement is
in `theme-contract.md`; the structural worked example is `assets/themes/anthropic-minimal/theme.css`.

These are inspiration, not a fixed catalogue. Adapt to the brief. `--ink` against `--bg` must
clear 4.5:1 contrast (contract invariant) — darken `--ink` or lighten `--bg` if it falls short.

## Palettes

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

**Academic / dark on white**
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

## Font stacks

Always use a stack with safe fallbacks; never depend on a single web font being installed.

**Serif headline** (editorial, academic, anthropic-like):
```css
"Tiempos Headline", "Charter", Georgia, "Times New Roman", serif;
```

**Sans headline** (tech, startup, modern):
```css
"Inter", "Söhne", -apple-system, "Helvetica Neue", system-ui, sans-serif;
```

**Body** (almost always sans, paired with either headline):
```css
"Söhne", "Inter", -apple-system, "Helvetica Neue", system-ui, sans-serif;
```

**Mono** (code, flow diagrams, footer):
```css
"JetBrains Mono", "SF Mono", "Menlo", monospace;
```

## Sizing

Reads well at projection distance:

| Element | Size |
|---|---|
| `h1` | 80–120px |
| `h2` | 56–72px |
| `h3` | 32–40px |
| body | 26–32px (never below 24px) |

Tighten `letter-spacing` on large headlines (−0.02em to −0.03em); keep body at 0 to slightly
negative. Keep `h1, h2, h3 { margin-top: 0 }` — Marp handles top padding via `section { padding }`.

## Brief → dimension mapping

| Dimension | What the brief signals | Examples |
|---|---|---|
| Palette | dominant color family, light/dark direction | "dark tech", "cream and warm", "white academic", "Stripe" (light cool), "vaporwave" (pink/cyan on near-black) |
| Typography | serif vs sans headline, mono vibe | "editorial/academic" → serif; "tech/startup" → sans; "playful" → rounded sans |
| Accent | the single accent color | "neon" → cyan/magenta; "Stripe" → indigo; "academic" → ink-blue/burgundy; "playful" → coral/teal |
| Vibe | padding, density, line height | "spacious" → wider padding, looser leading; "elegant" → tighter headline letter-spacing, wider padding |
