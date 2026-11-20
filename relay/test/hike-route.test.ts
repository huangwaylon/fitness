// `POST /hiking` (src/hikeRoute.ts): auth (all three keys), CORS, the link (only yamap.com's), the day's cap, YAMAP's
// two URLs through a mocked fetch, each failure's status and code, the answer as the phone gets it, nothing of the
// link or the members in the log. Every answer here is invented (no real activity, person or place).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HIKE_FETCH_MS, HIKE_READ_MAX, hikeRoute, type HikeEnv, type HikeFetch } from '../src/hikeRoute.ts';
import { LogCore, type RelayEvent } from '../src/log.ts';
import { keyOwner } from '../src/auth.ts';
import { fitTrack, trackOf } from '../../app/src/lib/contract/hikeTrack.ts';
import { yamapImport } from '../../app/src/lib/contract/yamap.ts';
import { hikeTrkOf } from '../../app/src/lib/contract/hike.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a1'.repeat(32), KEY_B = 'b2'.repeat(32), KEY_C = 'c3'.repeat(32);
const keys = { KEY_A, KEY_B, KEY_C };
const T0 = Date.parse('2026-11-20T03:00:00.000Z');
const ORIGIN = 'https://island-fund.pages.dev';
const LINK = 'https://yamap.com/activities/123456';

/** An invented climb of `n` points (YAMAP's track answer). */
const tracks = (n: number) => ({ tracks: Array.from({ length: n }, (_, i) => ({ distance: i, point: { id: i, coord: [150 + i * 3e-5, 20 + Math.sin(i / 50) * 1e-3], altitude: 100 + i * 0.2, corrected_altitude: 100 + i * 0.2 + (i % 7), horizontal_accuracy: 4 } })) });
const ACTIVITY = {
  activity: {
    id: 123456, title: '架空山', start_at: 1_790_020_800, time_zone: 9, distance: 4321, cumulative_up: 300, cumulative_down: 290, course_constant: 12, duration: 7200,
    members: [{ id: 9, name: '仮名さん', gender: 'female', birth_year: 1991 }],
    map: { prefectures: [{ full_name: '架空県' }] },
    checkpoints: [{ landmark: { name: 'Mt. Kaku', name_ja: '架空山', coord: [150.003, 20.0005], is_summit: true } }]
  }
};
const jsonRes = (o: unknown, status = 200, h: Record<string, string> = {}) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...h } });

let now: number;
let logged: RelayEvent[];
let log: LogCore;
let answers: Record<string, () => Response | Promise<Response>>;
let fetched: { url: string; init: Parameters<HikeFetch>[1] }[];
const fetchMock: HikeFetch = async (url, init) => {
  fetched.push({ url, init });
  const a = answers[url];
  if (!a) throw new Error('unexpected fetch');
  return a();
};
const env = (o: Partial<HikeEnv> = {}): HikeEnv => ({ allowed: ORIGIN, roleOf: (k) => keyOwner(k, keys), spend: async (r) => log.spend(`hike:${r}`, 3), fetch: fetchMock, log: (evs) => logged.push(...evs), now: () => now, ...o });
const post = (body: unknown = { url: LINK }, key = KEY_A, h: Record<string, string> = {}) => new Request('https://relay/hiking', {
  method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { Origin: ORIGIN, 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, ...h }
});
const call = async (req: Request, e = env()) => {
  const r = await hikeRoute(req, e);
  return { status: r.status, body: (await r.json()) as Record<string, any>, r };
};

beforeEach(() => {
  now = T0;
  logged = [];
  fetched = [];
  const db = memSql();
  log = new LogCore({ sql: db.sql, tx: db.tx, keys, now: () => now });
  answers = {
    'https://api.yamap.com/v3/activities/123456': () => jsonRes(ACTIVITY),
    'https://api.yamap.com/v3/activities/123456/tracks': () => jsonRes(tracks(400))
  };
});

describe('POST /hiking', () => {
  it('reads an activity: the hike’s fields and its fitted track, for any of the three; nothing of the members, the link in no log', async () => {
    for (const key of [KEY_A, KEY_C]) {
      const { status, body, r } = await call(post(undefined, key));
      expect(status).toBe(200);
      expect(r.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
      expect(r.headers.get('Cache-Control')).toBe('no-store');
      expect(body.ok).toBe(true);
      expect(body.meta).toEqual({ name: '架空山', area: '架空県', status: 'done', date: '2026-09-22', src: 'yamap', ref: 'a123456', km: 4.3, gainM: 300, downM: 290, diff: 'moderate', time: '2:00' });
      expect(body.track.wpts).toEqual([{ lon: 150.003, lat: 20.0005, name: '架空山' }]);
      // what the phone sends as its hike_trk passes the record's check
      expect(hikeTrkOf({ id: 'habc1234', ...body.track })).not.toBeNull();
      expect(JSON.stringify(body)).not.toMatch(/仮名|gender|birth/);
    }
    expect(fetched.map((f) => f.url).sort()).toEqual(['https://api.yamap.com/v3/activities/123456', 'https://api.yamap.com/v3/activities/123456/tracks', 'https://api.yamap.com/v3/activities/123456', 'https://api.yamap.com/v3/activities/123456/tracks'].sort());
    expect(fetched[0].init.redirect).toBe('manual');
    expect(fetched[0].init.headers['User-Agent']).toMatch(/^Mozilla\/5\.0 .*Safari/);
    expect(logged).toHaveLength(2);
    expect(logged[1]).toMatchObject({ e: 'hike.import', l: 1, role: 'G', d: { ok: true, pts: 400 } });
    expect(JSON.stringify(logged)).not.toMatch(/123456|yamap|架空/);
  });

  it('a model course: one to do; a link with no track gives the fields and a null track', async () => {
    answers['https://api.yamap.com/v3/model_courses/77'] = () => jsonRes({ model_course: { name: '架空コース', distance: 5000, course_time: 9000, prefectures: [{ full_name: '架空県' }] } });
    answers['https://api.yamap.com/v3/model_courses/77/tracks'] = () => jsonRes({ tracks: [] });
    const { status, body } = await call(post({ url: 'YAMAP https://www.yamap.com/model-courses/77' }));
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true, meta: { name: '架空コース', area: '架空県', status: 'want', src: 'yamap', ref: 'm77', km: 5, time: '2:30' }, track: null });
  });

  it('refuses without a person’s key, off our origins, and a body that isn’t {url}', async () => {
    expect((await call(post(undefined, 'nope'))).status).toBe(401);
    const off = await hikeRoute(post(undefined, KEY_A, { Origin: 'https://evil.example' }), env());
    expect(off.status).toBe(403);
    const pre = await hikeRoute(new Request('https://relay/hiking', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), env());
    expect(pre.status).toBe(204);
    expect(await call(post('{'))).toMatchObject({ status: 400, body: { ok: false, error: 'bad_request' } });
    expect(await call(post({ link: LINK }))).toMatchObject({ status: 400, body: { error: 'bad_request' } });
    expect(await call(post({ url: 'x'.repeat(3000) }))).toMatchObject({ status: 413, body: { error: 'too_large' } });
    expect(fetched).toEqual([]);
  });

  it('a link not YAMAP’s is 400 bad_link, fetched nowhere and not counted', async () => {
    for (const url of ['https://evil.example/activities/1', 'http://yamap.com/activities/1', 'https://yamap.com.evil.example/activities/1', 'https://api.yamap.com/v3/activities/1']) {
      expect(await call(post({ url })), url).toMatchObject({ status: 400, body: { error: 'bad_link' } });
    }
    expect(fetched).toEqual([]);
    expect(log.spend('hike:A', 3)).toBe(true);
  });

  it('private or gone 404 not_found; an HTML page, a 500 or a redirect 502 upstream; an answer not the API’s 502', async () => {
    for (const st of [401, 403, 404, 410]) {
      answers['https://api.yamap.com/v3/activities/123456'] = () => jsonRes({ error: {} }, st);
      expect(await call(post(), env({ spend: async () => true })), String(st)).toMatchObject({ status: 404, body: { error: 'not_found' } });
    }
    const bad: (() => Response)[] = [
      () => new Response('<!DOCTYPE html><html></html>', { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } }),
      () => jsonRes({}, 500),
      () => new Response(null, { status: 302, headers: { Location: 'https://evil.example/' } }),
      () => new Response('{not json', { headers: { 'Content-Type': 'application/json' } }),
      () => jsonRes({ nothing: 'here' })
    ];
    for (const a of bad) {
      answers['https://api.yamap.com/v3/activities/123456'] = a;
      expect(await call(post(), env({ spend: async () => true }))).toMatchObject({ status: 502, body: { error: 'upstream' } });
    }
    expect(logged.every((e) => e.e === 'hike.import' && e.d?.ok === false)).toBe(true);
  });

  it('an answer over 2 MB is 413 too_large, by its length or as it streams', async () => {
    answers['https://api.yamap.com/v3/activities/123456/tracks'] = () => jsonRes(tracks(10), 200, { 'Content-Length': String(HIKE_READ_MAX + 1) });
    expect(await call(post())).toMatchObject({ status: 413, body: { error: 'too_large' } });
    const chunk = new Uint8Array(500_000).fill(32);
    answers['https://api.yamap.com/v3/activities/123456/tracks'] = () => new Response(new ReadableStream({ pull(c) { c.enqueue(chunk); } }), { headers: { 'Content-Type': 'application/json' } });
    expect(await call(post())).toMatchObject({ status: 413, body: { error: 'too_large' } });
  });

  it('slower than 8 s is 504 timeout', async () => {
    vi.useFakeTimers();
    try {
      answers['https://api.yamap.com/v3/activities/123456/tracks'] = () => new Promise<Response>(() => {});
      const fetchSlow: HikeFetch = (url, init) => (url.endsWith('/tracks') ? new Promise((_, no) => init.signal.addEventListener('abort', () => no(new DOMException('aborted', 'AbortError')))) : fetchMock(url, init));
      const p = call(post(), env({ fetch: fetchSlow }));
      await vi.advanceTimersByTimeAsync(HIKE_FETCH_MS + 1);
      expect(await p).toMatchObject({ status: 504, body: { error: 'timeout' } });
    } finally {
      vi.useRealTimers();
    }
  });

  it('a role’s imports a day are capped: 429 capped, YAMAP not asked', async () => {
    for (let i = 0; i < 3; i++) expect((await call(post())).status).toBe(200);
    const n = fetched.length;
    expect(await call(post())).toMatchObject({ status: 429, body: { error: 'capped' } });
    expect(fetched).toHaveLength(n);
    expect(logged.at(-1)).toMatchObject({ e: 'hike.import', l: 1, d: { ok: false, err: 'capped' } });
    expect((await call(post(undefined, KEY_B))).status).toBe(200);
  });

  it('a 10,000-point track: converted and fitted on the relay in a few ms', () => {
    const raw = tracks(10_000);
    const json = JSON.stringify(raw);
    const t0 = performance.now();
    const r = yamapImport({ kind: 'activity', id: '1' }, ACTIVITY, JSON.parse(json))!;
    const t1 = performance.now();
    const t = fitTrack(r.pts, r.wpts)!;
    const t2 = performance.now();
    console.log(`10k points: JSON ${(json.length / 1e6).toFixed(2)} MB, parse + convert ${(t1 - t0).toFixed(1)} ms, fitTrack ${(t2 - t1).toFixed(1)} ms, ${t.pts.length} kept`);
    expect(t.pts.length).toBeGreaterThan(1);
    expect(t).toEqual(trackOf(r.pts, r.wpts));
    expect(t2 - t1).toBeLessThan(100);
  });
});
