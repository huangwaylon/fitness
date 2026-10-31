<script lang="ts">
  // Sky (design.md "Environment"): a 3-stop gradient (top · mid at 55% · horizon, per time of day;
  // season shifts by day) bleeding under the status bar; the sun low at the left (left 12%, 82% down the band, under
  // the ribbon, which sits in the band's middle) as ONE soft radial glow, or the moon (a crescent with a soft
  // glow) + 10 stars (2 twinkle); two drifting soft clouds (Clouds.svelte), the balloon present and the fireworks
  // (Fireworks.svelte, passed in as children). The sun / moon sit above the clouds, so a cloud never hides them. The visible band (below the
  // safe area) is a size container named `sky`.
  import type { Snippet } from 'svelte';
  import Clouds from './Clouds.svelte';
  import type { Tod } from './scene.ts';

  interface Props {
    tod: Tod;
    children?: Snippet;
  }
  let { tod, children }: Props = $props();
  const uid = $props.id();
  const night = $derived(tod === 'night');
  const low = $derived(tod === 'dawn' || tod === 'dusk');
  // 2 twinkling + 8 still stars (idle budget ≤ 10)
  const STARS = [
    [8, 18], [17, 52], [26, 30], [34, 70], [43, 14], [52, 46], [60, 26], [67, 64], [88, 58], [5, 78]
  ];
</script>

<div class="sky" aria-hidden="true">
  <div class="band">
    {#if night}
      {#each STARS as [x, y], i (i)}
        <svg class="star" class:still={i !== 2 && i !== 7} viewBox="0 0 24 24" style:left="{x}%" style:top="{y}%" style:width="{6 + (i % 3) * 2}px"
          style:animation-duration="{2.4 + (i % 5) * 0.4}s" style:animation-delay="{-i * 0.37}s">
          <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" />
        </svg>
      {/each}
    {/if}
    <!-- NH's distant cloud bank resting on the horizon (static): fills the low sky on tall phones -->
    <svg class="bank" viewBox="0 0 400 40" preserveAspectRatio="none">
      <defs>
        <linearGradient id="{uid}-bank" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style:stop-color="var(--cloud-top)" /><stop offset=".6" style:stop-color="var(--cloud-mid)" />
          <stop offset="1" style:stop-color="var(--sky-hz)" />
        </linearGradient>
      </defs>
      <path fill="url(#{uid}-bank)" d="M0 40 V30 Q8 18 22 24 Q30 10 48 18 Q58 8 72 20 Q84 14 92 26 Q104 20 112 30 Q126 28 132 34 Q150 26 164 32 Q176 22 192 28 Q204 14 222 20 Q234 6 252 16 Q264 10 274 22 Q288 16 296 28 Q312 22 322 30 Q338 20 352 26 Q364 12 380 20 Q392 16 400 26 V40 Z" />
    </svg>
    <Clouds />
    {#if night}
      <span class="orb moon"><svg viewBox="12 12 36 36"><path d="M34 12 A18 18 0 1 0 48 40 A14 14 0 1 1 34 12 Z" /></svg></span>
    {:else}
      <span class="orb sun" class:low></span>
    {/if}
    {@render children?.()}
  </div>
</div>

<style>
  .sky {
    position: absolute; inset: 0 0 auto 0; z-index: 0; height: var(--sky-h);
    background: linear-gradient(180deg, var(--sky-top), var(--sky-mid) 55%, var(--sky-hz));
  }
  .bank {
    position: absolute; left: 0; bottom: -8px; width: 100%; height: clamp(16px, 18cqh, 54px);
    opacity: calc(.9 * var(--cloud-op, 1)); pointer-events: none;
  }
  .band { position: absolute; left: 0; right: 0; top: var(--safe-top); bottom: 8px; container: sky / size; }
  /* sun / moon: glow box = 2.8 × the core (core 30 / glow 84 at 393, 26 / 72 compact, 22 / 60 at 320) */
  .orb {
    --glow: 84px;
    position: absolute; z-index: 2; left: 12%; top: 82%; width: var(--glow); height: var(--glow); translate: -50% -50%;
    border-radius: 50%; pointer-events: none;
  }
  @media (max-height: 700px), (max-width: 359px) { .orb { --glow: 72px; } }
  @media (max-width: 339px) { .orb { --glow: 60px; } }
  /* a short sky: the glow hugs the horizon, under the ribbon */
  @container sky (max-height: 150px) { .orb { top: 86%; } }
  .sun { background: radial-gradient(closest-side, var(--sun-core) 0 35%, var(--sun-ring) 50%, transparent 100%); }
  .sun.low { top: 86%; }
  .moon { background: radial-gradient(closest-side, var(--moon-glow) 45%, transparent 100%); display: grid; place-items: center; }
  /* crescent radius = glow / 2.2 / 2 */
  .moon svg { width: calc(var(--glow) / 2.2); height: auto; fill: var(--moon); overflow: visible; }
  .star { position: absolute; height: auto; fill: #FFF6D6; animation: if-twinkle 3s var(--ease-idle) infinite; }
  .star.still { animation: none; opacity: .75; }
</style>
