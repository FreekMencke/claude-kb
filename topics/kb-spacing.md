# Spacing and alignment: scales, proximity, padding, rhythm, text and icon alignment

Prefix `SPACE`. This file covers the space and alignment inside and between components: spacing scales and how design systems name them, fluid spacing, proximity and grouping, starting values by role, component padding, whitespace studies, text alignment, icons beside text, trimming the space above and below text, optical alignment, and the CSS that keeps spacing consistent. Grids, breakpoints, page widths, density modes and page types are in `kb-layout.md` (LAYOUT); the type scale and line length are DESIGN-020.

Research basis:
- Researched 2026-10-28 (FreekMencke/claude-kb#300) by an Opus 5.5 lead with two Sonnet 5.5 readers: spacing systems and grouping (168k tokens, 86 tool calls, 10.9 min) and alignment and CSS mechanics (134k tokens, 50 tool calls, 6.8 min). Then a Sonnet refuter and a four-persona Sonnet review panel (UI designer, typographer, front-end engineer, accessibility specialist); their findings and what was done with each are in the PR.
- Read as raw text: design-system sources at pinned commits (Carbon `131963f`, carbon-website `5e9cd1d`, govuk-frontend `78d66a8`, material-web `86cb0d4`, Shopify/polaris `3f7954a`, utopia-core `135c051`, Tailwind `v4.3.3`), npm tarballs read without running them (`@atlaskit/tokens` 20.8.2, `@shopify/polaris-tokens` 9.4.2, `@fluentui/tokens` 1.0.0-alpha.24, `@fluentui/react-button` 9.11.3), web-features 3.44.0 `data.json`, `@mdn/browser-compat-data` 8.1.7, MDN content, the CSS Inline 3 Editor's Draft of 2026-10-14, WCAG 2.2 Understanding pages, NN/g, Butterick and Utopia pages. M3, Atlassian and Fluent 2 render their docs in JavaScript; their quotes were read as page text in Playwright and are marked "rendered page text".
- Baseline statuses: `jq '.features["<id>"].status' data.json` on web-features 3.44.0 (CSS-002), cross-checked on api.webstatus.dev.
- Tested with Playwright 1.64.1 on Node 24.21.0: Chromium 156.0.8078.4, WebKit 27.2 and Firefox 157.0 (Playwright's builds), with DejaVu Sans and Liberation Serif, plus WenQuanYi Zen Hei, IPAGothic and Ubuntu as a stress set; pixels counted with `pngjs` 7.0.0. Tailwind CSS 4.3.3's CLI. No community code was run.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which spacing scale should I use? | A 4 px base with 4, 8, 12, 16, 24, 32, 48, 64: Carbon, Atlassian, Polaris and Tailwind have all eight. Fluent's code tokens stop at 32; GOV.UK uses 5 px steps. | SPACE-001, SPACE-002 |
| 4 px or 8 px base? | Fluent: "A 4x system reduces confusion"; Atlassian builds on 8 px but still has 2, 4 and 6 px tokens. In practice both give a 4 px grid. | SPACE-001, SPACE-002 |
| How much space for an icon gap, a group, a section? | Start at 4–8 px icon to label, 8–16 px inside a group, 24–32 px between groups, 48–80 px between sections. A synthesis, not one system's rule. | SPACE-021, SPACE-005 |
| Should spacing change with the viewport? | Optional: GOV.UK's steps 4–9 grow once at 641 px, Carbon keeps tokens fixed and jumps a step at breakpoints, Utopia interpolates with `clamp()`. | SPACE-003, SPACE-004 |
| How much space inside a group against between groups? | Clearly less inside; no system publishes a ratio. GOV.UK's forms use 5 px label to input against 20–30 px between fields. | SPACE-005 |
| Border, card or space to group things? | Space first; NN/g: a border when space alone is ambiguous, such as variable-height content. | SPACE-006, DESIGN-022 |
| What padding do buttons, inputs and cards get? | Buttons 10–24 px across and 40–48 px tall; inputs 40–56 px tall; cards 8–16 px; dialogs 16–24 px. Use `min-height`, not `height`. | SPACE-007, SPACE-020 |
| Does whitespace improve comprehension? | No reliable number: one 2004 study of 19 students found wider margins helped comprehension and slowed reading. The "20%" isn't in it. Argue from grouping. | SPACE-009 |
| Centre or left-align text? | Start-align body text and most headings; centre short phrases only; don't justify on the web. | SPACE-010 |
| How do I line an icon up with its label? | Flex `align-items: center`; for an exact fit, trim the label with `text-box`. `baseline` and `middle` sat 1.5–3 px off in five fonts. | SPACE-011, SPACE-012 |
| How do I remove the space above and below text? | `text-box: trim-both cap alphabetic` on the text's own block, not on a flex button or under `overflow: hidden`; ignored where unsupported. | SPACE-013, SPACE-014 |
| `gap`, margins or `* + *`? | `gap` in flex and grid; margins on wrapping items wrap early, and `* + *` indents wrapped rows. | SPACE-017 |
| Can Tailwind 4 enforce a spacing scale? | Yes: `--spacing: initial` plus named `--spacing-N` tokens, including `--spacing-0`; arbitrary `[13px]` values still compile. | SPACE-019 |
| Which spacing rules does WCAG require? | 1.4.12 text spacing, 2.5.8 target spacing and 1.4.10 reflow (AA); 1.4.8 is AAA; grouping by space also needs structure (1.3.1). | SPACE-020 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| SPACE-001 | Spacing scales in eight design systems | comparison | spacing-scale, tokens, carbon, govuk, atlassian, polaris, fluent, tailwind |
| SPACE-002 | A safe default scale, and the choices the systems differ on | recommendation | spacing-scale, tokens, naming |
| SPACE-003 | Fixed or responsive spacing tokens | comparison | spacing-scale, responsive, govuk, carbon |
| SPACE-004 | Utopia's fluid space scale and space pairs | tool | utopia, fluid-spacing, clamp |
| SPACE-005 | Proximity: less space inside a group than between groups | pattern | proximity, gestalt, grouping, forms |
| SPACE-006 | Group with space before borders and cards | pattern | proximity, common-region, cards, hierarchy |
| SPACE-007 | Component padding in the design systems | comparison | padding, buttons, inputs, cards, dialogs |
| SPACE-008 | Density changes padding tokens, not the scale | fact | density, padding, tokens |
| SPACE-009 | Whitespace and comprehension: one small study and a phantom 20% | fact | whitespace, research, comprehension |
| SPACE-010 | Text alignment: start-align body, centre short phrases, don't justify | recommendation | text-align, justify, rtl, wcag-1.4.8 |
| SPACE-011 | Icons beside text: size and gap in the design systems | comparison | icons, alignment, gap, font-awesome |
| SPACE-012 | Test: icon and label alignment across five fonts | fact | icons, alignment, flexbox, vertical-align |
| SPACE-013 | `text-box`: trimming the space above and below text, and its support | fact | text-box, leading-trim, baseline, firefox |
| SPACE-014 | `text-box` traps: flex containers, single edges, padding, clipping | anti-pattern | text-box, flexbox, buttons, overflow |
| SPACE-015 | Vertical rhythm: `lh` and `rlh`, and no baseline grid | fact | vertical-rhythm, lh, rlh, line-height-step |
| SPACE-016 | Optical alignment: overshoot, cap-height centring, hanging punctuation | fact | optical-alignment, overshoot, hanging-punctuation |
| SPACE-017 | `gap` against margins and the lobotomised owl | pattern | gap, margins, owl, flexbox, tested |
| SPACE-018 | Margin collapse, logical properties, block `align-content`, `margin-trim` | fact | margin-collapse, logical-properties, align-content, margin-trim |
| SPACE-019 | Tailwind 4: limiting spacing utilities to a named scale | tool | tailwind, spacing-scale, theme |
| SPACE-020 | Spacing that WCAG requires, apart from conventions | fact | wcag, text-spacing, target-size, reflow, structure |
| SPACE-021 | Starting values by role: icon gap, group, section | recommendation | spacing-scale, proximity, defaults |

## [SPACE-001] Spacing scales in eight design systems
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [Carbon spacing at 5e9cd1d](https://github.com/carbon-design-system/carbon-website/blob/5e9cd1da43c32d3d3b991dc947b427f674da61a8/src/pages/elements/spacing/overview.mdx), [Atlassian spacing](https://atlassian.design/foundations/spacing), [`@shopify/polaris-tokens` 9.4.2](https://www.npmjs.com/package/@shopify/polaris-tokens/v/9.4.2), [govuk-frontend `_spacing.scss` at 78d66a8](https://github.com/alphagov/govuk-frontend/blob/78d66a80594224f358c09c8ba9309dd78e116a0c/packages/govuk-frontend/src/govuk/settings/_spacing.scss), [Fluent 2 layout](https://fluent2.microsoft.design/layout), [`@fluentui/tokens` 1.0.0-alpha.24](https://www.npmjs.com/package/@fluentui/tokens), [M3 density](https://m3.material.io/foundations/layout/grids-spacing/density), [Apple HIG layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Tailwind `theme.css` v4.3.3](https://github.com/tailwindlabs/tailwindcss/blob/v4.3.3/packages/tailwindcss/theme.css)
- Related: SPACE-002, SPACE-003, SPACE-021, DESIGN-006, DESIGN-021, DESIGN-023

Values in px; most systems ship them as rem, so they scale with the user's text size (SPACE-020).

| System | Base | Steps | Names |
|---|---|---|---|
| Carbon | "multiples of two, four, and eight" | 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160 | `$spacing-01`…`13` |
| Atlassian | "a base unit of 8 pixels" | 0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80 | `space.NNN`, the percentage of 8 (`space.200` = 16) |
| Polaris | 4 (1 and 2 below it) | 0, 1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 112, 128 | `--p-space-NNN` (`400` = 16) |
| GOV.UK | 5 to 30, then 10 | 0, 5, 10, 15, 20, 25, 30, 40, 50, 60 | units 0–9, `govuk-spacing(n)` |
| Fluent 2 | "four pixels" | design ramp 2–56 (`size20`…`size560`); code 2, 4, 6, 8, 10, 12, 16, 20, 24, 32 | `spacingHorizontalXXS`…`XXXL`, and `Vertical` |
| Tailwind 4 | `--spacing: 0.25rem` | any multiple: `p-4` is `calc(var(--spacing) * 4)` | numeric |
| Material 3 | none published | density steps of 4dp | material-web: "Remove once spacing tokens are formally added" |
| Apple HIG | none published | qualitative ("Use consistent spacing") | — |

Only Fluent says why: "A 4x system reduces confusion while being easy to implement", and "The values 2, 6, and 10 account for extra padding in the Fluent icons" (rendered page text). Atlassian, Polaris and GOV.UK give no reason for their base. Atlassian's semantic `space.gap.*` and `space.inset.*` tokens are `"state": "experimental"` in 20.8.2.

## [SPACE-002] A safe default scale, and the choices the systems differ on
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [Carbon spacing at 5e9cd1d](https://github.com/carbon-design-system/carbon-website/blob/5e9cd1da43c32d3d3b991dc947b427f674da61a8/src/pages/elements/spacing/overview.mdx), [Atlassian spacing](https://atlassian.design/foundations/spacing), [Fluent 2 layout](https://fluent2.microsoft.design/layout), [Utopia: designing with a fluid space palette](https://utopia.fyi/blog/designing-with-a-fluid-space-palette/)
- Related: SPACE-001, SPACE-004, SPACE-019, SPACE-021, DESIGN-006, DESIGN-021

**Safe default.** Carbon, Atlassian, Polaris and Tailwind all contain 4, 8, 12, 16, 24, 32, 48 and 64 px. Fluent's code tokens have the steps up to 32 (its design ramp adds 48 but not 64); GOV.UK has 5 px steps. A token block that names these eight steps (DESIGN-006) matches the four systems. Steps widen as they grow: Utopia wants "more nuanced space options nearer the base font size, and fewer options at the larger end".

**Choices that differ:**
- **Half-steps.** 2 and 6 px exist in Carbon, Atlassian, Polaris and Fluent; Fluent keeps them for icon padding. Leave them out unless icons need them.
- **Names.** Multipliers (`space.200`, `p-4`) survive inserting a step; ordinals (`$spacing-05`) and T-shirt sizes (`XXL`) don't. Atlassian: "Every space token is a multiple of this base unit, the number suffix representing the percentage of the base unit."
- **Semantic tokens.** Atlassian separates gaps from insets ("Do not use for component insets or dimensions"), still experimental.

**Off-scale values.** Carbon: "deviating from the spacing scales should be avoided whenever possible." An arbitrary 13 px or 7 px is the habit this prevents: spaces that look equal but aren't, which blurs grouping (SPACE-005). A nudge to line up text or an icon usually means trimming or icon alignment is wrong (SPACE-012, SPACE-013), not that the scale needs another step.

## [SPACE-003] Fixed or responsive spacing tokens
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [govuk-frontend `_spacing.scss` at 78d66a8](https://github.com/alphagov/govuk-frontend/blob/78d66a80594224f358c09c8ba9309dd78e116a0c/packages/govuk-frontend/src/govuk/settings/_spacing.scss), [GOV.UK spacing](https://design-system.service.gov.uk/styles/spacing/), [Carbon spacing at 5e9cd1d](https://github.com/carbon-design-system/carbon-website/blob/5e9cd1da43c32d3d3b991dc947b427f674da61a8/src/pages/elements/spacing/overview.mdx), [M3 spacing](https://m3.material.io/foundations/layout/grids-spacing/spacing), [NN/g: proximity](https://www.nngroup.com/articles/gestalt-proximity/)
- Related: SPACE-001, SPACE-004, SPACE-005, LAYOUT-002

Three approaches, all official:

- **GOV.UK: responsive tokens.** `$govuk-spacing-responsive-scale` keeps units 0–3 fixed (0, 5, 10, 15 px) and grows 4–9 once, at the `tablet` breakpoint (641 px): 15→20, 15→25, 20→30, 25→40, 30→50, 40→60. `govuk-responsive-margin(n)` and `govuk-responsive-padding(n)` apply them; `govuk-!-static-margin-n` opts out.
- **Carbon: fixed tokens, jump a step.** "No, the tokens themselves do not change values based on the screen size. However, it is acceptable at page breakpoints to jump a step(s) on the spacing scale."
- **Fluid: Utopia** interpolates every step with `clamp()` (SPACE-004). M3 says only that its spacing "can adapt to breakpoints and density settings" (rendered page text).

What they agree on: small gaps inside components stay put; large gaps between sections shrink on small screens. NN/g gives the reason to check: "Scaling down to smaller devices can minimize the space between elements or can push elements farther apart, destroying grouping relationships." Whichever approach, the gap inside a group must stay smaller than the gap between groups at every width (SPACE-005).

No source measured fluid against stepped spacing. Pick by the codebase: fixed tokens with breakpoint overrides suit a utility framework; fluid pairs suit a site already on a Utopia type scale (DESIGN-020).

## [SPACE-004] Utopia's fluid space scale and space pairs
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [Utopia space calculator](https://utopia.fyi/space/calculator/), [utopia-core `src/index.ts` at 135c051](https://github.com/trys/utopia-core/blob/135c05142be271f1906897b61437d87465c09ec2/src/index.ts), [Utopia: designing with a fluid space palette](https://utopia.fyi/blog/designing-with-a-fluid-space-palette/), [Utopia: painting with a fluid space palette](https://utopia.fyi/blog/painting-with-a-fluid-space-palette/)
- Related: DESIGN-020, SPACE-002, SPACE-003, SPACE-020

Utopia derives space from the type scale: "'Step 0' of our type scale becomes the t-shirt size 'S'". At the calculator's defaults (360 px at 18 px, 1240 px at 20 px, the same as DESIGN-020), S is 18→20 px. Multipliers 0.25, 0.5, 0.75 give 3xs, 2xs, xs; 1.5, 2, 3, 4, 6 give m, l, xl, 2xl, 3xl. utopia-core rounds each end with `Math.round(config.minSize * multiplier)`, so 3xs is 5 px at both widths.

```css
--space-3xs: clamp(0.3125rem, 0.3125rem + 0vw, 0.3125rem);
--space-s: clamp(1.125rem, 1.0739rem + 0.2273vw, 1.25rem);
--space-s-m: clamp(1.125rem, 0.8182rem + 1.3636vw, 1.875rem);
--space-s-l: clamp(1.125rem, 0.5625rem + 2.5vw, 2.5rem);
```

**Pairs** run from one size's minimum to another's maximum, so they change far more across widths. Utopia: "Individual space values are subtly responsive by default. Space value pairs can offer much more dynamic space options." Its card example: "The space between the card's items is defined as an individual space value… The card's padding is defined as a space pair". Pairs suit padding and section gaps; single values suit gaps inside a group, which keeps the inside-smaller-than-between relation (SPACE-005).

**Keep the rem term.** The generated values mix `rem` and `vw`, so they still grow with text zoom; a hand-written `clamp()` of `vw` alone doesn't (1.4.4, SPACE-020).

**Trap:** the 2021 blog's comment `// 18px → 33px` for `--space-s-m` predates the current defaults, which give 18→30 px. Generate from the calculator, not the blog.

## [SPACE-005] Proximity: less space inside a group than between groups
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [NN/g: proximity principle (2020-08-02)](https://www.nngroup.com/articles/gestalt-proximity/), [NN/g: group form elements with white space](https://www.nngroup.com/articles/form-design-white-space/), [Carbon spacing at 5e9cd1d](https://github.com/carbon-design-system/carbon-website/blob/5e9cd1da43c32d3d3b991dc947b427f674da61a8/src/pages/elements/spacing/overview.mdx), [govuk-frontend at 78d66a8](https://github.com/alphagov/govuk-frontend/tree/78d66a80594224f358c09c8ba9309dd78e116a0c/packages/govuk-frontend/src/govuk), [Atlassian spacing](https://atlassian.design/foundations/spacing)
- Related: SPACE-006, SPACE-003, SPACE-020, SPACE-021, UIPAT-007

NN/g: "Design elements near each other are perceived as related, while elements spaced apart are perceived as belonging to separate groups." Proximity "can overpower competing visual cues such as similarity of color or shape." Carbon: "As more space is added between elements, their perceived relationship weakens." Atlassian and Fluent say the same.

**The rule:** the gap inside a group is visibly smaller than the gap between groups. Equal spacing everywhere, a common agent habit, leaves nothing grouped.

**No published ratio.** No system read states one. GOV.UK Frontend's form code shows one in practice:
- label to input, or label to hint: the label's `margin-bottom: govuk-spacing(1)` (5 px);
- hint to input: 15 px, or 10 px after a default-sized label;
- between form groups: `govuk-responsive-margin(6, "bottom")`, 20 px, 30 px from 641 px.

That is 4–6× (our arithmetic, not GOV.UK's statement), and it serves NN/g's form rule: "Place the label closer to the associated text field than to other text fields." Atlassian's experimental gap tokens name the same ladder: `space.gap.xxsmall` (2 px) for "closely related elements" up to `xxlarge` (24 px) for "the largest gaps between groups". SPACE-021 turns this into starting values.

**Too close also fails.** Carbon: "Elements that are set close to each other can be easily overlooked. Users may see the grouping but not process each individual item."

**Space isn't structure.** A screen reader doesn't hear the gap. Grouping shown by space must also be in the markup (WCAG 1.3.1, level A): a list, a heading, `fieldset` for a radio group (SPACE-020).

## [SPACE-006] Group with space before borders and cards
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [NN/g: common region (2020-07-12)](https://www.nngroup.com/articles/common-region/), [M3 spacing](https://m3.material.io/foundations/layout/grids-spacing/spacing), [Carbon spacing at 5e9cd1d](https://github.com/carbon-design-system/carbon-website/blob/5e9cd1da43c32d3d3b991dc947b427f674da61a8/src/pages/elements/spacing/overview.mdx), [Polaris density at 3f7954a](https://github.com/Shopify/polaris/blob/3f7954ae42fabf26d63cee68c23ceebfd7ef0972/polaris.shopify.com/content/design/layout/density.mdx)
- Related: SPACE-005, SPACE-020, DESIGN-022, DSKILL-009

**Space first.** NN/g: "When possible, using whitespace alone to create clear groupings reduces the visual complexity of a design. Borders are often added in an abundance of caution… this approach can result in busy, cluttered designs"; full-width dividers can "create false floors", so users stop scrolling. Carbon: space "creates content sections on a page without having to use lines or other graphical elements as a divider." M3 names the two kinds: "Implicit grouping uses close proximity and open space (rather than lines and shadows)"; "Explicit grouping uses visual boundaries like outlines, dividers, and shadows" (rendered page text). This backs DESIGN-022's "Default: no cards".

**When a boundary earns its place.** NN/g: a boundary "can overpower other grouping principles such as proximity", so use it "when adjusting the amount of whitespace between objects isn't possible". Its example: a tablet grid where long titles pushed bylines and ratings away until a card fixed it. Polaris uses dividers "to create clear delineation between sections in a high density component". So: variable-height content in a grid, dense tables and panels, and items that act as one target need a boundary; a page of sections doesn't.

**For an agent:** before adding a border, card or divider, try widening the gap between groups to a larger step (SPACE-021). If the grouping is then clear, leave the border out. Space, borders and cards are all visual only: the group still needs its element in the markup (1.3.1, SPACE-020).

## [SPACE-007] Component padding in the design systems
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [material-web at 86cb0d4](https://github.com/material-components/material-web/tree/86cb0d484d0cda1193f09bb3ee70b8e2ed8e6a79), [Carbon styles at 131963f](https://github.com/carbon-design-system/carbon/tree/131963f845690100432f8c62a3372caf151f31fa/packages/styles/scss), [govuk-frontend components at 78d66a8](https://github.com/alphagov/govuk-frontend/tree/78d66a80594224f358c09c8ba9309dd78e116a0c/packages/govuk-frontend/src/govuk/components), [`@fluentui/react-button` 9.11.3](https://www.npmjs.com/package/@fluentui/react-button/v/9.11.3), [`@shopify/polaris-tokens` 9.4.2](https://www.npmjs.com/package/@shopify/polaris-tokens/v/9.4.2)
- Related: SPACE-008, SPACE-011, SPACE-014, SPACE-020, ACCESS-002

Values in px, from component source (material-web tokens and `_dialog.scss`; Carbon `button/_vars.scss`; GOV.UK mixins).

| System | Button | Text input | Card | List row | Dialog |
|---|---|---|---|---|---|
| Material Web | height 40, sides 24 (16 by a leading icon) | height 56, padding 16 | — | 12 above and below | 24; actions `16px 24px 24px` |
| Carbon | height 48, left 16, right 64 (icon room) | `padding-inline` 16 | tile 16 | — | 16 sides |
| Fluent 2 | medium `5px 12px`, min width 96 | sides 8–12 | 8, 12 or 16 | — | — |
| GOV.UK | `8px 10px 7px` around 19 px text | height 40, padding 5 | — | summary list 10 above and below, 20 right | — |
| Polaris | — | — | `--p-space-card-padding` 16 | table cell 6 | — |

**Agreement:** horizontal button padding 10–24, card padding 8–16, dialog padding 16–24, control heights 40–48.

**Choices:** whether side padding reserves icon room (Carbon's 64 px right), and whether an input's height is fixed (GOV.UK, Material) or comes from padding and line height (Fluent).

**Use `min-height`, not `height`,** on anything holding text: a fixed height clips or overlaps when users raise line height under 1.4.12 (SPACE-020).

**Padding and type.** Several systems pad less below the text than above: GOV.UK subtracts its 2 px border and half its shadow; Carbon's `$button-padding` is `calc(0.875rem - 3px) calc(#{$spacing-10} - 1px)`. Those offsets fit the system's own font; with another font, centre the label with `text-box` (SPACE-013) rather than copying them.

**Targets.** 24 px, or enough spacing, is the AA floor (2.5.8); 44 px is AAA 2.5.5 (DSKILL-014).

## [SPACE-008] Density changes padding tokens, not the scale
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [M3 density](https://m3.material.io/foundations/layout/grids-spacing/density), [Carbon `_layout.scss` at 131963f](https://github.com/carbon-design-system/carbon/blob/131963f845690100432f8c62a3372caf151f31fa/packages/styles/scss/utilities/_layout.scss), [`@shopify/polaris-tokens` 9.4.2](https://www.npmjs.com/package/@shopify/polaris-tokens/v/9.4.2)
- Related: SPACE-007, SPACE-001, SPACE-020, LAYOUT-005, LAYOUT-006

When to go dense is LAYOUT-005, and Angular Material's density scale LAYOUT-006; this entry records only the tokens density changes.

- **M3** (rendered page text): "Higher density is typically applied by decreasing the top and bottom padding or overall height by 4dp." It warns: "Don't increase density in UIs that involve focused tasks, such as selecting from a menu. It reduces usability by limiting selectable space."
- **Carbon**: a `density` map with `padding-inline: (condensed: $spacing-03, normal: $spacing-05)`, 8 px against 16 px; component heights come from a separate `size` map (xs 24 to 2xl 80 px); `icon-gap` runs from `$spacing-02` (xs) to `$spacing-04` (2xl).
- **Polaris**: `--p-space-card-gap` is `space-400` (16 px) in the base theme and `space-200` (8 px) in its mobile theme; `--p-space-table-cell-padding` is `space-150` (6 px).

**Pattern:** density swaps which scale step a padding token points at; the scale itself stays the same. Define padding as semantic tokens (`--space-control-inline`) that point at scale steps, so a density mode is one remap, not edits in every component.

**The target floor applies after the change.** Carbon's `xs` controls are 24 px, exactly WCAG 2.5.8's minimum, and each 4dp step down takes an M3 control toward it. Don't go denser than that on anything clickable, and keep the spacing between small adjacent targets (SPACE-020).

## [SPACE-009] Whitespace and comprehension: one small study and a phantom 20%
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-28
- Sources: [Chaparro et al. 2004, Usability News 6.2 (archived)](https://web.archive.org/web/2010/http://psychology.wichita.edu/surl/usabilitynews/62/whitespace.asp), [HFI newsletter, December 2005 (archived)](https://web.archive.org/web/20061209013428/http://www.humanfactors.com/downloads/dec05.asp), [Carbon spacing at 5e9cd1d](https://github.com/carbon-design-system/carbon-website/blob/5e9cd1da43c32d3d3b991dc947b427f674da61a8/src/pages/elements/spacing/overview.mdx), [NN/g: proximity](https://www.nngroup.com/articles/gestalt-proximity/)
- Related: SPACE-005, SPACE-006

**The study.** Chaparro, Baker, Shaikh, Hull and Brady (Wichita State, Usability News 6.2, 2004): "Twenty college students"; one was "eliminated from the analysis", so 19. Passages had "10 mm of white space surrounded the text (Margin) or 2 mm" and two leadings. "Comprehension of the Margins was higher than that of the No Margins" (F(1,17) = 8.34, p = .01); participants "read the Margin passages slower, but comprehended more". Mean scores out of 8: 5.17 and 5.06 with margins, 4.28 and 4.58 without. "Leading was not shown to impact reading performance but did influence overall user preference." The paper calls earlier results "mixed".

**The 20% claim.** Its earliest form we found is Human Factors International's December 2005 newsletter: "Use of whitespace between paragraphs and in the left and right margins increased comprehension by almost 20%. (Lin, 2004)". The reference is Lin, D. Y. M. (2004), "Evaluating older adults' retention in hypertext perusal: impacts of presentation media as a function of text topology", *Computers in Human Behavior* 20: by its title a study of presentation media and hypertext structure, not whitespace (full text not read). The Wichita paper has no percentage either; its means differ by about 15% (our arithmetic), for margins around one passage, not space in a UI.

**What else exists.** NN/g's proximity, common-region and form articles state principles with examples, not measurements. Carbon and Fluent assert that "White space helps with information processing" without a study.

**For an agent:** argue for space with grouping (SPACE-005), not with a comprehension figure. Don't quote the 20%.

## [SPACE-010] Text alignment: start-align body, centre short phrases, don't justify
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [GOV.UK: font override classes](https://design-system.service.gov.uk/styles/font-override-classes/), [Butterick: centered text](https://practicaltypography.com/centered-text.html), [Butterick: justified text](https://practicaltypography.com/justified-text.html), [USWDS typography](https://designsystem.digital.gov/components/typography/), [WCAG 2.2 Understanding 1.4.8](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html), [MDN: text-align](https://developer.mozilla.org/en-US/docs/Web/CSS/text-align)
- Related: SPACE-020, DESIGN-020, VIZ-016, CSS-006

**Body text: start-aligned.** GOV.UK: "you should usually left-align body copy text. Right-aligned body copy text can be hard for users to find and read when they magnify their screen." USWDS: "Type set flush left provides the eye a constant starting point for each line".

**Centred: short runs only.** Butterick's rule: "Whole text blocks should not be centered… both edges of the text block are uneven." Centring suits "short phrases or titles". A centred title or one-line empty-state message is fine; check it at 320 px, where a short line can wrap into the centred block the rule warns against, and use `text-wrap: balance` (newly available since 2024-05-13, ignored elsewhere) to even the lines. No design system read prescribes centring for empty states or button labels; those are convention. `<button>` and `<th>` centre by default, so set `text-align: start` where you want otherwise.

**Justified.** Butterick calls it "a matter of personal preference" that requires hyphenation, yet for web pages he will "always left-align the text, because justification can look clunky and coarse." GOV.UK says plainly: "Do not 'justify' blocks of body copy text". WCAG 1.4.8 (AAA) explains the "rivers of white" that trouble some readers with cognitive disabilities. So: don't justify UI or web body text. If you must, add `hyphens: auto` with a correct `lang` attribute. These sources write about Latin-script text; other scripts weren't researched.

**RTL.** Write `text-align: start`, not `left`. MDN: `start` is "The same as `left` if direction is left-to-right and `right` if direction is right-to-left." The same holds for `padding-inline-start` against `padding-left` (SPACE-018).

Numbers in tables are the exception: right- or decimal-align them, with tabular figures (VIZ-016).

## [SPACE-011] Icons beside text: size and gap in the design systems
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [material-web button at 86cb0d4](https://github.com/material-components/material-web/blob/86cb0d484d0cda1193f09bb3ee70b8e2ed8e6a79/button/internal/_shared.scss), [`@fluentui/react-button` 9.11.3](https://www.npmjs.com/package/@fluentui/react-button/v/9.11.3), [Carbon `_layout.scss` at 131963f](https://github.com/carbon-design-system/carbon/blob/131963f845690100432f8c62a3372caf151f31fa/packages/styles/scss/utilities/_layout.scss), [Font Awesome `styles.css` 7.3.1](https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-svg-core@7.3.1/styles.css), [Apple: custom SF Symbols](https://developer.apple.com/documentation/technologyoverviews/custom-sf-symbols), [CSS Inline 3 (ED 2026-10-14)](https://drafts.csswg.org/css-inline-3/)
- Related: SPACE-012, SPACE-016, SPACE-007, SPACE-021

| System | Icon beside text | Gap |
|---|---|---|
| Material Web | 18 px in a 40 px button | `gap: 8px` |
| Fluent 2 | 20 px (24 large) | 6 px medium and large, 4 px small |
| Carbon | — | `icon-gap` 4 (xs), 8 (sm, md), 12 (lg and up) |
| Font Awesome | `height: 1em` | pull margin `0.3em` |

All three component libraries put the icon and label in an inline-flex row with `align-items: center` and a fixed `gap`, not a margin on the icon. The icon gap is the smallest space around a button's content, so the icon reads as part of the label (SPACE-005).

**Sizing to the font.** `1em` is the font size, `1cap` the capital height, `1lh` the line height (MDN; `cap` and `lh` are widely available). Font Awesome's inline rule:

```css
.svg-inline--fa { height: 1em; vertical-align: -0.125em; }
```

**Centring on the capitals** is the convention for capital-led UI labels. Apple: "The system automatically centers symbols vertically to San Francisco's cap height". The CSS Inline 3 draft: "To center the text visually, it's necessary to assume the cap height and alphabetic baseline as the top and bottom edges of the text". It fits Latin, Greek and Cyrillic; for all-lowercase labels the x-height middle may look better, and scripts without capitals need their own edge (SPACE-013). SPACE-012 measures how close each CSS method gets.

## [SPACE-012] Test: icon and label alignment across five fonts
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [MDN: vertical-align](https://developer.mozilla.org/en-US/docs/Web/CSS/vertical-align), [MDN: align-items](https://developer.mozilla.org/en-US/docs/Web/CSS/align-items), [Font Awesome `styles.css` 7.3.1](https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-svg-core@7.3.1/styles.css)
- Related: SPACE-011, SPACE-013, SPACE-016, SPACE-002

A 16 px label at line height 1.5 beside a square SVG icon. Each figure is the icon's centre minus the middle of the capitals (baseline minus half of `1cap`, the font's cap-height metric), from `getBoundingClientRect`; positive means the icon sits lower.

| Method | DejaVu Sans | Liberation Serif | WenQuanYi, IPAGothic, Ubuntu |
|---|---|---|---|
| flex `center`, icon `1em` | +0.5 to +1 | −0.3 to +0.2 | −0.5 to +0.5 |
| flex `center`, label trimmed with `text-box` | 0 | 0 | 0 |
| inline `vertical-align: -0.125em` | 0 | −0.8 | −0.5 to 0 |
| inline `vertical-align: middle` | +1.5 | +1.6 | +1 to +1.8 |
| flex `baseline` | −2 | −2.8 | −2 to −2.5 |

**Read:** `center` and Font Awesome's offset stay within a pixel in every font. `baseline` puts the icon's bottom edge on the baseline, so it rides 2–3 px high; `middle` aligns to "the baseline plus half the x-height" (MDN), so it sits 1–2 px low. `center` follows the line box, so the offset is half of (ascent − descent − cap height) and differs per font; trimming the label to `cap alphabetic` (SPACE-013) removes it. A `1cap` icon centred the same as `1em`, just 25% smaller. Chromium differed from WebKit and Firefox by up to 0.5 px.

**For an agent:** `align-items: center` with a `gap`; if a font still sits a pixel off, trim the label rather than nudging with `mt-0.75` per breakpoint. Untested: labels that wrap, where `center` centres the icon on the whole block; `align-items: flex-start` with the icon in a `1lh`-tall box is the usual fix.

Tested 2026-10-28, Playwright 1.64.1 (Chromium 156.0.8078.4, WebKit 27.2, Firefox 157.0), Node 24.21.0: the values above.

## [SPACE-013] `text-box`: trimming the space above and below text, and its support
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [CSS Inline 3 (ED 2026-10-14)](https://drafts.csswg.org/css-inline-3/), [MDN: text-box-edge](https://developer.mozilla.org/en-US/docs/Web/CSS/text-box-edge), [Chrome: CSS text-box-trim (2025-01-14)](https://developer.chrome.com/blog/css-text-box-trim), [WebKit: Safari 18.2](https://webkit.org/blog/16472/webkit-features-in-safari-18-2/), [Firefox 154 release notes](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/154), [web-features 3.44.0](https://www.npmjs.com/package/web-features), [Firefox `StaticPrefList.yaml` (release)](https://github.com/mozilla-firefox/firefox/blob/release/modules/libpref/init/StaticPrefList.yaml)
- Related: SPACE-014, SPACE-015, SPACE-012, SPACE-007, CSS-002, CSS-011

A line box adds half-leading above the font's ascent and below its descent. Above a label's capitals sits half-leading plus the ascent's excess over cap height; below its baseline, half-leading plus the descent. So `padding: 12px` looks larger above and below than at the sides, by a per-font amount. `text-box` trims the first line's top and last line's bottom:

```css
.label { text-box: trim-both cap alphabetic; }
```

Chrome calls `cap alphabetic` "the most common use". Browsers implement over edges `text`, `cap`, `ex` and under edges `text`, `alphabetic`; the spec's `ideographic` edges have no BCD entry. `text-box: trim-both` alone trims only to the `text` edges (24 → 19 px in our test).

**Shipped:** Safari 18.2 (2024-12-11), Chrome and Edge 133 (2025-02-04), Firefox 154 (2026-08-18).

**Status conflict.** web-features 3.44.0 and webstatus.dev say `limited`. Its nine property keys are already newly available (2026-08-18, Firefox 154); the five `css.types.text-edge` keys hold it back, because BCD 8.1.7 marks those Firefox values "Rendering not implemented (only parsing and serialization)". Against that: Firefox 154's release notes, `layout.css.text-box.enabled: true` on its release branch, and our Firefox 157 test trimming exactly as Chromium and WebKit do. Trust the test; expect newly available once BCD catches up.

**Fonts and scripts.** Metrics come from the first available font, so a fallback font is trimmed wrongly. The spec: they "exist in OpenType for Latin/Cyrillic/Greek and for CJK" but "are missing for many other writing systems". Use `cap alphabetic` for Latin-script UI; elsewhere `text` or none.

**Fallback:** unsupported browsers keep the half-leading. Pick padding that looks right untrimmed, or put smaller padding in `@supports (text-box: trim-both cap alphabetic)`.

Tested 2026-10-28, Playwright 1.64.1 (Chromium 156, WebKit 27.2, Firefox 157), DejaVu Sans 16/1.5: 24 → 12 px (`cap alphabetic`), 9 px (`ex alphabetic`); a 40/1.2 heading 48 → 30 px.

## [SPACE-014] `text-box` traps: flex containers, single edges, padding, clipping
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [CSS Inline 3 (ED 2026-10-14)](https://drafts.csswg.org/css-inline-3/), [MDN: text-box-edge](https://developer.mozilla.org/en-US/docs/Web/CSS/text-box-edge), [Firefox 156 release notes](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/156)
- Related: SPACE-013, SPACE-007, SPACE-011, SPACE-020

Ways `text-box` silently does nothing or harm:

1. **On a flex or grid container.** The spec: "Like ::first-line, this property does not apply to, or propagate through, flex, grid, or table formatting contexts." An icon button is usually `inline-flex`: put `text-box` on the label element inside it.
2. **One edge keyword.** MDN: "At the time of writing, the only valid single value is `text`." The spec's grammar allows a single `text` (or an ideographic edge), not `cap`, so Chromium 156 is right to drop `text-box: trim-both cap`; WebKit 27.2 and Firefox 157 accept it. Write both edges: `cap alphabetic`.
3. **Padding or border in between.** The spec trims the first line "If there is no such line, or if there is intervening non-zero padding or borders, there is no effect." Set it on the element whose lines are the text.
4. **`overflow: hidden` on the trimmed element.** Descenders, accents and round letters' overshoot extend past a `cap alphabetic` box, so Chromium and WebKit clip them; Firefox instead dropped the trim. Truncated labels (`text-overflow: ellipsis`, `line-clamp`) need their padding or `text alphabetic` edges. Firefox: `text-box-trim` "still has no effect in combination with `line-clamp`".

Trimming touches only the first and last lines. In running text, set block gaps explicitly after trimming (SPACE-017).

Tested 2026-10-28, Playwright 1.64.1 (Chromium 156, WebKit 27.2, Firefox 157), 16/1.5 text, button `padding: 12px 16px`: `text-box` on the `inline-flex` button left it 48 px; on the label span, 36 px; plus a 16 px icon, 40 px. `trim-start cap`: Chromium 24 px, the others 18.5 px. A trimmed 32 px "gypsy" left about 120 dark pixels below its box; with `overflow: hidden`, none in Chromium and WebKit, and Firefox's box stayed 48 px.

## [SPACE-015] Vertical rhythm: `lh` and `rlh`, and no baseline grid
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [MDN: length units](https://developer.mozilla.org/en-US/docs/Web/CSS/length), [A List Apart: setting type on the web to a baseline grid (2007)](https://alistapart.com/article/settingtypeontheweb/), [CSS Rhythmic Sizing (WD 2026-10-08)](https://drafts.csswg.org/css-rhythm/), [Chrome Platform Status: line-height-step](https://chromestatus.com/feature/5734273533345792), [Butterick: line spacing](https://practicaltypography.com/line-spacing.html), [web-features 3.44.0](https://www.npmjs.com/package/web-features)
- Related: SPACE-013, SPACE-020, DESIGN-020, CSS-002

**Units.** `lh` is "the computed value of the line-height property of the element", `rlh` the root's, `cap` the cap height (MDN). web-features 3.44.0: `lh` and `rlh` widely available (newly 2023-11-21), `cap` widely (2023-12-11), `rcap` newly (2026-01-13). `1lh` uses the element's own line height, so a heading and a paragraph get different gaps from the same rule; `1rlh` or a scale token keeps one rhythm. Set `line-height` unitless so children with larger text get their own leading.

**No baseline grid.** `line-height-step` (CSS Rhythmic Sizing, a Working Draft of 2026-10-08) would round line boxes to a step. Chrome Platform Status lists it "In developer trial (Behind a flag)" since milestone 60; it isn't in BCD or web-features, and MDN says "Currently, no browsers support this feature." Don't use it. Older web-typography articles do recommend one: A List Apart's "Setting Type on the Web to a Baseline Grid" (2007) wants "the bottom of every line of text (the baseline)" on "a vertical grid set in even increments all the way down the page", using line height and margins. None of the design systems read asks for it, and mixed sizes, images and users' text spacing (SPACE-020) break such a grid.

**Rhythm in practice** (a convention, not a rule from a source): one line height for body text and block gaps taken from the scale or `rlh`, with `text-box` trimming components' outer edges (SPACE-013). Butterick's range is for body text: "For most text, the optimal line spacing is between 120% and 145% of the point size."

**Trap:** `height: 3lh` clips when a user raises line height under 1.4.12; use `min-height` (SPACE-020).

## [SPACE-016] Optical alignment: overshoot, cap-height centring, hanging punctuation
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [Google Fonts Knowledge: overshoot](https://github.com/google/fonts/blob/main/cc-by-sa/knowledge/glossary/terms/overshoot/content.md), [Apple: custom SF Symbols](https://developer.apple.com/documentation/technologyoverviews/custom-sf-symbols), [Atlassian spacing](https://atlassian.design/foundations/spacing), [MDN: hanging-punctuation](https://developer.mozilla.org/en-US/docs/Web/CSS/hanging-punctuation), [web-features 3.44.0](https://www.npmjs.com/package/web-features)
- Related: SPACE-011, SPACE-012, SPACE-014

**Fonts and icon sets already correct for the eye.** Google Fonts Knowledge: overshoots "create the optical illusion that all letterforms are aligned… Without overshoots, our eyes interpret these characters as appearing shorter than the rest." Apple centres symbols on cap height and lets icon designers make "minor optical adjustments" in the glyph. Our conclusion, not a source's: align boxes mathematically in CSS and leave optical correction to the glyph, since a nudge by eye in CSS repeats it differently per font (SPACE-012). Overshoot is also why trimmed text pokes past a `cap alphabetic` box (SPACE-014).

**Where CSS has to correct.** An asymmetric glyph in a symmetric box: a play triangle in a circle, an arrow with its weight on one side. Atlassian lists "Use optical adjustment" as a principle (rendered page text) but gives no values. Fix it in the SVG's `viewBox` or path so the correction travels with the icon, not as a margin at each use. Material's icon keylines are described only on a JavaScript-rendered page we couldn't read as text; unverified.

**Hanging punctuation.** `hanging-punctuation: first` hangs an opening quote or bracket outside the text block (MDN). web-features 3.44.0: `limited`; BCD 8.1.7 lists only Safari (full from 26.5; partial since 10). Use it as an enhancement on pull quotes: other browsers keep the quote inside the block, today's look. No typographic source on it was found.

## [SPACE-017] `gap` against margins and the lobotomised owl
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [MDN: gap](https://developer.mozilla.org/en-US/docs/Web/CSS/gap), [Pickering: Axiomatic CSS and lobotomized owls (2014-10-21)](https://alistapart.com/article/axiomatic-css-and-lobotomized-owls/), [Every Layout: Stack](https://every-layout.dev/layouts/stack/), [web-features 3.44.0](https://www.npmjs.com/package/web-features)
- Related: SPACE-018, SPACE-005, SPACE-020, DESIGN-022, LAYOUT-012

**Use `gap` in flex and grid.** Flexbox `gap` is widely available (newly 2021-04-26); grid's since 2017. It spaces items without space at the edges and without collapsing.

**Margins in a wrapping row** (300 px wide, five 90 px items, 12 px spacing):

| Method | Items per row | Second row starts at | Height |
|---|---|---|---|
| `gap: 12px` | 3 | 0 | 52 px |
| `margin: 0 12px 12px 0` | 2 | 0 | 96 px |
| `> * + * { margin-left: 12px }` | 3 | 12 px | 40 px |

For these widths, margins count toward line breaking (3 × 102 px > 300), so rows wrap early and a trailing margin hangs off the end. The owl indents every wrapped row and adds no space between rows.

**The owl is for block flow.** Every Layout's Stack: `.stack > * + * { margin-block-start: 1.5rem; }`, so the margin "is only applied where the element is preceded by another element: no 'left over' margin." That suits prose of unknown children (CMS output, Markdown), where a flex column would stop margin collapse. For a stack of components, `display: flex; flex-direction: column; gap` does the same. Don't use the recursive `.stack * + *`; Every Layout warns it hits nested elements.

**Ownership:** a component sets its own padding; its parent sets the gap between components. A margin on a reusable component adds to the parent's gap.

**Space isn't markup.** A gap doesn't replace `<p>`, lists or headings: no `<br><br>` or empty `<div>`s for spacing (1.3.1, SPACE-020).

Tested 2026-10-28, Playwright 1.64.1 (Chromium 156, WebKit 27.2, Firefox 157): the table's values, identical in all three.

## [SPACE-018] Margin collapse, logical properties, block `align-content`, `margin-trim`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [MDN: mastering margin collapsing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Mastering_margin_collapsing), [MDN: logical properties basic concepts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values/Basic_concepts_of_logical_properties_and_values), [MDN: margin-trim](https://developer.mozilla.org/en-US/docs/Web/CSS/margin-trim), [web-features 3.44.0](https://www.npmjs.com/package/web-features), [BCD 8.1.7](https://www.npmjs.com/package/@mdn/browser-compat-data)
- Related: SPACE-017, SPACE-010, CSS-002, CSS-005, CSS-011

**Margin collapse** (MDN) still bites in block flow: adjacent siblings keep the larger margin, and a first child's top margin escapes its parent "unless the parent has a border-top, padding-top, contains any inline content… or has clearance applied." A new block formatting context (`display: flow-root`) also stops it. "Margins don't collapse in a container with `display` set to `flex` or `grid`", so switching a block stack to a flex column changes its spacing. Tested: margins of 16 px above and 24 px below gave 24 px between two blocks and 40 px in a flex column, in all three engines.

**Logical properties** (`margin-inline`, `padding-block`, `inset-inline-start`) are widely available (newly 2021-09-20). They flip with `direction` and writing mode; in a left-to-right-only app they change nothing, so converting existing code isn't worth it. Use them in new code and in anything that may be translated (SPACE-010).

**`align-content` on block containers** centres a block's content vertically without flex: Chrome and Edge 123, Firefox 125, Safari 17.4; widely available since 2026-10-16. MDN's box-alignment guide still says there's no browser support; trust BCD.

**`margin-trim`** removes children's margins at the container's edge. web-features: `limited`; block values in Safari 16.4 and Chrome 155 (2026-10-06), inline values Safari only, none in Firefox. webstatus.dev still lists only Safari. Fall back to `> :first-child { margin-block-start: 0 }`, or use `gap`.

Statuses from `jq '.features["<id>"].status' data.json` on web-features 3.44.0 (CSS-002) for `logical-properties`, `align-content-block` and `margin-trim`.

## [SPACE-019] Tailwind 4: limiting spacing utilities to a named scale
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [Tailwind: theme variables](https://tailwindcss.com/docs/theme), [Tailwind docs source: padding at 7f92c22](https://github.com/tailwindlabs/tailwindcss.com/blob/7f92c2213315c195dae583d68752da4042da3ade/src/docs/padding.mdx), [Tailwind `theme.css` v4.3.3](https://github.com/tailwindlabs/tailwindcss/blob/v4.3.3/packages/tailwindcss/theme.css)
- Related: SPACE-002, SPACE-001, DESIGN-023, CSS-015

Tailwind 4's default is one variable, `--spacing: 0.25rem`, and `p-<number>` compiles to `calc(var(--spacing) * <number>)`. Any multiple works, so `p-0.75` (3 px), `pt-1.75` (7 px) and `px-4.5` (18 px) are all valid: the framework imposes no scale.

To impose one, reset the multiplier and name the steps, including zero:

```css
@theme {
  --spacing: initial;
  --spacing-0: 0;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-12: 3rem;
}
```

Then `p-4` compiles to `padding: var(--spacing-4)`, negatives such as `-mt-4` still work, and an unnamed step such as `p-5` or `p-0.75` produces no CSS at all: it shows up as missing styling in review. Without `--spacing-0`, `p-0`, `m-0`, `gap-0` and `inset-0` vanish too. Arbitrary values (`m-[13px]`) and `px` (`mt-px`, 1 px) still compile; catch those in review or lint.

The docs' own example for a full custom theme is `--*: initial` with `--spacing: 4px` (DESIGN-023), which keeps the free multiplier.

**Trade-off:** many utilities share `--spacing`: sizes (`w-`, `h-`, `size-`, `max-h-`, `basis-`), position (`inset-`, `top-`, `translate-`), `scroll-m-`, `indent-`. A named scale limits all of them. Name the size steps you use, or keep sizes in their own tokens.

Tested 2026-10-28, `tailwindcss` and `@tailwindcss/cli` 4.3.3, Node 24.21.0: with the reset and named steps 1, 2 and 4, `p-1`, `p-2`, `p-4` and `gap-4` compiled to `var(--spacing-N)`; `p-3`, `p-0.75`, `gap-5`, `w-5`, `size-6`, `p-0`, `m-0`, `gap-0` and `inset-0` produced nothing; `-mt-4`, `translate-x-4`, `m-[13px]` and `mt-px` compiled.

## [SPACE-020] Spacing that WCAG requires, apart from conventions
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [WCAG 2.2 Understanding 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html), [WCAG 2.2 Understanding 1.4.8](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html), [WCAG 2.2 Understanding 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [WCAG 2.2 Understanding 1.3.1](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html), [WCAG 2.2 Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- Related: ACCESS-001, ACCESS-002, SPACE-005, SPACE-007, SPACE-010, SPACE-015, DSKILL-014, LAYOUT-017

Everything else in this file is convention. These are requirements:

- **1.4.12 Text Spacing (AA).** "no loss of content or functionality occurs by setting" line height to 1.5, paragraph spacing to 2, letter spacing to 0.12 and word spacing to 0.16 times the font size. Authored values needn't meet these; users' overrides must work. Fixed `height` on text containers and clipping the user can't reveal break it (SPACE-007, SPACE-015).
- **1.4.10 Reflow (AA).** No two-dimensional scrolling at 320 CSS px wide. Fixed padding and gutters add up there; prefer rem and `clamp()` with a rem term (SPACE-004), and wrapping `gap` rows (SPACE-017).
- **2.5.8 Target Size (Minimum) (AA).** 24 by 24 CSS px, or spaced so that 24 px circles "do not intersect another target or the circle for another undersized target"; exceptions in ACCESS-002. Density modes are where it fails (SPACE-008).
- **1.4.8 Visual Presentation (AAA).** "a mechanism is available" for unjustified text, lines of at most 80 characters, line spacing of 1.5 and paragraph spacing 1.5 times that; "Content is not required to use these values." AAA: a target, not our floor (ACCESS-001); SPACE-010 explains why we don't justify anyway.
- **1.3.1 Info and Relationships (A).** Grouping shown by space or borders (SPACE-005, SPACE-006) must also exist in markup: headings for sections, lists for lists, `fieldset` and `legend` for radio and checkbox groups and multi-part fields such as a date. A single labelled field needs none.

DSKILL-014 has the same split for type sizes and targets.

## [SPACE-021] Starting values by role: icon gap, group, section
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [Atlassian spacing](https://atlassian.design/foundations/spacing), [govuk-frontend at 78d66a8](https://github.com/alphagov/govuk-frontend/tree/78d66a80594224f358c09c8ba9309dd78e116a0c/packages/govuk-frontend/src/govuk), [material-web at 86cb0d4](https://github.com/material-components/material-web/tree/86cb0d484d0cda1193f09bb3ee70b8e2ed8e6a79), [Carbon `_layout.scss` at 131963f](https://github.com/carbon-design-system/carbon/blob/131963f845690100432f8c62a3372caf151f31fa/packages/styles/scss/utilities/_layout.scss)
- Related: SPACE-002, SPACE-005, SPACE-006, SPACE-011, SPACE-007

A scale and "less inside than between" still leave an agent guessing. Our synthesis of starting values, each a step of SPACE-002's scale:

| Role | Start at | Anchored on |
|---|---|---|
| Icon to its label | 4–8 px | Material 8, Fluent 4–6, Carbon 4–12 (SPACE-011) |
| Inside a group (label to field, items in a card) | 8–16 px | Atlassian: 0–8 px "for small and compact pieces of UI", 12–24 px "for larger and less dense pieces of UI"; GOV.UK label 5, hint 10–15 |
| Between groups (form fields, cards) | 24–32 px | GOV.UK 20–30 between form groups; Atlassian's `space.gap.xxlarge` 24 |
| Between sections | 48–80 px | Atlassian: 32–80 px "for the largest pieces of UI and for layout elements" |

Atlassian's three ranges are rendered page text; the table is ours, not any one system's rule.

**How to use it:**
- Pick the inner gap first, then make the next level at least two steps larger on the scale; a one-step difference (16 against 20) rarely reads as a separate group.
- Keep the ladder at every width: shrink section gaps on small screens before group gaps (SPACE-003).
- If two levels look the same, add space before adding a border (SPACE-006).

Not covered by any source we read: whether a heading should have more space above than below, and nested radius against padding (Open questions).

## Recommendations for our setup

Ranked by impact against effort. Read 2026-10-28 from `main`: osrs-tracker-web (`1366d45`) uses Tailwind 4's default `--spacing` multiplier with 25 distinct spacing steps in its templates; the rare ones (`0.75`, `1.75`, `2.25`, `4.5`, `7`, `21`, `28`, one to six uses each) include optical nudges, such as `mt-0.75 sm:mt-2.25` lining an external-link icon up with a heading and `pt-1.75 pb-1.5` centring row labels. It has 88 physical left/right utilities and no right-to-left locale. freek-mencke-web (`ce05f2b`) uses 12 steps plus fluid `--spacing-section` and `--spacing-gutter` tokens; its few raw pixel values in component CSS sit on a 4 px grid.

1. **osrs-tracker-web: replace the nudges and record its spacing scale** (osrs-tracker/osrs-tracker-web#477). Align icons with `align-items: center` and trimmed labels instead of per-breakpoint margins (SPACE-012, SPACE-013, SPACE-014); move off-scale steps onto the scale (SPACE-002); enforce it in `@theme` only if naming the shared size steps is worth it, since about 426 size and position utilities use the same namespace (SPACE-019).
2. Done 2026-10-28: the scale, the starting values, the proximity rule and space before borders are in `angular-conventions`, `ui-review` and `design-workshop`'s brief (FreekMencke/claude-skills#120, FreekMencke/claude-skills#121, FreekMencke/claude-skills#122). SPACE-021, SPACE-005, SPACE-006.
3. **Won't do: convert to logical properties.** Neither app has or plans a right-to-left locale, so `ml-`/`pl-` work the same; use `ms-`/`ps-` in new code only (SPACE-018).
4. **No change for freek-mencke-web.** Its fluid section and gutter tokens already follow SPACE-003's pattern.

## Open questions

1. **Material 3's numeric scale.** The public M3 pages publish none, and material-web says spacing tokens aren't "formally added"; the Figma kit's "Spacing system & tokens" wasn't read. Looked at: m3.material.io spacing and density pages (rendered), material-web at `86cb0d4`.
2. **Why 8 px (Atlassian) or 4 px (Polaris).** Neither page nor token metadata gives a reason. Looked at: atlassian.design spacing (rendered), `@atlaskit/tokens` 20.8.2, Polaris at `3f7954a`.
3. **Material icon keylines.** The system-icons page renders in JavaScript; its keyline sizes stay unverified (SPACE-016).
4. **When web-features marks `text-box` Baseline.** Depends on BCD updating Firefox's `text-edge` values (SPACE-013). Looked at: BCD PRs mdn/browser-compat-data#30221 and #30597.
5. **Heading spacing and nested radius.** Butterick says only to put "space above and below" headings; no source read sets more above than below, or inner radius against padding. Looked at: Butterick's headings page, GOV.UK's typography SCSS.
6. **NN/g on text alignment** and a typographic source on hanging punctuation: none found. Looked at: WebSearch on nngroup.com, Butterick's index.
7. **Icons beside wrapping labels** and text in scripts without capitals: not tested (SPACE-012, SPACE-013).
8. **A measured comparison of fluid against stepped spacing**: none found (Utopia's blog, GOV.UK, Carbon).
