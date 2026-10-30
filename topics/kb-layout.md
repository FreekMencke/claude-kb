# Page layout: grids, breakpoints, widths, density and page types

Prefix `LAYOUT`. This file covers what established design systems prescribe for the page and its regions: column grids, gutters and margins, breakpoints, page and text widths, density, and the usual layout per page type. It also covers the responsive mechanics behind them: container queries against media queries, intrinsic grids and flex layouts, subgrid, visual order against DOM order, Angular CDK's `BreakpointObserver` under SSR, and the reading research that decides where content goes. Layout vocabulary and Every Layout's primitives are in DESIGN-022, line length in DESIGN-020, CSS support in CSS-005 to CSS-007, data tables in VIZ-016 and VIZ-017. Spacing scales and alignment inside components are a separate topic (FreekMencke/claude-kb#300).

Research basis:
- Researched 2026-10-28 (FreekMencke/claude-kb#299) by an Opus 5.5 lead with two Sonnet 5.5 readers: design systems (151k tokens, 75 tool calls, 7.8 min) and responsive mechanics and reading (177k tokens, 73 tool calls, 9.9 min). Then a Sonnet refuter (111k tokens, 46 tool calls, 6.0 min) and a Sonnet review panel of three personas: UI designer (77k, 5, 1.2 min), front-end engineer (99k, 6, 2.0 min) and accessibility (86k, 6, 1.3 min).
- Read as raw text: design-system sources at pinned tags (Bootstrap v5.3.8, Tailwind CSS v4.3.3, govuk-frontend v6.6.0, Carbon v11.119.0 and carbon-website `5e9cd1d`, Polaris `3f7954a`, Primer design `87f799f`, angular/components v22.2.4, angular/angular v22.2.3 guides), the GOV.UK Design System's Markdown sources, MDN content, CSSWG drafts, WCAG 2.2 Understanding pages, web.dev, Every Layout and NN/g (HTML stripped of tags). m3.material.io, atlassian.design and fluent2.microsoft.design render in JavaScript: read as the page text rendered by headless Chromium (Playwright), then grepped. Apple's HIG from its JSON. Baseline statuses from `api.webstatus.dev`.
- Tested in a scratch page with Playwright 1.64.1 (Chromium 156.0.8078.4 headless shell and WebKit 27.2) at 320, 768, 1024 and 1440 px, and in a scratch Angular 22.2.3 app (`@angular/build` 22.2.4, `@angular/cdk` 22.2.4, SSR with prerender) on Node 24.21.0. No community code was installed or run.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| How many columns, how wide a gutter and margin? | No shared answer: Carbon 4/8/16, Atlassian 2/6/12, Bootstrap 12; gutters 12–32 px (Carbon condensed: 1 px). They agree on one column on phones; margins are 15–16 px on phones in Material, Atlassian and GOV.UK (Carbon 0 at its smallest size, 16 above), and 24–32 px on large screens. | LAYOUT-001, LAYOUT-003 |
| Which breakpoints should I use? | Your framework's (Tailwind 640/768/1024/1280/1536 px). Systems cluster near 600, 768, 1024 and 1200–1280 px; Material 3 is 600/840/1200/1600 dp. Design for window sizes, not devices, and test at 320 px. | LAYOUT-002, LAYOUT-003 |
| How wide should the page and the text column be? | `max-width` (never `width`) near 1200–1320 px for structured pages (Atlassian 1296, Primer 1280, Bootstrap 1320; GOV.UK 960 and Carbon 1584 are the outliers); reading pages narrower (Atlassian 864; GOV.UK's two-thirds column, "no more than 75 characters per line"). Full width only for boards and dense tools. | LAYOUT-004 |
| When should a UI be compact (dense)? | Convention: for scanning and comparing (tables, lists, dashboards), as a user opt-in that doesn't change by breakpoint; not for focused tasks, menus, dialogs or alerts. WCAG requirement (2.5.8): targets 24×24 CSS px, or spaced so a 24 px circle on each touches no other; Material's default is 48. | LAYOUT-005, LAYOUT-006, LAYOUT-017 |
| Which WCAG criteria constrain a layout? | 1.4.10 reflow at 320 CSS px wide (data tables, maps and toolbars excepted), 1.4.4 resize to 200%, 1.4.12 text spacing without clipping (`min-height`, not `height`), 2.5.8 target size, 2.4.11 focus not hidden under sticky regions, 1.3.2 and 2.4.3 reading and focus order. | LAYOUT-017, LAYOUT-014 |
| What does Angular Material's density setting do? | `density: 0` to `-5` removes 4 px per step, but each component clamps (button at -3, table at -4), and buttons drop their 48 px touch target from -2. | LAYOUT-006 |
| What layout for a dashboard, settings page, list or form? | Dashboard: capped (Atlassian 1296) for structured content, fluid only for dense data tools (Carbon high-density): choose once. Settings: annotated sections. List-detail: one pane under 840 dp, two above. Article: narrow column. Form: one column (NN/g); one question per page for long or high-stakes transactions (GOV.UK); primary button left on full-page forms (GOV.UK, Carbon, Atlassian). | LAYOUT-007, LAYOUT-008 |
| Container query or media query? | Container queries for components that appear in different places; media queries for page structure (navigation, sidebar or drawer). Most sites need both. | LAYOUT-009 |
| Why did my container collapse to 0 px? | `container-type: inline-size` sizes the box as if it had no content: anything sized by its content (a `flex: none` item, an inline-block, an absolute box) is 0 px wide. Give it a width from context. | LAYOUT-010 |
| `auto-fit` or `auto-fill`, and why does my grid overflow on phones? | `auto-fit` stretches few items to fill the row; `auto-fill` keeps empty tracks. Wrap the minimum in `min(100%, X)` or it overflows below X. | LAYOUT-011 |
| How do I lay out without breakpoints? | Intrinsic grid (`repeat(auto-fit, minmax(min(100%, X), 1fr))`), Every Layout's Switcher and Sidebar, `clamp()` widths; keep a breakpoint for page-level changes. | LAYOUT-011, LAYOUT-012 |
| How do I align card footers or form fields across siblings? | Subgrid: each card spans the rows and takes `grid-template-rows: subgrid`. Widely available since 2026-03-15. | LAYOUT-013 |
| Can I reorder content with grid areas or `order`? | Visually only; tab and screen-reader order follow the DOM. `reading-flow` changes Tab order only in Chromium 137+. Write the DOM in reading order. | LAYOUT-014 |
| Should an Angular SSR app use `BreakpointObserver` for layout? | No: the server matches no query, so it renders one layout and phones swap it after hydration (CLS 0.206 in our test page; a CSS version scored 0). Use CSS. | LAYOUT-015 |
| Where should the important content go? | Top and the start side (left in left-to-right languages): 80% of desktop fixations on the left half, 57% of viewing time above the fold (NN/g). Use real headings; we found no measured support for a Z-pattern on web pages. | LAYOUT-016 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| LAYOUT-001 | Column grids: columns, gutters and margins across design systems | comparison | grid, columns, gutters, margins, design-systems |
| LAYOUT-002 | Breakpoints across design systems, and where they cluster | comparison | breakpoints, media-queries, window-size-classes, design-systems |
| LAYOUT-003 | Layout defaults the design systems share, and the choices they leave | recommendation | defaults, grid, breakpoints, margins, mobile-first |
| LAYOUT-004 | Page and text widths: max-widths, reading columns and full bleed | comparison | max-width, container, line-length, full-bleed |
| LAYOUT-005 | Density: when a compact layout is right | recommendation | density, compact, data-tables, target-size |
| LAYOUT-006 | Angular Material density: the scale, per-component clamps and touch targets | fact | angular-material, density, touch-target, theming |
| LAYOUT-007 | Page types: dashboard, settings and list-detail | pattern | page-types, dashboard, settings, list-detail, canonical-layouts |
| LAYOUT-008 | Page types: article, landing page and form | pattern | page-types, article, landing-page, forms, primary-button |
| LAYOUT-009 | Container queries or media queries: which responds to what | recommendation | container-queries, media-queries, components, page-layout |
| LAYOUT-010 | `container-type: inline-size`: zero width when shrink-to-fit, and what it doesn't do | fact | container-queries, containment, collapse, stacking-context |
| LAYOUT-011 | Intrinsic grids: `auto-fit` against `auto-fill`, and `min(100%, X)` | pattern | css-grid, auto-fit, auto-fill, minmax, overflow |
| LAYOUT-012 | Switcher and Sidebar: flex layouts that switch without breakpoints | pattern | flexbox, every-layout, switcher, sidebar, intrinsic |
| LAYOUT-013 | Subgrid for card internals and form rows | pattern | subgrid, cards, forms, alignment |
| LAYOUT-014 | Visual order against DOM order, and `reading-flow` | fact | reading-order, focus-order, grid-template-areas, reading-flow, wcag |
| LAYOUT-015 | Angular CDK `BreakpointObserver` under SSR: one layout from the server, a shift on phones | anti-pattern | angular, cdk, breakpointobserver, ssr, hydration, cls |
| LAYOUT-016 | Reading patterns that change a layout: F, layer-cake, left half, top of page | fact | eye-tracking, f-pattern, layer-cake, nngroup, above-the-fold |
| LAYOUT-017 | WCAG requirements that constrain a layout | recommendation | wcag, reflow, text-spacing, target-size, sticky, focus-not-obscured |

## [LAYOUT-001] Column grids: columns, gutters and margins across design systems
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [Carbon 2x Grid overview @5e9cd1d](https://github.com/carbon-design-system/carbon-website/blob/5e9cd1da43c32d3d3b991dc947b427f674da61a8/src/pages/elements/2x-grid/overview.mdx), [Carbon grid config v11.119.0](https://github.com/carbon-design-system/carbon/blob/v11.119.0/packages/grid/scss/_config.scss), [Atlassian: grid](https://atlassian.design/foundations/grid), [Material 3: compact window](https://m3.material.io/foundations/layout/breakpoints/compact), [govuk-frontend `_measurements.scss` v6.6.0](https://github.com/alphagov/govuk-frontend/blob/v6.6.0/packages/govuk-frontend/src/govuk/settings/_measurements.scss), [Fluent 2: layout](https://fluent2.microsoft.design/layout), [Bootstrap `_variables.scss` v5.3.8](https://github.com/twbs/bootstrap/blob/v5.3.8/scss/_variables.scss)
- Related: LAYOUT-002, LAYOUT-003, DESIGN-022

Column counts and gutters differ between systems; margins agree more.

| System | Columns | Gutter | Outer margin |
|---|---|---|---|
| Carbon | 4 (sm), 8 (md), 16 (lg and up) | 32 px ("a total gutter of 32 pixels"); narrow 16, condensed 1 | 0, then 16, 24 px at max |
| Atlassian | 2 (320–479), 6 (480–1023), 12 (1024+) | 12 px, then 16 px | 16 px, then 32 px |
| Material 3 | no column counts or gutter widths on its current pages; panes instead | 24 dp between panes | "16dp" compact, 24 dp above |
| GOV.UK | fractions: quarter, third, half, two-thirds, three-quarters, full | `$govuk-gutter: 30px` | 15 px on mobile, 30 px from tablet |
| Fluent 2 | "A 12 column framework is common" | "a multiple of the base unit" | "fixed or percentage-based" |
| Bootstrap 5.3.8 | `$grid-columns: 12` | `$grid-gutter-width: 1.5rem` | container padding = gutter |
| Tailwind 4.3.3, Apple HIG | no column grid | — | — |

Carbon's usage page: "The narrow gutter mode is by far the most common choice in product implementation"; condensed suits "a dashboard or an overview page". Atlassian: "Breakpoints are based on the viewport width, not the width of the main content area", and its values "may differ" per app.

**Reading this:** a grid is a team convention, not a standard. Pick one, write it down as tokens, and don't mix two: two grids on one page put edges that should line up a few pixels apart.

## [LAYOUT-002] Breakpoints across design systems, and where they cluster
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [Material 3: breakpoints](https://m3.material.io/foundations/layout/breakpoints/overview), [Carbon 2x Grid overview @5e9cd1d](https://github.com/carbon-design-system/carbon-website/blob/5e9cd1da43c32d3d3b991dc947b427f674da61a8/src/pages/elements/2x-grid/overview.mdx), [Atlassian: grid](https://atlassian.design/foundations/grid), [Polaris breakpoint tokens @3f7954a](https://github.com/Shopify/polaris/blob/3f7954ae/polaris-tokens/src/themes/base/breakpoints.ts), [govuk-frontend `_media-queries.scss` v6.6.0](https://github.com/alphagov/govuk-frontend/blob/v6.6.0/packages/govuk-frontend/src/govuk/settings/_media-queries.scss), [Fluent 2: layout](https://fluent2.microsoft.design/layout), [Bootstrap `_variables.scss` v5.3.8](https://github.com/twbs/bootstrap/blob/v5.3.8/scss/_variables.scss), [Tailwind `theme.css` v4.3.3](https://github.com/tailwindlabs/tailwindcss/blob/v4.3.3/packages/tailwindcss/theme.css)
- Related: LAYOUT-001, LAYOUT-003, LAYOUT-015, LAYOUT-017, CSS-007

| System | Breakpoints (px, dp for Material) |
|---|---|
| Material 3 | compact "Under 600dp", medium 600–839, expanded 840–1199, large 1200–1599, extra-large 1600+ |
| Carbon | 320, 672, 1056, 1312, 1584 |
| Atlassian | 320, 480, 768, 1024, 1440, 1768 |
| Polaris | 0, 490, 768, 1040, 1440 |
| GOV.UK | mobile 320, tablet 641, desktop 769 |
| Fluent 2 | 320, 480, 640, 1024, 1366, 1920 |
| Bootstrap 5.3.8 | 0, 576, 768, 992, 1200, 1400 |
| Tailwind 4.3.3 | `--breakpoint-sm: 40rem` to `2xl: 96rem` (640, 768, 1024, 1280, 1536) |
| Angular CDK | 600, 960, 1280, 1920 (from archived Material 1, LAYOUT-015) |

**Clusters:** 576–672 (first split from one column), 768–840, 992–1056, 1200–1312. No system names 360 px; Carbon, Atlassian, GOV.UK and Fluent start at 320, the width WCAG 1.4.10 reflow tests (LAYOUT-017). Zoom shrinks the viewport in CSS px, so a desktop user at 400% gets the 320 px layout.

**What they say about choosing:** Material 3: "Design for breakpoints instead of specific devices", because window space "is dynamic and changes based on user behavior, such as multi-window modes or unfolding a foldable device". GOV.UK: "Design for different screen sizes rather than specific devices" and "Design for small screens first, starting with a single-column layout." Carbon allows custom breakpoints "to accommodate special needs". None says to derive breakpoints from content; that idea is community practice (Every Layout, LAYOUT-012).

**Material 3's name change:** its page says "A breakpoint (previously window size class)"; Android's docs still say window size class.

## [LAYOUT-003] Layout defaults the design systems share, and the choices they leave
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [GOV.UK Design System: layout](https://design-system.service.gov.uk/styles/layout/), [Material 3: breakpoints](https://m3.material.io/foundations/layout/breakpoints/overview), [Atlassian: grid](https://atlassian.design/foundations/grid), [Carbon 2x Grid usage @5e9cd1d](https://github.com/carbon-design-system/carbon-website/blob/5e9cd1da43c32d3d3b991dc947b427f674da61a8/src/pages/elements/2x-grid/usage.mdx)
- Related: LAYOUT-001, LAYOUT-002, LAYOUT-004, LAYOUT-009, LAYOUT-017, DESIGN-022, DSKILL-014

When unsure, use what most systems in LAYOUT-001, LAYOUT-002 and LAYOUT-004 agree on. These are safe defaults, each with the problem it prevents:
1. **One column at the smallest width**, then split: no sideways scrolling, and the 320 px reflow check passes. GOV.UK: "Design for small screens first, starting with a single-column layout."
2. **Page margins of 15–16 px on phones, 24–32 px on large screens** (Material 16/24 dp, Atlassian 16/32, GOV.UK 15/30; Carbon 0/16/24): text stays off the screen edge.
3. **Page-structure breakpoints near 600–640 px and 1024 px**, from the framework's tokens (Tailwind `md`, `lg`) rather than new numbers.
4. **A capped `max-width`** for structured pages and a narrower one for reading (LAYOUT-004): lines stay readable on wide screens.
5. **Breakpoints by window, not device**: split screens, foldables and resized windows get the right layout. WCAG's layout requirements are in LAYOUT-017.

**Choices the systems leave you**, decided once per product and written as tokens: column count (4/8/16, 2/6/12 or 12), gutter (12–32 px), page max-width (960–1584 px), whether density is a setting (LAYOUT-005), and whether the page is fixed or fluid above the max width. Carbon: "The biggest differentiator between the style models is the grid. Specifically in how the grid behaves above max breakpoint."

**Order of tools** for each region:
1. Intrinsic CSS (LAYOUT-011, LAYOUT-012): no thresholds to maintain, and widths nobody tested still work.
2. Container queries (LAYOUT-009) for components whose space differs from the viewport's.
3. Viewport breakpoints for page structure only.
4. Not JavaScript in an SSR app: it shifts the layout after hydration (LAYOUT-015).

## [LAYOUT-004] Page and text widths: max-widths, reading columns and full bleed
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [GOV.UK Design System: layout (source)](https://github.com/alphagov/govuk-design-system/blob/main/src/styles/layout/index.md), [govuk-frontend `_measurements.scss` v6.6.0](https://github.com/alphagov/govuk-frontend/blob/v6.6.0/packages/govuk-frontend/src/govuk/settings/_measurements.scss), [Atlassian: grid](https://atlassian.design/foundations/grid), [Carbon 2x Grid usage @5e9cd1d](https://github.com/carbon-design-system/carbon-website/blob/5e9cd1da43c32d3d3b991dc947b427f674da61a8/src/pages/elements/2x-grid/usage.mdx), [Bootstrap `_variables.scss` v5.3.8](https://github.com/twbs/bootstrap/blob/v5.3.8/scss/_variables.scss), [Tailwind `utilities.ts` v4.3.3](https://github.com/tailwindlabs/tailwindcss/blob/v4.3.3/packages/tailwindcss/src/utilities.ts), [Polaris Page docs @3f7954a](https://github.com/Shopify/polaris/blob/3f7954ae/polaris.shopify.com/content/components/layout-and-structure/page.mdx), [Primer: layout @87f799f](https://github.com/primer/design/blob/87f799f202ec/content/foundations/layout.mdx)
- Related: LAYOUT-003, LAYOUT-007, LAYOUT-008, LAYOUT-017, DESIGN-020

**Page max-widths:** GOV.UK `$govuk-page-width: 960px`; Bootstrap `.container` 540/720/960/1140/1320 px from `sm` to `xxl`; Atlassian "Fixed-wide has a maximum width of 1296px (including margins). Use this as the default for most experiences"; Primer limits pages to "`xlarge` (1280px) so the content region doesn’t render paragraphs with too many words per line"; Carbon's grid tops out at 1584 px. Tailwind's `container` sets `width: 100%` and a `max-width` per breakpoint, with no centring or padding.

Always a `max-width`, never a fixed `width`, which would fail reflow (LAYOUT-017):

```css
.page { max-inline-size: 1296px; margin-inline: auto; padding-inline: 16px; }
@media (width >= 1024px) { .page { padding-inline: 32px; } }
```

**Reading columns:** Atlassian "Fixed-narrow has a maximum width of 864px (including margins). Use this for long-form content such as blogs and articles". GOV.UK: a two-thirds column "stops lines of text getting so long that the page becomes difficult to read… no more than 75 characters per line", and "Your main content should always be in a two-thirds column". Polaris: narrow width "if the page supports a single unified task", full width for "wide tables or lists". Line length itself is DESIGN-020 (45–75 characters).

**Fluid (no max):** Atlassian: "Use sparingly, because at very large viewports, text lines can become too long"; it keeps fluid for boards and whiteboards. Carbon's high-density model "uses the full width of the browser".

**Full bleed:** Atlassian lets headers "break out of the grid to span across the page"; GOV.UK's header and footer bands sit outside its width container.

**Conflict:** GOV.UK's layout page says "The default maximum page width is 1020px"; govuk-frontend v6.6.0 sets 960 px. 1020 is 960 plus two 30 px gutters, which the page doesn't say. Trust the code (INDEX.md, Conflicts).

## [LAYOUT-005] Density: when a compact layout is right
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [Material 3: density](https://m3.material.io/foundations/layout/grids-spacing/density), [Polaris: density @3f7954a](https://github.com/Shopify/polaris/blob/3f7954ae/polaris.shopify.com/content/design/layout/density.mdx), [Carbon 2x Grid usage @5e9cd1d](https://github.com/carbon-design-system/carbon-website/blob/5e9cd1da43c32d3d3b991dc947b427f674da61a8/src/pages/elements/2x-grid/usage.mdx), [WCAG 2.2 Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- Related: LAYOUT-006, LAYOUT-007, LAYOUT-017, VIZ-016, VIZ-030, ACCESS-002, SPACE-008

**Use high density for scanning and comparing.** Material 3: "High density layouts are useful when people need to scan, view, or compare a lot of information, such as in a data table"; examples "News, financial portals, dashboards". Polaris: "Information-rich interfaces, like index pages or data tables, require high-density layouts for efficiency." Carbon pairs condensed gutters with dashboards.

**Use low density for focused work.** Polaris: low density suits "focused editing interfaces, like a product detail page", with "larger hit targets, wordier buttons". Material 3: "Don't increase density in UIs that involve focused tasks, such as selecting from a menu", nor in components that alert a person, "such as snackbars or dialogs".

**Make it a choice, not a breakpoint.** Material 3: "Density shouldn't automatically change across breakpoints or orientation unless a person changes it", and "People can opt in to dense layouts in settings". A step is usually "decreasing the top and bottom padding or overall height by 4dp".

**Targets set the floor.** Material 3: "The default target size should be at least 48x48 CSS pixels" and density shouldn't take a target below it by default; that is a house default. The requirement is WCAG 2.5.8 (AA): 24 by 24 CSS px, or spacing so a 24 px circle on each smaller target touches no other (LAYOUT-017). Polaris ties density to the task, not to device or input; Material warns a person who wants dense desktop "may not for mobile". Enlarging targets under `(pointer: coarse)` is a target-size fix, not a density change.

**In practice:** default density for most pages; a compact variant for tables, lists and dashboards, as a user setting where the product has both; never compact menus, dialogs or forms someone is filling in.

## [LAYOUT-006] Angular Material density: the scale, per-component clamps and touch targets
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [Angular Material theming guide v22.2.4](https://github.com/angular/components/blob/v22.2.4/guides/theming.md), [`_m3-button.scss` v22.2.4](https://github.com/angular/components/blob/v22.2.4/src/material/button/_m3-button.scss), [`_m3-table.scss` v22.2.4](https://github.com/angular/components/blob/v22.2.4/src/material/table/_m3-table.scss), [`_m3-icon-button.scss` v22.2.4](https://github.com/angular/components/blob/v22.2.4/src/material/button/_m3-icon-button.scss)
- Related: LAYOUT-005, VIZ-017, UIREV-007, SPACE-008

Set with `mat.theme((… density: -2))`. The guide: "The density value accepts integers from 0 to \-5, where 0 is the default spacing and \-5 is the most dense and compact layout. Each whole number step down (-1, \-2, etc.) reduces the affected sizes by 4px, down to the minimum size necessary for a component to render itself coherently." It warns that "Setting the density below 0 can reduce accessibility", and that density doesn't affect "components that appear in task-based or pop-up contexts, such as the date picker".

**Each component clamps the scale** (source at v22.2.4):

| Component | Clamp | Height by step (0, -1, …) | Touch target |
|---|---|---|---|
| Button | -3 | 40, 36, 32, 28 px | `block, block, none, none`: the 48 px target goes at -2 |
| Icon button | -5 | state layer 40, 36, 32, 28, 24, 24 px | `none` from -2 |
| Table rows | -4 | 52, 48, 44, 40, 36 px | — |

So `-5` on a button acts as `-3`. From `-2` buttons and icon buttons lose their invisible 48 px touch target, and the visible box becomes the target: a 32 px button still passes WCAG 2.5.8 if it is also at least 24 px wide, but no longer meets Material's own 48 px default (LAYOUT-005). A 24 px icon button at `-4` and `-5` sits exactly on the minimum, with no margin for a smaller icon box.

**Safer pattern:** apply density to a region, such as a table or a toolbar wrapper, rather than the whole theme, and keep forms and dialogs at 0.

## [LAYOUT-007] Page types: dashboard, settings and list-detail
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [Atlassian: grid](https://atlassian.design/foundations/grid), [Carbon 2x Grid usage @5e9cd1d](https://github.com/carbon-design-system/carbon-website/blob/5e9cd1da43c32d3d3b991dc947b427f674da61a8/src/pages/elements/2x-grid/usage.mdx), [Polaris Layout docs @3f7954a](https://github.com/Shopify/polaris/blob/3f7954ae/polaris.shopify.com/content/components/layout-and-structure/layout.mdx), [Material 3: breakpoints](https://m3.material.io/foundations/layout/breakpoints/overview), [Android: canonical layouts](https://developer.android.com/develop/ui/compose/layouts/adaptive/canonical-layouts), [AndroidX `PaneScaffoldDirective.kt`](https://android.googlesource.com/platform/frameworks/support/+/refs/heads/androidx-main/compose/material3/adaptive/adaptive-layout/src/commonMain/kotlin/androidx/compose/material3/adaptive/layout/PaneScaffoldDirective.kt)
- Related: LAYOUT-004, LAYOUT-005, LAYOUT-017, VIZ-030, DESIGN-022, ACCESS-013

These rest on design-system docs; NN/g's dashboard guidance (what goes on one) is in VIZ-030.

**Dashboard: capped width, dense.** Atlassian's fixed-wide (1296 px) is for "Dashboards, directories, search results": "Don't use fluid grids for structured content with a natural width, such as dashboards or directories. Elements lose their visual relationship at large viewports." Carbon's high-density model is the exception, for "Complex product interfaces, catalogs and data visualization dashboards", where "the bigger the screen, the more information the user will see". Content rules are in VIZ-030.

**Settings: annotated sections.** Polaris Layout's annotated variant: "Use for settings pages. When settings are grouped thematically in annotated sections, the title and description on each section helps merchants quickly find the setting they're looking for." Material 3 suggests a settings list beside its category detail as two panes at medium width and up.

**List-detail: one pane on phones, two from expanded.** Android's canonical layouts use it for "any app where the content can be organized as a list of items that reveal additional information". AndroidX's pane directive allows one pane for compact and medium windows, two for expanded (840 dp up) and three from large, with a 24 dp spacer. On one pane, the detail needs a back action; on two, the list shows the selection. Our web translation: one route that shows either pane under the breakpoint, both above it.

**Navigation sidebars** stack or become a drawer below about 640 px: a persistent 240 px sidebar at 320 px leaves 80 px for content, which can't reflow (1.4.10, LAYOUT-017). A drawer needs dialog focus handling (ACCESS-013).

**Feed or card grid:** Android adds "as many columns as can fit", like LAYOUT-011's intrinsic grid.

## [LAYOUT-008] Page types: article, landing page and form
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [GOV.UK Design System: layout (source)](https://github.com/alphagov/govuk-design-system/blob/main/src/styles/layout/index.md), [GOV.UK: question pages](https://design-system.service.gov.uk/patterns/question-pages/), [GOV.UK: button](https://design-system.service.gov.uk/components/button/), [NN/g: website forms usability](https://www.nngroup.com/articles/web-form-design/), [Atlassian: grid](https://atlassian.design/foundations/grid), [Carbon 2x Grid usage @5e9cd1d](https://github.com/carbon-design-system/carbon-website/blob/5e9cd1da43c32d3d3b991dc947b427f674da61a8/src/pages/elements/2x-grid/usage.mdx), [NN/g: OK-Cancel or Cancel-OK?](https://www.nngroup.com/articles/ok-cancel-or-cancel-ok/), [Carbon button usage @5e9cd1d](https://github.com/carbon-design-system/carbon-website/blob/5e9cd1da43c32d3d3b991dc947b427f674da61a8/src/pages/components/button/usage.mdx), [Atlassian: button](https://atlassian.design/components/button/usage), [NN/g: scrolling and attention](https://www.nngroup.com/articles/scrolling-and-attention/)
- Related: LAYOUT-004, LAYOUT-016, DESIGN-020, DESIGN-022, UIPAT-001

**Article or docs: one narrow column.** Atlassian's fixed-narrow (864 px) for "Blogs, articles, documentation"; GOV.UK's two-thirds column. The problem it solves is line length (DESIGN-020). Navigation or a table of contents goes beside it, not inside the reading column.

**Landing page: centred and expressive.** Carbon's editorial model is "the bread and butter of marketing pages… The grid in this model centers content for comfortable browsing, and allows for a variety of expressive layouts." NN/g's attention data (LAYOUT-016) puts the main message and action in the first screen and warns against "false floors". Structure names and card rules are in DESIGN-022.

**Form or transaction: one column.**
- NN/g: "Present fields in a single column layout. Multiple columns interrupt the vertical momentum of moving down the form."
- GOV.UK services: "Start by asking one question per page", in a two-thirds column. A default for long or high-stakes transactions, not for a short settings form.
- Primary button on full-page forms: left. GOV.UK: "Align the primary action button to the left edge of your form", "so users do not miss it". Carbon: "on full-page designs, the primary button is on the left side of the page". Atlassian: "Left align buttons on full-page forms". Wizards and dialogs differ: Carbon's wizard primary "traditionally sits at the bottom right". NN/g: "it's best to follow the platform GUI standard", so keep one order across the product. Form behaviour is in UIPAT.

## [LAYOUT-009] Container queries or media queries: which responds to what
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [web.dev: container queries and units in action (2025-10-23)](https://web.dev/articles/baseline-in-action-container-queries), [web.dev Learn Design: micro layouts](https://web.dev/learn/design/micro-layouts), [web.dev: container queries begin to land in stable browsers](https://web.dev/blog/cq-stable), [Every Layout: Sidebar](https://every-layout.dev/layouts/sidebar/), [webstatus.dev: container-queries](https://webstatus.dev/features/container-queries)
- Related: LAYOUT-010, LAYOUT-011, LAYOUT-015, CSS-005, CSS-007

**Components respond to their container; the page responds to the viewport.** web.dev Learn Design: "You can use media queries for the page layout and container queries for the components within the page." web.dev's 2025 article: a sidebar shift "depends on the overall viewport, a media query is used", while components "might appear in different contexts, somewhat independent of the viewport size… This is where container queries become necessary." And: "one is not meant to replace the other… Most websites will likely involve a mix of both."

**Why components shouldn't use media queries:** Every Layout: "A component might appear within a 300px wide container, or it might appear within a more generous 500px wide container. But the width of the viewport is the same in either case, so there’s nothing to “respond” to." A card in a sidebar and the same card in a grid need different layouts at the same viewport.

**Rule of thumb** (our synthesis of the web.dev guidance):
- Media query: navigation pattern, sidebar against drawer, the number of page columns, anything about the whole window. User preferences (`prefers-*`) are media queries too.
- Container query: cards, media objects, form rows, widgets placed in more than one region.
- Neither: when an intrinsic layout does it (LAYOUT-011, LAYOUT-012).

Container size queries are Baseline widely available since 2025-08-14 (`curl -s https://api.webstatus.dev/v1/features/container-queries`, 2026-10-28). Setup and silent failures are in CSS-007; the sizing trap in LAYOUT-010.

Tested 2026-10-28, Playwright 1.64.1, Chromium 156 and WebKit 27.2: one media-object component with `@container (width > 30rem)` stayed one column in a 15rem sidebar and switched to two columns in the main region at 1024 and 1440 px.

## [LAYOUT-010] `container-type: inline-size`: zero width when shrink-to-fit, and what it doesn't do
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [MDN: `container-type`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/container-type), [MDN: container queries guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries), [CSS Conditional 5: `container-type`](https://drafts.csswg.org/css-conditional-5/#container-type), [CSS Containment 2: inline-size containment](https://drafts.csswg.org/css-contain-2/#containment-inline-size), [csswg-drafts#10544](https://github.com/w3c/csswg-drafts/issues/10544), [WPT: `no-layout-containment-abspos.html`](https://github.com/web-platform-tests/wpt/blob/master/css/css-conditional/container-queries/no-layout-containment-abspos.html)
- Related: CSS-007, LAYOUT-009

**It sizes as if empty.** CSS Containment 2: with inline-size containment, "the inline-axis intrinsic sizes of the principal box are determined as if the element had no content." MDN: "If a contextual or explicit size is not available, elements with size containment will collapse." So any container sized by its content (shrink-to-fit) gets 0 px wide; `size` collapses the height too.

**What it does:** CSS Conditional 5: `inline-size` "Applies style containment and inline-size containment to the principal box, and establishes an independent formatting context." So margins inside don't collapse through it, and style containment scopes counters and quotes. Queries style descendants, never the container itself (CSS-007).

**What it no longer does:** the draft's change list: "Dimensional query containers no longer apply layout containment" (#10544, resolved 2024-07-24). So no containing block for absolute or fixed children and no stacking context. WPT tests it (`no-layout-containment-abspos`, `-fixedpos`).

**Conflict:** MDN's container queries guide still says `inline-size` "Applies layout, style, and inline-size containment"; MDN's `container-type` page says style and inline-size. Browsers follow the second (INDEX.md, Conflicts).

Tested 2026-10-28, Playwright 1.64.1, Chromium 156.0.8078.4 and WebKit 27.2, same results in both:
- 0 px wide as a `flex: none` item, an `inline-block` and `position: absolute`; without it, 110 px (Chromium) and 126 px (WebKit).
- Absolute and fixed children of a 300 px container placed at 0,0 of the page.
- A `z-index: 1` child painted above a later `z-index: 0` sibling of the container.
- A child's 30 px top margin stayed inside the container.

**Fix:** put `container-type` on a block that gets its width from its parent (a grid area, a full-width wrapper), or give it a width.

## [LAYOUT-011] Intrinsic grids: `auto-fit` against `auto-fill`, and `min(100%, X)`
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [MDN: `repeat()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/repeat), [MDN: `minmax()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/minmax), [web.dev Learn CSS: grid](https://web.dev/learn/css/grid), [web.dev: ten modern layouts in one line of CSS](https://web.dev/articles/one-line-layouts), [Every Layout: Grid](https://every-layout.dev/layouts/grid/)
- Related: LAYOUT-009, LAYOUT-012, LAYOUT-013, DESIGN-022

A card grid that picks its own column count needs no breakpoint:

```css
.cards { display: grid; gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); }
```

**`auto-fit` or `auto-fill`.** MDN: `auto-fit` "Behaves as `auto-fill`, except that after placing grid items, any empty repeated tracks are collapsed." web.dev: with `auto-fit` "the flexible tracks now grow to consume the space", and "There is no difference between them once the first track is filled." Use `auto-fit` when few items should stretch across the row; `auto-fill` when cards should keep the same width whatever their number.

**`min(100%, X)`.** A fixed minimum overflows any container narrower than it. Wrapping it in `min(100%, …)` lets one column shrink to the container. Every Layout's Grid component emits the same `minmax(min(…, 100%), 1fr)`. MDN and the specs don't name the idiom; it follows from `min()` and `minmax()`.

**Limits:** column count follows the container, not the content, so a grid of three items can show one, two or three per row; for an exact two-to-four step, use container queries (LAYOUT-009). The `100%` resolves against the grid's width, so the grid needs a definite one: inside a shrink-to-fit parent (an `inline-grid`, a `flex: none` item) the count can differ (not tested).

Tested 2026-10-28, Playwright 1.64.1, Chromium 156 and WebKit 27.2, three items, `minmax(min(100%, 16rem), 1fr)`: one column at 320 px, two at 768, three at 1024 in both modes. At 1440 px `auto-fit` gave three 459 px cards; `auto-fill` gave three 269 px cards and two empty tracks. `minmax(22rem, 1fr)` without `min()` overflowed at 320 px in both engines. `min()`, `max()` and `clamp()` are widely available since 2023-01-28 (`curl -s https://api.webstatus.dev/v1/features/min-max-clamp`, 2026-10-28).

## [LAYOUT-012] Switcher and Sidebar: flex layouts that switch without breakpoints
- Type: pattern
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-28
- Sources: [Every Layout: Switcher](https://every-layout.dev/layouts/switcher/), [Every Layout: Sidebar](https://every-layout.dev/layouts/sidebar/), [CSS Values 4: range checking](https://drafts.csswg.org/css-values-4/#calc-range)
- Related: DESIGN-022, LAYOUT-009, LAYOUT-011, LAYOUT-014, SPACE-017

Every Layout's primitives (DESIGN-022) switch on the container's width with plain flexbox, so they work wherever they are placed.

**Switcher** puts items in a row, or stacks them all when the container is narrower than a threshold:

```css
.switcher { display: flex; flex-wrap: wrap; gap: 1rem; }
.switcher > * { flex-grow: 1; flex-basis: calc((40rem - 100%) * 999); }
```

Above the threshold the `calc()` is negative, and CSS Values 4 says the value "must be clamped to the range allowed", so the basis becomes 0 and items share the row (Every Layout calls it "invalid, and dropped"); below it, the basis is huge and each takes a line. It is all-or-nothing on purpose: with a plain `flex: 1 1 20rem`, an item that wraps alone and grows "could be perceived by the user as being “picked out”". Its uses: product cards that "should share the same width no matter the orientation", and numbered steps. Cap the count with `:nth-last-child(n+5)` and `flex-basis: 100%`.

**Sidebar** keeps a fixed-width side beside a flexible main until the main would drop to half, then stacks them:

```css
.with-sidebar { display: flex; flex-wrap: wrap; gap: 1rem; }
.sidebar { flex-basis: 20rem; flex-grow: 1; }
.not-sidebar { flex-basis: 0; flex-grow: 999; min-inline-size: 50%; }
```

**When a breakpoint is still needed:** changes to the page itself, such as navigation becoming a drawer (LAYOUT-009), and layouts whose states differ by more than wrapping.

Confidence is community-consensus: Every Layout is a widely used book, not a vendor. The clamping rule is CSS's.

Tested 2026-10-28, Playwright 1.64.1, Chromium 156 and WebKit 27.2: the Switcher above with three items stacked into three rows at 320 px and sat in one row at 768 px and wider. The Sidebar stacked at 320 px (288 px each) and sat side by side from 768 px (320 and 400 px; 321 and 1,071 px at 1440), with no overflow.

## [LAYOUT-013] Subgrid for card internals and form rows
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [MDN: subgrid guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Subgrid), [webstatus.dev: subgrid](https://webstatus.dev/features/subgrid)
- Related: LAYOUT-011, DESIGN-022, CSS-005

Cards in a row with titles and bodies of different lengths have footers at different heights. Subgrid lines them up by letting each card use the parent's row tracks. MDN: "the nested grid uses the tracks defined on the parent."

```css
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.card  { display: grid; grid-row: span 3; grid-template-rows: subgrid; gap: .5rem; padding: .5rem; }
```

Each card spans three rows (title, body, footer), and the tallest title in the row sizes the title row for all three. Without its own `gap` a card inherits the parent's 1rem between its rows; its padding enlarges its first and last tracks. The same works for forms: a parent with `grid-template-columns: max-content 1fr` and field rows with `grid-template-columns: subgrid` align every label column.

**Limits** from MDN:
- The card must span a known number of tracks. With an unknown number of auto-placed children, subgrid "will prevent additional rows from being created to hold those items."
- Gaps are inherited, but "can be overridden with a different `gap` value."
- Content in the subgrid sizes the parent's tracks: "auto-sized row tracks will grow to fit content in the main grid and content in the subgrid."

Subgrid is Baseline widely available since 2026-03-15 (`curl -s https://api.webstatus.dev/v1/features/subgrid`, 2026-10-28), so no fallback is needed for Baseline-widely targets (CSS-005, CSS-016).

Tested 2026-10-28, Playwright 1.64.1, Chromium 156 and WebKit 27.2: with the CSS above, the three footers had the same top at 320, 768, 1024 and 1440 px. Five such cards in LAYOUT-011's `auto-fit` grid had matching footers within each row at every width (at 1024 px: three, then two), each row sized on its own.

## [LAYOUT-014] Visual order against DOM order, and `reading-flow`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [MDN: grid layout and accessibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Accessibility), [MDN: `order`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/order), [MDN: `reading-flow`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/reading-flow), [webstatus.dev: reading-flow](https://webstatus.dev/features/reading-flow), [WCAG 2.2 Understanding 2.4.3](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html), [WCAG 2.2 Understanding 1.3.2](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html)
- Related: LAYOUT-003, LAYOUT-009, LAYOUT-016, LAYOUT-017, ACCESS-008, ACCESS-012, ACCESS-015

**Moving things with CSS doesn't move them for keyboards or screen readers.** MDN, quoting the grid spec: "The `order` property and grid placement do not affect ordering in non-visual media (such as speech). Likewise, rearranging grid items visually does not affect the default traversal order of sequential navigation modes." The spec calls logical reordering with them "non-conforming". That covers `grid-template-areas` redefined per breakpoint, `order`, `flex-direction: row-reverse` (often behind image–text zigzags), `grid-auto-flow: dense` and positioning.

**What WCAG requires:** 2.4.3 (A): "Focus order does not necessarily need to follow the visual presentation or layout", as long as it is logical and keeps the relationships the layout implies. Two independent columns read in either order pass; "As a best practice, though, make sure the focus order reinforces the reading order implied by the visual layout." 1.3.2 (A) needs a correct reading sequence only "When the sequence in which content is presented affects its meaning."

**In practice:** write the DOM in reading order for the smallest layout (WCAG technique C27), and let wider layouts place regions around it. MDN: "A good test is to tab around the document." Moving a whole region is fine; reordering steps or fields isn't. A person checks it (ACCESS-015).

**`reading-flow`** (`flex-visual`, `grid-rows` and other values): MDN says it changes speech and Tab order to follow the layout. Chrome and Edge 137 (2025-05-27) only, Baseline "limited" (`curl -s https://api.webstatus.dev/v1/features/reading-flow`, 2026-10-28), experimental per MDN. A progressive improvement, never the fix for conformance.

Tested 2026-10-28, Playwright 1.64.1: three buttons in DOM order a, b, c shown as b, a, c with `grid-template-areas: "b a c"`. Tab went a, b, c in Chromium 156 and WebKit 27.2. With `reading-flow: grid-rows`, Chromium tabbed b, a, c; WebKit kept DOM order. Screen readers weren't tested.

## [LAYOUT-015] Angular CDK `BreakpointObserver` under SSR: one layout from the server, a shift on phones
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [`breakpoints.ts` v22.2.4](https://github.com/angular/components/blob/v22.2.4/src/cdk/layout/breakpoints.ts), [`media-matcher.ts` v22.2.4](https://github.com/angular/components/blob/v22.2.4/src/cdk/layout/media-matcher.ts), [Angular: SSR guide (v22.2.3 source)](https://github.com/angular/angular/blob/v22.2.3/adev/src/content/guide/ssr.md), [Angular: hydration guide (v22.2.3 source)](https://github.com/angular/angular/blob/v22.2.3/adev/src/content/guide/hydration.md), [web.dev: CLS](https://web.dev/articles/cls)
- Related: LAYOUT-002, LAYOUT-009, ANIMLIB-004, WEBPERF-002, NG-005

**On the server nothing matches.** `MediaMatcher` falls back to `noopMatchMedia`, whose `matches` is `query === 'all' || query === ''`. So `isMatched()` is false, `observe()` emits one non-matching state, and every visitor gets the "no match" branch's HTML.

**Angular's guides say not to branch on platform.** SSR guide: "Avoid using `isPlatformBrowser` in templates with `@if` or other conditionals to render different content on server and client. This causes hydration mismatches and layout shifts". Neither guide names `BreakpointObserver`; the test below shows the same effect. Seeding the render from the user agent (ngx-device-detector) is a community workaround that can't serve prerendered routes.

**The breakpoints are old.** `Breakpoints` come from archived Material 1 (`XSmall` "(max-width: 599.98px)", then 960, 1280, 1920), and `Handset` also matches landscape windows up to 959.98 px.

**Use CSS for layout** (media or container queries, LAYOUT-009): server and client then send the same DOM. Keep `BreakpointObserver` for behaviour after render, such as closing a menu.

Tested 2026-10-28, `@angular/core@22.2.3`, `@angular/cdk@22.2.4`, `@angular/build@22.2.4`, Node 24.21.0, prerender with hydration (`ngh` in the HTML), Playwright 1.64.1. `@if (handset())` from `observe(Breakpoints.Handset)` picked a 48 px menu bar or a 240 px sidebar above the content:
- The prerendered HTML had the sidebar.
- Chromium 156 at 375×812: it swapped to the bar after hydration, CLS 0.206 for this page (web.dev: "Good CLS values are 0.1 or less. Poor values are greater than 0.25."). At 1440×900: 0.
- The same bar sized by a CSS media query: CLS 0.
- WebKit 27.2 has no Layout Instability API. Request-time SSR uses the same matcher (source only).

## [LAYOUT-016] Reading patterns that change a layout: F, layer-cake, left half, top of page
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [NN/g: F-shaped pattern, misunderstood (2017-11-12)](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/), [NN/g: text scanning patterns (2019-08-25)](https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/), [NN/g: horizontal attention leans left (2017-10-22)](https://www.nngroup.com/articles/horizontal-attention-leans-left/), [NN/g: scrolling and attention (2018-04-15)](https://www.nngroup.com/articles/scrolling-and-attention/), [NN/g: zigzag image–text layouts (2017-11-26)](https://www.nngroup.com/articles/zigzag-page-layout/)
- Related: DESIGN-022, LAYOUT-008, LAYOUT-014, WRITE-007

NN/g's eye-tracking studies, on desktop screens in left-to-right languages; NN/g reports the F-pattern mirrored in right-to-left ones and on mobile too:

**F is a failure mode.** "People scan in an F-shape when all of these 3 elements are present": little formatting for the web, a user seeking efficiency, and one not committed to reading every word. It is "bad for users and businesses" because people "may skip important content simply because it appears on the right side". The fix is structure: important points first, headings that start with the information. The layer-cake pattern, scanning headings and subheadings, "is by far the most effective way in which users can scan pages", aside from reading every word.

**Left half.** 120+ participants, 1920×1080: "80% of the fixations fell on the left half of the screen", and the leftmost 10% got "only 6%". "Centered layouts and wider screens don’t imply right fixations." On wide screens, put priority content on the start side (left in LTR, mirrored in RTL) and secondary content on the other.

**Top of page.** Same study set: "57% of their page-viewing time above the fold. 74% of the viewing time was spent in the first two screenfuls". Keep major actions high and avoid "false floors" that hide what's below.

**Image–text zigzag:** decorative images alternating sides "caused users to stumble"; align them down the page instead.

**Z-pattern:** no measured support found for web pages. NN/g's "zigzag" is the image–text alternation above, not a Z; the Z comes from print design's Gutenberg diagram, and the web sources we found were practitioner blogs without data (searched nngroup.com, the five articles above, and the web for eye-tracking studies).

## [LAYOUT-017] WCAG requirements that constrain a layout
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [Understanding 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [Understanding 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [Understanding 1.4.12 Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html), [Understanding 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [Understanding 2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
- Related: ACCESS-001, ACCESS-002, ACCESS-008, DSKILL-014, UIREV-003, UIREV-007, LAYOUT-005, LAYOUT-007, LAYOUT-014, VIZ-016, SPACE-020

These are WCAG 2.2 AA requirements (ACCESS-001); everything else in this file is convention.

| Criterion | What it asks of a layout |
|---|---|
| 1.4.10 Reflow (AA) | No two-direction scrolling at 320 CSS px wide ("1280 CSS pixels wide at 400% zoom"), or 256 px tall for vertical-scrolling text. Excepted: "maps, diagrams), video, games, presentations, data tables (not individual cells), and interfaces where it is necessary to keep toolbars in view". A wide table scrolls in its own box; cards and dashboards don't count. Sidebars stack or become drawers (LAYOUT-007). |
| 1.4.4 Resize Text (AA) | Text resized "up to 200 percent without loss of content or functionality". |
| 1.4.12 Text Spacing (AA) | Nothing clips when users set line height 1.5, paragraph spacing 2, letter spacing 0.12 and word spacing 0.16 times the font size. Use `min-height`, not `height`, on rows, cards and buttons (failure F104). |
| 2.5.8 Target Size (AA) | 24 by 24 CSS px, or undersized targets spaced so a "24 CSS pixel diameter circle" on each meets no other; inline links are exempt. 44 px is AAA (2.5.5). |
| 2.4.11 Focus Not Obscured (AA) | A focused element is "not entirely hidden due to author-created content": "sticky footers, sticky headers, and non-modal dialogs" are the usual causes. Set `scroll-padding-block` to the sticky heights (UIREV-007), and unstick at small heights. |
| 1.3.2 and 2.4.3 (A) | Reading and focus order stay logical when CSS moves things (LAYOUT-014). |

At 400% zoom a 1280 px window is 320 CSS px wide, so the phone layout is also the zoomed desktop one.

Automated checks catch little of this (ACCESS-008): test at 320 px, 200% text and with text spacing applied.

## Recommendations for our setup

1. **No change for osrs-tracker-web or freek-mencke-web** (LAYOUT-015, LAYOUT-004, LAYOUT-002). Read 2026-10-28 at their `main` (`1366d45` and `ce05f2b`): both lay out with Tailwind and CSS. osrs-tracker-web reads `BreakpointObserver` only for `prefers-reduced-motion` in its charts and `matchMedia` in nav-menu event handlers, never to pick a layout. Their page tokens (`--container-page` 75rem and 90rem, an added `xs` breakpoint) sit within the systems' ranges.
2. Done 2026-10-28: `angular-conventions` lays out in CSS, never by `BreakpointObserver`; `ui-review` checks that and phone margins under 15 px (FreekMencke/claude-skills#126, FreekMencke/claude-skills#127). LAYOUT-015, LAYOUT-003, LAYOUT-009.
3. Done 2026-10-28: `design-workshop`'s prototypes and brief use grid tokens, by default 12 columns, 1280 px max-width, `70ch` text (FreekMencke/claude-skills#124). LAYOUT-003, LAYOUT-004, LAYOUT-009, LAYOUT-011, LAYOUT-013.

## Open questions

- **Material 3's column counts and gutters:** its current grids page says only that "column count, width, and spacing change"; the older Material 4/8/12 columns weren't rechecked. Searched m3.material.io's breakpoint, grids and spacing pages.
- **Polaris page max-width:** its Page component's narrow width is a CSS variable whose value we didn't find in the docs or token files read (`polaris-tokens`, Page docs at `3f7954a`).
- **Fluent 2 numbers:** no numeric gutters, margins or density sizes on its layout page.
- **Firefox and `container-type` containment:** not run. Gecko's WPT metadata lists no expected failure for `no-layout-containment-abspos` and `-fixedpos`, which suggests it follows #10544 (inferred from absent `.ini` files by the refuter, 2026-10-28).
- **Sidebar and drawer widths** per design system weren't collected.
- **Every Layout's Grid and Container pages:** the prose is in the paid edition; only the free pages and the component code were read.
