// よみきき サンド's まだ (docs/curriculum-wave2.md §2.0): a mark on this phone, folded into srs.ts's cards as a "hard"
// answer on its day. Pure, over a made-up store.
import { describe, expect, it } from 'vitest';
import type { KV } from '../sync/storage.ts';
import type { Answer } from './progress.ts';
import { loadAll } from './pool.ts';
import { cardsOf, dueOf, madaOf, markMada } from './srs.ts';

await loadAll();

const kv = (): KV & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};
const ans = (id: string, d: string, ok = true, rp = 0): Answer => ({ id, ok, pick: ok ? 0 : 1, rp, d: d as Answer['d'], g: 'g1', lv: 1, p: false });

describe('サンド まだ', () => {
  it('keeps each player’s marks on the phone, one an item a day, the newest 200', () => {
    const s = kv();
    expect(madaOf(s, 'A')).toEqual([]);
    markMada(s, 'A', 'w1-right', '2026-11-05');
    markMada(s, 'A', 'w1-right', '2026-11-05');
    markMada(s, 'B', 'w1-hat', '2026-11-05');
    markMada(s, 'A', 'w1-right', '2026-11-06');
    expect(madaOf(s, 'A')).toEqual([{ id: 'w1-right', d: '2026-11-05' }, { id: 'w1-right', d: '2026-11-06' }]);
    expect(madaOf(s, 'B')).toEqual([{ id: 'w1-hat', d: '2026-11-05' }]);
    for (let i = 0; i < 210; i++) markMada(s, 'A', `x${i}`, '2026-11-07');
    expect(madaOf(s, 'A')).toHaveLength(200);
    expect(madaOf(s, 'A').at(-1)).toEqual({ id: 'x209', d: '2026-11-07' });
    s.m.set('island.kikiMada', '{"A":[[1,"x"],["ok","2026-11-05"]]}');
    expect(madaOf(s, 'A')).toEqual([{ id: 'ok', d: '2026-11-05' }]);
    expect(madaOf(null, 'A')).toEqual([]);
  });

  it('folds a まだ in as "hard" on its day, after that day’s answers', () => {
    const answers = [ans('w1-right', '2026-11-03'), ans('w1-hat', '2026-11-05')];
    // right on the first listen: no card
    expect(cardsOf(answers).items.has('w1-right')).toBe(false);
    // then まだ on 11-03: a card at box 1, due the next day; a right answer after it moves it up
    const c = cardsOf(answers, undefined, [{ id: 'w1-right', d: '2026-11-03' }]);
    expect(c.items.get('w1-right')).toEqual({ box: 1, due: c.items.get('w1-right')!.last + 1, last: c.items.get('w1-right')!.last });
    expect(dueOf(c, '2026-11-04').items).toContain('w1-right');
    const later = cardsOf([...answers, ans('w1-right', '2026-11-06')], undefined, [{ id: 'w1-right', d: '2026-11-03' }]);
    expect(later.items.get('w1-right')!.box).toBe(2);
    // a まだ the same day as a miss: the miss first (box 0), then hard (box 1)
    const m = cardsOf([ans('w1-right', '2026-11-05', false)], undefined, [{ id: 'w1-right', d: '2026-11-05' }]);
    expect(m.items.get('w1-right')!.box).toBe(1);
  });
});
