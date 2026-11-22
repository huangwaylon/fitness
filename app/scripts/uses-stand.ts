// The uses stood at (villager3d/poses-stand.ts; world3d/heldProps.ts STAND_PIECES), where each is used: by the rooms'
// item code (`room`) and the island's kind (`island`), spread into scripts/seat-anchors.ts's ROOM_USE and USE. A piece
// stood at is used from in front of it, its feet a step (STEP) out of its footprint facing it (nearer by REACH): the rooms move the spot to
// a side or its back when that's taken (tent/seats.ts, toggles.ts playSpot's tiers); the island's outdoor pieces copy
// this one (scripts/outdoor-catalog.ts).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { UseShape } from '../src/lib/components/villager3d/seats3d.ts';
import { STAND_PIECES } from '../src/lib/components/world3d/heldProps.ts';
import { REACH } from '../src/lib/components/villager3d/poses-stand.ts';

const TENT = join(import.meta.dirname, '..', 'src', 'lib', 'components', 'tent');
const items = (f: string) => JSON.parse(readFileSync(join(TENT, f), 'utf8')).items as Record<string, { d: number }>;
const ITEMS = { ...items('items.json'), ...items('more.json') };
/** A tile (model units), a step out of the footprint (toggles.ts STEP). */
const TILE = 10, STEP = 4;

export const STAND_ROOM: Record<string, UseShape> = Object.fromEntries(
  Object.entries(STAND_PIECES).filter(([c]) => ITEMS[c]).map(([c, { use }]) => {
    const z = (ITEMS[c].d * TILE) / 2 + STEP - (REACH[use] ?? 0);
    return [c, { k: 'u', use, x: 0, y: 0, z, yaw: Math.PI, fx: 0, fz: z }];
  })
);
export const STAND_ISLAND: Record<string, UseShape> = {};
