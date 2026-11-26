"""pmatch (food-data/images/pmatch.py): a packaged product's picture from its name, brand and OFF tags, with a
confidence. Inline fixtures and the committed products.txt only: no raw inputs, no network.
Run (from the repo root): python3 -I -m unittest discover -s food-data/scripts/tests
"""
import json, os, sys, unittest

IMAGES = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'images')
sys.path.insert(0, IMAGES)
import pmatch  # noqa: E402

FIXTURE = """
食パン = bread
~チーズ = cheese
ミルクティー = milktea
ベーグル = bagel
サンド = sandwich
~キャラメル = caramel
唐揚げ = karaage
唐揚げ @ いか|鯖|魚 = fishkaraage
唐揚げ @ そら豆 = -
ポテト = -
ポテトチップス = chips
tag en:soy-sauces = soy
brand ハリボー = gummy
コーラ = cola
kind sweet = karaage2
^たまねぎ|^玉ねぎ = onion
~ねぎ = leek
~えび = prawn
プリン = pudding
raw = prawn|leek|onion
maker 湖池屋 = sweet
"""
CATS = {'bread': 'パン', 'cheese': '乳製品', 'milktea': '飲料', 'bagel': 'パン', 'sandwich': '主食', 'caramel': '菓子・デザート',
        'karaage': '主菜', 'fishkaraage': '主菜', 'chips': '菓子・デザート', 'soy': '調味料', 'gummy': '菓子・デザート', 'cola': '飲料',
        'onion': '野菜', 'leek': '野菜', 'prawn': '魚介', 'pudding': '菓子・デザート'}


class RulesTest(unittest.TestCase):
    R = pmatch.Rules(FIXTURE, {}, CATS)

    def key(self, name, cat='その他', brand='', tags=()):
        k, conf, _ = self.R.match(name, cat, brand, tags)
        return k if conf >= pmatch.CONFIDENT else None

    def test_word_and_confidence(self):
        self.assertEqual(self.key('山型食パン'), 'bread')
        self.assertEqual(self.R.match('チーズ', '乳製品')[:2], ('cheese', 4))   # weak 2, whole token +1, category +1
        self.assertIsNone(self.key('燻製チーズ'))                              # weak, a prefix that names something: 2
        self.assertEqual(self.key('北海道チーズ'), 'cheese')                    # a place says nothing of the form

    def test_context(self):
        self.assertEqual(self.key('鯖の唐揚げ'), 'fishkaraage')
        self.assertIsNone(self.key('そら豆の唐揚げ'))
        self.assertEqual(self.key('若鶏の唐揚げ'), 'karaage')

    def test_kind(self):
        # a word of another kind beside it: the product's category picks (a bagel named milk tea is a bagel)
        self.assertEqual(self.key('ベーグル アールグレイミルクティー', 'パン'), 'bagel')
        self.assertIsNone(self.key('キャラメルサンド', '菓子・デザート'))

    def test_flavour_and_blocked_alias(self):
        self.assertEqual(self.key('ポテトチップス のり塩味'), 'chips')
        self.assertEqual(self.key('ポテトチップスうすしお味'), 'chips')
        self.assertIsNone(self.key('ベイクドポテト'))

    def test_tags_brands_and_brand_token(self):
        self.assertEqual(self.key('甘口', tags=['en:condiments', 'en:soy-sauces']), 'soy')
        self.assertEqual(self.key('ハリボー サワーハッピーコーラ', '飲料'), 'gummy')
        self.assertEqual(self.key('ブレッド屋 食パン', brand='ブレッド屋'), 'bread')
        self.assertEqual(self.R.kinds, {'karaage2': 'sweet'})

    def test_lookalike_guards(self):
        # a whole-token word hides the shorter words it ends with (玉ねぎ is no ねぎ)
        self.assertEqual(self.key('玉ねぎ'), 'onion')
        self.assertIsNone(self.key('ノンオイル玉ねぎ'))
        # a raw food's picture: not after a cooked mark, nor beside a dish
        self.assertEqual(self.key('えび', '魚介'), 'prawn')
        self.assertIsNone(self.key('ボイルえび', '魚介'))
        # a sweet maker's product never shows a meal
        self.assertEqual(self.key('ポテトチップス', '菓子・デザート', '湖池屋'), 'chips')
        self.assertIsNone(self.key('ベーグル', 'パン', '湖池屋'))
        # two foods joined, a flavour after a name it doesn't know, a prefix word inside a longer word
        self.assertIsNone(self.key('食パン&ベーグル'))
        self.assertEqual(self.key('キャラメル', '菓子・デザート'), 'caramel')
        self.assertIsNone(self.key('甘食 キャラメル'))
        self.assertIsNone(self.key('プリングルスうましお', '菓子・デザート'))
        # a mix named after a dish never shows the dish
        self.assertEqual(self.key('若鶏の唐揚げ'), 'karaage')
        self.assertIsNone(self.key('唐揚げの素'))


class ProductsTxtTest(unittest.TestCase):
    """The committed rules: every key a table row (a row not shipping, waiting for a re-roll or on its tile, gives its
    products the category tile: pack only maps products to shipped pictures), and the lookalike classes stay fixed."""
    table = {r['key'] for f in os.listdir(os.path.join(IMAGES, 'table')) if f.endswith('.json')
             for r in json.load(open(os.path.join(IMAGES, 'table', f), encoding='utf-8'))}
    R = pmatch.Rules(open(os.path.join(IMAGES, 'products.txt'), encoding='utf-8').read())

    def test_keys_are_rows(self):
        keys = {v[0] for v in self.R.words.values()} | set(self.R.tags.values()) | {k for _, k in self.R.brands} | \
            {k for rules in self.R.ctx.values() for _, k in rules} | set(self.R.kinds)
        self.assertEqual(sorted(k for k in keys if k and k not in self.table), [])

    def test_lookalikes(self):
        for name, want in [('鯖の竜田揚げ', 'jbfd-魚介の竜田揚げ'), ('いかの唐揚げ', 'jbfd-魚介の竜田揚げ'), ('そら豆の唐揚げ', None),
                           ('若鶏の竜田揚げ', 'toyonaka-117749'), ('北海道産 解凍ボイルほたて卵', None), ('するめいか照焼', None),
                           ('鶏の照焼', 'dishes-teriyaki-chicken'), ('ぶり照焼', 'dishes-buri-teriyaki'), ('生姜まんじゅう', 'mext-15033'),
                           ('青しそジュース', None), ('オレンジジュース', 'mext-07031'), ('とんがりコーン あっさり塩', 'mext-15102'),
                           ('クラフトシスコーン', 'mext-01137'), ('明太子パスタソース', 'dishes-tarako-spa'), ('やきそば弁当', 'mext-01060'),
                           ('贅沢ふかひれスープ', None), ('チキンと野菜のチーズクリームパスタ', None), ('鶏膝なんこつ旨塩焼', 'eatout-yakitori_nankotsu'),
                           ('かに風味つまみかまぼこ', 'mext-10376'), ('つけ麺用魚介豚骨', 'eatout-tsukemen'),
                           ('塩こんぶ', 'mext-09022'), ('宮崎マンゴーのたまご', None), ('スパゲッティ ナポリタン', 'dishes-napolitan'),
                           # round F6 (2026-11-25): a labelled sample's lookalikes
                           ('産直じゃがいものサラダ', 'dishes-potato-salad'), ('サラダえび', 'mext-10468'), ('紋甲いかそうめん', None),
                           ('九州の味 ごまとうふ', 'mext-02056'), ('プリン珈琲ゼリー', 'mext-15088'), ('すみれ味噌スープ', None),
                           ('骨取り白身魚のソテー', None), ('サクラマスといくらの棒寿司', 'maff_kyodo-44_9_tokushima'),
                           ('海苔キムチ', None), ('黒はんぺん', None), ('炭火焼無限軟骨', None), ('ちぎり揚いか', None),
                           ('即席みそ汁 あさり', 'mext-17049'), ('カレーカシュー', None), ('まぐろたたき', None), ('鶏ごぼうごはん', 'dishes-takikomi-gohan'),
                           ('サトウのごはん あきたこまち', 'mext-01088'), ('ベルギーワッフル', None), ('お芋わかきもかもめの玉子', None),
                           ('兵四郎のおこし〈黒糖きな粉〉', 'mext-15043'), ('アーモンド 効果 オリジナル', 'sub-plant-milk'),
                           ('いかおくら', None), ('えび塩焼き', None), ('柏もち', 'maff_kyodo-43_15_yamaguchi'), ('ボイルいか', None),
                           ('完熟トマトのミートソース', 'mext-17033'), ('予約でいっぱいの店のボンゴレビアンコ', None),
                           ('うどん・そばつゆ ミヤジマ', None), ('マリエ塩バター', None),
                           ('おさつどきっ ミルクティー味', None), ('かっぱえびせん', None), ('スイートコーン', 'mext-06180')]:
            k, conf, why = self.R.match(name)
            self.assertEqual(k if conf >= pmatch.CONFIDENT else None, want, f'{name}: {k} {conf} {why}')


if __name__ == '__main__':
    unittest.main()
