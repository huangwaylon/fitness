<script lang="ts">
  // A guide's list (docs/design.md §Trips): `tl` an hour-by-hour timeline (the time down the left in Fredoka, a dot on
  // a dashed spine in the day's colour `--c`, the line and its small print), `bul` bullets. `mark`: the row that is
  // now (the trip's own clock, when.ts rowNow): its dot big and filled, its time in the day's colour, the rows before
  // it quiet; or the next to come (「次」). A row on another date than its day's (`dd`) says so over its time:
  // 「前日」 / 「翌日」.
  import type { DayRow, Row } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Txt from './Txt.svelte';
  import { dateOn } from './dates.ts';

  interface Props {
    rows: readonly (Row | DayRow)[];
    kind: 'tl' | 'bul';
    note: Record<string, string> | null;
    /** The row to mark: now, or the next to come. */
    mark?: { i: number; next: boolean } | null;
    /** The day's date (a timeline with `dd` rows). */
    date?: string;
  }
  let { rows, kind, note, mark = null, date }: Props = $props();
  const dd = (r: Row | DayRow) => ('dd' in r ? r.dd : undefined);
  const ddLabel = (n: -1 | 1) => t(n < 0 ? 'travel.ddEve' : 'travel.ddNext', { d: date ? dateOn(date, n, i18n.locale) : '' });
</script>

{#if kind === 'tl'}
  <ol class="tl">
    {#each rows as r, i (i)}
      {@const m = mark?.i === i ? (mark.next ? 'next' : 'now') : null}
      {@const gone = !!mark && i < mark.i}
      {@const off = dd(r)}
      <li class:now={m === 'now'} class:next={m === 'next'} class:gone class:untimed={!r.t} data-row={i} data-now={m === 'now' || undefined} data-next={m === 'next' || undefined} aria-current={m === 'now' ? 'time' : undefined}>
        <span class="t">{#if off}<small class="dd">{ddLabel(off)}</small>{/if}{r.t}</span>
        <span class="sp" aria-hidden="true"><i></i></span>
        <div class="tx">
          <p class="ln">{#if m === 'next'}<b class="tag nx">{t('travel.next')}</b>{/if}<Txt l={r.text} {note} /></p>
          {#if r.note}<p class="nt"><Txt l={r.note} {note} /></p>{/if}
        </div>
      </li>
    {/each}
  </ol>
{:else}
  <ul class="bul">
    {#each rows as r, i (i)}
      <li>
        <p class="ln"><Txt l={r.text} {note} /></p>
        {#if r.note}<p class="nt"><Txt l={r.note} {note} /></p>{/if}
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
  .dd { display: block; font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--coral-text); margin-top: -2px; }
  .sp { position: relative; }
  .sp::before { content: ''; position: absolute; left: 6px; top: 0; bottom: 0; border-left: 1.5px dashed var(--c); opacity: .5; }
  li:first-child .sp::before { top: 12px; }
  li:last-child .sp::before { bottom: auto; height: 12px; }
  li:only-child .sp::before { content: none; }
  .sp i { position: absolute; left: 2px; top: 9px; width: 10px; height: 10px; box-sizing: border-box; border-radius: 50%; background: var(--card); border: 2px solid var(--c); }
  :global(:root[data-tod='night']) .sp i, :global(:root[data-tod='night']) .sp::before { filter: brightness(1.3); }
  .untimed .sp i { width: 6px; height: 6px; left: 4px; top: 11px; border-width: 1.5px; }
  .tx { padding: 5px 0 5px 2px; min-width: 0; }
  /* gone by (today's rows before the one that is now): quiet */
  .gone .t, .gone .ln { color: var(--text-soft); }
  .gone .sp i { background: var(--c); opacity: .45; }
  /* now: a big filled dot with a soft ring, its time in the day's colour */
  .now .sp i { left: 0; top: 7px; width: 14px; height: 14px; background: var(--c); border: 0; box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 22%, transparent); }
  .now .t { color: var(--c); }
  .now .ln { font-weight: 600; }
  .nx { margin-right: 6px; color: var(--leaf-text); vertical-align: 1px; }

  /* bullets: a small dot */
  .bul { display: grid; gap: 4px; padding: 2px 0; }
  .bul li { position: relative; padding-left: 14px; }
  .bul li::before { content: ''; position: absolute; left: 2px; top: .6em; width: 5px; height: 5px; border-radius: 50%; background: var(--edge); }
</style>
