<script lang="ts">
  // One meal of a person's day (朝ごはん · 昼ごはん · 夜ごはん · おやつ): its kcal, then a row per entry (the food,
  // its amount, its kcal; on its left the food's picture box, FoodThumb at 40px: its picture, else its category's tile,
  // the user 2026-11-07: "show the images in the main lists in kiroku"). On my own day ＋ opens the search for this meal, and an entry opens its amount to change or
  // remove it; anyone else's day is read-only (only the owner changes an entry). いつもの (a repeat): its weekdays as a
  // chip in the header (my day: a tap manages it; else only shown), its entries marked 🔁 (a day taken out of it shows
  // its own entries, unmarked, under the same chip); on my today a meal with entries and no repeat ends with a small
  // 「いつものに する」 link (not a ＋-sized button: it is for one meal of the four, if any). Under the header, with
  // entries, the meal's protein as a chip (「たんぱく質 28g」, the leaf's once at the per-meal target: profile.ts
  // mealProteinTarget). On my day an empty meal offers its copies (`copies`), small links of いつものに する's weight:
  // 「きのうと おなじ」 (my own the day before) and 「〇〇と おなじ」 (another's that day), each with what it holds; one tap
  // copies it in. An entry of mine whose food has changed since (fresh.ts) has a small 「最新の値にする」 under its
  // row (with the kcal it goes from and to): a tap re-snapshots it.
  import type { FoodEntry, FoodSnap, Meal } from '#lib/contract/food.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { amountText, catOf, daysText, foodDb, foodDbNow, withImages } from './foodUi.ts';
  import { imgOf, type FoodImageIndex } from '#lib/food/images.ts';
  import type { FoodDb } from '#lib/food/index.ts';
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
    /** Meals to copy into this one (shown while it is empty on my day): their words, what they hold, the copy. */
    copies?: readonly { key: string; label: string; meta: string; run: () => void }[];
    /** My entries' foods as they are now, where they changed since logged (entry id → snapshot): 最新の値にする. */
    fresh?: ReadonlyMap<string, FoodSnap>;
    onfresh?: (e: FoodEntry, f: FoodSnap) => void;
  }
  let { meal, entries, mine, days, onrepeat, onadd, onpick, ptarget, copies = [], fresh, onfresh }: Props = $props();
  const protein = $derived(mealProtein(entries));
  const kcalOf = entryKcal;
  // the total rounds the sum once: a row each rounded may differ from it by ±1 (itemsKcal)
  const total = $derived(itemsKcal(entries));
  const label = $derived(t(`food.meal.${meal}`));
  /** The pictures and, for the tiles, the catalog (loaded once a meal holds an entry; both shared, both cached). */
  let imgs = $state.raw<FoodImageIndex | null>(null);
  let db = $state.raw<FoodDb | null>(foodDbNow());
  $effect(() => {
    if (!entries.length) return;
    const off = withImages((ix) => (imgs = ix));
    if (!db) void foodDb().then((d) => (db = d), () => {});
    return off;
  });
</script>

{#snippet cells(e: FoodEntry & { rep?: string })}
  <span class="th"><FoodThumb cat={catOf(db, e.f.id)} size={40} img={imgOf(imgs, e.f.id, 40)} /></span>
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
    <p class="pm" class:met={protein >= ptarget} data-meal-protein={protein} data-met={protein >= ptarget || undefined}>{t('food.mealP', { n: Math.round(protein) })}<span class="sr-only">{t('food.mealPAim', { goal: ptarget })}</span></p>
    <ul>
      {#each entries as e (e.id)}
        <li>
          {#if mine}
            <button type="button" class="row" data-entry={e.id} data-rep={e.rep} data-sfx="page" onclick={() => onpick(e)}>
              {@render cells(e)}
            </button>
            {@const f = fresh?.get(e.id)}
            {#if f && onfresh}
              {@const k1 = entryKcal({ g: e.g, f })}
              <button type="button" class="fresh" data-fresh={e.id} data-sfx="page" onclick={() => onfresh(e, f)}>
                {k1 === kcalOf(e) ? t('food.fresh.act') : t('food.fresh.actK', { from: formatNum(kcalOf(e)), to: formatNum(k1) })}
              </button>
            {/if}
          {:else}
            <div class="row" data-entry={e.id} data-rep={e.rep}>
              {@render cells(e)}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
  {#if mine && !entries.length && copies.length}
    <div class="copies" data-copies={meal}>
      {#each copies as c (c.key)}
        <button type="button" class="rep new copy" data-sfx="confirm" data-copy={c.key} onclick={c.run}>
          <span>{c.label}</span><small>{c.meta}</small>
        </button>
      {/each}
    </div>
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
    appearance: none; border: 0; cursor: pointer; position: relative; width: 36px; height: 36px; border-radius: 12px; flex: none;
    display: grid; place-items: center; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-ctl); margin: 0 4px 2px;
  }
  /* 36px drawn in the 44px hit (docs/design.md "Sizes") */
  .add::after { content: ''; position: absolute; inset: -4px; }
  .add:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .add svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; }
  ul { list-style: none; margin: 0; padding: 0; }
  /* the meal's protein: a soft chip, the leaf's once at the per-meal target */
  .pm {
    justify-self: start; margin: 0 0 2px; padding: 3px 9px; border-radius: var(--r-pill); font: 700 var(--fs-xs)/1.2 var(--font-ui);
    color: var(--text-soft); background: color-mix(in srgb, var(--lip) 35%, transparent); font-variant-numeric: tabular-nums;
  }
  .pm.met { color: var(--leaf-text); background: color-mix(in srgb, var(--c-leaf) 24%, transparent); }
  li + li { border-top: 1px dashed color-mix(in srgb, var(--lip) 70%, transparent); }
  .row {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; text-align: left; width: 100%;
    display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: 'th nm kc' 'th amt kc'; align-items: center;
    column-gap: 10px; min-height: var(--row-obj); padding: 6px 2px;
  }
  button.row { cursor: pointer; border-radius: var(--r-chip); }
  button.row:active { background: color-mix(in srgb, var(--lip) 30%, transparent); }
  button.row:focus-visible { outline: 3px solid var(--focus); outline-offset: 0; }
  .th { grid-area: th; display: flex; }
  .nm { grid-area: nm; font-weight: 700; font-size: var(--fs-body); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .amt { grid-area: amt; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .kc { grid-area: kc; font-size: var(--fs-body); }
  .rm { display: inline-flex; }
  /* 最新の値にする: a text link's weight under its row (as いつものに する), a 44px target all the same */
  .fresh {
    appearance: none; border: 0; background: none; cursor: pointer; display: block; min-height: var(--hit); margin: -6px 0 0 -4px; padding: 0 6px;
    font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--leaf-text); text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 3px;
  }
  .fresh:focus-visible { outline: 3px solid var(--focus); outline-offset: 0; border-radius: var(--r-chip); }
  .amt .rm { margin-right: 4px; vertical-align: -1px; }
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
  button.rep::after { content: ''; position: absolute; inset: -6px -2px; }
  button.rep:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  button.rep:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* いつものに する: a text link's weight (no pill, no lip), a 44px target all the same */
  button.rep.new {
    justify-self: start; min-height: var(--hit); margin: 0 0 0 -4px; padding: 0 6px; background: none; box-shadow: none;
    color: var(--text-soft); font-size: var(--fs-s); text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 3px;
  }
  button.rep.new:active { transform: none; box-shadow: none; color: var(--text); }
  /* the copies: いつものに する's links, side by side as they fit, what each holds after it (not underlined) */
  .copies { display: flex; flex-wrap: wrap; column-gap: 12px; margin: -4px 0 0; }
  button.rep.new.copy { gap: 6px; }
  .copy span { overflow: visible; }
  .copy small { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); }
</style>
