// The island's life, outside the scene's markup: reactions from the view diff, the greeting and startup
// beats, naps at night, the motion bus, idle life, the balloon present's schedule and the page-visibility pause. Create one per
// live scene during its init (`new IslandLife(...)`); it cleans up with the component.
import { hook, hookFlag } from '../../world/devHooks.ts';
import { onMount, untrack } from 'svelte';
import type { PersonId, RingFruit, WeekView } from '#lib/types.ts';
import { RING_FRUITS } from '#lib/config/rules.ts';
import { dayScore, todayPct } from '../../world/progress.ts';
import { actors, react, resetAll, setAsleep, setSleepClock, wake } from '../motion/director.svelte.ts';
import { startIdleLife } from '../motion/idleLife.svelte.ts';
import { ambientPois, ambientVillager, goalWalk, meetUp, outing, presence, steered } from './avatar.ts';
import { goalMoves } from '../../world/wander.ts';
import { relayOffset } from './ambientClock.ts';
import { actorOf, awake, guestPhone, islandActors, online, setEveryoneAwake, setSpans, sleepIn, whoOf, type VillagerActor } from '#lib/ui-state/cast.ts';
import type { AmbientWorld } from './ambient.ts';
import { on } from '#lib/ui-state/bus.svelte.ts';
import { dayKey, jst, now } from '#lib/time/clock.ts';
import type { ReactionId } from '../motion/reactions.ts';
import { SCENE, firstOn } from '#lib/sync/storage.ts';

/** Thursday–Saturday under this many ベル this week: the low-week encouragement beat (R15). */
const LOW_WEEK_BELLS = 6;

interface Ctx {
  view: () => WeekView;
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
const VILLAGERS = ['mine', 'partner', 'third'] as const;
/** Whether a villager sleeps now: its person's app closed, past the grace and any tap's wake (cast.ts awake: the
 *  relay's word, the same on every phone; no hour of the day: 2026-11-09). Module-level: the director keeps it past
 *  the scene, and a closure made in the constructor would keep the whole island (its DOM, its renderer) alive through
 *  a room's visit. */
const asleepNow = (id: string): boolean => (VILLAGERS as readonly string[]).includes(id) && !awake(whoOf(id as VillagerActor));

/** True the first time `key` is seen today on this device. */
const once = (key: string): boolean => firstOn(SCENE.beat(key), dayKey());

export class IslandLife {
  /** The page is hidden (the scene pauses its animations). */
  /** The island's opening beats not yet played (its first 700 ms: the greeting, the morning's, the evening's). */
  opening = true;
  hidden = $state(typeof document !== 'undefined' && document.hidden); // a scene mounted in a hidden tab starts paused
  balloon = $state(false);
  devFireworks = $state(false);
  /** Bumped to shake a person's tree (idle life). */
  shakeN = $state<Record<PersonId, number>>({ A: 0, B: 0 });
  /** A fruit just ripened on a person's tree. */
  celebrate = $state<Record<PersonId, { fruit: RingFruit; n: number } | null>>({ A: null, B: null });
  #celebrateN = 0;
  #pending = new Set<ReturnType<typeof setTimeout>>();
  #sleepTimer: ReturnType<typeof setTimeout> | undefined;
  /** The scene is gone: no more timers (one would keep the whole island alive). */
  #gone = false;
  #ctx: Ctx;

  constructor(ctx: Ctx) {
    this.#ctx = ctx;

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

    // Asleep while offline, awake while online (cast.ts awake; `?awake`: everyone online; `?grace=`, `?wake=`: its spans): put to sleep or woken at each
    // word from the relay (the scene: syncSleep), and when a grace or a tap's wake runs out (on both phones at once:
    // director.svelte.ts wake, villagerSync playWake).
    setEveryoneAwake(hookFlag('awake'));
    const ms = (k: string) => (hook(k) && Number(hook(k)) > 0 ? { [k]: Number(hook(k)) } : {});
    setSpans({ ...ms('grace'), ...ms('wake') });
    setSleepClock(asleepNow);
    this.syncSleep();
    $effect(() => () => {
      this.#gone = true;
      clearTimeout(this.#sleepTimer);
    });

    // Balloon present (NH): one floats by in the daytime every 2–3 minutes of on-screen time, the first after 30–60 s.
    // A countdown of the time the island is in the day, on screen (not covered, the page visible) and without a
    // balloon already up: it holds otherwise and resumes where it was. No cap per session.
    // `?balloon=none` (dev or test mode only): none floats by (a spec tapping where one would drift over)
    const noBalloons = hook('balloon') === 'none';
    let remaining = balloonMs(true);
    $effect(() => {
      if (noBalloons || !ctx.day() || ctx.covered() || this.hidden || this.balloon) return;
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

  /** Each villager asleep or awake as cast.ts says now, and again when that turns by itself. */
  syncSleep = (): void => {
    clearTimeout(this.#sleepTimer);
    if (this.#gone) return;
    untrack(() => {
      for (const id of VILLAGERS) setAsleep(id, asleepNow(id));
    });
    const ms = sleepIn();
    if (ms !== null) this.#sleepTimer = setTimeout(this.syncSleep, ms + 30);
  };

  /** My villager tapped (awake: its app is open): its squish (the partner's tap is the high-five, IslandScene). */
  tapMine(): void {
    react('R9');
  }

  #diff(p: WeekView, v: WeekView): void {
    // the guest's phone: the members' fruit ripens on their trees, and ふたりでぜんぶ brings everyone to the middle, the
    // guest's villager too (their villagers' walks to a tree and the reactions are their own phones' moments)
    if (guestPhone()) {
      if (goalMoves(p, v).meet) meetUp();
      for (const pid of ['A', 'B'] as const) {
        const a = p.people[pid].rings, b = v.people[pid].rings;
        const newlyRipe = RING_FRUITS.filter((f) => todayPct(b[f]) >= 100 && todayPct(a[f]) < 100);
        if (newlyRipe.length) this.celebrate[pid] = { fruit: newlyRipe[0], n: ++this.#celebrateN };
      }
      return;
    }
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
      on('highfive-sent', () => react('R4')),
      on('sync-error', () => react('R17')),
      // The dev gallery's triggers: compiled out of the production build.
      ...(import.meta.env.DEV
        ? [
            on('dev:react', (id) => {
              if (id === 'R13') {
                setAsleep('mine', !actors.mine.asleep);
                setAsleep('partner', !actors.partner.asleep);
                setAsleep('third', !actors.third.asleep);
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
    if (once('open')) beats.push('R1');
    // (the rest are about this phone's own day: the guest has none)
    if (!guestPhone()) {
      if (h >= 5 && h < 9 && once('morning')) beats.push('R11');
      // evening: my partner turns to me while my day is still under half (a nudge to move, not to report in)
      if (h >= 18 && h < 22 && dayScore(me) < 50 && once('evening')) beats.push('R12');
      if (wd >= 4 && wd <= 6 && me.weekBells < LOW_WEEK_BELLS && once('lowweek')) beats.push('R15');
    }
    // the director's event queue plays them one at a time
    this.opening = true;
    this.later(() => {
      beats.forEach((r) => react(r));
      this.opening = false;
    }, 700);

    const stopIdle = startIdleLife({
      still: hook('idle') === 'none',
      paused: () => ctx.covered() || this.hidden,
      night: ctx.night,
      offset: relayOffset,
      me: () => ctx.view().me,
      // whose villager each actor draws (ui-state/cast.ts): the guest's takes part too while it's on the island
      actorOf: (p) => actorOf(p),
      // ambient life's world (island/ambient.ts): each member's villager and the guest's while it's awake (asleep:
      // not free, in nothing), present while its person's app is open, where they may wander, the day scores
      world: () => {
        const v = ctx.view(), a = actorOf('A'), b = actorOf('B'), va = ambientVillager(a), vb = ambientVillager(b);
        if (!va || !vb) return null;
        const at = (t: number | undefined) => (t === undefined ? undefined : t + relayOffset());
        // (present: mine always, another by the relay's presence and its grace, cast.ts online; woken by a tap, it's
        // in the island's life but not present: an outing of its own)
        const g = actorOf('G'), vg = islandActors().includes(g) ? ambientVillager(g) : null;
        return {
          villagers: {
            A: { ...va, present: online('A'), lastIntent: at(steered[a]) },
            B: { ...vb, present: online('B'), lastIntent: at(steered[b]) },
            ...(vg ? { G: { ...vg, present: online('G'), lastIntent: at(steered[g]) } } : {})
          } as AmbientWorld['villagers'],
          pois: ambientPois(),
          scores: { A: dayScore(v.people.A), B: dayScore(v.people.B) },
          // the exercise goal (🍑) met today: a pull-up at the bar now and then
          exercise: { A: todayPct(v.people.A.rings.peach) >= 100, B: todayPct(v.people.B.rings.peach) >= 100 }
        };
      },
      outing,
      visitor: (r) => (presence.beat?.(r), presence.guestBeat?.(r), presence.kk?.(r)),
      treeShake: (id) => {
        const w = whoOf(id);
        if (w !== 'G') this.shakeN[w]++;
      }
    });

    // `?balloon` (dev or test mode only): float one now, at any time of day, to look at it.
    if (hookFlag('balloon') && hook('balloon') !== 'none') this.later(() => (this.balloon = true), 400);

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
