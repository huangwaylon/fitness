<script lang="ts">
  // A guide card's figures (a flight's times, the Jimny's bill, a dive's plan): a two-column grid of small labels over
  // their values, on a soft strip.
  import type { Stat } from '#lib/travel/types.ts';
  import Txt from './Txt.svelte';

  let { stats, note }: { stats: readonly Stat[]; note: Record<string, string> | null } = $props();
</script>

<dl class="stats">
  {#each stats as s, i (i)}
    <div><dt><Txt l={s.k} {note} /></dt><dd><Txt l={s.v} {note} /></dd></div>
  {/each}
</dl>

<style>
  .stats { margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; border-radius: var(--r-btn); overflow: hidden; background: var(--lip); }
  .stats div { padding: 8px 12px 9px; background: color-mix(in srgb, var(--surface) 55%, var(--card)); }
  dt { font: 700 var(--fs-xs)/1.3 var(--font-ui); color: var(--text-soft); letter-spacing: .02em; }
  dd { margin: 2px 0 0; font: 700 var(--fs-body)/1.35 var(--font-ui); }
  /* an odd last one spans the row */
  .stats div:last-child:nth-child(odd) { grid-column: 1 / -1; }
</style>
