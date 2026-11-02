// The demo's relay (docs/backend.md#shared-world): the demo's two players are two tabs of one browser (`?demo` and
// `?demo&as=B`), so their island is shared through a BroadcastChannel, with the room's rules played by whichever tab
// sends (the day's world kept in localStorage: first claim wins, one nest per tree per hour, each person's last walk).
// The same `Live` as the real socket (sync/live.ts), so the island can't tell them apart; the e2e's two-player tests
// run on it. Its clock is the island's (clock.ts now(): a `?date=` preview moves the shared day too). Never used
// outside the demo.
import { DEMO, localKV, readJson, writeJson } from './storage.ts';
import { NEST_GAP_MS, claimOf, isStored, tokyoDay, type Intent, type Relayed, type Who } from './live-protocol.ts';
import type { Live, LiveStatus } from './live.ts';
import { now } from '#lib/time/clock.ts';

/** The other tab is there while its hello came within this (it says hello every HELLO_MS). */
const HELLO_MS = 4000;
const GONE_MS = 10_000;
const MAX = 400;

type Wire = { k: 'hi'; who: Who } | { k: 'bye'; who: Who } | { k: 'm'; m: Relayed };

interface Log {
  day: number;
  log: Relayed[];
}

/** The demo's relay for player `me`, on `channel` (a test's own name). */
export function createLocalLive(me: Who, channel = 'island-demo-relay'): Live {
  let bc: BroadcastChannel | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let heard = 0;
  let st: LiveStatus = { connected: false, me: null, peer: false };
  const subs = new Set<(m: Relayed) => void>();
  const statusSubs = new Set<(s: LiveStatus) => void>();
  let lastT = 0;

  const setStatus = (s: Partial<LiveStatus>) => {
    const next = { ...st, ...s };
    if (next.connected === st.connected && next.me === st.me && next.peer === st.peer) return;
    st = next;
    for (const f of statusSubs) f(st);
  };
  const read = (): Log => {
    const today = tokyoDay(now().getTime());
    const l = readJson<Log>(localKV(), DEMO.relay);
    return l && l.day === today && Array.isArray(l.log) ? l : { day: today, log: [] };
  };
  const deliver = (m: Relayed) => {
    for (const f of subs) {
      try {
        f(m);
      } catch (e) {
        console.error('live (demo):', e);
      }
    }
  };
  /** The room's rules on the day's log: false when it refuses (claimed already, a nest within the hour). */
  const keep = (m: Relayed): boolean => {
    const l = read();
    const c = claimOf(m);
    if (c && l.log.some((x) => claimOf(x) === c)) return false;
    if (m.kind === 'shake' && m.drop === 'nest' && l.log.some((x) => x.kind === 'shake' && x.drop === 'nest' && x.tree === m.tree && m.t - x.t < NEST_GAP_MS)) return false;
    const log = m.kind === 'walk' ? l.log.filter((x) => !(x.kind === 'walk' && x.who === m.who)) : l.log;
    writeJson(localKV(), DEMO.relay, { day: l.day, log: [...log, m].slice(-MAX) });
    return true;
  };
  const post = (w: Wire) => {
    try {
      bc?.postMessage(w);
    } catch {
      /* closed */
    }
  };
  const onWire = (e: MessageEvent<Wire>) => {
    const w = e.data;
    if (!w || typeof w !== 'object') return;
    if (w.k === 'hi' && w.who !== me) {
      const was = st.peer;
      heard = Date.now();
      setStatus({ peer: true });
      if (!was) post({ k: 'hi', who: me }); // answer a newcomer at once
    } else if (w.k === 'bye' && w.who !== me) setStatus({ peer: false });
    else if (w.k === 'm' && w.m.who !== me) {
      if (isStored(w.m)) relog(w.m);
      if (!lostRace(w.m)) deliver(w.m);
    }
  };
  /** The day's log is one localStorage value both tabs read and write: two writing at once keep one of the two. Each
   *  tab puts what it hears from the other back in (the room's log holds every kept intent, as the relay's does). */
  const relog = (m: Relayed) => {
    const l = read();
    if (l.day !== tokyoDay(m.t) || l.log.some((x) => x.who === m.who && x.t === m.t && x.kind === m.kind)) return;
    const log = m.kind === 'walk' ? l.log.filter((x) => !(x.kind === 'walk' && x.who === m.who && x.t < m.t)) : l.log;
    if (m.kind === 'walk' && log.some((x) => x.kind === 'walk' && x.who === m.who)) return; // a newer walk is there
    writeJson(localKV(), DEMO.relay, { day: l.day, log: [...log, m].sort((x, y) => x.t - y.t).slice(-MAX) });
  };
  const bye = () => post({ k: 'bye', who: me });
  /** Two tabs claiming the same thing at once both kept it (each played the room on its own): the room's order is the
   *  earlier (then A's), and the later claim is one the room would have refused, so it's never delivered. The tab
   *  that sent the later one hears the earlier and gives it up (world-day apply's `beat`). */
  const mine = new Map<string, { t: number }>();
  const lostRace = (m: Relayed): boolean => {
    const c = claimOf(m), my = c ? mine.get(c) : undefined;
    return !!my && (my.t < m.t || (my.t === m.t && me < m.who));
  };

  return {
    start() {
      if (bc || typeof BroadcastChannel === 'undefined') return;
      bc = new BroadcastChannel(channel);
      bc.onmessage = onWire;
      setStatus({ connected: true, me });
      post({ k: 'hi', who: me });
      timer = setInterval(() => {
        post({ k: 'hi', who: me });
        if (st.peer && Date.now() - heard > GONE_MS) setStatus({ peer: false });
      }, HELLO_MS);
      addEventListener('pagehide', bye);
      // a tab opening later hears the day's world so far (the partner's), as a phone's hello would: of two claims of
      // one thing (both tabs kept theirs, racing), only the room's winner (the earlier, then A's), as the relay keeps
      queueMicrotask(() => {
        const log = read().log;
        const first = new Map<string, Relayed>();
        for (const m of log) {
          const c = claimOf(m), f = c ? first.get(c) : undefined;
          if (c && (!f || m.t < f.t || (m.t === f.t && m.who < f.who))) first.set(c, m);
        }
        for (const m of log) {
          const c = claimOf(m);
          if (c && m.who === me) mine.set(c, { t: m.t });
          if (m.who !== me && (!c || first.get(c) === m)) deliver(m);
        }
      });
    },
    stop() {
      bye();
      removeEventListener('pagehide', bye);
      if (timer) clearInterval(timer);
      timer = null;
      bc?.close();
      bc = null;
      setStatus({ connected: false, peer: false });
    },
    send(i: Intent) {
      if (!st.connected || (!st.peer && !isStored(i))) return false;
      lastT = Math.max(now().getTime(), lastT + 1);
      const m = { ...i, v: 2, who: me, t: lastT } as Relayed;
      if (isStored(m) && !keep(m)) return true; // refused by the room: it went, and nobody hears it
      const c = claimOf(m);
      if (c) mine.set(c, { t: m.t });
      post({ k: 'm', m });
      return true;
    },
    on(fn) {
      subs.add(fn);
      return () => void subs.delete(fn);
    },
    onChange: () => () => {},
    onStatus(fn) {
      statusSubs.add(fn);
      fn(st);
      return () => void statusSubs.delete(fn);
    },
    status: () => st,
    // the island's clock is the shared day's: the store adds this phone's offset from the relay (none: one browser)
    serverNow: () => Date.now()
  };
}
