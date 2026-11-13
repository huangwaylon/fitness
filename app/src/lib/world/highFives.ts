// The partner's high-fives heard today on this phone (docs/design.md "Villager taps"): the relay brings each one (live,
// or the one it held while this phone was closed), and a second hearing of the same one (a resend, the held copy) is
// no news. Kept per Tokyo day in localStorage (sync/storage.ts SCENE.highFivesGot), by the tap's time on the relay's
// clock (its identity). Plain TS: the storage comes in.
import { SCENE, localKV, readJson, writeJson, type KV } from '#lib/sync/storage.ts';
import { tokyoDay, type Who } from '#lib/contract/live-protocol.ts';

/** A high-five heard within this long of its tap (ms) plays as the moment (the two face each other, the sparkle, the
 *  hearts); older (held while this phone was closed) it's the banner and the hearts only. */
export const HIGHFIVE_LIVE_MS = 8000;
/** At most this many kept a day (the oldest go). */
const KEPT = 40;

/** Note a high-five tapped at `at` (relay clock) by `from` (absent: the partner) as heard by `me`'s phone; false when
 *  it was already. One per (sender, recipient) pair: the partner's are kept by their time (as before the guest), anyone
 *  else's as `<from>@<at>`. */
export function heardHighFive(me: Who, at: number, kv: KV | null = localKV(), from?: Who): boolean {
  const key = SCENE.highFivesGot(me), day = tokyoDay(at);
  const kept = readJson<{ day?: unknown; ats?: unknown }>(kv, key);
  const id: number | string = from && from !== partnerOf(me) ? `${from}@${at}` : at;
  const ats = kept?.day === day && Array.isArray(kept.ats) ? kept.ats.filter((x): x is number | string => typeof x === 'number' || typeof x === 'string') : [];
  if (ats.includes(id)) return false;
  writeJson(kv, key, { day, ats: [...ats, id].slice(-KEPT) });
  return true;
}
/** A member's partner (the guest's phone: A, by convention). */
const partnerOf = (me: Who): Who => (me === 'B' ? 'A' : me === 'A' ? 'B' : 'A');
