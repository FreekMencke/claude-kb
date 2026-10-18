# Open-source licensing and repo hygiene

Prefix `OSS`. This file covers licensing a repo and what an agent does with licences on 2026-10-18: choosing a licence
for code, content and fonts, source-available licences, several licences in one repo, how GitHub detects a licence,
SPDX identifiers and REUSE, listing and gating dependency licences with npm and GitHub, font licences, notice
obligations when copying code and what an agent must not do, and the community health files a personal project
needs. It states what licence texts, SPDX, GitHub, the OFL FAQ and Creative Commons say; it is not legal advice, and
entries say where a question turns on legal interpretation. The OFL's Reserved Font Names and subsetting are in
`kb-fonts.md` (FONT-018, FONT-019); README sections in `kb-documentation.md` (DOC-012); rulesets in `kb-github.md`
(GH-005); security headers and vulnerability handling in code belong to the WEBSEC topic.

Research basis:
- Researched 2026-10-18 (FreekMencke/claude-kb#193, part of roadmap #167) by an Opus 5.5 lead with two Sonnet readers
  (dependency and font licence checks; SPDX, REUSE, notices, compatibility and Creative Commons).
- Read as raw text: choosealicense.com's sources and github/docs Markdown from `raw.githubusercontent.com`, the SPDX
  License List JSON (3.29.0) and the spec's Annex E (2.3), licensee's docs, the REUSE 3.3 spec, the OFL text and FAQ,
  the CC FAQ and BY-NC 4.0 legal code, the FSF licence list, the OSD, the Elastic License 2.0, the
  dependency-review-action README, npm/cli docs and GitHub's REST OpenAPI description; Angular CLI source at v22.2.3.
- The lead re-checked the claims the recommendations rest on against the downloaded text and searched for
  counter-evidence itself (no separate refuter): nothing contradicted them.
- Tested: `gh api …/license` and `…/community/profile` on our public repos (gh 2.102.0); `npm sbom` and `npm query`
  with npm 11.19.0 on Node 24.21.0.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which licence for code, docs and fonts? | Code: a software licence (MIT for npm-style projects); docs and media: CC BY 4.0 or CC0; fonts: the OFL 1.1. Creative Commons "recommend[s] against using Creative Commons licenses for software". No licence means all rights reserved. | OSS-001 |
| Is the Elastic License 2.0 (or CC BY-NC) open source? | No: SPDX marks Elastic-2.0, CC-BY-NC-4.0 and BUSL-1.1 not OSI-approved; the OSD forbids field-of-endeavour restrictions. Elastic calls ELv2 "source-available". | OSS-002 |
| How do I license code and content differently in one repo? | Say which licence covers which part, in the README and with a licence file per part; npm's `license` takes an SPDX expression. Code examples in docs should be under the code's licence. | OSS-003 |
| Why does GitHub show "Other" (NOASSERTION) for my licence? | licensee matches root licence files at 98% against choosealicense.com's list only; ELv2 and CC BY-NC aren't on it, and two licence files that aren't one known licence give no result. | OSS-004 |
| How do I mark a file's licence? | `SPDX-License-Identifier: <expression>` on its own line in a comment near the top (SPDX 2.3 Annex E); `LicenseRef-…` for unlisted licences. Never remove existing copyright lines. | OSS-005 |
| How do I license files that can't hold a comment (fonts, images)? | REUSE 3.3: a `<file>.license` sidecar or a `REUSE.toml` annotation, licence texts in `LICENSES/<SPDX-ID>.txt`. `.reuse/dep5` is deprecated. | OSS-006 |
| How do I list my npm dependencies' licences? | `npm sbom --sbom-format spdx` (`--omit dev` for what ships) and read `licenseDeclared`; look at every `NOASSERTION`, `SEE LICENSE IN` and `UNLICENSED`. CycloneDX output drops those. Angular builds also write `3rdpartylicenses.txt`. | OSS-007 |
| How do I block a PR that adds a disallowed licence? | `actions/dependency-review-action@v5` with `allow-licenses` (free on public repos). `deny-licenses` is deprecated, and unknown licences don't fail. | OSS-008 |
| Can I ship an OFL font in my app or website? | Yes: bundling with any software is allowed, a web font is distribution, and each copy must carry the copyright notice and licence (a file, or the font's name IDs 13 and 14). | OSS-009 |
| What must I keep when copying MIT or Apache code? | MIT, BSD and ISC: the copyright notice and licence text. Apache-2.0: the licence, all notices, the NOTICE file's attributions, and a mark on each changed file. | OSS-010 |
| What must an agent never do with third-party code? | Strip or rewrite notices, paste GPL/AGPL code into an MIT or ELv2 project, copy code with no licence, or put CC-licensed text into code. Claude Code has no public-code matching filter. | OSS-011 |
| Which community health files does a personal project need? | LICENSE and README; SECURITY.md with private vulnerability reporting on; a short CONTRIBUTING if outsiders send PRs. CODEOWNERS adds nothing for a solo maintainer. Defaults can live in a public `.github` repo, except the licence. | OSS-012 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| OSS-001 | Choosing a licence for code, content and fonts | recommendation | license, choosealicense, creative-commons, ofl, no-license |
| OSS-002 | Source-available isn't open source: Elastic-2.0, CC BY-NC, BUSL | fact | source-available, elastic-license, cc-by-nc, osi, osd |
| OSS-003 | Several licences in one repo: code, docs and assets | pattern | dual-licensing, mixed-licenses, readme, package-json |
| OSS-004 | How GitHub detects a repo's licence, and why it shows "Other" | fact | licensee, license-detection, noassertion, github-api |
| OSS-005 | SPDX identifiers and expressions in files and `package.json` | fact | spdx, license-expression, licenseref, headers |
| OSS-006 | REUSE: per-file licensing, `LICENSES/` and `REUSE.toml` | tool | reuse, spdx, per-file-license, fonts, images |
| OSS-007 | Listing dependency licences with `npm sbom` and `npm query` | tool | npm-sbom, npm-query, spdx, cyclonedx, 3rdpartylicenses |
| OSS-008 | Gating dependency licences in CI: dependency-review-action | tool | dependency-review, allow-licenses, github-actions, sbom |
| OSS-009 | Font licences: bundling, web fonts and what to record | fact | ofl, fonts, webfonts, name-table, google-fonts |
| OSS-010 | Notice obligations when copying code: MIT, BSD, ISC, Apache, ELv2 | fact | notices, apache-notice, mit, attribution, cc-by |
| OSS-011 | What an agent must not do with third-party code | anti-pattern | copyleft, gpl, compatibility, notices, copilot-code-referencing |
| OSS-012 | Community health files for a personal project: SECURITY.md, CONTRIBUTING, CODEOWNERS | recommendation | security-md, private-vulnerability-reporting, contributing, codeowners, community-profile |

## [OSS-001] Choosing a licence for code, content and fonts
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [choosealicense.com: existing projects](https://choosealicense.com/community/), [choosealicense.com: non-software licenses](https://choosealicense.com/non-software/), [choosealicense.com: no license](https://choosealicense.com/no-permission/), [GitHub Docs: licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository), [CC FAQ](https://creativecommons.org/faq/)
- Related: OSS-002, OSS-003, OSS-009, FONT-018

Pick the licence by kind of material, and follow the ecosystem's habit for code.

- **Code.** choosealicense.com: "[npm packages] overwhelmingly use the MIT or the very similar ISC licenses"; contributing to an existing project, "it's almost always easiest to continue using that project's license". Its MIT summary: "conditions only requiring preservation of copyright and license notices".
- **Docs, data, media.** CC0-1.0, CC-BY-4.0 and CC-BY-SA-4.0 are "open licenses used for non-software material". The CC FAQ: "We recommend against using Creative Commons licenses for software", since they lack source-code terms and "are currently not compatible with the major software licenses"; they suit "software documentation, as well as for separate artistic elements". CC0 "is GPL-compatible and acceptable for software".
- **Fonts.** "The SIL Open Font License 1.1 keeps fonts open" (choosealicense); see OSS-009.
- **No licence.** GitHub: "without a license, the default copyright laws apply, meaning that you retain all rights"; publishing publicly lets others only "view and fork your repository" under the Terms of Service. choosealicense suggests a copyright notice and a no-licence statement in the README "so that users don't assume you made an oversight".

Which licence suits a business goal is a legal and commercial choice; these sources only map the options.

## [OSS-002] Source-available isn't open source: Elastic-2.0, CC BY-NC, BUSL
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [SPDX License List JSON 3.29.0](https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json), [The Open Source Definition](https://opensource.org/osd), [Elastic: license change clarification](https://www.elastic.co/blog/license-change-clarification), [Elastic License 2.0 post](https://www.elastic.co/blog/elastic-license-v2), [MariaDB BSL FAQ](https://mariadb.com/bsl-faq-adopting/), [Open Definition 2.1](https://opendefinition.org/od/2.1/en/)
- Related: OSS-001, OSS-004, OSS-011

A licence that limits who may use the code, or for what, isn't open source, however readable the code is.

- **SPDX** (list 3.29.0, released 2026-09-16, `isOsiApproved`): `Elastic-2.0` false, `CC-BY-NC-4.0` false, `BUSL-1.1` false; `MIT`, `Apache-2.0`, `ISC`, `OFL-1.1` true.
- **OSD criterion 6:** "The license must not restrict anyone from making use of the program in a specific field of endeavor. For example, it may not restrict the program from being used in a business". The Open Definition 2.1 has the same rule for content, and its conformant list has no NonCommercial licence.
- **Elastic:** ELv2 "is source-available and allows free use, with none of the copyleft aspects of SSPL"; "we are still not claiming that either SSPL or the Elastic License are OSI-approved licenses". Its limits: no providing the software "as a hosted or managed service", no circumventing licence keys, no removing notices.
- **BUSL:** MariaDB, its author: "The BSL is not an Open Source license and we do not claim it to be one."

So call such repos "source-available" or "public", not "open source", and expect licence scanners (OSS-008) and GitHub's detection (OSS-004) to treat them as non-standard. No OSI page naming Elastic-2.0 or BUSL-1.1 was found (searched the OSD, OSI's SSPL statement and one web search).

## [OSS-003] Several licences in one repo: code, docs and assets
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [choosealicense.com: non-software licenses](https://choosealicense.com/non-software/), [GitHub Docs: licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository), [npm docs: package.json `license`](https://docs.npmjs.com/cli/configuring-npm/package-json#license)
- Related: OSS-004, OSS-005, OSS-006, DOC-012

choosealicense.com on mixed projects: "you can include multiple licenses, as long as you are explicit about which license applies to each part of the project". For docs under another licence than the code, "be sure to specify that source code examples in the documentation are also licensed under the software license."

What works, by size:
- **Two parts** (code and content): a root `LICENSE` for the main part, a second file such as `LICENSE-MIT`, and a README "License" section naming which paths each covers. This knowledge base does that: CC BY-NC 4.0 for the content, MIT for `mcp-server/`, `scripts/` and `.github/`.
- **An asset with its own terms** (a font, images): a licence file next to it, and a README sentence excluding that path from the root licence.
- **Many parts:** REUSE (OSS-006).

For an npm package, `license` takes one SPDX expression for the package: `"(MIT OR Apache-2.0)"` for a choice, `"SEE LICENSE IN <filename>"` for a custom licence, `"UNLICENSED"` to grant nothing (npm adds: "Consider also setting `"private": true`"). The `licenses` array and object forms are "now deprecated".

Expect GitHub's sidebar to show "Other" for a repo with two licence files (OSS-004); GitHub suggests noting the complexity in the README.

## [OSS-004] How GitHub detects a repo's licence, and why it shows "Other"
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [GitHub Docs: licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository), [licensee: what we look at](https://github.com/licensee/licensee/blob/main/docs/what-we-look-at.md), [licensee: customizing](https://github.com/licensee/licensee/blob/main/docs/customizing.md), [REST: get the license for a repository](https://docs.github.com/en/rest/licenses/licenses#get-the-license-for-a-repository)
- Related: OSS-002, OSS-003, OSS-006

GitHub runs licensee, which "compares the repository's LICENSE file to a short list of known licenses", the ones on choosealicense.com.

- **Files read:** root files matching names like `LICENSE`, `LICENCE`, `COPYING.txt`, `LICENSE-MIT`, plus a REUSE `LICENSES/` directory. Not the README, not `package.json` (both optional and off by default), not dependencies, not per-file headers.
- **Match threshold:** "the default being 98".
- **Several files:** if they "don't only match one well known license", licensee "won't return a license for the project". GitHub: "simplify your LICENSE file and note the complexity somewhere else, such as your repository's README".
- **Unknown licence:** a licence not on choosealicense.com (its `_licenses` has 47 files on 2026-10-18; no Elastic-2.0, no CC-BY-NC-4.0) can't be detected; GitHub suggests requesting its inclusion.

The REST API then returns `"key": "other"`, `"spdx_id": "NOASSERTION"`. Licence search uses the keywords in GitHub's table (`license:mit`, `license:cc`).

Tested 2026-10-18, gh 2.102.0, `gh api repos/<owner>/<repo>/license`: an MIT-only repo returned `MIT`; an Apache-2.0 repo with a `NOTICE` file returned `Apache-2.0`; three Elastic-2.0 repos and this repo (`LICENSE` CC BY-NC 4.0 plus `LICENSE-MIT`) returned `NOASSERTION`.

## [OSS-005] SPDX identifiers and expressions in files and `package.json`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [SPDX 2.3 Annex E: short identifiers in source files](https://spdx.github.io/spdx-spec/v2.3/using-SPDX-short-identifiers-in-source-files/), [SPDX 2.3 Annex D: license expressions](https://spdx.github.io/spdx-spec/v2.3/SPDX-license-expressions/), [spdx/spdx-spec releases](https://github.com/spdx/spdx-spec/releases), [SPDX: handling license info](https://spdx.dev/learn/handling-license-info/), [SPDX License List](https://spdx.org/licenses/)
- Related: OSS-003, OSS-006, OSS-007

Annex E: "The SPDX-License-Identifier tag declares the license the file is under and should be placed at or near the top of the file in a comment", "on its own line":

```ts
// SPDX-License-Identifier: MIT
```

- **Expressions** (Annex D): `OR` for a choice ("disjunctive"), `AND` for both, `WITH` for an exception (`GPL-2.0-or-later WITH Bison-exception-2.2`). "The expression MUST be on a single line". Operators are case-sensitive; identifiers aren't.
- **Unlisted licences:** `LicenseRef-<idstring>` (letters, digits, `-`, `.`), and "you will also need to provide a way for others to determine what license text corresponds to it" (REUSE's `LICENSES/`, OSS-006).
- **Copyright:** SPDX IDs don't cover it: "you should not remove or modify existing copyright notices in files when adding an SPDX ID." REUSE adds `SPDX-FileCopyrightText:`.
- **Which spec:** the newest release is 3.0.1 (2024-12-17; `v3.1-RC1` is a pre-release, 2026-01-24), but the source-file annex exists only in 2.3 (2022-11-03); 3.0 keeps the expression annex.
- **IDs:** take them from the SPDX License List (3.29.0, released 2026-09-16), e.g. `Elastic-2.0`, `CC-BY-NC-4.0`, `OFL-1.1`.

npm's `license` field takes the same expressions (OSS-003).

## [OSS-006] REUSE: per-file licensing, `LICENSES/` and `REUSE.toml`
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [REUSE Specification 3.3](https://reuse.software/spec-3.3/), [reuse on PyPI](https://pypi.org/project/reuse/), [licensee: what we look at](https://github.com/licensee/licensee/blob/main/docs/what-we-look-at.md)
- Related: OSS-003, OSS-004, OSS-005, OSS-009

REUSE (FSFE; spec 3.3, dated 2024-11-14) makes every file's licence machine-readable. Three rules:

1. **Licence texts** in `LICENSES/<SPDX-ID>.txt`, one per licence used, nothing else there; unlisted ones as `LicenseRef-<name>`. "A Project MUST NOT include License Files for licenses under which none of the files in the Project are licensed."
2. **Each file** carries a header, "the RECOMMENDED method":
   ```
   # SPDX-FileCopyrightText: 2026 Jane Doe
   #
   # SPDX-License-Identifier: MIT
   ```
3. **Uncommentable files** (fonts, images, JSON): a sidecar "of the same name with the additional extension .license" (`font.woff2.license`), or a `REUSE.toml` in any directory with `version = 1` and `[[annotations]]` (`path` globs, `precedence`, `SPDX-FileCopyrightText`, `SPDX-License-Identifier`). "The DEP5 file is deprecated"; `REUSE.toml` and DEP5 are mutually exclusive.

Third-party code pasted into a file can be fenced with `SPDX-SnippetBegin` … `SPDX-SnippetEnd`. Root `LICENSE`/`COPYING` files are ignored by the spec, and licensee reads `LICENSES/` (OSS-004).

The checker is the `reuse` Python package (6.2.0, uploaded 2025-10-27, Python 3.10+, `https://pypi.org/pypi/reuse/json`); not run here. For a two-licence repo, a README section and per-folder files (OSS-003) cost less; REUSE pays off with many licences or many third-party files.

## [OSS-007] Listing dependency licences with `npm sbom` and `npm query`
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [npm sbom](https://github.com/npm/cli/blob/latest/docs/lib/content/commands/npm-sbom.md), [npm dependency selectors](https://github.com/npm/cli/blob/latest/docs/lib/content/using-npm/dependency-selectors.md), [npm package.json `license`](https://github.com/npm/cli/blob/latest/docs/lib/content/configuring-npm/package-json.md), [Angular CLI `license-extractor.ts` at v22.2.3](https://github.com/angular/angular-cli/blob/v22.2.3/packages/angular/build/src/tools/esbuild/license-extractor.ts), [Angular application builder schema at v22.2.3](https://github.com/angular/angular-cli/blob/v22.2.3/packages/angular/build/src/builders/application/schema.json)
- Related: OSS-008, OSS-005, NPM-013, DOCKER-011

npm lists licences without extra packages. `npm sbom` writes SPDX 2.3 or CycloneDX 1.5 from each installed package's `package.json`; `--omit dev` keeps what ships; `npm query '[license=MIT]'` filters the tree.

Prefer SPDX output: it keeps strings CycloneDX drops.

| Dependency's `package.json` | SPDX `licenseDeclared` | CycloneDX `licenses` |
|---|---|---|
| no `license` | `NOASSERTION` | null |
| `SEE LICENSE IN LICENSE.md` | the string as is | null |
| `UNLICENSED` | `UNLICENSED` | null |
| `(MIT OR Apache-2.0)` | the expression | `expression` |
| legacy `licenses: [{type: "MIT"}]` | `MIT` | `MIT` |

`npm query '[license=…]'` misses the legacy array, which is a separate attribute. An agent should review every `NOASSERTION`, `SEE LICENSE IN` and `UNLICENSED` by reading that package's licence file.

Angular's application builder has `extractLicenses` (default `true`): it writes `3rdpartylicenses.txt` to the output root, with each bundled package's name, `license` field and licence file text, covering only packages in the built JS and CSS.

Tested 2026-10-18, npm 11.19.0, Node 24.21.0: `express@5.1.0` and `lodash@4.17.21` plus `typescript@5.9.3` (dev), installed with `--ignore-scripts`; `npm sbom --sbom-format spdx` listed 69 packages: MIT 62, ISC 5, BSD-3-Clause 1, Apache-2.0 1; `--omit dev` dropped the Apache-2.0 one. The table above came from five local `file:` packages. npm 12 not tested.

## [OSS-008] Gating dependency licences in CI: dependency-review-action
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [dependency-review-action README](https://github.com/actions/dependency-review-action/blob/main/README.md), [GitHub Docs: configuring the dependency review action](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-dependency-review-action), [GitHub Docs: open source license compliance](https://docs.github.com/en/code-security/concepts/supply-chain-security/open-source-license-compliance), [GitHub REST OpenAPI description](https://github.com/github/rest-api-description), [GitHub Docs: exporting an SBOM](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/export-dependencies-as-sbom)
- Related: OSS-007, GHA-008, NPM-013

`actions/dependency-review-action` diffs a PR's dependencies and can fail on licences. It "is available for: - Public repositories" (private ones need GitHub Advanced Security). Latest: v5.0.0 (2026-05-08, `gh api repos/actions/dependency-review-action/releases/latest`), on node24.

- **`allow-licenses`:** "The action will fail on pull requests that introduce dependencies with licenses that do not match the list"; SPDX identifiers or expressions.
- **`deny-licenses`:** "deprecated for possible removal in the next major release" (README; GitHub's docs page doesn't say so). The two are mutually exclusive.
- **`allow-dependencies-licenses`:** purls exempted from the check; `license-check` defaults to `true`.
- **Unknown licences:** "we will inform you, but the action won't fail".
- **Data:** "License data comes from ClearlyDefined"; its `OTHER` becomes `LicenseRef-clearlydefined-OTHER`.

GitHub's licence policies ("Requires license compliance results before merging") need GitHub Enterprise Cloud with Code Security, so personal repos use the action.

**SBOM export:** SPDX 2.3 with `licenseDeclared`. The synchronous `GET /repos/{owner}/{repo}/dependency-graph/sbom` "will not be accessible after November 13, 2026"; use `…/sbom/generate-report`, then poll `…/sbom/fetch-report/{sbom_uuid}`.

Community checkers add allow-lists to a local run: `licensee` (12.0.2, 2026-08-31) reads `.licensee.json`; `license-checker` last published 2019-01-10; `license-checker-rseidelsohn` (5.0.1) announces its own deprecation (`npm view <pkg> dist-tags`, `time[<version>]`).

## [OSS-009] Font licences: bundling, web fonts and what to record
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [OFL 1.1 official text](https://openfontlicense.org/open-font-license-official-text/), [OFL FAQ](https://openfontlicense.org/ofl-faq/), [OpenType spec: `name` table](https://learn.microsoft.com/en-us/typography/opentype/spec/name), [google/fonts README](https://github.com/google/fonts/blob/main/README.md), [gf-docs: METADATA](https://github.com/googlefonts/gf-docs/blob/main/METADATA/README.md)
- Related: FONT-018, FONT-019, OG-003, OSS-006

The OFL 1.1 lets a font ship inside any app or site, with conditions on the font itself.

- **Bundling:** fonts "may be bundled, redistributed and/or sold with any software, provided that each copy contains the above copyright notice and this license", as "stand-alone text files, human-readable headers or in the appropriate machine-readable metadata fields". The font can't be "sold by itself", and must stay under the OFL. FAQ 1.3: the program needn't be open source.
- **Web fonts are distribution**, not embedding (FAQ 2.1, 2.10). Only fonts embedded in a document or "bundled within a program" may go without the licence text (FAQ 1.10), which favours keeping it in the file's metadata.
- **In the file:** OpenType name ID 13, "License Description", and ID 14, "License Info URL"; both free text. Subsetting drops them by default (FONT-019).
- **Documents and images** made with the font aren't affected (OFL; FAQ 1.13), which covers Open Graph PNGs rendered from it.

Record per font: family, version, source URL, licence (SPDX `OFL-1.1`, or the EULA for a commercial font), whether it declares Reserved Font Names, and where the licence file lives in the repo. Google Fonts records `license: "OFL"`, `"APACHE2"` or `"UFL"` in each family's `METADATA.pb`. A proprietary or commercial font's EULA decides whether serving it on the web or embedding it in a server bundle is allowed: read it; that is a legal question.

## [OSS-010] Notice obligations when copying code: MIT, BSD, ISC, Apache, ELv2
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [choosealicense.com licence sources](https://github.com/github/choosealicense.com/tree/gh-pages/_licenses), [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0), [Elastic License 2.0](https://www.elastic.co/licensing/elastic-license), [CC BY-NC 4.0 legal code](https://creativecommons.org/licenses/by-nc/4.0/legalcode.en), [CC: recommended practices for attribution](https://wiki.creativecommons.org/wiki/Recommended_practices_for_attribution)
- Related: OSS-011, OSS-005, OSS-007

What each licence asks of someone who copies its code:

- **MIT:** "The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software."
- **ISC:** the notices must "appear in all copies". **BSD-3-Clause:** source keeps the notice, conditions and disclaimer; binaries reproduce them "in the documentation and/or other materials"; no endorsement using the holder's name.
- **Apache-2.0 §4:** (a) give recipients "a copy of this License"; (b) "cause any modified files to carry prominent notices stating that You changed the files"; (c) keep "all copyright, patent, trademark, and attribution notices"; (d) if the work has a `NOTICE` file, pass on its attributions. You may add your own copyright to your changes.
- **Elastic-2.0:** "You may not alter, remove, or obscure any licensing, copyright, or other notices"; anyone receiving a copy must get these terms; modified copies need "prominent notices stating that you have modified the software".
- **CC BY / BY-NC 4.0 (text, images):** keep the creator, copyright notice, licence notice, disclaimer notice and a link, and "indicate if You modified" it; CC suggests Title, Author, Source, License (TASL).

choosealicense labels these `include-copyright` and `document-changes`. Whether serving a minified bundle to browsers counts as distributing "copies" is a legal question; carrying the notices (OSS-007's `3rdpartylicenses.txt`) avoids having to answer it.

## [OSS-011] What an agent must not do with third-party code
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [FSF licence list](https://www.gnu.org/licenses/license-list.html), [GNU GPL 3.0](https://www.gnu.org/licenses/gpl-3.0.txt), [CC: compatible licenses](https://creativecommons.org/share-your-work/licensing-considerations/compatible-licenses/), [choosealicense.com: no license](https://choosealicense.com/no-permission/), [GitHub Docs: Copilot in IDEs, references to matching public code](https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-in-ides), [Claude Code: legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)
- Related: OSS-010, OSS-002, OSS-005

Rules for an agent copying or adapting code, with what each rests on:

- **Don't strip, shorten or rewrite notices,** licence headers, SPDX lines or `NOTICE` files, even while reformatting (OSS-010; SPDX: "you should not remove or modify existing copyright notices").
- **Don't paste copyleft code into a permissive or source-available project.** GPL-3.0 §5(c): "You must license the entire work, as a whole, under this License"; FSF: Apache-2.0 "is not compatible with GPL version 2"; AGPL "is not compatible with GPLv2". Where a copy becomes a "work based on" the GPL code rather than an aggregate is legal interpretation; flag it and stop.
- **Don't copy code that has no licence:** it gives "no permission … to use, modify, or share" (choosealicense).
- **Don't move CC-licensed text into code**; CC BY-SA 4.0 is "one-way" compatible with GPLv3 only.
- **Don't change a repo's `LICENSE`, `license` field or headers** unless asked.

Instead: link to the source, or reimplement from the documented behaviour; record the source URL, licence and commit in the PR when copying is fine.

No safety net exists in Claude Code: its docs index (`llms.txt`) and legal page have nothing on code matching public code. GitHub Copilot's code referencing compares a suggestion and "approximately 150 characters of surrounding code with an index of public repositories", checking only "accepted, unchanged suggestions".

## [OSS-012] Community health files for a personal project: SECURITY.md, CONTRIBUTING, CODEOWNERS
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [GitHub Docs: creating a default community health file](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file), [GitHub Docs: adding a security policy](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/add-security-policy), [GitHub Docs: private vulnerability reporting for a repository](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository), [GitHub Docs: setting guidelines for contributors](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors), [GitHub Docs: about code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- Related: GH-005, DOC-012, OSS-001

For a solo-maintained public repo, in order of value:

1. **LICENSE and README** (OSS-001, DOC-012).
2. **SECURITY.md plus private vulnerability reporting.** The file "gives instructions on how to report a security vulnerability"; reporting, turned on per repo (`PUT /repos/{o}/{r}/private-vulnerability-reporting`), adds a private form, customisable with `.github/VULNERABILITY_REPORT.yml`.
3. **CONTRIBUTING.md**, only if outsiders send PRs: "When someone opens a pull request or creates an issue, they will see a link to that file."
4. **Skip CODEOWNERS.** Owners "are automatically requested for review" on PRs touching their files; with one maintainer that adds nothing, and "Require review from Code Owners" would block them, since authors can't approve their own PRs (GH-005).

**Defaults:** a public repo named `.github` supplies `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md`, `FUNDING.yml` and issue templates to every repo of that owner "that does not have its own file of that type". Locations searched: `.github/`, root, `docs/`. "You cannot create a default license file."

Tested 2026-10-18, gh 2.102.0, `gh api repos/<o>/<r>/community/profile`: the `files` object lists `code_of_conduct`, `contributing`, `issue_template`, `pull_request_template`, `license` and `readme`, not `SECURITY.md`; five of our repos scored 37 to 50.

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-18 against claude-kb, claude-skills, freek-mencke-web, osrs-tracker-web, osrs-tracker-api and osrs-tracker-aws.

1. Done 2026-10-18: each README says which paths its licence doesn't cover; osrs-tracker-web's fonts in osrs-tracker/osrs-tracker-web#360, while freek-mencke-web and this repo already did (OSS-003, OSS-009).
2. Done 2026-10-18: osrs-tracker/.github#3 adds a default `SECURITY.md` that every org repo without its own now shows as its policy; private vulnerability reporting is on for every active public repo of the org and the personal account (OSS-012). The personal account still has no `.github` repo for a default.
3. Done 2026-10-18: `actions/dependency-review-action` checks the licences of new dependencies in osrs-tracker-web and osrs-tracker-api (osrs-tracker/osrs-tracker-web#361, osrs-tracker/osrs-tracker-api#192; OSS-007, OSS-008).
4. Done 2026-10-18: the global CLAUDE.md keeps licence and copyright notices and bars pasting unlicensed or GPL/AGPL code (OSS-011).
5. **Won't do: REUSE compliance or SPDX headers in every file** (OSS-005, OSS-006). Each repo has one or two licences, which a README section and per-folder files state well enough; revisit if a repo takes in third-party code.
6. **Won't do: CODEOWNERS** (OSS-012). Solo maintainer; it would request reviews from the PR's own author.
7. **No change: GitHub shows "Other" for the Elastic-2.0 repos and this one** (OSS-004). It can't detect licences missing from choosealicense.com; the `package.json` `license` field and the README carry the SPDX ID.

## Open questions

- **Dev dependencies in GitHub's SBOM export** (OSS-008): not stated in the export page, the REST SBOM page or the dependency-graph pages.
- **`allow-licenses` with expressions** such as `(MIT OR Apache-2.0)` and `LicenseRef-clearlydefined-*` (OSS-008): the README implies they work; not run (needs a PR in a public repo).
- **npm 12's `npm sbom` output** (OSS-007): tested on npm 11.19.0 only.
- **SPDX 3.1** (OSS-005): only `v3.1-RC1` (2026-01-24) in spdx/spdx-spec's releases; whether 3.1 restores a source-file annex is unknown.
- **What CC calls NonCommercial work** (OSS-002): no CC sentence on whether BY-NC is "free culture" was found (CC FAQ grepped); CC's NC interpretation guide not read.
- **What `reuse lint` checks** and which spec version `reuse` 6.2.0 implements (OSS-006): not read or run.
- **Legal questions left open on purpose:** whether serving a bundle to browsers is distribution under MIT (OSS-010), where a GPL derivative ends and an aggregate begins (OSS-011), and what a commercial font's EULA allows (OSS-009).
