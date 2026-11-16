// English Study's choices on this phone (prefs.ts): a skip lasts 14 days, the newest 50 kept.
import { describe, expect, it } from 'vitest';
import { addDays } from '#lib/time/dates.ts';
import { liveSkips, SKIP_DAYS, withSkip } from './prefs.ts';
import type { LocalDate } from '#lib/types.ts';

const d0 = '2026-11-16' as LocalDate;

describe('skips (別の動画にする)', () => {
  it('last SKIP_DAYS days, then today’s clip may be it again', () => {
    const all = withSkip({}, 'a', d0);
    expect(liveSkips(all, d0)).toEqual(new Set(['a']));
    expect(liveSkips(all, addDays(d0, SKIP_DAYS - 1))).toEqual(new Set(['a']));
    expect(liveSkips(all, addDays(d0, SKIP_DAYS))).toEqual(new Set());
  });
  it('drop the lapsed and keep the newest 50', () => {
    let all = withSkip({}, 'old', d0);
    all = withSkip(all, 'b', addDays(d0, SKIP_DAYS));
    expect(Object.keys(all)).toEqual(['b']);
    for (let i = 0; i < 60; i++) all = withSkip(all, `c${i}`, addDays(d0, SKIP_DAYS + 1));
    expect(Object.keys(all)).toHaveLength(50);
    expect(all.c59).toBeDefined();
  });
});
