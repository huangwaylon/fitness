// The tree popup's daily checks as read (model/checks.ts): HIIT and Core from the day's workouts, 顔 by hand only, a
// hand-set value over the workouts (and back to them with null), the Tokyo day a check is for, all three, the tap's
// value, and the reward hook (RULES.checks, 0 for now: nothing paid, nothing shown).
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
const metric = (at: string, p: PersonId, date: string, m: MetricRow[3], v: number): MetricRow => [at, p, date, m, v];
const DAY = '2026-11-19';
const state = (metrics: MetricRow[] = [], events: EventRow[] = []) => reduce({ metrics, events });
const done = (s: ReturnType<typeof state>, p: PersonId = 'A', d = DAY, t?: number) => {
  const c = dayChecks(s, p, d, t);
  return [c.face.done, c.hiit.done, c.core.done];
};

describe('daily checks', () => {
  it('nothing yet: none done; HIIT and Core tick from the day’s workouts, 顔 never does', () => {
    expect(done(state())).toEqual([false, false, false]);
    const s = state([metric(jst(DAY, '08:00'), 'A', DAY, 'hiit_n', 1), metric(jst(DAY, '08:00'), 'A', DAY, 'core_n', 2)]);
    expect(done(s)).toEqual([false, true, true]);
    expect(dayChecks(s, 'A', DAY).hiit).toEqual({ done: true, auto: true, manual: false });
    // another person's, another day's
    expect(done(s, 'B')).toEqual([false, false, false]);
    expect(done(s, 'A', '2026-11-18')).toEqual([false, false, false]);
  });

  it('a hand-set value wins over the workouts, either way; null hands it back; the latest wins', () => {
    const w = [metric(jst(DAY, '08:00'), 'A', DAY, 'hiit_n', 1)];
    expect(done(state(w, [check(jst(DAY, '09:00'), 'A', DAY, 'hiit', false)]))).toEqual([false, false, false]);
    expect(dayChecks(state(w, [check(jst(DAY, '09:00'), 'A', DAY, 'hiit', false)]), 'A', DAY).hiit).toEqual({ done: false, auto: true, manual: true });
    expect(done(state([], [check(jst(DAY, '09:00'), 'A', DAY, 'core', true), check(jst(DAY, '09:01'), 'A', DAY, 'face', true)]))).toEqual([true, false, true]);
    expect(done(state(w, [check(jst(DAY, '09:00'), 'A', DAY, 'hiit', false), check(jst(DAY, '09:05'), 'A', DAY, 'hiit', null)]))).toEqual([false, true, false]);
    expect(done(state([], [check(jst(DAY, '09:00'), 'A', DAY, 'face', true), check(jst(DAY, '09:05'), 'A', DAY, 'face', false)]))).toEqual([false, false, false]);
  });

  it('a check is for its own Tokyo day: one sent at 23:59 for that day, one at 00:01 for the next', () => {
    const late = Date.parse(jst(DAY, '23:59')), early = Date.parse(jst('2026-11-20', '00:01'));
    expect(localDateAt(late)).toBe(DAY);
    expect(localDateAt(early)).toBe('2026-11-20');
    const s = state([], [check(new Date(late).toISOString(), 'A', localDateAt(late), 'face', true), check(new Date(early).toISOString(), 'A', localDateAt(early), 'core', true)]);
    expect(done(s, 'A', DAY)).toEqual([true, false, false]);
    expect(done(s, 'A', '2026-11-20')).toEqual([false, false, true]);
  });

  it('the guest’s check counts for no one (the record refuses it too)', () => {
    expect(done(state([], [check(jst(DAY, '09:00'), 'G', DAY, 'face', true)]))).toEqual([false, false, false]);
  });

  it('as of a time: rows stamped later are not read', () => {
    const s = state([metric(jst(DAY, '20:00'), 'A', DAY, 'core_n', 1)], [check(jst(DAY, '21:00'), 'A', DAY, 'face', true)]);
    expect(done(s, 'A', DAY, Date.parse(jst(DAY, '19:00')))).toEqual([false, false, false]);
    expect(done(s, 'A', DAY, Date.parse(jst(DAY, '20:30')))).toEqual([false, false, true]);
  });

  it('all three; a tap flips what’s shown and hands back to the workouts when the flip agrees with them', () => {
    const s = state([metric(jst(DAY, '08:00'), 'A', DAY, 'hiit_n', 1), metric(jst(DAY, '08:00'), 'A', DAY, 'core_n', 1)], [check(jst(DAY, '09:00'), 'A', DAY, 'face', true)]);
    expect(allChecked(dayChecks(s, 'A', DAY))).toBe(true);
    expect(allChecked(dayChecks(s, 'B', DAY))).toBe(false);
    expect(toggleValue({ done: false, auto: false, manual: false })).toBe(true); // 顔 on
    expect(toggleValue({ done: true, auto: false, manual: true })).toBe(null); // 顔 off: no hand-set value left
    expect(toggleValue({ done: true, auto: true, manual: false })).toBe(false); // a workout's unset by hand
    expect(toggleValue({ done: false, auto: true, manual: true })).toBe(null); // back to the workout
    expect(toggleValue({ done: false, auto: false, manual: true })).toBe(true);
  });

  it('the reward hook: the day all three are done is marked once (however many taps); RULES.checks (0) adds nothing', () => {
    expect(RULES.checks).toBe(0);
    const ev = [0, 1, 2, 3].map((i) => check(jst(DAY, `09:0${i}`), 'A', DAY, 'face', i % 2 === 0));
    const s = state([metric(jst(DAY, '08:00'), 'A', DAY, 'hiit_n', 1), metric(jst(DAY, '08:00'), 'A', DAY, 'core_n', 1)], [...ev, check(jst(DAY, '09:10'), 'A', DAY, 'face', true)]);
    const now = Date.parse(jst(DAY, '22:00'));
    const w = weekBells(s, '2026-11-16', now);
    const i = w.A.days.findIndex((d) => d.date === DAY);
    expect(w.A.days[i].checks).toBe(true);
    expect(w.A.days.filter((d) => d.checks)).toHaveLength(1);
    expect(w.B.days[i].checks).toBe(false);
    expect(w.A.days[i].bells).toBe(0); // no goal met, and 0 for the checks
  });
});
