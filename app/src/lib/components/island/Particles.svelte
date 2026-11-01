<script lang="ts">
  // Seasonal particles (design.md "Particles and events"), transform/opacity only, ONE animation each (the side-to-side
  // flutter is folded into the fall keyframes; ≤ 3 particles in the idle budget): cherry-blossom
  // petals, autumn maple leaves (2, 3 in festival week), snowflakes on a snow day (3), all official art, falling in
  // screen space; summer nights get our fireflies, world nodes over the grass in front of the camera where it settled
  // (mode="fireflies", inside the stage), and on Toy Day (Dec 24) the same layer sets two presents beside the goal trees.
  // The falling layer is a size container, so the fall distance is in cqh of the whole scene.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
  import type { Foliage } from '#lib/ui-state/season.ts';
  import { seasonArt } from '#lib/art.ts';
  import { eventsAt, u, type Tod } from './scene.ts';
  import { mulberry32 } from '#lib/random.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { useWorld } from './camera.svelte.ts';
  import { GOAL_TREES, onGrass, surfaceAt, type Pt } from './world.ts';

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
  const items = $derived.by(() => {
    const r = mulberry32(season.length * 97 + count);
    const [d0, d1] = kind === 'snowflake' ? [12, 18] : kind === 'maple-leaf' ? [10, 15] : [9, 14];
    return Array.from({ length: count }, (_, i) => {
      const dur = d0 + r() * (d1 - d0);
      return {
        x: ((i + r() * 0.8) / count) * 100,
        size: kind === 'snowflake' ? 8 + r() * 6 : kind === 'maple-leaf' ? 12 + r() * 4 : 10 + r() * 6,
        dur,
        delay: -r() * dur,
        sx: (kind === 'snowflake' ? 10 : 18) * (r() < 0.5 ? -1 : 1),
        rot: kind === 'maple-leaf' ? 180 + r() * 360 : 40
      };
    });
  });
  const w = useWorld();
  /** The fireflies: over the grass a little in front of the camera's pivot when it settles (world x, dz from camZ,
   *  lift u), kept off the paths, the plaza and the water; ≤ 3 (idle budget). */
  const FIREFLY_AT: readonly [number, number, number][] = [[60, -70, 34], [300, -40, 26], [128, 60, 40], [250, 110, 30], [40, 150, 36]];
  const FIREFLIES = $derived.by(() => {
    if (mode !== 'fireflies') return [];
    const z0 = w.rest.z;
    const out = FIREFLY_AT.map(([x, dz, lift]) => [x, Math.round(z0 + dz), lift] as const).filter(([x, z]) => onGrass(x, z) && surfaceAt(x, z) === 'grass').slice(0, 3);
    return quiet ? out.slice(0, 1) : out;
  });
  /** Toy Day's presents (NH's Dec 24), one on each side of the path, inward of the goal trees and clear of their
   *  canopies and fruit rows (controls) at 390 and 320 wide. */
  const toyDay = $derived(mode === 'fireflies' && eventsAt(minuteNow()).toyDay);
  const TOYS: readonly Pt[] = [[GOAL_TREES.A[0] + 88, GOAL_TREES.A[1] + 28], [GOAL_TREES.B[0] - 90, GOAL_TREES.B[1] + 28]];
</script>

{#if mode === 'fall' && kind}
  <div class="layer" aria-hidden="true">
    {#each items as p, i (i)}
      <span class="p" style:left="{p.x}%" style:animation-duration="{p.dur}s" style:animation-delay="{p.delay}s" style:--rot="{p.rot}deg" style:--sx="{p.sx}px">
        <OfficialArt key={seasonArt(kind)} size="{p.size.toFixed(1)}px" eager />
      </span>
    {/each}
  </div>
{:else if mode === 'fireflies' && season === 'summer' && tod === 'night' && !raining}
  {#each FIREFLIES as [x, z, lift], i (`${i}:${x},${z}`)}
    <!-- above the time-of-day tint (IslandScene's .stage --z-tint 60000080): they glow -->
    <span class="node" aria-hidden="true" {@attach w.at({ x, z, lift, h: 10, zi: 60_000_081 })}>
      <span class="ff" style:animation-duration="{3 + (i % 3)}s" style:animation-delay="{-i * 0.7}s"></span>
    </span>
  {/each}
{/if}
{#if toyDay}
  {#each TOYS as [x, z] (x)}
    <span class="node toy" data-toy aria-hidden="true" {@attach w.at({ x, z, h: 24 })}><span class="art"><OfficialArt key="deco/present" size={u(18)} /></span></span>
  {/each}
{/if}

<style>
  .layer { position: absolute; inset: 0; z-index: 70; pointer-events: none; overflow: hidden; container-type: size; }
  .p { position: absolute; top: 0; line-height: 0; animation: fall 10s linear infinite; will-change: transform; }
  @keyframes fall {
    0% { transform: translate(0, -10cqh) rotate(0); }
    20% { transform: translate(var(--sx), 14cqh) rotate(calc(var(--rot) * .2)); }
    40% { transform: translate(calc(var(--sx) * -1), 38cqh) rotate(calc(var(--rot) * .4)); }
    60% { transform: translate(var(--sx), 62cqh) rotate(calc(var(--rot) * .6)); }
    80% { transform: translate(calc(var(--sx) * -1), 86cqh) rotate(calc(var(--rot) * .8)); }
    100% { transform: translate(0, 110cqh) rotate(var(--rot)); }
  }
  /* world nodes (camera.svelte.ts places them): a firefly's glow, a present at its foot */
  .node { width: 0; height: 0; pointer-events: none; line-height: 0; }
  .toy .art { position: absolute; left: 0; bottom: 0; translate: -50% 4%; filter: drop-shadow(0 1.5px 1px rgba(80, 50, 20, .3)); }
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
