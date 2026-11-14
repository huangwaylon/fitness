// ジム's calendar model (calendar.ts): the 2 (or 4) weeks and each cell (the 4-day default, the fills, the marks, the
// words), the slot picker's rules, the ⏳ dates and times allowed, the optimistic rows, the undo of a change and a bulk act.
import { describe, expect, it } from 'vitest';
import { bulkAct, changeLine, fromDates, fromText, fromTimes, movedDays, pickSlot, predict, predictAll, slotCount, SLOTS, undoActs, weeks, withBase, type SlotPick } from './calendar.ts';
import { addDays, at, fromRefusal, type DayRow } from './contract.ts';

/** Today: Thursday 2026-11-12, noon in Tokyo. */
const TODAY = '2026-11-12';
const NOW = at(TODAY, '12:00');
const day = (i: number) => addDays(TODAY, i);
const row = (i: number, patch: Partial<DayRow> = {}): DayRow =>
  ({ day: day(i), rule: null, usual: i < 4, from: null, announced: [], resettable: false, base: `b${i}`, ...patch });
const rows = (patch: Record<number, Partial<DayRow>> = {}): DayRow[] => Array.from({ length: 25 }, (_, i) => row(i, patch[i]));

describe('weeks', () => {
  it('2 weeks from today (today + 13 days, no blank start); 4 in the select mode: the 25 days a cell each, the rest blank', () => {
    const w = weeks(rows());
    expect(w.map((x) => x.length)).toEqual([7, 7]);
    expect(w[0][0]).toMatchObject({ day: TODAY, today: true, date: 12 }); // a Thursday first: its column is Thursday
    expect(w[1][6]).toMatchObject({ day: day(13) });
    expect(w.flat().every((c) => c.row)).toBe(true);
    const four = weeks(rows(), 4);
    expect(four.map((x) => x.length)).toEqual([7, 7, 7, 7]);
    expect(four.flat().filter((c) => c.row).length).toBe(25);
    expect(four[3].slice(4).every((c) => c.row === null)).toBe(true); // 12/6–12/9 past the 25
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
    expect(c[7].label).toBe('11/19（木）、12:00〜13:00、11/18（水）21:00から'); // a ⏳ on an earlier day, as 📋 words it
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

describe('⏳ dates and times', () => {
  const clocks = (r: DayRow, date = r.day, now = NOW) => fromTimes(r, date, now).map((c) => c.clock);
  /** `a:00`, `a:30` … `b:00`, `b:30`, written out by hand (not by the code under test). */
  const hours = (a: number, b: number) => {
    const out: string[] = [];
    for (let h = a; h <= b; h++) out.push(`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`);
    return out;
  };

  it('the day itself: the half hours ahead, before the window’s last slot starts (ふだん: before 12:30)', () => {
    expect(clocks(row(1))).toEqual([...hours(0, 11), '12:00']);
    expect(clocks(row(0))).toEqual([]); // today past noon: nothing before 12:30 is ahead
    expect(clocks(row(0, { rule: ['18:00', '20:00'] }))).toEqual(['12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00']);
    // 🔔: up to 21:00; 21:30 (the last slot's start) is refused, so not offered
    expect(clocks(row(0, { rule: 'any' }))).toEqual(['12:30', ...hours(13, 20), '21:00']);
    expect(clocks(row(2, { rule: 'any' })).at(-1)).toBe('21:00');
    expect(fromRefusal(day(2), at(day(2), '21:29'), NOW, 'any')).toBeNull();
    expect(fromRefusal(day(2), at(day(2), '21:30'), NOW, 'any')).toBe('from_after_window');
    expect(fromRefusal(day(2), at(day(2), '19:29'), NOW, ['18:00', '20:00'])).toBeNull();
    expect(fromRefusal(day(2), at(day(2), '19:30'), NOW, ['18:00', '20:00'])).toBe('from_after_window');
    expect(fromRefusal(day(2), at(day(3), '09:00'), NOW, 'any')).toBe('from_after_day');
    expect(fromRefusal(day(2), NOW, NOW, 'any')).toBe('from_passed');
  });

  it('an earlier day: every half hour still ahead, 00:00–23:30, whatever the window (Fri from Tue 18:00)', () => {
    const fri = row(8, { rule: ['12:00', '13:00'] });
    expect(clocks(fri, day(5))).toEqual(hours(0, 23));
    expect(clocks(fri, day(0))).toEqual(['12:30', ...hours(13, 23)]); // today: from the next half hour
    expect(fromTimes(fri, day(5), NOW).find((c) => c.clock === '18:00')).toEqual({ clock: '18:00', at: at(day(5), '18:00'), ok: true });
  });

  it('the dates: today to the day (none after it, none before today), a day with no time left out', () => {
    expect(fromDates(row(4), NOW)).toEqual(['2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16']);
    expect(fromDates(row(0, { rule: ['18:00', '20:00'] }), NOW)).toEqual(['2026-11-12']);
    expect(fromDates(row(0), NOW)).toEqual([]); // today ふだん past noon: nothing to start
    expect(fromDates(row(2), at(TODAY, '23:45'))).toEqual(['2026-11-13', '2026-11-14']); // 23:45: no half hour left today
  });

  it('a saved ⏳ off the half hours (LINE’s any minute), or no longer allowed, is kept so the select shows it', () => {
    const r = row(3, { rule: 'any', from: at(day(1), '18:10') });
    expect(clocks(r, day(1)).filter((c) => c >= '18:00' && c <= '18:30')).toEqual(['18:00', '18:10', '18:30']);
    const late = row(3, { rule: ['12:00', '13:00'], from: at(day(3), '20:00') }); // from LINE, refused now
    expect(fromTimes(late, day(3), NOW).filter((c) => !c.ok)).toEqual([{ clock: '20:00', at: at(day(3), '20:00'), ok: false }]);
    expect(clocks(late)).toEqual([...hours(0, 11), '12:00', '20:00']);
  });

  it('in words as 📋: the day’s own clock, an earlier day with its date', () => {
    expect(fromText(row(3, { from: at(day(3), '18:00') }))).toBe('18:00');
    expect(fromText(row(8, { from: at(day(5), '18:00') }))).toBe('11/17（火）18:00');
    expect(changeLine({ t: NOW, by: 'A', who: 'ウェイ', a: 'from', d: day(8), at: at(day(5), '18:00'), text: '' })).toBe('11/20（金） 11/17（火）18:00から');
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

  it('a ⏰ that leaves the ⏳ no slot clears it, as the bot does; undone: the rule, then the ⏳', () => {
    const was = rows({ 9: { rule: 'any', from: at(day(9), '20:00'), resettable: true }, 10: { rule: 'any', from: at(day(8), '20:00'), resettable: true } });
    const now = after(was, { a: 'range', d: day(9), s: '12:00', e: '13:00' });
    expect(now[9]).toMatchObject({ rule: ['12:00', '13:00'], from: null });
    expect(after(was, { a: 'range', d: day(9), s: '18:00', e: '21:00' })[9].from).toBe(at(day(9), '20:00')); // 20:30 still after it
    expect(after(was, { a: 'range', d: day(10), s: '12:00', e: '13:00' })[10].from).toBe(at(day(8), '20:00')); // an earlier day's
    expect(undoActs(was, now, 4)).toEqual([{ a: 'any', d: day(9) }, { a: 'from', d: day(9), at: at(day(9), '20:00') }]);
  });

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
