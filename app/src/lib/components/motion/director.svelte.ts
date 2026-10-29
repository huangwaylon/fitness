// The stage director: one reactive state per actor (my villager, the partner, しずえ) that the
// components render from (Villager / Host read it; nothing here touches the DOM). Reactions and idle
// life call `play()`; every motion starts and ends at `transform: none` (the CSS keyframes do that),
// and a new step on an actor preempts whatever it was doing.
import type { EmoteIcon } from '../art.ts';
import { HOST_TAP, MOTION_MS, REACTIONS, type ActorId, type FxKind, type Motion, type ReactionId, type Step } from './reactions.ts';
import { reducedMotion } from './clock.ts';

export interface ActorState {
  motion: Motion | null;
  /** Bumped on every motion so the same motion can replay back to back. */
  motionN: number;
  emote: EmoteIcon | null;
  emoteN: number;
  /** Keep the bubble up (sleepy while asleep). */
  emoteHold: boolean;
  fx: { kind: FxKind; n: number }[];
  /** 'in' = facing the middle of the island (the other villager / the jar). */
  face: 'home' | 'in';
  /** Stroll offset in stage units (toward the jar), and whether the walk bounce runs. */
  walkX: number;
  walking: boolean;
  asleep: boolean;
  /** しずえ pose override while a beat plays. */
  pose: 'wave' | 'stand' | 'bow' | null;
  /** Mounted on screen (しずえ only appears where a Bubble is). */
  present: boolean;
  busyUntil: number;
}

const blank = (): ActorState => ({
  motion: null, motionN: 0, emote: null, emoteN: 0, emoteHold: false, fx: [], face: 'home', walkX: 0,
  walking: false, asleep: false, pose: null, present: false, busyUntil: 0
});

export const actors = $state<Record<ActorId, ActorState>>({ mine: blank(), partner: blank(), host: blank() });

export const EMOTE_MS = 2200;
let fxN = 0;
const timers: Record<ActorId, Set<ReturnType<typeof setTimeout>>> = { mine: new Set(), partner: new Set(), host: new Set() };
/** Last time any event reaction ran (idle life waits 3 s after one). */
export const lastEvent = { at: 0 };

/** Run `fn` on an actor after `ms`; `cancel(id)` / `resetAll()` drop it. Returns its own canceller. */
export function later(id: ActorId, ms: number, fn: () => void): () => void {
  const t = setTimeout(() => {
    timers[id].delete(t);
    fn();
  }, ms);
  timers[id].add(t);
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
// only the most recent live claim; `present` stays true while any claim is held (P3).
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
  for (const t of timers[id]) clearTimeout(t);
  timers[id].clear();
  const a = actors[id];
  a.motion = null;
  a.walking = false;
  a.walkX = 0;
  a.pose = null;
  a.busyUntil = 0;
}

export function busy(id: ActorId): boolean {
  return actors[id].busyUntil > Date.now();
}

export function setMotion(id: ActorId, m: Motion | null, ms = m ? MOTION_MS[m] : 0) {
  const a = actors[id];
  a.motion = reducedMotion() ? null : m;
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
  if (s.face) a.face = s.face === 'home' ? 'home' : 'in';
  if (s.pose) {
    a.pose = s.pose;
    later(id, EMOTE_MS, () => (actors[id].pose = null));
  }
  if (s.motion) setMotion(id, s.motion);
  if (s.emote) setEmote(id, s.emote);
  if (s.fx) addFx(id, s.fx);
}

/** Play a catalogue reaction (§M.5): preempts idle life on every actor it touches. `swap` plays the
 *  'mine' part on the partner (e.g. the partner's fruit ripened). */
export function react(rid: ReactionId, swap = false) {
  const r = REACTIONS[rid];
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
    for (const id of who(s.actor)) {
      if (s.at) later(id, s.at, () => applyStep(id, s));
      else applyStep(id, s);
    }
  }
}

/** Walk leg length (= --dur-walk in tokens.css), the wait at the far end, and the puff cadence. */
export const WALK_MS = 1600;
const WALK_WAIT_MS = 1200;
const PUFF_MS = 640;

/** A walk (stroll): out `dx` stage units, wait, and back (§M.2 Walking). */
export function stroll(id: 'mine' | 'partner', dx: number, onWait?: () => void) {
  const a = actors[id];
  if (reducedMotion()) return;
  a.busyUntil = Date.now() + WALK_MS * 2 + WALK_WAIT_MS + 200;
  a.face = 'in';
  a.walking = true;
  a.walkX = dx;
  const puff = () => addFx(id, 'puff');
  for (let t = 300; t < WALK_MS; t += PUFF_MS) later(id, t, puff);
  later(id, WALK_MS, () => {
    a.walking = false;
    onWait?.();
  });
  later(id, WALK_MS + WALK_WAIT_MS, () => {
    a.face = 'home';
    a.walking = true;
    a.walkX = 0;
    for (let t = 300; t < WALK_MS; t += PUFF_MS) later(id, t, puff);
  });
  later(id, WALK_MS * 2 + WALK_WAIT_MS, () => (a.walking = false));
}

/** Night naps (R13): asleep = slow breath + a zzz loop (reduced motion: a held zzz mark). */
export function setAsleep(id: ActorId, asleep: boolean) {
  const a = actors[id];
  if (a.asleep === asleep) return;
  a.asleep = asleep;
  if (asleep) {
    // the zzz loop is the sleep sign; under reduced motion a held (static) zzz mark instead
    if (reducedMotion()) setEmote(id, 'sleepy', true);
    else {
      setEmote(id, 'dozing');
      addFx(id, 'zzz');
    }
  } else if (a.emoteHold) {
    setEmote(id, null);
  }
}

/** Wake a dozing villager for 10 s (R14), then back to sleep. */
export function wake(id: 'mine' | 'partner') {
  const a = actors[id];
  cancel(id);
  a.asleep = false;
  a.fx = a.fx.filter((f) => f.kind !== 'zzz');
  a.busyUntil = Date.now() + 10_000;
  lastEvent.at = Date.now();
  setMotion(id, 'surprise');
  setEmote(id, 'shocked');
  addFx(id, 'sweat');
  later(id, 10_000, () => setAsleep(id, true));
}

/** Reset everything (scene unmount). */
export function resetAll() {
  for (const id of ['mine', 'partner', 'host'] as const) {
    const present = actors[id].present;
    cancel(id);
    Object.assign(actors[id], blank(), { present });
  }
}

/** しずえ tapped with nothing left to read (§M.6): a hop and a random happy reaction. */
export function hostTap() {
  if (!actors.host.present) return;
  cancel('host');
  actors.host.busyUntil = Date.now() + EMOTE_MS;
  setMotion('host', 'hop');
  setEmote('host', HOST_TAP[Math.floor(Math.random() * HOST_TAP.length)]);
}
