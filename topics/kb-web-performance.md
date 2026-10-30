# Web performance beyond Core Web Vitals

Prefix `WEBPERF`. This file covers what to fix for INP in an Angular SSR app and how to find the slow interaction, what keeps a page out of the back/forward cache and how to test it, Speculation Rules and their risks, `fetchpriority`, preload and 103 Early Hints from Express, image formats and responsive images, Cache-Control for bundles and server-rendered HTML, and compression (brotli, zstd) from Express or a reverse proxy. Core Web Vitals themselves, their thresholds and lab against field data are in `kb-web-analytics-seo.md` (WEB-010, WEB-011, WEB-023, WEB-034); font loading is in `kb-fonts.md` (FONT-020 to FONT-022).

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#188, part of roadmap #167) by an Opus 5.5 lead with three Sonnet readers (INP and bfcache; Speculation Rules, priority and Early Hints; images and HTTP caching) and a Sonnet refuter on the claims the recommendations rest on.
- Read as raw text: web.dev and developer.chrome.com pages (HTML with tags stripped; each entry gives the page's "Last updated" date), MDN as Markdown from mdn/content, angular/angular and angular-cli at tag `v22.2.3`, the `@angular/ssr@22.2.3` tarball, expressjs, serve-static, send, compression and Node docs from raw.githubusercontent.com, Traefik's docs and source at `v3.7.15`, and the npm registry.
- Browser support from web-features 3.43.0 `data.json` (`npm view web-features dist-tags`: latest 3.43.0, published 2026-10-15) and `@mdn/browser-compat-data` 8.1.6, both installed with `--ignore-scripts` and queried with Node; never from memory.
- Tested: express 5.3.0 with compression 1.8.2 and serve-static 2.2.1 on Node 24.21.0 (encoding choice, static defaults, `res.writeEarlyHints`), and gzip, brotli and zstd sizes on a production page and bundle with Node 24.21.0's zlib. Nothing was tested in a browser.
- Our apps were read on 2026-10-17 from `main` of osrs-tracker-web and freek-mencke-web: Angular 22.2 SSR on Express 5, zoneless, `provideClientHydration(withEventReplay())`, behind a Traefik v3 ingress that compresses.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| What should I fix first for a slow INP? | Find the slow interaction in the field (web-vitals' attribution build), then shrink its biggest subpart: input delay (long tasks at startup, timers), processing (do less in the handler, yield with `scheduler.yield()` and a `setTimeout` fallback) or presentation (DOM size, layout). | WEBPERF-001, WEBPERF-003 |
| Does Angular say anything about INP? | No: the v22.2.3 guides never mention INP and still cite FID. The levers are incremental hydration triggers (default in v22, with event replay), `@defer` off the first viewport, and keeping template expressions and lifecycle hooks cheap. | WEBPERF-002 |
| Which fields tell me what made an interaction slow? | web-vitals 6.2.3 `onINP` from `web-vitals/attribution`: `interactionTarget`, `inputDelay`, `processingDuration`, `presentationDelay`, `longAnimationFrameEntries` and `longestScript` (LoAF, Chromium only). | WEBPERF-003 |
| What keeps a page out of the bfcache? | `unload` listeners (never fire in Chrome since 155), `Cache-Control: no-store` on the HTML (Chrome admits such pages with conditions since 2025; Firefox and Safari don't), open IndexedDB, in-flight fetch, WebSocket or WebRTC, a `window.opener`. `no-cache` doesn't block it. | WEBPERF-004 |
| How do I test bfcache? | DevTools Application > Back/forward cache > test; `notRestoredReasons` on the navigation entry (Chromium 125+); count `pageshow` with `event.persisted`. Puppeteer disables bfcache by default. | WEBPERF-005 |
| Can I use Speculation Rules? | Chromium only (Chrome 109+); Safari 26.2 has prefetch behind a flag, Firefox a partial preview. Unsupported browsers ignore the script, so it's safe progressive enhancement. Document rules default to `conservative`, list rules to `immediate`. | WEBPERF-006 |
| Do Speculation Rules help an Angular SPA? | Little: they speculate only full browser navigations, not router route changes. Prerender also runs your scripts, so gate analytics and side effects; a nonced inline rules script is allowed by a strict CSP. | WEBPERF-007 |
| `fetchpriority="high"` or preload for the LCP image? | `fetchpriority="high"` on an `<img>` in the HTML; preload (with `fetchpriority="high"`) only when the image is found late (CSS background, JS-inserted). At most one or two. `NgOptimizedImage`'s `priority` does both under SSR. | WEBPERF-008 |
| Are 103 Early Hints worth it from Express? | Only when the server has think time before the HTML. `res.writeEarlyHints()` (Node 18.11+) works in Express 5; browsers act on it over HTTP/2+ for navigations only; Safari takes preconnect, not preload. Traefik forwards 1xx in its default proxy. | WEBPERF-009 |
| AVIF, WebP or JPEG? | AVIF is Baseline widely available since 2026-07-25, WebP since 2023-03-16. A `<picture>` JPEG fallback now only serves Safari before 16.4 and similar; Angular's `NgOptimizedImage` doesn't do `<picture>` and converts nothing itself. | WEBPERF-010 |
| Should every image get `loading="lazy"`? | Every image except those likely in the first viewport, and never the LCP image. Set `width` and `height`. `NgOptimizedImage` lazy-loads all non-`priority` images by default and prepends `sizes="auto"`. | WEBPERF-011 |
| Which Cache-Control for bundles, other static files and SSR HTML? | Hashed bundles `public, max-age=31536000, immutable`; other files a short `max-age` with ETag; HTML `no-cache` (not `no-store`, which costs bfcache outside Chrome). express.static defaults to `public, max-age=0`; `@angular/ssr` sets none. | WEBPERF-012 |
| Should Express compress with zstd? | Not from Express: `compression` 1.8.2 offers br, gzip and deflate only, Node's zstd is experimental, and at speed levels br and zstd barely beat gzip (tested). zstd is Baseline newly available since 2026-02-11. | WEBPERF-013 |
| My proxy compresses: why do browsers get gzip? | Traefik v3's compress middleware defaults to `encodings: gzip, br, zstd` and picks the first at equal weight; browsers send no weights, so they get gzip. Put `br` first. | WEBPERF-014 |

## Index

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

## [WEBPERF-001] INP: the three subparts, long tasks and yielding
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Optimize INP (web.dev, updated 2025-09-02)](https://web.dev/articles/optimize-inp), [Optimize long tasks (web.dev, updated 2024-12-19)](https://web.dev/articles/optimize-long-tasks), [Optimize input delay](https://web.dev/articles/optimize-input-delay), [DOM size and interactivity](https://web.dev/articles/dom-size-and-interactivity)
- Related: WEBPERF-002, WEBPERF-003, WEB-023

web.dev gives no ranked fix list; its order is: find the slow interaction in the field (WEBPERF-003), reproduce it in the lab, then shrink whichever subpart dominates. "The sum of these three subparts is the total interaction latency":

- **Input delay**, until the handlers start: long tasks during startup (script evaluation, hydration), recurring timers, overlapping interactions. "Any task that takes longer than 50 milliseconds is a long task."
- **Processing duration**: "do as little work as possible in them". Update what the user sees, then yield and do the rest.
- **Presentation delay**: rendering the next frame. Lighthouse calls a DOM "excessive when it exceeds 1,400 nodes" and warns from 800; `content-visibility` helps.

Yielding, from optimize-long-tasks ("scheduler.yield() is not yet supported in all browsers, so a fallback is needed"):

```js
function yieldToMain () {
  if (globalThis.scheduler?.yield) {
    return scheduler.yield();
  }
  // Fall back to yielding with setTimeout.
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}
```

`scheduler.yield()` continues ahead of other queued tasks; the `setTimeout` fallback goes to the back of the queue but still lets the browser paint. Support (BCD 8.1.6): Chrome 129, Firefox 142, no Safari; the `scheduler` feature isn't Baseline. Don't use `isInputPending()`: it "may incorrectly return false". For work with no visual result, web.dev's pattern `requestAnimationFrame(() => setTimeout(work, 0))` "works in all browsers".

## [WEBPERF-002] INP in an Angular 22 SSR app: hydration, event replay and `@defer`
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Incremental hydration (angular/angular v22.2.3)](https://github.com/angular/angular/blob/v22.2.3/adev/src/content/guide/incremental-hydration.md), [Hydration](https://github.com/angular/angular/blob/v22.2.3/adev/src/content/guide/hydration.md), [Deferred loading with `@defer`](https://github.com/angular/angular/blob/v22.2.3/adev/src/content/guide/templates/defer.md), [Zoneless](https://github.com/angular/angular/blob/v22.2.3/adev/src/content/guide/zoneless.md), [Slow computations](https://github.com/angular/angular/blob/v22.2.3/adev/src/content/best-practices/runtime-performance/slow-computations.md)
- Related: WEBPERF-001, WEBPERF-003, NG-004, NG-005, WEB-034

Angular has no INP guidance: the hydration, incremental hydration, zoneless, `@defer`, SSR and runtime-performance guides at v22.2.3 never mention INP, and the hydration pages still cite FID. What they offer:

- **Incremental hydration** "is enabled by default when you use `provideClientHydration()`" in v22, and "depends on and enables event replay automatically", so `withEventReplay()` is redundant. Wrap below-the-fold or rarely used parts in `@defer (hydrate on viewport)`, `on interaction` ("`click` or `keydown`"), `on idle` or `hydrate never`, so less hydrates at startup, which is input delay for every early interaction.
- **Event replay** "captures all events that happen before hydration and replays those events once hydration has completed". How such clicks score in INP isn't documented (open question 1).
- **`@defer` without hydrate triggers**: "Avoid deferring components that are visible in the user's viewport on initial load", which raises CLS.
- **Zoneless** is the default since v21 (NG-004); an explicit `provideZonelessChangeDetection()` is harmless. Change detection then runs on signals, `markForCheck`, inputs and template listeners only.
- **Processing time**: template expressions and lifecycle hooks run in every change detection pass; use pure pipes, `computed` signals or memoization, and avoid forced reflows in hooks.

Fix order in practice: the attribution data (WEBPERF-003) says which subpart; input delay at startup points at hydration and bundle evaluation, processing at a handler or change detection, presentation at DOM size.

## [WEBPERF-003] Finding the slow interaction: web-vitals attribution and LoAF
- Type: tool
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-17
- Sources: [web-vitals README at v6.2.3](https://github.com/GoogleChrome/web-vitals/blob/v6.2.3/README.md), [Long Animation Frames API (developer.chrome.com)](https://developer.chrome.com/docs/web-platform/long-animation-frames)
- Related: WEBPERF-001, WEBPERF-002, WEB-010, WEB-011

`npm view web-vitals dist-tags` gave `latest: 6.2.3` (published 2026-10-05). Import `onINP` from `web-vitals/attribution` (about 1.5 KB brotli larger) and send the subparts with the value:

```js
import { onINP } from 'web-vitals/attribution';
onINP(({ value, attribution: a }) => send({
  value, target: a.interactionTarget,
  input: a.inputDelay, processing: a.processingDuration, presentation: a.presentationDelay,
  script: a.longestScript?.entry.sourceURL,
}));
```

- `interactionTarget` is a selector; an empty string "generally means the element was removed from the DOM".
- `longAnimationFrameEntries`, `longestScript` (with the subpart it fell in), `totalScriptDuration` and `totalStyleAndLayoutDuration` come from the Long Animation Frames API, which shipped in Chrome 123 and isn't Baseline; elsewhere the array is empty. Only scripts over 5 ms are attributed.
- The library's `durationThreshold` default is 40 ms; event timing's own default is 104 ms for events before it loads.
- "INP is not reported if the user never interacts with the page", and it's reported again after a bfcache restore.
- Support: event timing is Baseline newly available since 2025-12-12 (Safari 26.2), so `onINP` reports in Chromium, Firefox and Safari.

Lab follow-up: reproduce the interaction with CPU throttling in the DevTools Performance panel (WEB-011) and look at the long task under it.

## [WEBPERF-004] What keeps a page out of the bfcache
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Back/forward cache (web.dev, updated 2026-10-16)](https://web.dev/articles/bfcache), [bfcache for Cache-Control: no-store pages (developer.chrome.com, updated 2025-09-09)](https://developer.chrome.com/docs/web-platform/bfcache-ccns), [Deprecating the unload event (updated 2026-10-16)](https://developer.chrome.com/docs/web-platform/deprecating-unload), [WebKit `BackForwardCache.cpp` (main)](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/history/BackForwardCache.cpp), [Firefox `test_form_restoration.html` (main)](https://github.com/mozilla-firefox/firefox/blob/main/docshell/test/mochitest/test_form_restoration.html), [Mozilla bug 567365](https://bugzilla.mozilla.org/show_bug.cgi?id=567365)
- Related: WEBPERF-005, WEBPERF-012

"All major browsers include a bfcache". What blocks it, per web.dev:

- **`unload` listeners**: "never use the unload event. Ever!" Chrome's deprecation "is now complete as of Chrome 155" (2026-10-06), so `unload` no longer fires there except on iOS; Firefox makes a page with an `unload` listener ineligible. Use `pagehide`; `beforeunload` doesn't block.
- **`Cache-Control: no-store` on the HTML**: "the largest reason the bfcache is not used, for about 17% of history navigations on mobile and 7% … on desktop". Chrome admits such pages since a rollout "over March and April 2025", but "will evict a page from the bfcache on changes to cookies", refuses them with WebSocket, WebTransport or WebRTC, evicts them when a fetch or XHR response is itself `no-store`, and keeps them 3 minutes (10 otherwise). Firefox still refuses them (its test asserts "Page with a no-store header shouldn't be bfcached."), and WebKit refuses HTTPS main frames with `no-store`.
- **`no-cache` or `max-age=0`** "don't affect a page's bfcache eligibility". Firefox's old HTTPS `no-cache` exclusion was removed in Firefox 47 (bug 567365).
- **Open connections**: IndexedDB, in-flight `fetch()`/XHR, WebSocket or WebRTC ("Chrome (as of 149) and Safari do no block on open WebSockets but other browsers do"). Close them in `pagehide`, reopen in `pageshow`.
- **`window.opener`** set (`rel="noopener"` is now the default).

Which cookie changes evict a `no-store` page in Chrome, such as those analytics scripts make, isn't documented (open question 2).

## [WEBPERF-005] Testing the bfcache: DevTools, `notRestoredReasons`, `pageshow`
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Back/forward cache (web.dev)](https://web.dev/articles/bfcache), [Lighthouse: page prevented back/forward cache restoration](https://developer.chrome.com/docs/lighthouse/performance/bf-cache), [PerformanceNavigationTiming.notRestoredReasons (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/notRestoredReasons)
- Related: WEBPERF-004, WEB-011

- **DevTools**: Application > Back/forward cache, then run the test. It navigates away and back and lists reasons as actionable, pending support or not actionable.
- **Lighthouse** has a bfcache audit since 10.0. "Puppeteer disables the bfcache by default due to a bug where the page freezes", so Puppeteer scripts and Lighthouse user-flow navigations don't test it; use a timespan around `page.goBack()`. Whether Playwright does the same wasn't found.
- **In the field**: `performance.getEntriesByType('navigation')[0].notRestoredReasons` gives `{ reasons: [{ reason: 'unload-listener' }], children, … }`, with cross-origin iframes `"masked"`. Chromium 125+ only, experimental in BCD; MDN says not to depend on the reasons' exact wording. Reasons include `response-cache-control-no-store`, `outstanding-network-request`, `websocket` and `unload-listener`.
- **Hit rate**: `pageshow`'s `event.persisted` "is true if the page was restored from bfcache"; compare against navigations of type `back_forward`. `pagehide`'s `persisted` doesn't guarantee caching.
- **Metrics**: web-vitals reports again after a restore (`navigationType: 'back-forward-cache'`); hand-rolled INP code should reset to 0 on `pageshow` with `persisted`.

For an agent: run the DevTools test, or Chrome DevTools MCP (WEB-011) with a navigate, back and `notRestoredReasons` read, on each page type after changing headers or adding listeners.

## [WEBPERF-006] Speculation Rules: support, syntax, eagerness and Chrome's limits
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Prerender pages in Chrome (developer.chrome.com, updated 2026-01-23)](https://developer.chrome.com/docs/web-platform/prerender-pages), [`<script type="speculationrules">` (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/speculationrules), web-features 3.43.0 and BCD 8.1.6 via npm
- Related: WEBPERF-007, CSS-002

**Support**: web-features `speculation-rules` isn't Baseline: Chrome and Edge 109. BCD: Firefox "Initial support includes prefetch of URL list only" in preview; Safari 26.2 behind the "SpeculationRules prefetch" flag. Browsers without support ignore the script.

**Syntax**: JSON in `<script type="speculationrules">` (head or body of the main frame), or a `Speculation-Rules: "/rules.json"` header pointing at a file served as `application/speculationrules+json`. List rules use `urls`; document rules use `where` with `href_matches`, `selector_matches`, `and`, `not`.

```html
<script type="speculationrules">
{ "prerender": [{ "where": { "and": [{ "href_matches": "/*" },
  { "not": { "selector_matches": "[data-no-prerender]" } }] }, "eagerness": "moderate" }] }
</script>
```

**Eagerness** (Chrome): `immediate` as soon as seen; `eager` 10 ms hover on desktop since Chrome 143; `moderate` 200 ms hover or pointerdown, viewport heuristics on mobile since August 2025; `conservative` pointer or touch down. "The default eagerness for list rules is immediate" and "for document rules is conservative".

**Limits**: `immediate` allows 50 prefetches and 10 prerenders; the other levels 2 each, first in first out. Chrome skips speculation under Save-Data, energy saver, memory pressure or with "Preload pages" off. `prerender_until_script` is in an origin trial from January 2026, not shipped.

## [WEBPERF-007] Speculation Rules: side effects, analytics, CSP and SPAs
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Prerender pages in Chrome](https://developer.chrome.com/docs/web-platform/prerender-pages), [Implementing speculation rules (updated 2025-10-23)](https://developer.chrome.com/docs/web-platform/implementing-speculation-rules), [Speculation Rules API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API), [Sec-Purpose (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Purpose)
- Related: WEBPERF-006, WEBPERF-012

Traps when adding rules:

- **SPAs gain little**: "Speculation rules are only supported for full page navigations managed by the browser, and not for Single Page Apps (SPA) or app shell pages ... route changes within the app cannot be prerendered." In an Angular app only the first document load is a browser navigation; Router links are not. Prerendering the app itself from another page still helps.
- **Side effects**: exclude GET URLs that change state, such as sign-out, language switch, add to cart, or sign-in flows that send an SMS. Prerender also runs the page's scripts, writing storage and "sending analytics, recording ad impressions".
- **Analytics**: "Google Analytics handles prerender by delaying until activation by default", per Chrome's docs and provider list; no Google page names GA4 or gtag.js. Custom code waits for `prerenderingchange` when `document.prerendering` is true.
- **Server side**: speculative requests carry `Sec-Purpose: prefetch`, or `prefetch;prerender` per Chrome; MDN's Sec-Purpose page defines only `prefetch`, so match the substring. A non-2xx response cancels the speculation.
- **CSP**: inline rules "need to be included in the script-src ... either using a hash or nonce". `'inline-speculation-rules'` covers only rules injected by a nonced or hashed script. Whether `'strict-dynamic'` changes this wasn't found.
- **Cost**: speculations spend bandwidth, memory and server renders. Chrome advises keeping "prerenders down to one or two pages at most" and starting with prefetch.

## [WEBPERF-008] `fetchpriority` and preload for the LCP image, and `NgOptimizedImage` `priority`
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Optimize LCP (web.dev, updated 2025-03-31)](https://web.dev/articles/optimize-lcp), [Fetch Priority API (web.dev, updated 2023-11-14)](https://web.dev/articles/fetch-priority), [Preload critical assets](https://web.dev/articles/preload-critical-assets), [Image optimization (angular/angular v22.2.3)](https://github.com/angular/angular/blob/v22.2.3/adev/src/content/guide/image-optimization.md), [`ng_optimized_image.ts` v22.2.3](https://github.com/angular/angular/blob/v22.2.3/packages/common/src/directives/ng_optimized_image/ng_optimized_image.ts)
- Related: WEBPERF-009, WEBPERF-011, FONT-020, FONT-021

**Support**: `fetch-priority` is Baseline newly available since 2024-10-29 (Firefox 132, Safari 17.2); `link-rel-preload` widely available since 2023-07-26; preloading responsive images (`imagesrcset`) widely available since 2026-06-11.

**Which**: "Images start at "Low" priority by default. At layout time, images within the viewport are boosted to "High"", and since Chrome 117 "the first 5 large images are set to "Medium"". So:
- An LCP `<img>` in the server-rendered HTML: add `fetchpriority="high"`, never `loading="lazy"`. "Setting a high priority on more than one or two images makes priority setting unhelpful".
- An LCP image only referenced from CSS or JavaScript: `<link rel="preload" as="image" fetchpriority="high" href="…">`, since a preloaded image otherwise still gets low priority.
- "If too many resources are prioritized, effectively none of them are." Chrome warns in the console about a preload unused about 3 s after load.

**Angular**: `NgOptimizedImage`'s `priority` sets `fetchpriority="high"`, `loading="eager"` and `decoding="sync"`, and under SSR appends `<link rel="preload" as="image" fetchpriority="high">` to `<head>`, carrying `imagesrcset` and `imagesizes`. In dev mode it warns when the LCP image lacks `priority`, when more than 10 images use it, and when more than 5 are preloaded. Fonts: FONT-020.

## [WEBPERF-009] 103 Early Hints from Express behind a proxy
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Early Hints (developer.chrome.com, updated 2026-07-10)](https://developer.chrome.com/docs/web-platform/early-hints), [Node.js `response.writeEarlyHints()` (v24.x docs)](https://github.com/nodejs/node/blob/v24.x/doc/api/http.md), [Traefik `Test1xxResponses` at v3.7.15](https://github.com/traefik/traefik/blob/v3.7.15/pkg/server/service/service_test.go), [traefik/traefik#9213](https://github.com/traefik/traefik/issues/9213)
- Related: WEBPERF-008, WEBPERF-013

"Early Hints are not useful if your server can send a 200 (or other final responses) right away": then put `Link` headers or `<link>` elements on the response itself. They help when SSR has think time, such as an API call, before the first byte.

- **Browsers**: navigation requests only; "Only supports preconnect and preload". Preconnect: Chrome 103, Firefox 120, Safari 17. Preload: Chrome 103, Firefox 123, Safari not at all. "Most browsers will only accept them over" HTTP/2 or HTTP/3. A cross-origin redirect drops them, and only cacheable resources should be preloaded or they're fetched twice.
- **Send** only for `sec-fetch-mode: navigate`, and repeat the `Link` headers on the 200. Chrome warns against often-changing fingerprinted URLs.
- **Node and Express**: `response.writeEarlyHints(hints[, callback])` was "added: v18.11.0". Express 5's `res` inherits from `http.ServerResponse`, so `res.writeEarlyHints({ link: '</app.js>; rel=preload; as=script' })` works with no Express API. Tested 2026-10-17, express@5.3.0 with compression@1.8.2, Node 24.21.0: a Node HTTP/1.1 client received the 103 with its `Link` header, then a brotli 200.
- **Behind Traefik**: issue #9213 was closed by a PR adding "a non-regression test for the support of 103 early hints responses by the reverse proxy". Its default `httputil` proxy forwards 1xx; untested end to end over TLS and HTTP/2.

Angular SSR sends no Early Hints: `@angular/ssr` 22.2.3 adds up to 10 `<link rel="modulepreload">` for the route's lazy chunks before `</body>`.

## [WEBPERF-010] Image formats: AVIF, WebP and the `<picture>` fallback
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Image file type and format guide (MDN)](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types), web-features 3.43.0 via npm, [Image optimization (angular/angular v22.2.3)](https://github.com/angular/angular/blob/v22.2.3/adev/src/content/guide/image-optimization.md), [sharp output options](https://sharp.pixelplumbing.com/api-output)
- Related: WEBPERF-011, WEBPERF-012, CSS-002, IMG-004, IMG-006

**Support** (web-features 3.43.0): `avif` Baseline widely available since 2026-07-25 (Chrome 85, Edge 121, Firefox 113, Safari 16.4); `webp` since 2023-03-16; `image-set()` since 2026-03-18; `picture` and `srcset` for years.

**Guidance**: MDN: "For raster images, prefer WebP or AVIF, which generally provide better compression than PNG, JPEG, and GIF." Its AVIF section still says "support is not yet comprehensive" and asks for a WebP, JPEG or PNG fallback in `<picture>`, while another paragraph puts unsupported browsers at "virtually zero market share". The Baseline data supports the second: a fallback now serves only browsers older than the versions above. MDN's figures: lossy WebP is "on average 25–35% smaller than JPEG", lossy AVIF "around 50% smaller", from a blog it cites.

**Trade-offs**: "AVIF does not support progressive rendering, so files must be fully downloaded before they can be displayed"; prefer WebP or progressive JPEG for very large hero images on slow links. No official page gives encode or decode times. sharp's defaults are AVIF quality 50 at effort 4 of 0–9, and WebP and JPEG quality 80.

**Angular**: `NgOptimizedImage` converts nothing. Its built-in loaders (Cloudflare, Cloudinary, ImageKit, Imgix, Netlify) leave format choice to the CDN, Cloudinary's with `f_auto`. Asked "Can I use this with the `<picture>` tag", the guide says "No, but this is on our roadmap". Self-hosted images need AVIF or WebP files made at build time.

## [WEBPERF-011] `loading="lazy"`, `srcset`/`sizes` and `NgOptimizedImage` defaults
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Browser-level image lazy loading (web.dev, updated 2024-08-13)](https://web.dev/articles/browser-level-image-lazy-loading), [`<img>` (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img), [Chromium `settings.json5` (main, read 2026-10-17)](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/core/frame/settings.json5), [Image optimization (angular/angular v22.2.3)](https://github.com/angular/angular/blob/v22.2.3/adev/src/content/guide/image-optimization.md)
- Related: WEBPERF-008, WEBPERF-010, FONT-021

**Lazy loading** (`loading-lazy` widely available since 2026-06-19): "Don't lazy-load images that are likely to be in-viewport when the page loads, especially LCP images." With `<picture>`, put `loading` on the `<img>` only. Chrome starts loading a lazy image this far from the viewport: web.dev says 1250 px on 4G and 2500 px on "3G or lower"; Chromium's `lazyLoadingImageMarginPx*` settings on `main` are 4G 1250, 3G 2500, 2G 6000, Slow-2G 8000, unknown 3000.

**Sizing**: set `width` and `height` to the intrinsic size of the largest `srcset` file, so the browser reserves the aspect ratio. Without them, layout shifts and lazy images default to 0×0, so "the browser decides to load everything". `sizes` defaults to `100vw` and takes no percentages; it's first-match. `sizes="auto"` "is only valid when combined with `loading="lazy"`" and isn't Baseline (Chrome 126, Firefox 150). `decoding` rarely makes a perceptible difference.

**`NgOptimizedImage`** (`ngSrc`): requires `width` and `height` (or `fill`), lazy-loads every image without `priority` by default, and generates a `srcset` from `sizes` with a loader. It "automatically prepends `"auto"` to the provided `sizes` value", harmless where unsupported. Its default breakpoints run from 16 to 3840 px. In dev mode it warns about distorted images and about images at least 1000 px larger than twice the rendered size.

## [WEBPERF-012] Cache-Control for hashed bundles, other static files and SSR HTML
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Cache-Control (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control), [HTTP caching (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching), [serve-static v2.2.1 README](https://github.com/expressjs/serve-static/blob/v2.2.1/README.md), [Angular CLI SSR server template v22.2.3](https://github.com/angular/angular-cli/blob/v22.2.3/packages/schematics/angular/ssr/files/application-builder/server.ts.template), [RFC 8246](https://www.rfc-editor.org/rfc/rfc8246)
- Related: WEBPERF-004, WEBPERF-013, NG-008

| Response | Header |
|---|---|
| Hashed bundles (`main-*.js`, `chunk-*.js`, `styles-*.css`) | `public, max-age=31536000, immutable` |
| Other static files (icons, `robots.txt`, unhashed fonts) | a short `public, max-age=86400`, or `no-cache`, keeping ETag and Last-Modified |
| SSR or prerendered HTML | `no-cache`, or `private, no-cache` if personalised |

- **`no-cache` vs `no-store`**: `no-cache` "does not mean "don't cache"": it stores and revalidates. `no-store` stores nothing and keeps the page out of the bfcache outside Chrome (WEBPERF-004). A per-response CSP nonce doesn't need `no-store`. The body changes each time, so drop the ETag; a bfcache restore reuses the old DOM, whose nonce matched its own CSP.
- **`immutable`**: Firefox 49 and Safari 11; Chrome never implemented it, since its reloads stopped revalidating subresources in 2017.
- **express.static** (serve-static 2.2.1, express 5.3.0) defaults to `public, max-age=0` with a weak ETag and Last-Modified; `immutable` is off and `maxAge` is capped at one year. Tested 2026-10-17, Node 24.21.0: no options gave `public, max-age=0`, and `{ maxAge: '1y', immutable: true }` gave `public, max-age=31536000, immutable`.
- **The Angular CLI's `server.ts`** uses `express.static(…, { maxAge: '1y' })`, which caches unhashed files such as `favicon.ico` for a year too. Use `setHeaders` to split hashed from unhashed files.
- **`@angular/ssr` 22.2.3** sets no Cache-Control; prerendered pages get an `ETag` and a 304. Add headers per route (`ServerRoute.headers`) or in Express.

## [WEBPERF-013] Compression from Express: brotli, zstd and which level
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [compression README and HISTORY](https://github.com/expressjs/compression/blob/master/HISTORY.md), [Node.js zlib (v24.x)](https://github.com/nodejs/node/blob/v24.x/doc/api/zlib.md), web-features 3.43.0 and BCD 8.1.6 via npm
- Related: WEBPERF-012, WEBPERF-014, NODE-001

**Browser support**: `brotli` widely available since 2020-03-19. `zstd` Baseline newly available since 2026-02-11 (Chrome 123, Firefox 126, Safari 26.3; BCD: "Before macOS 26.3 Tahoe, Safari cannot decode Zstandard responses").

**Express**: `compression` 1.8.2 (2026-09-11) supports "deflate, gzip, br"; brotli arrived in 1.8.0 (2025-02-10). Its source prefers `['br', 'gzip']`, uses brotli quality 4, skips bodies under `1kb` and anything with `Cache-Control: no-transform`. Node's zstd (`zlib.createZstdCompress`, added v23.8.0 and v22.15.0) is still "Stability: 1 - Experimental" on v24.x.

Tested 2026-10-17, express@5.3.0 and compression@1.8.2 on Node 24.21.0: Chrome's `Accept-Encoding: gzip, deflate, br, zstd` got `br`; `zstd` alone got no encoding.

**Levels** (Node 24.21.0 zlib, mean of 10 runs, a 105,386-byte production SSR page and a 134,755-byte Angular `main-*.js`):

| Setting | Page | Bundle | Time (page) |
|---|---|---|---|
| gzip 6 | 19,668 | 22,242 | 0.96 ms |
| br 4 (compression's default) | 19,735 | 21,394 | 0.81 ms |
| br 11 (Node's default) | 16,448 | 18,504 | 60.89 ms |
| zstd 3 | 20,952 | 21,851 | 0.21 ms |
| zstd 19 | 18,186 | 19,963 | 19.16 ms |

At speed levels br and zstd barely beat gzip; br 11 saves 15–17% but costs about 50–60 ms per response. Compress immutable bundles once at build time at max quality, and leave fast levels for dynamic HTML. express.static serves no precompressed `.br` files.

## [WEBPERF-014] Traefik's compress middleware sends gzip unless `br` comes first
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Traefik compress middleware docs](https://github.com/traefik/traefik/blob/master/docs/content/reference/routing-configuration/http/middlewares/compress.md), [`middlewares.go` at v3.7.15](https://github.com/traefik/traefik/blob/v3.7.15/pkg/config/dynamic/middlewares.go), [`acceptencoding.go` at v3.7.15](https://github.com/traefik/traefik/blob/v3.7.15/pkg/middlewares/compress/acceptencoding.go)
- Related: WEBPERF-013

Traefik v3's `compress` middleware (latest release v3.7.15, 2026-10-15) has `encodings` defaulting to `gzip, br, zstd`, and "the order of the list also sets the priority, the top entry has the highest priority". The source matches: `SetDefaults` sets `[]string{"gzip", "br", "zstd"}`, and at equal `q` weight the lowest index wins. Browsers send `Accept-Encoding` without weights, so a default middleware answers every browser with gzip.

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
spec:
  compress:
    encodings: [br, gzip]
    includedContentTypes: [text/html, text/css, text/javascript, application/xml]
```

- Traefik's brotli writer is `andybalholm/brotli` `NewWriter` (quality 6) and its zstd is klauspost's `SpeedDefault`, "roughly equivalent to the default Zstandard mode (level 3)". At those levels zstd came out larger than brotli on our pages (WEBPERF-013), so leaving `zstd` out is reasonable.
- Other defaults: bodies under `minResponseBodyBytes` (1024) aren't compressed, a response that already has `Content-Encoding` passes through, and no `Accept-Encoding` means no compression unless `defaultEncoding` is set.
- Don't also compress in Express: Traefik skips responses that already have `Content-Encoding`, so the backend's level wins and the proxy's setting goes unused.

Seen in our apps: both had moved to `encodings: [br, gzip]`, and on 2026-10-17 both answered a Chrome `Accept-Encoding` with `content-encoding: br`.

## Recommendations for our setup

Ranked by impact against effort. Both apps are Angular 22 SSR on Express 5 behind Traefik.

1. Done 2026-10-18: osrs-tracker-web sends pages as `no-cache`, not `no-store`, so they can use the bfcache (osrs-tracker/osrs-tracker-web#357; WEBPERF-004, WEBPERF-005, WEBPERF-012).
2. **Don't add Speculation Rules** to either app for now: they're Chromium-only, they speculate only full navigations where both apps use the Angular Router, and prerender runs analytics and SSR on the server for pages nobody may visit. Revisit for a multi-page site. WEBPERF-006, WEBPERF-007.
3. **Measure INP with attribution before optimising**: osrs-tracker-web already sends `onINP` from `web-vitals` 6.2.3 to analytics, without attribution. Import from `web-vitals/attribution` and send the subparts and `interactionTarget`, then pick fixes by subpart. Low effort; not opened as an issue, since no INP problem is known yet. WEBPERF-001 to WEBPERF-003.
4. **Keep compression in Traefik with `br` first, and don't add zstd or Express `compression`**: both apps already do this. Revisit precompressed brotli-11 bundles only if bundle size matters. WEBPERF-013, WEBPERF-014.
5. **Images**: when an image-heavy page arrives, use `NgOptimizedImage` with `priority` on the LCP image and AVIF or WebP files made at build time. WEBPERF-008, WEBPERF-010, WEBPERF-011.
6. **Early Hints**: not worth it now. The pages come from an in-memory page cache or a fast render, and the critical font is preloaded in the HTML. WEBPERF-009.

## Open questions

1. **How event replay scores in INP**: when a click before hydration is replayed, does the Event Timing entry's input delay include the wait for hydration? No Angular or web.dev page says; it needs a throttled lab test with the attribution build. Looked in angular.dev's hydration, incremental hydration and runtime-performance guides at v22.2.3 and web.dev's INP pages.
2. **Which cookie changes evict a `no-store` page in Chrome**: all cookies, including ones set by analytics JavaScript, or only HttpOnly ones? The bfcache-ccns article says only "changes to cookies, or other authorization methods". Chromium's `render_frame_host_impl.cc` counts HttpOnly and other cookie changes separately; the code that decides eviction wasn't found. The milestone at which the rollout reached 100% isn't stated; chromestatus still shows a developer trial.
3. **Where Firefox enforces `no-store`**: its tests assert no-store pages aren't bfcached and bug 261312 is WONTFIX, but the enforcing code wasn't found in `nsDocShell.cpp` or `Document.cpp`. Not tested in a browser. MDN's "Using Firefox 1.5 caching" page is outdated: its HTTPS `no-cache` rule was removed in Firefox 47.
4. **Speculation Rules under `'strict-dynamic'`**: is a nonced inline rules script accepted when the CSP has `'strict-dynamic'`? Not found in Chrome's docs, MDN or the CSP spec.
5. **GA4 under prerender**: Chrome's docs say "Google Analytics" delays until activation; no Google page names gtag.js or GA4. gtag.js itself checks `document.prerendering` and waits for `prerenderingchange` in one code path, not tied to hit sending.
6. **Early Hints end to end through Traefik over HTTP/2 with middlewares**: only Traefik's unit test covers 1xx forwarding, and its opt-in `fastProxy` path wasn't checked.
7. **Whether Playwright disables the bfcache like Puppeteer**: not found.
