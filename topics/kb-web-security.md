# Security of agent-written web code

Prefix `WEBSEC`. This file covers the security of web code an agent writes for an Angular SSR (Express 5) and NestJS 12 stack:

- the OWASP Top 10:2025 and what it means for that stack;
- security headers from helmet 8 and Nest 12.1's `useSecurityHeaders()`;
- a per-request CSP nonce in Angular SSR, and the CSP details that decide whether it works;
- Express and Nest defaults that leak or allow too much;
- SSRF in outbound `fetch`;
- cookie defaults, and CSRF with Angular's XSRF helper and Nest 12.1's `enableCsrfProtection()`;
- Angular's sanitizer, `bypassSecurityTrust*` and Trusted Types;
- what coding agents get wrong, what `/security-review`, the security-guidance and Claude Security plugins check, and the deterministic rules and log redaction that back them up.

CI and package supply chain live in `kb-github-actions.md` and `kb-npm.md`; reviewer agents in `kb-repo-agents.md`; guard hooks in `kb-hooks.md`.

Research basis:
- Researched 2026-10-18 (FreekMencke/claude-kb#192, part of roadmap #167) by an Opus 5.5 lead with three Sonnet readers (OWASP and SSRF; CSP, headers and cookies; agent mistakes and review tools).
- Read as raw text:
  - the OWASP Top 10:2025 pages and README (OWASP/Top10 `master`) and the OWASP cheat sheets (OWASP/CheatSheetSeries `master`);
  - Angular's security guide (angular/angular `main`) and `@angular/ssr`'s source at angular-cli `v22.2.3`;
  - helmet's README and CHANGELOG;
  - MDN's CSP and cookie pages (mdn/content `main`), `@mdn/browser-compat-data` 8.1.6 and `web-features` 3.43.0;
  - the cookies draft `draft-ietf-httpbis-rfc6265bis-22` and RFC 9111;
  - Express 5.3.0's source, body-parser and express-session READMEs;
  - Nest's docs (nestjs/docs.nestjs.com `master`), and `@nestjs/common` 12.1.3's typings;
  - undici 7.29.1's fetch source, and Node v24.x's `net`, `dns` and globals docs;
  - Claude Code's `security-guidance`, `claude-security` and `commands` pages (`code.claude.com/docs/en/<page>.md`);
  - anthropics/claude-plugins-official (`main` at `ea10b21`, 2026-10-16) and anthropics/claude-code-security-review;
  - CodeQL's JavaScript query list on docs.github.com, Semgrep's Angular rule, and the OpenSSF guide for AI code assistants;
  - Veracode's 2025-07-30 press release.
- Versions and dates come from the npm registry (`npm view <pkg> dist-tags`, `npm view <pkg> 'time[<version>]'`).
- Tested on Node 24.21.0 (undici 7.29.1), WSL2 x64, with packages installed by `npm install --ignore-scripts`:
  - helmet 8.3.0 on express 5.3.0;
  - Nest 12.1.3 on its pinned express 5.2.1;
  - Node's `fetch` redirects and URL parsing;
  - `net.BlockList.PRIVATE_RANGES`.
- Our apps were read to pick the questions that matter. This file describes them by pattern only.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| What changed in the OWASP Top 10:2025? | Two new categories, A03 Software Supply Chain Failures (widening A06:2021) and A10 Mishandling of Exceptional Conditions, and SSRF folded into A01 Broken Access Control. Security Misconfiguration rose from #5 to #2. The repo marked it final on 2025-12-24. | WEBSEC-001 |
| Which Top 10:2025 items matter for an Angular SSR + Nest app? | A01 (SSRF, CSRF, CORS), A02 (headers, stack traces in errors), A05 (XSS through Angular's escape hatches), A09 (secrets in logs) and A10 (a global handler that fails closed). | WEBSEC-002 |
| What does `helmet()` send by default, and what's missing? | A CSP with `script-src 'self'` and `style-src 'self' https: 'unsafe-inline'`, HSTS for a year with `includeSubDomains`, CORP and COOP `same-origin`, `nosniff`, `X-Frame-Options: SAMEORIGIN`, and it removes `X-Powered-By`. No `Permissions-Policy`, no HSTS `preload`, no COEP. Nest 12.1's `app.useSecurityHeaders()` sends the same set but takes no per-request nonce. | WEBSEC-003 |
| How do I give an Angular SSR page a per-request CSP nonce? | `@angular/ssr` 22.2.3 has no request-time nonce API, and `autoCsp` doesn't work with SSR. Put a placeholder in `ngCspNonce` in `index.html`, make a fresh `randomBytes(16)` nonce per response, put it in the CSP with a helmet function directive, and replace the placeholder only inside `nonce` attributes. Drop the ETag and `Content-Length`. | WEBSEC-004 |
| Does `'unsafe-inline'` still matter next to a nonce? | In a directive with a nonce or hash, browsers ignore `'unsafe-inline'`; `'unsafe-eval'` still works. `'strict-dynamic'` lets nonced scripts load chunks. `frame-ancestors`, reporting and report-only don't work in a `<meta>` CSP. | WEBSEC-005 |
| Which Express and Nest defaults leak? | Express sends `X-Powered-By` and puts the stack in 500 responses unless `NODE_ENV=production`. Nest's `enableCors()` with no options answers `Access-Control-Allow-Origin: *` for all methods. Both cap JSON bodies at 100 KB. `trust proxy` is off. | WEBSEC-006 |
| How do I stop SSRF in a server-side `fetch`? | Build the URL from an allow-listed origin, compare `URL.parse(u).origin` rather than a string prefix, pass `redirect: 'error'` (fetch follows 20 redirects by default, to any host), and set a timeout and a size cap. To allow any host, check every resolved IP and connect to that IP. | WEBSEC-007 |
| What cookie attributes do I get by default? | Express's `res.cookie('a','1')` sends only `Path=/`. express-session sets `HttpOnly` but not `Secure` or `SameSite`. Only Chromium treats a missing `SameSite` as `Lax`, so set `HttpOnly; Secure; SameSite=Lax` and prefer a `__Host-` name. | WEBSEC-008 |
| Is Angular's XSRF support enough against CSRF? | No: `HttpClient` only copies the `XSRF-TOKEN` cookie into `X-XSRF-TOKEN`, and the server must set and check it. Nest 12.1's `app.enableCsrfProtection()` checks `Sec-Fetch-Site` and `Origin` instead, without tokens. | WEBSEC-009 |
| When is `[innerHTML]` safe, and when is `bypassSecurityTrust*` acceptable? | `[innerHTML]` goes through Angular's sanitizer, which drops scripts. `bypassSecurityTrust*` turns that off for the value, so use it only on a value your code built from a constant, never on input. Trusted Types (Baseline since 2026-02-24) can enforce this. | WEBSEC-010 |
| What do coding agents get wrong in web security? | In Veracode's 2025 test of 100+ LLMs, models failed to prevent XSS in 86% and log injection in 88% of cases. Typical slips: the escape hatch to make HTML render, loosening a CSP to silence a console error, wildcard CORS, logging tokens, hard-coded secrets. | WEBSEC-011 |
| Does `/security-review` catch a loosened CSP or wildcard CORS? | Unlikely: it excludes "A lack of hardening measures" and log spoofing, and names no headers, CSP or CORS. The security-guidance plugin's review rates missing headers as medium at most. Keep such rules in the repo's reviewer rules or a static check. | WEBSEC-012 |
| Which deterministic checks catch these mistakes? | CodeQL's default JS suite: SSRF, permissive CORS, insecure helmet configuration, missing CSRF middleware, clear-text logging. Semgrep and CodeQL both flag `bypassSecurityTrust*`; angular-eslint 22 has no security rule. security-guidance's custom `security-patterns` rules warn on edit. | WEBSEC-013 |
| How do I keep secrets out of Nest logs? | `ConsoleLogger`'s `redact` option (present in `@nestjs/common` 12.1.3, not in 12.1.0) or pino's `redact` paths. Neither masks secrets inside string messages, so never interpolate a token into a message. | WEBSEC-013 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| WEBSEC-001 | OWASP Top 10:2025: what changed from 2021 | fact | owasp, top-10, ssrf, supply-chain, exceptional-conditions |
| WEBSEC-002 | The Top 10:2025 for an Angular SSR and NestJS app | recommendation | owasp, angular, nestjs, ssr, threat-model |
| WEBSEC-003 | Security headers: helmet 8.3 and Nest 12.1's `useSecurityHeaders()` | fact | helmet, security-headers, hsts, permissions-policy, corp, nestjs |
| WEBSEC-004 | A per-request CSP nonce in Angular SSR | pattern | csp, nonce, angular, ssr, ngcspnonce, beasties |
| WEBSEC-005 | CSP details that decide whether a nonce policy works | fact | csp, strict-dynamic, unsafe-inline, report-to, meta |
| WEBSEC-006 | Express 5 and Nest 12 defaults that leak or allow too much | fact | express-5, nestjs, cors, error-handling, x-powered-by, body-limit |
| WEBSEC-007 | SSRF in outbound `fetch` from Node | pattern | ssrf, fetch, undici, redirects, blocklist, dns-rebinding |
| WEBSEC-008 | Cookie defaults: Express, express-session and browsers | fact | cookies, samesite, httponly, host-prefix, express-session |
| WEBSEC-009 | CSRF: Angular's XSRF client half and Nest 12.1's `enableCsrfProtection()` | fact | csrf, xsrf, fetch-metadata, sec-fetch-site, angular, nestjs |
| WEBSEC-010 | Angular XSS: the sanitizer, `bypassSecurityTrust*` and Trusted Types | fact | xss, angular, domsanitizer, bypasssecuritytrust, trusted-types |
| WEBSEC-011 | What coding agents get wrong in web security | anti-pattern | agents, xss, csp, cors, secrets, logging |
| WEBSEC-012 | What `/security-review`, security-guidance and Claude Security check | comparison | security-review, security-guidance, claude-security, review |
| WEBSEC-013 | Deterministic checks and log redaction behind the model reviews | tool | codeql, semgrep, eslint, security-patterns, redaction, logging |

## [WEBSEC-001] OWASP Top 10:2025: what changed from 2021
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Top 10:2025 Introduction](https://raw.githubusercontent.com/OWASP/Top10/master/2025/docs/en/0x00_2025-Introduction.md), [OWASP/Top10 README](https://raw.githubusercontent.com/OWASP/Top10/master/README.md), [OWASP Top Ten project page](https://owasp.org/www-project-top-ten/), [OWASP/Top10 commit history for 2025](https://github.com/OWASP/Top10/commits/master/2025)
- Related: WEBSEC-002

The 2025 list keeps the format: 248 CWEs in 10 categories, eight ranked from contributed data and two from a community survey.

1. A01 Broken Access Control: still #1. SSRF "has been rolled into this category" (40 CWEs).
2. A02 Security Misconfiguration: up "from #5 in 2021".
3. A03 Software Supply Chain Failures: "an expansion of A06:2021-Vulnerable and Outdated Components" to build systems and distribution. Fewest occurrences in the data, "but also the highest average exploit and impact scores".
4. A04 Cryptographic Failures.
5. A05 Injection, which includes XSS.
6. A06 Insecure Design.
7. A07 Authentication Failures (renamed).
8. A08 Software or Data Integrity Failures.
9. A09 Security Logging & Alerting Failures, renamed because "Great logging with no alerting is of minimal value".
10. A10 Mishandling of Exceptional Conditions, new (24 CWEs): "improper error handling, logical errors, failing open".

**Status.** The repo README reads "OWASP Top 10 2025 - RELEASED" and "(Final)", and the project page calls it "The most current released version".
- A commit of 2025-12-13 still called it "a release candidate"; "Removed RC from ttitle" followed on 2025-12-24.
- No dated owasp.org announcement was found. The "November 2025" release date some summaries give wasn't confirmed.

**Small conflict.** The A01 page's table gives an incidence of 3.74%, while the introduction says 3.73%.

## [WEBSEC-002] The Top 10:2025 for an Angular SSR and NestJS app
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [A01](https://raw.githubusercontent.com/OWASP/Top10/master/2025/docs/en/A01_2025-Broken_Access_Control.md), [A02](https://raw.githubusercontent.com/OWASP/Top10/master/2025/docs/en/A02_2025-Security_Misconfiguration.md), [A09](https://raw.githubusercontent.com/OWASP/Top10/master/2025/docs/en/A09_2025-Security_Logging_and_Alerting_Failures.md), [A10](https://raw.githubusercontent.com/OWASP/Top10/master/2025/docs/en/A10_2025-Mishandling_of_Exceptional_Conditions.md), [SSRF Prevention Cheat Sheet](https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.md)
- Related: WEBSEC-001, NG-008, GHA-023, NPM-013

Where each category bites in this stack, and where the detail is:

| Category | In an Angular SSR + Nest app | Entries |
|---|---|---|
| A01 | SSRF in server-side `fetch` and in the `Host` header Angular renders for; CSRF; CORS. A01's page has no SSRF bullet: "CWE-918" is only mapped, and the prevention steps are in the cheat sheet. | WEBSEC-007, NG-008, WEBSEC-009, WEBSEC-006 |
| A02 | "The server does not send security headers", and "Error handling reveals stack traces". | WEBSEC-003, WEBSEC-006 |
| A03 | Dependencies, install scripts, CI actions. | NPM-004, NPM-013, GHA-009, GHA-023 |
| A05 | XSS through Angular's escape hatches; validated input. | WEBSEC-010, NEST-007 |
| A09 | Logging "sensitive information that should not be logged", and log data that isn't "encoded correctly". | WEBSEC-013 |
| A10 | Have "a global exception handler", and "Always fail closed". | WEBSEC-006 |

For an agent, the useful order is A02, A01, then A05:
- **A02:** headers and error handlers are one-time server setup that agents often skip.
- **A01:** SSRF and CORS appear whenever an agent adds a proxy or an API route.
- **A05:** Angular escapes by default, so XSS needs one of a few named APIs, which a reviewer can grep for.

## [WEBSEC-003] Security headers: helmet 8.3 and Nest 12.1's `useSecurityHeaders()`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [helmet README](https://raw.githubusercontent.com/helmetjs/helmet/main/README.md), [helmet CHANGELOG](https://raw.githubusercontent.com/helmetjs/helmet/main/CHANGELOG.md), [Nest docs: Security headers](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/security/helmet.md), [hstspreload.org](https://hstspreload.org/), web-features 3.43.0 (`permissions-policy`), npm registry (`npm view helmet dist-tags`, `npm view helmet 'time[8.3.0]'`)
- Related: WEBSEC-004, WEBSEC-005, OG-009

helmet 8.3.0 is `latest` (CHANGELOG date 2026-07-11). `helmet()` sends:
- `Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- COOP and CORP `same-origin`, `Origin-Agent-Cluster: ?1`, `Referrer-Policy: no-referrer`
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 0`
- It also removes `X-Powered-By`.

How to change it:
- Your CSP directives "are merged into a default policy", and a directive you set replaces that directive's default.

What it leaves out:
- `Permissions-Policy`, which helmet never sets. It isn't Baseline (Chromium 108+ only), so it's a cheap extra, not a guarantee.
- HSTS `preload`. hstspreload.org needs `max-age` of at least `31536000`, `includeSubDomains` and `preload`, and warns that removal "tends to be slow and painful".
- COEP, "not set by default" since 7.0.0.

CORP `same-origin` blocks other sites from embedding your images (OG-009).

**Nest 12.1:** "Starting with NestJS v12.1, Nest can set these headers for you with `app.useSecurityHeaders()`", "the same defaults as Helmet 8". But function directives, "which Helmet accepts to generate per-request nonces, are not supported". For an SSR nonce, use helmet itself (WEBSEC-004).

Tested 2026-10-18, Node 24.21.0:
- helmet 8.3.0 on express 5.3.0 sent exactly the headers above.
- Nest 12.1.3's `useSecurityHeaders()` sent the same headers.

## [WEBSEC-004] A per-request CSP nonce in Angular SSR
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Angular security guide: CSP](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/guide/security.md), [`@angular/ssr` `app.ts` at v22.2.3](https://github.com/angular/angular-cli/blob/v22.2.3/packages/angular/ssr/src/app.ts), [build `nonce.ts` at v22.2.3](https://github.com/angular/angular-cli/blob/v22.2.3/packages/angular/build/src/utils/index-file/nonce.ts), [angular/angular-cli#32684](https://github.com/angular/angular-cli/issues/32684), [beasties README](https://github.com/danielroe/beasties), [helmet README](https://raw.githubusercontent.com/helmetjs/helmet/main/README.md), [RFC 9111 §3.2](https://www.rfc-editor.org/rfc/rfc9111.html#section-3.2)
- Related: WEBSEC-003, WEBSEC-005, WEBPERF-007, WEBPERF-012

The guide says "You cannot use `autoCsp` with server-side rendering". `@angular/ssr` 22.2.3 has no request-time nonce either:
- The build reads `ngCspNonce` from `index.html` once and copies it onto every `<script>`, `<style>`, stylesheet and modulepreload `<link>`.
- `app.ts` passes that build-time `nonce` to beasties, which inlines critical CSS with `preload: 'media-script'`: one nonced inline script, no `onload` attributes. So `script-src-attr 'none'` is fine.
- Angular's own e2e test checks that the placeholder survives into the SSR response.

The recipe, from a maintainer in #32684 (closed "not planned"):
1. `index.html`: `<app-root ngCspNonce="CSP_NONCE_PLACEHOLDER">`.
2. Per response: `res.locals.cspNonce = randomBytes(16).toString('base64')`.
3. helmet: `scriptSrc: ["'self'", (req, res) => \`'nonce-${res.locals.cspNonce}'\`]` (WEBSEC-003).
4. After `angularApp.handle(req)`, replace the placeholder in the body and drop `content-length`. The maintainer used `replaceAll` on the token anywhere. Match only `nonce="…"` and `ngcspnonce="…"` attributes, so page text that contains the token is never touched.
5. Drop the ETag and ignore `If-None-Match`. A 304 makes caches "add each header field in the provided response to the stored response" (RFC 9111), so a revived page's old nonce meets the new CSP and its scripts are blocked.
6. Never let a CDN cache this HTML: "every subsequent visitor receives the same 'unique' value" (guide). Use `no-cache`, not `no-store` (WEBPERF-012).

Pages cached in the server's own memory work the same way: store them with the placeholder and replace it per response.

## [WEBSEC-005] CSP details that decide whether a nonce policy works
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [MDN: Content Security Policy guide](https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/http/guides/csp/index.md), [MDN: frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors), [MDN: report-uri](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/report-uri), web-features 3.43.0 (`reporting-csp-violations`)
- Related: WEBSEC-004, WEBPERF-007

From MDN's CSP guide:
- **Nonces.** "A `nonce` is the recommended approach for restricting the loading of `<script>` and `<style>` resources", and "the nonce must be different for every HTTP response, and must not be predictable."
- **`'unsafe-inline'` is inert beside a nonce.** "If a directive contains nonce or hash expressions, then the `unsafe-inline` keyword is ignored by browsers." But "the `unsafe-eval` keyword does still work" there. So adding `'unsafe-inline'` next to a nonce fixes nothing, and `'unsafe-eval'` silently weakens the policy.
- **`'strict-dynamic'`.** A nonced script may load further scripts without a nonce, which suits lazy-loaded Angular chunks. MDN warns: "It does make your CSP less secure", if a trusted script builds `<script>` elements from XSS-prone input. Browsers that support it ignore `'self'` and host sources in that directive.
- **`<meta>` delivery** "does not support all CSP features": `frame-ancestors`, `report-to` and `report-uri` are ignored there, and "a report-only policy cannot be delivered in a `<meta>` element". Angular's `autoCsp` writes a `<meta>` policy, so send those directives as a header.
- **Reporting.** Use `report-to` with a `Reporting-Endpoints` header. `report-uri` "is deprecated, but you should declare both until `report-to` is supported in all browsers". web-features 3.43.0 lists CSP violation reporting as Baseline newly available since 2026-03-24 (Firefox 149, Safari 18.4).
- **Rolling out.** `Content-Security-Policy-Report-Only` can run beside the enforced header; "both policies are honored".
- **Inline handlers** (`onclick=`) and `javascript:` URLs stay blocked under a nonce policy, and must be refactored out.

## [WEBSEC-006] Express 5 and Nest 12 defaults that leak or allow too much
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [express v5.3.0 `lib/application.js`](https://github.com/expressjs/express/blob/v5.3.0/lib/application.js), [Express: behind proxies](https://expressjs.com/en/guide/behind-proxies.html), [body-parser README](https://raw.githubusercontent.com/expressjs/body-parser/master/README.md), [Nest docs: CORS](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/security/cors.md), [cors README](https://raw.githubusercontent.com/expressjs/cors/master/README.md), [Nest docs: exception filters](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/exception-filters.md)
- Related: WEBSEC-002, WEBSEC-003, NEST-010, NEST-011

**Express 5:**
- `X-Powered-By: Express` is on (`this.enable('x-powered-by')`). Remove it with `app.disable('x-powered-by')` or helmet.
- The default error handler puts the stack trace and the error message in the 500 page unless `NODE_ENV=production`. Add your own last error handler that logs the error and sends a generic body.
- `trust proxy` is off: `req.ip` is the socket address. Behind one proxy, set it to the hop count, not `true`. With `true`, "the last reverse proxy trusted" must overwrite `X-Forwarded-For`, `-Host` and `-Proto`.
- body-parser's `limit` defaults to `'100kb'`.

**Nest 12:**
- `app.enableCors()` with no options uses the cors package's defaults: `"origin": "*"` and `GET,HEAD,PUT,PATCH,POST,DELETE`. Pass an explicit `origin` list, with no dev origins in production.
- For an error that isn't an `HttpException`, the response is `{"statusCode":500,"message":"Internal server error"}`. The original message and stack go to the log only.
- One caveat (docs): an error shaped like http-errors' (`statusCode` and `message`) is sent back as is.

Tested 2026-10-18, Node 24.21.0:
- **express 5.3.0:** a thrown error's message and stack were in the 500 body with `NODE_ENV` unset, and absent with `production`.
- **Nest 12.1.3 (express 5.2.1):**
  - `enableCors()` answered `Origin: https://evil.example` with `access-control-allow-origin: *`, and a `DELETE` preflight with 204.
  - An unknown error gave the generic 500.
  - A 200 KB JSON body gave 413.
  - `x-powered-by: Express` was present.

## [WEBSEC-007] SSRF in outbound `fetch` from Node
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [OWASP SSRF Prevention Cheat Sheet](https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.md), [undici v7.29.1 `fetch/index.js`](https://github.com/nodejs/undici/blob/v7.29.1/lib/web/fetch/index.js), [Node v24 `net` docs](https://raw.githubusercontent.com/nodejs/node/v24.x/doc/api/net.md), [undici Client docs: `connect`](https://raw.githubusercontent.com/nodejs/undici/main/docs/docs/api/Client.md)
- Related: WEBSEC-002, NG-008, WEBSEC-012

Node's `fetch` (undici 7.29.1 in Node 24.21.0) defaults to `redirect: 'follow'` and gives up only when "redirect count is 20". An allow-listed first hop can therefore 302 to `169.254.169.254` or `127.0.0.1`.

For a fixed set of hosts, the cheat sheet's first case:
1. Don't accept whole URLs. "Match the host against an allowlist, and build the request yourself."
2. If a URL must come in, compare the parsed origin (`URL.parse(u)?.origin === allowed`) and reject credentials. A prefix check (`startsWith`) passes `https://allowed.example.com.evil.test` and `https://allowed.example.com@evil.test`.
3. Pass `redirect: 'error'`, or `'manual'` and re-validate each hop.
4. Set `AbortSignal.timeout()` and cap the body size; request `identity` encoding if the cap is on the wire size.

For any host (webhooks, link previews):
- Resolve every A and AAAA record and check each against the blocked ranges.
- Then connect to the checked IP: "A second, unchecked DNS lookup between validation and connection can bypass these checks". With undici, a custom `connect.lookup` on a `dispatcher` runs the check on the lookup the connection actually uses.
- `net.BlockList.PRIVATE_RANGES` (added in v24.21.0) covers RFC 1918, loopback, link-local and ULA, but not `0.0.0.0/8`, CGNAT `100.64.0.0/10` or multicast, which the cheat sheet's minimum list includes.

Tested 2026-10-18, Node 24.21.0:
- A 302 to a `127.0.0.1` server was followed and returned its body.
- 21 chained redirects failed with "redirect count exceeded".
- `redirect: 'error'` threw "unexpected redirect".
- The two prefix tricks above passed `startsWith` but failed the origin compare.
- `PRIVATE_RANGES` matched `169.254.169.254` and `::ffff:127.0.0.1`, not `100.64.0.1` or `0.0.0.0`.

## [WEBSEC-008] Cookie defaults: Express, express-session and browsers
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [MDN: Set-Cookie](https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/http/reference/headers/set-cookie/index.md), [MDN: Using HTTP cookies](https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/http/guides/cookies/index.md), @mdn/browser-compat-data 8.1.6 (`http/headers/Set-Cookie.json`), [express-session README](https://raw.githubusercontent.com/expressjs/session/master/README.md), [draft-ietf-httpbis-rfc6265bis-22](https://www.ietf.org/archive/id/draft-ietf-httpbis-rfc6265bis-22.txt), [IETF datatracker](https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/), [jshttp/cookie v2.0.0](https://github.com/jshttp/cookie/releases/tag/v2.0.0)
- Related: WEBSEC-009

**Server defaults:**
- Express 5.3.0's `res.cookie()` sets only `Path=/`.
- express-session 1.19.0 (2026-01-22) defaults to `{ path: '/', httpOnly: true, secure: false, maxAge: null }`, with `sameSite` "By default, this is `false`" (no attribute) and the name `connect.sid`.
- Its `MemoryStore` "is _purposely_ not designed for a production environment".
- With `secure: true` behind a proxy, set `trust proxy` (WEBSEC-006).

**Browser defaults:**
- MDN's guide says a cookie without `SameSite` "is treated as `Lax` by default". The Set-Cookie page says only "Some browsers". The compat data agrees with the Set-Cookie page: Lax-by-default is in Chrome 80 and Edge 86, behind a preference in Firefox and absent in Safari. Set `SameSite` explicitly.

**What to send:**
- An auth cookie: `HttpOnly; Secure; SameSite=Lax; Path=/`, named `__Host-…`. That prefix requires `Secure`, an HTTPS origin, `Path=/` and no `Domain`. `__Secure-` requires only `Secure`.
- `SameSite=None` needs `Secure`.
- `Partitioned` (CHIPS) is Chromium 114+ and not Baseline in web-features 3.43.0; browser-compat-data 8.1.6 also lists Firefox 141 and Safari 26.2 (INDEX Conflicts).

**Lifetime cap.** draft-ietf-httpbis-rfc6265bis-22 (1 December 2025, not yet an RFC on 2026-10-18) has browsers cap `Expires` and `Max-Age`: "The limit SHOULD NOT be greater than 400 days". MDN's two pages don't state the cap.

**The `cookie` package.** Version 2.0.0 (2026-06-24) went ESM-only and Node 22+, and renamed `parse` and `serialize` to `parseCookie` and `stringifySetCookie`. It changed no attribute defaults. express 5.3.0 and express-session 1.19.0 still use `cookie` 0.7.x.

Tested 2026-10-18, express 5.3.0, Node 24.21.0: `res.cookie('a','1')` sent `a=1; Path=/`.

## [WEBSEC-009] CSRF: Angular's XSRF client half and Nest 12.1's `enableCsrfProtection()`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Angular security guide: HttpClient XSRF](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/guide/security.md), [Nest docs: CSRF protection](https://raw.githubusercontent.com/nestjs/docs.nestjs.com/master/content/security/csrf.md), [OWASP Top 10:2025 A01](https://raw.githubusercontent.com/OWASP/Top10/master/2025/docs/en/A01_2025-Broken_Access_Control.md)
- Related: WEBSEC-008, WEBSEC-006

CSRF matters only when the browser sends credentials on its own, through cookies or HTTP auth. An API that takes a bearer token from JavaScript, or no credentials at all, isn't exposed. A01:2025 maps CSRF as CWE-352.

**Angular** gives only the client half. `HttpClient` reads the `XSRF-TOKEN` cookie and sends `X-XSRF-TOKEN` "on all mutating requests (such as `POST`) to relative and same origin URLs". "Your backend service must be configured to set the cookie for your page, and to verify that the header is present". `withXsrfConfiguration()` renames them.

**Nest 12.1** adds a token-free check, `app.enableCsrfProtection()`, called right after `NestFactory.create()`:
1. `GET`, `HEAD` and `OPTIONS` always pass.
2. If `Sec-Fetch-Site` is present, only `same-origin` and `none` pass; "Any other value, including `same-site`, is rejected."
3. A request with neither `Sec-Fetch-Site` nor `Origin` passes, "because it does not come from a browser".
4. Otherwise the `Origin` host must match `Host`, and "The `X-Forwarded-Host` header is ignored."
5. A rejection is a 403. "WebSocket upgrade requests are not checked."

So a sibling subdomain can't post, and state-changing `GET` routes stay unprotected.

Tested 2026-10-18, Nest 12.1.3, Node 24.21.0, POSTs:
- 403 for `Sec-Fetch-Site: cross-site`, `same-site`, and a foreign `Origin`.
- 201 for `same-origin`, a matching `Origin`, and a request with neither header.

## [WEBSEC-010] Angular XSS: the sanitizer, `bypassSecurityTrust*` and Trusted Types
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Angular security guide](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/guide/security.md), web-features 3.43.0 (`trusted-types`), @mdn/browser-compat-data 8.1.6 (`api/TrustedTypePolicy.json`)
- Related: WEBSEC-011, WEBSEC-013, WEBSEC-005

**What Angular does by default.** It "treats all values as untrusted by default" and sanitizes them by context: HTML, Style, URL and Resource URL.
- Interpolation is "always escaped".
- `[innerHTML]` is sanitized: a `<script>` is removed and `<b>` kept.
- "Sanitizing resource URLs isn't possible", so `<iframe src>` and `<script src>` bindings need a trusted value.

**The escape hatches** are `bypassSecurityTrustHtml`, `…Script`, `…Style`, `…Url` and `…ResourceUrl`. Each tells Angular "you inspected a value… and made sure it is secure". Acceptable when your code builds the value from a constant: the docs' example builds a YouTube embed URL from an ID in a component method. Never on fetched or user input.

**Other XSS paths** that skip the sanitizer:
- `ElementRef.nativeElement.innerHTML` and `document`: "many third-party APIs contain unsafe methods".
- Templates built from user input: "Never create templates by concatenating user input and template syntax".
- JIT compilation in production.
- Server-side templating of Angular templates.

**Trusted Types** enforce the rule in the browser: `Content-Security-Policy: trusted-types angular angular#bundler; require-trusted-types-for 'script'`. Add `angular#unsafe-bypass` only if the app calls a bypass method. A grep for `unsafe-bypass` in the policy then shows whether any bypass exists. Trusted Types are Baseline newly available since 2026-02-24 (Chrome 83, Firefox 148, Safari 26); older browsers fall back to the sanitizer.

To audit a diff, grep for `bypassSecurityTrust`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` and `nativeElement`.

## [WEBSEC-011] What coding agents get wrong in web security
- Type: anti-pattern
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-18
- Sources: [Veracode press release, 2025-07-30](https://www.veracode.com/press-release/ai-generated-code-poses-major-security-risks-in-nearly-half-of-all-development-tasks-veracode-research-reveals/), [OpenSSF: Security-Focused Guide for AI Code Assistant Instructions](https://raw.githubusercontent.com/ossf/wg-best-practices-os-developers/main/docs/Security-Focused-Guide-for-AI-Code-Assistant-Instructions.md), [Angular security guide](https://raw.githubusercontent.com/angular/angular/main/adev/src/content/guide/security.md)
- Related: WEBSEC-010, WEBSEC-005, WEBSEC-006, WEBSEC-012, WEBSEC-013

**The measured part (single vendor source).**
- Veracode gave "more than 100 LLMs" 80 completion tasks. "In 45 percent of all test cases, LLMs introduced vulnerabilities classified within the OWASP Top 10".
- JavaScript's failure rate was among "38 percent and 45 percent".
- Models "failed to secure code against cross-site scripting (CWE-80) and log injection (CWE-117) in 86 percent and 88 percent of cases".
- The OpenSSF guide (2025-08-01, expert opinion): "Assume AI-written code can have bugs or vulnerabilities, because it often does".

**Slips to watch for in this stack.** These are reviewer heuristics drawn from the docs above, not measured rates:
- **Making HTML render** with `bypassSecurityTrustHtml`, or by writing `nativeElement.innerHTML`, where Angular strips markup (WEBSEC-010).
- **Silencing a CSP console error** by adding `'unsafe-inline'`, `'unsafe-eval'` or a wildcard host. Next to a nonce, `'unsafe-inline'` does nothing, and the real fix is a nonce or removing the inline code (WEBSEC-005).
- **`enableCors()` with no origin**, or `origin: true` with `credentials: true` (WEBSEC-006).
- **Logging** a token, an `Authorization` header or a full request body, or interpolating them into an error message (WEBSEC-013).
- **Hard-coding a secret** as a fallback value (`process.env.X || 'dev-secret'`).
- **Fetching a URL from input** without an allow-list, with redirects followed (WEBSEC-007).

Put the rules in the instruction file the agent reads, as the OpenSSF guide suggests, and check them in review and CI. An instruction alone isn't enforcement.

## [WEBSEC-012] What `/security-review`, security-guidance and Claude Security check
- Type: comparison
- Applies to: Claude Code
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [Claude Code: security-guidance](https://code.claude.com/docs/en/security-guidance.md), [Claude Code: Claude Security](https://code.claude.com/docs/en/claude-security.md), [Commands: `/security-review`](https://code.claude.com/docs/en/commands.md), [security-review command](https://raw.githubusercontent.com/anthropics/claude-code-security-review/main/.claude/commands/security-review.md), [security-guidance `patterns.py`](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/security-guidance/hooks/patterns.py), [security-guidance `llm.py`](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/security-guidance/hooks/llm.py), [claude-security README](https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/claude-security/README.md)
- Related: REPO-017, REPO-047, REPO-048, WEBSEC-013, HOOK-026

| Tool | When | What it covers for this stack | Blind spots |
|---|---|---|---|
| security-guidance, per-edit layer | Every edit, no model call | 25 built-in regexes: `eval(`, `new Function`, `child_process.exec`, `.innerHTML =`, `document.write`, `insertAdjacentHTML`, `rejectUnauthorized: false`, `<script src>` without `integrity`, workflow files | Matches only JS/TS extensions, so no Angular `.html`; no `bypassSecurityTrust`, no CSP, CORS or secrets rule |
| security-guidance, model reviews | End of turn; on `git commit`/`push` | Rubric names SSRF ("AFTER DNS resolution", redirects "re-introduce" it), secrets in logs, CSRF disabled, XSS sinks | Never names Angular; "missing headers" is at most medium |
| `/security-review` | On demand, branch diff | Injection, auth, crypto and secrets, XSS, "Sensitive data logging" | Hard exclusions: "A lack of hardening measures", log spoofing, path-only SSRF. Angular XSS only via "bypassSecurityTrustHtml, or similar" |
| Claude Security plugin | On demand, multi-agent scan | Lenses for injection and XSS, auth (CSRF, SSRF, open redirect), crypto and secrets; findings "independently reviewed", SARIF output | Nondeterministic; "significant" tokens; headers and CORS not a lens; "not a defense against a hostile repository" |

How to use it:
- None of these block a write.
- A loosened CSP or wildcard CORS is least likely to be caught. Put those rules in `.claude/claude-security-guidance.md` (reviews read it; 8 KB cap), in the repo's reviewer rules (REPO-017), or in a static check (WEBSEC-013).
- The bundled `/security-review` in Claude Code 2.1.296 contains the repo command's text (strings grepped from the binary on 2026-10-18).

## [WEBSEC-013] Deterministic checks and log redaction behind the model reviews
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-18
- Sources: [GitHub docs: CodeQL JavaScript and TypeScript queries](https://docs.github.com/en/code-security/reference/code-scanning/codeql/codeql-queries/javascript-typescript-built-in-queries), [CodeQL `Angular2.qll`](https://github.com/github/codeql/blob/main/javascript/ql/lib/semmle/javascript/frameworks/Angular2.qll), [Semgrep `angular-domsanitizer.yaml`](https://raw.githubusercontent.com/semgrep/semgrep-rules/develop/typescript/angular/security/audit/angular-domsanitizer.yaml), [eslint-plugin-no-unsanitized](https://github.com/mozilla/eslint-plugin-no-unsanitized), [security-guidance: custom patterns](https://code.claude.com/docs/en/security-guidance.md), [pino redaction](https://raw.githubusercontent.com/pinojs/pino/main/docs/redaction.md), [`@nestjs/common` ConsoleLogger source](https://github.com/nestjs/nest/blob/master/packages/common/services/console-logger.service.ts), npm registry
- Related: WEBSEC-011, WEBSEC-012, GHA-023, JSTOOL-005

**Static rules:**
- **CodeQL's default JS/TS suite** includes `js/request-forgery` (SSRF), `js/cors-permissive-configuration`, `js/insecure-helmet-configuration` (frame protection or CSP disabled), `js/missing-token-validation` (CSRF middleware), `js/clear-text-logging` and `js/xss`. `js/log-injection` is in `security-extended` only. `Angular2.qll` models `bypassSecurityTrustHtml`/`Style` as XSS sinks and `…Script` as code injection. Setup is in GHA-023.
- **Semgrep** `angular-bypasssecuritytrust` (taint mode) fires when a `string` parameter reaches a `bypassSecurityTrust*` call.
- **angular-eslint 22.6.0** has no security rule.
- **`eslint-plugin-no-unsanitized`** 4.1.5 (MPL-2.0) flags `innerHTML`, `outerHTML`, `insertAdjacentHTML` and `document.write`, but not `DomSanitizer`.
- **security-guidance's `.claude/security-patterns.json`** adds up to 50 regex or substring rules with `paths` globs. The YAML form needs PyYAML. Rules warn after the edit; they don't block. A rule for `bypassSecurityTrust` on `**/*.ts` and `[innerHTML]` on `**/*.html` fills its gap. To block instead, use a hook (HOOK-026).

**Log redaction:**
- **Nest**'s `ConsoleLogger` takes `redact` (in `@nestjs/common` 12.1.3's typings, not 12.1.0's): key names "matched at any depth", case-insensitive, censor `"[REDACTED]"`. "String messages, the error message and the stack trace are printed as is."
- **pino** 10.4.0's `redact` takes paths, censor `[Redacted]`; "Path strings must not originate from user input".
- Neither masks a token interpolated into a message: log objects, not template strings.

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-18 against `main` of our two Angular SSR apps and the NestJS API. The SSR apps already follow WEBSEC-004: a per-response nonce through helmet with `'strict-dynamic'`, a placeholder swapped only inside nonce attributes, `allowedHosts` and a generic 500 handler. The patterns in WEBSEC-007 for a server-side image fetch are the ones our API uses.

1. Done 2026-10-18: CodeQL default setup is on in the three app repos (osrs-tracker/osrs-tracker-web#359, osrs-tracker/osrs-tracker-api#186, FreekMencke/freek-mencke-web#23; WEBSEC-013, GHA-023).
2. **Keep CSP, CORS and header rules in each repo's reviewer rules, not only in `/security-review`.** `/security-review` excludes "lack of hardening" and names no headers (WEBSEC-012). The 2026-10-14 decision in `kb-repo-agents.md` that `/security-review` plus the conventions rules cover CSP stands only through the conventions rules. Issues, with 3: [osrs-tracker/osrs-tracker-web#383](https://github.com/osrs-tracker/osrs-tracker-web/issues/383), [osrs-tracker/osrs-tracker-api#202](https://github.com/osrs-tracker/osrs-tracker-api/issues/202), [FreekMencke/freek-mencke-web#36](https://github.com/FreekMencke/freek-mencke-web/issues/36).
3. **Write the agent rules into the repos' instruction files**: no `bypassSecurityTrust*` on fetched values, never loosen the CSP to silence an error, never interpolate a token into a log message (WEBSEC-011). Cheap, and a reviewer can cite them. In the three issues under 2, opened 2026-10-18; each repo's `conventions-reviewer` applies its `CLAUDE.md` hard rules and repo skill.
4. **Decision: no security-guidance plugin for now.** Its model reviews run on Opus at every turn end and commit, which costs usage on every session. Its per-edit layer misses Angular templates and `bypassSecurityTrust` without custom rules (WEBSEC-012). Revisit if CodeQL and the reviewer rules miss something.

## Open questions

- **OWASP Top 10:2025's release date:** no dated owasp.org announcement found. The repo's README, project page and commit history show only that the RC label was removed on 2025-12-24 (WEBSEC-001).
- **Event replay and the nonce in SSR:** whether `@angular/ssr` copies the nonce onto the `ng-event-dispatch-contract` script in every response. The build's `addNonce` copies it onto every `<script>`, but this wasn't observed in a rendered response (WEBSEC-004).
- **`connect.lookup` as an SSRF guard:** a lookup hook that checks every address and pins the one used was not tested. It also wasn't tested whether `net.BlockList` passed through undici's `connect` options is honoured (WEBSEC-007).
- **Nest `ConsoleLogger.redact`:** which of 12.1.1 to 12.1.3 added it. It's absent from 12.1.0's typings and present in 12.1.3's (WEBSEC-013).
- **Agent-specific evidence:** no primary study found of agents loosening a CSP or adding wildcard CORS. Veracode's 2026 report and its full CWE table weren't read (WEBSEC-011).
- **CHIPS support:** web-features 3.43.0 lists `Partitioned` cookies for Chromium only, while browser-compat-data 8.1.6 also lists Firefox 141 and Safari 26.2 (WEBSEC-008).
