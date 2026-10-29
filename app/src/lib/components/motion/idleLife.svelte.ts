// Idle life (style guide §M.7): one scheduler per live scene. Every 8–15 s one actor does one small
// thing from its pool (look around, wiggle, hum, hop, stroll, daydream, tree shake, chat, dance,
// stretch; しずえ swaps pose / wiggles / hops). At night the villagers only doze. Pauses while the tab
// is hidden, a sheet is open, or under reduced motion; slows after 3 min without input and stops
// after 10 min until the next touch.
import { HOST_IDLE, IDLE_POOL, type ActorId, type IdleAction } from './reactions.ts';
import { actors, addFx, applyStep, busy, lastEvent, setEmote, setMotion, stroll } from './director.svelte.ts';
import { now, reducedMotion } from './clock.ts';

export interface IdleContext {
  /** Sheet / overlay open (or the scene isn't live). */
  paused: () => boolean;
  /** The villagers are asleep (22–05). */
  asleep: () => boolean;
  /** Both weekly scores, for the dance-together weight. */
  scores: () => [number, number];
  /** Shake that actor's own tree (+ a falling leaf). */
  treeShake: (id: 'mine' | 'partner') => void;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function pickWeighted<T extends { weight: number }>(items: T[]): T | null {
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const i of items) if ((r -= i.weight) < 0) return i;
  return items[items.length - 1] ?? null;
}

/** Start the scheduler; returns stop(). */
export function startIdleLife(ctx: IdleContext): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let lastInput = Date.now();
  let lastHost = 0;
  const last: Partial<Record<ActorId, IdleAction | string>> = {};
  const lastAt: Record<string, number> = {};

  function schedule(ms?: number) {
    if (stopped) return;
    if (timer) clearTimeout(timer);
    const idle = Date.now() - lastInput;
    if (idle > 10 * 60_000) {
      timer = null; // asleep until the next touch / visibility change
      return;
    }
    timer = setTimeout(tick, ms ?? (idle > 3 * 60_000 ? rand(20_000, 30_000) : rand(8_000, 15_000)));
  }

  function wakeUp() {
    lastInput = Date.now();
    if (!timer && !stopped) schedule();
  }

  function tick() {
    timer = null;
    if (document.hidden || ctx.paused() || reducedMotion()) return schedule(2_000);
    if (Date.now() - lastEvent.at < 3_000) return schedule(3_000);
    if (ctx.asleep()) {
      doze();
      return schedule(rand(20_000, 30_000));
    }
    const r = Math.random();
    let id: ActorId = r < 0.4 ? 'partner' : r < 0.8 ? 'mine' : 'host';
    if (id === 'host' && (!actors.host.present || Date.now() - lastHost < 20_000)) id = Math.random() < 0.5 ? 'mine' : 'partner';
    if (busy(id)) return schedule(1_500);
    if (id === 'host') hostIdle();
    else villagerIdle(id);
    schedule();
  }

  function doze() {
    for (const id of ['mine', 'partner'] as const) if (actors[id].asleep && !busy(id)) setEmote(id, 'sleepy', true);
    if (actors.host.present && Date.now() - lastHost > 60_000) {
      lastHost = Date.now();
      setEmote('host', 'dozing');
    }
  }

  function hostIdle() {
    lastHost = Date.now();
    const options = HOST_IDLE.filter((a) => a !== last.host);
    const a = options[Math.floor(Math.random() * options.length)];
    last.host = a;
    if (a === 'swap') {
      const h = actors.host;
      h.pose = h.pose === 'stand' ? 'wave' : 'stand';
      h.busyUntil = Date.now() + 6_000;
      setTimeout(() => (actors.host.pose = null), 6_000);
    } else if (a === 'wiggle') setMotion('host', 'wiggle');
    else setMotion('host', 'hop');
  }

  function villagerIdle(id: 'mine' | 'partner') {
    const other = id === 'mine' ? 'partner' : 'mine';
    const h = now().getHours();
    const [sa, sb] = ctx.scores();
    const t = Date.now();
    const pool = IDLE_POOL.filter((e) => {
      if (e.action === last[id]) return false;
      if (e.hours && !(h >= e.hours[0] && h < e.hours[1])) return false;
      if (e.every && t - (lastAt[`${id}:${e.action}`] ?? 0) < e.every) return false;
      if (e.pair && busy(other)) return false;
      if (e.action === 'dance' && Math.min(sa, sb) < 70) return false;
      return true;
    }).map((e) => (e.action === 'dance' && Math.min(sa, sb) >= 80 ? { ...e, weight: 15 } : e));
    const pick = pickWeighted(pool);
    if (!pick) return;
    last[id] = pick.action;
    lastAt[`${id}:${pick.action}`] = t;
    const me = actors[id];
    me.busyUntil = t + 2_400;
    switch (pick.action) {
      case 'look': return setMotion(id, 'turn');
      case 'wiggle': return setMotion(id, 'wiggle');
      case 'hum': setMotion(id, 'hum'); return addFx(id, 'notes');
      case 'hop': return applyStep(id, { actor: id, motion: 'hop', emote: 'happiness' });
      case 'stroll':
        return stroll(id, 40, () => (Math.random() < 0.5 ? setEmote(id, 'daydreaming') : setMotion(id, 'wiggle')));
      case 'daydream': return setEmote(id, Math.random() < 0.5 ? 'daydreaming' : 'thought');
      case 'treeshake': return ctx.treeShake(id);
      case 'stretch': return applyStep(id, { actor: id, motion: 'stretch', emote: 'pose-stretch' });
      case 'chat': {
        lastAt[`${other}:chat`] = t;
        actors[other].busyUntil = t + 3_200;
        me.busyUntil = t + 3_200;
        applyStep(id, { actor: id, face: 'other', emote: 'thought' });
        setTimeout(() => applyStep(other, { actor: other, face: 'other', motion: 'laugh', emote: 'laughter' }), 900);
        setTimeout(() => {
          actors[id].face = 'home';
          actors[other].face = 'home';
        }, 3_000);
        return;
      }
      case 'dance':
        actors[other].busyUntil = t + 2_000;
        for (const a of [id, other] as const) applyStep(a, { actor: a, motion: 'dance', emote: 'glee', fx: 'notes' });
        return;
    }
  }

  const onVis = () => (document.hidden ? undefined : wakeUp());
  addEventListener('pointerdown', wakeUp, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  schedule(rand(4_000, 7_000));

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    removeEventListener('pointerdown', wakeUp);
    document.removeEventListener('visibilitychange', onVis);
  };
}
