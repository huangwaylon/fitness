<script lang="ts">
  // 保養所's 日付 calendar (docs/design.md "Bots"; the cells are lib/its/view.ts nightGrid): one month, Mon–Sun, ジム's
  // calendar's look and moves (GymCalendar: its grid, cells and select ring) for nights: a tap puts a night in the draft
  // or takes it out (filled leaf: searched), a weekday's header does its whole column (the month's settable nights
  // only); past, too far and the other months' days blank and inert. A booking marks its night: 要対応 a coral dot, 仮押さえ
  // · 申込中 a yuzu one, 予約確定 a ✓. A grid for VoiceOver (a row a week, the arrow keys): each night's full words.
  import { t } from '#lib/i18n/index.ts';
  import type { NightCell } from '#lib/its/view.ts';

  interface Props {
    cells: NightCell[][];
    /** `YYYY-MM`: the month shown (the other months' days blank). */
    month: string;
    label: string;
    onpick: (date: string) => void;
    onweekday: (col: number) => void;
  }
  let { cells, month, label, onpick, onweekday }: Props = $props();

  const days = $derived(cells.flat().filter((c) => !c.out).map((c) => c.date));
  let focusDay = $state<string | null>(null);
  const stop = $derived(focusDay && days.includes(focusDay) ? focusDay : days[0]);
  let grid: HTMLElement | undefined = $state();

  function move(e: KeyboardEvent) {
    const all = cells.flat();
    const i = all.findIndex((c) => c.date === stop);
    const at = days.indexOf(stop);
    const to = e.key === 'ArrowRight' ? days[at + 1] : e.key === 'ArrowLeft' ? days[at - 1]
      : e.key === 'ArrowDown' || e.key === 'ArrowUp' ? all[i + (e.key === 'ArrowDown' ? 7 : -7)] : undefined;
    const day = typeof to === 'string' ? to : to && !to.out ? to.date : undefined;
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    if (!day) return;
    focusDay = day;
    grid?.querySelector<HTMLElement>(`[data-its-night-day="${day}"]`)?.focus();
  }
</script>

<div class="cal" role="grid" aria-label={label} bind:this={grid} onkeydown={move} tabindex="-1" data-its-calendar>
  <div class="row head" role="row">
    {#each [1, 2, 3, 4, 5, 6, 7] as wd, col (wd)}
      <div class="wd" role="columnheader" class:sun={wd === 7} class:sat={wd === 6}>
        <button type="button" class="wdbtn" data-its-weekday={col} data-sfx="tick" aria-label={t('its.cal.weekday', { wd: t(`weekday.${wd}`) })} onclick={() => onweekday(col)}>{t(`weekday.${wd}`)}</button>
      </div>
    {/each}
  </div>
  {#each cells as week, w (w)}
    <div class="row" role="row">
      {#each week as c (c.date)}
        <div role="gridcell" class="gc">
          {#if !c.out}
            <button type="button" class="cell" class:on={c.on} class:today={c.today} tabindex={c.date === stop ? 0 : -1} aria-label={c.label} aria-pressed={c.on}
              data-its-night-day={c.date} data-mark={c.mark ?? undefined} data-sfx="tick" onfocus={() => (focusDay = c.date)} onclick={() => { focusDay = c.date; onpick(c.date); }}>
              <span class="d">{c.d}</span>
              {#if c.mark}<i class="mk {c.mark}" aria-hidden="true">{c.mark === 'booked' ? '✓' : ''}</i>{/if}
            </button>
          {:else}
            <span class="cell out" aria-hidden="true">{c.date.startsWith(month) ? c.d : ''}</span>
          {/if}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  /* GymCalendar's grid, a night a cell (44 high: a finger's) */
  .cal { display: grid; gap: 3px; outline: none; }
  .row { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 3px; }
  .wd { display: grid; place-items: center; font: 700 var(--fs-xs)/1 var(--font-ui); color: var(--text-soft); }
  .wd.sun { color: var(--coral-text); }
  .wd.sat { color: var(--sky-text); }
  .wdbtn {
    appearance: none; border: 0; cursor: pointer; width: 100%; min-height: var(--hit); border-radius: var(--r-chip);
    font: inherit; color: inherit; background: var(--ctl); box-shadow: var(--sh-ctl-s);
  }
  .gc { min-width: 0; }
  .cell {
    appearance: none; border: 0; position: relative; width: 100%; height: var(--hit); padding: 0; border-radius: 10px; cursor: pointer;
    display: grid; place-items: center; font: 600 var(--fs-s)/1 var(--font-num); color: var(--text); background: var(--card);
    box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--edge) 55%, transparent); touch-action: manipulation;
  }
  .cell.on { background: color-mix(in srgb, var(--c-leaf) 55%, var(--card)); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-leaf-edge); }
  .today .d { text-decoration: underline 3px var(--c-yuzu); text-underline-offset: 3px; }
  .cell.out { cursor: default; background: transparent; box-shadow: none; color: color-mix(in srgb, var(--text-soft) 45%, transparent); }
  .mk { position: absolute; top: 3px; right: 3px; width: 9px; height: 9px; border-radius: 50%; font: 700 9px/9px var(--font-ui); font-style: normal; text-align: center; }
  .mk.action { background: var(--c-coral); box-shadow: 0 0 0 1.5px var(--card); }
  .mk.hold { background: var(--c-yuzu); box-shadow: 0 0 0 1.5px var(--c-yuzu-lip); }
  .mk.booked { width: auto; height: auto; color: var(--leaf-text); }
  :global(:root[data-tod='night']) .cell.on { color: var(--c-ink); }
  .cell:focus-visible, .wdbtn:focus-visible { outline: 3px solid var(--focus); outline-offset: 1px; z-index: 1; }
  .cell:active { transform: translateY(1px); }
  @media (prefers-reduced-motion: reduce) { .cell:active { transform: none; } }
</style>
