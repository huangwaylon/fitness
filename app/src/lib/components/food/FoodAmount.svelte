<script lang="ts">
  // ごはん's amount (a level over the search or the day; docs/design.md "Gohan" Amount). The head: its picture when it
  // has one (104 px beside the name, the イメージ badge: every picture is generated; a tap: FoodPhoto, it enlarged),
  // its name, everyday name (glossOf) and 「これは…」 line (`desc`); under them what this amount holds, live: the kcal
  // (the sheet's loudest number) with the grams it's for, P · F · C · 塩分, and under them behind 「100gあたりの栄養」
  // (closed on each open) the values per 100 g.
  // Then the controls (FoodPortion, their rules amount.svelte.ts) in the order they're decided: じょうたい, a food in its states (the data's vg/st), a chip per
  // state with its kcal at the amount it would take (`onitem` swaps the food: a portion label the state also has stays
  // picked at its own grams, typed grams stay typed, else its default), one line why (パックの重さなら 生 / ゆでる前の
  // 重さなら 乾); its portions as chips (the first the default; 100 g last), −/＋ by a whole portion for the things you
  // count and by half one for the rest (±10 g once grams are typed: stepOf), the grams field (ml for a drink). The foot
  // (sticky, at the screen's foot for a short food): which meal (gone while the grams are typed: the keyboard's up),
  // then 追加 with the kcal (a new entry) or 保存 / 削除 (my entry). For a recipe's ingredient (`pick`): no meal, the recipe's words.
  // The item may be swapped while it is open (an entry opened from its snapshot, the catalog's portions arriving):
  // untouched, the amount starts again from the same grams; touched, the portion picked stays picked (by its label).
  // A serving with no known weight (`serving`: a custom food's, マイ食品): its values per serving, its one portion stepped
  // by whole servings, no grams field. A recipe's or custom food's: `open`, a button left of 追加 to open it.
  import { untrack } from 'svelte';
  import type { Meal } from '#lib/contract/food.ts';
  import { MEALS } from '#lib/contract/food.ts';
  import { verifyOf, type Item } from '#lib/food/index.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { imgOf, type FoodImageIndex } from '#lib/food/images.ts';
  import FoodThumb from './FoodThumb.svelte';
  import FoodPhoto from './FoodPhoto.svelte';
  import FoodPortion from './FoodPortion.svelte';
  import { AmountPick } from './amount.svelte.ts';
  import { catalogOf, glossOf, withImages } from './foodUi.ts';

  interface Props {
    item: Item;
    meal: Meal;
    /** The grams and portion label to start from (an entry's, a recent one's); else the default portion. */
    g0?: number;
    u0?: string;
    /** An entry of mine: ほぞん and けす instead of ついか. */
    editing?: boolean;
    /** A recipe's ingredient, not a meal: no meal to pick, the recipe's words. */
    pick?: boolean;
    /** A serving with no known weight (FoodSnap `sv`): whole servings, no grams. */
    serving?: boolean;
    ondone: (v: { m: Meal; g: number; u: string | null }) => void;
    onremove?: () => void;
    /** What the food came from, to open (a recipe, a custom food). */
    open?: { label: string; run: () => void } | null;
    /** A いつもの's entry: 保存 / 削除 change this day only (said above them). */
    once?: boolean;
    /** Another state of the food picked (じょうたい): log that one instead. */
    onitem?: (it: Item) => void;
  }
  let { item, meal, g0, u0, editing = false, pick = false, serving = false, ondone, onremove, open = null, onitem, once = false }: Props = $props();

  /** The picker (状態, 量, ×n, grams: amount.svelte.ts, its controls FoodPortion). */
  const a = new AmountPick(() => ({ item, g0, u0, serving, onitem }));
  // (the level is keyed: a new food or entry mounts a new one, so the meal is read once)
  let m = $state<Meal>(untrack(() => meal));
  const n = $derived(a.n);
  let imgs = $state.raw<FoodImageIndex | null>(null);
  $effect(() => withImages((ix) => (imgs = ix)));
  /** The picture's box beside the name (its detail cell scaled down: sharp at 3×). */
  const PIC = 104;
  const pic = $derived(imgOf(imgs, item.id, 160));
  /** The values per 100 g (or per serving) shown: closed on every open, never remembered. */
  let perOpen = $state(false);
  /** The grams field focused (the keyboard up): the meal row leaves the foot, which then covers less, and 保存 says
   *  the kcal too, as 追加 always does (the head's may be scrolled off over the keyboard). */
  let typing = $state(false);
  /** The picture enlarged (FoodPhoto), and what opened it (the focus goes back there). */
  let big = $state(false);
  /** A picture on screen (its thumbnail while the cell loads): then the イメージ badge, never on a tile. */
  let pictured = $state(false);
  let picBtn: HTMLButtonElement | undefined = $state();
  const gloss = $derived(glossOf(catalogOf(a.db, item.id) ?? item, item.name));
  /** How many independent sources agree on its kcal (2 or more: said under its name). */
  const agree = $derived.by(() => {
    const v = a.db ? verifyOf(a.db, item.id) : null;
    return v && v.n >= 2 ? v.n : 0;
  });
  const per = (v: number | null | undefined) => (v === null || v === undefined ? '–' : v.toFixed(1));

  function done() {
    if (a.ok) ondone({ m, g: a.g, u: a.u });
  }
</script>

<form class="amt" onsubmit={(e) => { e.preventDefault(); done(); }}>
  <section class="card head" data-food-live>
    <div class="id">
      {#if pic}
        <button type="button" class="pic" data-food-pic data-sfx="page" bind:this={picBtn} aria-label={t('food.img.big', { name: item.name })} onclick={() => (big = true)}>
          <FoodThumb cat={item.cat} size={PIC} img={pic} under={imgOf(imgs, item.id, 48)} bind:pictured />{#if pictured}<span class="badge">{t('food.img.badge')}</span>{/if}
        </button>
        {#if big}<FoodPhoto {item} img={imgOf(imgs, item.id, 384) ?? pic} onclose={() => { big = false; picBtn?.focus(); }} />{/if}
      {/if}
      <div class="txt">
        <h3>{item.name}</h3>
        {#if gloss || item.desc}<p class="gl" data-food-about>{#if gloss}<span data-gloss>{gloss}</span>{/if}{#if gloss && item.desc}{' — '}{/if}{#if item.desc}<span data-desc>{item.desc}</span>{/if}</p>{/if}
        {#if agree}<p class="vf" data-verified={agree}>{t('food.verifiedBadge', { n: agree })}</p>{/if}
        <p class="k money" aria-live="polite">{formatNum(n.kcal)}<small>kcal</small>{#if !serving}<small class="g" data-food-g>（{formatNum(a.g)}{a.unit}）</small>{/if}</p>
      </div>
    </div>
    <dl class="nut">
      <div><dt>{t('food.p')}</dt><dd class="money">{n.p.toFixed(1)}<small>g</small></dd></div>
      <div><dt>{t('food.fa')}</dt><dd class="money">{n.fa.toFixed(1)}<small>g</small></dd></div>
      <div><dt>{t('food.c')}</dt><dd class="money">{n.c.toFixed(1)}<small>g</small></dd></div>
      <div><dt>{t('food.s')}</dt><dd class="money">{n.s.toFixed(1)}<small>g</small></dd></div>
    </dl>
    <button type="button" class="per-t" data-food-per aria-expanded={perOpen} aria-controls="food-per" data-sfx="tick" onclick={() => (perOpen = !perOpen)}>
      {serving ? t('food.perOneNut', { u: a.ps[0].label }) : t('food.per100Head')}<span class="caret" aria-hidden="true">▾</span>
    </button>
    {#if perOpen}<p class="per money" id="food-per">{formatNum(item.kcal)} kcal · P {per(item.p)} · F {per(item.f)} · C {per(item.c)} · {t('food.s')} {per(item.salt)}</p>{/if}
  </section>

  <section class="card ctl"><FoodPortion {a} bind:typing /></section>

  {#if once}<p class="once" data-once>{t('food.rep.once')}</p>{/if}
  <div class="acts level-acts">
    {#if !pick && !typing}
      <div class="seg" role="group" aria-label={t('food.whichMeal')}>
        {#each MEALS as id (id)}
          <button type="button" class="sb" aria-pressed={m === id} data-pick-meal={id} data-sfx={m === id ? 'none' : 'tick'} onclick={() => (m = id)}>{t(`food.meal.${id}`)}</button>
        {/each}
      </div>
    {/if}
    {#if open}<button type="button" class="btn paper small open" data-sfx="page" data-amount-open onclick={open.run}>{open.label}</button>{/if}
    {#if editing}<button type="button" class="btn paper small" data-sfx="undo" data-remove onclick={() => onremove?.()}>{t(pick ? 'food.rcp.itemRemove' : 'food.remove')}</button>{/if}
    <button type="submit" class="btn small" data-sfx="confirm" data-done aria-disabled={!a.ok}>
      {pick ? t(editing ? 'food.rcp.save' : 'food.rcp.itemAdd') : editing ? t('food.save') : t('food.addOk')}{#if typing || !editing}{' '}<small class="dk money" data-done-kcal>{formatNum(n.kcal)} kcal</small>{/if}
    </button>
  </div>
</form>

<style>
  /* a column: the head (the food and what this amount holds), the controls in the order decided, the foot (the meal,
     追加) at the level's end, the foot of the screen when the food is short (Food.svelte stretches the level) */
  .amt { display: flex; flex-direction: column; gap: 12px; min-height: 100%; }
  .amt > .level-acts { margin-top: auto; }
  .card { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; padding: 12px 14px; }
  .head { gap: 10px; }
  /* the picture beside the name; none: the name the whole width */
  .id { display: flex; gap: 12px; align-items: flex-start; }
  .txt { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; align-self: stretch; padding-top: 2px; }
  .pic { position: relative; flex: none; appearance: none; border: 0; padding: 0; background: none; cursor: zoom-in; border-radius: 26px; }
  .pic:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .badge {
    position: absolute; top: 5px; left: 5px; padding: 2px 6px; border-radius: var(--r-pill); font: 700 var(--fs-xs)/1.1 var(--font-ui);
    color: var(--c-ink); background: color-mix(in srgb, var(--c-card) 92%, transparent);
  }
  .gl { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text); line-height: 1.4; }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; line-height: 1.3; overflow-wrap: anywhere; }
  .vf { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--leaf-text); }
  .once { margin: 0 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  /* what this amount holds, live: the kcal (the loudest thing on the sheet) and the amount it's for at the name column's
     foot, the four nutrients under the picture's row (label over value), the per-100 g toggle under them */
  .k { margin: auto 0 0; padding-top: 6px; font-size: var(--fs-title); line-height: 1; }
  .k small { margin-left: 4px; font-size: var(--fs-s); color: var(--text-soft); }
  .k .g { margin-left: 0; }
  .per-t {
    appearance: none; border: 0; background: none; cursor: pointer; min-height: var(--hit); padding: 0; margin: -8px 0 -6px; justify-self: start;
    display: inline-flex; align-items: center; gap: 4px; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft);
  }
  .per-t:focus-visible { outline: 3px solid var(--focus); outline-offset: -2px; border-radius: var(--r-chip); }
  .caret { transition: transform 160ms; }
  .per-t[aria-expanded='true'] .caret { transform: rotate(180deg); }
  .per { margin: -4px 0 0; font-size: var(--fs-s); color: var(--text-soft); line-height: 1.4; }
  .nut { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin: 0;
    padding-top: 10px; border-top: 2px dashed color-mix(in srgb, var(--lip) 45%, transparent); }
  .nut div { min-width: 0; }
  .nut dt { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .nut dd { margin: 2px 0 0; font-size: var(--fs-body); }
  .nut small { margin-left: 2px; font-size: var(--fs-s); color: var(--text-soft); }
  .sb {
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); border-radius: var(--r-pill);
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .sb[aria-pressed='true'] { background: var(--ctl-sel); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); }
  .sb:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  /* the meal, a row of the foot over 追加 (theme.css .level-acts wraps): 44 px, never under the foot */
  .seg { flex: 1 1 100%; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
  /* (never a tap's target: it leaves on the blur that tap makes, and a press whose target went never clicks) */
  .dk { pointer-events: none; margin-left: 4px; font-size: var(--fs-s); opacity: .8; }
  .sb { padding: 0 2px; font-size: var(--fs-s); white-space: nowrap; margin-bottom: var(--lip-h); }
</style>
