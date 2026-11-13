// The buildings (docs/design.md "Buildings"): their doors, the way into the tent, a home's room, the museum and the
// shop (each its own screen), and the step back out. Pure: the scene turns my villager to the door (nav.ts) and goes
// in. The partner's presence is their villager and the edge face (IslandScene), not a character of its own.
import { doorOf } from './nav.ts';
import { HOME_OF } from './layoutWorld.ts';
import { exitOf } from '#lib/layout/nav.ts';
import { BUILDINGS, CAMPSITE, layoutNav, type BuildingId, type Pt } from './world.ts';

/** Where to stand to knock (nav.ts's door node). */
export const doorAt = (id: BuildingId): Pt => doorOf(id);

/** The partner has the app open: the relay says we are connected and the partner is in the room (the shared
 *  liveRelay()'s presence; never a socket of its own). Never in the demo. */
export const partnerOnline = (st: { connected: boolean; peer: boolean } | null, demo: boolean): boolean => !demo && !!st && st.connected && st.peer;

/** Where a villager stands just out of a building's door, facing out (layout/nav.ts exitOf: each of us to one side,
 *  the guest a step further out, on walkable ground); on world.ts's island (no layout yet), a step in front of its
 *  door. */
export const outOf = (id: BuildingId, who: 'A' | 'B' | 'G'): { at: Pt; face: 'home' | 'l' | 'r' } => {
  const ln = layoutNav(), e = ln && exitOf(ln, HOME_OF[id], who);
  if (e) return e;
  const [x, z] = doorOf(id);
  return { at: who === 'G' ? [x, z - 46] : [x + (who === 'A' ? -12 : 12), z - 30], face: 'home' };
};

/** The guest's spot (docs/design.md "The guest"): where its villager stands till it's moved. On the layout, in front of its
 *  own house (home-G), on the door's right; on world.ts's island (no house of its own) by the campsite, NH's visitors'
 *  clearing. */
export const guestSpot = (): Pt => {
  const g = BUILDINGS.find((b) => b.id === 'home-G');
  return g ? [g.x + 36, g.z - 30] : [CAMPSITE.x + 42, CAMPSITE.z - 34];
};
