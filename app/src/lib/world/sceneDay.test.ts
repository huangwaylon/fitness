import { beforeEach, expect, it } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { greetOnce, water, wateredOn } from './sceneDay.ts';

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}
let kv: Mem;
beforeEach(() => configureStorage({ local: (kv = new Mem()) }));

it('a hybrid is greeted once on a phone: again only when it couldn’t be shown; a new one is greeted', () => {
  let shown = 0;
  const show = (ok = true) => () => (shown++, ok);
  expect(greetOnce('2026-11-04|fl:1|black-cosmos', show(false))).toBe(false); // (the 3D island not up yet)
  expect(greetOnce('2026-11-04|fl:1|black-cosmos', show())).toBe(true);
  expect(greetOnce('2026-11-04|fl:1|black-cosmos', show())).toBe(true);
  expect(shown).toBe(2);
  greetOnce('2026-11-05|fl:2|orange-cosmos', show());
  expect(shown).toBe(3);
});

it('an older build’s per-phone hybrid in the garden is dropped at the next watering; today’s watering kept', () => {
  kv.setItem('scene-garden', JSON.stringify({ date: '2026-11-04', watered: ['fl:1'], hybrid: { id: 'fl:1', flower: 'black-cosmos' } }));
  water('2026-11-04', 'fl:2');
  expect(JSON.parse(kv.getItem('scene-garden')!)).toEqual({ date: '2026-11-04', watered: ['fl:1', 'fl:2'] });
  expect(wateredOn('2026-11-04')).toEqual(['fl:1', 'fl:2']);
});
