// The bots' status strip's slots (strip.ts): the clock's grid (保養所's minutes), the checks in turn (ジム's: the
// alarm's jitter leaves no false gap), the ticks on Tokyo's clock.
import { describe, expect, it } from 'vitest';
import { bucket, chain, gridStarts, hhmm, stripTicks, type StripCell } from './strip.ts';

const MIN = 60_000;
const at = (hm: string) => Date.parse(`2026-11-13T${hm}:00+09:00`);

describe('gridStarts, bucket', () => {
  it('the last slots on the clock up to now’s, oldest first; items into them, one outside left out', () => {
    const now = at('12:00') + 30_000;
    const starts = gridStarts(now, MIN, 3);
    expect(starts.map(hhmm)).toEqual(['11:58', '11:59', '12:00']);
    const got = bucket([at('11:57'), at('11:58') + 59_999, at('11:58'), at('12:00') + 59_999, at('12:01')], (t) => t, starts[0], MIN, 3);
    expect(got.map((x) => x.length)).toEqual([2, 0, 1]);
  });
});

describe('chain', () => {
  const slots = (ts: number[], now = at('12:00'), n = 6) => chain(ts, (t) => t, now, 15 * MIN, n).map((s) => s.items.map(hhmm));
  it('each check the slot before the next one’s, whatever its jitter: no false gap, no double', () => {
    // 11:58, then 17 and 13 minutes apart (a grid on the clock would leave 11:30 empty and double 11:45)
    expect(slots([at('11:58'), at('11:41'), at('11:28'), at('11:14')])).toEqual([[], [], ['11:14'], ['11:28'], ['11:41'], ['11:58']]);
  });
  it('a gap of n intervals leaves n − 1 slots empty; one beside its neighbour shares its slot; past the strip left out', () => {
    expect(slots([at('11:58'), at('11:56'), at('11:28'), at('10:00')])).toEqual([[], [], [], ['11:28'], [], ['11:56', '11:58']]);
  });
  it('the newest is in the last slot until the next is half an interval late; one in the future is left out', () => {
    expect(slots([at('11:38')]).at(-1)).toEqual(['11:38']);
    expect(slots([at('11:37')]).slice(-2)).toEqual([['11:37'], []]);
    expect(slots([at('12:05'), at('11:50')]).at(-1)).toEqual(['11:50']);
  });
  it('the slots’ times: now less whole widths', () => {
    const s = chain([], (t: number) => t, at('12:00'), 15 * MIN, 2);
    expect(s.map((x) => [hhmm(x.start), hhmm(x.end)])).toEqual([['11:30', '11:45'], ['11:45', '12:00']]);
  });
});

describe('stripTicks', () => {
  it('a tick at each cell holding a mark on Tokyo’s clock, its time', () => {
    const cells: StripCell[] = [0, 1, 2, 3].map((i) => ({ start: at('08:50') + i * 50 * MIN, end: at('08:50') + (i + 1) * 50 * MIN, state: 'ok', label: '' }));
    expect(stripTicks(cells, 3 * 3600_000)).toEqual([{ i: 0, label: '09:00' }, { i: 3, label: '12:00' }]);
    expect(stripTicks(cells, 3600_000)).toEqual([{ i: 0, label: '09:00' }, { i: 1, label: '10:00' }, { i: 2, label: '11:00' }, { i: 3, label: '12:00' }]);
  });
});
