<script lang="ts">
  // Two soft clouds (design.md "Environment"): the round lobes on an elliptical base, filled with ONE
  // vertical gradient (white to 55%, a pale-blue underside below; tinted per time of day in tokens.css), no
  // lip. C1 / C2 drift at 140 / 100 s (transform only). Sizes: 120 / 86px at 393, 100 / 72 compact, 64 / 48 at
  // 320. Lanes: C1 just under the HUD (top = max(--cloud-lane, 26%)), C2 lower, over the horizon cloud bank, so the sun
  // (Sky.svelte, upper left at 58% and drawn above them) is never hidden. Short skies (band ≤ 190px): both rest
  // just above the horizon as small far-off clouds. Night: --cloud-op.
  const uid = $props.id();
  const CLOUDS: { id: string; w: number; h: number; dur: number; op: number; delay: number; circles: number[][] }[] = [
    { id: 'c1', w: 150, h: 52, dur: 140, op: 0.97, delay: 0.3, circles: [[30, 32, 17], [62, 22, 22], [98, 25, 19], [126, 34, 13]] },
    { id: 'c2', w: 108, h: 38, dur: 100, op: 0.93, delay: 0.62, circles: [[24, 24, 13], [50, 15, 15], [76, 20, 13], [93, 27, 9]] }
  ];
</script>

{#each CLOUDS as c (c.id)}
  <svg class="cloud {c.id}" viewBox="-4 -4 {c.w + 8} {c.h + 8}" style:--op={c.op} style:animation-duration="{c.dur}s"
    style:animation-delay="{-c.delay * c.dur}s" aria-hidden="true">
    <defs>
      <linearGradient id="{uid}-{c.id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={c.h}>
        <stop offset="0" style:stop-color="var(--cloud-top)" /><stop offset=".55" style:stop-color="var(--cloud-top)" />
        <stop offset=".8" style:stop-color="var(--cloud-mid)" /><stop offset="1" style:stop-color="var(--cloud-under)" />
      </linearGradient>
    </defs>
    <g fill="url(#{uid}-{c.id})">
      <ellipse cx={c.w / 2} cy={c.h * 0.74} rx={c.w / 2} ry={c.h * 0.26} />
      {#each c.circles as [x, y, r], i (i)}<circle cx={x} cy={y} {r} />{/each}
    </g>
  </svg>
{/each}

<style>
  .cloud {
    position: absolute; left: 0; height: auto; overflow: visible;
    opacity: calc(var(--op) * var(--cloud-op, 1));
    animation: drift 140s linear infinite; will-change: transform;
  }
  .c1 { width: 120px; top: max(var(--cloud-lane, 100px), 26%); }
  .c2 { width: 86px; top: auto; bottom: 30%; }
  @media (max-height: 700px), (max-width: 359px) { .c1 { width: 100px; } .c2 { width: 72px; } }
  @keyframes drift { from { transform: translateX(-110%); } to { transform: translateX(calc(100cqw + 10%)); } }
  /* short skies: two small far-off clouds resting just above the horizon (the band's bottom) */
  @container sky (max-height: 190px) {
    .c1 { top: auto; bottom: 6px; }
    .c2 { bottom: 26%; }
  }
  @media (max-width: 339px) { .c1 { width: 64px; } .c2 { width: 48px; } }
  /* reduced motion: still clouds, placed clear of the sun (the global rule would park them off screen) */
  @media (prefers-reduced-motion: reduce) {
    .cloud { animation: none !important; }
    .c1 { left: 36%; }
    .c2 { left: 62%; }
  }
</style>
