<script lang="ts">
  // 3.3 Day detail: two stacked cards (me, then the partner, read-only), each opening with the day's ベル and what each
  // fruit earned. ✎ only on mine and only while the week is
  // open (`editable`: Kiroku closes it a minute before the lock); へんこう履歴 at the bottom. Check-ins toggle in place
  // (a fix, `edit:true`). Read-only cards get the 見るだけ badge and flat, lipless chips (round 7 F5).
  import type { PersonId } from '#lib/types.ts';
  import type { DayDetail, DayPerson } from '#lib/model/history.ts';
  import Avatar from '../characters/Avatar.svelte';
  import Glyph from './Glyph.svelte';
  import ChangeLog from './ChangeLog.svelte';
  import TypeName from './TypeName.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { FRUITS } from '#lib/config/rules.ts';
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
    ontick: (habit: string, done: boolean) => void;
  }
  let { d, editable, me, partner, names, villagers, now, onmetric, onworkout, onadd, ontick }: Props = $props();
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
    <div class="earn" aria-label="{t('kiroku.dayBells')} {formatBells(x.bells)}">
      <span class="eh"><span>{t('kiroku.dayBells')}</span><b class="money">{formatBells(x.bells, { signed: true })}</b></span>
      <span class="eparts">
        {#each FRUITS as f (f)}
          <span class="ep" class:zero={!x.parts[f]}><OfficialArt key={fruitArt(f)} size={18} /><span class="sr-only">{t(`fruit.${f}`)}</span><span class="money">{x.parts[f] > 0 ? '+' : ''}{formatNum(x.parts[f])}</span></span>
        {/each}
      </span>
    </div>
    <div class="row">
      <span class="k">{t('kiroku.steps')}</span>
      <span class="v money">{num(x.steps.value)}</span>
      {#if x.steps.edited}<Glyph kind="pen" size={12} label={t('kiroku.edited')} />{/if}
      {#if can}<button type="button" class="pen" data-sfx="page" data-focus="steps" aria-label="{t('kiroku.steps')} ✎" onclick={() => onmetric('steps')}><Glyph kind="pen" size={18} /></button>{/if}
    </div>
    <div class="row">
      <span class="k">{t('kiroku.minutes')}</span>
      <span class="v money">{t('kiroku.min', { n: x.minutes.value })}</span>
      {#if x.minutes.source}<span class="src">({t(`kiroku.src.${x.minutes.source}`)})</span>{/if}
      {#if x.minutes.edited}<Glyph kind="pen" size={12} label={t('kiroku.edited')} />{/if}
      {#if can}<button type="button" class="pen" data-sfx="page" data-focus="exercise_min" aria-label="{t('kiroku.minutes')} ✎" onclick={() => onmetric('exercise_min')}><Glyph kind="pen" size={18} /></button>{/if}
    </div>
    {#each x.workouts as w (w.id)}
      <div class="row wo" class:out={w.excluded}>
        <span class="k"><TypeName type={w.type} /></span>
        <span class="v small"><span class="money">{w.manual ? '' : timeOf(w.startAt) + ' '}{t('kiroku.min', { n: w.durationMin })}</span>
          {#if w.excluded}<em>{t('kiroku.excluded')}</em>{:else if w.strength}<em class="ok">{t('kiroku.strengthYes')}</em>{/if}
          {#if w.manual}<em>{t('kiroku.manual')}</em>{/if}</span>
        {#if can}<button type="button" class="pen" data-sfx="page" data-focus="w:{w.id}" aria-label="{typeLabel(w.type)} ✎" onclick={() => onworkout(w.id)}><Glyph kind="pen" size={18} /></button>{/if}
      </div>
    {/each}
    {#each x.visits as v (v.id)}
      <div class="row wo">
        <span class="k">{v.place}</span>
        <span class="v small"><span class="money">{timeOf(v.arriveAt)}</span><em class="ok">{t('kiroku.strengthYes')}</em></span>
      </div>
    {/each}
    <div class="ticks" role="group" aria-label={t('kiroku.checkins')}>
      {#each x.habits.keys as h (h)}
        {@const on = x.habits.done.includes(h)}
        {#if can}
          <button type="button" class="tick" class:on aria-pressed={on} data-sfx={on ? 'toggle-off' : 'toggle-on'} onclick={() => ontick(h, !on)}>{#if on}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{/if}{t(`habit.${h}`)}</button>
        {:else}
          <span class="tick" class:on>{#if on}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{/if}{t(`habit.${h}`)}</span>
        {/if}
      {/each}
    </div>
    {#if can}<button type="button" class="add" data-focus="add" data-sfx="page" onclick={onadd}>＋ {t('kiroku.addWorkout')}</button>{/if}
  </section>
{/snippet}

{@render person(me, d.people[me], true)}
{@render person(partner, d.people[partner], false)}

<ChangeLog edits={d.edits} {villagers} />

<style>
  .sub { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 2px; flex-wrap: wrap; }
  .sub h3 { margin: 0; font-size: var(--fs-talk); }
  .state { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-s); font-weight: 700; color: var(--c-leaf-lip); }
  .state.locked { color: var(--text-soft); }
  .pc { display: grid; gap: 4px; padding: 12px 14px; }
  .pc.ro { background: color-mix(in srgb, var(--fill-on-surface) 70%, var(--surface)); }
  .who { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .nm { flex: 1; font-size: var(--fs-body); }
  .nm small { color: var(--text-soft); font-size: var(--fs-s); }
  .tag { display: inline-flex; align-items: center; gap: 4px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); background: color-mix(in srgb, var(--lip) 45%, transparent); padding: 3px 8px; border-radius: var(--r-chip); }
  .row { display: flex; align-items: center; gap: 8px; min-height: 44px; }
  /* the day's ベル: a yuzu-tinted strip, the four fruit's shares in one row (two at 320) */
  .earn { display: grid; gap: 6px; padding: 8px 10px; margin-bottom: 4px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--c-yuzu) 30%, transparent); }
  .eh { display: flex; justify-content: space-between; align-items: baseline; font-size: var(--fs-s); font-weight: 700; }
  .eh b { font-size: var(--fs-talk); }
  .eparts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
  .ep { display: inline-flex; align-items: center; gap: 3px; min-width: 0; white-space: nowrap; }
  .ep .money { font-size: var(--fs-s); overflow: hidden; text-overflow: ellipsis; }
  .ep.zero { opacity: .5; }
  @media (max-width: 374px) { .eparts { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .row + .row, .earn + .row { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 40%, transparent); }
  .k { flex: 1; min-width: 0; font-weight: 700; font-size: var(--fs-body); }
  /* a workout / visit row: the label on its own line at the body size, the time, chips and ✎ right-aligned under it
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
  .pen {
    appearance: none; border: 0; cursor: pointer; width: var(--hit); height: var(--hit); border-radius: var(--r-btn); flex: none;
    display: grid; place-items: center; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-obj);
  }
  .pen:active { transform: translateY(2px); box-shadow: var(--sh-obj-press); }
  .ticks { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 0 4px; }
  .tick {
    appearance: none; border: 0; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text); min-height: 36px; padding: 0 10px;
    display: inline-flex; align-items: center; gap: 4px; border-radius: var(--r-pill);
    background: color-mix(in srgb, var(--lip) 35%, transparent);
  }
  /* 36px chips, a 44px hit area (sizing #8) */
  button.tick { position: relative; cursor: pointer; background: var(--ctl); box-shadow: inset 0 0 0 2px var(--edge), 0 3px 0 var(--edge); }
  button.tick::after { content: ''; position: absolute; inset: -4px 0; }
  button.tick:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  button.tick.on { background: var(--c-mint); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), 0 3px 0 var(--c-edge); }
  .tick.on { background: var(--c-mint); color: var(--c-ink); }
  /* Read-only chips: flat, no lip, a quieter fill; nothing about them says "tap me". */
  span.tick { background: transparent; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--lip) 55%, transparent); cursor: default; }
  span.tick.on { background: color-mix(in srgb, var(--c-mint) 35%, transparent); box-shadow: none; }
  .tick svg { width: 14px; height: 14px; }
  .add {
    appearance: none; border: 0; cursor: pointer; margin-top: 6px; min-height: 44px; border-radius: var(--r-btn);
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--c-ink); background: color-mix(in srgb, var(--c-leaf) 35%, var(--c-card));
    box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge);
  }
  .add:active { transform: translateY(3px); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 1px 0 var(--c-leaf-edge); }
</style>
