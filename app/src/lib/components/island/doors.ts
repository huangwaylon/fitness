// The buildings' doors (docs/design.md "World"): who answers at each door (NH's characters stay inside: their balloon's
// tail points at the door, their NH colour on the name tag), what they say and what opens after. Pure: IslandScene says
// the lines through Talk and opens the feature when the balloon closes.
import type { BuildingId } from './world.ts';

export type DoorOpens = 'settings' | 'villager' | 'sync' | 'shop' | 'zukan' | null;

interface Door {
  /** i18n key of the speaker's name, and the name tag's colour. */
  name: string;
  colour: string;
  /** How many lines (world.door.<id>.<n>); one is picked, never the same twice running. */
  lines: number;
  opens: DoorOpens;
}

/** NH's people at the doors: しずえ (たぬきち at night) at Resident Services, まめきち・つぶきち at the Cranny, あさみ at
 *  Able Sisters, モーリー at the airport; the museum is フータ's (Museum.svelte); the campsite has nobody (a line about
 *  today's guest). */
const DOORS: Record<Exclude<BuildingId, 'museum'>, Door> = {
  rs: { name: 'world.npc.isabelle', colour: '#FFF98F', lines: 3, opens: 'settings' },
  cranny: { name: 'world.npc.nooklings', colour: '#C88B48', lines: 3, opens: 'shop' },
  able: { name: 'world.npc.mabel', colour: '#7FB6E8', lines: 3, opens: 'villager' },
  airport: { name: 'world.npc.orville', colour: '#FFDF50', lines: 3, opens: 'sync' },
  campsite: { name: 'world.building.campsite', colour: '#B5D98A', lines: 0, opens: null }
};
/** Tom Nook minds Resident Services at night (22:00–05:00). */
const NIGHT_RS: Door = { name: 'world.npc.nook', colour: '#DE8735', lines: 2, opens: 'settings' };

/** Who answers at a building's door at `hour` (Tokyo), the line's key and what opens after; `last`: the last line said
 *  there (not repeated). Null for the museum (its own component). */
export function doorLine(id: BuildingId, hour: number, rnd: () => number, last?: string): { name: string; colour: string; key: string; opens: DoorOpens } | null {
  if (id === 'museum') return null;
  const night = id === 'rs' && (hour >= 22 || hour < 5);
  const d = night ? NIGHT_RS : DOORS[id];
  const base = `world.door.${night ? 'nook' : id}`;
  if (!d.lines) return { name: d.name, colour: d.colour, key: base, opens: d.opens };
  let n = Math.floor(rnd() * d.lines);
  if (`${base}.${n}` === last && d.lines > 1) n = (n + 1) % d.lines;
  return { name: d.name, colour: d.colour, key: `${base}.${n}`, opens: d.opens };
}
