// What the rooms (the tent's and the homes', the shop's, the museum's) and the island share of the relay: the demo's
// own (a test relay named in the URL's hooks, else the tabs' local one: sync/live-local.ts) or the live app's, its
// clock, and a walk heard from it played from where it is by now.
import type { Who } from '#lib/types.ts';
import type { Pt, Relayed } from '#lib/contract/live-protocol.ts';
import { LIVE_URL, createLive, liveRelay, type Live } from '#lib/sync/live.ts';
import { createLocalLive } from '#lib/sync/live-local.ts';
import { hook } from '#lib/world/devHooks.ts';
import { useLoopClock } from '../villager3d/loopClock.ts';

/** The page's one test socket and how many of its users have started it. */
let test: { live: Live; users: number } | null = null;

/** The e2e's own relay (`relay` and `key` hooks: a ws(s) URL and its key), if named: one socket per page, as the app's
 *  liveRelay (each its own, without a `dev`, the island's, a room's and すごろく's hellos replaced each other: 4002),
 *  open while any user has started it and not stopped. */
export function testRelay(): Live | null {
  const url = hook('relay'), key = hook('key');
  if (!url || !/^wss?:\/\//.test(url) || !key) return null;
  const t = (test ??= { live: createLive({ url, key: () => key }), users: 0 });
  let on = false;
  return {
    ...t.live,
    start() {
      if (on) return;
      on = true;
      if (t.users++ === 0) t.live.start();
    },
    stop() {
      if (!on) return;
      on = false;
      if (--t.users === 0) t.live.stop();
    }
  };
}

/** A room's relay: in the demo its own (`own`, to stop as the room goes: the test relay or the tabs'), else the live
 *  app's (none without one); `now()` its clock (the relay's, as the island's: a `?date=` preview shifts the day, not
 *  when a walk set off), the uses' loops' too (villager3d useLoopClock). */
export function roomRelay(demo: boolean, me: Who): { own: Live | null; relay: Live | null; now: () => number } {
  const own = demo ? (testRelay() ?? createLocalLive(me)) : null;
  const relay = demo ? own : LIVE_URL ? liveRelay() : null;
  const now = () => relay?.serverNow() ?? Date.now();
  // (a piece's use loops on it too: both phones show the same rep)
  useLoopClock(now);
  return { own, relay, now };
}

interface Walker {
  put(who: Who, p: Pt): void;
  walk(who: Who, pts: readonly Pt[], o?: { from?: Pt; ago?: number; ms?: number }): number;
}
/** A walk heard (a `tent` intent in: its `to`, and its `from`, `via`, `s` and `ms` if it's said) on `eng`: from where
 *  it is by `now`, or at its end already, turned the way its last leg went (as on the walker's own phone); `to` alone:
 *  put there. */
export function replayWalk(eng: Walker, m: Extract<Relayed, { kind: 'tent' }>, now: number): void {
  if (!m.to) return;
  if (m.from && m.s !== undefined && m.ms) eng.walk(m.who, [...(m.via ?? []), m.to], { from: m.from, ago: Math.max(0, now - m.s), ms: m.ms });
  else eng.put(m.who, m.to);
}
