// My villager is me (docs/design.md "Walking"): a tap on something to do on the island (a bush, a flower, the rock, a
// weed, a dig spot, a fallen fruit or branch, a tree to shake, the sea to cast into, a bug to net, a shell, a visitor)
// walks my villager to it first, then the action plays there, tool in hand. The outcome is decided at the tap; the
// walk is cosmetic and short (240 u/s, 150–900 ms; a walk over 1.2 s isn't made: the villager turns and the action
// plays from where it is). Afterwards it stays 4–6 s, then wanders home at 90 u/s. A new tap re-targets it from where
// it is. Under a sheet everyone stops where they are; hidden for over 30 s, everyone is back home.
// The scene attaches what this needs from the DOM (`attachAvatar`): the walk geometry, a check that a villager standing
// at a spot covers no control, and where an actor's feet are right now.
import { actors, awayFromHome, busy, faceToward, place, setMotion, setRouter, useTool, walkTo, type Tool } from '../motion/director.svelte.ts';
import type { ActorId, Motion } from '../motion/reactions.ts';
import { REACH, SPEED, actionMs, actionSpots, route, routeLength, type Pt, type WalkGeo } from './walkGraph.ts';

export interface AvatarCtx {
  geo: () => WalkGeo;
  /** A villager standing with its feet at (x, y) u covers no control (and not the other villager). */
  clear: (id: ActorId, x: number, y: number) => boolean;
  /** Where an actor's feet are now (mid-walk included), u. */
  where: (id: 'mine' | 'partner') => Pt;
  /** Live, not covered, page visible. */
  enabled: () => boolean;
  /** Close a speech balloon (a walk closes it: it only opens over a villager standing still). */
  hush?: () => void;
}

let ctx: AvatarCtx | null = null;
const homeTimers: Partial<Record<'mine' | 'partner', ReturnType<typeof setTimeout>>> = {};
/** When my villager last left home for something (the partner follows after a while: phase 2). */
const away = { since: 0 };

export function attachAvatar(c: AvatarCtx): () => void {
  ctx = c;
  setRouter((id) => (id === 'host' ? null : route(c.geo(), c.where(id), actors[id].home)));
  return () => {
    if (ctx === c) {
      ctx = null;
      setRouter(null);
    }
    for (const id of ['mine', 'partner'] as const) clearTimeout(homeTimers[id]);
  };
}

/** A watering can or a net reaches further: across a bed (two tiles) from its edge. */
export const LONG_REACH = [26, 40, 74, 96] as const;

/** Linger at a spot before wandering home (ms). */
const LINGER: readonly [number, number] = [4000, 6000];

export interface Approach {
  /** Play the action this many ms from now. */
  ms: number;
  /** My villager walked to it (or stands at it already): the tool is in its hand, so the scene's floating one stays away. */
  walked: boolean;
}

interface ApproachOpts {
  tool?: Tool;
  /** How long the tool stays out (ms). */
  toolMs?: number;
  /** A body motion on arrival (a shake, a nod). */
  motion?: Motion;
  /** Stand exactly here (u) instead of around the target (the angler's spot on the beach). */
  spot?: Pt;
  /** Linger this long instead (ms; a fishing line stays out a while). */
  linger?: number;
  /** How far from the target it may stand (u), nearest first (default REACH): a watering can reaches across a bed. */
  reach?: readonly number[];
}

/** The best spot to act on (tx, ty) from `from` and the way there: the nearest clear spot by walking distance. */
export function plan(g: WalkGeo, from: Pt, tx: number, ty: number, clear: (x: number, y: number) => boolean, spot?: Pt, reach: readonly number[] = REACH): { pts: Pt[]; ms: number } | null {
  let best: { pts: Pt[]; len: number } | null = null;
  // the nearest by walking of the close spots; the further ring only when none of those will do
  for (const ring of spot ? [[spot]] : reach.map((r) => actionSpots(g, tx, ty, from, [r]))) {
    for (const c of ring) {
      if (!clear(c[0], c[1])) continue;
      const pts = route(g, from, c);
      if (!pts) continue;
      const len = routeLength(from, pts);
      if (!best || len < best.len - 6) best = { pts, len };
    }
    if (best) break;
  }
  if (!best) return null;
  const ms = actionMs(best.len);
  return ms === null ? null : { pts: best.pts, ms };
}

/** Send my villager to act on a target at (tx, ty) u. */
export function approach(tx: number, ty: number, o: ApproachOpts = {}): Approach {
  const c = ctx, me = actors.mine;
  if (!c || !c.enabled() || me.asleep) return { ms: 0, walked: false };
  const from = c.where('mine');
  const p = plan(c.geo(), from, tx, ty, (x, y) => c.clear('mine', x, y), o.spot, o.reach);
  if (!p) {
    // too far (or nowhere to stand): turn to it, and the action plays as it always did
    faceToward('mine', tx);
    return { ms: 0, walked: false };
  }
  clearTimeout(homeTimers.mine);
  if (p.ms > 0) c.hush?.();
  const end = p.pts.at(-1) ?? from;
  const face = Math.abs(tx - end[0]) < 3 ? undefined : tx < end[0] ? 'l' : 'r';
  away.since ||= Date.now();
  walkTo('mine', p.pts, { ms: p.ms, from, face });
  const act = () => {
    if (o.tool) useTool('mine', o.tool, o.toolMs);
    if (o.motion) setMotion('mine', o.motion);
  };
  if (p.ms) setTimeout(act, p.ms);
  else {
    if (face) me.face = face;
    act();
  }
  me.busyUntil = Math.max(me.busyUntil, Date.now() + p.ms + (o.toolMs ?? 600));
  goHomeLater('mine', p.ms + (o.toolMs ?? 0) + (o.linger ?? LINGER[0] + Math.random() * (LINGER[1] - LINGER[0])));
  return { ms: p.ms, walked: true };
}

/** Turn my villager to face a target (an action that never walks: the reel, a wasp). */
export function turnTo(tx: number): void {
  if (ctx?.enabled() && !actors.mine.asleep) faceToward('mine', tx);
}

/** After `ms`, wander home (90 u/s), unless something else took the villager by then (then a little later). */
export function goHomeLater(id: 'mine' | 'partner', ms: number): void {
  clearTimeout(homeTimers[id]);
  homeTimers[id] = setTimeout(() => goHome(id), ms);
}

function goHome(id: 'mine' | 'partner'): void {
  const c = ctx;
  if (!c || !awayFromHome(id)) {
    if (id === 'mine') away.since = 0;
    return;
  }
  if (!c.enabled() || busy(id)) return goHomeLater(id, 1500);
  const from = c.where(id), home = actors[id].home;
  const pts = route(c.geo(), from, home);
  if (!pts) return place(id, home[0], home[1]);
  walkTo(id, pts, { speed: SPEED.wander, from, face: 'home', then: () => id === 'mine' && (away.since = 0) });
}

/** A sheet covers the scene: everyone stops where they are (a walk can't pause, so it ends at the live position). */
export function freeze(): void {
  const c = ctx;
  if (!c) return;
  for (const id of ['mine', 'partner'] as const) {
    if (!actors[id].walking) continue;
    const [x, y] = c.where(id);
    place(id, x, y);
    actors[id].busyUntil = 0;
  }
}

/** Uncovered again: whoever is away wanders home after a moment. */
export function thaw(): void {
  for (const id of ['mine', 'partner'] as const) if (awayFromHome(id)) goHomeLater(id, 2000 + Math.random() * 2000);
}

/** Back after over 30 s hidden: everyone is home, no walk. */
export function snapHome(): void {
  for (const id of ['mine', 'partner'] as const) {
    clearTimeout(homeTimers[id]);
    const [x, y] = actors[id].home;
    place(id, x, y);
    actors[id].face = 'home';
  }
  away.since = 0;
}
/** Hidden this long, everyone is home on return. */
export const SNAP_HOME_MS = 30_000;
