<script lang="ts">
  // Sky (style guide §S.3–S.4, §S.11): gradient bleeding under the status bar, the sun (high by day,
  // low at dawn / dusk) or the moon + 12 stars (4 twinkle), drifting clouds, the balloon present and
  // event fireworks. The visible band (below the safe area) is a size container named `sky`.
  import type { Snippet } from 'svelte';
  import Clouds from './Clouds.svelte';
  import type { Tod } from './scene.ts';

  interface Props {
    tod: Tod;
    /** One firework burst every 6 s (August Sundays, New Year's Eve). */
    fireworks?: boolean;
    children?: Snippet;
  }
  let { tod, fireworks = false, children }: Props = $props();
  const night = $derived(tod === 'night');
  const low = $derived(tod === 'dawn' || tod === 'dusk');
  // 4 twinkling + 8 still stars (P5: ≤ 24 infinite animations in the scene)
  const STARS = [
    [8, 18], [17, 52], [26, 30], [34, 70], [43, 14], [52, 46], [60, 26], [67, 64], [75, 40], [88, 58], [93, 20], [5, 78]
  ];
</script>

<div class="sky" aria-hidden="true">
  <div class="band">
    {#if night}
      {#each STARS as [x, y], i (i)}
        <svg class="star" class:still={i % 3 !== 0} viewBox="0 0 24 24" style:left="{x}%" style:top="{y}%" style:width="{6 + (i % 3) * 2}px"
          style:animation-duration="{2.4 + (i % 5) * 0.4}s" style:animation-delay="{-i * 0.37}s">
          <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" />
        </svg>
      {/each}
      <svg class="moon" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="30" class="halo" />
        <path d="M34 12 A18 18 0 1 0 48 40 A14 14 0 1 1 34 12 Z" class="disc" />
      </svg>
    {:else}
      <svg class="sun" class:low viewBox="0 0 68 68">
        <circle cx="34" cy="34" r="34" class="halo" />
        <circle cx="34" cy="34" r="22" class="disc" />
      </svg>
    {/if}
    <Clouds {night} />
    {#if fireworks}
      <!-- one burst element (§S.10: 1 burst every 6 s; P5 budget) that moves and changes colour each time -->
      <span class="burst">
        {#each Array.from({ length: 12 }) as _, k (k)}<i style:--a="{k * 30}deg"></i>{/each}
      </span>
    {/if}
    {@render children?.()}
  </div>
</div>

<style>
  .sky {
    position: absolute; inset: 0 0 auto 0; z-index: 0; height: var(--sky-h);
    background: linear-gradient(180deg, var(--sky-top), var(--sky-bottom));
  }
  .band { position: absolute; left: 0; right: 0; top: var(--safe-top); bottom: 8px; container: sky / size; }
  .sun, .moon { position: absolute; right: 18%; top: 18px; width: 68px; height: 68px; translate: 50% 0; }
  .moon { width: 60px; height: 60px; }
  .sun.low { top: auto; bottom: 22%; }
  .sun .halo { fill: var(--sun-disc); opacity: .35; }
  .sun .disc { fill: var(--sun-disc); }
  .moon .halo { fill: var(--moon); opacity: .3; }
  .moon .disc { fill: var(--moon); }
  .star { position: absolute; height: auto; fill: #FFF6D6; animation: if-twinkle 3s var(--ease-idle) infinite; }
  .star.still { animation: none; opacity: .75; }
  .burst { position: absolute; left: 0; top: 0; width: 0; height: 0; animation: burst 18s ease-out infinite; opacity: 0; }
  .burst i {
    position: absolute; left: -3px; top: -3px; width: 6px; height: 6px; border-radius: 50%; background: currentColor;
    transform: rotate(var(--a)) translateY(-34px);
  }
  /* three 6 s beats: pink at (24%, 30%), yellow at (58%, 18%), blue at (40%, 48%) of the sky band */
  @keyframes burst {
    0% { translate: 24cqw 30cqh; color: #FF7FA8; scale: .1; opacity: 0; } 1.3% { opacity: 1; }
    6% { translate: 24cqw 30cqh; scale: 1; opacity: 1; } 7.7% { translate: 24cqw 31cqh; scale: 1.08; opacity: 0; }
    33.2% { translate: 24cqw 30cqh; color: #FF7FA8; opacity: 0; }
    33.3% { translate: 58cqw 18cqh; color: #FFD84D; scale: .1; opacity: 0; } 34.6% { opacity: 1; }
    39.3% { translate: 58cqw 18cqh; scale: 1; opacity: 1; } 41% { translate: 58cqw 19cqh; scale: 1.08; opacity: 0; }
    66.5% { translate: 58cqw 18cqh; color: #FFD84D; opacity: 0; }
    66.6% { translate: 40cqw 48cqh; color: #6FCFF6; scale: .1; opacity: 0; } 67.9% { opacity: 1; }
    72.6% { translate: 40cqw 48cqh; scale: 1; opacity: 1; } 74.3% { translate: 40cqw 49cqh; scale: 1.08; opacity: 0; }
    100% { translate: 40cqw 48cqh; color: #6FCFF6; opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .star { animation: none; opacity: .9; transform: none; }
    .burst { display: none; }
  }
</style>
