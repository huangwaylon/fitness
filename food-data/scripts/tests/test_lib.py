"""Unit tests for the data pipeline. Inline fixtures only: no network, no raw inputs, < 1 s.
Run (from the repo root): python3 -I -m unittest discover -s food-data/scripts/tests
"""
import io, json, os, shutil, sys, tempfile, unittest, zipfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import build  # noqa: E402
import lib  # noqa: E402
import maff_ingredients as MI  # noqa: E402
import mext_names  # noqa: E402
import off  # noqa: E402
import recipes_text  # noqa: E402

NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'


def make_xlsx(rows, sheet='表全体'):
    """Tiny in-memory xlsx: rows = {row number: {column letter: text}}; every cell is a shared string, and one
    string carries a furigana <rPh> run that the reader must skip."""
    strings, cells = [], {}
    for rn, cols in rows.items():
        for col, text in cols.items():
            strings.append(text)
            cells.setdefault(rn, []).append('<c r="%s%d" t="s"><v>%d</v></c>' % (col, rn, len(strings) - 1))
    si = []
    for s in strings:
        if s == 'こめ［水稲めし］精白米':    # rich text + phonetic run
            si.append('<si><r><t>こめ［水稲めし］</t></r><r><t>精白米</t></r><rPh sb="0" eb="2"><t>コメ</t></rPh></si>')
        else:
            si.append('<si><t>%s</t></si>' % s)
    sheet_xml = '<worksheet xmlns="%s"><sheetData>%s</sheetData></worksheet>' % (NS, ''.join(
        '<row r="%d">%s</row>' % (rn, ''.join(c)) for rn, c in sorted(cells.items())))
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w') as z:
        z.writestr('xl/workbook.xml', '<workbook xmlns="%s" xmlns:r="http://schemas.openxmlformats.org/officeDocument/'
                   '2006/relationships"><sheets><sheet name="%s" sheetId="1" r:id="rId1"/></sheets></workbook>' % (NS, sheet))
        z.writestr('xl/_rels/workbook.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/'
                   'relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')
        z.writestr('xl/sharedStrings.xml', '<sst xmlns="%s">%s</sst>' % (NS, ''.join(si)))
        z.writestr('xl/worksheets/sheet1.xml', sheet_xml)
    buf.seek(0)
    return buf


MEXT_FIXTURE = {
    2: {'A': '食品群', 'B': '食品番号', 'D': '食品名', 'J': '備考'},
    12: {'E': 'REFUSE', 'F': 'ENERC_KCAL', 'G': 'PROT-', 'H': 'FAT-', 'I': 'CHOCDF-', 'K': 'NACL_EQ', 'L': 'FIB-', 'M': 'ALC'},
    13: {'A': '01', 'B': '01088', 'D': 'こめ［水稲めし］精白米', 'E': '0', 'F': '156', 'G': '2.5', 'H': '(0.3)',
         'I': '37.1', 'K': 'Tr', 'J': '別名：めし', 'L': '1.5', 'M': '-'},
    14: {'A': '17', 'B': '17012', 'D': '食塩', 'E': '0', 'F': '0', 'G': '-', 'H': '-', 'I': '(0)', 'K': '99.5', 'L': '(0)', 'M': '-'},
    15: {'A': '01', 'B': '0108', 'D': 'not a food id'},
    16: {'A': '16', 'B': '16006', 'D': 'ビール 淡色', 'E': '0', 'F': '39', 'G': '0.3', 'H': '0', 'I': '3.1', 'K': '0', 'L': '0', 'M': '3.7'},
}
FOODS = {'A': {'kcal': 100, 'p': 10.0, 'f': 0.0, 'c': 20.0, 'salt': None},
         'B': {'kcal': 300, 'p': 0.0, 'f': 30.0, 'c': None, 'salt': 2.0}}


class MextReader(unittest.TestCase):
    def test_markers(self):
        for s, want in (('Tr', 0.0), ('(Tr)', 0.0), ('(1.2)', 1.2), ('-', None), ('', None), (' 3.5 ', 3.5), ('14.0†', 14.0)):
            self.assertEqual(lib.mext_num(s), want, s)
        with self.assertRaises(ValueError):   # an unknown marker fails the build instead of becoming None
            lib.mext_num('*')

    def test_xlsx_and_mext_rows(self):
        rows = lib.xlsx_rows(make_xlsx(MEXT_FIXTURE), '表全体')
        self.assertEqual(rows[13][3], 'こめ［水稲めし］精白米')       # furigana skipped
        recs = lib.mext_rows(make_xlsx(MEXT_FIXTURE))
        self.assertEqual([r['id'] for r in recs], ['01088', '17012', '16006'])   # 4-digit id row ignored
        self.assertEqual(recs[0]['note'], '別名：めし')
        foods = lib.mext_foods(recs)
        self.assertEqual(foods['01088'], {'name': 'こめ［水稲めし］精白米', 'kcal': 156.0, 'p': 2.5, 'f': 0.3,
                                          'c': 37.1, 'salt': 0.0, 'fib': 1.5, 'alc': None})
        # fibre (FIB-, 食物繊維総量) and alcohol (ALC): the beer's alcohol, salt's '(0)' fibre a zero
        self.assertEqual([foods['16006']['fib'], foods['16006']['alc'], foods['17012']['fib']], [0.0, 3.7, 0.0])
        self.assertIsNone(foods['17012']['p'])
        self.assertEqual(foods['17012']['c'], 0.0)

    def test_missing_header_code_fails(self):
        bad = {**MEXT_FIXTURE, 12: {'F': 'ENERC_KCAL'}}
        with self.assertRaises(SystemExit):
            lib.mext_rows(make_xlsx(bad))


class Numbers(unittest.TestCase):
    def test_rounding_half_up(self):
        self.assertEqual(lib.r1(0.05), 0.1)
        self.assertEqual(lib.r1(0.15), 0.2)
        self.assertEqual(lib.r1(2.25), 2.3)
        self.assertIsNone(lib.r1(None))
        self.assertEqual(lib.kcal_int(155.5), 156)
        self.assertEqual(lib.kcal_int(154.5), 155)
        self.assertEqual(lib.kcal_int(154.49), 154)

    def test_per100(self):
        per, total = lib.per100([('A', 100), ('B', 50), ('water', 50)], FOODS)
        self.assertEqual(total, 200)
        self.assertAlmostEqual(per['kcal'], (100 + 150) / 2)
        self.assertAlmostEqual(per['f'], 7.5)
        self.assertAlmostEqual(per['c'], 10.0)        # B lacks c: counted as 0 (pinned rule)
        self.assertAlmostEqual(per['salt'], 0.5)
        per, _ = lib.per100([('A', 100)], FOODS)
        self.assertIsNone(per['salt'])                # every ingredient lacks it -> None
        per, _ = lib.per100([('water', 100)], FOODS)
        self.assertEqual(per['kcal'], 0.0)

    def test_fibre_and_alcohol(self):
        foods = {'A': dict(FOODS['A'], fib=2.0, alc=None), 'B': dict(FOODS['B'], fib=None, alc=10.0), 'C': dict(FOODS['A'])}
        per, _ = lib.per100([('A', 100), ('B', 50), ('water', 50)], foods)
        self.assertEqual([per['fib'], per['alc']], [1.0, 2.5])   # one lacking counts as 0, as the others
        per, _ = lib.per100([('C', 100)], foods)                  # no fibre or alcohol known at all (_typical.json's)
        self.assertEqual([per['fib'], per['alc']], [None, None])
        # an item has them only when known; the five always
        self.assertEqual(lib.nutrients({'kcal': 39.4, 'p': 0.3, 'f': 0, 'c': 3.14, 'salt': None, 'fib': None, 'alc': 3.66}),
                         {'kcal': 39, 'p': 0.3, 'f': 0.0, 'c': 3.1, 'salt': None, 'alc': 3.7})
        self.assertEqual(sorted(lib.nutrients({'kcal': 1, 'p': 1, 'f': 1, 'c': 1, 'salt': 1})), ['c', 'f', 'kcal', 'p', 'salt'])
        # alcohol only on a drink: a dish's or a seasoning's (みりん, 奈良漬) cooks off or is no drinking
        drink = lib.tidy({'id': 'x:1', 'name': 'ビール', 'cat': '酒', 'alc': 3.7})
        dish = lib.tidy({'id': 'x:2', 'name': '肉じゃが', 'cat': '主菜', 'alc': 0.4, 'fib': 1.2})
        self.assertEqual([drink.get('alc'), dish.get('alc'), dish.get('fib')], [3.7, None, 1.2])

    def test_split_portion_and_kana(self):
        self.assertEqual(lib.split_portion('焼き餃子（5個）'), ('焼き餃子', '5個'))
        self.assertEqual(lib.split_portion('カレー（甘口）'), ('カレー（甘口）', None))
        self.assertEqual(lib.kata2hira('カレーライス'), 'かれーらいす')


class Categories(unittest.TestCase):
    def test_cat_guess(self):
        for name, cat in (('肉団子', '主菜'), ('みたらし団子', '菓子・デザート'), ('さわらのゆずしょうゆかけ', '主菜'),
                          ('ちりめんじゃこと小松菜の炒め物', '副菜'), ('ちらし寿司', '寿司'), ('親子丼', '丼・定食'),
                          ('わかめスープ', '汁物'), ('ひじき入りぎょうざ', '主菜'), ('ゼリーフライ', '副菜'),
                          ('もち入りすき焼き風煮', '主菜'), ('ベビーチーズ', '乳製品'), ('チョコクリーム', '菓子・デザート'),
                          ('マンハッタンクラムチャウダー', '汁物'), ('沢煮椀', '汁物'), ('チーズタッカルビ', '主菜'),
                          ('ツナサラダ', '副菜'), ('飲むヨーグルト', '乳製品'), ('クロワッサン', 'パン'), ('豚肉の漬け焼き', '主菜')):
            self.assertEqual(lib.cat_guess(name), cat, name)

    def test_school_components(self):
        self.assertEqual(build.component_name('豚丼（しらたき・小松菜）'), ('豚丼の具（しらたき・小松菜）', '主菜'))
        self.assertEqual(build.component_name('チキンカレーライス'), ('チキンカレー（ごはんなし）', '主菜'))
        self.assertEqual(build.component_name('夏野菜カレー（トマト入り）'), ('夏野菜カレー（トマト入り・ごはんなし）', '主菜'))
        self.assertEqual(build.component_name('なめこうどん汁'), ('なめこうどん汁（めんなし）', '汁物'))
        self.assertEqual(build.component_name('皿うどん'), ('皿うどん（めんなし）', '主菜'))
        self.assertEqual(build.component_name('カレー南蛮'), ('カレー南蛮（めんなし）', '汁物'))
        self.assertEqual(build.component_name('サンマーメン'), ('サンマーメン（めんなし）', '汁物'))
        self.assertIsNone(build.component_name('チキン南蛮'))
        self.assertIsNone(build.component_name('肉じゃが'))

    def test_staple_rows(self):
        raw_rice = {'g': '100', 'kcal': '359', 'p': '6.1', 'f': '0.9', 'c': ''}
        cooked = {'g': '150', 'kcal': '234', 'p': '3.8', 'f': '0.5', 'c': '55.7'}
        pork = {'g': '50', 'kcal': '100', 'p': '9', 'f': '7', 'c': '0.1'}
        self.assertTrue(build.is_dry_grain(raw_rice))
        self.assertTrue(build.is_dry_grain({'g': '100', 'kcal': '295', 'p': '6', 'f': '1', 'c': ''}))   # 山菜おこわ premix
        self.assertFalse(build.is_dry_grain(cooked))
        self.assertFalse(build.is_dry_grain(pork))
        gain = {'01083': 1.1, '01041': 1.4, '01043': 1.7, '01129': 1.6, '01050': 1.5, '01063': 1.2}
        self.assertEqual(build.dry_gain('地粉うどん', gain), 1.4)
        self.assertEqual(build.dry_gain('たけのこごはん', gain), 1.1)


class SchoolLunch(unittest.TestCase):
    """build_lunch on an inline CSV: staple = MEXT group 01 code; adult portions of soups and toppings."""
    HEAD = '料理名称,料理ID,提供年月日,分量,エネルギー,たんぱく質,脂質,炭水化物,食塩相当量,食品番号\n'
    ROWS = [('ハヤシライス', 1, [('11030', 40, 80, 8, 6, 0), ('06153', 50, 16, 0.5, 0, 4), ('17052', 15, 75, 1, 5, 7)]),
            ('担担ビーフン', 2, [('01115', 6, 21, 0.4, 0.1, 4.8), ('11163', 10, 21, 2, 1.5, 0), ('99999', 100, 0, 0, 0, 0)]),
            ('タンメンス－プ', 3, [('06061', 80, 18, 1, 0, 4), ('11130', 30, 50, 6, 3, 0), ('99999', 170, 0, 0, 0, 0)]),
            ('わかめごはん', 4, [('01083', 80, 274, 5, 1, 62), ('09045', 2, 3, 0.3, 0, 1)])]

    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        path = os.path.join(self.tmp, 'lunch.csv')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(self.HEAD + ''.join('%s,%d,2026-01-01,%s,%s,%s,%s,%s,0.5,%s\n' % (n, lid, g, k, p_, f_, c, fid)
                                        for n, lid, rows in self.ROWS for fid, g, k, p_, f_, c in rows))
        build.LUNCH['t'] = dict(build.LUNCH['toyonaka'], files=lambda: [path], level=lambda _: (None, 160.0))
        # 5 matched 主菜 at adult/school 2.0 give a measured 主菜 ratio that must not reach a 300 g serving
        refs = [{'id': 'dishes:m%d' % i, 'name': '主%d' % i, 'cat': '主菜', 'kcal': 150,
                 'portions': [{'label': '1人前', 'g': 120}]} for i in range(5)]
        refs.append({'id': 'dishes:hayashi', 'name': 'ハヤシライス', 'cat': '丼・定食', 'kcal': 140,
                     'portions': [{'label': '1人前', 'g': 500}]})
        docs = {'dishes': {'items': refs}, 'eatout': {'items': []}, 'kurume': {'items': []}, 'mext': {'items': []}}

        class FakeBuilder:
            cook_gain, reports = {'01083': 1.1}, {}
            get = staticmethod(docs.__getitem__)
        self.b = FakeBuilder()

    def tearDown(self):
        del build.LUNCH['t']
        shutil.rmtree(self.tmp)

    def test_components_and_portions(self):
        items = {it['name']: it for it in build.build_lunch(self.b, 't')['items']}
        self.assertNotIn('ハヤシライス', items)                       # roux is not rice: sauce only, not matched to 500 g
        self.assertEqual([p['g'] for p in items['ハヤシ（ごはんなし）']['portions']], [140, 105])
        self.assertIn('担担ビーフン', items)                          # 6 g dry noodles (group 01) = a complete dish
        soup = items['タンメンスープ（めんなし）']                    # ス－プ normalised, no noodles, 汁物
        self.assertEqual((soup['cat'], [p['g'] for p in soup['portions']]), ('汁物', [360, 280]))
        self.assertEqual(items['わかめごはん']['portions'][0]['g'], 200)   # 主食 without own ratio: 1.2 x 168 g

        main = [{'id': 't:%d' % i, 'name': '主%d' % i, 'cat': '主菜', 'portions': [{'label': 's', 'g': 60}]} for i in range(5)]
        big = {'id': 't:big', 'name': 'ポークカレー（ごはんなし）', 'cat': '主菜', 'portions': [{'label': 's', 'g': 300}]}
        build.adult_portions(self.b, 't', main + [big])
        self.assertEqual(self.b.reports['t_adult_ratio']['主菜'], (2.0, 5))
        self.assertEqual(big['portions'][0]['g'], 390)                 # capped at 1.3x, not 600 g


class LunchBlanks(unittest.TestCase):
    """build.blank_null: a blank cell is a zero only where the row needs none."""
    @staticmethod
    def rows(*rs):
        return [dict(zip(('kcal', 'p', 'f', 'c', 'salt'), r)) for r in rs]

    def tot(self, rs):
        t = {k: sum(lib.fnum(r[k], 0.0) for r in rs) for k in ('kcal', 'p', 'f', 'c', 'salt')}
        build.blank_null(rs, t)
        return t

    def test_blank_null(self):
        saikyo = self.tot(self.rows(('66', '7.3', '3.6', '', '')))             # fish in miso, both cells blank
        self.assertEqual((saikyo['salt'], saikyo['c']), (None, 0.0))           # its energy is P and F: C 0 stands
        fry = self.tot(self.rows(('105', '5', '5.9', '', ''), ('45', '', '5', '', '')))
        self.assertEqual((fry['salt'], fry['c']), (None, None))                 # breaded: energy P and F don't explain
        miso = self.tot(self.rows(('30', '2', '1', '3', '1.2'), ('20', '2', '1.2', '0.5', '')))
        self.assertEqual(miso['salt'], 1.2)                                     # the tofu's blank: the rest is counted
        oil = self.tot(self.rows(('40', '3', '1', '6', '0.5'), ('45', '', '5', '', '')))
        self.assertEqual((oil['salt'], oil['c']), (0.5, 6.0))                   # oil needs neither
        typo = self.tot(self.rows(('47', '14.6', '1.8', '0.6', '0.4')))          # P alone > its energy
        self.assertEqual((typo['p'], typo['f'], typo['c'], typo['salt']), (None, None, None, 0.4))

    def test_blank_fibre(self):
        def fib(*rs):   # (kcal, 食品ID, 食物繊維)
            rows = [{'kcal': k, 'p': '1', 'f': '1', 'c': '1', 'salt': '0.1', 'fid': fid, 'fib': f} for k, fid, f in rs]
            t = {k: sum(lib.fnum(r[k], 0.0) for r in rows) for k in ('kcal', 'p', 'f', 'c', 'salt', 'fib')}
            build.blank_null(rows, t)
            return t['fib']
        self.assertEqual([
            fib(('100', '11220', ''), ('30', '06263', '2.5')),   # the chicken's blank: none (Kumagaya leaves meat blank)
            fib(('30', '11220', ''), ('100', '06263', '')),      # the broccoli's blank: unknown
            fib(('100', '01088', '1.5'), ('5', '06263', '')),    # a small plant row's blank: counted as none
            fib(('100', '11220', ''), ('20', '17012', '')),      # every cell blank (no column): unknown
        ], [2.5, None, 1.5, None])


class MaffAmounts(unittest.TestCase):
    def test_grams(self):
        soy, sugar, carrot, rice = MI.match('しょうゆ'), MI.match('砂糖'), MI.match('にんじん'), MI.match('米')
        for text, ent, want in (('大さじ1と1/2', soy, 27.0), ('大さじ1と1/2', sugar, 13.5), ('小さじ2', soy, 12.0),
                                ('1カップ', soy, 230.0), ('100g', carrot, 100.0), ('1/2本(約80g)', carrot, 80.0),
                                ('卵2個分', None, 100.0), ('2〜3個', carrot, 375.0), ('1・1/3', carrot, 200.0),
                                ('少々', soy, 0.5), ('適量', soy, 0.0), ('1合', rice, 150.0), ('ひとつまみ', soy, 1.0)):
            self.assertEqual(MI.grams(text, ent), want, text)
        self.assertIsNone(MI.grams('1・1/3', soy))
        pork = MI.match('豚肉')
        for text, want in (('16枚（1枚30g）', 480.0), ('4本（1本／約250～350g）', 1200.0), ('2枚(100g)', 100.0),
                           ('2個(1個約100~120g)', 220.0), ('約250～350g', 300.0)):   # a count x one's weight; a range's middle
            self.assertEqual(MI.grams(text, pork), want, text)
        self.assertIsNone(MI.grams('3cm厚さ8個', carrot))                # slices, not whole pieces
        self.assertEqual(MI.match('濃口しょうゆ')['id'], '17007')
        self.assertEqual(MI.match('笹の葉')['flag'], 'nonfood')


class Recipes(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        os.makedirs(os.path.join(self.tmp, 'dishes'))
        os.makedirs(os.path.join(self.tmp, 'eatout'))
        self._json('popular.json', {'dishes': {'3': ['定食']}, 'eatout': {}})
        self.saved = build.SRC, lib.SRC
        build.SRC = lib.SRC = self.tmp

        class FakeBuilder:
            foods = FOODS
        self.b = FakeBuilder()

    def tearDown(self):
        build.SRC, lib.SRC = self.saved
        shutil.rmtree(self.tmp)

    def _json(self, rel, obj):
        with open(os.path.join(self.tmp, rel), 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False)

    def test_dishes_include(self):
        self._json('dishes/a.json', {'dishes': [
            {'id': 'side', 'name': '小鉢', 'cat': '副菜', 'ing': [['A', 50]]},
            {'id': 'set', 'name': '定食', 'cat': '丼・定食', 'ing': [['B', 100], ['@side', 2]], 'pieces': 3}]})
        doc = build.build_dishes(self.b)
        it = doc['items'][1]
        self.assertEqual(it['id'], 'dishes:set')
        self.assertEqual(it['pop'], 3)
        self.assertEqual(it['kcal'], 200)                 # (300 + 100) kcal / 200 g
        self.assertEqual(it['portions'], [{'label': '1人前', 'g': 200}, {'label': '1個', 'g': 66.7}])
        self.assertEqual(lib.validate(doc), [])

    def test_dishes_include_cycle(self):
        self._json('dishes/a.json', {'dishes': [{'id': 'x', 'name': 'X', 'cat': '副菜', 'ing': [['@y', 1]]},
                                                {'id': 'y', 'name': 'Y', 'cat': '副菜', 'ing': [['@x', 1]]}]})
        with self.assertRaises(SystemExit):
            build.build_dishes(self.b)

    def test_eatout_components(self):
        self._json('eatout/_components.json', {'components': {'rice': {'ing': [['A', 100]]}}})
        self._json('eatout/a.json', {'items': [{'key': 'don', 'name': '丼', 'cat': '丼・定食',
                                                'ing': [['@rice', 2], ['water', 100]], 'portions': [['大盛', 1.5]]}]})
        it = build.build_eatout(self.b)['items'][0]
        self.assertEqual(it['kcal'], 67)                  # 200 kcal / 300 g
        self.assertEqual([p['g'] for p in it['portions']], [300, 450])
        self.assertIn('水・氷 100g', it['note'])
        self._json('eatout/a.json', {'items': [{'key': 'x', 'name': 'X', 'cat': '主菜', 'ing': [['@nope', 1]]}]})
        with self.assertRaises(SystemExit):
            build.build_eatout(self.b)

    def test_eatout_typical_values(self):
        self._json('eatout/_components.json', {'components': {}})
        self._json('eatout/_typical.json', {'foods': {'whey': {'name': 'W', 'kcal': 400, 'p': 80.0, 'f': 5.0, 'c': 10.0,
                                                                 'salt': 1.0, 'note': '目安'}}})
        self._json('eatout/a.json', {'items': [{'key': 'shake', 'name': 'シェイク', 'cat': '飲料',
                                                'ing': [['typ:whey', 30], ['A', 70]]}]})
        it = build.build_eatout(self.b)['items'][0]
        self.assertEqual((it['kcal'], it['p']), (190, 31.0))      # (120 + 70) kcal / 100 g
        self.assertTrue(it['note'].startswith('目安。') and it['note'].endswith(build.TYPICAL_NOTE))
        self._json('eatout/_typical.json', {'foods': {'whey': {'name': 'W', 'kcal': 400, 'note': 'x'}}})
        with self.assertRaises(SystemExit):                        # every nutrient is required
            build.build_eatout(self.b)


def item(**kw):
    it = {'id': 'mext:00001', 'name': '米', 'cat': '主食', 'kcal': 100, 'p': 1.0, 'f': 1.0, 'c': 1.0, 'salt': None,
          'portions': [{'label': '1杯', 'g': 150}]}
    it.update(kw)
    return it


class Validation(unittest.TestCase):
    def doc(self, *items):
        return {'source': 'mext', 'label': 'L', 'attribution': 'A', 'license': 'X', 'url': 'u', 'items': list(items)}

    def test_valid(self):
        self.assertEqual(lib.validate(self.doc(item())), [])

    def test_each_rule_one_error(self):
        for bad in (item(cat='肉料理'), item(id='off:1'), item(kcal=1.5), item(kcal=True), item(p='1'),
                    item(portions=[{'label': '', 'g': 1}]), item(portions=[]), item(aliases=['米']), item(pop=4),
                    item(ingredients=[]), item(name=''), item(jan='123'), item(fib=100.5), item(fib=None), item(alc='1', cat='酒'),
                    item(alc=1.0), item(desc=''), item(desc='あ' * 41), item(desc=['x']), item(gloss=''), item(gloss='あ' * 21),
                    item(gloss='西洋ねぎ', desc='西洋ねぎとも呼ぶねぎ'), item(desc='ふつうの' + item()['name'])):   # fibre and alcohol: absent when unknown, 0-100; alcohol on a drink only
            self.assertEqual(len(lib.validate(self.doc(bad))), 1, bad)
        self.assertEqual(len(lib.validate(self.doc(item(), item()))), 1)          # duplicate id
        self.assertIn('missing url', lib.validate(dict(self.doc(item()), url='')))

    def test_shard(self):
        it = item(id='off:4901234567894', jan='4901234567894')
        self.assertEqual(lib.validate({'4901234567894': it}, 'shard'), [])
        self.assertEqual(len(lib.validate({'4901234567890': it}, 'shard')), 1)

    def test_tidy(self):
        self.assertEqual(lib.tidy({'name': 'a', 'aliases': ['a', 'b', 'b', '']}), {'name': 'a', 'aliases': ['b']})
        self.assertEqual(lib.tidy({'name': 'a', 'aliases': ['a']}), {'name': 'a'})


class Readings(unittest.TestCase):
    def test_recipe_title_reading(self):
        f = recipes_text.split_title
        self.assertEqual(f('えびみそ汁（えびみそしる）'), ('えびみそ汁', 'えびみそしる'))
        self.assertEqual(f('味噌汁（麦味噌）（みそしる（むぎみそ)）'), ('味噌汁（麦味噌）', 'みそしる・むぎみそ'))
        self.assertEqual(f('かて飯'), ('かて飯', ''))
        self.assertEqual(f('煮物（大根（生））'), ('煮物（大根（生））', ''))   # a nested bracket that isn't kana stays

    def test_product_reading(self):
        self.assertEqual(lib.drop_reading('豆板醤（トウバンジャン）'), ('豆板醤', ['トウバンジャン']))
        self.assertEqual(lib.drop_reading('焼豚(スライス)'), ('焼豚(スライス)', []))


class SameName(unittest.TestCase):
    def test_qualified_by_what_differs(self):
        b = build.Builder()
        b.docs = {'dishes': {'items': [{'id': 'dishes:a', 'name': 'エビマヨ', 'kcal': 200},
                                       {'id': 'dishes:b', 'name': '冷奴', 'kcal': 57}]}}
        eat = {'items': [{'id': 'eatout:a', 'name': 'エビマヨ', 'kcal': 258}, {'id': 'eatout:b', 'name': '冷奴', 'kcal': 57},
                         {'id': 'eatout:c', 'name': '焼き餃子（6個）', 'kcal': 204}]}
        b.docs['eatout'] = eat
        b.docs['dishes']['items'].append({'id': 'dishes:c', 'name': '焼き餃子（6個）', 'kcal': 168})
        b.qualify('eatout', eat)
        self.assertEqual([it['name'] for it in eat['items']], ['エビマヨ（お店）', '冷奴', '焼き餃子（6個・お店）'])
        maff = {'items': [{'id': 'maff_kyodo:a', 'name': '雑煮', 'kcal': 96, 'full': '雑煮（愛知県）'},
                          {'id': 'maff_kyodo:b', 'name': '雑煮', 'kcal': 44, 'full': '雑煮（三重県）'},
                          {'id': 'maff_kyodo:c', 'name': '冷奴', 'kcal': 57, 'full': '冷奴／ひややっこ（京都府）'}]}
        b.qualify('maff_kyodo', maff)
        self.assertEqual([it['name'] for it in maff['items']], ['雑煮（愛知県）', '雑煮（三重県）', '冷奴（京都府）'])

    def test_rare_forms(self):
        self.assertTrue(mext_names.RARE.search('キャベツ カット 常法洗浄'))
        self.assertTrue(mext_names.RARE.search('卵 素揚げ'))
        self.assertFalse(mext_names.RARE.search('キャベツ 生'))
        self.assertTrue(build.STORY.search('「かさこじぞう」の恩返し味噌汁'))


class Barcodes(unittest.TestCase):
    def test_norm_and_shard(self):
        self.assertEqual(lib.norm_jan('4901234567894'), '4901234567894')
        self.assertEqual(lib.norm_jan('012345678905'), '0012345678905')     # UPC-A padded
        self.assertEqual(lib.norm_jan('00012345678905'), '0012345678905')   # GTIN-14 with leading 0
        self.assertEqual(lib.norm_jan('49012347'), '49012347')              # EAN-8 kept
        for bad in ('14901234567891', '0123456', '49x1234567894', '', None, '4901234567890', '49012345'):  # bad check digit
            self.assertIsNone(lib.norm_jan(bad))
        self.assertEqual(lib.shard_key('4901234567894'), '894')
        self.assertEqual(lib.shard_key(lib.norm_jan('012345678905')), lib.shard_key('012345678905'))
        self.assertEqual(lib.shard_key('49012347'), '347')


class OffPlausibility(unittest.TestCase):
    def check(self, *args, **kw):
        return off.plausible(*args, **kw)

    def test_ok(self):
        self.assertEqual(self.check(250, 10, 10, 30, 1.0, 'パン', '食パン'), ((250, 10, 10, 30, 1.0), []))

    def test_kj_as_kcal(self):
        vals, flags = self.check(4.184 * 300, 10, 10, 42.5, 0.5, '菓子・デザート', 'クッキー')
        self.assertEqual(flags, ['kj_as_kcal'])
        self.assertAlmostEqual(vals[0], 300)

    def test_ranges(self):
        self.assertEqual(self.check(950, 0, 100, 0, 0, '油脂', 'オイル')[1], [])
        self.assertIsNone(self.check(1200, 10, 10, 10, 0)[0])
        vals, flags = self.check(300, 10, 10, 120, 0)            # c > 100: only c nulled
        self.assertEqual((vals[3], flags), (None, ['macro_range']))
        vals, flags = self.check(500, 30, 30, 60, 1)             # P+F+C > 105: macros nulled, kcal kept
        self.assertEqual((vals[:4], flags), ((500, None, None, None), ['pfc_sum']))

    def test_atwater(self):
        self.assertIsNone(self.check(45, 10, 15, 20, 1)[0])                       # gross: per-serving typo, dropped
        vals, flags = self.check(150, 22.9, 1.2, 62.6, 1.6, '魚介', 'カマの照焼')   # moderate: macros nulled
        self.assertEqual((vals[1:4], flags), ((None, None, None), ['atwater']))
        self.assertEqual(self.check(0, 0, 0, 11, 0, 'その他', 'スイートゼロ')[1], [])   # sweetener exempt
        self.assertEqual(self.check(140, 20, 5, 39, 1, '海藻', 'カットわかめ')[1], [])  # fibre exempt
        self.assertEqual(self.check(400, 0, 0, 10, 0, '酒', '梅酒')[1], [])

    def test_name_category_and_snacks(self):
        self.assertEqual(off.pick_cat([], 'サワークリーム ポテトチップス', 564), '菓子・デザート')
        self.assertEqual(off.pick_cat([], 'レモンサワー', 45), '酒')
        self.assertIsNone(self.check(45, 5, 5, 20, 0, '菓子・デザート', 'ポテトチップス')[0])   # energy itself wrong
        for name, cat in (('さば水煮', '魚介'), ('かに入り茶碗蒸し', '魚介'), ('出汁香る鶏の唐揚げ', '肉'), ('パンプキンサラダ', '野菜'),
                          ('サワードウブレッド', 'パン'), ('水ようかん', '菓子・デザート'), ('だし巻き玉子', '卵'),
                          ('春巻き', '主菜'), ('トロたく巻', '寿司'), ('チーズ巻き', '乳製品'), ('緑茶', '飲料')):
            self.assertEqual(off.pick_cat([], name, 200), cat, name)   # a keyword inside another word is no keyword

    def test_alcohol_and_creatine(self):
        self.assertEqual(self.check(0, 0, 0, 1, 0, 'その他', 'ストロングレモン'), (None, ['alcohol_zero']))
        self.assertEqual(self.check(0, 0, 0, 0, 0, '飲料', 'ノンアルコール ビールテイスト')[1], [])
        self.assertEqual(self.check(360, 90, 0, 0, 0, 'その他', 'クレアチンパウダー'), ((0, 0.0, 0, 0, 0), ['creatine']))
        self.assertEqual(self.check(385, 85.2, 0.1, 12.5, 1.3, 'その他', 'クレアルカリン レモン味')[0][:2], (4 * 12.5 + 0.9, 0.0))
        self.assertEqual(self.check(386, 69.1, 5.4, 15.1, 0.8, 'その他', 'ホエイプロテイン HMB &クレアチン')[1], [])

    def test_salt_allow_list(self):
        for name, salt in (('柚子こしょう', 18.0), ('かのや 濃ゆ口', 14.65), ('うすくち白', 18.4), ('こいくち醤油', 14.5)):
            self.assertEqual(self.check(100, 5, 1, 10, salt, 'その他', name)[1], [], name)
        self.assertEqual(self.check(100, 5, 1, 10, 15, 'その他', 'クッキー')[1], ['salt_cap'])

    def test_salt(self):
        self.assertEqual(self.check(69, 3.4, 3.9, 5, 3.34, '乳製品', '牛乳'), ((69, 3.4, 3.9, 5, None), ['salt_cap']))
        self.assertEqual(self.check(186, 23, 10, 0, 7.9, '肉', '鶏胸肉')[1], ['salt_cap'])
        self.assertEqual(self.check(100, 5, 1, 10, 30, '海藻', '塩昆布')[1], [])      # allow-listed salty food
        self.assertEqual(self.check(100, 5, 1, 10, 70, '海藻', '塩昆布')[1], ['salt>60'])
        self.assertEqual(self.check(100, 5, 1, 10, 70, '調味料', '食塩')[1], [])

    def test_protein_salt(self):
        self.assertEqual(self.check(380, 80, 2, 8, 4.2, 'その他', 'シンプルプロテイン バナナ風味')[1], ['salt_protein'])
        self.assertEqual(self.check(380, 80, 2, 8, 2.8, '飲料', 'ソイプロテイン 抹茶風味')[1], [])   # powder, not a drink
        self.assertEqual(self.check(478, 41.7, 22, 30, 5.7, '主食', 'プロテインバー シリアルチョコ')[1], ['salt_protein'])
        self.assertEqual(self.check(40, 5, 0, 5, 6.3, 'その他', 'in PROTEIN マスカット')[1], ['salt_protein'])
        self.assertEqual(self.check(360, 60, 5, 15, 7.5, '汁物', 'プロテインスープ')[1], [])          # soup: normal rules
        self.assertEqual(self.check(390, 81, 2, 5, 3.9, 'その他', 'ピープロテイン')[1], [])            # pea: salty

    def test_fried_chicken_per_piece(self):
        self.assertEqual(self.check(45, 2.9, 3.1, 1.5, 0.3, '肉', 'からあげクンREGULAR'), (None, ['fried_low']))
        self.assertEqual(self.check(256, 16.4, 17.6, 8, 2, '肉', 'でからあげクン')[1], [])
        for name in ('ひざ軟骨唐揚用味付', 'たこ唐揚げ', 'からあげの素'):
            self.assertIsNotNone(self.check(100, 12, 1, 10, 1.5, '肉', name)[0], name)


class Grouping(unittest.TestCase):
    def test_name_key(self):
        self.assertEqual(lib.name_key('鶏の唐揚げ（2個）'), lib.name_key('とりのから揚げ'))
        self.assertEqual(lib.name_key('味噌汁'), lib.name_key('みそ汁'))
        self.assertNotEqual(lib.name_key('カレー（ごはんなし）'), lib.name_key('カレー'))

    def test_group_by_name_alias_link(self):
        entries = [('dishes', {'name': 'チャーハン', 'aliases': ['炒飯', '焼きめし']}), ('kurume', {'name': '炒飯'}),
                   ('toyonaka', {'name': 'チャーハン（中）'}), ('kumagaya', {'name': '焼きめし'}),
                   ('kumagaya', {'name': 'ラーメン'}), ('toyonaka', {'name': 'らーめん'})]
        groups = lib.group_by_name(entries, ('dishes',))
        self.assertEqual(sorted(sorted(g) for g in groups), [[0, 1, 2, 3], [4, 5]])

    def test_alias_link_skips_bracketed_and_broader_aliases(self):
        entries = [('eatout', {'name': 'サーモンいくら丼', 'aliases': ['親子丼（海鮮）']}), ('dishes', {'name': '親子丼'}),
                   ('eatout', {'name': 'キャラメルラテ', 'aliases': ['キャラメル']}), ('kurume', {'name': 'キャラメル'})]
        self.assertEqual(sorted(lib.group_by_name(entries, ('dishes', 'eatout'))), [[0], [1], [2], [3]])

    def test_verify_group(self):
        g = build.verify_group
        self.assertIsNone(g([('mext', 'mext:1', 139), ('jbfd', None, 180)], 139))        # 30 % apart: jbfd left out
        self.assertEqual(g([('kurume', 'k', 168), ('mext', 'm', 156)]), (2, {'kurume': 168, 'mext': 156}, ['k', 'm']))
        # our recipe sets are one family; the disagreeing city item is left out of the group
        self.assertEqual(g([('dishes', 'd', 100), ('eatout', 'e', 105), ('maff_kyodo', 'f', 98), ('toyonaka', 't', 200)]),
                         (1, {'dishes': 100, 'eatout': 105, 'maff_kyodo': 98}, ['d', 'e', 'f']))
        self.assertEqual(g([('kurume', 'k', 17), ('toyonaka', 't', 27)])[0], 1)          # agree (10 kcal) but 1.6x apart
        n, kcal, ids = g([('kurume', 'k', 40), ('toyonaka', 't1', 48), ('toyonaka', 't2', 120)])
        self.assertEqual((n, kcal, ids), (2, {'kurume': 40, 'toyonaka': 48}, ['k', 't1']))   # own value = own kcal

    def test_agree(self):
        self.assertTrue(lib.agree('kcal', 115, 100))
        self.assertFalse(lib.agree('kcal', 116, 100))
        self.assertTrue(lib.agree('kcal', 18, 10))       # 10 kcal floor
        self.assertTrue(lib.agree('salt', 0.3, 0.0))
        self.assertIsNone(lib.agree('p', None, 1))


class VariantGroups(unittest.TestCase):
    def test_groups(self):
        def it(i, full, pop=None):
            return {'id': 'mext:%d' % i, 'full': full, **({'pop': pop} if pop else {})}
        items = [it(1, 'ぶた ロース 脂身つき 生', 3), it(2, 'ぶた ロース 脂身つき 焼き', 1), it(3, 'ぶた ロース 脂身つき ゆで'),
                 it(4, 'スパゲッティ 乾', 2), it(5, 'スパゲッティ ゆで', 3),
                 it(6, 'グリンピース 冷凍'), it(7, 'グリンピース 冷凍 ゆで'),            # the frozen one has no state word
                 it(8, 'あじ 生'), it(9, 'あじ フライ'),                                 # fried: no state, a row of its own
                 it(10, 'めん 乾（添付調味料等を含むもの）'), it(11, 'めん ゆで'),        # a state with a note: none
                 it(12, 'えび 生'), it(13, 'えび ゆで'), it(14, 'さけ 焼き'), it(15, 'さけ 焼き')]  # two of one state: none
        mext_names.variant_groups(items)
        got = {i['id']: (i.get('vg'), i.get('st')) for i in items}
        self.assertEqual(got['mext:1'], ('mext:1', '生'))
        self.assertEqual(got['mext:2'], ('mext:1', '焼き'))
        self.assertEqual(got['mext:3'], ('mext:1', 'ゆで'))
        self.assertEqual([got['mext:4'], got['mext:5']], [('mext:5', '乾'), ('mext:5', 'ゆで')])  # pop picks ゆで
        self.assertEqual([got['mext:12'], got['mext:13']], [('mext:12', '生'), ('mext:12', 'ゆで')])  # ties: 生
        for i in (6, 7, 8, 9, 10, 11, 14, 15):
            self.assertEqual(got['mext:%d' % i], (None, None), i)
        self.assertEqual(lib.validate({**{k: 'x' for k in lib.META_KEYS}, 'source': 'mext', 'items': [
            {'id': 'mext:1', 'name': '豚ロース', 'cat': '肉', 'kcal': 1, 'p': 1, 'f': 1, 'c': 1, 'salt': 0, 'vg': 'mext:1', 'st': '生'}]}), [])


class Descriptions(unittest.TestCase):
    """data_src/descriptions.json: the 「これは…」 line of a food or dish, `desc` on the item."""
    SRC2 = ['mext:06109', 'wp:芋茎']

    def test_mext_key(self):
        k = build.mext_desc_key
        self.assertEqual(k('10', '＜魚類＞（さけ・ます類）しろさけ　イクラ'), ['10', 'しろさけ', 'イクラ'])
        self.assertEqual(k('01', 'こむぎ　［ふ類］　焼きふ　釜焼きふ'), ['01', 'こむぎ', '［ふ類］', '焼きふ', '釜焼きふ'])
        self.assertEqual(k('06', '（なす類）　漬物　しば漬'), ['06', 'なす', '漬物', 'しば漬'])   # a generic token keeps its class

    def test_attach_longest_key_wildcard_and_blank(self):
        mk = {'1': ['06', 'ずいき', '生ずいき', '生'], '2': ['06', 'ずいき', '干しずいき', '乾'], '3': ['06', 'かぶ', '葉'],
              '4': ['01', 'こめ', '［水稲全かゆ］', '玄米'], '5': ['01', 'こめ', '［水稲めし］', '玄米']}
        its = [{'id': 'mext:' + i} for i in mk]
        lines = {'06 ずいき': 'さといもの葉柄', '06 ずいき 干しずいき': '干したもの', '06 かぶ': '',
                 '01 こめ ［水稲全かゆ］ *': 'かゆ', '01 こめ * 玄米': '玄米', '06 ごぼう': 'x'}
        self.assertEqual(build.attach_desc(its, lines, mk), ['06 ごぼう'])   # a key matching nothing is reported
        self.assertEqual([it.get('desc') for it in its], ['さといもの葉柄', '干したもの', None, 'かゆ', '玄米'])
        dishes = [{'id': 'dishes:shiraae'}, {'id': 'dishes:gyudon'}]
        self.assertEqual(build.attach_desc(dishes, {'shiraae': '豆腐の和え物'}), [])
        self.assertEqual([it.get('desc') for it in dishes], ['豆腐の和え物', None])

    def test_lines_need_two_sources_and_no_claims(self):
        ok = {'mext': {'06 ずいき': {'d': 'さといもの葉柄', 'src': self.SRC2}, '06 かぶ': {'d': '', 'src': []}},
              'dishes': {'shiraae': {'d': '豆腐の和え物', 'src': ['mext:18024', 'wp:白和え']}}, '_note': 'x'}
        self.assertEqual(build.desc_errors(ok), [])
        for bad in ({'mext': {'ずいき': {'d': 'a', 'src': self.SRC2}}},            # no group
                    {'mext': {'06 ずいき': {'d': 'a', 'src': ['wp:芋茎']}}},          # one source
                    {'mext': {'06 ずいき': {'d': 'a', 'src': ['wp:a', 'wp:a']}}},     # the same one twice
                    {'mext': {'06 ずいき': {'d': 'さといもの葉柄。', 'src': self.SRC2}}},
                    {'mext': {'06 ずいき': {'d': '血圧を下げる', 'src': self.SRC2}}},
                    {'mext': {'06 ずいき': {'d': 'あ' * 41, 'src': self.SRC2}}},
                    {'mext': {'06 ずいき': 'さといもの葉柄'}}, {'eatout2': {}}):
            self.assertEqual(len(build.desc_errors(bad)), 1, bad)

    def test_gloss_japanese_only(self):
        ok = {'mext': {'06 リーキ': {'d': '西洋ねぎ', 'src': ['mext:06308', 'wp:リーキ']}}}
        self.assertEqual(build.desc_errors(ok, 'gloss'), [])
        for g in ('leek', '西洋 ねぎ', 'あ' * 21):
            self.assertEqual(len(build.desc_errors({'mext': {'06 リーキ': {'d': g, 'src': ['a', 'b']}}}, 'gloss')), 1, g)
        its = [{'id': 'mext:1'}]
        build.attach_desc(its, {'06 リーキ': '西洋ねぎ'}, {'1': ['06', 'リーキ', 'りん茎葉', '生']}, 'gloss')
        self.assertEqual(its, [{'id': 'mext:1', 'gloss': '西洋ねぎ'}])

    def test_the_shipped_lines(self):
        """The real file: valid, every line within the limit and sourced (its keys are matched by the build)."""
        for field, (fname, _) in build.LINE_FILES.items():
            doc = lib.load_json(os.path.join(lib.SRC, fname))
            self.assertEqual(build.desc_errors(doc, field), [])
            self.assertEqual(sorted(t for t in doc if not t.startswith('_')), sorted(build.DESC_TARGETS))


if __name__ == '__main__':
    unittest.main()
