<script lang="ts">
  import { WET } from './weather.ts';
  // The weather on the island (design.md "Weather"; the day's weather: weatherNow.svelte.ts, weather.ts).
  // Two placements, each cheap: `sky` (after the sky, behind the island): the overcast over the sky, the rainbow after
  // a downpour clears (16:00–17:00, brightest at half past, now and then double) and the aurora on a winter night;
  // `stage` (inside the stage, the whole viewport, fixed while the island scrolls under it: over the time-of-day tint
  // and every world thing, under the scenery taps and every control): the wet day's darker tint over the ground (from
  // the horizon down), the rain (ONE tiled layer of streaks moving by transform, denser and faster in a downpour), the
  // snow (two tiled layers of soft flakes, slow) and the morning fog (a haze and two drifting banks), over sky and
  // ground. Screen space, never bent by the log. Transform and opacity only; paused with the scene (data-paused /
  // data-covered). Nothing to tap.
  import { weather } from './weatherNow.svelte.ts';
  import { minuteNow } from '#lib/time/clock.ts';

  let { where }: { where: 'sky' | 'stage' } = $props();
  const sky = $derived(weather.sky);
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
  {#if sky !== 'clear'}<div class="overcast" data-sky={sky} aria-hidden="true"></div>{/if}
{:else}
  {#if sky !== 'clear'}
    <div class="wet" data-sky={sky} aria-hidden="true" style:background={WET[sky][0]} style:opacity={WET[sky][1]}></div>
    <div class="precip" aria-hidden="true">
      {#if sky === 'snow'}
        <i class="snow far"></i><i class="snow near"></i>
      {:else}
        <i class="rain" class:heavy={sky === 'heavy'}></i>
      {/if}
    </div>
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
    --oc-top: #9AA5B4; --oc-hz: #C9D0D9; opacity: .94;
  }
  .overcast[data-sky='heavy'] { --oc-top: #7E8999; --oc-hz: #AEB7C3; opacity: .95; }
  .overcast[data-sky='snow'] { --oc-top: #B7C1CE; --oc-hz: #E2E7EE; opacity: .9; }
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
  .wet, .precip, .fog { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  /* the wet day's darkening (weather.ts WET): on the ground like the time-of-day tint, fading out up the sky (no edge);
     the sprites take it in their own filter (IslandScene --tod-filter) */
  .wet { z-index: var(--z-ground-tint); mix-blend-mode: multiply; -webkit-mask-image: var(--tint-mask); mask-image: var(--tint-mask); }
  .precip { z-index: calc(var(--z-tint) + 1); }
  /* one tile of streaks, moved down one tile per loop (seamless) */
  .rain {
    position: absolute; left: 0; right: 0; top: -160px; bottom: 0; will-change: transform;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='160' stroke='%23fff' stroke-linecap='round' stroke-opacity='.42' stroke-width='1.2'%3E%3Cpath d='M12 6l-3 16M47 40l-3 16M88 18l-3 16M30 92l-3 16M70 76l-3 16M108 104l-3 16M18 132l-3 16M58 128l-3 16M96 150l-2 10M100 60l-3 16'/%3E%3C/svg%3E") 0 0 / 120px 160px;
    animation: rain .5s linear infinite;
  }
  .rain.heavy {
    background:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='160' stroke='%23fff' stroke-linecap='round' stroke-opacity='.6' stroke-width='1.3'%3E%3Cpath d='M12 6l-4 22M47 40l-4 22M88 18l-4 22M30 92l-4 22M70 76l-4 22M108 104l-4 22M18 132l-4 22M58 128l-4 22M100 60l-4 22M80 120l-4 22M40 10l-4 22M114 4l-4 22M4 70l-4 22'/%3E%3C/svg%3E") 0 0 / 120px 160px;
    animation-duration: .36s;
  }
  @keyframes rain { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, 160px, 0); } }
  .snow {
    position: absolute; left: 0; right: 0; top: -200px; bottom: 0; will-change: transform;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' fill='%23fff'%3E%3Ccircle cx='20' cy='30' r='2.2'/%3E%3Ccircle cx='90' cy='12' r='1.6'/%3E%3Ccircle cx='150' cy='60' r='2.4'/%3E%3Ccircle cx='60' cy='100' r='1.8'/%3E%3Ccircle cx='180' cy='140' r='2'/%3E%3Ccircle cx='120' cy='170' r='1.6'/%3E%3Ccircle cx='30' cy='160' r='2.3'/%3E%3C/svg%3E") 0 0 / 200px 200px;
    opacity: .9; animation: snow 9s linear infinite;
  }
  .snow.far { background-size: 140px 140px; top: -140px; opacity: .6; animation: snow-far 13s linear infinite; }
  @keyframes snow { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, 200px, 0); } }
  @keyframes snow-far { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, 140px, 0); } }

  .fog { z-index: calc(var(--z-tint) + 1); background: linear-gradient(180deg, #F4F6F8 0%, #F4F6F8b0 40%, #F4F6F888 100%); opacity: .75; }
  .bank {
    position: absolute; width: 90%; height: 40%; border-radius: 50%;
    background: radial-gradient(closest-side, #ffffffd0, #ffffff00); animation: drift 38s ease-in-out infinite alternate; will-change: transform;
  }
  .b1 { left: -20%; top: 30%; }
  .b2 { right: -25%; top: 62%; animation-duration: 52s; animation-delay: -20s; }
  @keyframes drift { from { transform: translateX(-12%); } to { transform: translateX(12%); } }

  :global(.if-scene[data-paused]) :is(.rain, .snow, .bank, .aurora i),
  :global(.if-scene[data-covered]) :is(.rain, .snow, .bank, .aurora i) { animation-play-state: paused; }
</style>
