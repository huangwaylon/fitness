<script lang="ts">
  // ごはん's search (a level over the day, for one meal): a 16px search field (focused by the ＋ that opened it, in the
  // tap: Food's openSearch), then さいきん (my latest entry of each food, as I last had it, its portion with it) until
  // something is typed, or the catalog's best matches (each: the name, a product's brand with its per 100 g, its
  // default portion's kcal, ✓n when n independent sources agree on it; the same name, brand and kcal shown once). The
  // catalog not loading (offline): もういちど, and さいきん still under it (they need no catalog). Japanese IME-safe: half-composed text (「なt」) is
  // never searched; the search runs on each committed change. A row opens the amount. From a meal's ＋, マイレシピ
  // too (everyone's recipes: all of them after さいきん, the matching ones before the catalog's); a recipe opens its own.
  // マイ食品 (everyone's custom foods) likewise from both a meal and a recipe's ingredient: all of them after さいきん, the
  // matching ones above the catalog's; one opens its amount. Under the field, side by side: ＋ レシピを つくる (a meal's
  // search: the recipe editor) and ＋ 食品を つくる (the custom food editor, the typed text its name); nothing matching,
  // a card says so, with じぶんで つくる (the same editor).
  import type { Who } from '#lib/types.ts';
  import type { FoodCustom, FoodEntry } from '#lib/contract/food.ts';
  import type { Recipe } from '#lib/model/food.ts';
  import { searchFoods, verifyOf, type FoodDb, type Item } from '#lib/food/index.ts';
  import { searchKey } from '#lib/food/text.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { kcalText } from '../kiroku/fmt.ts';
  import { amountText, defaultPortion, foodDb, itemOf, servingText, uniqueItems } from './foodUi.ts';

  interface Props {
    /** My recent entries (recentOf). */
    recent: FoodEntry[];
    /** A food picked: a catalog item, or a recent one with the grams I had last. */
    onpick: (item: Item, g?: number, u?: string, f?: FoodEntry['f']) => void;
    /** マイレシピ to offer (none: a recipe's ingredient is being picked), and who set each. */
    recipes?: readonly Recipe[];
    names?: Record<Who, string>;
    onrecipe?: (r: Recipe) => void;
    /** レシピを つくる: a new recipe (a meal's search only). */
    onnewrecipe?: () => void;
    /** マイ食品 to offer (everyone's), one picked, and じぶんで つくる (the name typed so far). */
    customs?: readonly FoodCustom[];
    oncustom?: (c: FoodCustom) => void;
    oncreate?: (name: string) => void;
  }
  let { recent, onpick, recipes = [], names, onrecipe, onnewrecipe, customs = [], oncustom, oncreate }: Props = $props();

  let db = $state.raw<FoodDb | null>(null);
  let failed = $state(false);
  /** Bumped when the lazy datasets (products) are in: search again. */
  let more = $state(0);
  let text = $state('');
  /** The committed query (never mid-composition). */
  let q = $state('');
  let input: HTMLInputElement | undefined = $state();

  /** Bumped by もういちど: load again. */
  let tries = $state(0);
  $effect(() => {
    void tries;
    let live = true;
    failed = false;
    foodDb().then((d) => {
      if (!live) return;
      db = d;
      void d.more.then(() => live && more++);
    }, () => live && (failed = true));
    return () => void (live = false);
  });
  $effect(() => {
    if (matchMedia('(hover: hover)').matches) input?.focus();
  });

  const results = $derived.by(() => {
    void more;
    return db && q.trim() ? uniqueItems(searchFoods(db, q, 40)) : [];
  });
  /** The recipes and custom foods whose names hold every word typed (all of them with nothing typed). */
  const words = $derived(q.trim().split(/[\s　]+/).map(searchKey).filter(Boolean));
  const hits = (n: string) => words.every((w) => searchKey(n).includes(w));
  const myRecipes = $derived(onrecipe ? recipes.filter((r) => hits(r.n)) : []);
  const myFoods = $derived(oncustom ? customs.filter((c) => hits(c.n)) : []);
  /** Nothing of ours matches what was typed (the catalog's own say so after). */
  const noneOfOurs = $derived(!myRecipes.length && !myFoods.length);

  function onInput(e: Event) {
    if (!(e as InputEvent).isComposing) q = text;
  }
  function clear() {
    text = q = '';
    input?.focus();
  }
</script>

{#snippet customRows()}
  {#if myFoods.length}
    <h3 class="lh">{t('food.my.head')}</h3>
    <ul class="list" data-food-customs>
      {#each myFoods as c (c.id)}
        <li><button type="button" class="card it" data-sfx="page" data-custom={c.id} onclick={() => oncustom?.(c)}>
          <span class="nm">{c.n}</span>
          <small class="meta">{names?.[c.who] ?? c.who}</small>
          <span class="kc"><b class="money">{kcalText(c.k)}</b><small>{servingText(c)}</small></span>
        </button></li>
      {/each}
    </ul>
  {/if}
{/snippet}

{#snippet plus()}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5 V19 M5 12 H19" /></svg>{/snippet}

{#snippet recipeRows()}
  {#if onrecipe && myRecipes.length}
    <h3 class="lh">{t('food.rcp.mine')}</h3>
    <ul class="list" data-food-recipes>
      {#each myRecipes as r (r.id)}
        <li><button type="button" class="card it" data-sfx="page" data-recipe={r.id} onclick={() => onrecipe(r)}>
          <span class="nm">{r.n}</span>
          <small class="meta">{names?.[r.who] ?? r.who} · {t('food.rcp.servings', { n: r.sv })}</small>
          <span class="kc"><b class="money">{kcalText(r.per.kcal)}</b><small>{t('food.rcp.one')}</small></span>
        </button></li>
      {/each}
    </ul>
  {/if}
{/snippet}

<div class="search">
  <form class="box" role="search" onsubmit={(e) => { e.preventDefault(); input?.blur(); }}>
    <svg class="glass" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15 L20 20" /></svg>
    <input bind:this={input} bind:value={text} type="search" data-sfx="none" data-food-q enterkeyhint="search" autocomplete="off"
      autocapitalize="off" spellcheck="false" aria-label={t('food.search')} placeholder={t('food.searchHint')}
      oninput={onInput} oncompositionend={() => (q = text)} />
    {#if text}<button type="button" class="x" data-sfx="tick" aria-label={t('food.clear')} onclick={clear}>✕</button>{/if}
  </form>
  {#if (onnewrecipe || oncreate) && !text}
    <!-- hidden while typing: room for the results over the keyboard (nothing found: its card's じぶんで つくる) -->
    <div class="new">
      {#if onnewrecipe}<button type="button" class="btn paper small make" data-sfx="page" data-recipe-new onclick={onnewrecipe}>{@render plus()}{t('food.rcp.make')}</button>{/if}
      {#if oncreate}<button type="button" class="btn paper small make" data-sfx="page" data-custom-new onclick={() => oncreate(q.trim())}>{@render plus()}{t('food.my.new')}</button>{/if}
    </div>
  {/if}

  {#if !q.trim()}
    {@render recentRows()}
    {@render recipeRows()}
    {@render customRows()}
  {:else}
    {@render recipeRows()}
    {@render customRows()}
    {@render catalog()}
  {/if}
</div>

{#snippet recentRows()}
  <h3 class="lh">{t('food.recent')}</h3>
  {#if recent.length}
    <ul class="list" data-food-recent>
      {#each recent as e (e.id)}
        <li><button type="button" class="card it" data-sfx="page" data-item={e.f.id} onclick={() => onpick(itemOf(e.f, db, e.g), e.g, e.f.u, e.f)}>
          <span class="nm">{e.f.n}</span>
          <small class="meta">{amountText(e)}</small>
          <b class="kc money">{kcalText(Math.round((e.f.k * e.g) / 100))}</b>
        </button></li>
      {/each}
    </ul>
  {:else}
    <p class="note">{t('food.recentEmpty')}</p>
  {/if}
{/snippet}

{#snippet catalog()}
  {#if failed}
    <div class="fail">
      <p class="note" role="status">{t('food.loadFail')}</p>
      <button type="button" class="btn paper small" data-sfx="tick" data-food-retry onclick={() => tries++}>{t('food.retry')}</button>
    </div>
    {@render recentRows()}
  {:else if !db}
    <p class="note" role="status">{t('food.loading')}</p>
  {:else if !results.length}
    {#if noneOfOurs}
      <section class="card none" data-food-none>
        <p class="note" role="status">{t('food.none', { q: q.trim() })}</p>
        {#if oncreate}
          <p class="note">{t('food.my.noneHint')}</p>
          <button type="button" class="btn small make" data-sfx="page" data-custom-make onclick={() => oncreate(q.trim())}>{@render plus()}{t('food.my.make')}</button>
        {/if}
      </section>
    {/if}
  {:else}
    <ul class="list" data-food-results>
      {#each results as it (it.id)}
        {@const p = defaultPortion(it)}
        {@const v = verifyOf(db, it.id)}
        <li><button type="button" class="card it" data-sfx="page" data-item={it.id} onclick={() => onpick(it)}>
          <span class="nm">{it.name}{#if v && v.n >= 2}<i class="ok" role="img" data-verified={v.n} aria-label={t('food.verified', { n: v.n })}>{t('food.verifiedBadge', { n: v.n })}</i>{/if}</span>
          <small class="meta">{#if it.brand}<span class="br" data-brand>{it.brand}</span>{' · '}{/if}{t('food.per100', { k: formatNum(it.kcal) })}</small>
          <span class="kc"><b class="money">{kcalText(p.kcal)}</b><small>{p.label}</small></span>
        </button></li>
      {/each}
    </ul>
  {/if}
{/snippet}

<style>
  /* one column no wider than the sheet: WebKit's text field is ~20 characters wide by itself (its min-content), which
     an auto track would grow to, pushing the box and the rows off the right edge */
  .search { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; padding-bottom: 8px; }
  .box {
    position: sticky; top: -6px; z-index: 2; display: flex; align-items: center; gap: 6px; margin: 0; min-height: var(--hit);
    padding: 0 6px 0 12px; border-radius: var(--r-pill); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .box:focus-within { outline: 3px solid var(--focus); outline-offset: 2px; }
  .glass { width: 20px; height: 20px; flex: none; fill: none; stroke: var(--text-soft); stroke-width: 2.6; stroke-linecap: round; }
  input {
    flex: 1; min-width: 0; height: var(--hit); border: 0; padding: 0; background: transparent; color: var(--text);
    font: 700 var(--fs-input)/1 var(--font-ui); outline: none; appearance: none; -webkit-appearance: none;
  }
  input::-webkit-search-cancel-button { display: none; }
  input::placeholder { color: color-mix(in srgb, var(--text-soft) 70%, transparent); font-weight: 500; }
  /* ✕: the app's round control with its lip (NavButton's look, smaller type) inside the pill's right end: 44px with
     the lip, its tap target 44 × 44 (the ::before) */
  .x {
    position: relative; appearance: none; border: 0; cursor: pointer; width: calc(var(--hit) - var(--lip-h)); height: calc(var(--hit) - var(--lip-h));
    margin: 0 -2px var(--lip-h) 0; border-radius: 50%; flex: none;
    display: grid; place-items: center; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-obj);
    font: 700 var(--fs-body)/1 var(--font-ui);
  }
  .x::before { content: ''; position: absolute; inset: -2px -2px calc(-2px - var(--lip-h)); }
  .x:active { transform: translateY(2px); box-shadow: var(--sh-obj-press); }
  .x:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .lh { margin: 4px 2px 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .it {
    appearance: none; border: 0; cursor: pointer; width: 100%; text-align: left; font: inherit; color: var(--text);
    display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'nm kc' 'meta kc'; align-items: center;
    column-gap: 10px; row-gap: 3px; padding: 10px 14px; min-height: var(--row-obj);
  }
  .it:active { transform: translateY(2px); }
  .it:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .nm { grid-area: nm; font-weight: 700; font-size: var(--fs-body); overflow-wrap: anywhere; }
  .ok {
    display: inline-block; margin-left: 6px; padding: 2px 6px; border-radius: var(--r-pill); vertical-align: 1px;
    font: 700 var(--fs-xs)/1.1 var(--font-num); font-style: normal; color: var(--c-ink); background: color-mix(in srgb, var(--c-mint) 70%, var(--c-cream));
  }
  .meta { grid-area: meta; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); overflow-wrap: anywhere; }
  .br { color: var(--text); }
  .fail { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .fail .btn { margin: 0; }
  .kc { grid-area: kc; display: grid; justify-items: end; gap: 3px; font-size: var(--fs-body); white-space: nowrap; }
  .kc small { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); max-width: 12em; overflow: hidden; text-overflow: ellipsis; }
  /* the two ＋ buttons side by side under the field (one: the whole row) */
  .new { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 8px; }
  .make { margin: 0; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
  .new .make { min-width: 0; padding: 0 8px; gap: 4px; white-space: nowrap; }
  .make svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; }
  .none { display: grid; gap: 8px; padding: 12px 14px; }
  .none .note { margin: 0 2px; }
  .note { margin: 4px 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
</style>
