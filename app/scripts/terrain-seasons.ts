// The ground's seasonal dressing (docs/design.md "World", phase 3), painted by the terrain bake (scripts/terrain.ts)
// into the same chunks: what lies on the plan in each look, over the grass, the paths and the plaza, under the
// contact shadows. Six looks, each its own lazily loaded chunk set (static/terrain/<look>/):
//   spring         fresh grass with clover
//   spring-petals  NH's cherry-blossom days (Apr 1–10, the blossom foliage): petals drifted under the blossoming oaks,
//                  along the paths' edges and the plaza's curb, a thin scatter everywhere else
//   summer         lush: deeper grass, tall tufts with their shade, clover
//   autumn         warmer grass, dry patches
//   autumn-leaves  the fall foliage (Oct 16 – Dec 10): maple leaves heaped under the oaks, blown along the paths
//   winter         snow in soft drifts (lit from the upper left, blue in their lee), banks piled along the paths with
//                  their shade on the path, snow thinning out over the sand, snowy river banks (NH's water never freezes,
//                  so the water stays open: only its rim darkens under the snow's lip)
// Time of day is never baked: the scene's tint does it.
//
// The bake includes this module with three small hooks (see LOOKS, dressDefines, dressGeometry, SEASON_GLSL and the
// call `c = dress(p, c, dL, dG, aG, pz, pd, bAll, ws);` right before its contact shadows).
import { BUILDINGS, CLIFF, GOAL_TREES, SCENERY, TREE_H } from '../src/lib/components/island/world.ts';

export const LOOKS = ['spring', 'summer', 'autumn', 'winter', 'spring-petals', 'autumn-leaves'] as const;
export type Look = (typeof LOOKS)[number];
type Base = 'spring' | 'summer' | 'autumn' | 'winter';
/** The season whose palette a look paints with. */
export const baseOf = (l: Look): Base => (l === 'spring-petals' ? 'spring' : l === 'autumn-leaves' ? 'autumn' : l);

/** The dressing's switches for a look (the bake's own WINTER / AUTUMN / SPRING_S come from its base). */
export function dressDefines(l: Look): string {
  return [`#define PETALS ${l === 'spring-petals' ? 1 : 0}`, `#define LEAVES ${l === 'autumn-leaves' ? 1 : 0}`, `#define LUSH ${l === 'summer' ? 1 : 0}`].join('\n');
}

const f = (v: number) => (Number.isInteger(v) ? `${v}.0` : `${+v.toFixed(3)}`);
/** The trees petals and leaves fall from: the oaks (goal trees and scenery) [x, z, canopy radius]; buildings' fronts
 *  [x, z, half width] (nothing lies under a building). */
export function dressGeometry(): string {
  const oaks = [...Object.values(GOAL_TREES).map(([x, z]) => [x, z, TREE_H]), ...SCENERY.filter((s) => s.kind === 'oak').map((s) => [s.x, s.z, s.h])];
  const trees = oaks.map(([x, z, h]) => `vec3(${f(x)},${f(z)},${f(0.42 * h)})`);
  return [
    `const int N_OAK = ${trees.length};`,
    `const vec3 OAK[${trees.length}] = vec3[${trees.length}](${trees.join(',')});`,
    `const vec2 CLIFF_Z = vec2(${f(CLIFF.z0)}, ${f(CLIFF.z1)});`,
    `const int N_BFOOT = ${BUILDINGS.length};`,
    `const vec4 BFOOT[${BUILDINGS.length}] = vec4[${BUILDINGS.length}](${BUILDINGS.map((b) => `vec4(${f(b.x)},${f(b.z)},${f(b.h * 0.7)},${f(b.depth)})`).join(',')});`
  ].join('\n');
}

export const SEASON_GLSL = /* glsl */ `
// ---- the seasonal dressing ----
float dAAW(){ return 0.5/uPx; }
float dBlade(vec2 q, float hw, float h){ float k = hw/h; return max(-q.y, (abs(q.x) - hw*(1.0 - q.y/h)) / sqrt(1.0 + k*k)); }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }

/** How thickly things fall here: 1 under an oak's canopy (a little toward us, where the wind takes them), fading out. */
float underTrees(vec2 p){
  float t = 0.0;
  for (int i = 0; i < N_OAK; i++){
    vec3 o = OAK[i]; vec2 q = (p - o.xy - vec2(0.12*o.z, -0.22*o.z))/vec2(1.25*o.z, 0.85*o.z);
    t = max(t, 1.0 - smoothstep(0.35, 1.25, length(q) + 0.18*gn(p/9.0 + float(i), 2101)));
  }
  return t;
}
/** 1 where something lying flat can be seen: the land, off the water, the cliff's face and the buildings' footprints. */
float lieMask(vec2 p, float dL, float ws){
  float m = smoothstep(2.0, -6.0, dL) * smoothstep(-0.5, 1.5, ws);
  m *= 1.0 - step(CLIFF_Z.x - 1.0, p.y)*step(p.y, CLIFF_Z.y + 1.0);
  for (int i = 0; i < N_BFOOT; i++){ vec4 b = BFOOT[i]; m *= 1.0 - step(abs(p.x - b.x), b.z)*step(b.y + 1.0, p.y)*step(p.y, b.y + b.w); }
  return m;
}

// a cherry petal: a soft teardrop with the notch at its wide end (q local, about 1 unit long at s = 1)
float petalD(vec2 q, float s){
  q /= s;
  float w = 0.36*(1.0 + 0.55*clamp(q.y, -0.6, 0.6));
  float d = length(vec2(q.x/w*0.5, q.y)/vec2(0.5, 0.56)) - 1.0;
  d = max(d, -(length((q - vec2(0.0, 0.6))*vec2(1.0, 1.4)) - 0.13));
  return d*0.4*s;
}
vec3 petals(vec2 p, vec3 c, float dens, float cell, int seed){
  vec2 g = floor(p/cell);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    ivec2 id = ivec2(g) + ivec2(i, j);
    vec2 r = h2(id, seed);
    if (r.x > dens) continue;
    vec2 ctr = (vec2(id) + 0.15 + 0.7*h2(id, seed + 1))*cell;
    float s = 2.6 + 1.6*h1(id, seed + 2);
    vec2 q = rot(6.2832*h1(id, seed + 3))*(p - ctr);
    q.x *= 1.0 + 0.35*h1(id, seed + 6);                         // some lie tilted (foreshortened)
    float d = petalD(q, s);
    c = mix(c, c*vec3(0.80,0.76,0.80), aa(petalD(q - rot(6.2832*h1(id, seed + 3))*vec2(0.5,-0.55), s), dAAW()*2.5)*0.45);   // its shadow
    float t = h1(id, seed + 4);
    vec3 pc = t < 0.45 ? vec3(1.0,0.80,0.87) : t < 0.8 ? vec3(0.98,0.70,0.81) : vec3(1.0,0.89,0.93);
    pc *= 0.94 + 0.12*smoothstep(-0.5, 0.6, q.y/s);             // paler at the tip
    pc = mix(pc, vec3(0.93,0.52,0.66), (1.0 - smoothstep(0.0, 0.35, q.y/s + 0.45))*0.35);   // the pink base
    c = mix(c, pc, aa(d, dAAW()*1.1));
  }
  return c;
}
// a maple leaf: five pointed lobes on a short stem (q local, radius about s)
float mapleD(vec2 q, float s){
  float a = atan(q.x, q.y), r = length(q);
  float lobe = pow(abs(cos(2.5*a)), 0.55);
  float R = s*(0.48 + 0.52*lobe)*(1.0 - 0.28*smoothstep(0.55, 1.0, abs(a)/3.1416));   // the lower lobes smaller
  float d = r - R;
  d = min(d, max(abs(q.x) - 0.07*s, max(q.y + 0.95*s, -q.y - 0.05*s)));                 // the stem
  return d;
}
vec3 leaves(vec2 p, vec3 c, float dens, float cell, int seed){
  vec2 g = floor(p/cell);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    ivec2 id = ivec2(g) + ivec2(i, j);
    vec2 r = h2(id, seed);
    if (r.x > dens) continue;
    vec2 ctr = (vec2(id) + 0.15 + 0.7*h2(id, seed + 1))*cell;
    float s = 2.0 + 1.2*h1(id, seed + 2);
    float ang = 6.2832*h1(id, seed + 3);
    vec2 q = rot(ang)*(p - ctr);
    q.x *= 1.0 + 0.3*h1(id, seed + 6);
    c = mix(c, c*vec3(0.72,0.70,0.66), aa(mapleD(q - rot(ang)*vec2(0.6,-0.7), s), dAAW()*3.0)*0.5);
    float t = h1(id, seed + 4);
    vec3 lc = t < 0.32 ? vec3(0.85,0.27,0.17) : t < 0.6 ? vec3(0.91,0.42,0.18) : t < 0.82 ? vec3(0.94,0.62,0.20) : t < 0.93 ? vec3(0.95,0.76,0.27) : vec3(0.66,0.36,0.20);
    lc *= 1.0 + 0.10*dot(normalize(q + 1e-3), vec2(-0.6, 0.6))*smoothstep(0.2*s, s, length(q));
    float vein = (1.0 - smoothstep(0.0, 0.09*s, abs(q.x)))*step(-0.2*s, q.y)*step(q.y, 0.8*s);
    vein = max(vein, (1.0 - smoothstep(0.0, 0.07*s, abs(dot(q, normalize(vec2(0.8, 0.6))))))*step(0.0, q.x)*step(length(q), 0.75*s));
    vein = max(vein, (1.0 - smoothstep(0.0, 0.07*s, abs(dot(q, normalize(vec2(0.8, -0.6))))))*step(q.x, 0.0)*step(length(q), 0.75*s));
    lc = mix(lc, lc*0.72, vein*0.55);
    c = mix(c, lc, aa(mapleD(q, s), dAAW()*1.1));
  }
  return c;
}
// clover: little three-leaf sprigs in drifts, a shade darker and lighter than the grass
vec3 clover(vec2 p, vec3 c, float dens, int seed){
  float patchy = smoothstep(-0.2, 0.3, fbm(p/38.0, seed + 9, 2));
  float cell = 4.2; vec2 g = floor(p/cell);
  ivec2 id = ivec2(g); vec2 r = h2(id, seed);
  if (r.x < dens*patchy){
    vec2 q = rot(6.2832*r.y)*(p - (vec2(id) + 0.25 + 0.5*h2(id, seed + 1))*cell);
    float s = 1.2 + 0.5*h1(id, seed + 2), d = 1e5;
    for (int k = 0; k < 3; k++){ vec2 o = rot(2.094*float(k))*vec2(0.0, 0.62*s); d = min(d, length(q - o) - 0.55*s); }
    vec3 cc = h1(id, seed + 3) < 0.5 ? mix(GRASS_SHADE, GRASS, 0.55) : mix(GRASS, GRASS_HI, 0.8);
    c = mix(c, c*0.78, aa(d - 0.25, dAAW()*2.0)*0.4);
    c = mix(c, cc*(1.0 + 0.18*smoothstep(-0.6*s, 0.6*s, q.y)), aa(d, dAAW()));
  }
  return c;
}
// tall tufts: three to five long blades with a shaded base, scattered in clumps
vec3 tufts(vec2 p, vec3 c, float dens, int seed){
  float cell = 6.0; vec2 g = floor(p/cell);
  for (int j = -1; j <= 0; j++) for (int i = -1; i <= 1; i++){
    ivec2 id = ivec2(g) + ivec2(i, j);
    vec2 r = h2(id, seed);
    if (r.x > dens*smoothstep(-0.2, 0.4, fbm(vec2(id)*cell/45.0, seed + 5, 2))) continue;
    vec2 q = p - (vec2(id) + 0.2 + 0.6*h2(id, seed + 1))*cell;
    float h = 6.0 + 3.0*r.y;
    c = mix(c, c*0.8, aa(length((q - vec2(0.8, 0.4))*vec2(0.5, 1.1)) - 2.2, 1.6)*0.2);
    float d = 1e5, lit = 0.0;
    for (int k = 0; k < 5; k++){
      float a = (float(k) - 2.0)*0.32 + 0.2*(h1(id, seed + 10 + k) - 0.5);
      vec2 lq = rot(a)*q;
      float bd = dBlade(lq, 0.75, h*(0.7 + 0.35*h1(id, seed + 20 + k)));
      if (bd < d){ d = bd; lit = sat(lq.y/h); }
    }
    vec3 bc = mix(GRASS*0.82, mix(GRASS_HI, FLECK_HI, 0.6)*1.04, smoothstep(0.0, 0.9, lit));
    c = mix(c, bc, aa(d, dAAW()));
  }
  return c;
}

/** The snow's drifts: a soft height field over the lawns. */
float driftH(vec2 p){ return 0.85*gn(p/58.0, 2201) + 0.28*gn(p/24.0 + 3.0, 2202) + 0.035*gn(p/7.0, 2203); }

vec3 dress(vec2 p, vec3 c, float dL, float dG, float aG, float pz, float pd, float bAll, float ws){
  // the paths' normal (derivatives first, while every pixel of the quad is here)
  float pe = min(pd, bAll);
  vec2 n = -vec2(dFdx(pe), dFdy(pe)); n = n/max(length(n), 1e-4);   // (measured: the quad derivatives come out mirrored here)
  float lie = lieMask(p, dL, ws);
  if (lie <= 0.0) return c;
  float onPath = 1.0 - smoothstep(-0.5, 0.5, min(pd, min(bAll, pz)));
  float lawn = aG*(1.0 - onPath);
  float edge = (1.0 - smoothstep(0.0, 5.0, abs(min(pd, bAll) + 1.0)));       // along the paths' edges
  float curb = (1.0 - smoothstep(0.0, 6.0, abs(pz + 2.0)));                    // along the plaza's curb
  vec3 o = c;
#if WINTER
  // ---- winter: drifts lit from the upper left, blue in their lee; banks along the paths
  {
    // the plan's light comes from the upper left: (-x, +z) and above
    vec2 L = normalize(vec2(-0.6, 0.6));
    float e = 0.8;
    vec2 gH = vec2(driftH(p + vec2(e, 0.0)) - driftH(p - vec2(e, 0.0)), driftH(p + vec2(0.0, e)) - driftH(p - vec2(0.0, e)))/(2.0*e);
    float sh = dot(-gH, L)*10.0;
    // the paths' banks: a ridge on the lawn side, its slope along the path's normal
    float rw = 4.4 + 1.0*gn(p/9.0, 2211);
    float ridge = exp(-pow((pe - 4.0)/rw, 2.0));
    float dr = -2.0*(pe - 4.0)/(rw*rw)*ridge;                                     // d ridge / d pe
    sh += dot(-dr*n, L)*16.0*smoothstep(-0.5, 0.5, pe);
    vec3 lit = vec3(1.0), lee = vec3(0.74,0.82,0.95);
    vec3 snow = c;
    snow = mix(snow, snow*lee, sat(-sh)*0.55);
    snow = mix(snow, mix(snow, lit, 0.6), sat(sh)*0.6);
    snow = mix(snow, vec3(1.0), ridge*0.3*smoothstep(-0.5, 0.5, pe));
    snow = mix(snow, snow*vec3(0.84,0.89,0.97), (1.0 - smoothstep(0.0, 1.6, pe))*step(0.0, pe)*0.6);   // the bank's foot at the path
    c = mix(c, snow, lawn*lie);
    // the bank's shade falls on the path's edge on its sunward side
    float onP = 1.0 - smoothstep(-0.3, 0.3, pe);
    c = mix(c, c*vec3(0.80,0.85,0.95), onP*(1.0 - smoothstep(-4.5, -0.5, pe))*sat(dot(n, L)*1.4)*0.6*lie);
    // packed snow in the paths' tracks: soft lighter streaks
    c = mix(c, vec3(0.93,0.95,0.99), onP*smoothstep(0.35, 0.75, gn(vec2(p.x/3.0, p.y/9.0), 2212) + 0.3*smoothstep(-6.0, -1.0, pe))*0.35*lie);
    // snow thinning out over the sand beside the grass: patches, then flakes
    float sand = (1.0 - aG)*smoothstep(1.0, -2.0, dL);
    float fr = smoothstep(14.0, 0.0, dG + 4.0*gn(p/11.0, 2213));
    float spatch = smoothstep(0.55 - 0.6*fr, 0.75 - 0.6*fr, fbm(p/6.0, 2214, 3) + 0.4);
    vec3 sn = mix(vec3(0.97,0.98,1.0), vec3(0.80,0.86,0.95), smoothstep(0.6, 0.0, fbm(p/2.0, 2215, 2) + 0.3));
    c = mix(c, sn, sand*fr*spatch*0.9);
    // the river and pond banks: the snow's lip right to the water, its shade on the water's rim
    float bank = (1.0 - smoothstep(0.0, 4.0, ws))*step(0.0, ws)*aG;
    c = mix(c, mix(vec3(0.98,0.99,1.0), vec3(0.78,0.85,0.96), smoothstep(2.5, 0.2, ws)), bank*0.85);
  }
#else
  // ---- spring and summer: clover; summer's tall tufts and deeper green
#if !AUTUMN
  c = mix(c, clover(p, c, LUSH == 1 ? 0.55 : 0.4, 2301), lawn);
#endif
#if LUSH
  c = mix(c, sat3(c, 1.04)*0.97, lawn);
  c = mix(c, tufts(p, c, 0.32, 2311), lawn*smoothstep(-3.0, -8.0, dG));
#endif
#if AUTUMN && !LEAVES
  // dry patches in the warm grass
  c = mix(c, c*vec3(1.05,0.98,0.80), lawn*smoothstep(0.2, 0.6, fbm(p/30.0, 2321, 3))*0.35);
#endif
#if PETALS
  {
    float t = underTrees(p);
    float dens = 0.06 + 0.7*t + 0.35*edge + 0.3*curb*smoothstep(-8.0, 0.0, pz) + 0.12*smoothstep(0.2, 0.7, fbm(p/40.0, 2401, 2));
    dens *= mix(0.35, 1.0, aG);                                                 // a few blown onto the sand
    c = petals(p, c, min(dens, 0.95), 6.0, 2411);
    c = petals(p + 2.7, c, min(dens*0.6, 0.9), 8.5, 2421);
  }
#endif
#if LEAVES
  {
    float t = underTrees(p);
    // the grass under a tree a little browner, where the leaves have lain
    c = mix(c, c*vec3(1.04,0.92,0.78), lawn*t*0.3);
    float dens = 0.03 + 0.85*t + 0.3*edge + 0.25*curb*smoothstep(-8.0, 0.0, pz);
    dens *= mix(0.12, 1.0, aG);
    c = leaves(p, c, min(dens, 0.95), 6.5, 2511);
    c = leaves(p + 3.1, c, min(dens*0.7*t + 0.02, 0.9), 5.0, 2521);
  }
#endif
#endif
  return mix(o, c, lie);
}
`;
