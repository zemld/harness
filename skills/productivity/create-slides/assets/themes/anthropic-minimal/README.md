# anthropic-minimal

Reference theme bundled with the skill. Doubles as the default preset.

## Vibe

Cream background, black text, single Claude-orange accent. Serif headlines (Tiempos / Charter / Georgia) at 60–88px against sans body (Söhne / Inter) at 28px. Generous padding (80px × 96px). No drop shadows, no gradients, no rounded card stacks.

The look reads as "editorial seriousness, not corporate deck" — calmer than white, more confident than pastel.

## When to use as-is

Copy `theme.css` verbatim into the deck directory (no synthesis) when the user's design brief matches any of:

- mentions Anthropic, Claude, "Claude-style", "Anthropic-style"
- asks for "cream", "off-white", "warm minimal", "editorial minimal"
- asks for "minimalist slides with serif headlines"
- says "default theme", "the usual look", or gives no brief and the deck is for a personal/internal context where the standard look is fine

## When to use as a structural reference (not as-is)

When the user wants a different visual identity (dark tech, academic, playful, in-style-of-X, custom palette), read this file's `theme.css` for **structure** — which tokens to define, which layout classes to implement, how to organise the CSS — but pick new colors, fonts, and proportions per the user's brief.

The structure here implements the full contract from `references/theme-contract.md`. Use it as a worked example, not as a starting point you tweak.

## Files

- `theme.css` — the actual CSS theme, exactly what gets copied into a deck.
