<script lang="ts">
  // Two soft clouds (design.md "Environment"): the round lobes on an elliptical base, filled with ONE
  // vertical gradient (white to 55%, a pale-blue underside below; tinted per time of day in tokens.css), no
  // lip. C1 / C2 drift at 140 / 100 s (transform only). Sizes: 120 / 86px at 393, 100 / 72 compact, 64 / 48 at
  // 320. Lanes keep clear of the HUD at the band's top: in a tall sky C1 high (6% down), C2 low, over the horizon
  // cloud bank (12% up); as the sky shortens (a pinch out, the far end: the horizon rises) C1 slides down to rest
  // just above the horizon and C2 up to near the top, each continuously with the band's height (no lane switch at a
  // size: a container query swapped them at 190px, so they jumped as a pinch crossed it and back on its release,
  // the user's 2026-11-28). The sun (Sky.svelte, low at the left) is drawn above them. Night: --cloud-op.
  import { holdCloud } from './clouds.ts';
  const uid = $props.id();
  const CLOUDS: { id: string; w: number; h: number; dur: number; op: number; delay: number; circles: number[][] }[] = [
    { id: 'c1', w: 150, h: 52, dur: 140, op: 0.97, delay: 0.3, circles: [[30, 32, 17], [62, 22, 22], [98, 25, 19], [126, 34, 13]] },
    { id: 'c2', w: 108, h: 38, dur: 100, op: 0.93, delay: 0.62, circles: [[24, 24, 13], [50, 15, 15], [76, 20, 13], [93, 27, 9]] }
  ];
</script>

{#each CLOUDS as c (c.id)}
  <svg {@attach holdCloud} class="cloud {c.id}" viewBox="-4 -4 {c.w + 8} {c.h + 8}" style:--op={c.op} style:animation-duration="{c.dur}s"
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
  /* --cw: its width; its height is the viewBox's ratio of it (c1 60/158, c2 46/116) */
  .c1 { --cw: 120px; width: var(--cw); top: auto; bottom: max(6px, calc(94% - var(--cw) * 0.38)); }
  .c2 { --cw: 86px; width: var(--cw); top: clamp(4%, calc(88% - var(--cw) * 0.4), 100%); }
  @media (max-height: 700px), (max-width: 359px) { .c1 { --cw: 100px; } .c2 { --cw: 72px; } }
  @keyframes drift { from { transform: translateX(-110%); } to { transform: translateX(calc(100cqw + 10%)); } }
  @media (max-width: 339px) { .c1 { --cw: 64px; } .c2 { --cw: 48px; } }
</style>
