<script lang="ts">
  // きろく's flat glyphs (no strokes): the 🔒 of a locked week, the ✎ of a fix.
  let { kind, size = 16, label }: { kind: 'lock' | 'pen'; size?: number; label?: string } = $props();
</script>

<svg class="g {kind}" viewBox="0 0 24 24" width={size} height={size} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}>
  {#if kind === 'lock'}
    <path d="M7 10 V8 a5 5 0 0 1 10 0 V10" fill="none" stroke-width="2.6" />
    <rect x="4.5" y="10" width="15" height="11" rx="3" />
  {:else}
    <path d="M4 20 L5 15 L15.5 4.5 a2.1 2.1 0 0 1 3 0 l1 1 a2.1 2.1 0 0 1 0 3 L9 19 Z" />
  {/if}
</svg>

<style>
  .g { display: inline-block; flex: none; vertical-align: middle; }
  .lock { fill: var(--text-soft); stroke: var(--text-soft); }
  .pen { fill: currentColor; } /* follows the text, so it reads at night too */
</style>
