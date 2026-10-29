<svelte:options namespace="svg" />

<script lang="ts">
  // Sea (style guide §S.5), inside the stage <svg viewBox="0 0 390 360">: the back sea fades from
  // --sea-far at the horizon, deep blue shows at the front corners, three scalloped wave bands slide,
  // six sparkles twinkle (three warm ones at night), and the distant islet's sand sits at the top right.
  import { star4, waveCrest } from './scene.ts';

  interface Props {
    uid: string;
    night?: boolean;
  }
  let { uid, night = false }: Props = $props();

  const SPARKLES = [
    [34, 10, 8], [118, 30, 7], [236, 8, 9], [290, 32, 6], [20, 346, 7], [372, 352, 8]
  ];
  const shown = $derived(night ? SPARKLES.filter((_, i) => i % 2 === 0) : SPARKLES);
</script>

<defs>
  <linearGradient id="{uid}-sea" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="var(--sea-far)" />
    <stop offset=".11" stop-color="var(--sea)" />
    <stop offset=".6" stop-color="var(--sea)" />
    <stop offset="1" stop-color="var(--sea-deep)" />
  </linearGradient>
</defs>
<rect x="-10" y="-40" width="410" height="410" fill="url(#{uid}-sea)" />
<!-- distant islet sand (its palm is an HTML overlay) -->
<ellipse cx="345" cy="15" rx="27" ry="6" fill="var(--beach)" />
<ellipse cx="345" cy="15" rx="27" ry="6" fill="none" stroke="var(--foam)" stroke-width="1.6" opacity=".6" />
{#if night}
  <!-- moon glint: short warm streaks on the water under the moon (static) -->
  <g class="moonglint">
    <rect x="309" y="-34" width="18" height="1.8" rx=".9" /><rect x="303" y="-27" width="28" height="2.2" rx="1.1" />
    <rect x="307" y="-19" width="20" height="2" rx="1" /><rect x="299" y="-10" width="34" height="2.4" rx="1.2" />
  </g>
{/if}
<!-- three wave bands, each one animated group (P5 budget) -->
<g class="waves">
  <g><path d={waveCrest(-14, 12, 9, 6)} /><path d={waveCrest(150, 12, 8, 6)} /></g>
  <g style="animation-delay:-1.3s"><path d={waveCrest(-4, 28, 9, 6)} /><path d={waveCrest(196, 28, 9, 6)} /></g>
  <g style="animation-delay:-2.6s"><path d={waveCrest(-10, 354, 8, 6)} /><path d={waveCrest(296, 354, 8, 6)} /></g>
</g>
<g class="sparkles" class:night>
  {#each shown as [x, y, s], i (i)}
    <path d={star4(x, y, s)} style="animation-delay:{-(i * 0.47).toFixed(2)}s" />
  {/each}
</g>

<style>
  .waves path { fill: none; stroke: var(--foam); stroke-width: 2.4; stroke-linecap: round; opacity: .7; }
  .waves g { animation: if-wave 4s var(--ease-idle) infinite alternate; }
  .sparkles path {
    fill: #fff; transform-box: fill-box; transform-origin: center;
    animation: if-twinkle 2.8s var(--ease-idle) infinite;
  }
  .sparkles.night path { fill: #FFF3C4; }
  .moonglint rect { fill: var(--moon-glint, #FFF3C4); }
  @media (prefers-reduced-motion: reduce) {
    .waves g { animation: none; }
    .sparkles path { animation: none; opacity: 0; }
  }
</style>
