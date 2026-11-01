// The buildings (spec §3, docs/design.md "World"): their doors, who answers at each (NH's characters stay inside:
// their balloon's tail points at the door, their NH colour on the name tag), what they say, what each opens, and
// Wilbur on the airport's dock while the partner's app is open. Pure data and rules: the
// scene walks my villager to the door (nav.ts), says the line through Talk and opens the feature when it closes.
//   Resident Services → せってい (しずえ by day, たぬきち at night), Nook's Cranny → ごほうび (まめきち・つぶきち, the
//   echo), Able Sisters → the むらびと picker (あさみ), the museum → ずかん (フータ: Museum.svelte's own), Dodo Airlines →
//   つうしん (モーリー), the campsite → a line about today's guest (nobody inside).
import { doorOf } from './nav.ts';
import { DOCK, type BuildingId, type Pt } from './world.ts';

/** What a door opens: the panel's せってい (at the top, the むらびと picker or つうしん), ごほうび, the ずかん, or nothing. */
export type DoorOpens = 'settings' | 'villager' | 'sync' | 'shop' | 'zukan' | null;

export type NpcId = 'isabelle' | 'nook' | 'nooklings' | 'mabel' | 'blathers' | 'orville' | 'wilbur';
interface Npc {
  /** i18n key of the name on the tag, and the tag's colour (the character's NH colour). */
  name: string;
  colour: string;
  /** How many lines they have (world.door.<line>.<n>); 0: one line, `world.door.<line>`. */
  lines: number;
  /** The lines' key (world.door.<line>.*). */
  line: string;
}
/** NH's people and their name-tag colours. Their lines are in the main catalogs (world.door.*), short, in each one's NH
 *  speech: しずえ polite and bright (あっ、…ですよ), たぬきち's だなも, the Nooklings' echo (「…ませ〜！」), あさみ's warm
 *  shop talk (and her sister in the back), モーリー's "Hey hey hey!" (はいはーい！) and the airport as the gateway to
 *  the skies, ロドリー's radio talk (…オーバー！). Lines may carry {name}: my villager's name. */
export const NPCS: Record<NpcId, Npc> = {
  isabelle: { name: 'world.npc.isabelle', colour: '#FFF98F', lines: 3, line: 'rs' },
  nook: { name: 'world.npc.nook', colour: '#DE8735', lines: 2, line: 'nook' },
  nooklings: { name: 'world.npc.nooklings', colour: '#C88B48', lines: 3, line: 'cranny' },
  mabel: { name: 'world.npc.mabel', colour: '#7FB6E8', lines: 3, line: 'able' },
  blathers: { name: 'museum.blathers', colour: '#7D593C', lines: 0, line: 'museum' },
  orville: { name: 'world.npc.orville', colour: '#FFDF50', lines: 3, line: 'airport' },
  wilbur: { name: 'world.npc.wilbur', colour: '#FFDF50', lines: 0, line: 'wilbur' }
};


interface Info {
  /** Who answers (by the hour, Tokyo); null: nobody (the campsite). */
  npc: (hour: number) => NpcId | null;
  opens: DoorOpens;
}

/** Tom Nook minds Resident Services at night (22:00–05:00), しずえ the rest of the day. */
export const nightAtRs = (hour: number): boolean => hour >= 22 || hour < 5;

/** Each building: who is inside and what its door opens. */
export const INFO: Record<BuildingId, Info> = {
  rs: { npc: (h) => (nightAtRs(h) ? 'nook' : 'isabelle'), opens: 'settings' },
  cranny: { npc: () => 'nooklings', opens: 'shop' },
  able: { npc: () => 'mabel', opens: 'villager' },
  museum: { npc: () => 'blathers', opens: 'zukan' },
  airport: { npc: () => 'orville', opens: 'sync' },
  campsite: { npc: () => null, opens: null }
};

/** Where to stand to knock (nav.ts's door node). */
export const doorAt = (id: BuildingId): Pt => doorOf(id);


export interface DoorLine {
  npc: NpcId | null;
  /** The tag's name key and colour. */
  name: string;
  colour: string;
  /** The line's i18n key. */
  key: string;
  opens: DoorOpens;
}

/** Who answers at a building's door at `hour` (Tokyo), the line (picked at random, never `last` twice running) and
 *  what opens after. Null for the museum (フータ is Museum.svelte's own). The campsite has nobody: its line is about
 *  today's guest (the scene adds the guest). */
export function doorLine(id: BuildingId, hour: number, rnd: () => number, last?: string): DoorLine | null {
  const info = INFO[id], who = info.npc(hour);
  if (who === 'blathers') return null;
  if (!who) return { npc: null, name: `world.building.${id}`, colour: '#B5D98A', key: `world.door.${id}`, opens: info.opens };
  const n = NPCS[who], base = `world.door.${n.line}`;
  if (!n.lines) return { npc: who, name: n.name, colour: n.colour, key: base, opens: info.opens };
  let k = Math.floor(rnd() * n.lines) % n.lines;
  if (`${base}.${k}` === last && n.lines > 1) k = (k + 1) % n.lines;
  return { npc: who, name: n.name, colour: n.colour, key: `${base}.${k}`, opens: info.opens };
}


/** Wilbur's spot on the dock: its far end, beside the airport (world units). */
export const WILBUR_AT: Pt = [DOCK.x1 - 16, (DOCK.z0 + DOCK.z1) / 2 - 3];
/** Wilbur stands there while the partner's app is open: the relay says we are connected and the partner is in the room
 *  (the shared liveRelay()'s presence; never a socket of its own). Never in the demo. */
export const wilburShows = (st: { connected: boolean; peer: boolean } | null, demo: boolean): boolean => !demo && !!st && st.connected && st.peer;
