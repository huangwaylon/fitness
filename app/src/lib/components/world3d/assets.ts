// The island's NH models, typed (assets.json: written by scripts/world3d-models.ts from scripts/world3d-assets.ts;
// docs/world3d-assets.md): an art key → its model and how it stands in the world.
import A from './assets.json' with { type: 'json' };

type AssetCat = 'bug' | 'fish' | 'shadow' | 'sea' | 'find' | 'fruit' | 'flower' | 'bush' | 'tree' | 'deco' | 'decor' | 'event' | 'scenery' | 'fx' | 'tool' | 'accessory';
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
/** A pack's member's key (`decor/<id>-0`: its facing 0's, the island turns it), as scripts/world3d-assets.ts
 *  writeAssets would write it (NH's furniture scale, its footprint and tap radius from its bounds): not in assets.json,
 *  for the first load's bytes. */
function packKey(m: AssetModel, name: string): AssetKey {
  const s = 3, [dx, , dz] = m.max.map((n, i) => n - m.min[i]);
  return { m: name, cat: 'decor', s, anchor: 'feet', foot: [Math.max(1, Math.ceil((dx * s) / 30 - 0.2)), Math.max(1, Math.ceil((dz * s) / 30 - 0.2))], hit: Math.max(12, Math.round((Math.max(dx, dz) * s) / 2)), shadow: true, ...(m.lit ? { lit: m.lit } : {}) };
}
for (const [name, m] of Object.entries(ASSET_MODELS)) if (m.pack) ASSET_KEYS[`decor/${name.slice(name.lastIndexOf('/') + 1)}-0`] ??= packKey(m, name);
/** A model's budget (KB) by kind. */
export const ASSET_BUDGET_KB = A.budgetKb as Record<AssetCat, number>;

/** An art key's model in a season (its winter look in winter), or null when NH has none for it (a billboard stays). */
export function assetFor(key: string, winter = false): AssetKey | null {
  const k = ASSET_KEYS[key];
  if (!k) return null;
  return winter && k.winter ? (ASSET_KEYS[k.winter] ?? k) : k;
}
