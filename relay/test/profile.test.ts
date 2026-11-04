// The profile prefs (docs/backend.md "Events" `pref`, contract/profile.ts): `sex`, `birth`, `bmiStd`, checked by the
// record when set; a member's either member's to set and seen by the two members alone, the guest's its own and seen
// by the guest alone (contract/guest.ts rowsFor), in every snapshot and delta. Made-up values only.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-02T03:00:00.000Z'); // 12:00 Tokyo

describe('the profile prefs', () => {
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

  it('takes a sex, a birth date from 1900 to 10 years ago and a BMI standard, or null; refuses anything else', () => {
    const bad: unknown[] = [];
    const ok = (data: object, want: boolean) => {
      const r = send(KEY_A, data);
      if (r.ok !== want) bad.push([data, r]);
    };
    for (const value of ['m', 'f', null]) ok({ key: 'sex', value }, true);
    for (const value of ['x', 'M', 'male', 1, '']) ok({ key: 'sex', value }, false);
    // the record's day is 2026-11-02: 10 years before is the latest
    for (const value of ['1900-01-01', '1985-07-15', '2016-11-02', '2000-02-29', null]) ok({ key: 'birth', value }, true);
    for (const value of ['1899-12-31', '2016-11-03', '2026-11-02', '2001-02-29', '1990-13-01', '1990-1-1', 19900101, '']) ok({ key: 'birth', value }, false);
    for (const value of ['asia', 'who', null]) ok({ key: 'bmiStd', value }, true);
    for (const value of ['jp', 'WHO', 23]) ok({ key: 'bmiStd', value }, false);
    // a member sets either member's
    ok({ key: 'birth', value: '1988-03-09', person: 'B' }, true);
    expect(bad).toEqual([]);
  });

  it('keeps the latest per person and key (a slot), the person whose it is the subject', () => {
    send(KEY_A, { key: 'sex', value: 'm' });
    send(KEY_A, { key: 'sex', value: 'f' });
    send(KEY_B, { key: 'sex', value: 'm', person: 'A' });
    send(KEY_A, { key: 'birth', value: '1988-03-09', person: 'B' });
    expect(prefs(KEY_A)).toEqual([['B', { key: 'sex', value: 'm', person: 'A' }], ['A', { key: 'birth', value: '1988-03-09', person: 'B' }]]);
  });

  it('never sends the guest a member’s profile, nor a member the guest’s; the guest may set only its own', () => {
    send(KEY_A, { key: 'sex', value: 'm' });
    send(KEY_A, { key: 'birth', value: '1990-05-12' });
    send(KEY_B, { key: 'bmiStd', value: 'who', person: 'A' });
    send(KEY_B, { key: 'birth', value: '1994-08-20' });
    send(KEY_A, { key: 'villagerName', value: 'テスト' });
    const since = new Date(now).toISOString();
    expect(send(KEY_C, { key: 'birth', value: '2001-01-01', person: 'A' })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(send(KEY_C, { key: 'sex', value: 'f' })).toMatchObject({ ok: true });
    expect(send(KEY_C, { key: 'birth', value: '2001-01-01' })).toMatchObject({ ok: true });
    send(KEY_B, { key: 'sex', value: 'f' }); // after the guest's: in the delta

    // the guest: its own profile and the cosmetic pref, no member's (the full snapshot and the delta)
    const guestRow = (k: string, v: string) => ['G', { key: k, value: v }];
    expect(prefs(KEY_C)).toEqual([['A', { key: 'villagerName', value: 'テスト' }], guestRow('sex', 'f'), guestRow('birth', '2001-01-01')]);
    expect(prefs(KEY_C, since)).toEqual([guestRow('sex', 'f'), guestRow('birth', '2001-01-01')]);
    // the members: every member's profile, never the guest's
    for (const key of [KEY_A, KEY_B]) {
      const got = prefs(key);
      expect(got.filter(([who]) => who === 'G')).toEqual([]);
      expect(got.map(([, d]) => d.key)).toEqual(['sex', 'birth', 'bmiStd', 'birth', 'villagerName', 'sex']);
      expect(prefs(key, since)).toEqual([['B', { key: 'sex', value: 'f' }]]);
    }
  });
});
