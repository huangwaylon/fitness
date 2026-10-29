<script lang="ts">
  // Back row (round 6, fewer decorations): one tidy hedge of eight bushes of the season along the back
  // edge of the plateau, plus Toy Day presents. No building, bench, cedar, path, palms or islet: nothing
  // you can't tap competes with the two trees, the jar and the villagers. All official art, positioned in
  // stage units with feet on "base". No wrapper element: every prop joins the stage's stacking context.
  import OfficialArt from '../OfficialArt.svelte';
  import type { Season } from '#lib/client/theme.svelte.ts';
  import { TREE, props as sceneProps, u } from './scene.ts';

  interface Props {
    season: Season;
    month: number;
    toyDay?: boolean;
  }
  let { season, month, toyDay = false }: Props = $props();
  const list = $derived(sceneProps(season, month));
</script>

{#each list as p, i (p.key + i)}
  <span class="prop" class:flip={p.flip} style:left={u(p.x)} style:top={u(p.base)} style:z-index={p.z}>
    <OfficialArt key={p.key} size={u(p.h)} eager={p.eager} />
  </span>
{/each}

{#if toyDay}
  {#each [TREE.x.A + 34, TREE.x.B - 34] as x (x)}
    <span class="prop" style:left={u(x)} style:top={u(TREE.base + 6)} style:z-index="31"><OfficialArt key="deco/present" size={u(18)} /></span>
  {/each}
{/if}

<style>
  .prop { position: absolute; width: max-content; transform: translate(-50%, -100%); line-height: 0; pointer-events: none; }
  .prop.flip :global(.official) { transform: scaleX(-1); }
</style>
