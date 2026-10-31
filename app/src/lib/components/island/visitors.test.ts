import { describe, expect, it } from 'vitest';
import { VISITORS, VISITOR_LINES, VISIT_ODDS, visitorAt, visitorLine } from './visitors.ts';
import { addDays } from '#lib/time/dates.ts';
import type { EventNow } from './events.ts';
import { mulberry32 } from '#lib/random.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';

const at = (date: string, hour: number, weekday: number, ev?: EventNow | null) =>
  ev === undefined ? visitorAt(date, addDays(date, -1), hour, weekday) : visitorAt(date, addDays(date, -1), hour, weekday, undefined, ev);

describe('visitors (NH)', () => {
  it('Jack on Halloween night, 17:00 to midnight, before anyone else (K.K. on a Saturday Halloween too)', () => {
    expect(at('2026-10-31', 16, 6)).not.toBe('jack'); // 16:59
    expect(at('2026-10-31', 17, 6)).toBe('jack'); // 17:00
    expect(at('2026-10-31', 18, 6)).toBe('jack'); // K.K.'s hour, but Halloween
    expect(at('2026-10-31', 23, 6)).toBe('jack'); // 23:59
    expect(visitorAt('2026-11-01', '2026-10-31', 0, 0)).not.toBe('jack'); // 00:00 Nov 1
    expect(at('2027-10-31', 20, 0)).toBe('jack');
    expect(at('2026-11-04', 20, 3, { id: 'halloween', night: true })).toBe('jack'); // forced (?event=halloween)
    expect(at('2026-10-24', 17, 6)).not.toBe('jack');
  });
  it('K.K. on Saturday nights, Daisy Mae on Sunday mornings', () => {
    expect(at('2026-10-24', 18, 6)).toBe('kk-slider');
    expect(at('2026-10-24', 23, 6)).toBe('kk-slider');
    expect(at('2026-10-24', 17, 6)).not.toBe('kk-slider');
    expect(at('2026-11-01', 5, 0)).toBe('daisy-mae');
    expect(at('2026-11-01', 11, 0)).toBe('daisy-mae');
    expect(at('2026-11-01', 12, 0)).not.toBe('daisy-mae');
  });
  it('Wisp on some nights (past midnight too), Gulliver on some days; both about 1 in 4, seeded by the date', () => {
    let wisp = 0, gulliver = 0;
    for (let d = 0; d < 400; d++) {
      const date = addDays('2026-01-05', d);
      const wd = (d + 1) % 7; // 2026-01-05 is a Monday
      if (wd === 6 || wd === 0) continue;
      const night = at(date, 22, wd), dawn = visitorAt(addDays(date, 1), date, 2, (wd + 1) % 7);
      expect(dawn).toBe(night); // the same night across midnight
      if (night === 'wisp') wisp++;
      const day = at(date, 12, wd);
      expect([null, 'gulliver']).toContain(day);
      if (day) gulliver++;
      expect(at(date, 19, wd)).toBeNull(); // dusk: nobody
    }
    expect(wisp / 286).toBeGreaterThan(VISIT_ODDS - 0.08), expect(wisp / 286).toBeLessThan(VISIT_ODDS + 0.08);
    expect(gulliver / 286).toBeGreaterThan(VISIT_ODDS - 0.08), expect(gulliver / 286).toBeLessThan(VISIT_ODDS + 0.08);
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
    expect((ja as Record<string, string>)['chat.sp.kk-slider.song']).toContain('♪');
  });
});
