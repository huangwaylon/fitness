// The gym bot's settings as ボット's ジム tab talks to them (docs/design.md "Bots"; the shapes are the shared
// contract.ts, the Worker's too): the members-only GET /gym/config (the calendar's 25 rows, the check settings, 🔎's
// cooldown, the app's last changes, and 📋's words) and POST /gym/act (a change, the select mode's bulk form, or 🔎).
// Both with this phone's key. The config through lib/keyed.ts (a failure logged as keyed.fail `gym`); an older Worker
// (no route, no rows) or a key it doesn't take hides the section, no error. The act with its own fetch: an
// X-Request-Id the Worker logs (`rid=`) and the refusal's body (the bot's hint, a 409's config, a 429's Retry-After),
// a failure logged as gym.fail `act` with the Worker's code. Answers are checked (contract/guards.ts): garbage is a
// failure, never shown.
import { getKey } from '#lib/sync/storage.ts';
import { keyed } from '#lib/keyed.ts';
import { isNum, isRec, isText } from '#lib/contract/guards.ts';
import { log } from '#lib/sync/log.ts';
import { GYM_URL } from './status.ts';
import {
  INTERVALS, isDay, isSlotClock,
  type ActInput, type Change, type ChangeKind, type DayRow, type GymConfig, type OpenSlot, type Rule, type StatusDay
} from './contract.ts';

export type { GymConfig };

const str = (x: unknown): x is string => isText(x, 2000);
const strOrNull = (x: unknown): string | null | undefined => (x === null ? null : str(x) ? x : undefined);
const numOrNull = (x: unknown): number | null | undefined => (x === null || x === undefined ? null : isNum(x) ? x : undefined);
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const CHANGE_KINDS: readonly string[] = ['any', 'skip', 'range', 'reset', 'from', 'unfrom', 'interval', 'pause', 'resume'];

function parseDay(x: unknown): StatusDay | null {
  if (!isRec(x) || !isDay(x.day) || !str(x.date) || !str(x.rule)) return null;
  const from = strOrNull(x.from ?? null);
  const soft = x.soft ?? false;
  return from === undefined || typeof soft !== 'boolean' ? null : { day: x.day, date: x.date, rule: x.rule, from, soft };
}

function parseRule(x: unknown): Rule | null | undefined {
  if (x === null || x === 'any' || x === 'skip') return x;
  return Array.isArray(x) && x.length === 2 && isSlotClock(x[0]) && isSlotClock(x[1]) ? [x[0], x[1]] : undefined;
}

function parseRow(x: unknown): DayRow | null {
  if (!isRec(x) || !isDay(x.day) || typeof x.usual !== 'boolean' || typeof x.resettable !== 'boolean' || typeof x.base !== 'string' || !Array.isArray(x.announced)) return null;
  const rule = parseRule(x.rule);
  const from = numOrNull(x.from);
  if (rule === undefined || from === undefined || !x.announced.every((c) => typeof c === 'string' && CLOCK.test(c))) return null;
  return { day: x.day, rule, usual: x.usual, from, announced: [...(x.announced as string[])], resettable: x.resettable, base: x.base.slice(0, 12) };
}

/** A change, or null when garbled (left out). */
function parseChange(x: unknown): Change | null {
  if (!isRec(x) || !isNum(x.t) || (x.by !== 'A' && x.by !== 'B') || !CHANGE_KINDS.includes(x.a as string) || !str(x.who) || !str(x.text)) return null;
  if (x.d !== null && !isDay(x.d)) return null;
  return {
    t: x.t, by: x.by, who: x.who.slice(0, 40), a: x.a as ChangeKind, d: x.d as string | null, text: x.text,
    ...(isSlotClock(x.s) && isSlotClock(x.e) ? { s: x.s, e: x.e } : {}), ...(isNum(x.at) ? { at: x.at } : {}), ...(isNum(x.m) ? { m: x.m } : {})
  };
}

/** A /gym/config answer as the page reads it, or null when it isn't one (another version, a proxy's page, garbage, an
 *  older Worker without the rows). All or nothing for the calendar and 📋's words; a garbled change is left out. */
export function parseConfig(x: unknown): GymConfig | null {
  if (!isRec(x) || x.v !== 1 || !isNum(x.now) || !str(x.title) || !str(x.check) || !Array.isArray(x.days) || typeof x.paused !== 'boolean') return null;
  if (!Array.isArray(x.rows) || !x.rows.length || !isNum(x.intervalMin)) return null;
  const days = x.days.map(parseDay);
  const rows = x.rows.map(parseRow);
  const notice = strOrNull(x.notice ?? null);
  const [lastCheck, nextCheck, checkReadyAt] = [numOrNull(x.lastCheck), numOrNull(x.nextCheck), numOrNull(x.checkReadyAt)];
  if (days.some((d) => d === null) || rows.some((r) => r === null) || notice === undefined) return null;
  if (lastCheck === undefined || nextCheck === undefined || checkReadyAt === undefined) return null;
  const intervals = Array.isArray(x.intervals) ? x.intervals.filter((m): m is number => (INTERVALS as readonly unknown[]).includes(m)) : [...INTERVALS];
  return {
    v: 1, now: x.now, title: x.title, days: days as StatusDay[], notice, check: x.check, text: typeof x.text === 'string' ? x.text : '', paused: x.paused,
    intervalMin: x.intervalMin, lastCheck, nextCheck, rows: rows as DayRow[], defaultDays: isNum(x.defaultDays) ? x.defaultDays : 4,
    intervals: intervals.length ? intervals : [...INTERVALS], checkReadyAt, checking: x.checking === true,
    changes: Array.isArray(x.changes) ? x.changes.slice(0, 20).map(parseChange).filter((c): c is Change => c !== null) : []
  };
}

/** A fetch's outcome: the settings, or `hide` (no key, a Worker without the route or the rows, or that won't take the
 *  key), `failed` (a server error, garbage) or `unreached` (no answer: offline, a timeout, or a preflight an older
 *  Worker refused without CORS, which the browser can't tell apart; the caller's abort too, which the page ignores). */
export type ConfigReply = { ok: true; config: GymConfig } | { ok: false; why: 'hide' | 'failed' | 'unreached' };

/** GET /gym/config with this phone's key (lib/keyed.ts: its failure logged as keyed.fail `gym`). Never throws. */
export async function fetchConfig(signal?: AbortSignal, url = GYM_URL, key = getKey()): Promise<ConfigReply> {
  const r = await keyed(url && `${url}/gym/config`, key, { signal, cache: 'no-store' });
  if (!r.ok) return { ok: false, why: r.why === 'unpaired' || r.why === 'refused' ? 'hide' : r.why === 'failed' ? 'failed' : 'unreached' };
  const json: unknown = await r.res.json().catch(() => null);
  const config = parseConfig(json);
  if (config) return { ok: true, config };
  // a Worker from before the calendar: 📋's parts only
  return { ok: false, why: isRec(json) && json.v === 1 && !('rows' in json) ? 'hide' : 'failed' };
}

/** What ジム's settings show after a fetch, given the last good answer: hidden until one comes (an unreached Worker is
 *  most likely an older one, so no error), then a failure keeps it under the retry row; `hide` drops it. */
export function settle(cfg: GymConfig | null, r: ConfigReply): { cfg: GymConfig | null; state: 'hidden' | 'ok' | 'failed' } {
  if (r.ok) return { cfg: r.config, state: 'ok' };
  if (r.why === 'hide' || (r.why === 'unreached' && !cfg)) return { cfg: null, state: 'hidden' };
  return { cfg, state: 'failed' };
}

// ---- POST /gym/act ----

/** An act's outcome: the config after it (🔎: its lines and slots too), or why not: the Worker's code (`stale` with the
 *  config, `cooldown` with the seconds, the bot's `hint` in its words) or the phone's (offline, timeout, json, no_key). */
export type ActReply =
  | { ok: true; changed: boolean; config: GymConfig; lines?: string[]; partial?: boolean; slots?: OpenSlot[] }
  | { ok: false; err: string; http: number | null; hint?: string; config?: GymConfig; retryAfter?: number };

const TIMEOUT_MS = 20_000;
/** The codes the page words itself (the bot's refusals): logged at info, the rest at warn. */
const EXPECTED = new Set(['stale', 'cooldown', 'running', 'paused', 'mode_off', 'offline', 'day_passed', 'bad_range', 'from_passed', 'from_after_day', 'from_after_window']);
const newRid = (): string => Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, '0')).join('');
const code = (x: unknown): string => (typeof x === 'string' && /^[a-z_]{1,32}$/.test(x) ? x : 'http');

function parseSlots(x: unknown): OpenSlot[] {
  if (!Array.isArray(x)) return [];
  return x.filter((s): s is OpenSlot => isRec(s) && isDay(s.day) && isSlotClock(s.start) && isSlotClock(s.end) && Array.isArray(s.programs)).slice(0, 100)
    .map((s) => ({ day: s.day, start: s.start, end: s.end, programs: s.programs.filter((p) => p === 'training' || p === 'pilates') }));
}

/** POST /gym/act with this phone's key. Never throws; the caller's abort is no failure (an act passes none:
 *  components/bots/gymActs.svelte.ts; 今すぐ確認 the page's life). */
export async function postAct(input: ActInput, signal?: AbortSignal, url = GYM_URL, key = getKey()): Promise<ActReply> {
  if (!key || !url) return { ok: false, err: 'no_key', http: null };
  if (signal?.aborted) return { ok: false, err: 'aborted', http: null }; // (a dead signal sends nothing)
  const rid = newRid();
  const ctl = new AbortController();
  const stop = () => ctl.abort();
  signal?.addEventListener('abort', stop);
  let timedOut = false;
  const timer = setTimeout(() => ((timedOut = true), ctl.abort()), TIMEOUT_MS);
  const t0 = performance.now();
  let r: ActReply;
  try {
    const res = await fetch(`${url}/gym/act`, {
      method: 'POST', signal: ctl.signal, cache: 'no-store', body: JSON.stringify(input),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Request-Id': rid }
    });
    const json: unknown = await res.json().catch(() => undefined);
    const o = isRec(json) ? json : {};
    const config = parseConfig(o.config) ?? undefined;
    if (res.ok && o.ok === true && config) {
      r = {
        ok: true, changed: o.changed === true, config,
        ...(Array.isArray(o.lines) ? { lines: o.lines.filter((l): l is string => typeof l === 'string').slice(0, 200), partial: o.partial === true, slots: parseSlots(o.slots) } : {})
      };
    } else {
      const retry = Number(res.headers.get('Retry-After'));
      r = {
        ok: false, err: res.ok ? 'json' : code(o.error), http: res.status, ...(str(o.hint) ? { hint: o.hint } : {}), ...(config ? { config } : {}),
        ...(retry > 0 ? { retryAfter: retry } : {})
      };
    }
  } catch {
    r = { ok: false, err: timedOut ? 'timeout' : 'offline', http: null };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', stop);
  }
  if (!r.ok && !signal?.aborted) {
    log('gym.fail', { op: 'act', err: r.err, rid, ms: Math.round(performance.now() - t0), ...(r.http === null ? {} : { http: r.http }) }, EXPECTED.has(r.err) ? 1 : 2);
  }
  return r;
}
