---
marp: true
theme: __THEME_NAME__
paginate: true
size: 16:9
lang: en
title: __TITLE__
description: __ONE_LINE_DESCRIPTION__
---

<!--
Build commands:
  npx @marp-team/marp-cli@latest slides.md --theme theme.css --pdf
  # If no Chrome is installed, point at any Chromium-based browser:
  CHROME_PATH="/Applications/Yandex.app/Contents/MacOS/Yandex" \
    npx @marp-team/marp-cli@latest slides.md --theme theme.css --pdf --allow-local-files

Live preview:
  npx @marp-team/marp-cli@latest -p slides.md --theme theme.css

Add --allow-local-files when slides.md references local images (e.g. screenshots/*.png).
-->

<!-- _class: title -->
<!-- _paginate: false -->

# __TITLE__

### __SUBTITLE__

<div class="date">__YEAR__ · __AUTHOR__</div>

---

## Why this exists

One short sentence stating the problem.

A second short sentence stating the cost of not solving it.

**One bold line — the thesis of the whole talk.**

---

<!-- _class: divider -->

# Part one

The first chapter

---

## A single idea per slide

That idea fits in one short paragraph or a 3-item list.

- Item one.
- Item two.
- Item three.

The slide title is the takeaway, not the topic.

---

## Diagram example

<div class="flow">
<span class="step">stage&nbsp;one</span><span class="arrow">→</span>
<span class="step">stage&nbsp;two</span><span class="arrow">→</span>
<span class="step">stage&nbsp;three</span>
</div>

One line of context under the diagram if needed.

---

## Screenshot placeholder

<blockquote class="screenshot">
SCREENSHOT · 01-example.png<br>
short description of what the picture shows
</blockquote>

Replace with `![w:880](screenshots/01-example.png)` once the file exists.

---

<!-- _class: title -->
<!-- _paginate: false -->

# Thanks

### Links
[example.com](https://example.com)
