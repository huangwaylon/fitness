// My villager is me (docs/design.md "Walking"): a tap on something to do on the island (a bush, a flower, the rock, a
// weed, a dig spot, a fallen fruit or branch, a tree to shake, the sea to cast into, a bug to net, a shell, a visitor)
// walks my villager to it first, then the action plays there, tool in hand. The outcome is decided at the tap; the
// walk is cosmetic and short (240 u/s, 150–900 ms; a walk over 1.2 s isn't made: the villager turns and the action
// plays from where it is). Afterwards it stays 4–6 s, then wanders home at 90 u/s. A new tap re-targets it from where
// it is. Under a sheet everyone stops where they are; hidden for over 30 s, everyone is back home.
// The villagers also go about on their own (phase 2): the partner's wanders between points of interest (idle life asks:
// `wander`), comes over when mine has been away a while and they chat side by side; a goal met walks that person's
// villager to their tree (`goalWalk`), ふたりでぜんぶ brings both to the middle for a high-five (`meetUp`).
// The scene attaches what this needs from the DOM (`attachAvatar`): the walk geometry, a check that a villager standing
// at a spot covers no control, and where an actor's feet are right now.
import { actors, addFx, applyStep, awayFromHome, busy, faceToward, later, place, setEmote, setMotion, setRouter, useTool, walkTo, type Tool } from '../motion/director.svelte.ts';
import { cue } from '#lib/sound/cues.ts';
import { FOLLOW_MS, MAX_HOPS, MEET, POI_LINGER, adjacent, besideSpots, pickPoi, pois, shouldFollow, type PoiKind } from './wander.ts';
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
/** Each villager's next step on its own (home, the next point of interest): one timer each, replaced by a new plan. */
const homeTimers: Partial<Record<'mine' | 'partner', ReturnType<typeof setTimeout>>> = {};
let followTimer: ReturnType<typeof setTimeout> | undefined;
/** When my villager left home for something (the partner follows after FOLLOW_MS), and whether the partner did. */
const away = { since: 0, followed: false };
/** A visitor is on the island (Visitor.svelte): centre stage is theirs. */
export const presence = { visitor: false };
type Villager = 'mine' | 'partner';
const otherOf = (id: Villager): Villager => (id === 'mine' ? 'partner' : 'mine');
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function attachAvatar(c: AvatarCtx): () => void {
  ctx = c;
  setRouter((id) => (id === 'host' ? null : route(c.geo(), c.where(id), actors[id].home)));
  return () => {
    if (ctx === c) {
      ctx = null;
      setRouter(null);
    }
    for (const id of ['mine', 'partner'] as const) clearTimeout(homeTimers[id]);
    clearTimeout(followTimer);
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
  /** Somewhere set apart (the pond's back bank): the walk may take a little longer (walkGraph ACTION_MS.far). */
  far?: boolean;
}

/** The best spot to act on (tx, ty) from `from` and the way there: the nearest clear spot by walking distance. */
export function plan(g: WalkGeo, from: Pt, tx: number, ty: number, clear: (x: number, y: number) => boolean, spot?: Pt, reach: readonly number[] = REACH, capped = true, far = false): { pts: Pt[]; ms: number } | null {
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
  const ms = capped ? actionMs(best.len, far) : (best.len / SPEED.action) * 1000;
  return ms === null ? null : { pts: best.pts, ms };
}

/** Send my villager to act on a target at (tx, ty) u. */
export function approach(tx: number, ty: number, o: ApproachOpts = {}): Approach {
  const c = ctx, me = actors.mine;
  if (!c || !c.enabled() || me.asleep) return { ms: 0, walked: false };
  const from = c.where('mine');
  const p = plan(c.geo(), from, tx, ty, (x, y) => c.clear('mine', x, y), o.spot, o.reach, true, o.far);
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
  clearTimeout(followTimer);
  followTimer = setTimeout(checkFollow, Math.max(0, away.since + FOLLOW_MS - Date.now()) + 50);
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

function goHome(id: Villager): void {
  const c = ctx;
  if (!c || !awayFromHome(id)) return id === 'mine' ? backHome() : undefined;
  if (!c.enabled() || busy(id)) return goHomeLater(id, 1500);
  const from = c.where(id), home = actors[id].home;
  const pts = route(c.geo(), from, home);
  if (!pts) return place(id, home[0], home[1]);
  walkTo(id, pts, { speed: SPEED.wander, from, face: 'home', then: () => id === 'mine' && backHome() });
}
/** My villager is home: a partner who came along heads home too. */
function backHome() {
  away.since = 0;
  clearTimeout(followTimer);
  if (away.followed && awayFromHome('partner')) goHomeLater('partner', rand(800, 1600));
  away.followed = false;
}

/** Free to set off on its own: awake, not busy, standing still. */
const free = (id: Villager) => !actors[id].asleep && !busy(id) && !actors[id].walking;

/** Mine has been away FOLLOW_MS: the partner comes over and stands beside it (then they chat). */
function checkFollow() {
  const c = ctx;
  if (!c || !c.enabled() || !awayFromHome('mine')) return;
  if (!shouldFollow(away.since, Date.now(), free('partner') && !away.followed)) return;
  if (actors.mine.walking) return void (followTimer = setTimeout(checkFollow, 1000));
  const g = c.geo(), at = c.where('mine'), from = c.where('partner');
  for (const s of besideSpots(g, at, from)) {
    if (!c.clear('partner', s[0], s[1])) continue;
    const pts = route(g, from, s);
    if (!pts) continue;
    away.followed = true;
    clearTimeout(homeTimers.partner);
    walkTo('partner', pts, { speed: SPEED.wander, from, then: () => arrived('partner', 'spot', 0) });
    return;
  }
}

/** Idle life: send a villager off to a point of interest or a few (one walker leaves home at a time). */
export function wander(id: Villager): boolean {
  const c = ctx, other = otherOf(id);
  if (!c || !c.enabled() || !free(id) || awayFromHome(id)) return false;
  if (actors[other].walking || awayFromHome(other)) return false;
  return hop(id, 1 + Math.floor(Math.random() * MAX_HOPS));
}

function hop(id: Villager, left: number): boolean {
  const c = ctx;
  if (!c || !c.enabled() || busy(id)) return goHomeLater(id, 1500), false;
  const g = c.geo(), from = c.where(id);
  const list = pois(g, presence.visitor).filter((p) => c.clear(id, p.at[0], p.at[1]));
  for (let tries = 0; tries < 4; tries++) {
    const p = pickPoi(list, from, Math.random);
    if (!p) break;
    const pts = route(g, from, p.at);
    if (!pts) continue;
    clearTimeout(homeTimers[id]);
    walkTo(id, pts, { speed: SPEED.wander, from, then: () => arrived(id, p.kind, left - 1) });
    return true;
  }
  if (awayFromHome(id)) goHomeLater(id, 500);
  return false;
}

/** At a point of interest (or beside the other): chat if the other stands close, else a look around (at the shore: a
 *  stare out to sea); then the next point or home. */
function arrived(id: Villager, kind: PoiKind, left: number) {
  const c = ctx, other = otherOf(id);
  if (!c) return;
  if (!actors[other].walking && adjacent(c.where(id), c.where(other))) chat(id);
  else if (kind === 'shore') {
    actors[id].face = 'home'; // out to sea, toward the camera
    setMotion(id, 'turn');
  } else setMotion(id, kind === 'tree' ? 'stretch' : kind === 'rock' ? 'nod' : 'turn');
  const stay = rand(POI_LINGER[0], POI_LINGER[1]);
  if (left > 0) {
    clearTimeout(homeTimers[id]);
    homeTimers[id] = setTimeout(() => hop(id, left), stay);
  } else if (!(id === 'partner' && away.followed)) goHomeLater(id, stay);
}

/** Two villagers side by side chat (idle life's chat: face each other, a nod, a laugh). */
function chat(id: Villager) {
  const other = otherOf(id), t = Date.now();
  actors[id].busyUntil = Math.max(actors[id].busyUntil, t + 3200);
  actors[other].busyUntil = Math.max(actors[other].busyUntil, t + 3200);
  applyStep(id, { actor: id, face: 'other', motion: 'nod' });
  later(other, 900, () => applyStep(other, { actor: other, face: 'other', motion: 'laugh' }));
}

/** A goal met: that person's villager walks to their tree (briskly; no cap, it's an event) as the fruit falls. Returns
 *  the ms until it's there (0: it reacts where it stands). */
export function goalWalk(id: Villager): number {
  const c = ctx;
  if (!c || !c.enabled() || actors[id].asleep) return 0;
  const tx = id === 'mine' ? c.geo().nodes.treeA : c.geo().nodes.treeB;
  const from = c.where(id);
  const p = plan(c.geo(), from, tx[0], tx[1] - 18, (x, y) => c.clear(id, x, y), undefined, [0, 26, 40], false);
  if (!p) return 0;
  const { ms } = p;
  clearTimeout(homeTimers[id]);
  walkTo(id, p.pts, { ms, from, face: tx[0] < (p.pts.at(-1) ?? from)[0] ? 'l' : 'r' });
  goHomeLater(id, ms + 2600 + rand(LINGER[0], LINGER[1]));
  return ms;
}

/** ふたりでぜんぶ: both walk to the middle of the lawn and high-five there. Returns the ms until the high-five. */
export function meetUp(): number {
  const c = ctx;
  if (!c || !c.enabled() || actors.mine.asleep || actors.partner.asleep) return 0;
  const g = c.geo();
  const ways = (['mine', 'partner'] as const).map((id) => {
    const from = c.where(id), to = MEET[id];
    const pts = c.clear(id, to[0], to[1]) ? route(g, from, to) : null;
    return { id, from, pts, len: pts ? routeLength(from, pts) : 0 };
  });
  if (ways.some((w) => !w.pts)) return 0;
  const ms = Math.max(400, (Math.max(...ways.map((w) => w.len)) / SPEED.action) * 1000);
  for (const w of ways) {
    clearTimeout(homeTimers[w.id]);
    walkTo(w.id, w.pts!, { ms, from: w.from, face: w.id === 'mine' ? 'r' : 'l' });
  }
  setTimeout(() => highFive(), ms);
  for (const w of ways) goHomeLater(w.id, ms + 2400 + rand(LINGER[0], LINGER[1]));
  return ms;
}

/** The high-five: both hop, face to face, with sparkles and one joyful sound. */
function highFive() {
  for (const id of ['mine', 'partner'] as const) {
    actors[id].face = id === 'mine' ? 'r' : 'l';
    setMotion(id, 'hop');
    setEmote(id, 'mark-sparkle');
    addFx(id, 'sparkles');
  }
  cue('emote-joy');
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
  away.followed = false;
}
/** Hidden this long, everyone is home on return. */
export const SNAP_HOME_MS = 30_000;
