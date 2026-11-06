<script lang="ts">
  // A card's figures (a flight's times, a rental's bill, a hike's distance and climb): key · value rows on stitches
  // (the kit's .row.kv, inside a .card.dense); a label or value our own string, or the guide's text.
  import type { L } from '#lib/travel/types.ts';
  import Txt from './Txt.svelte';

  type Cell = L | string;
  let { stats, note }: { stats: readonly { k: Cell; v: Cell }[]; note: Record<string, string> | null } = $props();
</script>

{#snippet cell(c: Cell)}{#if typeof c === 'string'}{c}{:else}<Txt l={c} {note} />{/if}{/snippet}

<dl class="stats">
  {#each stats as s, i (i)}
    <div class="row kv"><dt>{@render cell(s.k)}</dt><dd>{@render cell(s.v)}</dd></div>
  {/each}
</dl>

<style>
  .stats { margin: 0; }
  .kv { min-height: 0; padding: 7px 12px; }
  dd { margin: 0; font-size: .875rem; }
</style>
