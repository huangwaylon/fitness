<script lang="ts">
  // Balloon present (design.md "Particles and events"), after NH: one round glossy balloon (ours, drawn in NH's soft item style: a
  // top-left highlight, a rim light on the shaded side, a knot) on a thin string, carrying the official present
  // (deco/present). It drifts across the sky on the breeze in 22 s (either way, in the lane between the ribbon, which
  // sits in the sky band's middle, and the horizon, in front of the clouds; as big as that lane allows, ≤ 34px), bobbing ±5px on a 3.6 s sine and leaning ±4°; the present swings under it like a
  // pendulum from the knot, a beat behind, and trails the drift a little. A colour per appearance from NH's balloon
  // palette (1 in 20: gold). A tap pops it (NH's slingshot shot, here a tap): a "pan!", a puff of confetti in its
  // colours, and the present drops onto the island (SceneTaps.svelte draws the fall: this sends it `island:present`
  // with where the present was). No points, no caption. Paused while the page is hidden or covered; reduced
  // motion: none (it ends at once). Night / dawn / dusk: dimmed / warmed like the clouds. The parent mounts it.
  import { onMount } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { reducedMotion } from '#lib/time/clock.ts';
  import { t } from '#lib/i18n/index.ts';
  import { sceneSfx } from './sceneTaps.ts';

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
  // The breeze blows either way; the altitude varies within whatever room the lane has to spare.
  const ltr = Math.random() < 0.5;
  const alt = Math.random();
  const gid = $props.id();

  let fly = $state<HTMLElement | null>(null);
  let gift = $state<HTMLElement | null>(null);
  let popped = $state(false);
  let gone: ReturnType<typeof setTimeout> | undefined;
  function tap() {
    if (popped || !gift) return;
    const g = gift.getBoundingClientRect();
    popped = true;
    sceneSfx('balloon');
    gift.dispatchEvent(new CustomEvent('island:present', { bubbles: true, detail: { x: g.left + g.width / 2, y: g.top + g.height / 2, size: g.height } }));
    gone = setTimeout(() => ondone?.(), 650);
  }
  // the confetti: eight bits in the balloon's colours and NH's party colours, flung out from the burst
  const BITS = [body, '#FFD84D', light, '#6FCFF6', body, '#FF8DBE', shade, '#8FD16A'];

  onMount(() => {
    // no room under the HUD (the ribbon and, when it shows, its sync chip, 6px clear) or the present would sink past
    // the horizon (a sky too short for even the smallest balloon): no balloon this time
    const hud = document.querySelector('.ribbon-wrap')?.getBoundingClientRect();
    const r = fly?.getBoundingClientRect();
    const band = fly?.parentElement?.getBoundingClientRect();
    const short = !!r && !!band && r.bottom > band.bottom + 8;
    if (reducedMotion() || !r || short || (hud && hud.height && r.top < hud.bottom + 6)) ondone?.();
    return () => clearTimeout(gone);
  });
</script>

<div class="fly" class:rtl={!ltr} class:popped bind:this={fly} style:--alt={alt}
  onanimationend={(e) => e.target === fly && ondone?.()}>
  <button type="button" class="balloon" data-sfx="self" aria-label={t('island.balloon')} onclick={tap}>
    <span class="bob">
      <span class="rig">
        <span class="hang">
          <svg class="string" viewBox="0 0 10 30" aria-hidden="true">
            <path d="M5 0 C3.6 7 6.6 12 5.2 19 C4.4 23 5.4 26.5 5 30" fill="none" stroke="#9A8A72" stroke-width=".9"
              stroke-linecap="round" />
          </svg>
          <span class="gift" bind:this={gift}><OfficialArt key="deco/present" size="100%" /></span>
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
      {#if popped}
        <span class="burst" aria-hidden="true">
          <i class="flash"></i>
          {#each BITS as c, i (i)}<i class="bit" style:--a="{i * 45 + 20}deg" style:--c={c}></i>{/each}
        </span>
      {/if}
    </span>
  </button>
</div>

<style>
  /* the balloon's size: everything below is in em (the balloon's width) */
  .fly {
    /* the lane: from 8px under the ribbon (--hud-top is the screen's, the band starts at the safe area) to the band's
       foot; the balloon with its present (2.6em) as big as that lane holds, between 14px and 34px across, at a
       random height within any room to spare */
    --rb: calc(var(--hud-top) + var(--hit) + var(--lip-h) - var(--safe-top));
    --room: calc(100cqh - var(--rb) - 8px);
    --bw: max(14px, min(clamp(22px, 7.6cqw, 34px), calc(var(--room) / 2.65)));
    position: absolute; z-index: 3; left: 0; font-size: var(--bw);
    top: calc(var(--rb) + 8px + var(--alt) * max(0px, var(--room) - 2.65em));
    animation: across 22s linear both; will-change: transform;
  }
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
  /* popped: the drift holds where it burst, the balloon and its present vanish (the present falls in the stage), a
     flash and the confetti fly out and fade */
  .popped, .popped * { animation-play-state: paused; }
  .popped .rig { visibility: hidden; }
  .balloon:has(.burst) { cursor: default; }
  .burst { position: absolute; left: 50%; top: .55em; width: 0; height: 0; }
  .burst i { position: absolute; animation-play-state: running !important; }
  .flash {
    left: -.6em; top: -.6em; width: 1.2em; height: 1.2em; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(255, 255, 245, .95), rgba(255, 255, 245, 0)); animation: flash .3s ease-out both;
  }
  @keyframes flash { from { transform: scale(.4); opacity: 1; } to { transform: scale(1.3); opacity: 0; } }
  .bit {
    left: -.07em; top: -.05em; width: .14em; height: .1em; border-radius: 1px; background: var(--c);
    animation: bit .6s cubic-bezier(.2, .7, .4, 1) both;
  }
  @keyframes bit {
    from { transform: rotate(var(--a)) translateY(-.15em) rotate(0); opacity: 1; }
    70% { opacity: 1; }
    to { transform: rotate(var(--a)) translateY(-.95em) rotate(220deg) translateY(.2em); opacity: 0; }
  }
  /* time of day: dim and cool at night (like the clouds), warm at dawn / dusk */
  :global(.if-scene[data-tod='night']) .fly { filter: brightness(.76) saturate(.78) contrast(.95); }
  :global(.if-scene[data-tod='dusk']) .fly, :global(.if-scene[data-tod='dawn']) .fly { filter: sepia(.12) saturate(1.05); }
  /* a sheet or overlay over the scene: hold still (the page-hidden pause is global, tokens.css) */
  :global(.if-scene[data-covered]) .fly, :global(.if-scene[data-covered]) .fly * { animation-play-state: paused !important; }
  @media (prefers-reduced-motion: reduce) { .fly { display: none; } }
</style>
