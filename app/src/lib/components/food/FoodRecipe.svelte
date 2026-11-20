<script lang="ts">
  // A recipe (マイレシピ; a level over a meal's search or a recipe's amount, docs/design.md "Gohan"). Mine or a new one: its name, how many
  // servings (−/＋, 1–20), its ingredients (each: its category's tile, the food, its amount and everyday name, its kcal; a tap → its amount to change or
  // take out), ＋ ざいりょうを ついか (→ the search → the amount), what it adds up to (a serving's kcal and P/F/C/salt, and
  // the whole's), then けす (a saved one; tapped twice: the board's ほんとうに？) and ほぞん. Anyone else's: the same,
  // read-only, with who set it, 「コピーして へんしゅう」 (a copy of my own, opened here) and, opened from its amount, 「ごはんに
  // ついか」. Deleted while open (by its owner, from either phone): the same read-only view, 「削除されました」, its copy
  // still offered. On top, its picture: four of its ingredients that have one, the most grams first (foodUi.ts recipePlate),
  // 2 × 2 (one alone: itself, 160 px); none: nothing. An ingredient of no known weight (a マイ食品's serving, a chain
  // menu's) counts its values, never a weight, and makes the dish log by the serving (contract/food.ts recipeSnap):
  // under its row (mine) a grams field for its portion's weight (「この材料の重さ（ひとつまみあたり）」) and the food
  // data's nearest food with one as a chip (weighHint); the total says how many have none (「150g＋重さ不明 1品」).
  // Under 何人前, 「できあがりの重さ（g）」 (optional, `cw`: the pot weighed once cooked): set, the dish's values spread over
  // it, and it logs by weight even with an ingredient of no known weight (contract/food.ts recipeWeight); the total says
  // 「全部で 240 kcal（500g） · 2人前なので 1人前は 120 kcal」.
  import { untrack } from 'svelte';
  import type { Who } from '#lib/types.ts';
  import { FOOD_GRAMS, RECIPE, recipeDensityOk, recipeTotals, recipeWeight, round1, type RepeatItem } from '#lib/contract/food.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import Phrases from '../ui/Phrases.svelte';
  import { kcalText } from '../kiroku/fmt.ts';
  import Avatar from '../characters/Avatar.svelte';
  import { imgOf } from '#lib/food/images.ts';
  import { entryKcal } from '#lib/food/index.ts';
  import FoodThumb from './FoodThumb.svelte';
  import { catOf, recipePlate, snapGloss, type RecipeDraft } from './foodUi.ts';
  import { amountText, gramsText, servingOnly } from './portions.ts';
  import { parseAmount } from './drafts.ts';
  import { held, wantImages } from './dbHold.svelte.ts';
  import { weighHint } from './recipeFlow.svelte.ts';

  interface Props {
    draft: RecipeDraft;
    /** Someone else's: shown only (who set it, and how to copy or log it). */
    owner?: { who: Who; name: string; villager: string | null } | null;
    /** A saved recipe of mine (けす), not a new one. */
    saved?: boolean;
    /** Deleted since it was opened: shown only, with a note (no editor whose ほぞん would be refused). */
    gone?: boolean;
    /** Nothing changed since it was saved: ほぞん waits. */
    clean?: boolean;
    onadd?: () => void;
    onitem?: (i: number) => void;
    onsave?: () => void;
    onremove?: () => void;
    oncopy?: () => void;
    onlog?: () => void;
    /** An ingredient of no known weight given one serving's grams (false: refused, too dense). */
    onweigh?: (i: number, g: number) => boolean;
    /** A new recipe made from a meal's search: 保存して追加 (saved, and one serving logged to that meal). */
    andLog?: boolean;
    /** The finished weight typed (none: cleared). */
    oncw?: (cw: number | undefined) => void;
  }
  let { draft = $bindable(), owner = null, saved = false, gone = false, clean = false, onadd, onitem, onsave, onremove, oncopy, onlog, onweigh, andLog = false, oncw }: Props = $props();

  const ro = $derived(owner !== null || gone);
  const tot = $derived(recipeTotals(draft.it));
  const per = (v: number | null) => (v === null ? '–' : (v / draft.sv).toFixed(1));
  const kcalOf = entryKcal;
  /** The finished weight as typed: blank (none), a weight (in the draft), or not one / too light for what it holds. */
  let cwText = $state(untrack(() => (draft.cw === undefined ? '' : gramsText(draft.cw))));
  const cwBad = $derived.by(() => {
    const v = parseAmount(cwText, FOOD_GRAMS.min, FOOD_GRAMS.max);
    return v === undefined ? 'nan' : v !== null && !recipeDensityOk({ ...draft, cw: v }) ? 'dense' : null;
  });
  function typeCw(text: string) {
    cwText = text;
    const v = parseAmount(text, FOOD_GRAMS.min, FOOD_GRAMS.max);
    oncw?.(v ?? undefined);
  }
  const ok = $derived(draft.n.trim().length > 0 && draft.it.length > 0 && !clean && !cwBad);
  /** The ingredients of no known weight (the dish weighed: none to say). */
  const unweighed = $derived(draft.cw === undefined ? draft.it.filter((x) => servingOnly(x.f)).length : 0);
  const allText = $derived.by(() => {
    const w = recipeWeight(draft) ?? tot.g;
    // (grams to one decimal as typed, a whole number with its thousands comma: 「185.5g」, 「1,830g」)
    const k = formatNum(Math.round(tot.k)), g = Number.isInteger(round1(w)) ? formatNum(w) : gramsText(w);
    const all = !unweighed ? (w > 0 ? t('food.rcp.allOf', { k, g }) : t('food.rcp.all', { k })) : t(w > 0 ? 'food.rcp.allMixed' : 'food.rcp.allNone', { k, g, n: unweighed });
    return { all, per: draft.sv > 1 ? t('food.rcp.perOf', { n: draft.sv, k: formatNum(Math.round(tot.k / draft.sv)) }) : null };
  });
  let removing = $state(false);
  /** The catalog (each ingredient's category tile and everyday name), in once it loads (as FoodMeal's), and the pictures. */
  const db = $derived(held.db), imgs = $derived(held.images);
  $effect(() => wantImages(draft.it.map((x) => x.f.id)));
  /** The collage: up to four of the ingredients' pictures, the most grams first (a food once: recipePlate). */
  const hero = $derived(recipePlate(draft.it, (id) => !!imgOf(imgs, id, 160)).flatMap(({ id }) => {
    const img = imgOf(imgs, id, 160);
    return img ? [{ id, img }] : [];
  }));

  /** Each weightless ingredient's grams field (by index) and whether its last try was refused. */
  let wts = $state<Record<number, string>>({});
  let wbad = $state<Record<number, boolean>>({});
  function weigh(i: number, g: number) {
    wbad[i] = !onweigh?.(i, g);
    if (!wbad[i]) delete wts[i];
  }

  function servings(d: -1 | 1) {
    draft.sv = Math.max(RECIPE.servings.min, Math.min(RECIPE.servings.max, draft.sv + d));
  }
  function remove() {
    if (!removing) return void (removing = true);
    onremove?.();
  }
</script>

{#snippet cells(it: RepeatItem)}
  {@const gl = snapGloss(db, it.f)}
  <FoodThumb cat={catOf(db, it.f.id)} size={40} img={imgOf(imgs, it.f.id, 40)} />
  <span class="nm">{it.f.n}</span>
  <small class="amt"><span>{amountText(it)}</span>{#if gl}{' · '}<span class="gl" data-gloss>{gl}</span>{/if}</small>
  <b class="kc money">{formatNum(kcalOf(it))}</b>
{/snippet}

<form class="rcp" data-recipe-level={ro ? 'view' : 'edit'} onsubmit={(e) => { e.preventDefault(); if (ok) onsave?.(); }}>
  <section class="card form">
    {#if hero.length}
      <div class="hero" class:one={hero.length === 1} data-recipe-hero={hero.length} aria-hidden="true">
        {#each hero as h (h.id)}<FoodThumb size={hero.length === 1 ? 160 : 78} img={h.img} />{/each}
      </div>
    {/if}
    {#if ro}
      <h3 class="title" data-recipe-name>{draft.n}</h3>
      {#if owner}<p class="who"><span class="av" aria-hidden="true"><Avatar worn person={owner.who} villager={owner.villager} size={22} /></span>{t('food.rcp.by', { name: owner.name })}</p>{/if}
      {#if gone}<p class="who" role="status" data-recipe-gone>{t('food.gone')}</p>{/if}
    {:else}
      <label class="field">
        <span class="lbl">{t('food.rcp.name')}</span>
        <input class="input" type="text" bind:value={draft.n} data-sfx="none" data-recipe-n maxlength={RECIPE.nameChars} autocomplete="off" enterkeyhint="done"
          placeholder={t('food.rcp.nameHint')} />
      </label>
    {/if}
    <div class="sv">
      <span class="lbl">{t('food.rcp.howMany')}</span>
      {#if !ro}
        <button type="button" class="btn-step" data-sfx="tick" data-sv-step="-1" aria-label={t('food.less')} aria-disabled={draft.sv <= RECIPE.servings.min} onclick={() => servings(-1)}>−</button>
      {/if}
      <b class="money" data-recipe-sv aria-live="polite">{t('food.rcp.servings', { n: draft.sv })}</b>
      {#if !ro}
        <button type="button" class="btn-step" data-sfx="tick" data-sv-step="1" aria-label={t('food.more')} aria-disabled={draft.sv >= RECIPE.servings.max} onclick={() => servings(1)}>＋</button>
      {/if}
    </div>
    {#if ro}
      {#if draft.cw !== undefined}<p class="who" data-recipe-cw-of>{t('food.rcp.cwOf', { g: gramsText(draft.cw) })}</p>{/if}
    {:else}
      <div class="cw">
        <label class="lbl" for="rcp-cw">{t('food.rcp.cw')}</label>
        <input id="rcp-cw" class="input num" type="text" inputmode="decimal" data-sfx="none" data-recipe-cw autocomplete="off" enterkeyhint="done" maxlength="8"
          value={cwText} aria-invalid={!!cwBad || undefined} aria-describedby="rcp-cw-hint" oninput={(e) => typeCw(e.currentTarget.value)} />
        <small id="rcp-cw-hint" class="cwh">{t('food.rcp.cwHint')}</small>
        {#if cwBad}<p class="note bad cwh" role="status" data-recipe-cw-bad><Phrases text={t(cwBad === 'dense' ? 'food.rcp.cwBad' : 'food.rcp.cwNan')} /></p>{/if}
      </div>
    {/if}
  </section>

  <section class="card form">
    <header class="ih"><h4>{t('food.rcp.items')}</h4><b class="money">{kcalText(Math.round(tot.k))}</b></header>
    {#if draft.it.length}
      <ul data-recipe-items>
        {#each draft.it as it, i (it)}
          <li>
            {#if ro}<div class="row">{@render cells(it)}</div>
            {:else}<button type="button" class="row" data-sfx="page" data-recipe-item={i} onclick={() => onitem?.(i)}>{@render cells(it)}</button>
              {#if servingOnly(it.f) && onweigh}
                {@const hint = weighHint(db, it.f)}
                <div class="wt" data-recipe-weigh={i}>
                  <label class="wl" for="rw-{i}">{t('food.rcp.weighOne', { label: it.f.u ?? t('food.rcp.oneServing') })}</label>
                  <div class="wrow">
                    <span class="wf"><input id="rw-{i}" class="input num" type="text" inputmode="decimal" data-sfx="none" data-recipe-weigh-g={i} bind:value={wts[i]} autocomplete="off" enterkeyhint="done"
                        aria-invalid={wbad[i] || undefined} onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); weigh(i, Number(wts[i])); } }} /><span>g</span></span>
                    <button type="button" class="btn paper small" data-sfx="confirm" data-recipe-weigh-set={i} aria-disabled={!(Number(wts[i]) > 0)}
                      onclick={() => Number(wts[i]) > 0 && weigh(i, Number(wts[i]))}>{t('food.rcp.weighSet')}</button>
                  </div>
                  {#if hint}<button type="button" class="text-link hint" data-sfx="confirm" data-recipe-weigh-hint={i} onclick={() => weigh(i, hint.g)}>{t('food.rcp.weighHint', { n: hint.n, label: hint.label, g: formatNum(hint.g) })}</button>{/if}
                  {#if wbad[i]}<p class="note bad" role="status" data-recipe-weigh-bad><Phrases text={t('food.rcp.weighBad')} /></p>{/if}
                </div>
              {/if}
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="note"><Phrases text={t('food.rcp.noItems')} /></p>
    {/if}
    {#if !ro && draft.it.length < RECIPE.items}
      <button type="button" class="btn paper small wide" data-sfx="page" data-recipe-add onclick={() => onadd?.()}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5 V19 M5 12 H19" /></svg>{t('food.rcp.addItem')}
      </button>
    {/if}
  </section>

  <section class="card form">
    <header class="ih"><h4>{t('food.rcp.perOne')}</h4><b class="big money" data-recipe-live-per>{kcalText(Math.round(tot.k / draft.sv))}</b></header>
    <dl class="cells">
      {#each [['p', tot.p], ['fa', tot.fa], ['c', tot.c], ['s', tot.s]] as const as [k, v] (k)}
        <div><dt>{t(`food.${k}`)}</dt><dd class="money">{per(v)}{#if v !== null}<small>g</small>{/if}</dd></div>
      {/each}
    </dl>
    <p class="all money" data-recipe-live-total><span>{allText.all}</span>{#if allText.per}{' · '}<span>{allText.per}</span>{/if}</p>
  </section>

  <div class="acts level-acts">
    {#if ro}
      <button type="button" class="btn paper small" data-sfx="confirm" data-recipe-copy onclick={() => oncopy?.()}>{t('food.rcp.copy')}</button>
      {#if onlog && !gone}<button type="button" class="btn small" data-sfx="page" data-recipe-log onclick={() => onlog()}>{t('food.rcp.log')}</button>{/if}
    {:else}
      {#if saved}
        <button type="button" class="btn paper small" data-sfx={removing ? 'undo' : 'tick'} data-recipe-remove onclick={remove}>{t(removing ? 'food.rcp.removeSure' : 'food.rcp.remove')}</button>
      {/if}
      {#if !clean && !ok && !cwBad}<p class="why" data-recipe-why>{t('food.rcp.why')}</p>{/if}
      <button type="submit" class="btn small" data-sfx="confirm" data-recipe-save aria-disabled={!ok}>{t(andLog ? 'food.my.saveLog' : 'food.rcp.save')}</button>
    {/if}
  </div>
</form>

<style>
  /* FoodAmount's level: one minmax(0, 1fr) column (never wider than the sheet), its cards, steppers and cells */
  .rcp { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; padding-bottom: 8px; }
  .hero { justify-self: center; display: grid; grid-template-columns: repeat(2, 78px); grid-auto-rows: 78px; gap: 4px; margin-bottom: 4px; }
  .hero.one { grid-template-columns: 160px; grid-auto-rows: 160px; }
  .title { margin: 0; font-size: var(--fs-talk); font-weight: 700; overflow-wrap: anywhere; }
  .who { margin: 0; display: flex; align-items: center; gap: 6px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .who .av { display: flex; }
  h4, .lbl { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .field { display: grid; gap: 6px; }
  .sv { display: flex; align-items: center; gap: 8px; }
  .sv .lbl { margin-right: auto; }
  .sv b { min-width: 4em; text-align: center; font-size: var(--fs-talk); }
  .sv .btn-step { margin-bottom: var(--lip-h); }
  .ih { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .ih b { font-size: var(--fs-body); white-space: nowrap; }
  .ih .big { font-size: var(--fs-title); }
  ul { list-style: none; margin: 0; padding: 0; }
  /* why 保存 waits (a name or an ingredient missing), a line of its own over it */
  .why { flex: 1 1 100%; margin: 0 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); text-align: center; }
  li + li { border-top: 1.5px dashed var(--stitch); }
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
  .cells dd small { margin-left: 1px; font-size: var(--fs-xs); }
  /* (a 320 px phone: four tiles cut 「たんぱく質」; two by two) */
  @media (max-width: 359px) { .cells { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  /* (each part whole on its line: 「4人前」 never split) */
  .all span { display: inline-block; }
  .all { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  /* an ingredient of no known weight: a quiet line, a small grams field and a suggestion under its row */
  .wt { display: grid; gap: 4px; padding: 0 2px 8px 50px; }
  .wrow { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
  .wrow .btn { flex: none; white-space: nowrap; }
  .wl, .wf { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .wf { display: flex; align-items: center; gap: 6px; }
  .wf input { width: 4em; padding-inline: 8px; }
  .hint { justify-self: start; margin-left: -4px; }
  .note.bad { color: var(--text); }
  /* the finished weight: its label and field on one row (as 何人前's), the hint one quiet line under them */
  .cw { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; column-gap: 8px; row-gap: 4px; }
  .cw input { width: 5.5em; }
  .cwh { grid-column: 1 / -1; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .note { margin: 0 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
</style>
