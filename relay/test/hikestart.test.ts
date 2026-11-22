// トレイル's start times in the record (contract/hikeStart.ts, docs/backend.md#events `hike_start`): anyone (the guest
// too) moves a trail's start or puts it back (null); one row a slug, the latest to arrive; a bad shape refused.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-22T03:00:00.000Z');
const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;

let store: StoreCore;
beforeEach(() => {
  let now = T0;
  const db = memSql();
  store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => (now += 5), notify: () => {} });
});
let seq = 0;
const send = (who: 'A' | 'B' | 'G', data: object) => store.handle({ key: keyOf[who], action: 'event', id: `hs${++seq}`, type: 'hike_start', data }, 100) as Record<string, unknown>;
const rows = (who: 'A' | 'B' | 'G' = 'A') => ((store.handle({ key: keyOf[who], action: 'snapshot' }, 100) as unknown as { rows: { events: unknown[][] } }).rows.events)
  .filter((r) => r[3] === 'hike_start').map((r) => [r[1], JSON.parse(r[4] as string)]);
const refused = { ok: false, error: 'bad_request' };

describe('hike_start', () => {
  it('anyone moves a trail’s start; one row a slug, the latest to arrive; null puts it back; seen by all three', () => {
    expect(send('A', { slug: 'ono-yama', hm: '11:00' })).toEqual({ ok: true });
    expect(send('G', { slug: 'kinpu-odarumi', hm: '8:30' })).toEqual({ ok: true });
    expect(send('B', { slug: 'ono-yama', hm: '9:30' })).toEqual({ ok: true });
    expect(rows()).toEqual([['G', { slug: 'kinpu-odarumi', hm: '8:30' }], ['B', { slug: 'ono-yama', hm: '9:30' }]]);
    expect(send('G', { slug: 'ono-yama', hm: null })).toEqual({ ok: true });
    expect(rows('G')).toEqual([['G', { slug: 'kinpu-odarumi', hm: '8:30' }], ['G', { slug: 'ono-yama', hm: null }]]);
    expect(rows('B')).toEqual(rows('A'));
    // a registered hike's slug too
    expect(send('A', { slug: 'u-hmhz3k2a1b2c', hm: '6:15' })).toEqual({ ok: true });
  });

  it('refuses a bad slug or start, a missing one, or another key', () => {
    for (const d of [{ slug: 'ono-yama' }, { slug: 'ono-yama', hm: '24:00' }, { slug: 'ono-yama', hm: '7:7' }, { slug: 'ono-yama', hm: 420 }, { slug: 'Ono Yama', hm: '7:00' },
      { slug: '', hm: '7:00' }, { hm: '7:00' }, { slug: 'ono-yama', hm: '7:00', at: T0 }])
      expect(send('A', d), JSON.stringify(d)).toEqual(refused);
    expect(rows()).toEqual([]);
  });
});
