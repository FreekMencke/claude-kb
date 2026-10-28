# npm 12, packages and publishing

Prefix `NPM`. This file covers the npm CLI and registry on 2026-10-17: what npm 11 and 12 changed, the install-script policy (`allowScripts`), how to approve scripts and what it does to a global npm install of Claude Code, tokens, trusted and staged publishing, provenance and `npm audit`, publishing ESM-only or dual packages, and the install-side traps (lockfiles, `npm ci`, overrides, peer dependencies, cross-platform optional dependencies), plus one npm-against-pnpm comparison. Which Node ships which npm, Corepack and `require(esm)` as a runtime feature are in `kb-nodejs.md`; TypeScript's own peer-range traps in `kb-typescript.md`; the publish workflow's GitHub Actions side (permissions, `id-token: write`, pinning, the TanStack case) in `kb-github-actions.md`; Dependabot and the upgrade procedure in `kb-js-upgrades.md`.

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#172, part of roadmap #167) by an Opus 5.5 lead with three Sonnet 5.5 readers and one Sonnet 5.5 refuter.
- Versions and dates come from the npm registry (`npm view npm dist-tags --json`, `npm view npm 'time[12.2.0]'` for one version's date, `npm view <pkg> scripts`; the whole `time` field is about 27k characters for npm, JSUP-001), the raw npm CLI CHANGELOG on the `latest` and `release/v11` branches, the npm docs' Markdown source (github.com/npm/documentation, `main`, which builds docs.npmjs.com), the GitHub changelog's supply-chain-security feed, and the raw Node.js `doc/api/*.md` and changelogs.
- Behaviour was tested on WSL2 with Node 24.21.0, its bundled npm 11.19.0, and the official `npm@12.2.0` installed into a scratch folder with `--ignore-scripts`. Install-script tests used a local package of our own whose `postinstall` writes a marker file; `esbuild@0.28.2` was installed with `--ignore-scripts` to read its key format and run its API. No other community package was run.
- Our repos' setup was read on 2026-10-17 from `main` of osrs-tracker-web, osrs-tracker-api, osrs-tracker-aws, freek-mencke-web, claude-skills and this repo.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which npm is current, and does my Node ship npm 12? | `latest` is 12.2.0 (2026-09-30); 12.2.1 is tagged `next-12`. No Node line bundles npm 12 (Node 24.22.0 has 11.19.1); install it with `npm install -g npm@12.2.0`. It needs Node `^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0`. | NPM-001 |
| What did npm 12 change? | Dependency install scripts blocked unless allowed by `allowScripts`; git and remote-URL dependencies off (`allow-git`, `allow-remote` = `none`); unknown CLI flags error; `npm adduser`, `npm shrinkwrap` and stars removed; `npm view --json` always an array. | NPM-002 |
| Why did esbuild's (or another package's) install script stop running? | npm 12 skips dependency `preinstall`/`install`/`postinstall` and implicit node-gyp builds not covered by the root `allowScripts`, with a warning and exit 0. A version-pinned approval also stops matching after a bump. | NPM-004, NPM-007 |
| Is it `npm approve-scripts` or `npm install-scripts approve`? | `npm install-scripts approve <pkg>` (also `deny`, `ls`, `prune`) since 12.0.0 and 11.18.0; `approve-scripts` and `deny-scripts` remain as aliases. Then `npm rebuild` runs the newly approved scripts. | NPM-005 |
| Which packages need an approval? | On 2026-10-17: esbuild, @parcel/watcher, lmdb, msgpackr-extract, unrs-resolver, @swc/core, puppeteer, cypress, bcrypt, canvas, nx and others; sharp has none since 0.35.0. `npm install -g @anthropic-ai/claude-code` on npm 12 leaves a `claude` that doesn't run: add `--allow-scripts=@anthropic-ai/claude-code`, or use the native installer. | NPM-006, NPM-021 |
| Why does my npm token fail, and which tokens exist? | Classic tokens were revoked on 2025-12-09. Now: two-hour session tokens from `npm login`, and granular tokens (read-only, read-write, or read-write stage-only; write tokens at most 90 days). Bypass-2FA tokens lose direct publish around January 2027. | NPM-008 |
| How should CI install and publish? | Install with no token (public deps) or a read-only granular token. Publish with trusted publishing (OIDC), stage-only, approved by a maintainer with 2FA; then set the package to disallow tokens. A stage-only token is the fallback. | NPM-011, NPM-009, NPM-010 |
| What does trusted publishing require on the npm side? | npm 11.5.1+, Node 22.14.0+, a GitHub-hosted (or GitLab.com, CircleCI cloud) runner, a config naming owner, repo, workflow file and optional environment, a first publish within 2 days, and `repository.url` matching the repo. | NPM-009 |
| What does provenance prove? | Which public repo, commit and workflow run built the tarball, signed through Sigstore. Not that the code is safe: TanStack's 84 malicious versions (2026-05-11) were published through its trusted-publisher binding. | NPM-012 |
| Is `npm audit` worth running in CI? | As a non-blocking report, or gated with `--audit-level=high --omit=dev`; it knows only published advisories and flags build-tool trees heavily. `npm audit signatures` checks registry signatures and provenance, and doesn't fail on missing provenance. | NPM-013, NPM-012 |
| Should a new library ship ESM-only? | Yes, if consumers run Node 22.12+ or a bundler: every supported Node line loads it with `require()`. Node's own 22.10.0 notes say to drop CJS exports "when all active Node.js LTS lines support `require(esm)`", true since Node 20's end on 2026-04-30. | NPM-014, NPM-015 |
| `npm ci` fails on CI but `npm install` works locally. Why? | `ci` never rewrites the lock and fails on any mismatch: `package.json` or `overrides` edited without `npm install`, a lock made with `--legacy-peer-deps` but not `ci`, platform packages missing from a lock made on another OS (fixed in npm 11.3.0; regenerate it), or an npm lock-generation bug. | NPM-016, NPM-017 |
| How do I force a transitive dependency's version? | `overrides` in the root `package.json`, then `npm install` and commit the lock. npm 12's `packageExtensions` adds missing dependency metadata; `npm patch` changes a dependency's files. | NPM-018 |
| `npm install` stops with ERESOLVE: use `--legacy-peer-deps` or `--force`? | Neither as a habit. Fix the version that breaks the peer range; both flags install a tree the tools may not run on. `--legacy-peer-deps` ignores peer dependencies entirely; `--force` accepts the conflict at the root. | NPM-019 |
| Should we switch to pnpm? | Not for a few small repos now. npm 12 closed most of the security gap (pnpm 11 blocks build scripts and delays fresh releases by default); pnpm still wins on disk use across worktrees and has catalogs, but Dependabot lists pnpm only up to v10. | NPM-020 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| NPM-001 | npm versions on 2026-10-17, and getting npm 12 | fact | versions, dist-tags, npm-12, node |
| NPM-002 | What npm 12.0.0 changed | fact | npm-12, breaking-changes, allow-git, allow-remote |
| NPM-003 | What npm 11 changed, and what the 11.x line backported | fact | npm-11, breaking-changes, backports |
| NPM-004 | The `allowScripts` policy: what's blocked and how entries match | fact | allowScripts, install-scripts, supply-chain, node-gyp |
| NPM-005 | Approving install scripts: `npm install-scripts`, and the `approve-scripts` alias | fact | allowScripts, install-scripts, approve-scripts, commands |
| NPM-006 | Common packages with install scripts, and what blocking them costs | fact | allowScripts, esbuild, sharp, native-addons |
| NPM-007 | Version-pinned approvals stop matching after a bump | anti-pattern | allowScripts, dependabot, upgrades |
| NPM-008 | npm tokens since 2025-12-09: session and granular | fact | tokens, granular-tokens, 2fa, authentication |
| NPM-009 | Trusted publishing: what the registry requires | fact | trusted-publishing, oidc, publishing, npm-trust |
| NPM-010 | Staged publishing, stage-only tokens and publish-time scanning | fact | staged-publishing, stage-only-tokens, malware-scanning |
| NPM-011 | What CI should use to install and to publish | recommendation | ci, tokens, trusted-publishing, publishing |
| NPM-012 | Provenance: what it proves, and `npm audit signatures` | fact | provenance, sigstore, audit-signatures, supply-chain |
| NPM-013 | `npm audit` in CI: what it checks and how to gate it | recommendation | npm-audit, vulnerabilities, ci |
| NPM-014 | Ship new packages ESM-only | recommendation | esm, require-esm, packaging, exports |
| NPM-015 | `exports` with types for ESM-only and dual packages, and how to check them | pattern | exports, types, dual-package, publint, attw |
| NPM-016 | `npm ci` vs `npm install`, and lockfile v3 | fact | npm-ci, lockfile, package-lock |
| NPM-017 | Optional platform packages missing from a lockfile made on another OS | anti-pattern | optional-dependencies, lockfile, cross-platform, native-binaries |
| NPM-018 | `overrides`, `packageExtensions` and `npm patch` | fact | overrides, packageExtensions, npm-patch, transitive-dependencies |
| NPM-019 | Peer dependency conflicts: ERESOLVE, `--legacy-peer-deps` and `--force` | fact | peer-dependencies, eresolve, legacy-peer-deps |
| NPM-020 | npm 12 or pnpm for a handful of small repos | comparison | pnpm, package-managers, worktrees |
| NPM-021 | Installing Claude Code with npm 12: allow its postinstall | fact | claude-code, install, allowScripts, global-install |

## [NPM-001] npm versions on 2026-10-17, and getting npm 12
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: npm registry (`npm view npm dist-tags --json`, `npm view npm@12.2.0 'time[12.2.0]' engines.node`, 2026-10-17), [npm CLI CHANGELOG (latest)](https://raw.githubusercontent.com/npm/cli/latest/CHANGELOG.md), [npm CLI CHANGELOG (release/v11)](https://raw.githubusercontent.com/npm/cli/release/v11/CHANGELOG.md), [nodejs/Release#1161](https://github.com/nodejs/Release/issues/1161), [nodejs/node#66212](https://github.com/nodejs/node/pull/66212), [Node release schedule](https://raw.githubusercontent.com/nodejs/Release/main/schedule.json)
- Related: NPM-002, NPM-003

On 2026-10-17 `npm view npm dist-tags` gives `latest` 12.2.0 (published 2026-09-30) and `next-12` 12.2.1 (published 2026-10-15; its CHANGELOG heading says 2026-10-14). So the CHANGELOG's top entry isn't what `npm install -g npm` installs: read the dist-tags. npm 11 is maintained alongside: `next-11` is 11.21.1, and the 11.x line gets backports (NPM-003).

npm 12.0.0 was published 2026-07-08. Its engines: "`npm` now supports node `^22.22.2 || ^24.15.0 || >=26.0.0`".

No Node release bundles it: on 2026-08-13 a Release WG member wrote "The Release WG has decided not to land npm 12 on Node.js 26, 24 or 22" (`kb-nodejs.md`, NODE-015). npm 12.1.0 was merged into nodejs/node `main` on 2026-09-24, and the Node 27 nightlies of 2026-10-15 to 10-17 bundle it (nightly `index.json`), so it is expected in Node 27, whose Alpha starts 2026-10-28 per `schedule.json`; not yet released, so check then.

Getting it now:
- Locally: `npm install -g npm@12.2.0`, or one command with `npx npm@12.2.0 <cmd>`.
- In CI: an explicit install step after setting up Node (the workflow side is in `kb-github-actions.md`).
- Check with `npm --version`; on Node 24.22.0 the bundled npm is 11.19.1.

## [NPM-002] What npm 12.0.0 changed
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm CLI CHANGELOG 12.0.0](https://raw.githubusercontent.com/npm/cli/latest/CHANGELOG.md), [Upcoming breaking changes for npm v12 (GitHub changelog, 2026-06-09)](https://github.blog/changelog/2026-06-09-upcoming-breaking-changes-for-npm-v12), [npm install-time security and GAT bypass2fa deprecation (2026-07-08)](https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation), [npm config docs v12](https://docs.npmjs.com/cli/v12/using-npm/config)
- Related: NPM-001, NPM-003, NPM-004

npm 12.0.0 (2026-07-08) is a security release: each change turns something `npm install` did automatically into an opt-in.
- **Install scripts:** "Dependency lifecycle scripts are now blocked by default unless allowed by the root package's `allowScripts` policy" (NPM-004).
- **Git and URL dependencies:** "allow-git and allow-remote now default to "none"; set them to "all" (or "root")". Tarballs on the registry's own host still install. `allow-file` and `allow-directory` stay `all`.
- **Flags:** "unknown CLI flags, abbreviated flags, and single-hyphen multi-char shorthands now throw instead of warning". Unknown `.npmrc` keys still only warn unless `strict-npmrc` is set (the erroring was reverted before release).
- **Removed:** `npm adduser` (use `npm login`), `npm shrinkwrap` and any `npm-shrinkwrap.json` ("Rename project-root `npm-shrinkwrap.json` to `package-lock.json`"), `star`/`stars`/`unstar`.
- **Output:** "npm view --json now always returns an array"; `npm pkg` no longer forces JSON; `npm pack --json` and `npm publish --json` share one new format.
- **Other:** root `preinstall` runs before dependencies are installed; `npm init` leaves `license` out (was "ISC"); no man pages registered globally; npm no longer resolves `node` through `PATH`.

Tested 2026-10-17, npm 12.2.0, Node 24.21.0, WSL2: `npm install github:npm/ini` failed with `EALLOWGIT` ("Fetching packages of type "git" have been disabled"); `npm adduser` and `npm shrinkwrap` printed `Unknown command`; `--no-such-flag` gave `EUNKNOWNCONFIG`; `--ignore-scr` gave `Invalid abbreviated flag`; `npm view npm@12.2.0 version --json` printed `["12.2.0"]`.

## [NPM-003] What npm 11 changed, and what the 11.x line backported
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm CLI CHANGELOG (latest)](https://raw.githubusercontent.com/npm/cli/latest/CHANGELOG.md), [npm CLI CHANGELOG (release/v11)](https://raw.githubusercontent.com/npm/cli/release/v11/CHANGELOG.md), [Staged publishing and new install-time controls for npm (2026-05-22)](https://github.blog/changelog/2026-05-22-staged-publishing-and-new-install-time-controls-for-npm), [npm bulk trusted publishing config and script security (2026-02-18)](https://github.blog/changelog/2026-02-18-npm-bulk-trusted-publishing-config-and-script-security-now-generally-available)
- Related: NPM-001, NPM-002, NPM-005

npm 11.0.0 (2024-12-16) breaking changes, from its pre-release notes:
- Node `^20.17.0 || >=22.9.0`.
- "When publishing a package with a pre-release version, you must explicitly specify a tag", and a publish lower than the current `latest` no longer takes the `latest` tag.
- "`--ignore-scripts` now applies to all lifecycle scripts, include `prepare`".
- No fallback to the old audit endpoint; `npm hook` removed.

What later 11.x releases added, so a Node 24 machine (bundled npm 11.19.1) already has most of npm 12's tools, with old defaults:
- 11.5.0: trusted publishing (OIDC); 11.5.1 is the documented minimum, with provenance by default for OIDC publishes.
- 11.10.0: `min-release-age`, `npm trust`, `--allow-git`.
- 11.15.0: `npm stage`; `--allow-file`, `--allow-remote`, `--allow-directory` (all default `all` on 11).
- 11.16.0: "Phase 1 of `allowScripts`": uncovered dependency scripts still run, with a warning (NPM-005).
- 11.18.0: the `npm install-scripts` commands.
- 11.20.0: stage-only granular tokens. 11.21.0: `npm dist-tag` over OIDC.

So you can prepare a repo for npm 12 on npm 11.16 or later: approve scripts, and run CI with `--strict-allow-scripts` to see what npm 12 would block.

## [NPM-004] The `allowScripts` policy: what's blocked and how entries match
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm install-scripts docs v12](https://docs.npmjs.com/cli/v12/commands/npm-install-scripts), [npm config docs v12](https://docs.npmjs.com/cli/v12/using-npm/config), [Upcoming breaking changes for npm v12 (2026-06-09)](https://github.blog/changelog/2026-06-09-upcoming-breaking-changes-for-npm-v12), [npm/rfcs RFC 54](https://github.com/npm/rfcs/blob/main/accepted/0054-make-scripts-install-opt-in.md)
- Related: NPM-005, NPM-006, NPM-007

**What's blocked.** Dependencies' `preinstall`, `install` and `postinstall`, plus "native node-gyp builds (i.e., a package with a binding.gyp and no explicit install script still gets blocked …)" and `prepare` for git, file and link dependencies. The root project's own scripts still run. A blocked script is skipped with a warning; the install exits 0.

**Where the policy lives.** The `allowScripts` field of the root `package.json`, committed (or `.npmrc`). The `allow-scripts` config is "intended for one-off and global contexts: `npm exec`, `npx`, and `npm install -g`"; "Passing `--allow-scripts` on the command line during a project-scoped `npm install`, `ci`, `update`, or `rebuild` is an error". npm's `package.json` docs don't describe the field yet; the command pages do.

**Entries.**
- `"esbuild@0.28.2": true`: approved for that version only, the default the approve command writes.
- `"esbuild": true`: any version (`--no-allow-scripts-pin`).
- `"unrs-resolver": false`: denied; "Existing `false` entries always win".
- Names match "a dependency's resolved identity, not … the package's self-reported name". A `file:` tarball dependency is keyed by its absolute path, so that entry doesn't travel between machines.

**Switches.** `strict-allow-scripts=true` fails the install on any uncovered script (`ESTRICTALLOWSCRIPTS`); denied ones stay silent. `--dangerously-allow-all-scripts` runs everything; `--ignore-scripts` overrides both.

Tested 2026-10-17, Node 24.21.0, WSL2: on npm 12.2.0 the marker package's `postinstall` didn't run (warning, exit 0); `--allow-scripts=esbuild` on a project install failed with `EALLOWSCRIPTS`. On 11.19.0, `strict-allow-scripts=true` in the user npmrc failed project, `npx` and `-g` installs of an uncovered script; an `allow-scripts=<pkg>` line there didn't trip `EALLOWSCRIPTS`.

## [NPM-005] Approving install scripts: `npm install-scripts`, and the `approve-scripts` alias
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm install-scripts docs v12](https://docs.npmjs.com/cli/v12/commands/npm-install-scripts), [npm approve-scripts docs v12](https://docs.npmjs.com/cli/v12/commands/npm-approve-scripts), [npm/cli#9629](https://github.com/npm/cli/pull/9629), [npm CLI CHANGELOG 12.0.0](https://raw.githubusercontent.com/npm/cli/latest/CHANGELOG.md), [Upcoming breaking changes for npm v12 (2026-06-09)](https://github.blog/changelog/2026-06-09-upcoming-breaking-changes-for-npm-v12)
- Related: NPM-004, NPM-007

Both names work. npm/cli#9629 (merged 2026-06-24, in 12.0.0-pre.2 and 11.18.0) moved the commands under `npm install-scripts`; "The standalone commands `npm approve-scripts` and `npm deny-scripts` are aliases for `npm install-scripts approve` and `npm install-scripts deny`". The 12.0.0 CHANGELOG and the CLI's own messages use the new names; the GitHub changelog posts of 2026-06-09 and 2026-07-08 use the old ones (`npm approve-scripts --allow-scripts-pending`).

The workflow:
1. `npm install` (or `npm ci`): blocked scripts are listed in a warning.
2. `npm install-scripts ls`: lists uncovered packages without writing anything (old form: `npm approve-scripts --allow-scripts-pending`).
3. Read what each script does, then `npm install-scripts approve esbuild lmdb` (pinned to the installed versions) or `npm install-scripts deny <pkg>`. `--all` covers every pending package.
4. `npm rebuild` runs the newly approved scripts; the next `npm ci` runs them too.
5. Commit `package.json`. `npm install-scripts prune` drops entries that no longer match an installed package.

The command is "unaware of workspaces" and fails with `EGLOBAL` under `-g`.

Tested 2026-10-17: on npm 12.2.0, `ls` and `approve-scripts --allow-scripts-pending` printed the same list; `approve esbuild` wrote `"esbuild@0.28.2": true`; a later `deny esbuild` replaced it with `"esbuild": false`; after approving the marker package, `npm rebuild` and `npm ci` ran its `postinstall`. npm 11.19.0 has the same commands; uncovered scripts ran with a warning, while a `false` entry and `--strict-allow-scripts` stopped them.

## [NPM-006] Common packages with install scripts, and what blocking them costs
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: npm registry (`npm view <pkg> version scripts gypfile --json`, 2026-10-17), [esbuild 0.28.2 `install.js`](https://unpkg.com/esbuild@0.28.2/install.js), [nodejs/Release#1161](https://github.com/nodejs/Release/issues/1161)
- Related: NPM-004, NPM-007, NPM-017, NPM-021

Latest versions on 2026-10-17 with a `preinstall`, `install` or `postinstall` script, or a `binding.gyp` npm builds:
- Build tooling: esbuild 0.28.2, @swc/core 1.16.18, @parcel/watcher 2.6.0, lmdb 3.5.7, msgpackr-extract 3.0.4 (the last two via `node-gyp-build-optional-packages`), unrs-resolver 1.12.2, nx 23.3.0, lefthook 2.2.2.
- Browsers and binaries: puppeteer 25.14.0, cypress 16.2.0, mongodb-memory-server 11.3.0, @sentry/cli 3.8.0, @anthropic-ai/claude-code 2.1.302 (NPM-021).
- Native addons: bcrypt 6.0.0, canvas 3.2.3. core-js 3.50.0 (a banner only).

None in sharp 0.35.5, playwright 1.64.1, electron 44.9.0, husky 9.1.7, vite 8.3.4, @tailwindcss/oxide 4.3.3, @biomejs/biome 2.5.15, oxlint 1.88.0, better-sqlite3 13.0.3, @angular/cli 22.2.3 or @nestjs/cli 12.0.8. sharp dropped its script in 0.35.0 (2026-06-10); 0.34.5 ran `node install/check.js || npm run build`.

What blocking costs differs per package. esbuild's `postinstall` checks the binary version, swaps the JS launcher for the native binary on non-Windows systems, and downloads the binary if the optional `@esbuild/<platform>` package is missing. With that package present, esbuild works without it. Packages that download a browser or binary at install (puppeteer, cypress) lack it until the script runs.

Tested 2026-10-17, npm 12.2.0: with `esbuild@0.28.2` installed and its script never run, `require('esbuild').transformSync()` and `esbuild --version` worked on linux-x64.

## [NPM-007] Version-pinned approvals stop matching after a bump
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm install-scripts docs v12](https://docs.npmjs.com/cli/v12/commands/npm-install-scripts), [npm config docs v12: strict-allow-scripts](https://docs.npmjs.com/cli/v12/using-npm/config), [osrs-tracker-web 7fad45e](https://github.com/osrs-tracker/osrs-tracker-web/commit/7fad45e), [dependabot-core npm_lockfile_updater.rb](https://github.com/dependabot/dependabot-core/blob/main/npm_and_yarn/lib/dependabot/npm_and_yarn/file_updater/npm_lockfile_updater.rb)
- Related: NPM-004, NPM-005, NPM-006, JSUP-014

`npm install-scripts approve` writes `pkg@version` entries, "which keep their approval narrowed to the specific version you reviewed". So a hijacked new release can't run its script unreviewed, but a dependency bump leaves the old pin behind and the new version uncovered.
npm 12 then skips its script (warning, exit 0, CI stays green); npm 11.16+ runs it and warns.

osrs-tracker-web hit this: commit 7fad45e (2026-10-10) re-approved esbuild, lmdb and @parcel/watcher because "The allowScripts pins still named the versions before the last dependency bump". Its "npm ci skipped their install scripts" describes npm 12: tested on 11.19.0 with a non-matching pin present, the script ran, with the warning "not yet covered by allowScripts".

What to do:
- In the bump's PR, run `npm install-scripts ls`, then `npm install-scripts approve <pkg>`: "if you re-approve a package whose installed version has changed, the existing pin is rewritten to track the new installed version". Finish with `npm install-scripts prune`.
- To make a stale pin fail loudly, run CI with `--strict-allow-scripts` (npm 11.16+ too): any uncovered script fails the install instead of being skipped.
- Name-only approvals (`--no-allow-scripts-pin`) give up that protection; use them only where re-reviewing each release isn't worth it.

Dependabot won't do the re-approval: dependabot-core runs every npm install with `--ignore-scripts`, which overrides `strict-allow-scripts`, and its npm updater never mentions `allowScripts` (code read 2026-10-17; an absence, not a documented statement). Triaging its PRs: JSUP-014.

## [NPM-008] npm tokens since 2025-12-09: session and granular
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [About access tokens](https://docs.npmjs.com/about-access-tokens), [Creating and viewing access tokens](https://docs.npmjs.com/creating-and-viewing-access-tokens), [npm token docs v12](https://docs.npmjs.com/cli/v12/commands/npm-token), [GitHub changelog 2025-09-29](https://github.blog/changelog/2025-09-29-strengthening-npm-security-important-changes-to-authentication-and-token-management), [2025-12-09](https://github.blog/changelog/2025-12-09-npm-classic-tokens-revoked-session-based-auth-and-cli-token-management-now-available), [2026-07-31](https://github.blog/changelog/2026-07-31-restricting-npm-bypass-2fa-granular-access-tokens), [2026-09-18](https://github.blog/changelog/2026-09-18-stage-only-npm-tokens-for-safer-automation)
- Related: NPM-009, NPM-010, NPM-011

An old `NPM_TOKEN` that fails is probably a classic token: on 2025-12-09 "We've permanently revoked all existing npm classic tokens". The docs: "only Granular access tokens are supported. Legacy access tokens have been removed."

What exists now:
- **Session tokens.** `npm login` gives "a two-hour session token"; they don't appear in token lists, and publishing with one asks for 2FA.
- **Granular access tokens.** Permission "No access, Read-only, Read and write (publish and stage), or Read and write (stage only)", scoped to "up to 50 organizations, and up to either 50 packages, 50 scopes, or a combination"; optional CIDR ranges; "up to 1000" per account. Write tokens created since mid-October 2025 default to 7 days and allow at most 90 (changelog; the docs only require "at least one day"). Create them on the website or, since npm 11.20 and 12.1, with `npm token create --packages-and-scopes-permission read-write-stage-only`.
- **Bypass 2FA**, off by default, lets a write token publish without a prompt. Since 2026-07-31 such tokens can't manage tokens, maintainers, access or trusted-publishing settings, and npm targets January 2027 to stop them publishing directly: they'll only read private packages and stage.

Doc conflicts: `npm login`'s page still says it creates "a legacy token of `publish` type"; "Creating and viewing access tokens" says granular tokens can't be made from the CLI. Both predate the changes above; trust the changelog and `npm token`'s own page. Revoking can take "up to an hour".

## [NPM-009] Trusted publishing: what the registry requires
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers), [npm trust docs v12](https://docs.npmjs.com/cli/v12/commands/npm-trust), [npm/cli `trust-cmd.js`](https://github.com/npm/cli/blob/latest/lib/trust-cmd.js), [GitHub changelog 2025-07-31](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available), [2026-09-03](https://github.blog/changelog/2026-09-03-multiple-trusted-publishing-configurations-for-npm), [2026-09-30](https://github.blog/changelog/2026-09-30-opt-in-dist-tag-permissions-for-npm-trusted-publishing), [2026-10-02](https://github.blog/changelog/2026-10-02-unvalidated-npm-trusted-publishing-configurations-now-expire)
- Related: NPM-010, NPM-011, NPM-012

Trusted publishing lets a CI workflow publish with a short-lived OIDC token instead of a stored npm token. Registry side (workflow side: `kb-github-actions.md`):
- **Versions:** "npm CLI version 11.5.1 or later and Node version 22.14.0 or higher".
- **Providers:** GitHub Actions (GitHub-hosted runners), GitLab.com shared runners, CircleCI cloud. "Self-hosted runners are not currently supported".
- **Configuration** (package settings, or `npm trust` from npm 11.15.0 with 2FA): owner, repository, workflow filename ("only the filename"), optional environment. `repository.url` in `package.json` "must exactly match your GitHub repository". Up to 10 per package; replace rather than edit them; npm doesn't check them when saved.
- **First publish within 2 days**, or the configuration expires (since 2026-10-02).
- **Allowed actions:** "`npm stage publish` is always allowed"; direct `npm publish` and `npm dist-tag` are separate opt-ins (dist-tag needs npm 11.21.0 or 12.2.0). Configurations created after 2026-09-03 stage only unless you tick publish; those from before 2026-05-20 allow `npm publish` only.
- **Reusable workflows:** "validation checks the calling workflow's name".
- **Events:** the 2026-10-02 changelog says npm rejects OIDC tokens from `issue_comment` "alongside the existing pull_request_target restriction"; the docs mention neither.
- Provenance is automatic for a public package from a public repo (not on CircleCI).

**Non-interactive `npm trust`:** `npm trust github <pkg> … --allow-stage-publish --otp=<code> -y` works without a prompt; one OTP covered four calls (npm 11.19.0, 2026-10-18). The page doesn't list `--otp`; the command sends it through npm's `otplease` (`trust-cmd.js`).

Then set publishing access to "Require two-factor authentication and disallow tokens": tokens stop working, trusted publishers don't. Doc conflict: the trusted-publishers page says "up to 10" three times, matching the 2026-09-03 changelog, but its "Managing" section and the `npm trust` page still say one per package. Trust 10.

## [NPM-010] Staged publishing, stage-only tokens and publish-time scanning
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Staged publishing for npm packages](https://docs.npmjs.com/staged-publishing), [npm stage docs v12](https://docs.npmjs.com/cli/v12/commands/npm-stage), [npm/cli `npm-stage.md`](https://raw.githubusercontent.com/npm/cli/latest/docs/lib/content/commands/npm-stage.md), [GitHub changelog 2026-05-22](https://github.blog/changelog/2026-05-22-staged-publishing-and-new-install-time-controls-for-npm), [2026-07-28](https://github.blog/changelog/2026-07-28-npm-publish-time-malware-scanning-and-dual-use-metadata), [2026-09-18](https://github.blog/changelog/2026-09-18-stage-only-npm-tokens-for-safer-automation), [2026-10-02](https://github.blog/changelog/2026-10-02-npm-staged-publishing-now-supports-creating-new-packages)
- Related: NPM-008, NPM-009, NPM-011

`npm stage publish` uploads the tarball to a queue instead of releasing it: "A maintainer must then review and explicitly approve the staged package — with two-factor authentication". It needs "npm CLI … 11.15.0 or later and Node version 22.14.0 or higher", publish access and 2FA on the account; staging itself "does not require 2FA". Generally available since 2026-05-22.

What it combines with:
- **Trusted publishing:** a configuration can stage only, so a compromised workflow can't release on its own (NPM-009).
- **Stage-only tokens** (2026-09-18): "npm rejects direct npm publish attempts with that token, even if you've configured it to bypass 2FA". They can still move dist-tags and deprecate versions. This is npm's path for token-based CI before bypass-2FA tokens lose direct publish in January 2027.
- **New packages** (2026-10-02): `npm stage publish` can create a package; the first version waits for approval, with a public `0.0.0-stage` placeholder meanwhile.
- **Malware scanning** (2026-07-28): every publish is scanned before it becomes installable, "typically around five minutes", sometimes 15 or more, and a staged version can be approved only after its scan. Automation that installs a version right after publishing must wait.

**Like `npm publish`.** `npm stage publish [<package-spec>]` with no argument "packs the current working directory", and the page says it "has parity with `npm publish`" only about refusing `"private": true`. It doesn't say it runs lifecycle scripts, but it does: `prepublishOnly`, then `prepack`, so a package that builds in `prepublishOnly` needs no separate build step before staging. Tested 2026-10-18, npm 11.19.0, Node 24.21.0: `npm stage publish --dry-run` in a scratch package ran both scripts, then printed "(staged)"; the same held in osrs-tracker-packages' `packages/logger`.

`npm stage list`, `view`, `approve` and `reject` need an interactive login; OIDC can't approve.

## [NPM-011] What CI should use to install and to publish
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers), [Requiring 2FA for package publishing](https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification), [GitHub changelog 2026-07-08](https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation), [2026-09-03](https://github.blog/changelog/2026-09-03-multiple-trusted-publishing-configurations-for-npm), [TanStack postmortem](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem)
- Related: NPM-008, NPM-009, NPM-010, NPM-012

**Installing.** Public dependencies need no token. For private packages: "Always use read-only granular access tokens for installing dependencies"; "trusted publishing is not intended for `npm install`".

**Publishing, in order of preference:**
1. Trusted publishing with a stage-only configuration: CI runs `npm stage publish`, a maintainer approves with 2FA. npm: "We recommend keeping your configurations to staging only."
2. Trusted publishing with direct publish, when nobody can approve each release. Nothing checks a release then: TanStack's 84 malicious versions on 2026-05-11 went out through its trusted-publisher binding from a poisoned workflow ("OIDC trusted-publisher binding has no per-publish review"; the workflow side is in `kb-github-actions.md`).
3. A stage-only granular token, where OIDC isn't available (self-hosted runners).
4. Not a bypass-2FA write token: it loses direct publish around January 2027.

**Then lock the package:** publishing access "Require two-factor authentication and disallow tokens", which npm's docs mark "Recommended", so a leaked token can't publish.

**Publishing by hand** from a maintainer's machine is still fine: `npm login` gives a two-hour session and publishing asks for 2FA. It produces no provenance (NPM-012).

## [NPM-012] Provenance: what it proves, and `npm audit signatures`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements), [Introducing npm package provenance (GitHub blog, 2023-04-19)](https://github.blog/security/supply-chain-security/introducing-npm-package-provenance/), [GitHub changelog 2023-07-25](https://github.blog/changelog/2023-07-25-publishing-with-npm-provenance-from-private-source-repositories-is-no-longer-supported/), [npm audit docs v12](https://docs.npmjs.com/cli/v12/commands/npm-audit), [npm/cli `verify-signatures.js`](https://github.com/npm/cli/blob/latest/lib/utils/verify-signatures.js), [TanStack postmortem](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem), [Snyk on the TanStack compromise](https://snyk.io/blog/tanstack-npm-packages-compromised)
- Related: NPM-009, NPM-011, NPM-013

**What it proves.** A provenance attestation, signed through Sigstore and logged in the public Rekor transparency log, links a tarball to the repository, commit and workflow run that built it. Before it, `package.json`'s repository link "isn't verified and doesn't point at any specific commit".

**What it doesn't.** The docs: "it does not guarantee the package has no malicious code"; auditing the linked source is left to you. Nor does it vouch for the workflow's inputs: TanStack's 84 malicious versions (2026-05-11) were built by its own release workflow after cache poisoning, and Snyk (a vendor, secondary) counted "84 valid, signed, provenance-attested package publishes". It needs a cloud-hosted runner and a public repository: "publishing with provenance is restricted to public source repositories only" (2023-07-25).

**Checking it.** `npm audit signatures` verifies the installed tree's registry signatures (npm 8.15.0+) and provenance attestations (9.5.0+). In npm's code it exits 1 on an invalid signature or attestation, or a missing registry signature, but not on missing provenance ("not all packages have provenance"). So it detects tampering between registry and disk, not malicious packages. The "Viewing package provenance" page says missing attestations return an error; the code doesn't.

Our `@osrs-tracker/*` packages carry none: they are published by hand (`npm view @osrs-tracker/hiscores@4.2.0 dist` shows signatures and no attestations, 2026-10-17). The first releases from osrs-tracker-packages (2026-10-18) were by hand too and carry none (`npm view @osrs-tracker/<pkg> dist.attestations` empty for models 3.0.0, hiscores 6.0.0, logger 0.3.0 and express-metrics 0.2.0, 2026-10-18). Since 2026-10-18 that repo's Publish workflow stages them over trusted publishing (osrs-tracker/osrs-tracker-packages#14), so each package carries provenance from its next release; nothing had been staged by 2026-10-18. Once one is approved, check `npm view @osrs-tracker/<pkg>@<version> dist` for an `attestations` field and record it here.

## [NPM-013] `npm audit` in CI: what it checks and how to gate it
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm audit docs v12](https://docs.npmjs.com/cli/v12/commands/npm-audit), [npm config docs v12](https://docs.npmjs.com/cli/v12/using-npm/config), [npm CLI CHANGELOG](https://raw.githubusercontent.com/npm/cli/latest/CHANGELOG.md), [npm audit: Broken by Design (Abramov, 2021-07-07)](https://overreacted.io/npm-audit-broken-by-design/)
- Related: NPM-012

`npm audit` sends the dependency list to the registry and reports "known vulnerabilities": published advisories only. It finds no malware or unpublished flaws and doesn't check whether your code reaches the vulnerable path.
- Exit code: "By default, the audit command will exit with a non-zero code if any vulnerability is found." `--audit-level=<level>` sets the failing severity and "does not filter the report output".
- `--omit=dev` leaves dev dependencies out of what is submitted.
- `npm audit fix` "runs a full-fledged `npm install`"; `--force` allows semver-major jumps.
- With `min-release-age` set, a fix newer than the window isn't installed: npm warns and exits non-zero (12.0.0, 11.18.0).

The old criticism still applies: Abramov (2021) called it "broken by design", with "a 99%+ false positive rate" for build-tool trees, and "npm audit still warns for development dependencies by default". In the npm 12 docs `audit` still defaults to on during installs, dev dependencies included.

For a small app:
- Don't fail PRs on plain `npm audit`: an advisory in a dev-only build tool blocks unrelated work.
- To gate, use `npm audit --omit=dev --audit-level=high`, so only production dependencies at high or critical fail.
- Let Dependabot alerts and security updates bring the fixes (`kb-js-upgrades.md`).
- `npm audit signatures` is a separate, cheap check (NPM-012).

None of our repos' CI runs `npm audit` (2026-10-17).

## [NPM-014] Ship new packages ESM-only
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Node.js v22.10.0 release notes](https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V22.md), [Node.js docs: Modules (v24.x)](https://raw.githubusercontent.com/nodejs/node/v24.x/doc/api/modules.md), [nodejs/package-examples: dual packages](https://raw.githubusercontent.com/nodejs/package-examples/main/guide/07-dual-packages/README.md), [TypeScript 5.8 release notes](https://raw.githubusercontent.com/microsoft/TypeScript-Website/v2/packages/documentation/copy/en/release-notes/TypeScript%205.8.md), [Announcing Vite 7.0](https://raw.githubusercontent.com/vitejs/vite/main/docs/blog/announcing-vite7.md), [Node release schedule](https://raw.githubusercontent.com/nodejs/Release/main/schedule.json), [Jest docs: ECMAScript Modules, `require()` of ESM](https://raw.githubusercontent.com/jestjs/jest/main/docs/ECMAScriptModules.md)
- Related: NPM-015

A new library for supported Node versions can ship ESM only, and `require()` still loads it.
- Node 22.10.0's notes: "When all active Node.js LTS lines support `require(esm)`, packages can simplify their distributions by bumping the major version, dropping their CJS exports". That holds since Node 20's end of life on 2026-04-30: `require(esm)` works unflagged from 22.12.0, and from 24.15.0 "This feature is no longer experimental" (`kb-nodejs.md`, NODE-010).
- Node's dual-package guide now opens: "Do not follow the documentation below for new packages for the time being."
- TypeScript 5.8: "a major opportunity for library authors to provide ESM support without having to dual-publish"; dual publishing "roughly doubles the amount of code within a package".
- Vite 7.0 went ESM-only on these grounds, with `engines` `^20.19.0 || >=22.12.0`.

What to declare:
- `"type": "module"` (Node: authors "should always include the `"type"` field").
- `engines.node` with `require(esm)` unflagged: `>=22.12.0` now that 20 is gone.
- No top-level `await` anywhere in the module graph, or `require()` throws `ERR_REQUIRE_ASYNC_MODULE`.
- An `exports` entry that `require()` resolves: `default` (or `module-sync`). One exposed "only under `import`" fails with `ERR_PACKAGE_PATH_NOT_EXPORTED` (Jest's docs).

Keep a CJS build only for consumers on Node older than 22.12, CommonJS Jest suites on Node older than 24.9 (there "`require()` of an ESM file still throws `ERR_REQUIRE_ESM`"), or a CommonJS TypeScript consumer that can't type-check the import (NPM-015).

## [NPM-015] `exports` with types for ESM-only and dual packages, and how to check them
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Node.js docs: Packages (v24.x)](https://raw.githubusercontent.com/nodejs/node/v24.x/doc/api/packages.md), [Node.js docs: Modules (v24.x)](https://raw.githubusercontent.com/nodejs/node/v24.x/doc/api/modules.md), [TypeScript modules reference](https://raw.githubusercontent.com/microsoft/TypeScript-Website/v2/packages/documentation/copy/en/modules-reference/Reference.md), [TypeScript 5.8 release notes](https://raw.githubusercontent.com/microsoft/TypeScript-Website/v2/packages/documentation/copy/en/release-notes/TypeScript%205.8.md), [publint rules](https://raw.githubusercontent.com/publint/publint/master/site/src/pages/rules.md), [arethetypeswrong CLI README](https://raw.githubusercontent.com/arethetypeswrong/arethetypeswrong.github.io/main/packages/cli/README.md)
- Related: NPM-014

ESM-only:
```json
{ "type": "module",
  "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } },
  "files": ["dist"] }
```
Dual, after TypeScript's modules reference: one declaration file per format.
```json
"exports": { ".": {
  "import":  { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
  "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" } } }
```

Rules:
- `"types"` "should always be included first" and `"default"` "should always come last"; earlier keys win.
- One `.d.ts` shared by an `import` and a `require` target types one of them wrongly; publint reports `EXPORTS_TYPES_INVALID_FORMAT`.
- `exports` takes precedence over `main`, and `typesVersions` "is not read" when `exports` is.

What `require()` of an ESM package returns: the namespace object, with the default export under `.default`. To return one value, export it as `'module.exports'` (`export { Point as 'module.exports' }`); then "named exports will be lost to CommonJS consumers" unless attached to it. TypeScript accepts `require` of ESM under `--module nodenext` only (5.8); under `node16` or `node18` it's a type error.

Before publishing:
- `npm pack --dry-run` lists the files.
- publint 0.3.25 checks `exports` against `files` (`FILE_NOT_PUBLISHED`).
- `@arethetypeswrong/cli` 0.18.5 (`attw --pack .`) resolves types as node10, node16 and bundler; its `esm-only` profile skips the CJS failures it still reports for ESM-only packages.

## [NPM-016] `npm ci` vs `npm install`, and lockfile v3
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm ci docs v12](https://docs.npmjs.com/cli/v12/commands/npm-ci), [package-lock.json docs v12](https://docs.npmjs.com/cli/v12/configuring-npm/package-lock-json), [npm/cli `lib/commands/ci.js`](https://github.com/npm/cli/blob/latest/lib/commands/ci.js), [npm CLI CHANGELOG](https://raw.githubusercontent.com/npm/cli/latest/CHANGELOG.md), [npm/cli#10043](https://github.com/npm/cli/issues/10043)
- Related: NPM-017, NPM-019, JSUP-010, JSUP-011

`npm ci` is a frozen install for CI:
- "The project **must** have an existing `package-lock.json`."
- "If dependencies in the package lock do not match those in `package.json`, `npm ci` will exit with an error, instead of updating the package lock." The message names each mismatch: "Missing: name@version from lock file" or "Invalid: lock file's a@x does not satisfy a@y".
- "It will never write to `package.json` or `package-lock.json`", installs only whole projects, and removes `node_modules` first.

`npm install` resolves and rewrites the lock as needed, so a lock that `install` accepts can still fail `ci`. Usual causes:
- `package.json` edited (a version, an `overrides` entry) without rerunning `npm install`.
- A lock made with `--legacy-peer-deps` or `--install-links`: "you _must_ provide the same flags to `npm ci`". Put such a flag in the committed `.npmrc` instead.
- Platform-specific optional packages missing from the lock (NPM-017).
- Bugs in lock generation: 11.10.1 (2026-02-19) fixed `peerOptional` resolution (#8981, which closed "npm ci fails with newer versions of npm", #8767). npm/cli#10043 (open since 2026-09-25, no maintainer reply) reports `Missing: @esbuild/aix-ppc64@ from lock file` with locks written by 11.16.0 and 11.17.0.

Lockfile versions: "`3`: The lockfile version used by npm v9 and above. Backwards compatible to npm v7." npm 10, 11 and 12 all write v3, so a lock doesn't change format between them.

Don't delete the lock to make `ci` pass: that re-resolves every transitive dependency (JSUP-010). Lock conflicts on a rebase: JSUP-011.

## [NPM-017] Optional platform packages missing from a lockfile made on another OS
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm/cli#4828](https://github.com/npm/cli/issues/4828), [npm/cli#8184](https://github.com/npm/cli/pull/8184), [arborist v9.0.2 release](https://github.com/npm/cli/releases/tag/arborist-v9.0.2), [npm/cli#10043](https://github.com/npm/cli/issues/10043), [esbuild 0.28.2 `install.js`](https://unpkg.com/esbuild@0.28.2/install.js)
- Related: NPM-006, NPM-016, JSUP-010

Tools such as esbuild, Rollup, SWC, lmdb and sharp ship their native binary as one optional package per platform (`@esbuild/linux-x64`, `@esbuild/darwin-arm64`, …), and the lockfile should list all of them. npm/cli#4828: when the lock was regenerated with `node_modules` present, npm wrote "only the platform-specific dependency that was installed on this machine". A lock made on a Mac then lacks the Linux package, and CI fails with `Missing: … from lock file` or the tool fails at runtime for want of its binary.

Status: #4828 was closed as completed on 2025-04-03 by npm/cli#8184, an arborist fix shipped in npm 11.3.0 (2025-04-08). Locks written before that, or by an npm with a later regression (#10043, unconfirmed), can still miss entries.

Fix: with npm 11.3.0 or later, run `npm install` (or `npm install --package-lock-only`) with the lock kept, and commit it. The issue's advice, deleting `node_modules` and `package-lock.json` first, works too but re-resolves every transitive dependency (JSUP-010). Before 11.3.0, deleting only the lock while `node_modules` was present is what caused the bug. Check with `grep -c '"node_modules/@esbuild/' package-lock.json`: there should be one entry per platform.

Blocked install scripts make it worse: esbuild's `postinstall` would download a missing binary, but under npm 12's default it doesn't run (NPM-006).

Tested 2026-10-17, npm 11.19.0, Node 24.21.0, WSL2: a lock for `esbuild@0.28.2` with 25 of its 26 `@esbuild/*` entries removed made `npm ci` fail with `EUSAGE` ("… are in sync"); `npm install` with the lock kept (with or without `node_modules`) and `--package-lock-only` each restored all 26.

## [NPM-018] `overrides`, `packageExtensions` and `npm patch`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [package.json docs v12: overrides, packageExtensions](https://docs.npmjs.com/cli/v12/configuring-npm/package-json), [npm patch docs](https://raw.githubusercontent.com/npm/cli/latest/docs/lib/content/commands/npm-patch.md), [npm CLI CHANGELOG 12.0.0-pre.1](https://raw.githubusercontent.com/npm/cli/latest/CHANGELOG.md)
- Related: NPM-016, NPM-019

Three root-level tools change dependencies you don't control.

**`overrides`** pins what an existing dependency resolves to, at any depth:
```json
"overrides": { "postcss": "8.5.6", "@npm/bar": { "@npm/foo": "1.0.0" }, "react": "$react" }
```
- "Overrides are only considered in the root `package.json`"; a library's own `overrides` do nothing for its users.
- Values are any dependency spec: version, range, dist-tag, `npm:` alias, `file:`, git URL.
- "You may not set an override for a package that you directly depend on unless both the dependency and the override itself share the exact same spec"; use `"$name"` to reuse the direct dependency's spec, or npm reports `EOVERRIDE`.
- Changing `overrides` changes the resolved tree, so run `npm install` and commit the lock, or `npm ci` fails (NPM-016).

**`packageExtensions`** (npm 12) "adds or corrects the dependency metadata that creates the edge": a dependency a package forgot to declare, or wrong peer metadata. It can't change a declared version ("use `overrides`"), and npm "refuses to publish a non-private package that contains `packageExtensions`".

**`npm patch`** (npm 12: `add`, `commit`, `update`, `ls`, `rm`) changes a dependency's files. Diffs live in `patches/`, are declared in `patchedDependencies` and hashed in the lock; they apply even with `--ignore-scripts`, and a patch that fails to apply is an error. Unlike `patch-package`, it needs no root `postinstall` script.

## [NPM-019] Peer dependency conflicts: ERESOLVE, `--legacy-peer-deps` and `--force`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm config docs v12: legacy-peer-deps, strict-peer-deps, force](https://docs.npmjs.com/cli/v12/using-npm/config), [package.json docs v12: peerDependencies](https://docs.npmjs.com/cli/v12/configuring-npm/package-json), [npm ci docs v12](https://docs.npmjs.com/cli/v12/commands/npm-ci)
- Related: NPM-016, NPM-018, TS-011, JSUP-002

"As of npm v7, peerDependencies _are_ installed by default", and a root install whose peers can't be satisfied stops with `ERESOLVE unable to resolve dependency tree`. Deeper in the tree, npm resolves a conflict "using the nearest non-peer dependency specification" and prints a warning; `--strict-peer-deps` turns that warning into a failure for required peers. So bumping one package past a peer range in an installed repo exits 0 with only `ERESOLVE overriding peer dependency` warnings, and `npm ls --all` is what exits 1 (tested in JSUP-002).

The error suggests two flags. Both install a tree the package authors said doesn't work:
- `--legacy-peer-deps` "Causes npm to completely ignore `peerDependencies` when building a package tree", like npm 3 to 6. The docs: "Use of `legacy-peer-deps` is not recommended". A lock made with it needs the flag on every later `npm ci`, so it ends up in `.npmrc` and hides the next conflict too.
- `--force` "Allow[s] conflicting peerDependencies to be installed in the root project", among a list of other protections it removes ("strongly recommended that you do not use this option").

What to do: read the conflict (`npm explain <pkg>` shows who requires which range), then move the package that is out of range, usually by waiting for the tool to support the new major. The common case on 2026-10-17 is `typescript@latest` (7.0.2) against Angular's or typescript-eslint's `<6.1` peer range: `kb-typescript.md`, TS-011, where the forced install broke at runtime.

## [NPM-020] npm 12 or pnpm for a handful of small repos
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [pnpm v11.0.0 release notes](https://github.com/pnpm/pnpm/releases/tag/v11.0.0), [pnpm v12.0.0 release notes](https://github.com/pnpm/pnpm/releases/tag/v12.0.0), [pnpm docs: settings](https://pnpm.io/settings), [pnpm docs: git worktrees](https://pnpm.io/git-worktrees), [pnpm feature comparison](https://pnpm.io/feature-comparison), [Dependabot options reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference), [Corepack README](https://github.com/nodejs/corepack/blob/main/README.md), npm registry (`npm view pnpm dist-tags`, then `'time[<version>]'`)
- Related: NPM-004, NPM-007, SESS-008

pnpm `latest` is 12.14.0 (12.0.0 on 2026-08-26; 11.0.0 on 2026-04-28).

| | npm 12 | pnpm 11 and 12 |
|---|---|---|
| Dependency build scripts | blocked unless in `allowScripts`; warning | blocked unless in `allowBuilds`; an error by default (`strictDepBuilds`) |
| Release-age delay | `min-release-age`, off by default, in days | `minimumReleaseAge` "defaults to 1 day" since 11.0.0 |
| Exotic transitive deps | git and URL deps off | `blockExoticSubdeps` on |
| Strict `node_modules` | opt-in `install-strategy=linked` | default |
| Disk per git worktree | full copy | hard links from one store; `virtualStoreType: global` makes each worktree "only symlinks" |
| Patching, catalogs | `npm patch`; no catalogs | `pnpm patch`; `catalog:` versions |
| Ships with Node 24 | npm 11 | no; Corepack, which used to provide it, isn't in Node 25+ |

pnpm's own comparison table still marks npm without "Patching dependencies" and "Build script security"; that predates npm 12.

For our few repos, npm 12 closes most of the security gap, so pnpm's lead is disk use and speed with several worktrees (SESS-008), which no benchmark we read measures. Switching costs a new lockfile and CI setup, `.npmrc` settings moved to `pnpm-workspace.yaml`, and Dependabot support that lists pnpm v7 to v10 only (npm v7 to v11) on 2026-10-17, so check both before relying on them.

## [NPM-021] Installing Claude Code with npm 12: allow its postinstall
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Claude Code setup: npm install](https://code.claude.com/docs/en/setup), [Troubleshoot installation: native binary not found after npm install](https://code.claude.com/docs/en/troubleshoot-install), [npm install-scripts docs v12](https://docs.npmjs.com/cli/v12/commands/npm-install-scripts), npm registry (`npm view @anthropic-ai/claude-code version scripts`, 2026-10-17)
- Related: NPM-004, NPM-006

`npm install -g @anthropic-ai/claude-code` on npm 12 installs a `claude` that doesn't run. The package "pulls the binary in through a per-platform optional dependency … and a postinstall step links it into place" (2.1.302: `"postinstall": "node install.cjs"`). npm 12 blocks that script by default for global installs too, and global installs have no `package.json` to approve it in.

Fixes, from npm's warning and docs:
- Per install: `npm install -g --allow-scripts=@anthropic-ai/claude-code @anthropic-ai/claude-code`.
- For every global install of it: `npm config set allow-scripts=@anthropic-ai/claude-code --location=user`.
- After the fact: run `node <global node_modules>/@anthropic-ai/claude-code/install.cjs`, as Claude Code's troubleshooting page says for `--ignore-scripts`.
- Or use the native installer, which the setup page marks "Recommended" and which doesn't go through npm.

The Claude Code docs mention `--ignore-scripts` and pnpm but not npm 12's default (read 2026-10-17). CI that installs Claude Code with npm, such as claude-skills' validate workflow on Node 22 (npm 10.9.9), is unaffected until its npm reaches 12.

Tested 2026-10-17, npm 12.2.0, Node 24.21.0, WSL2, `@anthropic-ai/claude-code@2.1.302` into a scratch prefix: npm warned "1 package had install scripts blocked"; `claude --version` printed "Error: claude native binary not installed." and exited 1. Reinstalled with `--allow-scripts=@anthropic-ai/claude-code`, it printed "2.1.302 (Claude Code)". Tested the same day on npm 11.19.0 with `strict-allow-scripts=true` in the user npmrc: the global install failed with `ESTRICTALLOWSCRIPTS` (exit 1) instead of installing a broken `claude`, and adding `allow-scripts=@anthropic-ai/claude-code` to that npmrc let it install and run.

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-17 against `main` of osrs-tracker-web, osrs-tracker-api, osrs-tracker-aws, freek-mencke-web, claude-skills and this repo: the apps' CI and Docker builds run Node 24 with npm 11.19, claude-skills' CI Node 22 with npm 10.9.9; osrs-tracker-web is the only repo with an `allowScripts` field.

1. Done 2026-10-18: npm 12's install-script approvals in freek-mencke-web (FreekMencke/freek-mencke-web#18) and osrs-tracker-aws (osrs-tracker/osrs-tracker-aws#145). osrs-tracker-api's lock and `mcp-server/`'s have only the macOS-only `fsevents` (NPM-004, NPM-005, NPM-007).
2. Done 2026-10-28: `strict-allow-scripts=true` and `allow-scripts=@anthropic-ai/claude-code` are in `~/.npmrc` on the dev machine (npm 11.19.0; `npm config get` returns both). NPM-004, NPM-007, NPM-021.
3. **User action: set the four `@osrs-tracker/*` packages' publishing access to "Require two-factor authentication and disallow tokens"** (NPM-008, NPM-011). They're staged from osrs-tracker-packages' Publish workflow over trusted publishing and approved with 2FA, with `npm publish --otp=<code>` by hand as the fallback (the `## Publishing` section of osrs-tracker-packages' repo skill). The setting allows both: trusted publishers can still stage (NPM-009), and by hand "they must publish interactively"; it stops any granular token, leaked or forgotten, from publishing. Check the current setting first on npmjs.com; it isn't visible from outside.
4. **Re-approve pins in the dependency PR that bumps them** (NPM-007): esbuild, lmdb and @parcel/watcher move often, and nothing (Dependabot included) does it automatically. Already the habit in osrs-tracker-web (7fad45e); the two issues above say the same.
5. Done 2026-10-18: `@osrs-tracker/*` stage-publish from osrs-tracker-packages' Publish workflow (`workflow_dispatch` from `main`) over trusted publishers that allow stage publish only, approved on npm with 2FA (osrs-tracker/osrs-tracker-packages#14; NPM-009, NPM-010, NPM-012).
6. **Won't do now: ESM-only `@osrs-tracker/*`** (NPM-014, NPM-015). They dual-publish with one shared `.d.ts` and no `type` field, and every consumer works: the Lambdas bundle them with esbuild, and osrs-tracker-api compiles with TypeScript `module: commonjs`, which would need checking against an ESM-only package first. Revisit at a package's next major; run publint and attw on its tarball then.
   Update 2026-10-18: the majors released that day from osrs-tracker-packages (models 3.0.0, hiscores 6.0.0, logger 0.3.0, express-metrics 0.2.0) stayed dual (`dist/cjs`, `dist/esm`, `dist/types`). That repo's CI now packs each package and loads it with both `require` and `import`.
7. **Won't do now: npm 12 in CI before a Node release bundles it** (NPM-001). Dependabot's own npm is 11.19.0 and npm 12 support is an open request there, so lockfiles would be written by two majors. Revisit when Node 27 ships with npm 12 (alpha from 2026-10-28) or a Dependabot changelog names npm 12.
8. **Won't do: a PR gate on `npm audit`** (NPM-013). Dependabot alerts and security updates already cover advisories; a gate would block unrelated PRs on dev-tool advisories.
9. **Won't do: pnpm** (NPM-020). npm 12 closed most of the install-script gap, and Dependabot lists pnpm only up to v10.
10. **Watch: claude-skills' CI installs Claude Code with `npm install -g`** on Node 22 (npm 10.9.9; NPM-021). It breaks silently ("claude native binary not installed") once that job's npm reaches 12; add `--allow-scripts=@anthropic-ai/claude-code` then, or switch to the native installer. No issue opened: nothing changes until its Node bundles npm 12.

## Open questions

- **Read-only granular token expiry** (NPM-008): the 2025-09-29 changelog gives 7 days default and 90 maximum for write tokens; the docs don't state a limit for read-only tokens. Looked in "About access tokens", "Creating and viewing access tokens" and `npm token`'s page.
- **The `pull_request_target` OIDC rule** (NPM-009): only the 2026-10-02 changelog mentions it, as "existing"; no earlier changelog in the supply-chain feed or the trusted-publishers page states it.
- **npm/cli#10043** (NPM-016, NPM-017): an open report that cross-platform optional dependencies regressed in 11.16 or 11.17. No maintainer had confirmed it on 2026-10-17; not reproduced.
- **pnpm 12's Node floor** (NPM-020): the package's `engines` says `>=18.*` while the 11.0.0 notes say "Node.js 22+ required"; not resolved from the release notes alone.
- **Does attw 0.18.5 still flag an ESM-only package for CommonJS consumers** on a `require(esm)`-capable Node (NPM-015)? Not run.
- **Does npm 12 land in Node 27's alpha on 2026-10-28** (NPM-001)? Expected from the nightlies; re-check `nodejs.org/dist/index.json` then.
- **Does Dependabot support npm 12** or rewrite `allowScripts` pins (NPM-007)? Its code at 2026-10-16 runs npm 11.19.0 with `--ignore-scripts` and never mentions `allowScripts`; no changelog announces either.
- **The TanStack case's provenance details** (NPM-012) rest on the postmortem and one vendor post; other provenance-signed compromises named in community posts weren't verified.
- **Doc conflicts to report upstream** (npm/documentation): `npm login` still creating "a legacy token of `publish` type", "You cannot create granular access tokens from the CLI currently", one trusted publisher per package (two pages), missing attestations: "it returns an error", the Quick Audit fallback removed in 11.0.0, and no `allowScripts` in the `package.json` docs.
