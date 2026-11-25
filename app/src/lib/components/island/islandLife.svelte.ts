// The island's life, outside the scene's markup: reactions from the view diff, the greeting and startup
// beats, naps at night, the motion bus, idle life, the balloon present's schedule and the page-visibility pause. Create one per
// live scene during its init (`new IslandLife(...)`); it cleans up with the component.
import { hook, hookFlag, hooksOn } from '#lib/world/devHooks.ts';
import { onMount, untrack } from 'svelte';
import type { PersonId, RingFruit, WeekView, Who } from '#lib/types.ts';
import { RING_FRUITS } from '#lib/config/rules.ts';
import { dayScore, todayPct } from '#lib/world/progress.ts';
import { WAKE_START_MS, actors, react, resetAll, setAsleep, setSleepClock, wake } from '../motion/director.svelte.ts';
import { startIdleLife } from '../motion/idleLife.svelte.ts';
import { ambientPois, ambientRoute, ambientVillager, followPlan, goalWalk, isInside, meetUp, myLastMove, outing, presence, restPoint, steered, unplan } from './avatar.ts';
import { planAt, undriven, worldAt, type PlanInput, type PlanVillager } from './ambientPlan.ts';
import { DECIDE_MS, SLOT_MS, settledDay, slotAt, slotStart, type DayLatch } from './ambient.ts';
import { goalMoves } from '#lib/world/wander.ts';
import { relayOffset } from './ambientClock.ts';
import { actorOf, awake, guestPhone, online, setEveryoneAwake, setSpans, sleepIn, wakeMs, whoOf, wokeAt, type VillagerActor } from '#lib/ui-state/cast.ts';
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
const balloonMs = (first = false): number => (first ? 20_000 : 45_000) * (1 + Math.random());

/** Four ripeness stages of a fruit's day (a stage-up is R7): < 25% · < 60% · < 100% · the goal. */
const stage = (pct: number): number => (pct >= 100 ? 3 : pct >= 60 ? 2 : pct >= 25 ? 1 : 0);
const VILLAGERS = ['mine', 'partner', 'third'] as const;
/** Whether a villager sleeps now: its person's app closed, past the grace and any tap's wake (cast.ts awake: the
 *  relay's word, the same on every phone; no hour of the day: 2026-11-09). Module-level: the director keeps it past
 *  the scene, and a closure made in the constructor would keep the whole island (its DOM, its renderer) alive through
 *  a room's visit. */
const asleepNow = (id: string): boolean => (VILLAGERS as readonly string[]).includes(id) && !awake(whoOf(id as VillagerActor));

/** The ambient plan's last sync (e2e and perf: how long it took, how many). */
const syncStats = { ms: 0, max: 0, n: 0 };

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
  /** Each person's last settled day this phone saw (ambient.ts settledDay). */
  #latch: Partial<Record<PersonId, DayLatch>> = {};
  #resync: ((jump: boolean) => void) | null = null;
  /** The plan's last few answers, by its inputs and the slots decided by then (a tick asks twice, a touch again). */
  #plans = new Map<string, ReturnType<typeof planAt>>();

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

    // back in view (uncovered, shown): everyone nobody's phone moves where the schedule has them by now
    $effect(() => {
      if (!ctx.covered() && !this.hidden) untrack(() => this.#resync?.(true));
    });
  }

  /** The slot clock: the island's (a `?date=` preview moved) with the relay's offset. */
  #t = (): number => now().getTime() + relayOffset();
  /** A device instant (ms) on the slot clock, and a relay one (cast.ts's wakes). */
  #fromDevice = (d: number): number => d + (now().getTime() - Date.now()) + relayOffset();
  #fromRelay = (r: number): number => r + (now().getTime() - Date.now());

  /** Ambient life's inputs as of a slot starting at `start`, shared ones only (docs/backend.md#ambient-life
   *  "Positions"): each villager's rest (its person's last walk's end), who is here, a tap's wake (the relay's `at`), the
   *  rooms, the last walks' times, the points of interest, and the day scores settled (a lagging record decides
   *  nothing). Null before the scene is attached. */
  #input = (start: number): PlanInput | null => {
    if (!ambientVillager('mine')) return null;
    const pois = ambientPois();
    const v = this.#ctx.view(), day = slotAt(start).date;
    const villager = (w: Who): PlanVillager => {
      const id = actorOf(w), here = online(w), woke = wokeAt(w);
      const mine = id === 'mine' ? Math.max(steered.mine ?? -Infinity, myLastMove() ?? -Infinity) : steered[id];
      const wakeFrom = woke === undefined ? undefined : this.#fromRelay(woke);
      return {
        home: actors[id].home, rest: restPoint(id), present: here, inside: isInside(id),
        ...(mine !== undefined && Number.isFinite(mine) ? { lastIntent: this.#fromDevice(mine) } : {}),
        ...(!here && wakeFrom !== undefined ? { wake: { from: wakeFrom + WAKE_START_MS, until: wakeFrom + wakeMs() } } : {})
      };
    };
    const settled = (p: PersonId) => {
      const person = v.people[p];
      const cur = { score: dayScore(person), exercise: todayPct(person.rings.peach) >= 100 };
      const r = settledDay(cur, person.lastSyncAt ? Date.parse(person.lastSyncAt) : null, start, day, this.#latch[p]);
      this.#latch[p] = r.latch;
      return r.mark;
    };
    const a = settled('A'), b = settled('B');
    return {
      villagers: { A: villager('A'), B: villager('B'), G: villager('G') },
      pois,
      phase: this.#ctx.night() ? 'evening' : 'day',
      scores: { A: a.score, B: b.score },
      // the exercise goal (🍑) met today: a pull-up at the bar now and then
      exercise: { A: a.exercise, B: b.exercise },
      route: ambientRoute
    };
  };

  /** ambientPlan.ts planAt, kept while its inputs and the slots decided by `t` are the same. */
  #planAt = (input: PlanInput, t: number): ReturnType<typeof planAt> => {
    const key = `${Math.floor((t - DECIDE_MS) / SLOT_MS)}|${JSON.stringify({ ...input, route: 0 })}`;
    let p = this.#plans.get(key);
    if (!p) {
      if (this.#plans.size >= 4) this.#plans.delete(this.#plans.keys().next().value!);
      this.#plans.set(key, (p = planAt(input, t)));
    }
    return p;
  };

  /** Everyone nobody's phone moves and the visitors where the schedule has them as of `t` (the slot clock). */
  #sync = (o: { jump: boolean; t?: number }): void => {
    const t0 = performance.now(), t = Math.max(this.#t(), o.t ?? 0);
    const input = this.#input(t - DECIDE_MS);
    if (!input) return;
    const tracks = this.#planAt(input, t);
    for (const w of ['A', 'B', 'G'] as const) {
      const id = actorOf(w);
      if (id === 'mine') continue;
      if (undriven(input.villagers[w])) followPlan(id, tracks[w] ?? null, t, o.jump);
      else unplan(id);
    }
    presence.sync?.(t, o.jump);
    const ms = performance.now() - t0;
    syncStats.ms = ms;
    syncStats.max = Math.max(syncStats.max, ms);
    syncStats.n++;
  };

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
      // ambient life's world (island/ambient.ts, ambientPlan.ts worldAt): each member's villager and the guest's while
      // it's awake (asleep: not free, in nothing), present while its person's app is open (mine always, another by the
      // relay's presence and its grace, cast.ts online; woken by a tap it's in the island's life, not present: its
      // outings are the plan's), where they may wander, the settled day scores; from shared inputs only, so every phone
      // decides the same slot
      world: (date, slot) => {
        const start = slotStart(date, slot), input = this.#input(start);
        return input && worldAt(input, start, this.#planAt(input, start + DECIDE_MS - 1));
      },
      sync: this.#sync,
      // (an outing of a villager nobody's phone moves is the plan's: #sync puts it on its track)
      outing: (id, stops, together) => (online(whoOf(id)) ? outing(id, stops, together) : false),
      visitor: (r) => (presence.beat?.(r), presence.kk?.(r)),
      treeShake: (id) => {
        const w = whoOf(id);
        if (w !== 'G') this.shakeN[w]++;
      }
    });

    // `?balloon` (dev or test mode only): float one now, at any time of day, to look at it.
    if (hookFlag('balloon') && hook('balloon') !== 'none') this.later(() => (this.balloon = true), 400);

    this.#resync = stopIdle.resync;
    if (hooksOn()) (globalThis as { __lifeSync?: typeof syncStats }).__lifeSync = syncStats;
    const onVis = () => (this.hidden = document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      offs.forEach((o) => o());
      this.#resync = null;
      stopIdle();
      for (const id of VILLAGERS) unplan(id);
      for (const t of this.#pending) clearTimeout(t);
      document.removeEventListener('visibilitychange', onVis);
      resetAll();
    };
  }
}
