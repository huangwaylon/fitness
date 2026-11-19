<script lang="ts">
  // 保養所's calendar (docs/bots.md; the cells are lib/its/view.ts nightGrid), on MonthCalendar (ジム's grid too):
  // this month or next, Mon–Sun, a night a cell (44 high): a tap puts it in the draft or takes it out (filled leaf:
  // searched), a weekday's header does its whole column (the month's settable nights only); past and too far nights
  // faint, the other months' days blank, both inert. A booking marks its night: 要対応 a yuzu 「!」 (the tab's and the
  // verdict's), 仮押さえ · 申込中 a hollow yuzu ring, 予約確定 a ✓ (the legend under it).
  import MonthCalendar from './MonthCalendar.svelte';
  import { t } from '#lib/i18n/index.ts';
  import type { NightCell } from '#lib/its/view.ts';

  interface Props {
    cells: NightCell[][];
    label: string;
    onpick: (date: string) => void;
    onweekday: (col: number) => void;
  }
  let { cells, label, onpick, onweekday }: Props = $props();
</script>

<MonthCalendar {cells} {label} attr="its" {onweekday} rootAttr={{ 'data-its-calendar': true }}>
  {#snippet day(c, tabindex)}
    <button type="button" class="cell" class:on={c.on} class:today={c.today} {tabindex} aria-label={c.label} aria-pressed={c.on}
      data-its-night-day={c.date} data-mark={c.mark ?? undefined} data-sfx="tick" onclick={() => onpick(c.date)}>
      <span class="d">{c.d}</span>
      {#if c.mark}<i class="mk {c.mark}" aria-hidden="true">{c.mark === 'booked' ? '✓' : c.mark === 'action' ? '!' : ''}</i>{/if}
    </button>
  {/snippet}
  {#snippet legend()}
    <span><i class="sw action">!</i>{t('its.cal.mark.action')}</span><span><i class="sw hold"></i>{t('its.cal.mark.hold')}</span><span><i class="sw booked">✓</i>{t('its.cal.mark.booked')}</span>
  {/snippet}
</MonthCalendar>

<style>
  /* searched: leaf over the cream card, by night too (a lit tile: ink 7.5:1; over the navy card 3.3) */
  .cell.on { background: color-mix(in srgb, var(--c-leaf) 55%, var(--c-card)); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-leaf-edge); }
  /* a booking's mark top-right; the legend's swatches the same */
  .mk { position: absolute; top: 3px; right: 3px; width: 11px; height: 11px; }
  .mk, .sw { border-radius: 50%; font: 700 9px/11px var(--font-ui); font-style: normal; text-align: center; }
  .sw { width: 11px; height: 11px; }
  .action { background: var(--c-yuzu); color: var(--c-ink); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c-ink) 55%, transparent), 0 0 0 1.5px var(--card); }
  .hold { box-shadow: inset 0 0 0 2px var(--c-yuzu-lip); }
  .booked { color: var(--leaf-text); }
  .mk.booked { width: auto; height: auto; }
  :global(:root[data-tod='night']) .cell.on { color: var(--c-ink); }
</style>
