// The live relay's client (docs/backend.md#live-relay): one WebSocket to the island room while the app is on screen,
// closed when it is hidden or offline (zero cost then), reconnecting with backoff, estimating the relay's clock from
// pings. send() is a no-op unless the socket is up (and, for what the room doesn't keep, the partner is there too); it
// never throws and never waits. Plain TS: the socket, the visibility source and the key are injectable for tests.
import { LIVE, getKey, localKV, readJson, remove, writeJson } from './storage.ts';
import { fnv1a } from '../random.ts';
import { log } from './log.ts';
import { takeWx } from './wx.ts';
import { CLOSE, LIVE_V, MAX_BYTES, dayStart, guestMaySend, isAcked, isStored, parseClient, parseServer, tokyoDay, type Gone, type Intent, type Notice, type RecordMark, type Relayed, type Who } from '../contract/live-protocol.ts';

/** The relay's socket URL; VITE_LIVE_URL overrides it (empty = live off). */
export const LIVE_URL: string = (import.meta.env?.VITE_LIVE_URL as string | undefined) ?? 'wss://island-fund-relay.island-fund-relay.workers.dev/room';

/**
 * The record changed: its push (`changed`, with the new rows' `at` and `rev`; anyone's write, mine too) or the
 * partner's nudge after an acked event (`saved`: no `at`). Either way the snapshot is worth fetching now.
 */
export type SheetChange = Partial<Pick<Notice, 'what' | 'at' | 'rev'>> & { who: Who };

export interface LiveStatus {
  /** The socket is up and the relay accepted my key. */
  connected: boolean;
  /** Who the relay says I am (null until welcomed). */
  me: Who | null;
  /** My partner has the app open too (the guest's phone: either member). The guest never counts for a member. */
  peer: boolean;
  /** Everyone else who has the app open (v3: the guest too), sorted. */
  here: readonly Who[];
  /** The record's last change as of the welcome (docs/backend.md#the-record), when the relay knew one. */
  rec?: RecordMark;
  /** When each person not here left, on the relay's clock (the welcome's, then each `presence` off; mine: when my
   *  previous socket did, as of the welcome): one gone quiet inside a room leaves it a while after (store/where.svelte.ts). */
  gone?: Gone;
}

/** Where the page's visibility and connectivity come from (the document and window by default). */
export interface LiveEnv {
  visible(): boolean;
  online(): boolean;
  /** Call `fn` whenever visibility or connectivity changes; returns the unsubscribe. */
  watch(fn: () => void): () => void;
  /** Call `fn` when the app is back in front without a visibility change (pageshow, focus: iOS's app switcher can
   *  leave a page `visible` through a sleep); returns the unsubscribe. */
  wake?(fn: () => void): () => void;
}

export interface LiveOptions {
  url?: string;
  /** The person key (read at each connect). */
  key: () => string | null;
  /** The app's version, said in the hello (the relay logs it: `ws.hello`). */
  build?: () => string | undefined;
  WebSocket?: typeof WebSocket;
  env?: LiveEnv;
  /** The relay time of the last shared-world change this phone heard (the hello's `since`), kept across reloads: a
   *  phone opening later hears today's world from there (docs/backend.md#shared-world). Default: localStorage. */
  since?: SinceStore;
  /** Where the outbox is kept across a reload or a kill (default: localStorage). */
  outbox?: OutboxStore;
}

/** A kept intent as the outbox store keeps it: its number, the message as sent, its Tokyo day of making. */
export interface KeptOut {
  c: number;
  m: object;
  d: number;
}

/** Where the outbox is kept: `get(key)` what was waiting for this person key (another key's is dropped), `set` it all
 *  again after each change. */
export interface OutboxStore {
  get(key: string | null): KeptOut[];
  set(key: string | null, es: readonly KeptOut[]): void;
}

/** Where `since` is kept: `get()` the last heard today (or today's start: the whole day), `set(t)` after each one. */
export interface SinceStore {
  get(now: number): number;
  set(t: number): void;
}

/** `since` in localStorage (`island.liveSince` = `{day, t}`), a new Tokyo day starting from its midnight. */
const storedSince: SinceStore = {
  get(now) {
    const d = tokyoDay(now), s = readJson<{ day?: unknown; t?: unknown }>(localKV(), LIVE.since);
    return s && s.day === d && typeof s.t === 'number' && Number.isFinite(s.t) ? s.t : dayStart(d);
  },
  set(t) {
    writeJson(localKV(), LIVE.since, { day: tokyoDay(t), t });
  }
};

/** The outbox in localStorage (`island.liveOutbox` = `{k, es}`: whose key, by a hash, and its entries). */
const storedOutbox: OutboxStore = {
  get(key) {
    const o = readJson<{ k?: unknown; es?: unknown }>(localKV(), LIVE.outbox);
    if (!o || !key || o.k !== keyTag(key) || !Array.isArray(o.es)) return [];
    return (o.es as Partial<KeptOut>[]).filter((e): e is KeptOut => typeof e?.c === 'number' && typeof e.d === 'number' && !!e.m && typeof e.m === 'object');
  },
  set(key, es) {
    if (!es.length) remove(localKV(), LIVE.outbox);
    else if (key) writeJson(localKV(), LIVE.outbox, { k: keyTag(key), es });
  }
};
/** A person key's tag (never the key itself in storage twice): its FNV-1a hash. */
const keyTag = (key: string): string => fnv1a(key.toLowerCase()).toString(36);

/** What the socket did (counters since the page loaded, and the last acks' round trips): for the budget and the e2e.
 *  @public (the e2e) */
export interface LiveMetrics {
  sent: number;
  sentBytes: number;
  recv: number;
  recvBytes: number;
  /** Kept intents sent again after a reconnect (never acked before it). */
  resent: number;
  /** The last acks' round trips (ms), oldest first. */
  ackMs: number[];
  /** Kept intents still waiting for their ack. */
  pending: number;
  /** The last close's code (0: none yet; 4000 a socket given up on as dead). */
  closed: number;
  /** `busy` heard: kept intents the room's rate limit turned away (sent again after a backoff). */
  busy: number;
}

export interface Live {
  /** Begin following visibility: connected while shown, closed while hidden. */
  start(): void;
  /** Close and stop following. */
  stop(): void;
  /** Send an intent; false when it went nowhere (not connected, the partner away for an intent the room doesn't keep,
   *  too big or malformed). */
  send(i: Intent): boolean;
  /** The partner's relayed intents (today's shared world missed while away included, on connect: older `t`). */
  on(fn: (m: Relayed) => void): () => void;
  /** Sheet changes (docs/backend.md#push). */
  onChange(fn: (c: SheetChange) => void): () => void;
  /** Status changes (called at once with the current one). */
  onStatus(fn: (s: LiveStatus) => void): () => void;
  status(): LiveStatus;
  /** The relay's clock estimate (ms since the epoch): Date.now() corrected by the offset from pings. */
  serverNow(): number;
  /** Counters (optional: the demo's relay has none). */
  metrics?(): LiveMetrics;
}

/** Reconnect delays: 1 s doubling to 60 s, ±25 % jitter. */
const BACKOFF = { base: 1000, max: 60_000 } as const;
/** Pings: right after the welcome, again 2 s later (the clock), then whenever the socket was quiet this long: a socket
 *  that died without closing (a half-open TCP after a sleep, a train's tunnel) is found out within PING_EVERY_MS +
 *  PONG_WAIT_MS. */
const PING_MS = [0, 2000] as const;
const PING_EVERY_MS = 20_000;
/** After a ping, nothing at all heard for this long: the socket is dead (closed here, and a new one opened at once). */
const PONG_WAIT_MS = 10_000;
/** A kept intent's ack is due within this long; overdue with nothing heard since it went, the socket is dead; with the
 *  socket alive (a relay that dropped it over its limit without saying `busy`), it goes again, the wait doubling. */
const ACK_MS = 5000;
const ACK_MAX_MS = 60_000;
/** The close code for a socket given up on as dead (the client's own; the relay logs it). */
const STALE = 4000;
/** Offset samples kept; the one with the shortest round trip wins. */
const SAMPLES = 8;
/** Beyond this much unsent, send() drops (a stalled socket never piles up). */
const MAX_BUFFERED = 4096;
/** Kept intents waiting for their ack at most (the oldest go first: the sheet's day row still has them). */
const OUTBOX_MAX = 120;
/** After a reconnect the waiting ones go again, this many at once, then one every RESEND_GAP_MS (the relay's bucket). */
const RESEND_BURST = 12;
const RESEND_GAP_MS = 60;
const ACKS_KEPT = 20;

/** The kept clock offset is rewritten only when it moved this much (ms); one further off than a day is no offset. */
const OFFSET_KEEP_MS = 50;
const OFFSET_MAX_MS = 86_400_000;
/** The relay's clock offset as last measured on this phone (localStorage `island.liveOffset` = `{off}`), else 0. */
function keptOffset(): number {
  const o = readJson<{ off?: unknown }>(localKV(), LIVE.offset);
  return o && typeof o.off === 'number' && Number.isFinite(o.off) && Math.abs(o.off) < OFFSET_MAX_MS ? o.off : 0;
}

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
    },
    wake(fn) {
      win?.addEventListener('pageshow', fn);
      win?.addEventListener('focus', fn);
      return () => {
        win?.removeEventListener('pageshow', fn);
        win?.removeEventListener('focus', fn);
      };
    }
  };
}

export function createLive(o: LiveOptions): Live {
  const url = o.url ?? LIVE_URL;
  const WS = o.WebSocket ?? (typeof WebSocket !== 'undefined' ? WebSocket : undefined);
  const env = o.env ?? documentEnv();
  const since = o.since ?? storedSince;
  const store = o.outbox ?? storedOutbox;

  let ws: WebSocket | null = null;
  let st: LiveStatus = { connected: false, me: null, peer: false, here: [] };
  let running = false;
  let unwatch: (() => void) | null = null;
  let fails = 0;
  /** Closed by the relay for a reason retrying won't fix (key, replaced, version): wait for the next show. */
  let parked = false;
  let wasVisible = false;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let pings: ReturnType<typeof setTimeout>[] = [];
  let pingEvery: ReturnType<typeof setTimeout> | null = null;
  const sent = new Set<number>(); // the c (Date.now() at sending) of each ping awaiting its pong
  let samples: { rtt: number; off: number }[] = [];
  /** The relay's clock less the device's: the last one measured, kept across reloads, so what this phone stamps before
   *  the first welcome (a layout or a room op made offline, or in the second after opening) is on the relay's clock
   *  too: a device clock running fast can't win every conflict with it. */
  let offset = keptOffset();
  let savedOffset = offset;
  const keepOffset = () => {
    if (Math.abs(offset - savedOffset) < OFFSET_KEEP_MS) return;
    savedOffset = offset;
    writeJson(localKV(), LIVE.offset, { off: Math.round(offset) });
  };
  /** The last shared-world change heard (the hello's `since`): read when the page loads, so a later open hears the day. */
  let lastWorld = since.get(Date.now());
  const subs = new Set<(m: Relayed) => void>();
  const changeSubs = new Set<(c: SheetChange) => void>();
  const changed = (c: SheetChange) => {
    for (const f of changeSubs) safe(() => f(c));
  };
  const statusSubs = new Set<(s: LiveStatus) => void>();
  /** Kept intents sent (or not yet: offline) and not acked, by their sequence number, in order: they go again after a
   *  reconnect (the relay knows a resend by its number). A walk replaces the walk before it. */
  const outbox = new Map<number, Out>();
  // what a reload or a kill left unsent (≤ OUTBOX_MAX): it goes after the first welcome, as a reconnect's would
  const keptKey = o.key();
  for (const e of store.get(keptKey).slice(-OUTBOX_MAX)) outbox.set(e.c, { m: e.m, d: e.d, at: 0, due: Infinity, n: 0 });
  let seq = Math.max(0, ...outbox.keys());
  /** The outbox written once per burst of changes. */
  let saving = false;
  const save = () => {
    if (saving) return;
    saving = true;
    queueMicrotask(() => {
      saving = false;
      store.set(o.key(), [...outbox].map(([c, e]) => ({ c, m: e.m, d: e.d })));
    });
  };
  const nextSeq = () => (seq = Math.max(Date.now(), seq + 1));
  const mx: LiveMetrics = { sent: 0, sentBytes: 0, recv: 0, recvBytes: 0, resent: 0, ackMs: [], pending: 0, closed: 0, busy: 0 };
  let resend: ReturnType<typeof setTimeout>[] = [];
  /** When the socket last heard anything (liveness), the pong's wait after a probe, the acks' look. */
  let heardAt = 0;
  let pongWait: ReturnType<typeof setTimeout> | null = null;
  let ackTimer: ReturnType<typeof setTimeout> | null = null;

  const setStatus = (s: Partial<LiveStatus>) => {
    const next = { ...st, ...s };
    if (next.connected === st.connected && next.me === st.me && next.peer === st.peer && next.rec === st.rec && next.here.join() === st.here.join() && sameGone(next.gone, st.gone)) return;
    st = next;
    for (const f of statusSubs) safe(() => f(st));
  };

  const clearTimers = () => {
    if (retry) clearTimeout(retry);
    retry = null;
    for (const p of pings) clearTimeout(p);
    pings = [];
    if (pingEvery) clearTimeout(pingEvery);
    pingEvery = null;
    sent.clear();
    for (const r of resend) clearTimeout(r);
    resend = [];
    if (pongWait) clearTimeout(pongWait);
    pongWait = null;
    if (ackTimer) clearTimeout(ackTimer);
    ackTimer = null;
  };

  const raw = (m: object): boolean => {
    if (!ws || ws.readyState !== 1 || ws.bufferedAmount > MAX_BUFFERED) return false;
    try {
      const s = JSON.stringify(m);
      ws.send(s);
      mx.sent++;
      mx.sentBytes += s.length;
      return true;
    } catch {
      return false;
    }
  };

  const ping = () => {
    const c = Date.now();
    if (!raw({ v: LIVE_V, kind: 'ping', c })) return;
    // a pong lost on a socket open for days: only the last few awaited
    for (const old of sent) if (sent.size >= 8) sent.delete(old);
    sent.add(c);
  };

  /** Ask the socket whether it's alive: a ping, and nothing at all heard within PONG_WAIT_MS gives it up. */
  const probe = () => {
    if (!st.connected) return;
    const at = Date.now();
    ping();
    if (pongWait) return;
    pongWait = setTimeout(() => {
      pongWait = null;
      if (heardAt < at) stale();
    }, PONG_WAIT_MS);
  };

  /** Quiet for PING_EVERY_MS (nothing heard): probe; looked at again PING_EVERY_MS after the last thing heard. */
  const quiet = () => {
    const now = Date.now(), still = now - heardAt;
    if (still >= PING_EVERY_MS) probe();
    pingEvery = setTimeout(quiet, still >= PING_EVERY_MS ? PING_EVERY_MS : PING_EVERY_MS - still);
  };

  /** The socket is open but carries nothing: closed here (its own close may take minutes) and replaced at once; the
   *  welcome sends the outbox again. */
  const stale = () => {
    // (the log's ws.close, its code the client's own)
    log('ws.close', { code: STALE, secs: Math.round((Date.now() - (welcomedAt || madeAt)) / 1000), welcomed: welcomedAt > 0 });
    mx.closed = STALE;
    drop(STALE, 'stale');
    fails = 0;
    connect();
  };

  /** Look at the outbox when its next ack is due (connected only). */
  const armAcks = () => {
    if (ackTimer) clearTimeout(ackTimer);
    ackTimer = null;
    if (!st.connected) return;
    let next = Infinity;
    for (const o of outbox.values()) if (o.at && o.due < next) next = o.due;
    if (next === Infinity) return;
    ackTimer = setTimeout(acks, Math.max(0, next - Date.now()));
  };
  /** The overdue acks: nothing heard since one went, the socket is dead; else (a relay that dropped them over its limit
   *  without a word, or said `busy`) they go again, each one's wait doubling. */
  const acks = () => {
    ackTimer = null;
    const now = Date.now();
    let n = 0;
    for (const o of outbox.values()) {
      if (!o.at || o.due > now) continue;
      if (heardAt < o.at) return stale();
      if (n++ >= RESEND_BURST) break;
      again(o, now);
    }
    armAcks();
  };
  /** Send a kept intent again on this socket, its next wait doubled. */
  const again = (o: Out, now: number) => {
    o.n++;
    o.at = now;
    o.due = now + Math.min(ACK_MAX_MS, ACK_MS * 2 ** o.n);
    if (raw(o.m)) mx.resent++;
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
    setStatus({ connected: false, peer: false, here: [], rec: undefined, gone: undefined });
  };

  const wanted = () => running && !parked && !!url && !!WS && env.visible() && env.online() && !!o.key();

  const schedule = () => {
    if (retry || !wanted()) return;
    retry = setTimeout(() => {
      retry = null;
      connect();
    }, backoff(fails++));
  };

  /** When this socket was made, and when its welcome came (0: not yet): the log's ws.open and ws.close. */
  let madeAt = 0, welcomedAt = 0;

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
    madeAt = Date.now();
    welcomedAt = 0;
    s.onopen = () => {
      const key = o.key();
      if (!key) return drop();
      // a new Tokyo day since the page loaded: that day's whole world
      lastWorld = Math.max(lastWorld, dayStart(tokyoDay(Date.now() + offset)));
      const build = o.build?.();
      raw({ v: LIVE_V, kind: 'hello', key, since: lastWorld, ...(build ? { build } : {}) });
    };
    s.onmessage = (e: MessageEvent) => {
      heardAt = Date.now();
      if (typeof e.data === 'string') {
        mx.recv++;
        mx.recvBytes += e.data.length;
      }
      const m = parseServer(e.data);
      if (!m) return;
      switch (m.kind) {
        case 'welcome': {
          welcomedAt = Date.now();
          log('ws.open', { ms: welcomedAt - madeAt, retries: fails });
          fails = 0;
          offset = m.t - Date.now(); // a first guess until the pings refine it
          keepOffset();
          samples = [];
          setStatus({ connected: true, me: m.me, peer: m.peer, here: m.here ?? (m.peer ? [partnerOf(m.me)] : []), rec: m.rec, gone: m.gone ?? {} });
          for (const at of PING_MS) pings.push(setTimeout(ping, at));
          // a quiet socket is asked whether it's alive (a second welcome on one socket: the one timer still)
          if (pingEvery) clearTimeout(pingEvery);
          pingEvery = setTimeout(quiet, PING_EVERY_MS);
          // what never got its ack goes again (the relay acks a repeat without relaying it twice); another day's is
          // that day's, gone
          const today = tokyoDay(m.t);
          for (const [k, o] of outbox) if (o.d !== today) (outbox.delete(k), save());
          [...outbox.values()].forEach((o, i) => {
            const go = () => {
              o.n = 0;
              o.at = Date.now();
              o.due = o.at + ACK_MS;
              if (raw(o.m)) mx.resent++;
              if (!ackTimer) armAcks();
            };
            if (i < RESEND_BURST) go();
            else resend.push(setTimeout(go, (i - RESEND_BURST + 1) * RESEND_GAP_MS));
          });
          return;
        }
        case 'ack': {
          const o = outbox.get(m.c);
          if (!o) return;
          outbox.delete(m.c);
          save();
          mx.ackMs = [...mx.ackMs, Date.now() - o.at].slice(-ACKS_KEPT);
          armAcks();
          return;
        }
        case 'replay':
          // the day so far, in the room's order (mine too: folding my own again changes nothing)
          for (const r of m.es) {
            if (isStored(r) && r.t > lastWorld) since.set((lastWorld = r.t));
            for (const f of subs) safe(() => f(r));
          }
          return;
        case 'pong': {
          if (!sent.delete(m.c)) return;
          const rtt = Date.now() - m.c;
          samples = [...samples, { rtt, off: m.t - (m.c + rtt / 2) }].slice(-SAMPLES);
          offset = bestOffset(samples);
          keepOffset();
          return;
        }
        case 'presence': {
          if (m.who === st.me) return;
          const here = [...new Set([...st.here.filter((w) => w !== m.who), ...(m.on ? [m.who] : [])])].sort();
          // (when they left: the relay's clock, the same on every phone)
          const { [m.who]: _was, ...gone } = st.gone ?? {};
          return setStatus({ here, peer: peerOf(st.me, here), gone: m.on ? gone : { ...gone, [m.who]: m.t } });
        }
        case 'changed':
          return changed({ who: m.who, what: m.what, at: m.at, rev: m.rev });
        case 'wx': {
          // Tokyo's real sky by the hour (sync/wx.ts: kept for the island, cached for opening offline)
          const { v: _v, kind: _k, t: _t, ...w } = m;
          return safe(() => takeWx(w));
        }
        case 'busy': {
          // over the room's rate limit: it goes again on this socket after a backoff (1 s doubling), still in the outbox
          const o = outbox.get(m.c);
          if (!o) return;
          mx.busy++;
          o.due = Date.now() + backoff(o.n);
          armAcks();
          return;
        }
        default:
          if (m.who === st.me) return;
          if (m.kind === 'saved') return changed({ who: m.who, what: 'event' });
          if (isStored(m) && m.t > lastWorld) since.set((lastWorld = m.t));
          for (const f of subs) safe(() => f(m));
          // a high-five heard: the one the room held for me (if it's this one) goes
          if (m.kind === 'highfive') raw({ v: LIVE_V, kind: 'got', at: m.at });
      }
    };
    s.onclose = (e: CloseEvent) => {
      if (ws !== s) return;
      mx.closed = e.code;
      ws = null;
      clearTimers();
      setStatus({ connected: false, peer: false, here: [], rec: undefined, gone: undefined });
      log('ws.close', { code: e.code, secs: Math.round((Date.now() - (welcomedAt || madeAt)) / 1000), welcomed: welcomedAt > 0 });
      if (e.code === CLOSE.unauthorized || e.code === CLOSE.replaced || e.code === CLOSE.version) {
        parked = true;
        log('ws.park', { code: e.code }, e.code === CLOSE.replaced ? 1 : 2);
        if (e.code === CLOSE.unauthorized) log('auth.lost', { from: 'ws', code: e.code }, 2);
      } else schedule();
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
      const offWatch = env.watch(react);
      // back in front (pageshow, focus): a socket that looks open is asked whether it still is
      const offWake = env.wake?.(() => (st.connected ? probe() : react()));
      unwatch = () => (offWatch(), offWake?.());
      react();
    },
    stop() {
      running = false;
      unwatch?.();
      unwatch = null;
      drop();
    },
    send(i) {
      // what the room keeps (the shared world, a walk; a high-five, held for them) goes even with the partner away (they
      // hear it when they open), numbered, and is kept here until its ack: offline or dropped, it goes again after the
      // next welcome
      const kept = isAcked(i);
      // the guest's phone sends only what it may (the room would refuse the rest: live-protocol guestMaySend)
      if (st.me === 'G' && !guestMaySend(i)) return false;
      if (!kept && (!st.connected || !st.here.length)) return false;
      const c = kept ? nextSeq() : undefined;
      const m = { v: LIVE_V, ...(c !== undefined ? { c } : {}), ...i };
      const s = JSON.stringify(m);
      if (s.length > MAX_BYTES || !parseClient(s)) return false;
      const now = Date.now();
      const went = st.connected && raw(m);
      if (c !== undefined) {
        if (i.kind === 'walk') for (const [k, o] of outbox) if ((o.m as Intent).kind === 'walk') outbox.delete(k);
        outbox.set(c, { m, d: tokyoDay(now + offset), at: went ? now : 0, due: went ? now + ACK_MS : Infinity, n: 0 });
        while (outbox.size > OUTBOX_MAX) outbox.delete(outbox.keys().next().value!);
        save();
        if (went && !ackTimer) armAcks();
      }
      return went;
    },
    on(fn) {
      subs.add(fn);
      return () => void subs.delete(fn);
    },
    onChange(fn) {
      changeSubs.add(fn);
      return () => void changeSubs.delete(fn);
    },
    onStatus(fn) {
      statusSubs.add(fn);
      safe(() => fn(st));
      return () => void statusSubs.delete(fn);
    },
    status: () => st,
    serverNow: () => Date.now() + offset,
    metrics: () => ({ ...mx, pending: outbox.size })
  };
}

/** A kept intent waiting for its ack (the outbox's): `at` when it last went (0: not yet), `due` when its ack is
 *  overdue, `n` how often it went again on this socket. */
interface Out {
  m: object;
  /** The Tokyo day it was made on (the relay's clock): another day's is that day's, gone. */
  d: number;
  at: number;
  due: number;
  n: number;
}

/** Whether two `gone`s say the same. */
const sameGone = (a: Gone | undefined, b: Gone | undefined): boolean =>
  a === b || (!!a && !!b && (['A', 'B', 'G'] as const).every((w) => a[w] === b[w]));

/** A member's partner (the guest's phone: none, it sees both). */
const partnerOf = (me: Who): Who => (me === 'A' ? 'B' : 'A');
/** Whether `me`'s partner is among `here`: a member's the other member (never the guest), the guest's either member. */
export function peerOf(me: Who | null, here: readonly Who[]): boolean {
  return me === 'G' ? here.some((w) => w !== 'G') : here.includes(me === 'A' ? 'B' : 'A');
}

function safe(f: () => void): void {
  try {
    f();
  } catch (e) {
    console.error('live:', e);
  }
}

let shared: Live | null = null;
let appBuild: string | undefined;

/** The app's version for the hello (+layout.svelte, from `$app/env`). */
export const setLiveBuild = (b: string): void => void (appBuild = b);

/**
 * The phone's one relay socket, keyed by the paired key. Everything that talks to the relay shares it (the sync's push
 * now, the island's presence later): a second socket of the same person would replace this one (4002).
 */
export function liveRelay(): Live {
  return (shared ??= createLive({ key: getKey, build: () => appBuild }));
}
