// Every model the 3D island can load (static/room/world3d/<name>.glb): NH's converted art (assets.json) and the POC's
// own (models.json: the tinted flowers), with their bounds (model units), triangles and content hash (the `?v=`).
import W3D from './models.json' with { type: 'json' };
import { ASSET_MODELS, assetFor, type AssetKey, type AssetModel } from './assets.ts';
import { PROC, PROC_BOUNDS } from './proc3d.ts';

export const MODELS: Record<string, AssetModel> = { ...(W3D.models as Record<string, AssetModel>), ...ASSET_MODELS, ...PROC_BOUNDS };

/** An art key's model: NH's (assets.json, its winter look in winter) or the island's own (proc3d.ts), or null. */
export const keyModel = (key: string, winter = false): AssetKey | null => assetFor(key, winter) ?? PROC[key] ?? null;

/** A model's bounds, or null when there's no such model. */
export const modelBounds = (name: string): AssetModel | null => MODELS[name] ?? null;
