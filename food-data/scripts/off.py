"""Open Food Facts (Japan subset) -> products.json (name search) + jan/<last 3 digits>.json (barcode lookup).

Inputs: raw/off/off_jp.jsonl (stream-filtered CSV dump, see fetch.py) and pages_*/page_*.json
(API search pages: they add product_name_ja/en, which the CSV lacks, and a few products).
"""
import glob, json, os, re, unicodedata
from collections import Counter
from datetime import datetime, timezone

from lib import NUTS, drop_reading, fnum as to_num, norm_jan, nutrients, shard_key

META = {
    'source': 'off',
    'label': 'Open Food Facts',
    'attribution': '© Open Food Facts contributors (ODbL)',
    'license': 'ODbL 1.0 / DbCL 1.0（この抽出データも ODbL 1.0 で提供）',
    'url': 'https://world.openfoodfacts.org',
}
# products.json's guard, its items as food-data.ts ships them (no `jan`), as objects (the columnar file is ~1/3
# smaller): every Japanese-named product with P/F/C on its label fits (~30k, 2026-11); over it, the newest Japanese
# barcodes (45/49) first, by last_modified_t (93 % have no scans: unique_scans_n ranks nothing)
MAX_PRODUCTS_BYTES = 8_000_000
JA_RE = re.compile(r'[぀-ヿ㐀-鿿ｦ-ﾟ]')
DRINK_CATS = {'飲料', '酒'}
# A name whose head (its last word, Japanese being head-final) is a drink, at a drink's energy, is a drink whatever
# flavour or food word comes before it: はちみつ香るアールグレイティー, アイスコーヒー, タピオカミルクティー (not コーヒーゼリー,
# ミルクティー味プロテイン, アイス 抹茶, 蒟蒻ゼリー 抹茶ラテ). A trailing size or bracket is skipped. NAME_RULES checks it after 酒.
DRINK_HEAD = re.compile(r'(?:ティー|(?<!抹)茶|コーヒー|珈琲|ラテ|カフェオレ|ティー・オレ|ジュース|ドリンク|ソーダ|サイダー|エード|モネード|'
                        r'スカッシュ|ウォーター|スムージー|スパークリング)'
                        r'(?:\s*[(（][^()（）]*[)）])*(?:\s*\d+(?:\.\d+)?\s*(?:ml|l|本|缶))?\s*$', re.I)
DRINK_HEAD_NOT = re.compile(r'(?:ゼリー|ソフト)(?!ドリンク)')
# 調味料's roux: カレールー, シチュールー, ハヤシルー or ルー as a word of its own, never inside フルーツ, ブルーベリー, プルーン,
# マッシュルーム, ビンダルー (katakana on either side; ・ and 。 are no letters)
ROUX = re.compile(r'(?:カレー|シチュー|ハヤシ)ルー|(?<![ァ-ヺー])ルー(?![ァ-ヺー])')
DRINK_HEAD_MAX_KCAL = 160   # a smoothie or a shake; a powder or a snack named so is far above

# Pasta (not its sauce, a salad or a dish named after one: カルボナーラ風ハンバーグ); だんご but a meatball (鶏だんご,
# 生だんご 鶏肉: 主菜 or 肉); an oil (オイル, 油, MCT, ギー) but 醤油, ラー油 (調味料), 油揚 and a dish or a fish in oil
PASTA = re.compile(r'(?:パスタ|スパゲッ?ティ|ペンネ|マカロニ|カルボナーラ|ペペロンチーノ|ボロネーゼ|フェットチーネ|リングイネ|'
                   r'ナポリタン|アラビアータ)(?!.*(?:ソース|の素|サラダ|ハンバーグ|グラタン|ドリア|グミ|キャンディ))')
# a steak but its sauce or seasoning (ステーキソース, ステーキ醤油, ステーキ宮のたれ)
STEAK = re.compile(r'ステーキ(?!.*(?:ソース|たれ|タレ|醤油|しょうゆ|スパイス|香辛料|シーズニング|塩))')
PIZZA = re.compile(r'ピザ(?!.*(?:ソース|ポテト|味))')
# late, and never a flavour (メロン味, バナナ風味) or a protein's: a fruit flavours many a sweet or drink
FRUIT = re.compile(r'^(?!.*(?:味|風味|プロテイン|ホエイ|whey|protein|wpc|wpi|ジェル|パン|フランス|ブール|スワール|アイス|ヨーグルト|ジェラート|'
                   r'ソフト|ケーキ|ゼリー)).*(?:マンゴー|ブルーベリー|バナナ|フルーツ|レーズン|'
                   r'デーツ|プルーン|いちじく|メロン|キウイ|シャインマスカット)')
BURI_TARA = re.compile(r'(?<!あ)(?<!しゃ)(?<!が)(?<!ん)ぶり|(?<!い)(?<!ぶ)たら')   # not あぶり, しゃぶり, どんぶり, 焼いたら
BEEF_PORK = re.compile(r'(?:ビーフ|ポーク)(?!.*(?:ルー|ルウ|ソース|たれ|タレ|シーズニング|の素|用))')   # not a roux's or sauce's
# あん the sweet bean paste, not a dish's sauce (甘酢あん, 黒酢あん, 香味あん) or あんず
ANKO = re.compile(r'(?<!酢)(?<!味)あん(?!ず)')
CROQUETTE = re.compile(r'(?:コロッケ|メンチ)(?!.*(?:パン|サンド|バーガー|ドッグ))')   # コロッケパン: パン
CUTLET = re.compile(r'カツ(?!オ)(?!.*(?:丼|サンド|パン|カレー|バーガー|弁当|定食|重))')   # not カツオ; カツ丼: 丼・定食
# plain butter only: the name ends in it (北海道バター 食塩不使用), no flavour or food before it (じゃがバター, りんごバター, 塩バター)
BUTTER = re.compile(r'^(?!.*(?:じゃが|ジャガ|おさつ|いも|芋|りんご|アップル|ハニー|ドラ|焼|(?<!有)塩バター|デニッシュ|レーズン|ソフト|[&＆]|'
                    r'ピー|しあわせ|コーン|ご飯|ライス|炒め|餅|飴|クッキー|ビスコ))'
                    r'.*(?:バター|マーガリン)(?:\s*(?:食塩不使用|\(.*\)|（.*）|\d+\s*g))?\s*$', re.I)
DANGO = re.compile(r'^(?!.*(?:鶏|肉|豚|牛|魚|いわし|えび|海老|つくね)).*(?:団子|だんご)')
OIL = re.compile(r'^(?!.*(?:ドレッシング|ソース|たれ|タレ|だれ|醤油|しょうゆ|ノンオイル|あげ|漬|サーディン|ステーキ|ソテー|炒め|焼|揚|煮|チップ|ポテト|スナック|'
                 r'ふりかけ|ツナ|缶|パスタ|オイスター|不使用|味|香る|塩|拌|餅|いため|酥|らっきょう)).*(?:オイル|(?<!醤)(?<!ラー)(?<!辣)(?<!しょう)油|mct|(?<![ァ-ヺー])ギー(?![ァ-ヺー]))')
# A dish with cheese tagged as a cheese (チーズカツ, ピザ, チーズインハンバーグ): the tag's 乳製品 skipped, its name decides
DAIRY_TAG_NOT = re.compile(r'カツ|とんかつ|ピザ|pizza|ハンバーグ|フライ|コロッケ|メンチ|グラタン|ドリア|パスタ|カルボナーラ|揚|焼き?$|'
                           r'丼|弁当|サンド|バーガー|トースト|餃子|春巻', re.I)

# categories_tags -> app category (first matching rule wins; checked in tag order of specificity)
TAG_RULES = [
    (('alcoholic-beverages', 'beers', 'wines', 'sakes', 'spirits', 'whiskies', 'shochu', 'chu-hi', 'liqueurs'), '酒'),
    (('instant-noodles', 'noodles', 'ramen', 'udon', 'soba', 'pastas', 'spaghetti', 'yakisoba'), '麺'),
    (('breads', 'sandwiches', 'viennoiseries', 'brioches', 'buns'), 'パン'),
    (('sushi', 'onigiri', 'rice-balls'), '寿司'),
    (('soups', 'miso-soups', 'instant-soups'), '汁物'),
    (('chocolates', 'biscuits', 'cookies', 'candies', 'confectioneries', 'sweets', 'desserts', 'cakes', 'ice-creams',
      'chips-and-fries', 'crisps', 'snacks', 'sweet-snacks', 'salty-snacks', 'puddings', 'wagashi', 'gummies',
      'chewing-gum', 'jellies', 'rice-crackers', 'senbei'), '菓子・デザート'),
    (('yogurts', 'milks', 'cheeses', 'dairies', 'dairy-drinks', 'fermented-milk-products', 'creams'), '乳製品'),
    (('waters', 'teas', 'green-teas', 'coffees', 'sodas', 'juices', 'fruit-juices', 'beverages', 'soft-drinks',
      'energy-drinks', 'plant-based-milks', 'soy-milks', 'tea-based-beverages', 'coffee-drinks'), '飲料'),
    (('tofu', 'natto', 'soybeans', 'legumes', 'beans', 'soy-products'), '大豆・豆'),
    (('eggs',), '卵'),
    (('fishes', 'seafood', 'fish-and-seafood', 'canned-fishes', 'tunas', 'salmons', 'surimi', 'fish-cakes'), '魚介'),
    (('meats', 'sausages', 'hams', 'bacon', 'poultries', 'chickens', 'beef', 'pork', 'prepared-meats'), '肉'),
    (('seaweeds', 'nori', 'wakame', 'kombu'), '海藻'),
    (('mushrooms',), 'きのこ'),
    (('nuts', 'seeds', 'peanuts', 'almonds'), 'ナッツ・種'),
    (('fruits', 'dried-fruits', 'fruit-based-foods'), '果物'),
    (('vegetables', 'pickles', 'tsukemono', 'kimchi', 'vegetable-based-foods'), '野菜'),
    (('potatoes', 'fries'), 'いも'),
    (('fats', 'oils', 'vegetable-oils', 'olive-oils', 'virgin-olive-oils', 'extra-virgin-olive-oils', 'sesame-oils',
      'cereal-oils', 'coconut-oils', 'rapeseed-oils', 'sunflower-oils', 'canola-oils', 'fruit-and-fruit-seed-oils',
      'butters', 'margarines'), '油脂'),
    (('condiments', 'sauces', 'seasonings', 'dressings', 'mayonnaises', 'ketchup', 'soy-sauces', 'misos', 'vinegars',
      'spices', 'salts', 'sugars', 'curry-roux', 'broths', 'dashi', 'spreads', 'jams', 'honeys'), '調味料'),
    (('rices', 'cereals-and-their-products', 'breakfast-cereals', 'cereals', 'rice-products', 'flours',
      'cereals-and-potatoes'), '主食'),
    (('meals', 'prepared-meals', 'ready-meals', 'curries', 'frozen-meals', 'bento'), '主菜'),
]
# product-name keywords (Japanese) -> category, used when tags give nothing
NAME_RULES = [
    (('果汁', 'ジュース', '野菜生活', 'スムージー'), '飲料'),
    (('コーンフレーク', 'シリアル', 'グラノーラ', 'オートミール'), '主食'),
    (('ビール', '発泡酒', 'alc.', 'チューハイ', 'サワー', 'ハイボール', '日本酒', '焼酎', 'ワイン', '梅酒', 'ウイスキー'), '酒'),
    (DRINK_HEAD, '飲料'),
    (('ラーメン', 'らーめん', 'うどん', 'そば', '焼そば', '焼きそば', 'ヌードル', '麺', 'めん', 'メンマ', 'カップヌードル', 'どん兵衛',
      PASTA), '麺'),
    (('おにぎり', '寿司', 'すし', '巻き寿司', '巻寿司', '太巻', '細巻', '中巻', '手巻', '恵方巻', '海苔巻', 'のり巻', '海鮮巻',
      '鉄火巻', 'かっぱ巻', '納豆巻'), '寿司'),
    (('味噌汁', 'みそ汁', 'スープ', 'ポタージュ', '汁'), '汁物'),
    (('チョコ', 'クッキー', 'ビスケット', 'ポテトチップ', 'チップス', 'スナック', 'ガム', 'キャンディ', 'グミ', 'アイス',
      'プリン', 'ゼリー', 'ケーキ', 'せんべい', '煎餅', 'あられ', '饅頭', 'まんじゅう', '大福', 'ようかん', '羊羹', 'ポッキー',
      'キャラメル', 'ウエハース', 'クラッカー', 'もち', DANGO, ANKO, 'おはぎ', 'マドレーヌ', '菓子', 'かりんとう', 'たけのこの里', 'きのこの山',
      'バナナチップ', 'カステラ', 'ワッフル', 'タルト', 'パイ', 'マカロン', 'シュークリーム', 'エクレア', 'バウム', 'バーム',
      'ショコラ', 'モンブラン', 'ティラミス', 'ラスク', 'サブレ', 'もなか', 'わらび餅', 'わらびもち', 'どら焼', 'どらやき',
      'マフィン', 'ブラウニー', 'フィナンシェ', 'カヌレ', 'スコーン', 'けんぴ', 'ブラックサンダー', 'カントリーマアム',
      'ハッピーターン', 'ポップコーン', 'じゃがりこ'), '菓子・デザート'),
    (('カレー', 'シチュー', 'グラタン', 'ドリア', 'パスタソース', 'ぎょうざ', '餃子', 'しゅうまい', '焼売', '春巻', 'ロールキャベツ', 'カリー',
      CROQUETTE, CUTLET, 'ギョーザ', 'アヒージョ', 'チンジャオ', '麻婆', '肉団子', '肉だんご', '鶏団子', '鶏だんご', 'つくね'), '主菜'),
    (('パン', 'カンパーニュ', PIZZA, 'バーガー', 'サンド', 'ロール', 'クロワッサン', 'ドーナツ', 'ベーグル', 'ブレッド'), 'パン'),
    (('ヨーグルト', '牛乳', 'ミルク', 'チーズ', 'ちーず', '乳酸菌', 'モッツァレラ', 'ゴルゴンゾーラ', 'カマンベール', 'パルメザン'),
     '乳製品'),
    (('茶', 'コーヒー', '珈琲', 'ジュース', 'ウォーター', '水', 'サイダー', 'コーラ', 'ソーダ', 'ドリンク', '飲料', 'ラテ', '豆乳', 'カルピス'), '飲料'),
    (('豆腐', '厚揚', 'あつ揚', '油揚', '油あげ', '納豆', '大豆', '豆', 'きな粉', 'きなこ'), '大豆・豆'),
    (('卵', 'たまご', 'エッグ', '玉子'), '卵'),
    (('鮭', 'さけ', 'サーモン', 'まぐろ', 'ツナ', 'さば', '鯖', 'いわし', 'えび', 'エビ', 'いか', 'イカ', 'たこ', 'あじ', 'ししゃも', 'たらこ', 'たら子', '明太', 'しらす', 'カレイ', 'かつお',
      'ほっけ', '貝', 'あさり', 'かれい', 'わかさぎ', BURI_TARA, '鰤', '鱈', '海老', 'シーフード', 'ホタテ', 'カツオ', 'マグロ', 'サバ', 'イワシ', 'さんま', 'サンマ',
      'あたりめ', 'するめ', 'じゃこ', '煮干', 'ちりめん', 'チャンジャ', 'カキフライ', 'アジフライ', '牡蠣', 'サーディン', 'カジキ', 'かじき', '鮪', '鮟鱇', 'ほたて', 'うなぎ', '鰻', 'ひれ', 'かに', 'ちくわ', 'かまぼこ', '魚'), '魚介'),
    (('丼', '定食', '弁当'), '丼・定食'),
    (('ハム', 'ソーセージ', 'ウインナー', 'ベーコン', 'チキン', '鶏', '豚', '牛', '肉', 'ハンバーグ', BEEF_PORK, '唐揚', 'からあげ', 'レバー', 'ローストビーフ', STEAK, 'ささみ', 'ジャーキー', 'フランク', 'カルパス', 'チャーシュー', '砂肝', '軟骨', 'ザンギ', 'もつ', 'ぼんじり', '親鳥', 'とり'), '肉'),
    (('のり', '海苔', 'わかめ', '昆布', 'ひじき', 'もずく'), '海藻'),
    (('きのこ', 'しいたけ', 'えのき', 'しめじ', 'まいたけ'), 'きのこ'),
    ((OIL,), '油脂'),   # before ごま (ごま油) and サラダ (サラダ油); a dish in oil has matched before
    (('ナッツ', 'アーモンド', 'ピーナッツ', 'くるみ', 'ごま'), 'ナッツ・種'),
    ((BUTTER,), '油脂'),
    (('漬', 'キムチ', 'サラダ', '野菜', 'ごぼう', 'にんじん', 'キャベツ', 'トマト', 'ほうれん草', 'ねぎ', 'たまねぎ',
      'コーン', 'ブロッコリー', 'かぼちゃ', 'オクラ', '大根', 'だいこん', 'れんこん', 'もやし', '白菜', 'たけのこ', 'ピーマン',
      'なす'), '野菜'),
    # English names (matched lower-case)
    (('beer', 'wine', 'sake', 'whisky', 'highball'), '酒'),
    (('noodle', 'ramen', 'udon', 'soba', 'pasta', 'spaghetti'), '麺'),
    (('chocolate', 'choco', 'choc', 'cookie', 'biscuit', 'chips', 'candy', 'gummy', 'snack', 'cracker', 'wafer', 'ice cream',
      'pocky', 'kitkat', 'kit kat', 'cake'), '菓子・デザート'),
    (('yogurt', 'yoghurt', 'cheese', 'milk'), '乳製品'),
    (('juice', 'tea', 'coffee', 'water', 'soda', 'cola', 'drink', 'latte'), '飲料'),
    (('bacon', 'sausage', 'ham', 'chicken', 'beef', 'pork'), '肉'),
    (('bread', 'sandwich', 'pizza'), 'パン'),
    (('sauce', 'dressing', 'mayonnaise', 'ketchup', 'soy sauce', 'miso', 'seasoning', 'jam', 'honey'), '調味料'),
    (('醤油', 'しょうゆ', '味噌', 'みそ', 'ソース', 'ドレッシング', 'マヨネーズ', 'ケチャップ', 'たれ', 'タレ', 'だし',
      '酢', 'ルウ', ROUX, 'つゆ', '塩', '砂糖', 'ジャム', 'はちみつ', '調味', '香辛料', 'ラー油', 'にんにく', 'しょうが', 'わさび', 'からし', 'コチュジャン', 'シーズニング'), '調味料'),
    (('ポテト', 'じゃがいも', 'じゃがバター', 'ジャガバター', 'さつまいも', '芋', 'いも', 'こんにゃく', 'しらたき', 'とろろ'), 'いも'),
    ((FRUIT,), '果物'),
    (('ごはん', 'ご飯', '米', 'シリアル', 'グラノーラ', 'オートミール', 'もち麦', 'チャーハン', '炒飯', 'ピラフ'), '主食'),
    (('巻',), '寿司'),   # last: トロたく巻, 鉄火花巻 (チーズ巻, 春巻 and 昆布巻 have matched before)
]


def clean(s):
    if not isinstance(s, str):
        return ''
    s = s.replace('　', ' ').replace('\n', ' ').replace('\t', ' ')
    return re.sub(r'\s+', ' ', s).strip().strip(',').strip()


def pick_name(p):
    cands = [clean(p.get('product_name_ja')), clean(p.get('product_name')), clean(p.get('generic_name_ja')),
             clean(p.get('product_name_en'))]
    cands = [c for c in cands if c and len(c) >= 2]
    if not cands:
        return '', False
    ja = [c for c in cands if JA_RE.search(c)]
    name = ja[0] if ja else cands[0]
    has_ja = bool(clean(p.get('product_name_ja'))) or bool(ja)
    if len(name) > 60:
        name = name[:60].rstrip() + '…'
    return name, has_ja


# Words that hold a keyword without being one (さば水煮 is no 水, 茶碗蒸し no 茶, 出汁の唐揚げ no 汁, パンプキン no パン,
# サワードウ no サワー, だし巻き no だし): rewritten before the name keywords are matched.
NAME_FALSE_FRIENDS = {'水煮': '煮', '水炊': '炊', '水ようかん': 'ようかん', '水羊羹': '羊羹', '水まんじゅう': 'まんじゅう',
                      '茶碗': '碗', '茶漬': 'ちゃづけ', '茶巾': '巾', '紅茶鴨': '鴨', '出汁': '', 'だし汁': '', '肉汁': '肉',
                      'パンプキン': 'かぼちゃ', 'ジャパン': '', 'サワードウ': '', 'サワークリーム': 'クリーム',
                      'だし巻': '卵焼', 'だし巻き': '卵焼', 'スパイシー': '辛口', 'スパイス': '香辛料', 'うすしお': '薄塩',
                      'あんかけ': '餡かけ', 'あんこう': '鮟鱇', 'チキンロール': 'チキン巻', '抹茶': 'まっちゃ'}
_FALSE_RE = re.compile('|'.join(sorted(map(re.escape, NAME_FALSE_FRIENDS), key=len, reverse=True)))


def pick_cat(tags, name, kcal=0):
    tags = [t.split(':', 1)[-1] for t in (tags or []) if isinstance(t, str)]
    # most specific tag is usually last in OFF; walk from the end
    for t in reversed(tags):
        for keys, cat in TAG_RULES:
            if t in keys and not (cat == '乳製品' and DAIRY_TAG_NOT.search(name)):
                return cat
    low = _FALSE_RE.sub(lambda m: NAME_FALSE_FRIENDS[m.group(0)], name.lower())
    for keys, cat in NAME_RULES:
        if cat == '酒' and kcal > 300:   # サワークリーム chips, サワーグミ, ビール酵母: not a drink
            continue
        if isinstance(keys, re.Pattern):
            if kcal <= DRINK_HEAD_MAX_KCAL and keys.search(low) and not DRINK_HEAD_NOT.search(low):
                return cat
        elif cat == '乳製品' and DAIRY_TAG_NOT.search(low):   # チーズカツ, チーズインハンバーグ: the dish's word decides
            continue
        elif any((k.search(low) if isinstance(k, re.Pattern) else re.search(r'\b' + re.escape(k) + r's?\b', low)
                  if k.isascii() else k in low) for k in keys):
            return cat
    kind = protein_kind(name, kcal)   # a protein supplement named after nothing else
    if kind:
        return {'bar': '菓子・デザート', 'drink': '飲料'}.get(kind) or (
            '大豆・豆' if re.search(r'ソイ|大豆|soy', name, re.I) else '乳製品')
    return 'その他'


def read_nutriments(n):
    n = n or {}
    kcal = to_num(n.get('energy-kcal_100g'))
    if kcal is None:
        kj = to_num(n.get('energy-kj_100g'))
        if kj is None:
            kj = to_num(n.get('energy_100g'))  # OFF stores energy_100g in kJ
        if kj is not None:
            kcal = kj / 4.184
    p, f, c, salt, sodium = (to_num(n.get(k + '_100g')) for k in ('proteins', 'fat', 'carbohydrates', 'salt', 'sodium'))
    if salt is None and sodium is not None:
        salt = sodium * 2.54
    if salt is not None and 0 < salt < 0.01:
        # e.g. 0.00345 for potato chips: mg/g unit-entry errors; genuine ~0 values are stored as 0
        salt = None
    return kcal, p, f, c, salt


# ---------------------------------------------------------------- plausibility (all values per 100 g)
# Salt caps by app category (g/100 g). Above the cap the salt value is nulled unless the name is a known salty
# food; above 60 g it is nulled outside 調味料 regardless; extended to meat/fish/
# eggs/dishes so that e.g. 鶏胸肉 7.9 g or 牛乳 3.3 g (per-serving typos) are caught.
SALT_CAP = {'調味料': 100.0, '飲料': 1.5, '酒': 2.0, '乳製品': 2.0, '菓子・デザート': 5.0, 'パン': 3.0, '果物': 1.0,
            'ナッツ・種': 3.0, '主食': 7.0, '麺': 8.0, '肉': 4.0, '卵': 2.0, '大豆・豆': 3.0, 'いも': 3.0, '野菜': 4.0,
            '主菜': 5.0, '副菜': 5.0, '丼・定食': 4.0, '寿司': 4.0, '魚介': 6.0, '油脂': 3.0, '汁物': 20.0}
SALT_CAP_DEFAULT = 10.0
SALTY_OK = re.compile(r'塩|漬|梅|みそ|味噌|醤|しょうゆ|醤油|だし|出汁|ふりかけ|佃煮|つくだ煮|昆布|こんぶ|わかめ|ひじき|のり|海苔|'
                      r'たらこ|明太|いくら|筋子|からすみ|つゆ|たれ|タレ|ソース|スープ|ブイヨン|コンソメ|顆粒|素|もと|ラーメン|'
                      r'らーめん|めん|麺|うどん|そば|キムチ|ジャン|醬|チーズ|バター|干|ひもの|干物|さきいか|あたりめ|くさや|'
                      r'アンチョビ|ザーサイ|搾菜|メンマ|ナンプラー|魚醤|ベーコン|生ハム|サラミ|ジャーキー|せんべい|あられ|'
                      r'珍味|しらす|ちりめん|桜えび|干しえび|いかの塩辛|かつお節|削り|鮭フレーク|ふぐ|うに|塩辛|粉末|パウダー|だれ|'
                      r'ドレッシング|ラー油|ルウ|ルー|ルゥ|用|吸い物|煮|ソルト|スパイス|シーズニング|ゴルゴンゾーラ|カマンベール|'
                      r'パルメザン|ゴーダ|cheese|chedd|gouda|camembert|gorgonzola|parmesan|parmigiano|fromage|feta|brie|'
                      r'salt|soy|sauce|miso|soup|broth|dashi|shoyu|tsuyu|furikake|seasoning|ramen|noodle|bacon|ham\b|'
                      r'口$|うすくち|こいくち|こしょう|胡椒|キューブ|あさげ|ゆうげ', re.I)
# energy below 4P+9F+4C is legitimate for sugar alcohols / sweeteners and fibre-rich foods (however far below: a
# fibre's carbohydrate is ~2 kcal/g or none, イージーファイバー, 寒天パウダー)
LOW_KCAL_OK = re.compile(r'(?i:lakan?to)|甘味料|エリスリ|ラカント|パルスイート|シュガーカット|キシリトール|ゼロ|ノンカロリー|カロリーオフ|'
                         r'糖質(?:ゼロ|オフ|0)|こんにゃく|蒟蒻|寒天|ところてん|食物繊維|難消化|ファイバー|わかめ|昆布|こんぶ|'
                         r'ひじき|海藻|もずく|めかぶ|きのこ|しいたけ|ガム')
# Protein supplements (powders, bars, drinks): the salty-food allow-list (パウダー, soy ...) does not apply, and the
# caps follow the product type (MEXT 分離大豆たんぱく has 3.3 g; whey powders ~1-2 g; bars and drinks less).
# Soups, noodles, snacks and dishes sold as "protein" keep the normal rules; pea protein is genuinely salty.
PROTEIN_RE = re.compile(r'プロテイン|ホエイ|ホイプロテイン|whey|protein|\bwp[ci]', re.I)
PROTEIN_NOT = re.compile(r'スープ|soup|ポタージュ|チャウダー|味噌|みそ|汁|マーラータン|うどん|udon|麺|ヌードル|noodle|'
                         r'チップ|chip|スナック|クッキー|cookie|ギョーザ|餃子|シュウマイ|唐揚|チキン|chicken|ささみ|ハンバーグ|'
                         r'hamburg|ソーセージ|sausage|ステーキ|steak|スティック|stick|ピー|pea', re.I)
PROTEIN_SALT_CAP = {'bar': 3.0, 'powder': 4.0, 'drink': 1.5}
# Fried chicken (からあげ, フライドチキン, ナゲット ...) is >= ~200 kcal/100 g (MEXT 18054 とりから揚げ 204); far below
# that the row holds per-piece values (e.g. からあげ 45 kcal "per 100 g"). Mixes, seasonings, flavoured snacks, dishes
# with other parts and fish/soy karaage are excluded.
FRIED_CHICKEN_RE = re.compile(r'からあげ|唐揚|から揚|フライドチキン|チキンカツ|チキンフライ|ザンギ|ナゲット|竜田揚|ファミチキ')
FRIED_NOT = re.compile(r'用|粉|素|もと|たれ|タレ|ソース|味(?!付)|風味|煮|弁当|丼|定食|うどん|そば|鍋|スープ|サラダ|揚げる前|'
                       r'たこ|タコ|いか|イカ|えび|エビ|海老|魚|鮭|たら|タラ|カレイ|ガレイ|あんこう|軟骨|大豆|豆腐|ソイ')
FRIED_MIN_KCAL = 120


HIGH_KCAL_KEEP = 600
# Every value 0 on a food (no drink, salt, sweetener or konjac): the label's values never entered (some sit in the
# serving size: 「467 kcal」); dropped
ZERO_OK = re.compile(r'水|ウォーター|ウオーター|タンサン|炭酸|ソーダ|茶|ティー|コーヒー|珈琲|ブラック|無糖|ゼロ|塩|ソルト|こんにゃく|'
                     r'蒟蒻|寒天|ところてん|ノンアル|ガム|甘味料|water|tea|coffee|zero|salt|eaa|bcaa', re.I)
# Dry snacks are >= ~350 kcal/100 g and a rice ball >= ~150 (MEXT 01111 おにぎり 170): far below, the label's
# per-piece or per-bag values were entered as per 100 g (チータラ 89, ひよこ豆スナック 52, おにぎり 72-77), every
# value scaled alike, so they pass Atwater: dropped (a kept kcal would be as wrong; the weight is unknown)
DRY_SNACK = re.compile(r'チップス|ポテチ|スナック(?!サンド)|チータラ|クッキー|ビスケット|せんべい|煎餅|あられ|おかき|かりんとう|'
                       r'クラッカー|プリッツ|ポッキー|柿の種|ポップコーン|うまい棒')
DRY_SNACK_NOT = re.compile(r'(?i:bar)|クリーム|バニラ|豆乳|飲料|アイス|氷|フラッペ|サンデー|カップ|ソルベ|モナカ|ジェラート|パフェ|シェイク|ミルク|ドリンク|ラテ|ケーキ|'
                           r'サンド|ゼリー|プリン|ヨーグルト|ムース|豆腐|とうふ|スープ|カレー|炒め|サラダ|ソース|バー')
RICE_BALL = re.compile(r'おにぎり|おむすび')
FLOORS = ((DRY_SNACK, DRY_SNACK_NOT, 200, 'snack_floor'), (RICE_BALL, re.compile(r'の具|具材|ふりかけ|用'), 120, 'onigiri_floor'))


def protein_kind(name, kcal):
    """'bar' | 'powder' | 'drink' for a protein supplement name, else None."""
    if not PROTEIN_RE.search(name) or PROTEIN_NOT.search(name):
        return None
    if re.search(r'(?<!ファイ)(?<!レー)バー|\bbar\b', name, re.I):   # not ファイバー, フレーバー
        return 'bar'
    return 'powder' if kcal >= 250 else 'drink'


CREATINE_NOTE = 'クレアチンは表示上たんぱく質に含まれますが、たんぱく質にもエネルギー源にもならないため 0 として扱います'
ALCOHOL_RE = re.compile(r'ストロング|チューハイ|酎ハイ|サワー|檸檬堂|ハイボール|ビール|発泡酒|ワイン|梅酒|日本酒|焼酎|ウイスキー|'
                        r'ほろよい|氷結|(?<![\d.])[1-9]?\d(?:\.\d)?\s*%')   # 9 %, never 100 % (きな粉)
NON_ALCOHOL_RE = re.compile(r'ノンアル|アルコールフリー|0\.00|オールフリー|ドライゼロ|ビアリー|ゼロカク|酵母|グミ|キャンディ|飴|'
                            r'サワークリーム|ソース|酢|ドレッシング')
CREATINE_RE = re.compile(r'クレアチン|クレアルカリン|creatine', re.I)


def plausible(kcal, p, f, c, salt, cat='その他', name='', liquid=False):
    """-> (kcal, p, f, c, salt) with implausible values corrected/nulled, or None to drop the product; + flags.
    Order: kJ typed as kcal -> /4.184; kcal outside 0-900 (oils <= 950), every value 0 on a food, a dry snack or rice
    ball under its floor -> drop; a macro outside 0-100 -> null it; P+F+C > 105 -> null P/F/C; kcal grossly under
    4P+9F+4C (per-serving typos; not sweeteners/fibre) -> drop; grossly over it -> null P/F/C (over 600 kcal: drop);
    moderately off (> 1.35x+25 or < 0.65x-25, not 酒/sweeteners/fibre foods) -> null P/F/C; fried chicken under 120
    kcal -> drop; salt above the category cap (protein supplements: their own caps) / 60 g -> null salt."""
    flags = []
    nm = name or ''
    if kcal == 0 and ALCOHOL_RE.search(nm) and not NON_ALCOHOL_RE.search(nm):
        return None, ['alcohol_zero']   # an alcoholic drink at 0 kcal: the label's energy is missing (檸檬堂)
    if kcal < 0.5 and p == f == c == 0 and cat not in ('飲料', '酒', '調味料', 'その他') and not ZERO_OK.search(nm):
        return None, ['all_zero']
    if CREATINE_RE.search(nm) and not protein_kind(nm, kcal) and not re.search(r'プロテイン|ホエイ|whey|protein', nm, re.I):
        # Japanese labels show creatine's nitrogen as protein (クレアチン 5 g: P 4.4 g, 18 kcal); it is neither a
        # protein nor an energy source
        p, kcal = 0.0, 4 * (c or 0) + 9 * (f or 0)   # what's left: a flavoured one's sugar
        flags.append('creatine')
    if None not in (p, f, c) and cat != '酒':
        est = 4 * p + 9 * f + 4 * c
        if est > 30 and kcal > 1.6 * est and abs(kcal - 4.184 * est) < 0.08 * 4.184 * est:
            kcal = kcal / 4.184
            flags.append('kj_as_kcal')
    if not 0 <= kcal <= (950 if (f or 0) >= 95 else 900):
        return None, ['kcal_range']
    for pat, nott, floor, flag in FLOORS:
        if kcal < floor and pat.search(nm) and not nott.search(nm) and cat not in ('飲料', '酒') and not liquid:   # ml: a drink or ice
            return None, flags + [flag]
    if kcal < FRIED_MIN_KCAL and cat not in ('調味料', '飲料', '酒') and FRIED_CHICKEN_RE.search(nm) \
            and not FRIED_NOT.search(nm):
        return None, flags + ['fried_low']
    vals = []
    for v in (p, f, c):
        if v is not None and not 0 <= v <= 100:
            v = None
            flags.append('macro_range')
        vals.append(v)
    p, f, c = vals
    if None not in (p, f, c):
        est = 4 * p + 9 * f + 4 * c
        if p + f + c > 105:
            p = f = c = None
            flags.append('pfc_sum')
        elif est > 2 * kcal + 60 and not LOW_KCAL_OK.search(nm):
            return None, flags + ['atwater_gross']
        elif est > 0 and kcal > est + max(80, 0.6 * kcal) and cat != '酒':   # alcohol: 7 kcal/g
            if kcal > HIGH_KCAL_KEEP:   # a sauce at 750: the energy is wrong too
                return None, flags + ['atwater_gross']
            p = f = c = None   # the energy right, a macro wrong (干しいも 328 kcal, C 18.3: its sugar)
            flags.append('atwater_high')
        elif cat != '酒' and (kcal > 1.35 * est + 25 or (kcal < 0.65 * est - 25 and not LOW_KCAL_OK.search(nm)
                                                         and cat not in ('海藻', 'きのこ'))):
            if cat == '菓子・デザート' and kcal < 100:   # e.g. chips at 45 kcal: the energy itself is wrong
                return None, flags + ['atwater_snack']
            p = f = c = None
            flags.append('atwater')
    if salt is not None:
        if salt < 0 or salt > 100 or (salt > 60 and cat != '調味料'):
            salt = None
            flags.append('salt>60')
        elif protein_kind(nm, kcal):
            if salt > PROTEIN_SALT_CAP[protein_kind(nm, kcal)]:
                salt = None
                flags.append('salt_protein')
        elif salt > SALT_CAP.get(cat, SALT_CAP_DEFAULT) and not SALTY_OK.search(nm):
            salt = None
            flags.append('salt_cap')
    return (kcal, p, f, c, salt), flags


# A serving OFF can weigh: grams or millilitres on the label. "1 cup" OFF makes 240 g, "1 fl oz" 29.6 g; a serving
# of 「467 kcal」 holds the label's energy
METRIC_SERVING = re.compile(r'\d\s*(?:g|ｇ|gr|gram|grams|グラム|ml|ｍｌ|cl|l|ℓ|cc|kg|г)(?![a-z])', re.I)
# A serving of cups or of kcal: the per-100 g values are the label's per-serving ones over OFF's 240 g (おにぎり 68-80,
# a bento 325) or none (all 0): dropped
BAD_SERVING = re.compile(r'\bcups?\b|kcal', re.I)


def liquid(p):
    """Sold or served by volume (ml): a drink or an ice cream, never a dry snack under its floor."""
    return (p.get('product_quantity_unit') or '').lower() == 'ml' or any(
        re.search(r'\d\s*(?:ml|ｍｌ|cc)\b', clean(p.get(k)), re.I) for k in ('serving_size', 'quantity'))


def bad_serving(p):
    ss = clean(p.get('serving_size'))
    return bool(ss) and bool(BAD_SERVING.search(ss)) and not METRIC_SERVING.search(ss)


def portions(p, cat, kcal):
    out = []
    sq = to_num(p.get('serving_quantity'))
    if sq and not METRIC_SERVING.search(clean(p.get('serving_size'))):
        sq = None   # 1 fl oz, 1 bottle: no weight
    pq = to_num(p.get('product_quantity'))
    unit = (p.get('product_quantity_unit') or '').lower()
    if pq is None:
        m = re.match(r'^\s*(\d+(?:\.\d+)?)\s*(g|ml|mL|ML|グラム)\s*$', clean(p.get('quantity')))
        if m:
            pq = float(m.group(1))
    if unit and unit not in ('g', 'ml'):
        pq = None
    single = None
    if pq and 0 < pq <= (700 if cat in DRINK_CATS else 400) and cat not in ('調味料', '油脂'):
        if cat in DRINK_CATS and kcal <= 150:
            label = '1本'
        elif cat in DRINK_CATS or cat == '菓子・デザート':
            label = '1袋'
        else:
            label = '1個'
        single = {'label': label, 'g': int(round(pq))}
    if sq and 0 < sq <= 2000:
        if single and abs(single['g'] - sq) < 1:
            out.append(single)
            single = None
        else:
            out.append({'label': '1食分', 'g': round(sq) if sq >= 10 else round(sq, 1)})
    if single:
        out.append(single)
    return out


def load(indir):
    """{code: product}: API search pages (newest record wins), then the CSV extract, which keeps the API's
    language-specific names (the CSV only has product_name)."""
    seen = {}
    for fp in sorted(glob.glob(os.path.join(indir, 'pages*', 'page_*.json'))):
        with open(fp, encoding='utf-8') as f:
            for p in json.load(f).get('products', []):
                k = str(p.get('code', ''))
                if k not in seen or (p.get('last_modified_t') or 0) >= (seen[k].get('last_modified_t') or 0):
                    seen[k] = p
    with open(os.path.join(indir, 'off_jp.jsonl'), encoding='utf-8') as f:
        for line in f:
            if line.strip():
                p = json.loads(line)
                k = str(p.get('code', ''))
                for f2 in ('product_name_ja', 'product_name_en', 'generic_name_ja'):
                    if seen.get(k, {}).get(f2) and not p.get(f2):
                        p[f2] = seen[k][f2]
                seen[k] = p
    return seen


def dumped(indir):
    """The CSV dump's date (UTC), its newest last_modified_t: fetch.py records no download date."""
    with open(os.path.join(indir, 'off_jp.jsonl'), encoding='utf-8') as f:
        t = max((int(m.group(1)) for m in map(re.compile(r'"last_modified_t": (\d+)').search, f) if m), default=0)
    return datetime.fromtimestamp(t, timezone.utc).strftime('%Y-%m-%d')


def dump_len(obj):
    return len(json.dumps(obj, ensure_ascii=False, separators=(',', ':')).encode('utf-8'))


def build(indir):
    """-> (products doc, {shard: {jan: item}}, stats). Shards hold every valid product; products.json (name
    search) every one with a Japanese name and P/F/C on its label, identical ones (same name, brand and nutrients)
    collapsed, under MAX_PRODUCTS_BYTES."""
    raw = load(indir)
    meta = dict(META, dumped=dumped(indir))
    stats = Counter(total_jp=len(raw))
    best = {}
    for code in sorted(raw):           # several raw codes can normalise to one JAN (UPC-A vs EAN-13): newest wins
        jan = norm_jan(code)
        if jan is None:
            stats['bad_code'] += 1
            continue
        old = best.get(jan)
        if old is None or (raw[code].get('last_modified_t') or 0) > (raw[old].get('last_modified_t') or 0):
            best[jan] = code
    items = []
    for jan in sorted(best):
        p = raw[best[jan]]
        kcal, pr, f, c, salt = read_nutriments(p.get('nutriments'))
        if kcal is None:
            stats['no_kcal'] += 1
            continue
        name, has_ja = pick_name(p)
        if not name:
            stats['no_name'] += 1
            continue
        cat = pick_cat(p.get('categories_tags'), name, kcal)
        if bad_serving(p):
            stats['flag:serving_cup_kcal'] += 1
            continue
        vals, flags = plausible(kcal, pr, f, c, salt, cat, unicodedata.normalize('NFKC', name), liquid(p))
        for fl in flags:
            stats['flag:' + fl] += 1
        if vals is None:
            continue
        brand = clean((p.get('brands') or '').split(',')[0])
        name, readings = drop_reading(name)
        it = {'id': 'off:' + jan, 'name': name}
        if readings:
            it['aliases'] = readings
        if brand:
            it['brand'] = brand[:30]
        it['jan'] = jan
        it['cat'] = cat
        it.update(nutrients(dict(zip(NUTS, vals))))
        if 'creatine' in flags:
            it['note'] = CREATINE_NOTE
        por = portions(p, cat, vals[0])
        if por:
            it['portions'] = por
        items.append((it, has_ja and None not in (pr, f, c)))   # searchable: a Japanese name, P/F/C on the label
    rank = {it['jan']: (it['jan'][:2] not in ('45', '49'), -(raw[best[it['jan']]].get('last_modified_t') or 0), it['jan'])
            for it, _ in items}
    # name search: one entry per identical product (the most-scanned code kept: the ids the pictures know stay)
    scans = {it['jan']: (-(to_num(raw[best[it['jan']]].get('unique_scans_n')) or 0),
                         -(to_num(raw[best[it['jan']]].get('completeness')) or 0), it['jan']) for it, _ in items}
    uniq = {}
    for it, ok in items:
        if not ok:
            continue
        k = (it['name'], it.get('brand'), it['kcal'], it['p'], it['f'], it['c'], it['salt'])
        if k not in uniq or scans[it['jan']] < scans[uniq[k]['jan']]:
            uniq[k] = it
    stats['not_searchable'] = sum(not ok for _, ok in items)
    stats['duplicates_collapsed'] = len(items) - stats['not_searchable'] - len(uniq)
    sel = sorted(uniq.values(), key=lambda it: it['jan'])
    shipped = lambda its: dump_len(dict(meta, items=[{k: v for k, v in it.items() if k != 'jan'} for it in its]))
    if shipped(sel) > MAX_PRODUCTS_BYTES:
        budget, keep = MAX_PRODUCTS_BYTES - 400, []
        for it in sorted(sel, key=lambda it: rank[it['jan']]):
            budget -= shipped([it]) - shipped([]) + 1
            if budget < 0:
                break
            keep.append(it)
        stats['cut_by_size'] = len(sel) - len(keep)
        sel = sorted(keep, key=lambda it: it['jan'])
    shards = {}
    for it, _ in items:
        shards.setdefault(shard_key(it['jan']), {})[it['jan']] = it
    stats.update({'valid': len(items), 'products_json_items': len(sel), 'shard_files': len(shards)})
    return dict(meta, items=sel), {k: shards[k] for k in sorted(shards)}, dict(sorted(stats.items()))
