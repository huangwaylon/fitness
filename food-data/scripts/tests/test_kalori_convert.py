"""kalori_convert.py on an invented fixture (no Kalori rows in git).
Run (from the repo root): python3 -I -m unittest discover -s food-data/scripts/tests
"""
import contextlib, io, json, os, sys, tempfile, unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import kalori_convert as K  # noqa: E402


def row(i, name, cal=500, shop='tako-ya', **kw):
    r = {'id': i, 'name': name, 'shop_id': shop, 'shop_name': {'tako-ya': 'たこ屋', 'mame-cafe': 'まめカフェ'}.get(shop, ''),
         'cal': cal, 'p': 20, 'f': 10.04, 'c': 60.05, 'isCalEstimated': False, 'isPfcEstimated': False,
         'aiImageGenerationId': 9000 + i, 'aiImageStatus': 'completed', 'common_genre': 'rice-bowl', 'shop_category': 'gyudon'}
    r.update(kw)
    return r


class Convert(unittest.TestCase):
    def conv(self, rows, **kw):
        return K.convert(rows, {'tako-ya': 'タコヤ', 'mame-cafe': 'マメカフェ', 'nami': '波食堂'}, **kw)

    def test_item_shape(self):
        doc, rep = self.conv([row(1, ' タコ丼 ', salt=2.25, fiber=1)])
        self.assertEqual({k: doc[k] for k in K.META}, K.META)
        self.assertEqual(doc['shops'], {'tako-ya': {'name': 'たこ屋'}})
        self.assertEqual(doc['items'], [{
            'id': 'kal:1', 'name': 'タコ丼', 'brand': 'たこ屋', 'shop': 'tako-ya', 'cat': '丼・定食', 'kcal': 500, 'p': 20,
            'f': 10.0, 'c': 60.1, 'salt': 2.3, 'fib': 1, 'img': 9001, 'sv': True, 'portions': [{'label': '1食', 'g': 100}]}])
        self.assertEqual(K.errors(doc), [])
        self.assertEqual(rep['items'], 1)

    def test_drops(self):
        rows = [row(1, ''), row(2, 'カラ', cal=None), row(3, 'あ' * 61), row(4, '巨盛', cal=5001), row(5, '塩辛', salt=501),
                row(6, '負', p=-1), row(7, 'ふつう', cal=5000, p=None), row(7, 'ふつう'), row(8, 'x', shop='')]
        doc, rep = self.conv(rows)
        self.assertEqual([it['id'] for it in doc['items']], ['kal:7'])
        self.assertIsNone(doc['items'][0]['p'])
        self.assertEqual(rep['dropped'], {'no_values': 3, 'long_name': 1, 'range': 3, 'off_product': 0, 'duplicate': 1})

    def test_off_same_product_only(self):
        off = {'タコ丼': {K.norm('タコヤ・本店')}, 'まめラテ': {K.norm('よその会社')}}
        doc, rep = self.conv([row(1, 'タコ丼', shop_name=''), row(2, 'まめラテ', shop='mame-cafe')], off=off)
        self.assertEqual([it['id'] for it in doc['items']], ['kal:2'])
        self.assertEqual(rep['dropped']['off_product'], 1)
        # through an alias: マメ is ours for mame-cafe
        doc, _ = self.conv([row(2, 'まめラテ', shop='mame-cafe')], aliases={'mame-cafe': ['マメ珈琲']},
                           off={'まめラテ': {K.norm('マメ珈琲')}})
        self.assertEqual(doc['items'], [])
        self.assertFalse(K.same_maker({'co'}, {'cocoya'}))

    def test_brand_falls_back_to_shops_csv(self):
        doc, _ = self.conv([row(1, 'イカ定食', shop='nami')])
        self.assertEqual(doc['items'][0]['brand'], '波食堂')

    def test_trust(self):
        rows = [row(1, 'a'), row(2, 'b', isPfcEstimated=True), row(3, 'c', isCalEstimated=True, isPfcEstimated=True),
                row(4, 'd', isCalEstimated=None, isPfcEstimated=None), row(5, 'e', isCalEstimated=True)]
        doc, rep = self.conv(rows)
        self.assertEqual([it.get('est') for it in doc['items']], [None, 'p', 'e', 'e', 'e'])
        self.assertEqual(rep['est'], {'e': 3, 'p': 1})

    def test_image_and_category(self):
        rows = [row(1, 'a', aiImageGenerationId=None), row(2, 'b', aiImageStatus='pending'),
                row(3, 'c', common_genre=None), row(4, 'd', common_genre='mystery', shop_category='mystery'),
                row(5, 'e', common_genre='coffee')]
        doc, _ = self.conv(rows)
        self.assertEqual([it.get('img') for it in doc['items']], [None, None, 9003, 9004, 9005])
        self.assertEqual([it['cat'] for it in doc['items']], ['丼・定食', '丼・定食', '丼・定食', 'その他', '飲料'])

    def test_variants(self):
        rows = [row(1, 'タコ丼 並盛', cal=600), row(2, 'タコ丼 大盛', cal=800), row(3, 'タコ丼 ミニ', cal=400),
                row(4, 'イカ丼 (並)'), row(5, 'イカ丼 (大)'), row(6, 'イカ丼'),
                row(10, 'まめラテ（Grande・豆乳）', shop='mame-cafe'), row(11, 'まめラテ（Tall・豆乳）', shop='mame-cafe'),
                row(12, 'まめラテ（Tall・ミルク）', shop='mame-cafe'),
                row(20, 'ひとつ丼 並盛'), row(21, 'ひとつ丼（並盛）'),          # one state twice: no group
                row(22, 'みそ汁（赤だし）'), row(23, 'みそ汁（白）'),             # not a size: no group
                row(24, 'タコ丼 並盛', shop='mame-cafe')]                   # another shop's
        doc, rep = self.conv(rows)
        by = {it['id']: it for it in doc['items']}
        self.assertEqual([(by['kal:%d' % i]['vg'], by['kal:%d' % i]['st']) for i in (1, 2, 3)],
                         [('kal:1', '並盛'), ('kal:1', '大盛'), ('kal:1', 'ミニ')])
        self.assertEqual([by['kal:%d' % i]['st'] for i in (4, 5)], ['並', '大'])
        self.assertNotIn('vg', by['kal:6'])
        self.assertEqual({by['kal:%d' % i]['vg'] for i in (10, 11, 12)}, {'kal:12'})
        self.assertEqual(by['kal:10']['st'], 'Grande・豆乳')
        for i in (20, 21, 22, 23, 24):
            self.assertNotIn('vg', by['kal:%d' % i])
        self.assertEqual(rep['grouped'], 8)
        self.assertEqual(by['kal:10']['aliases'], ['まめラテ（グランデ・豆乳）'])
        self.assertNotIn('aliases', by['kal:1'])
        self.assertEqual(K.errors(doc), [])

    def test_aliases_header(self):
        doc, rep = self.conv([row(1, 'a')], aliases={'tako-ya': ['タコ'], 'gone': ['x']})
        self.assertEqual(doc['shops'], {'tako-ya': {'name': 'たこ屋', 'aliases': ['タコ']}})
        self.assertEqual(rep['unknown_alias_shops'], ['gone'])

    def test_errors(self):
        doc, _ = self.conv([row(1, 'a'), row(2, 'b')])
        doc['items'][1]['id'] = 'kal:1'
        doc['items'][0]['kcal'] = 9999
        doc['items'][0]['vg'] = 'kal:404'
        self.assertEqual(len(K.errors(doc)), 3)

    def test_alias_file(self):
        al = K.read_aliases()
        self.assertTrue(al)
        for shop, names in al.items():
            self.assertRegex(shop, r'^[a-z0-9-]+$')
            self.assertTrue(names and all(isinstance(n, str) and n.strip() == n and n for n in names), shop)
        flat = [n for v in al.values() for n in v]
        self.assertEqual(len(flat), len(set(flat)), 'an alias names one shop')

    def test_main_writes_the_file(self):
        with tempfile.TemporaryDirectory() as d:
            src, shops, out = (os.path.join(d, n) for n in ('items.jsonl', 'shops.csv', 'private/kalori.json'))
            with open(src, 'w', encoding='utf-8') as fh:
                fh.write('\n'.join(json.dumps(r, ensure_ascii=False) for r in [row(1, 'タコ丼', shop_name=''), row(2, '')]))
            with open(shops, 'w', encoding='utf-8') as fh:
                fh.write('shop_id,name,ja,category\ntako-ya,Tako,タコヤ,gyudon\n')
            with contextlib.redirect_stdout(io.StringIO()) as said:
                K.main([src, '--off', os.path.join(d, 'none.json'), '--out', out])
            with open(out, encoding='utf-8') as fh:
                doc = json.load(fh)
        self.assertEqual([(it['id'], it['brand']) for it in doc['items']], [('kal:1', 'タコヤ')])
        self.assertEqual(json.loads(said.getvalue())['items'], 1)


if __name__ == '__main__':
    unittest.main()
