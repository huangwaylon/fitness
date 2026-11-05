// The 3D island's villagers in 3D (villager3d/: NH's own models, rigged and posed in code), driven from the director in
// each frame: where each stands (its live position), which way it faces (the way it walks; else as the director says),
// its state (walking, standing, sitting on a seat, dozing) and its moments (a hop, a high five, a surprise, a sting),
// its face from its emote. The day's visitor is one more (slot `visitor`, and `visitor:b` for Reese's Cyrus: NH's special
// characters, converted as the villagers are), lying face down asleep when it's Gulliver (`prone`). A villager whose
// model hasn't loaded, or who has none (NH's 2.0 newcomers), is drawn as its card meanwhile (Island3D: `cards`); a
// visitor is drawn once its model is in. Still, a villager holds its pose: its bones are posed only while something moves
// (it walks, it acts, the camera moves); its blinks are a texture's offset, so the island idles as it did. What it
// wears (a birthday hat, the party glasses: assets.json `joint` models, their origin NH's head joint) rides its head bone.
import { MeshLambertMaterial, Color, Vector3 as V3, type Vector3, type Material, type Mesh, type MeshStandardMaterial, type Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { keyModel, MODELS } from './models3d.ts';
import { VILLAGER_S, type Villager3D } from '../villager3d/villager3d.ts';
import { villager3, type Person3 } from '../person3d/person3d.ts';
import { drawOff } from '../../ui-state/testMode.ts';
import { ACTION_MS, seatOf, type Action, type State } from '../villager3d/poses.ts';
import { anglerOf, type Phase } from './fishing3d.ts';
import { bend } from './bend.ts';
import { overHead } from './biteMark.ts';
import { faceFloat, FACE_FLOAT_K, rodTarget, turn } from './facing.ts';
import { anchorsOf, shapeOf, type Anchor } from '../villager3d/seats3d.ts';
import ISLAND_MODELS from '../island/models.json' with { type: 'json' };
import { DECOR_SLOTS, DECOR_U, SCENERY, seatAt } from '../island/world.ts';
import type { Face } from '../villager3d/faces.ts';
import type { Motion } from '../motion/reactions.ts';
import { site } from '../island/site.svelte.ts';
import { seatAnchor } from '../island/sitting.ts';

export interface VSpec {
  /** The slot (an actor: mine, partner, third, visitor) and the roster id it draws. */
  slot: string;
  id: string;
  /** A person's model (person3d: their villager or their human player), by its key; else the roster id's villager. */
  model?: Person3;
  x: number;
  z: number;
  /** Its feet's height (the ground under it, a bridge's deck). */
  y: number;
  walking: boolean;
  /** Which way the director has it look: as drawn, inward, left or right. */
  face: 'home' | 'in' | 'l' | 'r';
  /** Its side of the island (inward: toward the middle). */
  side: 'left' | 'right';
  asleep: boolean;
  /** Asleep face down on the ground, its head to the left (Gulliver washed up). */
  prone?: boolean;
  /** On a seat: how high its top is (u), or null. */
  seat: number | null;
  /** Lifted (a pull-up's rep). */
  lift: number;
  motion: Motion | null;
  motionN: number;
  emote: string | null;
  stung: boolean;
  shown: boolean;
  /** What it wears on its head (an asset key: deco/birthday-hat-pink, accessories/party-glasses), or null. */
  hat?: string | null;
  /** What it holds in its right hand (an asset key: tools/rod while fishing), or null; with a rod it stands fishing. */
  tool?: string | null;
  /** In the way of the board's focus (between the camera and the board): faded out. */
  away?: boolean;
}

export interface Villagers3 {
  /** One frame: `active` the island moves (the camera, a walk): the bones are posed. Returns the slots still drawn as
   *  cards (no model, or loading) and whether one moves. */
  frame(t: number, specs: readonly VSpec[], active: boolean): { cards: Set<string>; moving: boolean };
  /** The time of day's self-light (engine.ts TOD lift). */
  lift(l: number): void;
  /** A villager's head (a balloon's, a hat's anchor), its world position (three's space) or null. */
  head(slot: string): Object3D | null;
  /** The bite's 「！」's spot over a villager's head as it's posed now (biteMark.ts overHead: three's space, unbent),
   *  written to `out`; null while it has no model (a card). */
  overHead(slot: string, out: Vector3): Vector3 | null;
  /** What a villager holds, its far end (a rod's tip: the fishing line's start), world space, or null. */
  tip(slot: string): Vector3 | null;
  /** A villager's tap area (u: its width across, its height over its feet): its body's core, from its head's height
   *  standing (NH's villagers: the head's base ~0.57 up the figure, the head and body ~0.6 as wide as tall), once it's
   *  stood once, or null. Island3D sizes its DOM card to it, not to its art's render. */
  size(slot: string): [number, number] | null;
  /** The angler's line up (the e2e's): headings in plan (degrees, world x/z: atan2(dx, −dz)) of its facing, its rod
   *  (hand → tip) and its line (tip → float), or null when it holds no aimed rod. */
  angler(slot: string): { facing: number; rod: number; line: number } | null;
  dispose(): void;
}

/** The director's motions as the 3D villagers' moments. */
const ACT: Partial<Record<Motion, Action>> = {
  hop: 'hop', hop2: 'hop', twirl: 'hop', dance: 'hop', samba: 'hop', laugh: 'hop', flap: 'hop', squish: 'hop',
  surprise: 'surprise', twitch: 'twitch', nod: 'wave', bow: 'wave', proud: 'wave', wiggle: 'wave',
  // group stretching (island/stretching.ts): NH's three, posed
  warmup: 'warmup', sidebend: 'sidebend', leap: 'jump',
  // the visitors' own: Celeste points at a falling star, a wave up at it
  point: 'wave'
};
/** The island's seats (world.ts SEATS) on their pieces: which piece, its model (villager3d/seats3d.json) and which of
 *  its seats (left to right). */
const SEAT_ON: Record<string, [piece: string, model: string, n: number]> = {
  seatMaeL: ['bench-mae', 'park-bench', 0], seatMaeR: ['bench-mae', 'park-bench', 1],
  seatPondL: ['bench-pond', 'log-bench', 0], seatPondR: ['bench-pond', 'log-bench', 1],
  stoolW: ['stool-1', 'log-stool', 0], stoolE: ['stool-2', 'log-stool', 0]
};
const MU = ISLAND_MODELS as unknown as Record<string, { mu: [number, number] }>;
/** A seat's anchor (three's space, on the ground at `floor`), as world.ts's island put its piece: the fixed decor at NH's
 *  furniture scale, a stool fitted to its height (the flipped one turned a little), facing the camera. */
function islandSeat(name: string, floor: number): Anchor | null {
  const on = SEAT_ON[name];
  if (!on) return null;
  const [id, model, n] = on, slot = DECOR_SLOTS.find((d) => d.id === id), sc = SCENERY.find((d) => d.id === id);
  const p = slot ?? sc;
  if (!p) return null;
  const s = slot ? DECOR_U : sc!.h / (MU[sc!.key]?.mu[1] ?? 4.2), yaw = sc?.flip ? 0.7 : 0;
  return anchorsOf(shapeOf('island', model), { x: p.x, z: -p.z, y: floor, yaw, s })[n] ?? null;
}
/** A seat on the layout: any piece's of the layout's with a model seat, default or new (island/sitting.ts:
 *  layout/nav.ts seatsOf's names, on its model as placeObjects stands it). */
function layoutSeat(name: string, floor: number): Anchor | null {
  const l = site.layout;
  return l ? seatAnchor(l, name, floor) : null;
}
/** My line's steps as my villager's moments (fishing3d.ts). */
const ANGLE_ACT: Partial<Record<Phase, Action>> = { cast: 'cast', bite: 'tug', reel: 'reel' };
/** Its emote as its face. */
function faceOf(emote: string | null, stung: boolean): Face | null {
  if (stung) return 'sting';
  if (!emote) return null;
  if (/heart|sparkle|glee|love|joy|note/.test(emote)) return 'happy';
  if (/bang|surprise/.test(emote)) return 'surprised';
  if (/sweat|sad|worry/.test(emote)) return 'sad';
  if (/zzz/.test(emote)) return 'sleepy';
  if (/cross|anger/.test(emote)) return 'cross';
  return null;
}
/** A fade out of the board's way, or back (ms). */
const FADE_MS = 220;

export function createVillagers(add: (o: Object3D) => () => void, dir: string, kick: () => void): Villagers3 {
  interface W {
    /** The model's key (person3d's, or the roster id) and, while a new look's loads over the old model, its key. */
    key: string;
    next: string | null;
    v: Villager3D | null;
    loading: boolean;
    off: () => void;
    x: number;
    z: number;
    yaw: number;
    motionN: number;
    busyUntil: number;
    alpha: number;
    posing: boolean;
    hat: { key: string; obj: Object3D | null } | null;
    tool: { key: string; obj: Object3D | null } | null;
    /** The fishing step last seen (fishing3d.ts anglerOf(slot).n) and how long the rod stays in hand after the reel. */
    angleN: number;
    rodUntil: number;
    size?: [number, number];
  }
  const ws = new Map<string, W>();
  /** The seats' anchors (one object a seat: villager3d sitAt keeps to the one it's on). */
  const seats = new Map<string, Anchor | null>();
  let seatsRev = -1;
  const anchorAt = (s: VSpec): Anchor | null => {
    const name = seatAt(Math.round(s.x), Math.round(s.z));
    if (!name) return null;
    // (on the layout, its seats move with it: worked out again on a new revision, the old ones let go of)
    if (seatsRev !== site.rev) (seats.clear(), (seatsRev = site.rev));
    if (!seats.has(name)) seats.set(name, layoutSeat(name, s.y) ?? islandSeat(name, s.y));
    return seats.get(name)!;
  };
  let lastT = 0, liftL = 0.32, disposed = false;
  const headP = new V3(), aimP = new V3(), crownP = new V3();
  const debug = import.meta.env.DEV || new URLSearchParams(location.search).has('demo') || drawOff() ? new Map<string, unknown>() : null;

  const keyOf = (s: VSpec) => s.model?.key ?? s.id;
  const make = (s: VSpec): Promise<Villager3D> | null => (s.model ?? villager3(s.id, dir)).create(s.slot.length * 1.3);

  function ensure(s: VSpec): W {
    const key = keyOf(s);
    let w = ws.get(s.slot);
    // another look: drawn as it was till the new model is in, then swapped in place (where it stands, its seat, its
    // hat and rod taken up again); with nothing drawn yet, a new one at once
    if (w && w.key !== key && w.v && w.next !== key) {
      const was = w, p = make(s);
      was.next = key;
      if (p) void p.then((v) => {
        if (disposed || ws.get(s.slot) !== was || was.next !== key) return v.dispose();
        was.off();
        was.v?.dispose();
        Object.assign(was, { key, next: null, v, hat: null, tool: null, posing: true, size: undefined });
        v.lift(liftL);
        was.off = add(v.group);
        kick();
      }, () => was.next === key && (was.next = null));
    } else if (w && w.key !== key && !w.v) {
      w.off();
      ws.delete(s.slot);
      w = undefined;
    } else if (w && w.key === key) w.next = null;
    if (!w) {
      const nw: W = { key, next: null, v: null, loading: false, off: () => {}, x: s.x, z: s.z, yaw: 0, motionN: s.motionN, busyUntil: 0, alpha: 1, posing: true, hat: null, tool: null, angleN: anglerOf(s.slot).n, rodUntil: 0 };
      ws.set(s.slot, nw);
      const p = make(s);
      if (p) {
        nw.loading = true;
        void p.then((v) => {
          nw.loading = false;
          if (disposed || ws.get(s.slot) !== nw) return v.dispose();
          nw.v = v;
          v.lift(liftL);
          nw.off = add(v.group);
          kick();
        }, () => (nw.loading = false));
      }
      w = nw;
    }
    return w;
  }

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const wearBase = new URL('room/world3d/', new URL(document.baseURI)).href;
  /** A worn model (once per key; each villager its own copy), its materials the villagers' Lambert. */
  const worn = new Map<string, Promise<Object3D | null>>();
  const wearOf = (key: string): Promise<Object3D | null> => {
    let p = worn.get(key);
    if (!p) {
      const a = keyModel(key);
      p = !a ? Promise.resolve(null) : loader.loadAsync(`${wearBase}${a.m}.glb?v=${MODELS[a.m]?.v ?? 0}`).then((g) => {
        g.scene.traverse((n) => {
          const m = n as Mesh;
          if (!m.isMesh) return;
          const s0 = m.material as MeshStandardMaterial;
          // (bent with the island, as the villager it's put on: engine.ts add() bent what the villager had then, not
          // what its hand or head takes later; unbent, the rod and a hat were drawn off their hand and head by the
          // bend's drop, more the further from the camera's pivot, and slid as a pinch or a scroll moved the camera)
          m.material = bend(new MeshLambertMaterial({ map: s0.map, color: s0.color, alphaTest: s0.alphaTest, side: s0.side, emissive: new Color(0xffffff), emissiveMap: s0.map, emissiveIntensity: liftL }));
          m.castShadow = false;
          m.frustumCulled = false;
        });
        // (in the head bone's space, model units: the villager's own scale already on it)
        g.scene.scale.setScalar(a.s / VILLAGER_S);
        return g.scene;
      }, () => null);
      worn.set(key, p);
    }
    return p;
  };
  // NH's rod in ahead of the first cast (its model's fetch and parse took seconds on a slow phone and on CI's software
  // GL: the line could be out and gone before it was in hand); after the time of day's lift is set (Island3D, at once)
  setTimeout(() => void (disposed || wearOf('tools/rod')), 0);
  function wear(w: W, key: string | null) {
    if ((w.hat?.key ?? null) === key) return;
    w.v?.wear(null);
    w.hat = key ? { key, obj: null } : null;
    if (!key) return kick();
    const h = w.hat!;
    void wearOf(key).then((src) => {
      const head = w.v?.head();
      if (!src || !head || w.hat !== h || disposed) return;
      h.obj = src.clone();
      w.v!.wear(h.obj);
      w.v!.lift(liftL);
      kick();
    });
  }

  function holdTool(w: W, key: string | null) {
    if ((w.tool?.key ?? null) === key) return;
    w.v?.grip(null);
    w.tool = key ? { key, obj: null } : null;
    if (!key) return kick();
    const h = w.tool!;
    void wearOf(key).then((src) => {
      if (!src || !w.v || w.tool !== h || disposed) return;
      h.obj = src.clone();
      w.v.grip(h.obj);
      w.v.lift(liftL);
      w.posing = true;
      kick();
    });
  }

  function frame(t: number, specs: readonly VSpec[], active: boolean) {
    const dt = lastT ? Math.min(100, t - lastT) : 16;
    lastT = t;
    const cards = new Set<string>(), seen = new Set<string>();
    let moving = false;
    for (const s of specs) {
      seen.add(s.slot);
      const w = ensure(s), v = w.v;
      if (!v) {
        cards.add(s.slot);
        continue;
      }
      v.group.visible = s.shown;
      if (!s.shown) continue;
      wear(w, s.hat ?? null);
      // its cast (fishing3d.ts: Critters' steps, mine or as its phone tells them): the rod's swing out, the tug at the
      // bite, the reel (the rod kept in hand till it's over, though the line's gone)
      const ang = anglerOf(s.slot);
      if (ang.n !== w.angleN) {
        w.angleN = ang.n;
        const a = ANGLE_ACT[ang.phase ?? 'wait'];
        if (a) {
          v.act(a);
          w.busyUntil = t + ACTION_MS[a];
          if (a === 'reel') w.rodUntil = t + ACTION_MS.reel;
        }
      }
      // (however far its float: the line runs from the rod's tip wherever it stands)
      const rod = s.tool === 'tools/rod' || t < w.rodUntil || (ang.phase !== null && ang.phase !== 'reel');
      holdTool(w, rod ? 'tools/rod' : (s.tool ?? null));
      if (debug) debug.set(s.slot, { t: Math.round(t), x: s.x, z: s.z, shown: s.shown, walking: s.walking, asleep: s.asleep, seat: s.seat, tool: s.tool ?? null, rod, angling: { ...ang } });
      // faded out of the board's way (and back), over FADE_MS
      const aim = s.away ? 0 : 1;
      if (w.alpha !== aim) {
        w.alpha = aim > w.alpha ? Math.min(aim, w.alpha + dt / FADE_MS) : Math.max(aim, w.alpha - dt / FADE_MS);
        v.opacity(w.alpha);
        moving = true;
      }
      // where it is, and how far it walked since the last frame (its stride follows it)
      const dx = s.x - w.x, dz = s.z - w.z, moved = Math.hypot(dx, dz);
      w.x = s.x;
      w.z = s.z;
      // which way: the way it walks; else the director's (left, right, inward), else toward the camera
      // (fishing: toward the float)
      // (face down: its head to the left, along the shore)
      let want = s.prone ? -Math.PI / 2 : s.walking && moved > 0.05 ? Math.atan2(dx, -dz)
        : s.face === 'l' ? -1.1 : s.face === 'r' ? 1.1 : s.face === 'in' ? (s.side === 'left' ? 0.6 : -0.6) : 0;
      // (fishing, standing: straight at the float, NH's quick smooth turn as the cast goes out, and kept on it; square
      // on from the rod's hand, so the facing, the rod and the line are one line in plan. Seated or lying: no body
      // turn, the rod the way it faces: facing.ts)
      const angling = rod && !!ang.phase, aiming = angling && s.seat === null;
      if (aiming && !s.walking) {
        const hp = v.hand(), c = Math.cos(-w.yaw), sn = Math.sin(-w.yaw);
        const ox = hp ? hp.x - v.group.position.x : 0, oz = hp ? hp.z - v.group.position.z : 0;
        // (the hand in the body's own frame, three's)
        want = faceFloat(s.x, s.z, ang.x, ang.z, ox * c + oz * sn, -ox * sn + oz * c);
      }
      // on a seat: its anchor's way (a turned chair, the bike and the treadmill side on), so it isn't turning to the
      // front each frame only to be put back (that kept the island at its full rate)
      const anchor = s.seat !== null ? anchorAt(s) : null;
      const to = anchor ? anchor.yaw : s.seat !== null ? 0 : want;
      w.yaw = turn(w.yaw, to, dt, s.walking ? 14 : aiming ? FACE_FLOAT_K : 6);
      const turning = Math.abs(Math.atan2(Math.sin(to - w.yaw), Math.cos(to - w.yaw))) > 0.005;
      // its state, and its moment (the director's motion, once each)
      // on a seat: on its model's own (villager3d sitAt: the villager sits down there itself), dozing off on it asleep
      // (lying on one, the hammock: asleep it naps there; on a gym piece it uses it: asleep, it dozes there)
      const state: State = anchor
        ? anchor.use && !s.asleep ? anchor.use : anchor.lie ? (s.asleep ? 'nap' : 'lie') : anchor.stand ? 'doze' : 'sit'
        : s.prone ? 'prone' : s.asleep ? (s.seat !== null ? 'nap' : 'doze') : s.seat !== null ? 'sit' : s.walking ? 'walk' : rod ? 'fish' : 'idle';
      if (v.state() !== state) w.posing = true;
      v.set(state);
      if (s.motionN !== w.motionN) {
        w.motionN = s.motionN;
        const a = s.motion ? ACT[s.motion] : undefined;
        if (a) {
          // (the sting's fright: a dizzy wobble; its swollen eye stays on the face for the minute)
          v.act(s.stung && s.motion === 'surprise' ? 'sting' : a);
          w.busyUntil = t + 1800;
        }
      }
      v.face(faceOf(s.emote, s.stung) ?? (anchor && s.asleep ? 'sleepy' : null));
      // on its seat: its hips on the seat's top, its feet hanging in front
      if (anchor) {
        v.sitAt(anchor);
        w.yaw = anchor.yaw;
      } else {
        if (v.seat()) v.sitAt(null);
        const lift = s.seat !== null ? s.seat - seatOf(v.rig.body) * VILLAGER_S : s.lift;
        v.group.position.set(s.x, s.y + lift, -s.z + (s.seat !== null ? 2 : 0));
        v.group.rotation.y = w.yaw;
      }
      // the rod: at the float standing, straight ahead seated (its seat's way, once it's on it)
      const hp = angling ? v.hand() : null, at = hp ? rodTarget(!aiming, w.yaw, hp, ang) : null;
      v.aim(at ? aimP.set(at.x, 0, at.z) : null);
      const busy = s.walking || t < w.busyUntil || Math.abs(dx) + Math.abs(dz) > 0.01 || turning;
      if (busy) moving = true;
      // posed (its breathing, its moment, its walk) while anything moves; still, it holds its pose and only its face
      // changes (a blink: a texture's offset and one redraw), so the island idles as it did
      if (active || busy || w.posing) {
        // (posed till it settles: a state's crossfade, an action, and once more after it stops)
        const going = v.step(t, s.walking ? moved : 0, s.walking ? (moved / Math.max(1, dt)) * 1000 : 0);
        w.posing = active || busy || going;
        // (a gym piece's loop alone is the island's ambience: its ambient rate, the frames it draws anyway while a
        // villager shows, not the full one)
        if (going && !v.looping()) moving = true;
      } else v.blink(t);
    }
    for (const [slot, w] of ws) if (!seen.has(slot)) {
      w.off();
      w.v?.dispose();
      ws.delete(slot);
    }
    return { cards, moving };
  }

  // the e2e's (dev builds, ?demo and the logic tier): a 3D villager's state, what it holds and its tip (three's space), and what its
  // last frame saw (its spec, the rod)
  type Hooked = { __villagers3?: unknown };
  const hook = debug && {
    last: (slot: string) => debug.get(slot) ?? null,
    state: (slot: string) => ws.get(slot)?.v?.state() ?? null,
    /** The model drawn (person3d's key: `v:<roster id>` a villager, `p:…` a human player), null till one is in. */
    model: (slot: string) => (ws.get(slot)?.v ? ws.get(slot)!.key : null),
    /** Its tap area (u: width, height), once measured. */
    size: (slot: string) => ws.get(slot)?.size ?? null,
    /** A human player drawn (player3d's: it has dress()), not a villager (a stand-in's too). */
    player: (slot: string) => !!ws.get(slot)?.v && 'dress' in ws.get(slot)!.v!,
    tool: (slot: string) => (ws.get(slot)?.tool?.obj ? ws.get(slot)!.tool!.key : null),
    tip: (slot: string) => ws.get(slot)?.v?.tip()?.toArray() ?? null,
    /** The materials on it drawn unbent (engine.ts bend: off the island it stands on), what it took up since included. */
    unbent: (slot: string) => {
      const out: string[] = [];
      ws.get(slot)?.v?.group.traverse((o) => {
        const m = (o as Mesh).material as Material | Material[] | undefined;
        for (const x of m ? (Array.isArray(m) ? m : [m]) : []) if (!x.userData.bent) out.push(o.name || o.type);
      });
      return out;
    },
    /** Its sting's swollen eye showing (the lump on its head bone). */
    stung: (slot: string) => !!ws.get(slot)?.v?.group.getObjectByName('sting-lump')?.visible
  };
  if (hook) (window as unknown as Hooked).__villagers3 = hook;

  return {
    frame,
    lift(l) {
      liftL = l;
      for (const w of ws.values()) w.v?.lift(l);
    },
    head: (slot) => ws.get(slot)?.v?.head() ?? null,
    overHead(slot, out) {
      const v = ws.get(slot)?.v, hb = v?.head();
      if (!v || !hb || !v.crown(crownP)) return null;
      // (crown() brought the bone's matrices up to date)
      return overHead(headP.setFromMatrixPosition(hb.matrixWorld), crownP, out);
    },
    tip: (slot) => ws.get(slot)?.v?.tip() ?? null,
    angler(slot) {
      const w = ws.get(slot), v = w?.v, tip = v?.tip(), hand = v?.hand(), a = anglerOf(slot);
      if (!w || !v || !tip || !hand || !a.phase) return null;
      const deg = (r: number) => (r * 180) / Math.PI;
      // (three's z is the world's −z)
      return { facing: deg(w.yaw), rod: deg(Math.atan2(tip.x - hand.x, tip.z - hand.z)), line: deg(Math.atan2(a.x - tip.x, -(a.z + tip.z))) };
    },
    size(slot) {
      const w = ws.get(slot), v = w?.v;
      if (!w || !v) return null;
      // (measured standing: seated or lying its head is elsewhere)
      if (!w.size && v.state() === 'idle' && !v.seat()) {
        // (a human player: NH's taller figure, its head higher up it and narrower than a villager's: from its crown)
        if ('dress' in v) {
          const top = v.crown(crownP), h = top ? top.y - v.group.position.y : 0;
          if (h > 10) w.size = [Math.round(h * 0.45), Math.round(h)];
        } else {
          const hb = v.head(), h = hb ? (hb.getWorldPosition(headP).y - v.group.position.y) * 1.75 : 0;
          if (h > 10) w.size = [Math.round(h * 0.6), Math.round(h)];
        }
      }
      return w.size ?? null;
    },
    dispose() {
      disposed = true;
      for (const w of ws.values()) {
        w.off();
        w.v?.dispose();
      }
      ws.clear();
      // (the hook holds this island: gone with it)
      if (hook && (window as unknown as Hooked).__villagers3 === hook) delete (window as unknown as Hooked).__villagers3;
    }
  };
}
