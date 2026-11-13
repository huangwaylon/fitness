// My villager is me (docs/design.md "Walking"): only a tap on empty ground walks it there (`sendTo`, and it rests
// there); a tap on something to do on the island (a bush, a flower, the rock, a weed, a dig spot, a fallen
// fruit or branch, a tree to shake, the water to cast into, a bug to net, a shell, a visitor, the partner) acts in
// place: my villager turns to it (`turnTo`) and the action plays at the target, its tool there. A new tap re-targets a
// walk from where it is. Under a sheet everyone stops where they are; hidden for over 30 s, everyone is back where it rests.
// The villagers also go about on their own (phase 2): the partner's wanders between points of interest (idle life asks:
// `wander`), comes over when mine has been away a while and they chat side by side; a goal met walks that person's
// villager to their tree (`goalWalk`), ふたりでぜんぶ brings everyone on the island to the middle for a high-five
// (`meetUp`). The guest's villager, while it's on the island, is in that life as a member's (2026-11-06): its chats,
// the meet-up, and on the guest's phone a member's villager follows it.
// The scene attaches what this needs from the DOM (`attachAvatar`): the walk geometry, a check that a villager standing
// at a spot covers no control, and where an actor's feet are right now.
import { actors, addFx, applyStep, awayFromHome, busy, faceToward, isRemote, later, place, setEmote, setMotion, setRouter, walkTo, type Facing } from '../motion/director.svelte.ts';
import { cue } from '#lib/sound/cues.ts';
import { FOLLOW_MS, MAX_HOPS, MEET, POI_LINGER, adjacent, besideSpots, pickPoi, pois, shouldFollow, type PoiKind } from '../../world/wander.ts';
import type { ActorId } from '../motion/reactions.ts';
import { SPEED } from '../../world/speed.ts';
import { REACH, actionSpots, route, routeLength, walkGeo, walkable, type Pt, type WalkGeo } from '../../world/walkGraph.ts';
import type { EmoteIcon } from '#lib/art.ts';
import { walkNav } from '../../world/nav.ts';
import { worldGen } from '../../world/world.ts';
import { planTap, standAt, type TapPlan } from './tapWalk.ts';
import { localKV, readJson, remove, writeJson } from '#lib/sync/storage.ts';
import { actorOf, castMe, guestPhone, islandActors, othersOf, whoOf } from '#lib/ui-state/cast.ts';
import type { Who } from '#lib/types.ts';
import { relayOffset } from './ambientClock.ts';
import { slotAt, slotRand } from './ambient.ts';
import { now } from '#lib/time/clock.ts';

interface AvatarCtx {
  geo: () => WalkGeo;
  /** A villager standing with its feet at (x, y) u covers no control (and not the other villager). */
  clear: (id: ActorId, x: number, y: number) => boolean;
  /** Where an actor's feet are now (mid-walk included), u. */
  where: (id: Villager) => Pt;
  /** Live, not covered, page visible. */
  enabled: () => boolean;
  /** Close a speech balloon (a walk closes it: it only opens over a villager standing still). */
  hush?: () => void;
}

let ctx: AvatarCtx | null = null;
/** Each villager's next step on its own (home, the next point of interest): one timer each, replaced by a new plan. */
const homeTimers: Partial<Record<Villager, ReturnType<typeof setTimeout>>> = {};
let followTimer: ReturnType<typeof setTimeout> | undefined;
/** When my villager left home for something (a member's villager follows after FOLLOW_MS), and whose did. */
const away: { since: number; followed: Villager | null } = { since: 0, followed: null };
/** A visitor is on the island (Visitor.svelte): centre stage is theirs. `beat`: the visitor's turn on idle life's slot,
 *  with the slot's PRNG (Visitor.svelte sets it while one is out; island/visitorLife.ts); `kk` K.K.'s on his stool, the
 *  same slot's (KKSlider.svelte; island/kkSlider.ts). */
export const presence: { visitor: boolean; beat: ((r: () => number) => void) | null; guestBeat: ((r: () => number) => void) | null; kk: ((r: () => number) => void) | null } = { visitor: false, beat: null, guestBeat: null, kk: null };
/** The villagers (ui-state/cast.ts): mine, the partner's and the third (the guest's on a member's phone, B's on the
 *  guest's). */
type Villager = 'mine' | 'partner' | 'third';
/** When each villager's person last steered it (device ms): my taps here, the partner's walks over the relay. Ambient
 *  life leaves it alone a while after (ambient.ts held). */
export const steered: Partial<Record<Villager, number>> = {};
/** The guest's villager here (it stands where its taps put it: no phone's life sends it off on its own). */
const guests = (id: Villager): boolean => whoOf(id) === 'G';
/** The members' villagers besides `id` (one of theirs is out at a time). */
const otherMembers = (id: Villager): Villager[] => othersOf(id).filter((o) => !guests(o));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
/** When the partner's change on the relay (`t`, the relay's ms) was, on this device's clock (steered's): the same instant
 *  on both phones, not each one's arrival time (ambient.ts held()'s window then differed per phone). */
const steeredAt = (t: number | undefined): number => (t === undefined ? Date.now() : t - relayOffset());
/** A linger after an event before wandering home, LINGER's, the same on both phones: the slot's seeded roll for that
 *  person's villager (Math.random put an absent person's villager somewhere else on each phone for a few seconds). */
function lingerMs(id: Villager, kind: string): number {
  const s = slotAt(now().getTime(), relayOffset());
  return LINGER[0] + slotRand(s.date, s.slot, `linger:${kind}:${whoOf(id)}`)() * (LINGER[1] - LINGER[0]);
}

/** Where a tap sent my villager (spec §4): it rests there, not wandering home, and the partner's phone shows it there
 *  too, however long my phone is gone (the relay keeps each person's last walk: docs/backend.md#shared-world). And where it stands (`pos`: the end of its latest move, whoever made it),
 *  so the island opens with it there again: back from a room, a reload, the app reopened (localStorage, with `rest`,
 *  per person: the demo's two players are two tabs of one browser). */
const STAY_KEY = 'island-stay';
type Kept = { rest?: unknown; pos?: unknown; at?: unknown };
const ptOf = (v: unknown): Pt | null => (Array.isArray(v) && v.length === 2 && v.every(Number.isFinite) ? [v[0], v[1]] : null);
// (in memory too: kept only there when storage fails, storage.ts reporting it)
let mem: { who: Who; rest: Pt | null; pos: Pt | null } | null = null;
function my(): { who: Who; rest: Pt | null; pos: Pt | null } {
  const who = castMe();
  if (mem?.who === who) return mem;
  // (before Nov 2026: one record, `at` where it rests, for the day)
  const k = readJson<Kept>(localKV(), `${STAY_KEY}.${who}`) ?? readJson<Kept>(localKV(), STAY_KEY) ?? {};
  return (mem = { who, rest: ptOf(k.rest ?? k.at), pos: ptOf(k.pos) });
}
const write = () => {
  const m = my();
  writeJson(localKV(), `${STAY_KEY}.${m.who}`, { ...(m.rest ? { rest: m.rest } : {}), ...(m.pos ? { pos: m.pos } : {}) });
  remove(localKV(), STAY_KEY);
};
function keepStay(p: Pt | null) {
  my().rest = p;
  write();
}
/** Where my villager stands now, or will once its move is over (villagerSync's every move of mine, said or not). */
export function keepPos(p: Pt): void {
  const m = my();
  if (m.pos?.[0] === p[0] && m.pos?.[1] === p[1]) return;
  m.pos = [p[0], p[1]];
  write();
}
/** Where my villager stands as the island opens (not out of a door): where it last was,
 *  however long ago, on standable ground (a layout change since may have put something there), else where it rests;
 *  null: home (never placed). */
export function startAt(): Pt | null {
  const m = my();
  const p = m.pos ?? m.rest;
  return p && standAt(walkNav(), p[0], p[1]);
}
/** Where the partner sent their villager today (their last walk, live or replayed by the relay), if anywhere. */
const stays: Partial<Record<Villager, Pt | null>> = {};
/** Where a villager rests: where its person sent it, else its home. */
const restOf = (id: Villager): Pt => (id === 'mine' ? my().rest : stays[id]) ?? actors[id].home;
/** Out of a building's door (island/doorOut.ts): my villager stands just outside it, facing out (as if it just
 *  stepped out), and rests there. */
export function stepOut(at: Pt, face: Facing = 'home'): void {
  keepStay(at);
  keepPos(at);
  steered.mine = Date.now();
  actors.mine.face = face;
  place('mine', at[0], at[1]);
}
/** How far apart the villagers may be for the partner to come over (u): a walk across the island is too far. */
const FOLLOW_RANGE = 600;

export function attachAvatar(c: AvatarCtx): () => void {
  ctx = c;
  setRouter((id) => (id === 'host' || id === 'visitor' || id === 'guest' || id === 'kk' ? null : route(c.geo(), c.where(id), restOf(id))));
  return () => {
    if (ctx === c) {
      ctx = null;
      setRouter(null);
    }
    for (const id of ['mine', 'partner', 'third'] as const) clearTimeout(homeTimers[id]);
    clearTimeout(followTimer);
  };
}

/** Linger at a spot before wandering home (ms). */
const LINGER: readonly [number, number] = [4000, 6000];

/** The best spot to stand at by (tx, ty) from `from` and the way there (at SPEED.action): the nearest clear spot by
 *  walking distance, the close ring first (a goal met walks its villager to the tree). */
export function plan(g: WalkGeo, from: Pt, tx: number, ty: number, clear: (x: number, y: number) => boolean, reach: readonly number[] = REACH): { pts: Pt[]; ms: number } | null {
  let best: { pts: Pt[]; len: number } | null = null;
  // the nearest by walking of the close spots; the further ring only when none of those will do
  for (const r of reach) {
    for (const c of actionSpots(g, tx, ty, from, [r])) {
      if (!clear(c[0], c[1])) continue;
      const pts = route(g, from, c);
      if (!pts) continue;
      const len = routeLength(from, pts);
      if (!best || len < best.len - 6) best = { pts, len };
    }
    if (best) break;
  }
  return best && { pts: best.pts, ms: (best.len / SPEED.action) * 1000 };
}

/** My villager and a tap on something to act on at x (docs/design.md "Walking": only a tap on empty ground walks): it
 *  stays where it is and turns to it; the action plays at the target (its tool there, as NH's floating ones). */
export function turnTo(tx: number): void {
  if (!ctx?.enabled() || actors.mine.asleep) return;
  steered.mine = Date.now();
  faceToward('mine', tx);
}

/** Tap-to-walk (spec §4, tapWalk.ts): my villager runs (300 u/s) to the tapped ground, a building's door (its
 *  footprint), the nearest bank facing the water (water) or the nearest walkable point within 40u (anything else),
 *  up the stairs (nav.ts), and stays there for the session. Null when there's nowhere to go. */
export function sendTo(x: number, z: number): TapPlan | null {
  const c = ctx, me = actors.mine;
  if (!c || !c.enabled() || me.asleep) return null;
  // nav.ts snaps the tap (a building's door, a bank facing the water, the nearest walkable point) and finds the way
  const from = c.where('mine'), p = planTap(walkNav(), from, x, z, c.geo().extra);
  if (!p) return null;
  steered.mine = Date.now();
  clearTimeout(homeTimers.mine);
  c.hush?.();
  return { ...p, ms: run(from, p.pts, p.to, p.snap.face) };
}

/** Up to a seat (IslandScene sitOn, sitting.ts): my villager runs to its spot (a step in front of it) by the walk
 *  graph, faces us there and, standing still on it, is on it (world.ts seatAt: the 3D villager turns and sits or lies
 *  down); it stays there as a tap-walk's end does. `then` on arrival. Null when there's no way there. */
export function sitTo(at: Pt, then: () => void): number | null {
  const c = ctx;
  if (!c || !c.enabled() || actors.mine.asleep) return null;
  const from = c.where('mine'), pts = route(c.geo(), from, at);
  if (!pts) return null;
  steered.mine = Date.now();
  clearTimeout(homeTimers.mine);
  c.hush?.();
  return run(from, pts.length ? pts : [at], at, 'home', then);
}

/** My villager's run of a tap (to the ground, or a seat): kept as where it stays, and the partner may follow. */
function run(from: Pt, pts: readonly Pt[], to: Pt, face: Facing | undefined, then?: () => void): number {
  const me = actors.mine;
  const ms = walkTo('mine', pts, { speed: SPEED.run, from, face, then });
  me.busyUntil = Math.max(me.busyUntil, Date.now() + ms);
  keepStay(Math.hypot(to[0] - me.home[0], to[1] - me.home[1]) <= 8 ? null : to);
  away.since ||= Date.now();
  clearTimeout(followTimer);
  followTimer = setTimeout(checkFollow, Math.max(0, away.since + FOLLOW_MS - Date.now()) + ms + 50);
  return ms;
}

/** The partner tapped somewhere on their phone (the relay's `walk`, world units): their villager here runs there too,
 *  by the same planner from where it stands (no positions are sent), and rests there for the day, as on their phone. */
export function partnerTo(x: number, z: number, id: Villager = 'partner', t?: number): boolean {
  const c = ctx;
  if (!c || !c.enabled() || actors[id].asleep) return false;
  const from = c.where(id), p = planTap(walkNav(), from, x, z, c.geo().extra);
  if (!p) return false;
  steered[id] = steeredAt(t);
  stays[id] = restAt(p.to, actors[id].home);
  clearTimeout(homeTimers[id]);
  walkTo(id, p.pts, { speed: SPEED.run, from, face: p.snap.face, remote: true });
  return true;
}

/** The partner's villager rests where they sent it earlier today (the relay's replay of their last walk, or the sheet's
 *  day row): put there at once, no walk (a phone opening later finds it where their phone has it). */
export function partnerRestsAt(x: number, z: number, id: Villager = 'partner'): void {
  const p = planTap(walkNav(), [x, z], x, z, []);
  const to = p?.to ?? [x, z];
  stays[id] = restAt(to, actors[id].home);
  if (!actors[id].walking && !busy(id)) {
    clearTimeout(homeTimers[id]);
    place(id, to[0], to[1], true);
  }
}
/** Where another's villager rests when it isn't the relay's to move (their last walk's end; villagerSync). */
export function setPartnerRest(x: number, z: number, id: Villager = 'partner'): void {
  stays[id] = restAt([x, z], actors[id].home);
}
/** A rest spot (null: home, within 8u of it). */
const restAt = (p: Pt, home: Pt): Pt | null => (Math.hypot(p[0] - home[0], p[1] - home[1]) <= 8 ? null : [p[0], p[1]]);
/** The partner did something on their phone (the shared world: a catch, a pick-up, a shake): their villager here turns
 *  to it where it stands (no walking over, as on their own phone) and the result plays at the target. */
export function partnerTurnTo(tx: number, who?: Who, t?: number): void {
  const id = who ? actorOf(who) : 'partner';
  if (!ctx?.enabled() || actors[id].asleep || id === 'mine') return;
  steered[id] = steeredAt(t);
  faceToward(id, tx);
}

/** After `ms`, wander home (90 u/s), unless something else took the villager by then (then a little later). */
function goHomeLater(id: Villager, ms: number): void {
  if (guests(id) && id !== 'mine') return; // the guest's villager is its phone's to move (back to where its taps put it)
  clearTimeout(homeTimers[id]);
  homeTimers[id] = setTimeout(() => goHome(id), ms);
}

function goHome(id: Villager): void {
  if (inside[id] || (guests(id) && id !== 'mine')) return;
  const c = ctx;
  const home = restOf(id), at = c?.where(id);
  if (!c || !at || Math.hypot(at[0] - home[0], at[1] - home[1]) <= 2) return id === 'mine' ? backHome() : undefined;
  if (!c.enabled() || busy(id)) return goHomeLater(id, 1500);
  const from = at;
  const pts = route(c.geo(), from, home);
  if (!pts) return place(id, home[0], home[1]);
  walkTo(id, pts, { speed: SPEED.wander, from, face: 'home', then: () => id === 'mine' && backHome() });
}
/** My villager is home: whoever came along heads home too. */
function backHome() {
  away.since = 0;
  clearTimeout(followTimer);
  if (away.followed && awayFromHome(away.followed)) goHomeLater(away.followed, rand(800, 1600));
  away.followed = null;
}

/** In the tent (docs/design.md "The tent": one place at a time): not on the island, so its life here leaves it alone. */
const inside: Partial<Record<Villager, boolean>> = {};
export function setInside(id: Villager, on: boolean): void {
  inside[id] = on;
  if (on) clearTimeout(homeTimers[id]);
}

/** Free to set off on its own: awake, not busy, standing still, on the island. */
const free = (id: Villager) => !inside[id] && !actors[id].asleep && !busy(id) && !actors[id].walking;

/** Mine has been away FOLLOW_MS: a member's villager comes over and stands beside it (then they chat): the partner's
 *  on a member's phone; on the guest's, A's or B's, whichever is free. */
function checkFollow() {
  const c = ctx;
  if (!c || !c.enabled() || !awayFromHome('mine')) return;
  // (a villager whose person is here is theirs to move: villagerSync; the guest's always is)
  const by = otherMembers('mine').find((o) => !isRemote(o) && free(o));
  if (!shouldFollow(away.since, Date.now(), !!by && !away.followed)) return;
  if (actors.mine.walking) return void (followTimer = setTimeout(checkFollow, 1000));
  const id = by!, g = c.geo(), at = c.where('mine'), from = c.where(id);
  if (Math.hypot(at[0] - from[0], at[1] - from[1]) > FOLLOW_RANGE) return;
  for (const s of besideSpots(g, at, from)) {
    if (!c.clear(id, s[0], s[1])) continue;
    const pts = route(g, from, s);
    if (!pts) continue;
    away.followed = id;
    clearTimeout(homeTimers[id]);
    walkTo(id, pts, { speed: SPEED.wander, from, then: () => arrived(id, 'spot', 0) });
    return;
  }
}

/** Idle life: send a villager off to a point of interest or a few (one walker leaves home at a time). */
export function wander(id: Villager, stops = 1 + Math.floor(Math.random() * MAX_HOPS)): boolean {
  const c = ctx;
  if (!c || !c.enabled() || guests(id) || !free(id) || awayFromHome(id) || isRemote(id)) return false;
  if (otherMembers(id).some((o) => actors[o].walking || awayFromHome(o))) return false;
  return hop(id, stops);
}

/** Idle life's outing from the slot (ambient.ts villagerBeats): through those points of interest, lingering at each as
 *  given, then home; the same walk on both phones. */
export function outing(id: Villager, stops: readonly Stop[], together = false): boolean {
  const c = ctx;
  if (!c || !c.enabled() || !free(id) || awayFromHome(id) || !stops.length) return false;
  if (!together && otherMembers(id).some((o) => actors[o].walking || awayFromHome(o))) return false;
  return hop(id, stops.length, stops);
}
type Stop = { node: string; linger: number };
/** Seats a wander of its own never picks (the slot's beats send a villager there). */
const FAR_SEATS = new Set(['stoolW', 'stoolE', 'seatPondL', 'seatPondR']);

/** The next point of interest (`stops`' next, or one at random) and on; false (home soon) when there's none to go to. */
function hop(id: Villager, left: number, stops?: readonly Stop[]): boolean {
  const c = ctx;
  if (!c || !c.enabled() || busy(id)) return goHomeLater(id, 1500), false;
  const g = c.geo(), from = c.where(id);
  const stop = stops?.[stops.length - left];
  // (a stop the slot named may be further than a random wander goes: the campfire, the bar, the pond's bench)
  const list = pois(g, presence.visitor, stop ? undefined : actors[id].home).filter((p) => (stop ? p.name === stop.node : c.clear(id, p.at[0], p.at[1]) && p.kind !== 'bar' && !FAR_SEATS.has(p.name)));
  for (let tries = 0; tries < 4; tries++) {
    const p = stop ? list[0] : pickPoi(list, from, Math.random);
    if (!p) break;
    const pts = route(g, from, p.at);
    if (!pts) break;
    clearTimeout(homeTimers[id]);
    walkTo(id, pts, { speed: SPEED.wander, from, then: () => arrived(id, p.kind, left - 1, stops, stop?.linger) });
    return true;
  }
  if (awayFromHome(id)) goHomeLater(id, 500);
  return false;
}

/** At a point of interest (or beside the other): chat if the other stands close, else a look around (at the shore: a
 *  stare out to sea); then the next point or home. */
function arrived(id: Villager, kind: PoiKind, left: number, stops?: readonly Stop[], linger?: number) {
  const c = ctx;
  if (!c) return;
  const near = othersOf(id).find((o) => !actors[o].walking && adjacent(c.where(id), c.where(o)));
  // a seat or the bar: it sits (or does its pull-up) facing us (IslandScene draws it seated: world.ts seatAt)
  if (kind === 'seat' || kind === 'bar') actors[id].face = 'home';
  else if (near) chat(id, near);
  else if (kind === 'shore') {
    actors[id].face = 'home'; // out to sea, toward the camera
    setMotion(id, 'turn');
  } else setMotion(id, kind === 'tree' ? 'stretch' : kind === 'rock' ? 'nod' : 'turn');
  const stay = linger ?? rand(POI_LINGER[0], POI_LINGER[1]);
  if (left > 0) {
    clearTimeout(homeTimers[id]);
    homeTimers[id] = setTimeout(() => hop(id, left, stops), stay);
  } else if (away.followed !== id) goHomeLater(id, stay);
}

/** Two villagers side by side chat (idle life's chat: face each other, a nod, a laugh). */
function chat(id: Villager, other: Villager) {
  const t = Date.now();
  actors[id].busyUntil = Math.max(actors[id].busyUntil, t + 3200);
  actors[other].busyUntil = Math.max(actors[other].busyUntil, t + 3200);
  faceToward(id, actors[other].x);
  applyStep(id, { actor: id, motion: 'nod' });
  later(other, 900, () => (faceToward(other, actors[id].x), applyStep(other, { actor: other, motion: 'laugh' })));
}

/** A goal met: that person's villager walks to their tree (briskly; no cap, it's an event) as the fruit falls. Returns
 *  the ms until it's there (0: it reacts where it stands). */
export function goalWalk(id: Villager): number {
  const c = ctx;
  if (!c || !c.enabled() || actors[id].asleep || inside[id]) return 0;
  // their tree stands on their side (A's on the left): the one nearer their home
  const { treeA, treeB } = c.geo().nodes, hx = actors[id].home[0];
  const tx = Math.abs(treeA[0] - hx) <= Math.abs(treeB[0] - hx) ? treeA : treeB;
  const from = c.where(id);
  const p = plan(c.geo(), from, tx[0], tx[1] - 18, (x, y) => c.clear(id, x, y), [0, 26, 40]);
  if (!p) return 0;
  const { ms } = p;
  clearTimeout(homeTimers[id]);
  walkTo(id, p.pts, { ms, from, face: tx[0] < (p.pts.at(-1) ?? from)[0] ? 'l' : 'r' });
  goHomeLater(id, ms + 2600 + lingerMs(id, 'goal'));
  return ms;
}

/** ふたりでぜんぶ: everyone on the island (both members' villagers, and the guest's while it's here) walks to the middle
 *  of the lawn and high-fives there, on every phone (a villager whose person is here walks on its own phone: the relay
 *  brings it). Returns the ms until the high-five (0: the members can't both go). */
export function meetUp(): number {
  const c = ctx;
  if (!c || !c.enabled()) return 0;
  const ids = islandActors().filter((id) => !inside[id] && !actors[id].asleep);
  const [a, b] = ids.filter((id) => !guests(id));
  if (!a || !b) return 0;
  const g = c.geo();
  // each member to the meeting spot on its own side (whose home is further left takes the left one: A's), the guest
  // between them a step in front
  const left = actors[a].home[0] <= actors[b].home[0] ? a : b;
  const face = (id: Villager): Facing => (guests(id) ? 'home' : id === left ? 'r' : 'l');
  const ways = ids.map((id) => {
    const from = c.where(id), to = MEET[guests(id) ? 'G' : id === left ? 'A' : 'B'];
    const pts = c.clear(id, to[0], to[1]) ? route(g, from, to) : null;
    return { id, from, pts, len: pts ? routeLength(from, pts) : 0 };
  });
  // (the guest's comes along where there's a way for it)
  if (ways.some((w) => !w.pts && !guests(w.id))) return 0;
  const go = ways.filter((w) => w.pts);
  const ms = Math.max(400, (Math.max(...go.map((w) => w.len)) / SPEED.action) * 1000);
  for (const w of go) {
    clearTimeout(homeTimers[w.id]);
    walkTo(w.id, w.pts!, { ms, from: w.from, face: face(w.id) });
  }
  setTimeout(() => highFive(go.map((w) => w.id), face), ms);
  for (const w of go) goHomeLater(w.id, ms + 2400 + lingerMs(w.id, 'meet'));
  return ms;
}

/** The high-five: everyone there hops, the members face to face, with sparkles and one joyful sound. */
function highFive(ids: readonly Villager[], face: (id: Villager) => Facing) {
  for (const id of ids) {
    actors[id].face = face(id);
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
  for (const id of ['mine', 'partner', 'third'] as const) {
    if (!actors[id].walking) continue;
    const [x, y] = c.where(id);
    place(id, x, y);
    actors[id].busyUntil = 0;
  }
}

/** Uncovered again: whoever is away wanders home after a moment. */
export function thaw(): void {
  for (const id of ['mine', 'partner', 'third'] as const) if (awayFromHome(id)) goHomeLater(id, 2000 + Math.random() * 2000);
}

/** Back after over 30 s hidden: everyone is home, no walk. */
export function snapHome(): void {
  for (const id of ['mine', 'partner', 'third'] as const) {
    clearTimeout(homeTimers[id]);
    if (guests(id)) continue; // where the guest put it (its phone comes back to it, or it left)
    const [x, y] = restOf(id);
    place(id, x, y);
    actors[id].face = 'home';
  }
  away.since = 0;
  away.followed = null;
}
/** Hidden this long, everyone is home on return. */
export const SNAP_HOME_MS = 30_000;

// The visitor (Visitor.svelte, visitorLife.ts) walks on the island's open ground: its own spot isn't an obstacle to it.
let openGeo: { gen: number; geo: WalkGeo } | null = null;
const open = (): WalkGeo => (openGeo?.gen === worldGen() ? openGeo : (openGeo = { gen: worldGen(), geo: walkGeo() })).geo;
/** The visitor's way from `from` to `to` on the walk graph (null: none). */
export const visitorRoute = (from: Pt, to: Pt): Pt[] | null => route(open(), from, to);
/** Each villager as ambient life sees it (ambient.ts VillagerState): where it stands (rounded), its home, whether it is
 *  free; `null` before the scene attached. */
export function ambientVillager(id: Villager): { at: Pt; home: Pt; free: boolean } | null {
  const c = ctx;
  if (!c) return null;
  const [x, z] = c.where(id);
  return { at: [Math.round(x), Math.round(z)], home: actors[id].home, free: free(id) };
}

/** The points of interest an outing may go to (every one, by node: ambient.ts keeps them within reach of home). */
export const ambientPois = (): { node: string; at: Pt }[] => (ctx ? pois(ctx.geo(), presence.visitor).map((p) => ({ node: p.name, at: p.at })) : []);

/** Whether the visitor may stand at (x, y): walkable ground. */
export const visitorWalkable = (x: number, y: number): boolean => walkable(open(), x, y);

/** A villager is free to go over to the visitor: the partner, both villagers home, nobody walking. */
export function villagerFree(): boolean {
  // (the guest's phone: A and B are the members' phones' to send over)
  if (!ctx?.enabled() || guestPhone() || isRemote('partner') || actors.mine.walking || actors.partner.walking || awayFromHome('mine') || awayFromHome('partner')) return false;
  return free('partner');
}

/** The partner comes over to the visitor standing at `at` (one at a time): beside them, they face each other, a nod
 *  and an emote, the visitor answers (`answer`, with where the villager stands), a laugh; then home. */
export function meetVisitor(at: Pt, answer: (x: number) => void): boolean {
  const c = ctx;
  if (!c || !villagerFree()) return false;
  const id: Villager = 'partner', g = c.geo(), from = c.where(id);
  // beside them, else a step in front of them to one side (centre stage sits between the fruit rows)
  const side = from[0] <= at[0] ? -1 : 1;
  const front = ([[side * 16, -40], [-side * 16, -40], [side * 10, -48], [-side * 10, -48], [0, -52]] as const)
    .map(([dx, dy]) => [Math.round(at[0] + dx), Math.round(at[1] + dy)] as Pt).filter(([x, y]) => walkable(g, x, y));
  for (const s of [...besideSpots(g, at, from), ...front]) {
    if (!c.clear(id, s[0], s[1])) continue;
    const pts = route(g, from, s);
    if (!pts) continue;
    clearTimeout(homeTimers[id]);
    walkTo(id, pts, { speed: SPEED.wander, from, then: () => {
      faceToward(id, at[0]);
      const hi: EmoteIcon = Math.random() < 0.5 ? 'mark-note' : 'glee';
      actors[id].busyUntil = Math.max(actors[id].busyUntil, Date.now() + 3200);
      setMotion(id, 'nod');
      setEmote(id, hi);
      answer(s[0]);
      later(id, 1300, () => setMotion(id, 'laugh'));
      goHomeLater(id, rand(3500, 5000));
    } });
    return true;
  }
  return false;
}
