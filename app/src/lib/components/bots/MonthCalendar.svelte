<script lang="ts" generics="T extends MonthDay & { live: boolean; today: boolean }">
  // ボット's month calendar (docs/design.md "Bots"), ジム's and 保養所's one grid (GymCalendar, ItsCalendar): the
  // weekday header 月…日 (土 sky, 日 coral; with `onweekday` a 28pt chip each in a 44pt hit, its column), a row a week
  // (time/dates.ts monthWeeks), a settable day the caller's `day` snippet (its `.cell` button, the roving tab stop
  // passed in), a passed or unsettable day of the month faint (its date only), another month's blank, both inert; the
  // caller's legend under it, inline. The cell's look is here (`.cell`, `.d`, today's date an ink pill) so both match;
  // its height only `--cal-h`: `tall` ジム's 54 (the date and marks 14, the content), else a finger's 44. A grid for
  // VoiceOver (role=grid, a row a week, the arrow keys, Home / End).
  import type { Snippet } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import type { MonthDay } from '#lib/contract/tokyo.ts';

  interface Props {
    cells: T[][];
    label: string;
    /** The weekday buttons' data attribute (`data-gym-weekday`). */
    attr: string;
    /** A weekday's header tapped (its column, 0 = 月); null: plain text. */
    onweekday?: ((col: number) => void) | null;
    /** A weekday button's words (`{wd}曜日をすべて選ぶ`). */
    weekdayLabel?: (wd: string) => string;
    tall?: boolean;
    rootAttr?: Record<string, string | boolean | undefined>;
    day: Snippet<[T, number]>;
    /** The legend's items (`<span>` each, a `.sw` swatch in it), in the footer (`data-{attr}-legend`). */
    legend?: Snippet;
  }
  let { cells, label, attr, onweekday = null, weekdayLabel = (wd) => wd, tall = false, rootAttr = {}, day, legend }: Props = $props();

  const days = $derived(cells.flat().filter((c) => c.live).map((c) => c.date));
  /** The roving tab stop: the last focused day, else today (the first settable). */
  let focusDay = $state<string | null>(null);
  const stop = $derived(focusDay && days.includes(focusDay) ? focusDay : days[0]);
  let grid: HTMLElement | undefined = $state();

  function move(e: KeyboardEvent) {
    const all = cells.flat();
    const i = all.findIndex((c) => c.date === stop);
    const at = days.indexOf(stop);
    let to: string | undefined;
    if (e.key === 'ArrowRight') to = days[at + 1];
    else if (e.key === 'ArrowLeft') to = days[at - 1];
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') to = [all[i + (e.key === 'ArrowDown' ? 7 : -7)]].find((c) => c?.live)?.date;
    else if (e.key === 'Home') to = all.slice(i - (i % 7), i + 1).find((c) => c.live)?.date;
    else if (e.key === 'End') to = all.slice(i, i - (i % 7) + 7).findLast((c) => c.live)?.date;
    else return;
    e.preventDefault();
    if (!to) return;
    focusDay = to;
    grid?.querySelector<HTMLElement>(`[data-date="${to}"] > .cell`)?.focus();
  }
</script>

<div class="monthcal" class:tall role="grid" aria-label={label} bind:this={grid} onkeydown={move} tabindex="-1" {...rootAttr}
  onfocusin={(e) => { const d = (e.target as HTMLElement).closest<HTMLElement>('[data-date]')?.dataset.date; if (d) focusDay = d; }}>
  <div class="row" role="row">
    {#each [1, 2, 3, 4, 5, 6, 7] as wd, col (wd)}
      <div class="wd" role="columnheader" class:sun={wd === 7} class:sat={wd === 6}>
        {#if onweekday}
          <button type="button" class="wdbtn" {...{ [`data-${attr}-weekday`]: col }} data-sfx="tick" aria-label={weekdayLabel(t(`weekday.${wd}`))} onclick={() => onweekday(col)}>{t(`weekday.${wd}`)}</button>
        {:else}{t(`weekday.${wd}`)}{/if}
      </div>
    {/each}
  </div>
  {#each cells as week, w (w)}
    <div class="row" role="row">
      {#each week as c (c.date)}
        <div role="gridcell" class="gc" data-date={c.live ? c.date : undefined}>
          {#if c.live}{@render day(c, c.date === stop ? 0 : -1)}{:else}<span class="cell out" class:blank={!c.inMonth} aria-hidden="true"><span class="d">{c.inMonth ? c.d : ''}</span></span>{/if}
        </div>
      {/each}
    </div>
  {/each}
</div>
{#if legend}<p class="legend" {...{ [`data-${attr}-legend`]: true }}>{@render legend()}</p>{/if}

<style>
  .monthcal { --cal-h: var(--hit); display: grid; gap: 3px; outline: none; }
  .monthcal.tall { --cal-h: 54px; }
  .row { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 3px; }
  .wd { display: grid; place-items: center; min-height: 28px; font: 700 var(--fs-xs)/1 var(--font-ui); color: var(--text-soft); }
  .wd.sun { color: var(--coral-text); }
  .wd.sat { color: var(--sky-text); }
  .wdbtn {
    appearance: none; border: 0; cursor: pointer; position: relative; width: 100%; min-height: 28px; padding: 0; border-radius: var(--r-chip);
    font: inherit; color: inherit; background: var(--ctl); box-shadow: var(--sh-ctl-s);
  }
  .wdbtn::after { content: ''; position: absolute; inset: -8px -1px; }
  .gc { min-width: 0; }
  /* the cell (the callers' buttons too: :where keeps their own fills ahead) */
  :where(.monthcal) :global(.cell) {
    appearance: none; border: 0; position: relative; width: 100%; height: var(--cal-h); padding: 0; border-radius: 10px; cursor: pointer;
    display: grid; place-items: center; font: 600 var(--fs-s)/1 var(--font-num); color: var(--text); background: var(--card);
    box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--edge) 55%, transparent); -webkit-touch-callout: none; user-select: none; touch-action: manipulation;
  }
  :where(.monthcal) :global(.cell.today .d) { padding: 1px 4px; border-radius: var(--r-pill); background: var(--text); color: var(--card); }
  :where(.monthcal) :global(.cell:focus-visible), .wdbtn:focus-visible { outline: 3px solid var(--focus); outline-offset: 1px; z-index: 1; }
  :where(.monthcal) :global(.cell:not(.out):active) { transform: translateY(1px); }
  /* passed or unsettable: faint (in ジム's, the date where a cell's is); another month's: nothing */
  .cell.out { cursor: default; background: color-mix(in srgb, var(--ctl-off) 40%, transparent); box-shadow: none; color: color-mix(in srgb, var(--text-soft) 55%, transparent); }
  .tall .cell.out { place-items: start; padding: 5px 6px; }
  .cell.blank { background: none; }
  /* the legend: one or two lines under the grid, a swatch (the caller's fills) and its word each */
  .legend { margin: -2px 4px 0; display: flex; flex-wrap: wrap; gap: 2px 10px; font: 700 var(--fs-xs)/1.4 var(--font-ui); color: var(--text-soft); }
  :where(.legend) :global(span) { display: inline-flex; align-items: center; gap: 4px; }
  :where(.legend) :global(.sw) { display: inline-grid; place-items: center; width: 11px; height: 11px; border-radius: 3px; position: relative; }
</style>
