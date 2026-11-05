// The look prefs (docs/backend.md "Events" `pref`, app contract/look.ts): `look` (the look worn: a whole player, the
// villager, or null for いつもの) and `savedLooks` (the コーデ, at most 20), checked by the record when set; each person's
// own (a member's and the guest's alike: never another's), the latest one per person, and every phone gets them.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { memSql } from './sqlite.ts';
import { DEFAULT_LOOKS, usePartTable } from '../../app/src/lib/contract/look.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-05T03:00:00.000Z');
const { A, B } = DEFAULT_LOOKS;
const saved = (i: number, look = A) => ({ id: `abcd${String(i).padStart(4, '0')}`, name: `コーデ ${i}`, look });

describe('the look prefs', () => {
  let now: number;
  let store: StoreCore;
  beforeEach(() => {
    now = T0;
    const db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: () => {} });
  });
  const call = (key: string, action: string, extra: object = {}) => store.handle({ key, action, ...extra }, 100) as Record<string, any>;
  let n = 0;
  const send = (key: string, data: object) => {
    now += 1000;
    return call(key, 'event', { id: `e${++n}`, type: 'pref', data });
  };
  const prefs = (key: string, since?: string) =>
    (call(key, 'snapshot', since ? { since } : {}).rows.events as string[][]).filter((r) => r[3] === 'pref').map((r) => [r[1], JSON.parse(r[4])]);

  it('takes a whole look, the villager or null, and up to 20 whole コーデ; refuses anything else', () => {
    const bad: unknown[] = [];
    const ok = (key: string, data: object, want: boolean) => {
      const r = send(key, data);
      if (r.ok !== want) bad.push([data, r]);
    };
    for (const value of [{ kind: 'player', look: A }, { kind: 'player', look: { ...B, top: 'TopsTexOnepieceAlineHLinen0', bottom: null } }, { kind: 'villager' }, null]) {
      ok(KEY_A, { key: 'look', value }, true);
    }
    for (const value of [
      { kind: 'player', look: { ...A, hair: 'TopsTexTopOuterLAran3' } }, // a part of another slot
      { kind: 'player', look: { ...A, top: 'TopsTexOnepieceAlineHLinen0' } }, // a one-piece with bottoms
      { kind: 'player', look: { ...A, skin: 'pink' } },
      { kind: 'player', look: { ...A, script: '<x>' } },
      { kind: 'player', look: { hair: 'PlayerHair12' } },
      { kind: 'villager', villager: 'goldie' }, 'goldie', 1, []
    ]) ok(KEY_A, { key: 'look', value }, false);
    for (const value of [[], [saved(1)], Array.from({ length: 20 }, (_, i) => saved(i, B))]) ok(KEY_B, { key: 'savedLooks', value }, true);
    for (const value of [
      Array.from({ length: 21 }, (_, i) => saved(i)),
      [saved(1), saved(1)],
      [{ ...saved(1), name: '' }],
      [{ ...saved(1), name: 'あ'.repeat(13) }],
      [{ ...saved(1), id: 'x' }],
      [{ ...saved(1), look: { ...A, eye: 'PlayerEye' } }],
      null, {}
    ]) ok(KEY_B, { key: 'savedLooks', value }, false);
    expect(bad).toEqual([]);
  });

  it('each person’s own: a member’s for another is refused, the guest sets its own', () => {
    expect(send(KEY_A, { key: 'look', value: { kind: 'villager' }, person: 'B' })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send(KEY_A, { key: 'savedLooks', value: [], person: 'B' })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send(KEY_C, { key: 'look', value: { kind: 'villager' }, person: 'A' })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(send(KEY_C, { key: 'look', value: { kind: 'player', look: B } })).toMatchObject({ ok: true });
    expect(send(KEY_C, { key: 'savedLooks', value: [saved(3, B)] })).toMatchObject({ ok: true });
  });

  it('keeps the latest per person (a slot), and every phone gets everyone’s, in snapshots and deltas', () => {
    send(KEY_A, { key: 'look', value: { kind: 'player', look: B } });
    send(KEY_A, { key: 'look', value: null });
    send(KEY_B, { key: 'look', value: { kind: 'villager' } });
    send(KEY_A, { key: 'savedLooks', value: [saved(1)] });
    const since = call(KEY_A, 'snapshot').now as string;
    send(KEY_A, { key: 'savedLooks', value: [saved(2), saved(1)] });
    send(KEY_C, { key: 'look', value: { kind: 'player', look: A } });
    const want = [
      ['A', { key: 'look', value: null }],
      ['B', { key: 'look', value: { kind: 'villager' } }],
      ['A', { key: 'savedLooks', value: [saved(2), saved(1)] }],
      ['G', { key: 'look', value: { kind: 'player', look: A } }]
    ];
    for (const key of [KEY_A, KEY_B, KEY_C]) expect(prefs(key)).toEqual(want);
    expect(prefs(KEY_B, since)).toEqual(want.slice(2));
  });

  it('with a part table set, refuses a part it doesn’t hold', () => {
    usePartTable(new Set(Object.values(A).filter((x): x is string => typeof x === 'string')));
    try {
      expect(send(KEY_A, { key: 'look', value: { kind: 'player', look: A } })).toMatchObject({ ok: true });
      expect(send(KEY_A, { key: 'look', value: { kind: 'player', look: { ...A, hair: 'PlayerHair12' } } })).toMatchObject({ ok: false, error: 'bad_request' });
    } finally {
      usePartTable(null);
    }
  });
});
