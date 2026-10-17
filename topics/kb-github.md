# GitHub through `gh` and the API: issues, rulesets, releases, Copilot cloud agent

Prefix `GH`. This file covers driving GitHub from an agent: sub-issues, issue dependencies and issue types with `gh` and REST, rulesets against branch protection for a small public repo, releases and their notes, which `gh` commands fail with which token or in which surface (and the REST fallback), `gh`'s own agent features, the GitHub MCP server against `gh`, and Copilot cloud agent and GitHub Agentic Workflows against Claude Code. GitHub Actions itself is in `kb-github-actions.md` (GHA); merge queue and auto-merge in SESS-024; the cloud GitHub proxy in SURF-025; `claude-code-action` in REPO-027.

Research basis:
- Researched 2026-10-17 and 2026-10-18 (FreekMencke/claude-kb#184, part of roadmap #167) by an Opus 5.5 lead with three Sonnet readers (issues and releases; rulesets and tokens; MCP server, Copilot cloud agent and Agentic Workflows).
- Read as raw text: GitHub Docs pages as Markdown from `docs.github.com/api/article/body?pathname=…` (gated-feature text from `github/docs` on `raw.githubusercontent.com`), GitHub changelog posts, the cli/cli release notes for v2.83.0 to v2.102.0 through `gh api repos/cli/cli/releases`, cli/cli source at tag v2.102.0, and the github-mcp-server and gh-aw repos at their release tags.
- A Sonnet refuter challenged five claims the recommendations rest on (gh's GraphQL-only issue flags, the Projects (classic) fix, `pull_request` bypass, personal-repo issue types, Copilot plans). It upheld all five and qualified three; the entries carry the qualifiers.
- Tested with gh 2.102.0 (2026-09-30), read-only: `gh issue view --json`, `gh api` on the sub-issue, dependency and issue-type endpoints, a GraphQL `issueTypes` query, and `gh ruleset check`, against this repo and two GitHub-owned ones. Nothing was created or changed.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| How do I add a sub-issue or a blocked-by link with `gh`? | gh 2.94.0 or later: `gh issue create --parent N --blocked-by N`, `gh issue edit N --add-sub-issue …`, `--add-blocked-by`, `--add-blocking`, `--type`. Read them with `--json parent,subIssues,blockedBy,blocking,issueType`. | GH-001 |
| Why does `gh issue edit --add-sub-issue` fail in a cloud session? | gh sets these through GraphQL mutations, which the cloud proxy rejects. Use the REST endpoints with `gh api`; their body fields take the issue's numeric `id`, not its number. | GH-002 |
| What are the limits on sub-issues and dependencies? | 100 sub-issues per parent, eight levels deep, same owner as the parent; 50 issues per dependency type. | GH-002 |
| Can a personal-account repo use issue types? | Not through `gh` or GraphQL: types belong to organizations, and GraphQL returns `null` for a personal repo. REST's repo endpoint still listed Task, Bug and Feature for one (2026-10-17). Use labels there. | GH-003 |
| Rulesets or branch protection for a personal public repo? | Rulesets: free on public repos, several layer, anyone with read access sees them, and bypass can be limited to PRs. Branch protection's bypass lists need an organization. | GH-004, GH-005 |
| Which rules for a solo maintainer with agents? | One branch ruleset: PR required with 0 approvals, required status checks, block force pushes, restrict deletions, admin bypass in `pull_request` mode. An author can't approve their own PR. | GH-005 |
| Can `gh` create a ruleset? | No: `gh ruleset` has only `list`, `view` and `check`. Create or change one with `gh api` on `/repos/{owner}/{repo}/rulesets`. | GH-005 |
| Why did `gh release create` tag the wrong commit? | A missing tag is created from the default branch's latest state. Pass `--target` or `--verify-tag`. | GH-006 |
| How do I configure generated release notes? | `.github/release.yml`: `changelog.exclude` labels and authors, `categories` with `labels` (`*` catches the rest). Only merged PRs are listed. | GH-007 |
| Why can't I upload an asset to my release? | With immutable releases on, assets and tag lock at publish. Create a draft, upload, then publish; `gh release create TAG files…` does that for you. | GH-008 |
| Which `gh` commands fail with a fine-grained PAT, an App token or in a cloud session? | Cloud sessions: anything on GraphQL (`gh pr`, `gh issue`). Fine-grained PATs: the Checks API, search beyond labels, user-owned Projects. REST fallbacks in GH-009. | GH-009 |
| Does `gh issue edit` still fail on the Projects (classic) error? | Not on github.com with gh 2.82.1 or later: from v2.102.0's source, it no longer requests `projectCards` there. Old distro packages of gh still hit it. | GH-010 |
| Does `gh` know it's run by Claude Code? | Yes: `CLAUDECODE` or `CLAUDE_CODE` in the environment. It then prints full help after a usage error, drops the animated spinner, and tags its telemetry; `GH_TELEMETRY=false` turns telemetry off. | GH-011 |
| GitHub MCP server or `gh` for Claude Code? | `gh`, when it's authenticated: no extra token or Docker, `--jq` keeps output small, and it works in cloud sessions. The server (v2.0.2: 93 tools, 45 by default) suits shell-less hosts, alert tools and lockdown mode for untrusted issues. | GH-012 |
| How do Copilot cloud agent and Agentic Workflows compare with Claude Code? | Copilot cloud agent (renamed 2026-04) runs on Actions for up to 59 minutes, pushes only `copilot/` branches and needs a paid Copilot plan. gh-aw (public preview 2026-06-11) compiles Markdown to locked Actions workflows with read-only agent jobs and "safe outputs"; it can run Claude Code. | GH-013, GH-014 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| GH-001 | Sub-issues, dependencies and issue types in `gh` 2.94+: flags and JSON fields | fact | gh, sub-issues, issue-dependencies, issue-types |
| GH-002 | The REST API for sub-issues and dependencies: numeric `id`s, limits, same owner | fact | rest-api, sub-issues, issue-dependencies, cloud |
| GH-003 | Issue types belong to organizations; "Relates to" links | fact | issue-types, personal-repos, relates-to |
| GH-004 | Rulesets against branch protection: what differs, and plan availability | comparison | rulesets, branch-protection, plans |
| GH-005 | A ruleset for a solo-maintainer public repo with agents | recommendation | rulesets, bypass, required-checks, gh-ruleset |
| GH-006 | `gh release create` pitfalls: auto-created tags, latest, empty releases | fact | releases, gh-release, tags |
| GH-007 | Generated release notes and `.github/release.yml` | fact | releases, release-notes, labels |
| GH-008 | Publishing to an immutable release: draft, upload, publish | pattern | immutable-releases, gh-release, assets |
| GH-009 | Which `gh` commands fail with which token or surface, and the REST fallbacks | fact | gh, fine-grained-pat, github-app, cloud, graphql |
| GH-010 | The Projects (classic) error in `gh pr edit` and `gh issue edit` | fact | gh, projects-classic, deprecation |
| GH-011 | `gh` for coding agents: agent detection, full help, telemetry, the `gh` skill | fact | gh, agents, telemetry, worktrees |
| GH-012 | GitHub MCP server v2 against `gh` for an agent | comparison | github-mcp-server, mcp, gh, context-cost |
| GH-013 | Copilot cloud agent against Claude Code and `claude-code-action` | comparison | copilot, cloud-agent, claude-code-action |
| GH-014 | GitHub Agentic Workflows (gh-aw) and the ideas worth borrowing | tool | gh-aw, agentic-workflows, safe-outputs, firewall |

## [GH-001] Sub-issues, dependencies and issue types in `gh` 2.94+: flags and JSON fields
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [gh v2.94.0 release notes](https://github.com/cli/cli/releases/tag/v2.94.0), [Changelog 2026-06-10: manage sub-issues, types and dependencies from GitHub CLI](https://github.blog/changelog/2026-06-10-manage-sub-issues-types-and-dependencies-from-github-cli/), [Creating issue dependencies](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies), [Adding sub-issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues), [gh issue view](https://cli.github.com/manual/gh_issue_view)
- Related: GH-002, GH-003, GH-009

gh v2.94.0 (2026-06-10) "brings GitHub's advanced issue features to `gh issue create`, `edit`, `view`, and `list`". On GHES, "Issue types and sub-issues are available on GitHub.com and GHES 3.17+; relationships require GHES 3.19+."

| | `gh issue create` | `gh issue edit` |
|---|---|---|
| Sub-issues | `--parent N` | `--parent N`, `--remove-parent`, `--add-sub-issue N,M`, `--remove-sub-issue` |
| Dependencies | `--blocked-by N,M`, `--blocking N` | `--add-blocked-by`, `--add-blocking`, `--remove-blocked-by`, `--remove-blocking` |
| Type | `--type Bug` | `--type`, `--remove-type` |

Flags take issue numbers or URLs, comma-separated. `gh issue view` prints "Blocked by" and "Blocking" rows, and `--json` (on `list` too) has `parent`, `subIssues`, `subIssuesSummary`, `blockedBy`, `blocking` and `issueType`.

`subIssues`, `blockedBy` and `blocking` are objects, `{"nodes":[…],"totalCount":N}`, not arrays: `--jq '.subIssues[0]'` fails with "expected an array but got: object"; use `.subIssues.nodes[0]`. gh fetches the first 100 sub-issues and the first 50 of each dependency list, the platform limits (GH-002). Closed blockers stay in `blockedBy`.

Tested 2026-10-17, gh 2.102.0: `gh issue view 194 --json parent,blockedBy` on this repo returned the parent object and 13 `blockedBy` nodes, closed ones included.

## [GH-002] The REST API for sub-issues and dependencies: numeric `id`s, limits, same owner
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [REST: sub-issues](https://docs.github.com/en/rest/issues/sub-issues), [REST: issue dependencies](https://docs.github.com/en/rest/issues/issue-dependencies), [Adding sub-issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues), [Changelog 2025-08-21: dependencies on issues](https://github.blog/changelog/2025-08-21-dependencies-on-issues/), [Permissions for fine-grained PATs](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens), [cli/cli `api/queries_issue.go` at v2.102.0](https://github.com/cli/cli/blob/v2.102.0/api/queries_issue.go)
- Related: GH-001, GH-009, SURF-025

gh's issue-hierarchy flags call GraphQL mutations (`addSubIssue`, `removeSubIssue`, `addBlockedBy`, `removeBlockedBy`, `updateIssueIssueType` in v2.102.0's source), with no REST fallback. Where GraphQL is blocked, as in Claude Code cloud sessions (SURF-025), they fail along with the rest of `gh issue create` and `edit`. The REST endpoints work there:

```bash
id=$(gh api repos/OWNER/REPO/issues/CHILD --jq .id)          # numeric id, not the number
gh api -X POST repos/OWNER/REPO/issues/PARENT/sub_issues -F sub_issue_id=$id
gh api -X PATCH repos/OWNER/REPO/issues/PARENT/sub_issues/priority -F sub_issue_id=$id -F after_id=OTHER_ID
gh api -X DELETE repos/OWNER/REPO/issues/PARENT/sub_issue -F sub_issue_id=$id   # singular path
gh api -X POST repos/OWNER/REPO/issues/CHILD/dependencies/blocked_by -F issue_id=BLOCKER_ID
gh api -X DELETE repos/OWNER/REPO/issues/CHILD/dependencies/blocked_by/BLOCKER_ID
gh api 'repos/OWNER/REPO/issues/PARENT/sub_issues?per_page=100'   # list; default page is 30
```

- "Blocking" has only a GET; to make A block B, add A to B's `blocked_by`. `GET …/issues/N/parent` returns the parent.
- Limits: "up to 100 sub-issues per parent issue and … up to eight levels of nested sub-issues"; "You can link up to 50 issues for each relationship type" (dependencies GA 2025-08-21).
- The sub-issue "must belong to the same repository owner as the parent issue". A child that already has a parent gets a 422 unless `replace_parent` is true.
- Search: `is:blocked`, `is:blocking`, `blocked-by:`, `blocking:`.
- Fine-grained PATs need Issues write for the POST, PATCH and DELETE calls.
- The issue object carries `sub_issues_summary` and `issue_dependencies_summary`; there `blocked_by` counts open blockers and `total_blocked_by` all of them.

Tested 2026-10-17, gh 2.102.0: issue #184 here returned `"blocked_by":0,"total_blocked_by":1` with its one blocker closed.

## [GH-003] Issue types belong to organizations; "Relates to" links
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Managing issue types in an organization](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/managing-issue-types-in-an-organization), [REST: issue types](https://docs.github.com/en/rest/orgs/issue-types), [Changelog 2026-06-10: GitHub CLI](https://github.blog/changelog/2026-06-10-manage-sub-issues-types-and-dependencies-from-github-cli/), [Changelog 2025-04-09: sub-issues and issue types GA](https://github.blog/changelog/2025-04-09-evolving-github-issues-and-projects/), [Changelog 2026-09-25: "Relates to" GA](https://github.blog/changelog/2026-09-25-personal-saved-views-for-repository-issues-and-more/), [Community discussion #175785](https://github.com/orgs/community/discussions/175785)
- Related: GH-001, GH-002

Sub-issues and issue types went GA on 2025-04-09. "Issue types are configured at the organization level, so type support applies to issues in organizations that have defined them." An organization can "create up to 25 issue types"; "The default types are task, bug, and feature" (the API returns `Task`, `Bug`, `Feature`; gh matches names case-insensitively). Types are managed through `/orgs/{org}/issue-types`, with the organization permission "Issue Types".

On a personal-account repo:
- GraphQL `repository.issueTypes` returns `null`, so `gh issue create --type` finds no type to match and the interactive prompt skips the question (gh v2.102.0 source).
- REST `GET /repos/{owner}/{repo}/issue-types` (listed in the PAT permissions table under Metadata, without a docs page of its own) still returned Task, Bug and Feature for one. The two APIs disagree; treat types as unavailable and use labels. A community discussion (#175785, 2025-10 to 2026-06) agrees types are organization-only; its claim that sub-issues are too is wrong: this personal repo's roadmap has 27.

"Relates to", a third relationship, went GA on 2026-09-25 and "now works across the REST API, GraphQL API, webhooks, timeline events, issues search, and projects search". Its REST paths are `…/issues/{n}/relates_to` (GET, POST) and `…/relates_to/{issue_id}` (DELETE); gh 2.102.0 has no flag for it.

Tested 2026-10-17, gh 2.102.0: the GraphQL query returned `null` for this repo and three types for cli/cli; the REST repo endpoint returned three enabled types for this repo.

## [GH-004] Rulesets against branch protection: what differs, and plan availability
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets), [Gated feature text for rulesets](https://github.com/github/docs/blob/main/data/reusables/gated-features/repo-rules.md), [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), [REST: rules](https://docs.github.com/en/rest/repos/rules), [Converting branch protections to rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/converting-branch-protections-to-rulesets)
- Related: GH-005, SESS-023, SESS-024

"Rulesets and branch protection rules can both protect branches in a repository. They work alongside each other, and all applicable rules are enforced."

| | Rulesets | Branch protection |
|---|---|---|
| Several on one branch | Yes, "the most restrictive version of the rule applies" | "only one branch protection rule applies" |
| Who can see them | "Anyone with read access" | Admins |
| Turn off without deleting | Yes (enforcement `active`/`disabled`; `evaluate` "is only available with GitHub Enterprise") | No |
| Targets | branches, tags, pushes, repositories | branches |
| Bypass list | Repo roles, users, apps, Dependabot; modes `always`, `pull_request`, `exempt` | "only … when the repository belongs to an organization" |
| Only here | | "Lock branch", "Do not allow bypassing the above settings" |

Limits: "up to 75 rulesets per repository, and 75 organization-wide rulesets".

Availability: rulesets are "available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, and GitHub Enterprise Cloud". Push rulesets need private or internal repos on Team; organization-wide rulesets need Team or Enterprise.

The Branches settings page converts a rule ("Convert to ruleset"), except "Require conversation resolution before merging", which becomes part of the ruleset's pull-request rule. A kept branch protection rule still applies, so changes must satisfy both. GitHub doesn't tell you to switch; it calls rulesets more flexible.

## [GH-005] A ruleset for a solo-maintainer public repo with agents
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets), [Creating rulesets for a repository](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository), [REST: rules](https://docs.github.com/en/rest/repos/rules), [Approving a pull request with required reviews](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews), [gh ruleset](https://cli.github.com/manual/gh_ruleset)
- Related: GH-004, SESS-023, SESS-024, GHA-008

One branch ruleset on the default branch:
- **Require a pull request, 0 approvals.** "The pull request doesn't necessarily have to be approved, but it must be opened." Don't require one: "Pull request authors cannot approve their own pull requests", so a solo maintainer could only merge by bypassing.
- **Required status checks**, naming one aggregate job (GHA-008). "Require branches to be up to date" (`strict_required_status_checks_policy`) makes every PR rebase after each merge (SESS-023); leave it off when sessions merge often.
- **Block force pushes** and **Restrict deletions**, both on by default.
- **Bypass**: the admin role (`RepositoryRole`; "OrganizationAdmin is not applicable for personal repositories") with `bypass_mode: pull_request`, which lets the admin merge a PR past the rules but not push straight to the branch. `always` allows direct pushes.
- Optional: **Require linear history**, which needs squash or rebase merging allowed.

A merge queue is the `merge_queue` rule, but personal-account repos get none (SESS-024).

The CLI only reads: `gh ruleset list`, `gh ruleset view <id>` (without an ID it prompts) and `gh ruleset check <branch>`, which shows the rules for a branch name that need not exist. Write with `gh api` on `POST /repos/{owner}/{repo}/rulesets` and `PUT …/rulesets/{id}` (Administration write for a fine-grained PAT). `GET /repos/{owner}/{repo}/rules/branches/{branch}` returns active rules only.

Tested 2026-10-17, gh 2.102.0: `gh ruleset check main -R FreekMencke/claude-kb` listed each rule with the ruleset it came from.

## [GH-006] `gh release create` pitfalls: auto-created tags, latest, empty releases
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [gh release create](https://cli.github.com/manual/gh_release_create), [REST: releases](https://docs.github.com/en/rest/releases/releases), [Managing releases in a repository](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository), [About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases), [cli/cli `release/create/create.go` at v2.102.0](https://github.com/cli/cli/blob/v2.102.0/pkg/cmd/release/create/create.go)
- Related: GH-007, GH-008, DOC-006

- **The tag**: "If a matching git tag does not yet exist, one will automatically get created from the latest state of the default branch. Use `--target` to point to a different branch or commit … Use `--verify-tag` to abort the release if the tag doesn't already exist." A tag created locally but not pushed stops gh with "tag %s exists locally but has not been pushed".
- **Latest**: REST's latest release "is the most recent non-prerelease, non-draft release, sorted by the created_at attribute" ("the date of the commit used for the release"), while the UI steps in "Managing releases" say the label "will automatically be assigned based on semantic versioning"; gh's help says "automatic based on date and version". A patch for an older line may take "Latest" either way; pass `--latest=false`.
- **Empty releases**: "By default, the release is created even if there are no new commits since the last release"; `--fail-on-no-commits` stops that (not for a first release).
- **Notes**: `--generate-notes` (GH-007), `--notes-start-tag`, or `--notes-from-tag`, which reads an annotated tag or falls back to the commit message and can't combine with `--generate-notes` or `--repo`.
- **Limits**: "Up to 1000 release assets may be associated with a single release. Each file included in a release must be under 2 GiB."
- **Downloads**: `gh release download` works without authentication on public repos since v2.96.0. Use v2.102.0 or later: it fixed a symlink flaw that "could write remote content to an unintended local file" (GHSA-39wj-f2f4-978v).

## [GH-007] Generated release notes and `.github/release.yml`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Automatically generated release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes), [REST: generate release notes](https://docs.github.com/en/rest/releases/releases#generate-release-notes-content-for-a-release), [gh release create](https://cli.github.com/manual/gh_release_create)
- Related: GH-006, DOC-006

Generated notes list merged pull requests, their contributors and a full-changelog link. Configure them in `.github/release.yml` (or `.yaml`):

```yaml
changelog:
  exclude:
    labels: [ignore-for-release]
    authors: [dependabot]
  categories:
    - title: Breaking changes
      labels: [breaking]
    - title: Features
      labels: [enhancement]
    - title: Other changes
      labels: ["*"]
```

- `categories[*].title` and `categories[*].labels` are required; each category also takes `exclude.labels` and `exclude.authors`. "Use `*` as a catch-all for pull requests that didn't match any of the previous categories"; without it, unmatched PRs don't show.
- Direct pushes and issues don't appear: only PRs are listed. A repo that keeps a hand-written CHANGELOG.md (DOC-006) gets nothing from this beyond the contributor list.
- `gh release create --generate-notes` adds a generated title unless you pass one, and puts `--notes` text before the generated notes; `--notes-start-tag` sets the starting tag.
- To preview without releasing: `POST /repos/{owner}/{repo}/releases/generate-notes` with `tag_name`, `previous_tag_name` and `configuration_file_path`; `target_commitish` is "Required if the supplied tag_name does not reference an existing tag".

## [GH-008] Publishing to an immutable release: draft, upload, publish
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Managing releases in a repository](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository), [gh release create](https://cli.github.com/manual/gh_release_create), [cli/cli `release/create/create.go` at v2.102.0](https://github.com/cli/cli/blob/v2.102.0/pkg/cmd/release/create/create.go)
- Related: GHA-011, GH-006

What immutable releases lock, and how to verify one, is in GHA-011. For the publisher: "If you have enabled immutable releases for your repository, you cannot add, replace, or delete assets after a release is published, and you cannot move or delete its tag while the release exists. You can still edit the title and release notes, and change whether the release is a pre-release or the latest release." The docs recommend creating "releases as drafts first, attach all assets, and then publish".

In `gh`:
- `gh release create v1.2.3 dist/*.tgz` already does it: "separate API calls are made to create the release as a draft, upload the assets, and then publish the release". If an upload fails, gh deletes the draft.
- `gh release create v1.2.3` followed by `gh release upload v1.2.3 file` fails once the release is published, and `--clobber` can't replace an asset either. Upload in the same command, or create with `--draft`, upload, then `gh release edit v1.2.3 --draft=false`.
- "Immutability is enforced only after a release is published. Draft releases can be modified or deleted, and the associated git tags can be modified or deleted as well."

A CI job that builds assets in several jobs should create the draft first and publish in a final job.

## [GH-009] Which `gh` commands fail with which token or surface, and the REST fallbacks
- Type: fact
- Applies to: Claude Code, general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Cloud environments](https://code.claude.com/docs/en/cloud-environments), [Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens), [Endpoints available for fine-grained PATs](https://docs.github.com/en/rest/authentication/endpoints-available-for-fine-grained-personal-access-tokens), [Permissions for fine-grained PATs](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens), [gh auth login](https://cli.github.com/manual/gh_auth_login), [cli/cli#14309](https://github.com/cli/cli/issues/14309), [cli/cli#8352](https://github.com/cli/cli/issues/8352)
- Related: SURF-025, ORCH-017, SESS-022, GH-002, GHA-014

- **Cloud sessions and routines**: the proxy rejects GraphQL, "regardless of the credentials you supply, so a `GH_TOKEN` you set gets the same 403". `gh pr` and `gh issue` fail; "`gh` subcommands that use the REST API, such as `gh workflow list`, work too" (SURF-025).
- **Fine-grained PATs** can't "call the Checks API", "access Projects owned by a user account", "access multiple organizations at once" or Packages, or write to public repos you aren't a member of. gh's help: "Favour setting `GH_TOKEN` for fine-grained personal access token usage". `gh pr merge --auto` with one fails on a merge-queue branch (cli/cli#8352, open).
- **App installation tokens**: `--attach` rejects them (cli/cli#14309, open).

REST fallbacks (`gh api` fills in `{owner}` and `{repo}` from the current repo):

| Instead of | Use |
|---|---|
| `gh pr create` | `gh api -X POST repos/{owner}/{repo}/pulls -f title=… -f head=BRANCH -f base=main -F body=@body.md` |
| `gh pr edit` | `gh api -X PATCH repos/{owner}/{repo}/pulls/N -f title=…` |
| `gh pr view --json mergeable` | `gh api repos/{owner}/{repo}/pulls/N --jq '{mergeable,mergeable_state}'` (`null` while computing; SESS-022) |
| `gh pr checks` | `gh api repos/{owner}/{repo}/commits/SHA/check-runs`; with a fine-grained PAT, `…/commits/REF/status` |
| `gh pr merge` | `gh api -X PUT repos/{owner}/{repo}/pulls/N/merge -f merge_method=squash` |
| `gh issue edit --add-assignee` / `--add-label` | `gh api -X POST repos/{owner}/{repo}/issues/N/assignees -f 'assignees[]=LOGIN'`, `…/labels -f 'labels[]=NAME'` |
| `gh issue create` | `gh api -X POST repos/{owner}/{repo}/issues -f title=… -F body=@body.md` |

A REST response's `X-Accepted-GitHub-Permissions` header names the permission needed.

## [GH-010] The Projects (classic) error in `gh pr edit` and `gh issue edit`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Changelog 2024-05-23: Projects (classic) sunset](https://github.blog/changelog/2024-05-23-sunset-notice-projects-classic/), [gh v2.82.1 release notes](https://github.com/cli/cli/releases/tag/v2.82.1), [cli/cli#14598](https://github.com/cli/cli/issues/14598), [cli/cli#14622](https://github.com/cli/cli/issues/14622), [cli/cli `feature_detection.go` at v2.102.0](https://github.com/cli/cli/blob/v2.102.0/internal/featuredetection/feature_detection.go)
- Related: GH-009

The error reads "GraphQL: Projects (classic) is being deprecated in favor of the new Projects experience … (repository.pullRequest.projectCards)". GitHub's timeline: Projects (classic) sunset on 2024-08-23, its REST API on 2025-04-01, and "October 22, 2025: GitHub CLI versions older than v2.82.1 will fail to fetch projects". v2.82.1 fixed `gh pr edit` "not correctly detecting the classic projects API deprecation".

In v2.102.0's source, `ProjectsV1()` reports classic projects as unsupported for any non-Enterprise host, and both `gh issue edit` and `gh pr edit` then leave `projectCards` out of their queries. A maintainer closed the 2026-10-05 report (#14598) as an old distro build ("This issue has been fixed since 2.73 or so"). A duplicate (#14622) suggests a repo with a classic project still attached may hit it on github.com; that is unconfirmed.

So on github.com:
- Check `gh --version` first: distro packages lag years behind. Install from cli.github.com's own repository.
- With gh 2.82.1 or later the error shouldn't occur; if it does, the REST calls in GH-009 do the same edit.
- In cloud sessions `gh issue edit` fails for a different reason, GraphQL being blocked (GH-009).

## [GH-011] `gh` for coding agents: agent detection, full help, telemetry, the `gh` skill
- Type: fact
- Applies to: Claude Code, general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [cli/cli `internal/agents/detect.go` at v2.102.0](https://github.com/cli/cli/blob/v2.102.0/internal/agents/detect.go), [cli/cli releases](https://github.com/cli/cli/releases), [GitHub CLI telemetry](https://docs.github.com/en/github-cli/github-cli/github-cli-telemetry), [Claude Code environment variables](https://code.claude.com/docs/en/env-vars), [Claude Code changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md), [cli/cli `skills/gh/SKILL.md` at v2.102.0](https://github.com/cli/cli/blob/v2.102.0/skills/gh/SKILL.md)
- Related: GH-001, GH-009, SESS-025

`gh` detects an agent from the environment: `AI_AGENT` first, then per-tool variables, for Claude Code `CLAUDECODE` or `CLAUDE_CODE` (Cowork: `CLAUDE_CODE_IS_COWORK`). Claude Code sets `CLAUDECODE=1` in its subprocesses and, since 2.1.120, `AI_AGENT` "so `gh` can attribute traffic to Claude Code". When detected, gh:
- prints the full command help after a usage error (v2.100.0), "giving AI agents the examples, JSON fields and environment variables they need to correct themselves without a second round trip";
- shows a text-only spinner (v2.99.0; `GH_SPINNER_DISABLED` overrides);
- records the agent in its User-Agent and telemetry. Telemetry is on since v2.91.0 (2026-04-22); turn it off with `GH_TELEMETRY=false`, `DO_NOT_TRACK=true` or `gh config set telemetry disabled`, and print it instead with `GH_TELEMETRY=log`.

Other agent-relevant additions: `gh pr checkout --worktree PATH` (v2.98.0) and `gh issue develop N --checkout --worktree PATH` (v2.99.0); `--attach` for images and videos on issues, PRs and comments (v2.99.0); `gh repo read-file` and `read-dir`, in preview, to read a repo without cloning (v2.95.0). `GH_TOKEN` takes precedence over `GITHUB_TOKEN`.

cli/cli ships a `gh` skill (`gh skill install cli/cli gh --scope user`), about 1,700 words on JSON output, pagination, issue relationships, attachments and `gh api` fallbacks, updated with each release.

Tested 2026-10-18, gh 2.102.0, Claude Code subagent Bash tool on Linux: `AI_AGENT` read `claude-code_2-1-299_agent`. `gh issue view --nosuchflag` printed the full help with examples under Claude Code, and terse usage with `AI_AGENT` and `CLAUDECODE` emptied.

## [GH-012] GitHub MCP server v2 against `gh` for an agent
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [github-mcp-server README at v2.0.2](https://github.com/github/github-mcp-server/blob/v2.0.2/README.md), [v2.0.0 release notes](https://github.com/github/github-mcp-server/releases/tag/v2.0.0), [Remote server](https://github.com/github/github-mcp-server/blob/v2.0.2/docs/remote-server.md), [Install in Claude](https://github.com/github/github-mcp-server/blob/v2.0.2/docs/installation-guides/install-claude.md), [Scope filtering](https://github.com/github/github-mcp-server/blob/v2.0.2/docs/scope-filtering.md), [Using the GitHub MCP server](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/use-the-github-mcp-server)
- Related: TOK-020, TOK-021, TOK-022, INFRA-007, MCP-021, REPO-039

The server is "available to all GitHub users regardless of plan type". v2.0.0 (2026-10-06) added typed output schemas for "*Code Mode* or *Programmatic Tool Calling*" clients on MCP spec 2026-07-28 or later; it didn't redesign the tools. Dynamic toolsets were removed in v1.1.0 (2026-05-28).

- **Size**: 93 tools in v2.0.2's README across 22 toolsets; the default set (context, repos, issues, pull_requests, users) is 45. Narrow it with `--toolsets`/`GITHUB_TOOLSETS`, `--tools`, `--read-only`, or on the remote server `/x/<toolset>`, `/readonly` and `X-MCP-*` headers. Only classic PATs hide tools the token can't use; fine-grained PATs and App tokens show all. Claude Code defers MCP definitions through tool search (TOK-020); per-token figures are in TOK-021.
- **Auth from Claude Code**: remote `https://api.githubcopilot.com/mcp` with an `Authorization: Bearer` PAT header (`claude mcp add-json`, Claude Code 2.1.1+), or the `ghcr.io/github/github-mcp-server` image or binary with `GITHUB_PERSONAL_ACCESS_TOKEN`.
- **Lockdown mode** (`--lockdown-mode`, `X-MCP-Lockdown`) hides or rejects public-repo content from authors without push access. It's "a best-effort content filter … It is **not** an authorization boundary".

`gh` fits better when:
- it's already authenticated: in cloud sessions through the proxy (SURF-025), with no Docker or extra token;
- the agent pipes JSON through `--jq`, keeping output small (INFRA-007);
- the data is GraphQL-only (`gh api graphql`).

The server fits a host without a shell, a read-only token for code-scanning, secret-scanning and Dependabot alert tools, or lockdown when reading untrusted issues. GitHub publishes no comparison with `gh`; this split is a judgement from the docs above.

## [GH-013] Copilot cloud agent against Claude Code and `claude-code-action`
- Type: comparison
- Applies to: Claude Code, general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [About Copilot cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent), [Risks and mitigations](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations), [Customize the agent environment](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/customize-the-agent-environment), [Cloud agent access](https://docs.github.com/en/copilot/concepts/enterprise/cloud-agent-access), [Third-party coding agents](https://docs.github.com/en/copilot/concepts/agents/about-third-party-agents), [Copilot billing](https://docs.github.com/en/billing/concepts/product-billing/github-copilot-billing), [Changelog 2026-04-01](https://github.blog/changelog/2026-04-01-research-plan-and-code-with-copilot-cloud-agent/)
- Related: REPO-027, REPO-038, SURF-024, SURF-025, GH-014

"Copilot cloud agent (formerly known as Copilot coding agent)" (changelog 2026-04-01) works in "an ephemeral cloud development environment" on Actions and opens a PR. Start it by assigning an issue or with `gh agent-task create` (preview).

| | Copilot cloud agent | Claude Code cloud session | `claude-code-action` |
|---|---|---|---|
| Runs on | Actions runner; `.github/workflows/copilot-setup-steps.yml` (one job, `timeout-minutes` max 59) | Anthropic VM (SURF-024) | Your workflow |
| Limit | "maximum execution time of 59 minutes", one repo, one branch, one PR per task | | your `timeout-minutes` |
| Branch | `copilot/…`; "cannot directly run `git push`" | `claude/…` through the proxy | the workflow token's rights |
| Gate | Only write-access users trigger it; can't mark ready, approve or merge; CI waits for "Approve and run workflows" | | write-access gate (REPO-038) |
| Instructions | `.github/copilot-instructions.md`, `AGENTS.md`, or a root `CLAUDE.md` | `CLAUDE.md` | `CLAUDE.md` |
| Network | Firewall on its Bash tool only, not MCP servers or setup steps | | none by default |
| Cost | AI credits ("1 AI credit = $0.01 USD") plus Actions minutes | plan usage | API or plan, plus minutes |

Plans: included in Student, on by default for Pro, Pro+ and Max, off by default for Business and Enterprise, not in Free. Claude can run inside this flow: "Third-party coding agents are currently in public preview", and "The Anthropic Claude coding agent uses the Claude Agent SDK and can be powered by your existing Copilot subscription." Copilot's scheduled "Automations" "are not available in public repositories".

## [GH-014] GitHub Agentic Workflows (gh-aw) and the ideas worth borrowing
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Changelog 2026-06-11: public preview](https://github.blog/changelog/2026-06-11-github-agentic-workflows-is-now-in-public-preview/), [About GitHub Agentic Workflows](https://docs.github.com/en/copilot/concepts/agents/about-github-agentic-workflows), [gh-aw overview at v0.92.0](https://github.com/github/gh-aw/blob/v0.92.0/docs/src/content/docs/introduction/overview.mdx), [gh-aw architecture](https://github.com/github/gh-aw/blob/v0.92.0/docs/src/content/docs/introduction/architecture.mdx), [gh-aw engines](https://github.com/github/gh-aw/blob/v0.92.0/docs/src/content/docs/reference/engines.md), [gh-aw billing](https://github.com/github/gh-aw/blob/v0.92.0/docs/src/content/docs/reference/billing.md)
- Related: REPO-027, REPO-038, REPO-039, GHA-013, GH-013

Public preview since 2026-06-11 (technical preview 2026-02-13); v0.92.0 on 2026-10-15. A workflow is Markdown with YAML frontmatter; `gh aw compile` (extension `github/gh-aw`) turns it into "a hardened GitHub Actions workflow `.lock.yml` file". "Built-in engines are **GitHub Copilot** (default), **Claude Code**, **OpenAI Codex**, **Google Gemini**, and **Pi**"; with Claude, "inference is billed directly to your Anthropic account".

Its security layers, each an idea for a `claude-code-action` workflow (triggers default to `[admin, maintainer, write]` roles):
- **Safe outputs**: "The agent job runs with minimal read-only permissions, while write operations are deferred to separate jobs that execute only after the agent completes." For the action: the Claude job gets `contents: read` and uploads its result as an artifact; a later job with `issues: write` posts it. This goes further than REPO-038's "split read and act".
- **Threat detection**: a second agent checks the buffered outputs and patch before any write; on by default with safe outputs.
- **Egress firewall**: the agent runs in a container behind a Squid proxy with a domain allowlist (`network: defaults`).
- **Integrity filtering**: "For public repositories, `min-integrity: approved` is applied automatically", so the agent reads only owners', members' and collaborators' content (REPO-039).
- **Budgets by default**: "a 20-minute timeout on the agentic step, a 60-minute timeout on the generated agent job, a 10-minute timeout on the generated detection job, 1000 AI Credits per workflow run, and 5000 AI Credits per workflow per day".

Its README warns "Use it with caution, and at your own risk", and opens with text addressed to agents ("Hello fellow agent!").

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-17 against this repo, claude-skills, freek-mencke-web, osrs-tracker-web and osrs-tracker-api.

1. **In cloud sessions and routines, set issue relationships through REST** (GH-002, GH-009): `gh issue edit --add-sub-issue`, `--add-blocked-by` and `--type` use GraphQL and fail there. The `roadmap-issues` skill (FreekMencke/claude-skills) already uses the REST endpoints with numeric `id`s, so no change. Locally the gh flags are shorter and resolve numbers themselves.
2. **Reword the user-level instruction that `gh issue edit` "fails on the Projects (classic) error"** (GH-010): with gh 2.82.1 or later on github.com it shouldn't, and gh 2.102.0 is installed. Keep the REST assignee call for cloud sessions, where GraphQL is blocked, and say that's the reason. It's a personal instruction file, not a repo, so there's no issue for it.
3. **Use GH-005's ruleset as the template for each public repo's default branch**: PR required with 0 approvals, one aggregate required check, no strict up-to-date rule where sessions merge often (SESS-023), force pushes and deletions blocked, admin bypass in `pull_request` mode. Check a repo with `gh ruleset check main`.
4. **Decision: no GitHub MCP server** (GH-012, TOK-022). `gh` is authenticated everywhere we work, including cloud sessions, and returns filtered JSON. Revisit if we need code-scanning or secret-scanning alerts in a session, then with `--read-only`, lockdown and only those toolsets.
5. **Decision: neither Copilot cloud agent nor gh-aw** (GH-013, GH-014). Both need a paid Copilot plan or an extra engine key in Actions, and gh-aw is a pre-1.0 preview. When a repo first gets a `claude-code-action` job that writes, borrow gh-aw's safe outputs: the Claude job read-only, a separate job doing the write (REPO-038).
6. **No change: releases.** None of the five repos publishes GitHub releases on 2026-10-17. When one does: `--verify-tag`, `.github/release.yml` with a `*` category, and immutable releases with the draft-upload-publish flow (GH-006 to GH-008, GHA-011).
7. **Optional: `GH_TELEMETRY=false`** in the shell profile, if gh's telemetry is unwanted (GH-011). It carries the agent name since v2.91.0.

## Open questions

- **Issue types on personal repos** (GH-003): GraphQL `repository.issueTypes` is `null` for this personal repo while REST `GET /repos/{owner}/{repo}/issue-types` lists Task, Bug and Feature. No docs page for the repo endpoint or changelog post on personal-account types was found (issue-types docs, REST issue-types page, one changelog search). Not tested by setting a type, which would change a real issue.
- **Immutable releases** (GH-008): the server's error when uploading to a published immutable release, and whether a draft creates its tag at draft or publish time. Not in about-releases, managing-releases or the REST releases page; not tested (it needs a scratch repo).
- **Cross-owner and cross-repo links** (GH-002): the REST docs require the same owner for sub-issues; the rule for dependencies across repos or owners and the exact 422 text weren't found.
- **Projects (classic) on a repo with a classic project still attached** (GH-010): cli/cli#14622 suggests it can still fail; unconfirmed.
- **Fine-grained PATs and search** (GH-009): `/search/issues` and `/search/code` aren't on the fine-grained PAT endpoint list, which would affect `gh search`; not tested without such a token.
- **Copilot** (GH-013): a dedicated rename post (only the 2026-04-01 post and a 2026-04-23 usage-metrics post mention it); when billing moved from premium requests to AI credits; whether a personal Copilot Pro plan runs the cloud agent on a public repo owned by a Free account (no page says it can't).
- **GitHub MCP server** (GH-012): why the README's tool list went from 97 entries at v1.14.0 to 93 at v2.0.2; whether Claude Code's own OAuth flow works with the remote server (only the PAT header is documented).
- **Rulesets** (GH-005): whether "Repository owners and administrators can merge a pull request even if it hasn't received an approving review" also holds under a ruleset without a bypass entry.
