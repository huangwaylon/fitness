// A room's pieces used in place (docs/design.md "The gym"; seats3d.ts `u`, poses.ts the motion), what moves of the piece
// itself while its user is on it: a held piece off where it stands into the hands and back (the curl's barbell, the
// kettlebell, the Ring-Con: benchBar.ts heldAt), the weight bench's barbell off its rack (its small baked bar hidden:
// lid.ts PARTS `bar`, benchBar.ts barAt), the bathroom stall's door swinging open as one goes in and again coming out
// (`door`), the user hidden in there once it's shut (the toilet stalls), the lifeguard chair's canopy hidden while one
// sits under it (`hood`), and a climbing wall seen from behind see-through while one climbs it. Everything follows from
// the seat each phone already draws (its pose, its piece) and the clock: nothing goes over the relay. The engine
// (tent/engine.ts) hands over who sits where each frame; this answers whether it still moves.
import { Box3, Matrix4, Vector3, type Camera, type Material, type Mesh, type Object3D } from 'three';
import { smooth01 } from '#lib/math.ts';
import { barAt, barK, blendFrame as blend, GRAB_MS, HELD_PROPS, heldAt, heldIn } from '../world3d/benchBar.ts';
import type { Villager3D } from '../villager3d/villager3d.ts';
import type { GymUse } from '../villager3d/poses.ts';
import { STALL_DOOR as DOOR, STALL_HIDE_MS as HIDE_MS } from '../villager3d/seats3d.ts';

/** The weight bench's barbell pressed in rooms: NH's barbell piece at its own size (a room's villager is small to it:
 *  its hands well inside the plates). */
const BENCH = { item: 'f1452', barbell: 'f4078', scale: 1 } as const;
/** Lying down before the hands go for the bar, standing up before a held piece leaves the floor (villager3d SIT_MS). */
const SETTLE_MS = 420;
/** A climbing wall seen from behind while one climbs it: this see-through. */
const SEE_THROUGH = 0.32;

/** Who's on a piece this frame: their key, their model (null: a card), the piece and its use. */
export interface OnPiece {
  key: string;
  v: Villager3D | null;
  id: string;
  use?: GymUse;
}
/** A piece as the room draws it: its item, its root (placed and turned) and its model's clone (null till loaded). */
interface Drawn {
  item: string;
  root: Object3D;
  body: Object3D | null;
}

export interface Uses {
  /** One frame: who's on what (`on`), the pieces (`piece`), the clock. True while something of theirs is on its way (a
   *  piece to or from the hands, a door swinging): the full rate; a held piece riding a loop's hands is the loop's. */
  step(on: readonly OnPiece[], piece: (id: string) => Drawn | null, t: number): boolean;
  /** Whether a villager is hidden (in a stall with its door shut). */
  hidden(key: string): boolean;
  /** The e2e's: a piece's held state (how far off where it rests, 0 … 1), its door ajar (0 shut … 1 open) and whether its
   *  `bar` or `hood` is hidden, its see-through; null when nothing of it moves. */
  state(id: string): { held: number; ajar: number; hidden: boolean; fade: number } | null;
  dispose(): void;
}

export function createUses(scene: Object3D, camera: Camera, load: (code: string) => Promise<{ scene: Object3D } | null>, dirty: () => void): Uses {
  /** A held piece's or the bench's bar's motion: when it went for the hands, when it was let go of (null: held) and how
   *  far off it was then; the frame it was last held at (it goes back from there). */
  interface Held { t0: number; off: number | null; kOff: number; last: Matrix4; k: number; lifted?: boolean }
  const held = new Map<string, Held>();
  /** The stall doors' last change (someone in or out) and who's in; when each went in. */
  const doors = new Map<string, { t: number; in: boolean }>(), inAt = new Map<string, number>();
  /** A climbing wall's own see-through materials (the clones share theirs), its originals to put back. */
  const fades = new Map<string, { body: Object3D; was: Map<Mesh, Material | Material[]>; k: number }>();
  /** The bench's barbell (one a room: one presser a bench, a room's few benches each their own clone). */
  const bells = new Map<string, Object3D>();
  let bellModel: { scene: Object3D; inBar: Matrix4 } | null = null, bellAsked = false;
  const hidden = new Set<string>(), hoods = new Set<string>();
  const m4 = new Matrix4(), rest = new Matrix4(), inv = new Matrix4(), l = new Vector3(), r = new Vector3(), head = new Vector3(), fwd = new Vector3(), cam = new Vector3(), at = new Vector3();

  const bell = () => {
    if (!bellAsked) {
      bellAsked = true;
      void load(BENCH.barbell).then((g) => {
        if (!g) return;
        const b = new Box3().setFromObject(g.scene);
        bellModel = { scene: g.scene, inBar: heldIn(new Matrix4(), 'z', b.min.toArray(), b.max.toArray(), BENCH.scale) };
      });
    }
    return bellModel;
  };
  /** The body's meshes cast their shadow or not (held: no shadow map redrawn every frame it moves). */
  const shadows = (o: Object3D, on: boolean) => o.traverse((n) => void ((n as Mesh).isMesh && ((n as Mesh).castShadow = on)));
  /** A piece's model put at `frame` (three's space) under its root. */
  const put = (d: Drawn, frame: Matrix4) => {
    d.root.updateMatrixWorld();
    inv.copy(d.root.matrixWorld).invert();
    m4.multiplyMatrices(inv, frame).decompose(d.body!.position, d.body!.quaternion, d.body!.scale);
  };
  /** How far off its rest a held thing is now, its motion told whether it's held (`hold`) from `ready` on. */
  const motion = (id: string, hold: boolean, ready: number, t: number): Held | null => {
    let h = held.get(id);
    if (hold && (!h || h.off !== null)) {
      const k = h ? barK(t, h.t0, h.off, h.kOff) : 0;
      h = { t0: k > 0 ? t - k * GRAB_MS : ready, off: null, kOff: 0, last: h?.last ?? new Matrix4(), k, lifted: h?.lifted };
      held.set(id, h);
    } else if (!hold && h && h.off === null) {
      h.kOff = barK(t, h.t0, null, 0);
      h.off = t;
    }
    if (!h) return null;
    h.k = barK(t, h.t0, h.off, h.kOff);
    return h;
  };
  /** The hands, the head and the forward of a villager now (false: no model, no hands). */
  const handsOf = (v: Villager3D | null): boolean => {
    if (!v || !v.hands(l, r)) return false;
    const hb = v.head();
    if (hb) hb.getWorldPosition(head);
    else head.set((l.x + r.x) / 2, (l.y + r.y) / 2 + 5, (l.z + r.z) / 2);
    fwd.set(Math.sin(v.group.rotation.y), 0, Math.cos(v.group.rotation.y));
    return true;
  };

  function fade(id: string, d: Drawn, want: number) {
    let f = fades.get(id);
    if (!f && want >= 1) return;
    if (!f || f.body !== d.body) {
      const was = new Map<Mesh, Material | Material[]>();
      d.body!.traverse((n) => {
        const m = n as Mesh;
        if (!m.isMesh) return;
        was.set(m, m.material);
        m.material = Array.isArray(m.material) ? m.material.map((x) => x.clone()) : m.material.clone();
      });
      f = { body: d.body!, was, k: 1 };
      fades.set(id, f);
    }
    if (f.k === want) return;
    f.k = want;
    for (const m of f.was.keys()) for (const x of Array.isArray(m.material) ? m.material : [m.material]) {
      x.transparent = want < 1;
      x.opacity = want;
      x.depthWrite = want >= 1;
      x.needsUpdate = true;
    }
    if (want >= 1) unfade(id);
  }
  function unfade(id: string) {
    const f = fades.get(id);
    if (!f) return;
    for (const [m, was] of f.was) {
      for (const x of Array.isArray(m.material) ? m.material : [m.material]) x.dispose();
      m.material = was;
    }
    fades.delete(id);
  }

  return {
    step(on, piece, t) {
      let moving = false;
      const by = new Map<string, OnPiece>();
      for (const o of on) by.set(o.id, o);
      hidden.clear();
      // held pieces and the bench's bar: to the hands, riding them, back
      for (const id of new Set([...held.keys(), ...[...by.values()].filter((o) => o.use === 'press' || o.use === 'curl' || o.use === 'swing' || o.use === 'ring').map((o) => o.id)])) {
        const d = piece(id), o = by.get(id);
        if (!d?.body) {
          held.delete(id);
          continue;
        }
        const press = d.item === BENCH.item, spec = HELD_PROPS[d.item];
        if (!press && !spec) continue;
        const has = !!o && handsOf(o.v);
        const h = motion(id, has, t + SETTLE_MS, t);
        if (!h) continue;
        if (press) {
          // the barbell off the rack in the small bar's place (the small bar hidden while it's off)
          const bar = d.body.getObjectByName('bar'), bm = bell();
          if (!bar || !bm) continue;
          let b = bells.get(id);
          if (!b) {
            b = bm.scene.clone(true);
            b.matrixAutoUpdate = false;
            shadows(b, false);
            bells.set(id, b);
          }
          bar.visible = h.off !== null && h.k <= 0;
          if (bar.visible) {
            b.removeFromParent();
            held.delete(id);
            dirty();
            continue;
          }
          if (!b.parent) (scene.add(b), dirty());
          bar.updateWorldMatrix(true, false);
          rest.copy(bar.matrixWorld);
          if (has) barAt(h.last, rest, 'z', l, r, 1);
          b.matrix.copy(blend(m4, rest, h.last, h.k)).multiply(bm.inBar);
          b.matrixWorldNeedsUpdate = true;
        } else {
          // the piece itself: its rest its root's frame
          d.root.updateMatrixWorld();
          rest.copy(d.root.matrixWorld);
          if (h.off !== null && h.k <= 0) {
            d.body.position.set(0, 0, 0);
            d.body.quaternion.identity();
            d.body.scale.set(1, 1, 1);
            shadows(d.body, true);
            held.delete(id);
            dirty();
            continue;
          }
          if (has) heldAt(h.last, rest, spec, l, r, head, fwd, 1);
          put(d, blend(m4, rest, h.last, h.k));
          if (h.k > 0 && !h.lifted) (h.lifted = true), shadows(d.body, false), dirty();
        }
        if (h.off !== null || h.k < 1) moving = true;
      }
      // the stall's door: open as one goes in, shut behind; again coming out
      for (const o of by.values()) if (o.use === 'stall') {
        if (!inAt.has(o.key)) inAt.set(o.key, t);
        const d = doors.get(o.id);
        if (!d || !d.in) doors.set(o.id, { t, in: true });
        if (t - inAt.get(o.key)! >= HIDE_MS) hidden.add(o.key);
        else moving = true;
      }
      for (const [key] of inAt) if (![...by.values()].some((o) => o.key === key && o.use === 'stall')) inAt.delete(key);
      for (const [id, d] of doors) {
        if (d.in && by.get(id)?.use !== 'stall') doors.set(id, { t, in: false });
        const k = doorK(t - doors.get(id)!.t), door = piece(id)?.body?.getObjectByName('door');
        if (door && door.rotation.y !== DOOR.swing * k) {
          door.rotation.y = DOOR.swing * k;
          dirty();
        }
        if (k > 0) moving = true;
        else if (!doors.get(id)!.in) doors.delete(id);
      }
      // the lifeguard chair's canopy: hidden while one sits under it, back once they're up
      for (const id of new Set([...hoods, ...by.keys()])) {
        const hood = piece(id)?.body?.getObjectByName('hood'), want = !by.has(id);
        if (!hood) {
          hoods.delete(id);
          continue;
        }
        if (hood.visible !== want) (hood.visible = want), dirty();
        if (want) hoods.delete(id);
        else hoods.add(id);
      }
      // a climbing wall seen from behind while one climbs it: see-through
      camera.getWorldPosition(cam);
      for (const id of new Set([...fades.keys(), ...[...by.values()].filter((o) => o.use === 'climb').map((o) => o.id)])) {
        const d = piece(id);
        if (!d?.body) {
          fades.delete(id);
          continue;
        }
        d.root.getWorldPosition(at);
        const behind = by.get(id)?.use === 'climb' && (cam.x - at.x) * Math.sin(d.root.rotation.y) + (cam.z - at.z) * Math.cos(d.root.rotation.y) < 0;
        fade(id, d, behind ? SEE_THROUGH : 1);
      }
      return moving;
    },
    hidden: (key) => hidden.has(key),
    state(id) {
      const h = held.get(id), d = doors.get(id), f = fades.get(id);
      if (!h && !d && !f) return null;
      return { held: h?.k ?? 0, ajar: d ? doorK(performance.now() - d.t) : 0, hidden: !!h && h.k > 0, fade: f?.k ?? 1 };
    },
    dispose() {
      for (const b of bells.values()) b.removeFromParent();
      for (const id of [...fades.keys()]) unfade(id);
      held.clear();
      doors.clear();
    }
  };
}

/** The stall door's swing `u` ms after someone went in or out: open, held, shut (0 shut … 1 open). */
export function doorK(u: number): number {
  if (u < 0 || u >= HIDE_MS) return 0;
  if (u < DOOR.open) return smooth01(u / DOOR.open);
  if (u < DOOR.open + DOOR.hold) return 1;
  return 1 - smooth01((u - DOOR.open - DOOR.hold) / DOOR.shut);
}
