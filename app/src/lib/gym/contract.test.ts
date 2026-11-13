// The gym bot's contract (contract.ts), shared by the Worker (gym/src) and ボット → ジム: the body POST /gym/act takes
// (each form, and what isn't one), each refusal's status, and Tokyo's days and times (gym/test checks the rules
// themselves).
import { describe, expect, it } from 'vitest';
import { ACT_STATUS, addDays, at, clockFrom, clockOf, dayOf, DAYS_SHOWN, isDay, isSlotClock, minutesOf, parseActInput, weekday } from './contract.ts';

describe('parseActInput', () => {
  it.each([
    [{ a: 'any', d: '2026-11-14' }],
    [{ a: 'skip', d: '2026-11-14', base: 'k3j9a' }],
    [{ a: 'range', d: '2026-11-14', s: '18:00', e: '22:00' }],
    [{ a: 'from', d: '2026-11-14', at: '09:15' }],
    [{ a: 'from', d: '2026-11-14', at: 1_789_000_000_000 }],
    [{ a: 'interval', m: 60 }],
    [{ a: 'pause' }], [{ a: 'resume' }], [{ a: 'check' }],
    [{ a: 'reset', days: [{ d: '2026-11-14', base: 'a1' }, { d: '2026-11-15' }] }],
    [{ a: 'range', s: '12:00', e: '13:00', days: [{ d: '2026-11-14' }] }],
  ])('reads %j as it is', (x) => {
    expect(parseActInput(x)).toEqual(x);
  });

  it('ignores keys it doesn’t know', () => {
    expect(parseActInput({ a: 'check', d: 'x', extra: 1 })).toEqual({ a: 'check' });
  });

  it.each([
    [null], ['any'], [[]], [{}], [{ a: 'later' }], [{ a: 'any' }], [{ a: 'any', d: '2026-11-31' }], [{ a: 'any', d: '2026-1-4' }],
    [{ a: 'any', d: '2026-11-14', base: 'Ab!' }], [{ a: 'interval', m: 20 }], [{ a: 'interval', m: '15' }],
    [{ a: 'range', d: '2026-11-14', s: '12:10', e: '13:00' }], [{ a: 'range', d: '2026-11-14', s: '12:00' }], [{ a: 'range', d: '2026-11-14', s: '23:00', e: '24:00' }],
    [{ a: 'from', d: '2026-11-14', at: '9:00' }], [{ a: 'from', d: '2026-11-14', at: Infinity }], [{ a: 'from', days: [{ d: '2026-11-14' }], at: '09:00' }],
    [{ a: 'any', days: [] }], [{ a: 'any', days: ['2026-11-14'] }], [{ a: 'any', days: [{ d: '2026-11-14' }, { d: '2026-11-14' }] }],
    [{ a: 'any', days: Array.from({ length: DAYS_SHOWN + 1 }, (_, i) => ({ d: addDays('2026-11-14', i) })) }],
  ])('refuses %j', (x) => {
    expect(parseActInput(x)).toBeNull();
  });
});

describe('the rest', () => {
  it('gives each refusal its status', () => {
    expect([ACT_STATUS.bad_action, ACT_STATUS.day_passed, ACT_STATUS.stale, ACT_STATUS.cooldown, ACT_STATUS.site_failed, ACT_STATUS.too_large]).toEqual([400, 422, 409, 429, 502, 413]);
  });

  it('counts Tokyo’s days and times', () => {
    const t = at('2026-11-14', '00:30');
    expect([dayOf(t), clockOf(t), dayOf(t - 3_600_000)]).toEqual(['2026-11-14', '00:30', '2026-11-13']);
    expect([addDays('2026-11-30', 1), weekday('2026-11-16'), weekday('2026-11-15')]).toEqual(['2026-12-01', 0, 6]);
    expect([minutesOf('21:30'), clockFrom(22 * 60), clockFrom(99 * 60)]).toEqual([1290, '22:00', '23:59']);
    expect([isDay('2026-02-29'), isDay('2028-02-29'), isSlotClock('22:00'), isSlotClock('21:45')]).toEqual([false, true, true, false]);
  });
});
