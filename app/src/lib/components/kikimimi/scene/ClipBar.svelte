<script lang="ts">
  // A clip's progress bar (the bubble's, a frame's): it fills over the clip from `from` to `until` (the relay's clock),
  // as a CSS animation started `now - from` in (no frame loop). Empty while nothing plays. `height`: px (the bubble's 8).
  let { bar, now, height = 6 }: { bar: { from: number; until: number; key: string } | null; now: number; height?: number } = $props();
</script>

<span class="track" aria-hidden="true" style:height="{height}px">
  {#if bar}{#key bar.key}<i style:animation-duration="{Math.max(1, bar.until - bar.from)}ms" style:animation-delay="{-Math.max(0, now - bar.from)}ms"></i>{/key}{/if}
</span>

<style>
  .track { position: relative; display: block; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-edge) 25%, transparent); overflow: hidden; }
  .track i { position: absolute; inset: 0; transform-origin: 0 50%; background: var(--c-leaf); border-radius: inherit; animation: grow linear both; }
  @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
</style>
