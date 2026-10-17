# Node.js 24/26 runtime and the modern JS baseline

Prefix `NODE`. This file covers what the Node.js runtime does on 2026-10-17 that agents still reach for packages or old flags to do: which release line to target, running TypeScript files directly, the built-ins that replace ts-node, nodemon and dotenv, the language features on by default in Node 24 and 26, the bundled fetch, and how a repo pins its Node version. TypeScript's own settings are in `kb-typescript.md` (TS), npm 12 in `kb-npm.md` (NPM), Vitest and Jest in `kb-js-testing.md` (JSTEST), and Lambda's Node runtimes in `kb-aws-lambda-node.md` (LAMBDA).

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#171, part of roadmap #167) by an Opus 5.5 lead with three Sonnet 5.5 readers.
- Versions and dates come from `raw.githubusercontent.com/nodejs/Release/main/schedule.json`, `nodejs.org/dist/index.json` and the npm registry (`npm view <pkg> …`); API facts from the raw `doc/api/*.md` files of nodejs/node on `main` and at the tags `v24.22.0` and `v26.12.0`, and from the raw `doc/changelogs/CHANGELOG_V22.md`, `V24`, `V25` and `V26`.
- Behaviour was tested in the official linux-x64 binaries of Node 22.23.3, 24.22.0 and 26.12.0 from nodejs.org/dist (SHA-256 checked against `SHASUMS256.txt`), in a scratch folder on WSL2, plus the official `undici@7.30.1` and `undici@8.12.2` installed with `--ignore-scripts`. No community package was run.
- Our repos' setup was read on 2026-10-17 from `main` of osrs-tracker-web, osrs-tracker-api, freek-mencke-web, claude-skills and this repo.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which Node version should a project target? | 24 for production on 2026-10-17: Active LTS, then Maintenance from 2026-10-20 with security fixes until 2028-04-30. 26 becomes LTS on 2026-10-28; 22 is Maintenance until 2027-04-30; 20 and 25 are end of life. | NODE-001 |
| Is there a Node 27, and are odd lines still skipped? | From 27, one major a year: Current in April, LTS in October, every line LTS. 27's Alpha starts 2026-10-28 (not for production); 27.0.0 is due April 2027. | NODE-002 |
| Can `node` run a `.ts` file directly? | Yes, without flags, on 22.18+, 23.6+, and all of 24 and 26; stable since 24.12.0. It strips types only: no type check, `tsconfig.json` ignored. | NODE-003 |
| Why does `node file.ts` fail on an enum, decorator or import? | Stripping only erases types. Enums, runtime namespaces, parameter properties, decorators, `.tsx`, extensionless imports and type imports without `type` fail; 26 removed `--experimental-transform-types`. | NODE-004 |
| Do I still need ts-node or tsx? | Not ts-node (last release 2023-12-08). Plain `node` for erasable code; tsx for enums, `paths` or JSX; `tsc` or the framework CLI for decorator metadata (NestJS). Type-check with `tsc --noEmit` either way. | NODE-005 |
| Do I still need dotenv? | Not to load a file: `--env-file` and `--env-file-if-exists` are stable since 24.10.0 and 22.21.0. The real environment wins, the last file wins, and there's no `${VAR}` expansion. | NODE-006 |
| Do I still need nodemon? | `node --watch` is stable since 22.0.0, but restarts only on imported files unless `--watch-path` is given. nodemon still has config files, extension lists, `--exec` for other commands and polling. | NODE-007 |
| Can `node:test` replace Jest or Vitest? | For DOM-free libraries and scripts: the runner is stable and runs `.ts` tests. Coverage, watch and `mock.module()` are experimental, and there's no DOM. | NODE-008 |
| Is `node:sqlite` or the permission model ready to use? | `node:sqlite`: no flag, release candidate, synchronous, `Database` on 26 (`DatabaseSync` is an alias). Permission model: stable, but "does not protect against malicious code"; network rules only from 25. | NODE-009 |
| Can CommonJS `require()` an ESM-only package? | Yes on 20.19+, 22.12+, 24 and 26, unless its graph has top-level `await` (`ERR_REQUIRE_ASYNC_MODULE`). `module.register()` warns on 26: use `module.registerHooks()`. | NODE-010 |
| Can I use Temporal, `RegExp.escape` or `Map.getOrInsert` without a polyfill? | Temporal, `getOrInsert`, `Iterator.concat` and `Uint8Array` base64: 26 only. `RegExp.escape`, `Promise.try`, `Float16Array`, `Error.isError`, `using`: 24 and 26. `Math.sumPrecise`: neither. | NODE-011 |
| What breaks moving from 24 to 26? | 25's removals (`SlowBuffer`, `fs.F_OK`, `rmdir` recursive, `CallTracker`) and 26's (`writeHeader`, `_stream_*`); `module.register()` warns; `localStorage` needs a file; fetch speaks HTTP/2; npm stays 11; Corepack is gone. | NODE-012, NODE-013, NODE-015 |
| Do I need the `undici` package? | Only for `ProxyAgent`, `MockAgent`, pooling, interceptors or `undici.request()`. Import `fetch` and `Agent` from the same package: Node 24's global fetch rejects an undici 8 `Agent`. | NODE-013 |
| How should a repo pin its Node version? | A major in `.node-version` and setup-node's `node-version-file`; `engines` only warns; `devEngines.runtime` enforces for contributors; `@types/node` at the runtime's major. | NODE-014 |
| Does Node 26 ship npm 12 or Corepack? | No. 26.12.0 bundles npm 11.20.0; npm 12 needs `^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0` and is expected with Node 27. Corepack isn't shipped since 25.0.0. | NODE-015 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| NODE-001 | Node release lines on 2026-10-17: Current, Active LTS, Maintenance | fact | release-schedule, lts, node-24, node-26 |
| NODE-002 | From Node 27: one major a year, every line LTS, and an Alpha channel | fact | release-schedule, node-27, alpha |
| NODE-003 | Running `.ts` files with plain `node`: type stripping by version | fact | typescript, type-stripping, tsconfig |
| NODE-004 | What type stripping rejects: enums, namespaces, parameter properties, decorators | fact | typescript, type-stripping, enums, decorators |
| NODE-005 | ts-node, tsx or plain `node` for TypeScript | comparison | ts-node, tsx, typescript |
| NODE-006 | `--env-file` instead of dotenv: format, precedence and what it lacks | fact | env-file, dotenv |
| NODE-007 | `--watch` instead of nodemon, and where it differs | fact | watch-mode, nodemon |
| NODE-008 | `node:test`: stable runner, experimental coverage and module mocks | fact | node-test, testing, coverage |
| NODE-009 | `node:sqlite` and the permission model: status and limits | fact | sqlite, permission-model, security |
| NODE-010 | `require(esm)` works, and `module.register()` is deprecated in 26 | fact | require-esm, esm, loaders, deprecation |
| NODE-011 | Language features on by default in Node 22, 24 and 26 | fact | temporal, javascript, v8, polyfills |
| NODE-012 | Removals and deprecations that hit app code on 25 and 26 | fact | breaking-changes, deprecation, node-26 |
| NODE-013 | Bundled undici: fetch versions, HTTP/2 on 26, and when to install undici | fact | undici, fetch, http2, proxy |
| NODE-014 | Pinning a repo's Node version: `.node-version`, `engines`, `devEngines`, setup-node | recommendation | node-version, engines, setup-node, types-node |
| NODE-015 | npm 12 and Corepack: neither ships with Node 24 or 26 | fact | npm-12, corepack |

## [NODE-001] Node release lines on 2026-10-17: Current, Active LTS, Maintenance
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [nodejs/Release schedule.json](https://raw.githubusercontent.com/nodejs/Release/main/schedule.json), [nodejs/Release README](https://raw.githubusercontent.com/nodejs/Release/main/README.md), [nodejs.org dist index](https://nodejs.org/dist/index.json), [Previous releases](https://nodejs.org/en/about/previous-releases)
- Related: NODE-002, NODE-014, SURF-027

On 2026-10-17 Node 26 is Current, 24 is Active LTS and 22 is Maintenance LTS; 20 reached end of life on 2026-04-30 and 25 on 2026-06-01. Target 24 for production now, and 26 from 2026-10-28.

| Line | Codename | Active LTS from | Maintenance from | End of life | Latest (date) |
|---|---|---|---|---|---|
| 22 | Jod | 2024-10-29 | 2025-10-21 | 2027-04-30 | 22.23.3 (2026-09-23) |
| 24 | Krypton | 2025-10-28 | 2026-10-20 | 2028-04-30 | 24.22.0 (2026-10-14) |
| 26 | none yet | 2026-10-28 | 2027-10-20 | 2029-04-30 | 26.12.0 (2026-10-14) |

Dates from `schedule.json`, latest versions from `nodejs.org/dist/index.json`, both read 2026-10-17. Node's advice: "Production applications should only use _Active LTS_ or _Maintenance LTS_ releases." The phases, from the Release README:
- Current: "most of the non-major (non-breaking) changes that land on `nodejs/node` main branch."
- Active LTS: "New features, bug fixes, and updates that have been audited by the Release team".
- Maintenance: "Critical bug fixes and security updates."

So 24 moving to Maintenance on 2026-10-20 doesn't make it unsafe: it keeps security fixes until 2028-04-30, and a repo on 24 has no deadline before then. Cloud sessions have Node 20, 21 and 22, with 22 on `PATH` (SURF-027): code that needs 24 or 26 gets a setup script there.

## [NODE-002] From Node 27: one major a year, every line LTS, and an Alpha channel
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Evolving the Node.js Release Schedule (2026-03-10)](https://raw.githubusercontent.com/nodejs/nodejs.org/main/apps/site/pages/en/blog/announcements/evolving-the-nodejs-release-schedule.md), [nodejs/Release schedule.json](https://raw.githubusercontent.com/nodejs/Release/main/schedule.json), [nodejs/Release README](https://raw.githubusercontent.com/nodejs/Release/main/README.md)
- Related: NODE-001, NODE-015

"Starting with 27.x, Node.js will move from two major releases per year to one." Node 26 "is the last release line under the current model"; there is no odd-numbered Current line to skip any more.

From the announcement of 2026-03-10 (raw text):
- "**One major release per year** (April), with LTS promotion in October."
- "**Every release becomes LTS**. No more odd/even distinction - Node.js 27 will become LTS."
- "**Version numbers align with the calendar year of their initial Current release**: 27.0.0 in 2027, 28.0.0 in 2028."
- Phases: Alpha, 6 months, "Oct to Mar. Early testing, semver-major allowed"; Current, 6 months, "Apr to Oct. Stabilization"; LTS, 30 months. "Total support: 36 months".
- Alpha is for "Library authors and CI pipelines testing compatibility with upcoming breaking changes. Not intended for production use." Versions look like `27.0.0-alpha.1`.
- Node 27: Alpha from October 2026 (`"alpha": "2026-10-28"` in `schedule.json`), 27.0.0 in April 2027 (`start` 2027-04-22), LTS in October 2027, end of life in April 2030.
- "This schedule is not final and may be amended."

What it changes for an agent: don't put 27 alphas in production or in `engines`; a library can add one to its CI matrix. The Release README hadn't caught up on 2026-10-17: it still says "odd-numbered versions in October" and "Odd-numbered release lines are not promoted to LTS". `schedule.json`'s v27 entry has no `lts` key; its `maintenance` date (2027-10-20) matches the blog's LTS date.

## [NODE-003] Running `.ts` files with plain `node`: type stripping by version
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Node.js docs: Modules: TypeScript (v26.12.0, same as main)](https://raw.githubusercontent.com/nodejs/node/v26.12.0/doc/api/typescript.md), [the same page at v24.22.0](https://raw.githubusercontent.com/nodejs/node/v24.22.0/doc/api/typescript.md), [CHANGELOG_V22.md: 22.18.0](https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V22.md), [CHANGELOG_V26.md: 26.0.0](https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V26.md)
- Related: NODE-004, NODE-005, SURF-027

`node file.ts` runs TypeScript without flags on Node 22.18.0 and later, 23.6.0 and later, and every 24, 25 and 26 release. Node replaces type annotations with whitespace and runs the result; it doesn't type-check and ignores `tsconfig.json`. Run `tsc --noEmit` (or your build) for types.

Milestones, from the YAML `changes:` block of `doc/api/typescript.md`:
- v22.6.0: added behind `--experimental-strip-types`.
- v23.6.0 and v22.18.0 (2025-07-31): "Type stripping is enabled by default."
- v24.3.0 and v22.18.0: "no longer emits an experimental warning."
- v25.2.0 and v24.12.0 (2025-12-10): "Type stripping is now stable." The v24.22.0 page says "Stability: 2 - Stable".
- v26.0.0: "Removed `--experimental-transform-types` flag" (the flag that transformed enums and parameter properties; "Stability: 1.2 - Release candidate" on 24).

Node's recommended `tsconfig.json` for code it runs this way: `"target": "esnext"`, `"module": "nodenext"`, `"rewriteRelativeImportExtensions": true`, `"erasableSyntaxOnly": true`, `"verbatimModuleSyntax": true`, and `"noEmit": true` if you only run the `.ts` files ("version 5.8 or newer"). `kb-typescript.md` covers those options. `.ts` follows `package.json` `"type"` like `.js`; `.mts` is always ESM and `.cts` always CommonJS. Turn it off with `--no-strip-types` (24 and 26; on 22 it's `--no-experimental-strip-types`). The 26 docs add that it needs WebAssembly: without it, `ERR_WEBASSEMBLY_NOT_SUPPORTED`.

Tested 2026-10-17, node@22.23.3, 24.22.0 and 26.12.0: a `.ts` file with interfaces, generics, `satisfies` and `import type` ran on all three without flags or warnings; stack traces kept the original line and column (`good.ts:7:31`). On 26.12.0 `--experimental-transform-types` exits 9 with "bad option".

## [NODE-004] What type stripping rejects: enums, namespaces, parameter properties, decorators
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Node.js docs: Modules: TypeScript](https://raw.githubusercontent.com/nodejs/node/main/doc/api/typescript.md)
- Related: NODE-003, NODE-005

Node only removes types; "any TypeScript features that involve _replacing_ TypeScript syntax with new JavaScript syntax will error." Code an agent writes from older TypeScript habits fails at startup, not at compile time.

| Written | Result |
|---|---|
| `enum`, `const enum` | `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`: "TypeScript enum is not supported in strip-only mode" |
| `namespace N { export const x = 1 }` | same error, "namespace declaration"; a types-only namespace works (docs) |
| `constructor(public x: number)` | same error, "parameter property" |
| `@decorator` | `SyntaxError: Invalid or unexpected token`; "not transformed and will result in a parser error" |
| `import { Type } from './t.ts'` without `type` | "does not provide an export named" at runtime: write `import type` |
| `import './t'` | `ERR_MODULE_NOT_FOUND`: extensions are mandatory, write `./t.ts` |
| `.tsx`, JSX | parser error: "`.tsx` files are unsupported" |
| a `.ts` file under `node_modules` | `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` |
| `tsconfig` `paths` | not applied (docs); use `package.json` `imports` (`#alias`) |

The docs also rule out import aliases (`import x = require()`) and TypeScript in the REPL, `--check` and `inspect`. Use a compiler or tsx for these (NODE-005), or rewrite: a string-literal union or `as const` object for an enum, an explicit field for a parameter property.

Tested 2026-10-17, node@22.23.3, 24.22.0 and 26.12.0, one file per row except those marked "docs": each failed as shown on all three. With `--experimental-transform-types`, the enum and parameter-property files ran on 22 and 24 (with an ExperimentalWarning); 26 rejected the flag.

## [NODE-005] ts-node, tsx or plain `node` for TypeScript
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Node.js docs: Modules: TypeScript](https://raw.githubusercontent.com/nodejs/node/main/doc/api/typescript.md), [tsx docs: TypeScript](https://raw.githubusercontent.com/privatenumber/tsx/master/docs/typescript.md), [tsx docs: FAQ](https://raw.githubusercontent.com/privatenumber/tsx/master/docs/faq.md), [ts-node README](https://raw.githubusercontent.com/TypeStrong/ts-node/main/README.md), npm registry (`npm view ts-node time --json`, `npm view tsx time --json`, 2026-10-17)
- Related: NODE-003, NODE-004, NODE-007, NODE-010

Don't add ts-node to a project. Run erasable TypeScript with plain `node`; reach for tsx only for what stripping can't do; build apps that need decorator metadata with `tsc` or the framework's CLI.

| | `node file.ts` | tsx | ts-node |
|---|---|---|---|
| Install | none (Node 22.18+, NODE-003) | `tsx@4.23.15` (2026-09-20), engines `node >=18` | last release `10.9.2`, 2023-12-08 |
| Type-checks | no | no: "does not type check your code on its own" | yes, unless `transpileOnly` |
| Enums, parameter properties | error (NODE-004) | compiled by esbuild (not stated in its docs) | yes |
| `tsconfig` `paths` | no | "support for `tsconfig.json` paths" | with the `tsconfig-paths` package |
| `.tsx`, JSX | no | yes | yes |
| `emitDecoratorMetadata` | no | "is not supported" | yes |

For "full support of all of TypeScript's syntax and features", Node's own docs point to a third-party package and use tsx as the example (`npx tsx file.ts` or `node --import=tsx file.ts`). ts-node's README still documents ESM through `--loader ts-node/esm`, and Node 26's CLI docs call `--experimental-loader` "discouraged". Open ts-node issues report `ERR_UNKNOWN_FILE_EXTENSION` for `.ts` in ESM projects on Node 20 and later, with no maintainer reply in the threads read (single source, not tested).

Whichever runs the code, check types in CI with `tsc --noEmit`. NestJS dependency injection relies on `emitDecoratorMetadata`, so a NestJS app runs through `nest start` or a `tsc` build, not stripping or tsx.

## [NODE-006] `--env-file` instead of dotenv: format, precedence and what it lacks
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Node.js docs: CLI `--env-file`](https://raw.githubusercontent.com/nodejs/node/v26.12.0/doc/api/cli.md), [Node.js docs: `process.loadEnvFile()`](https://raw.githubusercontent.com/nodejs/node/v26.12.0/doc/api/process.md), [dotenv README](https://raw.githubusercontent.com/motdotla/dotenv/master/README.md)
- Related: NODE-007, NODE-009

`node --env-file=.env app.js` loads a `.env` file without dotenv. It's stable: "The `--env-file` flag is no longer experimental" in v24.10.0 and v22.21.0; `process.loadEnvFile()` (added v21.7.0) is stable from the same releases. Use `--env-file-if-exists=.env` when the file is optional.

Rules from the docs:
- "If the same variable is defined in the environment and in the file, the value from the environment takes precedence."
- Several `--env-file` flags may be given; "Subsequent files override pre-existing variables defined in previous files." dotenv is the other way round: "The first value set for a variable will win, unless the `options.override` flag is set".
- "An error is thrown if the file does not exist."
- Supported: `#` comments, also after a value; quotes `` ` ``, `"` and `'`; multi-line values; a leading `export`.

Not supported, unlike dotenv and its add-ons: `${VAR}` expansion (dotenv itself says "Use dotenvx for variable expansion"; dotenv-expand does it on top of dotenv), an override mode, encrypted files.

Tested 2026-10-17, node@22.23.3, 24.22.0 and 26.12.0, same result on all three: `C=${A}-expanded` stayed literal; a value set in the shell beat the file; `"line1\nline2"` became two lines; `export D=x` and `E=has # hash` gave `x` and `has`; a missing `--env-file` exited 9 (`not found`), while `--env-file-if-exists` printed "not found. Continuing without it." and ran.

## [NODE-007] `--watch` instead of nodemon, and where it differs
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Node.js docs: CLI `--watch`, `--watch-path`](https://raw.githubusercontent.com/nodejs/node/v26.12.0/doc/api/cli.md), [nodemon README](https://raw.githubusercontent.com/remy/nodemon/main/README.md), [tsx docs: Watch mode](https://raw.githubusercontent.com/privatenumber/tsx/master/docs/watch-mode.md)
- Related: NODE-005, NODE-006

`node --watch app.ts` restarts on change with no package; "Watch mode is now stable" since v22.0.0 and v20.13.0. "By default, watch mode will watch the entry point and any required or imported module", so a change to a file the app reads but doesn't import (`.env`, a template, JSON read with `fs`) doesn't restart it. `--watch-path=./src` watches folders instead and "will turn off watching of required or imported modules". `--watch-preserve-output` keeps the console; `--watch-kill-signal` (added v24.4.0) is "Stability: 1.1 - Active Development".

What nodemon still has: a `nodemon.json` or `package.json` config, an extension list (`-e`, default `.js`, `.mjs`, `.coffee`, `.litcoffee`, `.json`), `--exec` for non-Node commands, `--delay`, ignore globs, and legacy polling (`-L`) for file systems without change events. tsx's own docs say Node's flag "does not yet match the robustness of tsx's Watch mode". Framework dev servers (`nest start --watch`, `ng serve`) bring their own watchers.

Conflict: the docs say `--watch-path` "is only supported on macOS and Windows" and throws `ERR_FEATURE_UNAVAILABLE_ON_PLATFORM` elsewhere. Tested 2026-10-17, node@22.23.3, 24.22.0 and 26.12.0 on Linux (WSL2): `--watch-path=./wp` started without error, and on 24 and 26 writing a non-imported file in `./wp` restarted the app once. Trust the test on Linux, but keep nodemon `-L` for mounted or network folders.

## [NODE-008] `node:test`: stable runner, experimental coverage and module mocks
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Node.js docs: Test runner (v24.22.0, v26.12.0)](https://raw.githubusercontent.com/nodejs/node/v26.12.0/doc/api/test.md), [Node.js docs: CLI test flags](https://raw.githubusercontent.com/nodejs/node/v26.12.0/doc/api/cli.md)
- Related: NODE-003, NODE-004

`node:test` is "Stability: 2 - Stable" on 24 and 26 (stable since v20.0.0) and runs TypeScript tests through type stripping. Coverage, watch and module mocking are not stable yet, so for apps on Vitest or Jest it's no replacement; see `kb-js-testing.md`.

With no arguments, `node --test` runs `**/*.test.{cjs,mjs,js}`, `**/test/**/*.{cjs,mjs,js}` and similar patterns, and "Unless `--no-strip-types` is supplied", `**/*.test.{cts,mts,ts}` too.

Status on 24.22.0 and 26.12.0:
- Snapshots (`t.assert.snapshot()`): stable since v23.4.0 and v22.13.0.
- Coverage (`--experimental-test-coverage`): "Stability: 1 - Experimental"; thresholds (`--test-coverage-lines` and others) exit 1 when missed, also experimental. Output is a text summary or an `lcov` reporter; no HTML report.
- Watch mode (`node --test --watch`): "1 - Experimental".
- `mock.module()` behind `--experimental-test-module-mocks`, test tags and global setup: "1.0 - Early development". `--test-randomize` exists only on 26 (added v26.1.0).
- Isolation: "The default isolation mode is `'process'`."

Where it isn't Jest or Vitest: no DOM environment (jsdom, browser mode), module mocking behind a flag, no HTML coverage, and the stripping limits of NODE-004 (no enums or `.tsx`). It fits small libraries, scripts and CLIs with no DOM.

Tested 2026-10-17, node@22.23.3, 24.22.0 and 26.12.0: `node --test` with no arguments found and passed `src/add.test.ts` (importing `./add.ts`) and `src/plain.test.js` on all three.

## [NODE-009] `node:sqlite` and the permission model: status and limits
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Node.js docs: SQLite (v24.22.0, v26.12.0)](https://raw.githubusercontent.com/nodejs/node/v26.12.0/doc/api/sqlite.md), [Node.js docs: Permissions (v26.12.0)](https://raw.githubusercontent.com/nodejs/node/v26.12.0/doc/api/permissions.md), [Node.js docs: CLI `--allow-net`, `--config-file`](https://raw.githubusercontent.com/nodejs/node/v26.12.0/doc/api/cli.md)
- Related: NODE-006, INFRA-006

**`node:sqlite`** needs no flag since v22.13.0 and v23.4.0, and is "Stability: 1.2 - Release candidate" (from v24.15.0 on 24, v25.7.0 on 26). Its API is synchronous. On 26 the classes are `Database` and `Statement`; "`DatabaseSync` is a deprecated alias for `Database`" (DEP0210, documentation-only, v26.11.0). On 24 write `new DatabaseSync(path)`, which also runs on 26.

**Permission model** (`node --permission`): "Stability: 2 - Stable" since v23.5.0 and v22.13.0. It blocks file system access, child processes, workers, native addons and WASI unless granted (`--allow-fs-read`, `--allow-fs-write`, `--allow-child-process` and others), and from v25.0.0 the network unless `--allow-net` (1.1). A `"permission"` object in `node.config.json` turns it on with `--config-file`, stable from v26.12.0. It is no sandbox: "This feature does not protect against malicious code"; it is a "seat belt" for trusted code. Known gaps include symbolic links followed outside granted paths, existing file descriptors, and the file system reached "through the `node:sqlite` module". Don't use it to contain an agent or untrusted code (INFRA-006).

Tested 2026-10-17: `node:sqlite` ran without flags on node@22.23.3 (with an ExperimentalWarning, SQLite 3.51.3), 24.22.0 (3.53.4) and 26.12.0 (3.54.0), with no warning on the last two. Under `--permission`, reading an ungranted file threw `ERR_ACCESS_DENIED` on all three; `fetch` to localhost was denied only on 26.12.0, and `--allow-net` there printed an ExperimentalWarning.

## [NODE-010] `require(esm)` works, and `module.register()` is deprecated in 26
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Node.js docs: Modules: Loading ECMAScript modules using `require()`](https://raw.githubusercontent.com/nodejs/node/v26.12.0/doc/api/modules.md), [Node.js docs: Deprecations, DEP0205](https://raw.githubusercontent.com/nodejs/node/v26.12.0/doc/api/deprecations.md), [Node.js docs: `module.registerHooks()`](https://raw.githubusercontent.com/nodejs/node/v26.12.0/doc/api/module.md), [Node.js docs: Packages, `"module-sync"`](https://raw.githubusercontent.com/nodejs/node/main/doc/api/packages.md)
- Related: NODE-005, NODE-012

CommonJS can `require()` an ES module on every supported line, so an ESM-only dependency no longer forces a CommonJS app to switch or use `import()`. The exception is top-level `await`.

`require(esm)`, from the YAML in `modules.md`:
- v22.12.0, v23.0.0 and v20.19.0: "no longer behind the `--experimental-require-module` CLI flag."
- v22.13.0, v23.5.0 and v20.19.0: no experimental warning by default.
- v24.15.0 and v25.4.0: "This feature is no longer experimental." (On 22.23.3 it's still "1.2 - Release candidate".)
- A module whose graph has top-level `await` throws `ERR_REQUIRE_ASYNC_MODULE`. `process.features.require_module` says whether the build supports it; packages can export a `"module-sync"` condition. Publishing side: `kb-npm.md`.

`module.register()` (async, off-thread loader hooks) is DEP0205: documentation-only in v24.15.0 and v25.9.0, runtime in v26.0.0. "Use `module.registerHooks()` instead": synchronous, in-thread hooks that "work for all types of modules", added v23.5.0 and v22.15.0, "Stability: 1.2 - Release candidate" since v25.4.0 and v24.13.1. The docs say `register()` "will be removed in a future version". Loaders started with `--import` that still call `register()` print the warning on 26; tsx's source prefers `registerHooks()` where available (read, not run).

Tested 2026-10-17, node@22.23.3, 24.22.0 and 26.12.0: `require('./esm.mjs')` from a `.cjs` file worked without warnings on all three, and a module with top-level `await` threw `ERR_REQUIRE_ASYNC_MODULE`. `module.register()` printed "[DEP0205] DeprecationWarning: `module.register()` is deprecated" only on 26.12.0.

## [NODE-011] Language features on by default in Node 22, 24 and 26
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [CHANGELOG_V24.md: 24.0.0](https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V24.md), [CHANGELOG_V25.md: 25.0.0](https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V25.md), [CHANGELOG_V26.md: 26.0.0](https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V26.md), [MDN browser-compat-data](https://github.com/mdn/browser-compat-data/tree/main/javascript/builtins) (`support.nodejs`), [nodejs.org dist index](https://nodejs.org/dist/index.json)
- Related: NODE-012, NODE-014

Don't polyfill or install these on the lines that have them. V8 is 12.4 on 22.23.3, 13.6 on 24.22.0 and 14.6 on 26.12.0.

| Feature | 22 | 24 | 26 | Source |
|---|---|---|---|---|
| Iterator helpers (`.map`, `.take`, `.toArray`), `Array.fromAsync`, Set methods | yes | yes | yes | BCD: Node 22.0.0 |
| `Promise.try` | no | yes | yes | BCD: Node 23.0.0 |
| `RegExp.escape`, `Float16Array`, `Error.isError`, `using` / `await using` | no | yes | yes | 24.0.0 notes (V8 13.6) |
| `URLPattern` global | no | yes | yes | 24.0.0: "`URLPattern` is available globally" |
| `Atomics.pause` | no | yes | yes | BCD: Node 24.0.0 |
| `Uint8Array.fromBase64`, `.toBase64()`, hex | no | no | yes | 25.0.0 notes (V8 14.1) |
| Temporal | no | no | yes | 26.0.0: "The Temporal API is now enabled by default" |
| `Map`/`WeakMap` `getOrInsert()`, `getOrInsertComputed()`; `Iterator.concat()` | no | no | yes | 26.0.0 notes (V8 14.6) |
| `Math.sumPrecise` | no | no | no | BCD: Node `false` |

Caveats: `Error.isError` returned `false` for `DOMException` before 24.3.0 (BCD). On 24, Temporal exists only behind V8's undocumented `--harmony-temporal`; don't ship that. A Node 26 built from source without Rust has no Temporal (BUILDING.md at v26.12.0); official binaries have it. The matching TypeScript `lib` is in `kb-typescript.md`; keep `@types/node` at the runtime's major (NODE-014).

Tested 2026-10-17, official node@22.23.3, 24.22.0 and 26.12.0 binaries, one probe script each: every yes/no in the table matched, and `Temporal.Now.zonedDateTimeISO("Europe/Amsterdam")` worked on 26.12.0.

## [NODE-012] Removals and deprecations that hit app code on 25 and 26
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [CHANGELOG_V26.md: 26.0.0 Deprecations and Removals](https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V26.md), [CHANGELOG_V25.md: 25.0.0](https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V25.md), [Node.js docs: Deprecations](https://raw.githubusercontent.com/nodejs/node/v26.12.0/doc/api/deprecations.md)
- Related: NODE-003, NODE-010, NODE-011, NODE-015

Moving from 24 to 26 skips 25, so check both majors' removals. Most are long-deprecated APIs an agent still writes from memory.

Removed in 25.0.0, so gone in 26:
- `SlowBuffer`; `fs.F_OK`, `fs.R_OK`, `fs.W_OK`, `fs.X_OK` (use `fs.constants`); the `recursive` option of `fs.rmdir` (use `fs.rm`).
- `assert.CallTracker`, `assert.fail` with several arguments, `process.on('multipleResolves')`.
- Corepack is no longer in the download (NODE-015).

Changed in 26.0.0:
- Removed: `http.Server.prototype.writeHeader()` ("Use `http.Server.prototype.writeHead()`"); the `_stream_readable`, `_stream_writable`, `_stream_duplex`, `_stream_transform`, `_stream_passthrough` and `_stream_wrap` modules; `--experimental-transform-types` (NODE-003).
- Runtime-deprecated: `module.register()` (DEP0205, NODE-010), and DEP0203 and DEP0204 (CryptoKey and non-extractable keys passed to `node:crypto`).
- "lib: return undefined for localStorage without file": Web Storage is on since 25.0.0, but `localStorage` needs `--localstorage-file`.

Still warning on 24 and 26, not removed: `url.parse()` is DEP0169, "Application (non-`node_modules` code only)" since v24.0.0, so your code warns and dependencies don't (use `new URL()`); the 24.0.0 release notes call it a "Runtime deprecation". Also `node:punycode` (DEP0040) and `new Buffer()` (DEP0005).

Tested 2026-10-17: on node@26.12.0 `typeof localStorage` was `'undefined'`, with "ExperimentalWarning: localStorage is not available because --localstorage-file was not provided." On 24.22.0 and 26.12.0, `url.parse()` printed DEP0169 when called from the app's own file and nothing when called from a package under `node_modules`.

## [NODE-013] Bundled undici: fetch versions, HTTP/2 on 26, and when to install undici
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Node.js docs: Globals, `fetch`](https://raw.githubusercontent.com/nodejs/node/v26.12.0/doc/api/globals.md), [CHANGELOG_V26.md: 26.0.0](https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V26.md), [undici README (v8.12.2)](https://raw.githubusercontent.com/nodejs/undici/v8.12.2/README.md), [undici v8.0.0 release](https://github.com/nodejs/undici/releases/tag/v8.0.0), [Node.js docs: CLI `NODE_USE_ENV_PROXY`](https://raw.githubusercontent.com/nodejs/node/v24.22.0/doc/api/cli.md)
- Related: NODE-011, NODE-012

Global `fetch` is undici: 6.28.1 in Node 22.23.3, 7.29.1 in 24.22.0 and 8.11.2 in 26.12.0 (`process.versions.undici`). Node 26.0.0: "Undici has been updated to version 8.0.2". undici 8 made "enable h2 by default" a breaking change, so Node 26's `fetch` negotiates HTTP/2 where the server offers it.

Install `undici` when you need what the bundled copy doesn't expose. Its README lists "APIs not available in the built-in fetch (`ProxyAgent`, `Socks5Agent`, `MockAgent`, etc.)", pooling configuration, interceptors, `undici.request()` for speed, and features newer than your Node's copy. Its table pairs 7.x with Node 24 and 8.x with Node 26; `undici@8` needs Node `>=22.19.0`.

The rule: take `fetch` and the `Agent` you pass as `dispatcher` from the same package, as `import { fetch, Agent } from 'undici'`. The global `fetch` with an installed `Agent` of another major can fail. `setGlobalDispatcher()` from an installed undici reaches the global `fetch` too ("Calling this method will affect both `undici` and Node.js"). Don't mix the global `FormData` with `undici.fetch()` either (README).

Proxies: `NODE_USE_ENV_PROXY=1` (fetch from v24.0.0) or `--use-env-proxy` (v24.5.0) reads `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY`, at "Stability: 1.1 - Active Development". `WebSocket` is global since 22; `EventSource` still needs `--experimental-eventsource` on 24 and 26.

Tested 2026-10-17, node@22.23.3, 24.22.0 and 26.12.0, `undici@7.30.1` and `undici@8.12.2` installed with `--ignore-scripts`: a local TLS server offering HTTP/2 and 1.1 saw HTTP/1.1 from 22 and 24, HTTP/2.0 from 26. On 24.22.0 the global `fetch` with undici 8's `Agent` as `dispatcher` failed ("invalid onRequestStart method"); on 26.12.0 it accepted undici 7's. Same-package pairs and `setGlobalDispatcher()` worked on 24 and 26.

## [NODE-014] Pinning a repo's Node version: `.node-version`, `engines`, `devEngines`, setup-node
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [actions/setup-node v7.1.0 README](https://raw.githubusercontent.com/actions/setup-node/v7.1.0/README.md), [setup-node advanced usage (v7.1.0)](https://raw.githubusercontent.com/actions/setup-node/v7.1.0/docs/advanced-usage.md), [npm docs: package.json `engines`, `devEngines`](https://raw.githubusercontent.com/npm/cli/latest/docs/lib/content/configuring-npm/package-json.md), [nvm README](https://raw.githubusercontent.com/nvm-sh/nvm/master/README.md), [fnm README](https://raw.githubusercontent.com/Schniz/fnm/master/README.md), [mise docs: Node](https://raw.githubusercontent.com/jdx/mise/main/docs/lang/node.md), npm registry (`npm view @types/node dist-tags --json`, 2026-10-17)
- Related: NODE-001, NODE-011, NODE-015

Keep one version file, point CI at it, and treat `engines` as a hint. A major-only pin (`24`) gets patch releases without bumps.

- **The file.** `.node-version` with `24` is read by actions/setup-node, fnm ("Works with `.node-version` and `.nvmrc` files") and mise (after opting in). nvm's README documents only `.nvmrc`; add one too if people use nvm. No official Node or npm recommendation between the two was found.
- **CI.** setup-node (latest `v7.1.0`, 2026-10-08): `node-version-file: .node-version`. It accepts "`.nvmrc`, `.node-version`, `.tool-versions`, `mise.toml`, or `package.json`"; for `package.json` it reads `volta.node`, then `devEngines.runtime`, then `engines.node`. "If both the `node-version` and the `node-version-file` inputs are provided then the `node-version` input is used." Workflow details: `kb-github-actions.md`.
- **`engines.node`** is "advisory only and will only produce warnings when your package is installed as a dependency", unless `engine-strict` is set. It states what a published package supports.
- **`devEngines.runtime`** (npm 10.9.0 and later) runs "before `install`, `ci`, and `run` commands" for people working on the repo; `onFail` is `warn`, `error` or `ignore`, defaulting to `error`.
- **Docker** pins its own base image tag (`kb-docker-node.md`).
- **`@types/node`** at the runtime's major: on 2026-10-17 a bare `npm i -D @types/node` installs 26.6.5, whose types offer APIs Node 24 lacks (NODE-011). Pin `@types/node@^24` on Node 24.

## [NODE-015] npm 12 and Corepack: neither ships with Node 24 or 26
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [nodejs.org dist index](https://nodejs.org/dist/index.json), npm registry (`npm view npm engines dist-tags time --json`, 2026-10-17), [npm v12.0.0 release notes](https://github.com/npm/cli/releases/tag/v12.0.0), [nodejs/Release#1161: Plans for npm 12](https://github.com/nodejs/Release/issues/1161), [Node.js distribution doc](https://raw.githubusercontent.com/nodejs/node/main/doc/contributing/distribution.md), [Corepack README](https://raw.githubusercontent.com/nodejs/corepack/main/README.md)
- Related: NODE-002, NODE-012, NODE-014

No Node release bundles npm 12: 26.12.0 ships npm 11.20.0, 24.22.0 ships 11.19.1 and 22.23.3 ships 10.9.9. On 2026-08-13 a Node.js member wrote for the Release WG in nodejs/Release#1161: "The Release WG has decided not to land npm 12 on Node.js 26, 24 or 22." It's expected with Node 27, whose Alpha starts 2026-10-28 (a community comment in the same issue; not confirmed).

npm 12.0.0 was published 2026-07-08. On 2026-10-17 `latest` is 12.2.0; 12.2.1 (published 2026-10-15) is tagged `next-12`. Its engines: `"node": "^22.22.2 || ^24.15.0 || >=26.0.0"`, so a Node 24 older than 24.15.0 can't run it. Install it with `npm install -g npm@12`; what npm 12 changes (install scripts blocked by default, `allowScripts`) is in `kb-npm.md`.

Corepack "is no longer distributed as of Node.js 25.0.0" ("build: stop distributing Corepack", 25.0.0). Node 24 and 22 still ship it. On 26, install it with `npm install -g corepack` to keep using the `packageManager` field for pnpm or Yarn.

Tested 2026-10-17: the official linux-x64 tarball of node 26.12.0 has `node`, `npm` and `npx` in `bin/` and no `corepack`; 24.22.0's has `corepack` as well.

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-17 against `main` of osrs-tracker-web, osrs-tracker-api, freek-mencke-web, claude-skills and this repo: the three apps run `node:24-alpine` (pinned by digest) with `engines` `>=24`; this repo pins `.node-version` `24` for setup-node; claude-skills' CI uses `node-version: 22`.

1. **Stay on Node 24; move the apps to 26 by hand once it's LTS (from 2026-10-28), with no deadline before 2028-04-30** (NODE-001). The Dependabot configs already keep Node majors manual and name what moves together: the Dockerfile, CI's setup-node, `engines` and `@types/node`. Add NODE-012's list to that checklist. A grep on 2026-10-17 found none of NODE-012's removed or deprecated APIs, `module.register()`, ts-node, nodemon or dotenv in the four repos, so no issue is opened now.
2. **Keep osrs-tracker-api importing `fetch` and `Agent` from the installed undici** (NODE-013). That pairing worked on every line tested, while Node 24's global `fetch` rejected an undici 8 `Agent`. Through undici 8 its requests already offer HTTP/2 (undici 8's `allowH2` default; inferred, not observed in production).
3. **Keep `@types/node` at the runtime's major** (NODE-014). In place: the apps pin `^24.19.2`, and osrs-tracker-api's Dependabot skips all majors.
4. **New scripts: `.ts` run with plain `node`, erasable syntax only** (NODE-003, NODE-005), not tsx or ts-node. This repo's `scripts/check-kb.ts` already runs that way. Existing `.js` and `.mjs` scripts stay as they are.
5. **Won't do: replace Vitest with `node:test`** (NODE-008). The Angular and NestJS builders and our testing rules use Vitest, and `node:test`'s coverage and module mocks are experimental.
6. **Won't do now: move claude-skills' CI off Node 22** (NODE-001, NODE-014). The job uses Node only to install Claude Code, and 22 is supported until 2027-04-30; switch it to a `.node-version` file when the workflow is next changed, and before that date.

## Open questions

- **`--watch-path` on Linux** (NODE-007): the v24.22.0 and v26.12.0 docs say macOS and Windows only, but it worked on Linux (WSL2) for 22, 24 and 26. Not tested on a native Linux kernel, nor whether the doc sentence is just stale.
- **npm 12 in Node 27** (NODE-015): only a community comment expects it in the Alpha of 2026-10-28; re-check CHANGELOG_V27.md and `npm view npm engines` then.
- **ts-node on Node 24 and 26 ESM projects** (NODE-005): the reported `ERR_UNKNOWN_FILE_EXTENSION` issues have no maintainer reply, and ts-node wasn't run (community code).
- **Does the published tsx 4.23.15 use `module.registerHooks()`** on 24.22 and 26 (NODE-010)? Read from tsx's `master` source only.
- **The Node 27 phases** (NODE-002): the blog has one 30-month LTS phase; `schedule.json` still has a `maintenance` date for 27 and no `lts` key. Whether Active LTS and Maintenance merge isn't stated, and nodejs/Release#1142 (closed) proposed renaming Alpha.
- **Installed undici 7 with Node 26's bundled 8**: worked in NODE-013's test, but the undici README describes only the bridge in the other direction.
- **`process.loadEnvFile()` precedence**: the docs state it for `--env-file` only; not tested for the function.
- **Not read:** Volta's pinning docs, asdf, and how Dependabot or Renovate update `.nvmrc` and `.node-version`.
