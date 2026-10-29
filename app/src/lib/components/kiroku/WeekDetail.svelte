<script lang="ts">
  // 3.2 Week detail: yen (≈ while it can change) and 🔒 or 「あと2日 修正できます」; me left, partner right: score
  // and 4 flat fruit bars (actual/target); a 7-row day table (tap → the day); the yen split; the week's change log.
  import type { PersonId } from '#lib/types.ts';
  import type { EditLog, WeekDetail } from '#lib/model/history.ts';
  import { FRUITS } from '#lib/config/rules.ts';
  import Avatar from '../Avatar.svelte';
  import OfficialArt from '../OfficialArt.svelte';
  import Glyph from './Glyph.svelte';
  import ChangeLog from './ChangeLog.svelte';
  import { fruitArt } from '#lib/client/assets.ts';
  import { leftLabel, num, weekRange, weekdayOf } from './fmt.ts';
  import { t, formatYen } from '#lib/i18n/index.ts';

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
  const fmtActual = (k: string, x: number) => (k === 'peach' ? Math.round(x) : Number.isInteger(x) ? x : x.toFixed(1));
</script>

<header class="sub">
  <h3>{d.current ? t('kiroku.thisWeek') + ' ' : ''}<span class="money">{weekRange(d.weekKey)}</span></h3>
  <span class="yen money">{d.estimate ? '≈' : ''}{formatYen(d.yen)}</span>
</header>
<p class="state" class:locked={!d.open}>
  {#if d.open}<Glyph kind="pen" size={14} />{leftLabel(d.lockAt, now)}{:else}<Glyph kind="lock" size={14} />{t('kiroku.lockedNote')}{/if}
</p>

<section class="card people">
  {#each order as p (p)}
    {@const pp = d.people[p]}
    <div class="col">
      <div class="who"><Avatar person={p} villager={villagers[p]} size={32} /><span class="nm">{names[p]}</span><b class="money sc">{pp.score}</b></div>
      {#each FRUITS as k (k)}
        <div class="bar" title={t(`fruit.${k}`)}>
          <OfficialArt key={fruitArt(k)} size={18} />
          <span class="track"><span class="fill" style:width="{pp.fruits[k].pct}%"></span></span>
          <span class="num money">{fmtActual(k, pp.fruits[k].actual)}/{fmtActual(k, pp.fruits[k].target)}</span>
        </div>
      {/each}
    </div>
  {/each}
</section>

<section class="card days" aria-label={t('kiroku.weekOf', { range: weekRange(d.weekKey) })}>
  {#each d.people[order[0]].days as row, i (row.date)}
    {@const other = d.people[order[1]].days[i]}
    <button type="button" class="day" disabled={row.future} onclick={() => onday(row.date)}>
      <span class="wd">{weekdayOf(row.date)}</span>
      {#each [row, other] as r, j (j)}
        <span class="half" class:right={j === 1}>
          {#if r.future}<span class="dim">·</span>
          {:else}
            <span class="st money">{num(r.steps)}</span>
            <span class="mn money">{t('kiroku.min', { n: r.minutes })}</span>
            <span class="star">{#if r.strength}<Glyph kind="strength" size={14} />{/if}</span>
            <span class="tk" aria-label="{r.ticks}/3">{#each [0, 1, 2] as n (n)}<i class:on={n < r.ticks}></i>{/each}</span>
            {#if r.edited}<span class="ed"><Glyph kind="pen" size={11} label={t('kiroku.edited')} /></span>{/if}
          {/if}
        </span>
      {/each}
    </button>
  {/each}
</section>

<p class="split">
  <span>{t('kiroku.breakdown')}</span>
  <span>{names[order[0]]} <b class="money">{formatYen(d.breakdown[order[0]])}</b></span>
  <span>{names[order[1]]} <b class="money">{formatYen(d.breakdown[order[1]])}</b></span>
  <span>{t('kiroku.team')} <b class="money">{formatYen(d.breakdown.team)}</b></span>
  {#if d.breakdown.purseA + d.breakdown.purseB > 0}<span>{t('kiroku.purse')} <b class="money">{formatYen(d.breakdown.purseA + d.breakdown.purseB)}</b></span>{/if}
</p>

<ChangeLog {edits} {villagers} withDate />

<style>
  .sub { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin: 0 2px; }
  .sub h3 { margin: 0; font-size: var(--fs-talk); }
  .yen { font-size: var(--fs-title); white-space: nowrap; }
  .state { display: flex; align-items: center; gap: 6px; margin: -6px 2px 0; font-size: var(--fs-s); font-weight: 700; color: var(--c-leaf-lip); }
  .state.locked { color: var(--text-soft); }
  .people { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 14px; }
  .col { display: grid; gap: 7px; min-width: 0; }
  .who { display: flex; align-items: center; gap: 6px; min-width: 0; }
  .nm { flex: 1; min-width: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sc { font-size: var(--fs-title); }
  .bar { display: flex; align-items: center; gap: 5px; }
  .track { flex: 1; height: 8px; border-radius: 4px; background: color-mix(in srgb, var(--lip) 55%, transparent); overflow: hidden; min-width: 20px; }
  .fill { display: block; height: 100%; background: var(--c-leaf); border-radius: 4px; transition: width var(--dur-slow) var(--ease-soft); }
  .num { font-size: var(--fs-s); white-space: nowrap; color: var(--text-soft); min-width: 3.4em; text-align: right; }

  .days { padding: 4px 6px; display: grid; }
  .day {
    appearance: none; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; width: 100%;
    display: grid; grid-template-columns: 22px 1fr 1fr; align-items: center; gap: 6px; min-height: 44px; padding: 0 6px;
    text-align: left;
  }
  .day + .day { border-top: 2px solid color-mix(in srgb, var(--lip) 40%, transparent); }
  .day:active:not(:disabled) { background: color-mix(in srgb, var(--c-yuzu) 30%, transparent); }
  .day:disabled { cursor: default; }
  .wd { font-weight: 700; font-size: var(--fs-body); }
  .half { display: flex; align-items: center; gap: 5px; min-width: 0; position: relative; font-size: var(--fs-s); padding-right: 10px; }
  .half.right { padding-left: 8px; box-shadow: -2px 0 0 color-mix(in srgb, var(--lip) 45%, transparent); }
  .st { width: 3.4em; text-align: right; font-size: var(--fs-s); }
  .mn { width: 3.3em; text-align: right; font-size: var(--fs-s); color: var(--text-soft); }
  .star { width: 14px; display: grid; }
  .tk { display: flex; gap: 2px; }
  .tk i { width: 6px; height: 6px; border-radius: 50%; background: color-mix(in srgb, var(--lip) 70%, transparent); }
  .tk i.on { background: var(--c-mint-lip); }
  .ed { position: absolute; right: -2px; top: -6px; }
  .dim { color: var(--text-soft); }
  .split { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 0 4px 6px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .split b { color: var(--text); font-size: var(--fs-s); }
  /* 320: steps, minutes and ★ stay; the ticks move to the day. */
  @media (max-width: 374px) {
    .tk { display: none; }
    .people { gap: 10px; padding: 12px 10px; }
    .num { font-size: 11px; }
  }
</style>
