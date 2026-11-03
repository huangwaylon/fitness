// What stands where on the 3D island (docs/design.md "World: in 3D"): every model instance from world.ts's own layout
// and the day's (its scenery swaps, the fixed decor's pieces, a hybrid flower), the same coordinates and sizes as the
// 2D island, pure. The models are NH's (assets.json: an art key → its model; its winter look in winter). A tree's or a
// bush's scale is its drawn height on the 2D island over its render's height in model units (island/models.json
// `mu`), so the 3D island matches the 2D one (and the DOM's tap areas over it); NH's furniture is at its own scale
// (DECOR_U). What has no model yet is a stand-in: a card of today's art (Island3D). Yaw: none (NH's island pieces
// face the camera), a little for a tree drawn flipped.
import ISLAND_MODELS from '../island/models.json' with { type: 'json' };
import {
  BRIDGE, CAMPSITE, DECOR_SLOTS, FLOWERS, GOAL_TREES, HEDGE_XS, HEDGE_Z, POND, SCENERY, TREE_H, type Scenery
} from '../island/world.ts';
import type { Piece } from '../island/fixedDecor.ts';
import { FLOWER_U, TREE_FRUIT, TREE_FRUIT_U, flowerScale, hedgePair, wildFlower } from '../island/scene.ts';
import type { Season } from '#lib/ui-state/theme.svelte.ts';
import type { FlowerId } from '#lib/art.ts';
import { assetFor } from './assets.ts';
import { keyModel, modelBounds } from './models3d.ts';
import { WATER_DROP, baseHeight, groundHeight } from './ground.ts';

/** A model (static/room/world3d/<name>.glb). */
export type ModelName = string;
export interface Inst {
  model: ModelName;
  x: number;
  z: number;
  /** Height above the ground under it (a fruit in the canopy). */
  lift?: number;
  scale: number;
  yaw?: number;
  /** Tipped about its x axis (radians: a leaf lying flat on the water). */
  pitch?: number;
  /** Turned to the camera (a flat flourish). */
  face?: boolean;
  /** A tint for the petals (a flower's colour, on a model without its own colour). */
  tint?: number;
  /** Tappable: what it is (a tree jiggles). */
  tap?: 'tree' | 'rock' | 'tent' | 'thing';
  id: string;
}

/** A thing the 3D island has no model for yet: a card of today's art (cards.ts), its feet at (x, z). */
export interface Standin {
  id: string;
  key: string;
  x: number;
  z: number;
  h: number;
  flip?: boolean;
}

/** What the island has today beyond world.ts's constants. */
export interface Day {
  season: Season;
  foliage: string;
  month: number;
  /** The scenery with the day's swaps (Scenery's own). */
  scenery?: readonly Scenery[];
  /** The fixed decor's pieces (fixedDecor.ts piecesOn). */
  pieces?: readonly Piece[];
  /** Today's hybrid flower (care.ts): its spot shows that flower. */
  hybrid?: { id: string; flower: string } | null;
  /** The goal trees' fruit as models (else the DOM island's own: its stages, its falls, its harvest). */
  fruit?: boolean;
}

const MU = ISLAND_MODELS as unknown as Record<string, { mu: [number, number] }>;
const height = (m: ModelName) => {
  const b = modelBounds(m);
  return b ? b.max[1] - Math.min(0, b.min[1]) : 1;
};
const scaleOf = (key: string | null, model: ModelName, h: number) => h / (key && MU[key] ? MU[key].mu[1] : height(model));

/** The POC's flowers (one grey model a kind, tinted), for a colour NH's files have no model of. */
const COLOUR: Record<string, number> = {
  red: 0xe5463f, pink: 0xf6a0c4, white: 0xffffff, yellow: 0xffd84a, orange: 0xff9d3c, purple: 0x9c6fd9, blue: 0x7393f0, black: 0x4a3446, green: 0xa6d672, gold: 0xf3c24a
};
const FLOWER_MODEL: Record<string, ModelName> = {
  tulips: 'flower-tulip', hyacinths: 'flower-hyacinth', lilies: 'flower-yuri', roses: 'flower-rose', cosmos: 'flower-cosmos',
  mums: 'flower-mum', pansies: 'flower-pansy', windflowers: 'flower-anemone'
};

/** The oak of the season's look (the cherry blossom in its days, the fall foliage in its weeks). */
const oakKey = (season: Season, foliage: string): string =>
  season === 'spring' && foliage === 'blossom' ? 'trees/oak-spring' : season === 'autumn' && foliage === 'fall' ? 'trees/oak-fall' : 'trees/oak-summer';

export function layout(season: Season, foliage: string, month: number): Inst[] {
  return island({ season, foliage, month }).insts;
}

/** The whole island: its models, and its stand-ins (a card each) for what has none yet. */
export function island(day: Day): { insts: Inst[]; standins: Standin[] } {
  const { season, foliage, month } = day;
  const winter = season === 'winter';
  const out: Inst[] = [], standins: Standin[] = [];
  /** A thing of the 2D island's height `h` (a tree, a bush: matched to its render), or at NH's furniture scale. */
  const put = (id: string, key: string, x: number, z: number, h: number, o: { fit?: boolean; flip?: boolean; tap?: Inst['tap']; yaw?: number } = {}) => {
    const a = keyModel(key, winter);
    if (!a) return void standins.push({ id, key, x, z, h, flip: o.flip });
    const scale = o.fit ? scaleOf(key, a.m, h) : a.s;
    out.push({ id, model: a.m, x, z, scale, yaw: o.yaw ?? ((a.yaw ?? 0) * Math.PI) / 180, tap: o.tap ?? 'thing' });
  };
  const oak = oakKey(season, foliage);
  const bushKey = (key: string) => (key.startsWith('month-bush') ? `bushes/${hedgePair(month)[key.endsWith('a') ? 0 : 1]}` : key);
  for (const s of day.scenery ?? SCENERY) {
    const yaw = s.flip ? 0.9 : 0;
    if (s.kind === 'oak') put(s.id, oak, s.x, s.z, s.h, { fit: true, yaw, tap: 'tree' });
    else if (s.kind === 'cedar' || s.kind === 'palm' || s.kind === 'bamboo') put(s.id, `trees/${s.kind}`, s.x, s.z, s.h, { fit: true, yaw, tap: 'tree' });
    else if (s.kind === 'bush') put(s.id, bushKey(s.key), s.x, s.z, s.h, { fit: true });
    else put(s.id, s.key, s.x, s.z, s.h, { fit: true, flip: s.flip, yaw: s.key === 'deco/log-stool' && s.flip ? 0.7 : undefined });
  }
  // the seasonal hedge along the stream's front bank
  const [a, b] = hedgePair(month);
  HEDGE_XS.forEach((x, i) => put(`hedge-${i}`, `bushes/${i % 2 ? b : a}`, x, HEDGE_Z, 40, { fit: true }));
  // the goal trees and their four fruits in the canopy (🍐 🍑 🍒 🍎 left to right)
  const FRUIT = ['fruit/pear', 'fruit/peach', 'fruit/cherry', 'fruit/apple'];
  for (const who of ['A', 'B'] as const) {
    const [x, z] = GOAL_TREES[who];
    put(`goal-${who}`, oak, x, z, TREE_H, { fit: true, tap: 'tree' });
    if (day.fruit !== false) TREE_FRUIT.forEach(([dx, up], k) => {
      const m = assetFor(FRUIT[k])?.m;
      if (m) out.push({ id: `fruit-${who}-${k}`, model: m, x: x + dx * 1.1, z: z - 48, lift: up - TREE_FRUIT_U * 0.4, scale: TREE_FRUIT_U / height(m) });
    });
  }
  // the fixed decor: the day's pieces in their spots (NH's outdoor furniture at one scale), else world.ts's own
  const pieces = day.pieces ?? DECOR_SLOTS.filter((d) => d.key).map((d) => ({ id: d.id, key: d.key!, x: d.x, z: d.z, h: 30 }));
  for (const p of pieces) put(`fx-${p.id}`, p.key, p.x, p.z, p.h);
  // (the rock, the tape deck: the DOM island's nodes, drawn through their m3 keys: Care, TapeDeck)
  // the stone bridge (NH's 3-tile stone bridge, 1.18u a model unit), turned to span the stream along z
  out.push({ id: 'bridge', model: assetFor('bridges/stone-deck', winter)?.m ?? 'bridge-stone', x: BRIDGE.x, z: (BRIDGE.z0 + BRIDGE.z1) / 2, scale: 1.18, yaw: Math.PI / 2 });
  // the campsite's tent: its door on the door line
  const tent = assetFor(CAMPSITE.key, winter)?.m ?? 'tent', ts = scaleOf(CAMPSITE.key, 'tent', CAMPSITE.h);
  out.push({ id: 'tent', model: tent, x: CAMPSITE.x, z: CAMPSITE.z - 10 * ts, scale: ts, tap: 'tent' });
  // the pond's lily pads and the pink flower on the biggest (WorldWater's), on the water
  const surface = baseHeight(POND.x, POND.z) - WATER_DROP + 0.25;
  for (const [i, [sx, sy, r]] of [[18, 5, 6], [-14, 11, 4.4], [-22, -6, 3.6]].entries()) {
    const x = POND.x + sx, z = POND.z - sy;
    out.push({ id: `lily-${i}`, model: keyModel('fx/lily-pad')?.m ?? 'proc/lily-pad', x, z, lift: surface - groundHeight(x, z), scale: r / 0.97, yaw: i * 2.1 });
  }
  {
    const x = POND.x + 19.5, z = POND.z - 3;
    out.push({ id: 'lily-flower', model: 'proc/lily-flower', x, z, lift: surface - groundHeight(x, z), scale: 1.7 });
  }
  // the wild flowers, the season's kinds (each colour NH's own model; a hybrid in its spot today)
  for (const f of FLOWERS) {
    const id = (day.hybrid?.id === f.id ? day.hybrid.flower : wildFlower(f, season)) as FlowerId;
    const [colour, kind] = [id.slice(0, id.indexOf('-')), id.slice(id.indexOf('-') + 1)];
    const own = assetFor(`flowers/${id}`)?.m;
    const m = own ?? FLOWER_MODEL[kind] ?? 'flower-cosmos';
    const yaw = ((f.x * 7 + f.z * 13) % 6) * 0.5;
    out.push({ id: f.id, model: m, x: f.x, z: f.z, scale: (FLOWER_U * 0.8 * flowerScale(id)) / height(m), yaw, tint: own ? undefined : (COLOUR[colour] ?? 0xffffff), tap: 'thing' });
  }
  return { insts: out, standins };
}
