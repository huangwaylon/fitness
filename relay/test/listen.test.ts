// ききみみ クイズ's progress rows (docs/kikimimi.md "Progress & feedback", docs/backend.md "Events" `listen`,
// contract/listen.ts): one row per person per game; the record checks the shape, keeps every row (no slot), sends a
// row whole to its owner only, the other member its summary, and nothing between the guest and the members (in every
// snapshot and delta). Made-up answers only.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-05T03:00:00.000Z'); // 12:00 Tokyo, 2026-11-05

const game = (g: string, extra: object = {}) => ({
  d: '2026-11-05', g, lv: 3, n: 1, ms: 240_000,
  r: [['w3-gotta', 1, 0, 0], ['n3-meet-1', 0, 2, 1], ['r3-coffee', 1, 0, 2], ['p3-boot', 0, -1, 0]],
  ...extra
});

describe('ききみみ progress rows', () => {
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

  it('takes a game’s row; refuses a bad shape, an unknown key or a day after tomorrow', () => {
    const bad: unknown[] = [];
    const ok = (data: object, want: boolean) => {
      const r = send(KEY_A, data);
      if (r.ok !== want) bad.push([data, r]);
    };
    ok(game('ab12'), true);
    ok(game('ab13', { p: 1, n: 1, lv: 1 }), true);
    ok(game('ab14', { d: '2026-11-06' }), true); // tomorrow (a clock a little ahead)
    ok(game('ab15', { d: '2026-11-07' }), false);
    ok(game('ab16', { d: '2026-02-30' }), false);
    ok(game('AB17'), false);
    ok(game('ab18', { lv: 9 }), false);
    ok(game('ab18b', { lv: 7 }), true); // ほし (levels 6-7 since 2026-11-06)
    ok(game('ab19', { n: 4 }), false);
    ok(game('ab20', { ms: 3_600_001 }), false);
    ok(game('ab21', { p: 2 }), false);
    ok(game('ab22', { r: [] }), false);
    ok(game('ab23', { r: Array.from({ length: 13 }, () => ['w3-gotta', 1, 0, 0]) }), false);
    ok(game('ab24', { r: [['w3-gotta', 2, 0, 0]] }), false);
    ok(game('ab25', { r: [['w3-gotta', 1, 4096, 0]] }), false);
    ok(game('ab26', { r: [['W3 gotta', 1, 0, 0]] }), false);
    ok(game('ab27', { r: [['w3-gotta', 1, 0, 100]] }), false);
    ok(game('ab28', { score: 1040 }), false);
    // a later game's row (docs/kikimimi-framework.md §4.4): `gm`, `u`, a pick up to 4095 (a tile round's bitmask)
    ok(game('ab29', { gm: 'tile', u: 'u03-kawa', r: [['w3-gotta', 0, 4095, 0]] }), true);
    ok(game('ab30', { r: [['w3-gotta', 1, 4, 0]] }), true);
    ok(game('ab31', { gm: 'T' }), false);
    ok(game('ab32', { u: 'a'.repeat(13) }), false);
    // a unit's lesson (docs/curriculum-units.md §10): `l` 1-5 with `u`, `tm` 0-6 with `l`
    ok(game('ab33', { gm: 'unit', u: 'tr-hotel', l: 3, tm: 6 }), true);
    ok(game('ab34', { u: 'tr-hotel', l: 1 }), true);
    ok(game('ab35', { l: 1 }), false);
    ok(game('ab36', { u: 'tr-hotel', l: 6 }), false);
    ok(game('ab37', { u: 'tr-hotel', l: 3, tm: 7 }), false);
    ok(game('ab38', { u: 'tr-hotel', tm: 5 }), false);
    // a bedtime story (おやすみ ものがたり): no answers, only its minutes; any other game needs one
    ok(game('ab39', { gm: 'story', u: 'st-johnny', lv: 4, r: [] }), true);
    ok(game('ab40', { gm: 'tile', r: [] }), false);
    expect(bad).toEqual([]);
  });

  it('keeps every game (no slot) and a retry once', () => {
    send(KEY_A, game('ab12'), 'x1');
    send(KEY_A, game('ab12'), 'x1');
    send(KEY_A, game('cd34'));
    expect(listens(KEY_A).map(([, d]) => d.g)).toEqual(['ab12', 'cd34']);
  });

  it('sends a row whole to its owner and its summary only to everyone else, the guest and the members alike', () => {
    send(KEY_A, game('ab12', { n: 2 }));
    send(KEY_B, game('ab12', { n: 2, lv: 3 }));
    expect(send(KEY_C, game('zz99', { n: 1 })).ok).toBe(true); // the guest writes its own
    const summary = { d: '2026-11-05', g: 'ab12', n: 2, ms: 240_000 };
    const gSummary = { d: '2026-11-05', g: 'zz99', n: 1, ms: 240_000 };
    expect(listens(KEY_A)).toEqual([['A', game('ab12', { n: 2 })], ['B', summary], ['G', gSummary]]);
    expect(listens(KEY_B)).toEqual([['A', summary], ['B', game('ab12', { n: 2, lv: 3 })], ['G', gSummary]]);
    expect(listens(KEY_C)).toEqual([['A', summary], ['B', summary], ['G', game('zz99', { n: 1 })]]);
    // a delta likewise
    const since = new Date(now).toISOString();
    send(KEY_B, game('ef56'));
    send(KEY_C, game('gh78'));
    expect(listens(KEY_A, since)).toEqual([['B', { d: '2026-11-05', g: 'ef56', n: 1, ms: 240_000 }], ['G', { d: '2026-11-05', g: 'gh78', n: 1, ms: 240_000 }]]);
    expect(listens(KEY_C, since)).toEqual([['B', { d: '2026-11-05', g: 'ef56', n: 1, ms: 240_000 }], ['G', game('gh78')]]);
  });

  it('a passed unit チェック reaches the other member as its unit and `stamped` (never the answers or the team’s count), the guest’s and to the guest too', () => {
    const six = (rights: number) => Array.from({ length: 6 }, (_, i) => [`w3-gotta`, i < rights ? 1 : 0, 0, 0]);
    send(KEY_A, game('ab12', { n: 2, gm: 'unit', u: 'tr-hotel', l: 3, tm: 5, r: six(3) })); // carried by the team
    send(KEY_A, game('ab13', { gm: 'unit', u: 'tr-hotel', l: 3, r: six(4) })); // not passed
    send(KEY_A, game('ab14', { gm: 'unit', u: 'ev-bday', l: 2, r: six(6) })); // not a チェック
    send(KEY_C, game('zz99', { gm: 'unit', u: 'tr-hotel', l: 3, r: six(6) }));
    const base = { d: '2026-11-05', ms: 240_000 };
    const theirs = [['A', { ...base, g: 'ab12', n: 2, u: 'tr-hotel', stamped: 1 }], ['A', { ...base, g: 'ab13', n: 1 }], ['A', { ...base, g: 'ab14', n: 1 }]];
    const guests = ['G', { ...base, g: 'zz99', n: 1, u: 'tr-hotel', stamped: 1 }];
    expect(listens(KEY_B)).toEqual([...theirs, guests]);
    expect(listens(KEY_A).map(([w, d]) => [w, d.g, d.stamped])).toEqual([['A', 'ab12', undefined], ['A', 'ab13', undefined], ['A', 'ab14', undefined], ['G', 'zz99', 1]]);
    expect(listens(KEY_C)).toEqual([...theirs, ['G', game('zz99', { gm: 'unit', u: 'tr-hotel', l: 3, r: six(6) })]]);
  });
});
