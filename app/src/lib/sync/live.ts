// The live relay's client (docs/backend.md#live-relay): one WebSocket to the island room while the app is on screen,
// closed when it is hidden or offline (zero cost then), reconnecting with backoff, estimating the relay's clock from
// pings. send() is a no-op unless the socket is up (and, for anything but a world op, the partner is there too); it
// never throws and never waits. Plain TS: the socket, the visibility source and the key are injectable for tests.
import { CLOSE, LIVE_V, MAX_BYTES, parseClient, parseServer, type Intent, type Relayed, type Who } from './live-protocol.ts';

/** The relay's socket URL; VITE_LIVE_URL overrides it (empty = live off). */
export const LIVE_URL: string = (import.meta.env?.VITE_LIVE_URL as string | undefined) ?? 'wss://island-fund-relay.island-fund-relay.workers.dev/room';

export interface LiveStatus {
  /** The socket is up and the relay accepted my key. */
  connected: boolean;
  /** Who the relay says I am (null until welcomed). */
  me: Who | null;
  /** My partner has the app open too. */
  peer: boolean;
}

/** Where the page's visibility and connectivity come from (the document and window by default). */
export interface LiveEnv {
  visible(): boolean;
  online(): boolean;
  /** Call `fn` whenever visibility or connectivity changes; returns the unsubscribe. */
  watch(fn: () => void): () => void;
}

export interface LiveOptions {
  url?: string;
  /** The person key (read at each connect). */
  key: () => string | null;
  WebSocket?: typeof WebSocket;
  env?: LiveEnv;
}

export interface Live {
  /** Begin following visibility: connected while shown, closed while hidden. */
  start(): void;
  /** Close and stop following. */
  stop(): void;
  /** Send an intent; false when it went nowhere (not connected, partner away, too big or malformed). */
  send(i: Intent): boolean;
  /** The partner's relayed intents (world ops missed while away included, on reconnect). */
  on(fn: (m: Relayed) => void): () => void;
  /** Status changes (called at once with the current one). */
  onStatus(fn: (s: LiveStatus) => void): () => void;
  status(): LiveStatus;
  /** The relay's clock estimate (ms since the epoch): Date.now() corrected by the offset from pings. */
  serverNow(): number;
}

/** Reconnect delays: 1 s doubling to 60 s, ±25 % jitter. */
const BACKOFF = { base: 1000, max: 60_000 } as const;
/** Pings: right after the welcome, again 2 s later, then every 60 s. */
const PING_MS = [0, 2000] as const;
const PING_EVERY_MS = 60_000;
/** Offset samples kept; the one with the shortest round trip wins. */
const SAMPLES = 8;
/** Beyond this much unsent, send() drops (a stalled socket never piles up). */
const MAX_BUFFERED = 4096;

/** Retry delay after `n` consecutive failures (n ≥ 0); `r` in [0, 1). */
export function backoff(n: number, r = Math.random()): number {
  const d = Math.min(BACKOFF.max, BACKOFF.base * 2 ** n);
  return Math.round(d * (0.75 + 0.5 * r));
}

/** The best clock offset from (rtt, offset) samples: the shortest round trip's. */
export function bestOffset(samples: readonly { rtt: number; off: number }[]): number {
  let best: { rtt: number; off: number } | null = null;
  for (const s of samples) if (!best || s.rtt < best.rtt) best = s;
  return best ? best.off : 0;
}

function documentEnv(): LiveEnv {
  const doc = typeof document !== 'undefined' ? document : null;
  const win = typeof window !== 'undefined' ? window : null;
  return {
    visible: () => doc?.visibilityState === 'visible',
    online: () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false),
    watch(fn) {
      doc?.addEventListener('visibilitychange', fn);
      win?.addEventListener('online', fn);
      win?.addEventListener('offline', fn);
      return () => {
        doc?.removeEventListener('visibilitychange', fn);
        win?.removeEventListener('online', fn);
        win?.removeEventListener('offline', fn);
      };
    }
  };
}

export function createLive(o: LiveOptions): Live {
  const url = o.url ?? LIVE_URL;
  const WS = o.WebSocket ?? (typeof WebSocket !== 'undefined' ? WebSocket : undefined);
  const env = o.env ?? documentEnv();

  let ws: WebSocket | null = null;
  let st: LiveStatus = { connected: false, me: null, peer: false };
  let running = false;
  let unwatch: (() => void) | null = null;
  let fails = 0;
  /** Closed by the relay for a reason retrying won't fix (key, replaced, version): wait for the next show. */
  let parked = false;
  let wasVisible = false;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let pings: ReturnType<typeof setTimeout>[] = [];
  let pingEvery: ReturnType<typeof setInterval> | null = null;
  const sent = new Set<number>(); // the c (Date.now() at sending) of each ping awaiting its pong
  let samples: { rtt: number; off: number }[] = [];
  let offset = 0;
  let lastWorld: number | undefined;
  const subs = new Set<(m: Relayed) => void>();
  const statusSubs = new Set<(s: LiveStatus) => void>();

  const setStatus = (s: Partial<LiveStatus>) => {
    const next = { ...st, ...s };
    if (next.connected === st.connected && next.me === st.me && next.peer === st.peer) return;
    st = next;
    for (const f of statusSubs) safe(() => f(st));
  };

  const clearTimers = () => {
    if (retry) clearTimeout(retry);
    retry = null;
    for (const p of pings) clearTimeout(p);
    pings = [];
    if (pingEvery) clearInterval(pingEvery);
    pingEvery = null;
    sent.clear();
  };

  const raw = (m: object): boolean => {
    if (!ws || ws.readyState !== 1 || ws.bufferedAmount > MAX_BUFFERED) return false;
    try {
      ws.send(JSON.stringify(m));
      return true;
    } catch {
      return false;
    }
  };

  const ping = () => {
    const c = Date.now();
    if (raw({ v: LIVE_V, kind: 'ping', c })) sent.add(c);
  };

  const drop = (code = 1000, reason = 'bye') => {
    clearTimers();
    const s = ws;
    ws = null;
    if (s) {
      s.onopen = s.onmessage = s.onclose = s.onerror = null;
      try {
        s.close(code, reason);
      } catch {
        /* already closing */
      }
    }
    setStatus({ connected: false, peer: false });
  };

  const wanted = () => running && !parked && !!url && !!WS && env.visible() && env.online() && !!o.key();

  const schedule = () => {
    if (retry || !wanted()) return;
    retry = setTimeout(() => {
      retry = null;
      connect();
    }, backoff(fails++));
  };

  function connect() {
    if (ws || !wanted()) return;
    let s: WebSocket;
    try {
      s = new WS!(url);
    } catch {
      schedule();
      return;
    }
    ws = s;
    s.onopen = () => {
      const key = o.key();
      if (!key) return drop();
      raw({ v: LIVE_V, kind: 'hello', key, ...(lastWorld !== undefined ? { since: lastWorld } : {}) });
    };
    s.onmessage = (e: MessageEvent) => {
      const m = parseServer(e.data);
      if (!m) return;
      switch (m.kind) {
        case 'welcome':
          fails = 0;
          offset = m.t - Date.now(); // a first guess until the pings refine it
          samples = [];
          setStatus({ connected: true, me: m.me, peer: m.peer });
          for (const at of PING_MS) pings.push(setTimeout(ping, at));
          pingEvery = setInterval(ping, PING_EVERY_MS);
          return;
        case 'pong': {
          if (!sent.delete(m.c)) return;
          const rtt = Date.now() - m.c;
          samples = [...samples, { rtt, off: m.t - (m.c + rtt / 2) }].slice(-SAMPLES);
          offset = bestOffset(samples);
          return;
        }
        case 'presence':
          if (m.who !== st.me) setStatus({ peer: m.on });
          return;
        default:
          if (m.who === st.me) return;
          if (m.kind === 'world') lastWorld = Math.max(lastWorld ?? 0, m.t);
          for (const f of subs) safe(() => f(m));
      }
    };
    s.onclose = (e: CloseEvent) => {
      if (ws !== s) return;
      ws = null;
      clearTimers();
      setStatus({ connected: false, peer: false });
      if (e.code === CLOSE.unauthorized || e.code === CLOSE.replaced || e.code === CLOSE.version) parked = true;
      else schedule();
    };
    s.onerror = () => {
      /* onclose follows */
    };
  }

  const react = () => {
    const vis = env.visible();
    if (vis && !wasVisible) {
      parked = false; // shown again: try afresh
      fails = 0;
    }
    wasVisible = vis;
    if (!wanted()) return drop(1000, 'hidden');
    if (retry) {
      clearTimeout(retry);
      retry = null;
    }
    connect();
  };

  return {
    start() {
      if (running) return;
      running = true;
      wasVisible = false;
      unwatch = env.watch(react);
      react();
    },
    stop() {
      running = false;
      unwatch?.();
      unwatch = null;
      drop();
    },
    send(i) {
      if (!st.connected || (!st.peer && i.kind !== 'world')) return false;
      const m = { v: LIVE_V, ...i };
      const s = JSON.stringify(m);
      if (s.length > MAX_BYTES || !parseClient(s)) return false;
      return raw(m);
    },
    on(fn) {
      subs.add(fn);
      return () => void subs.delete(fn);
    },
    onStatus(fn) {
      statusSubs.add(fn);
      safe(() => fn(st));
      return () => void statusSubs.delete(fn);
    },
    status: () => st,
    serverNow: () => Date.now() + offset
  };
}

function safe(f: () => void): void {
  try {
    f();
  } catch (e) {
    console.error('live:', e);
  }
}
