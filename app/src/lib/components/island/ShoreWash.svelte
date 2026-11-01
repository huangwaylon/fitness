<script lang="ts">
  // The front shore's foam wash (docs/design.md "World", spec §5 "Shore wash"): a flat strip over the baked beach,
  // z −24 (sea side, its bottom) … +16 (land side, its top) across world x x0…x1, laid out in world units through
  // --u and flattened onto the ground by the caller. A lacy foam line slides 7u up the sand (1.8 s ease-out), holds
  // 0.6 s and recedes (2.4 s ease-in), a translucent sheet of shallow water under it; the wet band it leaves fades
  // from .5 to 0 as it goes; a second, fainter line runs half a cycle later. CSS only (transform and opacity), paused
  // under a sheet or while hidden.
  let { x0, x1 }: { x0: number; x1: number } = $props();

  const W = $derived(Math.max(1, x1 - x0));
  /** A deterministic jitter (no Math.random: the same strip every render). */
  const rnd = (i: number) => {
    const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  /** The foam line's lace in the strip's units (x across, y down; the line's crest at y 0): a ragged band 1.4…3.6u
   *  thick with holes (even-odd) and loose bubbles behind it. */
  function lace(w: number, seed: number): string {
    const top: string[] = [], bottom: string[] = [];
    const step = 2.2;
    for (let x = 0, i = 0; x <= w + step; x += step, i++) {
      const t = 0.9 * Math.sin((x + seed * 13) / 9) + 0.5 * (rnd(i + seed * 101) - 0.5);
      top.push(`${x.toFixed(1)} ${(t - 0.4 * rnd(i * 3 + seed)).toFixed(2)}`);
      bottom.push(`${x.toFixed(1)} ${(t + 1.4 + 2.2 * rnd(i * 7 + seed * 5)).toFixed(2)}`);
    }
    let d = `M${top.join(' L')} L${bottom.reverse().join(' L')}Z`;
    // holes in the band, and bubbles trailing on the sea side
    for (let i = 0; i < w / 3.2; i++) {
      const x = rnd(i * 11 + seed * 7) * w, r = 0.35 + 0.5 * rnd(i * 13 + seed);
      const y = 0.9 * Math.sin((x + seed * 13) / 9) + 0.6 + 1.6 * rnd(i * 17 + seed * 3);
      d += `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${r.toFixed(2)} ${(r * 0.7).toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${(r * 0.7).toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0Z`;
    }
    for (let i = 0; i < w / 4; i++) {
      const x = rnd(i * 19 + seed * 23) * w, r = 0.25 + 0.4 * rnd(i * 29 + seed);
      const y = 4.4 + 2.6 * rnd(i * 31 + seed * 11);
      d += `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${r.toFixed(2)} ${(r * 0.8).toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${(r * 0.8).toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0Z`;
    }
    return d;
  }
  const laceA = $derived(lace(W, 1));
  const laceB = $derived(lace(W, 2));
</script>

<!-- the strip: 40u tall; the foam's rest line at z −3 (19u from the top), its crest at z +4 (12u) -->
<div class="wash" aria-hidden="true" style:--w={W}>
  <i class="wet"></i>
  {#each [laceA, laceB] as d, k (k)}
    <div class="run" class:b={k === 1}>
      <i class="sheet"></i>
      <svg class="foam" viewBox="0 -1.5 {W} 9" preserveAspectRatio="none"><path {d} fill-rule="evenodd" /></svg>
    </div>
  {/each}
</div>

<style>
  .wash {
    position: relative; width: calc(var(--w) * var(--u)); height: calc(40 * var(--u));
    overflow: hidden; pointer-events: none;
    /* soft at both ends, so the strip melts into the baked shore */
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  }
  .wash i, .run, .foam { position: absolute; display: block; }
  /* the band the water leaves: darker, glossy sand between the rest line and the crest */
  .wet {
    left: 0; right: 0; top: calc(11 * var(--u)); height: calc(9 * var(--u));
    background: linear-gradient(180deg, rgba(150, 104, 52, 0) 0%, rgba(150, 104, 52, .32) 35%, rgba(170, 130, 80, .26) 70%, rgba(150, 104, 52, 0) 100%);
    opacity: 0; animation: wash-wet 4.8s linear infinite;
  }
  /* one run: the foam line with its sheet of water below it, moving together */
  .run {
    left: 0; right: 0; top: calc(19 * var(--u)); height: calc(21 * var(--u));
    animation: wash-run 4.8s infinite;
  }
  .run.b { animation-delay: -2.4s; }
  .run.b .foam, .run.b .sheet { opacity: .5; }
  .sheet {
    left: 0; right: 0; top: calc(1 * var(--u)); bottom: 0;
    background: linear-gradient(180deg, rgba(225, 250, 250, .55), rgba(170, 236, 240, .22) 35%, rgba(126, 221, 230, 0) 75%);
  }
  .foam { left: 0; top: calc(-1.5 * var(--u)); width: 100%; height: calc(9 * var(--u)); fill: #FFFFFF; filter: drop-shadow(0 calc(.4 * var(--u)) 0 rgba(255, 255, 255, .35)); }

  /* up 7u in 1.8 s (ease-out), hold .6 s, back down in 2.4 s (ease-in), thinning as it goes */
  @keyframes wash-run {
    0% { transform: translateY(0); opacity: 0; animation-timing-function: cubic-bezier(.2, .7, .3, 1); }
    8% { opacity: 1; }
    37.5% { transform: translateY(calc(-7 * var(--u))); opacity: 1; animation-timing-function: linear; }
    50% { transform: translateY(calc(-7 * var(--u))); opacity: .95; animation-timing-function: cubic-bezier(.55, 0, .85, .4); }
    100% { transform: translateY(0); opacity: 0; }
  }
  @keyframes wash-wet {
    0%, 37.5% { opacity: 0; }
    50% { opacity: .5; }
    100% { opacity: 0; }
  }
  /* the second run's wet band is the first's, half a cycle on: one band serves both */
  :global([data-covered]) .wash :is(.run, .wet),
  :global([data-paused]) .wash :is(.run, .wet) { animation-play-state: paused; }
  @media (prefers-reduced-motion: reduce) { .wash :is(.run, .wet) { animation: none; } .run.b { display: none; } }
</style>
