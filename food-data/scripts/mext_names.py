"""MEXT 八訂増補2023 -> foods.json: display names, categories, aliases and portions for all 2,538 foods.

build(rows) takes lib.mext_rows() and returns the dataset doc. Curated overrides (name|pop|en|aliases|portions|cat)
live in scripts/mext_overrides.txt; everything else is rule-based from the official name, group and 備考.
"""
import os, re, sys
from collections import Counter, defaultdict

from lib import HERE, MEXT_CODES, kata2hira, kcal_int as r0, mext_num as num, nutrients

OVR = os.path.join(HERE, 'mext_overrides.txt')
META = {
    'source': 'mext',
    'label': '日本食品標準成分表（八訂）増補2023年',
    'attribution': '日本食品標準成分表（八訂）増補2023年から引用（文部科学省）。表示名・別名・目安量は本アプリで加工・追加。',
    'license': '公共データ利用規約1.0 / CC BY 4.0 compatible',
    'url': 'https://www.mext.go.jp/a_menu/syokuhinseibun/mext_00001.html',
}

# --------------------------------------------------------------------------- name rules

PLANT_PARTS = {
    '葉', '根', '果実', '結球葉', '塊茎', '塊根', '球茎', '花序', 'りん茎', '若茎', '茎葉', '若ざや', '花らい',
    '花らい・茎', '根茎', '芽ばえ', '未熟種子', '葉柄', '花穂', '肉芽', '胞子茎', '若芽', '砂じょう', 'じょうのう',
    '果肉', '全果', '未熟豆', '茎', 'りん茎葉', '花びら', '幼雌穂', '葉･果実', '根・茎葉', '花茎', '花茎・花らい',
    'りん茎及び葉', '干し若芽', '若葉', '軟白', 'じょうのう及びアルベド', '実',
}
DROP_L0 = {'通年平均', '漬物', '加工品', '全粒', '半固体状ドレッシング', '分離液状ドレッシング', '乳化液状ドレッシング',
           '米みそ', '果実飲料'}
DISPLAY_REPL = {'中華スタイル即席カップめん': 'カップめん', '和風スタイル即席カップめん': '和風カップめん',
                '即席中華めん': 'インスタントラーメン', '調理後全体': '調理後（スープ含む）', '調理後のめん': '調理後（めんのみ）',
                '皮下脂肪なし': '脂身なし'}
PART_WORDS = {'かた', 'かたロース', 'ロース', 'リブロース', 'サーロイン', 'ばら', 'もも', 'そともも', 'ランプ', 'ヒレ',
              'むね', 'ささみ', '手羽', '手羽さき', '手羽もと'}
NOTE_MAP = {
    '添付調味料等を含むもの': 'スープ含む', '添付調味料等を含まないもの': 'めんのみ', 'スープを残したもの': 'スープ残し',
    '生を揚げたもの': '生から', '市販冷凍食品を揚げたもの': '冷凍品', '凝固剤：塩化マグネシウム': 'にがり',
    '凝固剤：硫酸カルシウム': 'すまし粉', 'あめ色たまねぎ': 'あめ色', '沸騰水で短時間加熱したもの': '',
}
GENERIC_FIRST = {'漬物', '加工品', '缶詰', '果実飲料', '水煮缶詰'}
ANIMAL = {'うし': '牛', 'ぶた': '豚', 'にわとり': '鶏', 'めんよう': '羊', 'うま': '馬', 'しか': '鹿',
          'しちめんちょう': '七面鳥', 'ほろほろちょう': 'ほろほろ鳥'}
MEAT_QUAL = {'和牛肉': '和牛', '乳用肥育牛肉': '国産牛', '交雑牛肉': '交雑牛', '輸入牛肉': '輸入牛', '子牛肉': '子牛',
             '親・主品目': '親鶏', '親・副品目': '親鶏', 'マトン': 'マトン', 'ラム': 'ラム'}
MEAT_PART = {'かた': '肩', 'かたロース': '肩ロース', 'ばら': 'バラ', 'むね': 'むね肉', 'もも': 'もも肉',
             '手羽さき': '手羽先', '手羽もと': '手羽元'}
ORGAN = {'舌': 'タン', '心臓': 'ハツ', '肝臓': 'レバー', 'じん臓': 'マメ（じん臓）', 'すなぎも': '砂肝',
         '横隔膜': 'ハラミ', '第一胃': 'ミノ', '第二胃': 'ハチノス', '第三胃': 'センマイ', '第四胃': 'ギアラ',
         '腱': 'すじ', '尾': 'テール', '胃': 'ガツ（胃）'}
RICE = {'水稲穀粒': '米', '水稲めし': 'ごはん', '水稲軟めし': '軟飯', '水稲全かゆ': '全がゆ', '水稲五分かゆ': '五分がゆ',
        '水稲おもゆ': 'おもゆ', '陸稲穀粒': '陸稲米', '陸稲めし': '陸稲ごはん'}
G01_BASE = {'こむぎ': '小麦', 'おおむぎ': '大麦', 'ライむぎ': 'ライ麦', 'とうもろこし': 'とうもろこし'}


def split_tokens(name):
    return [t for t in re.split(r'[\s　]+', name.strip()) if t]


def is_paren(t):
    return t.startswith('（') and t.endswith('）')


def analyse(rec):
    """Official name -> [(kind, text)], kinds: main, part, note, drop0, br."""
    g = rec['group']
    toks = [t for t in split_tokens(rec['name']) if not (t.startswith('＜') and t.endswith('＞'))]
    cls = None
    while toks and is_paren(toks[0]):
        cls = toks.pop(0)[1:-1]
    if g == '18':
        toks = toks[1:]
        if toks and (toks[0].endswith('類') or toks[0] in ('その他',)):
            toks = toks[1:]
        if toks and toks[0] == 'フライ用冷凍食品':
            toks = toks[1:]
            if toks and toks[-1] == '冷凍':
                toks[-1] = '冷凍（揚げる前）'
    if toks and toks[0] in GENERIC_FIRST and cls:
        toks.insert(0, re.sub(r'類$', '', cls))
    out = []
    for i, t in enumerate(toks):
        if g == '16' and t == '茶':
            out.append(('main', '（茶葉）'))
        elif t.startswith('［'):
            out.append(('br', t[1:-1]))
        elif is_paren(t):
            inner = t[1:-1]
            out.append(('note', NOTE_MAP.get(inner, inner)))
        elif t in PLANT_PARTS and i > 0:
            out.append(('part', t))
        elif t in DROP_L0 and len(toks) > 1:
            out.append(('drop0', t))
        else:
            out.append(('main', t))
    return out


def build_tokens(rec, toks, keep_parts, keep_notes, keep_drop0, keep_br):
    g = rec['group']
    toks = list(toks)
    res = []
    # ---- group specific restructuring
    if g == '01' and toks and toks[0][1] == 'こめ' and len(toks) > 1 and toks[1][0] == 'br' and toks[1][1] in RICE:
        base = RICE[toks[1][1]]
        rest = [t for k, t in toks[2:] if k in ('main', 'part') or (k == 'note' and keep_notes)]
        if not keep_drop0 and len(rest) > 1 and 'うるち米' in rest:
            rest.remove('うるち米')
        if rest:
            return [base + '（' + '・'.join(rest) + '）']
        return [base]
    if g in ('01', '04') and len(toks) > 1 and toks[1][0] == 'br':
        first = toks[0][1]
        brt = toks[1][1]
        if brt == '玄穀':
            toks = [('main', G01_BASE.get(first, first) + '（玄穀）')] + toks[2:]
        else:
            toks = ([('br', brt)] if keep_br else []) + toks[2:]
    if g == '11' and toks and toks[0][1] in ANIMAL or (g == '11' and len(toks) > 1 and toks[1][0] == 'br'):
        animal_raw = toks[0][1]
        animal = ANIMAL.get(animal_raw, animal_raw)
        rest = toks[1:]
        prefix = animal
        suffix = []
        organ_ctx = False
        if rest and rest[0][0] == 'br':
            q = rest[0][1]
            rest = rest[1:]
            organ_ctx = q in ('副生物', '副品目')
            if q in MEAT_QUAL:
                prefix = MEAT_QUAL[q] if animal in ('牛', '鶏') else animal + MEAT_QUAL[q]
                if animal == '羊':
                    prefix = MEAT_QUAL[q]
            elif q == 'ひき肉':
                prefix = animal + 'ひき肉'
            elif q == '中型種肉':
                suffix = ['（中型種）']
            elif q in ('ハム類', 'プレスハム類', 'ベーコン類', 'ソーセージ類', 'その他', '加工品'):
                prefix = ''
            elif q in ('副生物', '副品目'):
                pass
            elif keep_br and q not in ('大型種肉', '若どり・主品目', '若どり・副品目', '二次品目'):
                suffix = ['（' + q + '）']
        if rest and rest[0][0] == 'main' and prefix:
            p = rest[0][1]
            if p == '肉':
                rest = rest[1:]
                prefix = prefix + '肉'
            elif p in ORGAN:
                prefix = prefix + ORGAN[p]
                rest = rest[1:]
            elif p == 'ひき肉':
                prefix = prefix + 'ひき肉'
                rest = rest[1:]
            elif p == '皮' and animal == '鶏':
                prefix = '鶏皮'
                rest = rest[1:]
            elif p in PART_WORDS and animal_raw in ANIMAL or organ_ctx:
                prefix = prefix + MEAT_PART.get(p, p)
                rest = rest[1:]
        toks = ([('main', prefix)] if prefix else []) + rest + [('main', x) for x in suffix]
    if g == '11':   # merge a later '肉' token into the preceding token (e.g. かも あひる 肉 -> あひる肉)
        merged = []
        for k, t in toks:
            if t == '肉' and merged and merged[-1][0] == 'main':
                merged[-1] = ('main', merged[-1][1] + '肉')
            else:
                merged.append((k, t))
        toks = merged
    if g == '13':
        new = []
        for j, (k, t) in enumerate(toks):
            if t == 'ナチュラルチーズ' and j + 1 < len(toks):
                nxt = toks[j + 1][1]
                toks[j + 1] = ('main', nxt if nxt.endswith('チーズ') else nxt + 'チーズ')
                continue
            new.append((k, t))
        toks = new
    for k, t in toks:
        if k == 'main':
            res.append(t)
        elif k == 'part' and keep_parts(t):
            res.append(t)
        elif k == 'note' and keep_notes and t:
            res.append('（' + t + '）')
        elif k == 'drop0' and keep_drop0:
            res.append(t)
        elif k == 'br' and keep_br:
            res.append(t)
    # dedupe: drop token contained in the next token, or contained in previous
    out = []
    for t in res:
        if out and (t == out[-1] or (len(t) >= 2 and t in out[-1] and not t.startswith('（'))):
            continue
        if out and out[-1] in t and not out[-1].startswith('（') and len(out[-1]) >= 2:
            out[-1] = t
            continue
        out.append(t)
    return out


def join_tokens(toks):
    s = ''
    for t in toks:
        t = DISPLAY_REPL.get(t, t)
        if s and not t.startswith('（'):
            s += ' '
        s += t
    return s

# --------------------------------------------------------------------------- categories

def category(rec, name):
    g = rec['group']
    n = rec['name']
    if g == '01':
        if '［パン類］' in n or 'パン' in name and '米粉パン' in n:
            return 'パン'
        if re.search(r'めん|うどん|そうめん|そば　そば|干しそば|半生そば|マカロニ|スパゲッティ|パスタ|ビーフン|冷めん|大麦めん', n) \
                and 'そば粉' not in n and 'そば米' not in n:
            return '麺'
        if re.search(r'小麦粉|プレミックス|パン粉|皮|ピザ生地|はいが|たんぱく|ふ類|でん粉|上新粉|米粉\b|白玉粉|道明寺粉|米ぬか|こうじ|そば粉|コーンミール|コーングリッツ|コーンフラワー|ライ麦粉|全粒粉|玄米粉', n) \
                and 'めん' not in n:
            return 'その他'
        return '主食'
    if g == '02':
        if re.search(r'はるさめ|でん粉めん|くずきり', n):
            return '麺'
        if 'でん粉' in n:
            return 'その他'
        return 'いも'
    if g == '03':
        return '調味料'
    if g == '04':
        if '豆乳' in n:
            return '飲料'
        if re.search(r'みそ', n):
            return '調味料'
        return '大豆・豆'
    if g == '05':
        return 'ナッツ・種'
    if g == '06':
        if 'ジュース' in n:
            return '飲料'
        return '野菜'
    if g == '07':
        if '果実飲料' in n or 'ジュース' in n or 'ココナッツウォーター' in n:
            return '飲料'
        if re.search(r'ジャム|マーマレード|梅びしお', n):
            return '調味料'
        if re.search(r'ナタデココ|砂糖漬|ざぼん漬', n):
            return '菓子・デザート'
        return '果物'
    if g == '08':
        return 'きのこ'
    if g == '09':
        return '海藻'
    if g == '10':
        return '魚介'
    if g == '11':
        return '肉'
    if g == '12':
        return '卵'
    if g == '13':
        if 'アイス' in n or 'シャーベット' in n or 'ソフトクリーム' in n:
            return '菓子・デザート'
        if re.search(r'乳飲料|乳酸菌飲料|ドリンクタイプ', n):
            return '飲料'
        return '乳製品'
    if g == '14':
        return '油脂'
    if g == '15':
        if '＜菓子パン類＞' in n:
            return 'パン'
        if '肉まん' in n:
            return '主食'
        return '菓子・デザート'
    if g == '16':
        if 'みりん' in n:
            return '調味料'
        if '＜アルコール飲料類＞' in n:
            return '酒'
        return '飲料'
    if g == '17':
        return '調味料'
    if g == '18':
        if re.search(r'汁物類|スープ類', n):
            return '汁物'
        if re.search(r'親子丼の具|牛飯の具', n):
            return '丼・定食'
        if re.search(r'チャーハン|ピラフ|中華ちまき|お好み焼き', n):
            return '主食'
        if re.search(r'和え物類|酢の物類|卯の花|切り干し|きんぴら|ぜんまい|ひじき|ナムル|松前漬け', n):
            return '副菜'
        return '主菜'
    return 'その他'

# --------------------------------------------------------------------------- aliases

# exact MEXT token (or "GG:token" scoped to food group) -> extra search terms
TOKEN_ALIASES_SRC = '''
こめ:米,お米|おにぎり:おむすび|赤飯:おこわ|もち:餅,おもち|オートミール:オーツ|キヌア:quinoa
そば:蕎麦,ソバ|うどん:饂飩,ウドン|中華めん:ラーメン,中華麺|蒸し中華めん:焼きそば,中華麺
マカロニ・スパゲッティ:パスタ,スパゲティ,ぱすた|そうめん・ひやむぎ:素麺,そうめん,冷麦|手延そうめん・手延ひやむぎ:素麺,そうめん
即席中華めん:インスタントラーメン,袋麺|中華スタイル即席カップめん:カップラーメン,カップ麺|和風スタイル即席カップめん:カップうどん,カップ麺
フランスパン:バゲット|角形食パン:食パン,しょくぱん|コーンフレーク:シリアル|薄力粉:小麦粉|中力粉:小麦粉|強力粉:小麦粉
さつまいも:さつま芋,サツマイモ,薩摩芋|じゃがいも:ジャガイモ,じゃが芋,馬鈴薯,ポテト|さといも:里芋,サトイモ
ながいも:長芋,山芋,とろろ|やまといも:大和芋,山芋|こんにゃく:蒟蒻,コンニャク|しらたき:白滝,糸こんにゃく
はるさめ:春雨|緑豆はるさめ:春雨|普通はるさめ:春雨|じゃがいもでん粉:片栗粉,かたくりこ|とうもろこしでん粉:コーンスターチ|くずでん粉:葛粉
上白糖:砂糖,さとう|グラニュー糖:砂糖|黒砂糖:黒糖,こくとう|はちみつ:蜂蜜,ハチミツ
糸引き納豆:納豆,なっとう|挽きわり納豆:ひきわり納豆,納豆,なっとう|木綿豆腐:豆腐,とうふ,もめんどうふ|絹ごし豆腐:豆腐,とうふ,きぬごしどうふ
充てん豆腐:豆腐,とうふ|焼き豆腐:豆腐,やきどうふ|生揚げ:厚揚げ,あつあげ|04:油揚げ:あぶらあげ,お揚げ|凍り豆腐:高野豆腐,こうやどうふ
おから:卯の花|豆乳:とうにゅう|調製豆乳:豆乳,とうにゅう|きな粉:きなこ|あずき:小豆,アズキ|ひよこまめ:ひよこ豆,ガルバンゾー
レンズまめ:レンズ豆|いんげんまめ:いんげん豆,金時豆|そらまめ:空豆,そら豆|湯葉:ゆば|黄大豆:大豆,だいず|黒大豆:黒豆,大豆|青大豆:大豆
アーモンド:あーもんど|くるみ:胡桃,クルミ|ごま:胡麻,ゴマ|らっかせい:落花生,ピーナッツ|日本ぐり:栗,くり|中国ぐり:甘栗,栗|ぎんなん:銀杏
キャベツ:きゃべつ|きゅうり:胡瓜,キュウリ|赤色トマト:トマト,とまと|赤色ミニトマト:ミニトマト,プチトマト|黄色トマト:トマト
たまねぎ:玉ねぎ,玉葱,タマネギ|赤たまねぎ:紫玉ねぎ,玉ねぎ|にんじん:人参,ニンジン|だいこん:大根,ダイコン|はくさい:白菜,ハクサイ
ほうれんそう:ほうれん草,ホウレンソウ|こまつな:小松菜,コマツナ|ブロッコリー:ぶろっこりー|りょくとうもやし:もやし,モヤシ|だいずもやし:もやし,豆もやし
ブラックマッペもやし:もやし|なす:茄子,ナス|べいなす:米なす,茄子|青ピーマン:ピーマン|赤ピーマン:パプリカ|黄ピーマン:パプリカ|オレンジピーマン:パプリカ
西洋かぼちゃ:かぼちゃ,南瓜,カボチャ|日本かぼちゃ:かぼちゃ,南瓜|根深ねぎ:長ねぎ,ねぎ,ネギ,葱|葉ねぎ:青ねぎ,ねぎ,ネギ|こねぎ:万能ねぎ,ねぎ
九条ねぎ:ねぎ,ネギ|にんにく:ニンニク,大蒜|しょうが:生姜,ショウガ|にら:韮,ニラ|ごぼう:牛蒡,ゴボウ|れんこん:蓮根,レンコン|アスパラガス:アスパラ
さやいんげん:いんげん,インゲン|さやえんどう:絹さや|えだまめ:枝豆,エダマメ|スイートコーン:とうもろこし,トウモロコシ,コーン|にがうり:ゴーヤ,ゴーヤー
たけのこ:筍,タケノコ|かぶ:蕪,カブ|しゅんぎく:春菊|みずな:水菜|チンゲンサイ:青梗菜|しそ:大葉,紫蘇|みょうが:茗荷|キムチ:きむち
塩押しだいこん漬:たくあん,沢庵|干しだいこん漬:たくあん,沢庵|らっきょう:辣韮,ラッキョウ|かいわれだいこん:かいわれ,カイワレ|切干しだいこん:切り干し大根
野菜ミックスジュース:野菜ジュース|めんま:メンマ|わさび:山葵,ワサビ|ししとう:獅子唐,シシトウ|グリンピース:グリーンピース|とうがん:冬瓜|ザーサイ:搾菜
レタス:れたす|ゆりね:百合根|ふき:蕗|うど:独活|わらび:蕨|ぜんまい:薇|セロリ:セロリー|ズッキーニ:ずっきーに
バナナ:ばなな|りんご:林檎,リンゴ,アップル|うんしゅうみかん:みかん,ミカン,蜜柑|いちご:苺,イチゴ|ぶどう:葡萄,ブドウ,グレープ|キウイフルーツ:キウイ
日本なし:梨,なし|西洋なし:洋梨,ラ・フランス|07:かき:柿|07:もも:桃,モモ|メロン:めろん|07:すいか:西瓜,スイカ|レモン:檸檬|アボカド:アボガド
パインアップル:パイナップル,パイン|うめ:梅|梅干し:うめぼし|さくらんぼ:サクランボ,チェリー|いよかん:伊予柑|はっさく:八朔|ゆず:柚子|すだち:酢橘
干しぶどう:レーズン|びわ:枇杷|いちじく:無花果|ライチー:ライチ|パパイア:パパイヤ|しらぬひ:デコポン,不知火|オレンジ:おれんじ|グレープフルーツ:グレフル
えのきたけ:えのき,エノキ|しいたけ:椎茸,シイタケ|生しいたけ:しいたけ,椎茸|乾しいたけ:干ししいたけ,干し椎茸|ぶなしめじ:しめじ,シメジ
ほんしめじ:しめじ|はたけしめじ:しめじ|エリンギ:えりんぎ|まいたけ:舞茸,マイタケ|なめこ:ナメコ|きくらげ:木耳,キクラゲ|まつたけ:松茸
焼きのり:のり,海苔|味付けのり:のり,海苔|わかめ:ワカメ,若布|ひじき:ヒジキ|まこんぶ:昆布,こんぶ|塩昆布:しおこんぶ|もずく:モズク|おきなわもずく:もずく
めかぶわかめ:めかぶ,メカブ|寒天:かんてん|あおのり:青のり|あまのり:のり,海苔
まあじ:あじ,アジ,鯵|まいわし:いわし,イワシ,鰯|かたくちいわし:いわし,イワシ|しらす干し:しらす,シラス|うなぎ:鰻,ウナギ|かつお:鰹,カツオ
かつお節:鰹節|削り節:かつお節,鰹節,おかか|まがれい:かれい,カレイ|きす:鱚|ぎんだら:銀鱈|きんめだい:金目鯛|しろさけ:さけ,鮭,サケ,しゃけ
たいせいようさけ:サーモン,鮭,さけ|にじます:トラウトサーモン,サーモン|ぎんざけ:銀鮭,サーモン|べにざけ:紅鮭,鮭|イクラ:いくら|すじこ:筋子
まさば:さば,サバ,鯖|ごまさば:さば,鯖|たいせいようさば:ノルウェーさば,さば,鯖|さわら:鰆|さんま:秋刀魚,サンマ|ししゃも:シシャモ
からふとししゃも:ししゃも,シシャモ|まだい:鯛,たい,タイ|すけとうだら:たら,鱈|たらこ:タラコ|からしめんたいこ:明太子,めんたいこ|まだら:たら,鱈,タラ
にしん:鰊,ニシン|かずのこ:数の子|ひらめ:鮃,ヒラメ|とらふぐ:ふぐ,河豚|ぶり:鰤,ブリ|はまち:ハマチ|ほっけ:ホッケ|くろまぐろ:まぐろ,マグロ,鮪
10:きはだ:まぐろ,マグロ|めばち:まぐろ,マグロ|みなみまぐろ:まぐろ,マグロ|びんなが:まぐろ,ビンチョウ|めかじき:かじき,カジキ|あなご:穴子|あゆ:鮎
かんぱち:勘八|すずき:鱸|たちうお:太刀魚|わかさぎ:公魚|あさり:浅蜊,アサリ|しじみ:蜆,シジミ|ほたてがい:ほたて,帆立,ホタテ|10:かき:牡蠣,カキ
はまぐり:蛤|さざえ:栄螺|あわび:鮑|あまえび:甘えび,えび|くるまえび:車えび,えび,海老|ブラックタイガー:えび,海老|バナメイえび:えび,海老
さくらえび:桜えび|いせえび:伊勢海老|ずわいがに:かに,カニ,蟹|たらばがに:かに,カニ,蟹|毛がに:かに,蟹|するめいか:いか,イカ|やりいか:いか,イカ
こういか:いか,イカ|けんさきいか:いか,イカ|ほたるいか:ホタルイカ|まだこ:たこ,タコ,蛸|いいだこ:たこ|うに:雲丹,ウニ|なまこ:海鼠
かに風味かまぼこ:カニカマ,かにかま|蒸しかまぼこ:かまぼこ,蒲鉾|焼き竹輪:ちくわ,竹輪|さつま揚げ:さつまあげ|だて巻:伊達巻|かまぼこ:蒲鉾
うし:牛肉,ぎゅうにく,ビーフ|ぶた:豚肉,ぶたにく,ポーク|にわとり:鶏肉,とりにく,チキン|めんよう:羊肉,ジンギスカン|うま:馬肉|かも:鴨|くじら:鯨
いのしし:猪|ひき肉:ミンチ,挽肉|むね:むね肉,胸肉|ささみ:ササミ|ロースハム:ハム|ボンレスハム:ハム|ばらベーコン:ベーコン|ウインナーソーセージ:ウィンナー,ソーセージ
フランクフルトソーセージ:フランクフルト|ドライソーセージ:サラミ|焼き豚:チャーシュー,叉焼|ランチョンミート:スパム|チキンナゲット:ナゲット
鶏卵:卵,たまご,玉子,タマゴ|うずら卵:うずらの卵|厚焼きたまご:卵焼き,玉子焼き|だし巻きたまご:だし巻き卵,卵焼き
普通牛乳:牛乳,ミルク|加工乳:牛乳|ヨーグルト:よーぐると|プロセスチーズ:チーズ|アイスクリーム:アイス|ラクトアイス:アイス|アイスミルク:アイス
コーヒーホワイトナー:コーヒーフレッシュ,クリーマー|加糖練乳:練乳,コンデンスミルク|脱脂粉乳:スキムミルク|乳酸菌飲料:ヤクルト
調合油:サラダ油,植物油|オリーブ油:オリーブオイル|ごま油:胡麻油|なたね油:キャノーラ油|やし油:ココナッツオイル|有塩バター:バター|食塩不使用バター:無塩バター,バター
マーガリン:まーがりん|あまに油:亜麻仁油,アマニ油
大福もち:大福|どら焼:どら焼き,どらやき|今川焼:大判焼き|くし団子:だんご,団子|ようかん:羊羹|かしわもち:柏餅|草もち:よもぎ餅|もなか:最中
まんじゅう:饅頭|肉まん:中華まん|あんまん:中華まん|米菓:せんべい,煎餅|しょうゆせんべい:せんべい,煎餅|あられ:おかき|かりんとう:花林糖
ポテトチップス:ポテチ|ミルクチョコレート:チョコ,板チョコ|スイートチョコレート:チョコ|ホワイトチョコレート:チョコ|アーモンドチョコレート:チョコ
ソフトビスケット:クッキー|ショートケーキ:ケーキ|チーズケーキ:ケーキ|カスタードプリン:プリン|ドーナッツ:ドーナツ|ホットケーキ:パンケーキ
あんパン:あんぱん|あめ玉:飴,キャンディ|板ガム:ガム|糖衣ガム:ガム|風船ガム:ガム
清酒:日本酒,酒|ビール:びーる|発泡酒:ビール|ぶどう酒:ワイン|連続式蒸留しょうちゅう:焼酎|単式蒸留しょうちゅう:焼酎|ウイスキー:ウィスキー
梅酒:うめしゅ|缶チューハイ:チューハイ,サワー|本みりん:みりん|せん茶:緑茶,お茶,煎茶|ほうじ茶:お茶|番茶:お茶|玄米茶:お茶|玉露:お茶
ウーロン茶:烏龍茶|紅茶:ティー|麦茶:むぎちゃ|コーヒー:珈琲|サイダー:ソーダ|甘酒:あまざけ|ミルクココア:ココア
こいくちしょうゆ:醤油,しょうゆ|うすくちしょうゆ:醤油,しょうゆ|たまりしょうゆ:醤油|食塩:塩,しお|穀物酢:酢,お酢|米酢:酢|淡色辛みそ:味噌,みそ
赤色辛みそ:赤みそ,味噌|甘みそ:白みそ,味噌|麦みそ:味噌|豆みそ:八丁みそ,味噌|だし入りみそ:味噌|ウスターソース:ソース|中濃ソース:ソース
濃厚ソース:とんかつソース,ソース|トマトケチャップ:ケチャップ|マヨネーズ:マヨ|和風ドレッシング:ドレッシング|ごまドレッシング:ドレッシング
めんつゆ:麺つゆ,つゆ|ぽん酢しょうゆ:ポン酢|焼き肉のたれ:焼肉のタレ|カレールウ:カレールー|固形ブイヨン:コンソメ|顆粒和風だし:だしの素
顆粒中華だし:中華スープの素|トウバンジャン:豆板醤|テンメンジャン:甜麺醤|ラー油:辣油|こしょう:胡椒,コショウ|からし:辛子|酒かす:酒粕
マーボー豆腐の素:麻婆豆腐の素|ゆずこしょう:柚子胡椒
とん汁:豚汁|肉じゃが:にくじゃが|筑前煮:がめ煮|きんぴらごぼう:きんぴら|親子丼の具:親子丼|牛飯の具:牛丼|とりから揚げ:唐揚げ,からあげ
ビーフカレー:カレー|チキンカレー:カレー|ポークカレー:カレー|ポテトコロッケ:コロッケ|カニクリームコロッケ:コロッケ|合いびきハンバーグ:ハンバーグ
ぎょうざ:餃子,ギョーザ|しゅうまい:焼売,シュウマイ|チャーハン:炒飯|麻婆豆腐:マーボー豆腐|えびフライ:エビフライ|コーンクリームスープ:コーンスープ
'''
TOKEN_ALIASES = {}
# The animal's own aliases (豚肉, 牛肉, 鶏肉) belong to its cuts, not to the processed meats made of it
PROCESSED_MEAT = re.compile(r'［(?:ハム類|ベーコン類|ソーセージ類|その他)］|副生物|加工品')
MEAT_ANIMALS = ('うし', 'ぶた', 'にわとり')
for chunk in re.split(r'[|\n]', TOKEN_ALIASES_SRC):
    chunk = chunk.strip()
    if not chunk:
        continue
    key, _, vals = chunk.rpartition(':')
    TOKEN_ALIASES.setdefault(key, []).extend(v for v in vals.split(',') if v)

# kanji word -> reading (longest match first). Used to generate a hiragana search alias.
READINGS_SRC = '''
精白米:せいはくまい 玄米:げんまい 胚芽:はいが 発芽:はつが 押麦:おしむぎ 大麦:おおむぎ 小麦:こむぎ 小麦粉:こむぎこ 薄力粉:はくりきこ
強力粉:きょうりきこ 中力粉:ちゅうりきこ 全粒粉:ぜんりゅうふん 米粉:こめこ 白玉粉:しらたまこ 上新粉:じょうしんこ 赤飯:せきはん 食パン:しょくぱん
中華:ちゅうか 即席:そくせき 乾麺:かんめん 干し:ほし 生:なま 焼き:やき 焼:やき 揚げ:あげ 蒸し:むし 煮:に 漬:づけ 甘酢:あまず
豆腐:とうふ 木綿:もめん 絹ごし:きぬごし 充てん:じゅうてん 納豆:なっとう 糸引き:いとひき 挽きわり:ひきわり 油揚げ:あぶらあげ 生揚げ:なまあげ 厚揚げ:あつあげ
凍り:こおり 高野:こうや 豆乳:とうにゅう 調製:ちょうせい 大豆:だいず 黒豆:くろまめ 小豆:あずき 湯葉:ゆば
鶏卵:けいらん 卵黄:らんおう 卵白:らんぱく 卵:たまご 全卵:ぜんらん 目玉焼き:めだまやき 牛乳:ぎゅうにゅう 乳:にゅう 脱脂:だっし 粉乳:ふんにゅう 練乳:れんにゅう
低脂肪:ていしぼう 無脂肪:むしぼう 無糖:むとう 加糖:かとう 生クリーム:なまくりーむ 乳酸菌:にゅうさんきん 飲料:いんりょう
鶏:とり 牛:ぎゅう 豚:ぶた 羊:ひつじ 馬:うま 鹿:しか 和牛:わぎゅう 国産牛:こくさんぎゅう 輸入牛:ゆにゅうぎゅう 子牛:こうし 交雑牛:こうざつぎゅう 親鶏:おやどり
肉:にく 肩:かた 皮:かわ 脂身:あぶらみ 赤肉:あかにく 赤身:あかみ 手羽先:てばさき 手羽元:てばもと 手羽:てば 砂肝:すなぎも
皮下脂肪:ひかしぼう 中型種:ちゅうがたしゅ 焼き豚:やきぶた 生ハム:なまはむ 魚肉:ぎょにく 竹輪:ちくわ 伊達巻:だてまき
鮭:さけ 塩鮭:しおざけ 紅鮭:べにざけ 銀鮭:ぎんざけ 鯖:さば 鯛:たい 鱈:たら 鰤:ぶり 明太子:めんたいこ 煮干し:にぼし
開き干し:ひらきぼし 開き:ひらき 刺身:さしみ 缶詰:かんづめ 水煮:みずに 味付け:あじつけ 油漬:あぶらづけ 塩漬:しおづけ 塩蔵:えんぞう 塩抜き:しおぬき
塩:しお 砂糖:さとう 上白糖:じょうはくとう 三温糖:さんおんとう 黒砂糖:くろざとう 黒糖:こくとう 角砂糖:かくざとう 蜂蜜:はちみつ
味噌:みそ 醤油:しょうゆ 酢:す 黒酢:くろず 米酢:こめず 穀物酢:こくもつす 淡色辛:たんしょくから 赤色辛:せきしょくから 甘:あま 辛:から 減塩:げんえん
濃口:こいくち 薄口:うすくち 中濃:ちゅうのう 濃厚:のうこう 和風:わふう 洋風:ようふう 顆粒:かりゅう 固形:こけい 料理酒:りょうりしゅ
日本酒:にほんしゅ 清酒:せいしゅ 純米:じゅんまい 吟醸:ぎんじょう 普通酒:ふつうしゅ 焼酎:しょうちゅう 発泡酒:はっぽうしゅ 梅酒:うめしゅ 紹興酒:しょうこうしゅ 泡盛:あわもり
赤ワイン:あかわいん 白ワイン:しろわいん 緑茶:りょくちゃ 煎茶:せんちゃ 番茶:ばんちゃ 玄米茶:げんまいちゃ 抹茶:まっちゃ 紅茶:こうちゃ 麦茶:むぎちゃ 茶:ちゃ 甘酒:あまざけ 青汁:あおじる
野菜:やさい 果汁:かじゅう 濃縮還元:のうしゅくかんげん 缶:かん 冷凍:れいとう 乾燥:かんそう 大根:だいこん 人参:にんじん 玉ねぎ:たまねぎ 長ねぎ:ながねぎ
青ねぎ:あおねぎ 小ねぎ:こねぎ 白菜:はくさい 大葉:おおば 切り干し:きりぼし 切干し:きりぼし 漬物:つけもの 梅干し:うめぼし 梅:うめ
大根おろし:だいこんおろし 焼きいも:やきいも 片栗粉:かたくりこ 春雨:はるさめ 緑豆:りょくとう 豆:まめ 栗:くり 甘栗:あまぐり 天津:てんしん
干し柿:ほしがき 洋なし:ようなし 黄肉種:おうにくしゅ 温室:おんしつ 露地:ろじ 緑肉種:りょくにくしゅ 干ししいたけ:ほししいたけ
焼きのり:やきのり 昆布:こんぶ 塩昆布:しおこんぶ 寒天:かんてん 青のり:あおのり 海ぶどう:うみぶどう 沖縄:おきなわ
鶏むね肉:とりむねにく 鶏もも肉:とりももにく 鶏ひき肉:とりひきにく 豚ひき肉:ぶたひきにく 牛ひき肉:ぎゅうひきにく
甘えび:あまえび 車えび:くるまえび 桜えび:さくらえび 干しえび:ほしえび 生うに:なまうに 白子:しらこ 数の子:かずのこ
大福:だいふく 団子:だんご 今川焼:いまがわやき 桜もち:さくらもち 草もち:くさもち 蒸し:むし 肉まん:にくまん 菓子:かし
乳脂肪:にゅうしぼう 植物性:しょくぶつせい 練り:ねり 粒:つぶ 粉:こ 黒:くろ 白:しろ 赤:あか 青:あお 黄:き 天然:てんねん 養殖:ようしょく
豚汁:とんじる 肉じゃが:にくじゃが 筑前煮:ちくぜんに 親子丼:おやこどん 牛丼:ぎゅうどん 具:ぐ 煮物:にもの 白和え:しらあえ 酢豚:すぶた 八宝菜:はっぽうさい
麻婆豆腐:まーぼーどうふ 春巻き:はるまき 鶏のから揚げ:とりのからあげ 豆腐ハンバーグ:とうふはんばーぐ 白身魚:しろみざかな 南蛮漬け:なんばんづけ
お好み焼き:おこのみやき 松前漬け:まつまえづけ 早生:わせ 生乳:せいにゅう 生干し:なまぼし 半生:はんなま 生地:きじ 味:あじ 用:よう 調理後:ちょうりご 茶葉:ちゃば 葉:は 根:ね 等:とう 本:ほん 国産:こくさん 輸入:ゆにゅう 果実:かじつ 天ぷら:てんぷら 油いため:あぶらいため 素揚げ:すあげ 皮つき:かわつき 皮なし:かわなし 脂身つき:あぶらみつき 脂身なし:あぶらみなし 紅白:こうはく 卯の花:うのはな 大盛り:おおもり 中型:ちゅうがた 種:しゅ
'''
READINGS = {}
for pair in READINGS_SRC.split():
    k, _, v = pair.partition(':')
    READINGS[k] = v
_READ_KEYS = sorted(READINGS, key=len, reverse=True)
_READ_RE = re.compile('|'.join(re.escape(k) for k in _READ_KEYS))


def reading(s):
    return kata2hira(_READ_RE.sub(lambda m: READINGS[m.group(0)], s))


def parse_betsumei(note):
    out = []
    m = re.search(r'別名[：:]\s*([^\s]+(?:\s*（[^）]*）)?)', note)
    if not m:
        return out
    txt = m.group(1)
    for part in re.split(r'[、,]', txt):
        part = part.strip()
        if not part:
            continue
        mm = re.match(r'(.*?)（(.*?)）?$', part)
        if mm:
            a, b = mm.group(1), mm.group(2)
            if a:
                out.append(a)
            if b and b not in ('標準和名',) and not b.startswith('標準'):
                out.append(b)
        else:
            out.append(part.rstrip('）'))
    return [re.sub(r'[（）()]|等$', '', x) for x in out if x]


def prune_aliases(name, aliases):
    """Unique aliases, minus those contained in the name or in another alias."""
    seen = []
    for a in aliases:
        a = a.strip()
        if a and a not in seen:
            seen.append(a)
    return [a for a in seen if a not in name and not any(a != b and a in b for b in seen)]

# --------------------------------------------------------------------------- portions

def gen_portions(cat, note, name):
    """Cup/glass/spoon portions from the 備考 density '100 mL：103 g'."""
    m = re.search(r'100\s*mL\s*[：:]\s*([0-9.]+)\s*g', note)
    d = float(m.group(1)) if m else None
    if not d:
        return []
    if cat == '飲料':
        return [{'label': 'コップ1杯（200ml）', 'g': r0(2 * d)}]
    if cat == '酒':
        if 'ビール' in name or 'チューハイ' in name or '発泡酒' in name:
            return [{'label': '350ml缶', 'g': r0(3.5 * d)}]
        return [{'label': 'グラス1杯（100ml）', 'g': r0(d)}]
    if cat in ('調味料', '油脂'):
        return [{'label': '小さじ1', 'g': round(0.05 * d, 1)}, {'label': '大さじ1', 'g': r0(0.15 * d)}]
    return []

# --------------------------------------------------------------------------- overrides

def load_overrides(path):
    ov = {}
    with open(path, encoding='utf-8') as f:
        for ln, line in enumerate(f, 1):
            line = line.rstrip('\n')
            if not line.strip() or line.lstrip().startswith('#'):
                continue
            parts = line.split('|')
            parts += [''] * (7 - len(parts))
            fid, name, pop, en, aliases, portions, cat = [p.strip() for p in parts[:7]]
            if not re.fullmatch(r'\d{5}', fid):
                print('WARN bad override line', ln, line, file=sys.stderr)
                continue
            if fid in ov:
                print('WARN duplicate override', fid, file=sys.stderr)
            por = []
            for p in [x for x in portions.split(',') if x.strip()]:
                lab, _, g = p.rpartition(':')
                por.append({'label': lab.strip(), 'g': float(g) if '.' in g else int(g)})
            ov[fid] = {'name': name, 'pop': int(pop) if pop else None, 'en': en,
                       'aliases': [a.strip() for a in aliases.split(',') if a.strip()],
                       'portions': por, 'cat': cat}
    return ov

# --------------------------------------------------------------------------- main

def build(recs):
    ov = load_overrides(OVR)
    ids = {r['id'] for r in recs}
    for k in ov:
        if k not in ids:
            print('WARN override id not in MEXT:', k, file=sys.stderr)

    ans = {r['id']: analyse(r) for r in recs}
    def base_of(r):
        mains = [t for k, t in ans[r['id']] if k == 'main']
        return r['group'], mains[0] if mains else ''

    # part frequency per (group, base) to decide which plant-part tokens may be dropped
    part_ct = defaultdict(Counter)
    for r in recs:
        parts = [t for k, t in ans[r['id']] if k == 'part']
        part_ct[base_of(r)][parts[0] if parts else ''] += 1

    def keep_part_fn(r):
        real = {p: n for p, n in part_ct[base_of(r)].items() if p}
        if len(real) <= 1:
            return lambda t: False
        top = max(real.values())
        tops = [p for p, n in real.items() if n == top]
        main_part = tops[0] if len(tops) == 1 else None
        return lambda t: t != main_part

    # name detail levels, raised per food until names are unique: (all plant parts, notes, drop0 words, [brackets])
    LEVELS = [(False, False, False, False), (False, True, False, False), (True, True, False, False),
              (True, True, True, False), (True, True, True, True)]

    def name_at(r, lvl):
        parts, notes, drop0, br = LEVELS[lvl]
        kp = (lambda t: True) if parts else keep_part_fn(r)
        return join_tokens(build_tokens(r, ans[r['id']], kp, notes, drop0, br)) or r['name']

    level = {r['id']: 0 for r in recs}
    names = {}
    for _ in range(len(LEVELS) + 1):
        for r in recs:
            fid = r['id']
            names[fid] = ov[fid]['name'] if fid in ov and ov[fid]['name'] else name_at(r, level[fid])
        cnt = Counter(names.values())
        dups = [r['id'] for r in recs if cnt[names[r['id']]] > 1 and r['id'] not in ov]
        if not dups:
            break
        for fid in dups:
            if level[fid] < len(LEVELS) - 1:
                level[fid] += 1
    # final dedupe: append official-name fragment / id
    cnt = Counter(names.values())
    seen_dup = Counter()
    for r in recs:
        n = names[r['id']]
        if cnt[n] > 1:
            seen_dup[n] += 1
            if r['id'] in ov:
                print('WARN override name collides:', n, r['id'], file=sys.stderr)
            if seen_dup[n] > 1:
                names[r['id']] = n + '（' + r['id'] + '）'

    items = []
    for r in recs:
        fid = r['id']
        o = ov.get(fid, {})
        name = names[fid]
        full = re.sub(r'[\s　]+', ' ', r['name']).strip()
        full = re.sub(r' ?([［（＜]) ?', r'\1', full)
        full = re.sub(r' ?([］）＞]) ?', r'\1', full).strip()
        cat = o.get('cat') or category(r, name)
        # aliases
        al = list(o.get('aliases', []))
        toks = split_tokens(r['name'])
        processed = PROCESSED_MEAT.search(r['name'])
        for t in toks:
            t2 = t.strip('［］（）＜＞')
            if processed and t2 in MEAT_ANIMALS:
                continue   # ベーコン, ハム, ソーセージ: not 豚肉 (豚肉 found ベーコン first)
            for key in (t2, r['group'] + ':' + t2):
                al.extend(TOKEN_ALIASES.get(key, []))
        al.extend(parse_betsumei(r['note']))
        # MEXT main token (kana) if display name dropped it
        rd = reading(name)
        if rd != name:
            al.append(rd)
        # reading of the generic (rule-based) name too, so official terms stay searchable
        if o.get('name'):
            gen = name_at(r, 0)
            al.append(gen)
            al.append(reading(gen))
        # katakana-only display words -> hiragana already covered by reading(); add hiragana of aliases w/ katakana for common items
        if o:
            al.extend(kata2hira(a) for a in list(al) if re.search(r'[ァ-ヶ]', a) and re.fullmatch(r'[ァ-ヶーぁ-ん]+', a))
        aliases = prune_aliases(name, al)
        item = {'id': 'mext:' + fid, 'name': name, 'full': full}
        if o.get('en'):
            item['en'] = o['en']
        if aliases:
            item['aliases'] = aliases
        item['cat'] = cat
        item.update(nutrients({k: num(r[code]) for code, k in MEXT_CODES.items()}))
        por = list(o.get('portions') or gen_portions(cat, r['note'], name))
        if not any(p['g'] == 100 and p['label'] == '100g' for p in por):
            por.append({'label': '100g', 'g': 100})
        for p_ in por:
            if isinstance(p_['g'], float) and p_['g'].is_integer():
                p_['g'] = int(p_['g'])
        item['portions'] = por
        if o.get('pop'):
            item['pop'] = o['pop']
        refuse = num(r['REFUSE'])
        if refuse and refuse > 0:
            m = re.search(r'廃棄部位[：:]\s*([^\s]+)', r['note'])
            item['note'] = '可食部100gあたり（廃棄率%d%%%s）' % (round(refuse), '：' + m.group(1).rstrip('、') if m else '')
        items.append(item)

    variant_groups(items)
    return dict(META, items=items)


# --------------------------------------------------------------------------- variant groups (the app's じょうたい chips)

# A state as the last word of MEXT's name → its chip label, in process order (the chips' order)
STATES = {'乾': '乾', '生': '生', 'ゆで': 'ゆで', '水煮': '水煮', '蒸し': '蒸し', '焼き': '焼き', '電子レンジ調理': 'レンジ',
          '油いため': 'いため', 'ソテー': 'ソテー'}
STATE_ORDER = {w: i for i, w in enumerate(STATES)}


def variant_groups(items):
    """One food in its states (豚ロース 脂身つき: 生 · 焼き · ゆで): the items whose official name (`full`) is the same but
    its last word, a state (STATES). Each gets `vg`, its group's default item's id, and `st`, its chip label. A group
    needs 2+ items in distinct states and no item named as the stem itself (グリンピース 冷凍 / …冷凍 ゆで: the frozen one
    has no state word); fried ones (天ぷら, フライ, から揚げ …) and a state with a note (乾（添付調味料等…）) are no state,
    so they stay rows of their own. The default: the most popular (`pop`), then 生, then ゆで, then the chip order."""
    fulls = {it['full'] for it in items}
    groups = defaultdict(list)
    for it in items:
        stem, _, last = it['full'].rpartition(' ')
        if stem and last in STATES:
            groups[stem].append((last, it))
    for stem, g in groups.items():
        states = [w for w, _ in g]
        if len(g) < 2 or len(set(states)) < len(states) or stem in fulls:
            continue
        g.sort(key=lambda x: (-(x[1].get('pop') or 0), x[0] != '生', x[0] != 'ゆで', STATE_ORDER[x[0]]))
        for w, it in g:
            it['vg'] = g[0][1]['id']
            it['st'] = STATES[w]
