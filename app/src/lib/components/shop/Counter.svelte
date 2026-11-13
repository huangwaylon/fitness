<script lang="ts">
  // タヌキ商店's counter (docs/design.md "The shop"): its two lists, a sheet over the room (ShopRoom.svelte), its head and
  // tabs pinned, the list scrolling under them, the bar at the foot. うる: my pocket (everything I caught, found or picked
  // up less what I sold: model/shop.ts) in rows by its sections (shop/pocket.ts), a row's tap its whole stack, − / + one,
  // a section's 全部 all of it (shop/sell.ts); the starts 苗 apart, with no 全部 (they're held to plant); the button says
  // what the sale comes to. A row counts picked/held (「2/5」).
  // かう: the day's stock (shop/stock.ts: it changes daily), a piece past my かいがら dimmed with how many short, and the
  // fields' starts in rows as うる's: first when my free plots want them (stock.ts startsFirst), else after the stock with
  // a 苗へ chip in its header to jump there (the order as the tab opened); the button says what it costs. Section headers stick while their rows scroll. A sell or a buy shows at once with 取り消す
  // (store/actions.ts undoBanner). The title bar is the kit's (タヌキ商店, my かいがら, ✕); the twins don't talk in here (their balloon is the room's). A piece picked is the room's too
  // (its card's: `pick`, `why`, `buy`).
  import { untrack } from 'svelte';
  import NavBar from '../ui/NavBar.svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import PieceTile from './PieceTile.svelte';
  import { iconUrl } from '../tent/items.ts';
  import { bare } from '../kiroku/zukan.ts';
  import { SECTIONS, pocketItem } from './pocket.ts';
  import { allPicked, step, toggleSection, toggleStack, type Picks } from './sell.ts';
  import { sellPrice } from '#lib/contract/shop.ts';
  import { buyPrice } from '#lib/contract/stock.ts';
  import { MAX_STARTS, holdDelay, shortBy, startsFill, startsFirst } from './stock.ts';
  import { fillPlan } from '../farm/sheet.ts';
  import { site } from '../island/site.svelte.ts';
  import { layoutPlots } from '#lib/layout/field.ts';
  import { layout as layoutStore } from '#lib/store/layout.svelte.ts';
  import { farmOfState } from '#lib/model/farm.ts';
  import type { ShopView } from '#lib/model/shop.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { sell, undoBanner } from '#lib/store/actions.ts';
  import { buyStarts } from '#lib/store/farm.svelte.ts';
  import { CROPS, FARM, isFarmCrop, startKey, type Crop } from '#lib/contract/farm.ts';
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
    const r = sell(new Map(picked));
    if (!r.ok) return void cue('boop');
    cue('buy');
    undoBanner(t('shop.sold', { v: formatNum(r.shells ?? 0) }), r);
    picks = {};
  }

  // ---- かう
  /** What's left of today's stock for me (the pieces I don't have). */
  const left = $derived(stock.filter((c) => !shop.owned.includes(c)).length);
  const pickPrice = $derived(pick ? (buyPrice(pick) ?? 0) : 0);
  function pickPiece(code: string) {
    starts = {};
    pick = pick === code ? null : code;
    cue('tick');
  }
  // ---- かう's 苗 (docs/farming.md): the six starts, always in stock, in rows: a row's tap a field of that crop (my free
  // plots less its starts I hold; again: none; stock.ts startsFill), − / + one (+ held down repeats: holdDelay), up to
  // MAX_STARTS; 買う buys them at once, all or none (one group: store/farm.svelte.ts buyStarts)
  let starts = $state<Partial<Record<Crop, number>>>({});
  const startsN = $derived(CROPS.reduce((a, c) => a + (starts[c] ?? 0), 0));
  const startsV = $derived(startsN * FARM.startBuy);
  /** The one crop picked (null: none, or more than one). */
  const startsOne = $derived.by(() => {
    const cs = CROPS.filter((c) => starts[c]);
    return cs.length === 1 ? cs[0] : null;
  });
  /** My plots a start could go in now (empty, under the field's cap: farm/sheet.ts fillPlan), and the starts I hold. */
  const free = $derived.by(() => {
    const m = week.model;
    return m ? fillPlan(layoutPlots(site.layout ?? layoutStore.current), farmOfState(m.state), m.me, FARM.cap).length : 0;
  });
  const heldOf = (c: Crop) => shop.pocket.get(startKey(c)) ?? 0;
  const held = $derived(CROPS.reduce((a, c) => a + heldOf(c), 0));
  /** 苗 first, as the tab opened: a buy (or its 取り消す) never moves the list under the finger. */
  const first = $derived((void tab, untrack(() => startsFirst(free, held))));
  let startsHead = $state<HTMLElement>();
  /** The 苗 chip: the list to the starts (a tap's own scroll, the list's only). */
  function toStarts() {
    startsHead?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    cue('tick');
  }
  // (the starts and a piece are one bar's: picking one lets go of the other)
  function setStart(c: Crop, n: number) {
    pick = null;
    starts = { ...starts, [c]: n };
    cue('tick');
  }
  function fillStart(c: Crop) {
    const f = startsFill(free, heldOf(c));
    setStart(c, (starts[c] ?? 0) >= f ? 0 : f);
  }
  function stepStart(c: Crop, by: 1 | -1) {
    const n = (starts[c] ?? 0) + by;
    if (n < 0 || n > MAX_STARTS) return void cue('boop');
    setStart(c, n);
  }
  // + held down (a start's): after holdDelay(0) one more each holdDelay(k), quicker, never past MAX_STARTS; the finger
  // lifted, gone off it, moved (a scroll's start) or taken by the list's scroll (pointercancel) stops it, and the click
  // after a repeat adds none
  let holdT: ReturnType<typeof setTimeout> | undefined;
  let holdFrom: { x: number; y: number; id: number } | null = null, repeated = false;
  function holdStart(e: PointerEvent, c: Crop) {
    holdStop();
    repeated = false;
    if (e.button !== 0 || (starts[c] ?? 0) >= MAX_STARTS) return;
    holdFrom = { x: e.clientX, y: e.clientY, id: e.pointerId };
    let k = 0;
    const next = () => {
      if ((starts[c] ?? 0) >= MAX_STARTS) return holdStop();
      repeated = true;
      setStart(c, (starts[c] ?? 0) + 1);
      holdT = setTimeout(next, holdDelay(++k));
    };
    holdT = setTimeout(next, holdDelay(0));
  }
  function holdMove(e: PointerEvent) {
    if (holdFrom && e.pointerId === holdFrom.id && Math.hypot(e.clientX - holdFrom.x, e.clientY - holdFrom.y) > 10) holdStop();
  }
  function holdStop() {
    clearTimeout(holdT);
    holdT = undefined;
    holdFrom = null;
  }
  $effect(() => holdStop);
  /** +'s click: one more, none after a hold's repeats. */
  function more(r: StepRow) {
    if (r.hold && repeated) return void (repeated = false);
    if (r.c < r.max) r.step(1);
    else cue('boop');
  }

  function buyStartsPicked() {
    if (!startsN) return void cue('boop');
    if (startsV > shop.shells) return void cue('boop');
    const r = buyStarts(starts);
    if (!r.ok) return void cue('boop');
    cue('buy');
    const n = String(startsN);
    undoBanner(startsOne ? t('shop.boughtStart', { name: startName(startsOne), n }) : t('shop.boughtStarts', { n }), r);
    starts = {};
  }
  function buyPicked() {
    if (startsN) return buyStartsPicked();
    buy();
  }

  /** A row of うる or 苗 (the stepRow snippet). */
  interface StepRow {
    key: string;
    /** Its body's data attributes (the tests' handles). */
    data: Record<string, string | number>;
    name: string;
    art: string;
    /** A small icon on the art's corner (a start's crop). */
    tag?: string;
    unit: number;
    /** How many I have (うる's): the count reads picked/have. */
    have?: number;
    c: number;
    max: number;
    full: boolean;
    label: string;
    body: () => void;
    step: (by: 1 | -1) => void;
    /** + held down repeats (苗's). */
    hold?: (e: PointerEvent) => void;
  }

  function switchTab(id: Tab) {
    tab = id;
    picks = {};
    starts = {};
    pick = null;
  }
</script>

<section class="menu sheet-copy obj-cream" data-shop-panel={tab}>
  <!-- the title bar (タヌキ商店, my かいがら, ✕) and the tabs stay put; the list scrolls under them, the bar at the foot -->
  <header class="pin">
    <NavBar title={t('shop.title')} lead={wallet} {trailing} />
    <Segmented items={[{ id: 'sell', label: t('shop.tab.sell') }, { id: 'buy', label: t('shop.tab.buy') }]} value={tab} label={t('shop.title')} attr="shop-tab" onpick={switchTab} />
  </header>

  {#if tab === 'sell'}
    <div class="list" data-shop-list>
      {#if pocket.length}
        <div class="pocket" data-shop-pocket>
          {#each sections as { s, rows } (s)}
            <div class="group">
            <div class="sec" data-shop-sec={s}>
              <h2 class="sec-label">{t(`shop.sec.${s}`)}</h2>
              {#if s !== 'start'}
                <button type="button" class="chip s" data-shop-sec-all={s} data-sfx="self" aria-pressed={allPicked(picks, rows)}
                  aria-label={t('shop.secAll', { sec: t(`shop.sec.${s}`) })} onclick={() => pickAs(toggleSection(picks, rows))}>{t('shop.all')}</button>
              {/if}
            </div>
            <ul class="rows">
              {#each rows as row (row.k)}
                {@const c = picks[row.k] ?? 0}
                {@const name = speciesName(row.k)}
                {@render stepRow({ key: row.k, data: { 'data-shop-catch': row.k, 'data-n': row.n }, name, art: row.it.art, unit: row.p, have: row.n, c, max: row.n,
                  full: c >= row.n, label: t('shop.catchLabel', { name, n: String(row.n), v: String(row.p), c: String(c) }),
                  body: () => pickAs(toggleStack(picks, row)), step: (by) => pickAs(step(picks, row, by)) })}
              {/each}
            </ul>
            </div>
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
    <div class="list" data-shop-list data-shop-starts-first={first}>
      {#if first}{@render startsSec()}{/if}
      <div class="group">
        <div class="sec">
          <h2 class="sec-label">{t('shop.today')}</h2>
          {#if stock.length}<span class="note" data-shop-left={left}>{t('shop.todayNote', { n: String(left) })}</span>{/if}
          {#if !first}<button type="button" class="chip s" data-shop-to-starts data-sfx="self" onclick={toStarts}>{t('shop.toStarts')}</button>{/if}
        </div>
        {#if stock.length}
          <ul class="grid" data-shop-stock>
            {#each stock as code (code)}
              {@const owned = shop.owned.includes(code)}
              {@const price = buyPrice(code) ?? 0}
              <PieceTile name={itemName(code)} {price} on={pick === code} {owned} short={owned ? 0 : shortBy(price, shop.shells)} data-shop-item={code} data-price={buyPrice(code)}
                data-owned={owned} aria-pressed={pick === code} aria-label={t(owned ? 'shop.itemOwned' : 'shop.itemLabel', { name: itemName(code), v: formatNum(price) })}
                onclick={() => pickPiece(code)}>
                {#snippet icon()}<img src={iconUrl(code)} alt="" width="46" height="46" loading="lazy" decoding="async" />{/snippet}
              </PieceTile>
            {/each}
          </ul>
        {:else if week.model}
          <p class="empty" data-shop-sold-out>{t('shop.soldOut')}</p>
        {/if}
      </div>
      {#if !first}{@render startsSec()}{/if}
    </div>
    <div class="bar">
      <!-- what's picked, or how many かいがら short (its price is the button's) -->
      <p class="sum" data-shop-pick={pick ?? ''} data-shop-starts-offer={startsN ? startsV : null}>
        {startsN && startsV > shop.shells ? t('shop.short', { n: formatNum(shortBy(startsV, shop.shells)) })
          : startsN ? (startsOne ? t('shop.startsOne', { name: startName(startsOne), n: String(startsN) }) : t('shop.startsMany', { n: String(startsN) }))
          : pick && why === 'wallet' ? t('shop.short', { n: formatNum(shortBy(pickPrice, shop.shells)) })
          : pick ? itemName(pick)
          : t('shop.buyHint')}
      </p>
      <button type="button" class="btn small" data-shop-buy data-sfx="self" aria-disabled={startsN ? startsV > shop.shells : !pick || !!why}
        onclick={buyPicked}>{startsN ? t('shop.buyFor', { v: formatNum(startsV) }) : pick && why !== 'owned' ? t('shop.buyFor', { v: formatNum(pickPrice) }) : t('shop.buy')}</button>
    </div>
  {/if}
</section>

<!-- the starts for the fields (docs/farming.md): always in stock, in rows as うる's, bought by the bar's 買う -->
{#snippet startsSec()}
  <div class="group">
    <div class="sec" bind:this={startsHead}>
      <h2 class="sec-label">{t('shop.starts')}</h2>
      {#if free}<span class="note" data-shop-free={free}>{t('shop.startsFree', { n: String(free) })}</span>{/if}
    </div>
    <ul class="rows" data-shop-starts>
      {#each CROPS as c (c)}
        {@const n = starts[c] ?? 0}
        {@const name = startName(c)}
        {@render stepRow({ key: c, data: { 'data-shop-start': c }, name, art: `finds/${c}-start`, tag: `finds/${c}`, unit: FARM.startBuy, c: n, max: MAX_STARTS,
          full: n > 0 && n >= startsFill(free, heldOf(c)), label: t('shop.startLabel', { name, v: String(FARM.startBuy), c: String(n) }),
          body: () => fillStart(c), step: (by) => stepStart(c, by), hold: (e) => holdStart(e, c) })}
      {/each}
    </ul>
  </div>
{/snippet}

<!-- a row of うる (a stack in my pocket: its tap the whole stack) or of 苗 (a start: its tap a field of it), again
     none; − / + one, held inside 0..max (苗's + held down repeats) -->
{#snippet stepRow(r: StepRow)}
  <li class="row" class:on={r.c > 0}>
    <button type="button" class="body" {...r.data} data-picked={r.c} data-sfx="self" aria-pressed={r.full} aria-label={r.label} onclick={r.body}>
      <span class="ic"><OfficialArt key={r.art} size={40} />{#if r.tag}<span class="tag"><OfficialArt key={r.tag} size={18} /></span>{/if}</span>
      <span class="what"><span class="nm">{r.name}</span><span class="unit">{t('shop.unit', { v: formatNum(r.unit) })}</span></span>
    </button>
    <span class="step">
      <button type="button" class="pm" data-shop-less={r.key} data-sfx="self" aria-label={t('shop.less', { name: r.name })} aria-disabled={!r.c}
        onclick={() => (r.c ? r.step(-1) : cue('boop'))}>−</button>
      <b class="c" aria-hidden="true">{r.c}{#if r.have}<small>/{r.have}</small>{/if}</b>
      <button type="button" class="pm" data-shop-more={r.key} data-sfx="self" aria-label={t('shop.more', { name: r.name })} aria-disabled={r.c >= r.max}
        class:hold={!!r.hold} onclick={() => more(r)} onpointerdown={r.hold} onpointermove={r.hold && holdMove}
        onpointerup={r.hold && holdStop} onpointercancel={r.hold && holdStop} onpointerleave={r.hold && holdStop}
        oncontextmenu={r.hold && ((e) => e.preventDefault())}>+</button>
    </span>
  </li>
{/snippet}

<!-- (my かいがら on the left, ✕ alone on the right: the two sides alike, the title centred and clear of both) -->
{#snippet wallet()}<span class="chip s wallet" data-shop-wallet-chip>{t('shop.wallet', { v: formatNum(shop.shells) })}</span>{/snippet}
{#snippet trailing()}<NavButton kind="close" data-shop-close onclick={onclose} />{/snippet}

<style>
  /* the sheet: its head and tabs pinned at the top and the bar at the foot, only the list between them scrolls (its own
     scroller, so iOS Safari's rubber band never drags the head off); fixed cream at every time of day, ink text (a game
     object, as the HUD's) */
  .menu {
    position: absolute; z-index: 4; left: 0; right: 0; bottom: 0; max-height: 80%; display: flex; flex-direction: column;
    background: var(--c-cream); border-radius: var(--r-card) var(--r-card) 0 0; box-shadow: 0 -4px 0 var(--c-lip); overflow: hidden;
    /* (.obj-cream: the panel's own controls keep the day's look, fixed cream and ink, at every time of day) */
    --focus: var(--c-ink);
    animation: sheet-in .2s ease-out;
  }
  @keyframes sheet-in { from { translate: 0 24px; opacity: 0; } }
  .pin {
    flex: none; position: relative; z-index: 3; display: grid; gap: 6px; padding: 4px calc(var(--side) + var(--safe-right)) 10px calc(var(--side) + var(--safe-left));
    box-shadow: 0 2px 0 var(--c-lip);
  }
  .wallet { cursor: default; font-variant-numeric: tabular-nums; margin-left: 6px; }
  .wallet:active { transform: none; }
  .list {
    flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y; -webkit-overflow-scrolling: touch;
    display: flex; flex-direction: column; gap: 10px; padding: 12px calc(var(--side) + var(--safe-right)) 12px calc(var(--side) + var(--safe-left));
  }
  /* (no bar under it, an empty うる: the list keeps clear of the home indicator) */
  .list:last-child { padding-bottom: var(--pad-foot); }
  .pocket { display: flex; flex-direction: column; gap: 10px; }
  /* a section's header, 32 high (the 全部 / 苗へ chip's hit 44: .chip.s), stuck at the list's top while its rows pass */
  .sec {
    position: sticky; top: -12px; z-index: 2; display: flex; align-items: center; gap: 8px; min-height: 32px;
    margin: 0 -4px; padding: 2px 4px 8px; background: var(--c-cream);
  }
  .sec .sec-label { margin: 0; flex: 1 1 auto; }
  .group { flex: none; }
  .note { font: 600 var(--fs-xs)/1.2 var(--font-ui); color: var(--c-ink-soft); }
  /* うる's rows: 56 high, an inset stitch between; picked: yuzu */
  .rows { flex: none; list-style: none; margin: 0; padding: 0; border-radius: var(--r-card); background: var(--c-card); border: 2px solid var(--c-edge); overflow: hidden; }
  .row { display: flex; align-items: center; min-height: 56px; padding-right: 6px; }
  .row + .row { box-shadow: inset 0 1.5px 0 var(--c-edge); }
  .row.on { background: var(--c-yuzu); }
  .body {
    appearance: none; border: 0; background: none; color: var(--c-ink); cursor: pointer; flex: 1 1 auto; min-width: 0; align-self: stretch;
    display: flex; align-items: center; gap: 10px; padding: 6px 4px 6px 10px; text-align: left; -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .body:focus-visible, .pm:focus-visible { outline: 3px solid var(--c-ink); outline-offset: -3px; }
  .row .ic { position: relative; flex: none; width: 40px; height: 40px; display: grid; place-items: center; line-height: 0; }
  .what { flex: 1 1 auto; min-width: 0; display: grid; gap: 2px; }
  .nm { font: 700 var(--fs-body)/1.25 var(--font-ui); word-break: keep-all; overflow-wrap: anywhere; }
  .unit { font: 600 var(--fs-xs)/1.2 var(--font-num); color: var(--c-ink-soft); font-variant-numeric: tabular-nums; }
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
  /* (held down: no callout or selection over it on iOS) */
  .pm.hold { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .pm[aria-disabled='true'] { color: var(--c-ink-soft); opacity: .45; }
  .c { min-width: 2.2ch; text-align: center; font: 700 var(--fs-body)/1 var(--font-num); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .c small { font-size: var(--fs-xs); font-weight: 600; color: var(--c-ink-soft); }
  .grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 10px; }
  /* a start's seedling (NH's one for all six) wears its crop */
  .tag { position: absolute; right: -6px; bottom: -4px; line-height: 0; }
  .empty { margin: 18px 4px; text-align: center; color: var(--c-ink-soft); font-weight: 700; }
  .bar {
    flex: none; padding: 10px calc(var(--side) + var(--safe-right)) var(--pad-foot) calc(var(--side) + var(--safe-left));
    display: flex; align-items: center; gap: 8px; background: var(--c-cream); box-shadow: 0 -2px 0 var(--c-lip);
  }
  .bar .btn { margin: 0; flex: none; }
  .sum { flex: 1 1 auto; min-width: 0; margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  @media (prefers-reduced-motion: reduce) { .menu { animation: none; } }
</style>
