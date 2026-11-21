// English Study's week maths (docs/english.md "Progress"): the days (a まとめ reached, re-watches too), the run of
// 3-day weeks with its rest week, the Monday boundary on Tokyo days, the minutes, the partner's line. Pinned dates:
// 2026-11-16 is a Monday.
import { describe, expect, it } from 'vitest';
import type { EventRow } from '#lib/contract/api.ts';
import { away, dailyOf, daysThisWeek, missesOf, playsOf, reviewOf, roundedMinutes, runOf, studyOf, totalsOf, weekView } from './progress.ts';

let n = 0;
const row = (who: 'A' | 'B' | 'G', d: string, extra: object = {}): EventRow =>
  [`${d}T03:00:00.000Z`, who, `e${++n}`, 'listen', JSON.stringify({ d, g: `tv${n}aa`, gm: 'tv', u: 'waitress', lv: 7, n: 1, ms: 600_000, f: 1, r: [], ...extra })];
const days = (...ds: string[]) => new Set(ds);
/** The days of a week from its Monday: `k` of them. */
const week = (monday: string, k: number) => Array.from({ length: k }, (_, i) => `${monday.slice(0, 8)}${String(+monday.slice(8) + i).padStart(2, '0')}`);

describe('studyOf', () => {
  it('counts a day per まとめ reached (a re-watch too), only English Study’s rows; a part-way row only adds minutes', () => {
    const rows = [row('A', '2026-11-16'), row('A', '2026-11-17', { u: 'other' }), row('A', '2026-11-17'), row('A', '2026-11-18', { f: undefined, ms: 120_000 }),
      ['2026-11-18T03:00:00.000Z', 'A', 'x', 'listen', JSON.stringify({ d: '2026-11-18', g: 'ab12', lv: 2, n: 1, ms: 9, r: [['w2-read', 1, 0, 0]] })] as EventRow,
      row('B', '2026-11-19')];
    const s = studyOf(rows, 'A', 'A');
    expect([...s.days]).toEqual(['2026-11-16', '2026-11-17']);
    expect([...s.clips].sort()).toEqual(['other', 'waitress']);
    expect(s.ms.get('2026-11-16')).toBe(3 * 600_000 + 120_000);
    expect(s.last).toBe('2026-11-18');
    // each clip's plays finished and the day last finished (the library's 2回)
    expect(Object.fromEntries(s.plays)).toEqual({ waitress: 2, other: 1 });
    expect(s.lastOn.get('waitress')).toBe('2026-11-17');
  });
  it('reads the partner’s summaries: days, never a clip', () => {
    const summary: EventRow = ['2026-11-16T03:00:00.000Z', 'B', 'e1', 'listen', JSON.stringify({ d: '2026-11-16', g: 'tv1aa', n: 1, ms: 5, gm: 'tv', f: 1 })];
    const s = studyOf([summary], 'B', 'A');
    expect([...s.days]).toEqual(['2026-11-16']);
    expect(s.clips.size).toBe(0);
  });
});

describe('the week', () => {
  it('starts on Monday (Tokyo days): Sunday is last week’s', () => {
    const d = days('2026-11-15', '2026-11-16', '2026-11-17');
    expect(daysThisWeek(d, '2026-11-15')).toBe(1);
    expect(daysThisWeek(d, '2026-11-16')).toBe(1);
    expect(daysThisWeek(d, '2026-11-22')).toBe(2);
    expect(daysThisWeek(d, '2026-11-23')).toBe(0);
  });
  it('a row stamped late on Sunday night UTC is its Tokyo day’s (the row’s `d`)', () => {
    // 2026-11-15T16:30Z is Monday 01:30 in Tokyo: the phone wrote d 2026-11-16
    const late: EventRow = ['2026-11-15T16:30:00.000Z', 'A', 'z', 'listen', JSON.stringify({ d: '2026-11-16', g: 'tvzzzz', gm: 'tv', u: 'w', lv: 7, n: 1, ms: 1, f: 1, r: [] })];
    expect(daysThisWeek(studyOf([late], 'A', 'A').days, '2026-11-16')).toBe(1);
  });
});

describe('runOf', () => {
  it('grows a week of 3+ days, holds through 1–2', () => {
    expect(runOf(days(...week('2026-11-02', 3), ...week('2026-11-09', 4)), '2026-11-16')).toEqual({ run: 2, ever: 2 });
    expect(runOf(days(...week('2026-11-02', 3), ...week('2026-11-09', 1)), '2026-11-16')).toEqual({ run: 1, ever: 1 });
    expect(runOf(days(...week('2026-10-26', 3), ...week('2026-11-02', 2), ...week('2026-11-09', 3)), '2026-11-16')).toEqual({ run: 2, ever: 2 });
  });
  it('forgives one empty week, ends with two in a row (silently: the lifetime count stays)', () => {
    expect(runOf(days(...week('2026-10-26', 3), ...week('2026-11-02', 3)), '2026-11-16')).toEqual({ run: 2, ever: 2 }); // 11-09 empty: a rest week
    expect(runOf(days(...week('2026-10-19', 3), ...week('2026-10-26', 3)), '2026-11-16')).toEqual({ run: 0, ever: 2 }); // 11-02, 11-09 empty
    // a new run starts with the next 3-day week
    expect(runOf(days(...week('2026-10-12', 3), ...week('2026-11-09', 3)), '2026-11-16')).toEqual({ run: 1, ever: 2 });
    // empty, then 1 day, then empty: never two empty in a row
    expect(runOf(days(...week('2026-10-19', 3), ...week('2026-11-02', 1)), '2026-11-16')).toEqual({ run: 1, ever: 1 });
  });
  it('this week counts once it has its 3 days, not before; a re-watch day counts like any', () => {
    expect(runOf(days(...week('2026-11-09', 3), '2026-11-16', '2026-11-17'), '2026-11-17')).toEqual({ run: 1, ever: 1 });
    expect(runOf(days(...week('2026-11-09', 3), '2026-11-16', '2026-11-17', '2026-11-18'), '2026-11-18')).toEqual({ run: 2, ever: 2 });
    expect(runOf(days(), '2026-11-16')).toEqual({ run: 0, ever: 0 });
  });
  it('judges the last week at the Monday rollover: on Sunday it’s still this week', () => {
    const d = days(...week('2026-11-02', 3), ...week('2026-11-09', 1));
    expect(runOf(d, '2026-11-15')).toEqual({ run: 1, ever: 1 });
    expect(runOf(d, '2026-11-16')).toEqual({ run: 1, ever: 1 });
    // two empty weeks after a run: still on through the second's Sunday, over from the Monday after
    const old = days(...week('2026-10-19', 3));
    expect(runOf(old, '2026-11-08')).toEqual({ run: 1, ever: 1 });
    expect(runOf(old, '2026-11-09')).toEqual({ run: 0, ever: 1 });
  });
});

describe('weekView', () => {
  it('this week, the run, the clips, the minutes; Monday fresh before any study', () => {
    const rows = [...week('2026-11-09', 3).map((d) => row('A', d)), row('A', '2026-11-16', { ms: 1_380_000 })];
    expect(weekView(rows, 'A', '2026-11-16', 'うめ')).toEqual({ days: 1, fresh: false, run: 1, ever: 1, clips: 1, minutes: 25, partner: { name: 'うめ', today: false, days: 0 }, both: false });
    expect(weekView(rows.slice(0, 3), 'A', '2026-11-16', 'うめ').fresh).toBe(true);
    expect(weekView(rows.slice(0, 3), 'A', '2026-11-17', 'うめ').fresh).toBe(false);
  });
  it('the partner: today done and their days; ふたりとも once both have 3; the guest has none', () => {
    const mine = week('2026-11-16', 3).map((d) => row('A', d));
    const theirs = week('2026-11-16', 3).map((d) => ['', 'B', `b${d}`, 'listen', JSON.stringify({ d, g: 'tvbbbb', n: 1, ms: 5, gm: 'tv', f: 1 })] as EventRow);
    const v = weekView([...mine, ...theirs], 'A', '2026-11-18', 'うめ');
    expect([v.partner, v.both]).toEqual([{ name: 'うめ', today: true, days: 3 }, true]);
    expect(weekView([...mine, ...theirs.slice(0, 2)], 'A', '2026-11-18', 'うめ').both).toBe(false);
    const g = weekView([...mine, ...theirs, row('G', '2026-11-16')], 'G', '2026-11-18', '');
    expect([g.partner, g.both, g.days]).toEqual([null, false, 1]);
  });
});

describe('the small numbers', () => {
  it('minutes to 5, 0 below 2.5', () => {
    expect([roundedMinutes(0), roundedMinutes(149_000), roundedMinutes(150_000), roundedMinutes(41 * 60_000)]).toEqual([0, 0, 5, 40]);
  });
  it('away: 7 days or more since the last study', () => {
    expect([away(null, '2026-11-16'), away('2026-11-10', '2026-11-16'), away('2026-11-09', '2026-11-16')]).toEqual([false, false, true]);
  });
});

describe('dailyOf: home’s main card', () => {
  const lib = [{ id: 'waitress' }, { id: 'other' }, { id: 'third' }];
  it('the first not finished nor skipped; once today’s is finished, the next in the plan, not it again', () => {
    expect(dailyOf(lib, studyOf([], 'A', 'A'), new Set())?.id).toBe('waitress');
    const today = studyOf([row('A', '2026-11-16')], 'A', 'A');
    expect(dailyOf(lib, today, new Set())?.id).toBe('other');
    expect(dailyOf(lib, today, new Set(['other']))?.id).toBe('third');
    // skipped all: the first not finished all the same
    expect(dailyOf(lib, today, new Set(['other', 'third']))?.id).toBe('other');
  });
  it('all finished: the one finished longest ago', () => {
    const all = studyOf([row('A', '2026-11-10', { u: 'other' }), row('A', '2026-11-12', { u: 'third' }), row('A', '2026-11-16')], 'A', 'A');
    expect(dailyOf(lib, all, new Set())?.id).toBe('other');
  });
});

describe('reviewOf: a finished clip again, new questions', () => {
  const lib = [{ id: 'waitress', items: 24 }, { id: 'other', items: 20 }, { id: 'third', items: 20 }];
  const none = new Set<string>();
  const answers = (k: number, p = 'a') => Array.from({ length: k }, (_, i) => [`${p}${i}`, 1, 0, 0]);
  // finished the week before 11-16's: waitress with 4 of its items met, other with 12 (and 6 more in a part-way row)
  const done = [row('A', '2026-11-06', { r: answers(4) }), row('A', '2026-11-08', { u: 'other', r: answers(12, 'o') })];
  const more = row('A', '2026-11-08', { u: 'other', f: undefined, r: answers(6, 'p') });
  it('waits for a study day this week, then offers the clip with the most items not met, never today’s', () => {
    expect(reviewOf(studyOf(done, 'A', 'A'), '2026-11-18', lib, none)).toBe(null);
    const st = studyOf([...done, more, row('A', '2026-11-16', { u: 'third' })], 'A', 'A');
    expect(st.seen.get('other')?.size).toBe(18);
    expect(reviewOf(st, '2026-11-18', lib, none)).toBe('waitress');
    expect(reviewOf(st, '2026-11-18', lib, new Set(['waitress']))).toBe('other');
  });
  it('as many new: the one finished longest ago; not within 7 days of its finish, nor 28 once played twice', () => {
    const even = [{ id: 'waitress', items: 4 }, { id: 'other', items: 12 }, { id: 'third', items: 20 }];
    const rows = [...done, row('A', '2026-11-16', { u: 'third' })];
    expect(reviewOf(studyOf(rows, 'A', 'A'), '2026-11-18', even, none)).toBe('waitress');
    const twice = [row('A', '2026-10-30'), ...rows];
    expect(reviewOf(studyOf(twice, 'A', 'A'), '2026-11-18', even, none)).toBe('other');
    expect(reviewOf(studyOf(twice, 'A', 'A'), '2026-11-18', even, new Set(['other']))).toBe(null);
  });
  it('once a week: none after a clip is finished again this week, again the next', () => {
    const rows = [...done, row('A', '2026-11-16', { u: 'third' }), row('A', '2026-11-17', { u: 'other' })];
    expect(studyOf(rows, 'A', 'A').again).toEqual(new Set(['2026-11-17']));
    expect(reviewOf(studyOf(rows, 'A', 'A'), '2026-11-18', lib, none)).toBe(null);
    expect(reviewOf(studyOf([...rows, row('A', '2026-11-23', { u: 'fourth' })], 'A', 'A'), '2026-11-23', lib, none)).toBe('waitress');
  });
});

describe('playsOf: これまでの記録', () => {
  const ev = (who: 'A' | 'B' | 'G', d: string, data: object, id = `e${++n}`): EventRow =>
    [`${d}T03:00:00.000Z`, who, id, 'listen', JSON.stringify({ d, g: `tv${++n}aa`, gm: 'tv', u: 'waitress', ms: 60_000, r: [], ...data })];
  it('a clip’s rows up to its まとめ are one play (another clip’s between them don’t cut it), the latest first; a later row’s answers win', () => {
    const rows = [
      ev('A', '2026-11-16', { r: [['q1', 0, 2, 1]] }, 'a1'),
      ev('A', '2026-11-16', { u: 'other', f: 1, r: [['o1', 1, 0, 0]] }, 'b1'),
      ev('A', '2026-11-17', { f: 1, r: [['q1', 0, 2, 1], ['q2', 1, 0, 0]] }, 'a2')
    ];
    const ps = playsOf(rows, 'A');
    expect(ps.map((p) => [p.key, p.u, p.d, p.ms, p.f, p.k])).toEqual([['a1', 'waitress', '2026-11-17', 120_000, true, 1], ['b1', 'other', '2026-11-16', 60_000, true, 1]]);
    expect(ps[0].r).toEqual([['q1', 0, 2, 1], ['q2', 1, 0, 0]]);
    expect(missesOf(ps[0])).toEqual(['q1']);
  });
  it('rows after まとめ (the lesson left open there) add their minutes to that play, never a play of their own; the next play is the 2nd', () => {
    const rows = [ev('A', '2026-11-16', { f: 1, r: [['q1', 1, 0, 0]] }, 'a1'), ev('A', '2026-11-16', { ms: 90_000 }), ev('A', '2026-11-18', { f: 1, r: [['q3', 1, 0, 0]] }, 'a2')];
    expect(playsOf(rows, 'A').map((p) => [p.key, p.ms, p.k])).toEqual([['a2', 60_000, 2], ['a1', 150_000, 1]]);
  });
  it('a play without まとめ is unfinished (途中まで), placed by its last row', () => {
    const rows = [ev('A', '2026-11-16', { u: 'other', f: 1 }, 'b1'), ev('A', '2026-11-16', { r: [['q1', 0, 1, 1]] }, 'a1'), ev('A', '2026-11-16', { u: 'third', f: 1 }, 'c1')];
    expect(playsOf(rows, 'A').map((p) => [p.key, p.f])).toEqual([['c1', true], ['a1', false], ['b1', true]]);
  });
  it('mine only: the partner’s rows and summaries never show; the guest has their own', () => {
    const summary: EventRow = ['2026-11-16T03:00:00.000Z', 'B', 'x', 'listen', JSON.stringify({ d: '2026-11-16', g: 'tv1aa', ms: 5, gm: 'tv', f: 1 })];
    const rows = [ev('B', '2026-11-16', { f: 1 }), summary, ev('G', '2026-11-16', { f: 1 }, 'g1')];
    expect(playsOf(rows, 'A')).toEqual([]);
    expect(playsOf(rows, 'B').map((p) => p.key)).not.toContain('x');
    expect(playsOf(rows, 'G').map((p) => p.key)).toEqual(['g1']);
  });
  it('the top line: clips finished, days studied, all the time', () => {
    const rows = [row('A', '2026-11-16'), row('A', '2026-11-16', { u: 'other' }), row('A', '2026-11-23', { f: undefined, ms: 120_000 })];
    expect(totalsOf(studyOf(rows, 'A', 'A'))).toEqual({ clips: 2, days: 1, ms: 2 * 600_000 + 120_000 });
  });
});
