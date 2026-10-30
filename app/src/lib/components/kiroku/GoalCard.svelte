<script lang="ts">
  // 目標 (round 17 IA addendum): my two goals in one place on きろく's からだ, each with ✎: the Move goal (ADR 0021 §5:
  // the 🍐 ring's daily kcal, per person, from today on; earlier days keep theirs) and the weight goal (ADR 0020: shown
  // only, never earns). Only mine: the partner sets theirs on their phone.
  import Avatar from '../characters/Avatar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Glyph from './Glyph.svelte';
  import type { PersonId } from '#lib/types.ts';
  import { fruitArt } from '#lib/art.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { kgText } from './fmt.ts';

  interface Props {
    me: PersonId;
    villager: string | null;
    moveGoal: number;
    goalWeight: number | null;
    onmove: () => void;
    onweight: () => void;
  }
  let { me, villager, moveGoal, goalWeight, onmove, onweight }: Props = $props();
</script>

<section class="card goals" aria-labelledby="goals-h">
  <h3 id="goals-h"><Avatar person={me} {villager} size={24} />{t('goal.title')}</h3>
  <div class="row">
    <span class="ic"><OfficialArt key={fruitArt('pear')} size={22} /></span>
    <span class="k">{t('goal.move')}</span>
    <b class="v money">{t('kiroku.kcal', { n: formatNum(moveGoal) })}</b>
    <button type="button" class="pen" data-sfx="page" data-focus="move-goal" aria-label="{t('goal.move')} ✎" onclick={onmove}><Glyph kind="pen" size={18} /></button>
  </div>
  <div class="row">
    <span class="ic" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#i-scale" /></svg></span>
    <span class="k">{t('goal.weight')}</span>
    <b class="v money" class:none={goalWeight === null}>{goalWeight === null ? t('goal.notSet') : kgText(goalWeight)}</b>
    <button type="button" class="pen" data-sfx="page" data-focus="weight-goal" aria-label="{t('goal.weight')} ✎" onclick={onweight}><Glyph kind="pen" size={18} /></button>
  </div>
</section>

<style>
  .goals { display: grid; gap: 2px; padding: 12px 14px 8px; }
  h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 4px; font-size: var(--fs-body); font-weight: 700; }
  .row { display: flex; align-items: center; gap: 8px; min-height: 48px; }
  .row + .row { border-top: 1px dashed color-mix(in srgb, var(--lip) 70%, transparent); }
  .ic { width: 24px; height: 24px; flex: none; display: grid; place-items: center; line-height: 0; color: var(--text-soft); }
  .ic svg { width: 22px; height: 22px; }
  .k { flex: 1; min-width: 0; font-weight: 700; font-size: var(--fs-body); }
  .v { font-size: var(--fs-talk); white-space: nowrap; }
  .v.none { font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .pen {
    appearance: none; border: 0; cursor: pointer; width: var(--hit); height: var(--hit); border-radius: var(--r-btn); flex: none;
    display: grid; place-items: center; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-obj);
  }
  .pen:active { transform: translateY(2px); box-shadow: var(--sh-obj-press); }
</style>
