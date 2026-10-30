# Repo documentation: changelogs, READMEs, decision records and drift

Prefix: DOC. Researched 2026-10-13 against the sources live that day and the `origin/main` of all eight of our repos (Claude Code v2.1.296, WSL terminal); re-verified 2026-10-14 against the docs fetched that day, the claude-code CHANGELOG through 2.1.299 and our repos' `origin/main` (each entry's Last verified date is authoritative). This file covers the docs Claude writes and maintains for people in a repo: CHANGELOG.md, README.md, decision records, runbooks and plan docs, and how to keep them from drifting. CLAUDE.md, rules and auto memory are in `kb-memory.md` (MEM), their wording in `kb-prompting.md` (PROMPT), and changelog merge conflicts between parallel PRs in `kb-sessions.md` (SESS-026, SESS-027).

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which changelog spec should we follow? | Keep a Changelog 2.0.0 (2026-06-07), not 1.1.0. The format is unchanged; the guidance is new: curate, write plainly, a brief for LLM drafts, no required CI check. | DOC-001, DOC-002 |
| Should every change get a changelog entry? | Keep a Changelog 2.0 says no: "It lists the notable ones." Our four app and infra changelogs say every change except doc-only ones. That's a deliberate difference while sessions also read the changelog as history. | DOC-002, DOC-018 |
| How should Claude write changelog entries? | Give it the Keep a Changelog 2.0 brief in CLAUDE.md: notable, user-facing changes; no git log; the reason in the text; mark breaking changes; then read the result. | DOC-003, DOC-007 |
| How do I head a changelog for an app with no versions? | A date works as the version scheme: `## 2026-10-13`, or dated entries under `Unreleased`. Use ISO `YYYY-MM-DD`; our four app and infra repos switched to it from `YYYY/MM/DD` on 2026-10-13. | DOC-004, DOC-018 |
| Generated changelog from Conventional Commits? | Fine for an SDK on release-please (Anthropic's own SDK does it). For readers it's "raw material at best". Don't generate ours. | DOC-006, DOC-007 |
| Should CI fail a PR without a changelog entry? | Keep a Changelog 2.0: never as a required check on every change. Use a reminder, or a check with a skip label like Anthropic's SDK (`skip-changelog`). | DOC-008 |
| Where do our repos' changelog rules disagree? | In few places since 2026-10-13: web has no `# Changelog` title (its page supplies one), api and aws mark breaking changes, references differ. Before that, doc-only changes, Dependabot, date format and the api/web reviewer gap differed. | DOC-018, DOC-019 |
| What belongs in a README versus CLAUDE.md? | README: what, why, how to run, where to get help, for people. CLAUDE.md: what Claude can't derive. Link docs from CLAUDE.md instead of pasting them. | DOC-009, DOC-012 |
| How should we record decisions? | Context, decision, when to revisit, dated, newest first, and read by the reviewer. One file is fine for a few dozen. Split into numbered MADR files once records get superseded. | DOC-011, DOC-021 |
| Is there an official Anthropic skill for READMEs or changelogs? | No. `doc-coauthoring` is for proposals and specs, and `claude-md-management` covers CLAUDE.md only. The prompt library has a release-notes recipe. | DOC-010, DOC-009 |
| How do I keep docs from drifting? | Change docs in the same PR. Add cross-file rules for the reviewer ("a new env var and the Lambda README"). Run cheap linters (lychee, Prettier). Audit with `refresh-md-files` now and then. | DOC-013, DOC-014, DOC-020 |
| Does an agent that syncs docs on merge work? | We run one: a weekly routine runs `refresh-md-files` on each osrs-tracker repo. Its first runs (2026-10-12) found 2–3 small, real gaps in api and web (no PR in aws), mostly lists missing a new route or file. Nobody else publishes results. Same-PR updates plus reviewer rules still come first. | DOC-015, DOC-024, REPO-018 |
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
| DOC-024 | Our weekly docs-drift routine: first runs | fact | our-setup, drift, routines, refresh-md-files |

## [DOC-001] Keep a Changelog 2.0.0: what changed from 1.1.0
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
- Sources: [Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/)
- Related: DOC-001, DOC-018, DOC-006

Keep a Changelog 2.0 asks for curation, not completeness. It turns down the categories our changelogs use for housekeeping.

- "A changelog does not need to list every change. Version control already does that. It lists the notable ones."
- "write the changelog as a summary for your readers, not as a record of your commits."
- On extra types: "Internal or Housekeeping changes are rarely notable enough to list at all."
- "Dependencies are not a type of change. A dependency update can be harmless, a fix, or breaking. If it matters to your users, describe its effect under the right type. If it does not, leave it out."
- "Known issues are discovered, not changed. Note them on the affected version or in your issue tracker."

1.1.0 leaned the other way: "A changelog which only mentions some of the changes can be as dangerous as not having a changelog."

**Where we differ.** Four of our repos log every change except doc-only ones, "Behind the scenes" included, and log a Dependabot bump only when it changes behaviour (DOC-018; decided 2026-10-13). It's a defensible audience choice: sessions read the changelog to learn what changed in tooling, reviewers and workflows. That's a second reader the spec doesn't have in mind. osrs-tracker-web's changelog is public, so it's the one place the spec's advice applies fully.

## [DOC-003] The brief for an LLM-drafted changelog belongs in CLAUDE.md
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/), [anthropic-sdk-python CLAUDE.md](https://raw.githubusercontent.com/anthropics/anthropic-sdk-python/main/CLAUDE.md)
- Related: DOC-001, DOC-007, DOC-019, PROMPT-015

Keep a Changelog 2.0 names coding agents directly:

> machines can draft, but humans curate. A model can't decide what's notable for your readers, or say it plainly for them. If you use a tool for the first draft, give it the brief you would give a contributor: summarize notable, user-facing changes; do not paste a git log; sort each change into one of the six types; explain the reason in the text; mark breaking changes; and remove anything not worth reading. Then read the result before anyone else does. If your project uses coding agents, record that brief where they read it, for example an AGENTS.md or CLAUDE.md file. There is no format to configure; the instructions are the interface.

Anthropic's own SDK does this in its CLAUDE.md: "**User-visible changes get a changelog note,** even when they fix a bug."

**How we apply it.** Since 2026-10-13 each of our four repos states its changelog rule once in CLAUDE.md, keeps the format in the repo skill, and the reviewer's pair points to the rule (DOC-019 has the earlier duplication). Our briefs add three rules the spec lacks, which are worth keeping: "reread the whole day", "extend an existing entry rather than add a near-duplicate", and the audience ("write for users" in osrs-tracker-web). All four now ask for the reason ("say why, not only what"), and api and the aws packages start a consumer-breaking entry with **Breaking:**; web and fremen-cluster (home-cluster until 2026-10-21) have no such marker.

## [DOC-004] Changelogs without version numbers
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/), [Common Changelog](https://raw.githubusercontent.com/vweevers/common-changelog/main/README.md)
- Related: DOC-001, DOC-018, SESS-027

Keep a Changelog 2.0 covers apps that deploy on every merge:

> You do not have to use Semantic Versioning. Calendar versioning, a plain number, or a date all work; note which scheme you use so readers can read your version numbers. Some projects release continuously and have no version numbers. A changelog still helps: keep dated entries under Unreleased.

1.1.0 assumed versions ("There should be an entry for every single version"). Common Changelog requires a semver version and has no `Unreleased` section (DOC-005), so it doesn't fit.

**Two readings for our apps.** "A date" as the version gives `## 2026-10-13` per day, which is what our four app and infra repos do (since 2026-10-13; slashes before). "Dated entries under Unreleased" gives one `## Unreleased` with dated entries under it. The first suits a changelog read by day, and it's what four of our repos already have. Either way, use ISO `YYYY-MM-DD`: the spec says it "orders from the largest unit to the smallest, avoids the confusion of regional date formats, and is an ISO standard".

A standard WebSearch found no other spec for date-only changelogs (not verified beyond the result summary).

## [DOC-005] Common Changelog: a stricter subset
- Type: comparison
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-14
- Sources: [Common Changelog README](https://raw.githubusercontent.com/vweevers/common-changelog/main/README.md)
- Related: DOC-001, DOC-004, DOC-006

Common Changelog calls itself "a stricter subset of Keep a Changelog". Where it differs:

| | Keep a Changelog 2.0 | Common Changelog |
|---|---|---|
| Types | Six | Four: Changed, Added, Removed, Fixed. "A deprecation can be listed under the `Changed` category." |
| Mood | Not specified | "Write a change using the imperative mood. It must start with a present-tense verb" (`Add`, `Fix`, `Bump`) |
| References | Prose preferred over bare `(#1234)` | "changes must reference relevant commits, and should reference tickets or pull requests" |
| Unreleased | Kept | None |
| Heading | `## [1.0.0] - 2017-07-17` | `## VERSION - DATE`, no `v`; the version "should link", so `## [1.0.0] - 2017-07-17` with reference-style links |

**Why it has no Unreleased section.** A PR can't reference itself before merge, first-time contributors can't be expected to update the changelog, and "writing a changelog requires a bird's-eye view of the project". It argues against the edit-in-every-PR habit our repos use. In our case sessions write the entries, and we don't list commit SHAs, so none of the three reasons applies.

"Each change must be self-describing, as if no category heading exists." That matches our "don't repeat the subtitle in its entries" rule from the other side.

## [DOC-006] Generated changelogs and host release notes
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
- Sources: [Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/), [dangoslen/changelog-enforcer action.yml](https://github.com/dangoslen/changelog-enforcer), [tarides/changelog-check-action](https://github.com/tarides/changelog-check-action), [anthropic-sdk-python](https://github.com/anthropics/anthropic-sdk-python)
- Related: DOC-019, HOOK-004, SESS-021

**The spec's position.** "Use it for mechanical tasks: move the Unreleased section into a dated version at release time, check that the file is formatted correctly, and optionally remind a contributor that a change may need an entry. Do not make a changelog edit a required check on every change. That teaches people to add a line to pass the check, which fills the changelog with noise."

**Tools.**
- **dangoslen/changelog-enforcer** (v3.7.0, 63 stars on 2026-10-13, so not widely used): `changeLogPath` defaults to `CHANGELOG.md`, `skipLabels` to `Skip-Changelog`. Its default `versionPattern` only matches `## [x.y.z]` or `Unreleased` headings, which matters only with `expectedLatestVersion` set. The workflow must also trigger on `labeled`/`unlabeled` to see the skip label.
- **tarides/changelog-check-action**: `changelog` defaults to `CHANGES.md`, `labels` to "no changelog".
- **Anthropic's SDK** runs its own `changelog.yml` check (in the private repo only). Its failure message: "Add your line to CHANGELOG.md, or add the skip-changelog label to this pull request."

**Ours.** fremen-cluster (named home-cluster until 2026-10-21) has the strictest gate: a `PreToolUse` hook on `git push` exits 2 if no commit since upstream touches CHANGELOG.md. The reviewer agents check the pairing in api, aws and web. fremen-cluster pushes straight to `main` with no PR CI and logs every infra change on purpose, so the spec's noise argument weighs less there. For PR repos, the reviewer check plus a doc-only exemption is the "reminder" the spec allows. Since 2026-10-13 its hook exempts doc-only pushes too.

## [DOC-009] What Anthropic's docs say about repo docs beyond CLAUDE.md
- Type: fact
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
- Sources: [anthropics/skills doc-coauthoring](https://raw.githubusercontent.com/anthropics/skills/main/skills/doc-coauthoring/SKILL.md), [claude-plugins-official](https://github.com/anthropics/claude-plugins-official)
- Related: DOC-015, MEM-021, SKILL-021

None of them is for README or changelog upkeep.

- **`doc-coauthoring`** (anthropics/skills): "Guide users through a structured workflow for co-authoring documentation. Use when user wants to write documentation, proposals, technical specs, decision docs, or similar structured content." It runs three stages: context gathering, refinement and structure, then reader testing. In reader testing a subagent sees only the document, answers 5–10 predicted reader questions, and checks for "ambiguity, false assumptions, contradictions". That test suits a decision record or a runbook.
- **`claude-md-management`** (official marketplace): "audit quality, capture session learnings, and keep project memory current", for CLAUDE.md only (`claude-md-improver`, `/revise-claude-md`).
- **`pr-review-toolkit`'s `comment-analyzer` agent**: checks code comments against the code for "comment rot". It doesn't read Markdown docs.

A subagent searched the names and descriptions of all 315 plugins in the official marketplace and found no README, changelog, ADR or doc-sync plugin. A third-party `mintlify` plugin targets Mintlify-hosted docs. claude-code-action's `examples/` has no doc-sync workflow. A GitHub code search on 2026-10-14 for "update documentation" found 0 hits in anthropics/skills and 3 in anthropics/claude-code (the feature-dev README and two plugin-dev examples), none a doc-sync tool.

Ours: the `refresh-md-files` skill (FreekMencke/claude-skills) audits `.md` docs against the code and reports findings without editing. It covers the gap the official set leaves. Since 2026-10-13 (FreekMencke/claude-skills#43) it also flags one rule restated in several instruction files (DOC-019), expired plans and status lines (DOC-022), and reads a repo's review-rule doc pairs in diff scope (DOC-020).

## [DOC-011] Decision records: Nygard, MADR and one log or many files
- Type: comparison
- Applies to: general
- Confidence: community-consensus
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
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
- Last verified: 2026-10-23
- Sources: [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2), [lychee](https://github.com/lycheeverse/lychee), [markdown-link-check](https://github.com/tcort/markdown-link-check), [Vale](https://github.com/vale-cli/vale), [Prettier options: proseWrap](https://prettier.io/docs/options#prose-wrap)
- Related: DOC-013, DOC-015, DOC-020, WRITE-006

None of these checks whether a doc is true, only its form and links.

| Tool | Catches | Uptake (2026-10-13) |
|---|---|---|
| Prettier with `proseWrap: "always"` | Wrap width and Markdown formatting | Already in our Node repos |
| markdownlint-cli2 | Heading levels, lists, fences, bare URLs, line length | 1,725,819 npm downloads in the week 2026-10-05 to 2026-10-11 |
| lychee (`--offline` for local links only) | Broken links and anchors | 4,005 stars, active |
| markdown-link-check | Broken links | Its common GitHub Action wrapper is archived; prefer lychee |
| Vale | Prose style and terminology | 6,235 stars; config overhead too high for small repos |

**Ours.** osrs-tracker-web, osrs-tracker-aws, osrs-tracker-api and osrs-tracker-packages (since 2026-10-18) run `prettier --check` with `proseWrap: "always"` and `printWidth: 120`, so their Markdown is checked in CI (api's `prettier:ci` covers `**/*.md` since 2026-10-13). The same four run `lychee --offline --include-fragments --hidden` on every push. fremen-cluster (home-cluster until 2026-10-21) has no Prettier and no link check; one changelog line runs to 130. lychee `--offline` would catch renamed files that docs still link to, which happens when sessions move files. `--hidden` ("Do not skip hidden directories and files") should therefore reach `.claude/` and `.github/` (inferred from that text), and `--exclude-path` keeps out `node_modules`; our CI found a glob input still scanning `.gitignore`d paths, so exclude by hand.

## [DOC-015] Agents that detect or fix doc drift
- Type: pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Routines: use cases](https://code.claude.com/docs/en/routines.md), [claude-code-action: custom automations](https://raw.githubusercontent.com/anthropics/claude-code-action/main/docs/custom-automations.md), [anthropics/claude-code#7103](https://github.com/anthropics/claude-code/issues/7103)
- Related: DOC-010, DOC-013, DOC-024, REPO-018, REPO-030, ORCH-017

**Official patterns, with no published results.**
- Routines, "Docs drift": "A schedule trigger runs weekly. The routine scans merged PRs since the last run, flags documentation that references changed APIs, and opens update PRs against the docs repository for an editor to review."
- claude-code-action's "Automated Documentation Updates": on `pull_request` with a `paths` filter, the prompt is "Update the API documentation in README.md to reflect the changes made to the API endpoints in this PR", and Claude pushes to the PR.

**Community (single-source).** anthropics/claude-code#7103 (closed; not filed by a maintainer) proposes Cursor's approach: commit doc updates to a separate branch and post a compare link for review. Blog guides describe a merged-PR trigger. Nobody publishes measured results.

**Trade-off.** A drift agent starts cold and has to rediscover what the change meant. The session that made the change already knows. Same-PR updates enforced by reviewer rules (DOC-020) catch the pairs you know about. A periodic audit catches the pairs nobody wrote down. We run one weekly (REPO-018). DOC-024 has its first results.

## [DOC-016] Writing docs that agents retrieve
- Type: recommendation
- Applies to: general
- Confidence: unverified
- Last verified: 2026-10-14
- Sources: [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices.md), [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- Related: TOK-062, PROMPT-015, DOC-012, WRITE-007, WRITE-009

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
- Last verified: 2026-10-14
- Sources: [osrs-tracker org repos](https://github.com/osrs-tracker), [FreekMencke repos](https://github.com/FreekMencke); read with `git ls-tree origin/main` and `git show origin/main:<file>` in each local checkout after `git fetch`, 2026-10-13; the osrs-tracker-aws and osrs-tracker-packages rows re-read on GitHub `main`, 2026-10-18
- Related: DOC-018, DOC-021, DOC-022, DOC-023

All nine active repos: FreekMencke's five, plus the four osrs-tracker repos. The osrs-tracker org's other repos are archived (2019), apart from `.github`, which holds only a profile README.

| Repo | CHANGELOG | README | Other docs |
|---|---|---|---|
| claude-kb | Table, ISO dates | Layout, routine, design decisions | INDEX, ENTRIES (generated), OVERLAPS |
| claude-skills | None (installs track commits) | Install, checks, trigger evals | — |
| freek-mencke-web | None | Angular CLI template, says CLI 19.0.6; `package.json` has `@angular/cli` `^22.2.2` (2026-10-14) | — |
| fremen-cluster (home-cluster until 2026-10-21) | `## YYYY-MM-DD` | Overview, usage, "Known differences and decisions", access | `docs/rebuild.md`, `docs/upgrade-plan-kubernetes-1.37.md`, two Lambda READMEs |
| osrs-tracker-api | `## YYYY-MM-DD`, area subtitles | Provides, fits together, local, checks, built with | — |
| osrs-tracker-aws | `## YYYY-MM-DD` | Jobs, link to the packages, fits together, local runs | `DATA-MODEL.md`, a README per Lambda, `DEPLOY.md` and `INFRA.md` in the skill |
| osrs-tracker-packages | Root (tooling) plus 4 package changelogs | How they relate, development, licence | A README per package; publishing rules in the skill (aws's `PACKAGES.md` until 2026-10-18) |
| osrs-tracker-web | `## YYYY-MM-DD`, public at `/about/changelog` | Features, fits together, local, contributing | `docs/decisions.md` (484 lines on 2026-10-14), `docs/runbook.md` |
| solix | Versioned with ISO dates, Added/Changed/Fixed | Download, use, build, release, history | — |

A spot check of README version claims against `package.json` and Dockerfiles found them current in api and web. home-cluster's (now fremen-cluster) versions table matched its latest changelog entry on 2026-10-14 (Traefik v3.7.14, chart 41.7.1). The only stale README found is freek-mencke-web's (last push 2026-05-06). This was a spot check, not a full `refresh-md-files` audit.

## [DOC-018] Our changelog conventions and where they deviate
- Type: comparison
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: each repo's `CHANGELOG.md`, `CLAUDE.md`, repo skill and `conventions-reviewer.md` on `origin/main`, 2026-10-13, re-read 2026-10-14; [Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/)
- Related: DOC-001, DOC-002, DOC-004, DOC-019, SESS-026

**Shared convention** (api, aws, web, fremen-cluster, named home-cluster until 2026-10-21):
- A hand-written entry in the same change, under today's `## YYYY-MM-DD` (slashes until 2026-10-13), newest first. Doc-only changes get none.
- `###` area subtitles on busy days, with "Behind the scenes" last.
- Extend an entry rather than add a near-duplicate, and fold parallel PRs' headings on rebase.
- Effect-first prose, wrapped at 120.

**Between repos:**

| Point | Deviation |
|---|---|
| Doc-only changes | No entry in all four (decided 2026-10-13) |
| Dependabot | api, web: a follow-up "Dependency updates" line only when a bump changes behaviour. aws: an entry only then. fremen-cluster: none configured |
| `# Changelog` title | All but web (web's page supplies its own title); api, aws and fremen-cluster have a one-line preamble |
| Package headings (aws) | `## X.Y.Z - YYYY-MM-DD` in all four; logger and models also keep `## Unreleased` |
| References | api: `(#N)` 22 times. aws: `(issue #88)` and full refs. web: none (public) |
| "Reread the whole day" | All four |
| Tense | fremen-cluster's rule (in its `apply-before-push` skill): past tense for what was done, present for the state it leaves |

**Against Keep a Changelog 2.0:**
- Every change except doc-only ones logged where the spec says notable ones (DOC-002).
- Area subtitles where the spec has six types.
- Bare `(#N)` where the spec prefers prose.

solix follows the spec apart from a seventh "Development" type. claude-kb's table is built for its re-verification routine on purpose.

## [DOC-019] One rule in three files drifts apart
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [osrs-tracker-api CLAUDE.md](https://github.com/osrs-tracker/osrs-tracker-api/blob/main/CLAUDE.md), [osrs-tracker-api skill](https://github.com/osrs-tracker/osrs-tracker-api/blob/main/.claude/skills/osrs-tracker-api/SKILL.md), [osrs-tracker-web CLAUDE.md](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/CLAUDE.md), [osrs-tracker-web skill](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/.claude/skills/osrs-tracker-web/SKILL.md), read on `origin/main` 2026-10-13
- Related: DOC-003, DOC-018, REPO-044, MEM-023

Each osrs-tracker repo states its changelog rule in CLAUDE.md, again in the repo skill's conventions, and a third time as a cross-file pair in the skill's review rules, which `conventions-reviewer` reads. On 2026-10-13 the copies had diverged (fixed the same day, see Recommendations item 3):

- **osrs-tracker-api.** CLAUDE.md: "Every change gets a `CHANGELOG.md` entry". Review rules: "a user-visible change and `CHANGELOG.md`". The reviewer won't flag a missing entry for a tooling change that CLAUDE.md requires.
- **osrs-tracker-web.** CLAUDE.md: "Every change to the app, its dependencies or tooling (except Dependabot PRs)". Review rules: "a user-visible change and `CHANGELOG.md`". Same gap.
- **osrs-tracker-aws and home-cluster (now fremen-cluster)** were consistent ("a change and its `CHANGELOG.md` entry", "any change and `CHANGELOG.md`").

The repos already apply this fix to agents: "keep rules here, not in the agent". Apply it one level further. State the rule once (CLAUDE.md for the hard rule, or the skill for its details), and make the review-rule pair point to it: "a change that needs an entry under CLAUDE.md's changelog rule and `CHANGELOG.md`". A copy that's only a pointer can't drift.

## [DOC-020] Cross-file rules keep paired docs current
- Type: pattern
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: review rules in the [osrs-tracker-api](https://github.com/osrs-tracker/osrs-tracker-api/blob/main/.claude/skills/osrs-tracker-api/SKILL.md), [osrs-tracker-aws](https://github.com/osrs-tracker/osrs-tracker-aws/blob/main/.claude/skills/osrs-tracker-aws/SKILL.md) and [osrs-tracker-web](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/.claude/skills/osrs-tracker-web/SKILL.md) skills, [fremen-cluster conventions-reviewer.md](https://github.com/FreekMencke/fremen-cluster/blob/main/.claude/agents/conventions-reviewer.md) (private), read on `origin/main` 2026-10-13
- Related: DOC-013, DOC-015, DOC-019, REPO-044

Our reviewers check pairs of files "against the whole diff". Each pair is a doc that must change with a piece of code. It turns Google's "same change" rule (DOC-013) into something a reviewer can check:

- **osrs-tracker-api.**
  - A GET route and its `Cache-Control`.
  - A route's statuses and its handler's JSDoc.
  - A new env var and `Env`/`validateEnv`/`.env.example`.
  - A change and `CHANGELOG.md`.
- **osrs-tracker-aws.**
  - A Mongo write, query or index and `DATA-MODEL.md` ("its rows must match the change").
  - A Lambda's trigger or env vars and its README (a CLAUDE.md rule in aws, not in its review-rule pairs).
- **osrs-tracker-packages** (since 2026-10-18, read that day).
  - A change to the stored hiscore format or a stored document's type in `models` and osrs-tracker-aws's `DATA-MODEL.md` (or an issue there).
  - A change that breaks a consumer and its `**Breaking:**` entry; a version bump and its `## X.Y.Z - YYYY-MM-DD` entry.
- **osrs-tracker-web.** A new route and `route-label.ts`.
- **fremen-cluster** (home-cluster until 2026-10-21). A chart or version change and the README's versions table, `docs/rebuild.md` and the `CHARTS` lists.

**Why it works.** Each pair is narrow enough for a reviewer at `medium` effort to check from the diff. The rule sits in the skill, so the implementing session sees it too. It covers only the pairs someone wrote down, so a periodic audit (`refresh-md-files`) is still needed for the rest.

**When to add a pair.** When a doc was found stale after a change that should have updated it. Each pair is one line in the review rules.

## [DOC-021] A dated decision log in one file
- Type: pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [osrs-tracker-web docs/decisions.md](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/docs/decisions.md), [osrs-tracker-web CLAUDE.md](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/CLAUDE.md), [fremen-cluster README.md](https://github.com/FreekMencke/fremen-cluster/blob/main/README.md) (private), read on `origin/main` 2026-10-13
- Related: DOC-011, DOC-020, REPO-044

osrs-tracker-web's `docs/decisions.md` (484 lines, 33 decisions from 2026-10-04 to 2026-10-13, on 2026-10-14) opens: "Choices that look like accidents without their context: what was decided, why, and when to revisit. Newest first."

Each entry:
- **Heading:** the decision as a sentence, with its date. Example: "## Item link previews are drawn by the server (2026-10-11)".
- **Context:** the forces, including rejected alternatives.
- **Decision:** what was built, naming files.
- **Revisit:** the condition that would reopen it.

Compared with MADR, it drops status and numbering and adds the revisit condition. CLAUDE.md says: "Read `docs/decisions.md` before 'fixing' something that looks odd". The reviewer reads it every review and "never flag[s] what it explains", which is what makes it pay: it stops sessions from undoing deliberate choices.

**Elsewhere.**
- fremen-cluster (home-cluster until 2026-10-21) keeps the same idea as a README section, "Known differences and decisions" (re-read 2026-10-22; the "Host edits kept on purpose" section of 2026-10-13 is gone).
- api and aws have no decisions file. api's review rules say so ("No decisions document to read"), and its rationale lives inline in the skill ("Not used on purpose: …").

That's fine at their size. Move the rationale to a decisions file once the skill's inline "on purpose" notes reach a few, or once the reviewer flags a deliberate choice.

## [DOC-022] Plan docs with a dated status and a delete condition
- Type: pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [fremen-cluster docs/upgrade-plan-kubernetes-1.37.md](https://github.com/FreekMencke/fremen-cluster/blob/main/docs/upgrade-plan-kubernetes-1.37.md) (private), read on `origin/main` 2026-10-13 and 2026-10-22
- Related: DOC-013, FLOW-003, SDD-004

fremen-cluster's (home-cluster until 2026-10-21) Kubernetes upgrade plan opens with a status line and its own expiry: "**Status (8 Oct 2026): waiting for cert-manager 1.22.** … Delete this file once every step is done." On 2026-10-22 it read "**Status (21 Oct 2026): waiting for cert-manager 1.22 and Flux 2.10.** Tracked in FreekMencke/fremen-cluster#8, which says when to check again." Then come the rules for every step, and the steps.

**Why it works.**
- A session that opens the file learns at once whether it's current and what blocks it.
- The delete condition applies Google's "Default to delete" (DOC-013): a finished plan doesn't linger as a half-true doc.
- The status line carries a date, so a stale status is visible as stale.

**The gap.** Nothing prompts a re-check. The status said "1.22 is due around November 2026", but no issue or routine fires then. Pair a long-lived plan with an issue that has a due date in its title, the way FreekMencke/claude-kb#13 does ("due 2026-11-12").

## [DOC-023] Runbooks in `docs/` or in a skill
- Type: comparison
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
- Sources: [osrs-tracker-web docs/runbook.md](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/docs/runbook.md), [osrs-tracker-aws DEPLOY.md](https://github.com/osrs-tracker/osrs-tracker-aws/blob/main/.claude/skills/osrs-tracker-aws/DEPLOY.md), [osrs-tracker-api skill](https://github.com/osrs-tracker/osrs-tracker-api/blob/main/.claude/skills/osrs-tracker-api/SKILL.md), [fremen-cluster docs/rebuild.md](https://github.com/FreekMencke/fremen-cluster/blob/main/docs/rebuild.md) (private), read on `origin/main` 2026-10-13
- Related: DOC-012, SKILL-021, REPO-044

Our repos split operational docs two ways:

| Repo | Where | Reader |
|---|---|---|
| osrs-tracker-web | `docs/runbook.md`: roll back, a failed `CD` run, site down, health checks, the GE tax recheck | People and sessions; workflows link to it in comments |
| fremen-cluster (home-cluster until 2026-10-21) | `docs/rebuild.md` plus skills (`apply-before-push`, health checks) | Rebuild by a person; routine work by sessions |
| osrs-tracker-aws | `DEPLOY.md` (with "Rollback") and `INFRA.md` inside the skill folder | Sessions, loaded on demand |
| osrs-tracker-api | Rollback and release steps inside `SKILL.md` | Sessions |

**Rule of thumb.**
- A procedure only sessions run, like a release, belongs in a skill or its reference files, where it loads on demand (SKILL-021).
- A procedure a person may run during an incident without Claude, like a rollback or a rebuild, belongs in `docs/`, linked from the skill, so it can be found without knowing the `.claude/` layout.

By that rule, api's and aws's rollback steps are in the wrong place. Today only sessions roll back, so moving them is low priority (see Recommendations).

## [DOC-024] Our weekly docs-drift routine: first runs
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: [osrs-tracker/osrs-tracker-web#231](https://github.com/osrs-tracker/osrs-tracker-web/pull/231), [osrs-tracker/osrs-tracker-api#137](https://github.com/osrs-tracker/osrs-tracker-api/pull/137), [osrs-tracker/osrs-tracker-api#136](https://github.com/osrs-tracker/osrs-tracker-api/pull/136)
- Related: DOC-015, DOC-020, REPO-018, SKILL-060

**The routine.** "osrs-tracker weekly docs drift" is a cloud routine (REPO-018; REPO recommendations, change 6). It runs Mondays at 05:00 UTC on Sonnet 5.5 across api, web and aws. It runs `refresh-md-files` against the PRs merged that week and opens at most one PR per repo. It clones FreekMencke/claude-skills for the skill, because routines don't load marketplace plugins (SKILL-060).

**First runs (2026-10-12, set-up runs around 15:30 UTC, not the 05:00 schedule):**

| Repo | PR | Result |
|---|---|---|
| api | #136 | Closed: ran without the skill ("We'll rerun once the routine loads the skill") |
| api | #137, merged | 3 findings in 5 files: the skill's `Cache-Control` route list and validation-pipe list, and the README's feature list, all missing what #131 added |
| web | #231, merged | 2 findings in 9 files: the runbook's log types, and a skill rule that the `.png` link-preview route broke |
| aws | none | No PR |

**Reading it.** All five findings were real and small: a list in a doc that a PR had extended in code. Three of them fit a cross-file rule (DOC-020), such as "a new route and the skill's `Cache-Control` list". So each finding is also a candidate rule. The first scheduled run is 2026-10-19.

## Recommendations for our setup

Ranked by impact against effort.

1. **Done 2026-10-13: each repo states its changelog rule once, and its reviewer pair points to it** (osrs-tracker/osrs-tracker-api#150, osrs-tracker/osrs-tracker-web#264, osrs-tracker/osrs-tracker-aws#94, FreekMencke/home-cluster#6). DOC-019, DOC-020.
2. **Done 2026-10-13: the changelog brief aligned with Keep a Changelog 2.0 across the four Claude-maintained repos**, with "every change" and "Behind the scenes" kept on purpose (the issues in item 1). DOC-001, DOC-002, DOC-003, DOC-018.
3. **Decided and done 2026-10-13: doc-only changes get no entry, and Dependabot bumps get one only when they change behaviour**; home-cluster's push hook exempts doc-only commits (the issues in item 1). DOC-002, DOC-018.
4. **Done 2026-10-13: ISO `YYYY-MM-DD` changelog headings in all four repos on the same day**, and one aws package heading format (osrs-tracker/osrs-tracker-api#153, osrs-tracker/osrs-tracker-web#265, osrs-tracker/osrs-tracker-aws#95, FreekMencke/home-cluster#7). DOC-004.
   Update 2026-10-18: the package changelogs moved to osrs-tracker-packages with that heading format.
5. **Done 2026-10-13: `lychee --offline --include-fragments --hidden` with `fail: true` in CI for api, web and aws, and api's `prettier:ci` over Markdown** (the issues in item 4). DOC-014.
   Update 2026-10-18: osrs-tracker-packages runs the same lychee and Prettier checks.
6. **Replace freek-mencke-web's template README** (low impact, trivial effort). It's the only stale README found. DOC-017. Dropped 2026-10-13: that app is due for an overhaul.
7. **Give long-lived plan docs a due-date issue** (low impact, trivial effort). Start with the cluster repo's Kubernetes 1.37 plan, due when cert-manager 1.22 ships. DOC-022. Opened 2026-10-13 as FreekMencke/fremen-cluster#8 (then home-cluster; check 2026-11-30). It also adds the convention to that repo's CLAUDE.md.
8. **Already running, so not a recommendation:** the weekly docs-drift routine (REPO-018, DOC-024). This file first listed it under "not now", having missed REPO-018; corrected 2026-10-13. Watch whether its findings are pairs that a cross-file rule (DOC-020) should have caught, and add those rules. **Not now:** MADR files (the one-file log works at 33 decisions (2026-10-14); DOC-021), and a changelog check in CI for PR repos (the reviewer pair is the reminder; DOC-008). 

## Open questions

1. **Does "every change" make our changelogs too long for their readers?** web's is 857 lines over 67 days, and api's 502 lines over 10 (2026-10-14). No measurement says whether sessions or users read past the first screen. A cheap check: how often sessions grep CHANGELOG.md as opposed to `git log`.
2. **Should claude-skills have a changelog?** It installs by commit, and its commit subjects already read like entries (`<skill>: <change> (#PR)`). Keep a Changelog says a commit list isn't a changelog. With one user and the claude.ai sync, the reader may not exist.
3. **Official doc-sync tooling.** Answered 2026-10-14: a GitHub code search across anthropics/skills and anthropics/claude-code for "update documentation" found no doc-sync skill or plugin (DOC-010). Re-run only if a new official plugin appears.
4. **Does `/init` read the README?** memory.md doesn't say. Untested.
5. **Docs-drift routine results.** No published measurement of a docs-sync agent was found (DOC-015). Our own routine has only test runs so far (DOC-024). After a month of scheduled runs, check how many findings were real, and how many a cross-file rule could have prevented.
