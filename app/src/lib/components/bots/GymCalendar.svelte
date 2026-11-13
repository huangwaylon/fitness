<script lang="ts">
  // ジム's 4-week calendar (docs/design.md "Bots"; the cells are lib/gym/calendar.ts weeks): Mon–Sun from this week, the
  // 25 settable days a button each (~50×58: the date, today's underlined yuzu; the rule's icon; the hours under it),
  // the rest blank and inert. Fills: 終日 leaf, 時間指定 mint, ふだん mint dashed (the next 4 days), 未チェック paper,
  // オフ sunk with the bell struck; ⏳ an hourglass top-right; announced a dot with the count; picked (select mode) a
  // yuzu ring; a day a poll saw change flashes. A grid for VoiceOver (role=grid, a row a week, the arrow keys, Home /
  // End): each day's full words. Select mode: a tap toggles a day, a weekday's header toggles its column; a long press
  // starts it.
  import Icon from '../ui/Icon.svelte';
  import { t } from '#lib/i18n/index.ts';
  import type { Cell } from '#lib/gym/calendar.ts';
  import type { Day } from '#lib/gym/contract.ts';

  interface Props {
    cells: Cell[][];
    selecting: boolean;
    selected: ReadonlySet<Day>;
    /** Days a poll saw change (flashed a moment). */
    flash: ReadonlySet<Day>;
    /** The day the editor last opened (focus returns there). */
    onpick: (day: Day) => void;
    onweekday: (col: number) => void;
    onlongpress: (day: Day) => void;
  }
  let { cells, selecting, selected, flash, onpick, onweekday, onlongpress }: Props = $props();

  const ICON = { any: 'bell', range: 'clock', usual: 'clock', off: 'bell-off', none: '' } as const;
  const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
  const days = $derived(cells.flat().filter((c) => c.row).map((c) => c.day));
  /** The roving tab stop: the last focused day, else today. */
  let focusDay = $state<Day | null>(null);
  const stop = $derived(focusDay && days.includes(focusDay) ? focusDay : days[0]);
  let grid: HTMLElement | undefined = $state();

  function move(e: KeyboardEvent) {
    const at = days.indexOf(stop);
    const all = cells.flat();
    const i = all.findIndex((c) => c.day === stop);
    let to: Day | undefined;
    if (e.key === 'ArrowRight') to = days[at + 1];
    else if (e.key === 'ArrowLeft') to = days[at - 1];
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') to = all[i + (e.key === 'ArrowDown' ? 7 : -7)]?.row?.day;
    else if (e.key === 'Home') to = all.slice(i - (i % 7), i + 1).find((c) => c.row)?.day;
    else if (e.key === 'End') to = all.slice(i, i - (i % 7) + 7).findLast((c) => c.row)?.day;
    else return;
    e.preventDefault();
    if (!to) return;
    focusDay = to;
    grid?.querySelector<HTMLElement>(`[data-gym-day="${to}"]`)?.focus();
  }

  // a long press (select mode): held 500 ms without moving far; its click is then swallowed
  let press: { day: Day; x: number; y: number; timer: ReturnType<typeof setTimeout> } | null = null;
  let swallow = false;
  function down(e: PointerEvent, day: Day) {
    if (selecting) return;
    const timer = setTimeout(() => {
      press = null;
      swallow = true;
      onlongpress(day);
    }, 500);
    press = { day, x: e.clientX, y: e.clientY, timer };
  }
  function moved(e: PointerEvent) {
    if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) up();
  }
  function up() {
    if (press) clearTimeout(press.timer);
    press = null;
  }
  function click(day: Day) {
    if (swallow) {
      swallow = false;
      return;
    }
    focusDay = day;
    onpick(day);
  }
</script>

<div class="cal" role="grid" aria-label={t('gym.cal.label')} aria-multiselectable={selecting || undefined} bind:this={grid} onkeydown={move} tabindex="-1" data-gym-calendar data-selecting={selecting || undefined}>
  <div class="row head" role="row">
    {#each WEEKDAYS as wd, col (wd)}
      <div class="wd" role="columnheader" class:sun={wd === 7} class:sat={wd === 6}>
        {#if selecting}
          <button type="button" class="wdbtn" data-gym-weekday={col} data-sfx="tick" aria-label={t('gym.cal.weekday', { wd: t(`weekday.${wd}`) })} onclick={() => onweekday(col)}>{t(`weekday.${wd}`)}</button>
        {:else}{t(`weekday.${wd}`)}{/if}
      </div>
    {/each}
  </div>
  {#each cells as week, w (w)}
    <div class="row" role="row">
      {#each week as c (c.day)}
        <div role="gridcell" class="gc" aria-selected={selecting && c.row ? selected.has(c.day) : undefined}>
          {#if c.row}
            <button type="button" class="cell {c.fill}" class:today={c.today} class:picked={selecting && selected.has(c.day)} class:flash={flash.has(c.day)}
              tabindex={c.day === stop ? 0 : -1} aria-label={c.label} aria-pressed={selecting ? selected.has(c.day) : undefined} aria-haspopup={selecting ? undefined : 'dialog'}
              data-gym-day={c.day} data-fill={c.fill} data-sfx="tick"
              onpointerdown={(e) => down(e, c.day)} onpointermove={moved} onpointerup={up} onpointercancel={up} onpointerleave={up}
              oncontextmenu={(e) => e.preventDefault()} onfocus={() => (focusDay = c.day)} onclick={() => click(c.day)}>
              <span class="top"><span class="d">{c.date}</span><span class="marks">
                {#if c.from}<span class="hg" data-gym-from><Icon name="hourglass" size={10} stroke={2.4} /></span>{/if}
                {#if c.announced}<span class="an" data-gym-announced={c.announced}>{c.announced}</span>{/if}
              </span></span>
              <span class="ic">{#if ICON[c.fill]}<Icon name={ICON[c.fill]} size={18} />{/if}</span>
              <span class="tm">{c.time ?? ''}</span>
            </button>
          {:else}
            <span class="cell out"><span class="top"><span class="d">{c.date}</span></span><span class="sr">{c.label}{t('gym.cell.sep')}{t('gym.cell.out')}</span></span>
          {/if}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .cal { display: grid; gap: 3px; outline: none; }
  .row { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 3px; }
  .wd { display: grid; place-items: center; min-height: 22px; font: 700 var(--fs-xs)/1 var(--font-ui); color: var(--text-soft); }
  .wd.sun { color: var(--coral-text); }
  .wd.sat { color: var(--sky-text); }
  .wdbtn {
    appearance: none; border: 0; cursor: pointer; width: 100%; min-height: var(--hit); border-radius: var(--r-chip);
    font: inherit; color: inherit; background: var(--ctl); box-shadow: var(--sh-ctl-s);
  }
  .gc { min-width: 0; }
  .cell {
    appearance: none; border: 0; position: relative; width: 100%; height: 58px; padding: 4px 2px 3px; border-radius: 10px; cursor: pointer;
    display: grid; grid-template-rows: 15px 1fr 12px; justify-items: center; align-items: center; gap: 0;
    font: 700 var(--fs-xs)/1 var(--font-num); color: var(--text); background: var(--card); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--edge) 55%, transparent);
    -webkit-touch-callout: none; user-select: none; touch-action: manipulation;
  }
  .top { justify-self: stretch; display: flex; align-items: center; justify-content: space-between; padding: 0 1px 0 4px; min-width: 0; }
  .cell .d { font-size: var(--fs-s); }
  .marks { display: flex; gap: 1px; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .cell .ic { display: grid; place-items: center; }
  .cell .tm { font-size: 10.5px; letter-spacing: -0.02em; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .today .d { text-decoration: underline 3px var(--c-yuzu); text-underline-offset: 3px; }
  /* fills (coral is for errors only) */
  .cell.any { background: color-mix(in srgb, var(--c-leaf) 55%, var(--card)); color: var(--c-ink); }
  .cell.range { background: color-mix(in srgb, var(--c-mint) 60%, var(--card)); color: var(--c-ink); }
  .cell.usual { background: color-mix(in srgb, var(--c-mint) 22%, var(--card)); box-shadow: none; outline: 2px dashed color-mix(in srgb, var(--c-mint) 75%, var(--text-soft)); outline-offset: -2px; }
  .cell.usual .tm, .cell.usual .ic { color: var(--text-soft); }
  .cell.off { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; }
  .cell.none { color: var(--text-soft); }
  .cell.out { cursor: default; background: transparent; box-shadow: none; color: color-mix(in srgb, var(--text-soft) 45%, transparent); }
  :global(:root[data-tod='night']) .cell.any, :global(:root[data-tod='night']) .cell.range { color: var(--c-ink); }
  /* marks */
  .hg { display: grid; place-items: center; width: 14px; height: 14px; border-radius: 50%; background: var(--c-cream); color: var(--c-ink); }
  .an {
    min-width: 14px; height: 14px; padding: 0 3px; border-radius: var(--r-pill); display: grid; place-items: center;
    font: 700 10px/1 var(--font-num); color: var(--c-ink); background: var(--c-gold); box-shadow: 0 1px 0 var(--c-gold-lip);
  }
  .picked { box-shadow: inset 0 0 0 3px var(--c-yuzu), 0 0 0 2px var(--c-yuzu-lip); outline: none; }
  .cell:focus-visible { outline: 3px solid var(--focus); outline-offset: 1px; z-index: 1; }
  .cell:not(.out):active { transform: translateY(1px); }
  .flash { animation: flash 1.6s var(--ease-out); }
  @keyframes flash { 0%, 40% { box-shadow: inset 0 0 0 3px var(--c-sky), 0 0 0 3px color-mix(in srgb, var(--c-sky) 50%, transparent); } }
  @media (prefers-reduced-motion: reduce) { .flash { animation: none; box-shadow: inset 0 0 0 3px var(--c-sky); } .cell:active { transform: none; } }
</style>
