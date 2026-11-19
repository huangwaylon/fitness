// The food data checks (docs/food-data.md "Data checks"; plausible.ts): the cases off.py shares.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyFix, nameGrams, plausible, suspect, type Fix } from './plausible.ts';
import type { Item } from './types.ts';

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
