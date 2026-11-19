// The food data checks (docs/food-data.md "Data checks"; plausible.ts): the cases off.py shares, and the CI guard over
// every shipped row (each dataset and barcode shard as static/food/ has it, in the deploy gate's vitest run): none trips
// a rule (scripts/food-data.ts ran them), none a suspect check but the reviewed exceptions (none stale), and every
// reviewed correction is what ships.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeItems } from './db.ts';
import { applyFix, nameGrams, plausible, suspect, type Fix } from './plausible.ts';
import type { FoodIndex, Item, Shipped } from './types.ts';

const DIR = join(import.meta.dirname, '../../../static/food');
const SRC = join(import.meta.dirname, '../../../../food-data/data_src');
const read = <T,>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

interface Case { why: string; name: string; cat: string; kcal: number; p: number | null; f: number | null; c: number | null; salt: number | null;
  portions?: Item['portions']; flags: string[]; out?: Partial<Record<keyof Item, unknown>>; suspect?: string[] }

describe('plausible: the shared cases (data_src/plausible_cases.json, off.py test_shared_cases)', () => {
  for (const cs of read<Case[]>(join(SRC, 'plausible_cases.json'))) {
    it(cs.why, () => {
      const { why: _w, flags, out, suspect: sus, py_drop: _d, ...rest } = cs as Case & { py_drop?: boolean };
      const it0: Item = { id: 'off:0', ...rest };
      const { item, flags: got } = plausible(it0);
      expect(got).toEqual(flags);
      for (const [k, v] of Object.entries(out ?? {})) expect(item![k as keyof Item] ?? null).toEqual(v);
      if (sus) expect(suspect(it0)).toEqual(sus);
    });
  }
  it('drops a chain menu over 9.1 kcal a gram its name states, only its own grams counted', () => {
    expect(plausible({ id: 'kal:1', name: 'ペペロンチーノソース 30g', kcal: 520 })).toEqual({ item: null, flags: ['name_density'] });
    expect(plausible({ id: 'kal:2', name: 'ナッツ 30ｇ', kcal: 180 }).item).not.toBeNull();
    expect(['塩レモン 30g', 'x 1.5g', '2個入 30g', 'ステーキ＆ハンバーグ 100g', '4バッグ 16g', '天津飯(肉100g)', 'ハンバーグ120g'].map(nameGrams))
      .toEqual([30, 1.5, null, null, null, null, null]);
  });
  it('fixes kJ typed as kcal on a product, never drops one; applies a reviewed correction', () => {
    expect(plausible({ id: 'off:1', name: 'x', kcal: 801, p: 19, f: 14, c: null, salt: null }).item!.kcal).toBe(191);
    const fix: Fix = { set: { c: 2, portions: [] }, why: '', src: '' };
    expect(applyFix({ id: 'off:1', name: 'x', kcal: 61, c: 20, portions: [{ label: '1食分', g: 320 }] }, fix)).toEqual({ id: 'off:1', name: 'x', kcal: 61, c: 2 });
    expect(applyFix({ id: 'off:1', name: 'x', kcal: 1 }, { drop: true, why: '', src: '' })).toBeNull();
  });
});

describe('static/food passes the data checks (the CI guard)', () => {
  const index = read<FoodIndex>(join(DIR, 'index.json'));
  const files = [...index.datasets.map((d) => d.file), ...readdirSync(join(DIR, 'jan')).sort().map((f) => `jan/${f}`)];
  const t0 = performance.now();
  const rows = new Map<string, Item>();
  for (const f of files) for (const it of decodeItems(read<Shipped>(join(DIR, f)))) rows.set(it.id, it);
  const ok = read<Record<string, { checks: string[]; why: string }>>(join(SRC, 'suspect_ok.json'));
  const fixes = read<Record<string, Fix>>(join(SRC, 'food_fixes.json'));

  it('every row passes the rules, and the suspect checks but for the reviewed exceptions (data_src/suspect_ok.json), none stale', () => {
    const tripped: string[] = [];
    const hits = new Map<string, string[]>();
    for (const it of rows.values()) {
      if (plausible(it).flags.length) tripped.push(it.id);
      const s = suspect(it);
      if (s.length) hits.set(it.id, s);
    }
    expect(tripped).toEqual([]);
    expect([...hits].filter(([id, s]) => ok[id]?.checks.join() !== s.join()).map(([id, s]) => `${id} ${s.join()}`)).toEqual([]);
    expect(Object.keys(ok).filter((id) => !hits.has(id))).toEqual([]);
    expect(Object.values(ok).filter((o) => !o.why)).toEqual([]);
    expect(rows.size).toBeGreaterThan(100_000);
    expect(performance.now() - t0).toBeLessThan(5000);   // (~0.3 s here: the guard stays cheap)
  });

  it('ships every reviewed correction (data_src/food_fixes.json): a dropped id nowhere, a set one with its values', () => {
    const off: string[] = [];
    for (const [id, fix] of Object.entries(fixes)) {
      if (!fix.why || !fix.src) off.push(`${id}: no why or src`);
      const row = rows.get(id);
      if (fix.drop) {
        if (row) off.push(`${id}: still shipped`);
        continue;
      }
      if (!row) off.push(`${id}: not shipped`);
      else for (const [k, v] of Object.entries(fix.set ?? {})) {
        const want = k === 'portions' && Array.isArray(v) && !v.length ? undefined : v;
        if (JSON.stringify(row[k as keyof Item]) !== JSON.stringify(want)) off.push(`${id}: ${k}`);
      }
    }
    expect(off).toEqual([]);
  });

  it("lists every dropped product's barcode in index.json `drop` (the scanner's not found, never live OFF's values), nothing else", () => {
    const codes = Object.keys(fixes).filter((id) => fixes[id].drop && id.startsWith('off:')).map((id) => id.slice(4)).sort();
    expect(codes.every((c) => /^\d{8,14}$/.test(c))).toBe(true);
    expect(index.drop ?? []).toEqual(codes);
  });
});
