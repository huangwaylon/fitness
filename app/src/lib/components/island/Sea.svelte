<svelte:options namespace="svg" />

<script lang="ts">
  // Sea (style guide §S.5), inside the stage <svg viewBox="0 0 390 360">: the back sea fades from
  // --sea-far at the horizon, deep blue shows at the front corners, three scalloped wave bands slide,
  // four sparkles twinkle (two warm ones at night), and the distant islet's sand sits at the top right.
  import { star4, waveCrest } from './scene.ts';

  interface Props {
    uid: string;
    night?: boolean;
  }
  let { uid, night = false }: Props = $props();

  // 4 by day, 2 at night (P5 budget, §S.13)
  const SPARKLES = [[34, 10, 8], [236, 8, 9], [118, 30, 7], [372, 352, 8]];
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
    <ellipse cx="318" cy="-34" rx="6" ry=".9" /><ellipse cx="315" cy="-27" rx="11" ry="1.1" />
    <ellipse cx="319" cy="-19" rx="8" ry="1" /><ellipse cx="314" cy="-10" rx="15" ry="1.3" />
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
  .moonglint ellipse { fill: var(--moon-glint, #FFF3C4); opacity: .55; }
  @media (prefers-reduced-motion: reduce) {
    .waves g { animation: none; }
    .sparkles path { animation: none; opacity: 0; }
  }
</style>
