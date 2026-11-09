// Who each villager on this phone's island is (docs/design.md "The guest"): the director's villager actors are
// `mine` (this phone's own, moved by its taps), `partner` and `third`. On a member's phone `partner` is the other
// member and `third` the guest (moved only by the guest's phone); on the guest's phone `mine` is the guest's villager
// and `partner` / `third` are A / B. All three are always on the island, each awake while its person's app is open and
// asleep while it's closed (2026-11-09: the same for everyone, no night's sleep); the island's life (ambient life, the
// meet-ups, ふたりでぜんぶ, the follow, group stretching) is the awake ones'. Set by the island scene (and the tent) as
// it mounts; plain TS (store/where.svelte.ts reads it too).
import type { Who } from '#lib/types.ts';
import type { Gone } from '#lib/contract/live-protocol.ts';
import { SCENE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { SPANS, awakeIn, nextTurn, onlineIn, seenSince, type Seen, type Spans } from './presence.ts';

export type VillagerActor = 'mine' | 'partner' | 'third';

let me: Who = 'A';

/** This phone is `viewer`'s (the scene's view). */
export function setCast(viewer: Who): void {
  me = viewer;
  restoreSeen();
}

/** Who this phone is. */
export const castMe = (): Who => me;

/** The guest's phone. */
export const guestPhone = (): boolean => me === 'G';

/** The actor that draws `w`'s villager on `viewer`'s phone. */
export function actorOfFor(viewer: Who, w: Who): VillagerActor {
  if (w === viewer) return 'mine';
  if (viewer === 'G') return w === 'A' ? 'partner' : 'third';
  return w === 'G' ? 'third' : 'partner';
}

/** Whose villager an actor draws on `viewer`'s phone. */
export function whoOfFor(viewer: Who, id: VillagerActor): Who {
  if (id === 'mine') return viewer;
  if (viewer === 'G') return id === 'partner' ? 'A' : 'B';
  return id === 'third' ? 'G' : viewer === 'A' ? 'B' : 'A';
}

/** The actor that draws `w`'s villager here. */
export const actorOf = (w: Who): VillagerActor => actorOfFor(me, w);

/** Whose villager an actor draws here. */
export const whoOf = (id: VillagerActor): Who => whoOfFor(me, id);

// Who is awake (ui-state/presence.ts: online, or woken by a tap; the user, 2026-11-09): the relay's word, kept here by
// the island scene (setPresence at each status, setWoke at each wake), on the relay's clock (setPresenceClock).
let seen: Seen | null = null;
let woke: Gone = {};
const DEVICE = (): number => Date.now();
let clock = DEVICE;
let everyone = false;
let spans: Spans = SPANS;
/** The relay's clock (the scene's relayNow; null: the device's, as the scene goes, so nothing here keeps it). */
export function setPresenceClock(fn: (() => number) | null): void {
  clock = fn ?? DEVICE;
}
/** What the relay says (its status: `here`, `gone`). Disconnected, the last word holds till the next welcome. */
export function setPresence(st: { connected: boolean; here: readonly Who[]; gone?: Gone }): void {
  if (!st.connected) return;
  seen = { here: st.here, gone: st.gone };
  keepSeen();
}
/** A villager woken by a tap here or on another phone, at `at` (the relay's clock). */
export function setWoke(w: Who, at: number): void {
  woke = { ...woke, [w]: at };
}
/** How long one gone stays online and a tap keeps one up (ms; `?grace=<ms>`, `?wake=<ms>`: the e2e's shorter). */
export function setSpans(o: Partial<Spans>): void {
  spans = { ...SPANS, ...o };
}
/** How long a tap keeps a sleeping villager up (ms: presence.ts WAKE_MS). */
export const wakeMs = (): number => spans.wake;
/** Everyone counts as online (`?awake`, dev and the e2e: a spec about the partner's villager without its phone). */
export function setEveryoneAwake(on: boolean): void {
  everyone = on;
}
const KEY = (): string => SCENE.presence(me);
/** What the relay said, kept across a reload (its `here` as gone at the moment: presence.ts seenSince). */
export function keepSeen(): void {
  if (seen) writeJson(localKV(), KEY(), { ...seen, at: clock() });
}
/** The last word kept on this phone (setCast's), till the welcome. */
function restoreSeen(): void {
  const k = readJson<Seen & { at: number }>(localKV(), KEY());
  seen = k && Array.isArray(k.here) ? seenSince(k, k.at) : null;
  woke = {};
  clock = DEVICE;
}
/** `w`'s person has the island open (mine always; another by the relay, within the grace). */
export const online = (w: Who): boolean => w === me || everyone || onlineIn(seen, w, clock(), spans);
/** `w`'s villager is awake (online, or woken under wakeMs() ago): asleep where it stands otherwise. */
export const awake = (w: Who): boolean => online(w) || awakeIn(seen, woke, w, clock(), spans);
/** How long till someone falls asleep by themselves (a grace or a wake running out: ms), or null. */
export function sleepIn(): number | null {
  const t = clock(), next = everyone ? null : nextTurn(seen, woke, t, spans);
  return next === null ? null : next - t;
}

/** The villager actors in the island's life now (awake: ambient life, the meet-ups, the follow, group stretching). */
export const islandActors = (): readonly VillagerActor[] => (['mine', 'partner', 'third'] as const).filter((id) => awake(whoOf(id)));

/** The other villager actors on this island now, besides `id`. */
export const othersOf = (id: VillagerActor): VillagerActor[] => islandActors().filter((o) => o !== id);
