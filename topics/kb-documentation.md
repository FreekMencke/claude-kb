# Repo documentation: changelogs, READMEs, decision records and drift

Prefix: DOC. Last verified for all entries: 2026-10-13, against the sources live that day and the `origin/main` of all eight of our repos (Claude Code v2.1.296, WSL terminal). This file covers the docs Claude writes and maintains for people in a repo: CHANGELOG.md, README.md, decision records, runbooks and plan docs, and how to keep them from drifting. CLAUDE.md, rules and auto memory are in `kb-memory.md` (MEM), their wording in `kb-prompting.md` (PROMPT), and changelog merge conflicts between parallel PRs in `kb-sessions.md` (SESS-026, SESS-027).

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which changelog spec should we follow? | Keep a Changelog 2.0.0 (2026-06-07), not 1.1.0. The format is unchanged; the guidance is new: curate, write plainly, a brief for LLM drafts, no required CI check. | DOC-001, DOC-002 |
| Should every change get a changelog entry? | Keep a Changelog 2.0 says no: "It lists the notable ones." Our five changelogs say every change. That's a deliberate difference while sessions also read the changelog as history. | DOC-002, DOC-018 |
| How should Claude write changelog entries? | Give it the Keep a Changelog 2.0 brief in CLAUDE.md: notable, user-facing changes; no git log; the reason in the text; mark breaking changes; then read the result. | DOC-003, DOC-007 |
| How do I head a changelog for an app with no versions? | A date works as the version scheme: `## 2026-10-13`, or dated entries under `Unreleased`. Use ISO `YYYY-MM-DD`; four of our repos use `YYYY/MM/DD`. | DOC-004, DOC-018 |
| Generated changelog from Conventional Commits? | Fine for an SDK on release-please (Anthropic's own SDK does it). For readers it's "raw material at best". Don't generate ours. | DOC-006, DOC-007 |
| Should CI fail a PR without a changelog entry? | Keep a Changelog 2.0: never as a required check on every change. Use a reminder, or a check with a skip label like Anthropic's SDK (`skip-changelog`). | DOC-008 |
| Where do our repos' changelog rules disagree? | api and web: CLAUDE.md says every change, the reviewer checks only user-visible ones. Doc-only changes, Dependabot, date format, title and package headings differ too. | DOC-018, DOC-019 |
| What belongs in a README versus CLAUDE.md? | README: what, why, how to run, where to get help, for people. CLAUDE.md: what Claude can't derive. Link docs from CLAUDE.md instead of pasting them. | DOC-009, DOC-012 |
| How should we record decisions? | Context, decision, when to revisit, dated, newest first, and read by the reviewer. One file is fine for a few dozen. Split into numbered MADR files once records get superseded. | DOC-011, DOC-021 |
| Is there an official Anthropic skill for READMEs or changelogs? | No. `doc-coauthoring` is for proposals and specs, and `claude-md-management` covers CLAUDE.md only. The prompt library has a release-notes recipe. | DOC-010, DOC-009 |
| How do I keep docs from drifting? | Change docs in the same PR. Add cross-file rules for the reviewer ("a new env var and the Lambda README"). Run cheap linters (lychee, Prettier). Audit with `refresh-md-files` now and then. | DOC-013, DOC-014, DOC-020 |
| Does an agent that syncs docs on merge work? | Unproven. The routines page names "Docs drift" as a use case; nobody has published results. Prefer same-PR updates plus reviewer rules. | DOC-015 |
| How should a doc be written so agents find things? | Descriptive headings, the key term early, a table of contents over 100 lines, absolute dates, one level of links. Mostly carried over from Anthropic's skill guidance. | DOC-016 |
| Where do runbooks go: `docs/` or a skill? | A skill when only sessions run it (deploy, release). `docs/` when a person must find it during an incident. | DOC-023 |
| What happens to a plan doc after the work is done? | Give it a dated status line and "delete this file once every step is done". | DOC-022 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| DOC-001 | Keep a Changelog 2.0.0: what changed from 1.1.0 | fact | changelog, keep-a-changelog, spec |
| DOC-002 | Curate, don't accumulate: notable changes only | fact | changelog, curation, dependencies |
| DOC-003 | The brief for an LLM-drafted changelog belongs in CLAUDE.md | recommendation | changelog, claude-md, llm |
| DOC-004 | Changelogs without version numbers | fact | changelog, dates, continuous-deploy |
| DOC-005 | Common Changelog: a stricter subset | comparison | changelog, common-changelog, style |
| DOC-006 | Generated changelogs and host release notes | comparison | changelog, conventional-commits, release-please, release-notes |
| DOC-007 | How Anthropic writes its own changelogs | fact | changelog, anthropic, examples |
| DOC-008 | Enforcing changelog entries in CI | comparison | changelog, ci, github-actions, hooks |
| DOC-009 | What Anthropic's docs say about repo docs beyond CLAUDE.md | fact | readme, docs, claude-md, official |
| DOC-010 | Official skills and plugins for documentation | tool | skills, plugins, doc-coauthoring |
| DOC-011 | Decision records: Nygard, MADR and one log or many files | comparison | adr, madr, decisions |
| DOC-012 | What a README should contain | fact | readme, standard-readme, github, diataxis |
| DOC-013 | Google's rules: same change, small and fresh, delete dead docs | recommendation | freshness, drift, google |
| DOC-014 | Mechanical checks: Markdown lint, link check, Prettier, Vale | comparison | markdownlint, lychee, prettier, vale, ci |
| DOC-015 | Agents that detect or fix doc drift | pattern | drift, routines, claude-code-action, refresh-md-files |
| DOC-016 | Writing docs that agents retrieve | recommendation | retrieval, headings, agents |
| DOC-017 | Our repos' docs on 2026-10-13 | fact | our-setup, inventory, survey |
| DOC-018 | Our changelog conventions and where they deviate | comparison | our-setup, changelog, deviations |
| DOC-019 | One rule in three files drifts apart | anti-pattern | our-setup, changelog, reviewer, duplication |
| DOC-020 | Cross-file rules keep paired docs current | pattern | our-setup, reviewer, drift |
| DOC-021 | A dated decision log in one file | pattern | our-setup, decisions, adr |
| DOC-022 | Plan docs with a dated status and a delete condition | pattern | our-setup, plans, expiry |
| DOC-023 | Runbooks in `docs/` or in a skill | comparison | our-setup, runbooks, skills |

## [DOC-001] Keep a Changelog 2.0.0: what changed from 1.1.0
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/), [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), [keep-a-changelog CHANGELOG.md](https://raw.githubusercontent.com/olivierlacan/keep-a-changelog/main/CHANGELOG.md)
- Related: DOC-002, DOC-003, DOC-004, DOC-008

Keep a Changelog 2.0.0 was released 2026-06-07. Anything from memory about "Keep a Changelog" is probably 1.1.0. Its own changelog: "It breaks the guidance, not the format: the six change types, `YYYY-MM-DD` dates, and the `Unreleased` and `[YANKED]` markers are all unchanged, so your existing changelog stays valid."

**Unchanged.** Six types: Added, Changed, Deprecated, Removed, Fixed, Security. "A version starts with its number and date, for example ## [1.0.0] - 2017-07-17. Use the YYYY-MM-DD format." Latest first. "Open with a # Changelog heading and a short, fixed preamble that says what the file is and which conventions it follows."

**New in 2.0.0:**
- A principle: "Write plainly. Many of your readers are not native speakers, so favor clear, concise wording."
- "Note which versioning scheme you use", replacing "Mention whether you follow Semantic Versioning".
- Breaking changes: "Add a short **Breaking:** marker so they stand out, and keep them with the type of change they are".
- Fixed or Changed: "ask whether the old behavior was a bug. If it was, use Fixed."
- Curation (DOC-002), a brief for LLM drafts (DOC-003), continuous releases (DOC-004) and CI's limits (DOC-008).
- References: "prefer plain prose over a list of bare (#1234) references".
- Rewrites: fixing an old entry is fine; "consider noting the date you updated the entry".

Read in full with `curl` and grepped (HTML stripped).

## [DOC-002] Curate, don't accumulate: notable changes only
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/)
- Related: DOC-001, DOC-018, DOC-006

Keep a Changelog 2.0 asks for curation, not completeness. It turns down the categories our changelogs use for housekeeping.

- "A changelog does not need to list every change. Version control already does that. It lists the notable ones."
- "write the changelog as a summary for your readers, not as a record of your commits."
- On extra types: "Internal or Housekeeping changes are rarely notable enough to list at all."
- "Dependencies are not a type of change. A dependency update can be harmless, a fix, or breaking. If it matters to your users, describe its effect under the right type. If it does not, leave it out."
- "Known issues are discovered, not changed. Note them on the affected version or in your issue tracker."

1.1.0 leaned the other way: "A changelog which only mentions some of the changes can be as dangerous as not having a changelog."

**Where we differ.** Four of our repos log every change, "Behind the scenes" included, and two log Dependabot bumps (DOC-018). It's a defensible audience choice: sessions read the changelog to learn what changed in tooling, reviewers and workflows. That's a second reader the spec doesn't have in mind. osrs-tracker-web's changelog is public, so it's the one place the spec's advice applies fully.

## [DOC-003] The brief for an LLM-drafted changelog belongs in CLAUDE.md
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/), [anthropic-sdk-python CLAUDE.md](https://raw.githubusercontent.com/anthropics/anthropic-sdk-python/main/CLAUDE.md)
- Related: DOC-001, DOC-007, DOC-019, PROMPT-015

Keep a Changelog 2.0 names coding agents directly:

> machines can draft, but humans curate. A model can't decide what's notable for your readers, or say it plainly for them. If you use a tool for the first draft, give it the brief you would give a contributor: summarize notable, user-facing changes; do not paste a git log; sort each change into one of the six types; explain the reason in the text; mark breaking changes; and remove anything not worth reading. Then read the result before anyone else does. If your project uses coding agents, record that brief where they read it, for example an AGENTS.md or CLAUDE.md file. There is no format to configure; the instructions are the interface.

Anthropic's own SDK does this in its CLAUDE.md: "**User-visible changes get a changelog note,** even when they fix a bug."

**How we apply it.** Our repos already keep a changelog brief, but each holds it in two or three places (DOC-019). Write it once, in CLAUDE.md or the repo skill, and let the reviewer read it from there. Our briefs add three rules the spec lacks, which are worth keeping: "reread the whole day", "extend an existing entry rather than add a near-duplicate", and the audience ("write for users" in osrs-tracker-web). They lack "the reason in the text" and a breaking-change marker. The API has consumers (osrs-tracker-web) for whom **Breaking:** would mean something.

## [DOC-004] Changelogs without version numbers
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/), [Common Changelog](https://raw.githubusercontent.com/vweevers/common-changelog/main/README.md)
- Related: DOC-001, DOC-018, SESS-027

Keep a Changelog 2.0 covers apps that deploy on every merge:

> You do not have to use Semantic Versioning. Calendar versioning, a plain number, or a date all work; note which scheme you use so readers can read your version numbers. Some projects release continuously and have no version numbers. A changelog still helps: keep dated entries under Unreleased.

1.1.0 assumed versions ("There should be an entry for every single version"). Common Changelog requires a semver version and has no `Unreleased` section (DOC-005), so it doesn't fit.

**Two readings for our apps.** "A date" as the version gives `## 2026-10-13` per day, which is what our repos do, but with slashes. "Dated entries under Unreleased" gives one `## Unreleased` with dated entries under it. The first suits a changelog read by day, and it's what four of our repos already have. Either way, use ISO `YYYY-MM-DD`: the spec says it "orders from the largest unit to the smallest, avoids the confusion of regional date formats, and is an ISO standard".

A standard WebSearch found no other spec for date-only changelogs (not verified beyond the result summary).

## [DOC-005] Common Changelog: a stricter subset
- Type: comparison
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-13
- Sources: [Common Changelog README](https://raw.githubusercontent.com/vweevers/common-changelog/main/README.md)
- Related: DOC-001, DOC-004, DOC-006

Common Changelog calls itself "a stricter subset of Keep a Changelog". Where it differs:

| | Keep a Changelog 2.0 | Common Changelog |
|---|---|---|
| Types | Six | Four: Changed, Added, Removed, Fixed. "A deprecation can be listed under the `Changed` category." |
| Mood | Not specified | "Write a change using the imperative mood. It must start with a present-tense verb" (`Add`, `Fix`, `Bump`) |
| References | Prose preferred over bare `(#1234)` | "changes must reference relevant commits, and should reference tickets or pull requests" |
| Unreleased | Kept | None |
| Heading | `## [1.0.0] - 2017-07-17` | `## 1.0.0 - 2017-07-17`, no brackets, no `v` |

**Why it has no Unreleased section.** A PR can't reference itself before merge, first-time contributors can't be expected to update the changelog, and "writing a changelog requires a bird's-eye view of the project". It argues against the edit-in-every-PR habit our repos use. In our case sessions write the entries, and we don't list commit SHAs, so none of the three reasons applies.

"Each change must be self-describing, as if no category heading exists." That matches our "don't repeat the subtitle in its entries" rule from the other side.

## [DOC-006] Generated changelogs and host release notes
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/), [release-please](https://github.com/googleapis/release-please), [semantic-release](https://github.com/semantic-release/semantic-release), [git-cliff](https://github.com/orhun/git-cliff), [GitHub: automatically generated release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes), [Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/)
- Related: DOC-002, DOC-007, SESS-027

**Commit-derived tools.** Conventional Commits lists "Automatically generating CHANGELOGs" as a benefit.
- release-please "automates CHANGELOG generation, the creation of GitHub releases, and version bumps" through a release PR.
- semantic-release "generates a changelog and publishes the release".
- git-cliff generates changelog files from git history.

None of their READMEs say whether the result is a good changelog.

**GitHub's generated release notes.** They list merged PRs, contributors and a compare link, configured in `.github/release.yml`. The keys are `changelog.exclude.labels`, `changelog.exclude.authors`, and `changelog.categories[*]` with `title`, `labels` (`*` catches all) and `exclude.labels`/`exclude.authors`.

**Against.** Keep a Changelog 2.0: "A generated changelog is raw material at best: a person still has to choose what is notable, group it, and write it for the reader." "The changelog is the source; release notes are drawn from it." Common Changelog says listing PR titles as-is "is not too different from listing commits."

**When generation fits.** It fits a versioned library whose readers want the commit-level list, which is why Anthropic's SDK uses release-please (DOC-007). It doesn't fit our apps' changelogs, which explain effects ("Nothing in the API changes"). Our commits already follow Conventional Commits in api and aws, so a generated draft could be the raw material a session curates.

## [DOC-007] How Anthropic writes its own changelogs
- Type: fact
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-13
- Sources: [claude-code CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md), [Claude Code changelog page](https://code.claude.com/docs/en/changelog.md), [anthropic-sdk-python CHANGELOG.md](https://raw.githubusercontent.com/anthropics/anthropic-sdk-python/main/CHANGELOG.md), [anthropic-sdk-python CLAUDE.md](https://raw.githubusercontent.com/anthropics/anthropic-sdk-python/main/CLAUDE.md)
- Related: DOC-003, DOC-006, TOK-089

Two styles, chosen by reader.

**Claude Code (hand-curated, for users).**
- The file is `# Changelog` followed by bare version headings (`## 2.1.296`, 418 of them), with no dates; the docs page adds dates.
- Entries are flat bullets in the past tense, mostly starting with a verb. A subagent counted about 7,534 bullets: Fixed 3,892, Improved 738, Added 706, Changed 359.
- Entries name the symptom and its trigger, and mark regressions inline, for example: "Fixed `--teleport` opening an empty conversation when the session's history could not be read". The docs page notes "Longer releases are grouped by type of change".

**anthropic-sdk-python (generated, for developers).**
- release-please output: `## [1.13.0](…compare…) (2026-10-09)`, then `### Features` and `### Chores`, with lowercase scoped subjects such as "**api:** add workflows, …".
- Its CLAUDE.md warns: "Release-please writes … `CHANGELOG.md`. … a manual edit is overwritten or conflicts with it", and "The changelog sections drop untyped subjects."
- A CI workflow fails a PR without a changelog change unless it carries the `skip-changelog` label (DOC-008).

The Claude Code style, symptom plus trigger plus what's now possible, is the model for our past-tense, effect-first entries. Files read in full with `curl` (the Claude Code changelog is 987 KB).

## [DOC-008] Enforcing changelog entries in CI
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/), [dangoslen/changelog-enforcer action.yml](https://github.com/dangoslen/changelog-enforcer), [tarides/changelog-check-action](https://github.com/tarides/changelog-check-action), [anthropic-sdk-python](https://github.com/anthropics/anthropic-sdk-python)
- Related: DOC-019, HOOK-004, SESS-021

**The spec's position.** "Use it for mechanical tasks: move the Unreleased section into a dated version at release time, check that the file is formatted correctly, and optionally remind a contributor that a change may need an entry. Do not make a changelog edit a required check on every change. That teaches people to add a line to pass the check, which fills the changelog with noise."

**Tools.**
- **dangoslen/changelog-enforcer** (v3.7.0, 63 stars on 2026-10-13, so not widely used): `changeLogPath` defaults to `CHANGELOG.md`, `skipLabels` to `Skip-Changelog`. Its default `versionPattern` only matches `## [x.y.z]` or `Unreleased` headings, which matters only with `expectedLatestVersion` set. The workflow must also trigger on `labeled`/`unlabeled` to see the skip label.
- **tarides/changelog-check-action**: `changelog` defaults to `CHANGES.md`, `labels` to "no changelog".
- **Anthropic's SDK** runs its own `changelog.yml` check (in the private repo only). Its failure message: "Add your line to CHANGELOG.md, or add the skip-changelog label to this pull request."

**Ours.** home-cluster has the strictest gate: a `PreToolUse` hook on `git push` exits 2 if no commit since upstream touches CHANGELOG.md. The reviewer agents check the pairing in api, aws and web. home-cluster pushes straight to `main` with no PR CI and logs every infra change on purpose, so the spec's noise argument weighs less there. For PR repos, the reviewer check plus a doc-only exemption is the "reminder" the spec allows.

## [DOC-009] What Anthropic's docs say about repo docs beyond CLAUDE.md
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Best practices](https://code.claude.com/docs/en/best-practices.md), [Memory](https://code.claude.com/docs/en/memory.md), [Prompt library](https://code.claude.com/docs/en/prompt-library.md), [Common workflows](https://code.claude.com/docs/en/common-workflows.md)
- Related: MEM-021, MEM-033, REPO-044, SKILL-024, DOC-012

There is little direct guidance. Grepping best-practices, memory and common-workflows for README, docs/ and changelog finds nothing on keeping a README or a `docs/` folder current. What there is:

- **Link, don't paste.** The best-practices CLAUDE.md table excludes "Detailed API documentation (link to docs instead)" and "Information that changes frequently". It includes "Architectural decisions specific to your project".
- **Import when Claude needs it every session.** memory.md: "See @README for project overview and @package.json for available npm commands for this project." An import loads every session, so it costs context like CLAUDE.md does (SKILL-024).
- **`/doctor` sends overviews out of CLAUDE.md.** It "cuts content Claude can derive from the codebase, such as directory layouts, dependency lists, and architecture overviews, and keeps pitfalls, rationale, and conventions" (MEM-021). The arXiv study in MEM-033 found repository overviews in context files "are not helpful". Overviews belong in the README for people, not in CLAUDE.md.
- **Release notes.** The prompt library's "Draft release notes from git history" prompts "compare {from} to {to} and draft release notes grouped by feature, fix, and breaking change". The next step it suggests: "Save this as a `/changelog` skill".
- **"Handle documentation"** in common-workflows covers only code comments (JSDoc, docstrings).

## [DOC-010] Official skills and plugins for documentation
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-13
- Sources: [anthropics/skills doc-coauthoring](https://raw.githubusercontent.com/anthropics/skills/main/skills/doc-coauthoring/SKILL.md), [claude-plugins-official](https://github.com/anthropics/claude-plugins-official)
- Related: DOC-015, MEM-021, SKILL-021

None of them is for README or changelog upkeep.

- **`doc-coauthoring`** (anthropics/skills): "Guide users through a structured workflow for co-authoring documentation. Use when user wants to write documentation, proposals, technical specs, decision docs, or similar structured content." It runs three stages: context gathering, refinement and structure, then reader testing. In reader testing a subagent sees only the document, answers 5–10 predicted reader questions, and checks for "ambiguity, false assumptions, contradictions". That test suits a decision record or a runbook.
- **`claude-md-management`** (official marketplace): "audit quality, capture session learnings, and keep project memory current", for CLAUDE.md only (`claude-md-improver`, `/revise-claude-md`).
- **`pr-review-toolkit`'s `comment-analyzer` agent**: checks code comments against the code for "comment rot". It doesn't read Markdown docs.

A subagent searched the names and descriptions of all 315 plugins in the official marketplace and found no README, changelog, ADR or doc-sync plugin. A third-party `mintlify` plugin targets Mintlify-hosted docs. claude-code-action's `examples/` has no doc-sync workflow. GitHub code search hit a rate limit partway, so "none" is not fully verified.

Ours: the `refresh-md-files` skill (FreekMencke/claude-skills) audits `.md` docs against the code and reports findings without editing. It covers the gap the official set leaves.

## [DOC-011] Decision records: Nygard, MADR and one log or many files
- Type: comparison
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-13
- Sources: [Nygard: Documenting Architecture Decisions (2011, Wayback)](https://web.archive.org/web/2023/https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), [MADR minimal template](https://raw.githubusercontent.com/adr/madr/main/template/adr-template-minimal.md), [MADR releases](https://github.com/adr/madr/releases), [adr-tools](https://github.com/npryce/adr-tools), [adr.github.io](https://adr.github.io/)
- Related: DOC-021, DOC-010, REPO-044

**Nygard (2011).** Title, Context, Decision, Status, Consequences. "ADRs will be numbered sequentially and monotonically. Numbers will not be reused." "If a decision is reversed, we will keep the old one around, but mark it as superseded." "The whole document should be one or two pages long."

**MADR 4.0.0** (2024-09-17, still the latest release on 2026-10-13). The minimal template has a short title, Context and Problem Statement, Considered Options, Decision Outcome, and Consequences. The full one adds Decision Drivers, Pros and Cons, Confirmation, and front matter (`status`, `date`, `decision-makers`).

**adr-tools** (5,730 stars, last push 2024-04-25): `adr new` and `adr new -s N` (supersede) in `doc/adr`. Low activity.

**One file or many.** Nygard, Fowler, adr-tools and MADR all assume one numbered file per decision. adr.github.io calls the collection a "decision log", which needn't be one file. No standard backs a single file. That choice is our inference: a log in one file is cheaper to read and to keep while decisions are rarely superseded. Split it when supersession links or file size start to hurt.

**For agents.** The reviewer must read the log ("never flag what it explains"). One file means one read. A folder of ADRs needs an index or a grep.

## [DOC-012] What a README should contain
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [GitHub: About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes), [standard-readme spec](https://raw.githubusercontent.com/RichardLitt/standard-readme/main/spec.md), [Diátaxis](https://diataxis.fr/)
- Related: DOC-009, DOC-013, DOC-017

**GitHub.** A README says "What the project does", "Why the project is useful", "How users can get started with the project", "Where users can get help with your project" and "Who maintains and contributes to the project". "A README should only contain information necessary for developers to get started using and contributing to your project. Longer documentation is best suited for wikis." On GitHub, "any content beyond 500 KiB will be truncated."

**standard-readme** (for open-source libraries). Required: Title, Short Description ("Must be less than 120 characters"), Table of Contents ("optional for READMEs shorter than 100 lines"), Install, Usage, Contributing, License ("Must be last section"). Also "Must not contain broken links."

**Diátaxis.** It names four kinds of documentation: "tutorials, how-to guides, technical reference and explanation". In a small repo these map to README (getting started), runbook (how-to), skill or reference doc, and decision log (explanation).

**Ours.** The osrs-tracker READMEs follow GitHub's list (features, how it fits together, running locally, built with, license). freek-mencke-web's is still the Angular CLI template (DOC-017). Naming only major versions ("NestJS 12", "Node 24") or none at all (web: "Angular with server-side rendering") keeps the "Built with" section from drifting with every patch release.

## [DOC-013] Google's rules: same change, small and fresh, delete dead docs
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Google documentation best practices](https://google.github.io/styleguide/docguide/best_practices.html)
- Related: DOC-014, DOC-020, DOC-022

Google's doc guide gives three rules that matter most for drift:

- "A small set of fresh and accurate docs is better than a large assembly of 'documentation' in various states of disrepair."
- "Change your documentation in the same CL as the code change." (CL is Google's term for a PR.)
- "Dead docs are bad. They misinform, they slow down, they incite despair". When migrating: "Default to delete or leave behind".

It also asks that design docs "serve as archives of these decisions, not as half-correct docs", and that docs link rather than duplicate.

**For Claude sessions.** "Same change" is the rule our repos already follow for CHANGELOG.md, DATA-MODEL.md and Lambda READMEs (DOC-020). It's cheapest when the session that made the change writes the doc while the context is still loaded; a later sync agent has to rediscover it (DOC-015). "Default to delete" is what DOC-022's plan-doc pattern does.

## [DOC-014] Mechanical checks: Markdown lint, link check, Prettier, Vale
- Type: comparison
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-13
- Sources: [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2), [lychee](https://github.com/lycheeverse/lychee), [markdown-link-check](https://github.com/tcort/markdown-link-check), [Vale](https://github.com/vale-cli/vale), [Prettier options: proseWrap](https://prettier.io/docs/options#prose-wrap)
- Related: DOC-013, DOC-015, DOC-020

None of these checks whether a doc is true, only its form and links.

| Tool | Catches | Uptake (2026-10-13) |
|---|---|---|
| Prettier with `proseWrap: "always"` | Wrap width and Markdown formatting | Already in our Node repos |
| markdownlint-cli2 | Heading levels, lists, fences, bare URLs, line length | 1,725,819 npm downloads in the week 2026-10-05 to 2026-10-11 |
| lychee (`--offline` for local links only) | Broken links and anchors | 4,005 stars, active |
| markdown-link-check | Broken links | Its common GitHub Action wrapper is archived; prefer lychee |
| Vale | Prose style and terminology | 6,235 stars; config overhead too high for small repos |

**Ours.** osrs-tracker-web and osrs-tracker-aws run `prettier --check .` with `proseWrap: "always"` and `printWidth: 120`, so their Markdown is checked in CI. osrs-tracker-api's `prettier:ci` checks only `src/**/*.ts`, so its Markdown is wrapped at 120 by hand and unchecked. home-cluster has no Prettier; one changelog line runs to 130. No repo runs a link check. lychee `--offline` would catch renamed files that docs still link to, which happens when sessions move files.

## [DOC-015] Agents that detect or fix doc drift
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Routines: use cases](https://code.claude.com/docs/en/routines.md), [claude-code-action: custom automations](https://raw.githubusercontent.com/anthropics/claude-code-action/main/docs/custom-automations.md), [anthropics/claude-code#7103](https://github.com/anthropics/claude-code/issues/7103)
- Related: DOC-010, DOC-013, REPO-030, ORCH-017

**Official patterns, with no published results.**
- Routines, "Docs drift": "A schedule trigger runs weekly. The routine scans merged PRs since the last run, flags documentation that references changed APIs, and opens update PRs against the docs repository for an editor to review."
- claude-code-action's "Automated Documentation Updates": on `pull_request` with a `paths` filter, the prompt is "Update the API documentation in README.md to reflect the changes made to the API endpoints in this PR", and Claude pushes to the PR.

**Community (single-source).** anthropics/claude-code#7103 (closed; not filed by a maintainer) proposes Cursor's approach: commit doc updates to a separate branch and post a compare link for review. Blog guides describe a merged-PR trigger. Nobody publishes measured results.

**Trade-off.** A drift agent starts cold and has to rediscover what the change meant. The session that made the change already knows. Same-PR updates enforced by reviewer rules (DOC-020) cost less and catch the pairs you know about. A periodic audit (`refresh-md-files`, or a routine) catches the pairs nobody wrote down. Cost: a routine reads every doc each run, while an on-demand audit runs only when drift is suspected. Scripted runs need `--max-turns` and `--max-budget-usd` (global CLAUDE.md).

## [DOC-016] Writing docs that agents retrieve
- Type: recommendation
- Applies to: general
- Confidence: unverified
- Last verified: 2026-10-13
- Sources: [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices.md), [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- Related: TOK-062, PROMPT-015, DOC-012

No Anthropic page covers writing repo docs for agents. Anthropic's skill guidance carries over plausibly, which is why this entry is marked unverified:

- "For reference files longer than 100 lines, include a table of contents at the top. This ensures Claude can see the full scope of available information even when previewing with partial reads."
- "Keep references one level deep from SKILL.md."
- "Avoid time-sensitive information" and "Use consistent terminology".
- Context engineering: agents keep "lightweight identifiers (file paths, stored queries, web links, etc.)" and load data when needed, and "Folder hierarchies, naming conventions, and timestamps all provide important signals."

**In practice.**
- A heading should say what the section answers. osrs-tracker-web's decision headings state the decision: "Item link previews are drawn by the server".
- Put the grep-able term near the top.
- Write absolute dates.
- Point to a file by path rather than by "see above".

Community guides (Fern, Mintlify, Sentry) give the same advice. A subagent saw them only as search snippets.

## [DOC-017] Our repos' docs on 2026-10-13
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: [osrs-tracker org repos](https://github.com/osrs-tracker), [FreekMencke repos](https://github.com/FreekMencke); read with `git ls-tree origin/main` and `git show origin/main:<file>` in each local checkout after `git fetch`, 2026-10-13
- Related: DOC-018, DOC-021, DOC-022, DOC-023

All eight active repos: FreekMencke's five, plus the three osrs-tracker repos. The osrs-tracker org's other repos are archived (2019), apart from `.github`, which holds only a profile README.

| Repo | CHANGELOG | README | Other docs |
|---|---|---|---|
| claude-kb | Table, ISO dates | Layout, routine, design decisions | INDEX, ENTRIES (generated), OVERLAPS |
| claude-skills | None (installs track commits) | Install, checks, trigger evals | — |
| freek-mencke-web | None | Angular CLI template, says CLI 19.0.6; `package.json` has `^21.2.11` | — |
| home-cluster | `## YYYY/MM/DD` | Overview, usage, "Known differences and decisions", access | `docs/rebuild.md`, `docs/upgrade-plan-kubernetes-1.37.md`, two Lambda READMEs |
| osrs-tracker-api | `## YYYY/MM/DD`, area subtitles | Provides, fits together, local, checks, built with | — |
| osrs-tracker-aws | Root plus 4 package changelogs | Jobs, packages, fits together | `DATA-MODEL.md`, a README per Lambda, `DEPLOY.md`, `INFRA.md` and `PACKAGES.md` in the skill |
| osrs-tracker-web | `## YYYY/MM/DD`, public at `/about/changelog` | Features, fits together, local, contributing | `docs/decisions.md` (423 lines), `docs/runbook.md` |
| solix | Versioned with ISO dates, Added/Changed/Fixed | Download, use, build, release, history | — |

A spot check of README version claims against `package.json` and Dockerfiles found them current in api and web. home-cluster's versions table matches its latest changelog entry (Traefik v3.7.14, chart 41.7.1). The only stale README found is freek-mencke-web's (last push 2026-05-06). This was a spot check, not a full `refresh-md-files` audit.

## [DOC-018] Our changelog conventions and where they deviate
- Type: comparison
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: each repo's `CHANGELOG.md`, `CLAUDE.md`, repo skill and `conventions-reviewer.md` on `origin/main`, 2026-10-13; [Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/)
- Related: DOC-001, DOC-002, DOC-004, DOC-019, SESS-026

**Shared convention** (api, aws, web, home-cluster):
- A hand-written entry in the same change, under today's `## YYYY/MM/DD`, newest first.
- `###` area subtitles on busy days, with "Behind the scenes" last.
- Extend an entry rather than add a near-duplicate, and fold parallel PRs' headings on rebase.
- Effect-first prose, wrapped at 120.

**Between repos:**

| Point | Deviation |
|---|---|
| Doc-only changes | web: no entry. api, aws, home-cluster: an entry (api: "Nothing in the API changes") |
| Dependabot | api: a follow-up entry committed to `main` after merging. web: no entry at all, although its rule says "entries cover deps and tooling too" |
| `# Changelog` title | aws, solix, claude-kb have one; api, home-cluster, web don't (web's page supplies its own title) |
| Package headings (aws) | `## v0.1.1 - 2026/10/09` in three packages, `## 2.4.0 - 2026/10/13` in models; two keep `## Unreleased` |
| References | api: `(#143)` 14 times. aws: `(issue #88)` and full refs. web: none (public) |
| "Reread the whole day" | In api, aws, web; not home-cluster |
| Tense | home-cluster's rule says past tense; its entries mix "Added …" with "The dashboard has …" |

**Against Keep a Changelog 2.0:**
- Slashed dates where the spec says `YYYY-MM-DD`. No script in any repo parses the headings.
- Every change logged where the spec says notable ones (DOC-002).
- Area subtitles where the spec has six types.
- Bare `(#N)` where the spec prefers prose.

solix follows the spec apart from a seventh "Development" type. claude-kb's table is built for its monthly re-verification on purpose.

## [DOC-019] One rule in three files drifts apart
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: [osrs-tracker-api CLAUDE.md](https://github.com/osrs-tracker/osrs-tracker-api/blob/main/CLAUDE.md), [osrs-tracker-api skill](https://github.com/osrs-tracker/osrs-tracker-api/blob/main/.claude/skills/osrs-tracker-api/SKILL.md), [osrs-tracker-web CLAUDE.md](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/CLAUDE.md), [osrs-tracker-web skill](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/.claude/skills/osrs-tracker-web/SKILL.md), read on `origin/main` 2026-10-13
- Related: DOC-003, DOC-018, REPO-044, MEM-023

Each osrs-tracker repo states its changelog rule in CLAUDE.md, again in the repo skill's conventions, and a third time as a cross-file pair in the skill's review rules, which `conventions-reviewer` reads. The copies have already diverged:

- **osrs-tracker-api.** CLAUDE.md: "Every change gets a `CHANGELOG.md` entry". Review rules: "a user-visible change and `CHANGELOG.md`". The reviewer won't flag a missing entry for a tooling change that CLAUDE.md requires.
- **osrs-tracker-web.** CLAUDE.md: "Every change to the app, its dependencies or tooling (except Dependabot PRs)". Review rules: "a user-visible change and `CHANGELOG.md`". Same gap.
- **osrs-tracker-aws and home-cluster** are consistent ("a change and its `CHANGELOG.md` entry", "any change and `CHANGELOG.md`").

The repos already apply this fix to agents: "keep rules here, not in the agent". Apply it one level further. State the rule once (CLAUDE.md for the hard rule, or the skill for its details), and make the review-rule pair point to it: "a change that needs an entry under CLAUDE.md's changelog rule and `CHANGELOG.md`". A copy that's only a pointer can't drift.

## [DOC-020] Cross-file rules keep paired docs current
- Type: pattern
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: review rules in the [osrs-tracker-api](https://github.com/osrs-tracker/osrs-tracker-api/blob/main/.claude/skills/osrs-tracker-api/SKILL.md), [osrs-tracker-aws](https://github.com/osrs-tracker/osrs-tracker-aws/blob/main/.claude/skills/osrs-tracker-aws/SKILL.md) and [osrs-tracker-web](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/.claude/skills/osrs-tracker-web/SKILL.md) skills, [home-cluster conventions-reviewer.md](https://github.com/FreekMencke/home-cluster/blob/main/.claude/agents/conventions-reviewer.md), read on `origin/main` 2026-10-13
- Related: DOC-013, DOC-015, DOC-019, REPO-044

Our reviewers check pairs of files "against the whole diff". Each pair is a doc that must change with a piece of code. It turns Google's "same change" rule (DOC-013) into something a reviewer can check:

- **osrs-tracker-api.**
  - A GET route and its `Cache-Control`.
  - A route's statuses and its handler's JSDoc.
  - A new env var and `Env`/`validateEnv`/`.env.example`.
  - A change and `CHANGELOG.md`.
- **osrs-tracker-aws.**
  - A Mongo write, query or index and `DATA-MODEL.md` ("its rows must match the change").
  - A Lambda's trigger or env vars and its README.
- **osrs-tracker-web.** A new route and `route-label.ts`.
- **home-cluster.** A chart or version change and the README's versions table, `docs/rebuild.md` and `CHARTS`.

**Why it works.** Each pair is narrow enough for a reviewer at `medium` effort to check from the diff. The rule sits in the skill, so the implementing session sees it too. It covers only the pairs someone wrote down, so a periodic audit (`refresh-md-files`) is still needed for the rest.

**When to add a pair.** When a doc was found stale after a change that should have updated it. Each pair is one line in the review rules.

## [DOC-021] A dated decision log in one file
- Type: pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: [osrs-tracker-web docs/decisions.md](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/docs/decisions.md), [osrs-tracker-web CLAUDE.md](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/CLAUDE.md), [home-cluster README.md](https://github.com/FreekMencke/home-cluster/blob/main/README.md), read on `origin/main` 2026-10-13
- Related: DOC-011, DOC-020, REPO-044

osrs-tracker-web's `docs/decisions.md` (423 lines, 29 decisions from 2026/10/04 to 2026/10/13) opens: "Choices that look like accidents without their context: what was decided, why, and when to revisit. Newest first."

Each entry:
- **Heading:** the decision as a sentence, with its date. Example: "## Item link previews are drawn by the server (2026/10/11)".
- **Context:** the forces, including rejected alternatives.
- **Decision:** what was built, naming files.
- **Revisit:** the condition that would reopen it.

Compared with MADR, it drops status and numbering and adds the revisit condition. CLAUDE.md says: "Read `docs/decisions.md` before 'fixing' something that looks odd". The reviewer reads it every review and "never flag[s] what it explains", which is what makes it pay: it stops sessions from undoing deliberate choices.

**Elsewhere.**
- home-cluster keeps the same idea as a README section ("Known differences and decisions", "Host edits kept on purpose").
- api and aws have no decisions file. Their review rules say so ("No decisions document to read"), and the rationale lives inline in the skills ("Not used on purpose: …").

That's fine at their size. Move the rationale to a decisions file once the skill's inline "on purpose" notes reach a few, or once the reviewer flags a deliberate choice.

## [DOC-022] Plan docs with a dated status and a delete condition
- Type: pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: [home-cluster docs/upgrade-plan-kubernetes-1.37.md](https://github.com/FreekMencke/home-cluster/blob/main/docs/upgrade-plan-kubernetes-1.37.md), read on `origin/main` 2026-10-13
- Related: DOC-013, FLOW-003

home-cluster's Kubernetes upgrade plan opens with a status line and its own expiry: "**Status (8 Oct 2026): waiting for cert-manager 1.22.** … Delete this file once every step is done." Then come the rules for every step, and the steps.

**Why it works.**
- A session that opens the file learns at once whether it's current and what blocks it.
- The delete condition applies Google's "Default to delete" (DOC-013): a finished plan doesn't linger as a half-true doc.
- The status line carries a date, so a stale status is visible as stale.

**The gap.** Nothing prompts a re-check. The status said "1.22 is due around November 2026", but no issue or routine fires then. Pair a long-lived plan with an issue that has a due date in its title, the way FreekMencke/claude-kb#13 does ("due 2026-11-12").

## [DOC-023] Runbooks in `docs/` or in a skill
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: [osrs-tracker-web docs/runbook.md](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/docs/runbook.md), [osrs-tracker-aws DEPLOY.md](https://github.com/osrs-tracker/osrs-tracker-aws/blob/main/.claude/skills/osrs-tracker-aws/DEPLOY.md), [osrs-tracker-api skill](https://github.com/osrs-tracker/osrs-tracker-api/blob/main/.claude/skills/osrs-tracker-api/SKILL.md), [home-cluster docs/rebuild.md](https://github.com/FreekMencke/home-cluster/blob/main/docs/rebuild.md), read on `origin/main` 2026-10-13
- Related: DOC-012, SKILL-021, REPO-044

Our repos split operational docs two ways:

| Repo | Where | Reader |
|---|---|---|
| osrs-tracker-web | `docs/runbook.md`: roll back, a failed `CD` run, site down, health checks, the GE tax recheck | People and sessions; workflows link to it in comments |
| home-cluster | `docs/rebuild.md` plus skills (`apply-before-push`, health checks) | Rebuild by a person; routine work by sessions |
| osrs-tracker-aws | `DEPLOY.md` (with "Rollback") and `INFRA.md` inside the skill folder | Sessions, loaded on demand |
| osrs-tracker-api | Rollback and release steps inside `SKILL.md` | Sessions |

**Rule of thumb.**
- A procedure only sessions run, like a release, belongs in a skill or its reference files, where it loads on demand (SKILL-021).
- A procedure a person may run during an incident without Claude, like a rollback or a rebuild, belongs in `docs/`, linked from the skill, so it can be found without knowing the `.claude/` layout.

By that rule, api's and aws's rollback steps are in the wrong place. Today only sessions roll back, so moving them is low priority (see Recommendations).

## Recommendations for our setup

Ranked by impact against effort. Every item changes another repo, so each becomes an issue there once you decide (global CLAUDE.md).

1. **Make each repo state its changelog rule once, and make the reviewer pair point to it** (high impact, low effort). This closes the api and web gap, where the reviewer checks only user-visible changes but CLAUDE.md requires entries for tooling too. DOC-019, DOC-020. Repos: osrs-tracker-api, osrs-tracker-web.
2. **Align the changelog brief across the four Claude-maintained repos with Keep a Changelog 2.0** (medium impact, low effort). Add the missing rules: the reason in the text, a **Breaking:** marker (api, and aws packages), and `# Changelog` plus a one-line preamble (api, home-cluster). Keep "every change" and "Behind the scenes" as a deliberate difference, and say so in the preamble ("Every change is logged, including tooling, because sessions read this as history"). DOC-001, DOC-002, DOC-003, DOC-018.
3. **Decide the Dependabot and doc-only rules once for all four** (medium impact, trivial effort). Today web logs neither, and api logs both. Suggestion: doc-only changes get no entry anywhere (Keep a Changelog: not notable, and version control has them). Dependabot gets the api treatment, a follow-up "Dependency updates" line, only where a bump changes behaviour. DOC-002, DOC-018.
4. **Switch headings to ISO `YYYY-MM-DD`** (low impact, low effort, needs your call). Nothing parses the headings (DOC-018), so it's a find-and-replace in four changelogs, four packages and four sets of rules, plus home-cluster's push hook message. Do it in one pass with item 2 or not at all. Mixed formats are worse than slashes. DOC-004.
5. **Add `lychee --offline` to CI in web, aws and api, and extend api's `prettier:ci` to Markdown** (low impact, low effort). This catches docs that link to moved files, and the hand-wrapped Markdown in api. DOC-014.
6. **Replace freek-mencke-web's template README** (low impact, trivial effort). It's the only stale README found. DOC-017.
7. **Give long-lived plan docs a due-date issue** (low impact, trivial effort). Start with home-cluster's Kubernetes 1.37 plan, due when cert-manager 1.22 ships. DOC-022.
8. **Not now:** a docs-drift routine (unproven, recurring cost; DOC-015), MADR files (the one-file log works at 29 decisions; DOC-021), and a changelog check in CI for PR repos (the reviewer pair is the reminder; DOC-008). Revisit the drift routine if `refresh-md-files` audits keep finding drift that no cross-file rule covers.

## Open questions

1. **Does "every change" make our changelogs too long for their readers?** web's is 775 lines over 66 days, and api's 425 lines over 10. No measurement says whether sessions or users read past the first screen. A cheap check: how often sessions grep CHANGELOG.md as opposed to `git log`.
2. **Should claude-skills have a changelog?** It installs by commit, and its commit subjects already read like entries (`<skill>: <change> (#PR)`). Keep a Changelog says a commit list isn't a changelog. With one user and the claude.ai sync, the reader may not exist.
3. **Official doc-sync tooling.** A rate limit cut short the GitHub code search across anthropics/skills and claude-code for "update documentation" (DOC-010). Re-run it at the next monthly re-verification.
4. **Does `/init` read the README?** memory.md doesn't say. Untested.
5. **Docs-drift routine results.** No published measurement of a docs-sync agent was found (DOC-015).
