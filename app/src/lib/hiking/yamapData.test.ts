// The vendored YAMAP envelopes (scripts/data/yamap/<slug>.json, lib/hiking/yamapData.ts), hermetic: each rebuilds
// its shipped track byte-for-byte (envelope → GPX → toTrack === static/hiking/tracks/<slug>.json), nothing banned
// is in one (the identity and the clock: BANNED_KEYS / BANNED_STRING), and the trim of a dirty answer keeps the
// whitelist only. No network: CI reads the committed files.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toTrack } from '../contract/hikeTrack.ts';
import { activityGpx, findBanned, parseYamapEnv, planGpx, trimActivity, trimPlan, VENDORED, type YamapEnv } from './yamapData.ts';
import { trailOf } from './trails.ts';

const app = join(import.meta.dirname, '../../..');
const read = (slug: string): YamapEnv => {
  const env = parseYamapEnv(JSON.parse(readFileSync(join(app, 'scripts/data/yamap', `${slug}.json`), 'utf8')));
  if (!env) throw new Error(`${slug}: not a vendored envelope`);
  return env;
};

describe('the vendored envelopes', () => {
  for (const [slug, kind] of Object.entries(VENDORED)) {
    it(`${slug} rebuilds its shipped track`, () => {
      const env = read(slug);
      expect(env.kind).toBe(kind);
      const gpx = env.kind === 'activity' ? activityGpx(env) : planGpx(env);
      const shipped = JSON.parse(readFileSync(join(app, 'static/hiking/tracks', `${slug}.json`), 'utf8'));
      expect(JSON.parse(JSON.stringify(toTrack(gpx)))).toEqual(shipped);
    });

    it(`${slug} carries nothing banned`, () => {
      expect(findBanned(JSON.parse(readFileSync(join(app, 'scripts/data/yamap', `${slug}.json`), 'utf8')))).toBeNull();
    });

    it(`${slug} matches its trail's day`, () => {
      const env = read(slug);
      if (env.kind === 'activity') expect(env.meta.date).toBe(trailOf(slug)!.walked?.dateISO);
    });
  }
});

describe('trimActivity', () => {
  const dirty = {
    activity: {
      id: 99999999,
      title: 'テスト山',
      start_at: 1_780_000_000,
      time_zone: 9,
      duration: 7200,
      distance: 8200.5,
      cumulative_up: 640,
      cumulative_down: 641,
      course_constant: 12,
      map: { prefectures: [{ full_name: '長野県' }, { full_name: '長野県' }, { full_name: '群馬県' }] },
      members: [{ name: 'Hanako Secret', gender: 'F', birth_year: 1990 }],
      photos: [{ url: 'https://example.com/secret.jpg' }],
      text: 'a secret diary text',
      checkpoints: [
        { landmark: { name: 'Summit One', name_en: 'Summit One', name_ja: '一山', coord: [138.5, 36.1], is_summit: true, arrived_at: 1_780_001_000 } },
        { landmark: { name: 'P Parking', name_en: 'P Parking', coord: [138.4, 36.0], is_summit: false } }
      ]
    }
  };
  const tracks = {
    tracks: [
      { point: { coord: [138.4, 36.0], corrected_altitude: 1000.5, altitude: 990, time: 1_780_000_100 } },
      { point: { coord: [138.5, 36.1], corrected_altitude: null, altitude: 1200 } }
    ]
  };

  it('keeps the whitelist only', () => {
    const env = trimActivity(dirty, tracks, '2026-11-23')!;
    expect(env.kind).toBe('activity');
    expect(env.meta).toEqual({ title: 'テスト山', date: '2026-05-29', duration: 7200, distance: 8200.5, up: 640, down: 641, constant: 12, prefectures: ['長野県', '群馬県'] });
    expect(env.summits).toEqual([{ name: 'Summit One', nameJa: '一山', nameEn: 'Summit One', lat: 36.1, lon: 138.5 }]);
    expect(env.points).toEqual([
      [138.4, 36.0, 1000.5],
      [138.5, 36.1, 1200]
    ]);
    const s = JSON.stringify(env);
    for (const sentinel of ['Hanako', 'Secret', 'secret', '99999999', 'example.com', 'arrived_at', '1780000', 'Parking', 'birth', 'gender']) expect(s).not.toContain(sentinel);
    expect(findBanned(env)).toBeNull();
  });

  it('rejects answers not the API’s shape', () => {
    expect(trimActivity({}, tracks, '2026-11-23')).toBeNull();
    expect(trimActivity(dirty, {}, '2026-11-23')).toBeNull();
  });
});

describe('trimPlan', () => {
  const page = (plan: unknown) => `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { plan } } })}</script></html>`;
  const dirtyPlan = {
    id: 'a-secret-plan-id',
    shareUrl: 'https://yamap.com/plans/code/secret',
    party: ['Hanako Secret'],
    planner: { name: 'Planner Secret' },
    checkpoints: [
      { coords: [[139.0, 35.9], [139.01, 35.91]], altitudes: [500, 560], landmark: null },
      { coords: [[139.01, 35.91], [139.02, 35.92]], altitudes: [560, 723], landmark: { nameEn: 'Mt. Test', name: 'テスト山', coord: [139.02, 35.92], isSummit: true, note: 'a secret note' } }
    ]
  };

  it('keeps the legs and summits only', () => {
    const env = trimPlan(page(dirtyPlan), '2026-11-23');
    expect(env.kind).toBe('plan');
    expect(env.checkpoints).toHaveLength(2);
    expect(env.checkpoints[1].landmark).toEqual({ name: 'テスト山', nameEn: 'Mt. Test', coord: [139.02, 35.92], isSummit: true });
    const s = JSON.stringify(env);
    for (const sentinel of ['Hanako', 'Secret', 'secret', 'yamap.com', 'shareUrl', 'party', 'planner', 'note']) expect(s).not.toContain(sentinel);
    expect(findBanned(env)).toBeNull();
    const gpx = planGpx(env);
    expect(gpx).toContain('<name>Mt. Test</name>');
    // the seam point 139.01,35.91 once, not twice
    expect(gpx.match(/<trkpt\b/g)).toHaveLength(3);
  });

  it('throws on a page with no plan', () => {
    expect(() => trimPlan('<html></html>', '2026-11-23')).toThrow('__NEXT_DATA__');
  });
});
