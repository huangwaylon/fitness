<script lang="ts">
  // NH cumulus clouds (style guide §S.4), ours: long, soft, flat-bottomed, with a lavender underside
  // band and a faint 1.04× halo copy behind. C1 / C2 / C3 drift at 140 / 100 / 75 s; C2 needs ≥ 70px of
  // sky, C3 ≥ 120px (container query on the sky band). Night: C1 + C2 only, at half opacity.
  interface Props {
    night?: boolean;
  }
  let { night = false }: Props = $props();
  const uid = $props.id();

  // [width, height, top % of the visible sky, duration s, opacity, delay fraction, circles]
  const CLOUDS = [
    { id: 'c1', w: 150, h: 46, top: 14, dur: 140, op: 0.96, delay: 0.3, circles: [[30, 27, 15], [62, 19, 19], [97, 22, 16], [125, 29, 11]] },
    { id: 'c2', w: 108, h: 34, top: 46, dur: 100, op: 0.92, delay: 0.62, circles: [[24, 20, 11], [48, 13, 13], [74, 17, 11], [92, 22, 8]] },
    { id: 'c3', w: 72, h: 24, top: 72, dur: 75, op: 0.88, delay: 0.15, circles: [[17, 14, 8], [34, 9, 9], [52, 13, 7]] }
  ];
</script>

{#each night ? CLOUDS.slice(0, 2) : CLOUDS as c (c.id)}
  {@const baseH = c.h * 0.4}
  <svg class="cloud {c.id}" viewBox="-4 -4 {c.w + 8} {c.h + 8}" style:width="{c.w}px" style:top="{c.top}%"
    style:--op={c.op} style:animation-duration="{c.dur}s" style:animation-delay="{-c.delay * c.dur}s" aria-hidden="true">
    <defs>
      <clipPath id="{uid}-{c.id}"><rect x="-4" y="-4" width={c.w + 8} height={c.h * 0.68 + 4} /></clipPath>
      <g id="{uid}-{c.id}-s">
        <rect x="0" y={c.h - baseH} width={c.w} height={baseH} rx={baseH / 2} />
        {#each c.circles as [x, y, r], i (i)}<circle cx={x} cy={y} {r} />{/each}
      </g>
    </defs>
    <use href="#{uid}-{c.id}-s" class="halo" transform="translate({c.w / 2} {c.h}) scale(1.04) translate({-c.w / 2} {-c.h})" />
    <use href="#{uid}-{c.id}-s" class="shade" />
    <use href="#{uid}-{c.id}-s" class="top" clip-path="url(#{uid}-{c.id})" />
  </svg>
{/each}

<style>
  .cloud {
    position: absolute; left: 0; height: auto; overflow: visible; opacity: calc(var(--op) * var(--cloud-op, 1));
    animation: drift 140s linear infinite; will-change: transform;
  }
  .halo { fill: var(--cloud); opacity: .35; }
  .shade { fill: var(--cloud-shade); }
  .top { fill: var(--cloud); }
  @keyframes drift { from { transform: translateX(-110%); } to { transform: translateX(calc(100cqw + 10%)); } }
  @container sky (max-height: 70px) { .c2 { display: none; } }
  @container sky (max-height: 120px) { .c3 { display: none; } }
  @media (prefers-reduced-motion: reduce) {
    .cloud { animation-play-state: paused; }
  }
</style>
