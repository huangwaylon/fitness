// Idle life (design.md "Motion", docs/backend.md#ambient-life): one scheduler per live scene, on the 10-second slots of
// ambient life (island/ambient.ts), so both phones play the same: each slot (DECIDE_MS after it starts, on the relay's
// clock) one villager does one small background thing (look around, wiggle, hop, a glance up at the HUD, tree shake,
// stretch), sets off on an outing to points of interest, or both chat or dance; the visitor takes its beat from the
// slot's own PRNG; しずえ now and then swaps pose / wiggles / hops (ambient.ts hostBeat). No emote bubbles or fx: those
// mark events. In the evening and at night (tod night) the energetic ones rest; a villager asleep (its person's app
// closed) keeps its zzz and is in nothing (ambient.ts: not free). Pauses while the tab is hidden or a sheet is open;
// after 3 min without input it plays one slot in three (the same ones on both phones) and stops after 10 min until the
// next touch. A skipped slot skips only what plays: where the villagers nobody's phone moves and the visitors stand
// comes from the schedule (`sync`: island/ambientPlan.ts, visitorLife.ts strollTrack), run on every slot, played or
// not, and on coming back (shown, uncovered: a jump to where the schedule has them by now). Every follow-up beat is
// scheduled through the director's `later`, and stop() cancels them all, so nothing writes to the actors after the
// scene unmounts.
import type { ActorId, IdleAction } from './reactions.ts';
import { actors, addFx, applyStep, busy, faceToward, later as directorLater, lastEvent, setMotion } from './director.svelte.ts';
import { now } from '#lib/time/clock.ts';
import type { LocalDate, PersonId, Who } from '#lib/types.ts';
import { DECIDE_MS, hostBeat, msToNextSlot, slotAt, slotRand, slotStart, villagerBeats, type AmbientWorld, type VillagerBeat } from '../island/ambient.ts';
import type { VillagerActor } from '#lib/ui-state/cast.ts';

interface IdleContext {
  /** Sheet / overlay open (or the scene isn't live). */
  paused: () => boolean;
  /** Evening and night (tod night): no day-only actions. */
  night?: () => boolean;
  /** Shake that actor's own tree (+ a falling leaf). */
  treeShake: (id: VillagerActor) => void;
  /** The shared world ambient life decides the slot from (the villagers by person, the points of interest, the settled
   *  day scores: islandLife's, from shared inputs only); null before the scene is measured. */
  world: (date: LocalDate, slot: number) => Omit<AmbientWorld, 'phase'> | null;
  /** Put the villagers nobody's phone moves and the visitors where the schedule has them as of `t` (the slot clock: the
   *  island's with the relay's offset; at least the slot's decision when a tick asks). `jump`: the island wasn't in view
   *  meanwhile. Run on every slot, played or skipped, and on coming back. */
  sync?: (o: { jump: boolean; t?: number }) => void;
  /** Which person's villager is mine. */
  me: () => PersonId;
  /** Which actor draws a person's villager (ui-state/cast.ts: on the guest's phone, A's and B's are `partner` and
   *  `third`; the guest's is `third` on a member's). Default: by `me`. */
  actorOf?: (p: Who) => VillagerActor;
  /** Send a villager through an outing's points of interest (island/avatar.ts outing); false when it can't go now. */
  outing?: (id: VillagerActor, stops: readonly { node: string; linger: number }[], together?: boolean) => boolean;
  /** The visitor's turn (island/visitor.svelte.ts, visitorLife.ts) with the slot's PRNG: every slot, awake or asleep (they
   *  keep their own hours), beside whatever the villagers do. */
  visitor?: (r: () => number) => void;
  /** The relay's clock minus this device's (live.ts serverNow() − Date.now()); 0 without one. */
  offset?: () => number;
  /** The slot's beats (tests); ambient.ts villagerBeats. */
  beats?: typeof villagerBeats;
  /** The villagers, しずえ and the visitor do nothing on their own (`?idle=none`, the e2e's ambient life off:
   *  devHooks.ts): no beats, strolls or outings; asleep, they keep their zzz. */
  still?: boolean;
}

/** Slots played after 3 min without input: one in this many. */
const SLOW_EVERY = 3;

/** Start the scheduler; returns stop() (with `resync(jump)`: the schedule's places now, the island back in view). */
export function startIdleLife(ctx: IdleContext): (() => void) & { owned: () => number; resync: (jump: boolean) => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let lastInput = Date.now();
  const owned = new Set<() => void>();

  /** A follow-up beat on an actor, cancelled by stop() (and by any reaction that preempts the actor). */
  function later(id: ActorId, ms: number, fn: () => void) {
    const c = directorLater(
      id,
      ms,
      () => {
        owned.delete(c);
        if (!stopped) fn();
      },
      () => owned.delete(c) // a reaction preempted the actor (director cancel): forget it
    );
    owned.add(c);
  }

  /** The island's clock (a `?date=` preview included); with offset(), the relay's. */
  const clock = () => now().getTime();
  const offset = () => ctx.offset?.() ?? 0;

  function schedule() {
    if (stopped) return;
    if (timer) clearTimeout(timer);
    if (Date.now() - lastInput > 10 * 60_000) {
      timer = null; // asleep until the next touch / visibility change
      return;
    }
    timer = setTimeout(tick, msToNextSlot(clock() - DECIDE_MS, offset()));
  }

  function wakeUp() {
    lastInput = Date.now();
    if (!timer && !stopped) schedule();
  }

  /** The schedule's places as of now (`jump`: the island wasn't in view), or as of slot's decision (a tick's). */
  function sync(jump: boolean, date?: LocalDate, slot?: number) {
    if (stopped || ctx.still) return;
    const t = clock() + offset();
    ctx.sync?.({ jump, t: date !== undefined && slot !== undefined ? Math.max(t, slotStart(date, slot) + DECIDE_MS) : t });
  }

  function tick() {
    timer = null;
    if (stopped) return;
    if (document.hidden) return; // asleep until the page shows again (onVis), no polling while hidden
    // covered by a sheet: no polling; the next touch or key (closing the sheet) wakes it
    if (ctx.paused()) return;
    const { date, slot } = slotAt(clock() - DECIDE_MS, offset());
    // (a skipped slot only skips what plays: where everyone is, is the schedule's all the same)
    if (Date.now() - lastInput > 3 * 60_000 && slot % SLOW_EVERY) return sync(false, date, slot), schedule();
    if (!ctx.still) ctx.visitor?.(slotRand(date, slot, 'visitor'));
    // an event is playing: the villagers leave it be
    if (Date.now() - lastEvent.at < 3_000) return sync(false, date, slot), schedule();
    zzz();
    if (ctx.still) return schedule();
    const w = ctx.world(date, slot);
    if (w) {
      const beats = (ctx.beats ?? villagerBeats)({ ...w, phase: ctx.night?.() ? 'evening' : 'day' }, date, slot);
      const me = ctx.me();
      const actor = (who: Who): VillagerActor => ctx.actorOf?.(who) ?? (who === me ? 'mine' : who === 'G' ? 'third' : 'partner');
      for (const [who, b] of Object.entries(beats) as [Who, VillagerBeat][]) play(actor(who), b, b.kind === 'pair' ? actor(b.with) : null);
    }
    const h = hostBeat(date, slot);
    if (actors.host.present && h) hostIdle(h);
    sync(false, date, slot);
    schedule();
  }

  /** A sleeping villager's zzz back if a reaction took it. */
  function zzz() {
    for (const id of ['mine', 'partner', 'third'] as const) {
      const a = actors[id];
      if (a.asleep && !busy(id) && !a.fx.some((f) => f.kind === 'zzz')) addFx(id, 'zzz');
    }
  }

  function hostIdle(a: NonNullable<ReturnType<typeof hostBeat>>) {
    if (a === 'swap') {
      const h = actors.host;
      h.pose = h.pose === 'stand' ? 'wave' : 'stand';
      h.busyUntil = Date.now() + 6_000;
      later('host', 6_000, () => (actors.host.pose = null));
    } else if (a === 'wiggle') setMotion('host', 'wiggle');
    else setMotion('host', 'hop');
  }

  /** A villager's beat from the slot (a pair's from its lead: the other's entry is the same chat or dance). */
  function play(id: VillagerActor, b: VillagerBeat, mate: VillagerActor | null) {
    if (busy(id)) return;
    if (b.kind === 'outing') return void ctx.outing?.(id, b.stops, b.together);
    if (b.kind === 'pair' && !b.lead) return;
    later(id, b.at, () => (b.kind === 'pair' ? mate && pair(id, mate, b.action) : move(id, b.action)));
  }

  function move(id: VillagerActor, action: IdleAction) {
    if (busy(id)) return;
    actors[id].busyUntil = Date.now() + 2_400;
    switch (action) {
      case 'look':
      case 'daydream':
        return setMotion(id, 'turn');
      case 'wiggle':
        return setMotion(id, 'wiggle');
      case 'hum':
        return setMotion(id, 'hum');
      case 'hop':
        return setMotion(id, 'hop');
      case 'peek':
        // a glance up at the HUD (its cluster in the sky's top-right corner): turn to it, then home
        applyStep(id, { actor: id, face: 'jar', motion: 'turn' });
        return later(id, 1_800, () => (actors[id].face = 'home'));
      case 'treeshake':
        return ctx.treeShake(id);
      case 'stretch':
        return setMotion(id, 'stretch');
    }
  }

  function pair(id: VillagerActor, other: VillagerActor, action: 'chat' | 'dance') {
    if (busy(id) || busy(other)) return;
    const t = Date.now();
    if (action === 'dance') {
      actors[other].busyUntil = t + 2_000;
      for (const a of [id, other] as const) setMotion(a, 'dance');
      return;
    }
    actors[other].busyUntil = t + 3_200;
    actors[id].busyUntil = t + 3_200;
    faceToward(id, actors[other].x);
    applyStep(id, { actor: id, motion: 'nod' });
    later(other, 900, () => (faceToward(other, actors[id].x), applyStep(other, { actor: other, motion: 'laugh' })));
    later(id, 3_000, () => (actors[id].face = 'home'));
    later(other, 3_000, () => (actors[other].face = 'home'));
  }

  let resume: ReturnType<typeof setTimeout> | undefined;
  const onVis = () => {
    clearTimeout(resume);
    if (!document.hidden) {
      wakeUp();
      // back in view: everyone where the schedule has them by now (after the scene's own return: avatar.ts snapHome)
      resume = setTimeout(() => !ctx.paused() && sync(true), 0);
      return;
    }
    if (timer) clearTimeout(timer);
    timer = null;
  };
  addEventListener('pointerdown', wakeUp, { passive: true });
  addEventListener('keydown', wakeUp, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  schedule();

  const stop = () => {
    stopped = true;
    clearTimeout(resume);
    if (timer) clearTimeout(timer);
    timer = null;
    for (const c of owned) c();
    owned.clear();
    removeEventListener('pointerdown', wakeUp);
    removeEventListener('keydown', wakeUp);
    document.removeEventListener('visibilitychange', onVis);
  };
  /** Pending idle-owned follow-ups (tests); the schedule's places now and the slots going again (uncovered: islandLife). */
  return Object.assign(stop, { owned: () => owned.size, resync: (jump: boolean) => (sync(jump), !timer && schedule()) });
}
