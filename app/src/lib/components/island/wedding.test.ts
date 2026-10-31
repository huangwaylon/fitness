import { describe, expect, it } from 'vitest';
import { MILESTONES, WEDDING, archOn, coupleAt, daysUntil, milestoneDates, milestoneOn, weddingDay } from './wedding.ts';
import { visitorAt } from './visitors.ts';
import { eventAt } from './events.ts';
import { addDays } from '#lib/time/dates.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';

const weekday = (d: string) => new Date(`${d}T12:00:00Z`).getUTCDay();

describe('the wedding countdown', () => {
  it('our wedding is 2027-10-08; the milestones are 365, 200, 100, 50, 30, 7 and 1 days before, and the day', () => {
    expect(WEDDING).toBe('2027-10-08');
    expect(MILESTONES).toEqual([365, 200, 100, 50, 30, 7, 1, 0]);
    expect(milestoneDates()).toEqual(['2026-10-08', '2027-03-22', '2027-06-30', '2027-08-19', '2027-09-08', '2027-10-01', '2027-10-07', '2027-10-08']);
    expect(daysUntil('2026-10-31')).toBe(342);
  });
  it('the edges: a milestone day and not the days around it; nothing after the wedding', () => {
    for (const d of milestoneDates()) {
      expect(milestoneOn(d)).toBe(daysUntil(d));
      if (d !== '2027-10-08') expect(milestoneOn(addDays(d, -1))).toBeNull();
      if (d !== '2027-10-08' && d !== '2027-10-07') expect(milestoneOn(addDays(d, 1))).toBeNull();
    }
    expect(milestoneOn('2027-10-09')).toBeNull();
    expect(weddingDay('2027-10-08')).toBe(true);
    expect(weddingDay('2027-10-07')).toBe(false);
  });
  it('Reese and Cyrus come on a milestone day from 06:00 to midnight, as the visitor (no holiday falls on one)', () => {
    expect(coupleAt('2027-06-30', 5)).toBe(false); // 05:59
    expect(coupleAt('2027-06-30', 6)).toBe(true);
    expect(coupleAt('2027-06-30', 23)).toBe(true);
    expect(coupleAt('2027-07-01', 0)).toBe(false);
    for (const d of milestoneDates()) {
      expect(eventAt(d, 12)?.night ?? false).toBe(false);
      expect(visitorAt(d, addDays(d, -1), 12, weekday(d))).toBe('reese');
      expect(visitorAt(d, addDays(d, -1), 21, weekday(d))).toBe('reese');
    }
    expect(visitorAt('2027-06-29', '2027-06-28', 12, 2)).not.toBe('reese');
  });
  it('the arch stands on every June Sunday (NH’s Wedding Season), every year', () => {
    expect(['2027-06-06', '2027-06-13', '2027-06-20', '2027-06-27'].every((d) => archOn(d, weekday(d)))).toBe(true);
    expect(archOn('2027-06-26', 6)).toBe(false); // a Saturday
    expect(archOn('2027-07-04', 0)).toBe(false); // a July Sunday
    expect(archOn('2027-05-30', 0)).toBe(false);
    expect(archOn('2028-06-04', weekday('2028-06-04'))).toBe(true);
  });
  it('their names and lines in both languages; the count names the days', () => {
    for (const cat of [ja, en] as Record<string, string>[]) {
      for (const k of ['visitor.reese', 'visitor.cyrus', 'chat.sp.reese.intro', 'chat.sp.reese.day']) expect(cat[k], k).toBeTruthy();
      expect(cat['chat.sp.reese.count']).toContain('{n}');
      for (const i of [0, 1, 2, 3]) expect(cat[`chat.sp.reese.${i}`]).toBeTruthy(), expect(cat[`chat.sp.cyrus.${i}`]).toBeTruthy();
    }
    expect((ja as Record<string, string>)['chat.sp.reese.count'].replace('{n}', '100')).toBe('けっこんしき まで あと 100日！');
    expect([(ja as Record<string, string>)['visitor.reese'], (ja as Record<string, string>)['visitor.cyrus']]).toEqual(['リサ', 'カイゾー']);
  });
});
