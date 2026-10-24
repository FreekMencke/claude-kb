# Entries

Every entry by ID, title, type and tags, one table per topic file. Generated from the topic files' index tables by
`node scripts/check-kb.ts --write`: don't edit it by hand. Grep it rather than reading it whole:

```bash
grep -i -E 'webfetch|curl' ENTRIES.md
```

Then read only the entries you need: `grep -n '^## \[TOK-036\]' topics/kb-*.md` gives the file and line. Start at
[INDEX.md](INDEX.md) for Quick answers and Conflicts.

Merged entries keep their ID and a pointer, so old references still resolve.

## Web accessibility: WCAG 2.2, the EU Accessibility Act, axe and its limits (`topics/kb-accessibility.md`, ACCESS)

| ID | Title | Type | Tags |
|---|---|---|---|
| ACCESS-001 | Target WCAG 2.2 AA; WCAG 3.0 is a Working Draft | recommendation | wcag, wcag-2-2, wcag-3, standards |
| ACCESS-002 | What WCAG 2.2 added and removed, and what it means in code | fact | wcag-2-2, target-size, focus, authentication |
| ACCESS-003 | The European Accessibility Act: from when, for whom, and the microenterprise exemption | fact | eaa, eu-law, e-commerce, microenterprise |
| ACCESS-004 | EN 301 549: v3.2.1 is cited, v4.1.1 (WCAG 2.2 AA) awaits its Official Journal citation | fact | en-301-549, eaa, harmonised-standard, wcag-2-2 |
| ACCESS-005 | axe-core 4.14: what runs by default, tags, and what 4.14.0 changed | fact | axe-core, tags, rules, upgrade |
| ACCESS-006 | axe in Playwright tests with `@axe-core/playwright` | pattern | playwright, axe-core, e2e, ci |
| ACCESS-007 | Lighthouse's accessibility score: an axe subset with weights | fact | lighthouse, axe-core, score |
| ACCESS-008 | What automated accessibility checks miss | fact | limits, manual-testing, axe-core, lighthouse |
| ACCESS-009 | Native elements over ARIA: a role is a promise | anti-pattern | aria, native-html, agent-mistakes, webaim |
| ACCESS-010 | Custom widgets: follow an APG pattern; site navigation isn't an ARIA menu | pattern | apg, angular-aria, navigation, widgets |
| ACCESS-011 | Lint templates with angular-eslint's `templateAccessibility` | tool | angular-eslint, lint, angular, templates |
| ACCESS-012 | Focus after a client-side route change | pattern | focus, routing, angular, ssr |
| ACCESS-013 | Modal `<dialog>`, `inert`, popover semantics and `ariaNotify()` | fact | dialog, inert, popover, arianotify |
| ACCESS-014 | Motion and contrast preferences: what WCAG requires | fact | prefers-reduced-motion, forced-colors, prefers-contrast, wcag |
| ACCESS-015 | An agent's accessibility check, and what a human must still do | recommendation | verification, agents, manual-testing, workflow |

## Angular 21–22 changes and Angular's AI tooling (`topics/kb-angular.md`, NG)

| ID | Title | Type | Tags |
|---|---|---|---|
| NG-001 | Release cadence and support windows: 12-month majors from v22 | fact | releases, lts, support, cadence |
| NG-002 | TypeScript and Node ranges of each supported major | fact | typescript, node, peer-dependencies, versions |
| NG-003 | v22 components are OnPush unless they say `Eager` | fact | change-detection, onpush, v22 |
| NG-004 | Zoneless is the default since v21 | fact | zoneless, zone-js, testbed, v21 |
| NG-005 | Other v22 defaults that change behaviour | fact | http, router, hydration, templates, v22 |
| NG-006 | APIs removed or deprecated in v21 and v22 | fact | removed-apis, deprecations, migration |
| NG-007 | `@Service`: the v22 decorator for root services | fact | di, service, injectable, v22 |
| NG-008 | SSR: `BootstrapContext`, host validation and `CommonEngine` | fact | ssr, security, express, v21, v22 |
| NG-009 | Unit tests: Vitest by default since v21 | fact | vitest, karma, testing |
| NG-010 | What `ng update` migrates and what it leaves to you | fact | ng-update, migrations, schematics |
| NG-011 | Stable, developer preview or experimental at 22.2 | fact | stability, signal-forms, resource, aria |
| NG-012 | `ng mcp`: tools, flags and server instructions | tool | mcp, angular-cli, tools |
| NG-013 | Context cost of `ng mcp` in Claude Code | fact | mcp, tokens, tool-search |
| NG-014 | Running `ng mcp` from a repo's `.mcp.json` | recommendation | mcp, mcp-json, read-only, setup |
| NG-015 | `get_best_practices` returns the guide for the installed version | fact | best-practices, versions, mcp |
| NG-016 | Angular's rules files and llms.txt | fact | agents-md, rules-files, llms-txt |
| NG-017 | angular/skills follows Angular's `main` branch | fact | skills, angular-developer, third-party |
| NG-018 | In-page WebMCP and AI debugging tools (v22) | fact | webmcp, devtools, experimental |

## Animation libraries and their agent tooling: Motion, GSAP, Lenis (`topics/kb-animation-libraries.md`, ANIMLIB)

| ID | Title | Type | Tags |
|---|---|---|---|
| ANIMLIB-001 | Motion, GSAP and Lenis on 2026-10-23: versions, licences, peers | fact | motion, gsap, lenis, versions, licenses |
| ANIMLIB-002 | GSAP's Standard licence: free for commercial use, not open source | fact | gsap, license, webflow, source-available |
| ANIMLIB-003 | Bundle cost in an Angular 22 production build | fact | bundle-size, gzip, angular, motion-mini, scrolltrigger |
| ANIMLIB-004 | SSR: importing is safe, calling on the server isn't always | fact | ssr, prerender, afternextrender, window |
| ANIMLIB-005 | Motion's vanilla API in an Angular component | pattern | motion, angular, scopemotion, cleanup, waapi |
| ANIMLIB-006 | GSAP in an Angular component: context, matchMedia and ScrollTrigger cleanup | pattern | gsap, angular, matchmedia, scrolltrigger, cleanup |
| ANIMLIB-007 | Reduced motion: each library's default and what it covers | fact | prefers-reduced-motion, motion, gsap, lenis, defaults |
| ANIMLIB-008 | An endless loop in the reduced-motion branch likely fails WCAG 2.2.2 | anti-pattern | wcag-2.2.2, reduced-motion, gsap, infinite-animation |
| ANIMLIB-009 | Lenis at rest behaves like native scroll | fact | lenis, keyboard, find-in-page, anchors, scroll-restoration |
| ANIMLIB-010 | Lenis setup: the options to set and the traps | pattern | lenis, nested-scroll, autoraf, anchors, destroy |
| ANIMLIB-011 | Content hidden until a scroll trigger fires: no JS, print, find-in-page | anti-pattern | scroll-reveal, scrolltrigger, inview, print, find-in-page |
| ANIMLIB-012 | gsap-skills and Motion's AI Kit: what they run, write and fetch | tool | gsap-skills, motion-ai-kit, mcp, supply-chain |
| ANIMLIB-013 | Emil Kowalski's animation skills: numbers to borrow, claims to check | tool | animation-skills, durations, easing, reduced-motion |
| ANIMLIB-014 | When not to use each library | recommendation | native-css, motion, gsap, lenis, decision |
| ANIMLIB-015 | Lenis drops keys mid-animation, hijacks nested scroll boxes and flashes on anchors | anti-pattern | lenis, keyboard, nested-scroll, anchors, scroll-jacking |
| ANIMLIB-016 | Vendor `llms.txt` files: size, pinning and what they tell agents | tool | llms-txt, pinning, motion, gsap, lenis |
| ANIMLIB-017 | Emil Kowalski's articles and libraries against his skills | comparison | kowalski, durations, reduced-motion, sonner, vaul |

## AWS Lambda on the Node.js runtime (`topics/kb-aws-lambda-node.md`, LAMBDA)

| ID | Title | Type | Tags |
|---|---|---|---|
| LAMBDA-001 | Node.js runtime identifiers and their deprecation, create-block and update-block dates | fact | runtimes, deprecation, nodejs24, nodejs26, preview |
| LAMBDA-002 | Finding functions on a deprecated runtime, and how runtime updates reach them | fact | deprecation, list-functions, runtime-updates, trusted-advisor |
| LAMBDA-003 | Lambda's Node isn't upstream Node: `require(esm)` and module detection off, Temporal missing on 26 | fact | require-esm, esm, nodejs26, experimental-flags, temporal |
| LAMBDA-004 | Handlers: ESM with top-level `await`, and callback handlers rejected from `nodejs24.x` | fact | handler, esm, callback, top-level-await, nodejs24 |
| LAMBDA-005 | Bundling a small function with esbuild: CJS or ESM output, and SAM and CDK defaults | pattern | esbuild, bundling, esm, create-require, cdk, sam |
| LAMBDA-006 | The runtime's AWS SDK is a pinned minor: bundle your own clients | recommendation | aws-sdk, bundling, runtime-sdk, cdk |
| LAMBDA-007 | Cold starts on Node: what moves them, no SnapStart, and init is billed | fact | cold-start, init, snapstart, memory, provisioned-concurrency |
| LAMBDA-008 | Lambda Web Functions: a Node HTTP server on Lambda without an adapter | fact | web-functions, express, http, nodejs24, pricing |
| LAMBDA-009 | EventBridge Scheduler or scheduled rules for cron triggers | comparison | eventbridge, scheduler, cron, time-zones, pricing |
| LAMBDA-010 | Retries for scheduled functions: two by default, and how to turn them off | fact | retries, async-invocation, event-invoke-config, alerts |
| LAMBDA-011 | Cost of a small scheduled function: logs, memory, architecture | fact | cost, cloudwatch-logs, retention, memory, arm64 |

## Building on the Claude API, Agent SDK and Managed Agents (`topics/kb-claude-api.md`, CAPI)

| ID | Title | Type | Tags |
|---|---|---|---|
| CAPI-001 | Request settings that return 400 on the 5.x models | fact | api, breaking-changes, thinking, tool-choice, sampling, prefill |
| CAPI-002 | Thinking blocks in responses: read by type, pass back, keep history append-only | fact | api, thinking, preserved-thinking, migration |
| CAPI-003 | Model IDs are pinned snapshots; the retirement schedule and how to check it | fact | api, model-ids, deprecations, retirement, models-api |
| CAPI-004 | Replace forced tool use with `auto` plus strict tools; strict-tool limits | recommendation | api, tool-choice, strict-tool-use, json-schema |
| CAPI-005 | Structured outputs: what isn't guaranteed and what they don't combine with | fact | api, structured-outputs, refusals, citations |
| CAPI-006 | The SDK tool runner, and returning parallel tool results | tool | api, tool-runner, parallel-tool-use, typescript-sdk |
| CAPI-007 | Programmatic tool calling: when it pays off and its constraints | tool | api, programmatic-tool-calling, code-execution |
| CAPI-008 | Stop reasons and refusals an app must handle | fact | api, stop-reason, refusals, fallback |
| CAPI-009 | TypeScript SDK: retries, timeouts, streaming and request size | fact | typescript-sdk, retries, timeouts, streaming, errors |
| CAPI-010 | Files API, citations and Batch for a small app | comparison | api, files-api, citations, batch |
| CAPI-011 | Agent SDK or `claude -p`, and what the SDK installs | comparison | agent-sdk, headless, auth, versioning |
| CAPI-012 | Agent SDK permission order and hook callbacks | fact | agent-sdk, permissions, can-use-tool, hooks |
| CAPI-013 | Managed Agents scheduled deployments, budgets, vaults and webhooks | fact | managed-agents, scheduled-deployments, budgets, vaults, webhooks |
| CAPI-014 | Scheduled agent work: Managed Agents deployment or Claude Code routine | comparison | managed-agents, routines, schedule, cost, secrets |
| CAPI-015 | Evaluating an LLM feature: success criteria, test sets and graders | recommendation | evals, graders, testing, llm-judge |

## Modern CSS and Baseline browser support (`topics/kb-css-baseline.md`, CSS)

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

## Data visualisation and transformation: charts, tables, colour, formatting, motion (`topics/kb-dataviz.md`, VIZ)

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

## Community design skills: mechanisms, security surface, a test (`topics/kb-design-skills.md`, DSKILL)

| ID | Title | Type | Tags |
|---|---|---|---|
| DSKILL-001 | Five community design skills and frontend-design, by mechanism | comparison | community-skills, impeccable, taste-skill, hallmark, ui-ux-pro-max, huashu-design |
| DSKILL-002 | Taste Skill: a scripted deal of 3 of 20 directions, a user-level history, house bans | tool | taste-skill, deal, history, bans |
| DSKILL-003 | Hallmark: dealt themes, a project log, and Floor, Reflex and Finish gates | tool | hallmark, deal, log, gates |
| DSKILL-004 | Impeccable: a remote roll of directions, modes and a craft floor | tool | impeccable, roll, modes, craft-floor |
| DSKILL-005 | ui-ux-pro-max: a fixed lookup from product type to style and palette | tool | ui-ux-pro-max, lookup, category-defaults, csv |
| DSKILL-006 | huashu-design: three drafted directions, a seconds roulette and a look ledger | tool | huashu-design, directions, ledger, roulette |
| DSKILL-007 | Where the design skills disagree with each other and with frontend-design | comparison | conflicts, bans, near-black, hairlines, eyebrows |
| DSKILL-008 | A fixed catalogue becomes its own default | fact | catalogue, convergence, defaults, rotation |
| DSKILL-009 | Impeccable's detector and Hallmark's `sloplint`: what AI-look linters check | tool | linters, detector, sloplint, thresholds |
| DSKILL-010 | Security surface, part 1: install paths, hooks and binaries | fact | security, hooks, install, binaries, supply-chain |
| DSKILL-011 | Licences of the skills' code and the assets they pull in | fact | licences, apache-2.0, mit, photos, cc-by-sa |
| DSKILL-012 | Token cost per build and release cadence | fact | tokens, cost, maintenance, releases |
| DSKILL-013 | Test: Hallmark, ui-ux-pro-max and frontend-design as text only on two briefs | comparison | experiment, convergence, text-only, isolation |
| DSKILL-014 | What to borrow from the design skills, and the notice it needs | recommendation | borrow, log, floor-rules, guidelines, licences |
| DSKILL-015 | Security surface, part 2: network, remote text in context and telemetry | fact | security, network, telemetry, remote-text, prompt-injection |

## Visual and UI design with Claude (`topics/kb-design.md`, DESIGN)

| ID | Title | Type | Tags |
|---|---|---|---|
| DESIGN-001 | Visualising and iterating on a design in Claude Code | pattern | artifacts, design-command, variants, browser-pane |
| DESIGN-002 | Design systems for `/design`: Design System artifacts and `/design-sync` | fact | design-system, design-sync, react, angular |
| DESIGN-003 | Why Claude's designs look generic, and the named clichés by date | fact | generic, distributional-convergence, cliches |
| DESIGN-004 | Prompting for distinctive design | recommendation | prompting, brief, tokens, banned-patterns, directions |
| DESIGN-005 | The frontend-design skill and how it differs from `artifact-design` | tool | frontend-design, artifact-design, skills |
| DESIGN-006 | House style: where design tokens live and what wins | recommendation | tokens, CLAUDE.md, design-md, fonts, precedence |
| DESIGN-007 | Verify a design by measuring, not only by looking | pattern | verification, computed-styles, screenshots, contrast |
| DESIGN-008 | What Claude's vision gets wrong in design work | fact | vision, limits, coordinates, image-size |
| DESIGN-009 | Improving an existing design: inputs, audit, polish or redesign | pattern | audit, redesign, polish, accessibility, variants |
| DESIGN-010 | Extracting a design system from code or a URL | pattern | design-system, extraction, tokens, computed-styles |
| DESIGN-011 | Models and effort for design work | recommendation | models, effort, opus, sonnet, inference |
| DESIGN-012 | Community design skills (unofficial) (merged into DSKILL-001) | comparison | community, impeccable, taste-skill, design-md |
| DESIGN-013 | Design pitfalls | anti-pattern | pitfalls, verification, drift, animation, css |
| DESIGN-014 | Anthropic's other design skills in `anthropics/skills` | tool | theme-factory, canvas-design, brand-guidelines, web-artifacts-builder |
| DESIGN-015 | Colour roles: name tokens by job, not by hue | pattern | colour, roles, semantic-tokens, radix, material |
| DESIGN-016 | Generating a palette in OKLCH, to contrast targets | pattern | colour, oklch, palette, leonardo, tailwind |
| DESIGN-017 | Contrast: target WCAG 2 ratios; WCAG 3 hasn't picked an algorithm | fact | contrast, wcag, apca, accessibility |
| DESIGN-018 | Deriving dark mode | pattern | dark-mode, light-dark, colour, tokens |
| DESIGN-019 | Colour libraries Claude can call from a script or an artifact | tool | culori, colorjs, leonardo, material-color-utilities, npm |
| DESIGN-020 | Type: a fluid scale and a measured line length | pattern | typography, type-scale, utopia, line-length |
| DESIGN-021 | Token files: the DTCG format and three tiers | fact | tokens, dtcg, style-dictionary, tiers |
| DESIGN-022 | Layout: name the structure, then encode the wireframe | pattern | layout, grid, wireframes, cards, every-layout |
| DESIGN-023 | Tailwind and shadcn/ui defaults, and theming them away | fact | tailwind, shadcn, defaults, theming |
| DESIGN-024 | Coherent multi-page sites: tokens, inventory, templates, drift checks | pattern | multi-page, consistency, drift, design-system |
| DESIGN-025 | Critique and variants: diverge, pick, then score | pattern | critique, rubric, variants, heuristics |
| DESIGN-026 | Measured originality of LLM-generated UI | fact | originality, benchmark, diversity, research |
| DESIGN-027 | Test: four prompting strategies on one brief | comparison | experiment, prompting, directions, banned-patterns |
| DESIGN-028 | Isolating scripted design tests from your own setup | pattern | headless, safe-mode, isolation, testing |
| DESIGN-029 | Test: four directions, then a person picks | comparison | experiment, directions, human-pick, swatches |
| DESIGN-030 | Tests: from a visual chooser to staged picks | comparison | experiment, staged-picks, swatches, tone-of-voice |
| DESIGN-031 | Staged picks on an existing site: extract, then lock, nudge or open each step | pattern | existing-site, redesign, staged-picks, tokens |
| DESIGN-032 | Optical sizes: when they matter, and what browsers do with `opsz` | fact | typography, optical-size, opsz, font-optical-sizing, variable-fonts |
| DESIGN-033 | Pairing typefaces: one family first, then a second face with a job | pattern | typography, font-pairing, superfamily, font-matrix |
| DESIGN-034 | Numerals and `case` in a UI: tabular for data, `case` for capitals | recommendation | typography, numerals, tabular-nums, font-variant-numeric, opentype-features |
| DESIGN-035 | The Google Fonts API serves fewer features and axes than the family has | fact | google-fonts, opentype-features, opsz, self-hosting |
| DESIGN-036 | The DESIGN.md format: eight sections, version "alpha", and its linter | fact | design-md, spec, linter, tokens, product-md |
| DESIGN-037 | Test: DESIGN.md, CLAUDE.md or a theme file, does Claude Code use it? | comparison | design-md, claude-md, imports, experiment, tokens |
| DESIGN-038 | Brand DESIGN.md collections: what's in them and how they were made | comparison | design-md, awesome-design-md, brand-systems, collections |
| DESIGN-039 | Building on a named brand's design system: trademark, trade dress and fonts | anti-pattern | trademark, trade-dress, brand-systems, fonts, licensing |
| DESIGN-040 | A copied DESIGN.md is instruction text: read it like a skill | anti-pattern | prompt-injection, supply-chain, design-md, typeui |
| DESIGN-041 | When to cast a shadow, and the shadow rule to give Claude | recommendation | shadows, elevation, cards, overlap, rules |
| DESIGN-042 | A shadow scale as tokens: levels and values by design system | comparison | shadows, elevation, tokens, dtcg, tailwind |
| DESIGN-043 | Elevation in dark mode: lighter surfaces, a hairline, a stronger shadow | comparison | shadows, elevation, dark-mode, surfaces |
| DESIGN-044 | Shadows in forced colours and WCAG: give every shadow an edge that stays | fact | shadows, forced-colors, wcag, focus, accessibility |
| DESIGN-045 | `box-shadow` or `drop-shadow()`, and what clips or prints them | fact | shadows, drop-shadow, filter, print, overflow |

## Docker images for Node apps (`topics/kb-docker-node.md`, DOCKER)

| ID | Title | Type | Tags |
|---|---|---|---|
| DOCKER-001 | Official `node` image tags on 2026-10-17: what each points to, and sizes | fact | node-image, alpine, slim, lts, image-size |
| DOCKER-002 | Alpine and musl: Node's support tier and native modules | fact | alpine, musl, native-modules, sharp, arm64 |
| DOCKER-003 | Distroless, Docker Hardened Images and Chainguard for Node | comparison | distroless, docker-hardened-images, chainguard, nonroot |
| DOCKER-004 | Choosing a base image for a Node 24/26 server | recommendation | base-image, alpine, slim, distroless |
| DOCKER-005 | Multi-stage Dockerfile for a bundled Angular SSR or NestJS server | pattern | dockerfile, multi-stage, angular-ssr, nestjs |
| DOCKER-006 | npm inside the image: `NODE_ENV`, `--omit=dev`, cache mounts, npm 12 scripts | fact | npm-ci, omit-dev, node-env, cache-mount |
| DOCKER-007 | `.dockerignore` and build secrets | fact | dockerignore, build-context, secrets, build-args |
| DOCKER-008 | Non-root user and PID 1: signals and `runAsNonRoot` | fact | non-root, pid-1, sigterm, tini |
| DOCKER-009 | Pin the base image by digest and let Dependabot bump it | recommendation | digest-pinning, dependabot, base-image |
| DOCKER-010 | Image size and startup: what actually changes start time | fact | image-size, startup, compile-cache, heap |
| DOCKER-011 | SBOM and provenance attestations: buildx and build-push-action defaults | fact | provenance, sbom, slsa, attestations, buildx |
| DOCKER-012 | Signing images: cosign keyless or GitHub artifact attestations | comparison | cosign, sigstore, artifact-attestations, signing |
| DOCKER-013 | What Flux verifies, and where a workload image check lives | fact | flux, verification, admission-controller, cosign |
| DOCKER-014 | Build cache in GitHub Actions: `type=gha`, its limits and read-only triggers | fact | build-cache, gha-cache, build-push-action, workflow-run |
| DOCKER-015 | Multi-arch images: QEMU, native arm64 runners or Docker's GitHub Builder | comparison | multi-arch, arm64, qemu, github-builder |

## Repo documentation: changelogs, READMEs, decision records and drift (`topics/kb-documentation.md`, DOC)

| ID | Title | Type | Tags |
|---|---|---|---|
| DOC-001 | Keep a Changelog 2.0.0: what changed from 1.1.0 | fact | changelog, keep-a-changelog, spec |
| DOC-002 | Curate, don't accumulate: notable changes only | fact | changelog, curation, dependencies |
| DOC-003 | The brief for an LLM-drafted changelog belongs in CLAUDE.md | recommendation | changelog, claude-md, llm |
| DOC-004 | Changelogs without version numbers | fact | changelog, dates, continuous-deploy |
| DOC-005 | Common Changelog: a stricter subset | comparison | changelog, common-changelog, style |
| DOC-006 | Generated changelogs and host release notes | comparison | changelog, conventional-commits, release-please, release-notes |
| DOC-007 | How Anthropic writes its own changelogs | fact | changelog, anthropic, examples |
| DOC-008 | Enforcing changelog entries in CI | comparison | changelog, ci, github-actions, hooks |
| DOC-009 | What Anthropic's docs say about repo docs beyond CLAUDE.md | fact | readme, docs, claude-md, official |
| DOC-010 | Official skills and plugins for documentation | tool | skills, plugins, doc-coauthoring |
| DOC-011 | Decision records: Nygard, MADR and one log or many files | comparison | adr, madr, decisions |
| DOC-012 | What a README should contain | fact | readme, standard-readme, github, diataxis |
| DOC-013 | Google's rules: same change, small and fresh, delete dead docs | recommendation | freshness, drift, google |
| DOC-014 | Mechanical checks: Markdown lint, link check, Prettier, Vale | comparison | markdownlint, lychee, prettier, vale, ci |
| DOC-015 | Agents that detect or fix doc drift | pattern | drift, routines, claude-code-action, refresh-md-files |
| DOC-016 | Writing docs that agents retrieve | recommendation | retrieval, headings, agents |
| DOC-017 | Our repos' docs on 2026-10-13 | fact | our-setup, inventory, survey |
| DOC-018 | Our changelog conventions and where they deviate | comparison | our-setup, changelog, deviations |
| DOC-019 | One rule in three files drifts apart | anti-pattern | our-setup, changelog, reviewer, duplication |
| DOC-020 | Cross-file rules keep paired docs current | pattern | our-setup, reviewer, drift |
| DOC-021 | A dated decision log in one file | pattern | our-setup, decisions, adr |
| DOC-022 | Plan docs with a dated status and a delete condition | pattern | our-setup, plans, expiry |
| DOC-023 | Runbooks in `docs/` or in a skill | comparison | our-setup, runbooks, skills |
| DOC-024 | Our weekly docs-drift routine: first runs | fact | our-setup, drift, routines, refresh-md-files |

## Type design pipeline and web font delivery (`topics/kb-fonts.md`, FONT)

| ID | Title | Type | Tags |
|---|---|---|---|
| FONT-001 | Source formats: UFO 3 is current, UFO 4 isn't published, Glyphs files go through glyphsLib | fact | ufo, glyphs, glyphslib, sources |
| FONT-002 | Designspace 5: discrete axes, `<variable-fonts>` and axis labels | fact | designspace, variable-fonts, stat, fontmake |
| FONT-003 | fontc 1.0.0: what it builds and what it doesn't | fact | fontc, fontmake, compiler, rust |
| FONT-004 | fontc or fontmake for nine static weights and a variable font | comparison | fontc, fontmake, static-instances, designspace |
| FONT-005 | ufo2ft writes `kern`, `mark` and `mkmk` from groups and anchors | pattern | ufo2ft, feature-writers, kerning, anchors |
| FONT-006 | `varLib.instancer`: static fonts and narrower axes from a variable font | tool | fonttools, instancer, variable-fonts, static-instances |
| FONT-007 | Check master compatibility with `varLib.interpolatable` | tool | fonttools, interpolation, masters, qa |
| FONT-008 | gftools builder and the Google Fonts project template | tool | gftools, builder, google-fonts, template |
| FONT-009 | Writing OpenType feature code: the parts a family needs | pattern | opentype-features, fea, kern, ss01 |
| FONT-010 | Compile-check feature code with `fonttools feaLib` | pattern | fea, fealib, validation, ci |
| FONT-011 | Hinting static fonts: ttfautohint for TTF, `otfautohint` for OTF | recommendation | hinting, ttfautohint, otfautohint, afdko |
| FONT-012 | Leave variable fonts unhinted | recommendation | hinting, variable-fonts, vtt, gftools |
| FONT-013 | The `gasp` table for hinted and unhinted fonts | fact | gasp, hinting, opentype-spec |
| FONT-014 | Fontspector replaces Font Bakery: profiles and install | comparison | fontspector, fontbakery, qa, profiles |
| FONT-015 | Running Fontspector in CI | pattern | fontspector, ci, github-actions, qa |
| FONT-016 | Release layout: which formats, folders and file names | recommendation | release, woff2, variable-fonts, file-names |
| FONT-017 | Version fields: `head.fontRevision`, name ID 5 and UFO `versionMinor` | fact | versioning, name-table, head-table, ufo2ft |
| FONT-018 | The OFL, Reserved Font Names and web subsets | fact | ofl, license, reserved-font-name, subsetting |
| FONT-019 | Subsetting with `pyftsubset`: its defaults drop features | anti-pattern | pyftsubset, subsetting, woff2, opentype-features |
| FONT-020 | `unicode-range` slices and preloading a font | pattern | unicode-range, preload, google-fonts, crossorigin |
| FONT-021 | `font-display` and its effect on LCP and CLS | recommendation | font-display, lcp, cls, web-performance |
| FONT-022 | Fallback metric overrides and `font-size-adjust`: what's Baseline | fact | size-adjust, ascent-override, font-size-adjust, cls |
| FONT-023 | Variable-font and OpenType-feature CSS: use the high-level properties | recommendation | variable-fonts, font-weight, font-variation-settings, font-variant-numeric |
| FONT-024 | What Claude can and can't do in type design | fact | claude, type-design, fea, glif |
| FONT-025 | Straight edges in whole-unit outlines: nodes and handles on whole steps | pattern | outlines, glif, rounding, masters |
| FONT-026 | Place extrapolated masters by measured stem, not by weight number | recommendation | extrapolation, masters, designspace, stems |
| FONT-027 | Derived thin weights: set stroke thickness first, then fix joins by moving whole strokes | pattern | extrapolation, thin, contrast, joins |
| FONT-028 | Keep derived-weight fixes in a recipe and re-run it after every derivation | pattern | extrapolation, recipe, regeneration, masters |
| FONT-029 | At extreme weights the master's small faults show | fact | extrapolation, crossings, counters, black |
| FONT-030 | A stroke that passes under another is one stroke | pattern | outlines, crossings, centre-line, overlaps |
| FONT-031 | Build a derived glyph the way it is drawn: ¢ as c plus a bar | pattern | outlines, boolean, union, compatibility |
| FONT-032 | Judge derived weights filled and large, beside the nearest master | recommendation | proofing, review, symmetry, extrapolation |
| FONT-033 | Measure stroke width two ways: inscribed disc and rays square to the edge | pattern | stroke-width, medial-axis, measurement, outlines |
| FONT-034 | A straight edge into a curve: continue the edge with the first handle, then let the curvature rise gently | pattern | outlines, curvature, g2, joins |
| FONT-035 | A smooth node needs one handle ratio in every master, or the weights between kink | pattern | interpolation, kinks, masters, interpolatable |
| FONT-036 | Static instances round every point: short handles on straight edges bend at in-between weights | fact | static-instances, rounding, fontmake, cff |
| FONT-037 | Letters collide at an extrapolated heavy weight without any kerning: check clearance, not kern values | fact | kerning, collisions, extrapolation, black |
| FONT-038 | A clearance floor for a derived weight must hold at every built weight between the masters | recommendation | kerning, collisions, static-instances, rounding |
| FONT-039 | Re-deriving a derived master's kerning from the drawn masters drops the room it was given | anti-pattern | kerning, extrapolation, recipe, fontmath |
| FONT-040 | Check a master edit at the built weights between the masters: one construction in every master | pattern | interpolation, masters, compatibility, proofing |
| FONT-041 | Repair a spot by copying the nearest master's shape over it, not by rebuilding the glyph | pattern | outlines, repair, transform, extrapolation |
| FONT-042 | A part scaled down to fit inside a heavier ring gets lighter than its sibling | fact | scaling, stems, composites, black |
| FONT-043 | Measuring outlines in a script: flatten curves, fill nonzero, skip glyph 0 | pattern | measurement, winding, notdef, harfbuzz |

## GitHub Actions: changes and hardening (`topics/kb-github-actions.md`, GHA)

| ID | Title | Type | Tags |
|---|---|---|---|
| GHA-001 | Runner labels on 2026-10-17, and `ubuntu-latest` moving to Ubuntu 26.04 | fact | runners, ubuntu-26-04, ubuntu-latest, shellcheck |
| GHA-002 | `ubuntu-slim` and arm64 standard runners: specs, limits, when to use | fact | runners, ubuntu-slim, arm64 |
| GHA-003 | Node 20 is gone from the runners: `node20` actions are forced onto Node 24 | fact | node-24, node20, deprecation, runners |
| GHA-004 | Core action majors on 2026-10-17: checkout v7, setup-node v7, cache v6, artifacts v7 and v8 | fact | actions-checkout, actions-cache, artifacts, upgrades |
| GHA-005 | setup-node v5 to v7: automatic npm caching, ESM, no dummy `NODE_AUTH_TOKEN` | fact | setup-node, caching, publishing |
| GHA-006 | Workflow syntax added since 2025: parallel steps, `$/`, `cache-mode`, `queue`, `case()` | fact | syntax, parallel-steps, concurrency, expressions |
| GHA-007 | Limits and retention that changed in 2025–2026 | fact | limits, retention, cache, reruns |
| GHA-008 | CI for agent-driven PRs: cancel superseded runs, cache dependencies, keep required checks reporting | pattern | concurrency, required-checks, caching, agents |
| GHA-009 | Pinning actions: tag, full SHA, immutable release or lockfile | comparison | pinning, sha-pinning, supply-chain, policy |
| GHA-010 | Workflow lockfiles with `gh actions-lock` (public preview) | tool | lockfile, gh-actions-lock, pinning |
| GHA-011 | Immutable releases: what they lock, and why a tag still isn't a SHA pin | fact | immutable-releases, attestations, pinning |
| GHA-012 | Dependabot for action pins: what it updates, skips and doesn't alert on | fact | dependabot, pinning, composite-actions, lockfile |
| GHA-013 | `GITHUB_TOKEN` permissions: defaults, the `permissions` key and what the token can't start | recommendation | github-token, permissions, least-privilege |
| GHA-014 | GitHub App installation tokens: when, how to scope, and the 520-character format | fact | github-app, tokens, create-github-app-token |
| GHA-015 | OIDC to AWS: trust policy conditions and `configure-aws-credentials` v6 | recommendation | oidc, aws, iam, trust-policy |
| GHA-016 | Immutable OIDC `sub` claims: which repos send them, and moving a trust policy over | fact | oidc, sub-claim, aws, trust-policy |
| GHA-017 | `pull_request_target` and `workflow_run`: what GitHub changed from 2025-12 to 2026-11 | fact | pull-request-target, workflow-run, forks, checkout |
| GHA-018 | When `pull_request_target` or `workflow_run` is still safe | recommendation | pull-request-target, workflow-run, pwn-request |
| GHA-019 | Cache poisoning, read-only cache tokens and `cache-mode` | fact | cache, cache-poisoning, cache-mode |
| GHA-020 | Script injection and secrets: untrusted input goes through `env:` | recommendation | script-injection, secrets, redaction |
| GHA-021 | Fork PR approvals and workflow execution protections | fact | fork-prs, approvals, actions-policies, execution-protections |
| GHA-022 | npm trusted publishing: the workflow side | recommendation | npm, trusted-publishing, oidc, provenance |
| GHA-023 | Workflow linters and hardening tools: zizmor, actionlint, CodeQL, harden-runner, Scorecard | comparison | zizmor, actionlint, codeql, harden-runner, scorecard |
| GHA-024 | Incidents 2024–2026 and the control that would have stopped each | fact | incidents, tj-actions, ultralytics, tanstack, supply-chain |
| GHA-025 | Rolling out zizmor: the findings every repo gets, and inline ignores | pattern | zizmor, artipacked, dependabot-cooldown, dangerous-triggers, inline-ignores |

## GitHub through `gh` and the API: issues, rulesets, releases, Copilot cloud agent (`topics/kb-github.md`, GH)

| ID | Title | Type | Tags |
|---|---|---|---|
| GH-001 | Sub-issues, dependencies and issue types in `gh` 2.94+: flags and JSON fields | fact | gh, sub-issues, issue-dependencies, issue-types |
| GH-002 | The REST API for sub-issues and dependencies: numeric `id`s, limits, same owner | fact | rest-api, sub-issues, issue-dependencies, cloud |
| GH-003 | Issue types belong to organizations; "Relates to" links | fact | issue-types, personal-repos, relates-to |
| GH-004 | Rulesets against branch protection: what differs, and plan availability | comparison | rulesets, branch-protection, plans |
| GH-005 | A ruleset for a solo-maintainer public repo with agents | recommendation | rulesets, bypass, required-checks, gh-ruleset |
| GH-006 | `gh release create` pitfalls: auto-created tags, latest, empty releases | fact | releases, gh-release, tags |
| GH-007 | Generated release notes and `.github/release.yml` | fact | releases, release-notes, labels |
| GH-008 | Publishing to an immutable release: draft, upload, publish | pattern | immutable-releases, gh-release, assets |
| GH-009 | Which `gh` commands fail with which token or surface, and the REST fallbacks | fact | gh, fine-grained-pat, github-app, cloud, graphql |
| GH-010 | The Projects (classic) error in `gh pr edit` and `gh issue edit` | fact | gh, projects-classic, deprecation |
| GH-011 | `gh` for coding agents: agent detection, full help, telemetry, the `gh` skill | fact | gh, agents, telemetry, worktrees |
| GH-012 | GitHub MCP server v2 against `gh` for an agent | comparison | github-mcp-server, mcp, gh, context-cost |
| GH-013 | Copilot cloud agent against Claude Code and `claude-code-action` | comparison | copilot, cloud-agent, claude-code-action |
| GH-014 | GitHub Agentic Workflows (gh-aw) and the ideas worth borrowing | tool | gh-aw, agentic-workflows, safe-outputs, firewall |

## Hooks (`topics/kb-hooks.md`, HOOK)

| ID | Title | Type | Tags |
|---|---|---|---|
| HOOK-001 | Session, turn and tool-loop events | fact | events, reference |
| HOOK-002 | Agent, environment and lifecycle events | fact | events, reference |
| HOOK-003 | Common input fields and hook environment variables | fact | input, env |
| HOOK-004 | Exit codes and stdout: how a run resolves | fact | exit-codes, output |
| HOOK-005 | JSON output fields and the 10,000-character cap | fact | json, output, limits |
| HOOK-006 | PreToolUse decisions and how they meet permission rules | fact | pretooluse, permissions |
| HOOK-007 | `additionalContext`: where it lands and how to word it | pattern | context, output |
| HOOK-008 | SessionStart outputs and `CLAUDE_ENV_FILE` | fact | sessionstart, env |
| HOOK-009 | The five handler types and which events take them | comparison | handler-types |
| HOOK-010 | Prompt and agent hooks: behaviour and cost | fact | prompt-hooks, agent-hooks, cost |
| HOOK-011 | Async and `asyncRewake` hooks | fact | async, background |
| HOOK-012 | Timeouts per handler type and event | fact | timeouts, limits |
| HOOK-013 | Hooks fail open by default; `onFailure: "block"` | fact | failure, reliability |
| HOOK-014 | Parallel runs, deduplication and combined decisions | fact | ordering, parallel |
| HOOK-015 | The cost of a hook on every tool call | fact | cost, latency, measurement |
| HOOK-016 | Where hooks are defined | fact | locations, plugins, settings |
| HOOK-017 | Hooks by surface: terminal, desktop, cloud, `-p`, action, SDK | comparison | surfaces, desktop, cloud |
| HOOK-018 | Matcher syntax | fact | matchers |
| HOOK-019 | The `if` field: filtering on tool arguments | fact | if, matchers, bash |
| HOOK-020 | Hooks in skill and agent frontmatter | fact | frontmatter, skills, agents |
| HOOK-021 | `/hooks`, live reload and switching hooks off | tool | hooks-menu, disable, managed |
| HOOK-022 | Debug log for hooks | tool | debugging |
| HOOK-023 | Testing a hook script on its own | pattern | testing, debugging |
| HOOK-024 | Why a hook silently does nothing | anti-pattern | debugging, pitfalls |
| HOOK-025 | Hooks run with your permissions; trust and `-p` | fact | security, trust |
| HOOK-026 | Hooks read untrusted input and are not a security boundary | recommendation | security, injection |
| HOOK-027 | Pattern: format or lint after an edit | pattern | format, posttooluse |
| HOOK-028 | Pattern: block dangerous commands and protected files | pattern | safety, pretooluse |
| HOOK-029 | Pattern: context at SessionStart, after compaction, before compaction | pattern | sessionstart, compaction |
| HOOK-030 | Pattern: notifications | pattern | notification, stop |
| HOOK-031 | Pattern: Stop hooks that keep Claude working | pattern | stop, loops |
| HOOK-032 | Community hook collections worth reading | tool | community, collections |
| HOOK-033 | Hook anti-patterns | anti-pattern | pitfalls, performance |
| HOOK-034 | Hooks in other coding agents | comparison | cursor, codex, gemini, copilot |
| HOOK-035 | Plugin mods versus settings hooks | fact | mods, plugins |
| HOOK-036 | Our hooks today (osrs-tracker repos, user settings) | fact | our-setup, osrs-tracker |

## Agents with cloud and cluster access (`topics/kb-infra-agents.md`, INFRA)

| ID | Title | Type | Tags |
|---|---|---|---|
| INFRA-001 | What Anthropic and AWS say about cloud credentials for agents | fact | least-privilege, identity, aws |
| INFRA-002 | Isolation for infrastructure work: dev containers, cloud sessions, the sandbox | comparison | devcontainer, cloud-sessions, sandbox |
| INFRA-003 | The AWS MCP Server: tools, read-only mode and IAM context keys | tool | aws, mcp, iam |
| INFRA-004 | kubernetes-mcp-server: read-only, denied resources and output | tool | kubernetes, mcp, read-only |
| INFRA-005 | Flux MCP server: read-only, secret masking and filters | tool | flux, mcp, gitops |
| INFRA-006 | What a server or a credential enforces that Bash rules can't | fact | mcp, rbac, iam, permissions |
| INFRA-007 | Output size: MCP filters versus CLI output | recommendation | mcp, tokens, output |
| INFRA-008 | Permission rules for `aws`, `kubectl`, `helm` and `terraform` | fact | permissions, bash, cloud-cli |
| INFRA-009 | Auto mode's built-in rules for cloud and cluster actions | fact | auto-mode, classifier, infra |
| INFRA-010 | Telling auto mode which infrastructure is production | recommendation | auto-mode, environment, settings |
| INFRA-011 | The sandbox with cloud CLIs, and AWS credential masking | tool | sandbox, credentials, sigv4 |
| INFRA-012 | Guard hooks for destructive infrastructure commands | pattern | hooks, pretooluse, safety |
| INFRA-013 | Plan and apply split with human approval | pattern | terraform, approval, ci |
| INFRA-014 | GitOps: the agent opens a PR, Flux applies it | pattern | gitops, flux, pr |
| INFRA-015 | Dry-run and diff commands before any change | fact | dry-run, diff, kubectl, terraform |
| INFRA-016 | AWS audit trail: CloudTrail and attributing agent actions | fact | cloudtrail, audit, aws |
| INFRA-017 | Kubernetes audit logs and Claude Code's own records | fact | audit, kubernetes, otel, hooks |
| INFRA-018 | Reading logs and events with filters during an incident | pattern | logs, incidents, mcp |
| INFRA-019 | A read-only subagent that digests logs | pattern | subagents, logs, incidents |
| INFRA-020 | AWS credentials: profiles, short-lived sessions and Claude Code's AWS settings | fact | credentials, sso, sts, settings |
| INFRA-021 | How credentials leak into transcripts, environments and telemetry | fact | credentials, transcripts, otel, env |
| INFRA-022 | Published incidents: agents that destroyed infrastructure or data | fact | incidents, terraform, databases |
| INFRA-023 | Which guardrail would have stopped each incident | recommendation | incidents, guardrails |
| INFRA-024 | Our setup: AWS, Kubernetes and MCP access as of 2026-10-12 | fact | our-setup, aws, kubernetes, mcp |
| INFRA-025 | `kubectl auth can-i` reads `resource/x` as a resource name, not a subresource | anti-pattern | kubernetes, rbac, kubectl, testing |
| INFRA-026 | Before changing a config value, read the code that consumes it | pattern | config, lambda, retries, issues |
| INFRA-027 | Change one Lambda environment variable without printing the others | pattern | lambda, env, credentials, transcripts |
| INFRA-028 | The claude.ai Grafana Cloud connector: what it can and can't write | fact | grafana-cloud, connectors, alerting, permissions |

## Node/TS lint, format and build tools (`topics/kb-js-lint-build.md`, JSTOOL)

| ID | Title | Type | Tags |
|---|---|---|---|
| JSTOOL-001 | ESLint 10: what changed from 9 | fact | eslint, eslint-10, migration, flat-config |
| JSTOOL-002 | ESLint 10's CLI: formatters, exit codes, cache and suppressions | tool | eslint, cli, formatters, cache, suppressions |
| JSTOOL-003 | typescript-eslint typed linting: setup and cost | fact | typescript-eslint, typed-linting, projectservice, performance |
| JSTOOL-004 | typescript-eslint 8.71: ESLint 10, `defineConfig` and TypeScript 7 | fact | typescript-eslint, eslint-10, defineconfig, typescript-7 |
| JSTOOL-005 | angular-eslint 22: flat config, ESLint 10 and opt-in typed linting | fact | angular-eslint, angular, eslint-10, typed-linting |
| JSTOOL-006 | Oxlint 1.x: what it covers and what moving from ESLint loses | tool | oxlint, eslint, migration, angular |
| JSTOOL-007 | Oxlint's type-aware linting with tsgolint | tool | oxlint, tsgolint, typed-linting, typescript-go |
| JSTOOL-008 | Oxlint switches to its `agent` output format under Claude Code | fact | oxlint, agent-output, claude-code, formatters |
| JSTOOL-009 | Biome 2: one tool for lint and format, and its limits | tool | biome, prettier, eslint, gritql |
| JSTOOL-010 | ESLint, Oxlint or Biome for a TypeScript repo | comparison | eslint, oxlint, biome, angular, nestjs |
| JSTOOL-011 | Prettier 3.9: status and config pitfalls | fact | prettier, angular, configuration, eslint-config-prettier |
| JSTOOL-012 | oxfmt: a beta Prettier-compatible formatter | tool | oxfmt, prettier, formatter, oxc |
| JSTOOL-013 | knip 6: unused files, exports and dependencies | tool | knip, unused-code, dependencies, reporters |
| JSTOOL-014 | Vite 8: Rolldown, Oxc and Lightning CSS replace esbuild and Rollup | fact | vite, vite-8, rolldown, oxc, migration |
| JSTOOL-015 | Rolldown 1.0 and tsdown; tsup unmaintained | fact | rolldown, tsdown, tsup, library-bundling |
| JSTOOL-016 | esbuild 0.x: minor versions break, and it never type-checks | fact | esbuild, pinning, type-checking, decorators |
| JSTOOL-017 | Angular 22's build: esbuild, Vite for the dev server, Rolldown for chunks | fact | angular, esbuild, vite, rolldown, build |
| JSTOOL-018 | NestJS 12's `nest build`: tsc by default, rspack new, webpack deprecated | fact | nestjs, nest-cli, rspack, swc, type-checking |
| JSTOOL-019 | Rspack 2 and Rsbuild 2 | fact | rspack, rsbuild, webpack, build |
| JSTOOL-020 | Short, machine-readable output from lint and build tools | comparison | agent-output, eslint, oxlint, biome, knip, angular, vite |
| JSTOOL-021 | Picking a build tool: Angular, Nest, apps, libraries and scripts | comparison | vite, rolldown, tsdown, esbuild, rspack, angular, nestjs |

## Testing Node/TS code, and tests written by agents (`topics/kb-js-testing.md`, JSTEST)

| ID | Title | Type | Tags |
|---|---|---|---|
| JSTEST-001 | Vitest 5.0: the breaking changes agents trip over | fact | vitest, vitest-5, migration, mocks |
| JSTEST-002 | Vitest 4.0: breaking changes from 3.x, and the upgrade path | fact | vitest, vitest-4, migration, coverage |
| JSTEST-003 | Vitest 5's file-system module cache can test stale code | fact | vitest, vitest-5, cache, angular |
| JSTEST-004 | Angular's `unit-test` builder: options, defaults and what it overrides | fact | angular, unit-test-builder, vitest, configuration |
| JSTEST-005 | jsdom, happy-dom or browser mode under Angular's builder, and `vi.mock` | fact | angular, jsdom, happy-dom, browser-mode, mocks |
| JSTEST-006 | The Jasmine-to-Vitest refactor: what it leaves for you | fact | angular, jasmine, vitest, migrations |
| JSTEST-007 | NestJS 12: Vitest for ESM projects, Jest for CommonJS, and moving a suite | comparison | nestjs, vitest, jest, esm, migration |
| JSTEST-008 | Nest's dependency injection under Vitest 5 without `unplugin-swc` | fact | nestjs, vitest, decorators, oxc, swc |
| JSTEST-009 | Jest 30: experimental ESM, `require(esm)` and upgrade traps | fact | jest, esm, ts-jest, migration |
| JSTEST-010 | Playwright 1.64: flakiness controls and defaults | fact | playwright, e2e, flakiness, retries |
| JSTEST-011 | Playwright against an SSR app: `webServer`, `baseURL` and server HTML | pattern | playwright, ssr, webserver, e2e |
| JSTEST-012 | Playwright in an agent's loop: tests, Test Agents, MCP or CLI | comparison | playwright, agents, mcp, reporters |
| JSTEST-013 | Coverage doesn't show whether tests catch bugs; mutation testing does | fact | coverage, mutation-testing, agent-tests |
| JSTEST-014 | StrykerJS 10 with Vitest: setup, cost, and the Vitest 5 bug | tool | stryker, mutation-testing, vitest |
| JSTEST-015 | Feeding surviving mutants back to an agent | pattern | stryker, mutation-testing, agent-tests |
| JSTEST-016 | What agents get wrong in tests, and the checks that catch it | anti-pattern | agent-tests, mocks, reward-hacking, review |
| JSTEST-017 | Test-first with an agent: when it pays off | recommendation | tdd, agent-tests, workflow |

## Dependency upgrades and codemods in Node/TS repos (`topics/kb-js-upgrades.md`, JSUP)

| ID | Title | Type | Tags |
|---|---|---|---|
| JSUP-001 | Before a bump: versions, dates and peer ranges from the registry | recommendation | npm-view, npm-outdated, peer-dependencies, versions |
| JSUP-002 | npm overrides a peer range with only a warning in an existing repo | fact | peer-dependencies, eresolve, strict-peer-deps, npm-ls |
| JSUP-003 | Official migration tools on our stack, and what they leave to you | comparison | migrations, nest-upgrade, eslint-codemods, vitest, node-codemods |
| JSUP-004 | Codemod, type-aware rename or agent edit: which for which change | recommendation | codemods, refactoring, lsp, rename |
| JSUP-005 | ast-grep, ts-morph and jscodeshift: what each sees and how it runs | comparison | ast-grep, ts-morph, jscodeshift, codemods |
| JSUP-006 | Having an agent write and run a codemod | pattern | codemods, workflow, verification |
| JSUP-007 | What published LLM-assisted migrations did: Google, Airbnb, Anthropic | fact | llm-migrations, google, case-studies |
| JSUP-008 | Splitting a major upgrade into PRs | pattern | major-upgrades, pull-requests, commits |
| JSUP-009 | Verifying an upgrade: clean `npm ci`, `npm ls --all`, build and tests | recommendation | verification, npm-ci, clean-checkout |
| JSUP-010 | Deleting `package-lock.json` to fix an install | anti-pattern | lockfile, package-lock, npm-install |
| JSUP-011 | Resolving `package-lock.json` conflicts on rebase | pattern | lockfile, rebase, merge-conflicts |
| JSUP-012 | Dependabot options for npm and GitHub Actions | fact | dependabot, groups, cooldown, schedule |
| JSUP-013 | Dependabot auto-merge: GitHub's recipe and what it needs | recommendation | dependabot, auto-merge, fetch-metadata |
| JSUP-014 | Triaging a Dependabot PR | pattern | dependabot, triage, comment-commands |
| JSUP-015 | When the model's training predates the versions in use | recommendation | knowledge-cutoff, docs, llms-txt |

## Giving agents knowledge: retrieval, RAG, long context and curated knowledge bases (`topics/kb-knowledge-retrieval.md`, RETR)

| ID | Title | Type | Tags |
|---|---|---|---|
| RETR-001 | A knowledge base for agents is a compiled layer, not a search problem | pattern | essence, curation, compiled-knowledge |
| RETR-002 | Anthropic: start with agentic search, add semantic search only if needed | recommendation | agentic-search, rag, claude-code, context-engineering |
| RETR-003 | Claude Code dropped RAG and a local vector database | fact | claude-code, rag, history |
| RETR-004 | Contextual Retrieval: what it measured and what it means for curated entries | fact | contextual-retrieval, embeddings, bm25, reranking |
| RETR-005 | The contextual embeddings cookbook: Pass@k on 248 code queries | fact | cookbook, evaluation, pass-at-k |
| RETR-006 | claude.ai Projects switch to RAG near the context limit | fact | projects, claude-ai, rag-mode |
| RETR-007 | Retrieval building blocks in the Claude API | fact | api, search-results, citations, tool-search |
| RETR-008 | Context rot: more context lowers recall | fact | context-rot, long-context, nolima |
| RETR-009 | This knowledge base no longer fits in the prompt | fact | long-context, tokens, cost, measurement |
| RETR-010 | Seven retrieval options measured on this knowledge base | comparison | measurement, bm25, rerank, index-in-context |
| RETR-011 | Keyword search fails on reworded questions; let the model write the keywords | pattern | bm25, query-rewriting, vocabulary-mismatch |
| RETR-012 | The lookup says "no entry" for uncovered questions | fact | abstention, negatives, metrics |
| RETR-013 | How AI coding tools retrieve context | comparison | cursor, cline, codex, copilot, sourcegraph, augment |
| RETR-014 | Karpathy's LLM Wiki: an index file until hundreds of pages | pattern | llm-wiki, index-file, qmd, community |
| RETR-015 | GraphRAG answers global questions, not lookups | fact | graphrag, lightrag, knowledge-graph |
| RETR-016 | Hybrid search in a small Node server | tool | sqlite-vec, orama, voyage, rrf |
| RETR-017 | Published evidence on lexical, dense and long-context retrieval | comparison | beir, browsecomp-plus, self-route, lara |
| RETR-018 | Where knowledge-base lookups fail, in order | recommendation | failure-modes, triggering, staleness |
| RETR-019 | Evaluating retrieval for a knowledge base | recommendation | evaluation, recall, mrr, negatives |
| RETR-020 | Adding vector RAG before an eval shows misses | anti-pattern | rag, embeddings, premature |

## Small-cluster Kubernetes with Flux GitOps and Grafana/Prometheus observability (`topics/kb-kubernetes-flux.md`, KUBE)

| ID | Title | Type | Tags |
|---|---|---|---|
| KUBE-001 | Flux 2.8 and 2.9: what changed and what needs action | fact | flux, release-notes, upgrade, helm-v4 |
| KUBE-002 | Upgrading Flux across removed APIs with `flux migrate` | fact | flux, flux-migrate, api-versions, upgrade |
| KUBE-003 | Which Kubernetes minors Flux supports, and the 1.37 gap | fact | flux, kubernetes-versions, support-policy, release-cadence |
| KUBE-004 | helm-controller on Helm v4: server-side apply, kstatus and post-render defaults | fact | flux, helm-controller, helm-v4, server-side-apply |
| KUBE-005 | Flux Operator or `flux bootstrap` | comparison | flux, flux-operator, bootstrap, fluxinstance |
| KUBE-006 | ingress-nginx is retired; the Ingress API is frozen, not removed | fact | ingress-nginx, ingress, retirement, gateway-api |
| KUBE-007 | Gateway API 1.5 and 1.6: the Standard channel and how its CRDs install | fact | gateway-api, crds, listenerset, httproute |
| KUBE-008 | Replacing ingress-nginx on a single node: a Gateway API implementation or another Ingress controller | comparison | ingress-nginx, gateway-api, traefik, ingress2gateway |
| KUBE-009 | cert-manager with Gateway API, and its supported releases | fact | cert-manager, gateway-api, acme, http-01 |
| KUBE-010 | Let's Encrypt's 64- and 45-day certificates and other changes for cert-manager users | fact | lets-encrypt, cert-manager, certificate-lifetime, renewal |
| KUBE-011 | Prometheus 2 to 3: what breaks | fact | prometheus, migration, promql, lts |
| KUBE-012 | Loki 3 on a small setup: monolithic mode, TSDB and v13, and what 4.0 removes | fact | loki, upgrade, tsdb, monolithic |
| KUBE-013 | Promtail's end of life and `alloy convert` | fact | promtail, alloy, alloy-convert, logs |
| KUBE-014 | Alloy or the OpenTelemetry Collector for one small cluster | comparison | alloy, opentelemetry-collector, otlp, k8s-monitoring |
| KUBE-015 | Kubernetes release cadence, support period and version skew | fact | kubernetes-versions, version-skew, support-period, release-cadence |
| KUBE-016 | Upgrading a small kubeadm cluster: one minor at a time, gated by add-ons | pattern | kubeadm, upgrade, kubernetes-versions, add-ons |
| KUBE-017 | mongod 8.0 exits at startup on Ubuntu 26.04's 7.0 kernel until 8.0.35 | fact | mongodb, ubuntu-26-04, kernel, setarch |
| KUBE-018 | A one-member replica set behind a Service: `directConnection=true`, and when `authSource` matters | fact | mongodb, replica-set, connection-string, statefulset |
| KUBE-019 | A MongoDB keyFile from a Secret needs an initContainer to copy it | pattern | mongodb, keyfile, secrets, init-containers |
| KUBE-020 | Run a database's metrics exporter as its own Deployment, not a sidecar | pattern | mongodb, exporter, sidecar, labels |
| KUBE-021 | Alloy's `prometheus.exporter.mongodb`: a URI Go can't parse stops all of Alloy | fact | alloy, mongodb, exporter, config-errors |
| KUBE-022 | Moving a database from Atlas to the cluster with no data lost | pattern | mongodb, atlas, migration, flux-suspend |
| KUBE-023 | `envFrom`: when two Secrets set the same key, the last one listed wins | fact | envfrom, secrets, environment-variables, precedence |
| KUBE-024 | Grafana Cloud's free 10k series: one exporter can use most of them | pattern | grafana-cloud, active-series, alloy, relabel |
| KUBE-025 | `grafanacloud_instance_active_series` lags: count live series before cutting | fact | grafana-cloud, active-series, billing, promql |
| KUBE-026 | CrowdSec's Traefik bouncer 1.7.1 stops pulling bans on multi-CPU hosts; use 1.8.0 or later | fact | crowdsec, traefik, plugins, yaegi |
| KUBE-027 | Flannel or Calico on a single node | comparison | flannel, calico, cni, network-policy |
| KUBE-028 | A fresh Ubuntu 26.04 server: chrony, fwupd's hourly refresh and `adm` | fact | ubuntu-26-04, chrony, fwupd, journald |

## MCP servers: configuration, access control, surfaces and vetting (`topics/kb-mcp.md`, MCP)

| ID | Title | Type | Tags |
|---|---|---|---|
| MCP-001 | Installation scopes and which definition wins | fact | scopes, mcp-json, precedence |
| MCP-002 | Project `.mcp.json`: approval, workspace trust and headless runs | fact | mcp-json, trust, headless, approval |
| MCP-003 | Turning a server off: four different switches | fact | disable, deny, connectors |
| MCP-004 | Permission rules for MCP tools | fact | permissions, rules, tool-names |
| MCP-005 | Secrets in MCP config: `${VAR}` expansion and what reads as empty | fact | secrets, env, mcp-json |
| MCP-006 | Signing in to remote servers: OAuth from `/mcp` or the shell | fact | oauth, auth, remote |
| MCP-007 | `headersHelper`: short-lived tokens without OAuth | pattern | auth, headers-helper, trust |
| MCP-008 | Scope a server to one subagent with inline `mcpServers` | pattern | subagents, scoping, context |
| MCP-009 | Plugin-bundled MCP servers | fact | plugins, tool-names |
| MCP-010 | claude.ai connectors in Claude Code | fact | connectors, claude-ai, desktop |
| MCP-011 | Timeouts, reconnection and backgrounded tool calls | fact | timeouts, reconnect, background |
| MCP-012 | MCP startup and context cost in scripted runs | recommendation | headless, startup, tokens, strict-mcp-config |
| MCP-013 | Resources, prompts and elicitation | fact | resources, prompts, elicitation |
| MCP-014 | Client runtimes, protocol 2026-07-28 and supported features | fact | protocol, spec, list-changed |
| MCP-015 | Server-side knobs Claude Code reads | fact | server-authors, meta, schemas |
| MCP-016 | Managed MCP patterns and what a solo user can use | fact | managed, allowlist, denylist |
| MCP-017 | CLI, skill or MCP server? | comparison | architecture, cli, build-vs-adopt |
| MCP-018 | Designing a server: rules from `mcp-builder` | recommendation | server-authors, mcp-builder, tool-design |
| MCP-019 | Vetting a third-party server | recommendation | security, supply-chain, rug-pull |
| MCP-020 | Finding servers: Anthropic Directory and the MCP Registry | fact | discovery, registry, directory |
| MCP-021 | MCP in `claude-code-action` | fact | github-actions, ci, allowed-tools |
| MCP-022 | MCP in cloud sessions and routines | fact | cloud, routines, connectors |
| MCP-023 | Desktop app: which MCP config reaches a Code tab session | fact | desktop, wsl, claude-desktop-config |
| MCP-024 | Agent SDK: MCP servers, in-process tools and defaults | fact | agent-sdk, in-process, setting-sources |
| MCP-025 | Claude API MCP connector (`mcp_servers`) | fact | api, mcp-connector, beta |
| MCP-026 | `claude mcp serve`: Claude Code as an MCP server | tool | mcp-serve, desktop |
| MCP-027 | Channels: servers that push events into a session | fact | channels, push, research-preview |
| MCP-028 | Our MCP setup as of 2026-10-13 | fact | our-setup, connectors, inventory |
| MCP-029 | claude.ai custom connectors: who adds them, what the server needs, limits | fact | custom-connectors, claude-ai, remote, limits |
| MCP-030 | The OAuth flow Claude runs against a connector | fact | oauth, cimd, dcr, server-authors |
| MCP-031 | How Claude treats a connector's tools: annotations, names, structured results | fact | annotations, permissions, structured-content, server-authors |
| MCP-032 | Connector quirks reported by server authors: instructions, tool lists, saved approvals | fact | instructions, tool-list, permissions, community |
| MCP-033 | Testing and debugging a custom connector | pattern | testing, inspector, troubleshooting |
| MCP-034 | How docs and knowledge-base servers shape their tools | comparison | docs-servers, search-fetch, tool-design |
| MCP-035 | Hosting a single-user remote server: Cloudflare Worker or your own server | comparison | hosting, cloudflare, fastmcp, git-sync |
| MCP-036 | Mistakes single-user remote servers made | anti-pattern | security, oauth, community |
| MCP-037 | Using a private repo's knowledge without a checkout | comparison | connectors, plugins, surfaces, no-checkout |
| MCP-038 | Chat and cloud sessions use a custom connector only when the prompt points at it | fact | connectors, claude-ai, cloud, triggering |
| MCP-039 | One server as connector and user-scope entry: names, duplicates and cost per surface | fact | connectors, scopes, tool-names, tokens |
| MCP-040 | A plugin that bundles a connector with its skill makes chat use the connector unprompted | fact | connectors, plugins, claude-ai, triggering |
| MCP-041 | A search tool beat grepping a checkout for knowledge-base lookups | fact | search, measurement, tokens, no-checkout |

## Memory and instruction files (`topics/kb-memory.md`, MEM)

| ID | Title | Type | Tags |
|---|---|---|---|
| MEM-001 | Every place instructions and memory live | comparison | locations, claude-md, rules, auto-memory |
| MEM-002 | Load order: concatenated, broad to specific, no overrides | fact | load-order, precedence, conflicts |
| MEM-003 | What loads at launch, on demand, and after compaction | fact | lazy-loading, compaction, nested |
| MEM-004 | `.claude/rules/`: unscoped, `paths:`-scoped, user-level, symlinked | fact | rules, paths, globs |
| MEM-005 | `@` imports: paths, depth and the external-import dialog | fact | imports, approval |
| MEM-006 | `CLAUDE.local.md` and personal instructions across worktrees | pattern | claude-local, worktrees, personal |
| MEM-007 | Managed policy CLAUDE.md and `claudeMd` | fact | managed, org |
| MEM-008 | AGENTS.md: when Claude Code reads it | fact | agents-md, interop |
| MEM-009 | Switches: settings and env vars that change what loads | fact | settings, env-vars, bare |
| MEM-010 | How instructions and memory are delivered to the model | fact | system-prompt, delivery, user-message |
| MEM-011 | What subagents and forks get | fact | subagents, fork, explore, omitclaudemd |
| MEM-012 | Version history of memory and instruction loading | fact | changelog, versions |
| MEM-013 | Auto memory: what gets saved and in what format | fact | auto-memory, types, frontmatter |
| MEM-014 | Auto memory recall: index at start, topic files on demand | fact | auto-memory, recall, limits |
| MEM-015 | `/memory` and auditing what was saved | tool | memory-command, audit |
| MEM-016 | Turning auto memory off or moving it | fact | auto-memory, settings, disable |
| MEM-017 | What auto memory should and shouldn't hold | recommendation | auto-memory, placement |
| MEM-018 | Stale memories | anti-pattern | staleness, maintenance |
| MEM-019 | Memory as a prompt-injection vector | fact | security, poisoning |
| MEM-020 | `/init` and `CLAUDE_CODE_NEW_INIT` | tool | init, bootstrap |
| MEM-021 | `/doctor` trim and prompt audit for instruction files | tool | doctor, audit |
| MEM-022 | The `claude-md-management` plugin | tool | plugin, audit, revise |
| MEM-023 | When to update CLAUDE.md: Anthropic's triggers | recommendation | maintenance, triggers |
| MEM-024 | Community practice for keeping instruction files current | comparison | community, maintenance, drift |
| MEM-025 | Memory ideas from other coding tools | comparison | cline, cursor, copilot, windsurf, codex |
| MEM-026 | What each surface loads | comparison | surfaces, cloud, desktop, wsl, routines, github-actions |
| MEM-027 | Worktrees and instruction files | fact | worktrees, claude-md, auto-memory |
| MEM-028 | Agent SDK and `claude -p`: setting sources and memory | fact | agent-sdk, headless, setting-sources |
| MEM-029 | Cloud Projects memory is a separate store | fact | projects, cloud, memory |
| MEM-030 | The API memory tool | tool | api, memory-tool |
| MEM-031 | API memory tool, Managed Agents memory stores and auto memory compared | comparison | api, managed-agents, auto-memory |
| MEM-032 | Community memory servers and plugins | comparison | community, mcp, mem0, claude-mem, basic-memory |
| MEM-033 | Do memory servers beat plain files? | recommendation | community, evidence, cost |
| MEM-034 | Our instruction files and memory, measured | fact | our-setup, measurement |
| MEM-035 | Our auto memory: misplaced and stale entries | comparison | our-setup, auto-memory, staleness |

## NestJS 12 backends: Express 5, MongoDB driver 7 (`topics/kb-nestjs.md`, NEST)

| ID | Title | Type | Tags |
|---|---|---|---|
| NEST-001 | Nest 12.0.0: what changed, and the behaviour changes `nest upgrade` can't migrate | fact | nestjs, nest-12, migration, lifecycle-hooks, logging |
| NEST-002 | Node floors: running Nest 12 needs 20.19 or 22.12, the CLI needs 22.22.3, 24.15 or 26 | fact | nestjs, node-version, require-esm, nest-cli |
| NEST-003 | A CommonJS app can stay CommonJS on ESM-only Nest 12 | fact | nestjs, esm, commonjs, require-esm |
| NEST-004 | Bundling `node_modules` into a Nest 12 build: the CLI's lazy-import list misses `.js` | fact | nestjs, rspack, webpack, bundling, ignore-plugin |
| NEST-005 | What Nest 11 changed (2025-01): Express 5, Node 20, hook order, Keyv, config precedence | fact | nestjs, nest-11, migration, express-5, cache-manager |
| NEST-006 | `nest upgrade`: what the v12 schematic bumps, rewrites, reports and refuses | fact | nestjs, nest-upgrade, schematics, migration |
| NEST-007 | Standard Schema validation: the `schema` option and `StandardSchemaValidationPipe` | fact | nestjs, standard-schema, zod, validation, pipes |
| NEST-008 | class-validator or a Standard Schema library for a Nest 12 app | comparison | nestjs, class-validator, zod, standard-schema, nestjs-config |
| NEST-009 | Express 5 route paths in Nest: `*` needs a name, and the converter that hides it | fact | express-5, path-to-regexp, routing, wildcards, nestjs |
| NEST-010 | Express 5 behaviour a Nest app notices: flat `req.query`, `req.body`, async errors | fact | express-5, query-parser, body-parser, async-errors, nestjs |
| NEST-011 | Which Express a Nest 12 app runs: pinned 5.2.1, and where 5.3.0's security fixes come from | fact | express-5, express-4, security, transitive-dependencies, nestjs |
| NEST-012 | MongoDB Node driver 7.0: Node 20.19, removed options, `batchSize`, AWS auth | fact | mongodb, mongodb-driver-7, migration, bson |
| NEST-013 | MongoDB driver 7.1 to 7.7: server 4.4 floor in a minor, ESM bundles, `close()`, Mongoose 9 | fact | mongodb, mongoose, server-version, esm, bundling |
| NEST-014 | Nest on Lambda or in a container | comparison | nestjs, lambda, serverless, containers, cold-start |

## Node.js 24/26 runtime and the modern JS baseline (`topics/kb-nodejs.md`, NODE)

| ID | Title | Type | Tags |
|---|---|---|---|
| NODE-001 | Node release lines on 2026-10-17: Current, Active LTS, Maintenance | fact | release-schedule, lts, node-24, node-26 |
| NODE-002 | From Node 27: one major a year, every line LTS, and an Alpha channel | fact | release-schedule, node-27, alpha |
| NODE-003 | Running `.ts` files with plain `node`: type stripping by version | fact | typescript, type-stripping, tsconfig |
| NODE-004 | What type stripping rejects: enums, namespaces, parameter properties, decorators | fact | typescript, type-stripping, enums, decorators |
| NODE-005 | ts-node, tsx or plain `node` for TypeScript | comparison | ts-node, tsx, typescript |
| NODE-006 | `--env-file` instead of dotenv: format, precedence and what it lacks | fact | env-file, dotenv |
| NODE-007 | `--watch` instead of nodemon, and where it differs | fact | watch-mode, nodemon |
| NODE-008 | `node:test`: stable runner, experimental coverage and module mocks | fact | node-test, testing, coverage |
| NODE-009 | `node:sqlite` and the permission model: status and limits | fact | sqlite, permission-model, security |
| NODE-010 | `require(esm)` works, and `module.register()` is deprecated in 26 | fact | require-esm, esm, loaders, deprecation |
| NODE-011 | Language features on by default in Node 22, 24 and 26 | fact | temporal, javascript, v8, polyfills |
| NODE-012 | Removals and deprecations that hit app code on 25 and 26 | fact | breaking-changes, deprecation, node-26 |
| NODE-013 | Bundled undici: fetch versions, HTTP/2 on 26, and when to install undici | fact | undici, fetch, http2, proxy |
| NODE-014 | Pinning a repo's Node version: `.node-version`, `engines`, `devEngines`, setup-node | recommendation | node-version, engines, setup-node, types-node |
| NODE-015 | npm 12 and Corepack: neither ships with Node 24 or 26 | fact | npm-12, corepack |

## npm 12, packages and publishing (`topics/kb-npm.md`, NPM)

| ID | Title | Type | Tags |
|---|---|---|---|
| NPM-001 | npm versions on 2026-10-17, and getting npm 12 | fact | versions, dist-tags, npm-12, node |
| NPM-002 | What npm 12.0.0 changed | fact | npm-12, breaking-changes, allow-git, allow-remote |
| NPM-003 | What npm 11 changed, and what the 11.x line backported | fact | npm-11, breaking-changes, backports |
| NPM-004 | The `allowScripts` policy: what's blocked and how entries match | fact | allowScripts, install-scripts, supply-chain, node-gyp |
| NPM-005 | Approving install scripts: `npm install-scripts`, and the `approve-scripts` alias | fact | allowScripts, install-scripts, approve-scripts, commands |
| NPM-006 | Common packages with install scripts, and what blocking them costs | fact | allowScripts, esbuild, sharp, native-addons |
| NPM-007 | Version-pinned approvals stop matching after a bump | anti-pattern | allowScripts, dependabot, upgrades |
| NPM-008 | npm tokens since 2025-12-09: session and granular | fact | tokens, granular-tokens, 2fa, authentication |
| NPM-009 | Trusted publishing: what the registry requires | fact | trusted-publishing, oidc, publishing, npm-trust |
| NPM-010 | Staged publishing, stage-only tokens and publish-time scanning | fact | staged-publishing, stage-only-tokens, malware-scanning |
| NPM-011 | What CI should use to install and to publish | recommendation | ci, tokens, trusted-publishing, publishing |
| NPM-012 | Provenance: what it proves, and `npm audit signatures` | fact | provenance, sigstore, audit-signatures, supply-chain |
| NPM-013 | `npm audit` in CI: what it checks and how to gate it | recommendation | npm-audit, vulnerabilities, ci |
| NPM-014 | Ship new packages ESM-only | recommendation | esm, require-esm, packaging, exports |
| NPM-015 | `exports` with types for ESM-only and dual packages, and how to check them | pattern | exports, types, dual-package, publint, attw |
| NPM-016 | `npm ci` vs `npm install`, and lockfile v3 | fact | npm-ci, lockfile, package-lock |
| NPM-017 | Optional platform packages missing from a lockfile made on another OS | anti-pattern | optional-dependencies, lockfile, cross-platform, native-binaries |
| NPM-018 | `overrides`, `packageExtensions` and `npm patch` | fact | overrides, packageExtensions, npm-patch, transitive-dependencies |
| NPM-019 | Peer dependency conflicts: ERESOLVE, `--legacy-peer-deps` and `--force` | fact | peer-dependencies, eresolve, legacy-peer-deps |
| NPM-020 | npm 12 or pnpm for a handful of small repos | comparison | pnpm, package-managers, worktrees |
| NPM-021 | Installing Claude Code with npm 12: allow its postinstall | fact | claude-code, install, allowScripts, global-install |

## Open Graph images with satori and resvg (`topics/kb-og-images.md`, OG)

| ID | Title | Type | Tags |
|---|---|---|---|
| OG-001 | satori 0.37 to 0.42: browser layout defaults, and release notes that skip them | fact | satori, breaking-changes, taffy, box-sizing, upgrades |
| OG-002 | What satori 0.62 lays out and draws, and what throws | fact | satori, css, grid, stylesheets, colors |
| OG-003 | satori's fonts: four static formats, no variable fonts | fact | satori, fonts, woff2, variable-fonts, instancer |
| OG-004 | Vercel's and Next.js's OG docs describe an older satori | fact | vercel-og, next-og, imageresponse, satori, docs-drift |
| OG-005 | SVG to PNG: resvg-js, resvg-wasm or sharp | comparison | resvg-js, resvg-wasm, sharp, librsvg, bundling, webp |
| OG-006 | Open Graph and X card tags, and X's missing docs | fact | open-graph, twitter-card, og-image, ogp |
| OG-007 | Image limits and preview caches per platform | fact | og-image, image-size, caching, facebook, x, linkedin, discord, slack |
| OG-008 | Google's use of `og:image`: preferred image, Discover and `max-image-preview` | fact | google, discover, max-image-preview, og-image |
| OG-009 | Build time or on request in an SSR app, and caching the card | recommendation | build-time, ssr, cache-control, cache-busting, cors |

## Orchestration, parallelization and model selection (`topics/kb-orchestration.md`, ORCH)

| ID | Title | Type | Tags |
|---|---|---|---|
| ORCH-001 | The five native ways to run agents in parallel | comparison | claude-code, subagents, agent-view, agent-teams, workflows, projects |
| ORCH-002 | Defining subagents: locations and frontmatter | fact | claude-code, subagents, config |
| ORCH-003 | Subagent model resolution order | fact | model-selection, precedence, env-vars |
| ORCH-004 | Subagent effort resolution order | fact | effort, precedence |
| ORCH-005 | Built-in agents and their models: Explore is not Haiku | fact | explore, haiku, built-in-agents |
| ORCH-006 | Concurrency, nesting and background defaults | fact | limits, nesting, background, fork-mode |
| ORCH-007 | What a subagent sees and what it returns | fact | context, results, resume |
| ORCH-008 | Forked subagents vs fresh subagents | fact | fork, context |
| ORCH-009 | Worktree isolation for parallel writers | tool | worktrees, isolation, git |
| ORCH-010 | Agent teams (experimental) | tool | agent-teams, cost, pitfalls |
| ORCH-011 | Dynamic workflows | tool | workflows, ultracode, scale |
| ORCH-012 | `/batch` for one large change | tool | batch, worktrees |
| ORCH-013 | Agent view and background sessions | tool | agent-view, background, quota |
| ORCH-014 | Headless fan-out with `claude -p` | tool | headless, ci, budget |
| ORCH-015 | Agent SDK subagents, budgets and cost tracking | tool | agent-sdk, budget, cost |
| ORCH-016 | Cloud sessions and GitHub Actions | tool | cloud, remote, github-actions |
| ORCH-017 | Scheduled runs: routines, desktop tasks, `/loop` | comparison | schedule, routines, loop |
| ORCH-018 | Claude Managed Agents multi-agent (API) | tool | managed-agents, api |
| ORCH-019 | Hooks for orchestration | tool | hooks, guardrails |
| ORCH-020 | Token and quota multipliers of multi-agent work | fact | cost, tokens, quota |
| ORCH-021 | When multi-agent helps and when it hurts | recommendation | decision, parallelization |
| ORCH-022 | Decomposition follows context, not role | anti-pattern | decomposition, coding |
| ORCH-023 | Single writer, parallel readers | pattern | conflicts, review, research |
| ORCH-024 | Cutting work into truly independent units | pattern | decomposition, ownership, contracts |
| ORCH-025 | Scale agent count to task complexity | recommendation | sizing, cost |
| ORCH-026 | Current model tiers: price, latency, context | comparison | models, pricing, latency |
| ORCH-027 | Anthropic's model-choice guidance | recommendation | models, choosing |
| ORCH-028 | Reasoning effort: levels, defaults, effects | fact | effort, thinking |
| ORCH-029 | Measured economics of orchestrator and advisor setups | fact | orchestrator, advisor, cost |
| ORCH-030 | Model tier per agent role | recommendation | roles, model-selection |
| ORCH-031 | Main-session model config, aliases and plan limits | fact | model-config, aliases, fable |
| ORCH-032 | Fast mode | fact | fast-mode, latency, cost |
| ORCH-033 | The cheapest model is not always the cheapest run | anti-pattern | haiku, turns, cost |
| ORCH-034 | Return summaries and references, not raw output | pattern | results, context |
| ORCH-035 | Structured subagent reports and status codes | pattern | results, protocol |
| ORCH-036 | Progress and handoff files for long runs | pattern | long-running, handoff, compaction |
| ORCH-037 | Failure modes and their guardrails | anti-pattern | failure-modes, guardrails |
| ORCH-038 | Cost caps per mechanism | recommendation | cost, budget, limits |
| ORCH-039 | Verification: generator-verifier and clean-context review | pattern | review, verification |
| ORCH-040 | Prompt caching in fan-outs | fact | caching, cost |
| ORCH-041 | Superpowers subagent-driven development | pattern | community, superpowers |
| ORCH-042 | Official code-review plugin as a tiering reference | pattern | official-example, review, tiers |
| ORCH-043 | Worktree session managers | tool | community, worktrees |
| ORCH-044 | Ideas from other tools and frameworks | comparison | aider, amp, openai, magentic-one, langgraph |
| ORCH-045 | Cognition vs Anthropic on multi-agent | comparison | debate, writes |
| ORCH-046 | Best-of-N needs a good verifier | fact | best-of-n, voting |
| ORCH-047 | Decision table: task → pattern → tier | recommendation | decision-table |
| ORCH-048 | Workflow or orchestrator skill: who holds the plan | recommendation | workflows, skills, orchestrator |
| ORCH-049 | Workflow cost: size guideline, ultracode and reruns | fact | workflows, ultracode, cost |
| ORCH-050 | Workflows in `claude -p`, the Agent SDK and `claude-code-action` | fact | workflows, headless, permissions, github-actions |

## Open-source licensing and repo hygiene (`topics/kb-oss-licensing.md`, OSS)

| ID | Title | Type | Tags |
|---|---|---|---|
| OSS-001 | Choosing a licence for code, content and fonts | recommendation | license, choosealicense, creative-commons, ofl, no-license |
| OSS-002 | Source-available isn't open source: Elastic-2.0, CC BY-NC, BUSL | fact | source-available, elastic-license, cc-by-nc, osi, osd |
| OSS-003 | Several licences in one repo: code, docs and assets | pattern | dual-licensing, mixed-licenses, readme, package-json |
| OSS-004 | How GitHub detects a repo's licence, and why it shows "Other" | fact | licensee, license-detection, noassertion, github-api |
| OSS-005 | SPDX identifiers and expressions in files and `package.json` | fact | spdx, license-expression, licenseref, headers |
| OSS-006 | REUSE: per-file licensing, `LICENSES/` and `REUSE.toml` | tool | reuse, spdx, per-file-license, fonts, images |
| OSS-007 | Listing dependency licences with `npm sbom` and `npm query` | tool | npm-sbom, npm-query, spdx, cyclonedx, 3rdpartylicenses |
| OSS-008 | Gating dependency licences in CI: dependency-review-action | tool | dependency-review, allow-licenses, github-actions, sbom |
| OSS-009 | Font licences: bundling, web fonts and what to record | fact | ofl, fonts, webfonts, name-table, google-fonts |
| OSS-010 | Notice obligations when copying code: MIT, BSD, ISC, Apache, ELv2 | fact | notices, apache-notice, mit, attribution, cc-by |
| OSS-011 | What an agent must not do with third-party code | anti-pattern | copyleft, gpl, compatibility, notices, copilot-code-referencing |
| OSS-012 | Community health files for a personal project: SECURITY.md, CONTRIBUTING, CODEOWNERS | recommendation | security-md, private-vulnerability-reporting, contributing, codeowners, community-profile |

## Instructing the 5.x models (`topics/kb-prompting.md`, PROMPT)

| ID | Title | Type | Tags |
|---|---|---|---|
| PROMPT-001 | Where Anthropic's prompting guidance lives | fact | docs, per-model-pages |
| PROMPT-002 | What changed from the 4.x models | fact | migration, 5.x |
| PROMPT-003 | Literal instruction following: state the scope | fact | literal, scope |
| PROMPT-004 | Emphasis and capitals: one marked line, not many | recommendation | emphasis, over-triggering |
| PROMPT-005 | Give the reason behind a rule | pattern | motivation, generalisation |
| PROMPT-006 | Examples: 3–5, varied, tagged, and positive | pattern | few-shot, examples |
| PROMPT-007 | XML tags and long-context layout | pattern | xml, long-context, pasted-content |
| PROMPT-008 | Role prompts: one sentence is enough | fact | role, system-prompt |
| PROMPT-009 | Say what to do; when banning, name the exact patterns | recommendation | positive-phrasing, prohibitions |
| PROMPT-010 | Thinking is set by effort; prompts move it less | fact | thinking, effort |
| PROMPT-011 | Don't ask for the reasoning in the response | anti-pattern | reasoning-extraction, refusals |
| PROMPT-012 | Briefing a cold-start subagent | pattern | subagents, briefs |
| PROMPT-013 | Asking for a return format | pattern | subagents, output-format, headless |
| PROMPT-014 | Unattended runs and `claude -p`: tell it nobody is watching | pattern | headless, autonomy, early-stopping |
| PROMPT-015 | Wording CLAUDE.md and agent bodies | recommendation | claude-md, agents, wording |
| PROMPT-016 | Conflicting instructions and where instructions lose force | fact | claude-md, conflicts, compaction |
| PROMPT-017 | `/doctor prompt-audit`: find instructions written for older models | tool | audit, maintenance |
| PROMPT-018 | Claude Code runs the current models on a shorter system prompt | fact | system-prompt, claude-code |
| PROMPT-019 | The four current models compared: scaffolding and over-following | comparison | models, scaffolding |
| PROMPT-020 | Haiku 5.5: what to add to its prompts | fact | haiku, scaffolding |
| PROMPT-021 | Sonnet 5.5: initiative depends on effort | fact | sonnet, effort, scope |
| PROMPT-022 | Opus 5.5: long unattended runs and early reports | fact | opus, unattended |
| PROMPT-023 | Fable 5.1: finish the task, keep it in scope | fact | fable, scope, writing |
| PROMPT-024 | Shorter output: lead with the outcome, be selective | recommendation | verbosity, length |
| PROMPT-025 | Fewer clarifying questions, or more: the knobs | pattern | questions, autonomy, auto-mode |
| PROMPT-026 | Output styles in Claude Code | tool | output-styles, verbosity |
| PROMPT-027 | Premature "done": demand evidence and a real check | pattern | failure-modes, verification |
| PROMPT-028 | Test gaming and hard-coding | pattern | failure-modes, reward-hacking |
| PROMPT-029 | Sycophancy and holding a position | fact | failure-modes, sycophancy |
| PROMPT-030 | Remove scaffolding written for older models | anti-pattern | migration, cleanup |
| PROMPT-031 | Scope creep: name the extras to leave out | pattern | scope, over-eagerness |
| PROMPT-032 | Review prompts: a severity bar lowers recall | pattern | review, recall |
| PROMPT-033 | Text right after tool results can read as an injection | fact | harness, injection, reminders |
| PROMPT-034 | Claude Code's own prompt fragments: what to borrow | comparison | community, claude-code, system-prompt |
| PROMPT-035 | OpenAI Codex and GPT prompting guides: what transfers | comparison | codex, openai |
| PROMPT-036 | Gemini CLI, Cline, Aider, Cursor, Amp, Copilot: ideas | comparison | gemini, aider, cursor, leaks |
| PROMPT-037 | Community prompt and agent collections: what to copy | comparison | community, collections |
| PROMPT-038 | How Anthropic's newest agent bodies are written | pattern | agents, official-example, wording |
| PROMPT-039 | The Concise output style on our sessions: shorter text, same output tokens | fact | output-styles, verbosity, measurement |

## Agents in repositories (`topics/kb-repo-agents.md`, REPO)

| ID | Title | Type | Tags |
|---|---|---|---|
| REPO-001 | osrs-tracker-web's Claude Code setup (inventory) | fact | baseline, osrs-tracker-web |
| REPO-002 | The `conventions-reviewer` agent: definition, tools, model | fact | baseline, reviewer |
| REPO-003 | How the reviewer is triggered and how it performs (measured) | fact | baseline, measurement, cost |
| REPO-004 | What the baseline does not cover | fact | baseline, gaps |
| REPO-005 | Where each repo component lives and how it loads | fact | discovery, agents, skills, hooks, settings |
| REPO-006 | Settings precedence: scalars override, lists and hooks merge, deny wins | fact | precedence, permissions, hooks |
| REPO-007 | Workspace trust: what a repo can do before you trust it | fact | trust, hooks, security |
| REPO-008 | Commands are merged into skills | fact | commands, skills |
| REPO-009 | Agent discovery, reload and the `/agents` change | fact | discovery, reload, agents |
| REPO-010 | What a repo subagent starts with | fact | context, CLAUDE.md, skills |
| REPO-011 | Agent `memory:` for reviewers | fact | memory, reviewer |
| REPO-012 | Which surfaces load repo config | comparison | cloud, actions, add-dir, worktrees |
| REPO-013 | A repo agent earns its place only with repo-specific knowledge | recommendation | catalogue, built-ins |
| REPO-014 | Conventions reviewer: rules read at runtime from the repo | pattern | reviewer, conventions |
| REPO-015 | Bug reviewer in a fresh context | pattern | reviewer, bugs, opus |
| REPO-016 | Test writer and test-gap analyser | recommendation | tests |
| REPO-017 | Security auditor | recommendation | security, reviewer |
| REPO-018 | Docs-drift checker and docs updater | recommendation | docs, schedule |
| REPO-019 | Dependency updater and migration helper | recommendation | dependencies, migration |
| REPO-020 | CI-failure fixer | tool | ci, autofix |
| REPO-021 | Browser or visual checker to keep screenshots out of the main context | pattern | playwright, tokens, ui |
| REPO-022 | Agent catalogue: purpose, trigger, tools, tier | recommendation | catalogue, model-selection |
| REPO-023 | Manual triggers in a session | fact | triggers, at-mention, --agent |
| REPO-024 | Auto-delegation is advisory; make mandatory reviews deterministic | recommendation | triggers, delegation |
| REPO-025 | Hooks that force or run a review | fact | hooks, stop, agent-hooks |
| REPO-026 | Calling a repo agent from an orchestrator | recommendation | orchestrator, background, resume |
| REPO-027 | CI: `claude-code-action@v1` modes and inputs | tool | github-actions, ci |
| REPO-028 | Running repo agents and skills inside the action | fact | github-actions, skills, agents |
| REPO-029 | Managed Code Review and `REVIEW.md` | tool | code-review, review-md |
| REPO-030 | Scheduled repo agents | comparison | schedule, routines, cron |
| REPO-031 | `tools` allowlist, `disallowedTools`, and why Bash can't be scoped per agent | fact | tools, least-privilege |
| REPO-032 | The parent's permission mode overrides the agent's; auto mode checks subagents | fact | permission-modes, auto-mode |
| REPO-033 | Recipe: a reviewer that really can't write | pattern | read-only, hooks, reviewer |
| REPO-034 | Bash permission rules are pattern matches, not a boundary | fact | permissions, bash |
| REPO-035 | Sandboxing for agent Bash | tool | sandbox |
| REPO-036 | Secrets and identifiers around repo agents | recommendation | secrets, public-repo |
| REPO-037 | Prompt injection: the threat model for repo agents | fact | prompt-injection, incidents |
| REPO-038 | Hardening checklist for agents in GitHub Actions | recommendation | github-actions, security |
| REPO-039 | Untrusted-content discipline in agent prompts | pattern | prompt-injection, prompts |
| REPO-040 | Ways to share agents, skills and hooks across repos | comparison | sharing, plugins |
| REPO-041 | What a plugin can't carry for repo agents | fact | plugins, limits |
| REPO-042 | Pattern: a generic reviewer body, repo-specific rules files | pattern | sharing, rules, review-md |
| REPO-043 | Our three `conventions-reviewer` copies: one shared body since 2026-10-12 | fact | baseline, sharing |
| REPO-044 | What goes in CLAUDE.md, a skill, an agent, a hook or REVIEW.md | recommendation | CLAUDE.md, design |
| REPO-045 | Size, instruction count and cross-tool instruction files | fact | CLAUDE.md, AGENTS.md, size |
| REPO-046 | Official reviewer agents compared | comparison | reviewer, official-example |
| REPO-047 | The do-not-flag list | pattern | reviewer, noise |
| REPO-048 | Verify findings before anyone acts on them | pattern | reviewer, validation |
| REPO-049 | Severity schemes, caps and convergence | comparison | reviewer, severity |
| REPO-050 | Structured findings and a verdict line | pattern | reviewer, output |
| REPO-051 | Community agent collections: what to copy and what to avoid | anti-pattern | community, collections |
| REPO-052 | Ideas from other review tools | comparison | codex, bugbot, copilot, coderabbit |
| REPO-053 | `tools` doesn't limit the tools of an agent's own `mcpServers` server | fact | tools, mcp, least-privilege |
| REPO-054 | The v2 reviewer against the v1 baseline (measured) | fact | reviewer, measurement, noise |

## Several sessions in one repo (`topics/kb-sessions.md`, SESS)

| ID | Title | Type | Tags |
|---|---|---|---|
| SESS-001 | What git worktrees share and keep apart | fact | git, worktrees, refs, config |
| SESS-002 | The stash is shared across worktrees | anti-pattern | git, stash, worktrees |
| SESS-003 | Lock contention on shared `.git` files | fact | git, locks, worktrees |
| SESS-004 | What Claude Code worktrees share with the main checkout | fact | worktrees, plugins, permissions, hooks, desktop |
| SESS-005 | Worktree lifecycle on each surface | comparison | worktrees, cleanup, desktop, cloud |
| SESS-006 | Fresh bases and reusing a worktree name | fact | worktrees, baseRef, staleness |
| SESS-007 | The worktree isolation checks | fact | worktrees, isolation, guard |
| SESS-008 | Gitignored files, dependencies and ports in worktrees | pattern | worktrees, node_modules, env, ports |
| SESS-009 | `~/.claude` state that concurrent sessions share | fact | config, settings, history, memory, plugins |
| SESS-010 | `~/.claude.json` under concurrent sessions | fact | config, corruption, backups |
| SESS-011 | `/model` and `/effort` leak into other sessions | anti-pattern | settings, model, effort |
| SESS-012 | OAuth refresh races across sessions | fact | auth, credentials, locks |
| SESS-013 | MCP servers and browser profiles across sessions | fact | mcp, playwright, processes |
| SESS-014 | `CLAUDE_CONFIG_DIR`: what it isolates | fact | config, isolation, env-vars |
| SESS-015 | The prompt cache is per directory | fact | cache, worktrees |
| SESS-016 | Sessions share one dev-server port space | pattern | ports, dev-server |
| SESS-017 | Cross-session messaging: `ListAgents` and `SendMessage` | tool | messaging, sendmessage, listagents |
| SESS-018 | A message from another session carries no authority | fact | messaging, permissions, security |
| SESS-019 | Inbound message controls and defaults | fact | messaging, settings, headless |
| SESS-020 | Remote Control and several sessions | tool | remote-control, mobile, server-mode |
| SESS-021 | No `pull_request` CI on a conflicting PR | fact | github, ci, conflicts |
| SESS-022 | Reading `mergeable` and `mergeStateStatus` | fact | github, gh, polling |
| SESS-023 | Strict "up to date" checks and Update branch | fact | github, branch-protection, ci |
| SESS-024 | Merge queue vs auto-merge | comparison | github, merge-queue, auto-merge |
| SESS-025 | Rebasing and force-pushing from worktrees | pattern | git, rebase, force-with-lease, rerere |
| SESS-026 | `merge=union` for CHANGELOG.md works only locally | fact | changelog, gitattributes, github |
| SESS-027 | Changelog fragments avoid the shared file | comparison | changelog, changesets, towncrier, scriv |
| SESS-028 | What Claude's GitHub integrations do about conflicts | fact | claude-code-action, cloud, conflicts |
| SESS-029 | Resuming sessions across worktrees | fact | resume, continue, worktrees |
| SESS-030 | Moving sessions between cloud, terminal and desktop | comparison | teleport, cloud, desktop |
| SESS-031 | Choosing a hand-off channel | recommendation | handoff, issues, messaging, progress-files |
| SESS-032 | Parallel sessions share one plan allowance | fact | usage-limits, quota, usage |
| SESS-033 | How many sessions practitioners run, and what limits them | comparison | sizing, review, community |
| SESS-034 | Watching many sessions | tool | notifications, statusline, monitoring |
| SESS-035 | Our setup against these findings | comparison | our-setup, global-claude-md |
| SESS-036 | Fast-forward a new worktree with a `SessionStart` hook | pattern | worktrees, hooks, sessionstart, staleness |

## Writing, testing and distributing skills (`topics/kb-skills.md`, SKILL)

| ID | Title | Type | Tags |
|---|---|---|---|
| SKILL-001 | Skill anatomy: folder, SKILL.md, scripts, references, assets | fact | anatomy |
| SKILL-002 | Frontmatter fields: open standard vs Claude Code extensions | fact | anatomy, frontmatter, portability |
| SKILL-003 | Name and description limits per surface | fact | frontmatter, limits |
| SKILL-004 | How Claude decides to load a skill (three levels) | fact | loading, progressive-disclosure |
| SKILL-005 | Claude Code skill-listing budget and truncation (merged into TOK-005) | fact | loading, context-cost |
| SKILL-006 | A loaded skill stays in context; compaction keeps 5k tokens of it | fact | loading, compaction |
| SKILL-007 | Where Claude Code finds skills, precedence and reload | fact | anatomy, locations |
| SKILL-008 | Arguments, variables and `!` context injection | fact | anatomy, commands |
| SKILL-009 | `context: fork` and subagents that preload skills | fact | subagents |
| SKILL-010 | `allowed-tools` pre-approves; it does not restrict | anti-pattern | permissions, security |
| SKILL-011 | Descriptions: what + when, third person, user vocabulary | recommendation | description, triggering |
| SKILL-012 | Undertriggering: be a little pushy, and add negative triggers | pattern | description, triggering |
| SKILL-013 | Don't summarise a multi-step workflow in the description | pattern | description, triggering |
| SKILL-014 | Invocation controls: manual-only, hidden, path-scoped, overrides | tool | triggering, context-cost |
| SKILL-015 | Troubleshooting: not triggering, over-triggering, not followed | recommendation | triggering, debugging |
| SKILL-016 | Keep the body small: only what Claude doesn't already know | recommendation | body, size |
| SKILL-017 | Reference files: one level deep, TOC, descriptive names | pattern | progressive-disclosure |
| SKILL-018 | Scripts for deterministic steps; match freedom to fragility | pattern | scripts, body |
| SKILL-019 | Durable wording: no dates, one term per idea, a default not a menu | recommendation | body, maintenance |
| SKILL-020 | Anti-pattern: capitalised MUST/NEVER instead of reasons | anti-pattern | body, style |
| SKILL-021 | Skills vs CLAUDE.md vs hooks vs subagents vs MCP vs output styles | comparison | architecture |
| SKILL-022 | Context cost of each extension type | comparison | context-cost |
| SKILL-023 | Rules that must hold every time belong in hooks | recommendation | hooks, reliability |
| SKILL-024 | CLAUDE.md under 200 lines; move procedures into skills | recommendation | claude-md, context-cost |
| SKILL-025 | Evaluation-first development and the Claude A / Claude B loop | pattern | testing |
| SKILL-026 | `claude plugin eval`: built-in with/without evaluation | tool | testing, triggering |
| SKILL-027 | skill-creator: benchmarks and description optimisation | tool | testing, triggering |
| SKILL-028 | Designing a trigger eval set | recommendation | testing, triggering |
| SKILL-029 | Community trigger-rate numbers and forced-evaluation hooks | comparison | testing, triggering, hooks |
| SKILL-030 | `/skill-doctor`, `plugin details` and telemetry for usage and cost | tool | maintenance, context-cost |
| SKILL-031 | Anti-patterns in skill testing | anti-pattern | testing |
| SKILL-032 | Retire skills the model has outgrown | recommendation | maintenance, testing |
| SKILL-033 | Plugin layout for shipping skills | fact | distribution, plugins |
| SKILL-034 | Marketplaces and team rollout | fact | distribution, plugins |
| SKILL-035 | Plugin versioning: a fixed `version` pins users | anti-pattern | distribution, versioning |
| SKILL-036 | Auto-update, pinning and release channels | fact | distribution, versioning |
| SKILL-037 | Validate before publishing: `plugin validate --strict`, `plugin tag` | tool | distribution, ci |
| SKILL-038 | claude.ai skills: upload, sharing, org provisioning, sync into Claude Code | fact | distribution, claude.ai |
| SKILL-039 | Skills in the Claude API | fact | distribution, api |
| SKILL-040 | The Agent Skills open standard and portability | fact | portability |
| SKILL-041 | Security review of third-party skills and plugins | recommendation | security |
| SKILL-042 | anthropics/skills and claude-plugins-official | fact | collections |
| SKILL-043 | obra/superpowers: test-driven skill writing | pattern | collections, testing |
| SKILL-044 | Other strong collections: plugin-dev, Trail of Bits, wshobson, Vercel | comparison | collections |
| SKILL-045 | Anti-pattern: installing collections wholesale | anti-pattern | collections, context-cost |
| SKILL-046 | Ideas from other AI coding tools | comparison | portability, triggering |
| SKILL-047 | How the desktop app's Code tab runs Claude Code | fact | desktop, wsl, versions |
| SKILL-048 | Which skill sources each session type loads | comparison | desktop, wsl, cloud, loading |
| SKILL-049 | claude.ai account skills reach sessions in two different ways | fact | desktop, claude.ai, sync |
| SKILL-050 | Desktop WSL sessions don't load claude.ai account skills | fact | desktop, wsl, sync |
| SKILL-051 | Windows and WSL keep separate `~/.claude` homes | fact | wsl, locations |
| SKILL-052 | Plugins in desktop WSL sessions: docs say no, distro-enabled plugins load | comparison | desktop, wsl, plugins |
| SKILL-053 | Desktop worktree sessions read project skills from the main checkout | fact | desktop, worktrees |
| SKILL-054 | Checking which skills a desktop session actually has | recommendation | desktop, debugging |
| SKILL-055 | Writing skills on WSL: Linux filesystem, LF endings, exec bits | recommendation | wsl, authoring |
| SKILL-056 | Setup for someone using both the desktop app and WSL | recommendation | desktop, wsl, distribution |
| SKILL-057 | Skill features that behave differently in the desktop app | fact | desktop, permissions |
| SKILL-058 | Controlling claude.ai account skills on the desktop | fact | desktop, claude.ai, context-cost |
| SKILL-059 | Personal Git marketplaces on claude.ai, synced into Claude Code | fact | distribution, claude.ai, plugins |
| SKILL-060 | Cloud sessions and routines don't load claude.ai marketplace plugins | fact | cloud, routines, plugins |
| SKILL-061 | Literal `$` in a skill body: substitution and the backslash escape | fact | anatomy, commands |
| SKILL-062 | Plugins on claude.ai: Claude Code frontmatter, custom skill paths, inline servers, names and versions | fact | distribution, claude.ai, plugins, frontmatter |
| SKILL-063 | Desktop WSL: synced plugins didn't load, a CLI install from the marketplace did | fact | desktop, wsl, plugins, sync |
| SKILL-064 | Where to find community skills, and what each source reviews | comparison | discovery, security, awesome-lists, skills-sh, marketplaces |
| SKILL-065 | Install counts and stars: what they measure | fact | discovery, install-counts, skills-sh, audits |
| SKILL-066 | `npx skills`: where it installs, its lock files, and `update` | tool | npx-skills, lock-file, pinning, update |
| SKILL-067 | `npx skills`: telemetry, the advisory audit and agent mode | fact | npx-skills, telemetry, security, audits |
| SKILL-068 | Pinning and updating a community skill | recommendation | pinning, update, symlink, supply-chain |
| SKILL-069 | Vetting checklist for a community skill or plugin | recommendation | security, supply-chain, vetting, hidden-unicode |
| SKILL-070 | Anti-pattern: skill text fetched from a server at run time | anti-pattern | security, prompt-injection, mcp, load-skill |
| SKILL-071 | What vetting catches in small animation and scroll kits | fact | security, vetting, examples, animation |
| SKILL-072 | What a plugin pin doesn't cover: dependencies and `command` sources | fact | pinning, dependencies, command-source, supply-chain |
| SKILL-073 | Hidden Unicode in a skill body reaches the model | fact | security, hidden-unicode, prompt-injection |

## Desktop app, artifacts and remote use (`topics/kb-surfaces.md`, SURF)

| ID | Title | Type | Tags |
|---|---|---|---|
| SURF-001 | What the desktop Code tab adds over the terminal | fact | desktop, panes, diff, side-chat |
| SURF-002 | Desktop PR monitoring, auto-archive and notifications | fact | desktop, ci, pull-requests, notifications |
| SURF-003 | What the desktop Code tab lacks | fact | desktop, limitations, commands |
| SURF-004 | Desktop WSL and SSH sessions: what's missing | fact | desktop, wsl, ssh, limitations |
| SURF-005 | Desktop equivalents of CLI flags and terminal keys | fact | desktop, cli-flags, shortcuts |
| SURF-006 | Desktop Browser pane and app preview | tool | desktop, browser, preview, launch-json |
| SURF-007 | Dispatch: tasks from the phone to the desktop | tool | dispatch, mobile, desktop, cowork |
| SURF-008 | Artifacts: what they are and when to use one | recommendation | artifacts, sharing, reporting |
| SURF-009 | Artifact availability: plans, logins, surfaces, versions | fact | artifacts, availability, versions |
| SURF-010 | Artifact privacy, sharing, editors and admin controls | fact | artifacts, privacy, sharing, admin |
| SURF-011 | When Claude asks before publishing or reading an artifact | fact | artifacts, permissions, prompt-injection |
| SURF-012 | Artifact runtime capabilities: connectors and downloads | fact | artifacts, connectors, capabilities |
| SURF-013 | Artifact comments and Claude's replies | fact | artifacts, comments, review |
| SURF-014 | The artifact shared database (`ArtifactData`) | tool | artifacts, database, state |
| SURF-015 | Artifact page constraints and token cost | fact | artifacts, csp, size, cost |
| SURF-016 | Slides, Design and Docs templates, and the design skill | fact | artifacts, templates, design, docs |
| SURF-017 | Turning artifacts off per user, project or organization | fact | artifacts, settings, policy |
| SURF-018 | Remote Control: what a connected device can and can't do | fact | remote-control, mobile, commands |
| SURF-019 | Remote Control connection, reconnects and Trusted Devices | fact | remote-control, security, network |
| SURF-020 | Mobile push notifications | fact | notifications, mobile, remote-control |
| SURF-021 | The Claude mobile app as a Claude Code client | fact | mobile, cloud, remote-control |
| SURF-022 | Which desktop sessions show up on other devices | fact | desktop, remote-control, privacy |
| SURF-023 | Cloud environments: Default, variables and network secrets | fact | cloud, environments, secrets |
| SURF-024 | Cloud network access levels and what bypasses them | fact | cloud, network, allowlist |
| SURF-025 | The cloud GitHub proxy: credentials, push limits, repo scope | fact | cloud, github, proxy, gh |
| SURF-026 | Cloud setup scripts, caching and SessionStart hooks | fact | cloud, setup-script, hooks, cache |
| SURF-027 | Cloud VM image, tools and time limits | fact | cloud, vm, limits, docker |
| SURF-028 | Working inside a cloud session: commands, review, sharing | fact | cloud, commands, sharing, compaction |
| SURF-029 | Cloud auto-fix for pull requests | tool | cloud, auto-fix, ci, github |
| SURF-030 | The VS Code extension for coding work | tool | vs-code, ide, checkpoints, diagnostics |
| SURF-031 | JetBrains IDEs: the CLI with IDE integration | tool | jetbrains, ide, wsl |
| SURF-032 | Claude in Chrome for coding work | tool | chrome, browser, wsl, context-cost |
| SURF-033 | Which surface for which job | comparison | decision-table, surfaces |
| SURF-034 | Surfaces in our setup: desktop WSL and WSL terminal | comparison | our-setup, wsl, desktop |
| SURF-035 | Sending files to your device: `SendUserFile` | tool | remote-control, cloud, files, mobile |

## Token usage and context efficiency (`topics/kb-token-usage.md`, TOK)

| ID | Title | Type | Tags |
|---|---|---|---|
| TOK-001 | What fills the context, by feature | fact | context, claude-code |
| TOK-002 | Fixed overhead per session (measured) | fact | baseline, system-prompt, tools |
| TOK-003 | CLAUDE.md loading rules and size target | fact | claude-md, memory |
| TOK-004 | Auto memory (MEMORY.md) load limits | fact | memory |
| TOK-005 | Skill listing budget | fact | skills, listing |
| TOK-006 | What a subagent's context starts with | fact | subagents |
| TOK-007 | Context window sizes and auto-compact thresholds | fact | 1m, compaction |
| TOK-008 | Cost grows with context length on every turn | fact | long-sessions, cost |
| TOK-009 | A token entering context costs about as much as an output token | fact | economics, cache |
| TOK-010 | `/usage`, `/context` and other built-in meters | tool | measurement |
| TOK-011 | Status line JSON fields for live monitoring | tool | statusline, measurement |
| TOK-012 | OpenTelemetry metrics for teams | tool | otel, measurement |
| TOK-013 | Local transcripts as a usage data source | tool | jsonl, measurement |
| TOK-014 | claude.ai plan limits: 5-hour and weekly windows | fact | plans, limits |
| TOK-015 | What drains plan usage in claude.ai | recommendation | plans, claude.ai |
| TOK-016 | API usage fields and the token counting endpoint | fact | api, measurement |
| TOK-017 | API prices and multipliers | fact | api, pricing |
| TOK-018 | Admin Usage & Cost API and Claude Code Analytics API | tool | api, org |
| TOK-020 | MCP tool search is on by default in Claude Code | fact | mcp, deferred-tools |
| TOK-021 | MCP overhead without deferral | fact | mcp, overhead |
| TOK-022 | Prefer CLIs and scope MCP servers narrowly | recommendation | mcp, scoping |
| TOK-023 | MCP output limits | fact | mcp, output |
| TOK-024 | Code execution and programmatic tool calling (API) | pattern | api, mcp |
| TOK-030 | `/clear` between tasks | recommendation | session-hygiene |
| TOK-031 | `/compact` with focus, and what survives compaction | fact | compaction |
| TOK-032 | Tuning auto-compact | recommendation | compaction, settings |
| TOK-033 | Rewind, partial summarize and `/btw` | tool | session-hygiene |
| TOK-034 | Resuming and idle gaps | fact | cache, resume |
| TOK-035 | Delegate verbose work to subagents | pattern | subagents, context |
| TOK-036 | Subagent model selection | recommendation | subagents, model |
| TOK-037 | Multi-agent and agent teams multiply tokens (merged into ORCH-020) | fact | subagents, teams |
| TOK-038 | API context management: compaction, context editing, memory tool | tool | api, context |
| TOK-040 | Read tool limits and partial reads | fact | files |
| TOK-041 | Search before reading; code intelligence | pattern | files, lsp |
| TOK-042 | Bash output limits and output-filtering hooks | pattern | output, hooks |
| TOK-043 | Pastes, images and PDFs | fact | images, pdf, paste |
| TOK-044 | Blocking reads of large or irrelevant files | fact | permissions |
| TOK-050 | Prompt caching on the API: mechanics | fact | caching, api |
| TOK-051 | Automatic caching and cache diagnostics | tool | caching, api |
| TOK-052 | Prompt caching in Claude Code: TTLs and settings | fact | caching, claude-code |
| TOK-053 | What invalidates the Claude Code cache | fact | caching, claude-code |
| TOK-054 | Message Batches API | fact | batch, api |
| TOK-055 | Effort and thinking as cost levers | fact | effort, thinking |
| TOK-056 | Order of cost levers (official cookbook) | recommendation | api, cost |
| TOK-060 | Skill progressive disclosure (merged into SKILL-004) | fact | skills |
| TOK-061 | Writing skill descriptions | recommendation | skills, descriptions |
| TOK-062 | SKILL.md size and reference files | recommendation | skills |
| TOK-063 | Scripts and dynamic injection instead of prose (merged into SKILL-018, SKILL-008) | pattern | skills, scripts |
| TOK-064 | Frontmatter that cuts skill cost | tool | skills, frontmatter |
| TOK-065 | CLAUDE.md vs rules vs skills vs hooks | comparison | claude-md, skills, hooks |
| TOK-066 | Invoked skills stay in context (merged into SKILL-006) | fact | skills, compaction |
| TOK-067 | Plugin and subagent-definition overhead | fact | plugins, subagents |
| TOK-070 | Anti-patterns: sessions and workflow | anti-pattern | consolidated |
| TOK-071 | Anti-patterns: configuration | anti-pattern | consolidated |
| TOK-072 | Anti-patterns: API apps | anti-pattern | consolidated, api |
| TOK-080 | ccusage | tool | community, tracker |
| TOK-081 | Claude-Code-Usage-Monitor | tool | community, tracker |
| TOK-082 | Status line projects | tool | community, statusline |
| TOK-083 | Output-compression tools (RTK, context-mode) | tool | community, output |
| TOK-084 | Code-index MCP servers (Serena, claude-context, code-review-graph) | tool | community, search |
| TOK-085 | Ideas from other coding agents | comparison | aider, cline, codex |
| TOK-086 | The April 2026 usage-drain incident | fact | cache, incident |
| TOK-087 | WebFetch reads 100,000 characters and answers through a second model | fact | webfetch, truncation, research |
| TOK-088 | Preapproved docs pages come back raw, and big results go to a file | fact | webfetch, docs, research |
| TOK-089 | Getting full text: `curl` the `.md` page and grep | pattern | webfetch, curl, research |
| TOK-090 | `llms.txt` is an index; `llms-full.txt` is too big to read | fact | llms-txt, docs, research |
| TOK-091 | WebFetch settings: cache, deadline, permissions, turning it off | fact | webfetch, settings |
| TOK-092 | WebSearch returns titles, URLs and a synthesized answer, within a session budget | fact | websearch, limits, research |
| TOK-093 | WebSearch `standard` against `extended` | comparison | websearch, research |
| TOK-094 | API web search and web fetch tools: prices and token effects | fact | api, websearch, webfetch, pricing |
| TOK-095 | context7: cost per lookup, freshness and limits | tool | mcp, docs, context7 |
| TOK-096 | Anthropic's docs MCP servers | tool | mcp, docs |
| TOK-097 | Other docs and search MCP servers | tool | mcp, docs, search, community |
| TOK-098 | Picking a research tool by question | recommendation | research, cost |
| TOK-099 | How many research subagents, on which model | recommendation | research, subagents |
| TOK-100 | What a research subagent's brief adds | pattern | research, subagents, briefs |
| TOK-101 | Getting sources back from research subagents | pattern | research, subagents, citations |
| TOK-102 | Anti-patterns: research tools | anti-pattern | consolidated, research |
| TOK-103 | Subagent file handoff: return a path and a status, not the report | pattern | subagents, handoff, context |
| TOK-104 | Where handoff files go | recommendation | subagents, handoff, scratchpad |
| TOK-105 | A background agent's `output_file` is its transcript, not its report | fact | subagents, background, notifications |
| TOK-106 | Handoff file layout for partial reads | recommendation | handoff, files, read |
| TOK-107 | Anti-patterns: subagent handoff | anti-pattern | consolidated, subagents, handoff |
| TOK-108 | What the Bash tool does to a script's output | fact | bash, output, exit-codes |
| TOK-109 | Output contract for scripts and CLIs that agents run | recommendation | scripts, output, cli |
| TOK-110 | Detecting an agent in a script | fact | env-vars, scripts, detection |
| TOK-111 | Agent-aware test runners and quiet flags | tool | tests, output, flags |
| TOK-112 | Background token spenders | fact | background, usage, settings |
| TOK-113 | Terse-output skills and rules files: measured savings | comparison | community, output, measurement |
| TOK-114 | Masking old tool output: measured elsewhere, not a Claude Code setting | comparison | context, tool-results, other-agents |
| TOK-115 | Task budgets (API beta) | fact | api, budgets, agents |
| TOK-116 | What auto-compaction at 400K lost: measured | fact | compaction, measurement, our-setup |

## TypeScript 6.0 to 7.0 (`topics/kb-typescript.md`, TS)

| ID | Title | Type | Tags |
|---|---|---|---|
| TS-001 | TypeScript versions, dates and npm dist-tags | fact | versions, npm, dist-tags, release-dates |
| TS-002 | The tsconfig defaults TypeScript 6.0 changed | fact | tsconfig, defaults, strict, rootDir, migration |
| TS-003 | `types` defaults to `[]`: "Cannot find name 'process'" | fact | tsconfig, types, types-node, errors, migration |
| TS-004 | What 6.0 deprecated, and `ignoreDeprecations: "6.0"` | fact | tsconfig, deprecations, ignoreDeprecations, baseUrl, migration |
| TS-005 | What 7.0 removes outright, and other 7.0 differences | fact | tsconfig, removals, typescript-7, migration |
| TS-006 | TypeScript 7: the Go port in the `typescript` package | fact | typescript-7, tsgo, native-port, lsp |
| TS-007 | TypeScript 7 speed, and `--checkers`, `--builders`, `--singleThreaded` | fact | typescript-7, performance, ci, parallelism |
| TS-008 | TypeScript 7.0 ships no compiler API | fact | typescript-7, compiler-api, tooling |
| TS-009 | Which tools can't use TypeScript 7.0 yet | comparison | typescript-7, peer-dependencies, angular, typescript-eslint, nestjs |
| TS-010 | Running 7.0 for type-checking while tools keep 6.0 | pattern | typescript-7, npm-alias, typescript6, side-by-side |
| TS-011 | `npm install typescript@latest` in a repo whose tools need 6.0 | anti-pattern | typescript-7, peer-dependencies, eresolve, upgrades |
| TS-012 | Claude Code's `typescript-lsp` plugin and TypeScript 7 | fact | lsp, claude-code-plugins, typescript-language-server, typescript-7 |
| TS-013 | tsconfig flags for code Node runs by type stripping | fact | type-stripping, erasableSyntaxOnly, verbatimModuleSyntax, tsconfig |
| TS-014 | Release cadence, the 7.1 plan and 6.0 servicing | fact | release-cadence, iteration-plan, typescript-7, versions |
| TS-015 | Where to check the current version and a package's TypeScript range | recommendation | versions, peer-dependencies, npm, dist-tags |

## UI patterns: states, feedback timing, forms, URL state and interface copy (`topics/kb-ui-patterns.md`, UIPAT)

| ID | Title | Type | Tags |
|---|---|---|---|
| UIPAT-001 | Every data view has more states than loaded: name them | pattern | ui-states, empty, loading, error, angular-resource |
| UIPAT-002 | Response-time limits: 0.1 s, 1 s and 10 s, and what to show at each | fact | response-time, feedback, nngroup, progress-indicator |
| UIPAT-003 | Skeleton, spinner or progress bar, and how to avoid a flashing loader | comparison | skeleton, spinner, flicker, defer, suspense |
| UIPAT-004 | Empty states: first use, no results and cleared | pattern | empty-state, no-results, copy, carbon, polaris |
| UIPAT-005 | Error, partial and offline states: keep the view, offer a way out | pattern | error-state, partial-failure, offline, retry |
| UIPAT-006 | Optimistic updates and rollback | pattern | optimistic-ui, rollback, tanstack-query, useoptimistic |
| UIPAT-007 | Form labels, hints and placeholders | recommendation | forms, labels, placeholder, hint-text, required-fields |
| UIPAT-008 | When to validate, and the error summary on submit | recommendation | forms, validation, error-summary, focus, signal-forms |
| UIPAT-009 | Don't disable the submit button until the form is valid | anti-pattern | forms, disabled-button, double-submit, aria-disabled |
| UIPAT-010 | `autocomplete` tokens and input types | fact | forms, autocomplete, wcag-1-3-5, inputmode |
| UIPAT-011 | Error messages and button labels | recommendation | content-design, error-messages, button-labels, govuk |
| UIPAT-012 | URL state: filters, sort, tabs and pagination | pattern | url-state, deep-links, query-params, back-button, angular-router |
| UIPAT-013 | Forcing UI states in Playwright (tested) | pattern | playwright, mocking, ui-states, offline, testing |
| UIPAT-014 | Native element or APG pattern: a lookup for common widgets | comparison | apg, native-html, widgets, baseline |
| UIPAT-015 | Announcing state changes and keeping focus when the view changes | pattern | live-regions, focus, status-messages, wcag-4-1-3, toasts |

## Interface guidelines and UI review (`topics/kb-ui-review.md`, UIREV)

| ID | Title | Type | Tags |
|---|---|---|---|
| UIREV-001 | Vercel's Web Interface Guidelines: three files, what they cover | fact | web-interface-guidelines, vercel, checklist |
| UIREV-002 | Universal, React-only, Tailwind and Vercel-only rules in the guidelines | comparison | web-interface-guidelines, react, angular, copywriting |
| UIREV-003 | Where the guidelines contradict WCAG, this knowledge base or themselves | comparison | apca, contrast, zoom, wcag, conflicts |
| UIREV-004 | The `web-design-guidelines` skill: an unpinned fetch and a file-only review | fact | skills, webfetch, pinning, static-review |
| UIREV-005 | Pinning interface guidelines for a review | recommendation | pinning, skills, supply-chain |
| UIREV-006 | Which UI-review rules a script can check, and which need judgement | comparison | automation, judgement, playwright, axe |
| UIREV-007 | Test: four running-page checks in Playwright against axe | pattern | playwright, reduced-motion, focus, target-size |
| UIREV-008 | Heuristic evaluation: evaluators and severity (NN/g) | fact | heuristic-evaluation, nngroup, severity |
| UIREV-009 | LLM heuristic evaluation: what studies found | fact | heuristic-evaluation, llm, studies, false-positives |
| UIREV-010 | Design-review agents and skills: rubric, tools, write access | comparison | community, design-review, least-privilege |
| UIREV-011 | A cheap read-only UI review in Claude Code | recommendation | subagents, playwright, tokens, workflow |
| UIREV-012 | What one agent's UI review can and can't claim | recommendation | heuristic-evaluation, evidence, reporting, severity |

## Claude for web analytics and SEO work (`topics/kb-web-analytics-seo.md`, WEB)

| ID | Title | Type | Tags |
|---|---|---|---|
| WEB-001 | osrs-tracker-web's SEO and analytics setup (2026-10-13) | fact | baseline, osrs-tracker-web, gtag |
| WEB-002 | How the 2026-10-09 SEO audit ran | fact | baseline, audit, prompt |
| WEB-003 | How the Search Console and PageSpeed data was gathered (#160) | fact | baseline, search-console, playwright |
| WEB-004 | Google credentials live outside the repo, and auto mode guards them | fact | credentials, auto-mode, our-setup |
| WEB-005 | Anti-pattern: SEO answers from memory and offers of data the session can't reach | anti-pattern | memory, hallucination, indexnow |
| WEB-006 | The official Google Analytics MCP server | tool | ga4, mcp, read-only |
| WEB-007 | Search Console: the API, its quotas, and no official MCP server | tool | search-console, api, mcp, quotas |
| WEB-008 | What the Search Console API can't give you | fact | search-console, url-inspection, ui |
| WEB-009 | GA4 Data API quotas and the BigQuery exports | fact | ga4, api, bigquery, quotas |
| WEB-010 | PageSpeed Insights needs a key; field data moves to CrUX | fact | pagespeed, crux, core-web-vitals |
| WEB-011 | Lab audits: Lighthouse CLI and Chrome DevTools MCP | tool | lighthouse, chrome-devtools-mcp, lab |
| WEB-012 | Read-only scopes and project-scoped config for Google data | recommendation | credentials, scopes, mcp-json |
| WEB-013 | Which source answers which SEO question | comparison | data-sources, search-console, ga4, logs |
| WEB-014 | Judge pages by the server HTML: curl and grep the head | pattern | curl, ssr, crawler-view, tokens |
| WEB-015 | A Playwright snapshot has no `<head>` (tested) | fact | playwright, snapshot, crawler-view |
| WEB-016 | WebFetch and the API web fetch tool are wrong for SEO checks | anti-pattern | webfetch, web-fetch-tool, claude-user |
| WEB-017 | What Google renders and indexes | fact | rendering, javascript, canonical, noindex |
| WEB-018 | Audit requests show up as bots in the server logs | fact | logs, user-agent, measurement |
| WEB-019 | Structured data has no validation API | fact | structured-data, json-ld, validator |
| WEB-020 | Anthropic's three crawlers and their robots.txt tokens | fact | crawlers, robots-txt, claude-user |
| WEB-021 | llms.txt and AI search features | fact | llms-txt, ai-overviews, geo |
| WEB-022 | Retired crawl and indexing advice models still give | anti-pattern | stale-advice, sitemaps, robots-txt |
| WEB-023 | Retired rich results, metrics and tools | anti-pattern | stale-advice, structured-data, core-web-vitals |
| WEB-024 | Universal Analytics habits in a GA4 tag | anti-pattern | ga4, gtag, stale-advice |
| WEB-025 | GA4 consent mode and data retention | fact | ga4, consent-mode, retention |
| WEB-026 | Anthropic's official SEO skills | tool | official-example, skills, seo-audit |
| WEB-027 | Community SEO skills and agents | comparison | community, skills, agents |
| WEB-028 | What a read-only SEO audit skill should do | recommendation | seo-audit, skill-design, read-only |
| WEB-029 | One audit finding: evidence, impact, effort, fix | pattern | findings, output, severity |
| WEB-030 | Let search data order the fixes | pattern | search-console, prioritising |
| WEB-031 | What our SEO sessions cost (measured) | fact | cost, measurement, opus |
| WEB-032 | A fresh sitemap's "could not be read" cleared on its own; a resubmitted index stayed pending | fact | search-console, sitemaps, sitemap-index, logs |
| WEB-033 | Google rewrote `Brand: phrase` titles whose phrase starts in lowercase | fact | title-links, titles, search-results |
| WEB-034 | A consent banner rendered after hydration became the LCP element | fact | core-web-vitals, lcp, consent, ssr |
| WEB-035 | Google's JavaScript SEO clarifications, 2025-12 to 2026-03 | fact | javascript, noindex, canonical, soft-404, robots-meta |
| WEB-036 | Angular SSR: send the status code and one canonical from the server | pattern | angular, ssr, response-init, status-codes, canonical |
| WEB-037 | Googlebot reads only the first 2MB of an HTML file | fact | googlebot, file-size, crawling, ssr |
| WEB-038 | Google spam-policy changes in 2026: back button hijacking and more | fact | spam-policies, back-button-hijacking, manual-actions, site-reputation |
| WEB-039 | AI crawler tokens beyond Anthropic and Google | comparison | crawlers, robots-txt, gptbot, oai-searchbot, perplexitybot, applebot-extended |
| WEB-040 | Google's AI controls: Googlebot, Google-Extended and Google-Agent | fact | google-extended, google-agent, ai-overviews, web-bot-auth, robots-txt |
| WEB-041 | AI usage preferences in robots.txt: the IETF aipref drafts | fact | aipref, content-usage, robots-txt, ietf |
| WEB-042 | hreflang basics for a site that adds a language | fact | hreflang, i18n, multilingual, x-default, angular-localize |

## Native web animation in Angular 22 (`topics/kb-web-animation.md`, ANIM)

| ID | Title | Type | Tags |
|---|---|---|---|
| ANIM-001 | `@angular/animations` in Angular 22: deprecated since 20.2, not removed | fact | angular, animations, deprecation, angular-22 |
| ANIM-002 | Migrating from `@angular/animations`: what replaces each API | pattern | angular, animations, migration, css |
| ANIM-003 | `animate.enter` and `animate.leave`: timing, removal and the function form | fact | angular, animate-enter, animate-leave, timeout |
| ANIM-004 | `animate.enter` replays at hydration; use `@starting-style` for server-rendered content | anti-pattern | angular, ssr, hydration, animate-enter, starting-style |
| ANIM-005 | Animated content must be visible without JavaScript and before hydration | pattern | ssr, hydration, progressive-enhancement, zoneless, afterNextRender |
| ANIM-006 | Route transitions with `withViewTransitions()` | fact | angular, router, view-transitions, developer-preview |
| ANIM-007 | CSS, view transitions or the Web Animations API: which to use, with Baseline status | comparison | css, waapi, starting-style, view-transitions, baseline |
| ANIM-008 | Compositor-only properties and `will-change` | fact | performance, compositor, transform, opacity, will-change |
| ANIM-009 | Animation and Core Web Vitals: INP, LoAF, CLS and LCP | fact | performance, inp, cls, lcp, long-animation-frames |
| ANIM-010 | Reduced motion: replace motion, don't only remove it | recommendation | accessibility, prefers-reduced-motion, vestibular, animate-leave |
| ANIM-011 | WCAG motion rules beyond reduced motion: 2.2.2, 2.3.1 and parallax | fact | accessibility, wcag, flashing, parallax, pause |
| ANIM-012 | Focus, `inert` and the accessibility tree during exit animations | pattern | accessibility, focus, inert, animate-leave, dialog |
| ANIM-013 | Motion durations and easing: the numbers and their sources | comparison | motion-design, duration, easing, material, nngroup |
| ANIM-014 | Testing animations: jsdom, TestBed and Playwright | tool | testing, vitest, jsdom, playwright, reduced-motion |
| ANIM-015 | Choosing a duration: purpose, distance and frequency | recommendation | motion-design, duration, nngroup, frequency |

## Web performance beyond Core Web Vitals (`topics/kb-web-performance.md`, WEBPERF)

| ID | Title | Type | Tags |
|---|---|---|---|
| WEBPERF-001 | INP: the three subparts, long tasks and yielding | pattern | inp, long-tasks, scheduler-yield, interactivity |
| WEBPERF-002 | INP in an Angular 22 SSR app: hydration, event replay and `@defer` | pattern | inp, angular, hydration, incremental-hydration, event-replay |
| WEBPERF-003 | Finding the slow interaction: web-vitals attribution and LoAF | tool | inp, web-vitals, attribution, long-animation-frames |
| WEBPERF-004 | What keeps a page out of the bfcache | fact | bfcache, unload, no-store, cache-control |
| WEBPERF-005 | Testing the bfcache: DevTools, `notRestoredReasons`, `pageshow` | tool | bfcache, devtools, not-restored-reasons, lighthouse |
| WEBPERF-006 | Speculation Rules: support, syntax, eagerness and Chrome's limits | fact | speculation-rules, prerender, prefetch, eagerness |
| WEBPERF-007 | Speculation Rules: side effects, analytics, CSP and SPAs | anti-pattern | speculation-rules, analytics, csp, spa, sec-purpose |
| WEBPERF-008 | `fetchpriority` and preload for the LCP image, and `NgOptimizedImage` `priority` | pattern | fetchpriority, preload, lcp, ngoptimizedimage |
| WEBPERF-009 | 103 Early Hints from Express behind a proxy | fact | early-hints, 103, express, traefik, preconnect |
| WEBPERF-010 | Image formats: AVIF, WebP and the `<picture>` fallback | fact | avif, webp, picture, image-formats |
| WEBPERF-011 | `loading="lazy"`, `srcset`/`sizes` and `NgOptimizedImage` defaults | pattern | lazy-loading, srcset, sizes, ngoptimizedimage, cls |
| WEBPERF-012 | Cache-Control for hashed bundles, other static files and SSR HTML | recommendation | cache-control, immutable, no-cache, express-static, ssr |
| WEBPERF-013 | Compression from Express: brotli, zstd and which level | fact | compression, brotli, zstd, express, node-zlib |
| WEBPERF-014 | Traefik's compress middleware sends gzip unless `br` comes first | anti-pattern | traefik, compression, brotli, accept-encoding |

## Security of agent-written web code (`topics/kb-web-security.md`, WEBSEC)

| ID | Title | Type | Tags |
|---|---|---|---|
| WEBSEC-001 | OWASP Top 10:2025: what changed from 2021 | fact | owasp, top-10, ssrf, supply-chain, exceptional-conditions |
| WEBSEC-002 | The Top 10:2025 for an Angular SSR and NestJS app | recommendation | owasp, angular, nestjs, ssr, threat-model |
| WEBSEC-003 | Security headers: helmet 8.3 and Nest 12.1's `useSecurityHeaders()` | fact | helmet, security-headers, hsts, permissions-policy, corp, nestjs |
| WEBSEC-004 | A per-request CSP nonce in Angular SSR | pattern | csp, nonce, angular, ssr, ngcspnonce, beasties |
| WEBSEC-005 | CSP details that decide whether a nonce policy works | fact | csp, strict-dynamic, unsafe-inline, report-to, meta |
| WEBSEC-006 | Express 5 and Nest 12 defaults that leak or allow too much | fact | express-5, nestjs, cors, error-handling, x-powered-by, body-limit |
| WEBSEC-007 | SSRF in outbound `fetch` from Node | pattern | ssrf, fetch, undici, redirects, blocklist, dns-rebinding |
| WEBSEC-008 | Cookie defaults: Express, express-session and browsers | fact | cookies, samesite, httponly, host-prefix, express-session |
| WEBSEC-009 | CSRF: Angular's XSRF client half and Nest 12.1's `enableCsrfProtection()` | fact | csrf, xsrf, fetch-metadata, sec-fetch-site, angular, nestjs |
| WEBSEC-010 | Angular XSS: the sanitizer, `bypassSecurityTrust*` and Trusted Types | fact | xss, angular, domsanitizer, bypasssecuritytrust, trusted-types |
| WEBSEC-011 | What coding agents get wrong in web security | anti-pattern | agents, xss, csp, cors, secrets, logging |
| WEBSEC-012 | What `/security-review`, security-guidance and Claude Security check | comparison | security-review, security-guidance, claude-security, review |
| WEBSEC-013 | Deterministic checks and log redaction behind the model reviews | tool | codeql, semgrep, eslint, security-patterns, redaction, logging |

## Session workflows (`topics/kb-workflows.md`, FLOW)

| ID | Title | Type | Tags |
|---|---|---|---|
| FLOW-001 | Explore, plan, implement, commit | pattern | workflow, plan-mode, official |
| FLOW-002 | Test-driven workflow with Claude | pattern | tdd, tests, workflow |
| FLOW-003 | Interview, write a spec, run it in a fresh session | pattern | spec, interview, askuserquestion |
| FLOW-004 | UI work from a screenshot or design mock | pattern | ui, screenshots, design |
| FLOW-005 | Choosing a workflow by task size | recommendation | decision, workflow |
| FLOW-006 | Plan mode: what it blocks and what still runs | fact | plan-mode, permissions, bash |
| FLOW-007 | Approving a plan | fact | plan-mode, exitplanmode, approval |
| FLOW-008 | Plan files and `plansDirectory` | fact | plan-mode, plans, settings |
| FLOW-009 | Model and effort for planning | recommendation | plan-mode, model-selection, effort, opusplan |
| FLOW-010 | Planning beyond the terminal: desktop, cloud, Ultraplan removed | fact | plan-mode, desktop, cloud, ultraplan |
| FLOW-011 | Give Claude a check it can run | recommendation | verification, tests, official |
| FLOW-012 | `/goal`: keep working until a condition holds | tool | goal, verification, stop-hook |
| FLOW-013 | `/run`, `/verify` and a repo `verify` skill | tool | verify, skills, commit |
| FLOW-014 | Browser and GUI checks: Chrome, Playwright MCP, computer use | comparison | browser, playwright, chrome, ui |
| FLOW-015 | Evidence before claims: instructions that make Claude verify | pattern | verification, claude-md, superpowers |
| FLOW-016 | How checkpoints work | fact | checkpoints, rewind, retention |
| FLOW-017 | What checkpoints don't cover | fact | checkpoints, bash, subagents, limits |
| FLOW-018 | Git as the permanent safety net | recommendation | git, commits, worktrees |
| FLOW-019 | Branching a conversation: `/branch`, `--fork-session`, `/fork` | fact | sessions, branch, fork |
| FLOW-020 | Signs a session is stuck | anti-pattern | stuck, corrections, context-rot |
| FLOW-021 | Recovery ladder for a stuck session | recommendation | stuck, rewind, clear, handoff |
| FLOW-022 | Changing model or effort to get unstuck | recommendation | model-selection, effort, recovery |
| FLOW-023 | Built-in loop guards | fact | loops, limits, stop-hook, auto-mode |
| FLOW-024 | Ways to wait on external work | comparison | waiting, ci, polling, monitor, loop |
| FLOW-025 | Background Bash: limits and completion notices | fact | background, bash, timeouts |
| FLOW-026 | Monitor tool | tool | monitor, events, polling |
| FLOW-027 | `/loop`, `ScheduleWakeup` and the cron tools | tool | loop, schedulewakeup, cron |
| FLOW-028 | What polling costs | fact | cost, cache, polling |
| FLOW-029 | Push notifications, desktop CI monitor and channels | fact | notifications, desktop, channels, ci |
| FLOW-030 | Interrupting with `Esc` | fact | steering, interrupt |
| FLOW-031 | Queued messages and send-now | fact | steering, queue |
| FLOW-032 | `/btw`, `/model` and `/effort` while Claude works | fact | steering, btw, model, effort |
| FLOW-033 | Our setup against these findings | comparison | our-setup, global-claude-md, skills |
