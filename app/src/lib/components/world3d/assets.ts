// The island's NH models, typed (assets.json: written by scripts/world3d-models.ts from scripts/world3d-assets.ts;
// docs/world3d-assets.md): an art key → its model and how it stands in the world.
import A from './assets.json' with { type: 'json' };

export type AssetCat = 'bug' | 'fish' | 'shadow' | 'sea' | 'find' | 'fruit' | 'flower' | 'bush' | 'tree' | 'deco' | 'decor' | 'event' | 'scenery' | 'fx' | 'tool' | 'accessory';
/** A model: its bounds (model units), triangles, KB, content hash (the URL's `?v=`), `lit`: an emissive for the night. */
export interface AssetModel {
  min: number[]; max: number[]; tris: number; kb: number; v: string; lit?: number;
  /** A part of its own (its GLB's node `name`: the weight bench's bar), resting at `rest` (model units: its middle),
   *  `len` long along its `axis`. */
  part?: { name: string; rest: number[]; axis: 'x' | 'y' | 'z'; len: number };
  /** In a pack: its file (static/room/world3d/<pack>.glb, `v` the file's hash), the model its node there named its
   *  name's last part (scripts/world3d-assets.ts PACKS: the camp goods, the food). */
  pack?: string;
}
export interface AssetKey {
  /** The model: static/room/world3d/<m>.glb. */
  m: string;
  cat: AssetCat;
  /** World units per model unit. */
  s: number;
  /** feet: its origin on the ground; centre: its bounds' centre at a height (a flying bug, a held fish); joint: its
   *  origin is NH's hand or head joint (a held tool, a hat): put that at the hand or the head. */
  anchor: 'feet' | 'centre' | 'joint';
  /** Its footprint in tiles (30u), unturned: [across, deep]. */
  foot?: [number, number];
  /** Its tap radius (u). */
  hit: number;
  shadow: boolean;
  lit?: number;
  /** Turned about the up axis (degrees: a decoration's facing). */
  yaw?: number;
  /** Its winter look's key. */
  winter?: string;
  /** Loaded with its group, lazily. */
  lazy?: 'bug' | 'fish' | 'sea' | 'event';
  /** No NH model of its own: another stands in. */
  standIn?: number;
}

export const ASSET_MODELS = A.models as Record<string, AssetModel>;
export const ASSET_KEYS = A.keys as unknown as Record<string, AssetKey>;
/** A model's budget (KB) by kind. */
export const ASSET_BUDGET_KB = A.budgetKb as Record<AssetCat, number>;

/** An art key's model in a season (its winter look in winter), or null when NH has none for it (a billboard stays). */
export function assetFor(key: string, winter = false): AssetKey | null {
  const k = ASSET_KEYS[key];
  if (!k) return null;
  return winter && k.winter ? (ASSET_KEYS[k.winter] ?? k) : k;
}
