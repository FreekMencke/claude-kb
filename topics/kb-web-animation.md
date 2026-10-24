# Native web animation in Angular 22

Prefix `ANIM`. This file covers animating an Angular 22 app without an animation library: `@angular/animations`' deprecation and what replaces each of its APIs, how `animate.enter` and `animate.leave` behave (including on the server and at hydration), route transitions with `withViewTransitions()`, when CSS or the Web Animations API is enough, compositor-only properties and Core Web Vitals, reduced motion and the other WCAG motion rules, focus during exit animations, motion durations and easing with their sources, and testing animated components. Motion, GSAP and Lenis are in kb-animation-libraries.md (ANIMLIB); Baseline dates of the CSS features are in kb-css-baseline.md; loading, skeleton, empty and error states are in the UIPAT file (FreekMencke/claude-kb#255), and only their motion rules are here.

Research basis:
- Researched 2026-10-23 (FreekMencke/claude-kb#257, part of roadmap #251) by an Opus 5.5 lead with two Sonnet 5.5 readers (CSS techniques and performance; accessibility, motion numbers and testing), a Sonnet refuter and a three-persona review panel (front-end engineer, accessibility specialist, UX/UI designer).
- Read as raw text: Angular's guides, examples and source at the `v22.2.3` tag and its CHANGELOG from raw.githubusercontent.com; angular/angular#69180 through the GitHub API; MDN pages as Markdown from mdn/content; web.dev, developer.chrome.com, W3C and NN/g pages stripped of tags; web-features 3.44.0 `data.json` (published 2026-10-22) from jsDelivr; Material's tokens from material-components/material-web at commit `fd45953`; `@carbon/motion` 11.55.0 from the npm registry (`npm pack @carbon/motion@11.55.0`, file `scss/generated/_tokens.scss`); Playwright's docs at `v1.64.1`. Versions and dates come from `npm view <pkg> dist-tags`, `npm view <pkg>@<version> deprecated|peerDependencies|license` and `npm view <pkg> 'time[<version>]'`.
- Tested 2026-10-23 in a scratch app from `npx @angular/cli@22.2.3 new --ssr` (zoneless by default, prerendered; installed versions read from each `node_modules/<pkg>/package.json`: `@angular/core` 22.2.3, `@angular/build` 22.2.4, Vitest 5.0.5, jsdom 30.1.3), Node 24.21.0, served by its own SSR server and driven by `playwright@1.64.1` in Chromium 156 and WebKit 27.2 (headless). No screen reader was tested.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Should new Angular 22 code use `@angular/animations`? | No. Deprecated since 20.2.0 (2025-08-20), still published at 22.2.3 with an npm deprecation notice; its JSDoc states "Intent to remove in v23". Use CSS, `animate.leave` and `@starting-style`. | ANIM-001, ANIM-002 |
| What replaces `trigger`, `state`, `query`, `stagger` and `AnimationPlayer`? | Class and style bindings, CSS selectors, `animation-delay`, and `Element.getAnimations()`. There is no `ng update` migration for it. | ANIM-002 |
| How do `animate.enter` and `animate.leave` work? | Compiler-level attributes that add classes (or call a function) and remove them, or the element, after the longest animation ends. A function leave must call `animationComplete()`, else Angular removes it after 4000 ms. | ANIM-003 |
| Why does my SSR content fade in again after hydration? | `animate.enter` replays on server-rendered elements when they hydrate; the Angular team calls this intended. Use `@starting-style` for content present on first render. | ANIM-004 |
| Is animated content visible without JavaScript? | Only if its base style is the end state. The server adds no animation classes; never hide content until a script adds a class. | ANIM-005 |
| How do I animate route changes? | `provideRouter(routes, withViewTransitions())` (developer preview in 22.2; stable on `main`, expected in 22.3); its CSS goes in global styles. It ignores reduced motion and also runs on the first navigation unless `skipInitialTransition`. | ANIM-006 |
| CSS, view transitions or the Web Animations API? | CSS for state changes and enter/exit; view transitions for DOM swaps; WAAPI (widely available) when values or playback are dynamic. `height: auto` via `interpolate-size` is Chromium-only. | ANIM-007 |
| Which properties are safe to animate? | `transform` and `opacity` everywhere (web.dev); `filter`, `translate`/`rotate`/`scale` too in Chromium only. `will-change` is a "last resort". | ANIM-008 |
| Do animations hurt INP, CLS or LCP? | Moving with `top`/`left` or size can shift layout, `transform` doesn't; an element at `opacity: 0` isn't an LCP candidate in Chromium; long rAF callbacks lengthen frames. | ANIM-009 |
| What should `prefers-reduced-motion` do? | Replace large or vestibular motion with a fade or nothing; the spec says "removes or replaces". With `animate.leave`, `animation: none` removes the element in the next frame. | ANIM-010 |
| What does WCAG require beyond reduced motion? | A pause control for automatic motion over 5 s (2.2.2), no more than three flashes a second (2.3.1), and a way to turn off interaction motion such as parallax (2.3.3, AAA). | ANIM-011 |
| What happens to focus while an element animates out? | Angular leaves it focusable and exposed. Move focus out first (else `inert` drops it to `<body>`), then set `inert` in the `(animate.leave)` callback; a bound `[inert]` never applies. | ANIM-012 |
| How long should a UI transition take? | NN/g: 100–400 ms for most, scaled by distance and frequency (toggles about 100 ms, modals 200–300, 400 is "very slow"); exits shorter than entrances. Material 3 tokens run 50–1000 ms with `cubic-bezier(0.2, 0, 0, 1)` as standard. Emil Kowalski: no animation at all for keyboard-initiated or 100+-a-day actions, UI under 300 ms. | ANIM-013, ANIM-015, ANIMLIB-013 |
| How do I test animated components? | jsdom has no WAAPI, so `animate.enter`/`leave` are no-ops under Vitest even with `animationsEnabled: true`; test motion in Playwright with `reducedMotion`. | ANIM-014 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| ANIM-001 | `@angular/animations` in Angular 22: deprecated since 20.2, not removed | fact | angular, animations, deprecation, angular-22 |
| ANIM-002 | Migrating from `@angular/animations`: what replaces each API | pattern | angular, animations, migration, css |
| ANIM-003 | `animate.enter` and `animate.leave`: timing, removal and the function form | fact | angular, animate-enter, animate-leave, timeout |
| ANIM-004 | `animate.enter` replays at hydration; use `@starting-style` for server-rendered content | anti-pattern | angular, ssr, hydration, animate-enter, starting-style |
| ANIM-005 | Animated content must be visible without JavaScript and before hydration | pattern | ssr, hydration, progressive-enhancement, zoneless, afterNextRender |
| ANIM-006 | Route transitions with `withViewTransitions()` | fact | angular, router, view-transitions, developer-preview |
| ANIM-007 | CSS, view transitions or the Web Animations API: which to use, with Baseline status | comparison | css, waapi, starting-style, view-transitions, baseline |
| ANIM-008 | Compositor-only properties and `will-change` | fact | performance, compositor, transform, opacity, will-change |
| ANIM-009 | Animation and Core Web Vitals: INP, LoAF, CLS and LCP | fact | performance, inp, cls, lcp, long-animation-frames |
| ANIM-010 | Reduced motion: replace motion, don't only remove it | recommendation | accessibility, prefers-reduced-motion, vestibular, animate-leave |
| ANIM-011 | WCAG motion rules beyond reduced motion: 2.2.2, 2.3.1 and parallax | fact | accessibility, wcag, flashing, parallax, pause |
| ANIM-012 | Focus, `inert` and the accessibility tree during exit animations | pattern | accessibility, focus, inert, animate-leave, dialog |
| ANIM-013 | Motion durations and easing: the numbers and their sources | comparison | motion-design, duration, easing, material, nngroup |
| ANIM-014 | Testing animations: jsdom, TestBed and Playwright | tool | testing, vitest, jsdom, playwright, reduced-motion |
| ANIM-015 | Choosing a duration: purpose, distance and frequency | recommendation | motion-design, duration, nngroup, frequency |

## [ANIM-001] `@angular/animations` in Angular 22: deprecated since 20.2, not removed
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [angular CHANGELOG 20.2.0](https://raw.githubusercontent.com/angular/angular/main/CHANGELOG.md), [`animation_metadata.ts` (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/animations/src/animation_metadata.ts), [angular/angular#62795](https://github.com/angular/angular/pull/62795), [Migrating away from Angular's Animations package (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/animations/migration.md), [Animations overview (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/animations/overview.md), [Release and deprecation policy (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/reference/releases.md), npm registry
- Related: NG-006, ANIM-002, ANIM-003

20.2.0 (2025-08-20): "deprecate the animations package (#62795)". The migration guide: "The `@angular/animations` package is deprecated as of v20.2", and removing it "can significantly reduce the size of your JavaScript bundle". The overview: "The Angular team recommends using native CSS with `animate.enter` and `animate.leave` for animations for all new code."

- **Still published.** `npm view @angular/animations dist-tags` gave `latest: 22.2.3`; `npm view @angular/animations@22.2.3 deprecated` prints "@angular/animations is deprecated. Use `animate.enter` and `animate.leave` instead." `@angular/platform-browser@22.2.3` lists it as an optional peer; `@angular/material@22.2.4` doesn't list it, so Material no longer needs it.
- **What it costs.** Our scratch app's initial JavaScript, `gzip -9`: 81,359 bytes with `animate.enter`/`animate.leave` only; 100,349 with `provideAnimations()` and one `trigger()` (+19 KB); with `provideAnimationsAsync()` 85,142 initial (+3.8 KB) plus an 18,895-byte chunk loaded on first use. Removing it means deleting `provideAnimations`/`provideAnimationsAsync`/`BrowserAnimationsModule` and the `animations:` metadata once no `trigger()` is left.
- **Intent to remove in v23.** The API's JSDoc at v22.2.3 and on `main`: "@deprecated 20.2 Use `animate.enter` or `animate.leave` instead. Intent to remove in v23". An intent, not a commitment: the deprecation PR (#62795) had said "intent to remove the full package in v22.2". The CHANGELOG, `releases.md` and `roadmap.md` name no version; the policy keeps a deprecated API "in at least the next major release (period of at least 12 months)".
- **No migration.** `packages/core/schematics` at v22.2.3 has no animations migration; the guide is manual (ANIM-002).
- **Don't mix them in a component.** "You cannot use legacy animations alongside `animate.enter` and `animate.leave` within the same component", nor across content projection; both in one app is fine.

Angular's own angular-developer skill (angular/skills at `8e2dd06`) tells agents to prefer `animate.enter`/`animate.leave` from v20.2; its animation reference never mentions reduced motion or hydration. MIT (`npm view @angular/animations@22.2.3 license`).

## [ANIM-002] Migrating from `@angular/animations`: what replaces each API
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Migrating away from Angular's Animations package (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/animations/migration.md), [Angular animation examples (v22.2.3)](https://github.com/angular/angular/tree/v22.2.3/adev/src/content/examples/animations/src/app/native-css)
- Related: ANIM-001, ANIM-003, ANIM-007, CSS-008

The guide's mapping, from Angular's examples at v22.2.3:

| `@angular/animations` | Native replacement |
|---|---|
| `trigger()`, `state()`, `style()` | Classes toggled with `[class.open]`; "Removing the class will revert the element" |
| `animate('300ms ease-in')` | `transition`/`animation` shorthand: duration, delay, timing function |
| `void => *`, `:enter` | `animate.enter`, or `@starting-style` (ANIM-004) |
| `* => void`, `:leave` | `animate.leave` |
| `:increment`, `:decrement` | Classes set in code: "there is no automatic application of classes" |
| Height to `*` (auto) | "You can use CSS Grid to animate to auto height"; `calc-size()` "If you don't have to worry about supporting all browsers" (Chromium-only, ANIM-007) |
| `query()`, `animateChild()` | CSS selectors; child component templates don't animate on a parent's removal (ANIM-003) |
| `stagger()` | `animation-delay`/`transition-delay` per item (`sibling-index()` is newly available since 2026-08-18, CSS-006) |
| `group()` | Several animations in one `animation` list |
| `AnimationPlayer` | `Element.getAnimations()` and the `Animation` API: `cancel()`, `pause()`, `reverse()` |
| `@.disabled` | A class forcing `animation: none; transition: none`, but "this prevents animation events from firing", so for removal use "durations to 1 millisecond instead" |
| Callbacks `(@x.done)` | `animationend`/`transitionend`, which bubble: check `event.target` or `animationName` |

"Unlike the animations package… no animation has priority over another and nothing blocks any animation from firing": sequences come from delays or end events.

## [ANIM-003] `animate.enter` and `animate.leave`: timing, removal and the function form
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Enter and leave animations (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/animations/enter-and-leave.md), [`animation.ts` (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/src/render3/instructions/animation.ts), [`interfaces.ts` (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/src/animation/interfaces.ts), [`longest_animation.ts` (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/src/animation/longest_animation.ts)
- Related: ANIM-002, ANIM-004, ANIM-012, ANIM-014

"`animate.enter` and `animate.leave` are not directives. They are special API supported directly by the Angular compiler", usable on elements and as host bindings; nothing to import. Brackets only for dynamic values: `animate.enter="fade-in"`, `[animate.enter]="cls()"`.

- **Enter** adds the classes and removes them "only _after_ the longest animation has completed". With transitions, the class is the end state, "So you would still need to pair it with `@starting-style`".
- **Leave** adds the classes and removes the element after the longest animation. The source forces a reflow (`el.offsetWidth`) to start it, ignores `infinite` animations when finding the longest, removes the element at once when the classes animate nothing, and falls back to a timer of the duration plus 50 ms if the end event never fires.
- **Function form**: `(animate.leave)="fn($event)"` gets an `AnimationCallbackEvent` (`target`, `animationComplete()`). "You **must** call the `animationComplete()` function"; otherwise Angular removes the element "after a four-second delay" (`MAX_ANIMATION_TIMEOUT`, default 4000). The source also removes it on the element's first `animationend`.
- **Order**: a leaving parent waits for `animate.leave` on descendants "within the same component template" only; for a child component, put `animate.leave` on its host element in the parent template. In `@for`, "Items reordering in a list works out of the box" (migration guide).
- **Reduced motion**: Angular never consults it (no `prefers-reduced-motion` or `matchMedia` in its animation source); your CSS decides (ANIM-010).

```html
@if (open()) {
  <section class="panel" animate.leave="panel-out">…</section>
}
<!-- .panel-out { animation: fade-out 200ms ease-in forwards; } -->
```

The function form, with `animationComplete()`, is in ANIM-012. Tested 2026-10-23, `@angular/core@22.2.3`, Chromium 156 and WebKit 27.2: the element stayed with `leave-anim` for the 400 ms keyframe, then went; a function leave using `element.animate()` and `finished` removed it after its 300 ms.

## [ANIM-004] `animate.enter` replays at hydration; use `@starting-style` for server-rendered content
- Type: anti-pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-23
- Sources: [angular/angular#69180 (closed 2026-06-15)](https://github.com/angular/angular/issues/69180), [`animation.ts` (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/src/render3/instructions/animation.ts), [MDN: `@starting-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style)
- Related: ANIM-003, ANIM-005, CSS-008, WEBPERF-002

On the server `animate.enter` does nothing (`if (… ngServerMode …) return`), so the HTML has no animation class. In the browser it runs when the element's view is created, and hydration counts: content the user already sees animates again.

angular/angular#69180 reported "a jarring flash/expand animation on every page load". An Angular team member who works on the animation runtime closed it as "working as intended", in one comment rather than the docs (hence single-source; the replay itself is tested below): "`animate.enter` is really only present as an API to be symmetric with `animate.leave`… Use `@starting-styles` in your CSS instead, which won't have this behavior at all. It will be present when the page isn't hydrated, and the animation will fire that one time and be done."

```css
.card {
  opacity: 1;
  transition: opacity 200ms ease-out;
  @starting-style { opacity: 0; }
}
```

Keep `animate.enter` for elements that are only ever inserted after start-up (a toast, a list row added by the user), and `animate.leave` for exits.

Tested 2026-10-23, `@angular/core@22.2.3` SSR (prerendered), zoneless, Chromium 156: an `animate.enter` paragraph was at opacity 1 from the server, dropped to 0.19 about 70 ms after load and faded back in over 400 ms; the `@starting-style` paragraph faded in once from first paint and wasn't animated again by hydration, and inside an `@if` it animated again when re-inserted. Binding `[animate.enter]` to a signal that `afterNextRender` fills also avoided the replay.

## [ANIM-005] Animated content must be visible without JavaScript and before hydration
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [`utils.ts` (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/src/animation/utils.ts), [`animation.ts` (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/src/render3/instructions/animation.ts), [web.dev: Largest Contentful Paint](https://web.dev/articles/lcp), [Zoneless guide](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/guide/zoneless.md)
- Related: ANIM-004, ANIM-009, NG-004, WEBPERF-002

Write the end state as the element's base style and animate *from* something else (`@starting-style`, a keyframe `from`). Never ship `opacity: 0` or an off-screen transform that waits for a script-added class: without JavaScript, or until hydration, the content stays hidden. Chromium also excludes "Elements with an opacity of 0" from LCP, so a hidden hero only counts once it shows (ANIM-009).

- **Import-safe.** Angular guards its own runtime with `typeof document !== 'undefined'` and `ngServerMode`; animation code of yours that touches `window`, `matchMedia` or `element.animate()` belongs in `afterNextRender` or an event handler, not at module or constructor level.
- **Scroll reveals** that hide content until an `IntersectionObserver` fires break find-in-page, anchor links and Tab into the hidden part (untested); the end state must hold for those too.
- **Zoneless.** Angular runs its animation listeners through `ngZone.runOutsideAngular`, which is moot without zone.js; change detection follows signals (NG-004). A signal written in an `animate.leave` callback renders.
- **Reduced motion on first paint** is CSS's job (`@media (prefers-reduced-motion: reduce)`), so it applies before hydration too.

Tested 2026-10-23, `@angular/core@22.2.3` SSR, Chromium 156 with JavaScript disabled: all three animated paragraphs (`animate.enter`, `@starting-style`, `animate.leave`) ended at computed opacity 1, and the server HTML carried only their base class. With JavaScript, a signal set in a `(animate.leave)` callback after `Animation.finished` appeared in the template. `matchMedia(…)` in a component constructor failed the prerender ("ReferenceError: matchMedia is not defined", 0 of 3 routes); moved into `afterNextRender`, all 3 prerendered.

## [ANIM-006] Route transitions with `withViewTransitions()`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Route transition animations (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/routing/route-transition-animations.md) and [on `main`](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/guide/routing/route-transition-animations.md), [commit 64502f9ae2](https://github.com/angular/angular/commit/64502f9ae2), [`view_transition.ts` (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/router/src/utils/view_transition.ts), [Chrome: same-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/same-document)
- Related: CSS-009, CSS-010, ACCESS-012, ANIM-010

`provideRouter(routes, withViewTransitions())` wraps route activation in `document.startViewTransition()`. In 22.2.3 and 22.3.0-next.2 it is "currently in developer preview" (`@developerPreview 19.0`); on `main`, "feat(router): Mark view transitions as stable" (2026-10-20) made it `@publicApi 22.3`, expected stable in 22.3.0, unreleased on 2026-10-23 (npm has 22.3.0-next.0 to next.2).

- **Fallback**: without the API the router "performs normal DOM updates without animation". Same-document view transitions are newly available since 2025-10-14 (web-features 3.44.0).
- **Styles**: "Define view transition animations in your global styles file, not in component styles", because emulated encapsulation scopes them (it even renames `@keyframes`, seen in our build).
- **Options**: `skipInitialTransition` skips "the very first call"; `onViewTransitionCreated({transition, from, to})` runs in an injection context and can call `transition.skipTransition()`. The router skips on its own only when the browser already showed a visual transition (a back swipe).
- **Reduced motion**: the router source never checks it. The guide on `main` (not yet at v22.2.3): "The Router runs view transitions regardless of the user's `prefers-reduced-motion` setting… the framework leaves the choice to the application", with "more subtle animations" in CSS or `transition.skipTransition()` when `matchMedia('(prefers-reduced-motion: reduce)').matches` (ANIM-010).
- **No waiting**: "Angular Router does not provide a way to delay view transitions", quoting Chrome: during the update "the page is frozen", so keep transitions short.
- **Focus**: a view transition doesn't move focus; ACCESS-012 still applies.

Tested 2026-10-23, `@angular/router@22.2.3`, Chromium 156 and WebKit 27.2: `startViewTransition` ran on the first navigation at start-up and on a `routerLink` click, also with `reducedMotion: 'reduce'`.

## [ANIM-007] CSS, view transitions or the Web Animations API: which to use, with Baseline status
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [web-features 3.44.0 `data.json`](https://cdn.jsdelivr.net/npm/web-features@3.44.0/data.json), [MDN: Using the Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API), [MDN: `transition-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transition-behavior), [MDN: `interpolate-size`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/interpolate-size), [MDN: `view-transition-class`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-transition-class)
- Related: CSS-006, CSS-008, CSS-009, CSS-010, CSS-011, ANIM-002, ANIMLIB-014

Order of preference: CSS, then WAAPI, then a library (ANIMLIB file) for what neither does.

| Need | Use | web-features 3.44.0 |
|---|---|---|
| State change (hover, open) | `transition` | widely |
| Entry from `display: none` or insertion | `@starting-style` | newly, 2024-08-06 |
| Exit of `display`/top-layer | `transition-behavior: allow-discrete` | newly, 2024-08-06; `display` animation itself `false` (no Firefox), `overlay` Chrome-only (CSS-008) |
| To `height: auto` | `interpolate-size: allow-keywords` or `calc-size()` | `false`, Chromium 129 only; elsewhere it jumps (our inference). Grid `0fr`→`1fr` works everywhere |
| DOM swap, shared element | `startViewTransition()`, `view-transition-class` | newly, 2025-10-14; `types` and `:active-view-transition-type()` newly, 2026-01-13; cross-document `false` (CSS-010) |
| Scroll-linked | `animation-timeline` | `false` (CSS-010) |
| Runtime values, pause, scrub, reverse | WAAPI `element.animate()`, `finished`, `getAnimations()` | widely since 2023-03-16; the `timeline` option `false` |

MDN: WAAPI "was designed to underlie implementations of both CSS Animations and CSS Transitions"; it's for when "JavaScript also lets us dynamically set values". `commitStyles()` keeps the end state.

Fallback for `allow-discrete`, from MDN: declare `transition: all 0.25s;` then `transition: all 0.25s allow-discrete;`, so other properties still transition where the keyword is unknown.

Not when (our judgement): a view transition for a change inside one component (it freezes the page, ANIM-006); WAAPI for a fixed two-state change; a library before writing down what CSS and WAAPI can't do. None honours reduced motion by itself; `element.animate()` ignores CSS `@media`, so it needs `matchMedia` (ANIM-010). A fade-only exit leaves the element focusable (ANIM-012).

## [ANIM-008] Compositor-only properties and `will-change`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [web.dev: How to create high-performance CSS animations (updated 2020-10-06)](https://web.dev/articles/animations-guide), [web.dev: Animations and performance (2020-10-06)](https://web.dev/articles/animations-overview), [web.dev: Stick to compositor-only properties (2015-03-20)](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count), [MDN: Animation performance and frame rate](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate), [MDN: `will-change`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change), [Chrome: Hardware-accelerated animation capabilities (2021-02-22)](https://developer.chrome.com/blog/hardware-accelerated-animations), [Chromium `compositor_animations.cc`](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/core/animation/compositor_animations.cc)
- Related: ANIM-009, WEBPERF-002, WEBPERF-003

web.dev: "Where possible, restrict animations to opacity and transform to keep animations on the compositing stage of the rendering path." Its demo: the top/left version "causes 50% of frames to be dropped", the transform one "only 1%". MDN: `left`, `max-width`, `border-width`, `margin-left` and `font-size` trigger "style recalculation, layout, repaint"; `transform` and `opacity` "don't even trigger a repaint". Blurs and shadows take "longer to paint".

- **Beyond the two.** Chrome (2021-02-22): "the current CSS properties that are hardware-accelerated by default only include opacity, filter, and transform". Chromium's `kCompositableProperties` (main, 2026-10-23) also lists `backdrop-filter`, `rotate`, `scale`, `translate`, and `background-color` and `clip-path` through native paint worklets. Both are Chromium only; no Firefox or WebKit statement was found, so count `transform` and `opacity` as safe everywhere and `filter` as Chromium.
- **Off the main thread.** "if the browser is running some expensive tasks on the main thread, these animations can keep going", but "If any animation triggers paint, layout, or both, the main thread will be required to do work". A `requestAnimationFrame` loop never gets this.
- **`will-change`.** MDN: "Use the `will-change` property as a last resort to try to deal with existing performance problems. Don't use it to anticipate performance problems." Overuse causes "excessive memory use"; a value like `opacity` creates the stacking context "up front"; on `<body>` it "can actually be bad". Animated properties already count as if listed, so don't add it for a running keyframe.

An infinite `box-shadow` pulse repaints every frame; a `transform: scale()` and `opacity` pseudo-element gives the same ring on the compositor. Either way it needs a reduced-motion state and, past five seconds, a 2.2.2 answer (ANIM-011).

## [ANIM-009] Animation and Core Web Vitals: INP, LoAF, CLS and LCP
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [web.dev: Cumulative Layout Shift](https://web.dev/articles/cls), [web.dev: Largest Contentful Paint](https://web.dev/articles/lcp), [web.dev: Interaction to Next Paint (updated 2025-09-02)](https://web.dev/articles/inp), [Chrome: Long Animation Frames API](https://developer.chrome.com/docs/web-platform/long-animation-frames)
- Related: WEBPERF-001, WEBPERF-002, WEBPERF-003, ANIM-005, ANIM-008

- **CLS.** web.dev: "Instead of changing the `height` and `width` properties, use `transform: scale()`. To move elements around, avoid changing the `top`, `right`, `bottom`, or `left` properties and use `transform: translate()` instead." "Layout shifts that occur within 500 milliseconds of user input will have the hadRecentInput flag set", but only for "discrete input events"; scrolls and drags are not "recent input", so a scroll-triggered entrance that moves layout counts. An `@defer` block that pops in above the fold shifts layout too (WEBPERF-002).
- **LCP.** "For Chromium-based browsers, these include: Elements with an opacity of 0, that are invisible to the user": an entrance that starts at opacity 0 delays the hero's LCP until it becomes visible (our reading; not measured).
- **INP** is "the time that the next paint is being blocked". Its page says nothing about CSS animations; a compositor-only animation doesn't occupy the main thread (ANIM-008). JavaScript animation does: LoAF's `renderStart` covers "requestAnimationFrame callbacks, style and layout calculation", and a long animation frame is one "delayed beyond 50 milliseconds".
- **Angular's leave** forces one synchronous reflow per leaving element (ANIM-003); removing many rows at once is layout work in the handler's frame (our reading of the source; not measured).

Diagnose with web-vitals attribution and LoAF (WEBPERF-003): `totalStyleAndLayoutDuration` points at layout-triggering animation, `longestScript` at a JavaScript one.

## [ANIM-010] Reduced motion: replace motion, don't only remove it
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Media Queries 5: `prefers-reduced-motion`](https://drafts.csswg.org/mediaqueries-5/#prefers-reduced-motion), [MDN: `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion), [Chrome: same-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/same-document), [WCAG technique C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html), [web.dev: prefers-reduced-motion (2019-03-11)](https://web.dev/articles/prefers-reduced-motion), [NN/g: animation duration (2020-02-09)](https://www.nngroup.com/articles/animation-duration/), [Tailwind: hover, focus and other states](https://raw.githubusercontent.com/tailwindlabs/tailwindcss.com/main/src/docs/hover-focus-and-other-states.mdx), [Complex animations with CSS (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/animations/css.md), [emilkowalski/skills `review-animations/STANDARDS.md` at 2d22863](https://raw.githubusercontent.com/emilkowalski/skills/2d228630ba1446365f614a108cb8252f1feda202/skills/review-animations/STANDARDS.md)
- Related: ACCESS-014, CSS-011, ANIM-006, ANIM-011, ANIMLIB-007, ANIMLIB-013, ANIMLIB-017

The spec defines `reduce` as a preference for an interface that "removes or replaces the types of motion-based animation that either trigger discomfort for those with vestibular motion sensitivity, or distraction"; MDN: "removes, reduces, or replaces", and its example swaps a scaling pulse for an opacity "dissolve". Chrome: "a preference for 'reduced motion' doesn't mean the user wants no motion"; Emil Kowalski's skills: "fewer and gentler animations, not zero" (ANIMLIB-017). Against: web.dev (2019) "preferably to the point where all non-essential movement is removed", NN/g "by removing animations", C39 "…to prevent motion", Angular's guide "ensure no animations play" (INDEX.md, Conflicts). Both meet WCAG 2.3.3 for a fade, not a replacement scale or zoom. Replace slides, zooms, parallax and spins with a short fade (100–200 ms, our choice) or nothing; keep colour and opacity feedback.

```css
/* component CSS */
.panel-out { animation: fade-out 150ms ease-out forwards; }
@media (prefers-reduced-motion: no-preference) {
  .panel-out { animation: slide-out 250ms ease-in forwards; }
}
/* global styles: author the slide only for no-preference, so reduce keeps
   the browser's default cross-fade (untested) */
@media (prefers-reduced-motion: no-preference) {
  ::view-transition-old(root) { animation-name: slide-out; }
}
```

- **With `animate.leave`**, `animation: none` is safe: Angular removes the element in the next frame. Angular's "1 millisecond" advice is for code that awaits end events.
- **Infinite loops** (spinners, pulses, skeletons) get `animation: none` or a static state, not just a slower loop.
- **JavaScript** reads `matchMedia('(prefers-reduced-motion: reduce)')` in the browser only (ANIM-005); for view transitions use Chrome's `animation: none !important` on all three `::view-transition-*` pseudo-elements, or `skipTransition()`.
- **Tailwind**'s `motion-reduce:`/`motion-safe:` variants do the same; set `scroll-behavior: auto` under `reduce` yourself.
- Reduced motion isn't a 2.2.2 control (ACCESS-014). Playwright can check the `animation: none` branch; whether a fade is too much is judgement.

Tested 2026-10-23, `@angular/core@22.2.3`, Playwright `reducedMotion: 'reduce'`: a leave class set to `animation: none` removed the element 16 ms (Chromium 156) and 9 ms (WebKit 27.2) after it was added. Emulated `reduce` didn't stop smooth scrolling in either engine (`scrollY` 2 and 1,159 two frames after `scrollTo(0, 4000)`); the OS setting wasn't tested.

## [ANIM-011] WCAG motion rules beyond reduced motion: 2.2.2, 2.3.1 and parallax
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [Understanding 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html), [Understanding 2.3.2](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes.html), [Understanding 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- Related: ACCESS-014, ANIM-010, ANIM-012

ACCESS-014 has 2.2.2's rule and 2.3.3. What this file adds:

- **2.3.1 Three Flashes or Below Threshold (A)**: "Web pages do not contain anything that flashes more than three times in any one second period, or the flash is below the general flash and red flash thresholds". A general flash is "a pair of opposing changes in relative luminance of 10% or more"; the area limit is about "341 x 256 CSS pixels, or a flashing area of 87,296 CSS pixels" (Understanding). Conformance requirement 5 (non-interference) applies it to all content on the page. 2.3.2 (AAA): "even a single flashing pixel would violate". Measurable.
- **Parallax**: Understanding 2.3.3: "Another animation that is often non-essential is parallax scrolling", and "Always give users the ability to turn off unnecessary movement". Scrolling itself is user-controlled and allowed. WCAG doesn't name scroll-jacking; Apple's HIG: "Let people cancel motion… don't make people wait for an animation to complete".
- **Meaning**: Apple: "avoid using it as the only way to communicate important information."
- **Loading loops**: Understanding 2.2.2, Note 4: "An animation that occurs as part of a preload phase or similar situation can be considered essential if interaction cannot occur during that phase for all users and if not indicating progress could confuse users or cause them to think that content was frozen or broken." A skeleton or pulse beside usable content meets neither condition; whether a small decorative loop is "moving" content is judgement. One that stops within five seconds is outside 2.2.2.
- **Enter and exit** also touch 2.4.3 Focus Order, 2.4.11 Focus Not Obscured and 4.1.3 Status Messages (ANIM-012).

## [ANIM-012] Focus, `inert` and the accessibility tree during exit animations
- Type: pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-23
- Sources: [MDN: `inert`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert), [MDN: `aria-hidden`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden), [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/), [APG: modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [CDK `dialog-container.ts` (v22.2.4)](https://github.com/angular/components/blob/v22.2.4/src/cdk/dialog/dialog-container.ts), [Material `dialog-container.ts` (v22.2.4)](https://github.com/angular/components/blob/v22.2.4/src/material/dialog/dialog-container.ts)
- Related: ACCESS-012, ACCESS-013, ANIM-003, ANIM-011

No standard addresses an element animating out but still in the DOM; this combines the rules that exist (single-source: the combination is ours, tested below).

- **Angular does nothing**: a leaving element stays focusable and exposed. A bound `[inert]="closing()"` set in the same handler that ends the `@if` is never written: the view is destroyed in that pass.
- **Move focus first**, to the trigger, or where it's gone (a deleted row, a dismissed toast) to "a logical element" (WAI-ARIA 1.2): the next row, the list's heading, `main`. Setting `inert` on a subtree that holds focus drops focus to `<body>`.
- **Then `inert` the leaving element** in the function form, not `aria-hidden` ("Do not use `aria-hidden="true"` on focusable elements"). `inert` also hides it from assistive technology and find-in-page at once, so a leaving `role="status"` toast's message goes too: announce the dismissal through a live region that stays (ACCESS-012). Flip the trigger's `aria-expanded` when the exit starts.

```ts
close(next: HTMLElement) { next.focus(); this.open.set(false); }
leave(e: AnimationCallbackEvent) {
  (e.target as HTMLElement).inert = true;
  e.target.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150 })
    .finished.then(() => e.animationComplete());
}
```
```html
@if (open()) { <aside (animate.leave)="leave($event)">…</aside> }
```

Angular Material dialogs close in 75 ms (`CLOSE_ANIMATION_DURATION`) and the CDK container restores focus in `ngOnDestroy`, after it.

Tested 2026-10-23, `@angular/core@22.2.3`, Chromium 156 and WebKit 27.2, 100 ms into each exit: the bound `[inert]` stayed `false` with focus on the leaving button; `inert` set in the callback was `true` but focus fell to `BODY`; focusing the trigger first, then the callback, gave `inert` `true` and focus on the trigger.

## [ANIM-013] Motion durations and easing: the numbers and their sources
- Type: comparison
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-23
- Sources: [NN/g: Executing UX Animations: Duration and Motion Characteristics (2020-02-09)](https://www.nngroup.com/articles/animation-duration/), [material-web `_md-sys-motion.scss` at `fd45953`](https://github.com/material-components/material-web/blob/fd45953c77876d7964dfe1181e1e30ae55b69a73/tokens/versions/latest/sass/_md-sys-motion.scss), `@carbon/motion` 11.55.0 `scss/generated/_tokens.scss` (npm), [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Angular components `dialog-container.ts` (v22.2.4)](https://github.com/angular/components/blob/v22.2.4/src/material/dialog/dialog-container.ts)
- Related: DESIGN-013, ANIM-010, ANIM-012, ANIMLIB-013, DSKILL-014

| Source | Durations | Easing |
|---|---|---|
| NN/g (expert guidance) | "most animations should be in the range of 100–500 ms, depending on complexity and on how far the element is traveling"; "In most cases… 100–400 ms… with 400ms being a very slow animation, to be used only for big movements across large screens" | "Most frequently… ease-out"; ease-in for exits "can feel unresponsive"; linear "looks weird" |
| Material 3 tokens (Version 34.0.21) | short1–4 50–200 ms, medium1–4 250–400, long1–4 450–600, extra-long1–4 700–1000 | standard `cubic-bezier(0.2, 0, 0, 1)`, emphasized decelerate `(0.05, 0.7, 0.1, 1)`, accelerate `(0.3, 0, 0.8, 0.15)`; springs `default` spatial damping 0.9, stiffness 700 |
| Carbon (`@carbon/motion` 11.55.0) | fast-01 70 ms, fast-02 110, moderate-01 150 ("Default transition speed"), moderate-02 240, slow-01 400, slow-02 700 | productive standard `cubic-bezier(0.2, 0, 0.38, 0.9)`, entrance `(0, 0, 0.38, 0.9)`, exit `(0.2, 0, 1, 0.9)`; an expressive set too |
| Angular Material dialog | open 150 ms, close 75 ms | |
| Apple HIG | none | "Aim for brevity and precision in feedback animations" |

How much to trust: NN/g is practitioner guidance from books, not a usability study of durations; Material and Carbon are menus of tokens their own systems chose, with no mapping from interaction to token in the files. Material's file ships durations and the M3 Expressive springs side by side; a search summary of m3.material.io says springs replace easing and duration, which remain for transitions (not read as raw text). It sets `$easing-emphasized: $easing-standard`, and its `$path` token is `null`, so CSS gets no exact emphasized curve. Both token sets are Apache-2.0; only numbers are quoted.

Picking a value for a given job: ANIM-015.

## [ANIM-014] Testing animations: jsdom, TestBed and Playwright
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Enter and leave animations: Testing (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/animations/enter-and-leave.md), [`utils.ts` (v22.2.3)](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/src/animation/utils.ts), [Playwright `params.md` (v1.64.1)](https://raw.githubusercontent.com/microsoft/playwright/v1.64.1/docs/src/api/params.md), [Playwright emulation (v1.64.1)](https://raw.githubusercontent.com/microsoft/playwright/v1.64.1/docs/src/emulation.md)
- Related: JSTEST-011, UIREV-007, ANIM-003, ANIM-010

**Unit tests.** "By default, TestBed disables animations"; `TestBed.configureTestingModule({animationsEnabled: true})` turns them on, for "a browser test". Under jsdom that changes nothing: Angular's runtime requires `document.documentElement.getAnimations`, which jsdom lacks, so `animate.enter` adds no class, `animate.leave` removes at once, and an `(animate.leave)` function is never called. jsdom also has no `element.animate`, `matchMedia` or `startViewTransition`; stub `matchMedia` for code that reads it. Assert end states in unit tests; happy-dom defines `animate`, `getAnimations` and `matchMedia` (behaviour untested).

**Browser tests.** Playwright's `reducedMotion: 'reduce'` (in `use`, or `page.emulateMedia({ reducedMotion: 'reduce' })`, default `'no-preference'`) tests the reduced branch. `toHaveScreenshot` defaults to `animations: "disabled"`: "finite animations are fast-forwarded to completion, so they'll fire `transitionend` event", "infinite animations are canceled to initial state". `page.screenshot` defaults to `"allow"`, so a plain screenshot can catch a frame mid-animation.

Tested 2026-10-23, `@angular/core@22.2.3`, Vitest 5.0.5, jsdom 30.1.3, Node 24.21.0: `typeof document.documentElement.getAnimations`, `animate` and `window.matchMedia` were all `'undefined'`; with and without `animationsEnabled: true`, the enter class was never added, both leaving elements were gone after `whenStable()`, and the leave callback's signal stayed empty.

## [ANIM-015] Choosing a duration: purpose, distance and frequency
- Type: recommendation
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-23
- Sources: [NN/g: Executing UX Animations: Duration and Motion Characteristics (2020-02-09)](https://www.nngroup.com/articles/animation-duration/), [NN/g: The Role of Animation and Motion in UX (2020-01-12)](https://www.nngroup.com/articles/animation-purpose-ux/), [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [emilkowalski/skills `review-animations/STANDARDS.md` at 2d22863](https://raw.githubusercontent.com/emilkowalski/skills/2d228630ba1446365f614a108cb8252f1feda202/skills/review-animations/STANDARDS.md)
- Related: ANIM-013, ANIM-010, DESIGN-013, ANIMLIB-013, ANIMLIB-017

Pick the shortest duration that isn't jarring, scaled by what the motion does, how far it travels and how often it repeats; ANIM-013 has the token scales to snap to. NN/g is the one source for the ranges, hence single-source; Emil Kowalski's skills agree on frequency and go further.

NN/g by purpose: a checkbox or toggle "roughly 100 ms"; a modal "200–300 ms"; "a popup window may take 300ms to appear, but only 200 or 250ms to disappear"; "the more frequent the animation, the more subtle and shorter you'll want it to be"; "look for the shortest time that an animation can take without being jarring". Apple: "generally avoid adding motion to UI interactions that occur frequently". Don't animate what the user waits on or repeats (our reading of both).

Kowalski makes frequency a gate (ANIMLIB-013): "No animation. Ever." at "100+ times/day (keyboard shortcuts, command palette toggle)", "Remove or drastically reduce" at tens a day, and "Never animate keyboard-initiated actions". His ranges fall within NN/g's 100–500 ms with a 300 ms cap for UI; for modals his skills (to 500 ms) and articles (to 300) differ (ANIMLIB-017).

| Job | Range (NN/g) |
|---|---|
| Feedback: checkbox, toggle | about 100 ms |
| Overlay or modal entering | 200–300 ms |
| Overlay leaving | 200–250 ms, shorter than its entrance |
| Large movement across a big screen | up to 400 ms, "very slow" |

Purpose first: NN/g calls motion "helpful and communicative, if used with restraint" and warns that "gratuitous animations distract and annoy the user"; DESIGN-013 has the trap of animating everything. Whether a given duration feels right is judgement; checking that it sits in the range is measurable (computed `transition-duration` or `animation-duration`).

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-23 against `main` of osrs-tracker-web and freek-mencke-web: neither imports `@angular/animations`, `animate.enter` or `withViewTransitions`; both use CSS keyframes and transitions.

1. **Decided 2026-10-23 (FreekMencke/claude-kb#260): animation rules go into `angular-conventions`**, not a skill of their own (its triggers would overlap `angular-developer`): FreekMencke/claude-skills#107. ANIM-004, ANIM-005, ANIM-010, ANIM-012, ANIM-013, ANIM-014.
2. **osrs-tracker-web: stop the "live" dot's endless pulse** (ANIM-008, ANIM-010, ANIM-011): `--animate-live` loops a `box-shadow` forever with no `motion-reduce:` variant, unlike the skeleton and loading bar. A reduced-motion state answers 2.3.3 but not 2.2.2, so the issue also asks for a finite pulse (under five seconds): osrs-tracker/osrs-tracker-web#390.
3. **Won't do: change freek-mencke-web's skill line on `@angular/animations`** (ANIM-001). It says "removed in v23"; Angular's JSDoc says "Intent to remove in v23", close enough for a rule that only tells agents not to use the package.

## Open questions

- **Does `filter` animate on the compositor in Firefox and Safari?** (ANIM-008) Only Chromium's source and a 2021 Chrome post were read; no Mozilla or WebKit doc found.
- **How do replayed events and enter animations score in INP during hydration?** (ANIM-009) web.dev's INP page and Angular's hydration guides don't say.
- **Does any browser reduce motion by itself?** Firefox's Bugzilla 1832598 (milestone 115) makes smooth scrolls instant under the OS setting; MDN's `scroll-behavior` page and Chrome's view-transition page say nothing for Chromium or WebKit. Playwright's emulated `reduce` didn't change smooth scrolling in either (ANIM-010), which says nothing about the OS setting.
- **Height-to-`auto` fallback** (ANIM-007): that it jumps outside Chromium is our inference from `interpolate-size`'s `numeric-only` default; no MDN sentence says so.
- **M3 Expressive: springs against duration tokens, and device scaling** (ANIM-013): m3.material.io renders with JavaScript and wasn't readable as text; whether M3 still scales durations by device size (as Material 2 was remembered to) wasn't checked.
- **A cap for stagger and choreography**: Emil Kowalski's skills give 30–80 ms between items and say stagger must never block interaction (ANIMLIB-013, one practitioner); no source read gives a total-sequence limit, and ANIM-002 maps `stagger()` without one.
- **The view-transition reduced-motion CSS** in ANIM-010 (keep the default cross-fade) wasn't tested.
- **Chrome's "Blocked aria-hidden… retained focus" warning** (ANIM-012): seen only in search summaries, not in Chrome docs or source.
- **Screen readers**: no announcement behaviour during enter or exit was tested; all tests were headless Chromium and WebKit.
