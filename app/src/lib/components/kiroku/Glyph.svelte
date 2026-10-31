<script lang="ts">
  // The flat ✎ (no strokes) on the controls that change something: the goals, the menu.
  let { kind, size = 16, label }: { kind: 'pen'; size?: number; label?: string } = $props();
</script>

<svg class="g {kind}" viewBox="0 0 24 24" width={size} height={size} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}>
  <path d="M4 20 L5 15 L15.5 4.5 a2.1 2.1 0 0 1 3 0 l1 1 a2.1 2.1 0 0 1 0 3 L9 19 Z" />
</svg>

<style>
  .g { display: inline-block; flex: none; vertical-align: middle; }
  .pen { fill: currentColor; } /* follows the text, so it reads at night too */
</style>
