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
  const BURSTS = [
    { x: 24, y: 30, c: '#FF7FA8', d: 0 },
    { x: 58, y: 18, c: '#FFD84D', d: -2 },
    { x: 40, y: 48, c: '#6FCFF6', d: -4 }
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
      {#each BURSTS as b, i (i)}
        <span class="burst" style:left="{b.x}%" style:top="{b.y}%" style:--c={b.c} style:animation-delay="{b.d}s">
          {#each Array.from({ length: 12 }) as _, k (k)}<i style:--a="{k * 30}deg"></i>{/each}
        </span>
      {/each}
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
  .burst { position: absolute; width: 0; height: 0; animation: burst 6s ease-out infinite; opacity: 0; }
  .burst i {
    position: absolute; left: -3px; top: -3px; width: 6px; height: 6px; border-radius: 50%; background: var(--c);
    transform: rotate(var(--a)) translateY(-34px);
  }
  @keyframes burst {
    0% { transform: scale(.1); opacity: 0; } 4% { opacity: 1; } 18% { transform: scale(1); opacity: 1; }
    23% { transform: scale(1.08) translateY(4px); opacity: 0; } 100% { opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .star { animation: none; opacity: .9; transform: none; }
    .burst { display: none; }
  }
</style>
