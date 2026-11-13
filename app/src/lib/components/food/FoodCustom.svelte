<script lang="ts">
  // A custom food (マイ食品; a level over a search or its amount, docs/design.md "Gohan"): a food not in the data,
  // typed in as one serving. Mine or a new one: its name, 1食の めやす (the serving's label, 「1食」 unless typed) and
  // its weight in g (may stay blank: then it is logged by the serving, never by grams), カロリー (needed) and
  // たんぱく質 · 脂質 · 炭水化物 · 塩分 · 食物繊維 · アルコール in g (each may stay blank), all for one serving; full-width digits welcome
  // (drafts.ts parseAmount). Then けす (a saved one; tapped twice: ほんとうに けす？) and ほぞん (waiting until something
  // changed). Anyone else's: the same, read-only, with who made it, 「コピーして へんしゅう」 and 「ごはんに ついか」; deleted
  // while open, read-only too, 「削除されました」, its copy still offered. A new one
  // from a meal (`andLog`): 「ほぞんして ついか」, saved and one serving logged in the one tap. `quick` (クイック, eating
  // out): the same fields for one entry, no food saved: no serving or weight, the name optional (クイック), ついか.
  import type { Who } from '#lib/types.ts';
  import { CUSTOM } from '#lib/contract/food.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import Avatar from '../characters/Avatar.svelte';
  import { CUSTOM_NUTS, customErrors, customOf, quickErrors, servingText, type CustomDraft } from './drafts.ts';

  interface Props {
    draft: CustomDraft;
    /** Someone else's: shown only (who made it, and how to copy or log it). */
    owner?: { who: Who; name: string; villager: string | null } | null;
    /** A saved custom food of mine (けす), not a new one. */
    saved?: boolean;
    /** Deleted since it was opened: shown only, with a note. */
    gone?: boolean;
    /** Nothing changed since it was saved: ほぞん waits. */
    clean?: boolean;
    onsave?: () => void;
    onremove?: () => void;
    oncopy?: () => void;
    onlog?: () => void;
    /** A new one from a meal: its save logs one serving too (ほぞんして ついか). */
    andLog?: boolean;
    /** A quick entry (クイック), not a food: kcal and what is known, logged (ついか), nothing saved. */
    quick?: boolean;
  }
  let { draft = $bindable(), owner = null, saved = false, gone = false, clean = false, onsave, onremove, oncopy, onlog, andLog = false, quick = false }: Props = $props();

  const ro = $derived(owner !== null || gone);
  const bad = $derived(quick ? quickErrors(draft) : customErrors(draft));
  const ok = $derived(bad.size === 0 && !clean);
  /** A field shows as wrong once something is typed in it that doesn't read (ほぞん waits for the name and kcal). */
  const wrong = (k: keyof CustomDraft) => bad.has(k) && draft[k].trim() !== '';
  const NUTS = CUSTOM_NUTS;
  let removing = $state(false);

  function save() {
    if (ok) onsave?.();
  }
  function remove() {
    if (!removing) return void (removing = true);
    onremove?.();
  }
  const shown = $derived(ro ? customOf(draft) : null);
  const g1 = (v: number | null | undefined) => (v === null || v === undefined ? '–' : v.toFixed(1));
</script>

<form class="cus" data-custom-level={ro ? 'view' : quick ? 'quick' : 'edit'} onsubmit={(e) => { e.preventDefault(); save(); }}>
  {#if ro && shown}
    <section class="card">
      <h3 class="title" data-custom-name>{shown.n}</h3>
      {#if owner}<p class="who"><span class="av" aria-hidden="true"><Avatar worn person={owner.who} villager={owner.villager} size={22} /></span>{t('food.my.by', { name: owner.name })}</p>{/if}
      {#if gone}<p class="who" role="status" data-custom-gone>{t('food.gone')}</p>{/if}
    </section>
    <section class="card">
      <header class="ih"><h4>{t('food.my.perOne', { u: servingText(shown) })}</h4><b class="big money" data-custom-kcal>{t('kiroku.kcal', { n: formatNum(shown.k) })}</b></header>
      <dl class="cells">
        {#each NUTS as k (k)}<div><dt>{t(`food.${k}`)}</dt><dd class="money">{g1(shown[k])}</dd></div>{/each}
      </dl>
    </section>
  {:else}
    <section class="card">
      <label class="field">
        <span class="lbl">{t('food.my.name')}</span>
        <input type="text" bind:value={draft.n} data-sfx="none" data-custom-n maxlength={CUSTOM.nameChars} autocomplete="off" enterkeyhint="next"
          placeholder={t(quick ? 'food.quick.name' : 'food.my.nameHint')} />
      </label>
      {#if quick}
        <p class="hint">{t('food.quick.hint')}</p>
      {:else}
      <div class="two">
        <label class="field">
          <span class="lbl">{t('food.my.serving')}</span>
          <input type="text" bind:value={draft.u} data-sfx="none" data-custom-u maxlength={CUSTOM.labelChars} autocomplete="off" enterkeyhint="next" placeholder={t('food.my.one')} />
        </label>
        <label class="field">
          <span class="lbl">{t('food.my.weight')}</span>
          <span class="unit"><input type="text" inputmode="decimal" bind:value={draft.g} data-sfx="none" data-custom-g autocomplete="off" enterkeyhint="next" maxlength="7" aria-invalid={wrong('g')} /><i>g</i></span>
        </label>
      </div>
      <p class="hint" class:bad={wrong('g')} data-custom-g-hint>{t(wrong('g') ? 'food.my.weightBad' : 'food.my.weightHint')}</p>
      {/if}
    </section>

    <section class="card">
      <h4>{quick ? t('food.quick.head') : t('food.my.perOne', { u: draft.u.trim() || t('food.my.one') })}</h4>
      <label class="field kc">
        <span class="lbl">{t('food.my.kcal')}</span>
        <span class="unit"><input type="text" inputmode="decimal" bind:value={draft.k} data-sfx="none" data-custom-k autocomplete="off" enterkeyhint="next" maxlength="6"
          aria-invalid={wrong('k')} /><i>kcal</i></span>
      </label>
      <div class="nuts">
        {#each NUTS as k (k)}
          <label class="field">
            <span class="lbl">{t(`food.${k}`)}</span>
            <span class="unit"><input type="text" inputmode="decimal" bind:value={draft[k]} data-sfx="none" data-custom-nut={k} autocomplete="off" enterkeyhint="next" maxlength="6" aria-invalid={wrong(k)} /><i>g</i></span>
          </label>
        {/each}
      </div>
      <p class="hint">{t('food.my.nutHint')}</p>
    </section>
  {/if}

  <div class="acts level-acts">
    {#if ro}
      <button type="button" class="btn paper small" data-sfx="confirm" data-custom-copy onclick={() => oncopy?.()}>{t('food.rcp.copy')}</button>
      {#if !gone}<button type="button" class="btn small" data-sfx="page" data-custom-log onclick={() => onlog?.()}>{t('food.rcp.log')}</button>{/if}
    {:else}
      {#if saved}
        <button type="button" class="btn paper small" data-sfx={removing ? 'undo' : 'tick'} data-custom-remove onclick={remove}>{t(removing ? 'food.rcp.removeSure' : 'food.remove')}</button>
      {/if}
      <button type="submit" class="btn small" data-sfx="confirm" data-custom-save aria-disabled={!ok}>{t(quick ? 'food.addOk' : andLog ? 'food.my.saveLog' : 'food.save')}</button>
    {/if}
  </div>
</form>

<style>
  /* FoodRecipe's level: one minmax(0, 1fr) column (never wider than the sheet), its cards, fields and cells */
  .cus { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; padding-bottom: 8px; }
  .card { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; padding: 12px 14px; }
  .title { margin: 0; font-size: var(--fs-talk); font-weight: 700; overflow-wrap: anywhere; }
  .who { margin: 0; display: flex; align-items: center; gap: 6px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .who .av { display: flex; }
  h4, .lbl { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .field { display: grid; gap: 6px; min-width: 0; }
  .field input {
    width: 100%; min-width: 0; min-height: var(--hit); padding: 6px 12px; border: 0; border-radius: var(--r-btn); box-sizing: border-box;
    font: 700 var(--fs-input)/1.1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: inset 0 0 0 2px var(--edge);
  }
  .field input[inputmode] { font-family: var(--font-num); text-align: right; }
  .field input:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .field input[aria-invalid='true'] { box-shadow: inset 0 0 0 2px var(--c-coral); }
  .field input::placeholder { color: color-mix(in srgb, var(--text-soft) 70%, transparent); font-weight: 500; }
  /* the unit after the number, as FoodAmount's grams field */
  .unit { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
  .unit i { font: 700 var(--fs-body)/1 var(--font-num); font-style: normal; color: var(--text-soft); }
  .two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; }
  .nuts { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; }
  .kc input { font-size: var(--fs-title); }
  .hint { margin: 0 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
  .hint.bad { color: var(--c-coral); }
  .ih { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .ih .big { font-size: var(--fs-title); white-space: nowrap; }
  .cells { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin: 0; }
  .cells div { min-width: 0; padding: 8px 6px 6px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 22%, transparent); }
  .cells dt { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cells dd { margin: 3px 0 0; font-size: var(--fs-body); }
</style>
