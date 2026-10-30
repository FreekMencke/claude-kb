# Testing Node/TS code, and tests written by agents

Prefix `JSTEST`. This file covers testing JavaScript and TypeScript on 2026-10-17: Vitest 4 and 5 and what breaks in an upgrade, Angular's `unit-test` builder, Jest or Vitest for NestJS 12, Playwright for end-to-end tests and as an agent's check, mutation testing with StrykerJS against plain coverage, and what agents get wrong when they write tests. `node:test` is in `kb-nodejs.md` (NODE-008), Angular's switch to Vitest in `kb-angular.md` (NG-009), Vitest's agent reporter in `kb-token-usage.md` (TOK-111), the test-driven workflow in `kb-workflows.md` (FLOW-002) and test gaming in `kb-prompting.md` (PROMPT-028). Accessibility checks and linting have their own files.

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#179, part of roadmap #167) by an Opus 5.5 lead with four Sonnet 5.5 readers.
- Versions and dates come from the npm registry (`npm view <pkg> dist-tags`, `npm view <pkg> 'time[<version>]'`, `npm view <pkg>@<version> peerDependencies engines`). Docs were read as raw text: vitest-dev/vitest at `v5.0.5` and `v4.1.12`, angular/angular-cli and angular/angular at `v22.2.3`, nestjs/docs.nestjs.com (`master`), nestjs/schematics at `12.0.7`, jestjs/jest at `v30.5.2`, vitejs/vite at `v8.3.4`, microsoft/playwright at `v1.64.1`, stryker-mutator/stryker-js at `v10.0.0`, and the Claude Code docs' `.md` pages.
- Tested on Node 24.21.0 (WSL2) with official packages installed by `npm install --ignore-scripts` in a scratch folder: `vitest@5.0.5` (with `vite@8.3.4`), `@nestjs/core`, `@nestjs/common` and `@nestjs/testing` `12.1.3`, `typescript@6.0.3`, `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` `10.0.0`, `@vitest/coverage-v8@5.0.5`. No community package was run.
- Our repos' setup was read on 2026-10-17 from `main` of osrs-tracker-web, osrs-tracker-api and freek-mencke-web: the two Angular apps run `@angular/build:unit-test` 22.2.2 with Vitest 5.0.4 and jsdom; the API runs `vitest run` (5.0.x) on NestJS 12.1. None uses Jest, Playwright Test or Stryker.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| What breaks when I upgrade Vitest 4 to 5? | Node 22.12+ and a `vite` peer (6.4+); `clearMocks` on by default; `vi.mock` inside a block throws; unawaited `.resolves`/`.rejects` fail the test; `-t` matches `suite > test`; `json`/`junit` reporters write files, not stdout; no config lookup in parent folders. | JSTEST-001 |
| What broke from Vitest 3 to 4? | Pool options (`maxWorkers`, no `poolOptions`), `coverage.all` removed, `new` on a mock needs a `function` or class, `restoreAllMocks` only restores `vi.spyOn`, default `exclude` is only `node_modules` and `.git`, `workspace` became `projects`. Upgrade one major at a time; no codemod. | JSTEST-002 |
| Why do my Vitest 5 tests ignore a tsconfig or plugin change? | The file-system module cache (on by default) keys on file content, not tsconfig: run `vitest --clearCache` or `--fsModuleCache=false`. Angular's builder turns it off from 22.2.3. | JSTEST-003 |
| Which `vitest.config` does `ng test` read? | None by default. `runnerConfig: true` loads only `vitest-base.config.*`; the builder overrides `include`, `projects`, `watch` and reporters, and defaults `isolate` to false. | JSTEST-004 |
| jsdom, happy-dom or browser mode in Angular? | Unset `browsers` means jsdom, or happy-dom if it's installed at all. A real browser needs `browsers` plus `@vitest/browser-playwright`. `vi.mock` of a relative import throws under the builder: mock through TestBed. | JSTEST-005 |
| Does the Jasmine-to-Vitest schematic finish the job? | No: it leaves TODOs for custom matchers, `jasmine.clock()` extras, `createSpyObj` edge cases and `done` callbacks, converts `fakeAsync` only on request, and writes a report file to the project root. | JSTEST-006 |
| Jest or Vitest for a NestJS 12 project? | Vitest: `nest new` gives ESM projects (the default) Vitest and CommonJS ones Jest, and `nest upgrade` doesn't switch runners. Jest loads Nest 12's ESM-only packages only on Node 24.9+. | JSTEST-007, JSTEST-009 |
| Does Nest need `unplugin-swc` under Vitest 5? | No for class-typed constructor injection: Vite 8's Oxc emits decorator metadata from tsconfig (tested). A type alias, union or `import type` becomes `Object` and DI fails. | JSTEST-008 |
| Can Jest run ESM? | Still "experimental": `--experimental-vm-modules`, `jest.unstable_mockModule` and dynamic `import()`. `require()` of ESM works from Jest 30.4.0 on Node 24.9+. ts-jest 29.4.15 peers `typescript <7`. | JSTEST-009 |
| Which Playwright, and which settings cut flaky e2e tests? | 1.64.1 (2026-10-14), Node 20+. Web-first assertions, role locators, `retries` with `failOnFlakyTests` in CI, `trace: 'on-first-retry'`, `--repeat-each` and `--shuffle` to flush out order dependence. | JSTEST-010 |
| How do I point Playwright at an SSR app? | `webServer` builds and starts the server (`timeout` default 60 s), `reuseExistingServer: !process.env.CI`, explicit `use.baseURL`; test server HTML with `javaScriptEnabled: false` or the `request` fixture. | JSTEST-011 |
| Should an agent check UI with Playwright tests, Test Agents, MCP or the CLI? | Tests for regressions; MCP or `@playwright/cli` to look at a page. The Test Agents' healer can mark a test `test.fixme()`. No Playwright reporter detects agents: pass `--reporter=line`. | JSTEST-012 |
| How do I know whether an agent's tests would catch a bug? | Not from coverage: a weak suite scored 100% coverage and a 60% mutation score. Mutation testing (Thoughtworks Radar: Trial, April 2026) shows which changes no test notices. | JSTEST-013 |
| Can I run Stryker on Vitest 5 today? | Not reliably: `@stryker-mutator/vitest-runner` 10.0.0 scores tests inside `describe` blocks as 0% on Vitest 5 (tested; fix PR open), and it has no support for Angular's builder. | JSTEST-014 |
| What do agents get wrong in tests, and what stops it? | Shallow assertions, over-mocking, implementation details, Jest APIs in Vitest, and skipping or loosening tests to get green. A spec that fails before the fix, a diff check on spec files, and a reviewer that didn't write the tests. | JSTEST-016, JSTEST-017 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| JSTEST-001 | Vitest 5.0: the breaking changes agents trip over | fact | vitest, vitest-5, migration, mocks |
| JSTEST-002 | Vitest 4.0: breaking changes from 3.x, and the upgrade path | fact | vitest, vitest-4, migration, coverage |
| JSTEST-003 | Vitest 5's file-system module cache can test stale code | fact | vitest, vitest-5, cache, angular |
| JSTEST-004 | Angular's `unit-test` builder: options, defaults and what it overrides | fact | angular, unit-test-builder, vitest, configuration |
| JSTEST-005 | jsdom, happy-dom or browser mode under Angular's builder, and `vi.mock` | fact | angular, jsdom, happy-dom, browser-mode, mocks |
| JSTEST-006 | The Jasmine-to-Vitest refactor: what it leaves for you | fact | angular, jasmine, vitest, migrations |
| JSTEST-007 | NestJS 12: Vitest for ESM projects, Jest for CommonJS, and moving a suite | comparison | nestjs, vitest, jest, esm, migration |
| JSTEST-008 | Nest's dependency injection under Vitest 5 without `unplugin-swc` | fact | nestjs, vitest, decorators, oxc, swc |
| JSTEST-009 | Jest 30: experimental ESM, `require(esm)` and upgrade traps | fact | jest, esm, ts-jest, migration |
| JSTEST-010 | Playwright 1.64: flakiness controls and defaults | fact | playwright, e2e, flakiness, retries |
| JSTEST-011 | Playwright against an SSR app: `webServer`, `baseURL` and server HTML | pattern | playwright, ssr, webserver, e2e |
| JSTEST-012 | Playwright in an agent's loop: tests, Test Agents, MCP or CLI | comparison | playwright, agents, mcp, reporters |
| JSTEST-013 | Coverage doesn't show whether tests catch bugs; mutation testing does | fact | coverage, mutation-testing, agent-tests |
| JSTEST-014 | StrykerJS 10 with Vitest: setup, cost, and the Vitest 5 bug | tool | stryker, mutation-testing, vitest |
| JSTEST-015 | Feeding surviving mutants back to an agent | pattern | stryker, mutation-testing, agent-tests |
| JSTEST-016 | What agents get wrong in tests, and the checks that catch it | anti-pattern | agent-tests, mocks, reward-hacking, review |
| JSTEST-017 | Test-first with an agent: when it pays off | recommendation | tdd, agent-tests, workflow |

## [JSTEST-001] Vitest 5.0: the breaking changes agents trip over
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Vitest 5 migration guide](https://vitest.dev/guide/migration) ([raw at v5.0.5](https://raw.githubusercontent.com/vitest-dev/vitest/v5.0.5/docs/guide/migration/index.md)), [v5.0.0 release](https://github.com/vitest-dev/vitest/releases/tag/v5.0.0), npm registry
- Related: JSTEST-002, JSTEST-003, JSTEST-014, TOK-111

`vitest` 5.0.0 was published 2026-09-03 and 5.0.5 on 2026-10-15 (`npm view vitest 'time[5.0.5]'`). "Vitest 5.0 requires Vite >= 6.4.0 and Node.js >= 22.12.0"; `vite` is now a peer (`^6.4.0 || ^7.0.0 || ^8.0.0`), which npm installs but Yarn doesn't.

Changes that turn a green suite red or hide output:
- "`clearMocks` now defaults to `true`": call counts recorded in a setup file, at module level or in `beforeAll` are gone before the test asserts on them.
- `vi.mock`, `vi.unmock` and `vi.hoisted` inside a function, block or `describe` "now throws".
- Unawaited `resolves`, `rejects` and `toMatchFileSnapshot` "now fail the test".
- `-t`/`testNamePattern` matches the full name joined with `' > '` (`'math > adds'`).
- `expect.poll` fails at its timeout; `toThrow("")` matches any message.
- "The `json` and `junit` reporters now write to a file by default instead of printing to stdout" (`.vitest/json/output.json`): `vitest --reporter=json | jq` breaks.
- "Vitest no longer searches parent directories for config files."
- Fake timers and `setSystemTime` also mock `Temporal`; `test.sequential` is removed (`{ concurrent: false }`); `VITEST_WORKER_ID` starts at 1.

There's no codemod; the guide has a copyable agent prompt ("Fetch the migration guide from https://vitest.dev/guide/migration.md… If the current version is lower than Vitest 4, apply changes from earlier migration guides first").

Tested 2026-10-17, vitest@5.0.5, Node 24.21.0: with no config, a module-level `vi.fn()` called in two tests counted 1 call in the second; an unawaited `expect(Promise.resolve(2)).resolves.toBe(2)` failed with "Promise returned by `expect(actual).resolves.toBe(expected)` was not awaited".

## [JSTEST-002] Vitest 4.0: breaking changes from 3.x, and the upgrade path
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Vitest 4 migration guide](https://v4.vitest.dev/guide/migration) ([raw at v4.1.12](https://raw.githubusercontent.com/vitest-dev/vitest/v4.1.12/docs/guide/migration.md)), npm registry
- Related: JSTEST-001, JSUP-003, JSUP-008

`vitest` 4.0.0 was published 2025-10-22; the `V4` dist-tag is 4.1.12. "Vitest 4.0 requires **Vite >= 6.0.0** and **Node.js >= 20.0.0**." The changes most likely to break a 3.x suite or config:

- **Pools:** "`maxThreads` and `maxForks` are now `maxWorkers`"; "`poolOptions` is removed. All previous `poolOptions` are now top-level options"; `singleThread` becomes `maxWorkers: 1, isolate: false`.
- **Coverage:** "removed `coverage.all` completely and defaulted to include only covered files in the report": set `coverage.include`, or untested files vanish from the report. V8 remapping changed the numbers.
- **Mocks called with `new`:** "if you provide an arrow function, you will get `<anonymous> is not a constructor`"; use `function` or `class`. "`vi.restoreAllMocks` no longer resets the state of spies and only restores spies created manually with `vi.spyOn`".
- **Discovery:** "Vitest now only excludes tests from `node_modules` and `.git` folders": tests in `dist` run unless excluded.
- **Removed config:** `workspace` (now `projects`), `environmentMatchGlobs`, `poolMatchGlobs`, `deps.inline`/`external` (`server.deps.*`); options as the third argument of `test()` (pass them second).
- **Browser mode:** providers are packages (`@vitest/browser-playwright`), passed as objects; `@vitest/browser/context` becomes `vitest/browser`.
- **Reporters:** `basic` removed; `verbose` prints a flat list (`tree` for the old one).

Path from 3.x: apply the 4 guide, run the suite, then the 5 guide (JSTEST-001), one major per PR (JSUP-008). No official codemod exists for either major (JSUP-003).

## [JSTEST-003] Vitest 5's file-system module cache can test stale code
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Vitest config: fsModuleCache](https://vitest.dev/config/fsmodulecache) ([raw at v5.0.5](https://raw.githubusercontent.com/vitest-dev/vitest/v5.0.5/docs/config/fsmodulecache.md)), [fsModuleCachePath](https://vitest.dev/config/fsmodulecachepath), [angular-cli CHANGELOG 22.2.3](https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md), [angular/angular-cli#34311](https://github.com/angular/angular-cli/pull/34311)
- Related: JSTEST-001, JSTEST-004, JSTEST-008

New in 5.0.0: `fsModuleCache`, "Default: `true`", persists transformed modules in `node_modules/.vitest-cache` across runs. The docs' Known Issues: the key is "file content, its id, Vite's environment configuration and coverage status… If you have a plugin that relies on things outside the file content or the public configuration… it's possible that the cache will get stale." Clear it with `vitest --clearCache`, or run with `--fsModuleCache=false`.

What an agent sees: it changes `tsconfig.json` or a plugin option, reruns, and nothing changes, so it concludes the change didn't work.

Tested 2026-10-17, vitest@5.0.5 with vite@8.3.4, Node 24.21.0: after flipping `emitDecoratorMetadata` in `tsconfig.json` without touching the spec, the next run kept the old transform (a Nest DI spec stayed failing); `--fsModuleCache=false` passed, and so did a normal run after `vitest --clearCache`.

Angular's `unit-test` builder hands Vitest a bundle, so a change to the code under test alone could reuse the old one. Our two Angular apps hit this and set `fsModuleCache: false` in a `vitest-base.config.ts`; `@angular/build` 22.2.3 (2026-10-15) does it itself: "disable Vitest fsModuleCache in unit-test builder". CI starts from a fresh `node_modules`, so this is a local problem.

## [JSTEST-004] Angular's `unit-test` builder: options, defaults and what it overrides
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Testing overview](https://angular.dev/guide/testing) ([source at v22.2.3](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/testing/overview.md)), [unit-test schema.json at v22.2.3](https://github.com/angular/angular-cli/blob/v22.2.3/packages/angular/build/src/builders/unit-test/schema.json), [vitest runner configuration.ts and plugins.ts at v22.2.3](https://github.com/angular/angular-cli/tree/v22.2.3/packages/angular/build/src/builders/unit-test/runners/vitest), [angular-cli CHANGELOG](https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md)
- Related: NG-009, JSTEST-003, JSTEST-005

`@angular/build:unit-test` runs Vitest by default (`runner`: `vitest`, or `karma`); `@angular/build@22.2.3` peers `vitest ^4.0.8 || ^5.0.0`. Schema defaults at v22.2.3:
- `include`: `["**/*.spec.ts", "**/*.test.ts"]`; `buildTarget` defaults to `build` with `development`.
- `watch`: "Defaults to `true` in TTY environments and `false` otherwise", so Claude Code's Bash gets a single run.
- `isolate`: "Defaults to false to align with the Karma/Jasmine experience."
- `splitting`: deprecated in 22.2.0, "no longer needed with Vitest 5".
- `setupFiles`: "The application's polyfills and the Angular TestBed are always initialized before these files"; `providersFile` for global test providers.
- `coverage`, `coverageInclude`, `coverageThresholds` (no glob form), `reporters`, `filter`, `browsers`, `headless`.

Which Vitest config it reads: `runnerConfig: true` searches the project and workspace roots for `vitest-base.config.{ts,mts,cts,js,mjs,cjs}` only; a plain `vitest.config.ts` is ignored unless `runnerConfig` names it. With `runnerConfig: false` (the default) no config file is loaded.

What it overrides in that config (plugins.ts): it deletes `test.projects` and `test.include`, drops `test.reporters` and `coverage.reporter` when angular.json sets them, drops `test.watch` when it differs, warns about `test.exclude`, and sets `globals: true`, `isolate: false` and `fsModuleCache: false`. So set test options in angular.json and keep the runner config for what the builder has no option for.

## [JSTEST-005] jsdom, happy-dom or browser mode under Angular's builder, and `vi.mock`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Testing overview](https://angular.dev/guide/testing) ([source at v22.2.3](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/testing/overview.md)), [plugins.ts, browser-provider.ts and build-options.ts at v22.2.3](https://github.com/angular/angular-cli/tree/v22.2.3/packages/angular/build/src/builders/unit-test/runners/vitest), [Vitest: Why Browser Mode](https://vitest.dev/guide/browser/why), [Vitest browser mode limitations](https://vitest.dev/guide/browser/)
- Related: JSTEST-004, JSTEST-006, NG-009

**DOM emulation (no `browsers`):** "New projects include `vitest` and `jsdom` by default." The builder sets the environment only when the Vitest config has none: `happy-dom` if it resolves from the project, otherwise `jsdom`. A `happy-dom` pulled in by any other dependency therefore switches the environment silently (from the source; not tested).

**Real browser:** install a provider (`npm install --save-dev @vitest/browser-playwright playwright`, or the WebdriverIO one), then set `browsers` in angular.json or run `ng test --browsers=chromiumHeadless`. "Tests run in a headed browser by default. If the `CI` environment variable is set, headless mode is used instead." Vitest's case for it: jsdom and happy-dom "only simulate a browser environment… false positives or negatives in test results may occur". Its limits: no native `alert`/`confirm`, and no `vi.spyOn` on an imported module namespace (`vi.mock(path, { spy: true })` instead). On 2026-10-17 `@vitest/browser-webdriverio` latest was 5.0.0 while Vitest was 5.0.5.

**`vi.mock` with a relative path throws** under the builder, in either mode: the setup file `vitest-mock-patch` raises "The "vi.mock" and related methods are not supported for relative imports with the Angular unit-test system. Please use Angular TestBed for mocking dependencies." Package specifiers still work. Agents reach for `vi.mock('./service')` by habit: point them at TestBed providers.

## [JSTEST-006] The Jasmine-to-Vitest refactor: what it leaves for you
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Migrating to Vitest](https://angular.dev/guide/testing/migrating-to-vitest) ([source at v22.2.3](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/testing/migrating-to-vitest.md)), [refactor/jasmine-vitest schematic at v22.2.3](https://github.com/angular/angular-cli/tree/v22.2.3/packages/schematics/angular/refactor/jasmine-vitest)
- Related: NG-009, NG-010, JSTEST-005

NG-009 has how to run `migrate-karma-to-vitest` and `ng g @schematics/angular:refactor-jasmine-vitest`, and the docs-against-CHANGELOG disagreement on whether the refactor is experimental. What it converts: `fit`/`fdescribe` to `.only`, `xit`/`xdescribe` to `.skip`, `spyOn` to `vi.spyOn`, `jasmine.createSpy` to `vi.fn`, `jasmine.objectContaining`/`any` to `expect.*`, and `fail()`. It doesn't install packages, edit angular.json or delete `karma.conf.js`, and the guide says it "does not handle complex or nested spy scenarios".

It leaves a TODO comment (from the schematic's `todo-notes.ts`) for:
- `jasmine.addMatchers` and custom equality testers ("Please manually migrate to expect.extend()");
- `toHaveSpyInteractions`, `toBePending`, `jasmine.mapContaining`/`setContaining`, `arrayWithExactContents` ("Vitest's arrayContaining is a subset check");
- `jasmine.clock().autoTick()`/`withMock()`, `calls.saveArgumentsByValue()`, `createSpyObj` with one argument or a dynamic name;
- a `done` callback "used in an unhandled way".

Gotchas: `fakeAsync` is converted to Vitest fake timers only with the `fakeAsync` option (default `false`); `report` (default `true`) writes `jasmine-vitest-<date>.md` to the project root, easy to commit by accident; and the guide says `fail()` becomes `vi.fail()` while the source emits `expect.fail()`. Ask the agent to grep for the TODOs and run the suite before calling it done.

## [JSTEST-007] NestJS 12: Vitest for ESM projects, Jest for CommonJS, and moving a suite
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Nest migration guide](https://docs.nestjs.com/migration-guide) ([raw](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/migration.md)), [Nest CLI usages](https://docs.nestjs.com/cli/usages), [Nest testing](https://docs.nestjs.com/fundamentals/testing), [nestjs/schematics application schema at 12.0.7](https://github.com/nestjs/schematics/blob/12.0.7/src/lib/application/schema.json), [Vitest: migrating from Jest](https://vitest.dev/guide/migration/jest) ([raw at v5.0.5](https://raw.githubusercontent.com/vitest-dev/vitest/v5.0.5/docs/guide/migration/jest.md))
- Related: JSTEST-008, JSTEST-009, JSUP-003

Nest 12's migration guide: "ESM projects use Vitest by default (CommonJS projects use Jest)". The `nest new` prompt (`@nestjs/schematics` 12.0.7) offers "ESM (ES Modules) [ with vitest ]" and "CJS (CommonJS) [ with jest ]", and `type` defaults to `esm`, also without a TTY. The ESM template runs `vitest run` with `vitest ^4.1.2` and `vite ^8.0.0`; the CommonJS one runs Jest 30 with ts-jest under `node --experimental-vm-modules`. The testing page: "Newly generated projects use Vitest by default. The testing APIs exposed by Nest don't depend on a specific runner".

`nest upgrade` "deliberately does not migrate your project to ESM, Vitest, or oxlint" (JSUP-003); it bumps Jest to 30 and warns that Jest can load the ESM-only v12 packages only on Node 24.9+ (JSTEST-009). So choose Vitest for new projects, and for a Jest suite that must run on Node older than 24.9.

Moving a Jest suite: Nest's guide lists updating the test scripts, replacing runner globals, and `supertest` imports (`import request from 'supertest'`). Vitest's Jest page adds what changes results:
- "Jest has their globals API enabled by default. Vitest does not" (Nest's template sets `globals: true`).
- `mockReset`: Jest's "replaces the mock implementation with an empty function"; Vitest's "resets the mock implementation to its original".
- A `vi.mock` factory "has to return an object with each export explicitly defined" (`default` included).
- Hooks run as a stack unless `sequence.hooks: 'list'`; `done` callbacks aren't supported.

## [JSTEST-008] Nest's dependency injection under Vitest 5 without `unplugin-swc`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Vite features: emitDecoratorMetadata](https://vite.dev/guide/features) ([raw at v8.3.4](https://raw.githubusercontent.com/vitejs/vite/v8.3.4/docs/guide/features.md)), [Oxc transformer: TypeScript](https://oxc.rs/docs/guide/usage/transformer/typescript), [esbuild: TypeScript caveats](https://esbuild.github.io/content-types/#typescript-caveats), [Nest recipe: SWC](https://docs.nestjs.com/recipes/swc), [nestjs/schematics ts-esm template at 12.0.7](https://github.com/nestjs/schematics/tree/12.0.7/src/lib/application/files/ts-esm)
- Related: JSTEST-007, JSTEST-003, NODE-004

Nest injects constructor dependencies by their `design:paramtypes` metadata. esbuild, Vite's TypeScript transform before Vite 8: "The emitDecoratorMetadata TypeScript configuration option is not supported"; hence Nest's SWC recipe, which pairs Vitest with `unplugin-swc` and a `.swcrc` with `"decoratorMetadata": true`. Vite 8 transforms with Oxc, which reads `experimentalDecorators` and `emitDecoratorMetadata` from tsconfig. Nest 12's own ESM template ships a `vitest.config.ts` with no plugin ("Requires Vite 8").

The limit, in Vite's docs: "This option is only partially supported. Full support requires type inference by the TypeScript compiler", and Oxc's: it "will fallback to `Object` type if it cannot calculate the type of the decorator metadata." A parameter typed with a class works; one typed with a type alias, a union or an `import type` gets `Object`, and Nest can't resolve it. Use the class type or an explicit `@Inject(token)`.

Tested 2026-10-17, vitest@5.0.5, vite@8.3.4, @nestjs/core and @nestjs/testing 12.1.3, Node 24.21.0, tsconfig with `experimentalDecorators` and `emitDecoratorMetadata`, no plugin: `Test.createTestingModule` injected a same-file class and a class imported from another file; a parameter typed `type Alias = OtherDep` got `design:paramtypes` `[Object]` and failed with "Nest can't resolve dependencies of the ByAlias (?)". With `emitDecoratorMetadata: false` the metadata was missing and injection failed (after clearing the cache: JSTEST-003). osrs-tracker-api runs this way, without `unplugin-swc`.

## [JSTEST-009] Jest 30: experimental ESM, `require(esm)` and upgrade traps
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Jest: ECMAScript Modules](https://jestjs.io/docs/ecmascript-modules) ([raw at v30.5.2](https://raw.githubusercontent.com/jestjs/jest/v30.5.2/docs/ECMAScriptModules.md)), [Upgrading to Jest 30](https://jestjs.io/docs/upgrading-to-jest30), [Jest CHANGELOG at v30.5.2](https://raw.githubusercontent.com/jestjs/jest/v30.5.2/CHANGELOG.md), [Nest migration guide](https://docs.nestjs.com/migration-guide), npm registry
- Related: JSTEST-007, NPM-014, TS-009, NODE-010

`jest` latest is 30.5.2 (2026-09-18). "Jest ships with **experimental** support for ECMAScript Modules (ESM)": run `node --experimental-vm-modules`, and set `transform: {}` or a transformer that emits ESM. "the hoisting of `jest.mock` calls that happens in CJS won't work for ESM": use `jest.unstable_mockModule` ("this API is still work in progress") and then `await import()`.

CommonJS suites and ESM-only packages (Nest 12's, for one): 30.4.0 (2026-05-07) added "Support `require()` of ES modules on Node v24.9+"; the docs: "On Node versions older than v24.9, `require()` of an ESM file still throws `ERR_REQUIRE_ESM`". 30.5.0 (2026-08-28) adds a transform fallback for older Node. Nest's guide names a different error for the same case (`ERR_REQUIRE_ASYNC_MODULE`); neither was tested here.

TypeScript: ts-jest 29.4.15 (latest) peers `typescript >=4.3 <7` and Jest 30 needs TypeScript 5.4 or later, so a ts-jest suite stays on TypeScript 6 (TS-009). Its ESM guide still says "Mocking ES modules are not supported yet", older than Jest's `unstable_mockModule`.

Upgrade traps from the Jest 30 guide that agents write from habit: removed aliases (`toBeCalled()` → `toHaveBeenCalled()`, `toBeCalledWith`, `lastCalledWith`, `toThrowError` → `toThrow`); "The `--testPathPattern` flag is now `--testPathPatterns`"; `jest.genMockFromModule` removed (`jest.createMockFromModule`); `SpyInstance` type removed (`jest.Spied`); `jest.mock()` paths are case-sensitive.

## [JSTEST-010] Playwright 1.64: flakiness controls and defaults
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Playwright release notes](https://playwright.dev/docs/release-notes), [Timeouts](https://playwright.dev/docs/test-timeouts), [Retries](https://playwright.dev/docs/test-retries), [Best practices](https://playwright.dev/docs/best-practices), [Command line](https://playwright.dev/docs/test-cli) (all raw from microsoft/playwright `docs/src/` at v1.64.1), npm registry
- Related: JSTEST-011, JSTEST-012

`@playwright/test` latest is 1.64.1 (2026-10-14; 1.64.0 on 2026-10-07), engines `node >=20`. 1.64 forwards `screen` from device descriptors ("`window.screen` and media queries now see the emulated screen size"; opt out with `screen: undefined`), which can change responsive snapshots.

Defaults: test timeout `30_000 ms`, expect timeout `5_000 ms`, action and navigation "no timeout"; "By default failing tests are not retried"; workers "half of the number of logical CPU cores"; tests within a file run in order unless `fullyParallel`.

Controls, cheapest first:
- **Web-first assertions and role locators:** `await expect(locator).toBeVisible()` waits; `expect(await locator.isVisible()).toBe(true)` doesn't. On `page.waitForTimeout`: "Never wait for timeout in production. Tests that wait for time are inherently flaky."
- **Isolation:** each test gets its own context; after a failure the worker and browser are discarded.
- **CI config** (the docs' sample): `retries: process.env.CI ? 2 : 0`, `forbidOnly: !!process.env.CI`, `trace: 'on-first-retry'` (not `on`: "very performance heavy").
- **Don't let retries hide flakes:** `failOnFlakyTests` (since 1.52; CLI `--fail-on-flaky-tests`) fails a run in which a test passed only on retry; `retryStrategy: 'isolated'` (1.62) reruns failures one by one at the end.
- **Flush out order dependence:** `--repeat-each <N>`, `--shuffle [seed]` (1.64); `lock` (1.63) keeps tests that share a resource from running at once.
- **Fast local loops:** `--only-changed [ref]`, `--last-failed`, `-x`.

## [JSTEST-011] Playwright against an SSR app: `webServer`, `baseURL` and server HTML
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Web server](https://playwright.dev/docs/test-webserver), [TestConfig](https://playwright.dev/docs/api/class-testconfig), [Emulation: JavaScript enabled](https://playwright.dev/docs/emulation), [API testing](https://playwright.dev/docs/api-testing) (all raw at v1.64.1)
- Related: JSTEST-010, WEB-014, WEB-015

`webServer` starts the app before the tests and waits for it:
```ts
webServer: {
  command: 'npm run build && node dist/<app>/server/server.mjs',
  url: 'http://localhost:4000',
  reuseExistingServer: !process.env.CI,
  timeout: 300_000,
},
use: { baseURL: 'http://localhost:4000' },
```
- `timeout`: "Defaults to 60000" ms; raise it when `command` includes the build.
- `reuseExistingServer`: when `false` "it will throw if an existing process is listening"; the docs: "commonly set to `!process.env.CI`".
- `url` is ready on "a 2xx, 3xx, 400, 401, 402, or 403"; `wait` takes stdout/stderr regexes instead.
- `gracefulShutdown` unset means the process group is "forcefully `SIGKILL`ed"; set `{ signal: 'SIGTERM', timeout: 500 }` for a server with shutdown hooks.
- "The `port` (but not the `url`) gets passed over to Playwright as a `baseURL`", and an array of servers needs `baseURL` set explicitly, so always set it.

The docs' examples run a dev server; testing the production build with the real Node server is our choice, since that's what SSR ships.

Server-rendered output, separately from the hydrated page: a project with `use: { javaScriptEnabled: false }` sees only server HTML, and the `request` fixture (it "respects configuration options like `baseURL`") fetches raw HTML for head-tag checks (WEB-014). The Playwright docs say nothing about hydration: waiting for an element doesn't prove Angular has hydrated it, so a click can land before hydration (open question).

## [JSTEST-012] Playwright in an agent's loop: tests, Test Agents, MCP or CLI
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Playwright Test Agents](https://playwright.dev/docs/test-agents), [healer agent prompt at v1.64.1](https://github.com/microsoft/playwright/blob/v1.64.1/packages/playwright/src/agents/playwright-test-healer.agent.md), [Playwright CLI](https://playwright.dev/docs/getting-started-cli), [playwright-mcp README](https://github.com/microsoft/playwright-mcp), [Reporters](https://playwright.dev/docs/test-reporters), npm registry
- Related: FLOW-014, REPO-021, SESS-013, JSTEST-010, JSTEST-016

| Route | Use it for | Notes |
|---|---|---|
| A Playwright Test suite | Regressions, as the check an agent runs | Deterministic; the agent reads a pass or fail |
| Test Agents (1.56+) | Writing or repairing tests | `npx playwright init-agents --loop=claude` writes planner, generator and healer agents to `.claude/agents/` (on `model: sonnet`) plus `.mcp.json`; "should be regenerated whenever Playwright is updated" |
| Playwright MCP (`@playwright/mcp` 0.0.83) | Looking at a page interactively | Our browser checker (REPO-021); "persistent state and iterative reasoning over page structure" |
| `@playwright/cli` (0.1.22; bundled as `npx playwright cli` since 1.62) | The same, cheaper | "CLI commands avoid loading large tool schemas and verbose accessibility trees into the model context"; vendor claim, no figures. The unscoped `playwright-cli` package is a different one |

The healer can give up by skipping: its prompt says "If the error persists and you have high level of confidence that the test is correct, mark this test as test.fixme()", and "Do not ask user questions". Review its diffs for new `fixme` lines (JSTEST-016).

Output: Playwright doesn't detect agents (the only `CLAUDECODE` check in v1.64.1 is in `playwright-cli --help`). The default reporter is `list` locally and `dot` on CI; pass `--reporter=line`. The HTML reporter opens a server after failures by default, which can stall a session: set `PLAYWRIGHT_HTML_OPEN=never`.

## [JSTEST-013] Coverage doesn't show whether tests catch bugs; mutation testing does
- Type: fact
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-17
- Sources: [Stryker: what is mutation testing](https://stryker-mutator.io/docs/) ([raw](https://raw.githubusercontent.com/stryker-mutator/stryker-mutator.github.io/develop/docs/General/introduction.mdx)), [Thoughtworks Technology Radar: Mutation testing](https://www.thoughtworks.com/radar/techniques/mutation-testing), [Vitest coverage config](https://vitest.dev/config/coverage), [Mutation-Guided LLM-based Test Generation at Meta (arXiv 2501.12862)](https://arxiv.org/abs/2501.12862)
- Related: JSTEST-014, JSTEST-015, JSTEST-016, PROMPT-028

Coverage counts lines that ran, not whether any assertion would notice them changing. Stryker: "code coverage doesn't tell you everything about the effectiveness of your tests. Think about it, when was the last time you saw a test without an assertion, purely to increase the code coverage?" Mutation testing changes the code (`<` to `<=`, `-` to `+`, a block emptied) and reruns the tests: a mutant that survives is a change no test noticed.

Thoughtworks Radar, published 2026-04-15, ring Trial: "high coverage percentages can mask logically hollow tests or generated code that has never been meaningfully asserted. With AI-generated test cases now commonplace, mutation testing acts as a reinforcement layer for catching "perpetually green" tests — those that pass regardless of logic changes due to missing assertions or decoupled mocks." Meta's ACH (paper submitted 2025-01-22) generates targeted mutants and has an LLM write tests that kill them; engineers "accepted 73% of its tests". It's internal, not a tool you can install.

Tested 2026-10-17, vitest@5.0.5, @vitest/coverage-v8@5.0.5, @stryker-mutator/core and vitest-runner 10.0.0, Node 24.21.0: a three-test, happy-path suite for a tax function scored 100% statements, branches, functions and lines, and a 60% mutation score (6 of 10 mutants killed). The survivors were the `< 50` boundary (`<= 50`, `false`, the emptied block) and `price - tax` turned into `price + tax`, which `toBeDefined()` didn't catch.

## [JSTEST-014] StrykerJS 10 with Vitest: setup, cost, and the Vitest 5 bug
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [StrykerJS CHANGELOG](https://github.com/stryker-mutator/stryker-js/blob/master/CHANGELOG.md), [Vitest runner](https://stryker-mutator.io/docs/stryker-js/vitest-runner/), [Configuration](https://stryker-mutator.io/docs/stryker-js/configuration/), [Incremental](https://stryker-mutator.io/docs/stryker-js/incremental/) (docs raw from stryker-js `docs/` at v10.0.0), [stryker-js#6210](https://github.com/stryker-mutator/stryker-js/issues/6210), [stryker-js#6214](https://github.com/stryker-mutator/stryker-js/pull/6214), [stryker-js#5655](https://github.com/stryker-mutator/stryker-js/issues/5655), npm registry
- Related: JSTEST-013, JSTEST-015, JSTEST-001, JSTEST-004

`@stryker-mutator/core` 10.0.0 (2026-08-14) drops Node 20 ("please use Node.js 22 or higher"). Setup: `npm init stryker@latest`, then `npx stryker run`; `@stryker-mutator/vitest-runner` peers `vitest >=2.0.0`. The runner ignores `coverageAnalysis` and "will always use `"perTest"`", and runs one thread with bail on the first failure.

Defaults: `mutate` covers `{src,lib}/**` minus spec and test files; `concurrency` `cpuCoreCount <= 4? cpuCoreCount : cpuCoreCount - 1`; `thresholds` `{ high: 80, low: 60, break: null }`, so a run exits 0 at any score until you set `break`; JSON report off unless `reporters` includes `json`.

Cost levers: `--incremental` reruns only mutants in changed code and tests; `--mutate src/file.ts:5-7` limits a run to lines; `ignoreStatic`, as static mutants "come with a big performance penalty"; the TypeScript checker drops uncompilable mutants at "a performance cost". No official run-time figure exists: mutate changed files, not the repo.

**Vitest 5 bug:** Vitest 5 joins test names with `' > '`, but the runner filters by space-joined names, so "on Vitest 5 the per-test name filter matches nothing, so every covered mutant survives" (#6210, open; fix #6214 open and unmerged on 2026-10-17). Tested 2026-10-17, vitest@5.0.5, Stryker 10.0.0, Node 24.21.0: the JSTEST-013 suite scored 60% with top-level tests and 0% (10 of 10 survived) with the same tests inside one `describe`.

Angular's `unit-test` builder isn't supported (#5655, open; a maintainer workaround uses `--dump-virtual-files`). Browser mode: the runner's docs say "not supported", the 9.0.0 CHANGELOG "support vitest 3 browser mode".

## [JSTEST-015] Feeding surviving mutants back to an agent
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Stryker configuration: reporters, jsonReporter](https://stryker-mutator.io/docs/stryker-js/configuration/), [mutation-testing-report-schema](https://github.com/stryker-mutator/mutation-testing-elements/blob/master/packages/report-schema/src/mutation-testing-report-schema.json), [stryker-js clear-text reporter at v10.0.0](https://github.com/stryker-mutator/stryker-js/blob/v10.0.0/packages/core/src/reporters/clear-text-reporter.ts)
- Related: JSTEST-013, JSTEST-014, JSTEST-016, TOK-108

Two outputs fit an agent:
- **`clear-text`** (on by default) prints only `Survived` and `NoCoverage` mutants at the default log level, each as `[Survived] <mutator>`, `file:line:col`, the original and mutated lines, and up to three test names that ran (`Tests ran:`). Short enough to paste as is.
- **`json`** (add it to `reporters`) writes `reports/mutation/mutation.json` in the mutation-testing-report schema: `files[path].mutants[]` with `mutatorName`, `replacement`, `location` (1-based `start`/`end`), `status` (`Killed`, `Survived`, `NoCoverage`, `Timeout`…) and `coveredBy`/`killedBy` test ids.

One line per survivor, for a prompt:
```bash
jq -r '.files | to_entries[] | .key as $f | .value.mutants[]
  | select(.status=="Survived" or .status=="NoCoverage")
  | "\($f):\(.location.start.line):\(.location.start.column) \(.mutatorName) -> \(.replacement)"' \
  reports/mutation/mutation.json
```

Brief the agent: "Each line is a change to the code that no test noticed. Add or tighten assertions so each fails; don't change the source. If a mutant can't change behaviour (an equivalent mutant), say so instead of writing a test for it." Then rerun Stryker on the same files with `--mutate`. No Stryker doc or widely used tool covers this loop (searched 2026-10-17); it's our pattern.

Tested 2026-10-17, @stryker-mutator/core 10.0.0, jq on WSL2: the command listed the four survivors of JSTEST-013's run, for example `src/price.ts:10:10 ArithmeticOperator -> price + tax(price)`.

## [JSTEST-016] What agents get wrong in tests, and the checks that catch it
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Vitest: Writing tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai) ([raw at v5.0.5](https://raw.githubusercontent.com/vitest-dev/vitest/v5.0.5/docs/guide/learn/writing-tests-with-ai.md)), [Claude Code best practices](https://code.claude.com/docs/en/best-practices), [Vitest config: allowOnly](https://vitest.dev/config/allowonly), [nizos/tdd-guard: strengthening enforcement](https://github.com/nizos/tdd-guard/blob/main/docs/enforcement.md)
- Related: PROMPT-028, FLOW-002, HOOK-028, HOOK-032, JSTEST-012, JSTEST-013, JSTEST-015

Vitest's own page on AI-written tests lists the failure modes:
- **Shallow assertions:** "`expect(user).toBeDefined() // this passes for almost anything`".
- **Over-mocking and implementation details:** "AI tends to over-mock… asserts that specific internal methods were called in a specific order… These tests break every time you refactor".
- **Happy paths only:** "AI tools tend to generate happy-path tests and skip the hard cases."
- **Jest APIs in Vitest** (`jest.fn()`), and spies never restored (enable `restoreMocks`, default `false`).
- **Watch mode:** "always use `vitest run`".

Under pressure to get green, an agent may also skip, delete or loosen a test, or hard-code the answer (PROMPT-028); Playwright's healer does `test.fixme()` by design (JSTEST-012).

Checks, cheapest first:
1. **In the prompt:** name the scenarios and edge cases, and say what not to do; the best-practices example ends "avoid mocks". Add PROMPT-028's line: report a wrong test instead of working around it.
2. **In the diff:** review spec changes in any change that wasn't about tests: deleted files, new `.skip`, `.todo`, `fixme`, `.only`, weaker matchers. Vitest fails `.only` in CI (`allowOnly` default `!process.env.CI`), and Playwright with `forbidOnly`; `.skip` passes both.
3. **Commit tests first**, then forbid edits to them while implementing (FLOW-002), checked with `git diff`. A `PreToolUse` hook on spec paths (HOOK-028) misses edits made through Bash: tdd-guard's docs deny `sed`, `awk`, `echo` and `perl` for that reason.
4. **A reviewer that didn't write them**, and mutation testing for the ones that matter (JSTEST-013).

## [JSTEST-017] Test-first with an agent: when it pays off
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-17
- Sources: [Claude Code best practices](https://code.claude.com/docs/en/best-practices), [Claude Code common workflows: work with tests](https://code.claude.com/docs/en/common-workflows), [Vitest: Writing tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai)
- Related: FLOW-002, FLOW-011, FLOW-012, JSTEST-016, SKPACK-009

FLOW-002 has Anthropic's test-driven steps. When writing the test first pays off:
- **Bug fixes:** always. The docs' prompt: "write a failing test that reproduces the issue, then fix it." A test that failed before the fix and passes after is the evidence FLOW-011 asks for, and a test written after the fix can't show it ever caught the bug.
- **Behaviour you can state as inputs and outputs** (parsers, validators, pricing rules, a pipe): the docs' example gives cases up front ("user@example.com is true, invalid is false… run the tests after implementing").
- **Unattended or long runs:** committed tests give `/goal` or a Stop hook a condition to stop on (FLOW-012).

When it doesn't: exploratory UI, prototypes and layout work, where a screenshot or browser check is the signal (FLOW-014), and refactors already covered by a suite.

Two guards make it work. The test must fail first for the right reason: run it before implementing and read the failure (an import error isn't a red test). And the agent writing the code shouldn't also rewrite the test: commit it, then "have one Claude write tests, then another write code to pass them". A test written from the implementation tends to mirror it, the over-mocked, implementation-detail test of JSTEST-016.

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-17 against `main` of osrs-tracker-web, osrs-tracker-api and freek-mencke-web.

1. Done 2026-10-18: both Angular apps are on `@angular/build` 22.2.3 without the `fsModuleCache` workaround (osrs-tracker/osrs-tracker-web#354, FreekMencke/freek-mencke-web#19; JSTEST-003, JSTEST-004).
2. **Keep Vitest 5 without `unplugin-swc` in osrs-tracker-api** (JSTEST-007, JSTEST-008): Nest 12's own template does the same, and class-typed constructor injection works on Vite 8. If a spec fails with "Nest can't resolve dependencies… (?)", check for a type-alias or `import type` parameter before adding a plugin.
3. **Won't do now: Stryker** (JSTEST-014). On Vitest 5 its runner scores nested tests as 0% until stryker-js#6214 is released, and it doesn't support Angular's builder. Re-check `npm view @stryker-mutator/vitest-runner dist-tags` and the CHANGELOG; then pilot it on osrs-tracker-api's pipes and parsers with `--mutate`, not the whole repo.
4. **Won't do now: a Playwright Test suite for the Angular apps** (JSTEST-011). The browser-checker subagent (REPO-021) and CD's smoke tests cover what changes, and a hydration-timing answer is still open. Reconsider when a regression slips past both.
5. Done 2026-10-18: the global CLAUDE.md says never to delete, skip or loosen an existing test to make a change pass (JSTEST-016, PROMPT-028).
6. **Won't do: Jest** (JSTEST-007, JSTEST-009). Our repos are on Vitest, and the global CLAUDE.md already says new tests use Vitest.

## Open questions

- **Hydration and Playwright** (JSTEST-011): no Playwright or Angular page read here says what a test should wait on before clicking a hydrated SSR page. Looked in Playwright's best-practices, assertions and emulation docs at v1.64.1.
- **Jest on Node older than 24.9 with Nest 12** (JSTEST-009): Jest's docs say `ERR_REQUIRE_ESM`, Nest's guide `ERR_REQUIRE_ASYNC_MODULE`, and Jest 30.5.0 added a transform fallback. Not tested: no Node older than 24.9 in the scratch setup.
- **When stryker-js#6214 ships**, and whether the `--dump-virtual-files` workaround for Angular works on Angular 22 with Vitest 5 (JSTEST-014).
- **`@playwright/cli` against Playwright MCP in tokens** (JSTEST-012): the vendor claims the CLI is cheaper and gives no figures; not measured here.
- **Does `vi.mock(import('./x'))` get past the Angular builder's relative-path check** (JSTEST-005)? The patch checks for a string, so the `import()` form isn't matched; whether mocking then works on a bundled spec wasn't tested.
- **Stryker's vitest-runner and browser mode** (JSTEST-014): the runner's docs say "not supported"; the 9.0.0 CHANGELOG says "support vitest 3 browser mode". Not tested.
