// One white pixel, the island's stand-in map (fewer program variants): a Lambert or Basic
// material with no texture of its own takes it as its map (and a Lambert as its emissive map), so it shares its GPU
// program with the textured ones (three keys a program on whether it has a map: with and without were two programs
// each, compiled and linked at the island's start). The same pixels: a colour times white is the colour, and the
// self-light (emissive times white) the same. Not for what reads its map's presence as "loaded" (cards.ts).
import { Color, DataTexture, MeshLambertMaterial, SRGBColorSpace, type MeshBasicMaterial, type MeshStandardMaterial, type Side, type Texture } from 'three';

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

/** NH's soft look on a model's material (the island's, things.ts): Lambert, no metal or specular, its own map, colour,
 *  cut-out and side (`see`: its see-through too). `lift`: lit a little by itself at that strength (by its map, else its
 *  colour where `byColour`); 0 none. `lamp`: a lamp's own emissive map, where it has one, glows instead (its colour, its
 *  strength: 0 till lit). */
export function nhLambert(s: MeshStandardMaterial, o: { lift: number; lamp?: { color: number; at: number }; side?: Side; map?: Texture | null; see?: boolean; byColour?: boolean }): MeshLambertMaterial {
  const map = o.map ?? s.map ?? null, lamp = o.lamp && s.emissiveMap ? o.lamp : null;
  return new MeshLambertMaterial({
    name: s.name, map, color: s.color, alphaTest: s.alphaTest, side: o.side ?? s.side,
    ...(o.see ? { transparent: s.transparent, opacity: s.opacity } : { transparent: false }),
    ...(lamp
      ? { emissive: new Color(lamp.color), emissiveMap: s.emissiveMap, emissiveIntensity: lamp.at }
      : o.lift
        ? { emissive: o.byColour && !map ? s.color.clone() : new Color(0xffffff), emissiveMap: map, emissiveIntensity: o.lift }
        : { emissive: new Color(0x000000), emissiveIntensity: 0 })
  });
}
