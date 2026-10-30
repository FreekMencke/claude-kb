# Claude for web analytics and SEO work

Prefix `WEB`. This file covers using Claude Code for SEO and web analytics: getting Google Analytics 4, Search Console and PageSpeed data into a session, checking what a crawler sees, Anthropic's own crawlers, the SEO and GA advice that models repeat after Google retired it, published SEO skills, and what our SEO sessions cost. It is not an SEO handbook. Google's rules belong in the `/seo-audit` skill's references, cited to Google. This file holds only the rules a model is likely to get wrong from memory (WEB-022 to WEB-025).

Research basis:
- Researched 2026-10-13 against Claude Code v2.1.296 (terminal in WSL), on the Claude 5 model family.
- Four Sonnet 5.5 research subagents each took one block: Google data access, crawler view and AI bots, published skills, and retired advice. They downloaded pages with `curl` and grepped them. The lead re-checked every quote used here in those downloads.
- The baseline is `osrs-tracker-web` at `main` `9f8eadc` (2026-10-13, after #239's player link-preview cards), plus local transcripts of its SEO sessions from 2026-10-09 to 2026-10-13.
- No measurement IDs, property IDs, project numbers or key paths are copied here.

Extended 2026-10-18 (FreekMencke/claude-kb#190) with Google's 2025–2026 documentation changes, other vendors' AI crawlers and hreflang (WEB-035 to WEB-042), from three Sonnet 5.5 readers' raw downloads, re-checked by the lead; WEB-017, WEB-020, WEB-021 and WEB-023 were updated in place.

Re-verified 2026-10-14; each entry's Last verified date is authoritative.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| How does a session get Search Console data? | The Search Console API with a read-only service account (search performance, URL Inspection, sitemaps). The Pages report's reasons, Crawl stats and Core Web Vitals are UI-only, so the user signs in to the Playwright browser for those. Google ships no Search Console MCP server. | WEB-003, WEB-007, WEB-008 |
| Is there an official GA4 MCP server? | Yes, `googleanalytics/google-analytics-mcp` (experimental, v0.7.0, 2026-07-29). It has 9 report and list tools, uses Application Default Credentials and requests only `analytics.readonly`. Installed user-wide on 2026-10-13 with the Search Console service account as a GA4 Viewer. | WEB-006, WEB-004 |
| Does the PageSpeed Insights API work without a key? | No. Keyless calls returned 429 (quota 0) on 2026-10-10 and 2026-10-13, although the docs still say a key is optional. Field data is moving to the CrUX API, which needs a key. | WEB-010 |
| How should an agent see what Googlebot sees? | `curl` the server HTML with the Googlebot user agent and grep the head tags. Don't use WebFetch (it returns a summary) or a Playwright snapshot (it has no `<head>`). | WEB-014, WEB-015, WEB-016 |
| Does a noindex or canonical set by JavaScript count, and what must an SSR page send? | Google indexes the rendered HTML, but since December 2025 it says a `noindex` in the original HTML may stop rendering, a canonical must match the original HTML's or be absent from it (one tag only), and non-200 pages may not be rendered. So send the status, robots meta and one canonical from the server: in Angular, `ServerRoute.status` or `RESPONSE_INIT`. Googlebot reads only the first 2MB of the HTML, uncompressed. | WEB-017, WEB-035, WEB-036, WEB-037 |
| Can an agent validate structured data through an API? | No public API for the Rich Results Test or the Schema Markup Validator. Check the JSON-LD in the server HTML, then validate by hand. URL Inspection's `richResultsResult` covers indexed URLs only. | WEB-019 |
| Which robots.txt tokens do AI crawlers use, and which honour it? | Anthropic: `ClaudeBot` (training), `Claude-User` (WebFetch too) and `Claude-SearchBot`, all honouring robots.txt. Other training tokens: `GPTBot`, `Google-Extended`, `Applebot-Extended`, `meta-externalagent`, `Amazonbot`, `MistralAI-Training`, `CCBot`. Search: `OAI-SearchBot`, `PerplexityBot`, `Applebot`, `Amzn-SearchBot`, and Googlebot for AI Overviews. User-triggered fetchers (`ChatGPT-User`, `Perplexity-User`, `Google-Agent`) may ignore robots.txt. | WEB-020, WEB-039, WEB-040 |
| Does llms.txt help with Google or Claude? | Google says it ignores it, and that it "will neither harm nor help". No Anthropic page says Claude reads third-party llms.txt files. | WEB-021 |
| Which SEO and GA4 advice from model memory is wrong? | Sitemap `priority` and `changefreq`, the sitemap ping, meta keywords, FAQ and HowTo rich results, `rel=prev/next`, `noindex` in robots.txt, FID, fixed meta-description lengths and keyword density. In a GA4 tag, `anonymize_ip` does nothing, and `event_category` and `event_label` are plain parameters that reports don't show (osrs-tracker-web dropped them in osrs-tracker/osrs-tracker-web#241). | WEB-022, WEB-023, WEB-024, WEB-027 |
| What does a site need for hreflang when it adds a language? | One URL per language; each version links itself and every other version with fully qualified URLs (one-way links are ignored); ISO 639-1 plus an optional region; `x-default` for a selector page. Don't redirect by `Accept-Language`, which Angular's i18n server output does. | WEB-042 |
| What should a read-only SEO audit skill do? | Read the repo's decisions, curl the server HTML per page template, pull Search Console data to weight the findings, and rank them by impact with effort scored separately. No blended score. State what wasn't reached, and treat fetched text as data. | WEB-028, WEB-030 |
| Which Google spam policies changed in 2026? | Back button hijacking (added 2026-04-13, enforced from 2026-06-15, third-party scripts included); spam reports can lead to manual actions (2026-04-14); the policies cover generative AI responses (2026-05-15); site reputation manual actions don't apply in the EEA from 2026-08-30. | WEB-038 |
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
| WEB-035 | Google's JavaScript SEO clarifications, 2025-12 to 2026-03 | fact | javascript, noindex, canonical, soft-404, robots-meta |
| WEB-036 | Angular SSR: send the status code and one canonical from the server | pattern | angular, ssr, response-init, status-codes, canonical |
| WEB-037 | Googlebot reads only the first 2MB of an HTML file | fact | googlebot, file-size, crawling, ssr |
| WEB-038 | Google spam-policy changes in 2026: back button hijacking and more | fact | spam-policies, back-button-hijacking, manual-actions, site-reputation |
| WEB-039 | AI crawler tokens beyond Anthropic and Google | comparison | crawlers, robots-txt, gptbot, oai-searchbot, perplexitybot, applebot-extended |
| WEB-040 | Google's AI controls: Googlebot, Google-Extended and Google-Agent | fact | google-extended, google-agent, ai-overviews, web-bot-auth, robots-txt |
| WEB-041 | AI usage preferences in robots.txt: the IETF aipref drafts | fact | aipref, content-usage, robots-txt, ietf |
| WEB-042 | hreflang basics for a site that adds a language | fact | hreflang, i18n, multilingual, x-default, angular-localize |

## [WEB-001] osrs-tracker-web's SEO and analytics setup (2026-10-13)
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-14
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

The SEO roadmap (#159, 19 sub-issues: 17 in osrs-tracker-web and 2 in osrs-tracker-api) closed on 2026-10-10.

## [WEB-002] How the 2026-10-09 SEO audit ran
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
- Sources: local transcript of the `roadmap-skill-location` worktree session (2026-10-10), [#160 results comment](https://github.com/osrs-tracker/osrs-tracker-web/issues/159#issuecomment-6098227235), osrs-tracker-web auto memory `search-console-pagespeed-access`
- Related: WEB-007, WEB-008, WEB-010, WEB-030, WEB-031

Issue #160 collected the data the audit couldn't see.

**How the data was reached**
1. The user signed in to Search Console in the Playwright MCP browser, and the session read the reports there: 13 navigations, 27 `browser_evaluate` and 17 clicks.
2. Lab scores came from pagespeed.web.dev in the same browser, because the keyless PSI API returned 429.
3. Mid-session the user set up a PSI API key and a Search Console service account (a Restricted user, read-only). The session then redid #160 through the API.
4. Server logs came from Loki, run with the admin identity: the session predates the read-only `claude-agent` identity. From 2026-10-13 to 2026-10-14 that identity could query Loki too (INFRA-024); the local Loki was removed on 2026-10-14 and logs are now in Grafana Cloud.

**What the data changed.** It reordered the roadmap:
- Item pages were 91% of search impressions and 98% of indexed pages.
- 3,566 item pages had never been crawled.
- Duplicates weren't reported at all, so the canonical fixes were demoted to housekeeping.

The access notes ended up in the repo's auto memory, not in the repo (WEB-004). They are machine-specific, so a cloud session doesn't have them.

## [WEB-004] Google credentials live outside the repo, and auto mode guards them
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
- Sources: local transcript of the `indexnow-evaluation` worktree session (2026-10-11), in [osrs-tracker-web](https://github.com/osrs-tracker/osrs-tracker-web)
- Related: WEB-006, WEB-022, PROMPT-012

Asked whether IndexNow was worth adding, an Opus 5.5 session answered in two model responses (one Bash call, then the answer) with no search.
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
- Last verified: 2026-10-14
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
- Registered with `uvx analytics-mcp@0.7.0`: at user scope on 2026-10-13, then at local scope in osrs-tracker-web from 2026-10-14 (FreekMencke/claude-kb#104, MCP-001), so only that repo's sessions start it. A probe elsewhere passes `--mcp-config` with the entry from `~/.claude.json` (MCP-012).
- It uses the Search Console service account's key; the account was added as a Viewer on the property.
- The Admin and Data APIs are enabled in that account's project.
- Auto mode denied registering it as "[Credential Exploration]" until the user asked for it explicitly.

Tested 2026-10-13, v2.1.296, `claude -p` on Haiku 5.5 (capped at 4 turns, $0.20): `get_account_summaries` returned 1 account and 1 property, and `get_custom_dimensions_and_metrics` returned one custom dimension (`description`).

## [WEB-007] Search Console: the API, its quotas, and no official MCP server
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
- Sources: [Lighthouse readme](https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/readme.md), [chrome-devtools-mcp tool reference](https://raw.githubusercontent.com/ChromeDevTools/chrome-devtools-mcp/main/docs/tool-reference.md), [chrome-devtools-mcp README](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- Related: WEB-010, WEB-014, FLOW-014, SURF-032

**Lighthouse CLI** (v13.5.0, 2026-09-18)
- "Lighthouse requires Node 22 (LTS) or later" and a local Chrome.
- `lighthouse <url> --only-categories=seo,performance --output=json --output-path=stdout --chrome-flags="--headless"` gives JSON that `jq` can cut down before it reaches the context.
- The SEO category checks crawlability, title, description, HTTP status, link text, crawlable anchors, robots.txt, image alt, hreflang and canonical. Structured data is a manual audit with no weight.
- The v13.5.0 tag defines an `agentic-browsing` category (with an `llms-txt` audit) and its CLI help lists it, so `--only-categories=agentic-browsing` should select it (readme.md still lists four categories; not run).
- Not installed globally; `npx lighthouse` works. Under WSL it leaves Windows-style `lighthouse.XXXX` Chrome-profile folders in the working directory: start Chromium yourself and pass `--port` (osrs-tracker-web memory `lighthouse-wsl-temp-dir`).

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
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
- Sources: synthesis of WEB-003, WEB-007 to WEB-011, WEB-014 and the [#160 results comment](https://github.com/osrs-tracker/osrs-tracker-web/issues/159#issuecomment-6098227235)
- Related: WEB-028, WEB-030, INFRA-018, INFRA-024

| Question | Source | Route from a session |
|---|---|---|
| What does the server send? | Server HTML | `curl` with the Googlebot UA (WEB-014) |
| Does the page work after hydration? | Rendered DOM | Playwright `browser_evaluate` |
| Is it indexed, and why not? | Pages report, URL Inspection | UI in a signed-in browser; the API for single URLs (WEB-008) |
| Which pages and queries get impressions and clicks? | Search Analytics | Search Console API (WEB-007) |
| How often does Google crawl, and how fast do we answer? | Crawl stats, server logs | UI; Grafana Cloud's logs through the Grafana connector (the local Loki was removed on 2026-10-14; from 2026-10-13 it was `kubectl get --raw` on the Loki gateway's service proxy, INFRA-024). Pod logs through the flux MCP server cover the current pods only |
| Which bots actually come? | Server logs | Grafana Cloud's logs through the Grafana connector, e.g. `sum(count_over_time({namespace="osrs-tracker"} \|= "ClaudeBot" [30d]))`; the same form with `Googlebot` over 24 h returned 207 on 2026-10-14, and history starts 2026-10-13 about 20:00 UTC (until 2026-10-14 through `kubectl get --raw` on the local Loki gateway, INFRA-024). In #160: Amazonbot 609 requests, Googlebot about 22 item pages in 21 h. 2026-10-13, over the logs held (from 2026-10-05): Googlebot 3,780 lines, ClaudeBot 63, no `Claude-User` or `Claude-SearchBot` |
| Lab LCP, TBT, CLS | Lighthouse | CLI, DevTools MCP, PSI with a key (WEB-010, WEB-011) |
| Field Core Web Vitals | CrUX | CrUX API; none for low-traffic sites |
| What do visitors do on the page, where do they come from? | GA4 | GA MCP server (WEB-006), set up 2026-10-13 |

**What the data showed for us.** Search Console and the logs changed the priorities. The code audit alone ranked duplicate URLs high; the data showed crawling and click-through were the problems (WEB-030).

## [WEB-014] Judge pages by the server HTML: curl and grep the head
- Type: pattern
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
- Sources: [microsoft/playwright-mcp README](https://github.com/microsoft/playwright-mcp)
- Related: WEB-014, FLOW-014, REPO-021, BROWSER-002

Playwright MCP's `browser_snapshot` is an accessibility tree: "Capture accessibility snapshot of the current page". So it shows links and headings, but none of the head tags SEO depends on.

Tested 2026-10-13, Playwright MCP from the official plugin (`@playwright/mcp@latest`), v2.1.296, WSL: `browser_navigate` to `/trackers/price/4151`.
- The navigate result carried only the URL and page title. The snapshot went to a 6,512-byte `.yml` file in the working directory, not into the context.
- The file had 0 lines matching `canonical`, `description`, `og:` or `ld+json`.
- Delete that `.playwright-mcp/` folder afterwards: it lands in the repo.

**What it is still good for**
- The rendered DOM: `browser_evaluate` with `document.head.outerHTML` or a `querySelectorAll('script[type="application/ld+json"]')` (not tested here).
- LCP through `PerformanceObserver` (WEB-002).
- Reading Search Console's UI after the user signs in (WEB-003).

**Other tools for raw HTML.** `browser_network_request` "Returns full details (headers and body)". The README itself steers coding agents to the Playwright CLI with skills as more token-efficient; measured in Claude Code in BROWSER-002.

## [WEB-016] WebFetch and the API web fetch tool are wrong for SEO checks
- Type: anti-pattern
- Applies to: Claude Code, Claude API
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [Tools reference](https://code.claude.com/docs/en/tools-reference), [Claude Code CHANGELOG 2.1.83](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md), [Web fetch tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool)
- Related: TOK-087, TOK-089, WEB-014, WEB-020

**Claude Code's WebFetch**
- It converts the page to Markdown and answers through a second model. The docs call it "lossy by design … use `curl` via Bash for the unprocessed page".
- It doesn't report the status code, headers, head tags or JSON-LD. An audit can't trust it for any of them.
- It identifies itself: "WebFetch sets a `User-Agent` header beginning with `Claude-User`". The 2.1.83 changelog says: "Improved `WebFetch` to identify as `Claude-User` so site operators can recognize and allowlist Claude Code traffic via `robots.txt`". It also sends an `Accept` header that prefers Markdown, so a server doing content negotiation can answer with Markdown instead of the HTML a crawler gets, and it caches each response for 15 minutes by default.
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
- Last verified: 2026-10-18
- Sources: [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [Dynamic rendering](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering), [Search Central documentation updates](https://developers.google.com/search/updates)
- Related: WEB-008, WEB-014, WEB-022, WEB-035, WEB-036

**How Google renders**
- "Googlebot queues all pages with a 200 HTTP status code for rendering, unless a robots meta tag or header tells Google not to index the page."
- "Google also uses the rendered HTML to index the page."
- "If the HTTP status code is non-200 (for example, on error pages with 404 status code), rendering might be skipped."

**What that means for an SSR site**
- A not-found page must carry its content and its status in the server HTML.
- A `noindex` that JavaScript removes may still apply. The 2025-12-15 docs update says: "If there's a possibility that you do want the page indexed, don't use a noindex tag in the original page code."
- Canonicals (2025-12-17 update): set the same canonical in the original HTML as in the rendered page, or leave it out of the original HTML. An audit should compare the curl result with the rendered DOM for these two tags.
- WEB-035 has the full December 2025 to March 2026 wording (the live page's `noindex` line is "If you do want the page indexed…"), WEB-036 the Angular side, and WEB-037 Googlebot's 2MB limit.

**Checking Google's own view.** "use the Rich Results Test or the URL Inspection Tool and look at the rendered HTML". Neither has an API that returns it (WEB-008, WEB-019).

**Dynamic rendering** "is a workaround and not a recommended solution". Google recommends server-side rendering, static rendering or hydration.

## [WEB-018] Audit requests show up as bots in the server logs
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
- Sources: [Does Anthropic crawl data from the web?](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler), [Tools reference](https://code.claude.com/docs/en/tools-reference)
- Related: WEB-016, WEB-021, WEB-039, WEB-040, WEB-041

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
- Other vendors' tokens: WEB-039; Google's: WEB-040.

**For us:** osrs-tracker-web's `robots.txt` allows every bot. A 2026-10-13 grep of 24 h of pod logs found no Claude bot requests; the pods had been up only since that morning's deploy.

## [WEB-021] llms.txt and AI search features
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features), [Google's AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [llmstxt.org](https://llmstxt.org/)
- Related: WEB-020, TOK-090, WEB-040

**What llms.txt is.** A proposal "to provide LLM-friendly content" in a Markdown file at `/llms.txt`. Anthropic publishes one for its own docs (TOK-090).

**Google's position**
- AI Overviews and AI Mode have "no additional requirements … nor other special optimizations necessary".
- "You don't need to create new machine readable files, AI text files, or markup to appear in these features."
- The AI optimization guide (added 2026-05-15; the llms.txt clarification on 2026-06-15) says such files "will neither harm nor help your site's visibility or rankings in Google Search, as Google Search ignores them".
- What counts: a page "must be indexed and eligible to be shown in Google Search with a snippet", and crawling must be allowed. Googlebot's robots.txt rules and the snippet controls govern AI Overviews and AI Mode, not `Google-Extended` (WEB-040).

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
- Last verified: 2026-10-18
- Sources: [Search Central documentation updates](https://developers.google.com/search/updates), [FAQ and HowTo changes](https://developers.google.com/search/blog/2023/08/howto-faq-changes), [Simplifying the search results page](https://developers.google.com/search/blog/2025/06/simplifying-search-results), [Fact check (ClaimReview)](https://developers.google.com/search/docs/appearance/structured-data/factcheck), [Search gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery), [Search Console data anomalies](https://support.google.com/webmasters/answer/6211453), [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals), [Mobile-first indexing has landed](https://developers.google.com/search/blog/2023/10/mobile-first-is-here)
- Related: WEB-019, WEB-022, WEB-027, WEB-038

**Structured data** (re-checked 2026-10-18; the [Search gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery) lists what still earns a rich result)
- **HowTo:** "now deprecated" (2023-09-13); docs removed 2023-09-14.
- **FAQ:** limited to "well-known, authoritative government and health websites" from 2023-08-08. "This feature will no longer appear in Google Search starting May 7, 2026"; docs removed 2026-06-15. Search Console's FAQ impressions drop accordingly.
- **The 2025-06-12 simplification** phased out Book Actions, Course Info, Claim Review, Estimated Salary, Learning Video, Special Announcement and Vehicle Listing: "This update won't affect how pages are ranked." On 2025-09-09 five lost their docs, and all but Book Actions left Search Console's reports and the Rich Results Test. ClaimReview's page stays: "We're phasing out support for ClaimReview markup in Google Search. However, this markup remains supported by the Factcheck Explorer Tool." Book Actions lost its banner on 2025-11-05: "there's still a feature using the markup".
- **Practice problem:** docs removed 2026-01-06; Search Console's help still lists it (INDEX.md Conflicts).
- **Others:** sitelinks search box docs removed 2024-11-29, so `WebSite` + `SearchAction` earns nothing. "Dataset structured data is only used by Dataset Search" (2025-11-05). Breadcrumbs show on desktop only (2025-01-22).

**Metrics.** "INP replaces FID as a Core Web Vital" (2024-03-12). Good values: LCP within 2.5 s, INP under 200 ms, CLS under 0.1, at the 75th percentile.

**Tools and indexing.** The Mobile-Friendly Test and Mobile Usability report went away from 2023-12-01. Mobile-first indexing has been complete since 2023-10-31.

The list keeps changing: a skill should link the updates page, not copy it.

## [WEB-024] Universal Analytics habits in a GA4 tag
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
- Sources: [IP masking in GA](https://support.google.com/analytics/answer/2763052), [UA versus GA4 events](https://support.google.com/analytics/answer/9964640), [Custom dimensions](https://support.google.com/analytics/answer/14240153), [UA sunset](https://support.google.com/analytics/answer/11583528)
- Related: WEB-001, WEB-025, WEB-022

Universal Analytics stopped processing standard properties on 2023-07-01, and its data became inaccessible from the week of 2024-07-01. Models still write UA-style gtag code.

| Habit | In GA4 |
|---|---|
| `anonymize_ip: true` | "In Google Analytics 4, IP masking is not necessary since IP addresses are not logged or stored." The parameter isn't in the gtag reference. |
| `event_category`, `event_label` | "Google Analytics 4 events have no notion of Category, Action, and Label and … Google Analytics 4 reports do not display Category, Action, and Label." They become ordinary event parameters. |
| Parameters show up in reports | Register a custom dimension; "After 24-48 hours, you can start to report on" it. The docs imply an unregistered parameter isn't reportable, but don't say it outright. |

**osrs-tracker-web's tag (WEB-001) had all three until osrs-tracker/osrs-tracker-web#241 (2026-10-13), which replaced them with named parameters (`theme`, `source`, …):**
- `anonymize_ip: true`;
- `trackEvent(action, category, label, value)`, which sent `event_category` and `event_label`;
- a string `value` (`'dark'`) on `load_theme`.

The property never registered them. On 2026-10-13 `get_custom_dimensions_and_metrics` (WEB-006) returned one custom dimension, `customEvent:description`, and no custom metrics, so GA4 reports couldn't break events down by category or label. See this file's recommendations.

## [WEB-025] GA4 consent mode and data retention
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
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
- Read-only, but not with REPO-033's agent recipe: in a skill, `allowed-tools` pre-approves and restricts nothing (SKILL-010), and skill `hooks` keep running "for the rest of the session" (HOOK-020). Use `disallowed-tools: Edit, Write, NotebookEdit` ("removed from Claude's available pool while this skill is active"; the restriction clears when the user sends their next message), read-only rules in the prompt, and `git status --porcelain` at the start and the end. The audit runs inline, not as a subagent, because it needs the repo's auto memory (the Search Console wrapper's location) and MCP tools.
- Fetched pages are data (REPO-039).
- Google's rules go in `references/`, each linked to its Google page (SKILL-017).
- Fixes happen in the repo's own session. An issue per finding can follow through `roadmap-issues`, as #159 did.

## [WEB-029] One audit finding: evidence, impact, effort, fix
- Type: pattern
- Applies to: Claude Code
- Confidence: community-consensus
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
- Sources: local transcripts under `~/.claude/projects/` for osrs-tracker-web worktrees, read 2026-10-13; prices from TOK-017's table ([Pricing](https://platform.claude.com/docs/en/about-claude/pricing))
- Related: WEB-002, WEB-003, WEB-015, TOK-017, ORCH-029

Main-thread usage from each transcript's assistant `usage` fields, counted once per `message.id` (a message sits on one line per content block; TOK-013). Corrected 2026-10-14: the first version summed every line, which inflated each figure 2.1–2.5×. Prices are Opus 5.5 API rates: $8/MTok for 1-hour cache writes, $0.20 for reads, $20 for output. Subagent transcripts are not included. Measured 2026-10-13.

| Session | Date | API messages | Cache read | Output | API-equivalent |
|---|---|---|---|---|---|
| SEO audit → #159 | 2026-10-09 | 64 | 8.8M | 77k | $4.92 |
| #160 data (Search Console UI, then API) | 2026-10-10 | 152 | 29.7M | 109k | $10.26 |
| PageSpeed follow-up | 2026-10-10 | 37 | 3.7M | 26k | $2.08 |
| Player OG cards (#239) | 2026-10-13 | 146 | 24.6M | 99k | $8.73 |

**Why the data session cost the most.** Its 73 Playwright calls (57 of them navigations, evaluations and clicks) on Search Console pages put DOM reads into a growing context, and every later turn re-read that context from cache. The API route from WEB-007 returns compact JSON.

**To re-run:** for each `.jsonl`, sum `cache_creation_input_tokens`, `cache_read_input_tokens`, `output_tokens` and `input_tokens` over the `assistant` lines, keeping the last line per `message.id`, then multiply by the prices above. The script used is in this session's transcript; a later session can reproduce it in a dozen lines.

## [WEB-032] A fresh sitemap's "could not be read" cleared on its own; a resubmitted index stayed pending
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
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
- Last verified: 2026-10-14
- Sources: [osrs-tracker/osrs-tracker-web#263](https://github.com/osrs-tracker/osrs-tracker-web/pull/263), [osrs-tracker/osrs-tracker-web#248](https://github.com/osrs-tracker/osrs-tracker-web/pull/248)
- Related: WEB-001, WEB-010, WEB-025

A cookie banner that renders only in the browser can become the page's Largest Contentful Paint (LCP) element for every first-time visitor. Render it on the server, and hide it before first paint for visitors who already chose.

**What happened.** osrs-tracker-web's banner (#248, 2026-10-13) rendered only after hydration. For a first-time visitor it painted about a second after the page and became the LCP element. Mobile PageSpeed Insights on the player page then gave LCP 3.5–3.8 s, against 2.5 s before #248.

**The fix (#263):**
- The server renders the banner in every page, cached pages included, so it hydrates in place.
- For a stored choice, the gtag script in `index.html` adds `<style id="consent-chosen">consent-banner { display: none; }</style>` before first paint. A rule in `styles.css` didn't work.
- `data-nosnippet` on the banner keeps its text out of search snippets, now that it's in the HTML.

Measured locally (production build, mobile emulation, 4× CPU): first paint of the banner fell from 3,185 ms to 1,248 ms. Returning visitors saw it in 0 frames, before and after. The PR didn't report a production PageSpeed run after the fix (not verified).

## [WEB-035] Google's JavaScript SEO clarifications, 2025-12 to 2026-03
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Search Central documentation updates](https://developers.google.com/search/updates), [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) (last updated 2026-03-04), [Fix Search-related JavaScript problems](https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript) (2025-12-18), [Robots meta tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) (2026-03-24), [Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) (2026-07-10)
- Related: WEB-017, WEB-036, WEB-037, NG-008

Google documented in December 2025 that the original HTML decides more than the rendered page: put the robots meta, the canonical and the status code in the server response. All read as raw text 2026-10-18.

| Date | Topic | Google's wording |
|---|---|---|
| 2025-12-15 | `noindex` | "When Google encounters the noindex tag, it may skip rendering and JavaScript execution, which means using JavaScript to change or remove the robots meta tag from noindex may not work as expected. If you do want the page indexed, don't use a noindex tag in the original page code." |
| 2025-12-17 | Canonical | "you shouldn't use JavaScript to change the canonical URL to something else than the URL you specified as the canonical URL in the original HTML"; otherwise "leave it out of the original HTML". "make sure that this is the only rel="canonical" link tag on the page" |
| 2025-12-18 | Non-200 | "rendering might be skipped" |
| 2026-03-24 | Robots meta placement | "Google Search doesn't enforce placement of meta robots in the HTML head and will respect robots meta tags in the body section of an HTML document as well." (no change in behaviour, newly documented) |

Canonical and hreflang links still count only in the `<head>` (WEB-042). Google's soft-404 fixes for client-side routing (redirect to a URL the server answers with 404, or add `noindex` with JavaScript) aren't needed when the server sends the 404 (WEB-036).

## [WEB-036] Angular SSR: send the status code and one canonical from the server
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [angular.dev: Server and hybrid rendering](https://angular.dev/guide/ssr) ([raw at v22.2.3](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/ssr.md)), [`RESPONSE_INIT` source](https://raw.githubusercontent.com/angular/angular/v22.2.3/packages/core/src/application/platform_tokens.ts), [`ServerRoute` source](https://raw.githubusercontent.com/angular/angular-cli/v22.2.3/packages/angular/ssr/src/routes/route-config.ts), [osrs-tracker-web `not-found.ts`](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/src/app/features/not-found/not-found.ts)
- Related: WEB-035, WEB-014, WEB-001, NG-008

`@angular/ssr` 22.2.3 (`latest` on 2026-10-18, `npm view @angular/ssr dist-tags`) gives two ways to set the status, and angular.dev has no worked 404 example.

- **Per route:** "You can set custom headers and status codes for individual server routes using the `headers` and `status` properties in the `ServerRoute` configuration."
- **At runtime:** `RESPONSE_INIT` "allows you to set headers and the status code for the response dynamically". It is `null` "When the application is rendered in the browser (CSR)", during the build and during static site generation, so inject it as optional and check.
- No angular.dev page says a `**` route returns 404 by itself.

**Canonical.** ssr.md's `CanonicalLinkService` example appends a `<link rel="canonical">` without removing one already in `index.html`. Google wants exactly one (WEB-035): replace an existing tag, as osrs-tracker-web's `PageMetaStrategy` does.

**Prerendering.** Redirects there are "soft redirects" using `<meta http-equiv="refresh">`; server-rendered routes get real 301 or 302 responses.

Tested 2026-10-18, osrs-tracker-web production (`@angular/ssr` ^22.2.2, `NotFound` sets `RESPONSE_INIT.status = 404`), `curl` with a marked Googlebot UA: five not-found URLs (unknown path, item, player) returned 404 with no canonical and no robots meta; `/` and an item page returned 200 with one canonical each and no robots meta.

## [WEB-037] Googlebot reads only the first 2MB of an HTML file
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Googlebot](https://developers.google.com/search/docs/crawling-indexing/googlebot) (last updated 2026-02-03), [Overview of Google crawlers and fetchers](https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers) (2026-06-12), [Search Central documentation updates](https://developers.google.com/search/updates)
- Related: WEB-014, WEB-035, WEBPERF-013

Since the 2026-02-03 docs change, Googlebot's limit is 2MB per file, counted uncompressed. The 15MB figure models repeat is now the default for Google's crawlers in general, not Googlebot's.

**Googlebot page:** "When crawling for Google Search, Googlebot crawls the first 2MB of a supported file type, and the first 64MB of a PDF file." Each CSS or JavaScript resource "is fetched separately, and each resource fetch is bound by the same file size limit". "Once the cutoff limit is reached, Googlebot stops the fetch and only sends the already downloaded part of the file for indexing consideration. The file size limit is applied on the uncompressed data."

**Crawler overview:** "By default, Google's crawlers and fetchers only crawl the first 15MB of a file … a Google crawler like Googlebot may have a smaller size limit (for example, 2MB)".

**For an SSR app.** Inline transfer state (`ng-state`), inlined critical CSS and JSON-LD all count toward the 2MB, and content past it isn't indexed (our inference from the wording; not tested). Measure uncompressed bytes with `curl -s --compressed <url> | wc -c`: curl's `%{size_download}` counts the compressed bytes (tested 2026-10-18, curl on WSL: 15,464 against 84,492 for one osrs-tracker-web item page). osrs-tracker-web's largest page measured 145,047 B on 2026-10-13 (WEB-014), far below the limit.

## [WEB-038] Google spam-policy changes in 2026: back button hijacking and more
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies) (last updated 2026-08-28), [Back button hijacking (blog, 2026-04-13)](https://developers.google.com/search/blog/2026/04/back-button-hijacking), [Report quality issues](https://developers.google.com/search/help/report-quality-issues) (2026-04-23), [Site reputation policy update (blog, 2026-08-28)](https://developers.google.com/search/blog/2026/08/update-site-reputation-policy), [Manual actions report](https://support.google.com/webmasters/answer/9044175), [Search Central documentation updates](https://developers.google.com/search/updates)
- Related: WEB-014, WEB-021, WEB-028

**Back button hijacking** (added 2026-04-13 to "Malicious practices"): "when a site interferes with user browser navigation by manipulating the browser history or other functionalities, preventing them from using their back button to immediately get back to the page they came from."
- Enforcement from 2026-06-15: pages "may be subject to manual spam actions or automated demotions". Search Console has a matching manual action.
- The blog says it "may originate from the site's included libraries or advertising platform", so review third-party scripts too.
- Google says nothing about single-page apps. Our reading: ordinary router navigation (one history entry per real page) isn't what it describes; pushing extra entries, or a `popstate` handler that redirects, is.

**Other changes**

| Date | Change |
|---|---|
| 2026-04-14, clarified 04-23 | Spam reports: "Google may use your report to take manual action against violations." The report text goes to the site owner, so it must contain no personal data. |
| 2026-05-15 | The policies cover "attempting to manipulate generative AI responses in Google Search" |
| 2026-08-28 | Site reputation abuse: "Beginning August 30, manual actions applied under our site reputation policy will have a different effect for those searching in the EEA than outside of it"; "For users inside the EEA, the impact of the manual action won't apply." |

The updates page shows no other spam-policy change from 2025-01-01 to 2026-10-18 (the 2025-01-21 one was editorial).

## [WEB-039] AI crawler tokens beyond Anthropic and Google
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [OpenAI: Overview of OpenAI crawlers](https://developers.openai.com/api/docs/bots), [Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers), [About Applebot](https://support.apple.com/en-us/119829) (published 2026-09-04), [Meta web crawlers](https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers), [Amazonbot](https://developer.amazon.com/amazonbot), [Mistral robots](https://docs.mistral.ai/robots), [DuckAssistBot](https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot), [CCBot](https://commoncrawl.org/ccbot)
- Related: WEB-020, WEB-040, WEB-041, WEB-021

Most vendors split training, search and user-triggered fetching into separate robots.txt tokens. Disallowing the training token keeps a site in that vendor's AI search. Read on each vendor's page, 2026-10-18.

| Vendor | Training | Search, answers | User fetches |
|---|---|---|---|
| OpenAI | `GPTBot` | `OAI-SearchBot` | `ChatGPT-User`: "robots.txt rules may not apply" |
| Perplexity | none: PerplexityBot "is not used to crawl content for AI foundation models" | `PerplexityBot` | `Perplexity-User`: "generally ignores robots.txt rules" |
| Apple | `Applebot-Extended` (never crawls, only governs use) | `Applebot` | — |
| Meta | `meta-externalagent` | `meta-webindexer` | `meta-externalfetcher`: "may bypass robots.txt" |
| Amazon | `Amazonbot` ("may be used to train Amazon AI models") | `Amzn-SearchBot` | `Amzn-User`: "may not follow all robots.txt directives" |
| Mistral | `MistralAI-Training` | `MistralAI-Index` | `MistralAI-User`: "governs which sites these user requests can be made to" |
| DuckDuckGo | none: "not used in any way to train AI models" | `DuckAssistBot` | — |
| Common Crawl | `CCBot`, an open crawl others train on | — | — |

**Details**
- OpenAI: "Sites that are opted out of OAI-SearchBot will not be shown in ChatGPT search answers, though can still appear as navigational links." Changes take "~24 hours".
- Applebot follows Googlebot's rules when robots.txt doesn't name it; Amzn-SearchBot follows other search bots'.
- Microsoft lists no AI token; Copilot appears to use Bing's index (inference). ByteDance has no official crawler page.

## [WEB-040] Google's AI controls: Googlebot, Google-Extended and Google-Agent
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Google's common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) (last updated 2026-10-15), [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) (2025-12-10), [Google user-triggered fetchers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers) (2026-08-19), [Web Bot Auth](https://developers.google.com/crawling/docs/crawlers-fetchers/web-bot-auth), [Crawling docs changelog](https://developers.google.com/crawling/docs/changelog)
- Related: WEB-021, WEB-039, WEB-020, WEB-041

Disallowing `Google-Extended` doesn't take a site out of AI Overviews or AI Mode: those follow Googlebot's rules and the snippet controls.

- **AI Overviews and AI Mode:** "robots.txt directives for Googlebot is the control for site owners to manage access to how their sites are crawled for Search. To limit the information shown from your pages in Search, use nosnippet, data-nosnippet, max-snippet, or noindex controls."
- **Google-Extended** has no user agent of its own; it governs whether crawled content is used "for training future generations of Gemini models" and "for grounding (providing content from the Google Search index to the model at prompt time …)" in Gemini Apps and Vertex AI. "Google-Extended does not impact a site's inclusion in Google Search nor is it used as a ranking signal in Google Search."
- **Google-Agent** (added 2026-03-20) "is used by agents hosted on Google infrastructure to navigate the web and perform actions upon user request". Like every user-triggered fetcher, "these fetchers generally ignore robots.txt rules". NotebookLM's fetcher became `Google-GeminiNotebook` on 2026-07-16.
- **Web Bot Auth** (experimental, added 2026-05-04): some Google-Agent requests carry an RFC 9421 signature from `https://agent.bot.goog`. It's only for verifying traffic: "We don't sign every request of a particular agent", so keep reverse-DNS checks. A site needs no change to be crawled.
- Google's crawling docs moved to developers.google.com/crawling on 2025-11-20; old Search Central links redirect.

## [WEB-041] AI usage preferences in robots.txt: the IETF aipref drafts
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [draft-ietf-aipref-attach-05](https://www.ietf.org/archive/id/draft-ietf-aipref-attach-05.txt) (2026-08-19), [draft-ietf-aipref-vocab-08](https://www.ietf.org/archive/id/draft-ietf-aipref-vocab-08.txt) (2026-09-14), [IETF datatracker: aipref](https://datatracker.ietf.org/wg/aipref/about/)
- Related: WEB-039, WEB-040

The IETF AI Preferences working group (aipref, active) is drafting one vendor-neutral way to say "don't train on this" in robots.txt and HTTP. Neither draft is an RFC yet, and no vendor page read for WEB-039 or WEB-040 says it honours them. Read from the datatracker API and the draft text, 2026-10-18.

- **Attach, rev 05** (Illyes of Google, Thomson of Mozilla): "This document defines attachment methods using the Robots Exclusion Protocol and HTTP header fields" and "updates RFC 9309". It adds a `Content-Usage` header field and robots.txt rule. Allow and Disallow still control crawling; for disallowed paths, "no preferences are implied".
- **Vocab, rev 08:** three categories, `train-ai` (AI Training), `ai-use` (AI Use) and `search` (Search).

The draft's example:

```text
User-Agent: *
Allow: /
Content-Usage: train-ai=n
```

**Use today:** per-vendor tokens (WEB-039, WEB-040) are what crawlers document honouring. Google's robots.txt spec supports only `user-agent`, `allow`, `disallow` and `sitemap` (WEB-022), so a `Content-Usage` line has no documented effect yet.

## [WEB-042] hreflang basics for a site that adds a language
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Tell Google about localized versions of your page](https://developers.google.com/search/docs/specialty/international/localized-versions) (last updated 2026-09-21), [Managing multi-regional and multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites) (2025-12-10), [Angular i18n: deploy](https://raw.githubusercontent.com/angular/angular/v22.2.3/adev/src/content/guide/i18n/deploy.md)
- Related: WEB-035, WEB-036, WEB-022

Give each language its own URL, link every version to every other with hreflang, and don't redirect by language.

**Google's rules** (read as raw text 2026-10-18)
- Three equivalent methods: `<link>` tags in the head, HTTP `Link` headers, or the sitemap (`xhtml:link`). "there's no benefit in Search" in using more than one.
- "Each language version must list itself as well as all other language versions." "If two pages don't both point to each other, the tags will be ignored."
- URLs must be fully qualified ("not //example.com/foo or /foo").
- Codes: ISO 639-1 language, optional ISO 3166-1 Alpha 2 region; "You can't specify the country code by itself", and `es-419` isn't supported. `x-default` is for when nothing matches, "designed for language selector pages".
- "Google doesn't use hreflang or the HTML lang attribute to detect the language of a page"; it reads the visible content.
- "Google recommends using different URLs for each language version". Googlebot "sends HTTP requests without setting Accept-Language". "Avoid automatically redirecting users from one language version of a site to a different language version".

**Angular conflict.** `@angular/localize` builds one app per locale under `subPath`, which fits the per-URL rule. But the i18n deploy guide says that with `outputMode: 'server'`, "Angular automatically handles redirection dynamically based on the `Accept-Language` HTTP header", which Google advises against. Which URLs it redirects, and whether that can be turned off, is not verified.

## Recommendations for our setup

Ranked by impact against effort.

1. **Done 2026-10-13: the `/seo-audit` skill** in `freek-local-skills` ([FreekMencke/claude-skills#31](https://github.com/FreekMencke/claude-skills/pull/31)): WEB-028's steps, WEB-029's finding format and a marked user agent, read-only through `disallowed-tools` and a `git status` check. WEB-028.
2. **Done 2026-10-13: osrs-tracker-web's UA-era gtag code fixed** (osrs-tracker/osrs-tracker-web#241), with consent mode the same day (osrs-tracker/osrs-tracker-web#248). Not checked: which new parameters are registered as custom dimensions in the property. WEB-024, WEB-001, WEB-034.
3. **Done 2026-10-13: read-only GA4 access** through the official GA MCP server, in osrs-tracker-web sessions only since 2026-10-14 (`kb-mcp.md` recommendation 3). WEB-006, WEB-005.
4. **Done 2026-10-13: mark audit traffic**: the skill's `probe.sh` appends `seo-audit` to the Googlebot user agent. WEB-018.
5. **Done 2026-10-13: route SEO questions to this file** ([FreekMencke/claude-skills#30](https://github.com/FreekMencke/claude-skills/pull/30)).
6. Done 2026-10-18: `/seo-audit`'s references have Google's 2025–2026 rules (FreekMencke/claude-skills#83, FreekMencke/claude-skills#91; WEB-035, WEB-037, WEB-038, WEB-039, WEB-040, WEB-042, WEB-023).
7. **Decision 2026-10-18: keep osrs-tracker-web's and freek-mencke-web's allow-all robots.txt.** Both want to appear in AI answers, and blocking a training token gains them nothing. If a site ever opts out of training only, disallow the training tokens (`GPTBot`, `Google-Extended`, `Applebot-Extended`, `meta-externalagent`, `CCBot`, `ClaudeBot`) and keep the search ones; user-triggered fetchers may ignore it anyway. WEB-039, WEB-040, WEB-020.
8. **No change: osrs-tracker-web already sends 404s and one server-side canonical** (tested 2026-10-18). WEB-036.
9. **Before adding a second language:** decide on per-locale paths with hreflang, and turn off or avoid the `Accept-Language` redirect of Angular's i18n server output. No issue until a language is planned. WEB-042.
10. **Done 2026-10-13, superseded 2026-10-14: historical server logs**, now in Grafana Cloud through the claude.ai Grafana connector with its write tools kept on purpose (INFRA recommendation 11); the cluster Loki route (FreekMencke/home-cluster#5) is gone. WEB-013, INFRA-024, INFRA-025.

## Open questions

- Does Claude Code's WebFetch obey a `robots.txt` `Disallow` for `Claude-User`? Not documented (WEB-016). A probe against a test path would settle it.
- Does an unregistered GA4 event parameter show up anywhere in the standard reports? Google implies not but doesn't say so (WEB-024). Our property registers only `description`, so a `run_report` with `customEvent:event_category` would answer it.
- Which Search Console permission does a service account need? Our Restricted user works for the API (WEB-003); Google's docs don't say (WEB-012).
- How big are the GA MCP server's tool schemas, and how much context does a `run_report` answer take? Not measured (WEB-006); it's installed now, so a `/context` check in a fresh session would show the schemas.
- How long does a resubmitted sitemap index stay pending? `sitemaps.list` for `/sitemap.xml` was still pending three days after the 2026-10-10 resubmit (WEB-032); a check on or after 2026-10-20 would show whether it is processed.
- Does Google keep the capitalised `Brand: Phrase` titles as written? osrs-tracker-web shipped them in 6c4937f on 2026-10-13; a search-results check after the next crawl of `/trackers/xp` and `/trackers/price` would confirm WEB-033's rule.
- Does `@angular/ssr` 22 answer a `**` route with 404 on its own, without `ServerRoute.status` or `RESPONSE_INIT` (WEB-036)? angular.dev's ssr.md and define-routes.md don't say; the `angular-cli` source (`packages/angular/ssr/src/app.ts`) wasn't read. A built test app would settle it.
- Which URLs does Angular's i18n `Accept-Language` redirect cover under `outputMode: 'server'`, and can it be turned off (WEB-042)? Only the deploy guide was read.
- Do the Search Console FAQ, ClaimReview and practice problem reports still exist? Google announced removal dates for ClaimReview (2025-09-09) and practice problem (January 2026), none for FAQ, yet the help pages still list practice problems on 2026-10-18 (WEB-023).
- When did OpenAI change `ChatGPT-User`'s robots.txt wording to "may not apply", and does ChatGPT's agent or Atlas use its own token (WEB-039)? The 2025 Wayback copies of the bots page are script shells, and OpenAI's publisher FAQ returned 403 to curl, a browser and WebFetch.
- Does Microsoft publish an AI training opt-out token, or say Copilot uses only bingbot (WEB-039)? Bing's crawler page lists none; third-party lists name a "Copilot-Bot" no Microsoft page confirms.
- Does any crawler honour the aipref `Content-Usage` rule yet (WEB-041)? None of the vendor pages read on 2026-10-18 mention it.
- Can Lighthouse 13.5.0 select the `agentic-browsing` category from the CLI (WEB-011)? Answered 2026-10-14: its CLI help lists it among the available categories (`cli/cli-flags.js` at v13.5.0); not run.
