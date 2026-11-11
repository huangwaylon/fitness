<script lang="ts">
  // タヌキ商店's counter (docs/design.md "The shop"): its two lists, a sheet over the room (ShopRoom.svelte), its head and
  // tabs pinned, the list scrolling under them, the bar at the foot. うる: my pocket (everything I caught, found or picked
  // up less what I sold: model/shop.ts; by its sections, shop/pocket.ts), a tap one more, − one less, 全部 the lot.
  // かう: the fields' starts, then the day's stock (shop/stock.ts), its 全部 buying every piece I don't have at once
  // (stock.ts buyAll). A sell or a buy shows at once with 取り消す (store/actions.ts undoBanner). The title bar is the kit's
  // (タヌキ商店, my かいがら, ✕); the twins don't talk in here (their balloon is the room's). A piece picked is the room's too
  // (its card's: `pick`, `why`, `buy`).
  import NavBar from '../ui/NavBar.svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import PieceTile from './PieceTile.svelte';
  import { iconUrl } from '../tent/items.ts';
  import { bare } from '../kiroku/zukan.ts';
  import { SECTIONS, pocketItem } from './pocket.ts';
  import { sellPrice } from '#lib/contract/shop.ts';
  import { buyPrice } from '#lib/contract/stock.ts';
  import { allOf, buyAll } from './stock.ts';
  import type { ShopView } from '#lib/model/shop.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { sell, undoBanner } from '#lib/store/actions.ts';
  import { buyStarts } from '#lib/store/farm.svelte.ts';
  import { CROPS, FARM, isFarmCrop, type Crop } from '#lib/contract/farm.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';

  export type Tab = 'sell' | 'buy';
  interface Props {
    shop: ShopView;
    stock: readonly string[];
    tab: Tab;
    /** かう's piece picked (the room's card's too). */
    pick: string | null;
    /** Why `pick` can't be bought now (stock.ts buyRefusal), or null. */
    why: string | null;
    /** 買う for `pick`. */
    buy: () => void;
    itemName: (code: string) => string;
    onclose: () => void;
  }
  let { shop, stock, tab = $bindable(), pick = $bindable(), why, buy, itemName, onclose }: Props = $props();

  /** A tally key's name (the pocket's table: the ずかん's names; a start's the list's own kanji, 「トマトの苗」). */
  const speciesName = (k: string) => {
    const c = /^goods:(\w+)-start$/.exec(k)?.[1];
    return c && isFarmCrop(c) ? startName(c) : bare(t(pocketItem(k)?.name ?? k));
  };
  const startName = (c: Crop) => t(`farm.start.${c}`);

  // ---- うる
  /** うる: how many of each species picked (`kind:id` → n). */
  let picks = $state<Record<string, number>>({});
  /** My pocket by うる's sections (pocket.ts SECTIONS), each dearest first. */
  const pocket = $derived([...shop.pocket].flatMap(([k, n]) => {
    const it = pocketItem(k);
    return it ? [{ k, n, p: sellPrice(k) ?? 0, it }] : [];
  }).sort((a, b) => SECTIONS.indexOf(a.it.section) - SECTIONS.indexOf(b.it.section) || b.p - a.p || a.k.localeCompare(b.k)));
  const sections = $derived(SECTIONS.flatMap((s) => {
    const rows = pocket.filter((r) => r.it.section === s);
    return rows.length ? [{ s, rows }] : [];
  }));
  const picked = $derived(Object.entries(picks).filter(([k, n]) => n > 0 && (shop.pocket.get(k) ?? 0) >= n));
  const pickedN = $derived(picked.reduce((a, [, n]) => a + n, 0));
  const pickedV = $derived(picked.reduce((a, [k, n]) => a + n * (sellPrice(k) ?? 0), 0));
  function more(k: string) {
    const max = shop.pocket.get(k) ?? 0;
    const n = picks[k] ?? 0;
    picks = { ...picks, [k]: n >= max ? 0 : n + 1 };
    cue('tick');
  }
  function less(k: string) {
    picks = { ...picks, [k]: Math.max(0, (picks[k] ?? 0) - 1) };
  }
  function all() {
    picks = Object.fromEntries(pocket.map(({ k, n }) => [k, n]));
  }
  function sellPicked() {
    if (!pickedN) return void cue('boop');
    // what's sold, kept before the sale: `picked` follows the pocket, which the sale empties
    const sold = [...picked], n = pickedN;
    const r = sell(new Map(sold));
    if (!r.ok) return void cue('boop');
    cue('buy');
    const one = sold.length === 1 ? sold[0] : null;
    undoBanner(one ? t('shop.sold', { name: speciesName(one[0]), n: String(one[1]), v: formatNum(r.shells ?? 0) }) : t('shop.soldMany', { n: String(n), v: formatNum(r.shells ?? 0) }), r);
    picks = {};
  }

  // ---- かう
  /** 全部 picked (every piece of the stock I don't have yet, bought at once: stock.ts buyAll). */
  let every = $state(false);
  /** 全部: what I don't have of today's stock, and its price together. */
  const rest = $derived((void shop, allOf(stock)));
  const short = $derived(Math.max(0, rest.total - shop.shells));
  function pickPiece(code: string) {
    every = false;
    starts = {};
    pick = pick === code ? null : code;
    cue('tick');
  }
  /** 全部: picks the lot (the bar says what it comes to), again: none. */
  function pickAll() {
    pick = null;
    if (!rest.items.length) return void cue('boop');
    every = !every;
    starts = {};
    cue('tick');
  }
  function buyEvery() {
    if (short) return void cue('boop');
    const r = buyAll(stock);
    if (!r.ok) return void cue('boop');
    cue('buy');
    undoBanner(t('shop.boughtMany', { n: String(r.n ?? 0), v: formatNum(r.total ?? 0) }), r);
    every = false;
  }
  // ---- かう's 苗 (docs/farming.md): the six starts, always in stock, a tap one more, − one less; 買う buys them at once,
  // all or none (one group: store/farm.svelte.ts buyStarts)
  let starts = $state<Partial<Record<Crop, number>>>({});
  const startsN = $derived(CROPS.reduce((a, c) => a + (starts[c] ?? 0), 0));
  const startsV = $derived(startsN * FARM.startBuy);
  /** The one crop picked (null: none, or more than one). */
  const startsOne = $derived.by(() => {
    const cs = CROPS.filter((c) => starts[c]);
    return cs.length === 1 ? cs[0] : null;
  });
  // (the starts and a piece or 全部 are one bar's: picking one lets go of the other)
  function moreStart(c: Crop) {
    pick = null;
    every = false;
    starts = { ...starts, [c]: ((starts[c] ?? 0) + 1) % 100 };
    cue('tick');
  }
  function lessStart(c: Crop) {
    starts = { ...starts, [c]: Math.max(0, (starts[c] ?? 0) - 1) };
  }
  function buyStartsPicked() {
    if (!startsN) return void cue('boop');
    if (startsV > shop.shells) return void cue('boop');
    const r = buyStarts(starts);
    if (!r.ok) return void cue('boop');
    cue('buy');
    const n = String(startsN), v = formatNum(startsV);
    undoBanner(startsOne ? t('shop.boughtStart', { name: startName(startsOne), n, v }) : t('shop.boughtStarts', { n, v }), r);
    starts = {};
  }
  function buyPicked() {
    if (startsN) return buyStartsPicked();
    if (every) return buyEvery();
    buy();
  }

  function switchTab(id: Tab) {
    tab = id;
    picks = {};
    pick = null;
    every = false;
  }
</script>

<section class="menu sheet-copy" data-shop-panel={tab}>
  <!-- the title bar (タヌキ商店, my かいがら, ✕) and the tabs stay put; the list scrolls under them, the bar at the foot -->
  <header class="pin">
    <NavBar title={t('shop.title')} {trailing} />
    <Segmented items={[{ id: 'sell', label: t('shop.tab.sell') }, { id: 'buy', label: t('shop.tab.buy') }]} value={tab} label={t('shop.title')} attr="shop-tab" onpick={switchTab} />
  </header>

  {#if tab === 'sell'}
    <div class="list" data-shop-list>
      {#if pocket.length}
        <div class="pocket" data-shop-pocket>
          {#each sections as { s, rows } (s)}
            <h2 class="sec-label" data-shop-sec={s}>{t(`shop.sec.${s}`)}</h2>
            <ul class="grid">
              {#each rows as { k, n, p, it } (k)}
                {@const c = picks[k] ?? 0}
                <PieceTile name={speciesName(k)} price={p} on={c > 0} count={c ? `${c}/${n}` : `×${n}`} data-shop-catch={k} data-n={n} data-picked={c}
                  aria-label={t('shop.catchLabel', { name: speciesName(k), n: String(n), v: String(p), c: String(c) })} onclick={() => more(k)}
                  less={c ? { key: k, label: t('shop.less', { name: speciesName(k) }), run: () => less(k) } : null}>
                  {#snippet icon()}<OfficialArt key={it.art} size={46} />{/snippet}
                </PieceTile>
              {/each}
            </ul>
          {/each}
        </div>
      {:else}
        <p class="empty" data-shop-empty>{t('shop.emptyPocket')}</p>
      {/if}
    </div>
    {#if pocket.length}
      <div class="bar">
        <p class="sum" data-shop-offer={pickedV}>{pickedN ? t('shop.offer', { n: String(pickedN), v: formatNum(pickedV) }) : t('shop.pickHint')}</p>
        <button type="button" class="btn small paper" data-shop-all data-sfx="tick" onclick={all}>{t('shop.all')}</button>
        <button type="button" class="btn small" data-shop-sell data-sfx="self" aria-disabled={!pickedN} onclick={sellPicked}>{t('shop.sell')}</button>
      </div>
    {/if}
  {:else}
    <div class="list" data-shop-list>
      <!-- the starts for the fields (docs/farming.md): always in stock, a count each, bought by the bar's 買う -->
      <h2 class="sec-label">{t('shop.starts')}</h2>
      <ul class="grid" data-shop-starts>
        {#each CROPS as c (c)}
          {@const n = starts[c] ?? 0}
          <PieceTile name={startName(c)} price={FARM.startBuy} on={n > 0} count={n ? `×${n}` : undefined} data-shop-start={c} data-picked={n}
            aria-label={t('shop.startLabel', { name: startName(c), v: String(FARM.startBuy), c: String(n) })} onclick={() => moreStart(c)}
            less={n ? { key: c, label: t('shop.less', { name: startName(c) }), run: () => lessStart(c) } : null}>
            {#snippet icon()}<OfficialArt key="finds/{c}-start" size={46} /><span class="tag"><OfficialArt key="finds/{c}" size={20} /></span>{/snippet}
          </PieceTile>
        {/each}
      </ul>
      <h2 class="sec-label">{t('shop.today')}</h2>
      {#if stock.length}
        <ul class="grid" data-shop-stock>
          {#each stock as code (code)}
            {@const owned = shop.owned.includes(code)}
            <PieceTile name={itemName(code)} price={buyPrice(code) ?? 0} on={pick === code || (every && !owned)} {owned} data-shop-item={code} data-price={buyPrice(code)}
              data-owned={owned} aria-pressed={pick === code} aria-label={t(owned ? 'shop.itemOwned' : 'shop.itemLabel', { name: itemName(code), v: formatNum(buyPrice(code) ?? 0) })}
              onclick={() => pickPiece(code)}>
              {#snippet icon()}<img src={iconUrl(code)} alt="" width="46" height="46" loading="lazy" decoding="async" />{/snippet}
            </PieceTile>
          {/each}
        </ul>
      {:else if week.model}
        <p class="empty" data-shop-sold-out>{t('shop.soldOut')}</p>
      {/if}
    </div>
    <div class="bar">
      <p class="sum" data-shop-pick={every ? 'all' : (pick ?? '')} data-shop-total={every ? rest.total : null} data-shop-starts-offer={startsN ? startsV : null}>
        {startsN ? (startsOne ? t('shop.startsOne', { name: startName(startsOne), n: String(startsN), v: formatNum(startsV) }) : t('shop.startsMany', { n: String(startsN), v: formatNum(startsV) }))
          : every ? t('shop.offer', { n: String(rest.items.length), v: formatNum(rest.total) })
          : pick ? t('shop.itemLabel', { name: itemName(pick), v: formatNum(buyPrice(pick) ?? 0) })
          : stock.length && !rest.items.length ? t('shop.allOwned') : t('shop.buyHint')}
      </p>
      {#if stock.length}
        <button type="button" class="btn small paper" data-shop-buy-all data-sfx="self" aria-pressed={every} aria-disabled={!rest.items.length}
          aria-label={t('shop.buyAll')} onclick={pickAll}>{t('shop.all')}</button>
      {/if}
      <button type="button" class="btn small" data-shop-buy data-sfx="self" aria-disabled={startsN ? startsV > shop.shells : every ? !!short : !pick || !!why}
        onclick={buyPicked}>{t('shop.buy')}</button>
    </div>
  {/if}
</section>

{#snippet trailing()}
  <span class="chip s wallet" data-shop-wallet-chip>{t('shop.wallet', { v: formatNum(shop.shells) })}</span>
  <NavButton kind="close" data-shop-close onclick={onclose} />
{/snippet}

<style>
  /* the sheet: its head and tabs pinned at the top and the bar at the foot, only the list between them scrolls (its own
     scroller, so iOS Safari's rubber band never drags the head off); fixed cream at every time of day, ink text (a game
     object, as the HUD's) */
  .menu {
    position: absolute; z-index: 4; left: 0; right: 0; bottom: 0; max-height: 72%; display: flex; flex-direction: column;
    background: var(--c-cream); border-radius: var(--r-card) var(--r-card) 0 0; box-shadow: 0 -4px 0 var(--c-lip); overflow: hidden;
    /* the panel's own controls keep the day's look (fixed cream, ink) at every time of day */
    --text: var(--c-ink); --text-soft: var(--c-ink-soft); --ctl: var(--c-card); --ctl-sel: var(--c-yuzu); --ctl-off: #EADBB8;
    --leaf-text: var(--c-leaf-text); --focus: var(--c-ink);
    --sh-ctl: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); --sh-ctl-press: inset 0 0 0 2px var(--c-edge), 0 2px 0 var(--c-edge);
    animation: sheet-in .2s ease-out;
  }
  @keyframes sheet-in { from { translate: 0 24px; opacity: 0; } }
  .pin {
    flex: none; display: grid; gap: 6px; padding: 4px calc(var(--side) + var(--safe-right)) 10px calc(var(--side) + var(--safe-left));
    box-shadow: 0 2px 0 var(--c-lip);
  }
  .wallet { cursor: default; font-family: var(--font-num); font-variant-numeric: tabular-nums; margin-right: 4px; }
  .wallet:active { transform: none; }
  .list {
    flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y; -webkit-overflow-scrolling: touch;
    display: flex; flex-direction: column; gap: 10px; padding: 12px calc(var(--side) + var(--safe-right)) 12px calc(var(--side) + var(--safe-left));
  }
  /* (no bar under it, an empty うる: the list keeps clear of the home indicator) */
  .list:last-child { padding-bottom: var(--pad-foot); }
  .pocket { display: flex; flex-direction: column; gap: 10px; }
  .grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 10px; }
  /* a start's seedling (NH's one for all six) wears its crop */
  .tag { position: absolute; right: -6px; bottom: -4px; line-height: 0; }
  .empty { margin: 18px 4px; text-align: center; color: var(--c-ink-soft); font-weight: 700; }
  .bar {
    flex: none; padding: 10px calc(var(--side) + var(--safe-right)) var(--pad-foot) calc(var(--side) + var(--safe-left));
    display: flex; align-items: center; gap: 8px; background: var(--c-cream); box-shadow: 0 -2px 0 var(--c-lip);
  }
  .bar .btn { margin: 0; flex: none; }
  .bar .btn.paper[aria-pressed='true'] { --fill: var(--c-yuzu); }
  .sum { flex: 1 1 auto; min-width: 0; margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  @media (prefers-reduced-motion: reduce) { .menu { animation: none; } }
</style>
