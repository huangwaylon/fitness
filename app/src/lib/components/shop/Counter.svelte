<script lang="ts">
  // タヌキ商店's counter (docs/design.md "The shop"): its two lists, a sheet over the room (ShopRoom.svelte), its head and
  // tabs pinned, the list scrolling under them, the bar at the foot. うる: my pocket (everything I caught, found or picked
  // up less what I sold: model/shop.ts) in rows by its sections (shop/pocket.ts), a row's tap its whole stack, − / + one,
  // a section's 全部 all of it (shop/sell.ts); the starts 苗 apart, with no 全部 (they're held to plant); the button says
  // what the sale comes to.
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
  import { allPicked, step, toggleSection, toggleStack, type Picks, type Stack } from './sell.ts';
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
  let picks = $state<Picks>({});
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
  const pickAs = (next: Picks) => {
    picks = next;
    cue('tick');
  };
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
            <div class="sec" data-shop-sec={s}>
              <h2 class="sec-label">{t(`shop.sec.${s}`)}</h2>
              {#if s !== 'start'}
                <button type="button" class="chip s" data-shop-sec-all={s} data-sfx="self" aria-pressed={allPicked(picks, rows)}
                  aria-label={t('shop.secAll', { sec: t(`shop.sec.${s}`) })} onclick={() => pickAs(toggleSection(picks, rows))}>{t('shop.all')}</button>
              {/if}
            </div>
            <ul class="rows">
              {#each rows as row (row.k)}{@render stack(row)}{/each}
            </ul>
          {/each}
        </div>
      {:else}
        <p class="empty" data-shop-empty>{t('shop.emptyPocket')}</p>
      {/if}
    </div>
    {#if pocket.length}
      <div class="bar">
        <p class="sum" data-shop-offer={pickedV}>{pickedN ? t('shop.pickedN', { n: formatNum(pickedN) }) : t('shop.pickHint')}</p>
        <button type="button" class="btn small" data-shop-sell data-sfx="self" aria-disabled={!pickedN} onclick={sellPicked}>
          {pickedN ? t('shop.sellFor', { v: formatNum(pickedV) }) : t('shop.sell')}</button>
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

<!-- a stack in my pocket: its row's tap the whole stack (again: none), − / + one at a time, held inside it -->
{#snippet stack(row: Stack & { p: number; it: { art: string } })}
  {@const c = picks[row.k] ?? 0}
  {@const name = speciesName(row.k)}
  <li class="row" class:on={c > 0}>
    <button type="button" class="body" data-shop-catch={row.k} data-n={row.n} data-picked={c} data-sfx="self" aria-pressed={c >= row.n}
      aria-label={t('shop.catchLabel', { name, n: String(row.n), v: String(row.p), c: String(c) })} onclick={() => pickAs(toggleStack(picks, row))}>
      <span class="ic"><OfficialArt key={row.it.art} size={40} /></span>
      <span class="what"><span class="nm">{name}</span><span class="unit">{t('shop.unit', { v: formatNum(row.p) })}</span></span>
      <span class="have">×{row.n}</span>
    </button>
    <span class="step">
      <button type="button" class="pm" data-shop-less={row.k} data-sfx="self" aria-label={t('shop.less', { name })} aria-disabled={!c}
        onclick={() => (c ? pickAs(step(picks, row, -1)) : cue('boop'))}>−</button>
      <b class="c" aria-hidden="true">{c}</b>
      <button type="button" class="pm" data-shop-more={row.k} data-sfx="self" aria-label={t('shop.more', { name })} aria-disabled={c >= row.n}
        onclick={() => (c < row.n ? pickAs(step(picks, row, 1)) : cue('boop'))}>+</button>
    </span>
  </li>
{/snippet}

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
  .pocket { display: flex; flex-direction: column; gap: 6px; }
  .sec { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: var(--hit); }
  .sec .sec-label { margin: 0; }
  /* うる's rows: 56 high, an inset stitch between; picked: yuzu */
  .rows { list-style: none; margin: 0 0 6px; padding: 0; border-radius: var(--r-card); background: var(--c-card); border: 2px solid var(--c-edge); overflow: hidden; }
  .row { display: flex; align-items: center; min-height: 56px; padding-right: 6px; }
  .row + .row { box-shadow: inset 0 1.5px 0 var(--c-edge); }
  .row.on { background: var(--c-yuzu); }
  .body {
    appearance: none; border: 0; background: none; color: var(--c-ink); cursor: pointer; flex: 1 1 auto; min-width: 0; align-self: stretch;
    display: flex; align-items: center; gap: 10px; padding: 6px 4px 6px 10px; text-align: left; -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .body:focus-visible, .pm:focus-visible { outline: 3px solid var(--c-ink); outline-offset: -3px; }
  .row .ic { flex: none; width: 40px; height: 40px; display: grid; place-items: center; line-height: 0; }
  .what { flex: 1 1 auto; min-width: 0; display: grid; gap: 2px; }
  .nm { font: 700 var(--fs-body)/1.25 var(--font-ui); word-break: keep-all; overflow-wrap: anywhere; }
  .unit { font: 600 var(--fs-xs)/1.2 var(--font-num); color: var(--c-ink-soft); font-variant-numeric: tabular-nums; }
  .have { flex: none; font: 700 var(--fs-s)/1 var(--font-num); color: var(--c-ink-soft); font-variant-numeric: tabular-nums; }
  .step { flex: none; display: flex; align-items: center; }
  .pm {
    appearance: none; border: 0; background: none; cursor: pointer; width: var(--hit); height: var(--hit); display: grid; place-items: center;
    color: var(--c-ink); font: 700 var(--fs-talk)/1 var(--font-ui); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .pm::before {
    content: ''; position: absolute; width: 32px; height: 32px; border-radius: 50%; background: var(--c-cream);
    box-shadow: inset 0 0 0 2px var(--c-edge); z-index: -1;
  }
  .pm { position: relative; isolation: isolate; }
  .pm[aria-disabled='true'] { color: var(--c-ink-soft); opacity: .45; }
  .c { min-width: 2.2ch; text-align: center; font: 700 var(--fs-body)/1 var(--font-num); font-variant-numeric: tabular-nums; }
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
