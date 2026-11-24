// `POST /hiking` (docs/backend.md#live-relay): a YAMAP link read for トレイル's own hikes (contract/hike.ts), here since
// YAMAP's API sends no CORS for our origin. Free of the Workers runtime (test/hike-route.test.ts).
// - Auth: any of the three keys in `Authorization: Bearer <key>` (the guest adds hikes too); CORS for our origins.
// - Body: JSON `{url}`, at most HIKE_BODY_MAX bytes; the link read by contract/yamap.ts yamapLink (yamap.com's
//   activities and model courses over https only, else 400 `bad_link`): the only URLs fetched are the API's two for it.
// - Caps: HIKE_DAY_MAX imports a role a UTC day (the log object's `hike:<role>`), then 429.
// - YAMAP: both URLs at once through `fetch`, a browser's User-Agent, no redirects followed, HIKE_FETCH_MS for both,
//   each answer read to HIKE_READ_MAX bytes at most and only as JSON (an unknown path answers 200 with a page).
//   401 / 403 / 404 / 410 (private or gone) 404 `not_found`; more than the read cap, or a track no simplification fits,
//   413 `too_large`; slower 504 `timeout`; anything else 502 `upstream`.
// - The answer: `{ok, meta, track}` (contract/yamap.ts HikeImportReply; the track fitTrack's, null with < 2 points).
//   **Nothing is written** (the phone previews and saves its `hike` and `hike_trk` through the queue) and nothing of the
//   answer kept: the log's `hike.import` carries the outcome, the point counts and the time, never the link.
import { bearerOf, corsRoute } from './auth.ts';
import { jsonCapped, readCapped } from './body.ts';
import { errName, type RelayEvent } from './log.ts';
import type { Who } from '../../app/src/lib/contract/api.ts';
import { fitTrack } from '../../app/src/lib/contract/hikeTrack.ts';
import { yamapImport, yamapLink, yamapUrls, type HikeImportError, type HikeImportReply } from '../../app/src/lib/contract/yamap.ts';

const HIKE_BODY_MAX = 2_048;
export const HIKE_READ_MAX = 2_000_000;
export const HIKE_FETCH_MS = 8_000;
export const HIKE_DAY_MAX = 30;
/** An iPhone's Safari (YAMAP's site is the phones'): not a bot's name. */
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

/** What the route needs of `fetch` (the Workers runtime's, a test's). */
export type HikeFetch = (url: string, init: { signal: AbortSignal; headers: Record<string, string>; redirect: 'manual' }) => Promise<Response>;

export interface HikeEnv {
  allowed: string;
  /** The key's owner (auth.ts keyOwner), or null. */
  roleOf(key: string): Who | null;
  /** One of the role's imports today (log.ts spend), or false when spent. */
  spend(role: Who): Promise<boolean>;
  fetch: HikeFetch;
  log(evs: RelayEvent[]): void;
  now(): number;
}

const STATUS: Record<HikeImportError, number> = { unauthorized: 401, bad_request: 400, bad_link: 400, not_found: 404, too_large: 413, capped: 429, timeout: 504, upstream: 502 };

/** An import's failure, with its reply's error. */
class Fail extends Error {
  constructor(readonly why: HikeImportError) {
    super(why);
  }
}

/** An answer's bytes, at most `max` (more: too_large). */
async function readTo(res: Response, max: number): Promise<Uint8Array> {
  const b = await readCapped(res, max);
  if (!b) throw new Fail('too_large');
  return b;
}

/** One API URL's JSON, or why not. */
async function getJson(fetch: HikeFetch, url: string, signal: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal, redirect: 'manual', headers: { 'User-Agent': UA, Accept: 'application/json', 'Accept-Language': 'ja' } });
  if ([401, 403, 404, 410].includes(res.status)) throw new Fail('not_found');
  if (!res.ok || !(res.headers.get('Content-Type') ?? '').toLowerCase().startsWith('application/json')) throw new Fail('upstream');
  const bytes = await readTo(res, HIKE_READ_MAX);
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Fail('upstream');
  }
}

export async function hikeRoute(req: Request, env: HikeEnv): Promise<Response> {
  const headers = corsRoute(req, env.allowed, 'Authorization, Content-Type');
  if (headers instanceof Response) return headers;
  const json = (o: HikeImportReply, status: number) => new Response(JSON.stringify(o), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
  const role = env.roleOf(bearerOf(req));
  if (!role) return json({ ok: false, error: 'unauthorized' }, 401);
  const t0 = env.now();
  const done = (err: HikeImportError | null, d: { pts?: number; kept?: number } = {}, body?: HikeImportReply) => {
    env.log([{ e: 'hike.import', l: err && err !== 'capped' && err !== 'bad_link' && err !== 'not_found' ? 2 : 1, role, d: { ms: env.now() - t0, ok: !err, ...(err ? { err } : {}), ...d } }]);
    return err ? json({ ok: false, error: err }, STATUS[err]) : json(body!, 200);
  };
  const b = await jsonCapped(req, HIKE_BODY_MAX);
  if (!b.ok) return done(b.why === 'too_large' ? 'too_large' : 'bad_request');
  const url = (b.json as { url?: unknown } | null)?.url;
  if (typeof url !== 'string') return done('bad_request');
  const link = yamapLink(url);
  if (!link) return done('bad_link');
  if (!(await env.spend(role).catch(() => false))) return done('capped');
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), HIKE_FETCH_MS);
  try {
    const u = yamapUrls(link);
    const [meta, track] = await Promise.all([getJson(env.fetch, u.meta, ctl.signal), getJson(env.fetch, u.track, ctl.signal)]);
    const r = yamapImport(link, meta, track);
    if (!r) return done('upstream');
    const t = r.pts.length < 2 ? null : fitTrack(r.pts, r.wpts);
    if (r.pts.length >= 2 && !t) return done('too_large', { pts: r.pts.length });
    return done(null, { pts: r.pts.length, kept: t?.pts.length ?? 0 }, { ok: true, meta: r.meta, track: t });
  } catch (e) {
    if (e instanceof Fail) return done(e.why);
    if (ctl.signal.aborted) return done('timeout');
    // its class only: never a message (it could quote the URL)
    console.warn('hike', errName(e));
    return done('upstream');
  } finally {
    clearTimeout(timer);
    ctl.abort();
  }
}
