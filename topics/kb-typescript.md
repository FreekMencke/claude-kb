# TypeScript 6.0 to 7.0

Prefix: TS. Researched 2026-10-17 against the TypeScript team's announcements, the microsoft/TypeScript and microsoft/typescript-go repos, the npm registry and the tools' own repos, with tests on Node 24.21.0 and npm 11.19.0 in a WSL terminal (each entry's Last verified date is authoritative). This file covers the 6.0 defaults and deprecations, what 7.0 (the Go port) removes and can't do yet, which tools still need 6.0, how to run both, and where to check versions. Node's type stripping is in `kb-nodejs.md`, Angular's own TypeScript range and compiler plans in `kb-angular.md`, the general upgrade procedure in `kb-js-upgrades.md`, and npm's peer-dependency behaviour in `kb-npm.md`.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Can I upgrade an Angular, NestJS or typescript-eslint repo to `typescript@latest`? | No. `latest` is 7.0.2 (2026-07-08), which ships no compiler API; Angular 22.2.3 peers `>=6.0 <6.1`, typescript-eslint 8.71.2 `<6.1.0`, and Nest CLI 12.0.8 refuses to run. In an existing repo `npm install` only warns ("ERESOLVE overriding peer dependency") and the tools then break at runtime; run `npm ls --all` after a bump. | TS-011, TS-009, TS-008, JSUP-002 |
| Which TypeScript versions exist, and when were they released? | 6.0.2 on 2026-03-23 (the 6.0 release), 6.0.3 on 2026-04-16, 7.0.1-rc on 2026-06-18, 7.0.2 on 2026-07-08 (`latest`). There is no 6.1 and none is planned. | TS-001, TS-014 |
| Why do I get "Cannot find name 'process'" or "describe" after moving to TypeScript 6? | 6.0 defaults `types` to `[]`, so `@types/*` packages no longer load on their own. Add `"types": ["node"]` (plus your test runner's). | TS-003 |
| Which tsconfig defaults changed in 6.0? | `strict` true, `module` esnext, `target` the newest ES (es2025), `noUncheckedSideEffectImports` true, `libReplacement` false, `rootDir` the tsconfig's folder, `types` `[]`. | TS-002 |
| What did 6.0 deprecate, and what does `ignoreDeprecations: "6.0"` do? | `target: es5`, `downlevelIteration`, `moduleResolution` node10 and classic, `module` amd/umd/systemjs/none, `baseUrl`, `esModuleInterop`/`allowSyntheticDefaultImports` false, `alwaysStrict` false, `outFile`, `module` namespaces, import `asserts`. The flag silences them in 6.0 only. | TS-004 |
| What does 7.0 remove outright? | Every 6.0 deprecation is a hard error (`TS5102`/`TS5108` "has been removed"), and `ignoreDeprecations` no longer helps. `stableTypeOrdering` is always on. | TS-005 |
| What is TypeScript 7? | The Go port of the compiler, published as the `typescript` package with a `tsc` binary since the 7.0 RC (`tsgo` in `@typescript/native-preview` before). No `tsserver`; its language server runs as `tsc --lsp --stdio`. | TS-006 |
| How much faster is it, and what are `--checkers` and `--builders`? | Microsoft: 8x to 12x on full builds. Ours: 7.4x and 6.1x on two small repos. `--checkers` sets type-checker workers (default 4), `--builders` parallel project-reference builds, `--singleThreaded` turns both off. | TS-007 |
| Which tools can't use TypeScript 7.0? | Anything that imports the compiler API: Angular's compiler, typescript-eslint, Nest CLI, ts-jest, typedoc, ts-morph, Volar (Vue, Astro, MDX, Svelte). They wait for 7.1's new API. Bundlers that only strip types (Vite, esbuild, swc, tsx) don't care. | TS-009, TS-008 |
| How do I run 7.0 for type-checking while tools keep 6.0? | Alias `typescript` to `@typescript/typescript6` and add `"@typescript/native": "npm:typescript@^7.0.2"`: `tsc` is 7.0, `tsc6` and `require("typescript")` are 6.0. | TS-010 |
| Does Claude Code's `typescript-lsp` plugin work with TypeScript 7? | Not on 7 itself: it starts typescript-language-server, which needs a `lib/tsserver.js` that neither 7.0 nor the `@typescript/typescript6` alias has. Keep a real `typescript@6.0.x`, or point an LSP config at `tsc --lsp --stdio`. | TS-012 |
| Which tsconfig flags matter for Node's type stripping? | `erasableSyntaxOnly` (5.8; rejects enums, namespaces with code, parameter properties, `import =`), `verbatimModuleSyntax` (5.0), `allowImportingTsExtensions` (5.0), `rewriteRelativeImportExtensions` (5.7). 6.0 and 7.0 didn't change their defaults. | TS-013 |
| When is TypeScript 7.1, with the new API, due? | The 7.1 iteration plan says beta 2026-10-06, RC 2026-11-10, stable 2026-11-24; the beta had slipped and wasn't on npm on 2026-10-17. Feature releases come every 3 to 4 months. | TS-014 |
| Where should an agent check the current version and a package's peer range? | `npm view typescript dist-tags`, `npm view <pkg>@<version> peerDependencies`, the iteration-plan issue and the TypeScript blog. Not GitHub Releases (late re-tags) or the wiki Roadmap (stale since 2021). | TS-015 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| TS-001 | TypeScript versions, dates and npm dist-tags | fact | versions, npm, dist-tags, release-dates |
| TS-002 | The tsconfig defaults TypeScript 6.0 changed | fact | tsconfig, defaults, strict, rootDir, migration |
| TS-003 | `types` defaults to `[]`: "Cannot find name 'process'" | fact | tsconfig, types, types-node, errors, migration |
| TS-004 | What 6.0 deprecated, and `ignoreDeprecations: "6.0"` | fact | tsconfig, deprecations, ignoreDeprecations, baseUrl, migration |
| TS-005 | What 7.0 removes outright, and other 7.0 differences | fact | tsconfig, removals, typescript-7, migration |
| TS-006 | TypeScript 7: the Go port in the `typescript` package | fact | typescript-7, tsgo, native-port, lsp |
| TS-007 | TypeScript 7 speed, and `--checkers`, `--builders`, `--singleThreaded` | fact | typescript-7, performance, ci, parallelism |
| TS-008 | TypeScript 7.0 ships no compiler API | fact | typescript-7, compiler-api, tooling |
| TS-009 | Which tools can't use TypeScript 7.0 yet | comparison | typescript-7, peer-dependencies, angular, typescript-eslint, nestjs |
| TS-010 | Running 7.0 for type-checking while tools keep 6.0 | pattern | typescript-7, npm-alias, typescript6, side-by-side |
| TS-011 | `npm install typescript@latest` in a repo whose tools need 6.0 | anti-pattern | typescript-7, peer-dependencies, eresolve, upgrades |
| TS-012 | Claude Code's `typescript-lsp` plugin and TypeScript 7 | fact | lsp, claude-code-plugins, typescript-language-server, typescript-7 |
| TS-013 | tsconfig flags for code Node runs by type stripping | fact | type-stripping, erasableSyntaxOnly, verbatimModuleSyntax, tsconfig |
| TS-014 | Release cadence, the 7.1 plan and 6.0 servicing | fact | release-cadence, iteration-plan, typescript-7, versions |
| TS-015 | Where to check the current version and a package's TypeScript range | recommendation | versions, peer-dependencies, npm, dist-tags |

## [TS-001] TypeScript versions, dates and npm dist-tags
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm registry: typescript](https://www.npmjs.com/package/typescript), [npm registry: @typescript/native-preview](https://www.npmjs.com/package/@typescript/native-preview), [npm registry: @typescript/typescript6](https://www.npmjs.com/package/@typescript/typescript6), [Announcing TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/), [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- Related: TS-014, TS-015, TS-006

On 2026-10-17 `typescript@latest` is 7.0.2 and the newest 6.0 is 6.0.3. Read with `npm view typescript time --json` and `npm view typescript dist-tags`:

| Version | Published (npm) | Note |
|---|---|---|
| 5.9.3 | 2025-09-30 | last 5.x |
| 6.0.0-beta | 2026-02-11 | still the `beta` tag |
| 6.0.1-rc | 2026-03-06 | |
| 6.0.2 | 2026-03-23 | 6.0 announced the same day |
| 6.0.3 | 2026-04-16 | last 6.0 patch so far |
| 7.0.1-rc | 2026-06-18 | `rc` tag |
| 7.0.2 | 2026-07-08 | `latest`; 7.0 announced the same day |

- `next` is a 7.1 nightly (`7.1.0-dev.20261017.1`); the first 7.1 nightly was published 2026-07-08.
- `@typescript/native-preview` (the 7.0 previews, binary `tsgo`) stopped at `7.0.0-dev.20260707.2`; nightlies now ship as `typescript@next`.
- `@typescript/typescript6` (the 6.0 compatibility package, binary `tsc6`): 6.0.0 on 2026-04-16, 6.0.2 on 2026-07-06. Its 6.0.2 depends on `"@typescript/old": "npm:typescript@^6"`, so it installs `typescript@6.0.3` underneath and `tsc6 --version` prints 6.0.3.
- The `beta` dist-tag is stale: it points at 6.0.0-beta, because the 7.0 beta shipped as `@typescript/native-preview@beta`.

## [TS-002] The tsconfig defaults TypeScript 6.0 changed
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Announcing TypeScript 6.0: Simple Default Changes](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/), [6.0 Migration Guide (microsoft/TypeScript#62508)](https://github.com/microsoft/TypeScript/issues/62508), [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- Related: TS-003, TS-004, TS-005

TypeScript 6.0 (2026-03-23) changed seven defaults, and 7.0 keeps all of them. A tsconfig that set these explicitly is unaffected; one that relied on the old default breaks:

| Option | New default | What breaks |
|---|---|---|
| `strict` | `true` | Code that relied on the old `false`: implicit `any` (`TS7006`), null checks. Set `"strict": false` to keep it. |
| `module` | `esnext` | Projects that emitted CommonJS without setting `module`. |
| `target` | newest ES version, "effectively a floating target", es2025 at 6.0 | Output for older runtimes. |
| `noUncheckedSideEffectImports` | `true` | `import "./typo"` side-effect imports that don't resolve. |
| `libReplacement` | `false` | Custom `@typescript/lib-*` replacements. |
| `rootDir` | the folder holding tsconfig.json | Output lands in `dist/src/index.js` instead of `dist/index.js`; set `"rootDir": "./src"`. |
| `types` | `[]` | Globals from `@types/node`, `@types/jest` and others (TS-003). |

The 6.0 post: "many projects will need to do at least one of the following": set `types`, typically `["node"]`, and set `rootDir` if they relied on it being inferred. The 7.0 post expects the `rootDir` and `types` changes to surprise people most.

Tested 2026-10-17, typescript@6.0.3 and typescript@7.0.2, Node 24.21.0: a tsconfig with only `noEmit` reported `TS7006: Parameter 'name' implicitly has an 'any' type` in both, so `strict` is on by default.

## [TS-003] `types` defaults to `[]`: "Cannot find name 'process'"
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Announcing TypeScript 6.0: types now defaults to \[\]](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/), [6.0 Migration Guide (microsoft/TypeScript#62508)](https://github.com/microsoft/TypeScript/issues/62508)
- Related: TS-002, TS-004

Since 6.0, TypeScript no longer loads every package in `node_modules/@types` into the global scope. A project that used `process`, `node:fs`, `describe` or `it` without importing them fails until the tsconfig lists those packages:

```json
{ "compilerOptions": { "types": ["node", "jest"] } }
```

The symptom, quoted from typescript@6.0.3 (7.0.2 prints the same):

```
error TS2591: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node` and then add 'node' to the types field in your tsconfig.
error TS2591: Cannot find name 'node:fs'. ...
```

- `"types": ["*"]` restores the 5.9 behaviour, but the TypeScript team recommends "using an explicit array to improve build performance and predictability".
- The reason: "Many projects we've looked at have improved their build time anywhere from 20-50% just by setting types appropriately."
- Packages you import by name (`import _ from "lodash"`) still resolve; only ambient globals need listing.
- Each tsconfig counts: an Angular repo needs it in `tsconfig.app.json` and `tsconfig.spec.json` too, wherever `types` is overridden.

Tested 2026-10-17, typescript@6.0.3 with @types/node@24 installed, Node 24.21.0: without `types`, `TS2591` for `process` and `node:fs`; with `"types": ["node"]`, both resolved.

## [TS-004] What 6.0 deprecated, and `ignoreDeprecations: "6.0"`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Announcing TypeScript 6.0: Breaking Changes and Deprecations](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/), [6.0 Migration Guide (microsoft/TypeScript#62508)](https://github.com/microsoft/TypeScript/issues/62508), [ts5to6](https://github.com/andrewbranch/ts5to6)
- Related: TS-005, TS-002

TypeScript 6.0 deprecated these, and reports each as an error until you set `"ignoreDeprecations": "6.0"`:

- `target: es5` (the lowest target is now ES2015) and `downlevelIteration` (set at all).
- `moduleResolution: node` (node10) and `classic`: use `nodenext` for Node, `bundler` for a bundler.
- `module: amd`, `umd`, `systemjs` and `none`.
- `baseUrl`: drop it and prefix each `paths` entry (`"@app/*": ["./src/app/*"]`); a catch-all `"*": ["./src/*"]` replaces a real lookup root.
- `esModuleInterop: false` and `allowSyntheticDefaultImports: false`; `alwaysStrict: false`.
- `outFile`; `module Foo {}` for namespaces (`declare module "x"` stays); `asserts` on imports (use `with`); `/// <reference no-default-lib>`.
- `tsc foo.ts` in a folder with a tsconfig.json is now error `TS5112`; pass `--ignoreConfig`.

The announcement: "these deprecations can be ignored by setting "ignoreDeprecations": "6.0" in your tsconfig; however, note that TypeScript 7.0 will not support any of these deprecated options." The errors link `https://aka.ms/ts6`, which redirects to the 6.0 Migration Guide issue, where the TypeScript team posts a fix per option. The experimental `ts5to6` tool rewrites `baseUrl` and `rootDir`.

Tested 2026-10-17, typescript@6.0.3, Node 24.21.0: `target: es5`, `moduleResolution: node`, `baseUrl` and `esModuleInterop: false` gave `TS5107`/`TS5101` "is deprecated and will stop functioning in TypeScript 7.0", exit 2; adding `"ignoreDeprecations": "6.0"` gave exit 0.

## [TS-005] What 7.0 removes outright, and other 7.0 differences
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Announcing TypeScript 7.0: Updates Since 5.x](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), [typescript-go CHANGES.md](https://github.com/microsoft/typescript-go/blob/main/CHANGES.md), [Announcing TypeScript 6.0: The --stableTypeOrdering Flag](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)
- Related: TS-004, TS-002, TS-006

TypeScript 7.0 turns every 6.0 deprecation (TS-004) into a hard error "with no-op behavior", and `ignoreDeprecations: "6.0"` no longer silences them. Fix the deprecations on 6.0 first.

The compatibility promise: "Practically any TypeScript code that compiles cleanly with TypeScript 6.0 (with the stableTypeOrdering flag on, and without any ignoreDeprecations flag set) should compile identically in TypeScript 7.0."

Other differences:
- `stableTypeOrdering` "is true by default, and cannot be turned off". Union order in `.d.ts` output and error messages can differ from 6.0. On 6.0, `--stableTypeOrdering` previews 7.0's order, at up to 25% slower checks; it's "only intended to help diagnose differences".
- Template literal inference takes a whole Unicode code point: `"😀abc"` splits as `["😀", "abc"]`, not two surrogate halves.
- Under `skipLibCheck`, "conflicting declarations now consistently error in all contributing sites", so some errors it used to hide now show in `.ts` files (CHANGES.md).
- JSDoc type checking in `.js` files was reworked: no `@enum`, no Closure function syntax, no postfix `!`; CHANGES.md lists the rest.

Tested 2026-10-17, typescript@7.0.2, Node 24.21.0: the TS-004 tsconfig with `"ignoreDeprecations": "6.0"` failed with `TS5102: Option 'baseUrl' has been removed. Please remove it from your configuration.` (plus `Use '"paths": {"*": ["./src/*"]}' instead.`) and `TS5108` for `target=ES5`, `moduleResolution=node10` and `esModuleInterop=false`; exit 1.

## [TS-006] TypeScript 7: the Go port in the `typescript` package
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), [Announcing TypeScript 7.0 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/), [Announcing TypeScript 7.0 RC](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-rc/), [typescript-go README](https://github.com/microsoft/typescript-go/blob/main/README.md)
- Related: TS-007, TS-008, TS-012, TS-001

TypeScript 7 is the compiler and language service ported to Go, "done as faithfully as possible" so results match 6.0, with native speed and shared-memory multithreading. It installs like any release (`npm install -D typescript`) and gives a `tsc` executable.

Naming, by stage:
- Previews and the beta (2026-04-21): package `@typescript/native-preview`, binary `tsgo` ("run tsgo in place of the tsc executable").
- From the RC (2026-06-18): package `typescript`, binary `tsc`. The typescript-go README: "For TypeScript 7.0 RC and later, the command name is `tsc`."
- microsoft/typescript-go was the staging repo; its README says "This Repo Is Closed" and the port lives in microsoft/TypeScript again.

What the package holds (typescript@7.0.2, `package.json`): a `tsc` bin only, no `tsserver`; platform binaries as optional dependencies (`@typescript/typescript-linux-x64` and others); `engines.node` `>=16.20.0`.

Editors: the language server speaks LSP and is started as `tsc --lsp --stdio`. VS Code has a dedicated extension (`TypeScriptTeam.native-preview`), with built-in support announced on 2026-07-08 for "the coming weeks"; Visual Studio turns it on per workspace. Language-service plugins, such as Angular's or Vue's, don't run on it (TS-009).

Tested 2026-10-17, typescript@7.0.2, Node 24.21.0: an LSP `initialize` request to `tsc --lsp --stdio` answered with `serverInfo` `{"name":"typescript-go","version":"7.0.2"}` and definition, references, hover and code-action providers. `tsc --lsp --help` also lists `-pipe` and `-socket`, but `--pipe` exits with "only stdio is supported".

## [TS-007] TypeScript 7 speed, and `--checkers`, `--builders`, `--singleThreaded`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Announcing TypeScript 7.0: Custom Scaling](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- Related: TS-006, TS-010

Microsoft's numbers: "speedups between 8x and 12x on full builds", e.g. vscode 125.7 s to 10.6 s (11.9x), playwright 12.8 s to 1.47 s (8.7x), with 6% to 26% less memory; in the editor, the first error in the VS Code codebase after "about 17.5 seconds" became "under 1.3 seconds".

New flags (experimental, says the post, for `--checkers` and `--builders`):
- `--checkers <n>`: type-checker workers per project. "The default number of type-checking workers is 4." More can speed up big codebases at a memory cost; `--checkers 1` suits small CI runners. "In rare cases, varying the number of --checkers may surface order-dependent results", so pin one value across environments if that matters.
- `--builders <n>`: project-reference builds running at once under `--build`. It multiplies with `--checkers`: "--checkers 4 --builders 4 allows up to 16 type-checkers".
- `--singleThreaded`: no parallel parsing, checking or emit.
- `--watch` was rebuilt on a Go port of Parcel's file watcher.

Tested 2026-10-17, Node 24.21.0, 8 cores, WSL: `tsc -p <tsconfig> --noEmit --incremental false`, 5 runs each, median wall time. A NestJS API (1,235 files including lib files): typescript@6.0.3 1.41 s, typescript@7.0.2 0.19 s (7.4x). An Angular 22 app's `tsconfig.app.json` (no template checking): 2.75 s against 0.45 s (6.1x). Both checked clean on 7.0.2. On repos this small the saving is 1 to 2 seconds a run.

## [TS-008] TypeScript 7.0 ships no compiler API
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Announcing TypeScript 7.0: Running Side-by-Side with TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), [TypeScript 7.1 Iteration Plan (microsoft/TypeScript#63703)](https://github.com/microsoft/TypeScript/issues/63703), [typescript-go CHANGES.md](https://github.com/microsoft/typescript-go/blob/main/CHANGES.md), [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)
- Related: TS-009, TS-010, TS-014

"While TypeScript 7.0 is here, it does not ship with an API. We expect TypeScript 7.1 to ship with a new (and different) API". Every tool that calls `ts.createProgram`, `ts.parseCommandLine`, transformers or the language service therefore stays on 6.0 until it ports to the 7.1 API.

What an import of typescript@7.0.2 returns: its `exports` map `"."` to `./lib/version.cjs`, so `require("typescript")` gives only `{ version, versionMajorMinor }`. A tool's version check passes ("7.0.2") and its next API call fails. Experimental subpaths exist (`typescript/unstable/sync`, `/async`, `/ast`, `/fs`, `/proto`), as their names say, not a stable API.

The 7.1 plan lists "Stabilize API" with a Content Mapper API, an Emit API and a Language Service API. It won't be a drop-in for the old one: "Node positions use UTF8 offsets from the beginning of the file, not UTF16 offsets" (CHANGES.md). typescript-eslint's maintainer calls its first 7.1 support "IPC-based" and doesn't expect it to be "significantly better with TS7 than TS6" in speed ([typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940), 2026-09-29).

Tested 2026-10-17, typescript@7.0.2, Node 24.21.0: `Object.keys(require("typescript"))` was `[ 'version', 'versionMajorMinor' ]` and `typeof createProgram` was `undefined`.

## [TS-009] Which tools can't use TypeScript 7.0 yet
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Announcing TypeScript 7.0: TypeScript and Embedded Languages](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), [Angular: version compatibility](https://angular.dev/reference/versions), [An update on Angular's TypeScript 7-powered compiler](https://blog.angular.dev/an-update-on-angulars-typescript-7-powered-compiler-9619a35e2b0a), [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940), [nest-cli#3478](https://github.com/nestjs/nest-cli/pull/3478), [ts-jest#5366](https://github.com/kulshekhar/ts-jest/issues/5366), [typedoc#3098](https://github.com/TypeStrong/typedoc/issues/3098), [ts-morph#1621](https://github.com/dsherret/ts-morph/issues/1621)
- Related: TS-008, TS-010, TS-011

Peer ranges from `npm view <pkg>@<latest> peerDependencies` on 2026-10-17, with each project's statement:

| Tool | TypeScript range | Status on 7.0 |
|---|---|---|
| `@angular/compiler-cli`, `@angular/build` 22.2.3 (and 22.3.0-next.2) | `>=6.0 <6.1` | Angular's blog (2026-09-25): its compiler "cannot work with a Go-compiled version of TypeScript"; a new one (`ngp`) will use 7.1's APIs. See `kb-angular.md`. |
| `typescript-eslint` 8.71.2 (and canary) | `>=4.8.4 <6.1.0` | Throws "typescript-eslint does not support TS 7.0." Native support is a draft (#12803) for 7.1. |
| `@nestjs/cli` 12.0.8 | dependency `~6.0.2` | Exits with "does not expose the programmatic compiler API that the Nest CLI requires" (fail-fast since #3478). |
| `ts-jest` 29.4.15 | `>=4.3 <7` | Owner: 7 works "only through the documented side-by-side aliases". |
| `typedoc` 0.28.20 | up to `6.0.x` | "TypeDoc does not yet support TS 7." |
| `ts-morph` 28.0.0 | bundles TypeScript 6.0.2 | A native backend is in progress, unreleased. |
| Volar tools (Vue, Astro, MDX, Svelte) | — | "will need to continue using TypeScript 6.0 for now". |
| `tsdown` 0.23.1 | `^5 \|\| ^6 \|\| ^7` (optional) | Accepts 7. |

Vite, Vitest, esbuild, swc and tsx have no `typescript` peer and only strip types ("Vite only performs transpilation on `.ts` files and does **NOT** perform type checking"), so the version doesn't matter to them. A loose range (`ts-node` `>=2.7`, `ts-loader` `*`) isn't support: those call the compiler API.

Tested 2026-10-17, Node 24.21.0, forced onto typescript@7.0.2: `ngc` (22.2.3) failed with `TypeError: ts2.parseCommandLine is not a function`; typescript-eslint threw as above; `nest build` exited 1 with the Nest CLI message.

## [TS-010] Running 7.0 for type-checking while tools keep 6.0
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Announcing TypeScript 7.0: Running Side-by-Side with TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), [@typescript/typescript6 on npm](https://www.npmjs.com/package/@typescript/typescript6), [Progress on TypeScript 7 (December 2025)](https://devblogs.microsoft.com/typescript/progress-on-typescript-7-december-2025/)
- Related: TS-008, TS-009, TS-012, TS-007

The TypeScript team's setup: `typescript` resolves to the 6.0 API for tools, and a second alias provides 7.0's `tsc`:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

- `@typescript/typescript6` re-exports the 6.0 API and ships a `tsc6` binary, so nothing clashes with 7.0's `tsc`. The alias alone leaves "only a tsc6 executable"; the second line makes `npx tsc` run 7.0.
- Angular's case, from the post: "use a combination of TypeScript 7 to get fast project-wide error detection at the CLI with tsc, and TypeScript 6.0 for editor support". 7.0's `tsc` doesn't read templates, so `ng build` stays the full check.
- Tradeoffs: the alias has no `lib/tsserver.js`, which hides 6.0 from typescript-language-server (TS-012); and for repos as small as ours it saves 1 to 2 seconds a check (TS-007).
- A real `typescript@6.0.3` plus the `@typescript/native` alias also installed: `.bin/tsc` linked to 7.0 and `tsserver` to 6.0, but which package wins a shared bin name is npm's undocumented choice. Call 7.0 by path (`node node_modules/@typescript/native/bin/tsc`) if you rely on it.

Tested 2026-10-17, npm 11.19.0, Node 24.21.0: with the two aliases, `tsc --version` printed 7.0.2, `tsc6 --version` 6.0.3 and `require("typescript").version` 6.0.3; npm reported no peer conflict; type-aware typescript-eslint 8.71.2 linting, `ngc` (@angular/compiler-cli 22.2.3) and `nest build` (@nestjs/cli 12.0.8) all ran. `tsc` 7.0 passed a component whose template had a type error that `ngc` reported (`TS2339`).

## [TS-011] `npm install typescript@latest` in a repo whose tools need 6.0
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm registry: typescript](https://www.npmjs.com/package/typescript), [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), [typescript-eslint#12518](https://github.com/typescript-eslint/typescript-eslint/issues/12518), [nest-cli#3477](https://github.com/nestjs/nest-cli/issues/3477)
- Related: TS-009, TS-015, TS-010, JSUP-002

Since 2026-07-08 `latest` is a major that most of the Node and Angular toolchain can't load. An agent told to "upgrade TypeScript" or "update dependencies to latest" moves an Angular, NestJS or typescript-eslint repo from 6.0.x to 7.0.2 and breaks its build.

What it sees (npm 11.19.0, Node 24.21.0, 2026-10-17):
1. In a repo that already has typescript 6.0.3, `npm install -D typescript@latest` beside typescript-eslint 8.71.2 or `@angular/compiler-cli` 22.2.3 exits 0 with `ERESOLVE overriding peer dependency` warnings and writes `^7.0.2` (JSUP-002). Only installing both into an empty project, or `--strict-peer-deps` beside typescript-eslint, stops with `ERESOLVE unable to resolve dependency tree` … `peer typescript@">=4.8.4 <6.1.0" from typescript-eslint@8.71.2`.
2. `npm ls --all` then exits 1 (`invalid`), CI's `npm ci` fails on typescript-eslint's peer but not on Angular's optional one, and the tools fail at runtime (TS-009).

Instead:
- Read the ranges first: `npm view @angular/compiler-cli@<version> peerDependencies`, the same for typescript-eslint and anything else in `npm ls typescript` (TS-015).
- Keep `typescript` on `~6.0.3` (or `^6.0.3`, since no 6.1 is planned) until every tool in that list accepts 7. On 2026-10-17 Angular, typescript-eslint and the Nest CLI all wait for TypeScript 7.1's API (TS-014).
- Treat an `ERESOLVE` warning or error on a TypeScript major as a stop sign, not something to force or ignore.
- Want 7.0's speed now? Use the side-by-side aliases (TS-010).

## [TS-012] Claude Code's `typescript-lsp` plugin and TypeScript 7
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-17
- Sources: [claude-plugins-official marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json), [typescript-language-server CHANGELOG](https://github.com/typescript-language-server/typescript-language-server/blob/master/CHANGELOG.md), [typescript-language-server versionProvider.ts](https://github.com/typescript-language-server/typescript-language-server/blob/master/src/tsServer/versionProvider.ts), [Announcing TypeScript 7.0: Editor Experience](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- Related: TOK-041, TS-006, TS-010

The official `typescript-lsp` plugin (Claude Code's code-intelligence plugin for `.ts`, `.tsx`, `.js` and the module variants) starts `typescript-language-server --stdio`. That server drives the workspace's `tsserver`: it looks for `node_modules/typescript/lib/tsserver.js` and, when that file is missing, logs "Workspace TypeScript at … provides no tsserver.js." and treats that install as unusable.

- typescript@7.0.2 has no `tsserver.js` (TS-006). Since typescript-language-server 6.0.0 (2026-08-20) it notifies "when typescript with no tsserver API found" (#1120); before, it silently fell back to another TypeScript it could find (#1110).
- The `@typescript/typescript6` alias doesn't fix it: its `lib/` holds `tsc.js`, `typescript.js` and `tsserverlibrary.js`, but no `tsserver.js` (checked in an install on 2026-10-17). A real `typescript@6.0.x` in the workspace does.
- TypeScript 7's own server speaks LSP (`tsc --lsp --stdio`, TS-006), so an LSP plugin config could start it directly; the official plugin doesn't, and we haven't tested such a config in Claude Code.

So in a repo on TypeScript 6.0.x, as all of ours with Angular or NestJS are, the plugin works as before. Recheck this entry before moving a repo's `typescript` to 7 or to the alias.

Not tested: typescript-language-server itself (community code) against these installs; the `tsserver.js` lookup is read from its source.

## [TS-013] tsconfig flags for code Node runs by type stripping
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [TSConfig: erasableSyntaxOnly](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly), [TypeScript 5.8 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html), [TypeScript 5.7 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-7.html), [TypeScript 5.0 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html)
- Related: TS-002, TS-008

When Node runs `.ts` files by erasing the types (see `kb-nodejs.md` for Node's side), `tsc` only checks. These flags make it reject what erasure can't handle:

| Flag | Since | What it does |
|---|---|---|
| `erasableSyntaxOnly` | 5.8 | "TypeScript will error on most TypeScript-specific constructs that have runtime behavior": `enum` declarations, namespaces with runtime code, parameter properties in classes, `import =`/`export =`, `<T>x` assertions. |
| `verbatimModuleSyntax` | 5.0 | "any imports or exports without a `type` modifier are left around. Anything that uses the `type` modifier is dropped entirely." |
| `allowImportingTsExtensions` | 5.0 | Allows `import "./x.ts"`; "only allowed when `--noEmit` or `--emitDeclarationOnly` is enabled". |
| `rewriteRelativeImportExtensions` | 5.7 | When `tsc` does emit, rewrites relative `.ts` import paths to `.js`. |

- Replace an `enum` with an `as const` object and a union type, and a parameter property with a declared field.
- 6.0 and 7.0 didn't change these flags' defaults (neither announcement nor the 6.0 release notes mention them).
- `module: nodenext` follows the newest Node; `node20` (5.9) pins Node 20's behaviour and implies `target: es2023`.

Our MCP server (`mcp-server/` in this repo) runs on Node 24 by type stripping, with `noEmit`, `erasableSyntaxOnly`, `verbatimModuleSyntax` and `allowImportingTsExtensions`, and type-checks with typescript ~7.0.2: nothing in it uses the compiler API.

Tested 2026-10-17, typescript@7.0.2, Node 24.21.0: with `erasableSyntaxOnly`, an `enum` and a parameter property each gave `TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.`; an `as const` object passed.

## [TS-014] Release cadence, the 7.1 plan and 6.0 servicing
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [TypeScript 7.1 Iteration Plan (microsoft/TypeScript#63703)](https://github.com/microsoft/TypeScript/issues/63703), [Announcing TypeScript 7.0: The Road Forward](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), [Progress on TypeScript 7 (December 2025)](https://devblogs.microsoft.com/typescript/progress-on-typescript-7-december-2025/), [Transition to 6.0 Maintenance Mode (microsoft/TypeScript#62963)](https://github.com/microsoft/TypeScript/issues/62963)
- Related: TS-001, TS-008, TS-015

Cadence: after 7.0 the team expects "new featureful versions published every 3-4 months", each planned in an iteration-plan issue with beta, RC and stable dates.

TypeScript 7.1 (plan by the TypeScript team, dates last changed 2026-09-05):

| Milestone | Planned |
|---|---|
| 7.1 Beta | 2026-10-06 |
| 7.1 RC | 2026-11-10 |
| 7.1 Stable | 2026-11-24 |

- The beta slipped ("we'll be at least a few days late on beta", 2026-10-05); a `release-7.1` branch with version `7.1.0-beta` was created 2026-10-16, but on 2026-10-17 npm had only `7.1.0-dev` builds.
- 7.1's plan includes "Stabilize API" (Content Mapper, Emit and Language Service APIs), `es2026` for `lib` and `target`, and replacing VS Code's existing API integrations. Tools in TS-009 wait for this API, then need their own releases.

TypeScript 6.0 was the last JavaScript-based release: "we do not intend to release a TypeScript 6.1, though we may have patch releases (e.g. 6.0.1, 6.0.2) under rarer circumstances" (December 2025). Patches come only for "security issues", "high-severity regressions" and "high-severity fixes related to 6.0/7.0 compatibility". No end date for 6.0 patches is published.

## [TS-015] Where to check the current version and a package's TypeScript range
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm registry: typescript](https://www.npmjs.com/package/typescript), [TypeScript blog](https://devblogs.microsoft.com/typescript/), [TypeScript 7.1 Iteration Plan (microsoft/TypeScript#63703)](https://github.com/microsoft/TypeScript/issues/63703), [microsoft/TypeScript releases](https://github.com/microsoft/TypeScript/releases), [Angular: version compatibility](https://angular.dev/reference/versions)
- Related: TS-001, TS-011, TS-014, JSUP-001

Read versions from the registry and plans from the team's issues; never from memory or a model's cutoff.

```bash
npm view typescript dist-tags                          # latest, next, rc (beta is stale: 6.0.0-beta)
npm view typescript 'time[7.0.2]'                      # publish date of one version
npm view @angular/compiler-cli@22.2.3 peerDependencies # a tool's accepted range, at the version you use
npm ls typescript                                      # every package in the tree that pulls in TypeScript
```

- `npm view typescript time --json` lists every version's date but returned 198,668 characters on 2026-10-17; ask for one version, as above, or see JSUP-001 for other small queries.
- Plans and dates: the open "TypeScript X.Y Iteration Plan" issue (label `Planning`) in microsoft/TypeScript; announcements on devblogs.microsoft.com/typescript.
- GitHub Releases lag: `v7.0.2` there is dated 2026-08-20, six weeks after npm's 2026-07-08, because 7.0 was tagged in microsoft/typescript-go first; no 7.0.0 or 7.0.1 release exists there. Use npm for dates.
- The wiki's Roadmap page stops at "January to June 2021"; don't use it.
- A tool's docs page can lag its registry range; the registry is what `npm install` enforces. angular.dev/reference/versions gives `21.0.x || 21.1.x || 21.2.x` as `>=5.9.0 <6.0.0`, while `npm view @angular/compiler-cli@<v> peerDependencies` says `>=5.9 <6.1` for 21.2.0, 21.2.10 and 21.2.25 (`<6.0` for 21.0.0 and 21.1.0), so Angular 21.2 accepts TypeScript 6.0.

## Recommendations for our setup

1. **Stay on TypeScript 6.0.x in osrs-tracker-web, osrs-tracker-api and freek-mencke-web** until Angular, typescript-eslint and the Nest CLI accept 7, which waits for TypeScript 7.1's API (planned 2026-11-24) and then their own releases. Already in place: web and freek-mencke-web take npm updates by hand, and api's Dependabot ignores `typescript >=6.1.0`. Its note and skill name only typescript-eslint as the blocker and expect a 6.1; [osrs-tracker/osrs-tracker-api#184](https://github.com/osrs-tracker/osrs-tracker-api/issues/184) adds the Nest CLI and drops the 6.1 wording. (TS-009, TS-011, TS-014)
2. **Won't do for now: add 7.0 next to 6.0 for faster type-checks in those repos.** It saves 1 to 2 seconds a run on our sizes (TS-007), Angular templates still need `ng build`, and the alias hides `tsserver.js` from Claude Code's LSP plugin (TS-012). Revisit when 7.1 ships. (TS-007, TS-010, TS-012)
3. **Done 2026-10-16: claude-kb's `mcp-server/` type-checks with typescript ~7.0.2** (FreekMencke/claude-kb#151): it runs by type stripping and nothing in it imports the compiler API. (TS-008, TS-013)
4. **When a repo does move to 7:** check `npm ls typescript` against TS-009, and recheck TS-012 for the LSP plugin first. (TS-009, TS-012, TS-015)

## Open questions

- When the 7.1 beta and stable ship, and when Angular (`ngp`), typescript-eslint (#12803), the Nest CLI, ts-jest and typedoc release 7.1 support. Looked in: the 7.1 plan, each project's tracking issue (TS-009), npm on 2026-10-17.
- Whether Claude Code's LSP support can start `tsc --lsp --stdio` from a plugin's `lspServers` config, and how well its features work against TypeScript 7. Not tested; the official plugin starts typescript-language-server.
- How long 6.0.x keeps getting patches: the December 2025 post and #62963 give criteria, not an end date.
- Whether npm's choice of `.bin/tsc` when a real `typescript@6` and an aliased `typescript@7` both provide it is stable across npm versions (TS-010). Tested on npm 11.19.0 only; `kb-npm.md` covers npm 12.
