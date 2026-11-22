// What a room's piece does once tapped, drawn (tent/engine.ts; the families and the rules: toggles.ts): a screen's and
// a heater's glow, a fan's blades as a spinning blur (and its sway), a washer's rumble and drum, a tap's water and a
// bath's steam as a few soft points; the one-off moves (a wardrobe's door, a toy's rock, turn, shake, flip or hop; an
// instrument bobbing while it's played) and the ♪ over it. NH's models are one mesh a material with no moving parts,
// so a fan's blades are a disc over them and a door is the piece's wiggle. The moving ones animate at the room's
// ambient rate (engine.ts AMBIENT_FPS), at most toggles.ts ACTIVE_MAX at once; a glow costs no frame.
import {
  Box3, BufferGeometry, CanvasTexture, CircleGeometry, DoubleSide, Float32BufferAttribute, Mesh, MeshBasicMaterial, Points, PointsMaterial,
  SRGBColorSpace, Sprite, SpriteMaterial, type MeshLambertMaterial, type Object3D
} from 'three';
import { cubicOut, smooth01 } from '#lib/math.ts';
import { PLAY_MS, TINTS, type Switched, type ToyMove } from './toggles.ts';

/** A screen's own materials (their names in NH's models), else its glowing ones. */
const SCREENS = new Set(['mTv', 'mMonitor', 'mDisplay', 'mScreen']);
/** A heater's glow (linear rgb). */
const HEAT: readonly [number, number, number] = [1, 0.5, 0.2];

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
  if (fam === 'screen' || fam === 'heater') {
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
  const tint = fx.fam === 'screen' ? TINTS[ch % TINTS.length] : HEAT;
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

/** A one-off move: a wardrobe's or a fridge's door, a toy's, an instrument played (its own beat). */
export type Move = 'door' | ToyMove | 'play';
export interface Reaction {
  move: Move;
  t0: number;
  ms: number;
}
const MOVE_MS: Record<Move, number> = { door: 760, sway: 2400, rock: 2000, spin: 1600, shake: 800, flip: 1500, hop: 900, play: PLAY_MS };
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
