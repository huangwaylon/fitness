import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TRAILS, WPT_JA, hikeSlugOf, trailOf } from './trails.ts';
import { fmtDur, fmtParty, fmtSeason, fmtTime, span } from './strings.ts';
import { prepare } from './track.ts';
import { parseTokens } from '#lib/travel/tokens.ts';
import type { TrackFile } from './types.ts';

const STATIC = join(import.meta.dirname, '../../../static/hiking');

describe('the trails', () => {
  it('are the thirteen, each in both languages, its stats the source\'s', () => {
    expect(TRAILS.map((t) => t.slug)).toEqual(['lake-22', 'snow-lake', 'lake-valhalla', 'talapus-lake', 'mount-pilchuck', 'bridal-veil', 'skyline-loop', 'enchantments', 'fuji-yoshida', 'kinpu-odarumi', 'utsukushigahara', 'akagi-kurobi', 'akigawa-shiroyama']);
    for (const t of TRAILS) for (const l of [t.name, t.area, t.summary, t.description, t.permit, ...t.tips]) expect(l.ja && l.en, t.slug).toBeTruthy();
    // AllTrails' miles and feet, converted once (the gain its DEM figure, not the GPX's)
    expect(trailOf('lake-22')).toMatchObject({ lengthKm: 9.8, gainM: 444, diff: 'moderate', route: 'out', tiles: 'us' });
    expect(trailOf('kinpu-odarumi')).toMatchObject({ lengthKm: 8.4, gainM: 510, tiles: 'jp' });
    // YAMAP's activities as their pages show them (距離, のぼり / くだり, タイム, 標準タイム, コース定数)
    expect(trailOf('akagi-kurobi')).toMatchObject({ lengthKm: 5.3, gainM: 568, time: '5 h 1 min', route: 'loop', walked: { dateISO: '2026-11-07', downM: 569, standard: '3:37', constant: 13 } });
    expect(trailOf('utsukushigahara')).toMatchObject({ lengthKm: 13.3, gainM: 372, time: '6 h 1 min', route: 'out', walked: { dateISO: '2026-08-09', downM: 373, standard: '4:48', constant: 15 } });
    // YAMAP's plan as its page shows it (距離, のぼり, タイム 4:29 less its hour's rest, コース定数, ペース 標準 100 %)
    expect(trailOf('akigawa-shiroyama')).toMatchObject({ lengthKm: 9.3, gainM: 440, time: '3 h 29 min', route: 'loop', diff: 'moderate', tiles: 'jp' });
    expect(trailOf('akigawa-shiroyama')!.plan).toMatchObject({ dateISO: '2026-11-21', distKm: 9.3, gainM: 440, constant: 13, pace: 100, totalTime: '4:29', sunrise: '6:24', sunset: '16:33' });
    expect(TRAILS.filter((t) => t.tiles === 'jp').map((t) => t.slug)).toEqual(['fuji-yoshida', 'kinpu-odarumi', 'utsukushigahara', 'akagi-kurobi', 'akigawa-shiroyama']);
  });
  it('each has its track and its photo in static/hiking/ (a credit for the ones not AllTrails\', the YAMAP three), the track a sane one', () => {
    for (const t of TRAILS) {
      expect(existsSync(join(STATIC, 'photos', `${t.slug}.webp`)), t.slug).toBe(true);
      expect(!!t.photo, t.slug).toBe(!!t.walked || t.slug === 'akigawa-shiroyama');
      const tr = JSON.parse(readFileSync(join(STATIC, 'tracks', `${t.slug}.json`), 'utf8')) as TrackFile;
      const p = prepare(tr);
      // its length within 15 % of AllTrails' (Fuji's GPX is the full round trip its figure says)
      expect(Math.abs(p.total / 1000 - t.lengthKm) / t.lengthKm, t.slug).toBeLessThan(0.15);
      expect(Math.hypot(tr.pts[0][1] - t.center.lat, tr.pts[0][0] - t.center.lon), t.slug).toBeLessThan(0.15);
      for (const w of tr.wpts) expect(WPT_JA[w.name], w.name).toBeTruthy();
    }
  });
  it("the YAMAP tracks: YAMAP's own length, a climb near its のぼり, the summits' heights, a loop closed", () => {
    const of = (slug: string) => prepare(JSON.parse(readFileSync(join(STATIC, 'tracks', `${slug}.json`), 'utf8')) as TrackFile);
    const climb = (p: ReturnType<typeof of>) => p.pts.reduce((s, q, i) => s + (i ? Math.max(0, q[2] - p.pts[i - 1][2]) : 0), 0);
    // the activities' tracks measure 5,384 m and 13,375 m (their pages round the moving part: 5.3, 13.3 km)
    const akagi = of('akagi-kurobi'), utsu = of('utsukushigahara');
    expect(akagi.total).toBeCloseTo(5384, -1);
    expect(utsu.total).toBeCloseTo(13375, -2);
    // the smoothing (15 points, ~20 m apart) shaves a little off the climb: within 20 % of のぼり
    expect(Math.abs(climb(akagi) / 568 - 1)).toBeLessThan(0.2);
    expect(Math.abs(climb(utsu) / 372 - 1)).toBeLessThan(0.2);
    // 黒檜山 1,828 m over 大沼's 1,345 m; 王ヶ頭 2,034 m over the plateau's ~1,905 m
    expect([akagi.lo, akagi.hi]).toEqual([expect.closeTo(1341, -1), expect.closeTo(1821, -1)]);
    expect([utsu.lo, utsu.hi]).toEqual([expect.closeTo(1910, -1), expect.closeTo(2031, -1)]);
    expect([akagi.closed, utsu.closed]).toEqual([true, true]);
    expect(akagi.wpts.map((w) => WPT_JA[w.name])).toEqual(['黒檜山（赤城山）', '駒ヶ岳']);
    expect(utsu.wpts.map((w) => WPT_JA[w.name])).toEqual(['王ヶ鼻', '美ヶ原（王ヶ頭）', '牛伏山']);
    // the plan's legs: 9,373 m (its page: 9.3 km), from the station (~189 m) over 戸倉城山 (434 m: the smoothing
    // shaves the short summit to ~422) and back to the station; the river's small ups and downs smoothed away, so no
    // check against のぼり
    const aki = of('akigawa-shiroyama');
    expect(aki.total).toBeCloseTo(9373, -1);
    expect([aki.lo, aki.hi]).toEqual([expect.closeTo(183, -1), expect.closeTo(422, -1)]);
    expect(aki.closed).toBe(true);
    expect(aki.wpts.map((w) => WPT_JA[w.name])).toEqual(['城山（戸倉城山）']);
  });
  it("the YAMAP plans keep their links, parties and planners private (the `hiking` trip note's tokens)", () => {
    for (const [slug, pre, stops] of [['kinpu-odarumi', 'kinpu', 11], ['akigawa-shiroyama', 'akigawa', 7]] as const) {
      const plan = trailOf(slug)!.plan!;
      for (const [v, key] of [[plan.url, `${pre}PlanUrl`], [plan.party, `${pre}Party`], [plan.by, `${pre}Planner`]]) expect(parseTokens(v), slug).toEqual([{ t: 'p', key }]);
      expect(plan.itinerary, slug).toHaveLength(stops);
      // a stop's leg after the one before (a rest's departure counted)
      for (let i = 1; i < plan.itinerary.length; i++) expect(span(plan.itinerary[i - 1].depart ?? plan.itinerary[i - 1].time, plan.itinerary[i].time), slug).toBeGreaterThan(0);
    }
    // no plan link or code, no one's name
    expect(JSON.stringify(TRAILS)).not.toMatch(/yamap\.com|plans\/code|うめだ|Umeda/);
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
    // a single time: to 5 min, 約 (one precision on every card); a range as written
    expect(fmtTime('3 h 17 min', 'ja')).toBe('約3時間15分');
    expect(fmtTime('~3 h 30 min', 'ja')).toBe('約3時間30分');
    expect(fmtTime('6 h 1 min', 'ja')).toBe('約6時間');
    expect(fmtTime('1 h 58 min', 'ja')).toBe('約2時間');
    expect(fmtTime('10 – 13 h', 'ja')).toBe('10〜13時間');
    expect(fmtTime('3 h 17 min', 'en')).toBe('~3h 15m');
    expect(fmtTime('10 – 13 h', 'en')).toBe('10–13h');
  });
  it('fmtSeason, fmtDur, span (past midnight), fmtParty', () => {
    expect(fmtSeason('Apr – Nov', 'ja')).toBe('4月〜11月');
    expect(fmtSeason('Apr – Nov', 'en')).toBe('Apr – Nov');
    expect(fmtDur(120, 'ja')).toBe('2時間');
    expect(fmtDur(39, 'en')).toBe('39 min');
    expect(fmtDur(0, 'ja')).toBe('0分');
    expect(span('9:20', '11:20')).toBe(120);
    expect(span('23:30', '0:10')).toBe(40);
    expect(fmtParty('7', 'ja')).toBe('7人');
  });
});
