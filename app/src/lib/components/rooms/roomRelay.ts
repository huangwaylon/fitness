// What the rooms (the tent's and the homes', the shop's, the museum's) and the island share of the relay: the demo's
// own (a test relay named in the URL's hooks, else the tabs' local one: sync/live-local.ts) or the live app's, its
// clock, and a walk heard from it played from where it is by now.
import type { Who } from '#lib/types.ts';
import type { Pt, Relayed } from '#lib/contract/live-protocol.ts';
import { LIVE_URL, createLive, liveRelay, type Live } from '#lib/sync/live.ts';
import { createLocalLive } from '#lib/sync/live-local.ts';
import { hook } from '#lib/world/devHooks.ts';

/** The e2e's own relay (`relay` and `key` hooks: a ws(s) URL and its key), if named. */
export function testRelay(): Live | null {
  const url = hook('relay'), key = hook('key');
  return url && /^wss?:\/\//.test(url) && key ? createLive({ url, key: () => key }) : null;
}

/** A room's relay: in the demo its own (`own`, to stop as the room goes: the test relay or the tabs'), else the live
 *  app's (none without one); `now()` its clock (the relay's, as the island's: a `?date=` preview shifts the day, not
 *  when a walk set off). */
export function roomRelay(demo: boolean, me: Who): { own: Live | null; relay: Live | null; now: () => number } {
  const own = demo ? (testRelay() ?? createLocalLive(me)) : null;
  const relay = demo ? own : LIVE_URL ? liveRelay() : null;
  return { own, relay, now: () => relay?.serverNow() ?? Date.now() };
}

interface Walker {
  put(who: Who, p: Pt): void;
  walk(who: Who, pts: readonly Pt[], o?: { from?: Pt; ago?: number; ms?: number }): number;
}
/** A walk heard (a `tent` intent in: its `to`, and its `from`, `via`, `s` and `ms` if under way) on `eng`: from where
 *  it is by `now`, or there already. */
export function replayWalk(eng: Walker, m: Extract<Relayed, { kind: 'tent' }>, now: number): void {
  if (!m.to) return;
  const ago = m.from && m.s !== undefined && m.ms ? now - m.s : Infinity;
  if (ago < m.ms!) eng.walk(m.who, [...(m.via ?? []), m.to], { from: m.from, ago, ms: m.ms });
  else eng.put(m.who, m.to);
}
