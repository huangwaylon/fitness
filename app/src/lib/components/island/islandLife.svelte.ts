// The island's life, outside the scene's markup: reactions from the view diff, the greeting and startup
// beats, naps at night, the motion bus, idle life, the balloon present's schedule and the page-visibility pause. Create one per
// live scene during its init (`new IslandLife(...)`); it cleans up with the component.
import { firstOn } from './dayRecord.ts';
import { hookFlag } from './devHooks.ts';
import { onMount, untrack } from 'svelte';
import type { PersonId, RingFruit, WeekView } from '#lib/types.ts';
import { RING_FRUITS } from '#lib/config/rules.ts';
import { dayScore, todayPct } from './progress.ts';
import { actors, react, resetAll, setAsleep, setSleepClock, wake } from '../motion/director.svelte.ts';
import { startIdleLife } from '../motion/idleLife.svelte.ts';
import { ambientPois, ambientVillager, goalWalk, meetUp, outing, presence, steered, wander } from './avatar.ts';
import { goalMoves } from './wander.ts';
import { partnerHere, relayOffset } from './ambientClock.ts';
import type { VillagerState } from './ambient.ts';
import { on } from '../motion/bus.svelte.ts';
import { dayKey, jst, now } from '#lib/time/clock.ts';
import type { ReactionId } from '../motion/reactions.ts';
import { SCENE } from '#lib/sync/storage.ts';

/** Thursday–Saturday under this many ベル this week: the low-week encouragement beat (R15). */
const LOW_WEEK_BELLS = 6;

interface Ctx {
  view: () => WeekView;
  /** Interactive + idle life + reactions (false for gallery thumbnails). Read once, at init. */
  live: boolean;
  /** A sheet or overlay covers the scene. */
  covered: () => boolean;
  night: () => boolean;
  day: () => boolean;
}

/** On-screen daytime until the next balloon (ms): 20–40 s for the first, then 45–90 s from one to the next (the
 *  countdown holds while one is up). */
const balloonMs = (first = false, r = Math.random): number => (first ? 20_000 + r() * 20_000 : 45_000 + r() * 45_000);

/** Four ripeness stages of a fruit's day (a stage-up is R7): < 25% · < 60% · < 100% · the goal. */
const stage = (pct: number): number => (pct >= 100 ? 3 : pct >= 60 ? 2 : pct >= 25 ? 1 : 0);
const asleepHour = (d: Date) => jst(d).hour >= 22 || jst(d).hour < 5;
const HOUR_MS = 3600_000;

/** True the first time `key` is seen today on this device. */
const once = (key: string): boolean => firstOn(SCENE.beat(key), dayKey());

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

    // Naps 22:00–5:00 on the relay's clock (the same moment on both phones; a tap wakes a villager for a moment, on
    // both: director.svelte.ts wake, villagerSync): put to sleep or woken at the hour it turns, not at every minute
    // (that put a woken villager back to sleep early).
    const sleepyNow = () => asleepHour(new Date(now().getTime() + relayOffset()));
    setSleepClock(sleepyNow);
    $effect(() => {
      let was: boolean | null = null;
      let timer: ReturnType<typeof setTimeout>;
      const tick = () => {
        const s = sleepyNow();
        if (s !== was) {
          was = s;
          untrack(() => {
            setAsleep('mine', s);
            setAsleep('partner', s);
          });
        }
        const t = now().getTime() + relayOffset();
        timer = setTimeout(tick, HOUR_MS - (((t % HOUR_MS) + HOUR_MS) % HOUR_MS) + 30);
      };
      tick();
      return () => clearTimeout(timer);
    });

    // Balloon present (NH): one floats by in the daytime every 2–3 minutes of on-screen time, the first after 30–60 s.
    // A countdown of the time the island is in the day, on screen (not covered, the page visible) and without a
    // balloon already up: it holds otherwise and resumes where it was. No cap per session.
    let remaining = balloonMs(true);
    $effect(() => {
      if (!ctx.day() || ctx.covered() || this.hidden || this.balloon) return;
      const started = performance.now();
      let fired = false;
      const id = setTimeout(() => {
        fired = true;
        remaining = balloonMs();
        this.balloon = true;
      }, remaining);
      return () => {
        clearTimeout(id);
        if (!fired) remaining = Math.max(1000, remaining - (performance.now() - started));
      };
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

  /** My villager tapped: wake it or play its squish (the partner's tap is the high-five, IslandScene). */
  tapMine(): void {
    if (!this.#ctx.live) return;
    if (actors.mine.asleep) wake('mine');
    else react('R9');
  }

  #diff(p: WeekView, v: WeekView): void {
    if (v.highFivesToday > p.highFivesToday) return this.later(() => react('R5'), 700);
    // the villagers go to it (avatar.ts): ふたりでぜんぶ brings both to the middle for a high-five; a fruit met walks that
    // person's villager to their tree, and its reaction plays there
    const moves = goalMoves(p, v);
    if (moves.meet && meetUp()) return;
    const walk = moves.walk ? goalWalk(moves.walk) : 0;
    for (const who of ['mine', 'partner'] as const) {
      const pid = who === 'mine' ? v.me : v.partner;
      const a = p.people[pid].rings, b = v.people[pid].rings;
      const ripeNow = RING_FRUITS.filter((f) => todayPct(b[f]) >= 100);
      const newlyRipe = RING_FRUITS.filter((f) => todayPct(b[f]) >= 100 && todayPct(a[f]) < 100);
      const stagedUp = RING_FRUITS.filter((f) => stage(todayPct(b[f])) !== stage(todayPct(a[f])) && todayPct(b[f]) > todayPct(a[f]));
      const swap = who === 'partner';
      const at = (r: ReactionId) => (walk ? this.later(() => react(r, swap), walk) : react(r, swap));
      if (newlyRipe.length && ripeNow.length === RING_FRUITS.length) return at('R8');
      if (newlyRipe.length) {
        this.celebrate[pid] = { fruit: newlyRipe[0], n: ++this.#celebrateN };
        return at('R6');
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
      // evening: my partner turns to me while my day is still under half (a nudge to move, not to report in)
      if (h >= 18 && h < 22 && dayScore(me) < 50 && once('evening')) beats.push('R12');
      if (wd >= 4 && wd <= 6 && me.weekBells < LOW_WEEK_BELLS && once('lowweek')) beats.push('R15');
    }
    // the director's event queue plays them one at a time
    this.later(() => beats.forEach((r) => react(r)), 700);

    const stopIdle = startIdleLife({
      paused: () => ctx.covered() || this.hidden,
      asleep: () => actors.mine.asleep && actors.partner.asleep,
      night: ctx.night,
      offset: relayOffset,
      me: () => ctx.view().me,
      // ambient life's world (island/ambient.ts): each person's villager, where it may wander, the day scores
      world: () => {
        const v = ctx.view(), mine = ambientVillager('mine'), partner = ambientVillager('partner');
        if (!mine || !partner) return null;
        const at = (t: number | undefined) => (t === undefined ? undefined : t + relayOffset());
        return {
          villagers: { [v.me]: { ...mine, present: true, lastIntent: at(steered.mine) }, [v.partner]: { ...partner, present: partnerHere(), lastIntent: at(steered.partner) } } as Record<PersonId, VillagerState>,
          pois: ambientPois(),
          scores: { A: dayScore(v.people.A), B: dayScore(v.people.B) }
        };
      },
      outing,
      visitor: (r) => presence.beat?.(r),
      treeShake: (id) => {
        const v = ctx.view();
        this.shakeN[id === 'mine' ? v.me : v.partner]++;
      }
    });

    // `?balloon` (dev or ?demo only): float one now, at any time of day, to look at it.
    if (hookFlag('balloon')) this.later(() => (this.balloon = true), 400);
    // `?wander` (dev or ?demo only): the partner sets off on a one-stop outing now (the e2e's hook)
    if (hookFlag('wander')) this.later(() => wander('partner', 1), 3200); // after the opening beats

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
