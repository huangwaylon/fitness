"""fi.py refs' pure parts (food-data/images/fi.py): the thumbnail host, title resolution, a row's searches.
No network. Run (from the repo root): python3 -I -m unittest discover -s food-data/scripts/tests
"""
import importlib.util, os, unittest

FI = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'images', 'fi.py')
spec = importlib.util.spec_from_file_location('fi', FI)
fi = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fi)


class Refs(unittest.TestCase):
    def test_thumb_host(self):
        u = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/A.jpg/330px-A.jpg?utm_source=x'
        self.assertEqual(fi.thumb_url(u), 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/A.jpg/330px-A.jpg')

    def test_resolved(self):
        q = {'normalized': [{'from': 'a_b', 'to': 'A b'}], 'redirects': [{'from': 'A b', 'to': 'C'}]}
        self.assertEqual(fi._resolved(q, ['a_b', 'D']), {'a_b': 'C', 'D': 'D'})

    def test_searches(self):
        byid = {'x:1': {'en': 'Rafute (stewed pork)'}}
        self.assertEqual(fi._searches({'ja': 'ラフテー', 'items': ['x:1'], 'desc': 'rafute, cubes'}, byid), ['ラフテー', 'Rafute'])
        self.assertEqual(fi._searches({'ja': 'あけび 生', 'items': [], 'desc': 'akebi fruits, purple'}, byid), ['あけび 生', 'akebi fruits', 'あけび'])
        row = {'ja': '米ぬか油', 'items': ['x:2'], 'desc': 'Rice bran oil: clear pale golden oil'}
        self.assertEqual(fi._searches(row, byid), ['米ぬか油', 'Rice bran oil'])
        self.assertEqual(fi._searches({**row, 'search': ['米油']}, byid), ['米油'])


if __name__ == '__main__':
    unittest.main()
