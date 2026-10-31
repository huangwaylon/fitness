<script lang="ts">
  // Island care (docs/design.md "Island care"), after NH: weeds sprout on the lawn over the day (one every 30–60
  // minutes, the newest three); a tap pulls one (it pops out of the ground with a puff of earth). The rock by the hedge
  // answers a tap with a clonk (it jolts), 1 in 4 a sparkle, 1 in 8 a pill bug or a centipede crawls out from under it.
  // (Watering a flower and the next day's hybrid live with the flower beds: SceneTaps, FlowerBeds.) No ベル, no find.
  // The weeds derive from the Tokyo date (care.ts), so both phones broadly see the same; what this phone pulled is its
  // own (sceneDay.ts). SceneTaps mounts this inside the stage and asks it about each tap after the finds (`tap`).
  // Cheap: static art; one-shot Web Animations / CSS on a tap; the clock is the scene's minute tick.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { jst, minuteNow, reducedMotion } from '#lib/time/clock.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { ISLAND_SEED, digSpots, findArt } from './beach.ts';
  import { ROCK, rockTap, weedsAt, type Weed } from './care.ts';
  import { take, takenOn } from './sceneDay.ts';

  interface Props {
    scene?: HTMLElement;
    enabled: () => boolean;
    /** A bug crawls out from under the rock (Critters). */
    rockBug?: (x: number, y: number) => void;
  }
  let { scene, enabled, rockBug }: Props = $props();

  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  const seed = ((import.meta.env.DEV || q.has('demo')) && q.get('seed')) || ISLAND_SEED;
  const U = (n: number) => `calc(${n.toFixed(1)} * var(--su))`;

  let pulled = $state(0);
  const clock = $derived(minuteNow());
  const date = $derived(localDateAt(clock.getTime()));
  const weeds = $derived.by<Weed[]>(() => {
    void pulled;
    const { hour, minute } = jst(clock);
    const gone = takenOn(date);
    const dug = new Set(digSpots(date, gone, seed).map((s) => `${s.x},${s.y}`));
    return weedsAt(date, (hour * 60 + minute) * 60_000, seed, dug).filter((w) => !gone.has(w.uid));
  });
  /** Only where this screen's controls leave room (measured). */
  let shown = $state<Weed[]>([]);
  $effect(() => {
    const list = weeds, g = stageGeo(scene);
    // flat on the lawn: clear of the controls themselves (their 6px tap padding may run over a tuft)
    const keep = g ? guardsU(g, -5 * g.k) : [];
    shown = g ? list.filter((w) => clearAt(keep, w.x, w.y - 5, 6, 5)) : [];
  });

  interface Fx { n: number; kind: 'pull' | 'spark'; x: number; y: number; flip?: boolean }
  let fx = $state<Fx[]>([]);
  let seq = 0;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  function spawn(f: Omit<Fx, 'n'>, ms: number) {
    const n = ++seq;
    fx = [...fx.slice(-2), { ...f, n }];
    const id = setTimeout(() => {
      timers.delete(id);
      fx = fx.filter((x) => x.n !== n);
    }, ms);
    timers.add(id);
  }
  $effect(() => () => timers.forEach(clearTimeout));
  let rockEl = $state<HTMLElement>();

  function pull(w: Weed) {
    take(date, w.uid);
    pulled++;
    sceneSfx('weed');
    if (!reducedMotion()) spawn({ kind: 'pull', x: w.x, y: w.y, flip: w.flip }, 700);
  }
  function hitRock() {
    const what = rockTap(Math.random);
    sceneSfx('clonk');
    if (!reducedMotion())
      rockEl?.animate([{ transform: 'none' }, { transform: 'translateX(-1.5px)', offset: 0.2 }, { transform: 'translateX(1.5px)', offset: 0.45 }, { transform: 'translateX(-.8px)', offset: 0.7 }, { transform: 'none' }], { duration: 320, easing: 'ease-out' });
    if (what === 'sparkle') {
      spawn({ kind: 'spark', x: ROCK.x + 6, y: ROCK.y - ROCK.h }, 800);
      sceneSfx('glint');
    } else if (what === 'bug') rockBug?.(ROCK.x, ROCK.y);
  }

  /** A tap on the scene (client px), after the finds: true when the care took it. Reach: a 44px target. */
  export function tap(px: number, py: number): boolean {
    const g = stageGeo(scene);
    if (!g || !enabled()) return false;
    const x = (px - g.r.left) * g.k, y = (py - g.r.top) * g.k, reach = 22 * g.k;
    const w = shown.map((w) => ({ w, d: Math.hypot(w.x - x, w.y - 4 - y) })).filter((h) => h.d <= reach).sort((a, b) => a.d - b.d)[0];
    if (w) return (pull(w.w), true);
    if (Math.hypot(ROCK.x - x, ROCK.y - ROCK.h / 2 - y) <= Math.max(reach, ROCK.h)) return (hitRock(), true);
    return false;
  }
</script>

<div class="care" aria-hidden="true">
  <span class="item rock" data-care="rock" style:translate="{U(ROCK.x)} {U(ROCK.y)}">
    <span bind:this={rockEl}><OfficialArt key={findArt('rock')} size={U(ROCK.h)} /></span>
  </span>
  {#each shown as w (w.uid)}
    <span class="item weed" class:flip={w.flip} data-care="weed" style:translate="{U(w.x)} {U(w.y)}">{@render tuft()}</span>
  {/each}
  {#each fx as f (f.n)}
    <span class="item fx-{f.kind}" class:flip={f.flip} style:translate="{U(f.x)} {U(f.y)}">
      {#if f.kind === 'pull'}
        <span class="up">{@render tuft()}</span>
        <i class="clod" style:--dx="-1"></i><i class="clod" style:--dx="1"></i>
      {:else}
        <svg class="glint" viewBox="0 0 24 24"><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" /></svg>
      {/if}
    </span>
  {/each}
</div>

<!-- NH's weeds: a bright tuft of blades, a darker one behind -->
{#snippet tuft()}
  <svg viewBox="-8 -11 16 12"><path class="back" d="M-1 0 C-2 -4 -5 -6 -7 -7 C-4 -6 -2 -4 -1 0 Z M1 0 C2 -3 4 -5 6.5 -5.5 C4 -4 2.5 -2 1 0 Z" />
    <path class="front" d="M0 0 C-1 -4 -3 -7 -5 -9 C-2 -7 -.6 -4 0 0 Z M0 0 C0 -5 1 -8 2 -10.5 C2 -6 1.5 -3 0 0 Z M0 0 C1 -3 3 -5 5.5 -7 C3.5 -4.5 2 -2 0 0 Z" /></svg>
{/snippet}

<style>
  /* on the lawn in front of the hedge (z 20) and behind the trees (30), the beds and everyone */
  .care { position: absolute; inset: 0; z-index: 25; pointer-events: none; --su: calc(100cqw / 390); }
  .item { position: absolute; left: 0; top: 0; width: 0; height: 0; }
  .item > * { position: absolute; left: 0; top: 0; line-height: 0; }
  .rock > :global(*) { translate: -50% -92%; filter: drop-shadow(0 2px 1px rgba(60, 70, 40, .3)); }
  .rock :global(.official) { max-width: none; }
  .weed svg, .up svg { width: calc(13 * var(--su)); translate: -50% -92%; overflow: visible; }
  .flip svg { scale: -1 1; }
  .front { fill: #5FC14A; } .back { fill: #3F9A3A; }
  /* pulled: the tuft pops up and tumbles away, two clods of earth fly */
  .up { animation: pull .65s cubic-bezier(.3, .7, .4, 1) both; }
  @keyframes pull {
    0% { transform: translate(0, 0) rotate(0); } 30% { transform: translate(0, calc(-12 * var(--su))) rotate(-10deg); opacity: 1; }
    100% { transform: translate(calc(10 * var(--su)), calc(-4 * var(--su))) rotate(70deg); opacity: 0; }
  }
  .clod {
    display: block; width: calc(3.5 * var(--su)); height: calc(3 * var(--su)); border-radius: 50%; background: #8A6238;
    animation: clod .5s cubic-bezier(.3, .8, .6, 1) both;
  }
  @keyframes clod {
    0% { transform: translate(0, 0); opacity: 0; } 15% { opacity: 1; }
    50% { transform: translate(calc(var(--dx) * 6 * var(--su)), calc(-8 * var(--su))); }
    100% { transform: translate(calc(var(--dx) * 10 * var(--su)), calc(1 * var(--su))); opacity: 0; }
  }
  .glint { width: calc(11 * var(--su)); translate: -50% -50%; fill: #FFF8D8; overflow: visible; animation: twinkle .75s ease-out both; }
  @keyframes twinkle {
    0% { transform: scale(0) rotate(0); opacity: 0; } 35% { transform: scale(1.1) rotate(45deg); opacity: 1; }
    100% { transform: scale(0) rotate(90deg); opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) { .up, .clod, .glint { animation-name: none; } }
</style>
