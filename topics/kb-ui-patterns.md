# UI patterns: states, feedback timing, forms, URL state and interface copy

Prefix `UIPAT`. This file covers the usability work agents most often get wrong when building an interface, as of 2026-10-23: the states every data view needs (empty, loading, error, partial, offline, long content), how long a wait may be before it needs feedback and which indicator to use, announcing state changes without losing focus, optimistic updates, form labels, validation timing, error summaries, disabled buttons and `autocomplete`, which UI state belongs in the URL, error messages and button labels, when a native element is enough, and how an agent forces each state in Playwright. How a UI looks is in `kb-design.md`; accessibility rules and tools are in `kb-accessibility.md` (ACCESS-008 to ACCESS-015); Playwright itself is in `kb-js-testing.md` (JSTEST-010 to JSTEST-012). Each entry says which usability problem a rule prevents and whether checking it is measurable (a test or lint can decide it) or a judgement call.

The rules come from design systems' guidance, NN/g's expert articles and two published usability studies (Baymard, Wroblewski); none come from user testing of our own. Several design systems disagree; the entries say which convention is GOV.UK's (built for transactional government forms) and which hold across sources.

Research basis:
- Researched 2026-10-23 (FreekMencke/claude-kb#255, part of roadmap #251) by an Opus 5.5 lead with two Sonnet 5.5 readers (forms and copy: 138k tokens, 41 tool calls, 5.0 min; states and URL state: 116k tokens, 38 tool calls, 4.7 min), one Sonnet 5.5 refuter (99k tokens, 29 tool calls, 3.6 min) and a review panel of a UX/UI designer (85k tokens, 7 tool calls, 1.4 min) and an accessibility specialist (94k tokens, 11 tool calls, 2.7 min). Every quote below was re-checked by the lead against the raw files.
- Design systems read as raw source: GOV.UK Design System (`alphagov/govuk-design-system` at `0049002`, 2026-10-22) and GOV.UK Frontend templates (`alphagov/govuk-frontend` at `76a8e69`), Carbon (`carbon-design-system/carbon-website` at `5e9cd1d`), Shopify Polaris (`Shopify/polaris`, archived; last push 2026-09-11), Primer React (`primer/react` at `3a71047`, `@primer/react` 38.42.0), WAI-ARIA APG (`w3c/aria-practices` at `0f765e4`, 2026-09-30). Atlassian, NN/g, Baymard and W3C WAI pages as server-rendered HTML with tags stripped. Material 3 couldn't be read (its pages render in JavaScript; see Open questions).
- Frameworks: Angular docs at tag `v22.2.3` (`adev/src/content/guide/forms/signals/`, `guide/signals/resource.md`, `guide/templates/defer.md`, `guide/routing/`), react.dev and TanStack Query docs from their repos' `main`, MDN from `mdn/content`. Specs: WCAG 2.2 and its Understanding pages, the WHATWG HTML Living Standard (last updated 2026-10-22). Baseline data from `web-features@3.44.0`.
- Vercel's Web Interface Guidelines (`vercel-labs/web-interface-guidelines` at `434b7f9`) appear as supporting evidence only; `kb-ui-review.md` (#254) owns that source.
- Tested on Node 24.21.0 (WSL2) with `@playwright/test@1.64.1` (`npm install --ignore-scripts`) driving Google Chrome 155 against a scratch page (UIPAT-013, UIPAT-015). No screen reader was run: announcement behaviour comes from MDN, WCAG and the design systems' text, not from a test.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which states does a data view need? | At least loading, empty, error and loaded; also partial (some sources failed), offline, reloading with stale data, and very long or very short content. Never show "No items" while the request is still running. | UIPAT-001, UIPAT-004, UIPAT-005 |
| How long can a wait be before the user needs feedback? | NN/g: under 0.1 s feels instant; up to 1 s keeps the flow of thought with no special feedback; over 1 s show an indicator; over 10 s a percent-done indicator and a way to stop. Atlassian starts spinners at 1 s, Carbon at 3 s. Our default: the pressed control reacts at once, a loader after about 1 s. | UIPAT-002 |
| Skeleton or spinner, and how do I stop a loader flashing? | Skeleton for a page or container whose layout is known, matching the final size; spinner for a short wait in one module; a progress bar past 10 s or for an upload. Delay the loader: Primer's Spinner `delay` is 300 ms (`'short'`) or 1000 ms; Angular has `@loading (after …; minimum …)`. No design system read gives a minimum display time. | UIPAT-003 |
| What goes in an empty state? | Why it's empty and the next step: one primary action for first use, "adjust your search or filters" for no results. Replace the whole table, headers included. | UIPAT-004 |
| How do I show that part of a view failed or the user is offline? | An error in the failed section with a retry, the rest of the view kept; offline, say what still works and what happens on reconnect. Keep focus on a control that still exists. | UIPAT-005, UIPAT-015 |
| How should loading, results and errors be announced to screen readers? | One `role="status"` element that is always in the page; change only its text ("Loading…", "12 results", "No results"). `role="alert"` for a blocking error. Never put the list itself in a live region. | UIPAT-015 |
| When should I update the UI optimistically? | When success is likely and the change is reversible; roll back and show an error that stays on failure. React's `useOptimistic` rolls back on its own; TanStack Query's `variables` route needs no rollback code. | UIPAT-006 |
| Placeholder or label? | A visible label above the field; hints as text outside the field. GOV.UK, NN/g and Atlassian rule out placeholders for hints and examples; W3C WAI, Polaris and Vercel allow an example beside a visible label. axe passes a placeholder-only field. | UIPAT-007 |
| When should a form validate? | Not before the user has finished the value, and never flag an empty field just because focus passed through it. Then: on leaving a filled field or on a complete value (Baymard, NN/g, Polaris), or on submit only (GOV.UK). On submit, a summary or focus on the first error, with each error tied to its field. | UIPAT-008 |
| Should the submit button be disabled until the form is valid? | By default no: GOV.UK, Atlassian and Vercel say keep it enabled and let validation explain what's missing. Mark it busy during the request with `aria-disabled` and a guard, not `disabled`, which drops focus. Angular's signal forms guide shows the anti-pattern. | UIPAT-009 |
| Which `autocomplete` values matter? | `name`/`given-name`/`family-name`, `email`, `tel`, the address tokens, `postal-code`, `bday-*`, `username`, `new-password`/`current-password`, `one-time-code`. WCAG 1.3.5 (AA) requires them on fields about the user; axe checks only that a present value is valid. | UIPAT-010 |
| How do I write an error message? | Say what's wrong and how to fix it in the field's own words ("Enter your date of birth"); no "invalid" or "oops"; the same text in the summary and next to the field; not by colour alone. | UIPAT-011 |
| Which UI state goes in the URL? | Filters, sort, search, pagination and tabs used as views, so refresh, share and Back work; Baymard: Back should undo the last applied filter. In Angular, set `queryParamsHandling: 'merge'`, reset the page on a filter change, and don't move focus on query-only navigations. | UIPAT-012 |
| How does an agent check loading, error and empty states? | Mock the API with Playwright's `page.route`: hold the response for loading, `fulfill({ json: [] })` for empty, `status: 500` for error, `abort()` for a network failure. In Chrome a mocked route still answers while `setOffline(true)` is on. | UIPAT-013 |
| Native element or custom widget? | Native when one exists (`<button>`, `<a href>`, `<select>`, `<details>`, `<dialog>`, `<input type=…>`); an APG pattern, or `@angular/aria`, for tabs, combobox, listbox, menus, tree and grid. | UIPAT-014 |

## Index

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

## [UIPAT-001] Every data view has more states than loaded: name them
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [NN/g: Designing empty states in complex applications](https://www.nngroup.com/articles/empty-state-interface-design/), [Carbon: Empty states pattern](https://carbondesignsystem.com/patterns/empty-states-pattern/), [Angular: Async reactivity with resources (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/signals/resource.md), [MDN: min-width](https://developer.mozilla.org/en-US/docs/Web/CSS/min-width), [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)
- Related: UIPAT-003, UIPAT-004, UIPAT-005, UIPAT-013, UIPAT-015, DESIGN-009

**Prevents** a blank or misleading view. NN/g argues "Totally empty states cause confusion about how and whether the system is working… Is content still loading? Did an error occur?", and that "Inaccurate system-status messages for empty states are particularly harmful", such as "declaring that there are no items to display, only to replace it with content after the process is completed".

**The states,** our list from this file's sources: loading, loaded, empty (first use, no results, cleared: UIPAT-004), error, partial (UIPAT-005), offline, reloading with the previous data still shown, and long or short content. Vercel, as support: "Empty, sparse, dense, & error states."

**In Angular,** model the state, not three booleans. A `resource`/`httpResource` has a `status()` of `'idle'`, `'loading'`, `'reloading'` ("Previous value" kept), `'resolved'`, `'error'` or `'local'`; `hasValue()` guards `value()`, which throws in the error state. `@switch` on it so each branch must be written. Under SSR, send the resolved state or a static message in the HTML, never only a skeleton that needs JavaScript to resolve.

**Long content** (no design-system rule found; ours): wrap by default (`overflow-wrap: anywhere`); give flex and grid children `min-width: 0`, since their automatic minimum follows their content (MDN); truncate only where the full text stays reachable; page or virtualise long lists.

**Check:** measurable. Force each state (UIPAT-013) and assert what shows, and that the empty message is absent while loading. Whether each state helps is judgement.

## [UIPAT-002] Response-time limits: 0.1 s, 1 s and 10 s, and what to show at each
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [NN/g: Response times, the 3 important limits](https://www.nngroup.com/articles/response-times-3-important-limits/), [NN/g: Progress indicators](https://www.nngroup.com/articles/progress-indicators/), [web.dev: RAIL](https://web.dev/articles/rail), [Atlassian: Spinner](https://atlassian.design/components/spinner/usage), [Carbon: Loading (usage)](https://raw.githubusercontent.com/carbon-design-system/carbon-website/main/src/pages/components/loading/usage.mdx), [Polaris: Loading (legacy pattern)](https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/patterns-legacy/loading.mdx)
- Related: UIPAT-003, UIPAT-006, UIPAT-009, WEBPERF-001

**Prevents** users thinking a click did nothing (and clicking again), or losing track during a long wait.

NN/g (1993, modified 2024-01-31):
- "0.1 second is about the limit for having the user feel that the system is reacting instantaneously, meaning that no special feedback is necessary except to display the result."
- "1.0 second is about the limit for the user's flow of thought to stay uninterrupted… Normally, no special feedback is necessary during delays of more than 0.1 but less than 1.0 second".
- "10 seconds is about the limit for keeping the user's attention focused on the dialogue." "Anything slower than 10 seconds needs a percent-done indicator as well as a clearly signposted way for the user to interrupt the operation."

Its progress-indicator article: "Use a progress indicator for any action that takes longer than about 1.0 second", and "use a looped indicator for delays of 2–9 seconds and a percent-done indicator for delays of 10 seconds or more". Google's RAIL model restates the bands ("users feel like the result is immediate" within 100 ms; "Beyond 1000 milliseconds (1 second), users lose focus"). INP's 200 ms "good" (WEBPERF-001) measures input to next paint, not how long data may take.

**Spinner thresholds:** Atlassian, "Only show a spinner if the expected wait time is more than a second"; Carbon, "Use a loading indicator if the expected wait time exceeds three seconds".

**Our default for agents:** the pressed control responds within 0.1 s (pressed or busy state, label kept: UIPAT-009); a loader for the data after about 1 s (UIPAT-003); percent-done and Cancel past 10 s.

**Check:** measurable with timing in a test (UIPAT-013 holds a response).

## [UIPAT-003] Skeleton, spinner or progress bar, and how to avoid a flashing loader
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [NN/g: Skeleton screens 101](https://www.nngroup.com/articles/skeleton-screens/), [Atlassian: Skeleton](https://atlassian.design/components/skeleton/usage), [Carbon: Loading pattern](https://carbondesignsystem.com/patterns/loading-pattern/), [Primer React Spinner source (`3a71047`)](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Spinner/Spinner.tsx), [Angular: `@defer` (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/templates/defer.md), [React: Suspense](https://react.dev/reference/react/Suspense), [Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)
- Related: UIPAT-001, UIPAT-002, UIPAT-015, ACCESS-014

**Prevents** layout shift when content arrives, and a loader that flashes on a fast response.

| Indicator | Use for | Source |
|---|---|---|
| Nothing | Under about 1 s | NN/g: "skeleton screens or spinners aren't necessary" |
| Skeleton | A page or container whose layout is known: "Match the size and shape of the expected content so the page does not jump" | Atlassian; Carbon: never for "toast notifications, overflow menus, dropdown items, modals, and loaders" |
| Spinner | 2–10 s in one module, or unknown shape | NN/g: "best used on a single module" |
| Progress bar | Over 10 s, or an upload or conversion | NN/g |

NN/g keeps skeletons "exclusively for full-page loads"; Atlassian, Carbon and Polaris use them for sections: follow the design system in use.

**Flicker.** Primer's Spinner: "Set to `true` to delay by 1000ms, `'short'` to delay by 300ms" (a code comment). Angular's `@defer`: `@loading (after 100ms; minimum 1s)` "to prevent fast flickering" (example values, for deferred code). React "reveals suspended content at most once every 300ms". No minimum display time found; Vercel's "~300–500 ms" is a community figure. On reload, keep the old data (`'reloading'`).

**Motion.** Under `prefers-reduced-motion: reduce`, show the skeleton static (`animation: none`). WCAG 2.2.2 (A) covers motion over 5 s beside other content; a preload animation is essential only "if interaction cannot occur during that phase for all users" (Understanding, Note 4). Atlassian keeps its small spinner turning ("a frozen spinner can make it seem like the process has stopped"): its rule, not WCAG's.

**Check:** layout shift is measurable; the choice is judgement.

## [UIPAT-004] Empty states: first use, no results and cleared
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [NN/g: Designing empty states](https://www.nngroup.com/articles/empty-state-interface-design/), [Carbon: Empty states pattern](https://raw.githubusercontent.com/carbon-design-system/carbon-website/main/src/pages/patterns/empty-states-pattern/index.mdx), [Atlassian: Empty state](https://atlassian.design/components/empty-state/usage), [Atlassian: Writing empty states](https://atlassian.design/foundations/content/designing-messages/empty-state), [Polaris: Empty state](https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/layout-and-structure/empty-state.mdx)
- Related: UIPAT-001, UIPAT-011, UIPAT-015, DESIGN-009

**Prevents** a dead end: the user can't tell why nothing shows or what to do. NN/g's three guidelines: use empty states "to Communicate System Status", "to Provide Learning Cues" and "to Provide Direct Pathways for Key Tasks"; "Do not default to totally empty states."

| Kind | Say | Action |
|---|---|---|
| First use ("blank slate" to Atlassian) | What will appear here and how to add it | One primary action: Polaris, "Use only one primary call-to-action button" |
| No results (search, filters) | Nothing matched | Carbon: "suggest adjusting the search or filters"; offer to clear them |
| Cleared (inbox zero) | Done | Atlassian: "a more celebratory tone" |
| Can't show (permissions, failure) | Why, and how to get access | Carbon's "Error management empty states"; UIPAT-005 |

**Replace, don't overlay.** Carbon: "an empty state for a table would replace the table and the column headers and footer should not be present", so a screen reader doesn't read an empty table first.

**Copy:** Polaris, "Be encouraging and never make merchants feel unsuccessful or guilty"; Atlassian, "Include the reason for the empty state and where they can go next… one to two sentences". NN/g's example: "There are no records to display for the selected date range". Terms differ: Atlassian's "empty state" is the cleared screen; Polaris's is first use.

**Announce** "No results" after a search or filter change through the status region (UIPAT-015); a first-load empty state needs no announcement.

**Check:** a message and an action are measurable; tone is judgement.

## [UIPAT-005] Error, partial and offline states: keep the view, offer a way out
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Atlassian: Section message](https://atlassian.design/components/section-message/usage), [Carbon: Empty states pattern (error management)](https://carbondesignsystem.com/patterns/empty-states-pattern/), [web.dev: Offline UX design guidelines](https://web.dev/articles/offline-ux-design-guidelines), [NN/g: Error-message guidelines](https://www.nngroup.com/articles/error-message-guidelines/), [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)
- Related: UIPAT-001, UIPAT-011, UIPAT-013, UIPAT-015

**Prevents** one failed request blanking a whole page, and messages that leave no next step.

- **Scope the error to what failed.** Atlassian's section message covers "a section of a screen", including "connectivity or authentication issues"; "always try to avoid dead ends and provide people with information on how to proceed". Keep the sections that loaded.
- **Offer retry** where retrying can help, and keep the user's input (NN/g: "Preserve the user's input"). Keep the Retry button mounted while it retries, or move focus deliberately: replacing the view sent focus to `<body>` in our test (UIPAT-015).
- **Don't blame.** Atlassian: "'we're having trouble connecting' rather than 'you're having connection issues.'"
- **Offline** (web.dev, 2016, updated 2022): "Inform the user of both the actions they can still take when they have a network failure and the current state of the application"; "Clearly inform the user when a change in state occurs as soon as possible."
- **Not an error state:** GOV.UK says not to use error messages "to tell a user that they are not eligible or do not have permission"; Carbon treats permissions as an empty state with "steps or process to request access".

Announce a failed section through the status region; `role="alert"` is for an error that blocks the task (UIPAT-015). Vercel, as support: "No dead ends."

**Check:** measurable that an error, a retry and the other sections are present after a forced failure (UIPAT-013), and that focus isn't on `<body>` after Retry. Carbon's error-state pattern is "currently being planned".

## [UIPAT-006] Optimistic updates and rollback
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [React: useOptimistic](https://react.dev/reference/react/useOptimistic), [TanStack Query: Optimistic updates (Angular)](https://tanstack.com/query/latest/docs/framework/angular/guides/optimistic-updates), [TanStack Query: Optimistic updates (React, the prose source)](https://raw.githubusercontent.com/TanStack/query/main/docs/framework/react/guides/optimistic-updates.md), [Angular: resources (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/signals/resource.md), [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)
- Related: UIPAT-002, UIPAT-005, UIPAT-015

**Prevents** a wait on every small action (a like, a toggle, reordering) without hiding failures. No NN/g or design-system page read says when to use it; our rule: when success is likely and the change is cheap to undo, never for payments or legal submissions (WCAG 3.3.4 wants those reversible, checked or confirmed). Vercel, as support: "Update the UI immediately when success is likely… On failure, show an error & roll back or provide Undo."

**React `useOptimistic`:** "Optimistic state only renders while an Action is in progress"; if the Action throws, "the UI shows what it showed before the optimistic update. You can catch the error to show a message to the user."

**TanStack Query** (Angular adapter `@tanstack/angular-query-experimental`, 5.104.5 by `npm view @tanstack/angular-query-experimental version`) offers two routes:
- Render the pending mutation's `variables` (e.g. a faded row): "you don't need to handle rollbacks at all"; on error "variables are not cleared", so you can show a retry.
- Write to the cache in `onMutate`: cancel outgoing refetches, snapshot, roll back in `onError`, refetch in `onSettled`. Use it when several places show the data.

**Angular without a library:** `resource.set()`/`update()` puts it in `'local'` status; restoring the old value on failure is yours.

**On rollback:** the error must stay until dismissed (an auto-hiding toast fails WCAG 2.2.1 unless the user can extend it), and if the rolled-back row held focus, move focus somewhere that exists (UIPAT-015).

**Check:** measurable: fulfil the mutation with a 500 (UIPAT-013) and assert the item returns and the error shows.

## [UIPAT-007] Form labels, hints and placeholders
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [GOV.UK: Text input](https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/components/text-input/index.md), [GOV.UK: Question pages](https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/patterns/question-pages/index.md), [NN/g: Placeholders in form fields are harmful](https://www.nngroup.com/articles/form-design-placeholders/), [W3C WAI forms tutorial: Instructions](https://www.w3.org/WAI/tutorials/forms/instructions/), [Atlassian: Form](https://atlassian.design/components/form/usage), [Polaris: Text field](https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/selection-and-input/text-field.mdx), [axe-core 4.14.0 `label` rule](https://raw.githubusercontent.com/dequelabs/axe-core/v4.14.0/lib/rules/label.json), [NN/g: Marking required fields](https://www.nngroup.com/articles/required-fields/)
- Related: ACCESS-008, ACCESS-009, DESIGN-017, UIPAT-008, UIPAT-010

**Prevents** users forgetting what a field wants once they type, being unable to check answers, and missing hints. NN/g: placeholder text "makes it difficult for people to remember what information belongs in a field, and to check for and fix errors".

**Rules:**
- A visible `<label>` above every field (WCAG 3.3.2, 4.1.2). GOV.UK: "short, direct and written in sentence case. Do not use colons".
- Hints as text under the label, tied with `aria-describedby`. GOV.UK: "a single short sentence, without any full stops. Do not use links in hint text."
- No placeholder as the label. WCAG doesn't ban placeholders; the case against them is research and contrast. GOV.UK: "Do not use placeholder text in place of a label, or for hints or examples, as: it vanishes when the user starts typing… not all screen readers read it out; its browser default styles often do not meet WCAG 2.2 success criterion 1.4.3". A placeholder you keep needs 4.5:1 (DESIGN-017).
- Don't rely on a prefix or suffix alone: "put 'Cost, in pounds' in the input label" (GOV.UK).

**Where sources disagree:**
- Examples in the placeholder: W3C WAI's tutorial shows a label plus `placeholder="joe@example.com"` ("placeholder text is not a replacement for labels"); Polaris and Vercel allow it too. GOV.UK, Atlassian and NN/g don't. We take the stricter rule: an example in hint text doesn't vanish or fail contrast.
- Required fields: GOV.UK "Never mark mandatory fields with asterisks" and marks "(optional)"; Atlassian uses "a red asterisk"; NN/g says "mark all the required fields". Pick one per product, and keep `required` or `aria-required="true"` so the state is programmatic.

**Check:** axe 4.14's `label` rule accepts `non-empty-placeholder`, so a placeholder-only field passes axe (ACCESS-008); a lint or role check must catch it. Wording is judgement.

## [UIPAT-008] When to validate, and the error summary on submit
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Baymard: Inline form validation (2024-01-09)](https://baymard.com/blog/inline-form-validation), [Wroblewski: Inline validation in web forms (A List Apart, 2009)](https://alistapart.com/article/inline-validation-in-web-forms/), [NN/g: Reporting errors in forms](https://www.nngroup.com/articles/errors-forms-design-guidelines/), [GOV.UK: Validation pattern](https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/patterns/validation/index.md), [GOV.UK: Error summary](https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/components/error-summary/index.md), [GOV.UK Frontend input template (`76a8e69`)](https://raw.githubusercontent.com/alphagov/govuk-frontend/76a8e69/packages/govuk-frontend/src/govuk/components/input/template.njk), [Polaris: Text field](https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/selection-and-input/text-field.mdx), [Angular signal forms: submission (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/forms/signals/form-submission.md)
- Related: UIPAT-007, UIPAT-009, UIPAT-011, UIPAT-015, ACCESS-002

**Prevents** errors before the user had a chance to answer ("a hostile pattern", NN/g), and errors the user can't find or hear after submitting.

**Timing.** Baymard: "Avoid Premature Validation"; Wroblewski's 2009 study: "give feedback after the user finishes providing an answer". NN/g and Polaris: check on leaving a filled field, and don't treat "exploratory interactions" as errors. GOV.UK's convention (from service experience, no study cited): "Do not validate when the user moves away from a field"; submit only. Default for agents: check on leaving a field that has a value, re-check as they type once it shows an error, all on submit.

**On submit:** each error next to its field, plus a summary or focus on the first error; keep every answer; validate on the server too.
- Tie each error to its field: `aria-describedby` with the hint id then the error id (as GOV.UK Frontend's template does), and `aria-invalid="true"` (WCAG 3.3.1, 1.3.1).
- The summary takes focus (`tabindex="-1"`) and its links move focus to the field in a click handler: a bare `#id` link breaks under Angular's `<base href>`. Add `scroll-margin-top` under a sticky header (2.4.11).
- GOV.UK's own convention: heading "There is a problem", "Error: " before the `<title>`, `novalidate` and no `required`.

**Angular 22 signal forms:** errors on `touched() && invalid()`; `submit()` marks fields touched and skips an invalid action; `onInvalid` can call `field().errorSummary()[0]?.fieldTree().focusBoundControl()`. Whether it sets `aria-invalid` is undocumented: test it. CSS `:user-invalid` is widely available since 2026-05-02.

**Check:** measurable (UIPAT-013): pass through an empty field, assert no error; submit, assert focus and the field's accessible description.

## [UIPAT-009] Don't disable the submit button until the form is valid
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [GOV.UK: Button](https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/components/button/index.md), [Atlassian: Button](https://atlassian.design/components/button/usage), [Atlassian: Form](https://atlassian.design/components/form/usage), [NN/g: Button states](https://www.nngroup.com/articles/button-states-communicate-interaction/), [Government of Alberta: Disabled button with a required field](https://v2.design.alberta.ca/examples/disabled-button-with-a-required-field), [Angular signal forms: field state management (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/forms/signals/field-state-management.md), [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)
- Related: UIPAT-002, UIPAT-008, UIPAT-015, ACCESS-008

**Prevents** a dead button with no explanation. Atlassian: "Disabled buttons don't explain why the button isn't usable. They also aren't reachable in the tab order", and "Never disable a submit button, even if all of the required fields aren't filled in." GOV.UK: "avoid them if possible. Only use disabled buttons if research shows it makes the user interface easier to understand." Vercel: "Don't pre-disable submit." A minority disagrees: the Government of Alberta's design system says "Disable a submit button until required form fields are completed".

**Default:** keep submit enabled; on click, validate and show the errors (UIPAT-008).

**During the request:** mark the button busy and refuse a second submit. Prefer `aria-disabled="true"` plus a guard in the handler (it doesn't block clicks or Enter by itself) and a "Saving…" label: setting `disabled` on the focused button sent focus to `<body>` in our test (UIPAT-015). Angular's `submitting()` is true while the action runs. GOV.UK's `data-prevent-double-click` exists, but "you should also think about the issue server-side" (an idempotency key).

**Agents copy the anti-pattern from framework docs:** Angular's signal forms guide shows `<button [disabled]="!loginForm().valid()">Sign In</button>` as an example of reading form state. NN/g describes a disabled submit as normal and suggests `aria-disabled` to keep it focusable (its advice; no assistive-technology test cited). If a design must block submit, use `aria-disabled` with the reason next to the button in text linked by `aria-describedby`.

**Check:** measurable: a submit button disabled before any submit attempt.

## [UIPAT-010] `autocomplete` tokens and input types
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [HTML Living Standard: Autofill](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill), [WCAG 2.2: 1.3.5 Identify Input Purpose](https://www.w3.org/TR/WCAG22/#identify-input-purpose), [GOV.UK: Text input](https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/components/text-input/index.md), [GOV.UK: Password input](https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/components/password-input/index.md), [axe-core 4.14.0 rule descriptions](https://raw.githubusercontent.com/dequelabs/axe-core/v4.14.0/doc/rule-descriptions.md)
- Related: UIPAT-007, ACCESS-002, ACCESS-005

**Prevents** retyping what the browser already knows, wrong keyboards on phones, and password managers saving the wrong field.

**WCAG 1.3.5 (AA):** "The purpose of each input field collecting information about the user can be programmatically determined" when it's one of WCAG's listed input purposes. Fields about someone else (a gift recipient) are out of its scope. GOV.UK: "If you are working in production and there is a relevant input purpose, you'll need to use the `autocomplete` attribute".

| Field | Token |
|---|---|
| Name | `name`; or `given-name`, `family-name` |
| Email, phone | `email`, `tel` ("including country code") |
| Address | `street-address` (one textarea) or `address-line1`, `address-line2`, `address-level2` (town), `address-level1` (region), `postal-code`, `country` |
| Date of birth, three fields | `bday-day`, `bday-month`, `bday-year` |
| Sign-in | `username`, `current-password` |
| Sign-up, change password | `new-password` |
| SMS or app code | `one-time-code` |

GOV.UK: "Many browsers will autofill password inputs, even when the `autocomplete` attribute is missing or set to `off`." Use `one-time-code` on code fields, with `inputmode="numeric"` as GOV.UK's example does. Search boxes and fields not about the user need no token.

**Input types:** GOV.UK: "Do not use `<input type="number">` unless your user research shows that there's a need for it"; use `inputmode="numeric"` or `"decimal"`. "Do not disable copy and paste" (on password and code fields, WCAG 3.3.8 needs it). `spellcheck="false"` for emails, names and reference numbers.

**Check:** axe's `autocomplete-valid` (tags `wcag21aa`, `wcag135`) checks that a present value "is correct and suitable"; it can't tell that an email field lacks one. Matching tokens to fields is a review step.

## [UIPAT-011] Error messages and button labels
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [GOV.UK: Error message](https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/components/error-message/index.md), [GOV.UK: Button](https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/components/button/index.md), [NN/g: Error-message guidelines](https://www.nngroup.com/articles/error-message-guidelines/), [Polaris: Error messages](https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/content/error-messages.mdx), [Polaris: Button](https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/actions/button.mdx), [Atlassian: Error messages](https://atlassian.design/foundations/content/designing-messages/error-messages), [Atlassian: Button](https://atlassian.design/components/button/usage), [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)
- Related: UIPAT-004, UIPAT-005, UIPAT-008, WRITE-006

**Prevents** messages that say something failed but not how to fix it (WCAG 3.3.3), and buttons whose result is a guess.

**Error messages,** where GOV.UK, NN/g, Polaris and Atlassian agree:
- Say what's wrong and how to fix it. GOV.UK's templates: empty, "Enter your date of birth"; too long, "Address line 1 must be 35 characters or less"; format, "Hours worked a week must be a number, like 30".
- Use the field's own words, and "the same message next to the field and in the Error summary".
- Be specific: not "An error occurred", "This field is required" or "Select an option" (GOV.UK).
- Avoid "invalid" (GOV.UK, NN/g, Polaris), "oops" and blame ("you forgot").
- Not by colour alone (WCAG 1.4.1): text, and an icon or "Error:" prefix.

**Where they differ:** GOV.UK and Atlassian drop "please" and "sorry"; Atlassian prefers "we" to "you"; Polaris prefers the passive for inline errors ("Store name is required", not "You didn't enter a store name"), where GOV.UK uses an instruction ("Enter…"). Default for agents: GOV.UK's instruction style, the most complete set of templates. Vercel's "Something went wrong—try again or contact support" sits in its "Vercel-specific" section.

**Button labels:** a verb naming the result, in sentence case. GOV.UK's set: "Start now", "Continue" (nothing saved) or "Save and continue", "Confirm and send", "Sign out"; "'Continue', not 'Next'" on question pages. Atlassian: "Start with the verb and specify what is being acted on"; not "OK". Polaris: {verb}+{noun} ("Create order") except common actions ("Save", "Cancel"). A busy label keeps the verb ("Saving…").

**Check:** a lint can flag banned words, "Submit"/"OK"/"Click here" labels and summary text that differs from the inline text; clarity is judgement.

## [UIPAT-012] URL state: filters, sort, tabs and pagination
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Baymard: Back button expectations (2020-07-20)](https://baymard.com/blog/back-button-expectations), [Angular: Read route state (v22.2.3)](https://angular.dev/guide/routing/read-route-state), [Angular: Customizing route behavior](https://angular.dev/guide/routing/customizing-route-behavior), [GOV.UK: Tabs](https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/components/tabs/index.md), [GOV.UK: Pagination](https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/components/pagination/index.md), [MDN: History.pushState](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState), [NN/g: User control and freedom](https://www.nngroup.com/articles/user-control-and-freedom/), [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)
- Related: ACCESS-012, UIPAT-013, UIPAT-015

**Prevents** filters lost on refresh, shared links that open a different view, and a Back button that leaves the page instead of undoing the last change (NN/g: users "should always be able to go back to where they came from").

**What goes in the URL:** Angular's guide: query parameters "are perfect for handling filtering, sorting, pagination, and other stateful UI elements". GOV.UK's tabs store the current tab as a fragment, so "pressing the browser's 'back' button should navigate back to the previous tab". Keep transient state and personal data out of URLs, which end up in logs and history.

**Push or replace:** Baymard's e-commerce testing: "Tapping 'Back' after applying filters should begin removing the applied filters", since users "perceive each discrete iteration of their filtering as a new view". So push an entry per applied filter, tab or page (`pushState` "creates a new browser history entry"). Our rule: `replaceUrl: true` for each keystroke of a live search or step of a slider.

**Angular traps:**
- The default `queryParamsHandling` is `'replace'`, which "swaps out the existing query string": setting `sort` drops `filter`. Use `'merge'`.
- Reset the page when a filter or sort changes; treat an unknown value (`?page=abc`) as the default (GOV.UK: "Redirect users to the first page if they enter a URL of a page that no longer exists").
- A query-only navigation fires `NavigationEnd` too: skip ACCESS-012's focus move for it, keep focus on the control and announce the result count (UIPAT-015).

**Check:** measurable: filter, reload, assert it's kept; press Back, assert the previous view and that focus isn't on `<body>`. Which state belongs in the URL is judgement.

## [UIPAT-013] Forcing UI states in Playwright (tested)
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Playwright: Mock APIs (v1.64.1)](https://raw.githubusercontent.com/microsoft/playwright/v1.64.1/docs/src/mock.md), [Playwright: Route (v1.64.1)](https://raw.githubusercontent.com/microsoft/playwright/v1.64.1/docs/src/api/class-route.md), [Playwright: BrowserContext.setOffline (v1.64.1)](https://raw.githubusercontent.com/microsoft/playwright/v1.64.1/docs/src/api/class-browsercontext.md), [Playwright: Network, service workers (v1.64.1)](https://raw.githubusercontent.com/microsoft/playwright/v1.64.1/docs/src/network.md)
- Related: UIPAT-001, UIPAT-005, UIPAT-015, JSTEST-011, JSTEST-012, ACCESS-006, UIREV-007

`page.route` intercepts the page's own requests ("No requests to the API will be made"), so each state is one handler:

| State | Handler |
|---|---|
| Loading | `await held;` (a promise you resolve later) before `route.fulfill(...)`; assert the indicator, then release |
| Empty | `route.fulfill({ json: { items: [] } })` |
| Error | `route.fulfill({ status: 500 })`; a counter in the handler makes the retry succeed |
| Network failure | `route.abort('connectionrefused')` (default code `failed`; also `timedout`, `internetdisconnected`) |
| Partial | a body with the failed part flagged |
| Long content | a 200-character name at a 320 px viewport; assert `scrollWidth - clientWidth === 0` |
| Offline | `context.setOffline(true)` with no mock on that URL |

**Tested 2026-10-23, `@playwright/test@1.64.1`, Node 24.21.0, Chrome 155:** all seven states rendered as expected on a scratch page, and two traps showed:
- With `setOffline(true)` on, `navigator.onLine` was `false` but a mocked route still returned 200; after `unrouteAll()` the same `fetch` failed. Unmock (or `route.fallback()`) before testing offline. The docs say offline affects "requests that go through the browser's regular network stack", which a fulfilled route skips. Firefox and WebKit not tested.
- Pressing Enter on Retry, which re-rendered the view, left `document.activeElement` on `<body>` (UIPAT-015).

The test proves what renders, not what a screen reader says: the scratch page's live-region markup isn't a pattern to copy (UIPAT-015).

**Limits:** routes see only the browser's requests; data fetched during SSR comes from the server (JSTEST-011). A service worker such as MSW hides requests from `page.route` (`serviceWorkers: 'block'`).

**Check:** this entry is the check; run axe on each forced state too (ACCESS-006).

## [UIPAT-014] Native element or APG pattern: a lookup for common widgets
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [APG patterns (`w3c/aria-practices` at `0f765e4`)](https://www.w3.org/WAI/ARIA/apg/patterns/), [APG: Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), [APG: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), [APG: Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/), [APG: Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/), [web-features 3.44.0](https://www.npmjs.com/package/web-features)
- Related: ACCESS-009, ACCESS-010, ACCESS-013, CSS-008, CSS-010, NG-011

**Prevents** custom widgets that miss the keyboard behaviour native elements get free (ACCESS-009). APG lists 30 patterns.

| Need | Native (Baseline, web-features 3.44.0) | APG pattern when native won't do |
|---|---|---|
| Action, navigation | `<button>`, `<a href>` | Button, Link |
| Show and hide | `<details>`; exclusive `name` (newly, 2024-09-03); add a heading in `<summary>` for an accordion | Disclosure, Accordion |
| Modal | `<dialog>` + `showModal()` | Dialog (Modal) |
| Popup | `popover` (newly, 2025-01-27), `commandfor` (newly, 2025-12-12); no menu role or arrow keys | Menu button; site navigation: ACCESS-010 |
| Pick one | `<select>`, radios; styled `<select>` not Baseline | Listbox, Combobox ("Select-Only Combobox") |
| Type and pick | `<datalist>` not Baseline | Combobox (editable), or `@angular/aria` |
| Choose for a form | checkbox | Checkbox |
| On/off, applies at once | `<input type=checkbox switch>` not Baseline | Switch, which APG builds on a button or a checkbox |
| Slider | `<input type=range>` | Slider |
| Data | `<table>` | Table, Grid for an interactive one |
| Progress, gauge | `<progress>`, `<meter>` | Meter |
| Tabs, tree, toolbar | none | Tabs, Treeview, Toolbar, or `@angular/aria` (NG-011) |

Undated native entries are widely available. **Tabs:** "activate automatically when they receive focus as long as their associated tab panels are displayed without noticeable latency"; tabs that load another page are links, not the Tabs pattern. **Tooltip:** the pattern "is work in progress", and touch can't open one: keep essential text visible. An auto-advancing **carousel** falls under WCAG 2.2.2.

**Check:** lint and role locators catch fake buttons (ACCESS-011); the choice of pattern is judgement.

## [UIPAT-015] Announcing state changes and keeping focus when the view changes
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [MDN: ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions), [WCAG 2.2: 4.1.3 Status Messages, 2.4.3 Focus Order, 2.2.1 Timing Adjustable](https://www.w3.org/TR/WCAG22/), [GOV.UK Frontend error summary template (`76a8e69`)](https://raw.githubusercontent.com/alphagov/govuk-frontend/76a8e69/packages/govuk-frontend/src/govuk/components/error-summary/template.njk)
- Related: UIPAT-001, UIPAT-005, UIPAT-008, UIPAT-009, UIPAT-012, ACCESS-012, ACCESS-013

**Prevents** screen-reader users not knowing that results arrived, failed or came back empty (WCAG 4.1.3), and keyboard users losing their place when the view re-renders (2.4.3).

**Announcing.** MDN: "Establish the live region before updating its content. Start with an empty live region". So:
- One `role="status"` element always in the template; change only its text: "Loading…" (after about 1 s, UIPAT-002), "12 results", "No results", "Saved", "2 sections couldn't load". Angular CDK's `LiveAnnouncer` does this.
- `role="alert"` for an error that blocks the task. GOV.UK's error summary both takes focus and keeps `role="alert"` in a child, a separate container "to prevent a race condition between the focusing js at the alert".
- Never wrap the list or the whole view in a live region: every re-render is read out. `aria-busy` is a hint, not the mechanism.

**Keeping focus.** Tested 2026-10-23 (`@playwright/test@1.64.1`, Chrome 155): after a keyboard Retry re-rendered the view, and after `disabled` was set on the focused button, `document.activeElement` was `<body>`; with `aria-disabled="true"` focus stayed. When the focused element goes away (Retry, delete, rollback, submit), keep it mounted or move focus to the next item, the list heading or the status text.

**Toasts:** an error must not live only in a toast that hides itself; WCAG 2.2.1 requires a way to turn off, adjust or extend a time limit.

**Check:** measurable: `document.activeElement` isn't `<body>` after each action; the status element exists before it changes. What a screen reader says needs a manual test (ACCESS-015).

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-23 against `angular-conventions` in FreekMencke/claude-skills at `595b1bc`, which already requires a `<label>` on every input ("a placeholder isn't one") and a visible failure with a retry for every failable load. The app repos weren't audited in this session.

1. **Decided 2026-10-23 (FreekMencke/claude-kb#260): forced-state and form checks go into the `ui-review` skill**, FreekMencke/claude-skills#106. UIPAT-001, UIPAT-005, UIPAT-008, UIPAT-013, UIPAT-015.
2. **Decided 2026-10-23 (FreekMencke/claude-kb#260): the state, focus, form and URL-state rules go into `angular-conventions`**, FreekMencke/claude-skills#107. UIPAT-001, UIPAT-008, UIPAT-009, UIPAT-010, UIPAT-012, UIPAT-015.
3. **Pick one content style** for error messages and buttons (GOV.UK's templates are the most complete) and one required-field convention, and record them in each app's CLAUDE.md (UIPAT-007, UIPAT-011). Not started: needs the user's choice.

## Open questions

- **Material 3's guidance** on progress indicators and empty states wasn't read: m3.material.io renders in JavaScript (curl returned 83 characters, WebFetch only the title), and `material-components/material-web`'s `docs/components/progress.md` has no thresholds.
- **Current Polaris** (Polaris Web Components on shopify.dev) wasn't read; the quotes here are from the archived `Shopify/polaris` repo.
- **A minimum display time for loaders** from a design system: not found in Primer, Fluent, Ant, Polaris, Atlassian, Carbon or React; Spectrum and Material not read.
- **Toast durations and success feedback** (how long a toast stays, toast against inline confirmation, undo against confirm): not researched beyond WCAG 2.2.1.
- **Does Angular 22's `[formField]` set `aria-invalid` or `aria-describedby`?** The three signal-forms guides read don't say; not tested.
- **Do NVDA, JAWS and VoiceOver announce the UIPAT-015 pattern as described?** No screen reader was run.
- **NN/g on URL state and on optimistic UI:** one search each found nothing.
- **Truncation and overflow rules** in Polaris, Atlassian and Carbon weren't searched.
- **Does Angular restore scroll and focus on Back** (`withInMemoryScrolling`) for query-only navigations, and does find-in-page or an anchor still work after one? Not tested (UIPAT-012).
- **Does a mocked route answer while offline in Firefox and WebKit?** Only Chrome was tested; microsoft/playwright#42775 reports a related WebKit difference for service workers (UIPAT-013).
