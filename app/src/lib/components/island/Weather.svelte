<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { WET, type Sky } from './weather.ts';
  // The weather on the island (design.md "Weather"; the day's weather: weatherNow.svelte.ts, weather.ts).
  // Two placements, each cheap: `sky` (after the sky, behind the island): the overcast over the sky (a cloudy day's at
  // about half), the rainbow after
  // a downpour clears (16:00–17:00, brightest at half past, now and then double) and the aurora on a winter night;
  // `stage` (inside the stage, the whole viewport, fixed while the island scrolls under it: over the time-of-day tint
  // and every world thing, under the scenery taps and every control): the wet day's darker tint over the ground (from
  // the horizon down) and the morning fog (a haze and two drifting banks), over sky and ground. Screen space, never
  // bent by the log. Transform and opacity only; paused with the scene (data-paused / data-covered). Nothing to tap.
  // The rain and the snow are the 3D island's, in the world (world3d/precip.ts), with the same fade.
  // A change of sky while the island is on screen (the real weather's hour turning) fades: the grey sky and its tint
  // come in and go out over a minute (a CSS opacity transition, nothing per frame); from one grey sky to another the
  // layers change at once. The sky the page opens to is there at once.
  import { weather } from './weatherNow.svelte.ts';
  import { minuteNow } from '#lib/time/clock.ts';

  let { where }: { where: 'sky' | 'stage' } = $props();
  /** The fades' length (ms). */
  const FADE_MS = 60_000;
  /** A first grey sky this long into the page's life came with a change (the lazy chunk loaded for it): it fades in. */
  const OPENING_MS = 20_000;
  /** The overcast's strength by sky. */
  const OVERCAST: Record<Exclude<Sky, 'clear'>, number> = { cloudy: 0.5, rain: 0.94, heavy: 0.95, snow: 0.9 };
  const late = typeof performance !== 'undefined' && performance.now() > OPENING_MS && weather.sky !== 'clear';
  /** The sky whose layers are drawn (it stays through a fade out) and how far in they are (0 … 1). */
  let shown = $state<Sky>(weather.sky);
  let level = $state(late || weather.sky === 'clear' ? 0 : 1);
  let fading = $state(late);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let raf = 0;
  /** Fade the layers in from nothing (two frames: the 0 drawn first, so the transition runs). */
  const fadeIn = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => (raf = requestAnimationFrame(() => (level = 1))));
  };
  if (late) fadeIn();
  $effect(() => {
    const s = weather.sky;
    untrack(() => {
      if (s === shown && level === (s === 'clear' ? 0 : 1)) return;
      clearTimeout(timer);
      fading = true;
      if (s === 'clear') {
        cancelAnimationFrame(raf);
        level = 0;
        timer = setTimeout(() => (shown = 'clear'), FADE_MS);
      } else if (shown === 'clear' || level === 0) {
        shown = s;
        level = 0;
        fadeIn();
      } else shown = s;
    });
  });
  onDestroy(() => {
    clearTimeout(timer);
    cancelAnimationFrame(raf);
  });
  const sky = $derived(shown);
  // the rainbow builds to its peak 30 minutes into the hour and fades by the next (NH)
  const bow = $derived.by(() => {
    if (!weather.rainbow) return 0;
    const m = minuteNow().getMinutes();
    return 0.35 + 0.65 * (1 - Math.abs(m - 30) / 30);
  });
  const BANDS = ['#FF6B6B', '#FFA94D', '#FFE066', '#8CE99A', '#74C0FC', '#9775FA'];
</script>

{#if where === 'sky'}
  {#if weather.aurora}
    <div class="aurora" aria-hidden="true"><i class="a1"></i><i class="a2"></i><i class="a3"></i></div>
  {/if}
  {#if weather.rainbow}
    <svg class="rainbow" viewBox="0 0 200 100" preserveAspectRatio="xMidYMax meet" style:opacity={bow} aria-hidden="true" data-rainbow={weather.rainbow}>
      {#each BANDS as c, i (i)}<path d="M{14 + i * 4} 100 A{86 - i * 4} {86 - i * 4} 0 0 1 {186 - i * 4} 100" stroke={c} />{/each}
      {#if weather.rainbow === 2}
        <g class="second">{#each BANDS.toReversed() as c, i (i)}<path d="M{-6 + i * 3} 100 A{106 - i * 3} {106 - i * 3} 0 0 1 {206 - i * 3} 100" stroke={c} />{/each}</g>
      {/if}
    </svg>
  {/if}
  {#if sky !== 'clear'}<div class="overcast" class:fading data-sky={sky} aria-hidden="true" style:opacity={OVERCAST[sky] * level}></div>{/if}
{:else}
  {#if sky !== 'clear'}
    <div class="wet" class:fading data-sky={sky} aria-hidden="true" style:background={WET[sky][0]} style:opacity={WET[sky][1] * level}></div>
  {/if}
  {#if weather.fog}
    <div class="fog" aria-hidden="true"><i class="bank b1"></i><i class="bank b2"></i></div>
  {/if}
{/if}

<style>
  /* ---- the sky (the stage's backdrop, under the world: the sky band's height) ---- */
  .overcast {
    position: absolute; inset: 0 0 auto 0; height: var(--sky-h); z-index: 0; pointer-events: none;
    background: linear-gradient(180deg, var(--oc-top), var(--oc-hz));
    --oc-top: #9AA5B4; --oc-hz: #C9D0D9;
  }
  .overcast[data-sky='cloudy'] { --oc-top: #A9B2BF; --oc-hz: #D3D8DF; }
  .overcast[data-sky='heavy'] { --oc-top: #7E8999; --oc-hz: #AEB7C3; }
  .overcast[data-sky='snow'] { --oc-top: #B7C1CE; --oc-hz: #E2E7EE; }
  /* a change of sky on screen: in and out over a minute (FADE_MS) */
  .fading { transition: opacity 60s linear; }
  :global([data-tod='dusk']) .overcast { --oc-top: #8E8A9E; --oc-hz: #C2B9BE; }
  :global([data-tod='dawn']) .overcast { --oc-top: #A9A8BA; --oc-hz: #D6D2D8; }
  :global([data-tod='night']) .overcast { --oc-top: #2E3550; --oc-hz: #4E5674; }

  .rainbow {
    position: absolute; z-index: 0; pointer-events: none; right: -8%; width: 84%; top: calc(var(--sky-h) * .2); height: calc(var(--sky-h) * .8 + 2px);
    fill: none; stroke-width: 4.2; stroke-linecap: butt; mix-blend-mode: screen; overflow: visible;
    transition: opacity 60s linear;
  }
  .rainbow path { opacity: .5; }
  .rainbow .second path { opacity: .28; stroke-width: 2.6; }

  /* curtains of light: green at their foot, violet at their top, faded at the ends; they sway and breathe */
  .aurora { position: absolute; inset: 0 0 auto 0; height: var(--sky-h); z-index: 0; pointer-events: none; overflow: hidden; }
  .aurora i {
    position: absolute; top: 2%; height: 72%; border-radius: 45% 45% 50% 50% / 30% 30% 70% 70%;
    background: linear-gradient(0deg, #6BFFB000 0%, #6BFFB0e0 22%, #5EE6C9a0 50%, #A98BFF70 78%, #A98BFF00 100%);
    -webkit-mask: linear-gradient(90deg, #0000, #000 25%, #000 75%, #0000); mask: linear-gradient(90deg, #0000, #000 25%, #000 75%, #0000);
    animation: shimmer 9s ease-in-out infinite alternate; will-change: transform, opacity; transform-origin: 50% 100%;
  }
  .a1 { left: -12%; width: 64%; rotate: -10deg; }
  .a2 { left: 26%; width: 56%; top: 8%; height: 60%; rotate: 6deg; animation-duration: 12s; animation-delay: -4s; }
  .a3 { left: 58%; width: 54%; rotate: 14deg; animation-duration: 15s; animation-delay: -8s; }
  @keyframes shimmer {
    from { transform: translateX(-5%) scaleY(.85) skewX(-10deg); opacity: .35; }
    to { transform: translateX(5%) scaleY(1.08) skewX(10deg); opacity: .8; }
  }

  /* ---- the stage (the whole viewport; z over the time-of-day tint, under the scenery taps and every control: the
     stage's own tokens, IslandScene) ---- */
  .wet, .fog { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  /* the wet day's darkening (weather.ts WET): on the ground like the time-of-day tint, fading out up the sky (no edge);
     the sprites take it in their own filter (IslandScene --tod-filter) */
  .wet { z-index: var(--z-ground-tint); mix-blend-mode: multiply; -webkit-mask-image: var(--tint-mask); mask-image: var(--tint-mask); }
  /* NH's soft morning haze (the user: "morning fog is too strong"): the far end (the top of the view) softened, the
     near and middle island clear; two light banks drifting over the far half */
  .fog { z-index: calc(var(--z-tint) + 1); background: linear-gradient(180deg, #F4F6F8c0 0%, #F4F6F880 20%, #F4F6F830 42%, #F4F6F800 62%); opacity: .7; }
  .bank {
    position: absolute; width: 90%; height: 26%; border-radius: 50%;
    background: radial-gradient(closest-side, #ffffff70, #ffffff00); animation: drift 38s ease-in-out infinite alternate; will-change: transform;
  }
  .b1 { left: -20%; top: 12%; }
  .b2 { right: -25%; top: 30%; animation-duration: 52s; animation-delay: -20s; }
  @keyframes drift { from { transform: translateX(-12%); } to { transform: translateX(12%); } }

  :global(.if-scene[data-paused]) :is(.bank, .aurora i),
  :global(.if-scene[data-covered]) :is(.bank, .aurora i) { animation-play-state: paused; }
</style>
