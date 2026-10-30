<script lang="ts">
  // 3.2 Week detail: the week's ベル and 🔒 or 「あと2日 修正できます」; me left, partner right: their ベル and the four
  // badges; a 7-row day table (tap → the day); where the ベル came from (daily, bonus); the week's change log.
  import type { PersonId } from '#lib/types.ts';
  import type { EditLog, WeekDetail } from '#lib/model/history.ts';
  import Avatar from '../characters/Avatar.svelte';
  import BadgeRow from '../pots/BadgeRow.svelte';
  import Glyph from './Glyph.svelte';
  import ChangeLog from './ChangeLog.svelte';
  import { leftLabel, num } from './fmt.ts';
  import { t, formatBells, formatNum } from '#lib/i18n/index.ts';
  import { weekRange, weekdayOf } from '#lib/i18n/format.ts';

  interface Props {
    d: WeekDetail;
    edits: EditLog[];
    order: PersonId[];
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
    now: number;
    onday: (date: string) => void;
  }
  let { d, edits, order, names, villagers, now, onday }: Props = $props();
</script>

{#snippet pen(on: boolean)}{#if on}<span class="ed"><Glyph kind="pen" size={10} label={t('kiroku.edited')} /></span>{/if}{/snippet}

<header class="sub">
  <h3>{d.current ? t('kiroku.thisWeek') + ' ' : ''}<span class="money">{weekRange(d.weekKey)}</span></h3>
  <span class="total money">{formatBells(d.bells)}</span>
</header>
<p class="state" class:locked={!d.open}>
  {#if d.open}<Glyph kind="pen" size={14} />{leftLabel(d.lockAt, now)}{:else}<Glyph kind="lock" size={14} />{t('kiroku.lockedNote')}{/if}
</p>

<section class="card people">
  {#each order as p (p)}
    {@const pp = d.people[p]}
    <div class="col">
      <div class="who"><Avatar person={p} villager={villagers[p]} size={32} /><span class="nm">{names[p]}</span></div>
      <b class="money sc">{formatNum(pp.dailyBells + pp.bonus)}<small>{t('pots.unit')}</small></b>
      <BadgeRow badges={pp.badges} size="var(--bd)" />
    </div>
  {/each}
</section>

<section class="card days" aria-label={t('kiroku.weekOf', { range: weekRange(d.weekKey) })}>
  <!-- Column labels (round 7 F8): whose half, then steps · minutes · strength · meals. -->
  <div class="head" aria-hidden="true">
    <span></span>
    {#each order as p, j (p)}<span class="half who2" class:right={j === 1}>{names[p]}</span>{/each}
    <span></span>
    {#each order as p, j (p)}
      <span class="half hd" class:right={j === 1}>
        <span class="st">{t('kiroku.col.steps')}</span><span class="mn">{t('kiroku.col.min')}</span>
        <span class="star"><Glyph kind="strength" size={11} /></span><span class="tk lbl">{t('kiroku.col.meals')}</span>
      </span>
    {/each}
  </div>
  {#each d.people[order[0]].days as row, i (row.date)}
    {@const other = d.people[order[1]].days[i]}
    <button type="button" class="day" aria-disabled={row.future} data-sfx="page" onclick={() => onday(row.date)}>
      <span class="wd">{weekdayOf(row.date)}</span>
      {#each [row, other] as r, j (j)}
        <span class="half" class:right={j === 1}>
          {#if r.future}<span class="dim">·</span>
          {:else}
            <span class="st money">{num(r.steps)}{@render pen(r.editedFields.includes('steps'))}</span>
            <span class="mn money">{t('kiroku.min', { n: r.minutes })}{@render pen(r.editedFields.includes('minutes'))}</span>
            <span class="star">{#if r.strength}<Glyph kind="strength" size={14} />{/if}{@render pen(r.editedFields.includes('workout'))}</span>
            <span class="tk" aria-label="{r.ticks}/3">{#each [0, 1, 2] as n (n)}<i class:on={n < r.ticks}></i>{/each}{@render pen(r.editedFields.includes('ticks'))}</span>
          {/if}
        </span>
      {/each}
    </button>
  {/each}
</section>

<!-- 内訳 adds up to the week's ベル: each person's days and badges, and the ふたりボーナス (round 7 F9). -->
<p class="split">
  <span>{t('kiroku.breakdown')}</span>
  {#each order as p (p)}
    <span>{names[p]} <b class="money">{formatBells(d.people[p].dailyBells)}</b>{#if d.people[p].bonus} + <b class="money">{formatBells(d.people[p].bonus)}</b>{/if}</span>
  {/each}
  {#if d.bonus.duo}<span>{t('harvest.duo')} <b class="money">{formatBells(d.bonus.duo)}</b></span>{/if}
</p>

<ChangeLog {edits} {villagers} withDate />

<style>
  .sub { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin: 0 2px; }
  .sub h3 { margin: 0; font-size: var(--fs-talk); }
  .total { font-size: var(--fs-title); white-space: nowrap; }
  .state { display: flex; align-items: center; gap: 6px; margin: -6px 2px 0; font-size: var(--fs-s); font-weight: 700; color: var(--c-leaf-lip); }
  .state.locked { color: var(--text-soft); }
  .people { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; padding: 14px; }
  .col { display: grid; gap: 7px; min-width: 0; justify-items: start; --bd: clamp(16px, 4.6vw, 22px); }
  .who { display: flex; align-items: center; gap: 6px; min-width: 0; }
  .nm { flex: 1; min-width: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .who { width: 100%; }
  .sc { font-size: var(--fs-title); }
  .sc small { font: 700 .6em/1 var(--font-ui); margin-left: .25em; }

  /* the weekday column: one kanji (水), or three Latin letters (Wed, sizing #11) */
  .days { padding: 4px 6px; display: grid; --wd-w: 22px; }
  .days:lang(en) { --wd-w: 2.1rem; }
  .day {
    appearance: none; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; width: 100%;
    display: grid; grid-template-columns: var(--wd-w) minmax(0, 1fr) minmax(0, 1fr); align-items: center; gap: 6px; min-height: 44px; padding: 0 6px;
    text-align: left;
  }
  .day + .day { border-top: 2px solid color-mix(in srgb, var(--lip) 40%, transparent); }
  .day:active:not([aria-disabled='true']) { background: color-mix(in srgb, var(--c-yuzu) 30%, transparent); }
  .day[aria-disabled='true'] { cursor: default; }
  .wd { font-weight: 700; font-size: var(--fs-body); }
  .half { display: flex; align-items: center; gap: 5px; min-width: 0; position: relative; font-size: var(--fs-s); padding-right: 10px; }
  .half.right { padding-left: 8px; box-shadow: -2px 0 0 color-mix(in srgb, var(--lip) 45%, transparent); }
  .head { display: grid; grid-template-columns: var(--wd-w) minmax(0, 1fr) minmax(0, 1fr); gap: 2px 6px; padding: 6px 6px 4px; border-bottom: 2px solid color-mix(in srgb, var(--lip) 40%, transparent); }
  .hd { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); white-space: nowrap; }
  .who2 { display: block; font-weight: 700; font-size: var(--fs-s); color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hd .st, .hd .mn { font-size: var(--fs-xs); color: var(--text-soft); }
  .tk.lbl { justify-content: center; }
  .st { width: 3.4em; text-align: right; font-size: var(--fs-s); position: relative; white-space: nowrap; }
  /* 「22 min」 stays on one line (en) */
  .mn { min-width: 3.3em; text-align: right; white-space: nowrap; font-size: var(--fs-s); color: var(--text-soft); position: relative; }
  .star { width: 14px; display: grid; position: relative; }
  .tk { display: flex; gap: 2px; width: 22px; position: relative; }
  .tk i { width: 6px; height: 6px; border-radius: 50%; background: color-mix(in srgb, var(--lip) 70%, transparent); }
  .tk i.on { background: var(--c-mint-lip); }
  /* ✎ sits on the corner of the number it changed. */
  .ed { position: absolute; right: -9px; top: -8px; line-height: 0; color: var(--c-leaf-lip); }
  .dim { color: var(--text-soft); }
  .split { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 0 4px 6px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .split b { color: var(--text); font-size: var(--fs-s); }
  /* 320: steps, minutes and ★ stay; the ticks move to the day. */
  @media (max-width: 374px) {
    .tk { display: none; }
    .people { gap: 10px; padding: 12px 10px; }
  }
</style>
