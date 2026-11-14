"""fetch.py's kalori step on a local tarball and SHA256SUMS (no network: `get` stubbed).
Run (from the repo root): python3 -I -m unittest discover -s food-data/scripts/tests
"""
import contextlib, hashlib, io, json, os, shutil, sys, tarfile, tempfile, unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import fetch  # noqa: E402


def tarball(files):
    """A kalori-data.tar.gz in memory: files = {member name: bytes}."""
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode='w:gz') as tf:
        for name, data in files.items():
            ti = tarfile.TarInfo(name)
            ti.size = len(data)
            tf.addfile(ti, io.BytesIO(data))
    return buf.getvalue()


def sums(tar_bytes, name='kalori-data.tar.gz'):
    return ('%s  %s\n' % (hashlib.sha256(tar_bytes).hexdigest(), name)).encode()


COMPLETE = json.dumps({'summary': {'complete': True}}).encode()
LINE = b'{"shop":"tako-ya","id":"1"}\n'


class Kalori(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.dir)

    def read(self, f):
        with open(os.path.join(self.dir, f), 'rb') as fh:
            return fh.read()

    def files(self):
        return sorted(os.listdir(self.dir))

    def test_unpacks_the_shards_only_and_clears_old_ones(self):
        for f in ('shard-7.jsonl', 'shard-19.jsonl', 'notes.txt'):
            with open(os.path.join(self.dir, f), 'w'):
                pass
        t = tarball({'shards/shard-0.jsonl': LINE, './shards/shard-1.jsonl': LINE * 2, 'coverage.json': COMPLETE,
                     'state/state-0.json': b'{}', 'diff.json': b'{}', 'shards/../evil.jsonl': b'x'})
        self.assertEqual(fetch.kalori_unpack(t, sums(t), self.dir), {'shard-0.jsonl': 1, 'shard-1.jsonl': 2})
        self.assertEqual(self.files(), ['notes.txt', 'shard-0.jsonl', 'shard-1.jsonl'])
        self.assertEqual(self.read('shard-1.jsonl'), LINE * 2)
        self.assertFalse(os.path.exists(os.path.join(os.path.dirname(self.dir), 'evil.jsonl')))

    def test_refuses_a_bad_checksum_or_none(self):
        t = tarball({'shards/shard-0.jsonl': LINE, 'coverage.json': COMPLETE})
        bad = sums(t[:-1] + b'x')
        for s in (bad, sums(t, 'other.tar.gz'), b''):
            with self.assertRaises(SystemExit):
                fetch.kalori_unpack(t, s, self.dir)
        self.assertEqual(self.files(), [])
        fetch.kalori_unpack(t, sums(t).replace(b'  ', b' *'), self.dir)   # sha256sum's binary mark
        self.assertEqual(self.files(), ['shard-0.jsonl'])

    def test_refuses_an_incomplete_crawl(self):
        with open(os.path.join(self.dir, 'shard-0.jsonl'), 'wb') as fh:
            fh.write(b'old\n')
        for cov in (json.dumps({'summary': {'complete': False}}).encode(), None):
            files = {'shards/shard-0.jsonl': LINE, **({'coverage.json': cov} if cov else {})}
            t = tarball(files)
            with self.assertRaises(SystemExit):
                fetch.kalori_unpack(t, sums(t), self.dir)
        self.assertEqual(self.read('shard-0.jsonl'), b'old\n')  # left alone
        t = tarball({'coverage.json': COMPLETE})
        with self.assertRaises(SystemExit):   # no shards
            fetch.kalori_unpack(t, sums(t), self.dir)

    def test_step_downloads_the_pinned_release(self):
        t = tarball({'shards/shard-0.jsonl': LINE, 'coverage.json': COMPLETE})
        urls = []

        def get(url, **kw):
            urls.append(url)
            return sums(t) if url.endswith('/SHA256SUMS') else t
        with mock.patch.object(fetch, 'get', get), mock.patch.object(fetch, 'RAW', self.dir), \
                contextlib.redirect_stdout(io.StringIO()):
            fetch.kalori()
        base = 'https://github.com/huangwaylon/fitness/releases/download/%s/' % fetch.KALORI_TAG
        self.assertEqual(urls, [base + 'SHA256SUMS', base + 'kalori-data.tar.gz'])
        self.assertEqual(os.listdir(os.path.join(self.dir, 'kalori')), ['shard-0.jsonl'])


if __name__ == '__main__':
    unittest.main()
