# Claude for web analytics and SEO work

Prefix `WEB`. This file covers using Claude Code for SEO and web analytics: getting Google Analytics 4, Search Console and PageSpeed data into a session, checking what a crawler sees, Anthropic's own crawlers, the SEO and GA advice that models repeat after Google retired it, published SEO skills, and what our SEO sessions cost. It is not an SEO handbook. Google's rules belong in the `/seo-audit` skill's references, cited to Google. This file holds only the rules a model is likely to get wrong from memory (WEB-022 to WEB-025).

Research basis:
- Researched 2026-10-13 against Claude Code v2.1.296 (terminal in WSL), on the Claude 5 model family.
- Four Sonnet 5.5 research subagents each took one block: Google data access, crawler view and AI bots, published skills, and retired advice. They downloaded pages with `curl` and grepped them. The lead re-checked every quote used here in those downloads.
- The baseline is `osrs-tracker-web` at `main` `9f8eadc` (2026-10-13, after #239's player link-preview cards), plus local transcripts of its SEO sessions from 2026-10-09 to 2026-10-13.
- No measurement IDs, property IDs, project numbers or key paths are copied here.

All "Last verified" dates are 2026-10-13.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| How does a session get Search Console data? | The Search Console API with a read-only service account (search performance, URL Inspection, sitemaps). The Pages report's reasons, Crawl stats and Core Web Vitals are UI-only, so the user signs in to the Playwright browser for those. Google ships no Search Console MCP server. | WEB-003, WEB-007, WEB-008 |
| Is there an official GA4 MCP server? | Yes, `googleanalytics/google-analytics-mcp` (experimental, v0.7.0, 2026-07-29). It has 9 report and list tools, uses Application Default Credentials and requests only `analytics.readonly`. Installed user-wide on 2026-10-13 with the Search Console service account as a GA4 Viewer. | WEB-006, WEB-004 |
| Does the PageSpeed Insights API work without a key? | No. Keyless calls returned 429 (quota 0) on 2026-10-10 and 2026-10-13, although the docs still say a key is optional. Field data is moving to the CrUX API, which needs a key. | WEB-010 |
| How should an agent see what Googlebot sees? | `curl` the server HTML with the Googlebot user agent and grep the head tags. Don't use WebFetch (it returns a summary) or a Playwright snapshot (it has no `<head>`). | WEB-014, WEB-015, WEB-016 |
| Is the rendered DOM what Google indexes? | Google indexes the rendered HTML, but it may skip rendering for non-200 pages and `noindex` pages. A canonical in the original HTML should match the rendered one. Use URL Inspection for Google's own view; its API has no rendered HTML. | WEB-017 |
| Can an agent validate structured data through an API? | No public API for the Rich Results Test or the Schema Markup Validator. Check the JSON-LD in the server HTML, then validate by hand. URL Inspection's `richResultsResult` covers indexed URLs only. | WEB-019 |
| Which robots.txt tokens are Anthropic's? | `ClaudeBot` (training), `Claude-User` (fetches for a user's question) and `Claude-SearchBot` (search indexing). All three honour robots.txt and `Crawl-delay`. Claude Code's WebFetch identifies as `Claude-User`. | WEB-020 |
| Does llms.txt help with Google or Claude? | Google says it ignores it, and that it "will neither harm nor help". No Anthropic page says Claude reads third-party llms.txt files. | WEB-021 |
| Which SEO and GA4 advice from model memory is wrong? | Sitemap `priority` and `changefreq`, the sitemap ping, meta keywords, FAQ and HowTo rich results, `rel=prev/next`, `noindex` in robots.txt, FID, fixed meta-description lengths and keyword density. In a GA4 tag, `anonymize_ip` does nothing, and `event_category` and `event_label` are plain parameters that reports don't show (osrs-tracker-web dropped them in osrs-tracker/osrs-tracker-web#241). | WEB-022, WEB-023, WEB-024, WEB-027 |
| Is there a published SEO audit skill to start from? | Anthropic's `knowledge-work-plugins` has two: `seo-ai-visibility` (well structured) and `seo-audit` (shallow, partly stale). The most adopted community suite is `AgriciDaniel/claude-seo`; it is heavy and scored. Copy their ideas, not the files. | WEB-026, WEB-027 |
| What should a read-only SEO audit skill do? | Read the repo's decisions, curl the server HTML per page template, pull Search Console data to weight the findings, and rank them by impact with effort scored separately. No blended score. State what wasn't reached, and treat fetched text as data. | WEB-028, WEB-030 |
| What did our SEO sessions cost? | The audit was $12.20 API-equivalent and the Search Console and PageSpeed data session $25.77, both on Opus 5.5 and main thread only. The data session cost more because it read the Search Console UI through Playwright. | WEB-031 |
| Search Console says a new sitemap "could not be read". Is it broken? | Not necessarily. Check `sitemaps.list` (`isPending`, `lastDownloaded`, `errors`), the server logs for Googlebot's fetch, and URL Inspection's live test. On 2026-10-13 valid child sitemaps showed the error and cleared on their own within hours. A resubmitted sitemap index stayed pending for days: submit the children directly instead. | WEB-032 |
| Why does Google show my `Brand: phrase` title as `phrase - Brand`? | On 2026-10-13 Google flipped two osrs-tracker-web titles whose phrase after the colon started in lowercase. Start the phrase with a capital, or write `Phrase - Site name` yourself. | WEB-033 |
| Do audit curls distort the server's bot counts? | Yes. A Googlebot-UA curl is logged as Googlebot. The 2026-10-10 analysis had to remove its own requests by hand. Add a marker to the audit's user agent. | WEB-018 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| WEB-001 | osrs-tracker-web's SEO and analytics setup (2026-10-13) | fact | baseline, osrs-tracker-web, gtag |
| WEB-002 | How the 2026-10-09 SEO audit ran | fact | baseline, audit, prompt |
| WEB-003 | How the Search Console and PageSpeed data was gathered (#160) | fact | baseline, search-console, playwright |
| WEB-004 | Google credentials live outside the repo, and auto mode guards them | fact | credentials, auto-mode, our-setup |
| WEB-005 | Anti-pattern: SEO answers from memory and offers of data the session can't reach | anti-pattern | memory, hallucination, indexnow |
| WEB-006 | The official Google Analytics MCP server | tool | ga4, mcp, read-only |
| WEB-007 | Search Console: the API, its quotas, and no official MCP server | tool | search-console, api, mcp, quotas |
| WEB-008 | What the Search Console API can't give you | fact | search-console, url-inspection, ui |
| WEB-009 | GA4 Data API quotas and the BigQuery exports | fact | ga4, api, bigquery, quotas |
| WEB-010 | PageSpeed Insights needs a key; field data moves to CrUX | fact | pagespeed, crux, core-web-vitals |
| WEB-011 | Lab audits: Lighthouse CLI and Chrome DevTools MCP | tool | lighthouse, chrome-devtools-mcp, lab |
| WEB-012 | Read-only scopes and project-scoped config for Google data | recommendation | credentials, scopes, mcp-json |
| WEB-013 | Which source answers which SEO question | comparison | data-sources, search-console, ga4, logs |
| WEB-014 | Judge pages by the server HTML: curl and grep the head | pattern | curl, ssr, crawler-view, tokens |
| WEB-015 | A Playwright snapshot has no `<head>` (tested) | fact | playwright, snapshot, crawler-view |
| WEB-016 | WebFetch and the API web fetch tool are wrong for SEO checks | anti-pattern | webfetch, web-fetch-tool, claude-user |
| WEB-017 | What Google renders and indexes | fact | rendering, javascript, canonical, noindex |
| WEB-018 | Audit requests show up as bots in the server logs | fact | logs, user-agent, measurement |
| WEB-019 | Structured data has no validation API | fact | structured-data, json-ld, validator |
| WEB-020 | Anthropic's three crawlers and their robots.txt tokens | fact | crawlers, robots-txt, claude-user |
| WEB-021 | llms.txt and AI search features | fact | llms-txt, ai-overviews, geo |
| WEB-022 | Retired crawl and indexing advice models still give | anti-pattern | stale-advice, sitemaps, robots-txt |
| WEB-023 | Retired rich results, metrics and tools | anti-pattern | stale-advice, structured-data, core-web-vitals |
| WEB-024 | Universal Analytics habits in a GA4 tag | anti-pattern | ga4, gtag, stale-advice |
| WEB-025 | GA4 consent mode and data retention | fact | ga4, consent-mode, retention |
| WEB-026 | Anthropic's official SEO skills | tool | official-example, skills, seo-audit |
| WEB-027 | Community SEO skills and agents | comparison | community, skills, agents |
| WEB-028 | What a read-only SEO audit skill should do | recommendation | seo-audit, skill-design, read-only |
| WEB-029 | One audit finding: evidence, impact, effort, fix | pattern | findings, output, severity |
| WEB-030 | Let search data order the fixes | pattern | search-console, prioritising |
| WEB-031 | What our SEO sessions cost (measured) | fact | cost, measurement, opus |
| WEB-032 | A fresh sitemap's "could not be read" cleared on its own; a resubmitted index stayed pending | fact | search-console, sitemaps, sitemap-index, logs |
| WEB-033 | Google rewrote `Brand: phrase` titles whose phrase starts in lowercase | fact | title-links, titles, search-results |
| WEB-034 | A consent banner rendered after hydration became the LCP element | fact | core-web-vitals, lcp, consent, ssr |

## [WEB-001] osrs-tracker-web's SEO and analytics setup (2026-10-13)
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: osrs-tracker-web `main` at `9f8eadc` (`src/index.html`, `src/app/common/seo/`, `src/app/common/analytics/`, `public/robots.txt`, `docs/decisions.md`), [osrs-tracker/osrs-tracker-web#239](https://github.com/osrs-tracker/osrs-tracker-web/pull/239), [osrs-tracker/osrs-tracker-web#159](https://github.com/osrs-tracker/osrs-tracker-web/issues/159)
- Related: WEB-002, WEB-024, WEB-034, REPO-001

The baseline every other entry is measured against. It was read from `main` after the player link-preview cards merged on 2026-10-13.

**SEO**
- Angular SSR with `RenderMode.Server` on every route.
- `PageMetaStrategy` (`common/seo/`) sets the title, description, canonical, Open Graph and `twitter:card` tags, and one JSON-LD `@graph` per page, from the deepest route's `data['meta']`. The structured data is `WebSite` on Home, `BreadcrumbList`, and a `WebPage` about a `Thing`.
- Sitemaps:
  - Items and players are built by the server from the API.
  - The site sitemap and the index are generated at build time, with dates from git.
  - None of them has `priority` or `changefreq`.
- `robots.txt` allows everything and names the sitemap.
- Link-preview cards (1200×630) are drawn by the server: items at `/og/item/:id.png` since #218, players at `/og/player/:username.png` since #239 (kept an hour).
- Server requests send `User-Agent: github:osrs-tracker/osrs-tracker-web`.

**Analytics** (changed after the baseline commit, on 2026-10-13)
- gtag.js loads only after the visitor allows it, from a consent banner (#248). A stored choice sets consent mode's default in `index.html` before the tag. WEB-034 covers the banner's LCP cost.
- `AnalyticsService` sends `page_view` on every `NavigationEnd`, events with named parameters (#241, WEB-024), and `exception` events.
- At `9f8eadc` it still loaded gtag for everyone, with `anonymize_ip` and Universal Analytics fields, and no consent calls.

The SEO roadmap (#159, 15 children) closed on 2026-10-10.

## [WEB-002] How the 2026-10-09 SEO audit ran
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: local transcript of the `seo-audit-report` worktree session (2026-10-09), [osrs-tracker/osrs-tracker-web#159](https://github.com/osrs-tracker/osrs-tracker-web/issues/159)
- Related: WEB-014, WEB-028, WEB-031, FLOW-014

The audit was one Opus 5.5 session driven by a long prompt the user wrote. That prompt is the best draft of an `/seo-audit` skill we have.

**The prompt**
- "Do not change any files; this is a read-only audit that ends in a report."
- Load the repo skill, CLAUDE.md and `docs/decisions.md`, and don't report the deliberate trade-offs as findings.
- "Judge each page by the HTML the server sends, not by what appears after hydration."
- Pages listed in priority order.
- Nine areas to check (metadata, canonicals, social tags, structured data, status codes, sitemaps and robots, links, server-rendered content, performance), with file:line for every finding.

**What it did**
- It built and served the app, then wrote a `probe.sh` that curls each path with a normal user agent and with Googlebot's. Per page it records status, time, size, title, description, canonical, h1 count, `og:` count and JSON-LD count, against local and production.
- It used Playwright only for LCP, through a `PerformanceObserver` in `browser_evaluate`.
- It read logs through the flux MCP server.

**The report** was a findings table (finding, location, evidence, impact, effort, fix), the top 5 changes, what it couldn't verify, and decisions worth revisiting. On request, it became roadmap #159 with one issue per finding, each written so a fresh session can start from the issue alone.

## [WEB-003] How the Search Console and PageSpeed data was gathered (#160)
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: local transcript of the `roadmap-skill-location` worktree session (2026-10-10), [#160 results comment](https://github.com/osrs-tracker/osrs-tracker-web/issues/159#issuecomment-6098227235), osrs-tracker-web auto memory `search-console-pagespeed-access`
- Related: WEB-007, WEB-008, WEB-010, WEB-030, WEB-031

Issue #160 collected the data the audit couldn't see.

**How the data was reached**
1. The user signed in to Search Console in the Playwright MCP browser, and the session read the reports there: 13 navigations, 27 `browser_evaluate` and 17 clicks.
2. Lab scores came from pagespeed.web.dev in the same browser, because the keyless PSI API returned 429.
3. Mid-session the user set up a PSI API key and a Search Console service account (a Restricted user, read-only). The session then redid #160 through the API.
4. Server logs came from Loki, run with the admin identity: the session predates the read-only `claude-agent` identity. Since 2026-10-13 that identity can query Loki too (INFRA-024).

**What the data changed.** It reordered the roadmap:
- Item pages were 91% of search impressions and 98% of indexed pages.
- 3,566 item pages had never been crawled.
- Duplicates weren't reported at all, so the canonical fixes were demoted to housekeeping.

The access notes ended up in the repo's auto memory, not in the repo (WEB-004). They are machine-specific, so a cloud session doesn't have them.

## [WEB-004] Google credentials live outside the repo, and auto mode guards them
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: osrs-tracker-web auto memory `search-console-pagespeed-access` and this session's denied tool call, read 2026-10-13; [Auto mode](https://code.claude.com/docs/en/permission-modes)
- Related: WEB-012, INFRA-021, INFRA-024, REPO-036

**Where they are**
- The Search Console service-account key and a `query.sh` wrapper (`sites`, `analytics`, `inspect`, `sitemaps`) sit in a folder under `~/.config`.
- The PSI key sits in another folder under `~/.config`.
- The memory says to read the key from the file and never print it. `$PSI_API_KEY` is exported after `~/.bashrc`'s non-interactive `return`, so it is unset in Claude's shell.

Tested 2026-10-13, v2.1.296, desktop Code tab on WSL in auto mode: `ls` of those folders plus `sed` of `query.sh` (with private-key lines filtered out) was denied as "[Credential Exploration]". Auto mode treats looking around a credentials folder as a risk even when the command filters out the key. A skill should call the wrapper rather than read the folder.

The GA4 MCP server (WEB-006) uses the same Search Console key, so one read-only key now covers both properties.

**What follows:**
- Only the local machine can read Google data. Cloud sessions and routines have neither the files nor the memory.
- The service account is read-only, so a session can't submit a sitemap. The user does that in the UI.

## [WEB-005] Anti-pattern: SEO answers from memory and offers of data the session can't reach
- Type: anti-pattern
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: local transcript of the `indexnow-evaluation` worktree session (2026-10-11), in [osrs-tracker-web](https://github.com/osrs-tracker/osrs-tracker-web)
- Related: WEB-006, WEB-022, PROMPT-012

Asked whether IndexNow was worth adding, an Opus 5.5 session answered in four turns with one Bash call and no search.
- Its claims were plausible but unsourced: "Google doesn't", "It tested IndexNow in 2021 and never adopted it", and which engines use Bing's index.
- It ended: "I can look up Bing's referral share in our analytics". No session had GA4 access then. Since 2026-10-13 sessions on this machine do (WEB-006).

The recommendation itself was sensible (check Bing Webmaster Tools first). The fault is that facts were stated without sources and access was claimed that didn't exist.

**What to do instead:** an SEO skill or brief should:
- tell the model to check Google's current docs before stating a rule (WEB-022 to WEB-024 list what changed);
- list which data sources this session can actually reach.

## [WEB-006] The official Google Analytics MCP server
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-13
- Sources: [googleanalytics/google-analytics-mcp README](https://raw.githubusercontent.com/googleanalytics/google-analytics-mcp/main/README.md), [client.py](https://raw.githubusercontent.com/googleanalytics/google-analytics-mcp/main/analytics_mcp/tools/client.py), [PyPI analytics-mcp](https://pypi.org/project/analytics-mcp/)
- Related: WEB-004, WEB-009, WEB-012, INFRA-003, TOK-020

**What it is**
- Google's own server. The README title is "Google Analytics MCP Server (Experimental)".
- PyPI `analytics-mcp` 0.7.0, uploaded 2026-07-29. 0.7.0's release notes add a Claude Code section.

**Tools**
- The README lists 7: `get_account_summaries`, `get_property_details`, `list_google_ads_links`, `run_report`, `run_funnel_report`, `get_custom_dimensions_and_metrics` and `run_realtime_report`.
- The source registers 2 more: `list_property_annotations` (uses an alpha Admin client) and `run_conversions_report`.
- The researcher found no write calls; it didn't read every line.

**Auth.** Application Default Credentials. "Credentials must include the Google Analytics read-only scope: `https://www.googleapis.com/auth/analytics.readonly`". It needs the Admin API and the Data API enabled in a Cloud project.

**Install** (README):
```bash
claude mcp add analytics-mcp --scope user \
  -e "GOOGLE_APPLICATION_CREDENTIALS=PATH_TO_CREDENTIALS_JSON" \
  -e "GOOGLE_PROJECT_ID=YOUR_PROJECT_ID" \
  -- pipx run analytics-mcp
```

The size of its tool schemas isn't stated. With tool search on (the default), only tool names load at session start (TOK-020).

**No gcloud needed.** `client.py` calls `google.auth.default(scopes=[_READ_ONLY_ANALYTICS_SCOPE])` and reads no other settings. So `GOOGLE_APPLICATION_CREDENTIALS` pointing at a service-account key is enough. `uvx analytics-mcp@0.7.0` works in place of pipx, and pins the version.

**Ours** (2026-10-13):
- Registered at user scope with `uvx analytics-mcp@0.7.0`.
- It uses the Search Console service account's key; the account was added as a Viewer on the property.
- The Admin and Data APIs are enabled in that account's project.
- Auto mode denied registering it as "[Credential Exploration]" until the user asked for it explicitly.

Tested 2026-10-13, v2.1.296, `claude -p` on Haiku 5.5 (capped at 4 turns, $0.20): `get_account_summaries` returned 1 account and 1 property, and `get_custom_dimensions_and_metrics` returned one custom dimension (`description`).

## [WEB-007] Search Console: the API, its quotas, and no official MCP server
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Search Console API limits](https://developers.google.com/webmaster-tools/limits), [searchanalytics.query](https://developers.google.com/webmaster-tools/v1/searchanalytics/query), [Getting all your data](https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data), [Authorizing requests](https://developers.google.com/webmaster-tools/v1/how-tos/authorizing), [AminForou/mcp-gsc](https://github.com/AminForou/mcp-gsc)
- Related: WEB-008, WEB-012, WEB-013

**No official MCP server.** Google ships none. The researcher searched the `google`, `googleapis`, `googleanalytics`, `GoogleChrome` and `googleads` GitHub orgs, and ran one web search.

**API facts**

| Item | Value |
|---|---|
| Scopes | `webmasters.readonly` "Read-only access", `webmasters` "Read/write access" |
| Rows per request | "Valid range is 1–25,000; Default is 1,000", paged with `startRow` |
| Rows per day | "a maximum of 50K rows of data per day per search type" |
| Search Analytics quota | 1,200 QPM per site and per user |
| URL Inspection quota | 2,000 QPD and 600 QPM per site |
| Freshness | `dataState` `all` includes fresh data; `final` or omitted gives finalized data only |

The 16-month retention is stated only on a GA help page ("Search Console keeps data for the last 16 months").

**Community servers.** The most-starred is `AminForou/mcp-gsc` (1,913 stars, v0.4.1). It requests the read/write `webmasters` scope, includes sitemap submit and delete, and keeps destructive tools behind `GSC_ALLOW_DESTRUCTIVE=false`.

**For us:** our read-only service account plus a small wrapper (WEB-004) is simpler than an MCP server and can't write.

## [WEB-008] What the Search Console API can't give you
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: [urlInspection.index.inspect](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect), [URL Inspection tool help](https://support.google.com/webmasters/answer/9012289), osrs-tracker-web auto memory `search-console-pagespeed-access`
- Related: WEB-003, WEB-007, WEB-017

**Missing from the API.** Our 2026-10-10 notes found these are UI-only:
- the Pages report's reason counts ("Discovered – currently not indexed" and the rest);
- Crawl stats;
- Core Web Vitals.

The API covers search performance, URL Inspection and sitemaps. The read-only service account also can't submit a sitemap.

**URL Inspection limits** (official):
- "Presently only the status of the version in the Google index is available; you cannot test the indexability of a live URL."
- The response has no rendered-HTML or screenshot field. "A screenshot of the rendered page is available only in a live test" in the UI.

**The API and the UI can disagree.** On 2026-10-10 the API called `/trackers/price/4151` "URL is unknown to Google" where the UI said "Discovered – currently not indexed".

**So an audit needs both:** the API for numbers it can script, and a signed-in browser for the reports the API lacks. In the browser, set rows per page to 500 to read the drilldowns. URL Inspection has no deep link; type the URL into the search box.

## [WEB-009] GA4 Data API quotas and the BigQuery exports
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Data API quotas](https://developers.google.com/analytics/devguides/reporting/data/v1/quotas), [runReport](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport), [BigQuery Export limits](https://support.google.com/analytics/answer/9358801), [Search Console bulk export](https://support.google.com/webmasters/answer/12917675)
- Related: WEB-006, WEB-013

**Data API quotas.** Standard property limits, with Analytics 360 in brackets:

| Quota | Limit |
|---|---|
| Core tokens per property per day | 200,000 (2,000,000) |
| Core tokens per property per hour | 40,000 (400,000) |
| Core tokens per project per property per hour | 14,000 |
| Concurrent requests per property | 10 |

"All daily quotas are refreshed at midnight Pacific Standard Time". A few reports a day from one session won't come close.

**Scope.** `runReport` accepts `analytics.readonly` or `analytics`.

**BigQuery exports**
- GA4: "Standard properties have a daily BigQuery Export limit of 1 million events."
- Search Console bulk export: grant its system service account BigQuery Job User and Data Editor. "The first export will happen up to 48 hours after your successful configuration".

**When to use them:** for questions that need SQL over months of rows. A session would then need BigQuery read access too. For a site our size, the Data API through the MCP server is enough.

## [WEB-010] PageSpeed Insights needs a key; field data moves to CrUX
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [PSI API get started](https://developers.google.com/speed/docs/insights/v5/get-started), [CrUX API](https://developer.chrome.com/docs/crux/api), [CrUX History API](https://developer.chrome.com/docs/crux/history-api), [CrUX methodology](https://developer.chrome.com/docs/crux/methodology)
- Related: WEB-003, WEB-011

**The PSI API in practice needs a key.**
- The docs say: "The API can be used with or without an API key, although a key is recommended for frequent, automated queries."
- Tested 2026-10-13 with `curl` of `runPagespeed` and no key: HTTP 429, "Quota exceeded for quota metric 'Queries' and limit 'Queries per day'". A 2026-10-10 session got the same.
- Trust the behaviour: get a key.

**Field data is leaving PSI.** The same page: "We plan to discontinue including real-world data from the Chrome User Experience Report in this API. We recommend the CrUX API … or the CrUX History API".

**The CrUX API**
- "requires a Google Cloud API key".
- "limited to 150 queries per minute per Google Cloud project, which is offered without charge". The History API shares that quota.
- Small sites have no field data: pages must be "sufficiently popular", and "An exact number is not disclosed".

osrs-tracker-web has no field data in Search Console or PSI (#160), so for us only lab runs are available.

## [WEB-011] Lab audits: Lighthouse CLI and Chrome DevTools MCP
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-13
- Sources: [Lighthouse readme](https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/readme.md), [chrome-devtools-mcp tool reference](https://raw.githubusercontent.com/ChromeDevTools/chrome-devtools-mcp/main/docs/tool-reference.md), [chrome-devtools-mcp README](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- Related: WEB-010, WEB-014, FLOW-014, SURF-032

**Lighthouse CLI** (v13.5.0, 2026-09-18)
- "Lighthouse requires Node 22 (LTS) or later" and a local Chrome.
- `lighthouse <url> --only-categories=seo,performance --output=json --output-path=stdout --chrome-flags="--headless"` gives JSON that `jq` can cut down before it reaches the context.
- The SEO category checks crawlability, title, description, HTTP status, link text, crawlable anchors, robots.txt, image alt, hreflang and canonical. Structured data is a manual audit with no weight.
- `main` also defines an `agentic-browsing` category with an `llms-txt` audit. Not checked whether 13.5.0 can select it.
- Not installed on this machine.

**Chrome DevTools MCP** (v1.10.1, 2026-09-23)
- `lighthouse_audit`: "Get Lighthouse score and reports for accessibility, SEO, best practices, and agentic browsing. This excludes performance."
- For performance: `performance_start_trace`, `performance_stop_trace` and `performance_analyze_insight` (e.g. `LCPBreakdown`).
- `emulate` sets the user agent and network conditions.
- Flags: `--headless` and `--isolated` (a temporary profile).
- Its performance tools "may send trace URLs to the Google CrUX API".

**When to use which.** The 2026-10-09 audit measured LCP with a `PerformanceObserver` through Playwright instead (WEB-002). Both tools are cheaper per question than reading pagespeed.web.dev through a browser. Prefer the CLI with `jq` when the JSON is large (INFRA-007).

## [WEB-012] Read-only scopes and project-scoped config for Google data
- Type: recommendation
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Claude Code MCP](https://code.claude.com/docs/en/mcp), [Search Console authorizing](https://developers.google.com/webmaster-tools/v1/how-tos/authorizing), [GA MCP README](https://raw.githubusercontent.com/googleanalytics/google-analytics-mcp/main/README.md)
- Related: WEB-004, WEB-006, WEB-007, INFRA-001, INFRA-006, INFRA-021

**The credential is what keeps it read-only.** As INFRA-006 says for AWS and Kubernetes, the credential's own permission is the only control that binds every path: an MCP server's read-only flag does not.

| Data | Scope | Identity |
|---|---|---|
| Search Console | `webmasters.readonly` | A service account added as a Restricted user (ours, 2026-10-10). Google's docs don't say which permission a service account needs; mcp-gsc's README says Full. |
| GA4 | `analytics.readonly` | ADC from your own login, or impersonating a service account (the GA MCP README's two routes) |
| PSI and CrUX | API key restricted to those APIs | The project's key |

**Config**
- For one repo, put the server in `.mcp.json` (`--scope project`, shared through git).
- Pass paths as `${VAR}`, which Claude Code expands in `command`, `args`, `env`, `url` and `headers`. That way neither a path nor a secret is committed. (An inference from the docs; not tested.)
- "Claude Code prompts for approval in interactive sessions before using project-scoped servers from `.mcp.json` files."
- Keep key files outside the repo, never print them, and don't paste API responses that contain project numbers into issues (REPO-036).

## [WEB-013] Which source answers which SEO question
- Type: comparison
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: synthesis of WEB-003, WEB-007 to WEB-011, WEB-014 and the [#160 results comment](https://github.com/osrs-tracker/osrs-tracker-web/issues/159#issuecomment-6098227235)
- Related: WEB-028, WEB-030, INFRA-018, INFRA-024

| Question | Source | Route from a session |
|---|---|---|
| What does the server send? | Server HTML | `curl` with the Googlebot UA (WEB-014) |
| Does the page work after hydration? | Rendered DOM | Playwright `browser_evaluate` |
| Is it indexed, and why not? | Pages report, URL Inspection | UI in a signed-in browser; the API for single URLs (WEB-008) |
| Which pages and queries get impressions and clicks? | Search Analytics | Search Console API (WEB-007) |
| How often does Google crawl, and how fast do we answer? | Crawl stats, server logs | UI; Loki through `kubectl get --raw` on the gateway's service proxy, filtered by user agent (since 2026-10-13; INFRA-024). Pod logs cover the current pods only |
| Which bots actually come? | Server logs | Loki from the session, e.g. `sum(count_over_time({namespace="osrs-tracker"} \|= "ClaudeBot" [30d]))` through `kubectl get --raw '.../loki-gateway:80/proxy/loki/api/v1/query?query=...'` (INFRA-024). In #160: Amazonbot 609 requests, Googlebot about 22 item pages in 21 h. 2026-10-13, over the logs held (from 2026-10-05): Googlebot 3,780 lines, ClaudeBot 63, no `Claude-User` or `Claude-SearchBot` |
| Lab LCP, TBT, CLS | Lighthouse | CLI, DevTools MCP, PSI with a key (WEB-010, WEB-011) |
| Field Core Web Vitals | CrUX | CrUX API; none for low-traffic sites |
| What do visitors do on the page, where do they come from? | GA4 | GA MCP server (WEB-006), set up 2026-10-13 |

**What the data showed for us.** Search Console and the logs changed the priorities. The code audit alone ranked duplicate URLs high; the data showed crawling and click-through were the problems (WEB-030).

## [WEB-014] Judge pages by the server HTML: curl and grep the head
- Type: pattern
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: [Google common crawlers](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers), [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies), WEB-002's `probe.sh`
- Related: WEB-015, WEB-016, WEB-018, TOK-089

**Fetch the server's HTML with curl, then grep only the SEO fields out of it.** The page itself never needs to enter the context.

Measured 2026-10-13 on production with a Googlebot UA:

| Page | HTML | Title, description, canonical, og/twitter, JSON-LD, h1 |
|---|---|---|
| `/` | 82,895 B | 1,431 B |
| `/trackers/price/4151` | 47,154 B | 2,032 B |
| `/trackers/xp/the%20fraking` | 145,047 B | 1,970 B |

**The user agent**
- Googlebot Smartphone's UA is the Nexus 5X string with `Chrome/W.X.Y.Z`, where "The string Chrome/W.X.Y.Z … is a placeholder". Any recent version works.
- Sending it to look is fine. Cloaking is serving different content "with the intent to manipulate search rankings and mislead users".
- A spoofed UA can't reproduce IP-based allowlists or bot protection.

**Run it twice:**
- against a local production build, to tie findings to code;
- against production, to catch caching and proxy differences.

Record per page: status, time, bytes, title, description, canonical, h1 count, `og:` count and JSON-LD count. WEB-002's `probe.sh` does exactly this in 20 lines.

## [WEB-015] A Playwright snapshot has no `<head>` (tested)
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-13
- Sources: [microsoft/playwright-mcp README](https://github.com/microsoft/playwright-mcp)
- Related: WEB-014, FLOW-014, REPO-021

Playwright MCP's `browser_snapshot` is an accessibility tree: "Capture accessibility snapshot of the current page". So it shows links and headings, but none of the head tags SEO depends on.

Tested 2026-10-13, Playwright MCP from the official plugin (`@playwright/mcp@latest`), v2.1.296, WSL: `browser_navigate` to `/trackers/price/4151`.
- The navigate result carried only the URL and page title. The snapshot went to a 6,512-byte `.yml` file in the working directory, not into the context.
- The file had 0 lines matching `canonical`, `description`, `og:` or `ld+json`.
- Delete that `.playwright-mcp/` folder afterwards: it lands in the repo.

**What it is still good for**
- The rendered DOM: `browser_evaluate` with `document.head.outerHTML` or a `querySelectorAll('script[type="application/ld+json"]')` (not tested here).
- LCP through `PerformanceObserver` (WEB-002).
- Reading Search Console's UI after the user signs in (WEB-003).

**Other tools for raw HTML.** `browser_network_request` "Returns full details (headers and body)". The README itself steers coding agents to the Playwright CLI with skills as more token-efficient.

## [WEB-016] WebFetch and the API web fetch tool are wrong for SEO checks
- Type: anti-pattern
- Applies to: Claude Code, Claude API
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Tools reference](https://code.claude.com/docs/en/tools-reference), [Claude Code CHANGELOG 2.1.83](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md), [Web fetch tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool)
- Related: TOK-087, TOK-089, WEB-014, WEB-020

**Claude Code's WebFetch**
- It converts the page to Markdown and answers through a second model. The docs call it "lossy by design … use `curl` via Bash for the unprocessed page".
- It doesn't report the status code, headers, head tags or JSON-LD. An audit can't trust it for any of them.
- It identifies itself: "WebFetch sets a `User-Agent` header beginning with `Claude-User`". The 2.1.83 changelog says: "Improved `WebFetch` to identify as `Claude-User` so site operators can recognize and allowlist Claude Code traffic via `robots.txt`".
- Whether it obeys a `Disallow` isn't documented.

**The API web fetch tool**
- "currently does not support websites dynamically rendered with JavaScript".
- Responses come from a cache by default. `use_cache: false` needs `web_fetch_20260309` or later.
- It lists `robots.txt` among the reasons for a `url_not_allowed` error.

**So:** neither shows what a crawler gets. Use them only to read documentation, not to inspect the page under test. Community skills say the same: "it is never the acquisition path" (WEB-027).

## [WEB-017] What Google renders and indexes
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [Dynamic rendering](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering), [Search Central documentation updates](https://developers.google.com/search/updates)
- Related: WEB-008, WEB-014, WEB-022

**How Google renders**
- "Googlebot queues all pages with a 200 HTTP status code for rendering, unless a robots meta tag or header tells Google not to index the page."
- "Google also uses the rendered HTML to index the page."
- "If the HTTP status code is non-200 (for example, on error pages with 404 status code), rendering might be skipped."

**What that means for an SSR site**
- A not-found page must carry its content and its status in the server HTML.
- A `noindex` that JavaScript removes may still apply. The 2025-12-15 docs update says: "If there's a possibility that you do want the page indexed, don't use a noindex tag in the original page code."
- Canonicals (2025-12-17 update): set the same canonical in the original HTML as in the rendered page, or leave it out of the original HTML. An audit should compare the curl result with the rendered DOM for these two tags.

**Checking Google's own view.** "use the Rich Results Test or the URL Inspection Tool and look at the rendered HTML". Neither has an API that returns it (WEB-008, WEB-019).

**Dynamic rendering** "is a workaround and not a recommended solution". Google recommends server-side rendering, static rendering or hydration.

## [WEB-018] Audit requests show up as bots in the server logs
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: osrs-tracker-web server logs read through the flux MCP server (2026-10-13), [#160 results comment](https://github.com/osrs-tracker/osrs-tracker-web/issues/159#issuecomment-6098227235)
- Related: WEB-013, WEB-014, INFRA-018

The server logs each request's user agent. So an audit's Googlebot-UA curls are logged as Googlebot visits.

Tested 2026-10-13: three Googlebot-UA curls from this session showed up in production's `incoming` log as `"userAgent":"Mozilla/5.0 (compatible; Googlebot/2.1; …)"`. The `clientIp` was the proxy's, not ours.

The #160 log analysis counted "Googlebot ~22 item pages (about one an hour; the audit's own Googlebot-UA curls excluded)". That exclusion was done by hand, from the session's own timestamps.

**Fix:** add a marker to the audit's user agent, e.g. append `seo-audit` to the Googlebot string. It still matches a server's `Googlebot` check, and a log query can drop it. Real Googlebot is verified by reverse DNS, not by UA ("The HTTP user agent string can be spoofed").

The same applies to `/trackers/*` render timings: audit fetches are cache misses and count in the p90.

## [WEB-019] Structured data has no validation API
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: [schemaorg discussion #3261](https://github.com/schemaorg/schemaorg/discussions/3261), [urlInspection.index.inspect](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect), [Search Console API reference](https://developers.google.com/webmaster-tools/v1/api_reference_index)
- Related: WEB-017, WEB-023

**No API for either validator.**
- **Rich Results Test:** no public API found. The researcher checked the Search Console API reference (Search Analytics, Sitemaps, Sites, URL Inspection), the URL Inspection pages, the Rich Results Test help page and one search. That's absence of evidence, not proof.
- **Schema Markup Validator:** a schema.org maintainer wrote, "Do not try to scrape validator.schema.org - it is a service run and hosted by Google … There are no resources or plans for Google to make an API."

**The closest official option.** URL Inspection's `richResultsResult`, for URLs already in the index of a property you own.

**So an audit:**
1. extracts the JSON-LD from the curl output (one `<script type="application/ld+json">` per page on osrs-tracker-web);
2. checks it against Google's docs for the types it uses;
3. lists the Rich Results Test as a manual step for the user.

Community skills point out that curl misses JSON-LD that JavaScript injects (WEB-027). On an SSR site, a difference between the curl result and the rendered DOM is itself a finding.

## [WEB-020] Anthropic's three crawlers and their robots.txt tokens
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Does Anthropic crawl data from the web?](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler), [Tools reference](https://code.claude.com/docs/en/tools-reference)
- Related: WEB-016, WEB-021

The support article (modified 2026-04-07): "Below is information on the three robots that Anthropic uses".

| Token | What it does | Blocking it |
|---|---|---|
| `ClaudeBot` | Collects content that could go into training | Excludes the site's future content from training |
| `Claude-User` | Fetches pages when a person asks Claude | "may reduce your site's visibility for user-directed web search" |
| `Claude-SearchBot` | Indexes for search quality | May reduce visibility and accuracy in Claude's search results |

**What all three do**
- "Anthropic's Bots respect “do not crawl” signals by honoring industry standard directives in robots.txt".
- They support "the non-standard Crawl-delay extension".
- They don't bypass CAPTCHAs.

**Details**
- Anthropic publishes its IP ranges at `claude.com/crawling/bots.json`, but discourages IP blocking because it hides robots.txt from the bots.
- `anthropic-ai` and `Claude-Web` no longer appear on the page.
- Claude Code's WebFetch is `Claude-User` (WEB-016).

**For us:** osrs-tracker-web's `robots.txt` allows every bot. A 2026-10-13 grep of 24 h of pod logs found no Claude bot requests; the pods had been up only since that morning's deploy.

## [WEB-021] llms.txt and AI search features
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features), [Google's AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [llmstxt.org](https://llmstxt.org/)
- Related: WEB-020, TOK-090

**What llms.txt is.** A proposal "to provide LLM-friendly content" in a Markdown file at `/llms.txt`. Anthropic publishes one for its own docs (TOK-090).

**Google's position**
- AI Overviews and AI Mode have "no additional requirements … nor other special optimizations necessary".
- "You don't need to create new machine readable files, AI text files, or markup to appear in these features."
- The AI optimization guide (added 2026-05-15; the llms.txt clarification on 2026-06-15) says such files "will neither harm nor help your site's visibility or rankings in Google Search, as Google Search ignores them".
- What counts: a page "must be indexed and eligible to be shown in Google Search with a snippet", and crawling must be allowed.

**Anthropic's position.** No Anthropic page says Claude reads llms.txt files on third-party sites. The researcher checked the crawler article, the web search and web fetch tool pages, and the Claude Code docs dump. So treat any claim that it does as unverified.

**For an audit:** don't recommend llms.txt as an SEO fix. Visibility in Claude's answers depends on the robots rules for `Claude-User` and `Claude-SearchBot` (WEB-020). Lighthouse's `agentic-browsing` category does check for llms.txt (WEB-011), so it may show up as a "failed" check. It has no effect on search ranking.

## [WEB-022] Retired crawl and indexing advice models still give
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Build a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Sitemaps ping deprecation](https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping), [Special tags](https://developers.google.com/search/docs/crawling-indexing/special-tags), [robots.txt spec](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt), [Block indexing](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [Canonicalization](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [Snippets](https://developers.google.com/search/docs/appearance/snippet)
- Related: WEB-005, WEB-023, WEB-027

| Advice | Google now |
|---|---|
| Set sitemap `priority`, `changefreq` | "Google ignores <priority> and <changefreq> values." `lastmod` is used if "consistently and verifiably … accurate". |
| Ping Google with the sitemap | "The sitemaps ping endpoint deprecation is complete." (2023-06-26 post) |
| Add meta keywords | "not used by Google Search, and it has no effect on indexing and ranking at all" |
| `rel=prev/next` for pagination | "Google no longer uses these HTML <link> tags" |
| `noindex` in robots.txt | "not supported by Google" (retired 2019-09-01) |
| `crawl-delay` for Googlebot | "other fields such as crawl-delay aren't supported" |
| Canonicalize through robots.txt | "Don't use the robots.txt file for canonicalization purposes." Redirects and `rel=canonical` are "strong" signals, sitemap inclusion "weak". |
| Meta description of 150–160 characters, title under 60 | "There's no limit on how long a meta description can be"; titles are truncated "to fit the device width" |

Sitemap limits still stand: "50MB (uncompressed) or 50,000 URLs".

osrs-tracker-web dropped `priority` and `changefreq` on 2026-10-10 (#166). The audit that found them knew the rule. The community agents in WEB-027 still teach the opposite.

## [WEB-023] Retired rich results, metrics and tools
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Search Central documentation updates](https://developers.google.com/search/updates), [FAQ and HowTo changes](https://developers.google.com/search/blog/2023/08/howto-faq-changes), [Simplifying the search results page](https://developers.google.com/search/blog/2025/06/simplifying-search-results), [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals), [Mobile-first indexing has landed](https://developers.google.com/search/blog/2023/10/mobile-first-is-here)
- Related: WEB-019, WEB-022, WEB-027

**Structured data**
- **HowTo:** "now deprecated" (2023-09-13); its documentation was removed 2023-09-14.
- **FAQ:** limited to government and health sites in 2023. Then "This feature will no longer appear in Google Search starting May 7, 2026", and its documentation was removed 2026-06-15.
- **The 2025-06-12 simplification** dropped Book Actions, Course Info, Claim Review, Estimated Salary, Learning Video, Special Announcement and Vehicle Listing: "This update won't affect how pages are ranked." Book Actions' docs stayed, because a feature still uses it.
- **Others:** the sitelinks search box docs were removed 2024-11-29. Practice problem docs were removed 2026-01-06. "Dataset structured data is only used by Dataset Search".
- So a proposed `WebSite` + `SearchAction` (the 2026-10-09 audit prompt asked about it) no longer earns a sitelinks search box.

**Metrics**
- "INP replaces FID as a Core Web Vital" (2024-03-12).
- Good values: LCP within 2.5 s, INP under 200 ms, CLS under 0.1, at the 75th percentile.

**Tools and indexing**
- The Mobile-Friendly Test and the Mobile Usability report were retired 2023-12-01.
- Mobile-first indexing has been complete since 2023-10-31.

The type list keeps changing. A skill should link to the documentation updates page rather than copy the list.

## [WEB-024] Universal Analytics habits in a GA4 tag
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [IP masking in GA](https://support.google.com/analytics/answer/2763052), [UA versus GA4 events](https://support.google.com/analytics/answer/9964640), [Custom dimensions](https://support.google.com/analytics/answer/14240153), [UA sunset](https://support.google.com/analytics/answer/11583528)
- Related: WEB-001, WEB-025, WEB-022

Universal Analytics stopped processing standard properties on 2023-07-01, and its data became inaccessible from the week of 2024-07-01. Models still write UA-style gtag code.

| Habit | In GA4 |
|---|---|
| `anonymize_ip: true` | "In Google Analytics 4, IP masking is not necessary since IP addresses are not logged or stored." The parameter isn't in the gtag reference. |
| `event_category`, `event_label` | "Google Analytics 4 events have no notion of Category, Action, and Label and … Google Analytics 4 reports do not display Category, Action, and Label." They become ordinary event parameters. |
| Parameters show up in reports | Register a custom dimension; "After 24-48 hours, you can start to report on" it. The docs imply an unregistered parameter isn't reportable, but don't say it outright. |

**osrs-tracker-web's tag (WEB-001) has all three:**
- `anonymize_ip: true`;
- `trackEvent(action, category, label, value)`, which sends `event_category` and `event_label`;
- a string `value` (`'dark'`) on `load_theme`.

The property hasn't registered them. On 2026-10-13 `get_custom_dimensions_and_metrics` (WEB-006) returned one custom dimension, `customEvent:description`, and no custom metrics. So GA4 reports can't break events down by category or label. See this file's recommendations.

## [WEB-025] GA4 consent mode and data retention
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-13
- Sources: [Consent mode guide](https://developers.google.com/tag-platform/security/guides/consent), [Consent mode concepts](https://developers.google.com/tag-platform/security/concepts/consent-mode), [EU user consent policy](https://support.google.com/tagmanager/answer/13695607), [Data retention](https://support.google.com/analytics/answer/7667196)
- Related: WEB-024, WEB-001

**Consent mode**
- `gtag('consent', 'default', {...})` goes "on every page of your site before any commands that" send data, and `gtag('consent', 'update', ...)` follows the user's choice.
- "By default, no consent mode values are set", and "Consent mode doesn't save consent choices".
- v2 (November 2023) added `ad_user_data` and `ad_personalization`.

**Basic and advanced**
- Basic: tags don't load until the user chooses, and "no data is transferred to Google at all".
- Advanced: tags load, and while consent is denied they "send measurements without cookies".

**Who needs it.** Google's EU user consent policy requires collecting EEA users' consent and sharing it with Google for ads uses: personalization, remarketing and ads measurement. The page doesn't say GA4 reporting stops without it. Whether a site needs consent under EU law is a legal question this KB doesn't answer.

**Retention**
- User-level and event data: 2 or 14 months on standard properties.
- "the data retention setting does not affect standard aggregated reports". It affects only explorations and funnel reports.
- An analysis that goes further back than 14 months has to use standard reports or the BigQuery export (WEB-009).

## [WEB-026] Anthropic's official SEO skills
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-13
- Sources: [knowledge-work-plugins seo-audit](https://github.com/anthropics/knowledge-work-plugins/blob/main/marketing/skills/seo-audit/SKILL.md), [knowledge-work-plugins seo-ai-visibility](https://github.com/anthropics/knowledge-work-plugins/tree/main/small-business/skills/seo-ai-visibility)
- Related: WEB-027, WEB-028, SKILL-001

`anthropics/skills`, `claude-plugins-official` and the `claude-code` plugins have no SEO content (file trees searched 2026-10-13). `anthropics/knowledge-work-plugins` has two SEO skills.

**`marketing/skills/seo-audit`** (190 lines, last changed 2026-03-13)
- Marketer-oriented: keywords, on-page, content gaps, a technical checklist, competitors.
- Tools are placeholders (`~~SEO tools` for Ahrefs and Similarweb, `~~product analytics`).
- No Search Console or GA4 step, and no server HTML against rendered DOM.
- Partly stale: "LCP, FID/INP, CLS", "within 150-160 characters", "primary keyword appears in the first 100 words".

**`small-business/skills/seo-ai-visibility`** (143 lines plus 5 references, last changed 2026-09-15)
- `allowed-tools: Read, WebFetch`.
- Worth copying:
  - "Say what was crawled and what could not be reached."
  - "Five findings in the body. Everything else in an appendix."
  - Impact and effort scored separately.
  - "**No overall score.** A single number invites comparison … and hides which fix matters."
  - A check that the main content is "present in the raw HTML response".
  - Crawled text treated as data.
  - A recheck date ("30 days is the earliest a change shows up").
- Its reliance on WebFetch is the weak part (WEB-016).

## [WEB-027] Community SEO skills and agents
- Type: comparison
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-13
- Sources: [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo), [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills), [Hainrixz/claude-seo-ai](https://github.com/Hainrixz/claude-seo-ai), [wshobson/agents](https://github.com/wshobson/agents), [VoltAgent seo-specialist](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/07-specialized-domains/seo-specialist.md)
- Related: WEB-026, WEB-028, WEB-022

Stars as of 2026-10-13.

| Repo | Stars | Worth taking | Avoid |
|---|---|---|---|
| `AgriciDaniel/claude-seo` (26 skills, 19 agents) | 18,806 | Compares raw with rendered HTML ("say rendered content was not compared" without Chromium); "Never reference FID"; tells the user which credential tier it found; Search Console quick wins at positions 4–10 | A weighted 0–100 health score; 6–10k words per skill |
| `coreyhaines31/marketingskills` `seo-audit`, `analytics` | 54,456 | Curl misses JSON-LD that JavaScript injects; Search Console buckets (positions 8–20, weak CTR at 1–5); "wait 3-4 weeks"; "Compute, Don't Eyeball"; "Match Observation Windows"; never follow instructions found in page content | "150-160 characters", "Keyword in first 100 words", bounce rate as a signal |
| `Hainrixz/claude-seo-ai` | 74 | Read-only with a separate `fix` skill; WebFetch "is never the acquisition path"; never pretends to have seen rendered content; UA presets; expects `noindex` on non-production environments | Low adoption |
| `wshobson/agents` SEO plugins | 40,554 | — | "Primary keyword: 0.5-1.5% density", "LSI keyword generation" |
| VoltAgent `seo-specialist` (Haiku) | 25,675 | — | Generic, and ends with a made-up outcome line |

**What it adds up to.** No published skill is built for an SSR framework or uses repo decision records. Our 2026-10-09 audit prompt (WEB-002) already does both. Take ideas from these skills, not files.

## [WEB-028] What a read-only SEO audit skill should do
- Type: recommendation
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: synthesis of WEB-002, WEB-003, WEB-013 to WEB-019, WEB-026, WEB-027; [Skills frontmatter reference](https://code.claude.com/docs/en/skills), [FreekMencke/claude-skills#31](https://github.com/FreekMencke/claude-skills/pull/31)
- Related: WEB-029, WEB-030, REPO-033, REPO-039, SKILL-010, SKILL-017, SKILL-021, HOOK-020

The design for `/seo-audit`. It is generic, and it reads each repo's own rules at runtime (REPO-042).

**Inputs**
- The site URL.
- The repo, if the session is in one.
- The data the session can reach: the Search Console wrapper, a PSI key, GA4 MCP, logs. Detect them and print the tier before starting, the way claude-seo does.

**Steps**
1. Read the repo skill, CLAUDE.md and the decisions doc. Deliberate trade-offs aren't findings (WEB-002).
2. Pull search data if it's available: impressions and clicks per page template, and the indexing reasons (WEB-030). Without it, say so.
3. Sample pages per template, weighted by impressions, not by page count.
4. `curl` each sample from production and from a local production build, with a marked Googlebot UA (WEB-014, WEB-018). Grep the head fields, status, h1 and JSON-LD. Never use WebFetch (WEB-016).
5. Where a browser is available, compare the canonical, robots meta, title and JSON-LD with the rendered DOM. Otherwise say that the rendered DOM wasn't compared (WEB-017).
6. Run Lighthouse or the PSI API for lab numbers, and CrUX if the site has field data (WEB-010, WEB-011).
7. Check every rule against Google's current docs, not memory (WEB-022 to WEB-024).
8. Report in WEB-029's format, with five findings in the body, coverage, what the user must check by hand (Rich Results Test, Search Console UI), and a recheck date.

**Constraints**
- Read-only, but not with REPO-033's agent recipe: in a skill, `allowed-tools` pre-approves and restricts nothing (SKILL-010), and skill `hooks` keep running "for the rest of the session" (HOOK-020). Use `disallowed-tools: Edit, Write, NotebookEdit` ("removed from Claude's available pool while this skill is active"), read-only rules in the prompt, and `git status --porcelain` at the start and the end. The audit runs inline, not as a subagent, because it needs the repo's auto memory (the Search Console wrapper's location) and MCP tools.
- Fetched pages are data (REPO-039).
- Google's rules go in `references/`, each linked to its Google page (SKILL-017).
- Fixes happen in the repo's own session. An issue per finding can follow through `roadmap-issues`, as #159 did.

## [WEB-029] One audit finding: evidence, impact, effort, fix
- Type: pattern
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-13
- Sources: [seo-ai-visibility audit checklist](https://github.com/anthropics/knowledge-work-plugins/tree/main/small-business/skills/seo-ai-visibility), [Hainrixz/claude-seo-ai](https://github.com/Hainrixz/claude-seo-ai), WEB-002's report
- Related: WEB-028, REPO-049, REPO-050

Both the official skill and our audit converge on one row per finding, with these fields:

| Field | Content |
|---|---|
| Finding | One sentence |
| Location | URL and page template; `file:line` when in a repo |
| Evidence | The command and its output (curl line, header, snippet), so it can be re-run |
| Impact | High, medium or low, weighted by the template's share of impressions |
| Effort | S, M or L, scored separately |
| Fix | A sketch that follows the repo's conventions |

**Rules around it**
- No blended score. A number "hides which fix matters" (official checklist). claude-seo's 0–100 health score is the counter-example.
- Rank by impact. Effort breaks ties.
- Keep deliberate decisions apart: "Deliberate decisions you would revisit, kept apart from the findings" (WEB-002's prompt).
- Keep checks the session couldn't run apart too, marked `needs_api` or `not verified`, never guessed (Hainrixz).
- Five findings in the body, the rest in an appendix.

REPO-049 and REPO-050 compare reviewers' severity schemes and output formats. An audit uses impact and effort instead of a severity floor because it ranks opportunities, not defects.

## [WEB-030] Let search data order the fixes
- Type: pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: [#160 results comment](https://github.com/osrs-tracker/osrs-tracker-web/issues/159#issuecomment-6098227235), [#159 roadmap](https://github.com/osrs-tracker/osrs-tracker-web/issues/159), [marketingskills rankings-push](https://github.com/coreyhaines31/marketingskills)
- Related: WEB-003, WEB-013, WEB-028

**The code audit ranked the wrong things.** On 2026-10-09 it ranked the player-name and trailing-slash duplicates and the canonicals high. A day later the data showed:
- "Duplicates are not a reported problem."
- "The biggest problem is discovery and crawling": 3,566 item pages (77%) never crawled, about 26 page fetches a day, slow item renders.
- Click-through at about position 11 was the second problem.

The roadmap was reordered, #167 was dropped, and #189 was closed once LCP turned out to be Lighthouse's estimate rather than font loading.

**Pattern:** run the data step before ranking anything. A skill should:
- weight impact by impressions per template;
- check the indexing reasons before proposing canonical or duplicate fixes;
- use the community buckets for quick wins: positions 8–20 over 28 days, and weak CTR at positions 1–5;
- set a recheck date, because Search Console reflects a change weeks later (community: "wait 3-4 weeks").

The roadmap first scheduled a Search Console check of #162 for "about 4-6 weeks after #162 shipped" (#174 item 9), before the user decided that item no.

## [WEB-031] What our SEO sessions cost (measured)
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: local transcripts under `~/.claude/projects/` for osrs-tracker-web worktrees, read 2026-10-13; prices from TOK-017's table ([Pricing](https://platform.claude.com/docs/en/about-claude/pricing))
- Related: WEB-002, WEB-003, WEB-015, TOK-017, ORCH-029

Main-thread usage summed from each transcript's assistant `usage` fields. Prices are Opus 5.5 API rates: $8/MTok for 1-hour cache writes, $0.20 for reads, $20 for output. Subagent transcripts are not included. Measured 2026-10-13.

| Session | Date | Turns | Cache read | Output | API-equivalent |
|---|---|---|---|---|---|
| SEO audit → #159 | 2026-10-09 | 142 | 20.0M | 228k | $12.20 |
| #160 data (Search Console UI, then API) | 2026-10-10 | — | 74.5M | 280k | $25.77 |
| PageSpeed follow-up | 2026-10-10 | — | 7.3M | 57k | $4.36 |
| Player OG cards (#239) | 2026-10-13 | 283 | 48.0M | 233k | $17.90 |

**Why the data session cost the most.** Its 57 Playwright calls on Search Console pages put DOM reads into a growing context, and every later turn re-read that context from cache. The API route from WEB-007 returns compact JSON.

**To re-run:** for each `.jsonl`, sum `cache_creation_input_tokens`, `cache_read_input_tokens`, `output_tokens` and `input_tokens` over the `assistant` lines, then multiply by the prices above. The script used is in this session's transcript; a later session can reproduce it in a dozen lines.

## [WEB-032] A fresh sitemap's "could not be read" cleared on its own; a resubmitted index stayed pending
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: [Manage your sitemaps using the Sitemaps report](https://support.google.com/webmasters/answer/7451001), [Search Console API: Sitemaps resource](https://developers.google.com/webmaster-tools/v1/sitemaps), osrs-tracker-web's app and Traefik logs and `sitemaps.list`, read 2026-10-10 to 2026-10-13 ([FreekMencke/claude-kb#89](https://github.com/FreekMencke/claude-kb/issues/89))
- Related: WEB-007, WEB-008, WEB-013, WEB-018, WEB-029

Minutes after a submit, the Sitemaps report can show "Couldn't fetch" (details: 0 pages, "Sitemap could not be read") for a sitemap Google fetched fine. On osrs-tracker-web it cleared on its own within hours. A resubmitted sitemap index stayed pending for days although Googlebot fetched it: submit the children directly, and don't keep resubmitting the index.

**Child sitemaps (2026-10-13, UTC).** Three were submitted between 10:21 and 10:23.
- Googlebot fetched each within seconds, 200 every time (app and Traefik logs). At first only `sitemap-items.xml` was processed (`isPending: false`, Success). `sitemap-players.xml` (536 URLs, valid XML) had `lastDownloaded: null`, `isPending: true`, `errors: 0` while the UI said "could not be read". `sitemap-site.xml`, a static file with another `lastmod` format, was pending too.
- By about 14:00 all three were `isPending: false`, Success, 0 errors.
- URL Inspection's live test on the sitemap URL passed. Its non-live view says "URL is unknown to Google" for any sitemap, which means nothing.

**The index.** `/sitemap.xml` was resubmitted 2026-10-10 17:21 UTC. Googlebot fetched it within a second and again at 17:54 (200s in the app logs). On 2026-10-13 `sitemaps.list` still said `isPending: true` with `lastDownloaded` 2026-09-18, and 4,696 pages: the old read, without the players sitemap added since. The children, submitted on their own, were read, so the stale row blocks nothing.

**Google's docs.** `isPending`: "If true, the sitemap has not been processed." The help page says "The sitemap should be fetched immediately" but not how long processing takes.

**Check, in order:** `sitemaps.list` (`isPending`, `lastDownloaded`, `errors`), the server logs for Googlebot's fetch and its status, then URL Inspection → Test live URL. If all three are clean, wait.

## [WEB-033] Google rewrote `Brand: phrase` titles whose phrase starts in lowercase
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: [Influencing your title links in search results](https://developers.google.com/search/docs/appearance/title-link) (last updated 2025-12-10, read 2026-10-13), Google results and URL Inspection for osrs-tracker-web, 2026-10-13 ([FreekMencke/claude-kb#89](https://github.com/FreekMencke/claude-kb/issues/89), fixed in [osrs-tracker/osrs-tracker-web@6c4937f](https://github.com/osrs-tracker/osrs-tracker-web/commit/6c4937f))
- Related: WEB-001, WEB-014, WEB-022, WEB-029

In a `Brand: phrase` title whose phrase starts in lowercase, Google showed `phrase - Brand`, or `phrase - Site name`. Start the phrase with a capital, or write `Phrase - Site name` yourself.

**What we saw (screenshots by the user, 2026-10-13):**

| `<title>` | Shown by Google |
|---|---|
| `OSRS XP Tracker: daily gains, boss kills and clues` | `daily gains, boss kills and clues - OSRS XP Tracker` |
| `OSRS Price Tracker: live Grand Exchange prices` | `live Grand Exchange prices - OSRS Tracker` (the site name, not the cut brand) |
| `OSRS Tracker: XP tracker and Grand Exchange prices` (Home) | unchanged |

The titles shipped 2026-10-10 and `/trackers/xp` was last crawled 2026-10-11 20:15 UTC, so they weren't stale. Home, which starts with the site name itself, was kept.

**What Google says.** Title links are "completely automated", from sources including `<title>`, the "Main visual title", headings, `og:title` and "WebSite structured data". "If we've detected an issue on the page, we may try to generate an improved title link". Google "may omit the site name from the title link, if it's repetitive with the site name that's already shown in the search result". Its branded example has a capital after the colon: `ExampleSocialSite: Sign up for a new account.` Changes show after a recrawl, which "may take a few days to a few weeks".

Google names no lowercase rule: the cause is our inference from one site.

Since 2026-10-13 the `seo-audit` skill flags `Brand: phrase` titles whose phrase starts in lowercase (FreekMencke/claude-skills#45, merged in FreekMencke/claude-skills#46).

## [WEB-034] A consent banner rendered after hydration became the LCP element
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-13
- Sources: [osrs-tracker/osrs-tracker-web#263](https://github.com/osrs-tracker/osrs-tracker-web/pull/263), [osrs-tracker/osrs-tracker-web#248](https://github.com/osrs-tracker/osrs-tracker-web/pull/248)
- Related: WEB-001, WEB-010, WEB-025

A cookie banner that renders only in the browser can become the page's Largest Contentful Paint (LCP) element for every first-time visitor. Render it on the server, and hide it before first paint for visitors who already chose.

**What happened.** osrs-tracker-web's banner (#248, 2026-10-13) rendered only after hydration. For a first-time visitor it painted about a second after the page and became the LCP element. Mobile PageSpeed Insights on the player page then gave LCP 3.5–3.8 s, against 2.5 s before #248.

**The fix (#263):**
- The server renders the banner in every page, cached pages included, so it hydrates in place.
- For a stored choice, the gtag script in `index.html` adds `<style id="consent-chosen">consent-banner { display: none; }</style>` before first paint. A rule in `styles.css` didn't work.
- `data-nosnippet` on the banner keeps its text out of search snippets, now that it's in the HTML.

Measured locally (production build, mobile emulation, 4× CPU): first paint of the banner fell from 3,185 ms to 1,248 ms. Returning visitors saw it in 0 frames, before and after. The PR didn't report a production PageSpeed run after the fix (not verified).

## Recommendations for our setup

Ranked by impact against effort.

1. **Done 2026-10-13: the `/seo-audit` skill** is in `freek-local-skills` ([FreekMencke/claude-skills#31](https://github.com/FreekMencke/claude-skills/pull/31), from [#28](https://github.com/FreekMencke/claude-skills/issues/28)): WEB-028's steps, WEB-029's finding format, a `probe.sh` with the marked user agent (WEB-018), and Google's rules quoted in `references/`. It enforces read-only with `disallowed-tools` and a `git status` check, not REPO-033's hook (WEB-028).
2. **Done 2026-10-13: osrs-tracker-web's UA-era gtag code is fixed** (WEB-024), in [osrs-tracker/osrs-tracker-web#241](https://github.com/osrs-tracker/osrs-tracker-web/pull/241) (from [#240](https://github.com/osrs-tracker/osrs-tracker-web/issues/240)): `anonymize_ip` is gone, and events send named parameters (`load_theme` sends `theme`) instead of `event_category`, `event_label` and a string `value`. Not checked: which new parameters are registered as custom dimensions in the property. Consent mode is still undecided (WEB-025).
3. **Done 2026-10-13: give sessions read-only GA4 access.** The official GA MCP server (WEB-006) is registered user-wide with the Search Console service account as a Viewer, so questions like WEB-005's "Bing's referral share" can now be answered.
4. **Done 2026-10-13: mark audit traffic** (WEB-018): the skill's `probe.sh` appends `seo-audit` to the Googlebot user agent.
5. **Done 2026-10-13: route SEO questions to this file.** `claude-kb-lookup`'s description now lists the topic ([FreekMencke/claude-skills#30](https://github.com/FreekMencke/claude-skills/pull/30), from [#29](https://github.com/FreekMencke/claude-skills/issues/29)).
6. **Done 2026-10-13: sessions read historical server logs from Loki** (WEB-013, INFRA-024, INFRA-025), with option a, in [FreekMencke/home-cluster#5](https://github.com/FreekMencke/home-cluster/issues/5): `resourceNames: ['loki-gateway:80']` was enough. Before, the `claude-agent` identity couldn't reach Loki, so crawl and bot questions got only the current pods' logs (about 10 minutes in the 2026-10-13 `seo-audit` run). The options were:
   - a. A Role in the Loki namespace with `get` on `services/proxy`, limited by `resourceNames` to the gateway. RBAC maps `GET` to `get`, and Loki's query endpoints are `GET` while push and delete requests are `POST`. The denial named the resource `loki-gateway:80`, and `resourceNames` with that string worked (INFRA-024). The RBAC lives in the cluster's config repo, so applying it is a cross-repo issue there.
   - b. A read-only Loki or Grafana MCP server.
   - c. Keep Loki a manual step: the user runs the query and pastes the result.

## Open questions

- Does Claude Code's WebFetch obey a `robots.txt` `Disallow` for `Claude-User`? Not documented (WEB-016). A probe against a test path would settle it.
- Does an unregistered GA4 event parameter show up anywhere in the standard reports? Google implies not but doesn't say so (WEB-024). Our property registers only `description`, so a `run_report` with `customEvent:event_category` would answer it.
- Which Search Console permission does a service account need? Our Restricted user works for the API (WEB-003); Google's docs don't say (WEB-012).
- How big are the GA MCP server's tool schemas, and how much context does a `run_report` answer take? Not measured (WEB-006); it's installed now, so a `/context` check in a fresh session would show the schemas.
- How long does a resubmitted sitemap index stay pending? `sitemaps.list` for `/sitemap.xml` was still pending three days after the 2026-10-10 resubmit (WEB-032); a check on or after 2026-10-20 would show whether it is processed.
- Does Google keep the capitalised `Brand: Phrase` titles as written? osrs-tracker-web shipped them in 6c4937f on 2026-10-13; a search-results check after the next crawl of `/trackers/xp` and `/trackers/price` would confirm WEB-033's rule.
- Can Lighthouse 13.5.0 select the `agentic-browsing` category from the CLI (WEB-011)?
