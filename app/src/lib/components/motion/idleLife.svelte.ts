// Idle life (design.md "Motion"): one scheduler per live scene. Every 9–15 s one actor does one
// small background thing from its pool (look around, wiggle, hop, wander off to a point of interest, a glance up at
// the jar, tree shake,
// chat, dance, stretch; しずえ swaps pose / wiggles / hops). No emote bubbles or fx: those mark events. In the
// evening (19–22) the energetic ones rest; asleep (22–05) the villagers only doze. Pauses while the tab
// is hidden, a sheet is open, or under reduced motion; slows after 3 min without input and stops after
// 10 min until the next touch. Every follow-up beat is scheduled through the director's `later`, and
// stop() cancels them all, so nothing writes to the actors after the scene unmounts.
import { HOST_IDLE, IDLE_GAP, IDLE_GAP_SLOW, IDLE_POOL, type ActorId, type IdleAction } from './reactions.ts';
import { actors, addFx, applyStep, awayFromHome, busy, later as directorLater, lastEvent, setEmote, setMotion } from './director.svelte.ts';
import { jst, reducedMotion } from '#lib/time/clock.ts';

interface IdleContext {
  /** Sheet / overlay open (or the scene isn't live). */
  paused: () => boolean;
  /** The villagers are asleep (22–05). */
  asleep: () => boolean;
  /** Evening (tod night but still awake): no day-only actions. */
  night?: () => boolean;
  /** Both people's day scores (today's ベル as % of a full day, progress.ts dayScore), for the dance-together weight. */
  scores: () => [number, number];
  /** Shake that actor's own tree (+ a falling leaf). */
  treeShake: (id: 'mine' | 'partner') => void;
  /** Send a villager off on a walk to a point of interest or a few (island/avatar.ts); false when it can't go now. */
  wander?: (id: 'mine' | 'partner') => boolean;
  /** Random source (tests). */
  random?: () => number;
}

/** The partner's outings: at most one per this long (ms), and the chance a tick sends it off when it's free. */
const PARTNER_WANDER_GAP = 9_000;
const PARTNER_WANDER_ODDS = 0.5;
/** Mine wanders on its own only when I haven't touched the island for this long. */
const MINE_WANDER_IDLE = 120_000;

function pickWeighted<T extends { weight: number }>(items: T[], rnd: () => number): T | null {
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (total <= 0) return null;
  let r = rnd() * total;
  for (const i of items) if ((r -= i.weight) < 0) return i;
  return items[items.length - 1] ?? null;
}

/** Start the scheduler; returns stop(). */
export function startIdleLife(ctx: IdleContext): (() => void) & { owned: () => number } {
  const rnd = ctx.random ?? Math.random;
  const rand = (a: number, b: number) => a + rnd() * (b - a);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let lastInput = Date.now();
  let lastHost = 0;
  const last: Partial<Record<ActorId, IdleAction | string>> = {};
  const lastAt: Record<string, number> = {};
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

  function schedule(ms?: number) {
    if (stopped) return;
    if (timer) clearTimeout(timer);
    const idle = Date.now() - lastInput;
    if (idle > 10 * 60_000) {
      timer = null; // asleep until the next touch / visibility change
      return;
    }
    const [a, b] = idle > 3 * 60_000 ? IDLE_GAP_SLOW : IDLE_GAP;
    timer = setTimeout(tick, ms ?? rand(a, b));
  }

  function wakeUp() {
    lastInput = Date.now();
    if (!timer && !stopped) schedule();
  }

  function tick() {
    timer = null;
    if (stopped) return;
    if (document.hidden) return; // asleep until the page shows again (onVis), no polling while hidden
    // covered by a sheet or reduced motion: no polling; the next touch or key (closing the sheet) wakes it
    if (ctx.paused() || reducedMotion()) return;
    if (Date.now() - lastEvent.at < 3_000) return schedule(3_000);
    if (ctx.asleep()) {
      doze();
      return schedule(rand(20_000, 30_000));
    }
    const r = rnd();
    let id: ActorId = r < 0.4 ? 'partner' : r < 0.8 ? 'mine' : 'host';
    if (id === 'host' && (!actors.host.present || Date.now() - lastHost < 20_000)) id = rnd() < 0.5 ? 'mine' : 'partner';
    // the partner goes about the island on its own: a walk to a point of interest or a few, every other tick or so
    if (ctx.wander && !actors.partner.asleep && !busy('partner') && Date.now() - (lastAt['partner:wander'] ?? 0) > PARTNER_WANDER_GAP &&
      rnd() < PARTNER_WANDER_ODDS && ctx.wander('partner')) {
      lastAt['partner:wander'] = Date.now();
      return schedule();
    }
    if (busy(id)) return schedule(1_500);
    if (id === 'host') hostIdle();
    else villagerIdle(id);
    schedule();
  }

  function doze() {
    for (const id of ['mine', 'partner'] as const) {
      const a = actors[id];
      if (!a.asleep || busy(id)) continue;
      if (!a.fx.some((f) => f.kind === 'zzz')) addFx(id, 'zzz');
    }
    if (actors.host.present && Date.now() - lastHost > 60_000) {
      lastHost = Date.now();
      setEmote('host', 'sleepy');
    }
  }

  function hostIdle() {
    lastHost = Date.now();
    const options = HOST_IDLE.filter((a) => a !== last.host);
    const a = pick(options);
    last.host = a;
    if (a === 'swap') {
      const h = actors.host;
      h.pose = h.pose === 'stand' ? 'wave' : 'stand';
      h.busyUntil = Date.now() + 6_000;
      later('host', 6_000, () => (actors.host.pose = null));
    } else if (a === 'wiggle') setMotion('host', 'wiggle');
    else setMotion('host', 'hop');
  }

  function villagerIdle(id: 'mine' | 'partner') {
    const other = id === 'mine' ? 'partner' : 'mine';
    const h = jst().hour;
    const evening = ctx.night?.() ?? false;
    const [sa, sb] = ctx.scores();
    const t = Date.now();
    const pool = IDLE_POOL.filter((e) => {
      if (e.action === last[id]) return false;
      if (e.day && evening) return false;
      if (e.hours && !(h >= e.hours[0] && h < e.hours[1])) return false;
      if (e.every && t - (lastAt[`${id}:${e.action}`] ?? 0) < e.every) return false;
      if (e.pair && busy(other)) return false;
      // one villager out at a time; mine only when left alone a while
      if (e.action === 'wander' && (!ctx.wander || actors[other].walking || awayFromHome(other) || (id === 'mine' && t - lastInput < MINE_WANDER_IDLE))) return false;
      if (e.action === 'dance' && Math.min(sa, sb) < 70) return false;
      return true;
    }).map((e) => (e.action === 'dance' && Math.min(sa, sb) >= 80 ? { ...e, weight: 15 } : e));
    const choice = pickWeighted(pool, rnd);
    if (!choice) return;
    last[id] = choice.action;
    lastAt[`${id}:${choice.action}`] = t;
    const me = actors[id];
    me.busyUntil = t + 2_400;
    switch (choice.action) {
      case 'look':
        return setMotion(id, 'turn');
      case 'wiggle':
        return setMotion(id, 'wiggle');
      case 'hum':
        return setMotion(id, 'hum');
      case 'hop':
        return setMotion(id, 'hop');
      case 'wander':
        me.busyUntil = 0; // the walk sets its own
        ctx.wander?.(id);
        return;
      case 'peek':
        // a glance up at the jar (in the sky HUD beside the ribbon since it left the island): turn to it, then home
        applyStep(id, { actor: id, face: 'jar', motion: 'turn' });
        return later(id, 1_800, () => (actors[id].face = 'home'));
      case 'daydream':
        return setMotion(id, 'turn');
      case 'treeshake':
        return ctx.treeShake(id);
      case 'stretch':
        return setMotion(id, 'stretch');
      case 'chat': {
        lastAt[`${other}:chat`] = t;
        actors[other].busyUntil = t + 3_200;
        me.busyUntil = t + 3_200;
        applyStep(id, { actor: id, face: 'other', motion: 'nod' });
        later(other, 900, () => applyStep(other, { actor: other, face: 'other', motion: 'laugh' }));
        later(id, 3_000, () => (actors[id].face = 'home'));
        later(other, 3_000, () => (actors[other].face = 'home'));
        return;
      }
      case 'dance':
        actors[other].busyUntil = t + 2_000;
        for (const a of [id, other] as const) setMotion(a, 'dance');
        return;
    }
  }

  const onVis = () => {
    if (!document.hidden) return wakeUp();
    if (timer) clearTimeout(timer);
    timer = null;
  };
  addEventListener('pointerdown', wakeUp, { passive: true });
  addEventListener('keydown', wakeUp, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  schedule(rand(2_500, 4_500));

  const stop = () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    timer = null;
    for (const c of owned) c();
    owned.clear();
    removeEventListener('pointerdown', wakeUp);
    removeEventListener('keydown', wakeUp);
    document.removeEventListener('visibilitychange', onVis);
  };
  /** Pending idle-owned follow-ups (tests). */
  return Object.assign(stop, { owned: () => owned.size });
}
