// One white pixel, the island's stand-in map (fewer program variants): a Lambert or Basic
// material with no texture of its own takes it as its map (and a Lambert as its emissive map), so it shares its GPU
// program with the textured ones (three keys a program on whether it has a map: with and without were two programs
// each, compiled and linked at the island's start). The same pixels: a colour times white is the colour, and the
// self-light (emissive times white) the same. Not for what reads its map's presence as "loaded" (cards.ts).
import { DataTexture, SRGBColorSpace, type MeshBasicMaterial, type MeshLambertMaterial } from 'three';

export const WHITE = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
WHITE.colorSpace = SRGBColorSpace;
WHITE.name = 'white';
WHITE.needsUpdate = true;

/** `m` with WHITE where it has no map (and, a Lambert, no emissive map). */
export function withMaps<M extends MeshLambertMaterial | MeshBasicMaterial>(m: M): M {
  m.map ??= WHITE;
  if ('emissiveMap' in m) m.emissiveMap ??= WHITE;
  return m;
}
