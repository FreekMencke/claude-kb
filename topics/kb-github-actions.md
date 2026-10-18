# GitHub Actions: changes and hardening

Prefix `GHA`. This file covers what changed in GitHub Actions between 2025 and 2026-10-17 that an agent trained earlier gets wrong (runner images, Node 24 for actions, the core actions' majors, new syntax and limits), and how to harden a workflow: pinning and lockfiles, token permissions, OIDC to AWS, `pull_request_target` and the cache, script injection, linters, and the incidents behind that advice. `claude-code-action` is in `kb-repo-agents.md` (REPO-027, REPO-038). Issues, rulesets and `gh` are for `kb-github.md` (GH). The registry side of npm trusted publishing and provenance is in `kb-npm.md` (NPM). Dependabot configuration, auto-merge and triage are in `kb-js-upgrades.md` (JSUP-012 to JSUP-014), and pinning a repo's Node version in `kb-nodejs.md` (NODE-014).

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#174, part of roadmap #167) by an Opus 5.5 lead with three Sonnet readers (what changed; supply chain; permissions, identity and triggers) and a Sonnet refuter.
- Read as raw text: GitHub Docs pages as Markdown from `docs.github.com/api/article/body?pathname=…`, 160 GitHub changelog posts (2023-11-01 to 2026-10-15), the core actions' release notes and `action.yml` through `gh api` and `raw.githubusercontent.com`, the runner-images READMEs (image version 20261012), zizmor's docs at v1.31.1, actionlint's at v1.7.12, dependabot-core's source at `main` (v0.400.0), and AWS IAM and npm pages as stripped HTML.
- Tested: read-only REST calls (OIDC subject settings on six of our repos, Actions policies on two) and one observed run annotation. The `gh-actions-lock` binary wasn't run: the session's permission classifier refused it.
- The refuter challenged ten claims the recommendations rest on. It upheld six and qualified four. One part was refuted: `cache-mode: read` doesn't silence the blocked-save warning in any released actions/cache (GHA-019). The lead re-checked that against the actions/cache release and compare data before editing.
- Our workflows were read on 2026-10-17 from `main` of osrs-tracker-web, osrs-tracker-api, osrs-tracker-aws, freek-mencke-web, claude-skills and this repo.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which Ubuntu does `ubuntu-latest` give, and when does it change? | 24.04 on 2026-10-17; it moves to 26.04 (x64) gradually between 2026-10-19 and 2026-11-19, raising the default `node` to 24 and ShellCheck to 0.11.0. Pin `ubuntu-24.04` to stay. | GHA-001 |
| Do actions that declare `node20` still run? | Yes, forced onto Node 24 with a deprecation annotation; the opt-out ended 2026-09-23. `actions/checkout@v4` and `setup-node@v4` are such actions. | GHA-003 |
| Which majors of the core actions are current? | checkout v7.0.1, setup-node v7.1.0, cache v6.1.0, upload-artifact v7.0.2, download-artifact v8.0.2. checkout v7 refuses fork PR code under `pull_request_target`; setup-node v7 drops the dummy `NODE_AUTH_TOKEN`. | GHA-004, GHA-005 |
| What workflow syntax is new? | Parallel steps (`background`, `wait`), `uses: $/path` for same-repo actions, `cache-mode`, `concurrency.queue: max`, `case()`, YAML anchors, schedule `timezone`. | GHA-006 |
| Should I pin actions by tag, SHA or lockfile? | GitHub: a lockfile where adopted, else a full SHA, a tag only for creators you trust. Lockfiles are a public preview (2026-10-14) that zizmor can't read yet; full SHAs with a version comment plus Dependabot work everywhere. An immutable release's tag isn't treated as a SHA pin. | GHA-009, GHA-010, GHA-011 |
| How do I keep SHA-pinned actions current? | Dependabot's `github-actions` ecosystem over `/` and `/.github/actions/*`; it updates SHA pins and their comments, but sends no security alerts for SHA pins. | GHA-012, JSUP-012 |
| What should `permissions:` be? | `contents: read` at the top of every workflow, more per job; any listed scope sets the rest to `none`. Without the key a job gets the repo default, which is read and write in older repos. | GHA-013 |
| When do I need a GitHub App token instead of `GITHUB_TOKEN`? | Other repos, org resources, or a push or PR that must start workflows without approval. Use `actions/create-github-app-token` v3 with `permission-*` inputs; tokens are now about 520 characters. | GHA-014 |
| How should an AWS trust policy for GitHub OIDC look? | `aud` = `sts.amazonaws.com` and a `sub` condition naming the repo and branch or environment; IAM rejects a missing or wildcard-only `sub`. `configure-aws-credentials` v6.3.0; no thumbprint. | GHA-015 |
| Why does `AssumeRoleWithWebIdentity` fail in a new or renamed repo? | Repos created after 2026-07-15, or renamed or transferred since, send `repo:OWNER@ID/REPO@ID:…`. List both formats in the `sub` condition, then drop the old one. | GHA-016 |
| Is `pull_request_target` still dangerous, and what changed? | Yes if it runs PR code. Since 2025-12-08 it always runs the default branch's workflow; checkout refuses fork code (2026-07-20); the cache is read-only for it (2026-06-26); public repos block it by default from 2026-11-02. | GHA-017, GHA-018, GHA-021 |
| Can an untrusted run poison the Actions cache? | Not the default branch's scope from `pull_request_target`, `issue_comment` or `workflow_run` since 2026-06-26, unless the workflow sets `cache-mode: write`. Release jobs still shouldn't restore shared caches. | GHA-019, GHA-024 |
| How do I avoid script injection? | Never put `${{ github.event.* }}` text in `run:`; pass it through `env:` and quote `"$VAR"`. Redaction of secrets is best effort. | GHA-020 |
| Which workflow linter should be a required check? | zizmor (pinning, injection, permissions, triggers, cache poisoning), with `advanced-security: false` so findings fail the job; actionlint as a cheap second. Scorecard and harden-runner aren't PR gates. First-rollout findings and inline ignores: GHA-025. | GHA-023, GHA-025 |
| How should CI handle agent PRs that push often? | Cancel superseded PR runs by `head_ref`, never deploys; cache dependencies; skip work with a changes job and an `if: always()` aggregate job as the one required check. | GHA-008 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| GHA-001 | Runner labels on 2026-10-17, and `ubuntu-latest` moving to Ubuntu 26.04 | fact | runners, ubuntu-26-04, ubuntu-latest, shellcheck |
| GHA-002 | `ubuntu-slim` and arm64 standard runners: specs, limits, when to use | fact | runners, ubuntu-slim, arm64 |
| GHA-003 | Node 20 is gone from the runners: `node20` actions are forced onto Node 24 | fact | node-24, node20, deprecation, runners |
| GHA-004 | Core action majors on 2026-10-17: checkout v7, setup-node v7, cache v6, artifacts v7 and v8 | fact | actions-checkout, actions-cache, artifacts, upgrades |
| GHA-005 | setup-node v5 to v7: automatic npm caching, ESM, no dummy `NODE_AUTH_TOKEN` | fact | setup-node, caching, publishing |
| GHA-006 | Workflow syntax added since 2025: parallel steps, `$/`, `cache-mode`, `queue`, `case()` | fact | syntax, parallel-steps, concurrency, expressions |
| GHA-007 | Limits and retention that changed in 2025–2026 | fact | limits, retention, cache, reruns |
| GHA-008 | CI for agent-driven PRs: cancel superseded runs, cache dependencies, keep required checks reporting | pattern | concurrency, required-checks, caching, agents |
| GHA-009 | Pinning actions: tag, full SHA, immutable release or lockfile | comparison | pinning, sha-pinning, supply-chain, policy |
| GHA-010 | Workflow lockfiles with `gh actions-lock` (public preview) | tool | lockfile, gh-actions-lock, pinning |
| GHA-011 | Immutable releases: what they lock, and why a tag still isn't a SHA pin | fact | immutable-releases, attestations, pinning |
| GHA-012 | Dependabot for action pins: what it updates, skips and doesn't alert on | fact | dependabot, pinning, composite-actions, lockfile |
| GHA-013 | `GITHUB_TOKEN` permissions: defaults, the `permissions` key and what the token can't start | recommendation | github-token, permissions, least-privilege |
| GHA-014 | GitHub App installation tokens: when, how to scope, and the 520-character format | fact | github-app, tokens, create-github-app-token |
| GHA-015 | OIDC to AWS: trust policy conditions and `configure-aws-credentials` v6 | recommendation | oidc, aws, iam, trust-policy |
| GHA-016 | Immutable OIDC `sub` claims: which repos send them, and moving a trust policy over | fact | oidc, sub-claim, aws, trust-policy |
| GHA-017 | `pull_request_target` and `workflow_run`: what GitHub changed from 2025-12 to 2026-11 | fact | pull-request-target, workflow-run, forks, checkout |
| GHA-018 | When `pull_request_target` or `workflow_run` is still safe | recommendation | pull-request-target, workflow-run, pwn-request |
| GHA-019 | Cache poisoning, read-only cache tokens and `cache-mode` | fact | cache, cache-poisoning, cache-mode |
| GHA-020 | Script injection and secrets: untrusted input goes through `env:` | recommendation | script-injection, secrets, redaction |
| GHA-021 | Fork PR approvals and workflow execution protections | fact | fork-prs, approvals, actions-policies, execution-protections |
| GHA-022 | npm trusted publishing: the workflow side | recommendation | npm, trusted-publishing, oidc, provenance |
| GHA-023 | Workflow linters and hardening tools: zizmor, actionlint, CodeQL, harden-runner, Scorecard | comparison | zizmor, actionlint, codeql, harden-runner, scorecard |
| GHA-024 | Incidents 2024–2026 and the control that would have stopped each | fact | incidents, tj-actions, ultralytics, tanstack, supply-chain |
| GHA-025 | Rolling out zizmor: the findings every repo gets, and inline ignores | pattern | zizmor, artipacked, dependabot-cooldown, dangerous-triggers, inline-ignores |

## [GHA-001] Runner labels on 2026-10-17, and `ubuntu-latest` moving to Ubuntu 26.04
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [GitHub-hosted runners reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners), [runner-images README](https://raw.githubusercontent.com/actions/runner-images/main/README.md), [runner-images#14748](https://github.com/actions/runner-images/issues/14748), [runner-images#14254](https://github.com/actions/runner-images/issues/14254), [Changelog 2026-09-17: Ubuntu 26 GA](https://github.blog/changelog/2026-09-17-ubuntu-26-generally-available-and-latest-migration), [Ubuntu 26.04 image readme](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2604-Readme.md)
- Related: GHA-002, GHA-003, NODE-014

On 2026-10-17 `ubuntu-latest` is still Ubuntu 24.04. It "will migrate from Ubuntu 24.04 to Ubuntu 26.04" gradually "between October 19 and November 19, 2026" (x64 only; arm has no `-latest` label). Labels: `ubuntu-26.04`, `ubuntu-24.04`, `ubuntu-22.04`, the same with `-arm`, and `ubuntu-slim` (GHA-002).

- **Pin** with `runs-on: ubuntu-24.04` to stay, or `ubuntu-26.04` to test early. A floating label changes the OS under you during the window, so a red run then may be the image, not your change.
- **What changes for Node CI** (image readmes, versions 20261012): the default `node` on `PATH` goes from 22.23.3 to 24.21.0, npm from 10.9.9 to 11.19.0, Python from 3.12.3 to 3.14.4, ShellCheck from 0.9.0 to 0.11.0 (newer checks can fail a lint step), Docker from 28.0.4 to 29.4.2, Docker Compose from 2.38.2 to 5.1.3. Lerna, Parcel, Newman, Pulumi, Mercurial and Java 8 are gone. Jobs that run setup-node aren't affected by the default Node.
- **`ubuntu-22.04`**: deprecated since 2026-09-17, "fully unsupported by April 17th, 2027", with brownouts in March and April 2027.
- **Specs**: public repos get 4 vCPU and 16 GB on x64 and arm64 Linux; private repos 2 vCPU and 8 GB.

The 26.04 announcement table gives Java 17 as the default; the image readme says 25.

## [GHA-002] `ubuntu-slim` and arm64 standard runners: specs, limits, when to use
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [GitHub-hosted runners reference: single-CPU runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners#single-cpu-runners), [Changelog 2026-01-22: 1 vCPU runner GA](https://github.blog/changelog/2026-01-22-1-vcpu-linux-runner-now-generally-available-in-github-actions), [ubuntu-slim image readme](https://github.com/actions/runner-images/blob/main/images/ubuntu-slim/ubuntu-slim-Readme.md), [Changelog 2025-08-07: arm64 for public repos](https://github.blog/changelog/2025-08-07-arm64-hosted-runners-for-public-repositories-are-now-generally-available), [Changelog 2026-01-29: arm64 in private repos](https://github.blog/changelog/2026-01-29-arm64-standard-runners-are-now-available-in-private-repositories)
- Related: GHA-001, GHA-008, GHA-023

**`ubuntu-slim`** (GA 2026-01-22): 1 vCPU, 5 GB RAM, 14 GB disk, in public and private repos. It runs "inside a container rather than a full VM instance", in "unprivileged mode", so "mounting file systems, using Docker-in-Docker, or accessing low-level kernel features" fail. "The job timeout for single-CPU runners is 15 minutes." The image (Ubuntu 24.04.5, version 20261012) has Node.js 24.21.0, Python, git, jq, the gh CLI, ShellCheck and a Docker client, but no Docker server. GitHub pitches it for "Auto-labeling issues", linting and formatting, API calls and simple scripts, "not suitable for typical heavyweight CI/CD builds".

Fits: a changed-files job, a link check, a zizmor run (zizmor-action supports it since v0.7.0), a scheduled reminder. Doesn't fit: `docker build`, a full `npm ci` plus Angular build, or harden-runner, which doesn't support it.

**arm64 standard runners**: `ubuntu-24.04-arm`, `ubuntu-22.04-arm`, `ubuntu-26.04-arm` and `windows-11-arm`. Free and 4 vCPU in public repos (GA 2025-08-07); in private repos since 2026-01-29 with 2 vCPU, counting against plan minutes. GitHub took over maintaining the Ubuntu arm64 images from Arm in 2026-05. Use them to build arm64 images natively instead of under QEMU emulation.

## [GHA-003] Node 20 is gone from the runners: `node20` actions are forced onto Node 24
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Changelog 2026-09-23: Node 20 is no longer available](https://github.blog/changelog/2026-09-23-node-20-is-no-longer-available-in-github-actions), [Changelog 2025-09-19: deprecation of Node 20 (edited 2026-08-25)](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners), [actions/setup-node v4 action.yml](https://raw.githubusercontent.com/actions/setup-node/v4/action.yml), [actions/runner NodeUtil.cs](https://raw.githubusercontent.com/actions/runner/main/src/Runner.Common/Util/NodeUtil.cs)
- Related: GHA-004, NODE-001, NODE-014

This is about the Node that runs JavaScript actions, not the Node your job installs with setup-node.

- 2026-06-16: runners started using Node 24 by default; `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true` opted out.
- 2026-09-23: "Runners now use Node 24 for JavaScript actions. The temporary ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION opt-out is no longer available."
- Node 24 "is incompatible with macOS 13.4 and earlier, and it doesn't officially support ARM32", so self-hosted runners there are unsupported.

An action that still declares `runs.using: node20` keeps running, on Node 24, with a warning. No date has been announced for such actions to stop running, and the metadata syntax docs still accept `node20`. On 2026-10-17 `actions/checkout@v4`, `setup-node@v4`, `cache@v4`, `upload-artifact@v4` and `v5`, and `download-artifact@v4` to `v6` still declare `node20`, including checkout's 2026-07-20 backport v4.4.0.

Observed 2026-10-17 on a GitHub-hosted `ubuntu-latest` run in FreekMencke/claude-skills: the job passed, with the annotation "Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced to run on Node.js 24: actions/checkout@v4, actions/setup-node@v4."

What to do: move to majors that declare `node24` (GHA-004). For your own JavaScript actions, set `runs.using: node24` and publish a release. A Node 20 job toolchain (`node-version: 20`) is a separate question: Node 20 itself reached end of life on 2026-04-30 (NODE-001).

## [GHA-004] Core action majors on 2026-10-17: checkout v7, setup-node v7, cache v6, artifacts v7 and v8
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [actions/checkout releases](https://github.com/actions/checkout/releases), [actions/checkout README](https://raw.githubusercontent.com/actions/checkout/main/README.md), [actions/setup-node releases](https://github.com/actions/setup-node/releases), [actions/cache releases](https://github.com/actions/cache/releases), [actions/upload-artifact releases](https://github.com/actions/upload-artifact/releases), [actions/download-artifact releases](https://github.com/actions/download-artifact/releases)
- Related: GHA-003, GHA-005, GHA-011, GHA-017, GHA-019

| Action | Latest | First `node24` major | Breaking changes since 2025 |
|---|---|---|---|
| `actions/checkout` | v7.0.1 (2026-07-20) | v5.0.0 (2025-08-11) | v6.0.0: "`persist-credentials` now stores credentials in a separate file under `$RUNNER_TEMP` instead of directly in `.git/config`". v7.0.0 (2026-06-18): refuses fork PR code under `pull_request_target` and `workflow_run` (GHA-017); ESM. |
| `actions/setup-node` | v7.1.0 (2026-10-08) | v5.0.0 (2025-09-04) | GHA-005 |
| `actions/cache` | v6.1.0 (2026-06-26) | v5.0.0 (2025-12-11) | v6.0.0: ESM. v6.1.0 and v5.1.0 "handle read-only cache access": a blocked save now warns "cache write denied" instead of a misleading message (GHA-019). |
| `actions/upload-artifact` | v7.0.2 (2026-10-07) | v6.0.0 (2025-12-12) | v7.0.0: `archive: false` uploads one file unzipped ("The action will fail if the glob passed resolves to multiple files"). |
| `actions/download-artifact` | v8.0.2 (2026-10-07) | v7.0.0 (2025-12-12) | v5.0.0: one artifact by ID extracts straight into `path/`. v8.0.0: "Hash mismatches will now error by default". |

The `node24` majors need runner 2.327.1 or later, which matters only for self-hosted runners. upload-artifact v5 and download-artifact v6 "support" Node 24 but still declare `node20`.

checkout's fork-PR refusal was backported on 2026-07-20 as v6.1.0, v5.1.0, v4.4.0, v3.7.0 and v2.8.0, so a floating major tag picked it up; SHA, minor and patch pins didn't. Of the five actions only setup-node publishes immutable releases (GHA-011).

For an agent: bump all five to these majors together, and read the artifact notes if a workflow downloads by ID or uploads single files.

## [GHA-005] setup-node v5 to v7: automatic npm caching, ESM, no dummy `NODE_AUTH_TOKEN`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [actions/setup-node releases](https://github.com/actions/setup-node/releases), [setup-node README](https://raw.githubusercontent.com/actions/setup-node/main/README.md), [setup-node advanced usage](https://raw.githubusercontent.com/actions/setup-node/main/docs/advanced-usage.md)
- Related: GHA-004, GHA-008, GHA-022, NODE-014

- **v5.0.0 (2025-09-04)**: "introduces automatic caching when a valid `packageManager` field is present in your `package.json`… To disable automatic caching, set `package-manager-cache: false`". The README now also names `devEngines.packageManager`. Runs on Node 24.
- **v6.0.0 (2025-10-14)**: "Limit automatic caching to npm". Yarn and pnpm need `cache:` set explicitly.
- **v7.0.0 (2026-07-14)**: ESM; "The dummy `NODE_AUTH_TOKEN` fallback has been removed… if `registry-url` is set without `NODE_AUTH_TOKEN`, legacy Yarn Classic (1.x) and older Node/npm versions may fail, and pnpm may warn"; new outputs `cache-primary-key` and `cache-matched-key`.
- **v7.1.0 (2026-10-08)**: reads the version from `mise.toml` and accepts absolute `node-version-file` paths (NODE-014 covers `.node-version`).

What the cache holds: `cache: npm` caches npm's download cache keyed on the lockfile; "The action does not cache `node_modules`", so `npm ci` still runs (GHA-008).

Publishing jobs: "In publishing workflows, set `package-manager-cache: false` because setup-node enables npm caching automatically when `package.json` specifies npm via `packageManager` or `devEngines.packageManager`… and a poisoned cache may expose credentials (including OIDC tokens) to attacker-controlled code" (GHA-022, GHA-024).

setup-node is the one core action with immutable releases, since v6.5.0 and v7.0.0 (GHA-011).

## [GHA-006] Workflow syntax added since 2025: parallel steps, `$/`, `cache-mode`, `queue`, `case()`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [Events: schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [Changelog 2026-06-25: parallel steps](https://github.blog/changelog/2026-06-25-actions-steps-can-now-be-run-in-parallel), [Changelog 2026-07-30: self-repository syntax](https://github.blog/changelog/2026-07-30-reference-same-repository-actions-with-self-repository-syntax), [Changelog 2026-01-29: case function](https://github.blog/changelog/2026-01-29-github-actions-smarter-editing-clearer-debugging-and-a-new-case-function), [Changelog 2025-09-18: YAML anchors](https://github.blog/changelog/2025-09-18-actions-yaml-anchors-and-non-public-workflow-templates), [Changelog 2026-03-19](https://github.blog/changelog/2026-03-19-github-actions-late-march-2026-updates)
- Related: GHA-007, GHA-010, GHA-019

Models trained before mid-2026 don't know these; check the syntax page before assuming a key doesn't exist.

| Added | Syntax | Notes |
|---|---|---|
| 2026-06-25 | step `background: true`, `wait: <id>` or `[ids]`, `wait-all:`, `cancel: <id>`, `parallel:` (a list of steps) | "A maximum of 10 background steps can run concurrently in a single job". Not inside composite actions. `wait`, `wait-all` and `cancel` always run and take no `if`. |
| 2026-07-30 | `uses: $/path/to/action` | Same repo "at the running commit", no checkout needed, no `@ref` allowed. Runner 2.336.0+, not on GHES. The docs call it "the recommended way"; `./` resolves against the checked-out workspace. |
| 2026-05-07 | `concurrency.queue: max` | Up to 100 pending runs instead of one; not with `cancel-in-progress: true`. |
| 2026-09-10 | `cache-mode:` at workflow or job level | GHA-019 |
| 2026-01-29 | `case()` expression function | if/else and switch logic in expressions |
| 2025-09-18 | YAML anchors and aliases | reuse blocks within one file |
| 2026-03-19 | schedule `timezone: "America/New_York"`; `environment: {name, deployment: false}` | `deployment: false` isn't compatible with custom deployment protection rules |
| 2026-04-02 | service container `entrypoint` and `command` | Docker Compose naming |

Since 2026-01-29 an `if:` with text outside `${{ }}` (always truthy) gets a run annotation, and skipped jobs log the expanded condition.

## [GHA-007] Limits and retention that changed in 2025–2026
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Actions limits](https://docs.github.com/en/actions/reference/limits), [Dependency caching reference: usage limits](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching#usage-limits-and-eviction-policy), [Changelog 2026-04-10: 50 reruns](https://github.blog/changelog/2026-04-10-actions-workflows-are-limited-to-50-reruns), [Changelog 2025-12-04: 25 inputs](https://github.blog/changelog/2025-12-04-actions-workflow-dispatch-workflows-now-support-25-inputs), [Changelog 2026-01-16: cache rate limit](https://github.blog/changelog/2026-01-16-rate-limiting-for-actions-cache-entries), [Changelog 2025-11-20: cache over 10 GB](https://github.blog/changelog/2025-11-20-github-actions-cache-size-can-now-exceed-10-gb-per-repository), [Changelog 2026-10-01: retention covers checks, runs and statuses](https://github.blog/changelog/2026-10-01-actions-retention-now-covers-checks-runs-and-statuses), [Changelog 2026-09-24: expired artifacts hidden](https://github.blog/changelog/2026-09-24-expired-github-actions-artifacts-no-longer-shown-in-ui-and-api)
- Related: GHA-006, GHA-008

| Limit | Value (2026-10-17) | Since |
|---|---|---|
| Re-runs of one workflow run | "a maximum of 50 times", full and partial re-runs counted | 2026-04-10 |
| `workflow_dispatch` inputs | 25 top-level (was 10) | 2025-12-04 |
| Cache per repo | 10 GB free; admins can raise it, billed beyond 10 GB | 2025-11-20 |
| Cache eviction | entries not accessed "in over 7 days" | |
| Cache uploads | "200 cache entry uploads per minute" per repo; deletes 400 per minute | 2026-01-16 |
| Concurrency queue | 100 with `queue: max` | 2026-05-07 |
| Job on a GitHub-hosted runner | 6 hours (15 minutes on `ubuntu-slim`) | |
| Workflow run | 35 days, including waiting and approval | |
| Matrix | 256 jobs per run | |

**Retention.** Since 2026-10-01, checks, workflow runs and statuses follow the artifact and log retention setting, default 90 days, instead of "400+ days regardless of your retention configuration"; "the maximum retention for public repositories is 90 days". It applies to third-party checks too, and isn't retroactive. Since 2026-09-24 expired artifacts are gone from the run page and the REST API.

So a script that reads an old run's check results (to skip unchanged work, say) gets nothing after 90 days, and an agent can't keep re-running a flaky job past 50.

## [GHA-008] CI for agent-driven PRs: cancel superseded runs, cache dependencies, keep required checks reporting
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Workflow syntax: concurrency](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#concurrency), [Troubleshooting required status checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks), [actions/setup-node README](https://raw.githubusercontent.com/actions/setup-node/main/README.md)
- Related: SESS-021, SESS-023, SESS-024, FLOW-024, GHA-005, GHA-019

Claude Code sessions push to a PR several times in minutes, and several sessions merge to `main` a day.

1. **Cancel superseded PR runs, never deploys.** The docs' pattern: `concurrency: {group: ${{ github.workflow }}-${{ github.head_ref || github.run_id }}, cancel-in-progress: true}`. `head_ref` exists only on PR events, so pushes to `main` get a unique group and aren't cancelled. A cancelled run isn't a success, so the newest run must report the required check. Deploy groups keep `cancel-in-progress: false`; add `queue: max` only when every queued deploy must run, because the default keeps just the newest pending one.
2. **Cache dependencies.** setup-node's `cache: npm` caches npm's download cache, not `node_modules`, so `npm ci` still runs (GHA-005). Caching `node_modules` with `actions/cache/restore` and `save` skips `npm ci` on a hit; key it on the OS, architecture, Node major and lockfile hash.
3. **Keep required checks reporting.** "Successful check statuses are `success`, `skipped`, and `neutral`." A job skipped by `if:` reports success; a workflow skipped by `paths` or branch filters leaves its checks "Pending" and blocks merging; a job whose `needs` failed is skipped "and may not block merging". So skip work with a changes job plus `if:`, and require one aggregate job with `if: always()` that fails on any `failure` or `cancelled` result.
4. **Wait in the background**: `gh pr checks <n> --watch` as one background command (FLOW-024); a conflicting PR runs no CI at all (SESS-021).

## [GHA-009] Pinning actions: tag, full SHA, immutable release or lockfile
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Secure use reference: using third-party actions](https://docs.github.com/en/actions/reference/security/secure-use#using-third-party-actions), [Managing GitHub Actions settings for a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository), [Changelog 2025-08-15: blocking and SHA pinning](https://github.blog/changelog/2025-08-15-github-actions-policy-now-supports-blocking-and-sha-pinning-actions), [zizmor audits: unpinned-uses, impostor-commit](https://docs.zizmor.sh/audits/), [zizmor#2371](https://github.com/zizmorcore/zizmor/issues/2371)
- Related: GHA-010, GHA-011, GHA-012, GHA-023, GHA-024

| Pin | What can still change | Notes |
|---|---|---|
| `@v4` major tag | everything: the owner, or anyone with write access, can move it | also how security backports arrive (checkout, 2026-07-20). "Pin actions to a tag only if you trust the creator" |
| `@v4.2.1` release tag | the same, unless the release is immutable | GHA-011 |
| `@<40-char SHA> # v4.2.1` | nothing in that repo; actions it calls by tag still float | "verify it is from the action's repository and not a repository fork" (impostor commits) |
| `actions.lock` | nothing, transitive actions included; records owner and repo IDs | public preview (GHA-010) |

GitHub's order: a lockfile, which "supersedes SHA pinning for repositories that adopt it", else a full SHA. zizmor's maintainer, 2026-10-08: "I (and zizmor as a project) recommend you continue to hash-pin your actions directly", until zizmor reads lockfiles (planned for 1.32). Since v1.20.0 zizmor wants hash pins on all actions, `actions/*` included, configurable per pattern.

**Enforcing.** The repo or org setting "Require actions to be pinned to a full-length commit SHA" (2025-08-15): "This includes actions from your organization and actions authored by GitHub. Reusable workflows can still be referenced by tag." The same policy blocks actions with a `!` prefix; REST field `sha_pinning_required`. Locked dependencies satisfy it.

Trade-off: "Dependabot only creates alerts for vulnerable actions that use semantic versioning and will not create alerts for actions pinned to SHA values"; version updates still move SHA pins (GHA-012).

## [GHA-010] Workflow lockfiles with `gh actions-lock` (public preview)
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Changelog 2026-10-14: workflow lockfiles in public preview](https://github.blog/changelog/2026-10-14-github-actions-workflow-lockfiles-in-public-preview), [Workflow dependency lockfiles](https://docs.github.com/en/actions/concepts/security/workflow-dependency-lockfiles), [Locking action dependencies](https://docs.github.com/en/actions/how-tos/secure-your-work/lock-workflow-dependencies), [Enforcing lockfiles](https://docs.github.com/en/actions/how-tos/administer/enforce-workflow-lockfiles), [github/gh-actions-lock README v0.2.0](https://raw.githubusercontent.com/github/gh-actions-lock/v0.2.0/README.md), [gh-actions-lock#174](https://github.com/github/gh-actions-lock/issues/174), [gh-actions-lock#178](https://github.com/github/gh-actions-lock/issues/178)
- Related: GHA-009, GHA-011, GHA-012, GHA-021, HOOK-004

Public preview since 2026-10-14 on Free, Team and Enterprise Cloud (Pro isn't listed); not on GHES. `gh extension install github/gh-actions-lock` (v0.2.0, 2026-10-12, an immutable release) writes `.github/workflows/actions.lock`, which "should never be edited by hand". Use that full name: copies with the same description exist under other accounts.

- **Records** each onboarded workflow's refs with `commit`, `owner_id` and `repo_id`, transitive actions included, "**except** for dependencies of reusable workflow calls" (the defining repo's lockfile covers those). "The locked commit is what runs".
- **Rewrites your YAML**: `@v3` can become `@v3.1.0`, and `uses: ./…` becomes `uses: $/…` (GHA-006). Review the whole diff. The README also says local-path actions "will be skipped for onboarding", which its own `$/` migration contradicts.
- **Commands**: `gh actions-lock` to onboard and update, `--verify` in CI ("useful for a required check"), `--verify-local --no-fix` offline in a pre-commit hook, `--relock` when a tag legitimately moved.
- **Require lockfile** policy blocks targeted workflows whose dependencies aren't locked; Evaluate mode is "only available on GitHub Enterprise" (GHA-021).
- **Unstable**: "The lockfile format, command flags, and behavior may change without notice between releases." v0.2.0 moved the schema to v0.0.3; the docs still show v0.0.2. Open on 2026-10-17: #174 (a full-SHA entry accepted a fork-only commit, reported by a security vendor) and #178 (rename the file to `actions-lock.yaml`).

GitHub suggests a Copilot skill that regenerates the lockfile when a workflow changes, and a CODEOWNERS entry for it. In Claude Code, a hook running `--verify-local --no-fix` after edits under `.github/` does that job.

## [GHA-011] Immutable releases: what they lock, and why a tag still isn't a SHA pin
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases), [Changelog 2025-10-28: immutable releases GA](https://github.blog/changelog/2025-10-28-immutable-releases-are-now-generally-available/), [Verifying release integrity](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/verify-release-integrity), [zizmor#766](https://github.com/zizmorcore/zizmor/issues/766)
- Related: GHA-009, GHA-010, GHA-004

GA 2025-10-28: "Immutable releases are releases where the assets and associated Git tag cannot be changed after publication." The tag can't be moved, or deleted while the release exists, and a deleted release's tag name can't be reused. Each one gets a release attestation (Sigstore bundle) with the tag, commit SHA and assets; check it with `gh release verify <tag>` and `gh release verify-asset <tag> <file>` (not the source archives). "Existing releases remain mutable unless you republish them", and "Only the assets and tag are locked."

What it doesn't give a consumer:
- A floating major tag (`@v4`) isn't a release and can still move.
- No GitHub page found says an immutable release's tag counts as a SHA pin; the pinning policy still wants "a full-length commit SHA" for all actions (GHA-009).
- zizmor doesn't treat it as pinned (#766, open), and CodeQL's exemption list for immutable actions is empty for customers.

On 2026-10-17 these publish immutable releases: setup-node (since v6.5.0 and v7.0.0), configure-aws-credentials (since v5.0.0), zizmor and zizmor-action, harden-runner, codeql-action, gh-actions-lock. These don't: checkout, cache, upload-artifact, download-artifact, actionlint, Scorecard and scorecard-action. Check one with `gh api repos/OWNER/REPO/releases/latest --jq .immutable`.

For an action you publish: turn immutable releases on and keep the major tag as a moving pointer to the latest one.

## [GHA-012] Dependabot for action pins: what it updates, skips and doesn't alert on
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Keeping your actions up to date with Dependabot](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/auto-update-actions), [Dependabot options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference), [Dependabot on GitHub Actions](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-on-actions), [dependabot-core github_actions file_parser.rb](https://github.com/dependabot/dependabot-core/blob/main/github_actions/lib/dependabot/github_actions/file_parser.rb), [Locking action dependencies](https://docs.github.com/en/actions/how-tos/secure-your-work/lock-workflow-dependencies)
- Related: JSUP-012, JSUP-013, JSUP-014, GHA-009, GHA-010, GHA-013

The options themselves (schedule, groups, `directories`, the 3-day default cooldown since 2026-07-14) are in JSUP-012; auto-merge and triage in JSUP-013 and JSUP-014. For actions specifically:

- **What it updates**: "references to actions in a repository's *workflow.yml* file and reusable workflows used inside workflows". `/` covers `.github/workflows` and a root `action.yml`; composite actions under `.github/actions/` need `/.github/actions/*` in `directories`. SHA pins move to the new release's SHA.
- **Version comments**: per dependabot-core's source, a trailing `# v1.2.3` is rewritten only when it matches the old SHA; a stale comment is left stale (zizmor's `ref-version-mismatch` flags it).
- **What it skips**: `uses: ./…` and `docker://` references (`return if string.start_with?(".", "docker://")`).
- **No alerts for SHA pins**: "Dependabot only creates alerts for vulnerable actions that use semantic versioning and will not create alerts for actions pinned to SHA values." Security news for a SHA-pinned action reaches you through version updates only.
- **Cooldown**: GitHub Actions takes `cooldown.default-days` only; zizmor's `dependabot-cooldown` audit "recommends a cooldown of seven days".
- **Lockfiles**: the docs say Dependabot regenerates the lockfile entry in the same PR for onboarded workflows, but "will **not** onboard a workflow for you". dependabot-core gates it behind the experiment `github_actions_lockfile`; whether that is on for every repo isn't stated.
- **Its PR runs** get a read-only `GITHUB_TOKEN` and Dependabot secrets only (GHA-013).

## [GHA-013] `GITHUB_TOKEN` permissions: defaults, the `permissions` key and what the token can't start
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Workflow syntax: permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions), [GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token), [Managing GitHub Actions settings for a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository), [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use), [Dependabot on GitHub Actions](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-on-actions)
- Related: GHA-014, GHA-018, GHA-020, REPO-038, INFRA-001

Start every workflow with `permissions: contents: read` (or `permissions: {}`) and grant more per job. GitHub: "It's good security practice to set the default permission for the GITHUB_TOKEN to read access only for repository contents."

- **Default**: a new personal repo or new org gives "read access for the `contents` and `packages` scopes"; older repos and orgs may still give "read and write access for all permissions". A workflow without `permissions:` gets whichever applies. Check: `gh api repos/OWNER/REPO/actions/permissions/workflow`.
- **The key**: "If you specify the access for any of these permissions, all of those that are not specified are set to `none`", so a job-level block replaces the workflow's for that job. Fork PR events other than `pull_request_target` drop write to read; under `pull_request_target` "the `GITHUB_TOKEN` is granted read/write repository permission, even when it is triggered from a public fork" (GHA-018).
- **New scopes**: `vulnerability-alerts` (2026-09-03, `read` or `none`), `artifact-metadata` (2026-01-13), `copilot-requests`.
- **What it can't start**: "events triggered by the `GITHUB_TOKEN` will not create a new workflow run", except `workflow_dispatch` and `repository_dispatch`; PRs it opens (since 2026-06-11) start runs that wait for approval. It can't add PRs to a merge queue, and "expires when the job finishes" (App tokens: GHA-014).
- **Creating and approving PRs** is off by default in new repos; leave it off unless a workflow opens PRs.
- **Dependabot runs** get a read-only token and Dependabot secrets only, "even if the workflow is re-run by a different actor". Raising them with `permissions:` on `pull_request`: JSUP-013.

## [GHA-014] GitHub App installation tokens: when, how to scope, and the 520-character format
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [actions/create-github-app-token README v3.3.0](https://raw.githubusercontent.com/actions/create-github-app-token/v3.3.0/README.md), [Making authenticated API requests with a GitHub App in a workflow](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/making-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflow), [Changelog 2026-10-02: stateless installation tokens rolled out](https://github.blog/changelog/2026-10-02-stateless-github-app-installation-tokens-rolled-out), [GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token)
- Related: GHA-013, REPO-027, REPO-038, INFRA-001

GitHub: "you should use the built-in `GITHUB_TOKEN` if possible". An App installation token is for what it can't do: other repositories, org resources, and pushes or PRs whose workflows must run without an approval step.

`actions/create-github-app-token` v3.3.0 (2026-10-12; v3.0.0 moved to Node 24 and needs `NODE_USE_ENV_PROXY=1` behind a proxy):

```yaml
- id: app-token
  uses: actions/create-github-app-token@<sha> # v3.3.0
  with:
    client-id: ${{ vars.APP_CLIENT_ID }}
    private-key: ${{ secrets.APP_PRIVATE_KEY }}
    permission-contents: write
    permission-pull-requests: write
```

- `client-id` replaces the legacy `app-id`. "By default, the token inherits all of the installation's permissions. We recommend to explicitly list the permissions that are required" with `permission-<name>` inputs.
- "If `owner` and `repositories` are empty, access will be scoped to only the current repository"; set `owner` and `repositories` to reach others.
- "An installation access token expires after 1 hour", and is revoked in the action's post step, "which means it cannot be passed to another job".

**Format since 2026-10-02**: new installation tokens are stateless `ghs_` JWTs, "about 520 characters long instead of 40"; permissions, scoping, the one-hour expiry and the endpoint are unchanged. A 2026-04-24 notice says the rollout includes `GITHUB_TOKEN`. Anything that checks for 40 characters, matches `ghs_[A-Za-z0-9]{36}`, truncates headers or stores tokens in short columns breaks; the `X-GitHub-Stateless-S2S-Token` header is deprecated on 2026-11-30.

## [GHA-015] OIDC to AWS: trust policy conditions and `configure-aws-credentials` v6
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Configuring OpenID Connect in AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws), [IAM: create a role for OIDC federation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html), [IAM condition keys: GitHub claims](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_iam-condition-keys.html), [AWS What's New 2026-02-02: STS validates provider claims](https://aws.amazon.com/about-aws/whats-new/2026/01/aws-sts-supports-validation-identity-provider-claims/), [aws-actions/configure-aws-credentials README v6.3.0](https://raw.githubusercontent.com/aws-actions/configure-aws-credentials/v6.3.0/README.md)
- Related: GHA-016, GHA-013, INFRA-001, INFRA-020

Provider URL `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`. The role's trust policy:

```json
"Condition": {
  "StringEquals": {
    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
    "token.actions.githubusercontent.com:sub": "repo:octo-org/octo-repo:environment:prod"
  }
}
```

- **`sub` is required in practice**: IAM checks at create and update time that the key "is present and that its value is not solely a wildcard character (* and ?) or null". Name one repo and a branch (`:ref:refs/heads/main`) or an environment with protection rules, not `repo:octo-org/*`. Repos created after 2026-07-15 send a different `sub` (GHA-016).
- **Workflow**: `permissions: {id-token: write, contents: read}`. "Setting `id-token: write` in the workflow's permissions does not give the workflow permission to modify or write to any resources"; it lets the job request a token.
- **The action**: `aws-actions/configure-aws-credentials` v6.3.0 (2026-09-15), Node 24 since v6.0.0, immutable releases since v5.0.0; `audience` defaults to `sts.amazonaws.com`. No thumbprint: "The thumbprint, if specified, will be ignored." Its README: "Avoid `ForAllValues:` in `Allow` statements." GitHub's own example still pins v4.0.2's SHA.
- **Claim keys**: since 2026-02-02 AWS STS can check GitHub claims such as `repository_id`, `repository_owner_id`, `actor_id`, `job_workflow_ref` and `environment`, and advises "Use immutable identifiers, not names". GitHub's page still says "Support for custom claims for OIDC is unavailable in AWS"; trust AWS's page, which is newer and the service's own. Whether IAM accepts a trust policy that uses these keys without `sub` isn't stated.

Agent credentials in general: INFRA-001 and INFRA-020.

## [GHA-016] Immutable OIDC `sub` claims: which repos send them, and moving a trust policy over
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [OpenID Connect reference: immutable subject claims](https://docs.github.com/en/actions/reference/security/oidc#immutable-subject-claims), [Changelog 2026-04-23: immutable subject claims (edited 2026-06-10)](https://github.blog/changelog/2026-04-23-immutable-subject-claims-for-github-actions-oidc-tokens), [REST: OIDC customisation](https://docs.github.com/en/rest/actions/oidc), [configure-aws-credentials README v6.3.0](https://raw.githubusercontent.com/aws-actions/configure-aws-credentials/v6.3.0/README.md), [IAM: multiple values for a key](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-logic-multiple-context-keys-or-values.html)
- Related: GHA-015, INFRA-020

The default `sub` now carries the owner and repo IDs: `repo:OWNER@OWNER-ID/REPO@REPO-ID:ref:refs/heads/BRANCH`, so a recycled name can't mint a matching subject.

- **Who sends it**: "repositories created after July 15, 2026" (the AWS action's README says "on or after"), and "Repository renames and transfers after July 15, 2026". Older repos keep `repo:OWNER/REPO:…` until they opt in, per repo or org; not on GHES. A customised `sub` keeps the IDs: "You can't remove these IDs".
- **Symptom**: a trust policy copied from an older repo never matches a new one, and a rename breaks a working one, with "Not authorized to perform sts:AssumeRoleWithWebIdentity".
- **Check**: `gh api repos/OWNER/REPO/actions/oidc/customization/sub` returns `use_immutable_subject` and `sub_claim_prefix`.

Moving an older repo over (combined from the quotes; neither GitHub nor AWS gives this recipe):
1. Read the IDs: `gh api repos/OWNER/REPO --jq '.owner.id, .id'`.
2. Put both values in the `sub` condition: for one key, "those values are evaluated using a logical OR".
3. Opt in (`PUT` the same path with `use_immutable_subject: true`), run the workflow, then drop the old value.

Treat a rename or transfer as a trust-policy change. The docs show only the branch form; the environment and pull-request forms are inferred.

Tested 2026-10-17, GitHub REST API, read-only: two of our repos created on 2026-10-12 returned `"use_immutable_subject":true` and an `OWNER@ID/REPO@ID` prefix built from the repo's `owner.id` and `id`; four created 2023–2025 returned `false` and `repo:OWNER/REPO`.

## [GHA-017] `pull_request_target` and `workflow_run`: what GitHub changed from 2025-12 to 2026-11
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Changelog 2025-11-07: pull_request_target and environment branch protections](https://github.blog/changelog/2025-11-07-actions-pull_request_target-and-environment-branch-protections-changes), [Changelog 2026-06-18: safer checkout defaults](https://github.blog/changelog/2026-06-18-safer-pull_request_target-defaults-for-github-actions-checkout), [Changelog 2026-06-26: read-only cache](https://github.blog/changelog/2026-06-26-read-only-actions-cache-for-untrusted-triggers), [Changelog 2026-09-17: execution protections GA](https://github.blog/changelog/2026-09-17-workflow-execution-protections-in-github-actions-generally-available), [Securely using pull_request_target](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target)
- Related: GHA-018, GHA-019, GHA-021, GHA-004, SESS-021

| Date | Change |
|---|---|
| 2025-12-08 | `pull_request_target` always runs the default branch's workflow: "GITHUB_REF … will resolve to the default branch". Environment branch rules evaluate against `refs/pull/<n>/merge` (`pull_request`) or the default branch (`pull_request_target`). |
| 2026-06-18 | `actions/checkout` v7 "refuses to fetch fork pull request code in pull_request_target and workflow_run workflows (the latter only when workflow_run.event is a pull_request* event)": `ref:` set to the PR head or merge ref or SHA, or `repository:` set to the fork. Opt-out input: `allow-unsafe-pr-checkout`. Same-repo PRs and `pull_request` are unaffected. |
| 2026-07-20 | The same refusal backported to every supported major except v1, through the floating major tags. "Workflows pinned to a specific SHA, minor, or patch version aren't affected by the backport." |
| 2026-06-26 | Untrusted triggers get a read-only cache token on the default-branch scope (GHA-019). |
| 2026-07-28 | Public repos: runs GitHub flags as likely malicious are held for approval (GHA-021). |
| 2026-11-02 | A default event policy blocking `pull_request_target` in public repos without their own event policy, in evaluate mode since 2026-09-17, is enforced. Private and internal repos are exempt. |

The checkout guard doesn't cover `git fetch`, `gh pr checkout`, a fork run's artifacts or `issue_comment` workflows, and a SHA-pinned checkout older than the backport has none. `workflow_run` "is able to access secrets and write tokens, even if the previous workflow was not".

## [GHA-018] When `pull_request_target` or `workflow_run` is still safe
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Securely using pull_request_target](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target), [GitHub Security Lab: Preventing pwn requests](https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/), [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- Related: GHA-017, GHA-019, GHA-020, GHA-024, JSUP-013, REPO-038

`pull_request_target` runs the default branch's workflow with "the base repository's `GITHUB_TOKEN` and access to repository and organization secrets". That is safe until the workflow runs code from the PR. GitHub's rule: "You must ensure the checked-out code is only ever inspected as data and never executed".

**Safe uses:** labelling, triage, comments, status checks that read the PR through the API or read files as data.

**Unsafe, whatever the trigger:** checking out the head or merge ref (or the fork) and running anything in it, `npm install` and `npm run build` included, since their scripts and config come from the PR. The same goes for `issue_comment` or `workflow_run` workflows that fetch PR code; "A `workflow_run` workflow should treat artifacts uploaded by other workflows as untrusted data".

**Decision order:**
1. Use `pull_request` if the job needs no secrets: fork runs get a read-only token and no secrets. Dependabot auto-merge doesn't need `pull_request_target` either: `pull_request` runs honour `permissions:` (JSUP-013).
2. Otherwise split it: build untrusted code in a `pull_request` run, and let a privileged `workflow_run` job consume only its data, never execute it.
3. If `pull_request_target` stays: least-privilege `permissions:`, only the secrets it needs, ephemeral runners, and for public repos an event policy that allows it explicitly after 2026-11-02 (GHA-021).

Setting `allow-unsafe-pr-checkout: true` is a security decision, fit only for code that is never executed.

A deploy on `workflow_run` that runs only for successful `push` runs from the same repository (`github.event.workflow_run.event == 'push'` and `head_repository.full_name == github.repository`) runs no PR code.

## [GHA-019] Cache poisoning, read-only cache tokens and `cache-mode`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Dependency caching reference](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching), [Changelog 2026-06-26: read-only cache for untrusted triggers](https://github.blog/changelog/2026-06-26-read-only-actions-cache-for-untrusted-triggers), [Changelog 2026-09-10: cache-mode](https://github.blog/changelog/2026-09-10-control-github-actions-cache-access-with-cache-mode), [actions/cache#1781](https://github.com/actions/cache/pull/1781), [actions/cache releases](https://github.com/actions/cache/releases)
- Related: GHA-017, GHA-024, GHA-008, GHA-005

"Cache contents are not signed or verified": a run that can write the default branch's cache can plant files that a later privileged run restores and executes.

**Default since 2026-06-26.** Only `push`, `workflow_dispatch`, `repository_dispatch`, `delete`, `registry_package`, `page_build` and `schedule` may write the default branch's cache scope. Other events that resolve to the default branch, "such as `pull_request_target`, `issue_comment`, and `workflow_run`", get read-only access. A blocked save logs a warning and the job continues. `pull_request` is unaffected.

**`cache-mode`** (GA 2026-09-10, all plans), at workflow or job level, job wins:

| Value | Restore | Save |
|---|---|---|
| `read` | yes | no |
| `write` | yes | yes |
| `write-only` | no | yes |
| `none` | no | no |

When it's omitted, trusted triggers get `write` and low-trust ones `read`. Declaring `write` or `write-only` on a low-trust trigger overrides the default and "reintroduces the risk of cache-poisoning", with a warning annotation. A reusable workflow gets at most its caller's explicit mode.

**The warning stays for now.** The docs say a step the mode forbids "logs an informational message and continues", but the skip that reads the runner's `ACTIONS_CACHE_MODE` is merged to actions/cache's `main` (2026-07-15) and in no release: v6.1.0 still tries the save and warns.

So a `workflow_run` deploy that restores a CI cache drops the warning with `actions/cache/restore` alone, as the docs advise. A release job should restore no shared cache: TanStack's release restored a poisoned one (GHA-024).

## [GHA-020] Script injection and secrets: untrusted input goes through `env:`
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Script injections](https://docs.github.com/en/actions/concepts/security/script-injections), [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use#use-an-intermediate-environment-variable), [Secrets reference](https://docs.github.com/en/actions/reference/security/secrets), [Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- Related: GHA-013, GHA-018, GHA-023, GHA-024, REPO-038

"The expressions inside `${{ }}` are evaluated and then substituted with the resulting values" before the shell runs, so attacker text becomes code. Untrusted contexts "typically end with `body`, `default_branch`, `email`, `head_ref`, `label`, `message`, `name`, `page_name`,`ref`, and `title`"; `zzz";echo${IFS}"hello";#` is a valid branch name.

"For inline scripts, the preferred approach to handling untrusted input is to set the value of the expression to an intermediate environment variable":

```yaml
- name: Check PR title
  env:
    TITLE: ${{ github.event.pull_request.title }}
  run: |
    if [[ "$TITLE" =~ ^octocat ]]; then echo "ok"; fi
```

Quote the variable. The same applies to `actions/github-script`'s `script:`. The docs' first choice is an action that takes the value as an input.

**Secrets:**
- "automatic redaction is not guaranteed", and works only for secrets the job uses. "Never use structured data as a secret"; mask derived values with `::add-mask::`. A leaked value: delete the log and rotate.
- "Any user with write access to your repository has read access to all secrets configured in your repository."
- Fork PR runs get no secrets except a read-only `GITHUB_TOKEN`. Environment secrets reach only jobs that reference the environment, after required reviewers approve (on Free, Pro and Team, public repos only).
- Limits: 100 repository secrets, 48 KB each, names not starting `GITHUB_`.

zizmor, actionlint and CodeQL all flag template injection (GHA-023).

## [GHA-021] Fork PR approvals and workflow execution protections
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Managing GitHub Actions settings for a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository), [About Actions policies](https://docs.github.com/en/actions/concepts/about-actions-policies), [Controlling workflow execution](https://docs.github.com/en/actions/how-tos/administer/control-workflow-execution), [Changelog 2026-09-17: execution protections GA](https://github.blog/changelog/2026-09-17-workflow-execution-protections-in-github-actions-generally-available), [Changelog 2026-07-28: workflows held for approval](https://github.blog/changelog/2026-07-28-github-actions-holds-potentially-malicious-workflows-for-approval), [Securely using pull_request_target](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target)
- Related: GHA-017, GHA-018, GHA-010, GHA-013

**Fork PR approval** (Settings > Actions > General): "By default, all first-time contributors require approval to run workflows"; stricter options cover first-time contributors or all external contributors. Anyone with a merged commit or PR skips approval. `pull_request_target` runs "will always run, regardless of approval settings". Runs waiting over 30 days "expire and are marked as failed".

**Held for approval** (2026-07-28, public repos on github.com): runs GitHub flags as likely malicious wait for an approval "submitted through an authenticated web session".

**Execution protections** (GA 2026-09-17, Settings > Actions > Policies, at enterprise, org or repo level):
- Actor rules (users, repository roles, GitHub Apps, Copilot, Dependabot) and event rules, optionally per workflow file, plus "Require lockfile" (GHA-010).
- Enforcement `active`, `disabled` or `evaluate` (Evaluate is "GitHub Enterprise Cloud only"). A blocked run fails with "Event 'workflow_dispatch' is not allowed to trigger Actions workflows."
- `dependabot[bot]` "must be added as an allowed actor" when an actor rule would block workflows it triggers.

**Default policy**: "For public repositories that do not already have an applicable Actions event policy, GitHub adds a default policy that blocks workflows triggered by `pull_request_target`." It runs in evaluate mode until "November 2, 2026", when it's enforced; since Evaluate is Enterprise-only, other plans may see no insights before then. To keep such a workflow, allow the event in your own policy, or move it to `pull_request`.

Not found: whether personal-account repos get the default policy. `gh api repos/OWNER/REPO/actions/policies` on two such public repos returned `{"total_count":0,"policies":[]}` (2026-10-17), which settles nothing.

## [GHA-022] npm trusted publishing: the workflow side
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [npm: trusted publishers](https://docs.npmjs.com/trusted-publishers), [npm: generating provenance statements](https://docs.npmjs.com/generating-provenance-statements), [setup-node advanced usage](https://raw.githubusercontent.com/actions/setup-node/main/docs/advanced-usage.md), [Node.js release index](https://nodejs.org/dist/index.json), [GitHub: publishing Node.js packages](https://docs.github.com/en/actions/tutorials/publish-packages/publish-nodejs-packages), [Changelog 2026-10-02: unvalidated npm trusted publishing configurations expire](https://github.blog/changelog/2026-10-02-unvalidated-npm-trusted-publishing-configurations-now-expire), [TanStack postmortem](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem)
- Related: NPM-009, NPM-010, NPM-011, NPM-012, GHA-005, GHA-019, GHA-024, GHA-015

The registry side (the trusted publisher's fields, allowed actions, staged publishing, provenance) is in NPM-009 to NPM-012. In the workflow:

```yaml
permissions:
  contents: read
  id-token: write   # the OIDC token npm exchanges
jobs:
  publish:
    runs-on: ubuntu-latest
    environment: release   # optional; name it in npm's config too
    steps:
      - uses: actions/checkout@<sha> # v7.0.1
      - uses: actions/setup-node@<sha> # v7.1.0
        with:
          node-version-file: .node-version
          registry-url: https://registry.npmjs.org
          package-manager-cache: false
      - run: npm ci
      - run: npm publish
```

- "Trusted publishing requires npm CLI version 11.5.1 or later and Node version 22.14.0 or higher", on GitHub-hosted runners: "Self-hosted runners are not currently supported". Node 24's bundled npm is enough, also for `npm stage publish` (11.15.0+): Node 24.22.0, the latest 24.x on 2026-10-18 (released 2026-10-14), bundles npm 11.19.1, and 24.20.0 and 24.21.0 bundle 11.19.0 (`npm` field of `https://nodejs.org/dist/index.json`, read 2026-10-18). No `npm install -g npm` step is needed with `node-version: '24.x'`.
- No token and no `--provenance`: provenance is automatic for a public repo and public package.
- **Plain `npm publish` can fail**: a trusted publisher created after 2026-09-03 allows only `npm stage publish` unless direct publish was ticked (NPM-009, NPM-010).
- **Trigger**: npm "rejects trusted publishing tokens from GitHub Actions issue_comment events, alongside the existing pull_request_target restriction" (2026-10-02); publish on `push`, `release` or `workflow_dispatch`.
- Private dependencies: a read-only granular token in `NODE_AUTH_TOKEN` for `npm ci`; the publish still uses OIDC.
- Hardening: `package-manager-cache: false` and no shared cache restore in the job (GHA-005, GHA-019). Put the job behind an environment with required reviewers, so the job, and with it the OIDC token, waits for approval: "OIDC trusted-publisher binding has no per-publish review" (TanStack, GHA-024).

GitHub's "Publishing Node.js packages" tutorial still uses `secrets.NPM_TOKEN` with `--provenance`; follow npm's page.

## [GHA-023] Workflow linters and hardening tools: zizmor, actionlint, CodeQL, harden-runner, Scorecard
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [zizmor audits](https://docs.zizmor.sh/audits/), [zizmor usage: exit codes](https://docs.zizmor.sh/usage/), [zizmor-action README](https://github.com/zizmorcore/zizmor-action), [actionlint checks](https://github.com/rhysd/actionlint/blob/main/docs/checks.md), [CodeQL queries for Actions](https://docs.github.com/en/code-security/reference/code-scanning/codeql/codeql-queries/actions-built-in-queries), [harden-runner README](https://github.com/step-security/harden-runner), [scorecard-action README](https://github.com/ossf/scorecard-action)
- Related: GHA-009, GHA-019, GHA-020, GHA-002, HOOK-004, GHA-025

| Tool (latest) | Checks | As a PR gate |
|---|---|---|
| zizmor v1.31.1, zizmor-action v0.7.1 | template injection, `artipacked`, cache poisoning, dangerous triggers, excessive permissions, `unpinned-uses` (hash pins on all actions since v1.20.0; per-pattern `hash-pin`, `ref-pin`, `any`), impostor commits (online), Dependabot cooldown | Exit codes 11–14 by severity, none with `--format=sarif`. The action's default `advanced-security: true` uploads SARIF and "will **not** fail": gate with a code-scanning ruleset ("the recommended approach") or set `advanced-security: false`. Pin `version` (default `latest`). |
| actionlint v1.7.12 | syntax, expression types, runner labels, ShellCheck on `run:`, script injection | Exit 1 on findings. No pinning check. Use the `rhysd/actionlint:1.7.12` image or a release binary, not the install script on `main`. |
| CodeQL (codeql-action v4.39.0) | cache and artifact poisoning, untrusted checkout, code injection; unpinned tags in `security-extended` only; reads `actions.lock` | through code-scanning rulesets; free for public repos |
| harden-runner v2.22.1 | runtime egress monitor and block | not a linter; free tier for public repos on GitHub-hosted runners; not on `ubuntu-slim` |
| Scorecard v5.6.0, scorecard-action v2.5.0 | posture score: pinning, dangerous workflows, token permissions | `push` and `schedule`; "The `pull_request` and `workflow_dispatch` triggers are experimental." |

Which to require: zizmor, the only one covering pinning, injection, permissions, triggers and cache poisoning together, with actionlint beside it for syntax and ShellCheck. Scorecard runs on a schedule; harden-runner in audit mode shows egress.

To keep `actions/*` on tags, zizmor's documented config: `rules: unpinned-uses: config: policies: {"actions/*": ref-pin}`. What it finds in a first rollout, and how to handle each: GHA-025.

## [GHA-024] Incidents 2024–2026 and the control that would have stopped each
- Type: fact
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-17
- Sources: [GHSA-mrrh-fwg8-r2c3 (tj-actions/changed-files)](https://github.com/advisories/GHSA-mrrh-fwg8-r2c3), [GHSA-qmg3-hpqr-gqvc (reviewdog/action-setup)](https://github.com/advisories/GHSA-qmg3-hpqr-gqvc), [Unit 42: GitHub Actions supply chain attack](https://unit42.paloaltonetworks.com/github-actions-supply-chain-attack/), [PyPI: Ultralytics attack analysis](https://blog.pypi.org/posts/2024-12-11-ultralytics-attack-analysis/), [zizmor author on Ultralytics](https://blog.yossarian.net/2024/12/06/zizmor-ultralytics-injection), [TanStack postmortem](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem)
- Related: GHA-009, GHA-010, GHA-018, GHA-019, GHA-020, GHA-022, NPM-011

From GitHub's advisories and the affected projects' postmortems:

| Incident | How | What would have stopped it |
|---|---|---|
| Ultralytics, 2024-12 | A branch name injected shell into a composite action run by `pull_request_target`; then a poisoned pip cache reached the release, then a stolen PyPI token: versions 8.3.41, 8.3.42, 8.3.45, 8.3.46. | `env:` instead of `${{ }}` in `run:` (GHA-020), no `pull_request_target`, no shared cache in release jobs (GHA-019). SHA pins wouldn't: the action was the org's own, at `@main`. |
| reviewdog and tj-actions, 2025-03-11 to 15 | A `pull_request_target` workflow elsewhere leaked a PAT; `reviewdog/action-setup@v1` was moved to an impostor commit, which leaked tj-actions' bot PAT; every tj-actions/changed-files tag then pointed at code that dumped runner memory into public logs (CVE-2025-30154, CVE-2025-30066). | Consumers on an older full SHA of changed-files were unaffected; the transitive tag needed a lockfile (GHA-010); no long-lived PATs. |
| TanStack, 2026-05-11 19:20–19:26 UTC | `pull_request_target` ran a fork's build, whose cache post-step poisoned the pnpm store the release workflow restored; the payload read the OIDC token from runner memory and published 84 versions of 42 packages. "No npm tokens were stolen." | No PR code under `pull_request_target` (GHA-018); no cache in the release job; publishing behind reviewers (GHA-022). "Setting `permissions: contents: read` does not block cache mutation." |

The pattern: a privileged trigger runs untrusted code, and a cache or token carries it across. GitHub's 2026-07-28 post on compromised credentials pushing malicious workflows names no incident.

## [GHA-025] Rolling out zizmor: the findings every repo gets, and inline ignores
- Type: pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-18
- Sources: [zizmor audits](https://docs.zizmor.sh/audits/), [zizmor configuration: ignoring results](https://docs.zizmor.sh/usage/#ignoring-results), [osrs-tracker-web zizmor pilot](https://github.com/osrs-tracker/osrs-tracker-web/pull/367), [claude-kb rollout](https://github.com/FreekMencke/claude-kb/issues/229)
- Related: GHA-023, GHA-012, GHA-013, GHA-017, GHA-008

Two rollouts (osrs-tracker/osrs-tracker-web#367, FreekMencke/claude-kb#229) got the same findings: fix most, and ignore the deliberate ones inline, one line at a time.

| Finding | Handle it |
|---|---|
| `artipacked` on a checkout without `persist-credentials: false` | add it; a checkout that pushes with a deploy key keeps it, with an inline ignore |
| `dependabot-cooldown` | `cooldown: default-days: 7` per ecosystem; security updates skip cooldowns |
| `excessive-permissions`, no `permissions:` block | `contents: read` at the top (GHA-013) |
| `dangerous-triggers` on a `workflow_run` deploy | inline ignore when its `if:` admits only same-repo pushes; moving CD into CI is a redesign |
| `self-repository` on `uses: ./...` | inline ignore while actionlint runs too: it rejects `$/...` |

An inline ignore is `# zizmor: ignore[<audit>]` on the flagged line, with the reason in a comment beside it. Don't list a bare file under `rules.<audit>.ignore` in `.github/zizmor.yml`: that ignores that audit's findings in it "regardless of line/column location", later ones too, and a `file.yml:line` entry drifts when lines move.

Tested 2026-10-18, zizmor 1.31.1 and actionlint 1.7.12 via `uvx`: the first four on this repo's workflows; `self-repository` fires on `uses: ./.github/actions/a`, and actionlint fails `uses: $/.github/actions/a` with "invalid format because ref is missing".

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-17 against `main` of osrs-tracker-web, osrs-tracker-api, osrs-tracker-aws, freek-mencke-web, claude-skills and this repo. None of them uses `pull_request_target` or assumes an AWS role through OIDC, and the deploy workflows already run only for same-repo `push` runs (GHA-018).

1. Done 2026-10-18: every workflow starts with `permissions: contents: read` or `{}`, so the default token is read-only; the last two repos in osrs-tracker/osrs-tracker-api#185 and osrs-tracker/osrs-tracker-aws#146 (GHA-013).
2. **Before 2026-10-19, expect `ubuntu-latest` to become 26.04** (GHA-001). Three repos run the image's ShellCheck, which goes from 0.9.0 to 0.11.0. If a ShellCheck step fails during the migration window, fix the new findings; pin `ubuntu-24.04` only as a stopgap. Nothing to change before then, so no issue.
3. Done 2026-10-18: claude-skills' workflows are off the `node20` majors (FreekMencke/claude-skills#80, FreekMencke/claude-skills#90; GHA-003, GHA-004).
4. Done 2026-10-18: Dependabot's `github-actions` ecosystem, `/.github/actions/*` included, and full SHAs for third-party actions in osrs-tracker-aws, claude-skills and this repo (osrs-tracker/osrs-tracker-aws#146, FreekMencke/claude-skills#80, FreekMencke/claude-kb#201; GHA-009, GHA-012, JSUP-012).
5. Done 2026-10-18: zizmor runs as a check in osrs-tracker-web (pilot osrs-tracker/osrs-tracker-web#353), osrs-tracker-api (osrs-tracker/osrs-tracker-api#191), osrs-tracker-aws (osrs-tracker/osrs-tracker-aws#149), claude-skills (FreekMencke/claude-skills#90) and this repo (FreekMencke/claude-kb#229); freek-mencke-web and osrs-tracker-packages run it too. Still open: actionlint beside it (GHA-023).
6. **Decision: `actions/*` stay on major tags, third-party actions on full SHAs with a version comment.** GitHub-owned majors received checkout's security backport through the tag (GHA-004, GHA-017), setup-node's releases are immutable, and the tj-actions chain was third-party (GHA-024). Revisit if the SHA-pinning policy is turned on.
7. **Won't do now: workflow lockfiles** (GHA-010). Public preview since 2026-10-14, pre-1.0 with a schema change between releases, an open report of a fork-only commit passing verification, unreadable to zizmor until its 1.32, and not tested here. Revisit when zizmor reads `actions.lock` or the preview ends.
8. **When a repo first assumes an AWS role from Actions**: a `sub` with an exact branch or environment, the immutable format for repos created after 2026-07-15, and a rename or transfer treated as a trust-policy change (GHA-015, GHA-016, INFRA-020).
9. **No change: the CD workflow whose shared setup action saves `node_modules` on a cache miss under `workflow_run`.** Since 2026-06-26 that save only logs a warning (GHA-019). `cache-mode: read` wouldn't silence it until actions/cache releases its `ACTIONS_CACHE_MODE` skip; a restore-only path in the setup action would.

## Open questions

- **Lockfiles in practice** (GHA-010): not tested, because running the official `gh-actions-lock` v0.2.0 binary was refused by this session's permission classifier. Also open:
  - whether onboarding turns `@<sha> # v1.2.3` into a tag ref (its docs show tag rewrites, and open gh-actions-lock PRs #165 and #167 normalise SHAs to branch or tag names), which zizmor 1.31 would then flag;
  - whether Dependabot's lockfile regeneration (gated by the `github_actions_lockfile` experiment in dependabot-core) is on for every repo;
  - whether `docker://` images are locked (only a mutable-tag warning is documented);
  - whether GitHub Pro accounts get the preview (the changelog lists Free, Team and Enterprise Cloud).
- **Which actions/cache release ships the `ACTIONS_CACHE_MODE` skip** (GHA-019): merged to `main` 2026-07-15 (actions/cache#1781), not in v6.1.0. Re-check before relying on `cache-mode` to silence warnings.
- **Personal-account repos and the default `pull_request_target` policy** (GHA-021): no plan matrix found in about-actions-policies, control-workflow-execution, securely-using-pull_request_target, the REST policies page or the GA and preview posts.
- **Immutable `sub` beyond branches** (GHA-016): the docs show only `ref:refs/heads/…`; the environment, pull-request and tag forms are inferred. The changelog's "preview endpoint" for the new prefix isn't in the REST docs; the GET endpoint returns only the current format.
- **A trust policy without `sub`** (GHA-015): AWS's claim-key example has none, but IAM's create-role page says it checks that `sub` is present. Not tested.
- **Is `GITHUB_TOKEN` already the 520-character format?** (GHA-014): only the 2026-04-24 notice says the rollout includes it; no live token was inspected.
- **A cancelled run and a required check** (GHA-008): the docs list `success`, `skipped` and `neutral` as passing, so a cancelled run should block until a newer run reports; that is inferred, not stated.
- **ShellCheck 0.11.0 on our scripts** (GHA-001): not run; the binary wasn't downloaded.
- **`$/` in action manifests** (GHA-006): the changelog names runner 2.336.0, but a runner 2.338.0 release note fixes `$/` inside composite action manifests; which runner a hosted job needs for that case isn't stated.
