// What stands where on the 3D island (the /world3d POC): every model instance from world.ts's own layout (the same
// coordinates and sizes as today's island), pure. A thing's scale is its drawn height on today's island over its
// render's height in model units (island/models.json `mu`), so the 3D island matches the 2D one; else its model's
// bounds. Yaw: none (NH's island pieces all face the camera), a little for a tree drawn flipped.
import ISLAND_MODELS from '../island/models.json' with { type: 'json' };
import W3D from './models.json' with { type: 'json' };
import {
  BRIDGE, CAMPSITE, DECOR_SLOTS, DECOR_U, FLOWERS, GOAL_TREES, HEDGE_XS, HEDGE_Z, ROCK, SCENERY, TAPE_DECK, TREE_H
} from '../island/world.ts';
import { FLOWER_U, TREE_FRUIT, TREE_FRUIT_U, flowerScale, hedgePair, wildFlower } from '../island/scene.ts';
import type { Season } from '#lib/ui-state/theme.svelte.ts';

export type ModelName = keyof typeof W3D.models;
export interface Inst {
  model: ModelName;
  x: number;
  z: number;
  /** Height above the ground under it (a fruit in the canopy). */
  lift?: number;
  scale: number;
  yaw?: number;
  /** A tint for the petals (a flower's colour). */
  tint?: number;
  /** Tappable: what it is (a tree jiggles). */
  tap?: 'tree' | 'rock' | 'tent' | 'thing';
  id: string;
}

const MU = ISLAND_MODELS as unknown as Record<string, { mu: [number, number] }>;
const bounds = (m: ModelName) => W3D.models[m].max[1] - Math.min(0, W3D.models[m].min[1]);
const scaleOf = (key: string | null, model: ModelName, h: number) => h / (key && MU[key] ? MU[key].mu[1] : bounds(model));

/** NH's flower colours (the petals' tint over their lightest gradient row). */
const COLOUR: Record<string, number> = {
  red: 0xe5463f, pink: 0xf6a0c4, white: 0xffffff, yellow: 0xffd84a, orange: 0xff9d3c, purple: 0x9c6fd9, blue: 0x7393f0, black: 0x4a3446, green: 0xa6d672, gold: 0xf3c24a
};
const FLOWER_MODEL: Record<string, ModelName> = {
  tulips: 'flower-tulip', hyacinths: 'flower-hyacinth', lilies: 'flower-yuri', roses: 'flower-rose', cosmos: 'flower-cosmos',
  mums: 'flower-mum', pansies: 'flower-pansy', windflowers: 'flower-anemone'
};
/** A bush key → its model (the files have no plumeria: NH's azaleas stand in; a month's bush without one here: holly). */
function bushModel(key: string): ModelName {
  const id = key.replace(/^bushes\//, '');
  if (id === 'white-plumeria') return 'bush-white-azalea';
  if (id === 'pink-plumeria') return 'bush-pink-azalea';
  const m = `bush-${id}` as ModelName;
  if (m in W3D.models) return m;
  if (/azalea/.test(id)) return /white/.test(id) ? 'bush-white-azalea' : 'bush-pink-azalea';
  if (/hibiscus/.test(id)) return 'bush-red-hibiscus';
  if (/tea-olive/.test(id)) return 'bush-orange-tea-olive';
  return 'bush-holly';
}
const PROP: Record<string, ModelName> = {
  'deco/streetlamp': 'streetlamp', 'deco/garden-lantern': 'garden-lantern', 'deco/garden-lantern-white': 'garden-lantern-white',
  'deco/campfire': 'campfire', 'deco/log-stool': 'log-stool', 'deco/campsite-sign': 'campsite-sign', 'deco/flat-rock': 'flat-rock',
  'deco/garden-rock': 'garden-rock', 'deco/park-bench': 'park-bench', 'deco/log-bench': 'log-bench', 'deco/rod-stand': 'rod-stand',
  'deco/hammock': 'hammock', 'deco/firewood': 'firewood', 'deco/pullup': 'pullup', 'deco/pump': 'pump', 'deco/shishiodoshi': 'shishiodoshi'
};

/** The oak of the season (the cherry blossom in its days; winter: the summer oak, the POC has no snow). */
const oakOf = (season: Season, foliage: string): ModelName =>
  season === 'spring' && foliage === 'blossom' ? 'oak-spring' : season === 'autumn' && foliage === 'fall' ? 'oak-fall' : 'oak-summer';

export function layout(season: Season, foliage: string, month: number): Inst[] {
  const oak = oakOf(season, foliage);
  const out: Inst[] = [];
  for (const s of SCENERY) {
    const yaw = s.flip ? 0.9 : 0;
    if (s.kind === 'oak') out.push({ id: s.id, model: oak, x: s.x, z: s.z, scale: scaleOf(`trees/${oak}`, oak, s.h), yaw, tap: 'tree' });
    else if (s.kind === 'cedar' || s.kind === 'palm' || s.kind === 'bamboo') {
      const m = s.kind as ModelName;
      out.push({ id: s.id, model: m, x: s.x, z: s.z, scale: scaleOf(s.key, m, s.h), yaw, tap: 'tree' });
    } else if (s.kind === 'bush') {
      const key = s.key.startsWith('month-bush') ? `bushes/${hedgePair(month)[s.key.endsWith('a') ? 0 : 1]}` : s.key;
      const m = bushModel(key);
      out.push({ id: s.id, model: m, x: s.x, z: s.z, scale: scaleOf(key, m, s.h), tap: 'thing' });
    } else {
      const m = PROP[s.key];
      if (m) out.push({ id: s.id, model: m, x: s.x, z: s.z, scale: scaleOf(s.key, m, s.h), yaw: s.key === 'deco/log-stool' && s.flip ? 0.7 : 0, tap: 'thing' });
    }
  }
  // the seasonal hedge along the stream's front bank
  const [a, b] = hedgePair(month);
  HEDGE_XS.forEach((x, i) => {
    const key = `bushes/${i % 2 ? b : a}`, m = bushModel(key);
    out.push({ id: `hedge-${i}`, model: m, x, z: HEDGE_Z, scale: scaleOf(key, m, 40), tap: 'thing' });
  });
  // the goal trees and their four fruits in the canopy (🍐 🍑 🍒 🍎 left to right)
  const FRUIT: ModelName[] = ['fruit-pear', 'fruit-peach', 'fruit-cherry', 'fruit-apple'];
  for (const who of ['A', 'B'] as const) {
    const [x, z] = GOAL_TREES[who];
    out.push({ id: `goal-${who}`, model: oak, x, z, scale: scaleOf(`trees/${oak}`, oak, TREE_H), tap: 'tree' });
    TREE_FRUIT.forEach(([dx, up], k) => {
      const m = FRUIT[k];
      out.push({ id: `fruit-${who}-${k}`, model: m, x: x + dx * 1.1, z: z - 48, lift: up - TREE_FRUIT_U * 0.4, scale: TREE_FRUIT_U / bounds(m) });
    });
  }
  // the fixed decor (NH's outdoor furniture at one scale)
  for (const d of DECOR_SLOTS) {
    const m = d.key ? PROP[d.key] : undefined;
    if (m) out.push({ id: d.id, model: m, x: d.x, z: d.z, scale: DECOR_U, tap: 'thing' });
  }
  out.push({ id: 'tape-deck', model: 'tape-deck', x: TAPE_DECK[0], z: TAPE_DECK[1], scale: DECOR_U, tap: 'thing' });
  out.push({ id: 'rock', model: 'rock', x: ROCK[0], z: ROCK[1], scale: 26 / bounds('rock'), tap: 'rock' });
  // the stone bridge (NH's 3-tile stone bridge, 1.18u a model unit), turned to span the stream along z
  out.push({ id: 'bridge', model: 'bridge-stone', x: BRIDGE.x, z: (BRIDGE.z0 + BRIDGE.z1) / 2, scale: 1.18, yaw: Math.PI / 2 });
  // the campsite's tent: its door on the door line
  out.push({ id: 'tent', model: 'tent', x: CAMPSITE.x, z: CAMPSITE.z - 10 * scaleOf(CAMPSITE.key, 'tent', CAMPSITE.h), scale: scaleOf(CAMPSITE.key, 'tent', CAMPSITE.h), tap: 'tent' });
  // the wild flowers, the season's kinds
  for (const f of FLOWERS) {
    const id = wildFlower(f, season);
    const [colour, kind] = [id.slice(0, id.indexOf('-')), id.slice(id.indexOf('-') + 1)];
    const m = FLOWER_MODEL[kind] ?? 'flower-cosmos';
    out.push({ id: f.id, model: m, x: f.x, z: f.z, scale: (FLOWER_U * 0.8 * flowerScale(id)) / bounds(m), yaw: ((f.x * 7 + f.z * 13) % 6) * 0.5, tint: COLOUR[colour] ?? 0xffffff, tap: 'thing' });
  }
  return out;
}
