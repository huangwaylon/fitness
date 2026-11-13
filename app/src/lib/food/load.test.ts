// The shipped data (static/food/, scripts/food-data.ts) as loadFoodDb reads it: every file index.json lists is there
// and nothing else, every item makes a snapshot the record accepts, and the PoC's searches still find their food.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { foodOp } from '#lib/contract/food.ts';
import { loadFoodDb } from './load.ts';
import { addDataset, credits, emptyDb, findFoods, nearFoods, searchFoods, shopIn, shopsFor, SLICE, verifyOf, withJan, type FoodDb } from './db.ts';
import { portionsOf, toSnap } from './nutrition.ts';
import type { Dataset, FoodIndex, Item } from './types.ts';
import { tierOf, type Entry } from './search.ts';
import { searchKey } from './text.ts';

const DIR = join(import.meta.dirname, '../../../static/food');
const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8')) as FoodIndex;
const fetched: string[] = [];

let db: FoodDb;
beforeAll(async () => {
  vi.stubGlobal('fetch', async (href: string) => {
    fetched.push(href);
    const file = href.match(/\/food\/([\w-]+\.json)/)?.[1];
    return file ? new Response(readFileSync(join(DIR, file))) : new Response(null, { status: 404 });
  });
  db = await loadFoodDb();
  await db.wantMore();
});
afterAll(() => {
  vi.unstubAllGlobals();
});

describe('static/food', () => {
  it('holds index.json, verify.json and exactly the datasets index.json lists (no barcode shards)', () => {
    expect(readdirSync(DIR).sort()).toEqual(['index.json', 'verify.json', ...index.datasets.map((d) => d.file)].sort());
    expect(index.version).toMatch(/^[0-9a-f]{12}$/);
    // the lazy ones: the products and the chain menus (Kalori), both secondary
    expect(index.datasets.filter((d) => d.lazy).map((d) => d.file).sort()).toEqual(['kalori.json', 'products.json']);
    expect(index.datasets.find((d) => d.file === 'kalori.json')).toMatchObject({ source: 'kalori', secondary: true, lazy: true });
  });

  it('versions each file as shipped (scripts/food-data.ts): a refresh of one (Kalori’s, weekly) is a new ?v= for that one alone', () => {
    const shipped = ['verify.json', ...index.datasets.map((d) => d.file)];
    const own = Object.fromEntries(shipped.map((f) => [f, createHash('sha256').update(readFileSync(join(DIR, f))).digest('hex').slice(0, 12)]));
    expect(index.files).toEqual(own);
    // `version`, of them all: an older app's or worker's ?v=, and an index without `files`' for every file
    const hash = createHash('sha256');
    for (const f of shipped) hash.update(`${f}\0`).update(readFileSync(join(DIR, f))).update('\0');
    expect(index.version).toBe(hash.digest('hex').slice(0, 12));
  });

  it('every item makes a snapshot the record accepts, and has a 100 g portion to pick', () => {
    const bad: string[] = [];
    for (const d of index.datasets) {
      // (as the loader has them: a chain menu's sv and brand are its, db.ts withJan)
      for (const it of withJan(JSON.parse(readFileSync(join(DIR, d.file), 'utf8')) as Dataset).items) {
        const [first] = portionsOf(it);
        const op = foodOp({ id: 'f0000000', at: 1.8e12, d: '2026-11-03', m: 'l', g: first.g, f: toSnap(it, first.label) });
        if (!op || op.rm || op.f.n !== toSnap(it).n) bad.push(it.id);
      }
    }
    expect(bad).toEqual([]);
  });

  it('carries MEXT’s fibre and alcohol (食物繊維総量, アルコール; food-data/ build), alcohol on drinks only', () => {
    const items = new Map<string, Item>();
    for (const d of index.datasets) for (const it of (JSON.parse(readFileSync(join(DIR, d.file), 'utf8')) as Dataset).items) items.set(it.id, it);
    const of = (id: string) => [items.get(id)?.fib, items.get(id)?.alc];
    // ごはん, 玄米, ブロッコリー, まこんぶ, 鶏むね: fibre; ビール, 純米酒, ウイスキー: alcohol; 本みりん (a seasoning): none
    const ids = ['mext:01088', 'mext:01080', 'mext:06263', 'mext:09017', 'mext:11220', 'mext:16006', 'mext:16002', 'mext:16016', 'mext:16025'];
    const notDrinks = [...items.values()].filter((it) => it.alc !== undefined && it.cat !== '酒').map((it) => it.id);
    const withFib = (src: string) => [...items.values()].filter((it) => it.id.startsWith(`${src}:`) && typeof it.fib === 'number').length;
    expect([ids.map(of), notDrinks, withFib('off'), withFib('dishes') > 300, toSnap(items.get('mext:16006')!)]).toEqual([
      [[1.5, undefined], [3, undefined], [5.1, undefined], [32.1, undefined], [0, undefined], [0, 3.7], [0, 12.3], [0, 33.4], [undefined, undefined]],
      [], 0, true, { id: 'mext:16006', n: 'ビール', k: 39, p: 0.3, fa: 0, c: 3.1, s: 0, fi: 0, al: 3.7 }
    ]);
  });
});

describe('loadFoodDb', () => {
  it('fetches index.json bare and every data file under its own version, from the app’s base', () => {
    expect(fetched[0]).toMatch(/\/food\/index\.json$/);
    const asked = fetched.slice(1).map((h) => h.match(/\/food\/([\w-]+\.json)\?v=(\w+)$/)?.slice(1));
    expect(asked.filter((m) => !m || m[1] !== index.files?.[m[0]])).toEqual([]);
    // (the lazy ones last: at wantMore)
    const lazy = index.datasets.filter((d) => d.lazy).map((d) => d.file);
    expect(fetched.slice(-lazy.length).map((h) => h.match(/\/food\/([\w-]+\.json)\?v=/)?.[1]).sort()).toEqual(lazy.sort());
    expect(db.sets.length).toBe(index.datasets.length);
  });

  it('finds the PoC’s foods: the core item first, confirmed ones with their sources', () => {
    expect(searchFoods(db, 'ごはん', 5)[0].id).toBe('mext:01088');
    expect(searchFoods(db, 'なっとう').length).toBeGreaterThan(0);
    const mabo = searchFoods(db, 'マーボー豆腐', 3)[0];
    expect(mabo.id.startsWith('dishes:') || mabo.id.startsWith('eatout:') || mabo.id.startsWith('mext:')).toBe(true);
    expect(verifyOf(db, mabo.id)?.n).toBeGreaterThanOrEqual(2);
  });

  it('searches exactly as with keys built on load (a core dataset’s shipped `keys`, none in a lazy one; a product’s barcode from its id)', async () => {
    const ref = emptyDb(index);
    for (const d of index.datasets) {
      const data = JSON.parse(readFileSync(join(DIR, d.file), 'utf8')) as Dataset;
      expect(data.items.every((it) => typeof it.keys === (d.lazy ? 'undefined' : 'string')), d.file).toBe(true);
      // the data as it was: no keys, every barcode (a chain menu's brand: its shop's, withJan)
      const items = data.items.map(({ keys: _k, ...it }) => it);
      await addDataset(ref, d, withJan({ ...data, items }));
    }
    ref.verify = db.verify;
    // the same order as loadFoodDb's (datasets in the order they came): the same ties
    const order = new Map(db.entries.map((e, i) => [e.it.id, i]));
    ref.entries.sort((a, b) => order.get(a.it.id)! - order.get(b.it.id)!);
    expect(ref.entries.map((e) => [e.n, e.al, e.h.replaceAll(' ', '|')])).toEqual(db.entries.map((e) => [e.n, e.al, e.h.replaceAll(' ', '|')]));
    for (const q of ['ご', 'ごはん', 'と', 'とりむね', 'らーめん', 'パン', 'k', 'kara', 'カレー', 'コーヒー', '牛乳', 'ん', 'chicken', 'ごはん 大盛', '4901777', 'natto', 'ﾗｰﾒﾝ']) {
      expect(searchFoods(db, q, 40).map((x) => x.id), q).toEqual(searchFoods(ref, q, 40).map((x) => x.id));
    }
    expect(searchFoods(db, '4902102', 5).length).toBeGreaterThan(0); // a barcode prefix still finds products
  });

  it('one row per food in its states: never two items of one vg; the default shown unless a word picks another', () => {
    const twice: string[] = [];
    for (const q of ['豚ロース', '鶏もも', 'スパゲッティ', 'うどん', 'じゃがいも', 'さけ', 'ブロッコリー', 'まぐろ', 'えだまめ', 'さつまいも']) {
      const vgs = searchFoods(db, q, 60).map((x) => x.vg).filter(Boolean);
      if (new Set(vgs).size !== vgs.length) twice.push(q);
    }
    expect(twice).toEqual([]);
    const first = (q: string) => searchFoods(db, q, 5).find((x) => x.vg);
    expect(first('豚ロース')?.name).toBe('豚ロース 脂身つき 生');
    expect(first('豚ロース 焼き')?.st).toBe('焼き');
    expect(first('スパゲッティ')?.st).toBe('ゆで');
    expect(searchFoods(db, '焼きいも', 1)[0].name).toBe('焼きいも');
  });

  it('lookalikes out unless asked for (豚 中型種, 親鶏, 交雑牛); a meat’s 脂身 alone under its cuts', () => {
    const names = (q: string) => searchFoods(db, q, 60).map((x) => x.name);
    expect(names('豚ロース').some((n) => n.includes('中型種'))).toBe(false);
    expect(names('豚ロース 中型種').some((n) => n.includes('中型種'))).toBe(true);
    expect(names('鶏もも').some((n) => n.startsWith('親鶏'))).toBe(false);
    expect(names('親鶏').some((n) => n.startsWith('親鶏'))).toBe(true);
    const loin = names('豚ロース');
    expect(loin.indexOf('豚ロース 脂身 生')).toBeGreaterThan(loin.indexOf('豚ロース 赤肉 生'));
    expect(names('まぐろ 脂身').length).toBeGreaterThan(0); // toro stays where it was
  });

  it('ranks a score at a time exactly as one sort of every hit did (search.ts before the top-n ranking)', () => {
    const groupOf = (id: string) => db.verify?.byId[id];
    const sortAll = (query: string, limit: number): Item[] => {
      const tokens = query.trim().split(/[\s　]+/).map(searchKey).filter(Boolean);
      const q = tokens.join('');
      const hits: { e: Entry; s: number }[] = [];
      for (const e of db.entries) if (tokens.every((t) => e.h.includes(t)) && !/（中型種）|^親鶏|^交雑牛/.test(e.it.name)) hits.push({ e, s: tierOf(e, q) + e.pen - (e.pop < 0 ? -2.5 : e.pop * 0.6) + (/(^|\s)皮(\s|$)/.test(e.it.name) || (e.it.cat === '肉' && /(^|[\s（])脂身(\s|$)/.test(e.it.name)) ? 1 : 0) });
      hits.sort((a, b) => a.s - b.s || b.e.pop - a.e.pop || a.e.n.length - b.e.n.length);
      const rep = new Map<number, Entry>();
      for (const { e } of hits) {
        const g = groupOf(e.it.id);
        if (g === undefined) continue;
        const r = rep.get(g);
        if (!r || (r.pen > 0 && e.pen <= 0)) rep.set(g, e);
      }
      // a food in its states: its best hit, its default at a tie
      const state = new Map<string, { e: Entry; s: number }>();
      for (const h of hits) {
        const v = h.e.it.vg, r = v && state.get(v);
        if (v && (!r || (h.s === r.s && h.e.it.id === v && r.e.it.id !== v))) state.set(v, h);
      }
      const seen = new Set<string | number>();
      const out: Item[] = [];
      for (const h0 of hits) {
        const v = h0.e.it.vg;
        if (v && seen.has(`v:${v}`)) continue;
        const h = v ? state.get(v)! : h0;
        if (v) seen.add(`v:${v}`);
        const g = groupOf(h.e.it.id);
        const e = g === undefined ? h.e : rep.get(g)!;
        const k = `${e.n}|${e.it.kcal}`;
        if (seen.has(k) || (g !== undefined && seen.has(g))) continue;
        seen.add(k);
        if (g !== undefined) seen.add(g);
        if (out.push(e.it) >= limit) break;
      }
      return out;
    };
    // every other kana (all of them took 1.5 s, a test too slow under the full suite's load)
    const kana = Array.from({ length: 0x3093 - 0x3041 + 1 }, (_, i) => String.fromCharCode(0x3041 + i)).filter((_, i) => i % 2 === 1);
    // (sortAll's list stops at `limit` and is otherwise the same: its top 5 and 40 are its top 60's first, one sort a query;
    // mismatches collected, one expect)
    const fails: { q: string; limit: number; got: string[]; want: string[] }[] = [];
    for (const q of [...kana, ...'abcdefghijklmnopqrstuvwxyz', 'ごはん', 'とりむね', 'らーめん', 'カレー', '牛乳', '豆腐', 'ごはん 大盛', 'chicken', '49']) {
      const all = sortAll(q, 60).map((x) => x.id);
      for (const limit of [5, 40, 60]) {
        const got = searchFoods(db, q, limit).map((x) => x.id), want = all.slice(0, limit);
        if (got.length !== want.length || got.some((id, i) => id !== want[i])) fails.push({ q, limit, got, want });
      }
    }
    expect(fails.slice(0, 3)).toEqual([]);
  });

  it('indexes a dataset a slice at a time, pausing in between', async () => {
    const d = emptyDb(index);
    const items = Array.from({ length: 2 * SLICE + 1 }, (_, i) => ({ id: `x:${i}`, name: `しょくひん${i}`, kcal: 1 }));
    let pauses = 0;
    await addDataset(d, index.datasets[0], { source: 'x', items }, async () => {
      pauses++;
      expect(d.entries.length).toBe(pauses * SLICE);
    });
    expect([pauses, d.entries.length]).toEqual([2, 2 * SLICE + 1]);
  });

  it('credits every dataset and the verify-only sources (USDA), each with its attribution', () => {
    const c = credits(db);
    expect(c.length).toBeGreaterThanOrEqual(index.datasets.length + 1);
    expect(c.find((x) => x.label === 'Open Food Facts')?.attribution).toContain('Open Food Facts');
    expect(c.filter((x) => !x.attribution)).toEqual([]);
  });
});

// 近いもの (search.ts nearby): what people type, not the catalog's name; nothing holds it whole (review 11/10 r3 N3)
describe('a query nothing holds whole', () => {
  it('the foods whose names hold the most of it first', () => {
    const q = 'とんこつ醤油ラーメン味玉チャーシュー増し';
    expect(searchFoods(db, q)).toEqual([]);
    const hits = nearFoods(db, q);
    const near = hits.map((x) => x.name);
    // the name holding the most of it first (with the chain menus in, a chain's 味玉チャーシュー醤油ラーメン); the chain
    // menus in two rows of eight at most, so the generic 豚骨醤油ラーメン and ラーメン（醤油） stay in sight
    // (search.ts CHAIN_NEAR_SHARE)
    expect(near[0]).toContain('醤油ラーメン');
    expect(near).toContain('豚骨醤油ラーメン');
    expect(near).toContain('ラーメン（醤油）');
    expect(hits.filter((x) => x.id.startsWith('kal:')).length).toBeLessThanOrEqual(2);
    expect(nearFoods(db, 'とんこつラーメン煮卵のせ')[0].name).toBe('豚骨ラーメン');
    expect(nearFoods(db, 'zzzz')).toEqual([]);
  });
});

// The golden queries: what people type most, and the food they mean first (docs/design.md "Gohan", search). An exact
// alias is level with a name's prefix (たまご → 卵), a name's head counts as the name (水 → 水（ミネラルウォーター）), and a
// packaged product never beats the generic food. Failures collected, one expect.
const GOLDEN: [q: string, top: string][] = [
  ['ご飯', 'mext:01088'], ['ごはん', 'mext:01088'], ['白米', 'mext:01088'], ['みそ汁', 'dishes:miso-tofu-wakame'],
  ['味噌汁', 'dishes:miso-tofu-wakame'], ['みそしる', 'dishes:miso-tofu-wakame'], ['卵', 'mext:12004'], ['たまご', 'mext:12004'],
  ['ゆで卵', 'mext:12005'], ['目玉焼き', 'dishes:medamayaki'], ['納豆', 'mext:04046'], ['natto', 'mext:04046'],
  ['鶏むね', 'mext:11220'], ['とりむね', 'mext:11220'], ['サラダチキン', 'eatout:saladchicken'], ['ささみ', 'mext:11227'],
  ['プロテイン', 'eatout:protein_whey'], ['おにぎり', 'dishes:onigiri-shake'], ['ラーメン', 'eatout:ramen_shoyu'],
  ['味噌ラーメン', 'eatout:ramen_miso'], ['うどん', 'mext:01039'], ['そば', 'mext:01128'], ['パスタ', 'mext:01064'],
  ['水', 'eatout:water'], ['牛乳', 'mext:13003'], ['バナナ', 'mext:07107'], ['食パン', 'mext:01026'], ['パン', 'mext:01026'],
  ['コーヒー', 'mext:16045'], ['お茶', 'mext:16037'], ['緑茶', 'mext:16037'], ['ヨーグルト', 'mext:13025'], ['豆腐', 'mext:04032'],
  ['鮭', 'mext:10134'], ['カレー', 'dishes:curry-pork'], ['ビール', 'mext:16006'], ['りんご', 'mext:07148'], ['みかん', 'mext:07027'],
  ['唐揚げ', 'dishes:karaage'], ['牛丼', 'dishes:gyudon'], ['ブロッコリー', 'mext:06263'], ['ぎょうざ', 'mext:18002'],
  ['餃子', 'dishes:gyoza'], ['アイス', 'mext:13043'], ['チョコ', 'mext:15116'], ['オートミール', 'mext:01004'], ['塩', 'mext:17012'],
  ['さとう', 'mext:03003'], ['ハンバーグ', 'mext:18050'], ['チャーハン', 'mext:18057'], ['トマト', 'mext:06182'],
  ['キャベツ', 'mext:06061'], ['ポテチ', 'mext:15103'], ['豚汁', 'dishes:tonjiru'], ['枝豆', 'eatout:edamame']
];
const isProduct = (id: string) => id.startsWith('off:') || id.startsWith('jbfd:');

describe('the golden queries', () => {
  it(`${GOLDEN.length} common queries find their food first`, () => {
    const fails: string[] = [];
    for (const [q, top] of GOLDEN) {
      const got = searchFoods(db, q, 1)[0]?.id;
      if (got !== top) fails.push(`${q}: ${got} (want ${top})`);
    }
    expect(fails).toEqual([]);
  });

  it('a rare or lab form (pop -1) stays out of the top ten: キャベツ’s washes, 卵 素揚げ', () => {
    const top = (q: string) => searchFoods(db, q, 10).map((x) => x.name);
    expect(top('キャベツ')[0]).toMatch(/^キャベツ/);
    expect(top('キャベツ').filter((n) => /洗浄/.test(n))).toEqual([]);
    expect(top('卵').filter((n) => /素揚げ/.test(n))).toEqual([]);
  });

  it('a packaged product never ranks above a generic food in the top three', () => {
    const fails: string[] = [];
    for (const [q] of GOLDEN) {
      const ids = searchFoods(db, q, 3).map((x) => x.id);
      const firstProduct = ids.findIndex(isProduct);
      if (firstProduct >= 0 && ids.slice(firstProduct).some((id) => !isProduct(id))) fails.push(`${q}: ${ids.join(' ')}`);
    }
    expect(fails).toEqual([]);
  });
});

describe('the chain menus (Kalori, invented items)', () => {
  const kal = (id: number, shop: string, brand: string, name: string, kcal: number, more: Partial<Item> = {}): Item =>
    ({ id: `kal:${id}`, name, brand, shop, cat: 'その他', kcal, p: 10, f: 10, c: 10, sv: true, ...more });
  const chains: Dataset = {
    source: 'kalori',
    shops: {
      sukiya: { name: 'すき家' }, 'seven-eleven': { name: 'セブン-イレブン', aliases: ['セブン', 'セブイレ'] },
      starbucks: { name: 'スターバックス', aliases: ['スタバ'] }, karaage: { name: '唐揚げ' }
    },
    items: [
      kal(1, 'sukiya', 'すき家', '牛丼 並盛', 733, { vg: 'kal:1', st: '並盛' }), kal(2, 'sukiya', 'すき家', '牛丼 大盛', 960, { vg: 'kal:1', st: '大盛' }),
      kal(3, 'seven-eleven', 'セブン-イレブン', '唐揚げ棒', 198), kal(4, 'seven-eleven', 'セブン-イレブン', '手巻おにぎり 鮭', 182),
      kal(5, 'seven-eleven', 'セブン-イレブン', '牛丼', 640),
      kal(6, 'starbucks', 'スターバックス', 'カフェ モカ（Tall・ミルク）', 288, { vg: 'kal:6', st: 'Tall・ミルク', aliases: ['カフェ モカ（トール・ミルク）'] }),
      kal(7, 'starbucks', 'スターバックス', 'カフェ モカ（Grande・ミルク）', 376, { vg: 'kal:6', st: 'Grande・ミルク', aliases: ['カフェ モカ（グランデ・ミルク）'] }),
      kal(8, 'karaage', '唐揚げ', 'から揚げ定食', 900)
    ]
  };
  let k: FoodDb;
  beforeAll(async () => {
    // (the shipped catalog without its own chain menus: these invented ones in their place)
    const real = (it: Item) => it.id.startsWith('kal:');
    k = {
      ...db, entries: db.entries.filter((e) => !real(e.it)), byId: new Map([...db.byId].filter(([, it]) => !real(it))),
      variants: new Map([...db.variants].filter(([, vs]) => !vs.some(real))), sets: db.sets.filter((s) => s.source !== 'kalori'), shopKeys: new Map()
    };
    await addDataset(k, { file: 'kalori', source: 'kalori', badge: '店', secondary: true, lazy: true }, chains);
  });
  const ids = (q: string, n = 60) => searchFoods(k, q, n).map((x) => x.id);

  it('the file ships no sv, portion or brand (kalori_convert.py): the loader gives each its own (db.ts withJan)', () => {
    const shipped: Dataset = { source: 'kalori', shops: chains.shops, items: [{ id: 'kal:1', name: '牛丼 並盛', shop: 'sukiya', kcal: 733 }, { id: 'kal:9', name: 'x', shop: 'gone', kcal: 1 }] };
    const [don, stray] = withJan(shipped).items;
    expect([don.sv, don.brand, stray.brand, portionsOf(don)]).toEqual([true, 'すき家', 'gone', [{ label: '1食', g: 100 }]]);
    expect(toSnap(don).sv).toBe(true);
    // (an older file's, as shipped: its lone 1食 dropped; another set's items untouched)
    const old = withJan({ source: 'kalori', shops: {}, items: [{ id: 'kal:2', name: 'y', shop: 's', brand: 'S', kcal: 1, sv: true, portions: [{ label: '1食', g: 100 }] }] }).items[0];
    expect([old.brand, old.portions]).toEqual(['S', undefined]);
    const off = withJan({ source: 'off', items: [{ id: 'off:4901', name: 'z', shop: 'x', kcal: 1 }] }).items[0];
    expect([off.sv, off.brand, off.jan]).toEqual([undefined, undefined, '4901']);
  });

  it('rank under the generic foods when no shop is named: 牛丼 finds 牛丼（並盛） first, a chain’s after', () => {
    const got = ids('牛丼');
    expect(got[0]).toBe('dishes:gyudon');
    expect(got.findIndex((id) => id.startsWith('kal:'))).toBeGreaterThan(got.findIndex((id) => !id.startsWith('kal:') && !isProduct(id)));
    for (const [q, top] of GOLDEN) expect(searchFoods(k, q, 1)[0]?.id, q).toBe(top);
  });

  it('a shop named (its name, our short name, any width or case) narrows to its menu, the other words searched within', () => {
    expect(ids('すき家 牛丼')).toEqual(['kal:1']);
    expect(ids('セブン 唐揚げ')).toEqual(['kal:3']);
    expect(ids('唐揚げ セブンイレブン')).toEqual(['kal:3']);
    expect(ids('ｾﾌﾞﾝ 牛丼')).toEqual(['kal:5']);
    expect(ids('スタバ モカ グランデ')).toEqual(['kal:7']);
    expect(ids('スタバ モカ')).toEqual(['kal:6']);
    // the name alone: the whole menu (a food in its states once)
    expect(ids('セブン').sort()).toEqual(['kal:3', 'kal:4', 'kal:5']);
    expect(ids('すき家')).toEqual(['kal:1']);
    expect(shopIn(k, 'スタバ  モカ')).toEqual({ shop: 'starbucks', rest: 'モカ' });
  });

  it('the shops holding a query, the most foods first (a food in its states once); none once a shop is named', () => {
    expect(shopsFor(k, '牛丼')).toEqual([{ shop: 'sukiya', name: 'すき家', n: 1 }, { shop: 'seven-eleven', name: 'セブン-イレブン', n: 1 }]);
    expect(shopsFor(k, 'モカ')).toEqual([{ shop: 'starbucks', name: 'スターバックス', n: 1 }]);
    expect(shopsFor(k, '定食').map((s) => s.shop)).toEqual(['karaage']);
    // (and none without the chain menus in: the catalog before they come)
    expect([shopsFor(k, 'すき家 牛丼'), shopsFor(k, ''), shopsFor({ ...k, shopKeys: new Map() }, '牛丼')]).toEqual([[], [], []]);
    // the search's own pass (findFoods) gives both: the chips count every hit, not only the items asked for
    const found = (q: string, n: number) => { const r = findFoods(k, q, n); return [r.items.map((x) => x.id), r.shops.map((s) => s.shop)]; };
    expect(found('牛丼', 1)).toEqual([['dishes:gyudon'], ['sukiya', 'seven-eleven']]);
    expect(found('すき家 牛丼', 60)).toEqual([['kal:1'], []]);
  });

  it('nothing on the shop’s menu: the query over everything; a shop called as a food is never a shop word', () => {
    expect(ids('すき家 おにぎり')).toEqual(searchFoods(db, 'すき家 おにぎり').map((x) => x.id));
    expect(ids('セブン おにぎり')).toEqual(['kal:4']);
    expect(shopIn(k, '唐揚げ')).toBeNull();
    expect(ids('唐揚げ')[0]).toBe('dishes:karaage');
    // (and no shop word before the chain menus come: the catalog's own, without them)
    expect(shopIn({ ...k, shopKeys: new Map() }, 'セブン')).toBeNull();
  });
});

// A catalog let go while the chain menus still parse (ごはん closed, the page hidden: dbHold's drop): its parse is
// cancelled, else the items arrived so far (~35 MB of the chain menus') stay alive till the parse ends (e2e
// leaks-sheets caught it).
describe('a catalog let go mid-load', () => {
  it('cancels its parse in the worker: the worker ended, a late slice dropped, nothing added or retried', async () => {
    const posted: { id: number }[] = [];
    let w: { onmessage: (e: { data: unknown }) => void } | undefined;
    let ended = 0;
    class FakeWorker {
      onmessage = (_e: { data: unknown }) => {};
      onerror = () => {};
      onmessageerror = () => {};
      constructor() {
        w = this;
      }
      postMessage(m: { id: number }) {
        posted.push(m);
      }
      terminate() {
        ended++;
      }
    }
    vi.stubGlobal('Worker', FakeWorker);
    vi.stubGlobal('location', { href: 'https://x.test/' });
    vi.stubGlobal('fetch', async (href: string) =>
      new Response(href.includes('index.json') ? JSON.stringify({ version: 'v0', datasets: [{ file: 'kalori.json', source: 'kalori', badge: '店', secondary: true, lazy: true }] }) : 'null'));
    try {
      const chances: number[] = [];
      const db = await loadFoodDb(async (n) => void chances.push(n));
      const more = db.wantMore();
      expect(posted).toHaveLength(1);
      const { id } = posted[0];
      w!.onmessage({ data: { id, items: [{ id: 'kal:1', name: 'x', shop: 's', kcal: 1 }] } });
      db.close();
      expect(ended).toBe(1);
      // (the worker's messages already on their way: dropped)
      w!.onmessage({ data: { id, items: [{ id: 'kal:2', name: 'y', shop: 's', kcal: 1 }] } });
      w!.onmessage({ data: { id, head: { source: 'kalori' } } });
      await more;
      expect([db.entries.length, db.pending, chances]).toEqual([0, false, []]);
      // (and asked again once closed: nothing fetched)
      await db.wantMore();
      expect(posted).toHaveLength(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('stops its indexing at the next slice: the rest of a parsed dataset never added', async () => {
    const posted: { id: number }[] = [];
    let w: { onmessage: (e: { data: unknown }) => void } | undefined;
    class FakeWorker {
      onmessage = (_e: { data: unknown }) => {};
      onerror = () => {};
      onmessageerror = () => {};
      constructor() {
        w = this;
      }
      postMessage(m: { id: number }) {
        posted.push(m);
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', FakeWorker);
    vi.stubGlobal('location', { href: 'https://x.test/' });
    vi.stubGlobal('fetch', async (href: string) =>
      new Response(href.includes('index.json') ? JSON.stringify({ version: 'v0', datasets: [{ file: 'kalori.json', source: 'kalori', badge: '店', secondary: true, lazy: true }] }) : 'null'));
    try {
      const db = await loadFoodDb();
      const more = db.wantMore();
      const total = SLICE * 40;
      const { id } = posted[0];
      w!.onmessage({ data: { id, items: Array.from({ length: total }, (_, i) => ({ id: `kal:${i}`, name: `x${i}`, shop: 's', kcal: 1 })) } });
      w!.onmessage({ data: { id, head: { source: 'kalori' } } });
      await vi.waitFor(() => expect(db.entries.length).toBeGreaterThan(0));
      db.close();
      await more;
      expect(db.entries.length).toBeLessThan(total);
      expect(db.entries.length % SLICE).toBe(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('a dataset that fails to load', () => {
  it('an index without per-file versions (an older build’s): every file under its `version`', async () => {
    const asked: string[] = [];
    vi.stubGlobal('fetch', async (href: string) => {
      asked.push(href);
      if (href.includes('index.json')) return new Response(JSON.stringify({ version: 'v0', datasets: [] }));
      return new Response(null, { status: 404 });
    });
    try {
      await loadFoodDb();
      expect(asked.slice(1).map((h) => h.replace(/^.*\/food\//, ''))).toEqual(['verify.json?v=v0']);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('is left out at first, fetched again at its next chance, and added when it comes (onAdd: search again)', async () => {
    const real = JSON.parse(readFileSync(join(DIR, index.datasets[0].file), 'utf8')) as Dataset;
    const small: Dataset = { ...real, items: real.items.slice(0, 20) };
    const idx: FoodIndex = { version: 'v1', datasets: [{ ...index.datasets[0], file: 'a.json', lazy: false }, { ...index.datasets[0], file: 'b.json', lazy: false }] };
    let failB = 1;
    vi.useFakeTimers();
    vi.stubGlobal('fetch', async (href: string) => {
      if (href.includes('index.json')) return new Response(JSON.stringify(idx));
      if (href.includes('b.json') && failB-- > 0) throw new TypeError('offline');
      if (href.includes('verify.json')) return new Response(null, { status: 404 });
      return new Response(JSON.stringify(small));
    });
    try {
      const got = await loadFoodDb((n) => new Promise((ok) => setTimeout(ok, 2000 * 2 ** n)));
      let added = 0;
      got.onAdd(() => added++);
      await vi.advanceTimersByTimeAsync(100);
      expect([got.sets.length, added]).toEqual([1, 0]);
      await vi.advanceTimersByTimeAsync(2100);
      expect([got.sets.length, added]).toEqual([2, 1]);
    } finally {
      vi.useRealTimers();
    }
  });
});
