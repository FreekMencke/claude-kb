# Dependency upgrades and codemods in Node/TS repos

Prefix `JSUP`. This file covers how an agent should upgrade dependencies in a Node or TypeScript repo: what to read before a bump, what npm does with a peer conflict, the official migration tools on our stack, when to write a codemod instead of editing files, how to split and verify a major upgrade, lockfile hygiene, Dependabot (npm and GitHub Actions; we don't use Renovate), and what to do when the model's training predates the versions in use. TypeScript's own versions and the TypeScript 7 trap are in `kb-typescript.md` (TS-011, TS-015), Angular's `ng update` in `kb-angular.md` (NG-010), the Node runtime in `kb-nodejs.md`, npm itself (lockfile format, `npm ci`, overrides, tokens) in `kb-npm.md`, and pinning actions in `kb-github-actions.md`.

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#173, part of roadmap #167) by an Opus 5.5 lead with three Sonnet 5.5 readers (Dependabot; official migration tools; codemods and published LLM migrations). The lead re-checked every quote used here against raw text.
- Versions and dates from the npm registry (`npm view <pkg> …`); npm behaviour from the npm/cli docs sources and npm 11.19.0's own config definitions; GitHub docs as raw markdown (`docs.github.com/api/article/body?pathname=…`) and the GitHub changelog; tool docs from their repos' raw markdown.
- Tested in a WSL terminal with Node 24.21.0 and npm 11.19.0 (one test repeated on npm 12.2.0), with official packages only (`typescript`, `typescript-eslint`, `eslint`, `@angular/compiler-cli`, `@ast-grep/cli`, `ts-morph`), installed with `--ignore-scripts`. Lockfile measurements used the public `package.json` and `package-lock.json` of osrs-tracker-api and osrs-tracker-web from `main` on 2026-10-17.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| How should an agent check versions and peer ranges before a bump? | `npm outdated`, `npm view <pkg> dist-tags`, `npm view <pkg> "time[<version>]"` and `npm view <pkg>@<target> peerDependencies peerDependenciesMeta`, then `npm ls <pkg>`. Not `npm view <pkg> time --json` (199k characters for typescript) or `npm explain` (260 lines). | JSUP-001, TS-015 |
| Does npm stop me installing a version outside a peer range? | Not in an existing repo: `npm install -D typescript@latest` next to typescript-eslint or Angular exits 0 with "ERESOLVE overriding peer dependency" warnings. Check with `npm ls --all`; `--strict-peer-deps` stops only required-peer breaks, not Angular's optional peer. | JSUP-002, TS-011 |
| Which official migration tools exist on our stack? | `ng update` (Angular), `nest upgrade` (Nest CLI 12), `@eslint/migrate-config` and `npx codemod @eslint/v9-to-v10` (ESLint), Node's `npx codemod @nodejs/<recipe>`. Vitest, Jest and typescript-eslint have guides, no codemod. | JSUP-003, NG-010 |
| Codemod, rename tool or agent edit? | A vendor codemod first; ts-morph for a rename or move across files; ast-grep for one syntax pattern many times; the agent, with a discovery list and a build-and-test gate, for changes that vary by context. | JSUP-004, JSUP-005 |
| Can Claude Code's LSP tool rename a symbol? | No: nine operations (definition, references, hover, symbols, implementations, call hierarchy), no rename. Use ts-morph's `rename()`. | JSUP-004 |
| How does an agent write and run a codemod safely? | Discovery list first, transform in the scratchpad, preview (ast-grep without `-U`, jscodeshift `--dry --print`), 2–3 files, then all on a clean tree; codemod output and hand fixes in separate commits; build and tests decide. | JSUP-006 |
| What did Google and Airbnb learn from LLM migrations? | Deterministic discovery and validation around LLM edits: Google reports 74.45% of 595 changes LLM-generated and an estimated 50% time saving; Airbnb moved 3.5K test files in 6 weeks. In Google's JUnit migration, review was the bottleneck. | JSUP-007 |
| How should a major upgrade be split into PRs? | Prep PR on the old version for deprecations; then one major of one package family per PR, with the tool's output and the hand fixes in separate commits; optional adoptions later. | JSUP-008 |
| How do I verify an upgrade? | In a clean checkout: `npm ci`, `npm ls --all`, type-check, build, tests, lint; then read the lockfile diff for unexpected changes. | JSUP-009, JSUP-002 |
| Should I delete `package-lock.json` to fix an install? | No: regenerating changed 76 of 532 locked versions in one of our repos and 34 of 761 in another, against 0 when kept. | JSUP-010 |
| How do I resolve a `package-lock.json` conflict on rebase? | Resolve `package.json` by hand, then `npm install --package-lock-only` with the conflict markers still in the lockfile: npm merges both sides, best effort, so read the diff. Then `npm ci`. | JSUP-011 |
| What does Dependabot do by default? | Weekly on Monday (random time, UTC), 5 open version PRs, a 3-day cooldown on version updates since 2026-07-14 (security updates exempt), automatic rebases for 30 days. | JSUP-012 |
| Which Dependabot PRs are safe to auto-merge? | GitHub's example merges patch updates of one named dependency, behind required status checks. Merging deploys in our repos, so we don't. | JSUP-013 |
| How should an agent triage a Dependabot PR? | Read the PR body's release notes, check peer ranges and CI, run it locally only if CI can't show the effect; `@dependabot rebase`, `recreate` or `ignore`. `@dependabot merge` and `close` stopped working on 2026-01-27. | JSUP-014 |
| What if the version in use is newer than the model's training? | Current models' knowledge cutoff is June 2026. Read the installed package's types and changelog and the vendor's migration guide as raw markdown or llms.txt; treat remembered APIs as leads. | JSUP-015 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| JSUP-001 | Before a bump: versions, dates and peer ranges from the registry | recommendation | npm-view, npm-outdated, peer-dependencies, versions |
| JSUP-002 | npm overrides a peer range with only a warning in an existing repo | fact | peer-dependencies, eresolve, strict-peer-deps, npm-ls |
| JSUP-003 | Official migration tools on our stack, and what they leave to you | comparison | migrations, nest-upgrade, eslint-codemods, vitest, node-codemods |
| JSUP-004 | Codemod, type-aware rename or agent edit: which for which change | recommendation | codemods, refactoring, lsp, rename |
| JSUP-005 | ast-grep, ts-morph and jscodeshift: what each sees and how it runs | comparison | ast-grep, ts-morph, jscodeshift, codemods |
| JSUP-006 | Having an agent write and run a codemod | pattern | codemods, workflow, verification |
| JSUP-007 | What published LLM-assisted migrations did: Google, Airbnb, Anthropic | fact | llm-migrations, google, case-studies |
| JSUP-008 | Splitting a major upgrade into PRs | pattern | major-upgrades, pull-requests, commits |
| JSUP-009 | Verifying an upgrade: clean `npm ci`, `npm ls --all`, build and tests | recommendation | verification, npm-ci, clean-checkout |
| JSUP-010 | Deleting `package-lock.json` to fix an install | anti-pattern | lockfile, package-lock, npm-install |
| JSUP-011 | Resolving `package-lock.json` conflicts on rebase | pattern | lockfile, rebase, merge-conflicts |
| JSUP-012 | Dependabot options for npm and GitHub Actions | fact | dependabot, groups, cooldown, schedule |
| JSUP-013 | Dependabot auto-merge: GitHub's recipe and what it needs | recommendation | dependabot, auto-merge, fetch-metadata |
| JSUP-014 | Triaging a Dependabot PR | pattern | dependabot, triage, comment-commands |
| JSUP-015 | When the model's training predates the versions in use | recommendation | knowledge-cutoff, docs, llms-txt |

## [JSUP-001] Before a bump: versions, dates and peer ranges from the registry
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm-outdated](https://docs.npmjs.com/cli/v11/commands/npm-outdated), [npm-view](https://docs.npmjs.com/cli/v11/commands/npm-view), [npm-ls](https://docs.npmjs.com/cli/v11/commands/npm-ls), [npm-explain](https://docs.npmjs.com/cli/v11/commands/npm-explain)
- Related: TS-015, JSUP-002, JSUP-015, TOK-042

Read the registry, not memory, and pick the queries that return little.

```bash
npm outdated                                   # Current, Wanted (max in your range), Latest (the dist-tag)
npm view <pkg> dist-tags                       # latest, next, and lines like Angular's v21-lts
npm view <pkg> "time[<version>]"               # one publish date
npm view <pkg>@<target> peerDependencies peerDependenciesMeta --json
npm ls <pkg>                                   # who pulls it in, compact
```

- `npm outdated` exits 1 when anything is outdated, so a script shouldn't read that as a failure.
- `peerDependenciesMeta` marks optional peers: `@angular/compiler-cli` 22.2.3 declares `typescript` `optional: true`, which changes what `npm ci` catches (JSUP-002).
- Avoid `npm view <pkg> time --json`: for `typescript` it printed 3,863 lines (198,668 characters), past the Bash tool's roughly 30,000 inline characters (TOK-042). `npm view <pkg>@<v> time` also returns "all version-time pairs" (npm docs).
- Prefer `npm ls <pkg>` to `npm explain <pkg>`: for `typescript` beside typescript-eslint 8.71.2, 21 lines against 260 (16,690 characters).

Then read the migration guide of every major you cross (JSUP-003, JSUP-015).

Tested 2026-10-17, npm 11.19.0, Node 24.21.0, a scratch project with typescript 6.0.3, eslint 9.39.5 and typescript-eslint 8.71.2: the sizes above; `npm outdated` listed eslint (latest 10.13.0) and typescript (latest 7.0.2) with exit 1.

## [JSUP-002] npm overrides a peer range with only a warning in an existing repo
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm config: strict-peer-deps](https://docs.npmjs.com/cli/v11/using-npm/config#strict-peer-deps), [npm-ls](https://docs.npmjs.com/cli/v11/commands/npm-ls), [npm/cli#4664](https://github.com/npm/cli/issues/4664)
- Related: TS-011, NG-002, JSUP-009

In our tests, bumping one package past a peer range in an installed repo succeeded. npm's `strict-peer-deps` (default `false`): conflicting peers "deep in the dependency graph will be resolved using the nearest non-peer dependency specification… a warning is printed". npm's source can still raise `ERESOLVE` for a project's own dependencies, so the table is observed, not guaranteed.

Tested 2026-10-17, npm 11.19.0 and npm 12.2.0, Node 24.21.0, with typescript 6.0.3 installed:

| Command | Result |
|---|---|
| `npm install -D typescript@latest` beside typescript-eslint 8.71.2 (peer `<6.1.0`) | exit 0, 8 × `ERESOLVE overriding peer dependency`, `package.json` now `^7.0.2` |
| The same beside `@angular/compiler-cli` 22.2.3 (optional peer `>=6.0 <6.1`) | exit 0, 1 warning |
| With `--strict-peer-deps`, beside typescript-eslint | exit 1, `ERESOLVE`, nothing changed |
| With `--strict-peer-deps`, beside Angular | exit 0, 1 warning: an optional peer isn't enforced |
| `--dry-run` | exit 0 |
| Both installed together in an empty project | exit 1, `ERESOLVE unable to resolve dependency tree` |

Afterwards `npm ls` exits 0 (top level only), while `npm ls --all` exits 1: `ELSPROBLEMS`, `invalid: ">=4.8.4 <6.1.0" from node_modules/typescript-eslint`. A fresh `npm ci` fails with `ERESOLVE` on typescript-eslint's required peer (a maintainer in npm/cli#4664, 2022: "This should have always been an error") but passes Angular's optional one; only the build catches that (TS-009).

So after any bump, run `npm ls --all`; `--strict-peer-deps` helps only for required peers.

## [JSUP-003] Official migration tools on our stack, and what they leave to you
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Nest CLI usages: nest upgrade](https://docs.nestjs.com/cli/usages), [nest-cli upgrade.command.ts at 12.0.8](https://github.com/nestjs/nest-cli/blob/12.0.8/commands/upgrade.command.ts), [ESLint configuration migration guide](https://eslint.org/docs/latest/use/configure/migration-guide), [Migrate to ESLint v10](https://eslint.org/docs/latest/use/migrate-to-10.0.0), [ESLint version support](https://eslint.org/version-support/), [Vitest migration guide](https://vitest.dev/guide/migration), [Jest migration guide](https://jestjs.io/docs/migration-guide), [nodejs/userland-migrations](https://github.com/nodejs/userland-migrations), [Node.js blog: v22 to v24 migrations](https://nodejs.org/en/blog/migrations/v22-to-v24)
- Related: NG-010, JSUP-004, JSUP-008

Run the vendor's tool first; each says it isn't the whole job.

| Package | Tool | Left to you |
|---|---|---|
| Angular | `ng update`, `ng generate @angular/core:<migration>` | Optional migrations without a TTY, and the opt-outs it writes (NG-010) |
| NestJS | `nest upgrade` (alias `nest update`, `--dry-run`), in `@nestjs/cli` 12 | "deliberately does not migrate your project to ESM, Vitest, or oxlint"; prints notes on what "can't be migrated automatically" (lifecycle hook order, pipe signatures); update a global CLI first |
| ESLint | `npx @eslint/migrate-config .eslintrc.json`; `npx codemod @eslint/v9-to-v10` | Migrator output "is not guaranteed to work immediately"; `.eslintrc.js` keeps only evaluated data; "Codemods are a starting point" |
| Node.js | `npx codemod @nodejs/<recipe>` (40 recipe folders) | The `v22-to-v24` recipe "is on `v0.0.X` because there are missing parts"; no `v24-to-v26` recipe |
| Vitest | Migration guide, plus a copyable agent prompt | Jest to Vitest is manual (no official codemod) |
| Jest 30 | Upgrade guide | Manual; `jest-codemods` is third-party and migrates other runners to Jest |
| typescript-eslint | None found | Peer ranges (TS-009) |

`nest upgrade` also bumps TypeScript to 6 and `engines.node` to `>=20.19.0`. ESLint 9 "reached end-of-life on 2026-08-06". Both codemod sets say to commit first. Node's README writes `npx codemod @nodejs/<recipe>`, its v22-to-v24 blog post `npx codemod run @nodejs/<recipe>`; neither was run here.

## [JSUP-004] Codemod, type-aware rename or agent edit: which for which change
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Tools reference: LSP tool behavior](https://code.claude.com/docs/en/tools-reference), [Best practices](https://code.claude.com/docs/en/best-practices), [ast-grep FAQ](https://ast-grep.github.io/advanced/faq.html), [ts-morph: renaming](https://ts-morph.com/manipulation/renaming), [How is Google using AI for internal code migrations?](https://arxiv.org/abs/2501.06972)
- Related: JSUP-005, JSUP-006, JSUP-007, ORCH-012, TOK-041

Pick the tool by what the change needs to know.

| Change | Use |
|---|---|
| A vendor migration exists | It first (JSUP-003) |
| Rename or move one symbol or file across the project | ts-morph `rename()` or `move()`: it follows references through the type checker |
| One syntax pattern, many places, no types needed | ast-grep `run -p … -r …`, or a YAML rule with `fix` |
| Edits that vary by context (an API whose semantics changed) | The agent, per file, from a discovery list, behind a build-and-test gate |
| Many files of any kind | `/batch` (ORCH-012) or a `claude -p` loop |

Claude Code's LSP tool can find references but not rename: its docs list definition, references, type information, symbols, workspace search, implementations and call hierarchy. Google's experience report: "The use of LLMs alone through simple prompting is not sufficient for anything but the simplest of migrations"; locating and validating changes "are handled mostly using deterministic AST techniques".

Tested 2026-10-17, Claude Code 2.1.296: this session's LSP tool schema offers nine operations and no rename. Same day, `@ast-grep/cli` 0.51.0 and `ts-morph` 28.0.0 renaming exported `getUser` used across two files: the pattern `getUser($$$A)` also rewrote a call to a shadowing local `getUser` and missed the declaration and the import; `rename()` changed the declaration, import and call, left the local alone, and type-checked clean.

## [JSUP-005] ast-grep, ts-morph and jscodeshift: what each sees and how it runs
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [ast-grep CLI: run](https://ast-grep.github.io/reference/cli/run.html), [ast-grep: rewrite code](https://ast-grep.github.io/guide/rewrite-code.html), [ast-grep FAQ](https://ast-grep.github.io/advanced/faq.html), [ts-morph docs](https://ts-morph.com/), [jscodeshift README](https://github.com/facebook/jscodeshift/blob/main/README.md), npm registry
- Related: JSUP-004, JSUP-006, TS-009

| | ast-grep 0.51.0 | ts-morph 28.0.0 | jscodeshift 17.4.0 |
|---|---|---|---|
| Sees | Syntax (tree-sitter); FAQ: scope and type analysis "**NO**" | Types, via the TypeScript language service (bundles 6.0.2) | Syntax (recast, Babel parsers) |
| Preview | `ast-grep run -p '<pattern>' -r '<rewrite>' -l ts` prints a diff | Nothing written until `save()` | `--dry --print` |
| Apply | `-U` (`--update-all`), or `-i` to accept one by one | `project.save()` | Without `--dry` |
| TypeScript | `ts` and `tsx` are separate languages | Native | `--parser=ts` or `tsx`, plus `--extensions` (default `js`) |
| Rules and tests | YAML rules with `fix`, `ast-grep scan`, `ast-grep test` | A script | Transform module `(fileInfo, api, options)` |

Gotchas:
- ast-grep: `-r` means `--rewrite` in `run` but `--rule` in `scan`; "Pattern code must be valid code that tree-sitter can parse". 0.51.0 prints "`sg` is deprecated. Use `ast-grep` instead.", while the quick start still offers `sg`. The ast-grep org publishes a search-only MCP server and a Claude Code plugin (`ast-grep/agent-skill`).
- ts-morph re-parses after each manipulation: "Analyze then Manipulate". `rename()` skips comments and strings by default. It bundles TypeScript 6.0, so it can't drive TypeScript 7 (TS-009).
- jscodeshift: last commit 2026-10-13, so maintained.

Tested 2026-10-17, ast-grep 0.51.0 and ts-morph 28.0.0, Node 24.21.0: the `sg` warning, and ts-morph reporting TypeScript 6.0.2.

## [JSUP-006] Having an agent write and run a codemod
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Best practices: fan out](https://code.claude.com/docs/en/best-practices), [eslint/codemods README](https://github.com/eslint/codemods), [nodejs/userland-migrations README](https://github.com/nodejs/userland-migrations), [How Anthropic runs large-scale code migrations with Claude Code](https://claude.com/blog/ai-code-migration)
- Related: JSUP-004, JSUP-005, JSUP-008, FLOW-011, ORCH-012

1. **Discover first.** Save the list of sites (`ast-grep run … --json`, `rg`, or LSP `findReferences`) to a file with a count; it is the work queue and the later check.
2. **Write the transform in the scratchpad**, not the repo, and preview it: ast-grep without `-U`, jscodeshift `--dry --print`, ts-morph without `save()`.
3. **Try 2–3 files and fix the transform**, as the best-practices page says for `claude -p` loops: "Refine your prompt based on what goes wrong with the first 2-3 files, then run on the full set." For an ast-grep rule, add cases to `ast-grep test`.
4. **Run it on a clean tree**: eslint/codemods "Run them only on Git-tracked files, and commit or stash changes first" (in our worktrees, commit, never stash).
5. **Commit the codemod's output alone**, with the command in the message, then the hand fixes. A reviewer can rerun the first commit and read only the second (our convention, not a vendor rule).
6. **Let the build decide.** Type-check, build and test; mark what the transform can't handle, as Anthropic's migrations did with `// TODO(port): <reason>`. Anthropic: "Let scripts — a compiler, a diff, a test suite — be the referee."

Re-run discovery afterwards: zero remaining sites is the done-when.

## [JSUP-007] What published LLM-assisted migrations did: Google, Airbnb, Anthropic
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-17
- Sources: [How is Google using AI for internal code migrations? (arXiv 2501.06972)](https://arxiv.org/abs/2501.06972), [Migrating Code At Scale With LLMs At Google (arXiv 2504.09691)](https://arxiv.org/abs/2504.09691), [Airbnb: Accelerating large-scale test migration with LLMs](https://airbnb.tech/ai-ml/accelerating-large-scale-test-migration-with-llms/), [How Anthropic runs large-scale code migrations with Claude Code](https://claude.com/blog/ai-code-migration)
- Related: JSUP-004, JSUP-006, REPO-019

Each is the company's own report, so each figure is single-source.

- **Google, 2025-01-12** (an experience report, "not a research study"): the LLM generates edits; finding and validating them stay "mostly" deterministic. In a JUnit3 to JUnit4 migration, "5,359 files modifying more than 149,000 lines of code in 3 months", "~87% of the code generated by AI ended up committed without any change"; "The bottleneck in the process was the speed at which engineers could review the changes."
- **Google, 2025-04-13**: 39 migrations over twelve months, "595 code changes with 93,574 edits… 74.45% of the code changes and 69.46% of the edits were generated by the LLM". Validation ran cheapest first (AST parse, build, test), then human review. The "50% time savings is based on developer perception", and developers handled 25.55% of changes by hand.
- **Airbnb**: "nearly 3.5K React component test files from Enzyme to … React Testing Library" in 6 weeks against an estimated 1.5 years; each file moved through a state machine of validated steps with retries; 75% in four hours, 97% after four days of tuning, the rest by hand.
- **Anthropic, 2026-07-16**: language ports with a "judge" in place first, a rulebook, a mechanical, resumable work queue and adversarial review. It points framework upgrades to the code-modernization plugin (REPO-019).

None used a hand-written codemod for the edits themselves.

## [JSUP-008] Splitting a major upgrade into PRs
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Angular versioning and releases](https://angular.dev/reference/releases), [Angular CLI: ng update](https://angular.dev/cli/update), [Nest CLI usages: nest upgrade](https://docs.nestjs.com/cli/usages), [osrs-tracker-api skill](https://github.com/osrs-tracker/osrs-tracker-api/blob/main/.claude/skills/osrs-tracker-api/SKILL.md)
- Related: JSUP-003, JSUP-006, JSUP-009, NG-010, TS-004, SESS-021

1. **Prep PR on the old version.** Fix the deprecations the next major removes while the old version still warns (for TypeScript, TS-004).
2. **One major of one package family per PR.** A family is what must move together: `@angular/*` with `angular-eslint`; `@nestjs/*`; `typescript` with typescript-eslint. Angular: "perform each update one major version at a time." osrs-tracker-api upgrades majors "by hand from an issue, together with whatever must move with them (e.g. NestJS 12 needed TypeScript 6)".
3. **Separate commits inside it**: the version bump plus the tool's migrations (`ng update --create-commits`: "Create source control commits for updates and migrations."), then hand fixes, then the opt-outs you remove (NG-010).
4. **Optional adoptions later**, each in its own PR: Nest's ESM, Vitest and oxlint, which `nest upgrade` leaves for "existing projects can adopt them on their own schedule"; Angular's optional migrations.
5. **Keep minors and patches out**; Dependabot or a separate PR handles them (JSUP-012).

Each PR passes CI on its own (JSUP-009), so a failure points at one step. Rebase before pushing: a conflicting PR runs no `pull_request` CI (SESS-021).

## [JSUP-009] Verifying an upgrade: clean `npm ci`, `npm ls --all`, build and tests
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm-ci](https://docs.npmjs.com/cli/v11/commands/npm-ci), [npm-ls](https://docs.npmjs.com/cli/v11/commands/npm-ls), [osrs-tracker-api skill](https://github.com/osrs-tracker/osrs-tracker-api/blob/main/.claude/skills/osrs-tracker-api/SKILL.md), [Best practices: verification](https://code.claude.com/docs/en/best-practices)
- Related: JSUP-002, FLOW-011, FLOW-013, SESS-008

Check from a clean install, because the upgrade is a change to what gets installed:

1. **A clean checkout.** A worktree under `.claude/worktrees/` resolves the main checkout's `node_modules` (SESS-008), so its build can pass on the old packages. osrs-tracker-api's skill: commit, `git worktree add <scratchpad>/build-check HEAD`, run `npm ci && npm run build` there, then remove it.
2. **`npm ci`**: it fails when `package.json` and the lockfile disagree, and on a required-peer conflict.
3. **`npm ls --all`**: catches the optional-peer conflicts that `npm ci` lets through (JSUP-002).
4. **Type-check, build, tests, lint**, and start the app where a build can't show the change (FLOW-013's `/run`).
5. **Read the lockfile diff**: `git diff --stat`, then the changed `"version"` lines. A one-package bump that moves dozens of unrelated packages was probably a regenerated lockfile (JSUP-010).
6. **Grep the build and test output for deprecation warnings**: they list the next major's work.

Report the commands and their results (FLOW-011). Our `verify.sh` scripts already run lint, tests and the production build; web's also runs `npm ls --all` against the main checkout when in a worktree.

## [JSUP-010] Deleting `package-lock.json` to fix an install
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm-install](https://docs.npmjs.com/cli/v11/commands/npm-install), [npm-update](https://docs.npmjs.com/cli/v11/commands/npm-update)
- Related: JSUP-009, JSUP-011

Deleting the lockfile (and `node_modules`) and running `npm install` re-resolves every transitive dependency to the newest version in range, so a one-line fix arrives with dozens of unreviewed upgrades. npm: "When the lockfile's versions satisfy the `package.json` ranges, the lockfile wins."

Tested 2026-10-17, npm 11.19.0, Node 24.21.0, `npm install --package-lock-only --ignore-scripts` on the lockfiles of `main`:

| Repo | Locked packages | Lockfile kept | Lockfile deleted |
|---|---|---|---|
| osrs-tracker-api (lockfile last changed 2026-10-14) | 532 | 0 changed | 76 changed, 13 added, 12 removed |
| osrs-tracker-web (changed 2026-10-17) | 761 | 0 changed | 34 changed, 36 added, 1 removed |

Instead:
- One package: `npm install <pkg>@<version>`.
- Within ranges on purpose: `npm update <pkg>` ("will not update the semver values of direct dependencies in your project `package.json`" by default).
- A broken `node_modules`: delete only `node_modules` and run `npm ci`.
- A lockfile conflict: JSUP-011.

## [JSUP-011] Resolving `package-lock.json` conflicts on rebase
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [npm v6 docs: resolving lockfile conflicts](https://docs.npmjs.com/cli/v6/configuring-npm/package-locks), [npm/cli#6989](https://github.com/npm/cli/issues/6989), [parse-conflict-json](https://github.com/npm/parse-conflict-json), [git-checkout: --ours and --theirs](https://git-scm.com/docs/git-checkout)
- Related: JSUP-010, SESS-025, JSUP-014

When both branches changed dependencies, a rebase conflicts in `package-lock.json` and often `package.json`. Don't hand-edit the lockfile.

1. Resolve `package.json` by hand, keeping both sides' dependencies.
2. Run `npm install --package-lock-only` with the conflict markers still in `package-lock.json`. npm merges both sides.
3. Read the lockfile's diff: where both sides changed one package, the parser keeps "ours", which in a rebase is upstream; rerun your install if your version was lost.
4. `npm ci`, then the checks (JSUP-009), then `git add` and `git rebase --continue`.

npm 6's docs: "As of `npm@5.7.0`, these conflicts can be resolved by manually fixing any `package.json` conflicts, and then running `npm install [--package-lock-only]` again." npm 7 and later docs dropped this, but npm 11's arborist still parses lockfiles with `parse-conflict-json`; a reply on npm/cli#6989 (2023, still open): "It does have some functionality but it's a best effort." If it fails (that issue's `must provide string spec`, on a diff3-style conflict), use the alternative.

Alternative: take upstream's lockfile and rerun your branch's install command. During a rebase the sides are swapped: "`--ours` gives the version from the branch the changes are rebased onto, while `--theirs` gives the version from the branch that holds your work".

Tested 2026-10-17, npm 11.19.0, git 2.43.0: two branches adding `picocolors` and `ms` to a lockfile with `semver`; the rebase conflicted in both files; after step 1, step 2 exited 0, removed the markers and kept all three packages; `npm ci` passed.

## [JSUP-012] Dependabot options for npm and GitHub Actions
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Dependabot options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference), [Changelog 2026-07-14: default package cooldown](https://github.blog/changelog/2026-07-14-dependabot-version-updates-introduce-default-package-cooldown), [dependabot-core github_actions file fetcher](https://github.com/dependabot/dependabot-core/blob/main/github_actions/lib/dependabot/github_actions/file_fetcher.rb)
- Related: JSUP-013, JSUP-014, SESS-024

- **Cooldown**: since 2026-07-14, "a **default cooldown period of 3 days** to version updates, even when `cooldown` is not configured… **This default cooldown does not apply to security updates.**" `cooldown` sets `default-days` and, for npm, `semver-major-days`/`-minor-`/`-patch-`; GitHub Actions takes `default-days` only. Days must be 1 to 90.
- **Schedule**: `weekly` runs "by default on Monday", `daily` on weekdays, at a random time in UTC unless `time` and `timezone` are set; `interval: cron` takes a `cronjob`.
- **Limits**: 5 open version PRs by default; `open-pull-requests-limit: 0` disables version updates; security PRs have "a separate, fixed limit of 10".
- **Groups**: a dependency joins "the first group that it matches"; `patterns`, `exclude-patterns`, `dependency-type` (npm), `update-types` (`minor`, `patch`, `major`), and `applies-to` (`version-updates` by default, or `security-updates`). `group-by: dependency-name` makes one PR per dependency across `directories`.
- **Ignore**: `update-types` takes `version-update:semver-major`, a different vocabulary from groups.
- **Directories**: `directories` "supports globbing"; `directory` doesn't. For Actions, `/` covers `.github/workflows` and a root `action.yml`, so composite actions need `/.github/actions/*` too (non-root directories are read one level deep, per dependabot-core). Local `./` action references are ignored; SHA pins and same-line version comments are updated.

Our three app repos follow the patterns: npm security-only (limit 0 with `applies-to: security-updates` groups) or grouped minor-and-patch with majors ignored; Actions over `['/', '/.github/actions/*']`; Docker digests with Node majors ignored.

## [JSUP-013] Dependabot auto-merge: GitHub's recipe and what it needs
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Automating Dependabot with GitHub Actions](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/automate-dependabot-with-actions), [Troubleshooting Dependabot on GitHub Actions](https://docs.github.com/en/code-security/reference/supply-chain-security/troubleshoot-dependabot/dependabot-on-actions), [Changelog 2021-10-06: Dependabot runs respect `permissions`](https://github.blog/changelog/2021-10-06-github-actions-workflows-triggered-by-dependabot-prs-will-respect-permissions-key-in-workflows/), [dependabot/fetch-metadata README](https://github.com/dependabot/fetch-metadata/blob/main/README.md)
- Related: JSUP-012, JSUP-014, SESS-024, SURF-002

GitHub's example "automerges all patch updates to `my-dependency`": on `pull_request` with `permissions: contents: write, pull-requests: write`, a job limited to `dependabot[bot]` runs `dependabot/fetch-metadata` and, when `update-type == 'version-update:semver-patch'`, `gh pr merge --auto --merge "$PR_URL"`.

What it needs:
- Repo setting "Allow auto-merge", and "**Require status checks to pass before merging**" on the target branch: without required checks there is nothing to wait for.
- fetch-metadata's `update-type` is "The highest semver change being made by this PR", so a grouped PR is gated by its largest bump. Outputs fill only for PRs whose commits are all Dependabot's.
- Tokens: Dependabot-triggered `pull_request` runs get "a read-only `GITHUB_TOKEN`" by default and only Dependabot secrets. GitHub's troubleshooting page: "You can use the `permissions` key in your workflow to increase the access for the token"; the 2021-10-06 changelog made it so: such runs "will begin to respect the permissions specified in your workflows". fetch-metadata's README still says they can't write and uses `pull_request_target`, which "runs in the context of the default branch of the base repository". Untested; prefer `permissions` on `pull_request`.

Safe to auto-merge: patch (and perhaps minor) updates of dev tooling, behind required CI that builds and tests. Not majors, and not where merging deploys without someone reading the release notes.

## [JSUP-014] Triaging a Dependabot PR
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [About Dependabot version updates](https://docs.github.com/en/code-security/concepts/supply-chain-security/about-dependabot-version-updates), [Dependabot pull request comment commands](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-pull-request-comment-commands), [Changelog 2026-01-27: comment command changes](https://github.blog/changelog/2026-01-27-changes-to-github-dependabot-pull-request-comment-commands/), [Dependabot options reference: rebase-strategy](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
- Related: JSUP-001, JSUP-002, JSUP-013, DOC-018

GitHub's flow: "You check that your tests pass, review the changelog and release notes included in the pull request summary, and then merge it." For an agent:

1. **Read the PR body**: release notes, changelog and commits for each bump in a group.
2. **Check peer ranges** of the new versions against the repo (JSUP-001); CI's `npm ci` catches required-peer breaks but not optional ones (JSUP-002).
3. **Read CI.** Run it locally only when CI can't show the effect (a runtime path without tests).
4. **Decide**: merge (with `gh pr merge`), or `@dependabot ignore this major version` with the reason in a comment, or move a breaking bump into a planned upgrade (JSUP-008).
5. **Follow-ups**: our repos add a CHANGELOG line only when a bump changes behaviour (DOC-018).

Commands that still work: `@dependabot rebase`, `@dependabot recreate` ("overwriting any edits"), the `ignore` and `unignore` forms, `show <dependency> ignore conditions`. Since 2026-01-27 "These comment commands are no longer supported": `@dependabot merge`, `cancel merge`, `squash and merge`, `close` and `reopen`; use the UI or `gh`.

Dependabot rebases its own conflicting PRs, but stops after 30 days unmerged, or once extra commits are pushed, unless their messages contain `[dependabot skip]` (it then force-pushes over them).

## [JSUP-015] When the model's training predates the versions in use
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview), [Best practices](https://code.claude.com/docs/en/best-practices), [Vitest migration guide source](https://github.com/vitest-dev/vitest/blob/main/docs/guide/migration/index.md), [docs.nestjs.com/llms.txt](https://docs.nestjs.com/llms.txt)
- Related: ORCH-026, TS-015, TOK-090, TOK-095, TOK-096, PROMPT-020, JSUP-001

Opus 5.5, Sonnet 5.5 and Haiku 5.5 list "Reliable knowledge cutoff" and "Training data cutoff" as Jun 2026. Since then: TypeScript 7.0.2 (2026-07-08), Dependabot's default cooldown (2026-07-14), ESLint 9's end of life (2026-08-06), Nest CLI 12 with `nest upgrade` (2026-08-27), Vitest 5 (2026-09-03). Treat a remembered API, flag or default as a lead.

Read, in this order:
1. **What is installed**: `node_modules/<pkg>/package.json` for the version, its `.d.ts` files (or the LSP tool's hover) for the API, its `CHANGELOG.md` if shipped.
2. **The registry** (JSUP-001).
3. **The vendor's migration guide as raw text.** On 2026-10-17 angular.dev, docs.nestjs.com, vitest.dev and nodejs.org served `/llms.txt` (an index, TOK-090); docs.nestjs.com publishes each page with a `.md` suffix. eslint.org, jestjs.io and typescript-eslint.io returned 404; their docs are Markdown in their GitHub repos.

Vitest ships its own agent prompt: "Migrate to Vitest 5. Fetch the migration guide from https://vitest.dev/guide/migration.md and apply appropriate changes. Do not touch more files than necessary for the migration."

Claude Code's docs say only "Give URLs for documentation and API references". context7 can be weeks behind (TOK-095). An error like "is not a function" after a bump means the API changed: read the types before guessing.

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-17 against `main` of osrs-tracker-web, osrs-tracker-api, freek-mencke-web and claude-skills: all three apps are on ESLint 10, Vitest 5 and TypeScript 6.0, Angular 22 or NestJS 12; npm updates are by hand in web and freek-mencke-web and grouped minor-and-patch in api; none auto-merges Dependabot PRs.

1. **Add JSUP-002's check to the Angular upgrade rules being written in [FreekMencke/claude-skills#79](https://github.com/FreekMencke/claude-skills/issues/79)** (high impact, low effort): an existing repo's `npm install -D typescript@latest` only warns, and `npm ci` passes Angular's optional peer, so the rule should be "after any bump, `npm ls --all` exits 0", not "npm refuses". [Added as a comment](https://github.com/FreekMencke/claude-skills/issues/79#issuecomment-6239623606) on that issue. (JSUP-002, NG-010)
2. **Resolve lockfile conflicts with npm, not by hand or by deleting the lockfile** (medium impact, low effort): parallel sessions rebase often. A one-line rule for the global CLAUDE.md's pull-request section, proposed to the user rather than edited here: "`package-lock.json` conflict: resolve `package.json`, run `npm install --package-lock-only` with the markers in place, read the lockfile diff, then `npm ci`." (JSUP-011, JSUP-010)
3. **For NestJS 13, start from `nest upgrade --dry-run`** after updating the global CLI, instead of the old hand-run npm-check-updates flow (JSUP-003). Nothing to change before then.
4. **Keep Dependabot's default 3-day cooldown**; no config needed. Revisit only if a compromised release slips through (JSUP-012).
5. **Won't do: Dependabot auto-merge in our app repos.** Merging deploys them, and a bump that changes behaviour gets a CHANGELOG line that needs judgment (JSUP-013, JSUP-014, DOC-018).
6. **Won't do: add `npm ls --all` to every `verify.sh`.** CI's `npm ci` fails on required-peer conflicts and the production build fails on the TypeScript one; the remaining optional-peer cases are rare (JSUP-002, JSUP-009).

## Open questions

- **Does `pull_request` with `permissions: contents: write` let a Dependabot-triggered auto-merge workflow write?** GitHub's docs and its 2021-10-06 changelog say yes; fetch-metadata's README says use `pull_request_target`. Not tested; needs a probe repo (JSUP-013).
- **How to opt out of Dependabot's default cooldown** ("opt out entirely", per the changelog): the options reference allows 1 to 90 days and doesn't say. Whether `exclude: ["*"]` does it is untested. Also not stated: whether the 3 days count from the git tag for GitHub Actions (JSUP-012).
- **`quarterly`, `semiannually` and `yearly` schedules**: the options reference says they're "only available on GitHub Enterprise Server from version 3.19", while the optimizing tutorial lists them generally.
- **Lockfile conflict merging is undocumented since npm 7** (JSUP-011): tested on npm 11.19.0 only; npm 12 not tested.
- **No measured comparison of a codemod against agent edits** for the same uniform change (cost, errors) was found; Google's and Airbnb's reports have no codemod arm (JSUP-007).
- **Not read:** typescript-eslint's v8 announcement for upgrade notes (no tool found by code search), the `@eslint/migrate-config` 3.0.3 source (the guide may lag it), ast-grep's `agent-skill` SKILL.md body, and whether `nest upgrade` requires a clean git tree.
