// A hike's start moved (lib/hiking/start.ts): every stop, the stay and the finish shifted by the same minutes, the
// total the same; past midnight the next day's; null the plan's own; the sunset; hike mode's instants.
import { describe, expect, it } from 'vitest';
import { trailOf } from './trails.ts';
import { fmtHm, inputHm, scheduleOf, shiftPlan, toMin, userEnd } from './start.ts';
import { span } from './strings.ts';
import type { Plan } from './types.ts';

const kinpu = trailOf('kinpu-odarumi')!.plan!, ono = trailOf('ono-yama')!.plan!;
const times = (p: { stops: { time: string; depart?: string }[] }) => p.stops.map((s) => (s.depart ? `${s.time}-${s.depart}` : s.time));

describe('shiftPlan', () => {
  it('null (or the plan’s own start): the plan as it is', () => {
    for (const hm of [null, '7:00', '07:00']) {
      const s = shiftPlan(kinpu, hm);
      expect(times(s)).toEqual(kinpu.itinerary.map((x) => (x.depart ? `${x.time}-${x.depart}` : x.time)));
      expect([s.from, s.start, s.moved, s.late]).toEqual(['7:00', '7:00', false, false]);
    }
  });

  it('a later start: every stop and the summit’s stay moved by it, each leg and the stay as long, the total the same', () => {
    const s = shiftPlan(kinpu, '8:30');
    expect(times(s)).toEqual(['8:30', '9:09', '9:48', '10:16', '10:22', '10:50-12:50', '13:12', '13:18', '13:51', '14:19', '14:52']);
    expect([s.from, s.start, s.moved, s.startMin, s.endMin]).toEqual(['7:00', '8:30', true, 510, 892]);
    const legs = (st: { time: string; depart?: string }[]) => st.slice(1).map((x, i) => span(st[i].depart ?? st[i].time, x.time));
    expect(legs(s.stops)).toEqual(legs(kinpu.itinerary));
    expect(span(s.stops[0].time, s.stops.at(-1)!.time)).toBe(toMin(kinpu.totalTime));
    expect(s.stops.every((x) => x.day === 0)).toBe(true);
    // (names and kinds kept)
    expect(s.stops.map((x) => [x.type, x.name])).toEqual(kinpu.itinerary.map((x) => [x.type, x.name]));
  });

  it('an earlier start too', () => {
    expect(times(shiftPlan(ono, '6:05'))).toEqual(['6:05', '6:13', '6:33', '6:58', '7:04', '8:21-9:21', '9:31', '11:43']);
  });

  it('past midnight: the stops after it the next day’s (day 1), the clock wrapping, the legs as long', () => {
    const s = shiftPlan(ono, '20:00');
    expect(times(s)).toEqual(['20:00', '20:08', '20:28', '20:53', '20:59', '22:16-23:16', '23:26', '1:38']);
    expect(s.stops.map((x) => x.day)).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
    expect([s.endMin, s.late]).toEqual([1538, true]);
    // a stay over midnight
    const t = shiftPlan(ono, '21:50');
    expect(t.stops[5]).toMatchObject({ time: '0:06', depart: '1:06', day: 1 });
    expect(span(t.stops[5].time, t.stops[5].depart!)).toBe(60);
  });

  it('a plan whose own times cross midnight keeps its order', () => {
    const night: Plan = { ...ono, sunset: '16:33', itinerary: [{ time: '23:30', type: 'start', name: { ja: 'a' } }, { time: '0:40', depart: '1:00', type: 'peak', name: { ja: 'b' } }, { time: '2:10', type: 'goal', name: { ja: 'c' } }] };
    const s = shiftPlan(night, '22:30');
    expect(times(s)).toEqual(['22:30', '23:40-0:00', '1:10']);
    expect(s.stops.map((x) => x.day)).toEqual([0, 0, 1]);
  });

  it('日の入り後: the finish after the plan’s sunset (Ōno’s 16:33)', () => {
    expect(shiftPlan(ono, '10:55').late).toBe(false); // 16:33 exactly
    expect(shiftPlan(ono, '11:00').late).toBe(true);
    expect(shiftPlan(ono, null).late).toBe(false);
  });
});

describe('the clock’s strings', () => {
  it('H:MM both ways, the input’s HH:MM, a registered hike’s finish', () => {
    expect([toMin('7:05'), toMin('07:05'), fmtHm(425), fmtHm(1440 + 65), fmtHm(-30)]).toEqual([425, 425, '7:05', '1:05', '23:30']);
    expect([inputHm('7:05'), inputHm('23:00')]).toEqual(['07:05', '23:00']);
    expect([userEnd('8:00', '3 h 40 min'), userEnd('22:30', '2 h'), userEnd('8:00', '45 min'), userEnd('8:00', '')]).toEqual(['11:40', '0:30', '8:45', null]);
  });
});

describe('scheduleOf (hike mode)', () => {
  it('a plan: its day’s start and finish as moved, its sunset (Tokyo)', () => {
    const t = trailOf('ono-yama')!;
    expect(scheduleOf(t, null)).toEqual({ start: Date.parse('2026-11-23T10:00+09:00'), end: Date.parse('2026-11-23T15:38+09:00'), sunset: Date.parse('2026-11-23T16:33+09:00') });
    expect(scheduleOf(t, '11:30')).toMatchObject({ start: Date.parse('2026-11-23T11:30+09:00'), end: Date.parse('2026-11-23T17:08+09:00') });
  });
  it('a registered hike: only with its day and a start; its finish from its time', () => {
    const user = { id: 'h1', status: 'planned', src: 'manual', who: 'A', track: false } as const;
    expect(scheduleOf({ time: '3 h 40 min', user }, '8:00')).toBeNull();
    expect(scheduleOf({ time: '3 h 40 min', user: { ...user, date: '2026-12-01' } }, null)).toBeNull();
    expect(scheduleOf({ time: '3 h 40 min', user: { ...user, date: '2026-12-01' } }, '8:00')).toEqual({ start: Date.parse('2026-12-01T08:00+09:00'), end: Date.parse('2026-12-01T11:40+09:00'), sunset: null });
    expect(scheduleOf({ time: '', user: { ...user, date: '2026-12-01' } }, '8:00')).toMatchObject({ end: null });
  });
});
