# Web accessibility: WCAG 2.2, the EU Accessibility Act, axe and its limits

Prefix `ACCESS`. This file covers web accessibility for agents building and checking sites on 2026-10-17: which standard to target (WCAG 2.2 AA, with WCAG 3.0 still a draft), the European Accessibility Act and EN 301 549, what axe-core, `@axe-core/playwright`, Lighthouse and angular-eslint catch and what they miss, native elements against ARIA and the APG patterns, focus after client-side route changes, `<dialog>`, `inert`, popover and `ariaNotify`, motion and contrast preferences, and how an agent should run an accessibility check. Contrast maths is in `kb-design.md` (DESIGN-017); popover, `<dialog>` and `inert` as CSS features and their Baseline dates are in `kb-css-baseline.md` (CSS-005, CSS-008); Playwright itself is in `kb-js-testing.md` (JSTEST-010 to JSTEST-012). Nothing in this file is legal advice.

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#178, part of roadmap #167) by an Opus 5.5 lead with four Sonnet 5.5 readers.
- Standards and law read as raw text: w3.org (WCAG 2.2, WCAG 3.0 draft, WAI pages, APG, ARIA in HTML, WAI-ARIA 1.3), the Publications Office's XHTML of Directives (EU) 2019/882 and 2016/2102 and Implementing Decision (EU) 2021/1339 (EUR-Lex itself answered curl with a bot challenge), and the ETSI PDF of EN 301 549 V4.1.1.
- Tools: versions and dates from the npm registry (`npm view <pkg> dist-tags`, `npm view <pkg> 'time[<version>]'`, `npm view <pkg>@<version> peerDependencies dependencies`); docs from dequelabs/axe-core (`develop`), dequelabs/axe-core-npm, microsoft/playwright at `v1.64.1`, GoogleChrome/lighthouse at `v13.5.0`, angular/angular (`main`) and mdn/content (`main`); browser support from `web-features@3.43.0`.
- Tested on Node 24.21.0 (WSL2) with Google Chrome 155, official packages installed by `npm install --ignore-scripts` in a scratch folder: `axe-core` 4.13.0 and 4.14.0, `@axe-core/playwright@4.14.0`, `@playwright/test@1.64.1`, `lighthouse@13.5.0`, `angular-eslint@22.6.0` with `eslint@10.13.0`. One fixture page and one Angular template held the same 13 mistakes. No community package was run.
- Our repos were read on 2026-10-17 from `main` of osrs-tracker-web and freek-mencke-web through the GitHub API.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which accessibility standard should a site target in 2026, and can I build to WCAG 3.0? | WCAG 2.2 level AA (W3C Recommendation, republished 2024-12-12; ISO/IEC 40500:2025); the working group recommends it "even if formal obligations mention previous versions". WCAG 3.0 is a Working Draft (2026-09-10): "It is inappropriate to cite this document as other than a work in progress", and "WCAG 3 does not replace WCAG 2". | ACCESS-001 |
| What did WCAG 2.2 add that changes code? | Six A/AA criteria: focus not hidden by sticky content (2.4.11), a non-drag alternative (2.5.7), targets of 24×24 CSS px or spaced (2.5.8), consistent help (3.2.6), no re-entering data (3.3.7), login without a memory or puzzle test (3.3.8). 4.1.1 Parsing is removed. | ACCESS-002 |
| Does the European Accessibility Act apply to my site? | It applies from 2025-06-28 to listed consumer services, including e-commerce ("with a view to concluding a consumer contract"). Microenterprises (under 10 staff and at most EUR 2 million turnover or balance sheet) providing services are exempt. National laws transpose it; not legal advice. | ACCESS-003 |
| Which EN 301 549 version counts, and when is v4.1.1 cited? | v3.2.1 (WCAG 2.1) is the cited one, under the Web Accessibility Directive. v4.1.1 (published 2026-09-02, WCAG 2.2 AA) gives a presumption of conformity with the EAA once cited in the Official Journal: expected "around November 30, 2026" (Deque) or "16 December 2026" (Ireland's NDA). | ACCESS-004 |
| What does axe-core 4.14 run by default, and why did my violation count go up? | Every rule except experimental, AAA and deprecated ones, plus best practices. 4.14.0 (2026-10-05) turned on `label-content-name-mismatch`. WCAG 2.2's `target-size` runs only when you ask for the `wcag22aa` tag. | ACCESS-005 |
| How do I add axe to Playwright tests? | `@axe-core/playwright` (versioned with axe-core, 4.14.0): `new AxeBuilder({ page }).withTags([...]).analyze()` and expect no violations. Add `wcag22aa` to the docs' tag list, scan each state after it settles, and snapshot a fingerprint, not the whole result. | ACCESS-006 |
| Does a Lighthouse accessibility score of 100 mean the site is accessible? | No. It is a weighted pass/fail average over a fixed set of axe rules; Google: it "can only detect a subset of issues and does not guarantee the accessibility of your web app". Its 10 manual audits don't count. | ACCESS-007 |
| What do automated accessibility checks miss? | In our test, both axe and Lighthouse passed a clickable `<div>`, a `role="button"` that can't be focused, a placeholder-only input, `alt="image"` and a removed focus ring. Deque claims 57% of issues by volume; GOV.UK's 2018 audit had axe finding 29% of 142 planted barriers. | ACCESS-008 |
| Should I use `role="button"` on a div, or a native element? | A native element. APG: "No ARIA is better than Bad ARIA"; a role "Is a promise" of keyboard behaviour the browser won't add. WebAIM's 2026 scan: pages with ARIA averaged 59.1 errors against 42 without. | ACCESS-009 |
| Is my site's dropdown navigation an ARIA menu? | No. APG's disclosure navigation example doesn't use `role="menu"`: "Typical site navigation does not need all the keyboard interactions". Use buttons with `aria-expanded` and links. For real widgets (tabs, combobox, grid, tree) follow the APG pattern or use `@angular/aria`. | ACCESS-010 |
| What catches div buttons that axe can't? | Template lint: angular-eslint's `templateAccessibility` config (not in `templateRecommended`) flagged them in our test, plus a missing alt, an unlinked label and an invalid ARIA attribute. Role locators (`getByRole('button')`) fail on them too. | ACCESS-011, ACCESS-006 |
| Where should focus go after an Angular route change? | Angular leaves it to you: move it on `NavigationEnd` to the new page's main heading (`tabindex="-1"`) or the main region, never leave it on `<body>`; announcing the page title in a polite live region is recommended, not required. | ACCESS-012 |
| Do I need a focus trap for a modal? | Not with `<dialog>` and `showModal()`: the browser makes the rest inert, moves focus in, handles Esc and returns focus. A `<div popover>` has no role or focus handling of its own: the HTML spec says to add ARIA. | ACCESS-013 |
| What does WCAG require for animation? | A pause, stop or hide control for automatic motion lasting over 5 seconds (2.2.2, A). Disabling interaction-triggered motion is AAA (2.3.3), met with `prefers-reduced-motion` (technique C39). | ACCESS-014 |
| How should an agent check accessibility before saying it's done? | Lint templates, scan every changed page and state with axe on the WCAG 2.2 AA tags, walk the change by keyboard, and list what a human must still judge (alt text meaning, reading order, screen-reader output, zoom). Never report "accessible" from a clean scan. | ACCESS-015 |

## Index

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

## [ACCESS-001] Target WCAG 2.2 AA; WCAG 3.0 is a Working Draft
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [WCAG overview (ISO status)](https://www.w3.org/WAI/standards-guidelines/wcag/), [WCAG 3.0 Working Draft](https://www.w3.org/TR/wcag-3.0/), [WCAG 3 Introduction](https://www.w3.org/WAI/standards-guidelines/wcag/wcag3-intro/), [w3c/wcag3 wiki: Schedule](https://github.com/w3c/wcag3/wiki/Schedule)
- Related: ACCESS-002, ACCESS-004, DESIGN-017

**WCAG 2.2** is a W3C Recommendation, first published 2023-10-05 and republished with errata as "W3C Recommendation 12 December 2024". The working group "recommends that sites adopt WCAG 2.2 as their new conformance target, even if formal obligations mention previous versions", and "Content that conforms to WCAG 2.2 also conforms to WCAG 2.0 and WCAG 2.1." Level AA is what the law references (ACCESS-004).

**ISO.** W3C: "WCAG 2.2 is an approved International Organization for Standardization (ISO) standard: ISO/IEC 40500:2025", "exactly the same as the October 2023 version"; the December 2024 text is expected as ISO/IEC 40500:2026 "by late 2026" (iso.org blocked curl, so not checked there).

**WCAG 3.0** is a "W3C Working Draft 10 September 2026": "It is inappropriate to cite this document as other than a work in progress." "WCAG 3 does not replace WCAG 2." The introduction page (updated 2026-09-25): it "is not expected to be a completed W3C standard for a few more years", and "The best way to prepare for WCAG 3 in the future, is to meet WCAG 2.2 success criteria now." The working group's wiki plans a Candidate Recommendation Snapshot in 2027 and adds "Historically, it has taken an additional 2 years from that point to final publication" (a planning page, not a W3C commitment). The draft reports conformance with tags and tiers, not bronze, silver and gold.

**For Claude:** write "WCAG 2.2 AA" in specs, prompts and test tags; treat WCAG 3 text as direction, never as a rule to pass or fail.

## [ACCESS-002] What WCAG 2.2 added and removed, and what it means in code
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [What's new in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/), [axe-core rule descriptions](https://raw.githubusercontent.com/dequelabs/axe-core/develop/doc/rule-descriptions.md)
- Related: ACCESS-001, ACCESS-005, ACCESS-012

"WCAG 2.2 provides 9 additional success criteria since WCAG 2.1": six at A or AA, three at AAA (2.4.12, 2.4.13 Focus Appearance, 3.3.9).

| SC | Level | Normative text, shortened | In code |
|---|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | the focused component "is not entirely hidden due to author-created content" | Sticky headers and banners mustn't cover the focused element |
| 2.5.7 Dragging Movements | AA | dragging "can be achieved by a single pointer without dragging" | Sortable lists and sliders need buttons or clicks too |
| 2.5.8 Target Size (Minimum) | AA | "at least 24 by 24 CSS pixels", except Spacing, Equivalent, Inline, User Agent Control, Essential | Icon buttons; smaller targets pass if 24 px circles around them don't overlap |
| 3.2.6 Consistent Help | A | repeated help mechanisms "occur in the same order relative to other page content" | Contact links in a shared layout |
| 3.3.7 Redundant Entry | A | information already entered "in the same process" is auto-populated or selectable | Multi-step forms |
| 3.3.8 Accessible Authentication (Minimum) | AA | no "cognitive function test (such as remembering a password or solving a puzzle)" unless an alternative or mechanism exists | Allow paste and password managers; no transcribe-this-code puzzles |

**Removed:** "Success Criterion 4.1.1 Parsing (Obsolete and removed)": "Assistive technology no longer has any need to directly parse HTML."

axe's only WCAG 2.2 rule is `target-size`, off by default (ACCESS-005); the rest need a test or a person.

## [ACCESS-003] The European Accessibility Act: from when, for whom, and the microenterprise exemption
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Directive (EU) 2019/882 (EUR-Lex)](https://eur-lex.europa.eu/eli/dir/2019/882/oj/eng), read as [the Publications Office XHTML](https://publications.europa.eu/resource/celex/32019L0882), [Dutch implementing act, Stb. 2024, 87](https://zoek.officielebekendmakingen.nl/stb-2024-87.html), [its commencement decree, Stb. 2024, 341](https://zoek.officielebekendmakingen.nl/stb-2024-341.html)
- Related: ACCESS-004, ACCESS-001

Not legal advice: national laws transpose the Directive and are what applies.

- **From when.** Art. 31(2): Member States "shall apply those measures from 28 June 2025".
- **Which services.** Art. 2(2): services "provided to consumers after 28 June 2025": electronic communications, access to audiovisual media, passenger transport websites, apps and e-tickets, consumer banking, e-books, and "(f) e-commerce services". Art. 3(30): e-commerce means "services provided at a distance, through websites and mobile device-based services by electronic means and at the individual request of a consumer with a view to concluding a consumer contract". Products are in Art. 2(1).
- **Microenterprises.** Art. 3(23): "fewer than 10 persons and … an annual turnover not exceeding EUR 2 million or an annual balance sheet total not exceeding EUR 2 million". Art. 4(5): "Microenterprises providing services shall be exempt from complying with the accessibility requirements".
- **Exclusions and transition.** Art. 2(4) excludes, among others, pre-recorded media and office files published before 2025-06-28 and uncontrolled third-party content. Art. 32(1): service contracts agreed before 2025-06-28 run "no longer than five years from that date"; Art. 32(2): self-service terminals up to 20 years.
- **Disproportionate burden** (Art. 14): allowed only after a documented assessment against Annex VI, kept five years.
- **Presumption** (Art. 15): conformity with harmonised standards cited in the Official Journal (ACCESS-004).

Our reading, not the Directive's words: a site that concludes no consumer contracts is outside (f). The Netherlands' act (Stb. 2024, 87) took effect on 2025-06-28.

## [ACCESS-004] EN 301 549: v3.2.1 is cited, v4.1.1 (WCAG 2.2 AA) awaits its Official Journal citation
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [ETSI EN 301 549 V4.1.1 (PDF)](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/04.01.01_60/en_301549v040101p.pdf), [Implementing Decision (EU) 2021/1339](https://publications.europa.eu/resource/celex/32021D1339), [NDA Ireland: EN 301 549 published](https://nda.ie/news/en301549-published), [Deque: EN 301 549 v4.1.1 is final (2026-09-08)](https://www.deque.com/blog/en-301-549-v4-1-1-is-final-what-changed-what-it-means-and-what-you-should-do/), [Directive (EU) 2016/2102](https://publications.europa.eu/resource/celex/32016L2102)
- Related: ACCESS-003, ACCESS-001, ACCESS-005

**v3.2.1** ("EN 301 549 V3.2.1 (2021-03)", WCAG 2.1) is cited under the Web Accessibility Directive 2016/2102, which covers public-sector sites and apps, by Implementing Decision (EU) 2021/1339 of 11 August 2021; the withdrawal of v2.1.2 applied "from 12 February 2022".

**v4.1.1** ("EN 301 549 V4.1.1 (2026-09)", a "HARMONISED EUROPEAN STANDARD") was adopted 2026-08-24 and published 2026-09-02. Its foreword: "the requirements of clauses 9, 10 and 11 have all been updated to align with the WCAG 2.2 recommendation" (its reference pairs "W3C Recommendation (12 December 2024) / ISO/IEC 40500:2025", though W3C says the ISO text is the October 2023 one); Annex ZB maps it to the EAA, and "Once the present document is cited in the Official Journal of the European Union under that Directive", conforming gives "a presumption of conformity".

**When it's cited**, two forecasts:
- Deque (vendor blog, 2026-09-08): "on track to be cited in the journal around November 30, 2026".
- NDA Ireland (a national authority): "This is currently expected on 16 December 2026. Until then, the standard currently in force remains V3.2.1 (2021), built on WCAG 2.1."

30 November 2026 is also the PDF's "Date of latest announcement of this EN (doa)", a standards-body deadline, so Deque may have quoted that (our inference). No implementing decision citing v4.1.1 was found on 2026-10-17 (searched the web and the Publications Office; EUR-Lex blocked curl). Build to WCAG 2.2 AA either way.

## [ACCESS-005] axe-core 4.14: what runs by default, tags, and what 4.14.0 changed
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [axe-core CHANGELOG](https://raw.githubusercontent.com/dequelabs/axe-core/develop/CHANGELOG.md), [axe-core API docs](https://raw.githubusercontent.com/dequelabs/axe-core/develop/doc/API.md), [rule descriptions](https://raw.githubusercontent.com/dequelabs/axe-core/develop/doc/rule-descriptions.md), [README](https://raw.githubusercontent.com/dequelabs/axe-core/develop/README.md), npm registry
- Related: ACCESS-006, ACCESS-007, ACCESS-008, ACCESS-002

`axe-core` latest is 4.14.0, published 2026-10-05 (`npm view axe-core 'time[4.14.0]'`; 4.13.0 on 2026-08-05).

**Default run:** "all rules except for rules with the "experimental" tag"; AAA and deprecated rules are off too, and best-practice rules are on. The rule docs list 105 rules. Results come back as `violations`, `passes`, `inapplicable` and `incomplete` ("needs review", for a human). "Axe does not test hidden regions, such as inactive menus or modal windows."

**Tags:** `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`, `EN-301-549`, `EN-301-549v4` and per-criterion tags (`wcag258`). `runOnly` with tags runs only those, so best practices drop out. The WCAG 2.2 section: "These rules are disabled by default, until WCAG 2.2 is more widely adopted and required"; it holds one rule, `target-size`.

**4.14.0:** "label-content-name-mismatch: Enable rule by default" (WCAG 2.5.3: the accessible name must contain the visible label) and "add EN 301 549 v4 tags to target-size", so counts rise on upgrade.

Tested 2026-10-17, axe-core 4.13.0 and 4.14.0 in Chrome 155 through Playwright 1.64.1, Node 24.21.0: on one fixture, 4.14.0's default run added `label-content-name-mismatch` to 4.13.0's six rules; `target-size` failed 4 nodes only when `wcag22aa` was in the tags; tags without `best-practice` dropped `heading-order` and `tabindex`.

## [ACCESS-006] axe in Playwright tests with `@axe-core/playwright`
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Playwright: Accessibility testing (v1.64.1)](https://raw.githubusercontent.com/microsoft/playwright/v1.64.1/docs/src/accessibility-testing-js.md), [@axe-core/playwright README](https://raw.githubusercontent.com/dequelabs/axe-core-npm/develop/packages/playwright/README.md), [Playwright: ARIA snapshots](https://raw.githubusercontent.com/microsoft/playwright/v1.64.1/docs/src/aria-snapshots.md), npm registry
- Related: ACCESS-005, ACCESS-008, JSTEST-010, JSTEST-011, JSTEST-012

`@axe-core/playwright` 4.14.0 (2026-10-15) depends on `axe-core ~4.14.0` and peers `playwright-core >= 1.0.0`; it "uses the major and minor version… of axe-core". Install with `npm install --save-dev @axe-core/playwright`.

```ts
import AxeBuilder from '@axe-core/playwright';
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
  .analyze();
expect(results.violations).toEqual([]);
```

- **Tags.** The docs' list stops at `wcag21aa`; add `wcag22aa` or `target-size` never runs (ACCESS-005). Tags also drop best-practice rules (`heading-order`, `region`): add `best-practice` if you want them.
- **States.** `analyze()` scans "the page *in its current state*": open each menu or dialog, `waitFor()` it, then scan with `.include(selector)`. In our test a scan with a `showModal()` dialog open reported only the dialog's problem and none of the page's.
- **Known issues.** `exclude()` turns off "*all* rules" for those elements and their descendants; prefer `disableRules([...])` or the docs' fingerprint snapshot (`{ rule: v.id, targets: v.nodes.map(n => n.target) }`), not the raw violations, which hold HTML.
- **Share setup** with a `makeAxeBuilder` fixture, and attach the full results with `testInfo.attach` to debug.

Role locators add what axe can't see: `getByRole('button', { name: 'Save' })` doesn't find a clickable `<div>` (its ARIA snapshot is `- text: Save`). `toHaveAccessibleName` and `toHaveRole` (since 1.44) and `toMatchAriaSnapshot` (since 1.49) check names and structure, not WCAG rules.

Tested 2026-10-17, `@axe-core/playwright@4.14.0` and `@playwright/test@1.64.1` with Chrome 155, Node 24.21.0.

## [ACCESS-007] Lighthouse's accessibility score: an axe subset with weights
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Lighthouse `default-config.js` at v13.5.0](https://raw.githubusercontent.com/GoogleChrome/lighthouse/v13.5.0/core/config/default-config.js), [accessibility gatherer at v13.5.0](https://raw.githubusercontent.com/GoogleChrome/lighthouse/v13.5.0/core/gather/gatherers/accessibility.js), [Accessibility scoring](https://developer.chrome.com/docs/lighthouse/accessibility/scoring), npm registry
- Related: WEB-011, ACCESS-005, ACCESS-008

Lighthouse 13.5.0 (2026-09-18) depends on `axe-core ^4.13.0`, so a fresh install gets 4.14.0. Its category text: "Automatic detection can only detect a subset of issues and does not guarantee the accessibility of your web app, so manual testing is also encouraged."

- **Which rules.** The gatherer runs axe with `runOnly` tags `wcag2a` and `wcag2aa` and switches single rules on or off: on include `target-size`, `label-content-name-mismatch`, `autocomplete-valid` and best practices such as `heading-order`; off include `duplicate-id`, `nested-interactive` and `scrollable-region-focusable`. So it differs from an axe default run both ways.
- **Score.** "a weighted average of all accessibility audits. Weighting is based on axe user impact assessments"; each audit is pass or fail. The category holds 76 audits; 10 are manual (focus traps, logical tab order, managed focus, custom control roles) and never count.
- **One state.** It audits the page as loaded; menus, dialogs and later steps aren't seen.

Tested 2026-10-17, `lighthouse@13.5.0` (`--only-categories=accessibility`, Chrome 155, Node 24.21.0) on our fixture: score 73; `target-size` failed with weight 7, `label-content-name-mismatch` failed with weight 0, and every mistake ACCESS-008 lists passed. WEB-011 has the CLI flags and the Chrome DevTools MCP route.

## [ACCESS-008] What automated accessibility checks miss
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [W3C WAI: Selecting evaluation tools](https://www.w3.org/WAI/test-evaluate/tools/selecting/), [Playwright: Accessibility testing](https://playwright.dev/docs/accessibility-testing), [axe-core README](https://raw.githubusercontent.com/dequelabs/axe-core/develop/README.md), [Deque: 57 percent study (2021-03-10)](https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/), [GOV.UK accessibility tool audit](https://alphagov.github.io/accessibility-tool-audit/)
- Related: ACCESS-005, ACCESS-007, ACCESS-011, ACCESS-015

W3C: "Web accessibility evaluation tools can not determine accessibility, they can only assist in doing so." Playwright: "automated testing cannot detect all types of WCAG violations".

**How much they find:**
- Deque (vendor, 2021-03-10): "on average, 57 percent of accessibility issues were completely covered", from "over 2,000 audits… nearly 300,000 issues". That's a share of issues found by volume, not of WCAG criteria; frequent issues such as contrast weigh most.
- GOV.UK (last updated 2018-04-13): 142 planted barriers in 13 tools; "The best performing tool in this category found 40% of the problems we introduced"; axe found 29% (30% with warnings). An old axe on rare barriers.

**Our test** (2026-10-17, axe-core 4.14.0 default and all WCAG tags, and Lighthouse 13.5.0): neither flagged
- `<div onclick>` used as a button, and `role="button"` with no `tabindex` or key handler;
- an `<input>` with only a placeholder (axe's `label` rule passed it on `non-empty-placeholder`);
- `alt="image"` (it exists, so `image-alt` passes);
- `:focus { outline: none }` on a button;
- a closed `<dialog>`'s unnamed button, until the dialog was opened.

**Only a person or a scripted walk** checks keyboard order and traps, focus after navigation, whether alt text and labels mean anything, reading order, screen-reader output, zoom to 400% and reflow, motion, and WCAG 2.2's focus-obscured, dragging and authentication criteria (ACCESS-002).

## [ACCESS-009] Native elements over ARIA: a role is a promise
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [APG: Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/), [Using ARIA (Discontinued Draft)](https://www.w3.org/TR/using-aria/), [ARIA in HTML](https://www.w3.org/TR/html-aria/), [WebAIM Million 2026](https://webaim.org/projects/million/), [Angular: accessibility best practices](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/best-practices/a11y.md)
- Related: ACCESS-010, ACCESS-011, ACCESS-008

**The rule.** APG: "No ARIA is better than Bad ARIA". `<div role="button">` "Is a promise that the author of that <div> has also incorporated JavaScript that provides the keyboard interactions expected for a button. Unlike HTML input elements, ARIA roles do not cause browsers to provide keyboard behaviors or styling." The first rule of ARIA: "If you can use a native HTML element… with the semantics and behavior you require already built in… then do so." (Using ARIA became a "W3C Discontinued Draft" on 2026-02-24; it keeps its four rules "for historical purposes" and points to the APG.) Angular's guide: "re-use these native elements directly when possible"; style a native `<button>` through an attribute-selector component.

**What goes wrong:**
- Clickable `<div>`/`<span>` instead of `<button>` or `<a href>`, with no focus or Enter/Space.
- Inputs labelled only by a placeholder; icon buttons with no name.
- `aria-hidden="true"` or `role="presentation"` on something focusable (Using ARIA's fourth rule).
- Redundant roles (`<button role="button">`): ARIA in HTML (Recommendation, 2026-08-11) calls it "unnecessary".
- `role="menu"` for site navigation (ACCESS-010).

**How common.** WebAIM Million 2026 (February 2026, automated WAVE scans): "95.9% of home pages had detected WCAG 2 failures", "an average of 56.1 errors per page"; "Home pages with ARIA present had significantly more errors (59.1 on average) than pages without ARIA (42 on average)", though "This does not necessarily mean that ARIA introduced these errors". It names "AI-assisted coding practices" as a "likely" cause of the rise, without measuring it.

## [ACCESS-010] Custom widgets: follow an APG pattern; site navigation isn't an ARIA menu
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [APG: Disclosure navigation menu example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/), [APG: Menu and menubar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/), [APG: Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/), [Angular Aria overview](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/guide/aria/overview.md), [WebAIM Million 2026](https://webaim.org/projects/million/)
- Related: ACCESS-009, NG-011, ACCESS-013

**Navigation.** APG's disclosure navigation example "does not use the menu role because it does not provide the complex functionality that assistive technologies expect in a widget that has the menu role. Typical site navigation does not need all the keyboard interactions specified by the menu and menubar pattern." Build it as a `<nav>` with a list of links, `aria-current="page"` on the current one, and `<button aria-expanded>` for each dropdown. `role="menu"` is for application menus that "behave like native operating system menus". The menubar pattern page does list a "Navigation Menubar Example" for site navigation; follow the disclosure example, which says why the menu role doesn't fit. WebAIM 2026: "5.7% of home pages had an ARIA menu… but 22% of those ARIA menus introduced accessibility barriers due to the lack of necessary ARIA menu markup and interactions."

**Real widgets** with no HTML element (tabs, tree, grid, toolbar, editable combobox, menus in an app) must implement the APG pattern's roles, states and keyboard model. APG: "Testing assistive technology interoperability is essential before using code from this guide in production"; its examples don't work around browser and screen-reader gaps.

**In Angular,** `@angular/aria` (stable since v22, NG-011) is "a collection of headless, accessible directives that implement common WAI-ARIA patterns", handling "keyboard interactions, ARIA attributes, focus management, and screen reader support": Autocomplete, Listbox, Select, Multiselect, Combobox, Menu, Menubar, Toolbar, Accordion, Tabs, Tree and Grid. Its own "When not to use" list includes simple forms, where native controls already work. `RouterLinkActive` sets `aria-current` through `ariaCurrentWhenActive="page"`.

## [ACCESS-011] Lint templates with angular-eslint's `templateAccessibility`
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [angular-eslint `template-accessibility.ts`](https://github.com/angular-eslint/angular-eslint/blob/main/packages/angular-eslint/src/configs/template-accessibility.ts), npm registry, [Angular: accessibility best practices](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/best-practices/a11y.md)
- Related: ACCESS-009, ACCESS-008, ACCESS-015

`angular-eslint` (22.6.0 latest on 2026-10-17) ships a `templateAccessibility` config that `templateRecommended` doesn't include. Its 11 rules: `alt-text`, `click-events-have-key-events`, `elements-content`, `interactive-supports-focus`, `label-has-associated-control`, `mouse-events-have-key-events`, `no-autofocus`, `no-distracting-elements`, `role-has-required-aria`, `table-scope`, `valid-aria`. With ESLint 10's flat config, `extends` needs `defineConfig` from `eslint/config`:

```js
const { defineConfig } = require('eslint/config');
const angular = require('angular-eslint');
module.exports = defineConfig([{
  files: ['**/*.html'],
  extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
}]);
```

It runs on source, before a browser, so it catches what axe can't see (ACCESS-008): handlers on non-interactive elements.

Tested 2026-10-17, `angular-eslint@22.6.0`, `eslint@10.13.0`, Node 24.21.0, on a template with 12 mistakes: 9 errors. Caught: `<div (click)>` (no key handler, not focusable), `<div role="button" (click)>`, `<span (click) tabindex="0">`, a `<label>` not tied to an input, `<img>` without alt, an empty `<button>`, `autofocus`, and `aria-expandd`. Missed: a placeholder-only input, `aria-label` that doesn't contain the visible text, `alt="image"` and `<ul role="menu">` holding links. Lint and axe overlap little; run both.

## [ACCESS-012] Focus after a client-side route change
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Angular: accessibility best practices, focus management after navigation](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/best-practices/a11y.md), `@angular/router@22.2.3` package (npm), [Helsinki accessibility model: SPAs](https://saavutettavuusmalli.hel.fi/en/toteutus-ja-ohjelmistotestaus/single-page-applications-spas-notes-on-accessibility/), [Gatsby: user testing of client-side routing (2019-07-11)](https://www.gatsbyjs.com/blog/2019-07-11-user-testing-accessible-client-routing/)
- Related: ACCESS-013, ACCESS-015, JSTEST-011, UIPAT-012, UIPAT-015

**Angular doesn't do it.** Its guide: "When using Angular routing, you should decide where page focus goes upon navigation. Use the `NavigationEnd` event from the `Router` service to know when to update focus." "You should avoid situations where focus returns to the `body` element after a route change." The router guides say nothing more, and `@angular/router@22.2.3`'s bundles contain no "focus" (grep of the npm tarball). Only the experimental `withExperimentalPlatformNavigation()` mentions native "scroll and focus restoration" ("should not be used in production").

**Where to.** No W3C page specifies it. Angular's example focuses the main heading; Gatsby's 2019 user testing with Fable Tech Labs found "Focusing on a heading was found to be the best experience" (community source, small sample); Helsinki's public-sector model suggests the top of the page or the skip link. A heading needs `tabindex="-1"` to take focus. A typed version of Angular's example (its own calls `.focus()` on an untyped `querySelector` result):

```ts
router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
  document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
});
```

Our additions, not Angular's: skip the first `NavigationEnd` (the server-rendered first load), so a fresh page keeps the browser's own start, and run it in the browser only (`isPlatformBrowser`) under SSR. Skip navigations that change only query parameters or the fragment too (a filter, sort or tab): focus stays on the control and the result is announced instead (UIPAT-012, UIPAT-015).

**Announce the title** in a polite live region: Helsinki calls it "Non-mandatory but recommended", since screen readers "do not actively monitor title changes". Angular CDK's `LiveAnnouncer` does this.

## [ACCESS-013] Modal `<dialog>`, `inert`, popover semantics and `ariaNotify()`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [MDN: `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog), [MDN: `inert`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert), [HTML spec: popover](https://html.spec.whatwg.org/multipage/popover.html), [MDN: `ariaNotify()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/ariaNotify), [WAI-ARIA 1.3 Working Draft](https://www.w3.org/TR/wai-aria-1.3/), web-features 3.43.0
- Related: CSS-008, CSS-005, ACCESS-010, ACCESS-012

**`<dialog>` with `showModal()`** makes "the rest of the page inert", is exposed as `aria-modal="true"`, focuses "the first nested focusable element" (or the `autofocus` one), closes on Esc, and the spec returns focus to the "previously focused element" on close. MDN: "this behavior is provided by the browser", so no JavaScript focus trap is needed; add a visible close button. `closedby` isn't Baseline (no Safari in web-features 3.43.0).

**`inert`** removes a subtree "from the tab order and accessibility tree" with "no visual way to tell": style it.

**A bare `<div popover>`** gets no role and no focus move unless something in it has `autofocus`. The HTML spec: "When using popover on elements without accessibility semantics, for instance the div element, authors should use the appropriate ARIA attributes to ensure the popover is accessible", and a menu's arrow keys "would still need author scripting". Place the popover right after its trigger in the DOM. Popovers are always non-modal (CSS-008).

**`ariaNotify(text)`** queues a screen-reader announcement without a live region. It is in the "W3C Working Draft 04 June 2026" of WAI-ARIA 1.3 and Baseline newly available since 2026-09-14 (Chrome 141, Firefox 150, Safari 27). MDN: only the most recent announcement is reliably spoken, and `aria-live` announcements take priority. For older browsers keep a live region (`LiveAnnouncer`).

Tested 2026-10-17, Chrome 155 through `@playwright/test@1.64.1`, Node 24.21.0: a bare `<div popover>` left focus on its trigger and had no role; with an `autofocus` link inside, focus moved in and Esc returned it; a `showModal()` dialog focused its button, exposed `dialog`, and Esc refocused the opener.

## [ACCESS-014] Motion and contrast preferences: what WCAG requires
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [WCAG 2.2: 2.2.2 and 2.3.3](https://www.w3.org/TR/WCAG22/), [Understanding 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), [Technique C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html), [Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [MDN: `prefers-contrast`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-contrast), [MDN: `forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/forced-colors), web-features 3.43.0
- Related: CSS-009, CSS-011, DESIGN-007, DESIGN-017

- **2.2.2 Pause, Stop, Hide (A):** moving, blinking or scrolling content that starts automatically, "lasts more than five seconds" and sits beside other content needs "a mechanism for the user to pause, stop, or hide it". Its sufficient techniques are controls (G4, G186, G191); the Understanding page doesn't mention `prefers-reduced-motion`, so the media query alone doesn't meet it.
- **2.3.3 Animation from Interactions (AAA):** "Motion animation triggered by interaction can be disabled, unless the animation is essential". Sufficient: "C39: Using the CSS prefers-reduced-motion query to prevent motion" (and SCR40 in JavaScript). Parallax and large scaling or panning are the vestibular triggers.
- **`prefers-contrast`** detects a request for "a lower or higher contrast" (`more`, `less`, `custom`); **`forced-colors`** detects modes like "Windows High Contrast mode", where "`box-shadow` is forced to 'none'", so focus rings and borders built from shadows vanish: use `outline` or a transparent border. Forced colours follow the element, not the role: "adding `role="button"` to a `div` will **not** cause an element's color to be forced to `ButtonText`".

web-features 3.43.0: `prefers-reduced-motion` widely available since 2022-07-15, `prefers-contrast` since 2024-11-30, `forced-colors` since 2025-03-12, `:focus-visible` since 2024-09-14. Anthropic's frontend-design skill lists "reduced motion respected" and "visible keyboard focus" in its quality floor (DESIGN-007).

## [ACCESS-015] An agent's accessibility check, and what a human must still do
- Type: recommendation
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-17
- Sources: [Angular: best-practices.md for AI](https://angular.dev/assets/context/best-practices.md), [frontend-design SKILL.md](https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [Playwright: Accessibility testing](https://playwright.dev/docs/accessibility-testing), [W3C WAI: Selecting evaluation tools](https://www.w3.org/WAI/test-evaluate/tools/selecting/), [arXiv 2503.15885](https://arxiv.org/abs/2503.15885)
- Related: FLOW-011, REPO-021, ACCESS-006, ACCESS-008, ACCESS-011, DESIGN-007

Angular's rules file for AI tools asks for code that "MUST pass all AXE checks" and "MUST follow all WCAG AA minimums". Passing axe is the floor, not the proof (ACCESS-008). Our synthesis of the entries above, cheapest first:

1. **Lint** templates with `templateAccessibility` in the repo's verify command (ACCESS-011).
2. **Locate by role** in tests and browser checks (`getByRole`), so a fake button fails at once (ACCESS-006).
3. **Scan with axe** on the WCAG 2.2 AA tags (`wcag2a` … `wcag22aa`), on each changed page and each state (menu open, dialog open, error shown), in a subagent that returns rule IDs and selectors, not screenshots (REPO-021). Lighthouse is a coarser substitute (ACCESS-007).
4. **Walk by keyboard:** Tab through the change, check focus is visible and not hidden by sticky content, Enter and Space activate, Esc closes, focus lands sensibly after navigation (ACCESS-012).
5. **Report what wasn't checked.** End with a list for a person: alt text and label meaning, reading and focus order, screen-reader output (NVDA or VoiceOver), zoom and reflow, motion. W3C: tools "can only assist".

Studies of LLM-written UI (arXiv 2503.15885, GPT-4o and Qwen2.5, 2025-03-20) found models good at contrast and alt text but struggling "with complex issues such as ARIA attributes", which matches where lint and the APG matter most (ACCESS-009, ACCESS-010).

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-17 against `main` of osrs-tracker-web and freek-mencke-web (both Angular 22 with SSR and angular-eslint 22.6.0's `templateRecommended` only).

1. Done 2026-10-18: `templateAccessibility` is on in both Angular apps' ESLint config (osrs-tracker/osrs-tracker-web#355, FreekMencke/freek-mencke-web#20; ACCESS-011, ACCESS-009).
2. Done 2026-10-18: osrs-tracker-web moves focus after route changes (`src/app/core/routing/route-focus.ts`, osrs-tracker/osrs-tracker-web#355; ACCESS-012).
3. Done 2026-10-18: osrs-tracker-web's browser-checker reports a keyboard walk, with an axe scan (`npm run a11y`) run by the caller (osrs-tracker/osrs-tracker-web#355); freek-mencke-web got an axe scan script and a keyboard walk (FreekMencke/freek-mencke-web#20; ACCESS-006, ACCESS-015, ACCESS-008).
4. Done 2026-10-18: `angular-conventions` has accessibility house rules (FreekMencke/claude-skills#82, FreekMencke/claude-skills#88; ACCESS-009, ACCESS-010, ACCESS-012, ACCESS-013).
5. **Won't do: EAA compliance work beyond WCAG 2.2 AA** (ACCESS-003, ACCESS-004). Neither site concludes consumer contracts, so neither is an e-commerce service in Art. 3(30)'s sense (our reading, not legal advice); WCAG 2.2 AA is the target anyway. Revisit if a site starts selling to consumers.
6. **Won't do now: a Playwright Test suite just for axe** (ACCESS-006, JSTEST recommendation 4): the script in 3 covers it at less cost.

## Open questions

- **When is EN 301 549 v4.1.1 cited in the Official Journal?** Deque says around 2026-11-30, Ireland's NDA 2026-12-16; no implementing decision found (web search and the Publications Office; EUR-Lex blocked curl). Re-check in December 2026 (ACCESS-004).
- **Is any EN 301 549 version cited under the EAA today?** Only a third-party blog (2026-07-20) says none is; not confirmed in the Official Journal.
- **Does a focused element keep focus across Angular hydration**, and does event replay restore it? The hydration guide covers event replay only; not tested (ACCESS-012).
- **Does `cdkTrapFocus` still add anything over a native modal `<dialog>`?** Angular's guide still recommends it for "modal dialogs" without naming `<dialog>` (ACCESS-013).
- **Does `ariaNotify()` alone satisfy WCAG 4.1.3 Status Messages?** Neither MDN nor the ARIA draft says (ACCESS-013).
- **`[aria-label]` against `[attr.aria-label]` in Angular 22:** the guide shows plain `[aria-label]`, and the CHANGELOG changed how ARIA property bindings render in 20.2.0 and 20.3.3; not tested.
- **Deque's axe MCP server** (`dequelabs/axe-mcp-server-public`, 8 stars on 2026-10-17): licence, account requirement and tools not checked.
