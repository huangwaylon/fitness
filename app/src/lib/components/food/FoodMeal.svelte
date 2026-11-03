<script lang="ts">
  // One meal of a person's day (朝ごはん · 昼ごはん · 夜ごはん · おやつ): its kcal, then a row per entry (the food,
  // its amount, its kcal). On my own day ＋ opens the search for this meal, and an entry opens its amount to change or
  // remove it; anyone else's day is read-only (only the owner changes an entry). いつもの (a repeat): its weekdays as a
  // chip in the header (my day: a tap manages it; else only shown), its entries marked 🔁 (a day taken out of it shows
  // its own entries, unmarked, under the same chip); on my today a meal with entries and no repeat ends with a small
  // 「いつものに する」 link (not a ＋-sized button: it is for one meal of the four, if any).
  import type { FoodEntry, Meal } from '#lib/contract/food.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { amountText, daysText } from './foodUi.ts';
  import RepeatMark from './RepeatMark.svelte';

  interface Props {
    meal: Meal;
    /** The day's entries of this meal; a repeat's carry `rep` (its id). */
    entries: (FoodEntry & { rep?: string })[];
    /** My own day: ＋ and the entries take taps. */
    mine: boolean;
    /** The meal's repeat's weekday mask (null: none). */
    days: number | null;
    /** The repeat level: the chip's (manage) or, with no repeat, いつものに する's (create). Null: neither. */
    onrepeat: (() => void) | null;
    onadd: () => void;
    onpick: (e: FoodEntry) => void;
  }
  let { meal, entries, mine, days, onrepeat, onadd, onpick }: Props = $props();
  const kcalOf = (e: FoodEntry) => Math.round((e.f.k * e.g) / 100);
  const total = $derived(entries.reduce((s, e) => s + (e.f.k * e.g) / 100, 0));
  const label = $derived(t(`food.meal.${meal}`));
</script>

{#snippet cells(e: FoodEntry & { rep?: string })}
  <span class="nm">{e.f.n}</span>
  <small class="amt">{#if e.rep}<i class="rm" role="img" aria-label={t('food.rep.mark')}><RepeatMark size={12} /></i>{/if}{amountText(e)}</small>
  <b class="kc money">{formatNum(kcalOf(e))}<span class="sr-only"> kcal</span></b>
{/snippet}

<section class="card meal" data-meal={meal} aria-labelledby="fm-{meal}">
  <header>
    <h3 id="fm-{meal}">{label}</h3>
    {#if days !== null}
      {#if onrepeat}
        <button type="button" class="rep" data-sfx="page" data-repeat={meal} aria-label={t('food.rep.manage', { meal: label, days: daysText(days) })} onclick={onrepeat}>
          <RepeatMark /><span>{daysText(days)}</span>
        </button>
      {:else}
        <span class="rep" data-repeat={meal}><i class="rm" role="img" aria-label={t('food.rep.mark')}><RepeatMark /></i><span>{daysText(days)}</span></span>
      {/if}
    {/if}
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
            <button type="button" class="row" data-entry={e.id} data-rep={e.rep} data-sfx="page" onclick={() => onpick(e)}>
              {@render cells(e)}
            </button>
          {:else}
            <div class="row" data-entry={e.id} data-rep={e.rep}>
              {@render cells(e)}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
  {#if days === null && onrepeat && entries.length}
    <button type="button" class="rep new" data-sfx="page" data-repeat-new={meal} aria-label={t('food.rep.newOf', { meal: label })} onclick={onrepeat}>
      <RepeatMark size={12} /><span>{t('food.rep.new')}</span>
    </button>
  {/if}
</section>

<style>
  .meal { display: grid; gap: 2px; padding: 8px 14px; }
  header { display: flex; align-items: center; gap: 8px; min-height: var(--hit); }
  h3 { margin: 0; flex: none; font-size: var(--fs-body); font-weight: 700; }
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
  .rm { display: inline-flex; }
  .amt .rm { margin-right: 4px; vertical-align: -1px; }
  /* the repeat's chip: FoodAmount's chip, small; shown only (another's day): the soft pill, no edge */
  .rep {
    display: inline-flex; align-items: center; gap: 4px; min-width: 0; padding: 4px 10px; border-radius: var(--r-pill);
    font: 700 var(--fs-s)/1.1 var(--font-ui); color: var(--text-soft); background: color-mix(in srgb, var(--lip) 40%, transparent);
  }
  .rep span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  button.rep {
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); padding: 0 12px; margin-bottom: var(--lip-h);
    color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  button.rep:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  button.rep:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* いつものに する: a text link's weight (no pill, no lip), a 44px target all the same */
  button.rep.new {
    justify-self: start; min-height: var(--hit); margin: 0 0 0 -4px; padding: 0 6px; background: none; box-shadow: none;
    color: var(--text-soft); font-size: var(--fs-s); text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 3px;
  }
  button.rep.new:active { transform: none; box-shadow: none; color: var(--text); }
</style>
