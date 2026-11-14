import { afterEach, describe, expect, it, vi } from 'vitest';
import { rangeFor } from '#lib/model/health.ts';
import { i18n, setLocale } from '#lib/i18n/index.ts';
import '#lib/i18n/kenkou.ts';
import { rangeLabel, spokenRange, xLabels } from './fmt.ts';

// 2026-11-14 is a Saturday; the plot ~285 pt wide (a 390-pt screen)
const TODAY = '2026-11-14';
const W = 285;

afterEach(() => setLocale('ja'));

describe('xLabels: the dates and weekdays under the axis', () => {
  it('1週: a weekday under every bar, the dates at their own cadence, today marked', () => {
    const l = xLabels(rangeFor('week', TODAY), W, TODAY);
    expect(l.map((x) => x.i)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(l.map((x) => x.wd)).toEqual(['日', '月', '火', '水', '木', '金', '土']);
    expect(l.map((x) => x.text)).toEqual(['11/8', '', '11/10', '', '11/12', '', '11/14']);
    expect(l.map((x) => x.dow)).toEqual([7, undefined, undefined, undefined, undefined, undefined, 6]);
    expect(l.filter((x) => x.now).map((x) => x.i)).toEqual([6]);
  });
  it('1週 at 320 pt (~215 wide): still every weekday', () => {
    expect(xLabels(rangeFor('week', TODAY), 215, TODAY).filter((x) => x.wd)).toHaveLength(7);
  });
  it('1か月: a step of whole weeks from the newest, every label on today’s weekday', () => {
    const l = xLabels(rangeFor('month', TODAY), W, TODAY);
    expect(l.map((x) => x.i)).toEqual([1, 8, 15, 22, 29]);
    expect(l.map((x) => x.text)).toEqual(['10/17', '10/24', '10/31', '11/7', '11/14']);
    expect(new Set(l.map((x) => x.wd))).toEqual(new Set(['土']));
    expect(l.every((x) => x.dow === 6)).toBe(true);
    // a Friday: 金, no weekend
    const f = xLabels(rangeFor('month', '2026-11-13'), W, '2026-11-13');
    expect(new Set(f.map((x) => x.wd))).toEqual(new Set(['金']));
    expect(f.some((x) => x.dow)).toBe(false);
    expect(f.at(-1)!.now).toBe(true);
  });
  it('3か月 / 1年: no weekdays', () => {
    for (const p of ['quarter', 'year'] as const) {
      const l = xLabels(rangeFor(p, TODAY), W, TODAY);
      expect(l.length).toBeGreaterThan(1);
      expect(l.some((x) => x.wd !== undefined || x.dow !== undefined || x.now)).toBe(false);
    }
  });
  it('en: Sat, Sun', async () => {
    setLocale('en');
    await vi.waitUntil(() => i18n.locale === 'en');
    const l = xLabels(rangeFor('week', TODAY), W, TODAY);
    expect([l[0].wd, l[6].wd]).toEqual(['Sun', 'Sat']);
  });
});

describe('spokenRange: the chart’s range in words', () => {
  it('days with their weekdays (ja, en); weeks and months as shown', async () => {
    expect(spokenRange(rangeFor('week', '2026-11-13'), '2026-11-13')).toBe('11月7日(土)〜11月13日(金)');
    expect(spokenRange(rangeFor('quarter', TODAY), TODAY)).toMatch(/^\d+\/\d+〜11\/\d+$/);
    expect(spokenRange(rangeFor('year', TODAY), TODAY)).toBe('2025年12月〜2026年11月');
    // the years as rangeLabel's: across a year, or not this year's
    const cross = { ...rangeFor('week', '2026-01-05'), from: '2025-12-30' };
    expect(spokenRange(cross, TODAY)).toBe('2025年12月30日(火)〜2026年1月5日(月)');
    expect(rangeLabel(cross, TODAY)).toBe('2025/12/30〜2026/1/5');
    expect(spokenRange(rangeFor('week', '2025-11-13'), TODAY)).toBe('2025年11月7日(金)〜11月13日(木)');
    setLocale('en');
    await vi.waitUntil(() => i18n.locale === 'en');
    expect(spokenRange(rangeFor('week', '2026-11-13'), '2026-11-13')).toBe('Sat, Nov 7 to Fri, Nov 13');
    expect(spokenRange(cross, TODAY)).toBe('Tue, Dec 30, 2025 to Mon, Jan 5, 2026');
  });
});
