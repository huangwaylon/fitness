<svelte:options namespace="svg" />

<script lang="ts">
  // Sea (v5 §5, the NH map look), inside the stage <svg viewBox="0 0 390 360">: one flat fill under a
  // straight horizon with a 3u lighter strip, offset rows of small ▲ marks (6×4u, ~7% coverage, one
  // slow drift: the scene's single sea animation), and the distant islet as a flat sand pad with a
  // foam ring (its palm is an HTML overlay). No gradient, no squiggles, no sparkles, no glint.
  interface Props {
    uid: string;
  }
  let { uid }: Props = $props();
</script>

<defs>
  <!-- 24×14u tile, two marks per tile on offset rows (2 × 12u² / 336u² ≈ 7%: the map's sparse look) -->
  <pattern id="{uid}-marks" width="24" height="14" patternUnits="userSpaceOnUse">
    <path d="M3 7 L6 3 L9 7 Z M15 14 L18 10 L21 14 Z" fill="var(--sea-mark)" />
  </pattern>
</defs>
<rect x="-10" y="-40" width="410" height="410" fill="var(--sea)" />
<g class="marks"><rect x="-40" y="-33" width="470" height="401" fill="url(#{uid}-marks)" /></g>
<rect x="-10" y="-40" width="410" height="3" fill="var(--horizon)" />
<!-- distant islet: a flat sand pad with a 2u foam ring -->
<ellipse cx="345" cy="15" rx="29" ry="7.5" fill="var(--foam)" />
<ellipse cx="345" cy="15" rx="27" ry="6" fill="var(--beach)" />

<style>
  .marks { animation: sea-drift 18s linear infinite; }
  /* one tile per loop, so it wraps seamlessly */
  @keyframes sea-drift { from { transform: translateX(0); } to { transform: translateX(24px); } }
  @media (prefers-reduced-motion: reduce) {
    .marks { animation: none; }
  }
</style>
