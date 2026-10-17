# Open Graph images with satori and resvg

Prefix `OG`. This file covers link-preview images drawn on a Node server: what satori 0.62 lays out today and the breaking defaults it took in October 2026, which fonts it loads, why Vercel's and Next.js's docs describe an older satori, turning its SVG into a PNG with resvg-js, resvg-wasm or sharp, the Open Graph and X card tags, each platform's image limits and preview cache, Google's use of `og:image` (Discover, `max-image-preview`), and rendering at build time or on request with caching. SEO ranking is out of scope (`kb-web-analytics-seo.md`).

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#189, part of roadmap #167) by an Opus 5.5 lead with three Sonnet readers (platform tags and caches; Google and build-time or on-request generation; resvg and sharp) and a Sonnet refuter on the claims the recommendations rest on.
- Read as raw text: satori's README and its GitHub release notes and pull requests (vercel/satori, `main` on 2026-10-17), resvg-js at tags `v2.6.2` and `v2.7.0-alpha.2` (thx/resvg-js), linebender/resvg's CHANGELOG, sharp's docs at `v0.35.5` and sharp-libvips `v1.3.4`, ogp.me, Meta's sharing docs, LinkedIn's help page, Slack's and Discord's docs, Google Search Central pages (each entry gives the page's "Last updated" date), and Next.js and Vercel docs as Markdown. X's card docs are no longer served (OG-006), so they were read from Wayback Machine copies.
- Versions and dates from the npm registry (`npm view <pkg> dist-tags`, `npm view <pkg> time --json | grep`).
- Tested: satori 0.62.0, `@resvg/resvg-js` 2.6.2, `@resvg/resvg-wasm` 2.6.2 and sharp 0.35.5 on Node 24.21.0 (WSL2, x64), installed with `npm install --ignore-scripts`, plus esbuild 0.27.7 for bundling. Nothing was tested on a platform's preview crawler.
- Our apps were read on 2026-10-17 from `main` of osrs-tracker-web and freek-mencke-web, and their live server HTML with curl.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Does satori need `display: flex` on every `div`, and does it do grid? | Not since 0.37.0–0.38.1 (2026-10-08): Taffy replaced Yoga, elements take browser `display` defaults (block), and `display: grid` works. `display: table` still throws. | OG-001, OG-002 |
| I upgraded satori and the card's layout moved: why? | 0.37.0, 0.38.1 and 0.42.0 (all 2026-10-08) changed layout defaults (block layout, `flex-shrink: 1`, `position: static`, `box-sizing: content-box`, no border without a style), and their release notes don't list it. Set `boxSizing: 'border-box'` and render every card before merging a bump. | OG-001 |
| Which font files does satori load? | Static TTF, OTF, WOFF and WOFF2 (WOFF2 since 0.55.0). Not variable fonts: they throw in 0.62.0 (vercel/satori#162, open since 2022). Instance them with `fonttools varLib.instancer`. At least one font is required. | OG-003 |
| Next.js and Vercel docs say flexbox only and no WOFF2: true? | For `@vercel/og` and `next/og`, which bundle satori 0.33.5 and 0.29.0; not for satori 0.62.0 itself. | OG-004 |
| resvg-js, resvg-wasm or sharp for the PNG? | All work. resvg-js and resvg-wasm 2.6.2 both bundle resvg 0.34.0 (2023); resvg-js can't be bundled (`.node` file), resvg-wasm can, at about twice the time. sharp needs `node_modules` and can't draw satori's unconverted colours or GIFs. | OG-005 |
| Can a satori card embed WebP or AVIF images? | No: WebP drew nothing in resvg-js, resvg-wasm or sharp, and AVIF made satori throw (tested). Embed PNG or JPEG. | OG-005 |
| Which tags does a link preview need? | `og:title`, `og:type`, `og:image`, `og:url` (ogp.me's required four), plus `og:image:width`, `og:image:height`, `og:image:alt` and `twitter:card` `summary_large_image`. Other `twitter:*` tags fall back to `og:*`. | OG-006 |
| What size and format for `og:image`? | 1200×630 PNG or JPEG. Meta: at least 1200×630 recommended, 8 MB max; X: 2:1, under 5 MB, no SVG; LinkedIn: 1200×627, 5 MB. | OG-007 |
| I changed the image: why do previews still show the old one? | Platforms cache by URL: X about 7 days, Slack and Discord about 30 minutes, Meta until re-scraped. Change the image URL (`?v=2`) and re-scrape in Meta's Sharing Debugger. | OG-007 |
| Does Google use `og:image`? | As one of three ways to suggest the preview image for text results and Discover. Discover wants 1200 px wide, 16:9, no logos or text-heavy images, and `max-image-preview:large`. | OG-008 |
| Build time or on request? | Build time for content that changes with a deploy (a site card, prerendered pages); on request, cached in memory and by `Cache-Control`, for per-item cards from live data. | OG-009 |
| Which Cache-Control for an on-request card? | Versioned URL plus `public, max-age=<how stale may it be>, immutable`; Vercel's `@vercel/og` default is a year. Lift helmet's `Cross-Origin-Resource-Policy: same-origin` for the image. | OG-009 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| OG-001 | satori 0.37 to 0.42: browser layout defaults, and release notes that skip them | fact | satori, breaking-changes, taffy, box-sizing, upgrades |
| OG-002 | What satori 0.62 lays out and draws, and what throws | fact | satori, css, grid, stylesheets, colors |
| OG-003 | satori's fonts: four static formats, no variable fonts | fact | satori, fonts, woff2, variable-fonts, instancer |
| OG-004 | Vercel's and Next.js's OG docs describe an older satori | fact | vercel-og, next-og, imageresponse, satori, docs-drift |
| OG-005 | SVG to PNG: resvg-js, resvg-wasm or sharp | comparison | resvg-js, resvg-wasm, sharp, librsvg, bundling, webp |
| OG-006 | Open Graph and X card tags, and X's missing docs | fact | open-graph, twitter-card, og-image, ogp |
| OG-007 | Image limits and preview caches per platform | fact | og-image, image-size, caching, facebook, x, linkedin, discord, slack |
| OG-008 | Google's use of `og:image`: preferred image, Discover and `max-image-preview` | fact | google, discover, max-image-preview, og-image |
| OG-009 | Build time or on request in an SSR app, and caching the card | recommendation | build-time, ssr, cache-control, cache-busting, cors |

## [OG-001] satori 0.37 to 0.42: browser layout defaults, and release notes that skip them
- Type: fact
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-17
- Sources: [vercel/satori#841](https://github.com/vercel/satori/pull/841), [vercel/satori#847](https://github.com/vercel/satori/pull/847), [vercel/satori#855](https://github.com/vercel/satori/pull/855), [satori releases](https://github.com/vercel/satori/releases), npm registry (`npm view satori time --json`)
- Related: OG-002, JSUP-001

On 2026-10-08 satori shipped three breaking layout changes as minor 0.x bumps. Their GitHub release notes list only the other commit in each release, so read `compare/<old>...<new>` before a bump.

| Release | Pull request | Change |
|---|---|---|
| 0.37.0 | #841 | Yoga replaced by Taffy (WebAssembly), with `display: block` and `display: grid`. "`flex-shrink` defaults to 1, flex items don't shrink below their content, top-level margins are respected" |
| 0.38.1 | #847 | Browser `display` defaults: "`div` elements with several children no longer need an explicit `display`", and "a `div` without `display: flex` no longer lays out its children as flex items" |
| 0.42.0 | #855 | "`position` defaults to `static`", "`boxSizing` defaults to `content-box`, also for the sizes of images", "`borderStyle` defaults to `none`"; elements styled with `tw` keep `border-box` |

0.43.0 to 0.62.0 followed in eight days (0.62.0 on 2026-10-16), moving text placement closer to Chrome (0.57.1).

- Pin a minor (`^0.62.0` is that range on 0.x), and after a bump render every card and compare: unit tests that never render miss this.
- Set `boxSizing: 'border-box'` on every element (Tailwind's preflight does that on the site): with `content-box`, a `height: 100%` box with `padding` overflows the card.

Tested 2026-10-17, satori@0.62.0, Node 24.21.0: a `div` with two children and no `display` rendered as stacked blocks without an error, and a `height: '100%'`, `padding: 64` column pushed its centred text below the middle.

## [OG-002] What satori 0.62 lays out and draws, and what throws
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [satori README](https://raw.githubusercontent.com/vercel/satori/main/README.md), [satori releases](https://github.com/vercel/satori/releases)
- Related: OG-001, OG-003, OG-005, CSS-001

satori 0.62.0 (2026-10-16) "uses Taffy to lay out Flexbox, Grid and block layouts, and its own inline layout for text"; "It's **not** a complete CSS implementation". Rows marked "Supported" in its CSS table "behave as in browsers".

**New since 0.50**: `<style>` elements (0.51.0) with `::before`/`::after`, container queries (0.57.0) and `@property` (0.58.0); CSS variables; `direction: rtl` (0.48.0); logical properties; masks, `filter`, `backdropFilter`, 3D transforms (0.35.0); and an experimental WebGL `<canvas>` from `satori/experimental`.

**Throws or is ignored:**
- `display: table`, `ruby` and two-value `display` "aren't supported and throw"; `subgrid` throws.
- By default "an invalid or unsupported declaration in an inline style throws an error, which fails the whole render"; `onStyleError` turns that into a callback. Declarations in stylesheets are dropped like in browsers.
- `:hover`-style pseudo-classes never match; React hooks don't run; `<link>` and `<script>` aren't loaded.
- No fonts: "No fonts are loaded. At least one font is required to calculate the layout." (tested).

**Colours:** "Satori converts the colors that SVG renderers may not support to `rgb()` and `rgba()`. Sharp, for example, draws most of them black": `oklch()`, `lab()`, `color-mix()`, `light-dark()` (always the light colour), relative colours and space-separated `rgb()`. `convertColors: false` keeps them.

**Text** is drawn as glyph paths by default (`embedFont: true`), so the PNG renderer needs no fonts. `pointScaleFactor` (default `1`) sets pixel-grid rounding.

Tested 2026-10-17, satori@0.62.0, Node 24.21.0: `display: 'grid'` with `repeat(3, 1fr)` laid out six cells; a `<style>` rule applied through `className`; `display: 'table'` threw "Invalid value for CSS property "display"".

## [OG-003] satori's fonts: four static formats, no variable fonts
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [satori README, Fonts](https://raw.githubusercontent.com/vercel/satori/main/README.md), [satori 0.55.0 release](https://github.com/vercel/satori/releases/tag/0.55.0), [vercel/satori#162](https://github.com/vercel/satori/issues/162), [vercel/satori#946](https://github.com/vercel/satori/pull/946)
- Related: OG-002, OG-004, FONT-006, FONT-018, FONT-019

"Satori supports four font formats: TTF, OTF, WOFF and WOFF2. You must specify the font if any text is rendered with Satori, and pass the font data as ArrayBuffer (web) or Buffer (Node.js)". WOFF2 arrived in 0.55.0 (2026-10-13); before that, TTF, OTF and WOFF only. Each `fonts` entry names a family, a `weight` and a `style`; pass one file per weight. The README advises defining the font array once at module scope "for better performance".

**Variable fonts don't load.** vercel/satori#162, "Requiring a variable font causes a type error", open since 2022-10-11: opentype.js's `fvar` parser throws. An open fix, vercel/satori#946 (2026-10-16), would draw the default instance only: "Applying `font-weight` and other axes to the outlines would be the next step." Workaround: cut static instances with `fonttools varLib.instancer` (FONT-006), or ship the family's static TTFs. Subsetting keeps the card fonts small; FONT-019 lists the `pyftsubset` defaults that drop features, and FONT-018 the licence terms for a modified font.

satori shapes text with HarfBuzz (since 0.33.0), so kerning, `fontFeatureSettings` and `fontVariantNumeric: 'tabular-nums'` work; when a weight or style is missing it synthesizes bold and italic (0.49.0).

Tested 2026-10-17, satori@0.62.0, Node 24.21.0: static Lato TTF and Inter WOFF and WOFF2 (`@fontsource/inter` 5) rendered; Inter's variable TTF (google/fonts `ofl/inter`) and `@fontsource-variable/inter`'s WOFF2 threw "Cannot read properties of undefined (reading '256')" and "(reading '257')"; a Bold instance made with `python3 -m fontTools.varLib.instancer Inter-VF.ttf wght=700 opsz=32` (fontTools 4.46.0) rendered.

## [OG-004] Vercel's and Next.js's OG docs describe an older satori
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Vercel: OG image generation](https://vercel.com/docs/og-image-generation.md), [Vercel: `@vercel/og` reference](https://vercel.com/docs/og-image-generation/og-image-api.md), [Next.js: ImageResponse](https://raw.githubusercontent.com/vercel/next.js/canary/docs/01-app/03-api-reference/04-functions/image-response.mdx), [Next.js: compiled @vercel/og](https://raw.githubusercontent.com/vercel/next.js/canary/packages/next/src/compiled/@vercel/og/package.json), npm registry
- Related: OG-001, OG-003, OG-005

Vercel's page (front matter `last_updated: 2026-06-16`) and Next.js's `ImageResponse` page both say:
- "Only `ttf`, `otf`, and `woff` font formats are supported. To maximize the font parsing speed, `ttf` or `otf` are preferred over `woff`"
- "Only flexbox (`display: flex`) and a subset of CSS properties are supported. Advanced layouts (`display: grid`) will not work."
- "Maximum bundle size of 500KB. The bundle size includes your JSX, CSS, fonts, images, and any other assets."

That is true of what they ship, not of satori 0.62.0. `npm view @vercel/og@1.0.3 dependencies` (2026-09-22) gives `satori` `0.33.5` and `@resvg/resvg-wasm` `2.4.1`; Next.js canary compiles `@vercel/og` 1.0.1, which pins satori `0.29.0`. Grid and block layout arrived in satori 0.37.0 and WOFF2 in 0.55.0 (OG-001, OG-003).

So an agent reading these pages for a plain satori server gets limits that no longer apply, and one using `next/og` must not take satori's README as its feature list. The 500 KB bundle cap is a Vercel Function limit; a self-hosted Node server has none. Other `@vercel/og` facts: "By default, `@vercel/og` only has the Noto Sans font included", and responses carry `'cache-control': 'public, immutable, no-transform, max-age=31536000'` (OG-009).

## [OG-005] SVG to PNG: resvg-js, resvg-wasm or sharp
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [resvg-js Cargo.toml v2.6.2](https://raw.githubusercontent.com/thx/resvg-js/v2.6.2/Cargo.toml), [resvg-js CHANGELOG](https://raw.githubusercontent.com/thx/resvg-js/main/CHANGELOG.md), [thx/resvg-js#422](https://github.com/thx/resvg-js/issues/422), [linebender/resvg CHANGELOG](https://raw.githubusercontent.com/linebender/resvg/main/CHANGELOG.md), [sharp install docs v0.35.5](https://raw.githubusercontent.com/lovell/sharp/v0.35.5/docs/src/content/docs/install.md), [sharp-libvips versions v1.3.4](https://raw.githubusercontent.com/lovell/sharp-libvips/v1.3.4/versions.properties), [sharp-libvips build/posix.sh v1.3.4](https://github.com/lovell/sharp-libvips/blob/v1.3.4/build/posix.sh), [resvg-napi README](https://github.com/p8nut/resvg-napi)
- Related: OG-002, DOCKER-002, DOCKER-005, NPM-006, NPM-017

| | `@resvg/resvg-js` 2.6.2 | `@resvg/resvg-wasm` 2.6.2 | sharp 0.35.5 |
|---|---|---|---|
| Engine | resvg 0.34.0 (2023-05-27) | same | librsvg 2.63.2 |
| Bundles into one file | No: a per-platform `.node` file | Yes, with `index_bg.wasm` passed to `initWasm` | No: `--external:sharp` |
| Render time (tested) | 7.7 ms | 13.9 ms | 5.7 ms |
| Embedded GIF (tested) | drawn | drawn | not drawn |
| `oklch()` with `convertColors: false` (tested) | not tested | not tested | black |

Both resvg packages pin `resvg = "0.34.0"` (a patched fork) at 2.6.2 (2024-03-26) and 2.7.0-alpha.2; upstream is 0.48.1 (2026-08-02). On 2026-10-15 the maintainer wrote that upgrading "requires a large number of AI tokens and thorough, detailed testing". Missing from 0.34: WebP images (0.43.0), variable fonts (0.47.0), `transform-origin` (0.37.0). Set `font: { loadSystemFonts: false }` ("Default: true"; satori's glyph paths need none).

**Embedded images:** use PNG or JPEG. Satori passes images through as data URIs; WebP drew nothing in all three, and AVIF made satori throw "t is not iterable". librsvg supports GIF and WebP, but sharp's build strips them ("# Disallow GIF and WebP embedded in SVG images", sharp-libvips `build/posix.sh`).

resvg-napi (one maintainer, first published 2026-08-31, 0.6.1) binds "resvg 0.48"; not tested.

Tested 2026-10-17, Node 24.21.0, WSL2 x64: mean of 20 renders of one 1200×630 card (satori layout 1.4 ms); PNG 24,339 bytes from resvg, 38,624 from sharp (14,274 with `palette: true`). esbuild 0.27.7 bundled satori into a 2.2 MB file that ran without `node_modules`, and stopped on resvg-js: "No loader is configured for ".node" files".

## [OG-006] Open Graph and X card tags, and X's missing docs
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [The Open Graph protocol](https://ogp.me/), [X cards: getting started (Wayback, 2026-01-01)](https://web.archive.org/web/20260101000233/https://developer.x.com/en/docs/x-for-websites/cards/guides/getting-started), [X: summary card with large image (Wayback, 2026-01-12)](https://web.archive.org/web/20260112050218/https://developer.x.com/en/docs/x-for-websites/cards/overview/summary-card-with-large-image), [X cards markup (Wayback, 2025-11-13)](https://web.archive.org/web/20251113085832/https://developer.x.com/en/docs/x-for-websites/cards/overview/markup)
- Related: OG-007, WEB-014

ogp.me: "The four required properties for every page are" `og:title`, `og:type`, `og:image` and `og:url`, as `<meta property="og:…" content="…">`. `og:image` takes structured properties `:url`, `:secure_url`, `:type`, `:width`, `:height` and `:alt` ("If the page specifies an og:image it should specify og:image:alt"), each after its root tag. For several images, repeat the tag: "The first tag (from top to bottom) is given preference during conflicts."

**X cards** use `name=` rather than `property=`. `twitter:card` is "one of "summary", "summary_large_image", "app", or "player"", and "the "last" one in sequence will take priority". The card processor "first checks for the Twitter-specific property, and if not present, falls back to the supported Open Graph property", so `og:title`, `og:description` and `og:image` cover the rest; a page with OG tags and no `twitter:card` "may" get a `summary` card. The markup table says "Either twitter:site or twitter:site:id is required", while the card pages mark `twitter:site` "No".

**The docs are gone.** On 2026-10-17 the developer.x.com card pages answered `307` to `https://docs.x.com/`, the docs.x.com path answered `404`, and docs.x.com's `llms.txt` has no card pages. Cite the Wayback copies, and treat them as the last published spec.

Check what crawlers see in the server HTML with curl (WEB-014): Discord runs "No code", so tags added after load are never seen.

## [OG-007] Image limits and preview caches per platform
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Meta: images in link shares](https://developers.facebook.com/docs/sharing/webmasters/images/), [Meta: sharing for webmasters](https://developers.facebook.com/docs/sharing/webmasters/), [Meta: crawler](https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/), [X troubleshooting (Wayback, 2025-12-31)](https://web.archive.org/web/20251231142717/https://developer.x.com/en/docs/x-for-websites/cards/guides/troubleshooting-cards), [LinkedIn: make your website shareable](https://www.linkedin.com/help/linkedin/answer/a521928), [Slack: robots](https://api.slack.com/robots), [Discord: link previews](https://raw.githubusercontent.com/discord/discord-api-docs/main/developers/link-previews/overview.mdx)
- Related: OG-006, OG-009

| Platform | Size and ratio | File size | Formats named | Cache |
|---|---|---|---|---|
| Meta | "at least 1200 x 630 pixels"; 600×315 for the large layout; "1.91:1" | "must not exceed 8 MB" | `og:image:type` "image/jpeg, image/gif or image/png" | by image URL until re-scraped |
| X (`summary_large_image`) | "2:1", 300×157 to 4096×4096 | "less than 5MB" | "JPG, PNG, WEBP and GIF"; "SVG is not supported" | "7 days" |
| LinkedIn | "1200 (w) x 627 (h)", "1.91:1" | "5 MB" | none stated | not stated |
| Discord | none stated | 50 MB fetch | png, gif, jpg, webp, avif | "about 30 minutes" |
| Slack | none stated | none stated | none stated | "around 30 minutes" |

A 1200×630 PNG or JPEG fits all of them.

- **Changing an image:** Meta: "Images are cached based on the URL and won't be updated unless the URL changes"; X: "add an extra parameter at the end of your image URL". Meta's Sharing Debugger re-scrapes a page; X's Card Validator link redirected to a login on 2026-10-17.
- **First share:** Meta's crawler "has to see an image at least once before it can be rendered"; `og:image:width` and `og:image:height` make it load "properly the first time it's shared". Discord measures images without them.
- **Crawler limits:** Meta wants OG tags "before the first 1 MB" and fetched "within a few seconds"; X caps page responses at 2 MB; Discord's whole fetch "must finish within 10 seconds".

## [OG-008] Google's use of `og:image`: preferred image, Discover and `max-image-preview`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Google Discover (updated 2026-03-09)](https://developers.google.com/search/docs/appearance/google-discover), [Google Images: specify a preferred image (updated 2026-03-02)](https://developers.google.com/search/docs/appearance/google-images#specify-preferred-image), [Robots meta tag (updated 2026-03-24)](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), [Article structured data (updated 2026-09-08)](https://developers.google.com/search/docs/appearance/structured-data/article)
- Related: OG-007, WEB-014

Google picks a page's preview image itself ("completely automated"), for "a text result image or the preview image in Discover". You can influence it with schema.org `primaryImageOfPage`, an `image` on the main entity, or "the og:image meta tag". Its advice: "Avoid using a generic image (for example, your site logo) or an image with text", and "an image with an extreme aspect ratio".

**Discover** recommends images "At least 1200 px wide", "more than 300,000 total pixels" and "16x9 aspect ratio"; large previews are "Enabled by the max-image-preview:large setting, or by using AMP". It also says "avoid using text-heavy images in the schema.org markup or og:image meta tag". A 1200×630 text card passes the size checks but not the "text-heavy" advice; since Google chooses, that costs at most the Discover thumbnail.

**`max-image-preview`** takes `none`, `standard` or `large` ("A larger image preview, up to the width of the viewport"). Without it, "Google may show an image preview of the default size". It "applies to all forms of search results (such as Google web search, Google Images, Discover, Assistant)":

```html
<meta name="robots" content="max-image-preview:large">
```

**Article markup** (`Article`, `NewsArticle`, `BlogPosting`) asks for images of at least "50K pixels" in "16x9, 4x3, and 1x1", which is a separate requirement from the Discover image.

## [OG-009] Build time or on request in an SSR app, and caching the card
- Type: recommendation
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-17
- Sources: [Next.js: opengraph-image](https://raw.githubusercontent.com/vercel/next.js/canary/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.mdx), [Vercel: `@vercel/og` reference](https://vercel.com/docs/og-image-generation/og-image-api.md), [helmet README](https://raw.githubusercontent.com/helmetjs/helmet/main/README.md), [osrs-tracker-web decisions](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/docs/decisions.md)
- Related: OG-005, OG-007, WEBPERF-012, DOCKER-005, NG-008

**Build time** when the card changes only with a deploy: a site-wide card or prerendered pages. Next.js does this by default: "generated images are **statically optimized** (generated at build time and cached) unless they use Request-time APIs or uncached data". In Angular, a script run before `ng build` writes PNGs to `public/`.

**On request** when cards come from live data (an item or player page): a server route renders with satori and resvg-wasm. In osrs-tracker-web (Angular 22 SSR, Express 5), the renderer chunk (about 5 MB, with fonts and `.wasm` inlined through the application builder's `loader` option, `binary`) loads on the first image request, keeps the last 200 PNGs in memory, and answers `public, max-age=604800, immutable` (curl, 2026-10-17); player cards live an hour.

**Caching:**
- Put a version in the image URL (`?v=5`) and bump it when the design changes: platforms cache by URL (OG-007).
- `immutable` is safe only on a versioned URL. Vercel's default is `public, immutable, no-transform, max-age=31536000`; choose `max-age` by how stale the data may be.
- helmet 8 defaults to `Cross-Origin-Resource-Policy: same-origin`; chat crawlers ignore it, but preview tools that load the image in their own page are blocked, so send `cross-origin` on the image routes.
- Image size: a 1200×630 PNG of a few tens of KB is far under every limit; Next.js fails a build over "8MB" (`opengraph-image`) or "5MB" (`twitter-image`).

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-17 against `main` of osrs-tracker-web (satori `^0.56.2` and `@resvg/resvg-wasm` `~2.6.2`, bundled into the SSR server; item and player cards on request; `og:image` with width, height and alt; `twitter:card` `summary_large_image`) and freek-mencke-web (prerendered home, no `og:image`, `twitter:card` `summary`).

1. **freek-mencke-web: add a static 1200×630 card** with `og:image`, its width, height and alt, and `summary_large_image` (OG-006, OG-007, OG-009). Built once, no server route. Issue: [FreekMencke/freek-mencke-web#22](https://github.com/FreekMencke/freek-mencke-web/issues/22).
2. **osrs-tracker-web: add `max-image-preview:large`** to every indexable page, so Google may show the cards large in Discover and Search (OG-008). Issue: [osrs-tracker/osrs-tracker-web#358](https://github.com/osrs-tracker/osrs-tracker-web/issues/358).
3. **Keep resvg-wasm** (OG-005): it renders the same resvg 0.34 as resvg-js and is the only one of the three that bundles into a `dist/`-only image. Revisit if thx/resvg-js#422 ships a newer resvg.
4. **On each satori bump, read the compare view and render every card** (OG-001). The repo's rule (check a bump in the production build) already covers it; the 0.42 `content-box` change is already handled by `el()` in `og/card-kit.ts`.

Decision kept: no variable font in the cards; ship the static TTFs (OG-003).

## Open questions

- **LinkedIn's cache and Post Inspector:** only community posts give a 7-day cache; LinkedIn's help page (updated "2 years ago") and the Post Inspector shell state nothing (OG-007).
- **Meta and LinkedIn with WebP or AVIF images:** neither names them; not tested on a crawler (OG-007).
- **X's Card Validator:** whether it still works signed in; the docs' link redirected to a login (OG-006).
- **Telegram, WhatsApp and iMessage:** no official page on preview tags or limits found (core.telegram.org/api/links, faq.whatsapp.com's JavaScript shell, Apple's `LPMetadataProvider` page).
- **Crawler timeouts for slow on-request cards:** Discord states 10 s; Meta "a few seconds"; X, Slack, LinkedIn and Google give none.
- **resvg-js's fork:** whether the patched resvg fork (rev `3495d870`) backports anything past 0.34.0; not read (OG-005).
