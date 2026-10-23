# Node/TS lint, format and build tools

Prefix `JSTOOL`. This file covers the tools that lint, format and build JavaScript and TypeScript on 2026-10-17: ESLint 10 and its CLI, typescript-eslint's typed linting and angular-eslint 22, Oxlint (with type-aware linting through tsgolint) and Biome 2 as alternatives, Prettier 3 and oxfmt, knip 6, Vite 8 with Rolldown, Rolldown and tsdown, esbuild, what Angular 22 and NestJS 12 build with, rspack and rsbuild 2, and which flags give an agent short, machine-readable output. TypeScript 7 support across tools is TS-009; test runners are in `kb-js-testing.md`; how a script should print for Claude is TOK-108 and TOK-109.

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#182, part of roadmap #167) by an Opus 5.5 lead with three Sonnet 5.5 readers.
- Versions and dates come from the npm registry (`npm view <pkg> dist-tags`, `npm view <pkg> 'time[<version>]'`, `npm view <pkg>@<version> peerDependencies engines dependencies`). Docs were read as raw text from the projects' repos (`main` unless noted): eslint/eslint, typescript-eslint/typescript-eslint, angular-eslint/angular-eslint, oxc-project/website, biomejs/website, prettier/prettier, webpro-nl/knip, vitejs/vite, rolldown/rolldown, rolldown/tsdown, egoist/tsup, angular/angular-cli, angular/angular, nestjs/nest-cli, nestjs/docs.nestjs.com, nestjs/schematics at `12.0.7`, web-infra-dev/rspack and rsbuild; esbuild.github.io as stripped HTML.
- Tested on Node 24.21.0 (WSL2) with official packages installed by `npm install --ignore-scripts` in a scratch folder: `eslint@10.13.0`, `@eslint/js@10.0.1`, `typescript-eslint@8.71.2`, `typescript@6.0.3`, `oxlint@1.88.0`, `oxlint-tsgolint@7.0.2004`, `@biomejs/biome@2.5.15`, `prettier@3.9.10`, `knip@6.41.0`. Lint and build timings ran on shallow clones of our public osrs-tracker-web (`94d0180`, 221 `.ts` files, 19,332 lines; its lockfile has ESLint 10.12.0 and `@angular/build` 22.2.2) and freek-mencke-web (`d0e88dd`), 8 cores, from Claude Code 2.1.299's Bash tool. No community package was run.
- Our repos' setup was read on 2026-10-17 from `main`: both Angular apps lint with ESLint 10.12, typescript-eslint 8.71 (untyped) and angular-eslint 22.6, format with Prettier 3.9.10 and run knip 6.41; osrs-tracker-api lints with typed typescript-eslint and builds with `nest build -b rspack`.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| What breaks in ESLint 9 to 10? | `.eslintrc*` is gone (no flat config means exit 2), `/* eslint-env */` comments are lint errors, config lookup starts at each file's directory, Node `^20.19.0 \|\| ^22.13.0 \|\| >=24`, three rules join `eslint:recommended`. Run `npx codemod @eslint/v9-to-v10` on a clean tree. | JSTOOL-001, JSUP-003 |
| Which ESLint output should an agent ask for? | `-f json` (or `json-with-metadata`), `--quiet` for errors only, `--max-warnings 0` to fail on warnings. Only `stylish`, `json`, `json-with-metadata` and `html` are built in: `-f unix` exits 2. Exit 1 means problems, 2 a config or internal error. | JSTOOL-002, JSTOOL-020 |
| Is `eslint --cache` safe with typed rules? | No: the cache doesn't track dependencies between files, so type-aware results go stale; typescript-eslint says "We don't recommend using `--cache`". | JSTOOL-002, JSTOOL-003 |
| What does typed linting cost, and is it worth it? | About as long as a type check: 2.1–2.9 s became 4.6–5.5 s on a 221-file Angular app, and it found 5 floating promises the untyped config missed. Use `projectService: true`. | JSTOOL-003 |
| Does typescript-eslint support ESLint 10 and TypeScript 7? | ESLint 10 since 8.56.0 (2026-02-16). TypeScript 7 no: peer `<6.1.0`; support waits for TS 7.1's API (draft `projectService.EXPERIMENTAL_backend`). `tseslint.config()` is deprecated for ESLint's `defineConfig()`. | JSTOOL-004, TS-009 |
| Which angular-eslint for Angular 22? | 22.x: flat config only, ESLint 9 or 10 (10 since 21.3.0), typed linting off unless you opt in (`ng add angular-eslint --tseslint-preset=strictTypeChecked`). | JSTOOL-005 |
| Can Oxlint replace ESLint? | For TS and JS rules, yes: 871 rules and 59 of typescript-eslint's 61 type-aware rules, in hundredths of a second here against seconds for ESLint (different rules). Not for Angular templates, eslintrc configs or custom parsers; JS plugins are alpha. Nest 12's template ships it. | JSTOOL-006, JSTOOL-007, JSTOOL-010 |
| Why does oxlint print one line per problem and no summary under Claude Code? | Oxlint 1.88 picks its `agent` format when it sees `CLAUDECODE` or `AI_AGENT` (tested; undocumented). Pass `-f default` for the summary. | JSTOOL-008 |
| Biome or Prettier plus ESLint? | Biome 2.6 is one fast tool (607 rules, formatter 97% Prettier-compatible) but runs no ESLint plugins and doesn't handle Angular templates. Keep ESLint and Prettier in an Angular repo. | JSTOOL-009, JSTOOL-010 |
| Why doesn't Prettier format my Angular template's `@if` blocks? | Prettier infers the `angular` parser only for `*.component.html`; the style guide's `user-profile.html` gets `html`, and its control flow stays unformatted. Add an `overrides` entry with `"parser": "angular"`. | JSTOOL-011 |
| How do I find unused files, exports and dependencies? | knip 6: `knip --reporter json --no-progress` (or `compact`); `--production` for shipped code only; review before `--fix`. Exit 1 means findings, 2 a config or plugin load error. | JSTOOL-013 |
| What changed in Vite 8? | Rolldown replaces esbuild and Rollup, Oxc transforms and minifies, Lightning CSS minifies CSS; `build.rollupOptions` became `build.rolldownOptions` (old names still converted). Node 20.19+ or 22.12+. | JSTOOL-014 |
| What does `ng build` use under the hood? | esbuild bundles; Vite serves `ng serve` only; Rolldown runs the chunk optimizer (default since 22.1.0, `NG_BUILD_OPTIMIZE_CHUNKS`); the webpack `browser` builder is deprecated. | JSTOOL-017 |
| What does `nest build` use, and is rspack type-checked? | `tsc` by default; `-b swc`, `-b rspack` (new in CLI 12.0.0) or the deprecated `-b webpack`. The rspack builder type-checks only if `fork-ts-checker-webpack-plugin` is installed, and skips silently otherwise. | JSTOOL-018 |
| How do I keep `ng build` output short? | `NG_BUILD_LOGS_JSON=1` printed 914 characters against 6,104 for the default chunk table; `--no-progress` barely helps (6,064). | JSTOOL-020 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| JSTOOL-001 | ESLint 10: what changed from 9 | fact | eslint, eslint-10, migration, flat-config |
| JSTOOL-002 | ESLint 10's CLI: formatters, exit codes, cache and suppressions | tool | eslint, cli, formatters, cache, suppressions |
| JSTOOL-003 | typescript-eslint typed linting: setup and cost | fact | typescript-eslint, typed-linting, projectservice, performance |
| JSTOOL-004 | typescript-eslint 8.71: ESLint 10, `defineConfig` and TypeScript 7 | fact | typescript-eslint, eslint-10, defineconfig, typescript-7 |
| JSTOOL-005 | angular-eslint 22: flat config, ESLint 10 and opt-in typed linting | fact | angular-eslint, angular, eslint-10, typed-linting |
| JSTOOL-006 | Oxlint 1.x: what it covers and what moving from ESLint loses | tool | oxlint, eslint, migration, angular |
| JSTOOL-007 | Oxlint's type-aware linting with tsgolint | tool | oxlint, tsgolint, typed-linting, typescript-go |
| JSTOOL-008 | Oxlint switches to its `agent` output format under Claude Code | fact | oxlint, agent-output, claude-code, formatters |
| JSTOOL-009 | Biome 2: one tool for lint and format, and its limits | tool | biome, prettier, eslint, gritql |
| JSTOOL-010 | ESLint, Oxlint or Biome for a TypeScript repo | comparison | eslint, oxlint, biome, angular, nestjs |
| JSTOOL-011 | Prettier 3.9: status and config pitfalls | fact | prettier, angular, configuration, eslint-config-prettier |
| JSTOOL-012 | oxfmt: a beta Prettier-compatible formatter | tool | oxfmt, prettier, formatter, oxc |
| JSTOOL-013 | knip 6: unused files, exports and dependencies | tool | knip, unused-code, dependencies, reporters |
| JSTOOL-014 | Vite 8: Rolldown, Oxc and Lightning CSS replace esbuild and Rollup | fact | vite, vite-8, rolldown, oxc, migration |
| JSTOOL-015 | Rolldown 1.0 and tsdown; tsup unmaintained | fact | rolldown, tsdown, tsup, library-bundling |
| JSTOOL-016 | esbuild 0.x: minor versions break, and it never type-checks | fact | esbuild, pinning, type-checking, decorators |
| JSTOOL-017 | Angular 22's build: esbuild, Vite for the dev server, Rolldown for chunks | fact | angular, esbuild, vite, rolldown, build |
| JSTOOL-018 | NestJS 12's `nest build`: tsc by default, rspack new, webpack deprecated | fact | nestjs, nest-cli, rspack, swc, type-checking |
| JSTOOL-019 | Rspack 2 and Rsbuild 2 | fact | rspack, rsbuild, webpack, build |
| JSTOOL-020 | Short, machine-readable output from lint and build tools | comparison | agent-output, eslint, oxlint, biome, knip, angular, vite |
| JSTOOL-021 | Picking a build tool: Angular, Nest, apps, libraries and scripts | comparison | vite, rolldown, tsdown, esbuild, rspack, angular, nestjs |

## [JSTOOL-001] ESLint 10: what changed from 9
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Migrate to v10.x](https://eslint.org/docs/latest/use/migrate-to-10.0.0) ([raw](https://raw.githubusercontent.com/eslint/eslint/main/docs/src/use/migrate-to-10.0.0.md)), [ESLint releases](https://github.com/eslint/eslint/releases), [ESLint version support](https://eslint.org/version-support/)
- Related: JSUP-003, JSTOOL-002, JSTOOL-004, JSTOOL-005

ESLint 10.0.0 was published 2026-02-06; `latest` is 10.13.0 (2026-10-16), and 9.x reached end-of-life on 2026-08-06 (JSUP-003). The changes users hit:
- **eslintrc is gone**: "Starting with ESLint v10.0.0, the old configuration format is no longer supported." `ESLINT_USE_FLAT_CONFIG=false` no longer works.
- **`/* eslint-env */` comments "are reported as errors"**, as a fatal message: delete them and set `languageOptions.globals`.
- **Config lookup** starts "from the directory of each linted file", not the working directory (the old `v10_config_lookup_from_file` flag is now the default and an error to pass). Pin one config with `--config`.
- **Node**: "Node.js < v20.19, v21, v23 are no longer supported"; `engines` is `^20.19.0 || ^22.13.0 || >=24`. Jiti below 2.2.0 too (for `eslint.config.ts`).
- **`eslint:recommended`** adds `no-unassigned-vars`, `no-useless-assignment` and `preserve-caught-error`.
- **JSX references are tracked**, which can add `no-unused-vars` and `no-undef` reports.
- **`stylish` honours `NO_COLOR`**, and `--color`/`--no-color` beat the environment.

`npx codemod @eslint/v9-to-v10` runs four codemods (config, custom rules, RuleTester, Linter API). Since 10.0: bulk-suppressions API (10.1.0, 2026-03-20), `includeIgnoreFile()` in `eslint/config` (10.4.0, 2026-05-15).

Tested 2026-10-17, eslint@10.13.0, Node 24.21.0: with only `.eslintrc.json`, `eslint src` exited 2 with "ESLint couldn't find an eslint.config.* file", with or without `ESLINT_USE_FLAT_CONFIG=false`; under a flat config, `/* eslint-env node */` gave `error /* eslint-env */ comments are no longer supported` with `"fatal": true` in JSON output.

## [JSTOOL-002] ESLint 10's CLI: formatters, exit codes, cache and suppressions
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Command line interface reference](https://eslint.org/docs/latest/use/command-line-interface) ([raw](https://raw.githubusercontent.com/eslint/eslint/main/docs/src/use/command-line-interface.md)), [Formatters reference](https://eslint.org/docs/latest/use/formatters/) ([raw](https://raw.githubusercontent.com/eslint/eslint/main/docs/src/use/formatters/index.md)), [Migrate to v9.x: removed formatters](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- Related: JSTOOL-001, JSTOOL-003, JSTOOL-020, TOK-109, HOOK-027

- **Formatters**: "The built-in formatter options are: html, json-with-metadata, json, stylish" (default `stylish`). `compact`, `unix`, `checkstyle`, `junit`, `tap` and others left core in v9 and are `eslint-formatter-<name>` packages.
- **Exit codes**: 0 clean (and within `--max-warnings`); 1 at least one error or too many warnings; 2 "a configuration problem or an internal error". Fatal parse errors count as lint errors unless `--exit-on-fatal-error`.
- **`--quiet`**: report errors only, and skip `warn` rules. **`--max-warnings 0`**: fail on any warning.
- **`--cache`** (`.eslintcache`): "It does not track dependencies between files… This includes type-aware rules"; "Run ESLint without `--cache` when you need accurate results from such rules." Running without `--cache` deletes the cache file.
- **`--concurrency`**: worker threads, "A positive integer, `auto` or `off`", default `off`.
- **Suppressions**: `--suppress-all` or `--suppress-rule <rule>` writes `eslint-suppressions.json`; later runs fail with exit 2 on unused suppressions unless `--prune-suppressions` or `--pass-on-unpruned-suppressions`. angular-eslint's builder has a `suppressionsLocation` option (22.0.0).
- **`--mcp`** "starts the ESLint MCP server for use with AI agents".
- Others: `--stats` (per-rule timing in JSON), `--no-warn-ignored`, `--fix-dry-run -f json`.

Tested 2026-10-17, eslint@10.13.0: `-f unix` exited 2 with "The unix formatter is no longer part of core ESLint. Install it manually with `npm install -D eslint-formatter-unix`".

## [JSTOOL-003] typescript-eslint typed linting: setup and cost
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Linting with type information](https://typescript-eslint.io/getting-started/typed-linting) ([raw](https://raw.githubusercontent.com/typescript-eslint/typescript-eslint/main/docs/getting-started/Typed_Linting.mdx)), [Performance troubleshooting](https://typescript-eslint.io/troubleshooting/typed-linting/performance) ([raw](https://raw.githubusercontent.com/typescript-eslint/typescript-eslint/main/docs/troubleshooting/typed-linting/Performance.mdx)), [Parser: projectService](https://typescript-eslint.io/packages/parser), [FAQ: ESLint `--cache`](https://typescript-eslint.io/troubleshooting/faqs/eslint)
- Related: JSTOOL-002, JSTOOL-004, JSTOOL-007, TS-009

Typed rules ("slower than traditional lint rules but are much more powerful") need a TypeScript program: "your lint times should be roughly the same as your build times." typescript-eslint says "**We strongly recommend you do use type-aware linting**".

Setup: `tseslint.configs.recommendedTypeChecked` (or `strictTypeChecked`, `stylisticTypeChecked`) plus `languageOptions.parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname }`. "We now recommend using `projectService` instead of `project` for easier configuration and faster linting." To add only the high-value rules, keep the untyped presets and turn on `@typescript-eslint/no-floating-promises` and `no-misused-promises`, as osrs-tracker-api does.

Cost drivers from the performance page: wide tsconfig `include` globs that pull in build output, and memory (`NODE_OPTIONS=--max-old-space-size=8192`). The FAQ on `--cache`: "it will only work reliably for untyped rules"; "We don't recommend using `--cache`."

Tested 2026-10-17, typescript-eslint@8.71.2 and eslint@10.12.0 (the repo's lockfile), Node 24.21.0, on osrs-tracker-web (221 `.ts` files), 3 runs each, no cache: the repo's untyped config took 2.1–2.9 s; adding `recommendedTypeChecked` with `projectService` took 4.6–5.5 s and reported 122 problems, among them 5 `no-floating-promises` (an unhandled `bootstrapApplication()`, `closeServers().then()` at shutdown, three router navigations) and 2 `no-misused-promises`. freek-mencke-web (23 files) had 1 floating promise.

## [JSTOOL-004] typescript-eslint 8.71: ESLint 10, `defineConfig` and TypeScript 7
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [typescript-eslint CHANGELOG](https://raw.githubusercontent.com/typescript-eslint/typescript-eslint/main/packages/typescript-eslint/CHANGELOG.md), [`typescript-eslint` package: `config(...)` (deprecated)](https://typescript-eslint.io/packages/typescript-eslint), [Dependency versions](https://typescript-eslint.io/users/dependency-versions), [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940), [typescript-eslint#12803](https://github.com/typescript-eslint/typescript-eslint/pull/12803)
- Related: TS-009, JSTOOL-003, JSTOOL-005, JSUP-002

`typescript-eslint` 8.71.2 (2026-10-12) peers `eslint ^8.57.0 || ^9.0.0 || ^10.0.0` and `typescript >=4.8.4 <6.1.0` (`npm view typescript-eslint@8.71.2 peerDependencies`).
- **ESLint 10**: supported since "8.56.0 (2026-02-16) … support ESLint v10".
- **`tseslint.config()` is deprecated** since 8.42.0 (2025-09-02) "in favor of ESLint core's `defineConfig(...)`" from `eslint/config`, "a nearly exact clone". One difference: "When `files` is provided in both a base object and an extension, `tseslint.config(...)` _overrides_ the `files` property in the extension, whereas `defineConfig(...)` semantically intersects the two". Switching can also raise type errors in a `// @ts-check` config.
- **TypeScript 7** (TS-009): maintainer on 2026-07-09, "there is nothing we can do to support tsgo / TSv7"; on 2026-09-29 the TS 7.1 work was "measuring slightly faster than the baseline of TypeScript 6", with no big speed-up expected "for this initial IPC-based version". Draft PR #12803 adds `projectService.EXPERIMENTAL_backend` (open on 2026-10-17).
- **v9**: no release planned; a "9.0.0" milestone exists, and majors come "as the need arises".
- Policy: "at least the latest two major versions of ESLint" and TypeScript "less than 2 years old".

## [JSTOOL-005] angular-eslint 22: flat config, ESLint 10 and opt-in typed linting
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [angular-eslint README](https://github.com/angular-eslint/angular-eslint) ([raw](https://raw.githubusercontent.com/angular-eslint/angular-eslint/main/README.md)), [angular-eslint CHANGELOG](https://raw.githubusercontent.com/angular-eslint/angular-eslint/main/CHANGELOG.md), [Rules requiring type information](https://raw.githubusercontent.com/angular-eslint/angular-eslint/main/docs/RULES_REQUIRING_TYPE_INFORMATION.md), [Configuring ESLint](https://raw.githubusercontent.com/angular-eslint/angular-eslint/main/docs/CONFIGURING_ESLINT.md)
- Related: ACCESS-011, NG-002, JSTOOL-004, JSTOOL-010

`angular-eslint` 22.6.0 (2026-10-11) peers `eslint ^9.0.0 || ^10.0.0`, `typescript-eslint ^8.0.0` and `typescript *`. Its major follows Angular's: "If your workspace is on an older Angular major, pin the matching major instead, e.g. `ng add angular-eslint@21`".
- **Flat config only**: it "supports only flat config (the legacy "eslintrc" format is no longer supported)". 22.0.0 (2026-06-07) also dropped ESLint 8 and Node 20 and moved to TypeScript 6.
- **ESLint 10** since 21.3.0 (2026-03-05).
- **Typed linting is off**: "by default `angular-eslint` sets up your config with performance in mind and does _not_ enable typed linting." Opt in at setup with `ng add angular-eslint --tseslint-preset=strictTypeChecked` (22.5.0), or add `projectService` later (JSTOOL-003).
- **Configs**: `tsRecommended`, `templateRecommended`, and `templateAccessibility` (not in `templateRecommended`, ACCESS-011). Inline templates need `processor: angular.processInlineTemplates` on the `.ts` block.
- **Its docs still show `tseslint.config(...)`**, which typescript-eslint deprecated (JSTOOL-004); `defineConfig` from `eslint/config` takes the same `extends` and `processor` keys (not tested with angular-eslint here).

`ng lint` runs `@angular-eslint/builder:lint`, which reads `lintFilePatterns` from `angular.json`.

## [JSTOOL-006] Oxlint 1.x: what it covers and what moving from ESLint loses
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Oxlint linter guide](https://oxc.rs/docs/guide/usage/linter.html) ([raw](https://raw.githubusercontent.com/oxc-project/website/main/src/docs/guide/usage/linter.md)), [Migrate from ESLint](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint), [JS plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins), [Versioning](https://oxc.rs/docs/guide/usage/linter/versioning), [nestjs/schematics 12.0.7 template](https://github.com/nestjs/schematics/tree/12.0.7/src/lib/application/files/ts)
- Related: JSTOOL-007, JSTOOL-008, JSTOOL-010, JSUP-003

Oxlint (1.0.0 on 2025-06-10; 1.88.0 on 2026-10-13) is a Rust linter with 871 rules (the docs' rule-count file) from "ESLint core rules; TypeScript rules (including type-aware rules); Popular plugins such as React, Jest, Vitest, Import, Unicorn, and jsx-a11y". Config is `.oxlintrc.json` or (experimental) `oxlint.config.ts`.

What it doesn't do:
- **Angular templates**: none. JS plugins (alpha, "compatible with ESLint v9+") don't support "Custom file formats and parsers (e.g. Svelte, Vue, Angular)". Vue, Svelte and Astro files get their `<script>` blocks linted.
- **eslintrc**: "cannot be migrated automatically". For flat configs, `npx @oxlint/migrate` (add `--type-aware` for typed rules); local custom plugins aren't migrated.
- **Semver**: nursery rules, JS plugins and type-aware linting "may introduce breaking changes at any time, even in patch or minor releases".

To run both during a move: `oxlint && eslint`, with `eslint-plugin-oxlint` turning off the ESLint rules Oxlint covers. Warnings exit 0 unless `--deny-warnings` or `--max-warnings`.

NestJS 12's `nest new` template ships `.oxlintrc.json` (`typescript/no-floating-promises: error`), `"lint": "oxlint --type-aware src/ test/"` and Prettier, no ESLint (schematics 12.0.7).

Tested 2026-10-17, oxlint@1.88.0, on osrs-tracker-web with no config: 96 default rules over 221 files in 0.05–0.07 s (ESLint's untyped run: 2.1–2.9 s, different rules), 18 `unicorn(no-useless-spread)` warnings, exit 0.

## [JSTOOL-007] Oxlint's type-aware linting with tsgolint
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Type-aware linting](https://oxc.rs/docs/guide/usage/linter/type-aware) ([raw](https://raw.githubusercontent.com/oxc-project/website/main/src/docs/guide/usage/linter/type-aware.md)), [Oxc blog: Type-Aware Linting Stable](https://oxc.rs/blog/2026-07-22-type-aware-linting-stable)
- Related: JSTOOL-003, JSTOOL-006, TS-009, TS-011

`oxlint --type-aware` (or `options.typeAware: true`) runs typescript-eslint's typed rules through `oxlint-tsgolint`, "powered by `typescript-go`" (TypeScript 7's compiler). It "currently supports 59 out of 61 type-aware rules from typescript-eslint". The 2026-07-22 post called it stable with tsgolint v7, which "tracks TypeScript v7.0.2"; versions read as TypeScript version plus patch (`7.0.2004` on 2026-10-10). Install `oxlint-tsgolint` in the project (an optional peer of `oxlint`); `--type-check` adds compiler diagnostics and "can replace a separate `tsc --noEmit` step in CI".

Limits from the docs: "TypeScript **7.0+** is required", "Some legacy `tsconfig` options are not supported (like `baseUrl`)", options deprecated in 6.0 must go first, and "Very large codebases may encounter high memory usage". Type-aware rules are outside semver (JSTOOL-006).

"7.0+ required" reads as the checker's language level, not the installed `typescript`: tsgolint bundles typescript-go, and Nest 12's template pairs it with `typescript ^6.0.2`. It's the way to get typed lint rules from TypeScript 7 while typescript-eslint can't (JSTOOL-004).

Tested 2026-10-17, oxlint@1.88.0 with oxlint-tsgolint@7.0.2004 installed in osrs-tracker-web (`typescript` 6.0.3, no Oxlint config): `--type-aware` ran in 0.43–0.49 s (3 runs) and reported the same 5 floating promises, at the same lines, as typescript-eslint's 4.6–5.5 s run (JSTOOL-003). Without `oxlint-tsgolint` in the project it exited 1: "Failed to find tsgolint executable".

## [JSTOOL-008] Oxlint switches to its `agent` output format under Claude Code
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-17
- Sources: [Oxlint output formats](https://oxc.rs/docs/guide/usage/linter/output-formats), [oxc#21955: add agent output mode](https://github.com/oxc-project/oxc/pull/21955), [oxc#25300: make automatic output format selection discoverable](https://github.com/oxc-project/oxc/pull/25300)
- Related: JSTOOL-006, JSTOOL-020, TOK-108, TOK-109

`--format agent` "Outputs a brief format intended for consumption by AI agents": one line per diagnostic, `file:line:col: severity plugin(rule): message help: …`, with no code frame and no summary. Added by oxc#21955 (merged 2026-05-02; oxlint 1.63.0 followed on 2026-05-05) "so we can reduce the tokens used".

The docs say only that `github` "will be enabled by default when Oxlint detects that it is running in a GitHub Actions environment". Oxlint also picks `agent` by itself: open PR #25300 says "oxlint quietly switches its output format when it detects an AI agent", which led Claude sessions to take the missing summary line for a bug and `--debug=timings` to print nothing.

Consequences in Claude Code's Bash tool: a clean run prints nothing and exits 0; warnings alone also exit 0. Pass `-f default` for the summary ("Found N warnings and N errors"), or `--deny-warnings` to make warnings fail.

Tested 2026-10-17, oxlint@1.88.0, Claude Code 2.1.299 Bash tool (terminal, WSL): with no `--format`, output was the agent format; unsetting only `CLAUDECODE` or only `AI_AGENT` kept it; unsetting both gave the default code-frame format. The binary also contains `GEMINI_CLI`, `CODEX_SANDBOX`, `COPILOT_CLI` and `CURSOR_A…` strings.

## [JSTOOL-009] Biome 2: one tool for lint and format, and its limits
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Comparison with other tools](https://biomejs.dev/introduction/comparison-with-other-tools/) ([raw at `570c827`](https://raw.githubusercontent.com/biomejs/website/570c82786cb7488b87a0d054234c7f2673dbbc39/src/content/docs/en/introduction/comparison-with-other-tools.mdx)), [Language support](https://biomejs.dev/introduction/language-support/), [Linter domains](https://biomejs.dev/linter/domains/), [Migrate from other tools](https://biomejs.dev/installation/migrate-from-other-tools/), [CLI reference](https://biomejs.dev/reference/cli/)
- Related: JSTOOL-010, JSTOOL-011, JSTOOL-006

Biome (2.0.0 on 2025-06-17; 2.6.2 on 2026-10-21, `npm view @biomejs/biome dist-tags`) lints and formats JS, TS, JSX, JSON, CSS and GraphQL in one binary. Its docs: 607 lint rules (568 in the 2.5 docs of 2026-10-17), "most of them ported from ESLint and its popular plugins"; "Biome's formatter matches Prettier's output in 97% of cases"; "formats about 25 times faster than Prettier" and "lints about 15 times faster than ESLint" (their benchmark). Defaults differ: "Biome indents with tabs while Prettier uses spaces."

Typed rules without `tsc`: the `types` domain runs Biome's own inference ("does not need TypeScript installed"), with `noFloatingPromises` and `noMisusedPromises` still nursery; "The rule count is considerably smaller than `typescript-eslint`'s". The docs list "TypeScript version 5.9".

What's lost: "ESLint has an ecosystem of JavaScript plugins that Biome cannot run"; plugins are GritQL only. HTML, Vue, Svelte and Astro are experimental and opt-in; Angular templates aren't in the support table, and "Prettier has more stable support for HTML and for HTML super languages such as Vue and Angular".

Moving: `biome migrate eslint --write` "migrates identical rules only" unless `--include-inspired`, and "the result does not behave exactly like ESLint"; `biome migrate prettier --write`. CI: `biome ci`. Reporters: `--reporter=concise` (one line per diagnostic), `summary`, `json` (experimental), `github`, `sarif` and more.

Tested 2026-10-17, @biomejs/biome@2.5.15: on one file, the default reporter printed about 20 lines per diagnostic, with a code frame and a fix diff; `--reporter=concise` printed one line each plus a summary.

## [JSTOOL-010] ESLint, Oxlint or Biome for a TypeScript repo
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Oxlint linter guide](https://oxc.rs/docs/guide/usage/linter.html), [Biome comparison](https://biomejs.dev/introduction/comparison-with-other-tools/) ([raw at `570c827`](https://raw.githubusercontent.com/biomejs/website/570c82786cb7488b87a0d054234c7f2673dbbc39/src/content/docs/en/introduction/comparison-with-other-tools.mdx)), [angular-eslint README](https://github.com/angular-eslint/angular-eslint), [nestjs/nest-cli 12.0.0 release](https://github.com/nestjs/nest-cli/releases/tag/12.0.0)
- Related: JSTOOL-003, JSTOOL-005, JSTOOL-006, JSTOOL-007, JSTOOL-009

| Need | ESLint 10 + typescript-eslint | Oxlint 1.88 | Biome 2.5 |
|---|---|---|---|
| Angular templates (`templateRecommended`, `templateAccessibility`) | Yes (angular-eslint) | No | No |
| Typed rules | Yes, on TS ≤ 6.0, at about type-check speed | 59 of 61, through typescript-go | Own inference, fewer rules |
| Custom rules | Any ESLint plugin; `no-restricted-syntax` selectors | ESLint-style JS plugins, alpha | GritQL plugins |
| Formatter | Prettier beside it | oxfmt (beta) beside it | Built in |
| Speed (osrs-tracker-web, 221 files) | 2.1–2.9 s untyped, 4.6–5.5 s typed | 0.05–0.07 s, 0.43–0.49 s type-aware | not measured |

Judgment: an Angular app keeps ESLint, because only angular-eslint lints templates (and their accessibility, ACCESS-011). A Node or NestJS backend can use Oxlint: Nest 12's template does, and its type-aware mode works where typescript-eslint can't use TypeScript 7. Biome fits a repo that wants one tool and has no Angular templates or ESLint plugins. Running Oxlint in front of ESLint (`eslint-plugin-oxlint`) speeds up a large repo without giving up template linting; at a few seconds a run, our repos don't need it.

## [JSTOOL-011] Prettier 3.9: status and config pitfalls
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Prettier options](https://prettier.io/docs/options) ([raw](https://raw.githubusercontent.com/prettier/prettier/main/docs/options.md)), [Configuration file](https://prettier.io/docs/configuration), [CLI](https://prettier.io/docs/cli), [Ignoring code](https://prettier.io/docs/ignore), [Integrating with linters](https://prettier.io/docs/integrating-with-linters), [Prettier CHANGELOG](https://raw.githubusercontent.com/prettier/prettier/main/CHANGELOG.md), [Angular style guide: file names](https://angular.dev/style-guide)
- Related: JSTOOL-012, JSTOOL-009, HOOK-027, DOC-014

`prettier` 3.9.10 (2026-10-10) is `latest`; 4.0 exists only as `4.0.0-alpha.13` (2025-11-18) on `next`. Since 3.0 `trailingComma` defaults to `all`; 3.5 added `objectWrap` and TypeScript config files (`prettier.config.ts`, needs Node 22.6+); 3.6 (2025-06-23) an `--experimental-cli` and the `@prettier/plugin-oxc` parser.

Pitfalls:
- **Angular templates without `.component`**: Prettier picks the `angular` parser only for `*.component.html`. Angular's style guide names a template `user-profile.html`, which gets `html`: control flow (`@if`) and pipes aren't formatted, and `--check` passes. Add `"overrides": [{ "files": "src/app/**/*.html", "options": { "parser": "angular" } }]`. "_Never_ put the `parser` option at the top level".
- **Ignore files**: `.prettierignore` uses gitignore syntax, and Prettier also follows `.gitignore` in the directory it runs from.
- **`--cache`**: "Plugins version and implementation are not used as cache keys"; delete the cache after a plugin update.
- **With ESLint**: use `eslint-config-prettier` (10.1.8) last in the config. `eslint-plugin-prettier` and similar are "**generally not recommended**" (slower, red squiggles).
- **CI**: `prettier --check .` exits 1 when a file isn't formatted, 2 when "Something's wrong with Prettier"; `--log-level warn` keeps only the `[warn]` lines naming unformatted files.

Tested 2026-10-17, prettier@3.9.10: `--file-info` gave `"inferredParser":"html"` for `ng/card.html` and `"angular"` for `ng/card.component.html`; the same one-line `@if … @else` template was reformatted only as `card.component.html`, and `prettier --check` passed `card.html` unchanged.

## [JSTOOL-012] oxfmt: a beta Prettier-compatible formatter
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Oxc blog: Oxfmt beta](https://oxc.rs/blog/2026-02-24-oxfmt-beta), [Oxfmt formatter guide](https://oxc.rs/docs/guide/usage/formatter), [Migrate from Prettier](https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier)
- Related: JSTOOL-011, JSTOOL-006, JSTOOL-009

Oxfmt, the Oxc project's formatter, "has reached beta" on 2026-02-24; `oxfmt` 0.73.0 is `latest` (2026-10-13), still below 1.0. It "is compatible with Prettier v3.9.9 for many configurations", "aims to match Prettier's output", treats "Unexpected differences" as bugs, and is tested against Prettier's own suite. Speed claims disagree between pages: "more than 30× faster than Prettier and 3× faster than Biome" (beta post) against "approximately 30x faster than Prettier and 2x faster than Biome" (current guide).

Differences that bite on a switch:
- "Default `printWidth` is 100 (Prettier uses 80)". Set it explicitly, or `oxfmt --migrate prettier` to convert the config.
- "Prettier plugins are not supported"; import sorting, Tailwind class sorting and `package.json` sorting are built in.
- Not supported: the `prettier` key in `package.json`, nested `.editorconfig`, `experimentalTernaries`.
- JS, TS, JSON, CSS, YAML, Markdown and GraphQL are formatted natively; HTML, Angular (`*.component.html`), Vue and Svelte go through a bundled Prettier.

Nest 12's template uses Prettier, not oxfmt. For our repos the gain over Prettier is seconds; wait for 1.0.

## [JSTOOL-013] knip 6: unused files, exports and dependencies
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Knip v6 announcement](https://knip.dev/blog/knip-v6) ([raw](https://raw.githubusercontent.com/webpro-nl/knip/main/packages/docs/src/content/docs/blog/knip-v6.mdx)), [CLI](https://knip.dev/reference/cli), [Reporters](https://knip.dev/features/reporters), [Auto-fix](https://knip.dev/features/auto-fix), [FAQ](https://knip.dev/reference/faq), [Angular plugin source](https://github.com/webpro-nl/knip/tree/main/packages/knip/src/plugins/angular)
- Related: JSTOOL-020, JSUP-009, TOK-109

knip finds unused files, exports, types, enum members and dependencies, and dependencies used but not listed. v6.0.0 (2026-03-20) swapped the TypeScript backend for `oxc-parser` and `oxc-resolver` ("all boosts are in the **2-4x** range"); `latest` 6.41.0 (2026-10-09). v6 breaks: Node 20.19.0+, the `classMembers` issue type dropped, `--include-libs` and `--isolate-workspaces` became the only behaviour, `--experimental-tags` became `--tags`, and JSON reporter issues are always arrays.

- **Plugins** read tool configs: `angular.json` (builders, `main`, `polyfills`, tsconfigs), `nest-cli.json`, Vite, Vitest, ESLint, Oxlint and more. A config under an unexpected name needs pointing, e.g. `"vitest": { "config": ["vitest-base.config.ts"] }` for Angular's `runnerConfig`.
- **Modes**: `--production` drops tests, configs and devDependencies; `--strict` also isolates workspaces.
- **Fix**: `--fix` removes `export` keywords and unused dependencies; deleting files needs `--allow-remove-files`. "Running `knip --fix` before your configuration is fully settled is dangerous."
- **False positives**: resolve configuration hints first; `ignore` "only suppresses the reporting".
- **Output**: `--reporter compact` or `json` (one line, "for scripts, CI, and tools (including coding agents)"), `--no-progress` (automatic in CI). Exit 0 clean, 1 issues, 2 "bad input, a plugin config load error or an internal error".

Tested 2026-10-17, knip@6.41.0 on osrs-tracker-web: 0.73 s; it flagged only the extra config file this test added (exit 1).

## [JSTOOL-014] Vite 8: Rolldown, Oxc and Lightning CSS replace esbuild and Rollup
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Announcing Vite 8](https://vite.dev/blog/announcing-vite8) ([raw](https://raw.githubusercontent.com/vitejs/vite/main/docs/blog/announcing-vite8.md)), [Migration from v7](https://vite.dev/guide/migration) ([raw](https://raw.githubusercontent.com/vitejs/vite/main/docs/guide/migration.md))
- Related: JSTEST-008, JSTOOL-015, JSTOOL-016, JSTOOL-021, CSS-016

Vite 8.0.0 (2026-03-12; `latest` 8.3.4 on 2026-10-08) "ships with Rolldown as its single, unified, Rust-based bundler". Rolldown is "10-30x faster than Rollup" in Rolldown's benchmarks; Linear reported "Production build times dropped from 46s to 6s". "Vite 8 requires Node.js 20.19+, 22.12+, the same requirements as Vite 7."

What changes for a config:
- **Transforms and minify**: "Oxc is now used for JavaScript transformation instead of esbuild", and the Oxc minifier for JS. The `esbuild` option is deprecated and converted to `oxc`; Oxc can't lower native decorators (use a Babel or SWC plugin) or mangle properties. Decorator metadata: JSTEST-008.
- **CSS**: "Lightning CSS is now used for CSS minification by default" (`build.cssMinify: 'esbuild'` to go back).
- **Renames**: "`build.rollupOptions`: renamed to `build.rolldownOptions`" (and `worker.rollupOptions`), `optimizeDeps.esbuildOptions` to `rolldownOptions`; a compatibility layer converts the old names. `build.commonjsOptions` is a no-op; object-form `manualChunks` is gone; `system` and `amd` output are unsupported.
- **esbuild** "is no longer directly used by Vite and is now an optional dependency": install it if a plugin calls `transformWithEsbuild`.
- **Default `build.target`**: Chrome and Edge 111, Firefox 114, Safari 16.4 (Baseline widely available on 2026-01-01).
- About 15 MB larger than Vite 7.

`rolldown-vite` is deprecated: "Use this package to migrate from Vite 7 to Vite 8" (`npm view rolldown-vite deprecated`).

## [JSTOOL-015] Rolldown 1.0 and tsdown; tsup unmaintained
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Rolldown README](https://raw.githubusercontent.com/rolldown/rolldown/main/README.md), [Rolldown: introduction](https://rolldown.rs/guide/introduction), [Rolldown v1.0.0 release](https://github.com/rolldown/rolldown/releases/tag/v1.0.0), [tsdown](https://tsdown.dev/guide/) ([raw README](https://raw.githubusercontent.com/rolldown/tsdown/main/README.md)), [tsup README](https://raw.githubusercontent.com/egoist/tsup/main/README.md), [tsup v9.0.0 release](https://github.com/egoist/tsup/releases/tag/v9.0.0)
- Related: JSTOOL-014, JSTOOL-016, JSTOOL-021, NPM-015

**Rolldown** is "a JavaScript/TypeScript bundler written in Rust intended to serve as the future bundler used in Vite. It provides Rollup-compatible APIs and plugin interface, but will be more similar to esbuild in scope." 1.0.0 was released 2026-05-07; `latest` 1.2.14 (2026-10-14). "It can serve as a drop-in replacement for Rollup in most cases". Its own advice: "For most applications, using Rolldown through Vite is the recommended approach... For library bundling, check out tsdown."

**tsdown** ("The elegant bundler for libraries powered by Rolldown", "an **official project of Rolldown**") builds ESM, CJS, IIFE and UMD with `.d.ts` files and is "Compatible with tsup's main options and features". Still 0.x: 0.23.1 (2026-10-10), `engines.node` `^22.18.0 || ^24.11.0 || >=26.0.0`, optional peer `typescript ^5.0.0 || ^6.0.0 || ^7.0.0` (the only build tool in TS-009's table that accepts 7). tsup's renamed options "fail type checking and are silently ignored at runtime" in tsdown: read the migration table.

**tsup**'s README: "This project is not actively maintained anymore. Please consider using tsdown instead." It still shipped 9.0.0 on 2026-10-14 (drops Node below 22.18). For a new library, use tsdown; check its output with publint and attw (NPM-015).

## [JSTOOL-016] esbuild 0.x: minor versions break, and it never type-checks
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [esbuild CHANGELOG](https://raw.githubusercontent.com/evanw/esbuild/main/CHANGELOG.md), [esbuild CHANGELOG-2025](https://raw.githubusercontent.com/evanw/esbuild/main/CHANGELOG-2025.md), [esbuild: TypeScript caveats](https://esbuild.github.io/content-types/#typescript-caveats), [esbuild API: log level and metafile](https://esbuild.github.io/api/)
- Related: JSTEST-008, JSTOOL-014, JSTOOL-017, NPM-006

esbuild is still 0.x: `latest` 0.28.2 (2026-08-08); 0.27.0 (2025-11-09) and 0.28.0 (2026-04-02) were breaking. Its rule, from 0.27.0: "**This release deliberately contains backwards-incompatible changes.** To avoid automatically picking up releases like this, you should either be pinning the exact version of `esbuild` … or be using a version range syntax that only accepts patch upgrades such as `^0.26.0` or `~0.26.0`." (On 0.x, `^` accepts only patches.) Vite 8 peers `esbuild ^0.27.0 || ^0.28.0`; `@angular/build` 22.2.3 pins `0.28.2`.

TypeScript limits: "esbuild does not do any type checking so you will still need to run tsc -noEmit in parallel with esbuild to check types", and "The emitDecoratorMetadata TypeScript configuration option is not supported" (why NestJS doesn't build with it, JSTEST-008).

For agents: `--log-level=warning` (or `error`, `silent`; the CLI default `info` prints an output summary), colour only "if stderr is a TTY session", and `--metafile=meta.json` for JSON build metadata. esbuild has an install script that npm 12 blocks unless approved (NPM-006).

## [JSTOOL-017] Angular 22's build: esbuild, Vite for the dev server, Rolldown for chunks
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [angular.dev: build system migration](https://angular.dev/tools/cli/build-system-migration) ([raw](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/tools/cli/build-system-migration.md)), [angular-cli CHANGELOG](https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md), [`@angular/build` environment-options.ts](https://github.com/angular/angular-cli/blob/main/packages/angular/build/src/utils/environment-options.ts), [angular-cli commit 585d08af8](https://github.com/angular/angular-cli/commit/585d08af881a35653dc5e7b1ee7a75b42e154517)
- Related: CSS-016, NG-002, JSTOOL-014, JSTOOL-020

The `@angular/build:application` builder bundles with esbuild ("The underlying bundler (`esbuild`)"); `@angular/build` 22.2.3 depends on `esbuild 0.28.2`, `vite 8.3.0`, `rolldown 1.2.8` and `oxc-parser 0.150.0`.
- **Vite**: "within a _development server capacity only_": `ng serve` hands the in-memory build to Vite.
- **Rolldown**: runs the chunk-optimization pass, on by default "with heuristics" since 22.0.0 (2026-06-03) and on Rolldown instead of Rollup since 22.1.0 (2026-07-29). `NG_BUILD_OPTIMIZE_CHUNKS`: "`false` or `0` disables the feature. `true` or `1` forces the feature on (threshold 0). A number sets the specific threshold. Default is 3" (lazy chunks). `NG_BUILD_CHUNKS_ROLLDOWN=false` goes back to Rollup, if installed.
- **oxc-parser** replaced Babel in the optimization plugins and i18n inliner (22.1.0) and the Angular linker (22.2.0, 2026-09-23).
- **webpack**: "The existing webpack-based build system and `browser` builder are deprecated"; `@angular-devkit/build-angular` 22.2.3 still ships webpack 5.111.0 for it.

Angular doesn't build through Vite, so Vite 8's config changes (JSTOOL-014) don't apply to `ng build`. CSS targets: CSS-016.

Tested 2026-10-17, `@angular/build` 22.2.2 (osrs-tracker-web lockfile), Node 24.21.0: `ng build` (production) took 12.4 s and exited 0 with a budget warning.

## [JSTOOL-018] NestJS 12's `nest build`: tsc by default, rspack new, webpack deprecated
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [nest-cli 12.0.0 release](https://github.com/nestjs/nest-cli/releases/tag/12.0.0), [nest-cli `build.command.ts`](https://github.com/nestjs/nest-cli/blob/master/commands/build.command.ts), [nest-cli `rspack-defaults.ts`](https://github.com/nestjs/nest-cli/blob/master/lib/compiler/defaults/rspack-defaults.ts), [Nest docs: SWC recipe](https://docs.nestjs.com/recipes/swc), [Nest docs: migration guide](https://docs.nestjs.com/migration-guide), [nestjs/schematics 12.0.7 `nest-cli.json`](https://github.com/nestjs/schematics/blob/12.0.7/src/lib/application/files/ts/nest-cli.json)
- Related: JSTEST-007, JSTEST-008, JSTOOL-016, JSTOOL-019, TS-009, DOCKER-005

`nest build -b` takes "(tsc, webpack, swc, rspack)"; the default is `tsc` (`lib/configuration/defaults.ts`). `@nestjs/cli` 12.0.0 (2026-08-27):
- "the CLI **no longer bundles webpack**: every bundler-related package is an optional peer dependency now". "If you build with `tsc` (the default) or with SWC, nothing changes."
- **rspack** is new: `@rspack/core` "^1.7.7 || ^2.1.10" as an optional peer, `--builder rspack`, `--rspackPath`. The migration guide: "Rspack is now the default bundler for monorepos", and webpack's flags and options "are deprecated in favor of `--builder rspack`".
- `--silent` "suppresses informational compiler logs".

Type checking:
- **swc** doesn't type-check; `--type-check` runs `tsc` in `noEmit` mode alongside, and works only with swc.
- **rspack** adds `fork-ts-checker-webpack-plugin` if it can `require` it; otherwise `// fork-ts-checker-webpack-plugin not available, skip`, with no warning. It also skips the checker when a Nest CLI plugin is registered. A repo that relies on the build as its type check should fail when the plugin is missing, as osrs-tracker-api's `rspack.config.js` does.

Conflict: the 12.0.0 notes say rspack "is the builder that `nest new` scaffolds into `nest-cli.json` for new projects", but schematics 12.0.7's `nest-cli.json` has no `builder` key, so a new single app builds with `tsc`. Trust the template.

## [JSTOOL-019] Rspack 2 and Rsbuild 2
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Announcing Rspack 2.0](https://rspack.rs/blog/announcing-2-0) ([raw](https://raw.githubusercontent.com/web-infra-dev/rspack/main/website/docs/en/blog/announcing-2-0.mdx)), [Announcing Rsbuild 2.0](https://rsbuild.rs/blog/v2-0) ([raw](https://raw.githubusercontent.com/web-infra-dev/rsbuild/main/website/docs/en/blog/v2-0.mdx)), [Rspack CLI](https://rspack.rs/api/cli)
- Related: JSTOOL-018, JSTOOL-021, JSTOOL-020

Rspack is a Rust bundler with webpack's API and loaders; Rsbuild is the build tool on top of it. Both 2.0.0 shipped 2026-04-22; `latest` on 2026-10-17: `@rspack/core` 2.2.9, `@rsbuild/core` 2.2.13; both need Node `^20.19.0 || >=22.12.0`.

Rspack 2.0: "while remaining compatible with the webpack ecosystem, Rspack will gradually introduce defaults, API design, and build outputs that are better aligned with modern JavaScript development"; "improves overall performance by around 10%" over 1.7; "core packages are now published as pure ESM packages, and their CommonJS builds have been removed".

Rsbuild 2.0 "has become the preferred build tool for new Rspack projects". Changed defaults: `server.host` is `localhost`, not `0.0.0.0`; web output targets `baseline widely available on 2025-05-01`; "For Node.js output, Rsbuild 2.0 now generates unminified ES modules by default instead of the minified CommonJS output"; "`AGENTS.md` is now generated by default" by `create-rsbuild`.

Where it fits: moving a webpack app off webpack (the reason Nest adopted it, JSTOOL-018). Angular support is Nx's community "Angular Rspack", not Angular's; the Angular CLI's esbuild builder is the supported path (JSTOOL-017). `rspack build --json [path]` writes stats JSON; Rsbuild has `--log-level`.

## [JSTOOL-020] Short, machine-readable output from lint and build tools
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [ESLint CLI](https://eslint.org/docs/latest/use/command-line-interface), [Oxlint output formats](https://oxc.rs/docs/guide/usage/linter/output-formats), [Biome CLI](https://biomejs.dev/reference/cli/), [Prettier CLI](https://prettier.io/docs/cli), [knip reporters](https://knip.dev/features/reporters), [Vite CLI](https://vite.dev/guide/cli), [`@angular/build` environment-options.ts](https://github.com/angular/angular-cli/blob/main/packages/angular/build/src/utils/environment-options.ts), [esbuild API](https://esbuild.github.io/api/), [TSConfig: pretty](https://www.typescriptlang.org/tsconfig/#pretty)
- Related: TOK-108, TOK-109, JSTOOL-002, JSTOOL-008, HOOK-027

What to pass so a run fits TOK-109's contract (one line on success, capped `file:line` on failure):

| Tool | Compact | Machine-readable | Note |
|---|---|---|---|
| ESLint 10 | `--quiet` (stylish) | `-f json` | No compact formatter in core; exit 2 is a config error |
| Oxlint | `-f agent` (automatic under Claude Code) | `-f json` | Warnings exit 0 without `--deny-warnings` |
| Biome | `--reporter=concise` | `--reporter=json` (experimental) | `--max-diagnostics` caps the count |
| Prettier | `--check --log-level warn` | — | Exit 1 unformatted, 2 error |
| knip | `--reporter compact --no-progress` | `--reporter json` | Exit 2 on a plugin load error |
| `tsc` | `--pretty false` | — | No colour or code frame |
| `ng build` | `--no-progress` | `NG_BUILD_LOGS_JSON=1` | Warnings in the JSON keep ANSI colour codes |
| Vite | `--logLevel warn --clearScreen false` | — | `build.reportCompressedSize: false` skips gzip sizes |
| esbuild | `--log-level=warning` | `--metafile=meta.json` | |
| Nest CLI | `nest build --silent` | — | |

`@angular/build` has an `isTTY()` check that is false when stdout isn't a TTY or `CI` is set; which output it gates wasn't traced.

Tested 2026-10-17, Claude Code 2.1.299 Bash tool, `@angular/build` 22.2.2 on osrs-tracker-web: `ng build` printed 6,104 characters (a 64-row chunk table), `--no-progress` 6,064, and `NG_BUILD_LOGS_JSON=1` 914 (`errors`, `warnings`, `outputPaths`), all exit 0. ESLint 10.13.0's stylish output carried no colour codes off a TTY.

## [JSTOOL-021] Picking a build tool: Angular, Nest, apps, libraries and scripts
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-23
- Sources: [Rolldown: getting started](https://rolldown.rs/guide/getting-started), [angular.dev: build system migration](https://angular.dev/tools/cli/build-system-migration), [Nest docs: SWC recipe](https://docs.nestjs.com/recipes/swc), [Announcing Rsbuild 2.0](https://rsbuild.rs/blog/v2-0), [esbuild: TypeScript caveats](https://esbuild.github.io/content-types/#typescript-caveats)
- Related: JSTOOL-014, JSTOOL-015, JSTOOL-016, JSTOOL-017, JSTOOL-018, JSTOOL-019, NODE-003, DOCKER-005

| Job | Pick | Why |
|---|---|---|
| Angular app | The Angular CLI's `application` builder | esbuild, Vite and Rolldown are wired in for you; the webpack builder is deprecated (JSTOOL-017) |
| NestJS single app | `nest build` with `tsc` | The default; nothing to bundle for a Node server unless the image ships `dist/` only |
| NestJS app shipped as one bundle, or a monorepo | `-b rspack` with `fork-ts-checker-webpack-plugin` | Replaces webpack; type-checks only with the plugin (JSTOOL-018) |
| Faster Nest compile in dev | `-b swc --type-check` | swc alone doesn't type-check |
| SPA or framework app outside Angular | Vite 8 | Rolldown and Oxc built in (JSTOOL-014) |
| Library on npm | tsdown | Rolldown's library bundler; tsup is unmaintained (JSTOOL-015) |
| Large webpack app | Rspack or Rsbuild 2 | webpack-compatible (JSTOOL-019) |
| Script or small tool | `node file.ts` or esbuild | Node strips types (NODE-003); pin esbuild exactly (JSTOOL-016) |

Every one of them except `tsc` and the Angular compiler strips types without checking them: keep `tsc --noEmit` (or a type-checking build) in the verify command.

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-17 against `main` of osrs-tracker-web, osrs-tracker-api and freek-mencke-web.

1. Done 2026-10-18: both Angular apps run typed `no-floating-promises` and `no-misused-promises` with `projectService`, in a `defineConfig` config (osrs-tracker/osrs-tracker-web#356, FreekMencke/freek-mencke-web#21; JSTOOL-003, JSTOOL-004, JSTOOL-005).
2. **Keep the Prettier `overrides` for Angular templates in osrs-tracker-web** (JSTOOL-011): without it, its suffix-less `*.html` templates would be formatted as plain HTML. freek-mencke-web has only inline templates and `index.html`, so it needs none.
3. **Keep osrs-tracker-api's guard in `rspack.config.js`** that throws when `fork-ts-checker-webpack-plugin` is missing (JSTOOL-018): the Nest CLI would skip the type check silently.
4. **Won't do now: move to Oxlint or Biome** (JSTOOL-010). The Angular apps need angular-eslint's template rules; osrs-tracker-api's custom `no-restricted-syntax` selectors and typed rules run in seconds on ESLint. Revisit for the API if typescript-eslint still lacks TypeScript 7 when the API moves to it (JSTOOL-007).
5. **Won't do now: oxfmt** (JSTOOL-012): beta, a different `printWidth` default, and no gain worth a reformat at our size.

## Open questions

- **Which environment variables switch Oxlint to its agent format, and from which version** (JSTOOL-008)? Tested only `CLAUDECODE` and `AI_AGENT` on 1.88.0; the docs don't mention it, and oxc#25300 (open) would document it.
- **tsgolint's "TypeScript 7.0+ is required"** (JSTOOL-007): it ran on a TypeScript 6.0.3 project here; whether a 6.0-only tsconfig option breaks it wasn't tested.
- **angular-eslint configs under `defineConfig`** (JSTOOL-005): not tested with `processor` and the `extends` arrays; angular-eslint's docs still show `tseslint.config`.
- **Biome's 2.1 to 2.5 changes**: no root CHANGELOG found in biomejs/biome (`CHANGELOG.md` at the root returned 404); release notes not read.
- **Where the Nest CLI makes rspack the monorepo default**, and the template conflict (JSTOOL-018): not found in nest-cli's source.
- **Prettier 4.0**: no release plan found beyond the alpha on `next` (checked the CHANGELOG and npm dist-tags).
- **Which Angular build steps still use Babel**: `@angular/build` 22.2.3 still depends on `@babel/core` 8.0.5 after the oxc-parser moves (JSTOOL-017).
