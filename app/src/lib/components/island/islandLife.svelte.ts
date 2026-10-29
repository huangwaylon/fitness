// The island's life, outside the scene's markup (round 8): reactions from the view diff, the greeting and startup
// beats, naps at night, the motion bus, idle life, the balloon present and the page-visibility pause. Create one per
// live scene during its init (`new IslandLife(...)`); it cleans up with the component.
import { onMount, untrack } from 'svelte';
import type { FruitKey, PersonId, WeekView } from '#lib/types.ts';
import { FRUITS } from '#lib/config/rules.ts';
import { ripeness } from '../sheets/ripeness.ts';
import { actors, react, resetAll, setAsleep, wake } from '../motion/director.svelte.ts';
import { startIdleLife } from '../motion/idleLife.svelte.ts';
import { on } from '../motion/bus.svelte.ts';
import { dayKey, jst, minuteNow, now, reducedMotion } from '#lib/time/clock.ts';
import type { ReactionId } from '../motion/reactions.ts';

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
  const k = `if-${key}`;
  const day = dayKey();
  if (localStorage.getItem(k) === day) return false;
  localStorage.setItem(k, day);
  return true;
}

export class IslandLife {
  /** The page is hidden (the scene pauses its animations). */
  hidden = $state(false);
  balloon = $state(false);
  devFireworks = $state(false);
  /** Bumped to shake a person's tree (idle life). */
  shakeN = $state<Record<PersonId, number>>({ A: 0, B: 0 });
  /** A fruit just ripened on a person's tree. */
  celebrate = $state<Record<PersonId, { fruit: FruitKey; n: number } | null>>({ A: null, B: null });
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
      const a = p.people[pid].fruits, b = v.people[pid].fruits;
      const ripeNow = FRUITS.filter((f) => b[f].pct >= 100);
      const newlyRipe = FRUITS.filter((f) => b[f].pct >= 100 && a[f].pct < 100);
      const stagedUp = FRUITS.filter((f) => ripeness(b[f].pct) !== ripeness(a[f].pct) && b[f].pct > a[f].pct);
      const swap = who === 'partner';
      if (newlyRipe.length && ripeNow.length === 4) return react('R8', swap);
      if (newlyRipe.length) {
        this.celebrate[pid] = { fruit: newlyRipe[0], n: ++this.#celebrateN };
        return react('R6', swap);
      }
      if (stagedUp.length) return react('R7', swap);
    }
    if (v.people[v.partner].score > p.people[v.partner].score) react('R3');
  }

  #start(): () => void {
    const ctx = this.#ctx;
    const offs = [
      on('open', () => once('open') && react('R1')),
      on('checkin-saved', () => react('R2')),
      on('highfive-sent', () => react('R4')),
      on('highfive-received', () => react('R5')),
      on('sync-error', () => react('R17')),
      on('dev:react', (id) => {
        if (id === 'R13') {
          setAsleep('mine', !actors.mine.asleep);
          setAsleep('partner', !actors.partner.asleep);
        } else if (id === 'R14') wake('mine');
        else if (id) react(id as ReactionId);
      }),
      on('dev:balloon', () => (this.balloon = true)),
      on('dev:fireworks', () => (this.devFireworks = !this.devFireworks))
    ];

    // Startup beats, spaced so they never overlap: greeting, morning stretch, evening nudge, low week.
    const d = now();
    const { hour: h, weekday: wd } = jst(d);
    const view = ctx.view();
    const me = view.people[view.me];
    const checkedIn = (me.habits?.ticksByDate[view.today] ?? []).length > 0;
    const beats: ReactionId[] = [];
    if (!asleepHour(d)) {
      if (once('open')) beats.push('R1');
      if (h >= 5 && h < 9 && once('morning')) beats.push('R11');
      if (h >= 18 && h < 22 && !checkedIn && once('evening')) beats.push('R12');
      if (wd >= 4 && wd <= 6 && me.score < 30 && once('lowweek')) beats.push('R15');
    }
    // the director's event queue plays them one at a time
    this.later(() => beats.forEach((r) => react(r)), 700);

    const stopIdle = startIdleLife({
      paused: () => ctx.covered() || this.hidden,
      asleep: () => actors.mine.asleep && actors.partner.asleep,
      night: ctx.night,
      scores: () => [ctx.view().people.A.score, ctx.view().people.B.score],
      treeShake: (id) => {
        const v = ctx.view();
        this.shakeN[id === 'mine' ? v.me : v.partner]++;
      }
    });

    // Balloon present (A8: a bit more often): day only, first after 45 s on the island, then every
    // 4 min, at most 3 per session.
    const balloonTry = (ms: number) =>
      this.later(() => {
        const n = Number(sessionStorage.getItem('if-balloon') ?? 0);
        if (n >= 3) return;
        if (ctx.day() && !ctx.covered() && !this.hidden && !reducedMotion() && !this.balloon) {
          sessionStorage.setItem('if-balloon', String(n + 1));
          this.balloon = true;
          balloonTry(240_000);
        } else balloonTry(30_000);
      }, ms);
    balloonTry(45_000);

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
