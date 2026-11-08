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
//   `keepalive`, one batch ≤ 32 KB in flight). A batch stays stored until the relay acks its id; a re-sent one is
//   dropped there (`dup`). Failure: backoff 5 s → 5 min; offline: wait for `online`. A capped day (`closed`): only
//   errors until it reopens.
// - Off in the demo and under automation (unless `?log=on`); unpaired, it keeps its events until there is a key.
import {
  baseName, cleanData, isLogId, logRoute, LOG_BATCH_MAX, LOG_BODY_MAX, LOG_V,
  type LogBatch, type LogData, type LogEventIn, type LogEventName, type LogLevel
} from '#lib/contract/log.ts';
import { getKey, LIVE } from './storage.ts';

type Ev = LogEventIn & { pin?: true };
/** The relay's answer to a batch. */
type Reply = { ok?: boolean; error?: string; closed?: number; dup?: boolean };
interface Pending { b: string; s: string; build: string; os: string; es: LogEventIn[] }
interface Saved { v: 1; s: string; build: string; os: string; ring: Ev[]; pending: Pending[]; day: { d: string; n: number } }

export const RING_MAX = 300, SESSION_MAX = 600, SESSION_ERRORS = 50, DAY_MAX = 1_500, PIN = 15;
const PERSIST_MAX = 24_000, PENDING_MAX = 3, FLUSH_MS = 30_000, FLUSH_ERROR_MS = 5_000, FLUSH_AT = 50, IDLE_MS = 2_000;
const BACKOFF_MIN = 5_000, BACKOFF_MAX = 300_000;
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

const today = () => new Date(env.now()).toISOString().slice(0, 10);

/** Tests: the environment, and a fresh state. */
export function configureLog(o: Partial<Env> & { reset?: boolean; on?: boolean }): void {
  const { reset, on, ...rest } = o;
  Object.assign(env, rest);
  if (reset) {
    Object.assign(st, { sid: logId(), q: 0, ring: [], pending: [], counters: new Map(), n: 0, errors: 0, dropped: { cap: 0, full: 0, day: 0, pending: 0 }, day: { d: '', n: 0 }, folded: new Map(), closedUntil: 0, tries: 0, nextTry: 0, sending: false, dirty: false });
    if (st.timer) clearTimeout(st.timer);
    if (st.idle) clearTimeout(st.idle);
    st.timer = st.idle = null;
  }
  if (on !== undefined) st.on = on;
}

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
  const ev: Ev = { t: env.now(), l, e, q: ++st.q, d: cleanData(e, d), ...(isLogId(o.r) ? { r: o.r } : {}) };
  if (l === 3) for (const x of st.ring.slice(-PIN)) x.pin = true;
  st.ring.push(ev);
  while (st.ring.length > RING_MAX) {
    evict();
    st.dropped.full++;
  }
  changed(l === 3 ? FLUSH_ERROR_MS : FLUSH_MS);
}

/** A thrown thing or a rejection as `js.error` (folded: the same message and frame, while unsent, counts up `n`). */
export function logError(kind: 'error' | 'rejection', err: unknown, src?: { file?: string; line?: number; route?: string; leaving?: boolean }): void {
  if (!st.on) return;
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : typeof err === 'string' ? err : String((err as { message?: unknown } | null)?.message ?? err);
  if (NOISE.test(msg)) return;
  const stack = err instanceof Error ? (err.stack ?? '') : '';
  const fp = `${msg}|${stack.split('\n')[0] ?? ''}|${src?.file ?? ''}`;
  const had = st.folded.get(fp);
  if (had && st.ring.includes(had)) {
    had.d = { ...had.d, n: Number(had.d?.n ?? 1) + 1 };
    return;
  }
  log('js.error', {
    kind, msg, stack, n: 1, route: src?.route,
    ...(src?.file ? { src: `${baseName(src.file)}:${src.line ?? 0}` } : {}),
    ...(src?.leaving ? { leaving: true } : {})
  }, src?.leaving ? 2 : 3);
  const last = st.ring.at(-1);
  if (last?.e === 'js.error') st.folded.set(fp, last);
}

/** A usage counter (`sheet:<i18n key>`, `ev:<type>`, `route:<route>`, `act:<what>`): summed, sent as one `use` a flush. */
export function count(key: string): void {
  if (!st.on) return;
  st.counters.set(key, (st.counters.get(key) ?? 0) + 1);
}

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
  st.pending = saved.pending.slice(-PENDING_MAX);
  for (let i = 0; i < saved.ring.length; i += LOG_BATCH_MAX) {
    st.pending.push({ b: logId(), s: saved.s, build: saved.build, os: saved.os, es: saved.ring.slice(i, i + LOG_BATCH_MAX).map(({ pin: _p, ...e }) => e) });
  }
  st.pending = st.pending.slice(-PENDING_MAX);
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
  const es: LogEventIn[] = [];
  let size = 200;
  while (st.ring.length && es.length < LOG_BATCH_MAX) {
    const { pin: _p, ...e } = st.ring[0];
    const n = JSON.stringify(e).length + 1;
    if (size + n > LOG_BODY_MAX && es.length) break;
    size += n;
    es.push(e);
    st.ring.shift();
  }
  if (!es.length) return;
  st.pending.push({ b: logId(), s: st.sid, build: st.build, os: st.os, es });
  while (st.pending.length > PENDING_MAX) {
    st.pending.shift();
    st.dropped.pending++;
  }
  st.dirty = true;
}

/**
 * Send what's waiting: the unacked batches oldest first, one at a time (`keepalive`: one, the page is going). True when
 * everything went. Never throws.
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
  try {
    for (;;) {
      const p = st.pending[0];
      if (!p) return true;
      const body: LogBatch = { v: LOG_V, key, b: p.b, s: p.s, build: p.build, os: p.os, es: p.es };
      let r: Reply | null = null;
      try {
        const res = await env.fetch(env.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), keepalive: !!o.keepalive });
        r = res.ok ? ((await res.json()) as Reply) : null;
      } catch {
        r = null;
      }
      if (st.pending[0] !== p) continue; // cleared meanwhile (paired as someone else)
      if (r?.ok || r?.error === 'unauthorized' || r?.error === 'bad_request' || r?.error === 'too_large') {
        // acked (or never sendable: a key that isn't one, a batch the relay can't read)
        st.pending.shift();
        st.dirty = true;
        st.tries = 0;
        st.nextTry = 0;
        if (typeof r.closed === 'number') st.closedUntil = r.closed;
        if (o.keepalive) return st.pending.length === 0;
        if (!st.pending.length) cut();
        continue;
      }
      st.tries++;
      st.nextTry = env.now() + Math.min(BACKOFF_MAX, BACKOFF_MIN * 2 ** (st.tries - 1));
      return false;
    }
  } finally {
    st.sending = false;
    if (st.dirty && !o.keepalive) {
      if (!st.idle) st.idle = setTimeout(() => ((st.idle = null), persistLog()), IDLE_MS);
    }
    if (st.ring.length || st.pending.length) schedule(st.ring.some((e) => e.l === 3) ? FLUSH_ERROR_MS : FLUSH_MS);
  }
}

/** The page is going (hidden, pagehide, an app reload): write everything, then one batch with `keepalive`. */
export function leaving(): void {
  if (!st.on) return;
  gather();
  cut();
  st.dirty = true;
  persistLog();
  if (!st.sending) void flushLog({ keepalive: true });
}

// ---------------------------------------------------------------- the app's lifecycle

/** The device in a word (a token): iOS's version, else the platform. */
export function osOf(ua: string): string {
  const ios = ua.match(/OS (\d+)[_.](\d+)/);
  return /iPhone|iPad/.test(ua) && ios ? `ios${ios[1]}.${ios[2]}` : /Mac OS X/.test(ua) ? 'macos' : /Android/.test(ua) ? 'android' : 'other';
}

/** The 3D island's own drawn rate now (world3d/Island3D sets it while it's up). */
let drawn: (() => number) | null = null;
export const setDrawnFps = (fn: (() => number) | null): void => void (drawn = fn);

/** The display's frames over `ms` (rAF: the page's real cadence, the 3D island's draws inside it). */
function frames(ms: number): Promise<{ p50: number; p95: number; fps: number; long: number; hz: number }> {
  return new Promise((done) => {
    const t: number[] = [], end = performance.now() + ms;
    const f = (now: number) => {
      t.push(now);
      if (now < end) return void requestAnimationFrame(f);
      const g = t.slice(1).map((x, i) => x - t[i]).sort((a, b) => a - b), q = (p: number) => g[Math.min(g.length - 1, Math.floor(p * g.length))] ?? 0;
      done({ p50: q(0.5), p95: q(0.95), fps: (t.length - 1) / (ms / 1000), long: g.filter((x) => x > 50).length, hz: q(0.05) > 0 && q(0.05) < 12 ? 120 : 60 });
    };
    requestAnimationFrame(f);
  });
}

const ALIVE = 'island.alive';

export interface LogStart {
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
  let stop = false;
  // the last load was killed while shown (iOS reclaiming the page's memory): its flag still set, no reload of ours since
  let crashed = false;
  try {
    const reloadAt = Number(sessionStorage.getItem('island.reloadAt') ?? 0);
    crashed = sessionStorage.getItem(ALIVE) === '1' && env.now() - reloadAt > 30_000;
    sessionStorage.setItem(ALIVE, document.hidden ? '0' : '1');
  } catch {
    /* no session storage */
  }
  const nav = (performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined)?.type ?? 'other';
  const types = (globalThis.PerformanceObserver as { supportedEntryTypes?: readonly string[] } | undefined)?.supportedEntryTypes ?? [];
  const q = o.queue();
  log('app.open', {
    nav, route: route(), pwa: matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true,
    w: innerWidth, h: innerHeight, dpr: devicePixelRatio, crashed, lt: types.includes('long-animation-frame') || types.includes('longtask'),
    q: q.n, qAgeS: Math.round(q.ageMs / 1000)
  });
  const isLeaving = { now: false };
  const err = (e: ErrorEvent) => logError('error', e.error ?? e.message, { file: e.filename, line: e.lineno, route: o.route(), leaving: isLeaving.now || document.hidden });
  const rej = (e: PromiseRejectionEvent) => logError('rejection', e.reason, { route: o.route(), leaving: isLeaving.now || document.hidden });
  const chunk = () => log('chunk.fail', { reloaded: false }, 2);
  addEventListener('error', err);
  addEventListener('unhandledrejection', rej);
  addEventListener('vite:preloadError', chunk);

  // the frames sample: 10 s after the island is up (settled), 5 s of rAF, visible; again on a show after 10 minutes away
  let hiddenAt = 0;
  const sample = (when: 'ready' | 'show') => setTimeout(async () => {
    if (stop || document.hidden || !o.ready()) return;
    const f = await frames(5000);
    if (stop || document.hidden) return;
    log('perf.frames', { ...f, drawFps: drawn?.() ?? -1, mode: drawn ? '3d' : 'none', when });
  }, 10_000);
  let readyDone = false;
  const poll = setInterval(() => {
    if (stop || readyDone || !o.ready()) return;
    readyDone = true;
    clearInterval(poll);
    log('app.ready', { ms: Math.round(performance.now()), route: route() });
    sample('ready');
  }, 500);
  const vis = () => {
    try {
      sessionStorage.setItem(ALIVE, document.hidden ? '0' : '1');
    } catch {
      /* no session storage */
    }
    if (document.hidden) {
      hiddenAt = env.now();
      leaving();
      return;
    }
    const away = hiddenAt ? env.now() - hiddenAt : 0;
    log('app.show', { awayS: Math.round(away / 1000), route: route() });
    if (away >= 600_000 && readyDone) sample('show');
    void flushLog();
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
