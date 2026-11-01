// The campsite, the island's one building (docs/design.md "Buildings"): its door, and what a knock says. Nobody lives
// inside; the line is about today's guest (visitors arrive from it and stay in its clearing). Pure: the scene walks my
// villager to the door (nav.ts) and says the line through Talk. The partner's presence is their villager and the edge
// face (IslandScene), not a character of its own.
import { doorOf } from './nav.ts';
import type { BuildingId, Pt } from './world.ts';

/** Where to stand to knock (nav.ts's door node). */
export const doorAt = (id: BuildingId): Pt => doorOf(id);

/** The campsite's line: who is visiting today (`{name}`), or that nobody is. */
export const campLine = (guest: boolean): string => (guest ? 'world.door.campsite.guest' : 'world.door.campsite');

/** The partner has the app open: the relay says we are connected and the partner is in the room (the shared
 *  liveRelay()'s presence; never a socket of its own). Never in the demo. */
export const partnerOnline = (st: { connected: boolean; peer: boolean } | null, demo: boolean): boolean => !demo && !!st && st.connected && st.peer;
