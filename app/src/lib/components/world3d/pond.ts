// A pond put down on the island (layout kind `pond`; docs/island-layout.md "The layout is data"): the old 3D island's
// pond as a thing of its own, on the grass: its water an oval of the old pond's slow ripples and glints (the old
// water.ts's, on the shared clock and tint: waterU), a darker bed under it, wet earth at its edge and NH-coloured stones round it.
// Its lily pads and the lily on the biggest are placeObjects' (models, on the water). layout/ponds.ts pondPlaces says
// where; the scene stands the group on the ground (engine.ts placeGroup).
import {
  CircleGeometry, Color, DodecahedronGeometry, DoubleSide, Group, Mesh, MeshLambertMaterial, RingGeometry, ShaderMaterial
} from 'three';
import { BEND_GLSL, bendU } from './bend.ts';
import { withMaps } from './blank.ts';
import { waterU } from './water.ts';
import type { PondPlace } from '#lib/layout/ponds.ts';

/** How high the water stands over the grass (u). */
export const POND_Y = 0.7;

const VERT = /* glsl */ `
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
const FRAG = /* glsl */ `
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
void main() {
  // the old pond's: slow ripples, a glint now and then
  vec2 p = vW;
  float n = noise(p * 0.08 + vec2(uTime * 0.04, uTime * 0.03)) * 0.6 + noise(p * 0.2 - uTime * 0.05) * 0.4;
  vec3 col = mix(vec3(0.22, 0.55, 0.84), vec3(0.5, 0.8, 0.96), smoothstep(0.55, 0.85, n));
  float g = noise(p * 0.4 + uTime * 0.5);
  col += vec3(0.45) * smoothstep(0.88, 0.97, g);
  col *= uTint;
  col = mix(col, uFog, smoothstep(uFogNear, uFogFar, vDepth));
  gl_FragColor = vec4(col, 0.8);
}`;

let water: ShaderMaterial | null = null;
const waterMat = () => {
  if (water) return water;
  water = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: DoubleSide, uniforms: { ...bendU, ...waterU } });
  // (it bends itself: engine.ts's bend() leaves it be)
  water.userData.bent = true;
  return water;
};
const lambert = (c: number) => withMaps(new MeshLambertMaterial({ color: c, emissive: new Color(c), emissiveIntensity: 0.18 }));
const oval = (geo: CircleGeometry | RingGeometry, rx: number, rz: number, y: number) => {
  geo.rotateX(-Math.PI / 2);
  geo.scale(rx, 1, rz);
  geo.translate(0, y, 0);
  return geo;
};

/** A pond's model: its origin its middle on the ground, unturned (the scene turns it). */
export function buildPond(p: PondPlace): Group {
  const g = new Group();
  g.name = `pond:${p.id}`;
  // the bed (dark, deep), the wet earth round it, the water over both
  g.add(new Mesh(oval(new CircleGeometry(1, 40), p.rx, p.rz, POND_Y - 0.4), lambert(0x2d5a6e)));
  g.add(new Mesh(oval(new RingGeometry(0.86, 1.1, 40, 1), p.rx, p.rz, POND_Y - 0.25), lambert(0x6b5636)));
  const w = new Mesh(oval(new CircleGeometry(1, 48), p.rx, p.rz, POND_Y), waterMat());
  w.renderOrder = 2;
  g.add(w);
  // stones round the edge, a little each way (NH's pond-side rocks: grey and sandy, flat)
  const n = Math.max(12, Math.round((Math.PI * (p.rx + p.rz)) / 9));
  const greys = [0xa7a196, 0x8f8a80, 0xb8ae98, 0x9c9488];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.sin(i * 7.3) * 0.08, r = 1.04 + 0.05 * Math.sin(i * 3.1);
    const s = 3.4 + 1.6 * ((i * 37) % 5) / 5;
    const st = new Mesh(new DodecahedronGeometry(1, 0), lambert(greys[i % greys.length]));
    st.position.set(Math.cos(a) * p.rx * r, s * 0.25, Math.sin(a) * p.rz * r);
    st.scale.set(s, s * 0.55, s * 0.85);
    st.rotation.set(i * 0.7, i * 1.3, i * 0.4);
    st.castShadow = st.receiveShadow = true;
    g.add(st);
  }
  return g;
}

/** Where its lily pads float and its lily stands (its own frame, as shares of the half-axes; the old pond's three). */
export const POND_LILIES: readonly (readonly [number, number, number])[] = [[0.42, 0.18, 6], [-0.3, 0.42, 4.4], [-0.48, -0.25, 3.6]];
