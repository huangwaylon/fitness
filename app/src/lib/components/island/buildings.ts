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

/** Where a villager stands just out of the tent: before its door, each of us to one side (A left, B right, the guest
 *  a step further out in the middle) so all can come out together. */
export const outOfTent = (who: 'A' | 'B' | 'G'): Pt => {
  const [x, z] = doorOf('campsite');
  // (a step out in front of the door: standing there, a villager leaves the tent itself in view and tappable)
  return who === 'G' ? [x, z - 46] : [x + (who === 'A' ? -12 : 12), z - 30];
};

/** The guest's spot (docs/design.md "The guest"): by the campsite, NH's visitors' clearing, on the door's right. It has
 *  no home or tree of its own; this is where it stands once it has arrived. */
export const GUEST_SPOT: Pt = [238, 950];
/** Where the guest's villager comes ashore each time its app opens: the front beach's right end, as off a boat at the
 *  shore, then it walks up the island to its spot. */
export const GUEST_ARRIVAL: Pt = [300, 20];
