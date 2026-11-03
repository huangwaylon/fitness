<script lang="ts">
  // One meal of a person's day (朝ごはん · 昼ごはん · 夜ごはん · おやつ): its kcal, then a row per entry (the food,
  // its amount, its kcal). On my own day ＋ opens the search for this meal, and an entry opens its amount to change or
  // remove it; anyone else's day is read-only (only the owner changes an entry).
  import type { FoodEntry, Meal } from '#lib/contract/food.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { amountText } from './foodUi.ts';

  interface Props {
    meal: Meal;
    entries: FoodEntry[];
    /** My own day: ＋ and the entries take taps. */
    mine: boolean;
    onadd: () => void;
    onpick: (e: FoodEntry) => void;
  }
  let { meal, entries, mine, onadd, onpick }: Props = $props();
  const kcalOf = (e: FoodEntry) => Math.round((e.f.k * e.g) / 100);
  const total = $derived(entries.reduce((s, e) => s + (e.f.k * e.g) / 100, 0));
  const label = $derived(t(`food.meal.${meal}`));
</script>

<section class="card meal" data-meal={meal} aria-labelledby="fm-{meal}">
  <header>
    <h3 id="fm-{meal}">{label}</h3>
    <b class="sub money">{t('kiroku.kcal', { n: formatNum(total) })}</b>
    {#if mine}
      <button type="button" class="add" data-sfx="page" data-add={meal} aria-label={t('food.add', { meal: label })} onclick={onadd}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5 V19 M5 12 H19" /></svg>
      </button>
    {/if}
  </header>
  {#if entries.length}
    <ul>
      {#each entries as e (e.id)}
        <li>
          {#if mine}
            <button type="button" class="row" data-entry={e.id} data-sfx="page" onclick={() => onpick(e)}>
              <span class="nm">{e.f.n}</span><small class="amt">{amountText(e)}</small><b class="kc money">{formatNum(kcalOf(e))}</b>
            </button>
          {:else}
            <div class="row" data-entry={e.id}>
              <span class="nm">{e.f.n}</span><small class="amt">{amountText(e)}</small><b class="kc money">{formatNum(kcalOf(e))}</b>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .meal { display: grid; gap: 2px; padding: 8px 14px; }
  header { display: flex; align-items: center; gap: 8px; min-height: var(--hit); }
  h3 { margin: 0; font-size: var(--fs-body); font-weight: 700; }
  .sub { margin-left: auto; font-size: var(--fs-body); color: var(--text-soft); white-space: nowrap; }
  /* ＋: GoalCard's ✎ object, a cross in it */
  .add {
    appearance: none; border: 0; cursor: pointer; width: var(--hit); height: var(--hit); border-radius: var(--r-btn); flex: none;
    display: grid; place-items: center; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-obj); margin-bottom: var(--lip-h);
  }
  .add:active { transform: translateY(2px); box-shadow: var(--sh-obj-press); }
  .add svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; }
  ul { list-style: none; margin: 0; padding: 0; }
  li + li { border-top: 1px dashed color-mix(in srgb, var(--lip) 70%, transparent); }
  .row {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; text-align: left; width: 100%;
    display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'nm kc' 'amt kc'; align-items: center;
    column-gap: 10px; min-height: var(--row-obj); padding: 6px 2px;
  }
  button.row { cursor: pointer; border-radius: var(--r-chip); }
  button.row:active { background: color-mix(in srgb, var(--lip) 30%, transparent); }
  button.row:focus-visible { outline: 3px solid var(--focus); outline-offset: 0; }
  .nm { grid-area: nm; font-weight: 700; font-size: var(--fs-body); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .amt { grid-area: amt; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .kc { grid-area: kc; font-size: var(--fs-body); }
</style>
