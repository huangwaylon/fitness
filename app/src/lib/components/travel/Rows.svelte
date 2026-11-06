<script lang="ts">
  // A guide's list (docs/design.md §Trips): `tl` an hour-by-hour timeline (the time in the numbers' font down the
  // left, a dot on the line, the line and its small print), `bul` bullets. `mark`: the row that is now (the trip's own
  // clock, when.ts rowNow), lit yuzu with 「いま」, or the next to come with 「つぎ」. A row on another date than its
  // day's (`dd`) says so over its time: 「前日」 / 「翌日」, the date in English ('Feb 10').
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
      {@const off = dd(r)}
      <li class:now={m === 'now'} class:next={m === 'next'} class:untimed={!r.t} data-row={i} data-now={m === 'now' || undefined} data-next={m === 'next' || undefined} aria-current={m === 'now' ? 'time' : undefined}>
        <span class="t">{#if r.t}{#if off}<small class="dd">{ddLabel(off)}</small>{/if}<span class="money">{r.t}</span>{/if}</span>
        <span class="dot" aria-hidden="true"></span>
        <div class="body">
          <p class="tx">{#if m}<b class="pill">{t(m === 'now' ? 'travel.now' : 'travel.next')}</b>{/if}<Txt l={r.text} {note} /></p>
          {#if r.note}<p class="nt"><Txt l={r.note} {note} /></p>{/if}
        </div>
      </li>
    {/each}
  </ol>
{:else}
  <ul class="bul">
    {#each rows as r, i (i)}
      <li>
        <p class="tx"><Txt l={r.text} {note} /></p>
        {#if r.note}<p class="nt"><Txt l={r.note} {note} /></p>{/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  ol, ul { list-style: none; margin: 0; padding: 0; }
  p { margin: 0; }
  .tx { font: 700 var(--fs-body)/1.45 var(--font-ui); }
  .nt { margin-top: 2px; font: 500 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }

  /* the timeline: time | dot on the line | text. The line runs through every row's dot column, from the first dot
     down to the last */
  .tl { display: grid; }
  .tl li { position: relative; display: grid; grid-template-columns: 3.5em 16px minmax(0, 1fr); column-gap: 8px; padding: 7px 8px 9px 6px; border-radius: var(--r-btn); }
  .tl li::before {
    content: ''; position: absolute; left: calc(6px + 3.5em + 8px + 7px); width: 2px; top: 0; bottom: 0; background: var(--lip);
  }
  .tl li:first-child::before { top: 15px; }
  .tl li:last-child::before { bottom: calc(100% - 15px); }
  .tl li:only-child::before { content: none; }
  .t { text-align: right; padding-top: 2px; font-size: var(--fs-body); color: var(--text); white-space: nowrap; }
  .t .money { font-size: var(--fs-body); line-height: 1.3; }
  .dd { display: block; margin-bottom: 1px; font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--coral-text); }
  .dot {
    position: relative; z-index: 1; justify-self: center; margin-top: 6px; width: 12px; height: 12px; border-radius: 50%; box-sizing: border-box;
    background: var(--card); box-shadow: inset 0 0 0 3px var(--c-leaf);
  }
  .untimed .dot { margin-top: 8px; width: 8px; height: 8px; box-shadow: inset 0 0 0 2px var(--lip); }
  /* now: the row yuzu-lit, its dot filled, 「いま」 before its line; next: only 「つぎ」 (the dot as ever) */
  .tl li.now { background: var(--hl); }
  .next .pill { background: var(--ctl); box-shadow: 0 2px 0 var(--lip); color: var(--text); }
  .now .dot { background: var(--c-yuzu); box-shadow: 0 0 0 3px var(--c-yuzu-lip); animation: beat 1.6s var(--ease-idle) infinite; }
  @keyframes beat { 50% { transform: scale(1.25); } }
  .pill {
    display: inline-block; margin-right: 6px; padding: 2px 8px; border-radius: var(--r-pill); vertical-align: 1px;
    background: var(--c-yuzu); color: var(--c-ink); font: 700 var(--fs-xs)/1.3 var(--font-ui); box-shadow: 0 2px 0 var(--c-yuzu-lip);
  }

  /* bullets: a small leaf dot */
  .bul { display: grid; gap: 8px; padding: 2px 4px; }
  .bul li { position: relative; padding-left: 18px; }
  .bul li::before { content: ''; position: absolute; left: 3px; top: .62em; width: 7px; height: 7px; border-radius: 50%; background: var(--c-leaf); }
  @media (prefers-reduced-motion: reduce) { .now .dot { animation: none; } }
</style>
