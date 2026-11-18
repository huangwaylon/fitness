// English Study's progress rows on the record (docs/backend.md "Events" `listen`, contract/listen.ts): the record checks
// the shape (English Study's only: the retired ききみみ's rows are refused), keeps every row (no slot), sends a row
// whole to its owner only and everyone else its summary, the guest and the members alike (in every snapshot and
// delta). Made-up answers only.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-05T03:00:00.000Z'); // 12:00 Tokyo, 2026-11-05

const clip = (g: string, extra: object = {}) => ({
  d: '2026-11-05', g, gm: 'tv', u: 'waitress', ms: 240_000,
  r: [['g1', 1, 0, 0], ['s3', 0, 2, 1], ['d1', 1, 5, 2], ['p2', 0, -1, 0]],
  ...extra
});

describe('English Study progress rows', () => {
  let now: number;
  let store: StoreCore;
  beforeEach(() => {
    now = T0;
    const db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: () => {} });
  });
  const call = (key: string, action: string, extra: object = {}) => store.handle({ key, action, ...extra }, 100) as Record<string, any>;
  let n = 0;
  const send = (key: string, data: object, id = `e${++n}`) => {
    now += 1000;
    return call(key, 'event', { id, type: 'listen', data });
  };
  const listens = (key: string, since?: string) =>
    (call(key, 'snapshot', since ? { since } : {}).rows.events as string[][]).filter((r) => r[3] === 'listen').map((r) => [r[1], JSON.parse(r[4])]);

  it('takes a clip’s row; refuses a bad shape, an unknown key, another game’s or a day after tomorrow', () => {
    const bad: unknown[] = [];
    const ok = (data: object, want: boolean) => {
      const r = send(KEY_A, data);
      if (r.ok !== want) bad.push([data, r]);
    };
    ok(clip('ab12'), true);
    ok(clip('ab13', { f: 1, r: [] }), true); // (まとめ reached with nothing answered)
    ok(clip('ab14', { d: '2026-11-06' }), true); // tomorrow (a clock a little ahead)
    ok(clip('ab15', { d: '2026-11-07' }), false);
    ok(clip('ab16', { d: '2026-02-30' }), false);
    ok(clip('AB17'), false);
    ok(clip('ab17b', { lv: 7, n: 1 }), true); // (a row written before 2026-11-18: ききみみ's level and players)
    ok(clip('ab18', { lv: 9 }), false);
    ok(clip('ab19', { n: 4 }), false);
    ok(clip('ab20', { ms: 3_600_001 }), false);
    ok(clip('ab21', { f: 2 }), false);
    ok(clip('ab22', { r: Array.from({ length: 13 }, () => ['g1', 1, 0, 0]) }), false);
    ok(clip('ab23', { r: [['g1', 2, 0, 0]] }), false);
    ok(clip('ab24', { r: [['g1', 1, 4096, 0]] }), false);
    ok(clip('ab25', { r: [['G 1', 1, 0, 0]] }), false);
    ok(clip('ab26', { r: [['g1', 1, 0, 100]] }), false);
    ok(clip('ab27', { u: 'a'.repeat(13) }), false);
    ok(clip('ab28', { u: undefined }), false);
    ok(clip('ab29', { score: 1040 }), false);
    // the retired ききみみ's rows: a quiz's (no `gm`), a game's, a story's, a unit's lesson
    ok(clip('ab30', { gm: undefined }), false);
    ok(clip('ab31', { gm: 'tile' }), false);
    ok(clip('ab32', { gm: 'story', r: [] }), false);
    ok(clip('ab33', { l: 3, tm: 5 }), false);
    ok(clip('ab34', { p: 1 }), false);
    expect(bad).toEqual([]);
  });

  it('keeps every row (no slot) and a retry once', () => {
    send(KEY_A, clip('ab12'), 'x1');
    send(KEY_A, clip('ab12'), 'x1');
    send(KEY_A, clip('cd34'));
    expect(listens(KEY_A).map(([, d]) => d.g)).toEqual(['ab12', 'cd34']);
  });

  it('sends a row whole to its owner and its summary only to everyone else, the guest and the members alike', () => {
    send(KEY_A, clip('ab12', { f: 1 }));
    send(KEY_B, clip('ab12', { ms: 60_000 }));
    expect(send(KEY_C, clip('zz99')).ok).toBe(true); // the guest writes its own
    const sum = (g: string, extra: object = {}) => ({ d: '2026-11-05', g, ms: 240_000, gm: 'tv', ...extra });
    expect(listens(KEY_A)).toEqual([['A', clip('ab12', { f: 1 })], ['B', sum('ab12', { ms: 60_000 })], ['G', sum('zz99')]]);
    expect(listens(KEY_B)).toEqual([['A', sum('ab12', { f: 1 })], ['B', clip('ab12', { ms: 60_000 })], ['G', sum('zz99')]]);
    expect(listens(KEY_C)).toEqual([['A', sum('ab12', { f: 1 })], ['B', sum('ab12', { ms: 60_000 })], ['G', clip('zz99')]]);
    // a delta likewise
    const since = new Date(now).toISOString();
    send(KEY_B, clip('ef56'));
    send(KEY_C, clip('gh78'));
    expect(listens(KEY_A, since)).toEqual([['B', sum('ef56')], ['G', sum('gh78')]]);
    expect(listens(KEY_C, since)).toEqual([['B', sum('ef56')], ['G', clip('gh78')]]);
  });
});
