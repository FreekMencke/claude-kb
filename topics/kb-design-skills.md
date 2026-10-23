# Community design skills: mechanisms, security surface, a test

Prefix `DSKILL`. This file covers five community design skills for coding agents (Impeccable, Taste Skill, Hallmark, ui-ux-pro-max and huashu-design), compared by mechanism with Anthropic's frontend-design as the baseline: what steers their output, where they disagree, what installing them runs, sends and writes, their licences, their cost and upkeep, a text-only test, and what to borrow. It replaces DESIGN-012's one-table summary. It links rather than repeats: why Claude's pages look generic and the dated clichés (DESIGN-003), prompting for distinctive design (DESIGN-004), frontend-design itself (DESIGN-005), Anthropic's other design skills (DESIGN-014), critique and variants (DESIGN-025), our earlier prompting tests and isolation flags (DESIGN-027 to DESIGN-030), and the general security review of third-party skills (SKILL-041). DESIGN.md and brand collections (#253), finding and vetting skills in general (#256) and animation skills (#258) are out of scope.

Research basis:
- Researched 2026-10-23 (FreekMencke/claude-kb#252) in a desktop WSL session, Claude Code v2.1.296, Opus 5.5 lead.
- The lead downloaded each repo as a tarball at a pinned commit and read it locally; nothing from them was installed or run. The commits are pbakaus/impeccable `5cb95ee` (2026-10-23, skill v4.7.0), Leonxlnx/taste-skill `6010f91` (2026-10-20, v2.1.4), Nutlope/hallmark `7ec8682` (2026-10-22, SKILL.md v2.0.0), nextlevelbuilder/ui-ux-pro-max-skill `28327f2` (2026-10-23, last release v2.15.0) and alchaincyf/huashu-design `798c423` (2026-10-17, v3.0.0). frontend-design came from anthropics/claude-code `65823ec`; it is byte-identical in all three Anthropic repos (sha256) and was last changed 2026-09-02.
- Three Sonnet 5.5 readers covered security and licences; ui-ux-pro-max, huashu-design, cost and upkeep; and Impeccable's detector and Hallmark's `sloplint`. The lead re-read every quote used here against the downloaded files, and the Impeccable roll, the hook manifests and the photo licences in the source.
- The lead ran a text-only test (DSKILL-013): 24 `claude -p` runs on Sonnet 5.5, measured with Playwright 1.64.1, judged from contact sheets.
- Stars and install counts are popularity signals that can be gamed; nothing here rests on them.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which community design skills exist, and how do they differ? | Impeccable (a remote roll of directions, a 62-rule detector, hooks), Taste Skill (a script deals 3 of 20 directions, strict house bans), Hallmark (deals from 48 themes against a project log, Floor gates), ui-ux-pro-max (a fixed lookup by product type) and huashu-design (three drafted directions, a seconds roulette and a look ledger). frontend-design is text only: a calibration list and a plan-review-build process. | DSKILL-001 |
| What actually stops a skill converging on one look? | Something outside the model's choice: a script's random deal, a log of past builds checked by the next deal, or a person picking. Text alone doesn't: run without their scripts, Hallmark and ui-ux-pro-max gave one look per brief in 4 of 4 runs. | DSKILL-001, DSKILL-008, DSKILL-013 |
| Does a fixed catalogue of themes become its own default? | Yes. Hallmark ranks its 48 themes by keyword and genre fit and uses its seeded random to break ties; picking by hand (its no-Node fallback), the model took Cobalt for the webhook brief 4 times of 4. Its own roadmap says parts of its catalogue "now read as generated looks". ui-ux-pro-max maps "Bakery/Cafe" to "Warm Brown + Cream" every time. | DSKILL-008, DSKILL-005 |
| Is ui-ux-pro-max a good way to pick a style? | No for originality: it routes back to category defaults (SaaS: glassmorphism and "Trust blue"; bakery: cream and brown), and in our test gave the cream, serif, italic-accent look frontend-design names as a tell in 4 of 4 runs. Its UX guideline rows are worth borrowing. | DSKILL-005, DSKILL-013, DSKILL-014 |
| Where do the skills disagree? | Hallmark requires tinted near-black (chroma 0.005 or more); frontend-design lists "tinted near-black (#0B0B0B, #111)" as a tell. Hallmark's Floor is never waivable; frontend-design and Impeccable let the brief win. Taste bans all thin rules; Hallmark themes use rules. Hallmark bans em dashes outright; Impeccable flags 8 or more. | DSKILL-007 |
| What does installing Impeccable run and send? | Hooks on SessionStart, PostToolUse (`Edit|Write`) and Stop; a pinned Rust engine (0.1.16) from GitHub, checked only against a `.sha256` from the same release (the skill zip, unlike the engine, is Ed25519-signed); a roll request to impeccable.style whose length-checked, unsigned text the agent is told to follow; a daily version check whose text reaches context; telemetry on unless opted out. | DSKILL-010, DSKILL-015 |
| Which skills write hooks into settings? | Impeccable: its plugin's `hooks.json`, or `npx impeccable install` into `.claude/settings.local.json` (project) or `~/.claude/settings.json` (user), default yes and without asking when not on a TTY. Hallmark: `install-hook.mjs` on request, into the project's `.claude/settings.json` or `~/.claude/settings.json`. The other three write none, but all five tell the agent to run their scripts, and Taste's `install.sh` symlinks so a `git pull` changes live text. | DSKILL-010 |
| What licences apply when borrowing? | Impeccable and frontend-design are Apache-2.0 (keep the licence, notices and a change note); Taste, Hallmark, ui-ux-pro-max and huashu-design are MIT. Hallmark's photos are mostly CC BY-SA (546 of 755), which needs credit and ShareAlike. | DSKILL-011 |
| How many tokens does a build cost? | Taste says "a few hundred thousand tokens" a build. In our text-only test, a Hallmark build read about 388k input tokens ($0.52–0.67 on Sonnet 5.5), ui-ux-pro-max 61k, frontend-design 34k. | DSKILL-012 |
| Do the skills' own tests show they beat no skill? | Not clearly. Taste's own blind test (model jurors, the skill revised after each round) scored it below no skill in rounds 1, 2 and 4, level in round 3, and 0.1 below in the last, within its stated noise; its strong result is 0 inspector FAILs against 8 to 13 for the baselines. No other skill publishes a comparison. | DSKILL-002, DSKILL-012 |
| What are Impeccable's `detect` and Hallmark's `sloplint`? | Deterministic linters: Impeccable has 62 rules (31 slop, 31 quality) in a Rust engine, static or rendered; Hallmark's checks 90 gate rows plus 26 Finish checks, statically or in headless Chrome. Both mix numeric thresholds with pattern bans. | DSKILL-009 |
| What should we borrow? | A per-project log that the next design run reads, "add options, not bans", a mirror test, a checker that keeps WCAG requirements (contrast, 24 px targets, visible focus, reflow, text spacing) apart from conventions (16 px body, 1.5 leading, 45–75ch), and Impeccable's and Hallmark's state lists. Don't install any of the five. | DSKILL-014 |

## Index

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

## [DSKILL-001] Five community design skills and frontend-design, by mechanism
- Type: comparison
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [Impeccable SKILL.md @5cb95ee](https://github.com/pbakaus/impeccable/blob/5cb95ee/plugin/skills/impeccable/SKILL.md), [Taste Skill SKILL.md @6010f91](https://github.com/Leonxlnx/taste-skill/blob/6010f91/skills/taste-skill/SKILL.md), [Hallmark SKILL.md @7ec8682](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/SKILL.md), [ui-ux-pro-max SKILL.md @28327f2](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/28327f2/.claude/skills/ui-ux-pro-max/SKILL.md), [huashu-design SKILL.md @798c423](https://github.com/alchaincyf/huashu-design/blob/798c423/SKILL.md), [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)
- Related: DESIGN-003, DESIGN-005, DESIGN-006, DESIGN-012, DSKILL-008, DSKILL-013

None is Anthropic's. Each fights convergence with a different mechanism; most need their scripts to do it.

| Skill | What steers the output | Needs to run |
|---|---|---|
| frontend-design (Apache-2.0) | Text: a dated list of five default looks, plan, review against the brief, build, critique | Nothing |
| Impeccable (Apache-2.0) | The agent lists seven directions; `impeccable concept-seed` assigns one and deals catalogue challengers from impeccable.style ("the roll"); modes; a craft floor; a 62-rule detector | Its binary, network |
| Taste Skill (MIT) | `draw.mjs` deals "three of twenty researched directions" and a type system, palette and sections; house bans; a browser inspector | Node 22+, Chrome |
| Hallmark (MIT) | `theme.mjs deal` picks 3 of 48 themes clear of `.hallmark/log.json`; `draw` deals structure; Floor, Reflex and Finish gates; `sloplint` | Node; Chrome for render checks |
| ui-ux-pro-max (MIT) | `search.py --design-system` looks up the product type and returns a fixed style, palette and fonts | Python 3 |
| huashu-design (MIT) | Six candidates from three logics, one a random style by the clock's seconds; three drafted directions; a ledger of past looks | Python, Playwright |

DESIGN-012 also listed designlang (a computed-style extractor whose `--smart` mode sends data to an external model), OneRedOak's design-review agent (given Edit and Write, which a reviewer shouldn't need) and Google's DESIGN.md spec, now covered by DESIGN-036 to DESIGN-040 (FreekMencke/claude-kb#253); DESIGN-006 holds where tokens live.

## [DSKILL-002] Taste Skill: a scripted deal of 3 of 20 directions, a user-level history, house bans
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [SKILL.md @6010f91](https://github.com/Leonxlnx/taste-skill/blob/6010f91/skills/taste-skill/SKILL.md), [scripts/draw.mjs](https://github.com/Leonxlnx/taste-skill/blob/6010f91/skills/taste-skill/scripts/draw.mjs), [references/research.md](https://github.com/Leonxlnx/taste-skill/blob/6010f91/skills/taste-skill/references/research.md), [CHANGELOG.md](https://github.com/Leonxlnx/taste-skill/blob/6010f91/CHANGELOG.md)
- Related: DSKILL-001, DSKILL-007, DSKILL-012, DESIGN-027

**Mechanism.** "A script deals the directions, you choose among them. Asked to invent a look, a model picks the category default every time. `scripts/draw.mjs` deals three of twenty researched directions" (`library/directions.json` holds 20). The draw is "random within what fits the brief, and it remembers recent draws": a seedable PRNG and a history of the last 24 draws in `~/.taste-skill/history.json` (outside the project; `TASTE_SKILL_HISTORY` moves it). The agent must "Adopt it… Never redraw to get something more comfortable."

**House rules,** each with a replacement: no eyebrows, no monospace outside code, no 01/02/03, "No thin rules", no gradients, no shadows at rest, "No assistant palette. No yellow-cream ground with terracotta or rust; no violet or indigo", no tracked caps, no icon cards, no glass, no accent word, two typefaces at most. It warns that removing ornament alone "reads as thin": fill the space with scale, content or pictures.

**Its evidence** is a study of 247 gallery sites scored by "21 model reviewers" ("not human jurors"), and a blind test against no skill (DSKILL-012). Since v2.1.3 (2026-10-19) the repo is one skill; the older variants moved to Leonxlnx/taste-skill-classics.

## [DSKILL-003] Hallmark: dealt themes, a project log, and Floor, Reflex and Finish gates
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [SKILL.md @7ec8682](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/SKILL.md), [scripts/theme.mjs](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/scripts/theme.mjs), [references/gates.md](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/references/gates.md), [references/themes/index.json](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/references/themes/index.json), [ROADMAP.md](https://github.com/Nutlope/hallmark/blob/7ec8682/ROADMAP.md)
- Related: DSKILL-008, DSKILL-009, DSKILL-007, DSKILL-013

**Mechanism.** "A hard floor against the defaults every model was trained into, a dealt direction so consecutive builds do not converge, one idea per screen." `theme.mjs deal` "deals three themes that fit the prompt and clear the log"; the agent picks one by its picture. The catalogue has 48 themes (20 editorial, 11 modern-minimal, 9 playful, 8 atmospheric). A theme is blocked if it was one of the last 3 logged builds; `.hallmark/log.json` keeps 20. `theme.mjs draw` then deals the page shape, hero, nav and footer, with a "Mirror test: would a neighbouring prompt in the same category get this exact combination? If yes, change one decision". Without Node: "pick from `references/themes/index.json` by hand and stamp `deal: manual`" (DSKILL-008, DSKILL-013).

**Gates** (`gates.md`): Floor "Never waivable"; Reflex "A default a language model falls into", waivable on the record; Finish "Reported and answered, never blocking". "Nothing ships with an open `FAIL` or an open `REFLEX`." Floor house rules include "Never an eyebrow, and never a label in tracked capitals or small caps", "Never middle-dot-joined meta strings, arrows glued to link text", "About 80 words on any one screen" and "Never `transition: all`".

**Asks once** for material, audience, use and tone, and never invents "a number, a quote or a logo".

## [DSKILL-004] Impeccable: a remote roll of directions, modes and a craft floor
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [SKILL.md @5cb95ee](https://github.com/pbakaus/impeccable/blob/5cb95ee/plugin/skills/impeccable/SKILL.md), [reference/new-work.md](https://github.com/pbakaus/impeccable/blob/5cb95ee/plugin/skills/impeccable/reference/new-work.md), [reference/craft-floor.md](https://github.com/pbakaus/impeccable/blob/5cb95ee/plugin/skills/impeccable/reference/craft-floor.md), [README.md](https://github.com/pbakaus/impeccable/blob/5cb95ee/README.md)
- Related: DSKILL-009, DSKILL-010, DSKILL-007, DESIGN-025

"Impeccable started from" Anthropic's frontend-design (README). 24 commands (`shape`, `critique`, `audit`, `polish`…).

**Mechanism.** For a new visual world the agent lists seven directions from the audience's world, then must run `impeccable concept-seed`: "No substitute, no skip… the roll is what keeps every run from converging on the category default." The roll assigns a direction and deals catalogue challengers; "the dice pick which three reach the user". A "standing exit" always offers "the category standard, played straight", never recommended by the agent. In the shipped plugin the catalogue comes from impeccable.style (DSKILL-010).

**Modes** set ambition: Persuade, Operate, Read, Experience, "from the requested surface, not the product".

**Calibration** names Claude's rendition prior: "warm, bookish, family, and child-facing subjects come out as cream grounds, serif display with italic accents, and lamplight… Treat that first palette as already spent." It lists fonts that mean "you stopped looking": "Fraunces, Playfair Display, Cormorant, Lora, Crimson, Newsreader, Syne, Space Grotesk, Space Mono, IBM Plex, Inter-as-display, DM Sans, DM Serif, Outfit, Plus Jakarta Sans, Instrument Sans".

**Craft floor:** contrast ≥4.5:1 and 3:1, "body measure 65–75ch, display max 6rem, tracking floor -0.04em", states (hover, disabled, loading, error, empty), theme the browser's own surfaces (selection, caret, scrollbars, focus rings). Most "Refuse" items are "defaults, not bans: the brief's own words can earn any of them"; the eyebrow "is a ban, not a default". Its `critique` scores Nielsen's ten heuristics 0–4 (DESIGN-025): one model's estimate, not evidence from users.

## [DSKILL-005] ui-ux-pro-max: a fixed lookup from product type to style and palette
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [SKILL.md @28327f2](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/28327f2/.claude/skills/ui-ux-pro-max/SKILL.md), [data/products.csv](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/28327f2/.claude/skills/ui-ux-pro-max/data/products.csv), [data/ux-guidelines.csv](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/28327f2/.claude/skills/ui-ux-pro-max/data/ux-guidelines.csv), [scripts/design_system.py](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/28327f2/.claude/skills/ui-ux-pro-max/scripts/design_system.py)
- Related: DESIGN-003, DSKILL-008, DSKILL-013, DSKILL-014

"Searchable local UI/UX guidance: 79 searchable styles (50 active), 192 product palettes and exact reasoning profiles, 74 font pairings, 119 UX guidelines…" Step 2, "Generate Design System (REQUIRED for new pages/projects)", runs `search.py --design-system`.

**It routes back to category defaults.** `design_system.py` takes the top BM25 match in `products.csv` as the product type, and that name selects one reasoning row and one palette: no randomness, rotation or history of past picks (`--persist` writes a `MASTER.md` for the project, but nothing reads it back as a log). Rows: "SaaS (General)" → "Glassmorphism + Flat Design", "Hero + Features + CTA", "Trust blue + accent contrast"; "Bakery/Cafe" → "Warm Brown + Cream + Appetizing accents". An unmatched type falls back to "Minimalism" and "Flat Design". The 192 palettes use 50 distinct primary colours. Optional `--variance`, `--motion` and `--density` dials only re-weight the same lookup. This is the "high-probability center" of DESIGN-003, written down as a table; the test confirmed it (DSKILL-013).

**The UX guidelines are the useful part:** 119 rows in 20 categories (Accessibility 20, Forms 11, Animation 10…), mostly WCAG-aware. Row 104: "WCAG 2.2 AA requires 24 CSS px pointer targets"; Don't "Assume native 44pt or 48dp guidance defines web conformance" (44 CSS px is WCAG's AAA 2.5.5). Row 102 labels Focus Appearance as AAA. SKILL.md's own table still says "Min size 44×44px".

The plugin installs seven skills, not one; the others call Gemini, Atlas Cloud and muapi with your keys (DSKILL-010).

## [DSKILL-006] huashu-design: three drafted directions, a seconds roulette and a look ledger
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [SKILL.md @798c423](https://github.com/alchaincyf/huashu-design/blob/798c423/SKILL.md), [references/directions.md](https://github.com/alchaincyf/huashu-design/blob/798c423/references/directions.md), [references/evolution.md](https://github.com/alchaincyf/huashu-design/blob/798c423/references/evolution.md), [references/design-styles.md](https://github.com/alchaincyf/huashu-design/blob/798c423/references/design-styles.md)
- Related: DSKILL-001, DSKILL-008, DESIGN-029, DESIGN-030

HTML prototypes, slides, animation and review; SKILL.md is in Chinese (translations ours). Production web apps are out of scope.

**Mechanism.** Every new design first gets three real draft directions for the user to pick, "指定风格/品牌也不豁免" (even when a style or brand is given). Six candidates come from three logics, two each: "the best designer" for the subject, a "real reference" screenshotted with `ref_board.py`, and a "秒数轮盘" (seconds roulette) drawn from an 84-style library by `date +%S`. It picks the three strongest, most different ones that don't collide with the ledger, then "摆出来就停… 包括无人值守会话" (stop once they're shown… including unattended sessions).

**Ledger.** `~/.huashu-design/ledger.jsonl` records each delivery's ground, palette, heading font and layout fingerprint; `ledger` shows the last 8. Its reason: "every new session re-converges from the same prior".

**Its stance on bans:** "加选项，不加禁令" (add options, not bans): a look family such as warm-paper serif "本身不是问题，三版挤在同一家族才是" (isn't the problem itself; three drafts crowding into one family is). It still names Claude's default (warm cream, high-contrast serif, terracotta, all-caps labels, 01/02/03) and deletes template chrome. It has a burned-out display-font list (Fraunces, Inter, Space Grotesk, Playfair Display) with substitutes.

## [DSKILL-007] Where the design skills disagree with each other and with frontend-design
- Type: comparison
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [frontend-design SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [Hallmark gates.md](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/references/gates.md), [Hallmark craft.md](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/references/craft.md), [Taste SKILL.md](https://github.com/Leonxlnx/taste-skill/blob/6010f91/skills/taste-skill/SKILL.md), [Impeccable craft-floor.md](https://github.com/pbakaus/impeccable/blob/5cb95ee/plugin/skills/impeccable/reference/craft-floor.md), [Impeccable detector registry](https://github.com/pbakaus/impeccable/blob/5cb95ee/crates/foundation/src/registry.rs)
- Related: DESIGN-003, DSKILL-002, DSKILL-003, DSKILL-004, DSKILL-009, DSKILL-013

| Point | Positions |
|---|---|
| Black | frontend-design lists "tinted near-black (#0B0B0B, #111) standing in for black" as template chrome, and a near-black ground with one acid accent as a default look. Hallmark bans `#000` outside tokens (7a) and zero-chroma neutrals (22), and prescribes tinted dark paper "L 12 to 18, 0.008 to 0.015". Opposite pulls: Hallmark flags frontend-design's example hexes too; its webhook pages used a tinted near-black in 4 of 4 runs |
| Can the brief override? | frontend-design: "the brief's own words always win". Impeccable: most are "defaults, not bans". Hallmark Floor: "none of it waivable" |
| Hairlines | frontend-design: "hairline rules" are part of a default look; Taste: "No thin rules… no 1px outlined boxes", no exceptions; Hallmark's themes use rules (21–58 one-pixel borders a page in DSKILL-013), and its roadmap now calls "the hairline broadsheet" generated |
| Motion | Hallmark: "`transform` and `opacity` only"; Impeccable: "Reach past transform and opacity: blur, backdrop-filter, clip-path, mask" |
| Em dashes | Hallmark gate 19 (Floor) bans them in copy; Impeccable flags 8 or more, advisory |
| Eyebrows | Hallmark and Taste ban outright; Impeccable bans the eyebrow but lets uppercase nav and button labels pass; frontend-design calls it a default |
| Fonts | Impeccable's "stopped looking" list includes IBM Plex and Newsreader; Hallmark's Cobalt sets IBM Plex Sans; huashu-design swaps Fraunces for Newsreader |

One skill's substitute is another's ban: stacking two narrows the space without improving it.

## [DSKILL-008] A fixed catalogue becomes its own default
- Type: fact
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [Hallmark scripts/theme.mjs](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/scripts/theme.mjs), [Hallmark ROADMAP.md](https://github.com/Nutlope/hallmark/blob/7ec8682/ROADMAP.md), [ui-ux-pro-max products.csv](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/28327f2/.claude/skills/ui-ux-pro-max/data/products.csv), [huashu-design SKILL.md](https://github.com/alchaincyf/huashu-design/blob/798c423/SKILL.md), local test
- Related: DESIGN-003, DESIGN-027, DSKILL-003, DSKILL-005, DSKILL-013

A catalogue removes the model's default only if something outside the model picks from it, and keeps picking differently.

- **Fit first, then chance.** Hallmark's `deal` ranks themes by prompt keywords (rarer ones weigh more) plus 2 for the genre, and breaks ties with a random seeded by the prompt, a per-project salt and the date. A prompt that names its subject meets that subject's theme first (Vellum carries "bakery", Cobalt "webhooks"); with no keyword hit, the same-genre themes tie and chance picks. The log (last 3 themes blocked), `--reroll` and a new day change the deal.
- **By hand, the model takes the obvious match.** Using Hallmark's no-Node fallback, Sonnet 5.5 took Cobalt for the webhook brief 4 times of 4 and Garden 3 of 4 for the bakery; one run took Vellum "because it's the one the skill ties to 'bakery'" (DSKILL-013).
- **The catalogue ages.** Hallmark's roadmap: "Cream or off-white paper on its own, pill-shaped buttons, near-black with one acid accent and the hairline broadsheet now read as generated looks… the catalog needs a decision".
- **A lookup is a catalogue with no deal:** ui-ux-pro-max maps a product type to one style and palette (DSKILL-005).

What worked in our tests and in huashu-design's design is variety from outside the model: a random deal checked against a log, or a person picking one small choice at a time (DESIGN-030).

## [DSKILL-009] Impeccable's detector and Hallmark's `sloplint`: what AI-look linters check
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [Impeccable registry.rs @5cb95ee](https://github.com/pbakaus/impeccable/blob/5cb95ee/crates/foundation/src/registry.rs), [Impeccable CLI-CONTRACT.md](https://github.com/pbakaus/impeccable/blob/5cb95ee/docs/CLI-CONTRACT.md), [Hallmark sloplint.mjs @7ec8682](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/scripts/sloplint.mjs), [Hallmark sloplint-render.mjs](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/scripts/sloplint-render.mjs), [Hallmark gates.md](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/references/gates.md)
- Related: DESIGN-007, DESIGN-017, DSKILL-004, DSKILL-003, DSKILL-014

Read, not run. Both report findings; neither generates a fix.

**Impeccable** (README: "62 deterministic detector rules"; the registry has 62: 31 `slop`, 31 `quality`). A Rust engine: regex over source files, static HTML and CSS, Puppeteer for URLs; on regex-only files "findings are an undercount". Thresholds: `low-contrast` (4.5:1, 3:1), `tight-leading` ("below 1.3x"), `tiny-text` ("below 12px"), `line-length` ("~80 characters… 65ch to 75ch"). Pattern rules: `overused-font` (Inter, Roboto, Fraunces, Geist, Space Grotesk…), `kicker-above-heading` ("banned outright"), `gradient-text`, `cream-palette`. Only 12 run at edit time; the rest wait for the Stop hook.

**Hallmark `sloplint`** ("Zero dependencies, Node 18+"): 90 gate rows (39 Floor, 50 Reflex, 1 Ledger) plus Finish checks F1–F26; 45 static, the rest rendered in headless Chrome (320 to 1920 px) or judged. Its 12 px and 1.3 lines are fail lines; the fix it gives is "body 16px at 1.5 to 1.65". Contrast passes at "4.5:1 or APCA Lc 60", although APCA isn't a WCAG conformance measure (DESIGN-017). Exit 1 on any FAIL or REFLEX.

**Measurable or judgement:** contrast, size, leading and measure are measurable usability checks; "cream", "eyebrow", font lists, em dashes and the 80-word screen are house style that DESIGN-027 shows gets replaced by a new default. Only Hallmark's gates 8 and 32 compare a build with the last ones logged.

## [DSKILL-010] Security surface, part 1: install paths, hooks and binaries
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [Impeccable plugin/hooks/hooks.json @5cb95ee](https://github.com/pbakaus/impeccable/blob/5cb95ee/plugin/hooks/hooks.json), [Impeccable launcher](https://github.com/pbakaus/impeccable/blob/5cb95ee/plugin/skills/impeccable/scripts/impeccable), [Impeccable crates/skills commands.rs and hook_manifest.rs](https://github.com/pbakaus/impeccable/tree/5cb95ee/crates/skills/src), [Impeccable BUNDLE-SIGNING.md](https://github.com/pbakaus/impeccable/blob/5cb95ee/docs/BUNDLE-SIGNING.md), [Taste install.sh @6010f91](https://github.com/Leonxlnx/taste-skill/blob/6010f91/install.sh), [Hallmark install-hook.mjs @7ec8682](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/scripts/install-hook.mjs), [ui-ux-pro-max cli/src @28327f2](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/28327f2/cli/src), [huashu-design SKILL.md @798c423](https://github.com/alchaincyf/huashu-design/blob/798c423/SKILL.md)
- Related: SKILL-041, SKILL-036, HOOK, DSKILL-015, DSKILL-011, SKILL-069

Read from source at the pinned commits, 2026-10-23. Four of the five also install as a plugin marketplace (SKILL-036: third-party auto-update is off by default).

- **Impeccable.** Plugin hooks: SessionStart (timeout 5), PostToolUse `Edit|Write` (5), Stop (30). `npx impeccable install` (unpinned) writes them to `.claude/settings.local.json`, or `~/.claude/settings.json` for a user install; the prompt defaults to yes and is skipped without a TTY; `--no-hooks` opts out. The engine is pinned (`VERSION` 0.1.16) and downloaded from GitHub releases with a `.sha256` from the same release: corruption, not compromise. The skill zip is Ed25519-signed with a key in that binary. `IMPECCABLE_BIN` or an `impeccable` on `PATH` is run after a handshake only.
- **Taste.** No hooks. `install.sh` "links instead of copying, so `git pull` updates every installed skill in place" in `~/.claude/skills`; `npx skills add` is unpinned. The skill has the agent run `draw`, `assets`, `lint` and `inspect` (headless Chrome with a DevTools port).
- **Hallmark.** No hooks shipped; `install-hook.mjs` writes a PostToolUse `Write|Edit|MultiEdit` hook (timeout 10) into the project's `.claude/settings.json`, or `~/.claude/settings.json` with `--global`. `sloplint --render` loads a global `puppeteer-core`.
- **ui-ux-pro-max.** The plugin installs 7 skills. The `uipro` CLI downloads the `latest` release zip with no checksum, and `update` runs `npm install -g`.
- **huashu-design.** No hooks installed. `npx -y hyperframes init` (in a reference) installs 19 skills into `~/.claude/skills/`.

## [DSKILL-011] Licences of the skills' code and the assets they pull in
- Type: fact
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [Impeccable LICENSE and NOTICE.md @5cb95ee](https://github.com/pbakaus/impeccable/blob/5cb95ee/NOTICE.md), [anthropics/skills frontend-design LICENSE.txt](https://github.com/anthropics/skills/blob/main/skills/frontend-design/LICENSE.txt), [Hallmark photos.json @7ec8682](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/scripts/photos.json), [Hallmark README](https://github.com/Nutlope/hallmark/blob/7ec8682/README.md), [Taste library/photos.json](https://github.com/Leonxlnx/taste-skill/blob/6010f91/skills/taste-skill/library/photos.json), [Unsplash Terms (Wayback 2026-01-08)](http://web.archive.org/web/20260108062954/https://unsplash.com/terms), [Pexels licence](https://www.pexels.com/license/)
- Related: LIC, FONT, DSKILL-014

| Skill | Code | Assets |
|---|---|---|
| Impeccable | Apache-2.0, "Copyright 2025 Paul Bakaus"; `NOTICE.md` credits ehmo's MIT `platform-design-skills` for `ios.md` and `android.md` | `modern-screenshot.umd.js` in the skill, no licence header |
| frontend-design | Apache-2.0 | none |
| Taste | MIT, 2026 Leonxlnx | "Lorem Picsum… photographs from Unsplash, used under the Unsplash licence", hotlinked; found pictures CC0 to CC BY-SA, credited |
| Hallmark | MIT, 2026 "Hallmark contributors" | 755 Wikimedia Commons photos: 546 CC BY-SA, 113 CC BY, 73 CC0, 23 public domain |
| ui-ux-pro-max | MIT, 2024 Next Level Builder; `ui-styling/` has an Apache-2.0 `LICENSE.txt` but says MIT | Hard-coded Pexels URLs |
| huashu-design | MIT since 2026-05-14 (personal-use before) | BGM of unstated origin; ElevenLabs SFX |

**Fonts:** none of the five ships a typeface in its skill; pages load Google Fonts (OFL or Apache, DESIGN-035), a third-party request each visit.

**Hallmark's photos** need author, licence and link, as it says; BY-SA adds ShareAlike for adaptations, which it omits. Its claim that Unsplash, Pexels and Pixabay "bar AI tools from picking their images" is partly supported: Unsplash's Terms bar "bots, spiders, scripts, crawlers, scrapers" and "machine learning and/or artificial intelligence datasets"; the Pexels and Pixabay licence pages had no such clause, and their full terms weren't read.

## [DSKILL-012] Token cost per build and release cadence
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-23
- Sources: [Taste README and CHANGELOG](https://github.com/Leonxlnx/taste-skill/blob/6010f91/CHANGELOG.md), [Taste research.md §11](https://github.com/Leonxlnx/taste-skill/blob/6010f91/skills/taste-skill/references/research.md), [Hallmark ROADMAP.md](https://github.com/Nutlope/hallmark/blob/7ec8682/ROADMAP.md), GitHub releases API, local test
- Related: TOK, DSKILL-013, DSKILL-002

**Cost.** Only Taste states one: "A build takes roughly 30 to 45 minutes and a few hundred thousand tokens", most of it "finding or drawing pictures". Hallmark lists "Measure a build" as a roadmap item. Measured in DSKILL-013 (text only, no scripts, Sonnet 5.5, 8 runs per skill): Hallmark read 388k input tokens a build on average (mostly cache reads), $0.52–0.67, 167 s; ui-ux-pro-max 61k, $0.18–0.33; frontend-design 34k, $0.13–0.16. Hallmark's page build loads seven reference files (about 110 KB) on top of SKILL.md.

**Does it pay?** Taste's own blind test, model jurors, with "The skill… revised after each round": 6.6 vs 7.7, 7.1 vs 8.0, 7.5 vs 7.5, 6.9 vs 7.9, 7.7 vs 7.8 (skill vs no skill); the last round won 2 of 3 briefs and sits within "about half a point of noise". Its clear result: "the final builds measured 0 FAIL each; the baselines measured 8 to 13 FAIL each", on its own inspector.

**Upkeep** (GitHub API, 2026-10-23): Impeccable 34 `skill-v*` releases, skill-v4.7.0 on 2026-10-19; Taste v2.0.0 to v2.1.4 in 2026-10-13 to 10-20, restructured twice; Hallmark no releases or tags; ui-ux-pro-max v2.15.0 on 2026-08-13, none since; huashu-design v3.0.0 on 2026-10-17. A reviewed copy goes stale within days.

## [DSKILL-013] Test: Hallmark, ui-ux-pro-max and frontend-design as text only on two briefs
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-23
- Sources: local test, [contact sheet: bakery](../assets/dskill-test/sheet-bakery.png), [contact sheet: webhook](../assets/dskill-test/sheet-webhook.png), [Hallmark theme picture: Cobalt](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/references/themes/cobalt.jpg)
- Related: DESIGN-027, DESIGN-028, DSKILL-008, DSKILL-005, DSKILL-003

**Setup.** The two skills differing most (a dealt catalogue with bans and a log; a fixed lookup without bans) and frontend-design. Each run had the skill's text and data with every script removed, `Read,Write,Edit,Glob,Grep` only, DESIGN-028's flags, and a prompt to follow `skill/SKILL.md`, do script steps by hand and let the brief win. Briefs: DESIGN-027's bakery, and Tallyhook, a webhook monitor with three plans. Sonnet 5.5, 4 runs each, no log between runs.

| | frontend-design | Hallmark | ui-ux-pro-max |
|---|---|---|---|
| Bakery | sage or forest green, Young Serif 4/4 | Garden 3 (oat paper, Vollkorn), Vellum 1 (Grenze Gotisch) | cream, Fraunces 4/4, accented word 4/4, eyebrows 1, 5, 6, 6 |
| Webhook | cool grey, blue, two grotesques | Cobalt 4/4, identical tokens | warm paper, dark log panel, mono eyebrow 4/4 |

**Findings.** Palette and type clustered per arm; layouts varied more. ui-ux-pro-max gave DESIGN-003's first look. Hallmark held its bans (no eyebrows or tracked caps) but, without its deal, copied one theme's tokens; Cobalt's own picture has an ASCII event-flow field and a curl bar the runs reduced to a faint dot pattern. Finish, the lead's judgement: ui-ux-pro-max most complete, Hallmark sparsest. axe-core 4.11.1 (WCAG A/AA): contrast failures on 2 of 8 frontend-design pages, none on the others.

Tested 2026-10-23, v2.1.296, `-p` from desktop WSL, 06:34–06:45 UTC: 24 runs, $8.05. Playwright 1.64.1 at 1280 px; the lead judged first viewports only (ui-ux-pro-max's bakery pages reveal on scroll). This tests the skills' text, not their mechanisms.

## [DSKILL-014] What to borrow from the design skills, and the notice it needs
- Type: recommendation
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-23
- Sources: [Hallmark SKILL.md and interaction-and-states.md](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/references/interaction-and-states.md), [huashu-design SKILL.md](https://github.com/alchaincyf/huashu-design/blob/798c423/SKILL.md), [Impeccable animate.md and harden.md](https://github.com/pbakaus/impeccable/blob/5cb95ee/plugin/skills/impeccable/reference/animate.md), [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [NN/g: response time limits](https://www.nngroup.com/articles/response-times-3-important-limits/)
- Related: DESIGN-004, DESIGN-007, DESIGN-017, DESIGN-030, ACCESS-014, DSKILL-008, DSKILL-011, UIPAT-001, UIPAT-004, ANIM-013

**Don't install any of the five** (DSKILL-010, DSKILL-015). Borrow ideas in our own words:

1. **A per-project log of past looks** (Hallmark's `.hallmark/log.json`, huashu-design's ledger) that the next design run reads to avoid the last few.
2. **"Add options, not bans"** (huashu-design) and Hallmark's mirror test: "would a neighbouring prompt in the same category get this exact combination?"
3. **A checker that labels its rules.** WCAG 2.2 AA: contrast 4.5:1 and 3:1 (1.4.3, 1.4.11), targets 24 CSS px (2.5.8; 44 is AAA 2.5.5), focus visible (2.4.7), reflow at 320 px without clipped content (1.4.10), text spacing overrides (1.4.12). Convention, measurable: body 16 px at 1.5 (12 px and 1.3 are fail lines), measure 45–75ch, no `transition: all`.
4. **States and stress content** (judgement, with a list): Impeccable's hover, disabled, loading, error, empty; very long text, empty data, translations about 30% longer; Hallmark's empty state as "what is empty, why it matters, one action".
5. **Motion with a purpose and range:** Impeccable's 100–150 ms for feedback, 150–300 ms for state changes, 300–500 ms for layout and overlays; under reduced motion, drop movement but keep meaningful opacity and colour changes (ACCESS-014).

Copying wording needs the licence: MIT keeps its notice; Apache-2.0 (Impeccable, frontend-design) keeps the licence, `NOTICE` content and a change note (DSKILL-011).

## [DSKILL-015] Security surface, part 2: network, remote text in context and telemetry
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [Impeccable concept_seed.rs @5cb95ee](https://github.com/pbakaus/impeccable/blob/5cb95ee/crates/context/src/concept_seed.rs), [Impeccable context_cli.rs](https://github.com/pbakaus/impeccable/blob/5cb95ee/crates/context/src/context_cli.rs), [Impeccable CLAUDE.md](https://github.com/pbakaus/impeccable/blob/5cb95ee/CLAUDE.md), [Impeccable README: telemetry](https://github.com/pbakaus/impeccable/blob/5cb95ee/README.md), [Hallmark brand-truth.md and imagegen.mjs @7ec8682](https://github.com/Nutlope/hallmark/blob/7ec8682/skills/hallmark/references/brand-truth.md), [ui-ux-pro-max design/scripts/cip/generate.py @28327f2](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/28327f2/.claude/skills/design/scripts/cip/generate.py), [huashu-design SKILL.md @798c423](https://github.com/alchaincyf/huashu-design/blob/798c423/SKILL.md)
- Related: SKILL-041, MCP, DSKILL-010

- **Impeccable's roll.** `concept-seed` "has no local catalog": it tries `IMPECCABLE_CATALOG_DIR`, then "the roll API at impeccable.style, then a degraded promotion-only seed". The response's `form`, `spark`, `system` and `webLeverage` fields (length-checked, unsigned, unpinned) are printed into directives, and the skill says "follow what it prints. No substitute, no skip". Degraded, it nudges the agent toward a "network-enabled or escalated command tool".
- **Impeccable's update check.** `/api/version` at most every 24 h; the returned version string is compared by its leading digits, then put whole and unchecked into an `UPDATE_AVAILABLE` directive, which offers `npx impeccable update` but forbids running it that turn. Off with `IMPECCABLE_NO_UPDATE_CHECK` or `"updateCheck": false`.
- **Impeccable's telemetry:** on "Unless you opt out": roll key, scope, mode, re-roll round, the winning card and its position, client version. Off with `npx impeccable telemetry off`, `DO_NOT_TRACK=1`, `IMPECCABLE_NO_TELEMETRY=1` or `"telemetry": false`; "the roll still works and the API is told not to record it".
- **Taste:** six open image archives; results enter context. No telemetry.
- **Hallmark:** `api.together.xyz` whenever `TOGETHER_API_KEY` is set; brand homepages fetched as "untrusted data" with an address denylist, the best remote-text handling of the five.
- **ui-ux-pro-max:** sibling skills load every key in `~/.claude/.env` into the environment and call Gemini, Atlas Cloud and muapi.
- **huashu-design:** Wikimedia; Volcengine and ByteDance only after consent; an unlisted `git ls-remote` every 30 days.

## Recommendations for our setup

Ranked by impact against effort.

1. **Don't install Impeccable, Taste Skill, Hallmark, ui-ux-pro-max or huashu-design** (DSKILL-010, DSKILL-015, DSKILL-013). Borrow their ideas (DSKILL-014). This replaces DESIGN recommendation 7. To try one anyway: a pinned copy without its scripts, as in DSKILL-013, or for Impeccable `--no-hooks`, `DO_NOT_TRACK=1` and `IMPECCABLE_NO_UPDATE_CHECK=1`, from a marketplace with auto-update off.
2. **Decided 2026-10-23 (FreekMencke/claude-kb#260): borrow into our own skills.** The log of past looks and "add options, not bans" with the mirror test go to `design-workshop` (FreekMencke/claude-skills#108); the checker that labels WCAG rules apart from conventions, and the state lists, go to `ui-review` (FreekMencke/claude-skills#106). DSKILL-014, DSKILL-008.
3. **Keep the measuring scripts with the next design test.** DSKILL-013's Playwright measure, contact-sheet and axe scripts weren't committed, because #252 leaves `evals/` to #259; the DESIGN recommendation 8 note still applies.

## Open questions

- **The skills' mechanisms weren't tested:** their deals run only in their binary or scripts, which the issue ruled out. A test with our own random deal plus a log would show whether the mechanism, not the text, removes convergence (DSKILL-008).
- **What Impeccable's Stop hook prints into context** ("Design deep pass"), and what address its `live` mode's local server binds: the code wasn't read.
- **Whether a trusted clone of Impeccable runs its repo `.claude/settings.json` hooks** was read from files, not tested.
- **Pexels and Pixabay terms:** only their licence pages were read (via Wayback; the live pages returned bot walls). A search result says Pexels' Terms bar scraping for machine learning; unread, so Hallmark's "AI-driven selection" wording stays unverified for both.
- **Licences not traced:** Impeccable's bundled `modern-screenshot.umd.js`, huashu-design's BGM and ElevenLabs SFX, ui-ux-pro-max's Phosphor icon data.
- **Taste's token figure** has no sample or model; our numbers are for text-only runs without picture search or screenshots.
- **One judge, first viewports:** the lead judged the contact sheets; no person picked or rated pages, and below-the-fold content was only measured.
