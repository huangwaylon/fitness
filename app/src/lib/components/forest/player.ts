// くまのもり's own player, on its own phone (docs/design.md "Kuma no mori"): moving (walk, sprint and its stamina,
// wading, stung), bumping into trunks and bushes, the cliffs (up only by a ladder, down by jumping off any edge), and
// what the act button would do where it stands. Pure: the page calls move() each frame and sends where it got to.
import { CLIFF, CLIFF_H, HALF, LOG_L, WATER, BRIDGE, at, onTop, segDist, type ForestMap, type Ladder } from './map.ts';
import type { PState } from './protocol.ts';
import { TUNE } from './sim.ts';

const BODY_R = 0.32;
const TRUNK_HIT = 0.5, BUSH_HIT = 0.85;
const CLIMB_S = 1.6, DROP_S = 0.35;

export interface Me {
  x: number;
  z: number;
  f: number;
  v: number;
  st: PState;
  top: boolean;
  /** How high its feet are (m): a cliff's top, partway up a ladder, falling off an edge. */
  y: number;
  bush?: number;
  n: number;
  seeds: number;
  stamina: number;
  /** When it last ran (the stamina comes back a moment after). */
  ranAt: number;
  wheeze: number;
  stung: number;
  run: boolean;
  climb: { l: Ladder; t0: number } | null;
  drop: number;
  downAt: number;
  revived: boolean;
  soloUp: boolean;
}

export function createMe(x: number, z: number): Me {
  return { x, z, f: Math.PI, v: 0, st: 'ok', top: false, y: 0, n: 0, seeds: 1, stamina: 1, ranAt: -1e9, wheeze: 0, stung: 0, run: false, climb: null, drop: -1e9, downAt: 0, revived: false, soloUp: false };
}

/** One frame (dt s, at t s): `dir` the stick's push in world x/z (length ≤ 1), `run` the run button held. */
export function move(m: ForestMap, me: Me, dir: { x: number; z: number }, run: boolean, t: number, dt: number, fallen: Set<number>): void {
  if (me.climb) {
    const u = (t - me.climb.t0) / CLIMB_S, p = me.climb.l;
    const k = Math.min(1, u);
    me.x = p.foot[0] + (p.head[0] - p.foot[0]) * k;
    me.z = p.foot[1] + (p.head[1] - p.foot[1]) * k;
    me.y = CLIFF_H * k;
    me.f = Math.atan2(p.head[0] - p.foot[0], p.head[1] - p.foot[1]);
    me.v = 1.2;
    if (u >= 1) {
      me.climb = null;
      me.top = true;
      me.st = 'ok';
    }
    return;
  }
  if (me.st !== 'ok') {
    me.v = 0;
    me.run = false;
    return;
  }
  const push = Math.min(1, Math.hypot(dir.x, dir.z));
  const cell = at(m, me.x, me.z);
  const wading = !me.top && !!(cell & WATER) && !(cell & BRIDGE);
  const canRun = run && push > 0.3 && t >= me.wheeze && me.stamina > 0 && !wading;
  let speed = canRun ? TUNE.run : TUNE.walk * Math.max(0.35, push);
  if (t < me.wheeze) speed = Math.min(speed, TUNE.wheeze);
  if (wading) speed = Math.min(speed, TUNE.wade);
  if (t < me.stung) speed *= TUNE.stungSlow;
  for (const id of fallen) {
    const l = m.leaners[id];
    if (segDist(me.x, me.z, l.x, l.z, l.x + Math.cos(l.a) * LOG_L, l.z + Math.sin(l.a) * LOG_L) < 0.7) speed *= 0.6;
  }
  // the stamina: spent running, back a moment after; run dry, it wheezes a second
  if (canRun) {
    me.stamina = Math.max(0, me.stamina - dt / TUNE.stamina);
    me.ranAt = t;
    if (me.stamina === 0) me.wheeze = t + 1;
  } else if (t - me.ranAt > TUNE.regenDelay) me.stamina = Math.min(1, me.stamina + TUNE.regen * dt);
  me.run = canRun;
  if (push < 0.05) {
    me.v = 0;
    settle(me, t);
    return;
  }
  me.f = Math.atan2(dir.x, dir.z);
  const s = speed * dt;
  const nx = me.x + (dir.x / push) * s, nz = me.z + (dir.z / push) * s;
  const ox = me.x, oz = me.z;
  if (free(m, me, nx, nz)) [me.x, me.z] = [nx, nz];
  else if (free(m, me, nx, me.z)) me.x = nx;
  else if (free(m, me, me.x, nz)) me.z = nz;
  me.v = Math.hypot(me.x - ox, me.z - oz) / dt;
  // off a cliff's edge: down it jumps
  if (me.top && !onTop(m, me.x, me.z)) {
    me.top = false;
    me.drop = t;
  }
  settle(me, t);
}

function settle(me: Me, t: number) {
  const u = (t - me.drop) / DROP_S;
  me.y = me.top ? CLIFF_H : u < 1 ? CLIFF_H * (1 - u * u) : 0;
}

function free(m: ForestMap, me: Me, x: number, z: number): boolean {
  if (Math.abs(x) > HALF - 1 || Math.abs(z) > HALF - 1) return false;
  // up on a cliff, anywhere goes (off an edge is a jump down); below, its side is a wall
  if (!me.top && at(m, x, z) & CLIFF) return false;
  if (me.top) return true;
  for (const t of m.trees) if (Math.abs(t.x - x) < 1.5 && Math.abs(t.z - z) < 1.5 && Math.hypot(t.x - x, t.z - z) < TRUNK_HIT * t.s + BODY_R) return false;
  for (const b of m.bushes) if (Math.abs(b.x - x) < 1.5 && Math.abs(b.z - z) < 1.5 && Math.hypot(b.x - x, b.z - z) < BUSH_HIT + BODY_R) return false;
  return true;
}

export type Act =
  | { k: 'revive'; who: string }
  | { k: 'leave' }
  | { k: 'climb'; l: Ladder }
  | { k: 'push'; id: number }
  | { k: 'nest'; id: number }
  | { k: 'hide'; id: number }
  | { k: 'unhide' };

/** What the act button does here (the nearest thing worth doing), or null. */
export function actHere(
  m: ForestMap, me: Me, o: { downs: { who: string; x: number; z: number; top: boolean }[]; fallen: Set<number>; nests: Set<number> }
): Act | null {
  if (me.st === 'hide') return { k: 'unhide' };
  if (me.st !== 'ok' || me.climb) return null;
  for (const d of o.downs) if (d.top === me.top && Math.hypot(d.x - me.x, d.z - me.z) < TUNE.reviveR) return { k: 'revive', who: d.who };
  if (Math.hypot(m.dock.x - me.x, m.dock.z - me.z) < m.dock.r) return { k: 'leave' };
  if (me.top) return null;
  for (const p of m.plateaus) for (const l of p.ladders) if (Math.hypot(l.foot[0] - me.x, l.foot[1] - me.z) < 1.4) return { k: 'climb', l };
  for (const l of m.leaners) if (!o.fallen.has(l.id) && Math.hypot(l.x - me.x, l.z - me.z) < 2) return { k: 'push', id: l.id };
  for (let i = 0; i < m.nests.length; i++) {
    const t = m.trees[m.nests[i].tree];
    if (!o.nests.has(i) && Math.hypot(t.x - me.x, t.z - me.z) < 1.8) return { k: 'nest', id: i };
  }
  for (const b of m.bushes) if (Math.hypot(b.x - me.x, b.z - me.z) < BUSH_HIT + BODY_R + 0.5) return { k: 'hide', id: b.id };
  return null;
}
