<script lang="ts">
  // ジム's calendar (docs/bots.md; the cells are lib/gym/calendar.ts monthCells), on MonthCalendar (保養所's grid
  // too): this month or next, Mon–Sun, the rows' days a button each (~46×54: the date and marks; 終日 a bell, オフ the
  // bell struck, 時間指定 its hours stacked, 13px), the rest faint, dashed or blank and inert; the legend under it
  // (確認しない first: the plain paper day). Fills: 終日 leaf,
  // 時間指定 mint, ふだん mint dashed (the next 4 days), 未チェック paper, オフ sunk; ⏳ a bare hourglass beside the
  // announced count (gold); picked (select mode) a yuzu ring; a day a poll saw change flashes. Select mode: a tap
  // toggles a day, a weekday's header toggles its column (the month's settable days); a long press starts it.
  import Icon from '../ui/Icon.svelte';
  import MonthCalendar from './MonthCalendar.svelte';
  import { t } from '#lib/i18n/index.ts';
  import type { Cell } from '#lib/gym/calendar.ts';
  import type { Day } from '#lib/gym/contract.ts';

  interface Props {
    cells: Cell[][];
    label: string;
    selecting: boolean;
    selected: ReadonlySet<Day>;
    /** Days a poll saw change (flashed a moment). */
    flash: ReadonlySet<Day>;
    onpick: (day: Day) => void;
    onweekday: (col: number) => void;
    onlongpress: (day: Day) => void;
  }
  let { cells, label, selecting, selected, flash, onpick, onweekday, onlongpress }: Props = $props();

  /** 終日 and オフ: an icon only; 時間指定: its hours stacked; ふだん: the dashed fill only. */
  const ICON = { any: 'bell', off: 'bell-off' } as const;

  // a long press (select mode): held 500 ms without moving far; its click is then swallowed (a new press forgets a
  // swallow whose click never came)
  let press: { day: Day; x: number; y: number; timer: ReturnType<typeof setTimeout> } | null = null;
  let swallow = false;
  $effect(() => () => press && clearTimeout(press.timer));
  function down(e: PointerEvent, day: Day) {
    swallow = false;
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
    onpick(day);
  }
</script>

<MonthCalendar {cells} {label} attr="gym" tall onweekday={selecting ? onweekday : null}
  rootAttr={{ 'data-gym-calendar': true, 'data-selecting': selecting || undefined }}>
  {#snippet day(c, tabindex)}
    <button type="button" class="cell {c.fill}" class:today={c.today} class:picked={selecting && selected.has(c.date)} class:flash={flash.has(c.date)}
      {tabindex} aria-label={c.label} aria-pressed={selecting ? selected.has(c.date) : undefined} aria-haspopup={selecting ? undefined : 'dialog'}
      data-gym-day={c.date} data-fill={c.fill} data-sfx="tick"
      onpointerdown={(e) => down(e, c.date)} onpointermove={moved} onpointerup={up} onpointercancel={up} onpointerleave={up}
      oncontextmenu={(e) => e.preventDefault()} onclick={() => click(c.date)}>
      <span class="top"><span class="d">{c.d}</span><span class="marks">
        {#if c.from}<span class="hg" data-gym-from><Icon name="hourglass" size={10} stroke={2.4} /></span>{/if}
        {#if c.announced}<span class="an" data-gym-announced={c.announced}>{c.announced}</span>{/if}
      </span></span>
      {#if c.time}<span class="tm" data-gym-time>{c.time[0]}<br />{c.time[1]}</span>
      {:else if c.fill === 'any' || c.fill === 'off'}<span class="ic"><Icon name={ICON[c.fill]} size={16} /></span>{/if}
    </button>
  {/snippet}
  {#snippet legend()}
    <span><i class="sw none"></i>{t('gym.legend.none')}</span><span><i class="sw any"></i>{t('gym.legend.any')}</span><span><i class="sw range"></i>{t('gym.legend.range')}</span><span><i class="sw usual"></i>{t('gym.legend.usual')}</span>
    <span><i class="sw off"></i>{t('gym.legend.off')}</span><span><i class="sw hg"><Icon name="hourglass" size={10} stroke={2.4} /></i>{t('gym.legend.from')}</span><span><i class="sw an"></i>{t('gym.legend.announced')}</span>
  {/snippet}
</MonthCalendar>

<style>
  /* the cell (MonthCalendar's .cell): the date and marks (14), the content under them */
  .cell { padding: 3px 2px 4px; grid-template-rows: 14px 1fr; place-items: center; font-weight: 700; }
  .top { justify-self: stretch; display: flex; align-items: center; justify-content: space-between; padding: 0 1px 0 3px; min-width: 0; }
  .marks { display: flex; align-items: center; gap: 1px; }
  .ic { display: grid; place-items: center; }
  .tm { font-size: var(--fs-s); line-height: 1.05; text-align: center; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
  /* fills (coral is for errors only); the legend's swatches the same. 終日 and 時間指定 mixed over the cream card, by
     night too (a lit tile: ink 7.5:1 and 7.8:1; over the navy card 3.3 and 3.9) */
  .any { background: color-mix(in srgb, var(--c-leaf) 55%, var(--c-card)); color: var(--c-ink); }
  .range { background: color-mix(in srgb, var(--c-mint) 60%, var(--c-card)); color: var(--c-ink); }
  .usual { background: color-mix(in srgb, var(--c-mint) 22%, var(--card)); box-shadow: none; outline: 2px dashed color-mix(in srgb, var(--c-mint) 75%, var(--text-soft)); outline-offset: -2px; }
  .sw.usual { outline-width: 1.5px; outline-offset: -1.5px; }
  .off { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; }
  .cell.none { color: var(--text-soft); }
  .sw.none { background: var(--card); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--edge) 55%, transparent); }
  :global(:root[data-tod='night']) .any, :global(:root[data-tod='night']) .range { color: var(--c-ink); }
  /* marks: ⏳ a bare glyph, announced a gold count */
  .hg { display: grid; place-items: center; }
  .an {
    min-width: 13px; height: 13px; padding: 0 3px; border-radius: var(--r-pill); display: grid; place-items: center;
    font: 700 10px/1 var(--font-num); color: var(--c-ink); background: var(--c-gold); box-shadow: 0 1px 0 var(--c-gold-lip);
  }
  .sw.an { min-width: 0; width: 10px; height: 10px; padding: 0; }
  .picked { box-shadow: inset 0 0 0 3px var(--c-yuzu), 0 0 0 2px var(--c-yuzu-lip); outline: none; }
  .flash { animation: flash 1.6s var(--ease-out); }
  @keyframes flash { 0%, 40% { box-shadow: inset 0 0 0 3px var(--c-sky), 0 0 0 3px color-mix(in srgb, var(--c-sky) 50%, transparent); } }
</style>
