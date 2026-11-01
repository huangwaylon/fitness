// The island's baked ground (docs/design.md "World"): the whole flat plan of world.ts (sea rings, beach, grass, the
// stream and pond with their banks, paths, the campsite's worn clearing, the cliff with its stairs and the waterfall's
// rocks, and the contact shadows of everything still) painted by one fragment shader (seeded noise, signed distances,
// soft masks: no outlines) in the installed Chrome (WebGL2), cut into 8 chunks along z per look (the four seasons, the
// blossom days' petals and the fall foliage's leaves: terrain-seasons.ts) and written as WebP. Plus the cliff's
// upright face, a sprite standing at its foot.
//
// Usage (from app/): node scripts/terrain.ts [--season=summer] [--chunk=3] [--no-sprites]
//   → static/terrain/<season>/<i>.webp, static/terrain/sprites/*.webp, src/lib/components/island/terrain.json
// Needs Google Chrome (Playwright's channel 'chrome') and cwebp (brew install webp). Deterministic: every random
// thing is an integer hash of a world cell.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LOOKS, baseOf, dressDefines, dressGeometry, SEASON_GLSL } from './terrain-seasons.ts';
import { BUILDINGS, CAMPSITE, CLIFF, FACE_H, GOAL_TREES, GRASS, HEDGE_XS, HEDGE_Z, LAND, PATHS, PLAN, POND, RIVER, ROCK, SCENERY, SPRING, TREE_H, BAND_D } from '../src/lib/components/island/world.ts';

const APP = join(import.meta.dirname, '..');
const OUT = join(APP, 'static', 'terrain');
const MANIFEST = join(APP, 'src', 'lib', 'components', 'island', 'terrain.json');
/** Pixels per world unit in the chunks; the sprites' scale. */
const PX = 2;
const SPRITE_PX = 3;
const CHUNKS = 8;
const CHUNK_D = BAND_D * 5;
const SEASONS = LOOKS;
type Season = (typeof SEASONS)[number];
const Q = 80;

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const onlySeason = arg('season') as Season | undefined;
const onlyChunk = arg('chunk') !== undefined ? Number(arg('chunk')) : undefined;
const noSprites = process.argv.includes('--no-sprites');

// ---- geometry → GLSL constants ------------------------------------------------------------------------------------

type P3 = readonly [number, number, number];
/** Catmull-Rom through the points (the ends held), `n` steps per span; widths (a third value) linearly. */
function smoothLine(pts: readonly (readonly number[])[], n: number): number[][] {
  const out: number[][] = [];
  const at = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      const q = [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
      if (p1.length > 2) q.push(p1[2] + (p2[2] - p1[2]) * t);
      out.push(q);
    }
  }
  out.push([...pts[pts.length - 1]]);
  return out;
}
const f = (v: number) => (Number.isInteger(v) ? `${v}.0` : `${+v.toFixed(3)}`);
const v2 = (a: number, b: number) => `vec2(${f(a)},${f(b)})`;
const v4 = (a: number, b: number, c: number, d: number) => `vec4(${f(a)},${f(b)},${f(c)},${f(d)})`;
const arr = (type: string, name: string, items: string[]) => `const int N_${name} = ${items.length};\nconst ${type} ${name}[${items.length}] = ${type}[${items.length}](${items.join(',')});`;

function segments(lines: readonly (readonly (readonly number[])[])[], n: number): string[] {
  const segs: string[] = [];
  for (const l of lines) {
    const s = smoothLine(l, n);
    for (let i = 0; i < s.length - 1; i++) segs.push(v4(s[i][0], s[i][1], s[i + 1][0], s[i + 1][1]));
  }
  return segs;
}

// the river: a dense centreline [x, z, width, distance along]
const riverPts = smoothLine(RIVER as readonly P3[], 8);
let along = 0;
const riverItems = riverPts.map((p, i) => {
  if (i) along += Math.hypot(p[0] - riverPts[i - 1][0], p[1] - riverPts[i - 1][1]);
  return v4(p[0], p[1], p[2], along);
});

// art sizes (for widths from heights): the manifest, else the world mockups' table
const manifest = JSON.parse(readFileSync(join(APP, 'static', 'art', 'manifest.json'), 'utf8')).files as Record<string, { w: number; h: number }>;
const FALLBACK: Record<string, [number, number]> = { 'deco/campsite': [281, 168], 'trees/palm': [2623, 2479], 'trees/cedar': [1514, 2951], oak: [509, 640], 'deco/streetlamp': [16, 109], 'deco/campsite-sign': [84, 109] };
const aspect = (key: string) => {
  const m = manifest[key === 'oak' ? 'trees/oak-summer' : key];
  const s = m ? [m.w, m.h] : FALLBACK[key] ?? [100, 100];
  return s[0] / s[1];
};

// contact shadows [x, z, rx, rz] + strength: soft ellipses (light from the upper left, so a little right and toward us)
const shadows: string[] = [];
const sh = (x: number, z: number, rx: number, rz: number, a: number) => shadows.push(v4(x, z, rx, rz), v4(a, 0, 0, 0));
const tree = (x: number, z: number, h: number) => { sh(x + 0.05 * h, z - 0.02 * h, 0.36 * h, 0.15 * h, 0.7); sh(x + 0.02 * h, z, 0.13 * h, 0.055 * h, 0.55); };
for (const [x, z] of Object.values(GOAL_TREES)) tree(x, z, TREE_H);
for (const s of SCENERY) {
  const w = s.h * aspect(s.key);
  if (s.kind === 'oak') tree(s.x, s.z, s.h);
  else if (s.kind === 'cedar') { sh(s.x + 0.05 * s.h, s.z - 0.02 * s.h, 0.2 * s.h, 0.085 * s.h, 0.55); sh(s.x, s.z, 0.07 * s.h, 0.03 * s.h, 0.45); }
  else if (s.kind === 'palm') { sh(s.x + 0.14 * s.h, s.z - 0.07 * s.h, 0.3 * s.h, 0.11 * s.h, 0.42); sh(s.x + 0.01 * s.h, s.z, 0.07 * s.h, 0.03 * s.h, 0.5); }
  else if (s.kind === 'bush') sh(s.x + 0.08 * s.h, s.z - 0.03 * s.h, 0.6 * s.h, 0.25 * s.h, 0.6);
  else sh(s.x + 0.1 * w, s.z - 1, Math.max(5, w * 0.48), Math.max(2.6, w * 0.16), 0.55);
}
for (const x of HEDGE_XS) sh(x + 3, HEDGE_Z - 1.5, 21, 8.5, 0.6);
sh(ROCK[0] + 2, ROCK[1] - 1, 16, 6.5, 0.6);

// buildings: [x, z, half width, depth]
const buildingsGlsl = BUILDINGS.map((b) => v4(b.x, b.z, (b.h * aspect(b.key)) / 2, b.depth));
const campW = CAMPSITE.h * aspect(CAMPSITE.key);

function geometry(): string {
  return [
    arr('vec4', 'RV', riverItems),
    arr('vec4', 'DIRT', segments(PATHS.dirt, 8)),
    arr('vec4', 'SHADOW', shadows),
    arr('vec4', 'BLD', buildingsGlsl),
    `const vec4 LANDR = ${v4(LAND.x0, LAND.z0, LAND.x1, LAND.z1)}; const float LAND_R = ${f(LAND.r)};`,
    `const vec4 GRASSR = ${v4(GRASS.x0, GRASS.z0, GRASS.x1, GRASS.z1)}; const float GRASS_R = ${f(GRASS.r)};`,
    `const vec4 POND = ${v4(POND.x, POND.z, POND.rx, POND.rz)}; const vec4 SPRING = ${v4(SPRING.x, SPRING.z, SPRING.rx, SPRING.rz)};`,
    `const vec4 CLIFFR = ${v4(CLIFF.x0, CLIFF.z0, CLIFF.x1, CLIFF.z1)}; const vec2 STAIR = ${v2(CLIFF.stair[0], CLIFF.stair[1])}; const vec2 FALL = ${v2(CLIFF.fall[0], CLIFF.fall[1])};`,
    // the campsite's worn clearing (dirt) in front of the tent
    `const vec4 AP_CA = ${v4(CAMPSITE.x, CAMPSITE.z - 30, campW * 0.5, 40)};`
  ].join('\n');
}

// ---- palettes -----------------------------------------------------------------------------------------------------

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return `vec3(${f(((n >> 16) & 255) / 255)},${f(((n >> 8) & 255) / 255)},${f((n & 255) / 255)})`;
};
const PALETTES: Record<ReturnType<typeof baseOf>, Record<string, string>> = {
  spring: { GRASS: '#7CC95A', GRASS_HI: '#9BD970', FLECK_HI: '#A8E07A', FLECK_LO: '#5EAE47', GRASS_SHADE: '#3F8F33', OVERHANG: '#5FA847', SAND_HI: '#FBE6B0', SAND: '#F3D493', SAND_LO: '#EBC983', SAND_WET: '#D9AC66', SPECK: '#E2BE7C' },
  summer: { GRASS: '#5DBE4A', GRASS_HI: '#7CCF5E', FLECK_HI: '#8ED96C', FLECK_LO: '#46A23A', GRASS_SHADE: '#2F7F2A', OVERHANG: '#4CA03E', SAND_HI: '#FBE6B0', SAND: '#F3D493', SAND_LO: '#EBC983', SAND_WET: '#D9AC66', SPECK: '#E2BE7C' },
  autumn: { GRASS: '#A8C457', GRASS_HI: '#C2D46E', FLECK_HI: '#D9C26A', FLECK_LO: '#8AA845', GRASS_SHADE: '#6F8A35', OVERHANG: '#90AA48', SAND_HI: '#FBE6B0', SAND: '#F3D493', SAND_LO: '#EBC983', SAND_WET: '#D9AC66', SPECK: '#E2BE7C' },
  winter: { GRASS: '#EEF3FC', GRASS_HI: '#FFFFFF', FLECK_HI: '#FFFFFF', FLECK_LO: '#C9D6EC', GRASS_SHADE: '#9FB2D6', OVERHANG: '#E4ECF8', SAND_HI: '#F6F0E2', SAND: '#EEE6D4', SAND_LO: '#E4DAC4', SAND_WET: '#CFC3AA', SPECK: '#D6CBB4' }
};
function defines(season: Season): string {
  const b = baseOf(season), p = PALETTES[b];
  return [...Object.entries(p).map(([k, v]) => `#define ${k} ${hex(v)}`), `#define WINTER ${b === 'winter' ? 1 : 0}`, `#define AUTUMN ${b === 'autumn' ? 1 : 0}`, `#define SPRING_S ${b === 'spring' ? 1 : 0}`, dressDefines(season)].join('\n');
}

// ---- the shader ---------------------------------------------------------------------------------------------------

const VERT = `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const LIB = /* glsl */ `
uniform vec2 uOrigin;   // world (x, z) at the canvas's bottom-left pixel corner
uniform float uPx;      // pixels per unit
uniform int uMode;      // 0 terrain, 4 the cliff's face
uniform vec2 uSize;     // sprite size in units
out vec4 outColor;

// ---- hashing and noise (integer hashes: deterministic) ----
uvec2 pcg2d(uvec2 v){ v = v*1664525u+1013904223u; v.x += v.y*1664525u; v.y += v.x*1664525u; v ^= v>>16u; v.x += v.y*1664525u; v.y += v.x*1664525u; v ^= v>>16u; return v; }
float h1(ivec2 c, int s){ return float(pcg2d(uvec2(c) ^ uvec2(uint(s)*0x9E3779B9u, uint(s+7)*0x85EBCA6Bu)).x) * (1.0/4294967296.0); }
vec2 h2(ivec2 c, int s){ return vec2(pcg2d(uvec2(c) ^ uvec2(uint(s)*0x9E3779B9u, uint(s+7)*0x85EBCA6Bu))) * (1.0/4294967296.0); }
float gn(vec2 p, int s){
  vec2 i = floor(p), q = p - i; ivec2 c = ivec2(i);
  vec2 u = q*q*q*(q*(q*6.0-15.0)+10.0);
  float a = 6.2831853*h1(c,s), b = 6.2831853*h1(c+ivec2(1,0),s), e = 6.2831853*h1(c+ivec2(0,1),s), d = 6.2831853*h1(c+ivec2(1,1),s);
  float va = dot(vec2(cos(a),sin(a)), q), vb = dot(vec2(cos(b),sin(b)), q-vec2(1,0));
  float vc = dot(vec2(cos(e),sin(e)), q-vec2(0,1)), vd = dot(vec2(cos(d),sin(d)), q-vec2(1,1));
  return 1.4*mix(mix(va,vb,u.x), mix(vc,vd,u.x), u.y);   // about -1..1
}
float fbm(vec2 p, int s, int oct){ float a = 0.5, t = 0.0, n = 0.0; mat2 R = mat2(0.8,0.6,-0.6,0.8); for (int i = 0; i < 6; i++){ if (i >= oct) break; t += a*gn(p, s+i*17); n += a; p = R*p*2.03; a *= 0.5; } return t/n; }
float sat(float x){ return clamp(x, 0.0, 1.0); }
float lum(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }
vec3 sat3(vec3 c, float k){ return mix(vec3(lum(c)), c, k); }

// Voronoi with the distance to the cell's border (IQ): x = border distance, y = centre distance, zw = cell id
vec4 voro(vec2 x, int s, float jit){
  vec2 n = floor(x), q = x - n, mg = vec2(0), mr = vec2(0); float md = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 g = vec2(i,j), o = 0.5 + (h2(ivec2(n+g), s) - 0.5)*jit, r = g + o - q; float d = dot(r,r);
    if (d < md){ md = d; mr = r; mg = g; }
  }
  float bd = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++){
    vec2 g = mg + vec2(i,j), o = 0.5 + (h2(ivec2(n+g), s) - 0.5)*jit, r = g + o - q;
    if (dot(mr-r, mr-r) > 1e-5) bd = min(bd, dot(0.5*(mr+r), normalize(r-mr)));
  }
  return vec4(bd, length(mr), n + mg);
}

float roundRect(vec2 p, vec4 r, float rad){
  vec2 c = 0.5*(r.xy + r.zw), h = 0.5*(r.zw - r.xy) - rad;
  vec2 q = abs(p - c) - h;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rad;
}
float boxD(vec2 p, vec2 c, vec2 h, float rad){ vec2 q = abs(p - c) - h + rad; return length(max(q,0.0)) + min(max(q.x,q.y),0.0) - rad; }
float ellD(vec2 p, vec4 e){ vec2 q = (p - e.xy)/e.zw; return (length(q) - 1.0)*min(e.z, e.w); }
float segD(vec2 p, vec4 s){ vec2 pa = p - s.xy, ba = s.zw - s.xy; float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0); return length(pa - ba*h); }
float aa(float d, float w){ return 1.0 - smoothstep(-w, w, d); }   // coverage of d < 0
`;

const TERRAIN = /* glsl */ `
float AAW;  // half a pixel in units

// ---- shapes ----
float landD(vec2 p){ return roundRect(p, LANDR, LAND_R) + 2.6*gn(p/46.0, 3) + 1.2*gn(p/15.0, 4); }
float grassD(vec2 p){ return roundRect(p, GRASSR, GRASS_R) + 2.2*gn(p/40.0, 5) + 0.9*gn(p/9.0, 6); }
float dirtD(vec2 p){ float d = 1e5; for (int i = 0; i < N_DIRT; i++) d = min(d, segD(p, DIRT[i])); return d; }

struct Riv { float s; float hw; float nz; float along; float across; vec2 n; };
Riv river(vec2 p){
  Riv r; r.s = 1e5; r.hw = 15.0; r.nz = 0.0; r.along = 0.0; r.across = 0.0; r.n = vec2(0.0, 1.0);
  for (int i = 0; i < N_RV - 1; i++){
    vec4 A = RV[i], Bv = RV[i+1];
    vec2 pa = p - A.xy, ba = Bv.xy - A.xy; float L2 = dot(ba,ba);
    float t = clamp(dot(pa,ba)/L2, 0.0, 1.0);
    vec2 v = pa - ba*t; float d = length(v), hw = 0.5*mix(A.z, Bv.z, t), e = d - hw;
    if (e < r.s){
      r.s = e; r.hw = hw; vec2 n = v/max(d, 1e-4); r.nz = n.y; r.n = n; r.along = mix(A.w, Bv.w, t);
      r.across = sign(ba.x*v.y - ba.y*v.x)*d;
    }
  }
  return r;
}

// ---- materials ----
// little NH leaf flecks: single blades and three-blade tufts, mostly pointing up the screen
float blade(vec2 q, float hw, float h){ // q: local, base at (0,0), apex at (0,h)
  float k = hw/h;
  return max(-q.y, (abs(q.x) - hw*(1.0 - q.y/h)) / sqrt(1.0 + k*k));
}
vec3 flecks(vec2 p, vec3 c, float cell, float dens, int seed){
  vec2 g = floor(p/cell);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    ivec2 id = ivec2(g) + ivec2(i,j);
    vec2 r = h2(id, seed);
    if (r.x > dens) continue;
    vec2 ctr = (vec2(id) + 0.2 + 0.6*h2(id, seed+1))*cell;
    vec2 q = p - ctr;
    float rr = h1(id, seed+2), size = (2.3 + 2.0*h1(id, seed+3));
    float ang = (rr - 0.5)*0.8;
    float cs = cos(ang), sn = sin(ang);
    vec2 lq = vec2(cs*q.x - sn*q.y, sn*q.x + cs*q.y);
    float d = blade(lq, 0.42*size*0.5, size);
    if (h1(id, seed+4) < 0.55){ // a tuft: two side blades
      float a2 = 0.62; vec2 l1 = vec2(cos(a2)*lq.x - sin(a2)*lq.y, sin(a2)*lq.x + cos(a2)*lq.y);
      vec2 l2 = vec2(cos(-a2)*lq.x - sin(-a2)*lq.y, sin(-a2)*lq.x + cos(-a2)*lq.y);
      d = min(d, blade(l1, 0.17*size, 0.7*size)); d = min(d, blade(l2, 0.17*size, 0.7*size));
    }
    vec3 fc = r.y < 0.68 ? FLECK_HI : FLECK_LO;
    // a hint of shading: the blade's left half lighter
    fc *= 1.0 + 0.06*sign(-lq.x);
    c = mix(c, fc, aa(d, AAW*1.2) * 0.9);
  }
  return c;
}
vec3 grassCol(vec2 p){
  vec2 w = p + 7.0*vec2(gn(p/34.0, 31), gn(p/34.0 + 9.0, 37));
  float m1 = fbm(w/80.0, 11, 4), m2 = fbm(w/26.0 + 3.1, 21, 3), m3 = gn(w/7.0, 41);
  vec3 c = GRASS;
#if WINTER
  c = mix(c, GRASS_HI, smoothstep(-0.1, 0.4, m1)*0.8);
  c = mix(c, GRASS_SHADE, smoothstep(0.0, 0.6, -m2)*0.28);
  c = mix(c, GRASS_SHADE, smoothstep(0.3, 0.75, gn(vec2(p.x/26.0, p.y/7.0), 43))*0.14); // wind drifts
  c = mix(c, vec3(1.0), smoothstep(0.35, 0.8, gn(vec2(p.x/20.0, p.y/6.0) + 3.0, 44))*0.5); // their lit crests
  c *= 1.0 + 0.018*m3 + 0.012*gn(p/1.2, 45);
  // glints in the snow
  vec2 g = floor(p/2.6); vec2 r = h2(ivec2(g), 47);
  if (r.x < 0.07){ vec2 q = p - (g + 0.25 + 0.5*h2(ivec2(g), 48))*2.6; c = mix(c, vec3(1.0), aa(length(q) - 0.3, AAW) * 0.9);
    c = mix(c, vec3(0.80,0.86,0.97), aa(length(q - vec2(0.35,-0.35)) - 0.25, AAW)*0.5*step(0.03, r.x)); }
  c = flecks(p, c, 11.0, 0.18, 53);
#else
  c = mix(c, GRASS_HI, smoothstep(-0.05, 0.42, m1)*0.7);
  c = mix(c, FLECK_LO, smoothstep(0.05, 0.5, -m2)*0.42);
  c = mix(c, GRASS_HI, smoothstep(0.2, 0.6, m3)*0.22);
  // short painterly strokes, slanted
  vec2 sp = mat2(0.94, 0.34, -0.34, 0.94)*p;
  c *= 1.0 + 0.05*gn(vec2(sp.x/1.2, sp.y/3.8), 61) + 0.03*gn(p/2.0, 62);
  c = flecks(p, c, 9.0, 0.6, 71);
  c = flecks(p + 4.5, c, 13.0, 0.35, 73);
#endif
  return c;
}

vec3 sandCol(vec2 p, float dL){
  vec3 c = mix(SAND_HI, SAND, smoothstep(-95.0, -40.0, dL));
  c = mix(c, SAND_LO, smoothstep(-34.0, -8.0, dL)*0.7);
  float m = fbm(p/24.0, 101, 3);
  c *= 1.0 + 0.035*m + 0.03*gn(p/0.9, 102);
  c *= 1.0 + 0.018*sin(p.y*0.75 + p.x*0.08 + 4.0*gn(p/14.0, 103)); // faint wind ripples
  // speckles: tan grains, a few light quartz ones
  vec2 g = floor(p/2.4); vec2 r = h2(ivec2(g), 105);
  if (r.x < 0.55){ vec2 q = p - (g + 0.2 + 0.6*h2(ivec2(g), 106))*2.4; float rad = 0.22 + 0.32*r.y;
    vec3 sc = h1(ivec2(g), 107) < 0.16 ? mix(SAND_HI, vec3(1.0), 0.6) : SPECK*0.97;
    c = mix(c, sc, aa(length(q) - rad, AAW)*0.6); }
  // tiny shells
  vec2 g2 = floor(p/19.0); vec2 r2 = h2(ivec2(g2), 111);
  if (r2.x < 0.22){
    vec2 q = p - (g2 + 0.2 + 0.6*h2(ivec2(g2), 112))*19.0; float a = 6.283*r2.y;
    q = mat2(cos(a), sin(a), -sin(a), cos(a))*q;
    float sz = 1.1 + 0.7*h1(ivec2(g2), 113);
    vec3 shc = h1(ivec2(g2), 114) < 0.5 ? vec3(0.98,0.90,0.86) : vec3(0.99,0.95,0.90);
    c = mix(c, c*vec3(0.86,0.80,0.70), aa(length((q - vec2(0.25,-0.3))*vec2(1.0,1.4)) - sz, AAW*2.0)*0.6);  // its shadow
    float fan = max(length(q) - sz, -q.y - 0.15*sz);
    float ribs = 0.5 + 0.5*cos(atan(q.x, q.y)*9.0);
    c = mix(c, shc*(0.92 + 0.08*ribs)*(1.0 + 0.06*q.y/sz), aa(fan, AAW));
  }
  return c;
}

// the sea from the land's edge outward (d: distance outside the land; negative inland = wet sand's start)
vec3 seaCol(vec2 p, float d){
  float dn = d + (2.0 + 0.05*max(d, 0.0))*fbm(p/30.0, 201, 3);
  vec3 sh = vec3(0.56,0.88,0.89);
  vec3 c = mix(vec3(0.62,0.90,0.88), vec3(0.494,0.867,0.902), smoothstep(10.0, 16.0, dn));       // shallow, sand showing
  c = mix(c, vec3(0.384,0.800,0.910), smoothstep(14.0, 32.0, dn));                                 // turquoise #62CCE8
  c = mix(c, vec3(0.298,0.702,0.914), smoothstep(30.0, 62.0, dn));                                 // mid #4CB3E9
  c = mix(c, vec3(0.247,0.604,0.894), smoothstep(62.0, 112.0, dn));                                // deep #3F9AE4
  c = mix(c, vec3(0.227,0.557,0.875), smoothstep(110.0, 190.0, dn));                               // open #3A8EDF
  c = mix(c, vec3(0.184,0.498,0.827), smoothstep(190.0, 330.0, dn));                               // open #2F7FD3
  // caustics over the sand in the shallows
  vec2 wq = p/7.0 + 0.6*vec2(gn(p/11.0, 211), gn(p/11.0 + 5.0, 212));
  vec4 vc = voro(wq, 213, 0.9);
  float caus = (1.0 - smoothstep(0.0, 0.09, vc.x)) * (1.0 - smoothstep(14.0, 40.0, dn)) * smoothstep(9.0, 13.0, dn);
  c = mix(c, vec3(0.86,0.98,0.97), caus*0.32);
  // a soft lighter crest band and two broken swell lines
  float l1 = (1.0 - smoothstep(0.0, 1.6, abs(dn - 22.0 - 1.5*gn(p/16.0, 221)))) * smoothstep(-0.1, 0.35, gn(p/9.0, 222));
  float l2 = (1.0 - smoothstep(0.0, 1.4, abs(dn - 41.0 - 2.0*gn(p/18.0, 223)))) * smoothstep(0.0, 0.4, gn(p/11.0, 224));
  c = mix(c, vec3(1.0), l1*0.38 + l2*0.24);
  // wave texture: long soft glints, more out at sea
  float wv = smoothstep(0.35, 0.75, gn(vec2(p.x/15.0, p.y/3.2) + 0.5*gn(p/40.0, 231), 232));
  c = mix(c, c*1.12 + 0.03, wv*0.35*smoothstep(25.0, 60.0, dn));
  float dk = smoothstep(0.3, 0.8, gn(vec2(p.x/22.0, p.y/5.0), 233));
  c *= 1.0 - 0.05*dk*smoothstep(40.0, 80.0, dn);
  return c;
}

// the shore: dry sand (handled by the caller) → wet sand → lacy foam → the sea
vec3 shoreCol(vec2 p, float dL, vec3 sandC, float noFoam){
  float dn = dL + 0.9*gn(p/7.0, 251) + 0.6*gn(p/2.5, 252);
  vec3 wet = mix(SAND_WET*1.04, SAND_WET*0.9, smoothstep(-6.0, 8.0, dn));
  wet *= 1.0 + 0.04*gn(p/1.2, 253);
  // the wet sand's sheen
  wet = mix(wet, mix(wet, vec3(1.0), 0.35), smoothstep(0.5, 0.85, gn(vec2(p.x/9.0, p.y/1.8), 254))*0.35*smoothstep(-2.0, 6.0, dn));
  vec3 c = mix(sandC, wet, smoothstep(-9.0, -4.5, dn));
  vec3 sea = seaCol(p, dL);
  c = mix(c, sea, smoothstep(7.0, 9.5, dn));
  // foam: a lacy band at +9, little bubbles on the sand side
  float fd = dn - 9.4 - 0.9*gn(p/5.0, 255);
  float lace = smoothstep(-0.25, 0.25, fbm(p/2.2, 256, 3) + 0.35 - 0.25*abs(fd));
  float band = 1.0 - smoothstep(0.6, 2.0, abs(fd));
  c = mix(c, vec3(1.0), band*lace*0.92*(1.0 - noFoam));
  vec2 g = floor(p/1.8); vec2 r = h2(ivec2(g), 257);
  float bub = aa(length(p - (g + 0.25 + 0.5*h2(ivec2(g), 258))*1.8) - 0.28 - 0.25*r.y, AAW) * step(r.x, 0.45) * (1.0 - smoothstep(1.0, 4.5, abs(dn - 6.0)));
  c = mix(c, vec3(1.0), bub*0.7*(1.0 - noFoam));
  return c;
}

// rivers, ponds: dark in the deep middle, lighter at the banks, soft sheen
// la: (distance along the flow, signed distance across it) in units
vec3 waterCol(vec2 p, float t, vec2 la){
  // shallows at the banks, the deep channel dark
  vec3 c = mix(vec3(0.55,0.84,0.93), vec3(0.30,0.64,0.90), smoothstep(0.0, 0.3, t));
  c = mix(c, vec3(0.20,0.50,0.83), smoothstep(0.25, 0.65, t));
  c = mix(c, vec3(0.11,0.34,0.66), smoothstep(0.6, 1.0, t));
  // the channel wanders a little inside the banks
  c *= 1.0 + 0.07*fbm(vec2(la.x/16.0, la.y/5.0), 301, 3) + 0.03*gn(p/2.5, 304);
#if WINTER
  c = sat3(c, 0.8)*0.97;
#endif
  vec2 flow = vec2(la.x/8.0, la.y/1.4);
  // flow marks: long soft streaks
  float st = smoothstep(0.45, 0.85, gn(flow, 302))*smoothstep(0.15, 0.55, t);
  c = mix(c, vec3(0.80,0.93,1.0), st*0.3);
  // ripples: soft chevrons bowed downstream, broken up
  float rp = fract((la.x + 0.035*la.y*la.y)/6.5 + 0.35*gn(p/10.0, 305));
  float rl = (1.0 - smoothstep(0.0, 0.07, abs(rp - 0.5)))*smoothstep(0.1, 0.5, gn(vec2(la.x/5.0, la.y/3.0), 306))*smoothstep(0.1, 0.4, t);
  c = mix(c, vec3(0.88,0.96,1.0), rl*0.45);
  c = mix(c, c*0.86, (1.0 - smoothstep(0.0, 0.08, abs(rp - 0.42)))*smoothstep(0.1, 0.5, gn(vec2(la.x/5.0, la.y/3.0), 306))*smoothstep(0.1, 0.4, t)*0.5);
  // soft specular glints, nearer the upper-left bank
  float sp = smoothstep(0.62, 0.92, gn(flow*vec2(2.2, 1.6) + 7.0, 303));
  c = mix(c, vec3(1.0), sp*0.4);
  float sky = smoothstep(0.3, 0.8, gn(vec2(la.x/22.0, la.y/9.0) + 3.0, 307))*smoothstep(0.2, 0.6, t);
  c = mix(c, mix(c, vec3(0.75,0.9,1.0), 0.35), sky*0.6);
  return c;
}
vec3 earthFace(vec2 p, float v, float along){ // the far bank's earth wall: v 0 at the water, 1 at the top
  vec3 c = mix(vec3(0.42,0.29,0.19), vec3(0.66,0.47,0.30), smoothstep(0.0, 0.9, v));
  c *= 1.0 + 0.10*gn(vec2(along/1.6, v*2.0), 311) + 0.05*gn(p/0.8, 312);
  c = mix(c, c*1.25, smoothstep(0.82, 1.0, v));   // its lit top edge
  return c;
}

// dirt: soft, irregular, worn, pebbles, encroaching tufts
vec3 dirtCol(vec2 p, float pd, float hw){
  float core = sat(-pd/hw);
  vec3 c = mix(vec3(0.79,0.62,0.40), vec3(0.86,0.72,0.50), smoothstep(0.15, 0.8, core));
  float m = fbm(p/9.0, 401, 4);
  c *= 1.0 + 0.09*m + 0.05*gn(p/1.4, 402) + 0.04*gn(p/0.6, 403);
  c = mix(c, vec3(0.71,0.54,0.34), smoothstep(0.2, 0.7, fbm(p/4.0 + 3.0, 404, 3))*0.45);  // darker patches
  c = mix(c, vec3(0.90,0.79,0.60), smoothstep(0.45, 0.8, gn(p/3.0, 405))*0.35*core);      // trodden lighter middle
  // specks
  vec2 g = floor(p/1.6); vec2 r = h2(ivec2(g), 406);
  if (r.x < 0.3) c = mix(c, c*0.8, aa(length(p - (g + 0.5)*1.6 - (h2(ivec2(g),407) - 0.5)) - 0.18 - 0.16*r.y, AAW)*0.6);
  // pebbles with a lit top-left and a shadow
  vec2 g2 = floor(p/5.0); vec2 r2 = h2(ivec2(g2), 408);
  if (r2.x < 0.26){
    vec2 q = p - (g2 + 0.25 + 0.5*h2(ivec2(g2), 409))*5.0; float a = 6.283*r2.y;
    q = mat2(cos(a), sin(a), -sin(a), cos(a))*q;
    float rad = 0.7 + 0.75*h1(ivec2(g2), 410);
    float tt = h1(ivec2(g2), 411);
    vec3 pc = mix(vec3(0.66,0.62,0.56), vec3(0.86,0.80,0.70), tt);
    pc = mix(pc, vec3(0.72,0.58,0.44), step(0.75, tt)*0.6);
    float shd = aa(length((q - vec2(0.35,-0.4))*vec2(1.0,1.4)) - rad, AAW*2.0);
    c = mix(c, c*0.7, shd*0.55);
    float pe = length(q*vec2(1.0,1.3)) - rad + 0.12*gn(q*2.0, 412);
    vec2 n = q/max(rad, 0.1);
    c = mix(c, pc*(1.0 + 0.25*dot(n, vec2(-0.6,0.6)) - 0.12*dot(n,n)), aa(pe, AAW));
  }
  // ambient occlusion under the grass edge
  c *= 1.0 - 0.15*smoothstep(-3.5, 0.0, pd);
  return c;
}
// light flagstones: a random-ashlar of big and small stones (12u cells split into one, two or four), varied tone,
// worn rounded corners, fine joints
vec3 flagCol(vec2 p, float s){
  float C = s*1.6;
  vec2 wp = p + 0.45*vec2(gn(p/5.0, 601), gn(p/5.0 + 4.0, 602));
  float cy = floor(wp.y/C);
  wp.x += mod(cy, 2.0)*0.5*C + 0.23*C*mod(cy, 3.0);
  vec2 cell = floor(wp/C), lc = wp - cell*C;
  ivec2 cid = ivec2(cell);
  float r = h1(cid, 620);
  vec2 lo = vec2(0.0), hi = vec2(C);
  int sub = 0;
  float sx = C*(0.36 + 0.28*h1(cid, 621)), sy = C*(0.36 + 0.28*h1(cid, 622));
  if (r > 0.22 && r < 0.52){ if (lc.x < sx){ hi.x = sx; sub = 1; } else { lo.x = sx; sub = 2; } }
  else if (r >= 0.52 && r < 0.8){ if (lc.y < sy){ hi.y = sy; sub = 3; } else { lo.y = sy; sub = 4; } }
  else if (r >= 0.8){ if (lc.x < sx) hi.x = sx; else lo.x = sx; if (lc.y < sy) hi.y = sy; else lo.y = sy; sub = 5 + int(lc.x >= sx) + 2*int(lc.y >= sy); }
  ivec2 id = cid*16 + ivec2(sub, sub*3);
  vec2 sz = hi - lo, ctr = 0.5*(lo + hi);
  float e = boxD(lc, ctr, sz*0.5 - 0.28, 0.5 + 1.1*h1(id, 613)) + 0.22*gn(p*1.3, 614) + 0.1*gn(p*4.0, 615);
  float t = h1(id, 604), t2 = h1(id, 605);
  vec3 c = mix(vec3(0.86,0.80,0.66), vec3(0.94,0.90,0.79), t);
  c = mix(c, vec3(0.83,0.81,0.76), step(0.8, t2)*0.75);    // greyer ones
  c = mix(c, vec3(0.91,0.80,0.63), step(t2, 0.12)*0.6);    // warmer ones
  c *= 1.0 + 0.05*gn(p/1.6 + vec2(id)*0.37, 606) + 0.035*gn(p/0.45, 607);
  vec2 n = (lc - ctr)/max(sz, vec2(1.0));
  c *= 1.0 + 0.15*smoothstep(-1.2, -0.05, e)*(n.y*1.4 - n.x*0.8);   // bevel
  c *= 1.0 + 0.05*(h1(id, 616) - 0.5);                               // each sits a little differently
  c = mix(c, c*0.88, smoothstep(0.55, 0.9, gn(p/0.9, 610))*0.3);     // pits
  vec3 joint = vec3(0.68,0.62,0.49)*(1.0 + 0.06*gn(p/0.6, 609));
  c = mix(joint, c, aa(e, AAW*1.3));
#if WINTER
  c = mix(c, vec3(0.95,0.96,1.0), smoothstep(0.1, 0.6, fbm(p/5.0, 617, 3) + 0.3*smoothstep(0.3, -0.2, e))*0.75);
#endif
  return c;
}

// the cliff face: v 0 at the foot, 1 at the top
vec3 cliffCol(vec2 p, float v){
  vec3 top = vec3(0.866,0.643,0.447), bot = vec3(0.604,0.392,0.235);
  vec3 c = mix(bot, top, smoothstep(0.0, 1.0, v));
  float xs = p.x;
  // strata: four layers, each lit on top and darker below, with a crease between
  float lv = v*4.0 + 0.22*gn(vec2(xs/26.0, 0.0), 701) + 0.08*gn(vec2(xs/6.0, v*3.0), 702);
  float k = floor(lv), fr = lv - k;
  c *= mix(0.84, 1.08, pow(fr, 0.7));
  c *= 1.0 + 0.05*(h1(ivec2(int(k), 0), 703) - 0.5);
  c = mix(c, c*0.62, (1.0 - smoothstep(0.0, 0.07, fr))*step(0.5, k));
  c = mix(c, c*1.16 + 0.03, smoothstep(0.86, 0.95, fr)*(1.0 - smoothstep(0.95, 1.0, fr)));
  // rock blocks: soft rounded masses split by a few cracks, vertical grooves
  vec4 vb = voro(vec2(xs/14.0, v*44.0/8.0 + k*0.37), 704, 0.75);
  float bt = h1(ivec2(vb.zw), 705);
  c *= 1.0 + 0.08*(bt - 0.5);
  c *= 1.0 - 0.10*smoothstep(0.1, 0.5, vb.y);                         // each mass rounded: lighter middle
  c = mix(c, c*0.74, (1.0 - smoothstep(0.0, 0.045, vb.x))*0.45*step(0.35, bt));
  c *= 1.0 + 0.08*gn(vec2(xs/1.8, v*44.0/9.0), 706) + 0.04*gn(p/0.7, 707);
  c = mix(c, c*1.1, smoothstep(0.5, 0.9, gn(vec2(xs/3.0, v*44.0/2.0), 708))*0.5);   // sunlit chips
  // occlusion at the foot and under the grass lip
  c *= 1.0 - 0.25*(1.0 - smoothstep(0.0, 0.16, v));
  return c;
}
vec3 stoneCol(vec2 p, vec3 base){ return base*(1.0 + 0.07*gn(p/1.2, 801) + 0.04*gn(p/0.4, 802) + 0.05*fbm(p/5.0, 803, 2)); }

float shadowAt(vec2 p){
  float lit = 1.0;
  for (int i = 0; i < N_SHADOW; i += 2){
    vec4 e = SHADOW[i]; float a = SHADOW[i+1].x;
    vec2 q = (p - e.xy)/e.zw; float r = length(q);
    if (r < 1.2) lit *= 1.0 - a*pow(1.0 - smoothstep(0.15, 1.05, r), 1.4);
  }
  for (int i = 0; i < N_BLD; i++){
    vec4 b = BLD[i];
    float d = boxD(p, vec2(b.x + 3.0, b.y + b.w*0.5 - 2.0), vec2(b.z + 2.0, b.w*0.5 + 1.0), 8.0);
    lit *= 1.0 - 0.55*(1.0 - smoothstep(-8.0, 5.0, d));
    float cd = boxD(p, vec2(b.x + 4.0, b.y), vec2(b.z*0.92, 2.5), 2.5);   // contact at the door line
    lit *= 1.0 - 0.35*(1.0 - smoothstep(-2.0, 3.0, cd));
  }
  return 1.0 - lit;
}

vec3 rockBlob(vec2 p, vec2 c0, vec2 r, vec3 col, vec3 base, int seed){
  vec2 q = (p - c0)/r; float d = (length(q) - 1.0 + 0.12*gn(q*2.5, seed))*min(r.x, r.y);
  float sd = (length((p - c0 - vec2(0.5*r.x*0.4, -0.5*r.y*0.6))/r) - 1.0)*min(r.x, r.y);
  base = mix(base, base*0.6, aa(sd, 1.2)*0.6);
  vec3 rc = col*(1.0 + 0.32*dot(q, vec2(-0.55,0.7)) + 0.06*gn(p/0.8, seed+1));
#if WINTER
  rc = mix(rc, vec3(0.97,0.98,1.0), smoothstep(0.1, 0.5, q.y + 0.15*gn(p, seed+2)));
#else
  rc = mix(rc, vec3(0.38,0.58,0.28), smoothstep(0.45, 0.9, q.y + 0.25*gn(p*0.8, seed+2))*0.55);  // moss
#endif
  return mix(base, rc, aa(d, AAW*1.5));
}

vec3 terrain(vec2 p){
  float dL = landD(p);
  Riv rv = river(p);
  float isMouth = step(378.0, p.x)*step(p.y, 790.0);
  // ---- beach and sea
  vec3 c;
  if (dL > 14.0) c = seaCol(p, dL);
  else c = shoreCol(p, dL, sandCol(p, dL), aa(rv.s - 3.0, 4.0)*isMouth);

  // ---- the river mouth fans into the shallows
  if (dL > -8.0 && p.x > 410.0){
    float fan = (1.0 - smoothstep(-4.0, 30.0, rv.s + 0.6*fbm(p/9.0, 941, 2)*10.0)) * isMouth * smoothstep(0.0, 14.0, dL) * (1.0 - smoothstep(60.0, 120.0, dL));
    c = mix(c, vec3(0.50,0.86,0.89), fan*0.4);
  }

  // ---- grass, with its lip
  float dG = grassD(p);
  float dGj = dG + 0.55*gn(p/1.3, 7) + 0.35*gn(p/0.55, 8);
  float aG = aa(dGj, AAW*1.2);
  c *= 1.0 - 0.16*smoothstep(4.5, 0.0, dG)*(1.0 - aG);     // sand darkens at the grass's foot
  vec3 g = grassCol(p);
#if WINTER
  g = mix(g, g*vec3(0.90,0.93,0.99), smoothstep(-3.0, 0.0, dGj));   // the snow's soft lip
#else
  g = mix(g, g*0.86, smoothstep(-3.0, 0.0, dGj));          // the lip
#endif
  c = mix(c, g, aG);

  // ---- dirt paths (fading into the sand at the beach end) and the campsite's worn patch
  float dd = dirtD(p);
  float pd = dd - 12.0 + 2.4*fbm(p/9.0, 921, 2) + 1.1*gn(p/3.0, 922) + 0.55*gn(p/1.1, 920) + 0.25*gn(p/0.45, 919);
  float ca = boxD(p, AP_CA.xy, AP_CA.zw, 16.0) + 3.0*fbm(p/9.0, 923, 2) + 1.1*gn(p/3.0, 922) + 0.55*gn(p/1.1, 920);
  float hw = 12.0;
  if (ca < pd){ pd = ca; hw = 18.0; }
  if (pd < 5.0){
    float onG = smoothstep(4.0, -6.0, dG);
    c = mix(c, c*0.86, smoothstep(2.2, 0.0, pd)*(1.0 - aa(pd, AAW))*onG);   // the grass's shade at the edge
    vec3 dc = dirtCol(p, pd, hw);
#if WINTER
    dc = mix(dc, vec3(0.95,0.96,1.0), smoothstep(0.1, 0.6, fbm(p/5.0, 924, 3) + 0.25*smoothstep(-5.0, 0.0, pd))*0.7);
#endif
    float a = aa(pd, AAW);
    // crumbs of earth and pebbles scattered into the grass beside it
    vec2 cg = floor(p/1.9); vec2 cr = h2(ivec2(cg), 917);
    float crumb = aa(length(p - (cg + 0.25 + 0.5*h2(ivec2(cg), 916))*1.9) - 0.3 - 0.35*cr.y, AAW)*step(cr.x, 0.5)*(1.0 - smoothstep(0.0, 3.0, pd))*step(0.0, pd);
    c = mix(c, mix(dc, vec3(0.62,0.50,0.36), 0.4), crumb*onG*0.85);
    // grass tufts encroaching over the edge
    vec2 gq = floor(p/2.3); vec2 r = h2(ivec2(gq), 925);
    vec2 lq = p - (gq + 0.2 + 0.6*h2(ivec2(gq), 926))*2.3;
    float th = 2.4 + 2.0*r.y;
    float tuft = aa(min(blade(lq, 0.6, th), min(blade(vec2(lq.x*0.82 - 0.55*lq.y*0.5 - 0.5, lq.y), 0.42, th*0.72), blade(vec2(lq.x*0.82 + 0.55*lq.y*0.5 + 0.5, lq.y), 0.42, th*0.72))), AAW);
    float tz = step(r.x, 0.78)*smoothstep(-4.5, -1.4, pd);
    dc = mix(dc, dc*0.72, aa(min(blade(lq - vec2(0.45,-0.45), 0.6, th), 9.0), AAW*2.0)*tz*0.45);
    dc = mix(dc, mix(GRASS, GRASS_HI, 0.3 + 0.4*r.y)*(0.88 + 0.12*lq.y/th), tuft*tz*onG);
    c = mix(c, dc, a*smoothstep(14.0, 2.0, dG));
  }

  // ---- water: the river (not over the cliff), the pond, the spring
  float inCliff = step(CLIFFR.y, p.y)*step(p.y, CLIFFR.w);
  // natural banks: each bank meanders on its own, the width breathes, small bites; held within ±3.8u of world.ts
  float bank = sign(rv.across + 1e-3);
  float wob = 1.9*gn(vec2(rv.along/24.0, bank*7.0), 950) + 0.9*gn(vec2(rv.along/8.0, bank*7.0 + 3.0), 949)
            + 1.0*gn(vec2(rv.along/45.0, 0.5), 948) + 0.5*gn(p/2.2, 952) + 0.25*gn(p/0.9, 947);
  float ws = rv.s + clamp(wob, -3.8, 3.8);
  float nz = rv.nz, depthT = sat(-ws/(rv.hw + 1.0)*1.25), hwB = rv.hw;
  vec2 nrm = rv.n;
  vec2 la = vec2(rv.along, rv.across);
  float pondS = ellD(p, POND) + 2.4*gn(p/15.0, 958) + 1.3*gn(p/9.0, 953) + 0.4*gn(p/2.2, 946), sprS = ellD(p, SPRING) + 1.3*gn(p/9.0, 954) + 0.4*gn(p/2.2, 945);
  if (inCliff > 0.5) ws = 1e5;
  if (pondS < ws){ ws = pondS; vec2 q = (p - POND.xy)/(POND.zw*POND.zw); nrm = normalize(q); nz = nrm.y; depthT = sat(-pondS/POND.w*1.25); la = vec2(p.x, p.y - POND.y); hwB = POND.w; }
  if (sprS < ws){ ws = sprS; vec2 q = (p - SPRING.xy)/(SPRING.zw*SPRING.zw); nrm = normalize(q); nz = nrm.y; depthT = sat(-sprS/SPRING.w*1.25); la = vec2(p.x, p.y - SPRING.y); hwB = SPRING.w; }
  float onLandW = max(smoothstep(4.0, -4.0, dL), isMouth*(1.0 - smoothstep(20.0, 70.0, dL)));
  if (ws < 7.0 && onLandW > 0.0){
    float bankGrass = aa(dG + 6.0, 4.0);  // grassy banks have earth faces; the beach's are wet sand
    float seaT = smoothstep(-4.0, 40.0, dL)*isMouth;
    // the damp bank outside the water: darker, wetter ground
    float damp = (1.0 - smoothstep(0.0, mix(5.0, 4.5, bankGrass), ws + 1.2*gn(p/2.4, 956)))*(1.0 - seaT);
    vec3 dampC = mix(mix(c, SAND_WET*0.94, 0.75), c*vec3(0.72,0.82,0.70), bankGrass);
    c = mix(c, dampC, damp*0.8);
    // a muddy wet strip of irregular width at the water's edge, glistening here and there
    float mw = 0.5 + 1.9*sat(0.5 + 0.8*gn(p/6.0, 962));
    float mud = (1.0 - smoothstep(mw - 0.5, mw + 0.3, ws))*bankGrass*(1.0 - seaT)*(1.0 - smoothstep(0.2, 0.5, nz))*sat(0.35 + smoothstep(-0.3, 0.3, gn(p/5.0, 967)));
    vec3 mudC = mix(vec3(0.40,0.30,0.20), vec3(0.55,0.42,0.28), smoothstep(0.0, mw, ws))*(1.0 + 0.1*gn(p/1.1, 963));
    mudC = mix(mudC, vec3(0.80,0.85,0.85), smoothstep(0.55, 0.9, gn(p/1.4, 964))*0.35);
    c = mix(c, mudC, mud*0.9);
    c = mix(c, vec3(1.0), (1.0 - smoothstep(0.0, 1.0, abs(ws - 0.8 - 0.5*gn(p/3.0, 960))))*(1.0 - bankGrass)*(1.0 - seaT)*0.5*smoothstep(-0.2, 0.4, gn(p/2.0, 961)));
    vec3 wc = waterCol(p, depthT, la);
    // toward the mouth the river takes the sea's shallow colours, then the sea's own
    float mouth = smoothstep(415.0, 465.0, p.x)*isMouth;
    wc = mix(wc, mix(vec3(0.38,0.78,0.90), vec3(0.52,0.86,0.89), 1.0 - depthT), mouth*0.7);
    if (seaT > 0.0) wc = mix(wc, seaCol(p, max(dL, 10.0)), seaT);
    // near banks: a shadow strip under the grass lip; far banks: the earth face, its grass hanging over
    float fh = (4.6 + 1.8*gn(vec2((la.x + p.x)/7.0, 0.0), 957))*smoothstep(0.25, 0.85, nz)*bankGrass;
    wc *= 1.0 - 0.28*(1.0 - smoothstep(0.0, 3.0, -ws))*(1.0 - smoothstep(-0.2, 0.3, nz))*bankGrass;
    wc = mix(wc, wc*0.78, (1.0 - smoothstep(fh, fh + 3.0, -ws))*step(0.01, fh));        // the face's shadow on the water
    wc = mix(wc, vec3(0.80,0.93,0.97), (1.0 - smoothstep(0.0, 0.8, abs(-ws - fh + 0.2)))*step(0.6, fh)*0.6); // waterline
    float fA = aa(-ws - fh, AAW*1.5)*step(0.6, fh);
    float fv = sat((ws + fh)/max(fh, 0.1));
    vec3 face = earthFace(p, fv, la.x + p.x);
    float tq = floor((p.x + p.y*0.3)/1.5); float tlen = (0.6 + 1.5*h1(ivec2(int(tq), 5), 959))*(1.0 - abs(fract((p.x + p.y*0.3)/1.5) - 0.5)*2.0);
    float hangG = aa(-ws - tlen - 0.4, AAW);
    face = mix(face, mix(OVERHANG, GRASS, 0.4)*0.92, sat(hangG)*step(0.6, fh));
    wc = mix(wc, face, fA);
    float wa = aa(ws, AAW*1.5);
    c = mix(c, wc, wa*onLandW*(1.0 - smoothstep(0.3, 1.0, seaT)));
    // grass tufts rooted on the bank, leaning out over the water (with their shadow on it)
    if (bankGrass > 0.01 && ws > -3.5 && ws < 1.2){
      vec2 tg = floor(p/2.3);
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
        ivec2 id = ivec2(tg) + ivec2(i, j);
        vec2 r = h2(id, 965);
        vec2 ctr = (vec2(id) + 0.2 + 0.6*h2(id, 966))*2.3;
        vec2 q = p - ctr;
        vec2 dir = normalize(-nrm + vec2((r.y - 0.5)*0.9, 0.0));   // out over the water
        vec2 lq = vec2(dir.y*q.x - dir.x*q.y, dir.x*q.x + dir.y*q.y);
        float th = 2.0 + 1.8*r.y;
        float bl = min(blade(lq, 0.55, th), min(blade(vec2(lq.x - 0.45*lq.y*0.5 - 0.4, lq.y), 0.38, th*0.75), blade(vec2(lq.x + 0.45*lq.y*0.5 + 0.4, lq.y), 0.38, th*0.75)));
        float rootOk = step(r.x, 0.75)*(1.0 - smoothstep(0.4, 1.6, abs(ws - dot(q, nrm) - 0.3)));
        float shd = aa(min(blade(lq - vec2(0.5, 0.6), 0.6, th), 9.0), AAW*2.0)*rootOk*wa;
        c = mix(c, c*0.7, shd*0.45);
        c = mix(c, mix(GRASS, GRASS_HI, 0.25 + 0.5*r.y)*(0.82 + 0.18*sat(lq.y/th)), aa(bl, AAW)*rootOk);
      }
    }
  }
  // reeds in clumps at the pond's edge (its far and west banks): long slanted blades, a few cattails
  {
    float pe = ellD(p, POND) + 2.4*gn(p/15.0, 958) + 1.3*gn(p/9.0, 953);
    float side = smoothstep(-0.3, 0.4, (p.y - POND.y)/POND.w*0.7 - (p.x - POND.x)/POND.z*0.6);
    float clump = smoothstep(-0.35, 0.25, gn(p/10.0, 1601))*(0.3 + 0.7*side);
    if (pe > -4.0 && pe < 4.0 && clump > 0.0){
      vec2 rg = floor(p/1.7);
      for (int j = -2; j <= 0; j++) for (int i = -1; i <= 1; i++){
        ivec2 id = ivec2(rg) + ivec2(i, j);
        vec2 r = h2(id, 1602);
        vec2 root = (vec2(id) + 0.2 + 0.6*h2(id, 1603))*1.7;
        float rp = ellD(root, POND) + 2.4*gn(root/15.0, 958) + 1.3*gn(root/9.0, 953);
        if (r.x > 0.8*clump || rp < -2.5 || rp > 2.0) continue;
        float ln = 5.0 + 4.0*r.y, ang = (h1(id, 1604) - 0.5)*0.6;
        vec2 lq = mat2(cos(ang), sin(ang), -sin(ang), cos(ang))*(p - root);
        float bd = blade(lq, 0.62, ln);
        c = mix(c, c*0.68, aa(blade(lq - vec2(0.7, 0.9), 0.5, ln), AAW*2.0)*0.35);      // its shade
        vec3 rc = mix(vec3(0.30,0.52,0.22), vec3(0.52,0.72,0.32), sat(lq.y/ln))*(0.9 + 0.2*h1(id, 1605));
#if WINTER
        rc = mix(rc, vec3(0.62,0.58,0.42), 0.6);
#endif
        c = mix(c, rc, aa(bd, AAW));
        if (h1(id, 1606) < 0.28){ // a cattail: a brown head on the blade
          float hd = length((lq - vec2(0.0, ln*0.8))*vec2(1.0, 0.42)) - 0.85;
          c = mix(c, mix(vec3(0.42,0.27,0.15), vec3(0.58,0.38,0.22), sat(lq.x + 0.5)), aa(hd, AAW));
        }
      }
    }
  }
  // rocks around the spring
  c = rockBlob(p, SPRING.xy + vec2(-26.0, 14.0), vec2(5.0, 3.6), vec3(0.62,0.62,0.60), c, 961);
  c = rockBlob(p, SPRING.xy + vec2(22.0, 16.0), vec2(4.0, 3.0), vec3(0.64,0.63,0.60), c, 962);
  c = rockBlob(p, SPRING.xy + vec2(31.0, 6.0), vec2(3.0, 2.2), vec3(0.60,0.60,0.58), c, 963);

  // ---- the cliff face, the stairs and the waterfall's rocks
  float lip = CLIFFR.w - 3.0 - 2.2*abs(sin(p.x*0.31 + 2.0*gn(vec2(p.x/9.0, 1.0), 971))) - 0.8*gn(vec2(p.x/2.0, 2.0), 972);
  float foot = CLIFFR.y + 0.9*gn(vec2(p.x/5.0, 3.0), 973);
  float cliffX = aa(dG, 0.6);
  if (p.y > CLIFFR.y - 16.0 && p.y < CLIFFR.w + 2.0 && cliffX > 0.0){
    // the soft shadow at its foot (on the lower grass)
    float fs = sat((p.y - (CLIFFR.y - 14.0))/14.0);
    c = mix(c, c*vec3(0.62,0.72,0.62), pow(fs, 2.0)*0.55*step(p.y, foot)*cliffX);
    float v = sat((p.y - CLIFFR.y)/(CLIFFR.w - CLIFFR.y));
    vec3 cc = cliffCol(p, v);
    cc *= 1.0 - 0.32*smoothstep(lip - 5.0, lip, p.y);        // under the lip
#if WINTER
    float k = v*4.0 + 0.22*gn(vec2(p.x/26.0, 0.0), 701);
    cc = mix(cc, vec3(0.94,0.96,1.0), smoothstep(0.9, 0.97, fract(k))*0.8*step(0.5, floor(k)));
    cc = sat3(cc, 0.8);
#endif
    float inFace = step(foot, p.y)*step(p.y, lip);
    // the waterfall's notch: wet dark rock (the sheet is a live sprite)
    float fx = smoothstep(FALL.x - 1.0, FALL.x + 1.5, p.x)*smoothstep(FALL.y + 1.0, FALL.y - 1.5, p.x);
    vec3 wet = vec3(0.27,0.33,0.38)*(1.0 + 0.25*gn(vec2(p.x/1.2, p.y/9.0), 974)) + vec3(0.3,0.45,0.55)*smoothstep(0.55, 0.9, gn(vec2(p.x/0.9, p.y/6.0), 975))*0.5;
    cc = mix(cc, wet, fx);
    // the stairs: side walls and eight stone steps
    float su = p.x - STAIR.x, sw = STAIR.y - STAIR.x;
    if (su > -1.0 && su < sw + 1.0){
      float side = min(su, sw - su);
      float sv = (p.y - CLIFFR.y)/(CLIFFR.w - CLIFFR.y)*6.0;
      float k = floor(sv), fr = sv - k;
      ivec2 sid = ivec2(int(k), int(floor((su + 9.0*h1(ivec2(int(k),1), 981))/17.0)));
      vec3 slab = mix(vec3(0.70,0.69,0.65), vec3(0.79,0.78,0.73), h1(sid, 982));
      float tread = smoothstep(0.33, 0.39, fr);
      vec3 sc = mix(slab*0.58, slab*mix(1.1, 0.96, sat((fr - 0.4)/0.6)), tread);
      sc = mix(sc, slab*1.28, smoothstep(0.37, 0.41, fr)*(1.0 - smoothstep(0.44, 0.5, fr)));  // the nose's highlight
      sc *= 1.0 - 0.25*(1.0 - smoothstep(0.0, 0.1, fr));                                        // shade where it meets the tread below
      sc *= 1.0 - 0.12*smoothstep(0.85, 1.0, fr);                                                // the next riser's shade on the tread
      float jx = fract((su + 9.0*h1(ivec2(int(k),1), 981))/17.0);
      sc = mix(sc*0.66, sc, smoothstep(0.0, 0.025, jx)*smoothstep(1.0, 0.975, jx));
      sc = stoneCol(p, sc);
#if WINTER
      sc = mix(sc, vec3(0.95,0.97,1.0), tread*smoothstep(0.0, 0.5, gn(p/2.5, 983) + 0.3)*0.85);
#else
      sc = mix(sc, vec3(0.42,0.6,0.32), smoothstep(0.55, 0.9, gn(p/1.6, 984))*(1.0 - smoothstep(0.0, 0.05, jx)*smoothstep(1.0, 0.95, jx) + 0.3)*0.4);
#endif
      // side walls: ashlar blocks
      vec2 wb = vec2(su < sw*0.5 ? su : sw - su, p.y - CLIFFR.y);
      float brow = floor(wb.y/6.0);
      vec3 wall = mix(vec3(0.62,0.61,0.57), vec3(0.70,0.69,0.64), h1(ivec2(int(brow), int(su < sw*0.5)), 985));
      wall *= 1.0 + 0.15*(1.0 - smoothstep(0.0, 1.2, wb.x - 3.6))*0.0 + 0.12*smoothstep(4.6, 2.8, wb.x)*smoothstep(1.8, 3.0, wb.x);
      wall = mix(wall*0.7, wall, smoothstep(0.0, 0.08, fract(wb.y/6.0)));
      wall = stoneCol(p, wall);
      sc = mix(sc, wall, 1.0 - smoothstep(4.0, 4.6, side));
      float sa = aa(-side, 0.5);
      cc = mix(cc, sc, sa);
      cc = mix(cc, cc*0.75, (1.0 - sa)*(1.0 - smoothstep(0.0, 2.5, -side)));   // occlusion beside them
    }
    c = mix(c, cc, inFace*cliffX);
    // the grass lip on top, with drooping tufts
    vec3 og = mix(OVERHANG, GRASS, 0.3)*(1.0 + 0.06*gn(p/1.5, 976));
    og = mix(og*0.82, og*1.08, smoothstep(lip, lip + 3.0, p.y));
#if WINTER
    og = mix(vec3(0.82,0.87,0.96), vec3(1.0), smoothstep(lip, lip + 2.0, p.y));
#endif
    vec2 tq = floor(vec2(p.x/1.6, 0.0)); float th = h1(ivec2(tq), 977);
    float tl = (lip - p.y) - (1.0 + 2.0*th)*(1.0 - abs(fract(p.x/1.6) - 0.5)*2.0);
    float hang = step(p.y, lip)*step(tl, 0.0)*step(0.5, h1(ivec2(tq), 978));
    float topA = step(lip, p.y) + hang;
    float stairCut = 1.0 - (step(STAIR.x + 3.0, p.x)*step(p.x, STAIR.y - 3.0));
    float fallCut = 1.0 - fx;
    c = mix(c, og, sat(topA)*step(p.y, CLIFFR.w + 0.6)*cliffX*stairCut*fallCut);
    // stone landings at the stairs' top and foot
  }
  // the waterfall's foot: churning foam and boulders
  if (abs(p.x - 0.5*(FALL.x + FALL.y)) < 34.0 && abs(p.y - CLIFFR.y) < 20.0){
    vec2 fc = vec2(0.5*(FALL.x + FALL.y), CLIFFR.y - 2.0);
    float fd = ellD(p, vec4(fc, 19.0, 7.5)) + 2.2*fbm(p/4.0, 991, 3);
    float lace = smoothstep(-0.45, 0.25, fbm(p/2.4, 992, 3) + 0.5 + 0.06*fd);
    vec3 foamC = mix(vec3(0.80,0.92,0.98), vec3(1.0), lace);
    c = mix(c, c*0.8, (1.0 - smoothstep(0.0, 4.0, fd))*0.4*step(p.y, CLIFFR.y + 1.0));
    c = mix(c, foamC, aa(fd, 1.4)*(0.55 + 0.45*lace)*step(p.y, CLIFFR.y + 1.0));
    c = rockBlob(p, vec2(FALL.x - 6.0, CLIFFR.y - 1.0), vec2(6.5, 4.2), vec3(0.55,0.56,0.56), c, 993);
    c = rockBlob(p, vec2(FALL.y + 5.0, CLIFFR.y - 2.0), vec2(5.5, 3.8), vec3(0.58,0.58,0.57), c, 994);
    c = rockBlob(p, vec2(FALL.x + 3.0, CLIFFR.y - 10.0), vec2(3.0, 2.0), vec3(0.55,0.56,0.56), c, 995);
  }
  // landings at the stairs
  {
    float l1 = boxD(p, vec2(0.5*(STAIR.x+STAIR.y), CLIFFR.y - 4.0), vec2(0.5*(STAIR.y-STAIR.x) + 1.0, 4.0), 2.0) + 0.4*gn(p/2.0, 996);
    float l2 = boxD(p, vec2(0.5*(STAIR.x+STAIR.y), CLIFFR.w + 4.0), vec2(0.5*(STAIR.y-STAIR.x) - 1.0, 4.0), 2.0) + 0.4*gn(p/2.0, 997);
    float l = min(l1, l2);
    if (l < 3.0){ c = mix(c, c*0.8, (1.0 - smoothstep(0.0, 2.5, l))); c = mix(c, sat3(flagCol(p, 5.0), 0.3)*0.9, aa(l, AAW)); }
  }

  // ---- the seasonal dressing (terrain-seasons.ts): petals, leaves, clover, tufts, the snow's drifts and banks
  c = dress(p, c, dL, dG, aG, pd, ws);

  // ---- contact shadows (light from the upper left)
  float sa = shadowAt(p);
  vec3 tint = mix(vec3(0.70,0.62,0.50), vec3(0.50,0.66,0.47), aG);
#if WINTER
  tint = vec3(0.70,0.78,0.93);
#endif
  c = mix(c, c*tint, sa*0.9);

  // ---- a painterly breath of light over the land
  c *= 1.0 + 0.035*fbm(p/120.0, 1101, 2)*smoothstep(4.0, -4.0, dL);
  return c;
}

// ---- sprites ----
vec4 cliffFace(vec2 u){
  float W = uSize.x, H = uSize.y;
  float stL = STAIR.x + 12.0, stR = STAIR.y + 12.0, fL = FALL.x - 1.0 + 12.0, fR = FALL.y + 1.0 + 12.0;
  // the top edge: the grass lip's silhouette, scalloped, with blades sticking up
  float scal = abs(sin(u.x*0.29 + 2.0*gn(vec2(u.x/9.0, 1.0), 1501)));
  float topY = H - 0.5 - 0.7*scal + 0.5*gn(vec2(u.x/1.3, 2.0), 1502);
  float lipY = topY - 4.2 - 1.6*scal - 0.7*gn(vec2(u.x/2.2, 3.0), 1503);
  // the ends round off into the beach
  float endD = min(u.x, W - u.x);
  topY -= 6.0*(1.0 - smoothstep(0.0, 7.0, endD));
  float inStair = step(stL, u.x)*step(u.x, stR);
  float inFall = smoothstep(fL - 0.5, fL + 0.5, u.x)*smoothstep(fR + 0.5, fR - 0.5, u.x);
  if (inStair > 0.5) topY = H - 0.6;   // the stairs' top landing is flush with the tier
  float a = aa(u.y - topY, 0.12);
  // ---- rock: four strata, each lit on its top ledge and darker below, rounded masses, grooves, chips
  float v = sat(u.y/max(lipY, 1.0));
  vec3 c = mix(vec3(0.60,0.39,0.24), vec3(0.87,0.65,0.45), smoothstep(0.0, 1.0, v));
  float lv = v*3.0 + 0.32*gn(vec2(u.x/30.0, 0.0), 701) + 0.12*gn(vec2(u.x/7.0, v*3.0), 702);
  float k = floor(lv), fr = lv - k;
  c *= mix(0.82, 1.06, pow(fr, 0.75));
  // NH's cliffs are scored top to bottom: rounded vertical ribs and grooves, lit on their left flanks
  float rib = gn(vec2(u.x/3.4, u.y/40.0 + k*1.7), 1550) + 0.5*gn(vec2(u.x/1.6, u.y/18.0), 1551);
  float ribd = gn(vec2((u.x + 0.6)/3.4, u.y/40.0 + k*1.7), 1550) - gn(vec2((u.x - 0.6)/3.4, u.y/40.0 + k*1.7), 1550);
  c *= 1.0 + 0.10*rib - 0.22*ribd;
  c = mix(c, c*0.62, smoothstep(0.55, 0.85, -rib)*0.55);                        // the deep grooves
  c *= 1.0 + 0.06*(h1(ivec2(int(k), 0), 703) - 0.5);
  c = mix(c, c*0.6, (1.0 - smoothstep(0.0, 0.07, fr))*step(0.5, k)*smoothstep(-0.3, 0.3, gn(vec2(u.x/14.0, k), 1552)));   // broken creases between layers
  c = mix(c, c*1.22 + 0.04, smoothstep(0.88, 0.95, fr)*(1.0 - smoothstep(0.97, 1.0, fr))*smoothstep(-0.2, 0.3, gn(vec2(u.x/10.0, k), 1553)));   // a ledge catching the light
  vec4 vb = voro(vec2(u.x/13.0, u.y/6.0 + k*0.37), 1504, 0.75);
  float bt = h1(ivec2(vb.zw), 1505);
  c *= 1.0 + 0.09*(bt - 0.5);
  c *= 1.0 - 0.12*smoothstep(0.1, 0.5, vb.y);
  c = mix(c, c*0.7, (1.0 - smoothstep(0.0, 0.05, vb.x))*0.5*step(0.35, bt));
  c *= 1.0 + 0.09*gn(vec2(u.x/1.7, u.y/7.0), 1506) + 0.05*gn(u/0.6, 1507);
  c = mix(c, c*1.12, smoothstep(0.5, 0.9, gn(vec2(u.x/3.0, u.y/1.6), 1508))*0.5);
  c *= 0.96 + 0.06*smoothstep(W, 0.0, u.x);                                        // the light from the left
  c *= 1.0 - 0.3*(1.0 - smoothstep(0.0, 3.5, u.y));                                // its foot in shade
  c *= 1.0 - 0.35*smoothstep(lipY - 5.0, lipY, u.y);                               // under the grass lip
  c *= 1.0 - 0.3*(1.0 - smoothstep(0.0, 6.0, endD));                                // turning away at the ends
#if WINTER
  c = mix(c, vec3(0.95,0.97,1.0), smoothstep(0.88, 0.95, fr)*(1.0 - smoothstep(0.98, 1.0, fr))*0.85*step(0.5, k));
  c = sat3(c, 0.82);
#else
  c = mix(c, vec3(0.42,0.56,0.28), smoothstep(0.55, 0.9, gn(u/1.8, 1509))*smoothstep(0.84, 0.95, fr)*0.5);  // moss on ledges
#endif
  // ---- the waterfall's niche: wet dark rock, recessed (the live sheet covers its middle)
  if (inFall > 0.0){
    float nx = (u.x - fL)/(fR - fL);
    vec3 wet = vec3(0.24,0.29,0.33)*(1.0 + 0.3*gn(vec2(u.x/1.1, u.y/8.0), 1510)) + vec3(0.25,0.4,0.5)*smoothstep(0.55, 0.9, gn(vec2(u.x/0.8, u.y/5.0), 1511))*0.6;
    wet *= 0.75 + 0.35*smoothstep(0.0, 0.25, nx)*smoothstep(1.0, 0.75, nx);         // the niche's walls in shade
    wet = mix(wet, vec3(0.35,0.5,0.32), smoothstep(0.6, 0.9, gn(u/1.5, 1512))*(1.0 - smoothstep(0.1, 0.25, min(nx, 1.0 - nx)))*0.6);
    c = mix(c, wet, inFall);
  }
  // ---- the stairs: side walls and six stone steps going up the face
  if (inStair > 0.5){
    float su = u.x - stL, sw = stR - stL, side = min(su, sw - su);
    float sv = u.y/H*8.0, sk = floor(sv), sf = sv - sk;
    ivec2 sid = ivec2(int(sk), int(floor((su + 9.0*h1(ivec2(int(sk), 1), 1513))/16.0)));
    vec3 slab = mix(vec3(0.69,0.68,0.64), vec3(0.80,0.79,0.75), h1(sid, 1514));
    slab *= 0.88 + 0.14*sk/7.0;                                                        // the upper steps nearer the light
    // a step: its riser (facing us, in shade) then its tread (seen from above, lit), the nosing between
    float tread = smoothstep(0.40, 0.45, sf);
    vec3 sc = mix(slab*mix(0.36, 0.55, sf/0.42), slab*mix(1.2, 0.98, (sf - 0.45)/0.55), tread);
    sc = mix(sc, slab*1.36, smoothstep(0.40, 0.45, sf)*(1.0 - smoothstep(0.49, 0.56, sf)));   // the lit, rounded nosing
    sc *= 1.0 - 0.2*smoothstep(0.88, 1.0, sf);                                               // the next riser's shade
    float jx = fract((su + 9.0*h1(ivec2(int(sk), 1), 1513))/16.0);
    sc = mix(sc*0.62, sc, smoothstep(0.0, 0.02, jx)*smoothstep(1.0, 0.98, jx));
    sc *= 1.0 + 0.07*gn(u/1.0, 1515) + 0.04*gn(u/0.35, 1516);
    sc = mix(sc, sc*0.86, smoothstep(0.6, 0.9, gn(u/0.9, 1517))*0.4);                         // worn pits
#if !WINTER
    // moss in the joints, at the back of each tread and creeping up the risers' feet
    float mossy = max(1.0 - smoothstep(0.0, 0.06, min(jx, 1.0 - jx)), max(smoothstep(0.86, 0.97, sf), 1.0 - smoothstep(0.0, 0.12, sf)));
    sc = mix(sc, vec3(0.40,0.56,0.27)*(0.9 + 0.2*gn(u/0.7, 1530)), mossy*smoothstep(0.1, 0.6, gn(u/2.2, 1531) + 0.25)*0.7);
#endif
#if WINTER
    sc = mix(sc, vec3(0.95,0.97,1.0), tread*smoothstep(-0.1, 0.4, gn(u/2.5, 1518) + 0.2)*0.85);
#endif
    sc = mix(sc, sc*0.62, (1.0 - smoothstep(4.5, 10.0, su))*0.6);                             // the left wall's shadow
    // the side walls: ashlar, protruding, the left one's face lit, both tops catching the light
    float wrow = floor(u.y/5.0), wfr = fract(u.y/5.0);
    vec3 wall = mix(vec3(0.62,0.61,0.57), vec3(0.72,0.71,0.66), h1(ivec2(int(wrow), int(su > sw*0.5)), 1519));
    wall *= su < sw*0.5 ? 1.08 : 0.86;
    wall = mix(wall*0.62, wall, smoothstep(0.0, 0.06, wfr));
    wall *= 1.0 + 0.07*gn(u/1.1, 1520);
    wall = mix(wall, wall*1.25, smoothstep(H - 1.5, H - 0.7, u.y)*0.5);
    sc = mix(sc, wall, 1.0 - smoothstep(4.6, 5.0, side));
    sc = mix(sc, sc*0.7, (1.0 - smoothstep(0.0, 0.8, side))*0.6);                             // its rounded outer edge
    c = mix(c, sc, aa(-side, 0.15));
  }
  // occlusion on the rock beside the stairs
  float sideOut = max(stL - u.x, u.x - stR);
  c = mix(c, c*0.7, (1.0 - smoothstep(0.0, 2.5, sideOut))*step(0.0, sideOut));
  // ---- the grass lip on top, drooping tufts (not over the stairs; the river breaks it at the fall)
  vec3 og = mix(OVERHANG, GRASS, 0.35)*(1.0 + 0.06*gn(u/1.4, 1521) + 0.04*gn(vec2(u.x/0.6, u.y/2.0), 1522));
  og = mix(og*0.78, og*1.1, smoothstep(lipY, topY, u.y));
  og = mix(og, mix(GRASS_HI, FLECK_HI, 0.5), smoothstep(topY - 1.2, topY - 0.3, u.y)*0.5);     // its sunlit rim
#if WINTER
  og = mix(vec3(0.80,0.86,0.96), vec3(1.0), smoothstep(lipY, lipY + 2.0, u.y));
#endif
  float tq = floor(u.x/1.5); float th = h1(ivec2(int(tq), 9), 1523);
  float tl = (lipY - u.y) - (1.2 + 3.8*th)*(1.0 - abs(fract(u.x/1.5) - 0.5)*2.0);
  float hang = step(u.y, lipY)*step(tl, 0.0)*step(0.3, h1(ivec2(int(tq), 9), 1524));
  float topA = sat(step(lipY, u.y) + hang)*(1.0 - inStair)*(1.0 - inFall);
  c = mix(c, c*0.55, (1.0 - smoothstep(0.0, 2.2, lipY - u.y - (1.2 + 3.8*th)))*(1.0 - topA)*(1.0 - inStair)*0.45);
  c = mix(c, og, topA);
  // the river's edge where it tips over, wet and bright
  c = mix(c, vec3(0.62,0.80,0.90), inFall*smoothstep(lipY, topY, u.y)*0.8);
  // boulders at its foot: rounded, lit from the upper left, mossy (snowy) tops, out of the stairs and the falls
  for (int i = 0; i < 16; i++){
    float bx = 10.0 + float(i)*25.0 + 12.0*(h1(ivec2(i, 3), 1540) - 0.5), br = 3.2 + 3.0*h1(ivec2(i, 4), 1541);
    if (h1(ivec2(i, 5), 1542) < 0.3 || abs(bx - 0.5*(stL + stR)) < 0.5*(stR - stL) + br + 2.0 || abs(bx - 0.5*(fL + fR)) < 0.5*(fR - fL) + br) continue;
    vec2 q = (u - vec2(bx, 0.55*br))/vec2(br*1.25, br*0.85);
    float d = (length(q) - 1.0 + 0.08*gn(q*3.0 + float(i), 1543))*br;
    if (d > 0.6) continue;
    vec3 rc = mix(vec3(0.55,0.53,0.50), vec3(0.66,0.63,0.58), h1(ivec2(i, 6), 1544));
    rc *= 0.72 + 0.38*sat(0.6 + dot(q, vec2(-0.55, 0.7))) + 0.05*gn(u/0.5, 1545);
#if WINTER
    rc = mix(rc, vec3(0.96,0.97,1.0), smoothstep(0.25, 0.6, q.y + 0.1*gn(u, 1546)));
#else
    rc = mix(rc, vec3(0.42,0.58,0.28), smoothstep(0.45, 0.85, q.y + 0.2*gn(u*0.9, 1546))*0.6);
#endif
    float ba = aa(d, 0.15);
    c = mix(c, rc, ba); a = max(a, ba);
  }
  // grass tufts at the foot, growing up in front
  vec2 fq = vec2(fract(u.x/2.1) - 0.5, u.y); float fh = h1(ivec2(int(floor(u.x/2.1)), 4), 1525);
  float footT = aa(blade(vec2(fq.x*2.1, fq.y + 0.2), 0.5, 1.0 + 2.4*fh), 0.12)*step(0.4, fh)*(1.0 - inStair)*(1.0 - inFall);
  vec3 ftc = mix(GRASS, GRASS_HI, 0.3 + 0.5*fh)*(0.85 + 0.15*u.y/3.0);
#if WINTER
  ftc = vec3(0.93,0.95,1.0); footT = 0.0;
#endif
  c = mix(c, ftc, footT);
  return vec4(c, a);
}

void main(){
  vec4 acc = vec4(0.0);
  AAW = 0.5/uPx;
  for (int i = 0; i < 4; i++){
    vec2 o = vec2(i == 1 || i == 3 ? 0.75 : 0.25, i >= 2 ? 0.75 : 0.25) + vec2(i == 0 || i == 3 ? 0.0 : 0.0);
    vec2 pix = gl_FragCoord.xy - 0.5 + o;
    vec2 p = uOrigin + pix/uPx;
    if (uMode == 0) acc += vec4(terrain(p), 1.0);
    else {
      vec2 u = pix/uPx;
      vec4 s = cliffFace(u);
      acc += vec4(s.rgb*s.a, s.a);
    }
  }
  acc *= 0.25;
  if (uMode != 0 && acc.a > 0.0) acc.rgb /= acc.a;
  // dither so the gradients don't band
  float dn = (h1(ivec2(gl_FragCoord.xy), 1999) - 0.5)/255.0;
  outColor = vec4(clamp(acc.rgb + dn, 0.0, 1.0), acc.a);
}
`;

const fragFor = (season: Season) => `#version 300 es\nprecision highp float;\nprecision highp int;\n${defines(season)}\n${geometry()}\n${LIB}\n${dressGeometry()}\n${SEASON_GLSL}\n${TERRAIN}`;

// ---- the renderer (Chrome) ---------------------------------------------------------------------------------------

const PAGE = /* js */ `
window.setup = (vert, frags) => {
  const cv = document.createElement('canvas'); document.body.appendChild(cv);
  const gl = cv.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false, alpha: true });
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const vs = sh(gl.VERTEX_SHADER, vert);
  const progs = {};
  for (const [k, src] of Object.entries(frags)) {
    const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, src)); gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    progs[k] = p;
  }
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  window.draw = ({ prog, w, h, origin, px, mode, size }) => {
    cv.width = w; cv.height = h; gl.viewport(0, 0, w, h);
    const p = progs[prog]; gl.useProgram(p);
    gl.uniform2f(gl.getUniformLocation(p, 'uOrigin'), origin[0], origin[1]);
    gl.uniform1f(gl.getUniformLocation(p, 'uPx'), px);
    gl.uniform1i(gl.getUniformLocation(p, 'uMode'), mode);
    gl.uniform2f(gl.getUniformLocation(p, 'uSize'), size[0], size[1]);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    // in strips, so no single draw runs long; the GPU now and then drops a few tiles of a heavy draw (they stay
    // transparent), so an opaque (terrain) strip is checked and redrawn until whole
    gl.enable(gl.SCISSOR_TEST);
    const S = 64, buf8 = new Uint8Array(w * S * 4);
    for (let y = 0; y < h; y += S) {
      const sh = Math.min(S, h - y);
      gl.scissor(0, y, w, sh); gl.clear(gl.COLOR_BUFFER_BIT);
      for (let t = 0; t < 40; t++) {
        // later passes only fill what is still empty: src·(1 − dst.a) + dst·dst.a
        if (t > 0) { gl.enable(gl.BLEND); gl.blendFunc(gl.ONE_MINUS_DST_ALPHA, gl.DST_ALPHA); }
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.finish();
        gl.disable(gl.BLEND);
        if (mode !== 0) break;
        gl.readPixels(0, y, w, sh, gl.RGBA, gl.UNSIGNED_BYTE, buf8);
        let ok = true;
        for (let i = 3; i < w * sh * 4; i += 4) if (buf8[i] !== 255) { ok = false; break; }
        if (ok) break;
        window.redraws = (window.redraws || 0) + 1;
        if (t === 39) window.failed = (window.failed || 0) + 1;
      }
    }
    gl.disable(gl.SCISSOR_TEST);
    return cv.toDataURL('image/png');
  };
};`;

/** Sprites: [name, mode, width u, height u] (bottom edge on the ground at the structure's near edge). */
const SPRITES = [
  { name: 'cliff-face', mode: 4, w: CLIFF.x1 - CLIFF.x0, h: FACE_H, z: CLIFF.z0, x: (CLIFF.x0 + CLIFF.x1) / 2 }
];

async function main() {
  const seasons = onlySeason ? [onlySeason] : [...SEASONS];
  const t0 = Date.now();
  const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage();
  await page.setContent('<body style="margin:0"></body>');
  await page.addScriptTag({ content: PAGE });
  const frags = Object.fromEntries(seasons.map((s) => [s, fragFor(s)]));
  await page.evaluate(([v, fr]) => (window as any).setup(v, fr), [VERT, frags] as const);
  const tmp = mkdtempSync(join(tmpdir(), 'terrain-'));
  const W = Math.round((PLAN.x1 - PLAN.x0) * PX), H = Math.round(CHUNK_D * PX);
  const bytes: Record<string, number[]> = {};
  const prev = (() => { try { return JSON.parse(readFileSync(MANIFEST, 'utf8')).bytes ?? {}; } catch { return {}; } })();
  const webp = async (png: string, out: string, opts: string[]) => {
    const file = join(tmp, 'a.png');
    writeFileSync(file, Buffer.from(png.split(',')[1], 'base64'));
    execFileSync('cwebp', [...opts, '-m', '6', '-sharp_yuv', '-quiet', file, '-o', out]);
    return statSync(out).size;
  };
  for (const season of seasons) {
    mkdirSync(join(OUT, season), { recursive: true });
    bytes[season] = prev[season] ?? new Array(CHUNKS).fill(0);
    for (let i = 0; i < CHUNKS; i++) {
      if (onlyChunk !== undefined && i !== onlyChunk) continue;
      const z0 = PLAN.z0 + i * CHUNK_D;
      const png = await page.evaluate((o) => (window as any).draw(o), { prog: season, w: W, h: H, origin: [PLAN.x0, z0], px: PX, mode: 0, size: [0, 0] });
      // the open-sea chunks (front, back) compress harder
      const q = i === 0 || i === CHUNKS - 1 ? Q - 4 : Q;
      bytes[season][i] = await webp(png, join(OUT, season, `${i}.webp`), ['-q', String(q)]);
      if (process.argv.includes('--png')) writeFileSync(join('/tmp/world-build/terrain', `${season}-${i}.png`), Buffer.from(png.split(',')[1], 'base64'));
      console.log(`${season} ${i}: ${(bytes[season][i] / 1024).toFixed(1)} KB`);
    }
  }
  if (!noSprites) {
    mkdirSync(join(OUT, 'sprites'), { recursive: true });
    for (const s of SPRITES) {
      const w = Math.round(s.w * SPRITE_PX), h = Math.round(s.h * SPRITE_PX);
      // sprites use the season-neutral (summer, else first) program; the winter variant gets its snow
      for (const season of seasons.filter((x) => x === 'winter' || x === (seasons.includes('summer') ? 'summer' : seasons[0]))) {
        const png = await page.evaluate((o) => (window as any).draw(o), { prog: season, w, h, origin: [0, 0], px: SPRITE_PX, mode: s.mode, size: [s.w, s.h] });
        const name = season === 'winter' ? `${s.name}-winter` : s.name;
        const n = await webp(png, join(OUT, 'sprites', `${name}.webp`), ['-q', '86', '-alpha_q', '100', '-exact']);
        console.log(`sprite ${name}: ${w}×${h}px (${s.w}×${+s.h.toFixed(2)}u, bottom at z ${s.z}) ${(n / 1024).toFixed(1)} KB`);
      }
    }
  }
  console.log(`GPU strips redrawn: ${await page.evaluate(() => [(window as any).redraws ?? 0, (window as any).failed ?? 0].join(" passes, failed "))}`);
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
  const all = { ...prev, ...bytes };
  const out = { px: PX, chunkD: CHUNK_D, chunks: CHUNKS, seasons: [...SEASONS], bytes: Object.fromEntries(SEASONS.map((s) => [s, all[s] ?? new Array(CHUNKS).fill(0)])) };
  writeFileSync(MANIFEST, JSON.stringify(out) + '\n');
  for (const s of seasons) console.log(`${s}: ${(bytes[s].reduce((a, b) => a + b, 0) / 1024).toFixed(0)} KB`);
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

await main();
