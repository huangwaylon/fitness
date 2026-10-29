<script lang="ts">
  // Sky (v5 §5): a 2-stop gradient bleeding under the status bar, a flat sun (high by day, low at
  // dawn / dusk) or a flat moon + 10 stars (2 twinkle), two drifting clouds, the balloon present and
  // event fireworks. No halos. The visible band (below the safe area) is a size container named `sky`.
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
  // 2 twinkling + 8 still stars (v5 §6: idle budget ≤ 10)
  const STARS = [
    [8, 18], [17, 52], [26, 30], [34, 70], [43, 14], [52, 46], [60, 26], [67, 64], [88, 58], [5, 78]
  ];
</script>

<div class="sky" aria-hidden="true">
  <div class="band">
    {#if night}
      {#each STARS as [x, y], i (i)}
        <svg class="star" class:still={i !== 2 && i !== 7} viewBox="0 0 24 24" style:left="{x}%" style:top="{y}%" style:width="{6 + (i % 3) * 2}px"
          style:animation-duration="{2.4 + (i % 5) * 0.4}s" style:animation-delay="{-i * 0.37}s">
          <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" />
        </svg>
      {/each}
      <svg class="moon" viewBox="12 12 36 36">
        <path d="M34 12 A18 18 0 1 0 48 40 A14 14 0 1 1 34 12 Z" class="disc" />
      </svg>
    {:else}
      <svg class="sun" class:low viewBox="12 12 44 44">
        <circle cx="34" cy="34" r="22" class="disc" />
      </svg>
    {/if}
    <Clouds />
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
  .sun, .moon { position: absolute; right: 20%; top: 112px; width: 44px; height: 44px; translate: 50% 0; }
  .moon { width: 40px; height: 40px; }
  @container sky (max-height: 160px) { .sun, .moon { top: auto; bottom: 30%; width: 32px; height: 32px; } }
  .sun.low { top: auto; bottom: 22%; }
  .sun .disc { fill: var(--sun-disc); }
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
