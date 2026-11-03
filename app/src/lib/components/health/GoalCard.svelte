<script lang="ts">
  // 目標: one person's goals in one place at the foot of けんこう, under the charts, each with ✎: the Move goal (the 🍐
  // ring's daily kcal) and the steps goal (🍎, 8,000 unless set), per person, from today on (earlier days keep theirs),
  // and the weight goal and the body fat goal (both shown only, never earn). Whose: the popup's person (its dropdown,
  // named again in the card's head); either person may set either person's.
  import Avatar from '../characters/Avatar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Glyph from '../kiroku/Glyph.svelte';
  import type { PersonId } from '#lib/types.ts';
  import { BODY_ART, fruitArt } from '#lib/art.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { kgText } from '../kiroku/fmt.ts';
  import { bodyText } from './fmt.ts';

  interface Props {
    /** Whose goals are shown (and edited). */
    person: PersonId;
    name: string;
    villager: string | null;
    moveGoal: number;
    stepsGoal: number;
    goalWeight: number | null;
    goalBodyFat: number | null;
    onmove: () => void;
    onsteps: () => void;
    onweight: () => void;
    onbodyfat: () => void;
    /** The guest's phone: the goals shown, never set, and no weight or body fat goal (からだ figures). */
    readonly?: boolean;
  }
  let { person, name, villager, moveGoal, stepsGoal, goalWeight, goalBodyFat, onmove, onsteps, onweight, onbodyfat, readonly = false }: Props = $props();
</script>

<section class="card goals" aria-labelledby="goals-h" data-person={person}>
  <div class="hd">
    <h3 id="goals-h">{t('goal.title')}</h3>
    <span class="who"><Avatar {person} {villager} size={24} /><span class="nm">{name}</span></span>
  </div>
  <div class="row">
    <span class="ic"><OfficialArt key={fruitArt('pear')} size={22} /></span>
    <span class="k">{t('goal.move')}</span>
    <b class="v money">{t('kiroku.kcal', { n: formatNum(moveGoal) })}</b>
    {#if !readonly}<button type="button" class="pen-btn" data-sfx="page" data-focus="move-goal" aria-label="{name} {t('goal.move')} ✎" onclick={onmove}><Glyph kind="pen" size={18} /></button>{/if}
  </div>
  <div class="row">
    <span class="ic"><OfficialArt key={fruitArt('apple')} size={22} /></span>
    <span class="k">{t('goal.steps')}</span>
    <b class="v money">{t('kiroku.steps', { n: formatNum(stepsGoal) })}</b>
    {#if !readonly}<button type="button" class="pen-btn" data-sfx="page" data-focus="steps-goal" aria-label="{name} {t('goal.steps')} ✎" onclick={onsteps}><Glyph kind="pen" size={18} /></button>{/if}
  </div>
  {#if !readonly}
  <div class="row">
    <span class="ic"><OfficialArt key={BODY_ART.weight} size={22} /></span>
    <span class="k">{t('goal.weight')}</span>
    <b class="v money" class:none={goalWeight === null}>{goalWeight === null ? t('goal.notSet') : kgText(goalWeight)}</b>
    <button type="button" class="pen-btn" data-sfx="page" data-focus="weight-goal" aria-label="{name} {t('goal.weight')} ✎" onclick={onweight}><Glyph kind="pen" size={18} /></button>
  </div>
  <div class="row">
    <span class="ic"><OfficialArt key={BODY_ART.body_fat_pct} size={22} /></span>
    <span class="k">{t('goal.bodyFat')}</span>
    <b class="v money" class:none={goalBodyFat === null}>{goalBodyFat === null ? t('goal.notSet') : bodyText('body_fat_pct', goalBodyFat)}</b>
    <button type="button" class="pen-btn" data-sfx="page" data-focus="fat-goal" aria-label="{name} {t('goal.bodyFat')} ✎" onclick={onbodyfat}><Glyph kind="pen" size={18} /></button>
  </div>
  {/if}
</section>

<style>
  .goals { display: grid; gap: 2px; padding: 12px 14px 8px; }
  .hd { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
  h3 { margin: 0; font-size: var(--fs-body); font-weight: 700; }
  /* whose goals (the popup's person, picked at its top): a label, not a control */
  .who { display: inline-flex; align-items: center; gap: 6px; min-width: 0; min-height: 32px; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .nm { max-width: 6em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row { display: flex; align-items: center; gap: 8px; min-height: var(--row-obj); }
  .row + .row { border-top: 1px dashed color-mix(in srgb, var(--lip) 70%, transparent); }
  .ic { width: 24px; height: 24px; flex: none; display: grid; place-items: center; line-height: 0; color: var(--text-soft); }
  .k { flex: 1; min-width: 0; font-weight: 700; font-size: var(--fs-body); }
  .v { font-size: var(--fs-talk); white-space: nowrap; }
  .v.none { font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
</style>
