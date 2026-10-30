# Visual and UI design with Claude

Prefix `DESIGN`. This file covers getting Claude to produce original, logical and coherent visual design for websites and web apps: layouts, colour schemes, type, design systems and tokens, and how CSS and UI libraries pull output toward the same look. Claude Code is the tool for visualising and iterating on a design (artifacts, `/design` canvases, the browser) as well as for building it. External design tools (Figma, Canva) and software, API or database design are out of scope. It links rather than repeats: artifact mechanics (SURF-008 to SURF-017), the desktop Browser pane (SURF-006), screenshot loops and browser checks (FLOW-004, FLOW-014), the visual checker subagent (REPO-021), image token cost (TOK-043), skill loading (SKILL) and general prompting (PROMPT).

Research basis:
- Researched 2026-10-16 (FreekMencke/claude-kb#147) against Claude Code v2.1.296 in a desktop WSL session, on the Claude 5 model family. The same day the scope was narrowed at the user's request: no external design tools, and Claude Design only as far as Claude Code's `/design` uses it.
- The lead read Anthropic's pages in full as raw text: the Claude Code artifacts, best-practices and desktop pages (`.md`), the platform prompting pages for Opus 5.5 and Sonnet 5, the general prompting page and the vision page (`.md`), the help center's design-system and custom-visuals articles (HTML stripped of tags), the 2025-11-12 claude.com blog post and the Opus 4.7 launch post, and the frontend-design `SKILL.md` from all three Anthropic repos plus its git history.
- A Sonnet 5.5 research subagent read community design skills and practice; the lead re-checked every quote used here against its downloads.
- A second round the same day (DESIGN-014 to DESIGN-028): the lead read Anthropic's other design skills from raw.githubusercontent.com; two Sonnet 5.5 readers at high effort covered colour, type and tokens, and layout, libraries, coherence, critique and originality research, from specs, library docs and repos, npm registry JSON and arXiv; the lead re-checked the quotes used against their downloads, and a skeptical subagent tried to refute the claims the recommendations rest on.
- The lead ran the prompting test in DESIGN-027 (26 `claude -p` runs) and follow-ups with the user picking: two 5-run tests and two staged sessions (DESIGN-029, DESIGN-030).
- `/design-sync`'s framework support was read from the installed v2.1.296 CLI bundle and the session's `DesignSync` tool description, because the docs say only "React components".
- A 2026-10-16 deep-research report from a claude.ai chat supplied leads only; it isn't cited.
- A third round on 2026-10-18 (DESIGN-032 to DESIGN-035, FreekMencke/claude-kb#191): typography choices. The lead read Google Fonts Knowledge as raw Markdown from its source in google/fonts (`cc-by-sa/knowledge/`, CC BY-SA 4.0; the site itself renders in JavaScript), MDN's `font-variant-numeric` and `font-optical-sizing` pages from mdn/content, the OpenType feature and `opsz` registry pages, CSS Fonts 4 from csswg-drafts, Butterick's pages and the web-features 3.43.0 data, and tested Google Fonts files with fontTools and headless Chrome. No readers, no web searches.
- A fourth round on 2026-10-23 (DESIGN-036 to DESIGN-040, FreekMencke/claude-kb#253): DESIGN.md files. The lead read Google's DESIGN.md spec, README and PHILOSOPHY at a pinned commit, the `@google/design.md` 0.4.0 and `typeui.sh` 0.7.1 tarballs (`npm pack`, not run except the official linter), four collections' READMEs and all 84 of VoltAgent's brand files, Impeccable's `init` and `document` references, Claude Code's memory, artifacts and security pages (`.md`), the USPTO's likelihood-of-confusion page, 15 U.S.C. § 1125 and two Supreme Court opinions (HTML stripped of tags). It ran a 26-run `claude -p` test (DESIGN-037, DESIGN-038). A Sonnet 5.5 subagent tried to refute the claims the recommendations rest on, and a visual designer and a supply-chain security reviewer (Sonnet 5.5) reviewed the drafts.
- A fifth round on 2026-10-23 (DESIGN-041 to DESIGN-045, FreekMencke/claude-kb#292): shadows and elevation. Two Sonnet 5.5 readers covered design systems' elevation models (docs, and `npm pack` tarballs of their token packages) and CSS behaviour (CSS Backgrounds 3, Filter Effects 1, CSS Color Adjust 1, MDN from mdn/content, WCAG understanding, Tailwind 4.3.3, web-features 3.44.0); the lead read frontend-design, artifact-design and the community skills at pinned commits, re-checked the quotes used against the downloads, and ran a Playwright test (Tailwind 4.3.3, Chromium 156) and six `claude -p` runs. A Sonnet 5.5 subagent tried to refute the claims; a UX/UI designer, an accessibility specialist and a front-end engineer (Sonnet 5.5) reviewed the drafts.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| How do I see and iterate on a design in Claude Code? | Ask for variants side by side in one artifact ("four distinctly different layouts… as a grid"), tune one with sliders, or run `/design <brief>` for a canvas of editable artboards. Then build the pick in code and check it in the desktop Browser pane or with Playwright. | DESIGN-001 |
| Why do Claude's pages, and Tailwind and shadcn sites, look generic? | "Distributional convergence": without direction Claude samples safe defaults. The 2025 tell was Inter and purple gradients; the 2026-09 frontend-design skill names cream-plus-serif-plus-terracotta, near-black with one acid accent, broadsheet hairlines, the SaaS-card kit and template chrome. Tailwind and shadcn add stock fonts, radii, shadows and an achromatic theme: clear namespaces with `@theme { --color-*: initial; }` or set shadcn's CSS variables from the repo's tokens. | DESIGN-003, DESIGN-023 |
| How do I prompt for distinctive design, and which strategy varied most in tests? | Name the subject, audience and the page's one job; give a concrete spec (hex palette, typefaces, radius, motion timing) or ask for 4 directions first; ban the specific patterns you got last time, not "the AI look", and expect a new default; use real copy. Most varied in tests: one small choice at a time, not whole designs (audience, feel, tone of voice, 20 palettes as squares, font pairings, whole-page wireframes, then 5 combined variants); on two subjects the user called 4 of 5 variants good. Earlier tests on the same bakery brief (Sonnet 5.5): the bare brief gave five cream-and-Fraunces pages, a banned list one new look, text directions repeated two options every run, and a one-page visual chooser varied colour and type but not page structure. | DESIGN-004, DESIGN-027, DESIGN-029, DESIGN-030 |
| How do I get an original, consistent colour scheme? | Pick the brand hue from the subject, then fill named roles (Radix's 12 steps or Material's roles), generate the ramp in OKLCH with a script library and check WCAG 2 contrast in light and dark. | DESIGN-015, DESIGN-016, DESIGN-018, DESIGN-019 |
| How do I get past hero, three cards and a CTA? | Name a layout (bento, magazine, split screen, zigzag, broken grid…), default to no cards, one job per section, and carry the ASCII wireframe into `grid-template-areas`. | DESIGN-022 |
| When should something cast a shadow, and what about dark mode and forced colours? | What floats or overlaps (menus, popovers, dialogs, overlapping screenshots); systems split on resting cards, so default to flat with a border or tone step. Write one rule per kind of surface and layout state. Dark mode: lighter surfaces per level plus a hairline border, not just a darker shadow. Forced colours turns every `box-shadow` (Tailwind `ring-*` too) to `none`: add a transparent border or outline, and focus with `outline`. `drop-shadow()` for transparent images. | DESIGN-041, DESIGN-042, DESIGN-043, DESIGN-044, DESIGN-045 |
| Where do design tokens go, does a DESIGN.md work, and how do I keep a multi-page site consistent? | Where Claude reads them: CLAUDE.md, a theme file or a repo skill; your prompt beats them, and they beat Claude's defaults. Claude Code doesn't load a DESIGN.md (Google's "alpha" spec) by itself: in a 26-run test one in the root was read in 1 of 9 runs; import it with `@DESIGN.md` or name it in the prompt, and any format read was applied in full. Give every session the role tokens, a component inventory and page templates, and check every page for off-token values, visual diffs and raw hexes. Artifacts load fonts only from Google Fonts; other faces are inlined. | DESIGN-006, DESIGN-037, DESIGN-036, DESIGN-024, DESIGN-021 |
| Can I start from a brand's DESIGN.md from awesome-design-md or a similar list? | To study, yes; to ship, no. The files are scraped from public sites (84 in VoltAgent's list) and name proprietary fonts; MIT covers the collection's text, not the brand, and a look that causes confusion is actionable trade dress in the US. A copied file is instruction text: read it, strip commands and URLs, pin it. | DESIGN-038, DESIGN-039, DESIGN-040 |
| Which type details should a UI specify: pairing, optical sizes, numerals? | One family first; add a second face only for a job the first can't do, from the same form model or designer. `tabular-nums` for data and changing values, `"case"` on all-caps labels, `slashed-zero` for codes; check the font has the feature. Optical sizes matter when one family runs from captions to display sizes; browsers apply them by CSS px without any CSS. A `fonts.googleapis.com` link drops `case`, `zero`, `onum` and stylistic sets, and `opsz` unless the URL names it. | DESIGN-033, DESIGN-034, DESIGN-032, DESIGN-035 |
| frontend-design or `artifact-design`? | frontend-design is the plugin skill for UI in code and is identical in all three Anthropic repos (last changed 2026-09-01 to 09-03). `artifact-design` is bundled with the Artifact tool and governs published pages. Community skills (Impeccable, Taste Skill, Hallmark and others) are unofficial: borrow their ideas rather than install them. | DESIGN-005, DSKILL-001 |
| How do I get a design system out of existing code? | React: `/design-sync`. Anything else, Angular included (the v2.1.296 sync adapters read `.tsx`/`.jsx` and React Storybook only): have Claude read the theme files, CSS custom properties and components into one token list per role. | DESIGN-002, DESIGN-010 |
| Screenshot or computed styles to check a design? | Screenshots for overall look and hierarchy; computed styles (`getComputedStyle`, a contrast check) for exact spacing, sizes, colours and contrast, because Claude's localisation is "approximate". Claude can't generate images; its design output is HTML, CSS, SVG or canvas. | DESIGN-007, DESIGN-008 |
| How do I improve an existing design rather than redesign it? | Give the highest-fidelity input you have (code plus the running app, then a URL, then a screenshot), lock the tokens, audit against a checklist and change one thing at a time; redesign only when asked, on a branch. For staged picks, extract the current design first and re-open only the steps that should change. | DESIGN-009, DESIGN-031 |
| Which model and effort for design work? | Opus 5.5 at `high` for new directions and critique, Sonnet 5.5 for work inside a set design system (inference). A vendor-run 2026-10 benchmark put Opus 5.5 first for meeting briefs but in the bottom group for originality, and in our test Opus and Sonnet gave the same default page. | DESIGN-011, DESIGN-026 |
| What goes wrong most often? | Claude claiming fixes it never rendered, drifting to its house style, redesigning when asked to polish, animating everything, CSS specificity clashes, and messy source design systems. | DESIGN-013 |

## Index

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

## [DESIGN-001] Visualising and iterating on a design in Claude Code
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Artifacts: compare alternatives, tune with interactive controls, draft a design canvas, availability](https://code.claude.com/docs/en/artifacts), [What's new, week 34](https://code.claude.com/docs/en/whats-new/2026-w34), [Desktop: auto-verify changes](https://code.claude.com/docs/en/desktop)
- Related: DESIGN-002, DESIGN-007, SURF-006, SURF-008, SURF-016, FLOW-004, FLOW-014

Claude Code writes the HTML, CSS and SVG itself. The loop is explore, pick, tune, build, check:

| Step | How | Notes |
|---|---|---|
| Explore | One artifact with variants side by side: "Make an artifact with four distinctly different layouts for the settings panel. Vary density and grouping, and lay them out as a grid with a one-line tradeoff under each." | Works for palettes and type pairings too |
| Mock up screens | `/design <brief>`: "Claude drafts the design as artboards on one canvas and publishes the canvas as a Claude Design artifact" | Select an element and change it; edits save. Each artboard exports as PNG or PDF. "Pick one, tweak it, then have Claude implement it." |
| Tune | An artifact with "sliders, toggles, or input fields bound to whatever you are adjusting" | Add a "Copy as prompt" button so the chosen values flow back into the session |
| Build | Code in the repo, with the chosen values recorded as tokens (DESIGN-006) | |
| Check | Desktop Browser pane ("Claude auto-verifies changes after every edit") or Playwright MCP in the terminal | Measure, don't only look (DESIGN-007) |

Artifacts and `/design` need a claude.ai login (not an API key, gateway token or cloud-provider credential), the Anthropic API rather than Bedrock, Vertex or Foundry, and an interactive session: they're off in `-p`. `/design` needs v2.1.265 per the artifacts page, v2.1.234 per the week-34 notes (INDEX.md Conflicts). If the organization turned the Design template off, "`/design` doesn't draft designs".

Tested 2026-10-16, v2.1.296: a `claude -p` launched from a desktop session inherited its environment and had the Artifact tool; under `env -i` it didn't.

## [DESIGN-002] Design systems for `/design`: Design System artifacts and `/design-sync`
- Type: fact
- Applies to: Claude Code, claude.ai
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Set up your design system](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design), local reading of the v2.1.296 CLI and its `DesignSync` tool description, [wmedia.es: /design-sync (community)](https://wmedia.es/en/tips/claude-code-design-sync-your-components)
- Related: DESIGN-001, DESIGN-006, DESIGN-010, SURF-016

A Design System artifact "captures your colors, typography, components, and layout patterns, so Claude applies them to every new design and deck", which includes `/design` canvases. Beta on Pro, Max, Team and Enterprise; on Enterprise it stays off "until an owner turns on Design systems". Make one from a chat (files, decks, logos, fonts: "works best for brand design systems") or with `/design-sync` "If your design system already exists as React components". An Owner can set an organization default.

**`/design-sync`** keeps a local component library in sync with a design-system project, "incrementally, one component at a time, never as a wholesale replace". It diffs the remote files, then asks you to approve a plan naming every path it will write or delete (the `DesignSync` tool, v2.1.296). `/design-login` authorizes sessions without a claude.ai login. It is unavailable while `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is set.

**Not for Angular.** In the v2.1.296 bundle, the package adapter collects PascalCase exports from `.tsx`/`.jsx` files and `.d.ts`, and the Storybook path composes React stories. An Angular library (templates in `.html`, `@Component` classes in `.ts`) matches neither. A community write-up that read the skill's source agrees: "Vue, Angular and Svelte do not". For a non-React system, build the Design System artifact from a chat, and keep the repo's token list as the source of truth (DESIGN-006).

Tested 2026-10-16, v2.1.296, desktop WSL: `DesignSync` was a deferred tool in the session; `/design-sync` wasn't run (it writes to claude.ai).

## [DESIGN-003] Why Claude's designs look generic, and the named clichés by date
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Improving frontend design through Skills (2025-11-12)](https://claude.com/blog/improving-frontend-design-through-skills), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5), [Prompting Claude Sonnet 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5)
- Related: DESIGN-004, DESIGN-005

**Cause.** Anthropic's 2025-11-12 post: "Distributional convergence… Safe design choices–those that work universally and offend no one–dominate web training data. Without direction, Claude samples from this high-probability center."

**The tells move.** Date every cliché list:
- **2025-11 (blog):** "Inter fonts, purple gradients on white backgrounds, and minimal animations". Its snippet also notes convergence on "Space Grotesk".
- **2026-06 skill:** three looks: cream with a serif and terracotta, near-black with one acid accent, broadsheet hairlines.
- **2026-09 skill (current):** five traits: (1) "a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta or warm-clay accent (often near #D97757 — Anthropic's own Claude-interaction accent…)"; (2) "a near-black background with a single bright acid-green or vermilion accent"; (3) "a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns"; (4) "the SaaS-card kit", meaning identical rounded cards, one radius, `rgba(0,0,0,.1)` shadows and gradient washes; (5) "template chrome": all-caps eyebrows, `A · B · C` meta strings, "WORD — fragment" labels, `#0B0B0B` for black, monospace data labels and a `→` on every link.
- Typographic tells in the same skill: one accented word in a headline, all-caps labels, labels above content, and `01 / 02 / 03` markers on content that isn't a sequence.

**Model pages:** Opus 5.5 "falls back on a few default styles"; Sonnet 5 "might settle into a consistent default visual style". On both, a general "avoid a generic AI look" "mostly swaps one default for another".

## [DESIGN-004] Prompting for distinctive design
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Prompting Claude Sonnet 5: design and frontend defaults](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5), [Prompting Claude Opus 5.5: frontend design defaults](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)
- Related: DESIGN-003, DESIGN-005, DESIGN-006, DESIGN-022, DESIGN-027, DESIGN-030, PROMPT-009

1. **Ground it.** Name "one concrete subject, the design's audience, and the design's primary job" (frontend-design). Distinctive choices come from the subject's "industry, subject matter, materials, and vernacular".
2. **Give a concrete spec when you have one.** Sonnet 5 "follows explicit specs precisely". Anthropic's AEFRM example gives five hex values, "4px corner radius", the typeface's character, the section order and "transition: all 160ms ease out".
3. **Or ask for directions first.** "Before building, propose 4 distinct visual directions tailored to this brief (each as: bg hex / accent hex / typeface, plus a one-line rationale)." Because Sonnet 5 doesn't accept `temperature`, this is "the recommended way to produce meaningfully different design directions across runs".
4. **Ban specific patterns and iterate the list.** Opus 5.5's example: "Do not use a cream or off-white background, italic accent words in headlines, numbered "01/02/03" section labels, monospace labels, or pill-shaped buttons." Then "check which styles the first result used instead, and extend the list if needed." Sonnet 5 says "don't use that color" shifts it "to a different fixed palette".
5. **Plan tokens before code.** frontend-design's two passes: a compact plan (4–6 named hex values, typefaces and roles, a layout in prose and ASCII wireframes, principles), then a review of that plan against the brief, then code.
6. **Real copy.** "Copy can make a design feel as templated as the design itself." CTAs say what happens: "Save changes," not "Submit."
7. **Restraint.** "Spend your boldness in one place." One orchestrated motion moment, not entrance animations everywhere.

Tested (DESIGN-027 to DESIGN-030): whole designs converged; one small choice at a time, picked by a person, worked best. The general and Sonnet 5 pages' `<frontend_aesthetics>` snippets still ask for "animations for effects and micro-interactions", unlike the 2026-09 skill (INDEX.md Conflicts).

## [DESIGN-005] The frontend-design skill and how it differs from `artifact-design`
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-16
- Sources: [claude-code: frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [claude-plugins-official copy](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [anthropics/skills copy](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), [Artifacts: improve the visual design](https://code.claude.com/docs/en/artifacts), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: DESIGN-003, DESIGN-004, SURF-016, SKILL-048

**Where it lives.** Three Anthropic copies, byte-identical on 2026-10-16 (71 lines): the `frontend-design` plugin in `anthropics/claude-plugins-official` (what `/plugin install frontend-design@claude-plugins-official` installs), the same plugin in `anthropics/claude-code`, and `anthropics/skills`. History: added 2025-11-12 (41 lines, the "AI slop" version banning Inter, Roboto and purple gradients), rewritten 2026-06-09 to 06-18 (55 lines, "design lead at a design studio"), and rewritten again 2026-09-01 to 09-03. Third-party mirrors often show an older version; quote GitHub.

**What it says now.** Act as the design lead of a studio whose client "has already rejected proposals that felt cliché or templated". Ground the design in the subject; pick typefaces deliberately and use The Elements of Typographic Style for the scale; keep lines under 80 characters; avoid the five default looks (DESIGN-003); plan tokens, review the plan, then build; watch CSS specificity; build to "a quality floor": "responsive down to mobile, visible keyboard focus, reduced motion respected, visually accessible, harmonious color palettes"; critique your work "taking screenshots to review if your environment supports it"; write plain, active-voice copy.

**`artifact-design`** is the design skill bundled with the Artifact tool, applied "when it builds an artifact". It looks for your design system first and defers to it and to your prompt (SURF-016). Since v2.1.281 it also "asks Claude for plain, direct prose". Use frontend-design for UI in a codebase, and `artifact-design` comes with published pages anyway. Both can be present in a desktop session.

## [DESIGN-006] House style: where design tokens live and what wins
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Artifacts: improve the visual design, page constraints](https://code.claude.com/docs/en/artifacts), [Set up your design system](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design)
- Related: DESIGN-002, DSKILL-001, DESIGN-034, DESIGN-035, DESIGN-036, DESIGN-037, DESIGN-041, DESIGN-042, DESIGN-043, DESIGN-044, DESIGN-045, SURF-016, MEM, REPO-044

**Where.** Anthropic: record tokens "where Claude can find them, such as the project's CLAUDE.md or a theme file in your repository". Any clear list works: "The heading and format above are an example; any clear list of colors, fonts, and spacing works." For a repo with agents, a repo skill that reviewers preload works too (REPO-044). A `DESIGN.md` is a community convention, not an Anthropic one (DESIGN-036), and Claude Code reads it only when it's imported or named (DESIGN-037).

**Precedence:** "Claude treats your design system as higher precedence than its own choices, and your prompt as higher precedence than both." For `/design` canvases and artifact templates, a Design System artifact does the same job (DESIGN-002).

**What a token block needs:** colours by role (surface, text, accent, borders, states), typefaces and their roles (with the figure style per role, such as tabular for data, DESIGN-034), a type scale, a spacing scale, radii by surface type, shadow rules per kind of surface (DESIGN-041) and motion rules, and real examples. Roles beat raw hexes: Claude can apply "accent for links and primary actions", not "#10b981 somewhere".

**Fonts in artifacts:** Google Fonts is "the one external font source an artifact page can load from"; Claude inlines any other typeface as a `@font-face` data URI with a fallback stack. External images are blocked by the CSP. A private brand font in an artifact therefore costs data-URI tokens on every publish. Google's served files also lack most OpenType features (`case`, `zero`, stylistic sets), so an artifact that needs them inlines the font too (DESIGN-035).

**Note:** the docs' sample block uses "Inter for body", which Anthropic's own design guidance lists as a generic default (OVERLAPS.md, Resolved conflicts). It is a format example; choose your own type.

## [DESIGN-007] Verify a design by measuring, not only by looking
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-30
- Sources: [Best practices: Give Claude a check to run](https://code.claude.com/docs/en/best-practices), [Desktop: auto-verify changes](https://code.claude.com/docs/en/desktop), [Vision: limitations](https://platform.claude.com/docs/en/build-with-claude/vision), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [WCAG 2.2: contrast (minimum), non-text contrast](https://www.w3.org/TR/WCAG22/)
- Related: FLOW-004, FLOW-014, SURF-006, REPO-021, TOK-043, DESIGN-008, DESIGN-013

The loop is FLOW-004's: implement, screenshot the result, compare it with the design, fix the differences. Best practices lists "A browser screenshot next to the mockup" as a check Claude can run, and says "ask Claude for *evidence*: the command it ran and its output, or the screenshot". After Claude says it's done, `/verify` "has Claude build and run the app and look at the result". The desktop Browser pane does this "after every edit" unless `"autoVerify": false` is set (SURF-006).

**Split the check by question:**
- **Screenshots** for overall look, hierarchy, balance and anything a token can't express.
- **Measurement** for anything with a number: spacing, sizes, radii, font family and weight, colours, line length, contrast. In Playwright MCP, `browser_evaluate` with `getComputedStyle` and `getBoundingClientRect` returns the values the browser applied, and a contrast check compares them against WCAG AA (4.5:1 for body text, 3:1 for large text and UI parts).

Anthropic's vision page says "Claude's coordinate and localization outputs are approximate… verify outputs before relying on them" (DESIGN-008), so a screenshot can't settle "is this 16px or 20px?" or "is this #475569?".

**Cost:** each screenshot stays in context and is re-read on later turns (TOK-043). Run checks in a subagent that returns numbers and file paths (REPO-021). Measure at the breakpoints the design names, and with `prefers-reduced-motion` and keyboard focus where the quality floor requires them.

## [DESIGN-008] What Claude's vision gets wrong in design work
- Type: fact
- Applies to: Claude Code, Claude API, claude.ai
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Vision](https://platform.claude.com/docs/en/build-with-claude/vision), [Prompting Claude Opus 5.5: tools for complex visual inputs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5), [Introducing Claude Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7)
- Related: DESIGN-007, DESIGN-011, TOK-043, IMG-001

- **Positions are approximate:** "Claude's coordinate and localization outputs are approximate."
- **Small or poor images:** "Claude might hallucinate or make mistakes when interpreting low-quality, rotated, or very small images under 200 pixels."
- **No image generation:** "Claude is an image understanding model only… it cannot generate, produce, edit, manipulate, or create images." Design output is HTML, CSS, SVG or canvas drawing; photos come from you or a connector.
- **Resolution:** Claude 4.7 and later read up to 2576 px on the long edge (4,784 tokens); other models 1568 px. Bigger images are downscaled, which "might, for example, make text less legible". Crop to the region you're judging rather than sending a full-page screenshot.
- **Request limits:** 8000×8000 px per image; 20 images per message on claude.ai; on the API, above 20 images per request each image must stay under a stricter limit ("resize each image so that neither dimension exceeds 3,000 px", raised from 2000 px; checked 2026-10-30).
- **Opus 5.5** reads "charts, diagrams, and screenshots considerably more precisely than Claude Opus 5 without tools". For the densest inputs, cropping and zooming tools (PIL, OpenCV, or the cookbook's crop tool) "still add accuracy", used "more effectively at higher effort levels".

Image cost and context effects are in TOK-043.

## [DESIGN-009] Improving an existing design: inputs, audit, polish or redesign
- Type: pattern
- Applies to: Claude Code, claude.ai
- Confidence: community-consensus
- Last verified: 2026-10-16
- Sources: [Artifacts: compare alternatives](https://code.claude.com/docs/en/artifacts), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- Related: DESIGN-007, DESIGN-010, DESIGN-013, FLOW-004

**Inputs, best first.** This ranking is our synthesis of the official pages:
1. The code and the running app: Claude reads the tokens and measures the rendered page (DESIGN-007).
2. A live URL: rendered, but no source tokens.
3. A screenshot: approximate positions and colours only (DESIGN-008).

**Audit checklist:** visual hierarchy; spacing rhythm and alignment; type scale, pairing and line length; colour contrast to WCAG AA; visible keyboard focus; reduced motion respected; behaviour at each named breakpoint; consistent use of the tokens; copy that says what things do. The frontend-design skill's "quality floor" covers the middle of this list.

**Polish or redesign.** With an established brand, polish inside locked tokens: name what must not change (logo, palette, type, voice) and change one area at a time. Redesign only when the brief asks for it, and keep the old version reachable: a git branch, and the old version as one of the variants you compare.

**Compare, don't guess.** Put variants side by side: an artifact "with four distinctly different layouts… as a grid with a one-line tradeoff under each" (DESIGN-001).

## [DESIGN-010] Extracting a design system from code or a URL
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Set up your design system](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design), [Get started with Claude Design: known limitations](https://support.claude.com/en/articles/14604416-get-started-with-claude-design), [Artifacts: improve the visual design](https://code.claude.com/docs/en/artifacts)
- Related: DESIGN-002, DESIGN-006, DESIGN-007, DSKILL-001

| Source | Route |
|---|---|
| React component library | `/design-sync` reads tokens and components; "works best for product design systems in code" (DESIGN-002) |
| Other code (Angular, Vue, plain CSS, a Tailwind theme) | Ask Claude to read the theme files, CSS custom properties and components and write one token list by role into CLAUDE.md, a theme file or the repo skill (DESIGN-006) |
| A live website | Measure computed styles in a browser (`getComputedStyle` over the page, DESIGN-007), or a community extractor (DSKILL-001) |

Clean while extracting: one token per role, duplicates and one-off values listed for a decision rather than copied in. Anthropic warns that "Design system import is only as good as its source. A messy codebase or an incomplete file will show up in the output", and advises "Include real examples, not just specs": a finished page tells Claude more about the feel than a palette alone.

Validate the result by building one or two test pages from the tokens alone and comparing them with the real app. A repo's own token list stays the source of truth; any copy (a Design System artifact for `/design`) has to be refreshed when the tokens change.

## [DESIGN-011] Models and effort for design work
- Type: recommendation
- Applies to: general
- Confidence: unverified
- Last verified: 2026-10-16
- Sources: [Custom visuals in chat: tips](https://support.claude.com/en/articles/13979539-custom-visuals-in-chat), [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5), [Prompting Claude Sonnet 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5), [Introducing Claude Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7)
- Related: DESIGN-008, DESIGN-026, DESIGN-027, ORCH-030, ORCH-028, FLOW-009

**What Anthropic says:**
- Custom visuals: "Opus performs the best at visualization tasks, so if you're going for something complex, we'd recommend choosing a more intelligent model."
- Opus 4.7 (2026-04-16 launch) was "more tasteful and creative… producing higher-quality interfaces, slides, and docs", and powered Claude Design at launch.
- Opus 5.5 reads screenshots and diagrams far better than Opus 5, even at its lowest effort. Its default is `medium`, and it uses image tools "more effectively at higher effort levels" (DESIGN-008).
- Sonnet 5 defaults to `high`, "might settle into a consistent default visual style", and "follows explicit specs precisely".

**Benchmarks:** Design Creativity Bench (a preprint, 2026-10-08) puts Claude Opus 5.5 in the bottom group on originality (13th of 15, intervals overlapping) and first on meeting a brief's criteria, 99.2%. It is vendor-run and tested no prompting (DESIGN-026). WebDev Arena ranks pairwise human preference; we didn't read its current rankings. Anthropic's statements above are launch and guidance claims, not measurements.

**Our inference:** in our test Opus 5.5 and Sonnet 5.5 gave the same default page (DESIGN-027), so work on the prompt and process (DESIGN-004) before switching models. Use Opus 5.5 at `high` for open briefs, new directions, critiques and dense screenshots. Use Sonnet 5.5 for iterations inside an established design system or a precise spec, where following the spec matters more than taste. A checklist-driven visual check runs on Sonnet 5.5 at `medium` (REPO-021). Not Haiku for design judgement. Test before relying on any of this.

## [DESIGN-012] Community design skills (unofficial)
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-23
- Sources: [pbakaus/impeccable](https://github.com/pbakaus/impeccable), [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), [google-labs-code/design.md](https://github.com/google-labs-code/design.md)
- Related: DSKILL-001, DESIGN-036, DESIGN-038

Merged into DSKILL-001 (kb-design-skills.md) on 2026-10-23. Read that file for the community design skills by mechanism, their security surface (DSKILL-010), licences (DSKILL-011), a test (DSKILL-013) and what to borrow (DSKILL-014). DSKILL-001 also keeps this entry's lines on designlang, OneRedOak's design-review agent and the DESIGN.md spec; the DESIGN.md format is now DESIGN-036 and brand collections DESIGN-038.

## [DESIGN-013] Design pitfalls
- Type: anti-pattern
- Applies to: Claude Code, claude.ai
- Confidence: official-docs
- Last verified: 2026-10-30
- Sources: [Best practices: Give Claude a check to run](https://code.claude.com/docs/en/best-practices), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [Prompting Claude Sonnet 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5), [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design)
- Related: DESIGN-007, DESIGN-009, DESIGN-003, DSKILL-001

| Pitfall | Guard |
|---|---|
| "Fixed it" with nothing rendered | Ask for "*evidence*: the command it ran and its output, or the screenshot", or measured values (DESIGN-007) |
| Judging pixels from a screenshot | Measure computed styles; localisation is "approximate" (DESIGN-008) |
| Drift to Claude's house style on an open brief | Sonnet 5 "might settle into a consistent default visual style": give a spec or ask for directions (DESIGN-004) |
| Swapping one default for another | "avoid a generic AI look" "mostly swaps one default for another": name the patterns |
| Redesigning when asked to polish | Lock tokens and name what must not change (DESIGN-009) |
| Animation everywhere | "fade-and-slide-up entrances on each section and hover transitions on every card are the generic default and read as AI-generated" |
| CSS specificity clashes | "It's easy to generate CSS classes that cancel each other out (especially with a type-based selector like .section and an element-based selector like .cta)", often padding between sections |
| A messy source design system | "Design system import is only as good as its source" (DESIGN-010) |
| Too many screenshots in the main context | Check in a subagent (REPO-021, TOK-043) |

## [DESIGN-014] Anthropic's other design skills in `anthropics/skills`
- Type: tool
- Applies to: Claude Code, claude.ai
- Confidence: official-example
- Last verified: 2026-10-16
- Sources: [theme-factory](https://github.com/anthropics/skills/blob/main/skills/theme-factory/SKILL.md), [brand-guidelines](https://github.com/anthropics/skills/blob/main/skills/brand-guidelines/SKILL.md), [canvas-design](https://github.com/anthropics/skills/blob/main/skills/canvas-design/SKILL.md), [algorithmic-art](https://github.com/anthropics/skills/blob/main/skills/algorithmic-art/SKILL.md), [web-artifacts-builder and its init script](https://github.com/anthropics/skills/blob/main/skills/web-artifacts-builder/SKILL.md)
- Related: DESIGN-005, DESIGN-003, DESIGN-023, SKILL

Besides frontend-design (DESIGN-005), five skills touch visual design. Each path's only commit in the repo is dated 2025-12-01, so they predate frontend-design's 2026-09 rewrite.

| Skill | What it does | What to take from it |
|---|---|---|
| theme-factory | 10 preset themes, each a hex palette plus a header and body font, in `themes/*.md`. Show them, "Wait for selection", apply; or generate a new named theme | A named theme file as the unit the user picks. The presets themselves are stock ("Tech Innovation": `#0066ff`, `#00ffff`, DejaVu Sans) |
| brand-guidelines | Anthropic's own brand: `#faf9f5` light, `#141413` dark, `#d97757` orange, Poppins headings, Lora body | That cream and orange is the look frontend-design calls a tell ("often near #D97757") |
| canvas-design | Posters and static art as PNG or PDF: write a 4–6 paragraph "design philosophy" naming a movement, then express it; finish with a pass that will "avoid adding more graphics; instead refine what has been created" | Concept first, then subtract |
| algorithmic-art | The same philosophy-first pattern for seeded p5.js generative art | |
| web-artifacts-builder | React 18, Vite, "Tailwind CSS 3.4.1" and shadcn/ui, bundled to one HTML file. Its one design rule: "avoid using excessive centered layouts, purple gradients, uniform rounded corners, and Inter font" | Its init script writes shadcn's stock theme (`--radius: 0.5rem`, `--primary: 0 0% 9%`, `baseColor` slate), so output starts from the shadcn look unless re-themed (DESIGN-023) |

## [DESIGN-015] Colour roles: name tokens by job, not by hue
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Radix Colors: understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale), [Radix Colors: composing a palette](https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette), [Material Web: color](https://github.com/material-components/material-web/blob/main/docs/theming/color.md)
- Related: DESIGN-006, DESIGN-016, DESIGN-018, DESIGN-021

Give Claude roles to fill, not a bag of hexes. Two documented role sets:

**Radix 12-step scale**, per hue:

| Steps | Use |
|---|---|
| 1–2 | "App background", "Subtle background" |
| 3–5 | UI element background: normal, hover, "Active / Selected" |
| 6–8 | Borders: "Subtle borders and separators", "UI element border and focus rings", "Hovered UI element border" |
| 9–10 | "Solid backgrounds" and their hover; "Step 9 has the highest chroma of all steps" |
| 11–12 | "Low-contrast text", "High-contrast text" |

Radix's semantic pairings: error red, success green, warning yellow, amber or orange, info blue. For a brand colour it advises "adding custom scales alongside Radix scales" and a gray "saturated with the hue closest to your accent hue".

**Material 3:** `--md-sys-color-<token>` for primary, secondary, tertiary and error, each with a `-container`; a surface family (`surface-container-lowest` to `-highest`), `outline` and `outline-variant`. "All tokens have a corresponding `--md-sys-color-on-<token>` for content color with accessible contrast."

Neither system says how to pick the brand hue. That comes from the brief's subject (DESIGN-004); the roles keep the result consistent across pages.

## [DESIGN-016] Generating a palette in OKLCH, to contrast targets
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Tailwind CSS v4.0 (2025-01-22)](https://tailwindcss.com/blog/tailwindcss-v4), [Tailwind: colors](https://tailwindcss.com/docs/colors), [MDN: oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch), [Leonardo contrast-colors README](https://github.com/adobe/leonardo/blob/main/packages/contrast-colors/README.md), [Material Web: color](https://github.com/material-components/material-web/blob/main/docs/theming/color.md), [Evil Martians: OKLCH in CSS (community)](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)
- Related: DESIGN-015, DESIGN-017, DESIGN-018, DESIGN-019, DESIGN-007

**Why OKLCH.** Equal steps in its L look equally different, unlike HSL: "it uses perceptual lightness" (Evil Martians). Tailwind v4.0 "upgraded the entire default color palette from rgb to oklch"; each hue has "11 steps, with 50 being the lightest, and 950 being the darkest", e.g. `--color-blue-500: oklch(62.3% 0.214 259.815)`. MDN: `oklch()` has been "available across browsers since May 2023".

**Three documented generators:**
- **Leonardo** generates colours to hit contrast ratios against a background: `colorKeys: ['#5CDBFF', '#0000FF']`, `ratios: [3, 4.5]`, and a theme `lightness` "from 0-100". Its interpolation spaces are LCH, LAB, CAM02, HSL, HSLuv, HSV and RGB; OKLCH isn't listed.
- **Material:** "From five key colors, roles are automatically assigned"; `material-color-utilities` (HCT) does it at runtime.
- **Radix's custom palette tool** expands "a couple reference colors" into a 12-step scale.

**For Claude:** compute the palette in a script with one of the libraries in DESIGN-019 and print each role's contrast against its background, instead of choosing hexes by feel. The contrast targets are in DESIGN-017.

## [DESIGN-017] Contrast: target WCAG 2 ratios; WCAG 3 hasn't picked an algorithm
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [WCAG 3.0 Working Draft, 2026-09-10](https://www.w3.org/TR/wcag-3.0/), [APCA README](https://github.com/Myndex/apca-w3/blob/master/README.md), [Radix Colors: understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale), [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- Related: DESIGN-007, DESIGN-016, DESIGN-019

- **WCAG 2.2 AA** is the target: 4.5:1 for body text, 3:1 for large text and UI parts (DESIGN-007).
- **WCAG 3** (Working Draft, 10 September 2026): "The contrast algorithm used in WCAG 3 is yet to be determined." The draft doesn't mention APCA. "WCAG 3 does not replace WCAG 2."
- **APCA** returns a lightness contrast (Lc) of about −108 to 106. Its own README: "standards that will be incorporating APCA are still developmental." `apca-w3` 0.1.9 was last published 2022-07-04, under a "Limited W3 License".
- **Radix** tunes its text steps to APCA: "guaranteed to Lc 60 and Lc 90 APCA contrast ratio on top of a step 2 background".

**For Claude:** pass and fail on WCAG 2 ratios. APCA can be a second, perceptual check (dark mode, thin type), never a conformance claim.

## [DESIGN-018] Deriving dark mode
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Radix Colors: usage](https://www.radix-ui.com/colors/docs/overview/usage), [Material Components Android: color theming](https://github.com/material-components/material-components-android/blob/master/docs/theming/Color.md), [Leonardo contrast-colors README](https://github.com/adobe/leonardo/blob/main/packages/contrast-colors/README.md), [MDN: light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark), [Tailwind: colors](https://tailwindcss.com/docs/colors)
- Related: DESIGN-015, DESIGN-016, DESIGN-017

Dark mode keeps the roles and re-picks the tones; it isn't the light palette inverted.
- **Radix** ships a separate dark scale per hue (`@import "@radix-ui/colors/blue-dark.css"`, applied by a `.dark` class) with the same step meanings, so a role keeps its step number.
- **Material** takes another tone of the same palette per role: primary is tone 40 in light and 80 in dark, surface neutral 98 and 6, on-surface neutral 10 and 90.
- **Leonardo** regenerates the theme at a lower `lightness` with the same contrast ratios.
- **CSS:** `light-dark(<light>, <dark>)` "works across the latest devices and browser versions" since May 2024, and needs `color-scheme: light dark`, "usually set on the :root pseudo-class". Tailwind's docs show semantic variables redefined under `[data-theme="dark"]`.

**For Claude:** define both modes as values of the same role tokens, then check contrast in each mode separately (DESIGN-007); a pair that passes in light often fails in dark.

## [DESIGN-019] Colour libraries Claude can call from a script or an artifact
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [npm registry](https://registry.npmjs.org/), [culori](https://culorijs.org/), [Leonardo](https://github.com/adobe/leonardo), [Radix Colors](https://www.radix-ui.com/colors), [material-color-utilities](https://github.com/material-foundation/material-color-utilities), [Color.js](https://colorjs.io/), [utopia-core](https://www.npmjs.com/package/utopia-core)
- Related: DESIGN-016, DESIGN-017, DESIGN-020, SURF-016

Latest versions from the npm registry on 2026-10-16. "CDN" means the reader got HTTP 200 from jsDelivr (`+esm` or a bundled file), so an artifact can import it (artifacts allow jsDelivr `/npm/`, SURF-016).

| Package | Version, published | Licence | Does |
|---|---|---|---|
| `culori` | 4.0.2, 2025-06-27 | MIT | Parse, convert (OKLCH), interpolate, gamut-map, contrast |
| `colorjs.io` | 0.7.1, 2026-07-24 | MIT | Conversion, gamut mapping, WCAG 2 and APCA contrast |
| `@adobe/leonardo-contrast-colors` | 1.1.0, 2026-02-18 | Apache-2.0 | Colours generated to target contrast ratios |
| `@material/material-color-utilities` | 0.4.0, 2026-01-21 | Apache-2.0 | HCT, tonal palettes, Material schemes |
| `@radix-ui/colors` | 3.0.0, 2023-10-02 | MIT | Static 12-step scales, light and dark, P3 |
| `apca-w3` | 0.1.9, 2022-07-04 | Limited W3 License | APCA Lc only; unmaintained since 2022 |
| `utopia-core` | 1.6.0, 2024-09-19 | ISC | Utopia's fluid type and space maths (DESIGN-020) |

All loaded over the CDN except `@radix-ui/colors`, which loads per-scale CSS files (`blue.css`) but not an `index.css`. For a one-off palette, `culori` or `colorjs.io` in a Node script is enough; Leonardo when the ratios are the spec. Not run by us: behaviour is as each README describes.

## [DESIGN-020] Type: a fluid scale and a measured line length
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Utopia](https://utopia.fyi/), [Utopia type calculator](https://utopia.fyi/type/calculator/), [webtypography.net 2.1.2, quoting Bringhurst](https://webtypography.net/2.1.2), [Butterick: line length](https://practicaltypography.com/line-length.html), [Butterick: point size](https://practicaltypography.com/point-size.html), [WCAG 2.2 Understanding 1.4.8](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html), [MDN: text-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap), [Google Fonts Knowledge source (google/fonts, `cc-by-sa/knowledge`)](https://github.com/google/fonts/tree/main/cc-by-sa/knowledge)
- Related: DESIGN-004, DESIGN-005, DESIGN-019, DESIGN-021, DESIGN-032, DESIGN-033, DESIGN-034

**Scale.** Utopia defines one modular scale for a small screen and one for a large screen and lets `clamp()` interpolate. The calculator's default, `360,18,1.2,1240,20,1.25,5,2`, is a 360 px viewport at 18 px and ratio 1.2 ("Minor Third"), a 1240 px viewport at 20 px and ratio 1.25 ("Major Third"), 5 steps up and 2 down. It outputs `--step-0: clamp(1.125rem, 1.0739rem + 0.2273vw, 1.25rem)`. Butterick: body text "on the web, the optimal size is 15–25 pixels".

**Line length:**
- Bringhurst: "Anything from 45 to 75 characters is widely regarded as a satisfactory length… The 66-character line… is widely regarded as ideal." For columns, "40 to 50".
- Butterick: "45–90 characters, including spaces".
- WCAG 1.4.8 (AAA): "no more than 80 characters". frontend-design asks for under 80.

**Wrapping:** `text-wrap: balance` for headings (Chromium balances six lines or fewer); `pretty` for paragraphs, which "has a negative effect on performance".

**Typefaces:** Google Fonts Knowledge renders in JavaScript, but its lessons are Markdown in google/fonts under `cc-by-sa/knowledge/modules/<module>/lessons/<lesson>/content.md`, readable from raw.githubusercontent.com (found 2026-10-18). Its "Choosing type" module covers choosing, pairing (DESIGN-033) and optical sizes (DESIGN-032); numerals are in DESIGN-034. We found no source that ranks overused Google Fonts. Pick by role and subject (DESIGN-004), and record the choice as a token.

## [DESIGN-021] Token files: the DTCG format and three tiers
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [DTCG Format 2025.10](https://www.designtokens.org/TR/2025.10/format/), [DTCG Color 2025.10](https://www.designtokens.org/TR/2025.10/color/), [Material Web: theming](https://github.com/material-components/material-web/blob/main/docs/theming/README.md), [Style Dictionary: DTCG](https://styledictionary.com/info/dtcg/), [Terrazzo docs](https://terrazzo.app/docs/), [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- Related: DESIGN-006, DSKILL-001, DESIGN-015, DESIGN-024

**DTCG.** The Design Tokens Community Group's format 2025.10 is a "Final Community Group Report 28 October 2025", "considered stable", and "not a W3C Standard nor is it on the W3C Standards Track". A token is `{"$value": …, "$type": …}`; groups nest; aliases are `"{colors.blue}"`. Types include color (with an `oklch` colour space in the Color module), dimension, fontFamily, fontWeight, duration, cubicBezier, number, and composites: border, shadow, gradient, transition, typography. The `/tr/drafts/` copy is a preview: "Do not attempt to implement".

**Tools:** Style Dictionary 5.7.0 ("the latest format 2025.10 does not have full support yet"); Terrazzo `@terrazzo/cli` 2.9.0, which has a `check` command for DTCG files.

**Tiers** (Material): reference tokens "hold concrete values"; system tokens "define decisions and roles"; component tokens map to system tokens (`--md-ref-typeface-brand`, `--md-sys-color-primary`, `--md-filled-button-container-shape`).

**For Claude:** the format matters less than the tiers. Claude should use only system (role) tokens in components, so changing a reference value restyles every page. A Tailwind v4 `@theme` block or plain CSS custom properties can hold the same tiers without a build step.

## [DESIGN-022] Layout: name the structure, then encode the wireframe
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Lovable: design guidance](https://docs.lovable.dev/features/design-guidance), [OpenAI: designing frontends with GPT-5.4](https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4), [Every Layout: layouts](https://every-layout.dev/layouts/), [MDN: grid template areas](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Grid_template_areas), [NN/g: F-shaped pattern](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/), [web-features 3.43.0](https://www.npmjs.com/package/web-features)
- Related: DESIGN-003, DESIGN-004, DESIGN-024, DESIGN-027

"Landing page" gets the hero, three cards and a CTA. Name a structure instead. Lovable's layout vocabulary: "hero grid, single column, split screen, sidebar, masonry, bento grid, magazine, dashboard, full-width sections, zigzag, card grid, asymmetric, broken grid, feed, or gallery."

**Card and section rules** from OpenAI's guide for its own models (another vendor's, not tested on Claude):
- "Cards: Default: no cards." "If removing a border, shadow, background, or radius does not hurt interaction or understanding, it should not be a card."
- "One job per section."
- "Brand test: If the first viewport could belong to another brand after removing the nav, the branding is too weak."

**Wireframe to code.** frontend-design asks for ASCII wireframes (DESIGN-004). Have Claude carry them into `grid-template-areas`, which MDN says "allows you to visualize what your element looks like in the code" (`"a a a" "b c c"`). For components, Every Layout's 13 primitives (Stack, Box, Center, Cluster, Sidebar, Switcher, Cover, Grid, Frame, Reel, Imposter, Icon, Container) avoid breakpoint hacks.

**Reading patterns:** NN/g says the F-pattern "is not the only scanning pattern": in a layer-cake pattern the eyes scan headings and subheadings and skip the text below. Headings then have to carry the page.

**Baseline** (web-features 3.43.0): `subgrid` became widely available on 2026-03-15 and container size queries on 2025-08-14. Container style queries are only newly available (2026-05-19).

## [DESIGN-023] Tailwind and shadcn/ui defaults, and theming them away
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Tailwind `theme.css`](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/theme.css), [Tailwind: theme variables](https://tailwindcss.com/docs/theme), [shadcn/ui: theming](https://ui.shadcn.com/docs/theming), [shadcn changelog: shadcn create (2025-12-12)](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/changelog/2025-12-shadcn-create.mdx), [shadcn/ui: skills](https://ui.shadcn.com/docs/skills)
- Related: DESIGN-003, DESIGN-014, DESIGN-015, DESIGN-021

**The shared look.** Tailwind 4.3.3's defaults: a system `--font-sans` stack, radii from `--radius-xs: 0.125rem` to `--radius-4xl: 2rem`, shadows of black at 5% to 25% alpha (`--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), …`), and an OKLCH palette. shadcn's default theme (CLI 4.22.0) has achromatic surfaces and primary: `--background: oklch(1 0 0)`, `--primary: oklch(0.205 0 0)`, `--radius: 0.625rem`, with every radius derived from it. Its dark mode adds indigo and purple: `--chart-1` and `--sidebar-primary` at hue 264, `--chart-4` at 304. Its author, 2025-12-12: "somewhere along the way, all apps started looking the same. I guess the defaults were a little _too_ good. My bad."

**Theming away:**
- Tailwind v4: "To completely override an entire namespace… set the entire namespace to `initial`". `@theme { --color-*: initial; … }` removes every default colour utility; `--*: initial` removes the whole default theme.
- shadcn: edit the CSS variables, or pick a style and preset with `npx shadcn create`, which "rewrites the component code to match your setup". There are eight styles (Vega, Nova, Maia, Lyra, Mira, Luma, Sera, Rhea); base colours are Neutral, Stone, Zinc, Mauve, Olive, Mist and Taupe.

**For Claude:** in a Tailwind or shadcn project, replace the colour, font, radius and shadow namespaces from the repo's tokens before generating pages (DESIGN-021). Otherwise every page inherits the stock look. Anthropic's web-artifacts-builder starts from stock shadcn too (DESIGN-014). shadcn's own skill (`npx skills add shadcn/ui`) explains its theming to Claude Code, but doesn't pick a direction for you.

## [DESIGN-024] Coherent multi-page sites: tokens, inventory, templates, drift checks
- Type: pattern
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-16
- Sources: [Atomic Design, chapter 2](https://atomicdesign.bradfrost.com/chapter-2/), [Cursor for designers](https://cursor.com/for/designers), [v0 docs: Design Systems 2.0](https://v0.app/docs/llms.txt), [Lovable: design systems](https://docs.lovable.dev/features/design-systems), [Project Wallace css-analyzer](https://github.com/projectwallace/css-analyzer), [Playwright: visual comparisons](https://playwright.dev/docs/test-snapshots)
- Related: DESIGN-006, DESIGN-010, DESIGN-021, DESIGN-007, REPO-021, REPO-044

**Give every session the same three things**, in CLAUDE.md or a repo skill (DESIGN-006):
1. The token file, roles only (DESIGN-021).
2. A component inventory: which components exist and when to use each.
3. Page templates. Atomic Design: "Templates are page-level objects that place components into a layout"; pages are templates with real content and "are essential for testing the effectiveness of the underlying design system".

Other vendors do the same. Cursor: "Use rules files to encode your design system", with rules such as "Never create custom buttons, inputs, or modals". v0 saves a design system as a skill: "an adapter that tells v0 where your source lives, which components, props, and tokens are safe to use". Lovable checks ongoing work for "raw colors, custom or customized components".

**Check for drift** on every page, not only the new one:
- **Computed styles** across pages: unique colours, font sizes and spacing values outside the tokens (DESIGN-007).
- **CSS analysis:** `@projectwallace/css-analyzer` 9.9.4 reports "200+ metrics", with unique counts and "uniqueness ratios" per category.
- **Visual regression:** Playwright's `toHaveScreenshot()` compares against reference screenshots after the first run.
- **Lint:** Stylelint 17.16.0's `declaration-property-value-allowed-list`, or the community `stylelint-declaration-strict-value`, can require `var(--…)` instead of raw values.

A checker subagent can run these and return numbers (REPO-021).

## [DESIGN-025] Critique and variants: diverge, pick, then score
- Type: pattern
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-16
- Sources: [Dow et al.: parallel prototyping (submitted version)](https://hci.stanford.edu/publications/2010/parallel-prototyping/ParallelPrototyping2010-submitted.pdf), [Design Council: the Double Diamond](https://www.designcouncil.org.uk/our-resources/the-double-diamond/), [NN/g: 10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/), [NN/g: design critiques](https://www.nngroup.com/articles/design-critiques/), [Impeccable: critique.md](https://github.com/pbakaus/impeccable/blob/main/.agent/skills/impeccable/reference/critique.md), [OneRedOak: design-review agent](https://github.com/OneRedOak/claude-code-workflows/blob/main/design-review/design-review-agent.md)
- Related: DESIGN-001, DESIGN-004, DESIGN-009, DSKILL-001, DESIGN-027, DESIGN-029, REPO-021

**Diverge before refining.** Dow et al. (2010): novice designers who made several prototypes before feedback beat those who refined one at a time, "as measured by click-through data and expert ratings", and raters "found Parallel prototypes to be more diverse". The Double Diamond's second diamond "encourages people to give different answers to the clearly defined problem". So ask for 3–4 directions (DESIGN-004) and have a person pick, shown as swatches and type samples rather than hex codes and font names. In our tests, half of Claude's proposed directions repeated across runs (DESIGN-029), and its own pick added template chrome (DESIGN-027).

**Score against a rubric, not taste.** NN/g: critiques need "Agreed-upon design objectives for the work"; "Without these, any feedback is subjective and baseless."
- Impeccable's critique scores Nielsen's ten heuristics 0–4 ("Most real interfaces score 20-32 out of 40") and starts with a "Design Specificity Verdict": "Does the result feel authored for this product, or category-interchangeable?"
- OneRedOak's reviewer runs phases from interaction flow to accessibility and triages "[Blocker]" to "[Nitpick]". Its principles file is a SaaS-dashboard checklist ("Persistent Left Sidebar"), so it would bias a marketing-site review.

**For Claude:** score in a subagent against the brief's objectives plus the specificity question, and cite measured values (DESIGN-007).

## [DESIGN-026] Measured originality of LLM-generated UI
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-16
- Sources: [Design Creativity Bench, arXiv 2610.11539 (2026-10-08)](https://arxiv.org/abs/2610.11539), [Enabling Creative Exploration for Vibe Design Agents, arXiv 2609.15078 (2026-09-14)](https://arxiv.org/abs/2609.15078), [Interrogating Design Homogenization in Web Vibe Coding, arXiv 2603.13036](https://arxiv.org/abs/2603.13036), [Design2Code, arXiv 2403.03163](https://arxiv.org/abs/2403.03163), [WebDev Arena](https://news.lmarena.ai/webdev-arena)
- Related: DESIGN-003, DESIGN-011, DESIGN-025, DESIGN-027

**Design Creativity Bench** (arXiv 2610.11539 v2; "All authors are affiliated with Kombai Inc.", a UI-generation vendor; a preprint): 15 models, 160 designs each over 80 tasks, default prompts. The score is `0.9 S_IA + 0.1 S_colour`, mostly information architecture, with embeddings trained to be "invariant to color systems", so it says little about palette or type.
- "Originality is 0.592 for same-prompt design pairs from different models… far below the 0.764 for same-prompt human-model pairs": different labs' models resemble each other more than human designs.
- Claude Opus 5.5 is in the bottom group on originality (13th of 15, 0.557; ranks 12 to 15 overlap) and 11th on creative range across its own briefs, yet first on meeting brief criteria (99.2%, GPT-6 Astra 99.1%).
- "No diversity-seeking prompting was attempted", so it can't say whether prompting helps.

**A measured mitigation** (arXiv 2609.15078, Google Labs, a non-Claude generator): propose three specs "with typicality weights", let an external policy sample one, build it. Over 168 prompts, coverage rose "from one option to nearly three", but "These labels do not verify unique rendered designs". Screenshot similarity fell from 0.6765 to about 0.58; judged preference didn't clearly improve, and a production A/B test found "no detectable gains in exports or task completion".

**Other benchmarks:** Design2Code scores fidelity to a reference screenshot; WebDev Arena ranks pairwise preference. Neither measures diversity.

**For us:** no model came near human originality, and Opus 5.5 and Sonnet 5.5 gave the same default page in our test (DESIGN-027). Work on the prompt and process (DESIGN-004) before switching models.

## [DESIGN-027] Test: four prompting strategies on one brief
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-16
- Sources: [Prompting Claude Opus 5.5: frontend design defaults](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5), [Prompting Claude Sonnet 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), local test
- Related: DESIGN-003, DESIGN-004, DESIGN-025, DESIGN-026, DESIGN-028, PROMPT-009

**Setup.** One brief (below) plus: S0 nothing; S1 the Opus 5.5 page's banned list; S2 the Sonnet 5 page's four directions, self-picked; S3 frontend-design's two passes without its list of default looks. Sonnet 5.5, 5 runs each; Opus 5.5, 3 runs of S0 and S2; default effort. Brief and S2 suffix:

```text
Create a single self-contained HTML file named index.html in the current directory: a landing page for a neighbourhood bakery's weekly bread subscription. Facts: the bakery is called Hollow Oak, a small sourdough bakery on a residential street. Subscribers choose one, two or three loaves a week (€9, €17 or €24 a week), collect on Saturday morning or get bike delivery within 3 km, and can pause or skip any week. The page explains the subscription, shows the plans and lets people sign up with a form. Inline all CSS and JS. You may load fonts from Google Fonts; use no other external resources and no images. Write the file with the Write tool, then stop.

Before building, propose 4 distinct visual directions tailored to this brief (each as: bg hex / accent hex / typeface, plus a one-line rationale). Then pick the direction least like the generic default you would produce for any similar page, say which and why, and implement only that direction.
```

| | S0 | S1 | S2 | S3 | Opus S0 | Opus S2 |
|---|---|---|---|---|---|---|
| Headline fonts | 1 | 1 | 4 | 3 | 1 | 3 |
| Accent ΔE (pairwise mean) | 0.06 | 0.14 | 0.40 | 0.22 | 0.06 | 0.33 |
| Runs: monospace labels | 0 | 0 | 5 | 5 | 0 | 3 |
| Runs: accented headline word | 1 | 2 | 5 | 5 | 3 | 3 |

**Findings:**
1. The bare brief gave one page five times: cream, Fraunces, brown pills (DESIGN-003's first look). Opus 5.5 too.
2. The banned list was obeyed; every run moved to one new look: dark green, amber, Fraunces.
3. Directions-first varied most on both models, but added template chrome (monospace labels, middle-dot eyebrows) and paper props (dockets, order slips) in 6 of 8 runs.
4. The two passes stayed near cream and vermilion: the review misses defaults it isn't told about.
5. Copy converged: "every Saturday" in 12 of 20 headlines.

**So:** directions first, a person picks, and a banned list grown from the last result. Small samples, unrated quality.

Tested 2026-10-16, v2.1.296, terminal `-p` launched from desktop WSL, 19:05–19:21 UTC: 26 runs, $5.36 (about $0.13 a Sonnet run, $0.44 an Opus run), isolated as in DESIGN-028. Measured with Playwright 1.63 at 1280 px (`getComputedStyle`, OKLab ΔE); the lead judged screenshots.

## [DESIGN-028] Isolating scripted design tests from your own setup
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [CLI reference: --safe-mode, --disable-slash-commands, --tools, --bare](https://code.claude.com/docs/en/cli-reference), [Run Claude Code programmatically: costs when resuming](https://code.claude.com/docs/en/headless), local test
- Related: DESIGN-027, DESIGN-001, MEM-028, SKILL-048

A prompt test in `claude -p` picks up your CLAUDE.md, plugins (frontend-design), skills and output style unless you strip them. With a claude.ai login `--bare` is out: its help says "Anthropic auth is strictly ANTHROPIC_API_KEY or apiKeyHelper". What worked:

```bash
claude -p "$(cat prompt.txt)" --model claude-sonnet-5-5 --safe-mode --disable-slash-commands \
  --settings '{"outputStyle":"default"}' --tools "Read,Write,Edit" --permission-mode acceptEdits \
  --strict-mcp-config --max-turns 8 --max-budget-usd 1.5 --output-format json
```

- `--safe-mode`: the docs say CLAUDE.md, skills, plugins and "output styles… do not load". In the probe, CLAUDE.md and plugin skills went, but bundled skills (`artifact-design`, `dataviz`) and the user's chosen Concise output style stayed.
- `--disable-slash-commands` ("Disable all skills and commands") removed the bundled skills.
- `--settings '{"outputStyle":"default"}'` removed the output style.
- `--tools` dropped the Artifact tool, which a `-p` child of a desktop session otherwise gets (DESIGN-001).

Check with a Haiku probe that asks the model to list its skills and quote its CLAUDE.md's first heading. `--output-format json` gives each run's cost and duration, but not its intermediate messages (S2's directions and S3's plans weren't kept). After `--resume`, `total_cost_usd` is the whole conversation's: the headless docs say it includes "earlier runs' spend", so don't add the runs up.

Tested 2026-10-16, v2.1.296, terminal `-p` launched from desktop WSL.

## [DESIGN-029] Test: four directions, then a person picks
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-16
- Sources: [Prompting Claude Sonnet 5: design and frontend defaults](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5), [Lovable: design guidance](https://docs.lovable.dev/features/design-guidance), local test
- Related: DESIGN-027, DESIGN-030, DESIGN-025, DESIGN-004, DESIGN-001, DESIGN-028

**Setup.** DESIGN-027's brief and flags, Sonnet 5.5, 5 runs, with the Sonnet 5 page's prompt verbatim: "Before building, propose 4 distinct visual directions… Ask the user to pick one, then implement only that direction." Each run stopped after proposing; the user picked from the text, and `--resume` built the pick in the same session.

**The options repeat.** In all 5 runs, direction 1 was "Flour & Crust" (cream, terracotta, Fraunces with Inter) and direction 2 a dark oak green with honey gold (Cormorant Garamond with Work Sans), with near-identical hex values. Only directions 3 and 4 varied: a chalkboard three times, a rose palette twice, paper or bulletin styles. So half of the 20 options were two looks.

**The picks:** Flour & Crust twice, a chalkboard twice, a kraft-paper ledger once. Each build followed its pick; monospace appeared only where the pick named a typewriter face. Background ΔE (pairwise mean) was 0.42, the highest of any strategy, yet the five pages were three looks, the default twice. The layout still converged (hero on the left, two buttons, numbered steps), and "every Saturday" headed 3 of 5 pages.

**Picking was hard:** the user said hex codes and font names weren't readable. Show directions as swatches and type samples, as Lovable does ("Options appear as color swatches, font samples, and layout wireframes"), for example in an artifact (DESIGN-001).

**So:** a person's pick chooses among Claude's options and adds none. Seed the options (ban the repeat looks, name layouts) and show them visually, as DESIGN-030 tests.

Tested 2026-10-16, v2.1.296, terminal `-p` launched from desktop WSL, 19:39–19:46 UTC: 5 proposals and 5 builds, $0.58 in all.

## [DESIGN-030] Tests: from a visual chooser to staged picks
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-16
- Sources: [Lovable: design guidance](https://docs.lovable.dev/features/design-guidance), [Prompting Claude Sonnet 5: design and frontend defaults](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [Run Claude Code programmatically: continue conversations](https://code.claude.com/docs/en/headless), local tests
- Related: DESIGN-029, DESIGN-031, DESIGN-027, DESIGN-004, DESIGN-022, DESIGN-003, DESIGN-028

Three follow-ups to DESIGN-029 on Sonnet 5.5, isolated as in DESIGN-028. The user picked from screenshots, and each pick was sent as written with `--resume`.
1. **One-page chooser** (the bakery, 5 runs): four directions as swatches, type samples and a layout sketch, with DESIGN-029's two repeat looks banned.
2. **Four steps** (the bakery, one session): steps 4 to 7 below, plus the bans.
3. **Seven steps** (a bouldering gym, one session), the user's method:

```text
Work in seven stages, and stop after each of the first six so I can pick. Make the options in each stage clearly different from each other, and tailored to this brief. I may keep more than one option at a stage. I compare by eye, so show every option visually; hex codes and font names may appear but must not be needed.

1. Audience. Write audience.html showing 5 audiences this page could be aimed at, side by side. For each: a name, who they are, what they want from a gym, and what would put them off.
2. Feel. Write feel.html showing 10 feels for the design (for example fancy, sporty, artisanal, modern). For each: the word, one line on what it means here, and a small visual hint made of plain shapes, in the system font.
3. Tone of voice. Write tone.html showing 5 tones of voice side by side, each as the same content written in that voice: a headline, a short paragraph, a button label and a price line. Use the system font and no colour, so only the words differ.
4. Colour. Write palettes.html showing 20 colour palettes of 4 to 8 colours each, fitting the picks so far. Show each palette as a row of plain squares next to each other, with only its number and name: no mock-up, sample text or labels. Put the background colour first.
5. Type. Write fonts.html showing 5 font pairings from Google Fonts side by side, in the picked colours. For each: a name, a plain-words line on its character, and the same sample headline, paragraph, price and button, written in the picked tone and set in its fonts.
6. Layout. Write layouts.html showing 5 page layouts side by side, as grey wireframes of the whole page from top to bottom, with every section labelled. Each must differ in structure and section order, not only in the top section. Use no colour or fonts from the earlier stages, so only the structure differs.
7. Combine the picks into 5 variants of the full page, variant-1.html to variant-5.html, with all copy written for the picked audience in the picked tone. Keep the picks; vary the details: spacing and density, corner shapes, how the accent is used, decoration, and the headline treatment.

Start with stage 1 now.
```

| | Chooser | 4 steps | 7 steps |
|---|---|---|---|
| Result | five different looks | 4 of 5 variants good starts | "all except 4 look amazing" |
| Still converged | one section skeleton; every run offered blue, pastel, dark and paper options | "every Saturday" in 4 of 5 headlines | layout ideas and fonts matched the bakery's |
| Cost | $1.01 | $0.90 | $0.98 |

**Notes.** The user kept several options per step. Claude asked three times for fewer, then spread the variants over them, but blended three kept tones inside each page. The tone step replaced the stock copy.

**So:** guide a person through one small choice at a time instead of generating whole designs. The user's refinement is untested: five options per step, with new batches until at least three are kept (FreekMencke/claude-skills#75).

Tested 2026-10-16, v2.1.296, terminal `-p` launched from desktop WSL: 19:50–19:57, 20:05–20:17 and 20:34–20:51 UTC. A resumed run's cost includes the earlier runs (DESIGN-028). The final 7-step stage used 14 of 15 turns.

## [DESIGN-031] Staged picks on an existing site: extract, then lock, nudge or open each step
- Type: pattern
- Applies to: Claude Code
- Confidence: unverified
- Last verified: 2026-10-16
- Sources: [Set up your design system](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design), [Artifacts: compare alternatives](https://code.claude.com/docs/en/artifacts), local tests (DESIGN-030)
- Related: DESIGN-030, DESIGN-009, DESIGN-010, DESIGN-006, DESIGN-024, DESIGN-021

DESIGN-030's steps assume a blank page. On an existing site, treat what exists as the first set of picks. This is our synthesis, untested: every test built a new page.

1. **Extract** (DESIGN-010): Claude reads the theme files, components and real pages, and writes the current audience, feel, tone (quoted from real copy), colour roles, fonts and layouts in use. Anthropic: "Include real examples, not just specs."
2. **Lock, nudge or open each step:**

| Job | Steps to run |
|---|---|
| A new page on the site | Layout, plus tone for new copy. The rest is locked; wireframes use the site's own components, and the variants its tokens. |
| A refresh | Only the steps that should move. Option 1 is the current choice; the others stay near it. |
| A redesign | All seven, with the current choice among the options of each (DESIGN-009). |

3. **Show options in the site's own CSS and components**, in an artifact or a scratch page, not on a generic mock-up.
4. **Write the picks back** into the tokens and the repo's design skill, with audience, feel and tone as a few lines, so later sessions don't re-decide them and drift checks have a reference (DESIGN-006, DESIGN-024).

## [DESIGN-032] Optical sizes: when they matter, and what browsers do with `opsz`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Google Fonts Knowledge: choosing typefaces that have optical sizes](https://fonts.google.com/knowledge/choosing_type/choosing_typefaces_that_have_optical_sizes), [Google Fonts Knowledge: optical size axis](https://fonts.google.com/knowledge/glossary/optical_size_axis), [OpenType: the `opsz` axis](https://learn.microsoft.com/en-us/typography/opentype/spec/dvaraxistag_opsz), [CSS Fonts 4: `font-optical-sizing`](https://drafts.csswg.org/css-fonts-4/#font-optical-sizing-def), [MDN: font-optical-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-optical-sizing), [web-features 3.43.0](https://www.npmjs.com/package/web-features)
- Related: DESIGN-020, DESIGN-033, DESIGN-035, FONT-023, FONT-006

Optical sizes are versions of a face drawn for a size. Small ones "have less stroke contrast, larger x-heights, wider characters, and more open spacing" (Google Fonts Knowledge).

**When they matter:** when one family runs from captions to display sizes: "if we're creating a brand that will require text to be set very small and also very large, optical sizes will undoubtedly be useful." The axis costs bytes: "the font file-size will typically double… it can range between 1.2× and 2.6×". The axis range caps the effect: `opsz` runs 14–32 in Inter, 7–72 in Literata, 9–144 in Fraunces (google/fonts files).

**What browsers do:** nothing to write. `font-optical-sizing: auto` is the initial value, Baseline widely available since 2022-09-24 (web-features 3.43.0). The units differ: OpenType values "can be interpreted as text size, in typographic points"; CSS Fonts 4 expects a value "close to the used value for 'font-size'", clamped to the font's range, and Google's glossary says browsers "match it to the CSS `px` unit". So 16 px text gets `opsz` 16, not 12 (OVERLAPS.md, Resolved conflicts). To choose another value, such as the sturdier body size Google suggests for TV screens, `font-variation-settings: 'opsz' N` is the only route (FONT-023's override caveat applies).

Google Fonts serves the axis only when the URL names it (DESIGN-035).

Tested 2026-10-18, Chrome 155.0.8059.39 headless, Literata `[opsz,wght]` from google/fonts, one line at 24 px: `auto` measured 331.13 px wide, the same as `'opsz' 24` (18: 331.56; 7: 368.28). At 72 px, `auto` matched `'opsz' 72`.

## [DESIGN-033] Pairing typefaces: one family first, then a second face with a job
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Google Fonts Knowledge: pairing typefaces](https://fonts.google.com/knowledge/choosing_type/pairing_typefaces), [… based on their construction (the font matrix)](https://fonts.google.com/knowledge/choosing_type/pairing_typefaces_based_on_their_construction_using_the_font_matrix), [… within a family or superfamily](https://fonts.google.com/knowledge/choosing_type/pairing_typefaces_within_a_family_superfamily), [Butterick: mixing fonts](https://practicaltypography.com/mixing-fonts.html)
- Related: DESIGN-004, DESIGN-020, DESIGN-030, DESIGN-032, DESIGN-034, DESIGN-003

**First ask whether you need a second face.** Google: "Do we really need a secondary typeface?" Try the primary's weights, widths, optical sizes, size, case and tracking first. Butterick: "Mixing fonts is never a requirement… Most documents can tolerate a second font. Few can tolerate a third." Google's reasons for one: a change of context (data beside editorial text), a brand voice the primary can't carry, missing weights, widths or italics, and missing features or languages.

**Rules with a source:**
- *Distinct, not competing.* Jason Santa Maria, quoted by Google: "choose typefaces that don't compete too much with each other, but aren't so similar as to be indistinguishable… When in doubt […] pair a serif and a sans serif." Butterick denies serif-plus-sans is required: "it's not true… lower contrast between fonts can be more effective". Use it as the fallback, not the rule.
- *The font matrix* (Indra Kupferschmid, via Google): describe each face's skeleton (dynamic, rational or geometric) and flesh (contrast, serifs). "Pair typefaces with similar form models"; "Avoid combinations with different form models, but the same contrast and serifs".
- *Shortcuts:* a superfamily (Merriweather with Merriweather Sans, Nunito with Nunito Sans), or one designer, which Butterick says "works reliably".
- *Roles:* "each font has a consistent role"; change fonts only at paragraph breaks.

**For Claude:** name each face's role and why the pair works (form model, shared x-height), show candidates in real copy (DESIGN-030, step 5), and check both files have the numeral features the UI needs (DESIGN-034).

## [DESIGN-034] Numerals and `case` in a UI: tabular for data, `case` for capitals
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Google Fonts Knowledge: understanding numerals](https://fonts.google.com/knowledge/introducing_type/understanding_numerals), [MDN: font-variant-numeric](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variant-numeric), [OpenType feature registry: `case`](https://learn.microsoft.com/en-us/typography/opentype/spec/features_ae#tag-case), [Butterick: alternate figures](https://practicaltypography.com/alternate-figures.html), [web-features 3.43.0](https://www.npmjs.com/package/web-features)
- Related: FONT-023, FONT-019, DESIGN-033, DESIGN-035, DESIGN-006, OG-003

Figures are proportional or tabular, and lining or oldstyle. The default is safe: "It's never wrong to use the default figures in your font" (Butterick).

| Where | CSS (feature) | Why |
|---|---|---|
| Table columns, prices, stats, timers, values that update | `font-variant-numeric: tabular-nums` (`tnum`) | Numbers that "might change, but need to stay aligned, such as in an app's countdown timer" (Google) |
| Running text | default | "In body text, proportional figures are preferred" (Butterick) |
| Long-form serif reading | `oldstyle-nums` (`onum`), optional | They "don't interrupt the flow of reading lowercase characters" (Google); never with capitals |
| All-caps labels, buttons, eyebrows | `font-feature-settings: "case"` | Shifts "punctuation marks up to a position that works better with all-capital sequences… also changes oldstyle figures to lining figures" (OpenType registry) |
| Codes, IDs, keys | `slashed-zero` (`zero`) | "when a clear distinction between O and 0 is needed" (MDN) |

`font-variant-numeric` is Baseline widely available since 2022-07-15 (web-features 3.43.0); `case` has no high-level property (FONT-023).

**A property does nothing when the font lacks the feature.** Check the file, or use Butterick's test: "type a line of zeroes above a line of ones. If they're the same length, then your font has tabular figures."

Tested 2026-10-18, fontTools 4.46.0, files from google/fonts: Fraunces (Claude's default display face, DESIGN-027) has `case` but no `tnum`, `lnum` or `onum`; Inter has `tnum`, `case` and `zero`; Literata has all five (`tnum`, `lnum`, `onum`, `case`, `zero`); Roboto Flex's default figures are already tabular. Chrome 155: `tabular-nums` widened Literata's "1111" at 24 px from 39.08 to 55.88 px.

## [DESIGN-035] The Google Fonts API serves fewer features and axes than the family has
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Google Fonts Knowledge: OpenType features in practice](https://fonts.google.com/knowledge/introducing_type/open_type_features_in_practice), [Google Fonts CSS API v2](https://developers.google.com/fonts/docs/css2), [google/fonts](https://github.com/google/fonts)
- Related: DESIGN-032, DESIGN-034, DESIGN-006, FONT-019, FONT-023, OG-003

Google Fonts Knowledge: "non-essential OpenType features *aren't* included in web fonts served via Google Fonts' API; however, the OpenType features are still present in the downloadable fonts, which can then be self-hosted." The lesson's only commit in google/fonts is dated 2022-03-28; the test below shows it still held on 2026-10-18.

The CSS API serves only the axes the URL names: "When a request doesn't specify a position or range for an axis, the default position will be used." `family=Inter:wght@100..900` returns a file without `opsz`, so `font-optical-sizing` has nothing to vary; `family=Inter:opsz,wght@14..32,100..900` keeps it.

**For a design:** from a `fonts.googleapis.com` link (the only font source artifacts allow, DESIGN-006), `tabular-nums` works, but `case`, `slashed-zero`, `oldstyle-nums`, small caps and stylistic sets don't. For those, self-host the family's file from google/fonts, subset with `--layout-features='*'` (FONT-019), or inline it in an artifact.

Tested 2026-10-18, fontTools 4.46.0, the `latin` files the API served to a Chrome 155 user agent:

| Family | google/fonts file | Served |
|---|---|---|
| Inter | 43 features, `case`, `zero`, `ss01`–`ss08`, `cv01`–`cv14` among them | 11: `calt ccmp dnom frac kern locl mark mkmk numr pnum tnum` |
| Literata | 26, `lnum`, `onum`, `smcp`, `case`, `zero` among them | 11: `ccmp dnom frac kern liga locl mark numr pnum rvrn tnum` |

Both served sets fall within `pyftsubset`'s defaults plus `tnum` and `pnum` (FONT-019). Inter's `latin` file was 48,256 bytes with `wght` only and 72,920 with `opsz,wght`.

## [DESIGN-036] The DESIGN.md format: eight sections, version "alpha", and its linter
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [google-labs-code/design.md README](https://github.com/google-labs-code/design.md/blob/6e5da5382f41edbba9d73b2c62f33f32e9971f15/README.md), [DESIGN.md spec](https://github.com/google-labs-code/design.md/blob/6e5da5382f41edbba9d73b2c62f33f32e9971f15/docs/spec.md), [PHILOSOPHY.md](https://github.com/google-labs-code/design.md/blob/6e5da5382f41edbba9d73b2c62f33f32e9971f15/PHILOSOPHY.md), [@google/design.md on npm](https://www.npmjs.com/package/@google/design.md), [Impeccable `init` and `document`](https://github.com/pbakaus/impeccable/tree/5cb95eea9c96479f57afe0732a45470d30183326/.agent/skills/impeccable/reference)
- Related: DESIGN-006, DSKILL-001, DESIGN-021, DESIGN-037

Google Labs' spec (Apache-2.0, read at commit `6e5da53`, 2026-10-16): "A format specification for describing a visual identity to coding agents." YAML tokens (`colors`, `typography`, `rounded`, `spacing`, `components`, with `{colors.primary}` references) in front matter or fenced blocks, then `##` sections that "can be omitted, but those present must appear in this order": Overview (alias Brand & Style), Colors, Typography, Layout (Layout & Spacing), Elevation & Depth (Elevation), Shapes, Components, Do's and Don'ts. "The DESIGN.md format is at version `alpha`… Expect changes." PHILOSOPHY.md: "The token values serve as context and are not rendering instructions." It holds colour, type, shape and spacing; layout only as prose, and no page structure or copy, so it fixes a look, not originality (DESIGN-004).

**Linter** `@google/design.md` 0.4.0, the only dist-tag, published 2026-07-27 through Google's publishing proxy, no provenance attestation (`npm view @google/design.md dist-tags 'time[0.4.0]' gitHead`). `spec --rules-only` lists eleven rules: `broken-ref` (error), `missing-primary`, `contrast-ratio` (component pairs "below WCAG AA minimum (4.5:1)"), `orphaned-tokens`, `missing-typography`, `section-order`, `unknown-key`, `token-like-ignored` (warnings), `token-summary`, `missing-sections`, `omitted-rules` (info). Its bundled README still says "seven rules". Tarball read 2026-10-23: no install scripts, no `fetch`, `http`, `net` or `child_process`. Pin it (`npm i -D @google/design.md@0.4.0`); bare `npx` runs whatever `latest` is.

Tested 2026-10-23, 0.4.0, Node 24.21.0: our fixture linted clean; VoltAgent's 84 brand files gave 0 errors, and 49 had a `contrast-ratio` warning.

**PRODUCT.md beside it:** Impeccable's `init` "captures durable product truth in PRODUCT.md" (users, purpose, positioning, brand commitments); "DESIGN.md is strictly visual."

## [DESIGN-037] Test: DESIGN.md, CLAUDE.md or a theme file, does Claude Code use it?
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-23
- Sources: [Memory: CLAUDE.md, AGENTS.md and imports](https://code.claude.com/docs/en/memory), [Artifacts: improve the visual design](https://code.claude.com/docs/en/artifacts), local test
- Related: DESIGN-006, DESIGN-027, DESIGN-028, DESIGN-036, MEM-005

**Docs:** Claude Code loads CLAUDE.md (or `AGENTS.md`) at launch; `@path` imports "are expanded and loaded into context". No Claude Code page, `llms.txt` or DESIGN-006's help articles mention `DESIGN.md` (grepped 2026-10-23).

**Test** (2026-10-23, v2.1.296, Sonnet 5.5, `claude -p` from desktop WSL, 26 runs, $1.72). One 874-byte token set (five hexes, two fonts, 2px radius, no shadows) in one place; one prompt, "Build a one-page website for Spoke & Chain, a bicycle repair shop in Utrecht…"; `--setting-sources project --disable-slash-commands`, tools Read, Write, Edit, Glob, Grep.

| Where the tokens were | Applied |
|---|---|
| CLAUDE.md list | 3/3 |
| `DESIGN.md` in the root | 1/6; with Bash also allowed, 0/3 |
| `styles/theme.css` | 0/3 |
| Nothing | 0/1 |
| `DESIGN.md` imported with `@DESIGN.md` | 3/3 |
| `DESIGN.md` or `theme.css`, prompt adds "Follow this project's design system." | 6/6 |

"Applied": all five hexes, both fonts, no other 6-digit hex, 2px radius, no shadow, checked by script; roles, layout and quality weren't judged. Every run that read the file applied it (no difference seen between formats, 3 runs each); the one unprompted read began with a Glob. Plain `Write`, so the artifact design skill, which "looks for an existing design system", wasn't exercised.

**So:** loading decided it, not format. Import a DESIGN.md or name it in the prompt. Without tokens, all 12 runs that read none picked the same slate ink and orange accent. An import loads every session: VoltAgent's brand files have a median of 28,368 bytes, about 7,000 tokens (4 characters a token). Not repeated on Opus, in a larger repo or interactively.

## [DESIGN-038] Brand DESIGN.md collections: what's in them and how they were made
- Type: comparison
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-23
- Sources: [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md/tree/3b605329240ce735b510037cca322f1831fdd7f8), [VoltAgent/awesome-claude-design](https://github.com/VoltAgent/awesome-claude-design/tree/8f746b5bbb69cc7544fa850c126a71f754091951), [bergside/awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/f631a09b4fcc0166f2e2c1a8c81906ef680c57e8), [rohitg00/awesome-claude-design](https://github.com/rohitg00/awesome-claude-design/tree/7f60ee56b9340f8c2671a08c2d8aab4037546a64), [The Component Gallery](https://component.gallery), [Mobbin](https://mobbin.com)
- Related: DSKILL-001, DESIGN-036, DESIGN-039, DESIGN-040, OSS-009

Read 2026-10-23 at pinned commits; stars from the GitHub API (not a quality signal). All four are MIT.

| Collection | Stars | Contents |
|---|---|---|
| VoltAgent/awesome-design-md | 123,022 | 84 brand files "extracted from real websites", tokens that "represent publicly visible CSS values"; 74 follow the spec's sections plus extras, 10 an older format. Brand READMEs point to getdesign.md (terms not read) |
| VoltAgent/awesome-claude-design | 4,181 | README only; links 68 getdesign.md files for Claude Design |
| bergside/awesome-design-skills | 3,311 | 67 style skills (SKILL.md plus DESIGN.md), some brand-named (`claude`, `sega`, `roku`, `tetris`), installed with `npx typeui.sh pull <slug>` (DESIGN-040) |
| rohitg00/awesome-claude-design | 1,160 | 35 files by "aesthetic family" (8 two-brand "remixes"), homepage screenshots, a recipe to "Reverse-engineer a brand's design system" |

**Contents:** hexes, a type scale, component specs and font names. 44 of VoltAgent's 84 say "proprietary"; Stripe's names Söhne, "licensed from Klim Type Foundry", with Inter as the fallback. No logo files or data URIs, but nav specs describe the wordmark.

How they were made isn't documented, and the values may be approximate: of the 23 colour tokens in VoltAgent's Claude file, which describes Claude.com, 4 occur in claude.com/product/design's HTML and CSS (2026-10-23), and its accent `#cc785c` doesn't (the page uses `#D97757`).

**Output:** imported for an unrelated bike shop (DESIGN-037's setup, 1 run), Stripe's file gave a page with 15 of its 19 hexes, Söhne then Inter, `ss01`, weight 300 and its gradient: the brand's look, not a starting point.

**Galleries** (Mobbin, The Component Gallery, Land-book) are references to look at, not files an agent loads.

## [DESIGN-039] Building on a named brand's design system: trademark, trade dress and fonts
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [15 U.S.C. § 1125 (Lanham Act § 43)](https://www.law.cornell.edu/uscode/text/15/1125), [Wal-Mart v. Samara Bros., 529 U.S. 205 (2000)](https://www.law.cornell.edu/supremecourt/text/529/205), [Two Pesos v. Taco Cabana, 505 U.S. 763 (1992)](https://www.law.cornell.edu/supremecourt/text/505/763), [USPTO: likelihood of confusion](https://www.uspto.gov/trademarks/search/likelihood-confusion), [VoltAgent/awesome-claude-design: licence and disclaimer](https://github.com/VoltAgent/awesome-claude-design/blob/8f746b5bbb69cc7544fa850c126a71f754091951/README.md)
- Related: DESIGN-038, DESIGN-004, DESIGN-010, OSS-009, OSS-011

Not legal advice; US sources only (EU and Benelux law not read). MIT covers a collection's text, not the brand: VoltAgent's files "are not affiliated with, endorsed by, or sponsored by the companies named", and "Users are responsible for ensuring their own downstream usage complies with the trademark, copyright, and brand-usage policies".

**Why it's a risk:**
- **The test is confusion.** Lanham Act § 43(a) covers a "word, term, name, symbol, or device" that "is likely to cause confusion… as to the affiliation, connection, or association". USPTO: marks "don't have to be identical to be confusingly similar"; a "similar commercial impression" can do it.
- **A look can be protected.** *Two Pesos* (a restaurant's decor): inherently distinctive trade dress "is protectable under § 43(a) without a showing that it has acquired secondary meaning". *Samara*: product design needs secondary meaning, and courts "should err on the side of caution and classify ambiguous trade dress as product design". Whether a website's look counts wasn't researched.
- **Fonts are licences:** a proprietary face named in a file isn't licensed to you (OSS-009). Screenshots of brand homepages are the brands' content, whatever the repo's licence.

**Do instead:** your own tokens from your subject (DESIGN-004, DESIGN-010); a stripped brand file leaves Claude's default look (DESIGN-037). No brand name, logo, wordmark or proprietary font; change the accent hue, the typeface and the layout skeleton, and compare with the brand's homepage: would a visitor assume a connection? Building for the brand, with its permission, is the exception.

## [DESIGN-040] A copied DESIGN.md is instruction text: read it like a skill
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-23
- Sources: [Claude Code security: prompt injection](https://code.claude.com/docs/en/security), [Memory: imports](https://code.claude.com/docs/en/memory), [typeui.sh 0.7.1 on npm](https://www.npmjs.com/package/typeui.sh), [bergside/awesome-design-skills](https://github.com/bergside/awesome-design-skills/tree/f631a09b4fcc0166f2e2c1a8c81906ef680c57e8)
- Related: DESIGN-037, DESIGN-038, SKILL-041, SKILL-068, SKILL-069, SKILL-070, SKILL-073

A DESIGN.md imported from CLAUDE.md or read on request is text Claude acts on, like a skill (our inference; no Anthropic page names DESIGN.md). Anthropic defines prompt injection as "inserting malicious text" to "override or manipulate an AI assistant's instructions"; its advice for untrusted content starts "Review suggested commands before approval".

**What we found** (2026-10-23, read, not run):
- **Commands.** 34 of VoltAgent's 84 files tell the agent to run `npx @google/design.md lint`, unpinned. `ollama.md` and `opencode.ai.md` quote `curl -fsSL … | sh` and `| bash` install lines as page copy.
- **Remote, unpinned text.** `typeui.sh` 0.7.1 (`gitHead` `de5559f`, no install scripts, no telemetry) `pull` fetches `skills/index.json`, then the path it names, from `raw.githubusercontent.com/bergside/awesome-design-skills/main`: a branch, checked only for a text content type. It writes `.agents/skills/design-system/SKILL.md` always, plus one per chosen tool (Claude: `.claude/skills/design-system/SKILL.md`), merging between `TYPEUI_SH_MANAGED` markers; `--format design` replaces `./DESIGN.md`. It writes no settings or hooks.
- No HTML comments or data URIs in VoltAgent's files, and no hidden Unicode (format, private-use or tag characters, SKILL-073) in the 97 files read. Nothing found was malicious; permission prompts still gate the commands.

**Do:** copy at a pinned commit (`raw.githubusercontent.com/<repo>/<sha>/…`), read it in full, check skill frontmatter (`allowed-tools`), pin any command it names (`npx @google/design.md@0.4.0`), rewrite agent-directed lines as plain design rules, and review later diffs like code (SKILL-068, SKILL-069).

## [DESIGN-041] When to cast a shadow, and the shadow rule to give Claude
- Type: recommendation
- Applies to: Claude Code, general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Atlassian: elevation](https://atlassian.design/foundations/elevation), [Primer: box-shadow](https://github.com/primer/design/blob/main/content/foundations/css-utilities/box-shadow.mdx), [Material Components Android: cards](https://github.com/material-components/material-components-android/blob/master/docs/components/Card.md), [Fluent 2: elevation](https://fluent2.microsoft.design/elevation), [artifact-design (Claude Code 2.1.296)](https://code.claude.com/docs/en/artifacts), [Taste Skill @6010f91 (community)](https://github.com/Leonxlnx/taste-skill/blob/6010f91/skills/taste-skill/SKILL.md), [Impeccable craft-floor @5cb95ee (community)](https://github.com/pbakaus/impeccable/blob/5cb95ee/plugin/skills/impeccable/reference/craft-floor.md), [FreekMencke/freek-mencke-web#43](https://github.com/FreekMencke/freek-mencke-web/pull/43), local test
- Related: DESIGN-006, DESIGN-022, DESIGN-037, DESIGN-042, DESIGN-044, DSKILL-001, DSKILL-002, ANIM-008

A shadow says "this lies over that". Every system shadows what floats: menus, popovers, dialogs, a dragged card. Primer adds content "on top of (overlapping) other elements", such as overlapping screenshots.

**Resting cards split the systems.** Material's elevated card rests at `1dp`, Fluent shadows "Cards without an edge", and Primer's `resting-medium` is "for cards and content panels". Atlassian keeps them flat: "To create flat cards, pair with a border". Default to flat, with a border, whitespace or a tone step (DESIGN-022; Taste Skill: "Shadows only on what truly floats").

**Don't lift** content groups ("don't use to group content when a border or white space would suffice"), inputs and buttons at rest, or a card inside a card. A sticky header gets a hairline: "A border is the default approach for scrolled content". Draw attention with size, contrast or colour; Atlassian allows a raised card for emphasis, "limit to one section or focal point". Hover: Atlassian changes the surface colour or, "sparingly", lifts one level. artifact-design: "the same radius and shadow to every block flattens the hierarchy". Hard offset shadows only in a site that's "actually neobrutalist" (Impeccable).

**The rule for Claude:** a line per kind of surface and layout state, in the tokens and CLAUDE.md or an imported DESIGN.md (DESIGN-006, DESIGN-037). For example: "Cards: none, 1px `--line` border. Menus, popovers: `--shadow-overlay` and a transparent outline. Overlapping screenshots: `--shadow-raised`; stacked: none." freek-mencke-web#43 lacked one: three rounds on the stacked layout.

Tested 2026-10-23, v2.1.296, Sonnet 5.5, `claude -p` with DESIGN-028's flags, one prompt, 3 runs per arm, $0.29: without a rule, 3/3 gave all five screenshots one shadow, stacked or not, and nothing else; with a one-line rule, 3/3 used its value. 0/6 added a forced-colours edge (DESIGN-044).

## [DESIGN-042] A shadow scale as tokens: levels and values by design system
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Material Web 2.5.0 elevation tokens](https://github.com/material-components/material-web/blob/v2.5.0/tokens/versions/v0_192/_md-sys-elevation.scss), [Fluent 2: elevation](https://fluent2.microsoft.design/elevation), [Atlassian: elevation](https://atlassian.design/foundations/elevation), [Primer primitives 11.10.0](https://www.npmjs.com/package/@primer/primitives), [Radix Themes: shadows](https://www.radix-ui.com/themes/docs/theme/shadows), [Open Props 1.7.23](https://www.npmjs.com/package/open-props), [Carbon styles 1.118.0](https://www.npmjs.com/package/@carbon/styles), [Tailwind `theme.css` v4.3.3](https://github.com/tailwindlabs/tailwindcss/blob/v4.3.3/packages/tailwindcss/theme.css), [DTCG Format 2025.10: shadow](https://www.designtokens.org/TR/2025.10/format/), [MDN: light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark), [web-features 3.44.0](https://www.npmjs.com/package/web-features), local test
- Related: DESIGN-021, DESIGN-023, DESIGN-016, DESIGN-018, DESIGN-041, DESIGN-043, CSS-006, CSS-015

Systems name a few levels by job, mostly a key plus an ambient shadow (versions: `npm view`; values: `npm pack`, 2026-10-23).

| System | Levels and jobs |
|---|---|
| Material Web 2.5.0 (maintenance mode) | 0–5 (0 to 12 dp); menu 2, dialog 3; black, key 30% + ambient 15% |
| Fluent tokens 1.0.0-alpha.24 | 6, named by blur (2–64); 64 for dialogs; black 12%/14% |
| Atlassian tokens 20.7.0 | raised (movable cards), overlay (menus, dialogs), overflow |
| Primer 11.10.0 | 3 resting (cards), 4 floating (menus to sheets), inset |
| Radix Themes 3.3.0 | 5 plus inset; 4–5 popovers, 6 dialogs |
| Open Props 1.7.23 | 6, no jobs; one `--shadow-color` |
| Carbon styles 1.118.0 | one, for menus: `0 2px 6px` |
| Tailwind 4.3.3 | 7 sizes, no jobs; black at 5% to 25% |

**A starting scale** from those values: raised, Primer resting-medium `0 1px 1px 0 #25292e1a, 0 3px 6px 0 #25292e1f`; overlay, Atlassian `0px 8px 12px #1E1F2126, 0px 0px 1px #1E1F214F`; dialog, Primer floating-large `0 40px 80px 0 #25292e3d`. Atlassian, Primer and Open Props tint toward blue-black.

**Platform first:** plain `--shadow-*` custom properties on `box-shadow`, coloured with `color-mix(in oklab, var(--ink) 15%, transparent)` (Baseline widely available 2025-11-09). `light-dark()` (newly available 2024-05-13, CSS-006) needs `color-scheme: light dark` and swaps colours only. Install a package for its components, not its shadows.

**DTCG 2025.10 `shadow`:** `color`, `offsetX`, `offsetY`, `blur`, `spread`, optional `inset`, or "an array of shadow objects and/or references".

Tested 2026-10-23, tailwindcss@4.3.3, Node 24.21.0: `@theme { --shadow-*: initial; … }` dropped `shadow-md` and `shadow-md/20` but kept `inset-shadow-*`, `drop-shadow-*` and `text-shadow-*`. `shadow-md/20` compiled to relative colour, `oklab(from … / 20%)`, replacing the alpha, with no fallback.

## [DESIGN-043] Elevation in dark mode: lighter surfaces, a hairline, a stronger shadow
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Atlassian: elevation](https://atlassian.design/foundations/elevation), [Apple HIG: Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode), [Material Components Android: color theming](https://github.com/material-components/material-components-android/blob/master/docs/theming/Color.md), [Carbon: color overview](https://carbondesignsystem.com/elements/color/overview/), [Primer primitives 11.10.0](https://www.npmjs.com/package/@primer/primitives), [Fluent tokens 1.0.0-alpha.24](https://www.npmjs.com/package/@fluentui/tokens), [Open Props 1.7.23](https://www.npmjs.com/package/open-props), [Hallmark dark-mode.md @7ec8682 (community)](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/references/dark-mode.md), local test
- Related: DESIGN-018, DESIGN-015, DESIGN-017, DESIGN-042, DESIGN-044

A shadow can't get much darker than a dark ground, so dark mode adds lighter surfaces, a hairline or a stronger shadow, usually several.

- **Lighter surfaces.** Atlassian: "the higher the elevation, the lighter the surface looks" (`#1F1F21`, raised `#242528`, overlay `#2B2C2F`, shadows kept). Apple: "the elevated colors are brighter". Carbon: "layers become one step lighter with each added layer". Material: "tonal surface color roles… instead of elevation overlays", shadows kept. Open Props steps `--surface-1` to `-4` from `gray-9` to `gray-6`.
- **A hairline.** Primer's dark floating shadows start with `0 0 0 1px #3d444d`, Atlassian's overlay with `0px 0px 0px 1px #BDBDBD1F`; Radix strengthens its ring from `gray-a3` to `gray-a6`.
- **Stronger shadows.** Fluent doubles its alpha (key 0.14 to 0.28); Open Props goes from 1% to 25% base strength.

Primer's dark overlays (`#010409`) are darker than its page (`#0d1117`).

**For a small site:** step each level about 0.03 (Hallmark, community) to 0.06 (our test) lighter in OKLCH (DESIGN-016, DESIGN-018), give overlays a hairline as a `border` or `outline`, not a `box-shadow` ring (forced colours removes rings and tone steps, DESIGN-044), and keep the shadow under popovers. Atlassian: "Check the contrast ratio for UI on overlay surfaces in dark mode" (DESIGN-017). A tone step isn't a 3:1 boundary: 0.20 to 0.26 is about 1.2:1.

Tested 2026-10-23, tailwindcss@4.3.3, Chromium 156, one page, summed RGB difference at one pixel column: on `oklch(0.2 0.02 250)`, 0.5-alpha black shadows changed the pixels below an edge by at most 18, against 40 to 86 in light; the step to `oklch(0.26 0.02 250)` changed the surface by 42. Hairlines weren't measured. All six DESIGN-041 probe pages used a stronger shadow alone (alpha 0.6 to 0.8).

## [DESIGN-044] Shadows in forced colours and WCAG: give every shadow an edge that stays
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [CSS Color Adjustment 1 (CR Snapshot, 7 May 2026)](https://www.w3.org/TR/css-color-adjust-1/), [MDN: forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors), [Edge blog: styling for forced colors (2020-09-17, read from the Wayback copy)](https://blogs.windows.com/msedgedev/2020/09/17/styling-for-windows-high-contrast-with-new-standards-for-forced-colors/), [Understanding WCAG 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [WCAG 2.2: 2.4.13 Focus Appearance](https://www.w3.org/TR/WCAG22/#focus-appearance), local test
- Related: ACCESS-014, UIREV-007, DESIGN-041, DESIGN-043, DESIGN-045

Forced colours removes shadows, and a blurred one never reaches 3:1, so it can't be a control's only boundary or its focus indicator.

**Forced colours:** "box-shadow and text-shadow compute to none", as do gradient backgrounds, and border and outline colours are forced to system colours. So a transparent `border` or `outline` is invisible normally and an edge in forced colours (the Edge team shows the outline). Unseen, it keeps Hallmark's "a border or a shadow, never both". Tailwind's `ring-*` is a `box-shadow` too. Don't opt out with `forced-color-adjust: none`: it overrides the user's palette.

**WCAG 1.4.11:** a boundary needs 3:1 "only… when there is no other visual way to identify the presence of the control"; a drop shadow on an input "is considered to be subsumed" into the nearest colour, so it can't provide that boundary. Cards aren't controls, but a control "will still need to have a sufficiently contrasting focus indication": use `outline`. 2.4.13 (AAA) asks for "a 2 CSS pixel thick perimeter" at 3:1, and a component's perimeter "does not include shadow and glow effects".

Tested 2026-10-23, tailwindcss@4.3.3, playwright@1.64.1, Chromium 156 `forcedColors: 'active'` emulation (default palette; not Windows High Contrast, Firefox or Safari), Node 24.21.0:
- Every `box-shadow` (cards, popover, `ring-1`) computed to `none`; two same-colour overlapping screenshots merged.
- The transparent border and outline painted full-contrast edges.
- Focus: `ring-2` with `outline-none` showed nothing; with `outline-hidden` (a transparent 2px outline under `forced-colors: active`) an outline appeared; plain `outline` stayed.
- `filter: drop-shadow()` kept its value and painted, but black on the black forced-dark canvas it was invisible: not an edge.
- `forced-color-adjust-none` kept the shadow.
- On screen the darkest shadow pixel was about 1.3:1 against the ground (estimated).

## [DESIGN-045] `box-shadow` or `drop-shadow()`, and what clips or prints them
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [CSS Backgrounds 3: box-shadow](https://drafts.csswg.org/css-backgrounds-3/#box-shadow), [Filter Effects 1](https://drafts.csswg.org/filter-effects-1/), [MDN: drop-shadow()](https://developer.mozilla.org/en-US/docs/Web/CSS/filter-function/drop-shadow), [CSS Color Adjustment 1: print-color-adjust](https://www.w3.org/TR/css-color-adjust-1/#print-color-adjust), [CSSWG wiki: print backgrounds](https://wiki.csswg.org/ideas/print-backgrounds), [web.dev: simplify paint complexity](https://web.dev/articles/simplify-paint-complexity-and-reduce-paint-areas), local test
- Related: DESIGN-042, DESIGN-044, ANIM-008, CSS-015

`box-shadow` shadows the box, `drop-shadow()` the pixels: the first for cards and rectangular screenshots, the second for transparent PNGs and irregular shapes.

**`box-shadow`:** follows `border-radius`, takes a spread and `inset`, and layers ("the first shadow is on top"). It is "clipped inside the border-box", so it doesn't show through a translucent background and is a rectangle under a transparent image.

**`drop-shadow()`:** "a blurred, offset version of the input image's alpha mask", children and their shadows included. "the `inset` keyword and `spread` parameters are not allowed", and its blur is a "standard deviation instead of blur radius"; `box-shadow`'s blur is twice its standard deviation, so the same number blurs about twice as far. Several `drop-shadow()`s chain: each shadows the result before it. Any `filter` also creates a stacking context and a containing block for fixed and absolute descendants.

**Clipping:** an ancestor's `overflow: hidden` cuts shadows off; leave room or move the clip.

**Print:** economy printing "might ignore any backgrounds"; no spec or MDN page mentions `box-shadow`. A dated CSSWG wiki note says IE9 dropped shadows too.

**Cost:** web.dev: anything with a blur "is going to take longer to paint than, say, drawing a red box"; animate a pseudo-element's `opacity` instead (ANIM-008). No source read (web.dev, Chrome DevTools, Josh Comeau, Tobias Ahlin) gives a blur threshold.

Tested 2026-10-23, tailwindcss@4.3.3, playwright@1.64.1, Chromium 156: `drop-shadow-lg` followed an SVG's rounded corners; a parent's `overflow: hidden` cut a child's shadow off. `page.pdf()` printed box and drop shadows with `printBackground` false and true; false dropped the ground and card backgrounds, leaving a shadow-only card as a faint blur on white. The dark-scheme page printed with its light values, so dark print is untested; so are print dialogs, Firefox and Safari.

## Recommendations for our setup

Ranked by impact against effort.

1. **Done 2026-10-16: route design questions here**: `claude-kb-lookup` and `kb_search` name the topic (FreekMencke/claude-kb#147).
2. **Done 2026-10-17: a contrast and computed-colour check in osrs-tracker-web's `browser-checker`** (osrs-tracker/osrs-tracker-web#337, script fixes in osrs-tracker/osrs-tracker-web#340). DESIGN-007.
3. **Don't run `/design-sync` on osrs-tracker-web** (DESIGN-002). It's Angular, and the sync adapters read React only. Its design system stays in the repo skill and the design canvas artifact. If mock-ups move to `/design`, make a Design System artifact from a chat with `theme.css`, `base.css` and screenshots of real pages (DESIGN-010), and refresh it when the tokens change. No repo change.
4. **For a new page or redesign in any repo, prompt with DESIGN-004:** subject, audience and job; one small choice at a time, picked by you rather than by Claude, instead of whole designs, with DESIGN-030's prompt: audience, feel, tone of voice, 20 palettes as squares, font pairings, whole-page wireframes, then combined variants, keeping several picks per stage (4 of 5 variants were good on both subjects; in DESIGN-027 the self-pick added template chrome, in DESIGN-029 half the options repeated across runs, and a one-page chooser left one section skeleton); a banned list grown from the last result. On an existing site, extract first and re-open only the steps that should change (DESIGN-031). A skill that runs this, rotating batches included, is `design-workshop`, added 2026-10-16 in [FreekMencke/claude-skills#75](https://github.com/FreekMencke/claude-skills/issues/75). It ends with a design brief, and `frontend-design` implements that brief as a fixed spec: its craft rules and quality floor without its own direction-setting (DESIGN-005). In a Tailwind or shadcn repo, theme the defaults away first (DESIGN-023). No change needed: the `frontend-design` plugin we have installed is the current upstream text (identical checksum, 2026-10-16).
5. Done 2026-10-18: `design-workshop`'s Type step and brief check figure styles and Google Fonts' feature limits (FreekMencke/claude-skills#84, FreekMencke/claude-skills#89; DESIGN-034, DESIGN-035, DESIGN-032).
6. **No change for osrs-tracker-web or freek-mencke-web** (DESIGN-034, DESIGN-032): both self-host one variable font family (`wght` only, 300–700 and 100–700 cuts, no `opsz`) whose files keep `tnum` and `case`, and osrs-tracker-web already sets `tabular-nums` on its values (checked 2026-10-18 with fontTools 4.46.0). Optical sizes would need a font with the axis; not worth changing the face for.
7. **Don't install community design skills; borrow their ideas** (DSKILL-014). Updated 2026-10-23: `kb-design-skills.md` read Impeccable, Taste Skill, Hallmark, ui-ux-pro-max and huashu-design at pinned commits: hooks, a downloaded binary, remote text in context and image fetching (DSKILL-010), and a text-only test where each converged on one look per brief (DSKILL-013).
8. **Test design-prompt or skill changes with DESIGN-028's isolation flags**, measured as in DESIGN-027, so CLAUDE.md, the frontend-design plugin and the output style don't leak into the result. The measuring scripts aren't in the repo; adding them under `evals/` would make the test re-runnable. Decided 2026-10-17 (FreekMencke/claude-kb#43): a habit, not an issue; add the scripts the next time a design test runs.
9. **Considered, not adopted: `--color-*: initial` in osrs-tracker-web's `@theme`** (DESIGN-023). On 2026-10-16 its templates used no default palette colour classes, so clearing them would turn an off-token colour into a build error. Its repo skill already says "a value the scale lacks becomes a token", and osrs-tracker/osrs-tracker-web#337 added a computed-colour check; a change would first have to check what `@tailwindcss/forms` reads from the default palette. Not worth an issue now.
10. **A DESIGN.md has to be loaded to count** (DESIGN-037): in any repo that adopts one, import it from CLAUDE.md (`@DESIGN.md`) or name it in the repo's design skill. Our repos keep tokens in theme CSS plus a repo skill, so nothing changes now. Decided 2026-10-23 (FreekMencke/claude-kb#260): `design-workshop`'s hand-over makes sure the token file gets loaded, FreekMencke/claude-skills#108; no DESIGN.md output, since loading decided the result, not format.
11. **Don't start a site from a brand's DESIGN.md** (DESIGN-038, DESIGN-039): read one to see how a system is written, then pick your own values. One imported for a bike shop reproduced the brand's look. No repo change.
12. **Treat a copied DESIGN.md or style skill as third-party instruction text** (DESIGN-040, SKILL-041): pin it to a commit, read it, pin commands it names. Don't use `typeui.sh pull`, which installs whatever is on the registry's `main`.
13. **Give every site one shadow rule per kind of surface before Claude builds** (DESIGN-041, DESIGN-042, DESIGN-043): a token per job (raised, overlay, dialog) in the theme CSS, and a line per surface and layout state in the repo skill. osrs-tracker-web already does this (one tinted `--shadow-float`, per-scheme colour, "cards are flat"), and freek-mencke-web's depth rules came out of FreekMencke/freek-mencke-web#43. No change.
14. **Never let a shadow be the only edge or focus state** (DESIGN-044): in our Tailwind repos, focus with `outline`, not `ring-*`; give floating layers a border. osrs-tracker-web's floating layers have one. freek-mencke-web's screenshot and bar hairlines are `box-shadow`s that forced colours removes; low impact, noted for FreekMencke/freek-mencke-web#43 rather than a new issue.

## Open questions

- **The full frontend-design skill wasn't tested** (DESIGN-027): S3 used only its two passes, without its list of default looks. The staged method ran twice (DESIGN-030), on two subjects, Sonnet 5.5 only, with one person judging; fonts and layout ideas repeated across both. The user's rotating batches (five options per stage, new batches until at least three are kept) and the existing-site mode (DESIGN-031) are untested; FreekMencke/claude-skills#75's first use will test them.
- **The test kept only final pages:** `--output-format json` returns the last message, so S2's four directions and S3's plans weren't recorded (DESIGN-028). `stream-json` would keep them.
- **Typeface choice beyond pairing** (DESIGN-020, DESIGN-033): Google Fonts Knowledge turned out to be readable as Markdown in google/fonts (2026-10-18); its "A checklist for choosing type" and "Emotive considerations" lessons weren't read. m3.material.io still renders in JavaScript; headless Chrome (`--dump-dom`) would read it.
- **Does any browser turn on `case` by itself under `text-transform: uppercase`?** (DESIGN-034) The OpenType registry suggests applications apply it "automatically when the user changes case"; CSS Fonts 4 says nothing, and we didn't test it. Set it explicitly until tested.
- **`opsz` in Firefox and Safari** (DESIGN-032): only Chrome 155 was measured; whether Firefox and Safari also map CSS px one to one wasn't checked.
- **Does the Google Fonts API keep any feature on request?** (DESIGN-035) The CSS API v2 page lists no parameter for features; only Inter and Literata were tested.
- **Does OpenAI's "no cards" guidance transfer to Claude?** (DESIGN-022) Written for its GPT models; untested on Claude.
- **Not read:** Müller-Brockmann's grid systems via a reputable secondary source, Refactoring UI's public pages, the CRAP principles, Carbon's and Polaris's spacing pages, Storybook and Chromatic (DESIGN-022, DESIGN-024).
- **Leonardo and OKLCH:** its README lists LCH, LAB, CAM02, HSL, HSLuv, HSV and RGB only (DESIGN-016); whether newer builds interpolate in OKLCH wasn't checked.
- **`/design` minimum version:** v2.1.265 (artifacts page) or v2.1.234 (week-34 notes); already in INDEX.md Conflicts (DESIGN-001).
- **`/design-sync` on a non-React repo:** concluded from the bundle and docs, not run, because a run writes to claude.ai. A run against a scratch design-system project would confirm what it reports for an Angular library (DESIGN-002).
- **The issue's "Claude 4 best-practices page suggests Inter for headings" conflict doesn't hold on 2026-10-16:** the general prompting page names Inter three times, all as fonts to avoid. Not added to Conflicts.
- **No benchmark compares Claude models on design quality as people judge it, beyond pairwise preference** (DESIGN-011, DESIGN-026). Design Creativity Bench measures originality with an embedding metric; we didn't check how it was validated (its Appendix B).
- **EU and Benelux law on copying a brand's look** (DESIGN-039): not read. EUR-Lex returned an empty challenge page to curl and to WebFetch on 2026-10-23, and EUIPO's guidelines page wasn't found at the guessed path. US district courts have heard website trade-dress claims (*Lepton Labs v. Walker*, C.D. Cal. 2014; *Ingrid & Isabel v. Baby Be Mine*, N.D. Cal. 2014, found by the refuter through CourtListener metadata); the opinions weren't read.
- **Does Claude Design accept a DESIGN.md upload?** VoltAgent's README says so; Anthropic's three Claude Design help articles list connected apps, files, Figma, decks, logos and fonts, and don't name it (DESIGN-037). Stitch's DESIGN.md docs render in JavaScript and weren't read.
- **DESIGN-037's limits:** one 874-byte fixture, one prompt, Sonnet 5.5 only, `claude -p`, not artifacts or `/design` (whose skill "looks for an existing design system"), and no larger repo. Whether a 7,000-token brand file is followed as closely as our small one is untested beyond one run.
- **How VoltAgent's files were made** (DESIGN-038): only the Claude file was compared with a live page (4 of 23 colours matched). getdesign.md's terms and Land-book (blocked by a bot check) weren't read.
- **Does a PRODUCT.md beside a DESIGN.md change output?** Impeccable's split (DESIGN-036) wasn't tested.
- **Shadows on real Windows High Contrast, Firefox and Safari** (DESIGN-044, DESIGN-045): only Chromium 156's `forcedColors` emulation and `page.pdf()` were run; a print dialog's "Background graphics" setting and other engines weren't. No spec says whether forced colours should leave `filter: drop-shadow()` alone. Chromium also printed the light values of `light-dark()` from a dark-emulated page (not investigated).
- **Material 3's own elevation guidance** (DESIGN-042, DESIGN-043): m3.material.io renders only with JavaScript; Material Web's docs and tokens were read instead. Apple's base and elevated colour values weren't found on the HIG pages read.
- **A blur-radius cost threshold** (DESIGN-045): web.dev, Tobias Ahlin and Josh Comeau say blur and layered shadows cost paint time, with no number.
- **The shadow-rule probe's limits** (DESIGN-041): one prompt, Sonnet 5.5 only, `claude -p`; it didn't reproduce the overlap-only first pass from FreekMencke/freek-mencke-web#43, and a rule that names the forced-colours edge wasn't tried. Radius per stack ("one radius per stack") may deserve its own entry.
