<script lang="ts">
  // Back row + beach props (style guide §S.5–S.7, §S.10): cedar (all year), the hedge of the
  // season, Resident Services (night: lit windows), fences (winter: log), mailbox, bench (autumn /
  // winter evenings: bonfire with a warm glow), rock, the islet palm, the two front palms, shells by
  // day / glowing star fragments by night, seasonal ground items and Toy Day presents. All official
  // art, positioned in stage units with feet on "base". No wrapper element: every prop joins the
  // stage's stacking context with its own z-index, so palms can sit between the jar and villagers.
  import OfficialArt from '../OfficialArt.svelte';
  import type { Season } from '#lib/client/theme.svelte.ts';
  import type { Foliage } from '#lib/client/season.ts';
  import { EXTRAS, TREE, props as sceneProps, u, type Tod } from './scene.ts';
  import { seasonArt } from '../art.ts';

  interface Props {
    season: Season;
    /** Fallen petals on the grass only while the cherry blossoms are out. */
    foliage?: Foliage;
    tod: Tod;
    month: number;
    toyDay?: boolean;
  }
  let { season, foliage = 'green', tod, month, toyDay = false }: Props = $props();
  const extras = $derived(EXTRAS[season].filter(([item]) => item !== 'petal' || foliage === 'blossom'));
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

{#each extras as [item, x, base, h, rot], i (i)}
  <span class="prop extra" style:left={u(x)} style:top={u(base)} style:z-index="15" style:--rot="{rot}deg">
    <OfficialArt key={seasonArt(item)} size={u(h)} />
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
  .extra { transform: translate(-50%, -100%) rotate(var(--rot)); }
  .glow :global(.official) { filter: drop-shadow(0 0 6px #FFF3A0); animation: if-glow 2.4s var(--ease-idle) infinite alternate; }
  .fireglow {
    position: absolute; left: 50%; top: 60%; width: 400%; aspect-ratio: 1; translate: -50% -50%; border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 196, 107, .4), rgba(255, 196, 107, 0) 65%);
    animation: if-glow 1.8s var(--ease-idle) infinite alternate;
  }
  /* Resident Services windows at night (two warm rounded rects) */
  .win {
    position: absolute; width: 12%; height: 15%; border-radius: 3px; background: #FFE38A; box-shadow: 0 0 8px #FFD45A;
    top: 56%;
  }
  .w1 { left: 22%; } .w2 { right: 22%; }
  @media (prefers-reduced-motion: reduce) {
    .glow :global(.official), .fireglow { animation: none; }
  }
</style>
