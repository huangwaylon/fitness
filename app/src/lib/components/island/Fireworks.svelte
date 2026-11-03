<script lang="ts">
  // Fireworks (docs/design.md "Fireworks"), after NH: on August Sundays from 7 pm and at New Year (fireworks.ts), a
  // shell rises from behind the island over the sea every few seconds and bursts in the sky: a peony, a ring, a heart,
  // a star, a gold willow, now and then a little pixel pattern like NH's custom-design fireworks. Plus our own volley the
  // evening both of us meet all four goals (once a day per phone). Every burst opens where its whole circle is inside the
  // sky and clear of every control (the HUD's dumbbell, bowl and leaf menu, the sync chip); a tap in the sky during a show sends one more there
  // (SceneTaps asks `tap`). Now and then a villager cheers. A soft whistle and boom (world cues, low).
  // Its layer: fixed on screen, the scene's width from under the status bar down a little past the horizon (IslandScene's
  // --horizon-y; the far island and the open sea behind it, where NH's shells rise from, so a short sky under the HUD
  // still has room); over the stage and its tint (they're lights), under the HUD.
  // Cheap: a burst is ~20–30 sparks, each a dot with ONE transform/opacity keyframe animation (on the compositor), gone
  // after 2.7 s; at most 4 bursts at once; between bursts nothing but one timer. Paused with the scene (data-paused), and
  // no new ones while covered or hidden. In its layer's px.
  //   ?fireworks (dev or ?demo): a show now, whatever the date (the e2e's hook).
  import { timers } from './timers.ts';
  import { hookFlag } from './devHooks.ts';
  import { untrack } from 'svelte';
  import { dayKey, jst, minuteNow } from '#lib/time/clock.ts';
  import { localKV, readJson, SCENE, writeJson } from '#lib/sync/storage.ts';
  import { uiBoxes } from './placement.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { PAIR_ODDS, burstPlan, burstSpot, celebrationDue, isMidnight, nextBurstMs, showAt, volley, type Shape, type Spark } from './fireworks.ts';

  interface Props {
    /** Live, not covered by a sheet, page visible. */
    enabled: () => boolean;
    /** A show regardless of the date (the dev gallery's toggle). */
    forced?: boolean;
    /** Both of us met all four goals today (our celebration's volley). */
    allMet?: boolean;
    /** A villager cheers (IslandScene: a hop and a glad mark). */
    cheer?: () => void;
  }
  let { enabled, forced = false, allMet = false, cheer }: Props = $props();

  const pinned = hookFlag('fireworks');
  const rand = Math.random;

  const clock = $derived(minuteNow());
  const t = $derived(jst(clock));
  const show = $derived(forced || pinned ? 'show' : showAt(t.month, t.day, t.weekday, t.hour));
  const date = $derived(dayKey(clock));

  interface Live { id: number; x: number; y: number; rad: number; rise: number; shape: Shape; sparks: Spark[] }
  let bursts = $state<Live[]>([]);
  let band = $state<HTMLElement>();
  let seq = 0;
  let lastCheer = 0;
  const RISE_MS = 700;
  const LIFE_MS = 2700;

  const { later, clear } = timers();
  $effect(() => clear);

  /** Send one up: to a free spot of the sky (or `at`, client px, a tap). False when there's no room. */
  function launch(at?: { x: number; y: number }): boolean {
    const el = band;
    if (!el) return false;
    const b = el.getBoundingClientRect();
    const sky = { x0: 4, x1: b.width - 4, y0: 4, y1: b.height - 6 };
    const avoid = uiBoxes().map((g) => ({ x0: g.x0 - b.left, x1: g.x1 - b.left, y0: g.y0 - b.top, y1: g.y1 - b.top }));
    const spot = burstSpot(sky, avoid, rand, at && { x: at.x - b.left, y: at.y - b.top });
    if (!spot) return false;
    const plan = burstPlan(rand);
    const id = ++seq;
    bursts = [...bursts.slice(-3), { id, ...spot, rise: b.height - spot.y, shape: plan.shape, sparks: plan.sparks }];
    sceneSfx('launch');
    later(() => {
      sceneSfx('firework');
      if (cheer && performance.now() - lastCheer > 6000 && rand() < 0.3) {
        lastCheer = performance.now();
        cheer();
      }
    }, RISE_MS);
    later(() => (bursts = bursts.filter((x) => x.id !== id)), LIFE_MS);
    return true;
  }
  const salvo = (times: number[]) => times.forEach((ms) => later(() => enabled() && launch(), ms));

  // The show: a burst every few seconds (now and then two), while the island is on screen.
  $effect(() => {
    const s = show;
    if (!s || !enabled()) return;
    let id: ReturnType<typeof setTimeout>;
    const arm = (ms: number) => {
      id = setTimeout(() => {
        launch();
        if (s === 'show' && rand() * PAIR_ODDS < 1) later(() => enabled() && launch(), 350);
        arm(nextBurstMs(s, rand));
      }, ms);
    };
    arm(800);
    return () => clearTimeout(id);
  });

  // New Year's midnight: a volley as the clock strikes (once).
  let midnight = '';
  $effect(() => {
    if (!isMidnight(t.month, t.day, t.hour, t.minute) || !enabled() || midnight === date) return;
    midnight = date;
    salvo(volley(rand, 8));
  });

  // Our celebration: both of us met all four goals today: a short volley, from 18:00, once a day on this phone.
  $effect(() => {
    if (!enabled() || !celebrationDue(allMet, readJson<string>(localKV(), SCENE.fireworks), date, t.hour)) return;
    untrack(() => {
      writeJson(localKV(), SCENE.fireworks, date);
      later(() => salvo(volley(rand)), 1200);
    });
  });

  /** A tap in the sky (client px) during a show: one more burst there. True when it went up. */
  export function tap(px: number, py: number): boolean {
    return !!show && enabled() && launch({ x: px, y: py });
  }
</script>

<div class="fireworks" bind:this={band} aria-hidden="true">
  {#each bursts as b (b.id)}
    <span class="burst {b.shape}" data-firework={b.shape} style:left="{b.x}px" style:top="{b.y}px" style:--rad={b.rad} style:--rise="{b.rise}px">
      <b class="shell"></b>
      <i class="flash"></i>
      {#each b.sparks as s, k (k)}<i class="spark" style:--x={s.x} style:--y={s.y} style:--c={s.c}></i>{/each}
    </span>
  {/each}
</div>

<style>
  /* the fixed sky and a little of the far ground below the horizon (in the scene: --horizon-y; a fifth of the ground's
     height), above the stage (they're lights: not under the night tint), under the HUD (outside the scene) */
  .fireworks {
    position: absolute; left: 0; right: 0; top: var(--safe-top); z-index: calc(var(--z-stage) + 1); pointer-events: none; overflow: hidden;
    height: calc(var(--horizon-y) + (100% - var(--horizon-y)) * .2 - var(--safe-top));
  }
  .burst { position: absolute; width: 0; height: 0; }
  .burst > * { position: absolute; left: 0; top: 0; }
  /* the shell rising from the horizon behind the island, a little trail, gone as it bursts */
  .shell {
    width: 3px; height: 14px; margin: -7px 0 0 -1.5px; border-radius: 2px;
    background: linear-gradient(to top, rgba(255, 236, 190, 0), rgba(255, 240, 200, .95));
    animation: rise 700ms cubic-bezier(.2, .6, .4, 1) both;
  }
  @keyframes rise { from { transform: translateY(var(--rise)); opacity: .9; } 85% { opacity: 1; } to { transform: translateY(0); opacity: 0; } }
  /* the burst's flash */
  .flash {
    width: 40px; height: 40px; margin: -20px; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(255, 250, 225, .9), rgba(255, 240, 200, 0));
    animation: flash .5s ease-out 700ms both;
  }
  @keyframes flash { from { transform: scale(.2); opacity: 0; } 30% { opacity: 1; } to { transform: scale(calc(var(--rad) / 18)); opacity: 0; } }
  /* a spark: from the centre out to its place, then it drifts down and fades (one animation, transform + opacity) */
  .spark {
    width: 4px; height: 4px; margin: -2px; border-radius: 50%; background: var(--c);
    box-shadow: 0 0 4px var(--c);
    animation: spark 1.9s cubic-bezier(.15, .7, .3, 1) 700ms both;
  }
  @keyframes spark {
    0% { transform: translate(0, 0) scale(.4); opacity: 0; }
    6% { opacity: 1; }
    45% { transform: translate(calc(var(--x) * var(--rad) * 1px), calc(var(--y) * var(--rad) * 1px)) scale(1); opacity: 1; }
    100% { transform: translate(calc(var(--x) * var(--rad) * 1px), calc(var(--y) * var(--rad) * 1px + 14px)) scale(.5); opacity: 0; }
  }
  /* NH's gold willow: its sparks droop a long way and linger */
  .willow .spark { width: 3px; height: 3px; animation-name: willow; animation-duration: 2s; }
  @keyframes willow {
    0% { transform: translate(0, 0); opacity: 0; } 6% { opacity: 1; }
    40% { transform: translate(calc(var(--x) * var(--rad) * 1px), calc(var(--y) * var(--rad) * 1px)); opacity: 1; }
    100% { transform: translate(calc(var(--x) * var(--rad) * 1.15px), calc(var(--y) * var(--rad) * 1px + 34px)); opacity: 0; }
  }
  /* a pixel pattern pops into place and holds a moment, like NH's custom-design fireworks */
  .pattern .spark { width: 5px; height: 5px; margin: -2.5px; border-radius: 1px; animation-timing-function: cubic-bezier(.3, 1.3, .5, 1); }
</style>
