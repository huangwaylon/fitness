// Who each villager on this phone's island is (docs/design.md "The guest"): the director's villager actors are
// `mine` (this phone's own, moved by its taps), `partner` and `third`. On a member's phone `partner` is the other
// member and `third` the guest (always there, asleep while the guest's app is closed, moved only by the guest's phone); on the
// guest's phone `mine` is the guest's villager and `partner` / `third` are A / B. The island's life (ambient life, the
// meet-ups, ふたりでぜんぶ, the follow, group stretching) is everyone's on the island, the guest's villager too while it's
// here (2026-11-06; asleep, it's in none: 2026-11-09). Set by the island scene (and the tent) as it mounts; plain TS (store/where.svelte.ts reads it too).
import type { Who } from '#lib/types.ts';

export type VillagerActor = 'mine' | 'partner' | 'third';

let me: Who = 'A';

/** This phone is `viewer`'s (the scene's view). */
export function setCast(viewer: Who): void {
  me = viewer;
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

/** The guest has the island open (the relay's presence, set by the island scene): its villager, always on a member's
 *  island, is awake and in the island's life; closed, it sleeps where it last stood. */
let guestHere = false;
export function setGuestHere(on: boolean): void {
  guestHere = on;
}
/** The guest's app is closed (on a member's phone; on the guest's own, never). */
export const guestAway = (): boolean => me !== 'G' && !guestHere;

/** The villager actors on this island now (the island's life is between these): on a member's phone mine and the
 *  partner's, and the guest's while it's here; on the guest's phone all three. */
export const islandActors = (): readonly VillagerActor[] => (me === 'G' || guestHere ? ['mine', 'partner', 'third'] : ['mine', 'partner']);

/** The other villager actors on this island now, besides `id`. */
export const othersOf = (id: VillagerActor): VillagerActor[] => islandActors().filter((o) => o !== id);
