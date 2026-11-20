// The tree popup's daily checks as read (model/checks.ts): 顔, HIIT and Core by hand only (an old day's hiit_n /
// core_n rows tick nothing), the latest tap wins, the Tokyo day a check is for, all three, the tap's value, and the
// reward hook (RULES.checks, 0 for now: nothing paid, nothing shown).
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';
import { localDateAt } from '#lib/time/dates.ts';
import { RULES } from '#lib/config/rules.ts';
import { reduce } from './state.ts';
import { allChecked, dayChecks, toggleValue } from './checks.ts';
import { weekBells } from './bells.ts';

const jst = (date: string, hm: string) => new Date(`${date}T${hm}:00+09:00`).toISOString();
let n = 0;
const check = (at: string, p: PersonId | 'G', d: string, k: string, v: boolean | null): EventRow => [at, p, `c${++n}`, 'check', JSON.stringify({ d, k, v })];
const DAY = '2026-11-19';
const state = (events: EventRow[] = [], metrics: MetricRow[] = []) => reduce({ metrics, events });
const done = (s: ReturnType<typeof state>, p: PersonId = 'A', d = DAY, t?: number) => {
  const c = dayChecks(s, p, d, t);
  return [c.face.done, c.hiit.done, c.core.done];
};
const all3 = (p: PersonId = 'A', hm = '09:0') => (['face', 'hiit', 'core'] as const).map((k, i) => check(jst(DAY, `${hm}${i}`), p, DAY, k, true));

describe('daily checks', () => {
  it('nothing yet: none done; a stored workout row (the old Shortcut’s hiit_n / core_n) ticks nothing', () => {
    expect(done(state())).toEqual([false, false, false]);
    const old = state([], [[jst(DAY, '08:00'), 'A', DAY, 'hiit_n' as MetricRow[3], 1], [jst(DAY, '08:00'), 'A', DAY, 'core_n' as MetricRow[3], 2]]);
    expect(done(old)).toEqual([false, false, false]);
  });

  it('each by hand: true is done, false or null not; the latest wins; each person’s and day’s own', () => {
    const s = state([check(jst(DAY, '09:00'), 'A', DAY, 'hiit', true), check(jst(DAY, '09:01'), 'A', DAY, 'core', true), check(jst(DAY, '09:02'), 'A', DAY, 'core', false)]);
    expect(done(s)).toEqual([false, true, false]);
    expect(done(state([check(jst(DAY, '09:00'), 'A', DAY, 'face', true), check(jst(DAY, '09:05'), 'A', DAY, 'face', null)]))).toEqual([false, false, false]);
    expect(done(s, 'B')).toEqual([false, false, false]);
    expect(done(s, 'A', '2026-11-18')).toEqual([false, false, false]);
  });

  it('a check is for its own Tokyo day: one sent at 23:59 for that day, one at 00:01 for the next', () => {
    const late = Date.parse(jst(DAY, '23:59')), early = Date.parse(jst('2026-11-20', '00:01'));
    expect(localDateAt(late)).toBe(DAY);
    expect(localDateAt(early)).toBe('2026-11-20');
    const s = state([check(new Date(late).toISOString(), 'A', localDateAt(late), 'face', true), check(new Date(early).toISOString(), 'A', localDateAt(early), 'core', true)]);
    expect(done(s, 'A', DAY)).toEqual([true, false, false]);
    expect(done(s, 'A', '2026-11-20')).toEqual([false, false, true]);
  });

  it('the guest’s check counts for no one (the record refuses it too)', () => {
    expect(done(state([check(jst(DAY, '09:00'), 'G', DAY, 'face', true)]))).toEqual([false, false, false]);
  });

  it('as of a time: rows stamped later are not read', () => {
    const s = state([check(jst(DAY, '20:00'), 'A', DAY, 'core', true), check(jst(DAY, '21:00'), 'A', DAY, 'face', true)]);
    expect(done(s, 'A', DAY, Date.parse(jst(DAY, '19:00')))).toEqual([false, false, false]);
    expect(done(s, 'A', DAY, Date.parse(jst(DAY, '20:30')))).toEqual([false, false, true]);
  });

  it('all three; a tap sends true to tick, null to untick', () => {
    const s = state(all3());
    expect(allChecked(dayChecks(s, 'A', DAY))).toBe(true);
    expect(allChecked(dayChecks(s, 'B', DAY))).toBe(false);
    expect(toggleValue({ done: false })).toBe(true);
    expect(toggleValue({ done: true })).toBe(null);
  });

  it('the reward hook: the day all three are done is marked once (however many taps); RULES.checks (0) adds nothing', () => {
    expect(RULES.checks).toBe(0);
    const ev = [0, 1, 2, 3].map((i) => check(jst(DAY, `08:0${i}`), 'A', DAY, 'face', i % 2 === 0 ? true : null));
    const s = state([...ev, ...all3()]);
    const now = Date.parse(jst(DAY, '22:00'));
    const w = weekBells(s, '2026-11-16', now);
    const i = w.A.days.findIndex((d) => d.date === DAY);
    expect(w.A.days[i].checks).toBe(true);
    expect(w.A.days.filter((d) => d.checks)).toHaveLength(1);
    expect(w.B.days[i].checks).toBe(false);
    expect(w.A.days[i].bells).toBe(0); // no goal met, and 0 for the checks
  });
});
