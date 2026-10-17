# Modern CSS and Baseline browser support

Prefix `CSS`. This file covers what Baseline's "newly" and "widely available" mean and how an agent checks a feature from a shell, which CSS became usable in 2024–2026 and the traps in each, what still isn't Baseline and its fallback, linting for Baseline, Interop 2026, and the browser floors of Tailwind CSS 4 and the Angular CLI. Font loading is in `kb-fonts.md`, colour and visual design in `kb-design.md`.

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#177, part of roadmap #167) by an Opus 5.5 lead with four Sonnet readers (checking and linting; features that aren't Baseline; traps in newly available features; Tailwind 4 and the Angular CLI) and a Sonnet refuter, which qualified four of six claims the recommendations rest on (folded in) and refuted none.
- Read as raw text: web-features 3.43.0 `data.json` (published 2026-10-15) queried with Node and `jq`, `@mdn/browser-compat-data` (BCD) at `main`, MDN pages as Markdown from mdn/content, docs, READMEs and CHANGELOGs from raw.githubusercontent.com, published files from jsDelivr, and the npm registry.
- Tested: browserslist 4.29.3's Baseline queries, `@eslint/css` 2.0.1 on ESLint 10.13.0 with `tailwind-csstree` 0.4.1, esbuild 0.28.2's CSS lowering, and the webstatus.dev API. Community lint plugins weren't run.
- Our apps were read on 2026-10-17 from `main` of osrs-tracker-web and freek-mencke-web: Angular 22, Tailwind 4 through `@tailwindcss/postcss`, ESLint 10 with angular-eslint, no stylelint and no browserslist file; five and seven CSS files, mostly Tailwind layers and `@utility` blocks.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| What do Baseline "newly available" and "widely available" mean? | Newly: the current release of every core browser (Chrome, Edge, Firefox, Safari, desktop and mobile) supports it. Widely: 30 months after that. "Baseline 2024" is what became newly available in 2024. | CSS-001 |
| How do I check a CSS feature's Baseline status from a shell? | `curl -s https://api.webstatus.dev/v1/features/has`, or `jq '.features.has.status' data.json` on web-features' `data.json` from jsDelivr. Not caniuse or BCD: neither has a Baseline field. | CSS-002 |
| Anchor positioning says "limited availability": can I use it? | Its core works in Chrome 125/129, Firefox 147 (2026-01-13) and Safari 26; only two `position-visibility` values keep it limited. Gate it on the property you use (`@supports (position-area: center)`), name the anchor explicitly, and avoid single-keyword `position-area` and `flip-x`/`flip-y`, which came months later. | CSS-003, CSS-017 |
| Which CSS can I use without a fallback now? | Widely available since 2025: `:has()`, nesting, container size queries, subgrid, `color-mix()`, OKLCH, `inert`, `dvh`, media range syntax, `:user-invalid`, `linear()`. | CSS-005 |
| Which newer CSS needs a fallback, and until when? | Newly available: `light-dark()` and `text-wrap: balance` (widely about 2026-11), `@property` (2027-01), `@starting-style` (2027-02), popover (2027-07), view transitions (2028-04), `@scope` (2028-09), `field-sizing` (2028-12). | CSS-006 |
| What still isn't Baseline? | Scroll-driven animations (Firefox 159 due 2026-10-27), cross-document view transitions, customizable `<select>`, `text-wrap: pretty`, `if()`, typed `attr()`, interest invokers, `<dialog closedby>`. All but `if()` degrade to the plain behaviour. | CSS-010 |
| Why doesn't my nested CSS or `:has()` rule apply? | Compound selectors need `&` (`&:hover`), `&__x` doesn't exist, `&` takes `:is()` specificity, `:has()` can't nest, and an invalid selector in a list drops the whole rule. | CSS-007, CSS-011 |
| Do I still need JavaScript for dropdowns and modals? | No: `popover`, `<dialog>` and `command`/`commandfor` buttons. Animating them needs `@starting-style` and `allow-discrete`; the exit animation's `overlay` is Chrome-only. | CSS-008 |
| How do I enforce Baseline in lint? | `@eslint/css`'s `css/use-baseline` (`available: "widely"`), with `tailwind-csstree` for Tailwind 4. It skips `@utility` blocks and template classes, and chokes on `if()`. stylelint has a community plugin. | CSS-012, CSS-013 |
| Which browsers does browserslist's `baseline widely available` select? | On 2026-10-17: Chrome and Edge 123, Firefox 125, Safari 17.4. Pin a date (`… on 2026-05-07`) for reproducible builds. | CSS-004 |
| Which browsers does Angular 22 support, and does it lower CSS? | Baseline widely available on 2026-05-07: Chrome 119, Firefox 119, Safari 17.0. esbuild flattens nesting and adds `-webkit-` prefixes for them, but adds no polyfills. | CSS-016 |
| What is Tailwind CSS 4's browser floor? | Safari 16.4, Chrome 111, Firefox 128 ("stick with v3.4" for older). 4.1 added fallbacks so older Safari and Firefox still render. Its Lightning CSS targets are hard-coded, not your browserslist. | CSS-015 |
| What does Interop 2026 cover? | Anchor positioning, scroll-driven animations, cross-document view transitions, container style queries, `attr()`, `contrast-color()`, `shape()`, dialog and popover additions, scroll snap and more; 2025's areas mostly became Baseline within about a year. | CSS-014 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| CSS-001 | Baseline: what "newly available" and "widely available" mean | fact | baseline, web-features, definitions |
| CSS-002 | Checking a feature's Baseline status from a shell | tool | baseline, web-features, webstatus, jq |
| CSS-003 | A feature's status can hide per-property support: anchor positioning | anti-pattern | baseline, compat-keys, anchor-positioning |
| CSS-004 | browserslist Baseline queries, and the versions they gave on 2026-10-17 | tool | browserslist, baseline, browser-targets |
| CSS-005 | Widely available since 2025: use these without a fallback | fact | widely-available, has, nesting, container-queries |
| CSS-006 | Newly available 2024–2026: dates, and when each becomes widely available | fact | newly-available, popover, light-dark, scope |
| CSS-007 | Nesting, `:has()` and container queries: the rules that fail silently | pattern | nesting, has, container-queries, specificity |
| CSS-008 | Popover, `<dialog>`, invoker commands and `@starting-style` instead of JavaScript | pattern | popover, dialog, invoker-commands, starting-style |
| CSS-009 | `@scope`, `@property`, relative colours, `field-sizing`, view transitions: one trap each | pattern | scope, at-property, relative-color, view-transitions |
| CSS-010 | Not Baseline on 2026-10-17: what each feature does without support | fact | not-baseline, scroll-driven-animations, customizable-select, if |
| CSS-011 | Progressive enhancement with `@supports`: patterns and blind spots | pattern | supports, progressive-enhancement, fallbacks |
| CSS-012 | ESLint's `css/use-baseline` (`@eslint/css`): setup for Tailwind 4, and what it misses | tool | eslint, use-baseline, tailwind, lint |
| CSS-013 | Other Baseline linters: stylelint, HTML, JavaScript, and browserslist-based `compat` | comparison | stylelint, html-eslint, eslint-plugin-compat, lint |
| CSS-014 | Interop 2026: what it targets, and what the 2025 round predicts | fact | interop-2026, browsers, roadmap |
| CSS-015 | Tailwind CSS 4: browser floor, the CSS it relies on, and its fixed Lightning CSS targets | fact | tailwind, browser-support, lightningcss |
| CSS-016 | Angular CLI: browser targets are Baseline widely available on a fixed date, and esbuild lowers CSS to them | fact | angular, browser-support, esbuild, browserslist |
| CSS-017 | Anchor positioning on 2026-10-17: the core that works everywhere, and the gaps | recommendation | anchor-positioning, position-area, polyfill |

## [CSS-001] Baseline: what "newly available" and "widely available" mean
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [web-features: docs/baseline.md](https://raw.githubusercontent.com/web-platform-dx/web-features/main/docs/baseline.md), [web-features 3.43.0 README](https://www.npmjs.com/package/web-features/v/3.43.0), [web.dev: Baseline](https://web.dev/baseline), [web.dev: How to choose your Baseline target](https://web.dev/articles/how-to-choose-your-baseline-target)
- Related: CSS-002, CSS-003, CSS-004, CSS-016

Baseline is a per-feature status that the WebDX Community Group publishes in the `web-features` npm package, computed from `@mdn/browser-compat-data` over a core browser set: Safari (iOS and macOS), Chrome (Android and desktop), Edge (desktop) and Firefox (Android and desktop).

| Status | `status.baseline` | Rule (docs/baseline.md) |
|---|---|---|
| Newly available | `"low"` | Every current stable release in the core set supports it, "excluding those features identified as having `partial_implementation`". Its date, the keystone date, is "the last release date on which a browser introduced support". |
| Widely available | `"high"` | The keystone date "is on or before today's date minus 30 months" and the latest Firefox ESR x.0 release. |
| Limited | `false` | Missing from a core browser, or discouraged. |

What it isn't: it doesn't "identify universally available features", assistive-technology support or Node and Electron; and Baseline features "should 'just work'… without requiring polyfills or workarounds". The doc says "The status definition is due for review by the owners group on 9 September 2026"; on 2026-10-17 it was unchanged.

**Baseline years** are fixed sets: "All items that become part of Baseline Newly available in 2024 can be referred to as Baseline 2024" (web.dev). web.dev's advice: "Widely available is an excellent target which evolves as the 30 month window progresses through time."

web-features 3.43.0 (published 2026-10-15, `npm view web-features 'time[3.43.0]'`) counts 650 widely available, 124 newly available and 443 limited features.

## [CSS-002] Checking a feature's Baseline status from a shell
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [web.dev: Baseline](https://web.dev/baseline), [web.dev: Web Platform Dashboard Baseline queries](https://web.dev/articles/web-platform-dashboard-baseline), [webstatus.dev OpenAPI](https://raw.githubusercontent.com/GoogleChrome/webstatus.dev/main/openapi/backend/openapi.yaml), [compute-baseline README](https://raw.githubusercontent.com/web-platform-dx/web-features/main/packages/compute-baseline/README.md), [@mdn/browser-compat-data README](https://github.com/mdn/browser-compat-data), [Fyrd/caniuse `data-2.0.json`](https://github.com/Fyrd/caniuse)
- Related: CSS-001, CSS-003, CSS-004

Two sources answer it; two don't.

**web-features data** (the reviewed source). One 4.9 MB file, no install:

```bash
curl -sL https://cdn.jsdelivr.net/npm/web-features/data.json -o wf.json
jq -c '.features.has.status | {baseline, baseline_low_date, baseline_high_date}' wf.json
# {"baseline":"high","baseline_low_date":"2023-12-19","baseline_high_date":"2026-06-19"}
```

IDs are web-features IDs (`has`, `nesting`, `anchor-positioning`); find one with `jq -r '.features | keys[]' wf.json | grep anchor`.

**webstatus.dev API** (Google's dashboard over the same data, no key): `curl -s https://api.webstatus.dev/v1/features/has` returns `"baseline":{"high_date":"2026-06-19","low_date":"2023-12-19","status":"widely"}`. Lists take `q=` with `baseline_status:limited|newly|widely`, `baseline_date:YYYY-MM-DD..YYYY-MM-DD`, `group:css`, `AND`, `OR` and `-`, with `page_size` at most 100 and a `page_token` for more. `q=baseline_status:newly AND group:css` gave 39 features. Its OpenAPI is `version: 0.1.0`, with no stated rate limit.

**Not these:**
- `@mdn/browser-compat-data` has per-browser versions but no Baseline field: "the Baseline data is managed by the W3C WebDX Community Group".
- caniuse's `data-2.0.json` has no "baseline" string.
- `compute-baseline`: "Don't use `compute-baseline` to generate publishable Baseline statuses"; only web-features and its `getStatus` "have completed the full Baseline editorial review process".

Tested 2026-10-17, web-features 3.43.0 via jsDelivr and api.webstatus.dev: both commands returned the values above.

## [CSS-003] A feature's status can hide per-property support: anchor positioning
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [web-features 3.43.0 `data.json`](https://cdn.jsdelivr.net/npm/web-features@3.43.0/data.json), [web-features README: `by_compat_key`](https://www.npmjs.com/package/web-features/v/3.43.0), [web-features guidelines: status overrides](https://raw.githubusercontent.com/web-platform-dx/web-features/main/docs/guidelines.md)
- Related: CSS-002, CSS-012, CSS-017

"Most features compute a status from `@mdn/browser-compat-data` (BCD) compat keys given by the `compat_features` array" (web-features guidelines; overrides can narrow that to `core` keys), so one unsupported sub-feature can make the whole feature "limited". Reading only `status.baseline` can make an agent avoid something that works everywhere for the part it needs. `status.by_compat_key` gives each key's own status.

In web-features 3.43.0, `anchor-positioning` is `baseline: false` and its feature-level `support` lists only `{"safari":"27","safari_ios":"27"}`. Yet 323 of its 325 keys are newly available, most since Firefox 147 (2026-01-13); `position-anchor` only since 2026-09-14, as BCD marks Chrome 125–150 partial for its initial value. The two that aren't are `css.properties.position-visibility.anchor-valid` and `.anchor-visible`, which only Safari 27 has.

```bash
jq -c '.features["anchor-positioning"].status.by_compat_key | to_entries
  | map(select(.value.baseline == false)) | map(.key)' data.json
```

Lint rules work per key, so they agree with the keys, not the feature: `@eslint/css`'s `use-baseline` passes `anchor-name`, `position-anchor` and `position-area` at `available: "newly"` (CSS-012). Which parts behave the same in all three engines is CSS-017.

## [CSS-004] browserslist Baseline queries, and the versions they gave on 2026-10-17
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [browserslist README](https://raw.githubusercontent.com/browserslist/browserslist/main/README.md), [browserslist CHANGELOG](https://raw.githubusercontent.com/browserslist/browserslist/main/CHANGELOG.md), [web.dev: Use Baseline with Browserslist](https://web.dev/articles/use-baseline-with-browserslist), [baseline-browser-mapping](https://github.com/web-platform-dx/baseline-browser-mapping), npm registry (`npm view browserslist 'time[4.26.0]'`)
- Related: CSS-001, CSS-015, CSS-016

browserslist "Added Baseline queries" in 4.26.0 (2025-09-12), with the mapping from the `baseline-browser-mapping` package. The README's queries: `baseline widely available`, `baseline newly available`, `baseline widely available on YYYY-MM-DD`, `baseline 2022` (features "Baseline Newly available at the end of the specified year"), and `… with downstream` for Chromium- and Gecko-based browsers outside the core set. web.dev: "You can specify years from baseline 2015 to the current year."

The oldest version each query selected (browserslist 4.29.3, baseline-browser-mapping 2.11.29, caniuse-lite 1.0.30001816):

| Query | Chrome, Edge | Firefox | Safari, iOS |
|---|---|---|---|
| `baseline widely available` | 123 | 125 | 17.4 |
| `baseline widely available on 2025-10-01` | 111 | 111 | 16.4 |
| `baseline 2024` | 130 | 132 | 18.2 |
| `baseline 2025` | 141 | 145 | 26.2 |
| `baseline newly available` | 153 | 155 | 27 |
| `defaults` | Chrome 109, Edge 152 | 153 | 26.6, iOS 18.5 |

`baseline widely available` moves with today's date, so builds drift; baseline-browser-mapping recommends `baseline widely available on {YYYY-MM-DD}` for reproducible builds. Its data warns when "more than 2 months old".

Tested 2026-10-17, browserslist@4.29.3, Node 24.21.0: the table above, summarised from `browserslist(query)`. Android rows (`and_chr 154`, `and_ff 157`) list only the latest version, as caniuse tracks only that.

## [CSS-005] Widely available since 2025: use these without a fallback
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [web-features 3.43.0 `data.json`](https://cdn.jsdelivr.net/npm/web-features@3.43.0/data.json)
- Related: CSS-001, CSS-006, CSS-007, DESIGN-022

These became widely available between 2025-01-01 and 2026-10-17 (web-features 3.43.0, `baseline_high_date`), so a site targeting Baseline widely available needs no fallback for them. Agents trained on older material still reach for Sass, JavaScript or media queries instead.

| Feature (web-features ID) | Widely available | Replaces |
|---|---|---|
| `:has()` (`has`) | 2026-06-19 | A parent class toggled from JavaScript |
| Nesting (`nesting`) | 2026-06-11 | Sass or PostCSS nesting for plain nesting |
| `linear()` easing (`linear-easing`) | 2026-06-11 | JavaScript spring and bounce easing |
| `lh` and `rlh` units | 2026-05-21 | Line-height maths in `calc()` |
| `:user-valid`, `:user-invalid` (`user-pseudos`) | 2026-05-02 | Touched-state classes on form fields |
| Subgrid (`subgrid`) | 2026-03-15 | Duplicated grid tracks in children |
| `color-mix()`, Oklab and OkLCh | 2025-11-09 | Preprocessor colour functions |
| `:nth-child(… of <selector>)` | 2025-11-09 | Filtering in JavaScript |
| `inert` | 2025-10-11 | Focus-trap libraries for background content |
| Media query range syntax | 2025-09-27 | `min-width`/`max-width` pairs |
| Container size queries (`container-queries`) | 2025-08-14 | `ResizeObserver` and viewport breakpoints for components |
| `svh`, `lvh`, `dvh` (`viewport-unit-variants`) | 2025-06-05 | `100vh` hacks on mobile |
| `translate`, `rotate`, `scale` (`individual-transforms`) | 2025-02-05 | One combined `transform` |

Older and also safe: cascade layers (2024-09-14) and `<dialog>` (2024-09-14). Usage details for nesting, `:has()` and container queries are in CSS-007.

## [CSS-006] Newly available 2024–2026: dates, and when each becomes widely available
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [web-features 3.43.0 `data.json`](https://cdn.jsdelivr.net/npm/web-features@3.43.0/data.json), [web-features: docs/baseline.md](https://raw.githubusercontent.com/web-platform-dx/web-features/main/docs/baseline.md)
- Related: CSS-001, CSS-005, CSS-008, CSS-009, DESIGN-018

These work in the current release of every core browser but not in older ones still in use. Widely available follows 30 months after the newly available date (our arithmetic; the Firefox ESR condition can delay it).

| Feature | Newly available | Widely from about |
|---|---|---|
| `light-dark()` (colours; images only since 2026-09-14) | 2024-05-13 | 2026-11 |
| `text-wrap: balance` | 2024-05-13 | 2026-11 |
| `@property` (`registered-custom-properties`) | 2024-07-09 | 2027-01 |
| `@starting-style`, `transition-behavior` | 2024-08-06 | 2027-02 |
| Relative colours (`oklch(from …)`) | 2024-09-16 | 2027-03 |
| Popover | 2025-01-27 | 2027-07 |
| `content-visibility` | 2025-09-15 | 2028-03 |
| Same-document view transitions | 2025-10-14 | 2028-04 |
| Invoker commands (`command`, `commandfor`) | 2025-12-12 | 2028-06 |
| `shape()` | 2026-02-24 | 2028-08 |
| `@scope` | 2026-03-24 | 2028-09 |
| `contrast-color()` | 2026-04-10 | 2028-10 |
| `:open` | 2026-05-11 | 2028-11 |
| Container style queries | 2026-05-19 | 2028-11 |
| `field-sizing` | 2026-06-16 | 2028-12 |
| `sibling-index()`, `sibling-count()` | 2026-08-18 | 2029-02 |

The last browser to ship each was usually Firefox or Safari; for example `@property` waited for Firefox 128 and `field-sizing` for Firefox 152. Usage traps are in CSS-008 and CSS-009, and for `light-dark()` in DESIGN-018.

On a site whose audience may run browsers older than about 2.5 years, use these behind `@supports` or as enhancements (CSS-011).

## [CSS-007] Nesting, `:has()` and container queries: the rules that fail silently
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [MDN: Using CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Nesting/Using), [MDN: Nesting and specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Nesting/Nesting_and_specificity), [MDN: `:has()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has), [MDN: `container-type`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/container-type), [MDN: `@container`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@container) (raw from mdn/content)
- Related: CSS-005, CSS-009

All three are widely available (CSS-005); what breaks them is Sass habits and missing setup.

**Nesting.**
- Compound selectors need `&`: "the browser will automatically add whitespace between selectors that do not use the `&` nesting selector", so `.a { :hover {} }` means `.a *:hover`.
- No Sass concatenation: `&__child` "is not possible in CSS nesting".
- `&` takes `:is()` specificity: "the largest specificity in the associated selector list", so `#a, b { & i {} }` weighs 1-0-1.
- `&` "cannot represent pseudo-elements", and "If a nested CSS rule is invalid then all of the enclosed styles will be ignored."

**`:has()`.** It "cannot be nested within another `:has()`" and takes no pseudo-elements. Outside `:is()` or `:where()` an unsupported `:has()` drops the whole rule. Anchor it narrowly: the `A` in `A:has(B)` "should not be an element that has too many children, like `body`, `:root`, or `*`".

**Container queries.** The ancestor needs `container-type: inline-size` (or `size`); the default `normal` only answers name-only and style queries. Queries style descendants, never the container itself. Its size "has to be set by context… If a contextual or explicit size is not available, elements with size containment will collapse." Without a container, `cqi` and the other units fall back to `sv*` units.

```css
.post { container-type: inline-size; }
@container (width > 700px) { .card h2 { font-size: max(1.5em, 1.23em + 2cqi); } }
```

## [CSS-008] Popover, `<dialog>`, invoker commands and `@starting-style` instead of JavaScript
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [MDN: Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API), [MDN: Using the Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using), [MDN: `popover`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover), [MDN: `<button>` `command`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button), [MDN: `@starting-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style), [MDN: `overlay`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overlay) (raw from mdn/content), web-features 3.43.0
- Related: CSS-006, CSS-007, CSS-010

Menus, tooltips and modals no longer need a JavaScript library. Statuses from web-features 3.43.0: `<dialog>` widely available; popover (2025-01-27), invoker commands (2025-12-12), `@starting-style` and `transition-behavior` (2024-08-06) newly available.

- **Popover or dialog.** "Popovers created using the Popover API are always non-modal… a `<dialog>` element is the right way to go" for modal; `<dialog popover>` combines both. `popover` (= `auto`) light-dismisses on outside click or Esc; `manual` doesn't. Popovers sit in the top layer, unaffected by ancestors' `overflow`.
- **No script to open them.** `<button commandfor="d" command="show-modal">`, with `close`, `request-close`, `show-popover`, `hide-popover`, `toggle-popover` or a custom `--name`. `popovertarget` also gives "an implicit `aria-details` and `aria-expanded` relationship".
- **Animating open and close** needs all of: `@starting-style` placed *after* the open-state rule ("the original styles will override the starting styles"), `display … allow-discrete` (without it "the popover would just disappear"), and `overlay … allow-discrete`.

The trap: `overlay` is Chrome-only (web-features `baseline: false`, Chrome 117). MDN: it defers the top-layer removal "so it can be animated instead of disappearing immediately", and without it, in "more complex cases", the element can leave the top layer "too quickly". So treat exit animations as an enhancement in Firefox and Safari; the entry animation doesn't depend on it (not tested).

A bare `<div popover>` gets no dialog role; adding semantics (`<dialog popover>` or a `role`) is our inference, not an MDN statement.

## [CSS-009] `@scope`, `@property`, relative colours, `field-sizing`, view transitions: one trap each
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [MDN: `@scope`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@scope), [MDN: `@property`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@property), [MDN: Registering properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Properties_and_values_API/Registering_properties), [MDN: Using relative colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Colors/Using_relative_colors), [MDN: `color-mix()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/color-mix), [MDN: `field-sizing`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/field-sizing), [MDN: `view-transition-name`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-transition-name) (raw from mdn/content), [Chrome: same-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/same-document)
- Related: CSS-006, CSS-007, DESIGN-016

All newly available (CSS-006 has the dates).

| Feature | What it adds | Trap (MDN unless noted) |
|---|---|---|
| `@scope (.a) to (.b)` | A lower bound ("donut") and proximity, which "overrules source order" | Not isolation: inherited properties still cross the bound. Bare selectors act "as if `:where(:scope)` were prepended", unlike nesting's `:is()` weight, and "`&` inside `@scope` blocks is handled differently according to the browser engine" |
| `@property --x` | A typed property that interpolates (animated gradients, counters) | Missing `syntax` or `inherits`, or a missing or relative (`3em`) `initial-value`: "the entire `@property` rule is invalid and ignored" |
| `oklch(from var(--c) calc(l + 0.1) c h)` | Derived shades without a preprocessor | Channels are numbers: "`calc(l + 20%)`… would result in an invalid color" |
| `color-mix()` | Mixing, default space `oklab` | If the percentages sum under 100%, "an alpha multiplier… is applied" |
| `field-sizing: content` | Inputs and textareas that grow | Set `min-width`/`max-width`; a fixed `width`/`height` "reimpose[s] a fixed size" |
| `document.startViewTransition()` | Animated DOM swaps | Duplicate `view-transition-name`s: "the transition will be skipped". Feature-detect `document.startViewTransition`; Chrome's docs add a `prefers-reduced-motion` block |

Without `@property` support a custom property animates discretely, as a jump (MDN: unregistered values "are animated discretely").

## [CSS-010] Not Baseline on 2026-10-17: what each feature does without support
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [web-features 3.43.0 `data.json`](https://cdn.jsdelivr.net/npm/web-features@3.43.0/data.json), [BCD `animation-timeline.json` (main)](https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/properties/animation-timeline.json), [mdn/browser-compat-data#30856](https://github.com/mdn/browser-compat-data/pull/30856), [MDN: Firefox 159](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/159), [MDN: `if()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/if), [MDN: Customizable select](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select), [MDN: Using interest invokers](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using_interest_invokers), [MDN: `text-wrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-wrap), [WebKit: `text-wrap: pretty`](https://webkit.org/blog/16547/better-typography-with-text-wrap-pretty/)
- Related: CSS-003, CSS-011, CSS-014, CSS-017, DESIGN-020

web-features 3.43.0 (2026-10-15); every row is `baseline: false`.

| Feature | Has it | Without support |
|---|---|---|
| Scroll-driven animations (`animation-timeline: scroll()`) | Chrome 115, Safari 26; Firefox 159 in BCD `main` | It plays once on the time-based timeline instead. MDN sets `animation-duration: 1ms` so it "will not be visible" there, or gate the block with `@supports (animation-timeline: scroll())` |
| Cross-document view transitions (`@view-transition { navigation: auto }`) | Chrome 126, Safari 18.2 | Ignored: a normal page load. Safe unguarded |
| Customizable `<select>` (`appearance: base-select`, `::picker(select)`) | Chrome 135, Safari 27 | The native select: "falling back to 'classic' selects". `select, ::picker(select) {…}` is dropped whole where `::picker` is unknown; keep them in separate rules |
| `text-wrap: pretty` | Chrome 117, Safari 26 | Normal wrapping. Chromium adjusts only "the last four lines" (WebKit); "negative effect on performance" (MDN) |
| `if()` | Chrome 137 | "does not gracefully degrade": declare a plain value first |
| Typed `attr()` | Chrome 133, Firefox 155 | Declare a fallback value first |
| Interest invokers (`interestfor`) | Chrome 142 | A link "behaves like a normal link"; keep essential content off hover-only popovers |
| `<dialog closedby>` | Chrome 134, Firefox 141 | Ignored; close it with a button |

Anchor positioning's core works in all three (CSS-017). Scroll-driven animations are next: mdn/browser-compat-data#30856 (merged 2026-10-15) set `animation-timeline` to Firefox `"159"`, which MDN says "ships on October 27, 2026"; its release notes didn't list it yet.

## [CSS-011] Progressive enhancement with `@supports`: patterns and blind spots
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [MDN: `@supports`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@supports), [MDN: Selector list](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Selector_list), [MDN: Scroll-driven animation timelines](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations/Timelines), [MDN: `if()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/if), [MDN: `:has()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has), [BCD `css/at-rules/supports.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/at-rules/supports.json), [Chrome: anchor positioning](https://developer.chrome.com/docs/css-ui/anchor-positioning-api)
- Related: CSS-010, CSS-012, CSS-017

Write the baseline style first, then the enhancement where only supporting browsers see it.

- **Declarations fall back by order.** An unknown property or value is dropped, so an earlier plain value stays: `padding: 1em; padding: if(…)`. `if()` needs this: it "does not gracefully degrade".
- **Rules need a guard,** on the property you actually use: `@supports (anchor-name: --a)` (Chrome's docs; `position-area` needs its own test, CSS-017), `@supports (animation-timeline: scroll())` and `@supports not (appearance: base-select)` (MDN). `@supports selector(:has(a))` checks a selector (Chrome 83, Firefox 69, Safari 14.1).
- **Selector lists fail whole.** "When a selector list contains an invalid selector, the entire style block is ignored", so don't group `::picker(select)` or an unsupported `:has()` with other selectors; `:is()` and `:where()` lists are forgiving.
- **Don't guard with `@supports at-rule(…)`.** BCD: Chrome 148, Firefox 157, Safari "preview". A browser without `at-rule()` treats the test as unknown, so false, even where the at-rule works (our reading of `@supports`; not tested). Unknown at-rules such as `@view-transition` are ignored anyway.
- **Shorthands reset longhands.** "the `animation` shorthand sets the `animation-timeline` to `auto`", so put `animation-timeline` after it.
- **Motion.** For scroll-driven animations MDN says "always take any user's `prefers-reduced-motion` preference into account" and shows `animation-timeline: none` under `@media (prefers-reduced-motion: reduce)`.

`@eslint/css`'s `use-baseline` accepts a feature inside a matching `@supports` block (CSS-012), so a guarded enhancement passes the lint.

## [CSS-012] ESLint's `css/use-baseline` (`@eslint/css`): setup for Tailwind 4, and what it misses
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [@eslint/css README](https://github.com/eslint/css/blob/main/README.md), [use-baseline rule docs](https://raw.githubusercontent.com/eslint/css/main/docs/rules/use-baseline.md), [Angular: component styling](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/guide/components/styling.md), npm registry (`npm view @eslint/css@2.0.1 engines devDependencies`)
- Related: CSS-003, CSS-011, CSS-013, CSS-015, DESIGN-024

The ESLint team's CSS plugin. `use-baseline` is in `css/recommended`; `available` is `"widely"` (default), `"newly"` or a year; `allowAtRules`, `allowFunctions`, `allowMediaConditions`, `allowProperties`, `allowPropertyValues`, `allowSelectors` and `allowUnits` exempt features. A feature inside a matching `@supports` passes. For Tailwind the README adds `tailwind-csstree`:

```js
// eslint.config.js, beside the TypeScript and template blocks
import css from "@eslint/css";
import { tailwind4 } from "tailwind-csstree";
export default [{ files: ["**/*.css"], plugins: { css }, language: "css/css",
  languageOptions: { customSyntax: tailwind4 },
  rules: { "css/use-baseline": ["error", { available: "widely", allowSelectors: ["host-context"] }] } }];
```

Its data is a snapshot of web-features (a devDependency, `^3.42.0` in 2.0.1), checked per compat key (CSS-003).

Tested 2026-10-17, eslint@10.13.0, @eslint/css@2.0.1, tailwind-csstree@0.4.1, Node 24.21.0:
- Flagged at `widely`: `@scope`, `@starting-style`, `field-sizing`, anchor properties, `animation-timeline`, `text-wrap: pretty`/`balance`, `@view-transition`, `base-select`, `light-dark()`, `@property`, `:popover-open`; not `:has()`, nesting or `@container`. At `newly`, only `animation-timeline`, `pretty`, `@view-transition` and `base-select` remained; the anchor properties passed.
- Tailwind's `@custom-variant` without `tailwind4`: a parsing error and nothing else checked. `if()`: the same error; `tolerant: true` hides it and `if()` passes unreported.
- Declarations inside `@utility` weren't checked. The rule visits only `Rule > Block > Declaration` (`dist/rules/use-baseline.js`), so `@position-try` and other at-rule blocks are skipped too.
- `:host-context()` is flagged, though Angular's emulated encapsulation compiles it to attributes; hence `allowSelectors`.
- It reads stylesheets only, not utility classes in templates (inferred).

## [CSS-013] Other Baseline linters: stylelint, HTML, JavaScript, and browserslist-based `compat`
- Type: comparison
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-17
- Sources: [stylelint-plugin-use-baseline README](https://raw.githubusercontent.com/ryo-manba/stylelint-plugin-use-baseline/main/README.md), [html-eslint `use-baseline`](https://raw.githubusercontent.com/yeonjuan/html-eslint/main/docs/rules/use-baseline.md), [eslint-plugin-baseline-js README](https://raw.githubusercontent.com/3ru/eslint-plugin-baseline-js/main/README.md), [eslint-plugin-compat README](https://raw.githubusercontent.com/amilajack/eslint-plugin-compat/main/README.md), npm registry (`npm view <pkg>@<version> peerDependencies`, 2026-10-17)
- Related: CSS-004, CSS-012

Each is described by its own README only (hence single-source), and none was run here: CLAUDE.md keeps community code out of tests.

| Package (version) | Lints | Peers | Notes |
|---|---|---|---|
| `stylelint-plugin-use-baseline` 1.4.7, rule `plugin/use-baseline` | CSS in stylelint | stylelint `^16.0.2 \|\| ^17.0.0` | `available` widely (default), newly or a year; `ignoreSelectors`, `ignoreProperties` and the like take strings or `/regex/`. Also reports "Unnecessary `@supports` blocks" |
| `@html-eslint/eslint-plugin` 0.67.0, rule `@html-eslint/use-baseline` | HTML elements, attributes, values | ESLint `>=8.0.0 \|\| ^10.0.0-0` | Same `available` option |
| `eslint-plugin-baseline-js` 0.7.5, rule `baseline-js/use-baseline` | JavaScript | ESLint `>=9.29.0 <11` | Delegates to `eslint-plugin-es-x`; "hasn't reached a major release yet, so behavior and options may change" |
| `eslint-plugin-compat` 7.0.2 | Web APIs in JavaScript | ESLint `^9.0.0 \|\| ^10.0.0` | Not Baseline: reads browserslist, default `"> 0.5%, last 2 versions, Firefox ESR, not dead"`; a Baseline query there (CSS-004) bridges the two |

For CSS in an ESLint repo, prefer the official `@eslint/css` (CSS-012): no second linter to configure. stylelint's plugin suits repos already on stylelint.

## [CSS-014] Interop 2026: what it targets, and what the 2025 round predicts
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Interop 2026 README](https://raw.githubusercontent.com/web-platform-tests/interop/main/2026/README.md), [Interop 2025 README](https://raw.githubusercontent.com/web-platform-tests/interop/main/2025/README.md), [Interop 2026 dashboard](https://wpt.fyi/interop-2026), web-features 3.43.0, commit dates from `gh api repos/web-platform-tests/interop/commits?path=2026/README.md`
- Related: CSS-006, CSS-010, CSS-017

Interop is the yearly pact between Apple, Google, Microsoft, Mozilla, Bocoup and Igalia to fix chosen areas in every engine. The 2026 focus areas went up on 2026-02-12.

**2026 CSS and HTML focus areas**, with web-features 3.43.0 status:
- Already newly available: container style queries (2026-05-19), `contrast-color()` (2026-04-10), `shape()` (2026-02-24), custom highlights (2026-03-24), `:open` (2026-05-11), `zoom`.
- Not yet: anchor positioning (a carry-over from 2025; CSS-017), scroll-driven animations (Firefox 159 per BCD, CSS-010), cross-document view transitions, `blocking="render"`, `<link rel="expect">`, typed `attr()`, `<dialog closedby>`, `popover="hint"`, media pseudo-classes (`:playing`, `:paused`…), unprefixed `user-select`.
- Also in: scroll snap, Navigation API, scoped custom element registries, fetch uploads, IndexedDB, JSPI, WebRTC, WebTransport.

**Track record.** Of Interop 2025's areas (launched 2025-02-13), `@scope` became newly available 2026-03-24, view transitions 2025-10-14, the Navigation API 2026-01-13, `scrollend` 2025-12-12, URLPattern 2025-09-15 and `::details-content` 2025-09-16.

**Prediction** (our inference from that record): the 2026 areas still missing an engine will mostly ship in it by early to mid 2027. Plan for them, but until web-features says newly available, ship them as enhancements (CSS-011).

## [CSS-015] Tailwind CSS 4: browser floor, the CSS it relies on, and its fixed Lightning CSS targets
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Tailwind: Compatibility](https://raw.githubusercontent.com/tailwindlabs/tailwindcss.com/main/src/docs/compatibility.mdx), [Tailwind: Upgrade guide](https://raw.githubusercontent.com/tailwindlabs/tailwindcss.com/main/src/docs/upgrade-guide.mdx), [Tailwind CSS v4.1 post](https://tailwindcss.com/blog/tailwindcss-v4-1), [tailwindcss CHANGELOG](https://raw.githubusercontent.com/tailwindlabs/tailwindcss/main/CHANGELOG.md), source at v4.3.3: [`optimize.ts`](https://raw.githubusercontent.com/tailwindlabs/tailwindcss/v4.3.3/packages/@tailwindcss-node/src/optimize.ts), [`@tailwindcss/postcss`](https://raw.githubusercontent.com/tailwindlabs/tailwindcss/v4.3.3/packages/@tailwindcss-postcss/src/index.ts)
- Related: CSS-004, CSS-006, CSS-016, DESIGN-023

**Floor.** "Tailwind CSS v4.0 is designed for Safari 16.4+, Chrome 111+, and Firefox 128+. If you need to support older browsers, stick with v3.4" (upgrade guide; v3 has the `v3-lts` dist-tag, 3.4.19). "We depend on modern CSS features like `@property` and `color-mix()`… Tailwind CSS v4.0 will not work in older browsers." Unchanged through 4.3.3 (latest, 2026-07-16).

**Softened in 4.1.0** (2025-04-01): "Improve compatibility with older versions of Safari and Firefox": `oklab` colours, `@property`-based shadows, transforms and gradients, and opacity modifiers (inlined `color-mix()` fallbacks) now work there, so sites "render and be usable in older browsers" such as Safari 15, while v4 "is still _designed_ for modern browsers like Safari 16.4 and up".

**What it relies on:** cascade layers, `@property`, `color-mix()`, an OKLCH palette. Its utilities also expose newly available features (`field-sizing: content`, `@starting-style`), which the docs leave "up to you".

**Lightning CSS** (prefixes, nesting and media-range lowering) runs with hard-coded targets `safari 16.4, ios_saf 16.4, firefox 128, chrome 111`, not your browserslist. `@tailwindcss/postcss` runs it only when `optimize ?? process.env.NODE_ENV === 'production'`.

The 4.1 claim is Tailwind's own, shown on Safari 15.5; no Firefox 119–127 test was found. Against Baseline: `@property` reached Firefox in 128 (2024-07-09), so Tailwind 4's Firefox floor is newer than `baseline widely available` (Firefox 125 on 2026-10-17, CSS-004) until about 2027-01.

## [CSS-016] Angular CLI: browser targets are Baseline widely available on a fixed date, and esbuild lowers CSS to them
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [angular.dev: Versions, browser support](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/reference/versions.md), [angular.dev: Building](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/tools/cli/build.md), [angular-cli CHANGELOG 20.0.0](https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md), [`@angular/build@22.2.3` `supported-browsers.js`](https://cdn.jsdelivr.net/npm/@angular/build@22.2.3/src/utils/supported-browsers.js)
- Related: CSS-004, CSS-015, NG-002

Since 20.0.0 (2025-05-28, "expand browser support policy to widely available Baseline") Angular "supports browsers included in the Baseline of a chosen date near the release date": v20 2025-04-30, v21 2025-10-20, v22 2026-05-07. `@angular/build@22.2.3` sets `browserslist.defaults` to `baseline widely available on 2026-05-07`, which resolved to Chrome and Edge 119, Firefox 119 and Safari 17.0 (browserslist 4.29.3). v21's date gives Chrome 111, Firefox 112, Safari 16.4.

To change it, `ng generate config browserslist` writes a `.browserslistrc`; "You should only ever _reduce_ the set". A wider set builds, with a warning that browsers "fall outside Angular's browser support".

CSS: "Angular will automatically transform certain JavaScript and CSS features… However, the Angular CLI will not automatically add polyfills". `@angular/build@22.2.3` depends on esbuild 0.28.2 and on neither autoprefixer nor lightningcss.

Tested 2026-10-17, esbuild@0.28.2, Node 24.21.0, `--target=chrome119,firefox119,safari17,ios17`: nesting was flattened and `-webkit-user-select` and `-webkit-mask-image` added; `oklch()`, `color-mix()` and `:has()` passed unchanged. At Safari 17.2 the nesting stayed.

With `@tailwindcss/postcss`, Tailwind's own Lightning CSS pass runs only if `NODE_ENV` is `production` (CSS-015); a grep of `@angular/build` and `@angular/cli` 22.2.3 found no `NODE_ENV`, so esbuild likely does the lowering (not confirmed with `ng build`).

## [CSS-017] Anchor positioning on 2026-10-17: the core that works everywhere, and the gaps
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: BCD at `main`, 2026-10-17: [`position-area.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/properties/position-area.json), [`position-try-fallbacks.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/properties/position-try-fallbacks.json), [`position-visibility.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/properties/position-visibility.json); [Chrome: anchor positioning API](https://developer.chrome.com/docs/css-ui/anchor-positioning-api), [oddbird/css-anchor-positioning README](https://github.com/oddbird/css-anchor-positioning), web-features 3.43.0
- Related: CSS-003, CSS-010, CSS-011, CSS-014

Anchor positioning reached all three engines with Firefox 147 (2026-01-13), after Chrome 125 and Safari 26. Some values came later or were renamed.

**Use without worry** (Chrome 129, Firefox 147, Safari 26): `anchor-name`, `position-anchor: --name` (always name it: web-features dates `position-anchor` 2026-09-14 because its initial value differed until Chrome 151, Firefox 151 and Safari 27), `anchor()`, `anchor-size()`, `@position-try`, `position-try-fallbacks: flip-block, flip-inline`, and two-keyword `position-area` values (`top center`, `block-end span-inline-end`).

**Needs newer versions:**
- Single-keyword `position-area` (`top`, `block-end`, `span-all`…): Chrome 144 (2026-01-13), Firefox 148 (2026-02-24). BCD marks Chrome 129–143 and Firefox 147 partial: a lone `block-end` "unexpectedly allows the anchored box to overflow the viewport".
- `position-try-fallbacks: flip-x`/`flip-y`: Chrome 144, Firefox 147, Safari 26.2.
- `position-visibility: anchor-valid`, `anchor-visible`: Safari 27 only; this is what keeps the feature `baseline: false` (CSS-003).
- Old names: `inset-area` (Chrome 125–130), `position-try-options` (Chrome 125–127).

**Older browsers.** Wrap it in `@supports` with a plain absolute or static position outside. Test the property you use: Chrome 125–128 pass `@supports (anchor-name: --a)` but lack `position-area`, so use `@supports (position-area: center)` with it. The oddbird polyfill (0.10.2, 2026-08-18) loads only where `anchorName` is missing, but lacks `position-try-order`, `position-visibility`, `anchor-center` and implicit anchors.

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-17 against `main` of osrs-tracker-web and freek-mencke-web (Angular 22, Tailwind 4 through `@tailwindcss/postcss`, ESLint 10, no stylelint, no browserslist file).

1. **Tie CSS feature choice to Angular's Baseline date in the `angular-conventions` skill** (CSS-016, CSS-006, CSS-011, CSS-002). Anything widely available on the major's date (v22: 2026-05-07) is free to use; anything newer, such as `light-dark()`, `@starting-style`, popover exit animations, `@scope`, `field-sizing` or scroll-driven animations, only behind `@supports` or with a fallback; check with `curl -s https://api.webstatus.dev/v1/features/<id>`. One line covers template classes too, which no linter sees. Issue: FreekMencke/claude-skills#81.
2. **Keep Angular's default browser targets; add no `.browserslistrc`** (CSS-016, CSS-015). Angular 22's Firefox 119 is below Tailwind 4's documented 128, but Tailwind's Lightning CSS targets ignore browserslist anyway, 4.1+ ships fallbacks it says keep older browsers "usable" (its own claim, shown on Safari 15.5), and Angular's docs say to "only ever _reduce_" the set.
3. **Won't do now: `css/use-baseline` in the apps** (CSS-012, CSS-013). Their CSS is mostly template classes and `@utility` blocks, which the rule doesn't check, and Angular's `:host-context()` needs an exemption. It's worth adding only once a repo has hand-written plain CSS in component or global stylesheets. A stylelint plugin would add a second linter for the same gap.
4. **Won't do now: replace osrs-tracker-web's CDK Overlay tooltip with `popover` and anchor positioning** (CSS-017, CSS-008, CSS-016). Anchor positioning is in all engines only since 2026-01-13, after Angular 22's Baseline date, so the CDK path would have to stay as the fallback. Revisit when it's widely available (no earlier than 2029-03, as `position-anchor` dates from 2026-09-14) or when a new tooltip or menu is built.

## Open questions

- **Scroll-driven animations in Firefox 159** (CSS-010): BCD says 159, due 2026-10-27, but its release notes didn't list it on 2026-10-17. Re-check the notes and the next web-features release after that date.
- **Does Tailwind's Lightning CSS pass run in `ng build`?** (CSS-016): neither `@angular/build` nor `@angular/cli` 22.2.3 sets `NODE_ENV`; whether our Docker or CI builds set it, and an end-to-end `ng build`, weren't checked.
- **`@supports` detection in Firefox and Safari** of `selector(::picker(select))`, `(text-wrap: pretty)` and `if()` wasn't tested (no browsers in the session); no primary source addresses them.
- **Accessibility of a bare `popover`** (CSS-008): no MDN or Chrome statement on what roles it lacks; HTML-AAM wasn't read.
- **Which layouts collapse an `inline-size` container** (CSS-007): MDN only says "collapse".
- **webstatus.dev's stability** (CSS-002): its OpenAPI is `version: 0.1.0`, with no rate limit or deprecation policy found.
- **Lighthouse's Baseline audit** (announced 2026-07-27): whether it can gate CI headlessly isn't documented.
- **`tailwind-csstree` and `@utility`** (CSS-012): whether skipping declarations in `@utility` is intended in 0.4.1 or a gap to report upstream.
