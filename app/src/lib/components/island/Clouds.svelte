<script lang="ts">
  // Two flat NH clouds (v5 §5): round lobes on an elliptical base in one flat fill, with a 3u lip
  // (the same shape, darker, offset down). C1 / C2 drift at 140 / 100 s. Clouds keep a lane under the
  // HUD (clock, NookPhone and the score ribbon, ≈ 96px under the band top): top = max(lane, the
  // cloud's %). In short skies (band ≤ 160px) both shrink to small far-off clouds on the horizon.
  // Night: half opacity.
  const CLOUDS: { id: string; w: number; h: number; top: number; dur: number; op: number; delay: number; k?: number; circles: number[][] }[] = [
    { id: 'c1', w: 150, h: 52, top: 30, dur: 140, op: 0.97, delay: 0.3, k: 1.2, circles: [[30, 32, 17], [62, 22, 22], [98, 25, 19], [126, 34, 13]] },
    { id: 'c2', w: 108, h: 38, top: 58, dur: 100, op: 0.93, delay: 0.62, circles: [[24, 24, 13], [50, 15, 15], [76, 20, 13], [93, 27, 9]] }
  ];
</script>

{#each CLOUDS as c (c.id)}
  {@const k = c.k ?? 1}
  <svg class="cloud {c.id}" viewBox="-4 -4 {c.w + 8} {c.h + 11}" style:width="{c.w * k}px" style:--top="{c.top}%"
    style:--op={c.op} style:animation-duration="{c.dur}s" style:animation-delay="{-c.delay * c.dur}s" aria-hidden="true">
    {#each [3, 0] as dy (dy)}
      <g class:lip={dy > 0} transform="translate(0 {dy})">
        <ellipse cx={c.w / 2} cy={c.h * 0.74} rx={c.w / 2} ry={c.h * 0.26} />
        {#each c.circles as [x, y, r], i (i)}<circle cx={x} cy={y} {r} />{/each}
      </g>
    {/each}
  </svg>
{/each}

<style>
  .cloud {
    position: absolute; left: 0; top: max(var(--cloud-lane, 100px), var(--top)); height: auto; overflow: visible;
    opacity: calc(var(--op) * var(--cloud-op, 1)); fill: var(--cloud);
    animation: drift 140s linear infinite; will-change: transform;
  }
  .lip { fill: var(--cloud-lip); }
  @keyframes drift { from { transform: translateX(-110%); } to { transform: translateX(calc(100cqw + 10%)); } }
  /* short skies: two small far-off clouds resting on the horizon (40u above the band's bottom) */
  @container sky (max-height: 160px) {
    .cloud { top: auto; bottom: calc(var(--stage-w, 100cqw) * 40 / 390 - 5px); }
    .c1 { width: 64px !important; }
    .c2 { width: 48px !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    .cloud { animation-play-state: paused; }
  }
</style>
