<script lang="ts">
  // ごはん's search (a level over the day, for one meal): a 16px search field, then 最近 (my latest entry of each food,
  // as I last had it) until something is typed, or the catalog's best matches (each: the name, its default portion's
  // kcal and per 100 g, ✓n when n independent sources agree on it). Japanese IME-safe: half-composed text (「なt」) is
  // never searched; the search runs on each committed change. A row opens the amount.
  import type { FoodEntry } from '#lib/contract/food.ts';
  import { searchFoods, verifyOf, type FoodDb, type Item } from '#lib/food/index.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { amountText, defaultPortion, foodDb, itemOf } from './foodUi.ts';

  interface Props {
    /** My recent entries (recentOf). */
    recent: FoodEntry[];
    /** A food picked: a catalog item, or a recent one with the grams I had last. */
    onpick: (item: Item, g?: number, u?: string) => void;
  }
  let { recent, onpick }: Props = $props();

  let db = $state.raw<FoodDb | null>(null);
  let failed = $state(false);
  /** Bumped when the lazy datasets (products) are in: search again. */
  let more = $state(0);
  let text = $state('');
  /** The committed query (never mid-composition). */
  let q = $state('');
  let input: HTMLInputElement | undefined = $state();

  $effect(() => {
    let live = true;
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
    return db && q.trim() ? searchFoods(db, q, 40) : [];
  });
  const kcal = (n: number) => t('kiroku.kcal', { n: formatNum(n) });

  function onInput(e: Event) {
    if (!(e as InputEvent).isComposing) q = text;
  }
  function clear() {
    text = q = '';
    input?.focus();
  }
</script>

<div class="search">
  <form class="box" role="search" onsubmit={(e) => { e.preventDefault(); input?.blur(); }}>
    <svg class="glass" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15 L20 20" /></svg>
    <input bind:this={input} bind:value={text} type="search" data-sfx="none" data-food-q enterkeyhint="search" autocomplete="off"
      autocapitalize="off" spellcheck="false" aria-label={t('food.search')} placeholder={t('food.searchHint')}
      oninput={onInput} oncompositionend={() => (q = text)} />
    {#if text}<button type="button" class="x" data-sfx="tick" aria-label={t('food.clear')} onclick={clear}>✕</button>{/if}
  </form>

  {#if !q.trim()}
    <h3 class="lh">{t('food.recent')}</h3>
    {#if recent.length}
      <ul class="list" data-food-recent>
        {#each recent as e (e.id)}
          <li><button type="button" class="card it" data-sfx="page" data-item={e.f.id} onclick={() => onpick(itemOf(e.f, db), e.g, e.f.u)}>
            <span class="nm">{e.f.n}</span>
            <small class="meta">{amountText(e)}</small>
            <b class="kc money">{kcal(Math.round((e.f.k * e.g) / 100))}</b>
          </button></li>
        {/each}
      </ul>
    {:else}
      <p class="note">{t('food.recentEmpty')}</p>
    {/if}
  {:else if failed}
    <p class="note" role="status">{t('food.loadFail')}</p>
  {:else if !db}
    <p class="note" role="status">{t('food.loading')}</p>
  {:else if !results.length}
    <p class="note" role="status">{t('food.none', { q: q.trim() })}</p>
  {:else}
    <ul class="list" data-food-results>
      {#each results as it (it.id)}
        {@const p = defaultPortion(it)}
        {@const v = verifyOf(db, it.id)}
        <li><button type="button" class="card it" data-sfx="page" data-item={it.id} onclick={() => onpick(it)}>
          <span class="nm">{it.name}{#if v && v.n >= 2}<i class="ok" title={t('food.verified', { n: v.n })} aria-label={t('food.verified', { n: v.n })}>✓{v.n}</i>{/if}</span>
          <small class="meta">{t('food.per100', { k: formatNum(it.kcal) })}</small>
          <span class="kc"><b class="money">{kcal(p.kcal)}</b><small>{p.label}</small></span>
        </button></li>
      {/each}
    </ul>
  {/if}
</div>

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
  .x {
    appearance: none; border: 0; cursor: pointer; width: 36px; height: 36px; border-radius: 50%; flex: none;
    background: color-mix(in srgb, var(--lip) 50%, transparent); color: var(--text); font: 700 var(--fs-s)/1 var(--font-ui);
  }
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
  .meta { grid-area: meta; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .kc { grid-area: kc; display: grid; justify-items: end; gap: 3px; font-size: var(--fs-body); white-space: nowrap; }
  .kc small { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); max-width: 9em; overflow: hidden; text-overflow: ellipsis; }
  .note { margin: 4px 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
</style>
