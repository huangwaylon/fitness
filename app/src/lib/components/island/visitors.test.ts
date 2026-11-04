import { describe, expect, it } from 'vitest';
import { ROTATION, VISITORS, VISITOR_LINES, dayVisitor, visitorAt, visitorLine } from './visitors.ts';
import { showerAt } from './meteor.ts';
import { eventAt } from './events.ts';
import { milestoneOn } from './wedding.ts';
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
  it('a visitor most days (NH): Monday to Saturday one of the rotation, each at most once a week, seeded by the week', () => {
    let days = 0, visited = 0;
    const seen = new Map<string, number>();
    for (let d = 0; d < 7 * 60; d++) {
      const date = addDays('2026-01-05', d), wd = (d + 1) % 7; // 2026-01-05 is a Monday
      if (wd === 1) seen.clear();
      const v = dayVisitor(date, wd);
      expect(dayVisitor(date, wd)).toBe(v); // the same on every phone
      if (wd === 0) expect(v).toBeNull(); // Sunday: Daisy Mae's
      if (!v) continue;
      expect(ROTATION).toContain(v);
      seen.set(v, (seen.get(v) ?? 0) + 1);
      expect(seen.get(v), `${date} ${v}`).toBe(1);
    }
    // somebody comes on most days, an ordinary one (no event, shower or wedding) at its hour
    for (let d = 0; d < 7 * 60; d++) {
      const date = addDays('2026-01-05', d), wd = (d + 1) % 7, prev = addDays(date, -1);
      if (eventAt(date, 12) || eventAt(date, 21) || milestoneOn(date) !== null || showerAt(date, prev, 21)) continue;
      days++;
      if ([7, 12, 21].some((h) => visitorAt(date, prev, h, wd) !== null)) visited++;
    }
    expect(visited / days).toBeGreaterThan(0.85);
    // their hours: Gulliver by day, Wisp by night (past midnight too), the plaza's 06:00 to 22:00
    for (let d = 0; d < 7 * 60; d++) {
      const date = addDays('2026-01-05', d), wd = (d + 1) % 7, next = addDays(date, 1), prev = addDays(date, -1);
      if (wd === 0 || wd === 6 || eventAt(date, 12) || eventAt(next, 2) || eventAt(date, 21) || milestoneOn(date) !== null || milestoneOn(next) !== null || showerAt(date, prev, 21) || showerAt(next, date, 2)) continue;
      const v = dayVisitor(date, wd);
      if (v === 'wisp') {
        expect(at(date, 12, wd)).toBeNull();
        expect(at(date, 21, wd)).toBe('wisp');
        expect(visitorAt(next, date, 2, (wd + 1) % 7)).toBe('wisp');
      } else if (v === 'gulliver') {
        expect(at(date, 6, wd)).toBe('gulliver');
        expect(at(date, 18, wd)).toBeNull();
      } else if (v) {
        expect(at(date, 6, wd)).toBe(v);
        expect(at(date, 21, wd)).toBe(v);
        expect(at(date, 22, wd)).toBeNull();
      }
      expect(at(date, 5, wd)).toBeNull(); // dawn: nobody
    }
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
    // K.K.'s show: his greeting asks for a request; his sign-off; tuning when he has no songs yet
    for (const k of ['hello', 'which', 'tuning', 'playing', 'bye']) for (const c of [ja, en] as Record<string, string>[]) expect(c[`chat.sp.kk-slider.${k}`], k).toBeTruthy();
    expect((ja as Record<string, string>)['chat.sp.kk-slider.hello']).toContain('リクエスト');
  });
});
