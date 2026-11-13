<script lang="ts">
  // Seasonal particles (design.md "Particles and events"; ≤ 3 in the idle budget): cherry-blossom petals, autumn maple
  // leaves (2, 3 in festival week), snowflakes on a snow day (3): which and how many, for the 3D island to draw
  // (ambient3d.svelte.ts); summer nights get our fireflies, world nodes over the grass in front of the camera where it
  // settled (mode="fireflies", inside the stage), and on Toy Day (Dec 24) the same layer sets two presents beside the
  // goal trees.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
  import type { Foliage } from '#lib/ui-state/season.ts';
  import { eventsAt, u, type Tod } from './scene.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { scenePreview } from '#lib/ui-state/preview.svelte.ts';
  import { useWorld } from './camera.svelte.ts';
  import { ambient3 } from './ambient3d.svelte.ts';
  import { HOMES, onGrass, surfaceAt, type Pt } from '#lib/world/world.ts';
  import { site } from './site.svelte.ts';

  interface Props {
    season: Season;
    /** Petals only fall while the cherry blossoms are out, maple leaves once the oaks turn. */
    foliage?: Foliage;
    tod: Tod;
    /** The villagers sleep (their zzz loops count against the budget): one particle at most. */
    quiet?: boolean;
    /** Cherry-blossom / maple week: a few more. */
    festival?: boolean;
    mode?: 'fall' | 'fireflies';
    /** Snow is falling (a snow day: weatherNow.svelte.ts); without the weather (the gallery), every winter. */
    snowing?: boolean;
    /** Raining: no fireflies (NH: never in the rain). */
    raining?: boolean;
  }
  let { season, foliage = 'green', tod, quiet = false, festival = false, mode = 'fall', snowing = season === 'winter', raining = false }: Props = $props();

  const kind = $derived(
    // leaves and petals rest at night (idle budget); snow keeps falling
    foliage === 'blossom' && tod !== 'night' ? 'petal' : foliage === 'fall' && tod !== 'night' ? 'maple-leaf' : snowing ? 'snowflake' : null
  );
  const count = $derived(quiet ? (kind ? 1 : 0) : kind === 'petal' || kind === 'maple-leaf' ? (festival ? 3 : 2) : kind === 'snowflake' ? 3 : 0);
  const w = useWorld();
  // the 3D island draws the fall itself (ambient3d.svelte.ts)
  $effect(() => {
    if (mode !== 'fall' || !w.rest.three) return;
    ambient3.kind = kind;
    ambient3.count = count;
    return () => {
      ambient3.kind = null;
      ambient3.count = 0;
    };
  });
  /** The fireflies: over the grass a little in front of the camera's pivot when it settles (world x, dz from camZ,
   *  lift u), kept off the paths and the water; ≤ 3 (idle budget). */
  const FIREFLY_AT: readonly [number, number, number][] = [[60, -70, 34], [300, -40, 26], [128, 60, 40], [250, 110, 30], [40, 150, 36]];
  const FIREFLIES = $derived.by(() => {
    if (mode !== 'fireflies') return [];
    const z0 = w.rest.z;
    const out = FIREFLY_AT.map(([x, dz, lift]) => [x, Math.round(z0 + dz), lift] as const).filter(([x, z]) => onGrass(x, z) && surfaceAt(x, z) === 'grass').slice(0, 3);
    return quiet ? out.slice(0, 1) : out;
  });
  /** Toy Day's presents (NH's Dec 24), one on each side of the path, a step in front of each villager on its inner
   *  side, clear of the villagers and the goal trees' canopies and fruit rows (controls) at 390 and 320 wide. */
  const toyDay = $derived(mode === 'fireflies' && eventsAt(minuteNow(), scenePreview().event).toyDay);
  const TOYS: readonly Pt[] = $derived((void site.rev, [[HOMES.A[0] + 42, HOMES.A[1] - 34], [HOMES.B[0] - 42, HOMES.B[1] - 34]]));
</script>

{#if mode === 'fireflies' && season === 'summer' && tod === 'night' && !raining}
  {#each FIREFLIES as [x, z, lift], i (`${i}:${x},${z}`)}
    <!-- a light: never tinted (they glow), in their depth -->
    <span class="node" aria-hidden="true" {@attach w.at({ x, z, lift, h: 10, light: true, m3: { key: '', emit: { kind: 'firefly', every: 5200 } } })}>
      <span data-m3art class="ff" style:animation-duration="{3 + (i % 3)}s" style:animation-delay="{-i * 0.7}s"></span>
    </span>
  {/each}
{/if}
{#if toyDay}
  {#each TOYS as [x, z] (x)}
    <span class="node toy" data-toy aria-hidden="true" {@attach w.at({ x, z, h: 24, m3: { key: 'deco/present' } })}><span class="art"><OfficialArt key="deco/present" size={u(18)} /></span></span>
  {/each}
{/if}

<style>
  /* world nodes (camera.svelte.ts places them): a firefly's glow, a present at its foot */
  .node { width: 0; height: 0; pointer-events: none; line-height: 0; }
  .toy .art { position: absolute; left: 0; bottom: 0; translate: -50% 4%; filter: var(--leaf-tint,) drop-shadow(0 1.5px 1px rgba(80, 50, 20, .3)); }
  .toy .art :global(.official) { max-width: none; }
  .ff {
    position: absolute; width: 4.4px; height: 4.4px; margin: -2.2px; border-radius: 50%;
    background: var(--firefly); box-shadow: 0 0 6px var(--firefly-glow); pointer-events: none;
    animation: firefly 4s var(--ease-idle) infinite alternate;
  }
  @keyframes firefly {
    0% { transform: translate(0, 0); opacity: .2; } 50% { transform: translate(10px, -14px); opacity: 1; }
    100% { transform: translate(-12px, -4px); opacity: .3; }
  }
</style>
