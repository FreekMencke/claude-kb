# Data visualisation and transformation: charts, tables, colour, formatting, motion

Prefix `VIZ`. This file covers showing data in an Angular 22 SSR app and how Claude should build it: choosing a chart, colour for data, chart and table libraries with their bundle cost, server rendering and keyboard support, accessible charts and tables, chart states, static output, shaping and formatting data in TypeScript, parsing CSV, Claude as the analyst, Claude's own dataviz tooling, and animated data. UI colour in OKLCH is in DESIGN-016, tabular numerals in DESIGN-034, general data-view states in UIPAT-001 to UIPAT-005, motion rules in ANIM-* and ANIMLIB-*, and satori rendering in OG-*.

Research basis:
- Researched 2026-10-23 (FreekMencke/claude-kb#291) by an Opus 5.5 lead with three Sonnet 5.5 readers: charts, colour and libraries (180k tokens, 65 tool calls, 17.5 min); tables, accessibility and infographics (157k tokens, 61 tool calls, 9.6 min); transformation and Claude tooling (188k tokens, 69 tool calls, 10.2 min). Then two Sonnet refuters (98k tokens, 35 tool calls, 4.7 min; 107k, 51, 8.2 min) and a Sonnet review panel of five personas: dataviz (86k, 13, 2.1 min), accessibility (96k, 8, 1.7 min), front-end (108k, 12, 2.7 min), UX/UI (108k, 21, 3.5 min) and motion (95k, 11, 1.5 min).
- Read as raw text: library sources and CHANGELOGs at pinned tags, the npm registry, MDN content, web-features and `@mdn/browser-compat-data` data, W3C WAI, WCAG 2.2 Understanding pages, ARIA 1.2, the APG, the FT Visual Vocabulary, Datawrapper's academy and blog, the Government Analysis Function, Chartability, NN/g, and the papers by Cleveland and McGill (1984), Heer and Robertson (2007), Robertson et al. (2008), Heer and Bostock (2010), Chevalier et al. (2014) and Kosara and Skau (2016), extracted with `pdfjs-dist`.
- Tested in a scratch Angular 22.2.3 app (`@angular/build` 22.2.4, zoneless, SSR with prerender) on Node 24.21.0 (ICU 78.3), with each chart library installed with `--ignore-scripts` at the version its entry names, and Playwright 1.64.1 driving Chromium 156.0.8078.4 headless. One `claude -p` probe ran on Claude Code 2.1.296 (terminal) with Haiku 5.5. No community code, skill or MCP server was installed or run.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which chart type for my data? | Name the question (comparison, ranking, change, deviation, distribution, part-to-whole, correlation, flow, place) and start from the FT Visual Vocabulary's category; one number is a stat tile, exact lookups a table. | VIZ-001, VIZ-002 |
| Are pie charts and dual axes ever OK? | Guides disagree. Pie: one total, two to five parts, one share as the message, not on dashboards (NN/g). Dual axis: avoid for general readers (Few, built-in `dataviz` skill); index to 100 or use small multiples. | VIZ-004, VIZ-003 |
| Which chart library for an Angular 22 SSR app? | Plain SVG or a table in the template first, then d3 modules, Plot, Chart.js or uPlot; ECharts or AG Charts only inside `@defer`. Not React-only libraries, not ngx-charts. | VIZ-012, VIZ-008 |
| How much does each chart library add to the bundle? | gzip over an empty app: SVG 3 kB, d3 scales 13 kB, uPlot 26 kB, Chart.js 59 kB, Plot 97 kB, ECharts core 193 kB, AG Charts 411 kB; `@defer` cuts ECharts' initial cost to 7 kB. | VIZ-009 |
| Do chart libraries work with SSR and prerender? | Prerender tested: all import; ngx-echarts and AG Charts throw (`window`), and the build still exits 0. Only template SVG, ngx-charts, Plot with `document` and ECharts' `renderToSVGString` put a chart in the HTML. | VIZ-010 |
| Which chart libraries are keyboard and screen-reader accessible? | Tested in Chromium's accessibility tree, no screen reader: only AG Charts gives arrow-key point navigation; ECharts generates a text summary; Chart.js and uPlot canvases are opaque. Every chart still needs a takeaway and a table. | VIZ-011, VIZ-014 |
| How do I make a chart accessible? | A short name (`role="img"`, or a labelled group if points are focusable), visible text stating the takeaway, a real `<table>` beside it or in `<details>`, 3:1 marks, no colour-only series, tooltips on focus too. | VIZ-014, VIZ-015, VIZ-007 |
| Which colours for chart series? | Categories: Okabe–Ito, Tableau10 or Observable10 in fixed order, at most 7–8; quantities: one-hue light-to-dark or viridis; never rainbow (Plot defaults to `turbo`). Okabe–Ito and Observable10 have hues under 3:1 on white: label or darken them. | VIZ-006, VIZ-007 |
| How should a sortable table announce its sort? | `aria-sort` on the one sorted `th`, header text in a `<button>`; Material's `MatSort` needs `LiveAnnouncer` because screen readers rarely announce `aria-sort` changes. | VIZ-016 |
| How do I format numbers for axes and tooltips? | Same locale, unit and decimals everywhere; `notation: 'compact'` (`1.2K`, `1,2 Mrd.`) on axes only, full values in tooltips and tables; explicit locale and `timeZone`. Locale output changes with ICU: test it. | VIZ-021 |
| Is `Object.groupBy` safe to use? | Yes: Baseline widely available since 2026-09-05, Node 21+; keys become strings, so use `Map.groupBy` for others. Temporal isn't Baseline and isn't in Node 24. | VIZ-020 |
| Should Claude read a big CSV to chart it? | No: query it with DuckDB, Miller, `jq` or a script and read only the aggregate. A 1,000-row CSV cost about 24,900 tokens to Read. | VIZ-023 |
| What does the built-in `dataviz` skill prescribe, and are chart MCP servers safe? | Form first, eight fixed-order hues, a palette validator (CVD ΔE 8, normal 15, 3:1), a table twin per chart, never a dual axis; it changes between point releases. AntV's and QuickChart's MCP servers send the data to third-party hosts by default. | VIZ-024, VIZ-025 |
| Should chart transitions be animated? | Animate re-sorts, filters and rescales of the same marks: 200–400 ms for frequent toggles, about 1 s for a rare re-sort of many marks; show trends statically. No library tested honours reduced motion: pass `animation: false` under `reduce`. | VIZ-026, VIZ-027 |
| What goes on a dashboard? | Few critical metrics; KPI tiles with unit, period and a named baseline; bullet charts, not gauges; no treemaps or pies; the data's date always shown. | VIZ-030 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| VIZ-001 | Choosing a chart from the question it answers | recommendation | chart-choice, ft-visual-vocabulary, stat-tile, decision-table |
| VIZ-002 | Ranking of encodings: position first, then length, angle and area | fact | graphical-perception, cleveland-mcgill, encodings, position |
| VIZ-003 | Chart patterns to avoid, and what to use instead | anti-pattern | anti-patterns, truncated-axis, 3d, rainbow, direct-labels, small-multiples |
| VIZ-004 | Dual axes and pie charts: where the guides disagree | comparison | dual-axis, pie-chart, few, datawrapper, conflict |
| VIZ-005 | Headline title, annotation and direct labels | recommendation | headline-title, annotation, direct-labels, takeaway |
| VIZ-006 | Colour for data: palette types, named palettes and how many hues | recommendation | colour, palette, okabe-ito, viridis, categorical, sequential |
| VIZ-007 | Checking data colours: colour vision deficiency, 1.4.1, 1.4.11 and dark mode | pattern | colour, cvd, wcag-1-4-11, wcag-1-4-1, dark-mode |
| VIZ-008 | Chart libraries for an Angular 22 app: licences, rendering and upkeep | comparison | chart-libraries, licenses, angular, echarts, chartjs, plot |
| VIZ-009 | What each chart library adds to an Angular 22 bundle | fact | bundle-size, gzip, angular, defer, echarts, chartjs |
| VIZ-010 | Chart libraries under SSR and prerender, and `@defer` | fact | ssr, prerender, defer, echarts, plot, ag-charts |
| VIZ-011 | Chart libraries' keyboard access and accessibility tree | fact | accessibility-tree, keyboard, playwright, ag-charts, echarts-aria |
| VIZ-012 | Which chart library, in which order, and when not to | recommendation | chart-libraries, decision, native-svg, d3, when-not-to-use |
| VIZ-013 | SVG, Canvas or WebGL by data size, and downsampling | fact | canvas, svg, webgl, lttb, decimation, web-worker |
| VIZ-014 | An accessible chart: takeaway text, a data table and one `role="img"` | pattern | accessibility, text-alternative, data-table, role-img, graphics-aria |
| VIZ-015 | Interactive charts: keyboard, tooltips and the WCAG criteria that apply | fact | accessibility, wcag, keyboard, tooltips, chartability |
| VIZ-016 | Data tables: when, alignment, units and sortable headers | pattern | tables, aria-sort, alignment, apg, matsort |
| VIZ-017 | Big tables: CDK, Material, TanStack, AG Grid, virtual scrolling and phone width | comparison | tables, cdk-table, ag-grid, tanstack-table, virtual-scroll, responsive |
| VIZ-018 | Chart states: empty, single point, outliers and loading | pattern | chart-states, empty-state, loading, outliers, single-point |
| VIZ-019 | Static charts for READMEs, email and social cards | fact | static-charts, mermaid, email, svg, og-image |
| VIZ-020 | Shaping data: `Object.groupBy`, d3-array, Arquero and time buckets | recommendation | groupby, d3-array, arquero, aggregation, time-zones |
| VIZ-021 | Formatting numbers and dates with `Intl` for axes, tooltips and tables | fact | intl, numberformat, compact-notation, d3-format, locale |
| VIZ-022 | Parsing CSV and large inputs: RFC 4180, BOMs, Papa Parse, csv-parse, DuckDB-WASM | fact | csv, papaparse, csv-parse, bom, duckdb-wasm |
| VIZ-023 | Claude as the analyst: query the data, don't read it into context | recommendation | data-analysis, tokens, duckdb, jq, verification |
| VIZ-024 | The built-in `dataviz` skill: what it prescribes and how it changes | tool | dataviz-skill, bundled-skills, palette-validator, claude-code |
| VIZ-025 | Chart MCP servers and skills: what they run, write and send | tool | mcp, chart-servers, antv, supply-chain, data-egress |
| VIZ-026 | Animated transitions: what the research supports | fact | animated-transitions, object-constancy, heer-robertson, small-multiples |
| VIZ-027 | Chart libraries' animation defaults and reduced motion | fact | animation, prefers-reduced-motion, echarts, chartjs, ngx-charts |
| VIZ-028 | Count-ups, live charts and scrollytelling: pause and reduced-motion versions | recommendation | count-up, live-data, wcag-2-2-2, scrollytelling, view-transitions |
| VIZ-029 | Commercial chart licences: Highcharts, AG Charts Enterprise, ApexCharts | fact | licenses, highcharts, ag-charts-enterprise, apexcharts, pricing |
| VIZ-030 | Dashboards: scope, KPI tiles, sparklines and gauges | recommendation | dashboards, kpi-tile, sparkline, gauge, bullet-chart |

## [VIZ-001] Choosing a chart from the question it answers
- Type: recommendation
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-23
- Sources: [FT Visual Vocabulary README](https://raw.githubusercontent.com/Financial-Times/chart-doctor/main/visual-vocabulary/README.md), [Datawrapper: pie charts](https://www.datawrapper.de/blog/pie-charts), [Government Analysis Function: charts](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/), built-in `dataviz` skill (VIZ-024)
- Related: VIZ-002, VIZ-003, VIZ-004, VIZ-016, VIZ-024

Name the question, then pick from its FT Visual Vocabulary category:

| Question | FT category | Start with |
|---|---|---|
| How big, compared? | Magnitude: "Show size comparisons" | bar or column, zero-based |
| Which is first? | Ranking: "an item's position in an ordered list is more important than its absolute or relative value" | sorted bar, dot plot |
| How has it changed? | Change over time | line; column "usually best with only one series" |
| Above or below a reference? | Deviation: "variations (+/-) from a fixed reference point" | diverging bar |
| How are values spread? | Distribution: "values in a dataset and how often they occur" | histogram, box or strip plot |
| What is it made of? | Part-to-whole; "If the reader's interest is solely in the size of the components, consider a magnitude-type chart instead" | stacked bar; pie only for a few parts (VIZ-004) |
| Do two things move together? | Correlation; readers "will assume the relationships you show them to be causal" | scatter |
| Where does it move? | Flow | Sankey |
| Where is it? | Spatial: "only when precise locations or geographical patterns… are more important to the reader than anything else" | choropleth |

Sometimes the answer isn't a chart: one number is a stat tile, and "More than ~7 classes that all carry meaning" is a table (`dataviz` skill); exact lookups are a table (VIZ-016). The Analysis Function's test: "If you cannot write down the message your chart is giving in a few sentences, you should think again about the chart you have chosen."

Guides differ on pies, dual axes (VIZ-004) and gauges (VIZ-030).

## [VIZ-002] Ranking of encodings: position first, then length, angle and area
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Cleveland and McGill 1984, Graphical Perception, JASA 79(387)](https://www.jstor.org/stable/2288400), [Heer and Bostock 2010, Crowdsourcing Graphical Perception](https://idl.cs.washington.edu/files/2010-MTurk-CHI.pdf), [Kosara and Skau 2016, Judgment Error in Pie Chart Variations](https://kosara.net/papers/2016/Kosara-EuroVis-2016.pdf)
- Related: VIZ-001, VIZ-003, VIZ-004

Cleveland and McGill (1984, p. 536) order ten elementary perceptual tasks "from most to least accurate":

1. Position along a common scale
2. Positions along nonaligned scales
3. Length, direction, angle
4. Area
5. Volume, curvature
6. Shading, color saturation

Their rule (p. 532): "construct a graph that uses elementary tasks as high in the hierarchy as possible", which is why they proposed dot charts in place of pie charts and shaded maps. For pies they "conjecture that the primary elementary visual task… is perception of angle". The list comes from the paper's theory section; its experiments tested a subset (read from the paper's own pages through an archived university copy).

Heer and Bostock (CHI 2010) replicated the experiments on Mechanical Turk and matched the ranking for position and area: "Theory also suggests that angle should perform worse than length, but the results do not support this. Cleveland & McGill also did not find angle to perform worse than length". Kosara and Skau (EuroVis 2016) found "no clear evidence that these charts are read based on the central angle. Instead, area and arc length appear to be at least equally important".

What it means in practice:
- Encode the comparison that matters as position on a shared axis: bars from a common baseline, dots on one scale, lines on one y-axis.
- Small multiples share scales so position stays comparable.
- Colour and saturation are the weakest channels for quantities: use them for categories or to highlight, and show values by position (Datawrapper gives the same advice, VIZ-006).
- Area (bubbles, treemaps) and volume (3D) are for rough magnitude only.

## [VIZ-003] Chart patterns to avoid, and what to use instead
- Type: anti-pattern
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-23
- Sources: [FT Visual Vocabulary README](https://raw.githubusercontent.com/Financial-Times/chart-doctor/main/visual-vocabulary/README.md), [NN/g: dashboards (2017)](https://www.nngroup.com/articles/dashboards-preattentive/), [Datawrapper: colours](https://www.datawrapper.de/blog/colors), [Datawrapper: dual-axis guide](https://www.datawrapper.de/blog/dual-axis-charts-guide), [Few: Save the Pies for Dessert](https://www.perceptualedge.com/articles/visual_business_intelligence/save_the_pies_for_dessert.pdf), [matplotlib colormaps (viridis)](https://bids.github.io/colormap/), built-in `dataviz` skill (VIZ-024)
- Related: VIZ-002, VIZ-004, VIZ-005, VIZ-006, VIZ-024, VIZ-030

| Pattern | Reading problem | Use instead |
|---|---|---|
| Bar axis not starting at zero | bar length no longer proportional; FT: bars "Must always start at 0 on the axis" | zero-based bars; a dot or lollipop chart (FT: "does not HAVE to start at zero") or a line, which may use any sensible range |
| Two y-axes | the scales' alignment is arbitrary, so the chart suggests a correlation | indexed lines, small multiples (VIZ-004) |
| 3D bars or pies | volume and perspective rank lowest (VIZ-002) | the 2D chart |
| Radial gauge | NN/g: "harder to interpret than linear graphs" and space-hungry | a bullet chart or a stat tile (VIZ-030) |
| Pie or donut with many slices | angles are hard to compare; Datawrapper: "five max" | sorted bar chart; fold the tail into "Other" |
| Rainbow or jet colour map | "Gradients with much variation in lightness (like rainbow scales) can confuse readers" (Datawrapper); viridis was built to replace jet | one-hue sequential, viridis or cividis (VIZ-006) |
| A legend as the only key to a few lines | the eye travels between legend and mark | direct labels at line ends as well; the `dataviz` skill keeps the legend for 2+ series |
| Bars in arbitrary order | ranking is hidden | sort by value unless the order is natural (time, ordinal) |
| Many overlapping lines | no line can be followed | small multiples, or grey all lines and colour one |

The 3D and spaghetti rows rest on VIZ-002; the perception studies behind the rainbow, 3D and truncated-axis rows weren't read (Open questions).

## [VIZ-004] Dual axes and pie charts: where the guides disagree
- Type: comparison
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-23
- Sources: [Few: Dual-Scaled Axes in Graphs](https://www.perceptualedge.com/articles/visual_business_intelligence/dual-scaled_axes.pdf), [Few: Save the Pies for Dessert](https://www.perceptualedge.com/articles/visual_business_intelligence/save_the_pies_for_dessert.pdf), [Datawrapper: dual-axis guide](https://www.datawrapper.de/blog/dual-axis-charts-guide), [Datawrapper: why not to use two axes (2018)](https://www.datawrapper.de/blog/dualaxis), [Datawrapper: pie charts](https://www.datawrapper.de/blog/pie-charts), [FT Visual Vocabulary README](https://raw.githubusercontent.com/Financial-Times/chart-doctor/main/visual-vocabulary/README.md), [NN/g: dashboards (2017)](https://www.nngroup.com/articles/dashboards-preattentive/)
- Related: VIZ-001, VIZ-002, VIZ-003, VIZ-024, VIZ-030

**Dual axes.** Few (2008) "cannot think of a situation that warrants them in light of other, better solutions"; his alternative is indexed lines. Datawrapper wrote against them in 2018, then shipped them on 2026-07-23 (Business plan) with rules: "Use dual-axis charts if your audience knows how to read them", "Only use dual-axis charts when comparing data series with different units", "Align your axis scales", the same measure in two units (°C and °F) as "the safest use case", and Pareto charts. The FT lists "Line + column" as "A good way of showing the relationship over time between an amount (columns) and a rate (line)". Claude's built-in `dataviz` skill says never; Anthropic's knowledge-work `data-visualization` skill says "Use cautiously".

Which to trust: for a general audience, Few and the built-in skill; index both series to 100 or use small multiples. A second axis that only relabels the same series in other units is safe everywhere.

**Pie charts.** Few: angles and areas are hard to compare; a pie serves only to compare "two sets of summed parts", "Otherwise, save the pies for dessert." Datawrapper: pies "work best for values around 25%, 50% or 75 %" and "five max", highlighting the most important value. The FT keeps pie and donut under part-to-whole with "difficult to accurately compare the size of the segments". NN/g (2017, dashboards): pies and donuts "should be avoided most of the time", except for "overwhelming disparities in percentage shares". How pies are read is contested: angle, area or arc length (VIZ-002).

Which to trust: a pie for one total with two to five parts and one share as the message ("about a quarter"), never on an operational dashboard; a sorted bar chart for anything to compare.

## [VIZ-005] Headline title, annotation and direct labels
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Government Analysis Function: charts](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/), [Datawrapper: annotate tab](https://www.datawrapper.de/academy/annotate-tab), [Few: Save the Pies for Dessert](https://www.perceptualedge.com/articles/visual_business_intelligence/save_the_pies_for_dessert.pdf), [FT Visual Vocabulary README](https://raw.githubusercontent.com/Financial-Times/chart-doctor/main/visual-vocabulary/README.md), built-in `dataviz` skill (VIZ-024)
- Related: VIZ-003, VIZ-014, VIZ-024

A chart's title should state the finding, so a reader who reads nothing else gets it.

- **Two titles.** The Analysis Function: "a headline title and a formal statistical subtitle. The headline title should communicate the headline message of the chart. For example 'Increase in number of people living alone'. The statistical subtitle should say what the data is, the geography the data relates to and the time period shown." Datawrapper: choose "the one key statement that you want your reader to remember".
- **Titles in HTML, not in the image.** "To meet accessibility success criterion 1.4.5 titles should be in the body of the page" (Analysis Function). The headline title then doubles as the takeaway text of VIZ-014.
- **Annotate the cause.** A short note at the point where something happened (a release, an outage) explains a spike better than a caption. The FT: "Don't be afraid to highlight the points of interest."
- **Direct labels over a legend** where few series are shown: Few argues a legend makes the eye travel; the built-in `dataviz` skill makes direct labels mandatory at four series, keeps a legend for two or more, and labels selectively, "never a number on every point".
- **Highlight one, grey the rest** when one series is the story (the skill calls it "the most underused form").

What this prevents: a chart readers must decode before they learn anything, and a screen-reader user hearing a title like "Players online" with no finding.

## [VIZ-006] Colour for data: palette types, named palettes and how many hues
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Datawrapper: colours](https://www.datawrapper.de/blog/colors), [Okabe and Ito: Color Universal Design](https://jfly.uni-koeln.de/color/), [ColorBrewer schemes](https://github.com/axismaps/colorbrewer), [d3-scale-chromatic at 3.1.0](https://github.com/d3/d3-scale-chromatic/tree/v3.1.0/src/categorical), [matplotlib colormaps (viridis)](https://bids.github.io/colormap/), [Nuñez, Anderton and Renslow 2018 (cividis)](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0199239)
- Related: DESIGN-016, VIZ-007, VIZ-024

Pick the palette type by the data's job (Datawrapper: "Don't use a gradient color palette for categories and the other way round"):

| Job | Palette | Named options |
|---|---|---|
| Identity (categories) | distinct hues, fixed order | Okabe–Ito (8, black included), Tableau10, Observable10, ColorBrewer Set2/Dark2 (8) |
| Magnitude | one hue, light to dark ("Use lightness to build gradients, not just hue") | ColorBrewer sequential (3–9 classes), viridis, cividis (built for red-green colour blindness) |
| Above/below a midpoint | two hues with a neutral middle | ColorBrewer diverging (3–11 classes) |

How many hues: past about seven, readers confuse series and match the wrong legend entry. Datawrapper: "try to avoid using more than seven"; the `dataviz` skill caps at eight and folds the rest into "Other" or small multiples (VIZ-024). Both are rules of thumb. Better: grey all but the series that carry the message.

Okabe–Ito (from the authors' palette image): `#E69F00 #56B4E9 #009E73 #F0E442 #0072B2 #D55E00 #CC79A7 #000000`; they warn "thin lines and small characters in blue and yellow are hard" to read. Observable10 (`#4269d0 #efb118 #ff725c #6cc5b0 #3ca951 #ff8ab7 #a463f2 #97bbf5 #9c6b4e #9498a0`) is `schemeObservable10` in `d3-scale-chromatic` 3.1.0.

Neither passes 3:1 on white as shipped. Tested 2026-10-23, the `dataviz` skill's `validate_palette.js` (2.1.308 bundle, Node 24.21.0, surface `#ffffff`): Okabe–Ito yellow 1.32, sky blue 2.31, orange 2.25; six Observable10 hues 1.91–2.89. Over all pairs, the worst deuteranopia ΔE is 7.6 for Okabe–Ito (pink, green) and 2.0 for Observable10 (pink, teal). Label the series or darken those steps (VIZ-007).

Library defaults to override: Plot uses `observable10` for categories but `turbo`, a rainbow, for ordinal and continuous colour unless you set `scheme` (`src/scales/ordinal.js` and `quantitative.js` at 0.6.17). UI colour tokens: OKLCH (DESIGN-016).

## [VIZ-007] Checking data colours: colour vision deficiency, 1.4.1, 1.4.11 and dark mode
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [Understanding 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), [Chromium: simulating colour vision deficiencies](https://developer.chrome.com/docs/chromium/cvd), [Nuñez, Anderton and Renslow 2018](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0199239), built-in `dataviz` skill (VIZ-024)
- Related: VIZ-006, VIZ-015, VIZ-024, ACCESS-014, DESIGN-016

**1.4.11 Non-text contrast**: "Graphical Objects: Parts of graphics required to understand the content" need 3:1 "against adjacent color(s)". For a line graph the Understanding page says: "The lines should have 3:1 contrast against their background, but as there is little overlap with other lines they do not need to contrast with each other or the graduated lines", and gridlines count when needed to read values. For a pie, the slices "would not be required for understanding" if the values are also presented in a conforming way. So: marks 3:1 against the chart background, or labelled values. Named palettes fail it as shipped (VIZ-006).

**1.4.1 Use of colour**: "Color is not used as the only visual means of conveying information." For charts: direct labels, distinct markers or dash patterns, or texture, so a series can be named without its hue. Tick labels and values are text: 4.5:1 (1.4.3).

**Colour vision deficiency** affects "more than 4% of the population" (Nuñez et al.). Check, don't eyeball:
- Chrome DevTools' Rendering tab "Emulate vision deficiencies"; in Puppeteer, `page.emulateVisionDeficiency(type)`.
- The built-in `dataviz` skill's `validate_palette.js`: OKLab ΔE between series under protanopia and deuteranopia, target 8, floor 6 with a second encoding, normal-vision floor 15, marks 3:1 against the surface. These thresholds are the skill's own calibration.

**Dark mode**: no study or standard was found on chart palettes in dark mode. The `dataviz` skill picks separate dark steps from the same ramps and validates them against the dark surface rather than inverting. Re-run the 3:1 and CVD checks against the dark background. Gridlines needed to read values keep 3:1; decorative ones may be fainter.

This prevents series that colour-blind readers, print or a dark theme can't tell apart.

## [VIZ-008] Chart libraries for an Angular 22 app: licences, rendering and upkeep
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: npm registry (`npm view <pkg> version license peerDependencies`, `npm view <pkg> time --json`), [Plot: accessibility at v0.6.17](https://raw.githubusercontent.com/observablehq/plot/v0.6.17/docs/features/accessibility.md), [ECharts: aria](https://echarts.apache.org/handbook/en/best-practices/aria/), [Chart.js: accessibility](https://www.chartjs.org/docs/latest/general/accessibility.html), [AG Charts: Community vs Enterprise](https://www.ag-grid.com/charts/angular/community-vs-enterprise/), [ApexCharts licence](https://raw.githubusercontent.com/apexcharts/apexcharts.js/main/LICENSE.md), [Highcharts licence](https://www.highcharts.com/license)
- Related: VIZ-009, VIZ-010, VIZ-011, VIZ-012, VIZ-029

npm on 2026-10-23; "last" is the newest stable release.

| Library (wrapper) | Licence | Draws | Last release |
|---|---|---|---|
| d3 7.9.0, modules | ISC | what you write | 2024-03-12 |
| Observable Plot 0.6.17 | ISC | SVG | 2025-02-14 |
| Vega-Lite 6.5.0 (vega-embed 7.3.0) | BSD-3-Clause | SVG or canvas | 2026-10-08 |
| ECharts 6.1.0 (ngx-echarts 22.0.0) | Apache-2.0 / MIT | canvas default, SVG | 2026-05-19 (wrapper 2026-06-11) |
| Chart.js 4.6.1 (ng2-charts 11.0.0) | MIT | canvas | 2026-10-22 (wrapper 2026-09-29) |
| uPlot 1.6.32 | MIT | canvas | 2025-03-14 |
| Plotly.js 4.1.2 | MIT | SVG, WebGL `scattergl` | 2026-10-05 |
| ngx-charts 25.0.3 | MIT | SVG through Angular templates | 2026-10-05 |
| Unovis 1.7.1 (`@unovis/angular`, peer Angular "20 - 22") | Apache-2.0 | not tested | 2026-09-29 |
| AG Charts Community 14.2.0 | MIT; Enterprise commercial | canvas | 2026-09-16 |
| ApexCharts 8.4.1 | dual: paid at $2M revenue | SVG, canvas above a threshold | 2026-10-21 |
| Highcharts 13.1.1 | commercial | SVG, WebGL boost | 2026-09-20 |

Built-in accessibility per the docs: Plot `ariaLabel` and `ariaDescription`; ECharts generates a description once `AriaComponent` is imported and `aria` enabled; Chart.js says canvas content "will not be accessible to screen readers" without `role="img"` and a label or fallback content; AG Charts Community advertises "keyboard navigation and screen reader support"; Highcharts needs its accessibility module. VIZ-011 shows what each actually exposed.

d3, Plot and uPlot had no release in the 18 months to 2026-10-23; stable isn't abandoned. Recharts 3.10.1, visx 4.0.0 and Nivo 0.99.0 peer on `react` and don't fit an Angular app. Commercial terms are in VIZ-029.

## [VIZ-009] What each chart library adds to an Angular 22 bundle
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: local test (below), [ngx-echarts README at v22.0.0](https://raw.githubusercontent.com/xieziyu/ngx-echarts/v22.0.0/README.md), [Angular: `@defer`](https://angular.dev/guide/templates/defer)
- Related: VIZ-008, VIZ-010, VIZ-012, ANIMLIB-003, WEBPERF-002

gzip -6 added to the initial JavaScript of an empty Angular 22 app by one bar and one line chart, each library used through its Angular wrapper where it has one.

| Variant | gzip added |
|---|---|
| Hand-written SVG in the template, plus a data `<table>` | 3,176 B |
| `d3-scale` 4.0.2 and `d3-shape` 3.2.0 in the template | 12,784 B |
| uPlot 1.6.32 | 26,041 B |
| Chart.js 4.6.1 via ng2-charts 11.0.0, only the controllers used | 59,444 B |
| Chart.js via `withDefaultRegisterables()` | 72,756 B |
| `@swimlane/ngx-charts` 25.0.3 (plus a 17.2 kB lazy animations chunk) | 77,437 B |
| Observable Plot 0.6.17 | 97,123 B |
| ECharts 6.1.0 via ngx-echarts 22.0.0, `echarts/core` with bar, line, grid, tooltip, aria, SVG renderer | 193,242 B |
| ECharts, `import * as echarts from 'echarts'` | 388,127 B |
| AG Charts Community 14.2.0, four modules | 411,223 B |
| AG Charts, `AllCommunityModule` | 425,069 B |
| ECharts core inside `@defer (on viewport)` | 6,917 B initial, 188,361 B lazy |

Baseline 72,282 B gzip. d3 modules ship no types: the build failed with TS7016 until `@types/d3-scale` and `@types/d3-shape` were added. ngx-charts' components aren't standalone, so it needs `BarChartModule`/`LineChartModule`, and it requires `@angular/animations`, deprecated since 20.2 (ANIM-001).

Command: a script copied each variant's `app.ts` and `app.config.ts`, ran `npx ng build` (production), and summed `gzip -6 -c` over every browser `.js` file; for the two variants with lazy chunks (ngx-charts, `@defer`), the initial chunks the CLI listed were summed separately. The CLI's own "Estimated transfer size" for the baseline was 64.07 kB, a different compression.

Tested 2026-10-23, `@angular/build@22.2.4`, `@angular/core@22.2.3`, Node 24.21.0: one build per variant.

## [VIZ-010] Chart libraries under SSR and prerender, and `@defer`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: local test (below), [ECharts: server-side rendering](https://echarts.apache.org/handbook/en/how-to/cross-platform/server/), [Observable Plot: getting started at v0.6.17](https://raw.githubusercontent.com/observablehq/plot/v0.6.17/docs/getting-started.md), [Angular: `@defer`](https://angular.dev/guide/templates/defer)
- Related: VIZ-009, VIZ-011, VIZ-019, ANIMLIB-004, ANIM-005

Prerender only (`RenderMode.Prerender`), first render only; request-time SSR and zoneless updates weren't tested. Every library imported on the server, but two wrappers threw during prerender, and only template-driven SVG and two server render paths put a chart in the prerendered HTML.

| Variant | Prerender log | Prerendered HTML |
|---|---|---|
| Hand-written SVG, d3 scales in the template | clean | full SVG with `role="img"` and labels |
| ngx-charts | clean | full SVG (26.8 kB of HTML) |
| ngx-echarts directive | `ReferenceError: window is not defined` in `ngOnInit` | empty host |
| AG Charts | `AG Charts - unable to resolve global window` | empty host |
| Chart.js via ng2-charts | clean | `<canvas>` with its fallback content |
| Plot or uPlot in `afterNextRender` | clean | empty host |
| Plot with `document: inject(DOCUMENT)` | clean | SVG with `aria-label`, `aria-description` |
| ECharts `init(null, null, { ssr: true, renderer: 'svg' })` and `renderToSVGString()` | clean | SVG, but no `aria-label`: ECharts puts it on the container, which SSR lacks |

The build exits 0 despite the two errors, so read the prerender log. Plot rendered on the server was drawn a second time on hydration, with no console error: a component that renders on the server must skip the client render (that guard wasn't tested). Angular's server DOM has no `replaceChildren`; use `appendChild`.

ECharts documents this path: "server-side SVG rendering should be preferred".

`@defer (on viewport)` with a text placeholder fixed ngx-echarts (AG Charts under `@defer` wasn't built): the server renders the placeholder (which can carry the takeaway, VIZ-014), and the library loads only in the browser.

Tested 2026-10-23, Angular 22.2.3 with `RenderMode.Prerender`, Node 24.21.0, the versions in VIZ-009.

## [VIZ-011] Chart libraries' keyboard access and accessibility tree
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: local test (below), [ECharts: aria option](https://echarts.apache.org/en/option.html#aria), [AG Charts: accessibility](https://www.ag-grid.com/charts/angular/accessibility/), [Chart.js: accessibility](https://www.chartjs.org/docs/latest/general/accessibility.html)
- Related: VIZ-010, VIZ-014, VIZ-015, ACCESS-008

What each library's default bar and line chart exposes in Chromium's accessibility tree (no screen reader was run), and what Tab and the arrow keys do.

| Library | Accessibility tree | Keyboard |
|---|---|---|
| Hand-written SVG | `img` named by our `<title>`; a separate `table` | none needed: the table carries the data |
| Observable Plot | `img` named by `ariaLabel`; tick labels exposed as text | no Tab stop |
| ECharts, `aria.enabled` | `img` with a generated label: "This is a chart about "Score by team" with type Bar chart named Score.The data is as follows: the data for Alpha is 0, 42, …" | no Tab stop |
| Chart.js | nothing unless you add `role="img"` and `aria-label` to the canvas | no Tab stop |
| uPlot | its legend as a `table` with "--" values; canvas unnamed | no Tab stop |
| ngx-charts | outer `img` unnamed despite `ariaLabel`; each bar an `img` "Alpha 42" | each bar a Tab stop (6 for two charts), tooltip on focus, arrows do nothing |
| AG Charts | `figure` "chart, 1 series" with `img` "interactive chart" | one Tab stop per chart; arrows move through points, and the focused node's name becomes "Alpha; Score; 42" with a visible tooltip |

Only AG Charts offered point-by-point keyboard access, and only ECharts generated a text summary; its summary reads category indexes as data ("0, 42"). None of them builds a data table or states a takeaway: that stays our job (VIZ-014).

Tested 2026-10-23, Playwright 1.64.1, Chromium 156.0.8078.4: `locator('app-root').ariaSnapshot()`, Tab until focus left the page, then ArrowRight twice with CDP `Accessibility.getFullAXTree` for the focused node's name. Not probed: Enter, Escape, Home/End, focus-ring visibility.

## [VIZ-012] Which chart library, in which order, and when not to
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: local tests (VIZ-009 to VIZ-011, VIZ-027), npm registry, [Chart.js: performance](https://www.chartjs.org/docs/latest/general/performance.html), [ECharts: canvas vs SVG](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/)
- Related: VIZ-008, VIZ-009, VIZ-010, VIZ-011, VIZ-013, VIZ-029, ANIMLIB-014

Platform first, then the smallest library that does the job:

0. **No library**: a stat tile with `Intl` (VIZ-021), a `<meter>`, or CSS-width bars in a table.
1. **An HTML table or hand-written SVG in the template** for bars, sparklines and simple lines: 3 kB, prerenders with its labels, no animation to turn off. Not for zoom, brushing or thousands of points.
2. **`d3-scale`, `d3-shape`, `d3-array`** (13 kB) when the template needs scales, ticks or curves: Angular still renders the SVG. Not as `d3-selection` DOM manipulation inside components.
3. **Observable Plot** (97 kB) for exploratory or many-form charts with good defaults and an SVG you can prerender with `document`. Not when you need interaction beyond its tips, or when its `turbo` colour default would apply (VIZ-006).
4. **Chart.js** (59 kB tree-shaken) for interactive canvas time series up to tens of thousands of points with decimation. Not when the chart must exist in the server HTML or be read point by point: canvas is opaque (VIZ-011).
5. **uPlot** (26 kB) for very dense time series, "150,000 data points in 90ms" (author's benchmark). Not for bar-heavy or richly labelled charts.
6. **ECharts** (193 kB core, 388 kB full) for many chart types, big data and server SVG. Only through `echarts/core` and `@defer`; not for a few simple charts.
7. **AG Charts Community** (411 kB) when keyboard point navigation is a requirement and the bundle can take it. Not with SSR without `@defer` (it throws).

Avoid ngx-charts (deprecated `@angular/animations`, unnamed chart, a Tab stop per bar), ApexCharts and Highcharts without a bought licence (VIZ-029), and React-only libraries.

Whatever the choice: a takeaway and a table (VIZ-014), reduced motion passed in (VIZ-027), and charts below the fold inside `@defer (on viewport)` (VIZ-010).

## [VIZ-013] SVG, Canvas or WebGL by data size, and downsampling
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [ECharts: canvas vs SVG](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/), [Chart.js: performance at v4.6.1](https://www.chartjs.org/docs/latest/general/performance.html), [Chart.js: decimation](https://www.chartjs.org/docs/latest/configuration/decimation.html), [uPlot README at 1.6.32](https://raw.githubusercontent.com/leeoniya/uPlot/1.6.32/README.md), [Highcharts: boost module](https://www.highcharts.com/docs/advanced-chart-features/boost-module), [Plotly: WebGL vs SVG](https://plotly.com/javascript/webgl-vs-svg/)
- Related: VIZ-012, VIZ-020, WEBPERF-001, WEBPERF-003

| Marks on screen | Renderer | Source |
|---|---|---|
| up to about 1,000 | SVG: accessible DOM, crisp zoom, prints | ECharts: "For larger amounts of data (>1k is an experience value), canvas renderer is always recommended" |
| thousands to hundreds of thousands | Canvas | uPlot: "150,000 data points in 90ms" from cold (author's 2023 benchmark) |
| above that, or many series | WebGL | Highcharts boost: `boostThreshold` "5000" points per series, `boost.seriesThreshold` 50 series; Plotly `scattergl` |

Each threshold is a vendor's rule of thumb, not a measurement on your data: profile INP (WEBPERF-001, WEBPERF-003).

Fewer points usually beats a faster renderer, since a chart can't show more points than it has pixels:
- **Aggregate on the server** (VIZ-020).
- **Decimate**: Chart.js's decimation plugin, off by default (`enabled: false`), line charts with `indexAxis: 'x'` only, `algorithm: 'min-max'` (default) or `'lttb'` (Largest-Triangle-Three-Buckets, from Sveinn Steinarsson's 2013 University of Iceland thesis; the thesis wasn't opened, its server refused the download). It needs `parsing: false` and a linear or time x-axis; `threshold` defaults to "4 times the canvas width".
- Chart.js's other levers: `parsing: false` with pre-shaped data, `normalized: true`, fixed scale `min`/`max`, animation off.

A Web Worker helps only canvas: Chart.js can render through `transferControlToOffscreen()`, but "plugins that use the DOM (including any mouse interactions) will likely not work" and "Transferring data between threads can be expensive". Move parsing and aggregation to a worker first; that is DOM-free.

## [VIZ-014] An accessible chart: takeaway text, a data table and one `role="img"`
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [W3C WAI: Complex images](https://www.w3.org/WAI/tutorials/images/complex/), [Understanding 1.1.1](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html), [Government Analysis Function: charts](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/), [GOV.UK: text descriptions for data visualisations](https://accessibility.blog.gov.uk/2023/04/13/text-descriptions-for-data-visualisations/), [Graphics ARIA 1.0](https://www.w3.org/TR/graphics-aria-1.0/), [Chartability](https://chartability.github.io/POUR-CAF/)
- Related: VIZ-005, VIZ-011, VIZ-015, VIZ-016, ACCESS-009

A chart is a complex image: W3C asks for "a two-part text alternative": a short description naming the chart and pointing to the long one, and a long description, "a textual representation of the essential information". Understanding 1.1.1's example adds: "Where possible and practical, the actual data is provided in a table."

The pattern:
1. A short name on the chart: one `role="img"` with `aria-label` or `<title>`, on the `<svg>`, the `<canvas>` or its wrapper, only when nothing inside is focusable. A chart with focusable points is a labelled `role="group"` or `<figure>` instead: `img` hides its children.
2. Visible text that states the takeaway, not a list of points. The Analysis Function: it "should not repeat the chart title, be a literal description or outline every data point shown".
3. A real `<table>` with a `<caption>`, beside the chart or behind a `<details>`/`<summary>` toggle. Chartability rates "No table" a critical failure unless the title, summary or annotations already carry everything.

Official sources disagree on the short name: W3C keeps it and points to the long description; GOV.UK and the Analysis Function leave `alt` empty and the image decorative when the description sits in the body, to avoid "repetition and auditory clutter". For an SVG or canvas chart, that means `aria-hidden="true"` on the chart. Both put the description in visible text.

Graphics ARIA (`graphics-document`, `graphics-symbol`) is a W3C Recommendation of 2018-10-02, exposed by browsers in the W3C's manual accessibility-API tests, but no screen-reader support data was found (searched a11ysupport.io, TPGI, Fossheim, Schepers, Watson). Test with a screen reader before relying on it.

## [VIZ-015] Interactive charts: keyboard, tooltips and the WCAG criteria that apply
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Understanding 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html), [Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [Understanding 4.1.2](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html), [Chartability](https://chartability.github.io/POUR-CAF/), [Highcharts: accessibility module](https://www.highcharts.com/docs/accessibility/accessibility-module)
- Related: VIZ-007, VIZ-011, VIZ-014, VIZ-028, ACCESS-001

| Criterion | What it asks of a chart |
|---|---|
| 1.1.1 Non-text content | short name plus long description or table (VIZ-014) |
| 1.3.1 Info and relationships | the data table's headers and caption |
| 1.4.1 Use of colour | series told apart by label, marker or texture, not hue alone (VIZ-007) |
| 1.4.3 Contrast (minimum) | 4.5:1 for tick labels, values and legends |
| 1.4.11 Non-text contrast | 3:1 for marks needed to understand the chart |
| 1.4.13 Content on hover or focus | tooltips "Dismissible", "Hoverable", "Persistent"; Escape closes them |
| 2.1.1 Keyboard | anything a pointer can do: filters, series toggles, point details |
| 2.2.2 Pause, stop, hide | live or auto-updating charts (VIZ-028) |
| 2.4.7, 2.4.11 Focus visible, not obscured | a ring on the focused point, not under a tooltip |
| 2.5.7 Dragging movements | brushing and pan need a non-drag alternative (buttons, inputs) |
| 2.5.8 Target size (minimum) | 24×24 px toggles and legend items |
| 4.1.2 Name, role, value | chart controls: toggles, range pickers, sort buttons |
| 4.1.3 Status messages | filter or update results announced without moving focus |

Chartability (community heuristics) adds: "Focusing should mirror hovering, selecting (enter or spacebar) should mirror clicks", and keyboard controls "must also be explained".

A practical shape: one Tab stop per chart, arrow keys between points, the point's value in its accessible name and a tooltip on focus. AG Charts does this by default (VIZ-011). Highcharts' docs say its separate `modules/accessibility.js` (13.1.1) adds keyboard navigation and a screen-reader region (untested; paid licence, VIZ-029). A chart with no point-level interaction needs none of this: the table serves keyboard users.

## [VIZ-016] Data tables: when, alignment, units and sortable headers
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [APG: sortable table](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/), [ARIA 1.2: aria-sort](https://www.w3.org/TR/wai-aria-1.2/#aria-sort), [GOV.UK Design System: table](https://design-system.service.gov.uk/components/table/), [Datawrapper: tables](https://www.datawrapper.de/blog/guide-what-to-consider-when-creating-tables), [Angular Material sort at 22.2.4](https://raw.githubusercontent.com/angular/components/v22.2.4/src/material/sort/sort.md)
- Related: VIZ-014, VIZ-017, VIZ-021, DESIGN-034, UIPAT-012, UIPAT-015

Use a table when readers look up or act on exact values. Datawrapper: "Use tables if precise numbers are important… A table then becomes a decision tool." Use a chart when the message is shape or trend.

Markup and layout:
- `<caption>` as the table's heading (GOV.UK); `scope="col"` and `scope="row"`.
- Numbers right-aligned, headers of number columns too: "When comparing columns of numbers, align the numbers to the right" (GOV.UK). so digits line up, "units over units, tens over tens" (Analysis Function). Tabular numerals (DESIGN-034). Units in the header ("Revenue (€)"), so cells stay comparable.
- Sort by the most interesting column, not the first one alphabetically (Datawrapper).

Sortable headers, per the APG: "The aria-sort attribute is set on the column header of the currently sorted column, and the header text of sortable columns is wrapped in a button element." When the sort changes, `aria-sort` moves to the new header. ARIA 1.2: "authors SHOULD apply aria-sort to only one header at a time." The direction icon is `aria-hidden="true"`, and one hint, "(column headers with buttons are sortable)", goes in the caption rather than on every button. Put sort state in the URL (UIPAT-012).

Angular Material's sort docs (22.2.4) warn that "most screen readers do not announce changes to the value of `aria-sort`" and tell you to announce `matSortChange` with `LiveAnnouncer`. The APG example announces nothing itself. So announce every sort, filter or page change through one `role="status"` element (UIPAT-015): "Sorted by Revenue, descending; 25 rows".

## [VIZ-017] Big tables: CDK, Material, TanStack, AG Grid, virtual scrolling and phone width
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [CDK table at 22.2.4](https://raw.githubusercontent.com/angular/components/v22.2.4/src/cdk/table/table.md), [Material table at 22.2.4](https://raw.githubusercontent.com/angular/components/v22.2.4/src/material/table/table.md), [TanStack Table: Angular quick start](https://tanstack.com/table/latest/docs/framework/angular/quick-start), [AG Grid: accessibility](https://www.ag-grid.com/angular-data-grid/accessibility/), [AG Grid: pricing](https://www.ag-grid.com/license-pricing/), [ARIA 1.2: aria-rowcount](https://www.w3.org/TR/wai-aria-1.2/#aria-rowcount), [Understanding 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [axe-core rule descriptions](https://raw.githubusercontent.com/dequelabs/axe-core/develop/doc/rule-descriptions.md)
- Related: VIZ-016, WEBPERF-001, UIPAT-012

| Option (npm, 2026-10-23) | Licence | What you get |
|---|---|---|
| Plain `<table>` | none | everything in VIZ-016, no dependency |
| `@angular/cdk` 22.2.4 table | MIT | templated rows and columns, native `<table>` or a `role="table"` element |
| Angular Material table | MIT | CDK table styled, `MatSort`, paginator; `role="table"` by default; "Always provide an accessible label" |
| `@tanstack/angular-table` 9.3.1 | MIT | headless state (sort, filter, pagination); markup and ARIA are yours |
| `ag-grid-community` 36.2.0 | MIT | a `role="grid"` widget of divs with `aria-rowcount`, `aria-sort`; Enterprise "From $999 USD per developer" |

Virtual scrolling (`cdk-virtual-scroll-viewport`) removes rows from the DOM: find-in-page misses them, and ARIA 1.2 then requires `aria-rowcount` on the table ("-1" if unknown) and `aria-rowindex` on each row. The CDK source at 22.2.4 sets neither, so you add them. AG Grid's own docs recommend pagination for screen readers: "disable column and row virtualization. The best way to do this is to use pagination." Prefer pagination or server-side filtering until rows number in the thousands (our rule of thumb), and measure INP before virtualising (WEBPERF-001).

Sticky headers: `position: sticky` on table elements is Baseline widely available (web-features `sticky-positioning`, high since 2022-03-19).

At phone width, scroll the table in its own container rather than restacking cells: Understanding 1.4.10 lists "data tables (not individual cells)" as content that may scroll in two dimensions. Give the container `tabindex="0"`, `role="region"` and a label so keyboard users can scroll it (axe `scrollable-region-focusable`). Stacking cells into cards loses the column-header relationship unless each cell repeats its label. Datawrapper's alternative: fewer columns on mobile. On dashboards the Analysis Function paginates instead (VIZ-030).

## [VIZ-018] Chart states: empty, single point, outliers and loading
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Government Analysis Function: charts](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/), [Chart.js: line chart](https://www.chartjs.org/docs/latest/charts/line.html), built-in `dataviz` skill, `references/anti-patterns.md` (VIZ-024)
- Related: UIPAT-001, UIPAT-003, UIPAT-004, UIPAT-005, VIZ-014

Only what differs from UIPAT-001 to UIPAT-005. The Analysis Function covers gaps and axis breaks; the loading, empty and single-point rules are the `dataviz` skill's and ours.

- **Loading:** reserve the chart's full height, x-axis band included, so nothing shifts (CLS). On a refetch, keep the previous chart, dimmed but still 3:1 (VIZ-007), with `aria-busy="true"`, and announce when the new data lands; swap chart, takeaway and table together. The `dataviz` skill lists "skeleton flash" and a height that excludes the x-axis band as anti-patterns.
- **Empty:** say what is empty and why ("No trades in the last 24 hours"), in place of the plot; don't draw bare axes that look like zero values. Zero, null and no data are three states: plot zero, gap null, say "no data".
- **Single point or all-equal values:** a line needs two points (Chart.js draws a lone point only as a marker), and equal values collapse the axis range. Show a stat tile, or fix the domain.
- **Partial:** "do not join the points either side of the missing data point, even if the line is dotted or dashed. Joining points implies we know something about the data" (Analysis Function). Annotate the gap.
- **Outliers:** don't let one value flatten the rest. Options: annotate and clip it, a log scale (harder to read accurately for most audiences), or a second chart for the rest. An axis break "increases the amount of mental effort": mark it with "a broken axis symbol" and mention it in the text (Analysis Function); never on bars (VIZ-003).
- **Error or stale:** keep the last good chart with its "as of" time and a retry (UIPAT-005).

## [VIZ-019] Static charts for READMEs, email and social cards
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [GitHub Docs: creating diagrams](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams), [Mermaid: XY chart](https://mermaid.js.org/syntax/xyChart.html), [Mermaid: pie](https://mermaid.js.org/syntax/pie.html), [caniemail: SVG images](https://www.caniemail.com/features/image-svg/), [caniemail: inline SVG](https://www.caniemail.com/features/html-svg/), [ECharts: server-side rendering](https://echarts.apache.org/handbook/en/how-to/cross-platform/server/)
- Related: VIZ-010, OG-002, OG-005, OG-009

- **README or issue:** GitHub renders Mermaid in "Issues, GitHub Discussions, pull requests, wikis, and Markdown files", and Mermaid has `pie` and `xychart` (bar and line). Current Mermaid docs write `xychart`; older ones `xychart-beta`. GitHub's Mermaid version wasn't checked: its docs say to render a block containing `info` to see it. A committed SVG shown through `![alt](chart.svg)` also works. Every static output gets alt text stating the takeaway.
- **Email:** use PNG. caniemail: an SVG `<img>` is unsupported in Outlook for Windows 2007 to 2016 (2019 shows it), and Gmail rasterises it to PNG only since its 2026-09 test, after years of no support; inline `<svg>` is unsupported in Gmail, Outlook for Windows and Outlook.com.
- **Social cards:** PNG at 1200×630 through satori and resvg (OG-002, OG-005), rendered at build time or on request (OG-009), with `og:image:alt` stating the takeaway. Satori lays out JSX, not chart libraries: draw bars as boxes, or render the chart to an SVG string first.
- **Server-side SVG from a chart library:** ECharts `renderToSVGString()` and Plot with a `document` work in Node (VIZ-010); the SVG then goes to resvg for PNG.

## [VIZ-020] Shaping data: `Object.groupBy`, d3-array, Arquero and time buckets
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [MDN: Object.groupBy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy), [webstatus.dev: array-group](https://api.webstatus.dev/v1/features/array-group), [d3-array README at v3.2.4](https://raw.githubusercontent.com/d3/d3-array/v3.2.4/README.md), [Arquero README at v8.0.3](https://raw.githubusercontent.com/uwdata/arquero/v8.0.3/README.md), [Arquero issue #361](https://github.com/uwdata/arquero/issues/361), [MDN: ZonedDateTime.startOfDay](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime/startOfDay), [Lighthouse: avoid enormous network payloads](https://developer.chrome.com/docs/lighthouse/performance/total-byte-weight)
- Related: VIZ-021, VIZ-023, NODE-011, LAMBDA-003, CSS-002

Order of preference: the platform, then d3-array, then Arquero.

- **`Object.groupBy` / `Map.groupBy`:** Baseline widely available since 2026-09-05 (newly 2024-03-05; web-features 3.44.0), in Node from 21.0.0 (BCD). The result has a `null` prototype, and keys are coerced to strings: an object key becomes `"[object Object]"`, so use `Map.groupBy` for non-string keys.
- **d3-array 3.2.4** (ISC, ESM, `sideEffects: false`) for aggregation: `rollup(data, v => d3.sum(v, d => d.x), d => d.k)`, `group`, `bin` (Sturges by default; `thresholdFreedmanDiaconis`, `thresholdScott`), `quantile` ("the R-7 method"), `ticks`. `group` and `rollup` return an `InternMap`, which keys Dates by value.
- **Arquero 8.0.3** (BSD-3-Clause; "process data tables with million+ rows") for multi-step dplyr-style wrangling. Its expressions are compiled with `Function(...)` (`src/expression/compile.js`), so a CSP without `unsafe-eval` breaks `derive` and similar verbs; the maintainer called fixing it "a significant undertaking" (issue #361, 2025-10-21).
- **Aggregate on the server:** send the chart its bins, not raw rows. No official source states this rule; it follows from payload size (Lighthouse flags pages over 5,000 KiB) and from INP (WEBPERF-001). Our recommendation.
- **Time buckets:** a local day is 23 or 25 hours on DST days, so never bucket with `Math.floor(ms / 86_400_000)`. Temporal's `ZonedDateTime.startOfDay()` handles it, but Temporal is Baseline "limited" (Chrome 144, Firefox 139, no Safari) and absent from Node 24 (NODE-011); use `Intl.DateTimeFormat('en-CA', { timeZone })` to build day keys meanwhile. A "7-day average" is 7 calendar days, null until the window is full.

Tested 2026-10-23, Node 24.21.0, `d3-array@3.2.4`: `Object.groupBy([1,2,3,4], n => n % 2 ? 'odd' : 'even')` gave a null-prototype object; `Map.groupBy` kept boolean keys; `rollup(...).constructor.name` was `InternMap`; `quantile([0, 10, 20], 0.5)` was 10; `typeof Temporal` was `undefined`.

## [VIZ-021] Formatting numbers and dates with `Intl` for axes, tooltips and tables
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [MDN: Intl.NumberFormat constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat), [MDN: Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/RelativeTimeFormat), [MDN: Intl.DateTimeFormat constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat), [d3-format](https://d3js.org/d3-format)
- Related: VIZ-016, VIZ-020, DESIGN-034, NODE-011

Share the locale, unit and decimals per measure across axis, tooltip and table, but not the notation: compact on axis ticks, the full value (`121,576`) in tooltips and tables, where readers want precision (VIZ-016). Put the unit in the axis title or tick suffix. Pass the locale explicitly: under SSR the server's default can differ from the browser's. Output on Node 24.21.0 (ICU 78.3):

| Expression | Output |
|---|---|
| `notation: 'compact'`, `en`: 999 / 1234 / 12345 / 1.2e9 | `999` / `1.2K` / `12K` / `1.2B` |
| compact, `de` 1.2e9 / `de` 1234 / `nl` 1.2e9 | `1,2 Mrd.` / `1234` / `1,2 mld.` |
| compact, `en-GB` 987654321 | `988m` (MDN's example says `988M`) |
| `style: 'percent', signDisplay: 'exceptZero'`: 0.55 / 0 / -0.1 | `+55%` / `0%` / `-10%`; `de` `+55 %`; `nl` `55%` |
| `currency: 'EUR'` 1234.5 in `en` / `de` / `nl` | `€1,234.50` / `1.234,50 €` / `€ 1.234,50` |
| `RelativeTimeFormat` `numeric: 'auto'` -1 day | `yesterday` (`'always'`: `1 day ago`) |
| `DateTimeFormat` `en-GB`, 2026-10-25T00:30Z, `timeZone` Amsterdam / New York | `25 Oct` / `24 Oct` |
| `dateStyle` with `timeZoneName` | `TypeError`; use `year`, `month`, `day`, `hour`, `minute`, `timeZoneName` |
| d3-format `~s` 1.2e9 / `.2s` 0.00042 | `1.2G` / `420µ` |

Compact rounds 123,456 to `123K`. Dates: pass the same `timeZone` the data was bucketed in (VIZ-020), a short date on the axis and date, time and zone in the tooltip. Locale data changes between ICU versions (the `en-GB` row): test against the runtime, not MDN's examples. d3-format's `s` gives SI prefixes ("G" for a billion) in every locale: only where SI is meant.

Tested 2026-10-23, Node 24.21.0, `d3-format@3.1.2`.

## [VIZ-022] Parsing CSV and large inputs: RFC 4180, BOMs, Papa Parse, csv-parse, DuckDB-WASM
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180.txt), [Papa Parse docs](https://www.papaparse.com/docs), [Papa Parse source at 5.7.0](https://raw.githubusercontent.com/mholt/PapaParse/5.7.0/papaparse.js), [csv-parse: bom option](https://csv.js.org/parse/options/bom/), [DuckDB-WASM overview](https://duckdb.org/docs/stable/clients/wasm/overview), [Node: buffer constants](https://nodejs.org/api/buffer.html#bufferconstantsmax_string_length)
- Related: VIZ-020, VIZ-023, SURF-015

RFC 4180 is "Informational": "there is no formal specification in existence". Its rules: quote fields containing commas, quotes or line breaks; double a quote inside a quoted field (`"b""bb"`); CRLF between records. It says nothing about BOMs, semicolons or decimal commas, which is where files from spreadsheets break.

| | Papa Parse 5.7.0 (MIT) | csv-parse 7.0.3 (MIT) |
|---|---|---|
| Home | browser first, also Node | Node streams first |
| Delimiter | auto-detects from `, \t \| ;` and two control characters | `,` unless set |
| BOM | stripped | kept unless `bom: true` |
| Types | `dynamicTyping: true`; "1.234,5" stays a string, as do integers beyond 2^53 | strings; `cast` function per field |
| Big files | `step`/`chunk` streaming, `worker: true` | stream API |

Set the delimiter when you know it; convert decimal commas yourself.

Large JSON: a string can't exceed `buffer.constants.MAX_STRING_LENGTH`, 536,870,888 UTF-16 units on Node 24, so a file above that can't go through `JSON.parse` at all; stream it or, better, aggregate it before it reaches the client (VIZ-020).

DuckDB-WASM: SQL in the browser, but its `.wasm` files are 35.6 to 41.3 MB (jsDelivr file listing), it is single-threaded by default, and "WebAssembly limits the amount of available memory to 4 GB". The npm `latest` tag pointed at `1.33.1-dev57.0`, a dev build; the newest stable was 1.32.0 (2025-12-16), so pin it. For a dashboard, query on the server instead.

Tested 2026-10-23, Node 24.21.0: Papa Parse on `"﻿a;b\n1;2"` with `header: true` gave `[{ a: '1', b: '2' }]` and delimiter `;`; csv-parse with `columns: true` gave the key `"﻿a"`, and with `bom: true` `"a"`; both parsed `"b""c"` to `b"c`.

## [VIZ-023] Claude as the analyst: query the data, don't read it into context
- Type: recommendation
- Applies to: Claude Code, Claude API, claude.ai
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Claude Code: costs](https://code.claude.com/docs/en/costs.md), [Claude Code: tools reference](https://code.claude.com/docs/en/tools-reference.md), [Claude API: code execution tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool.md), [Claude API: glossary](https://platform.claude.com/docs/en/about-claude/glossary.md), [Claude API: reduce hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations.md), [DuckDB: SUMMARIZE](https://duckdb.org/docs/stable/guides/meta/summarize)
- Related: TOK-040, TOK-042, TOK-043, VIZ-020, VIZ-024

Turn rows into a chart or table with a tool that runs outside the context: `duckdb -c "SELECT country, sum(revenue) FROM 'data.csv' GROUP BY 1"`, `mlr --icsv --opprint stats1 -a sum -f revenue -g country`, `jq` for JSON, or a short Node script. Only the aggregate enters the conversation.

Anthropic's docs say the same in general terms: the costs page shows a hook that preprocesses a 10,000-line log, "reducing context from tens of thousands of tokens to hundreds". The Read tool refuses a whole file over 256 KB and returns at most 25,000 tokens per call (TOK-040). On the API, the code execution tool runs pandas and matplotlib in a container with "5 GiB RAM" and no internet, for "Data analysis, file parsing, or visualization".

Measured: a 1,000-row, five-column CSV (33,916 bytes) cost about 24,900 input tokens to Read, about 1.4 bytes per token, against Anthropic's "approximately 3.5 English characters" per token on earlier models (newer models' tokenizer gives "approximately 30 percent more tokens"). Digits and commas tokenise worse than prose. A five-row aggregate costs under 100.

Verifying the numbers:
- Compute every figure the chart shows in a script, and have the chart and its table read the same output.
- Check a total against the source (`SELECT count(*), sum(x)`) before and after transforming.
- DuckDB's `SUMMARIZE` quantiles "are approximate values": use `quantile_cont` for figures you publish.
- For a borderline calculation on the API, ask Claude to "run code to verify this" (code execution docs).

Tested 2026-10-23, v2.1.296, terminal, Haiku 5.5: `claude -p` with `--output-format stream-json`; the turn after Read had 61,918 context tokens against 36,979 before it.

## [VIZ-024] The built-in `dataviz` skill: what it prescribes and how it changes
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Claude Code: commands](https://code.claude.com/docs/en/commands.md), [Claude Code CHANGELOG](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md), skill files read from the desktop app's bundled skills at 2.1.308
- Related: VIZ-003, VIZ-006, VIZ-007, VIZ-025, SURF-015

`/dataviz` is a bundled skill: "Design guidance for charts, graphs, and dashboards… validates the palette for colorblind safety and contrast with a bundled script". Added in 2.1.198 (2026-07-01), changed in 2.1.210, 2.1.216, 2.1.296 and 2.1.309 (2026-10-22, APCA added): re-read it before quoting its numbers.

What it prescribes (2.1.308 files):
- Form before colour; a single value is a stat tile, more than about 7 meaningful classes a table.
- Series ladder: 1–3 colour alone, 4 needs direct labels, 5–6 "soft cap", 7–8 "token ceiling", never a 9th hue.
- Eight categorical hues in fixed order, never cycled, and colour follows the entity when a filter changes.
- Palette checks: OKLCH lightness 0.43–0.77 (light) or 0.48–0.67 (dark), chroma at least 0.10; CVD separation ΔE (OKLab ×100) target 8, floor 6 only with secondary encoding, under the Machado 2009 model; normal-vision ΔE at least 15; marks 3:1 against the surface.
- Marks: bars at most 24 px thick, lines 2 px, markers at least 8 px, solid 1 px gridlines.
- A legend for two or more series, a table-view twin for every chart, tooltips that "enhance, they never gate".
- Never a dual axis.

Its validator (`scripts/validate_palette.js` and a Python twin) is pure computation: it reads arguments or `document.body.dataset` and writes to the console, with no file, network or process calls. Its thresholds are the skill's own calibration, not a published standard.

Anthropic's knowledge-work-plugins `data-visualization` skill (Apache-2.0, at `33d3dea`) disagrees on one rule: "Dual-axis charts: Use cautiously… Clearly label both axes if used" (VIZ-004).

## [VIZ-025] Chart MCP servers and skills: what they run, write and send
- Type: tool
- Applies to: Claude Code, claude.ai
- Confidence: single-source
- Last verified: 2026-10-23
- Sources: [AntV mcp-server-chart at e2a8fb7](https://github.com/antvis/mcp-server-chart/tree/e2a8fb7c185e17c75c067817ff1a2acfddf49aa1), [hustcc/mcp-echarts at 3ed2496](https://github.com/hustcc/mcp-echarts/tree/3ed2496c3312a4f5b93fe655b8dab17453048f41), [mcp-vegalite-server at 16aefed](https://github.com/isaacwasserman/mcp-vegalite-server/tree/16aefed598b8cd897b78e99b907f6e2984572c61), [Quickchart-MCP-Server at aba9fd7](https://github.com/GongRzhe/Quickchart-MCP-Server/tree/aba9fd76df247fd545e05f295274cb9e4ae456e8), [anthropics/knowledge-work-plugins at 33d3dea](https://github.com/anthropics/knowledge-work-plugins/tree/33d3dea41a341b341d4f5da2e8801ae0c89be2b8)
- Related: VIZ-024, ANIMLIB-012, MCP-019, SKILL-069

Read, not run, at the commits linked.

| Tool | Runs | Sends your data to |
|---|---|---|
| AntV `mcp-server-chart` 0.9.11 (MIT) | Node via unpinned `npx` | `https://antv-studio.alipay.com/api/gpt-vis` by default: `generateChartUrl` posts the chart options; `VIS_REQUEST_SERVER` points it at your own service |
| `hustcc/mcp-echarts` 0.7.1 (MIT) | Node via `npx`, with native `@napi-rs/canvas` | nowhere per its README ("fully generated locally"), MinIO if configured; source not read |
| `mcp-vegalite-server` 0.0.1 | Python via `uv` from a checkout | no HTTP code in `server.py`; whether `vl-convert` fetches a spec's `data.url` wasn't checked. No licence file; last commit 2025-05-16 |
| QuickChart MCP server (MIT) | Node via `npx` | `quickchart.io`: the data is encoded in the image URL |
| knowledge-work-plugins `data-visualization` skill (Apache-2.0) | Python recipes (matplotlib, seaborn, plotly) | nowhere; writes PNGs to the working directory |

anthropics/skills (at `dbd4588`) has no chart skill, only chart helpers inside its docx, pptx and xlsx skills; claude-plugins-official (at `465f093`) lists no chart plugin.

For our data, prefer the built-in `dataviz` skill and a library in the app over a chart MCP server: two of the four servers send the data to a third-party host by default, and none is pinned by its install line. Vet any of them as in MCP-019 and SKILL-069. skills.sh and a wider GitHub search weren't covered.

## [VIZ-026] Animated transitions: what the research supports
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Heer and Robertson 2007, Animated Transitions in Statistical Data Graphics](https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf), [Bostock 2012, Object Constancy](https://bost.ocks.org/mike/constancy/), [Robertson et al. 2008, Effectiveness of Animation in Trend Visualization](https://faculty.cc.gatech.edu/~stasko/papers/infovis08-anim.pdf), [Chevalier, Dragicevic and Franconeri 2014, The Not-so-Staggering Effect of Staggered Animated Transitions](https://inria.hal.science/hal-01054408v1/file/staggered-study.pdf)
- Related: VIZ-027, VIZ-028, ANIM-013, ANIM-015

Animate a change between two states of the same data so readers can track it; don't animate a trend in place of showing it.

Heer and Robertson (2007, two experiments, 1.25-second transitions): "animation improved graphical perception at both syntactic (object tracking) and semantic (change estimation) levels". Staged animation was "significantly preferred to direct animation in most cases", but "simple staging proved beneficial, though the advantages are not overwhelming"; staging raised tracking error for scatter-plot value changes, and heavy staging "resulted in increased error". Guidelines: slow-in slow-out, "Use simple transitions", "Minimize occlusion", "Make transitions as long as needed, but no longer". On duration they cite Robertson et al. (2002): "transition times around 1 second, though transitions with minimal movement can likely be performed faster". They suggest staggering; Chevalier, Dragicevic and Franconeri (2014) found it "has a negligible, or even negative, impact on multiple object tracking performance". Filtered items fade in and out.

Bostock (2012): "object constancy" needs each mark to keep its identity; "Transitions between unrelated datasets or dimensions… should use a simpler cross-fade or cut", and "animation should only be used when it enhances understanding".

Robertson et al. (2008), animated trends against static traces and small multiples: animation "is the fastest technique for presentation and participants find it enjoyable", but "it does lead to many participant errors" and "is the least effective form for analysis". Their animation had a Play/Pause button and a time slider.

So (our reading): animate re-sorts, filters and rescales of the same marks. The research timed rare, deliberate transitions of many marks at about 1 s; for frequent toggles, UI timing applies, 200–400 ms in one stage (ANIM-015). Show change over time statically, or give play, pause and a slider; don't animate a first render to decorate.

## [VIZ-027] Chart libraries' animation defaults and reduced motion
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: local test (below), [ECharts `globalDefault.js` at 6.1.0](https://raw.githubusercontent.com/apache/echarts/6.1.0/src/model/globalDefault.ts), [Chart.js: animations](https://www.chartjs.org/docs/latest/configuration/animations.html), [AG Charts: animation](https://www.ag-grid.com/charts/angular/animation/), [d3-transition at v3.0.1](https://raw.githubusercontent.com/d3/d3-transition/v3.0.1/src/selection/transition.js)
- Related: VIZ-026, ANIMLIB-007, ANIM-010, ACCESS-014

No library tested reads `prefers-reduced-motion`: the string appears nowhere in their installed packages, and the first-render animations ran unchanged under Playwright's `reducedMotion: 'reduce'`.

| Library | Default first render | Turn it off |
|---|---|---|
| ECharts 6.1.0 | animates: `animationDuration: 1000`, `animationDurationUpdate: 500`, `cubicInOut`; `animationThreshold: 2000` elements | `animation: false` |
| Chart.js 4.6.1 | animates (1000 ms `easeOutQuart`) | `options.animation: false` |
| ngx-charts 25.0.3 | bars grow from zero over about 600 ms | `[animations]="false"` |
| AG Charts Community 14.2.0 | no animation observed; its docs examples set `animation: { enabled: true }` and the page carries an Enterprise badge | `animation: { enabled: false }` |
| Observable Plot, uPlot, plain SVG | static | — |
| d3-transition 3.0.1 | only when you call `transition()`; default 250 ms | — |

Pass the user's preference in: `animation: !matchMedia('(prefers-reduced-motion: reduce)').matches`, read in the browser (`afterNextRender`), and keep it in a signal so a change updates the chart. Under `reduce`, replace a value tween with a short cross-fade (ANIM-010) or an instant change that marks the changed bars, since an instant change loses tracking.

Tested 2026-10-23, Chromium 156: screenshots of the charts compared at about 120 ms and 2.6 s after first paint with and without `reduce` ("static" means no change between the two); ngx-charts' first bar path traced every 100 ms (seven distinct shapes in 1.5 s by default, one with `[animations]="false"`); ECharts and Chart.js static with animation off.

## [VIZ-028] Count-ups, live charts and scrollytelling: pause and reduced-motion versions
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [Scrollama README](https://raw.githubusercontent.com/russellsamora/scrollama/main/README.md), [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API), [Robertson et al. 2008](https://faculty.cc.gatech.edu/~stasko/papers/infovis08-anim.pdf)
- Related: VIZ-026, VIZ-027, ANIM-006, ANIM-007, ANIM-011, ANIMLIB-008, ANIMLIB-011, ANIMLIB-014, UIPAT-015

- **Count-up numbers:** decoration, not tracking (VIZ-026). If used, put the final value in the DOM from the start (screen readers and SSR get it at once) and animate only a visual copy; under `reduce`, show the final value. 2.2.2 exempts motion that ends within 5 seconds. Motion or GSAP can tween a number (ANIMLIB-014).
- **Live-updating charts:** 2.2.2 covers "any auto-updating information that (1) starts automatically and (2) is presented in parallel with other content": give a pause control or a way to "control the frequency of the update" (Robertson et al. 2008 gave theirs Play/Pause and a slider). Never flash a changed value more than three times a second (2.3.1). Don't announce every tick: a live region on a streaming value floods screen readers; announce on request or at most a summary (UIPAT-015).
- **Re-sorting a table:** a view transition with `view-transition-name` per row should animate rows to their new places (ANIM-007; untested here). Rows travel, so about 1 s helps tracking (VIZ-026); under `reduce`, keep the default cross-fade (ANIM-010). Focus stays on the sort button (VIZ-016).
- **Scrollytelling:** Scrollama 3.2.0 uses IntersectionObserver and `position: sticky` and says nothing about accessibility or reduced motion. All steps' text must be in the DOM in reading order without JavaScript (ANIMLIB-011); under `reduce`, show each step's final chart statically beside its text.

## [VIZ-029] Commercial chart licences: Highcharts, AG Charts Enterprise, ApexCharts
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Highcharts shop](https://shop.highcharts.com/), [Highcharts licence](https://www.highcharts.com/license), [AG Charts pricing](https://www.ag-grid.com/charts/license-pricing/), [AG Charts: Community vs Enterprise](https://www.ag-grid.com/charts/angular/community-vs-enterprise/), [ApexCharts LICENSE.md](https://raw.githubusercontent.com/apexcharts/apexcharts.js/main/LICENSE.md)
- Related: VIZ-008, VIZ-012, OSS-008

Three of the candidates cost money for us, read 2026-10-23:

- **Highcharts 13.1.1**: commercial use needs a licence (npm `license` is a URL). Core per developer seat: internal use $185 a year or $425 perpetual, "Not valid for SaaS, public sites or deployment to third parties"; SaaS or external (any public site) $366 a year or $839 perpetual. Core with Stock, Maps and Gantt: $876 a year external. Non-commercial use is "authorized by Highsoft" under separate terms. Prices from the shop's structured data (`priceValidUntil` 2027-01-01).
- **AG Charts**: Community (MIT) is "Free for everyone, including production use"; Enterprise "From $499 USD per developer", "Free to test locally", with a watermark without a key. Enterprise-only: "20+ additional chart types, including Range, Heatmap, Sankey", financial charts, animations, zoom, crosshairs, navigator and context menus. AG Grid Enterprise with AG Charts Enterprise: "From $1,498 USD per developer".
- **ApexCharts 8.4.1**: npm says "SEE LICENSE IN LICENSE.md"; the current file is "a dual-license model": free "for individuals, non-profits, educators, and small businesses" under $2 million USD a year in revenue, budget or funding; at or above that, counting "your parent company, affiliates", a paid Pro, Premium or OEM licence. Embedding it "in a product or platform used by other people" needs the OEM licence "whatever your size". The change came in 5.0.0 (2025-07-09; 4.7.0 was MIT), but npm's `license` field still says MIT for 5.0.0 and changes at 5.1.0 (`npm view apexcharts@<v> license`). Prices aren't in the file.

A licence allow-list in CI (OSS-008) rejects all three by default: record the decision where the dependency is added. For our sites, none buys anything VIZ-012's open-source options lack, except Highcharts' accessibility module: prior art worth testing, not buying (VIZ-015).

## [VIZ-030] Dashboards: scope, KPI tiles, sparklines and gauges
- Type: recommendation
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-23
- Sources: [NN/g: dashboards and preattentive processing (2017)](https://www.nngroup.com/articles/dashboards-preattentive/), [Government Analysis Function: testing dashboards](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-testing-dashboards-for-design-and-accessibility/), [Government Analysis Function: building and managing dashboards](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-building-and-managing-dashboards/)
- Related: VIZ-001, VIZ-003, VIZ-004, VIZ-018, VIZ-021, UIPAT-001

NN/g: "Dashboards are focused on a single task: communicating critical information"; they are not "expansive views of complex data" but are "consumed fast, with a minimum of interaction or cognitive processing". The Analysis Function: "Simple designs are the most effective ways to present data", by "prioritising important metrics and visuals", "limiting colour schemes and fonts to a few consistent choices", and "Always make it clear which dates or period your dashboard is relevant to".

What to leave off (NN/g):
- Gauges "consume a lot of precious space on a dashboard and are also harder to interpret than linear graphs"; use "linear bullet charts".
- "treemaps are not appropriate for simple, actionable dashboards."
- Pies and donuts "should be avoided most of the time" (VIZ-004).
- "color should not be used to communicate information about quantitative values or magnitude."

A KPI tile (our recommendation; no authority found for tiles or sparklines):
- Value with its unit and label, the period or "as of" time, and a comparison that names its baseline ("+4% vs last week").
- No prior period: "no comparison", never "0%".
- A sparkline without axes may show the shape; the delta is its text equivalent, so the sparkline can be `aria-hidden`.
- Loading keeps the tile's size; an error keeps the last value with its age (VIZ-018).
- Numbers formatted as in VIZ-021, full precision in the tile's tooltip or table.

Large tables on a dashboard: the Analysis Function says "paginate large tables rather than allowing them to spill off the screen"; VIZ-017 allows scrolling a table in its own region. Both hold: paginate on dashboards, scroll in detail views.

## Recommendations for our setup

Ranked by impact against effort. osrs-tracker-web draws its time series with Chart.js on canvas (`src/app/common/charts/`, `main` at `3dab349`, read 2026-10-23); its chart hosts carry `role="img"` and an `aria-label`, and it creates charts only in the browser. freek-mencke-web has no chart library.

1. Done 2026-10-23: osrs-tracker-web's charts state their takeaway and show their data as a table (osrs-tracker/osrs-tracker-web#395, fixed in osrs-tracker/osrs-tracker-web#436). VIZ-005, VIZ-014, VIZ-027.
2. Done 2026-10-28: VIZ-012's order, a takeaway and a table, reduced motion and `@defer` are in `angular-conventions`, and `ui-review` asks "what's the takeaway, and where is the table?" (FreekMencke/claude-skills#120, FreekMencke/claude-skills#121). VIZ-012, VIZ-014, VIZ-027.
3. **Agents analyse data with queries, not reads**: aggregate with DuckDB, Miller, `jq` or a script, and have the chart and its table read the script's output. VIZ-023, VIZ-020.
4. **Use the built-in `dataviz` skill, not a chart MCP server**, and quote its numbers only after re-reading it. VIZ-024, VIZ-025.
5. **No commercial chart library** without a recorded licence decision. VIZ-029, OSS-008.

## Open questions

1. **Tufte**: no primary text was read (the CMU copy of "Aesthetics and Technique" didn't extract, edwardtufte.com wasn't reached), so data-ink and his pie wording aren't quoted.
2. **Perception studies behind VIZ-003**: none read in full. Leads: Borland and Taylor 2007 and Crameri et al. 2020 (rainbow), Pandey et al. 2015 and Correll, Bertini and Franconeri 2020 (truncated axes; the latter argues against an exceptionless zero rule), Siegrist 1996 (3D), Spence and Lewandowsky 1991 (pies did as well as bars). Isenberg et al. 2011 studies focus-plus-context "dual-scale" charts, not two y-axes: don't cite it for dual axes. No controlled study of dual-y-axis misreading was found.
3. **Dark-mode chart palettes**: no study or standard found beyond the built-in skill (VIZ-007).
4. **Screen-reader support for Graphics ARIA roles**: none found at a11ysupport.io or in Fossheim's and Schepers' writing (VIZ-014).
5. **LTTB thesis**: skemman.is refused the download, so Steinarsson (2013) is cited through Chart.js's docs (VIZ-013).
6. **Not measured**: Vega-Lite, Plotly.js, Unovis, ApexCharts and Highcharts bundles and SSR; Firefox and WebKit accessibility trees; a screen reader on any chart (VIZ-009 to VIZ-011).
7. **ApexCharts' prices**, and whether its SSR entry point works under Angular (VIZ-029). Its licence text was rewritten five times between 2026-09-15 and 2026-10-09: re-read it before relying on VIZ-029.
8. **GitHub's Mermaid version** and whether it accepts `xychart` or only `xychart-beta` (VIZ-019).
9. **claude.ai artifacts' chart libraries**: the current artifacts help article lists none, and whether Recharts is still available wasn't checked; Claude Design, Docs and Dashboards chart types weren't read (VIZ-024).
10. **Arquero and DuckDB-WASM under a strict CSP** (an artifact's or our apps'): not tested (VIZ-020, VIZ-022).
11. **Community dataviz skills** on skills.sh and GitHub beyond the four MCP servers: not surveyed (VIZ-025).
12. **The FT Visual Vocabulary poster**: only its README was read; the poster PDF has more per-chart advice (VIZ-001).
13. **Stagger delay**: no research-backed value; Chevalier et al. (2014) found staggering didn't help tracking (VIZ-026).
14. **Not tested**: request-time SSR, zoneless updates after the first render, AG Charts under `@defer`, a hydration guard for server-rendered Plot, view transitions on table re-sort (VIZ-010, VIZ-028).
15. **Title framing**: Kong et al.'s studies on how a chart's title slants its reading weren't read (VIZ-005).
16. **Sparklines and KPI tiles**: no authority found (Material's pages didn't render without JavaScript); VIZ-030's tile is our recommendation.
