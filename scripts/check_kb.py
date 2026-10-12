#!/usr/bin/env python3
"""Check every kb-*.md file against the entry format in CLAUDE.md, and INDEX.md, OVERLAPS.md and CHANGELOG.md against the entries.

Usage: python3 scripts/check_kb.py
Exits with status 1 when it finds a problem, so it can run in CI. Possible duplicates across files are printed as
warnings and never fail the run.
"""
import collections
import difflib
import itertools
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIELDS = ["Type", "Applies to", "Confidence", "Last verified", "Sources", "Related"]
CONFIDENCE = {"official-docs", "official-example", "community-consensus", "single-source", "unverified"}
ENTRY = re.compile(r"^## \[([A-Z]+-\d+)\]", re.M)
OTHER_HEADING = re.compile(r"^#{1,2} (?!\[)", re.M)
META_LINE = re.compile(r"^- (?:" + "|".join(FIELDS) + r"):.*$", re.M)
# Entries that are syntheses of other entries and cite IDs instead of URLs.
SYNTHESIS_SOURCE = re.compile(r"synthesis of", re.I)
# Possible duplicates across files: titles this similar (difflib ratio), or this share of tags (Jaccard, at least 2).
TITLE_SIMILAR = 0.72
TAGS_SHARED = 0.6
# Sections where IDs on one line count as already reviewed together.
REVIEWED_SECTIONS = {"INDEX.md": ["Conflicts"], "OVERLAPS.md": ["Overlaps kept on purpose", "Merges", "Similar but distinct"]}
# Files that name entry IDs, checked for IDs that don't exist.
ID_FILES = ["INDEX.md", "OVERLAPS.md", "CHANGELOG.md"]


def entries(text):
    heads = list(ENTRY.finditer(text))
    for i, m in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(text)
        body = text[m.start():end]
        stop = OTHER_HEADING.search(body, 3)
        yield m.group(1), body[: stop.start()] if stop else body


def quick_answer_rows(text):
    m = re.search(r"^## Quick answers\s*$(.*?)^## ", text, re.M | re.S)
    if not m:
        return None
    rows = [l for l in m.group(1).splitlines() if l.startswith("|")]
    return max(len(rows) - 2, 0)  # minus header and separator


def reviewed_pairs(texts):
    """Pairs of IDs named on the same line (ranges like X-001 to X-005 expanded) in the REVIEWED_SECTIONS."""
    pairs = set()
    for fname, name in ((f, n) for f, names in REVIEWED_SECTIONS.items() for n in names):
        m = re.search(r"^## " + re.escape(name) + r"\s*$(.*?)(?=^## |\Z)", texts.get(fname, ""), re.M | re.S)
        for line in m.group(1).splitlines() if m else []:
            ids = set(re.findall(r"\b[A-Z]+-\d+\b", line))
            for prefix, start, end in re.findall(r"\b([A-Z]+)-(\d+) to (?:[A-Z]+-)?(\d+)\b", line):
                ids |= {f"{prefix}-{n:0{len(start)}d}" for n in range(int(start), int(end) + 1)}
            pairs |= {frozenset(p) for p in itertools.combinations(ids, 2)}
    return pairs


def possible_duplicates(titles, tags, reviewed):
    """Warnings, not failures: cross-file entry pairs with near-identical titles or mostly shared tags."""
    found = []
    for a, b in itertools.combinations(sorted(titles), 2):
        (file_a, title_a), (file_b, title_b) = titles[a], titles[b]
        if file_a == file_b or frozenset((a, b)) in reviewed:
            continue
        ratio = difflib.SequenceMatcher(None, title_a.lower(), title_b.lower()).ratio()
        shared = tags.get(a, set()) & tags.get(b, set())
        union = tags.get(a, set()) | tags.get(b, set())
        if ratio >= TITLE_SIMILAR or (len(shared) >= 2 and len(shared) / len(union) >= TAGS_SHARED):
            found.append(f"{a} '{title_a}' and {b} '{title_b}'")
    return found


def main():
    files = sorted(ROOT.glob("kb-*.md"))
    if not files:
        print("No kb-*.md files found.")
        return 1
    texts = {f: f.read_text(encoding="utf-8") for f in files}
    where = collections.defaultdict(list)
    for f, t in texts.items():
        for eid, _ in entries(t):
            where[eid].append(f.name)

    problems = 0
    for f, t in texts.items():
        issues = []
        for section in ["Quick answers", "Index", "Recommendations for our setup", "Open questions"]:
            if not re.search(r"^#{2,3} .*" + re.escape(section), t, re.M | re.I):
                issues.append(f"missing section: {section}")
        rows = quick_answer_rows(t)
        if rows is not None and not 10 <= rows <= 15:
            issues.append(f"Quick answers has {rows} rows (want 10-15)")

        count = 0
        for eid, body in entries(t):
            count += 1
            for field in FIELDS:
                if not re.search(r"^- " + field + r":", body, re.M):
                    issues.append(f"{eid}: missing field {field}")
            c = re.search(r"^- Confidence:\s*(.+)$", body, re.M)
            if c and c.group(1).strip() not in CONFIDENCE:
                issues.append(f"{eid}: Confidence '{c.group(1).strip()}' is not one of the allowed values")
            d = re.search(r"^- Last verified:\s*(\S+)", body, re.M)
            if d and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", d.group(1)):
                issues.append(f"{eid}: Last verified '{d.group(1)}' is not YYYY-MM-DD")
            s = re.search(r"^- Sources:\s*(.+)$", body, re.M)
            if s and "http" not in s.group(1) and not SYNTHESIS_SOURCE.search(s.group(1)):
                issues.append(f"{eid}: Sources has no URL")
            r = re.search(r"^- Related:\s*(.+)$", body, re.M)
            if r:
                for ref in re.findall(r"[A-Z]+-\d+", r.group(1)):
                    if ref not in where:
                        issues.append(f"{eid}: Related points to unknown {ref}")
            prose = re.sub(r"```.*?```", "", META_LINE.sub("", body), flags=re.S)
            words = len(prose.split())
            if words > 300 and not SYNTHESIS_SOURCE.search(s.group(1) if s else ""):
                issues.append(f"{eid}: about {words} words (want 50-250)")

        print(f"{f.name}: {count} entries, {len(issues)} issue(s)")
        for issue in issues:
            print(f"  - {issue}")
        problems += len(issues)

    index = ROOT / "INDEX.md"
    if index.exists():
        it = index.read_text(encoding="utf-8")
        listed = set(re.findall(r"^\| ([A-Z]+-\d+) \|", it, re.M))
        issues = [f"{eid} is missing from the index" for eid in sorted(set(where) - listed)]
        # Prefixes come from the entries themselves, so a new kb-*.md file is checked without editing this script.
        prefixes = "|".join(sorted({eid.split("-")[0] for eid in where}))
        others = {n: (ROOT / n).read_text(encoding="utf-8") for n in ID_FILES if (ROOT / n).exists()}
        for name, text in others.items():
            mentioned = set(re.findall(r"\b(?:" + prefixes + r")-\d+\b", text))
            issues += [f"{name} mentions unknown {ref}" for ref in sorted(mentioned - set(where))]
        # The file table at the top: every kb-*.md file listed, with its current entry count.
        table = {m.group(1): int(m.group(2)) for m in re.finditer(r"^\| `(kb-[\w-]+\.md)` \| [A-Z]+ \| .*? \| (\d+)", it, re.M)}
        for f, t in texts.items():
            count = sum(1 for _ in entries(t))
            if f.name not in table:
                issues.append(f"{f.name} is missing from the file table")
            elif table[f.name] != count:
                issues.append(f"file table says {table[f.name]} entries for {f.name}, the file has {count}")
        print(f"INDEX.md: {len(listed)} entries listed, {len(issues)} issue(s)")
        for issue in issues:
            print(f"  - {issue}")
        problems += len(issues)

        titles = {}
        for f, t in texts.items():
            for m in re.finditer(r"^## \[([A-Z]+-\d+)\] (.+)$", t, re.M):
                titles[m.group(1)] = (f.name, m.group(2).strip())
        tags = {m.group(1): {x.strip() for x in m.group(2).split(",") if x.strip()}
                for m in re.finditer(r"^\| ([A-Z]+-\d+) \| .*? \| [\w-]+ \| (.*?) \|$", it, re.M)}
        warnings = possible_duplicates(titles, tags, reviewed_pairs(others))
        if warnings:
            print(f"\nPossible duplicates across files ({len(warnings)}, warnings only). Merge or cross-link them,"
                  " or list the pair under 'Similar but distinct' in OVERLAPS.md:")
            for w in warnings:
                print(f"  - {w}")

    dups = {k: v for k, v in where.items() if len(v) > 1}
    for eid, names in sorted(dups.items()):
        print(f"duplicate ID {eid} in {', '.join(names)}")
        problems += 1

    print(f"\n{problems} issue(s) in total" if problems else "\nAll files pass.")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
