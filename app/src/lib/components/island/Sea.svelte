<script lang="ts">
  // Sea (v5 §5, the NH map look; round 6): ONE flat sea layer for the whole scene, from the horizon down
  // to the bottom edge, so the ▲ marks continue under the island and behind the bottom chrome (F10).
  // A straight horizon with a 3u lighter strip, offset rows of small ▲ marks (6×4u, ~7% coverage) and
  // one slow drift (the scene's single sea animation). No gradient, squiggles, sparkles or islet.
  // Colours come from the one time-of-day sea table in tokens.css (--sea-flat / --sea-mark / --horizon).
  // Sizes follow the stage unit (--stage-w / 390), so the marks match the island's scale.
</script>

<div class="sea" aria-hidden="true"><div class="marks"></div></div>

<style>
  .sea {
    --su: calc(var(--stage-w) / 390);
    --tile-w: calc(24 * var(--su)); --tile-h: calc(14 * var(--su));
    position: absolute; left: 0; right: 0; top: var(--horizon-y); bottom: 0; z-index: 0; overflow: hidden;
    background: var(--sea-flat);
  }
  .sea::before {
    content: ''; position: absolute; inset: 0 0 auto 0; height: calc(3 * var(--su)); z-index: 1; background: var(--horizon);
  }
  /* 24×14u tile, two marks per tile on offset rows (2 × 12u² / 336u² ≈ 7%: the map's sparse look) */
  .marks {
    position: absolute; top: calc(4 * var(--su)); bottom: 0; left: calc(-1 * var(--tile-w)); right: 0;
    background: var(--sea-mark);
    -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 14'%3E%3Cpath d='M3 7 L6 3 L9 7 Z M15 14 L18 10 L21 14 Z'/%3E%3C/svg%3E") 0 0 / var(--tile-w) var(--tile-h) repeat;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 14'%3E%3Cpath d='M3 7 L6 3 L9 7 Z M15 14 L18 10 L21 14 Z'/%3E%3C/svg%3E") 0 0 / var(--tile-w) var(--tile-h) repeat;
    animation: sea-drift 18s linear infinite; will-change: transform;
  }
  /* one tile per loop, so it wraps seamlessly */
  @keyframes sea-drift { from { transform: translateX(0); } to { transform: translateX(var(--tile-w)); } }
  @media (prefers-reduced-motion: reduce) {
    .marks { animation: none; }
  }
</style>
