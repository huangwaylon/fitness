<script lang="ts">
  // 3.3 Day detail (round 17 IA §3.1: the home of a day's ベル per fruit, its raw data and its edits): two stacked cards
  // (me, then the partner, read-only), each opening with the day's ベル, then one row per ring fruit: the day's value
  // (green when the goal was met) and the ベル it earned; then the workouts and gym arrivals. ✎ only on mine (steps and
  // exercise minutes; a workout added by hand counts toward 🍑) and only while the week is
  // open (`editable`: Kiroku closes it a minute before the lock); へんこう履歴 at the bottom. Read-only cards get the
  // 見るだけ badge (round 7 F5).
  import type { PersonId, RingFruit } from '#lib/types.ts';
  import type { DayDetail, DayPerson } from '#lib/model/history.ts';
  import Avatar from '../characters/Avatar.svelte';
  import Glyph from './Glyph.svelte';
  import ChangeLog from './ChangeLog.svelte';
  import TypeName from './TypeName.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import { fruitArt } from '#lib/art.ts';
  import { dayTitle, leftLabel, num, typeLabel } from './fmt.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';
  import { timeOf } from '#lib/i18n/format.ts';

  interface Props {
    d: DayDetail;
    /** My card's controls are live. */
    editable: boolean;
    me: PersonId;
    partner: PersonId;
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
    now: number;
    onmetric: (metric: 'steps' | 'exercise_min') => void;
    onworkout: (id: string) => void;
    onadd: () => void;
  }
  let { d, editable, me, partner, names, villagers, now, onmetric, onworkout, onadd }: Props = $props();

  /** A fruit's value that day: 45分 · 420/600 kcal · 93分 · 6,210 · ✓ (a gym day). */
  function value(x: DayPerson, f: RingFruit): string {
    if (f === 'peach') return t('kiroku.min', { n: x.exercise.value });
    if (f === 'pear') return x.move.value === null ? '–' : t('kiroku.kcalOf', { n: num(x.move.value), g: num(x.move.goal) });
    if (f === 'cherry') return x.stand.value === null ? '–' : t('kiroku.min', { n: x.stand.value });
    if (f === 'apple') return num(x.steps.value);
    return x.met.coconut ? '✓' : '–';
  }
  const edited = (x: DayPerson, f: RingFruit): boolean =>
    f === 'peach' ? x.exercise.edited : f === 'pear' ? x.move.edited : f === 'cherry' ? x.stand.edited : f === 'apple' ? x.steps.edited : false;
</script>

<header class="sub">
  <h3>{dayTitle(d.date)}</h3>
  <span class="state" class:locked={!d.open}>
    {#if d.open}<Glyph kind="pen" size={14} />{leftLabel(d.lockAt, now)}{:else}<Glyph kind="lock" size={14} />{t('kiroku.locked')}{/if}
  </span>
</header>

{#snippet person(p: PersonId, x: DayPerson, mine: boolean)}
  {@const can = mine && editable}
  <section class="card pc" class:ro={!can}>
    <div class="who">
      <Avatar person={p} villager={villagers[p]} size={34} />
      <b class="nm">{names[p]}{#if mine}<small> · {t('kiroku.me')}</small>{/if}</b>
      {#if !can}<span class="tag">{#if mine}<Glyph kind="lock" size={12} />{/if}{t('kiroku.readOnly')}</span>{/if}
    </div>
    <div class="earn"><span>{t('kiroku.dayBells')}</span><b class="money">{formatBells(x.bells, { signed: true })}</b></div>
    {#each RING_FRUITS as f (f)}
      {@const edit = f === 'apple' ? 'steps' : f === 'peach' ? 'exercise_min' : null}
      <div class="row fr">
        <span class="ic"><OfficialArt key={fruitArt(f)} size={22} /></span>
        <span class="k">{t(`fruit.${f}`)}</span>
        <span class="v money" class:met={x.met[f]}>{value(x, f)}</span>
        {#if f === 'peach' && x.exercise.source && x.exercise.source !== 'watch'}<span class="src">({t(`kiroku.src.${x.exercise.source}`)})</span>{/if}
        {#if edited(x, f)}<Glyph kind="pen" size={12} label={t('kiroku.edited')} />{/if}
        <b class="money b" class:zero={!x.rings[f]}>{x.rings[f] ? `+${formatNum(x.rings[f])}` : '—'}</b>
        {#if can && edit}<button type="button" class="pen-btn" data-sfx="page" data-focus={edit} aria-label="{t(`fruit.${f}`)} ✎" onclick={() => onmetric(edit)}><Glyph kind="pen" size={18} /></button>
        {:else if can}<span class="pen-sp"></span>{/if}
      </div>
    {/each}
    {#each x.workouts as w (w.id)}
      <div class="row wo" class:out={w.excluded}>
        <span class="k"><TypeName type={w.type} /></span>
        <span class="v small"><span class="money">{w.manual ? '' : timeOf(w.startAt) + ' '}{t('kiroku.min', { n: w.durationMin })}</span>
          {#if w.excluded}<em>{t('kiroku.excluded')}</em>{:else if w.strength}<em class="ok">{t('kiroku.strengthYes')}</em>{/if}
          {#if w.manual}<em>{t('kiroku.manual')}</em>{/if}</span>
        {#if can}<button type="button" class="pen-btn" data-sfx="page" data-focus="w:{w.id}" aria-label="{typeLabel(w.type)} ✎" onclick={() => onworkout(w.id)}><Glyph kind="pen" size={18} /></button>{/if}
      </div>
    {/each}
    {#each x.visits as v (v.id)}
      <div class="row wo">
        <span class="k">{v.label || t('kiroku.gym')}</span>
        <span class="v small"><span class="money">{timeOf(v.arriveAt)}</span><em class="ok">{t('kiroku.gymYes')}</em></span>
      </div>
    {/each}
    {#if can}<button type="button" class="add-btn" data-focus="add" data-sfx="page" onclick={onadd}>＋ {t('kiroku.addWorkout')}</button>{/if}
  </section>
{/snippet}

{@render person(me, d.people[me], true)}
{@render person(partner, d.people[partner], false)}

<ChangeLog edits={d.edits} {villagers} />

<style>
  .sub { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 2px; flex-wrap: wrap; }
  .sub h3 { margin: 0; font-size: var(--fs-talk); }
  .state { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-s); font-weight: 700; color: var(--leaf-text); }
  .state.locked { color: var(--text-soft); }
  .pc { display: grid; gap: 4px; padding: 12px 14px; }
  .pc.ro { background: color-mix(in srgb, var(--fill-on-surface) 70%, var(--surface)); }
  .who { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .nm { flex: 1; font-size: var(--fs-body); }
  .nm small { color: var(--text-soft); font-size: var(--fs-s); }
  .tag { display: inline-flex; align-items: center; gap: 4px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); background: color-mix(in srgb, var(--lip) 45%, transparent); padding: 3px 8px; border-radius: var(--r-chip); }
  .row { display: flex; align-items: center; gap: 8px; min-height: 44px; }
  /* the day's ベル: a yuzu-tinted strip with the one total */
  .earn { display: flex; justify-content: space-between; align-items: baseline; padding: 8px 10px; margin-bottom: 2px; border-radius: var(--r-chip);
    background: var(--hl); font-size: var(--fs-s); font-weight: 700; }
  .earn b { font-size: var(--fs-talk); }
  /* one row per fruit: icon · word · value (green when met) · its ベル · ✎ */
  .fr { gap: 6px; }
  .ic { width: 22px; flex: none; line-height: 0; }
  .fr .k { font-size: var(--fs-s); }
  .fr .v { font-size: var(--fs-body); color: var(--text-soft); }
  .fr .v.met { color: var(--leaf-text); }
  .b { min-width: 3.2em; text-align: right; font-size: var(--fs-s); }
  .b.zero { color: var(--text-soft); font-weight: 500; }
  .pen-sp { width: var(--hit); flex: none; }
  .row + .row, .earn + .row { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 40%, transparent); }
  .k { flex: 1; min-width: 0; font-weight: 700; font-size: var(--fs-body); }
  /* a workout / gym arrival row: the label on its own line at the body size, the time, chips and ✎ right-aligned under it
     (sizing #13: at 12px beside them it wrapped to 3 lines) */
  .wo { flex-wrap: wrap; row-gap: 0; min-height: 0; padding: 8px 0 4px; }
  .wo .k { flex-basis: 100%; }
  .wo .v.small { margin-left: auto; }
  .v { font-size: var(--fs-talk); white-space: nowrap; }
  .v.small { font-size: var(--fs-s); display: flex; align-items: center; gap: 6px; white-space: normal; flex-wrap: wrap; justify-content: flex-end; }
  .v.small .money { font-size: var(--fs-s); }
  .out .k, .out .money { color: var(--text-soft); text-decoration: line-through; }
  em { font-style: normal; font-size: var(--fs-s); white-space: nowrap; font-weight: 700; padding: 2px 6px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 45%, transparent); }
  em.ok { background: var(--c-yuzu); color: var(--c-ink); }
  .src { font-size: var(--fs-s); color: var(--text-soft); font-weight: 700; }
  .add-btn { margin-top: 6px; }
</style>
