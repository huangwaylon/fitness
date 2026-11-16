// English Study on the record (docs/english.md "Progress", "Flags"): a clip's `listen` row (gm 'tv': finished with `f`,
// or the minutes of a clip left part-way) reaches everyone else as its summary with `gm` and `f`, never the clip or
// the answers; `eflag` from anyone (the guest too), `eflag_done` from a member only, both seen by everyone. Made-up
// content only.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-05T03:00:00.000Z'); // 12:00 Tokyo, 2026-11-05

const clip = (g: string, extra: object = {}) => ({ d: '2026-11-05', g, gm: 'tv', u: 'waitress', lv: 7, n: 1, ms: 420_000, f: 1, r: [['waitress-q1', 1, 1, 0]], ...extra });
const flag = { item: 'waitress', q: 1, kind: 'answer', note: '100ドル？', t: 4.2, v: 'k3f9', seen: { stem: 'How much?', answer: '$100', line: 'a *hundred dollar* advance' } };

describe('English Study on the record', () => {
  let now: number;
  let store: StoreCore;
  beforeEach(() => {
    now = T0;
    const db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: () => {} });
  });
  const call = (key: string, action: string, extra: object = {}) => store.handle({ key, action, ...extra }, 100) as Record<string, any>;
  let n = 0;
  const send = (key: string, type: string, data: object, id = `e${++n}`) => {
    now += 1000;
    return call(key, 'event', { id, type, data });
  };
  const rows = (key: string, type: string) => (call(key, 'snapshot').rows.events as string[][]).filter((r) => r[3] === type).map((r) => [r[1], JSON.parse(r[4])]);

  it('takes a finished clip and a part-way one; the others get `gm` and `f` only', () => {
    expect(send(KEY_A, 'listen', clip('tv01')).ok).toBe(true);
    const { f: _f, ...part } = clip('tv02', { r: [], ms: 90_000 });
    expect(send(KEY_A, 'listen', part).ok).toBe(true);
    expect(send(KEY_C, 'listen', clip('tv03')).ok).toBe(true);
    expect(send(KEY_A, 'listen', clip('tv04', { r: [], d: '2026-11-07' })).ok).toBe(false); // (a day after tomorrow)
    expect(send(KEY_A, 'listen', clip('tv05', { gm: 'tile' })).ok).toBe(false); // `f` is English Study's only
    const base = { d: '2026-11-05', n: 1, gm: 'tv' };
    expect(rows(KEY_B, 'listen')).toEqual([['A', { ...base, g: 'tv01', ms: 420_000, f: 1 }], ['A', { ...base, g: 'tv02', ms: 90_000 }], ['G', { ...base, g: 'tv03', ms: 420_000, f: 1 }]]);
    expect(rows(KEY_C, 'listen').map(([w, d]) => [w, d.u ?? null])).toEqual([['A', null], ['A', null], ['G', 'waitress']]);
    expect(rows(KEY_A, 'listen')[0]).toEqual(['A', clip('tv01')]);
  });

  it('takes a flag from anyone and a review from a member; everyone sees both', () => {
    expect(send(KEY_C, 'eflag', flag, 'f1').ok).toBe(true);
    expect(send(KEY_B, 'eflag', { item: 'waitress', q: null, kind: 'other', v: 'z1', seen: null }, 'f2').ok).toBe(true);
    expect(send(KEY_A, 'eflag', { ...flag, kind: 'nope' }).ok).toBe(false);
    expect(send(KEY_A, 'eflag', { ...flag, q: 'g1' }, 'f3').ok).toBe(true); // (by the question's id)
    expect(send(KEY_A, 'eflag', { ...flag, q: 'G 1' }).ok).toBe(false);
    expect(send(KEY_C, 'eflag_done', { flag: 'f1', outcome: 'fixed' }).error).toBe('forbidden');
    expect(send(KEY_A, 'eflag_done', { flag: 'f1', outcome: 'kept', note: 'このままです' }, 'd1').ok).toBe(true);
    expect(send(KEY_A, 'eflag_done', { flag: 'f1', outcome: 'maybe' }).ok).toBe(false);
    for (const key of [KEY_A, KEY_B, KEY_C]) {
      expect(rows(key, 'eflag').map(([w, d]) => [w, d.kind])).toEqual([['G', 'answer'], ['B', 'other'], ['A', 'answer']]);
      expect(rows(key, 'eflag_done')).toEqual([['A', { flag: 'f1', outcome: 'kept', note: 'このままです' }]]);
    }
  });
});
