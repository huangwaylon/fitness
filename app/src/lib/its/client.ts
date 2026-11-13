// The ITS booker's Worker (its/README.md) as ボット's 保養所 tab talks to it: GET /its/status, PUT /its/settings,
// POST /its/run and the push routes (POST /its/push/*: lib/its/push.ts), each with this phone's member key (a guest's is refused there; the page never asks for the guest).
// Answers are checked (parseStatus, on contract/guards.ts: another version, a proxy's page or garbage is null); a call
// never throws, and a failure is logged (`its.fail`: the call, the HTTP status, the Worker's error code, the request id;
// never the key). Its own fetch, not lib/keyed.ts: the request id and its one retry without it, a 409's status in the
// body, and its.fail's code and rid, which keyed.fail doesn't carry.
// Each call carries an `X-Request-Id` (the Worker logs it as `rid=`); a Worker from before it refuses the header in its
// CORS preflight, so the session's first read (a GET) that fails the way a refused preflight does (a TypeError, online)
// is tried once without, and the session stops sending it once that worked; once a call got an answer with it, never
// (a lost PUT's or POST's reply is never sent twice). No demo mode:
// ボット has no 保養所 tab there (the e2e mocks the Worker).
import {
  BOOKING_KINDS, EVENT_KINDS, INTERVALS_SEC, MAX_NAME, MAX_SITE_NAME, PHASES, PUSH_ROUTES, REASONS, VERDICTS, isDate, isId, isName,
  type BookingEntry, type IntervalSec, type ItsEvent, type ItsPushStatus, type ItsSettings, type ItsSettingsInput, type ItsStatus, type Member,
  type PushEndpointInput, type PushKind, type PushOutcome, type PushSubscribeInput,
  type Reason, type RunInput, type ScanEntry, type ScanMinute, type Verdict
} from './contract.ts';
import { getKey } from '#lib/sync/storage.ts';
import { isNum, isRec } from '#lib/contract/guards.ts';
import { log } from '#lib/sync/log.ts';

/** The Worker's origin (the CSP's connect-src names it: vite.config.ts). */
const ITS_ORIGIN = 'https://its-bot.island-fund-relay.workers.dev';
/** The Worker's origin; VITE_ITS_URL overrides it (empty = ボット's 保養所 tab hidden), as GYM_URL does. */
export const ITS_URL: string = (import.meta.env?.VITE_ITS_URL as string | undefined) ?? ITS_ORIGIN;

const TIMEOUT_MS = 20_000;

const num = (x: unknown): number | null => (isNum(x) ? x : null);
const str = (x: unknown): string | null => (typeof x === 'string' ? x : null);
const strs = (x: unknown): string[] => (Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string') : []);
const member = (x: unknown): Member | null => (x === 'A' || x === 'B' ? x : null);
/** The names the contract allows (isName: no control or bidi character, ≤ max), the rest left out. */
const names = (x: unknown, max: number): string[] => (Array.isArray(x) ? x.filter((s): s is string => isName(s, max)) : []);

function parseSettings(x: unknown): ItsSettings | null {
  if (!isRec(x) || typeof x.paused !== 'boolean' || typeof x.autoConfirm !== 'boolean' || !INTERVALS_SEC.includes(x.intervalSec as IntervalSec)) return null;
  if (!Number.isInteger(x.guests) || !Array.isArray(x.dates) || !x.dates.every(isDate)) return null;
  return {
    v: 1, paused: x.paused, intervalSec: x.intervalSec as IntervalSec, dates: [...x.dates as string[]], guests: x.guests as number,
    skip: names(x.skip, MAX_SITE_NAME), priority: names(x.priority, MAX_NAME), autoConfirm: x.autoConfirm, updatedAt: num(x.updatedAt), updatedBy: member(x.updatedBy),
    // the allow-list, from a Worker that keeps one (absent: every facility not skipped is searched)
    ...(Array.isArray(x.search) ? { search: names(x.search, MAX_SITE_NAME) } : {})
  };
}

function parseBooking(x: unknown): BookingEntry | null {
  if (!isRec(x) || !BOOKING_KINDS.includes(x.kind as BookingEntry['kind']) || !isDate(x.date) || !isName(x.hotel, MAX_SITE_NAME) || num(x.at) === null) return null;
  return { id: str(x.id) ?? '', kind: x.kind as BookingEntry['kind'], date: x.date, hotel: x.hotel, ...(typeof x.number === 'string' ? { number: x.number } : {}), at: x.at as number, runId: str(x.runId) ?? '' };
}

function parseEvent(x: unknown): ItsEvent | null {
  if (!isRec(x) || !EVENT_KINDS.includes(x.kind as ItsEvent['kind']) || num(x.t) === null) return null;
  return {
    runId: str(x.runId) ?? '', seq: num(x.seq) ?? 0, t: x.t as number, kind: x.kind as ItsEvent['kind'],
    ...(isDate(x.date) ? { date: x.date } : {}), ...(typeof x.hotel === 'string' ? { hotel: x.hotel } : {}), ...(typeof x.detail === 'string' ? { detail: x.detail } : {})
  };
}

function parseRunner(x: unknown): ItsStatus['runner'] {
  if (!isRec(x) || num(x.lastSeen) === null || num(x.startedAt) === null) return null;
  const sv = isRec(x.solves) ? x.solves : {};
  const err = isRec(x.lastError) && num(x.lastError.at) !== null ? x.lastError : null;
  const fails: Record<string, number> = {};
  if (isRec(x.failuresByStep)) for (const [k, v] of Object.entries(x.failuresByStep)) if (num(v) !== null) fails[k] = v as number;
  return {
    runId: str(x.runId) ?? '', runUrl: str(x.runUrl), sha: str(x.sha), host: x.host === 'local' ? 'local' : 'actions',
    startedAt: x.startedAt as number, deadline: num(x.deadline),
    phase: PHASES.find((p) => p === x.phase) ?? 'starting',
    scans: num(x.scans) ?? 0, scanFailures: num(x.scanFailures) ?? 0, lastScanAt: num(x.lastScanAt), lastOkAt: num(x.lastOkAt),
    solves: { ok: num(sv.ok) ?? 0, failed: num(sv.failed) ?? 0, lastOkAt: num(sv.lastOkAt), lastSecs: num(sv.lastSecs), lastSpot: sv.lastSpot === 'centre' || sv.lastSpot === 'left' ? sv.lastSpot : null },
    failuresByStep: fails,
    lastError: err && { at: err.at as number, step: str(err.step) ?? '?', status: num(err.status), cls: str(err.cls) ?? '?' },
    unsynced: num(x.unsynced) ?? 0, lastSeen: x.lastSeen as number,
    // from a newer runner (absent from an older one: view.ts stopsAtBooked)
    ...('settingsAt' in x ? { settingsAt: num(x.settingsAt) } : {}),
    ...('mailOk' in x ? { mailOk: typeof x.mailOk === 'boolean' ? x.mailOk : null } : {})
  };
}

/** One read of the last hour's (`recentScans`), or null when garbled. */
function parseScan(x: unknown): ScanEntry | null {
  if (!isRec(x) || num(x.t) === null || typeof x.ok !== 'boolean') return null;
  return { t: x.t as number, ok: x.ok, ...(isId(x.code) ? { code: x.code } : {}), ms: num(x.ms) ?? 0, avail: num(x.avail) ?? 0 };
}

/** One minute of the last hour's reads (`recentMinutes`), or null when garbled. */
function parseMinute(x: unknown): ScanMinute | null {
  if (!isRec(x) || num(x.minute) === null || num(x.n) === null) return null;
  const codes: Record<string, number> = {};
  if (isRec(x.codes)) for (const [k, v] of Object.entries(x.codes)) if (isId(k) && num(v) !== null) codes[k] = v as number;
  return { minute: x.minute as number, n: x.n as number, ok: num(x.ok) ?? 0, fail: num(x.fail) ?? 0, avail: num(x.avail) ?? 0, ...(Object.keys(codes).length ? { codes } : {}) };
}

/** A GET /its/status answer as the page reads it, or null when it isn't one. The verdict, the time and the settings
 *  must be there; a garbled booking, event or reason is left out. */
export function parseStatus(x: unknown): ItsStatus | null {
  if (!isRec(x) || x.v !== 1 || num(x.now) === null || !VERDICTS.includes(x.verdict as Verdict)) return null;
  const settings = parseSettings(x.settings);
  if (!settings) return null;
  const lease = isRec(x.lease) && num(x.lease.until) !== null ? { holder: str(x.lease.holder) ?? '', host: x.lease.host === 'local' ? 'local' as const : 'actions' as const, until: x.lease.until as number } : null;
  const dispatch = isRec(x.dispatch) && num(x.dispatch.at) !== null ? { at: x.dispatch.at as number, ok: x.dispatch.ok === true, status: num(x.dispatch.status) } : null;
  const c = x.control;
  const control = isRec(c) && (c.action === 'start' || c.action === 'stop') && member(c.by) && num(c.at) !== null ? { action: c.action as RunInput['action'], by: member(c.by)!, at: c.at as number } : null;
  const push = parsePush(x.push);
  return {
    v: 1, now: x.now as number, mode: x.mode === 'on' ? 'on' : 'off', sha: str(x.sha), verdict: x.verdict as Verdict,
    reasons: strs(x.reasons).filter((r): r is Reason => REASONS.includes(r as Reason)),
    settings, runner: parseRunner(x.runner), lease, dispatch, ...(control ? { control } : {}),
    bookings: Array.isArray(x.bookings) ? x.bookings.map(parseBooking).filter((b): b is BookingEntry => b !== null) : [],
    events: Array.isArray(x.events) ? x.events.map(parseEvent).filter((e): e is ItsEvent => e !== null) : [],
    seen: names(x.seen, MAX_SITE_NAME),
    // from a newer Worker (absent from an older one): the last preflight, the last hour's reads (absent: no strip)
    ...('lastPreflight' in x ? { lastPreflight: num(x.lastPreflight) } : {}),
    ...(Array.isArray(x.recentScans) ? { recentScans: x.recentScans.map(parseScan).filter((e) => e !== null) } : {}),
    // the reads per minute (the strip's source when present: every read of the hour)
    ...(Array.isArray(x.recentMinutes) ? { recentMinutes: x.recentMinutes.map(parseMinute).filter((e) => e !== null) } : {}),
    // Web Push (absent: a Worker without it, 通知's 準備中)
    ...(push ? { push } : {})
  };
}

/** A push status (`ItsStatus.push`, a push route's `push`), or null when garbled. */
function parsePush(x: unknown): ItsPushStatus | null {
  if (!isRec(x) || num(x.A) === null || num(x.B) === null) return null;
  const o = isRec(x.lastOutcome) && num(x.lastOutcome.at) !== null ? x.lastOutcome : null;
  return {
    A: x.A as number, B: x.B as number, vapidPublic: typeof x.vapidPublic === 'string' && /^[A-Za-z0-9_-]{80,100}$/.test(x.vapidPublic) ? x.vapidPublic : null,
    lastSentAt: num(x.lastSentAt),
    lastOutcome: o && {
      // (codes as the Worker sent them: the page shows none of it yet)
      at: o.at as number, kind: str(o.kind) as PushKind, code: str(o.code) as PushOutcome, status: num(o.status) ?? 0, ...(typeof o.reason === 'string' ? { reason: o.reason } : {})
    }
  };
}

/** A call's outcome: the status (every answer carries the current one), or why not: the Worker's error code (`conflict`
 *  for a 409: someone saved since this draft began, with the current status) or the phone's own (offline, timeout,
 *  json, no_key, http). */
export type ItsReply = { ok: true; status: ItsStatus } | ItsFail;
type ItsFail = { ok: false; err: string; http: number | null; status: ItsStatus | null; rid?: string };
/** A push route's outcome: the push status after it, or why not (the Worker's code: rate_limited, not_subscribed,
 *  push_off, …, or the phone's). */
export type PushReply = { ok: true; push: ItsPushStatus } | { ok: false; err: string; http: number | null };
type Op = 'status' | 'settings' | 'run' | 'push_subscribe' | 'push_unsubscribe' | 'push_test';

/** A Worker's error code as the log may keep it (a short token), else `http`. */
const code = (x: unknown): string => (typeof x === 'string' && /^[a-z_]{1,32}$/.test(x) ? x : 'http');

/** A request's id: 8 hex digits, the Worker's log and the phone's (`its.fail`) say the same. */
const newRid = (): string => Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, '0')).join('');
/** The header this session: `try` until an answer came with it (`yes`) or a read got through only without (`no`). */
let rid: 'try' | 'yes' | 'no' = 'try';

/** One call: the answer read by `parse` (null: not one), or why not. */
async function call<T>(op: Op, method: 'GET' | 'PUT' | 'POST', path: string, body: unknown, signal: AbortSignal | undefined, url: string,
  parse: (json: unknown) => T | null): Promise<{ ok: true; value: T } | ItsFail> {
  const key = getKey();
  if (!key || !url) return { ok: false, err: 'no_key', http: null, status: null };
  const id = newRid();
  const ctl = new AbortController();
  const stop = () => ctl.abort();
  signal?.addEventListener('abort', stop);
  let timedOut = false;
  const timer = setTimeout(() => ((timedOut = true), ctl.abort()), TIMEOUT_MS);
  const t0 = performance.now();
  const send = (withRid: boolean) => fetch(`${url}${path}`, {
    method, signal: ctl.signal, cache: 'no-store',
    headers: { Authorization: `Bearer ${key}`, ...(withRid ? { 'X-Request-Id': id } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  let r: { ok: true; value: T } | ItsFail;
  try {
    let res: Response;
    try {
      res = await send(rid !== 'no');
      if (rid === 'try') rid = 'yes';
    } catch (e) {
      // the preflight may have refused the header (a Worker from before it): a read, once without
      if (rid !== 'try' || method !== 'GET' || ctl.signal.aborted || !(e instanceof TypeError) || navigator.onLine === false) throw e;
      res = await send(false);
      rid = 'no';
    }
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = undefined;
    }
    if (res.ok) {
      const v = parse(json);
      r = v ? { ok: true, value: v } : { ok: false, err: 'json', http: res.status, status: null, rid: id };
    } else {
      const o = isRec(json) ? json : {};
      r = { ok: false, err: res.status === 409 ? 'conflict' : code(o.error), http: res.status, status: parseStatus(o.status) ?? parseStatus(json), rid: id };
    }
  } catch {
    r = { ok: false, err: timedOut ? 'timeout' : 'offline', http: null, status: null, rid: id };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', stop);
  }
  // leaving the page (its abort) is no failure
  if (!r.ok && !signal?.aborted) {
    // (a refusal the page words and expects: info)
    const level = r.err === 'offline' || r.err === 'rate_limited' || r.err === 'not_subscribed' ? 1 : 2;
    log('its.fail', { op, err: r.err, rid: id, ms: Math.round(performance.now() - t0), ...(r.http === null ? {} : { http: r.http }) }, level);
  }
  return r;
}

const asStatus = (r: { ok: true; value: ItsStatus } | ItsFail): ItsReply => (r.ok ? { ok: true, status: r.value } : r);
const statusCall = (op: Op, method: 'GET' | 'PUT' | 'POST', path: string, body: unknown, signal: AbortSignal | undefined, url: string) =>
  call(op, method, path, body, signal, url, parseStatus).then(asStatus);

/** GET /its/status. */
export const fetchStatus = (signal?: AbortSignal, url = ITS_URL): Promise<ItsReply> => statusCall('status', 'GET', '/its/status', undefined, signal, url);
/** PUT /its/settings: the draft, from the `updatedAt` it began at. */
export const putSettings = (input: ItsSettingsInput, signal?: AbortSignal, url = ITS_URL): Promise<ItsReply> => statusCall('settings', 'PUT', '/its/settings', input, signal, url);
/** POST /its/run: 開始 or 停止, at once. */
export const postRun = (action: RunInput['action'], signal?: AbortSignal, url = ITS_URL): Promise<ItsReply> => statusCall('run', 'POST', '/its/run', { action } satisfies RunInput, signal, url);

/** POST /its/push/subscribe, /unsubscribe, /test (lib/its/push.ts): `{ok: true, push}`, or why not (a Worker without
 *  the routes: 404). Logged as the other calls (never the endpoint or the keys: they are in the body only). */
export const pushCall = (route: keyof typeof PUSH_ROUTES, body: PushSubscribeInput | PushEndpointInput, signal?: AbortSignal, url = ITS_URL): Promise<PushReply> =>
  call(`push_${route}`, 'POST', PUSH_ROUTES[route], body, signal, url, (x) => (isRec(x) && x.ok === true ? parsePush(x.push) : null))
    .then((r) => (r.ok ? { ok: true, push: r.value } : { ok: false, err: r.err, http: r.http }));
