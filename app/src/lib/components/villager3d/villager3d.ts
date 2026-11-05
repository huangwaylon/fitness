// NH's villagers in 3D (on the island: world3d/villagers.ts; docs/decisions.md "The island in 3D"): a villager's GLB
// (scripts/villagers3d-models.ts: static/room/villagers3d/<roster id>.glb, its skeleton and skin kept, its eyes and
// mouths two atlases) loaded on demand (a phone only ever loads its two or three villagers and the day's visitor),
// posed every frame by poses.ts through rig.ts, its face from faces.ts (blinking on its own rhythm), lit as the
// island's models are (Lambert, a little self-light by its own colour: engine.ts's "lift"), and a soft blob of shadow
// under it. Plain three.js: whatever scene it stands in moves the group (x, z, yaw) and calls step() in each frame.
//   v.group                 add it (engine.ts attach() bends its materials with the island)
//   v.set(state)            idle, walk, sit, lie, nap, doze, prone: crossfaded over FADE_MS (PRONE_MS to and from prone)
//   v.act(action)           hop, wave, highfive, surprise, sting: once, over the state
//   v.face(f | null)        an expression (null: the state's own: asleep closed, else resting)
//   v.step(t, moved, speed) one frame: `moved` the u walked since the last (the stride follows it), `speed` u/s
//   v.head()                the head bone (a balloon's, a hat's anchor)
import {
  Box3, Matrix4, Quaternion, CircleGeometry, Color, Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D, SphereGeometry, Vector3, type Bone, type Material,
  type MeshStandardMaterial, type SkinnedMesh, Texture
} from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { lean } from '../world3d/release.ts';
import { ACTION_MS, FADE_MS, action, base, isGym, mix, over, poseBuf, strideOf, type Action, type Body, type Pose, type State } from './poses.ts';
import { cellTransform, eyeAt, faceChangeIn, mouthAt, type Face } from './faces.ts';
import { rigOf, type Rig, type RigOpts } from './rig.ts';
import type { Anchor } from './seats3d.ts';

/** Sitting down or getting up (ms): the turn, the step onto it, the pose's change. */
const SIT_MS = 420;
/** How far the seat's top is under the hips' joint (model units): the body's round bottom sits into it a little. */
const SINK = 0.55;
/** Down onto its front, or up off it (ms): getting up is slower than a state's change. */
const PRONE_MS = 600;

/** World units per model unit: an NH villager is 14.9 model units, the island's 80u (world3d-assets.ts VILLAGER_S). */
export const VILLAGER_S = 5.4;
/** A rod aimed at its float stands this far above level (NH's angler holds it ~40° up). */
const ROD_UP = (40 * Math.PI) / 180, ROD_UP_MAX = (75 * Math.PI) / 180;

export interface Villager3D {
  id: string;
  group: Object3D;
  set(s: State): void;
  state(): State;
  act(a: Action): void;
  face(f: Face | null): void;
  /** One frame at t (ms): `moved` the u walked since the last frame, `speed` (u/s) the walk's. True while it's still
   *  changing on its own (a crossfade to a new state, an action): keep stepping it till false. */
  step(t: number, moved?: number, speed?: number): boolean;
  /** Only its face at t (a blink, an expression: a texture's offset, no bones): true when it changed (a redraw). */
  blink(t: number): boolean;
  /** How long (ms) from t till blink(t) may next change its face (a blink's start or end, a snore, an action's end). */
  nextBlink(t: number): number;
  /** The self-light (the island's time of day: engine.ts TOD lift). */
  lift(l: number): void;
  /** Its opacity (the board's focus fades one standing between the camera and the board): 1 drawn as ever. */
  opacity(a: number): void;
  head(): Bone | null;
  /** Its eyes' middle, on the face's front, as it's posed now (world space: the caller updates the group's matrices
   *  first), written to `out`; null for a model without NH's eyes. The rooms' first-person camera stands there. */
  eyes(out: Vector3): Vector3 | null;
  /** Its head's top (the rest pose's highest point, over the head bone, carried by the bone as it's posed now), world
   *  space, written to `out` (its matrices brought up to date first); null without a head bone. With the head bone's
   *  own spot, the head's span: the bite's 「！」 goes over it standing, seated or lying (world3d/biteMark.ts). */
  crown(out: Vector3): Vector3 | null;
  /** Its body drawn or not (its blob of shadow stays): hidden, the first-person camera inside its head sees out. */
  show(body: boolean): void;
  /** Put something on its head (a hat: its origin its base, y up, in model units) or take it off (null): it rides the
   *  head bone, upright as the head is at rest, its base on the head's top (a little sunk in). */
  wear(obj: Object3D | null): void;
  /** Put a tool in its right hand (an NH tool model: its origin NH's hand joint, as NH authors it), or take it out. */
  grip(obj: Object3D | null): void;
  /** The gripped tool's far end (a rod's tip: its lowest point as authored), world space (three's), or null. */
  tip(): Vector3 | null;
  /** Point the gripped tool at a world point (three's space: the float), NH's angler's way: along the line from the
   *  hand to it in plan, ROD_UP above level, so the line from its tip runs straight on to it; null: the grip's own. */
  aim(at: Vector3 | null): void;
  /** The hand's world position (three's), or null. */
  hand(): Vector3 | null;
  /** Both hands' world positions (three's: the hand bones, as posed now) into `l` and `r`; false without them. No
   *  allocation (the weight bench's bar follows them each frame: world3d/benchBar.ts). */
  hands(l: Vector3, r: Vector3): boolean;
  /** Sit or lie on a seat (seats3d.ts: its anchor, in the group's parent's space): from where it stands it turns,
   *  steps back onto it and sits down, or climbs onto the bed and lies down (SIT_MS), the hips on the seat, the back to
   *  its back, the head on the pillow end, its feet down or dangling as the seat's height has them. While it's on one
   *  the group is the villager's own (the caller stops placing it). null: it gets up, back to wherever the caller puts
   *  the group from then on (the spot it walks off from). */
  sitAt(a: Anchor | null): void;
  /** On a seat (sitting down or seated), else null: its anchor. */
  seat(): Anchor | null;
  /** On a gym piece and settled, using it (a loop, looped while it's on it): the last step() moved it for that alone
   *  (the island draws it at the ambient rate, not the full one). */
  looping(): boolean;
  /** Hold a pose as it is (a test's, a still): null lets the states and actions move it again. */
  hold(p: Pose | null): void;
  rig: Rig;
  dispose(): void;
}

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const cache = new Map<string, Promise<GLTF>>();

/** A villager's GLB (once per id: a second villager of the same kind clones it). */
function load(url: string): Promise<GLTF> {
  let p = cache.get(url);
  if (!p) {
    p = loader.loadAsync(url).then((g) => {
      // NH's soft look, the island's way (world3d/things.ts): Lambert, lit a little by its own colour
      g.scene.traverse((n) => {
        const m = n as Mesh;
        if (!m.isMesh) return;
        const s = m.material as MeshStandardMaterial;
        const l = new MeshLambertMaterial({
          name: s.name, map: s.map, color: s.color, alphaTest: s.alphaTest, side: s.side, transparent: false,
          emissive: new Color(0xffffff), emissiveMap: s.map, emissiveIntensity: 0.32
        });
        l.userData = { ...s.userData };
        s.dispose();
        m.material = l;
      });
      return lean(g);
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}

const BLOB = new CircleGeometry(1, 20).rotateX(-Math.PI / 2);

/** A villager's 3D model, standing at its group's origin (its feet), facing +z (three's: toward the island's camera). */
export async function createVillager(id: string, url: string, seed = 0): Promise<Villager3D> {
  const g = await load(url);
  return animateModel(id, cloneSkinned(g.scene), seed);
}

/** What a kind of character does its own way over a villager's (NH's human players: player3d/tune.ts). */
export interface Kind {
  /** Its materials are already its own (made for this model alone): not cloned. */
  ownMaterials?: boolean;
  /** Its rigging (rig.ts RigOpts: the hands' bones, the cloth's and the hair's own drivers). */
  rig?: RigOpts;
  /** Its measures over the bones' (a player's sole sits further under its ankle: sitOn's reach). */
  body?: Partial<Body>;
  /** How far its back and front stand from its middle, lying on them (its torso's: a player's head is far deeper). */
  depth?: { back: number; front: number };
  /** A villager face's cell (faces.ts: an eye's or a mouth's) → this model's own frame. */
  cell?: (part: 'eye' | 'mouth', i: number, face: Face) => number;
  /** The sting's lump over its own left eye (the hand the sting raises: a player's reaches its cheek), not the right. */
  lumpLeft?: boolean;
  /** How far in from the eyes' outer edge the lump's middle is, of their span (a villager's 0.27). */
  lumpAt?: number;
  /** Its size against the eyes' span (a player's face patch spans its whole face: smaller). */
  lumpScale?: number;
  /** A state's pose its own way (poses.ts base's, then this: a player's rod hand nearer its chest). */
  pose?: (state: State, p: Pose) => Pose;
  /** An action at u ms (poses.ts action's, or its own where its proportions need it). */
  action?: (a: Action, u: number) => { p: Pose; w: number };
}

/** A character's skinned model (a villager's clone, an assembled player) given the villagers' life: its states,
 *  actions, faces, seats, tools; standing at its group's origin, facing +z. */
export function animateModel(id: string, model: Object3D, seed = 0, kind: Kind = {}): Villager3D {
  // every material is this clone's own: the island patches its materials' shaders for the rolling log (bend.ts), and a
  // shared one patched there bent the same kind's body off into the floor in a room (the user's "floating face, the
  // body far below": a face's material was its own, unbent, its body's the island's); the face's also change cells.
  // (The textures stay shared; the program cache shares the shaders.)
  const faces: { m: MeshLambertMaterial; tex: Texture; atlas: [number, number]; base: { ox: number; oy: number; sx: number; sy: number }; cell: number }[] = [];
  const owned: Material[] = [];
  let eyeBox: [Vector3, Vector3] | null = null;
  model.traverse((n) => {
    const m = n as SkinnedMesh;
    if (!m.isMesh) return;
    m.frustumCulled = false;
    const mat = m.material as MeshLambertMaterial;
    const mine = kind.ownMaterials ? mat : mat.clone();
    delete mine.userData.bent;
    m.material = mine;
    owned.push(mine);
    const atlas = mat.userData?.atlas as [number, number, number] | undefined;
    if (atlas && mat.map && atlas[0] * atlas[1] > 1) {
      const tex = kind.ownMaterials ? mat.map : mat.map.clone();
      mine.map = tex;
      mine.emissiveMap = tex;
      faces.push({ m: mine, tex, atlas: [atlas[0], atlas[1]], base: { ox: tex.offset.x, oy: tex.offset.y, sx: tex.repeat.x, sy: tex.repeat.y }, cell: -1 });
      if (mat.name === 'mEye') {
        m.geometry.computeBoundingBox();
        eyeBox = [m.geometry.boundingBox!.min.clone(), m.geometry.boundingBox!.max.clone()];
        m.updateWorldMatrix(true, false);
        eyeBox[0].applyMatrix4(m.matrixWorld);
        eyeBox[1].applyMatrix4(m.matrixWorld);
      }
    }
  });
  const rig = rigOf(model, kind.rig);
  // its measures at rest (model units): how tall, how far its back is behind its middle (lying on it, it's lifted by
  // that; sitting, its hips sit that far out from the seat's back)
  const restBox = new Box3().setFromObject(model);
  const tall = restBox.max.y, backDepth = kind.depth?.back ?? Math.max(1, -restBox.min.z), frontDepth = kind.depth?.front ?? Math.max(1, restBox.max.z);
  // the faces NH swaps whole meshes for (a bird's beak, a deer's or a gorilla's muzzle: scripts/villagers3d-page.js
  // keeps FaceNothing, FaceGood and FaceBad, named for their face): the one for the expression shows
  const swaps: { kind: 'Nothing' | 'Good' | 'Bad'; mesh: Object3D }[] = [];
  model.traverse((n) => {
    const k = /^Face(Nothing|Good|Bad)/.exec(n.name)?.[1] as 'Nothing' | 'Good' | 'Bad' | undefined;
    if (k && (n as Mesh).isMesh) swaps.push({ kind: k, mesh: n });
    else if (k) n.traverse((c) => (c as Mesh).isMesh && swaps.push({ kind: k, mesh: c }));
  });
  let swapShown: string | null = null;
  const showSwap = (face: Face) => {
    if (!swaps.length) return;
    const want = face === 'happy' || face === 'joy' ? 'Good' : face === 'sad' || face === 'cross' || face === 'sting' ? 'Bad' : 'Nothing';
    const kind = swaps.some((s) => s.kind === want) ? want : 'Nothing';
    if (kind === swapShown) return;
    swapShown = kind;
    for (const s of swaps) s.mesh.visible = s.kind === kind;
  };
  showSwap('neutral');

  // the sting's lump (NH's swollen eye): over the eye on the viewer's left, on the head bone
  const head = rig.bone('Head');
  // where a hat goes, from the rest pose (the model's own frame): the head's top over the head bone, as a matrix in the
  // head bone's space (upright: the bone's own rest turn undone)
  let hatAt: Matrix4 | null = null, crownLocal: Vector3 | null = null;
  if (head) {
    model.updateMatrixWorld(true);
    const top = new Box3().setFromObject(model).max.y, hp = new Vector3().setFromMatrixPosition(head.matrixWorld);
    hatAt = head.matrixWorld.clone().invert().multiply(new Matrix4().makeTranslation(hp.x, top - (top - hp.y) * 0.12, hp.z));
    // (the head's top in the head bone's frame: wherever the bone goes, its top goes with it)
    crownLocal = head.worldToLocal(new Vector3(hp.x, top, hp.z));
  }
  let worn: Object3D | null = null;
  const hand = rig.bone('Hand_R'), handL = rig.bone('Hand_L');
  let held3: { obj: Object3D; tip: Vector3; q: Quaternion } | null = null;
  let aimAt: Vector3 | null = null;
  const aimV = new Vector3(), aimH = new Vector3(), aimQ = new Quaternion(), aimHQ = new Quaternion(), aimHQ_s = new Vector3();
  /** The tool along the hand → target line in plan, ROD_UP above level (aim()). */
  function orient() {
    if (!held3 || !aimAt || !hand) return;
    group.updateMatrixWorld(true);
    hand.getWorldPosition(aimH);
    aimV.set(aimAt.x - aimH.x, 0, aimAt.z - aimH.z);
    const D = aimV.length();
    if (D < 1e-3) return;
    // (a float close in: the rod stands higher, its tip never out past the float: at most 0.7 of the way in plan)
    const L = held3.tip.length() * held3.obj.getWorldScale(aimHQ_s).x;
    const up = Math.min(ROD_UP_MAX, Math.max(ROD_UP, Math.acos(Math.min(1, (0.7 * D) / Math.max(1e-3, L)))));
    aimV.normalize().multiplyScalar(Math.cos(up)).setY(Math.sin(up));
    aimQ.setFromUnitVectors(aimH.copy(held3.tip).normalize(), aimV);
    held3.obj.quaternion.copy(hand.getWorldQuaternion(aimHQ).invert().multiply(aimQ));
    held3.obj.updateMatrixWorld(true);
  }
  let lump: Mesh | null = null;
  if (head && eyeBox) {
    const [a, b] = eyeBox as [Vector3, Vector3];
    const w = b.x - a.x;
    const k = kind.lumpAt ?? 0.27;
    const at = new Vector3(kind.lumpLeft ? b.x - k * w : a.x + k * w, (a.y + b.y) / 2, b.z + 0.05 * w);
    // (in the model's own frame: before it's put in the scaled group)
    model.updateMatrixWorld(true);
    head.worldToLocal(at);
    lump = new Mesh(new SphereGeometry(1, 16, 12), new MeshLambertMaterial({ color: 0xf2a6b6, emissive: new Color(0xf2a6b6), emissiveIntensity: 0.25 }));
    const r = 0.2 * w * (kind.lumpScale ?? 1);
    lump.scale.set(r, r * 0.85, r * 0.6);
    lump.position.copy(at);
    lump.visible = false;
    lump.name = 'sting-lump';
    head.add(lump);
  }

  // the eyes' middle on the face's front, in the head bone's frame (the model's own at rest)
  let eyeLocal: Vector3 | null = null;
  if (head && eyeBox) {
    const [a, b] = eyeBox as [Vector3, Vector3];
    model.updateMatrixWorld(true);
    eyeLocal = head.worldToLocal(new Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, b.z));
  }

  const inner = new Object3D();
  inner.add(model);
  inner.scale.setScalar(VILLAGER_S);
  const group = new Object3D();
  group.name = `villager3d:${id}`;
  group.add(inner);
  // the blob of shadow on the ground (NH's walkers have one: no shadow map to redraw as they move)
  const blobMat = new MeshBasicMaterial({ color: 0x2a3a2a, transparent: true, opacity: 0.22, depthWrite: false });
  const blob = new Mesh(BLOB, blobMat);
  blob.scale.setScalar(17);
  blob.position.y = 0.6;
  blob.renderOrder = -1;
  group.add(blob);

  let cur: State = 'idle', prev: State = 'idle', since = -1e9, faceSet: Face | null = null;
  let act: { a: Action; t0: number } | null = null, phase = 0, lastT = 0, speed = 0, held: Pose | null = null;
  const o: { phase: number; speed: number; body: typeof rig.body; seed: number; seatH?: number; back?: boolean; sway?: number } = { phase: 0, speed: 0, body: { ...rig.body, ...kind.body }, seed };
  /** The crossfade's and the action's poses, written over each step (no new pose and joint arrays a frame). */
  const mixed = poseBuf(), acted = poseBuf();
  /** A state's pose: poses.ts's, then the kind's own. */
  const baseOf = (st: State, t: number): Pose => (kind.pose ? kind.pose(st, base(st, t, o)) : base(st, t, o));
  /** A transform in the group's parent's space. */
  type Tf = { x: number; y: number; z: number; yaw: number };
  /** On a seat (since t0, from where it stood), or getting up off one (since t0). */
  let seat: { a: Anchor; t0: number; from: Tf } | null = null, leaving: { a: Anchor; t0: number; on: Tf } | null = null, fadeMs = FADE_MS;
  /** The last step moved it only for its gym piece's loop (looping()). */
  let loopOnly = false;
  const tfOf = (): Tf => ({ x: group.position.x, y: group.position.y, z: group.position.z, yaw: group.rotation.y });
  const ease3 = (v: number) => {
    const k = Math.max(0, Math.min(1, v));
    return k * k * (3 - 2 * k);
  };
  /** Where the group goes on its anchor: sitting, its hips (the group's origin under them) a back's depth out from
   *  the seat's back (the middle of a seat with none), on the seat's top; lying, its feet's end (the pivot) along the
   *  bed from the head's end, lifted by its back's depth. */
  const onSeat = (a: Anchor): Tf => {
    const U = VILLAGER_S * group.scale.x, fx = Math.sin(a.yaw), fz = Math.cos(a.yaw);
    // a gym piece used in place: its feet on the anchor (the treadmill's belt, by the bag, under the bar), or its hips
    // (the bike's saddle, the ball's top)
    if (a.use && a.stand) return { x: a.x, y: a.y, z: a.z, yaw: a.yaw };
    if (a.use && !a.lie) return { x: a.x, y: a.y + (SINK - rig.body.hip) * U, z: a.z, yaw: a.yaw };
    if (!a.lie) {
      const out = a.back > 0 ? Math.min(backDepth * U * 0.8, a.depth * 0.55) : a.depth * 0.5;
      return { x: a.x + fx * out, y: a.y + (SINK - rig.body.hip) * U, z: a.z + fz * out, yaw: a.yaw };
    }
    const L = tall * U, along = L <= a.len ? L + (a.len - L) * 0.12 : (a.len + L) / 2;
    return { x: a.x + fx * along, y: a.y + backDepth * U * 0.85 + a.pillow * 0.3, z: a.z + fz * along, yaw: a.yaw };
  };
  /** a → b by k, the turn first, an arc over what's in the way (a seat's back from behind it, onto a bed). */
  const between = (a: Tf, b: Tf, k: number, hop: number): Tf => {
    const e = ease3(k), ey = ease3(k * 1.7);
    let d = b.yaw - a.yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e + Math.sin(Math.PI * Math.min(1, k)) * hop, z: a.z + (b.z - a.z) * e, yaw: a.yaw + d * ey };
  };
  /** How high to arc from `p` onto (or off) its anchor: over its back when `p` is behind it, up onto a bed. */
  const hopOf = (a: Anchor, p: Tf): number => {
    const U = VILLAGER_S * group.scale.x;
    if (a.lie) return 2.5 * U;
    const behind = (p.x - a.x) * Math.sin(a.yaw) + (p.z - a.z) * Math.cos(a.yaw) < 0;
    return behind && a.back > 0 ? a.y - a.floor + a.back + 1.5 * U : 0.6 * U;
  };
  const setCell = (f: (typeof faces)[number], i: number): boolean => {
    if (f.cell === i) return false;
    f.cell = i;
    const c = cellTransform(i, f.atlas[0], f.atlas[1], f.base);
    f.tex.offset.set(c.ox, c.oy);
    f.tex.repeat.set(c.sx, c.sy);
    return true;
  };
  /** The face at t: its eye's and mouth's cells, a swapped face mesh, the sting's lump. */
  const showFace = (t: number): boolean => {
    const face = faceOf();
    const eye0 = eyeAt(face, t, seed), mouth0 = mouthAt(face, t);
    const eye = kind.cell ? kind.cell('eye', eye0, face) : eye0, mouth = kind.cell ? kind.cell('mouth', mouth0, face) : mouth0;
    let changed = false;
    for (const f of faces) changed = setCell(f, f.m.name === 'mEye' ? eye : mouth) || changed;
    const was = swapShown;
    showSwap(face);
    if (lump && lump.visible !== (face === 'sting')) {
      lump.visible = face === 'sting';
      changed = true;
    }
    return changed || was !== swapShown;
  };
  const faceOf = (): Face => {
    if (act?.a === 'sting') return 'sting';
    if (faceSet) return faceSet;
    if (act?.a === 'hop' || act?.a === 'highfive' || act?.a === 'wave') return 'happy';
    if (act?.a === 'surprise') return 'surprised';
    return cur === 'nap' || cur === 'doze' || cur === 'prone' ? 'sleepy' : 'neutral';
  };

  return {
    id, group, rig,
    set(s) {
      if (s === cur) return;
      prev = cur;
      cur = s;
      since = lastT;
      fadeMs = seat || (leaving && lastT - leaving.t0 < SIT_MS) ? SIT_MS : s === 'prone' || prev === 'prone' ? PRONE_MS : FADE_MS;
    },
    sitAt(a) {
      if (a && seat && seat.a === a) return;
      if (a) {
        seat = { a, t0: lastT, from: leaving ? tfOf() : tfOf() };
        leaving = null;
        const s: State = a.use ?? (a.lie ? (cur === 'nap' ? 'nap' : 'lie') : 'sit');
        if (s !== cur) {
          prev = cur;
          cur = s;
          since = lastT;
        }
        fadeMs = SIT_MS;
        o.seatH = a.lie || a.stand ? undefined : (a.y - a.floor) / (VILLAGER_S * group.scale.x) + SINK;
        o.back = a.back > 0;
        o.sway = a.sway ? 1 : 0;
        return;
      }
      if (!seat) return;
      leaving = { a: seat.a, t0: lastT, on: onSeat(seat.a) };
      seat = null;
      o.sway = 0;
      if (cur === 'sit' || cur === 'lie' || cur === 'nap' || isGym(cur)) {
        prev = cur;
        cur = 'idle';
        since = lastT;
      }
      fadeMs = SIT_MS;
    },
    seat: () => seat?.a ?? null,
    looping: () => loopOnly,
    state: () => cur,
    act(a) {
      act = { a, t0: lastT };
    },
    face(f) {
      faceSet = f;
    },
    head: () => head,
    eyes: (out) => (head && eyeLocal ? head.localToWorld(out.copy(eyeLocal)) : null),
    crown(out) {
      if (!head || !crownLocal) return null;
      head.updateWorldMatrix(true, false);
      return head.localToWorld(out.copy(crownLocal));
    },
    show(body) {
      inner.visible = body;
    },
    wear(obj) {
      if (obj === worn) return;
      worn?.removeFromParent();
      worn = obj;
      if (!obj || !head || !hatAt) return;
      obj.matrixAutoUpdate = false;
      obj.matrix.copy(hatAt).multiply(new Matrix4().makeScale(obj.scale.x, obj.scale.y, obj.scale.z));
      head.add(obj);
    },
    grip(obj) {
      if (obj === (held3?.obj ?? null)) return;
      held3?.obj.removeFromParent();
      held3 = null;
      if (!obj || !hand) return;
      // the tip: the far end down its length (NH's rods run along −y from the grip), in its own frame
      obj.position.set(0, 0, 0);
      obj.quaternion.identity();
      obj.updateMatrixWorld(true);
      const b = new Box3().setFromObject(obj, true);
      const tip = new Vector3((b.min.x + b.max.x) / 2, b.min.y, (b.min.z + b.max.z) / 2).divide(obj.scale);
      held3 = { obj, tip, q: new Quaternion() };
      // NH's grip is its own animation's: here the tool is turned in the hand so that, in the fishing pose, it points
      // out in front and up (the rod over the water), and from there it follows the arm
      rig.apply(baseOf('fish', lastT));
      model.updateMatrixWorld(true);
      const handQ = model.getWorldQuaternion(new Quaternion()).invert().multiply(hand.getWorldQuaternion(new Quaternion()));
      const along = tip.clone().normalize(), want = new Vector3(-0.2, 1.1, 1).normalize();
      obj.quaternion.copy(handQ.invert().multiply(new Quaternion().setFromUnitVectors(along, want)));
      held3.q.copy(obj.quaternion);
      // (the hand's scale undone: the tool keeps its own size in the model's units)
      const hs = hand.getWorldScale(new Vector3()).divide(model.getWorldScale(new Vector3()));
      obj.scale.divide(hs);
      hand.add(obj);
    },
    aim(at) {
      aimAt = at ? (aimAt ?? new Vector3()).copy(at) : null;
      if (!aimAt && held3) held3.obj.quaternion.copy(held3.q);
      orient();
    },
    hand: () => (hand ? hand.getWorldPosition(new Vector3()) : null),
    hands(l, r) {
      if (!hand || !handL) return false;
      // (the group's own matrices brought up to date once; the bones' world positions under it as posed)
      group.updateMatrixWorld(true);
      l.setFromMatrixPosition(handL.matrixWorld);
      r.setFromMatrixPosition(hand.matrixWorld);
      return true;
    },
    tip() {
      if (!held3) return null;
      held3.obj.updateWorldMatrix(true, false);
      return held3.tip.clone().applyMatrix4(held3.obj.matrixWorld);
    },
    hold(p) {
      held = p;
    },
    opacity(a) {
      model.visible = a > 0.01;
      model.traverse((x) => {
        const m = (x as Mesh).material as Material | undefined;
        if (!m) return;
        const see = a < 0.999;
        if (m.transparent !== see) {
          m.transparent = see;
          m.depthWrite = !see;
          m.needsUpdate = true;
        }
        m.opacity = a;
      });
    },
    lift(l) {
      model.traverse((x) => {
        const m = (x as Mesh).material as Material | undefined;
        if (m && 'emissiveIntensity' in m && m !== lump?.material) (m as MeshLambertMaterial).emissiveIntensity = l;
      });
    },
    step(t, moved = 0, sp = 0) {
      lastT = t;
      phase += moved / (strideOf(sp) * VILLAGER_S);
      speed = sp;
      o.phase = phase;
      o.speed = speed;
      const k = Math.min(1, (t - since) / fadeMs);
      // (the pose's legs follow the seat's height while on it and getting up off it)
      if (!seat && !(leaving && t - leaving.t0 < SIT_MS)) o.seatH = undefined;
      // (a held pose alone: none of the states' computed under it)
      let p: Pose = held ?? baseOf(cur, t);
      if (!held && k < 1) p = mix(baseOf(prev, t), p, k, mixed);
      if (!held && act) {
        const u = t - act.t0;
        if (u >= ACTION_MS[act.a]) act = null;
        else {
          const r = (kind.action ?? action)(act.a, u);
          p = over(p, r.p, r.w, acted);
        }
      }
      rig.apply(p);
      // the body: lifted, squashed (its volume kept), pitched (lying down: lifted onto its back)
      const sq = p.sq;
      inner.scale.set(VILLAGER_S / Math.sqrt(sq), VILLAGER_S * sq, VILLAGER_S / Math.sqrt(sq));
      inner.rotation.x = p.pitch;
      // on a seat (or getting on or off one): the group where its anchor has it, eased from (or back to) where the
      // caller has it standing
      const anchored = seat ?? leaving;
      let moving = false;
      if (anchored) {
        const live = tfOf();
        let tf: Tf;
        if (seat) {
          const u = (t - seat.t0) / SIT_MS, to = onSeat(seat.a);
          tf = u < 1 ? between(seat.from, to, u, hopOf(seat.a, seat.from)) : to;
          moving = u < 1;
        } else {
          const u = (t - leaving!.t0) / SIT_MS;
          tf = between(leaving!.on, live, u, hopOf(leaving!.a, live));
          moving = u < 1;
          if (!moving) leaving = null;
        }
        group.position.set(tf.x, tf.y, tf.z);
        group.rotation.set(0, tf.yaw, 0, 'YXZ');
        // a hammock's gentle sway, rolled about its length
        if (seat?.a.sway) {
          group.rotation.z = 0.05 * Math.sin(t / 1300);
          moving = true;
        }
        // its body straight on the seat (the pose's own lift and the legacy lying offsets aside; on a gym piece its own
        // lift: the run's bounce, a pull-up, the ball's hop)
        inner.position.set(0, seat?.a.use && !seat.a.lie ? p.y * VILLAGER_S : 0, 0);
        blob.position.y = (anchored.a.floor - tf.y) / group.scale.x + 0.6;
      } else {
        // lying on its back: lifted onto it; on its front (prone): lifted onto its front (its beak, its belly: sunk a
        // little in the sand); either way its middle over the group's origin (the bed's), not its feet
        const back = p.pitch < 0 ? -Math.sin(p.pitch) : 0, front = p.pitch > 0 ? Math.sin(p.pitch) : 0;
        inner.position.y = (p.y + back * 2.2 + front * frontDepth * 0.85) * VILLAGER_S;
        inner.position.z = (back * 6.5 - front * tall * 0.5) * VILLAGER_S;
        blob.position.y = 0.6;
      }
      blob.scale.setScalar(p.pitch ? 30 : 17 * (1 - Math.min(0.4, Math.max(0, p.y) * 0.12)));
      blobMat.opacity = p.pitch ? 0.12 : 0.22;
      showFace(t);
      // (still moving: a crossfade between states, an action under way, getting on or off a seat)
      // the rod aimed at the float, once the pose and the body are set
      orient();
      // (on a gym piece, using it: its loop moves it frame by frame)
      const loop = !!seat?.a.use && isGym(cur);
      loopOnly = loop && !(k < 1 || act || moving);
      return k < 1 || !!act || moving || loop;
    },
    nextBlink(t) {
      const end = act ? act.t0 + ACTION_MS[act.a] - t : Infinity;
      return Math.max(0, Math.min(end, faceChangeIn(faceOf(), t, seed)));
    },
    blink(t) {
      lastT = t;
      if (act && t - act.t0 >= ACTION_MS[act.a]) act = null;
      return showFace(t);
    },
    dispose() {
      group.removeFromParent();
      // its geometries and textures let go of on the renderers that drew them (shared with the cached model and the
      // other villagers: three's listeners on each else keep a gone room's or island's whole renderer alive; another
      // villager of the kind uploads them again on its next frame)
      group.traverse((n) => (n as Mesh).geometry?.dispose());
      for (const m of owned) for (const v of Object.values(m)) if (v instanceof Texture) v.dispose();
      for (const m of owned) m.dispose();
      for (const f of faces) f.tex.dispose();
      blobMat.dispose();
      if (lump) {
        lump.geometry.dispose();
        (lump.material as Material).dispose();
      }
    }
  };
}
