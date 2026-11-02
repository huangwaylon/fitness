// The 3D island's villagers in 3D (villager3d/: NH's own models, rigged and posed in code), driven from the director in
// each frame: where each stands (its live position), which way it faces (the way it walks; else as the director says),
// its state (walking, standing, sitting on a seat, dozing) and its moments (a hop, a high five, a surprise, a sting),
// its face from its emote. A villager whose model hasn't loaded, or who has none (NH's 2.0 newcomers), is drawn as its
// card meanwhile (Island3D: `cards`). Still, a villager holds its pose: its bones are posed only while something moves
// (it walks, it acts, the camera moves); its blinks are a texture's offset, so the island idles as it did. What it
// wears (a birthday hat, the party glasses: assets.json `joint` models, their origin NH's head joint) rides its head bone.
import { MeshLambertMaterial, Color, type Mesh, type MeshStandardMaterial, type Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { keyModel, MODELS } from './models3d.ts';
import { createVillager, VILLAGER_S, type Villager3D } from '../villager3d/villager3d.ts';
import { url3d } from '../villager3d/manifest.ts';
import { seatOf, type Action, type State } from '../villager3d/poses.ts';
import type { Face } from '../villager3d/faces.ts';
import type { Motion } from '../motion/reactions.ts';

export interface VSpec {
  /** The slot (an actor: mine, partner, third, visitor) and the roster id it draws. */
  slot: string;
  id: string;
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
  dispose(): void;
}

/** The director's motions as the 3D villagers' moments. */
const ACT: Partial<Record<Motion, Action>> = {
  hop: 'hop', hop2: 'hop', leap: 'hop', twirl: 'hop', dance: 'hop', samba: 'hop', laugh: 'hop', flap: 'hop', squish: 'hop',
  surprise: 'surprise', twitch: 'surprise', nod: 'wave', bow: 'wave', proud: 'wave', wiggle: 'wave'
};
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
const turn = (a: number, b: number, dt: number, k: number) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * Math.min(1, (k * dt) / 1000);
};
/** A fade out of the board's way, or back (ms). */
const FADE_MS = 220;

export function createVillagers(add: (o: Object3D) => () => void, dir: string, kick: () => void): Villagers3 {
  interface W {
    id: string;
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
  }
  const ws = new Map<string, W>();
  let lastT = 0, liftL = 0.32, disposed = false;

  function ensure(s: VSpec): W {
    let w = ws.get(s.slot);
    if (w && w.id !== s.id) {
      w.off();
      w.v?.dispose();
      ws.delete(s.slot);
      w = undefined;
    }
    if (!w) {
      const nw: W = { id: s.id, v: null, loading: false, off: () => {}, x: s.x, z: s.z, yaw: 0, motionN: s.motionN, busyUntil: 0, alpha: 1, posing: true, hat: null };
      ws.set(s.slot, nw);
      const url = url3d(s.id, dir);
      if (url) {
        nw.loading = true;
        void createVillager(s.id, url, s.slot.length * 1.3).then((v) => {
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
          m.material = new MeshLambertMaterial({ map: s0.map, color: s0.color, alphaTest: s0.alphaTest, side: s0.side, emissive: new Color(0xffffff), emissiveMap: s0.map, emissiveIntensity: liftL });
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
      const want = s.walking && moved > 0.05 ? Math.atan2(dx, -dz)
        : s.face === 'l' ? -1.1 : s.face === 'r' ? 1.1 : s.face === 'in' ? (s.side === 'left' ? 0.6 : -0.6) : 0;
      w.yaw = turn(w.yaw, s.seat !== null ? 0 : want, dt, s.walking ? 14 : 6);
      // its state, and its moment (the director's motion, once each)
      const state: State = s.asleep ? (s.seat !== null ? 'nap' : 'doze') : s.seat !== null ? 'sit' : s.walking ? 'walk' : 'idle';
      if (v.state() !== state) w.posing = true;
      v.set(state);
      if (s.motionN !== w.motionN) {
        w.motionN = s.motionN;
        const a = s.motion ? ACT[s.motion] : undefined;
        if (a) {
          v.act(s.stung ? 'sting' : a);
          w.busyUntil = t + 1800;
        }
      }
      v.face(faceOf(s.emote, s.stung));
      // on its seat: its hips on the seat's top, its feet hanging in front
      const lift = s.seat !== null ? s.seat - seatOf(v.rig.body) * VILLAGER_S : s.lift;
      v.group.position.set(s.x, s.y + lift, -s.z + (s.seat !== null ? 2 : 0));
      v.group.rotation.y = w.yaw;
      const busy = s.walking || t < w.busyUntil || Math.abs(dx) + Math.abs(dz) > 0.01;
      if (busy) moving = true;
      // posed (its breathing, its moment, its walk) while anything moves; still, it holds its pose and only its face
      // changes (a blink: a texture's offset and one redraw), so the island idles as it did
      if (active || busy || w.posing) {
        // (posed till it settles: a state's crossfade, an action, and once more after it stops)
        const going = v.step(t, s.walking ? moved : 0, s.walking ? (moved / Math.max(1, dt)) * 1000 : 0);
        w.posing = active || busy || going;
        if (going) moving = true;
      } else v.blink(t);
    }
    for (const [slot, w] of ws) if (!seen.has(slot)) {
      w.off();
      w.v?.dispose();
      ws.delete(slot);
    }
    return { cards, moving };
  }

  return {
    frame,
    lift(l) {
      liftL = l;
      for (const w of ws.values()) w.v?.lift(l);
    },
    head: (slot) => ws.get(slot)?.v?.head() ?? null,
    dispose() {
      disposed = true;
      for (const w of ws.values()) {
        w.off();
        w.v?.dispose();
      }
      ws.clear();
    }
  };
}
