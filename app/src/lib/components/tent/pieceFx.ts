// What a room's piece does once tapped, drawn (tent/engine.ts; the families and the rules: toggles.ts): a screen's and
// a heater's glow, a fan's blades as a spinning blur (and its sway), a washer's rumble and drum, a tap's water and a
// bath's steam as a few soft points, a plasma ball's glow; the one-off moves (a wardrobe's door, a toy's rock, turn,
// shake, flip or hop; an instrument bobbing while it's played; a gadget's whir, wobble, beckon, ring or loop; a bin
// gulping what's tossed in) and the ♪, the confetti, bubbles or twinkles over it. NH's models are one mesh a material with no moving parts,
// so a fan's blades are a disc over them and a door is the piece's wiggle. The moving ones animate at the room's
// ambient rate (engine.ts AMBIENT_FPS), at most toggles.ts ACTIVE_MAX at once; a glow costs no frame.
import {
  Box3, BufferGeometry, CanvasTexture, CircleGeometry, DoubleSide, Float32BufferAttribute, Mesh, MeshBasicMaterial, Points, PointsMaterial,
  SRGBColorSpace, Sprite, SpriteMaterial, type MeshLambertMaterial, type Object3D
} from 'three';
import { cubicOut, smooth01 } from '#lib/math.ts';
import { PLAY_MS, TINTS, TOSS_MS, type Spark, type Switched, type ToyMove, type gadgetOf } from './toggles.ts';

/** A screen's own materials (their names in NH's models), else its glowing ones. */
const SCREENS = new Set(['mTv', 'mMonitor', 'mDisplay', 'mScreen']);
/** A heater's glow, a plasma ball's (linear rgb). */
const HEAT: readonly [number, number, number] = [1, 0.5, 0.2];
const PLASMA: readonly [number, number, number] = [0.75, 0.4, 1];

/** Where a fan's blades turn, a tap's water falls from and to, as NH's model has them (its own frame, model units):
 *  [x, y, z, r] a fan's disc, [x, y0, z, y1] water. The rest from the model (toggles.ts: a bath's water, a guard). */
const DISC: Readonly<Record<string, readonly [number, number, number, number]>> = {
  f3820: [0, 8.6, 2.9, 2.7],
  f3431: [0, 0.4, 5.6, 3.1],
  f957: [0, 0, 1.8, 2.7]
};
const WATER: Readonly<Record<string, readonly [number, number, number, number]>> = {
  f1229: [0, 9.6, -1.2, 7.2],
  f13591: [0, 10.2, -2.6, 8.2],
  f4015: [0, 17.5, -3.4, 0.6],
  f4017: [0, 3.5, 3.4, -9],
  f7230: [0, 18, 1.5, 0.6],
  f1631: [0, 7.1, 2.7, 0.3]
};
/** Floor fans sway (NH's oscillate); the ceiling fan turns whole. */
const SWAY = new Set(['f3820', 'f2736', 'f3431']);
const WHOLE = new Set(['f13156']);

export interface PieceFx {
  fam: Switched;
  on: boolean;
  /** Its glowing materials (own copies): a screen's, a heater's. */
  glow: MeshLambertMaterial[];
  /** A fan's blur or a washer's drum, turning. */
  disc: Mesh | null;
  /** Water or steam. */
  pts: Points | null;
  /** The points' source: x, y, z, then a fall's end (y) or a rise's spread (x, z half extents). */
  src: [number, number, number, number, number];
  dispose(): void;
}

let bladeTex: CanvasTexture | null = null, swirlTex: CanvasTexture | null = null, puffTex: CanvasTexture | null = null, noteTex: CanvasTexture | null = null;
const canvasTex = (draw: (g: CanvasRenderingContext2D, n: number) => void, n = 128): CanvasTexture => {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  draw(c.getContext('2d')!, n);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
};
/** A fan's blades in motion: three soft streaks round a hub. */
const blades = () => (bladeTex ??= canvasTex((g, n) => {
  const c = n / 2;
  // (the blur of the whole sweep, the streaks over it)
  g.fillStyle = 'rgba(235,235,235,0.5)';
  g.beginPath();
  g.arc(c, c, c - 2, 0, Math.PI * 2);
  g.fill();
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const gr = g.createRadialGradient(c, c, n * 0.06, c, c, c);
    gr.addColorStop(0, 'rgba(240,240,240,0.9)');
    gr.addColorStop(1, 'rgba(240,240,240,0.15)');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(c, c);
    g.arc(c, c, c - 2, a, a + 0.9);
    g.closePath();
    g.fill();
  }
  g.fillStyle = 'rgba(90,90,90,0.9)';
  g.beginPath();
  g.arc(c, c, n * 0.08, 0, Math.PI * 2);
  g.fill();
}));
/** A washer's tumbling wash: suds swirling. */
const swirl = () => (swirlTex ??= canvasTex((g, n) => {
  const c = n / 2;
  g.strokeStyle = 'rgba(200,230,255,0.85)';
  g.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    g.lineWidth = n * 0.07;
    g.beginPath();
    g.arc(c, c, c * (0.35 + 0.15 * (i % 2)), (i * Math.PI) / 2, (i * Math.PI) / 2 + 1.1);
    g.stroke();
  }
}));
const puff = () => (puffTex ??= canvasTex((g, n) => {
  const gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, n, n);
}, 32));
const note = () => (noteTex ??= canvasTex((g, n) => {
  g.font = `bold ${n * 0.8}px sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = n * 0.08;
  g.strokeStyle = '#fff8e6';
  g.strokeText('♪', n / 2, n / 2);
  g.fillStyle = '#5a7fd0';
  g.fillText('♪', n / 2, n / 2);
}, 64));

const discGeo = new CircleGeometry(1, 20);
let bladeMat: MeshBasicMaterial | null = null, swirlMat: MeshBasicMaterial | null = null;
/** The module's shared textures, disc and materials disposed as a room's renderer goes (world3d/stage.ts's WHITE: three's
 *  dispose listener on each held the renderer that drew it, the room's canvas and context, till the next room drew
 *  them: leaks.spec's 2 contexts a room). Safe: a live renderer that draws them uploads them again. */
export function releaseShared(): void {
  for (const r of [bladeTex, swirlTex, puffTex, noteTex, bladeMat, swirlMat, discGeo]) r?.dispose();
}

/** The body's meshes by material name, with their bounds in the body's frame (the body not yet placed). */
function partsOf(body: Object3D): { mesh: Mesh; mat: MeshLambertMaterial; box: Box3 }[] {
  body.updateMatrixWorld(true);
  const out: { mesh: Mesh; mat: MeshLambertMaterial; box: Box3 }[] = [];
  body.traverse((n) => {
    const m = n as Mesh;
    if (!m.isMesh || Array.isArray(m.material)) return;
    m.geometry.computeBoundingBox();
    out.push({ mesh: m, mat: m.material as MeshLambertMaterial, box: m.geometry.boundingBox!.clone().applyMatrix4(m.matrixWorld) });
  });
  return out;
}

/** A switched piece's drawing, made once its model is in (`body`: its own clone, not yet placed; `root`: its spot's
 *  group; `lit`: its glowing materials already its own: engine.ts, a lamp's). */
export function fxOf(fam: Switched, item: string, body: Object3D, root: Object3D, lit: MeshLambertMaterial[]): PieceFx {
  const parts = partsOf(body), all = new Box3();
  for (const p of parts) all.union(p.box);
  const own = (p: { mesh: Mesh; mat: MeshLambertMaterial }) => {
    if (lit.includes(p.mat)) return p.mat;
    const c = p.mat.clone();
    p.mesh.material = c;
    return c;
  };
  const glow: MeshLambertMaterial[] = [];
  const made: MeshLambertMaterial[] = [];
  if (fam === 'screen' || fam === 'heater' || fam === 'glow') {
    const named = parts.filter((p) => SCREENS.has(p.mat.name));
    const fabric = parts.filter((p) => p.mat.emissiveMap && p.mat.name === 'mReFabric');
    for (const p of named.length ? named : fabric.length ? fabric : parts.filter((q) => q.mat.emissiveMap)) {
      const m = own(p);
      if (!lit.includes(m)) made.push(m);
      glow.push(m);
    }
  }
  let disc: Mesh | null = null, pts: Points | null = null;
  const src: PieceFx['src'] = [0, 0, 0, 0, 0];
  if (fam === 'fan' && !WHOLE.has(item)) {
    const guard = parts.find((p) => p.mat.name === 'mGuard')?.box;
    const d = DISC[item] ?? (guard ? [(guard.min.x + guard.max.x) / 2, (guard.min.y + guard.max.y) / 2, guard.max.z - 0.15, 0.47 * Math.min(guard.max.x - guard.min.x, guard.max.y - guard.min.y)] : [0, all.max.y * 0.75, all.max.z * 0.6, 2.5]);
    disc = new Mesh(discGeo, (bladeMat ??= new MeshBasicMaterial({ map: blades(), transparent: true, opacity: 0.9, depthWrite: false, side: DoubleSide })));
    disc.position.set(d[0], d[1], d[2]);
    disc.scale.setScalar(d[3]);
  }
  if (fam === 'washer') {
    const win = parts.find((p) => p.mat.name === 'mWindow')?.box;
    if (win) {
      disc = new Mesh(discGeo, (swirlMat ??= new MeshBasicMaterial({ map: swirl(), transparent: true, opacity: 0.55, depthWrite: false })));
      disc.position.set((win.min.x + win.max.x) / 2, (win.min.y + win.max.y) / 2, win.max.z + 0.05);
      disc.scale.setScalar(0.42 * Math.min(win.max.x - win.min.x, win.max.y - win.min.y));
    }
  }
  if (disc) {
    disc.visible = false;
    disc.renderOrder = 2;
    body.add(disc);
  }
  if (fam === 'water' || fam === 'steam') {
    const n = fam === 'water' ? 16 : 10;
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('color', new Float32BufferAttribute(new Float32Array(n * 4), 4));
    pts = new Points(g, new PointsMaterial({
      map: puff(), size: fam === 'water' ? 1.5 : 12, transparent: true, depthWrite: false, vertexColors: true, sizeAttenuation: true,
      color: fam === 'water' ? 0xb4dcff : 0xffffff
    }));
    pts.frustumCulled = false;
    pts.visible = false;
    pts.renderOrder = 3;
    if (fam === 'water') {
      const w = WATER[item] ?? [(all.min.x + all.max.x) / 2, all.max.y * 0.72, all.min.z + (all.max.z - all.min.z) * 0.3, all.max.y * 0.5];
      src.splice(0, 5, w[0], w[1], w[2], w[3], 0);
    } else {
      const wb = parts.find((p) => p.mat.name === 'mWater')?.box;
      const b = wb ?? all, k = wb ? 0.35 : 0.2;
      src.splice(0, 5, (b.min.x + b.max.x) / 2, wb ? wb.max.y : all.max.y * (lit.length || item === 'f1836' ? 1 : 0.9), (b.min.z + b.max.z) / 2, (b.max.x - b.min.x) * k, (b.max.z - b.min.z) * k);
    }
    root.add(pts);
  }
  return {
    fam, on: false, glow, disc, pts, src,
    dispose() {
      for (const m of made) m.dispose();
      if (pts) {
        pts.removeFromParent();
        pts.geometry.dispose();
        (pts.material as PointsMaterial).dispose();
      }
      disc?.removeFromParent();
    }
  };
}

/** On or off (a screen on channel `ch`): its glow, its disc shown. `lamp`: its glow's strength is the lamp's (a light
 *  too: engine.ts fades it), only its tint set here. */
export function setOn(fx: PieceFx, on: boolean, ch: number, lamp: (m: MeshLambertMaterial) => boolean): void {
  fx.on = on;
  const tint = fx.fam === 'screen' ? TINTS[ch % TINTS.length] : fx.fam === 'glow' ? PLASMA : HEAT;
  for (const m of fx.glow) {
    m.emissive.setRGB(tint[0], tint[1], tint[2]);
    if (!lamp(m)) m.emissiveIntensity = on ? (m.emissiveMap ? 1.3 : 0.55) : 0;
  }
  if (fx.disc) fx.disc.visible = on;
  if (fx.pts && !on) fx.pts.visible = false;
}

/** A hash of i in 0…1 (the points' own offsets: the same each frame, no random). */
const h1 = (i: number) => ((Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1;

/** One ambient frame of a moving piece at `t` (ms): the disc turning, the body swaying or rumbling, the points. */
export function stepFx(fx: PieceFx, item: string, body: Object3D, t: number): void {
  if (fx.fam === 'fan') {
    if (WHOLE.has(item)) body.rotation.y = t * 0.004;
    else if (SWAY.has(item)) body.rotation.y = 0.45 * Math.sin(t / 1500);
    if (fx.disc) fx.disc.rotation.z = -t * 0.011;
  } else if (fx.fam === 'washer') {
    body.position.x = 0.07 * Math.sin(t * 0.09);
    body.rotation.z = 0.008 * Math.sin(t * 0.053);
    if (fx.disc) fx.disc.rotation.z = -t * 0.006;
  } else if (fx.pts) {
    const pos = fx.pts.geometry.getAttribute('position') as Float32BufferAttribute, col = fx.pts.geometry.getAttribute('color') as Float32BufferAttribute;
    const n = pos.count, [x, y, z, a, b] = fx.src;
    for (let i = 0; i < n; i++) {
      if (fx.fam === 'water') {
        // a thin stream falling, quicker as it goes
        const k = (t / 520 + i / n) % 1;
        pos.setXYZ(i, x + (h1(i) - 0.5) * 0.35, y - (y - a) * k * k, z + (h1(i + 9) - 0.5) * 0.35);
        col.setXYZW(i, 1, 1, 1, 0.9 - 0.4 * k);
      } else {
        // steam rising off it, drifting and thinning
        const k = (t / 2600 + i / n) % 1, sx = (h1(i) - 0.5) * 2, sz = (h1(i + 5) - 0.5) * 2;
        pos.setXYZ(i, x + sx * a + Math.sin(t / 900 + i) * 0.6 * k, y + 0.5 + 7.5 * k, z + sz * b);
        const f = Math.sin(Math.PI * k);
        col.setXYZW(i, 1, 1, 1, f * 0.55);
      }
    }
    pos.needsUpdate = col.needsUpdate = true;
    fx.pts.visible = true;
  }
}

/** A one-off move: a wardrobe's or a fridge's door, a toy's, an instrument played (its own beat), a gadget's
 *  (toggles.ts gadgetOf), a bin's gulp (late: what's tossed lands in it). */
export type Move = 'door' | ToyMove | 'play' | ReturnType<typeof gadgetOf>['move'] | 'gulp';
export interface Reaction {
  move: Move;
  t0: number;
  ms: number;
}
const MOVE_MS: Record<Move, number> = {
  door: 760, sway: 2400, rock: 2000, spin: 1600, shake: 800, flip: 1500, hop: 900, play: PLAY_MS,
  rumble: 1400, pop: 700, beckon: 2200, wobble: 2400, ring: 1600, fly: 3200, circle: 2800, shimmer: 2400, gulp: TOSS_MS
};
/** Where in a toss the thing lands in the bin (0…1 of TOSS_MS: playPose.ts lets go at 0.42). */
const LAND_K = 0.55;
export const reaction = (move: Move, t0: number): Reaction => ({ move, t0, ms: MOVE_MS[move] });

/** The body moved by a reaction `k` (0…1) of the way, `h` the piece's height: false once it's over. Adds to what an
 *  ambient frame set (call it after stepFx, or after `still`). */
export function stepReaction(r: Reaction, body: Object3D, h: number, t: number): boolean {
  const k = (t - r.t0) / r.ms;
  if (k >= 1) return false;
  const fade = 1 - k;
  switch (r.move) {
    case 'door': {
      // the door pulled open and let go: a wobble about its hinge side, the front bulging a little
      const w = Math.sin(k * Math.PI * 5) * fade;
      body.rotation.y += 0.07 * w;
      body.scale.x *= 1 + 0.035 * w;
      body.scale.z *= 1 + 0.05 * Math.max(0, w);
      break;
    }
    case 'sway':
      body.rotation.z += 0.14 * Math.sin(k * Math.PI * 9) * Math.sqrt(fade);
      break;
    case 'rock':
      body.rotation.x += 0.2 * Math.sin(k * Math.PI * 6) * fade;
      break;
    case 'spin':
      body.rotation.y += Math.PI * 2 * cubicOut(k);
      break;
    case 'shake':
      body.position.x += 0.45 * Math.sin(k * Math.PI * 16) * fade;
      break;
    case 'flip': {
      // turned over (its glass's sand running the other way) and back again, lifted so it stays on its spot
      const a = Math.PI * smooth01(k < 0.5 ? k * 2.2 : (1 - k) * 2.2);
      body.rotation.z += a;
      body.position.y += h * (1 - Math.cos(a)) * 0.5;
      break;
    }
    case 'hop': {
      const s = Math.sin(((k * 2) % 1) * Math.PI);
      body.position.y += 1.6 * s * fade;
      body.scale.y *= 1 + 0.08 * s - 0.06 * (1 - s) * fade;
      break;
    }
    case 'play': {
      const s = Math.abs(Math.sin((t - r.t0) / 160));
      body.scale.y *= 1 + 0.025 * s * Math.min(1, fade * 6);
      break;
    }
    case 'rumble':
      // a machine's whir: a fine buzz, a little lift and settle
      body.position.x += 0.12 * Math.sin(k * Math.PI * 40) * Math.sqrt(fade);
      body.position.y += 0.08 * Math.abs(Math.sin(k * Math.PI * 28)) * fade;
      break;
    case 'pop': {
      // squashed, then out it bursts
      const s = k < 0.3 ? -smooth01(k / 0.3) : Math.sin(((k - 0.3) / 0.7) * Math.PI * 2) * (1 - k) * 1.4;
      body.scale.y *= 1 + 0.12 * s;
      body.scale.x *= 1 - 0.06 * s;
      body.scale.z *= 1 - 0.06 * s;
      break;
    }
    case 'beckon':
      // a lucky cat's paw (a water bird's dip): bowing forward three times
      body.rotation.x += 0.16 * Math.max(0, Math.sin(k * Math.PI * 6)) * Math.min(1, fade * 3);
      break;
    case 'wobble': {
      // a dharma knocked: round and round on its round bottom, settling
      const a = 0.22 * fade * fade, w = k * Math.PI * 10;
      body.rotation.x += a * Math.sin(w);
      body.rotation.z += a * Math.cos(w);
      break;
    }
    case 'ring':
      // a bell swung to and fro, quick
      body.rotation.z += 0.18 * Math.sin(k * Math.PI * 12) * fade;
      break;
    case 'fly': {
      // up off its spot, a round in the air, back down
      const up = smooth01(Math.min(1, k * 5)) * smooth01(Math.min(1, (1 - k) * 5)), a = cubicOut(k) * Math.PI * 2;
      body.position.y += 7 * up;
      body.position.x += 4 * Math.sin(a) * up;
      body.position.z += 4 * (1 - Math.cos(a)) * up;
      body.rotation.y += a * 2;
      body.rotation.z += 0.15 * up;
      break;
    }
    case 'circle':
      // running round its track: a chug and a little lean
      body.position.y += 0.1 * Math.abs(Math.sin(k * Math.PI * 24)) * fade;
      body.rotation.z += 0.02 * Math.sin(k * Math.PI * 6) * fade;
      break;
    case 'shimmer':
      // a tree's lights twinkling: a soft breath
      body.scale.y *= 1 + 0.015 * Math.sin(k * Math.PI * 4) * fade;
      break;
    case 'gulp': {
      // what's tossed lands in: a bounce and a rattle
      const u = (k - LAND_K) / (1 - LAND_K);
      if (u > 0) {
        const s = Math.sin(u * Math.PI * 3) * (1 - u);
        body.scale.y *= 1 - 0.08 * s;
        body.rotation.z += 0.05 * Math.sin(u * Math.PI * 9) * (1 - u);
      }
      break;
    }
  }
  return true;
}

/** The body back at rest (its own frame: no move). */
export function still(body: Object3D): void {
  body.position.set(0, 0, 0);
  body.rotation.set(0, 0, 0);
}

/** The ♪ rising over an instrument while it's played: a few sprites, each its own fade. */
export function notesOf(parent: Object3D) {
  const list = Array.from({ length: 3 }, () => {
    const s = new Sprite(new SpriteMaterial({ map: note(), transparent: true, depthWrite: false }));
    s.scale.setScalar(2.6);
    s.visible = false;
    s.renderOrder = 4;
    parent.add(s);
    return s;
  });
  /** Over (x, y, z) from t0 for `ms`: a note every NOTE_MS, each rising and fading over RISE_MS. False once done. */
  return {
    step(at: readonly [number, number, number], t0: number, ms: number, t: number): boolean {
      const RISE = 1500, EVERY = 520;
      let any = false;
      list.forEach((s, i) => {
        // the newest notes: each slot the next of every third
        const n = Math.floor((t - t0) / EVERY), j = n - ((((n - i) % 3) + 3) % 3), born = t0 + j * EVERY, u = (t - born) / RISE;
        const ok = j >= 0 && born < t0 + ms && u >= 0 && u < 1;
        s.visible = ok;
        if (!ok) return;
        any = true;
        s.position.set(at[0] + Math.sin(j * 2.1) * 2, at[1] + 1 + 6 * u, at[2] + Math.cos(j * 1.7));
        (s.material as SpriteMaterial).opacity = Math.min(1, 4 * (1 - u));
      });
      return any || t < t0 + ms;
    },
    hide: () => list.forEach((s) => (s.visible = false)),
    dispose() {
      for (const s of list) {
        s.removeFromParent();
        (s.material as SpriteMaterial).dispose();
      }
    }
  };
}

/** The confetti's colours (linear rgb): coral, sun, leaf, sky, lilac. */
const CONFETTI: readonly (readonly [number, number, number])[] = [[1, 0.45, 0.4], [1, 0.82, 0.3], [0.45, 0.85, 0.45], [0.4, 0.7, 1], [0.8, 0.55, 1]];
const SPARK_MS: Record<Exclude<Spark, 'notes'>, number> = { confetti: 1800, bubbles: 2600, twinkle: 2400 };
/** A flourish over a piece (one at a time on this phone, as the ♪): confetti or bubbles out of its top, twinkles over
 *  its body; one Points, one draw. */
export function sparksOf(parent: Object3D) {
  const N = 28, g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(new Float32Array(N * 3), 3));
  g.setAttribute('color', new Float32BufferAttribute(new Float32Array(N * 4), 4));
  const mat = new PointsMaterial({ map: puff(), size: 1.4, transparent: true, depthWrite: false, vertexColors: true, sizeAttenuation: true });
  const pts = new Points(g, mat);
  pts.frustumCulled = false;
  pts.visible = false;
  pts.renderOrder = 4;
  parent.add(pts);
  let cur: { kind: Exclude<Spark, 'notes'>; at: readonly [number, number, number]; h: number; w: number; t0: number } | null = null;
  return {
    /** From t0 over (x, y, z), a piece's foot, `h` high and `w` wide (model units). */
    start(kind: Exclude<Spark, 'notes'>, at: readonly [number, number, number], h: number, w: number, t0: number) {
      cur = { kind, at, h, w, t0 };
      // (confetti: crisp little squares; bubbles and lights: soft dots)
      mat.size = kind === 'bubbles' ? 4.5 : kind === 'twinkle' ? 4 : 2.2;
      mat.map = kind === 'confetti' ? null : puff();
      // (a tree's lights over its needles, never hidden in them)
      mat.depthTest = kind !== 'twinkle';
      mat.needsUpdate = true;
    },
    /** A frame at `t`: false once it's over. */
    step(t: number): boolean {
      if (!cur) return false;
      const { kind, at, h, w, t0 } = cur, u = (t - t0) / SPARK_MS[kind];
      if (u >= 1) {
        pts.visible = false;
        cur = null;
        return false;
      }
      const pos = g.getAttribute('position') as Float32BufferAttribute, col = g.getAttribute('color') as Float32BufferAttribute, s = (t - t0) / 1000;
      for (let i = 0; i < N; i++) {
        const a = h1(i) * Math.PI * 2, r = h1(i + 31), fade = Math.min(1, (1 - u) * 3);
        if (kind === 'confetti') {
          // thrown up and out, falling back, fluttering
          const v = 9 + 7 * h1(i + 7), out = (3 + 4 * r) * Math.min(1, s * 2);
          pos.setXYZ(i, at[0] + Math.cos(a) * out + Math.sin(s * 9 + i) * 0.3, at[1] + h + v * s - 9 * s * s, at[2] + Math.sin(a) * out);
          const c = CONFETTI[i % CONFETTI.length];
          col.setXYZW(i, c[0], c[1], c[2], fade);
        } else if (kind === 'bubbles') {
          // rising slowly, each at its own time, wobbling, gone at the top
          const k = (u * 1.6 + h1(i + 3)) % 1;
          pos.setXYZ(i, at[0] + Math.cos(a) * (1 + 3 * r * k) + Math.sin(s * 3 + i) * 0.5, at[1] + h + 12 * k, at[2] + Math.sin(a) * (1 + 3 * r * k));
          col.setXYZW(i, 0.8, 0.93, 1, 0.75 * Math.sin(Math.PI * k) * fade);
        } else {
          // lights blinking all over it, each to its own beat
          pos.setXYZ(i, at[0] + (h1(i + 11) - 0.5) * w, at[1] + h * (0.15 + 0.85 * h1(i + 17)), at[2] + (h1(i + 23) - 0.5) * w * 0.6 + w * 0.15);
          const b = 0.5 + 0.5 * Math.sin(s * (6 + 4 * r) + i), c = i % 3 ? CONFETTI[1] : CONFETTI[i % CONFETTI.length];
          col.setXYZW(i, c[0], c[1], c[2], (0.25 + 0.75 * b) * Math.min(fade, u * 8));
        }
      }
      pos.needsUpdate = col.needsUpdate = true;
      pts.visible = true;
      return true;
    },
    hide() {
      cur = null;
      pts.visible = false;
    },
    /** What's showing now (the test hook's). */
    kind: () => cur?.kind ?? null,
    dispose() {
      pts.removeFromParent();
      g.dispose();
      mat.dispose();
    }
  };
}
