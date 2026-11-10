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
"""
CATS = {'bread': 'パン', 'cheese': '乳製品', 'milktea': '飲料', 'bagel': 'パン', 'sandwich': '主食', 'caramel': '菓子・デザート',
        'karaage': '主菜', 'fishkaraage': '主菜', 'chips': '菓子・デザート', 'soy': '調味料', 'gummy': '菓子・デザート', 'cola': '飲料'}


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


class ProductsTxtTest(unittest.TestCase):
    """The committed rules: every key a shipped picture, and the lookalike classes stay fixed."""
    shipped = {r['key'] for r in json.load(open(os.path.join(IMAGES, 'shipped.json'), encoding='utf-8'))}
    R = pmatch.Rules(open(os.path.join(IMAGES, 'products.txt'), encoding='utf-8').read())

    def test_keys_ship(self):
        keys = {v[0] for v in self.R.words.values()} | set(self.R.tags.values()) | {k for _, k in self.R.brands} | \
            {k for rules in self.R.ctx.values() for _, k in rules} | set(self.R.kinds)
        self.assertEqual(sorted(k for k in keys if k and k not in self.shipped), [])

    def test_lookalikes(self):
        for name, want in [('鯖の竜田揚げ', 'jbfd-魚介の竜田揚げ'), ('いかの唐揚げ', 'jbfd-魚介の竜田揚げ'), ('そら豆の唐揚げ', None),
                           ('若鶏の竜田揚げ', 'toyonaka-117749'), ('北海道産 解凍ボイルほたて卵', None), ('するめいか照焼', None),
                           ('鶏の照焼', 'dishes-teriyaki-chicken'), ('ぶり照焼', 'dishes-buri-teriyaki'), ('生姜まんじゅう', 'mext-15033'),
                           ('青しそジュース', None), ('オレンジジュース', 'mext-07031'), ('とんがりコーン あっさり塩', 'mext-15102'),
                           ('クラフトシスコーン', 'mext-01137'), ('明太子パスタソース', 'dishes-tarako-spa'), ('やきそば弁当', 'mext-01060'),
                           ('贅沢ふかひれスープ', None), ('チキンと野菜のチーズクリームパスタ', None), ('鶏膝なんこつ旨塩焼', 'eatout-yakitori_nankotsu'),
                           ('かに風味つまみかまぼこ', 'mext-10376'), ('つけ麺用魚介豚骨', 'eatout-tsukemen'),
                           ('塩こんぶ', 'mext-09022'), ('宮崎マンゴーのたまご', None), ('スパゲッティ ナポリタン', 'dishes-napolitan')]:
            k, conf, why = self.R.match(name)
            self.assertEqual(k if conf >= pmatch.CONFIDENT else None, want, f'{name}: {k} {conf} {why}')


if __name__ == '__main__':
    unittest.main()
