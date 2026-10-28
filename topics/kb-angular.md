# Angular 21–22 changes and Angular's AI tooling

Prefix `NG`. This file covers what changed in Angular 21 and 22 that a model trained on Angular 17–19 code gets wrong, the TypeScript and Node ranges and support windows of the supported majors, what `ng update` does for you, which newer APIs are stable, and Angular's tooling for coding agents: the `ng mcp` server, its best-practices guide, the rules files, llms.txt and the angular/skills repo. How to write Angular code is in the claude-skills `angular-developer` and `angular-conventions` skills, not here. TypeScript 7 itself is in `kb-typescript.md`, Node release lines in `kb-nodejs.md`, Vitest details in `kb-js-testing.md`.

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#170, roadmap #167) on Node 24.21.0, npm 11.19.0 and Claude Code v2.1.296 in the WSL terminal.
- The lead read as raw text: angular/angular and angular/angular-cli `CHANGELOG.md` on `main`, the angular.dev content sources under `adev/src/` (releases, versions, zoneless, error boundaries, the `ai/` pages, the `context/` rules files, the update guide's `recommendations.ts`), `packages/core/resources/best-practices.md`, angular/skills, and the npm registry (`npm view`). The deployed angular.dev releases and versions pages matched their sources.
- Two Sonnet 5.5 readers covered API stability and `ng update` migrations, and the `ng mcp` source and Angular's AI pages; the lead re-checked every quote used here against raw text. A Sonnet 5.5 refuter tested five claims behind the recommendations: it corrected which branch angular.dev deploys from (NG-016) and found Angular's TypeScript 7 post (NG-002).
- Tests: `@angular/cli@22.2.3` and `@angular/compiler-cli@22.2.3` installed with `--ignore-scripts` in a scratch folder; `ng mcp` driven over stdio; `claude -p` probes on Haiku for its context cost.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which Angular majors are supported, and when is the next? | 22 active (released 2026-06-03, LTS to 2028-06), 21 LTS to 2027-06, 20 LTS to 2026-11-28; v19 and older unsupported. From v22 a major comes every 12 months: v23 about June 2027. | NG-001 |
| Which TypeScript and Node does Angular 22 need? | TypeScript `>=6.0 <6.1` and Node `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0`. `typescript@latest` is 7.0.2: npm refuses to install it together with Angular 22 (ERESOLVE), and bumping it in an existing repo only warns (JSUP-002). 21.2+ takes TS 5.9 or 6.0. | NG-002, JSUP-002 |
| Do I still write `changeDetection: ChangeDetectionStrategy.OnPush`? | No: since v22 a component without `changeDetection` is OnPush. Write `ChangeDetectionStrategy.Eager` for the old behaviour; `Default` is deprecated. | NG-003 |
| Is zone.js still needed? | No: zoneless is the default since v21, in apps and in TestBed. A zone app needs `provideZoneChangeDetection()`; `ng update` adds it. | NG-004 |
| What else changed default in v22 without a compile error? | HttpClient uses fetch (`withXhr()` for upload progress), routes inherit all parent params, incremental hydration is on, `?.` in templates gives `undefined`, `data-` attributes don't bind, `PORT` beats `--port`. | NG-005 |
| Which old APIs are gone? | v22: `ComponentFactoryResolver`, `createNgModuleRef`, `provideRoutes`, `checkNoChanges`, Hammer.js. v21: `NgModuleFactory`, `moduleId`, `interpolation`, `UpgradeAdapter`. Webpack builders and `CommonEngine` are deprecated. | NG-006 |
| `@Service` or `@Injectable({providedIn: 'root'})`? | `@Service()` (v22, stable) for a new root singleton that uses `inject()`; `@Injectable` for constructor injection, `useClass`-style providers or non-root scopes. `ng generate service` writes `@Service`. | NG-007 |
| What changed for SSR servers? | `main.server.ts` passes a `BootstrapContext` (since 2025-09-10, back to 18.2.14); v22 answers an unknown `Host` with 400 instead of client rendering, and proxy headers need `trustProxyHeaders`. Use `AngularNodeAppEngine`, not `CommonEngine`. | NG-008 |
| Karma or Vitest? | Vitest is the default for new projects since v21; Karma is still supported in 22.x. `migrate-karma-to-vitest` is an optional `ng update` migration and doesn't rewrite the specs. | NG-009 |
| What does `ng update` do, and what is left to me? | It runs the 22.0.0 migrations, which mostly write the old behaviour back (`Eager` on every component, `strictTemplates: false`). Without a TTY, as in Claude Code's Bash tool, it skips optional migrations: run them with `--name`. Signal, `inject()` and `@Service` rewrites are opt-in `ng generate @angular/core:<name>`. | NG-010 |
| Are signal forms, `httpResource`, `linkedSignal` and `@angular/aria` stable? | Yes: `resource`, `rxResource`, `httpResource`, signal forms and `@angular/aria` since v22, `linkedSignal` since v20. Experimental: `debounced()`, `resourceFromSnapshots`, WebMCP; `@boundary` is developer preview. | NG-011 |
| Should a repo run `ng mcp`, and what does it cost? | Yes, as `npx ng mcp --read-only` in `.mcp.json`, so it runs the repo's own CLI. With tool search on (the default) it adds about 765 input tokens a request; with tool search off, about 6,500. | NG-012, NG-013, NG-014 |
| Are Angular's AGENTS.md, rules files and llms.txt worth loading? | Not in Claude Code: `get_best_practices` returns the guide for the installed version, while the rules files on angular.dev follow the newest release and llms-full.txt is 856 KB. | NG-015, NG-016 |
| angular/skills or our own skills? | Both: our `angular-developer` is a weekly mirror of angular/skills, which follows Angular's `main` and states v22 APIs without version notes, so `angular-conventions` makes the installed version win. Skip `angular-new-app`: its `--ai-config` values fail on 22.2.3. | NG-017 |
| Why does Try again look dead, or show "Checking…" before a click, with `httpResource`? | `error()` stays set during `reload()`, and `isLoading()` is true on the first load too: branch on `status()`, and label a retry from `'reloading'` or a click signal. | NG-019 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| NG-001 | Release cadence and support windows: 12-month majors from v22 | fact | releases, lts, support, cadence |
| NG-002 | TypeScript and Node ranges of each supported major | fact | typescript, node, peer-dependencies, versions |
| NG-003 | v22 components are OnPush unless they say `Eager` | fact | change-detection, onpush, v22 |
| NG-004 | Zoneless is the default since v21 | fact | zoneless, zone-js, testbed, v21 |
| NG-005 | Other v22 defaults that change behaviour | fact | http, router, hydration, templates, v22 |
| NG-006 | APIs removed or deprecated in v21 and v22 | fact | removed-apis, deprecations, migration |
| NG-007 | `@Service`: the v22 decorator for root services | fact | di, service, injectable, v22 |
| NG-008 | SSR: `BootstrapContext`, host validation and `CommonEngine` | fact | ssr, security, express, v21, v22 |
| NG-009 | Unit tests: Vitest by default since v21 | fact | vitest, karma, testing |
| NG-010 | What `ng update` migrates and what it leaves to you | fact | ng-update, migrations, schematics |
| NG-011 | Stable, developer preview or experimental at 22.2 | fact | stability, signal-forms, resource, aria |
| NG-012 | `ng mcp`: tools, flags and server instructions | tool | mcp, angular-cli, tools |
| NG-013 | Context cost of `ng mcp` in Claude Code | fact | mcp, tokens, tool-search |
| NG-014 | Running `ng mcp` from a repo's `.mcp.json` | recommendation | mcp, mcp-json, read-only, setup |
| NG-015 | `get_best_practices` returns the guide for the installed version | fact | best-practices, versions, mcp |
| NG-016 | Angular's rules files and llms.txt | fact | agents-md, rules-files, llms-txt |
| NG-017 | angular/skills follows Angular's `main` branch | fact | skills, angular-developer, third-party |
| NG-018 | In-page WebMCP and AI debugging tools (v22) | fact | webmcp, devtools, experimental |
| NG-019 | Resources: `isLoading()` covers the first load, and `error()` stays set during `reload()` | anti-pattern | resource, httpResource, reload, error-state |

## [NG-001] Release cadence and support windows: 12-month majors from v22
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Angular versioning and releases](https://angular.dev/reference/releases) ([source](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/reference/releases.md)), npm registry (`npm view @angular/core time --json`, `npm view @angular/core dist-tags`)
- Related: NG-002, NG-010

From v22, Angular ships a major every 12 months instead of every 6. The releases page: "A major release every 12 months", "4-6 minor releases for each major release", and "Until Angular v22, Angular had a 6-month major release cycle, with 1-3 minor releases for each major release". Majors "are typically supported for 24 months": 12 months active, then 12 months LTS, when "Only critical fixes and security patches are released".

The page's table on 2026-10-17:

| Version | Status | Released | Active ends | LTS ends |
|---|---|---|---|---|
| ^22.0.0 | Active | 2026-06-03 | 2027-06 | 2028-06 |
| ^21.0.0 | LTS | 2025-11-19 | 2026-06-03 | 2027-06 |
| ^20.0.0 | LTS | 2025-05-28 | 2025-11-19 | 2026-11-28 |

"Angular versions v2 to v19 are no longer supported." The schedule lists v22.3 "~ November 2026", v22.4 "~ January 2027", v22.5 "~ March 2027" and v23.0 "~ June 2027".

The registry agrees: `latest` is 22.2.3 (2026-10-14), 22.1.0 came 2026-07-29 and 22.2.0 2026-09-23; `v21-lts` is 21.2.25 and `v20-lts` 20.3.34. `ng update` moves one major at a time: "If you want to update across multiple major versions, perform each update one major version at a time."

## [NG-002] TypeScript and Node ranges of each supported major
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: npm registry (`npm view @angular/compiler-cli@<version> peerDependencies engines`, `npm view @angular/cli@<version> engines`), [Version compatibility](https://angular.dev/reference/versions) ([source](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/reference/versions.md)), [angular-cli CHANGELOG 22.0.0](https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md), [update guide data](https://raw.githubusercontent.com/angular/angular/main/adev/src/app/features/update/recommendations.ts), [An update on Angular's TypeScript 7-powered Compiler](https://blog.angular.dev/an-update-on-angulars-typescript-7-powered-compiler-9619a35e2b0a) (read from the blog's RSS feed; the page returned 403)
- Related: NG-001, NG-010, TS-009, TS-015, NODE-001

From the published packages (`@angular/compiler-cli` peer and engines, 2026-10-17):

| Angular | TypeScript | Node |
|---|---|---|
| 22.0.0 to 22.2.3 | `>=6.0 <6.1` | `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` |
| 21.2.0 to 21.2.25 | `>=5.9 <6.1` | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` |
| 21.0.0 to 21.1.x | `>=5.9 <6.0` | same |
| 20.3.34 | `>=5.8 <6.0` | same |

`typescript@latest` is 7.0.2 and the only 6.x releases are 6.0.2 and 6.0.3, so an agent that installs "latest" TypeScript breaks an Angular 22 build. Keep `typescript` on 6.0; for TypeScript 7 itself see `kb-typescript.md`, and for the Node release lines `kb-nodejs.md`. Angular's TypeScript 7 plan (blog, 2026-09-25) is a new compiler, ngp, using TS 7.1's interop APIs for type-checking: "We're aiming to ship an experimental version that you can test out in your own projects later this year." It gives no date for a stable one.

Tested 2026-10-17, `@angular/compiler-cli@22.2.3`, Node 24.21.0, npm 11.19.0: `npm install --dry-run @angular/compiler-cli@22.2.3 @angular/compiler@22.2.3 typescript@7.0.2` fails with `ERESOLVE`: "peerOptional typescript@">=6.0 <6.1" from @angular/compiler-cli@22.2.3".

Two official sources disagree with the packages:
- The versions page lists only a "22.0.x" row and gives 21.x as `>=5.9.0 <6.0.0`, though 21.2.0 and later accept TypeScript 6.0.
- The angular-cli CHANGELOG for 22.0.0 says "The minimum supported Node.js versions are now v22.22.0 and v24.13.1"; the engines field and the update guide ("Angular v22 requires Node.js v22.22.3 or v24.15.0 and later") say otherwise. Trust the engines field.

## [NG-003] v22 components are OnPush unless they say `Eager`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [angular CHANGELOG 22.0.0](https://raw.githubusercontent.com/angular/angular/main/CHANGELOG.md), [angular-cli CHANGELOG 22.0.0](https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md), [change-detection-eager migration at v22.2.3](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/schematics/migrations/change-detection-eager/migration.ts), [best-practices.md](https://raw.githubusercontent.com/angular/angular/main/packages/core/resources/best-practices.md), [Announcing Angular v22](https://blog.angular.dev/announcing-angular-v22-c52bb83a4664), [angular-eslint CHANGELOG](https://raw.githubusercontent.com/angular-eslint/angular-eslint/main/CHANGELOG.md), `ChangeDetectionStrategy` in `@angular/core@22.2.3`'s type definitions
- Related: NG-004, NG-010, NG-015

Since 22.0.0: "Component with undefined `changeDetection` property are now `OnPush` by default. Specify `changeDetection: ChangeDetectionStrategy.Eager` to keep the previous behavior." `Eager` is the old default under a new name; `ChangeDetectionStrategy.Default` "is equivalent to setting `Eager` and is due to be removed" (`@deprecated Use Eager instead`).

- `ng update` to 22 runs the `change-detection-eager` migration ("Adds `ChangeDetectionStrategy.Eager` to all components."): its source at v22.2.3 adds `Eager` to each component without `changeDetection`, renames `Default` to `Eager` and leaves `OnPush` alone. Updated apps keep their behaviour; the v22 post says "OnPush is now the default for new applications".
- `ng generate` no longer writes `changeDetection` (angular-cli: "default components to OnPush change detection", "replace deprecated `ChangeDetectionStrategy.Default` with `Eager`").
- What breaks in new code: a component that changes a plain field outside a template event, without a signal or `markForCheck()`, no longer re-renders.
- angular-eslint 22.1.0 (2026-07-12) made `prefer-on-push-component-change-detection` recommended: it now "only reports components that opt out of OnPush via ChangeDetectionStrategy.Eager", "notably on components the Angular v22 migration set to Eager". 22.2.0 added `allowExplicitOnPush`, which removes explicit `OnPush` when `false`.

Models trained on older code still add `OnPush` explicitly, as Angular's v21 guide told them to (NG-015). It is redundant, not wrong.

Tested 2026-10-17, `@angular/compiler-cli@22.2.3`, TypeScript 6.0.3, Node 24.21.0: `ngc` emitted the same `ɵɵdefineComponent` call, with no `changeDetection` key, for a component without the property and one with `OnPush`; `Eager` emitted `changeDetection: 1`.

## [NG-004] Zoneless is the default since v21
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Zoneless guide](https://angular.dev/guide/zoneless) ([source](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/guide/zoneless.md)), [angular CHANGELOG 21.0.0](https://raw.githubusercontent.com/angular/angular/main/CHANGELOG.md)
- Related: NG-003, NG-010, NG-012

"Zoneless is the default in Angular v21+ so you do not need to do anything to enable it. You should verify that `provideZoneChangeDetection` is not used anywhere to override the default configuration."

- **Zone apps.** 21.0.0: "Angular no longer provides a change detection scheduler for ZoneJS-based change detection by default. Add `provideZoneChangeDetection` to the providers of your `bootstrapApplication` function or your `AppModule`… This provider addition will be covered by an automated migration." `ignoreChangesOutsideZone` was removed.
- **`provideZonelessChangeDetection()`** is how a v20 app goes zoneless; on v21+ it is redundant. Our two Angular apps still list it, which is harmless.
- **Tests.** "`TestBed` uses zoneless change detection by default, even when `zone.js` is loaded via the `polyfills`." Add `provideZoneChangeDetection()` to the TestBed providers for a zone-based test.
- **Bundle.** Remove `zone.js` and `zone.js/testing` from the `polyfills` of the build and test targets; zoneless code must also drop `NgZone.onMicrotaskEmpty`, `onUnstable`, `isStable` and `onStable`.

`ng mcp`'s `onpush_zoneless_migration` tool plans the move for older code one step at a time (NG-012).

## [NG-005] Other v22 defaults that change behaviour
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [angular CHANGELOG 22.0.0 and 22.1.0](https://raw.githubusercontent.com/angular/angular/main/CHANGELOG.md), [angular-cli CHANGELOG 22.0.0](https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md), [update guide data](https://raw.githubusercontent.com/angular/angular/main/adev/src/app/features/update/recommendations.ts)
- Related: NG-003, NG-006, NG-010

Defaults a model trained on v17–v19 code assumes the other way:

| Area | Since 22.0.0 | Old behaviour back |
|---|---|---|
| HttpClient | "Use `FetchBackend` as default"; "`withFetch` is now deprecated, it can be safely removed" | `provideHttpClient(withXhr())`, needed for upload progress |
| Progress events | "`reportProgress` option is deprecated" | `reportUploadProgress`, `reportDownloadProgress` |
| Router | "paramsInheritanceStrategy now defaults to 'always'" | `paramsInheritanceStrategy: 'emptyOnly'` |
| SSR hydration | "Incremental hydration is now the default behavior" | `withNoIncrementalHydration()` |
| Template checks | "The `strictTemplates` compiler option now defaults to `true`"; `fullTemplateTypeCheck` removed | `strictTemplates: false` |
| `?.` in templates | "now return `undefined` instead of `null`" | `$safeNavigationMigration()` |
| `data-` attributes | "data prefixed attribute no-longer bind inputs nor outputs" | rename the input |
| `ng serve` | "assigns the highest priority to the `PORT` environment variable", over `angular.json` and `--port` | unset `PORT` |

These are the defaults of a new v22 app. `ng update` writes most of the old behaviour back into an existing one (`strictTemplates: false` when unset, `withNoIncrementalHydration()` where it was off, `$safeNavigationMigration()` around `?.`, `withXhr()` where `HttpXhrBackend` is used; NG-010), so an updated repo can differ from a new one.

Also in 22.0.0: binding two inputs, outputs or models to the same name, and `in` in template expressions, now fail to compile. 22.1.0 deprecated `HttpClient.jsonp` and `HttpClientJsonpModule`.

## [NG-006] APIs removed or deprecated in v21 and v22
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [angular CHANGELOG 21.0.0 to 22.2.0](https://raw.githubusercontent.com/angular/angular/main/CHANGELOG.md), [angular-cli CHANGELOG 22.0.0](https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md)
- Related: NG-005, NG-010

APIs older code and older models still use. Removed:

| Removed | In | Use instead |
|---|---|---|
| `ComponentFactoryResolver`, `ComponentFactory` | 22.0.0 | "Pass the component class directly to APIs that previously required a factory, such as `ViewContainerRef.createComponent`" |
| `createNgModuleRef` | 22.0.0 | `createNgModule` |
| `provideRoutes()` | 22.0.0 | `provideRouter()` or the `ROUTES` multi token |
| `ChangeDetectorRef.checkNoChanges` | 22.0.0 | "In tests use `fixture.detectChanges()`" |
| Hammer.js integration | 22.0.0 | "Use your own implementation" |
| `NgModuleFactory` | 21.0.0 | `NgModule` |
| `moduleId`, the `interpolation` option | 21.0.0 | nothing; only `{{ }}` |
| `ApplicationConfig` from `@angular/platform-browser` | 21.0.0 | import it from `@angular/core` |
| `UpgradeAdapter` | 21.0.0 | `upgrade/static` |
| Jest and Web Test Runner builders, `@angular-devkit/architect-cli` | 22.0.0 (CLI) | the `unit-test` builder; `@angular-devkit/architect` |

Deprecated in 22.0.0, so candidates for removal in v23: the Webpack builders (`@angular-devkit/build-angular`, `@angular-devkit/build-webpack`, `@ngtools/webpack`: "Use @angular/build builders instead"), `CommonEngine` (NG-008), `withFetch`, `reportProgress` and `ChangeDetectionStrategy.Default`. 21.0.0 deprecated `HttpResponseBase.statusText`, 22.1.0 JSONP. Since 21.0.0, `Router.lastSuccessfulNavigation` is a signal: call it.

## [NG-007] `@Service`: the v22 decorator for root services
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Creating and using services](https://angular.dev/guide/di/creating-and-using-services) ([source at v22.2.3](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/di/creating-and-using-services.md)), [`service.ts` at v22.2.3](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/src/di/service.ts), [angular CHANGELOG 22.0.0 and 22.1.0](https://raw.githubusercontent.com/angular/angular/main/CHANGELOG.md), [core schematics collection at v22.2.3](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/schematics/collection.json)
- Related: NG-010, NG-011, NG-017

`@Service()` arrived in 22.0.0 ("introduce `@Service` decorator", "mark service decorator as stable"). The DI guide: "The `@Service` decorator serves as a modern, ergonomic shorthand for the traditional `@Injectable({ providedIn: 'root' })` syntax."

| | `@Service` | `@Injectable` |
|---|---|---|
| Constructor-based DI | No: `inject()` only | Yes |
| Implicit root singleton | Yes | No (requires `{providedIn: 'root'}`) |
| `useClass`, `useValue`, `useExisting`, `useFactory` | No: one `factory` option | Yes |
| Non-root scopes (`platform`) | No | Yes |

Options: `autoProvided` ("Defaults to `true`"; `@Service({autoProvided: false})` means you add it to a `providers` array yourself) and `factory`. The guide: "Reach for `@Service` when you are creating a new singleton class that uses `inject()` for its dependencies."

- `ng generate service` writes `@Service` since 22.0.0 (angular-cli: "use service decorator in ng generate").
- `ng update` doesn't convert existing services; `ng generate @angular/core:service-migration` does ("Converts @Injectable to @Service where applicable", added in 22.1.0).
- `injectAsync()` (22.0.0) needs an auto-provided service: `@Service()` or `@Injectable({providedIn: 'root'})`.
- Neither exists before v22, so advice that names them is wrong for a v20 or v21 repo.

Tested 2026-10-17, `@angular/compiler-cli@22.2.3`, Node 24.21.0: `ngc` compiled `@Service()` to `ɵɵdefineService({ token, factory })`, and `@Injectable({ providedIn: 'root' })` to `ɵɵdefineInjectable({ …, providedIn: 'root' })`.

## [NG-008] SSR: `BootstrapContext`, host validation and `CommonEngine`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [angular CHANGELOG 18.2.14, 19.2.15, 20.3.0, 21.0.0](https://raw.githubusercontent.com/angular/angular/main/CHANGELOG.md), [angular-cli CHANGELOG 22.0.0](https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md), [update guide data](https://raw.githubusercontent.com/angular/angular/main/adev/src/app/features/update/recommendations.ts), [GHSA-x288-3778-4hhx](https://github.com/angular/angular-cli/security/advisories/GHSA-x288-3778-4hhx)
- Related: NG-006, NG-010

Three server-side changes that SSR code from before 2025-09 gets wrong:

- **`BootstrapContext`.** "The server-side bootstrapping process has been changed to eliminate the reliance on a global platform injector." `main.server.ts` becomes `const bootstrap = (context: BootstrapContext) => bootstrapApplication(AppComponent, config, context);`. It shipped as a breaking change in 18.2.14, 19.2.15 and 20.3.0 (all 2025-09-10) and in 21.0.0; "A schematic is provided to automatically update `main.server.ts` files".
- **Host validation.** In `@angular/ssr` 22.0.0, "The server no longer falls back to Client-Side Rendering (CSR) when a request fails host validation. Requests with unrecognized 'Host' headers will now return a 400 Bad Request status code. Users must ensure all valid hosts are correctly configured in the 'allowedHosts' option." `X-Forwarded-*` headers count only with `trustProxyHeaders` ("enforce explicit opt-in for proxy headers"; "add trusted-proxy-headers migration").
- **`CommonEngine`** is deprecated "in favor of AngularNodeAppEngine or AngularAppEngine". Since `@angular/ssr` 21.1.5 it needs `allowedHosts`, or "SSR silently falls back to client-side rendering" (GHSA-x288-3778-4hhx, backported to 20.3.17 and 19.2.21).

Our two SSR apps (osrs-tracker-web, freek-mencke-web) already use `AngularNodeAppEngine` with `allowedHosts` and `trustProxyHeaders`, and pass the `BootstrapContext` (read 2026-10-17). Behind a proxy, a host missing from `allowedHosts` now fails every request instead of degrading to client rendering.

## [NG-009] Unit tests: Vitest by default since v21
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [angular-cli CHANGELOG 21.0.0 and 22.0.0](https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md), [Testing with Karma](https://angular.dev/guide/testing/karma) ([source at v22.2.3](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/testing/karma.md)), [Migrating to Vitest](https://angular.dev/guide/testing/migrating-to-vitest) ([source at v22.2.3](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/testing/migrating-to-vitest.md)), [migrate-karma-to-vitest at v22.2.3](https://raw.githubusercontent.com/angular/angular-cli/v22.2.3/packages/schematics/angular/migrations/migrate-karma-to-vitest/migration.ts), [Announcing Angular v21](https://blog.angular.dev/announcing-angular-v21-57946c34f14b)
- Related: NG-010, NG-006

New projects get Vitest since 21.0.0 (angular-cli: "configure Vitest for new projects and allow runner choice"). The v21 post: "The Angular CLI integrates Vitest as the new default test runner. Vitest support is now stable and production ready", and "Karma and Jasmine are still fully supported by the Angular team, so you don't need to migrate yet."

At v22.2.3 the Karma guide still says: "While Vitest is the default test runner for new Angular projects, Karma is still a supported and widely used test runner" (`ng new --test-runner=karma`). The experimental Jest and Web Test Runner builders were removed in 22.0.0.

Moving an existing project:
- `migrate-karma-to-vitest` is an optional `ng update` migration, unchecked by default (NG-010); run it with `ng update @angular/cli --name migrate-karma-to-vitest`.
- It needs the `@angular/build:application` builder, switches the test target's `runner` to Vitest and adds `vitest/globals`. It doesn't rewrite specs: it prints `ng g @schematics/angular:refactor-jasmine-vitest <project_name>` for that.
- The docs and the CHANGELOG disagree on maturity. The guide: "Migrating an existing project to Vitest is considered experimental" and "The `refactor-jasmine-vitest` schematic is experimental". The CLI 22.0.0 CHANGELOG: "stabilize refactor-jasmine-vitest schematic".

Our two Angular apps run Vitest through `@angular/build:unit-test`. Vitest itself is in `kb-js-testing.md`.

## [NG-010] What `ng update` migrates and what it leaves to you
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-17
- Sources: [core migrations.json at v22.2.3](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/schematics/migrations.json), [CLI migration-collection.json at v22.2.3](https://raw.githubusercontent.com/angular/angular-cli/v22.2.3/packages/schematics/angular/migrations/migration-collection.json), [core collection.json at v22.2.3](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/schematics/collection.json), `ng update`'s `utilities/migration.js` in `@angular/cli@22.2.3`, [update guide data](https://raw.githubusercontent.com/angular/angular/main/adev/src/app/features/update/recommendations.ts)
- Related: NG-003, NG-005, NG-007, NG-009, NG-001

`ng update @angular/core@22 @angular/cli@22` (the update guide's command) runs every non-optional migration registered for 22.0.0:
- **Core:** `change-detection-eager`, `http-xhr-backend`, `strict-templates-default` ("Adds 'strictTemplates: false' in tsconfig.json when not set"), `can-match-snapshot-required`, `incremental-hydration`, `strict-safe-navigation-narrow` ("Disables the 'nullishCoalescingNotNullable & optionalChainNotNullable extended diagnostics"), `model-output`, `safe-optional-chaining`.
- **CLI:** `add-istanbul-instrumenter`, `trust-proxy-headers`, `update-workspace-config`. Optional: `use-application-builder` (pre-checked) and `migrate-karma-to-vitest` (unchecked).
- **21.0.0** ran `add-bootstrap-context-to-server-main`, `bootstrap-options-migration` (adds `provideZoneChangeDetection` to zone apps), `control-flow-migration` and others.

Without a TTY, or with `CI=true`, `ng update` runs no optional migration and prints `ng update <pkg> --name <migration>` for each (`--name` implies `--migrate-only`). Tested 2026-10-17, Claude Code v2.1.296, WSL terminal: the Bash tool's `process.stdout.isTTY` is `undefined`, so a session must run optional migrations by name (`NG_FORCE_TTY=true` only brings the prompt back).

Left to you:
- Opt-in rewrites, as `ng generate @angular/core:<name>`: `signals` (inputs, queries, outputs), `inject`, `standalone`, `control-flow`, `ngclass-to-class`, `ngstyle-to-style`, `common-to-standalone`, `self-closing-tags`, `route-lazy-loading`, `service`.
- Removed APIs (NG-006), `paramsInheritanceStrategy`, `data-` bindings and `PORT` (NG-005).
- The opt-outs the migrations wrote. They keep v21 behaviour until someone removes them: the 22.0.0 CHANGELOG says to disable the two diagnostics "temporarily".

## [NG-011] Stable, developer preview or experimental at 22.2
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: JSDoc tags in angular/angular and angular/components source at tag v22.2.3 (e.g. [resource.ts](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/src/resource/resource.ts), [debounce.ts](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/src/resource/debounce.ts)), [angular CHANGELOG](https://raw.githubusercontent.com/angular/angular/main/CHANGELOG.md), [Announcing Angular v22](https://blog.angular.dev/announcing-angular-v22-c52bb83a4664), [Error boundaries guide](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/guide/templates/error-boundaries.md), npm registry
- Related: NG-007, NG-018, NG-004

The v22 post: "we're excited to be bringing 3 significant Angular features to production-ready, stable status: Signal Forms, Angular Aria and the Asynchronous Reactivity APIs." Code from v19–v21 marks several of these experimental or preview, so older advice is out of date.

| API | Status at 22.2.3 | Before |
|---|---|---|
| `resource`, `rxResource`, `httpResource` | stable (`@publicApi 22.0`) | `@experimental` at 21.0.0 |
| Signal forms (`@angular/forms/signals`) | stable since 22.0.0 ("graduate signal forms APIs to public API") | experimental in 21.0.0 |
| `@angular/aria` | stable in v22 (blog; no preview tags in 22.2.3 source) | developer preview from 21.0.0 |
| `linkedSignal`, `effect` | stable (`@publicApi 20.0`) | |
| Zoneless | stable since 20.2.0 ("Promote zoneless to stable") | |
| `@Service`, `injectAsync` | stable, new in 22.0.0 | |
| `@boundary` error blocks | developer preview, 22.2.0 | |
| `debounced()`, `resourceFromSnapshots` | experimental | |
| WebMCP: `provideExperimentalWebMcpTools`, `declareExperimentalWebMcpTool`, the signal-forms `experimentalWebMcpTool` option | experimental | |

The 22.0.0 CHANGELOG titles say `provideWebMcpTools` and `declareWebMcpTool`; the shipped exports carry `Experimental` in their names. Developer preview and experimental APIs "can change at any time, even in new patch versions of the framework" (releases page).

## [NG-012] `ng mcp`: tools, flags and server instructions
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-17
- Sources: [Angular CLI MCP Server](https://angular.dev/ai/mcp) ([source](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/ai/mcp-server-setup.md)), [mcp source at v22.2.3](https://github.com/angular/angular-cli/tree/v22.2.3/packages/angular/cli/src/commands/mcp), [angular-cli CHANGELOG](https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md), [Announcing Angular v21](https://blog.angular.dev/announcing-angular-v21-57946c34f14b)
- Related: NG-013, NG-014, NG-015, MCP-015

The Angular CLI runs a stdio MCP server (`ng mcp`), added in 20.1.0 (2025-07-09). The v21 post: "the MCP server is now stable!"; angular.dev's develop-with-ai page still calls it "experimental". At 22.2.3 all nine tools are in the source's stable list and the experimental list is empty.

| Tool | `--read-only` keeps | `--local-only` keeps |
|---|---|---|
| `list_projects`, `get_best_practices`, `onpush_zoneless_migration`, `ai_tutor`, `devserver_wait_for_build` | yes | yes |
| `search_documentation` (angular.dev's search index) | yes | no |
| `run_target`, `devserver_start`, `devserver_stop` | no | yes |

- Flags (`ng mcp --help`): `--read-only`, `--local-only`, and `--root` ("Allowed root directory paths for filesystem access and workspace discovery", 22.2.0). A hidden `--experimental-tool` enables nothing at 22.2.3.
- `search_documentation` takes `version`; without it the code searches v22's docs whatever the repo runs (`LATEST_KNOWN_DOCS_VERSION = 22`). Pass the major from `list_projects`.
- The server sends 1,462 characters of `instructions`, which Claude Code shows the model (MCP-015): "You MUST prefer the tools provided by this server over using 'run_shell_command'", "Always begin by calling 'list_projects'", and "Before writing or modifying code, you MUST call 'get_best_practices'".
- Tool names changed across releases: the v21 post's `find_examples` and `modernize` tools and v21's `test` and `e2e` tools are gone at 22.2.3 (`run_target` covers build, test and e2e).

Tested 2026-10-17, `@angular/cli@22.2.3`, Node 24.21.0, over stdio: `tools/list` returned the nine tools with `readOnlyHint` set as in the table; `--read-only` returned six and `--local-only` eight.

## [NG-013] Context cost of `ng mcp` in Claude Code
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-17
- Sources: local `claude -p` probes (this entry), [MCP: scale with tool search](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search)
- Related: NG-012, TOK-020, MCP-012, MCP-039, SKILL-022

With tool search on (the default, TOK-020), `ng mcp` adds about 765 input tokens to every request: nine deferred tool names plus its instructions. With tool search off, its full definitions cost about 6,500.

Tested 2026-10-17, Claude Code v2.1.296, WSL terminal, `@angular/cli@22.2.3`, outside a workspace, two runs per row of `claude -p "Reply with the single word ok." --model haiku --max-turns 1 --max-budget-usd 0.05 --strict-mcp-config --output-format json`, total input tokens (input plus cache creation plus cache read):

| Setup | Input tokens | Added by `ng mcp` |
|---|---|---|
| No MCP server | 35,646–35,651 | |
| `--mcp-config` with `ng mcp` | 36,413–36,414 | about 765 |
| … `ng mcp --read-only` | 36,366–36,367 | about 718 |
| `ENABLE_TOOL_SEARCH=false`, no server | 58,906–58,907 | |
| `ENABLE_TOOL_SEARCH=false`, `ng mcp` | 65,406–65,414 | about 6,500 |

The raw `tools/list` response is 20,520 characters. `--read-only` saves little context; use it to keep the server from running builds and dev servers, not for cost.

Tool results cost more than the definitions: `get_best_practices` returns the 2,970-byte guide (NG-015), and the instructions tell Claude to call it before any edit.

## [NG-014] Running `ng mcp` from a repo's `.mcp.json`
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-17
- Sources: [Angular CLI MCP Server](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/ai/mcp-server-setup.md), `ai-config` schematic in `@schematics/angular@22.2.3`, [angular-cli CHANGELOG 22.1.0 and 22.1.4](https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md), [npm exec](https://docs.npmjs.com/cli/commands/npm-exec), [MCP: installation scopes](https://code.claude.com/docs/en/mcp#mcp-installation-scopes)
- Related: NG-012, NG-013, MCP-002, MCP-004, MCP-028, MCP-019

Put `ng mcp --read-only` in the repo's `.mcp.json`, run through the repo's own CLI:

```json
{ "mcpServers": { "angular-cli": { "command": "npx", "args": ["ng", "mcp", "--read-only"] } } }
```

- **Why the local CLI.** angular.dev shows only Antigravity, Cursor and VS Code setups, all with `npx -y @angular/cli mcp`. Since 22.1.0, `ng new --ai-config=claude-code` (or `ng generate ai-config`) writes that line into `.mcp.json` plus a `CLAUDE.md` holding a copy of the best-practices guide (22.1.4: "generate CLAUDE.md for Claude Code instead of AGENTS.md"). Without the CLI in `node_modules`, `npx -y @angular/cli` fetches the latest release, whose tools, names and docs version may not match the repo (NG-012). `npx ng` uses the installed one, so it needs `npm ci` first: the registry's own `ng` package is not Angular (`npm view ng`: 0.0.0, no bin).
- **Why `--read-only`.** It drops `run_target` and the dev-server tools; builds and tests stay with the repo's verify command.
- **Permissions.** Allow the read-only tools by name, e.g. `mcp__angular-cli__get_best_practices` (MCP-004). Project servers ask for approval once in interactive sessions (MCP-002).

Tested 2026-10-17, `@angular/cli@22.2.3`: `ng new probe-app --ai-config=claude-code --dry-run` created `CLAUDE.md (2970 bytes)` and `.mcp.json (121 bytes)`; `--ai-config=claude` failed with "Invalid values".

Ours (2026-10-17): osrs-tracker-web and freek-mencke-web use exactly the snippet above, and user settings allow `get_best_practices`, `list_projects` and `search_documentation` (MCP-028).

## [NG-015] `get_best_practices` returns the guide for the installed version
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-17
- Sources: `tools/best-practices.js` in `@angular/cli@22.2.3`, npm registry (`npm view @angular/core@<version> angular.bestPractices.path`), [best-practices.md at 22.2.3](https://unpkg.com/@angular/core@22.2.3/resources/best-practices.md) and [at 21.0.0](https://unpkg.com/@angular/core@21.0.0/resources/best-practices.md), [angular-cli CHANGELOG 21.0.0](https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md)
- Related: NG-012, NG-016, NG-003

`get_best_practices` reads an `angular.bestPractices` block in the project's installed `@angular/core/package.json` and returns that file; failing that, it "falls back to a generic guide bundled with the Angular CLI" (made "version-aware" in 21.0.0).

- `@angular/core` 21.0.0 and later ship `resources/best-practices.md`; 20.3.34 has no `bestPractices` field, so a v20 repo gets the guide bundled with whichever CLI runs the server.
- The guides differ by version. 21.0.0: "Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator", "Prefer Reactive forms instead of Template-driven ones", "Do not write arrow functions in templates (they are not supported)". 22.2.3: "Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly", "Prefer Signal Forms… They are stable in Angular v22+", "Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})`".
- The file is short (2,970 bytes at 22.2.3) and is the same text as angular.dev's `best-practices.md`, the CLAUDE.md that `ng new --ai-config=claude-code` writes, and the guide bundled in `@angular/cli@22.2.3` (compared byte for byte, 2026-10-17).

So in a repo with `ng mcp`, this tool is the version-matched source for Angular's own rules; the downloadable rules files are not (NG-016).

## [NG-016] Angular's rules files and llms.txt
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [LLM prompts and AI IDE setup](https://angular.dev/ai/develop-with-ai) ([source](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/ai/develop-with-ai.md)), [context files](https://github.com/angular/angular/tree/main/adev/src/context), [angular.dev/llms.txt](https://angular.dev/llms.txt), [llms-full.txt](https://angular.dev/assets/context/llms-full.txt), [docs deploy mapping](https://raw.githubusercontent.com/angular/angular/main/.github/actions/deploy-docs-site/lib/deployments.mts)
- Related: NG-015, NG-017, MEM-008, REPO-045, TOK-090

angular.dev's "LLM prompts and AI IDE setup" page offers `best-practices.md` and per-tool rules files: `GEMINI.md`, `guidelines.md` (as `copilot-instructions.md`, `.instructions.md` and Windsurf's file), `angular-20.mdc` for Cursor and `AGENTS.md` for JetBrains. It lists no Claude Code file. "These files will be updated on a regular basis".

What they hold on 2026-10-17 (live copies matched the `22.2.x` branch):
- `AGENTS.md`, `GEMINI.md` and `guidelines.md` are one 5,525-byte file. Its persona says "You are currently immersed in Angular v20+", yet its rules are v22's (OnPush default, signal forms, `@Service`). It contradicts itself: "Prefer inline templates for small components", and "put… the html template in the html file".
- `angular-20.mdc` predates v22: no OnPush default, no signal forms, no `@Service`.
- angular.dev deploys from the latest release branch (`next.angular.dev` from `main`), so the files follow the newest release, not your version, unlike `get_best_practices` (NG-015).
- `llms.txt` (6,745 bytes) links angular.dev HTML pages; angular.dev serves no `.md` versions (a `.md` URL returned HTML). `llms-full.txt` is 856,540 bytes, too big to read whole (TOK-090).

For Claude Code: Claude Code reads `AGENTS.md` only when there's no CLAUDE.md (MEM-008), and a copied rules file goes stale with the next major. Angular's own rules come version-matched from `get_best_practices`, and how-to from the `angular-developer` skill (NG-017).

## [NG-017] angular/skills follows Angular's `main` branch
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-17
- Sources: [angular/skills](https://github.com/angular/skills) ([README](https://raw.githubusercontent.com/angular/skills/main/README.md), [angular-developer SKILL.md](https://raw.githubusercontent.com/angular/skills/main/angular-developer/SKILL.md), [angular-new-app SKILL.md](https://raw.githubusercontent.com/angular/skills/main/angular-new-app/SKILL.md)), [Agent Skills](https://angular.dev/ai/agent-skills) ([source](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/ai/agent-skills.md)), [Announcing Angular v22](https://blog.angular.dev/announcing-angular-v22-c52bb83a4664), [claude-skills sync workflow](https://github.com/FreekMencke/claude-skills/blob/main/.github/workflows/sync-angular-skill.yml)
- Related: NG-016, NG-007, SKILL-041, SKILL-042, SKILL-032

angular/skills (created 2026-03-23, introduced in the v22 post) holds two skills: `angular-developer` (a SKILL.md plus 43 reference files) and `angular-new-app`. It is a build output: changes are made "in `angular/angular` repository", and each angular/angular commit is mirrored with a tag like `22.3.0-next.2+sha-29bfe10`. It has no GitHub releases and no LICENSE file (MIT in the SKILL.md frontmatter). angular.dev installs it with `npx skills add https://github.com/angular/skills`.

So it describes `main`, not your version:
- `angular-developer`'s first rule is "Always analyze the project's Angular version before providing guidance", but references state v22-only APIs flatly: `creating-services.md` says "Using `@Service` is the recommended approach for most services", with no version note.
- `angular-new-app` tells agents to pass `--ai-config=[agents, claude, copilot, …]`, the v21 values; `@angular/cli@22.2.3` rejects them (NG-014).

Ours: claude-skills mirrors `angular-developer` weekly into the `freek-skills` plugin, byte for byte except the frontmatter (equal on 2026-10-17), and `angular-conventions` adds that the installed `@angular/core` version wins. Anthropic's skills and plugin repos have no Angular skill (checked 2026-10-17).

## [NG-018] In-page WebMCP and AI debugging tools (v22)
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [WebMCP guide](https://angular.dev/ai/webmcp) ([source](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/ai/webmcp.md)), [`debug/ai/registration.ts` and `platform.ts` at v22.2.3](https://github.com/angular/angular/tree/v22.2.3/packages/core/src/debug/ai), [chrome-devtools-mcp third-party tools](https://raw.githubusercontent.com/ChromeDevTools/chrome-devtools-mcp/main/docs/third-party-developer-tools.md), [chrome-devtools-mcp configuration](https://raw.githubusercontent.com/ChromeDevTools/chrome-devtools-mcp/main/docs/configuration.md)
- Related: NG-011, NG-012, MCP-028

Two v22 features let agents in a browser call into a running Angular app. Neither reaches a Claude Code session without a browser MCP server that supports them.

- **WebMCP tools for your users' agents.** "WebMCP is a proposed web standard"; Angular's support "is currently **experimental**. APIs are subject to change even outside of major versions." `provideExperimentalWebMcpTools` registers app-wide tools, `declareExperimentalWebMcpTool` registers one in an injection context, and signal forms can expose themselves through `experimentalWebMcpTool`.
- **Debugging tools for your coding agent.** In dev mode (`ngDevMode`), creating the platform calls `registerAiTools()`, which answers the `devtoolstooldiscovery` event with two tools, `angular:di_graph` and `angular:signal_graph`.

chrome-devtools-mcp dispatches that event and lists the tools with `list_3p_developer_tools()`, behind `--categoryExperimentalThirdParty=true`. Its WebMCP category "Requires Chrome 150+ with the following flag: `--enable-features=WebMCP`". Our sessions use the Playwright MCP server (MCP-028); neither path was tested.

## [NG-019] Resources: `isLoading()` covers the first load, and `error()` stays set during `reload()`
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-28
- Sources: [Resources guide at v22.2.3](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/signals/resource.md), [httpResource guide at v22.2.3](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/http/http-resource.md), [`resource/api.ts`](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/src/resource/api.ts) and [`resource/resource.ts` at v22.2.3](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/src/resource/resource.ts), osrs-tracker/osrs-tracker-web#479
- Related: NG-011, UIPAT-005, UIPAT-015

Two signals of `resource`, `rxResource` and `httpResource` (one `ResourceImpl`) mislead a Try again button:

- **`isLoading()` is not "the user retried".** The guide: "Whether the resource loader is currently running", so it is true on the first load too. A "Checking…" label bound to it shows before anyone clicks. Drive it from `status() === 'reloading'` (only a `reload()` gives that status) or a signal set on click and cleared when the reload settles.
- **`error()` stays set while a reload runs.** The docs don't say so; the source does. On `reload()` with the same params the state keeps the previous stream (`if (previous.value.extRequest.request === request) stream = previous.value.stream;`), and `error` reads that stream. A view that checks `error()` first stays on its error panel, so Try again looks dead. The httpResource guide's own example has this order: `hasValue()`, then `error()`, then `isLoading()`.

Branch on `status()` instead. In `'reloading'` after an error, `hasValue()` is false and `value()` is `undefined`: show the loading state there, not "the previous value", which the guide's status table promises. A params change starts a fresh `'loading'` and clears `error()`.

Tested 2026-10-28, `@angular/core@22.2.3`, Node 24.21.0, Vitest 4.1.12 with TestBed (jsdom): first load `loading`, `isLoading` true; after a rejection `error`; after `reload()` `reloading` with `isLoading` true, `error()` still `503`, `hasValue()` false; then `resolved`.

## Recommendations for our setup

Ranked by impact against effort. Our Angular apps are osrs-tracker-web and freek-mencke-web, both on Angular 22.2 with TypeScript 6.0.3 (2026-10-17).

1. Done 2026-10-18: `angular-conventions` has an `## Upgrades` section (FreekMencke/claude-skills#79, FreekMencke/claude-skills#86; NG-002, NG-010, NG-001). Open: JSUP-002's `npm ls --all` check, FreekMencke/claude-skills#94.
2. **Keep `npx ng mcp --read-only` in each Angular repo's `.mcp.json`** (decision, in place 2026-10-17). It runs the installed CLI and costs about 765 tokens a request. NG-014, NG-013.
3. **Don't run `ng generate ai-config` or `ng new --ai-config=claude-code` in our repos** (decision). It writes `npx -y @angular/cli mcp` without `--read-only`, and a CLAUDE.md that copies the best-practices guide, which `get_best_practices` and `angular-developer` already supply, and which goes stale with the next major. NG-014, NG-015.
4. **Mirror only `angular-developer` from angular/skills** (decision). `angular-new-app`'s `--ai-config` values fail on 22.2.3, and we rarely create apps. NG-017.
5. **Don't copy Angular's rules files or llms-full.txt into repos** (decision): they follow the newest release, not the repo's, and the full file is 856 KB. NG-016, TOK-090.
6. **Kept on purpose: v22 leftovers.** freek-mencke-web's update to 22 (FreekMencke/freek-mencke-web#3, 2026-10-14) kept the migrations' extended-diagnostics opt-outs on purpose. Its 9 explicit `OnPush` and both apps' `provideZonelessChangeDetection()` are redundant but harmless: remove them when those files change (angular-eslint's `allowExplicitOnPush: false` strips the `OnPush` lines). NG-003, NG-004, NG-010.
7. **`angular-conventions`: a reload after an error gets the loading state, and a retry label comes from `'reloading'` or a click, not `isLoading()`** (FreekMencke/claude-skills#130). NG-019.

## Open questions

1. **When will Angular accept TypeScript 7?** `@angular/compiler-cli@22.3.0-next.2` still peers `>=6.0 <6.1`. Angular's 2026-09-25 post aims for an experimental ngp compiler later in 2026 and gives no stable date (NG-002); the roadmap page has none either. Where we looked: the npm registry, the angular CHANGELOG, the releases and roadmap pages, the blog's RSS feed. TypeScript 7 itself: `kb-typescript.md`.
2. **Can a Claude Code session reach Angular's in-page tools?** chrome-devtools-mcp documents the `devtoolstooldiscovery` path behind an experimental flag; not tested, and not checked for the Playwright server (NG-018).
3. **Does Claude Code send MCP roots to `ng mcp`?** Without them the server falls back to its working directory (from the source, read by a subagent). Our `.mcp.json` setups start it in the repo root, so it hasn't mattered.
4. **Is the Karma-to-Vitest migration experimental or stable?** The docs at v22.2.3 and the CLI 22.0.0 CHANGELOG disagree (NG-009).
5. **Which official page gets corrected?** The versions page's TypeScript range for 21.x and the CLI CHANGELOG's Node minimum disagree with the published packages (NG-002).
6. **`@defer`'s status and the version it went stable** weren't checked; the defer guide at v22.2.3 has no status marker.
