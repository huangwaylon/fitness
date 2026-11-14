"""Kalori's chain menus (kalori.jp) -> kalori.json (docs/food-data.md "Kalori"): build.py's `kalori` target, a lazy
secondary dataset shipped like products.json. Never in verify.json (its values are estimates or per serving).

Input: the shard-*.jsonl files of the release fetch.py's KALORI_TAG pins (kalori_scrape.py's, compacted: one line a
product; fetched into raw/kalori/ by `fetch.py kalori`); an uncompacted, append-only shard reads the same. Only format
v2 lines (with `nutrients`) count; per product (shop, id) the latest `fetched_at` wins. `parser` is ignored; `table:
false` (no nutrition table: every value the site's estimate) keeps its est flags; a `gone` line (the product left the
site) marks the product's latest values, its own or the line before's when it carries none.

Run alone to see the counts (from the repo root; stdlib only):
  python3 -I food-data/scripts/kalori_convert.py <dir or shard files> [--off products.json] [--out file]
--out (and build.py) refuse a partial input (`partial`) unless KALORI_ALLOW_PARTIAL=1; --out writes what `build.py kalori`
would (lib.tidy, lib.validate), for CI with no other out/ files (then `npm run food:data -- --only kalori`).

Values are per serving (one 1食 portion of a nominal 100 g); a nutrient the page doesn't show is unknown (null;
fibre absent), never 0. Names are cleaned (tidy, uncoded, undecorated, unsuffixed, short). A row is dropped with no
name or kcal, values over the custom-food limits (kcal 5000, nutrients 500 g, fibre 100 g: lib.validate; a platter for
N ships per person: per_person), kcal far from Atwater (implausible; an official kcal ships with P, F, C unknown), the
same product as an Open Food Facts one (off_product: the same name, the shop its brand, a retail shop, the label's
serving), a near-duplicate (the shop's same name but for width or spaces: the current, latest, higher-id one stays;
both official and apart: both, named with their kcal), a takeout copy with its eat-in item's values (takeout_twins),
gone or discontinued past RETAIN (retired) or a name over 60 characters that, cut short, meets another.
A product the page says may be discontinued (`ended`), the shop's listing no longer shows (`listed: false`) or the site
no longer has (`gone`) stays, marked `ended: true` and `pop: -1` (ranked under the current menu).

What every item would carry is left to the app's loader (db.ts withJan, for `source: kalori`): `sv: true`, the one
1食 portion and `brand` (its shop's name, the header's `shops`); 53.8k items are 9.9 MB, not 14 (parsed in the phone's
worker, and each refresh a blob in git).
"""
import argparse, glob, json, math, os, re, sys, unicodedata
from collections import Counter
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ALIASES = os.path.join(ROOT, 'data_src', 'kalori_shops.json')

NAME_MAX = 60        # contract/food.ts FOOD_NAME_CHARS
KCAL_MAX = 5000      # contract/food.ts CUSTOM.kcalMax (per serving)
NUTRIENT_MAX = 500   # CUSTOM.nutrientMax
FIB_MAX = 100        # lib.validate's fib limit
# the fewest items a whole fetch gives: the site lists ~54,000 products, ~53,800 after the drops; under it (or with one of
# our shops empty) the shards are partial, and the file isn't written unless PARTIAL_ENV=1 (a local or partial run)
ITEMS_MIN = 45000
PARTIAL_ENV = 'KALORI_ALLOW_PARTIAL'
# what every item would carry, left to the app's loader (db.ts withJan): never in the file
LOADER_KEYS = ('brand', 'sv', 'portions')
# off_product: only a shop selling packaged food, and the label's values for a serving within this spread
OFF_RETAIL = ('convenience', 'supermarket', 'bread', 'sweets', 'confectionery', 'bento', 'cafe')
SERVING_SPREAD = 1.35
# retention (days since the scraper's gone_since / ended_since; doubled for an official kcal): a gone page's item is
# no use after a season, a discontinued one (its page still up) may come back as next year's seasonal menu
RETAIN = {'gone': 90, 'ended': 180}
# a platter for N over the limits: per person; never a 福袋, gift set or kilo challenge
PLATTER = re.compile(r'(?<![\d.〜~\-－ー])(\d+)\s*(?:人前|名様|人分|名分)')   # not 1.5人前, 2〜3人前
PLATTER_SHARE = 150   # a share under it: the value was already per person (a pack's label, ３人前 ramen at 98 kcal)
NOT_SPLIT = re.compile(r'福袋|感謝袋|ギフト|詰め?合わせ|kg|ｋｇ')
# near-duplicates both listed with official kcal this far apart: both kept, each name with its kcal
DUP_APART = 1.1
META = {'source': 'kalori', 'label': 'kalori.jp（チェーン店のメニュー）',
        'attribution': 'kalori.jp（各社の公表値と kalori.jp の AI 推定値）', 'license': 'kalori.jp 利用規約',
        'url': 'https://kalori.jp'}

# Kalori's common_genre -> our category (app/src/lib/art.ts FOOD_CAT); see cat_of for the rest
GENRE_CAT = {
    'noodle': '麺', 'pasta': '麺', 'set-meal': '丼・定食', 'rice-bowl': '丼・定食', 'sushi': '寿司', 'onigiri': '主食',
    'bento': '主食', 'curry': '主食', 'pizza': '主食', 'bread': 'パン', 'pastry': 'パン', 'sandwich': 'パン', 'burger': 'パン',
    'pork': '肉', 'beef': '肉', 'chicken': '肉', 'steak': '肉', 'fried-chicken': '肉', 'fish': '魚介', 'seafood': '魚介',
    'egg-dish': '卵', 'tofu': '大豆・豆', 'gyoza': '主菜', 'tempura': '主菜', 'salad': '副菜', 'soup': '汁物',
    'snack': '菓子・デザート', 'dessert': '菓子・デザート', 'cake': '菓子・デザート', 'ice-cream': '菓子・デザート',
    'alcohol': '酒', 'soft-drink': '飲料', 'tea': '飲料', 'coffee': '飲料', 'juice': '飲料', 'smoothie': '飲料'}
# all 31 of Kalori's shop categories; a category only for a genre-less item, and only where the shop's kind says what
# it is (a yakiniku shop's ホットココア isn't 肉, a supermarket's rice isn't コンビニ): else None, その他
SHOP_CAT = {
    'ramen': '麺', 'udon': '麺', 'soba': '麺', 'sushi': '寿司', 'gyudon': '丼・定食', 'teishoku': '丼・定食', 'bread': 'パン',
    'sweets': '菓子・デザート', 'confectionery': '菓子・デザート', **dict.fromkeys((
        'convenience supermarket bento cafe curry indian pizza okonomiyaki yakiniku yakitori tonkatsu karaage hamburg '
        'tempura chinese korean nabe italian fastfood family izakaya other-restaurant').split())}
SWEETS_SHOPS = ('sweets', 'confectionery')
# names that say what an item is: alcohol (never 飲料 or 汁物, never Atwater-checked), then drinks and sweets for a
# genre-less item. 酒 but not 甘酒, 酒蒸し, 酒かす, 酒場, 酒漬け; ハイ only ending a word (緑茶ハイ, not ハイビスカス);
# ノンアル, ハイボールテイスト, バージンモヒート aren't. A スパークリング drink may be wine: only spared the Atwater check.
ALCOHOL = re.compile(r'ビール|ハイボール|サワー(?!クリーム)|(?<!甘)酒(?!蒸|粕|かす|盗|場|漬)|ワイン(?!ビネガー|煮)|ストロング'
                     r'|ハイ(?=$|[\s（(＜<【［])|ウ[イィ]スキー|チューハイ|酎ハイ|焼酎(?!用)|ウォッカ|テキーラ|カナディアンクラブ|マイタイ'
                     r'|ブランデー(?!ケーキ|カステラ|マロン)|一合|カクテル(?!サラダ|シュリンプ)'
                     r'|カシス(?!シャーベット|ソース|ゼリー|ムース|ケーキ|ジャム|タルト|ジュース)')
NON_ALCOHOL = re.compile(r'ノンアル|オールフリー|テイスト|バージン|ヴァージン|スタイルバランス|黒酢'
                         r'|(?:ご飯|ごはん|ライス|飯).*一合|一合.*(?:ご飯|ごはん|ライス|飯)')
MAYBE_ALCOHOL = re.compile(r'スパークリング')   # 酒 when its kcal points to alcohol (sparkling_wine)
NAME_CAT = [(re.compile(r'ケーキ|パフェ|プリン|クレープ|ゼリー|アイスクリーム|ソフトクリーム|ジェラート'), '菓子・デザート'),
            (re.compile(r'ドリンク|ジュース|コーヒー|ティー|ラテ|ココア|ミルク|ソーダ|(?<!喫)茶(?!碗|漬|そば|蕎麦)'), '飲料'),
            (re.compile(r'アイス'), '菓子・デザート')]
# a pastry in a cafe that's a sweet, not bread (a sweets shop's pastries all are)
SWEET_PASTRY = re.compile(r'タルト|ケーキ|ブラウニー|マシュマロ|クッキー|マカロン|ワッフル')
# genre `snack`: a sweet only in a sweets shop or by its name (SNACK_SWEET); else the first SNACK_CAT the name says, else
# 副菜 (a restaurant's fries, edamame, メンマ), 菓子・デザート in a shop selling packaged snacks (RETAIL: chips, crackers)
RETAIL = ('convenience', 'supermarket')
SNACK_SWEET = re.compile(r'チョコ|ショコラ|クッキー|ビスケット|サブレ|キャンディ|キャンデー|飴|ドロップ|グミ|ガム|ケーキ|プリン|ゼリー'
                         r'|ドーナツ|マカロン|ワッフル|クレープ|パイ(?!ナップル)|タルト|マドレーヌ|フィナンシェ|バウム|カステラ|ブラウニー'
                         r'|マシュマロ|キャラメル|ラムネ|羊羹|ようかん|大福|団子|だんご|まんじゅう|饅頭|もなか|最中|わらび餅|せんべい|煎餅'
                         r'|おかき|あられ|かりんとう|クラッカー|プレッツェル|ポップコーン|チップス|スナック|菓子|甘納豆|どら焼|たい焼'
                         r'|アイス|ソフトクリーム|パフェ|あんみつ|ぜんざい|しるこ|スイーツ|スイートポテト|ラスク|らすく|ソイジョイ|バランスパワー'
                         r'|カロリーメイト|ベビースター|とんがりコーン|柿の種|柿ピー|ビスコ|チュロ|ポッキー|あんまん|おさつ'
                         r'|甘栗')
CHEESE = r'(?:チーズ(?:アソート|プラトー)?|カマンベール|ブリー|ゴルゴンゾーラ\S*|モッツァレラ|ゴーダ|チェダー|ミモレット)'
SNACK_CAT = [(re.compile(p), c) for p, c in (
    (r'ポテト|フレンチフライ|カーリーフライ|ハッシュブラウン|ハッシュド|いも|芋|じゃが', 'いも'),
    (r'枝豆|えだまめ|だだちゃ|そら(?:豆|まめ)|空豆|大豆|納豆|厚揚げ|冷や?奴|豆腐|豆富', '大豆・豆'),
    (r'ごぼう|ゴボウ|牛蒡|れんこん|蓮根|しいたけ|椎茸|きのこ|なす|茄子|オニオン|玉ねぎ|たまねぎ|コーン|野菜|キャベツ|きゅうり|胡瓜'
     r'|トマト|アスパラ|ブロッコリー|がっこ|漬|キムチ|メンマ|ザーサイ|搾菜|高菜|たこ焼|たこやき|ドッグ|ピザ|もち|餅|まん', '副菜'),
    (r'さきいか|あたりめ|するめ|(?<!か)いか|イカ|たこ(?!焼|やき|さん)|タコ(?!ス|焼|シェル|さん|ウ)|鱈|帆立|ほたて|ホタテ|えび|エビ|海老|かに|カニ|蟹|たら'
     r'|魚|さかな|フィッシュ|チータラ|サーモン|鮭|しらす|ちりめん|ししゃも|貝|ツナ', '魚介'),
    (r'サラミ|カルパス|ジャーキー|ソーセージ|ウ[イィ]ンナー|ベーコン|チキン|唐揚|から揚|からあげ|ナゲット|鴨|砂肝|せせり|ささみ|手羽',
     '肉'),
    (CHEESE + r'(?=$|[\s\d０-９（(【〜～])', '乳製品'),
    (r'ナッツ|アーモンド|くるみ|クルミ|胡桃|カシュー|ピスタチオ|マカダミア|ピーナッツ|落花生|ジャイアントコーン', 'ナッツ・種'),
    (r'プルーン|デーツ|レーズン|ドライ(?:マンゴー|パイン|いちじく|イチジク|アプリコット|クランベリー)|フルーツ', '果物'),
    (r'海苔|(?<!味)のり(?!塩)|わかめ|昆布|こんぶ|ひじき|もずく|めかぶ', '海藻'))]
# in a soup, ice-cream or dessert genre, the name's: a drink (a noun ending it, or a temperature in its last bracket;
# not a sweets shop's or a packaged ice's flavour: サーティワンのジャモカコーヒー, パピコ チョココーヒー), a rice dish (雑炊
# ... not オニオングラタンスープ), a jelly
SIDE_GENRES = ('soup', 'ice-cream', 'dessert')
TAIL_BRACKETS = re.compile(r'(?:[ \u3000]*[（(「【［][^（()）「」【】［］]*[)）」】］])+$')
DRINK_END = re.compile(r'(?<!アフタヌーン)(?:ティー|ラテ|ココア|コーヒー|珈琲|ジュース|オレ|ドリンク|スムージー|シェイク|フロート|ソーダ'
                       r'|チャイ)$')
DRINK_TEMP = re.compile(r'[（(][^（()）]*(?<![A-Za-z])(?:HOT|ICED?|ホット)(?![A-Za-z])[^（()）]*[)）]$')
ICE_FLAVOURS = ('sweets', 'confectionery') + RETAIL
NOT_A_DRINK = re.compile(r'×|アイスバー|ソフト(?!ドリンク)|ハーゲンダッツ|ジェラート')
RICE_DISH = re.compile(r'雑炊|粥|おじや|リゾット|ドリア|茶漬|クッパ')
# a rice-bowl genre's plain rice (ライス（中）, 半ライス, ごはん 200g) is a staple, not a 丼
PLAIN_RICE = re.compile(r'^[白半大中小並]?(?:ライス|ごはん|ご飯|白飯|白米|白めし|めし)(?:[大並小特]盛り?|[大中小並]|\d+g|単品)?$')

# Variants: trailing size / milk / temperature parts, in brackets (カフェ モカ（Tall・豆乳）, ココア（アイス）（Tall）, ライス「中」),
# after a space (牛丼 並盛) or glued to a Japanese stem (ライス中, アンチョビポテトS; not 特大). Each word's rank picks the
# group's default (lowest first: the regular size, plain milk, ICED: the commoner, 284 to 239 HOT); a takeout or
# all-you-can-eat copy (TO, ［お持ち帰り］, （テイクアウト）, （食べ放題）) is a state of its eat-in item, never the default.
SIZES = ['並盛', '並', 'レギュラー', 'R', 'Tall', 'M', 'Mサイズ', '中', 'ジャストサイズ', 'Short', 'S', 'Sサイズ', '小',
         '小盛', 'ミニ', 'ハーフ', 'Grande', 'L', 'Lサイズ', 'LL', 'XL', '大', '大盛', 'あたま大盛', 'Venti', '特盛', '超特盛',
         'メガ', 'ジャンボ']
MILKS = ['ミルク', '牛乳', '低脂肪乳', '無脂肪乳', '豆乳', 'アーモンドミルク', 'オーツミルク', 'ブレベ']
TEMPS = ['ICED', 'ICE', 'アイス', 'HOT', 'ホット']
RANK = {w: (0, i) for i, w in enumerate(SIZES)} | {w: (1, i) for i, w in enumerate(MILKS)} | \
    {w: (2, i) for i, w in enumerate(TEMPS)}
AXES = 3
# a size's magnitude, for the reversed-size check (a smaller one with more kcal: not shipped as official)
SIZE_MAG = {**dict.fromkeys(('Short', 'S', 'Sサイズ', '小', '小盛', 'ミニ', 'ハーフ'), 1),
            **dict.fromkeys(('並盛', '並', 'レギュラー', 'R', 'Tall', 'M', 'Mサイズ', '中'), 2),
            **dict.fromkeys(('Grande', 'L', 'Lサイズ', '大', '大盛', 'あたま大盛'), 3),
            **dict.fromkeys(('LL', 'XL', 'Venti', '特盛'), 4), **dict.fromkeys(('超特盛', 'メガ', 'ジャンボ'), 5)}
REVERSED = 1.05
BRACKET = re.compile(r'^(.+?)\s*[（(「【]([^（()）「」【】]+)[)）」】]$')
SPACED = re.compile(r'^(.+?)[ 　]+(\S+)$')
GLUED = re.compile(r'^(.*[^\x00-\x7f])(?<![特極超巨最])(並盛り?|大盛り?|特盛り?|小盛り?|[並大中小]|LL|[SMLＳＭＬ])$')
TAKEOUT_MARKS = [(re.compile(p), mark) for p, mark in (
    (r'^(?:T[Oo](?:[ \u3000]+|(?=[【\u3040-\u30ff\u4e00-\u9fff]))|[［\[【](?:お持ち帰り|持ち帰り|テイクアウト|持帰り?)[］\]】]'
     r'[ \u3000]*|(?:お持ち帰り|テイクアウト)用?(?:[ \u3000]+|[）)][ \u3000]*))', '持ち帰り'),
    (r'[ \u3000]*[（(](?:お持ち帰り|持ち帰り|テイクアウト用?|持帰り?|TO)[)）]$', '持ち帰り'),
    (r'[ \u3000]*[（(](?:よりどり)?食べ放題[)）]$', '食べ放題'))]
EAT_IN = {'持ち帰り': '店内', '食べ放題': '単品'}
# katakana spellings of the English sizes, as search aliases (トール, グランデ)
KANA = {'Short': 'ショート', 'Tall': 'トール', 'Grande': 'グランデ', 'Venti': 'ベンティ'}
KANA_RE = re.compile(r'\b(%s)\b' % '|'.join(KANA))


def num(x):
    """A finite number or None."""
    return x if isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) else None


def r1(x):
    return None if x is None else round(x + 1e-9, 1)


def val(r, k):
    """nutrients[k]'s value, None when the page doesn't show it."""
    n = r['nutrients'].get(k)
    return num(n.get('v')) if isinstance(n, dict) else None


def is_est(r, k):
    n = r['nutrients'].get(k)
    return isinstance(n, dict) and val(r, k) is not None and n.get('est') is True


def est_of(r):
    """'e': kcal estimated; 'p': official kcal, an estimated P, F or C; 's': official kcal and P/F/C, an estimated fibre
    or salt; None: all official."""
    if is_est(r, 'kcal'):
        return 'e'
    if any(is_est(r, k) for k in ('p', 'f', 'c')):
        return 'p'
    return 's' if any(is_est(r, k) for k in ('fiber', 'salt')) else None


def is_alcohol(name, cat=None):
    return cat == '酒' or bool(ALCOHOL.search(name) and not NON_ALCOHOL.search(name))


def snack_cat(name, kind):
    """A `snack` genre item's category: a sweet in a sweets shop or by its name, else what its name says (fries いも,
    edamame 大豆・豆, さきいか 魚介, a cheese 乳製品 ...), else 副菜 (a packaged snack's shop: 菓子・デザート)."""
    if kind in SWEETS_SHOPS or SNACK_SWEET.search(name):
        return '菓子・デザート'
    return next((c for pat, c in SNACK_CAT if pat.search(name)), '菓子・デザート' if kind in RETAIL else '副菜')


def side_cat(genre, name, kind):
    """A soup, ice-cream or dessert genre item the name says is a drink, a rice dish or a jelly; else None."""
    core = TAIL_BRACKETS.sub('', name).strip() or name
    flavour = genre == 'ice-cream' and kind in ICE_FLAVOURS or NOT_A_DRINK.search(name)
    if not flavour and (DRINK_END.search(core) or DRINK_TEMP.search(name)):
        return '飲料'
    if RICE_DISH.search(name) and 'スープ' not in name:
        return '主食'
    if 'グラタン' in name and 'スープ' not in name:
        return '主菜'
    return '菓子・デザート' if genre == 'soup' and 'ゼリー' in name else None


def plain_rice(name):
    return bool(PLAIN_RICE.match(re.sub(r'[\s\u3000]', '', TAIL_BRACKETS.sub('', name))))


def atwater_gap(r):
    """kcal over 4P + 9F + 4C beyond half and 50 kcal (+), under it (-), within (0); None without all three."""
    p, f, c = (val(r, k) for k in ('p', 'f', 'c'))
    if None in (p, f, c):
        return None
    atw, kcal = 4 * p + 9 * f + 4 * c, val(r, 'kcal')
    return 0 if abs(kcal - atw) <= max(atw / 2, 50) else (1 if kcal > atw else -1)


def sparkling_wine(r, name):
    """A スパークリング whose kcal is well over its P, F and C: the rest alcohol."""
    return bool(MAYBE_ALCOHOL.search(name)) and not NON_ALCOHOL.search(name) and atwater_gap(r) == 1


def cat_of(r, name):
    """The item's genre's category (a pastry in a sweets shop or a sweet one in a cafe: 菓子・デザート; an alcohol in a
    drink or soup genre: 酒; a snack by snack_cat; a soup, ice or dessert genre's drink, rice dish or jelly: side_cat;
    a rice-bowl's plain rice: 主食); a genre-less one's (missing, 'other'): its name's (alcohol, sweets, drinks), else
    its shop kind's where that says it (SHOP_CAT), else その他."""
    genre, kind = r.get('genre'), r.get('shop_category')
    cat = GENRE_CAT.get(genre)
    if genre == 'pastry' and (kind in SWEETS_SHOPS or kind == 'cafe' and SWEET_PASTRY.search(name)):
        return '菓子・デザート'
    if cat in (None, '飲料', '汁物') and (is_alcohol(name) or sparkling_wine(r, name)):
        return '酒'
    if genre == 'snack':
        return snack_cat(name, kind)
    if genre in SIDE_GENRES:
        return side_cat(genre, name, kind) or cat
    if genre == 'rice-bowl' and plain_rice(name):
        return '主食'
    if cat:
        return cat
    return next((c for pat, c in NAME_CAT if pat.search(name)), None) or SHOP_CAT.get(kind) or 'その他'


def implausible(r, name, cat):
    """kcal against Atwater (4P + 9F + 4C), all three shown: off by over half and 50 kcal is a source error (幸楽苑's
    メガたんめん at 47 kcal for 2,000). Alcohol is exempt (7 kcal/g of its own)."""
    p, f, c = (val(r, k) for k in ('p', 'f', 'c'))
    if None in (p, f, c) or is_alcohol(name, cat) or sparkling_wine(r, name):
        return False
    atw, kcal = 4 * p + 9 * f + 4 * c, val(r, 'kcal')
    # (and 0 kcal over 10 kcal of protein and fat: くら寿司's チキンサラダ at 0 kcal for 3.5/2 g; a 0 kcal jelly or
    # zero drink whose carbs are fibre or sweetener, 寒天ゼリー at 6 g, is a real zero)
    return abs(kcal - atw) > max(atw / 2, 50) or kcal <= 0 and 4 * p + 9 * f >= 10


# Name cleanup, from the real names: half-width kana (ﾈｷﾞ), control characters, newlines and doubled spaces, a trailing
# " /", Kaldi's 【賞味期限…】 and 【アウトレット】 tails and IKEA's certification (the same product: a near-duplicate);
# then, each only where two items' names wouldn't meet (ビッグボーイ's TO エビフライ is its takeout one, beside the eat-in
# エビフライ): a shop's leading order code (LEAD_CODES), a decoration (★…★, ♡, NEW！, 旧：, a half-bracket prefix 日替）), a
# ※ note (a bracketed (※2) anywhere, a trailing ※ソース別売 with no space or unclosed bracket after it, one before a last
# bracket) or a trailing price (（税込4,378円）, 12,000円, S：180円 -> S), a long name's tail.
HALF_KANA = re.compile('[\uff61-\uff9f]+')
CONTROL = re.compile('[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]')
LISTING_TAIL = re.compile(r'[ \u3000]*(?:【(?:[^】]*アウトレット|賞味期限[^】]*)】)+$')
CERTIFIED = re.compile(r'[,、 \u3000/]*レインフォレスト・アライアンス認証')
# each shop's order codes, a letter one only before a space, or for the takeout TO before 【 or Japanese (the shops whose
# names start so in the data; another shop's TOマト, M&M's stay)
TAKEOUT = r'TO(?=[ \u3000【]|[^\x00-\x7f])'
LEAD_CODES = {'bigboy': TAKEOUT, 'flying-garden': TAKEOUT, 'ringerhut': TAKEOUT, 'ikari-super': r'(?:【\d+】)+|[ＳＯM][ \u3000]',
              'cozy-corner': r'(?:【\d+】)+'}
LEAD_CODE = {shop: re.compile(r'^(?:%s)[ \u3000]*' % p) for shop, p in LEAD_CODES.items()}
SPACES = re.compile(r'[ \u3000]*[\t\r\n]+[ \u3000]*|[ \u3000]{2,}')  # a line break with its spaces: one space
TRAIL_SLASH = re.compile(r'[ \u3000]*/$')
NOTE = re.compile(r'[ \u3000]*(?:[（(]※[^（()）]*[)）]|※(?:[^\s（()）]|[（(][^（()）]*[)）])*$)')
NOTE_BEFORE = re.compile(r'^(.+?)[ \u3000]*※[^（()）※]*([（(]([^（()）]+)[)）])$')   # フラペチーノ ※カカオ分…（Tall）
PRICE = re.compile(r'[ \u3000]*(?:[（(]税込[\d,]+円[)）]|[:：]?[\d,]+円)$')
OLD = re.compile(r'^旧[：:][ \u3000]*')   # 旧：お子様ドリア, the old recipe: ended
DECOR = re.compile(r'[★☆♡♥♪‼\ufe0f]+')
NEW = re.compile(r'^(?:NEW|ＮＥＷ)[!！][ \u3000]*')
HALF_LABEL = re.compile(r'^([^（()）「」【】［］\s]{1,8})[）)][ \u3000]*(?=\S)')   # 日替）, 麵ランチ）: moved to the end


def tidy(name):
    """A name with the lossless cleanup; never empty."""
    s = HALF_KANA.sub(lambda m: unicodedata.normalize('NFKC', m.group()), CONTROL.sub('', name))
    s = CERTIFIED.sub('', LISTING_TAIL.sub('', SPACES.sub(' ', s).strip()))
    return TRAIL_SLASH.sub('', s).strip() or name.strip()


def uncoded(name, shop):
    """A tidy name without its shop's leading order code; never empty."""
    pat = LEAD_CODE.get(shop)
    return pat.sub('', name).strip() or name if pat else name


def undecorated(name):
    """A tidy name without its decorations (★蕎麦2倍★かつ丼 -> 蕎麦2倍 かつ丼), a leading NEW！ or 旧：, a leading
    half-bracket label moved to the end (秋限定）グレープゼリー -> グレープゼリー（秋限定））; never empty."""
    s = re.sub(r' (?=[（(【［)）】］]|$)', '', SPACES.sub(' ', DECOR.sub(' ', name)).strip()) if DECOR.search(name) else name
    s = NEW.sub('', OLD.sub('', s)).strip()
    m = HALF_LABEL.match(s)
    return (s[m.end():] + '（%s）' % m.group(1) if m else s) or name


def unsuffixed(name):
    """A tidy name without its ※ notes (but a size before them: フラペチーノ ※…（Tall）) and trailing prices; never
    empty."""
    m = NOTE_BEFORE.match(name)
    s = m.group(1) + m.group(2) if m and all(rank_of(w) for w in m.group(3).split('・')) else name
    while True:
        t = PRICE.sub('', NOTE.sub('', s)).strip()
        if t == s or not t:
            return s
        s = t


def short(name):
    """A name over NAME_MAX cut before its last bracket, else comma, else space, that leaves 10+ characters, else at
    NAME_MAX (IKEA's ..., オーツ＆キャラメル レインフォレスト・アライアンス認証, 240 g: not at ", 240")."""
    if len(name) <= NAME_MAX:
        return name
    for marks in ('（(【［《〈＜<「', ',、', ' \u3000'):
        cuts = [i for i, ch in enumerate(name[:NAME_MAX + 1]) if ch in marks and i >= 10]
        if cuts:
            return name[:cuts[-1]].rstrip(' \u3000,、・')
    return name[:NAME_MAX].rstrip()


def dup_key(name):
    """Names that differ only in full / half width or spaces are the same."""
    return re.sub(r'\s', '', unicodedata.normalize('NFKC', name))


def rank_of(w):
    """A state word's (axis, rank), None when it isn't one (Ｓ reads as S)."""
    return RANK.get(w) or RANK.get(unicodedata.normalize('NFKC', w).rstrip('り'))


def variant_of(name):
    """(stem, state, rank, {axis: word}) for a name ending in size / milk / temperature words, each axis once (ココア
    （アイス）（Tall・豆乳）: アイス・Tall・豆乳; a spaced or glued word only last: not チョコレート ミルク（HOT）), else None."""
    stem, parts, words = name, [], {}
    while True:
        for pat, sep in ((BRACKET, '・'), (SPACED, None), (GLUED, None)):
            m = (not parts or pat is BRACKET) and pat.match(stem)   # spaced or glued: the last part only
            ws = (m.group(2).split(sep) if sep else [m.group(2)]) if m else []
            axes = [rank_of(w) and rank_of(w)[0] for w in ws]
            if ws and all(a is not None for a in axes) and len(set(axes)) == len(axes) and not set(axes) & set(words):
                words.update(zip(axes, ws))
                stem, parts = m.group(1).strip(), [m.group(2)] + parts
                break
        else:
            break
    if not parts or not stem:
        return None
    rank = tuple(rank_of(words[a])[1] if a in words else 0 for a in range(AXES))
    return stem, '・'.join(parts), rank, words


def takeout_of(name):
    """(the eat-in name, 持ち帰り or 食べ放題) for a takeout or all-you-can-eat copy's name, else None."""
    for pat, mark in TAKEOUT_MARKS:
        base = pat.sub('', name, count=1).strip()
        if base != name and base:
            return base, mark
    return None


def same_values(a, b):
    """The same kcal, and P, F, C and salt the same where both show them, or estimated in both (est e or p)."""
    return a['kcal'] == b['kcal'] and (all(a.get(k) is None or b.get(k) is None or a[k] == b[k]
                                           for k in ('p', 'f', 'c', 'salt'))
                                       or a.get('est') in ('e', 'p') and b.get('est') in ('e', 'p'))


def takeout_twins(items):
    """The takeout / all-you-can-eat copies (takeout_of) of an eat-in item of the shop with the same values: dropped."""
    eat_in = {(it['shop'], it['name']): it for it in items}
    out = set()
    for it in items:
        t = takeout_of(it['name'])
        twin = t and eat_in.get((it['shop'], t[0]))
        if twin and same_values(it, twin):
            out.add(it['id'])
    return out


def label_key(label):
    """A state label to compare: NFKC, each word's trailing り off (特盛り is 特盛, Ｍ is M)."""
    return '・'.join(unicodedata.normalize('NFKC', w).rstrip('り') for w in label.split('・'))


def group_variants(items):
    """`vg` (the group's default item's id) and `st` (its state chip) on a shop's items that differ only in their
    trailing size / milk / temperature words or a takeout mark: 2+ items in distinct states (an unmarked item joins
    only beside its own takeout copy: 店内 · 持ち帰り). The default: a current item, eaten in, the regular size, plain
    milk, ICED. Returns the reversed sizes: a smaller size with over 5 % more kcal than a larger one beside it (the
    same milk, temperature and mark), its est set to 'e'."""
    groups = {}
    for it in items:
        t = takeout_of(it['name'])
        base, mark = t if t else (it['name'], None)
        v = variant_of(base) or (base, '', (0,) * AXES, {})
        groups.setdefault((it['shop'], v[0]), []).append({'it': it, 'st': v[1], 'rank': v[2], 'words': v[3], 'mark': mark})
    reversed_ = []
    for g in groups.values():
        marks = {e['mark'] for e in g if e['mark']}
        bare_ok = any(e['mark'] and not e['st'] for e in g)
        g = [e for e in g if e['st'] or e['mark'] or bare_ok]
        for e in g:
            eat_in = EAT_IN['持ち帰り' if '持ち帰り' in marks else '食べ放題'] if marks else ''
            e['label'] = '・'.join(x for x in (e['st'], e['mark'] or ('' if e['st'] else eat_in)) if x)
        if len(g) < 2 or len({label_key(e['label']) for e in g}) < len(g):
            continue
        g.sort(key=lambda e: ('ended' in e['it'], bool(e['mark']), e['rank'], e['it']['kcal']))
        for e in g:
            e['it']['vg'], e['it']['st'] = g[0]['it']['id'], e['label']
        for a in g:
            for b in g:
                same = all(a['words'].get(x) == b['words'].get(x) for x in range(1, AXES)) and a['mark'] == b['mark']
                ma, mb = (SIZE_MAG.get(unicodedata.normalize('NFKC', e['words'].get(0, '')).rstrip('り')) for e in (a, b))
                if same and ma and mb and ma < mb and a['it']['kcal'] > REVERSED * b['it']['kcal'] \
                        and a['it'] not in reversed_:
                    reversed_.append(a['it'])
    for it in reversed_:
        it['est'] = 'e'
    return reversed_


def shard_files(paths):
    """The shard files named, a directory standing for its shard-*.jsonl."""
    out = []
    for p in paths:
        out += sorted(glob.glob(os.path.join(p, 'shard-*.jsonl'))) if os.path.isdir(p) else [p]
    return out


def newer(r, than):
    return str(r.get('fetched_at') or '') >= str(than.get('fetched_at') or '')


def read_rows(paths):
    """(rows, report): each product's latest v2 line (one with `nutrients`), in file order of first sight. v1 lines
    and lines that don't parse (a half-written last line) are counted and skipped; a `gone` line without `nutrients`
    marks the product's latest v2 line gone (when it isn't older)."""
    latest, gone, rep = {}, {}, {'lines': 0, 'v1': 0, 'bad': 0, 'gone': 0}
    for path in shard_files(paths):
        with open(path, encoding='utf-8') as fh:
            for line in fh:
                if not line.strip():
                    continue
                rep['lines'] += 1
                try:
                    r = json.loads(line)
                except ValueError:
                    rep['bad'] += 1
                    continue
                if isinstance(r, dict) and r.get('gone') is True and not isinstance(r.get('nutrients'), dict):
                    key = (r.get('shop'), r.get('id'))
                    if key not in gone or newer(r, gone[key]):
                        gone[key] = r
                    continue
                if not isinstance(r, dict) or not isinstance(r.get('nutrients'), dict):
                    rep['v1'] += 1
                    continue
                key = (r.get('shop'), r.get('id'))
                if key not in latest or newer(r, latest[key]):
                    latest[key] = r
    for key, g in gone.items():
        if key in latest and newer(g, latest[key]):
            latest[key] = {**latest[key], 'gone': True, 'gone_since': g.get('gone_since') or g.get('fetched_at')}
            rep['gone'] += 1
    rep['products'] = len(latest)
    return list(latest.values()), rep


def norm(s):
    """A name or brand to compare: NFKC, lower case, no spaces or dashes or ・."""
    return re.sub(r'[\s\-・]', '', unicodedata.normalize('NFKC', s or '').lower())


def off_names(items):
    """{OFF product name: [(its brand (norm), its values per 100 g)]} from products.json's items."""
    out = {}
    for it in items:
        out.setdefault(it['name'], []).append((norm(it.get('brand')), {k: num(it.get(k)) for k in ('kcal', 'p', 'f', 'c')}))
    return out


def same_maker(brands, words):
    """Whether an OFF brand names the shop (either holds the other; 3+ characters, so 'co' names nobody)."""
    return any(len(b) >= 3 and len(w) >= 3 and (b in w or w in b) for b in brands for w in words)


def same_serving(r, per100):
    """Whether the row is the OFF label's values for one serving: the servings its kcal, P, F and C imply (each against
    the label's per 100 g, where that's 10 kcal / 1 g or more) agree within SERVING_SPREAD; no evidence counts as yes."""
    g = [val(r, k) / per100[k] for k in ('kcal', 'p', 'f', 'c')
         if val(r, k) is not None and (per100.get(k) or 0) >= (10 if k == 'kcal' else 1)]
    return not g or max(g) <= SERVING_SPREAD * min(g)


def off_product(r, names, off, words):
    """The row is an OFF product's (the same name, the shop its brand), in a shop selling packaged food (OFF_RETAIL) and
    with the label's values for a serving (same_serving): its label per 100 g wins. A restaurant's dish of a packaged
    product's name, or other values, stays."""
    if r.get('shop_category') not in OFF_RETAIL:
        return False
    return any(same_maker({b}, words) and same_serving(r, v) for n in names for b, v in off.get(n, ()))


def parse_ts(x):
    """An ISO time (UTC when it says no zone), None when it isn't one."""
    try:
        t = datetime.fromisoformat(str(x).replace('Z', '+00:00'))
    except ValueError:
        return None
    return t if t.tzinfo else t.replace(tzinfo=timezone.utc)


def since_days(r, field, asof):
    """Days from the row's `field` (gone_since / ended_since: the scraper's first fetch that saw it so) to asof."""
    t = parse_ts(r.get(field)) if r.get(field) else None
    return None if t is None else (asof - t).total_seconds() / 86400


def retired(r, asof):
    """A product gone from the site over RETAIN['gone'] days, or discontinued (ended, unlisted) over RETAIN['ended']
    (each doubled for an official kcal: worth more, seasonal menus return within the year)."""
    if asof is None:
        return False
    k = 2 if not is_est(r, 'kcal') and r.get('ended') is not True else 1
    # (older lines carry no date: the line's own fetch, the first that saw it so or later, stands in)
    gone, ended = (since_days(r, f, asof) if r.get(f) else since_days(r, 'fetched_at', asof)
                   for f in ('gone_since', 'ended_since'))
    return r.get('gone') is True and gone is not None and gone > k * RETAIN['gone'] \
        or ended_of(r) and ended is not None and ended > k * RETAIN['ended']


def as_of(rows):
    """The data's date: its latest fetch (so a conversion gives the same bytes whenever it runs); None with none."""
    return max((t for t in (parse_ts(r.get('fetched_at')) for r in rows if r.get('fetched_at')) if t), default=None)


def per_person(r, name):
    """A platter that says it feeds N (上助六５人前, Regular SET (3名様)): (its row with each value divided by N, its name
    with （1人前）), else None (never a 福袋, a gift set or a kilo challenge; nor one whose share would be under
    PLATTER_SHARE kcal: already per person)."""
    m = PLATTER.search(unicodedata.normalize('NFKC', name))
    if not m or NOT_SPLIT.search(name) or int(m.group(1)) < 2:
        return None
    n = int(m.group(1))
    if in_range(r) and val(r, 'kcal') / n < PLATTER_SHARE:
        return None
    nut = {k: {**v, 'v': v['v'] / n} if isinstance(v, dict) and num(v.get('v')) is not None else v
           for k, v in r['nutrients'].items()}
    return {**r, 'nutrients': nut}, name + '（1人前）'


def in_range(r):
    vals = [val(r, k) for k in ('p', 'f', 'c', 'salt', 'fiber')]
    return 0 <= val(r, 'kcal') <= KCAL_MAX and all(v is None or 0 <= v <= NUTRIENT_MAX for v in vals) \
        and (vals[4] or 0) <= FIB_MAX


def ended_of(r):
    """The page says 販売終了かも (`ended`), the listing no longer shows it (`listed: false`) or the site lost it (`gone`)."""
    return r.get('ended') is True or r.get('listed') is False or r.get('gone') is True


def item_of(r, name, cat):
    it = {'id': 'kal:%s' % r['id'], 'name': name, 'shop': r['shop'], 'cat': cat,
          'kcal': int(math.floor(val(r, 'kcal') + 0.5))}
    for k in ('p', 'f', 'c', 'salt'):
        it[k] = r1(val(r, k))
    if val(r, 'fiber') is not None:
        it['fib'] = r1(val(r, 'fiber'))
    est = est_of(r)
    if est is None and (r.get('ended') or ended_of(r)):
        est = 'e'  # a 販売終了かも page shows no 推定 badges at all: its values' status is unknown, so never 'official'
    if est:
        it['est'] = est
    img = r.get('image_id')
    if isinstance(img, int) and not isinstance(img, bool) and img > 0:
        it['img'] = img
    if KANA_RE.search(it['name']):
        it['aliases'] = [KANA_RE.sub(lambda m: KANA[m.group(1)], it['name'])]
    if ended_of(r):
        it['ended'], it['pop'] = True, -1
    return it


def apart(r, r0):
    """Two near-duplicates both listed with an official kcal, over DUP_APART apart."""
    ks = [val(x, 'kcal') for x in (r, r0)]
    return all(not ended_of(x) and not is_est(x, 'kcal') for x in (r, r0)) and max(ks) > DUP_APART * min(ks)


def better(r):
    """The key of the near-duplicate kept: a current one, then the latest lastmod, then the higher id."""
    i = str(r.get('id'))
    return (not ended_of(r), str(r.get('lastmod') or ''),
            (int(i), '') if i.isdigit() else (-1, i))


def read_shops(path=ALIASES):
    """({shop: our aliases}, {shop: our display name}) from data_src/kalori_shops.json: a shop's value is its aliases,
    or {name, aliases?}."""
    with open(path, encoding='utf-8') as fh:
        doc = json.load(fh)
    doc = {k: v for k, v in doc.items() if not k.startswith('_')}
    aliases = {k: v if isinstance(v, list) else v.get('aliases', []) for k, v in doc.items()}
    return {k: v for k, v in aliases.items() if v}, {k: v['name'] for k, v in doc.items() if isinstance(v, dict)}


def read_aliases(path=ALIASES):
    return read_shops(path)[0]


def convert(rows, aliases=None, off=None, names=None):
    """(dataset, report): rows = read_rows's (format v2), aliases / names = our shop aliases / display names
    (read_shops), off = off_names."""
    aliases, off, our_names = aliases or {}, off or {}, names or {}
    drop = {'no_values': 0, 'long_name': 0, 'range': 0, 'implausible': 0, 'off_product': 0, 'duplicate': 0,
            'near_duplicate': 0, 'takeout_twin': 0, 'retired': 0}
    fixed = {'per_person': 0, 'pfc_unknown': 0, 'apart_kept': 0}
    kept, seen, unknown, shop_names = {}, set(), {}, {}
    asof = as_of(rows)
    for r in rows:
        raw = (r.get('name') or '').strip()
        if not raw or val(r, 'kcal') is None or not r.get('shop') or r.get('id') in (None, ''):
            drop['no_values'] += 1
            continue
        if retired(r, asof):
            drop['retired'] += 1
            continue
        name = tidy(raw)
        if OLD.match(name):
            r = {**r, 'ended': True}
        pp = per_person(r, name)
        if pp:
            (r, name), fixed['per_person'] = pp, fixed['per_person'] + 1
        if not in_range(r):
            drop['range'] += 1
            continue
        for field, known in (('genre', GENRE_CAT), ('shop_category', SHOP_CAT)):
            if r.get(field) not in (None, 'other') and r[field] not in known:   # 'other': as if none
                unknown.setdefault('%s:%s' % (field, r[field]), 0)
                unknown['%s:%s' % (field, r[field])] += 1
        cat = cat_of(r, name)
        if implausible(r, name, cat):
            # an official kcal with estimated P, F, C that don't add up: the kcal alone (P, F, C unknown)
            if is_est(r, 'kcal') or val(r, 'kcal') <= 0 or not any(is_est(r, k) for k in ('p', 'f', 'c')):
                drop['implausible'] += 1
                continue
            r = {**r, 'nutrients': {k: v for k, v in r['nutrients'].items() if k not in ('p', 'f', 'c')}}
            fixed['pfc_unknown'] += 1
        shop_name = (r.get('shop_name') or '').strip() or r['shop']
        if off_product(r, {raw, name}, off, {norm(w) for w in [shop_name, *aliases.get(r['shop'], [])]}):
            drop['off_product'] += 1
            continue
        if r['id'] in seen:
            drop['duplicate'] += 1
            continue
        seen.add(r['id'])
        # a near-duplicate of a kept sibling: the better one stays; apart from every sibling (both listed and official,
        # over 10 % apart): another food, under its own name
        sibs = kept.setdefault((r['shop'], dup_key(name)), [])
        near = next((i for i, x in enumerate(sibs) if not apart(r, x[0])), None)
        if near is None:
            fixed['apart_kept'] += bool(sibs)
            sibs.append((r, name, cat))
        else:
            drop['near_duplicate'] += 1
            if better(r) > better(sibs[near][0]):
                sibs[near] = (r, name, cat)
        shop_names[r['shop']] = shop_name
    # the lossy steps (an order code, a trailing note or price, a long name's tail), each only where no names would meet
    final = {(shop, r['id']): [r, name, cat] for (shop, _), sibs in kept.items() for r, name, cat in sibs}
    for cut in (uncoded, undecorated, unsuffixed, short):
        cuts = {k: cut(v[1], k[0]) if cut is uncoded else cut(v[1]) for k, v in final.items()}
        taken = Counter((k[0], dup_key(name)) for k, name in cuts.items())
        for k, v in final.items():
            if taken[(k[0], dup_key(cuts[k]))] == 1:
                v[1] = cuts[k]
    items, renamed = [], 0
    for r, name, cat in final.values():
        if len(name) > NAME_MAX:
            drop['long_name'] += 1
            continue
        items.append(item_of(r, name, cat))
        renamed += name != r['name'].strip()
    twins = takeout_twins(items)
    items = [it for it in items if it['id'] not in twins]
    drop['takeout_twin'] = len(twins)
    reversed_ = group_variants(items)
    items.sort(key=lambda it: (it['shop'], it['id']))
    shops = {it['shop'] for it in items}
    header = {s: {'name': our_names.get(s) or shop_names[s], **({'aliases': aliases[s]} if aliases.get(s) else {})}
              for s in sorted(shops)}
    report = {'items': len(items), 'shops': len(header), 'dropped': drop,
              'est': {k or 'official': sum(it.get('est') == k for it in items) for k in ('e', 'p', 's', None)},
              'cats': dict(sorted(Counter(it['cat'] for it in items).items(), key=lambda kv: -kv[1])),
              'ended': sum('ended' in it for it in items), 'other_cat': sum(it['cat'] == 'その他' for it in items),
              'renamed': renamed, **fixed,
              'reversed': sorted('%s %s %s' % (it['shop'], it['id'], it['name']) for it in reversed_),
              'img': sum('img' in it for it in items), 'grouped': sum('vg' in it for it in items),
              'unknown_kinds': dict(sorted(unknown.items())),
              'unknown_alias_shops': sorted((set(aliases) | set(our_names)) - shops)}
    return {**META, 'shops': header, 'items': items}, report


def errors(doc):
    """What the shipped file must hold beyond lib.validate (the app's FoodSnap limits); [] when sound."""
    errs, ids = [], set()
    for it in doc['items']:
        i = it.get('id')
        if not isinstance(i, str) or not i.startswith('kal:') or i in ids:
            errs.append('%s: bad or repeated id' % i)
        ids.add(i)
        if not it.get('name') or len(it['name']) > NAME_MAX or it.get('shop') not in doc['shops']:
            errs.append('%s: name or shop' % i)
        if not isinstance(it.get('kcal'), int) or not 0 <= it['kcal'] <= KCAL_MAX:
            errs.append('%s: kcal' % i)
        if any(it.get(k) is not None and not 0 <= it[k] <= NUTRIENT_MAX for k in ('p', 'f', 'c', 'salt', 'fib')):
            errs.append('%s: nutrient' % i)
        if any(k in it for k in LOADER_KEYS):
            errs.append("%s: brand, sv or portions (the loader's)" % i)
    errs += ['%s: vg names no item' % it['id'] for it in doc['items'] if 'vg' in it and it['vg'] not in ids]
    return errs


def partial(report, env=os.environ):
    """Why the dataset looks partial (one of our shops, data_src/kalori_shops.json, with no items; under ITEMS_MIN
    items), None when whole or PARTIAL_ENV=1."""
    why = (['no items for %s' % ', '.join(report['unknown_alias_shops'])] if report['unknown_alias_shops'] else []) + \
        (['%d items, under %d' % (report['items'], ITEMS_MIN)] if report['items'] < ITEMS_MIN else [])
    if why and env.get(PARTIAL_ENV) != '1':
        return 'kalori: partial input (%s); fetch all shards, or %s=1 to write it anyway' % ('; '.join(why), PARTIAL_ENV)
    return None


def build(paths, off_items=()):
    """(dataset, report) from the shard files (or their directory) and products.json's items."""
    rows, read = read_rows(paths)
    aliases, names = read_shops()
    doc, report = convert(rows, aliases, off_names(off_items), names)
    return doc, {'read': read, **report}


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('paths', nargs='+', help='raw/kalori/ or shard-*.jsonl files')
    ap.add_argument('--off', help="products.json whose names win (build.py uses its own)")
    ap.add_argument('--out', help='write the dataset here too (build.py writes out/kalori.json)')
    a = ap.parse_args(argv)
    sys.path.insert(0, HERE)
    import lib   # what build.py's kalori target adds: its tidy and validate, so --out writes the file it would
    off = []
    if a.off and os.path.exists(a.off):
        with open(a.off, encoding='utf-8') as fh:
            off = lib.dataset_items(json.load(fh))   # app/static/food/products.json ships by column
    doc, report = build(a.paths, off)
    for it in doc['items']:
        lib.tidy(it)
    errs = errors(doc) + lib.validate(doc)
    if errs:
        sys.exit('kalori: %d problems, e.g. %s' % (len(errs), errs[:5]))
    why = a.out and partial(report)
    if why:
        sys.exit(why)
    if a.out:
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        with open(a.out, 'w', encoding='utf-8') as fh:
            fh.write(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main(sys.argv[1:])
