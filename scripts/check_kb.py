#!/usr/bin/env python3
"""Check every kb-*.md file against the entry format in CLAUDE.md.

Usage: python3 scripts/check_kb.py
Exits with status 1 when it finds a problem, so it can run in CI.
"""
import collections
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

    dups = {k: v for k, v in where.items() if len(v) > 1}
    for eid, names in sorted(dups.items()):
        print(f"duplicate ID {eid} in {', '.join(names)}")
        problems += 1

    print(f"\n{problems} issue(s) in total" if problems else "\nAll files pass.")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
