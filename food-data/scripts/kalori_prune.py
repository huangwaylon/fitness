#!/usr/bin/env python3
"""Which Kalori releases to delete after a publish (kalori-scrape.yml; docs/ops/runbook.md "Refresh Kalori"): the dated
ones (`kalori-YYYY-MM-DD`, `kalori-YYYY-MM-DD-N`) past the newest KEEP (the current one and two to roll back to), by the
tag's date then its suffix, never by creation time. Never the one fetch.py's KALORI_TAG pins, a draft or prerelease,
`kalori-wip` or a smoke test's wip tag, or a release that isn't Kalori's (assets-*, sources-*, notes). stdlib only, no
network: the workflow lists and deletes.

Usage: gh release list --limit 200 --json tagName,isDraft,isPrerelease \\
         | python3 -I food-data/scripts/kalori_prune.py --pinned <KALORI_TAG> [--keep 3]
  -> the tags to delete, one a line
"""
import argparse
import json
import re
import sys

KEEP = 3
DATED = re.compile(r'^kalori-(\d{4}-\d{2}-\d{2})(?:-(\d+))?$')


def order(tag):
    """(date, suffix) of a dated tag: kalori-2026-11-15 is the day's first (1), kalori-2026-11-15-2 its second."""
    m = DATED.match(tag)
    return (m.group(1), int(m.group(2) or 1))


def to_delete(releases, pinned, keep=KEEP):
    dated = [r['tagName'] for r in releases
             if isinstance(r, dict) and DATED.match(str(r.get('tagName', ''))) and not r.get('isDraft') and not r.get('isPrerelease')]
    newest = sorted(set(dated), key=order, reverse=True)
    return [t for t in newest[keep:] if t != pinned]


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--pinned', required=True, help="fetch.py's KALORI_TAG on main: never deleted")
    ap.add_argument('--keep', type=int, default=KEEP)
    a = ap.parse_args(argv)
    if a.keep < 1 or not DATED.match(a.pinned):
        print('kalori_prune: --keep under 1, or --pinned %r is no dated Kalori tag' % a.pinned, file=sys.stderr)
        return 1
    for t in to_delete(json.load(sys.stdin), a.pinned, a.keep):
        print(t)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
