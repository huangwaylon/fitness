<svelte:options namespace="svg" />

<script lang="ts">
  // Beach, cliff, grass plateau and the dirt path (v5 §5, the NH map look), inside the stage svg.
  // All flat, no strokes: the shore is sand with a 4u foam line, the cliff is one darker band under
  // the plateau, the grass carries NH's diamond texture under 5% contrast, the T path is one flat
  // fill. Ground ellipses sit under the trees and the jar; winter puts snow mounds under the beds.
  import type { Season } from '#lib/client/theme.svelte.ts';
  import { BED_ROWS, BED_X, JAR, ORCHARD } from './scene.ts';

  interface Props {
    uid: string;
    season: Season;
  }
  let { uid, season }: Props = $props();
  const winter = $derived(season === 'winter');

  const BEACH = 'M-6 230 Q-6 170 54 170 H336 Q396 170 396 230 V298 Q396 358 336 358 H54 Q-6 358 -6 298 Z';
  const FOAM = 'M-10 230 Q-10 166 54 166 H336 Q400 166 400 230 V298 Q400 362 336 362 H54 Q-10 362 -10 298 Z';
</script>

<defs>
  <pattern id="{uid}-grass" width="24" height="24" patternUnits="userSpaceOnUse">
    <rect width="24" height="24" fill="var(--grass)" />
    <rect x="2" y="2" width="8.5" height="8.5" transform="rotate(45 6.25 6.25)" fill="var(--grass-2)" />
    <rect x="14" y="14" width="8.5" height="8.5" transform="rotate(45 18.25 18.25)" fill="var(--grass-2)" />
  </pattern>
</defs>

<!-- shore: a 4u foam line, then flat sand -->
<path d={FOAM} fill="var(--foam)" />
<path d={BEACH} fill="var(--beach)" />

<!-- cliff: one darker band under the plateau, then the grass lip and the grass -->
<rect x="12" y="50" width="366" height="258" rx="44" fill="var(--cliff)" />
<rect x="12" y="44" width="366" height="258" rx="44" fill="var(--grass-lip)" />
<rect x="12" y="40" width="366" height="258" rx="44" fill="url(#{uid}-grass)" />

<!-- dirt path (T) -->
<g fill="var(--path)">
  <rect x="175" y="104" width="40" height="198" rx="12" />
  <rect x="58" y="248" width="274" height="28" rx="13" />
</g>

<!-- ground ellipses (dusk: long) -->
{#each [...ORCHARD.A, ...ORCHARD.B] as tr, i (i)}
  <ellipse cx={tr.x} cy={tr.base + 1} rx={tr.h * 0.27} ry={tr.h * 0.055} class="sh" />
{/each}
<ellipse cx={JAR.x} cy={JAR.base} rx="30" ry="5" class="sh" />

{#if winter}
  {#each [...BED_X.left, ...BED_X.right] as x (x)}
    {#each BED_ROWS as y (y)}<ellipse cx={x} cy={y - 2} rx="8" ry="4" fill="#fff" />{/each}
  {/each}
{/if}

<style>
  .sh { fill: var(--sh-ground); transform-box: fill-box; transform-origin: center; transform: scaleX(var(--sh-scale, 1)); }
</style>
