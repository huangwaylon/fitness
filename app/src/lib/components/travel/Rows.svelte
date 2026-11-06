<script lang="ts">
  // A guide's list (docs/travel.md "The sheet"): `tl` an hour-by-hour timeline (the time in the numbers' font down the
  // left, a dot on the line, the line and its small print), `bul` bullets. `now`: the row that is now (the trip's own
  // clock, when.ts currentRow), marked yuzu with 「いま」. A row on another date than its day's (`dd`) says so by its
  // time (−1 / +1, as a ticket does).
  import type { DayRow, Row } from '#lib/travel/types.ts';
  import { t } from '#lib/i18n/index.ts';
  import Txt from './Txt.svelte';

  interface Props {
    rows: readonly (Row | DayRow)[];
    kind: 'tl' | 'bul';
    note: Record<string, string> | null;
    /** The index of the row that is now. */
    now?: number | null;
  }
  let { rows, kind, note, now = null }: Props = $props();
  const dd = (r: Row | DayRow) => ('dd' in r ? r.dd : undefined);
</script>

{#if kind === 'tl'}
  <ol class="tl">
    {#each rows as r, i (i)}
      <li class:now={now === i} class:untimed={!r.t} data-row={i} data-now={now === i || undefined} aria-current={now === i ? 'time' : undefined}>
        <span class="t">{#if r.t}<span class="money">{r.t}</span>{#if dd(r)}<sup>{dd(r)! > 0 ? '+1' : '−1'}</sup>{/if}{/if}</span>
        <span class="dot" aria-hidden="true"></span>
        <div class="body">
          <p class="tx">{#if now === i}<b class="pill">{t('travel.now')}</b>{/if}<Txt l={r.text} {note} /></p>
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
  sup { margin-left: 1px; font: 700 var(--fs-xs)/1 var(--font-num); color: var(--coral-text); vertical-align: 4px; }
  .dot {
    position: relative; z-index: 1; justify-self: center; margin-top: 6px; width: 12px; height: 12px; border-radius: 50%; box-sizing: border-box;
    background: var(--card); box-shadow: inset 0 0 0 3px var(--c-leaf);
  }
  .untimed .dot { margin-top: 8px; width: 8px; height: 8px; box-shadow: inset 0 0 0 2px var(--lip); }
  /* now: the row yuzu-lit, its dot filled, 「いま」 before its line */
  .tl li.now { background: var(--hl); }
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
