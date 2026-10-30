# Animation libraries and their agent tooling: Motion, GSAP, Lenis

Prefix `ANIMLIB`. This file covers the JavaScript animation libraries community design skills pull in: Motion's vanilla API, GSAP with ScrollTrigger, and the Lenis smooth-scroll library. It gives their licences, their bundle cost and server-side behaviour in an Angular 22 SSR app, their reduced-motion defaults, Lenis against native scroll, content hidden until a scroll trigger fires, and the vendors' agent tooling (gsap-skills, Motion's AI Kit, `llms.txt`) with Emil Kowalski's animation skills. Native CSS and Angular animation, which come first, are in `kb-web-animation.md` (ANIM-001 to ANIM-015); WCAG's motion rules are in ACCESS-014 and ANIM-011. Focus, `inert` and ARIA state during enter and exit animations are out of scope here (ANIM-012, ACCESS-013).

Research basis:
- Researched 2026-10-23 (FreekMencke/claude-kb#258, part of roadmap #251) by an Opus 5.5 lead with two Sonnet 5.5 readers (licences and agent tooling: 148k tokens, 43 tool calls, 6.2 min; library docs and source: 198k tokens, 71 tool calls, 7.9 min), then a Sonnet refuter (125k tokens, 46 tool calls, 4.8 min; it found the Lenis anchor flash) and a Sonnet review panel: front-end engineer (103k, 23, 2.9 min), accessibility specialist (77k, 11, 1.5 min), supply-chain security (99k, 30, 3.0 min).
- Read as raw text: motion.dev's `.md` pages and `llms.txt`, gsap.com's `.md` docs and `llms.txt`, the Lenis README, the libraries' source at tags `v14.6.0` (motiondivision/motion), `3.15.0` (greensock/GSAP) and `v1.3.27` (darkroomengineering/lenis), the npm tarballs, WCAG 2.2's Understanding pages, and the tooling repos at the commits each entry names.
- Added 2026-10-30: three.js (ANIMLIB-018, ANIMLIB-019) from its repo at tag `r187` and the npm registry; `three@0.187.0` and `esbuild@0.27.7` installed with `--ignore-scripts` and tested on Node v22.22.0 outside Angular. angular-three was read from npm only.
- Tested in a scratch Angular 22.2.3 app (`@angular/build` 22.2.4, zoneless, SSR with prerender) on Node 24.21.0, with `motion@14.6.0`, `gsap@3.15.0` and `lenis@1.3.27` installed with `--ignore-scripts`, and Playwright 1.64.1 driving Chromium 156.0.8078.4 and WebKit 27.2 headless. Firefox wasn't tested. No community code was installed or run.
- ANIMLIB-017 was added 2026-10-24 (session on Opus 5.5): Kowalski's seven articles as raw text (first through WebFetch from a cloud session that couldn't reach emilkowal.ski, then curled, stripped and grepped on 2026-10-24, which confirmed every quote and absence claim), and Sonner and Vaul read at their tags and in their npm tarballs (`npm pack sonner@2.0.8 vaul@1.1.2`). emilkowalski/skills was still at `2d22863` (`git ls-remote`, 2026-10-24).

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Should I add Motion, GSAP or Lenis to an Angular app? | Not by default: use native CSS and Angular's `animate.enter`/`animate.leave` first (ANIM-007), and a library only for what CSS can't do, with the reason in a comment. Lenis is the hardest to justify. | ANIMLIB-014 |
| Which versions and licences are current? | 2026-10-23: `motion@14.6.0` MIT, `gsap@3.15.0` and `@gsap/react@2.1.2` under GSAP's own "Standard 'no charge' license", `lenis@1.3.27` MIT. | ANIMLIB-001 |
| Can we use GSAP commercially? | Yes, free, all plugins included, since 3.13 (2025-04-30). It isn't open source: no SPDX ID, and use in visual no-code animation builders that compete with Webflow is prohibited. | ANIMLIB-002 |
| How much does each add to an Angular bundle? | gzip, over an empty app: `motion/mini` animate 3.3 kB, Lenis 5.2 kB, Motion `animate` 24.6 kB (27.6 kB with `scroll` and `inView`), GSAP core 27.6 kB, GSAP with ScrollTrigger 45.4 kB. | ANIMLIB-003 |
| Are they safe to import under SSR? | Importing all of them prerendered fine. Calling them on the server: GSAP doesn't throw; Motion's `inView` and `new Lenis()` throw. Call them in `afterNextRender`. | ANIMLIB-004 |
| How do I use Motion or GSAP in an Angular component? | Start in `afterNextRender`, collect everything in `scopeMotion()` or `gsap.matchMedia()`/`gsap.context()`, and stop or revert it in `DestroyRef.onDestroy`. | ANIMLIB-005, ANIMLIB-006 |
| Does each library respect `prefers-reduced-motion` by default? | Lenis yes (since 1.3.26). Motion's vanilla API and GSAP no: tested, both animate transforms under `reduce`. Motion for React's `MotionConfig` defaults to `"never"`. | ANIMLIB-007 |
| Is GSAP's reduced-motion example enough for WCAG? | Likely not: its accessibility page puts `repeat: -1` in the reduce branch, and an endless animation over five seconds beside other content needs a pause control under 2.2.2, whatever the media query. | ANIMLIB-008 |
| Does Lenis break keyboard scrolling or find-in-page? | At rest, no: keys, Tab focus, hash links, find and Angular's scroll restoration behaved as native. But keys pressed during its wheel animation are lost, it hijacks the wheel over nested scroll boxes, and `anchors: true` jumps, snaps back and eases down. | ANIMLIB-009, ANIMLIB-015 |
| Which Lenis options must I set? | `autoRaf: true` (or your own loop: without one the wheel is dead), `allowNestedScroll: true` or `data-lenis-prevent` on scroll boxes, the recommended CSS, and `destroy()` on destroy. | ANIMLIB-010 |
| Why is my scroll-revealed text invisible when printing or searching? | GSAP `from({autoAlpha: 0})` sets `visibility: hidden` inline until the trigger fires: not printable, not findable. Opacity-only reveals stay findable but print blank. | ANIMLIB-011 |
| Should I install gsap-skills or Motion's AI Kit? | Read them rather than install: gsap-skills is markdown only but tells agents to recommend GSAP by default; AI Kit wires a live remote MCP server and a skill that runs an unpinned `npx` package. The `npx skills add` installer sends telemetry by default and pins nothing unless given `#<sha>` (SKILL-066, SKILL-067). | ANIMLIB-012, ANIMLIB-016 |
| What durations and easings do the animation skills recommend? | Emil Kowalski: UI animations under 300 ms, `ease-out` to enter or leave, never `ease-in`; Motion's AI Kit: 150 to 300 ms for small elements, up to about 500 ms for large surfaces. | ANIMLIB-013 |
| Do Kowalski's articles and libraries match his skills? | Mostly. His articles give modals 200–300 ms where the skills give 200–500, his Vaul drawer runs 500 ms, and his Sonner turns all motion off under reduced motion, while the skills say "not zero". No article mentions reduced motion. | ANIMLIB-017 |
| Does three.js work in Angular 22 with SSR, and what does it cost? | Import is safe on the server; create the renderer in `afterNextRender` (it throws "document is not defined" on the server). A minimal WebGL scene is about 132 kB gzip. angular-three 4.2.4 peers Angular <22 and three <0.183, so use three directly. | ANIMLIB-019, ANIMLIB-018 |

## Index

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
| ANIMLIB-018 | three.js 0.187: WebGLRenderer by default, and its in-repo `llms.txt` | fact | three-js, webgl, webgpu, tsl, llms-txt |
| ANIMLIB-019 | three.js in Angular 22: SSR, bundle cost and angular-three's peer range | fact | three-js, angular, ssr, bundle-size, angular-three |

## [ANIMLIB-001] Motion, GSAP and Lenis on 2026-10-23: versions, licences, peers
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: npm registry (`npm view <pkg> dist-tags`, `npm view <pkg>@<v> license peerDependencies peerDependenciesMeta dependencies`, `npm view <pkg> 'time[<v>]'`), [Motion LICENSE.md at v14.6.0](https://raw.githubusercontent.com/motiondivision/motion/v14.6.0/LICENSE.md), [Lenis LICENSE at v1.3.27](https://raw.githubusercontent.com/darkroomengineering/lenis/v1.3.27/LICENSE), [motion.dev/llms.txt](https://motion.dev/llms.txt)
- Related: ANIMLIB-002, ANIMLIB-003, OSS-002, OSS-007

| Package | `latest` | Published | `license` field | Peers |
|---|---|---|---|---|
| `motion` | 14.6.0 | 2026-10-22 | MIT | `react`, `react-dom` `^18.0.0 \|\| ^19.0.0`, both optional; depends on `framer-motion` 14.6.0 and `tslib` |
| `gsap` | 3.15.0 | 2026-04-13 | "Standard 'no charge' license: https://gsap.com/standard-license." | none, no dependencies |
| `@gsap/react` | 2.1.2 | 2025-01-15 | "SEE LICENSE AT https://gsap.com/standard-license" | `gsap ^3.12.5`, `react >=17` |
| `lenis` | 1.3.27 | 2026-10-15 | MIT | `react`, `vue`, `@nuxt/kit`, all optional |

`framer-motion` is the same release as `motion` (14.6.0, published two minutes later). Motion's and Lenis's LICENSE files at those tags are MIT and match the copies in the tarballs. GSAP ships no LICENSE file in the tarball or in greensock/GSAP at tag `3.15.0`: the licence exists only on gsap.com (ANIMLIB-002).

Motion's paid parts aren't in the `motion` package: llms.txt says "The motion, motion/react and motion-v packages are free and MIT-licensed. Motion+ is a separate paid product", which covers components such as Carousel, Ticker and AnimateNumber from `motion-plus`, installed from a private registry with a token. An agent that writes `import … from "motion-plus/react"` has picked a paid product.

`motion` exports `.`, `./mini`, `./react`, `./react-mini`, `./react-m` and others; Angular code uses `motion` or `motion/mini` (ANIMLIB-005).

## [ANIMLIB-002] GSAP's Standard licence: free for commercial use, not open source
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [GSAP Standard License, Wayback snapshot of 2026-10-17](https://web.archive.org/web/20261017164628/https://gsap.com/community/standard-license/), [GSAP 3.13 release post](https://gsap.com/blog/3-13/), [SPDX License List JSON](https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json), `gsap@3.15.0` tarball
- Related: ANIMLIB-001, OSS-002, OSS-008, OSS-010

GSAP is free for any website or app, commercial ones included, under Webflow's own licence: no SPDX ID (list 3.29.0), so not OSI-approved.

- **Grant:** to "use, reproduce, display, and implement GSAP Products" (everything on gsap.com, "including… related plugins") "on any website, web application, or digital interface by any person or entity". No modify, distribute or sublicense right is named.
- **Prohibited:** use "in tools that allow users to build visual animations without code" that compete with Webflow's "visual animation building capabilities"; reverse engineering to create "Competitive Products" (any tool to "create, edit, or manage animations through a visual interface or builder similar to Webflow"); removing notices or branding.
- **FAQ:** "AI-generated code is not a 'Prohibited Use'"; the formerly "members-only" plugins "like SplitText and MorphSVG can be used in commercial projects at no charge". Free since 3.13 (post of 2025-04-29); the 3.15.0 tarball contains every plugin.
- **Termination and changes:** Webflow "may terminate this GSAP License… in its discretion if you fail to comply"; reject a revision and you're "prohibited from using versions of the GSAP Products released after the effective date". It's "subject to Webflow's Terms of Service". Last modified 2025-05-30.

On 2026-10-23 `gsap.com/standard-license`, the URL in the npm field and every file header, redirected to a "Forums Temporarily Offline" page, so this is the archived text. An old "end users are not charged a fee" summary is in an HTML comment, not shown. A licence gate such as dependency-review-action's `allow-licenses` (OSS-008) won't match the free-text field.

## [ANIMLIB-003] Bundle cost in an Angular 22 production build
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: local test (below), [Motion: animate](https://motion.dev/docs/animate.md)
- Related: ANIMLIB-005, ANIMLIB-014, WEBPERF-002, NG-004, ANIMLIB-019

Size added to the initial JavaScript of an empty Angular 22 app by one import path, each used once inside `afterNextRender` so nothing was tree-shaken away.

| Import | gzip -6 added | Angular's transfer estimate added |
|---|---|---|
| `animate` from `motion/mini` | 3,263 B | 2.86 kB |
| Lenis (`new Lenis({ autoRaf: true })`) | 5,216 B | 4.61 kB |
| `animate` from `motion` | 24,638 B | 22.01 kB |
| `animate`, `scroll`, `inView` from `motion` | 27,561 B | 24.55 kB |
| `gsap` core (`gsap.from`) | 27,638 B | 24.97 kB |
| `gsap` plus `ScrollTrigger` | 45,420 B | 40.74 kB |
| ANIMLIB-005's pattern: `scopeMotion`, `inView`, `animate` | 25,699 B | 22.96 kB |
| ANIMLIB-006's pattern: `gsap.matchMedia` plus ScrollTrigger | 45,459 B | 40.76 kB |

Baseline: 229,443 B raw, 72,213 B gzip -6, 64.03 kB estimated. Angular's "Estimated transfer size" is brotli (`@angular/build` calls `brotliCompress`), hence lower than gzip. Motion's docs say "mini (3.2kb) and hybrid (22kb)", which matches. Motion's `scroll` and `inView` exist only in `motion`, not `motion/mini` (ANIMLIB-005). Lenis's CSS adds a few hundred bytes.

Command: a script rewrote `src/app/app.ts` per variant, ran `npx ng build` (production, `outputHashing: all`), summed `gzip -6 -c` over `dist/animapp/browser/*.js` (no lazy chunks in this app, so all initial), and read the CLI's "Initial total" row.

Tested 2026-10-23, `@angular/build@22.2.4` with `@angular/core@22.2.3`, `motion@14.6.0`, `gsap@3.15.0`, `lenis@1.3.27`, Node 24.21.0: one build per variant.

## [ANIMLIB-004] SSR: importing is safe, calling on the server isn't always
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: local test (below), [GSAP `gsap-core.js` at 3.15.0](https://raw.githubusercontent.com/greensock/GSAP/3.15.0/src/gsap-core.js), [GSAP `ScrollTrigger.js` at 3.15.0](https://raw.githubusercontent.com/greensock/GSAP/3.15.0/src/ScrollTrigger.js), [Lenis `lenis.ts` at v1.3.27](https://raw.githubusercontent.com/darkroomengineering/lenis/v1.3.27/packages/core/src/lenis.ts), [Motion: scopeMotion](https://motion.dev/docs/scope-motion.md)
- Related: ANIMLIB-005, ANIMLIB-006, ANIMLIB-010, NG-008, ANIMLIB-019

All three can be imported at the top of a component in an SSR app; only some can be called on the server. Start every animation in `afterNextRender`, which runs only in the browser.

- **Import:** every bundle variant in ANIMLIB-003, including `gsap.registerPlugin(ScrollTrigger)` at module level, prerendered without error. All three packages declare `"sideEffects": false`.
- **Called in a constructor during prerender:**

| Call on the server | Result |
|---|---|
| `gsap.registerPlugin(ScrollTrigger)`, `gsap.from(el, { scrollTrigger })` | no error |
| `animate(el, …)` from `motion` | no error |
| `inView(el, …)` from `motion` | `IntersectionObserver is not defined` |
| `animate(el, …)` from `motion/mini` | "No valid elements provided" (the WAAPI path needs real elements; the hybrid path accepts the server's element object) |
| `new Lenis()` | `window is not defined` |

GSAP guards with `_windowExists()`; `registerPlugin` skips non-headless plugins such as ScrollTrigger on the server without saying so, so `gsap.to` there does nothing useful. Lenis reads `window.matchMedia` in a class field. Motion's only SSR note (scopeMotion) says "Without `window`, setup runs once and Motion adds no media query listeners"; there's no page on server imports. No library touches the DOM in the server HTML unless called there. In Vitest with jsdom, `new Lenis()` also needs `window.matchMedia` stubbed (jsdom lacks it).

Tested 2026-10-23, Angular 22.2.3 SSR with `RenderMode.Prerender`, Node 24.21.0, the three packages at the versions in ANIMLIB-001.

## [ANIMLIB-005] Motion's vanilla API in an Angular component
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Motion: animate](https://motion.dev/docs/animate.md), [Motion: scopeMotion](https://motion.dev/docs/scope-motion.md), [Motion: inView](https://motion.dev/docs/inview.md), [Motion: scroll](https://motion.dev/docs/scroll.md), [Motion: performance](https://motion.dev/docs/performance.md), [motion.dev/llms-full.txt](https://motion.dev/llms-full.txt), local test
- Related: ANIMLIB-003, ANIMLIB-004, ANIMLIB-007, ANIM-005, ANIM-008, NG-004

Motion has no Angular docs (`angular` appears nowhere in `llms.txt` or the 817,600-byte `llms-full.txt`), but its vanilla JavaScript API works in a component.

```ts
import { DestroyRef, ElementRef, afterNextRender, inject } from '@angular/core';
import { animate, inView, scopeMotion } from 'motion';

constructor() {
  const host = inject(ElementRef).nativeElement as HTMLElement;
  const destroyRef = inject(DestroyRef); // inject() only works here, not inside the callback
  afterNextRender(() => {
    const scope = scopeMotion(() => {
      for (const el of host.querySelectorAll<HTMLElement>('.card')) {
        animate(el, { opacity: 0, transform: 'translateY(16px)' }, { duration: 0 }); // hide in JS only, never in CSS
        inView(el, () => { animate(el, { opacity: 1, transform: 'none' }, { duration: 0.25 }); });
      }
    }, { matchMedia: 'motion' }); // runs only while the user has no reduced-motion preference
    destroyRef.onDestroy(() => scope.stop());
  });
}
```

`scopeMotion()` (since 14.5.0) "collects everything you start inside it: animations, gestures, and scroll and viewport listeners"; `stop()` or `cancel()` ends them all. Without it: `animate()` returns controls (`stop()` commits values, `cancel()` reverts), and `inView()` and `scroll()` return a stop function.

- **mini or hybrid:** `motion/mini` wraps the Web Animations API and "can only animate registered CSS properties"; independent transforms (`x`, `y`), sequences, colour strings and `scroll`/`inView` need `motion`.
- **Main thread:** "The JavaScript code will **always** run on the main JS thread"; `transform` and `opacity` "usually animate on the compositor"; "Animating a CSS variable isn't hardware accelerated". Independent transforms (`x`, `y`) are accelerated only since 14.2.0, on the vendor's word (ANIMLIB-013), so the example uses `transform`. Find janky frames with LoAF (WEBPERF-003).
- **Zoneless** (NG-004): the library's `requestAnimationFrame` ticks don't schedule change detection.

Tested 2026-10-23, zoneless Angular 22.2.3, `motion@14.6.0`, Chromium 156, with this pattern on one paragraph: hidden below the fold, visible under `reduce` and without JavaScript, visible again when the preference switched to `reduce` mid-page (the scope restores inline styles), revealed when `window.find()` scrolled it in, and rebuilt without errors after a route change and Back. Stopping inside `stop()` was read from source, not observed. A Zone.js app wasn't tested.

## [ANIMLIB-006] GSAP in an Angular component: context, matchMedia and ScrollTrigger cleanup
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [GSAP: gsap.matchMedia()](https://gsap.com/docs/v3/GSAP/gsap.matchMedia().md), [GSAP: gsap.context()](https://gsap.com/docs/v3/GSAP/gsap.context().md), [GSAP: JS frameworks](https://gsap.com/resources/frameworks.md), [GSAP: ScrollTrigger mistakes](https://gsap.com/resources/st-mistakes.md), local test
- Related: ANIMLIB-004, ANIMLIB-007, ANIMLIB-008, ANIMLIB-011, ANIM-008, ANIM-009, WEBPERF-003

GSAP is "framework-agnostic"; its docs name Angular only in that sentence and in `scope` ("this Element or React Ref or Angular ElementRef"). `useGSAP()` is React-only. The Angular equivalent:

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger); // once, at module level (ANIMLIB-004)

constructor() {
  const host = inject(ElementRef);
  const destroyRef = inject(DestroyRef); // inject() only works here
  afterNextRender(() => {
    const mm = gsap.matchMedia(host); // scopes selector text to this component
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      for (const card of gsap.utils.toArray<HTMLElement>('.card')) { // one trigger per card
        gsap.from(card, { opacity: 0, y: 16, scrollTrigger: { trigger: card, once: true } });
      }
    });
    destroyRef.onDestroy(() => mm.revert());
  });
}
```

A selector `trigger` resolves to its first match, so one trigger would reveal every card at once; `toArray` inside the handler uses the scope.

- `gsap.matchMedia()` "creates a gsap.context()"; everything made in a matching handler is "reverted automatically" when the query stops matching, and `mm.revert()` reverts all. Wrapping it in another context is "redundant". Animations started later in event handlers join with `ctx.add()`.
- SPAs: "SPAs don't automatically destroy and re-create your ScrollTriggers so you need to do that yourself"; revert on destroy does it.
- `scroll-behavior: smooth` on `<html>` breaks ScrollTrigger's measurements: "just avoid using `scroll-behavior: smooth;`".
- After layout changes (`@defer` blocks, late images), call `ScrollTrigger.refresh()`; it "Recalculates the positioning of all of the ScrollTriggers". Not tested here.
- GSAP runs every frame in JavaScript on the main thread; keep to `transform` and `opacity` (WEBPERF-003 for jank).
- Under the no-preference-only handler, reduced-motion users get the final state because nothing runs. `from()` hides on creation, so a card already in the first viewport flashes visible, hidden, then animates; ANIMLIB-011 covers hidden-until-triggered content.

Tested 2026-10-23, zoneless Angular 22.2.3, `gsap@3.15.0`, Chromium 156: a `gsap.context()` ScrollTrigger reveal reverted on destroy (`ScrollTrigger.getAll().length` 1, 0 after a route change, 1 after Back); `matchMedia` with a `reduce` condition and `duration: 0` jumped to the end under reduced motion. `gsap.matchMedia(host)` accepting an `ElementRef` was read from source (`gsap-core.js`: `value.current || value.nativeElement || value`), and the per-card loop wasn't run.

## [ANIMLIB-007] Reduced motion: each library's default and what it covers
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Motion: MotionConfig](https://motion.dev/docs/react-motion-config.md), [Motion: accessibility](https://motion.dev/docs/react-accessibility.md), [Motion `effects.ts` at v14.6.0](https://raw.githubusercontent.com/motiondivision/motion/v14.6.0/packages/motion-dom/src/animation/animate/effects.ts), [GSAP: gsap.matchMedia()](https://gsap.com/docs/v3/GSAP/gsap.matchMedia().md), [Lenis README at v1.3.27](https://raw.githubusercontent.com/darkroomengineering/lenis/v1.3.27/README.md), [Lenis v1.3.26 release](https://github.com/darkroomengineering/lenis/releases/tag/v1.3.26), local test
- Related: ACCESS-014, ANIM-010, ANIM-011, ANIMLIB-005, ANIMLIB-006, ANIMLIB-008

| Library and surface | Default | How to honour it | Covers |
|---|---|---|---|
| Motion for React, `MotionConfig reducedMotion` | `"never"` | `reducedMotion="user"` | "transform and layout animations"; keeps `opacity`, `backgroundColor` (docs and source; React not tested) |
| Motion vanilla `animate`, `scroll`, `inView` | nothing | `scopeMotion(setup, { matchMedia: 'motion' })`, or the `reduceMotion: true` option (typed in `motion-dom`, not on the docs pages) | whatever you skip |
| GSAP 3.15.0 | nothing (no "reduced" in `src/`) | `gsap.matchMedia()` with `(prefers-reduced-motion: reduce)` | whatever you skip |
| Lenis 1.3.27 | on: `respectReducedMotion: true` | already on | wheel smoothing (`lerp` forced to 1) and programmatic `scrollTo`, which "jump instantly" (tested through anchor links) |

Motion's vanilla `reduceMotion` option is typed as "`undefined`: Use device preference", but for a plain element the code reads only `transition.reduceMotion`; `true` makes transforms instant regardless of the device and still animates opacity. Lenis added the behaviour in v1.3.26 (2026-08-05, "respect `prefers-reduced-motion: reduce`"), on by default in a patch release; it still intercepts the wheel.

WCAG: skipping motion under `reduce` is technique C39 for 2.3.3 (AAA), which covers scroll-triggered reveals and arguably Lenis's eased scroll; it doesn't meet 2.2.2 (ACCESS-014, ANIMLIB-008). Nothing tested here flashes three times a second (2.3.1).

Tested 2026-10-23, Chromium 156 with Playwright `reducedMotion: 'reduce'`, a 2-second linear `x: 100`, sampled at 400 ms: `gsap.to` 20 and Motion `animate` 19.5 (both still animating); Motion `reduceMotion: true` 100 with opacity 0.80; `scopeMotion(…, { matchMedia: 'motion' })` didn't run; GSAP `matchMedia` with `duration: reduce ? 0 : 2` 100. Lenis wheel: 589 px of 600 after 50 ms, against 198 px with smoothing.

## [ANIMLIB-008] An endless loop in the reduced-motion branch likely fails WCAG 2.2.2
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [GSAP: Accessible Animation](https://gsap.com/resources/a11y.md), [GSAP: gsap.matchMedia()](https://gsap.com/docs/v3/GSAP/gsap.matchMedia().md), [Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- Related: ACCESS-014, ANIM-011, ANIMLIB-006, ANIMLIB-007

GSAP's accessibility page shows, under the comment "this user has specified 'reduced motion', so either remove the animations or simplify them down":

```js
mm.add("(prefers-reduced-motion: reduce)", (context) => {
  gsap.from(".box", { opacity: 0, repeat: -1, duration: 3, ease: "none"})
});
```

That fades in from nothing every 3 seconds, forever, with a hard reset each cycle. Under 2.2.2 (ACCESS-014), anything that starts automatically, lasts over five seconds and sits beside other content needs a pause, stop or hide control unless essential; prefers-reduced-motion isn't one. The Understanding page adds that starting "as a result of an indirect interaction (such as… scrolling an element into view)" counts, and such content "also potentially fails 2.3.3 Animation from Interactions". Whether an opacity loop is "moving, blinking", and whether a demo box sits beside other content, is a reading of the criterion, not a W3C ruling. A 3-second cycle is far from 2.3.1's three flashes a second.

So in a reduce branch: play once and stop (`repeat: 0`), or show the end state, as the `gsap.matchMedia()` page's demos and gsap-skills' `duration: reduceMotion ? 0 : 2` do (ANIMLIB-012). A loop in the no-preference branch needs the same pause control; `gsap.matchMediaRefresh()` serves a site-wide motion toggle.

## [ANIMLIB-009] Lenis at rest behaves like native scroll
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: local test (below), [Lenis README at v1.3.27](https://raw.githubusercontent.com/darkroomengineering/lenis/v1.3.27/README.md), [Lenis `lenis.ts` at v1.3.27](https://raw.githubusercontent.com/darkroomengineering/lenis/v1.3.27/packages/core/src/lenis.ts)
- Related: ANIMLIB-015, ANIMLIB-010, ACCESS-012

Lenis smooths only the mouse wheel (and touch with `syncTouch`): it calls `preventDefault()` on `wheel` and moves the real `window` scroll with `scrollTo({ behavior: 'instant' })` each frame, so `scrollY` stays true. Its source has no `keydown` handler. With no animation running, it matched native scroll:

| Behaviour, default Lenis against no Lenis | Result |
|---|---|
| Space, PageDown, End, Home, ArrowDown | same positions as native (700, 1400, 6928, 0, 40) |
| Tab to a button far down | focused and scrolled into view, as native |
| `<a href="#s5">` (default `anchors: false`) | same jump; `location.hash` and `:target` updated |
| `window.find()`, then a wheel step | found, scrolled there; the wheel continued from there, no snap back |
| `position: sticky` header | stayed at top 0 |
| Angular `withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })` | 0 on the new route, the old position restored on Back, wheel fine afterwards |
| Wheel, 600 px | smoothed over about half a second (198 px after 50 ms); native jumps |

What goes wrong while it animates, over nested scroll boxes and with `anchors: true` is in ANIMLIB-015. Untested: Tab focus during a running Lenis animation, browser zoom, real Ctrl+F (`window.find()` stood in), touch, Safari's cap ("capped to 60fps on Safari… and 30fps on low power mode", README), screen readers, Firefox.

Test trap: under Angular's `<base href="/">`, `href="#s5"` resolves to `/#s5` and drops the query string, so on `/?x=1` it loads a new page; the test kept the query.

Tested 2026-10-23, `lenis@1.3.27` with `autoRaf: true` and `lenis/dist/lenis.css`, Angular 22.2.3 SSR, Playwright 1.64.1: Chromium 156 for all rows, WebKit 27.2 for anchors and routing (same results).

## [ANIMLIB-010] Lenis setup: the options to set and the traps
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Lenis README at v1.3.27](https://raw.githubusercontent.com/darkroomengineering/lenis/v1.3.27/README.md), [Lenis `lenis.ts` at v1.3.27](https://raw.githubusercontent.com/darkroomengineering/lenis/v1.3.27/packages/core/src/lenis.ts), [lenis.dev/llms.txt](https://lenis.dev/llms.txt), [Motion: Lenis](https://motion.dev/docs/lenis.md), local test
- Related: ANIMLIB-004, ANIMLIB-009, ANIMLIB-014

```ts
constructor() {
  const destroyRef = inject(DestroyRef); // inject() only works here
  afterNextRender(() => {
    const lenis = new Lenis({ autoRaf: true, allowNestedScroll: true });
    destroyRef.onDestroy(() => lenis.destroy());
  });
}
```
plus `@import "lenis/dist/lenis.css";` in global styles ("Importing `lenis` doesn't load it", Motion's Lenis page).

- **`autoRaf` defaults to `false`.** Without it or your own `lenis.raf(time)` loop, the wheel is cancelled and nothing moves: tested, `scrollY` stayed 0 after a 600 px wheel while PageDown still worked. With GSAP, the README drives it from `gsap.ticker` and calls `lenis.on('scroll', ScrollTrigger.update)`.
- **Nested scroll boxes** (`allowNestedScroll: false` by default) get hijacked (ANIMLIB-015). `allowNestedScroll: true` fixed it in the test but "checks the DOM tree on every scroll event"; `data-lenis-prevent` on each box also fixed it.
- **Leave `anchors` off:** with `anchors: true` a hash link jumped, snapped back near the top and eased down (ANIMLIB-015); without it the native jump is clean.
- **Not supported:** CSS scroll-snap ("you must use (lenis/snap)"), wheel over iframes ("they don't forward wheel events").
- **`destroy()`** removes listeners and the `lenis` classes (a 1.3.27 fix). Tested from `DestroyRef.onDestroy` on a route change: the `lenis` class went and the wheel was native again (300 px within 100 ms).
- **Docs disagree:** the README lists `duration` default `1.2`, but the constructor has no default and uses `lerp: 0.1`. lenis.dev's `llms.txt` lists `smoothTouch` and `touchMultiplier` default 2; 1.3.27 has `syncTouch` and default 1. Use the README and `lenis.d.ts`, not `llms.txt`.

Tested 2026-10-23, `lenis@1.3.27`, Angular 22.2.3, Chromium 156 and WebKit 27.2.

## [ANIMLIB-011] Content hidden until a scroll trigger fires: no JS, print, find-in-page
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [GSAP: FOUC](https://gsap.com/resources/fouc.md), [GSAP: immediateRender](https://gsap.com/resources/immediaterender.md), [GSAP: ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger.md), [Motion: React scroll animations](https://motion.dev/docs/react-scroll-animations.md), [Motion: motion component](https://motion.dev/docs/react-motion-component.md), [MDN: `visibility`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/visibility), local test
- Related: ANIMLIB-005, ANIMLIB-006, ANIMLIB-007, ANIM-005, ACCESS-014

A scroll reveal hides content from when its script runs until the trigger fires: missing from print and, if hidden with `visibility`, from find-in-page, the tab order and screen readers.

| State of a below-the-fold paragraph | GSAP `from({ autoAlpha: 0 })` with ScrollTrigger | Motion `inView` with `opacity: 0` set in JS |
|---|---|---|
| SSR HTML, no JavaScript | visible | visible |
| After hydration, not yet scrolled to | `visibility: hidden; opacity: 0` inline | `opacity: 0` inline |
| `window.find()` | not found | found, scrolled in, then revealed |
| Print media | hidden | blank (opacity 0) |
| Scrolled into view | visible | visible |

`from()` tweens set `immediateRender: true`, hiding on creation. GSAP's FOUC fix (`visibility: hidden` in CSS) hides content even without JS and needs "`<noscript>` tags" to undo it; Motion for React's `initial={{ opacity: 0 }}` is "reflected in the server-generated output". `visibility: hidden`: "The element cannot receive focus" and isn't "announced by screen reading technology" (MDN).

So: hide in JS only (never CSS, so no `<noscript>` needed), only under `prefers-reduced-motion: no-preference`, with opacity and transform rather than `visibility` (ANIMLIB-005's pattern), plus `@media print { .reveal { opacity: 1 !important; visibility: visible !important; transform: none !important; } }`, which beat the inline styles for both libraries. `opacity: 0` content stays focusable while invisible; focus into it and real Ctrl+F weren't tested.

Tested 2026-10-23, Angular 22.2.3 SSR, `gsap@3.15.0`, `motion@14.6.0`, Chromium 156 (Playwright `javaScriptEnabled: false` and `emulateMedia({ media: 'print' })`).

## [ANIMLIB-012] gsap-skills and Motion's AI Kit: what they run, write and fetch
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [greensock/gsap-skills at aed9cfd](https://github.com/greensock/gsap-skills/tree/aed9cfd3277740755f6bfc1155c7aa645403b760), [motiondivision/ai-kit at 78a83b1](https://github.com/motiondivision/ai-kit/tree/78a83b1485fa70dab9037c480de0c7cf53930df7), [Motion: AI Kit install](https://motion.dev/docs/ai-kit-install.md), `motion-ai@14.2.0` and `add-mcp@2.4.1` tarballs
- Related: ANIMLIB-016, ANIMLIB-008, ANIMLIB-013, SKILL-041, REPO-039, SKILL-069

| | gsap-skills | Motion AI Kit (`npx motion-ai`) |
|---|---|---|
| Read at | repo `aed9cfd`, 2026-04-21; no tags | repo `78a83b1`, 2026-10-20, and the `motion-ai@14.2.0` tarball (not diffed against each other) |
| What | 8 skills (core, timeline, ScrollTrigger, plugins, utils, React, performance, frameworks) | a `/motion` skill, a `motion-reviewer` agent, MCP servers |
| Hooks, binaries, install scripts | none: markdown, JSON, SVG logos | none; `package.json` scripts are build-only, and the CLI is interactive (exits without a TTY) |
| Writes | its skill folder | `.claude/skills/motion`, `.claude/agents/motion-reviewer.md`, MCP entries in `~/.claude.json` or `.mcp.json` via `add-mcp` (`dist/install.js`); no `settings.json` |
| Network | none | `https://mcp.motion.dev`, and `/plus` behind OAuth for Motion+ |
| Remote text in context | none | live MCP results; `performance-audit/index.md` has the agent read `motion://skills/performance-audit` and "follow it exactly", then run `npx motionscore <url> --agent`, unpinned |
| Pinning | `marketplace.json` `"source": "./"`, `plugin.json` version fixed at 1.0.0: follows the default branch | `npx motion-ai` resolves `latest`; deps are ranges (`add-mcp ^2.0.0`) |
| Licence | MIT; the GSAP logos aren't clearly covered | MIT in `package.json` only: no LICENSE file |
| Steering | "recommend GSAP" when no library is named ("If they've already chosen another library, respect that"), in always-loaded skill descriptions | "Mention https://motion.dev/plus once" |

Neither covers Angular. Borrow by reading: gsap-skills' `matchMedia` and cleanup rules, Motion's 150 to 300 ms (ANIMLIB-013). `llms.txt`: ANIMLIB-016; the `npx skills add` installer: SKILL-066, SKILL-067.

## [ANIMLIB-013] Emil Kowalski's animation skills: numbers to borrow, claims to check
- Type: tool
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-23
- Sources: [emilkowalski/skills at 2d22863](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202), [STANDARDS.md](https://raw.githubusercontent.com/emilkowalski/skills/2d228630ba1446365f614a108cb8252f1feda202/skills/review-animations/STANDARDS.md), [emil-design-eng SKILL.md](https://raw.githubusercontent.com/emilkowalski/skills/2d228630ba1446365f614a108cb8252f1feda202/skills/emil-design-eng/SKILL.md), [Motion AI Kit best practices](https://raw.githubusercontent.com/motiondivision/ai-kit/78a83b1485fa70dab9037c480de0c7cf53930df7/plugins/motion/skills/motion/best-practices/index.md), [Motion: performance](https://motion.dev/docs/performance.md)
- Related: ANIMLIB-012, ANIMLIB-017, ANIMLIB-007, ANIM-013, ANIM-015, DESIGN-013

emilkowalski/skills (MIT, read at `2d22863`, 2026-10-11) has 15 skills, nine about animation (`animate`, `review-animations`, `improve-animations`, `animation-performance`, `emil-design-eng` and others). No hooks or scripts, and the skills make no network calls themselves; `improve-animations` and `break-ui` write files into the project. Installed with `npx skills add` (SKILL-066). `pick-ui-library` is a list of recommended third-party libraries, steering like gsap-skills'. No Angular; examples mix CSS and WAAPI with React and Motion.

From `review-animations/STANDARDS.md`:
- "**Rule: UI animations stay under 300ms.**" Button press "100–160ms", tooltips "125–200ms", dropdowns "150–250ms", modals and drawers "200–500ms".
- Entering or exiting `ease-out`, moving `ease-in-out`; "**Never `ease-in` on UI.**" Curves such as `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.
- "100+ times/day (keyboard shortcuts, command palette toggle) | No animation. Ever."
- "**Never `scale(0)`.** Start from `scale(0.9–0.97)` + `opacity: 0`." Stagger "30–80ms between items".
- Reduced motion: "fewer and gentler animations, not zero — keep transitions that aid comprehension, remove movement/position changes".

Motion's AI Kit agrees on range: "about 150 to 300 ms for small elements, and up to about 500 ms for large surfaces". These are one practitioner's and one vendor's guidance, not research; ANIM-013 has NN/g's and Material's numbers.

Out of date: `animation-performance` says Motion's `x`/`y`/`scale` shorthands "are implemented with CSS variables, and animated CSS variables aren't accelerated" (`emil-design-eng` and STANDARDS.md: they run on the main thread); Motion's performance page now says independent transforms "are hardware accelerated, just like animating `transform` directly" (Motion CHANGELOG 14.2.0, 2026-10-13: "Hardware accelerated independent transforms like `x`, `y`, `scaleX` etc."; AI Kit changelog 7.0.1, 2026-10-15). The skill predates that release. That's the vendor's claim, 10 days old with a fix since; no independent compositor test was found.

## [ANIMLIB-014] When not to use each library
- Type: recommendation
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-23
- Sources: synthesis of ANIMLIB-003, ANIMLIB-007, ANIMLIB-009, ANIMLIB-010, ANIMLIB-011, ANIMLIB-015, CSS-008, CSS-009, CSS-010
- Related: ANIMLIB-003, ANIMLIB-009, CSS-009, CSS-010, DESIGN-013, ANIM-007

Order of preference: native CSS (transitions, `@starting-style`, view transitions, scroll-driven animations: CSS-008 to CSS-010), and Angular 22's `animate.enter`/`animate.leave` for elements it inserts and removes (ANIM-003, ANIM-007); then a library with its reason in a comment. Scroll-driven animations: Chrome 115 and Safari 26, Firefox from 159 (CSS-010).

| Library | Reasonable reason | Don't use it for |
|---|---|---|
| `motion/mini` (3.3 kB) | springs or sequenced WAAPI animations from TypeScript, with promises | anything a CSS transition or `@starting-style` does |
| `motion` (24.6 kB+) | sequences, `scroll()` with a JS fallback where `animation-timeline` isn't supported | a fade or slide in; scroll effects in browsers that have scroll-driven animations |
| GSAP (27.6 kB, 45.4 kB with ScrollTrigger) | long timelines, pinning and scrubbing, SplitText, MorphSVG | small UI transitions; projects needing an OSI licence (ANIMLIB-002) |
| Lenis (5.2 kB) | a design that depends on smoothed wheel scrolling synced to WebGL | "feel": it changes only the wheel, drops keys pressed mid-animation, hijacks nested scroll boxes unless configured, and is scroll-jacking that users didn't ask for |

Whatever you pick, animate `transform` and `opacity` only: GSAP and Motion's `motion` run every frame on the main thread, and layout properties (`width`, `top`) add layout and paint. None of the three removes the need to write the reduced branch yourself (ANIMLIB-007). Community "awwwards-style" skills that add GSAP and Lenis by default get the cost without the reason.

## [ANIMLIB-015] Lenis drops keys mid-animation, hijacks nested scroll boxes and flashes on anchors
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: local test (below), [darkroomengineering/lenis#107](https://github.com/darkroomengineering/lenis/issues/107) (maintainer comment, 2023-02-03; open on 2026-10-23; the test, not the issue, shows it holds in 1.3.27), [Lenis `lenis.ts` at v1.3.27](https://raw.githubusercontent.com/darkroomengineering/lenis/v1.3.27/packages/core/src/lenis.ts), [Lenis README at v1.3.27](https://raw.githubusercontent.com/darkroomengineering/lenis/v1.3.27/README.md)
- Related: ANIMLIB-009, ANIMLIB-010, ANIMLIB-014

Three failures with default or documented options, none of which native scroll has:

| Case | Lenis 1.3.27 | Native |
|---|---|---|
| Home pressed 60 ms into a 2000 px wheel scroll | **ignored**: ended at 2000 | 0 |
| Wheel over a nested `overflow: auto` box | **the page scrolled**, the box stayed at 0 | the box scrolled 300 px |
| `<a href="#s5">` with `anchors: true` | **jumped to the target, snapped back near the top (705 px), then eased down** over about a second | one jump |

- **Keys mid-animation:** the maintainer on issue #107 (open): "Scroll events (keyboard, grab scrollbar, etc.) catched during this animation time are ignored because there is no way to prevent them, Lenis is only preventing wheel events."
- **Nested boxes:** `allowNestedScroll` defaults to `false`; `true` or `data-lenis-prevent` on the box fixed it (ANIMLIB-010).
- **Anchors:** Lenis's click handler calls `scrollTo()` without `preventDefault()`, so the browser jumps first and Lenis animates from its stale position. Hash and `:target` still update. Under reduced motion it was one jump. Leave `anchors` off.

Lenis's only benefit is wheel smoothing (ANIMLIB-014).

Tested 2026-10-23, `lenis@1.3.27`, Angular 22.2.3 SSR, Playwright 1.64.1: Chromium 156 for all rows, WebKit 27.2 for nested boxes and anchors (same results). The anchor flash was first found by the refute pass on a plain page with `lenis.min.js` 1.3.27 from jsDelivr.

## [ANIMLIB-016] Vendor `llms.txt` files: size, pinning and what they tell agents
- Type: tool
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [motion.dev/llms.txt](https://motion.dev/llms.txt), [gsap.com/llms.txt](https://gsap.com/llms.txt), [lenis.dev/llms.txt](https://lenis.dev/llms.txt), [Motion: AI Kit install](https://motion.dev/docs/ai-kit-install.md)
- Related: ANIMLIB-012, ANIMLIB-010, SKILL-066, SKILL-067, SKILL-068, ANIMLIB-018

All three vendors publish an `llms.txt`; none is versioned or kept in the library's repo at a tag, so a live fetch puts unpinned vendor text in an agent's context. Fetched 2026-10-23 with `curl -L`:

| File | Bytes | Content | Angular |
|---|---|---|---|
| motion.dev/llms.txt | 65,038 | docs index plus agent pointers: "The Motion MCP server at https://mcp.motion.dev… is free and needs no account", the AI Kit installer, and the paid Motion+ components; every docs page also as `.md` | none |
| gsap.com/llms.txt | 25,415 | a plain index of 412 relative `.md` links | none |
| lenis.dev/llms.txt (redirected from lenis.darkroom.engineering) | 8,181 | a hand-written overview; stale against 1.3.27 (`smoothTouch`, ANIMLIB-010) | none |

So keep a dated copy and grep it rather than fetching on every run, and prefer the vendor's `.md` docs page or the README at a tag for a figure. Motion's file also steers agents towards its MCP server and Motion+, like the skills in ANIMLIB-012.

gsap-skills and Emil Kowalski's skills install with `npx skills add`: its telemetry, lock files and pinning (`owner/repo#<full sha>`) are in SKILL-066 and SKILL-067.

## [ANIMLIB-017] Emil Kowalski's articles and libraries against his skills
- Type: comparison
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-24
- Sources: [Agents with Taste](https://emilkowal.ski/ui/agents-with-taste), [7 Practical Animation Tips](https://emilkowal.ski/ui/7-practical-animation-tips), [You Don't Need Animations](https://emilkowal.ski/ui/you-dont-need-animations), [Building a Drawer Component](https://emilkowal.ski/ui/building-a-drawer-component), [Building a Toast Component](https://emilkowal.ski/ui/building-a-toast-component), [The Magic of Clip Path](https://emilkowal.ski/ui/the-magic-of-clip-path), [Developing Taste](https://emilkowal.ski/ui/developing-taste), [Sonner `src/styles.css` at v2.0.8](https://github.com/emilkowalski/sonner/blob/6739aca5f668a33a4fd1d2fd9f758dff95c57466/src/styles.css), [Vaul `src/style.css` at v1.1.2](https://github.com/emilkowalski/vaul/blob/73d06cdd3fd990bf4b83214cfe240c246908af0d/src/style.css)
- Related: ANIMLIB-013, ANIM-008, ANIM-010, ANIM-015, DSKILL-005

His seven articles at emilkowal.ski/ui carry no dates, in the text, meta tags or JSON-LD. They were read 2026-10-24 as raw text (curl, tags stripped, grepped). The libraries were read at their tags and in the npm packages (`sonner@2.0.8` `dist/styles.css`, `vaul@1.1.2` `dist/index.mjs`).

- **Modals and drawers.** Agents with Taste's table gives 100–150 ms for micro-interactions, 150–250 ms for standard UI and 200–300 ms for modals and drawers, and says "Exit animations can be ~20% faster than entrance". His skills give 200–500 ms (ANIMLIB-013). His own drawer, Vaul, runs `transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)` to match iOS's sheet (his drawer article), and Sonner's toasts run `transform 400ms ease`. Both are over the 300 ms cap his tips and You Don't Need Animations set for UI.
- **Frequency** matches: his tips and You Don't Need Animations drop animation for keyboard-initiated or very frequent actions (ANIM-015).
- **Reduced motion.** No article mentions it. Sonner 2.0.8 sets `transition: none !important; animation: none !important` on toasts under `@media (prefers-reduced-motion)`: no motion, not the skills' "fewer and gentler animations, not zero" (ANIM-010). Vaul 1.1.2 has no reduced-motion handling in `src/` or `dist/`.
- **Advice this KB qualifies.** Agents with Taste: `will-change: transform` for jittery animations (ANIM-008: a "last resort") and a 44 px minimum hit area (WCAG 2.2 AA asks 24 CSS px; 44 is AAA, DSKILL-005). The clip-path article calls `clip-path` hardware-accelerated; ANIM-008 finds that in Chromium only, through native paint worklets.

Developing Taste gives no rules; the toast, drawer and clip-path techniques are already in `emil-design-eng`.

## [ANIMLIB-018] three.js 0.187: WebGLRenderer by default, and its in-repo `llms.txt`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-30
- Sources: [three.js docs/llms.txt at r187](https://github.com/mrdoob/three.js/blob/r187/docs/llms.txt), [three.js package.json at r187](https://github.com/mrdoob/three.js/blob/r187/package.json)
- Related: ANIMLIB-016, ANIMLIB-019, VIZ-013

three.js `0.187.0` was published 2026-10-30 (`npm view three 'time[0.187.0]'`), MIT, still pre-1.0. Its exports include `three`, `three/webgpu` and `three/tsl`.

Unlike the vendors in ANIMLIB-016, three.js keeps its agent docs in the repo, so they can be pinned to a tag: `docs/llms.txt` (5,404 bytes at r187) and `docs/llms-full.txt` (378,970 bytes). The short file's "Instructions for Large Language Models":

- Use import maps with a versioned CDN URL, not "outdated" `<script src=…/r128/three.min.js>` tags.
- "**Use WebGLRenderer** (default, mature): Maximum browser compatibility"; "**Use WebGPURenderer** when you need: Custom shaders/materials using TSL (Three.js Shading Language), Compute shaders, Advanced node-based materials". `WebGPURenderer` needs `await renderer.init()`.
- With `WebGPURenderer`, write materials in TSL (`three/tsl`) and node materials (`MeshStandardNodeMaterial`), not raw GLSL; TSL "Works with both WebGL and WebGPU backends".

`three/webgpu` also exports a WebGL backend for `WebGPURenderer` (`src/Three.WebGPU.js`). For a site's hero scene, `WebGLRenderer` is the guide's default; pick `WebGPURenderer` only for TSL or compute. The npm package doesn't ship `docs/` (the `three@0.187.0` tarball holds LICENSE, README.md, build, examples, package.json and src), so point an agent at `docs/llms.txt` on GitHub at the tag matching the installed version (`r187`), or threejs.org/llms.txt unpinned. Its CDN example names the current version, which training data won't know.

## [ANIMLIB-019] three.js in Angular 22: SSR, bundle cost and angular-three's peer range
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-30
- Sources: [three on npm](https://www.npmjs.com/package/three), [angular-three on npm](https://www.npmjs.com/package/angular-three), [angular-threejs/angular-three](https://github.com/angular-threejs/angular-three)
- Related: ANIMLIB-004, ANIMLIB-003, ANIMLIB-018, VIZ-010, ANIM-010

**SSR.** Tested 2026-10-30, `three@0.187.0`, Node v22.22.0: `import('three')` succeeds on the server, but `new WebGLRenderer()` throws "document is not defined". As with the libraries in ANIMLIB-004, import at the top and create the renderer in `afterNextRender`; give the canvas a static fallback (a poster image) for the server render and for `prefers-reduced-motion: reduce` (ANIM-010).

**Bundle cost**, same test, `esbuild@0.27.7 --bundle --minify --format=esm`, gzip `-9` (and `-6` for the cube, to match ANIMLIB-003):

| Entry | Raw | Gzip |
|---|--:|--:|
| Scene, camera, `WebGLRenderer`, box mesh, `MeshNormalMaterial` | 532,884 B | 132,155 B (`-6`: 132,662 B) |
| `WebGPURenderer` from `three/webgpu` | 818,202 B | 221,453 B |
| `import * as THREE` unused | 0 B | 34 B |

About 133 kB gzip `-6` for the smallest WebGL scene is about 2.9 times GSAP with ScrollTrigger (45,420 B in ANIMLIB-003, an Angular build rather than esbuild). Lazy-load it with `@defer` or a dynamic `import()` (VIZ-010).

**angular-three** (MIT, `angular-threejs/angular-three`): `latest` 4.2.4 (2026-07-15) peers `@angular/core` ">=20.0.0 <22.0.0" and `three` ">=0.157.0 <0.183.0" (`npm view angular-three@latest peerDependencies`); `next` 4.2.4-next.0 is the same line. So on 2026-10-30 it supports neither Angular 22.2.4 nor three 0.187.0. It also peers `ngxtension` ">=3.0.0". Use three directly in a component until it catches up. three ships no types: `@types/three` was at 0.186.0 on 2026-10-30, one minor behind, so pin types to match.

## Recommendations for our setup

Ranked by impact against effort. Neither osrs-tracker-web nor freek-mencke-web depends on Motion, GSAP or Lenis (`package.json` on `main`, read 2026-10-23).

1. **Keep animation libraries out by default**: use native CSS (ANIM-007, CSS-008 to CSS-010); add a library only with its reason in a comment, and never Lenis for "feel". ANIMLIB-014, ANIMLIB-015, ANIMLIB-010.
2. **If one is added, write the reduced branch and the cleanup**: start in `afterNextRender`, wrap in `scopeMotion(…, { matchMedia: 'motion' })` or `gsap.matchMedia()`, revert in `DestroyRef.onDestroy`, no endless loops without a pause control, and a print rule for reveals. ANIMLIB-004 to ANIMLIB-008, ANIMLIB-011.
3. **Decided 2026-10-23 (FreekMencke/claude-kb#260): the Angular cleanup, reduced-motion and "no Lenis" rules go into `angular-conventions`** with the native rules, FreekMencke/claude-skills#107. ANIMLIB-005, ANIMLIB-006, ANIMLIB-013.
4. **Don't install the vendors' agent tooling**: borrow from it by reading; if a skill is ever installed, pin it with `#<full sha>` and set `DO_NOT_TRACK=1`. ANIMLIB-012, ANIMLIB-016, SKILL-066, SKILL-067.
5. **GSAP needs a licence exception**: a CI licence allow-list (OSS-008) won't recognise its free-text licence; record the decision where the dependency is added. ANIMLIB-002.

## Open questions

1. **Motion with Zone.js**: only a zoneless app was tested; whether each `requestAnimationFrame` tick schedules change detection in a Zone.js app (and needs `runOutsideAngular`) wasn't measured.
2. **Lenis with real users' input**: zoom, real Ctrl+F, touch with `syncTouch`, screen readers and Firefox weren't tested; Playwright's `window.find()` stood in for find-in-page.
3. **Lenis anchors mid-scroll**: the README says Lenis "will prevent anchor links from working while scrolling" without `anchors: true`; at rest the native jump worked, and a click during a wheel animation wasn't tested.
4. **GSAP licence page**: gsap.com's licence URL redirected to an offline page on 2026-10-23; whether the text changes when it returns. Looked at the live redirect chain and the 2026-10-17 Wayback snapshot.
5. **Motion's `useReducedMotion`**: its docs say it "will actively respond to changes", but the hook reads the value once in `useState`; React only, not tested.
6. **GSAP's notice under Angular's build**: the licence bars removing "proprietary notices". Tested 2026-10-23 (`@angular/build@22.2.4`, production): the bundle kept no `@license` comment, and `3rdpartylicenses.txt` (OSS-007) listed only "Package: gsap" and its licence string, since GSAP ships no licence file. Whether that satisfies Webflow isn't stated anywhere found.
7. **What Webflow counts as competing**: the licence doesn't define it beyond "visual animation building capabilities"; no ruling found on gsap.com or in the FAQ.
