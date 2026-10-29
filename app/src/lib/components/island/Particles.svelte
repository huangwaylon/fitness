<script lang="ts">
  // Seasonal particles (style guide §S.9), transform/opacity only, ONE animation each (the side-to-side
  // flutter is folded into the fall keyframes; v5 §6: ≤ 3 particles in the idle budget): cherry-blossom
  // petals, autumn maple leaves (2, 3 in festival week), winter snow (3), all official art; summer nights get
  // our fireflies (stage units, so pass mode="fireflies" inside the stage). The falling layer is a size
  // container, so the fall distance is in cqh of the whole scene.
  import OfficialArt from '../OfficialArt.svelte';
  import type { Season } from '#lib/client/theme.svelte.ts';
  import type { Foliage } from '#lib/client/season.ts';
  import { seasonArt } from '#lib/art.ts';
  import { rng, u, type Tod } from './scene.ts';

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
  }
  let { season, foliage = 'green', tod, quiet = false, festival = false, mode = 'fall' }: Props = $props();

  const kind = $derived(
    // leaves and petals rest at night (v5 §6 budget); snow keeps falling
    foliage === 'blossom' && tod !== 'night' ? 'petal' : foliage === 'fall' && tod !== 'night' ? 'maple-leaf' : season === 'winter' ? 'snowflake' : null
  );
  const count = $derived(quiet ? (kind ? 1 : 0) : kind === 'petal' || kind === 'maple-leaf' ? (festival ? 3 : 2) : kind === 'snowflake' ? 3 : 0);
  const items = $derived.by(() => {
    const r = rng(season.length * 97 + count);
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
  const FIREFLIES_ALL = [[60, 200], [268, 222], [104, 132]];
  const FIREFLIES = $derived(quiet ? FIREFLIES_ALL.slice(0, 1) : FIREFLIES_ALL);
</script>

{#if mode === 'fall' && kind}
  <div class="layer" aria-hidden="true">
    {#each items as p, i (i)}
      <span class="p" style:left="{p.x}%" style:animation-duration="{p.dur}s" style:animation-delay="{p.delay}s" style:--rot="{p.rot}deg" style:--sx="{p.sx}px">
        <OfficialArt key={seasonArt(kind)} size="{p.size.toFixed(1)}px" eager />
      </span>
    {/each}
  </div>
{:else if mode === 'fireflies' && season === 'summer' && tod === 'night'}
  {#each FIREFLIES as [x, y], i (i)}
    <span class="ff" style:left={u(x)} style:top={u(y)} style:animation-duration="{3 + (i % 3)}s" style:animation-delay="{-i * 0.7}s"></span>
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
  /* above the time-of-day tint (z 80): fireflies glow */
  .ff {
    position: absolute; z-index: 82; width: 4.4px; height: 4.4px; margin: -2.2px; border-radius: 50%;
    background: var(--firefly); box-shadow: 0 0 6px var(--firefly-glow); pointer-events: none;
    animation: firefly 4s var(--ease-idle) infinite alternate;
  }
  @keyframes firefly {
    0% { transform: translate(0, 0); opacity: .2; } 50% { transform: translate(10px, -14px); opacity: 1; }
    100% { transform: translate(-12px, -4px); opacity: .3; }
  }
  @media (prefers-reduced-motion: reduce) {
    .layer, .ff { display: none; }
  }
</style>
