<script lang="ts">
  // The wild flowers (docs/design.md "World", "Island care"): NH's flowers growing in clumps over the lawn (world.ts
  // FLOWERS), each a world node standing on its stem's foot, the season's kinds (scene.ts WILD); FLOWER_U tall (≈ 0.4 ×
  // a villager). Contact shadows are baked into the ground. Winter: pansies and windflowers, each with a little snow
  // cap. A tap waters one (SceneTaps finds it by data-flower, its id); a flower watered today, by either of us, keeps a
  // glitter for the day; one watered yesterday may show a hybrid colour today (IslandScene, care.ts).
  import OfficialArt from '../characters/OfficialArt.svelte';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
  import { FLOWER_U, flowerScale, wildFlower, u } from './scene.ts';
  import { FLOWERS } from '#lib/world/world.ts';
  import { site } from './site.svelte.ts';
  import { useWorld } from './camera.svelte.ts';
  import { flowerArt } from '#lib/art.ts';
  import { islandDay } from './ambientClock.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { WATERED, wateredOn } from '#lib/world/sceneDay.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';

  interface Props {
    season: Season;
    /** A hybrid colour on one flower today (its id; the day after a watering, IslandScene). */
    hybrid?: { id: string; flower: string } | null;
  }
  let { season, hybrid = null }: Props = $props();
  const w = useWorld();

  /** Today (the model's Tokyo day; the gallery has no view). */
  const date = $derived(week.view?.today ?? islandDay());
  /** The flowers watered today (NH: a watered flower keeps a glitter for the rest of the day), by either of us. */
  let mineWatered = $state<string[]>([]);
  const watered = $derived(new Set([...mineWatered, ...(date === islandDay() ? Object.keys(shared.day.watered) : [])]));
  $effect(() => {
    const d = date;
    const read = () => (mineWatered = wateredOn(d));
    read();
    document.addEventListener(WATERED, read);
    return () => document.removeEventListener(WATERED, read);
  });

  const flowers = $derived(
    // (world.ts's flowers follow the island's layout: site.rev)
    (void site.rev, FLOWERS).map((f, i) => {
      const kind = wildFlower(f, season);
      const key = hybrid?.id === f.id ? `flowers/${hybrid.flower}` : flowerArt(kind);
      return { ...f, i, kind, key, h: FLOWER_U * flowerScale(kind), white: key.includes('white') };
    })
  );
</script>

{#each flowers as f (f.id)}
  <div class="node" {@attach w.at({ x: f.x, z: f.z, h: f.h, inv: true, model: true })}>
    <span class="fl" data-flower={f.id} data-hit-min data-kind={f.kind} data-white={f.white || undefined}>
      <span class="b"><OfficialArt key={f.key} size={u(f.h)} /></span>
      {#if season === 'winter'}<span class="cap"></span>{/if}
      {#if watered.has(f.id)}
        <!-- watered today: one small glint every 4–6 s, out of step between flowers -->
        <svg class="wet" data-watered viewBox="0 0 24 24" aria-hidden="true" style:--wd="{4 + (f.i % 3)}s" style:--wo="{-((f.i * 1.3) % 6)}s"><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" /></svg>
      {/if}
    </span>
  </div>
{/each}

<style>
  .cap {
    position: absolute; left: 24%; right: 24%; top: 4%; height: 16%; border-radius: 50% 50% 40% 40%;
    background: #fff; box-shadow: 0 1px 0 #DDE7F3;
  }
  /* feet on the ground: the trimmed art's stem ends at its bottom edge */
  .node { width: 0; height: 0; transform-origin: 0 0; will-change: transform; pointer-events: none; }
  .fl { position: absolute; left: 0; top: 0; width: max-content; transform: translate(-50%, -96%); line-height: 0; pointer-events: auto; cursor: pointer; }
  /* its tap target: the flower, at least 44px round its middle (--inv: 1 / the node's scale) */
  .fl::after {
    content: ''; position: absolute; left: 50%; top: 50%; translate: -50% -50%;
    width: max(100%, calc(44px * var(--inv, 1))); height: max(100%, calc(44px * var(--inv, 1)));
  }
  .b { display: block; transform-origin: 50% 100%; }
  .wet {
    position: absolute; left: 62%; top: 8%; width: calc(8 * 100cqw / 390); height: auto; fill: #FFFBE8;
    filter: var(--leaf-tint,) drop-shadow(0 0 2px rgba(190, 230, 255, .9)); opacity: 0; animation: wet-glint var(--wd) ease-out var(--wo) infinite;
  }
  @keyframes wet-glint { 0%, 84% { transform: scale(0) rotate(0); opacity: 0; } 91% { transform: scale(1) rotate(40deg); opacity: 1; } 100% { transform: scale(0) rotate(90deg); opacity: 0; } }
</style>
