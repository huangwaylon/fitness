// The curator at the reception desk (docs/design.md "The museum"): NH's Blathers (フータ), its static model
// (models.json `blathers`: no rig), brought to life by its holder alone, as NH's owl at his desk: now and then a blink
// (his eyes squashed shut a moment) or a gentle rock side to side, and a little hop as he talks (a tap: MuseumRoom
// shows his line, lines.ts). Cool at rest: between gestures nothing moves and nothing is drawn for him; a timer wakes the frame
// for the next one only while he was on screen the last frame (off screen he rests until the camera comes back).
// An exhibit (engine.ts Exhibit) so the engine drives it and a tap finds him (pick: lines.ts CURATOR).
import { Group, Mesh, Sphere, type Object3D } from 'three';
import type { Exhibit, Kit } from './engine.ts';
import type { Rect } from './plan.ts';
import { CURATOR } from './lines.ts';

/** Where he stands (behind the desk: engine.ts) and his scale. */
const AT: readonly [number, number] = [0, -38];
const S = 1.5;
/** His head's top (model units over the floor: NH's 13.6 at his scale) and his middle (the speech's anchor). */
const CURATOR_TOP = 13.6 * S;

type Gesture = { kind: 'blink' | 'rock' | 'talk'; t0: number; ms: number };
const MS: Record<Gesture['kind'], number> = { blink: 180, rock: 1600, talk: 1100 };

export interface Curator extends Exhibit {
  /** He talks: a hop and a blink (his line is the screen's). */
  talk(): void;
  /** What he's doing now (the e2e). */
  doing(): Gesture['kind'] | null;
}

export function buildCurator(kit: Kit): Curator {
  const group = new Group();
  const holder = kit.prop('blathers', AT[0], AT[1], { s: S, parent: group });
  const sphere = new Sphere();
  sphere.center.set(AT[0], CURATOR_TOP / 2, AT[1]);
  sphere.radius = CURATOR_TOP * 0.7;
  /** His eyes (NH's mEye) and their middle's height, found once the model is in. */
  let eyes: { m: Object3D; cy: number } | null = null;
  const findEyes = () => {
    holder.traverse((n) => {
      const m = n as Mesh;
      if (eyes || !m.isMesh || (m.material as { name?: string }).name !== 'mEye') return;
      m.geometry.computeBoundingBox();
      const b = m.geometry.boundingBox!;
      eyes = { m, cy: (b.min.y + b.max.y) / 2 };
    });
  };
  let g: Gesture | null = null;
  let seed = 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let next = performance.now() + 2500;
  let wake: ReturnType<typeof setTimeout> | undefined, wakeAt = 0;
  let lastSeen = false, posed = false, disposed = false;
  /** Wake the frame for his next gesture (only while he's on screen: else the camera's next move finds him), once. */
  const sleepTill = (t: number) => {
    if (!lastSeen || disposed || wakeAt === next) return;
    clearTimeout(wake);
    wakeAt = next;
    wake = setTimeout(() => ((wakeAt = 0), kit.invalidate()), Math.max(0, next - t));
  };
  function pose(k: Gesture['kind'] | null, e: number) {
    let y = 0, roll = 0, squash = 1, shut = false;
    if (k === 'rock') {
      // side to side twice, easing in and out; a blink halfway
      roll = Math.sin(e * Math.PI * 4) * 0.07 * Math.sin(e * Math.PI);
      shut = e > 0.48 && e < 0.56;
    } else if (k === 'talk') {
      // a little hop (squashed as he lands), his eyes shut a moment as he starts
      const h = Math.sin(Math.min(1, e / 0.55) * Math.PI);
      y = Math.max(0, h) * 1.6;
      squash = e > 0.5 && e < 0.75 ? 1 - Math.sin(((e - 0.5) / 0.25) * Math.PI) * 0.06 : 1;
      shut = e < 0.12;
    } else if (k === 'blink') shut = true;
    holder.position.y = y;
    holder.rotation.z = roll;
    holder.scale.set(S / Math.sqrt(squash), S * squash, S / Math.sqrt(squash));
    if (!eyes) findEyes();
    if (eyes) {
      const s = shut ? 0.12 : 1;
      eyes.m.scale.y = s;
      eyes.m.position.y = eyes.cy * (1 - s);
    }
  }

  const blocks: Rect[] = [];
  return {
    group,
    blocks,
    frame(t, _dt, seen) {
      lastSeen = seen(sphere);
      if (!g && t >= next) {
        const kind = rnd() < 0.75 ? 'blink' : 'rock';
        g = { kind, t0: t, ms: MS[kind] };
      }
      if (g && t - g.t0 >= g.ms) {
        g = null;
        next = t + 4000 + rnd() * 4000;
      }
      if (!g) {
        if (posed) (pose(null, 0), (posed = false));
        sleepTill(t);
        return false;
      }
      if (!lastSeen) return false;
      pose(g.kind, (t - g.t0) / g.ms);
      posed = true;
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
    night() {},
    talk() {
      g = { kind: 'talk', t0: performance.now(), ms: MS.talk };
      kit.invalidate();
    },
    doing: () => g?.kind ?? null,
    dispose() {
      disposed = true;
      clearTimeout(wake);
      group.removeFromParent();
    }
  };
}
