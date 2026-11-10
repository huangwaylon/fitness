import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TRAILS, WPT_JA, hikeSlugOf, trailOf } from './trails.ts';
import { fmtDur, fmtParty, fmtPlanDate, fmtSeason, fmtTime, span } from './strings.ts';
import { prepare } from './track.ts';
import { parseTokens } from '#lib/travel/tokens.ts';
import type { TrackFile } from './types.ts';

const STATIC = join(import.meta.dirname, '../../../static/hiking');

describe('the trails', () => {
  it('are the ten, each in both languages, its stats the source\'s', () => {
    expect(TRAILS.map((t) => t.slug)).toEqual(['lake-22', 'snow-lake', 'lake-valhalla', 'talapus-lake', 'mount-pilchuck', 'bridal-veil', 'skyline-loop', 'enchantments', 'fuji-yoshida', 'kinpu-odarumi']);
    for (const t of TRAILS) for (const l of [t.name, t.area, t.summary, t.description, t.permit, ...t.tips]) expect(l.ja && l.en, t.slug).toBeTruthy();
    // AllTrails' miles and feet, converted once (the gain its DEM figure, not the GPX's)
    expect(trailOf('lake-22')).toMatchObject({ lengthKm: 9.8, gainM: 444, diff: 'moderate', route: 'out', tiles: 'us' });
    expect(trailOf('kinpu-odarumi')).toMatchObject({ lengthKm: 8.4, gainM: 510, tiles: 'jp' });
    expect(TRAILS.filter((t) => t.tiles === 'jp').map((t) => t.slug)).toEqual(['fuji-yoshida', 'kinpu-odarumi']);
  });
  it('each has its track and its photo in static/hiking/, the track a sane one', () => {
    for (const t of TRAILS) {
      expect(existsSync(join(STATIC, 'photos', `${t.slug}.webp`)), t.slug).toBe(true);
      const tr = JSON.parse(readFileSync(join(STATIC, 'tracks', `${t.slug}.json`), 'utf8')) as TrackFile;
      const p = prepare(tr);
      // its length within 15 % of AllTrails' (Fuji's GPX is the full round trip its figure says)
      expect(Math.abs(p.total / 1000 - t.lengthKm) / t.lengthKm, t.slug).toBeLessThan(0.15);
      expect(Math.hypot(tr.pts[0][1] - t.center.lat, tr.pts[0][0] - t.center.lon), t.slug).toBeLessThan(0.15);
      for (const w of tr.wpts) expect(WPT_JA[w.name], w.name).toBeTruthy();
    }
  });
  it("Kinpu's plan keeps its link, party and planner private (the `hiking` trip note's tokens)", () => {
    const plan = trailOf('kinpu-odarumi')!.plan!;
    for (const [v, key] of [[plan.url, 'kinpuPlanUrl'], [plan.party, 'kinpuParty'], [plan.by, 'kinpuPlanner']]) expect(parseTokens(v)).toEqual([{ t: 'p', key }]);
    expect(JSON.stringify(TRAILS)).not.toMatch(/yamap\.com|うめだ|Umeda/);
    expect(plan.itinerary).toHaveLength(11);
  });
  it('hikeSlugOf: the old trail-map links, either host, only our slugs', () => {
    expect(hikeSlugOf('https://huangwaylon.github.io/gpx/#/trail/lake-22')).toBe('lake-22');
    expect(hikeSlugOf('https://huangwaylon.github.io/hiking-trails/#/trail/enchantments')).toBe('enchantments');
    expect(hikeSlugOf('https://huangwaylon.github.io/gpx/#/trail/nowhere')).toBeNull();
    expect(hikeSlugOf(undefined)).toBeNull();
  });
});

describe('formats', () => {
  it("fmtTime: the source's times in each locale", () => {
    expect(fmtTime('3 h 17 min', 'ja')).toBe('3時間17分');
    expect(fmtTime('~3 h 30 min', 'ja')).toBe('約3時間30分');
    expect(fmtTime('10 – 13 h', 'ja')).toBe('10～13時間');
    expect(fmtTime('3 h 17 min', 'en')).toBe('3h 17m');
    expect(fmtTime('10 – 13 h', 'en')).toBe('10–13h');
  });
  it('fmtSeason, fmtDur, fmtPlanDate (its own weekday), span (past midnight), fmtParty', () => {
    expect(fmtSeason('Apr – Nov', 'ja')).toBe('4月～11月');
    expect(fmtSeason('Apr – Nov', 'en')).toBe('Apr – Nov');
    expect(fmtDur(120, 'ja')).toBe('2時間');
    expect(fmtDur(39, 'en')).toBe('39 min');
    expect(fmtDur(0, 'ja')).toBe('0分');
    expect(fmtPlanDate('2026-06-27', 'ja')).toBe('2026年6月27日(土)');
    expect(fmtPlanDate('2026-06-27', 'en')).toBe('Sat, Jun 27, 2026');
    expect(span('9:20', '11:20')).toBe(120);
    expect(span('23:30', '0:10')).toBe(40);
    expect(fmtParty('7', 'ja')).toBe('7人');
  });
});
