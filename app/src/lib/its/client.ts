// The ITS booker's Worker (its/README.md) as 設定's 保養所ボット page talks to it: GET /its/status, PUT /its/settings,
// POST /its/run, each with this phone's member key (a guest's is refused there; the page never asks for the guest).
// Answers are checked (parseStatus: another version, a proxy's page or garbage is null); a call never throws, and a
// failure is logged (`its.fail`: the call, the HTTP status, the Worker's error code; never the key). No demo mode:
// 設定 hides the row there (the e2e mocks the Worker).
import {
  BOOKING_KINDS, EVENT_KINDS, INTERVALS_SEC, MAX_NAME, MAX_SITE_NAME, PHASES, REASONS, VERDICTS, isDate, isName,
  type BookingEntry, type IntervalSec, type ItsEvent, type ItsSettings, type ItsSettingsInput, type ItsStatus, type Member,
  type Reason, type RunInput, type Verdict
} from './contract.ts';
import { getKey } from '#lib/sync/storage.ts';
import { log } from '#lib/sync/log.ts';

/** The Worker's origin (the CSP's connect-src names it: vite.config.ts). */
const ITS_ORIGIN = 'https://its-bot.island-fund-relay.workers.dev';
/** `VITE_ITS_URL`, else none for now: 設定's section is hidden until the Worker is live (the e2e turns it on with
 *  `e2e.its`). */
export const ITS_URL: string = (import.meta.env?.VITE_ITS_URL as string | undefined)
  ?? (typeof localStorage !== 'undefined' && localStorage.getItem('e2e') === '1' && localStorage.getItem('e2e.its') === 'on' ? ITS_ORIGIN : '');

const TIMEOUT_MS = 20_000;

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const str = (x: unknown): string | null => (typeof x === 'string' ? x : null);
const strs = (x: unknown): string[] => (Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string') : []);
const member = (x: unknown): Member | null => (x === 'A' || x === 'B' ? x : null);
/** The names the contract allows (isName: no control or bidi character, ≤ max), the rest left out. */
const names = (x: unknown, max: number): string[] => (Array.isArray(x) ? x.filter((s): s is string => isName(s, max)) : []);

function parseSettings(x: unknown): ItsSettings | null {
  if (!isObj(x) || typeof x.paused !== 'boolean' || typeof x.autoConfirm !== 'boolean' || !INTERVALS_SEC.includes(x.intervalSec as IntervalSec)) return null;
  if (!Number.isInteger(x.guests) || !Array.isArray(x.dates) || !x.dates.every(isDate)) return null;
  return {
    v: 1, paused: x.paused, intervalSec: x.intervalSec as IntervalSec, dates: [...x.dates as string[]], guests: x.guests as number,
    skip: names(x.skip, MAX_SITE_NAME), priority: names(x.priority, MAX_NAME), autoConfirm: x.autoConfirm, updatedAt: num(x.updatedAt), updatedBy: member(x.updatedBy)
  };
}

function parseBooking(x: unknown): BookingEntry | null {
  if (!isObj(x) || !BOOKING_KINDS.includes(x.kind as BookingEntry['kind']) || !isDate(x.date) || !isName(x.hotel, MAX_SITE_NAME) || num(x.at) === null) return null;
  return { id: str(x.id) ?? '', kind: x.kind as BookingEntry['kind'], date: x.date, hotel: x.hotel, ...(typeof x.number === 'string' ? { number: x.number } : {}), at: x.at as number, runId: str(x.runId) ?? '' };
}

function parseEvent(x: unknown): ItsEvent | null {
  if (!isObj(x) || !EVENT_KINDS.includes(x.kind as ItsEvent['kind']) || num(x.t) === null) return null;
  return {
    runId: str(x.runId) ?? '', seq: num(x.seq) ?? 0, t: x.t as number, kind: x.kind as ItsEvent['kind'],
    ...(isDate(x.date) ? { date: x.date } : {}), ...(typeof x.hotel === 'string' ? { hotel: x.hotel } : {}), ...(typeof x.detail === 'string' ? { detail: x.detail } : {})
  };
}

function parseRunner(x: unknown): ItsStatus['runner'] {
  if (!isObj(x) || num(x.lastSeen) === null || num(x.startedAt) === null) return null;
  const sv = isObj(x.solves) ? x.solves : {};
  const err = isObj(x.lastError) && num(x.lastError.at) !== null ? x.lastError : null;
  const fails: Record<string, number> = {};
  if (isObj(x.failuresByStep)) for (const [k, v] of Object.entries(x.failuresByStep)) if (num(v) !== null) fails[k] = v as number;
  return {
    runId: str(x.runId) ?? '', runUrl: str(x.runUrl), sha: str(x.sha), host: x.host === 'local' ? 'local' : 'actions',
    startedAt: x.startedAt as number, deadline: num(x.deadline),
    phase: PHASES.find((p) => p === x.phase) ?? 'starting',
    scans: num(x.scans) ?? 0, scanFailures: num(x.scanFailures) ?? 0, lastScanAt: num(x.lastScanAt), lastOkAt: num(x.lastOkAt),
    solves: { ok: num(sv.ok) ?? 0, failed: num(sv.failed) ?? 0, lastOkAt: num(sv.lastOkAt), lastSecs: num(sv.lastSecs), lastSpot: sv.lastSpot === 'centre' || sv.lastSpot === 'left' ? sv.lastSpot : null },
    failuresByStep: fails,
    lastError: err && { at: err.at as number, step: str(err.step) ?? '?', status: num(err.status), cls: str(err.cls) ?? '?' },
    unsynced: num(x.unsynced) ?? 0, lastSeen: x.lastSeen as number
  };
}

/** A GET /its/status answer as the page reads it, or null when it isn't one. The verdict, the time and the settings
 *  must be there; a garbled booking, event or reason is left out. */
export function parseStatus(x: unknown): ItsStatus | null {
  if (!isObj(x) || x.v !== 1 || num(x.now) === null || !VERDICTS.includes(x.verdict as Verdict)) return null;
  const settings = parseSettings(x.settings);
  if (!settings) return null;
  const lease = isObj(x.lease) && num(x.lease.until) !== null ? { holder: str(x.lease.holder) ?? '', host: x.lease.host === 'local' ? 'local' as const : 'actions' as const, until: x.lease.until as number } : null;
  const dispatch = isObj(x.dispatch) && num(x.dispatch.at) !== null ? { at: x.dispatch.at as number, ok: x.dispatch.ok === true, status: num(x.dispatch.status) } : null;
  const c = x.control;
  const control = isObj(c) && (c.action === 'start' || c.action === 'stop') && member(c.by) && num(c.at) !== null ? { action: c.action as RunInput['action'], by: member(c.by)!, at: c.at as number } : null;
  return {
    v: 1, now: x.now as number, mode: x.mode === 'on' ? 'on' : 'off', sha: str(x.sha), verdict: x.verdict as Verdict,
    reasons: strs(x.reasons).filter((r): r is Reason => REASONS.includes(r as Reason)),
    settings, runner: parseRunner(x.runner), lease, dispatch, ...(control ? { control } : {}),
    bookings: Array.isArray(x.bookings) ? x.bookings.map(parseBooking).filter((b): b is BookingEntry => b !== null) : [],
    events: Array.isArray(x.events) ? x.events.map(parseEvent).filter((e): e is ItsEvent => e !== null) : [],
    seen: names(x.seen, MAX_SITE_NAME)
  };
}

/** A call's outcome: the status (every answer carries the current one), or why not: the Worker's error code (`conflict`
 *  for a 409: someone saved since this draft began, with the current status) or the phone's own (offline, timeout,
 *  json, no_key, http). */
export type ItsReply = { ok: true; status: ItsStatus } | { ok: false; err: string; http: number | null; status: ItsStatus | null };
type Op = 'status' | 'settings' | 'run';

/** A Worker's error code as the log may keep it (a short token), else `http`. */
const code = (x: unknown): string => (typeof x === 'string' && /^[a-z_]{1,32}$/.test(x) ? x : 'http');

async function call(op: Op, method: 'GET' | 'PUT' | 'POST', path: string, body: unknown, signal: AbortSignal | undefined, url: string): Promise<ItsReply> {
  const key = getKey();
  if (!key || !url) return { ok: false, err: 'no_key', http: null, status: null };
  const ctl = new AbortController();
  const stop = () => ctl.abort();
  signal?.addEventListener('abort', stop);
  let timedOut = false;
  const timer = setTimeout(() => ((timedOut = true), ctl.abort()), TIMEOUT_MS);
  const t0 = performance.now();
  let r: ItsReply;
  try {
    const res = await fetch(`${url}${path}`, {
      method, signal: ctl.signal, cache: 'no-store',
      headers: { Authorization: `Bearer ${key}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = undefined;
    }
    if (res.ok) {
      const s = parseStatus(json);
      r = s ? { ok: true, status: s } : { ok: false, err: 'json', http: res.status, status: null };
    } else {
      const o = isObj(json) ? json : {};
      r = { ok: false, err: res.status === 409 ? 'conflict' : code(o.error), http: res.status, status: parseStatus(o.status) ?? parseStatus(json) };
    }
  } catch {
    r = { ok: false, err: timedOut ? 'timeout' : 'offline', http: null, status: null };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', stop);
  }
  // leaving the page (its abort) is no failure
  if (!r.ok && !signal?.aborted) {
    log('its.fail', { op, err: r.err, ms: Math.round(performance.now() - t0), ...(r.http === null ? {} : { http: r.http }) }, r.err === 'offline' ? 1 : 2);
  }
  return r;
}

/** GET /its/status. */
export const fetchStatus = (signal?: AbortSignal, url = ITS_URL): Promise<ItsReply> => call('status', 'GET', '/its/status', undefined, signal, url);
/** PUT /its/settings: the draft, from the `updatedAt` it began at. */
export const putSettings = (input: ItsSettingsInput, signal?: AbortSignal, url = ITS_URL): Promise<ItsReply> => call('settings', 'PUT', '/its/settings', input, signal, url);
/** POST /its/run: 開始 or 停止, at once. */
export const postRun = (action: RunInput['action'], signal?: AbortSignal, url = ITS_URL): Promise<ItsReply> => call('run', 'POST', '/its/run', { action } satisfies RunInput, signal, url);
