# Browsers for coding agents

Prefix `BROWSER`. This file compares the browser tools a coding agent can drive (Playwright MCP, Microsoft's Playwright CLI, Vercel's agent-browser, Chrome DevTools MCP, browser-use and Claude in Chrome) by how they show a page to the model, where logins live, what guards they offer against hostile pages, and what they send home. It also holds our own token measurement of Playwright MCP against the Playwright CLI in Claude Code. It links rather than repeats: which browser route fits a check (FLOW-014), Playwright tests and Test Agents in the loop (JSTEST-012), the browser-checker subagent (REPO-021), browser profiles across sessions (SESS-013), deferred MCP tool schemas (TOK-020), Chrome DevTools MCP for WebMCP and Lighthouse (NG-018, WEB-011) and what a Playwright snapshot leaves out (WEB-015).

Research basis:
- Researched 2026-10-30 in a cloud session (Linux container), Claude Code v2.1.314, Opus 5.5 lead with a Sonnet reader on the READMEs.
- Read as raw text from shallow clones: microsoft/playwright-mcp `0c4107a` (2026-10-22), microsoft/playwright-cli `b1a5903` (2026-10-19), vercel-labs/agent-browser `099e84e` (2026-10-29), ChromeDevTools/chrome-devtools-mcp `3c609da` (2026-10-29), browser-use/browser-use `b49a68e` (2026-10-29); and code.claude.com/docs/en/chrome.md.
- Versions from the registries: `npm view @playwright/mcp`, `@playwright/cli`, `agent-browser`, `chrome-devtools-mcp` (`dist-tags`, `time[<version>]`); browser-use from PyPI JSON.
- Tested: `@playwright/mcp` 0.0.83 and `@playwright/cli` 0.1.22, installed with `npm install --ignore-scripts` on Node v22.22.0, driving Chromium 1243 from `/opt/pw-browsers`, through `claude -p` on Haiku 5.5 (BROWSER-002, BROWSER-003). agent-browser, Chrome DevTools MCP and browser-use were read, not run.
- Stars from GitHub repository search on 2026-10-30; popularity signals only.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Which browser tools can a coding agent drive? | Playwright MCP, Playwright CLI (`@playwright/cli`), agent-browser (a Rust CLI), Chrome DevTools MCP, browser-use (Python), and Claude in Chrome. All but Claude in Chrome read the page as an accessibility snapshot with element refs. | BROWSER-001 |
| Is the Playwright CLI cheaper than Playwright MCP in Claude Code? | No. Checkly (3 runs) and a DEV re-test found a tie; our test (Haiku 5.5, one task) found the CLI costlier: median 632k against 406k input tokens, partly because Claude had to find its skill. | BROWSER-002, BROWSER-003 |
| Why doesn't the "large tool schemas" argument hold? | Claude Code defers MCP tool schemas: Playwright MCP added 389 input tokens per turn (41,279 against 40,890). And MCP 0.0.83 writes snapshots to files too. | BROWSER-002 |
| What can go wrong with the CLI route? | It only works if Claude finds its skill. With Bash allowed only for `playwright-cli`, 2 of 5 runs tried `curl`, were refused and gave up; with Bash open, 1 of 5 fetched the HTML with `curl` instead. | BROWSER-003 |
| Does the agent see my logins? | Playwright MCP's default profile is persistent per workspace; the Playwright CLI keeps it in memory unless `--persistent`; agent-browser can reuse a Chrome profile; Claude in Chrome uses your real browser's logins. | BROWSER-004 |
| Is any of these a security boundary against a hostile page? | No. Playwright MCP says it "is **not** a security boundary"; its origin lists don't protect either. agent-browser has opt-in content markers, a domain allowlist and an action policy. | BROWSER-005 |
| Which send telemetry? | Chrome DevTools MCP (usage statistics, "enabled by default", off under `CI`) and browser-use (PostHog, on unless `ANONYMIZED_TELEMETRY=false`). | BROWSER-006 |
| When is Chrome DevTools MCP worth it? | For performance traces, network and console with source-mapped stacks; start it with `--no-usage-statistics` and `--no-performance-crux`. | BROWSER-007 |
| Which should we use? | Keep Playwright MCP for the browser checker; isolate it per run; don't switch to the CLI for tokens. | BROWSER-008 |
| Where do Playwright MCP's snapshots go? | Action responses link a `page-<time>.yml` file (in `--output-dir`, default `.playwright-mcp/`); an explicit `browser_snapshot` without `filename` returns it inline; `--snapshot-mode none` drops it. | BROWSER-002, WEB-015 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| BROWSER-001 | Six browser tools for agents compared | comparison | playwright-mcp, playwright-cli, agent-browser, chrome-devtools-mcp, browser-use, chrome |
| BROWSER-002 | Test: Playwright MCP against the Playwright CLI in tokens | fact | measurement, tokens, playwright-mcp, playwright-cli, haiku |
| BROWSER-003 | The CLI route depends on Claude finding its skill | fact | playwright-cli, skills, permissions, measurement |
| BROWSER-004 | Login state: where each tool keeps cookies | fact | profiles, cookies, storage-state, privacy |
| BROWSER-005 | No browser tool is a security boundary | fact | security, prompt-injection, allowlist |
| BROWSER-006 | Telemetry defaults and opt-outs | fact | telemetry, privacy, chrome-devtools-mcp, browser-use |
| BROWSER-007 | Chrome DevTools MCP: what it adds and how to start it | tool | chrome-devtools-mcp, performance, console |
| BROWSER-008 | Which browser tool for which job | recommendation | adoption, playwright-mcp, playwright-cli |

## [BROWSER-001] Six browser tools for agents compared
- Type: comparison
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [playwright-mcp README](https://github.com/microsoft/playwright-mcp/blob/0c4107a/README.md), [playwright-cli README](https://github.com/microsoft/playwright-cli/blob/b1a5903/README.md), [agent-browser README](https://github.com/vercel-labs/agent-browser/blob/099e84e/README.md), [chrome-devtools-mcp README](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/3c609da/README.md), [browser-use](https://github.com/browser-use/browser-use/tree/b49a68e), [Claude in Chrome](https://code.claude.com/docs/en/chrome)
- Related: FLOW-014, JSTEST-012, BROWSER-008

| Tool | Version (date) | Licence | Stars | Page to the model | Headless by default |
|---|---|---|--:|---|---|
| Playwright MCP | `@playwright/mcp` 0.0.83 (2026-09-28) | Apache-2.0 | 38,842 | Accessibility snapshot with refs | No ("headed by default") |
| Playwright CLI | `@playwright/cli` 0.1.22 (2026-09-28) | Apache-2.0 | 14,765 | Same snapshot, written to `.playwright-cli/page-<time>.yml` | Yes (`--headed` to show) |
| agent-browser | 0.41.0 (2026-10-29) | Apache-2.0 | 44,884 | Snapshot with refs; `-i` interactive only, `--max-output` | Yes |
| Chrome DevTools MCP | 1.12.0 (2026-10-22) | Apache-2.0 | 54,471 | "a text snapshot … based on the a11y tree", plus DevTools tools | Configurable (`--headless`) |
| browser-use | 0.13.14 (2026-10-26, PyPI) | MIT | 119,526 | A Python agent library with its own LLM loop | n/a |
| Claude in Chrome | Extension v1.0.36+ | n/a | n/a | Your real Chrome, its logins | No |

The first four are tools Claude drives; browser-use is a framework that runs its own agent, so it fits a product, not a Claude Code session. Playwright MCP and the CLI share one backend (`playwright-core`); Microsoft's README recommends the CLI for coding agents, and it ships a skill (`playwright-cli install --skills`). The unscoped npm `playwright-cli` is a different package (JSTEST-012).

## [BROWSER-002] Test: Playwright MCP against the Playwright CLI in tokens
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [playwright-mcp README: MCP vs CLI](https://github.com/microsoft/playwright-mcp/blob/0c4107a/README.md#playwright-mcp-vs-playwright-cli), [playwright-cli README](https://github.com/microsoft/playwright-cli/blob/b1a5903/README.md), [Checkly: MCP vs CLI token efficiency (2026-07-30)](https://www.checklyhq.com/blog/mcp-vs-cli-token-efficiency/)
- Related: JSTEST-012, TOK-020, BROWSER-003, REPO-021, WEB-015, MCP-017

Microsoft says CLI invocations "are more token-efficient: they avoid loading large tool schemas and verbose accessibility trees into the model context", with no figures. Checkly (2026-07-30, same task three times) found "MCP and skill-based CLI flows have more or less the same token consumption": 48k to 50k against 45k to 48k of context.

Tested 2026-10-30, v2.1.314, cloud session: `@playwright/mcp` 0.0.83 (`--headless --isolated --output-dir`) against `@playwright/cli` 0.1.22 with its bundled skill in `.claude/skills/`. Same prompt: read Item 150's price from a 200-row table page, navigate to Contact, submit a form, report the JavaScript-rendered confirmation. `claude -p --model haiku --max-turns 30`, a fresh folder per run, arms alternated. Ten MCP runs and seven CLI runs that used the browser all answered correctly.

| Median | MCP (n=10) | CLI (n=7) |
|---|--:|--:|
| Input tokens (incl. cache) | 406,493 | 631,857 |
| Cost | $0.0075 | $0.0119 |
| Turns | 11.5 | 13 |
| Seconds | 19 | 35 |

Ranges: MCP 266,922–538,210 input tokens, CLI 545,540–1,009,095. Counting all 10 CLI runs, including the 3 that never opened the browser (BROWSER-003): median 603,042 tokens and $0.0112, still about 1.5 times MCP.

Why: a one-turn baseline used 40,890 input tokens with no browser tool, 41,279 with Playwright MCP (schemas deferred, TOK-020) and 40,924 with the CLI skill. So schema cost is negligible in Claude Code. MCP 0.0.83 also links action snapshots as `page-<time>.yml` files instead of inlining them (source: `snapshotToFile`; WEB-015). The CLI arm paid for loading its 15k-character SKILL.md, `cat`ing snapshot files and exploring the shell.

Confounds: Haiku only, the CLI unnamed in the prompt, the session's own skills loaded, and two Bash permission setups. A lead, not a law.

## [BROWSER-003] The CLI route depends on Claude finding its skill
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [playwright-cli README](https://github.com/microsoft/playwright-cli/blob/b1a5903/README.md), [Skills](https://code.claude.com/docs/en/skills)
- Related: BROWSER-002, SKILL-001, PROMPT-003, TOK-020

An MCP server's tools are listed to the model as browser tools; the CLI is reached through Bash and a skill the model must choose to load. In the BROWSER-002 runs (same prompt, "Using the browser, …", Haiku 5.5, v2.1.314):

- **Bash allowed only as `Bash(playwright-cli:*)`:** 2 of 5 CLI runs first tried `curl` to check the server, were refused, and stopped with "no browser tools are available in this session". Neither loaded the skill. All 5 MCP runs succeeded.
- **Bash allowed in full:** 1 of 5 CLI runs fetched the HTML with `curl` and read the confirmation text out of the page's script instead of rendering it; the answer was right but no browser ran. Two runs ran `cd /tmp` first, so their snapshots landed outside the project, and one found and pointed the CLI at the installed Chromium itself.
- Several CLI answers began "the built-in browser tools weren't available".

So with the CLI, name it in the prompt or the CLAUDE.md line ("check pages with `playwright-cli`"), and allow the shell commands it needs around it. With MCP, "use the browser" is enough.

## [BROWSER-004] Login state: where each tool keeps cookies
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [playwright-mcp README: profiles](https://github.com/microsoft/playwright-mcp/blob/0c4107a/README.md), [playwright-cli README](https://github.com/microsoft/playwright-cli/blob/b1a5903/README.md), [agent-browser README](https://github.com/vercel-labs/agent-browser/blob/099e84e/README.md), [Claude in Chrome](https://code.claude.com/docs/en/chrome)
- Related: SESS-013, BROWSER-005, FLOW-014

- **Playwright MCP:** "You can run Playwright MCP with persistent profile like a regular browser (default)". In 0.0.83's source (`createUserDataDir`) it lives at `~/.cache/ms-playwright-mcp/mcp-<browser>-<hash of the client's cwd>` on Linux; the README's `ms-playwright/` path and its options-table line are stale. It "can only be used by one browser instance at a time"; a second client gets "Browser is already in use". `--isolated` keeps it in memory; `--storage-state <path>` loads cookies into an isolated context.
- **Playwright CLI:** "keeps the browser profile in memory by default"; `--persistent` or `--profile` saves it. A headless session "shuts down on its own after an hour without commands".
- **agent-browser:** profiles, `--state <path>` files and a local vault: "Store credentials locally (always encrypted), reference by name. The LLM never sees passwords." Its README warns "State files contain session tokens in plaintext" unless `AGENT_BROWSER_ENCRYPTION_KEY` is set.
- **Claude in Chrome:** "shares your browser's login state, so it can access any site you're already signed into"; it pauses at login pages and CAPTCHAs.

So a default Playwright MCP install accumulates logins across sessions in one workspace profile. Use `--isolated` for checkers that don't need them (also avoids SESS-013's profile conflict), and a storage-state file for one test account.

## [BROWSER-005] No browser tool is a security boundary
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [playwright-mcp README](https://github.com/microsoft/playwright-mcp/blob/0c4107a/README.md), [playwright-cli README](https://github.com/microsoft/playwright-cli/blob/b1a5903/README.md), [agent-browser README: security](https://github.com/vercel-labs/agent-browser/blob/099e84e/README.md), [chrome-devtools-mcp README](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/3c609da/README.md)
- Related: MCP-019, PROMPT-033, BROWSER-004

Every page the agent reads is untrusted text in its context (the lethal trifecta, MCP-019).

- **Playwright MCP:** "Playwright MCP is **not** a security boundary." `--allowed-origins` "*does not* serve as a security boundary and *does not* affect redirects".
- **Playwright CLI:** tool names and descriptions a page exposes through WebMCP "come from the page and are untrusted input".
- **Chrome DevTools MCP:** it "exposes content of the browser instance to the MCP clients allowing them to inspect, debug, and modify any data in the browser or DevTools".
- **agent-browser** has the most guards, all opt-in:
  - `--content-boundaries` wraps page output "so LLMs can distinguish tool output from untrusted content".
  - `--allowed-domains` restricts navigation.
  - `--action-policy` gates destructive actions; a missing or invalid policy file "blocks every command except `close`".
  - `--confirm-actions eval,download` asks before those actions.
  - `--max-output` caps output.
  - Its `--remote-debugging-port` setup "exposes full browser control on localhost".

What actually limits damage is what the agent can reach: an isolated profile without logins (BROWSER-004), a test account, and no secrets in the session's environment.

## [BROWSER-006] Telemetry defaults and opt-outs
- Type: fact
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [chrome-devtools-mcp README: usage statistics](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/3c609da/README.md), [browser-use config.py](https://github.com/browser-use/browser-use/blob/b49a68e/browser_use/config.py), [browser-use telemetry service](https://github.com/browser-use/browser-use/blob/b49a68e/browser_use/telemetry/service.py)
- Related: BROWSER-007, DSKILL-015, MCP-019, SKPACK-003

- **Chrome DevTools MCP:** "Google collects usage statistics (such as tool invocation success rates, latency, and environment information)". "Data collection is **enabled by default**"; opt out with `--no-usage-statistics`. "Collection is disabled if `CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS` or `CI` env variables are set." Separately, "Performance tools may send trace URLs to the Google CrUX API" (`--no-performance-crux`), and it checks npm for updates (`CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS`).
- **browser-use:** `ANONYMIZED_TELEMETRY` defaults to true and events go to PostHog's EU host; the device ID comes from an env var, a persisted ID or a machine fingerprint. Set `ANONYMIZED_TELEMETRY=false`.
- **Playwright MCP and CLI:** no telemetry statement in either README.
- **agent-browser:** no mention in its README, and a grep of its `.rs` and `.ts` files for "telemetry" and "posthog" found nothing.

Absence covers only what was read and grepped at the pinned commits.

## [BROWSER-007] Chrome DevTools MCP: what it adds and how to start it
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [chrome-devtools-mcp README](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/3c609da/README.md)
- Related: NG-018, WEB-011, WEBPERF-001, BROWSER-006

Google's server (1.12.0, Puppeteer-based) is for debugging, not just driving: performance traces with insights, network requests, console messages with source-mapped stacks, heap snapshots and WebMCP (NG-018), on top of navigation, clicks and a text snapshot. `--slim` "exposes a reduced set of tools" for basic browsing.

Start it without the data it sends by default (BROWSER-006):

```json
"chrome-devtools": {
  "command": "npx",
  "args": ["-y", "chrome-devtools-mcp@1.12.0", "--no-usage-statistics", "--no-performance-crux"]
}
```

Pin the version instead of `@latest`. Use it when a question is about why a page is slow or what the console says (WEB-011 used it for Lighthouse); for "click through and check the page", Playwright MCP is enough (BROWSER-008).

## [BROWSER-008] Which browser tool for which job
- Type: recommendation
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [playwright-mcp README](https://github.com/microsoft/playwright-mcp/blob/0c4107a/README.md), [chrome-devtools-mcp README](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/3c609da/README.md)
- Related: BROWSER-002, BROWSER-003, BROWSER-004, BROWSER-006, REPO-021, FLOW-014, UIREV-011, MCP-028

Our judgement from the entries above.

- **Interactive page checks (`ui-review`, the browser checker):** keep Playwright MCP. In Claude Code the CLI is not cheaper: a tie in two outside tests, costlier in ours (BROWSER-002), and it needs naming to be found (BROWSER-003). Run it `--isolated` unless a login is needed, and `--headless` when nobody watches.
- **The Playwright CLI:** for scripted steps a session runs repeatedly (open, screenshot, close) where the commands are known, or for an agent harness without deferred MCP schemas, where Microsoft's argument applies. Name it explicitly.
- **Performance and console debugging:** Chrome DevTools MCP with `--no-usage-statistics --no-performance-crux` (BROWSER-007).
- **agent-browser:** worth a look when pages are hostile or logins sensitive (its vault and action policy, BROWSER-005). Not run here.
- **browser-use:** not for Claude Code sessions; it's a framework for building your own browsing agent.
- **Claude in Chrome:** only where a real logged-in browser is the point; not in WSL (FLOW-014).

## Recommendations for our setup

Ranked by impact against effort.

1. **Keep Playwright MCP for `ui-review` and the browser checker; don't switch to the CLI to save tokens** (BROWSER-002, BROWSER-008). Recorded as a decision.
2. Done 2026-10-14 for the browser checker: it runs `@playwright/mcp@0.0.83 --headless --isolated` (REPO-021, MCP-028). `ui-review` uses the plugin's Playwright server with its persistent per-cwd profile (BROWSER-004); its own `--isolated` server is optional.
3. **If Chrome DevTools MCP is added, pin it and pass `--no-usage-statistics --no-performance-crux`** (BROWSER-006, BROWSER-007).

## Open questions

- **The token gap on other models and pages:** one task, Haiku 5.5 only (BROWSER-002). A Sonnet or Opus run, and a page with heavier snapshots, would show whether the order holds.
- **agent-browser's token use:** not run here; its snapshot filters (`-i`, `--max-output`) might change BROWSER-002's order (BROWSER-008).
- **Whether `--snapshot-mode none` makes Playwright MCP cheaper still** for checks that read files instead (BROWSER-002).
- **Microsoft's own numbers for the CLI claim:** none found in either README; Checkly found a tie (BROWSER-002).
- **A cleaner rerun:** a CLI arm that names `playwright-cli` in the prompt, with the session's own skills and plugins off (BROWSER-002, BROWSER-003).
