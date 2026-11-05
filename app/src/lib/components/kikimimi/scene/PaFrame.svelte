<script lang="ts">
  // The PA channel (docs/kikimimi.md "Visuals"): a horn speaker on its bracket with reverb ripples while it plays (still
  // under reduced motion), and the empty 「♪…」 echoed three times fading, the clip's bar under it. Pure CSS/SVG.
  import ClipBar from './ClipBar.svelte';

  let { bar, now }: { bar: { from: number; until: number; key: string } | null; now: number } = $props();
</script>

<div class="pa" class:live={!!bar} data-kiki-frame="pa">
  <svg class="horn" viewBox="0 0 120 90" aria-hidden="true">
    <rect x="2" y="14" width="8" height="40" rx="3" fill="#8a6f55" />
    <path d="M10 34h8" stroke="#8a6f55" stroke-width="6" stroke-linecap="round" />
    <path d="M16 36 l14 -10 v38 l-14 -10 z" fill="#fff3d6" />
    <path d="M28 24 L52 10 Q58 45 52 80 L28 66 Z" fill="#fff9e3" stroke="#937047" stroke-width="3" stroke-linejoin="round" />
    <ellipse cx="53" cy="45" rx="6" ry="35" fill="#e0c48a" stroke="#937047" stroke-width="3" />
    <path class="ring" d="M66 25 Q76 45 66 65" />
    <path class="ring" d="M80 15 Q95 45 80 75" />
    <path class="ring" d="M95 6 Q114 45 95 84" />
  </svg>
  <div class="echo">
    <span aria-hidden="true">♪…</span><span aria-hidden="true">♪…</span><span aria-hidden="true">♪…</span>
    <ClipBar {bar} {now} />
  </div>
</div>

<style>
  .pa { position: absolute; inset: 0; z-index: 1; display: flex; align-items: center; gap: 10px; padding: 34px 18px 18px; }
  .horn { width: 120px; height: 90px; flex: none; }
  .ring { fill: none; stroke: var(--c-edge); stroke-linecap: round; stroke-width: 5; opacity: .35; transform-origin: 34px 45px; }
  .live .ring { opacity: .9; animation: ripple 1.6s ease-in-out infinite; }
  .live .ring:nth-of-type(2) { animation-delay: .25s; opacity: .65; }
  .live .ring:nth-of-type(3) { animation-delay: .5s; opacity: .4; }
  .echo {
    display: grid; gap: 2px; min-width: 120px; padding: 8px 14px 10px; border-radius: 20px; background: color-mix(in srgb, var(--c-cream) 86%, transparent);
    box-shadow: 0 var(--lip-h) 0 var(--c-lip); font: 700 var(--fs-talk)/1.1 var(--font-ui); color: var(--c-ink); letter-spacing: .1em;
  }
  .echo span:nth-child(2) { opacity: .6; translate: 12px 0; }
  .echo span:nth-child(3) { opacity: .3; translate: 24px 0; }
  @keyframes ripple { from { transform: scale(.9); } to { transform: scale(1.06); } }
  @media (prefers-reduced-motion: reduce) { .live .ring { animation: none; } }
</style>
