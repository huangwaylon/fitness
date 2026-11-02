// Who each villager on this phone's island is (docs/design.md "The guest"): the director's villager actors are
// `mine` (this phone's own, moved by its taps), `partner` and `third`. On a member's phone `partner` is the other
// member and `third` the guest (shown only while the guest's app is open, moved only by the guest's phone); on the
// guest's phone `mine` is the guest's villager and `partner` / `third` are A / B. The members' own life (outings, the
// meet-ups, ふたりでぜんぶ, the follow) is between the two members' actors only; the guest never takes part in it.
// Set by the island scene (and the tent) as it mounts; plain TS (store/where.svelte.ts reads it too).
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

/** The members' two actors on this phone (their own life is between these): mine and partner on a member's phone, the
 *  partner and the third on the guest's. */
export const memberActors = (): readonly [VillagerActor, VillagerActor] => (me === 'G' ? ['partner', 'third'] : ['mine', 'partner']);

/** The other member's actor (null for the guest's villager, which shares no member life). */
export function otherMember(id: VillagerActor): VillagerActor | null {
  const [a, b] = memberActors();
  return id === a ? b : id === b ? a : null;
}
