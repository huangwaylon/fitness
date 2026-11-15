// The profile prefs (docs/backend.md "Events" `pref`, contract/profile.ts): locked since 2026-11-15, so the record
// refuses every `sex` and `birth` from anyone (`forbidden`, `profile locked`); the rows it already keeps
// stay, a member's seen by the two members alone and the guest's by the guest alone (contract/guest.ts rowsFor), in
// every snapshot and delta. Made-up values only.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { apiWithMeta } from '../src/reqMeta.ts';
import { keyOwner } from '../src/auth.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-02T03:00:00.000Z'); // 12:00 Tokyo

describe('the profile prefs', () => {
  let now: number;
  let store: StoreCore;
  let db: ReturnType<typeof memSql>;
  beforeEach(() => {
    now = T0;
    db = memSql();
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
  /** A row the record kept before the lock, as a restore keeps it (its slot as it was). */
  const kept = (who: string, data: Record<string, unknown>) => {
    now += 1000;
    const subject = data.person ?? who;
    db.sql.exec('INSERT INTO events (id, at, person, type, data, slot) VALUES (?, ?, ?, ?, ?, ?)', `old${++n}`, new Date(now).toISOString(), who, 'pref',
      JSON.stringify(data), `pref|${subject}|${data.key}`);
  };

  it('refuses every profile pref from anyone, a value or null, its own or a member’s; the other prefs still go', () => {
    const got: string[] = [];
    for (const key of [KEY_A, KEY_B, KEY_C])
      for (const data of [{ key: 'sex', value: 'm' }, { key: 'sex', value: null }, { key: 'birth', value: '1985-07-15' }, { key: 'birth', value: null },
        { key: 'sex', value: 'f', person: 'B' }, { key: 'birth', value: '1988-03-09', person: 'A' }]) {
        const r = send(key, data);
        if (r.ok !== false || r.error !== 'forbidden' || r.detail !== 'profile locked') got.push(JSON.stringify([key[0], data, r]));
      }
    expect(got).toEqual([]);
    expect(send(KEY_A, { key: 'villagerName', value: 'テスト' })).toMatchObject({ ok: true });
    expect(prefs(KEY_A)).toEqual([['A', { key: 'villagerName', value: 'テスト' }]]);
    // logged as its rule
    const r = apiWithMeta(store, JSON.stringify({ key: KEY_B, action: 'event', id: 'elock', type: 'pref', data: { key: 'sex', value: 'f' } }), (k) => keyOwner(String(k), { KEY_A, KEY_B, KEY_C }));
    expect(r.meta).toMatchObject({ st: 'forbidden', why: 'pref.profile_locked' });
  });

  it('keeps the rows from before: a member’s to the members alone, the guest’s to the guest alone', () => {
    call(KEY_A, 'health');
    kept('A', { key: 'sex', value: 'm' });
    kept('A', { key: 'birth', value: '1990-05-12' });
    kept('B', { key: 'birth', value: '1994-08-20' });
    send(KEY_A, { key: 'villagerName', value: 'テスト' });
    const since = new Date(now).toISOString();
    kept('G', { key: 'sex', value: 'f' });
    kept('B', { key: 'sex', value: 'f' });

    // the guest: its own profile and the cosmetic pref, no member's (the full snapshot and the delta)
    expect(prefs(KEY_C)).toEqual([['A', { key: 'villagerName', value: 'テスト' }], ['G', { key: 'sex', value: 'f' }]]);
    expect(prefs(KEY_C, since)).toEqual([['G', { key: 'sex', value: 'f' }]]);
    // the members: every member's profile, never the guest's
    for (const key of [KEY_A, KEY_B]) {
      const got = prefs(key);
      expect(got.filter(([who]) => who === 'G')).toEqual([]);
      expect(got.map(([, d]) => d.key)).toEqual(['sex', 'birth', 'birth', 'villagerName', 'sex']);
      expect(prefs(key, since)).toEqual([['B', { key: 'sex', value: 'f' }]]);
    }
  });

  it('a load takes no pref of a key gone (bmiStd) and changes no kept profile; a fresh slot it restores', () => {
    const at = (s: number) => new Date(T0 - s * 1000).toISOString();
    expect(store.load({ rows: { events: [[at(9), 'A', 'old1', 'pref', '{"key":"bmiStd","value":"asia"}']] } })).toMatchObject({ ok: true, events: 0, skipped: 1, refused: { prefKey: 1, profileLocked: 0 } });
    for (const key of [KEY_A, KEY_B, KEY_C]) expect(prefs(key)).toEqual([]);
    kept('A', { key: 'sex', value: 'm' });
    // a later row for a kept slot (A's sex) is refused, older or newer; one for an empty slot (B's birth) restores
    const r = store.load({ rows: { events: [
      [at(-60), 'A', 'old2', 'pref', '{"key":"sex","value":"f"}'],
      [at(-61), 'B', 'old3', 'pref', '{"key":"sex","value":"m","person":"A"}'],
      [at(8), 'B', 'old4', 'pref', '{"key":"birth","value":"1994-08-20"}']
    ] } });
    expect(r).toMatchObject({ ok: true, events: 1, skipped: 2, refused: { prefKey: 0, profileLocked: 2 } });
    expect(prefs(KEY_A)).toEqual([['B', { key: 'birth', value: '1994-08-20' }], ['A', { key: 'sex', value: 'm' }]]);
    expect(prefs(KEY_C)).toEqual([]);
    // idempotent: the restored row is had, the refused ones refused again
    expect(store.load({ rows: { events: [[at(8), 'B', 'old4', 'pref', '{"key":"birth","value":"1994-08-20"}']] } })).toMatchObject({ events: 0, skipped: 0 });
  });
});
