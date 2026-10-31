import { beforeEach, describe, expect, it } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { PEOPLE } from '#lib/config/rules.ts';
import { HATS, birthdaysOn, blowOut, candlesOut, firstConfetti, isBirthday } from './birthday.ts';
import { BIRTHDAYS } from '#lib/villagers/birthdays.ts';
import { ROSTER_IDS } from '#lib/villagers/roster.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';

function memKV(): KV {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}
beforeEach(() => configureStorage({ local: memKV() }));

describe('our birthdays (config)', () => {
  it('ウェイ on Oct 6, うめ on Mar 4 (Tokyo dates, any year)', () => {
    expect(PEOPLE.A.birthday).toBe('10-06');
    expect(PEOPLE.B.birthday).toBe('03-04');
    expect(birthdaysOn('2026-10-06')).toEqual(['A']);
    expect(birthdaysOn('2027-03-04')).toEqual(['B']);
    expect(birthdaysOn('2027-10-06')).toEqual(['A']);
    // the edges
    for (const d of ['2026-10-05', '2026-10-07', '2027-03-03', '2027-03-05', '2026-11-01']) expect(birthdaysOn(d)).toEqual([]);
  });
  it('null turns a person’s birthday off; both on one day is both', () => {
    expect(birthdaysOn('2026-10-06', { A: { birthday: null }, B: { birthday: null } })).toEqual([]);
    expect(birthdaysOn('2026-10-06', { A: { birthday: '10-06' }, B: { birthday: '10-06' } })).toEqual(['A', 'B']);
  });
  it('Feb 29 is kept on Feb 28 in other years', () => {
    expect(isBirthday('02-29', '2028-02-29')).toBe(true);
    expect(isBirthday('02-29', '2028-02-28')).toBe(false);
    expect(isBirthday('02-29', '2027-02-28')).toBe(true);
    expect(isBirthday('02-29', '2100-02-28')).toBe(true); // not a leap year
    expect(isBirthday(null, '2027-02-28')).toBe(false);
  });
  it('the confetti once a day on this phone; the candles stay out for the day', () => {
    expect(firstConfetti('2026-10-06')).toBe(true);
    expect(firstConfetti('2026-10-06')).toBe(false);
    expect(firstConfetti('2027-10-06')).toBe(true); // a new birthday
    expect(candlesOut('2027-10-06')).toBe(false);
    blowOut('2027-10-06');
    expect(candlesOut('2027-10-06')).toBe(true);
    expect(firstConfetti('2027-10-06')).toBe(false); // still had its confetti
    expect(candlesOut('2028-10-06')).toBe(false);
  });
  it('NH’s birthday hats (pink for mine, blue for the partner’s) and the lines in both languages', () => {
    expect(HATS).toEqual({ mine: 'deco/birthday-hat-pink', partner: 'deco/birthday-hat-blue' });
    expect((ja as Record<string, string>)['host.birthday'].replace('{name}', 'うめ')).toBe('うめさん、おたんじょうび おめでとう！');
    for (const cat of [ja, en] as Record<string, string>[]) expect(cat['host.birthday']).toContain('{name}'), expect(cat['chat.birthday']).toBeTruthy();
  });
});

describe('NH villagers’ birthdays (villagers/birthdays.ts)', () => {
  it('every villager and special character in the roster has one, a real MM-DD', () => {
    for (const id of ROSTER_IDS) expect(BIRTHDAYS[id], id).toMatch(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
    expect(Object.keys(BIRTHDAYS).length).toBe(ROSTER_IDS.length);
  });
  it('Nookipedia’s dates (a few known ones)', () => {
    expect([BIRTHDAYS.raymond, BIRTHDAYS.goldie, BIRTHDAYS.isabelle, BIRTHDAYS['tom-nook'], BIRTHDAYS['kk-slider']]).toEqual(['10-01', '12-27', '12-20', '05-30', '08-23']);
  });
});
