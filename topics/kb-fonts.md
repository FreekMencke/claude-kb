# Type design pipeline and web font delivery

Prefix `FONT`. This file covers building a font family from sources with the fontTools and Google Fonts tools on
2026-10-17 (UFO and designspace sources, fontmake against fontc, ufo2ft's feature writers, the variable-font
instancer, gftools builder), OpenType feature code, hinting and the `gasp` table, QA with Fontspector, release
layout, version fields and the OFL, and serving the fonts on the web: WOFF2, subsetting, `unicode-range`,
`font-display`, preload, fallback metric overrides, variable-font CSS and OpenType features in CSS. It ends with what
Claude can and can't do in type design. Choosing and pairing typefaces is in `kb-design.md` (DESIGN-006,
DESIGN-020); LCP and CLS measurement is in `kb-web-analytics-seo.md` (WEB-010, WEB-011).

Research basis:
- Researched 2026-10-17 (FreekMencke/claude-kb#176, part of roadmap #167) by an Opus 5.5 lead with three Sonnet 5.5
  readers.
- Versions and dates come from the PyPI JSON API (`https://pypi.org/pypi/<pkg>/json`: `info.version` and the upload
  time of that release), GitHub's releases API (`/repos/<owner>/<repo>/releases`), the npm registry
  (`npm view web-features dist-tags`, `npm view web-features 'time[3.43.0]'`), and raw release notes, READMEs,
  `NEWS.rst` and source files at the tags named in each entry.
- Browser support comes from `web-features` 3.43.0 (published 2026-10-15) and `@mdn/browser-compat-data` 8.1.6,
  read from their `data.json`, not from memory.
- Behaviour was tested on WSL2 with Python 3.12.3 and the official packages pinned in a scratch venv:
  `fonttools[woff,ufo]==4.67.0`, `fontmake==3.12.2` (with ufo2ft 3.9.1), `fontc==1.0.0`, `ttfautohint-py==0.6.1`,
  and the Fontspector 1.9.0 Linux binary from its GitHub release. Test sources were fontmake 3.12.2's own test data
  (`tests/data/MutatorSans`, `DesignspaceTest`) and Work Sans (OFL) from `google/fonts`. The Claude probe ran
  Claude Code 2.1.296 (`claude -p`, Haiku 5.5).
- Our setup was read on 2026-10-17 from local checkouts of osrs-tracker-web and freek-mencke-web, and of our own
  typeface project, which is private and described here only as a pattern: a family with nine static weights and a
  variable font built from UFO sources.

## Quick answers

| Question | Answer | Entries |
|---|---|---|
| Can fontc replace fontmake? | Not for a family with static OTF and TTF: fontc 1.0.0 (2026-09-01) outputs TrueType only, makes no static instances from a variable source, removes no overlaps in statics, and reads designspace at the v4 level. Tested: it ignored `<variable-fonts>`, wrote no STAT axis values from `<labels>`, and panicked on a discrete axis. Keep fontmake 3.12.2; use fontc for a VF at most. | FONT-003, FONT-004 |
| Is UFO 4 out? Which source format should I use? | No: UFO 3 (published March 2012) is current, UFO 4 is "In development" with no date, and fontTools 4.67.0 reads UFO 1 to 3. Use UFO 3 masters plus a designspace 5 file; Glyphs files convert through glyphsLib. | FONT-001, FONT-002 |
| How do I compile-check a `.fea` file? | `fonttools feaLib -o /tmp/out.ttf features.fea font.ttf`: exit 1 with the file, line and column on a syntax error or a glyph missing from the font. No `--lazy` option. It needs a compiled font with the same glyph names. | FONT-010, FONT-009 |
| Do I write `kern` and `mark` by hand? | No: ufo2ft writes `kern`, `mark`, `mkmk`, `curs` and `GDEF` from kerning groups and anchors, and skips any feature `features.fea` already defines. Mark the spot with `# Automatic Code` to mix both. Hand-write `liga`, `case`, `ss01`, `tnum`. | FONT-005, FONT-009 |
| Should I hint the fonts? | Static TTF: ttfautohint (1.8.4; fontmake `--autohint` runs it on TTFs only); static OTF: AFDKO's `otfautohint`, which replaced psautohint in AFDKO 4.0.0. Variable fonts: leave unhinted (Google Fonts' advice), with `gasp` 0x000F and a minimal `prep` from `gftools fix-nonhinting`. | FONT-011, FONT-012, FONT-013 |
| Font Bakery or Fontspector, and how do I run it in CI? | Fontspector 1.9.0 (2026-10-09), "a Rust port of fontbakery"; Font Bakery's last release is 1.1.0 (2025-10-02) and Google Fonts now uses Fontspector. Profile `universal` (default; includes the `opentype` checks) unless submitting to Google Fonts. In CI: `fonttools/setup-fontspector`; it exits 1 on FAIL by default (`-e warn` to fail on warnings too). | FONT-014, FONT-015 |
| Which files should a release ship? | Static OTF and TTF, a variable TTF named `Family[wght].ttf`, and WOFF2 for the web, each format in its own folder. WOFF (1) isn't needed: WOFF2 is Baseline since 2016. Keep statics next to the VF for desktop apps and tools that can't read a VF. | FONT-016 |
| How do I set a font's version? | UFO `versionMajor` and `versionMinor`: ufo2ft writes `head.fontRevision` and name ID 5 "Version 1.000" from them, zero-padding the minor to three digits, so minor `3` is 1.003, not 1.3. Keep both fields equal; Fontspector fails a mismatch over 1/2000. | FONT-017 |
| Does subsetting or converting an OFL font mean renaming it? | Only if it declares a Reserved Font Name: subsetting is modification ("Yes"), and WOFF compression of unchanged data isn't. Google Fonts wants no RFNs; the OFL FAQ encourages them. | FONT-018 |
| Why did `pyftsubset` drop my `tnum` or `case`? | Its default keeps only `calt ccmp clig curs dnom frac kern liga locl mark mkmk numr rclt rlig rvrn` plus shaping features. Pass `--layout-features='*'` or `--layout-features+=tnum,case,ss01`. It also keeps only name IDs 0 to 6. | FONT-019 |
| Which `font-display`, and does it affect LCP and CLS? | `swap` or `optional` for body text; `block` hides text (up to about 3 s in Chromium and Firefox) and text in its block period doesn't count as rendered for LCP. `optional` plus preload avoids swap shifts; `swap` needs a metric-matched fallback. Preload only the critical file, with `crossorigin`. | FONT-021, FONT-020, FONT-022 |
| Are `size-adjust` and `ascent-override` Baseline? | `size-adjust` yes (widely available since 2023-09-18, Safari 17). `ascent-override`, `descent-override` and `line-gap-override` no: not in Safari. `font-size-adjust` is newly available since 2024-07-25 (web-features 3.43.0). | FONT-022 |
| `font-weight` range or `font-variation-settings` for a variable font? | `font-weight: 100 900` in `@font-face`, then plain `font-weight`. `font-variation-settings` only for axes with no property; it overrides `font-weight` and must repeat every axis. Likewise `font-variant-numeric: tabular-nums` over `font-feature-settings: "tnum"`. | FONT-023 |
| Can Claude do type design? | It edits the text sources well: `.fea`, designspace XML, `.glif` anchors and build configs (Haiku 5.5 did all three probe tasks correctly for $0.02). It can script outlines derived from existing ones, but not draw new letterforms well; a person judges every outline at large size. | FONT-024 |

## Index

| ID | Title | Type | Tags |
|---|---|---|---|
| FONT-001 | Source formats: UFO 3 is current, UFO 4 isn't published, Glyphs files go through glyphsLib | fact | ufo, glyphs, glyphslib, sources |
| FONT-002 | Designspace 5: discrete axes, `<variable-fonts>` and axis labels | fact | designspace, variable-fonts, stat, fontmake |
| FONT-003 | fontc 1.0.0: what it builds and what it doesn't | fact | fontc, fontmake, compiler, rust |
| FONT-004 | fontc or fontmake for nine static weights and a variable font | comparison | fontc, fontmake, static-instances, designspace |
| FONT-005 | ufo2ft writes `kern`, `mark` and `mkmk` from groups and anchors | pattern | ufo2ft, feature-writers, kerning, anchors |
| FONT-006 | `varLib.instancer`: static fonts and narrower axes from a variable font | tool | fonttools, instancer, variable-fonts, static-instances |
| FONT-007 | Check master compatibility with `varLib.interpolatable` | tool | fonttools, interpolation, masters, qa |
| FONT-008 | gftools builder and the Google Fonts project template | tool | gftools, builder, google-fonts, template |
| FONT-009 | Writing OpenType feature code: the parts a family needs | pattern | opentype-features, fea, kern, ss01 |
| FONT-010 | Compile-check feature code with `fonttools feaLib` | pattern | fea, fealib, validation, ci |
| FONT-011 | Hinting static fonts: ttfautohint for TTF, `otfautohint` for OTF | recommendation | hinting, ttfautohint, otfautohint, afdko |
| FONT-012 | Leave variable fonts unhinted | recommendation | hinting, variable-fonts, vtt, gftools |
| FONT-013 | The `gasp` table for hinted and unhinted fonts | fact | gasp, hinting, opentype-spec |
| FONT-014 | Fontspector replaces Font Bakery: profiles and install | comparison | fontspector, fontbakery, qa, profiles |
| FONT-015 | Running Fontspector in CI | pattern | fontspector, ci, github-actions, qa |
| FONT-016 | Release layout: which formats, folders and file names | recommendation | release, woff2, variable-fonts, file-names |
| FONT-017 | Version fields: `head.fontRevision`, name ID 5 and UFO `versionMinor` | fact | versioning, name-table, head-table, ufo2ft |
| FONT-018 | The OFL, Reserved Font Names and web subsets | fact | ofl, license, reserved-font-name, subsetting |
| FONT-019 | Subsetting with `pyftsubset`: its defaults drop features | anti-pattern | pyftsubset, subsetting, woff2, opentype-features |
| FONT-020 | `unicode-range` slices and preloading a font | pattern | unicode-range, preload, google-fonts, crossorigin |
| FONT-021 | `font-display` and its effect on LCP and CLS | recommendation | font-display, lcp, cls, web-performance |
| FONT-022 | Fallback metric overrides and `font-size-adjust`: what's Baseline | fact | size-adjust, ascent-override, font-size-adjust, cls |
| FONT-023 | Variable-font and OpenType-feature CSS: use the high-level properties | recommendation | variable-fonts, font-weight, font-variation-settings, font-variant-numeric |
| FONT-024 | What Claude can and can't do in type design | fact | claude, type-design, fea, glif |

## [FONT-001] Source formats: UFO 3 is current, UFO 4 isn't published, Glyphs files go through glyphsLib
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [unifiedfontobject.org](https://unifiedfontobject.org/), [UFO 4](https://unifiedfontobject.org/versions/ufo4/), [fontTools.ufoLib at 4.67.0](https://github.com/fonttools/fonttools/blob/4.67.0/Lib/fontTools/ufoLib/__init__.py), [glyphsLib README](https://github.com/googlefonts/glyphsLib), [fontmake README](https://github.com/googlefonts/fontmake), [fontc README](https://github.com/googlefonts/fontc)
- Related: FONT-002, FONT-003, FONT-024

UFO 3 is the newest published UFO spec. Write UFO 3 and don't wait for UFO 4.

**Versions** (unifiedfontobject.org, 2026-10-17): "UFO 1 Published in 2004. UFO 2 Published in March 2009. UFO 3 Published in March 2012. UFO 4 In development." The UFO 4 page: "UFO 4 will be an extension of UFO 3", developed "in the specification's GitHub issues", with no date. fontTools 4.67.0's `ufoLib` defines only `FORMAT_1_0`, `FORMAT_2_0` and `FORMAT_3_0`; ufoLib2 0.19.1 (2026-10-13) builds on it (`fonttools[ufo]>=4.58.0`).

**Glyphs files.** glyphsLib is "a bridge from Glyphs source files (.glyphs) to UFOs and Designspace files", with `glyphs2ufo` and `ufo2glyphs` scripts. 6.16.1 (2026-10-16) reads Glyphs 2 and 3 files and `.glyphspackage` folders. fontmake 3.12.2 builds `.glyphs` and `.glyphspackage` directly through glyphsLib; fontc has its own Glyphs reader.

**Why UFO plus designspace suits a repo:** a UFO is a folder of XML `.glif` files and property lists, one file per glyph, and a designspace is XML. Diffs, reviews and Claude's edits work on them as text (FONT-024), and the masters build with every tool in this file. A `.glyphs` file is one large text file per family; `.glyphspackage` splits it into a folder.

## [FONT-002] Designspace 5: discrete axes, `<variable-fonts>` and axis labels
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [designspaceLib XML format](https://fonttools.readthedocs.io/en/latest/designspaceLib/xml.html), [fonttools NEWS.rst](https://github.com/fonttools/fonttools/blob/main/NEWS.rst), [fontmake 3.12.2 source](https://github.com/googlefonts/fontmake/tree/v3.12.2/Lib/fontmake), [fontc 1.0.0 release notes](https://github.com/googlefonts/fontc/releases/tag/fontc-v1.0.0)
- Related: FONT-001, FONT-004, FONT-006

Designspace format 5.0 shipped in fontTools 4.33.0 (released 2022-04-21): "Added discrete axes, variable fonts, STAT information, either design- or user-space location on instances." Format 5.1 added axis mappings for `avar2` (4.40.0, 2023-06-12).

**What 5.0 adds:**
- **Discrete axes:** "Discrete axes have a list of values instead of a range minimum and maximum", such as an italic axis with values 0 and 1.
- **`<variable-fonts>`** with `<axis-subset>` children: several variable fonts from one document. Without it, if "all the axes are continuous, then we assume, as in version 4 of the format, that the whole document describes one variable font covering the whole space."
- **Axis `<labels>`:** STAT axis values (formats 1 to 3), such as `<label uservalue="400" name="Regular" elidable="true" linkeduservalue="700"/>`. Top-level labels give format 4. Instance names can be computed from them.

**Tool support on 2026-10-17:**
- fontmake 3.12.2 reads all of it: `--variable-fonts` filters which ones to build, and discrete axes are split into interpolable sub-spaces.
- `fonttools varLib` takes `--variable-fonts` too.
- fontc 1.0.0: "supported at the v4 feature level" (FONT-003, FONT-004).
- gftools builder: not verified.

Tested 2026-10-17, fontmake 3.12.2: from fontmake's test files, a document with three `<variable-font>` elements gave three VFs, and one with a discrete axis gave four.

## [FONT-003] fontc 1.0.0: what it builds and what it doesn't
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [fontc 1.0.0 release notes](https://github.com/googlefonts/fontc/releases/tag/fontc-v1.0.0), [fontc README](https://github.com/googlefonts/fontc), [fontc#837](https://github.com/googlefonts/fontc/issues/837), [fontc#717](https://github.com/googlefonts/fontc/issues/717), [fontc crater](https://googlefonts.github.io/fontc_crater/), [fontc on PyPI](https://pypi.org/project/fontc/)
- Related: FONT-004, FONT-008, FONT-005

fontc is Google Fonts' font compiler in Rust. 1.0.0 was released on 2026-09-01 (GitHub tag `fontc-v1.0.0`; `pip install fontc==1.0.0` installs a prebuilt binary).

**Goal:** "drop-in compatibility with fontmake for DesignSpace+UFO and Glyphs sources: fontc is continuously validated against fontmake across ~3,450 Google Fonts build targets: ~89% of the targets both compilers can build produce identical output". The README: "Moving towards using `fontc` exclusively for all Google Fonts builds."

**Not in 1.0**, from the release notes:
- "TrueType-flavoured output only: no CFF/OTF (`-o otf`) or CFF2 output, and no PostScript hinting."
- "No static-instance generation from a variable source (fontmake's `-i`/`--interpolate`)".
- "No overlap removal in static builds" (#717, open).
- Designspace "at the v4 feature level" (#837, open, updated 2026-10-07).
- Custom Python feature writers and filters can't run. Of ufo2ft's filters, only flattenComponents, eraseOpenCorners, propagateAnchors and decomposeTransformedComponents are recognised.
- "Per-master feature files that differ between masters are rejected".

**CLI:** one source in, one TTF out: `fontc Family.designspace -o Family[wght].ttf` (default `build/font.ttf`). `fontc --help` has no format or instance options.

**Speed:** the README's reason for fontc is "The python compiler is too slow". No official page gives a timing against fontmake; the crater dashboard tracks parity, not speed.

## [FONT-004] fontc or fontmake for nine static weights and a variable font
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [fontc 1.0.0 release notes](https://github.com/googlefonts/fontc/releases/tag/fontc-v1.0.0), [fontmake README](https://github.com/googlefonts/fontmake), [fontmake 3.12.2 test data](https://github.com/googlefonts/fontmake/tree/v3.12.2/tests/data)
- Related: FONT-003, FONT-002, FONT-006, FONT-017

Keep fontmake for a family that ships static OTF and TTF beside a variable font: fontc 1.0.0 builds only the variable TTF, and drops designspace 5 data.

**The build** (our pattern: five UFO masters, a designspace 5 file):

```
fontmake -m Family.designspace -i -o otf --output-dir fonts/otf
fontmake -m Family.designspace -i -o ttf --autohint --output-dir fonts/ttf
fontmake -m Family.designspace -o variable --output-path "fonts/variable/Family[wght].ttf"
```

fontc covers the third line. Statics could be cut from its VF with `varLib.instancer` (FONT-006), but only as TrueType, with no CFF and no PostScript hints.

Tested 2026-10-17, fontc 1.0.0 against fontmake 3.12.2, Python 3.12, on fontmake's test sources:
- **Axis labels:** a weight-only designspace 5 with `<labels>` built in both. fontmake's STAT had 3 axis values (Light, elidable Regular linked to 700, Bold); fontc's had 0. `varLib.instancer --update-name-table` then failed on fontc's font: "Cannot update name table since there are no STAT Axis Values".
- **`<variable-fonts>`** listing three VFs: fontmake built three files; fontc ignored the element and built one VF over both axes.
- **A discrete axis:** fontc panicked ("called `Option::unwrap()` on a `None` value", exit 101); fontmake built four VFs.
- **Name ID 5:** fontc appends its own version: "Version 1.002;fontc 1.0.0".
- **Speed:** both took under a second on these tiny fonts, so this was no speed test.

Revisit when fontc#837 (designspace 5) and fontc#717 (static overlaps) close.

## [FONT-005] ufo2ft writes `kern`, `mark` and `mkmk` from groups and anchors
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [ufo2ft README](https://github.com/googlefonts/ufo2ft), [featureCompiler.py at v3.9.1](https://github.com/googlefonts/ufo2ft/blob/v3.9.1/Lib/ufo2ft/featureCompiler.py), [featureWriters at v3.9.1](https://github.com/googlefonts/ufo2ft/tree/v3.9.1/Lib/ufo2ft/featureWriters), [ufo2ft filters at v3.9.1](https://github.com/googlefonts/ufo2ft/tree/v3.9.1/Lib/ufo2ft/filters)
- Related: FONT-009, FONT-010, FONT-003

Don't hand-write `kern`, `mark` or `mkmk` in a UFO's `features.fea`: ufo2ft (3.9.1, 2026-09-28; fontmake uses it) generates them, and a hand-written one switches its writer off.

- **Defaults:** `defaultFeatureWriters = [CursFeatureWriter, KernFeatureWriter, MarkFeatureWriter, GdefFeatureWriter]`. README: "If your font's features do not contain kerning/mark/mkmk features, ufo2ft will create them based on your font's kerning/anchor data."
- **Kerning** comes from `kerning.plist` and the `public.kern1.*` and `public.kern2.*` groups. The writer splits lookups by script and drops pairs that mix scripts, or right-to-left with left-to-right. Options: `ignoreMarks=True, quantization=1`.
- **Marks** come from anchors: `top` on a base glyph, `_top` on a mark, `top_1` and `top_2` on a ligature's components. The writer "Generates a mark, mkmk, abvm and blwm features based on glyph anchors".
- **Mixing:** writers run in `mode = "skip"` ("will not write features if already present"). To mix your rules with generated ones, put a `# Automatic Code` comment where the generated code goes; otherwise the kern writer warns "font has kerning, but also manually written kerning features without an insertion comment. Dropping the former."
- **Config:** the UFO lib key `com.github.googlei18n.ufo2ft.featureWriters` takes a list of `{"class": …, "options": {…}}`; `fontmake --feature-writer None` turns them all off. Filters go under `com.github.googlei18n.ufo2ft.filters` as `{"name", "pre", "include"/"exclude"}`, among them `decomposeComponents`, `flattenComponents`, `propagateAnchors`, `removeOverlaps` and `sortContours`.

So accented letters built as composites, with anchors and kerning groups, get mark positioning and kerning with no feature code. Hand-write the substitutions (FONT-009).

## [FONT-006] `varLib.instancer`: static fonts and narrower axes from a variable font
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [instancer docs](https://fonttools.readthedocs.io/en/latest/varLib/instancer.html), [instancer at 4.67.0](https://github.com/fonttools/fonttools/blob/4.67.0/Lib/fontTools/varLib/instancer/__init__.py), [fonttools NEWS.rst](https://github.com/fonttools/fonttools/blob/main/NEWS.rst)
- Related: FONT-004, FONT-008, FONT-016, FONT-020

`fonttools varLib.instancer` pins or narrows a variable font's axes. Pinning every axis gives a static TrueType font; narrowing one gives a smaller variable font, for example one with only the weights a site uses.

From `--help` at 4.67.0:
- `AXIS=LOC`: "wdth=100 or wght=75.0:125.0 or wght=100:400:700 or wght=:500: or wght=drop". `--static` pins the axes you don't name at their defaults.
- `--update-name-table`: "Input font must have a STAT table with Axis Value Tables". fontc 1.0.0's output has none (FONT-004).
- `--remove-overlaps`: "(only applicable when generating a full instance). Requires skia-pathops".
- `--downgrade-cff2`: turns CFF2 into CFF when every axis is pinned.
- `varLib.mutator` is deprecated "in favor of ``varLib.instancer``" (NEWS 4.59.1).

gftools builder runs it as its `subspace` and `gen-static` steps (FONT-008). Google Fonts makes the statics it serves this way from an autohinted family's VF (FONT-016).

Tested 2026-10-17, fonttools 4.67.0, Work Sans `[wght]` (100 to 900, default 400), each subset afterwards to the Latin range Google Fonts serves, all features, WOFF2:
- Full axis: 77,816 bytes.
- `wght=300:700`: 72,264 bytes (7% smaller).
- `wght=400:700`: 55,448 bytes (29% smaller), since the range no longer reaches the masters below the default.
- `wght=500 wdth=0` on a two-axis font gave a static TTF with `usWeightClass` 500.

Match the `@font-face` `font-weight` range to the narrowed axis (FONT-023).

## [FONT-007] Check master compatibility with `varLib.interpolatable`
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [interpolatable.py at 4.67.0](https://github.com/fonttools/fonttools/blob/4.67.0/Lib/fontTools/varLib/interpolatable.py), [fonttools NEWS.rst](https://github.com/fonttools/fonttools/blob/main/NEWS.rst), [fontc 1.0.0 release notes](https://github.com/googlefonts/fontc/releases/tag/fontc-v1.0.0)
- Related: FONT-002, FONT-014, FONT-024

Run `fonttools varLib.interpolatable` on the designspace after editing masters and before building. It lists glyphs whose contours, points, components, starting points or curve directions don't match across masters, which otherwise stop the build or put kinks into instances.

- **Input:** "a single variable font / DesignSpace / Glyphs file, or multiple TTF/UFO files".
- **Options:** `--tolerance` (default 0.95), `--kinkiness` (default 0.5), `--glyphs`, `--ignore-missing`, and reports with `--json`, `--pdf` or `--html`.
- **4.67.0** (2026-10-14) "Respect designspace source layers".
- **Exit code:** 1 when it finds a problem, so it works as a build or CI step.

Tested 2026-10-17, fonttools 4.67.0:
- A clean two-master designspace exited 0 with no output.
- fontmake's MutatorSans test source exited 1, listing every glyph missing from its sparse support layers ("Glyph was missing in master MutatorSansLightCondensed (support.crossbar)"). Sparse layers are legitimate, so read the report rather than gating on it blindly.
- On the same source fontc 1.0.0 stopped with "'S.closed' has interpolation-incompatible paths" where fontmake 3.12.2 built the VF (FONT-004).

Compatibility errors are about the drawing, not the code: Claude can run the check and point at the glyph, but a person decides how to fix the outline (FONT-024).

## [FONT-008] gftools builder and the Google Fonts project template
- Type: tool
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [gftools builder docs](https://github.com/googlefonts/gftools/blob/main/docs/gftools-builder/README.md), [gftools builder/fontc.py at v0.10.4](https://github.com/googlefonts/gftools/blob/v0.10.4/Lib/gftools/builder/fontc.py), [googlefonts-project-template](https://github.com/googlefonts/googlefonts-project-template), [GF guide: build](https://googlefonts.github.io/gf-guide/build.html)
- Related: FONT-003, FONT-006, FONT-015, FONT-016

`gftools builder config.yaml` "wraps fontmake and a number of post-processing fixes to build variable, static OTF, static TTF and webfonts from Glyphs, Designspace/UFO or UFO sources". gftools 0.10.4 was released 2026-10-16.

**Default outputs:** variable fonts in `fonts/variable` (run through `gftools-fix`, with a STAT table); "All static instances with TrueType outlines, in `fonts/ttf`. These will be autohinted"; CFF statics in `fonts/otf`; "Variable and static TTF WOFF2 webfonts, in `fonts/webfonts`."

**Config keys** include `sources` (required), `buildVariable`, `buildStatic`, `buildOTF`, `buildTTF`, `buildWebfont`, `autohintTTF` (default true), `autohintOTF` (default false), `vttSources`, `removeOutlineOverlaps`, `instances`, `stat` and `extraFontmakeArgs`. Recipes can list the steps by hand.

**fontc:** only with `--experimental-fontc <path>`. Then gftools turns off webfonts, ttfautohint ("because we had a segfault"), statics when a VF is built, and OTF.

**The project template** (googlefonts-project-template, `main` on 2026-10-17): requirements `fontmake>=3.9.0` and `gftools>=0.9.54`; `make build` runs `gftools builder` per `sources/config*.yaml`; `make test` runs `fontspector --profile googlefonts` (FONT-015); `make proof` runs diffenator3. Its sample config sets `buildOTF: false`.

For a family not bound for Google Fonts, plain fontmake commands (FONT-004) are simpler to read and to have Claude edit; the builder pays off with Google Fonts' fixes and STAT handling.

## [FONT-009] Writing OpenType feature code: the parts a family needs
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [OpenType Feature File Specification](https://adobe-type-tools.github.io/afdko/OpenTypeFeatureFileSpecification.html), [spec source on GitHub](https://github.com/adobe-type-tools/afdko/blob/develop/docs/OpenTypeFeatureFileSpecification.md), [feaLib docs](https://fonttools.readthedocs.io/en/latest/feaLib/index.html)
- Related: FONT-005, FONT-010, FONT-023

The feature file syntax is Adobe's: "Document version 1.27, Last updated 7 October 2024". fontTools' feaLib compiles it and links to that spec.

```
languagesystem DFLT dflt;
languagesystem latn dflt;

@A = [A Aacute Adieresis];
@V = [V W Y];
markClass [acute dieresis] <anchor 250 0> @TOP;

feature kern {
    enum pos Aacute V -80;   # a pair from classes, as an exception
    pos @A @V -60;           # class pair
} kern;
feature mark { pos base [A H] <anchor 300 700> mark @TOP; } mark;
feature liga { sub I J by IJ; } liga;
feature case { sub parenleft by parenleft.case; } case;
feature tnum { sub [zero one two] by [zero.tf one.tf two.tf]; } tnum;
feature ss01 {
    featureNames { name "Closed S"; };
    sub S by S.closed;
} ss01;
```

Rules from the spec:
- "if at least one glyph class is present (even if it is a singleton glyph class), then the rule is interpreted as a class pair"; "the specific glyph pairs should precede the glyph class pairs".
- "The mark classes used within a single lookup must be disjoint".
- `featureNames` "must precede any of the rules in the feature".
- `languagesystem DFLT dflt;` "must be the first of the languagesystem statements".
- `include(file.fea)` paths resolve against the UFO first; "A maximum include depth of 50".

In a UFO build, leave `kern`, `mark` and `mkmk` to ufo2ft (FONT-005). In CSS, reach these features through `font-variant-*` (FONT-023).

## [FONT-010] Compile-check feature code with `fonttools feaLib`
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [feaLib docs](https://fonttools.readthedocs.io/en/latest/feaLib/index.html), [feaLib __main__.py at 4.67.0](https://github.com/fonttools/fonttools/blob/4.67.0/Lib/fontTools/feaLib/__main__.py), [AFDKO NEWS](https://github.com/adobe-type-tools/afdko/blob/develop/NEWS.md)
- Related: FONT-009, FONT-024, FONT-005

To check `.fea` edits without a full build, compile them into an existing font with the same glyph names:

```
fonttools feaLib -o /tmp/check.ttf features.fea fonts/ttf/Family-Regular.ttf
```

- **Options** (4.67.0): `-o/--output`, `-t/--tables` (build only these tables), `-d/--debug`, `-v`, `--traceback`. There is no `--lazy`.
- **Exit 1** on an error, before anything is saved, so it works as a gate for an agent or CI.
- **Tables** it can build: BASE, GDEF, GPOS, GSUB, OS/2, head, hhea, name, vhea and STAT.

Tested 2026-10-17, fonttools 4.67.0, against a static TTF cut from fontmake's MutatorSans:
- A file with `kern` (class pairs and `enum`), `mark`, `liga`, `case` and `ss01` with `featureNames` compiled, exit 0.
- A missing glyph: "The following glyph names are referenced but are missing from the glyph set: S.alt (first found at bad.fea:5:14)", exit 1.
- A missing semicolon after `sub I J by IJ`: "syntax.fea:3:1: Expected '['", exit 1. The position is the next token, a line below the mistake.
- `-t GSUB` rebuilt only GSUB and left the font's GPOS as it was.

A clean compile proves syntax and glyph names, not that a feature does what you meant: render a proof with the feature turned on and look at it.

AFDKO's equivalent is now `afdko makeotf` or `afdko addfeatures`: 5.0.0 (2026-03-22) moved every tool under `afdko <command>` and deprecated the separate wrappers.

## [FONT-011] Hinting static fonts: ttfautohint for TTF, `otfautohint` for OTF
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [ttfautohint manual](https://freetype.org/ttfautohint/doc/ttfautohint.html), [ttfautohint 1.8.4 tarball (NEWS)](https://download.savannah.gnu.org/releases/freetype/ttfautohint-1.8.4.tar.gz), [ttfautohint-py on PyPI](https://pypi.org/project/ttfautohint-py/), [fontmake font_project.py at v3.12.2](https://github.com/googlefonts/fontmake/blob/v3.12.2/Lib/fontmake/font_project.py), [AFDKO NEWS](https://github.com/adobe-type-tools/afdko/blob/develop/NEWS.md), [GF guide: statics](https://googlefonts.github.io/gf-guide/statics.html)
- Related: FONT-012, FONT-013, FONT-017

Autohint static TTFs with ttfautohint and static OTFs with AFDKO's `otfautohint`. Google Fonts: "Static fonts should be hinted using the latest version of ttfautohint."

**ttfautohint** is at 1.8.4 ("Version 1.8.4 (2021-Aug-14)" in its NEWS). ttfautohint-py 0.6.1 (2026-07-15) ships "a precompiled `ttfautohint` executable", which reports itself as 1.8.4.16-eb64. Options that matter:
- `-n/--no-info`: without it, ttfautohint appends its version to name ID 5 (tested: "Version 2.012; ttfautohint (v1.8.4.16-eb64)"; see FONT-017).
- `-x/--increase-x-height` (default 14; `0` turns it off), `-a/--stem-width-mode` (default `qsq`), `-D` default script (`latn`), `-f` fallback script (`none`).
- Its `gasp` table is "Set up to always use grayscale rendering, for all sizes", with grid-fitting and symmetric smoothing (FONT-013).

**In fontmake**, `--autohint` runs ttfautohint on static TTFs only, never on OTFs or variable fonts.

**OTF:** AFDKO 4.0.0 (2023-09-11): "The Python port of psautohint was (re)integrated into the AFDKO repository as 'otfautohint'", and psautohint development stopped. Run `otfautohint Family-Regular.otf` after the build; AFDKO 5.0.1 (2026-05-18) still fixes it.

**When to skip it:** the same Google Fonts page says if ttfautohint "results look poor on Windows browsers, it's better to release the fonts unhinted" (FONT-013 for the `gasp` value). Variable fonts: FONT-012.

## [FONT-012] Leave variable fonts unhinted
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [GF guide: variable fonts](https://googlefonts.github.io/gf-guide/variable.html), [how-to-hint-variable-fonts](https://github.com/googlefonts/how-to-hint-variable-fonts), [VisualTrueType](https://github.com/microsoft/VisualTrueType), [VTT docs](https://learn.microsoft.com/en-us/typography/tools/vtt/), [gftools fix.py](https://github.com/googlefonts/gftools/blob/main/Lib/gftools/fix.py)
- Related: FONT-011, FONT-013, FONT-016

Ship variable fonts without TrueType hints, with a `gasp` table and minimal `prep` set for unhinted rendering.

**Google Fonts' guide:** "auto-hinting often results in a worse rendering than no hinting at all. That is why GF recommend to not hint variable fonts in general." And: "Fonts should be unhinted (default setting of gftools builder). Run fonts through gftools fix-nonhinting if you don't use gftools builder." Manual hinting in Microsoft's VTT is the exception, for a family aimed at a particular device or one that already has manual hints. VTT "can also generate variation 'cvar' data for variable fonts"; its docs' newest release note is "Version 6.35 [July, 2021 release]".

**`gftools fix-nonhinting`** sets `gasp` to `{0xFFFF: 15}` and adds a `prep` program (`PUSHW 511 SCANCTRL`, `PUSHB 4 SCANTYPE`) that turns on dropout control. It leaves a font that already has `fpgm` alone. Work Sans's VF in google/fonts has exactly that `prep` and `gasp`.

**ttfautohint on a VF:** its manual and its 1.8.4 NEWS don't mention variable fonts. Tested 2026-10-17, ttfautohint 1.8.4.16-eb64 (ttfautohint-py 0.6.1) on Work Sans `[wght]`, dehinted first: it exited 0 and added `fpgm`, `prep` and `cvt ` but no `cvar`, so the hints come from the default master's outlines and don't vary along the axis. That matches Google Fonts' warning.

fontmake doesn't hint variable fonts (FONT-011), so an unhinted VF needs only the `gasp` and `prep` step.

## [FONT-013] The `gasp` table for hinted and unhinted fonts
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [OpenType spec: gasp](https://learn.microsoft.com/en-us/typography/opentype/spec/gasp), [GF guide: statics](https://googlefonts.github.io/gf-guide/statics.html), [gftools fix.py](https://github.com/googlefonts/gftools/blob/main/Lib/gftools/fix.py), [Fontspector](https://github.com/fonttools/fontspector)
- Related: FONT-011, FONT-012, FONT-014

`gasp` tells the rasteriser, per range of pixel sizes, whether to grid-fit and whether to smooth. The spec page was last updated 2024-05-31.

**Format:**
- "Version number (0 or 1—set to 1 in new fonts)".
- Flags: `0x0001` GASP_GRIDFIT, `0x0002` GASP_DOGRAY, `0x0004` GASP_SYMMETRIC_GRIDFIT, `0x0008` GASP_SYMMETRIC_SMOOTHING; the last two are "Only supported in version 1".
- "The last record should use 0xFFFF as a sentinel value for rangeMaxPPEM". "If the only entry in 'gasp' is the 0xFFFF sentinel value, the behavior described will be used for all sizes."

The spec gives no value for fonts without hints. The tools do, and they disagree:
- `gftools fix-nonhinting`: `{0xFFFF: 15}` (all four flags).
- Fontspector's `googlefonts/gasp` check: "The gasp range 0xFFFF value 0x{:02X} should be set to 0x0F", because "it makes sense to simply toggle all 4 flags ON for all font sizes". It skips CFF fonts.
- Google Fonts' statics guide, for statics left unhinted because ttfautohint looked poor: "GASP table set to 'grayscale / symmetric smoothing' (0x000A) across the full PPEM range."

Use `0x000F` for one `0xFFFF` range: the tool and the check agree on it. ttfautohint writes its own `gasp` for hinted TTFs (FONT-011); CFF-flavoured OTFs don't need one.

Inspect it with `ttx -t gasp -o - Family-Regular.ttf`.

## [FONT-014] Fontspector replaces Font Bakery: profiles and install
- Type: comparison
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Fontspector README](https://github.com/fonttools/fontspector), [Fontspector 1.9.0 release](https://github.com/fonttools/fontspector/releases/tag/fontspector-v1.9.0), [Font Bakery README](https://github.com/fonttools/fontbakery), [GF guide: QA](https://googlefonts.github.io/gf-guide/qa.html)
- Related: FONT-015, FONT-007, FONT-013

Use Fontspector for font QA. It "is a Rust port of fontbakery"; its repo calls it the "successor to fontbakery". Google Fonts' guide: "Fontbakery was previously our primary quality assurance testing tool. We now use Fontspector". Font Bakery's README now says "See also: Fontspector (the Rust port of Font Bakery)"; its last release is 1.1.0 (2025-10-02), and the README doesn't call it deprecated.

**Versions** (GitHub releases, 2026-10-09): `fontspector-v1.9.0`, with profiles googlefonts 1.10.0, universal 1.9.0 and opentype 1.7.1.

**Install:** the release binaries (Linux x86_64, macOS, Windows), `cargo binstall fontspector`, or `cargo install` (needs protobuf). It isn't on PyPI.

**Profiles** (`-p`; default `universal`):
- `opentype`: OpenType spec compliance.
- `universal`: "best practices", "which do not enforce any foundry-specific behaviour".
- `googlefonts`: "only use this profile if you are planning on submitting a font to Google Fonts".
- Also `iso15008` and `fontwerk`; Microsoft and Adobe profiles are plugins built from source.

Tested 2026-10-17, Fontspector 1.9.0 Linux binary, `--list-checks-json`: `opentype` has 49 checks, `universal` 125 (all 45 `opentype/*` IDs included), `googlefonts` 224. On Work Sans `[wght]`, `universal` took 0.6 s and `googlefonts` 1.2 s; `googlefonts` also failed `version_bump` against the version Google Fonts serves.

For a family not bound for Google Fonts, run `universal`. 1.9.0's release notes add work-in-progress "source fixes" that edit UFO and designspace files for some checks.

## [FONT-015] Running Fontspector in CI
- Type: pattern
- Applies to: general
- Confidence: official-example
- Last verified: 2026-10-17
- Sources: [setup-fontspector](https://github.com/fonttools/setup-fontspector), [Fontspector USING.md](https://github.com/fonttools/fontspector/blob/main/USING.md), [googlefonts-project-template build.yaml](https://github.com/googlefonts/googlefonts-project-template/blob/main/.github/workflows/build.yaml), [googlefonts-project-template Makefile](https://github.com/googlefonts/googlefonts-project-template/blob/main/Makefile)
- Related: FONT-014, FONT-008, GHA-009

Install with `fonttools/setup-fontspector` and let the exit code gate the job:

```yaml
- uses: fonttools/setup-fontspector@main   # pin a SHA in practice
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
- run: fontspector -p universal --succinct --ghmarkdown report.md fonts/ttf/*.ttf fonts/variable/*.ttf
```

**Exit code:** `-e, --error-code-on <STATUS>`: "Threshold for emitting process error code 1. (default: fail)", values `skip`, `pass`, `info`, `warn`, `fail`, `error`. So FAIL and ERROR fail the job and WARN doesn't; `-e warn` makes warnings fail too. Tested 2026-10-17, 1.9.0: exit 1 on fonts with FAILs, with and without `-e warn`.

**Reports:** `--json`, `--csv`, `--ghmarkdown` (for a job summary or PR comment), `--html`, `--badges <dir>`. `--skip-network` skips checks that query servers; `--configuration` takes a TOML file whose `[[overrides]]` change a check's status, for accepting a known FAIL.

**The template doesn't gate:** its `make test` ends in `|| echo '::warning …'` and its workflow step has `continue-on-error: true`, so Google Fonts' template reports and never fails. Drop both to make QA a gate. It checks `fonts/variable` if there is one, else `fonts/ttf`.

The action's README suggests `@main`; pin it to a commit SHA with a version comment (GHA-009).

## [FONT-016] Release layout: which formats, folders and file names
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [GF guide: upstream repo](https://googlefonts.github.io/gf-guide/upstream.html), [GF guide: variable fonts](https://googlefonts.github.io/gf-guide/variable.html), [GF guide: statics](https://googlefonts.github.io/gf-guide/statics.html), [web.dev: font best practices](https://web.dev/articles/font-best-practices), [satori README](https://github.com/vercel/satori), [osrs-tracker-web docs/decisions.md](https://github.com/osrs-tracker/osrs-tracker-web/blob/main/docs/decisions.md)
- Related: FONT-006, FONT-008, FONT-012, FONT-017

Release static OTF and TTF, a variable TTF and WOFF2, each format in its own folder.

**Folders:** "If your project provides multiple formats, do not include them all in one folder. Create a folder for each format e.g `fonts/otf`, `fonts/ttf`, `fonts/webfonts`." gftools builder adds `fonts/variable` (FONT-008). "Releases should be tagged".

**Variable font names:** "Suffixes like `VF` or `VAR` or any other *must not* be appended to the file name. Instead the axes are appended in between brackets: `FamilyName[axis1,axis2].ttf`", e.g. `Family[wght].ttf` and `Family-Italic[wght].ttf`.

**Statics beside the VF:** Google Fonts onboards only the VF when the statics are autohinted ("The API will generate statics fonts by instantiating the VF") and both when they're hand-hinted. It takes TrueType only, but "The upstream repo can of course contain OTF-CFF `.otf` fonts, as well as webfonts `.woff2`." Keep statics for desktop apps and for tools that can't read a VF: osrs-tracker-web's Open Graph cards render with satori, which "can't read a variable font", so they load two static TTFs from the release. satori's README lists TTF, OTF, WOFF and WOFF2 and is silent on variable fonts.

**Web formats:** WOFF2 only. web.dev: "Use only WOFF2 and forget about everything else." WOFF2 in `@font-face` has been Baseline since 2016-09-20 and is widely available (web-features 3.43.0). WOFF (1) adds nothing for browsers.

Version every format from the same source fields (FONT-017).

## [FONT-017] Version fields: `head.fontRevision`, name ID 5 and UFO `versionMinor`
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [OpenType spec: head](https://learn.microsoft.com/en-us/typography/opentype/spec/head), [OpenType spec: name](https://learn.microsoft.com/en-us/typography/opentype/spec/name), [UFO 3 fontinfo.plist](https://unifiedfontobject.org/versions/ufo3/fontinfo.plist/), [ufo2ft fontInfoData.py](https://github.com/googlefonts/ufo2ft/blob/main/Lib/ufo2ft/fontInfoData.py), [ufo2ft outlineCompiler.py](https://github.com/googlefonts/ufo2ft/blob/main/Lib/ufo2ft/outlineCompiler.py), [Fontspector opentype/font_version](https://github.com/fonttools/fontspector/blob/main/profile-opentype/src/checks/opentype/font_version.rs), [GF guide: requirements](https://googlefonts.github.io/gf-guide/requirements.html)
- Related: FONT-016, FONT-011, FONT-004

A font carries its version twice. `head.fontRevision` is a Fixed number, but "Windows evaluates the version string (ID 5) in the 'name' table" instead. Name ID 5 "Should begin with the pattern 'Version <number>.<number>'", and "A character such as ';' is helpful to separate different pieces of version information."

**From a UFO**, set `versionMajor` and `versionMinor` in `fontinfo.plist`; ufo2ft derives both fields:
- `head.fontRevision = round(float("%d.%03d" % (versionMajor, versionMinor)), 3)`.
- Name ID 5 defaults to `"Version %d.%s" % (versionMajor, str(versionMinor).zfill(3))`.
- So `versionMinor` 3 gives "Version 1.003", not 1.3, and 1.030 needs `versionMinor` 30.
- An explicit `openTypeNameVersion` overrides name ID 5 only, which is how the two drift apart.

**Tools append to name ID 5:** ttfautohint adds "; ttfautohint (v…)" unless run with `-n` (FONT-011), and fontc adds ";fontc 1.0.0" (FONT-004). Both keep the leading "Version 1.002", which installers read.

**Keep them equal:** Fontspector's `opentype/font_version` fails when they differ by more than 1/2000 and warns from 1/65536, because "different applications will report different version numbers for the font."

**Google Fonts' scheme:** "Every new version onboarded to GF should have an increased version number", "based on semver, apart from we use `MAJOR.SIGNIFICANTMINORPATCH`": 1.230 to 2.000 for a breaking change, 1.330 for a new character set, 1.231 for a name-table fix.

## [FONT-018] The OFL, Reserved Font Names and web subsets
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [OFL 1.1 official text](https://openfontlicense.org/open-font-license-official-text/), [OFL FAQ](https://openfontlicense.org/ofl-faq/), [GF guide: license file](https://googlefonts.github.io/gf-guide/license-file.html), [GF guide: onboarding](https://googlefonts.github.io/gf-guide/onboarding.html)
- Related: FONT-019, FONT-016

Under the SIL Open Font License 1.1, a subset web font is a Modified Version, which matters only if the font declares a Reserved Font Name (RFN).

**The licence** (page last updated 2026-01-12):
- A Modified Version is "any derivative made by adding to, deleting, or substituting – in part or in whole – any of the components of the Original Version, by changing formats or by porting the Font Software to a new environment."
- "No Modified Version of the Font Software may use the Reserved Font Name(s) unless explicit written permission is granted by the corresponding Copyright Holder."

**The FAQ on web fonts:**
- 2.6: "Is subsetting a webfont considered modification? Yes. Removing any parts of the font when delivering a webfont to a browser, including unused glyphs and smart font code, is considered modification." It "would not normally allow the use of RFNs".
- 2.2.1: a WOFF version may keep the name "only if the original font data remains unchanged except for WOFF compression", with metadata intact.

**Declare RFNs or not?** The FAQ: "RFNs are optional and not required, but we encourage you to use them." Google Fonts: "The Open Font License should not have any Reserved Font Names", since its API serves subsets, which are "not legally considered the same as the original one."

`pyftsubset` keeps only name IDs 0 to 6 by default (FONT-019), dropping the licence and its URL (IDs 13 and 14): pass `--name-IDs='*'` for someone else's OFL font.

## [FONT-019] Subsetting with `pyftsubset`: its defaults drop features
- Type: anti-pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [fontTools subset docs](https://fonttools.readthedocs.io/en/latest/subset/index.html), [subset/__init__.py](https://github.com/fonttools/fonttools/blob/main/Lib/fontTools/subset/__init__.py), [fonttools README (extras)](https://github.com/fonttools/fonttools), [Google Fonts CSS for Work Sans](https://fonts.googleapis.com/css2?family=Work+Sans:wght@100..900&display=swap)
- Related: FONT-018, FONT-020, FONT-023

Never subset with only `--unicodes` and `--flavor`: the defaults silently drop features your CSS turns on.

**Defaults** (the module's help text): "By default, 'calt', 'ccmp', 'clig', 'curs', 'dnom', 'frac', 'kern', 'liga', 'locl', 'mark', 'mkmk', 'numr', 'rclt', 'rlig', 'rvrn', and all features required for script shaping are preserved." `tnum`, `pnum`, `onum`, `case`, `smcp` and `ss01` go. Also "only nameIDs between 0 and 6 are preserved". Hinting is kept unless `--no-hinting`, which "produces (sometimes up to 30%) smaller fonts". WOFF2 "requires the Brotli Python extension": install `fonttools[woff]`.

**A web subset that keeps every feature:**

```
pyftsubset Family[wght].ttf --flavor=woff2 --layout-features='*' \
  --unicodes='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD' \
  --output-file=Family-latin.woff2
```

That range is the `latin` slice Google Fonts served on 2026-10-17 (FONT-020).

Tested 2026-10-17, fonttools 4.67.0, Work Sans `[wght]` (OFL, 1,349 glyphs, 361,072-byte TTF), WOFF2 output:
- All glyphs and features: 126,384 bytes.
- `--unicodes='*'` with default features: 84,320 bytes, with only 9 of 35 GSUB features left (`case`, `tnum` and every `ss` gone).
- The Latin range above, all features: 77,816; with the default features plus `tnum,pnum` and no hinting: 49,104. Google Fonts' own `latin` file was 50,316 bytes, unhinted, with 11 GSUB features.
- ASCII only, all features: 49,556.

Subset only what you serve, and keep the features your CSS uses (FONT-023).

## [FONT-020] `unicode-range` slices and preloading a font
- Type: pattern
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [Google Fonts CSS for Work Sans](https://fonts.googleapis.com/css2?family=Work+Sans:wght@100..900&display=swap), [Google Fonts: getting started](https://developers.google.com/fonts/docs/getting_started), [web.dev: font best practices](https://web.dev/articles/font-best-practices), [MDN: rel=preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload)
- Related: FONT-019, FONT-021, FONT-006

**Slices:** a family covering several scripts can be split into WOFF2 files, one `@font-face` each, with a `unicode-range`; the browser downloads only the slices the page's characters need. On 2026-10-17 Google Fonts' CSS for Work Sans gave three slices with the same `font-weight: 100 900`: `vietnamese`, `latin-ext` and `latin` (`U+0000-00FF, U+0131, U+0152-0153, …, U+2000-206F, U+20AC, U+2122, …`). Its docs: when a browser "supports unicode-range … the subset parameter is ignored". No Google page documents how it chooses the slices. `unicode-range` is Baseline widely available (web-features 3.43.0).

A Latin-only family of a few hundred glyphs gains little from slicing; one file is simpler (FONT-019 for its size).

**Preload:** `<link rel="preload" href="/fonts/Family.woff2" as="font" type="font/woff2" crossorigin>`.
- `crossorigin` is required: "font and fetch preloading requires the crossorigin attribute to be set"; it must match the resource's CORS mode "even when the fetch is not cross-origin" (MDN).
- web.dev: "preload ignores unicode-range declarations, and if used prudently, should only be used to load a single font format"; preloading takes "browser resources from the loading of other resources".
- Preload only the file the first screen uses, and use the same URL as the `@font-face` `src`, query string included.

`<link rel="preload">` with `as=font` is Baseline widely available since 2021-01-26.

## [FONT-021] `font-display` and its effect on LCP and CLS
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [CSS Fonts 4 (Editor's Draft): font-display](https://drafts.csswg.org/css-fonts-4/#font-display-desc), [MDN: font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display), [web.dev: font best practices](https://web.dev/articles/font-best-practices), [web.dev: LCP](https://web.dev/articles/lcp), [web.dev: optimize LCP](https://web.dev/articles/optimize-lcp), [web.dev: preload optional fonts](https://web.dev/articles/preload-optional-fonts)
- Related: FONT-020, FONT-022, WEB-010, WEB-030, WEB-034

Use `swap` with a metric-matched fallback (FONT-022) or `optional` with preload for body text. Use `block` only for short text that must be in the web font.

**Periods** (block, then swap):

| Value | CSS Fonts 4 draft | web.dev table |
|---|---|---|
| `block` | short block ("3s is recommended"), infinite swap | 2–3 s, infinite |
| `swap` | "100ms or less", infinite swap | 0 ms, infinite |
| `fallback` | "100ms or less", short swap ("3s") | 100 ms, 3 s |
| `optional` | "100ms or less", no swap | 100 ms, none |

MDN gives no numbers. The draft says `block` "must only be used for small pieces of text", and `optional` "must never cause the layout of the page to 'jump'". Without `font-display`, "Chromium-based and Firefox browsers block text rendering for up to 3 seconds", and "Safari blocks text rendering indefinitely" (web.dev, last updated 2022-10-04).

**LCP:** text "using web fonts during the font block period" isn't "rendered", so with `block` or `auto` the LCP waits for the font. "If you set a font-display value of anything other than auto or block, then text will always be visible during load, and LCP won't be blocked on an additional network request."

**CLS:** a swap shifts layout when the fallback's metrics differ; `optional` never swaps late, and preload "greatly improves the chance for it to load before the first render cycle", but a late font isn't used on that view.

Measure before changing: osrs-tracker-web's slow LCP turned out to be Lighthouse's estimate, not the font (WEB-030).

## [FONT-022] Fallback metric overrides and `font-size-adjust`: what's Baseline
- Type: fact
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [web-features 3.43.0](https://www.npmjs.com/package/web-features), [@mdn/browser-compat-data 8.1.6](https://www.npmjs.com/package/@mdn/browser-compat-data), [MDN: size-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust), [MDN: font-size-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/font-size-adjust), [Chrome: improved font fallbacks](https://developer.chrome.com/blog/font-fallbacks), [fontaine](https://github.com/unjs/fontaine), [Capsize](https://github.com/seek-oss/capsize)
- Related: FONT-021, FONT-023

A fallback `@font-face` over a local font, with descriptors that make it the web font's size, stops the shift when the web font swaps in. Only `size-adjust` works in every engine.

**Support** (web-features 3.43.0, published 2026-10-15; BCD 8.1.6):

| Feature | Baseline | Safari |
|---|---|---|
| `@font-face` `size-adjust` | widely available since 2023-09-18 | 17 |
| `ascent-override`, `descent-override`, `line-gap-override` | no (Chrome 87, Firefox 89) | "preview" only |
| `font-size-adjust` property | newly available since 2024-07-25 | 16.4; `from-font` and two values 17 |

Example (the percentages are placeholders; compute them for your font):

```css
@font-face {
  font-family: "Family Fallback";
  src: local("Arial");
  size-adjust: 104%;
  ascent-override: 92%;   /* ignored by Safari */
  descent-override: 24%;
  line-gap-override: 0%;
}
body { font-family: "Family", "Family Fallback", sans-serif; }
```

**Computing the numbers:** Chrome's guide: `ascent-override` is ascent divided by `unitsPerEm`, and so on, "written as percentages"; `size-adjust` "defines a multiplier for glyph outlines and metrics". fontaine 1.0.1 (2026-10-09) generates these from font metrics ("Reduces CLS by using local font fallbacks with crafted font metrics") as Vite, webpack and PostCSS plugins; Capsize's `@capsizecss/metrics` 4.4.0 publishes the metrics. Next.js's `next/font` does it automatically.

**`font-size-adjust`** "is applied to each font used to render text, not only to fallback fonts", so it matches x-heights everywhere rather than metrics for one swap.

In Safari only the size matches, so vertical metrics can still shift a line.

## [FONT-023] Variable-font and OpenType-feature CSS: use the high-level properties
- Type: recommendation
- Applies to: general
- Confidence: official-docs
- Last verified: 2026-10-17
- Sources: [MDN: variable fonts guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide), [MDN: font-variation-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variation-settings), [MDN: font-feature-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings), [web-features 3.43.0](https://www.npmjs.com/package/web-features)
- Related: FONT-006, FONT-009, FONT-019, FONT-022

**Variable fonts:** declare the axis range in `@font-face` and set `font-weight` as usual:

```css
@font-face {
  font-family: "Family";
  src: url("/fonts/Family[wght].woff2") format("woff2");
  font-weight: 100 900;   /* match the font's wght axis (FONT-006) */
  font-style: normal;
  font-display: swap;
}
h1 { font-weight: 650; }
```

MDN on `font-variation-settings`: "You should only use it when no basic properties exist to set those features (e.g., font-weight, font-style)." It "will always override those set using the corresponding basic font properties … no matter where they appear in the cascade", and "If you have set values using font-variation-settings and want to change one of those values, you must redeclare all of them". Keep it for custom axes (`GRAD`, `CASL`). The `@font-face` descriptor `font-variation-settings` isn't Baseline (no Safari); the property is, since 2018-09-05.

**OpenType features:** MDN: "Whenever possible, Web authors should instead use the font-variant shorthand property or an associated longhand property such as font-variant-numeric".

| Feature | Property |
|---|---|
| `tnum`, `lnum`, `onum`, `frac`, `zero` | `font-variant-numeric: tabular-nums` and so on |
| `liga`, `dlig`, `calt` | `font-variant-ligatures` |
| `smcp`, `c2sc` | `font-variant-caps` |
| `ss01`, `cv01`, `swsh` | `font-variant-alternates` with `@font-feature-values` (Baseline since 2023-03-13) |
| `case` | no property: `font-feature-settings: "case"` |

All of these are Baseline widely available. A feature only works if the served file still has it: check after subsetting (FONT-019).

## [FONT-024] What Claude can and can't do in type design
- Type: fact
- Applies to: Claude Code
- Confidence: single-source
- Last verified: 2026-10-17
- Sources: [VecGlypher (arXiv 2602.21461, CVPR 2026)](https://arxiv.org/abs/2602.21461), [fontmake 3.12.2 test data](https://github.com/googlefonts/fontmake/tree/v3.12.2/tests/data)
- Related: FONT-001, FONT-007, FONT-010, DESIGN-007

Claude is useful on a type project's text: feature code, designspace and UFO XML, build scripts and checks. It doesn't draw letterforms well.

**Tested 2026-10-17, Claude Code 2.1.296, `claude -p` on Haiku 5.5**, on two of fontmake's MutatorSans UFO masters. In 16 turns, 44 s and $0.019 it:
1. Wrote `features.fea` with `languagesystem`, a class kern pair, `liga` and `ss01` with `featureNames`, and compile-checked it with `fonttools feaLib` (FONT-010). Valid on our own re-run.
2. Converted the designspace to format 5.0 with axis labels, a Medium instance and a `<variable-fonts>` element. It parsed with designSpaceLib, and fontmake built the VF.
3. Added a `top` anchor centred on `A` in both masters' `.glif` files (x=198 for width 396, x=370 for 740). ufoLib2 read both.

**Outlines:** VecGlypher (arXiv, submitted 2026-02-25, accepted to CVPR 2026) trained a model to emit SVG glyph paths; it "substantially outperforms both general-purpose LLMs and specialized vector-font baselines for text-only generation". General models are the weak baseline there. What works is geometry a script derives from existing outlines: composites, accents from each master's own glyphs, extrapolated masters, kerning copied across groups. Our own typeface project is maintained that way in Claude Code sessions, with scripted checks for lumps, flipped joints and kinks; its README: "A check is a pointer, not a verdict: look at every finding at a large size before changing an outline."

Verify with the tools (FONT-007, FONT-010, FONT-014) and a proof, and judge shapes yourself.

## Recommendations for our setup

Ranked by impact against effort. Checked 2026-10-17 against local checkouts of osrs-tracker-web and freek-mencke-web, and of our typeface project (private): five UFO masters and a designspace 5 file built with fontmake 3.12 into nine static OTF (`otfautohint`) and TTF (ttfautohint through `--autohint`) weights and an unhinted variable TTF, with WOFF and WOFF2 re-encoded from them unsubset and every feature kept. It has its own glyph checks and no Fontspector run or CI. Both sites self-host one variable WOFF2 of it (39,520 and 50,600 bytes, `font-weight: 300 700` and `100 700`), with `font-display: block`, a `crossorigin` preload and a `?v=` query string; neither subsets it or has fallback metric overrides.

1. **Run Fontspector's `universal` profile and `varLib.interpolatable` in the typeface build** (FONT-014, FONT-015, FONT-007, FONT-017, FONT-013). The family's checks look at outlines; nothing checks the compiled tables (version fields, `gasp`, name records, metrics). Add both to the build script first; a CI job later. Opened as an issue in the typeface repo (private, so not linked here).
2. **Decision: keep fontmake; don't move the typeface to fontc 1.0.0** (FONT-003, FONT-004). fontc can build only the variable font, and drops the designspace 5 labels the family uses for STAT. Re-check when fontc#837 and fontc#717 close.
3. **Done: statics and OTF next to the VF; the VF unhinted; statics autohinted** (FONT-011, FONT-012, FONT-016). The build already matches Google Fonts' advice, and the satori OG cards need the static TTFs. Before releasing, confirm the VF's `gasp` is `0x000F` (FONT-013); recommendation 1's check covers it.
4. **Rule: when a site's font is re-cut, keep its features** (FONT-019, FONT-006, FONT-023). If a narrowed or subset copy is made with `pyftsubset`, pass `--layout-features='*'`: the defaults drop `tnum` and `case`, which the family documents and osrs-tracker-web uses (`tabular-nums`). The 232-glyph Latin-1 font gains little from `unicode-range` slicing (FONT-020).
5. **Decision: keep `font-display: block` with the preload for now** (FONT-021, FONT-022). The one file is small, same-origin and preloaded, so the block period is short, and `block` never swaps, so it adds no CLS. `swap` would need a metric-matched fallback, and Safari ignores the vertical overrides. Revisit if field data appears (WEB-010) or the font grows; then switch to `swap` with a fallback generated from the font's metrics.
6. **Won't do: an OFL-style RFN review** (FONT-018). The family isn't under the OFL.

## Open questions

- **Does gftools builder read designspace 5's `<variable-fonts>`** (FONT-002, FONT-008)? Its README doesn't say, and a grep of its builder source for `getVariableFonts` found nothing; not tested.
- **How much faster is fontc than fontmake** on a real family (FONT-003)? No official timing; our test fonts were too small. Time both on the typeface's masters (VF only).
- **Font Bakery's maintenance status** (FONT-014): its README and CHANGELOG say nothing about deprecation; the last commit was 2025-11-04 and v1.1.1 is still "Upcoming".
- **The `gasp` value for unhinted fonts** (FONT-013): Google Fonts' statics guide says `0x000A`, its tools `0x000F`. Not raised upstream.
- **ttfautohint's release date**: its NEWS says 2021-08-14, its homepage "21st August 2021" (FONT-011). Not material.
- **feaLib's gaps against spec 1.27** (FONT-009): its docs list none; `parser.py` wasn't read.
- **How Google Fonts slices `unicode-range`** (FONT-020): no official page found (developers.google.com/fonts getting started, css2, technical considerations).
- **Does `font-display: block` hold text for 3 s in Safari** (FONT-021)? web.dev describes Safari's default ("indefinitely"), not its `block` timing. Not tested.
