# Visual and UI design with Claude

Prefix `DESIGN`. This file covers visual and UI design with Claude: web and landing pages, app screens, posters, the look of slides, and design systems. It owns design outcomes and workflows: which surface to use, getting output that doesn't look generic, keeping it on-brand, checking it visually and improving an existing design. It doesn't cover software, API or database design. It links rather than repeats: artifact mechanics (SURF-008 to SURF-017), the desktop Browser pane (SURF-006), screenshot loops and browser checks (FLOW-004, FLOW-014), the visual checker subagent (REPO-021), image token cost (TOK-043), skill loading (SKILL), MCP setup (MCP) and general prompting (PROMPT).

Research basis:
- Researched 2026-10-16 (FreekMencke/claude-kb#147) against Claude Code v2.1.296 in a desktop WSL session, on the Claude 5 model family.
- The lead read Anthropic's pages in full as raw text: the Claude Code artifacts, best-practices and desktop pages (`.md`), the platform prompting pages for Opus 5.5 and Sonnet 5, the general prompting page and the vision page (`.md`), six help-center articles and the release notes (HTML stripped of tags), two anthropic.com posts and the 2025-11-12 claude.com blog post, and the frontend-design `SKILL.md` from all three Anthropic repos plus its git history.
- Two Sonnet 5.5 research subagents took one block each: the Figma and Canva connectors, and community design skills and practice. The lead re-checked every quote used here against their downloads or the live page.
- `/design-sync`'s framework support was read from the installed v2.1.296 CLI bundle and the session's `DesignSync` tool description, because the docs say only "React components".
- A 2026-10-16 deep-research report from a claude.ai chat supplied leads only; it isn't cited.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which surface for which design job? | A mock-up or prototype to review and share: a Claude Design artifact (chat, Artifacts tab, or `/design` in Claude Code). A diagram to think with: an inline visual. Shipping UI: code in the repo with the frontend-design skill and a browser check. Editing an existing Figma file: Figma's MCP server. On-brand marketing assets in Canva: Canva's connector. | DESIGN-001 |
| What happened to Claude Design? | Launched 2026-04-17 as an Anthropic Labs preview on Opus 4.7; since 2026-09-16 it is an artifact template in any chat, Claude Code and the Artifacts tab, on every plan including Free. Standalone claude.ai/design closes 2026-12-14. | DESIGN-002 |
| How do I make a design system Claude applies everywhere? | A Design System artifact: from a chat (brand assets, decks, Figma files), with `/design-sync` in Claude Code (React components only), or migrated from standalone Claude Design. Owners set an organization default. | DESIGN-005, DESIGN-006 |
| Does `/design-sync` work for an Angular (non-React) design system? | No. The docs say "React components", and the v2.1.296 CLI's sync adapters read `.tsx`/`.jsx` exports and React Storybook stories. Build the design system from a chat instead. | DESIGN-006, DESIGN-014 |
| Why do Claude's pages look generic? | "Distributional convergence": without direction it samples safe defaults. The 2025 tell was Inter and purple gradients; the 2026-09 frontend-design skill names cream-plus-serif-plus-terracotta, near-black with one acid accent, broadsheet hairlines, the SaaS-card kit and template chrome. | DESIGN-007 |
| How do I prompt for distinctive design? | Name the subject, audience and the page's one job; give a concrete spec (hex palette, typefaces, radius, motion timing) or ask for 4 directions first; ban the specific patterns you got last time, not "the AI look"; use real copy. | DESIGN-008 |
| frontend-design or `artifact-design`? | frontend-design is the plugin skill for UI in code and is identical in all three Anthropic repos (last changed 2026-09-01 to 09-03). `artifact-design` is bundled with the Artifact tool and governs published pages. | DESIGN-009 |
| Where do design tokens go? | Where Claude reads them: the project's CLAUDE.md, a theme file, or a repo skill. Precedence: your prompt, then your design system, then Claude's defaults. Artifacts load fonts only from Google Fonts; other faces are inlined. | DESIGN-010 |
| Screenshot or computed styles to check a design? | Screenshots for overall look and hierarchy; computed styles (`getComputedStyle`, a contrast checker) for exact spacing, sizes, colours and contrast, because Claude's localisation is "approximate". | DESIGN-011, DESIGN-012 |
| Can Claude generate images for a design? | No. Claude "cannot generate, produce, edit, manipulate, or create images"; its design output is HTML, CSS, SVG or canvas. | DESIGN-012 |
| How do I improve an existing design rather than redesign it? | Give the highest-fidelity input you have (code plus the running app, then Figma, a URL, a screenshot), lock the tokens, audit against a checklist and change one thing at a time; redesign only when asked, on a branch or a saved direction. | DESIGN-013 |
| Can Claude edit my Figma file? | Yes, through Figma's remote MCP server (`https://mcp.figma.com/mcp`, or the `figma` plugin): `use_figma` writes native layers. It needs a Full seat outside your drafts, is free in beta and "will eventually become a usage-based paid feature". The desktop server can't write. | DESIGN-015 |
| Which model and effort for design work? | No published design benchmark. Anthropic says Opus "performs the best at visualization tasks" and Opus 5.5 reads screenshots far better than Opus 5; use Opus 5.5 at `high` for new directions and critique, Sonnet 5.5 for iterations inside a set design system. Inference, not measured. | DESIGN-017 |
| Should I install Impeccable or another community design skill? | They're unofficial; read them for their anti-pattern lists and audit commands, and adopt ideas rather than install them blind. | DESIGN-018 |
| What goes wrong most often? | Claude claiming fixes it never rendered, drifting to its house style, redesigning when asked to polish, animating everything, CSS specificity clashes, and messy source design systems. | DESIGN-019 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| DESIGN-001 | Which surface for which design job | comparison | surfaces, claude-design, figma, canva, frontend-design |
| DESIGN-002 | Claude Design: history, where it runs, plans and the standalone shutdown | fact | claude-design, plans, shutdown, enterprise |
| DESIGN-003 | Making and refining a design in Claude Design | pattern | claude-design, comments, canvas, variations |
| DESIGN-004 | Claude Design exports, hand-offs, sharing, usage and known limits | fact | claude-design, export, handoff, limits |
| DESIGN-005 | Design System artifacts | fact | design-system, migration, admin, default |
| DESIGN-006 | `/design` and `/design-sync` in Claude Code | fact | design-command, design-sync, react, angular |
| DESIGN-007 | Why Claude's designs look generic, and the named clichés by date | fact | generic, distributional-convergence, cliches |
| DESIGN-008 | Prompting for distinctive design | recommendation | prompting, brief, tokens, banned-patterns, directions |
| DESIGN-009 | The frontend-design skill and how it differs from `artifact-design` | tool | frontend-design, artifact-design, skills |
| DESIGN-010 | House style: where design tokens live and what wins | recommendation | tokens, CLAUDE.md, design-md, fonts, precedence |
| DESIGN-011 | Verify a design by measuring, not only by looking | pattern | verification, computed-styles, screenshots, contrast |
| DESIGN-012 | What Claude's vision gets wrong in design work | fact | vision, limits, coordinates, image-size |
| DESIGN-013 | Improving an existing design: inputs, audit, polish or redesign | pattern | audit, redesign, polish, accessibility, variants |
| DESIGN-014 | Extracting a design system from code, Figma or a URL | pattern | design-system, extraction, design-sync, figma |
| DESIGN-015 | Figma's MCP server: read, write to canvas, seats and pricing | tool | figma, mcp, use_figma, code-connect |
| DESIGN-016 | Canva's connector and when it beats Claude Design | tool | canva, connector, brand-kit |
| DESIGN-017 | Models and effort for design work | recommendation | models, effort, opus, sonnet, inference |
| DESIGN-018 | Community design skills (unofficial) | comparison | community, impeccable, taste-skill, design-md |
| DESIGN-019 | Design pitfalls | anti-pattern | pitfalls, verification, drift, animation, css |
| DESIGN-020 | Inline custom visuals in chat | fact | inline-visuals, chat, diagrams, ephemeral |

## [DESIGN-001] Which surface for which design job
- Type: comparison
- Applies to: Claude Code, claude.ai
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design), [Artifacts: draft a design canvas](https://code.claude.com/docs/en/artifacts), [Custom visuals in chat](https://support.claude.com/en/articles/13979539-custom-visuals-in-chat), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)
- Related: DESIGN-002, DESIGN-006, DESIGN-009, DESIGN-015, DESIGN-016, DESIGN-020, SURF-016, SURF-033

In Claude Design, Claude Code artifacts and inline visuals, Claude writes the HTML, CSS and SVG itself. Through a connector it drives another tool's editor.

| Job | Surface | Why |
|---|---|---|
| Mock-up, screen flow, prototype or poster to review and share | Claude Design artifact: ask in a chat, **Output > Design**, a Design template in the Artifacts tab, or `/design <brief>` in Claude Code | Canvas of artboards, inline comments, direct edits, design system applied, exports (DESIGN-002 to DESIGN-004) |
| A diagram or chart to explain something now | Inline custom visual in chat | Ephemeral; save as artifact if it's worth keeping (DESIGN-020) |
| UI that ships in a repo | Code, with the frontend-design skill and a browser check | Real components and tokens; verify in the browser (DESIGN-009, DESIGN-011) |
| A page or report to share from a Claude Code session | Artifact with the built-in `artifact-design` skill | SURF-008, SURF-016 |
| Design work that lives in Figma | Figma's MCP server | Reads variables and components; `use_figma` writes native layers (DESIGN-015) |
| On-brand social or marketing assets in Canva | Canva's connector | Brand Kit, Canva's templates and editor (DESIGN-016) |

A Claude Design artifact can also be sent to Canva or handed to Claude Code, so the surfaces chain: explore in Claude Design, build in code, polish marketing assets in Canva.

## [DESIGN-002] Claude Design: history, where it runs, plans and the standalone shutdown
- Type: fact
- Applies to: claude.ai, Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Introducing Claude Design by Anthropic Labs](https://www.anthropic.com/news/claude-design-anthropic-labs), [Release notes](https://support.claude.com/en/articles/12138966-release-notes), [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design), [Migrate from standalone Claude Design](https://support.claude.com/en/articles/17440474-migrate-from-standalone-claude-design-to-claude), [Artifacts admin guide](https://support.claude.com/en/articles/16994751-artifacts-admin-guide-for-team-and-enterprise-plans)
- Related: DESIGN-003, DESIGN-005, SURF-016

**History.** Launched 2026-04-17 as an Anthropic Labs product, "powered by our most capable vision model, Claude Opus 4.7", in research preview for Pro, Max, Team and Enterprise. On 2026-09-16 it moved into Claude: "You can now ask for a design, deck, or document in any conversation with Claude, including in Claude Code and the Artifacts tab". Artifacts, including Claude Design, "are available on every plan, including Free". No page since the merge says which model runs it.

**Where:** a chat ("Make a one-pager from this proposal", or **Output > Design**), a Design template in the Artifacts tab, Claude Code (`/design`, DESIGN-006), and the iOS and Android apps (create and edit; sharing settings need web or desktop).

**Enterprise:** "it turns on by default on October 15, 2026"; Team has it on by default. Older pages still say off by default (INDEX.md Conflicts).

**Standalone shutdown:** "The standalone Claude Design site (claude.ai/design) will close on December 14, 2026". Design systems migrate (DESIGN-005); projects stay there until then, with up to 60 listed in the Artifacts page. Chats and comments are not carried over and are deleted after it closes, and public links to standalone projects stop working. Download projects one at a time via **Share > Project HTML > Project archive** (.zip, free).

## [DESIGN-003] Making and refining a design in Claude Design
- Type: pattern
- Applies to: claude.ai, Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design), [Introducing Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs)
- Related: DESIGN-002, DESIGN-008, DESIGN-013

The documented flow: start a design, attach the design system, add context (screenshots, a codebase), describe it, review the canvas, refine, export or share. "A design is a canvas of artboards. Each artboard holds layers, such as text, shapes, and images".

**Prompt anatomy (help center):** "the goal (what you're building), the layout (how things should be arranged), the content (what information to display), and the audience (who will use it)". Claude asks clarifying questions if it needs to.

**Three ways to refine:**
- **Chat** for "structural changes, new sections, or anything that requires explanation or context" ("Show me 2–3 alternative layouts for this page").
- **Inline comments** for "targeted, component-level changes" ("Make this button padding larger"). If comments aren't picked up, paste the feedback into chat: "a known workaround for an intermittent issue".
- **Direct canvas edits** (drag, resize, align) "for quick visual and aesthetic changes". The launch post also names "adjustment knobs" and "custom sliders (made by Claude)".

**Tips from the same page:** be specific ("Tighten the spacing between form fields to 8px"), name design-system components ("Use the Primary Button component"), say early which breakpoints matter, ask for 2–3 variations, and ask Claude to review "for accessibility, contrast ratios, information hierarchy, and general usability".

**Exploring without losing work:** "Save what we have and try a completely different approach." There is no version history (DESIGN-004), so this and exports are how you keep a direction.

## [DESIGN-004] Claude Design exports, hand-offs, sharing, usage and known limits
- Type: fact
- Applies to: claude.ai, Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design), [Claude Design admin guide](https://support.claude.com/en/articles/14604406-claude-design-admin-guide-for-team-and-enterprise-plans), [Artifacts: draft a design canvas](https://code.claude.com/docs/en/artifacts)
- Related: DESIGN-002, DESIGN-006, SURF-008

**Exports** (the **Export** button): .zip, PDF, PPTX, Google Slides, standalone HTML; "Send to the tools you already use: Adobe Experience Manager, Adobe for Creativity, Adobe Journey Optimizer, Base44, Canva, Gamma, HubSpot, Hyperframes, Lovable, Miro, Netlify, Replit, v0, Vercel, and Wix"; and **Handoff to Claude Code** (a local coding agent or Claude Code on the web). From a `/design` canvas in Claude Code, "You can export each artboard as PNG or PDF."

**Sharing:** designs start private; people you share with can view, comment on or edit. Mobile apps can't change sharing settings. Previews run "inside a sandboxed iframe on a separate content domain", with access re-checked on every open.

**Usage:** "Claude Design counts toward the same usage limits as the rest of Claude", including Claude Code. Its earlier separate weekly allowance is gone.

**Known limits** (help center, 2026-10-16):
- "Claude Design doesn't have version history yet."
- "Two or more people editing a design project at the same time is still basic and may not work reliably."
- "Design system import is only as good as its source. A messy codebase or an incomplete file will show up in the output."
- Inline comments sometimes don't show on the page (open the comments view).
- For very large repositories, link them from Claude Code to avoid lag.
- Placing new layers needs a mouse; "Ask Claude to add it."
- The admin guide adds: no data residency support; standalone Claude Design has no audit logs.

## [DESIGN-005] Design System artifacts
- Type: fact
- Applies to: claude.ai, Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Set up your design system](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design), [Migrate from standalone Claude Design](https://support.claude.com/en/articles/17440474-migrate-from-standalone-claude-design-to-claude), [Artifacts admin guide](https://support.claude.com/en/articles/16994751-artifacts-admin-guide-for-team-and-enterprise-plans)
- Related: DESIGN-006, DESIGN-010, DESIGN-014, SURF-016

"A design system captures your colors, typography, components, and layout patterns, so Claude applies them to every new design and deck." Typical content: colour palette, typography, components and layout patterns (spacing, grids, page structures).

**Plans:** "available in beta on Pro, Max, Team, and Enterprise plans". On by default on Pro, Max and Team; "On Enterprise plans, they're off until an owner turns on Design systems".

**Three ways to make one:**
- **From a chat**, from connected apps, uploads, Figma files, decks, logos and fonts: "works best for brand design systems".
- **`/design-sync` in Claude Code**: "If your design system already exists as React components" (DESIGN-006).
- **Migration from standalone Claude Design**: one run brings over every design system in the organization; empty ones and ones made from a built-in starter theme aren't migrated. A migrated one "keeps its files as they were, and you can't edit it yourself on its page yet" ("Ask Claude to make changes"), and shows a banner with **Let Claude clean it up**, which tidies "its guide, tokens, and components". Too-large or unreadable files block a migration; the uploads folder "often contains duplicate files".

**Admin defaults:** only an Owner or Primary Owner can share a design system with everyone, set the organization default (which "is preselected" when users start an artifact) or delete one shared with everyone; it must be shared with everyone first. Manage them in **Settings > Design systems**.

**Validate it:** make test projects ("Create a landing page for [your product]") and check them against the brand. "Include real examples, not just specs."

## [DESIGN-006] `/design` and `/design-sync` in Claude Code
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Artifacts: draft a design canvas, availability](https://code.claude.com/docs/en/artifacts), [What's new, week 34](https://code.claude.com/docs/en/whats-new/2026-w34), [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design), [Set up your design system](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design), local reading of the v2.1.296 CLI and its `DesignSync` tool description, [wmedia.es: /design-sync (community)](https://wmedia.es/en/tips/claude-code-design-sync-your-components)
- Related: DESIGN-005, DESIGN-014, SURF-009, SURF-016

**`/design <brief>`:** "Claude drafts the design as artboards on one canvas and publishes the canvas as a Claude Design artifact", for "a UI, a screen flow, a landing page, or a poster". It needs a session where artifacts are available: a claude.ai login (not an API key, gateway token or cloud-provider credential), the Anthropic API rather than Bedrock, Vertex or Foundry, and not `-p`. Minimum version: v2.1.265 on the artifacts page, v2.1.234 in the week-34 notes (INDEX.md Conflicts). If the organization turned the Design template off, "`/design` doesn't draft designs". The help center adds that `/design` can "import a design into your codebase, export your code as a live prototype".

**`/design-sync`:** syncs a local component library with a design-system project, "incrementally, one component at a time, never as a wholesale replace" (the `DesignSync` tool description, v2.1.296). It lists, reads and diffs remote files, then asks you to approve a plan that names every path it will write or delete. It can also create a new design-system project. The bundle routes `/design sync`, `login`, `consent`, `revoke`, `import`, `export` and `status`. `/design-login` gives sessions without a claude.ai login a design-only authorization. It is unavailable while `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is set.

**Not for Angular.** The docs scope it to React components. In the v2.1.296 bundle, the package adapter collects PascalCase exports from `.tsx`/`.jsx` files and `.d.ts`, and the Storybook path composes React stories. An Angular library (templates in `.html`, `@Component` classes in `.ts`) matches neither. A community write-up that read the skill's source agrees: "Vue, Angular and Svelte do not". For a non-React system, build the Design System artifact from a chat (DESIGN-014).

Tested 2026-10-16, v2.1.296, desktop WSL: `DesignSync` was a deferred tool in the session; `/design-sync` wasn't run (it writes to claude.ai).

## [DESIGN-007] Why Claude's designs look generic, and the named clichés by date
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Improving frontend design through Skills (2025-11-12)](https://claude.com/blog/improving-frontend-design-through-skills), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5), [Prompting Claude Sonnet 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5)
- Related: DESIGN-008, DESIGN-009

**Cause.** Anthropic's 2025-11-12 post: "Distributional convergence… Safe design choices–those that work universally and offend no one–dominate web training data. Without direction, Claude samples from this high-probability center."

**The tells move.** Date every cliché list:
- **2025-11 (blog):** "Inter fonts, purple gradients on white backgrounds, and minimal animations". Its snippet also notes convergence on "Space Grotesk".
- **2026-06 skill:** three looks: cream with a serif and terracotta, near-black with one acid accent, broadsheet hairlines.
- **2026-09 skill (current):** five traits: (1) "a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta or warm-clay accent (often near #D97757 — Anthropic's own Claude-interaction accent…)"; (2) "a near-black background with a single bright acid-green or vermilion accent"; (3) "a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns"; (4) "the SaaS-card kit", meaning identical rounded cards, one radius, `rgba(0,0,0,.1)` shadows and gradient washes; (5) "template chrome": all-caps eyebrows, `A · B · C` meta strings, "WORD — fragment" labels, `#0B0B0B` for black, monospace data labels and a `→` on every link.
- Typographic tells in the same skill: one accented word in a headline, all-caps labels, labels above content, and `01 / 02 / 03` markers on content that isn't a sequence.

**Model pages:** Opus 5.5 "falls back on a few default styles"; Sonnet 5 "may settle into a consistent default visual style". On both, a general "avoid a generic AI look" "mostly swaps one default for another".

## [DESIGN-008] Prompting for distinctive design
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Prompting Claude Sonnet 5: design and frontend defaults](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5), [Prompting Claude Opus 5.5: frontend design defaults](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design)
- Related: DESIGN-007, DESIGN-009, DESIGN-010, PROMPT

1. **Ground it.** Name "one concrete subject, the design's audience, and the design's primary job" (frontend-design). Distinctive choices come from the subject's "industry, subject matter, materials, and vernacular".
2. **Give a concrete spec when you have one.** Sonnet 5 "follows explicit specs precisely". Anthropic's AEFRM example gives five hex values, "4px corner radius", the typeface's character, the section order and "transition: all 160ms ease out".
3. **Or ask for directions first.** "Before building, propose 4 distinct visual directions tailored to this brief (each as: bg hex / accent hex / typeface, plus a one-line rationale)." Because Sonnet 5 doesn't accept `temperature`, this is "the recommended way to produce meaningfully different design directions across runs".
4. **Ban specific patterns and iterate the list.** Opus 5.5's example: "Do not use a cream or off-white background, italic accent words in headlines, numbered "01/02/03" section labels, monospace labels, or pill-shaped buttons." Then "check which styles the first result used instead, and extend the list if needed."
5. **Plan tokens before code.** frontend-design's two passes: a compact plan (4–6 named hex values, typefaces and roles, a layout in prose and ASCII wireframes, principles), then a review of that plan against the brief, then code.
6. **Real copy.** "Copy can make a design feel as templated as the design itself." CTAs say what happens: "Save changes," not "Submit."
7. **Restraint.** "Spend your boldness in one place." Use one orchestrated motion moment, not entrance animations on every section.
8. **In Claude Design:** goal, layout, content and audience, with feedback in numbers (DESIGN-003).

The `<frontend_aesthetics>` snippets on the general and Sonnet 5 pages still ask for "animations for effects and micro-interactions"; the 2026-09 skill is stricter on motion (INDEX.md Conflicts).

## [DESIGN-009] The frontend-design skill and how it differs from `artifact-design`
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-16
- Sources: [claude-code: frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [claude-plugins-official copy](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [anthropics/skills copy](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), [Artifacts: improve the visual design](https://code.claude.com/docs/en/artifacts), [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- Related: DESIGN-007, DESIGN-008, SURF-016, SKILL-048

**Where it lives.** Three Anthropic copies, byte-identical on 2026-10-16 (71 lines): the `frontend-design` plugin in `anthropics/claude-plugins-official` (what `/plugin install frontend-design@claude-plugins-official` installs), the same plugin in `anthropics/claude-code`, and `anthropics/skills`. History: added 2025-11-12 (41 lines, the "AI slop" version banning Inter, Roboto and purple gradients), rewritten 2026-06-09 to 06-18 (55 lines, "design lead at a small studio"), and rewritten again 2026-09-01 to 09-03. Third-party mirrors often show an older version; quote GitHub.

**What it says now.** Act as the design lead of a studio whose client "has already rejected proposals that felt cliché or templated". Ground the design in the subject; pick typefaces deliberately and use The Elements of Typographic Style for the scale; keep lines under 80 characters; avoid the five default looks (DESIGN-007); plan tokens, review the plan, then build; watch CSS specificity; build to "a quality floor": "responsive down to mobile, visible keyboard focus, reduced motion respected, visually accessible, harmonious color palettes"; critique your work "taking screenshots to review if your environment supports it"; write plain, active-voice copy.

**`artifact-design`** is the design skill bundled with the Artifact tool, applied "when it builds an artifact". It looks for your design system first and defers to it and to your prompt (SURF-016). Since v2.1.281 it also "asks Claude for plain, direct prose". Use frontend-design for UI in a codebase, and `artifact-design` comes with published pages anyway. Both can be present in a desktop session.

## [DESIGN-010] House style: where design tokens live and what wins
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Artifacts: improve the visual design, page constraints](https://code.claude.com/docs/en/artifacts), [Set up your design system](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design)
- Related: DESIGN-005, DESIGN-018, SURF-016, MEM, REPO-044

**Where.** Anthropic: record tokens "where Claude can find them, such as the project's CLAUDE.md or a theme file in your repository". Any clear list works: "The heading and format above are an example; any clear list of colors, fonts, and spacing works." For a repo with agents, a repo skill that reviewers preload works too (REPO-044). A `DESIGN.md` is a community convention, not an Anthropic one (DESIGN-018).

**Precedence:** "Claude treats your design system as higher precedence than its own choices, and your prompt as higher precedence than both." In Claude Design, an organization default design system applies to every new design and deck (DESIGN-005).

**What a token block needs:** colours by role (surface, text, accent, borders, states), typefaces and their roles, a type scale, a spacing scale, radii by surface type, shadow and motion rules, and real examples. Roles beat raw hexes: Claude can apply "accent for links and primary actions", not "#10b981 somewhere".

**Fonts in artifacts:** Google Fonts is "the one external font source an artifact page can load from"; Claude inlines any other typeface as a `@font-face` data URI with a fallback stack. External images are blocked by the CSP. A private brand font in an artifact therefore costs data-URI tokens on every publish.

**Note:** the docs' sample block uses "Inter for body", which Anthropic's own design guidance lists as a generic default (INDEX.md Conflicts). It is a format example; choose your own type.

## [DESIGN-011] Verify a design by measuring, not only by looking
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Best practices: give Claude a way to verify its work](https://code.claude.com/docs/en/best-practices), [Desktop: auto-verify changes](https://code.claude.com/docs/en/desktop), [Vision: limitations](https://platform.claude.com/docs/en/build-with-claude/vision), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [WCAG 2.2: contrast (minimum), non-text contrast](https://www.w3.org/TR/WCAG22/)
- Related: FLOW-004, FLOW-014, SURF-006, REPO-021, TOK-043, DESIGN-012, DESIGN-019

The loop is FLOW-004's: "implement this design. take a screenshot of the result and compare it to the original. list differences and fix them". Have Claude "show evidence rather than asserting success… or a screenshot of the result". The desktop Browser pane does this "after every edit" unless `"autoVerify": false` is set (SURF-006).

**Split the check by question:**
- **Screenshots** for overall look, hierarchy, balance and anything a token can't express.
- **Measurement** for anything with a number: spacing, sizes, radii, font family and weight, colours, line length, contrast. In Playwright MCP, `browser_evaluate` with `getComputedStyle` and `getBoundingClientRect` returns the values the browser applied, and a contrast check compares them against WCAG AA (4.5:1 for body text, 3:1 for large text and UI parts).

Anthropic's vision page says "Claude's coordinate and localization outputs are approximate… verify outputs before relying on them" (DESIGN-012), so a screenshot can't settle "is this 16px or 20px?" or "is this #475569?".

**Cost:** each screenshot stays in context and is re-read on later turns (TOK-043). Run checks in a subagent that returns numbers and file paths (REPO-021). Measure at the breakpoints the design names, and with `prefers-reduced-motion` and keyboard focus where the quality floor requires them.

## [DESIGN-012] What Claude's vision gets wrong in design work
- Type: fact
- Applies to: Claude API, Claude Code, claude.ai
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Vision](https://platform.claude.com/docs/en/build-with-claude/vision), [Prompting Claude Opus 5.5: tools for complex visual inputs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5), [Introducing Claude Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7)
- Related: DESIGN-011, DESIGN-017, TOK-043

- **Positions are approximate:** "Claude's coordinate and localization outputs are approximate."
- **Small or poor images:** "Claude might hallucinate or make mistakes when interpreting low-quality, rotated, or very small images under 200 pixels."
- **No image generation:** "Claude is an image understanding model only… it cannot generate, produce, edit, manipulate, or create images." Design output is HTML, CSS, SVG or canvas drawing; photos come from you or a connector.
- **Resolution:** Claude 4.7 and later read up to 2576 px on the long edge (4,784 tokens); other models 1568 px. Bigger images are downscaled, which "might, for example, make text less legible". Crop to the region you're judging rather than sending a full-page screenshot.
- **Request limits:** 8000×8000 px per image; 20 images per message on claude.ai; on the API, above 20 images per request each image must stay under a stricter limit ("resize each image so that neither dimension exceeds 2000 px").
- **Opus 5.5** reads "charts, diagrams, and screenshots considerably more precisely than Claude Opus 5 without tools". For the densest inputs, cropping and zooming tools (PIL, OpenCV, or the cookbook's crop tool) "still add accuracy", used "more effectively at higher effort levels".

Image cost and context effects are in TOK-043.

## [DESIGN-013] Improving an existing design: inputs, audit, polish or redesign
- Type: pattern
- Applies to: Claude Code, claude.ai
- Confidence: community-consensus
- Last verified: 2026-10-16
- Sources: [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design), [Artifacts: compare alternatives](https://code.claude.com/docs/en/artifacts), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- Related: DESIGN-011, DESIGN-014, DESIGN-019, FLOW-004

**Inputs, best first.** This ranking is our synthesis of the official pages:
1. The code and the running app: Claude reads the tokens and measures the rendered page (DESIGN-011).
2. A Figma file through the MCP server: structured variables and components (DESIGN-015).
3. A live URL: rendered, but no source tokens.
4. A screenshot: approximate positions and colours only (DESIGN-012).

**Audit checklist:** visual hierarchy; spacing rhythm and alignment; type scale, pairing and line length; colour contrast to WCAG AA; visible keyboard focus; reduced motion respected; behaviour at each named breakpoint; consistent use of the tokens; copy that says what things do. The frontend-design skill's "quality floor" covers the middle of this list, and Claude Design can review "for accessibility, contrast ratios, information hierarchy, and general usability".

**Polish or redesign.** With an established brand, polish inside locked tokens: name what must not change (logo, palette, type, voice) and change one area at a time. Redesign only when the brief asks for it, and keep the old version reachable: a git branch, or "Save what we have and try a completely different approach" in Claude Design.

**Compare, don't guess.** Put variants side by side: an artifact "with four distinctly different layouts… as a grid with a one-line tradeoff under each", or 2–3 variations in Claude Design.

## [DESIGN-014] Extracting a design system from code, Figma or a URL
- Type: pattern
- Applies to: Claude Code, claude.ai
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Set up your design system](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design), [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design), [Introducing Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs)
- Related: DESIGN-005, DESIGN-006, DESIGN-015, DESIGN-018

| Source | Route | Notes |
|---|---|---|
| React component library | `/design-sync` in Claude Code | Reads tokens and components; "works best for product design systems in code" (DESIGN-006) |
| Other code (Angular, Vue, plain CSS, Tailwind theme) | A chat: upload or link the repo, theme files and screenshots of real pages | The help center lists "a GitHub repo, design files, raw uploads" as import sources |
| Figma | A chat with Figma files attached, or Figma's MCP server for variables and components (DESIGN-015) | |
| Brand guidelines, decks, logos, fonts | A chat | "works best for brand design systems with fonts, colors, and guidelines" |
| A live website | Claude Design's "web capture tool" (launch post), or screenshots | Community skills that turn a URL into a `DESIGN.md` exist (DESIGN-018) |

Whatever the source, the output is "only as good as its source": a messy codebase shows up in every design. Clean the source first (one token per role, dead components removed), then validate with test pages. "Include real examples, not just specs." If the first extraction misses the brand, add different assets and iterate.

For a repo whose design system lives in a skill or CLAUDE.md (DESIGN-010), the repo copy stays the source of truth. A Design System artifact made from it is a second copy and has to be refreshed when the tokens change.

## [DESIGN-015] Figma's MCP server: read, write to canvas, seats and pricing
- Type: tool
- Applies to: Claude Code, claude.ai
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Figma: set up the remote server](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/), [Figma: desktop server](https://developers.figma.com/docs/figma-mcp-server/local-server-installation/), [Figma: tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/), [Figma: write to canvas](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/), [Figma: code to canvas](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/), [Figma: rate limits](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/), [Figma help: Claude Code and Figma](https://help.figma.com/hc/en-us/articles/32132100833559), [figma/mcp-server-guide](https://github.com/figma/mcp-server-guide)
- Related: DESIGN-001, DESIGN-014, MCP

**Two servers.** The remote server at `https://mcp.figma.com/mcp` is recommended and the only one that writes. In Claude Code, `claude plugin install figma@claude-plugins-official` adds it with Figma's skills; `claude mcp add --transport http figma https://mcp.figma.com/mcp` adds the server only ("This doesn't install Figma's skills"), project scope unless `--scope user`. Sign-in is browser OAuth. The desktop server (`http://127.0.0.1:3845/mcp`) needs the desktop app and "a Dev or Full seat", and "doesn't support writing to the canvas or sending UI to Figma". Only it works from your current selection; the remote one needs a frame link. With both configured, "your client may use the desktop server and never load the remote-only tools".

**Read:** `get_design_context` returns code for a frame: "By default, the output is React and Tailwind, but you can ask for a different framework in your prompt". Also screenshots, variables, Code Connect maps and design-system search.

**Write to canvas:** `use_figma` runs Plugin API code in the file to create frames, components and variables. Plans: "Professional, Education, Organization, and Enterprise"; it "requires… a Full seat to write outside your drafts". "Writing to the canvas is currently in beta and free to use during the beta period. It will eventually become a usage-based paid feature." No price or end date published. "Output is beta quality and may need manual review and cleanup"; test on a duplicate.

**Code to canvas:** `generate_figma_design` captures a running UI as flat layers (Starter and up), which `use_figma` can rebuild with your components.

**Read rate limits:** View or Collab seats "Up to 20 per month"; Full or Dev seats "Up to 200 per day, 10 per minute" on Professional.

## [DESIGN-016] Canva's connector and when it beats Claude Design
- Type: tool
- Applies to: claude.ai, Claude Code
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Canva MCP server](https://www.canva.dev/docs/apps/mcp/), [Canva MCP tools](https://www.canva.dev/docs/apps/mcp/tools/), [Canva newsroom: on-brand designs inside Claude](https://www.canva.com/newsroom/news/claude-ai-connector/) (read through a 2026 Wayback copy; the live page returned 403), [Canva newsroom: Canva in Claude Design](https://www.canva.com/newsroom/news/canva-claude-design/), [Claude connector directory: Canva](https://claude.com/connectors/canva), [canva-sdks/canva-skills](https://github.com/canva-sdks/canva-skills), [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design)
- Related: DESIGN-001, DESIGN-004, MCP

**What it is.** Canva's MCP server at `https://mcp.canva.com/mcp`, available as a claude.ai connector (in the directory since November 2025) and as Canva's Claude Code plugin (`canva-sdks/canva-skills`, also listed in `claude-plugins-official`) with skills such as `resize-for-social-media`, `bulk-create`, `edit-design` and `brand-check`. It covers "design creation and editing, asset and brand management, library search, export, and commenting"; exports are "PDF, PNG, JPG, PPTX, MP4".

**Brand Kit.** Canva's newsroom: "our community can apply their Brand Kit when generating designs with Claude", and "Claude is the first AI assistant to support these new capabilities". Two later Canva posts date it to January 2026 ("In January, we expanded this with on-brand design generation"); the exact day isn't published.

**Plan limits (Canva's tools page):** `generate-design` and `export-design` on all Canva plans; `autofill-design`, brand templates, `list-brand-kits` and `resize-design` "Pro and above" (the skills README says autofill needs Enterprise). Default cap "300 requests per minute per user". Which Claude plans get the connector isn't stated by Anthropic or Canva.

**Canva or Claude Design** (our synthesis; no official comparison exists): Claude Design for exploring and prototyping in HTML with your design system; Canva when non-designers will keep editing the asset, when Canva's brand templates and autofill matter, or for social formats and bulk variants. They chain: Claude Design exports to Canva, where designs "instantly become fully editable".

## [DESIGN-017] Models and effort for design work
- Type: recommendation
- Applies to: general
- Confidence: unverified
- Last verified: 2026-10-16
- Sources: [Custom visuals in chat: tips](https://support.claude.com/en/articles/13979539-custom-visuals-in-chat), [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5), [Prompting Claude Sonnet 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5), [Introducing Claude Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7)
- Related: DESIGN-012, ORCH-030, ORCH-028, FLOW-009

**What Anthropic says:**
- Custom visuals: "Opus performs the best at visualization tasks, so if you're going for something complex, we'd recommend choosing a more intelligent model."
- Opus 4.7 (2026-04-16 launch) was "more tasteful and creative… producing higher-quality interfaces, slides, and docs", and powered Claude Design at launch.
- Opus 5.5 reads screenshots and diagrams far better than Opus 5, even at its lowest effort. Its default is `medium`, and it uses image tools "more effectively at higher effort levels" (DESIGN-012).
- Sonnet 5 defaults to `high`, "may settle into a consistent default visual style", and "follows explicit specs precisely".

**No published design benchmark** compares the models on design quality. Anthropic's statements above are launch and guidance claims, not measurements.

**Our inference:** use Opus 5.5 at `high` for open briefs, new directions, critiques and dense screenshots. Use Sonnet 5.5 for iterations inside an established design system or a precise spec, where following the spec matters more than taste. A checklist-driven visual check runs on Sonnet 5.5 at `medium` (REPO-021). Not Haiku for design judgement. Test before relying on any of this.

## [DESIGN-018] Community design skills (unofficial)
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-16
- Sources: [pbakaus/impeccable](https://github.com/pbakaus/impeccable), [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), [google-labs-code/design.md](https://github.com/google-labs-code/design.md), [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md), [Manavarya09/design-extract](https://github.com/Manavarya09/design-extract), [OneRedOak/claude-code-workflows design review](https://github.com/OneRedOak/claude-code-workflows), [wmedia.es: verify with Playwright MCP](https://wmedia.es/en/tips/claude-code-playwright-mcp-verify-own-work), [wmedia.es: /design-sync](https://wmedia.es/en/tips/claude-code-design-sync-your-components)
- Related: DESIGN-009, DESIGN-010, DESIGN-011, DESIGN-014, SKILL

None of these is Anthropic's. Read on 2026-10-16, not installed; stars from the GitHub API that day.

| Project | What it is | Notes |
|---|---|---|
| Impeccable (81,936 stars, Apache-2.0) | "1 skill, 24 commands, live browser iteration, and 59 deterministic detector rules"; "Impeccable started from" Anthropic's frontend-design | Ships hooks on SessionStart, PostToolUse and Stop, downloads a binary, and calls `impeccable.style` on every roll, with anonymous telemetry |
| Taste Skill (97,949, MIT) | A family of skills (`design-taste-frontend` and variants) with lint and browser-measurement scripts | "a few hundred thousand tokens" a build; scripts fetch images from public archives and run headless Chrome |
| DESIGN.md (Google, 28,394, Apache-2.0) | A spec: YAML tokens plus eight fixed sections, with a linter (`npx @google/design.md lint`) | Format version "alpha". VoltAgent's collection (121,750) of DESIGN.md files for well-known sites uses nine sections |
| designlang (4,246, MIT) | Reads computed styles of up to 5,000 elements from a URL and emits tokens, Tailwind config and DESIGN.md | `--smart` sends data to an external model endpoint |
| Design-review agents | OneRedOak's `design-review-agent.md` (Sonnet, Playwright, a 7-phase checklist, also given Edit and Write) | A reviewer shouldn't need write tools |

**Worth adopting as ideas:** an explicit banned-pattern list, a contrast floor, and a measuring check (wmedia.es: "A screenshot to look at produces an opinion. A getComputedStyle produces a fact."). A DESIGN.md is a reasonable token file; Anthropic only asks for "a theme file" or CLAUDE.md (DESIGN-010).

**Caution:** hooks, binaries and network calls run with your permissions. Read them, as with any plugin (MCP, SKILL).

## [DESIGN-019] Design pitfalls
- Type: anti-pattern
- Applies to: Claude Code, claude.ai
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Best practices: verify your work](https://code.claude.com/docs/en/best-practices), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [Prompting Claude Sonnet 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5), [Get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design)
- Related: DESIGN-011, DESIGN-013, DESIGN-007, DESIGN-018

| Pitfall | Guard |
|---|---|
| "Fixed it" with nothing rendered | Ask for evidence: "a screenshot of the result", or measured values (DESIGN-011) |
| Judging pixels from a screenshot | Measure computed styles; localisation is "approximate" (DESIGN-012) |
| Drift to Claude's house style on an open brief | Sonnet 5 "may settle into a consistent default visual style": give a spec or ask for directions (DESIGN-008) |
| Swapping one default for another | "avoid a generic AI look" "mostly swaps one default for another": name the patterns |
| Redesigning when asked to polish | Lock tokens and name what must not change (DESIGN-013) |
| Animation everywhere | "fade-and-slide-up entrances on each section and hover transitions on every card are the generic default and read as AI-generated" |
| CSS specificity clashes | "It's easy to generate CSS classes that cancel each other out (especially with a type-based selector like .section and an element-based selector like .cta)", often padding between sections |
| A messy source design system | "Design system import is only as good as its source" (DESIGN-014) |
| Too many screenshots in the main context | Check in a subagent (REPO-021, TOK-043) |

## [DESIGN-020] Inline custom visuals in chat
- Type: fact
- Applies to: claude.ai
- Confidence: official-docs
- Last verified: 2026-10-16
- Sources: [Custom visuals in chat and Cowork](https://support.claude.com/en/articles/13979539-custom-visuals-in-chat), [Release notes, 2026-03-12](https://support.claude.com/en/articles/12138966-release-notes)
- Related: DESIGN-001, SURF-008

Since 2026-03-12, Claude draws "custom charts, diagrams and other visualizations in-line in its responses". They're built from HTML, "in beta and available to all Claude users on web and desktop, in both chat and Cowork", and not rendered on iOS or Android.

"Custom visuals are ephemeral by default": they aren't saved separately. To keep one: **Copy as image**, **Download** (.svg or .html) or **Save as artifact**. In chat, clicking inside a visual sends a follow-up prompt; Cowork lacks that and sharing. A style preference such as "make all my visualizations pink" is remembered.

Use them to think and explain, not as deliverables: for a design to share or iterate, ask for a Claude Design artifact (DESIGN-002). Claude Code's equivalent of a quick visual is an artifact page (SURF-008).

## Recommendations for our setup

Ranked by impact against effort.

1. **Done in this PR: route design questions here.** `claude-kb-lookup`'s description names "visual and UI design with Claude", with a `loads-19` case and a `skips-8` near miss for database design. The MCP server's `kb_search` description follows in a second PR once this one merges (FreekMencke/claude-kb#147).
2. **osrs-tracker-web: give the browser checker a contrast and token check** (DESIGN-011). Its `browser-checker` agent already has `browser_evaluate` and measures sizes when asked; it doesn't check text contrast against WCAG AA or compare computed colours with the theme tokens, and the light and dark themes with tinted pills are where a contrast slip would hide. Tracked in [osrs-tracker/osrs-tracker-web#337](https://github.com/osrs-tracker/osrs-tracker-web/issues/337).
3. **Don't run `/design-sync` on osrs-tracker-web** (DESIGN-006). It's Angular; the sync adapters read React only. Its design system stays in the repo skill and the design canvas artifact. If mock-ups move to Claude Design or `/design`, make a Design System artifact from a chat with `theme.css`, `base.css` and screenshots of real pages (DESIGN-014), and refresh it when the tokens change. No repo change.
4. **For a new page or redesign in any repo, prompt with DESIGN-008:** subject, audience and job; four directions first; a banned list from the last result; real copy. No change needed: the `frontend-design` plugin we have installed is the current upstream text (identical checksum, 2026-10-16).
5. **Don't install Impeccable or Taste Skill user-wide** (DESIGN-018). They add hooks, a downloaded binary, telemetry or image fetching, and overlap with frontend-design. Borrow their banned lists and measuring ideas instead.
6. **Figma and Canva connectors: not now.** None of our repos keeps designs in Figma or Canva (DESIGN-015, DESIGN-016).

## Open questions

- **Which model runs Claude Design since the 2026-09-16 merge?** The launch post names Opus 4.7; the help center, release notes and admin guides don't say. Probably the chat's model, unconfirmed (DESIGN-002).
- **`/design` minimum version:** v2.1.265 (artifacts page) or v2.1.234 (week-34 notes); already in INDEX.md Conflicts (DESIGN-006).
- **`/design-sync` on a non-React repo:** concluded from the bundle and docs, not run, because a run writes to claude.ai. A run against a scratch design-system project would confirm what it reports for an Angular library (DESIGN-006).
- **Figma:** the price and end of the write-to-canvas beta; what a seat below Full can write in its own drafts; whether `use_figma` counts against read rate limits; the View/Collab monthly cap (docs "Up to 20 per month", the guide's README 6). Anthropic's connector directory also says `get_screenshot` returns only "a descripton [sic] of screenshots" in Claude and Claude Code, which Figma's docs don't mention (DESIGN-015).
- **Canva:** the exact January 2026 date of Brand Kit generation, its Canva plan, the autofill plan (Pro or Enterprise), and which Claude plans can use the connector. Canva's help pages returned 403 (DESIGN-016).
- **The issue's "Claude 4 best-practices page suggests Inter for headings" conflict doesn't hold on 2026-10-16:** the general prompting page names Inter three times, all as fonts to avoid. Not added to Conflicts.
- **No published benchmark compares Claude models on design quality** (DESIGN-017). Searched Anthropic's prompting pages, launch posts and release notes.
