// The outdoor catalogue's models on the island (layout/outdoor.ts: the rooms' pieces outdoors): each its room piece's
// own GLB (scripts/room-models.ts: WebP textures, meshopt), a loose file (static/room/models) or cut from its room pack
// (tent/roomPacks.ts, the rooms' own store: a pack the rooms fetched serves the island too), at NH's furniture scale.
// A light's point (things.ts LAMP) is its room emitter (items.json `e`), lit at night as the rooms' lamps are.
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { outdoorByCode, type OutdoorPiece } from '#lib/layout/outdoor.ts';
import { staticUrl } from '#lib/staticUrl.ts';
import { roomPacks } from '../tent/roomPacks.ts';
import { glbLoader } from './gltf.ts';
import type { LampSpot } from './lights.ts';

/** A piece's model (a rejection when it can't be had: offline, or no such piece). */
export async function loadRoomModel(name: string): Promise<GLTF> {
  const code = name.slice(3), p = outdoorByCode(code);
  if (!p) throw new Error(`outdoor: no piece ${code}`);
  if (!p.pk) return glbLoader({ plain: true }).loadAsync(`${staticUrl(`room/models/${code}.glb`)}?v=${p.v ?? ''}`);
  const b = await roomPacks.bytes(p.pk);
  if (!b) throw new Error(`outdoor: no pack for ${code}`);
  return glbLoader({ plain: true }).parseAsync(b, '');
}

/** A fire's (its flame the light): a torch, a campfire, a brazier. */
const FIRE = /fire|torch|flame|brazier|bonfire/i;
/** A piece's light (things.ts LAMP's): its room emitter, its halo and pool by its size; null for none (a light needs
 *  NH’s lighting and an emitter: a glowing piece without, the glowing moss, just glows). */
export function roomLamp(p: OutdoorPiece): { at: number; e: readonly [number, number, number]; kind: LampSpot['kind']; colour: number; glow: number; pool: number; dz?: number } | null {
  if (!p.lt || !p.e) return null;
  const size = Math.max(p.w, p.d), fire = FIRE.test(p.en);
  return { at: 0.5, e: p.e, kind: fire ? 'fire' : 'lamp', colour: fire ? 0xff9a4a : 0xffd38a, glow: 8 + 3 * size, pool: 24 + 10 * size };
}
