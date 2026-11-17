// フレーズの復習's schedule (phrase-review.ts): the questions of finished plays, 1-3-7-14-30 days on, 3 a day.
import { describe, expect, it } from 'vitest';
import { addDays } from '#lib/time/dates.ts';
import { dueOf, leftToday, metOf, PER_DAY, rated, skipped, splitUse, STEPS, type Key, type Mine } from './phrase-review.ts';
import type { EventRow } from '#lib/contract/api.ts';
import type { LocalDate } from '#lib/types.ts';

const d0 = '2026-11-10' as LocalDate;
let n = 0;
const row = (who: 'A' | 'B', d: string, u: string, ids: string[], extra: object = {}): EventRow =>
  [`${d}T03:00:00.000Z`, who, `e${++n}`, 'listen', JSON.stringify({ d, g: `tv${n}aa`, gm: 'tv', u, lv: 7, n: 1, ms: 1, f: 1, r: ids.map((id) => [id, 1, 0, 0]), ...extra })];
const none: Mine = { s: {} };

describe('metOf', () => {
  it('my finished plays’ questions, each the last day met; not a play left part-way, nor anyone else’s', () => {
    const rows = [row('A', d0, 'w', ['g1', 'd2']), row('A', addDays(d0, 2), 'w', ['d2']), row('A', d0, 'w', ['x9'], { f: undefined }), row('B', d0, 'w', ['b1'])];
    expect(Object.fromEntries(metOf(rows, 'A'))).toEqual({ 'w/g1': d0, 'w/d2': addDays(d0, 2) });
  });
});

describe('dueOf', () => {
  const met = new Map<Key, LocalDate>([['w/a', d0]]);
  it('due a day after the play, then 3, 7, 14 and every 30 days after each 覚えた', () => {
    expect(dueOf(met, none, d0)).toEqual([]);
    let mine = none, day = addDays(d0, 1);
    expect(dueOf(met, mine, day)).toEqual(['w/a']);
    for (const gap of [...STEPS.slice(1), 30, 30]) {
      mine = rated(mine, 'w/a', day, true);
      expect(dueOf(met, mine, addDays(day, gap - 1))).toEqual([]);
      day = addDays(day, gap);
      expect(dueOf(met, mine, day)).toEqual(['w/a']);
    }
  });
  it('もう一回: back to tomorrow', () => {
    const mine = rated(rated(none, 'w/a', addDays(d0, 1), true), 'w/a', addDays(d0, 4), false);
    expect(mine.s['w/a']).toEqual([addDays(d0, 4), 0]);
    expect(dueOf(met, mine, addDays(d0, 5))).toEqual(['w/a']);
  });
  it('met again in a later play: counted from then', () => {
    const mine = rated(none, 'w/a', addDays(d0, 1), true);
    expect(dueOf(new Map([['w/a', addDays(d0, 3)]]), mine, addDays(d0, 4))).toEqual([]);
  });
  it('the shown before first, the longest overdue first; then the never shown, the latest met first', () => {
    const m = new Map<Key, LocalDate>([['o/old', d0], ['n/new', addDays(d0, 5)], ['s/one', d0], ['s/two', d0]]);
    let mine = rated(none, 's/one', addDays(d0, 1), true); // due d0+4
    mine = rated(mine, 's/two', addDays(d0, 2), true); // due d0+5
    expect(dueOf(m, mine, addDays(d0, 8))).toEqual(['s/one', 's/two', 'n/new', 'o/old']);
  });
});

describe('a day', () => {
  it('PER_DAY at most; 今日はスキップ ends it, the steps as they were; tomorrow again', () => {
    let mine = none;
    expect(leftToday(mine, d0)).toBe(PER_DAY);
    mine = rated(mine, 'w/a', d0, true);
    expect(leftToday(mine, d0)).toBe(PER_DAY - 1);
    mine = skipped(mine, d0);
    expect(leftToday(mine, d0)).toBe(0);
    expect(mine.s['w/a']).toEqual([d0, 1]);
    expect(leftToday(mine, addDays(d0, 1))).toBe(PER_DAY);
  });
});

describe('splitUse', () => {
  it('the English and its Japanese in （…）', () => {
    expect(splitUse('Do you want me to come with you?（一緒に行こうか？）')).toEqual({ en: 'Do you want me to come with you?', ja: '一緒に行こうか？' });
    expect(splitUse('Just English.')).toEqual({ en: 'Just English.', ja: '' });
  });
});
