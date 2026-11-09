// The 3D island's ground from the layout (docs/island-layout.md "API for the 3D scene"): buildGround(layout) gives the
// land, the cliffs, the waterfalls, the rivers and ponds and the sea as one three.js group, rebuilt a chunk at a time
// when the layout changes (a paint stroke rebuilds one or two), and the height a walker's feet stand at.
//   The geometry is layout/mesh.ts's (NH's quadrant scheme: round corners, vertical walls, falls where water steps down).
//   The ground's look is baked here, on the GPU, once a chunk (and again only when it changes): a shader paints each
//   chunk's texture from the layout's distance fields (layout/fields.ts) and its tiles, NH's way (grass with its
//   flecks, the beach's sand going wet at the sea, the dirt path worn, stone, brick and planks from NH's own textures,
//   the rivers' banks and beds, a shade at a cliff's foot), as the 2D island's bake did at build time.
//   The walls wear NH's cliff strata (static/terrain/nh/, scripts/terrain-textures.ts); the water is live (the shared
//   waterU clock, tint and fog of water.ts: the engine drives them).
// Everything is bent (bend.ts) like the rest of the scene.
import {
  BufferGeometry, ClampToEdgeWrapping, Color, DataTexture, DoubleSide, Float32BufferAttribute, GLSL3, Group, LinearFilter, LinearMipmapLinearFilter, Mesh,
  MeshLambertMaterial, NearestFilter, OrthographicCamera, PlaneGeometry, RawShaderMaterial, RepeatWrapping, RGBAFormat, SRGBColorSpace,
  Scene, ShaderChunk, ShaderMaterial, Texture, TextureLoader, Uint32BufferAttribute, UnsignedByteType, WebGLRenderTarget, type WebGLRenderer
} from 'three';
import { bend, BEND_GLSL, bendU } from './bend.ts';
import { withMaps } from './blank.ts';
import { waterU } from './water.ts';
import { CHUNK, CHUNKS_X, CHUNKS_Z, GRID, TILE, chunkOf, idx, kindOf } from '#lib/layout/grid.ts';
import { chunkMesh, meshKeyOf, stairsMesh, type Part, type WallPart, type WaterPart } from '#lib/layout/mesh.ts';
import { FAR, STEP, fieldsOf } from '#lib/layout/fields.ts';
import { SWASH_GLSL } from '#lib/layout/swash.ts';
import { DEEP_Y, EDGE_FADE, SEA_Y, fieldOf } from '#lib/layout/height.ts';
import { extentOf, type Layout } from '#lib/layout/model.ts';

import type { Look } from './groundLook.ts';

export type { Look };
export interface GroundOptions {
  renderer: WebGLRenderer;
  /** The site's base URL (static files: terrain/nh/*.webp). */
  base?: string;
  look?: Look;
  /** Drawn stone steps for the stairs (false: the scene draws NH's inclines itself, structure.ts). */
  stairs?: boolean;
  /** Bake pixels per world unit (1.6: the whole long island in ~21 MB). */
  px?: number;
}
/** engine.ts's BuiltGround, and the layout's own: a rebuild when it changes, the season's look, its bands. */
export interface Ground {
  /** Add to the scene once. */
  group: Group;
  /** Rebuild after a change: the chunks that changed (layout/diff.ts; the bands either side follow), or all. */
  rebuild(layout: Layout, chunks?: readonly number[]): void;
  /** The ground's height and where feet stand (layout/height.ts). */
  heightAt(x: number, z: number): number;
  feet(x: number, z: number): number;
  /** The land's box (its corners rounded by r): the engine's sea and camera read it. */
  land: { x0: number; x1: number; z0: number; z1: number; r: number };
  /** A frame (engine.ts calls it each one): the water's clock (waterU.uTime: the rivers' flow, the falls' streaks and
   *  foam, the ponds' ripples, the sea's wash) runs on, at the ambient rate. */
  update(t: number): boolean | 'ambient';
  look(l: Look): void;
  /** Each band's meshes (a row of chunks across the island: 4 draws), for the camera's culling (world z extent). */
  chunks(): readonly { z0: number; z1: number; meshes: Mesh[] }[];
  /** A promise for the textures (the first bake waits on them). */
  ready: Promise<void>;
  /** The bands baked again (a lost context back: their render targets come back empty). */
  restore(): void;
  dispose(): void;
}

const PALETTES: Record<'spring' | 'summer' | 'autumn' | 'winter', Record<string, string>> = {
  spring: { GRASS: '#7CC95A', GRASS_HI: '#9BD970', FLECK_HI: '#A8E07A', FLECK_LO: '#5EAE47', GRASS_SHADE: '#3F8F33', SAND_HI: '#FBE6B0', SAND: '#F3D493', SAND_LO: '#EBC983', SAND_WET: '#D9AC66', SPECK: '#E2BE7C' },
  summer: { GRASS: '#5DBE4A', GRASS_HI: '#7CCF5E', FLECK_HI: '#8ED96C', FLECK_LO: '#46A23A', GRASS_SHADE: '#2F7F2A', SAND_HI: '#FBE6B0', SAND: '#F3D493', SAND_LO: '#EBC983', SAND_WET: '#D9AC66', SPECK: '#E2BE7C' },
  autumn: { GRASS: '#A8C457', GRASS_HI: '#C2D46E', FLECK_HI: '#D9C26A', FLECK_LO: '#8AA845', GRASS_SHADE: '#6F8A35', SAND_HI: '#FBE6B0', SAND: '#F3D493', SAND_LO: '#EBC983', SAND_WET: '#D9AC66', SPECK: '#E2BE7C' },
  winter: { GRASS: '#EEF3FC', GRASS_HI: '#FFFFFF', FLECK_HI: '#FFFFFF', FLECK_LO: '#C9D6EC', GRASS_SHADE: '#9FB2D6', SAND_HI: '#F6F0E2', SAND: '#EEE6D4', SAND_LO: '#E4DAC4', SAND_WET: '#CFC3AA', SPECK: '#D6CBB4' }
};
const baseOf = (l: Look) => (l === 'spring-petals' ? 'spring' : l === 'autumn-leaves' ? 'autumn' : l);

// ---- the bake ---------------------------------------------------------------------------------------------------------

const BAKE_VERT = /* glsl */ `
precision highp float;
in vec3 position;
in vec2 uv;
uniform vec4 uBox;
out vec2 vW;
void main() {
  vW = mix(uBox.xy, uBox.zw, uv);
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const BAKE_FRAG = /* glsl */ `
precision highp float;
precision highp int;
in vec2 vW;
out vec4 outColor;
uniform vec4 uGrid;      // x0, z0, width, depth (u)
uniform sampler2D uSdfA; // land, sandy, fresh, path
uniform sampler2D uSdfB; // tier ≥ 1, 2, 3
uniform sampler2D uCodes;
uniform sampler2D uStone, uBrick, uPlank, uGrassMix, uSoilMix, uSand;
uniform float uPx, uFar, uWinter;
uniform vec3 GRASS, GRASS_HI, FLECK_HI, FLECK_LO, GRASS_SHADE, SAND_HI, SAND, SAND_LO, SAND_WET, SPECK;
float AAW;

uvec2 pcg2d(uvec2 v){ v = v*1664525u+1013904223u; v.x += v.y*1664525u; v.y += v.x*1664525u; v ^= v>>16u; v.x += v.y*1664525u; v.y += v.x*1664525u; v ^= v>>16u; return v; }
float h1(ivec2 c, int s){ return float(pcg2d(uvec2(c) ^ uvec2(uint(s)*0x9E3779B9u, uint(s+7)*0x85EBCA6Bu)).x) * (1.0/4294967296.0); }
vec2 h2(ivec2 c, int s){ return vec2(pcg2d(uvec2(c) ^ uvec2(uint(s)*0x9E3779B9u, uint(s+7)*0x85EBCA6Bu))) * (1.0/4294967296.0); }
float gn(vec2 p, int s){
  vec2 i = floor(p), q = p - i; ivec2 c = ivec2(i);
  vec2 u = q*q*q*(q*(q*6.0-15.0)+10.0);
  float a = 6.2831853*h1(c,s), b = 6.2831853*h1(c+ivec2(1,0),s), e = 6.2831853*h1(c+ivec2(0,1),s), d = 6.2831853*h1(c+ivec2(1,1),s);
  float va = dot(vec2(cos(a),sin(a)), q), vb = dot(vec2(cos(b),sin(b)), q-vec2(1,0));
  float vc = dot(vec2(cos(e),sin(e)), q-vec2(0,1)), vd = dot(vec2(cos(d),sin(d)), q-vec2(1,1));
  return 1.4*mix(mix(va,vb,u.x), mix(vc,vd,u.x), u.y);
}
float fbm(vec2 p, int s, int oct){ float a = 0.5, t = 0.0, n = 0.0; mat2 R = mat2(0.8,0.6,-0.6,0.8); for (int i = 0; i < 4; i++){ if (i >= oct) break; t += a*gn(p, s+i*17); n += a; p = R*p*2.03; a *= 0.5; } return t/n; }
float sat(float x){ return clamp(x, 0.0, 1.0); }
float aa(float d, float w){ return 1.0 - smoothstep(-w, w, d); }

vec2 sdUv(vec2 p){ return (p - uGrid.xy) / uGrid.zw; }
float dec(float v){ return (v * 2.0 - 1.0) * uFar; }

float blade(vec2 q, float hw, float h){ float k = hw/h; return max(-q.y, (abs(q.x) - hw*(1.0 - q.y/h)) / sqrt(1.0 + k*k)); }
vec3 flecks(vec2 p, vec3 c, float cell, float dens, int seed){
  vec2 g = floor(p/cell);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    ivec2 id = ivec2(g) + ivec2(i,j);
    vec2 r = h2(id, seed);
    if (r.x > dens) continue;
    vec2 q = p - (vec2(id) + 0.2 + 0.6*h2(id, seed+1))*cell;
    float size = 2.3 + 2.0*h1(id, seed+3), ang = (h1(id, seed+2) - 0.5)*0.8, cs = cos(ang), sn = sin(ang);
    vec2 lq = vec2(cs*q.x - sn*q.y, sn*q.x + cs*q.y);
    float d = blade(lq, 0.21*size, size);
    if (h1(id, seed+4) < 0.55){
      float a2 = 0.62;
      d = min(d, blade(vec2(cos(a2)*lq.x - sin(a2)*lq.y, sin(a2)*lq.x + cos(a2)*lq.y), 0.17*size, 0.7*size));
      d = min(d, blade(vec2(cos(a2)*lq.x + sin(a2)*lq.y, -sin(a2)*lq.x + cos(a2)*lq.y), 0.17*size, 0.7*size));
    }
    vec3 fc = (r.y < 0.68 ? FLECK_HI : FLECK_LO) * (1.0 + 0.06*sign(-lq.x));
    c = mix(c, fc, aa(d, AAW*1.2) * 0.9);
  }
  return c;
}
vec3 grassCol(vec2 p){
  vec2 w = p + 7.0*vec2(gn(p/34.0, 31), gn(p/34.0 + 9.0, 37));
  float m1 = fbm(w/80.0, 11, 4), m2 = fbm(w/26.0 + 3.1, 21, 3), m3 = gn(w/7.0, 41);
  vec3 c = GRASS;
  c = mix(c, GRASS_HI, smoothstep(-0.05, 0.42, m1)*0.7);
  c = mix(c, uWinter > 0.5 ? GRASS_SHADE : FLECK_LO, smoothstep(0.05, 0.5, -m2)*(uWinter > 0.5 ? 0.25 : 0.42));
  c = mix(c, GRASS_HI, smoothstep(0.2, 0.6, m3)*0.22);
  // NH's own grass pattern (its triangles), faint
  vec4 mx = texture(uGrassMix, p / 46.0);
  c *= 1.0 - 0.06*(1.0 - mx.r)*(1.0 - uWinter);
  vec2 sp = mat2(0.94, 0.34, -0.34, 0.94)*p;
  c *= 1.0 + 0.05*gn(vec2(sp.x/1.2, sp.y/3.8), 61) + 0.03*gn(p/2.0, 62);
  c = flecks(p, c, 9.0, uWinter > 0.5 ? 0.18 : 0.6, 71);
  c = flecks(p + 4.5, c, 13.0, uWinter > 0.5 ? 0.0 : 0.35, 73);
  return c;
}
vec3 sandCol(vec2 p, float dL){
  vec3 c = mix(SAND_HI, SAND, smoothstep(-95.0, -40.0, dL));
  c = mix(c, SAND_LO, smoothstep(-34.0, -8.0, dL)*0.7);
  c *= 0.86 + 0.3 * dot(texture(uSand, p / 40.0).rgb, vec3(0.33));
  c *= 1.0 + 0.035*fbm(p/24.0, 101, 3) + 0.03*gn(p/0.9, 102);
  c *= 1.0 + 0.018*sin(p.y*0.75 + p.x*0.08 + 4.0*gn(p/14.0, 103));
  vec2 g = floor(p/2.4); vec2 r = h2(ivec2(g), 105);
  if (r.x < 0.55){ vec2 q = p - (g + 0.2 + 0.6*h2(ivec2(g), 106))*2.4; float rad = 0.22 + 0.32*r.y;
    vec3 sc = h1(ivec2(g), 107) < 0.16 ? mix(SAND_HI, vec3(1.0), 0.6) : SPECK*0.97;
    c = mix(c, sc, aa(length(q) - rad, AAW)*0.6); }
  return c;
}
vec3 dirtCol(vec2 p, float pd){
  float core = sat(-pd/12.0);
  vec3 c = mix(vec3(0.79,0.62,0.40), vec3(0.86,0.72,0.50), smoothstep(0.15, 0.8, core));
  c *= 1.0 + 0.09*fbm(p/9.0, 401, 4) + 0.05*gn(p/1.4, 402) + 0.04*gn(p/0.6, 403);
  c = mix(c, vec3(0.71,0.54,0.34), smoothstep(0.2, 0.7, fbm(p/4.0 + 3.0, 404, 3))*0.45);
  c = mix(c, vec3(0.90,0.79,0.60), smoothstep(0.45, 0.8, gn(p/3.0, 405))*0.35*core);
  vec4 mx = texture(uSoilMix, p / 40.0);
  c *= 1.0 - 0.05*(1.0 - mx.g);
  vec2 g = floor(p/5.0); vec2 r = h2(ivec2(g), 408);
  if (r.x < 0.22){
    vec2 q = p - (g + 0.25 + 0.5*h2(ivec2(g), 409))*5.0;
    float rad = 0.7 + 0.7*h1(ivec2(g), 410);
    vec3 pc = mix(vec3(0.66,0.62,0.56), vec3(0.86,0.80,0.70), h1(ivec2(g), 411));
    c = mix(c, c*0.7, aa(length((q - vec2(0.35,-0.4))*vec2(1.0,1.4)) - rad, AAW*2.0)*0.5);
    c = mix(c, pc, aa(length(q*vec2(1.0,1.3)) - rad, AAW));
  }
  c *= 1.0 - 0.15*smoothstep(-3.5, 0.0, pd);
  return c;
}
/** A tile's kind (0 sea … 8 pond) and its raw tier at p. */
ivec2 tileAt(vec2 p){
  vec2 t = floor((p - uGrid.xy) / 30.0);
  vec2 n = uGrid.zw / 30.0;
  if (t.x < 0.0 || t.y < 0.0 || t.x >= n.x || t.y >= n.y) return ivec2(0, 0);
  int code = int(texture(uCodes, (t + 0.5) / n).r * 255.0 + 0.5);
  return ivec2(code / 4, code - (code / 4) * 4);
}
/** The path tile a path's edge at p belongs to: its own, or (where a soft corner rounds out over a neighbour,
 *  fields.ts) the nearest path tile round it. */
ivec2 pathTile(vec2 p){
  ivec2 t = tileAt(p);
  if (t.x >= 3 && t.x <= 6) return t;
  float best = 1e9; ivec2 r = ivec2(3, 0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 q = p + vec2(float(i), float(j)) * 30.0;
    ivec2 n = tileAt(q);
    if (n.x < 3 || n.x > 6) continue;
    vec2 cen = (floor((q - uGrid.xy) / 30.0) + 0.5) * 30.0 + uGrid.xy;
    float d = length(max(abs(p - cen) - 15.0, 0.0));
    if (d < best){ best = d; r = n; }
  }
  return r;
}

void main(){
  vec2 p = vW;
  AAW = 0.5 / uPx;
  vec4 A = texture(uSdfA, sdUv(p)), B = texture(uSdfB, sdUv(p));
  float dL = dec(A.r), dS = dec(A.g), dW = dec(A.b), dP = dec(A.a);
  float t1 = dec(B.r), t2 = dec(B.g), t3 = dec(B.b);
  int tier = int(t1 < 0.0) + int(t2 < 0.0) + int(t3 < 0.0);
  vec3 c = grassCol(p);
  // the beach's sand, a soft wandering edge; wet toward the sea; the seabed under the sea
  float ds = dS + 1.2*gn(p/9.0, 7) + 0.6*gn(p/3.0, 8);
  vec3 sc = sandCol(p, dL);
  float dn = dL + 0.9*gn(p/7.0, 251) + 0.6*gn(p/2.5, 252);
  vec3 wet = mix(SAND_WET*1.04, SAND_WET*0.9, smoothstep(-6.0, 4.0, dn));
  wet = mix(wet, mix(wet, vec3(1.0), 0.3), smoothstep(0.5, 0.85, gn(vec2(p.x/9.0, p.y/1.8), 254))*0.3*smoothstep(-4.0, 2.0, dn));
  sc = mix(sc, wet, smoothstep(-9.0, -3.5, dn) * float(tier == 0));
  // the seabed fading with depth: at the waterline the wet sand, paling and cooling under the water (NH's shallows are
  // a light sand going aqua, never a darker band), then the turquoise, then the deep blue; one long eased ramp, no
  // knee for a line to show at. (The bed is the deep plane's colour by the field's reach: past it the sea's own colour
  // carries the shallows, so the grid's edge never shows)
  float bl = dL + 1.2*gn(p/11.0, 255);
  vec3 bed = mix(mix(mix(SAND, SAND_WET, 0.5), vec3(0.62, 0.90, 0.86), 0.3), mix(SAND_HI, vec3(0.62, 0.90, 0.86), 0.62), smoothstep(-2.0, 6.0, bl));
  bed = mix(bed, vec3(0.40,0.74,0.79), smoothstep(4.0, 22.0, bl));
  // (the deep plane's colour by the grid's edge too, where the land comes nearer it than the field's reach: its seabed
  // goes down to the plane there, layout/height.ts EDGE_FADE)
  vec2 ge = min(p - uGrid.xy, uGrid.xy + uGrid.zw - p);
  bed = mix(bed, vec3(0.18,0.45,0.72), max(smoothstep(20.0, 46.0, dL), smoothstep(${EDGE_FADE.toFixed(1)}, 4.0, min(ge.x, ge.y))));
  sc = mix(sc, bed, smoothstep(-2.0, 4.0, dn) * float(tier == 0));
  c = mix(c, sc, aa(ds, 1.4));
  // paths: dirt worn soft, stone, brick and planks NH's
  if (dP < 4.0){
    ivec2 tile = pathTile(p);
    float dp = dP + 1.0*gn(p/6.0, 17) + 0.5*gn(p/2.0, 18);
    vec3 pc;
    float edge;
    if (tile.x == 4){ pc = texture(uStone, p / 30.0).rgb * 1.08; edge = aa(dP + 0.3*gn(p/3.0, 19), 0.6); pc *= 1.0 - 0.25*smoothstep(-1.6, 0.0, dP); }
    else if (tile.x == 5){ pc = texture(uBrick, p / 30.0).rgb; edge = aa(dP, 0.5); pc *= 1.0 - 0.2*smoothstep(-1.2, 0.0, dP); }
    else if (tile.x == 6){ pc = texture(uPlank, p / 30.0).rgb; edge = aa(dP, 0.5); pc *= 1.0 - 0.2*smoothstep(-1.2, 0.0, dP); }
    else { pc = dirtCol(p, dp); edge = aa(dp, 1.4); }
    pc = mix(pc, mix(pc, vec3(0.96, 0.97, 1.0), 0.75), uWinter * smoothstep(0.1, 0.6, fbm(p/6.0, 31, 3) + 0.2));
    c = mix(c, pc, edge);
  }
  // fresh water: a darker earthy rim on the bank, the bed sandy at the edge going deep blue-green
  // where a river meets the sea (its stem runs on out past the shore, layout/river.ts) its bed and its bank's rim fade
  // into the seabed's over the shore, as its channel shallows into it (layout/height.ts): no dark band out to sea
  float dw = dW + 0.8*gn(p/6.0, 27);
  float sea = smoothstep(-10.0, 6.0, dL) * float(tier == 0);
  c = mix(c, c*vec3(0.78,0.74,0.62), (1.0 - smoothstep(0.0, 3.5, dw)) * step(0.0, dw) * 0.6 * (1.0 - sea));
  vec3 wb = mix(vec3(0.72,0.66,0.48), vec3(0.20,0.42,0.48), smoothstep(-1.0, -12.0, dW));
  wb *= 1.0 + 0.08*fbm(p/7.0, 33, 3);
  c = mix(c, mix(wb, bed, sea), aa(dw, 1.0));
  // the cliffs: a shade at their foot, the top edge a little darker
  if (tier < 3){
    float df = tier == 0 ? t1 : tier == 1 ? t2 : t3;
    c *= 1.0 - 0.28*(1.0 - smoothstep(0.0, 12.0, df)) * step(0.0, df);
  }
  if (tier > 0){
    float de = -(tier == 1 ? t1 : tier == 2 ? t2 : t3);
    c *= 1.0 - 0.12*(1.0 - smoothstep(0.0, 3.0, de));
  }
  // painted in sRGB (the palette, NH's textures as stored, the 2D bake's colours); the target stores linear
  c = clamp(c, 0.0, 1.0);
  outColor = vec4(mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)), 1.0);
}`;

// ---- the water --------------------------------------------------------------------------------------------------------

const W_COMMON = /* glsl */ `
uniform float uTime;
uniform vec3 uTint;
uniform vec3 uFog;
uniform float uFogNear;
uniform float uFogFar;
varying vec2 vW;
varying float vDepth;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
vec4 finish(vec3 col, float a) {
  col *= uTint;
  col = mix(col, uFog, smoothstep(uFogNear, uFogFar, vDepth));
  return vec4(col, a);
}
`;
const FRESH_VERT = /* glsl */ `
${BEND_GLSL}
attribute vec4 aFlow;
attribute vec4 aPath;
varying vec2 vW;
varying vec4 vFlow;
varying vec4 vPath;
varying float vDepth;
varying float vLow;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = vec2(wp.x, -wp.z);
  vLow = step(wp.y, 5.0);
  vFlow = aFlow;
  vPath = aPath;
  vec4 mv = viewMatrix * bendW(wp);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const FRESH_FRAG = /* glsl */ `
${W_COMMON}
varying vec4 vFlow;
varying vec4 vPath;
varying float vLow;
uniform sampler2D uSdfA;
uniform vec4 uGrid;
uniform float uFar;
void main() {
  vec2 p = vW;
  // the edge is the field's (fields.ts, soft and round), not where the mesh's bank crosses the surface (its 5u cells)
  vec4 f = texture2D(uSdfA, (p - uGrid.xy) / uGrid.zw);
  float dW = (f.b * 2.0 - 1.0) * uFar;
  float edge = smoothstep(-1.2, -2.0, dW);
  // a river on the sea's level runs out into the sea: its surface (a little over the sea's) fades into it over its last
  // few u, the sea's own water there under it already (the sea is drawn 6u in), not cut square at the shore
  edge *= 1.0 - vLow * smoothstep(-7.0, -0.5, (f.r * 2.0 - 1.0) * uFar);
  if (edge <= 0.0) discard;
  float still = vFlow.z, foot = vFlow.w, lip = vPath.w;
  // the hand-made river's look (water.ts RIVER_FRAG): streaks on the length along the stem and across it, so a bend
  // carries them round without a seam or a shear; 26 u/s, hurrying to 90 and whitening over a fall's lip
  float flow = uTime * mix(26.0, 90.0, lip);
  float s = vPath.x + flow, x = vPath.y;
  float n = noise(vec2(x * 3.0, s * 0.07)) * 0.6 + noise(vec2(x * 7.0, (vPath.x + flow * 1.3) * 0.16)) * 0.4;
  float g = noise(vec2(x * 9.0, s * 0.45));
  if (vPath.z < 0.5) {
    // off a stem (a broad reach, a delta): the tiles' flow, in the world's frame (its way is one a tile)
    vec2 f = vFlow.xy;
    float sp = length(f);
    vec2 dir = sp > 0.01 ? f / sp : vec2(0.0, 1.0);
    vec2 q = vec2(dot(p, vec2(-dir.y, dir.x)), dot(p, dir));
    float fl = uTime * 26.0 * smoothstep(0.0, 0.3, sp);
    n = noise(vec2(q.x * 0.2, (q.y - fl) * 0.07)) * 0.6 + noise(vec2(q.x * 0.45, (q.y - fl * 1.3) * 0.16)) * 0.4;
    g = noise(vec2(q.x * 0.6, (q.y - fl) * 0.45));
  }
  float np = noise(p * 0.08 + vec2(uTime * 0.04, uTime * 0.03)) * 0.6 + noise(p * 0.2 - uTime * 0.05) * 0.4;
  n = mix(n, np, still);
  vec3 col = mix(vec3(0.24, 0.58, 0.88), vec3(0.55, 0.82, 0.97), smoothstep(0.55, 0.85, n));
  // glints riding the current (a pond's drift with its ripples)
  g = mix(g, noise(p * 0.4 + uTime * 0.5), still);
  col += vec3(0.35) * smoothstep(0.9, 0.97, g);
  // over a fall's lip: a fast white sheet
  float sheet = noise(vec2(x * 10.0, (vPath.x + uTime * 110.0) * 0.12));
  col = mix(col, vec3(0.93, 0.97, 1.0), lip * lip * (0.55 + 0.45 * sheet));
  // at its foot: the foam pool, churning out from the wall
  float fn = noise(p * 0.35 + vec2(0.0, -uTime * 1.6)) * 0.6 + noise(p * 0.9 - uTime * 2.2) * 0.4;
  float fa = smoothstep(0.0, 0.6, foot) * (0.5 + 0.5 * fn);
  col = mix(col, vec3(0.96, 0.99, 1.0), clamp(fa * 1.25, 0.0, 1.0));
  gl_FragColor = finish(col, mix(0.74, 0.96, max(lip * lip, fa)) * edge);
}`;
const FALLS_VERT = /* glsl */ `
${BEND_GLSL}
varying vec2 vW;
varying vec2 vUv;
varying float vDepth;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = vec2(wp.x, -wp.z);
  vUv = uv;
  vec4 mv = viewMatrix * bendW(wp);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const FALLS_FRAG = /* glsl */ `
${W_COMMON}
varying vec2 vUv;
uniform sampler2D uStreak;
void main() {
  // NH's falls: white streaks pouring down a pale blue sheet, in world units (u along the wall, height): long streaks
  // a few u across falling at the hand-made river's 110 u/s (water.ts), over NH's streak texture (no octave finer than
  // a pixel or two at the phone's zoom: it shimmered as static)
  float xw = vUv.x * 60.0, yw = vUv.y * 80.0;
  float sheet = noise(vec2(xw * 0.45, (yw + uTime * 110.0) * 0.035));
  float fine = noise(vec2(xw * 1.1, (yw + uTime * 140.0) * 0.06));
  float s = texture2D(uStreak, vec2(vUv.x * 5.0, vUv.y * 0.9 + uTime * 1.3)).r;
  float w = 0.2 + 0.4 * sheet + 0.2 * fine + (1.0 - s) * 0.35;
  vec3 col = mix(vec3(0.45, 0.76, 0.96), vec3(0.97, 0.99, 1.0), smoothstep(0.42, 0.78, w));
  gl_FragColor = finish(col, 0.94);
}`;
const SEA_VERT = /* glsl */ `
${BEND_GLSL}
varying vec2 vW;
varying float vDepth;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = vec2(wp.x, -wp.z);
  vec4 mv = viewMatrix * bendW(wp);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const SEA_FRAG = /* glsl */ `
${W_COMMON}
${SWASH_GLSL}
uniform sampler2D uSdfA;
uniform vec4 uGrid;
uniform vec4 uLand;
uniform float uFar;
float boxD(vec2 p) {
  vec2 c = (uLand.xy + uLand.zw) * 0.5, h = (uLand.zw - uLand.xy) * 0.5;
  vec2 q = abs(p - c) - h;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}
void main() {
  vec2 p = vW;
  vec2 uv = (p - uGrid.xy) / uGrid.zw;
  // off the grid: the field at its edge and on out (as layout/fields.ts at() reads it), so the shallows carry on across
  // the grid's edge where the land is nearer it than the field's reach (no step in the water's colour there)
  vec2 off = max(max(uGrid.xy - p, p - uGrid.xy - uGrid.zw), 0.0);
  vec4 sdf = texture2D(uSdfA, clamp(uv, 0.0, 1.0));
  float near = (sdf.r * 2.0 - 1.0) * uFar + length(off);
  float d = near < uFar - 1.0 ? near : max(near, boxD(p));
  if (d < -6.0) discard;
  // NH's shallows (the user: "double it … make the transition smooth into the deep water … seeing fish easier"): the
  // turquoise reaches ~70u out (twice the old band), then fades into the deep blue over a long ~200u gradient, never a
  // step. Translucent over the baked shallows near the shore; past the field's reach (the bed is the deep plane's blue
  // there) the sea's own turquoise carries them, still see-through over the fishing water (a fish's shadow reads under
  // it), opaque only far out
  float a = mix(0.22, 0.56, smoothstep(3.0, 70.0, d));
  a = mix(a, 0.72, smoothstep(60.0, 130.0, d));
  a = mix(a, 1.0, smoothstep(130.0, 340.0, d));
  vec3 col = mix(vec3(0.44, 0.89, 0.91), vec3(0.17, 0.50, 0.86), smoothstep(50.0, 280.0, d));
  float n = noise(p * 0.045 + vec2(uTime * 0.05, uTime * 0.03)) + 0.5 * noise(p * 0.12 - vec2(uTime * 0.08, -uTime * 0.02));
  col += vec3(0.07, 0.09, 0.1) * smoothstep(0.95, 1.4, n);
  float g = noise(p * 0.32 + vec2(uTime * 0.7, uTime * 0.4));
  col += vec3(0.35) * smoothstep(0.93, 0.99, g) * smoothstep(25.0, 80.0, d) * smoothstep(0.5, 0.9, n);
  // NH's waves washing ashore (layout/swash.ts): out in the water, each wave's foam line rolls in over the shallows to
  // the waterline (then runs up the sand: the ground's shader) and its backwash drains back into the sea, a lacy rim of
  // foam on it fading as it goes; a thin lace always where the water meets the sand. The coast's phase is its point on
  // the shoreline's (the field's normal back along the distance), so a front stays a line along the coast.
  float sw = SW_WATERLINE - d;
  if (sw > -SW_APPROACH - 8.0 && near < uFar - 1.0) {
    vec2 st = 5.0 / uGrid.zw;
    vec2 gr = vec2(texture2D(uSdfA, clamp(uv + vec2(st.x, 0.0), 0.0, 1.0)).r, texture2D(uSdfA, clamp(uv + vec2(0.0, st.y), 0.0, 1.0)).r) - sdf.r;
    vec2 cp = p - normalize(gr + 1e-6) * d;
    vec3 fr = swashFront(cp, uTime);
    float lace = 0.55 + 0.45 * noise(p * 0.24 + vec2(uTime * 0.25, -uTime * 0.18));
    // the incoming line (from the backwash's end to the next run-up), fading in out there, a softer trail behind it
    float inc = smoothstep(SW_DOWN, SW_DOWN + 0.07, fr.z);
    float line = (1.0 - smoothstep(0.0, 1.6, abs(sw - fr.x))) + 0.45 * smoothstep(fr.x - 5.0, fr.x - 0.5, sw) * step(sw, fr.x);
    float fo = inc * line * lace * 0.85;
    // the backwash draining in: the foam rim on its front as it goes under, fading
    float back = step(SW_UP, fr.z) * step(fr.z, SW_DOWN) * smoothstep(-SW_DRAIN, 0.0, fr.x);
    fo = max(fo, back * (1.0 - smoothstep(0.0, 2.2, abs(sw - fr.x))) * lace * 0.8);
    // while it runs up, the water at the waterline whitens a little (the wave's body coming in behind its front)
    float up = 1.0 - smoothstep(0.0, SW_UP, fr.z);
    fo = max(fo, up * smoothstep(-6.0, 0.0, sw) * 0.35 * lace);
    // the rim where the water meets the sand
    fo = max(fo, smoothstep(-2.4, 0.0, sw) * 0.4 * lace);
    // (where a river runs out into the sea, its outflow: the surf's lines broken up over it, no white bar across a mouth;
    // and all of it faded in at the block's outer edge, the incoming line's trail never cut square there)
    fo *= mix(0.3, 1.0, smoothstep(-10.0, 4.0, (sdf.b * 2.0 - 1.0) * uFar))
      * smoothstep(-SW_APPROACH - 8.0, -SW_APPROACH - 2.0, sw);
    col = mix(col, vec3(0.97, 1.0, 1.0), fo);
    a = max(a, fo * 0.9);
  }
  gl_FragColor = finish(col, a);
}`;

/** A water material, bent in its own vertex shader (marked so bend.ts leaves it be). */
function waterMat(vert: string, frag: string, extra: Record<string, { value: unknown }> = {}): ShaderMaterial {
  const m = new ShaderMaterial({ vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, side: DoubleSide, uniforms: { ...bendU, ...waterU, ...extra } });
  m.userData.bent = true;
  return m;
}

/** NH's waves on the sand (layout/swash.ts), in the ground's own (lit) shader: as each wave runs up the beach, a thin
 *  sheet of water over the sand, the sea's turquoise showing through it deeper down, a lacy white foam edge on its
 *  front and a fainter line inside it; as it drains, the foam thins and the sand it covered stays dark and wet, drying
 *  in a second or two. Lit as the ground is (the moonlight at night, the dusk's warmth): nothing to switch on or off.
 *  Only the beach at the sea's level (under the grass's height, on the sand field), within the waves' reach; a texture
 *  tap and two for the coast's normal there, nothing elsewhere. */
function washed(m: MeshLambertMaterial, u: Record<string, { value: unknown }>): MeshLambertMaterial {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = 'varying vec3 vWashP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWashP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = (WASH_HEAD + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n' + WASH_SAND))
      .replace('#include <lights_fragment_begin>', ShaderChunk.lights_fragment_begin.replaceAll('directionalLightShadow.shadowIntensity', 'directionalLightShadow.shadowIntensity * wShadowK'));
  };
  m.customProgramCacheKey = () => 'wash';
  return m;
}
const WASH_HEAD = /* glsl */ `
uniform float uTime;
uniform sampler2D uWashSdf;
uniform vec4 uWashGrid;
uniform float uWashFar;
varying vec3 vWashP;
float wShadowK = 1.0;
${SWASH_GLSL}
float wHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(wHash(i), wHash(i + vec2(1.0, 0.0)), u.x), mix(wHash(i + vec2(0.0, 1.0)), wHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
`;
const WASH_SAND = /* glsl */ `
{
  // a shadow on the seabed (a cliff's, by the sea) fading with the water's depth over it, the sunlight scattered in the
  // water: no hard-edged shadow out across the shallows (the sea's surface is SEA_Y −0.5)
  wShadowK = 1.0 - 0.8 * smoothstep(-0.4, -3.5, vWashP.y);
  vec2 wp = vec2(vWashP.x, -vWashP.z);
  vec2 wuv = (wp - uWashGrid.xy) / uWashGrid.zw;
  vec4 wA = texture2D(uWashSdf, wuv);
  float dL = (wA.r * 2.0 - 1.0) * uWashFar;
  float s = SW_WATERLINE - dL;
  // the beach at the sea's level, on the sand (not a cliff's top by the sea, not the grass)
  float on = (1.0 - smoothstep(2.2, 2.8, vWashP.y)) * (1.0 - smoothstep(-1.0, 2.0, (wA.g * 2.0 - 1.0) * uWashFar));
  if (s > -0.5 && s < 30.0 && on > 0.0) {
    vec2 st = 5.0 / uWashGrid.zw;
    vec2 gr = vec2(texture2D(uWashSdf, wuv + vec2(st.x, 0.0)).r, texture2D(uWashSdf, wuv + vec2(0.0, st.y)).r) - wA.r;
    vec2 cp = wp - normalize(gr + 1e-6) * dL;
    vec3 fr = swashFront(cp, uTime);
    float front = fr.x;
    float wet = swashWet(s, cp, uTime, fr);
    float drained = smoothstep(SW_UP, SW_DOWN, fr.z);
    vec3 c = diffuseColor.rgb;
    // the wet sand left behind: darker, a touch cooler
    float cov = 1.0 - smoothstep(front - 0.8, front, s);
    c *= mix(vec3(1.0), vec3(0.70, 0.71, 0.77), wet * (1.0 - cov));
    // the sheet of water: thin at its front, the sea's turquoise deeper down (linear colours: the sand's are)
    float depth = smoothstep(0.0, 8.0, front - s);
    vec3 sheet = mix(c * vec3(0.78, 0.84, 0.86), vec3(0.36, 0.80, 0.82), 0.2 + 0.34 * depth);
    float glint = smoothstep(0.86, 0.97, wNoise(wp * vec2(0.18, 0.3) + vec2(uTime * 0.5, uTime * 0.2))) * 0.12 * depth;
    c = mix(c, sheet + glint, cov * step(0.0, front));
    // the foam: a lacy edge on the front (thinning as it drains back), a fainter line inside the sheet as it runs up
    float lace = 0.6 + 0.4 * wNoise(wp * 0.3 + vec2(uTime * 0.35, -uTime * 0.2));
    float edge = smoothstep(front - 3.6, front - 0.6, s) * (1.0 - smoothstep(front - 0.2, front + 0.4, s));
    float inner = (1.0 - smoothstep(0.0, 1.0, abs(s - front * 0.55))) * (1.0 - smoothstep(0.0, SW_UP, fr.z)) * 0.45;
    float foam = (edge * mix(0.95, 0.45, drained) + inner) * lace * step(0.0, front);
    c = mix(c, vec3(0.92, 0.96, 0.97), clamp(foam, 0.0, 1.0));
    diffuseColor.rgb = mix(diffuseColor.rgb, c, on);
  }
}
`;

// ---- the ground -------------------------------------------------------------------------------------------------------

const GW = GRID.cols * TILE, GD = GRID.rows * TILE;
const FW = GW / STEP, FD = GD / STEP;

/** A band's built ground, CPU-side (each mount's GPU copies go with its renderer): its top with its uvs and normals,
 *  its walls, falls and water; null for open sea. */
export interface BandArrays { top: Part & { uv: Float32Array; normal: Float32Array }; walls: WallPart; falls: WallPart; water: WaterPart }
/** The bands' arrays kept page-wide for one layout (mesh.ts meshKeyOf: its tiles, pieces and homes), as the models'
 *  loads are (things.ts `loaded`): back from a room the island's ground takes them again instead of building every
 *  chunk and its normals (~140 of a return's ~350 ms main-thread stretch at 4x CPU). Another layout's build (an
 *  editor stroke's, a もようがえ) replaces the set. */
let kept: { key: string; rows: (BandArrays | null | undefined)[] } | null = null;
/** The kept set's size (bytes: perf's and the tests'). */
export const keptBytes = (): number =>
  (kept?.rows ?? []).reduce((n, b) => n + (b ? [b.top, b.walls, b.falls, b.water].reduce((m, p) => m + Object.values(p).reduce((k, a: ArrayLike<number> & { byteLength: number }) => k + a.byteLength, 0), 0) : 0), 0);
/** Tests: forget the kept set. */
export const forgetBands = (): void => void (kept = null);

/** NH's ground textures' images once loaded (by URL; ~100 KB of WebP in all), for the next ground's build. */
const nhImages = new Map<string, HTMLImageElement>();

export function buildGround(layout: Layout, opts: GroundOptions): Ground {
  const { renderer } = opts;
  const px = opts.px ?? 1.6;
  const base = opts.base ?? new URL('.', document.baseURI).href;
  const group = new Group();
  group.name = 'ground';
  let lay = layout;
  let look: Look = opts.look ?? 'summer';

  // the textures: NH's, and the layout's own (the fields, the tiles)
  const loader = new TextureLoader();
  /** NH's texture by name: `srgb` for the lit materials (the walls), raw for the bake (it paints in sRGB); its image
   *  the one loaded before (back from a room: in at once, so the ground bakes once, not the palette then again). */
  const nh = (name: string, srgb = true): Texture => {
    const url = `${base}terrain/nh/${name}.webp`, had = nhImages.get(url);
    let t: Texture;
    if (had) (t = new Texture(had)), (t.needsUpdate = true);
    else {
      const done = () => (pendingTex--, pendingTex || texDone());
      t = loader.load(url, (x) => (nhImages.set(url, x.image as HTMLImageElement), done()), undefined, done);
      pendingTex++;
    }
    t.wrapS = t.wrapT = RepeatWrapping;
    if (srgb) t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  let pendingTex = 0;
  let texDone: () => void = () => {};
  const ready = new Promise<void>((res) => (texDone = res));
  const tex = {
    cliff: nh('cliff'), cliffSnow: nh('cliff-snow'), sand: nh('sand', false), stone: nh('stone', false), brick: nh('brick', false), plank: nh('plank', false),
    grassMix: nh('grass-mix', false), soilMix: nh('soil-mix', false), falls: nh('falls', false), steps: nh('stone')
  };
  if (!pendingTex) texDone();
  const sdfA = new DataTexture(new Uint8Array(FW * FD * 4), FW, FD, RGBAFormat, UnsignedByteType);
  const sdfB = new DataTexture(new Uint8Array(FW * FD * 4), FW, FD, RGBAFormat, UnsignedByteType);
  for (const t of [sdfA, sdfB]) {
    t.magFilter = t.minFilter = LinearFilter;
    t.wrapS = t.wrapT = ClampToEdgeWrapping;
  }
  const codes = new DataTexture(new Uint8Array(GRID.cols * GRID.rows * 4), GRID.cols, GRID.rows, RGBAFormat, UnsignedByteType);
  codes.magFilter = codes.minFilter = NearestFilter;
  function upload(l: Layout) {
    const f = fieldsOf(l);
    const a = sdfA.image.data as Uint8Array, b = sdfB.image.data as Uint8Array;
    const enc = (d: number) => Math.max(0, Math.min(255, Math.round((d / FAR) * 127.5 + 127.5)));
    for (let i = 0; i < FW * FD; i++) {
      for (let k = 0; k < 4; k++) a[i * 4 + k] = enc(f.ch[k][i]);
      for (let k = 0; k < 3; k++) b[i * 4 + k] = enc(f.ch[4 + k][i]);
      b[i * 4 + 3] = 255;
    }
    sdfA.needsUpdate = sdfB.needsUpdate = true;
    const cd = codes.image.data as Uint8Array;
    for (let i = 0; i < GRID.cols * GRID.rows; i++) cd[i * 4] = l.codes[i];
    codes.needsUpdate = true;
  }
  upload(lay);
  // the waves on the sand: the land's field and the water's clock
  const washU = { uTime: waterU.uTime, uWashSdf: { value: sdfA }, uWashGrid: { value: [GRID.x0, GRID.z0, GW, GD] }, uWashFar: { value: FAR } };

  // the bake: one quad, a render target a chunk
  const bakeMat = new RawShaderMaterial({
    glslVersion: GLSL3, vertexShader: BAKE_VERT, fragmentShader: BAKE_FRAG, depthTest: false, depthWrite: false,
    uniforms: {
      uBox: { value: [0, 0, 1, 1] }, uGrid: { value: [GRID.x0, GRID.z0, GW, GD] }, uSdfA: { value: sdfA }, uSdfB: { value: sdfB }, uCodes: { value: codes },
      uStone: { value: tex.stone }, uBrick: { value: tex.brick }, uPlank: { value: tex.plank }, uGrassMix: { value: tex.grassMix }, uSoilMix: { value: tex.soilMix }, uSand: { value: tex.sand },
      uPx: { value: px }, uFar: { value: FAR }, uWinter: { value: 0 },
      ...Object.fromEntries(Object.keys(PALETTES.summer).map((k) => [k, { value: new Color() }]))
    }
  });
  function palette() {
    const p = PALETTES[baseOf(look)];
    // as stored: the bake paints in sRGB
    for (const [k, v] of Object.entries(p)) (bakeMat.uniforms[k].value as Color).setRGB(parseInt(v.slice(1, 3), 16) / 255, parseInt(v.slice(3, 5), 16) / 255, parseInt(v.slice(5, 7), 16) / 255, 'srgb-linear');
    bakeMat.uniforms.uWinter.value = baseOf(look) === 'winter' ? 1 : 0;
  }
  palette();
  const bakeScene = new Scene();
  const quad = new Mesh(new PlaneGeometry(2, 2), bakeMat);
  quad.frustumCulled = false;
  bakeScene.add(quad);
  const bakeCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  /** A band: one row of chunks across the island, drawn as one (4 draws: the ground, the walls, the falls, the
   *  water), baked into one texture: the draw calls stay flat however long the island grows. */
  interface Band {
    row: number;
    z0: number;
    z1: number;
    /** Its bake (none while the band is open sea: the deep plane shows there). */
    rt: WebGLRenderTarget | null;
    top: Mesh;
    walls: Mesh;
    falls: Mesh;
    water: Mesh;
    /** The four, for the camera's culling. */
    meshes: Mesh[];
  }
  const bands: Band[] = [];
  /** The bands with land (chunks(): the camera culls them each move; made again only when a band's build changes it). */
  let landed: Band[] | null = null;
  const topMats: MeshLambertMaterial[] = [];
  const wallMat = bend(withMaps(new MeshLambertMaterial({ map: tex.cliff, color: 0xffffff })));
  const fallsMat = waterMat(FALLS_VERT, FALLS_FRAG, { uStreak: { value: tex.falls } });
  const freshMat = waterMat(FRESH_VERT, FRESH_FRAG, { uSdfA: { value: sdfA }, uGrid: { value: [GRID.x0, GRID.z0, GW, GD] }, uFar: { value: FAR } });
  const BAND_D = 8 * TILE;

  /** Parts joined into one (their indices offset). */
  function join<P extends Part>(parts: P[], extra: (keyof P)[]): P {
    const cat = (arrs: ArrayLike<number>[], T: Float32ArrayConstructor | Uint32ArrayConstructor) => {
      const out = new T(arrs.reduce((n, a) => n + a.length, 0));
      let o = 0;
      for (const a of arrs) {
        out.set(a, o);
        o += a.length;
      }
      return out;
    };
    let base = 0;
    const idx = parts.map((p) => {
      const shifted = new Uint32Array(p.index.length);
      for (let k = 0; k < p.index.length; k++) shifted[k] = p.index[k] + base;
      base += p.pos.length / 3;
      return shifted;
    });
    const r: Record<string, unknown> = { pos: cat(parts.map((p) => p.pos), Float32Array), index: cat(idx, Uint32Array) };
    for (const k of extra) r[k as string] = cat(parts.map((p) => p[k] as unknown as Float32Array), Float32Array);
    return r as unknown as P;
  }
  function geometry(p: Part): BufferGeometry {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(p.pos, 3));
    g.setIndex(new Uint32BufferAttribute(p.index, 1));
    return g;
  }
  function wallGeometry(p: WallPart): BufferGeometry {
    const g = geometry(p);
    g.setAttribute('normal', new Float32BufferAttribute(p.nrm, 3));
    g.setAttribute('uv', new Float32BufferAttribute(p.uv, 2));
    return g;
  }
  function waterGeometry(p: WaterPart): BufferGeometry {
    const g = geometry(p);
    g.setAttribute('aFlow', new Float32BufferAttribute(p.flow, 4));
    g.setAttribute('aPath', new Float32BufferAttribute(p.path, 4));
    return g;
  }
  /** Whether a band is open sea, its neighbours' tiles a field's reach (FAR) away too: nothing to draw or bake (the
   *  grid has rows of sea behind the island for it to grow into). */
  function openSea(row: number): boolean {
    const m = Math.ceil(FAR / TILE);
    for (let r = Math.max(0, row * CHUNK - m); r < Math.min(GRID.rows, (row + 1) * CHUNK + m); r++)
      for (let c = 0; c < GRID.cols; c++) if (kindOf(lay.codes[idx(c, r)]) !== 'sea') return false;
    return true;
  }
  function bandRt(): WebGLRenderTarget {
    const rt = new WebGLRenderTarget(Math.round(GW * px), Math.round(BAND_D * px), { generateMipmaps: true, minFilter: LinearMipmapLinearFilter, magFilter: LinearFilter, colorSpace: SRGBColorSpace });
    rt.texture.anisotropy = 4;
    return rt;
  }
  function bake(b: Band) {
    if (!b.rt) return;
    bakeMat.uniforms.uBox.value = [GRID.x0, b.z0, GRID.x0 + GW, b.z1];
    const was = renderer.getRenderTarget();
    renderer.setRenderTarget(b.rt);
    renderer.render(bakeScene, bakeCam);
    renderer.setRenderTarget(was);
  }
  /** A band's arrays: kept (the same layout's, built on an earlier mount) or built now (and kept). */
  function arrays(b: Band): BandArrays | null {
    const key = meshKeyOf(lay);
    if (kept?.key !== key) kept = { key, rows: [] };
    const had = kept.rows[b.row];
    if (had !== undefined) return had;
    if (openSea(b.row)) return (kept.rows[b.row] = null);
    const ms = Array.from({ length: CHUNKS_X }, (_, cx) => chunkMesh(lay, b.row * CHUNKS_X + cx));
    const top = join(ms.map((m) => m.top), []);
    const n = top.pos.length / 3, uv = new Float32Array(n * 2);
    for (let k = 0; k < n; k++) (uv[k * 2] = (top.pos[k * 3] - GRID.x0) / GW), (uv[k * 2 + 1] = (-top.pos[k * 3 + 2] - b.z0) / BAND_D);
    const g = geometry(top);
    g.computeVertexNormals();
    const normal = (g.getAttribute('normal').array as Float32Array).slice();
    g.dispose();
    return (kept.rows[b.row] = {
      top: { ...top, uv, normal },
      walls: join(ms.map((m) => m.walls), ['nrm', 'uv']),
      falls: join(ms.map((m) => m.falls), ['nrm', 'uv']),
      water: join(ms.map((m) => m.water), ['flow', 'path'])
    });
  }
  function build(b: Band) {
    for (const mesh of b.meshes) mesh.geometry.dispose();
    const a = arrays(b);
    for (const mesh of b.meshes) mesh.visible = !!a;
    landed = null;
    if (!a) {
      for (const mesh of b.meshes) mesh.geometry = new BufferGeometry();
      b.rt?.dispose();
      b.rt = null;
      return;
    }
    if (!b.rt) {
      b.rt = bandRt();
      (b.top.material as MeshLambertMaterial).map = b.rt.texture;
      (b.top.material as MeshLambertMaterial).needsUpdate = true;
    }
    b.top.geometry = geometry(a.top);
    b.top.geometry.setAttribute('uv', new Float32BufferAttribute(a.top.uv, 2));
    b.top.geometry.setAttribute('normal', new Float32BufferAttribute(a.top.normal, 3));
    b.walls.geometry = wallGeometry(a.walls);
    b.falls.geometry = wallGeometry(a.falls);
    b.water.geometry = waterGeometry(a.water);
  }
  for (let row = 0; row < CHUNKS_Z; row++) {
    const tm = bend(washed(withMaps(new MeshLambertMaterial({ color: 0xf4f4f4 })), washU));
    topMats.push(tm);
    const top = new Mesh(new BufferGeometry(), tm);
    top.receiveShadow = true;
    const walls = new Mesh(new BufferGeometry(), wallMat);
    walls.receiveShadow = walls.castShadow = true;
    const falls = new Mesh(new BufferGeometry(), fallsMat);
    falls.renderOrder = 3;
    const water = new Mesh(new BufferGeometry(), freshMat);
    water.renderOrder = 2;
    for (const mm of [top, walls, falls, water]) {
      mm.frustumCulled = false;
      group.add(mm);
    }
    const b: Band = { row, z0: GRID.z0 + row * BAND_D, z1: GRID.z0 + (row + 1) * BAND_D, rt: null, top, walls, falls, water, meshes: [top, walls, falls, water] };
    bands.push(b);
    build(b);
  }
  // the stairs: stone steps up each cliff they climb
  const stairsMat = bend(withMaps(new MeshLambertMaterial({ map: tex.steps, color: 0xe8e2d6 })));
  const stairs = new Mesh(new BufferGeometry(), stairsMat);
  stairs.castShadow = stairs.receiveShadow = true;
  stairs.frustumCulled = false;
  group.add(stairs);
  const buildStairs = () => {
    stairs.geometry.dispose();
    stairs.geometry = opts.stairs === false ? new BufferGeometry() : wallGeometry(stairsMesh(lay));
  };
  buildStairs();
  // the bake once NH's textures are in; while they load, one with the palette alone first (none twice when they're in
  // already: back from a room, ~40 ms at 4x CPU)
  for (const b of bands) bake(b);
  if (pendingTex) void ready.then(() => {
    if (!disposed) for (const b of bands) bake(b);
  });

  // the sea: far out every way, rows dense enough along z for the bend; under it, the deep seabed
  // (the land's box, extentOf's, as the sea's uLand: x0, z0, x1, z1)
  const landBox = (l: Layout) => {
    const { x0, x1, z0, z1 } = extentOf(l).land;
    return x0 < x1 ? [x0, z0, x1, z1] : [0, 0, 1, 1];
  };
  const seaGeo = new PlaneGeometry(4200, 6000, 24, 150);
  seaGeo.rotateX(-Math.PI / 2);
  seaGeo.translate(GRID.x0 + GW / 2, SEA_Y, -(GRID.z0 + GD / 2));
  const seaMat = waterMat(SEA_VERT, SEA_FRAG, { uSdfA: { value: sdfA }, uGrid: { value: [GRID.x0, GRID.z0, GW, GD] }, uLand: { value: landBox(lay) }, uFar: { value: FAR } });
  const sea = new Mesh(seaGeo, seaMat);
  sea.renderOrder = 1;
  sea.frustumCulled = false;
  const deepGeo = new PlaneGeometry(4200, 6000, 24, 150);
  deepGeo.rotateX(-Math.PI / 2);
  // (just under the bed's deepest, layout/height.ts DEEP_Y)
  deepGeo.translate(GRID.x0 + GW / 2, DEEP_Y - 0.1, -(GRID.z0 + GD / 2));
  // (lit as the ground's top is, the bed's deep blue under its tint: seen through the shallows' see-through water, the
  // grid's edge never shows, day or night)
  const deep = new Mesh(deepGeo, bend(withMaps(new MeshLambertMaterial({ color: new Color(0x2f74b8).multiply(new Color(0xf4f4f4)) }))));
  deep.frustumCulled = false;
  group.add(sea, deep);

  let disposed = false;
  let field = fieldOf(lay);
  const land = { ...extentOf(lay).land, r: 30 };
  return {
    group,
    ready,
    land,
    // (the engine's own water ran this clock: on the layout's ground there's none of it, and the water stood still)
    update: (t: number) => {
      waterU.uTime.value = (t / 1000) % 3600;
      return 'ambient' as const;
    },
    rebuild(l: Layout, changed?: readonly number[]) {
      lay = l;
      field = fieldOf(l);
      Object.assign(land, extentOf(l).land);
      upload(l);
      (seaMat.uniforms.uLand.value as number[]).splice(0, 4, ...landBox(l));
      // a change shapes the ground up to FAR away: the bands either side of each changed one follow
      const todo = new Set<number>();
      for (const i of changed ?? bands.map((b) => b.row * CHUNKS_X)) {
        const row = Math.floor(i / CHUNKS_X);
        for (let d = -1; d <= 1; d++) if (row + d >= 0 && row + d < CHUNKS_Z) todo.add(row + d);
      }
      for (const row of todo) {
        build(bands[row]);
        bake(bands[row]);
      }
      buildStairs();
    },
    heightAt: (x, z) => field.ground(x, z),
    feet: (x, z) => field.feet(x, z),
    look(l: Look) {
      if (l === look) return;
      look = l;
      palette();
      wallMat.map = baseOf(l) === 'winter' ? tex.cliffSnow : tex.cliff;
      wallMat.needsUpdate = true;
      for (const b of bands) bake(b);
    },
    chunks: () => (landed ??= bands.filter((b) => b.rt)),
    restore: () => bands.forEach(bake),
    dispose() {
      disposed = true;
      for (const b of bands) {
        b.rt?.dispose();
        for (const m of b.meshes) m.geometry.dispose();
      }
      stairs.geometry.dispose();
      for (const m of [...topMats, wallMat, fallsMat, freshMat, seaMat, bakeMat, stairsMat, deep.material]) m.dispose();
      for (const t of [...Object.values(tex), sdfA, sdfB, codes]) t.dispose();
      seaGeo.dispose();
      deepGeo.dispose();
      quad.geometry.dispose();
      group.clear();
    }
  };
}

/** The chunks a set of tiles is in (an editor stroke's). */
export const chunksOf = (tiles: Iterable<[number, number]>): number[] => [...new Set([...tiles].map(([c, r]) => chunkOf(c, r)))];
