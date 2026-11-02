// What stands on the 3D island, from the layout (docs/island-layout.md "API for the 3D scene"): placeObjects(layout,
// day) gives the engine's instance list (layout3d.ts's Inst, ids = the layout's object ids) and the stand-ins (a card
// each) for what has no model yet. The same models, sizes and looks as layout3d.ts's world.ts island (the day's
// season, its hedge pair, the fixed decor's seasonal pieces, the scenery's swaps), at the layout's spots, turned by
// their facing. A default object keeps today's size (world.ts's height for its id) wherever it is moved.
import ISLAND_MODELS from '../island/models.json' with { type: 'json' };
import W3D from './models.json' with { type: 'json' };
import { CAMPSITE, DECOR_U, SCENERY, TREE_H } from '../island/world.ts';
import { FLOWER_U, TREE_FRUIT, TREE_FRUIT_U, flowerScale, hedgePair, wildFlower } from '../island/scene.ts';
import type { Piece } from '../island/fixedDecor.ts';
import type { Inst, ModelName, Standin } from './layout3d.ts';
import type { Season } from '#lib/ui-state/theme.svelte.ts';
import { kindDef } from '#lib/layout/catalog.ts';
import { doorOf, facingVec, footOf, objMid, type Layout, type Obj } from '#lib/layout/model.ts';
import { WHO_OF_HOME, homePorch, type HomeStyle } from '#lib/layout/homes.ts';

export interface Day {
  season: Season;
  foliage: string;
  month: number;
  /** The scenery's seasonal looks today (fixedDecor.ts swapsOn): an id → its look. */
  swaps?: Readonly<Record<string, { key: string; h: number }>>;
  /** The fixed decor's pieces today (fixedDecor.ts piecesOn: by their spot's id); none given: each spot's own look,
   *  and the seasonal spots empty. */
  pieces?: readonly Piece[];
  /** The goal trees' fruit as models (else the island's own). */
  fruit?: boolean;
}

const MU = ISLAND_MODELS as unknown as Record<string, { mu: [number, number] }>;
const MODELS = W3D.models as Record<string, { min: number[]; max: number[] }>;
const has = (m: string): m is ModelName => m in MODELS;
const bounds = (m: ModelName) => MODELS[m].max[1] - Math.min(0, MODELS[m].min[1]);
const scaleOf = (key: string | null, model: ModelName, h: number) => h / (key && MU[key] ? MU[key].mu[1] : bounds(model));
const COLOUR: Record<string, number> = {
  red: 0xe5463f, pink: 0xf6a0c4, white: 0xffffff, yellow: 0xffd84a, orange: 0xff9d3c, purple: 0x9c6fd9, blue: 0x7393f0, black: 0x4a3446, green: 0xa6d672, gold: 0xf3c24a
};
const FLOWER_MODEL: Record<string, ModelName> = {
  tulips: 'flower-tulip', hyacinths: 'flower-hyacinth', lilies: 'flower-yuri', roses: 'flower-rose', cosmos: 'flower-cosmos',
  mums: 'flower-mum', pansies: 'flower-pansy', windflowers: 'flower-anemone'
};
function bushModel(id: string): ModelName {
  if (id === 'white-plumeria') return 'bush-white-azalea';
  if (id === 'pink-plumeria') return 'bush-pink-azalea';
  const m = `bush-${id}`;
  if (has(m)) return m;
  if (/azalea/.test(id)) return /white/.test(id) ? 'bush-white-azalea' : 'bush-pink-azalea';
  if (/hibiscus/.test(id)) return 'bush-red-hibiscus';
  if (/tea-olive/.test(id)) return 'bush-orange-tea-olive';
  return 'bush-holly';
}
const oakOf = (season: Season, foliage: string): ModelName =>
  season === 'spring' && foliage === 'blossom' ? 'oak-spring' : season === 'autumn' && foliage === 'fall' ? 'oak-fall' : 'oak-summer';
/** A furniture kind's model (its name, else its art key's). */
const PROP: Record<string, ModelName> = {
  'deco/streetlamp': 'streetlamp', 'deco/garden-lantern': 'garden-lantern', 'deco/garden-lantern-white': 'garden-lantern-white',
  'deco/campfire': 'campfire', 'deco/log-stool': 'log-stool', 'deco/campsite-sign': 'campsite-sign', 'deco/flat-rock': 'flat-rock',
  'deco/garden-rock': 'garden-rock', 'deco/park-bench': 'park-bench', 'deco/log-bench': 'log-bench', 'deco/rod-stand': 'rod-stand',
  'deco/hammock': 'hammock', 'deco/firewood': 'firewood', 'deco/pullup': 'pullup', 'deco/pump': 'pump', 'deco/shishiodoshi': 'shishiodoshi'
};
/** world.ts's height for a default piece of scenery (its size wherever it goes). */
const SCENERY_H: Record<string, number> = Object.fromEntries(SCENERY.map((s) => [s.id, s.h]));
const SEASONAL = new Set(['beach-chair', 'sandcastle', 'snowboy']);
/** The fixed decor's kinds (world.ts DECOR_SLOTS): NH's furniture scale, as the decorations'. */
const SLOT_KINDS = new Set(['park-bench', 'log-bench', 'hammock', 'rod-stand', 'pump', 'shishiodoshi', 'pullup', 'firewood', ...SEASONAL]);

/** A turning kind's yaw (f 0 faces the camera; a quarter turn each), a look-only facing's (odd: a little turned). */
const yawOf = (o: Obj): number => (kindDef(o.k)?.turns ? (o.f * Math.PI) / 2 : o.f % 2 ? 0.9 : 0);

/** The whole island: its models, and its stand-ins for what has none yet. */
export function placeObjects(layout: Layout, day: Day): { insts: Inst[]; standins: Standin[] } {
  const { season, foliage, month } = day;
  const oak = oakOf(season, foliage);
  const [hedgeA, hedgeB] = hedgePair(month);
  const pieces = day.pieces ? new Map(day.pieces.map((p) => [p.id, p])) : null;
  const out: Inst[] = [], standins: Standin[] = [];
  const FRUIT: ModelName[] = ['fruit-pear', 'fruit-peach', 'fruit-cherry', 'fruit-apple'];
  for (const o of layout.objects.values()) {
    const [x, z] = objMid(layout, o);
    const def = kindDef(o.k);
    if (!def) continue;
    const yaw = yawOf(o);
    const h = SCENERY_H[o.id] ?? def.h;
    const thing = (model: ModelName, scale: number, extra: Partial<Inst> = {}) => out.push({ id: o.id, model, x, z, scale, yaw, tap: 'thing', ...extra });
    // a look of the day in its place: a model, else a card
    const swap = day.swaps?.[o.id];
    if (swap) {
      const m = PROP[swap.key];
      if (m) thing(m, scaleOf(swap.key, m, swap.h));
      else standins.push({ id: o.id, key: swap.key, x, z, h: swap.h, flip: o.f % 2 === 1 });
      continue;
    }
    switch (o.k) {
      case 'oak':
        thing(oak, scaleOf(`trees/${oak}`, oak, h), { tap: 'tree' });
        break;
      case 'cedar': case 'palm': case 'bamboo':
        thing(o.k, scaleOf(`trees/${o.k}`, o.k, h), { tap: 'tree' });
        break;
      case 'goal-tree': {
        const who = o.s === 'b' ? 'B' : 'A';
        thing(oak, scaleOf(`trees/${oak}`, oak, TREE_H), { tap: 'tree' });
        if (day.fruit !== false)
          TREE_FRUIT.forEach(([dx, up], k) => {
            const m = FRUIT[k];
            out.push({ id: `fruit-${who}-${k}`, model: m, x: x + dx * 1.1, z: z - 48, lift: up - TREE_FRUIT_U * 0.4, scale: TREE_FRUIT_U / bounds(m) });
          });
        break;
      }
      case 'bush': case 'hedge': {
        const s = o.s ?? 'holly';
        const id = s === 'month-a' ? hedgeA : s === 'month-b' ? hedgeB : s;
        const m = bushModel(id);
        thing(m, scaleOf(`bushes/${id}`, m, o.k === 'hedge' ? 40 : h), { yaw: 0 });
        break;
      }
      case 'flower': {
        const clump = Number(o.s?.slice(1)) || 0;
        const fid = wildFlower({ clump }, season);
        const [colour, kind] = [fid.slice(0, fid.indexOf('-')), fid.slice(fid.indexOf('-') + 1)];
        const m = FLOWER_MODEL[kind] ?? 'flower-cosmos';
        thing(m, (FLOWER_U * 0.8 * flowerScale(fid)) / bounds(m), { yaw: ((Math.round(x) * 7 + Math.round(z) * 13) % 6) * 0.5, tint: COLOUR[colour] ?? 0xffffff });
        break;
      }
      case 'rock':
        thing('rock', 26 / bounds('rock'), { tap: 'rock' });
        break;
      case 'tape-deck':
        thing('tape-deck', DECOR_U);
        break;
      case 'garden-lantern': {
        const key = o.s === 'white' ? 'deco/garden-lantern-white' : 'deco/garden-lantern', m = PROP[key];
        thing(m, scaleOf(key, m, h));
        break;
      }
      case 'bridge': {
        // NH's stone bridge (its deck along the model's x), long enough to span the footprint's water
        const span = Math.max(...footOf(layout, o)), along = MODELS['bridge-stone'].max[0] - MODELS['bridge-stone'].min[0];
        out.push({ id: o.id, model: 'bridge-stone', x, z, scale: (span * 30 * 0.72) / along, yaw: o.f % 2 ? 0 : Math.PI / 2 });
        break;
      }
      case 'home': {
        const style = layout.homes[o.id === 'home-B' ? 'B' : o.id === 'home-G' ? 'G' : 'A'];
        if (style.m !== 'campsite') break; // NH's tents and houses: world3d/home.ts
        const scale = scaleOf(CAMPSITE.key, 'tent', CAMPSITE.h);
        const door = doorOf(layout, o).at;
        out.push({ id: o.id, model: 'tent', x: door[0], z: door[1] - 10 * scale, scale, yaw: (o.f * Math.PI) / 2, tap: 'tent' });
        break;
      }
      case 'stairs': case 'spot':
        break; // the stairs are the ground's (terrain.ts); a spot is never drawn
      default: {
        // the fixed decor's spots: the day's piece there (a seasonal spot empty out of its season), else its own look
        const piece = pieces?.get(o.id);
        if (pieces && SEASONAL.has(o.k) && !piece) break;
        if (!pieces && SEASONAL.has(o.k)) break;
        const key = piece?.key ?? `deco/${o.k}`;
        // its art key's model, else a model of the kind's own name (a new piece's: models.json), else a card
        const m = PROP[key] ?? (!piece && has(o.k) ? o.k : undefined);
        // the fixed decor's pieces at NH's furniture scale; the scenery's props at their drawn height
        if (m) thing(m, piece || (SLOT_KINDS.has(o.k) && SCENERY_H[o.id] === undefined) ? DECOR_U : scaleOf(key, m, h));
        else standins.push({ id: o.id, key, x, z, h: piece?.h ?? h, flip: o.f % 2 === 1 });
      }
    }
  }
  return { insts: out, standins };
}

/** Where each home built from NH's parts stands (world3d/home.ts buildHome draws it): its model's origin (its front
 *  wall's middle: the footprint's front edge, the porch in front of the wall inside it) and its turn. The campsite's
 *  tent is placeObjects' (a model of the island's own). */
export function homePlaces(layout: Layout): { id: string; style: HomeStyle; x: number; z: number; yaw: number }[] {
  const out: { id: string; style: HomeStyle; x: number; z: number; yaw: number }[] = [];
  for (const id of ['home-A', 'home-B', 'home-G'] as const) {
    const o = layout.objects.get(id);
    if (!o) continue;
    const style = layout.homes[WHO_OF_HOME[id]];
    if (style.m === 'campsite') continue;
    const [mx, mz] = objMid(layout, o), [fx, fz] = facingVec(o.f);
    const [w, d] = footOf(layout, o);
    const half = (o.f % 2 ? w : d) * 15;
    const back = half - homePorch(style);
    out.push({ id, style, x: mx + fx * back, z: mz + fz * back, yaw: (o.f * Math.PI) / 2 });
  }
  return out;
}
