// The demo's relay (docs/backend.md#shared-world): the demo's two players are two tabs of one browser (`?demo` and
// `?demo&as=B`), so their island is shared through a BroadcastChannel, with the room's rules played by whichever tab
// sends (the day's world kept in localStorage: first claim wins, one nest per tree per hour, each person's last walk,
// carried into the next day; the music stages' last records, newerMusic's rule, replayed to a tab as it opens).
// The same `Live` as the real socket (sync/live.ts), so the island can't tell them apart; the e2e's two-player tests
// run on it. Its clock is the island's (clock.ts now(): a `?date=` preview moves the shared day too). Never used
// outside the demo. すごろく's moves (`sg`) are the room's too: the first at each game's index is kept, a later one refused,
// and each answered (onAck) once the other tabs have heard it (a ping each answers after what came before it), so a
// race lost is known: as the relay's room and acks, which a mini-game's moves from every seat need (wire.ts Outbox).
import { DEMO, localKV, readJson, writeJson } from './storage.ts';
import { LIVE_V, NEST_GAP_MS, claimOf, isStored, musicAt, musicBeats, musicLive, scopeMaySend, tokyoDayNum, type Gone, type Intent, type MusicRec, type MusicSrc, type Relayed, type Who } from '../contract/live-protocol.ts';
import { peerOf, type Live, type LiveStatus } from './live.ts';
import { now } from '#lib/time/clock.ts';

/** The other tab is there while its hello came within this (it says hello every HELLO_MS). */
const HELLO_MS = 4000;
const GONE_MS = 10_000;
const MAX = 400;

type Wire = { k: 'hi'; who: Who } | { k: 'bye'; who: Who } | { k: 'm'; m: Relayed } | { k: 'ping' | 'pong'; who: Who; c: string };

/** What an intent claims in the demo's room: the world's (claimOf), a すごろく move its game's index. */
const claim = (m: Intent): string | null => claimOf(m) ?? (m.kind === 'sg' ? `sg:${m.g}:${m.i}` : null);
/** A move's answer comes once every other tab has answered its ping, or after this. */
const ACK_MS = 1000;

interface Log {
  day: number;
  log: Relayed[];
}

/** The demo's relay for player `me`, on `channel` (a test's own name). */
export function createLocalLive(me: Who, channel = 'island-demo-relay'): Live {
  let bc: BroadcastChannel | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  /** When each other player's tab last said hello (the guest's `?demo&as=G` too). */
  const heard = new Map<Who, number>();
  let st: LiveStatus = { connected: false, me: null, peer: false, here: [] };
  const subs = new Set<(m: Relayed) => void>();
  const statusSubs = new Set<(s: LiveStatus) => void>();
  const ackSubs = new Set<(i: Intent, ok: boolean, t: number) => void>();
  /** My すごろく moves waiting for their answer, by claim: the tabs still to answer, whether another's beat it. */
  const asked = new Map<string, { i: Intent; t: number; need: Set<Who>; lost: boolean; timer: ReturnType<typeof setTimeout> }>();
  const answer = (c: string) => {
    const a = asked.get(c);
    if (!a) return;
    asked.delete(c);
    clearTimeout(a.timer);
    for (const f of ackSubs) f(a.i, !a.lost, a.t);
  };
  let lastT = 0;

  const setStatus = (s: Partial<LiveStatus>) => {
    const next = { ...st, ...s };
    if (next.connected === st.connected && next.me === st.me && next.peer === st.peer && next.here.join() === st.here.join() && JSON.stringify(next.gone) === JSON.stringify(st.gone)) return;
    st = next;
    for (const f of statusSubs) f(st);
  };
  const read = (): Log => {
    const today = tokyoDayNum(now().getTime());
    const l = readJson<Log>(localKV(), DEMO.relay);
    if (l && l.day === today && Array.isArray(l.log)) return l;
    // a new day starts empty but for each person's last walk, stamped into today (the room's rule: where their
    // villager was left, however long ago)
    const t = now().getTime();
    const fresh: Log = { day: today, log: l && Array.isArray(l.log) ? l.log.filter((x) => x.kind === 'walk').map((x) => ({ ...x, t })) : [] };
    if (fresh.log.length) writeJson(localKV(), DEMO.relay, fresh);
    return fresh;
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
    const c = claim(m);
    if (c && l.log.some((x) => claim(x) === c)) return false;
    if (m.kind === 'shake' && m.drop === 'nest' && l.log.some((x) => x.kind === 'shake' && x.drop === 'nest' && x.tree === m.tree && m.t - x.t < NEST_GAP_MS)) return false;
    const log = m.kind === 'walk' ? l.log.filter((x) => !(x.kind === 'walk' && x.who === m.who)) : l.log;
    writeJson(localKV(), DEMO.relay, { day: l.day, log: [...log, m].slice(-MAX) });
    return true;
  };
  /** The music stages (the room's `music`): a record kept when it beats the stage's and still says something, else
   *  the stage's goes back to its sender (as the room tells it what won). */
  const stages = (): Partial<Record<MusicSrc, MusicRec>> => readJson<Partial<Record<MusicSrc, MusicRec>>>(localKV(), DEMO.music) ?? {};
  const stageKeep = (m: MusicRec): boolean => {
    const all = stages(), cur = all[m.src];
    // (on the relay's clock, the device's here: `t` is the island's, a `?date=` preview's; its skew clamp too)
    m.at = musicAt(m.at, Date.now());
    if (!musicBeats(m, cur, Date.now())) {
      if (cur) deliver(cur);
      return false;
    }
    writeJson(localKV(), DEMO.music, { ...all, [m.src]: m });
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
      const was = heard.has(w.who);
      heard.set(w.who, Date.now());
      left.delete(w.who);
      present();
      if (!was) post({ k: 'hi', who: me }); // answer a newcomer at once
    } else if (w.k === 'bye' && w.who !== me) {
      heard.delete(w.who);
      gone(w.who, Date.now());
      present();
    }
    else if (w.k === 'm' && w.m.who !== me) {
      if (isStored(w.m)) relog(w.m);
      if (lostRace(w.m)) return;
      const c = claim(w.m), a = c ? asked.get(c) : undefined;
      if (a) a.lost = true;
      deliver(w.m);
    } else if (w.k === 'ping' && w.who !== me) post({ k: 'pong', who: me, c: w.c });
    else if (w.k === 'pong' && w.who !== me) {
      const a = asked.get(w.c);
      if (a && a.need.delete(w.who) && !a.need.size) answer(w.c);
    }
  };
  /** The day's log is one localStorage value both tabs read and write: two writing at once keep one of the two. Each
   *  tab puts what it hears from the other back in (the room's log holds every kept intent, as the relay's does). */
  const relog = (m: Relayed) => {
    const l = read();
    if (l.day !== tokyoDayNum(m.t) || l.log.some((x) => x.who === m.who && x.t === m.t && x.kind === m.kind)) return;
    const log = m.kind === 'walk' ? l.log.filter((x) => !(x.kind === 'walk' && x.who === m.who && x.t < m.t)) : l.log;
    if (m.kind === 'walk' && log.some((x) => x.kind === 'walk' && x.who === m.who)) return; // a newer walk is there
    writeJson(localKV(), DEMO.relay, { day: l.day, log: [...log, m].sort((x, y) => x.t - y.t).slice(-MAX) });
  };
  /** When each other tab left (its bye, or its last hello when it went quiet; at the start, the tabs' own record of
   *  their leaving: mine too), as the relay's `gone`. */
  const left = new Map<Who, number>();
  /** `who` left at `t`: kept here and in the tabs' record (a tab that never said bye: the room's notice). */
  const gone = (who: Who, t: number) => {
    if (who !== me) left.set(who, t);
    writeJson(localKV(), DEMO.gone, { ...(readJson<Gone>(localKV(), DEMO.gone) ?? {}), [who]: t });
  };
  const bye = () => {
    post({ k: 'bye', who: me });
    gone(me, Date.now());
  };
  /** Who is here now (the tabs heard from), as the relay's presence would say. */
  const present = () => {
    const here = [...heard.keys()].sort();
    setStatus({ here, peer: peerOf(me, here), gone: Object.fromEntries([...left].filter(([w]) => !heard.has(w)).sort()) });
  };
  /** Two tabs claiming the same thing at once both kept it (each played the room on its own): the room's order is the
   *  earlier (then A's), and the later claim is one the room would have refused, so it's never delivered. The tab
   *  that sent the later one hears the earlier and gives it up (world-day apply's `beat`). */
  const mine = new Map<string, { t: number }>();
  const lostRace = (m: Relayed): boolean => {
    const c = claim(m), my = c ? mine.get(c) : undefined;
    return !!my && (my.t < m.t || (my.t === m.t && me < m.who));
  };

  return {
    start() {
      if (bc || typeof BroadcastChannel === 'undefined') return;
      bc = new BroadcastChannel(channel);
      bc.onmessage = onWire;
      // when each tab last left (mine: my last time here, kept in the status for this start, as the relay's welcome
      // has it: the status stays the same till someone comes or goes), then I'm here
      const was = readJson<Gone>(localKV(), DEMO.gone) ?? {};
      for (const w of ['A', 'B', 'G'] as const) if (typeof was[w] === 'number') left.set(w, was[w]!);
      const { [me]: _mine, ...rest } = was;
      writeJson(localKV(), DEMO.gone, rest);
      setStatus({ connected: true, me, gone: Object.fromEntries([...left].sort()) });
      post({ k: 'hi', who: me });
      timer = setInterval(() => {
        post({ k: 'hi', who: me });
        for (const [w, t] of heard) if (Date.now() - t > GONE_MS) heard.delete(w), gone(w, t);
        present();
      }, HELLO_MS);
      addEventListener('pagehide', bye);
      // a tab opening later hears the day's world so far (the partner's), as a phone's hello would: of two claims of
      // one thing (both tabs kept theirs, racing), only the room's winner (the earlier, then A's), as the relay keeps
      queueMicrotask(() => {
        const log = read().log;
        const first = new Map<string, Relayed>();
        for (const m of log) {
          const c = claim(m), f = c ? first.get(c) : undefined;
          if (c && (!f || m.t < f.t || (m.t === f.t && m.who < f.who))) first.set(c, m);
        }
        for (const m of log) {
          const c = claim(m);
          if (c && m.who === me) mine.set(c, { t: m.t });
          if (m.who !== me && (!c || first.get(c) === m)) deliver(m);
        }
        // the music stages still playing (or stopped lately), mine too
        for (const m of Object.values(stages())) if (m && musicLive(m, Date.now())) deliver(m);
      });
    },
    stop() {
      bye();
      removeEventListener('pagehide', bye);
      if (timer) clearInterval(timer);
      timer = null;
      bc?.close();
      bc = null;
      heard.clear();
      left.clear();
      for (const c of [...asked.keys()]) answer(c);
      setStatus({ connected: false, peer: false, here: [], gone: undefined });
    },
    send(i: Intent) {
      if (!st.connected || (!st.here.length && !isStored(i) && i.kind !== 'music')) return false;
      if (i.kind === 'decor' && !scopeMaySend(me, i.sc, i.id)) return false;
      lastT = Math.max(now().getTime(), lastT + 1);
      const m = { ...i, v: LIVE_V, who: me, t: lastT } as Relayed;
      const sg = m.kind === 'sg' ? claim(m)! : null;
      if (isStored(m) && !keep(m)) {
        // refused by the room: it went, and nobody hears it (a すごろく move answered so)
        if (sg) queueMicrotask(() => { for (const f of ackSubs) f(i, false, m.t); });
        return true;
      }
      if (m.kind === 'music' && !stageKeep(m)) return true;
      const c = claim(m);
      if (c) mine.set(c, { t: m.t });
      post({ k: 'm', m });
      if (sg) {
        asked.set(sg, { i, t: m.t, need: new Set(heard.keys()), lost: false, timer: setTimeout(() => answer(sg), ACK_MS) });
        if (heard.size) post({ k: 'ping', who: me, c: sg });
        else queueMicrotask(() => answer(sg));
      }
      return true;
    },
    on(fn) {
      subs.add(fn);
      return () => void subs.delete(fn);
    },
    onChange: () => () => {},
    onAck(fn) {
      ackSubs.add(fn);
      return () => void ackSubs.delete(fn);
    },
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
