import { describe, expect, it } from 'vitest';
import { ROTATION, SEAM_GAP, VISITORS, VISITOR_LINES, dayVisitor, festivale, hoursOf, visitorAt, visitorLine } from './visitors.ts';
import { SPECIALS } from './visitorRoles.ts';
import { showerAt } from './meteor.ts';
import { eventAt } from './events.ts';
import { milestoneOn } from './wedding.ts';
import { addDays } from '#lib/time/dates.ts';
import type { EventNow } from './events.ts';
import { mulberry32 } from '#lib/random.ts';
import { has3d } from '../components/villager3d/manifest.ts';
import jaMain from '#lib/i18n/ja.json';
import enMain from '#lib/i18n/en.json';
import jaVisitors from '#lib/i18n/visitors.ja.json';
import enVisitors from '#lib/i18n/visitors.en.json';

// (the visitors' lines: their own catalog, i18n/visitors.ts)
const ja: Record<string, string> = { ...jaMain, ...jaVisitors }, en: Record<string, string> = { ...enMain, ...enVisitors };

const at = (date: string, hour: number, weekday: number, ev?: EventNow | null) =>
  ev === undefined ? visitorAt(date, addDays(date, -1), hour, weekday) : visitorAt(date, addDays(date, -1), hour, weekday, undefined, ev);

describe('visitors (NH)', () => {
  it('every visitor the schedule can bring is drawn as NH’s own 3D model (the user: only 3D models, else not at all), Reese with Cyrus', () => {
    // (each one's model on its spot, posed: visitor-life.spec, for one of each kind)
    expect([...VISITORS, 'cyrus'].filter((id) => !has3d(id))).toEqual([]);
  });
  it('Jack on Halloween night, 17:00 to midnight, before anyone else (on a Saturday Halloween, K.K.’s show, too)', () => {
    expect(at('2026-10-31', 16, 6)).not.toBe('jack'); // 16:59
    expect(at('2026-10-31', 17, 6)).toBe('jack'); // 17:00
    expect(at('2026-10-31', 18, 6)).toBe('jack'); // K.K.'s hour, but Halloween
    expect(at('2026-10-31', 23, 6)).toBe('jack'); // 23:59
    expect(visitorAt('2026-11-01', '2026-10-31', 0, 0)).not.toBe('jack'); // 00:00 Nov 1
    expect(at('2027-10-31', 20, 0)).toBe('jack');
    expect(at('2026-11-04', 20, 3, { id: 'halloween', night: true })).toBe('jack'); // forced (?event=halloween)
    expect(at('2026-10-24', 17, 6)).not.toBe('jack');
  });
  it('K.K. is no visitor (he lives on his stool): Saturday evening is his show, nobody else then; Daisy Mae on Sunday mornings', () => {
    expect(VISITORS).not.toContain('kk-slider');
    expect(at('2026-10-24', 18, 6)).toBeNull();
    expect(at('2026-10-24', 23, 6)).toBeNull();
    // (the day's visitor before it: one of the rotation, if any, on the Saturday's own draw)
    expect(at('2026-10-24', 17, 6)).toBe(dayVisitor('2026-10-24'));
    expect(at('2026-11-01', 5, 0)).toBe('daisy-mae');
    expect(at('2026-11-01', 11, 0)).toBe('daisy-mae');
    expect(at('2026-11-01', 12, 0)).not.toBe('daisy-mae');
  });
  it('one visitor a day Monday to Saturday (the user, 2026-11-25): each of the rotation once in a cycle, the same one a week apart at least, Wisp never on a Saturday', () => {
    const n = ROTATION.length;
    expect(ROTATION).toEqual(expect.arrayContaining([...SPECIALS, 'gulliver', 'wisp', 'redd']));
    for (const seed of [undefined, 'another-island', 'x']) {
      const seq: string[] = [];
      for (let d = 0; d < 7 * 120; d++) {
        const date = addDays('2026-01-05', d), wd = (d + 1) % 7; // 2026-01-05 is a Monday
        const v = dayVisitor(date, seed);
        if (wd === 0) {
          expect(v).toBeNull(); // Sunday: Daisy Mae's
          continue;
        }
        expect(v).not.toBeNull();
        if (wd === 6) expect(v, date).not.toBe('wisp');
        const was = seq.lastIndexOf(v!);
        if (was >= 0) expect(seq.length - was, `${date} ${v}`).toBeGreaterThan(SEAM_GAP);
        seq.push(v!);
      }
      for (let c = 0; (c + 1) * n <= seq.length; c++) expect([...seq.slice(c * n, (c + 1) * n)].sort(), `cycle ${c}`).toEqual([...ROTATION].sort());
    }
    // the same on every phone (the date and the seed alone), another island another order, a past date too
    const days = Array.from({ length: 60 }, (_, i) => addDays('2026-03-02', i));
    expect(days.map((d) => dayVisitor(d))).toEqual(days.map((d) => dayVisitor(d)));
    expect(days.map((d) => dayVisitor(d, 'another-island'))).not.toEqual(days.map((d) => dayVisitor(d)));
    expect(ROTATION).toContain(dayVisitor('2025-12-31'));
  });
  it('never more than one visitor at any hour of a year, on any seed (one slot: the day’s in its hours, Daisy Mae, or an event’s instead)', () => {
    for (const seed of [undefined, 'another-island', 'x', 'y']) {
      for (let d = 0; d < 365; d++) {
        const date = addDays('2026-01-01', d), prev = addDays(date, -1), wd = (d + 4) % 7; // 2026-01-01 is a Thursday
        const day = dayVisitor(date, seed), before = dayVisitor(prev, seed);
        for (let h = 0; h < 24; h++) {
          const v = visitorAt(date, prev, h, wd, seed, eventAt(date, h), showerAt(date, prev, h, seed));
          if (!v) continue;
          const ev = !!eventAt(date, h)?.night || showerAt(date, prev, h, seed) || milestoneOn(date) !== null || festivale(date);
          if (ev) continue;
          if (wd === 0) expect(v).toBe('daisy-mae');
          else if (h < 4) expect([v, h + 24 < hoursOf(v)[1]]).toEqual([before, true]); // Wisp's night, past midnight
          else expect([v, h >= hoursOf(v)[0] && h < hoursOf(v)[1]], `${date} ${h}`).toEqual([day, true]);
          if (wd === 6) expect(h).toBeLessThan(18); // K.K.'s show
        }
      }
    }
    // their hours: Gulliver and the beach ones by day, Wisp by night (past midnight), the plaza's 06:00 to 22:00
    expect([hoursOf('gulliver'), hoursOf('wendell'), hoursOf('gullivarrr'), hoursOf('wisp'), hoursOf('gracie'), hoursOf('redd')])
      .toEqual([[6, 18], [6, 18], [6, 18], [20, 28], [6, 22], [6, 22]]);
  });
  it('the week of Nov 2 2026 has its visitors (the gap that had none from Mon 04:00 to Thu 06:00)', () => {
    const week = ['2026-11-02', '2026-11-03', '2026-11-04'].map((d, i) => [6, 12, 21].map((h) => at(d, h, i + 1)));
    expect(week.filter((hours) => hours.some(Boolean)).length).toBeGreaterThanOrEqual(2);
  });
  it('each has an introduction and their own lines in both languages; never the same line twice in a row', () => {
    for (const id of VISITORS) {
      for (const c of [ja, en] as Record<string, string>[]) {
        expect(c[`visitor.${id}`], id).toBeTruthy();
        expect(c[`chat.sp.${id}.intro`].split('\n').length, id).toBeGreaterThanOrEqual(3); // two pages or more
        if (id === 'jack') for (const k of ['ask', 'thanks', 'trick', 'give', 'none']) expect(c[`chat.sp.jack.${k}`] ?? c[`visitor.jack.${k}`], k).toBeTruthy();
        for (let i = 0; i < VISITOR_LINES; i++) expect(c[`chat.sp.${id}.${i}`], `${id} ${i}`).toBeTruthy();
      }
      let last: string | undefined;
      const r = mulberry32(4);
      for (let i = 0; i < 50; i++) {
        const k = visitorLine(id, r, last);
        expect(k).not.toBe(last);
        last = k;
      }
    }
    // K.K. (kkSlider.ts): the show's greeting asks for a request, by day too, woken at night too; his sign-offs; tuning
    // when he has no songs yet (asleep a mumble)
    for (const k of ['hello', 'dayHello', 'wake', 'which', 'tuning', 'playing', 'bye', 'byeDay', 'byeNight', 'asleep']) for (const c of [ja, en] as Record<string, string>[]) expect(c[`chat.sp.kk-slider.${k}`], k).toBeTruthy();
    for (const k of ['hello', 'wake']) expect((ja as Record<string, string>)[`chat.sp.kk-slider.${k}`]).toContain('リクエスト');
  });
  it('Pavé dances on Festivale (the Monday 48 days before Easter), all day', () => {
    // Easter 2027: March 28 → Festivale February 8 (a Monday)
    expect(festivale('2027-02-08')).toBe(true);
    expect(at('2027-02-08', 10, 1)).toBe('pave');
    expect(at('2027-02-08', 22, 1)).not.toBe('pave');
    expect(festivale('2027-02-09')).toBe(false);
  });
});
