# Project conventions

This is a static, single-page trip planner/map (Beijing→Shanghai, China 2026) — no build step, no framework. Three files: `index.html` (markup only), `style.css` (all styling), `script.js` (all data + behavior).

## Rule 1 — every meaningful DOM element gets a unique `id`

Scope: elements you'd actually want to reference or point someone to — containers (`#topbar`, `#panel`, `#legend`...), buttons, inputs, and anything dynamically generated that a script needs to find later (checklist checkboxes via `data-ck`, day-activity rows via `id="day-activity-<city>-<date>-<n>"`).

Not in scope: every single `<p>`/`<span>`/`<li>` wrapper inside generated content (hotel cards, food cards, quote cards, etc.) — those don't need individual ids, just the class-based styling hooks they already have.

**Status: partially done.** Static markup in `index.html` is fully id'd. Dynamically-generated repeating content (one hotel card / food card / quote card per city) does **not** yet have unique ids threaded through — that's the planned next step, since it means touching every generator function in `script.js` (`hotelCard`, `foodCard`, the quote-cards markup, etc.) to accept and emit an id per city. Ask before assuming an id exists on generated content until this lands.

## Rule 2 — one HTML file, one CSS file, one JS file

- `index.html` — structure only. No `<style>` blocks, no inline `onclick=`.
- `style.css` — all styling.
- `script.js` — all data (`IMG`, `CONTENT`, `STOPS`, `LEGS`, ...) and all behavior.

**Event handling:** no `onclick="fn()"` anywhere, including inside JS-generated HTML strings. Every clickable element gets `data-action="some-name"` instead; one delegated `document.addEventListener("click", ...)` in `script.js` routes clicks through the `ACTIONS` dispatch table near the bottom of that file. This works for dynamically-injected HTML (city panels) without needing to re-attach listeners each time. See the big comment above `const ACTIONS = {...}` in `script.js` for the full explanation — read that before adding a new interactive element.

## Rule 3 — verbose comments

Written for a junior developer. Every function gets a comment explaining what it does and why, not just what — especially anything non-obvious (event delegation, the localStorage checklist-persistence logic, why a note is attached to one specific activity vs the whole day). Prefer over-explaining to under-explaining here.

## Rule 4 — ask when unclear

Before a big structural change (like this file split), stop and ask rather than guessing scope. Past example: before doing this split, clarified (a) how strict the "unique id" rule should be, (b) whether to modernize `onclick` to `addEventListener`, (c) whether to persist these rules here, (d) whether to stage the rollout. Do the same for future ambiguous asks — a couple of quick multiple-choice questions beats redoing a large refactor.

## Rule 5 — no browser verification unless asked

User checks changes in browser themselves. Skip launching/screenshotting/driving the app after edits — costs time and tokens for no benefit here. Only verify in browser if user explicitly asks for it.

## Current status

- [x] Split into index.html / style.css / script.js
- [x] Removed all `onclick=`, replaced with `data-action` + central `ACTIONS` dispatcher
- [x] Verbose comments throughout script.js and style.css
- [x] Verified in a real browser (all data-action interactions, checklist persistence, quote modal open/close-on-backdrop/stay-open-on-inside-click, topbar panels) — no console errors
- [ ] Unique ids threaded through per-city generated content (hotel/food/quote cards) — next step
