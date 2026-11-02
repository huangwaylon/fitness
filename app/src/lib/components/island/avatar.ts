// My villager is me (docs/design.md "Walking"): only a tap on empty ground walks it there (`sendTo`, and it stays
// there for the day); a tap on something to do on the island (a bush, a flower, the rock, a weed, a dig spot, a fallen
// fruit or branch, a tree to shake, the water to cast into, a bug to net, a shell, a visitor, the partner) acts in
// place: my villager turns to it (`turnTo`) and the action plays at the target, its tool there. A new tap re-targets a
// walk from where it is. Under a sheet everyone stops where they are; hidden for over 30 s, everyone is back home.
// The villagers also go about on their own (phase 2): the partner's wanders between points of interest (idle life asks:
// `wander`), comes over when mine has been away a while and they chat side by side; a goal met walks that person's
// villager to their tree (`goalWalk`), ふたりでぜんぶ brings both to the middle for a high-five (`meetUp`).
// The scene attaches what this needs from the DOM (`attachAvatar`): the walk geometry, a check that a villager standing
// at a spot covers no control, and where an actor's feet are right now.
import { actors, addFx, applyStep, awayFromHome, busy, faceToward, isRemote, later, place, setEmote, setMotion, setRouter, walkTo } from '../motion/director.svelte.ts';
import { cue } from '#lib/sound/cues.ts';
import { FOLLOW_MS, MAX_HOPS, MEET, POI_LINGER, adjacent, besideSpots, pickPoi, pois, shouldFollow, type PoiKind } from './wander.ts';
import type { ActorId } from '../motion/reactions.ts';
import { REACH, SPEED, actionSpots, route, routeLength, walkGeo, walkable, type Pt, type WalkGeo } from './walkGraph.ts';
import type { EmoteIcon } from '#lib/art.ts';
import { walkNav } from './nav.ts';
import { worldGen } from './world.ts';
import { planTap, type TapPlan } from './tapWalk.ts';
import { dayKey } from '#lib/time/clock.ts';
import { actorOf, guestPhone, otherMember, whoOf } from '#lib/ui-state/cast.ts';
import type { Who } from '#lib/types.ts';

export interface AvatarCtx {
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
/** When my villager left home for something (the partner follows after FOLLOW_MS), and whether the partner did. */
const away = { since: 0, followed: false };
/** A visitor is on the island (Visitor.svelte): centre stage is theirs. `beat`: the visitor's turn on idle life's slot,
 *  with the slot's PRNG (Visitor.svelte sets it while one is out; island/visitorLife.ts). */
export const presence: { visitor: boolean; beat: ((r: () => number) => void) | null } = { visitor: false, beat: null };
/** The villagers (ui-state/cast.ts): mine, the partner's and the third (the guest's on a member's phone, B's on the
 *  guest's). */
type Villager = 'mine' | 'partner' | 'third';
/** When each villager's person last steered it (device ms): my taps here, the partner's walks over the relay. Ambient
 *  life leaves it alone a while after (ambient.ts held). */
export const steered: Partial<Record<Villager, number>> = {};
/** The other member's villager (the members' own life is between those two: never the guest's: ui-state/cast.ts). */
const otherOf = (id: Villager): Villager | null => otherMember(id);
/** The guest's villager here (moved only by the guest's own taps and walks: never by any phone's life). */
const guests = (id: Villager): boolean => whoOf(id) === 'G';
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Where a tap sent my villager (spec §4): it stays there for the rest of the Tokyo day (localStorage, with the date),
 *  not wandering home, and the partner's phone shows it there too (the relay keeps each person's last walk: docs/
 *  backend.md#shared-world); a new day finds it home. */
const STAY_KEY = 'island-stay';
let stayAt: Pt | null = readStay();
function readStay(): Pt | null {
  try {
    const v = JSON.parse(globalThis.localStorage?.getItem(STAY_KEY) ?? 'null') as { date?: string; at?: unknown } | null;
    const at = v?.at;
    return v?.date === dayKey() && Array.isArray(at) && at.length === 2 && at.every(Number.isFinite) ? [at[0], at[1]] : null;
  } catch {
    return null;
  }
}
function keepStay(p: Pt | null) {
  stayAt = p;
  try {
    if (p) globalThis.localStorage?.setItem(STAY_KEY, JSON.stringify({ date: dayKey(), at: p }));
    else globalThis.localStorage?.removeItem(STAY_KEY);
  } catch {
    /* private mode: kept in memory only */
  }
}
/** Where the partner sent their villager today (their last walk, live or replayed by the relay), if anywhere. */
const stays: Partial<Record<Villager, Pt | null>> = {};
/** Where a villager rests: where its person sent it today, else its home. */
const restOf = (id: Villager): Pt => (id === 'mine' ? stayAt : stays[id]) ?? actors[id].home;
/** Out of the tent's door: my villager stands just outside it, facing out (as if it just stepped out), and stays there
 *  (a put: the partner's phone has it there too). */
export function stepOut(at: Pt): void {
  keepStay(at);
  steered.mine = Date.now();
  actors.mine.face = 'home';
  place('mine', at[0], at[1]);
}
/** The guest's villager comes ashore (docs/design.md "The guest", once per app open: the scene): put at `from`, it
 *  walks to `to` at a stroll and stays there (the walk goes over the relay like any, so the members see it arrive). */
export function arrive(from: Pt, to: Pt): void {
  const c = ctx;
  keepStay(to);
  steered.mine = Date.now();
  actors.mine.face = 'home';
  place('mine', from[0], from[1]);
  // by the island's own planner (nav.ts: up the stairs, over the bridge), as a tap there would go
  const p = c ? planTap(walkNav(), from, to[0], to[1], c.geo().extra) : null;
  if (p) walkTo('mine', p.pts, { speed: SPEED.wander, from, face: 'home' });
  else place('mine', to[0], to[1]);
}
/** Where my villager stands at the start (the scene mounting): where a tap sent it today, if anywhere. */
export const stayingAt = (): Pt | null => (stayAt && readStay() ? stayAt : null);

/** How far apart the villagers may be for the partner to come over (u): a walk across the island is too far. */
const FOLLOW_RANGE = 600;

export function attachAvatar(c: AvatarCtx): () => void {
  ctx = c;
  setRouter((id) => (id === 'host' || id === 'visitor' ? null : route(c.geo(), c.where(id), restOf(id))));
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

/** Tap-to-walk (spec §4, tapWalk.ts): my villager runs (200 u/s) to the tapped ground, a building's door (its
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
  const ms = walkTo('mine', p.pts, { speed: SPEED.run, from, face: p.snap.face });
  me.busyUntil = Math.max(me.busyUntil, Date.now() + ms);
  keepStay(Math.hypot(p.to[0] - me.home[0], p.to[1] - me.home[1]) <= 8 ? null : p.to);
  away.since ||= Date.now();
  clearTimeout(followTimer);
  followTimer = setTimeout(checkFollow, Math.max(0, away.since + FOLLOW_MS - Date.now()) + ms + 50);
  return { ...p, ms };
}

/** The partner tapped somewhere on their phone (the relay's `walk`, world units): their villager here runs there too,
 *  by the same planner from where it stands (no positions are sent), and rests there for the day, as on their phone. */
export function partnerTo(x: number, z: number, id: Villager = 'partner'): boolean {
  const c = ctx;
  if (!c || !c.enabled() || actors[id].asleep) return false;
  const from = c.where(id), p = planTap(walkNav(), from, x, z, c.geo().extra);
  if (!p) return false;
  steered[id] = Date.now();
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
/** A villager is home again (its phone was gone long enough: villagerSync's walk home): it rests at home, mine for
 *  the rest of the day too. */
export function homeAgain(id: Villager): void {
  if (id === 'mine') keepStay(null);
  else stays[id] = null;
}
/** The way between two points on the island's nav, as a tap would go (planTap: the stairs, the bridge), without the
 *  visitor's spot (the same on every phone: villagerSync's walk home). Null when there's none. */
export function homeRoute(from: Pt, to: Pt): Pt[] | null {
  return planTap(walkNav(), from, to[0], to[1], [])?.pts ?? null;
}

/** The partner did something on their phone (the shared world: a catch, a pick-up, a shake): their villager here turns
 *  to it where it stands (no walking over, as on their own phone) and the result plays at the target. */
export function partnerTurnTo(tx: number, who?: Who): void {
  const id = who ? actorOf(who) : 'partner';
  if (!ctx?.enabled() || actors[id].asleep || id === 'mine') return;
  steered[id] = Date.now();
  faceToward(id, tx);
}

/** After `ms`, wander home (90 u/s), unless something else took the villager by then (then a little later). */
function goHomeLater(id: Villager, ms: number): void {
  if (guests(id)) return; // the guest's villager stays where its taps put it
  clearTimeout(homeTimers[id]);
  homeTimers[id] = setTimeout(() => goHome(id), ms);
}

function goHome(id: Villager): void {
  if (inside[id] || guests(id)) return;
  const c = ctx;
  const home = restOf(id), at = c?.where(id);
  if (!c || !at || Math.hypot(at[0] - home[0], at[1] - home[1]) <= 2) return id === 'mine' ? backHome() : undefined;
  if (!c.enabled() || busy(id)) return goHomeLater(id, 1500);
  const from = at;
  const pts = route(c.geo(), from, home);
  if (!pts) return place(id, home[0], home[1]);
  walkTo(id, pts, { speed: SPEED.wander, from, face: 'home', then: () => id === 'mine' && backHome() });
}
/** My villager is home: a partner who came along heads home too. */
function backHome() {
  away.since = 0;
  clearTimeout(followTimer);
  if (away.followed && !guestPhone() && awayFromHome('partner')) goHomeLater('partner', rand(800, 1600));
  away.followed = false;
}

/** In the tent (docs/design.md "The tent": one place at a time): not on the island, so its life here leaves it alone. */
const inside: Partial<Record<Villager, boolean>> = {};
export function setInside(id: Villager, on: boolean): void {
  inside[id] = on;
  if (on) clearTimeout(homeTimers[id]);
}

/** Free to set off on its own: awake, not busy, standing still, on the island. */
const free = (id: Villager) => !inside[id] && !actors[id].asleep && !busy(id) && !actors[id].walking;

/** Mine has been away FOLLOW_MS: the partner comes over and stands beside it (then they chat). */
function checkFollow() {
  const c = ctx;
  // the partner's villager is theirs to move while they're here (villagerSync); the guest's phone has no partner to follow
  if (!c || !c.enabled() || guestPhone() || !awayFromHome('mine') || isRemote('partner')) return;
  if (!shouldFollow(away.since, Date.now(), free('partner') && !away.followed)) return;
  if (actors.mine.walking) return void (followTimer = setTimeout(checkFollow, 1000));
  const g = c.geo(), at = c.where('mine'), from = c.where('partner');
  if (Math.hypot(at[0] - from[0], at[1] - from[1]) > FOLLOW_RANGE) return;
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
export function wander(id: Villager, stops = 1 + Math.floor(Math.random() * MAX_HOPS)): boolean {
  const c = ctx, other = otherOf(id);
  if (!c || !c.enabled() || !other || !free(id) || awayFromHome(id) || isRemote(id)) return false;
  if (actors[other].walking || awayFromHome(other)) return false;
  return hop(id, stops);
}

/** Idle life's outing from the slot (ambient.ts villagerBeats): through those points of interest, lingering at each as
 *  given, then home; the same walk on both phones. */
export function outing(id: Villager, stops: readonly Stop[], together = false): boolean {
  const c = ctx, other = otherOf(id);
  if (!c || !c.enabled() || !other || !free(id) || awayFromHome(id) || !stops.length) return false;
  if (!together && (actors[other].walking || awayFromHome(other))) return false;
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
  const c = ctx, other = otherOf(id);
  if (!c || !other) return;
  // a seat or the bar: it sits (or does its pull-up) facing us (IslandScene draws it seated: world.ts seatAt)
  if (kind === 'seat' || kind === 'bar') actors[id].face = 'home';
  else if (!actors[other].walking && adjacent(c.where(id), c.where(other))) chat(id);
  else if (kind === 'shore') {
    actors[id].face = 'home'; // out to sea, toward the camera
    setMotion(id, 'turn');
  } else setMotion(id, kind === 'tree' ? 'stretch' : kind === 'rock' ? 'nod' : 'turn');
  const stay = linger ?? rand(POI_LINGER[0], POI_LINGER[1]);
  if (left > 0) {
    clearTimeout(homeTimers[id]);
    homeTimers[id] = setTimeout(() => hop(id, left, stops), stay);
  } else if (!(id === 'partner' && away.followed)) goHomeLater(id, stay);
}

/** Two villagers side by side chat (idle life's chat: face each other, a nod, a laugh). */
function chat(id: Villager) {
  const other = otherOf(id), t = Date.now();
  if (!other) return;
  actors[id].busyUntil = Math.max(actors[id].busyUntil, t + 3200);
  actors[other].busyUntil = Math.max(actors[other].busyUntil, t + 3200);
  applyStep(id, { actor: id, face: 'other', motion: 'nod' });
  later(other, 900, () => applyStep(other, { actor: other, face: 'other', motion: 'laugh' }));
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
  goHomeLater(id, ms + 2600 + rand(LINGER[0], LINGER[1]));
  return ms;
}

/** ふたりでぜんぶ: both walk to the middle of the lawn and high-five there. Returns the ms until the high-five. */
export function meetUp(): number {
  const c = ctx;
  // (the members' own moment, on their phones: never on the guest's)
  if (!c || !c.enabled() || guestPhone() || actors.mine.asleep || actors.partner.asleep || inside.mine || inside.partner) return 0;
  const g = c.geo();
  // each to the meeting spot on its own side (whose home is further left takes the left one: A's)
  const left = leftOf();
  const ways = (['mine', 'partner'] as const).map((id) => {
    const from = c.where(id), to = MEET[id === left ? 'A' : 'B'];
    const pts = c.clear(id, to[0], to[1]) ? route(g, from, to) : null;
    return { id, from, pts, len: pts ? routeLength(from, pts) : 0 };
  });
  if (ways.some((w) => !w.pts)) return 0;
  const ms = Math.max(400, (Math.max(...ways.map((w) => w.len)) / SPEED.action) * 1000);
  for (const w of ways) {
    clearTimeout(homeTimers[w.id]);
    walkTo(w.id, w.pts!, { ms, from: w.from, face: w.id === left ? 'r' : 'l' });
  }
  setTimeout(() => highFive(), ms);
  for (const w of ways) goHomeLater(w.id, ms + 2400 + rand(LINGER[0], LINGER[1]));
  return ms;
}

/** The villager whose home is on the left (A's, on both phones). */
const leftOf = (): Villager => (actors.mine.home[0] <= actors.partner.home[0] ? 'mine' : 'partner');

/** The high-five: both hop, face to face, with sparkles and one joyful sound. */
function highFive() {
  const left = leftOf();
  for (const id of ['mine', 'partner'] as const) {
    actors[id].face = id === left ? 'r' : 'l';
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
  away.followed = false;
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
