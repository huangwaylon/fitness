// The log's events (docs/ops/observability.md): one schema for the phones (sync/log.ts) and the relay (relay/src/log.ts,
// the `IslandLog` object), versioned (`LOG_V`). Every event is a name from `LOG_EVENTS` and a payload of only that
// name's fields, each of its kind: a bounded number, a boolean, a value from a closed set, a short token (never a run
// of hex or of letters and digits long enough to be a key), and a JS error's scrubbed message and stack. The relay
// keeps nothing else, whatever a phone sends: no key, no health value, no food name, no free text, no URL. Pure.
import { EVENT_TYPES } from './api.ts';

/** @public (relay/src/log.ts) */
export const LOG_V = 1;

/** 0 debug · 1 info · 2 warn · 3 error. @public (relay/src/log.ts) */
export type LogLevel = 0 | 1 | 2 | 3;

/** The record's API actions (relay/src/store.ts route), and `other`. @public (relay/src/reqMeta.ts) */
export const LOG_ACTIONS = ['health', 'ingest', 'event', 'events', 'snapshot', 'uploads', 'whoami', 'other'] as const;
/** A request's outcome: `ok`, the record's error codes, the phone's own (`offline`, `http`, `json`), `none` (no answer). @public (relay/src/reqMeta.ts) */
export const LOG_STATUS = ['ok', 'unauthorized', 'forbidden', 'bad_request', 'too_large', 'busy', 'unavailable', 'offline', 'http', 'json', 'none'] as const;
/** The app's routes (their first segment). */
export const LOG_ROUTES = ['/', '/pair', '/tent', '/shop', '/museum', '/jar', '/editor', '/dev', '/world3d', 'other'] as const;
/** The island's sheets, as `perf.sheet` names them (ui-state/sheetTiming.ts). */
const LOG_SHEETS = ['food', 'health', 'travel', 'wedding', 'hiking', 'kikimimi', 'panel', 'zukan', 'settings', 'other'] as const;
const EV_TYPES = [...EVENT_TYPES, 'other'] as const;

/** A field's kind: `n` a number (rounded to 0.1, within ±1e7), `b` a boolean, `t` a token, a closed set (an array),
 *  `msg` / `stack` scrubbed text. */
type Kind = 'n' | 'b' | 't' | 'msg' | 'stack' | readonly string[];
/** `*`: counters (`use`): `sheet:` · `ev:` · `route:` · `act:` and a token, at most 40 of them, each a number. */
type Fields = Readonly<Record<string, Kind>>;

const API = { action: LOG_ACTIONS, err: LOG_STATUS, http: 'n', ms: 'n', tries: 'n' } as const;
/**
 * The registry: each event's fields. `c` a phone's, `r` the relay's own (a phone can't send those).
 */
// (the dotted names in double quotes: they are not i18n keys, which usage.test reads in single quotes)
export const LOG_EVENTS = {
  // ---- the phones
  "app.open": { src: 'c', f: { nav: ['navigate', 'reload', 'back_forward', 'prerender', 'other'], route: LOG_ROUTES, pwa: 'b', w: 'n', h: 'n', dpr: 'n', crashed: 'b', lt: 'b', q: 'n', qAgeS: 'n', fpsPref: 'n' } },
  "app.ready": { src: 'c', f: { ms: 'n', route: LOG_ROUTES } },
  "app.show": { src: 'c', f: { awayS: 'n', route: LOG_ROUTES } },
  "app.reload": { src: 'c', f: { why: ['update', 'chunk', 'stale', 'other'] } },
  "perf.frames": { src: 'c', f: { p50: 'n', p95: 'n', fps: 'n', long: 'n', drawFps: 'n', hz: 'n', mode: ['3d', 'none'], when: ['ready', 'show'] } },
  // a sheet's opening (ui-state/sheetTiming.ts), ms from the tap: its chunk in and the dialog shown (`chunk`), the last
  // change inside it (`content`), its open animation's end (`anim`); the longest frame in that time (`long`) and those
  // over 33 ms (`slow`); its first opening this load, or a kept one shown again (`kept`). Every first, a share of the rest
  "perf.sheet": { src: 'c', f: { sheet: LOG_SHEETS, first: 'b', kept: 'b', chunk: 'n', content: 'n', anim: 'n', long: 'n', slow: 'n' } },
  "js.error": { src: 'c', f: { kind: ['error', 'rejection'], msg: 'msg', stack: 'stack', src: 't', n: 'n', leaving: 'b', route: LOG_ROUTES } },
  "api.fail": { src: 'c', f: API },
  "api.ok": { src: 'c', f: API },
  "auth.lost": { src: 'c', f: { from: ['refresh', 'flush', 'ws'], code: 'n' } },
  "sync.fail": { src: 'c', f: { err: LOG_STATUS, cached: 'b' } },
  "queue.retry": { src: 'c', f: { type: EV_TYPES, err: LOG_STATUS, tries: 'n', n: 'n' } },
  "queue.drop": { src: 'c', f: { type: EV_TYPES, err: LOG_STATUS, tries: 'n' } },
  "ws.open": { src: 'c', f: { ms: 'n', retries: 'n' } },
  // why: sync/live.ts CloseWhy; quiet: s since the socket last heard anything; rtt: its shortest ping round trip (ms)
  "ws.close": { src: 'c', f: { code: 'n', secs: 'n', welcomed: 'b', why: ['hidden', 'offline', 'stale', 'late', 'stuck', 'rekey', 'stop', 'closed'], quiet: 'n', rtt: 'n' } },
  "ws.park": { src: 'c', f: { code: 'n' } },
  "ws.unacked": { src: 'c', f: { kind: 't', tries: 'n' } },
  "gl.lost": { src: 'c', f: { where: ['island', 'tent', 'other'], restored: 'b' } },
  "chunk.fail": { src: 'c', f: { reloaded: 'b' } },
  // the installed app's storage kept from eviction (sync/persist.ts: asked once): granted, already so, and the quota's MB
  "storage.persist": { src: 'c', f: { ok: 'b', was: 'b', useMb: 'n', quotaMb: 'n' } },
  "storage.fail": { src: 'c', f: { store: ['ls', 'idb', 'log'], kind: ['full', 'unavailable', 'blocked', 'other'] } },
  use: { src: 'c', f: { '*': 'n' } },
  "log.drop": { src: 'c', f: { n: 'n', why: ['cap', 'full', 'day', 'pending'] } },
  // ききみみ's mic probe (docs/kikimimi-mic.md §1.1): numbers and closed sets only, never heard text
  "mic.env": { src: 'c', f: { pwa: 'b', coi: 'b', gpu: 'b', gpuW: 'b', f16: 'b', arch: 't', wks: 'b', ses: 'b', mr: ['mp4', 'webm', 'none'], wl: 'b' } },
  "mic.perm": { src: 'c', f: { st: ['granted', 'denied', 'prompt', 'unsupported'], ms: 'n', again: 'b', asked: 'b', ec: 'b', sr: 'n', inp: ['builtin', 'bluetooth', 'wired', 'other'] } },
  "mic.duplex": { src: 'c', f: { ear: ['none', 'wired', 'bluetooth'], aec: 'b', bleed: 'n', rtl: 'n', loud: ['none', 'quiet', 'ok'], pick: 'b', restored: 'b', err: 't' } },
  "mic.stt": { src: 'c', f: { be: ['whisper-gpu', 'whisper-wasm', 'webkit', 'relay'], model: ['tiny.en', 'base.en', 'tiny.en-f16', 'turbo', 'none'], step: ['dl', 'load', 'clip', 'spoken'], ms: 'n', mb: 'n', audS: 'n', wer: 'n', ok: 'b', err: ['not-allowed', 'service-not-allowed', 'network', 'no-speech', 'aborted', 'audio-capture', 'oom', 'timeout', 'other'] } },
  // ---- the relay
  req: { src: 'r', f: { action: LOG_ACTIONS, st: LOG_STATUS, ms: 'n', inB: 'n', outB: 'n', n: 'n', rej: 'n', why: 't', m: 'n', sk: 'n', w: 'n', dup: 'n', exc: 't', pg: 'n' } },
  "room.close": { src: 'r', f: { code: 'n', secs: 'n', socks: 'n' } },
  "room.full": { src: 'r', f: { socks: 'n' } },
  // rep: that person's sockets the hello replaced (a phone back before the room saw its old socket go: the others
  // hear no presence off and on)
  "ws.hello": { src: 'r', f: { v: 'n', build: 't', rep: 'n' } },
  "cron.wx": { src: 'r', f: { ok: 'b', fetched: 'b', fail: 't', hours: 'n', age: 'n', ms: 'n' } },
  "cron.compact": { src: 'r', f: { dates: 'n', deleted: 'n', more: 'b', metrics: 'n', ms: 'n' } },
  "do.error": { src: 'r', f: { where: 't', name: 't', msg: 'msg' } },
  "store.corrupt": { src: 'r', f: { where: ['spend', 'board', 'food', 'tally', 'shop', 'decor', 'pack'] } },
  admin: { src: 'r', f: { op: 't', st: 't' } },
  "log.cap": { src: 'r', f: { bucket: 't' } },
  // `POST /stt` (relay/src/sttRoute.ts): sizes and times, never the audio or its text
  stt: { src: 'r', f: { ms: 'n', inB: 'n', model: ['turbo'], ok: 'b', err: ['off', 'too_large', 'bad_request', 'capped', 'ai'] } }
} as const satisfies Record<string, { src: 'c' | 'r'; f: Fields }>;

export type LogEventName = keyof typeof LOG_EVENTS;
export type LogData = Record<string, number | boolean | string>;

/** A token: an enum value, a rule's name, a file's. At most 40 of [A-Za-z0-9_.:/-], and never 16 or more letters
 *  and digits in a row (a key, or a piece of one; an id). */
const TOKEN = /^[A-Za-z0-9_.:/-]{1,40}$/;
const LONGRUN = /[0-9A-Za-z]{16,}/;
export const isToken = (v: unknown): v is string => typeof v === 'string' && TOKEN.test(v) && !LONGRUN.test(v);
/** A counter's name (`use`): its kind and a token. */
const COUNTER = /^(sheet|ev|route|act):[A-Za-z0-9_.-]{1,32}$/;
/** A session, request or batch id: 6–15 of [0-9a-z] (never long enough to hold a key). */
const ID = /^[0-9a-z]{6,15}$/;
export const isLogId = (v: unknown): v is string => typeof v === 'string' && ID.test(v);
/** @public (relay/src/log.ts) */
export const isLogEvent = (e: unknown): e is LogEventName => typeof e === 'string' && Object.hasOwn(LOG_EVENTS, e);

/** Quoted text kept when it reads as code (`'e.stats().fps'`, Safari's `evaluating '…'`): no blank, a `.` or a `(`. */
const CODE = /^[\w$.()[\]#]{1,60}$/;

/**
 * A JS error's message as its fingerprint, scrubbed in this order (each step sees the last's output): a URL →
 * `<url>`; an e-mail → `<email>`; a query or fragment (`?…`, `#key=…`) cut; 16+ letters and digits (a key, an id) → `<id>`; quoted text →
 * `"…"` unless it reads as code; `{…}` / `[…]` → `{…}`; non-ASCII runs (Japanese, a food's name) → `…`; numbers (a
 * weight, a step count) → `#`; blanks folded; at most 120 characters. The same bug gives the same message.
 */
export function scrubMsg(s: unknown): string {
  return String(s ?? '')
    .replace(/\b[a-z][a-z0-9+.-]*:\/\/\S*/gi, '<url>')
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '<email>')
    // (a fragment is `#` and a word with = / & after it: never the `#` this leaves for a number, so a second pass, the
    // relay's, changes nothing)
    .replace(/\?\S*|#(?=[A-Za-z_][\w-]*[=/&])\S*/g, '')
    .replace(/[0-9A-Za-z+/=_-]{16,}/g, '<id>')
    .replace(/(["'`])([^"'`]{0,400}?)\1/g, (_, q: string, x: string) => (CODE.test(x) && /[.(]/.test(x) ? `${q}${x}${q}` : '"…"'))
    .replace(/\{[^{}]{0,400}\}|\[[^[\]]{0,400}\]/g, '{…}')
    .replace(/[^\x20-\x7e]+/g, '…')
    .replace(/\d+(?:[.,]\d+)?/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

/** A file's name from a URL or path (the hashed chunk's): its query and fragment cut first (`/pair#key=…`). */
export const baseName = (u: string): string => (u.split(/[?#]/)[0].split('/').pop() ?? '').replace(/[^\w.-]/g, '').slice(0, 60);

/**
 * A stack as its top `n` frames, `fn@file:line:col` (the file's base name), from Safari's `fn@url:l:c` lines and
 * Chrome's `at fn (url:l:c)`: no message, no URL's query or fragment, nothing else.
 */
export function scrubStack(s: unknown, n = 4): string {
  const out: string[] = [];
  for (const line of String(s ?? '').split('\n')) {
    const m = /^\s*(?:at\s+)?(?:(.*?)\s*[@(]\s*)?([a-z][a-z0-9+.-]*:[^\s)]*?|[\w./-]+\.(?:js|ts|svelte|mjs)):(\d+):(\d+)\)?\s*$/i.exec(line);
    if (!m) continue;
    const fn = /^[\w$.<>]{1,40}$/.test(m[1] ?? '') ? m[1] : '?';
    out.push(`${fn}@${baseName(m[2]) || '?'}:${m[3]}:${m[4]}`);
    if (out.length >= n) break;
  }
  return out.join('\n');
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.round(Math.max(-1e7, Math.min(1e7, v)) * 10) / 10 : null);

/** One field of an event as kept: its kind's value, or undefined (dropped). */
function field(kind: Kind, v: unknown): number | boolean | string | undefined {
  if (Array.isArray(kind)) return typeof v === 'string' && kind.includes(v) ? v : undefined;
  switch (kind) {
    case 'n': return num(v) ?? undefined;
    case 'b': return typeof v === 'boolean' ? v : undefined;
    case 't': return isToken(v) ? v : undefined;
    case 'msg': return typeof v === 'string' ? scrubMsg(v) || undefined : undefined;
    case 'stack': return typeof v === 'string' ? scrubStack(v) || undefined : undefined;
  }
  return undefined;
}

/** An event's payload as the log keeps it: only its registry's fields, each of its kind; the rest dropped. */
export function cleanData(e: LogEventName, d: unknown): LogData {
  const out: LogData = {};
  if (!d || typeof d !== 'object' || Array.isArray(d)) return out;
  const f: Fields = LOG_EVENTS[e].f;
  let counters = 0;
  for (const [k, v] of Object.entries(d as Record<string, unknown>)) {
    const own = Object.hasOwn(f, k) && k !== '*';
    const kind = own ? f[k] : f['*'] && COUNTER.test(k) && !LONGRUN.test(k) && counters < 40 ? f['*'] : undefined;
    if (!kind) continue;
    const x = field(kind, v);
    if (x === undefined) continue;
    out[k] = x;
    if (!own) counters++;
  }
  return out;
}

/** A level from anything (else info). @public (relay/src/log.ts) */
export const levelOf = (l: unknown): LogLevel => (l === 0 || l === 1 || l === 2 || l === 3 ? l : 1);

/** The route's first segment, as the log names it (never the query or the fragment: `/pair#key=…`). */
export function logRoute(path: string): (typeof LOG_ROUTES)[number] {
  const r = `/${path.split(/[?#]/)[0].split('/').filter(Boolean)[0] ?? ''}`;
  return (LOG_ROUTES as readonly string[]).includes(r) ? (r as (typeof LOG_ROUTES)[number]) : 'other';
}

/** A phone's event as it sends it (the batch's `es`): its clock, level, name, sequence in the session, request id, payload. */
export interface LogEventIn {
  t: number;
  l: LogLevel;
  e: LogEventName;
  /** The session's sequence number (an order when the clock jumps). */
  q: number;
  /** A request id (`api.*`: the `rid` the request carried). */
  r?: string;
  d?: LogData;
}

/** A phone's batch (`POST /log`): who (the key: the relay keeps only the role), the batch id, the session, the build. */
export interface LogBatch {
  v: typeof LOG_V;
  key: string;
  b: string;
  s: string;
  build: string;
  os: string;
  es: LogEventIn[];
}

/** At most this many events in a batch, and characters in its body (a keepalive fetch takes ≤ 64 KB in flight). @public (relay/src/log.ts) */
export const LOG_BATCH_MAX = 50, LOG_BODY_MAX = 32_000;
