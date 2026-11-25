<script lang="ts">
  // A logistics card's list (PrepCard, docs/design.md §Trips): `tl` an hour-by-hour timeline (the time down the left in
  // Fredoka, a dot on a dashed spine in the card's colour `--c`, the line and its small print), `bul` bullets.
  import type { Row } from '#lib/travel/types.ts';
  import Txt from './Txt.svelte';

  let { rows, kind, note }: { rows: readonly Row[]; kind: 'tl' | 'bul'; note: Record<string, string> | null } = $props();
</script>

{#if kind === 'tl'}
  <ol class="tl">
    {#each rows as r, i (i)}
      <li class:untimed={!r.t}>
        <span class="t">{r.t}</span>
        <span class="sp" aria-hidden="true"><i></i></span>
        <div class="tx">
          <p class="ln selectable"><Txt l={r.text} {note} /></p>
          {#if r.note}<p class="nt selectable"><Txt l={r.note} {note} /></p>{/if}
        </div>
      </li>
    {/each}
  </ol>
{:else}
  <ul class="bul">
    {#each rows as r, i (i)}
      <li>
        <p class="ln selectable"><Txt l={r.text} {note} /></p>
        {#if r.note}<p class="nt selectable"><Txt l={r.note} {note} /></p>{/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  ol, ul { list-style: none; margin: 0; padding: 0; }
  p { margin: 0; }
  .ln { font-size: .875rem; line-height: 1.4; }
  .nt { margin-top: 1px; font-size: var(--fs-s); line-height: 1.4; color: var(--text-soft); }

  /* the timeline: time | dot on the spine | text; the spine dashed from the first dot down to the last */
  .tl { padding: 4px 12px 0 4px; }
  .tl li { display: grid; grid-template-columns: 48px 14px minmax(0, 1fr); column-gap: 6px; position: relative; }
  .t { text-align: right; padding-top: 7px; font: 600 var(--fs-s)/18px var(--font-num); font-variant-numeric: tabular-nums; color: var(--text-soft); white-space: nowrap; }
  .sp { position: relative; }
  .sp::before { content: ''; position: absolute; left: 6px; top: 0; bottom: 0; border-left: 1.5px dashed var(--c); opacity: .5; }
  li:first-child .sp::before { top: 12px; }
  li:last-child .sp::before { bottom: auto; height: 12px; }
  li:only-child .sp::before { content: none; }
  .sp i { position: absolute; left: 2px; top: 9px; width: 10px; height: 10px; box-sizing: border-box; border-radius: 50%; background: var(--card); border: 2px solid var(--c); }
  .untimed .sp i { width: 6px; height: 6px; left: 4px; top: 11px; border-width: 1.5px; }
  .tx { padding: 5px 0 5px 2px; min-width: 0; }

  /* bullets: a small dot */
  .bul { display: grid; gap: 4px; padding: 2px 0; }
  .bul li { position: relative; padding-left: 14px; }
  .bul li::before { content: ''; position: absolute; left: 2px; top: .6em; width: 5px; height: 5px; border-radius: 50%; background: var(--edge); }
</style>
