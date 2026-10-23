# Interface guidelines and UI review

Prefix `UIREV`. This file covers reviewing a web interface with Claude: what Vercel's Web Interface Guidelines contain and which of their rules are universal, how the `web-design-guidelines` skill runs a review and how to pin it, which review rules a script can check on a running page and which need judgement, what NN/g says about heuristic evaluation, what studies found about LLM reviews and what one agent's review can claim, how community design-review agents and skills are built, and how to run a read-only review in Claude Code cheaply. It links rather than repeats: verifying a design by measuring (DESIGN-007), auditing an existing design (DESIGN-009), community design skills in general (DESIGN-012), contrast (DESIGN-017), critique and rubrics (DESIGN-025), what axe finds and misses (ACCESS-005, ACCESS-006, ACCESS-008), template linting (ACCESS-011), focus and dialogs (ACCESS-012, ACCESS-013), motion rules (ACCESS-014), an agent's accessibility check (ACCESS-015), the browser-checker subagent (REPO-021) and image token cost (TOK-043). UI states, forms and copy as patterns are out of scope here (roadmap FreekMencke/claude-kb#251, `kb-ui-patterns.md`).

Research basis:
- Researched 2026-10-23 (FreekMencke/claude-kb#254, part of roadmap FreekMencke/claude-kb#251) by an Opus 5.5 lead with two Sonnet 5.5 readers, in a desktop WSL session on Claude Code.
- The lead read as raw text, at pinned commits: vercel-labs/web-interface-guidelines at `434b7f9` (README, `command.md`, `AGENTS.md`, `install.sh`), vercel-labs/agent-skills at `ba46938` (`skills/web-design-guidelines/SKILL.md`), the W3C WCAG 2.2 Understanding pages for 1.4.3, 1.4.4, 1.4.10, 1.4.11, 2.4.7, 2.4.11, 2.5.5 and 2.5.8 and the APG button pattern (HTML stripped of tags), Playwright's API docs at `v1.64.1`, the Playwright MCP README (`@playwright/mcp` 0.0.83 on npm that day), axe-core's rule and check JSON at `v4.14.0`, and Claude Code's sub-agents page and the vision page (`.md`). Repo facts and licences from the GitHub API (`gh api repos/<owner>/<repo> --jq .license.spdx_id`), versions from the npm registry (`npm view <pkg> version`).
- One reader read NN/g's heuristic-evaluation and severity articles and papers on LLM heuristic evaluation; the other read the design-review agents and skills of OneRedOak, Impeccable, Emil Kowalski and wshobson at pinned commits. The lead re-checked every quote used here against their downloads.
- A skeptical subagent tried to refute the claims the recommendations rest on, and a review panel (UX/UI designer, accessibility specialist, front-end engineer; Sonnet 5.5, read-only) reviewed the draft; their findings and what was done with each are in the PR.
- Tested on Node 24.21.0 with `playwright@1.64.1` (Chromium 156.0.8078.4 and WebKit 27.2) and `@axe-core/playwright@4.14.0`, installed with `npm install --ignore-scripts` in a scratch folder, on a fixture page (UIREV-007). No community code was installed or run.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| What are Vercel's Web Interface Guidelines? | A "living, non-exhaustive list" of UI rules in three files: the README (131 bullets, with a "Vercel-specific" copywriting section), `command.md` (the review prompt, 104 bullets) and `AGENTS.md` (MUST/SHOULD/NEVER rules for generation). MIT. | UIREV-001 |
| Which of the guidelines are universal? | Most of Interactions, Animations, Forms, Content and Performance. Some are React or Next.js (`onChange`, `suppressHydrationWarning`, nuqs), some Tailwind class names, and the README marks the copywriting section "aren't universal guidelines", but `command.md` keeps those copy rules unmarked. | UIREV-002 |
| Where do the guidelines contradict WCAG or this knowledge base? | APCA over WCAG 2 for contrast (README and `AGENTS.md`; DESIGN-017 says pass on WCAG 2), and `maximum-scale=1` offered against iOS input zoom (fails axe's `meta-viewport` and their own "Never disable browser zoom"). Two more rules misfire: keyboard handlers on native buttons, 44px targets as a floor. | UIREV-003 |
| What does the `web-design-guidelines` skill do? | It WebFetches `command.md` from `main` on every run, reads the files you name and lists `file:line` findings. It reviews source text only; it never renders the page. | UIREV-004 |
| How do I pin the guidelines? | Copy `command.md` at a commit SHA into a repo skill, keep its MIT notice, edit out the React and Vercel-copy rules, and diff upstream when re-verifying; or curl the SHA URL rather than `main`. | UIREV-005 |
| Which UI-review rules can a script check? | Rules with a computed value: animations left running under reduced motion, `transition: all`, a focus indicator appearing on Tab, focus hidden under sticky content, target size and contrast (axe), zoom (axe), image dimensions, overflow with seeded long text. Necessity of motion, hierarchy, copy, states designed and meaning need judgement. | UIREV-006, UIREV-007 |
| Does axe catch what a UI review needs? | Partly. On our fixture axe with `wcag22aa` found the undersized targets, but it has no rule for a running animation under reduced motion, `transition: all`, a removed focus ring or focus hidden under a sticky header; short Playwright checks found all four, in Chromium and WebKit. | UIREV-007, ACCESS-008 |
| How many evaluators does a heuristic evaluation need? | Three to five, working independently and merging afterwards (NN/g); one evaluator found about 35% of problems in Nielsen's six projects. Rate severity 0–4 afterwards, as the mean of about three raters. | UIREV-008 |
| How good are LLMs at heuristic evaluation? | Mixed, and not yet measured on Claude 5: GPT-4o matched 21.2% of three experts' issues, 27 of its 68 distinct findings were false positives, GPT-4's critiques were 29% "Not Accurate", and severity agreed exactly between runs only 56% of the time. | UIREV-009 |
| What can one agent's UI review claim? | Likely issues with evidence, not confirmed usability problems: one evaluator's estimate. Review the running page, give each finding its proof, and leave severity to a person. | UIREV-012 |
| Which design-review agents and skills exist, and do they need write access? | OneRedOak's agent (Sonnet, Playwright, phases 0–7, WCAG 2.1 AA) is given Edit and Write it never needs; Impeccable's critique reports and `polish` fixes; Emil Kowalski's `review-animations` only reports; Impeccable's finish-reviewer has `Read, Bash, Glob, Grep` only. A reviewer needs no write tools. | UIREV-010 |
| How do I run a cheap read-only UI review in Claude Code? | The caller runs a committed check script (axe plus computed styles) and passes its JSON to a subagent with Read, Grep, Glob and named Playwright tools, no Edit or Write. It works from `browser_snapshot`, takes few screenshots (a 1440×900 one is about 1,716 tokens) and returns findings with proof plus what it didn't check. | UIREV-011, REPO-021 |
| Static file review or running-page review? | Both, for different rules: lint and a file review catch `transition: all` or a missing `alt` in source; only a rendered page shows computed contrast, focus, target sizes and reduced-motion behaviour. | UIREV-004, UIREV-006 |

## Index

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

## [UIREV-001] Vercel's Web Interface Guidelines: three files, what they cover
- Type: fact
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [web-interface-guidelines README at 434b7f9](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/434b7f913646/README.md), [command.md at 434b7f9](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/434b7f913646/command.md), [AGENTS.md at 434b7f9](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/434b7f913646/AGENTS.md), [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines)
- Related: UIREV-002, UIREV-004, DESIGN-009, ACCESS-015

vercel-labs/web-interface-guidelines (MIT; last commit 2026-10-05, `gh api`) calls itself "a living, non-exhaustive list" of interface decisions: "Most guidelines are framework-agnostic, some specific to React/Next.js." Three files carry it, and they differ:

| File | For | Shape (`grep -c '^- '`, 2026-10-23) |
|---|---|---|
| `README.md` | People | 131 bullets in Interactions, Animations, Layout, Content, Forms, Performance, Design, then "Vercel-specific" Copywriting |
| `command.md` | The review (UIREV-004) | 104 terse rules in 16 groups, an "Anti-patterns (flag these)" list and a `file:line` output format |
| `AGENTS.md` | Generation ("so agents apply these guidelines during generation") | 108, as "MUST/SHOULD/NEVER" |

**Beyond WCAG:** craft and robustness rules a conformance audit skips, such as "a short show-delay (~150–300 ms) & a minimum visible time (~300–500 ms)" for spinners (against flicker), "Never `transition: all`", "Animate `transform`/`opacity` only (compositor-friendly)", "Child radius ≤ parent radius", tabular numbers, URL as state, "Scroll positions persist", "`POST/PATCH/DELETE` complete in <500ms". The timings are one vendor's figures, justified mostly by links to its designers' posts.

Its accessibility rules restate WCAG and the APG; they weren't tested here as a review prompt (UIREV-004). Treat the whole list as a checklist to borrow from, not a standard (UIREV-002, UIREV-003).

## [UIREV-002] Universal, React-only, Tailwind and Vercel-only rules in the guidelines
- Type: comparison
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [README at 434b7f9](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/434b7f913646/README.md), [command.md at 434b7f9](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/434b7f913646/command.md)
- Related: UIREV-001, UIREV-003, UIREV-005, NG-003, WEBPERF-008

Our sorting; the README itself marks only the copy section.

| Kind | Rules | In an Angular app |
|---|---|---|
| Universal (most) | Keyboard and focus, labels, paste, hit targets, reduced motion, long content, empty states, image dimensions, `Intl.*` formats, zoom, safe areas, `color-scheme` | Apply |
| React or Next.js | "Inputs with `value` need `onChange`", "`suppressHydrationWarning` only where truly needed", "Prefer uncontrolled inputs", "consider URL sync via nuqs", React Scan, `<Link>` | Drop the input rules. Hydration: no server/client divergence (NG-003). nuqs: router query params. `<Link>`: `routerLink` on a real `<a>`. React Scan: Angular DevTools |
| Tailwind class names | `focus-visible:ring-*`, `truncate`, `line-clamp-*`, `min-w-0` | Apply as written where the repo uses Tailwind; else the CSS they stand for |
| Vercel's taste | README: "These preferences reflect Vercel's brand & product choices. They aren't universal guidelines": Title Case, "Prefer `&` over `and`", "Write in second person", numerals for counts | The repo's own style guide |
| Vercel's product | "Right-click the nav logo", Geist Mono, "Join Vercel" | Skip |

`priority` on above-the-fold images maps to `NgOptimizedImage`'s `priority` (WEBPERF-008).

**The trap:** `command.md`, the file the review runs, has a "Content & Copy" group with "Title Case for headings/buttons (Chicago style)", "Second person; avoid first person" and "`&` over "and" where space-constrained", without the "Vercel-specific" marker. A review with the skill reports sentence-case headings as findings. Strip that group when pinning (UIREV-005).

## [UIREV-003] Where the guidelines contradict WCAG, this knowledge base or themselves
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [README at 434b7f9](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/434b7f913646/README.md), [AGENTS.md at 434b7f9](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/434b7f913646/AGENTS.md), [command.md at 434b7f9](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/434b7f913646/command.md), [axe-core 4.14.0 meta-viewport check](https://raw.githubusercontent.com/dequelabs/axe-core/v4.14.0/lib/checks/mobile/meta-viewport.json), [WebKit: new interaction behaviors in iOS 10](https://webkit.org/blog/7367/new-interaction-behaviors-in-ios-10/), [Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [APG: button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- Related: DESIGN-017, ACCESS-005, ACCESS-009, UIREV-002

**Contradictions:**
1. **Contrast.** README: "Prefer APCA over WCAG 2 for more accurate perceptual contrast"; `AGENTS.md`: "MUST: Meet contrast—prefer APCA over WCAG 2". DESIGN-017: WCAG 3's draft says "The contrast algorithm used in WCAG 3 is yet to be determined"; pass and fail on WCAG 2.2's 1.4.3 (4.5:1 text, 3:1 large) and 1.4.11 (3:1 UI parts), with APCA as a second check. `command.md` has no algorithm rule, so the review skill doesn't enforce APCA; generation from `AGENTS.md` would. Trust DESIGN-017 (INDEX.md Conflicts).
2. **Zoom.** README "Mobile input size": font size ≥ 16px "Or set `<meta name="viewport" content="… maximum-scale=1" />`". The same README: "Never disable browser zoom", and `command.md` flags `maximum-scale=1`. axe 4.14.0's `meta-viewport` (tags `wcag2aa`, `wcag144`) fails a `maximum-scale` under `"scaleMinimum": 2`. iOS Safari ignores it for pinch zoom ("Safari on iOS 10 allows the user to pinch zoom on every page", WebKit), but other browsers may not. Use the 16px font size.

**Rules that misfire:**
3. **Keyboard handlers.** `command.md`: "Interactive elements need keyboard handlers (`onKeyDown`/`onKeyUp`)". A native button already handles keys: "Space: Activates the button. Enter: Activates the button" (APG). The rule fits only custom widgets, which the same file tells you to avoid. Flag missing handlers only on non-native elements (ACCESS-009).
4. **Targets.** "On mobile, the minimum size is 44px" is 2.5.5 Target Size (Enhanced), Level AAA; AA's 2.5.8 asks for "at least 24 by 24 CSS pixels" with a spacing exception. A design goal, not a failure.

## [UIREV-004] The `web-design-guidelines` skill: an unpinned fetch and a file-only review
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [agent-skills web-design-guidelines SKILL.md at ba46938](https://raw.githubusercontent.com/vercel-labs/agent-skills/ba46938889d4/skills/web-design-guidelines/SKILL.md), [web-interface-guidelines install.sh at 434b7f9](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/434b7f913646/install.sh), [Tools reference: WebFetch](https://code.claude.com/docs/en/tools-reference)
- Related: UIREV-005, UIREV-006, TOK-087, SKILL-034, DESIGN-012

The skill (vercel-labs/agent-skills, `metadata.version: "1.0.0"`, last changed 2026-01-16; no licence in the GitHub API on 2026-10-23) is 1,231 bytes. Its steps, quoted:

1. "Fetch the latest guidelines from the source URL below": `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`, "Fetch fresh guidelines before each review… Use WebFetch".
2. "Read the specified files (or prompt user for files/pattern)".
3. "Check against all rules in the fetched guidelines".
4. "Output findings in the terse `file:line` format".

Its description triggers on "review my UI", "check accessibility", "audit design", "review UX".

**What follows:**
- **Unpinned.** The rules are whatever `main` holds at run time: `command.md` changed 6 times from 2026-01-12 to 2026-10-23 (`gh api "repos/vercel-labs/web-interface-guidelines/commits?path=command.md"`), and the skill's version doesn't move with them.
- **Lossy.** For most fetches WebFetch "runs the prompt against the content in a separate model call… This makes WebFetch lossy by design" (TOK-087), so a 104-rule list can come back summarised. Not tested here.
- **Remote text in context.** Whoever can push to `main` writes part of the reviewer's prompt.
- **Source text only.** It never renders the page, so computed contrast, focus visibility, target sizes and reduced-motion behaviour are out of reach (UIREV-006).
- The repo's `install.sh` instead curls `command.md` from `main` once into `~/.claude/commands/web-interface-guidelines.md`: a snapshot, unpinned and unrecorded.

The skill itself wasn't run on our fixture, so what it flags in practice is untested.

## [UIREV-005] Pinning interface guidelines for a review
- Type: recommendation
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-23
- Sources: [agent-skills web-design-guidelines SKILL.md at ba46938](https://raw.githubusercontent.com/vercel-labs/agent-skills/ba46938889d4/skills/web-design-guidelines/SKILL.md), [web-interface-guidelines LICENSE](https://github.com/vercel-labs/web-interface-guidelines/blob/main/LICENSE), [Skills](https://code.claude.com/docs/en/skills)
- Related: UIREV-002, UIREV-003, UIREV-004, SKILL-034, OSS-010

Our synthesis, best first:

1. **Vendor an edited copy at a SHA.** Put the rules in a repo or personal skill's reference file, with the source URL and commit (`434b7f913646` read here) beside it. The guidelines repo is MIT, so keep its copyright notice with the copy (OSS-010). Drop the React-only and Vercel-copy rules (UIREV-002), fix the misfiring ones (UIREV-003), and keep Tailwind names only if the repo uses Tailwind.
2. **Or fetch by SHA with curl**, not `main` with WebFetch: `curl -sL https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/<sha>/command.md`. Pinned and verbatim, but still remote text at run time, and unedited.
3. **Track upstream.** When re-verifying, diff the pinned copy against `main` (`gh api "repos/vercel-labs/web-interface-guidelines/commits?path=command.md"`) and adopt changes on purpose.

**When not to:** if the repo's own style guide or review skill already covers a rule family, copy only the rules it lacks rather than a second, competing list. Don't install the agent-skills copy just to get the rules: it has no licence in the GitHub API (2026-10-23) and refetches `main` anyway.

## [UIREV-006] Which UI-review rules a script can check, and which need judgement
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Playwright Page.emulateMedia at v1.64.1](https://raw.githubusercontent.com/microsoft/playwright/v1.64.1/docs/src/api/class-page.md), [Playwright MCP README: browser_emulate_media](https://github.com/microsoft/playwright-mcp/blob/main/README.md), [axe-core 4.14.0 rules](https://github.com/dequelabs/axe-core/tree/v4.14.0/lib/rules), [Understanding 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), [Understanding 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [command.md at 434b7f9](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/434b7f913646/command.md)
- Related: UIREV-007, DESIGN-007, ACCESS-005, ACCESS-011, ACCESS-012, ACCESS-014, ACCESS-015

| How | Rules (problem prevented) | Tested here |
|---|---|---|
| axe with `wcag22aa` (ACCESS-005) | 1.4.3 contrast; zoom disabled (`meta-viewport`); names and labels; 2.5.8 `target-size` (mis-taps) | target size |
| Script on the running page (UIREV-007) | Motion left on under `reduce` (vestibular, 2.3.3 AAA); `transition: all` (jank); focus indicator appears on Tab (2.4.7, lost position); focus under sticky content (2.4.11); seeded long text overflowing (`scrollWidth > clientWidth`); reflow at 320 CSS px (1.4.10, with exceptions); `<img>` without dimensions (CLS) | first four |
| Lint and static search | angular-eslint's accessibility rules (ACCESS-011); `outline: none` with no replacement style | no |
| Scripted walk plus judgement (ACCESS-012, ACCESS-013) | Tab order, no keyboard trap, modal focus and return, `inert` behind a modal, `aria-expanded`, live regions (4.1.3) | no |
| Judgement | "Necessity check" for motion, "Easing fits the subject", hierarchy and alignment (partly measurable), states designed, "No dead ends", copy, whether alt text means anything; 2.2.2 pause controls | no |

**Emulation:** `page.emulateMedia()` takes `reducedMotion` (since v1.12), `forcedColors` (v1.15), `colorScheme` (v1.9) and `contrast` (`'more'`, v1.51); each is also a context option. Playwright MCP has the same five as `browser_emulate_media`, in its core tools. Emulation sets the media query, not the OS setting.

**Presence, not adequacy.** A computed outline proves an indicator exists, not that it meets 1.4.11's 3:1; a passing check means "likely fine", and the judgement rows still need a careful reviewer (UIREV-012).

## [UIREV-007] Test: four running-page checks in Playwright against axe
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Playwright Page.emulateMedia at v1.64.1](https://raw.githubusercontent.com/microsoft/playwright/v1.64.1/docs/src/api/class-page.md), [Understanding 2.4.11, technique C43](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), [axe-core target-size rule at v4.14.0](https://raw.githubusercontent.com/dequelabs/axe-core/v4.14.0/lib/rules/target-size.json), local test
- Related: UIREV-006, ACCESS-006, ACCESS-008, ACCESS-014

Fixture: an 80px sticky header, a decorative spinner (`animation: spin 1s linear infinite`), a `transition: all` button, two 16×16 icon buttons, a button with `:focus-visible { outline: none }`. The "fixed" variant added `scroll-padding-top: 96px` (C43), `animation: none` under `prefers-reduced-motion: reduce` (the ring stays, static), a transition list, 24×24 icons and an outline. Checks, per element, in a context with `reducedMotion` set:

```js
document.getAnimations().filter(a => a.playState === 'running'
  && a.effect?.getComputedTiming().iterations === Infinity);
// transition: all (the initial value is `all` with 0s, so require a duration)
s.transitionProperty.split(',').some(p => p.trim() === 'all')
  && s.transitionDuration.split(',').some(d => parseFloat(d) > 0);
// after Tab: outline style not 'none' with width > 0, or a box-shadow
// after Tab: at least one of 5 points (corners, centre) has the element on top (elementFromPoint)
```

| Variant | Running under `reduce` | `transition: all` | No indicator | Focus under header | axe |
|---|---|---|---|---|---|
| Bad | spinner | 1 | 1 | 5 of 6 stops | `target-size` (2) |
| Fixed | none (spinner runs under `no-preference`) | 0 | 0 | 0 | none |

- The fixture was built with these failures, so this shows axe has no rule for four of them, not a miss rate.
- Focus hid only when the walk first scrolled each target under the header; a plain Tab walk scrolled targets into view. Both engines honoured `scroll-padding-top`.
- A naive 24×24 box check flagged two 21px-tall text buttons in Chromium that pass 2.5.8 by spacing; use axe's rule.
- **Limits:** a resting `box-shadow` passes the indicator check (compare before and after focus), and `forced-colors` removes shadows; `elementFromPoint` misses `pointer-events: none` overlays and returns a shadow host; only infinite CSS or Web Animations count, not JS carousels, smooth scrolling or video, and none of it shows 2.2.2.
- `@axe-core/playwright` threw "Please use browser.newContext()" on a `browser.newPage()` page.

Tested 2026-10-23, `playwright@1.64.1` (Chromium 156.0.8078.4, WebKit 27.2) and `@axe-core/playwright@4.14.0`, Node 24.21.0, 1280×720: results as in the table in both engines.

## [UIREV-008] Heuristic evaluation: evaluators and severity (NN/g)
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [NN/g: How to conduct a heuristic evaluation (2023-06-25)](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/), [Nielsen: The theory behind heuristic evaluations (1994-11-01)](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/theory-heuristic-evaluations/), [Nielsen: Severity ratings for usability problems (1994-11-01)](https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/), [Nielsen: Usability problems found by heuristic evaluation](https://www.nngroup.com/articles/usability-problems-found-by-heuristic-evaluation/)
- Related: UIREV-009, UIREV-012, DESIGN-025

**Evaluators.** NN/g (2023): "Ideally, three to five people should independently evaluate the same interface", and they "should not see each other's evaluations until their own evaluation is complete". Nielsen (1994): "Averaged over six of my projects, single evaluators found only 35 percent of the usability problems"; "It would seem reasonable to recommend the use of about five evaluators, but certainly at least three." Evaluators find different problems, so "one cannot just identify the best evaluator and rely solely on that person's findings." A "75% with five evaluators" figure circulates; no NN/g text read here states it.

**Procedure:** about "1–2 hours", a narrow scope, two passes (learn the flow, then look for violations), each problem listed separately "with reference to" a heuristic, not "they do not like something".

**Severity:** a combination of "frequency", "impact" and "persistence" (plus market impact), 0–4, from "0 = I don't agree that this is a usability problem at all" to "4 = Usability catastrophe: imperative to fix this before product can be released". Rate after finding: "severity ratings from a single evaluator are too unreliable to be trusted… using the mean of a set of ratings from three evaluators is satisfactory".

**Limits:** heuristic evaluations "help you find likely issues without having to test with participants. However, heuristic evaluations cannot replace user research"; a violation "does not necessarily mean it's a problem that needs to be fixed". Nielsen: lists "tend to be dominated by minor problems", and evaluators miss more where "the system is highly domain-dependent and they have little domain expertise".

## [UIREV-009] LLM heuristic evaluation: what studies found
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-23
- Sources: [Capeleti et al., arXiv 2506.16345 (INTERACT 2025)](https://arxiv.org/abs/2506.16345), [Duan et al., arXiv 2403.13139 (CHI 2024)](https://arxiv.org/abs/2403.13139), [Platt et al., arXiv 2512.04262 (VL/HCC 2025)](https://arxiv.org/abs/2512.04262), [Zhong et al., arXiv 2507.02306](https://arxiv.org/abs/2507.02306), [NN/g: AI for UX: getting started (2023-11-03)](https://www.nngroup.com/articles/ai-ux-getting-started/)
- Related: UIREV-008, UIREV-012, DESIGN-025

Each a single study; none on a Claude 5 model.

- **Capeleti et al.** (GPT-4o, 20 screenshots of one web system, against three experts' joint list): "only 21.2% of the issues identified by human experts were also identified by GPT-4o". Of 111 issues, 43 were duplicates and 27 false positives: 27 of the 68 distinct ones (the paper's 24.3% counts all 111). Many came from static screens: "lack of feedback" that existed in the live system.
- **Duan et al.** (GPT-4 in a Figma plugin, 51 UIs, temperature 0): "52 percent were rated Accurate, 19 percent Partially Accurate, and 29 percent Not Accurate"; all 12 designers saw "Overapplication of Guidelines", and experts found more global and visual issues.
- **Platt et al.** (GPT-4o on 30 sites' source code, 3 runs each, no ground truth): issue detection "average pairwise Cohen's Kappa of 0.50 and an exact agreement of 84%"; severity "exact agreement was just 56%".
- **Zhong et al.** reported GPT-4 finding "73% and 77%" of issues against five humans' "57% and 63%" on two apps, but the reference set included GPT-4's own findings, so it isn't comparable with the 21.2%. Gemini 1.5 Pro and Claude 3.5 Sonnet "did not uncover any new issues that are not of severity 0".
- **NN/g** (2023, before these models): "AI-derived design critiques are dangerous because many of its insights are wrong, even if they are argued in polished language".

No study read measured whether several runs or models together find more real issues.

## [UIREV-010] Design-review agents and skills: rubric, tools, write access
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-23
- Sources: [OneRedOak design-review-agent.md at 29a34c7](https://raw.githubusercontent.com/OneRedOak/claude-code-workflows/29a34c725313c7621f426f838ed31cf482473fb4/design-review/design-review-agent.md), [Impeccable critique.md at 5cb95ee](https://raw.githubusercontent.com/pbakaus/impeccable/5cb95eea9c96479f57afe0732a45470d30183326/.claude/skills/impeccable/reference/critique.md), [Impeccable finish-reviewer at 5cb95ee](https://raw.githubusercontent.com/pbakaus/impeccable/5cb95eea9c96479f57afe0732a45470d30183326/.claude/agents/impeccable-finish-reviewer.md), [emilkowalski/skills at 2d22863](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills), [wshobson/agents at 0874a27](https://github.com/wshobson/agents/tree/0874a27b17a22e2b7c2e2bcd725768e0803cad06/plugins), [Sub-agents: tools field](https://code.claude.com/docs/en/sub-agents)
- Related: DESIGN-012, DESIGN-025, REPO-033, UIREV-011

Files read at the commits in Sources on 2026-10-23, not run; licences from `gh api`. Without `tools:` an agent "Inherits every tool available to subagents"; a skill without `allowed-tools` has the session's tools.

| Reviewer | Rubric | Write tools | Review or fix |
|---|---|---|---|
| OneRedOak `design-review` agent (MIT) | Phases 0–7 at 1440, 768 and 375 px with Playwright; "WCAG 2.1 AA", so no 2.4.11 or 2.5.8; no reduced-motion step; `[Blocker]` to `[Nitpick]` | Edit, MultiEdit, Write, NotebookEdit, Bash; its procedure needs none | Reports |
| Impeccable `critique` (Apache-2.0) | Specificity verdict, Nielsen's 10 at 0–4 ("Most real interfaces score 20-32 out of 40", the author's claim), P0–P3, personas; then its detector, a downloaded binary | Inherits; writes `.impeccable/critique/` | Reports; `polish` fixes |
| Impeccable finish-reviewer | Disposition `recapture`, `rebuild`, `fix` or `ship` | None: `Read, Bash, Glob, Grep`, "You edit nothing" | Reports |
| Emil Kowalski `review-animations` (MIT) | Ten standards, e.g. "UI animations stay under 300ms", reduced motion "gentler, not zero"; code only | Inherits | Reports, ends "Block" or "Approve" |
| Emil Kowalski `break-ui` | Worst-case data at the real width, "320px", widest, zoom 200%, dark, RTL | Inherits; writes a fixture and a dev toggle | "Report before fixing" |
| wshobson `ui-design:design-review` (MIT) | Critical to Suggestions; code only | Inherits; writes `.ui-design/reviews/` | Offers fixes |

Impeccable runs its two assessments "as two isolated sub-agents" so detector output doesn't anchor judgement. Anthropic's three public repos had no UI-review agent or skill (trees searched 2026-10-23).

## [UIREV-011] A cheap read-only UI review in Claude Code
- Type: recommendation
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-23
- Sources: [Sub-agents](https://code.claude.com/docs/en/sub-agents), [Vision: image costs](https://platform.claude.com/docs/en/build-with-claude/vision), [Playwright MCP README](https://github.com/microsoft/playwright-mcp/blob/main/README.md), [OneRedOak design-review-agent.md at 29a34c7](https://raw.githubusercontent.com/OneRedOak/claude-code-workflows/29a34c725313c7621f426f838ed31cf482473fb4/design-review/design-review-agent.md)
- Related: REPO-021, REPO-033, REPO-053, TOK-043, ACCESS-015, UIREV-006, UIREV-007, UIREV-010, UIREV-012, ORCH-030

Our synthesis of the entries in Related; osrs-tracker-web's browser-checker (REPO-021) works this way.

1. **The caller runs the scripts.** A committed script runs axe with `wcag22aa` and the computed-style checks (UIREV-007) and prints JSON; the caller passes it in. The reviewer then needs no Bash.
2. **A subagent without write tools.** `tools: Read, Grep, Glob` plus Playwright tools by full name (the prefix differs: `mcp__plugin_playwright_playwright__browser_*` from the plugin): `navigate`, `snapshot`, `resize`, `evaluate`, `press_key`, `emulate_media`, `take_screenshot`. With its own `mcpServers` server, also `disallowedTools` for `browser_run_code_unsafe` and `browser_file_upload` (REPO-053). The caller applies fixes (REPO-033).
3. **Snapshot first, few screenshots.** `browser_snapshot` returns the accessibility tree. An image costs ⌈w/28⌉ × ⌈h/28⌉ tokens: 1440×900 is 1,716 on models with the 4,784-token high-res cap, 375×812 is 406. Viewport shots at the widths that matter (OneRedOak's 1440, 768, 375, plus 320 for reflow), and they stay in the subagent (REPO-021).
4. **Findings with proof:** rule, place (`file:line` or selector), measured value or screenshot path, measured or judged; severity on Nielsen's 0–4 as provisional (UIREV-008); then what wasn't checked (ACCESS-015).
5. **Model:** Sonnet 5.5 at `medium` for the checklist; Opus 5.5 at `high` for critique (ORCH-030).

**When not to:** one value on one page is a single `browser_evaluate` in the main session.

## [UIREV-012] What one agent's UI review can and can't claim
- Type: recommendation
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-23
- Sources: [NN/g: How to conduct a heuristic evaluation](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/), [Nielsen: Severity ratings](https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/), [Capeleti et al., arXiv 2506.16345](https://arxiv.org/abs/2506.16345), [Platt et al., arXiv 2512.04262](https://arxiv.org/abs/2512.04262)
- Related: UIREV-008, UIREV-009, UIREV-011, DESIGN-025, ACCESS-015

Our synthesis of UIREV-008 and UIREV-009: an agent's review "finds likely issues; confirms none". It is one evaluator's estimate, where NN/g asks for three to five independent ones, and no evidence from users.

1. **Review the running page**, not screenshots alone: static screens produced false "lack of feedback" findings (UIREV-009). Script what has a number first (UIREV-006).
2. **Give each finding its evidence:** the heuristic or rule, the place, the measured value or what was seen, and whether it was measured or judged. Nielsen: not "they do not like something".
3. **Severity is provisional.** One rater's severity is "too unreliable to be trusted", and an LLM's agreed with itself exactly only 56% of the time; a person rates it, ideally as the mean of a few opinions.
4. **A heuristic score isn't a usability result.** Impeccable's 0–40 (DESIGN-025) is one evaluator's estimate; report it as such or not at all.
5. **More runs aren't more evaluators.** Nobody has measured whether several runs or models add real issues (UIREV-009); a different person, or a user test, still does.

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-23 against `main` of osrs-tracker-web (`f206553`) and freek-mencke-web (`a2e5e0b`), whose browser-checker agents already report focus rings and covered points after each Tab (2.4.7, 2.4.11).

1. **Sites with a sticky header: `scroll-padding-top` matching it on `html`, and a scrolled keyboard walk in the checker** (UIREV-007). A Tab walk from the top doesn't scroll targets under the header, so it can't find this. osrs-tracker/osrs-tracker-web#389 (both parts); FreekMencke/freek-mencke-web#41 (the walk; its padding is already set).
2. **Both checkers: a reduced-motion check** with `browser_emulate_media` (both agents have it): animations still running under `reduce` that also run under `no-preference` (UIREV-007, ACCESS-014). In osrs-tracker/osrs-tracker-web#389 and FreekMencke/freek-mencke-web#41.
3. **Don't install `web-design-guidelines`** (UIREV-004, UIREV-005). A read-only `ui-review` skill with a pinned, edited subset of the rules is proposed on FreekMencke/claude-kb#260 ([comment](https://github.com/FreekMencke/claude-kb/issues/260#issuecomment-6359145247)).
4. **Frame agent reviews as likely issues** (UIREV-012): the checkers' "Not checked" list already does this for accessibility. No change now.

## Open questions

- **Do several agent runs or models together find more real UI issues?** No study measured it; in Zhong et al. two other models added only severity-0 items (UIREV-009). Looked in arXiv, NN/g and the papers' related work.
- **The "75% with five evaluators" figure:** not in Nielsen's 1994 theory article or NN/g's 2023 how-to; no primary source found (UIREV-008).
- **Nielsen's CHI '92 novice, specialist and double-specialist figures** (reported as 22%, 41% and 60%) were read only on a secondary course page; the ACM PDF returned 403.
- **How do Claude 5 models do at heuristic evaluation** against experts? Every study read used GPT-4 or GPT-4o; Claude 3.5 Sonnet appeared only in a side test.
- **Does WebFetch return `command.md`'s 104 rules intact, and what does the skill flag on a real page?** Neither tested (UIREV-004).
- **Firefox:** the focus and `scroll-padding` results in UIREV-007 are Chromium and WebKit only.
