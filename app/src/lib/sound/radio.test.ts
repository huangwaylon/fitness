// The announcement's radio jingle (docs/design.md#cues): the time of day's, one of six by the date, or the holiday's.
import { describe, expect, it } from 'vitest';
import { radioJingleAt, radioSlot } from './radio.ts';
import { RADIO_JINGLES, SOUNDS } from './ids.ts';

const at = (s: string) => radioJingleAt(new Date(`${s}+09:00`));

describe('radio jingles (radio.ts)', () => {
  it('the time of day: morning 05–11, noon 11–17, evening 17–05 (Tokyo)', () => {
    expect([4, 5, 10, 11, 16, 17, 23, 0].map(radioSlot)).toEqual(['evening', 'morning', 'morning', 'noon', 'noon', 'evening', 'evening', 'evening']);
    expect(at('2026-11-10T04:59:59')).toMatch(/^radio-evening-[1-6]$/);
    expect(at('2026-11-10T05:00:00')).toMatch(/^radio-morning-[1-6]$/);
    expect(at('2026-11-10T10:59:59')).toMatch(/^radio-morning-[1-6]$/);
    expect(at('2026-11-10T11:00:00')).toMatch(/^radio-noon-[1-6]$/);
    expect(at('2026-11-10T16:59:59')).toMatch(/^radio-noon-[1-6]$/);
    expect(at('2026-11-10T17:00:00')).toMatch(/^radio-evening-[1-6]$/);
    // the Tokyo clock: 20:00 UTC is 05:00 the next day in Tokyo
    expect(radioJingleAt(new Date('2026-11-09T20:00:00Z'))).toMatch(/^radio-morning-/);
  });
  it('the variant is the Tokyo date\'s (both phones agree), the same all day, and all six come up', () => {
    const n = (s: string) => at(s).slice(-1);
    expect(n('2026-11-10T06:00:00')).toBe(n('2026-11-10T13:00:00'));
    expect(n('2026-11-10T06:00:00')).toBe(n('2026-11-10T22:00:00'));
    expect(at('2026-11-10T06:00:00')).toBe(at('2026-11-10T06:00:00'));
    const seen = new Set(Array.from({ length: 60 }, (_, i) => n(`2026-${String(5 + Math.floor(i / 28)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}T12:00:00`)));
    expect([...seen].sort()).toEqual(['1', '2', '3', '4', '5', '6']);
  });
  it("a holiday's own all its date: Bunny Day, Halloween, Turkey Day, Toy Day, the countdown, Festivale's carnival", () => {
    expect(at('2027-03-28T06:00:00')).toBe('radio-bunny-day');
    expect(at('2027-03-21T06:00:00')).toMatch(/^radio-morning-/); // the celebrations' first day: not Bunny Day
    expect(at('2026-10-31T00:00:00')).toBe('radio-halloween');
    expect(at('2026-10-31T23:59:59')).toBe('radio-halloween');
    expect(at('2026-11-01T00:00:00')).toMatch(/^radio-evening-/);
    expect(at('2026-11-26T08:00:00')).toBe('radio-turkey-day');
    expect(at('2026-12-24T20:00:00')).toBe('radio-toy-day');
    expect(at('2026-12-31T10:00:00')).toBe('radio-countdown');
    expect(at('2027-02-08T12:00:00')).toBe('radio-carnival');
    expect(at('2026-02-16T12:00:00')).toBe('radio-carnival');
  });
  it('every jingle it can name is a sound', () => {
    expect(RADIO_JINGLES).toHaveLength(3 * 6 + 6);
    for (const id of RADIO_JINGLES) expect(SOUNDS[id]).toBeDefined();
  });
});
