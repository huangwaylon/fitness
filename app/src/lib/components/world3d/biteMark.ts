// The bite's 「！」 on the 3D island (docs/design.md "Fishing"): NH's red-and-cream mark popped up over an angler's head
// the moment a fish bites, held while the bite lasts, popped out at the reel or the miss. One small quad a villager
// (made the first time it bites, then shown and hidden: nothing made a frame), anchored on its head as it's posed now:
//   where    over the head's top (villager3d crown: the rest pose's highest point, carried by the head bone), the head
//            taken as the ball between the bone and its top, so seated it's lower and lying it's over the head's side,
//            never off where a standing villager's head would be;
//   bend     its anchor is bent with the island (bend.ts bendW, in its own vertex shader) and only its anchor: the quad
//            is laid out from there in the camera's plane, so it sits on the curved world with the head and never
//            leans back with the curve as a bent quad would;
//   facing   in the camera's plane (a billboard turned with the camera; the island's camera never rolls, so its up is
//            the screen's up): upright and square on at every pitch. (A cylindrical one, upright in the world, would
//            be squashed to half its height by the camera's 40–63° look down.)
//   size     NH's, in the world (MARK_U, about half a head across: it grows as a pinch zooms in, with the head), held to
//            MARK_PX on screen: at the widest zoom the world size is 19 px, too small to read at a glance; fully in
//            it's 60, bigger than it needs. (A constant screen size would sit small on a zoomed-in head.)
//   on top   drawn last (renderOrder) with no depth test, as NH's: never under the head, a hat, a tree or a roof in
//            front. It's the cue to tap: hidden, the bite would be missed.
// Its pop is the 2D one's (Critters.svelte: an overshoot in, POP_IN_MS), a little hop while held, a quick pop out.
import {
  CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, Vector3, type Camera, type Object3D, type Texture, type WebGLProgramParametersWithUniforms
} from 'three';
import { BEND_GLSL, bendU } from './bend.ts';

/** Its height (and width) in the world (u): ~half a villager's head across (NH's). */
export const MARK_U = 20;
/** Held to this on screen (CSS px): read at a glance at the widest zoom, never a blot fully in. */
export const MARK_PX = { min: 30, max: 52 } as const;
/** Its bottom this far over the head's top (u). */
export const OVER_U = 3;
/** The pop in (CSS's cubic-bezier(.3, 1.6, .5, 1) over 320 ms: Critters' 2D one), its hop's period and height (a part of
 *  its size), and its pop out (ms). */
export const POP_IN_MS = 320, HOP_MS = 640, POP_OUT_MS = 140;
const HOP_K = 0.08;
/** The pop in's scale at k (0…1): up past its size and back (an ease-out-back: ~20 % over at two thirds in). */
export const popIn = (k: number) => (k <= 0 ? 0 : k >= 1 ? 1 : 1 + 3 * (k - 1) ** 3 + 2 * (k - 1) ** 2);

type P3 = { x: number; y: number; z: number };
/** The mark's anchor (its bottom's middle) over a head: the head bone at `head`, its top at `top` (three's space, as
 *  posed). The head is the ball from the bone to its top: the anchor is OVER_U over the ball's highest point. Standing
 *  that's over its top; lying, over its side (the ball's middle, up by its radius), not off past its crown. */
export function overHead(head: P3, top: P3, out: Vector3): Vector3 {
  const r = Math.hypot(top.x - head.x, top.y - head.y, top.z - head.z) / 2;
  return out.set((head.x + top.x) / 2, (head.y + top.y) / 2 + r + OVER_U, (head.z + top.z) / 2);
}

/** Its size in the world (u) at a view depth: MARK_U, held to MARK_PX on screen (`focal`: px a world unit at depth 1). */
export function markSize(depth: number, focal: number): number {
  if (!(depth > 0) || !(focal > 0)) return MARK_U;
  const px = Math.min(MARK_PX.max, Math.max(MARK_PX.min, (MARK_U * focal) / depth));
  return (px * depth) / focal;
}

const vw = new Vector3();
/** Where its shader puts it (the CPU's mirror of MARK_VERTEX): its anchor bent (`bent`: three's space), in the camera's
 *  view, its quad of size `s` laid out there in the view's plane; the four corners (bottom left, bottom right, top
 *  right, top left) and the bottom's and top's middles, in normalised device coordinates, written to `out` (six). */
export function markCorners(bent: Vector3, s: number, camera: Camera, out: Vector3[]): Vector3[] {
  vw.copy(bent).applyMatrix4(camera.matrixWorldInverse);
  const at = [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1], [0, 0], [0, 1]] as const;
  for (let i = 0; i < 6; i++) out[i].set(vw.x + at[i][0] * s, vw.y + at[i][1] * s, vw.z).applyMatrix4(camera.projectionMatrix);
  return out;
}

/** three's project_vertex for the mark: its object's origin (its anchor) through the model matrix and the island's bend,
 *  into the view; the quad (its bottom's middle at the origin, 1 tall) laid out from there in the view's plane, as big
 *  as its scale. */
const MARK_VERTEX = /* glsl */ `
float markS = length( modelMatrix[ 0 ].xyz );
vec4 mvPosition = viewMatrix * bendW( modelMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ) );
mvPosition.xy += transformed.xy * markS;
gl_Position = projectionMatrix * mvPosition;
`;

/** NH's 「！」 drawn once (Critters.svelte's .bang): a cream disc in a red rim, a red ！, a soft drop under it. */
function art(): Texture {
  const n = 160, c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d')!, m = n / 2, r = n * 0.44;
  g.fillStyle = 'rgba(150, 110, 70, 0.35)';
  g.beginPath();
  g.arc(m, m + n * 0.04, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#F2484A';
  g.beginPath();
  g.arc(m, m, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#FFFDF6';
  g.beginPath();
  g.arc(m, m, r * 0.86, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#E8383A';
  const bw = r * 0.26;
  g.beginPath();
  g.roundRect(m - bw / 2, m - r * 0.6, bw, r * 0.78, bw / 2);
  g.fill();
  g.beginPath();
  g.arc(m, m + r * 0.44, bw * 0.55, 0, Math.PI * 2);
  g.fill();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export interface MarkState {
  /** Drawn now (popping in, held or popping out). */
  shown: boolean;
  /** Its anchor (its bottom's middle, the hop on it), three's space unbent, and bent. */
  at: [number, number, number];
  bent: [number, number, number];
  /** Its size now in the world (u: the pop's scale on it) and held (its clamp's, u and px). */
  s: number;
  size: number;
  px: number;
  /** Its bottom's and its top's middles, its left and right edges (canvas px). */
  bottom: [number, number];
  top: [number, number];
  left: number;
  right: number;
}

export interface BiteMarks {
  /** A villager's mark over its head at `at` (three's space, unbent: overHead), or taken away (null: it pops out). */
  set(slot: string, at: Vector3 | null): void;
  /** One frame, after the camera's set: true while one is drawn (a frame to follow). `focal`: px a world unit at depth 1;
   *  `w`, `h`: the canvas (CSS px). */
  frame(t: number, camera: Camera, focal: number, w: number, h: number): boolean;
  /** The e2e's: a villager's mark as last drawn, or null (never shown). */
  state(slot: string): MarkState | null;
  dispose(): void;
}

interface Mark {
  mesh: Mesh;
  /** Its anchor (three's, unbent), whether it's wanted, when it popped in and when it was let go (ms; NaN: held). */
  at: Vector3;
  on: boolean;
  t0: number;
  end: number;
  /** Its size held (u: the clamp's, before the pop's scale). */
  size: number;
}

/** The island's marks, `add`ed to its scene (bent there: the mark's material is bent already, its own way). */
export function createBiteMarks(add: (o: Object3D) => () => void): BiteMarks {
  const geo = new PlaneGeometry(1, 1).translate(0, 0.5, 0);
  let tex: Texture | null = null, mat: MeshBasicMaterial | null = null;
  const marks = new Map<string, Mark & { off: () => void }>();
  const bent = new Vector3(), view = new Vector3(), ndc = Array.from({ length: 6 }, () => new Vector3());

  /** One material for all of them (its size is each mesh's scale): bent at its anchor only (MARK_VERTEX). */
  function material(): MeshBasicMaterial {
    if (mat) return mat;
    tex = art();
    const m = new MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false });
    // (bent: engine.ts add() leaves it be, the island's bend on its anchor as on everything)
    m.userData.bent = true;
    m.onBeforeCompile = (s: WebGLProgramParametersWithUniforms) => {
      s.uniforms.uBendZ = bendU.uBendZ;
      s.uniforms.uBendR = bendU.uBendR;
      s.vertexShader = BEND_GLSL + s.vertexShader.replace('#include <project_vertex>', MARK_VERTEX);
    };
    m.customProgramCacheKey = () => 'bite-mark';
    return (mat = m);
  }

  function set(slot: string, at: Vector3 | null) {
    let k = marks.get(slot);
    if (!at) {
      if (k?.on) (k.on = false), (k.end = performance.now());
      return;
    }
    if (!k) {
      const mesh = new Mesh(geo, material());
      mesh.name = `bite-mark:${slot}`;
      mesh.renderOrder = 1000;
      mesh.visible = false;
      mesh.frustumCulled = false;
      k = {
        mesh, at: new Vector3(), on: false, t0: 0, end: NaN, size: MARK_U, off: add(mesh)
      };
      marks.set(slot, k);
    }
    k.at.copy(at);
    // (a new bite: popped in again; held, it follows the head)
    if (!k.on) {
      const t = performance.now();
      // (let go only just: still popping out, it comes back from where it is, not from nothing)
      k.t0 = k.mesh.visible && t - k.end < POP_OUT_MS ? t - POP_IN_MS : t;
      k.on = true;
      k.end = NaN;
    }
  }

  /** The last frame's camera and canvas (the e2e's state() reads them). */
  let cam: Camera | null = null, fl = 1, cw = 1, ch = 1;
  /** bendPoint into `out` (no tuple a frame). */
  const bendTo = (x: number, y: number, z: number, out: Vector3) => {
    const R = bendU.uBendR.value, pz = bendU.uBendZ.value, th = (pz - z) / R, r = R + y;
    return out.set(x, r * Math.cos(th) - R, pz - r * Math.sin(th));
  };

  function frame(t: number, camera: Camera, focal: number, w: number, h: number): boolean {
    cam = camera;
    fl = focal;
    cw = w;
    ch = h;
    let any = false;
    for (const k of marks.values()) {
      const out = k.on ? 1 : Math.max(0, 1 - (t - k.end) / POP_OUT_MS), age = t - k.t0, pop = popIn(age / POP_IN_MS) * out;
      // (wanted: frames on, its first one's at nothing yet)
      if (k.on) any = true;
      if (pop <= 0) {
        k.mesh.visible = false;
        continue;
      }
      // its size from where it's drawn: the anchor bent, its depth in the view
      const depth = -bendTo(k.at.x, k.at.y, k.at.z, view).applyMatrix4(camera.matrixWorldInverse).z, size = markSize(depth, focal);
      // (the hop: up a little now and then while it's held, its foot on its spot)
      const hop = age > POP_IN_MS && k.on ? HOP_K * size * Math.max(0, Math.sin(((age - POP_IN_MS) / HOP_MS) * Math.PI * 2)) ** 2 : 0;
      k.mesh.position.set(k.at.x, k.at.y + hop, k.at.z);
      k.mesh.scale.setScalar(size * pop);
      k.mesh.updateMatrixWorld();
      k.size = size;
      k.mesh.visible = any = true;
    }
    return any;
  }

  /** A mark as its shader draws it (the e2e's), from the last frame's camera. */
  function state(slot: string): MarkState | null {
    const k = marks.get(slot);
    if (!k || !cam) return null;
    const p = k.mesh.position, s = k.mesh.scale.x;
    bendTo(p.x, p.y, p.z, bent);
    const depth = -view.copy(bent).applyMatrix4(cam.matrixWorldInverse).z;
    markCorners(bent, s, cam, ndc);
    const px = (v: Vector3): [number, number] => [((v.x + 1) / 2) * cw, ((1 - v.y) / 2) * ch];
    return {
      shown: k.mesh.visible, at: [p.x, p.y, p.z], bent: [bent.x, bent.y, bent.z], s, size: k.size, px: depth > 0 ? (k.size * fl) / depth : 0,
      bottom: px(ndc[4]), top: px(ndc[5]), left: px(ndc[0])[0], right: px(ndc[1])[0]
    };
  }

  return {
    set, frame,
    state,
    dispose() {
      for (const k of marks.values()) k.off();
      marks.clear();
      geo.dispose();
      mat?.dispose();
      tex?.dispose();
    }
  };
}
