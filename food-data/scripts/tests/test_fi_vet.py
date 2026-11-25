"""fi.py vet (food-data/images/fi.py): vetted candidates into the table's refs, idempotent, refusals write nothing.
Run (from the repo root): python3 -I -m unittest discover -s food-data/scripts/tests
"""
import importlib.util, json, os, tempfile, unittest
from pathlib import Path

FI = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'images', 'fi.py')
spec = importlib.util.spec_from_file_location('fi', FI)
fi = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fi)

CAND = [{'n': 0, 'origin': 'wikidata', 'file': 'File:A.jpg', 'page': 'https://commons.wikimedia.org/wiki/File:A.jpg'},
        {'n': 2, 'origin': 'search', 'file': 'File:B.jpg', 'page': 'https://commons.wikimedia.org/wiki/File:B.jpg'},
        {'n': 100, 'origin': 'maff', 'file': 'x1', 'page': 'maff:x1'}]


class Vet(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        d = Path(self.tmp.name)
        self.old = fi.HERE, fi.RAW
        fi.HERE, fi.RAW = d, d / 'raw'
        (d / 'table').mkdir()
        self.table = d / 'table' / 'a.json'
        self.table.write_text(json.dumps([{'key': 'k1', 'ja': '揚げ出し豆腐', 'desc': 'd', 'items': []},
                                          {'key': 'k2', 'ja': 'b', 'desc': 'd', 'items': []}], ensure_ascii=False, indent=1) + '\n')
        (d / 'raw' / 'refs' / 'k1').mkdir(parents=True)
        (d / 'raw' / 'refs' / 'k1' / 'cand.json').write_text(json.dumps({'cand': CAND}))

    def tearDown(self):
        fi.HERE, fi.RAW = self.old
        self.tmp.cleanup()

    def vet(self, answers):
        p = Path(self.tmp.name) / 'vet.json'
        p.write_text(json.dumps(answers))
        fi.cmd_vet(str(p))
        return {r['key']: r for r in json.loads(self.table.read_text())}

    def test_records_and_repeats(self):
        rows = self.vet([{'key': 'k1', 'ok': [2, 100, 2], 'why': 'c0 is a menu'}])
        self.assertEqual(rows['k1']['refs'], [{**CAND[1], 'ok': True}, {**CAND[2], 'ok': True}])
        self.assertEqual(rows['k1']['vet'], 'c0 is a menu')
        self.assertNotIn('refs', rows['k2'])
        self.assertEqual(len(fi.vetted_refs(rows['k1'])), 2)
        before = self.table.read_text()
        self.vet([{'key': 'k1', 'ok': [2, 100, 2], 'why': 'c0 is a menu'}])
        self.assertEqual(self.table.read_text(), before)
        rows = self.vet([{'key': 'k1', 'ok': [0]}, {'key': 'k2', 'ok': []}])
        self.assertEqual(rows['k1']['refs'], [{**CAND[0], 'ok': True}])
        self.assertNotIn('vet', rows['k1'])
        self.assertEqual(rows['k2']['refs'], [])

    def test_refuses_whole(self):
        before = self.table.read_text()
        for bad in ([{'key': 'k1', 'ok': [1]}], [{'key': 'nope', 'ok': [0]}], [{'key': 'k2', 'ok': [0]}],
                    [{'key': 'k1', 'ok': '0'}], [{'key': 'k1', 'ok': [0]}, {'key': 'k1', 'ok': [7]}]):
            with self.assertRaises(SystemExit):
                self.vet(bad)
            self.assertEqual(self.table.read_text(), before)


if __name__ == '__main__':
    unittest.main()
