"""kalori_convert.py on invented format-v2 rows (the scraper's shard lines).
Run (from the repo root): python3 -I -m unittest discover -s food-data/scripts/tests
"""
import contextlib, io, json, os, sys, tempfile, unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import kalori_convert as K  # noqa: E402
import lib  # noqa: E402

SHOPS = {'tako-ya': 'たこ屋', 'mame-cafe': 'まめカフェ'}


def row(i, name, kcal=500, shop='tako-ya', est=False, at='2026-11-13T00:00:00+00:00', **kw):
    """A v2 line; kw: top-level fields, or nutrients=... to replace them (a key left out: not on the page)."""
    nut = {'kcal': {'v': kcal, 'est': est}, 'p': {'v': 20, 'est': est}, 'f': {'v': 10.04, 'est': est},
           'c': {'v': 60.05, 'est': est}}
    if kcal is None:
        del nut['kcal']
    r = {'shop': shop, 'id': str(i), 'url': 'https://kalori.jp/ja/shops/%s/products/%d/' % (shop, i),
         'lastmod': '2026-09-12T07:35:51.000Z', 'fetched_at': at, 'listed': True, 'name': name,
         'shop_name': SHOPS.get(shop), 'shop_category': 'gyudon', 'genre': 'rice-bowl', 'ended': False,
         'image_id': 9000 + i, 'nutrients': nut, 'item': {'@type': 'MenuItem'}}
    r.update(kw)
    return r


def v1(i, name, shop='tako-ya'):
    return {'shop': shop, 'id': str(i), 'fetched_at': '2026-11-14T00:00:00+00:00', 'item': {'name': name}}


def write_shards(d, *shards):
    for n, lines in enumerate(shards):
        with open(os.path.join(d, 'shard-%d.jsonl' % n), 'w', encoding='utf-8') as fh:
            fh.write(''.join((x if isinstance(x, str) else json.dumps(x, ensure_ascii=False)) + '\n' for x in lines))


class Convert(unittest.TestCase):
    def conv(self, rows, **kw):
        return K.convert(rows, **kw)

    def test_item_shape(self):
        nut = {'kcal': {'v': 500, 'est': False}, 'p': {'v': 20, 'est': False}, 'f': {'v': 10.04, 'est': False},
               'c': {'v': 60.05, 'est': False}, 'salt': {'v': 2.25, 'est': False}, 'fiber': {'v': 1, 'est': False},
               'sugar': {'v': 3, 'est': False}}
        doc, rep = self.conv([row(1, ' タコ丼 ', nutrients=nut)])
        self.assertEqual({k: doc[k] for k in K.META}, K.META)
        self.assertEqual(doc['shops'], {'tako-ya': {'name': 'たこ屋'}})
        self.assertEqual(doc['items'], [{
            'id': 'kal:1', 'name': 'タコ丼', 'shop': 'tako-ya', 'cat': '丼・定食', 'kcal': 500, 'p': 20,
            'f': 10.0, 'c': 60.1, 'salt': 2.3, 'fib': 1, 'img': 9001}])
        self.assertEqual(K.errors(doc), [])
        self.assertEqual(lib.validate(doc), [])
        self.assertEqual(rep['items'], 1)

    def test_missing_is_unknown_not_zero(self):
        doc, _ = self.conv([row(1, 'a', nutrients={'kcal': {'v': 300, 'est': False}, 'c': {'v': 0, 'est': False}})])
        it = doc['items'][0]
        self.assertEqual((it['p'], it['f'], it['c'], it['salt']), (None, None, 0, None))
        self.assertNotIn('fib', it)
        self.assertEqual(lib.validate(doc), [])

    def test_est(self):
        def n(kcal_est, **pfc):
            return {'kcal': {'v': 400, 'est': kcal_est}, **{k: {'v': 25, 'est': e} for k, e in pfc.items()}}
        rows = [row(1, 'a'), row(2, 'b', nutrients=n(False, p=False, f=True, c=False)),
                row(3, 'c', est=True), row(4, 'd', nutrients=n(True)), row(5, 'e', nutrients=n(False, salt=True)),
                row(6, 'f', nutrients=n(False)), row(7, 'g', nutrients=n(False, p=False, fiber=True, salt=False)),
                row(8, 'h', nutrients=n(True, p=False, salt=True)), row(9, 'i', nutrients=n(False, f=True, fiber=True)),
                row(10, 'j', nutrients=n(False, p=False, salt=False, fiber=False))]
        doc, rep = self.conv(rows)
        by = {it['id']: it.get('est') for it in doc['items']}
        self.assertEqual([by['kal:%d' % i] for i in range(1, 11)],
                         [None, 'p', 'e', 'e', 's', None, 's', 'e', 'p', None])
        self.assertEqual(rep['est'], {'e': 3, 'p': 2, 's': 2, 'official': 3})

    def test_drops(self):
        rows = [row(1, ''), row(2, 'カラ', kcal=None), row(4, '巨盛', kcal=5001),
                row(5, '塩辛', nutrients={'kcal': {'v': 1, 'est': False}, 'salt': {'v': 501, 'est': False}}),
                row(6, '負', nutrients={'kcal': {'v': 1, 'est': False}, 'p': {'v': -1, 'est': False}}),
                row(9, '繊維', nutrients={'kcal': {'v': 1, 'est': False}, 'fiber': {'v': 101, 'est': False}}),
                row(7, 'ふつう', nutrients={'kcal': {'v': 5000, 'est': False}}), row(7, 'ふつう', shop='mame-cafe'),
                row(8, 'x', shop='')]
        doc, rep = self.conv(rows)
        self.assertEqual([it['id'] for it in doc['items']], ['kal:7'])
        self.assertEqual(rep['dropped'], {'no_values': 3, 'long_name': 0, 'range': 4, 'implausible': 0,
                                          'off_product': 0, 'duplicate': 1, 'near_duplicate': 0})

    def test_off_same_product_only(self):
        off = K.off_names([{'name': 'タコ丼', 'brand': 'たこ屋・本店'}, {'name': 'まめラテ', 'brand': 'よその会社'}])
        doc, rep = self.conv([row(1, 'タコ丼'), row(2, 'まめラテ', shop='mame-cafe')], off=off)
        self.assertEqual([it['id'] for it in doc['items']], ['kal:2'])
        self.assertEqual(rep['dropped']['off_product'], 1)
        # through an alias: マメ珈琲 is ours for mame-cafe
        doc, _ = self.conv([row(2, 'まめラテ', shop='mame-cafe')], aliases={'mame-cafe': ['マメ珈琲']},
                           off={'まめラテ': {K.norm('マメ珈琲')}})
        self.assertEqual(doc['items'], [])
        self.assertFalse(K.same_maker({'co'}, {'cocoya'}))

    def test_brand_falls_back_to_the_slug(self):
        doc, _ = self.conv([row(1, 'イカ定食', shop='nami', shop_name=None)])
        self.assertEqual(doc['shops'], {'nami': {'name': 'nami'}})

    def test_loader_keys_never_shipped(self):
        # sv, the 1食 portion and brand (the header's shop name) are the app's loader's (db.ts withJan)
        doc, _ = self.conv([row(1, 'a'), row(2, 'b', shop='mame-cafe', shop_name='まめカフェ')])
        self.assertFalse([it['id'] for it in doc['items'] if set(it) & set(K.LOADER_KEYS)])
        self.assertEqual(doc['shops'], {'mame-cafe': {'name': 'まめカフェ'}, 'tako-ya': {'name': 'たこ屋'}})
        doc['items'][0]['sv'] = True
        self.assertEqual(K.errors(doc), ["%s: brand, sv or portions (the loader's)" % doc['items'][0]['id']])

    def test_category(self):
        rows = [row(1, 'a', genre='coffee', shop_category='gyudon'), row(2, 'b', genre=None, shop_category='cafe'),
                row(3, 'c', genre='other', shop_category='chinese'), row(4, 'd', genre=None, shop_category=None),
                row(5, 'e', genre='mystery', shop_category='mystery'), row(6, 'f', genre=None, shop_category='family'),
                row(7, 'g', genre='other', shop_category='ramen'), row(8, 'h', genre=None, shop_category='sweets')]
        doc, rep = self.conv(rows)
        self.assertEqual([it['cat'] for it in doc['items']],
                         ['飲料', 'その他', 'その他', 'その他', 'その他', 'その他', '麺', '菓子・デザート'])
        self.assertEqual(rep['other_cat'], 5)
        self.assertEqual(rep['unknown_kinds'], {'genre:mystery': 1, 'shop_category:mystery': 1})

    def test_category_genreless_by_name(self):
        # a yakiniku shop's ホットココア isn't 肉, a cafe's cake isn't 飲料, a supermarket's rice isn't コンビニ
        names = [('ホットココア', 'yakiniku', '飲料'), ('アイスコーヒー', 'family', '飲料'), ('抹茶ラテ', 'cafe', '飲料'),
                 ('ベイクドチーズケーキ', 'cafe', '菓子・デザート'), ('抹茶パフェ', 'cafe', '菓子・デザート'),
                 ('バニラアイス', 'hamburg', '菓子・デザート'), ('コーヒーゼリー', 'cafe', '菓子・デザート'),
                 ('生ビール', 'yakiniku', '酒'), ('緑茶ハイ', 'chinese', '酒'), ('レモンサワー', 'izakaya', '酒'),
                 ('梅酒 ロック', 'izakaya', '酒'), ('ハイボールテイスト', 'family', 'その他'),
                 ('甘酒', 'cafe', 'その他'), ('あさりの酒蒸し', 'izakaya', 'その他'), ('ハイビスカス', 'cafe', 'その他'),
                 ('魚沼こしひかり 2kg', 'supermarket', 'その他'), ('茶碗蒸し', 'teishoku', '丼・定食'),
                 ('枝豆', 'sushi', '寿司'), ('メンマ', 'ramen', '麺'), ('しいたけ', 'yakiniku', 'その他')]
        doc, _ = self.conv([row(i, n, genre=None if i % 2 else 'other', shop_category=k, nutrients={
            'kcal': {'v': 100, 'est': False}}) for i, (n, k, _) in enumerate(names)])
        self.assertEqual([(it['name'], it['cat']) for it in sorted(doc['items'], key=lambda it: int(it['id'][4:]))],
                         [(n, c) for n, _, c in names])

    def test_category_alcohol_in_a_drink_genre(self):
        rows = [row(1, '緑茶ハイ', genre='soup'), row(2, '196ストロング＜ダブルレモン＞', genre='soft-drink'),
                row(3, '凍結パインサワー', genre='soft-drink'), row(4, '緑茶', genre='tea'),
                row(5, 'サワークリームオニオン', genre='soft-drink'), row(6, '酒場のポテト', genre='soup'),
                row(7, '赤ワイン煮込み', genre='beef')]
        doc, _ = self.conv(rows)
        self.assertEqual([it['cat'] for it in doc['items']], ['酒', '酒', '酒', '飲料', '飲料', '汁物', '肉'])

    def test_category_pastry(self):
        rows = [row(1, 'ブラウニー', genre='pastry', shop_category='sweets'),
                row(2, 'マシュマロ', genre='pastry', shop_category='confectionery'),
                row(3, 'いちごタルト', genre='pastry', shop_category='cafe'), row(4, 'クロワッサン', genre='pastry',
                                                                          shop_category='cafe'),
                row(5, 'メロンパン', genre='pastry', shop_category='bread'),
                row(6, 'チーズケーキ', genre='pastry', shop_category='convenience')]
        doc, _ = self.conv(rows)
        self.assertEqual([it['cat'] for it in doc['items']], ['菓子・デザート', '菓子・デザート', '菓子・デザート', 'パン',
                                                             'パン', 'パン'])

    def test_category_maps_cover_kalori_and_ours(self):
        kinds = ('convenience supermarket gyudon curry fastfood cafe teishoku udon soba izakaya yakitori family hamburg '
                 'yakiniku nabe karaage tonkatsu sushi ramen chinese korean indian tempura okonomiyaki pizza italian '
                 'bento other-restaurant bread sweets confectionery').split()
        self.assertEqual(sorted(K.SHOP_CAT), sorted(kinds))
        self.assertTrue((set(K.SHOP_CAT.values()) - {None}) | set(K.GENRE_CAT.values()) <= set(lib.CATS))

    def test_image(self):
        doc, _ = self.conv([row(1, 'a', image_id=None), row(2, 'b', image_id=0), row(3, 'c', image_id=True)])
        self.assertEqual([it.get('img') for it in doc['items']], [None, None, None])

    def test_ended_and_unlisted_kept_marked(self):
        doc, rep = self.conv([row(1, 'a'), row(2, 'b', ended=True), row(3, 'c', listed=False)])
        self.assertEqual([(it.get('ended'), it.get('pop')) for it in doc['items']], [(None, None), (True, -1), (True, -1)])
        self.assertEqual(rep['ended'], 2)
        self.assertEqual(lib.validate(doc), [])
        # a 販売終了かも page shows no 推定 badges: never 'official', estimated; a flag it does show still counts
        self.assertEqual([it.get('est') for it in doc['items']], [None, 'e', 'e'])
        pfc = {'kcal': {'v': 500, 'est': False}, 'p': {'v': 20, 'est': True}}
        self.assertEqual(self.conv([row(4, 'd', ended=True, nutrients=pfc)])[0]['items'][0]['est'], 'p')

    def test_gone_is_unlisted(self):
        pfc = {'kcal': {'v': 500, 'est': False}, 'p': {'v': 20, 'est': True}}
        doc, rep = self.conv([row(1, 'a', gone=True), row(2, 'b', gone=True, nutrients=pfc), row(3, 'c', gone=False),
                              row(4, 'd', listed=False)])
        self.assertEqual([(it.get('ended'), it.get('pop'), it.get('est')) for it in doc['items']],
                         [(True, -1, 'e'), (True, -1, 'p'), (None, None, None), (True, -1, 'e')])
        self.assertEqual(rep['ended'], 3)
        # a near-duplicate: the current one stays over a gone one
        doc, _ = self.conv([row(7, 'タコ丼', lastmod='2026-12-01T00:00:00Z', gone=True), row(8, 'タコ丼')])
        self.assertEqual([it['id'] for it in doc['items']], ['kal:8'])

    def test_no_table_keeps_its_flags_parser_ignored(self):
        # table: false, the site's estimates only: the scraper sets every est, so 'e'
        doc, _ = self.conv([row(1, 'a', est=True, table=False, parser=3), row(2, 'b', table=False, parser=3)])
        self.assertEqual([it.get('est') for it in doc['items']], ['e', None])
        self.assertEqual(self.conv([row(5, 'x', parser=3, table=True)])[0], self.conv([row(5, 'x')])[0])

    def test_variants(self):
        rows = [row(1, 'タコ丼 並盛', kcal=600), row(2, 'タコ丼 大盛', kcal=610), row(3, 'タコ丼 ミニ', kcal=400),
                row(4, 'イカ丼 (並)'), row(5, 'イカ丼 (大)'), row(6, 'イカ丼'),
                row(10, 'まめラテ（Grande・豆乳）', shop='mame-cafe'), row(11, 'まめラテ（Tall・豆乳）', shop='mame-cafe'),
                row(12, 'まめラテ（Tall・ミルク）', shop='mame-cafe'),
                row(20, 'ひとつ丼 並盛'), row(21, 'ひとつ丼（並盛）'),          # one state twice: no group
                row(22, 'みそ汁（赤だし）'), row(23, 'みそ汁（白）'),             # not a size: no group
                row(24, 'タコ丼 並盛', shop='mame-cafe'),                   # another shop's
                row(30, 'エビ丼 並盛', ended=True), row(31, 'エビ丼 大盛'),    # a gone default gives way
                row(40, 'ポテト M'), row(41, 'ポテト LL'), row(42, 'ポテト XL'), row(43, 'ポテト ジャンボ')]
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
        self.assertEqual({by['kal:30']['vg'], by['kal:31']['vg']}, {'kal:31'})
        self.assertEqual([(by['kal:%d' % i]['vg'], by['kal:%d' % i]['st']) for i in (40, 41, 42, 43)],
                         [('kal:40', 'M'), ('kal:40', 'LL'), ('kal:40', 'XL'), ('kal:40', 'ジャンボ')])
        self.assertEqual(rep['grouped'], 14)
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
        al, names = K.read_shops()
        self.assertTrue(al)
        for shop, aliases in al.items():
            self.assertRegex(shop, r'^[a-z0-9-]+$')
            self.assertTrue(aliases and all(isinstance(n, str) and n.strip() == n and n for n in aliases), shop)
        flat = [n for v in al.values() for n in v]
        self.assertEqual(len(flat), len(set(flat)), 'an alias names one shop')
        self.assertEqual(names['chawan'], 'chawan')
        self.assertTrue(all(isinstance(n, str) and n.strip() == n and n for n in names.values()))

    def test_shop_display_name(self):
        doc, rep = self.conv([row(1, 'a', shop='cha', shop_name='cha'), row(2, 'b')],
                             names={'cha': 'Cha 茶', 'gone': 'x'}, aliases={'cha': ['ちゃ']})
        self.assertEqual(doc['shops'], {'cha': {'name': 'Cha 茶', 'aliases': ['ちゃ']}, 'tako-ya': {'name': 'たこ屋'}})
        self.assertEqual(rep['unknown_alias_shops'], ['gone'])
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, 's.json')
            with open(path, 'w', encoding='utf-8') as fh:
                json.dump({'_c': 'x', 'a': ['エー'], 'b': {'name': 'Bee'}, 'c': {'name': 'Sea', 'aliases': ['シー']}}, fh)
            self.assertEqual(K.read_shops(path), ({'a': ['エー'], 'c': ['シー']}, {'b': 'Bee', 'c': 'Sea'}))

    def test_near_duplicates(self):
        rows = [row(1, 'えび入りチャーハンセット（スープ付）', lastmod='2026-10-27T00:00:00Z'),
                row(2, 'えび入りチャーハンセット(スープ付)', lastmod='2026-11-09T00:00:00Z'),    # later: kept
                row(3, 'アサイーボウル ～フルーツ～'), row(4, 'アサイーボウル～フルーツ～'),          # same lastmod: higher id
                row(5, '抹茶オレ（ICED）', lastmod='2026-11-03T00:00:00Z'),
                row(6, '抹茶オレ (ICED)', lastmod='2026-09-09T00:00:00Z'),
                row(7, 'ﾄﾛｻｰﾓﾝ', listed=False, lastmod='2026-12-01T00:00:00Z'), row(8, 'トロサーモン'),  # current: kept
                row(9, 'えび入りチャーハンセット(スープ付)', shop='mame-cafe'),                     # another shop's
                row(10, 'チキン&ハンバーグ'), row(11, 'チキン＆ポテト')]
        doc, rep = self.conv(rows)
        self.assertEqual([it['id'] for it in doc['items']],
                         ['kal:9', 'kal:10', 'kal:11', 'kal:2', 'kal:4', 'kal:5', 'kal:8'])
        self.assertEqual(rep['dropped']['near_duplicate'], 4)

    def test_implausible(self):
        def n(kcal, p, f, c):
            return {'kcal': {'v': kcal, 'est': True}, 'p': {'v': p, 'est': True}, 'f': {'v': f, 'est': True},
                    'c': {'v': c, 'est': True}}
        rows = [row(1, 'メガたんめん', nutrients=n(47, 60, 80, 300)),      # Atwater 1,960: a source error
                row(2, 'たんめん', nutrients=n(650, 25, 20, 90)),           # 640: fine
                row(3, '一貫', nutrients=n(80, 2, 1, 4)),                   # 33, off by 47: under 50 kcal, kept
                row(4, '196ストロング', genre='soft-drink', nutrients=n(189, 0, 0, 1.5)),   # alcohol: exempt
                row(5, 'ワイン グラス', genre='alcohol', nutrients=n(90, 0, 0, 2)),
                row(6, '米', nutrients={'kcal': {'v': 900, 'est': False}, 'c': {'v': 10, 'est': False}}),  # P, F unknown
                row(7, '巨大', nutrients=n(2000, 20, 20, 100)),              # 660 against 2,000
                row(8, 'チキンサラダ', nutrients=n(0, 3.5, 2, 1.2)),          # 0 kcal for Atwater's 37
                row(9, 'ゼロ茶', genre='tea', nutrients=n(0, 0, 0, 0.5)),     # 0 kcal, 2 by Atwater: a real zero
                row(10, '寒天ゼリー', genre='snack', nutrients=n(0, 0.4, 0, 7.9))]  # carbs of fibre: a real zero
        doc, rep = self.conv(rows)
        self.assertEqual({it['id'] for it in doc['items']}, {'kal:2', 'kal:3', 'kal:4', 'kal:5', 'kal:6', 'kal:9', 'kal:10'})
        self.assertEqual(rep['dropped']['implausible'], 3)

    def test_name_cleanup(self):
        ikari = {'shop': 'ikari-super'}
        rows = [row(1, '炙りﾄﾛｻｰﾓﾝ(1貫)'), row(2, 'TO アンチョビポテトM', shop='bigboy'), row(3, 'TO大きなエビフライ', shop='bigboy'),
                row(4, 'Ｓ 冷凍 焼豚', **ikari), row(5, 'Ｏ アイスティーセット', **ikari),
                row(6, 'M おかき＆かりんとう［店頭お渡し］', **ikari), row(7, '【38】《クリスマス》ロマネ', **ikari),
                row(8, '【23】【24】とらふぐ てっさ', **ikari), row(9, 'Ｓ 和歌山県産 みかん /', **ikari),
                row(10, 'お持ち帰り 3種ソーセージ\n～ブラックペッパー～'), row(11, '  潤み食パン\u3000 ― 仕立て ― '),
                row(12, 'イタリア栗のモンブラン※イタリア栗85％使用'), row(13, 'アイスミルク(※2)'),
                row(14, '100分食べ放題 DXコース（税込4,378円）'), row(15, 'カルピス S：180円（税込198円）'),
                row(16, '100円モーニング'), row(17, '※'), row(18, '【1】'), row(19, 'G キューブ ダーク（4粒入）'),
                row(20, 'ＴＯＫＹＯ　バナナ（ＢＯＸ）'), row(21, 'TOMATO サラダ'), row(22, 'カレー (※1) 大盛'),
                row(23, 'ソース ※別売 大盛'), row(24, 'ホットコーヒーＭ ※高速道路店除く（2026年リニューアル）'),
                row(25, 'TOマト サラダ'), row(26, "M&M's ピーナッツ"), row(27, 'M ポテト'), row(28, '【2】苺サンド')]
        doc, rep = self.conv(rows)
        self.assertEqual([it['name'] for it in sorted(doc['items'], key=lambda it: int(it['id'][4:]))], [
            '炙りトロサーモン(1貫)', 'アンチョビポテトM', '大きなエビフライ', '冷凍 焼豚', 'アイスティーセット',
            'おかき＆かりんとう［店頭お渡し］', '《クリスマス》ロマネ', 'とらふぐ てっさ', '和歌山県産 みかん',
            'お持ち帰り 3種ソーセージ ～ブラックペッパー～', '潤み食パン ― 仕立て ―', 'イタリア栗のモンブラン', 'アイスミルク',
            '100分食べ放題 DXコース', 'カルピス S', '100円モーニング', '※', '【1】', 'G キューブ ダーク（4粒入）',
            'ＴＯＫＹＯ　バナナ（ＢＯＸ）', 'TOMATO サラダ', 'カレー 大盛', 'ソース ※別売 大盛', 'ホットコーヒーＭ',
            # another shop's leading letters and 【n】 are its names' own
            'TOマト サラダ', "M&M's ピーナッツ", 'M ポテト', '【2】苺サンド'])
        self.assertEqual(rep['renamed'], 17)

    def test_takeout_code_unspaced(self):
        # ビッグボーイ's and フライングガーデン's TO before 【 or Japanese too; another shop's TOマト stays
        rows = [row(1, 'TOグリルチキン弁当', shop='bigboy'), row(2, 'TO【牡蠣フェア】単品牡蠣フライ', shop='bigboy'),
                row(3, 'TO大きなエビフライ', shop='flying-garden'), row(4, 'TOマト サラダ'), row(5, 'TOMATO', shop='bigboy'),
                row(6, 'TO【牡蠣フェア】ハンバーグ', shop='bigboy'), row(7, '【牡蠣フェア】ハンバーグ', shop='bigboy', kcal=480),
                row(8, 'TOお手軽皿うどん', shop='ringerhut')]
        doc, _ = self.conv(rows)
        self.assertEqual({it['id']: it['name'] for it in doc['items']}, {
            'kal:1': 'グリルチキン弁当', 'kal:2': '【牡蠣フェア】単品牡蠣フライ', 'kal:3': '大きなエビフライ', 'kal:4': 'TOマト サラダ',
            'kal:5': 'TOMATO', 'kal:6': 'TO【牡蠣フェア】ハンバーグ', 'kal:7': '【牡蠣フェア】ハンバーグ', 'kal:8': 'お手軽皿うどん'})

    def test_line_break_with_spaces_is_one_space(self):
        doc, _ = self.conv([row(1, 'お好み牛丼 \nごはん大盛'), row(2, 'カレー\u3000\n 並', kcal=600)])
        self.assertEqual([it['name'] for it in doc['items']], ['お好み牛丼 ごはん大盛', 'カレー 並'])

    def test_name_cleanup_never_merges(self):
        # a takeout TO item beside its eat-in twin, two courses by price, two notes: each keeps what tells it apart
        rows = [row(1, 'TO エビフライ', shop='bigboy'), row(2, 'エビフライ', kcal=480, shop='bigboy'),
                row(3, '牡丹コース 12,000円'), row(4, '牡丹コース 8,000円', kcal=450), row(5, 'うな重（中）※川崎店のみ'),
                row(6, 'うな重（中）※川崎店は別途'), row(7, 'TO コーンスープ', shop='bigboy'), row(8, 'コーンスープ', shop='bigboy')]
        doc, rep = self.conv(rows)
        self.assertEqual([it['name'] for it in doc['items']], [
            'TO エビフライ', 'エビフライ', 'TO コーンスープ', 'コーンスープ', '牡丹コース 12,000円', '牡丹コース 8,000円',
            'うな重（中）※川崎店のみ', 'うな重（中）※川崎店は別途'])
        self.assertEqual(rep['dropped']['near_duplicate'], 0)

    def test_long_names_trimmed(self):
        tail = '（シャキシャキにんじんサラダ＆ちいさなマルゲリータ＆ちいさなパスタボロネーゼ＆コーヒーゼリーのミニサンデー）'
        ikea = 'BELÖNING ベローニング, ミルクチョコレート, オーツ＆キャラメル レインフォレスト・アライアンス認証, %s g'
        rows = [row(1, '昼プチセットPlus' + tail), row(2, 'GOKU BURGER限定KOBE BEEF BURGER神戸牛バーガーGOD CHEESE '
                                                       'BURGERゴッドチーズバーガー'),
                row(3, 'あ' * 70), row(4, ikea % 240), row(5, ikea % 40), row(6, 'い' * 60),
                row(7, 'う' * 5 + '（' + 'え' * 70 + '）')]
        doc, rep = self.conv(rows)
        self.assertEqual([it['name'] for it in doc['items']], [
            '昼プチセットPlus', 'GOKU BURGER限定KOBE BEEF BURGER神戸牛バーガーGOD CHEESE', 'あ' * 60, 'い' * 60,
            ('う' * 5 + '（' + 'え' * 70)[:60]])
        self.assertEqual(rep['dropped']['long_name'], 2)      # the two IKEA ones meet once cut
        self.assertEqual(K.errors(doc), [])


class Partial(unittest.TestCase):
    def report(self, n, shops=('tako-ya',)):
        rows = [row(i, 'タコ丼%d' % i, shop=shops[i % len(shops)]) for i in range(n)]
        return K.convert(rows, aliases={'tako-ya': ['タコ'], 'mame-cafe': ['まめ']})[1]

    def test_refused(self):
        with mock.patch.object(K, 'ITEMS_MIN', 4):
            whole = self.report(4, ('tako-ya', 'mame-cafe'))
            self.assertIsNone(K.partial(whole, env={}))
            short = self.report(3, ('tako-ya', 'mame-cafe'))
            self.assertIn('3 items, under 4', K.partial(short, env={}))
            empty = self.report(4)        # our mame-cafe has no items
            self.assertIn('no items for mame-cafe', K.partial(empty, env={}))
            self.assertNotIn('under', K.partial(empty, env={}))
            self.assertIn('KALORI_ALLOW_PARTIAL=1', K.partial(empty, env={}))
            self.assertIsNone(K.partial(empty, env={'KALORI_ALLOW_PARTIAL': '1'}))
            self.assertIsNotNone(K.partial(empty, env={'KALORI_ALLOW_PARTIAL': '0'}))

    def test_main_refuses_to_write(self):
        with tempfile.TemporaryDirectory() as d:
            write_shards(d, [row(1, 'タコ丼')])
            out = os.path.join(d, 'kalori.json')
            with mock.patch.dict(os.environ, {}, clear=True), self.assertRaises(SystemExit) as no:
                K.main([d, '--out', out])
            self.assertIn('under %d' % K.ITEMS_MIN, str(no.exception.code))
            self.assertFalse(os.path.exists(out))
            with mock.patch.dict(os.environ, {'KALORI_ALLOW_PARTIAL': '1'}), contextlib.redirect_stdout(io.StringIO()):
                K.main([d, '--out', out])
            self.assertTrue(os.path.exists(out))


class Read(unittest.TestCase):
    def test_v1_skipped_latest_wins(self):
        with tempfile.TemporaryDirectory() as d:
            write_shards(d, [v1(1, 'old'), row(1, '古い', at='2026-11-13T01:00:00+00:00'),
                             row(2, 'b', at='2026-11-13T05:00:00+00:00'), '{"half', ''],
                         [row(1, '新しい', at='2026-11-13T02:00:00+00:00'), v1(1, 'newer v1'),
                          row(2, 'b-old', at='2026-11-13T04:00:00+00:00'), row(3, 'c'), row(3, 'c-same-time')])
            rows, rep = K.read_rows([d])
        self.assertEqual({(r['id'], r['name']) for r in rows}, {('1', '新しい'), ('2', 'b'), ('3', 'c-same-time')})
        self.assertEqual(rep, {'lines': 9, 'v1': 2, 'bad': 1, 'gone': 0, 'products': 3})

    def test_gone_line_without_values_marks_the_last_values(self):
        def gone(i, at):
            return {'shop': 'tako-ya', 'id': str(i), 'gone': True, 'fetched_at': at}
        with tempfile.TemporaryDirectory() as d:
            write_shards(d, [row(1, 'a', at='2026-11-13T01:00:00+00:00'), gone(1, '2026-11-14T00:00:00+00:00'),
                             gone(2, '2026-11-12T00:00:00+00:00'), row(2, 'b', at='2026-11-13T01:00:00+00:00'),
                             gone(3, '2026-11-14T00:00:00+00:00')])
            rows, rep = K.read_rows([d])
        self.assertEqual({r['id']: r.get('gone') for r in rows}, {'1': True, '2': None})   # 2: back since; 3: no values
        self.assertEqual((rep['gone'], rep['v1'], rep['products']), (1, 0, 2))
        doc, _ = K.convert(rows)
        self.assertEqual([(it['id'], it.get('ended'), it.get('est')) for it in doc['items']], [('kal:1', True, 'e'), ('kal:2', None, None)])

    def test_main(self):
        with tempfile.TemporaryDirectory() as d:
            write_shards(d, [row(1, 'タコ丼'), row(2, '')])
            out = os.path.join(d, 'x', 'kalori.json')
            with contextlib.redirect_stdout(io.StringIO()) as said, mock.patch.dict(os.environ, {'KALORI_ALLOW_PARTIAL': '1'}):
                K.main([os.path.join(d, 'shard-0.jsonl'), '--out', out])
            with open(out, encoding='utf-8') as fh:
                doc = json.load(fh)
        self.assertEqual(([it['id'] for it in doc['items']], doc['shops']), (['kal:1'], {'tako-ya': {'name': 'たこ屋'}}))
        rep = json.loads(said.getvalue())
        self.assertEqual((rep['items'], rep['read']['products']), (1, 2))


if __name__ == '__main__':
    unittest.main()
