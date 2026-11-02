// Every model the 3D island can load (static/room/world3d/<name>.glb): NH's converted art (assets.json) and the POC's
// own (models.json: the tinted flowers), with their bounds (model units), triangles and content hash (the `?v=`).
import W3D from './models.json' with { type: 'json' };
import { ASSET_MODELS, type AssetModel } from './assets.ts';

export const MODELS: Record<string, AssetModel> = { ...(W3D.models as Record<string, AssetModel>), ...ASSET_MODELS };

/** A model's bounds, or null when there's no such model. */
export const modelBounds = (name: string): AssetModel | null => MODELS[name] ?? null;
