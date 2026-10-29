<script lang="ts">
  // Seasonal particles (style guide §S.9), ≤ 14 on screen, transform/opacity only: cherry-blossom-week petals,
  // autumn maple leaves, winter snow (+ one big flake every 45 s), all official art; summer nights get
  // our fireflies (stage units, so pass mode="fireflies" inside the stage). The falling layer is a size
  // container, so the fall distance is in cqh of the whole scene.
  import OfficialArt from '../OfficialArt.svelte';
  import type { Season } from '#lib/client/theme.svelte.ts';
  import type { Foliage } from '#lib/client/season.ts';
  import { seasonArt } from '../art.ts';
  import { rng, u, type Tod } from './scene.ts';

  interface Props {
    season: Season;
    /** Petals only fall while the cherry blossoms are out, maple leaves once the oaks turn. */
    foliage?: Foliage;
    tod: Tod;
    /** Cherry-blossom / maple week: a few more. */
    festival?: boolean;
    mode?: 'fall' | 'fireflies';
  }
  let { season, foliage = 'green', tod, festival = false, mode = 'fall' }: Props = $props();

  const kind = $derived(
    foliage === 'blossom' && tod !== 'night' ? 'petal' : foliage === 'fall' ? 'maple-leaf' : season === 'winter' ? 'snowflake' : null
  );
  const count = $derived(kind === 'petal' ? (festival ? 14 : 10) : kind === 'maple-leaf' ? (festival ? 12 : 8) : kind === 'snowflake' ? 12 : 0);
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
        fl: 2.2 + r() * 1.6,
        rot: kind === 'maple-leaf' ? 180 + r() * 360 : 40
      };
    });
  });
  const FIREFLIES = [[60, 200], [118, 168], [170, 230], [222, 186], [268, 222], [330, 190], [96, 120], [300, 132]];
</script>

{#if mode === 'fall' && kind}
  <div class="layer" aria-hidden="true">
    {#each items as p, i (i)}
      <span class="p" style:left="{p.x}%" style:animation-duration="{p.dur}s" style:animation-delay="{p.delay}s">
        <span class="i" class:snow={kind === 'snowflake'} style:--rot="{p.rot}deg" style:animation-duration="{p.fl}s" style:animation-delay="{p.delay}s">
          <OfficialArt key={seasonArt(kind)} size="{p.size.toFixed(1)}px" eager />
        </span>
      </span>
    {/each}
    {#if kind === 'snowflake'}
      <span class="p big"><span class="i snow"><OfficialArt key={seasonArt('snowflake-large')} size="22px" /></span></span>
    {/if}
  </div>
{:else if mode === 'fireflies' && season === 'summer' && tod === 'night'}
  {#each FIREFLIES as [x, y], i (i)}
    <span class="ff" style:left={u(x)} style:top={u(y)} style:animation-duration="{3 + (i % 3)}s" style:animation-delay="{-i * 0.7}s"></span>
  {/each}
{/if}

<style>
  .layer { position: absolute; inset: 0; z-index: 70; pointer-events: none; overflow: hidden; container-type: size; }
  .p { position: absolute; top: 0; line-height: 0; animation: fall 10s linear infinite; will-change: transform; }
  .i { display: block; animation: flutter 3s var(--ease-idle) infinite alternate; }
  .i.snow { animation-name: flutter-snow; }
  @keyframes fall { from { transform: translateY(-10cqh); } to { transform: translateY(110cqh); } }
  @keyframes flutter { from { transform: translateX(-18px) rotate(calc(var(--rot) * -0.1)); } to { transform: translateX(18px) rotate(var(--rot)); } }
  @keyframes flutter-snow { from { transform: translateX(-10px); } to { transform: translateX(10px); } }
  .big { left: 0; top: 20%; animation: drift-big 45s linear infinite; animation-delay: -10s; }
  @keyframes drift-big {
    0% { transform: translate(-30px, 0); opacity: 1; } 44% { transform: translate(calc(100cqw + 30px), 30cqh); opacity: 1; }
    44.1%, 100% { transform: translate(-30px, 0); opacity: 0; }
  }
  .ff {
    position: absolute; z-index: 70; width: 4.4px; height: 4.4px; margin: -2.2px; border-radius: 50%;
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
