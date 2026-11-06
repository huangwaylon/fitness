<script lang="ts">
  // A recipe (マイレシピ; a level over a meal's search or a recipe's amount, docs/design.md "Gohan"). Mine or a new one: its name, how many
  // servings (−/＋, 1–20), its ingredients (each: its category's tile, the food, its amount and everyday name, its kcal; a tap → its amount to change or
  // take out), ＋ ざいりょうを ついか (→ the search → the amount), what it adds up to (a serving's kcal and P/F/C/salt, and
  // the whole's), then けす (a saved one; tapped twice: the board's ほんとうに？) and ほぞん. Anyone else's: the same,
  // read-only, with who set it, 「コピーして へんしゅう」 (a copy of my own, opened here) and 「ごはんに ついか」.
  import type { Who } from '#lib/types.ts';
  import { RECIPE, recipeTotals, type RepeatItem } from '#lib/contract/food.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { kcalText } from '../kiroku/fmt.ts';
  import Avatar from '../characters/Avatar.svelte';
  import { imgOf, type FoodImageIndex } from '#lib/food/images.ts';
  import FoodThumb from './FoodThumb.svelte';
  import { amountText, catalogOf, catOf, foodDbNow, glossOf, itemOf, servingOnly, withImages, type RecipeDraft } from './foodUi.ts';

  interface Props {
    draft: RecipeDraft;
    /** Someone else's: shown only (who set it, and how to copy or log it). */
    owner?: { who: Who; name: string; villager: string | null } | null;
    /** A saved recipe of mine (けす), not a new one. */
    saved?: boolean;
    /** Nothing changed since it was saved: ほぞん waits. */
    clean?: boolean;
    onadd?: () => void;
    onitem?: (i: number) => void;
    onsave?: () => void;
    onremove?: () => void;
    oncopy?: () => void;
    onlog?: () => void;
  }
  let { draft = $bindable(), owner = null, saved = false, clean = false, onadd, onitem, onsave, onremove, oncopy, onlog }: Props = $props();

  const ro = $derived(owner !== null);
  const tot = $derived(recipeTotals(draft.it));
  const per = (v: number | null) => (v === null ? '–' : (v / draft.sv).toFixed(1));
  const kcalOf = (it: RepeatItem) => Math.round((it.f.k * it.g) / 100);
  const ok = $derived(draft.n.trim().length > 0 && draft.it.length > 0 && !clean);
  let removing = $state(false);
  let imgs = $state.raw<FoodImageIndex | null>(null);
  $effect(() => withImages((ix) => (imgs = ix)));

  function servings(d: -1 | 1) {
    draft.sv = Math.max(RECIPE.servings.min, Math.min(RECIPE.servings.max, draft.sv + d));
  }
  function remove() {
    if (!removing) return void (removing = true);
    onremove?.();
  }
</script>

{#snippet cells(it: RepeatItem)}
  {@const db = foodDbNow()}
  {@const gl = glossOf(catalogOf(db, it.f.id) ?? itemOf(it.f, null), it.f.n)}
  <FoodThumb cat={catOf(db, it.f.id)} size={40} img={imgOf(imgs, it.f.id, 40)} />
  <span class="nm">{it.f.n}</span>
  <small class="amt"><span>{amountText(it)}</span>{#if gl}{' · '}<span class="gl" data-gloss>{gl}</span>{/if}</small>
  <b class="kc money">{formatNum(kcalOf(it))}</b>
{/snippet}

<form class="rcp" data-recipe-level={ro ? 'view' : 'edit'} onsubmit={(e) => { e.preventDefault(); if (ok) onsave?.(); }}>
  <section class="card">
    {#if ro && owner}
      <h3 class="title" data-recipe-name>{draft.n}</h3>
      <p class="who"><span class="av" aria-hidden="true"><Avatar worn person={owner.who} villager={owner.villager} size={22} /></span>{t('food.rcp.by', { name: owner.name })}</p>
    {:else}
      <label class="field">
        <span class="lbl">{t('food.rcp.name')}</span>
        <input type="text" bind:value={draft.n} data-sfx="none" data-recipe-n maxlength={RECIPE.nameChars} autocomplete="off" enterkeyhint="done"
          placeholder={t('food.rcp.nameHint')} />
      </label>
    {/if}
    <div class="sv">
      <span class="lbl">{t('food.rcp.howMany')}</span>
      {#if !ro}
        <button type="button" class="nb" data-sfx="tick" data-sv-step="-1" aria-label={t('food.less')} aria-disabled={draft.sv <= RECIPE.servings.min} onclick={() => servings(-1)}>−</button>
      {/if}
      <b class="money" data-recipe-sv aria-live="polite">{t('food.rcp.servings', { n: draft.sv })}</b>
      {#if !ro}
        <button type="button" class="nb" data-sfx="tick" data-sv-step="1" aria-label={t('food.more')} aria-disabled={draft.sv >= RECIPE.servings.max} onclick={() => servings(1)}>＋</button>
      {/if}
    </div>
  </section>

  <section class="card">
    <header class="ih"><h4>{t('food.rcp.items')}</h4><b class="money">{kcalText(Math.round(tot.k))}</b></header>
    {#if draft.it.length}
      <ul data-recipe-items>
        {#each draft.it as it, i (i)}
          <li>
            {#if ro}<div class="row">{@render cells(it)}</div>
            {:else}<button type="button" class="row" data-sfx="page" data-recipe-item={i} onclick={() => onitem?.(i)}>{@render cells(it)}</button>{/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="note">{t('food.rcp.noItems')}</p>
    {/if}
    {#if !ro && draft.it.length < RECIPE.items}
      <button type="button" class="btn paper small wide" data-sfx="page" data-recipe-add onclick={() => onadd?.()}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5 V19 M5 12 H19" /></svg>{t('food.rcp.addItem')}
      </button>
    {/if}
  </section>

  <section class="card">
    <header class="ih"><h4>{t('food.rcp.perOne')}</h4><b class="big money" data-recipe-live-per>{kcalText(Math.round(tot.k / draft.sv))}</b></header>
    <dl class="cells">
      {#each [['p', tot.p], ['fa', tot.fa], ['c', tot.c], ['s', tot.s]] as const as [k, v] (k)}
        <div><dt>{t(`food.${k}`)}</dt><dd class="money">{per(v)}</dd></div>
      {/each}
    </dl>
    <p class="all money" data-recipe-live-total>{draft.it.some((x) => servingOnly(x.f)) ? t('food.rcp.all', { k: formatNum(Math.round(tot.k)) }) : t('food.rcp.allOf', { k: formatNum(Math.round(tot.k)), g: formatNum(Math.round(tot.g)) })}</p>
  </section>

  <div class="acts level-acts">
    {#if ro}
      <button type="button" class="btn paper small" data-sfx="confirm" data-recipe-copy onclick={() => oncopy?.()}>{t('food.rcp.copy')}</button>
      <button type="button" class="btn small" data-sfx="page" data-recipe-log onclick={() => onlog?.()}>{t('food.rcp.log')}</button>
    {:else}
      {#if saved}
        <button type="button" class="btn paper small" data-sfx={removing ? 'undo' : 'tick'} data-recipe-remove onclick={remove}>{t(removing ? 'food.rcp.removeSure' : 'food.rcp.remove')}</button>
      {/if}
      <button type="submit" class="btn small" data-sfx="confirm" data-recipe-save aria-disabled={!ok}>{t('food.rcp.save')}</button>
    {/if}
  </div>
</form>

<style>
  /* FoodAmount's level: one minmax(0, 1fr) column (never wider than the sheet), its cards, steppers and cells */
  .rcp { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; padding-bottom: 8px; }
  .card { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; padding: 12px 14px; }
  .title { margin: 0; font-size: var(--fs-talk); font-weight: 700; overflow-wrap: anywhere; }
  .who { margin: 0; display: flex; align-items: center; gap: 6px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .who .av { display: flex; }
  h4, .lbl { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .field { display: grid; gap: 6px; }
  .field input {
    width: 100%; min-width: 0; min-height: var(--hit); padding: 6px 12px; border: 0; border-radius: var(--r-btn); box-sizing: border-box;
    font: 700 var(--fs-input)/1.1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: inset 0 0 0 2px var(--edge);
  }
  .field input:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .field input::placeholder { color: color-mix(in srgb, var(--text-soft) 70%, transparent); font-weight: 500; }
  .sv { display: flex; align-items: center; gap: 8px; }
  .sv .lbl { margin-right: auto; }
  .sv b { min-width: 4em; text-align: center; font-size: var(--fs-talk); }
  .nb {
    appearance: none; border: 0; cursor: pointer; width: var(--hit); min-height: var(--hit); flex: none; border-radius: var(--r-pill);
    font: 700 var(--fs-talk)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl); margin-bottom: var(--lip-h);
  }
  .nb:active:not([aria-disabled='true']) { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .nb[aria-disabled='true'] { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; cursor: default; }
  .ih { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .ih b { font-size: var(--fs-body); white-space: nowrap; }
  .ih .big { font-size: var(--fs-title); }
  ul { list-style: none; margin: 0; padding: 0; }
  li + li { border-top: 1px dashed color-mix(in srgb, var(--lip) 70%, transparent); }
  /* FoodMeal's rows */
  .row {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; text-align: left; width: 100%;
    display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: 'th nm kc' 'th amt kc'; align-items: center;
    column-gap: 10px; min-height: var(--row-obj); padding: 6px 2px;
  }
  .row > :global([data-thumb]) { grid-area: th; margin: -2px 0; }
  button.row { cursor: pointer; border-radius: var(--r-chip); }
  button.row:active { background: color-mix(in srgb, var(--lip) 30%, transparent); }
  button.row:focus-visible { outline: 3px solid var(--focus); outline-offset: 0; }
  .nm { grid-area: nm; font-weight: 700; font-size: var(--fs-body); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .amt { grid-area: amt; display: flex; min-width: 0; white-space: pre; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .amt > :not(.gl) { flex: none; }
  .gl { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .kc { grid-area: kc; font-size: var(--fs-body); }
  .wide { width: 100%; margin: 0; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
  .wide svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; }
  .cells { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin: 0; }
  .cells div { min-width: 0; padding: 8px 6px 6px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 22%, transparent); }
  .cells dt { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cells dd { margin: 3px 0 0; font-size: var(--fs-body); }
  .all { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .note { margin: 0 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
</style>
