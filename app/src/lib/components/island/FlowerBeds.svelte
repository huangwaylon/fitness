<script lang="ts">
  // Flower beds (scale pass, docs/design/design.md §S.2): two tidy 2 × 2 beds mirrored about the jar,
  // one flower per tile on the NH grid (columns ±2/±3, the beds' back row and the front row), the back row
  // one species and the front row another. FLOWER_U tall (≈ 0.45 × a villager). Contact shadows are drawn
  // in Ground.svelte. Winter: roses and pansies, each with a little snow cap.
  // A tap wiggles a flower (SceneTaps.svelte finds it by data-flower="row-col").
  import OfficialArt from '../characters/OfficialArt.svelte';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
  import { BEDS, BED_ROWS, BED_X, FLOWER_SCALE, FLOWER_U, u } from './scene.ts';
  import { flowerArt } from '#lib/art.ts';

  let { season }: { season: Season } = $props();
  const bed = $derived(BEDS[season]);
  const xs = [...BED_X.left, ...BED_X.right];
</script>

{#each BED_ROWS as y, r (y)}
  {@const id = r ? bed.front : bed.back}
  {#each xs as x, c (x)}
    <span class="fl" data-flower="{r}-{c}" style:left={u(x)} style:top={u(y)} style:z-index={r ? 53 : 49}>
      <OfficialArt key={flowerArt(id)} size={u(FLOWER_U * (FLOWER_SCALE[id] ?? 1))} />
      {#if season === 'winter'}<span class="cap"></span>{/if}
    </span>
  {/each}
{/each}

<style>
  .cap {
    position: absolute; left: 24%; right: 24%; top: 4%; height: 16%; border-radius: 50% 50% 40% 40%;
    background: #fff; box-shadow: 0 1px 0 #DDE7F3;
  }
  /* feet on the row line: the trimmed art's stem ends at its bottom edge */
  .fl { position: absolute; width: max-content; transform: translate(-50%, -96%); line-height: 0; pointer-events: none; }
</style>
