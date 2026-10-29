<script lang="ts">
  // NH cumulus clouds (style guide §S.4, A10), ours: tall round lobes on a soft elliptical base, a
  // gradient underside (no hard band, no pill base) and a faint 1.04× halo copy behind. C1 is 1.4×
  // (A8). C1 / C2 / C3 drift at 140 / 100 / 75 s; C2 needs ≥ 70px of sky, C3 ≥ 120px (container query
  // on the sky band). Night: C1 + C2 only, at half opacity.
  // C8: clouds drift across the whole width, so they keep a lane below the status row (date pill and
  // phone button, ≈ 54px under the band top): top = max(54px, the cloud's %). In short skies (≤ 120px,
  // compact / tiny) C1 shrinks and C2 needs ≥ 100px; a cloud's foot may tuck behind the far sea.
  interface Props {
    night?: boolean;
  }
  let { night = false }: Props = $props();
  const uid = $props.id();

  // [width, height, top % of the visible sky, duration s, opacity, delay fraction, circles]
  const CLOUDS: { id: string; w: number; h: number; top: number; dur: number; op: number; delay: number; k?: number; circles: number[][] }[] = [
    { id: 'c1', w: 150, h: 52, top: 20, dur: 140, op: 0.97, delay: 0.3, k: 1.4, circles: [[30, 32, 17], [62, 22, 22], [98, 25, 19], [126, 34, 13]] },
    { id: 'c2', w: 108, h: 38, top: 46, dur: 100, op: 0.93, delay: 0.62, circles: [[24, 24, 13], [50, 15, 15], [76, 20, 13], [93, 27, 9]] },
    { id: 'c3', w: 72, h: 27, top: 72, dur: 75, op: 0.9, delay: 0.15, circles: [[18, 17, 9], [35, 11, 11], [53, 16, 8]] }
  ];
</script>

{#each night ? CLOUDS.slice(0, 2) : CLOUDS as c (c.id)}
  {@const k = c.k ?? 1}
  <svg class="cloud {c.id}" viewBox="-4 -4 {c.w + 8} {c.h + 8}" style:width="{c.w * k}px" style:--top="{c.top}%"
    style:--op={c.op} style:animation-duration="{c.dur}s" style:animation-delay="{-c.delay * c.dur}s" aria-hidden="true">
    <defs>
      <linearGradient id="{uid}-{c.id}-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={c.h}>
        <stop offset=".45" stop-color="var(--cloud)" /><stop offset="1" stop-color="var(--cloud-shade)" />
      </linearGradient>
      <g id="{uid}-{c.id}-s">
        <!-- soft rounded base (an ellipse, never a pill) under tall lobes (~60% of the height) -->
        <ellipse cx={c.w / 2} cy={c.h * 0.74} rx={c.w / 2} ry={c.h * 0.26} />
        {#each c.circles as [x, y, r], i (i)}<circle cx={x} cy={y} {r} />{/each}
      </g>
    </defs>
    <use href="#{uid}-{c.id}-s" class="halo" transform="translate({c.w / 2} {c.h}) scale(1.04) translate({-c.w / 2} {-c.h})" />
    <use href="#{uid}-{c.id}-s" fill="url(#{uid}-{c.id}-g)" />
  </svg>
{/each}

<style>
  .cloud {
    position: absolute; left: 0; top: max(var(--cloud-lane, 54px), var(--top)); height: auto; overflow: visible;
    opacity: calc(var(--op) * var(--cloud-op, 1));
    animation: drift 140s linear infinite; will-change: transform;
  }
  .halo { fill: var(--cloud); opacity: .35; }
  @keyframes drift { from { transform: translateX(-110%); } to { transform: translateX(calc(100cqw + 10%)); } }
  @container sky (max-height: 120px) { .c3 { display: none; } .c1 { width: 120px !important; } }
  @container sky (max-height: 100px) { .c2 { display: none; } }
  @media (prefers-reduced-motion: reduce) {
    .cloud { animation-play-state: paused; }
  }
</style>
