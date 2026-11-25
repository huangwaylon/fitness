// 日程's lines (ledger.ts): a day's rows folded by their kind, each fact once; the one line lit during the trip.
import { describe, expect, it } from 'vitest';
import { instantIn } from '#lib/time/zone.ts';
import { ledger, lines, nowMark, splitText, type Line } from './ledger.ts';
import { nz } from '#lib/travel/trips/nz.ts';
import { okinawa } from '#lib/travel/trips/okinawa.ts';
import { seattle } from '#lib/travel/trips/seattle.ts';
import { zao } from '#lib/travel/trips/zao.ts';
import type { Trip } from '#lib/travel/types.ts';

const day = (t: Trip, n: number) => lines(t, t.days[n - 1]);
const ja = (l: Line) => l.name.ja ?? l.name.en;
const at = (t: Trip, date: string, hhmm: string) => instantIn(t.tz, date, Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3)));

describe('lines', () => {
  it('NZ day 3: a line a stop; the leg under the stop it arrives at, 「発」 on the first only; the event under its stop; the stay', () => {
    const ls = day(nz, 3);
    expect(ls.map((l) => [l.id, l.kind, l.t, ja(l)])).toEqual([
      ['s3-1', 'stop', '08:00', 'パーネル・ファーマーズマーケット'],
      ['s3-2', 'stop', '11:55', 'ワイトモ鍾乳洞'],
      ['s3-3', 'stay', '16:10', 'ニュープリマス']
    ]);
    expect(ls.map((l) => l.how)).toEqual([{ dep: '07:35', mode: 'drive', min: 19 }, { mode: 'drive', min: 151 }, { mode: 'drive', min: 150 }]);
    expect(ls[1].subs.map((s) => [s.t, s.text.ja])).toEqual([['12:15', '洞窟ツアー']]);
    expect(ls[2].booked).toBe(false);
    // the details: the later leg's time and words (no 「発」 of its own), the note, km; the sunset under the night's stop
    expect(ls[1].more).toEqual([{ t: '09:15', text: { ja: 'パーネルを出発', en: 'Leave Parnell' } }, { note: { ja: 'ツアーは事前予約', en: 'Book the tour ahead' } }]);
    expect(ls[1].km).toBeCloseTo(192.7);
    expect(ls[2].more.at(-1)).toMatchObject({ t: '20:28', text: { ja: '日没' } });
    // every row is somewhere, once
    expect(ls.flatMap((l) => l.rows).sort((a, b) => a - b)).toEqual(nz.days[2].rows.map((_, i) => i));
  });

  it('a flight a line of its own, 前日 kept, the airline in its details; the first leg’s note in the next stop’s', () => {
    const ls = day(nz, 1);
    expect(ls[0]).toMatchObject({ id: 'r1-0', kind: 'flight', dd: -1, name: { ja: '成田 → オークランド' }, gloss: { ja: 'NZ 98' } });
    expect(ls[0].more[0].note?.ja).toMatch(/^ニュージーランド航空/);
    expect(ls[0].how).toBeUndefined();
    // the hike's start: its note (headlamps…) is the trailhead's walk's detail, not a line
    const d4 = day(nz, 4);
    expect(d4.map((l) => l.id)).toEqual(['s4-1', 's4-2', 's4-3', 's4-4', 's4-5']);
    expect(d4[1].how).toEqual({ mode: 'walk' });
    expect(d4[1].more[0]).toMatchObject({ t: '03:45', text: { ja: '登山開始' } });
    expect(d4[2].how).toEqual({ mode: 'walk', min: 120 });
  });

  it('a timetable beats free-flow (the airport bus: 1 h, not OSRM’s 40); a leg found by its stop’s index (the dive boat back is not the drive there)', () => {
    const d1 = day(okinawa, 1);
    expect(d1.find((l) => l.id === 's1-1')?.how).toEqual({ dep: '09:40', mode: 'bus', min: 60 });
    expect(d1.find((l) => l.id === 's1-7')).toMatchObject({ kind: 'stay', booked: true });
    const d2 = day(okinawa, 2);
    expect(d2.find((l) => l.id === 's2-1')?.how).toEqual({ dep: '06:50', mode: 'drive', min: 44 });
    // the morning's sunrise at the camp (the day's start: no line) is the first stop's detail
    expect(d2[0].more[0]).toMatchObject({ t: '06:25' });
  });

  it('an event before any stop is a line of its own; a stop’s gloss only in its own language', () => {
    const d3 = day(okinawa, 3);
    expect(d3[0]).toMatchObject({ kind: 'event', t: '07:45', name: { ja: 'テント撤収' } });
    expect(day(zao, 3).map((l) => l.kind)).toEqual(['event', 'event', 'event', 'stop']);
    expect(splitText({ ja: '瀬底島のDIVENUTSに集合', en: 'Dive Nuts, Sesoko — meet' })).toEqual({ name: { ja: '瀬底島のDIVENUTSに集合', en: 'Dive Nuts, Sesoko' }, gloss: { ja: '', en: 'meet' } });
    expect(splitText({ en: 'Lunch' })).toEqual({ name: { en: 'Lunch' } });
  });

  it('Seattle: a drive without a map says its hour; a free day has no lines', () => {
    expect(day(seattle, 7)[0].how).toEqual({ dep: '6:00', mode: 'drive', min: 180 });
    expect(day(seattle, 2)[0].how).toEqual({ dep: '7:00' });
    expect(day(seattle, 3)).toEqual([]);
  });
});

describe('nowMark', () => {
  const all = ledger(nz);
  it('on the road: the stop we are heading to, the time left and the leg’s km; the lines before it gone by', () => {
    const m = nowMark(nz, all, at(nz, '2027-02-13', '14:30'))!;
    expect(m).toMatchObject({ day: 3, id: 's3-3', state: 'moving', left: 100 });
    expect(m.km).toBeCloseTo(181.3);
    expect([m.past(3, 's3-2'), m.past(2, 's2-6'), m.past(3, 's3-3'), m.past(4, 's4-1')]).toEqual([true, true, false, false]);
  });
  it('at a stop (its event now): the stop, no time left', () => {
    expect(nowMark(nz, all, at(nz, '2027-02-13', '12:40'))).toMatchObject({ id: 's3-2', state: 'here' });
    expect(nowMark(nz, all, at(nz, '2027-02-13', '12:40'))?.left).toBeUndefined();
  });
  it('before the day’s first row: つぎ, the first stop, its time to go', () => {
    expect(nowMark(nz, all, at(nz, '2027-02-14', '00:30'))).toMatchObject({ day: 4, id: 's4-1', state: 'next', left: 180 });
  });
  it('the eve’s flight out (Tokyo’s clock): lit on day 1; nothing outside the trip', () => {
    expect(nowMark(nz, all, instantIn('Asia/Tokyo', '2027-02-10', 19 * 60))).toMatchObject({ day: 1, id: 'r1-0', state: 'here' });
    expect(nowMark(nz, all, at(nz, '2026-11-04', '12:00'))).toBeNull();
  });
});
