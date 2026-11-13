// Tests for the state store.
import { describe, expect, it } from 'vitest';
import { CHECK_INTERVAL_MINUTES, DAYS_TO_CHECK } from '../src/config.ts';
import { ANY, SKIP, Store, VERSION, type Rule } from '../src/store.ts';
import { addDays, at } from '../src/time.ts';

const TODAY = '2026-10-03'; // a Saturday
const NOW = at(TODAY, '09:00');
/** DEFAULT_WINDOW: what a day without a setting is checked for. */
const NOON: Rule = ['12:00', '13:00'];
const EVENING: Rule = ['18:00', '20:00'];
/** 2026-10-<day> at a Tokyo time. */
const oct = (day: number, clock: string): number => at(`2026-10-${String(day).padStart(2, '0')}`, clock);

describe('Store', () => {
  it('gives each day exactly one rule', () => {
    const s = new Store();
    const d = addDays(TODAY, 1);
    expect(s.effectiveRule(d, TODAY)).toEqual(NOON);
    expect(s.setRule(d, SKIP, TODAY)).toBe(true);
    expect(s.rule(d)).toBe(SKIP);
    expect(s.setRule(d, EVENING, TODAY)).toBe(true); // replaces the skip
    expect(s.rule(d)).toEqual(EVENING);
    expect(s.setRule(d, ['18:00', '20:00'], TODAY)).toBe(false); // no change
    expect(s.setRule(d, ANY, TODAY)).toBe(true); // all day is saved: it isn't the default
    expect(s.rule(d)).toBe(ANY);
    expect(s.setRule(d, ['12:00', '13:00'], TODAY)).toBe(true);
    expect(s.rule(d)).toBeUndefined(); // the default isn't saved
    expect(s.rules()).toEqual([]);
  });

  it("doesn't check days past the default unless set", () => {
    const s = new Store();
    const far = addDays(TODAY, DAYS_TO_CHECK);
    expect(s.effectiveRule(far, TODAY)).toBeUndefined();
    expect(s.setRule(far, ANY, TODAY)).toBe(true);
    expect(s.rule(far)).toBe(ANY);
    expect(s.windows(NOW).has(far)).toBe(true);
  });

  it('gives the windows in date order', () => {
    const s = new Store();
    const days = Array.from({ length: DAYS_TO_CHECK }, (_, i) => addDays(TODAY, i));
    s.setRule(days[1]!, SKIP, TODAY);
    s.setRule(days[2]!, ANY, TODAY);
    s.setRule(addDays(TODAY, 40), EVENING, TODAY);
    s.setRule(addDays(TODAY, 30), SKIP, TODAY); // far-off skip: nothing to check
    expect([...s.windows(NOW)]).toEqual([
      [days[0], NOON], [days[2], null], ...days.slice(3).map((d) => [d, NOON]), [addDays(TODAY, 40), EVENING],
    ]);
  });

  it('purges what has passed', () => {
    const s = new Store();
    s.setRule('2026-10-02', SKIP, TODAY);
    s.setRule('2026-10-03', EVENING, TODAY);
    s.setCheckFrom('2026-10-05', oct(3, '08:00'), TODAY); // passed
    s.setCheckFrom('2026-10-06', oct(4, '16:00'), TODAY); // still ahead
    s.markNotified([oct(3, '08:00'), oct(3, '10:00')]);
    s.dirty = false;
    s.purge(NOW);
    expect(s.rules()).toEqual([[TODAY, EVENING]]); // today's rule stays until the day is over
    expect(s.checkFrom('2026-10-05')).toBeUndefined();
    expect(s.checkFrom('2026-10-06')).toBe(oct(4, '16:00'));
    expect(s.notified()).toEqual([oct(3, '10:00')]);
    expect(s.dirty).toBe(true);
  });

  it('holds a day back until its check-from time', () => {
    const s = new Store();
    const day = '2026-10-05';
    expect(s.setCheckFrom(day, oct(4, '16:00'), TODAY)).toBe(true);
    expect(s.windows(NOW).has(day)).toBe(false);
    expect(s.windows(oct(4, '15:59')).has(day)).toBe(false);
    expect(s.windows(oct(4, '16:00')).get(day)).toEqual(NOON);
  });

  it.each([undefined, SKIP] as const)('turns on a day that is not checked when given a check-from (%s)', (before) => {
    const s = new Store();
    const far = '2026-10-20';
    if (before) s.setRule(far, before, TODAY);
    expect(s.setCheckFrom(far, oct(18, '16:00'), TODAY)).toBe(true);
    expect(s.rule(far)).toEqual(NOON); // the default's window, saved: the day is past the default days
    expect(s.windows(oct(18, '16:00')).get(far)).toEqual(NOON);
  });

  it('gives a skipped default day its default back with a check-from', () => {
    const s = new Store();
    const day = '2026-10-05';
    s.setRule(day, SKIP, TODAY);
    expect(s.setCheckFrom(day, oct(4, '16:00'), TODAY)).toBe(true);
    expect(s.rule(day)).toBeUndefined();
    expect(s.effectiveRule(day, TODAY)).toEqual(NOON);
  });

  it('keeps the check-from through rule changes except off', () => {
    const s = new Store();
    const day = '2026-10-05';
    s.setCheckFrom(day, oct(4, '16:00'), TODAY);
    s.setRule(day, EVENING, TODAY);
    expect(s.checkFrom(day)).toBe(oct(4, '16:00'));
    expect(s.windows(oct(4, '16:00')).get(day)).toEqual(EVENING);
    s.setRule(day, ANY, TODAY);
    expect(s.checkFrom(day)).toBe(oct(4, '16:00'));
    s.setRule(day, SKIP, TODAY);
    expect(s.checkFrom(day)).toBeUndefined();
    expect(s.setCheckFrom(day, null, TODAY)).toBe(false); // nothing to clear
  });

  it('resets everything for the day', () => {
    const s = new Store();
    const far = '2026-10-12';
    expect(s.hasAnything(far)).toBe(false);
    s.setRule(far, NOON, TODAY);
    s.setCheckFrom(far, oct(10, '16:00'), TODAY);
    s.markNotified([oct(12, '13:00'), oct(13, '13:00')]);
    expect(s.reset(far)).toBe(true);
    expect(s.rule(far)).toBeUndefined();
    expect(s.checkFrom(far)).toBeUndefined();
    expect(s.effectiveRule(far, TODAY)).toBeUndefined(); // 💤 again
    expect(s.notified()).toEqual([oct(13, '13:00')]); // its announced times are forgotten too; other days' stay
    expect(s.reset(far)).toBe(false); // nothing left to clear
    expect(s.hasAnything('2026-10-13')).toBe(true); // announced times alone count
  });

  it('round-trips through JSON', () => {
    const s = new Store();
    s.setRule('2026-10-05', SKIP, TODAY);
    s.setRule('2026-10-06', EVENING, TODAY);
    s.setRule('2026-10-20', ANY, TODAY);
    s.setCheckFrom('2026-10-06', oct(5, '16:00'), TODAY);
    s.markNotified([oct(6, '12:00')]);
    s.setInterval(30);
    s.setPaused(true);
    const data = JSON.parse(JSON.stringify(s));
    expect(data.days).toEqual({ '2026-10-05': 'skip', '2026-10-06': ['18:00', '20:00'], '2026-10-20': 'any' });
    expect(data.check_from).toEqual({ '2026-10-06': '2026-10-05T16:00:00+09:00' });
    const s2 = new Store(data);
    expect(s2.toJSON()).toEqual(s.toJSON());
    expect(s2.intervalMinutes).toBe(30);
    expect(s2.paused).toBe(true);
    expect(s2.dirty).toBe(false);
  });

  it('loads a saved state (float interval, spaced JSON) and saves the same content', () => {
    const saved = '{"version": 3, "interval_minutes": 15.0, "paused": false, "days": {"2026-11-12": ["12:00", "13:00"]}, '
      + '"check_from": {}, "notified": ["2026-11-12T11:30:00+09:00"]}';
    const s = new Store(JSON.parse(saved));
    expect(s.toJSON()).toEqual(JSON.parse(saved));
    expect(JSON.stringify(s)).toBe(
      '{"version":3,"interval_minutes":15,"paused":false,"days":{"2026-11-12":["12:00","13:00"]},'
        + '"check_from":{},"notified":["2026-11-12T11:30:00+09:00"]}',
    );
  });

  it('saves instants in Tokyo time whatever offset they were read with', () => {
    const s = new Store({ version: VERSION, check_from: { '2026-10-06': '2026-10-05T07:00:00Z' } });
    expect(s.toJSON().check_from).toEqual({ '2026-10-06': '2026-10-05T16:00:00+09:00' });
  });

  it.each([{ version: 2 }, {}, [], 'x', null])('refuses an unknown state version (%j)', (data) => {
    expect(() => new Store(data)).toThrow('unsupported state');
  });

  it.each([
    { days: { '2026-13-01': 'any' } },
    { days: { '2026-10-05': 'sometimes' } },
    { days: { '2026-10-05': ['12:00'] } },
    { days: { '2026-10-05': ['12:00', '25:00'] } },
    { days: [] },
    { check_from: { '2026-10-05': 'later' } },
    { check_from: { '2026-10-05': '2026-10-05T16:00:00' } }, // no offset
    { notified: ['nope'] },
    { notified: 'x' },
    { interval_minutes: '15' },
    { interval_minutes: 0 },
    { interval_minutes: -5 },
    { paused: 'no' },
  ])('refuses bad values (%j)', (bad) => {
    expect(() => new Store({ version: 3, ...bad })).toThrow();
  });

  it('has check settings', () => {
    const s = new Store();
    expect(s.intervalMinutes).toBe(CHECK_INTERVAL_MINUTES);
    expect(s.paused).toBe(false);
    expect(s.setInterval(30)).toBe(true);
    expect(s.setInterval(30)).toBe(false);
    expect(s.setPaused(true)).toBe(true);
    expect(s.setPaused(true)).toBe(false);
  });

  it('tracks whether it changed', () => {
    const s = new Store();
    s.setRule(TODAY, NOON, TODAY); // already the default
    s.markNotified([]);
    s.purge(NOW);
    expect(s.dirty).toBe(false);
    s.setRule(TODAY, SKIP, TODAY);
    expect(s.dirty).toBe(true);
  });

  it('is notified once per start', () => {
    const s = new Store();
    s.markNotified([oct(4, '12:00')]);
    s.dirty = false;
    s.markNotified([oct(4, '12:00')]);
    expect(s.dirty).toBe(false);
    expect(s.isNotified(oct(4, '12:00'))).toBe(true);
    expect(s.isNotified(oct(4, '12:30'))).toBe(false);
  });
});
