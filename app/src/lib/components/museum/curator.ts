// The curator at the reception desk (docs/design.md "The museum"): NH's Blathers (フータ), his skinned model (the
// villagers' own: static/room/villagers3d/blathers.glb, NH's skeleton kept; NH's files have no animation clips), posed
// every frame on his bones by mind() below, NH's owl at his desk: breathing (his chest and a little bob), his head
// glancing about (an owl's quick turn, then a hold, now and then a curious tilt), blinking, a wing gesture now and
// then (a ruffle, a wing raised to his cheek in thought, a stretch), and every half a minute or so he nods off on his feet
// (a yawn, his head drooping, eyes shut, slow breaths, the nod as he catches himself), awake again with a start. With
// my villager in the hall he watches it; a tap perks him up (eyes wide, a hop, his tufts up) and he talks, a wing
// raised as he explains, his beak moving while his line types (MuseumRoom shows it, lines.ts).
// He moves on every frame he's on screen (the hall's at the exhibits' 30 a second then); off screen nothing of his is
// stepped and he asks for no frame. No allocation in a frame: one pose, its joints' arrays rewritten in place (the
// rig's held pose: villager3d hold()).
// An exhibit (engine.ts Exhibit) so the engine drives it and a tap finds him (pick: lines.ts CURATOR).
import { Group, Sphere } from 'three';
import type { Exhibit, Kit } from './engine.ts';
import type { Pt, Rect } from './plan.ts';
import { CURATOR } from './lines.ts';
import { createVillager, VILLAGER_S, type Villager3D } from '../villager3d/villager3d.ts';
import type { Joint, Pose } from '../villager3d/poses.ts';
import type { Face } from '../villager3d/faces.ts';
import { clamp, smooth01 } from '#lib/math.ts';

/** Where he stands and his scale (world units a model unit): behind his desk (plan.ts DESK), far enough back that no
 *  pose of his (the bob, the doze's droop, the hop, the wings) reaches into it (it was 2 behind its back, his belly and
 *  wings through its top: the user's "clipping into the desk"), and clear of the back wall (its face at −48.5); his body
 *  over the desktop may lean over it. curator.test poses his model in every mood against the desk's box. */
export const AT: readonly [number, number] = [0, -40.5];
export const S = 1.5;
/** His head's top (model units over the floor: NH's 13.6 at his scale). */
const CURATOR_TOP = 13.6 * S;
/** He watches my villager within this of him, in front of the desk. */
const NEAR = 80;
/** His line types out at this (island/pager.ts TYPE_MS): his beak moves meanwhile. */
const TYPE_MS = 33;

export type Doing = 'idle' | 'look' | 'doze' | 'talk';

export interface Curator extends Exhibit {
  /** He talks (his line `chars` long: the screen shows it): perks up, a wing raised, his beak moving while it types. */
  talk(chars: number): void;
  /** His line is gone: back to his idle. */
  quiet(): void;
  /** What he's doing now (the e2e). */
  doing(): Doing;
  /** He nods off now (the e2e's, the console's: else every half a minute or so with my villager away). */
  doze(): void;
}

type V = [number, number, number];
type Gesture = 'ruffle' | 'ponder' | 'stretch' | 'yawn';
const G_MS: Record<Gesture, number> = { ruffle: 1000, ponder: 3200, stretch: 2000, yawn: 2000 };
/** NH's wings lowered from the bind pose's T (radians: villager3d/poses.ts ARMS). */
const ARMS = 1.22;
/** The joints he poses (NH's Hand_L/R carry no skin on him: his wings are Arm_1 and Arm_2 with their helpers). */
export const POSED = ['Spine_1', 'Spine_2', 'Neck', 'Head', 'Arm_1_L', 'Arm_1_R', 'Arm_2_L', 'Arm_2_R', 'Mouth', 'Mouth_U', 'Crest_L', 'Crest_R'] as const;
type Lim = readonly [number, number];
/** Each posed joint's natural range about the model's x, y, z (radians, poses.ts's axes): what mind() keeps to
 *  (curator.test holds every frame of every mood to it). His wings are flat plates facing the front: they move in
 *  that plane (about z: the upper wing raised or lowered from the T, the outer wing bent up at the elbow) with a little
 *  forward swing at most; a wing swung well forward, folded about y or twisted about its length shows the camera its
 *  edge, a thin black needle off his side (a9e29ce7's talk and "wing to his chin"). His head (with his neck and chest
 *  under it, 0.4 at most): turned further his face is side-on to the camera above, NH's brow spots (the dotted V from
 *  his tufts to his beak) a dotted line across it and the far tuft a thin spike. His tufts: folded back past −0.25 one
 *  curls into a hook; raised past 0.6 they stand up like a hare's ears. */
export const RANGE: Record<(typeof POSED)[number], readonly [Lim, Lim, Lim]> = {
  Spine_1: [[-0.02, 0.12], [-0.03, 0.03], [-0.03, 0.03]],
  Spine_2: [[-0.1, 0.1], [0, 0], [0, 0]],
  Neck: [[0, 0.05], [-0.09, 0.09], [0, 0]],
  Head: [[-0.45, 0.5], [-0.35, 0.35], [-0.5, 0.5]],
  Arm_1_L: [[-0.3, 0], [0, 0], [-1.4, 0.25]],
  Arm_1_R: [[-0.3, 0], [0, 0], [-0.25, 1.4]],
  Arm_2_L: [[0, 0], [0, 0], [0, 1.65]],
  Arm_2_R: [[0, 0], [0, 0], [-1.65, 0]],
  Mouth: [[0, 0.95], [0, 0], [0, 0]],
  Mouth_U: [[-0.25, 0], [0, 0], [0, 0]],
  Crest_L: [[-0.25, 0.6], [0, 0], [0, 0]],
  Crest_R: [[-0.25, 0.6], [0, 0], [0, 0]]
};
const TAU = Math.PI * 2;
/** An envelope over `ms`: in over `a`, out over `b`. */
const env = (u: number, ms: number, a: number, b: number) => Math.min(smooth01(u / a), smooth01((ms - u) / b));
/** Toward a target by a rate a second over dt ms (frame-rate independent). */
const toward = (v: number, to: number, rate: number, dt: number) => v + (to - v) * (1 - Math.exp((-rate * dt) / 1000));

/** His mind: what he's doing at t, as a pose on his bones and a face. Pure but for its own state (seeded: the same
 *  seed and the same steps make the same moves); unit-tested. */
export interface Mind {
  pose: Pose;
  face: Face | null;
  doing: Doing;
  /** One step at t (ms), dt since the last, my villager where it stands (null: not in). */
  step(t: number, dt: number, me: Pt | null): void;
  talk(t: number, chars: number): void;
  quiet(t: number): void;
  doze(t: number): void;
  /** Off screen (not stepped): only whether my villager is by him, kept (coming up, it wakes him). */
  notice(me: Pt | null): void;
}
const nearOf = (me: Pt | null) => !!me && me[1] - AT[1] > 4 && Math.hypot(me[0] - AT[0], me[1] - AT[1]) < NEAR;

export function mind(seed = 1): Mind {
  let rs = (seed * 7919) % 2147483647 || 1;
  const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
  const j = {} as Record<Joint, V>;
  for (const n of POSED) j[n] = [0, 0, 0];
  const pose: Pose = { j, y: 0, sq: 1, pitch: 0 };
  const set = (v: V, x: number, y: number, z: number) => ((v[0] = x), (v[1] = y), (v[2] = z));

  let started = false;
  let mode: 'idle' | 'doze' | 'talk' = 'idle';
  // the head: where it is, where it's going (yaw: + to his left; pitch: + down; roll: + toward his right)
  let hy = 0, hp = 0, hr = 0, ty = 0, tp = 0, tr = 0, glanceAt = 0;
  let breath = 0, dz = 0, dozeT0 = 0, dozeEnd = 0, nextDoze = 0, perk = -1e9;
  let talkT0 = -1e9, speakEnd = 0, talkEnd = 0, talkW = 0, side = 1;
  let gk: Gesture | null = null, gt0 = 0, gSide = 1, nextGest = 0;
  let wasNear = false;
  const m: Mind = {
    pose, face: null, doing: 'idle',
    step(t, dt, me) {
      if (!started) {
        started = true;
        glanceAt = t + 800;
        nextGest = t + 3000 + rnd() * 3000;
        nextDoze = t + 16000 + rnd() * 12000;
      }
      const dx = me ? me[0] - AT[0] : 0, dzp = me ? me[1] - AT[1] : 0, dist = Math.hypot(dx, dzp);
      const near = nearOf(me);
      // ---- what he's doing ----
      if (mode === 'talk' && t >= talkEnd) mode = 'idle';
      if (mode === 'doze') {
        // awake when his time's up, or with a start as my villager comes up
        if (t >= dozeEnd || (near && !wasNear)) wake(t);
      } else if (mode === 'idle' && !near && !gk && t >= nextDoze) m.doze(t);
      wasNear = near;
      if (gk && t - gt0 >= G_MS[gk]) {
        gk = null;
        nextGest = t + 5000 + rnd() * 7000;
      }
      // (not while the wing he talked with is still coming down)
      if (!gk && mode === 'idle' && talkW < 0.05 && t >= nextGest) {
        const r = rnd();
        gk = r < 0.4 ? 'ruffle' : r < 0.75 ? 'ponder' : 'stretch';
        gt0 = t;
        gSide = rnd() < 0.5 ? 1 : -1;
      }
      // ---- the head's aim ----
      if ((mode === 'talk' || near) && me) {
        // at my villager, with a curious tilt now and then (his face kept up: the camera's above him, and a head bowed
        // to look down at it hid his eyes under his brows; turned further than this his face is side-on: RANGE)
        ty = clamp(Math.atan2(dx, dzp), -0.35, 0.35);
        tp = clamp(3 / Math.max(10, dist), 0, 0.08) - 0.06;
        if (t >= glanceAt) {
          tr = rnd() < 0.4 ? (rnd() < 0.5 ? -1 : 1) * (0.1 + rnd() * 0.1) : 0;
          glanceAt = t + 1800 + rnd() * 3000;
        }
      } else if (mode === 'doze') {
        ty = 0;
        tp = 0;
        tr = 0;
      } else if (t >= glanceAt) {
        // a glance about the hall: an owl's quick turn, then a hold
        ty = (rnd() - 0.5) * 0.6;
        tp = (rnd() - 0.4) * 0.2;
        tr = rnd() < 0.35 ? (rnd() < 0.5 ? -1 : 1) * (0.12 + rnd() * 0.12) : 0;
        glanceAt = t + 1600 + rnd() * 4000;
      }
      hy = toward(hy, ty, 8, dt);
      hp = toward(hp, tp, 6, dt);
      hr = toward(hr, tr, 5, dt);
      // ---- the weights: asleep (in slowly, out at once), talking ----
      const dzTo = mode === 'doze' && t - dozeT0 > 1400 ? 1 : 0;
      dz = toward(dz, dzTo, dzTo > dz ? 0.9 : 7, dt);
      talkW = toward(talkW, mode === 'talk' ? 1 : 0, mode === 'talk' ? 6 : 3, dt);
      const speaking = mode === 'talk' && t < speakEnd ? 1 : 0;

      // ---- the pose ----
      // breathing: slower and deeper as he dozes
      breath += dt / (3400 + 1800 * dz);
      const b = Math.sin(breath * TAU), deep = 1 + 1.4 * dz;
      pose.y = 0.12 * b * deep;
      pose.sq = 1 + 0.014 * deep * b;
      // nodding off: the droop deepens, then the little catch
      const cyc = ((t - dozeT0) % 5600) / 5600;
      const nod = cyc < 0.86 ? smooth01(cyc / 0.86) : 1 - smooth01((cyc - 0.86) / 0.14);
      const pu = t - perk, pk = pu < 700 ? Math.sin((Math.PI * pu) / 700) : 0;
      const talkNod = talkW * speaking * 0.05 * Math.sin((t / 1000) * TAU * 2.4);
      let down = ARMS + 0.07 * dz - 0.4 * pk, crest = -0.2 * dz + 0.4 * pk + 0.12 * talkW;
      // (asleep, his head droops forward a little and rolls to one side: much further forward and the camera, above,
      // saw only its top)
      let headX = hp + dz * (0.12 + 0.12 * nod) + 0.02 * deep * b - 0.22 * pk + talkNod;
      let headY = hy * 0.75, headZ = hr + dz * (0.16 + 0.05 * nod + 0.04 * Math.sin(t / 2300));
      set(j.Spine_1, 0.05 * dz + 0.04 * talkW, 0.08 * hy * (1 - dz), 0.025 * Math.sin(t / 2700));
      set(j.Spine_2, -0.035 * deep * b, 0, 0);
      set(j.Neck, 0.04 * dz, hy * 0.25, 0);
      let open = 0;
      pose.y += 0.7 * pk;
      pose.sq *= 1 + 0.05 * pk;
      // a gesture of his own (idle), its envelope
      let face: Face | null = null;
      // (the wings, in their own plane but for a little forward swing: forward, raised by, the elbow bent up by; L's
      // turns mirror R's)
      let fwdL = 0, fwdR = 0, upL = 0, upR = 0, elL = 0, elR = 0;
      if (gk) {
        const u = t - gt0, ms = G_MS[gk];
        if (gk === 'ruffle') {
          // his feathers shaken out: both wings flicked out twice, a shiver, his tufts up
          const f = Math.abs(Math.sin((u / 1000) * TAU * 2)) * (1 - u / ms);
          upL += 0.32 * f;
          upR += 0.32 * f;
          pose.sq *= 1 + 0.03 * Math.sin((u / 1000) * TAU * 4) * (1 - u / ms);
          headZ += 0.06 * Math.sin((u / 1000) * TAU * 4) * (1 - u / ms);
          crest += 0.2 * f;
        } else if (gk === 'ponder') {
          // a wing raised to his cheek, its tip tapping, his head on one side: hmm
          const w = env(u, ms, 400, 450), tap = 0.1 * w * Math.sin((u / 1000) * TAU * 1.4);
          if (gSide > 0) (fwdR += 0.15 * w, upR += 0.35 * w, elR += 1.45 * w + tap);
          else (fwdL += 0.15 * w, upL += 0.35 * w, elL += 1.45 * w + tap);
          headZ += 0.16 * w * gSide;
          headX += 0.06 * w;
        } else if (gk === 'stretch') {
          // one wing stretched out and down to the side, looked at, folded back
          const w = env(u, ms, 600, 700);
          if (gSide > 0) upR += 0.75 * w;
          else upL += 0.75 * w;
          headY = clamp(headY - 0.25 * w * gSide, -0.35, 0.35);
          headX += 0.08 * w;
        } else {
          // a yawn as he nods off: his head back, his beak wide, his eyes shut, his wings up a little
          const w = env(u, ms, 500, 700);
          headX -= 0.3 * w;
          open = Math.max(open, 0.9 * w);
          upL += 0.3 * w;
          upR += 0.3 * w;
          pose.sq *= 1 + 0.04 * w;
          if (w > 0.35) face = 'sleepy';
        }
      }
      // talking: a wing raised out to his side as he explains, its tip up, beating with his words; his beak moving
      // while his line types
      if (talkW > 0.001) {
        const g = talkW * (1 - dz), beat = Math.sin((t / 1000) * TAU * 1.3) * (0.4 + 0.6 * speaking);
        if (side > 0) (fwdR += 0.15 * g, upR += 0.85 * g + 0.1 * g * beat, elR += g + 0.2 * g * beat);
        else (fwdL += 0.15 * g, upL += 0.85 * g + 0.1 * g * beat, elL += g + 0.2 * g * beat);
        open = Math.max(open, talkW * speaking * 0.5 * Math.max(0, Math.sin((t / 1000) * TAU * 4.5)));
      }
      set(j.Arm_1_L, -fwdL, 0, -(down - upL) + 0.03 * b);
      set(j.Arm_1_R, -fwdR, 0, down - upR - 0.03 * b);
      set(j.Arm_2_L, 0, 0, elL);
      set(j.Arm_2_R, 0, 0, -elR);
      set(j.Head, headX, headY, headZ);
      set(j.Crest_L, crest + 0.04 * Math.sin(t / 1300), 0, 0);
      set(j.Crest_R, crest + 0.04 * Math.sin(t / 1300 + 1.3), 0, 0);
      set(j.Mouth, open, 0, 0);
      set(j.Mouth_U, -0.25 * open, 0, 0);
      // his face: wide-eyed as he perks up, a happy squint as he greets, shut as he dozes (NH's narrowed eyes, on him,
      // read as a scowl)
      if (pu < 450) face = 'surprised';
      else if (mode === 'talk' && t - talkT0 > 500 && t - talkT0 < 1300) face = 'happy';
      else if (dz > 0.35) face = 'sleepy';
      m.face = face;
      m.doing = mode === 'doze' ? 'doze' : mode === 'talk' ? 'talk' : near ? 'look' : 'idle';
    },
    talk(t, chars) {
      if (mode === 'doze') dz = Math.min(dz, 0.5);
      mode = 'talk';
      perk = t;
      talkT0 = t;
      speakEnd = t + clamp(chars * TYPE_MS, 600, 6000);
      talkEnd = speakEnd + 12000;
      side = -side;
      gk = null;
      m.doing = 'talk';
      nextDoze = Math.max(nextDoze, t + 20000 + rnd() * 15000);
    },
    doze(t) {
      mode = 'doze';
      m.doing = 'doze';
      dozeT0 = t;
      dozeEnd = t + 9000 + rnd() * 8000;
      gk = 'yawn';
      gt0 = t;
    },
    notice(me) {
      wasNear = nearOf(me);
    },
    quiet(t) {
      if (mode !== 'talk') return;
      talkEnd = Math.min(talkEnd, t);
      speakEnd = Math.min(speakEnd, t);
    }
  };
  function wake(t: number) {
    mode = 'idle';
    perk = t;
    gk = null;
    glanceAt = t;
    nextDoze = t + 22000 + rnd() * 20000;
  }
  return m;
}

/** His model's address (manifest.ts url3d: the villagers' blathers), and where my villager stands (the engine's). */
export function buildCurator(kit: Kit, o: { model: string | null; me: () => Pt | null }): Curator {
  const group = new Group();
  const sphere = new Sphere();
  sphere.center.set(AT[0], CURATOR_TOP / 2, AT[1]);
  sphere.radius = CURATOR_TOP * 0.7;
  const brain = mind(7);
  let v: Villager3D | null = null, disposed = false, nightN = 0;
  /** His own light: more at night, his desk lamps on him (the hall's brightest at night: docs/design.md "The museum"). */
  const lift = () => 0.32 + 1.2 * nightN;
  // (where my villager is, read 4 times a second: his head eases toward it)
  let me: Pt | null = null, meAt = -1e9;
  if (o.model) void createVillager('blathers', o.model, 3).then((x) => {
    if (disposed) return x.dispose();
    v = x;
    x.group.position.set(AT[0], 0, AT[1]);
    x.group.scale.setScalar(S / VILLAGER_S);
    x.lift(lift());
    x.hold(brain.pose);
    group.add(x.group);
    kit.invalidate();
  }, () => {});

  const blocks: Rect[] = [];
  return {
    group,
    wing: 'hall',
    blocks,
    frame(t, dt, seen) {
      if (!v) return false;
      if (t - meAt > 250) (me = o.me()), (meAt = t);
      if (!seen(sphere)) return brain.notice(me), false;
      brain.step(t, dt, me);
      v.face(brain.face);
      v.step(t);
      return true;
    },
    pick(project, cx, cy) {
      const top = project(AT[0], CURATOR_TOP, AT[1]), foot = project(AT[0], 6, AT[1]);
      if (!top || !foot) return null;
      const half = Math.max(14, (foot[1] - top[1]) * 0.5);
      if (cx < top[0] - half || cx > top[0] + half || cy < top[1] - 6 || cy > foot[1] + 6) return null;
      return { id: CURATOR, d: Math.hypot(cx - top[0], cy - (top[1] + foot[1]) / 2) };
    },
    where: (id) => (id === CURATOR ? [AT[0], CURATOR_TOP, AT[1]] : null),
    shown: () => [],
    night(n) {
      nightN = n;
      v?.lift(lift());
    },
    talk(chars) {
      brain.talk(performance.now(), chars);
      kit.invalidate();
    },
    quiet() {
      brain.quiet(performance.now());
    },
    doing: () => brain.doing,
    doze() {
      brain.doze(performance.now());
      kit.invalidate();
    },
    dispose() {
      disposed = true;
      v?.dispose();
      group.removeFromParent();
    }
  };
}
