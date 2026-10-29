<svelte:options namespace="svg" />

<script lang="ts">
  // Beach, cliff, grass plateau and the dirt path (style guide §S.5–S.7), inside the stage svg.
  // NH checker grass (two diamonds per 24u tile), 12 ʌʌ tufts (winter: snow glints instead), a
  // T-shaped path from the beach to Resident Services and across between the villagers, pebbles,
  // ground shadows for the trees and the jar, and winter snow mounds where the flower beds sleep.
  import type { Season } from '#lib/client/theme.svelte.ts';
  import { BED_ROWS, BED_X, JAR, TREE, star4, wobblyRect } from './scene.ts';

  interface Props {
    uid: string;
    season: Season;
  }
  let { uid, season }: Props = $props();
  const winter = $derived(season === 'winter');

  const PLATEAU = wobblyRect(12, 40, 366, 258, 44, 3, 7);
  const BEACH_WET = 'M-12 230 Q-12 164 54 164 H336 Q402 164 402 230 V298 Q402 364 336 364 H54 Q-12 364 -12 298 Z';
  const BEACH = 'M-6 230 Q-6 170 54 170 H336 Q396 170 396 230 V298 Q396 358 336 358 H54 Q-6 358 -6 298 Z';
  const PATH_V = wobblyRect(175, 104, 40, 198, 12, 1.6, 3, 40);
  const PATH_H = wobblyRect(58, 248, 274, 28, 13, 1.6, 5, 56);
  const TUFTS = [[40, 70], [108, 60], [292, 64], [350, 76], [30, 196], [160, 150], [240, 152], [362, 214], [126, 224], [268, 226], [44, 270], [346, 282]];
  const SNOW = [[60, 64], [150, 132], [252, 128], [336, 70], [30, 230], [118, 186], [278, 190], [360, 250], [96, 286], [300, 290]];
  const PEBBLES = [[186, 140, 2], [204, 186, 1.6], [183, 226, 2.4], [96, 262, 1.8], [292, 258, 2.2]];
</script>

<defs>
  <pattern id="{uid}-grass" width="24" height="24" patternUnits="userSpaceOnUse">
    <rect width="24" height="24" fill="var(--grass)" />
    <rect x="2" y="2" width="8.5" height="8.5" transform="rotate(45 6.25 6.25)" fill="var(--grass-2)" />
    <rect x="14" y="14" width="8.5" height="8.5" transform="rotate(45 18.25 18.25)" fill="var(--grass-2)" />
  </pattern>
</defs>

<!-- beach (wet edge, sand, breathing shore foam) -->
<path d={BEACH_WET} fill="var(--beach-wet)" />
<path d={BEACH_WET} class="shore" />
<path d={BEACH} fill="var(--beach)" />

<!-- cliff face under the plateau, with two strata lines -->
<path d={PLATEAU} transform="translate(0 14)" fill="var(--cliff)" />
<path d={PLATEAU} transform="translate(0 5)" class="strata" />
<path d={PLATEAU} transform="translate(0 10)" class="strata" />

<!-- grass plateau -->
<path d={PLATEAU} fill="url(#{uid}-grass)" />
<path d={PLATEAU} fill="none" stroke="var(--grass-edge)" stroke-width="3" />

{#if winter}
  <g class="snowglint">
    {#each SNOW as [x, y], i (i)}<path d={star4(x, y, 7)} style="animation-delay:{-(i * 0.31).toFixed(2)}s" />{/each}
  </g>
{:else}
  {#each TUFTS as [x, y], i (i)}
    <path d="M{x - 4} {y} l2 -5 l2 5 l2 -5 l2 5" class="tuft" />
  {/each}
{/if}

<!-- dirt path (T) -->
<g class="path">
  <path d={PATH_V} class="edge" /><path d={PATH_H} class="edge" />
  <path d={PATH_V} class="fill" /><path d={PATH_H} class="fill" />
  {#each PEBBLES as [x, y, r], i (i)}<circle cx={x} cy={y} {r} fill="var(--path-edge)" />{/each}
</g>

<!-- ground shadows (dusk: long) -->
<ellipse cx={TREE.x.A} cy={TREE.base + 2} rx="46" ry="9" class="sh" />
<ellipse cx={TREE.x.B} cy={TREE.base + 2} rx="46" ry="9" class="sh" />
<ellipse cx={JAR.x} cy={JAR.base} rx="28" ry="5" class="sh" />

{#if winter}
  {#each [...BED_X.left, ...BED_X.right] as x (x)}
    {#each BED_ROWS as y (y)}<ellipse cx={x} cy={y - 2} rx="8" ry="4" fill="#fff" stroke="#DDE7F3" stroke-width="1" />{/each}
  {/each}
{/if}
<!-- planted-bed borders: a stitched line in front of each bed -->
<path d="M124 {BED_ROWS[1] + 4} H176 M214 {BED_ROWS[1] + 4} H266" class="stitch" />

<style>
  .shore {
    fill: none; stroke: var(--foam); stroke-width: 3; transform-box: view-box; transform-origin: 195px 264px;
    animation: if-shore 3.2s var(--ease-idle) infinite alternate;
  }
  .strata { fill: none; stroke: var(--cliff-dark); stroke-width: 1.5; }
  .tuft { fill: none; stroke: var(--grass-edge); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
  .snowglint path { fill: #fff; opacity: .7; transform-box: fill-box; transform-origin: center; animation: if-twinkle 2.8s var(--ease-idle) infinite; }
  .path .edge { fill: var(--path-edge); stroke: var(--path-edge); stroke-width: 4; stroke-linejoin: round; }
  .path .fill { fill: var(--path); }
  .sh { fill: var(--sh-ground); transform-box: fill-box; transform-origin: center; transform: scaleX(var(--sh-scale, 1)); }
  .stitch { fill: none; stroke: var(--grass-edge); stroke-width: 1.5; stroke-dasharray: 3 3; stroke-linecap: round; }
  @media (prefers-reduced-motion: reduce) {
    .shore, .snowglint path { animation: none; }
  }
</style>
