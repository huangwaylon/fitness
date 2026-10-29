<svelte:options namespace="svg" />

<script lang="ts">
  // Beach, cliff and grass plateau (v5 §5, the NH map look), inside the stage svg. All flat, no
  // strokes: the shore is sand with a 4u foam line, the cliff is one darker band under the plateau,
  // the grass carries NH's diamond texture under 5% contrast. No path (round 6). Ground ellipses
  // (--sh-ground, the depth token) sit under the two trees and the jar; winter puts snow mounds under
  // the flowers.
  import type { Season } from '#lib/client/theme.svelte.ts';
  import { BED_ROWS, BED_X, JAR, PLATEAU_BOTTOM, PLATEAU_TOP, TREE } from './scene.ts';

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
<rect x="12" y={PLATEAU_TOP + 10} width="366" height={PLATEAU_BOTTOM - PLATEAU_TOP} rx="44" fill="var(--cliff)" />
<rect x="12" y={PLATEAU_TOP + 4} width="366" height={PLATEAU_BOTTOM - PLATEAU_TOP} rx="44" fill="var(--grass-lip)" />
<rect x="12" y={PLATEAU_TOP} width="366" height={PLATEAU_BOTTOM - PLATEAU_TOP} rx="44" fill="url(#{uid}-grass)" />

<!-- the plaza: a round sand patch under the jar (where NH puts the plaza) -->
<ellipse cx={JAR.x} cy={JAR.base - 6} rx="54" ry="22" fill="var(--path)" />

<!-- ground ellipses (dusk: long) -->
{#each [TREE.x.A, TREE.x.B] as x (x)}
  <ellipse cx={x} cy={TREE.base + 1} rx={TREE.h * 0.24} ry={TREE.h * 0.05} class="sh" />
{/each}
<ellipse cx={JAR.x} cy={JAR.base} rx={JAR.w * 0.5} ry="5" class="sh" />

{#if winter}
  {#each [BED_X.left, BED_X.right] as xs, i (i)}
    {#each BED_ROWS as y (y)}<rect x={xs[0] - 10} y={y - 6} width={xs[xs.length - 1] - xs[0] + 20} height="8" rx="4" fill="#fff" />{/each}
  {/each}
{/if}

<style>
  .sh { fill: var(--sh-ground); transform-box: fill-box; transform-origin: center; transform: scaleX(var(--sh-scale, 1)); }
</style>
