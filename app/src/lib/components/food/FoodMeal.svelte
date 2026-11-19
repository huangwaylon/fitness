<script lang="ts">
  // One meal of a person's day (朝ごはん · 昼ごはん · 夜ごはん · おやつ): its kcal, then a row per entry (the food,
  // its amount, its P · F · C as eaten (each tinted by its share of the day's: foodUi.ts entryPfcCells), its kcal; on its left the food's picture box, FoodThumb at 40px: its picture, else its category's tile,
  // the user 2026-11-07: "show the images in the main lists in kiroku"). On my own day ＋ opens the search for this meal, and an entry opens its amount to change or
  // remove it; anyone else's day is read-only (only the owner changes an entry). いつもの (a repeat): its weekdays as a
  // chip in the header (my day: a tap manages it; else only shown), its entries marked 🔁 (a day taken out of it shows
  // its own entries, unmarked, under the same chip); on my today a meal with entries and no repeat ends with a small
  // 「いつものに する」 link (not a ＋-sized button: it is for one meal of the four, if any). Under the header, with
  // entries, the meal's protein as a chip (「たんぱく質 28g」, the leaf's once at the per-meal target: profile.ts
  // mealProteinTarget). On my day an empty meal offers its copies (`copies`), small links of いつものに する's weight:
  // 「きのうと おなじ」 (my own the day before) and 「〇〇と おなじ」 (another's that day), each with what it holds; one tap
  // copies it in. An entry of mine whose food has changed since (fresh.ts) has a small 「最新の値にする」 under its
  // row (with what changes most: fresh.ts freshChange, kcal, else salt or fibre): a tap re-snapshots it; a いつもの whose
  // foods changed, one link under its entries (by what changed: 「新しい値でいつものを更新（…）」, 「レシピの変更をいつものに反映（…）」, 「マイ食品の変更をいつものに反映（…）」), a tap makes it the foods
  // now from today. A
  // chain menu's entry whose values Kalori guessed (its snapshot's `est` e or p) says 推定 after its amount, quietly. An entry logged from a recipe still there
  // (マイレシピ) shows its ingredients' pictures and the recipe's pot (FoodThumb `plate`); on anyone else's day its row
  // takes a tap all the same: the recipe, read-only (`onrecipe`).
  import type { FoodEntry, Meal } from '#lib/contract/food.ts';
  import { freshChange, type Fresh, type FreshChange } from './fresh.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { daysText, entryPfcCells, loggedCat, plateOf, recipeOfEntry } from './foodUi.ts';
  import { amountText } from './portions.ts';
  import { held, wantImages } from './dbHold.svelte.ts';
  import type { PfcOf, Recipe } from '#lib/model/food.ts';
  import { imgOf } from '#lib/food/images.ts';
  import FoodThumb from './FoodThumb.svelte';
  import { entryKcal, itemsKcal } from '#lib/food/index.ts';
  import { mealProtein } from '#lib/model/food.ts';
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
    /** A meal's protein to aim for (g): its chip turns the leaf's at it. */
    ptarget: number;
    /** The day's P, F and C (g) each row's are tinted against (model/food.ts pfcTintGoals). */
    pgoals: Record<PfcOf, number>;
    /** Meals to copy into this one (shown while it is empty on my day): their words, what they hold, the copy. */
    copies?: readonly { key: string; label: string; meta: string; run: () => void }[];
    /** My entries' foods as they are now, where they changed since logged (entry id → snapshot): 最新の値にする. */
    fresh?: ReadonlyMap<string, Fresh>;
    onfresh?: (e: FoodEntry, x: Fresh) => void;
    /** This meal's いつもの with foods changed since it was set (my day, today on): its link's words (i18n key), what changes most, the update. */
    repfresh?: { key: string; change: FreshChange | null; run: () => void } | null;
    /** The recipes still there, by id (an entry logged from one: its pictures), and one opened from anyone else's day. */
    recipes?: ReadonlyMap<string, Recipe>;
    onrecipe?: (r: Recipe, e: FoodEntry) => void;
    /** ごはん open: the pictures asked for (closed, kept mounted: never, so a let-go index isn't loaded again). */
    open?: boolean;
  }
  let { meal, entries, mine, days, onrepeat, onadd, onpick, ptarget, pgoals, copies = [], fresh, onfresh, repfresh = null, recipes, onrecipe, open = true }: Props = $props();
  const recipeOf = (e: FoodEntry) => recipeOfEntry(recipes, e);
  const protein = $derived(mealProtein(entries));
  const kcalOf = entryKcal;
  // the total rounds the sum once: a row each rounded may differ from it by ±1 (itemsKcal)
  const total = $derived(itemsKcal(entries));
  const label = $derived(t(`food.meal.${meal}`));
  /** An update's button: plain (`key`), or with what changes most (`key`K: 「（塩分 3.1→1.4 g）」). */
  function freshText(key: string, c: FreshChange | null): string {
    if (!c) return t(key);
    const what = t(`food.${c.k}`);
    const one = (n: number) => n.toFixed(1);
    const text = c.k === 'k' ? t('food.fresh.chgK', { from: formatNum(c.from!), to: formatNum(c.to) })
      : c.from === null ? t('food.fresh.chgNew', { what, to: one(c.to) }) : t('food.fresh.chg', { what, from: one(c.from), to: one(c.to) });
    return t(`${key}K`, { c: text });
  }
  /** The pictures (loaded once a meal holds an entry) and, for the tiles, the catalog once it is in (never loaded here:
   *  Food.svelte's foodDbSoon, after the open; till then each row's category as this phone remembers it, loggedCat). */
  const db = $derived(held.db), imgs = $derived(held.images);
  $effect(() => void (entries.length && open && wantImages(entries.map((e) => e.f.id))));
</script>

{#snippet cells(e: FoodEntry & { rep?: string }, r?: Recipe)}
  <span class="th"><FoodThumb cat={loggedCat(db, e.f.id)} size={40} img={imgOf(imgs, e.f.id, 40)} plate={r ? plateOf(r, imgs, db, 40) : null} /></span>
  <span class="nm">{e.f.n}</span>
  <small class="amt">{#if e.rep}<i class="rm" role="img" aria-label={t('food.rep.mark')}><RepeatMark size={12} /></i>{/if}{amountText(e)}{#if e.f.hs}<span data-entry-half>{' · '}{t('food.half')}</span>{/if}{#if e.f.est === 'e' || e.f.est === 'p'}<span class="est" data-entry-est={e.f.est}>{' · '}{t('food.kal.estShort')}</span>{/if}</small>
  <b class="kc money">{formatNum(kcalOf(e))}<span class="sr-only"> kcal</span></b>
  <small class="pfc money" data-entry-pfc>{#each entryPfcCells(e, pgoals) as c (c.k)}<span class="m m-{c.k} t{c.tint}" data-pfc-of={c.k} data-tint={c.tint}><span aria-hidden="true">{c.k === 'fa' ? 'F' : c.k.toUpperCase()}</span><span class="sr-only">{t(`food.${c.k}`)}</span> {c.text}{#if c.tint === 2}<span class="sr-only">{t('food.pfcHigh')}</span>{/if}</span>{/each}</small>
{/snippet}

<section class="card meal" data-meal={meal} aria-labelledby="fm-{meal}">
  <header>
    <h3 id="fm-{meal}">{label}</h3>
    {#if days !== null}
      {#if onrepeat}
        <button type="button" class="rep hit44 press" data-sfx="page" data-repeat={meal} aria-label={t('food.rep.manage', { meal: label, days: daysText(days) })} onclick={onrepeat}>
          <RepeatMark /><span>{daysText(days)}</span>
        </button>
      {:else}
        <span class="rep" data-repeat={meal}><i class="rm" role="img" aria-label={t('food.rep.mark')}><RepeatMark /></i><span>{daysText(days)}</span></span>
      {/if}
    {/if}
    <b class="sub money">{t('kiroku.kcal', { n: formatNum(total) })}</b>
    {#if mine}
      <button type="button" class="add hit44 press" data-sfx="page" data-add={meal} aria-label={t('food.add', { meal: label })} onclick={onadd}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5 V19 M5 12 H19" /></svg>
      </button>
    {/if}
  </header>
  {#if entries.length}
    <p class="pm" class:met={protein >= ptarget} data-meal-protein={protein} data-met={protein >= ptarget || undefined}>{t('food.mealP', { n: Math.round(protein) })}<span class="sr-only">{t('food.mealPAim', { goal: ptarget })}</span></p>
    <ul>
      {#each entries as e (e.id)}
        {@const r = recipeOf(e)}
        <li>
          {#if mine}
            <button type="button" class="row" data-entry={e.id} data-rep={e.rep} data-sfx="page" onclick={() => onpick(e)}>
              {@render cells(e, r)}
            </button>
            {@const x = fresh?.get(e.id)}
            {#if x && onfresh}
              <button type="button" class="text-link fresh" data-fresh={e.id} data-sfx="page" onclick={() => onfresh(e, x)}>
                {freshText('food.fresh.act', freshChange([e], [x]))}
              </button>
            {/if}
          {:else if r && onrecipe}
            <button type="button" class="row" data-entry={e.id} data-rep={e.rep} data-recipe-open={r.id} data-sfx="page" onclick={() => onrecipe(r, e)}>
              {@render cells(e, r)}
            </button>
          {:else}
            <div class="row" data-entry={e.id} data-rep={e.rep}>
              {@render cells(e, r)}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
  {#if repfresh}
    <p class="rf" data-rep-fresh={meal}><button type="button" class="text-link fresh" data-sfx="confirm" data-rep-fresh-go={meal} onclick={repfresh.run}>{freshText(repfresh.key, repfresh.change)}</button></p>
  {/if}
  {#if mine && !entries.length && copies.length}
    <div class="copies" data-copies={meal}>
      {#each copies as c (c.key)}
        <button type="button" class="text-link new copy" data-sfx="confirm" data-copy={c.key} onclick={c.run}>
          <span>{c.label}</span><small>{c.meta}</small>
        </button>
      {/each}
    </div>
  {/if}
  {#if days === null && onrepeat && entries.length}
    <button type="button" class="text-link new" data-sfx="page" data-repeat-new={meal} aria-label={t('food.rep.newOf', { meal: label })} onclick={onrepeat}>
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
    appearance: none; border: 0; cursor: pointer; position: relative; width: 36px; height: 36px; border-radius: 12px; flex: none;
    display: grid; place-items: center; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-ctl); margin: 0 4px 2px;
  }
  /* (36px drawn in the 44px hit: theme.css .hit44, docs/design.md "Sizes") */
  .add svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; }
  ul { list-style: none; margin: 0; padding: 0; }
  /* the meal's protein: a soft chip, the leaf's once at the per-meal target */
  .pm {
    justify-self: start; margin: 0 0 2px; padding: 3px 9px; border-radius: var(--r-pill); font: 700 var(--fs-xs)/1.2 var(--font-ui);
    color: var(--text-soft); background: color-mix(in srgb, var(--lip) 35%, transparent); font-variant-numeric: tabular-nums;
  }
  .pm.met { color: var(--leaf-text); background: color-mix(in srgb, var(--c-leaf) 24%, transparent); }
  li + li { border-top: 1.5px dashed var(--stitch); }
  .row {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; text-align: left; width: 100%;
    display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: 'th nm kc' 'th amt kc' 'th pfc kc'; align-items: center;
    column-gap: 10px; min-height: var(--row-obj); padding: 6px 2px;
  }
  button.row { cursor: pointer; border-radius: var(--r-chip); }
  button.row:active { background: color-mix(in srgb, var(--lip) 30%, transparent); }
  button.row:focus-visible { outline: 3px solid var(--focus); outline-offset: 0; }
  .th { grid-area: th; display: flex; }
  .nm { grid-area: nm; font-weight: 700; font-size: var(--fs-body); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .amt { grid-area: amt; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .kc { grid-area: kc; font-size: var(--fs-body); }
  /* the entry's P · F · C (g, as eaten): soft, small; each tinted by its share of the person's day (model/food.ts pfcTint,
     against their goals): an eighth a light tint of its PFC colour (PfcBar's: leaf, yuzu, mint), a quarter a stronger one
     in bold (tokens --pfc-tint-1/2; night thinner, with a ring of the colour), so a plate heavy in one reads at a glance */
  .pfc { grid-area: pfc; display: flex; flex-wrap: wrap; gap: 0 4px; margin-top: 2px; font: 700 var(--fs-xs)/1.25 var(--font-ui); color: var(--text-soft); }
  .m { white-space: nowrap; padding: 1px 5px; border-radius: var(--r-pill); }
  .m-p { --pc: var(--c-leaf); }
  .m-fa { --pc: var(--c-yuzu); }
  .m-c { --pc: var(--c-mint); }
  .m.t1 { color: var(--text); background: color-mix(in srgb, var(--pc) var(--pfc-tint-1), transparent); }
  .m.t2 { color: var(--text); font-weight: 800; background: color-mix(in srgb, var(--pc) var(--pfc-tint-2), transparent); }
  :global(:root[data-tod='night']) .m.t2 { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pc) 70%, transparent); }
  .m:first-child { margin-left: -5px; }
  .rm { display: inline-flex; }
  /* 最新の値にする: theme.css .text-link, under its row */
  .fresh { margin: -6px 0 0 -4px; }
  .fresh:focus-visible { outline: 3px solid var(--focus); outline-offset: 0; border-radius: var(--r-chip); }
  .amt .rm { margin-right: 4px; vertical-align: -1px; }
  .est { font-weight: 500; }
  /* いつものを更新: one link (最新の値にする's look), its 44px target inline */
  .rf { margin: 4px 0 6px; font: 700 var(--fs-s)/1.6 var(--font-ui); }
  /* (inline, so a narrow screen wraps inside the link, before its （…） (keep-all: the words whole); its padding the 44px
     target, the line box unchanged) */
  .rf .fresh { display: inline; min-height: 0; margin: 0; padding: 12px 0; font: inherit; word-break: keep-all; overflow-wrap: anywhere; }
  /* the repeat's chip: FoodAmount's chip, small; shown only (another's day): the soft pill, no edge */
  .rep {
    display: inline-flex; align-items: center; gap: 4px; min-width: 0; padding: 4px 10px; border-radius: var(--r-pill);
    font: 700 var(--fs-s)/1.1 var(--font-ui); color: var(--text-soft); background: color-mix(in srgb, var(--lip) 40%, transparent);
  }
  .rep span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  button.rep {
    appearance: none; border: 0; cursor: pointer; position: relative; min-height: 32px; padding: 0 12px; margin-bottom: 2px;
    color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  /* いつものに する: theme.css .text-link, its mark before it */
  .new { justify-self: start; margin-left: -4px; gap: 4px; }
  /* the copies: いつものに する's links, side by side as they fit, what each holds after it (not underlined) */
  .copies { display: flex; flex-wrap: wrap; column-gap: 12px; margin: -4px 0 0; }
  .new.copy { gap: 6px; }
  .copy small { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); }
</style>
