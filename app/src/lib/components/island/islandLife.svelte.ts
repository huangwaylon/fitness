// The island's life, outside the scene's markup (round 8): reactions from the view diff, the greeting and startup
// beats, naps at night, the motion bus, idle life, the balloon present and the page-visibility pause. Create one per
// live scene during its init (`new IslandLife(...)`); it cleans up with the component.
import { onMount, untrack } from 'svelte';
import type { PersonId, RingFruit, WeekView } from '#lib/types.ts';
import { RING_FRUITS } from '#lib/config/rules.ts';
import { ripeness } from '../sheets/ripeness.ts';
import { dayScore, todayPct } from './progress.ts';
import { actors, react, resetAll, setAsleep, wake } from '../motion/director.svelte.ts';
import { startIdleLife } from '../motion/idleLife.svelte.ts';
import { on } from '../motion/bus.svelte.ts';
import { dayKey, jst, minuteNow, now, reducedMotion } from '#lib/time/clock.ts';
import type { ReactionId } from '../motion/reactions.ts';
import { localKV, SCENE, sessionKV, writeRaw, type KV } from '#lib/sync/storage.ts';

/** Thursday–Saturday under this many ベル this week: the low-week encouragement beat (R15). */
const LOW_WEEK_BELLS = 1000;

interface Ctx {
  view: () => WeekView;
  /** Interactive + idle life + reactions (false for gallery thumbnails). Read once, at init. */
  live: boolean;
  /** A sheet or overlay covers the scene. */
  covered: () => boolean;
  night: () => boolean;
  day: () => boolean;
}

const asleepHour = (d: Date) => jst(d).hour >= 22 || jst(d).hour < 5;

/** True the first time `key` is seen today on this device. */
function once(key: string): boolean {
  const k = SCENE.beat(key);
  const day = dayKey();
  const kv = localKV();
  if (safeGet(kv, k) === day) return false;
  writeRaw(kv, k, day);
  return true;
}

/** Storage that throws on access (Safari, blocked) reads as empty: the beat plays, nothing breaks. */
function safeGet(kv: KV | null, k: string): string | null {
  try {
    return kv?.getItem(k) ?? null;
  } catch {
    return null;
  }
}

export class IslandLife {
  /** The page is hidden (the scene pauses its animations). */
  hidden = $state(typeof document !== 'undefined' && document.hidden); // a scene mounted in a hidden tab starts paused
  balloon = $state(false);
  devFireworks = $state(false);
  /** Bumped to shake a person's tree (idle life). */
  shakeN = $state<Record<PersonId, number>>({ A: 0, B: 0 });
  /** A fruit just ripened on a person's tree. */
  celebrate = $state<Record<PersonId, { fruit: RingFruit; n: number } | null>>({ A: null, B: null });
  #celebrateN = 0;
  #pending = new Set<ReturnType<typeof setTimeout>>();
  #ctx: Ctx;

  constructor(ctx: Ctx) {
    this.#ctx = ctx;
    if (!ctx.live) return;

    // Reactions from the view diff (never on the first render).
    let prev: WeekView | null = null;
    $effect(() => {
      const v = ctx.view();
      untrack(() => {
        const p = prev;
        prev = v;
        if (p && p.weekKey === v.weekKey && p.me === v.me) this.#diff(p, v);
      });
    });

    // Naps 22:00–5:00, checked at each new minute (a tap wakes a villager for a moment; director.svelte.ts).
    $effect(() => {
      const s = asleepHour(minuteNow());
      untrack(() => {
        setAsleep('mine', s);
        setAsleep('partner', s);
      });
    });

    onMount(() => this.#start());
  }

  /** Run `fn` in `ms`, unless the scene is gone by then. */
  later = (fn: () => void, ms: number): void => {
    const t = setTimeout(() => {
      this.#pending.delete(t);
      fn();
    }, ms);
    this.#pending.add(t);
  };

  /** A villager tapped: wake it or play its tap reaction, then `then` after the squish. */
  tapVillager(id: 'mine' | 'partner', then?: () => void): void {
    if (!this.#ctx.live) return;
    if (actors[id].asleep) wake(id);
    else react(id === 'mine' ? 'R9' : 'R10');
    this.later(() => then?.(), 200);
  }

  #diff(p: WeekView, v: WeekView): void {
    if (v.highFivesToday > p.highFivesToday) return this.later(() => react('R5'), 700);
    for (const who of ['mine', 'partner'] as const) {
      const pid = who === 'mine' ? v.me : v.partner;
      const a = p.people[pid].rings, b = v.people[pid].rings;
      const ripeNow = RING_FRUITS.filter((f) => todayPct(b[f]) >= 100);
      const newlyRipe = RING_FRUITS.filter((f) => todayPct(b[f]) >= 100 && todayPct(a[f]) < 100);
      const stagedUp = RING_FRUITS.filter((f) => ripeness(todayPct(b[f])) !== ripeness(todayPct(a[f])) && todayPct(b[f]) > todayPct(a[f]));
      const swap = who === 'partner';
      if (newlyRipe.length && ripeNow.length === RING_FRUITS.length) return react('R8', swap);
      if (newlyRipe.length) {
        this.celebrate[pid] = { fruit: newlyRipe[0], n: ++this.#celebrateN };
        return react('R6', swap);
      }
      if (stagedUp.length) return react('R7', swap);
    }
    if (dayScore(v.people[v.partner]) > dayScore(p.people[v.partner])) react('R3');
  }

  #start(): () => void {
    const ctx = this.#ctx;
    const offs = [
      on('open', () => once('open') && react('R1')),
      on('highfive-sent', () => react('R4')),
      on('highfive-received', () => react('R5')),
      on('sync-error', () => react('R17')),
      // The dev gallery's triggers: compiled out of the production build.
      ...(import.meta.env.DEV
        ? [
            on('dev:react', (id) => {
              if (id === 'R13') {
                setAsleep('mine', !actors.mine.asleep);
                setAsleep('partner', !actors.partner.asleep);
              } else if (id === 'R14') wake('mine');
              else if (id) react(id as ReactionId);
            }),
            on('dev:balloon', () => (this.balloon = true)),
            on('dev:fireworks', () => (this.devFireworks = !this.devFireworks))
          ]
        : [])
    ];

    // Startup beats, spaced so they never overlap: greeting, morning stretch, evening nudge, low week.
    const d = now();
    const { hour: h, weekday: wd } = jst(d);
    const view = ctx.view();
    const me = view.people[view.me];
    const beats: ReactionId[] = [];
    if (!asleepHour(d)) {
      if (once('open')) beats.push('R1');
      if (h >= 5 && h < 9 && once('morning')) beats.push('R11');
      // evening: my partner turns to me while my day is still under half (ADR 0021: a nudge to move, not to check in)
      if (h >= 18 && h < 22 && dayScore(me) < 50 && once('evening')) beats.push('R12');
      if (wd >= 4 && wd <= 6 && me.weekBells < LOW_WEEK_BELLS && once('lowweek')) beats.push('R15');
    }
    // the director's event queue plays them one at a time
    this.later(() => beats.forEach((r) => react(r)), 700);

    const stopIdle = startIdleLife({
      paused: () => ctx.covered() || this.hidden,
      asleep: () => actors.mine.asleep && actors.partner.asleep,
      night: ctx.night,
      scores: () => [dayScore(ctx.view().people.A), dayScore(ctx.view().people.B)],
      treeShake: (id) => {
        const v = ctx.view();
        this.shakeN[id === 'mine' ? v.me : v.partner]++;
      }
    });

    // Balloon present (A8: a bit more often): day only, first after 45 s on the island, then every
    // 4 min, at most 3 per session.
    const balloonTry = (ms: number) =>
      this.later(() => {
        const n = Number(safeGet(sessionKV(), SCENE.balloons) ?? 0);
        if (n >= 3) return;
        if (ctx.day() && !ctx.covered() && !this.hidden && !reducedMotion() && !this.balloon) {
          writeRaw(sessionKV(), SCENE.balloons, String(n + 1));
          this.balloon = true;
          balloonTry(240_000);
        } else balloonTry(30_000);
      }, ms);
    balloonTry(45_000);
    // `?balloon` (dev or ?demo only): float one now, at any time of day, to look at it.
    const q = new URLSearchParams(location.search);
    if (q.has('balloon') && (import.meta.env.DEV || q.has('demo'))) this.later(() => (this.balloon = true), 400);

    const onVis = () => (this.hidden = document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      offs.forEach((o) => o());
      stopIdle();
      for (const t of this.#pending) clearTimeout(t);
      document.removeEventListener('visibilitychange', onVis);
      resetAll();
    };
  }
}
