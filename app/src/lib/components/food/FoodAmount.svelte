<script lang="ts">
  // ごはん's amount (a level over the search or the day; docs/design.md "Gohan" Amount). The head: its picture when it
  // has one (104 px beside the name, the イメージ badge: every picture is generated, a chain menu's Kalori's own; a tap:
  // FoodPhoto, it enlarged),
  // its name, a chain menu's shop and category (its mark: ShopMark) with how far its values are the shop's own (公式の値,
  // PFCは推定, 推定の値（AI）; 販売終了かも if it may be gone) and 「kalori.jpで見る ›」 (its page), the everyday name (glossOf) and 「これは…」 line (`desc`); under them what this amount holds, live: the kcal
  // (the sheet's loudest number) with the grams it's for, P · F · C · 塩分 (食物繊維 a fifth when known and above 0), how
  // its values were got (the data's `note`, whole: 廃棄率, 一般的な推定値…; a chain menu's its trust line), and under them
  // behind 「100gあたりの栄養」 (closed on each open) the values per 100 g (fibre too, when known): more than the search's
  // opened row, which opens this as its くわしく ›.
  // Then the controls (FoodPortion, their rules amount.svelte.ts) in the order they're decided: じょうたい, a food in its states (the data's vg/st), a chip per
  // state with its kcal at the amount it would take (`onitem` swaps the food: a portion label the state also has stays
  // picked at its own grams, typed grams stay typed, else its default), one line why (パックの重さなら 生 / ゆでる前の
  // 重さなら 乾); its portions as chips (the first the default; 100 g last), −/＋ from ×0.5 by halves, whole portions past
  // ×2 for the things you count (±10 g once grams are typed: nextMult), the grams field (ml for a drink). The foot
  // (sticky, at the screen's foot for a short food): which meal (gone while the grams are typed: the keyboard's up),
  // then 追加 with the kcal (a new entry) or 保存 / 削除 (my entry). For a recipe's ingredient (`pick`): no meal, the recipe's words.
  // The item may be swapped while it is open (an entry opened from its snapshot, the catalog's portions arriving):
  // untouched, the amount starts again from the same grams; touched, the portion picked stays picked (by its label).
  // A packaged product whose amount holds what a label rarely says (food/portionCheck.ts: 50 g of protein in a cone)
  // has a quiet 「表示値を確認」 under its values, and with `onfix` a 直す: the amount as a new マイ食品, prefilled. Any
  // food's amount past one sitting's salt or kcal (food/portionCheck.ts amountCheck: a serving ×20) says 「量を確認」 there instead.
  // A food in a broth (foodUi.ts isBroth: ラーメン, 鍋, スープ, 汁物…) has 「スープ半分」 in the amount's card: on, its
  // salt counts half (the snapshot's `hs`; kcal as it is, said beside it only then), shown so in the values above, the
  // head's description saying 「スープは半分飲んだ場合」 (off: 「スープを全部飲んだ場合」). Not a dish whose
  // values hold only the broth eaten (a 鍋's 「喫食分」), nor おでん.
  // A serving with no known weight (`serving`: a custom food's, マイ食品): its values per serving, its one portion stepped
  // by half servings, no grams field. A recipe's or custom food's: `open`, a button left of 追加 to open it.
  import { untrack } from 'svelte';
  import type { Meal } from '#lib/contract/food.ts';
  import { MEALS } from '#lib/contract/food.ts';
  import { amountCheck, g1, itemById, portionCheck, verifyOf, type Item } from '#lib/food/index.ts';
  import { count } from '#lib/sync/log.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { imgOf, kaloriImg } from '#lib/food/images.ts';
  import { isOwnPhoto } from './customPics.svelte.ts';
  import FoodThumb from './FoodThumb.svelte';
  import FoodPhoto from './FoodPhoto.svelte';
  import FoodPortion from './FoodPortion.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import { AmountPick } from './amount.svelte.ts';
  import { fibreAt, glossOf, isBroth, kaloriPage, kaloriTrust } from './foodUi.ts';
  import { held, wantImages } from './dbHold.svelte.ts';
  import ShopMark from './ShopMark.svelte';

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
    /** A serving with no known weight (FoodSnap `sv`): half servings and up, no grams. */
    serving?: boolean;
    ondone: (v: { m: Meal; g: number; u: string | null; half: boolean }) => void;
    /** スープ半分 on to start with (an entry's `hs`). */
    half0?: boolean;
    onremove?: () => void;
    /** What the food came from, to open (a recipe, a custom food). */
    open?: { label: string; run: () => void } | null;
    /** A いつもの's entry: 保存 / 削除 change this day only (said above them). */
    once?: boolean;
    /** Another state of the food picked (じょうたい): log that one instead. */
    onitem?: (it: Item) => void;
    /** 表示値を確認's 直す: this amount as a new custom food (its grams, its portion's label). */
    onfix?: (g: number, u: string | null) => void;
  }
  let { item, meal, g0, u0, editing = false, pick = false, serving = false, ondone, onremove, open = null, onitem, onfix, once = false, half0 = false }: Props = $props();

  /** The picker (状態, 量, ×n, grams: amount.svelte.ts, its controls FoodPortion). */
  const a = new AmountPick(() => ({ item, g0, u0, serving, onitem }));
  // (the level is keyed: a new food or entry mounts a new one, so the meal is read once)
  let m = $state<Meal>(untrack(() => meal));
  /** スープ半分: offered for a food in a broth (never a recipe's ingredient), its salt then counted half. */
  /** The catalog's own item (an entry's is its snapshot): its note says how its values were got. */
  const catalog = $derived(itemById(a.db, item.id) ?? item);
  const soupy = $derived(isBroth(catalog)), broth = $derived(!pick && soupy);
  let half = $state(untrack(() => half0));
  const n = $derived(broth && half && a.n.s !== null ? { ...a.n, s: a.n.s / 2 } : a.n);
  const imgs = $derived(held.images);
  $effect(() => wantImages([item.id]));
  /** The picture's box beside the name (its detail cell scaled down: sharp at 3×). */
  const PIC = 104;
  const pic = $derived(imgOf(imgs, item.id, 160));
  /** A chain menu's (Kalori's, hotlinked): the 400 px file. */
  const src = $derived(kaloriImg(item, PIC));
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
  const gloss = $derived(glossOf(catalog, item.name));
  /** How many independent sources agree on its kcal (2 or more: said under its name). */
  const agree = $derived.by(() => {
    const v = a.db ? verifyOf(a.db, item.id) : null;
    return v && v.n >= 2 ? v.n : 0;
  });
  /** A chain menu's (Kalori): its page, and how far its values are the shop's own (販売終了かも too, if it may be gone). */
  const page = $derived(kaloriPage(item));
  const trust = $derived(kaloriTrust(item));
  const per = g1;
  /** How its values were got: the catalog item's note (an entry's item is its snapshot). */
  const note = $derived(trust ? null : (catalog.note ?? null));
  const fib = $derived(fibreAt(item, a.ok ? a.g : 0));

  /** Why this amount looks off for a label (portionCheck's first reason, its words: protein, kcal, salt, or the kcal
   *  against the nutrients), or null: the hint, counted once an open (never which food). */
  const check = $derived.by(() => {
    const why = a.ok ? portionCheck(item, a.g)[0] : undefined;
    return why === undefined ? null : why === 'pshare' ? 'p' : why;
  });
  let checkSeen = false;
  $effect(() => {
    if (check && !checkSeen) (checkSeen = true), count('act:food.check.shown');
  });
  /** More salt or kcal than one sitting holds, whatever the food (amountCheck: a ×20 slipped in), or null: 「量を確認」
   *  over 表示値を確認, counted once an open. */
  const slip = $derived(a.ok ? amountCheck(n) : null);
  let slipSeen = false;
  $effect(() => {
    if (slip && !slipSeen) (slipSeen = true), count('act:food.big.shown');
  });
  function fix() {
    count('act:food.check.fix');
    onfix?.(a.g, a.u);
  }

  function done() {
    if (a.ok) ondone({ m, g: a.g, u: a.u, half: broth && half });
  }
</script>

<form class="amt" onsubmit={(e) => { e.preventDefault(); done(); }}>
  <section class="card form head" data-food-live>
    <div class="id">
      {#if pic || src}
        <button type="button" class="pic" data-food-pic data-sfx="page" bind:this={picBtn} aria-label={t(isOwnPhoto(item.id) ? 'food.img.photoBig' : 'food.img.big', { name: item.name })} onclick={() => (big = true)}>
          <FoodThumb cat={item.cat} size={PIC} img={pic} {src} under={imgOf(imgs, item.id, 48)} bind:pictured />{#if pictured && !isOwnPhoto(item.id)}<span class="badge">{t('food.img.badge')}</span>{/if}
        </button>
        {#if big}<FoodPhoto {item} img={imgOf(imgs, item.id, 384) ?? pic} {src} onclose={() => { big = false; picBtn?.focus(); }} />{/if}
      {/if}
      <div class="txt">
        <h3>{item.name}</h3>
        {#if item.shop && item.brand}<p class="sh" data-food-shop><span class="sr-only">{t('food.shop')}</span><ShopMark />{item.brand}{#if item.cat}{' · '}{item.cat}{/if}</p>{/if}
        {#if gloss || item.desc || soupy}<p class="gl" data-food-about>{#if gloss}<span data-gloss>{gloss}</span>{/if}{#if gloss && item.desc}{' — '}{/if}{#if item.desc}<span data-desc>{item.desc}</span>{/if}{#if soupy}{#if gloss || item.desc}{' · '}{/if}<span data-food-soup={broth && half ? 'half' : 'all'}>{t(broth && half ? 'food.halfOn' : 'food.soupAll')}</span>{/if}</p>{/if}
        {#if agree}<p class="vf" data-verified={agree}>{t('food.verifiedBadge', { n: agree })}</p>{/if}
        {#if trust}<p class="tr" data-food-trust={item.est ?? 'o'} data-food-ended={item.ended ? '' : undefined}>{trust}</p>{/if}
        {#if note}<p class="tr selectable" data-food-note><Phrases text={note} /></p>{/if}
        <p class="k money" aria-live="polite">{formatNum(n.kcal)}<small>kcal</small>{#if !serving}<small class="g" data-food-g>（{formatNum(a.g)}{a.unit}）</small>{/if}</p>
      </div>
    </div>
    <dl class="nut">
      <div><dt>{t('food.p')}</dt><dd class="money">{g1(n.p)}{#if n.p !== null}<small>g</small>{/if}</dd></div>
      <div><dt>{t('food.fa')}</dt><dd class="money">{g1(n.fa)}{#if n.fa !== null}<small>g</small>{/if}</dd></div>
      <div><dt>{t('food.c')}</dt><dd class="money">{g1(n.c)}{#if n.c !== null}<small>g</small>{/if}</dd></div>
      <div><dt>{t('food.s')}</dt><dd class="money" data-salt>{g1(n.s)}{#if n.s !== null}<small>g</small>{/if}</dd></div>
      {#if fib !== null}<div data-food-fib><dt>{t('food.fi')}</dt><dd class="money">{fib.toFixed(1)}<small>g</small></dd></div>{/if}
    </dl>
    {#if slip}
      <div class="chk" data-food-big={slip}><p><b>{t('food.big.head')}</b>{' '}<Phrases text={t(`food.big.${slip}`, { n: formatNum(slip === 'salt' ? Math.round(n.s ?? 0) : n.kcal) })} /></p></div>
    {:else if check}
      <div class="chk" data-food-check>
        <p><b>{t('food.check.head')}</b>{' '}<Phrases text={t(`food.check.${check}`)} /></p>
        {#if onfix}<button type="button" class="text-link fix" data-food-fix data-sfx="page" onclick={fix}>{t('food.check.fix')}<span aria-hidden="true"> ›</span></button>{/if}
      </div>
    {/if}
    <div class="per-row">
      <button type="button" class="per-t" data-food-per aria-expanded={perOpen} aria-controls="food-per" data-sfx="tick" onclick={() => (perOpen = !perOpen)}>
        {serving ? t('food.perOneNut', { u: a.ps[0].label }) : t('food.per100Head', { u: a.unit })}<span class="caret" aria-hidden="true">▾</span>
      </button>
      {#if page}<a class="kl" href={page} target="_blank" rel="noopener noreferrer" data-sfx="open" data-food-kalori>{t('food.kal.see')}<span aria-hidden="true"> ›</span></a>{/if}
    </div>
    {#if perOpen}<p class="per money" id="food-per">{formatNum(item.kcal)} kcal · P {per(item.p)} · F {per(item.f)} · C {per(item.c)} · {t('food.s')} {per(item.salt)}{#if typeof item.fib === 'number'} · {t('food.fi')} {per(item.fib)}{/if}</p>{/if}
  </section>

  <section class="card form ctl"><FoodPortion {a} bind:typing />
    {#if broth}
      <div class="half">
        <button type="button" class="chip big" aria-pressed={half} data-food-half data-sfx="tick" onclick={() => (half = !half)}>{t('food.half')}</button>
        {#if half}<small data-food-half-note>{t('food.halfNote')}</small>{/if}
      </div>
    {/if}
  </section>

  {#if once}<p class="once" data-once><Phrases text={t('food.rep.once')} /></p>{/if}
  <div class="acts level-acts">
    {#if !pick && !typing}
      <div class="seg" role="group" aria-label={t('food.whichMeal')}>
        {#each MEALS as id (id)}
          <button type="button" class="sb press" aria-pressed={m === id} data-pick-meal={id} data-sfx={m === id ? 'none' : 'tick'} onclick={() => (m = id)}>{t(`food.meal.${id}`)}</button>
        {/each}
      </div>
    {/if}
    {#if open}<button type="button" class="btn paper small open" data-sfx="page" data-amount-open onclick={open.run}>{open.label}</button>{/if}
    {#if editing}<button type="button" class="btn paper small" data-sfx="undo" data-remove onclick={() => onremove?.()}>{t(pick ? 'food.rcp.itemRemove' : 'food.remove')}</button>{/if}
    <button type="submit" class="btn small" data-sfx="confirm" data-done aria-disabled={!a.ok}>
      {pick ? t(editing ? 'common.save' : 'food.rcp.itemAdd') : editing ? t('common.save') : t('food.addOk')}{#if typing || !editing}{' '}<small class="dk money" data-done-kcal>{formatNum(n.kcal)} kcal</small>{/if}
    </button>
  </div>
</form>

<style>
  /* a column: the head (the food and what this amount holds), the controls in the order decided, the foot (the meal,
     追加) at the level's end, the foot of the screen when the food is short (Food.svelte stretches the level) */
  .amt { display: flex; flex-direction: column; gap: 12px; min-height: 100%; }
  .amt > .level-acts { margin-top: auto; }
  .head { gap: 10px; }
  /* the picture beside the name; none: the name the whole width */
  .id { display: flex; gap: 12px; align-items: flex-start; }
  .txt { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; align-self: stretch; padding-top: 2px; }
  .pic { position: relative; flex: none; appearance: none; border: 0; padding: 0; background: none; cursor: zoom-in; border-radius: 26px; }
  .badge {
    position: absolute; top: 5px; left: 5px; padding: 2px 6px; border-radius: var(--r-pill); font: 700 var(--fs-xs)/1.1 var(--font-ui);
    color: var(--c-ink); background: color-mix(in srgb, var(--c-card) 92%, transparent);
  }
  .gl { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text); line-height: 1.4; }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; line-height: 1.3; overflow-wrap: anywhere; }
  .sh { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text); overflow-wrap: anywhere; }
  .tr { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  /* the per-serving toggle, and a chain menu's page at the row's other end (a 44 px target) */
  .per-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: -8px 0 -6px; }
  .per-row .per-t { margin: 0; }
  .kl { display: inline-flex; align-items: center; min-height: var(--hit); font-size: var(--fs-s); font-weight: 700; color: var(--text); text-decoration: underline; text-underline-offset: 2px; white-space: nowrap; }
  .kl:focus-visible { outline: 3px solid var(--focus); outline-offset: -2px; border-radius: var(--r-chip); }
  /* 表示値を確認: quiet (the soft text, no colour of alarm), its 直す a link-like 44 px target at the line's end */
  .chk { display: flex; align-items: center; gap: 10px; margin: -4px 0 -6px; }
  .chk p { margin: 0; flex: 1; font-size: var(--fs-s); color: var(--text-soft); line-height: 1.4; }
  .chk b { color: var(--text); }
  .fix { flex: none; white-space: nowrap; }
  .vf { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--leaf-text); }
  /* スープ半分: a toggle chip, what it does beside it */
  .half { display: flex; align-items: center; gap: 10px; }
  .half .chip { flex: none; margin-bottom: var(--lip-h); white-space: nowrap; }
  .half small { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: 1.35; }
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
  .nut { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 6px; margin: 0;
    padding-top: 10px; border-top: 1.5px dashed var(--stitch); }
  .nut div { min-width: 0; }
  /* five (fibre too): each as wide as its label, spread (たんぱく質 whole on an iPhone 15) */
  .nut:has(> :nth-child(5)) { display: flex; justify-content: space-between; }
  .nut:has(> :nth-child(5)) div { min-width: auto; }
  .nut dt { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .nut dd { margin: 2px 0 0; font-size: var(--fs-body); }
  .nut small { margin-left: 2px; font-size: var(--fs-s); color: var(--text-soft); }
  .sb {
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); border-radius: var(--r-pill);
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .sb[aria-pressed='true'] { background: var(--ctl-sel); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); }
  /* the meal, a row of the foot over 追加 (theme.css .level-acts wraps): 44 px, never under the foot */
  .seg { flex: 1 1 100%; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
  /* (never a tap's target: it leaves on the blur that tap makes, and a press whose target went never clicks) */
  .dk { pointer-events: none; margin-left: 4px; font-size: var(--fs-s); opacity: .8; }
  .sb { padding: 0 2px; font-size: var(--fs-s); white-space: nowrap; margin-bottom: var(--lip-h); }
</style>
