// Playing a schedule's track on an actor (ambientPlan.ts; the visitor's strolls, visitorLife.ts strollTrack): joined
// where it is by now, so a phone that skipped its start (hidden, under a sheet, the slow mode) has the actor where
// every other phone has it. Shown, a late join walks from where the actor stands along the rest of the leg, arriving
// when the schedule does (a big gap: glided off, a little later); back from hidden (`jump`), it's put there and goes
// on. Each later leg starts at its time on the director's timers, so a reaction that cancels the actor drops them
// too, and the next sync joins again. Cheap: a few timers, no planning.
import { actors, later, livePos, place, setMotion, walkTo } from '../motion/director.svelte.ts';
import type { ActorId } from '../motion/reactions.ts';
import { SPEED } from '#lib/world/speed.ts';
import { trackAt, type Leg, type Track } from './ambientPlan.ts';
import type { Pt } from '#lib/world/world.ts';

/** A gap this big (u) from where the schedule has the actor glides off, no slower than the run, within GLIDE_MS. */
const JUMP_U = 160;
const GLIDE_MS = 1500;
/** Nearer than this (u) to where it should stand: there. */
const NEAR_U = 3;

/** The track each actor is on here, and its pending leg timers. */
const on: Partial<Record<ActorId, { key: string; timers: Set<() => void> }>> = {};

/** The actor is on that track here (its timers intact). */
export const following = (id: ActorId, key: string): boolean => on[id]?.key === key && (on[id]!.timers.size > 0 || actors[id].walking);

/** Off its track (another walk took it, or the track is over). */
export function drop(id: ActorId): void {
  for (const c of on[id]?.timers ?? []) c();
  delete on[id];
}

const run = (d: number) => Math.min(GLIDE_MS, (d / SPEED.action) * 1000);

/** What an actor does on arriving at a leg's end: faces us (a seat, the bar, the shore), else a look around (a tree:
 *  a stretch, the rock: a nod). */
function arrive(id: ActorId, l: Leg): void {
  if (l.face) actors[id].face = l.face;
  if (l.kind === 'seat' || l.kind === 'bar' || !l.kind) return;
  setMotion(id, l.kind === 'tree' ? 'stretch' : l.kind === 'rock' ? 'nod' : 'turn');
}

/** Put `id` on `tr` as of `now` (the track's clock; legs start at `t0 − now` ms from here). `jump`: not on screen
 *  meanwhile (back from hidden or a sheet): put where it is by now. */
export function playTrack(id: ActorId, tr: Track, now: number, jump: boolean, onArrive: (id: ActorId, l: Leg) => void = arrive): void {
  drop(id);
  const timers = new Set<() => void>();
  on[id] = { key: tr.key, timers };
  const at = trackAt(tr, now), here = livePos(id);
  const walkLeg = (l: Leg) => walkTo(id, l.pts, { ms: l.ms, from: l.from, face: l.face, then: () => onArrive(id, l) });
  if (at.leg >= tr.legs.length) {
    // over: where it ended
    const end = tr.legs[tr.legs.length - 1], to = end.pts.at(-1) ?? end.from;
    settle(id, to, jump, end.face);
    delete on[id];
    return;
  }
  const cur = at.leg >= 0 ? tr.legs[at.leg] : null;
  if (cur && at.walking) {
    if (jump) {
      place(id, at.at[0], at.at[1]);
      walkTo(id, at.rest, { ms: at.left, from: at.at, face: cur.face, then: () => onArrive(id, cur) });
    } else {
      const gap = Math.hypot(here[0] - at.at[0], here[1] - at.at[1]);
      walkTo(id, at.rest, { ms: gap > JUMP_U ? Math.max(at.left, run(gap)) : at.left, from: here, face: cur.face, then: () => onArrive(id, cur) });
    }
  } else settle(id, at.at, jump, cur?.face);
  for (let i = Math.max(0, at.leg + 1); i < tr.legs.length; i++) {
    const l = tr.legs[i];
    const c = later(id, Math.max(0, l.t0 - now), () => {
      timers.delete(c);
      walkLeg(l);
    }, () => timers.delete(c));
    timers.add(c);
  }
}

/** Stand `id` at `to`: there already, else walked off briskly (shown) or put there (`jump`). */
export function settle(id: ActorId, to: Pt, jump: boolean, face?: 'home'): void {
  const here = livePos(id), d = Math.hypot(here[0] - to[0], here[1] - to[1]);
  if (d <= NEAR_U && !actors[id].walking) return;
  if (jump) {
    place(id, to[0], to[1]);
    if (face) actors[id].face = face;
  } else walkTo(id, [to], { ms: run(d), from: here, face });
}
