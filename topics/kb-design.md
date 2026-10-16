# Visual and UI design with Claude

Prefix `DESIGN`. This file covers getting Claude to produce original, logical and coherent visual design for websites and web apps: layouts, colour schemes, type, design systems and tokens, and how CSS and UI libraries pull output toward the same look. Claude Code is the tool for visualising and iterating on a design (artifacts, `/design` canvases, the browser) as well as for building it. External design tools (Figma, Canva) and software, API or database design are out of scope. It links rather than repeats: artifact mechanics (SURF-008 to SURF-017), the desktop Browser pane (SURF-006), screenshot loops and browser checks (FLOW-004, FLOW-014), the visual checker subagent (REPO-021), image token cost (TOK-043), skill loading (SKILL) and general prompting (PROMPT).

Research basis:
- Researched 2026-10-16 (FreekMencke/claude-kb#147) against Claude Code v2.1.296 in a desktop WSL session, on the Claude 5 model family. The same day the scope was narrowed at the user's request: no external design tools, and Claude Design only as far as Claude Code's `/design` uses it.
- The lead read Anthropic's pages in full as raw text: the Claude Code artifacts, best-practices and desktop pages (`.md`), the platform prompting pages for Opus 5.5 and Sonnet 5, the general prompting page and the vision page (`.md`), the help center's design-system and custom-visuals articles (HTML stripped of tags), the 2025-11-12 claude.com blog post and the Opus 4.7 launch post, and the frontend-design `SKILL.md` from all three Anthropic repos plus its git history.
- A Sonnet 5.5 research subagent read community design skills and practice; the lead re-checked every quote used here against its downloads.
- `/design-sync`'s framework support was read from the installed v2.1.296 CLI bundle and the session's `DesignSync` tool description, because the docs say only "React components".
- A 2026-10-16 deep-research report from a claude.ai chat supplied leads only; it isn't cited.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| How do I see and iterate on a design in Claude Code? | Ask for variants side by side in one artifact ("four distinctly different layouts… as a grid"), tune one with sliders, or run `/design <brief>` for a canvas of editable artboards. Then build the pick in code and check it in the desktop Browser pane or with Playwright. | DESIGN-001 |
| Why do Claude's pages look generic? | "Distributional convergence": without direction it samples safe defaults. The 2025 tell was Inter and purple gradients; the 2026-09 frontend-design skill names cream-plus-serif-plus-terracotta, near-black with one acid accent, broadsheet hairlines, the SaaS-card kit and template chrome. | DESIGN-003 |
| How do I prompt for distinctive design? | Name the subject, audience and the page's one job; give a concrete spec (hex palette, typefaces, radius, motion timing) or ask for 4 directions first; ban the specific patterns you got last time, not "the AI look"; use real copy. | DESIGN-004 |
| frontend-design or `artifact-design`? | frontend-design is the plugin skill for UI in code and is identical in all three Anthropic repos (last changed 2026-09-01 to 09-03). `artifact-design` is bundled with the Artifact tool and governs published pages. | DESIGN-005 |
| Where do design tokens go? | Where Claude reads them: the project's CLAUDE.md, a theme file, or a repo skill. Precedence: your prompt, then your design system, then Claude's defaults. Artifacts load fonts only from Google Fonts; other faces are inlined. | DESIGN-006 |
| Does `/design-sync` work for an Angular (non-React) design system? | No. The docs say "React components", and the v2.1.296 CLI's sync adapters read `.tsx`/`.jsx` exports and React Storybook stories. Give `/design` a Design System artifact made from a chat instead. | DESIGN-002, DESIGN-010 |
| Screenshot or computed styles to check a design? | Screenshots for overall look and hierarchy; computed styles (`getComputedStyle`, a contrast check) for exact spacing, sizes, colours and contrast, because Claude's localisation is "approximate". | DESIGN-007, DESIGN-008 |
| Can Claude generate images for a design? | No. Claude "cannot generate, produce, edit, manipulate, or create images"; its design output is HTML, CSS, SVG or canvas. | DESIGN-008 |
| How do I improve an existing design rather than redesign it? | Give the highest-fidelity input you have (code plus the running app, then a URL, then a screenshot), lock the tokens, audit against a checklist and change one thing at a time; redesign only when asked, on a branch. | DESIGN-009 |
| How do I get a design system out of existing code? | React: `/design-sync`. Anything else: have Claude read the theme files, CSS custom properties and components into one token list in the repo, cleaned to one token per role. | DESIGN-010 |
| Which model and effort for design work? | No published design benchmark. Anthropic says Opus "performs the best at visualization tasks" and Opus 5.5 reads screenshots far better than Opus 5; use Opus 5.5 at `high` for new directions and critique, Sonnet 5.5 for iterations inside a set design system. Inference, not measured. | DESIGN-011 |
| Should I install Impeccable or another community design skill? | They're unofficial; read them for their anti-pattern lists and audit commands, and adopt ideas rather than install them blind. | DESIGN-012 |
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
- Related: DESIGN-003, DESIGN-005, DESIGN-006, PROMPT

1. **Ground it.** Name "one concrete subject, the design's audience, and the design's primary job" (frontend-design). Distinctive choices come from the subject's "industry, subject matter, materials, and vernacular".
2. **Give a concrete spec when you have one.** Sonnet 5 "follows explicit specs precisely". Anthropic's AEFRM example gives five hex values, "4px corner radius", the typeface's character, the section order and "transition: all 160ms ease out".
3. **Or ask for directions first.** "Before building, propose 4 distinct visual directions tailored to this brief (each as: bg hex / accent hex / typeface, plus a one-line rationale)." Because Sonnet 5 doesn't accept `temperature`, this is "the recommended way to produce meaningfully different design directions across runs".
4. **Ban specific patterns and iterate the list.** Opus 5.5's example: "Do not use a cream or off-white background, italic accent words in headlines, numbered "01/02/03" section labels, monospace labels, or pill-shaped buttons." Then "check which styles the first result used instead, and extend the list if needed."
5. **Plan tokens before code.** frontend-design's two passes: a compact plan (4–6 named hex values, typefaces and roles, a layout in prose and ASCII wireframes, principles), then a review of that plan against the brief, then code.
6. **Real copy.** "Copy can make a design feel as templated as the design itself." CTAs say what happens: "Save changes," not "Submit."
7. **Restraint.** "Spend your boldness in one place." Use one orchestrated motion moment, not entrance animations on every section.

The `<frontend_aesthetics>` snippets on the general and Sonnet 5 pages still ask for "animations for effects and micro-interactions"; the 2026-09 skill is stricter on motion (INDEX.md Conflicts).

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
- Related: DESIGN-008, ORCH-030, ORCH-028, FLOW-009

**What Anthropic says:**
- Custom visuals: "Opus performs the best at visualization tasks, so if you're going for something complex, we'd recommend choosing a more intelligent model."
- Opus 4.7 (2026-04-16 launch) was "more tasteful and creative… producing higher-quality interfaces, slides, and docs", and powered Claude Design at launch.
- Opus 5.5 reads screenshots and diagrams far better than Opus 5, even at its lowest effort. Its default is `medium`, and it uses image tools "more effectively at higher effort levels" (DESIGN-008).
- Sonnet 5 defaults to `high`, "may settle into a consistent default visual style", and "follows explicit specs precisely".

**No published design benchmark** compares the models on design quality. Anthropic's statements above are launch and guidance claims, not measurements.

**Our inference:** use Opus 5.5 at `high` for open briefs, new directions, critiques and dense screenshots. Use Sonnet 5.5 for iterations inside an established design system or a precise spec, where following the spec matters more than taste. A checklist-driven visual check runs on Sonnet 5.5 at `medium` (REPO-021). Not Haiku for design judgement. Test before relying on any of this.

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

## Recommendations for our setup

Ranked by impact against effort.

1. **Done in this PR: route design questions here.** `claude-kb-lookup`'s description names "visual and UI design with Claude", with a `loads-19` case and a `skips-8` near miss for database design. The MCP server's `kb_search` description follows in a second PR once this one merges (FreekMencke/claude-kb#147).
2. **osrs-tracker-web: give the browser checker a contrast and token check** (DESIGN-007). Its `browser-checker` agent already has `browser_evaluate` and measures sizes when asked. It doesn't check text contrast against WCAG AA or compare computed colours with the theme tokens. The light and dark themes with tinted pills are where a contrast slip would hide. Tracked in [osrs-tracker/osrs-tracker-web#337](https://github.com/osrs-tracker/osrs-tracker-web/issues/337).
3. **Don't run `/design-sync` on osrs-tracker-web** (DESIGN-002). It's Angular, and the sync adapters read React only. Its design system stays in the repo skill and the design canvas artifact. If mock-ups move to `/design`, make a Design System artifact from a chat with `theme.css`, `base.css` and screenshots of real pages (DESIGN-010), and refresh it when the tokens change. No repo change.
4. **For a new page or redesign in any repo, prompt with DESIGN-004:** subject, audience and job; four directions first; a banned list from the last result; real copy. No change needed: the `frontend-design` plugin we have installed is the current upstream text (identical checksum, 2026-10-16).
5. **Don't install Impeccable or Taste Skill user-wide** (DESIGN-012). They add hooks, a downloaded binary, telemetry or image fetching, and overlap with frontend-design. Borrow their banned lists and measuring ideas instead.

## Open questions

- **`/design` minimum version:** v2.1.265 (artifacts page) or v2.1.234 (week-34 notes); already in INDEX.md Conflicts (DESIGN-001).
- **`/design-sync` on a non-React repo:** concluded from the bundle and docs, not run, because a run writes to claude.ai. A run against a scratch design-system project would confirm what it reports for an Angular library (DESIGN-002).
- **The issue's "Claude 4 best-practices page suggests Inter for headings" conflict doesn't hold on 2026-10-16:** the general prompting page names Inter three times, all as fonts to avoid. Not added to Conflicts.
- **No published benchmark compares Claude models on design quality** (DESIGN-011). Searched Anthropic's prompting pages, launch posts and release notes.
