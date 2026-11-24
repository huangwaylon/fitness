import { describe, expect, it } from 'vitest';
import type { HikeView } from '#lib/contract/hike.ts';
import { fitTrack, type TrackFile } from '#lib/contract/hikeTrack.ts';
import { diffOf, gainOf, gpxGain, guideTime, hikeTrail, routeOf, userIdOf, userSlug } from './user.ts';
import { fmtTime } from './strings.ts';

// invented hikes and tracks only
const view = (o: Partial<HikeView> = {}): HikeView => ({ id: 'habc1234', at: 1, who: 'A', name: '練習の山', area: '', status: 'done', src: 'manual', ...o });
/** A line north from (lat, lon), `n` points ~111 m apart, climbing `up` m each. */
const line = (n: number, lat = 35.6, lon = 139.2, up = 10): TrackFile['pts'] => Array.from({ length: n }, (_, i) => [lon, lat + i * 0.001, 500 + i * up]);
const trk = (pts: TrackFile['pts'], len = 2000): TrackFile => ({ v: 1, len, pts, wpts: [] });

describe('slugs', () => {
  it('u-<id>, and back', () => {
    expect(userSlug('habc1234')).toBe('u-habc1234');
    expect(userIdOf('u-habc1234')).toBe('habc1234');
    expect(userIdOf('lake-22')).toBeNull();
    expect(userIdOf(null)).toBeNull();
  });
});

describe('guideTime', () => {
  it("'h:mm' in the guide's form, which fmtTime reads", () => {
    expect(guideTime('3:17')).toBe('3 h 17 min');
    expect(guideTime('5:00')).toBe('5 h');
    expect(guideTime('0:45')).toBe('45 min');
    expect(guideTime(undefined)).toBe('');
    expect(guideTime('bad')).toBe('');
    expect(fmtTime(guideTime('3:17'), 'ja')).toBe('約3時間15分');
  });
});

describe('the figures from a track', () => {
  it('the climb is the rises summed; the level from effort km', () => {
    expect(gainOf(trk([[0, 0, 100], [0, 0, 150], [0, 0, 120], [0, 0, 200]]))).toBe(130);
    expect(diffOf(5, 300)).toBe('easy');
    expect(diffOf(8, 700)).toBe('moderate');
    expect(diffOf(12, 1500)).toBe('hard');
    expect(diffOf(20, 2000)).toBe('veryhard');
  });
  it("a GPX's climb over its raw points, not the thinned track's (a hill on a straight line: thinned to its ends)", () => {
    const raw = Array.from({ length: 300 }, (_, i) => ({ lat: 35.6 + i * 0.0001, lon: 139.2, ele: 100 + 200 * Math.sin((Math.PI * i) / 299) }));
    const t = fitTrack(raw, [])!;
    expect(gainOf(t)).toBeLessThan(150);
    expect(gpxGain(raw)).toBeGreaterThan(190);
    expect(gpxGain(raw)).toBeLessThanOrEqual(200);
  });
  it('the route: ends apart one way, ends together a loop or out and back', () => {
    expect(routeOf(trk(line(20)))).toBe('p2p');
    const there = line(10);
    expect(routeOf(trk([...there, ...there.slice(0, -1).reverse()]))).toBe('out');
    const sq: TrackFile['pts'] = [[139, 35, 0], [139, 35.005, 0], [139.006, 35.005, 0], [139.006, 35, 0], [139.003, 35, 0], [139, 35, 0]];
    expect(routeOf(trk(sq))).toBe('loop');
  });
});

describe('hikeTrail', () => {
  it("a hike's own figures, the text as both languages, its own fields in `user`", () => {
    const t = hikeTrail(view({ km: 7.3, gainM: 620, time: '4:05', diff: 'hard', date: '2026-10-01', notes: 'メモ', area: '東京都' }), null);
    expect(t).toMatchObject({ slug: 'u-habc1234', name: { ja: '練習の山', en: '練習の山' }, area: { ja: '東京都', en: '東京都' }, lengthKm: 7.3, gainM: 620, diff: 'hard', time: '4 h 5 min', tips: [] });
    expect(t.user).toEqual({ id: 'habc1234', status: 'done', src: 'manual', who: 'A', date: '2026-10-01', notes: 'メモ', track: false });
    // no track: Tokyo, GSI's map
    expect(t.tiles).toBe('jp');
    expect(t.center.lat).toBeCloseTo(35.68, 1);
  });
  it('what it lacks from its track: length, gain, level, centre, region', () => {
    const t = hikeTrail(view(), trk(line(21, 47.5, -121.5), 2340));
    expect(t.lengthKm).toBe(2.3);
    expect(t.gainM).toBe(200);
    expect(t.diff).toBe('easy');
    expect(t.route).toBe('p2p');
    expect(t.tiles).toBe('us');
    expect(t.center.lat).toBeCloseTo(47.51, 2);
    expect(t.user!.track).toBe(true);
    expect(hikeTrail(view(), trk(line(5))).tiles).toBe('jp');
  });
  it('no figures at all: zeros, no time, the easiest level', () => {
    expect(hikeTrail(view(), null)).toMatchObject({ lengthKm: 0, gainM: 0, time: '', diff: 'easy' });
  });
});
