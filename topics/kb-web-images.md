# AI image generation and icons for web assets

Prefix `IMG`. This file covers making web images (hero images, illustrations, cover and Open Graph images) with image models called from a coding agent, since Claude itself can't draw them: which OpenAI and Google models are current and what they cost, sizes and formats, provenance marks (C2PA, SynthID) and what an image pipeline does to them, who owns the output and whether it can be copyrighted, what the popular image skills call, and icon libraries for Angular as the alternative to generating icons. It links rather than repeats: Claude's vision limits (DESIGN-008), image formats and `NgOptimizedImage` (WEBPERF-010, WEBPERF-011), OG image sizes (OG-007) and drawing OG cards with satori (OG-005), and licences (OSS-001).

Research basis:
- Researched 2026-10-30 in a cloud session, Claude Code v2.1.314, Opus 5.5 lead with a Sonnet reader. Earlier in the day the session's network blocked the vendors' sites; this file was written after it was opened.
- Read as raw text: developers.openai.com's `.md` pages (image generation guide, pricing, deprecations, model pages), ai.google.dev's `.md.txt` pages (image generation, pricing, deprecations, Gemini API Additional Terms), platform.claude.com's vision page, and the US Copyright Office's Part 2 report (PDF, converted with `pdftotext`).
- Not reachable: openai.com and help.openai.com returned a bot-check page, so OpenAI's terms of use and its C2PA help article were read only as search-result text and are marked unverified.
- Tested: `sharp@0.35.5` (libvips 8.18.7) on Node v22.22.0, installed with `--ignore-scripts`, and `@contentauth/c2pa-node@0.9.11`, against two C2PA-signed fixtures from contentauth/c2pa-rs (IMG-006).
- Versions from the npm registry. Prices are list prices on 2026-10-30 and change; re-check before budgeting.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Can Claude generate an image? | No: "Claude is an image understanding model only". A skill or MCP server has to call another vendor's image API. | IMG-001 |
| Which OpenAI image model now? | `gpt-image-2.5-flare` for everyday images, `gpt-image-2.5-sunburst` when editing precision matters. `gpt-image-1.5`, `gpt-image-1-mini` and `chatgpt-image-latest` shut down on 2026-12-01. | IMG-002 |
| Which Google image model now? | `gemini-nano-banana-2.1` (Nano Banana 2.1, 2026-10-06), "the primary high-efficiency workhorse". Imagen is shut down. | IMG-003 |
| What does an image cost? | Gemini Nano Banana 2.1: $0.0336 per 1K image, $0.113 per 4K. OpenAI bills tokens ($30 per 1M image output tokens); `gpt-image-2` examples run $0.006 to $0.211 at 1024×1024. | IMG-002, IMG-003 |
| Can I get a transparent background? | From OpenAI: `background: "transparent"` with PNG or WebP output. Not found in Gemini's guide. | IMG-004 |
| Can I generate a 1200×630 OG image directly? | Not at exactly 1200×630: OpenAI's custom sizes must be multiples of 16. Generate 1920×1008 (the same 1.905 ratio) and scale it down; keep the OG file as PNG or JPEG. | IMG-004, OG-007 |
| Do generated images carry provenance marks? | Gemini: "All generated images include a SynthID watermark." OpenAI: C2PA plus SynthID per its help article (unverified). | IMG-005 |
| Does converting to AVIF or WebP keep C2PA? | Not with sharp 0.35.5: all 24 conversions dropped it, even with `keepMetadata()` or `withMetadata()` (tested). SynthID sits in the pixels and isn't checked here. | IMG-006 |
| Who owns the output, and is it copyrightable? | Google won't claim ownership but may make the same image for others. The US Copyright Office: "prompts do not alone provide sufficient control" for authorship. | IMG-007 |
| What do popular image skills call? | baoyu-skills: OpenAI, Google, OpenRouter, Replicate and others via API keys, with older model defaults. banana-claude: Gemini only, with a cost estimate and one approval per paid request. | IMG-008 |
| Which icon library for Angular? | `@lucide/angular` 1.65.0 (ISC, Angular ≥17); Phosphor has no official Angular package. Use a library, not generated icons. | IMG-009 |
| Should we generate images for our sites? | Only where a photo or illustration adds something; draw cards and diagrams in code, and keep each prompt and model with the asset. | IMG-010 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| IMG-001 | Claude can't generate images | fact | vision, image-generation, limits |
| IMG-002 | OpenAI image models in October 2026: GPT Image 2.5, prices, shutdowns | fact | openai, gpt-image, pricing, deprecations |
| IMG-003 | Google image models: Nano Banana 2.1, prices, Imagen shut down | fact | gemini, nano-banana, pricing, imagen, deprecations |
| IMG-004 | Sizes, formats and transparency for web assets | fact | sizes, png, webp, transparency, og-image |
| IMG-005 | Provenance marks: C2PA and SynthID | fact | c2pa, synthid, provenance |
| IMG-006 | Test: sharp drops C2PA in every format and option | fact | c2pa, sharp, avif, webp, metadata, tested |
| IMG-007 | Ownership and copyright of generated images | fact | copyright, ownership, terms, us-copyright-office |
| IMG-008 | What the popular image-generation skills call | tool | skills, baoyu-skills, banana-claude, api-keys |
| IMG-009 | Icon libraries for Angular: Lucide, not Phosphor or generation | fact | icons, lucide, phosphor, angular |
| IMG-010 | When to generate an image for a site, and how to keep it reproducible | recommendation | workflow, provenance, assets |

## [IMG-001] Claude can't generate images
- Type: fact
- Applies to: Claude Code, Claude API, claude.ai
- Confidence: official-docs
- Last verified: 2026-10-30
- Sources: [Vision](https://platform.claude.com/docs/en/build-with-claude/vision)
- Related: DESIGN-008, IMG-008, OG-005

Anthropic's vision page: "No, Claude is an image understanding model only. It can interpret and analyze images, but it cannot generate, produce, edit, manipulate, or create images."

What Claude can do for web images instead:
- Write SVG, CSS and canvas code: icons, patterns, diagrams, charts and OG cards (OG-005 draws cards with satori).
- Write prompts for an image model and call its API through a script, skill or MCP server (IMG-008).
- Look at a generated image and judge it, within the limits of DESIGN-008.

So "make a hero image" in a Claude Code session means a call to OpenAI or Google (IMG-002, IMG-003), a paid API key in the environment, and the vendor's terms on the output (IMG-007).

## [IMG-002] OpenAI image models in October 2026: GPT Image 2.5, prices, shutdowns
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-30
- Sources: [Image generation guide](https://developers.openai.com/api/docs/guides/image-generation), [Pricing](https://developers.openai.com/api/docs/pricing), [Deprecations](https://developers.openai.com/api/docs/deprecations)
- Related: IMG-003, IMG-004, IMG-010

**Models:** "generate and edit images from text prompts using `gpt-image-2.5-sunburst` and `gpt-image-2.5-flare`. Choose Sunburst for workflows where editing precision matters most, and Flare for fast, high-quality everyday image generation." Both "add `xhigh` and `max` quality settings" and "default to `auto`".

**Shutdowns** (deprecations page): `gpt-image-1` on 2026-10-23; `gpt-image-1.5`, `gpt-image-1-mini` and `chatgpt-image-latest` on "Dec 1, 2026", replaced by "`gpt-image-2.5-sunburst` or `gpt-image-2.5-flare`"; `dall-e-2` and `dall-e-3` on 2026-05-12.

**Price:** per token, not per image. Standard tier, per 1M tokens: image input $8.00, image output $30.00, the same for 2.5 and `gpt-image-2`; Batch halves it. The guide warns: "Equal token rates don't mean equal cost per image: token consumption can differ by model and quality setting." No per-image table exists for 2.5. The older-model examples for `gpt-image-2` at 1024×1024 are $0.006 (low), $0.053 (medium) and $0.211 (high).

Measure the response's `usage` on a few test images before choosing a quality level; `xhigh` and `max` will cost more than these examples.

## [IMG-003] Google image models: Nano Banana 2.1, prices, Imagen shut down
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-30
- Sources: [Gemini image generation](https://ai.google.dev/gemini-api/docs/image-generation), [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), [Gemini deprecations](https://ai.google.dev/gemini-api/docs/deprecations)
- Related: IMG-002, IMG-005, IMG-007

**Models** (image generation page):

| ID | Name | Price per image (paid tier) |
|---|---|---|
| `gemini-nano-banana-2.1` | Nano Banana 2.1, 2026-10-06 | $0.0336 at 1K, $0.0504 at 2K, $0.113 at 4K |
| `gemini-3.1-flash-lite-image` | Nano Banana 2 Lite | $0.0336 at 1K (1K only) |
| `gemini-3.1-flash-image` | Nano Banana 2 | $0.067 at 1K, $0.151 at 4K |
| `gemini-3-pro-image` | Nano Banana Pro | $0.134 at 1K/2K, $0.24 at 4K |

Nano Banana 2.1 is "the primary high-efficiency workhorse model for image generation and conversational editing", and the page says new projects should use it. Its output is billed at "$30 per 1,000,000 tokens"; a 1K image (1024×1024) "consume[s] 1120 tokens". Image output has no free tier ("Not available"). `gemini-2.5-flash-image` shuts down 2027-03-15; the `-preview` IDs are already gone.

**Imagen:** "Imagen models are shut down. Use Nano Banana for image generation." The deprecations page dates the Imagen 4 shutdown 2026-08-17. A skill or tutorial calling `imagen-4.0-*` no longer works.

## [IMG-004] Sizes, formats and transparency for web assets
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-30
- Sources: [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation), [Gemini image generation](https://ai.google.dev/gemini-api/docs/image-generation)
- Related: OG-007, WEBPERF-010, WEBPERF-011, IMG-006, OG-005

**OpenAI (GPT Image 2.5):**
- Sizes: 1024×1024, 1536×1024 and 1024×1536, or a custom `WIDTHxHEIGHT`. "Width and height must be multiples of 16, the aspect ratio must be between 1:3 and 3:1, and neither edge may exceed 3840 pixels." The total must be between 655,360 and 8,294,400 pixels, and "Resolutions above `2560x1440` are experimental."
- Formats: "The default format is `png`, but you can also request `jpeg` or `webp`"; `output_compression` (0–100) applies to JPEG and WebP.
- Transparency: "set `background: "transparent"` and use `output_format: "png"` or `"webp"`."

**Gemini (Nano Banana 2.1):** 1K, 2K and 4K output (1K by default), up to 14 reference images. No transparent-background option was found in the guide.

**For the web:**
- An OG card is 1200×630 (OG-007). 630 isn't a multiple of 16, so ask OpenAI for `1920x1008`: the same 1.905 ratio, both edges multiples of 16, 1,935,360 pixels. Scale it to 1200×630; nothing to crop.
- On pages, serve AVIF or WebP through `NgOptimizedImage` with a loader or as build-time files; `<picture>` can't be used with `ngSrc`, and AVIF is Baseline widely available anyway (WEBPERF-010, WEBPERF-011). That conversion drops C2PA (IMG-006).
- Keep `og:image` as PNG or JPEG: Meta names only "image/jpeg, image/gif or image/png" (OG-007), and a satori card embeds only PNG or JPEG (OG-005).
- Give it real alt text. The model's prompt describes what you wanted, not what's in the picture.

## [IMG-005] Provenance marks: C2PA and SynthID
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [Gemini image generation](https://ai.google.dev/gemini-api/docs/image-generation), [OpenAI help: C2PA in images (unverified)](https://help.openai.com/en/articles/8912793)
- Related: IMG-006, IMG-007, IMG-003

Two kinds of mark:
- **C2PA** is signed metadata (a JUMBF box) inside the file, readable with the Content Authenticity Initiative's tools. Re-encoding or stripping metadata removes it (IMG-006).
- **SynthID** is Google DeepMind's watermark in the pixels themselves; it is designed to survive ordinary edits and is checked with Google's detector, not by reading metadata.

**Google:** "All generated images include a SynthID watermark." The Gemini image page says nothing about C2PA.

**OpenAI:** its help article says API images carry "both C2PA metadata and SynthID watermarks", that metadata "can easily be removed", and that openai.com/verify checks them. That page returned a bot check here, so this is search-result text only (unverified). The image-generation guide itself doesn't mention C2PA.

For a site this means: expect an invisible watermark in every Gemini image and probably every OpenAI one. Don't count on C2PA to label your images as AI-made once they've been through a build pipeline. If the page should say an image is generated, say so in the caption or alt text.

## [IMG-006] Test: sharp drops C2PA in every format and option
- Type: fact
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [sharp output options](https://sharp.pixelplumbing.com/api-output), [contentauth/c2pa-rs test fixtures](https://github.com/contentauth/c2pa-rs/tree/main/sdk/tests/fixtures), [c2pa-node](https://github.com/contentauth/c2pa-node), [sharp api-output at v0.35.5](https://github.com/lovell/sharp/blob/v0.35.5/docs/src/content/docs/api-output.md)
- Related: IMG-005, WEBPERF-010, OG-005

Tested 2026-10-30: `sharp@0.35.5` (libvips 8.18.7), Node v22.22.0, installed with `npm install --ignore-scripts` (its prebuilt binaries come as optional dependencies, so no install scripts were needed).

Input: `CA.jpg` (166,864 B) and `C.jpg` (132,518 B) from contentauth/c2pa-rs's test fixtures, both with a C2PA manifest (the bytes `c2pa` and `jumb` present; `@contentauth/c2pa-node@0.9.11` read a manifest from `CA.jpg`).

Method: each fixture converted to AVIF, WebP, PNG and JPEG, each with default options, `.keepMetadata()` and `.withMetadata()`: 24 outputs.

Result: none of the 24 outputs contained `c2pa`, `jumb`, `jumd` or `contentauth`. c2pa-node reported no manifest in the outputs it read.

sharp's docs at v0.35.5 predict this: the default strips "all metadata", `keepMetadata()` keeps "all metadata (EXIF, ICC, XMP, IPTC)" and `withMetadata()` "most metadata (EXIF, XMP, IPTC)". C2PA's JUMBF box is in neither list. Both fixtures were JPEG; OpenAI returns PNG by default, which wasn't tested.

So an Angular build that converts images with sharp (directly, or through an image CDN built on libvips) ships them without C2PA, even when told to keep metadata. Re-encoding would also break the manifest's hash binding even if the box survived; that wasn't tested. Other converters (`cwebp`, `avifenc`, Squoosh) weren't tested.

## [IMG-007] Ownership and copyright of generated images
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-30
- Sources: [US Copyright Office: Copyright and AI, Part 2: Copyrightability (January 2025)](https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-2-Copyrightability-Report.pdf), [Gemini API Additional Terms of Service (effective 2026-03-23)](https://ai.google.dev/gemini-api/terms), [OpenAI Services Agreement (unverified)](https://openai.com/policies/services-agreement/), [SCOTUSblog: Thaler v. Perlmutter](https://www.scotusblog.com/cases/thaler-v-perlmutter/), [JD Supra: Supreme Court Denies Review in AI Authorship Case](https://www.jdsupra.com/legalnews/supreme-court-denies-review-in-ai-2865518/)
- Related: OSS-001, IMG-005, IMG-010

**Copyright** (US Copyright Office, Part 2, conclusions):
- "Copyright does not extend to purely AI-generated material, or material where there is insufficient human control over the expressive elements."
- "Based on the functioning of current generally available technology, prompts do not alone provide sufficient control."
- "Human authors are entitled to copyright in their works of authorship that are perceptible in AI-generated outputs, as well as the creative selection, coordination, or arrangement of material in the outputs, or creative modifications of the outputs."
- Sufficiency "must be analyzed on a case-by-case basis".

**Vendor terms:**
- **Google**, Gemini API Additional Terms: "Google won't claim ownership over that content. You acknowledge that Google may generate the same or similar content for others and that we reserve all rights to do so."
- **OpenAI**: search-result text only (openai.com returned a bot check). It says the Services Agreement assigns OpenAI's rights in output to the customer.

**Courts:** the Supreme Court denied certiorari in *Thaler v. Perlmutter* (No. 25-449) on 2026-03-02, leaving the D.C. Circuit's human-authorship holding in place without deciding AI-assisted works (law-firm summaries; the docket wasn't read).

In practice, a generated hero image is yours to use but probably nobody's to own. Someone else may get a near-identical one, and you may not be able to stop them copying it. A US view only; other jurisdictions weren't read. Not legal advice.

## [IMG-008] What the popular image-generation skills call
- Type: tool
- Applies to: Claude Code
- Confidence: official-example
- Last verified: 2026-10-30
- Sources: [JimLiu/baoyu-skills](https://github.com/JimLiu/baoyu-skills), [AgriciDaniel/banana-claude](https://github.com/AgriciDaniel/banana-claude)
- Related: SKILL-069, IMG-001, IMG-003, SKILL-041

Read from their READMEs on 2026-10-30; not installed or run.

- **JimLiu/baoyu-skills** (27,076 stars, MIT). Its `baoyu-image-gen` uses "OpenAI GPT Image 2, Azure OpenAI, Google, OpenRouter, DashScope" and others, with keys from env vars (`OPENAI_API_KEY`, `AZURE_OPENAI_API_KEY`, …). Its defaults trail IMG-002 and IMG-003: `OPENAI_IMAGE_MODEL` defaults to `gpt-image-2`, and Replicate to `google/nano-banana-2`. Its posting skills for X and Weibo use "real Chrome with CDP to bypass anti-automation", which puts a personal account at risk under those sites' terms.
- **AgriciDaniel/banana-claude** (1,149 stars, MIT), 3.1.0. Gemini only; it needs "Claude Code 2.1.199 or newer" and "a Gemini API key for a billing-enabled Google AI project". It shows the prompt and a "nominal estimate before any paid request": "One approval permits one provider attempt."

What to look for when vetting one (SKILL-069):
- The key stays in the environment and never reaches a URL, a log or the repo.
- Each paid call is approved and estimated.
- No browser automation of consumer sites.
- Model IDs aren't shut down (IMG-003's Imagen).

A ten-line script against one vendor's SDK does the same job with less surface.

## [IMG-009] Icon libraries for Angular: Lucide, not Phosphor or generation
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-30
- Sources: [@lucide/angular on npm](https://www.npmjs.com/package/@lucide/angular), [Lucide: Angular guide](https://lucide.dev/guide/packages/angular), [phosphor-icons/homepage](https://github.com/phosphor-icons/homepage)
- Related: SPACE-011, SPACE-012, IMG-001

Icons should come from a library, not an image model: they need to be consistent across a set, scale as SVG, inherit `currentColor` and stay small.

- **`@lucide/angular`**: 1.65.0, published 2026-10-30, ISC (`npm view @lucide/angular version license peerDependencies`). It peers `@angular/core` and `@angular/common` `>=17.0.0`, so it works with Angular 22.
- **The older `lucide-angular`**: 1.0.0 peers `13.x - 21.x`, which excludes Angular 22. Use the scoped package.
- **Phosphor** (MIT): official packages exist for web, React, Vue and web components (`@phosphor-icons/core`, `@phosphor-icons/web`, `@phosphor-icons/webcomponents`). `@phosphor-icons/angular` returns 404 on npm, and the homepage lists no Angular package. In Angular, use `@phosphor-icons/web` or inline its SVGs.

Size and align icons against the text beside them per SPACE-011 and SPACE-012. When a needed icon doesn't exist, Claude can draw a simple SVG in the set's grid and stroke (IMG-001); an image model can't match a set.

## [IMG-010] When to generate an image for a site, and how to keep it reproducible
- Type: recommendation
- Applies to: general
- Confidence: single-source
- Last verified: 2026-10-30
- Sources: [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation), [Gemini image generation](https://ai.google.dev/gemini-api/docs/image-generation), [US Copyright Office Part 2](https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-2-Copyrightability-Report.pdf)
- Related: IMG-002, IMG-003, IMG-006, IMG-007, IMG-009, OG-009, OG-005, OG-007

Our judgement from the entries above.

**Draw in code first:** OG cards (satori, OG-009), icons (IMG-009), charts and diagrams. Code is diffable, themeable and free per render.

**Generate** only where a photo-like or illustrated image adds something: a hero, an empty-state illustration, a blog cover. Then:
1. Pick a current model: Nano Banana 2.1 at 1K is among the cheapest ($0.0336, the same as Nano Banana 2 Lite); either GPT Image 2.5 model when you need transparency (IMG-002 to IMG-004).
2. Draft at the final size and medium quality, pick one, and refine it with the edit endpoint. Neither guide documents a seed, so a re-render at higher quality is a different picture.
3. Commit the source PNG plus a sidecar file with the model ID, date, prompt, edit steps and response ID. Models shut down within months (IMG-002), so the prompt alone won't reproduce it.
4. Convert to AVIF and WebP in the build (WEBPERF-010), accepting that C2PA is lost (IMG-006). If disclosure matters, write it in the page. For an OG card, embed the PNG or JPEG source, not the build output: WebP drew nothing in satori and AVIF made it throw (OG-005).
5. Treat the image as unowned (IMG-007). Don't use it as a logo or trademark. The sidecar also records your own edits, the human contribution the Copyright Office asks about.

## Recommendations for our setup

Ranked by impact against effort.

1. **Use `@lucide/angular`, not `lucide-angular`, in any Angular 22 app that needs icons** (IMG-009). Check osrs-tracker-web and freek-mencke-web's `package.json` when next touched.
2. Decision: **no image-generation skill installed**. When an image is needed, call one vendor's API from a short script with the key in the environment, and keep a sidecar with model and prompt (IMG-008, IMG-010).
3. **Don't generate logos or brand marks** (IMG-007).

## Open questions

- **OpenAI's terms and C2PA article:** openai.com and help.openai.com returned a bot check from the cloud session; read only as search text (IMG-005, IMG-007).
- **GPT Image 2.5 cost per image:** no table; measure `usage` on real prompts (IMG-002).
- **Does SynthID survive AVIF at web quality settings?** Not testable without Google's detector (IMG-005).
- **Gemini transparency and output formats:** not found in the guide (IMG-004).
- **Copyright outside the US:** only the US Copyright Office was read (IMG-007).
