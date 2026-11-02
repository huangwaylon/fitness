// The campsite, the island's one building (docs/design.md "Buildings"): its door, the way into the tent (its own
// screen: docs/design.md "The tent"; visitors arrive from it and stay in its clearing). Pure: the scene turns my
// villager to the door (nav.ts) and goes in. The partner's presence is their villager and the edge face (IslandScene),
// not a character of its own.
import { doorOf } from './nav.ts';
import type { BuildingId, Pt } from './world.ts';

/** Where to stand to knock (nav.ts's door node). */
export const doorAt = (id: BuildingId): Pt => doorOf(id);

/** The partner has the app open: the relay says we are connected and the partner is in the room (the shared
 *  liveRelay()'s presence; never a socket of its own). Never in the demo. */
export const partnerOnline = (st: { connected: boolean; peer: boolean } | null, demo: boolean): boolean => !demo && !!st && st.connected && st.peer;

/** Where a villager stands just out of the tent: before its door, each of us to one side (A left, B right) so both can
 *  come out together. */
export const outOfTent = (who: 'A' | 'B'): Pt => {
  const [x, z] = doorOf('campsite');
  // (a step out in front of the door: standing there, a villager leaves the tent itself in view and tappable)
  return [x + (who === 'A' ? -12 : 12), z - 30];
};
