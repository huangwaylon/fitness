"""kalori_prune.py: the Kalori releases deleted after a publish."""
import io
import json
import os
import sys
import unittest
from contextlib import redirect_stdout
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import kalori_prune as P  # noqa: E402


def rel(tag, draft=False, pre=False):
    return {'tagName': tag, 'isDraft': draft, 'isPrerelease': pre}


class Prune(unittest.TestCase):
    def test_keeps_the_newest_three_by_date_then_suffix(self):
        # listed in creation order scrambled: the order is the tag's
        tags = ['kalori-2026-11-15', 'kalori-2026-11-01', 'kalori-2026-11-14-2', 'kalori-2026-11-14',
                'kalori-2026-11-14-10', 'kalori-2026-10-31']
        got = P.to_delete([rel(t) for t in tags], pinned='kalori-2026-11-15')
        # kept: 11-15, 11-14-10 (a number, not text: after -2), 11-14-2
        self.assertEqual(got, ['kalori-2026-11-14', 'kalori-2026-11-01', 'kalori-2026-10-31'])

    def test_never_the_pinned_one(self):
        tags = ['kalori-2026-11-%02d' % d for d in range(10, 16)]
        got = P.to_delete([rel(t) for t in tags], pinned='kalori-2026-11-11')
        self.assertEqual(got, ['kalori-2026-11-12', 'kalori-2026-11-10'])

    def test_never_wip_drafts_prereleases_or_other_releases(self):
        others = [rel('kalori-wip', pre=True), rel('kalori-wip-smoke', pre=True), rel('assets-2026-11-01'),
                  rel('sources-2026-11-01'), rel('notes'), rel('kalori-2026-11-01', draft=True),
                  rel('kalori-2026-11-02', pre=True), rel('kalori-2026-11-03-x'), rel('v1.0')]
        dated = [rel('kalori-2026-11-%02d' % d) for d in (12, 13, 14, 15)]
        self.assertEqual(P.to_delete(others + dated, pinned='kalori-2026-11-15'), ['kalori-2026-11-12'])
        self.assertEqual(P.to_delete(others, pinned='kalori-2026-11-15'), [])

    def test_three_or_fewer_none(self):
        self.assertEqual(P.to_delete([rel('kalori-2026-11-14'), rel('kalori-2026-11-15')], pinned='kalori-2026-11-15'), [])

    def test_cli(self):
        stdin = io.StringIO(json.dumps([rel('kalori-2026-11-%02d' % d) for d in (12, 13, 14, 15)]))
        out = io.StringIO()
        with mock.patch('sys.stdin', stdin), redirect_stdout(out):
            self.assertEqual(P.main(['--pinned', 'kalori-2026-11-15']), 0)
        self.assertEqual(out.getvalue(), 'kalori-2026-11-12\n')
        with mock.patch('sys.stderr', io.StringIO()):
            self.assertEqual(P.main(['--pinned', 'kalori-wip']), 1)


if __name__ == '__main__':
    unittest.main()
