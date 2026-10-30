<script lang="ts">
  // Back row (scale pass): an NH hedge along the back edge, one bush per tile on columns −3…3, one species of
  // the month in its two colours (scene.ts hedgePair), 3D catalog renders trimmed to the figure, BUSH_U tall
  // (≈ 0.6 × a villager); contact shadows in Ground.svelte. Plus Toy Day presents. No building, bench, cedar, path, palms or islet: nothing
  // you can't tap competes with the two trees, the jar and the villagers. All official art, positioned in
  // stage units with feet on "base". No wrapper element: every prop joins the stage's stacking context.
  // A tap rustles a bush (SceneTaps.svelte finds it by data-bush; the art itself stays pointer-events: none).
  import OfficialArt from '../characters/OfficialArt.svelte';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
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
  <span class="prop" data-bush={i} class:flip={p.flip} class:snow={season === 'winter' && p.key.startsWith('bushes/')} style:left={u(p.x)} style:top={u(p.base)} style:z-index={p.z}>
    <OfficialArt key={p.key} size={u(p.h)} eager={p.eager} />
  </span>
{/each}

{#if toyDay}
  {#each [TREE.x.A + 34, TREE.x.B - 34] as x (x)}
    <span class="prop" style:left={u(x)} style:top={u(TREE.base + 6)} style:z-index="31"><OfficialArt key="deco/present" size={u(18)} /></span>
  {/each}
{/if}

<style>
  .prop { position: absolute; width: max-content; transform: translate(-50%, -96%); line-height: 0; pointer-events: none; }
  /* winter: snow settles on the hedge tops (NH bushes carry snow in winter) */
  .prop.snow::after {
    content: ''; position: absolute; left: 6%; right: 6%; top: -3%; height: 30%;
    background:
      radial-gradient(ellipse 24% 48% at 24% 66%, #FFF 92%, transparent 100%),
      radial-gradient(ellipse 30% 56% at 50% 50%, #FFF 92%, transparent 100%),
      radial-gradient(ellipse 24% 48% at 76% 66%, #FFF 92%, transparent 100%);
    filter: drop-shadow(0 1.5px 0 rgba(150, 175, 210, .5));
  }
  .prop.flip :global(.official) { transform: scaleX(-1); }
</style>
