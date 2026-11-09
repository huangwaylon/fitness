// Who is awake on the island (docs/design.md "Sleep"; the user, 2026-11-09: "if online, then awake; if offline, then
// asleep"): a villager is awake while its person's app is open (the relay's `here`), for GRACE_MS after it closed (a
// reload, a backgrounded tab, a dropped socket) and for WAKE_MS after a tap woke it (`act wake`, its `at`). Every input
// is the relay's and on its clock (the room's `gone` stamps, a wake's `at`), never a phone's own view, so every open
// phone puts the same villagers to sleep at the same instant. Pure: cast.ts keeps the state.
import type { Who } from '#lib/types.ts';
import type { Gone } from '#lib/contract/live-protocol.ts';

/** One who left stays online this long (ms, the relay's clock): no flicker for a reload or a moment in another app. */
export const GRACE_MS = 45_000;
/** A tap keeps a sleeping villager up this long (ms), in the island's life, then it sleeps where it ends up. */
export const WAKE_MS = 60_000;

/** The two spans (ms): the e2e's shorter (`?grace=`, `?wake=`: cast.ts setSpans). */
export interface Spans {
  grace: number;
  wake: number;
}
export const SPANS: Spans = { grace: GRACE_MS, wake: WAKE_MS };

/** What the relay last said: who else is here, and when each of the rest left (its clock). */
export interface Seen {
  here: readonly Who[];
  gone?: Gone;
}

/** `w` is online at `t`: here, or gone under the grace ago (nothing heard yet: offline). */
export function onlineIn(s: Seen | null, w: Who, t: number, o: Spans = SPANS): boolean {
  if (!s) return false;
  if (s.here.includes(w)) return true;
  const g = s.gone?.[w];
  return g !== undefined && t - g < o.grace;
}

/** `w` is awake at `t`: online, or woken (`woke`: each one's last wake, the relay's `at`) under the wake's span ago. */
export function awakeIn(s: Seen | null, woke: Gone, w: Who, t: number, o: Spans = SPANS): boolean {
  const k = woke[w];
  return onlineIn(s, w, t, o) || (k !== undefined && t >= k && t - k < o.wake);
}

/** The next instant after `t` someone's state turns by itself (a grace or a wake running out), or null. */
export function nextTurn(s: Seen | null, woke: Gone, t: number, o: Spans = SPANS): number | null {
  let next: number | null = null;
  const at = (x: number | undefined) => {
    if (x !== undefined && x > t && (next === null || x < next)) next = x;
  };
  for (const w of ['A', 'B', 'G'] as const) {
    const g = s?.gone?.[w], k = woke[w];
    if (g !== undefined && !s!.here.includes(w)) at(g + o.grace);
    if (k !== undefined) at(k + o.wake);
  }
  return next;
}

/** A Seen kept across a reload, as of `at`: those here then count as gone at `at` (still online within the grace;
 *  the welcome tells the rest). */
export function seenSince(s: Seen, at: number): Seen {
  const gone: Gone = { ...s.gone };
  for (const w of s.here) gone[w] = at;
  return { here: [], gone };
}
