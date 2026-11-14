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
  // 全部売る / 全部買う (the user, 2026-11-14): a lead row atop うる and atop 今日の品物, its line what all of it comes to.
  // 全部売る: the pocket whole but the starts and one of today's open おねがい vegetable (sell.ts sellAllOf); 全部買う: the
  // pieces I don't have, all, or the most my かいがら cover, cheapest first (stock.ts buyAllOf). Off (a boop) with nothing
  // to do. Its confirm (a paper Sheet) shows the count, the total, my かいがら after, what's kept, every row; its button
  // does what it showed, as one group (all or none on the record; store/actions.ts sell `group`, stock.ts buyAll), one
  // cue, one banner with 取り消す for the lot. The guest's the same, with its own pocket and かいがら.
  import { untrack } from 'svelte';
  import NavBar from '../ui/NavBar.svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import PieceTile from './PieceTile.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import { iconUrl } from '../tent/items.ts';
  import { bare } from '#lib/world/critters.ts';
  import { SECTIONS, pocketItem } from './pocket.ts';
  import { allPicked, sellAllOf, step, toggleSection, toggleStack, type Picks, type SellAll } from './sell.ts';
  import { sellPrice } from '#lib/contract/shop.ts';
  import { buyPrice } from '#lib/contract/stock.ts';
  import { MAX_STARTS, buyAll, buyAllOf, holdDelay, shortBy, startsFill, startsFirst, type BuyAll } from './stock.ts';
  import Sheet from '../ui/Sheet.svelte';
  import { askNow } from '../island/vegAsk.svelte.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { fillPlan, orphans } from '#lib/world/farmPlan.ts';
  import { islandDay } from '../island/ambientClock.ts';
  import { site } from '../island/site.svelte.ts';
  import { layoutPlots } from '#lib/layout/field.ts';
  import { layout as layoutStore } from '#lib/store/layout.svelte.ts';
  import { farmOfState } from '#lib/model/farm.ts';
  import type { ShopView } from '#lib/model/shop.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { sell, undoBanner } from '#lib/store/actions.ts';
  import { buyStarts, digMany } from '#lib/store/farm.svelte.ts';
  import { CROPS, FARM, cropKey, isFarmCrop, startKey, type Crop } from '#lib/contract/farm.ts';
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
  /** My plots a start could go in now (empty, under the field's cap: world/farmPlan.ts fillPlan), and the starts I hold. */
  const free = $derived.by(() => {
    const m = week.model;
    return m ? fillPlan(layoutPlots(site.layout ?? layoutStore.current), farmOfState(m.state), m.me, FARM.cap).length : 0;
  });
  const heldOf = (c: Crop) => shop.pocket.get(startKey(c)) ?? 0;
  /** My plants on plots no field covers now (a field moved or shrunk in /editor: world/farmPlan.ts orphans): kept,
   *  not drawn, counted toward the cap; 苗に戻す digs them all up, their starts back (never on its own: both phones
   *  would race). */
  const off = $derived.by(() => {
    const m = week.model;
    return m ? orphans(farmOfState(m.state), m.me, layoutPlots(site.layout ?? layoutStore.current)) : [];
  });
  function backToStarts() {
    if (off.length) undoBanner(t('farm.dugBack', { n: String(off.length) }), digMany(week.view?.today ?? islandDay(), off));
  }
  const held = $derived(CROPS.reduce((a, c) => a + heldOf(c), 0));
  /** 苗 first, as the tab opened: a buy (or its 取り消す) never moves the list under the finger. */
  const first = $derived((void tab, untrack(() => startsFirst(free, held))));
  let startsHead = $state<HTMLElement>();
  /** The 苗 chip: the list to the starts (a tap's own scroll, the list's only). */
  function toStarts() {
    startsHead?.scrollIntoView({ block: 'start', behavior: 'smooth' });
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

  // ---- 全部売る / 全部買う (sell.ts sellAllOf, stock.ts buyAllOf): a lead row's button opens a confirm (the count, the
  // total, my かいがら after, what's kept or left out, the list); its button does what it showed, never more (the
  // pocket or the wallet changed meanwhile: a boop, nothing sent), as one group, one cue, one banner, one 取り消す
  /** Today's open おねがい's vegetable (island/vegAsk.svelte.ts): 全部売る keeps one. */
  const askKey = $derived.by(() => {
    const a = askNow(minuteNow());
    return a && !a.done ? cropKey(a.crop) : null;
  });
  const sellPlan = $derived(sellAllOf(shop.pocket, sellPrice, askKey));
  const buyPlan = $derived(buyAllOf(stock, shop.owned, shop.shells));
  /** The confirm up, and the plan it shows (as it opened). */
  let confirm = $state<{ tab: 'sell'; plan: SellAll } | { tab: 'buy'; plan: BuyAll } | null>(null);
  let confirmOpen = $state(false);
  function askAll(which: Tab) {
    if (which === 'sell' ? !sellPlan.n : !buyPlan.items.length) return void cue('boop');
    confirm = which === 'sell' ? { tab: 'sell', plan: sellPlan } : { tab: 'buy', plan: buyPlan };
    confirmOpen = true;
  }
  function doAll() {
    const c = confirm;
    confirmOpen = false;
    if (!c) return;
    if (c.tab === 'sell') {
      const r = sell(c.plan.picks, { group: true });
      if (!r.ok) return void cue('boop');
      cue('buy');
      undoBanner(t('shop.soldAll', { n: formatNum(c.plan.n), v: formatNum(c.plan.v) }), r);
      picks = {};
    } else {
      const r = buyAll(c.plan.items, stock);
      if (!r.ok) return void cue('boop');
      cue('buy');
      undoBanner(t('shop.boughtAll', { n: formatNum(c.plan.items.length), v: formatNum(c.plan.total) }), r);
      pick = null;
    }
  }
  /** The lead row's line: what 全部 comes to, or why there's none. */
  const sellAllLine = $derived(sellPlan.n ? t('shop.sellAllSum', { n: formatNum(sellPlan.n), v: formatNum(sellPlan.v) }) : t('shop.sellAllNone'));
  const buyAllLine = $derived(!buyPlan.of ? t('shop.buyAllNone')
    : buyPlan.short ? t('shop.short', { n: formatNum(buyPlan.short) })
    : t(buyPlan.items.length < buyPlan.of ? 'shop.buyAllPart' : 'shop.buyAllSum', { n: formatNum(buyPlan.items.length), v: formatNum(buyPlan.total) }));

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
      {@render allRow('sell', pocket.length ? sellAllLine : '', !sellPlan.n)}
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
        <p class="empty" data-shop-empty><Phrases text={t('shop.emptyPocket')} /></p>
      {/if}
    </div>
    {#if pocket.length}
      <div class="bar">
        <p class="sum" data-shop-offer={pickedV}><Phrases text={pickedN ? t('shop.pickedN', { n: formatNum(pickedN) }) : t('shop.pickHint')} /></p>
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
        {@render allRow('buy', stock.length ? buyAllLine : '', !buyPlan.items.length)}
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
          <p class="empty" data-shop-sold-out><Phrases text={t('shop.soldOut')} /></p>
        {/if}
      </div>
      {#if !first}{@render startsSec()}{/if}
    </div>
    <div class="bar">
      <!-- what's picked, or how many かいがら short (its price is the button's) -->
      <p class="sum" data-shop-pick={pick ?? ''} data-shop-starts-offer={startsN ? startsV : null}><Phrases text={startsN && startsV > shop.shells ? t('shop.short', { n: formatNum(shortBy(startsV, shop.shells)) })
          : startsN ? (startsOne ? t('shop.startsOne', { name: startName(startsOne), n: String(startsN) }) : t('shop.startsMany', { n: String(startsN) }))
          : pick && why === 'wallet' ? t('shop.short', { n: formatNum(shortBy(pickPrice, shop.shells)) })
          : pick ? itemName(pick)
          : t('shop.buyHint')} /></p>
      <button type="button" class="btn small" data-shop-buy data-sfx="self" aria-disabled={startsN ? startsV > shop.shells : !pick || !!why}
        onclick={buyPicked}>{startsN ? t('shop.buyFor', { v: formatNum(startsV) }) : pick && why !== 'owned' ? t('shop.buyFor', { v: formatNum(pickPrice) }) : t('shop.buy')}</button>
    </div>
  {/if}
</section>

<!-- 全部売る / 全部買う's lead row: what all of it comes to (or why none), and its button (named by the line too) -->
{#snippet allRow(which: Tab, line: string, off: boolean)}
  <div class="all" data-shop-all-row={which}>
    <p class="all-line" id="shop-all-{which}" data-shop-all-line>{line}</p>
    <button type="button" class="chip all-btn" data-shop-all={which} data-sfx="self" aria-disabled={off} aria-describedby={line ? `shop-all-${which}` : undefined}
      onclick={() => askAll(which)}>{t(which === 'sell' ? 'shop.sellAll' : 'shop.buyAll')}</button>
  </div>
{/snippet}

<!-- the confirm: the count, the total, my かいがら after, what's kept or left out, every row; キャンセル or do it -->
<Sheet bind:open={confirmOpen} title={confirm ? t(confirm.tab === 'sell' ? 'shop.sellAll' : 'shop.buyAll') : ''} name="shop.all">
  {#if confirm}
    <div class="confirm" data-shop-confirm={confirm.tab}>
      {#if confirm.tab === 'sell'}
        {@const p = confirm.plan}
        <p class="lead" data-shop-confirm-lead>{t('shop.sellAllLead', { n: formatNum(p.n), v: formatNum(p.v) })}</p>
        <p class="after" data-shop-confirm-after={shop.shells + p.v}>{t('shop.afterSell', { v: formatNum(shop.shells + p.v) })}</p>
        {#each p.kept as k (k.k)}
          <p class="kept" data-shop-confirm-kept={k.k}>{k.why === 'ask' ? t('shop.keptAsk', { name: speciesName(k.k) }) : t('shop.keptStart', { name: speciesName(k.k), n: String(k.n) })}</p>
        {/each}
        <ul class="clist" data-shop-confirm-list>
          {#each pocket.filter((r) => p.picks.has(r.k)) as r (r.k)}
            {@const n = p.picks.get(r.k) ?? 0}
            <li data-shop-confirm-row={r.k}><span class="cn">{speciesName(r.k)} ×{n}</span><span class="cv">{formatNum(n * r.p)}</span></li>
          {/each}
        </ul>
      {:else}
        {@const p = confirm.plan}
        <p class="lead" data-shop-confirm-lead>{p.items.length < p.of ? t('shop.buyAllLeadPart', { n: formatNum(p.items.length), m: formatNum(p.of), v: formatNum(p.total) })
          : t('shop.buyAllLead', { n: formatNum(p.items.length), v: formatNum(p.total) })}</p>
        <p class="after" data-shop-confirm-after={shop.shells - p.total}>{t('shop.afterBuy', { v: formatNum(shop.shells - p.total) })}</p>
        <ul class="clist" data-shop-confirm-list>
          {#each p.items as c (c)}
            <li data-shop-confirm-row={c}><span class="cn">{itemName(c)}</span><span class="cv">{formatNum(buyPrice(c) ?? 0)}</span></li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
  {#snippet footer()}
    <div class="two">
      <button type="button" class="btn paper" data-shop-confirm-cancel data-sfx="back" onclick={() => (confirmOpen = false)}>{t('common.cancel')}</button>
      <!-- (its total is the lead's line, right above: 「1,946かいがらで売る」 wrapped in half the width) -->
      <button type="button" class="btn" data-shop-confirm-go data-sfx="self" onclick={doAll}>{t(confirm?.tab === 'sell' ? 'shop.sell' : 'shop.buy')}</button>
    </div>
  {/snippet}
</Sheet>

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
    <p class="note rule" data-shop-farm-rule><Phrases text={t('shop.startsRule')} /></p>
    {#if off.length}
      <!-- my plants a moved field left behind (docs/farming.md "Playing"): back to starts, with 取り消す -->
      <div class="off" data-shop-orphans={off.length}>
        <span>{t('farm.orphans', { n: String(off.length) })}</span>
        <button type="button" class="chip s" data-shop-orphans-dig data-sfx="tick" onclick={backToStarts}>{t('farm.orphansDig')}</button>
      </div>
    {/if}
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
  /* the sheet: one height on both tabs and after a sale (no jump), its head and tabs pinned at the top and the bar at the foot, only the list between them scrolls (its own
     scroller, so iOS Safari's rubber band never drags the head off); fixed cream at every time of day, ink text (a game
     object, as the HUD's) */
  .menu {
    position: absolute; z-index: 4; left: 0; right: 0; bottom: 0; height: 80%; display: flex; flex-direction: column;
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
    flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y;
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
  .rule { margin: 8px 4px 0; line-height: 1.4; }
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
  .off { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 8px 4px 0; font: 700 var(--fs-s)/1.4 var(--font-ui); }
  .empty { margin: 18px 4px; text-align: center; color: var(--c-ink-soft); font-weight: 700; }
  .bar {
    flex: none; padding: 10px calc(var(--side) + var(--safe-right)) var(--pad-foot) calc(var(--side) + var(--safe-left));
    display: flex; align-items: center; gap: 8px; background: var(--c-cream); box-shadow: 0 -2px 0 var(--c-lip);
  }
  .bar .btn { margin: 0; flex: none; }
  .sum { flex: 1 1 auto; min-width: 0; margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  /* 全部売る / 全部買う's lead row: its line and its chip, a card's stitch under it */
  .all { flex: none; display: flex; align-items: center; gap: 8px; min-height: var(--hit); }
  .group > .all { margin-bottom: 8px; }
  .all-line { flex: 1 1 auto; min-width: 0; margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--c-ink-soft); font-variant-numeric: tabular-nums; }
  .all-btn { flex: none; }
  .all-btn[aria-disabled='true'] { opacity: .45; }
  /* the confirm: its lines, then the rows (a name, its かいがら), the two buttons at the foot */
  .confirm { display: grid; gap: 6px; padding: 0 4px 4px; }
  .confirm p { margin: 0; }
  .lead { font: 700 var(--fs-talk)/1.4 var(--font-ui); }
  .after, .kept { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .clist { list-style: none; margin: 6px 0 0; padding: 0; display: grid; }
  .clist li { display: flex; justify-content: space-between; gap: 12px; padding: 7px 2px; font-size: var(--fs-body); }
  .clist li + li { box-shadow: inset 0 1px 0 var(--edge); }
  .cn { min-width: 0; overflow-wrap: anywhere; }
  .cv { flex: none; font: 700 var(--fs-body)/1.3 var(--font-num); font-variant-numeric: tabular-nums; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .two .btn { margin: 0; }
</style>
