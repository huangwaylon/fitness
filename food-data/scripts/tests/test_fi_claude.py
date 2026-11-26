"""fi.py claude / claude2 and state() (food-data/images/fi.py): the Claude check's verdicts decide a row's state.
Run (from the repo root): python3 -I -m unittest discover -s food-data/scripts/tests
"""
import importlib.util, json, os, tempfile, unittest
from pathlib import Path

FI = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'images', 'fi.py')
spec = importlib.util.spec_from_file_location('fi', FI)
fi = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fi)

CAND = [{'n': 0, 'origin': 'wikidata', 'file': 'File:A.jpg', 'page': 'p0'}, {'n': 3, 'origin': 'search', 'file': 'File:B.jpg', 'page': 'p3'}]


class Claude(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        d = Path(self.tmp.name)
        self.old = fi.HERE, fi.RAW, fi.VERDICTS, fi.CHECKS
        fi.HERE, fi.RAW, fi.VERDICTS, fi.CHECKS = d, d / 'raw', d / 'verdicts.jsonl', True
        (d / 'table').mkdir()
        self.table = d / 'table' / 'a.json'
        self.table.write_text(json.dumps([{'key': 'k1', 'ja': 'a', 'desc': 'd1', 'items': []},
                                          {'key': 'k2', 'ja': 'b', 'desc': 'd2', 'items': [], 'refs': []}]) + '\n')
        (d / 'raw' / 'refs' / 'k1').mkdir(parents=True)
        (d / 'raw' / 'refs' / 'k1' / 'cand.json').write_text(json.dumps({'cand': CAND}))
        for k in ('k1', 'k2'):
            self.draw(k, 0)

    def tearDown(self):
        fi.HERE, fi.RAW, fi.VERDICTS, fi.CHECKS = self.old
        self.tmp.cleanup()

    def rows(self):
        return {r['key']: r for r in json.loads(self.table.read_text())}

    def draw(self, k, roll):
        p = fi.gen_path(self.rows()[k], roll)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(b'png')

    def log(self, answers, check='claude'):
        p = Path(self.tmp.name) / 'in.json'
        p.write_text(json.dumps(answers))
        fi.cmd_claude(str(p), check)

    def state(self, k):
        return fi.state(self.rows()[k], fi.verdicts())

    def a(self, k, verdict, **kw):
        return {'key': k, 'verdict': verdict, 'strength': 'weak', 'why': kw.pop('why', ''), 'by': 'c1', **kw}

    def test_states(self):
        self.assertEqual(self.state('k1'), ('check', 0))
        fi.CHECKS = False
        self.assertEqual(self.state('k1'), ('ship', 0))
        self.assertFalse(fi.checked(self.rows()['k1'], fi.verdicts()))
        fi.CHECKS = True
        self.log([self.a('k1', 'pass'), self.a('k2', 'reroll', why='wrong cut')])
        self.assertEqual(self.state('k1'), ('ship', 0))
        self.assertTrue(fi.checked(self.rows()['k1'], fi.verdicts()))
        self.assertEqual(self.state('k2'), ('gen', 1))
        self.draw('k2', 1)
        self.assertEqual(self.state('k2'), ('check', 1))
        self.log([self.a('k2', 'reroll')])
        self.draw('k2', 2)
        self.log([self.a('k2', 'reroll', why='still')])
        self.assertEqual(self.state('k2'), ('tile', 'roll 2: still'))
        v = fi.verdicts()['k1'][0]
        self.assertEqual((v['check'], v['roll'], v['strength'], v['model']), ('claude', 0, 'weak', 'c1'))

    def test_second_opinion_wins(self):
        self.log([self.a('k1', 'pass'), self.a('k2', 'reroll')])
        self.log([self.a('k1', 'fallback', why='a lookalike'), self.a('k2', 'pass')], 'claude2')
        self.assertEqual(self.state('k1'), ('tile', 'roll 0: a lookalike'))
        self.assertEqual(self.state('k2'), ('ship', 0))  # claude2 judged roll 0, the roll claude saw
        self.log([self.a('k1', 'pass')], 'claude2')  # agreeing after all: the last counts
        self.assertEqual(self.state('k1'), ('ship', 0))

    def test_fallback_new_desc_repeat_refs(self):
        self.log([self.a('k1', 'fallback', refs_ok=[3]), self.a('k2', 'pass', refs_ok=[0])])
        self.assertEqual(self.state('k1')[0], 'tile')
        rows = self.rows()
        self.assertEqual(rows['k1']['refs'], [{**CAND[1], 'ok': True}])
        self.assertEqual(rows['k2']['refs'], [])  # vetted already: refs_ok ignored
        n = len(fi.VERDICTS.read_text().splitlines())
        self.log([self.a('k1', 'fallback', refs_ok=[3])])
        self.assertEqual(len(fi.VERDICTS.read_text().splitlines()), n)
        rs = json.loads(self.table.read_text())
        rs[0]['desc'] = 'new'
        self.table.write_text(json.dumps(rs) + '\n')
        self.assertEqual(self.state('k1'), ('gen', 0))  # a new description: the old verdicts don't count

    def test_refuses_whole(self):
        before = self.table.read_text()
        for bad in ([self.a('nope', 'pass')], [self.a('k1', 'maybe')], [{**self.a('k1', 'pass'), 'strength': 'x'}],
                    [self.a('k1', 'pass', refs_ok=[7])], [self.a('k1', 'pass', roll=1)], [self.a('k2', 'pass'), self.a('k1', 'pass', refs_ok='0')]):
            with self.assertRaises(SystemExit):
                self.log(bad)
            self.assertEqual(self.table.read_text(), before)
            self.assertFalse(fi.VERDICTS.exists())


if __name__ == '__main__':
    unittest.main()
