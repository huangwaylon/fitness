<script lang="ts">
  // Back row (v5 §7, decluttered): cedar (all year), four bushes of the season, Resident Services
  // (night: lit windows), a bench (autumn / winter evenings: a bonfire with a steady glow), the
  // islet palm, the two front palms and Toy Day presents. No fences, rock, mailbox, shells, star fragments or
  // ground litter (mushrooms, acorns, cones, petals). All official
  // art, positioned in stage units with feet on "base". No wrapper element: every prop joins the
  // stage's stacking context with its own z-index, so palms can sit between the jar and villagers.
  import OfficialArt from '../OfficialArt.svelte';
  import type { Season } from '#lib/client/theme.svelte.ts';
  import { TREE, props as sceneProps, u, type Tod } from './scene.ts';

  interface Props {
    season: Season;
    tod: Tod;
    month: number;
    toyDay?: boolean;
  }
  let { season, tod, month, toyDay = false }: Props = $props();
  const list = $derived(sceneProps(season, tod, month));
  const night = $derived(tod === 'night');
</script>

{#each list as p, i (p.key + i)}
  <span class="prop {p.cls ?? ''}" class:flip={p.flip} style:left={u(p.x)} style:top={u(p.base)} style:z-index={p.z}>
    {#if p.cls === 'bonfire'}<span class="fireglow"></span>{/if}
    <OfficialArt key={p.key} size={u(p.h)} eager={p.eager} />
    {#if p.key === 'deco/resident-services' && night}
      <span class="win w1"></span><span class="win w2"></span>
    {/if}
  </span>
{/each}

{#if toyDay}
  {#each [TREE.x.A + 26, TREE.x.B - 26] as x (x)}
    <span class="prop" style:left={u(x)} style:top={u(TREE.base + 4)} style:z-index="31"><OfficialArt key="deco/present" size={u(18)} /></span>
  {/each}
{/if}

<style>
  .prop { position: absolute; width: max-content; transform: translate(-50%, -100%); line-height: 0; pointer-events: none; }
  .prop.flip :global(.official) { transform: scaleX(-1); }
  .fireglow {
    position: absolute; left: 50%; top: 60%; width: 400%; aspect-ratio: 1; translate: -50% -50%; border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 196, 107, .35), rgba(255, 196, 107, 0) 65%);
  }
  /* Resident Services windows at night (two warm rounded rects) */
  .win {
    position: absolute; width: 12%; height: 15%; border-radius: 3px; background: #FFE38A; 
    top: 56%;
  }
  .w1 { left: 22%; } .w2 { right: 22%; }
</style>
