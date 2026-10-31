<script lang="ts">
  // 3.3 Day detail (the home of a day's ベル per fruit and its Health data): two stacked cards (me, then the
  // partner), each opening with the day's ベル, then one row per ring fruit: the day's value (green when the goal was
  // met) and the ベル it earned. Read-only: Apple Health is the source of truth.
  import type { PersonId, RingFruit } from '#lib/types.ts';
  import type { DayDetail, DayPerson } from '#lib/model/history.ts';
  import Avatar from '../characters/Avatar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import { fruitArt } from '#lib/art.ts';
  import { dayTitle, num } from './fmt.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';

  interface Props {
    d: DayDetail;
    me: PersonId;
    partner: PersonId;
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
  }
  let { d, me, partner, names, villagers }: Props = $props();

  /** A fruit's value that day: 45分 · 420/600 kcal · 93分 · 6,210. */
  function value(x: DayPerson, f: RingFruit): string {
    if (f === 'peach') return t('kiroku.min', { n: x.exerciseMin });
    if (f === 'pear') return x.move.value === null ? '–' : t('kiroku.kcalOf', { n: num(x.move.value), g: num(x.move.goal) });
    if (f === 'cherry') return x.standMin === null ? '–' : t('kiroku.min', { n: x.standMin });
    return num(x.steps);
  }
</script>

<header class="sub"><h3>{dayTitle(d.date)}</h3></header>

{#snippet person(p: PersonId, x: DayPerson, mine: boolean)}
  <section class="card pc" data-person={p}>
    <div class="who">
      <Avatar person={p} villager={villagers[p]} size={34} />
      <b class="nm">{names[p]}{#if mine}<small>&nbsp;· {t('kiroku.me')}</small>{/if}</b>
    </div>
    <div class="earn"><span>{t('kiroku.dayBells')}</span><b class="money">{formatBells(x.bells, { signed: true })}</b></div>
    {#each RING_FRUITS as f (f)}
      <div class="row fr">
        <span class="ic"><OfficialArt key={fruitArt(f)} size={22} /></span>
        <span class="k">{t(`fruit.${f}`)}</span>
        <span class="v money" class:met={x.met[f]}>{value(x, f)}</span>
        <b class="money b" class:zero={!x.rings[f]}>{x.rings[f] ? `+${formatNum(x.rings[f])}` : '—'}</b>
      </div>
    {/each}
  </section>
{/snippet}

{@render person(me, d.people[me], true)}
{@render person(partner, d.people[partner], false)}

<style>
  .sub { margin: 0 2px; }
  /* the date in the numbers' Fredoka, like the week title */
  .sub h3 { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-num); }
  .pc { display: grid; gap: 4px; padding: 12px 14px; }
  .who { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .nm { flex: 1; font-size: var(--fs-body); }
  .nm small { color: var(--text-soft); font-size: var(--fs-s); }
  .row { display: flex; align-items: center; gap: 8px; min-height: 44px; }
  /* the day's ベル: a yuzu-tinted strip with the one total */
  .earn { display: flex; justify-content: space-between; align-items: baseline; padding: 8px 10px; margin-bottom: 2px; border-radius: var(--r-chip);
    background: var(--hl); font-size: var(--fs-s); font-weight: 700; }
  .earn b { font-size: var(--fs-talk); }
  /* one row per fruit: icon · word · value (green when met) · its ベル */
  .fr { gap: 6px; }
  .ic { width: 22px; flex: none; line-height: 0; }
  .k { flex: 1; min-width: 0; font-weight: 700; font-size: var(--fs-s); }
  .v { font-size: var(--fs-body); color: var(--text-soft); white-space: nowrap; }
  .v.met { color: var(--leaf-text); }
  .b { min-width: 3.2em; text-align: right; font-size: var(--fs-s); }
  .b.zero { color: var(--text-soft); font-weight: 500; }
  .row + .row, .earn + .row { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 40%, transparent); }
</style>
