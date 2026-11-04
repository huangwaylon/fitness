// world.ts's island from the layout (docs/island-layout.md "What the 3D integration must change" 7), pure: every
// position, spot, seat, water and box the island's gameplay reads (the walk's names, the critters' waters, the
// fishing, the finds, the visitors, the doors, the decor's spots, the scenery's tap areas), derived from a Layout so a
// moved pond or tent carries everything with it. world.ts setWorld(worldOf(layout)) swaps them in.
//   Shapes kept as world.ts has them (an oval pond, a centreline river, a cliff line), so their readers stay as they
//   are: the river's centreline runs through its tiles from the spring to the sea (breadth-first from the mouth, each
//   step's tiles' middle), the pond and the spring are their tiles' ovals, the cliff the first upper tier's row. The
//   tests (on land, the water, the ground underfoot, a cast's water) read the tiles themselves.
import { GRID, TILE, idx, kindOf, onGrid, tierOf, tileAt, tileMid, tileX, tileZ, type Kind } from '#lib/layout/grid.ts';
import { doorOf, extentOf, footOf, objMid, originOf, type Layout, type Obj } from '#lib/layout/model.ts';
import { kindDef, footprintOf } from '#lib/layout/catalog.ts';
import { navOf, seatsOf, type LayoutNav } from '#lib/layout/nav.ts';
import { daySpots, openGrass } from '#lib/layout/spots.ts';
import { pondOval, pondPlaces } from '#lib/layout/ponds.ts';
import { WORLD_2D, FALLS_POOL, inOval, type Building, type BuildingId, type DecorSlot, type Flower, type FreshWhere, type Pt, type Scenery, type Surface, type WorldGeo } from './world.ts';

type R3 = readonly [number, number, number];

/** world.ts's own scenery and decor by id (a default piece keeps its look and size wherever it goes). */
const OLD_SCENERY = new Map(WORLD_2D.SCENERY.map((s) => [s.id, s]));
const OLD_SLOTS = new Map(WORLD_2D.DECOR_SLOTS.map((d) => [d.id, d]));

/** The scenery's kinds of the layout's (and their art when a piece is new). */
const SCENERY_OF: Record<string, (o: Obj) => { kind: Scenery['kind']; key: string }> = {
  oak: () => ({ kind: 'oak', key: 'oak' }),
  cedar: () => ({ kind: 'cedar', key: 'trees/cedar' }),
  palm: () => ({ kind: 'palm', key: 'trees/palm' }),
  bamboo: () => ({ kind: 'bamboo', key: 'trees/bamboo' }),
  bush: (o) => ({ kind: 'bush', key: o.s === 'month-a' || o.s === 'month-b' ? `month-bush-${o.s.slice(-1)}` : `bushes/${o.s ?? 'holly'}` }),
  hedge: (o) => ({ kind: 'bush', key: o.s === 'month-b' ? 'month-bush-b' : 'month-bush-a' }),
  'flat-rock': () => ({ kind: 'rock', key: 'deco/flat-rock' }),
  'garden-rock': () => ({ kind: 'rock', key: 'deco/garden-rock' }),
  streetlamp: () => ({ kind: 'prop', key: 'deco/streetlamp' }),
  'garden-lantern': (o) => ({ kind: 'prop', key: o.s === 'white' ? 'deco/garden-lantern-white' : 'deco/garden-lantern' }),
  'campsite-sign': () => ({ kind: 'prop', key: 'deco/campsite-sign' }),
  campfire: () => ({ kind: 'prop', key: 'deco/campfire' }),
  'log-stool': () => ({ kind: 'prop', key: 'deco/log-stool' })
};
/** The fixed decor's kinds (world.ts DECOR_SLOTS: NH's furniture standing for good, and the seasonal spots). */
const SLOT_KINDS: ReadonlySet<string> = new Set(['park-bench', 'log-bench', 'hammock', 'rod-stand', 'pump', 'shishiodoshi', 'pullup', 'firewood', 'beach-chair', 'sandcastle', 'snowboy']);
const SEASONAL = new Set(['beach-chair', 'sandcastle', 'snowboy']);
/** How far in front of ウェイ's door the 3D camera's far end stands (u: the engine's, limits().max 1264 at the door's
 *  1410). */
const OKU_BACK = 146;
/** A hedge's height (world.ts's hedge: Scenery.svelte's BUSH_H). */
const HEDGE_H = 40;

/** The building ids of the homes (ウェイ's is the campsite, whatever its look). */
export const BUILDING_OF: Record<string, BuildingId> = { 'home-A': 'campsite', 'home-B': 'home-B', 'home-G': 'home-G', museum: 'museum', shop: 'shop' };
export const HOME_OF: Record<BuildingId, string> = { campsite: 'home-A', 'home-B': 'home-B', 'home-G': 'home-G', museum: 'museum', shop: 'shop' };

const kindAt = (l: Layout, x: number, z: number): Kind => {
  const [c, r] = tileAt(x, z);
  return l.kind(c, r);
};

/** The tiles of one kind in 4-connected pieces, largest first. */
function pieces(l: Layout, want: (k: Kind, tier: number) => boolean): [number, number][][] {
  const seen = new Uint8Array(GRID.cols * GRID.rows), out: [number, number][][] = [];
  for (let r = 0; r < GRID.rows; r++)
    for (let c = 0; c < GRID.cols; c++) {
      const code = l.codes[idx(c, r)];
      if (seen[idx(c, r)] || !want(kindOf(code), tierOf(code))) continue;
      const part: [number, number][] = [], stack: [number, number][] = [[c, r]];
      seen[idx(c, r)] = 1;
      while (stack.length) {
        const [a, b] = stack.pop()!;
        part.push([a, b]);
        for (const [i, j] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]] as const) {
          if (!onGrid(i, j) || seen[idx(i, j)]) continue;
          const q = l.codes[idx(i, j)];
          if (!want(kindOf(q), tierOf(q))) continue;
          seen[idx(i, j)] = 1;
          stack.push([i, j]);
        }
      }
      out.push(part);
    }
  return out.sort((a, b) => b.length - a.length);
}

/** Tiles' oval: their middle and half their extent. */
function ovalOf(tiles: readonly [number, number][]): { x: number; z: number; rx: number; rz: number } {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [c, r] of tiles) {
    x0 = Math.min(x0, tileX(c)); x1 = Math.max(x1, tileX(c + 1));
    z0 = Math.min(z0, tileZ(r)); z1 = Math.max(z1, tileZ(r + 1));
  }
  return { x: (x0 + x1) / 2, z: (z0 + z1) / 2, rx: (x1 - x0) / 2, rz: (z1 - z0) / 2 };
}

/** The river's centreline from its source to the sea ([x, z, width], world.ts RIVER's order), and each river tile's
 *  steps from the sea (the mouth's are 0). */
function riverOf(l: Layout): { line: R3[]; steps: Map<number, number> } {
  const steps = new Map<number, number>();
  const all = pieces(l, (k) => k === 'river');
  const main = all[0] ?? [];
  if (!main.length) return { line: [], steps };
  const inMain = new Set(main.map(([c, r]) => idx(c, r)));
  const isSea = (c: number, r: number) => l.kind(c, r) === 'sea';
  let frontier = main.filter(([c, r]) => isSea(c + 1, r) || isSea(c - 1, r) || isSea(c, r + 1) || isSea(c, r - 1));
  // (no mouth: it runs into a pond, say; from its lowest tile)
  if (!frontier.length) frontier = [main.reduce((a, b) => (b[1] < a[1] ? b : a))];
  for (const [c, r] of frontier) steps.set(idx(c, r), 0);
  const levels: [number, number][][] = [frontier];
  while (levels.at(-1)!.length) {
    const d = levels.length, next: [number, number][] = [];
    for (const [a, b] of levels.at(-1)!)
      for (const [i, j] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]] as const)
        if (onGrid(i, j) && inMain.has(idx(i, j)) && !steps.has(idx(i, j))) {
          steps.set(idx(i, j), d);
          next.push([i, j]);
        }
    levels.push(next);
  }
  levels.pop();
  const line: R3[] = levels.map((lv) => {
    const mids = lv.map(([c, r]) => tileMid(c, r));
    const x = mids.reduce((s, m) => s + m[0], 0) / mids.length, z = mids.reduce((s, m) => s + m[1], 0) / mids.length;
    return [Math.round(x), Math.round(z), TILE] as R3;
  });
  line.reverse();
  // the mouth: out into the sea, widening (world.ts's own does)
  const n = line.length;
  if (n >= 2) {
    const [ax, az] = line[n - 2], [bx, bz] = line[n - 1], L = Math.hypot(bx - ax, bz - az) || 1, ux = (bx - ax) / L, uz = (bz - az) / L;
    line.push([Math.round(bx + ux * 30), Math.round(bz + uz * 30), 50], [Math.round(bx + ux * 70), Math.round(bz + uz * 70), 90]);
  }
  return { line, steps };
}

/** Where the reach from the source turns across the island: the z of the first point whose next step is more across
 *  than along (world.ts RIVER_BEND: riverNS's end). */
function bendOf(line: readonly R3[]): number {
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i], [bx, bz] = line[i + 1];
    if (Math.abs(bx - ax) > Math.abs(bz - az)) return az;
  }
  return line.at(-1)?.[1] ?? 0;
}

/** world.ts's island from a layout. */
export function worldOf(l: Layout, nav: LayoutNav = navOf(l)): WorldGeo {
  const ext = extentOf(l);
  const land = ext.land, shore = ext.shore;
  const objs = [...l.objects.values()];
  const mid = (o: Obj | undefined, or: Pt): Pt => (o ? (objMid(l, o) as Pt) : or);
  const byKind = (k: string) => objs.filter((o) => o.k === k);

  // ---- the water ----
  const { line: RIVER, steps } = riverOf(l);
  const ponds = pieces(l, (k, t) => k === 'pond' && t === 0), springs = pieces(l, (k, t) => k === 'pond' && t > 0);
  const FAR_OVAL = { x: -1e5, z: -1e5, rx: 1, rz: 1 };
  const POND = ponds[0] ? ovalOf(ponds[0]) : FAR_OVAL;
  // the ponds put down: their water ovals (fresh water as the pond's)
  const PONDS = pondPlaces(l).map(pondOval);
  const inPonds = (x: number, z: number) => PONDS.some((o) => inOval(o, x, z));
  // the spring: the upper tier's pond, else the river's source
  const SPRING = springs[0] ? ovalOf(springs[0]) : RIVER[0] ? { x: RIVER[0][0], z: RIVER[0][1], rx: 14, rz: 10 } : FAR_OVAL;
  const bridge = byKind('bridge')[0];
  let BRIDGE = { x: -1e5, z0: -1e5, z1: -1e5, w: 0 };
  if (bridge) {
    const [w, d] = footOf(l, bridge), [x0, z0] = originOf(l, bridge);
    BRIDGE = { x: tileX(x0) + (w * TILE) / 2, z0: tileZ(z0), z1: tileZ(z0 + d), w: w * TILE };
  }
  // the cliff: the first row of an upper tier
  let cliffZ = Infinity;
  for (let r = 0; r < GRID.rows && cliffZ === Infinity; r++) for (let c = 0; c < GRID.cols; c++) if (l.tier(c, r) > 0 && l.kind(c, r) !== 'sea') { cliffZ = tileZ(r); break; }
  const stairs = byKind('stairs')[0];
  const stairX: Pt = stairs ? (() => { const [w] = footOf(l, stairs), [x0] = originOf(l, stairs); return [tileX(x0), tileX(x0 + w)] as Pt; })() : [-1e5, -1e5];
  const fallTiles = [...steps.keys()].map((k) => [k % GRID.cols, Math.floor(k / GRID.cols)]).filter(([c, r]) => l.tier(c, r) > 0 && l.tier(c, r - 1) < l.tier(c, r));
  const fallX: Pt = fallTiles.length ? [Math.min(...fallTiles.map(([c]) => tileX(c))), Math.max(...fallTiles.map(([c]) => tileX(c + 1)))] : [-1e5, -1e5];
  const CLIFF = { z0: cliffZ === Infinity ? 1e5 : cliffZ, z1: cliffZ === Infinity ? 1e5 : cliffZ + 10, x0: land.x0, x1: land.x1, stair: stairX, fall: fallX };

  // ---- the homes and the named spots ----
  const BUILDINGS: Building[] = [];
  for (const id of ['home-A', 'home-B', 'home-G'] as const) {
    const o = l.objects.get(id);
    if (!o) continue;
    const at = doorOf(l, o).at, [w, d] = footOf(l, o);
    BUILDINGS.push({ id: BUILDING_OF[id], key: 'deco/campsite', x: at[0], z: at[1], h: 80, depth: (o.f % 2 ? w : d) * TILE, w: (o.f % 2 ? d : w) * TILE - 8 });
  }
  // the island's buildings (the museum, the shop): its door on the layout, its tap area its footprint up to its model's
  // height (the catalogue's; the 3D model is objects.ts's)
  for (const o of objs) {
    if (o.k !== 'museum' && o.k !== 'shop') continue;
    const at = doorOf(l, o).at, [w, d] = footOf(l, o);
    BUILDINGS.push({ id: o.k, key: 'deco/campsite', x: at[0], z: at[1], h: kindDef(o.k)?.h ?? 110, depth: (o.f % 2 ? w : d) * TILE, w: (o.f % 2 ? d : w) * TILE - 8 });
  }
  const named = nav.named;
  const HOMES = { A: (named.homeA ?? WORLD_2D.HOMES.A) as Pt, B: (named.homeB ?? WORLD_2D.HOMES.B) as Pt };
  const goal = (s: string) => objs.find((o) => o.k === 'goal-tree' && o.s === s);
  const GOAL_TREES = { A: mid(goal('a'), WORLD_2D.GOAL_TREES.A), B: mid(goal('b'), WORLD_2D.GOAL_TREES.B) };
  const CENTRE_STAGE = (named.centreStage ?? WORLD_2D.CENTRE_STAGE) as Pt;
  const ARCH: Pt = [CENTRE_STAGE[0], CENTRE_STAGE[1] + 24], CAKE: Pt = [CENTRE_STAGE[0], CENTRE_STAGE[1] - 46];

  // ---- the scenery, the decor's spots, the seats, the flowers ----
  const SCENERY: Scenery[] = [];
  const DECOR_SLOTS: DecorSlot[] = [];
  const SEATS: Record<string, Pt> = {};
  let PULLUP_AT: Pt = WORLD_2D.PULLUP_AT;
  const FLOWERS: Flower[] = [];
  const HEDGE: Scenery[] = [];
  for (const o of objs) {
    const [x, z] = objMid(l, o);
    const def = kindDef(o.k);
    for (const [name, p] of seatsOf(l, o)) {
      if (o.k === 'pullup') {
        if (name === 'pullup' || PULLUP_AT === WORLD_2D.PULLUP_AT) PULLUP_AT = p;
      } else SEATS[name] = p;
    }
    if (o.k === 'flower') {
      FLOWERS.push({ id: o.id, x: Math.round(x), z: Math.round(z), clump: Number(o.s?.slice(1)) || 0 });
      continue;
    }
    const sc = SCENERY_OF[o.k];
    if (sc) {
      const old = OLD_SCENERY.get(o.id), look = sc(o);
      const s: Scenery = {
        id: o.id, kind: look.kind, key: old?.key ?? look.key, x: Math.round(x), z: Math.round(z), h: o.k === 'hedge' ? HEDGE_H : (old?.h ?? def?.h ?? 40), flip: o.f % 2 === 1 || !!old?.flip,
        ...(old?.foot ? { foot: old.foot } : look.kind === 'rock' && def?.foot ? { foot: def.turns && o.f % 2 ? [def.foot[1], def.foot[0]] as const : def.foot } : {})
      };
      (o.k === 'hedge' ? HEDGE : SCENERY).push(s);
      continue;
    }
    if (SLOT_KINDS.has(o.k) && def) {
      const old = OLD_SLOTS.get(o.id), foot = def.foot ?? ([footprintOf(def, o.f)[0] * TILE, footprintOf(def, o.f)[1] * TILE] as const);
      DECOR_SLOTS.push({ id: o.id, x: Math.round(x), z: Math.round(z), foot: def.turns && o.f % 2 ? [foot[1], foot[0]] : foot, ...(SEASONAL.has(o.k) ? {} : { key: old?.key ?? `deco/${o.k}` }) });
    }
  }
  // the hedges are scenery bushes here (world.ts's own hedge is a row at HEDGE_Z: none on the layout)
  SCENERY.push(...HEDGE);

  // ---- the day's spots, the beach, the sea ----
  const grass = openGrass(l).map(([c, r]) => tileMid(c, r) as Pt);
  const dig = daySpots(l, 'world', 'island').dig;

  const onBridgeAt = (x: number, z: number) => Math.abs(x - BRIDGE.x) <= BRIDGE.w / 2 && z >= BRIDGE.z0 && z <= BRIDGE.z1;
  const onStairs = (x: number, z: number) => {
    if (!stairs) return false;
    const [w, d] = footOf(l, stairs), [x0, z0] = originOf(l, stairs);
    return x >= tileX(x0) && x <= tileX(x0 + w) && z >= tileZ(z0) && z <= tileZ(z0 + d);
  };
  const riverStep = (x: number, z: number): number | null => {
    const [c, r] = tileAt(x, z);
    return onGrid(c, r) ? (steps.get(idx(c, r)) ?? null) : null;
  };
  /** The nearest river tile's steps from the sea within a tile of (x, z) (a cast just off the water). */
  const nearRiverStep = (x: number, z: number): number | null => {
    let best: number | null = null, bd = Infinity;
    for (const [dx, dz] of [[0, 0], [TILE, 0], [-TILE, 0], [0, TILE], [0, -TILE]] as const) {
      const s = riverStep(x + dx, z + dz);
      if (s !== null && Math.abs(dx) + Math.abs(dz) < bd) [best, bd] = [s, Math.abs(dx) + Math.abs(dz)];
    }
    return best;
  };
  const tierAt = (x: number, z: number) => {
    const [c, r] = tileAt(x, z);
    return l.tier(c, r);
  };

  return {
    LAND: { ...land, r: TILE }, SHORE_Z: shore, GRASS: { x0: land.x0 + TILE, x1: land.x1 - TILE, z0: shore + 4 * TILE, z1: land.z1 - TILE, r: TILE },
    // まえ where it was (from the shoreline); おく the 3D camera's far end, the campsite's feet mid-screen (world3d's
    // extentOf ends: ウェイ's door less OKU_BACK)
    CAMS: { mae: WORLD_2D.CAMS.mae + (shore - WORLD_2D.SHORE_Z), oku: Math.round(ext.home[1] - OKU_BACK) },
    RIVER, RIVER_BEND: bendOf(RIVER), BRIDGE, SPRING, POND, CLIFF,
    BUILDINGS, HOMES, GOAL_TREES, TAPE_DECK: mid(byKind('tape-deck')[0], WORLD_2D.TAPE_DECK), ROCK: mid(byKind('rock')[0], WORLD_2D.ROCK),
    DIG_SPOTS: dig, LAWN_SPOTS: grass, HEDGE_Z: -1e5, HEDGE_XS: [],
    BEACH_BOX: { ...WORLD_2D.BEACH_BOX, z0: shore + (WORLD_2D.BEACH_BOX.z0 - WORLD_2D.SHORE_Z), z1: shore + (WORLD_2D.BEACH_BOX.z1 - WORLD_2D.SHORE_Z) },
    SEA_BOX: { ...WORLD_2D.SEA_BOX, z0: shore + (WORLD_2D.SEA_BOX.z0 - WORLD_2D.SHORE_Z), z1: shore + (WORLD_2D.SEA_BOX.z1 - WORLD_2D.SHORE_Z) },
    CENTRE_STAGE, ARCH, CAKE, SCENERY, DECOR_SLOTS, SEATS, PULLUP_AT, FLOWERS, PONDS,
    inRiver: (x, z) => kindAt(l, x, z) === 'river' && !onBridgeAt(x, z),
    onLand: (x, z) => kindAt(l, x, z) !== 'sea',
    onGrass: (x, z) => {
      const k = kindAt(l, x, z);
      return k !== 'sea' && k !== 'sand';
    },
    freshWhere: (x, z): FreshWhere => {
      if ((kindAt(l, x, z) === 'pond' ? tierAt(x, z) === 0 : inOval(POND, x, z, 12)) || PONDS.some((o) => inOval(o, x, z, 12))) return 'pond';
      if (tierAt(x, z) > 0 || z > CLIFF.z0 - FALLS_POOL) return 'clifftop';
      const s = nearRiverStep(x, z);
      return s !== null && s <= 1 ? 'mouth' : 'river';
    },
    nav,
    surfaceAt: (x, z): Surface => {
      if (onBridgeAt(x, z) || onStairs(x, z)) return 'stone';
      if (inPonds(x, z)) return 'water';
      const k = kindAt(l, x, z);
      if (k === 'sea') return 'sea';
      if (k === 'river' || k === 'pond') return 'water';
      if (k === 'sand') return 'sand';
      if (k === 'dirt') return 'dirt';
      if (k === 'stone' || k === 'brick' || k === 'plank') return 'stone';
      return 'grass';
    }
  };
}
