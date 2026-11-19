// Data checks on a shipped item (docs/food-data.md "Data checks"), per 100 g: the automatic rules (`plausible`: what
// is fixable fixed, the rest nulled), run at ship time (scripts/food-data.ts) and on a live Open Food Facts answer
// (scan/off.ts); the stricter `suspect` checks the CI guard runs over every shipped row (plausible.test.ts, against
// food-data/data_src/suspect_ok.json). food-data/scripts/off.py mirrors `plausible` (the shared cases:
// data_src/plausible_cases.json). Pure, node alone (lib/food/nodeAlone.test.ts).
import type { Item, Portion } from './types.ts';

interface Checked {
  /** The item fixed, or null: drop it (a chain menu's name_density only). */
  item: Item | null;
  /** The rules that fired. */
  flags: string[];
}

/** Energy below 4P+9F+4C is genuine for sweeteners, sugar alcohols and fibre (off.py LOW_KCAL_OK). */
const LOW_KCAL_OK = /lakan?to|zero|甘味料|エリスリ|ラカント|パルスイート|シュガーカット|キシリトール|ゼロ|ノンカロリー|カロリーオフ|糖質(?:ゼロ|オフ|0)|こんにゃく|蒟蒻|寒天|ところてん|食物繊維|難消化|ファイバー|わかめ|昆布|こんぶ|ひじき|海藻|もずく|めかぶ|きのこ|しいたけ|ガム/i;
/** An alcoholic drink by its name: alcohol's 7 kcal/g is in no macro. (Here and below, \uXXXX: a character the trimmed
 *  UI font lacks: styles/fonts.test.ts.) */
const ALCOHOL = /酒|みりん|味\u9187|ビール|beer|ワイン|wine|サワー|チューハイ|ハイボール|ほろよい|氷結|リキュール|liqueur|焼酎|ウイスキー|whisk|\d\s*%/i;

const atwater = (p: number, f: number, c: number): number => 4 * p + 9 * f + 4 * c;
const nameOf = (it: Item): string => it.name.normalize('NFKC');
/** A product's label values (Open Food Facts), not a recipe's or MEXT's. */
const label = (it: Item): boolean => it.id.startsWith('off:');
/** Salt per 100 g over which a copy of C or P is taken for one, by category (off.py SALT_CAP; else 10). */
const SALT_CAP: Record<string, number> = {
  調味料: 100, 飲料: 1.5, 酒: 2, 乳製品: 2, '菓子・デザート': 5, パン: 3, 果物: 1, 'ナッツ・種': 3, 主食: 7, 麺: 8, 肉: 4, 卵: 2,
  '大豆・豆': 3, いも: 3, 野菜: 4, 主菜: 5, 副菜: 5, '丼・定食': 4, 寿司: 4, 魚介: 6, 油脂: 3, 汁物: 20
};
/** Seasonings, soup bases and salty foods, whose salt can equal a macro by chance (a dashi powder's 40 g). */
const SALTY = /たれ|タレ|だれ|ダレ|だし|ダシ|出汁|スープ|soup|pho|素|もと|ルー|ルウ|みそ|味噌|粉末|パウダー|\u9846粒|シーズニング|seasoning|ソース|sauce|醤|しょうゆ|ナンプラー|ふりかけ|furikake|コンソメ|ブイヨン|つゆ|調味|ペースト|明太|たらこ|塩辛|酒盗|梅|生ハム|ジャーキー/i;
const known = (v: number | null | undefined): v is number => typeof v === 'number';

/** A chain menu (Kalori): values per serving, its weight unknown. */
const perServing = (it: Item): boolean => it.sv === true || it.id.startsWith('kal:');

/** The grams a chain menu's name states as its own (「ペペロンチーノソース 30g」: the end of the name), none when they
 *  may be a part's or one of several (a set's 「ステーキ＆ハンバーグ 100g」, 「4バッグ 16g」). */
const NAME_PART = /\d\s*x|[×*+&・()]|\d\s*(?:個|本|枚|袋|入|食|バッグ|パック)|ステーキ|バーグ|ビフテキ|肉|セット|付|ランチ|弁当|定食|丼/i;
export function nameGrams(name: string): number | null {
  const nm = name.normalize('NFKC').trim();
  const m = /(?<![\d.])(\d+(?:\.\d+)?)\s*g$/i.exec(nm);
  return m && !NAME_PART.test(nm.slice(0, m.index)) ? Number(m[1]) : null;
}

/**
 * The automatic rules (off.py plausible's mirror), in order:
 * - `kj_as_kcal`: kcal ≈ 4.184 × (4P+9F+4C) (±8 %, over 1.6×), or, a macro unknown, more energy than the known ones
 *   and the rest of the 100 g could hold while kcal / 4.184 fits them: kcal / 4.184.
 * - `pfc_sum`: P+F+C over 105 g; `atwater_gross` (4P+9F+4C over 2 kcal + 60, not a sweetener or fibre food),
 *   `atwater_high` (kcal over it + max(80, 0.6 kcal)), a product's `atwater` (kcal over 1.35× it + 25 or under 0.65× it
 *   − 25, not a sweetener, fibre food, seaweed or mushroom): P, F and C unknown (null; off.py drops some).
 * - `salt_copy` (a product's): salt ≥ 5 g a copy of C or P (×0.96–1.02) that 100 g can't hold with the macros, or
 *   over its category's cap (SALT_CAP) in no seasoning or salty food (SALTY): null.
 * - `portion_kcal` (a product's): its 1食分 the kcal (portionIsKcal): removed.
 * - `name_density`: a chain menu over 9.1 kcal a gram its name states: dropped (the only drop: a product is
 *   always kept, so a live scan never loses one).
 */
export function plausible(it: Item): Checked {
  const flags: string[] = [];
  if (perServing(it)) {
    const g = nameGrams(it.name);
    if (g && it.kcal / g > 9.1) {
      flags.push('name_density');
      return { item: null, flags };
    }
    return { item: it, flags };
  }
  const out: Item = { ...it };
  const nm = nameOf(it);
  // (an alcoholic drink, its energy partly alcohol's 7 kcal/g, is 酒: the only category alcohol was ever kept on)
  const alcoholic = it.cat === '酒';
  const { p, f, c } = out;
  if (!alcoholic) {
    if (known(p) && known(f) && known(c)) {
      const est = atwater(p, f, c);
      if (est > 30 && out.kcal > 1.6 * est && Math.abs(out.kcal - 4.184 * est) < 0.08 * 4.184 * est) {
        out.kcal = Math.round(out.kcal / 4.184);
        flags.push('kj_as_kcal');
      }
    } else if (known(p) || known(f) || known(c)) {
      const a = atwater(p ?? 0, f ?? 0, c ?? 0);
      const rest = Math.max(0, 100 - (p ?? 0) - (f ?? 0) - (c ?? 0) - (out.salt ?? 0));
      const most = a + rest * (known(f) ? 4 : 9);
      const k = out.kcal / 4.184;
      if (a > 30 && out.kcal > most && k >= 0.9 * a && k <= most) {
        out.kcal = Math.round(k);
        flags.push('kj_as_kcal');
      }
    }
  }
  if (known(p) && known(f) && known(c) && !alcoholic) {
    const est = atwater(p, f, c);
    const flag = p + f + c > 105 ? 'pfc_sum'
      : est > 2 * out.kcal + 60 && !LOW_KCAL_OK.test(nm) ? 'atwater_gross'
      : est > 0 && out.kcal > est + Math.max(80, 0.6 * out.kcal) && !ALCOHOL.test(nm) ? 'atwater_high'   // (みりん: alcohol by its name)
      : label(it) && (out.kcal > 1.35 * est + 25 || (out.kcal < 0.65 * est - 25 && !LOW_KCAL_OK.test(nm) && it.cat !== '海藻' && it.cat !== 'きのこ')) ? 'atwater'
      : null;
    if (flag) {
      out.p = out.f = out.c = null;
      flags.push(flag);
    }
  }
  // (label values only: a recipe's or MEXT's salt or portion equal to a macro or its kcal is chance)
  const salt = out.salt;
  if (label(it) && known(salt) && salt >= 5 && [it.c, it.p].some((v) => known(v) && v > 0 && salt / v >= 0.96 && salt / v <= 1.02)) {
    if ((it.p ?? 0) + (it.f ?? 0) + (it.c ?? 0) + salt > 100 || (salt > (SALT_CAP[it.cat ?? ''] ?? 10) && !SALTY.test(nm))) {
      out.salt = null;
      flags.push('salt_copy');
    }
  }
  if (label(it) && out.portions?.some((q) => portionIsKcal(q, out.kcal))) {
    out.portions = out.portions.filter((q) => !portionIsKcal(q, out.kcal));
    if (!out.portions.length) delete out.portions;
    flags.push('portion_kcal');
  }
  return { item: out, flags };
}

/** A label's serving (1食分) whose grams are the item's kcal (OFF's serving field holding the energy), 300 g and up: a
 *  smaller one, or a pack's (1個), matches by chance (fried chicken 200 kcal, 200 g). */
const portionIsKcal = (q: Portion, kcal: number): boolean => q.label === '1食分' && q.g >= 300 && Math.abs(q.g - kcal) <= 1;

/** Protein foods, where protein over 35 % of the energy is genuine. */
const PROTEIN_FOOD = /プロテイン|protein|ホエイ|whey|wp[ci]|\biso|カゼイン|casein|ザバス|savas|ビーレジェンド|be ?legend|アルプロン|alpron|huel|shake|replacement|ちりめん|めんたい|明太|もめん|豆乳|茶豆|枝豆|だんご|団子|骨|いわし|イワシ|あじ|\u9bf5|きす|キス|ししゃも|あなご|穴子|すじ|カニカマ|パンガシウス|fish|tuna|salmon|squid|chicken|beef|pork|ham\b|jerky|seitan|cottage|\u0442\u0432\u043e\u0440\u043e\u0433|skyr|tofu|ソイ|大豆|soy|たんぱく|タンパク|蛋白|ささみ|サラダチキン|チキン|鶏|肉|ハム|ジャーキー|魚|鮭|さけ|サーモン|まぐろ|ツナ|かつお|\u9c39|いか|イカ|たこ|えび|海老|ほたて|帆立|貝|かに|蟹|ちくわ|かまぼこ|蒲\u927e|はんぺん|しらす|じゃこ|煮干|あたりめ|するめ|さきいか|干|チーズ|ヨーグルト|豆腐|とうふ|納豆|おから|ゆば|湯葉|高野|卵|たまご|エッグ|egg|bcaa|eaa|アミノ|コラーゲン|ゼラチン|酵母|きな粉|きなこ|ピーナッツ|落花生|ナッツ/i;
const SWEET_CATS = new Set(['菓子・デザート', '飲料', 'パン', '主食', '麺']);
/** Categories whose energy legitimately sits away from 4P+9F+4C (fibre, alcohol). */
const ATWATER_FREE = new Set(['酒', '海藻', 'きのこ', '野菜', '果物', '大豆・豆', 'ナッツ・種', 'いも']);
/** Fibre or sugar alcohols counted as 4 kcal/g carbohydrate: energy under 4P+9F+4C. */
const FIBRE = /糖質|ロカボ|低糖|carb|ファイバー|fib(?:er|re)|ブラン|bran|豆(?!乳)|bean|野菜|サラダ|salad|めかぶ|ごぼう|オクラ|スパイス|spice|抹茶|matcha|ココア|cocoa|カカオ|cacao|胡麻|ごま|sesame|おから|オートミール|oat|チアシード|chia|雑穀|玄米|全粒|whole|ライ麦|rye|ナッツ|nut|アーモンド|almond|漬|キムチ|kimchi|昆布|シリアル|cereal|グラノーラ|granola|keto|ケト|シュガーレス|ノンシュガー|sugar.?free/i;
const CREATINE = /クレアチン|クレアルカリン|creatine/i;
/** A default portion's energy at most (the chain menus' are per serving: unchecked). */
const PORTION_KCAL_MAX = 1500;

/**
 * The CI guard's stricter checks (no fix: a hit is reviewed, then fixed in data_src/food_fixes.json or listed in
 * data_src/suspect_ok.json): `atwater25`, kcal over 25 % (and 30 kcal) from 4P+9F+4C, fibre counted at 2 kcal/g,
 * 80 kcal and up, not a category or name whose energy is off by nature; `protein35`, protein over 35 % of the energy
 * of a product's sweet, drink, bread or staple not named as a protein food; `portion1500`, a default portion over
 * 1,500 kcal (a pack as the serving).
 * Plus every `plausible` rule that would still fire.
 */
export function suspect(it: Item): string[] {
  const out = plausible(it).flags;
  if (perServing(it)) return out;
  const { kcal, p, f, c } = it;
  const nm = nameOf(it);
  if (known(p) && known(f) && known(c)) {
    const est = atwater(p, f, c);
    const lo = est - 2 * (it.fib ?? 0);
    const off = (k: number, e: number): number => (k - e) / Math.max(k, e, 1);
    const free = ATWATER_FREE.has(it.cat ?? '') || LOW_KCAL_OK.test(nm) || CREATINE.test(nm);
    if (kcal >= 80 && !free && Math.abs(kcal - est) >= 30 && Math.abs(off(kcal, est)) > 0.25 && Math.abs(off(kcal, lo)) > 0.25
        && !(kcal < est && FIBRE.test(nm)) && !(kcal > est && ALCOHOL.test(nm))) out.push('atwater25');
    if (label(it) && kcal >= 50 && (4 * p) / kcal > 0.35 && SWEET_CATS.has(it.cat ?? '') && !PROTEIN_FOOD.test(nm)) out.push('protein35');
  }
  if (((it.portions?.[0]?.g ?? 0) * kcal) / 100 > PORTION_KCAL_MAX) out.push('portion1500');
  return out;
}

/** A reviewed correction (data_src/food_fixes.json): per-100 g fields and portions set, or the row dropped. */
export interface Fix {
  set?: Partial<Pick<Item, 'kcal' | 'p' | 'f' | 'c' | 'salt' | 'portions' | 'name' | 'cat'>>;
  drop?: true;
  why: string;
  src: string;
}

/** An item with its fix applied (null: dropped); `portions: []` removes them. */
export function applyFix(it: Item, fix: Fix | undefined): Item | null {
  if (!fix) return it;
  if (fix.drop) return null;
  const out = { ...it, ...fix.set };
  if (out.portions && !out.portions.length) delete out.portions;
  return out;
}

