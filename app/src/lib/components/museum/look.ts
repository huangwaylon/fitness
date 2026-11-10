// The museum's light (docs/design.md "The museum"), pure: one LOOK per wing, the room one is in the only one drawn, so
// the three lights (a hemisphere, a key, an ambient) are that wing's: its exposure under three's Neutral tone mapping
// (Khronos PBR Neutral: NH's saturated hues kept, where ACES turns yellows and AgX greys them), its sky over a warm
// bounce (walls lit near the floor's level, not half of it), its key from the upper front left, its background (a
// deep tone of the room, never the old near-black void) and the strengths of its baked light (bake.ts), lamps, wash
// cards and tank glow. Night: the lamps take over (NIGHT: the room dimmer, its pools and halos brighter, amber; the
// tanks light the aquarium). Also the materials' tints in place of the old dark ones, the exhibits' self-light, and a
// rough screen-brightness estimate the tests hold the table to (look.test.ts). The engine (engine.ts) applies it.
import { Color, NeutralToneMapping, type ToneMapping } from 'three';
import type { Wing } from './plan.ts';

export interface Look {
  /** renderer.toneMappingExposure (at most 1.15: more washes NH's textures out). */
  exposure: number;
  /** The hemisphere's sky and ground (sRGB hex) and its strength. */
  sky: number;
  ground: number;
  hemi: number;
  /** The ambient's colour and strength. */
  amb: number;
  ambI: number;
  /** The key's colour and strength (its direction KEY, every wing). */
  key: number;
  keyI: number;
  /** scene.background and the walls' outside faces. */
  bg: number;
  /** The baked floors' and walls' lightMapIntensity (bake.ts). */
  lm: number;
  /** NH lamps' emissiveIntensity (nhLambert's lamp). */
  lamp: number;
  /** The wash and halo cards' brightness, a share of theirs (bake.ts CARD). */
  cards: number;
  /** The tanks' glow lips (bake.ts CARD.lip), times the cards'. */
  glow: number;
  /** The floors' and walls' colour over their tints (sRGB hex: white by day, amber at night, so the pools and the
   *  walls' uplight read as lamplight). */
  tint: number;
}

/** The key's position (its target the origin): more frontal than the rooms', so the camera-facing walls and the
 *  exhibits' fronts catch it. */
export const KEY = [-60, 220, 180] as const;
const MAX_EXPOSURE = 1.15;

const base = { lm: 1.6, lamp: 0.6, cards: 1, glow: 1, tint: 0xffffff };
/** Each wing's look by day (the lighting proposal's table). */
export const LOOK: Record<Wing, Look> = {
  hall: { exposure: 1.1, sky: 0xfff4e4, ground: 0xd8c0a0, hemi: 2.2, amb: 0xfff0dc, ambI: 0.55, key: 0xfff2dc, keyI: 0.9, bg: 0xb09474, ...base },
  fossil: { exposure: 1.1, sky: 0xfff0dc, ground: 0xc4a882, hemi: 2.1, amb: 0xfff0dc, ambI: 0.55, key: 0xffe8c8, keyI: 0.85, bg: 0x967a5c, ...base },
  art: { exposure: 1.12, sky: 0xfff6ea, ground: 0xc8b098, hemi: 2.0, amb: 0xfff2e2, ambI: 0.5, key: 0xfff4e6, keyI: 0.8, bg: 0x7c4a3a, ...base },
  fish: { exposure: 1.05, sky: 0xdfeaff, ground: 0x6a86a8, hemi: 1.7, amb: 0xd6e6ff, ambI: 0.45, key: 0xeef4ff, keyI: 0.55, bg: 0x22507a, ...base, lm: 2.4 },
  sea: { exposure: 1.05, sky: 0xd4e4ff, ground: 0x5a7898, hemi: 1.6, amb: 0xd6e6ff, ambI: 0.45, key: 0xeef4ff, keyI: 0.5, bg: 0x0c2034, ...base, lm: 2.4 },
  bug: { exposure: 1.0, sky: 0xfff6e0, ground: 0x7a9a5a, hemi: 2.0, amb: 0xfff0dc, ambI: 0.35, key: 0xfff4dc, keyI: 1.4, bg: 0x41603f, ...base }
};

/** The materials' tints in place of the old dark ones (white: none); a threshold takes its own room's. The new floor
 *  and wall materials skip the ceilings' night multiply (the exposure covers it). */
export const TINT: Record<Wing, { floor: number; wall: number; ceil?: number }> = {
  hall: { floor: 0xffeedc, wall: 0xfff6ea },
  fossil: { floor: 0xfff2e0, wall: 0xffe4c0, ceil: 0xb09a7c },
  art: { floor: 0xf0f0ff, wall: 0xffffff },
  fish: { floor: 0xccdcce, wall: 0x9cc0d4, ceil: 0x3e6a96 },
  sea: { floor: 0xccdcce, wall: 0x9cc0d4, ceil: 0x3e6a96 },
  bug: { floor: 0xffffff, wall: 0xffffff }
};

/** Each wing's floors and walls lifted over their textures' own darkness (a multiply over 1 on the tint, linear: the
 *  aquarium's dark checker, the gallery's walnut, the fossils' stone), so a room reads as lit, not as its texture. */
export const GAIN: Record<Wing, { floor: number; wall: number }> = {
  hall: { floor: 1.3, wall: 1.15 }, fossil: { floor: 2.6, wall: 2.6 }, art: { floor: 4.4, wall: 1.9 },
  fish: { floor: 2.6, wall: 1 }, sea: { floor: 2.6, wall: 1 }, bug: { floor: 1, wall: 1 }
};

/** Each wing's mood (sRGB hex): its doorway's card seen from the next room (only the room one is in is drawn) and the
 *  room-change dip's colour, mixed with its background. */
export const PORTAL: Record<Wing, number> = { hall: 0xf2dcb4, fossil: 0xe2c89c, art: 0xd49478, fish: 0x78c0e0, sea: 0x68acd4, bug: 0xb4d894 };

/** The baked light pools' colour per wing (bake.ts Pool.color; the bug wing has none: it's lit as outdoors). */
export const POOL: Record<Exclude<Wing, 'bug'>, number> = { hall: 0xffe6c0, fossil: 0xffd8a0, art: 0xfff0d8, fish: 0x6fc6e8, sea: 0x6fc6e8 };

/** The exhibits' self-light (nhLambert's `lift`, the museum's only): paintings, statues, fossils; tank creatures as now. */
export const LIFT = { painting: 0.22, statue: 0.2, fossil: 0.25, creature: 0.25 } as const;

const c0 = new Color(), c1 = new Color();
/** `a` toward `b` by t, in linear light (three's Color: its hex sRGB, held linear). */
function mix(a: number, b: number, t: number): number {
  return c0.setHex(a).lerp(c1.setHex(b), t).getHex();
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Two looks blended (the wing-change fade: frames run for it anyway; none at rest). */
export function blendLook(a: Look, b: Look, t: number): Look {
  const out = { ...a };
  for (const k of Object.keys(a) as (keyof Look)[]) {
    out[k] = k === 'sky' || k === 'ground' || k === 'amb' || k === 'key' || k === 'bg' || k === 'tint' ? mix(a[k], b[k], t) : lerp(a[k], b[k], t);
  }
  return out;
}

/** Night's recipe (lookAt): the room's own light (the hemisphere, the ambient, the key) down to `base`, the lamps'
 *  (the baked pools and the walls' uplight, the halo cards) up `pools` and `cards` times, NH's lamps to `lamp`, the
 *  floors and walls tinted `tint` (amber: the lamps ~2700 K), the sky toward lamplight; the aquarium's toward a deep
 *  blue, untinted, its tanks' glow `glow` times. */
export const NIGHT = { base: 0.76, key: 0.5, pools: 2.4, cards: 2, lamp: 1.2, tint: 0xffd4a4, glow: 1.4 } as const;

/** A wing's look at `night` (0 day … 1 night), `over` its day look's tuning (the dev hook's partial): the lamps take
 *  over (NIGHT). The exposure −0.05; the bug wing (lit as outdoors, its glass dusk the engine's) only its key ×0.5. */
export function lookAt(wing: Wing, night: number, over: Partial<Look> = {}): Look {
  const n = Math.max(0, Math.min(1, night)), d: Look = { ...LOOK[wing], ...over };
  const water = wing === 'fish' || wing === 'sea', bug = wing === 'bug', base = lerp(1, bug ? 0.85 : NIGHT.base, n);
  return {
    ...d,
    exposure: Math.min(MAX_EXPOSURE, d.exposure - 0.05 * n),
    sky: mix(d.sky, water ? 0x9fb8ff : 0xffd6a8, 0.5 * n),
    hemi: d.hemi * base,
    ambI: d.ambI * base,
    key: water ? d.key : mix(d.key, 0xffc890, n),
    keyI: d.keyI * lerp(1, NIGHT.key, n),
    lm: d.lm * lerp(1, NIGHT.pools, n),
    lamp: lerp(d.lamp, NIGHT.lamp, n),
    cards: d.cards * lerp(1, NIGHT.cards, n),
    glow: d.glow * lerp(1, water ? NIGHT.glow : 1, n),
    tint: water || bug ? d.tint : mix(d.tint, NIGHT.tint, n)
  };
}

interface Tinted { color: Color; intensity: number }
/** The three lights, the renderer and the scene as a look has them (and the key where KEY puts it). Neutral tone
 *  mapping: set before the first compile (each program takes its define: set later, they'd all compile again). */
export function applyLook(
  l: { hemi: Tinted & { groundColor: Color }; key: Tinted & { position: { set(x: number, y: number, z: number): unknown } }; amb: Tinted },
  renderer: { toneMapping: ToneMapping; toneMappingExposure: number },
  scene: { background: unknown },
  look: Look
): void {
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = Math.min(MAX_EXPOSURE, look.exposure);
  l.hemi.color.setHex(look.sky);
  l.hemi.groundColor.setHex(look.ground);
  l.hemi.intensity = look.hemi;
  l.key.color.setHex(look.key);
  l.key.intensity = look.keyI;
  l.key.position.set(...KEY);
  l.amb.color.setHex(look.amb);
  l.amb.intensity = look.ambI;
  if (scene.background instanceof Color) scene.background.setHex(look.bg);
  else scene.background = new Color(look.bg);
}

/** Khronos PBR Neutral, as three's shader has it (linear in, linear out, the exposure already applied). */
function neutral(rgb: [number, number, number]): [number, number, number] {
  const start = 0.8 - 0.04, desat = 0.15;
  const x = Math.min(...rgb), off = x < 0.08 ? x - 6.25 * x * x : 0.04;
  let c = rgb.map((v) => v - off) as [number, number, number];
  const peak = Math.max(...c);
  if (peak < start) return c;
  const dd = 1 - start, np = 1 - (dd * dd) / (peak + dd - start);
  c = c.map((v) => (v * np) / peak) as [number, number, number];
  const g = 1 - 1 / (desat * (peak - np) + 1);
  return c.map((v) => lerp(v, np, g)) as [number, number, number];
}
const toSrgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055);

/** About how bright a Lambert surface shows under a look (sRGB luma 0…1): its normal (unit), its albedo (linear grey)
 *  and the baked light on it (linear, before the look's lm). three's sums: hemi by the normal's up, the key by its
 *  cosine, the ambient, the light map, all times albedo (times the look's tint)/π; then the exposure and Neutral. For the tests and tuning. */
export function luma(look: Look, normal: readonly [number, number, number], albedo = 0.8, baked: readonly [number, number, number] = [0, 0, 0]): number {
  const kl = Math.hypot(...KEY), dot = Math.max(0, (normal[0] * KEY[0] + normal[1] * KEY[1] + normal[2] * KEY[2]) / kl);
  const sky = new Color(look.sky), ground = new Color(look.ground), key = new Color(look.key), amb = new Color(look.amb), tint = new Color(look.tint);
  const up = 0.5 * normal[1] + 0.5;
  const ch = (k: 'r' | 'g' | 'b', i: number) =>
    (lerp(ground[k], sky[k], up) * look.hemi + key[k] * look.keyI * dot + amb[k] * look.ambI + baked[i] * look.lm) * ((albedo * tint[k]) / Math.PI) * Math.min(MAX_EXPOSURE, look.exposure);
  const [r, g, b] = neutral([ch('r', 0), ch('g', 1), ch('b', 2)]).map((v) => toSrgb(Math.max(0, Math.min(1, v))));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
