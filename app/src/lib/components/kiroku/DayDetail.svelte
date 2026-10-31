<script lang="ts">
  // A day (the home of its Health data): ふたりでぜんぶ (+2 when both met all four goals), then two stacked cards (me,
  // then the partner), each opening with the day's ベル, then one row per goal: the day's value (green when met, ★ at
  // 1.5×) and its +1 (+2 with its がんばり paid), then the day's がんばり when any (+2 上限 when more were reached).
  // Read-only: Apple Health is the source of truth.
  import type { PersonId, RingFruit } from '#lib/types.ts';
  import type { DayDetail, DayPerson } from '#lib/model/history.ts';
  import Avatar from '../characters/Avatar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { RING_FRUITS, RULES, STRETCH } from '#lib/config/rules.ts';
  import { fruitArt } from '#lib/art.ts';
  import { dayTitle, num } from './fmt.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';

  interface Props {
    d: DayDetail;
    me: PersonId;
    partner: PersonId;
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
  }
  let { d, me, partner, names, villagers }: Props = $props();

  /** A goal's value that day: 45分 · 420/600 kcal · 93分 · 6,210歩. */
  function value(x: DayPerson, f: RingFruit): string {
    if (f === 'peach') return t('kiroku.min', { n: x.exerciseMin });
    if (f === 'pear') return x.move.value === null ? '–' : t('kiroku.kcalOf', { n: num(x.move.value), g: num(x.move.goal) });
    if (f === 'cherry') return x.standMin === null ? '–' : t('kiroku.min', { n: x.standMin });
    return x.steps === null ? '–' : t('kiroku.steps', { n: num(x.steps) });
  }
</script>

<header class="sub"><h3>{dayTitle(d.date)}</h3></header>

<section class="card duo" class:met={d.together}>
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" /></svg>
  <span class="k">{t('together.name')}</span>
  <b class="money">{d.together ? formatBells(RULES.together, { signed: true }) : '—'}</b>
</section>

{#snippet star()}
  <svg class="st" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" /></svg>
{/snippet}

{#snippet person(p: PersonId, x: DayPerson, mine: boolean)}
  <section class="card pc" data-person={p}>
    <div class="who">
      <Avatar person={p} villager={villagers[p]} size={34} />
      <b class="nm">{names[p]}{#if mine}<small>&nbsp;· {t('kiroku.me')}</small>{/if}</b>
      <b class="money day">{formatBells(x.bells, { signed: true })}</b>
    </div>
    {#each RING_FRUITS as f (f)}
      <div class="row">
        <span class="ic"><OfficialArt key={fruitArt(f)} size={22} /></span>
        <span class="k">{t(`fruit.${f}`)}</span>
        <span class="v money" class:met={x.met[f]}>{value(x, f)}{#if x.stretched[f]}{@render star()}{/if}</span>
        <b class="money b" class:zero={!x.met[f]}>{x.met[f] ? `+${x.rings[f]}` : '—'}</b>
      </div>
    {/each}
    {#if x.stretch}
      {@const capped = RING_FRUITS.filter((f) => x.stretched[f]).length * STRETCH.perGoal > STRETCH.cap}
      <div class="gbrow" data-stretch={x.stretch}>
        <span class="ic">{@render star()}</span>
        <span class="k">{t('kiroku.stretch')}</span>
        <b class="money b">{capped ? t('kiroku.stretchCap', { b: x.stretch }) : `+${x.stretch}`}</b>
      </div>
    {/if}
  </section>
{/snippet}

{@render person(me, d.people[me], true)}
{@render person(partner, d.people[partner], false)}

<style>
  .sub { margin: 0 2px; }
  /* the date in the numbers' Fredoka */
  .sub h3 { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-num); }
  .duo { display: flex; align-items: center; gap: 8px; min-height: 52px; padding: 6px 14px; font-weight: 700; }
  .duo svg { width: 22px; height: 22px; flex: none; fill: color-mix(in srgb, var(--text) 25%, transparent); }
  .duo.met svg { fill: var(--c-yuzu-lip); }
  .duo b { font-size: var(--fs-talk); }
  .duo:not(.met) b { color: var(--text-soft); font-weight: 500; }
  .pc { display: grid; gap: 4px; padding: 12px 14px; }
  .who { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .nm { flex: 1; font-size: var(--fs-body); }
  .nm small { color: var(--text-soft); font-size: var(--fs-s); }
  .day { font-size: var(--fs-talk); }
  /* one row per goal: icon · word · value (green when met) · +1 */
  .row, .gbrow { display: flex; align-items: center; gap: 6px; min-height: 44px; }
  .row + .row, .who + .row, .row + .gbrow { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 40%, transparent); }
  .ic { width: 22px; flex: none; line-height: 0; }
  .k { flex: 1; min-width: 0; font-weight: 700; font-size: var(--fs-s); }
  .v { font-size: var(--fs-body); color: var(--text-soft); white-space: nowrap; }
  .v.met { color: var(--leaf-text); }
  .b { min-width: 2.4em; text-align: right; font-size: var(--fs-s); }
  .st { width: 15px; height: 15px; margin-left: 4px; vertical-align: -2px; fill: var(--c-yuzu-lip); }
  .gbrow .ic .st { width: 20px; height: 20px; margin: 0; }
  .b.zero { color: var(--text-soft); font-weight: 500; }
</style>
