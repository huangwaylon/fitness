import { describe, expect, it, vi } from 'vitest';
import { lastSyncLine, monthLabel, SYNC_LATE_MS, weekdayOf } from './format.ts';
import { i18n, setLocale } from './index.ts';

// Tokyo is UTC+9: 2026-10-31T06:24Z = 15:24 JST on 10/31.
const now = new Date('2026-10-31T06:24:00Z');

describe('lastSyncLine (the tree popup)', () => {
  it('today: the time; yesterday: きのう and the time; older: the date; never: まだ', () => {
    expect(lastSyncLine('2026-10-31T05:10:00Z', now)).toEqual({ text: '14:10 に とどいた', late: false });
    expect(lastSyncLine('2026-10-30T12:10:00Z', now)).toEqual({ text: 'きのう 21:10', late: true });
    expect(lastSyncLine('2026-10-28T23:00:00Z', now)).toEqual({ text: '10/29', late: true });
    expect(lastSyncLine(null, now)).toEqual({ text: 'まだ とどいていません', late: true });
  });
  it('is late once the data is older than SYNC_LATE_MS', () => {
    expect(lastSyncLine(new Date(now.getTime() - SYNC_LATE_MS).toISOString(), now).late).toBe(false);
    expect(lastSyncLine(new Date(now.getTime() - SYNC_LATE_MS - 60_000).toISOString(), now).late).toBe(true);
  });
});

describe('monthLabel (one spelling: health, 記録, けっこんしき)', () => {
  it('ja: 2027年3月, 3月; en: Mar 2027, Mar, a heading March 2027', async () => {
    setLocale('ja');
    expect([monthLabel('2027-03-14'), monthLabel('2027-03', { year: false }), monthLabel('2027-03', { long: true })]).toEqual(['2027年3月', '3月', '2027年3月']);
    setLocale('en');
    await vi.waitUntil(() => i18n.locale === 'en');
    expect([monthLabel('2027-03-14'), monthLabel('2027-09', { year: false }), monthLabel('2027-03', { long: true })]).toEqual(['Mar 2027', 'Sep', 'March 2027']);
    expect(weekdayOf('2026-11-09', 'ja')).toBe('月');
    setLocale('ja');
  });
});
