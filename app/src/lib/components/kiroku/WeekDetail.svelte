<script lang="ts">
  // 3.2 Week detail (round 17 IA §4.7): the week and its ベル (one number) and 🔒 once locked; per person the five
  // badges with the days met so far (and the ふたりボーナス once it landed); then the week's table: one row per day
  // (tap → the day), a line per person, the five metrics in the fruit columns (met = bold green); the change log.
  import type { PersonId } from '#lib/types.ts';
  import type { EditLog, WeekDetail } from '#lib/model/history.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import Avatar from '../characters/Avatar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import BadgeRow from '../ui/BadgeRow.svelte';
  import Glyph from './Glyph.svelte';
  import ChangeLog from './ChangeLog.svelte';
  import { num } from './fmt.ts';
  import { fruitArt } from '#lib/art.ts';
  import { t, formatBells } from '#lib/i18n/index.ts';
  import { weekRange, weekdayOf } from '#lib/i18n/format.ts';

  interface Props {
    d: WeekDetail;
    edits: EditLog[];
    order: PersonId[];
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
    onday: (date: string) => void;
  }
  let { d, edits, order, names, villagers, onday }: Props = $props();

  type Row = WeekDetail['people'][PersonId]['days'][number];
  /** A metric's cell: the value, and whether that day's goal was met. */
  function cell(r: Row, f: (typeof RING_FRUITS)[number]): string {
    if (f === 'peach') return String(r.exerciseMin);
    if (f === 'pear') return num(r.moveKcal);
    if (f === 'cherry') return num(r.standMin);
    if (f === 'apple') return num(r.steps);
    return r.gym ? '✓' : '';
  }
  const EDIT_OF = { peach: 'minutes', pear: 'move', cherry: 'stand', apple: 'steps', coconut: 'workout' } as const;
</script>

<header class="sub">
  <h3>{d.current ? t('kiroku.thisWeek') + ' ' : ''}<span class="money">{weekRange(d.weekKey)}</span>{#if d.locked}<Glyph kind="lock" size={14} label={t('kiroku.locked')} />{/if}</h3>
  <span class="total money">{formatBells(d.bells)}</span>
</header>

<section class="card people" aria-label={t('badge.title')}>
  {#each order as p (p)}
    {@const pp = d.people[p]}
    <div class="col">
      <div class="who"><Avatar person={p} villager={villagers[p]} size={30} /><span class="nm">{names[p]}</span></div>
      <BadgeRow badges={pp.ringBadges} size="var(--bd)" progress={d.settled ? null : pp.ringWeek} />
    </div>
  {/each}
  {#if d.bonus.duo}<p class="duo">{t('harvest.duo')} <b class="money">{formatBells(d.bonus.duo, { signed: true })}</b></p>{/if}
</section>

<section class="card days" aria-label={t('kiroku.weekOf', { range: weekRange(d.weekKey) })}>
  <div class="row head" aria-hidden="true">
    <span></span><span></span>
    {#each RING_FRUITS as f (f)}<span class="hc"><OfficialArt key={fruitArt(f)} size={18} /><small>{t(`kiroku.unit.${f}`)}</small></span>{/each}
  </div>
  {#each d.people[order[0]].days as first, i (first.date)}
    <button type="button" class="day" aria-disabled={first.future} data-sfx="page" onclick={() => onday(first.date)}
      aria-label={t('kiroku.dayTitle', { m: Number(first.date.slice(5, 7)), d: Number(first.date.slice(8, 10)), w: weekdayOf(first.date) })}>
      <span class="wd">{weekdayOf(first.date)}</span>
      {#each order as p, j (p)}
        {@const r = d.people[p].days[i]}
        <span class="row" class:second={j === 1}>
          <span class="av"><Avatar person={p} villager={villagers[p]} size={18} /></span>
          {#each RING_FRUITS as f (f)}
            <span class="c money" class:met={!r.future && r.met[f]}>{#if r.future}<span class="dim">·</span>{:else}{cell(r, f)}{#if r.editedFields.includes(EDIT_OF[f])}<span class="ed"><Glyph kind="pen" size={9} label={t('kiroku.edited')} /></span>{/if}{/if}</span>
          {/each}
        </span>
      {/each}
    </button>
  {/each}
</section>

<ChangeLog {edits} {villagers} withDate />

<style>
  .sub { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin: 0 2px; }
  .sub h3 { margin: 0; font-size: var(--fs-talk); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .total { font-size: var(--fs-title); white-space: nowrap; }
  .people { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding: 12px; --bd: clamp(14px, 4.2vw, 20px); }
  .col { display: grid; gap: 8px; min-width: 0; justify-items: start; }
  .who { display: flex; align-items: center; gap: 6px; min-width: 0; width: 100%; }
  .nm { flex: 1; min-width: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .duo { grid-column: 1 / -1; margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .duo b { color: var(--leaf-text); }
  @media (max-width: 389px) { .people { grid-template-columns: minmax(0, 1fr); } }

  /* the table: a weekday column, then per person a line with an avatar and the five metric columns */
  .days { padding: 4px 6px; display: grid; --wd-w: 22px; --cols: 18px repeat(4, minmax(0, 1fr)) 22px; }
  .days:lang(en) { --wd-w: 2.1rem; }
  .row { display: grid; grid-template-columns: var(--cols); align-items: center; gap: 4px; min-width: 0; }
  .head { grid-template-columns: var(--wd-w) var(--cols); padding: 6px 6px 4px; border-bottom: 2px solid color-mix(in srgb, var(--lip) 40%, transparent); }
  .hc { display: grid; justify-items: end; gap: 1px; line-height: 0; }
  .hc:last-child { justify-items: center; }
  .hc small { font-size: var(--fs-xs); line-height: 1.1; color: var(--text-soft); font-weight: 700; }
  .day {
    appearance: none; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; width: 100%;
    display: grid; grid-template-columns: var(--wd-w) minmax(0, 1fr); align-items: center; column-gap: 0; row-gap: 2px; min-height: 44px; padding: 5px 6px;
    text-align: left;
  }
  .day .wd { grid-row: span 2; }
  .day + .day { border-top: 2px solid color-mix(in srgb, var(--lip) 40%, transparent); }
  .day:active:not([aria-disabled='true']) { background: var(--hl); }
  .day[aria-disabled='true'] { cursor: default; }
  .wd { font-weight: 700; font-size: var(--fs-body); }
  .av { line-height: 0; }
  .c { position: relative; text-align: right; font-size: var(--fs-s); color: var(--text-soft); white-space: nowrap; font-weight: 500; }
  .c:last-child { text-align: center; }
  .c.met { color: var(--leaf-text); font-weight: 700; }
  /* ✎ sits on the corner of the number it changed. */
  .ed { position: absolute; right: -7px; top: -6px; line-height: 0; color: var(--leaf-text); }
  .dim { color: var(--text-soft); }
</style>
