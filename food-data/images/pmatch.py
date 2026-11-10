"""A packaged product's picture (docs/food-data.md "Pictures"; never a package photo): a generic picture of the same
food, matched from the product's name, brand and Open Food Facts category tags by hand-written rules, with a
confidence. Only a confident match gets a picture; the rest keep their category's tile. Deterministic, stdlib only.

Rules (products.txt; its header has the syntax): words a name's token ends with (干し芋, 食パン), context rules that send
a word elsewhere or nowhere in a context (竜田揚げ beside さば is fish), OFF tags (en:soy-sauces) and one-form brands
(ハリボー: gummies). Catalog words: the generic foods' own names (made foods only: dishes, eat-out, school lunches, the
regional sets...) as further, weaker words, so a product named like a catalogue dish gets that dish's picture.

Confidence (CONFIDENT or more ships): a hand-written word 3 (a weak `~` word or a catalog word 2), a brand or tag 3;
+1 when the word is its whole token (or after a place, 生, 国産...), when the product's category is the picture's or
of its kind (drink, sweet, seasoning, meal) or its tags name the same picture; -1 when its tags say another kind, or
a word of another kind sits beside it and the product's category sides with neither (or with that word, which then
wins); -1 from the OFF generic_name instead of the name. A context rule's `-` drops the word.
"""
import re, sys, unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import off  # noqa: E402  (pick_cat: the category a name or the tags give)

CONFIDENT = 3
# a category's kind (None: any): a word of another kind beside a candidate lowers its confidence
_KIND = {'飲料': 'drink', '酒': 'drink', '菓子・デザート': 'sweet', '調味料': 'season', '油脂': 'season'}
_ANY = {'乳製品', '果物', 'ナッツ・種', 'その他'}
# catalog words come only from made foods (an ingredient's name in a product's is mostly a flavour or a filling)
_MADE = {'主菜', '副菜', '汁物', '麺', '主食', '寿司', '丼・定食', '外食', 'コンビニ', '菓子・デザート', 'パン', '飲料', '酒', '調味料'}
# a catalog word several rows share goes to the first source in this order (then the smaller key)
_SRC = ['dishes', 'eatout', 'mext', 'jbfd', 'kurume', 'takatsuki', 'toyonaka', 'kumagaya', 'tokyo_hokeniryo', 'maff_kyodo', 'sub']


def kind(cat):
    return None if cat in _ANY else _KIND.get(cat, 'meal')


_KANA = [('芋', 'いも'), ('玉子', 'たまご'), ('卵', 'たまご'), ('葱', 'ねぎ'), ('海老', 'えび'), ('烏賊', 'いか'), ('鮭', 'さけ'),
         ('しゃけ', 'さけ'), ('胡麻', 'ごま'), ('昆布', 'こんぶ'), ('醤油', 'しょうゆ'), ('味噌', 'みそ'), ('から揚げ', '唐揚げ'), ('からあげ', '唐揚げ'),
         ('餃子', 'ぎょうざ'), ('ギョーザ', 'ぎょうざ'), ('焼売', 'しゅうまい'),
         ('シュウマイ', 'しゅうまい'), ('ー', ''), ('・', '')]
# a name's last bits that say nothing of the food: sizes, counts, brackets, marks, cuts and packs
_JUNK = re.compile(r'([^\w]|\d+(\.\d+)?(g|ml|kg|l|個|枚|本|袋|食|粒|切|切れ|貫|人前|p|入|入り|コ|分)+|内容量.*|[!！?？☆★♪〈〉<>【】\[\]「」『』'
                   r'（）()／/、,.。~〜%％+＋&＆-]|大|小|(?<!最)中|ミニ|特大|徳用|業務用|お徳用|スライス|切り落とし|切り落し|切落し|切落とし|詰め合わせ|詰合せ|セット|風|生食用|刺身用|加熱用|焼肉用|味付|解凍品|冷凍品|加工品|タイプ|きれはし|切れ端|訳あり|ハーフ|増量|小パック|大パック|ファミリーパック|mini|big|プレミアム|デラックス|カップ|甘塩味|甘塩|うす塩|薄塩|甘口|中辛|辛口|\d+)+$')
# a prefix that says nothing of the food's form (北海道バター, 生モッツァレラ): the word counts as its whole token
_MOD = re.compile(r'(国産|国内産|\w{1,4}?県?産|北海道|九州|沖縄|京都|信州|天然|有機|オーガニック|特選|厳選|上|純|本|極|新|旬|生|無塩|減塩|有塩|塩|'
                  r'塩味|甘口|辛口|手造り|手作り|自家製|ちっちゃい|大粒|小粒|冷凍|無添加|骨取り|骨なし|皮なし|皮付き|あらびき|都)+')
_FLAVOUR = re.compile(r'(味|風味|フレーバー|テイスト|仕立て|仕立)$')


def _kana(s):
    return ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in s)


def pnorm(s):
    """A word as the rules compare it: NFKC, katakana as hiragana, lower case, a few kanji / kana spellings one."""
    s = _kana(unicodedata.normalize('NFKC', s)).lower()
    for a, b in _KANA:
        s = s.replace(_kana(a), b)
    return s


def _script(c):
    return 'k' if 'ァ' <= c <= 'ヺ' or c == 'ー' else 'h' if 'ぁ' <= c <= 'ゖ' else 'a' if c.isascii() and c.isalnum() else 'x'


def tokens(name, brand=''):
    """A name's tokens [(token, a part of a space-separated word)]: split at spaces, then at 【】「」 / ・ & marks;
    brackets' contents and junk gone, and the brand's own token (はま寿司 甘口醤油) unless it is all (おかめ納豆)."""
    s = re.sub(r'[（(][^）)]*[）)]', '', unicodedata.normalize('NFKC', name))
    b = pnorm(brand) if brand else ''
    out = []
    for word in s.split():
        parts = [p for p in re.split(r'[【】「」『』/／・&＆|｜、,×]+', word) if p]
        for tok in parts:
            for _ in range(3):
                tok = _JUNK.sub('', tok)
            if tok:
                out.append((tok, len(parts) > 1))
    return [t for t in out if pnorm(t[0]) != b] or out


class Rules:
    """products.txt's rules, the catalog words and the pictures' kinds."""

    def __init__(self, text, catalog=None, cats=None):
        self.words, self.ctx, self.tags, self.brands = {}, {}, {}, []
        self.catalog = catalog or {}
        self.cats = cats or {}  # picture key -> its category
        self.kinds = {}  # picture key -> its kind, where products.txt says other than its category
        for line in text.splitlines():
            line = line.split('#')[0].strip()
            if not line:
                continue
            lhs, key = (x.strip() for x in line.rsplit(' = ', 1))
            if lhs.startswith('kind '):
                for k in key.split('|'):
                    self.kinds[k] = lhs[5:].strip()
                continue
            key = None if key == '-' else key
            if lhs.startswith('tag '):
                for t in lhs[4:].split('|'):
                    self.tags[t.strip()] = key
            elif lhs.startswith('brand '):
                self.brands += [(pnorm(b), key) for b in lhs[6:].split('|')]
            elif ' @ ' in lhs:
                ws, ctx = lhs.split(' @ ')
                for w in ws.split('|'):
                    self.ctx.setdefault(pnorm(w.lstrip('^~!+')), []).append(([pnorm(c) for c in ctx.split('|')], key))
            else:
                for w in lhs.split('|'):
                    mark = w[:len(w) - len(w.lstrip('^~!+'))]
                    self.words[pnorm(w[len(mark):])] = (key, '^' in mark, '~' in mark, '!' in mark, '+' in mark)

    def _word(self, w):
        """(key, whole token only, weak, first token only, may end a word, base confidence) or None."""
        if w in self.words:
            k, whole, weak, first, tail = self.words[w]
            return k, whole, weak, first, tail, 2 if weak else 3
        if w in self.catalog:
            return self.catalog[w], False, False, False, False, 2
        if w in self.ctx:
            return None, False, False, False, False, 3
        return None

    def candidates(self, name, brand=''):
        """Every (rank, key, word, confidence, the token before the word, the other tokens) a name gives, best first: a token's
        longest word it ends with (not starting inside a word of its own script unless 3+ letters or `+`), or, in a
        flavour token (…味), the sweet or drink word it starts with (ポテトチップスのり塩味: ポテトチップス; in a token
        that ends in no word, -1: ポテトチップスのり塩パンチ). A form beats a weak word,
        then the longer word, then the earlier token. A word that is its whole token +1; a catalog word that ends in a
        hand-written one (和風きのこスパゲッティ: スパゲッティ) +1."""
        out = []
        parts = tokens(name, brand)
        toks = [t for t, _ in parts]
        for ti, (tok, part) in enumerate(parts):
            fl = _FLAVOUR.search(tok)
            found = None if fl else self._suffix(tok, ti, part)
            if found:
                w, key, weak, conf, st = found
                out.append(((not weak, len(w), -ti), key, w, conf, tok[:st], ' '.join(toks[:ti] + toks[ti + 1:])))
                continue
            body = tok[:fl.start()] if fl else tok
            for e in range(len(body) - 1, 1, -1):
                w = pnorm(body[:e])
                hit = len(w) >= 2 and self._word(w)
                if not hit or hit[1] or hit[2] or (hit[3] and ti) or self.kind_of(hit[0]) not in ('sweet', 'drink'):
                    continue
                if _script(body[e - 1]) == _script(body[e]) and len(w) < 3:
                    continue
                out.append(((True, len(w), -ti), hit[0], w, hit[5] - (not fl), tok[e:], ' '.join(toks[:ti] + toks[ti + 1:])))
                break
        return sorted(out, key=lambda c: c[0], reverse=True)

    def _suffix(self, tok, ti, part):
        """A token's longest word it ends with -> (word, key, weak, confidence, start) or None."""
        for st in range(len(tok)):
            w = pnorm(tok[st:])
            hit = len(w) >= 2 and self._word(w)
            if not hit:
                continue
            key, whole, weak, first, tail, conf = hit
            if (whole and st) or (first and ti):
                continue
            if st and len(tok) - st < 3 and not tail and _script(tok[st - 1]) != 'x' and all(
                    _script(c) == _script(tok[st - 1]) for c in tok[st:]):
                continue
            if weak and st >= 2 and self.kind_of(key) != 'sweet':  # after a form, a flavour (唐揚げしょうゆ; チョコ coats)
                form = self._suffix(tok[:st], ti, part)
                if form and not form[2] and form[1]:
                    return form
            if w not in self.words and w in self.catalog and any(
                    pnorm(tok[s2:]) in self.words and not self.words[pnorm(tok[s2:])][2] for s2 in range(st + 1, len(tok) - 1)):
                conf += 1
            return w, key, weak, conf + ((st == 0 or bool(_MOD.fullmatch(tok[:st]))) and not part), st
        return None

    def match(self, name, cat='その他', brand='', tags=(), generic=''):
        """-> (picture key or None, confidence, why). Only a key with confidence >= CONFIDENT is a match. The best
        candidate a context rule's `-` leaves (-1 if its tags' category, off.pick_cat, is of another kind); when the
        rest of the name holds a word of another kind (キャラメル|サンド, 島かりんとう|黒糖), the product's category
        (products.json's) decides: the candidate, the other word if in another token (-1), or neither (-1)."""
        tag_key = next((self.tags[t] for t in reversed(list(tags)) if t in self.tags), None)
        tk = kind(off.pick_cat(list(tags), '')) if tags else None
        ck = kind(cat)
        low = pnorm(name)
        for b, key in self.brands:
            if b in low:
                return self._judge(key, 3, cat, tag_key, f'brand {b}')
        for src, text, cost in (('name', name, 0), ('generic', generic, 1)):
            if not text:
                continue
            for _, key, w, conf, near, rest in self.candidates(text, brand):
                key = self._context(w, key, low)
                if key is None:
                    continue
                qk = self.kind_of(key)
                if tk and qk and tk != qk:
                    conf -= 1
                # a word of another kind beside it: in the same token only a form, or a sweet (キャラメル|サンド)
                other = {t: [(k2, w2, c2) for k2, w2, c2, strong in ((self._context(c[2], c[1], low), c[2], c[3], c[0][0]) for c in self.candidates(t))
                             if k2 and self.kind_of(k2) and self.kind_of(k2) != qk and (t is rest or strong or self.kind_of(k2) == 'sweet')]
                         for t in (near, rest)}
                if (other[near] or other[rest]) and qk and ck != qk:
                    alt = [o for o in other[rest] if ck and self.kind_of(o[0]) == ck]
                    if alt:
                        key, w, conf = alt[0]
                    conf -= 1
                return self._judge(key, conf - cost, cat, tag_key, f'{src} {w}')
        if tag_key:
            return self._judge(tag_key, 3, cat, tag_key, 'tag')
        return None, 0, 'no word'

    def kind_of(self, key):
        k = self.kinds.get(key) or kind(self.cats.get(key, 'その他'))
        return None if k == 'any' else k

    def _context(self, w, key, low):
        """A word's key in this name: a context rule's (None: no picture) when the name holds one of its words."""
        for ctx, ck in self.ctx.get(w, []):
            if any(c in low for c in ctx):
                return ck
        return key

    def _judge(self, key, conf, pc, tag_key, why):
        """+1 when the tags name the picture, or the product's category (pc) is the picture's or of its kind."""
        qc, pk = self.cats.get(key, 'その他'), kind(pc)
        if key == tag_key or (pc != 'その他' and qc == pc) or (pk and pk == self.kind_of(key)):
            conf += 1
        return key, conf, why


def catalog_words(rows, cat_of_row, items):
    """The generic foods' names (made foods only, 3+ letters, one token) -> their row's key; several rows: _SRC's order."""
    seen = {}
    for r in rows:
        if not r.get('items') or cat_of_row(r) not in _MADE:
            continue
        names = {r['ja']}
        for i in r['items']:
            it = items.get(i)
            if it:
                names.add(it['name'])
                names.update(a for a in it.get('aliases', []) if not a.isascii() and len(pnorm(a)) >= 4)
        for n in names:
            n = re.sub(r'[（(［\[][^）)］\]]*[）)］\]]', '', unicodedata.normalize('NFKC', n)).strip()
            if len(n) < 3 or re.search(r'[\s、,・/＜<]', n) or n.isascii():
                continue
            src = r['key'].split('-', 1)[0]
            rank = (_SRC.index(src) if src in _SRC else len(_SRC), r['key'])
            w = pnorm(n)
            if w not in seen or rank < seen[w][0]:
                seen[w] = (rank, r['key'])
    return {w: k for w, (_, k) in seen.items()}


def load_off(raw_off):
    """off id -> (categories_tags, generic name), from the raw OFF download (off.py's reader; never shipped)."""
    from lib import norm_jan
    recs = off.load(str(raw_off))
    best = {}
    for code in sorted(recs):
        j = norm_jan(code)
        if j and (j not in best or (recs[code].get('last_modified_t') or 0) > (best[j].get('last_modified_t') or 0)):
            best[j] = recs[code]
    out = {}
    for j, r in best.items():
        tags = tuple(t for t in (r.get('categories_tags') or []) if isinstance(t, str))
        g = r.get('generic_name_ja') or r.get('generic_name') or ''
        if tags or isinstance(g, str) and g:
            out['off:' + j] = (tags, g if isinstance(g, str) else '')
    return out
