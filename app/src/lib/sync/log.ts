// The phone's log (docs/ops/observability.md): structured events (contract/log.ts's registry) kept in a bounded ring,
// persisted, batched to the relay's `/log` and acknowledged by batch id.
// - `log()` only pushes onto the ring: no I/O, no JSON, never in the render loop. The ring holds RING_MAX events and
//   evicts the oldest of the lowest level first (debug, info, warn; an error only when nothing else is left), keeping
//   the PIN events before each error (the trail that explains it). Caps: SESSION_MAX a session (SESSION_ERRORS errors,
//   one message folded into `n`), DAY_MAX a day on this phone; what is dropped is counted (`log.drop`).
// - Persisted to localStorage (`island.log`, ≤ PERSIST_MAX characters: the errors and warnings first) when idle, and at
//   once when the page is hidden, left or reloaded by the app; read back on the next load, so a killed page loses
//   nothing it had. A quota error drops the log, never the user's data (no storage banner for it).
// - Flushed FLUSH_MS after the first event (FLUSH_ERROR_MS after an error), at FLUSH_AT events, and when hidden (with
//   `keepalive`: the unacked batches at once, ≤ KEEPALIVE_MAX in flight); never at once on a show. A batch stays stored until the relay acks its id; a re-sent one is
//   dropped there (`dup`). Failure: backoff 5 s → 5 min; offline: wait for `online`. A capped day (`closed`): only
//   errors until it reopens.
// - Off in the demo and under automation (unless `?log=on`); unpaired, it keeps its events until there is a key.
import {
  baseName, cleanData, isLogId, logRoute, LOG_BATCH_MAX, LOG_BODY_MAX, LOG_EVENTS, LOG_V,
  type LogBatch, type LogData, type LogEventIn, type LogEventName, type LogLevel, type LogSheet
} from '#lib/contract/log.ts';
import { localDateAt } from '#lib/contract/tokyo.ts';
import { getKey, LIVE } from './storage.ts';
import { quietSink } from '#lib/quiet.ts';
import { keyedSink } from '#lib/keyed.ts';

type Ev = LogEventIn & { pin?: true };
/** The relay's answer to a batch. */
type Reply = { ok?: boolean; error?: string; closed?: number; dup?: boolean };
interface Pending { b: string; s: string; build: string; os: string; es: LogEventIn[] }
interface Saved { v: 1; s: string; build: string; os: string; ring: Ev[]; pending: Pending[]; day: { d: string; n: number } }

export const RING_MAX = 300, SESSION_MAX = 600, SESSION_ERRORS = 50, DAY_MAX = 1_500, PIN = 15;
const PERSIST_MAX = 24_000, PENDING_MAX = 3, FLUSH_MS = 30_000, FLUSH_ERROR_MS = 5_000, FLUSH_AT = 50, IDLE_MS = 2_000;
const BACKOFF_MIN = 5_000, BACKOFF_MAX = 300_000;
/** The bodies sent at once as the page goes (WebKit's keepalive budget: 64 KB in flight). */
const KEEPALIVE_MAX = 60_000;
/** One error's events a session (the same message and frame; past it only dropped, counted): a handler throwing every
 *  frame says so a few times, not 50. */
const FP_MAX = 5;
/** An import failure this soon after a chunk.fail is that one (Safari's unhandled 「Importing a module script failed.」). */
const CHUNK_ERR_MS = 5_000;
const IMPORT_FAIL = /Importing a module script failed|dynamically imported module|error loading dynamically imported/i;
/** `api.ok`'s share kept (the relay logs every request; the phone's view of the time is a sample). */
export const API_OK_SAMPLE = 0.1;
const NOISE = /^(Script error\.?|ResizeObserver loop)/;

interface Env {
  fetch: typeof fetch;
  kv: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
  now(): number;
  rand(): number;
  url: string;
  key(): string | null;
}
const env: Env = {
  fetch: (...a) => fetch(...a),
  kv: typeof localStorage !== 'undefined' ? localStorage : null,
  now: () => Date.now(),
  rand: Math.random,
  url: '',
  key: getKey
};

/** A short random id (session, request, batch): 10 of [0-9a-z]. */
export function logId(): string {
  const a = new Uint8Array(10);
  typeof globalThis.crypto?.getRandomValues === 'function' ? crypto.getRandomValues(a) : a.forEach((_, i) => (a[i] = Math.floor(env.rand() * 256)));
  return Array.from(a, (x) => (x % 36).toString(36)).join('');
}

const st = {
  on: false,
  sid: logId(),
  q: 0,
  build: 'dev',
  os: 'other',
  ring: [] as Ev[],
  pending: [] as Pending[],
  counters: new Map<string, number>(),
  n: 0,
  errors: 0,
  dropped: { cap: 0, full: 0, day: 0, pending: 0 },
  day: { d: '', n: 0 },
  folded: new Map<string, Ev>(),
  /** Each error's events this session (FP_MAX). */
  fps: new Map<string, number>(),
  /** The last chunk.fail (its file's repeats folded into `n` while unsent), and when. */
  chunk: null as Ev | null,
  chunkAt: 0,
  /** The app's route now (startLog's): js.error's `route` when the caller gave none. */
  route: (): string | undefined => undefined,
  closedUntil: 0,
  tries: 0,
  nextTry: 0,
  sending: false,
  timer: null as ReturnType<typeof setTimeout> | null,
  idle: null as ReturnType<typeof setTimeout> | null,
  dirty: false
};

/** This app session's id (sent with each `/api` request as `sid`). */
export const sessionId = (): string => st.sid;
/** Whether the log is on (started, not the demo or automation). */
export const logOn = (): boolean => st.on;

/** The phone's day for DAY_MAX: Tokyo's, as every day in the app (the UTC date reopened it at 09:00). */
const today = () => localDateAt(env.now());

/** Tests: the environment, and a fresh state. */
/** The page is going: a pagehide, or the app's own reload (ui-state/reload.ts safeReload). Imports in flight are cut
 *  off by the navigation (13:52 on 11-11: 4 chunk.fail and a js.error 256 ms after an update's reload): no chunk.fail
 *  then, and an error is a warning `leaving`. */
const isLeaving = { now: false };
export const markLeaving = (): void => void (isLeaving.now = true);
/** Whether the page is going (markLeaving, a pagehide): nothing more is asked of the network (ui-state/reload.ts). */
export const leavingNow = (): boolean => isLeaving.now;

export function configureLog(o: Partial<Env> & { reset?: boolean; on?: boolean }): void {
  const { reset, on, ...rest } = o;
  Object.assign(env, rest);
  if (reset) {
    Object.assign(st, { sid: logId(), q: 0, ring: [], pending: [], counters: new Map(), n: 0, errors: 0, dropped: { cap: 0, full: 0, day: 0, pending: 0 }, day: { d: '', n: 0 }, folded: new Map(), fps: new Map(), chunk: null, chunkAt: 0, closedUntil: 0, tries: 0, nextTry: 0, sending: false, dirty: false });
    sheets.length = 0;
    if (st.timer) clearTimeout(st.timer);
    if (st.idle) clearTimeout(st.idle);
    st.timer = st.idle = null;
    isLeaving.now = false;
  }
  if (on !== undefined) st.on = on;
}

/** The open timed sheets, the topmost last (Sheet.svelte): the error events' `sheet`. */
const sheets: LogSheet[] = [];
/** A timed sheet shown (Sheet.svelte, while open); the returned call: it closed. */
export function sheetShown(s: LogSheet): () => void {
  sheets.push(s);
  return () => {
    const i = sheets.lastIndexOf(s);
    if (i >= 0) sheets.splice(i, 1);
  };
}
/** The events that say where they happened (contract/log.ts AT), but perf.sheet, which names its own. */
const AT = new Set(Object.entries(LOG_EVENTS).filter(([e, x]) => 'sheet' in x.f && e !== 'perf.sheet').map(([e]) => e));

/** The ring's next victim: the oldest unpinned of the lowest level, then the oldest pinned, then the oldest error. */
function evict(): void {
  for (let l = 0; l < 3; l++) {
    const i = st.ring.findIndex((e) => e.l === l && !e.pin);
    if (i >= 0) return void st.ring.splice(i, 1);
  }
  const i = st.ring.findIndex((e) => e.l < 3);
  st.ring.splice(i >= 0 ? i : 0, 1);
}

/**
 * An event (contract/log.ts: only its registry's fields are kept, on the phone as on the relay). `sample`: the share
 * kept (`api.ok`). `r`: the request id. Cheap: no I/O, no JSON.
 */
export function log(e: LogEventName, d: Record<string, unknown> = {}, l: LogLevel = 1, o: { r?: string; sample?: number } = {}): void {
  if (!st.on) return;
  if (o.sample !== undefined && env.rand() >= o.sample) return;
  const day = today();
  if (st.day.d !== day) st.day = { d: day, n: 0 };
  if (l < 3 ? st.n >= SESSION_MAX : st.errors >= SESSION_ERRORS) return void st.dropped.cap++;
  if (l < 3 && st.day.n >= DAY_MAX) return void st.dropped.day++;
  st.n++;
  st.day.n++;
  if (l === 3) st.errors++;
  if (sheets.length && AT.has(e) && d.sheet === undefined) d = { ...d, sheet: sheets.at(-1) };
  const ev: Ev = { t: env.now(), l, e, q: ++st.q, d: cleanData(e, d), ...(isLogId(o.r) ? { r: o.r } : {}) };
  if (l === 3) for (const x of st.ring.slice(-PIN)) x.pin = true;
  st.ring.push(ev);
  while (st.ring.length > RING_MAX) {
    evict();
    st.dropped.full++;
  }
  changed(l === 3 ? FLUSH_ERROR_MS : FLUSH_MS);
}

/**
 * A thrown thing or a rejection as `js.error` (folded: the same message and frame, while unsent, counts up `n`; at most
 * FP_MAX events of one a session). `tag`: the code that caught it (quiet.ts caught), its `src`. An import cut off as
 * the page goes, or the one a chunk.fail just said, is counted only.
 */
export function logError(kind: 'error' | 'rejection', err: unknown, src?: { file?: string; line?: number; route?: string; leaving?: boolean; tag?: string }): void {
  if (!st.on) return;
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : typeof err === 'string' ? err : String((err as { message?: unknown } | null)?.message ?? err);
  if (NOISE.test(msg)) return;
  const gone = !!src?.leaving || isLeaving.now;
  if (IMPORT_FAIL.test(msg) && (gone || env.now() - st.chunkAt < CHUNK_ERR_MS)) return count(`swallow:import.${gone ? 'leaving' : 'chunk'}`);
  const stack = err instanceof Error ? (err.stack ?? '') : '';
  const fp = `${msg}|${stack.split('\n')[0] ?? ''}|${src?.file ?? src?.tag ?? ''}`;
  const had = st.folded.get(fp);
  if (had && st.ring.includes(had)) {
    had.d = { ...had.d, n: Number(had.d?.n ?? 1) + 1 };
    return;
  }
  const seen = st.fps.get(fp) ?? 0;
  if (seen >= FP_MAX) return void st.dropped.cap++;
  st.fps.set(fp, seen + 1);
  log('js.error', {
    kind, msg, stack, n: 1, route: src?.route ?? st.route(),
    ...(src?.file ? { src: `${baseName(src.file)}:${src.line ?? 0}` } : src?.tag ? { src: src.tag } : {}),
    ...(src?.leaving ? { leaving: true } : {})
  }, src?.leaving ? 2 : 3);
  const last = st.ring.at(-1);
  if (last?.e === 'js.error') st.folded.set(fp, last);
}

/** A chunk that didn't load (`vite:preloadError`'s error: it names the file on Chrome, not on Safari) as one chunk.fail
 *  an incident, a file's repeats while unsent folded into `n`. None as the page goes (the navigation cut it off). */
function logChunk(err: unknown): void {
  if (!st.on || isLeaving.now) return;
  const m = /([\w.-]+\.(?:js|css))\b/.exec(String((err as { message?: unknown } | null)?.message ?? err ?? ''));
  const file = m ? baseName(m[1]) : undefined;
  st.chunkAt = env.now();
  const had = st.chunk;
  if (had && st.ring.includes(had) && had.d?.file === file) return void (had.d = { ...had.d, n: Number(had.d?.n ?? 1) + 1 });
  log('chunk.fail', { ...(file ? { file } : {}), n: 1 }, 2);
  const last = st.ring.at(-1);
  st.chunk = last?.e === 'chunk.fail' ? last : null;
}

/** A sheet's chunk failed to load (components/island/sheetChunks.ts): the chunk.fail just logged for it, if it says
 *  no sheet, names it (Safari's names no file, and no sheet is open yet then). */
export function chunkSheet(sheet: LogSheet): void {
  const ev = st.chunk;
  if (ev && st.ring.includes(ev) && ev.d?.sheet === undefined && env.now() - st.chunkAt < CHUNK_ERR_MS) ev.d = { ...ev.d, sheet };
}

/** A usage counter (`sheet:<id>`, `route:<route>`, `act:<what>`, `swallow:<tag>`): summed, sent as one `use` a flush. */
export function count(key: string): void {
  if (!st.on) return;
  st.counters.set(key, (st.counters.get(key) ?? 0) + 1);
}
// (quiet.ts's swallowed failures, `swallow:<tag>`, and its caught bugs, js.error from `tag`)
quietSink((tag) => count(`swallow:${tag}`), (e, tag) => logError('error', e, { tag }));
// (keyed.ts's failures: one keyed.fail an incident by endpoint and kind, its repeats folded into `n` while unsent)
const keyedEvs = new Map<string, Ev>();
keyedSink((url, why, http) => {
  if (!st.on) return;
  const path = url.split(/[?#]/)[0];
  const ep = /\/stt$/.test(path) ? 'stt' : /\/gym\/config$/.test(path) ? 'gym' : 'other';
  const had = keyedEvs.get(`${ep}|${why}`);
  if (had && st.ring.includes(had)) return void (had.d = { ...had.d, n: Number(had.d?.n ?? 1) + 1 });
  log('keyed.fail', { ep, why, n: 1, ...(http ? { http } : {}) }, why === 'unreached' ? 1 : 2);
  const last = st.ring.at(-1);
  if (last?.e === 'keyed.fail') keyedEvs.set(`${ep}|${why}`, last);
});

// ---------------------------------------------------------------- persistence

function changed(flushIn: number): void {
  st.dirty = true;
  if (!st.idle) st.idle = setTimeout(() => ((st.idle = null), persistLog()), IDLE_MS);
  if (st.ring.length >= FLUSH_AT) return void schedule(0);
  schedule(flushIn);
}

/** Write the ring and the unacked batches now (hidden, leaving, a reload): errors and warnings first, then the newest. */
export function persistLog(): void {
  if (!st.dirty || !env.kv) return;
  st.dirty = false;
  const keep = (ring: Ev[]): Ev[] => {
    const loud = ring.filter((e) => e.l >= 2), quiet = ring.filter((e) => e.l < 2).slice(-100);
    return [...loud, ...quiet].sort((a, b) => a.q - b.q);
  };
  let ring = keep(st.ring);
  const save = (r: Ev[]): string => JSON.stringify({ v: 1, s: st.sid, build: st.build, os: st.os, ring: r, pending: st.pending, day: st.day } satisfies Saved);
  let text = save(ring);
  while (text.length > PERSIST_MAX && ring.length) {
    ring = ring.slice(Math.ceil(ring.length / 4));
    text = save(ring);
  }
  try {
    env.kv.setItem(LIVE.log, text);
  } catch {
    // full or blocked: the log goes first, never the user's data (no banner)
    try {
      env.kv.removeItem(LIVE.log);
    } catch {
      /* nothing to do */
    }
  }
}

/** The last session's ring (a batch of its own, its session's id) and unacked batches, and today's count. */
export function restoreLog(): void {
  let saved: Saved | null = null;
  try {
    const x = JSON.parse(env.kv?.getItem(LIVE.log) ?? 'null') as Saved | null;
    saved = x && x.v === 1 && Array.isArray(x.ring) && Array.isArray(x.pending) ? x : null;
  } catch {
    saved = null;
  }
  if (!saved) return;
  const all = [...saved.pending];
  for (let i = 0; i < saved.ring.length; i += LOG_BATCH_MAX) {
    all.push({ b: logId(), s: saved.s, build: saved.build, os: saved.os, es: saved.ring.slice(i, i + LOG_BATCH_MAX).map(({ pin: _p, ...e }) => e) });
  }
  // (past PENDING_MAX the oldest go, their events counted: log.drop pending)
  for (const x of all.slice(0, -PENDING_MAX)) st.dropped.pending += x.es.length;
  st.pending = all.slice(-PENDING_MAX);
  if (saved.day?.d === today()) st.day = saved.day;
  st.dirty = true;
}

/** Paired as someone else: the old person's events are not the new one's to send. */
export function clearLog(): void {
  st.ring = [];
  st.pending = [];
  st.counters.clear();
  st.folded.clear();
  try {
    env.kv?.removeItem(LIVE.log);
  } catch {
    /* nothing to do */
  }
}

// ---------------------------------------------------------------- sending

function schedule(ms: number): void {
  if (!st.on) return;
  const at = Math.max(env.now() + ms, st.nextTry);
  if (st.timer) return;
  st.timer = setTimeout(() => {
    st.timer = null;
    void flushLog();
  }, Math.max(0, at - env.now()));
}

/** The counters and the drops as events (once a flush). */
function gather(): void {
  if (st.counters.size) {
    const d: LogData = {};
    for (const [k, v] of [...st.counters].slice(0, 40)) d[k] = v;
    st.counters.clear();
    st.ring.push({ t: env.now(), l: 1, e: 'use', q: ++st.q, d: cleanData('use', d) });
  }
  for (const [why, n] of Object.entries(st.dropped)) {
    if (!n) continue;
    st.ring.push({ t: env.now(), l: 2, e: 'log.drop', q: ++st.q, d: { n, why } });
    st.dropped[why as keyof typeof st.dropped] = 0;
  }
}

/** The ring's oldest events as a batch (≤ LOG_BATCH_MAX, ≤ LOG_BODY_MAX), onto the unacked list. */
function cut(): void {
  if (!st.ring.length) return;
  // a capped day: only errors until it opens
  if (st.closedUntil > env.now()) st.ring = st.ring.filter((e) => e.l === 3);
  // PENDING_MAX unacked (offline, or replies lost): the newest takes more when it's this session's, a new id (the relay
  // may have taken it); else the ring waits, persisted with the page (dropping the oldest lost ~10 batches a day). The
  // trade: if the relay did take the old id (its ack lost), that batch's events land twice. Rare (3 unacked: offline)
  // and accepted.
  const last = st.pending.length >= PENDING_MAX ? st.pending.at(-1)! : null;
  if (last && (last.s !== st.sid || last.build !== st.build || last.os !== st.os)) return;
  const es: LogEventIn[] = last ? [...last.es] : [];
  let size = es.reduce((n, e) => n + JSON.stringify(e).length + 1, 200);
  const had = es.length;
  while (st.ring.length && es.length < LOG_BATCH_MAX) {
    const { pin: _p, ...e } = st.ring[0];
    const n = JSON.stringify(e).length + 1;
    if (size + n > LOG_BODY_MAX && es.length) break;
    size += n;
    es.push(e);
    st.ring.shift();
  }
  if (es.length === had) return;
  if (last) st.pending[st.pending.length - 1] = { ...last, b: logId(), es };
  else st.pending.push({ b: logId(), s: st.sid, build: st.build, os: st.os, es });
  st.dirty = true;
}

/**
 * Send what's waiting: the unacked batches oldest first, one at a time (`keepalive`: all at once, the page is going:
 * sendAll). True when everything went. Never throws.
 */
export async function flushLog(o: { keepalive?: boolean } = {}): Promise<boolean> {
  if (!st.on || st.sending || !env.url) return false;
  const key = env.key();
  if (!key) return false;
  if (!o.keepalive && env.now() < st.nextTry) {
    schedule(0); // (at the backoff's end)
    return false;
  }
  gather();
  cut();
  st.sending = true;
  if (o.keepalive) {
    return sendAll(key).finally(() => {
      st.sending = false;
      if (st.ring.length || st.pending.length) schedule(FLUSH_MS);
    });
  }
  try {
    for (;;) {
      const p = st.pending[0];
      if (!p) return true;
      const body: LogBatch = { v: LOG_V, key, b: p.b, s: p.s, build: p.build, os: p.os, es: p.es };
      let r: Reply | null = null;
      try {
        const res = await env.fetch(env.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
        r = res.ok ? ((await res.json()) as Reply) : null;
      } catch {
        r = null;
      }
      if (st.pending[0] !== p) continue; // cleared meanwhile (paired as someone else)
      if (acked(p, r)) {
        if (!st.pending.length) cut();
        continue;
      }
      st.tries++;
      st.nextTry = env.now() + Math.min(BACKOFF_MAX, BACKOFF_MIN * 2 ** (st.tries - 1));
      return false;
    }
  } finally {
    st.sending = false;
    if (st.dirty && !st.idle) st.idle = setTimeout(() => ((st.idle = null), persistLog()), IDLE_MS);
    if (st.ring.length || st.pending.length) schedule(st.ring.some((e) => e.l === 3) ? FLUSH_ERROR_MS : FLUSH_MS);
  }
}

/** A batch's reply: acked (or never sendable: a key that isn't one, a batch the relay can't read), then off the list. */
function acked(p: Pending, r: Reply | null): r is Reply {
  if (!(r?.ok || r?.error === 'unauthorized' || r?.error === 'bad_request' || r?.error === 'too_large')) return false;
  const i = st.pending.indexOf(p);
  if (i >= 0) st.pending.splice(i, 1);
  st.dirty = true;
  st.tries = 0;
  st.nextTry = 0;
  if (typeof r.closed === 'number') st.closedUntil = r.closed;
  return true;
}

/** The page is going: the unacked batches, oldest first, all at once while their bodies fit KEEPALIVE_MAX (one at a
 *  time, an update reload's several sessions left batches that never went: log.drop pending). True when all went. */
async function sendAll(key: string): Promise<boolean> {
  let size = 0;
  const go: { p: Pending; body: string }[] = [];
  for (const p of st.pending) {
    const body = JSON.stringify({ v: LOG_V, key, b: p.b, s: p.s, build: p.build, os: p.os, es: p.es } satisfies LogBatch);
    if (go.length && size + body.length > KEEPALIVE_MAX) break;
    size += body.length;
    go.push({ p, body });
  }
  await Promise.all(go.map(async ({ p, body }) => {
    let r: Reply | null = null;
    try {
      const res = await env.fetch(env.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, keepalive: true });
      r = res.ok ? ((await res.json()) as Reply) : null;
    } catch {
      r = null;
    }
    acked(p, r);
  }));
  return st.pending.length === 0;
}

/** The page is going (hidden, pagehide, an app reload): write everything, then the batches with `keepalive`. */
export function leaving(): void {
  if (!st.on) return;
  gather();
  cut();
  st.dirty = true;
  persistLog();
  if (!st.sending) void flushLog({ keepalive: true });
}

// ---------------------------------------------------------------- the app's lifecycle

/** The device in a word (a token): iOS's version, else the platform. The user agent's, not the device's: Safari 26
 *  froze it (an iPhone on 26 or 27 says `ios18.7`), kept as is, no feature sniffing (docs/ops/observability.md). */
export function osOf(ua: string): string {
  const ios = ua.match(/OS (\d+)[_.](\d+)/);
  return /iPhone|iPad/.test(ua) && ios ? `ios${ios[1]}.${ios[2]}` : /Mac OS X/.test(ua) ? 'macos' : /Android/.test(ua) ? 'android' : 'other';
}

/** The 3D island's own drawn rate now (world3d/Island3D sets it while it's up). */
let drawn: (() => number) | null = null;
export const setDrawnFps = (fn: (() => number) | null): void => void (drawn = fn);

/** The display's frames over `ms` (rAF: the page's real cadence, the 3D island's draws inside it); null when a gap
 *  spanned a suspension (> 1 s: a p95 of 2,118,402 ms skewed the fps median). */
function frames(ms: number): Promise<{ p50: number; p95: number; fps: number; long: number; hz: number } | null> {
  return new Promise((done) => {
    const t: number[] = [], end = performance.now() + ms;
    const f = (now: number) => {
      t.push(now);
      if (now < end) return void requestAnimationFrame(f);
      const g = t.slice(1).map((x, i) => x - t[i]).sort((a, b) => a - b), q = (p: number) => g[Math.min(g.length - 1, Math.floor(p * g.length))] ?? 0;
      if ((g.at(-1) ?? 0) > 1000) return done(null);
      done({ p50: q(0.5), p95: q(0.95), fps: (t.length - 1) / (ms / 1000), long: g.filter((x) => x > 50).length, hz: q(0.5) > 0 && q(0.5) < 12 ? 120 : 60 });
    };
    requestAnimationFrame(f);
  });
}

/** localStorage: when this phone last hid the app (ms; gone once it's shown again): app.open's `coldS`. */
const HIDDEN_AT = 'island.hiddenAt';
/** The last hide's time kept (hidden) or let go (shown). */
function markHidden(hidden: boolean) {
  try {
    if (hidden) localStorage.setItem(HIDDEN_AT, String(env.now()));
    else localStorage.removeItem(HIDDEN_AT);
  } catch {
    /* no local storage */
  }
}
/** localStorage: when the app reloaded itself as it was hidden, to take a deploy (ui-state/update.ts; ms): the next
 *  load's app.open says so (`hr`, `hrS`), and its `vis` whether it loaded still hidden (the reload ran out of sight) or
 *  only once the player was back (iOS froze it first). */
const HIDDEN_RELOAD = 'island.hiddenReload';
/** The app reloads now as it is hidden (+layout.svelte's deploy at a hide). */
export function noteHiddenReload(): void {
  try {
    localStorage.setItem(HIDDEN_RELOAD, String(env.now()));
  } catch {
    /* no local storage */
  }
}
/** The island's `ready` polled every 500 ms for a minute at most. */
const READY_POLLS = 120;

interface LogStart {
  build: string;
  /** The log's endpoint (transport.ts logUrl). */
  url: string;
  demo: boolean;
  /** The app's route now (paths.ts routeOf). */
  route(): string;
  /** The 3D island is up (its canvas loaded). */
  ready(): boolean;
  /** The write queue: how many wait and the oldest's age (ms). */
  queue(): { n: number; ageMs: number };
}

/** Start: the error listeners, the lifecycle (open, ready, shown, hidden), the frames sample. Returns the stop. */
export function startLog(o: LogStart): () => void {
  if (typeof window === 'undefined' || o.demo) return () => {};
  const forced = /[?&]log=on\b/.test(location.search);
  if (navigator.webdriver && !forced) return () => {};
  env.url = o.url;
  st.on = true;
  st.build = /^[\w.-]{1,40}$/.test(o.build) ? o.build : 'dev';
  st.os = osOf(navigator.userAgent);
  restoreLog();
  const route = () => logRoute(o.route());
  st.route = o.route;
  let stop = false;
  const nav = (performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined)?.type ?? 'other';
  // a fresh load after a hide (not one of our reloads): how long since; iOS's background kills are the short ones
  let coldS: number | undefined;
  try {
    const at = Number(localStorage.getItem(HIDDEN_AT) ?? 0);
    if (nav === 'navigate' && at > 0) coldS = Math.max(0, Math.round((env.now() - at) / 1000));
  } catch {
    /* no local storage */
  }
  let hrS: number | undefined;
  try {
    const at = Number(localStorage.getItem(HIDDEN_RELOAD) ?? 0);
    if (at > 0) hrS = Math.max(0, Math.round((env.now() - at) / 1000));
    localStorage.removeItem(HIDDEN_RELOAD);
  } catch {
    /* no local storage */
  }
  const shownAs = document.hidden ? 'hidden' : 'visible';
  markHidden(document.hidden);
  const types = (globalThis.PerformanceObserver as { supportedEntryTypes?: readonly string[] } | undefined)?.supportedEntryTypes ?? [];
  const q = o.queue();
  log('app.open', {
    nav, route: route(), pwa: matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true,
    w: innerWidth, h: innerHeight, dpr: devicePixelRatio, lt: types.includes('long-animation-frame') || types.includes('longtask'),
    q: q.n, qAgeS: Math.round(q.ageMs / 1000), ...(coldS !== undefined ? { coldS } : {}), vis: shownAs, ...(hrS !== undefined ? { hr: true, hrS } : {})
  });
  const err = (e: ErrorEvent) => logError('error', e.error ?? e.message, { file: e.filename, line: e.lineno, route: o.route(), leaving: isLeaving.now || document.hidden });
  const rej = (e: PromiseRejectionEvent) => logError('rejection', e.reason, { route: o.route(), leaving: isLeaving.now || document.hidden });
  const chunk = (e: Event) => logChunk((e as Event & { payload?: unknown }).payload);
  addEventListener('error', err);
  addEventListener('unhandledrejection', rej);
  addEventListener('vite:preloadError', chunk);

  // the frames sample: 10 s after the island is up (settled), 5 s of rAF, visible; again on a show after 10 minutes away
  let hiddenAt = 0;
  const sample = (when: 'ready' | 'show') => setTimeout(async () => {
    if (stop || document.hidden || !o.ready()) return;
    const f = await frames(5000);
    if (!f || stop || document.hidden) return;
    log('perf.frames', { ...f, drawFps: drawn?.() ?? -1, mode: drawn ? '3d' : 'none', when });
  }, 10_000);
  // (given up after a minute: a launch with no island canvas, /shop or /museum opened directly or no WebGL, is never ready)
  let readyDone = false, polls = 0;
  const poll = setInterval(() => {
    if (++polls > READY_POLLS) return clearInterval(poll);
    if (stop || readyDone || !o.ready()) return;
    readyDone = true;
    clearInterval(poll);
    log('app.ready', { ms: Math.round(performance.now()), route: route() });
    sample('ready');
  }, 500);
  const vis = () => {
    markHidden(document.hidden);
    if (document.hidden) {
      hiddenAt = env.now();
      leaving();
      return;
    }
    const away = hiddenAt ? env.now() - hiddenAt : 0;
    log('app.show', { awayS: Math.round(away / 1000), route: route() });
    if (away >= 600_000 && readyDone) sample('show');
    // (no flush of its own: the show goes with the next batch, FLUSH_MS on, not one more radio wake on every resume)
  };
  const gone = () => {
    isLeaving.now = true;
    leaving();
  };
  const online = () => {
    st.nextTry = 0;
    void flushLog();
  };
  document.addEventListener('visibilitychange', vis);
  addEventListener('pagehide', gone);
  addEventListener('online', online);
  return () => {
    stop = true;
    st.on = false;
    clearInterval(poll);
    removeEventListener('error', err);
    removeEventListener('unhandledrejection', rej);
    removeEventListener('vite:preloadError', chunk);
    document.removeEventListener('visibilitychange', vis);
    removeEventListener('pagehide', gone);
    removeEventListener('online', online);
  };
}
