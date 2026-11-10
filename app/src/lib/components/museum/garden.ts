// The bug wing's exhibits (docs/design.md "The museum"): NH's garden under glass (its stone paths, a pond, NH's oaks and
// a palm, flower beds, bushes, a fallen log, ferns, cacti, the museum's own garden props: scripts/world3d-models.ts
// --museum; NH's flowers from the island) and glass display cases along its back, and the hour's bugs of those found
// (bugShow.ts: ten at most) living there as each lives (species.ts habitatOf), NH's catch models
// (static/room/world3d/critters/bugs/), moving as the island's do (bugLife.ts: the island's critterPath motion, each
// kept to its enclosure): the butterflies and moths fluttering over the flowers and landing on them, the bee buzzing
// from flower to flower, the dragonflies darting and hovering over the pond, the firefly drifting over it glowing, the
// beetles and cicadas on the trunks, the hoppers hopping, the crawlers
// crawling and resting, the water bugs gliding on (and in) the pond, the case bugs walking their cases (the hermit
// crab sideways), the bagworm on its thread. Their wings beat in the vertex shader (world3d/wings.ts).
// A species is one InstancedMesh (one specimen, NH's museum's: its parts, its wings among them, one geometry), culled
// by the room it takes; a bug off screen rests, and the wing draws nothing while none is on screen.
import {
  BufferGeometry, CircleGeometry, Color, DoubleSide, Float32BufferAttribute, Group, InstancedMesh, LineBasicMaterial,
  LineSegments, Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial, PlaneGeometry, Quaternion, Sprite, SpriteMaterial, CanvasTexture,
  ShaderMaterial, Sphere, Vector2, Vector3, Vector4, AdditiveBlending, BoxGeometry, type Material, type Texture
} from 'three';
import type { Exhibit, Kit } from './engine.ts';
import { BUG_MUSEUM_MODEL, type Habitat, type Specimen } from './species.ts';
import { ditherMaterial, fadeMaterial, fadeStep, hourWatch } from './hourFader.ts';
import { bugsOnDisplay, type Shown } from './bugShow.ts';
import type { Pt, Rect } from './plan.ts';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { batcher, frameOf, openBox, plainGeometry } from './geometry.ts';
import type { Box } from './tanks.ts';
import { BUG_S, CASE, CASES, CASE_AGAVE, FLOWERS, OAKS, OAK_S, PALM, PALM_S, PATHS, POND, POND_Y, PROPS, SOIL, bugLife, bugSeed, pose, type Life, type Pose } from './bugLife.ts';
import { FLAPS, flapGlsl, wingHinge } from '../world3d/wings.ts';

export { CASES };
/** A display case's pieces (its middle at x, z): a wooden stand, its soil, its glass (open below: its floor the soil's
 *  top) and its frame (geometry.ts frameOf), the posts' feet a little under the soil (their bottoms were the soil's
 *  underside's plane). */
export function casePieces(cx: number, cz: number): { stand: Box; soil: Box; glass: Box; frame: Box[] } {
  const x0 = cx - CASE.w / 2, x1 = cx + CASE.w / 2, z0 = cz - CASE.d / 2, z1 = cz + CASE.d / 2, y = CASE.stand, e = 0.6;
  const b = { x0, x1, y0: y, y1: y + CASE.h, z0, z1 };
  return {
    stand: { x0: x0 + 1, x1: x1 - 1, y0: 0, y1: y, z0: z0 + 1, z1: z1 - 1 },
    soil: { ...b, y1: y + 2 },
    glass: { ...b, y0: y + 2 },
    frame: frameOf(b, y - e, e)
  };
}

// NH's museum water, the pond's: clear aqua at its rim deepening to blue in the middle, a soft net of light drifting
// over it (two layers of folded sines, slow), and a thin white edge where it meets the stones, gently wavering; dusk
// blue and dimmer at night. Its local plane in model units (centred), uHalf its half size.
const POND_VERT = /* glsl */ `
varying vec2 vP;
void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const POND_FRAG = /* glsl */ `
uniform float uTime; uniform float uNight; uniform vec2 uHalf;
varying vec2 vP;
float net(vec2 p, float t) {
  float a = sin(p.x * 0.23 + t * 0.6) + sin(p.y * 0.29 - t * 0.75) + sin((p.x - p.y) * 0.16 + t * 0.45);
  float b = sin(p.x * 0.31 - t * 0.5 + 1.7) + sin(p.y * 0.21 + t * 0.65) + sin((p.x + p.y) * 0.13 - t * 0.35);
  return pow(1.0 - abs(sin(a * 1.1)), 7.0) * 0.6 + pow(1.0 - abs(sin(b * 1.1)), 9.0) * 0.4;
}
void main() {
  // how far in from the rim (model units)
  float d = min(uHalf.x - abs(vP.x), uHalf.y - abs(vP.y));
  // (linear: NH's #5cc6c4 at the rim to #1f7fa8 in the middle)
  float deep = smoothstep(0.5, 11.0, d);
  vec3 col = mix(vec3(0.107, 0.565, 0.55), vec3(0.014, 0.21, 0.39), deep);
  col += vec3(0.75, 0.95, 1.0) * net(vP, uTime) * (0.09 + 0.09 * deep);
  // the edge: a thin pale line on the stones' side, wavering a little
  float wob = (sin(vP.x * 0.55 + uTime * 1.2) + sin(vP.y * 0.65 - uTime * 0.9)) * 0.2;
  float rim = 1.0 - smoothstep(0.4, 1.3, d + wob);
  col = mix(col, vec3(0.8, 0.95, 0.93), rim * 0.55);
  col = mix(col, col * vec3(0.42, 0.5, 0.78), uNight * 0.6);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

interface Bug {
  sp: Specimen;
  /** Its place (bugShow.ts: its habitat's slot-th), and its key (id@slot: a bug moved to another place is another). */
  slot: number;
  key: string;
  mesh: InstancedMesh | null;
  /** Its geometry and its parts' materials (its own: released as it goes), its firefly's glow. */
  geo: BufferGeometry | null;
  mats: Material[];
  glow: Sprite | null;
  /** How it lives (bugLife.ts), where it is this frame. */
  life: Life | null;
  pose: Pose;
  /** Its wings' angle (its flapping parts' uniform). */
  flap: { value: number };
  /** Its drawn size across. */
  size: number;
  /** Its own seed (a firefly's glow's phase). */
  seed: number;
  /** The room it takes (the camera's cull: off screen it rests). */
  sphere: Sphere;
  /** How far in (0 gone … 1 there) and which way it's fading (1 in, −1 out, 0 settled): the hour's pick changing. */
  fade: number;
  dir: number;
}

function glowTex(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,250,170,1)');
  r.addColorStop(0.35, 'rgba(220,255,120,0.55)');
  r.addColorStop(1, 'rgba(200,255,120,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

/** The bug wing, its bugs the hour's from `list` (bugShow.ts: by `clock`'s Tokyo hour). */
export function buildGarden(kit: Kit, list: readonly Specimen[], clock: () => number = () => Date.now()): Exhibit {
  const group = new Group();
  const mats: Material[] = [];
  const geos: BufferGeometry[] = [];
  const texs: Texture[] = [];
  const uTime = { value: 0 };
  const uNight = { value: 0 };
  let disposed = false;
  const X = new Vector3(), Y = new Vector3(), Z = new Vector3(), M4 = new Matrix4(), S = new Vector3(), Q = new Quaternion(), P = new Vector3();

  // ---- the ground: the stone paths, the pond, the soil ----
  const flat = (r: Rect, m: Material, y: number) => {
    const g = new PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0);
    geos.push(g);
    const mesh = new Mesh(g, m);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set((r.x0 + r.x1) / 2, y, (r.z0 + r.z1) / 2);
    group.add(mesh);
    return mesh;
  };
  // the paths: one mesh, its stones in the world's own tiling (a stone 20 across) so the pieces meet in one pattern
  const path = mergeGeometries(PATHS.map((r) => {
    const g = new PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0).rotateX(-Math.PI / 2).translate((r.x0 + r.x1) / 2, 0.06, (r.z0 + r.z1) / 2);
    const pos = g.getAttribute('position'), uv = g.getAttribute('uv');
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 20, -pos.getZ(i) / 20);
    return g;
  }));
  geos.push(path);
  group.add(new Mesh(path, kit.lambert({ map: kit.tex('bug-path'), layer: 1 })));
  // the pond: its stone bank, its water (NH's: one small shader, opaque; its ripples move only while it's on screen)
  flat({ x0: POND.x0 - 3, x1: POND.x1 + 3, z0: POND.z0 - 3, z1: POND.z1 + 3 }, kit.lambert({ map: kit.tex('bug-path', [3, 2]), color: 0xd8d2c4, layer: 1 }), 0.07);
  const water = new ShaderMaterial({
    vertexShader: POND_VERT, fragmentShader: POND_FRAG,
    uniforms: { uTime, uNight, uHalf: { value: new Vector2((POND.x1 - POND.x0) / 2, (POND.z1 - POND.z0) / 2) } }
  });
  mats.push(water);
  flat(POND, water, POND_Y);
  const pondSphere = new Sphere(new Vector3((POND.x0 + POND.x1) / 2, POND_Y, (POND.z0 + POND.z1) / 2), Math.hypot(POND.x1 - POND.x0, POND.z1 - POND.z0) / 2);
  for (const s of SOIL) {
    const g = new CircleGeometry(s[2], 20);
    geos.push(g);
    const m = new Mesh(g, kit.lambert({ map: kit.tex('bug-soil', [1, 1]), layer: 2 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(s[0], 0.08, s[1]);
    group.add(m);
  }

  // ---- the trees (NH's oaks and a palm, the island's), the props, the flowers ----
  const tree = (name: string, at: Pt, s: number, yaw: number) => {
    const holder = new Group();
    holder.position.set(at[0], 0, at[1]);
    holder.rotation.y = yaw;
    holder.scale.setScalar(s);
    group.add(holder);
    void kit.island(name).then((g) => {
      if (!g || disposed) return;
      holder.add(g.scene.clone(true));
      kit.invalidate();
    });
  };
  OAKS.forEach((o, i) => tree('oak-summer', o, OAK_S, i * 1.7));
  tree('palm', PALM, PALM_S, 0.8);
  for (const [name, x, z, s, yaw] of PROPS) kit.prop(name, x, z, { s, yaw, parent: group });
  for (const [name, x, z] of FLOWERS) {
    const holder = new Group();
    holder.position.set(x, 0, z);
    group.add(holder);
    void kit.island(name).then((g) => {
      if (!g || disposed) return;
      holder.add(g.scene.clone(true));
      kit.invalidate();
    });
  }

  // ---- the display cases: a wooden stand, its soil, its glass, a twig and a stone in each ----
  const wood = kit.lambert({ color: 0x7a5636 });
  const soil = kit.lambert({ map: kit.tex('bug-soil', [1.5, 1]) });
  const frame = kit.lambert({ color: 0x4a3a2a });
  const glass = new MeshBasicMaterial({ color: 0xe8fff4, transparent: true, opacity: 0.14, depthWrite: false, side: DoubleSide });
  mats.push(glass);
  // (static: a mesh a material for all five, batcher)
  const batch = batcher(), at = new Matrix4();
  const box = (b: Box, m: Material) =>
    batch.add(new BoxGeometry(b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0), m, at.makeTranslation((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2));
  for (const [cx, cz] of CASES) {
    const pc = casePieces(cx, cz), g = pc.glass;
    box(pc.stand, wood);
    box(pc.soil, soil);
    batch.add(openBox(g.x1 - g.x0, g.y1 - g.y0, g.z1 - g.z0, ['-y']), glass, at.makeTranslation((g.x0 + g.x1) / 2, (g.y0 + g.y1) / 2, (g.z0 + g.z1) / 2));
    for (const f of pc.frame) box(f, frame);
  }
  geos.push(...batch.done(group, (m) => (m === glass ? 4 : 0)));
  for (const [x, z] of CASES) kit.prop('agave', x + CASE_AGAVE.dx, z + CASE_AGAVE.dz, { s: CASE_AGAVE.s, y: CASE.stand + 2, parent: group });

  // ---- the bugs ----
  const glow = glowTex();
  texs.push(glow);
  /** A part's material: its texture lit a little by itself (a firefly's glow); a wing part's flapping in the vertex
   *  shader about its model's hinge (world3d/wings.ts: the island's flap), by its bug's angle. */
  const bugMat = (map: Texture | null, glowy: boolean, hinge: Vector4 | null, flap: { value: number }) => {
    const m = new MeshLambertMaterial({ map, emissive: new Color(glowy ? 0xd8ff7a : 0xffffff), emissiveMap: glowy ? null : map, emissiveIntensity: glowy ? 0.4 : 0.25 });
    if (hinge) {
      const uFlap = { value: hinge };
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uFlap = uFlap;
        sh.uniforms.uFlapA = flap;
        sh.vertexShader = 'uniform vec4 uFlap;\nuniform float uFlapA;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n${flapGlsl('uFlapA')}`);
      };
      m.customProgramCacheKey = () => 'museum-bug-flap';
    }
    return m;
  };
  /** The bugs drawn (this hour's, and the last hour's fading out), by key. */
  const bugs = new Map<string, Bug>();
  /** A bug's fading (hourFader.ts: dithered only while it fades; its glow by its own opacity, write's). */
  const fadeTo = (b: Bug, k: number) => {
    b.fade = k;
    for (const m of b.mats) if (!(m instanceof SpriteMaterial)) fadeMaterial(m, k);
  };
  function add(sh: Shown, fadeIn: boolean) {
    const { sp, slot } = sh, hab = sp.tank as Habitat, key = `${sp.id}@${slot}`;
    const b: Bug = {
      sp, slot, key, mesh: null, geo: null, mats: [], glow: null, life: null, pose: pose(), flap: { value: 0 }, size: 0,
      seed: bugSeed(sp.id), sphere: new Sphere(), fade: fadeIn ? 0 : 1, dir: fadeIn ? 1 : 0
    };
    bugs.set(key, b);
    // (NH's museum one where it differs: the dung beetle with its ball, species.ts BUG_MUSEUM_MODEL)
    void (BUG_MUSEUM_MODEL[sp.id] ? kit.model(sp.id) : kit.critter('bugs', sp.id)).then((g) => {
      if (!g || disposed || bugs.get(key) !== b) return;
      // its parts (a beetle's wing cases, a bee's or a dragonfly's wings) as one geometry, one group a part
      const parts: Mesh[] = [];
      g.scene.traverse((o) => void ((o as Mesh).isMesh && parts.push(o as Mesh)));
      if (!parts.length) return;
      const plain = parts.map((m) => plainGeometry(g.scene, m));
      // (a part with no uv, the giant stag's, among parts with: zeros, so they merge; its material has no map)
      for (const p of plain) for (const q of plain) for (const [name, a] of Object.entries(q.attributes)) {
        if (!p.getAttribute(name)) p.setAttribute(name, new Float32BufferAttribute(new Float32Array(p.getAttribute('position').count * a.itemSize), a.itemSize));
      }
      const all = plain.length > 1 ? mergeGeometries(plain, true) : plain[0];
      // (the parts released once merged, and when they won't merge: nothing of this bug is drawn then)
      if (plain.length > 1) for (const p of plain) p.dispose();
      if (!all) return;
      all.computeBoundingBox();
      const bb = all.boundingBox!;
      all.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
      const size = { w: (bb.max.x - bb.min.x) * BUG_S, h: (bb.max.y - bb.min.y) * BUG_S, l: (bb.max.z - bb.min.z) * BUG_S };
      const life = bugLife(sp.id, hab, slot, b.seed, size);
      // its wings' hinge, from the parts as drawn (wings.ts wingHinge)
      const hinge = FLAPS.test(`critters/bugs/${sp.id}`) ? hingeOf(all, parts) : null;
      const mat = parts.map((m, k) => bugMat((m.material as { map?: Texture | null }).map ?? null, hab === 'drift', hinge && hinge.flaps[k] ? hinge.at : null, b.flap));
      const [cx, cy, cz, cr] = life.sphere;
      b.sphere.set(new Vector3(cx, cy, cz), cr);
      const mesh = new InstancedMesh(all, mat.length > 1 ? mat : mat[0], 1);
      mesh.boundingSphere = b.sphere;
      Object.assign(b, { mesh, geo: all, mats: mat, life, size: Math.max(size.w, size.l) });
      group.add(mesh);
      if (hab === 'drift') {
        const sm = new SpriteMaterial({ map: glow, transparent: true, depthWrite: false, blending: AdditiveBlending, color: 0xfff4a0 });
        b.mats.push(sm);
        b.glow = new Sprite(sm);
        b.glow.scale.setScalar(9);
        b.glow.userData.glowOf = sp.id;
        group.add(b.glow);
      }
      fadeTo(b, b.fade);
      life.at(performance.now(), 0, b.pose);
      write(b);
      kit.invalidate();
    });
  }
  function drop(b: Bug) {
    bugs.delete(b.key);
    b.mesh?.removeFromParent();
    b.glow?.removeFromParent();
    b.geo?.dispose();
    for (const m of b.mats) m.dispose();
  }
  /** The hour's bugs in (bugShow.ts): those it drops fade out and the new ones in where they're on screen, at once
   *  where not. */
  const hour = hourWatch(clock);
  function pick(seen: ((s: Sphere) => boolean) | null) {
    const want = bugsOnDisplay(list, hour.hour), keys = new Set(want.map((w) => `${w.sp.id}@${w.slot}`));
    for (const b of [...bugs.values()]) {
      if (keys.has(b.key)) {
        if (b.dir < 0) b.dir = 1;
      } else if (b.mesh && seen?.(b.sphere)) b.dir = -1;
      else drop(b);
    }
    for (const w of want) if (!bugs.has(`${w.sp.id}@${w.slot}`)) add(w, !!seen);
  }
  /** A model's wings' hinge (the shader's uFlap) from its merged parts: each part's own points (its group's). */
  function hingeOf(all: BufferGeometry, parts: Mesh[]): { at: Vector4; flaps: boolean[] } {
    const pos = all.getAttribute('position'), idx = all.index;
    const groups = all.groups.length ? all.groups : [{ start: 0, count: idx ? idx.count : pos.count }];
    const wp = groups.map((gr, k) => {
      const seen = new Set<number>(), out: number[] = [];
      for (let i = gr.start; i < gr.start + gr.count; i++) {
        const v = idx ? idx.getX(i) : i;
        if (seen.has(v)) continue;
        seen.add(v);
        out.push(pos.getX(v), pos.getY(v), pos.getZ(v));
      }
      return { pos: out, wing: /wing/i.test((parts[k]?.material as Material | undefined)?.name ?? '') };
    });
    const h = wingHinge(wp);
    return { at: new Vector4(h.x, h.y, h.root, h.ramp), flaps: h.flaps };
  }
  // the danglers' threads (a line from the branch above each: a dangler an oak, bugLife.ts slotsOf), two points each
  const threadsN = OAKS.length;
  const threadGeo = new BufferGeometry();
  threadGeo.setAttribute('position', new Float32BufferAttribute(new Float32Array(threadsN * 2 * 3), 3));
  geos.push(threadGeo);
  const threads = new LineSegments(threadGeo, new LineBasicMaterial({ color: 0xf2efe6, transparent: true, opacity: 0.7 }));
  mats.push(threads.material as Material);
  threads.frustumCulled = false;
  group.add(threads);

  // ---- where each is, each frame ----
  function write(b: Bug) {
    if (!b.mesh) return;
    const p = b.pose;
    // its head along f, its back toward u
    Z.set(p.fx, p.fy, p.fz);
    X.set(p.ux, p.uy, p.uz).cross(Z).normalize();
    Y.crossVectors(Z, X);
    M4.makeBasis(X, Y, Z);
    Q.setFromRotationMatrix(M4);
    S.setScalar(BUG_S);
    M4.compose(P.set(p.x, p.y, p.z), Q, S);
    b.mesh.setMatrixAt(0, M4);
    b.mesh.instanceMatrix.needsUpdate = true;
    b.flap.value = p.flap;
    if (b.glow) {
      b.glow.position.set(p.x, p.y + 1, p.z);
      (b.glow.material as SpriteMaterial).opacity = b.fade * (0.35 + 0.65 * uNight.value) * (0.55 + 0.45 * Math.sin(uTime.value * 2.6 + b.seed));
    }
  }
  const threadPos = threadGeo.getAttribute('position') as Float32BufferAttribute;
  pick(null);

  const blocks: Rect[] = [
    ...CASES.map(([x, z]) => ({ x0: x - CASE.w / 2, x1: x + CASE.w / 2, z0: z - CASE.d / 2, z1: z + CASE.d / 2 })),
    POND,
    ...OAKS.map(([x, z]) => ({ x0: x - 5, x1: x + 5, z0: z - 5, z1: z + 5 })),
    { x0: PALM[0] - 4, x1: PALM[0] + 4, z0: PALM[1] - 4, z1: PALM[1] + 4 },
    { x0: -140, x1: -100, z0: 48, z1: 76 }, { x0: -228, x1: -200, z0: -50, z1: -22 }, { x0: -104, x1: -68, z0: -48, z1: -12 },
    { x0: -154, x1: -126, z0: 76, z1: 100 }, { x0: -300, x1: -268, z0: -40, z1: -8 }, { x0: -300, x1: -256, z0: 44, z1: 74 }
  ];

  return {
    group,
    wing: 'bug',
    blocks,
    frame(t, dt, seen) {
      // (a new hour: a new pick)
      if (hour.tick(t)) pick(seen);
      let any = false, k = 0;
      // (deleting the one at hand while going through a Map is safe: nothing allocated)
      for (const b of bugs.values()) {
        // (off screen it rests: its room unseen, nothing of it is worked out; a fade there is over at once)
        const on = !!b.mesh && seen(b.sphere);
        if (b.dir) {
          fadeTo(b, fadeStep(b.fade, b.dir, dt, on));
          if (b.fade >= 1 && b.dir > 0) b.dir = 0;
          else if (b.fade <= 0 && b.dir < 0) {
            drop(b);
            continue;
          }
        }
        if (on && b.life) {
          b.life.at(t, dt, b.pose);
          write(b);
          any = true;
        }
        if (b.life && b.sp.tank === 'dangle' && k < threadsN) {
          const p = b.pose, i = k++;
          threadPos.setXYZ(i * 2, p.x, p.y + b.size * 0.4, p.z);
          threadPos.setXYZ(i * 2 + 1, p.x, 40, p.z);
        }
      }
      // (a thread with no dangler: none, under the floor)
      for (let i = k * 2; i < threadsN * 2; i++) threadPos.setXYZ(i, 0, -10, 0);
      // (the pond's ripples with it on screen, as a bug's wings)
      if (!any && !seen(pondSphere)) return false;
      uTime.value = t / 1000;
      threadPos.needsUpdate = true;
      return true;
    },
    pick(project, cx, cy) {
      let best: { id: string; d: number } | null = null;
      for (const b of bugs.values()) {
        if (!b.mesh || b.dir < 0) continue;
        const p = project(b.pose.x, b.pose.y + 1, b.pose.z);
        if (!p) continue;
        const d = Math.hypot(p[0] - cx, p[1] - cy);
        if (d < 30 + b.size && (!best || d < best.d)) best = { id: b.sp.id, d };
      }
      return best;
    },
    where(id) {
      // (one coming in before one going out: the same bug moved to another place)
      let b: Bug | undefined;
      for (const x of bugs.values()) if (x.sp.id === id && x.mesh && (!b || x.dir >= 0)) b = x;
      return b ? [b.pose.x, b.pose.y + 1, b.pose.z] : null;
    },
    shown: () => [...bugs.values()].filter((b) => b.mesh && b.dir >= 0).map((b) => b.sp.id),
    dither(on) {
      // (the bugs' fading programs compiled with the rest, for the hour's fades: only those settled)
      for (const b of bugs.values()) {
        if (b.dir) continue;
        for (const m of b.mats) if (!(m instanceof SpriteMaterial)) ditherMaterial(m, on);
      }
    },
    night(n) {
      uNight.value = n;
    },
    dispose() {
      disposed = true;
      for (const b of [...bugs.values()]) drop(b);
      group.removeFromParent();
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
      for (const x of texs) x.dispose();
    }
  };
}
