<script lang="ts">
  // ごはん's search (a level over the day, for one meal): a 16px search field (focused by the ＋ that opened it, in the
  // tap: Food's openSearch), then さいきん (my latest entry of each food, as I last had it, its portion with it) until
  // something is typed, or the catalog's best matches (each: its category's tile (FoodThumb), the name, a product's
  // brand (a chain menu's shop, after a storefront mark, then 販売終了かも if Kalori says it may be gone; its picture Kalori's, hotlinked), its everyday name (glossOf; a food in its states: then its states after a wide space), a food in its states once (its name without the state, the state shown filled
  // and the others after it: 「(生) 焼き ゆで」, past four 「ほか N」), its default portion's kcal, ✓n when n independent sources agree on it; one row per name and kcal: search.ts, a brand's copy of another's too). The
  // catalog not loading (offline): もういちど, and さいきん still under it (they need no catalog). Japanese IME-safe: half-composed text (「なt」) is
  // never searched; the search runs on each committed change. A row opens the amount. From a meal's ＋, マイレシピ
  // too (everyone's recipes: all of them after さいきん, the matching ones before the catalog's); a recipe opens its own.
  // マイ食品 (everyone's custom foods) likewise from both a meal and a recipe's ingredient: all of them after さいきん, the
  // matching ones above the catalog's; one opens its amount. Under the field, side by side: ＋ レシピを つくる (a meal's
  // search: the recipe editor) and ＋ 食品を つくる (the custom food editor, the typed text its name); nothing matching,
  // a card says so, with じぶんで つくる (the same editor). From a meal's ＋ (`onquick`), each food row has a ＋ of its
  // own beside it: one tap logs it as it comes (its default portion; a recent one as I had it), the field cleared and
  // focused for the next; the foods added on this trip (`added`) are listed under the field, each with ✕, with おわり
  // (back to the day). A meal's search also has ⚡ クイック (`onquicknew`: kcal only, eating out) under the つくる row, and a
  // kcal typed (「650」) offers itself as a quick entry above the catalog's rows (its row the form, its ＋ logged at once).
  // In a meal's search (`inline`) a food row (さいきん's, マイ食品's, the catalog's) opens in place instead (FoodOpen: the
  // amount's controls, 栄養成分 ›, 追加; the row's own state, amount and kcal hidden meanwhile): one at a time, kept in
  // view (scrolled under the field when it would run past the screen; a row closed above it never shifts it), closed by
  // its row again, Esc, or a new query; its 追加 logs it and clears and focuses the field, as the amount's does.
  import type { Who } from '#lib/types.ts';
  import type { FoodCustom, FoodEntry, FoodSnap } from '#lib/contract/food.ts';
  import type { Recipe } from '#lib/model/food.ts';
  import { entryKcal, findFoods, itemById, nearFoods, variantsOf, verifyOf, type FoodDb, type Item } from '#lib/food/index.ts';
  import { searchKey } from '#lib/food/text.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { kcalText } from '../kiroku/fmt.ts';
  import { imgOf, kaloriImg } from '#lib/food/images.ts';
  import { flushSync, type Snippet } from 'svelte';
  import FoodThumb from './FoodThumb.svelte';
  import ShopMark from './ShopMark.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import FoodOpen, { type Set } from './FoodOpen.svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Chip from '../ui/Chip.svelte';
  import ChipRow from '../ui/ChipRow.svelte';
  import { catOf, recentShops, shopChips, stemName, glossOf, itemOf, snapGloss, plateOf, recipeOfEntry } from './foodUi.ts';
  import { amountText, defaultPortion } from './portions.ts';
  import { customItem, servingText, typedKcal } from './drafts.ts';
  import { foodDb, held as kept, wantImages } from './dbHold.svelte.ts';

  interface Props {
    /** My recent entries (recentOf). */
    recent: FoodEntry[];
    /** All my entries, newest first, and the day 30 days back: よく行く店 (recentShops). */
    mine?: readonly FoodEntry[];
    since?: string;
    /** A food picked: a catalog item, or a recent one with the grams I had last. */
    onpick: (item: Item, g?: number, u?: string, f?: FoodEntry['f']) => void;
    /** Everyone's マイレシピ (offered with `onrecipe`; else only for さいきん's pictures of the ones logged), and who set each. */
    recipes?: readonly Recipe[];
    names?: Record<Who, string>;
    onrecipe?: (r: Recipe) => void;
    /** レシピを つくる: a new recipe (a meal's search only). */
    onnewrecipe?: () => void;
    /** マイ食品 to offer (everyone's), one picked, and じぶんで つくる (the name typed so far). */
    customs?: readonly FoodCustom[];
    oncustom?: (c: FoodCustom) => void;
    oncreate?: (name: string) => void;
    /** One tap, no amount (a meal's search): a food logged as it comes (a recent one as I had it), a custom food by
     *  its serving. */
    onquick?: (item: Item, g?: number, u?: string, f?: FoodEntry['f']) => void;
    oncustomquick?: (c: FoodCustom) => void;
    /** What this trip added (oldest first: a meal's entries, a recipe's ingredients), each taken back by ✕ (`onunadd`);
     *  完了 (`onfinish`) ends the trip; `addedHead` its heading's string (追加したもの（n）, 追加した材料（n）). */
    added?: readonly { id: string; g: number; f: FoodSnap }[];
    onunadd?: (id: string) => void;
    addedHead?: string;
    onfinish?: () => void;
    /** クイック: the quick entry's form (`k`: a kcal typed), or one logged at once with that kcal (`onquicklog`). */
    onquicknew?: (k?: number) => void;
    onquicklog?: (k: number) => void;
    /** A food row opened in place (a meal's search; none: a row opens its amount): what it logs as (`of`: Food's
     *  pickOf), its 追加 (`add`, in the search's meal) and 栄養成分 › (`more`: the amount level at what was set). */
    inline?: {
      of: (item: Item, f?: FoodEntry['f']) => { item: Item; serving: boolean; swap: boolean };
      add: (item: Item, f: FoodEntry['f'] | undefined, v: Set) => void;
      more: (item: Item, f: FoodEntry['f'] | undefined, v: Set) => void;
    };
  }
  /** A food row (`row`): its key (`r:` さいきん's, `c:` マイ食品's, `f:` the catalog's, then its id), its data-
   *  attributes, the food it opens as (`item`, read when it opens) and as it was logged (`f`, `g0`, `u0`), its tap and ＋. */
  type Row = {
    key: string; data: Record<string, string | number>; name: string; item: () => Item; f?: FoodEntry['f']; g0?: number; u0?: string;
    pick: () => void; quick?: (() => void) | undefined;
  };
  let {
    recent, mine = [], since = '', onpick, recipes = [], names, onrecipe, onnewrecipe, customs = [], oncustom, oncreate, onquick, oncustomquick, added = [], onunadd, addedHead = 'food.addedHead',
    onfinish, onquicknew, onquicklog, inline
  }: Props = $props();

  let db = $state.raw<FoodDb | null>(null);
  let failed = $state(false);
  /** Bumped when a dataset comes in after the load (the products, one fetched again): search again. */
  let more = $state(0);
  let text = $state('');
  /** The committed query (never mid-composition). */
  let q = $state('');
  let input: HTMLInputElement | undefined = $state();

  /** Bumped by もういちど: load again. */
  let tries = $state(0);
  $effect(() => {
    void tries;
    let live = true, stop = () => {};
    failed = false;
    foodDb().then((d) => {
      if (!live) return;
      db = d;
      // (the products with it: a search's, never the sheet's open; search again as each comes in)
      stop = d.onAdd(() => more++);
      void d.wantMore().then(() => live && more++);
    }, () => live && (failed = true));
    return () => {
      live = false;
      stop();
    };
  });
  $effect(() => {
    if (matchMedia('(hover: hover)').matches) input?.focus();
  });
  /** The pictures (a food without one: its category's tile). */
  const imgs = $derived(kept.images);
  $effect(wantImages);

  /** A kcal typed, offered as a quick entry. */
  const kcalTyped = $derived(onquicknew ? typedKcal(q) : null);
  /** A dataset coming in (the products, the chain menus) never reshuffles the rows already shown for this query: those
   *  still found keep their order, the new ones go under them (`shown`: this query's, as listed). */
  let shown: { q: string; items: Item[] } = { q: '', items: [] };
  /** A keystroke's one pass over the catalog: the foods and the shops they're on (findFoods: the chips, `shops`). */
  const found = $derived.by(() => {
    void more;
    const query = q.trim(), again = shown.q === query && shown.items.length > 0;
    return { query, again, ...(db && query ? findFoods(db, q, again ? 80 : 40) : { items: [], shops: [] }) };
  });
  const results = $derived.by(() => {
    const { query, again, items } = found;
    if (!again) return (shown = { q: query, items }).items;
    const ids = new Set(items.map((it) => it.id)), had = new Set(shown.items.map((it) => it.id));
    return (shown.items = [...shown.items.filter((it) => ids.has(it.id)), ...items.filter((it) => !had.has(it.id))]);
  });
  /** The lazy datasets still coming (db.pending): no 見つかりませんでした yet. */
  const pending = $derived.by(() => {
    void more;
    return db?.pending ?? false;
  });
  /** 近いもの for a query nothing holds whole (food/search.ts nearby: a full pass, ~30 ms on a Mac), once typing
   *  pauses. */
  let near = $state.raw<Item[]>([]);
  $effect(() => {
    const query = q.trim();
    near = [];
    if (!db || !query || results.length) return;
    const d = db;
    const id = setTimeout(() => (near = nearFoods(d, query)), 250);
    return () => clearTimeout(id);
  });
  /** The rows drawn: the first FIRST of a new query (a keystroke's frame, about six over the keyboard), the rest once the
   *  list's end nears the screen (`more`'s sentinel: `rest`). */
  const FIRST = 24;
  let drawn = $derived.by(() => {
    void results;
    return FIRST;
  });
  /** The list's end within 400 px of the screen: every row. */
  function rest(node: HTMLElement) {
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) drawn = Infinity;
    }, { root: node.closest('[data-food-sheet]'), rootMargin: '400px 0px' }); // the sheet scrolls (the margin is its)
    io.observe(node);
    return { destroy: () => io.disconnect() };
  }
  /** The shop chips under the field: typing, the results' shops (found's: two or more, none named, shopChips) with
   *  their counts; nothing typed, よく行く店. None without the chain menus (not in yet). */
  const shops = $derived.by((): { shop: string; name: string; n?: number }[] => {
    void more;
    if (!db) return [];
    return q.trim() ? shopChips(found.shops) : recentShops(mine, db, since);
  });
  /** A shop chip's tap: its name written into the query, before what's typed (no filter kept anywhere else: ✕ clears
   *  it), the field kept focused (the keyboard stays up). */
  function toShop(name: string) {
    setQ((text = q.trim() ? `${name} ${q.trim()}` : `${name} `));
    input?.focus();
  }
  /** The recipes and custom foods whose names hold every word typed (all of them with nothing typed). */
  const words = $derived(q.trim().split(/[\s　]+/).map(searchKey).filter(Boolean));
  const hits = (n: string) => words.every((w) => searchKey(n).includes(w));
  const recipeById = $derived(new Map(recipes.map((r) => [r.id, r])));
  const myRecipes = $derived(onrecipe ? recipes.filter((r) => hits(r.n)) : []);
  const myFoods = $derived(oncustom ? customs.filter((c) => hits(c.n)) : []);
  /** Nothing of ours matches what was typed (the catalog's own say so after). */
  const noneOfOurs = $derived(!myRecipes.length && !myFoods.length);

  /** A new query: searched, the row open in place closed, and a row's ＋ no longer held (`quick`). */
  function setQ(v: string) {
    if (v === q) return;
    q = v;
    open = null;
    closing = false;
    held = 0;
  }
  function onInput(e: Event) {
    if (!(e as InputEvent).isComposing) setQ(text);
  }
  function clear() {
    setQ((text = ''));
    input?.focus();
  }
  /** The row open in place (`r:` さいきん's, `c:` マイ食品's, `f:` the catalog's, then its id), and it closing. */
  let open = $state<string | null>(null);
  let closing = $state(false);
  let box: HTMLFormElement | undefined = $state();
  /** A row's tap: it opened in place (another closed at once), the field blurred (the keyboard down: room), kept in
   *  view: a row closed above it is made up for, and when it would run past the screen it goes under the field. */
  function toggle(e: MouseEvent, key: string) {
    if (open === key) return shut();
    const li = (e.currentTarget as HTMLElement).closest('li')!;
    const sc = li.closest<HTMLElement>('[data-food-sheet]');
    const y0 = li.getBoundingClientRect().top;
    input?.blur();
    closing = false;
    open = key;
    flushSync();
    if (!sc) return;
    sc.scrollTop += li.getBoundingClientRect().top - y0;
    const r = li.getBoundingClientRect();
    const full = (li.querySelector<HTMLElement>('.it')?.offsetHeight ?? 0) + 8 + (li.querySelector<HTMLElement>('.ex > *')?.scrollHeight ?? 0);
    const top = (box?.getBoundingClientRect().bottom ?? sc.getBoundingClientRect().top) + 8;
    const bottom = Math.min(sc.getBoundingClientRect().bottom, window.visualViewport?.height ?? Infinity);
    if (r.top < top || r.top + full > bottom) sc.scrollBy({ top: r.top - top, behavior: 'smooth' });
  }
  function shut() {
    if (!open) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) open = null;
    else closing = true;
  }
  function onEsc(e: KeyboardEvent) {
    if (e.key !== 'Escape' || !open) return;
    e.preventDefault(); // (the sheet stays: Esc closes the row)
    shut();
  }
  /** A row's tap: open in place (a meal's search), else its amount. */
  const tap = (key: string, pick: () => void) => (e: MouseEvent) => (inline ? toggle(e, key) : pick());

  /** A row's ＋: logged at once, the field cleared and focused in the same tap (the keyboard stays up for the next).
   *  A second tap within QUICK_HOLD_MS with nothing typed meanwhile is the same finger: さいきん, swapped in by the
   *  clear, has the food just added first, its own ＋ under it (two fast taps are two clicks: touch-action). */
  const QUICK_HOLD_MS = 350;
  let held = 0;
  function quick(run: () => void) {
    if (performance.now() < held) return;
    run();
    clear();
    held = performance.now() + QUICK_HOLD_MS;
  }
</script>

{#snippet customRows()}
  {#if myFoods.length}
    <h3 class="lh">{t('food.my.head')}</h3>
    <ul class="list" data-food-customs>
      {#each myFoods as c (c.id)}
        {#snippet cells()}
          <FoodThumb />
          <span class="nm"><Phrases text={c.n} name /></span>
          <small class="meta">{names?.[c.who] ?? c.who}</small>
          <span class="kc"><b class="money">{kcalText(c.k)}</b><small>{servingText(c)}</small></span>
        {/snippet}
        {@render row({ key: `c:${c.id}`, data: { 'data-custom': c.id }, name: c.n, item: () => customItem(c), pick: () => oncustom?.(c),
          quick: oncustomquick && (() => oncustomquick(c)) }, cells)}
      {/each}
    </ul>
  {/if}
{/snippet}

<!-- a food row (さいきん's, マイ食品's, the catalog's): its tap (open in place, or `pick`), its own ＋ (`quick`), and the
     row opened under it; `cells` what it shows -->
{#snippet row(r: Row, cells: Snippet)}
  <li class:rw={!!r.quick}><button type="button" class="card it tt" data-sfx="page" {...r.data} aria-expanded={inline ? open === r.key : undefined}
    aria-controls={inline && open === r.key ? `fo-${r.key}` : undefined} onclick={tap(r.key, r.pick)}>{@render cells()}</button>{#if r.quick}{@render qa(r.name, r.quick, r.key)}{/if}{@render opened(r)}</li>
{/snippet}

<!-- a row opened in place, under it -->
{#snippet opened({ key, item: of, f, g0, u0 }: Row)}
  {#if inline && open === key}
    {@const item = of()}
    {@const p = inline.of(item, f)}
    <FoodOpen id="fo-{key}" item={p.item} {g0} {u0} serving={p.serving} swap={p.swap} {closing}
      onadd={(v) => quick(() => { inline.add(item, f, v); open = null; })} onmore={(v) => inline.more(item, f, v)}
      onclosed={() => { open = null; closing = false; }} />
  {/if}
{/snippet}

{#snippet plus()}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5 V19 M5 12 H19" /></svg>{/snippet}

{#snippet bolt()}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3 L6 13 H11 L10 21 L18 10 H13 Z" /></svg>{/snippet}

<!-- a row's own ＋: logged as it comes, in one tap; hidden while its row is open (one add there: FoodOpen's 追加) -->
{#snippet qa(name: string, run: () => void, key?: string)}
  <button type="button" class="qa" class:off={!!inline && key !== undefined && open === key} data-sfx="confirm" data-quick aria-label={t('food.quickAdd', { name })} onclick={() => quick(run)}>{@render plus()}</button>
{/snippet}

{#snippet recipeRows()}
  {#if onrecipe && myRecipes.length}
    <h3 class="lh">{t('food.rcp.mine')}</h3>
    <ul class="list" data-food-recipes>
      {#each myRecipes as r (r.id)}
        <li><button type="button" class="card it tt" data-sfx="page" data-recipe={r.id} onclick={() => onrecipe(r)}>
          <FoodThumb cat="レシピ" plate={plateOf(r, imgs, db, 48)} />
          <span class="nm"><Phrases text={r.n} name /></span>
          <small class="meta">{names?.[r.who] ?? r.who} · {t('food.rcp.servings', { n: r.sv })}</small>
          <span class="kc"><b class="money">{kcalText(r.per.kcal)}</b><small>{t('food.rcp.one')}</small></span>
        </button></li>
      {/each}
    </ul>
  {/if}
{/snippet}

<svelte:window onkeydown={onEsc} />

<div class="search">
  <form class="box" bind:this={box} role="search" onsubmit={(e) => { e.preventDefault(); input?.blur(); }}>
    <svg class="glass" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15 L20 20" /></svg>
    <input bind:this={input} bind:value={text} type="search" data-sfx="none" data-food-q enterkeyhint="search" autocomplete="off"
      autocapitalize="off" spellcheck="false" aria-label={t('food.search')} placeholder={t('food.searchHint')}
      oninput={onInput} oncompositionend={() => setQ(text)} />
    {#if text}<span class="x"><NavButton kind="close" label={t('food.clear')} sfx="tick" onclick={clear} /></span>{/if}
  </form>

  {#if shops.length}
    <!-- (a press keeps the field's focus: the keyboard never drops between the tap and the query) -->
    <div class="shops" data-food-shops={q.trim() ? 'in' : 'often'} role="presentation" onmousedown={(e) => e.preventDefault()}>
      <ChipRow label={t(q.trim() ? 'food.shops.in' : 'food.shops.often')}>
        {#if !q.trim()}<span class="sl" aria-hidden="true">{t('food.shops.often')}</span>{/if}
        {#each shops as s (s.shop)}
          <Chip label={s.name} count={s.n} data-shop-chip={s.shop} onclick={() => toShop(s.name)} />
        {/each}
      </ChipRow>
    </div>
  {/if}

  {#if onfinish && added.length}
    <section class="card added" data-food-added aria-labelledby="fs-added">
      <header>
        <h3 id="fs-added">{t(addedHead, { n: added.length })}</h3>
        <button type="button" class="btn small" data-sfx="confirm" data-food-finish onclick={onfinish}>{t('food.finish')}</button>
      </header>
      <ul>
        {#each added as e (e.id)}
          <li data-added={e.id}>
            <span class="nm"><Phrases text={e.f.n} name /></span>
            <small class="meta">{amountText(e)}</small>
            <b class="kc money">{kcalText(entryKcal(e))}</b>
            <span class="un"><NavButton kind="close" label={t('food.unadd', { name: e.f.n })} sfx="undo" data-unadd={e.id} onclick={() => onunadd?.(e.id)} /></span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if !q.trim()}
    {@render recentRows()}
    {@render recipeRows()}
    {@render customRows()}
  {:else}
    {#if kcalTyped !== null}
      <ul class="list" data-food-quick>
        <li class:rw={!!onquicklog}><button type="button" class="card it" data-sfx="page" data-quick-row onclick={() => onquicknew?.(kcalTyped!)}>
          <span class="nm">{t('food.quick.name')}</span>
          <small class="meta">{t('food.quick.row')}</small>
          <b class="kc money">{kcalText(kcalTyped)}</b>
        </button>{#if onquicklog}{@render qa(t('food.quick.of', { k: formatNum(kcalTyped) }), () => onquicklog(kcalTyped!))}{/if}</li>
      </ul>
    {/if}
    {@render recipeRows()}
    {@render customRows()}
    {@render catalog()}
  {/if}
</div>

{#snippet recentRows()}
  <!-- 最近's heading, the つくる chips at its right end (one short row: さいきん, the 1-tap path, stays high over the
       keyboard); hidden while typing (nothing found: its card's 自分で作る) -->
  <div class="rh">
    <h3 class="lh">{t('food.recent')}</h3>
    {#if (onnewrecipe || oncreate || onquicknew) && !text}
      <div class="new">
        {#if onnewrecipe}<button type="button" class="chip make" data-sfx="page" data-recipe-new aria-label={t('food.rcp.make')} onclick={onnewrecipe}>{@render plus()}{t('food.new.recipe')}</button>{/if}
        {#if oncreate}<button type="button" class="chip make" data-sfx="page" data-custom-new aria-label={t('food.my.new')} onclick={() => oncreate(q.trim())}>{@render plus()}{t('food.new.custom')}</button>{/if}
        {#if onquicknew}<button type="button" class="chip make" data-sfx="page" data-quick-new aria-label={t('food.quick.make')} onclick={() => onquicknew()}>{@render bolt()}{t('food.new.quick')}</button>{/if}
      </div>
    {/if}
  </div>
  {#if recent.length}
    <ul class="list" data-food-recent>
      {#each recent as e (e.id)}
        {#snippet cells()}
          {@const gl = snapGloss(db, e.f)}
          {@const r = recipeOfEntry(recipeById, e)}
          {@const ci = itemById(db, e.f.id)}
          {@const shop = ci?.shop && ci.brand}
          <FoodThumb cat={catOf(db, e.f.id)} img={imgOf(imgs, e.f.id, 48)} src={kaloriImg(ci, 48)} plate={r ? plateOf(r, imgs, db, 48) : null} />
          <span class="nm"><Phrases text={e.f.n} name /></span>
          <small class="meta"><span class="as">{amountText(e)}{#if gl || shop}{' · '}{/if}</span>{#if shop}<span class="sr-only">{t('food.shop')}</span><ShopMark /><span class="br" data-brand>{shop}</span>{:else if gl}<span class="gl" data-gloss>{gl}</span>{/if}</small>
          <b class="kc money">{kcalText(entryKcal(e))}</b>
        {/snippet}
        {@const item = () => itemOf(e.f, db, e.g)}
        {@render row({ key: `r:${e.id}`, data: { 'data-item': e.f.id }, name: e.f.n, item, f: e.f, g0: e.g, u0: e.f.u, pick: () => onpick(item(), e.g, e.f.u, e.f),
          quick: onquick && (() => onquick(item(), e.g, e.f.u, e.f)) }, cells)}
      {/each}
    </ul>
  {:else}
    <p class="note">{t('food.recentEmpty')}</p>
  {/if}
{/snippet}

<!-- a food's states on its row in process order (生 ゆで 焼き), the one its kcal is for on a small yuzu chip, the others
     soft; past four: that one and ほか N (the chips themselves are the amount's) -->
{#snippet states(it: Item, vs: Item[])}
  <span class="sts" data-states={vs.length}>{#if vs.length > 4}<b data-state={it.st}>{it.st}</b><span class="st">{t('food.st.more', { n: vs.length - 1 })}</span>
    {:else}{#each vs as x (x.id)}{#if x === it}<b data-state={it.st}>{x.st}</b>{:else}<span class="st">{x.st}</span>{/if}{/each}{/if}</span>
{/snippet}

<!-- n independent sources agree on its kcal: in words on a free second line, else a ✓ beside the name (its words its label) -->
{#snippet verified(n: number, short = false)}<i class="ok" class:short role="img" data-verified={n} aria-label={t('food.verified', { n })}>{short ? '✓' : t('food.verifiedBadge', { n })}</i>{/snippet}

{#snippet food(it: Item)}
  {@const p = defaultPortion(it)}
  {@const v = verifyOf(db!, it.id)}
  {@const gl = glossOf(it, it.name)}
  {@const vs = variantsOf(db, it)}
  <!-- ✓n beside the name, or on the second line when that would be empty: a row two lines, never three -->
  {@const solo = !it.brand && !it.ended && !gl && !vs.length}
  {@const ok = v && v.n >= 2 ? v.n : 0}
  {#snippet cells()}
    <FoodThumb cat={it.cat} img={imgOf(imgs, it.id, 48)} src={kaloriImg(it, 48)} />
    <span class="nm"><Phrases text={vs.length ? stemName(it) : it.name} name />{#if ok && !solo}{@render verified(ok, true)}{/if}</span>
    <small class="meta">{#if it.brand}{#if it.shop}<span class="sr-only">{t('food.shop')}</span><ShopMark />{/if}<span class="br" data-brand>{it.brand}</span>{#if it.ended || gl}{' · '}{/if}{/if}{#if it.ended}<span data-food-ended>{t('food.kal.ended')}</span>{#if gl}{' · '}{/if}{/if}{#if gl}<span class="gl" data-gloss>{gl}</span>{/if}{#if vs.length}{#if gl || it.brand || it.ended}{'\u3000'}{/if}{@render states(it, vs)}{:else if solo}{#if ok}{@render verified(ok)}{:else}{'\u00a0'}{/if}{/if}</small>
    <span class="kc"><b class="money">{kcalText(p.kcal)}</b><small>{p.label}</small></span>
  {/snippet}
  {@render row({ key: `f:${it.id}`, data: { 'data-item': it.id, 'data-per100': it.kcal }, name: it.name, item: () => it, pick: () => onpick(it),
    quick: onquick && (() => onquick(it)) }, cells)}
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
    {#if pending}
      <p class="note" role="status" data-food-pending>{t('food.pending')}</p>
    {:else if noneOfOurs}
      <section class="card none" data-food-none>
        <p class="note" role="status">{t('food.none', { q: q.trim() })}</p>
        {#if oncreate}
          <p class="note">{t('food.my.noneHint')}</p>
          <button type="button" class="btn small make" data-sfx="page" data-custom-make onclick={() => oncreate(q.trim())}>{@render plus()}{t('food.my.make')}</button>
        {/if}
      </section>
      {#if near.length}
        <h3 class="lh">{t('food.near')}</h3>
        <ul class="list" data-food-near>{#each near as it (it.id)}{@render food(it)}{/each}</ul>
      {/if}
    {/if}
  {:else}
    <ul class="list" data-food-results>
      {#each results.slice(0, drawn) as it (it.id)}
        {@render food(it)}
      {/each}
    </ul>
    {#if results.length > drawn}<div class="more" use:rest aria-hidden="true"></div>{/if}
    {#if pending}<p class="note" role="status" data-food-pending>{t('food.pendingMore')}</p>{/if}
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
  /* ✕: the app's NavButton inside the pill's right end */
  .x { display: flex; margin-right: -6px; }
  /* the shop chips: ChipRow's line, its sides at the field's */
  .shops { margin: -6px -12px; min-width: 0; }
  .sl { flex: none; margin-right: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .lh { margin: 4px 2px 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .it {
    appearance: none; border: 0; cursor: pointer; width: 100%; text-align: left; font: inherit; color: var(--text);
    display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'nm kc' 'meta kc'; align-items: center;
    column-gap: 10px; row-gap: 3px; padding: 10px 14px; min-height: var(--row-obj);
  }
  /* with a thumbnail: it spans both lines at the left, 4px into the padding above and below (the row as tall) */
  .it.tt { grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: 'th nm kc' 'th meta kc'; padding-left: 10px; }
  .tt .nm { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; overflow: hidden; } /* the whole name on its amount (three lines: a name breaks only at its brackets, Phrases) */
  .tt > :global([data-thumb]) { grid-area: th; margin: -4px 2px -4px 0; }
  .it:active { transform: translateY(2px); }
  .it:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .nm { grid-area: nm; font-weight: 700; font-size: var(--fs-body); overflow-wrap: anywhere; }
  .ok {
    display: inline-block; margin-left: 6px; padding: 2px 6px; border-radius: var(--r-pill); vertical-align: 1px;
    font: 700 var(--fs-xs)/1.1 var(--font-num); font-style: normal; color: var(--c-ink); background: color-mix(in srgb, var(--c-mint) 70%, var(--c-cream));
  }
  .meta .ok { margin-left: 0; }
  .ok.short { padding: 2px 5px; }
  .meta { grid-area: meta; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); overflow-wrap: anywhere; }
  .br, .meta > :global([data-shop]) { color: var(--text); }
  /* the shown state a chip within the line (inline padding: the row no taller), the others faded */
  .sts { white-space: nowrap; }
  .sts > * + * { margin-left: 6px; }
  .sts b { padding: 1px 7px; border-radius: var(--r-pill); color: var(--c-ink); background: color-mix(in srgb, var(--c-yuzu) 75%, var(--c-cream)); }
  .sts .st { font-weight: 500; opacity: .8; }
  /* the everyday name: one line, cut short (the row keeps its two lines) */
  .meta:has(.gl) { display: flex; min-width: 0; white-space: pre; }
  .gl, .meta:has(.gl) .br { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .meta:has(.gl) > :not(.gl, .br) { flex: none; }
  .fail { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .fail .btn { margin: 0; }
  .kc { grid-area: kc; display: grid; justify-items: end; gap: 3px; font-size: var(--fs-body); white-space: nowrap; }
  .kc small { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); max-width: 12em; overflow: hidden; text-overflow: ellipsis; }
  /* 最近's heading and the つくる chips on one line (theme.css .chip: 36 px drawn, 44 px to tap) */
  .rh { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 36px; margin-bottom: -2px; }
  .rh .lh { margin: 0 2px; }
  .new { display: flex; gap: 6px; }
  .make { margin: 0; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
  .new .make { gap: 3px; padding: 0 10px; white-space: nowrap; }
  .make svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .new .make svg { width: 14px; height: 14px; }
  /* a row with its own ＋ beside it (FoodMeal's ＋ object) */
  .rw { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; }
  /* a row opened in place: its card under the row and its ＋, the row's width; the row says so (its edge) */
  li > :global(.ex) { grid-column: 1 / -1; margin-top: 8px; }
  .rw > :global(.ex) { margin-top: 0; }
  .it[aria-expanded='true'] { box-shadow: inset 0 0 0 2px var(--c-edge), var(--sh-lip); }
  /* open, the controls under it say the state, amount and kcal: the row's own (its default, as I had it) step aside */
  .it[aria-expanded='true'] :is(.kc, .sts) { visibility: hidden; }
  .it[aria-expanded='true'] .as { display: none; }
  .qa {
    appearance: none; border: 0; cursor: pointer; width: var(--hit); height: var(--hit); border-radius: var(--r-btn); flex: none;
    display: grid; place-items: center; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-obj); margin-bottom: var(--lip-h);
  }
  /* (its room kept: the row doesn't widen under the finger) */
  .qa.off { visibility: hidden; }
  .qa:active { transform: translateY(2px); box-shadow: var(--sh-obj-press); }
  .qa:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .qa svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; }
  /* this trip's foods: a meal card's rows, each with ✕; おわり at the header's end */
  .added { display: grid; gap: 2px; padding: 8px 14px; }
  .added header { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: var(--hit); }
  .added h3 { margin: 0; font-size: var(--fs-body); font-weight: 700; }
  .added header .btn { margin: 0 0 var(--lip-h); }
  .added ul { list-style: none; margin: 0; padding: 0; }
  .added li {
    display: grid; grid-template-columns: minmax(0, 1fr) auto auto; grid-template-areas: 'nm kc un' 'meta kc un'; align-items: center;
    column-gap: 10px; min-height: var(--row-obj); padding: 4px 0 4px 2px;
  }
  .added li + li { border-top: 1.5px dashed var(--stitch); }
  .added .nm { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .un { grid-area: un; display: flex; margin-right: -6px; }
  .none { display: grid; gap: 8px; padding: 12px 14px; }
  .none .note { margin: 0 2px; }
  .more { height: 1px; }
  .note { margin: 4px 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
</style>
