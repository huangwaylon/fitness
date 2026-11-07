<script lang="ts">
  // A results page's one headline card (under しずえ's line): the big line (`.big`: my tally, the team's, how far the
  // run got), the lines under it (`.sub`), the 一発 stamp, and who sees it (`note`, 🔒). Every game's results open on
  // this card.
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  let { note, children, ...rest }: { note?: string; children: Snippet } & HTMLAttributes<HTMLDivElement> = $props();
</script>

<div class="score card" {...rest}>
  {@render children()}
  {#if note}<small class="lock">🔒 {note}</small>{/if}
</div>

<style>
  .score { display: grid; justify-items: center; gap: 4px; padding: 12px 16px; text-align: center; background: color-mix(in srgb, var(--c-yuzu) 35%, var(--card)); }
  .score :global(.big) { font: 700 var(--fs-title)/1.25 var(--font-ui); color: var(--text); }
  .score :global(.sub) { font: 700 var(--fs-body)/1.35 var(--font-ui); color: var(--text-soft); }
  .score :global(.stamp) { margin-top: 2px; }
  .lock { font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); text-wrap: pretty; }
</style>
