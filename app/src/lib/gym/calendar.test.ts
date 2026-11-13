// ジム's calendar model (calendar.ts): the 4 weeks and each cell (the 4-day default, the fills, the marks, the
// words), the slot picker's rules, the ⏳ times allowed, the optimistic rows, the undo of a change and a bulk act.
import { describe, expect, it } from 'vitest';
import { bulkAct, fromChoices, movedDays, pickSlot, predict, predictAll, slotCount, SLOTS, undoActs, weeks, withBase, type SlotPick } from './calendar.ts';
import { addDays, at, type DayRow } from './contract.ts';

/** Today: Thursday 2026-11-12, noon in Tokyo. */
const TODAY = '2026-11-12';
const NOW = at(TODAY, '12:00');
const day = (i: number) => addDays(TODAY, i);
const row = (i: number, patch: Partial<DayRow> = {}): DayRow =>
  ({ day: day(i), rule: null, usual: i < 4, from: null, announced: [], resettable: false, base: `b${i}`, ...patch });
const rows = (patch: Record<number, Partial<DayRow>> = {}): DayRow[] => Array.from({ length: 25 }, (_, i) => row(i, patch[i]));

describe('weeks', () => {
  it('4 weeks Mon–Sun from this week’s Monday; the 25 days a cell each, the rest blank', () => {
    const w = weeks(rows());
    expect(w.map((x) => x.length)).toEqual([7, 7, 7, 7]);
    expect(w[0][0].day).toBe('2026-11-09'); // the Monday
    expect(w[0].slice(0, 3).every((c) => c.row === null)).toBe(true); // Mon–Wed passed
    expect(w[0][3]).toMatchObject({ day: TODAY, today: true, date: 12 });
    expect(w.flat().filter((c) => c.row).length).toBe(25);
    expect(w[3][6]).toMatchObject({ day: '2026-12-06', row: { day: day(24) } }); // a Thursday's 25 days end on the 4th Sunday
    const monday = weeks(rows().map((r, i) => ({ ...r, day: addDays('2026-11-09', i) })));
    expect(monday[3].slice(4).every((c) => c.row === null)).toBe(true); // from a Monday: 12/3–12/6 past the 25
  });

  it('the 4-day default: the next 4 days ふだん 12–13 (mint, dashed), the rest 未チェック', () => {
    const cells = weeks(rows()).flat().filter((c) => c.row);
    expect(cells.slice(0, 5).map((c) => [c.fill, c.time])).toEqual([['usual', '12–13'], ['usual', '12–13'], ['usual', '12–13'], ['usual', '12–13'], ['none', null]]);
    expect(cells[0].label).toBe('11/12（木）（今日）、ふだん（12:00〜13:00）');
    expect(cells[4].label).toBe('11/16（月）、未チェック');
  });

  it('fills, times and marks: 終日, 時間指定, オフ, ⏳, announced', () => {
    const r = rows({
      1: { rule: 'any', from: at(day(1), '18:00'), resettable: true },
      2: { rule: ['18:30', '20:00'], announced: ['18:30', '19:00'], resettable: true },
      6: { rule: 'skip', resettable: true },
      7: { rule: ['12:00', '13:00'], from: at(day(6), '21:00'), resettable: true }
    });
    const c = weeks(r).flat().filter((x) => x.row);
    expect([c[1].fill, c[1].time, c[1].from, c[1].label]).toEqual(['any', null, true, '11/13（金）、終日、18:00から']);
    expect([c[2].fill, c[2].time, c[2].announced, c[2].label]).toEqual(['range', '18:30–20', 2, '11/14（土）、18:30〜20:00、通知済み2件']);
    expect([c[6].fill, c[6].label]).toEqual(['off', '11/18（水）、オフ']);
    expect(c[7].label).toBe('11/19（木）、12:00〜13:00、11/18（水） 21:00から'); // a ⏳ on another day (from LINE)
  });
});

describe('the slot picker', () => {
  const tap = (p: SlotPick, ...slots: string[]) => slots.reduce(pickSlot, p);
  const none: SlotPick = { range: null, open: false };

  it('has the 24 half-hour slots 10:00…21:30', () => {
    expect([SLOTS.length, SLOTS[0], SLOTS.at(-1)]).toEqual([24, '10:00', '21:30']);
  });

  it('a first tap starts an hour (2 slots), the second picks the last slot', () => {
    expect(tap(none, '18:00')).toEqual({ range: ['18:00', '19:00'], open: true });
    expect(tap(none, '18:00', '20:30')).toEqual({ range: ['18:00', '21:00'], open: false });
    expect(tap(none, '18:00', '18:00')).toEqual({ range: ['18:00', '18:30'], open: false }); // one slot
  });

  it('21:30 starts the last slot only: 21:30〜22:00', () => {
    expect(tap(none, '21:30')).toEqual({ range: ['21:30', '22:00'], open: true });
    expect(tap(none, '21:00', '21:30')).toEqual({ range: ['21:00', '22:00'], open: false });
  });

  it('a second tap before the start starts again; a tap inside a picked range trims its end; outside starts again', () => {
    expect(tap(none, '18:00', '12:00')).toEqual({ range: ['12:00', '13:00'], open: true });
    const picked: SlotPick = { range: ['12:00', '15:00'], open: false };
    expect(tap(picked, '13:00')).toEqual({ range: ['12:00', '13:30'], open: false });
    expect(tap(picked, '14:30')).toEqual({ range: ['14:30', '15:30'], open: true }); // the last slot: a new start
    expect(tap(picked, '10:00')).toEqual({ range: ['10:00', '11:00'], open: true });
    expect(slotCount(['12:00', '13:00'])).toBe(2);
  });
});

describe('⏳ times', () => {
  const ok = (r: DayRow, now = NOW) => fromChoices(r, now).filter((c) => c.ok).map((c) => c.clock);

  it('in the future, before the window’s last slot (ふだん: before 12:30)', () => {
    expect(ok(row(1))).toEqual(['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00']);
    expect(ok(row(0))).toEqual([]); // today past noon: nothing before 12:30 is ahead
    expect(ok(row(0, { rule: ['18:00', '20:00'] }))).toEqual(['12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00']);
  });

  it('終日: up to the day’s last slot; the passed ones and the rest shown, disabled', () => {
    const all = fromChoices(row(0, { rule: 'any' }), NOW);
    expect(all.at(-1)).toEqual({ clock: '21:30', ok: false });
    expect(all.find((c) => c.clock === '21:00')).toEqual({ clock: '21:00', ok: true });
    expect(all.find((c) => c.clock === '12:00')).toEqual({ clock: '12:00', ok: false });
    expect(all.length).toBe(32);
  });
});

describe('predict (the row shown before the answer)', () => {
  it('sets, clears and resets as the bot does', () => {
    expect(predict(row(1), { a: 'any', d: day(1) }, true)).toMatchObject({ rule: 'any', usual: false, resettable: true });
    expect(predict(row(1), { a: 'range', d: day(1), s: '12:00', e: '13:00' }, true)).toMatchObject({ rule: null, usual: true, resettable: false }); // ふだん anyway
    expect(predict(row(9), { a: 'range', d: day(9), s: '12:00', e: '13:00' }, false)).toMatchObject({ rule: ['12:00', '13:00'], usual: false });
    expect(predict(row(9, { rule: 'any', from: 5 }), { a: 'skip', d: day(9) }, false)).toMatchObject({ rule: 'skip', from: null }); // 🔕 clears ⏳
    expect(predict(row(2, { rule: 'any', announced: ['12:00'] }), { a: 'reset', d: day(2) }, true)).toMatchObject({ rule: null, usual: true, announced: [], resettable: false });
    expect(predict(row(9), { a: 'from', d: day(9), at: '10:00' }, false)).toMatchObject({ rule: ['12:00', '13:00'], from: at(day(9), '10:00') }); // a 💤 day gets the usual window
    expect(predict(row(1), { a: 'from', d: day(1), at: '10:00' }, true)).toMatchObject({ rule: null, usual: true, from: at(day(1), '10:00') });
  });

  it('a bulk act on its days only', () => {
    const r = predictAll(rows(), { a: 'skip', days: [{ d: day(5) }, { d: day(6) }] }, 4);
    expect(r.filter((x) => x.rule === 'skip').map((x) => x.day)).toEqual([day(5), day(6)]);
    expect(predictAll(rows(), { a: 'pause' }, 4)).toEqual(rows());
  });
});

describe('undo', () => {
  const after = (before: DayRow[], input: Parameters<typeof predictAll>[1]) => predictAll(before, input, 4);

  it('puts a rule back; a ⏳ after it', () => {
    const was = rows({ 9: { rule: 'any', from: at(day(9), '09:00'), resettable: true } });
    expect(undoActs(was, after(was, { a: 'skip', d: day(9) }), 4)).toEqual([{ a: 'any', d: day(9) }, { a: 'from', d: day(9), at: at(day(9), '09:00') }]);
    expect(undoActs(was, after(was, { a: 'unfrom', d: day(9) }), 4)).toEqual([{ a: 'from', d: day(9), at: at(day(9), '09:00') }]);
    const ranged = rows({ 9: { rule: ['18:00', '20:00'], resettable: true } });
    expect(undoActs(ranged, after(ranged, { a: 'any', d: day(9) }), 4)).toEqual([{ a: 'range', d: day(9), s: '18:00', e: '20:00' }]);
  });

  it('back to ふだん with its window, to 未チェック with a reset', () => {
    const was = rows();
    expect(undoActs(was, after(was, { a: 'any', d: day(1) }), 4)).toEqual([{ a: 'range', d: day(1), s: '12:00', e: '13:00' }]);
    expect(undoActs(was, after(was, { a: 'any', d: day(9) }), 4)).toEqual([{ a: 'reset', d: day(9) }]);
    expect(undoActs(was, after(was, { a: 'from', d: day(1), at: '10:00' }), 4)).toEqual([{ a: 'unfrom', d: day(1) }]);
  });

  it('a bulk act: bulk where the days share one', () => {
    const was = rows({ 6: { rule: 'any', resettable: true } });
    const done = after(was, bulkAct('skip', [day(5), day(6), day(7), day(8)], was));
    expect(undoActs(was, done, 4)).toEqual([{ a: 'reset', days: [{ d: day(5) }, { d: day(7) }, { d: day(8) }] }, { a: 'any', d: day(6) }]);
    expect(undoActs(was, was, 4)).toEqual([]);
  });
});

describe('bases', () => {
  it('a bulk act carries each day’s base; withBase puts the current one on', () => {
    expect(bulkAct('range', [day(3), day(4)], rows(), ['18:00', '19:00'])).toEqual({ a: 'range', s: '18:00', e: '19:00', days: [{ d: day(3), base: 'b3' }, { d: day(4), base: 'b4' }] });
    expect(withBase({ a: 'any', d: day(2) }, rows())).toEqual({ a: 'any', d: day(2), base: 'b2' });
    expect(withBase({ a: 'reset', days: [{ d: day(1) }] }, rows())).toEqual({ a: 'reset', days: [{ d: day(1), base: 'b1' }] });
    expect(withBase({ a: 'interval', m: 30 }, rows())).toEqual({ a: 'interval', m: 30 });
  });

  it('a poll’s moved days are those whose base changed', () => {
    expect(movedDays(rows(), rows({ 3: { base: 'zz' }, 8: { base: 'yy' } }))).toEqual([day(3), day(8)]);
  });
});
