# Visual and UI design with Claude

Prefix `DESIGN`. This file covers getting Claude to produce original, logical and coherent visual design for websites and web apps: layouts, colour schemes, type, design systems and tokens, and how CSS and UI libraries pull output toward the same look. Claude Code is the tool for visualising and iterating on a design (artifacts, `/design` canvases, the browser) as well as for building it. External design tools (Figma, Canva) and software, API or database design are out of scope. It links rather than repeats: artifact mechanics (SURF-008 to SURF-017), the desktop Browser pane (SURF-006), screenshot loops and browser checks (FLOW-004, FLOW-014), the visual checker subagent (REPO-021), image token cost (TOK-043), skill loading (SKILL) and general prompting (PROMPT).

Research basis:
- Researched 2026-10-16 (FreekMencke/claude-kb#147) against Claude Code v2.1.296 in a desktop WSL session, on the Claude 5 model family. The same day the scope was narrowed at the user's request: no external design tools, and Claude Design only as far as Claude Code's `/design` uses it.
- The lead read Anthropic's pages in full as raw text: the Claude Code artifacts, best-practices and desktop pages (`.md`), the platform prompting pages for Opus 5.5 and Sonnet 5, the general prompting page and the vision page (`.md`), the help center's design-system and custom-visuals articles (HTML stripped of tags), the 2025-11-12 claude.com blog post and the Opus 4.7 launch post, and the frontend-design `SKILL.md` from all three Anthropic repos plus its git history.
- A Sonnet 5.5 research subagent read community design skills and practice; the lead re-checked every quote used here against its downloads.
- A second round the same day (DESIGN-014 to DESIGN-028): the lead read Anthropic's other design skills from raw.githubusercontent.com; two Sonnet 5.5 readers at high effort covered colour, type and tokens, and layout, libraries, coherence, critique and originality research, from specs, library docs and repos, npm registry JSON and arXiv; the lead re-checked the quotes used against their downloads, and a skeptical subagent tried to refute the claims the recommendations rest on.
- The lead ran the prompting test in DESIGN-027 (26 `claude -p` runs) two 5-run follow-ups with the user picking (DESIGN-029, DESIGN-030) and a staged session with the user picking at each stage (DESIGN-031).
- `/design-sync`'s framework support was read from the installed v2.1.296 CLI bundle and the session's `DesignSync` tool description, because the docs say only "React components".
- A 2026-10-16 deep-research report from a claude.ai chat supplied leads only; it isn't cited.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| How do I see and iterate on a design in Claude Code? | Ask for variants side by side in one artifact ("four distinctly different layouts… as a grid"), tune one with sliders, or run `/design <brief>` for a canvas of editable artboards. Then build the pick in code and check it in the desktop Browser pane or with Playwright. | DESIGN-001 |
| Why do Claude's pages look generic? | "Distributional convergence": without direction it samples safe defaults. The 2025 tell was Inter and purple gradients; the 2026-09 frontend-design skill names cream-plus-serif-plus-terracotta, near-black with one acid accent, broadsheet hairlines, the SaaS-card kit and template chrome. | DESIGN-003 |
| How do I prompt for distinctive design? | Name the subject, audience and the page's one job; give a concrete spec (hex palette, typefaces, radius, motion timing) or ask for 4 directions first; ban the specific patterns you got last time, not "the AI look", and expect a new default; use real copy. | DESIGN-004, DESIGN-027 |
| Which prompting strategy gave the most varied pages in a test? | One small choice at a time, not whole designs: 20 palettes as squares, then 5 font pairings, then 5 whole-page wireframes, then 5 combined variants; the user called 4 of 5 good starting points. Earlier tests on the same bakery brief (Sonnet 5.5): the bare brief gave five cream-and-Fraunces pages, a banned list one new look, text directions repeated two options every run, and a one-page visual chooser varied colour and type but not page structure. | DESIGN-027, DESIGN-029, DESIGN-030, DESIGN-031 |
| How do I get an original, consistent colour scheme? | Pick the brand hue from the subject, then fill named roles (Radix's 12 steps or Material's roles), generate the ramp in OKLCH with a script library and check WCAG 2 contrast in light and dark. | DESIGN-015, DESIGN-016, DESIGN-018, DESIGN-019 |
| Why do Tailwind and shadcn sites look alike, and how do I theme them away? | Stock fonts, radii, shadows and an achromatic shadcn theme. Clear namespaces with `@theme { --color-*: initial; }`, set shadcn's CSS variables or a `shadcn create` style, from the repo's tokens. | DESIGN-023 |
| How do I get past hero, three cards and a CTA? | Name a layout (bento, magazine, split screen, zigzag, broken grid…), default to no cards, one job per section, and carry the ASCII wireframe into `grid-template-areas`. | DESIGN-022 |
| How do I keep a multi-page site consistent? | Give every session the role tokens, a component inventory and page templates (CLAUDE.md or a repo skill), and check every page for off-token values, visual diffs and raw hexes. | DESIGN-024, DESIGN-021 |
| frontend-design or `artifact-design`? | frontend-design is the plugin skill for UI in code and is identical in all three Anthropic repos (last changed 2026-09-01 to 09-03). `artifact-design` is bundled with the Artifact tool and governs published pages. Community skills (Impeccable, Taste Skill) are unofficial: borrow their ideas rather than install them. | DESIGN-005, DESIGN-012 |
| Where do design tokens go? | Where Claude reads them: the project's CLAUDE.md, a theme file, or a repo skill. Precedence: your prompt, then your design system, then Claude's defaults. Artifacts load fonts only from Google Fonts; other faces are inlined. | DESIGN-006 |
| How do I get a design system out of existing code? | React: `/design-sync`. Anything else, Angular included (the v2.1.296 sync adapters read `.tsx`/`.jsx` and React Storybook only): have Claude read the theme files, CSS custom properties and components into one token list per role. | DESIGN-002, DESIGN-010 |
| Screenshot or computed styles to check a design? | Screenshots for overall look and hierarchy; computed styles (`getComputedStyle`, a contrast check) for exact spacing, sizes, colours and contrast, because Claude's localisation is "approximate". Claude can't generate images; its design output is HTML, CSS, SVG or canvas. | DESIGN-007, DESIGN-008 |
| How do I improve an existing design rather than redesign it? | Give the highest-fidelity input you have (code plus the running app, then a URL, then a screenshot), lock the tokens, audit against a checklist and change one thing at a time; redesign only when asked, on a branch. | DESIGN-009 |
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
| DESIGN-012 | Community design skills (unofficial) | comparison | community, impeccable, taste-skill, design-md |
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
| DESIGN-030 | Test: directions shown as swatches, with the repeat looks banned | comparison | experiment, directions, swatches, banned-patterns |
| DESIGN-031 | Test: pick colour, then type, then layout, then combine | comparison | experiment, staged-picks, palettes, wireframes |

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

**Model pages:** Opus 5.5 "falls back on a few default styles"; Sonnet 5 "may settle into a consistent default visual style". On both, a general "avoid a generic AI look" "mostly swaps one default for another".

## [DESIGN-004] Prompting for distinctive design
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Prompting Claude Sonnet 5: design and frontend defaults](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5), [Prompting Claude Opus 5.5: frontend design defaults](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)
- Related: DESIGN-003, DESIGN-005, DESIGN-006, DESIGN-022, DESIGN-027, DESIGN-031, PROMPT-009

1. **Ground it.** Name "one concrete subject, the design's audience, and the design's primary job" (frontend-design). Distinctive choices come from the subject's "industry, subject matter, materials, and vernacular".
2. **Give a concrete spec when you have one.** Sonnet 5 "follows explicit specs precisely". Anthropic's AEFRM example gives five hex values, "4px corner radius", the typeface's character, the section order and "transition: all 160ms ease out".
3. **Or ask for directions first.** "Before building, propose 4 distinct visual directions tailored to this brief (each as: bg hex / accent hex / typeface, plus a one-line rationale)." Because Sonnet 5 doesn't accept `temperature`, this is "the recommended way to produce meaningfully different design directions across runs".
4. **Ban specific patterns and iterate the list.** Opus 5.5's example: "Do not use a cream or off-white background, italic accent words in headlines, numbered "01/02/03" section labels, monospace labels, or pill-shaped buttons." Then "check which styles the first result used instead, and extend the list if needed." Sonnet 5 says "don't use that color" shifts it "to a different fixed palette".
5. **Plan tokens before code.** frontend-design's two passes: a compact plan (4–6 named hex values, typefaces and roles, a layout in prose and ASCII wireframes, principles), then a review of that plan against the brief, then code.
6. **Real copy.** "Copy can make a design feel as templated as the design itself." CTAs say what happens: "Save changes," not "Submit."
7. **Restraint.** "Spend your boldness in one place." One orchestrated motion moment, not entrance animations everywhere.

Tested (DESIGN-027 to DESIGN-031): whole designs converged; one small choice at a time, picked by a person, worked best. The general and Sonnet 5 pages' `<frontend_aesthetics>` snippets still ask for "animations for effects and micro-interactions", unlike the 2026-09 skill (INDEX.md Conflicts).

## [DESIGN-005] The frontend-design skill and how it differs from `artifact-design`
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-16
- Sources: [claude-code: frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [claude-plugins-official copy](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [anthropics/skills copy](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), [Artifacts: improve the visual design](https://code.claude.com/docs/en/artifacts), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: DESIGN-003, DESIGN-004, SURF-016, SKILL-048

**Where it lives.** Three Anthropic copies, byte-identical on 2026-10-16 (71 lines): the `frontend-design` plugin in `anthropics/claude-plugins-official` (what `/plugin install frontend-design@claude-plugins-official` installs), the same plugin in `anthropics/claude-code`, and `anthropics/skills`. History: added 2025-11-12 (41 lines, the "AI slop" version banning Inter, Roboto and purple gradients), rewritten 2026-06-09 to 06-18 (55 lines, "design lead at a small studio"), and rewritten again 2026-09-01 to 09-03. Third-party mirrors often show an older version; quote GitHub.

**What it says now.** Act as the design lead of a studio whose client "has already rejected proposals that felt cliché or templated". Ground the design in the subject; pick typefaces deliberately and use The Elements of Typographic Style for the scale; keep lines under 80 characters; avoid the five default looks (DESIGN-003); plan tokens, review the plan, then build; watch CSS specificity; build to "a quality floor": "responsive down to mobile, visible keyboard focus, reduced motion respected, visually accessible, harmonious color palettes"; critique your work "taking screenshots to review if your environment supports it"; write plain, active-voice copy.

**`artifact-design`** is the design skill bundled with the Artifact tool, applied "when it builds an artifact". It looks for your design system first and defers to it and to your prompt (SURF-016). Since v2.1.281 it also "asks Claude for plain, direct prose". Use frontend-design for UI in a codebase, and `artifact-design` comes with published pages anyway. Both can be present in a desktop session.

## [DESIGN-006] House style: where design tokens live and what wins
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Artifacts: improve the visual design, page constraints](https://code.claude.com/docs/en/artifacts), [Set up your design system](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design)
- Related: DESIGN-002, DESIGN-012, SURF-016, MEM, REPO-044

**Where.** Anthropic: record tokens "where Claude can find them, such as the project's CLAUDE.md or a theme file in your repository". Any clear list works: "The heading and format above are an example; any clear list of colors, fonts, and spacing works." For a repo with agents, a repo skill that reviewers preload works too (REPO-044). A `DESIGN.md` is a community convention, not an Anthropic one (DESIGN-012).

**Precedence:** "Claude treats your design system as higher precedence than its own choices, and your prompt as higher precedence than both." For `/design` canvases and artifact templates, a Design System artifact does the same job (DESIGN-002).

**What a token block needs:** colours by role (surface, text, accent, borders, states), typefaces and their roles, a type scale, a spacing scale, radii by surface type, shadow and motion rules, and real examples. Roles beat raw hexes: Claude can apply "accent for links and primary actions", not "#10b981 somewhere".

**Fonts in artifacts:** Google Fonts is "the one external font source an artifact page can load from"; Claude inlines any other typeface as a `@font-face` data URI with a fallback stack. External images are blocked by the CSP. A private brand font in an artifact therefore costs data-URI tokens on every publish.

**Note:** the docs' sample block uses "Inter for body", which Anthropic's own design guidance lists as a generic default (INDEX.md Conflicts). It is a format example; choose your own type.

## [DESIGN-007] Verify a design by measuring, not only by looking
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Best practices: give Claude a way to verify its work](https://code.claude.com/docs/en/best-practices), [Desktop: auto-verify changes](https://code.claude.com/docs/en/desktop), [Vision: limitations](https://platform.claude.com/docs/en/build-with-claude/vision), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [WCAG 2.2: contrast (minimum), non-text contrast](https://www.w3.org/TR/WCAG22/)
- Related: FLOW-004, FLOW-014, SURF-006, REPO-021, TOK-043, DESIGN-008, DESIGN-013

The loop is FLOW-004's: "implement this design. take a screenshot of the result and compare it to the original. list differences and fix them". Have Claude "show evidence rather than asserting success… or a screenshot of the result". The desktop Browser pane does this "after every edit" unless `"autoVerify": false` is set (SURF-006).

**Split the check by question:**
- **Screenshots** for overall look, hierarchy, balance and anything a token can't express.
- **Measurement** for anything with a number: spacing, sizes, radii, font family and weight, colours, line length, contrast. In Playwright MCP, `browser_evaluate` with `getComputedStyle` and `getBoundingClientRect` returns the values the browser applied, and a contrast check compares them against WCAG AA (4.5:1 for body text, 3:1 for large text and UI parts).

Anthropic's vision page says "Claude's coordinate and localization outputs are approximate… verify outputs before relying on them" (DESIGN-008), so a screenshot can't settle "is this 16px or 20px?" or "is this #475569?".

**Cost:** each screenshot stays in context and is re-read on later turns (TOK-043). Run checks in a subagent that returns numbers and file paths (REPO-021). Measure at the breakpoints the design names, and with `prefers-reduced-motion` and keyboard focus where the quality floor requires them.

## [DESIGN-008] What Claude's vision gets wrong in design work
- Type: fact
- Applies to: Claude API, Claude Code, claude.ai
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Vision](https://platform.claude.com/docs/en/build-with-claude/vision), [Prompting Claude Opus 5.5: tools for complex visual inputs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5), [Introducing Claude Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7)
- Related: DESIGN-007, DESIGN-011, TOK-043

- **Positions are approximate:** "Claude's coordinate and localization outputs are approximate."
- **Small or poor images:** "Claude might hallucinate or make mistakes when interpreting low-quality, rotated, or very small images under 200 pixels."
- **No image generation:** "Claude is an image understanding model only… it cannot generate, produce, edit, manipulate, or create images." Design output is HTML, CSS, SVG or canvas drawing; photos come from you or a connector.
- **Resolution:** Claude 4.7 and later read up to 2576 px on the long edge (4,784 tokens); other models 1568 px. Bigger images are downscaled, which "might, for example, make text less legible". Crop to the region you're judging rather than sending a full-page screenshot.
- **Request limits:** 8000×8000 px per image; 20 images per message on claude.ai; on the API, above 20 images per request each image must stay under a stricter limit ("resize each image so that neither dimension exceeds 2000 px").
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
- Related: DESIGN-002, DESIGN-006, DESIGN-007, DESIGN-012

| Source | Route |
|---|---|
| React component library | `/design-sync` reads tokens and components; "works best for product design systems in code" (DESIGN-002) |
| Other code (Angular, Vue, plain CSS, a Tailwind theme) | Ask Claude to read the theme files, CSS custom properties and components and write one token list by role into CLAUDE.md, a theme file or the repo skill (DESIGN-006) |
| A live website | Measure computed styles in a browser (`getComputedStyle` over the page, DESIGN-007), or a community extractor (DESIGN-012) |

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
- Sonnet 5 defaults to `high`, "may settle into a consistent default visual style", and "follows explicit specs precisely".

**Benchmarks:** Design Creativity Bench (a preprint, 2026-10-08) puts Claude Opus 5.5 in the bottom group on originality (13th of 15, intervals overlapping) and first on meeting a brief's criteria, 99.2%. It is vendor-run and tested no prompting (DESIGN-026). WebDev Arena ranks pairwise human preference; we didn't read its current rankings. Anthropic's statements above are launch and guidance claims, not measurements.

**Our inference:** in our test Opus 5.5 and Sonnet 5.5 gave the same default page (DESIGN-027), so work on the prompt and process (DESIGN-004) before switching models. Use Opus 5.5 at `high` for open briefs, new directions, critiques and dense screenshots. Use Sonnet 5.5 for iterations inside an established design system or a precise spec, where following the spec matters more than taste. A checklist-driven visual check runs on Sonnet 5.5 at `medium` (REPO-021). Not Haiku for design judgement. Test before relying on any of this.

## [DESIGN-012] Community design skills (unofficial)
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-16
- Sources: [pbakaus/impeccable](https://github.com/pbakaus/impeccable), [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), [google-labs-code/design.md](https://github.com/google-labs-code/design.md), [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md), [Manavarya09/design-extract](https://github.com/Manavarya09/design-extract), [OneRedOak/claude-code-workflows design review](https://github.com/OneRedOak/claude-code-workflows), [wmedia.es: verify with Playwright MCP](https://wmedia.es/en/tips/claude-code-playwright-mcp-verify-own-work), [wmedia.es: /design-sync](https://wmedia.es/en/tips/claude-code-design-sync-your-components)
- Related: DESIGN-005, DESIGN-006, DESIGN-007, DESIGN-010, SKILL

None of these is Anthropic's. Read on 2026-10-16, not installed; stars from the GitHub API that day.

| Project | What it is | Notes |
|---|---|---|
| Impeccable (81,936 stars, Apache-2.0) | "1 skill, 24 commands, live browser iteration, and 59 deterministic detector rules"; "Impeccable started from" Anthropic's frontend-design | Ships hooks on SessionStart, PostToolUse and Stop, downloads a binary, and calls `impeccable.style` on every roll, with anonymous telemetry |
| Taste Skill (97,949, MIT) | A family of skills (`design-taste-frontend` and variants) with lint and browser-measurement scripts | "a few hundred thousand tokens" a build; scripts fetch images from public archives and run headless Chrome |
| DESIGN.md (Google, 28,394, Apache-2.0) | A spec: YAML tokens plus eight fixed sections, with a linter (`npx @google/design.md lint`) | Format version "alpha". VoltAgent's collection (121,750) of DESIGN.md files for well-known sites uses nine sections |
| designlang (4,246, MIT) | Reads computed styles of up to 5,000 elements from a URL and emits tokens, Tailwind config and DESIGN.md | `--smart` sends data to an external model endpoint |
| Design-review agents | OneRedOak's `design-review-agent.md` (Sonnet, Playwright, a 7-phase checklist, also given Edit and Write) | A reviewer shouldn't need write tools |

**Worth adopting as ideas:** an explicit banned-pattern list, a contrast floor, and a measuring check (wmedia.es: "A screenshot to look at produces an opinion. A getComputedStyle produces a fact."). A DESIGN.md is a reasonable token file; Anthropic only asks for "a theme file" or CLAUDE.md (DESIGN-006).

**Caution:** hooks, binaries and network calls run with your permissions. Read them, as with any plugin (MCP, SKILL).

## [DESIGN-013] Design pitfalls
- Type: anti-pattern
- Applies to: Claude Code, claude.ai
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Best practices: verify your work](https://code.claude.com/docs/en/best-practices), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [Prompting Claude Sonnet 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5), [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design)
- Related: DESIGN-007, DESIGN-009, DESIGN-003, DESIGN-012

| Pitfall | Guard |
|---|---|
| "Fixed it" with nothing rendered | Ask for evidence: "a screenshot of the result", or measured values (DESIGN-007) |
| Judging pixels from a screenshot | Measure computed styles; localisation is "approximate" (DESIGN-008) |
| Drift to Claude's house style on an open brief | Sonnet 5 "may settle into a consistent default visual style": give a spec or ask for directions (DESIGN-004) |
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
- Last verified: 2026-10-16
- Sources: [Utopia](https://utopia.fyi/), [Utopia type calculator](https://utopia.fyi/type/calculator/), [webtypography.net 2.1.2, quoting Bringhurst](https://webtypography.net/2.1.2), [Butterick: line length](https://practicaltypography.com/line-length.html), [Butterick: point size](https://practicaltypography.com/point-size.html), [WCAG 2.2 Understanding 1.4.8](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html), [MDN: text-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap)
- Related: DESIGN-004, DESIGN-005, DESIGN-019, DESIGN-021

**Scale.** Utopia defines one modular scale for a small screen and one for a large screen and lets `clamp()` interpolate. The calculator's default, `360,18,1.2,1240,20,1.25,5,2`, is a 360 px viewport at 18 px and ratio 1.2 ("Minor Third"), a 1240 px viewport at 20 px and ratio 1.25 ("Major Third"), 5 steps up and 2 down. It outputs `--step-0: clamp(1.125rem, 1.0739rem + 0.2273vw, 1.25rem)`. Butterick: body text "on the web, the optimal size is 15–25 pixels".

**Line length:**
- Bringhurst: "Anything from 45 to 75 characters is widely regarded as a satisfactory length… The 66-character line… is widely regarded as ideal." For columns, "40 to 50".
- Butterick: "45–90 characters, including spaces".
- WCAG 1.4.8 (AAA): "no more than 80 characters". frontend-design asks for under 80.

**Wrapping:** `text-wrap: balance` for headings (Chromium balances six lines or fewer); `pretty` for paragraphs, which "has a negative effect on performance".

**Typefaces:** we found no primary source on choosing them that we could read as raw text (Google Fonts Knowledge renders in JavaScript), nor one that ranks overused Google Fonts. Pick by role and subject (DESIGN-004), and record the choice as a token.

## [DESIGN-021] Token files: the DTCG format and three tiers
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [DTCG Format 2025.10](https://www.designtokens.org/TR/2025.10/format/), [DTCG Color 2025.10](https://www.designtokens.org/TR/2025.10/color/), [Material Web: theming](https://github.com/material-components/material-web/blob/main/docs/theming/README.md), [Style Dictionary: DTCG](https://styledictionary.com/info/dtcg/), [Terrazzo docs](https://terrazzo.app/docs/), [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- Related: DESIGN-006, DESIGN-012, DESIGN-015, DESIGN-024

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
- Related: DESIGN-001, DESIGN-004, DESIGN-009, DESIGN-012, DESIGN-027, DESIGN-029, REPO-021

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

## [DESIGN-030] Test: directions shown as swatches, with the repeat looks banned
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-16
- Sources: [Lovable: design guidance](https://docs.lovable.dev/features/design-guidance), [Prompting Claude Sonnet 5: design and frontend defaults](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5), local test
- Related: DESIGN-029, DESIGN-031, DESIGN-027, DESIGN-022, DESIGN-024, DESIGN-004, DESIGN-028

**Setup.** DESIGN-029 again, Sonnet 5.5, 5 runs, with this suffix after DESIGN-027's brief. The user picked each run's direction from a screenshot of `directions.html`, described in plain words, and `--resume` built it.

```text
Before building, propose 4 distinct visual directions tailored to this brief. Do not propose either of these looks, or a close variant of them: a cream or off-white background with a terracotta or rust accent and Fraunces with Inter; a dark forest-green background with a honey-gold accent and Cormorant Garamond with Work Sans.

Show the four directions side by side in a file named directions.html, so a person can compare them by eye without reading hex codes or font names. For each direction show its name, colour swatches labelled by role (background, text, accent), a sample headline and paragraph set in its actual fonts, a sample button, and a small sketch of the page layout. Then ask the user to pick one, and implement only that direction in index.html.
```

**The chooser.** No option used a banned look or cream. Yet every run offered the same four kinds: bright royal blue; a pastel with hot pink or teal and a chunky rounded headline; a dark one (deep plum, named "Night Shift" in 3 runs, or a chalkboard); paper or newspaper. Bricolage Grotesque, Bagel Fat One and Nunito were each on 4 of 5 chooser pages, a monospace on all 5. Picking from pictures was easy.

**The builds** were five different looks (sky blue with pink, blue-grey with gold, navy with coral, white with blue, plum with pink). They matched their picks in colour, type and hero. Background ΔE (pairwise mean) was 0.44, the highest so far. Below the hero all five shared one skeleton: three steps, three plans with the middle one raised, an FAQ (4 of 5), a form. "Fresh bread, …" opened 3 of 5 headlines.

**So:** show directions as pictures and ban the repeats, but the ban sets a new recurring set of options. Put section structure in the chooser or the brief (DESIGN-022), or every page gets one skeleton; DESIGN-031 stages it.

Tested 2026-10-16, v2.1.296, terminal `-p` launched from desktop WSL: 5 proposals 19:50–19:52 UTC and 5 builds 19:56–19:57 UTC, $1.01 in all.

## [DESIGN-031] Test: pick colour, then type, then layout, then combine
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-16
- Sources: [Lovable: design guidance](https://docs.lovable.dev/features/design-guidance), [Run Claude Code programmatically: continue conversations](https://code.claude.com/docs/en/headless), local test
- Related: DESIGN-030, DESIGN-029, DESIGN-025, DESIGN-022, DESIGN-016, DESIGN-020, DESIGN-028

**Setup.** The user's method: one Sonnet 5.5 session, DESIGN-027's brief reworded to allow several files, then the stages below. Each pick was sent as written with `--resume`. The user replaced a first stage of five palettes on mock-ups: "let's start wide, 20 color swatches of 4-8 colors… just squares".

```text
Work in four stages, and stop after each of the first three so I can pick. Make the options in each stage clearly different from each other, and tailored to this brief. I compare by eye, so show every option visually; hex codes and font names may appear but must not be needed.

1. Colour. Write palettes.html showing 20 colour palettes of 4 to 8 colours each. Show each palette as a row of plain squares next to each other, with only its number and name: no mock-up, sample text or labels. Put the background colour first. Do not propose a cream or off-white background with a terracotta or rust accent, or a dark forest-green background with a honey-gold accent.
2. Type. In the picked palette, write fonts.html showing 5 font pairings from Google Fonts side by side. For each: a name, a plain-words line on its character, and the same sample headline, subheading, paragraph, price and button set in its fonts. Do not propose Fraunces with Inter, or Cormorant Garamond with Work Sans.
3. Layout. Write layouts.html showing 5 page layouts side by side, as grey wireframes of the whole page from top to bottom, with every section labelled. Each must differ in structure and section order, not only in the top section. Use no colour or fonts from the earlier stages, so only the structure differs.
4. Combine the picked palette, fonts and layout into 5 variants of the full page, variant-1.html to variant-5.html. Keep the picks; vary the details: spacing and density, corner shapes, how the accent is used, decoration, and the headline treatment.

Start with stage 1 now.
```

**What happened.** The user kept 4 palettes, 2 font pairings and 2 layouts. Claude didn't force one pick: the font page got a palette switch, and the five variants were spread over the kept picks. The layouts differed in section order, unlike DESIGN-030; the first was DESIGN-030's skeleton, labelled "the expected order". The pairings reused DESIGN-030's fonts. 19 of 20 palettes had exactly 5 colours.

**Result:** the user called 4 of 5 variants good starting points. What wasn't a stage converged: "every Saturday" in 4 of 5 headlines, a CSS loaf icon in 4.

**So:** guide the person through one small choice at a time rather than generating whole designs, which converge on one look (DESIGN-027 to DESIGN-030). Start wide, keep several picks, and stage the copy too. One session, one judge.

Tested 2026-10-16, v2.1.296, terminal `-p` launched from desktop WSL, 20:05–20:17 UTC: $0.90 for the session (the last run's total includes the earlier ones); stage 4 took 271 s.

## Recommendations for our setup

Ranked by impact against effort.

1. **Done in this PR: route design questions here.** `claude-kb-lookup`'s description names "visual and UI design with Claude", with a `loads-19` case and a `skips-8` near miss for database design. The MCP server's `kb_search` description follows in a second PR once this one merges (FreekMencke/claude-kb#147).
2. **osrs-tracker-web: give the browser checker a contrast and token check** (DESIGN-007). Its `browser-checker` agent already has `browser_evaluate` and measures sizes when asked. It doesn't check text contrast against WCAG AA or compare computed colours with the theme tokens. The light and dark themes with tinted pills are where a contrast slip would hide. Tracked in [osrs-tracker/osrs-tracker-web#337](https://github.com/osrs-tracker/osrs-tracker-web/issues/337).
3. **Don't run `/design-sync` on osrs-tracker-web** (DESIGN-002). It's Angular, and the sync adapters read React only. Its design system stays in the repo skill and the design canvas artifact. If mock-ups move to `/design`, make a Design System artifact from a chat with `theme.css`, `base.css` and screenshots of real pages (DESIGN-010), and refresh it when the tokens change. No repo change.
4. **For a new page or redesign in any repo, prompt with DESIGN-004:** subject, audience and job; one small choice at a time, picked by you rather than by Claude, instead of whole designs, with DESIGN-031's prompt: 20 palettes as squares, then font pairings, then whole-page wireframes, then combined variants, keeping several picks per stage (4 of 5 variants were good starts; in DESIGN-027 the self-pick added template chrome, in DESIGN-029 half the options repeated across runs, in DESIGN-030 a one-page chooser left one section skeleton); a banned list grown from the last result; real copy, or a copy stage, since the headlines converged. In a Tailwind or shadcn repo, theme the defaults away first (DESIGN-023). No change needed: the `frontend-design` plugin we have installed is the current upstream text (identical checksum, 2026-10-16).
5. **Don't install Impeccable or Taste Skill user-wide** (DESIGN-012). They add hooks, a downloaded binary, telemetry or image fetching, and overlap with frontend-design. Borrow their banned lists and measuring ideas instead.
6. **Test design-prompt or skill changes with DESIGN-028's isolation flags**, measured as in DESIGN-027, so CLAUDE.md, the frontend-design plugin and the output style don't leak into the result. The measuring scripts aren't in the repo; adding them under `evals/` would make the test re-runnable.
7. **Considered, not adopted: `--color-*: initial` in osrs-tracker-web's `@theme`** (DESIGN-023). On 2026-10-16 its templates used no default palette colour classes, so clearing them would turn an off-token colour into a build error. Its repo skill already says "a value the scale lacks becomes a token", and osrs-tracker/osrs-tracker-web#337 adds a computed-colour check; a change would first have to check what `@tailwindcss/forms` reads from the default palette. Not worth an issue now.

## Open questions

- **The full frontend-design skill wasn't tested** (DESIGN-027): S3 used only its two passes, without its list of default looks. Nor was a second brief: every test used the bakery. The staged method (DESIGN-031) ran once, with one person judging, and its five font pairings reused the fonts of earlier choosers; whether 20 font options or a copy stage would widen the result is untested.
- **The test kept only final pages:** `--output-format json` returns the last message, so S2's four directions and S3's plans weren't recorded (DESIGN-028). `stream-json` would keep them.
- **Typeface choice has no raw-text primary source here** (DESIGN-020): Google Fonts Knowledge and m3.material.io render in JavaScript, so curl got empty pages. A browser read would fill this.
- **Does OpenAI's "no cards" guidance transfer to Claude?** (DESIGN-022) Written for its GPT models; untested on Claude.
- **Not read:** Müller-Brockmann's grid systems via a reputable secondary source, Refactoring UI's public pages, the CRAP principles, Carbon's and Polaris's spacing pages, Storybook and Chromatic (DESIGN-022, DESIGN-024).
- **Leonardo and OKLCH:** its README lists LCH, LAB, CAM02, HSL, HSLuv, HSV and RGB only (DESIGN-016); whether newer builds interpolate in OKLCH wasn't checked.
- **`/design` minimum version:** v2.1.265 (artifacts page) or v2.1.234 (week-34 notes); already in INDEX.md Conflicts (DESIGN-001).
- **`/design-sync` on a non-React repo:** concluded from the bundle and docs, not run, because a run writes to claude.ai. A run against a scratch design-system project would confirm what it reports for an Angular library (DESIGN-002).
- **The issue's "Claude 4 best-practices page suggests Inter for headings" conflict doesn't hold on 2026-10-16:** the general prompting page names Inter three times, all as fonts to avoid. Not added to Conflicts.
- **No benchmark compares Claude models on design quality as people judge it, beyond pairwise preference** (DESIGN-011, DESIGN-026). Design Creativity Bench measures originality with an embedding metric; we didn't check how it was validated (its Appendix B).
