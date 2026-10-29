<script lang="ts">
  // Sea (round 7, environment-style.md): ONE layer from the horizon down past the bottom edge, so it runs on
  // under the island and behind the bottom chrome. It lives INSIDE the stage (first child), so the scene's
  // multiply tint (IslandScene .tint) darkens land and sea together; it bleeds out to both screen edges.
  //   1. gradient: a 4u horizon haze, then #4C9DE8, then the open NH blue #3D8FE2 (the chrome under 島 is the
  //      same blue through the same tint: tokens.css --sea-flat);
  //   2. glints instead of ▲ marks: white 6 × 1.5u rounded dashes at 40% (~2% coverage), denser near the
  //      horizon; their slow drift is the scene's one sea animation (transform only).
  // The shallow ring and the foam lines hug the beach (Ground.svelte). Sizes follow the stage unit.
  // Position: --if-hy / --if-st are the horizon and the stage top in px (registered lengths set on .stage).
</script>

<div class="sea" aria-hidden="true"><div class="glints"></div></div>

<style>
  .sea {
    --su: calc(100cqw / 390);
    --tile-w: calc(52 * var(--su)); --tile-h: calc(26 * var(--su));
    position: absolute; z-index: 0; pointer-events: none; overflow: hidden;
    top: calc(var(--if-hy) - var(--if-st)); bottom: -100vh; left: -100vw; right: -100vw;
    background: linear-gradient(180deg, var(--sea-haze) 0, var(--sea-haze) calc(3 * var(--su)), var(--sea-mid) calc(16 * var(--su)),
      var(--sea-open) calc(46 * var(--su)));
  }
  /* 52 × 26u tile with three dashes (3 × 9u² / 1352u² ≈ 2%), faded with depth (dense near the horizon) */
  .glints {
    position: absolute; top: calc(5 * var(--su)); height: 100vh; left: calc(-1 * var(--tile-w)); right: 0;
    background: var(--glint); opacity: .4;
    -webkit-mask:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 52 26'%3E%3Crect x='4' y='4' width='6' height='1.5' rx='.75'/%3E%3Crect x='31' y='11' width='6' height='1.5' rx='.75'/%3E%3Crect x='15' y='20' width='6' height='1.5' rx='.75'/%3E%3C/svg%3E") 0 0 / var(--tile-w) var(--tile-h) repeat,
      linear-gradient(180deg, #000 0, rgba(0,0,0,.75) calc(40 * var(--su)), rgba(0,0,0,.35) calc(200 * var(--su)), rgba(0,0,0,.25));
    -webkit-mask-composite: source-in;
    mask:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 52 26'%3E%3Crect x='4' y='4' width='6' height='1.5' rx='.75'/%3E%3Crect x='31' y='11' width='6' height='1.5' rx='.75'/%3E%3Crect x='15' y='20' width='6' height='1.5' rx='.75'/%3E%3C/svg%3E") 0 0 / var(--tile-w) var(--tile-h) repeat,
      linear-gradient(180deg, #000 0, rgba(0,0,0,.75) calc(40 * var(--su)), rgba(0,0,0,.35) calc(200 * var(--su)), rgba(0,0,0,.25));
    mask-composite: intersect;
    animation: sea-drift 26s linear infinite; will-change: transform;
  }
  /* one tile per loop, so it wraps seamlessly */
  @keyframes sea-drift { from { transform: translateX(0); } to { transform: translateX(var(--tile-w)); } }
  @media (prefers-reduced-motion: reduce) {
    .glints { animation: none; }
  }
</style>
