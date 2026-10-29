<script lang="ts">
  // Flower rows (round 6): one long, evenly spaced front row on each side of the jar (6 × 22u pitch,
  // 20u tall), two kinds of the season alternating, so they frame the island without clutter. They sit
  // just in front of the villagers' feet (z above the villagers). Winter: roses and pansies on snow
  // mounds (drawn in Ground.svelte), each with a little snow cap.
  import OfficialArt from '../OfficialArt.svelte';
  import type { Season } from '#lib/client/theme.svelte.ts';
  import { BEDS, BED_ROWS, BED_X, u } from './scene.ts';
  import { flowerArt } from '../art.ts';

  let { season }: { season: Season } = $props();
  const beds = $derived(BEDS[season]);
</script>

{#each [0, 1] as side (side)}
  {@const xs = side ? BED_X.right : BED_X.left}
  {#each BED_ROWS as y (y)}
    {#each xs as x, i (x)}
      <!-- mirrored order, so the two outer ends match -->
      {@const k = side ? (xs.length - 1 - i) % 2 : i % 2}
      <span class="fl" style:left={u(x)} style:top={u(y)}>
        <OfficialArt key={flowerArt(beds[side * 2 + k])} size={u(20)} />
        {#if season === 'winter'}<span class="cap"></span>{/if}
      </span>
    {/each}
  {/each}
{/each}

<style>
  .cap {
    position: absolute; left: 22%; right: 22%; top: 6%; height: 22%; border-radius: 50% 50% 40% 40%;
    background: #fff; box-shadow: 0 1px 0 #DDE7F3;
  }
  .fl { position: absolute; z-index: 53; width: max-content; transform: translate(-50%, -90%); line-height: 0; pointer-events: none; }
</style>
