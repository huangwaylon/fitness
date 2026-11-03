// The stage director: one reactive state per actor (my villager, the partner, しずえ) that the
// components render from (Villager / Host read it; nothing here touches the DOM). Reactions and idle
// life call `play()`; every motion starts and ends at `transform: none` (the CSS keyframes do that),
// and a new step on an actor preempts whatever it was doing.
import { pickOne } from '#lib/random.ts';
import type { EmoteIcon } from '#lib/art.ts';
import { HOST_TAP, MOTION_MS, REACTIONS, type ActorId, type FxKind, type Motion, type ReactionId, type Step } from './reactions.ts';
import { cue } from '#lib/sound/cues.ts';

/** Which way an actor looks: as drawn ('home'), toward the middle of the island ('in'), or left / right. */
export type Facing = 'home' | 'in' | 'l' | 'r';
type Pt = readonly [number, number];

interface ActorState {
  motion: Motion | null;
  /** Bumped on every motion so the same motion can replay back to back. */
  motionN: number;
  emote: EmoteIcon | null;
  emoteN: number;
  /** Keep the bubble up (sleepy while asleep). */
  emoteHold: boolean;
  fx: { kind: FxKind; n: number }[];
  face: Facing;
  /** Where the feet are heading (world units, x across and y = the world's z, into the island): the current segment's
   *  end. The scene moves the feet from `from` to here over `walkMs` from `t0` (livePos). */
  x: number;
  y: number;
  /** The current segment's start and when it started (performance.now()). */
  from: Pt;
  t0: number;
  /** The current segment's duration (ms; 0 = a snap). */
  walkMs: number;
  /** One walk cycle (two steps), ms. */
  stepMs: number;
  /** Where the villager lives on the island (stage units). */
  home: Pt;
  walking: boolean;
  /** NH's hold-up: the item's art over the head. */
  holding: { art: string; n: number } | null;
  asleep: boolean;
  /** しずえ pose override while a beat plays. */
  pose: 'wave' | 'stand' | 'bow' | null;
  /** Mounted on screen (しずえ only appears where a Bubble is). */
  present: boolean;
  busyUntil: number;
}

const blank = (): ActorState => ({
  motion: null, motionN: 0, emote: null, emoteN: 0, emoteHold: false, fx: [], face: 'home', x: 0, y: 0, from: [0, 0], t0: 0, walkMs: 0,
  stepMs: 640, home: [0, 0], walking: false, holding: null, asleep: false, pose: null, present: false,
  busyUntil: 0
});

export const actors = $state<Record<ActorId, ActorState>>({ mine: blank(), partner: blank(), third: blank(), host: blank(), visitor: blank() });

const EMOTE_MS = 2200;
let fxN = 0;
/** Pending timers per actor → an optional "dropped" hook, called when cancel() / resetAll() drops it. */
type Dropped = (() => void) | undefined;
const timers: Record<ActorId, Map<ReturnType<typeof setTimeout>, Dropped>> = { mine: new Map(), partner: new Map(), third: new Map(), host: new Map(), visitor: new Map() };
/** Last time any event reaction ran (idle life waits 3 s after one). */
export const lastEvent = { at: 0 };

/** Run `fn` on an actor after `ms`; `cancel(id)` / `resetAll()` drop it (then `dropped` runs, so an
 *  owner can forget its canceller). Returns its own canceller. */
export function later(id: ActorId, ms: number, fn: () => void, dropped?: () => void): () => void {
  const t = setTimeout(() => {
    timers[id].delete(t);
    fn();
  }, ms);
  timers[id].set(t, dropped);
  return () => {
    clearTimeout(t);
    timers[id].delete(t);
  };
}

/** Pending timers per actor (tests). */
export function pendingTimers(id: ActorId): number {
  return timers[id].size;
}

// しずえ: several <Host>s can be mounted (island bubble, harvest overlay, gallery). The director drives
// only the most recent live claim; `present` stays true while any claim is held.
const hostClaims: number[] = [];
let claimN = 0;
export const hostOwner = $state({ id: 0 });

export function claimHost(): { id: number; release: () => void } {
  const id = ++claimN;
  hostClaims.push(id);
  if (hostOwner.id) cancel('host');
  hostOwner.id = id;
  actors.host.present = true;
  return {
    id,
    release() {
      const i = hostClaims.indexOf(id);
      if (i < 0) return;
      hostClaims.splice(i, 1);
      const next = hostClaims.at(-1) ?? 0;
      if (hostOwner.id !== next) {
        cancel('host');
        actors.host.emote = null;
        actors.host.fx = [];
      }
      hostOwner.id = next;
      actors.host.present = hostClaims.length > 0;
    }
  };
}

/** Cancel everything pending on an actor and snap it back to rest (keeps sleep). */
export function cancel(id: ActorId) {
  const drops = [...timers[id]];
  timers[id].clear();
  for (const [t, dropped] of drops) {
    clearTimeout(t);
    dropped?.();
  }
  const a = actors[id];
  // my villager stopped mid-walk: it ends at this segment's end (the partner's phone stops it there too)
  if (id === 'mine' && a.walking) {
    const t = clock(), left = a.walkMs ? Math.max(0, a.t0 + a.walkMs - t) : 0;
    ownMove?.({ id, from: livePos(id, t), pts: left ? [[a.x, a.y]] : [], ms: left, face: a.face });
  }
  const rw = remote[id] && a.walking ? remoteWalk[id] : undefined;
  a.motion = null;
  a.walking = false; // a segment under way slides on to its end and stops there
  a.pose = null;
  a.busyUntil = 0;
  walks[id].clear();
  // a remote villager's walk is its phone's: a reaction here doesn't stop it (it goes on from where it is by now)
  if (rw) {
    const { at, rest, left } = along(rw.from, rw.pts, rw.ms, clock() - rw.t0);
    if (left) walkTo(id, rest, { ms: left, from: at, face: rw.face, remote: true });
  }
}

/** Where a walk along `pts` from `from` taking `ms` has its walker `t` ms after it set off: the point, the rest of the
 *  way, and how long that takes (0: arrived). Segments share the time by length (as walkTo does). */
export function along(from: Pt, pts: readonly Pt[], ms: number, t: number): { at: Pt; rest: Pt[]; left: number } {
  const end = pts.length ? pts[pts.length - 1] : from;
  if (!pts.length || ms <= 0 || t >= ms) return { at: end, rest: [], left: 0 };
  const lens: number[] = [];
  let prev = from;
  for (const p of pts) {
    lens.push(Math.hypot(p[0] - prev[0], p[1] - prev[1]));
    prev = p;
  }
  const len = lens.reduce((s, l) => s + l, 0);
  if (len < 1) return { at: end, rest: [], left: 0 };
  const t0 = Math.max(0, t);
  let d = (t0 / ms) * len;
  prev = from;
  for (let i = 0; i < pts.length; i++) {
    if (d <= lens[i]) {
      const k = lens[i] ? d / lens[i] : 1;
      return { at: [prev[0] + (pts[i][0] - prev[0]) * k, prev[1] + (pts[i][1] - prev[1]) * k], rest: pts.slice(i), left: ms - t0 };
    }
    d -= lens[i];
    prev = pts[i];
  }
  return { at: end, rest: [], left: 0 };
}

export function busy(id: ActorId): boolean {
  return actors[id].busyUntil > Date.now();
}

export function setMotion(id: ActorId, m: Motion | null, ms = m ? MOTION_MS[m] : 0) {
  const a = actors[id];
  a.motion = m;
  a.motionN++;
  if (m) {
    const n = a.motionN;
    later(id, ms, () => {
      if (actors[id].motionN === n) actors[id].motion = null;
    });
  }
}

export function setEmote(id: ActorId, e: EmoteIcon | null, hold = false) {
  const a = actors[id];
  a.emote = e;
  a.emoteN++;
  a.emoteHold = hold;
  if (e && !hold) {
    const n = a.emoteN;
    later(id, EMOTE_MS, () => {
      if (actors[id].emoteN === n) actors[id].emote = null;
    });
  }
}

export function addFx(id: ActorId, kind: FxKind) {
  const a = actors[id];
  if (a.fx.length >= 6) a.fx.shift();
  a.fx.push({ kind, n: ++fxN });
}

export function removeFx(id: ActorId, n: number) {
  const a = actors[id];
  const i = a.fx.findIndex((f) => f.n === n);
  if (i >= 0) a.fx.splice(i, 1);
}

/** Apply one catalogue step to one actor now. */
export function applyStep(id: ActorId, s: Step) {
  const a = actors[id];
  if (id === 'host' && !a.present) return;
  // 'jar': the jar sits in the sky HUD beside the ribbon, up to the right: both look that way
  if (s.face) a.face = s.face === 'home' ? 'home' : s.face === 'other' ? toward(id, actors[id === 'mine' ? 'partner' : 'mine'].x) : s.face === 'jar' ? 'r' : 'in';
  // (the third villager's `other` is mine: the one it high-fives on this phone)
  if (s.pose) {
    a.pose = s.pose;
    later(id, EMOTE_MS, () => (actors[id].pose = null));
  }
  if (s.motion) setMotion(id, s.motion);
  if (s.emote) setEmote(id, s.emote);
  if (s.fx) addFx(id, s.fx);
}

// Events play one at a time. A reaction that arrives while another event is still playing
// waits in a short queue (≤ 3, no duplicates) and starts 400 ms after the current one ends. Direct
// touch feedback (tapping a villager, the high-five a tap on the partner starts, the jar, waking a sleeper) never waits.
const IMMEDIATE = new Set<ReactionId>(['R4', 'R9', 'R14', 'R18']);
const EVENT_GAP_MS = 400;
const queue: { rid: ReactionId; swap: boolean }[] = [];
let eventUntil = 0;
let drainTimer: ReturnType<typeof setTimeout> | null = null;

/** Hold event reactions for `ms` (they queue and play after): a routine that must not be cut short (group stretching).
 *  Direct touch feedback still plays at once. */
export function holdEvents(ms: number) {
  eventUntil = Math.max(eventUntil, Date.now() + ms);
  if (drainTimer) {
    // a queued reaction waits for the new end too
    clearTimeout(drainTimer);
    drainTimer = null;
    drainLater();
  }
}

/** No event playing nor queued (the e2e's: the island's opening beats are over; idle life may still wander). */
export function eventsQuiet(): boolean {
  return !queue.length && !drainTimer && Date.now() >= eventUntil;
}

/** Queued events (tests / the gallery). */
export function queuedEvents(): ReactionId[] {
  return queue.map((q) => q.rid);
}

function drainLater() {
  if (drainTimer) return;
  drainTimer = setTimeout(() => {
    drainTimer = null;
    const next = queue.shift();
    if (next) play(next.rid, next.swap);
    if (queue.length) drainLater();
  }, Math.max(0, eventUntil - Date.now()));
}

/** Play a catalogue reaction, or queue it behind the event that is playing. Preempts idle life
 *  on every actor it touches. `swap` plays the 'mine' part on the partner (e.g. the partner's fruit
 *  ripened). */
export function react(rid: ReactionId, swap = false) {
  if (!IMMEDIATE.has(rid) && Date.now() < eventUntil) {
    if (queue.length < 3 && !queue.some((q) => q.rid === rid && q.swap === swap)) queue.push({ rid, swap });
    drainLater();
    return;
  }
  play(rid, swap);
}

function play(rid: ReactionId, swap: boolean) {
  const r = REACTIONS[rid];
  if (!IMMEDIATE.has(rid)) eventUntil = Date.now() + r.ms + EVENT_GAP_MS;
  const who = (a: Step['actor']): ActorId[] =>
    a === 'both' ? ['mine', 'partner'] : swap && a === 'mine' ? ['partner'] : swap && a === 'partner' ? ['mine'] : [a];
  const ids = new Set<ActorId>();
  for (const s of r.steps) for (const id of who(s.actor)) ids.add(id);
  for (const id of ids) {
    const asleep = actors[id].asleep;
    cancel(id);
    actors[id].asleep = asleep;
    actors[id].busyUntil = Date.now() + r.ms;
  }
  lastEvent.at = Date.now();
  for (const s of r.steps) {
    who(s.actor).forEach((id, i) => {
      // a step's sound plays once (a 'both' step moves two actors), and not for an absent しずえ
      const run = () => {
        applyStep(id, s);
        if (s.cue && i === 0 && (id !== 'host' || actors.host.present)) cue(s.cue);
      };
      if (s.at) later(id, s.at, run);
      else run();
    });
  }
}

/** Facing toward stage x from where the actor stands ('in' when it's right there). */
function toward(id: ActorId, x: number): Facing {
  const a = actors[id];
  return Math.abs(x - a.x) < 2 ? 'in' : x < a.x ? 'l' : 'r';
}

/** Away from its home spot (walking, or standing somewhere else). */
export function awayFromHome(id: ActorId): boolean {
  const a = actors[id];
  return Math.hypot(a.x - a.home[0], a.y - a.home[1]) > 2;
}

/** Where an actor lives; puts it there unless it's out walking (the scene calls this as it mounts). */
export function setHome(id: ActorId, x: number, y: number) {
  const a = actors[id];
  const atHome = !awayFromHome(id) || (a.x === 0 && a.y === 0);
  a.home = [x, y];
  if (atHome) place(id, x, y);
}

/** The way home from where an actor is (the scene's walk graph, island/avatar.ts; straight until it's attached). */
let router: ((id: ActorId) => Pt[] | null) | null = null;
export function setRouter(fn: typeof router): void {
  router = fn;
}
export function routeHome(id: ActorId): Pt[] {
  return router?.(id) ?? [actors[id].home];
}

// The shared world's villagers (island/villagerSync.ts, docs/backend.md#shared-world "Villagers"): each person's phone
// moves their own villager and tells the other phone every walk and put of it (`onOwnMove`); there, while that person
// has the island open, their villager is the relay's to move (`setRemote`): this phone's own life (a follow, an
// outing, a walk home, a put under a sheet) leaves it alone, and only `remote` walks and puts move it.
/** A walk or a put of an actor (a put: `ms` 0, `pts` empty, `from` where). */
export interface Move {
  id: ActorId;
  from: Pt;
  pts: readonly Pt[];
  ms: number;
  face?: Facing;
}
let ownMove: ((m: Move) => void) | null = null;
/** Every walk and put of my villager (the scene sends them over the relay). */
export function onOwnMove(fn: typeof ownMove): () => void {
  ownMove = fn;
  return () => {
    if (ownMove === fn) ownMove = null;
  };
}
const remote: Partial<Record<ActorId, boolean>> = {};
/** A remote actor's walk under way (to go on with after a cancel). */
const remoteWalk: Partial<Record<ActorId, { from: Pt; pts: readonly Pt[]; ms: number; t0: number; face?: Facing }>> = {};
/** `id` is moved from elsewhere (the partner's villager while they're here): only `remote` walks and puts move it. */
export function setRemote(id: ActorId, on: boolean): void {
  remote[id] = on;
}
export const isRemote = (id: ActorId): boolean => !!remote[id];

/** Put an actor at (x, y) at once (no walk): back home after a long absence, frozen under a sheet. `fromRemote`: the
 *  relay's put of a remote actor (setRemote); a local one of it does nothing. */
export function place(id: ActorId, x: number, y: number, fromRemote = false) {
  if (remote[id] && !fromRemote) return;
  const a = actors[id];
  for (const c of walks[id]) c();
  walks[id].clear();
  Object.assign(a, { x, y, from: [x, y], t0: 0, walkMs: 0, walking: false });
  if (id === 'mine') ownMove?.({ id, from: [x, y], pts: [], ms: 0, face: a.face });
}

const clock = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Where an actor's feet are right now (world units): along the current segment, by the clock. */
export function livePos(id: ActorId, t = clock()): Pt {
  const a = actors[id];
  if (!a.walkMs) return [a.x, a.y];
  const k = Math.min(1, Math.max(0, (t - a.t0) / a.walkMs));
  return [a.from[0] + (a.x - a.from[0]) * k, a.from[1] + (a.y - a.from[1]) * k];
}

/** Still on its way along a segment (the scene keeps placing it). */
export const inMotion = (id: ActorId, t = clock()): boolean => actors[id].walkMs > 0 && t < actors[id].t0 + actors[id].walkMs;

/** Called at each step of a walk (the scene plays a footstep: grass or sand), at most one per STEP_GAP_MS. */
let stepHook: ((id: ActorId, x: number, y: number) => void) | null = null;
export function onStep(fn: (id: ActorId, x: number, y: number) => void): () => void {
  stepHook = fn;
  return () => {
    if (stepHook === fn) stepHook = null;
  };
}
export const STEP_GAP_MS = 320;
/** Walk timers per actor (a new walk drops the last one's; so do cancel() and place()). */
const walks: Record<ActorId, Set<() => void>> = { mine: new Set(), partner: new Set(), third: new Set(), host: new Set(), visitor: new Set() };

interface WalkOpts {
  /** Total duration (ms), shared between the segments by length; else from `speed`. */
  ms?: number;
  /** u/s (when no `ms`). */
  speed?: number;
  /** Where the feet are now, if not (x, y): a walk re-targeted mid-step starts from the live position. */
  from?: Pt;
  /** On arrival. */
  then?: () => void;
  /** Face this way on arrival. */
  face?: Facing;
  /** The relay's walk of a remote actor (setRemote): a local one of it does nothing. */
  remote?: boolean;
}

/** A segment started (the scene keeps its one rAF running while anyone is on the way). */
let moved: ((id: ActorId) => void) | null = null;
export function onMove(fn: typeof moved): () => void {
  moved = fn;
  return () => {
    if (moved === fn) moved = null;
  };
}

/** Walk an actor along `pts` (world units; design.md "Walking"): segment by segment (the scene moves the feet each
 *  frame: livePos), facing the way it goes, the walk bounce, a dust puff and a footstep every other step. A new walk
 *  replaces the last; returns the total ms. */
export function walkTo(id: ActorId, pts: readonly Pt[], o: WalkOpts = {}): number {
  if (remote[id] && !o.remote) return 0;
  const a = actors[id];
  for (const c of walks[id]) c();
  walks[id].clear();
  const from: Pt = o.from ?? [a.x, a.y];
  const lens: number[] = [];
  let at = from;
  for (const p of pts) {
    lens.push(Math.hypot(p[0] - at[0], p[1] - at[1]));
    at = p;
  }
  const len = lens.reduce((s, l) => s + l, 0);
  if (!pts.length || len < 1) {
    if (o.face) a.face = o.face;
    o.then?.();
    return 0;
  }
  const total = o.ms ?? (len / (o.speed ?? 90)) * 1000;
  if (id === 'mine') ownMove?.({ id, from, pts, ms: total, face: o.face });
  if (o.remote) remoteWalk[id] = { from, pts, ms: total, t0: clock(), face: o.face };
  const own = (ms: number, fn: () => void) => {
    const c = later(id, ms, () => {
      walks[id].delete(c);
      fn();
    }, () => walks[id].delete(c));
    walks[id].add(c);
  };
  // brisk walks take quick steps (NH's run), a wander slow ones
  a.stepMs = len / Math.max(0.001, total / 1000) >= 180 ? 360 : 640;
  a.walking = true;
  a.busyUntil = Math.max(a.busyUntil, Date.now() + total + 200);
  let t = 0;
  at = from;
  pts.forEach((p, i) => {
    const ms = (total * lens[i]) / len;
    const prev = at;
    const seg = () => {
      if (Math.abs(p[0] - prev[0]) >= 3) a.face = p[0] < prev[0] ? 'l' : 'r';
      a.from = t === 0 ? livePos(id) : prev;
      a.t0 = clock();
      a.walkMs = Math.round(ms);
      a.x = p[0];
      a.y = p[1];
      moved?.(id);
    };
    if (t === 0) seg();
    else own(t, seg);
    t += ms;
    at = p;
  });
  // a puff and a footstep every other step (at most one per STEP_GAP_MS)
  const gap = Math.max(STEP_GAP_MS, a.stepMs / 2);
  for (let s = gap / 2; s < total - 60; s += gap)
    own(s, () => {
      addFx(id, 'puff');
      stepHook?.(id, a.x, a.y);
    });
  own(total, () => {
    a.walking = false;
    if (o.face) a.face = o.face;
    o.then?.();
  });
  return total;
}

/** How long a hold-up lasts by default (ms): about a catch plate's first page. */
export const HOLD_MS = 3200;

/** NH's hold-up: the villager lifts the item over its head (a squash, a rise, held) for `ms`. */
export function holdUp(id: ActorId, art: string, ms = HOLD_MS) {
  const a = actors[id];
  if (a.asleep) return;
  const n = (a.holding?.n ?? 0) + 1;
  a.holding = { art, n };
  a.busyUntil = Math.max(a.busyUntil, Date.now() + ms);
  setMotion(id, 'holdup');
  // not through later(): a reaction may preempt the pose, the item still goes away
  setTimeout(() => actors[id].holding?.n === n && (actors[id].holding = null), ms);
}

/** Put the held item away (its plate closed). */
export function putAway(id: ActorId) {
  actors[id].holding = null;
}

/** Turn to face stage x. */
export function faceToward(id: ActorId, x: number) {
  actors[id].face = toward(id, x);
}

/** Night naps (R13): asleep = slow breath + a zzz loop. */
export function setAsleep(id: ActorId, asleep: boolean) {
  const a = actors[id];
  if (a.asleep === asleep) return;
  a.asleep = asleep;
  if (asleep) {
    setEmote(id, 'dozing');
    addFx(id, 'zzz');
  } else if (a.emoteHold) {
    setEmote(id, null);
  }
}

/** How long a woken villager stays up (ms). */
export const WAKE_MS = 10_000;
/** Whether it's sleeping time now (islandLife: the night's hours on the relay's clock, the same on both phones): a woken
 *  villager goes back to sleep after WAKE_MS only then. */
let sleepy: () => boolean = () => true;
export function setSleepClock(fn: () => boolean): void {
  sleepy = fn;
}
/** Whether it's sleeping time now (the night's hours on the relay's clock). */
export const sleepTime = (): boolean => sleepy();
/** A dozing villager gets up quietly (no surprise: a walk home at night, villagerSync), to doze again on arrival. */
export function stir(id: 'mine' | 'partner' | 'third'): void {
  const a = actors[id];
  if (!a.asleep) return;
  a.asleep = false;
  a.fx = a.fx.filter((f) => f.kind !== 'zzz');
  if (a.emoteHold) setEmote(id, null);
}
/** A villager was woken here (a tap, a high-five): the scene tells the other phone (villagerSync), whose own wake of it
 *  is `remote`. */
let woken: ((id: 'mine' | 'partner' | 'third') => void) | null = null;
export function onWake(fn: typeof woken): () => void {
  woken = fn;
  return () => {
    if (woken === fn) woken = null;
  };
}

/** Wake a dozing villager for WAKE_MS (R14; `ms`: what's left of a wake on the other phone), then back to sleep. */
export function wake(id: 'mine' | 'partner' | 'third', o: { remote?: boolean; ms?: number } = {}) {
  const a = actors[id];
  if (!o.remote) woken?.(id);
  cancel(id);
  a.asleep = false;
  a.fx = a.fx.filter((f) => f.kind !== 'zzz');
  a.busyUntil = Date.now() + 10_000;
  lastEvent.at = Date.now();
  setMotion(id, 'surprise');
  setEmote(id, 'shocked');
  addFx(id, 'sweat');
  cue('emote-surprise');
  later(id, o.ms ?? WAKE_MS, () => setAsleep(id, sleepy()));
}

/** Reset everything (scene unmount). */
export function resetAll() {
  queue.length = 0;
  if (drainTimer) clearTimeout(drainTimer);
  drainTimer = null;
  eventUntil = 0;
  for (const id of ['mine', 'partner', 'third', 'host', 'visitor'] as const) {
    const { present, home } = actors[id];
    cancel(id);
    Object.assign(actors[id], blank(), { present, home, x: home[0], y: home[1], from: home });
  }
}

/** しずえ tapped with nothing left to read: a hop and a random happy reaction. */
export function hostTap() {
  if (!actors.host.present) return;
  cancel('host');
  actors.host.busyUntil = Date.now() + EMOTE_MS;
  setMotion('host', 'hop');
  setEmote('host', pickOne(HOST_TAP, Math.random));
  cue('host-tap');
}
