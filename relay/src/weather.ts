// Tokyo's real weather by the hour (docs/design.md "Weather", docs/backend.md "The real weather"): Open-Meteo's
// forecast from JMA's models, fetched by the room (index.ts weatherTick, on the 15-minute cron and at a hello when
// it's due), mapped to the game's skies with dead bands so the sky doesn't flicker, and kept as a 36-hour timeline
// (live-protocol.ts Wx). An hour is locked once it starts (the next one from :45): every phone that has the timeline
// shows the same sky at the same hour, whenever it got it. Pure but for `tick`'s fetch, which comes in.
import { WX_MAX_HOURS, type Wx, type WxSky } from '../../app/src/lib/sync/live-protocol.ts';

/** Hours the timeline holds from the current one, and before it. */
export const WX_HOURS = 36;
export const WX_PAST = 12;
const HOUR_MS = 3600_000;
/** A good fetch is fresh this long; then the next cron (or hello) fetches again. */
export const FRESH_MS = 30 * 60_000;
/** From this minute of an hour the next hour is locked (its first fetch from then on sets it). */
export const LOCK_MIN = 45;
/** After a failure, wait this long before the next try (the 1st, the 2nd, the 3rd and on). */
export const BACKOFF_MS = [30 * 60_000, 60 * 60_000, 120 * 60_000] as const;
/** A fetch gives up after this long. */
export const FETCH_MS = 5000;
/** A timeline at most this old (its fetch) is still served. */
export const STALE_MS = 36 * HOUR_MS;

/** Where the weather is fetched for (wrangler.toml [vars] WX_LAT / WX_LON: central Tokyo, by the 東京 AMeDAS station). */
export const TOKYO = { lat: 35.69, lon: 139.75 } as const;

/** Open-Meteo's forecast for a point: JMA's models, the 13 hours before now (the past hours, and the one before them
 *  for the dead bands), now and the 35 after it, epoch-second times. */
export function omUrl(lat: number = TOKYO.lat, lon: number = TOKYO.lon): string {
  const q = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    models: 'jma_seamless',
    hourly: 'weather_code,precipitation,cloud_cover,visibility,temperature_2m',
    timezone: 'GMT',
    timeformat: 'unixtime',
    past_hours: String(WX_PAST + 1),
    forecast_hours: String(WX_HOURS)
  });
  return `https://api.open-meteo.com/v1/forecast?${q}`;
}

/** An hour of the forecast: WMO weather code, precipitation (mm), cloud cover (%), visibility (m), temperature (°C);
 *  null where the model has none (JMA's has no visibility). */
export interface Hour {
  h: number;
  code: number;
  mm: number;
  cloud: number | null;
  vis: number | null;
  temp: number | null;
}

/** The WMO codes Open-Meteo uses. */
const WMO = new Set([0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99]);
const num = (x: unknown, lo: number, hi: number): x is number => typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi;

/** An Open-Meteo response's hours, strictly checked (the arrays the same length, the times hourly, the codes WMO's,
 *  the numbers in range), up to the first hour without a code; null when it isn't one, or has under 2 hours. */
export function parseOpenMeteo(body: unknown): Hour[] | null {
  if (typeof body !== 'object' || body === null) return null;
  const hy = (body as { hourly?: Record<string, unknown> }).hourly;
  if (typeof hy !== 'object' || hy === null) return null;
  const { time, weather_code: code, precipitation: mm, cloud_cover: cloud, visibility: vis, temperature_2m: temp } = hy;
  const arr = (a: unknown): a is unknown[] => Array.isArray(a) && a.length === (time as unknown[]).length;
  if (!Array.isArray(time) || time.length < 2 || time.length > 200 || !arr(code) || !arr(mm)) return null;
  const out: Hour[] = [];
  for (let i = 0; i < time.length; i++) {
    const t = time[i];
    if (!Number.isInteger(t) || t % 3600 !== 0 || (i > 0 && t !== time[i - 1] + 3600)) return null;
    if (code[i] === null) break;
    if (!Number.isInteger(code[i]) || !WMO.has(code[i] as number)) return null;
    if (!num(mm[i], 0, 500)) return null;
    const opt = (a: unknown, lo: number, hi: number): number | null | undefined => {
      const x = arr(a) ? a[i] : null;
      return x === null || x === undefined ? null : num(x, lo, hi) ? x : undefined;
    };
    const c = opt(cloud, 0, 100), v = opt(vis, 0, 1e6), tc = opt(temp, -60, 60);
    if (c === undefined || v === undefined || tc === undefined) return null;
    out.push({ h: t / 3600, code: code[i] as number, mm: mm[i] as number, cloud: c, vis: v, temp: tc });
  }
  return out.length >= 2 ? out : null;
}

const isWet = (s: WxSky | null): boolean => s === 'r' || s === 'h' || s === 's';
const DRIZZLE = (c: number) => c >= 51 && c <= 57;
const RAIN = (c: number) => (c >= 61 && c <= 67) || (c >= 80 && c <= 82);
const HEAVY = (c: number) => c === 65 || c === 66 || c === 67 || c === 82 || c >= 95;
const SNOW = (c: number) => (c >= 71 && c <= 77) || c === 85 || c === 86;
const FOG = (c: number) => c === 45 || c === 48;

/**
 * An hour's sky, given the hour before's (the dead bands, docs/design.md "Weather"):
 * - wet from dry at ≥ 0.5 mm or a rain code (drizzle lighter than that is cloudy); wet stays wet down to 0.2 mm;
 * - heavy at ≥ 4 mm, a heavy rain code or thunder (NH has no lightning); heavy stays heavy down to 2.5 mm;
 * - snow by a snow code, or wet at ≤ 1 °C (it stays snow up to 2 °C);
 * - cloudy from clear at ≥ 85 % cloud cover (overcast, code 3, without one); cloudy stays cloudy down to 60 %;
 * - fog (cloudy) by a fog code, or under 1 km of visibility while dry.
 */
export function mapHour(h: Hour, prev: WxSky | null): { sky: WxSky; fog: boolean } {
  const wetBefore = isWet(prev);
  const wet = SNOW(h.code) || RAIN(h.code) || h.code >= 95 || h.mm >= 0.5 || (DRIZZLE(h.code) && wetBefore) || (wetBefore && h.mm >= 0.2);
  if (wet) {
    if (SNOW(h.code) || (h.temp !== null && h.temp <= (prev === 's' ? 2 : 1))) return { sky: 's', fog: false };
    const heavy = HEAVY(h.code) || h.mm >= (prev === 'h' ? 2.5 : 4);
    return { sky: heavy ? 'h' : 'r', fog: false };
  }
  const fog = FOG(h.code) || (h.vis !== null && h.vis < 1000);
  if (fog || DRIZZLE(h.code)) return { sky: 'o', fog };
  const cloudy = h.cloud === null ? h.code === 3 : h.cloud >= (prev === 'c' || prev === null ? 85 : 60);
  return { sky: cloudy ? 'o' : 'c', fog: false };
}

type Sk = { sky: WxSky; fog: boolean };

/** The gap fill, in place: a single dry hour between two wet ones is wet (rain, or snow between snow), and a single
 *  hour between two of the same sky that's like them (cloudy between clear, rain between heavy, …) is theirs; `before`
 *  the sky before the first, `locked` the hours left as they are. */
function gapFill(out: Sk[], before: WxSky | null, locked: readonly boolean[] = []): void {
  for (let i = 0; i < out.length - 1; i++) {
    if (locked[i]) continue;
    const a = i > 0 ? out[i - 1].sky : before, b = out[i].sky, c = out[i + 1].sky;
    if (!isWet(b) && isWet(a) && isWet(c)) out[i] = { sky: a === 's' && c === 's' ? 's' : 'r', fog: false };
    else if (a === c && b !== a && isWet(a) === isWet(b) && !out[i].fog) out[i] = { sky: a, fog: false };
  }
}

/** The skies of a run of hours, the first given the sky before it: mapHour hour by hour, then the gap fill. */
export function mapHours(hours: readonly Hour[], before: WxSky | null): Sk[] {
  const out: Sk[] = [];
  let prev = before;
  for (const h of hours) {
    const m = mapHour(h, prev);
    out.push(m);
    prev = m.sky;
  }
  gapFill(out, before);
  return out;
}

/** The letter and fog of hour `h` in a timeline, or null when it doesn't cover it. */
export function hourOf(wx: Wx | null, h: number): { sky: WxSky; fog: boolean } | null {
  if (!wx) return null;
  const i = h - wx.h0;
  if (i < 0 || i >= wx.s.length) return null;
  return { sky: wx.s[i] as WxSky, fog: wx.fx?.includes(i) ?? false };
}

/**
 * The timeline around the current hour (`now`): the past WX_PAST hours (a rainbow is the first clear hour after rain:
 * the phones look back) and the next WX_HOURS, keeping what `prev` (the one kept) has for the hours already locked: the
 * current one and before, and the next one once `prev` was fetched at or after this hour's :45. Each open hour is mapped
 * from the sky before it (the dead bands carry on from a locked one), and the gap fill never changes a locked hour. Null
 * when the forecast doesn't cover the current hour.
 */
export function timeline(hours: readonly Hour[], prev: Wx | null, now: number, src: Wx['src'] = 'om'): Omit<Wx, 'rev'> | null {
  const cur = Math.floor(now / HOUR_MS);
  const lastLocked = prev && prev.at >= cur * HOUR_MS + LOCK_MIN * 60_000 ? cur + 1 : cur;
  const byHour = new Map(hours.map((h) => [h.h, h]));
  if (!byHour.has(cur)) return null;
  const kept = (h: number) => (h <= lastLocked ? hourOf(prev, h) : null);
  // the first hour: as far back as WX_PAST while every hour to now is known
  let first = cur;
  while (first > cur - WX_PAST && (kept(first - 1) || byHour.has(first - 1))) first--;
  const hb = byHour.get(first - 1);
  const before = hourOf(prev, first - 1)?.sky ?? (hb ? mapHour(hb, null).sky : null);
  const out: Sk[] = [], locked: boolean[] = [];
  let p = before;
  for (let h = first; h < cur + WX_HOURS; h++) {
    const k = kept(h);
    const fh = byHour.get(h);
    if (!k && !fh) break;
    const m = k ?? mapHour(fh!, p);
    out.push(m);
    locked.push(k !== null);
    p = m.sky;
  }
  gapFill(out, before, locked);
  const n = Math.min(out.length, WX_MAX_HOURS);
  const fx = out.slice(0, n).flatMap((x, i) => (x.fog ? [i] : []));
  return { h0: first, s: out.slice(0, n).map((x) => x.sky).join(''), ...(fx.length ? { fx } : {}), at: now, src };
}

/** Whether `next` changes what a phone holding `prev` would show: an hour both cover reads otherwise, or `next` reaches
 *  6 hours or more further, or `prev` no longer covers the current hour (or there was none). */
export function changed(prev: Wx | null, next: Omit<Wx, 'rev'>): boolean {
  if (!prev || prev.src !== next.src) return true;
  if (!hourOf(prev, Math.floor(next.at / HOUR_MS))) return true;
  for (let i = 0; i < next.s.length; i++) {
    const a = hourOf(prev, next.h0 + i), b = hourOf(next as Wx, next.h0 + i);
    if (a && b && (a.sky !== b.sky || a.fog !== b.fog)) return true;
  }
  return next.h0 + next.s.length - (prev.h0 + prev.s.length) >= 6;
}

/** What the room keeps (storage `wx`): the timeline, and the failures since the last good fetch (the backoff). */
export interface WxState {
  wx: Wx | null;
  fails: number;
  /** When the last try failed (ms), while `fails` > 0. */
  failAt?: number;
}

export const WX_EMPTY: WxState = { wx: null, fails: 0 };

/** Whether a fetch is due at `now`: none kept, the last good one 30 minutes old, or past :45 with none since; never
 *  inside a failure's backoff. */
export function due(st: WxState, now: number): boolean {
  if (st.fails > 0 && st.failAt !== undefined && now - st.failAt < BACKOFF_MS[Math.min(st.fails, BACKOFF_MS.length) - 1]) return false;
  if (!st.wx) return true;
  const lockMark = Math.floor(now / HOUR_MS) * HOUR_MS + LOCK_MIN * 60_000;
  return now - st.wx.at >= FRESH_MS || (now >= lockMark && st.wx.at < lockMark);
}

/** The kept timeline, if it still serves at `now`: fetched within 36 hours and covering the current hour. */
export function served(wx: Wx | null, now: number): Wx | null {
  return wx && now - wx.at <= STALE_MS && hourOf(wx, Math.floor(now / HOUR_MS)) ? wx : null;
}

export type FetchLike = (url: string, init: { signal: AbortSignal; headers: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/** A fetch's outcome: the new state, whether the phones should hear of it (`send`), and why it failed. */
export interface TickResult {
  st: WxState;
  send: boolean;
  fail?: string;
}

/** Fetch and fold a forecast into the kept state. Bad data, an error status or a timeout never replaces a good
 *  timeline: it counts a failure (the backoff) and keeps what was there. */
export async function fetchTick(st: WxState, now: number, fetch: FetchLike, url = omUrl(), timeoutMs = FETCH_MS): Promise<TickResult> {
  const failed = (why: string): TickResult => ({ st: { wx: st.wx, fails: st.fails + 1, failAt: now }, send: false, fail: why });
  let body: unknown;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: 'application/json' } });
    if (!r.ok) return failed(`status ${r.status}`);
    body = await r.json();
  } catch (e) {
    return failed((e as Error)?.name === 'TimeoutError' ? 'timeout' : `fetch ${String((e as Error)?.message ?? e).slice(0, 60)}`);
  }
  const hours = parseOpenMeteo(body);
  if (!hours) return failed('bad body');
  return fold(st, hours, now, 'om') ?? failed('no current hour');
}

/** A forecast's hours into the kept state (a new revision when it changes), or null when they don't cover now. */
export function fold(st: WxState, hours: readonly Hour[], now: number, src: Wx['src']): TickResult | null {
  // a fixture never locks a real forecast's hours (nor a real one a fixture's)
  const prev = st.wx?.src === src ? served(st.wx, now) : null;
  const next = timeline(hours, prev, now, src);
  if (!next) return null;
  const send = changed(served(st.wx, now), next);
  const rev = (st.wx?.rev ?? 0) + (send ? 1 : 0);
  return { st: { wx: { ...next, rev }, fails: 0 }, send };
}

/** A fixture timeline (the `/admin` op `wx`, the smoke test): `s` from the current hour, `fx` its foggy hours. */
export function fixture(st: WxState, s: string, fx: number[] | undefined, now: number): WxState | null {
  if (!/^[corhs]{1,36}$/.test(s) || (fx && !fx.every((i) => Number.isInteger(i) && i >= 0 && i < s.length))) return null;
  const h0 = Math.floor(now / HOUR_MS);
  return { wx: { h0, s, ...(fx?.length ? { fx } : {}), at: now, src: 'fx', rev: (st.wx?.rev ?? 0) + 1 }, fails: 0 };
}

/** What `/health` says of the weather: when it was fetched, from where, its age in minutes, the hours it covers from
 *  now, the failures since the last good fetch. */
export function wxHealth(st: WxState, now: number): { at: number | null; src: string | null; age: number | null; hours: number; fails: number } {
  const wx = st.wx;
  const cur = Math.floor(now / HOUR_MS);
  return {
    at: wx?.at ?? null,
    src: wx?.src ?? null,
    age: wx ? Math.round((now - wx.at) / 60_000) : null,
    hours: wx ? Math.max(0, wx.h0 + wx.s.length - cur) : 0,
    fails: st.fails
  };
}
