<script lang="ts">
  // Balloon present (design.md §S.4), after NH: one round glossy balloon (ours, drawn in NH's soft item style: a
  // top-left highlight, a rim light on the shaded side, a knot) on a thin string, carrying the official present
  // (deco/present). It drifts across the sky on the breeze in 22 s (either way, at a cloud's altitude, in front of
  // the clouds and under the HUD), bobbing ±5px on a 3.6 s sine and leaning ±4°; the present swings under it like a
  // pendulum from the knot, a beat behind, and trails the drift a little. A colour per appearance from NH's balloon
  // palette (1 in 20: gold). No points: a tap only wobbles it. Paused while the page is hidden or covered; reduced
  // motion: none (it ends at once). Night / dawn / dusk: dimmed / warmed like the clouds. The parent mounts it.
  import { onMount } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { reducedMotion } from '#lib/time/clock.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    ondone?: () => void;
  }
  let { ondone }: Props = $props();

  // [body, light, shade, rim] per colour: NH's balloon presents (red, yellow, blue, green, purple, pink) + rare gold.
  const COLOURS = [
    ['#F2555A', '#FF9C8F', '#C2323F', '#FFC2B8'],
    ['#FFD43E', '#FFF0A0', '#E3A51E', '#FFF6C8'],
    ['#4FB2F2', '#A5DDFF', '#2B7ED0', '#C8ECFF'],
    ['#6CCB5C', '#B3EC95', '#3F9B3D', '#D2F5BE'],
    ['#A57EE0', '#D3BAFA', '#7552B8', '#E2D3FF'],
    ['#FF8DBE', '#FFC6DE', '#DF5A97', '#FFDCEA']
  ];
  const GOLD = ['#F2C33F', '#FFEA9A', '#C28A1C', '#FFF4C4'];
  const gold = Math.random() < 0.05;
  const [body, light, shade, rim] = gold ? GOLD : COLOURS[Math.floor(Math.random() * COLOURS.length)];
  // The breeze blows either way; the altitude varies a little (0–0.6 balloon widths under the cloud lane).
  const ltr = Math.random() < 0.5;
  const alt = Math.random() * 0.6;
  const gid = $props.id();

  let fly = $state<HTMLElement | null>(null);
  let wobble = $state(false);

  onMount(() => {
    if (reducedMotion()) ondone?.();
  });
</script>

<div class="fly" class:rtl={!ltr} bind:this={fly} style:--alt={alt}
  onanimationend={(e) => e.target === fly && ondone?.()}>
  <button type="button" class="balloon" aria-label={t('island.balloon')} onclick={() => (wobble = true)}>
    <span class="bob">
      <span class="rig" class:wobble onanimationend={(e) => e.animationName.includes('wobble') && (wobble = false)}>
        <span class="hang">
          <svg class="string" viewBox="0 0 10 30" aria-hidden="true">
            <path d="M5 0 C3.6 7 6.6 12 5.2 19 C4.4 23 5.4 26.5 5 30" fill="none" stroke="#9A8A72" stroke-width=".9"
              stroke-linecap="round" />
          </svg>
          <span class="gift"><OfficialArt key="deco/present" size="100%" /></span>
        </span>
        <svg class="ball" viewBox="0 0 40 44" aria-hidden="true">
          <defs>
            <radialGradient id="{gid}-b" cx=".36" cy=".3" r=".78">
              <stop offset="0" stop-color={light} /><stop offset=".45" stop-color={body} />
              <stop offset="1" stop-color={shade} />
            </radialGradient>
            <clipPath id="{gid}-c"><path d={'M20 1 C30.5 1 36.5 9.5 36.5 18.5 C36.5 28.5 28.5 36.5 20 37.5 C11.5 36.5 3.5 28.5 3.5 18.5 C3.5 9.5 9.5 1 20 1 Z'} /></clipPath>
          </defs>
          <!-- knot: a little pinched tie under the body -->
          <path d="M17.2 41.2 Q20 38.4 22.8 41.2 Q20 42.6 17.2 41.2 Z" fill={shade} />
          <path d="M18.6 36.6 L21.4 36.6 L20.8 39.6 L19.2 39.6 Z" fill={shade} />
          <g clip-path="url(#{gid}-c)">
            <rect width="40" height="40" fill="url(#{gid}-b)" />
            <!-- rim light on the shaded lower right (the sky bouncing back) -->
            <path d="M33.5 15 C36 25 30 34.5 21 36.6 C28.5 33.5 33.2 26 33.5 15 Z" fill={rim} opacity=".7" />
          </g>
          <path d={'M20 1 C30.5 1 36.5 9.5 36.5 18.5 C36.5 28.5 28.5 36.5 20 37.5 C11.5 36.5 3.5 28.5 3.5 18.5 C3.5 9.5 9.5 1 20 1 Z'}
            fill="none" stroke={shade} stroke-width=".9" opacity=".55" />
          <!-- gloss: one soft window highlight + a pin-point -->
          <ellipse cx="12.6" cy="11.2" rx="3.4" ry="5.6" fill="#fff" opacity=".78" transform="rotate(28 12.6 11.2)" />
          <circle cx="16.4" cy="6.4" r="1.25" fill="#fff" opacity=".85" />
          {#if gold}
            <path d="M29 7 l.9 2.3 2.3 .9 -2.3 .9 -.9 2.3 -.9 -2.3 -2.3 -.9 2.3 -.9 Z" fill="#fff" class="spark" />
          {/if}
        </svg>
      </span>
    </span>
  </button>
</div>

<style>
  /* the balloon's size: everything below is in em (the balloon's width) */
  .fly {
    --bw: clamp(22px, 7.6cqw, 34px);
    /* C1's cloud lane (just under the HUD ribbon) + a little, but the present always clears the horizon bank */
    position: absolute; z-index: 3; left: 0; font-size: var(--bw);
    top: min(calc(max(var(--cloud-lane, 100px), 26%) + var(--alt) * 1em), calc(100cqh - 2.55em));
    animation: across 22s linear both; will-change: transform;
  }
  /* short skies (Clouds.svelte's rule: under 190px there's no room under the ribbon): a smaller balloon in the strip
     above the HUD ribbon (which sits 56px down the band), still behind the HUD */
  @container sky (max-height: 190px) { .fly { --bw: 20px; top: 2px; } }
  .fly.rtl { animation-name: across-rtl; }
  @keyframes across { from { transform: translateX(-1.6em); } to { transform: translateX(calc(100cqw + .4em)); } }
  @keyframes across-rtl { from { transform: translateX(calc(100cqw + .4em)); } to { transform: translateX(-1.6em); } }
  .balloon {
    appearance: none; border: 0; background: none; padding: 0; cursor: pointer; display: block;
    width: max(44px, 1.3em); height: 2.6em; margin-left: calc((1em - max(44px, 1.3em)) / 2);
    -webkit-tap-highlight-color: transparent;
  }
  .bob, .rig { display: block; position: relative; width: 1em; height: 2.4em; margin: 0 auto; }
  /* the bob: a slow sine up and down at a steady altitude */
  .bob { animation: bob 1.8s cubic-bezier(.37, 0, .63, 1) infinite alternate; }
  @keyframes bob { from { transform: translateY(-.14em); } to { transform: translateY(.14em); } }
  /* the lean: the whole balloon rocks about its knot (5.2 s, out of step with the bob, so it never looks looped) */
  .rig { transform-origin: 50% .94em; animation: lean 5.2s cubic-bezier(.37, 0, .63, 1) infinite; }
  @keyframes lean { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
  .ball { position: absolute; left: 0; top: 0; width: 1em; height: 1.1em; overflow: visible; }
  /* the present: a pendulum from the knot. Nested in the lean, so this swing (5.4°, 1.1 s ahead) nets a 6° swing
     in the world 0.9 s behind the balloon's lean; it also trails the drift by 5° */
  .hang {
    --trail: 5deg;
    position: absolute; left: 50%; top: .98em; width: .72em; margin-left: -.36em;
    transform-origin: 50% 0; animation: swing 5.2s cubic-bezier(.37, 0, .63, 1) -1.1s infinite;
  }
  .rtl .hang { --trail: -5deg; }
  @keyframes swing {
    0%, 100% { transform: rotate(calc(var(--trail) + 5.4deg)); }
    50% { transform: rotate(calc(var(--trail) - 5.4deg)); }
  }
  .string { display: block; width: .25em; height: .62em; margin: 0 auto; overflow: visible; }
  .gift { display: block; height: .72em; margin-top: -.08em; line-height: 0; }
  .gift :global(.official) { filter: drop-shadow(0 .02em .02em rgba(90, 60, 30, .25)); }
  .spark { transform-origin: 30px 9.5px; animation: spark 1.6s ease-in-out infinite alternate; }
  @keyframes spark { from { opacity: .2; transform: scale(.6); } to { opacity: 1; transform: none; } }
  /* a tap: a soft rubbery wobble, nothing more */
  .rig.wobble { animation: wobble .7s cubic-bezier(.3, 1.4, .5, 1), lean 5.2s cubic-bezier(.37, 0, .63, 1) .7s infinite; }
  @keyframes wobble {
    0% { transform: none; } 25% { transform: rotate(-9deg) scale(1.06, .95); } 50% { transform: rotate(7deg) scale(.97, 1.03); }
    75% { transform: rotate(-3deg); } 100% { transform: rotate(-4deg); }
  }
  /* time of day: dim and cool at night (like the clouds), warm at dawn / dusk */
  :global(.if-scene[data-tod='night']) .fly { filter: brightness(.76) saturate(.78) contrast(.95); }
  :global(.if-scene[data-tod='dusk']) .fly, :global(.if-scene[data-tod='dawn']) .fly { filter: sepia(.12) saturate(1.05); }
  /* a sheet or overlay over the scene: hold still (the page-hidden pause is global, tokens.css) */
  :global(.if-scene[data-covered]) .fly, :global(.if-scene[data-covered]) .fly * { animation-play-state: paused !important; }
  @media (prefers-reduced-motion: reduce) { .fly { display: none; } }
</style>
