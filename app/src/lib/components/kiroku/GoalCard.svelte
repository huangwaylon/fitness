<script lang="ts">
  // 目標 (round 17 IA addendum): one person's two goals in one place on きろく's からだ, each with ✎: the Move goal (ADR
  // 0021 §5: the 🍐 ring's daily kcal, per person, from today on; earlier days keep theirs) and the weight goal (ADR
  // 0020: shown only, never earns). The two avatars on top switch whose goals these are; either person may set either
  // person's (ADR 0023).
  import Avatar from '../characters/Avatar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Glyph from './Glyph.svelte';
  import type { PersonId } from '#lib/types.ts';
  import { fruitArt } from '#lib/art.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { kgText } from './fmt.ts';

  interface Props {
    /** Whose goals are shown (and edited). */
    person: PersonId;
    order: PersonId[];
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
    moveGoal: number;
    goalWeight: number | null;
    onperson: (p: PersonId) => void;
    onmove: () => void;
    onweight: () => void;
  }
  let { person, order, names, villagers, moveGoal, goalWeight, onperson, onmove, onweight }: Props = $props();
</script>

<section class="card goals" aria-labelledby="goals-h">
  <div class="hd">
    <h3 id="goals-h">{t('goal.title')}</h3>
    <div class="who" role="group" aria-label={t('goal.whose')}>
      {#each order as p (p)}
        <button type="button" class="pp" aria-pressed={person === p} data-sfx={person === p ? 'none' : 'tick'} data-person={p} onclick={() => onperson(p)}>
          <Avatar person={p} villager={villagers[p]} size={24} /><span class="nm">{names[p]}</span>
        </button>
      {/each}
    </div>
  </div>
  <div class="row">
    <span class="ic"><OfficialArt key={fruitArt('pear')} size={22} /></span>
    <span class="k">{t('goal.move')}</span>
    <b class="v money">{t('kiroku.kcal', { n: formatNum(moveGoal) })}</b>
    <button type="button" class="pen-btn" data-sfx="page" data-focus="move-goal" aria-label="{names[person]} {t('goal.move')} ✎" onclick={onmove}><Glyph kind="pen" size={18} /></button>
  </div>
  <div class="row">
    <span class="ic" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#i-scale" /></svg></span>
    <span class="k">{t('goal.weight')}</span>
    <b class="v money" class:none={goalWeight === null}>{goalWeight === null ? t('goal.notSet') : kgText(goalWeight)}</b>
    <button type="button" class="pen-btn" data-sfx="page" data-focus="weight-goal" aria-label="{names[person]} {t('goal.weight')} ✎" onclick={onweight}><Glyph kind="pen" size={18} /></button>
  </div>
</section>

<style>
  .goals { display: grid; gap: 2px; padding: 12px 14px 8px; }
  .hd { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
  h3 { margin: 0; font-size: var(--fs-body); font-weight: 700; }
  /* whose goals: two avatar pills (a segmented switch), each a full tap target */
  .who { display: flex; gap: 6px; min-width: 0; }
  .pp {
    appearance: none; border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; min-height: var(--hit); min-width: 0;
    padding: 0 12px 0 8px; border-radius: var(--r-pill); font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text);
    background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .pp[aria-pressed='true'] { background: var(--ctl-sel); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); }
  .nm { max-width: 6em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row { display: flex; align-items: center; gap: 8px; min-height: var(--row-obj); }
  .row + .row { border-top: 1px dashed color-mix(in srgb, var(--lip) 70%, transparent); }
  .ic { width: 24px; height: 24px; flex: none; display: grid; place-items: center; line-height: 0; color: var(--text-soft); }
  .ic svg { width: 22px; height: 22px; }
  .k { flex: 1; min-width: 0; font-weight: 700; font-size: var(--fs-body); }
  .v { font-size: var(--fs-talk); white-space: nowrap; }
  .v.none { font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
</style>
