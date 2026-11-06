<script lang="ts">
  // A classic guide's list (the site's ul.tl, the hour-by-hour timeline with its time column and dots, or ul.bul,
  // the bullets), its rows' small print under them.
  import type { L } from '#lib/travel/types.ts';
  import CText from './CText.svelte';

  let { kind, rows, note }: { kind: 'tl' | 'bul'; rows: readonly { t?: string; text: L; note?: L }[]; note: Record<string, string> | null } = $props();
</script>

{#if kind === 'tl'}
  <ul class="tl">
    {#each rows as r, i (i)}
      <li><span class="time">{r.t ?? ''}</span><span class="dot"></span><span class="txt"><CText l={r.text} {note} />{#if r.note}<small><CText l={r.note} {note} /></small>{/if}</span></li>
    {/each}
  </ul>
{:else}
  <ul class="bul">
    {#each rows as r, i (i)}
      <li><CText l={r.text} {note} />{#if r.note}<small><CText l={r.note} {note} /></small>{/if}</li>
    {/each}
  </ul>
{/if}
