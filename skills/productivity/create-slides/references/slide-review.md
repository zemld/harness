# Slide-review rubric

Criteria for judging a finished deck. The reviewer reads `slides.md` against this rubric plus
the resolved brief (topic, thesis, audience, design brief) and `theme-contract.md`.

## Requirements — the deck must satisfy all

- **Word budget.** Title slide ~10 words. Content slide: ≤8-word title, ≤30-word body (or a
  single diagram/screenshot), ~40-word hard ceiling. Divider: one or two words.
- **Minimum text.** Each slide is readable in two seconds — one takeaway title plus at most one
  paragraph, one 3-item list, or one diagram. No wall of bullets.
- **One idea per slide.** A slide carrying two thoughts is two slides.
- **Takeaway titles.** The title states the point, not the topic ("X cuts latency 40%", not "Latency").
- **Theme matches the brief.** Palette, typography, and vibe reflect the stated design direction;
  one accent color; body ≥ 24px; no forbidden effects (drop shadows, gradients, rounded cards).
- **Screenshot mode honoured.** Placeholders present as `blockquote.screenshot` with a matching
  `screenshots/NEEDED.md`; existing images referenced by path; or none — consistent with the brief.

## Substance — the deck must argue, not list

- **Thesis lands.** The deck makes the stated claim; a reader walks away believing it.
- **Audience depth.** Vocabulary and detail fit the stated audience (engineers vs managers vs mixed).
- **Argument order.** Slides build a case — problem → idea → payoff — not a flat tour of features.
- **No orphan slides.** Every slide advances the thesis; cut ones that don't.

## Return shape

- **Verdict:** `pass` or `needs-fixes`.
- **Fix list:** one concrete, actionable item per problem, each naming the offending slide and the
  exact change (e.g. "Slide 4: body is 68 words — split into two slides" or "Slide 7 title 'Overview'
  is a topic, not a takeaway — restate as the point"). Empty when the verdict is `pass`.
