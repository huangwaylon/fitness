<script lang="ts">
  // Two flower beds flanking the path below the jar (style guide §S.7): 3 × 2 official flowers of the
  // season per bed at a 16u pitch, 20u tall. Winter: roses and pansies on snow mounds (drawn in
  // Ground.svelte), each with a little snow cap.
  import OfficialArt from '../OfficialArt.svelte';
  import type { Season } from '#lib/client/theme.svelte.ts';
  import { BEDS, BED_ROWS, BED_X, u } from './scene.ts';
  import { flowerArt } from '../art.ts';

  let { season }: { season: Season } = $props();
  const beds = $derived(BEDS[season]);
</script>

{#each [0, 1] as side (side)}
  {#each BED_ROWS as y, row (y)}
    {#each side ? BED_X.right : BED_X.left as x, i (x)}
      <span class="fl" style:left={u(x + (row ? 0 : (i - 1) * 1.5))} style:top={u(y)} style:z-index={41 + row}>
        <OfficialArt key={flowerArt(beds[side * 2 + row])} size={u(20)} />
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
  .fl { position: absolute; width: max-content; transform: translate(-50%, -90%); line-height: 0; pointer-events: none; }
</style>
