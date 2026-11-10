// What a 3D scene of the layout builds and stands on the ground beside placeObjects' instances (docs/island-layout.md
// "How the 3D island reads it"): the homes of NH's parts (home.ts), the bridges and stairs (structure.ts) and the ponds
// put down (pond.ts: their water, bed and stones). The 3D island (Island3D: engine.ts placeGroup) and the editor's 3D
// preview (editor/Preview3D.svelte: its own small scene) both keep theirs with createBuilt, so the two can't drift: a
// group per id (`home:<id>`, `structure:<id>`, `pond:<id>`), built again only when its place (or the ground under it)
// changes, the old one drawn till the new one's in.
import type { Group, Object3D } from 'three';
import type { Layout } from '#lib/layout/model.ts';
import type { Who } from '#lib/layout/homes.ts';
import { pondPlaces } from '#lib/layout/ponds.ts';
import { homePlaces } from './objects.ts';
import { buildHome, releaseHome } from './home.ts';
import { buildStructure, structurePlaces } from './structure.ts';
import { buildPond } from './pond.ts';

/** Where a built group stands: its origin on the layout (world u), its turn (three's yaw) and its feet's height (none:
 *  the ground's there). */
export interface BuiltAt {
  x: number;
  z: number;
  yaw: number;
  y?: number;
}
interface Want {
  key: string;
  make: () => Promise<Object3D | null>;
  at: BuiltAt;
  home: boolean;
}

/** The groups a layout has built, by id, each with its place's signature (a change rebuilds it). */
export function builtWants(lay: Layout, heightOf: (x: number, z: number) => number, roomOf?: (who: Who) => number): Map<string, Want> {
  const want = new Map<string, Want>();
  for (const p of homePlaces(lay, roomOf))
    want.set(`home:${p.id}`, { key: JSON.stringify(p), make: () => buildHome(p.style), at: { x: p.x, z: p.z, yaw: p.yaw }, home: true });
  for (const p of structurePlaces(lay)) {
    // its origin on the lower ground: the lower of its two ends' (a bridge's banks, the stairs' foot)
    const dx = (Math.cos(p.yaw) * p.length) / 2, dz = (Math.sin(p.yaw) * p.length) / 2;
    const y = Math.min(heightOf(p.x - dx, p.z - dz), heightOf(p.x + dx, p.z + dz));
    want.set(`structure:${p.id}`, { key: JSON.stringify(p) + y.toFixed(1), make: () => buildStructure(p), at: { x: p.x, z: p.z, yaw: p.yaw, y }, home: false });
  }
  // the ponds put down (pond.ts: their water, bed and stones), on the grass
  for (const p of pondPlaces(lay)) {
    const y = heightOf(p.x, p.z);
    want.set(`pond:${p.id}`, { key: JSON.stringify(p) + y.toFixed(1), make: async () => buildPond(p), at: { x: p.x, z: p.z, yaw: p.yaw, y }, home: false });
  }
  return want;
}

/** The layout object a built group's id is of (`home:home-B` → `home-B`). */
export const builtObject = (id: string): string => id.slice(id.indexOf(':') + 1);

export interface Built {
  /** The layout's groups: the gone ones taken away, the new and changed ones built (and placed once in); `roomOf` each
   *  home's room's size (its outside follows it: homes.ts exteriorOf). */
  sync(lay: Layout, heightOf: (x: number, z: number) => number, roomOf?: (who: Who) => number): void;
  /** Each group in now, by id (a home's `home:` prefixed). */
  each(fn: (id: string, g: Object3D) => void): void;
  /** Nothing built from now on, and the homes' parts let go of (the scene is going). */
  stop(): void;
}

/** `place(id, g, at)` stands a group in the scene (null: takes the id's away; a new one replaces the old); `onIn` sees
 *  each as it comes in, before it's placed (a home's lamps for the time of day). */
export function createBuilt(place: (id: string, g: Object3D | null, at?: BuiltAt) => void, onIn?: (id: string, g: Group) => void): Built {
  const built = new Map<string, { key: string; g: Object3D | null }>();
  /** The group placed for each id (a newer one may be on its way): a home's parts let go of as it goes (home.ts). */
  const placed = new Map<string, Object3D>();
  let stopped = false;
  const unplace = (id: string) => (releaseHome(placed.get(id)), placed.delete(id));
  return {
    sync(lay, heightOf, roomOf) {
      const want = builtWants(lay, heightOf, roomOf);
      for (const id of built.keys()) if (!want.has(id)) {
        place(id, null);
        unplace(id);
        built.delete(id);
      }
      for (const [id, w] of want) {
        if (built.get(id)?.key === w.key) continue;
        const entry = { key: w.key, g: null as Object3D | null };
        built.set(id, entry);
        void w.make().then((g) => {
          if (stopped || built.get(id) !== entry) return releaseHome(g);
          entry.g = g;
          if (g) onIn?.(id, g as Group);
          place(id, g, w.at);
          unplace(id);
          if (g) placed.set(id, g);
        });
      }
    },
    each(fn) {
      for (const [id, b] of built) if (b.g) fn(id, b.g);
    },
    stop() {
      stopped = true;
      for (const id of [...placed.keys()]) unplace(id);
    }
  };
}
