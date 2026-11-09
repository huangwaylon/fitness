<script lang="ts">
  // タヌキ商店: the shop's inside (docs/design.md "The shop"), behind its door on the island. NH's Nook's Cranny as a
  // screen, not a room: the twins behind their counter (NH's render, host/timmy-tommy) under the shop's sign, and NH's
  // counter menu under them, うる (sell: my pocket, everything I caught, found or picked up, from my day tallies less what
  // I sold: model/shop.ts; by its sections, shop/pocket.ts) and
  // かう (buy: the day's stock, the same on every phone, never a piece the island had by the day's start: shop/stock.ts). Prices and my かいがら in NH's shell
  // (the cowrie). A sell or a buy shows at once with もとに戻す (store/actions.ts sell, stock.ts buyPiece); a bought piece joins
  // my もようがえ; an empty pocket opens it on かう (no うる bar). The guest's pocket and かいがら are its own. Never ベル.
  // ‹ 島へ goes back out, just out of its door.
  // While I'm in here the others' islands show my villager nowhere, as in the museum and the rooms (the rooms' `tent`
  // presence with `sc: 's'`: store/where.svelte.ts); out of the door they see it there.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount, untrack } from 'svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { iconUrl } from '../tent/items.ts';
  import { bare } from '../kiroku/zukan.ts';
  import { SECTIONS, pocketItem } from './pocket.ts';
  import { findArt } from '../island/beach.ts';
  import type { WeekView } from '#lib/types.ts';
  import { sellPrice } from '#lib/contract/shop.ts';
  import { buyPrice } from '#lib/contract/stock.ts';
  import { buyPiece, buyRefusal, stockAt } from './stock.ts';
  import { shopView } from '#lib/model/shop.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { sell, undoBanner } from '#lib/store/actions.ts';
  import { layout as islandLayout } from '#lib/store/layout.svelte.ts';
  import { leaveBy } from '../island/doorOut.ts';
  import { hook } from '../island/devHooks.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { where } from '#lib/store/where.svelte.ts';
  import { LIVE_URL, createLive, liveRelay, type Live } from '#lib/sync/live.ts';
  import { createLocalLive } from '#lib/sync/live-local.ts';
  import type { Who } from '#lib/types.ts';
  import { theme } from '#lib/ui-state/theme.svelte.ts';
  import { doorReady } from '#lib/ui-state/doorTransition.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { setPlace } from '#lib/sound/sound.svelte.ts';
  import { formatNum, i18n, t } from '#lib/i18n/index.ts';
  import '#lib/i18n/catch.ts';
  import { loadTentNames } from '#lib/i18n/tent.ts';

  let { view }: { view: WeekView } = $props();

  type Tab = 'sell' | 'buy';
  let tab = $state<Tab>('sell');
  /** うる: how many of each species picked (`kind:id` → n). */
  let picks = $state<Record<string, number>>({});
  /** かう: the piece picked. */
  let pick = $state<string | null>(null);
  /** The twins' line (a key of `shop.say.*` and its params). */
  let say = $state<{ k: string; p?: Record<string, string> }>({ k: 'hello' });

  const me = $derived(week.model?.me ?? view.viewer);
  const shop = $derived(week.model ? shopView(week.model.state, me) : { pocket: new Map<string, number>(), shells: 0, owned: [] as readonly string[] });
  // (as of the day's start: a find or a buy today leaves it as it was)
  const stock = $derived(week.model ? stockAt(week.model.state, week.model.now) : []);
  const night = $derived(theme.tod === 'night' || theme.tod === 'dusk');

  // ---- my presence (the phone's one socket; the demo's two tabs share a channel; ?relay=&key= a test relay) ----
  const demo = !!week.demo;
  const testRelay = (): Live | null => {
    const url = hook('relay'), key = hook('key');
    return url && /^wss?:\/\//.test(url) && key ? createLive({ url, key: () => key }) : null;
  };
  // svelte-ignore state_referenced_locally
  const own = demo ? (testRelay() ?? createLocalLive(view.viewer)) : null;
  const relay: Live | null = demo ? own : LIVE_URL ? liveRelay() : null;
  const inside = (on: boolean) => relay?.send({ kind: 'tent', in: on, sc: 's' });

  /** A tally key's name and icon (the pocket's table: the ずかん's names, the official icon). */
  const speciesName = (k: string) => bare(t(pocketItem(k)?.name ?? k));
  /** The pieces' names (NH's, i18n/tent.ts: loaded with the screen, the language on screen). */
  let names = $state(0);
  $effect(() => void loadTentNames(i18n.locale).then(() => names++, () => {}));
  const itemName = (code: string) => (void names, t(`tent.item.${code}`));

  // ---- うる
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
    say = pickedN ? { k: 'offer', p: { v: formatNum(pickedV) } } : { k: 'hello' };
  }
  function less(k: string) {
    picks = { ...picks, [k]: Math.max(0, (picks[k] ?? 0) - 1) };
    say = pickedN ? { k: 'offer', p: { v: formatNum(pickedV) } } : { k: 'hello' };
  }
  function all() {
    picks = Object.fromEntries(pocket.map(({ k, n }) => [k, n]));
    say = { k: 'offer', p: { v: formatNum(pickedV) } };
  }
  function sellPicked() {
    if (!pickedN) return void cue('boop');
    const r = sell(new Map(picked));
    if (!r.ok) {
      say = { k: 'cant' };
      return void cue('boop');
    }
    cue('buy');
    const one = picked.length === 1 ? picked[0] : null;
    undoBanner(one ? t('shop.sold', { name: speciesName(one[0]), n: String(one[1]), v: formatNum(r.shells ?? 0) }) : t('shop.soldMany', { n: String(pickedN), v: formatNum(r.shells ?? 0) }), r);
    picks = {};
    say = { k: 'thanks' };
  }

  // ---- かう
  function choose(code: string) {
    pick = pick === code ? null : code;
    cue('tick');
    if (!pick) return void (say = { k: 'hello' });
    const why = buyRefusal(code, stock);
    say = why === 'owned' ? { k: 'owned' } : why === 'wallet' ? { k: 'short', p: { name: itemName(code) } } : { k: 'price', p: { name: itemName(code), v: formatNum(buyPrice(code) ?? 0) } };
  }
  const why = $derived(pick ? (void shop, buyRefusal(pick, stock)) : null);
  function buyPicked() {
    if (!pick || why) {
      if (pick) say = why === 'owned' ? { k: 'owned' } : { k: 'short', p: { name: itemName(pick) } };
      return void cue('boop');
    }
    const r = buyPiece(pick, stock);
    if (!r.ok) return void cue('boop');
    cue('buy');
    undoBanner(t('shop.bought', { name: itemName(pick), v: formatNum(r.price ?? 0) }), r);
    pick = null;
    say = { k: 'thanks' };
  }

  // an empty pocket (once the record is in): the shop opens on かう, nothing to sell (no うる bar either)
  let opened = false;
  $effect(() => {
    if (opened || !week.model) return;
    opened = true;
    if (!shop.pocket.size) untrack(() => ((tab = 'buy'), (say = { k: 'stock' })));
  });

  function switchTab(id: Tab) {
    tab = id;
    picks = {};
    pick = null;
    say = { k: id === 'sell' ? (shop.pocket.size ? 'hello' : 'empty') : 'stock' };
  }

  // ---- out of the door: on the island just out of the shop's door, on every phone (island/doorOut.ts)
  let leaving = false;
  function leave() {
    if (leaving) return;
    leaving = true;
    cue('scene-bench');
    // (out at the door first, then seen: the others' islands show it there, not where it went in)
    leaveBy('shop', me);
    inside(false);
    const q = new URLSearchParams(location.search);
    void goto(resolve('/') + (q.size ? `?${q}` : '')).finally(() => (leaving = false));
  }

  $effect(() => {
    const m = week.model;
    if (m) islandLayout.rows(m.state.layout);
  });
  // NH's タヌキ商店 music while in here (sound/places.ts; no hours or upgrade here, so never its closing or big shop's),
  // the island's again out of the door
  onMount(() => (setPlace('shop'), () => setPlace(null)));
  onMount(() => {
    requestAnimationFrame(() => doorReady());
    shared.attach(relay, me, demo);
    own?.start();
    if (!relay) return;
    inside(true);
    // said again to whoever arrives; what the others say of themselves is kept for the island (one place at a time)
    let hereNow: readonly Who[] = [];
    const offs = [
      relay.onStatus((st) => {
        const was = hereNow, here = st.connected ? st.here : [];
        hereNow = here;
        if (here.some((w) => !was.includes(w))) inside(true);
        for (const w of ['A', 'B', 'G'] as const) if (w !== me) where.presence(w, here.includes(w));
      }),
      relay.on((m) => m.who !== me && m.kind === 'tent' && where.heard(m))
    ];
    return () => {
      inside(false);
      for (const f of offs) f();
      own?.stop();
    };
  });
  // (the line's language follows the app's)
  const line = $derived((void i18n.locale, t(`shop.say.${say.k}`, say.p)));
</script>

<main class="shop" class:night data-shop data-shells={shop.shells}>
  <h1 class="sr-only">{t('shop.title')}</h1>
  <div class="top">
    <NavButton kind="back" text={t('shop.out')} onclick={leave} sfx="self" />
    <p class="wallet" data-shop-wallet aria-label={t('shop.wallet', { v: formatNum(shop.shells) })}>
      <span class="shell" aria-hidden="true"><OfficialArt key={findArt('cowrie')} size={26} eager /></span>
      <b class="num" aria-hidden="true">{formatNum(shop.shells)}</b>
    </p>
  </div>

  <section class="counter" aria-label={t('shop.counter')}>
    <div class="window" aria-hidden="true"></div>
    <div class="sign" aria-hidden="true"><span>{t('shop.sign')}</span></div>
    <div class="twins"><OfficialArt key="host/timmy-tommy" alt={t('shop.twins')} width="100%" eager /></div>
    <p class="say" role="status" aria-live="polite" data-shop-say={say.k}>{line}</p>
    <div class="desk" aria-hidden="true"><span class="register"></span></div>
  </section>

  <section class="menu sheet-copy">
    <Segmented items={[{ id: 'sell', label: t('shop.tab.sell') }, { id: 'buy', label: t('shop.tab.buy') }]} value={tab} label={t('shop.title')} attr="shop-tab" onpick={switchTab} />

    {#if tab === 'sell'}
      {#if pocket.length}
        <div class="pocket" data-shop-pocket>
          {#each sections as { s, rows } (s)}
            <h2 class="sec-label" data-shop-sec={s}>{t(`shop.sec.${s}`)}</h2>
            <ul class="grid">
              {#each rows as { k, n, p, it } (k)}
                {@const c = picks[k] ?? 0}
                <li class="tile" class:on={c > 0}>
                  <button type="button" class="pickable" data-shop-catch={k} data-n={n} data-picked={c} data-sfx="self"
                    aria-label={t('shop.catchLabel', { name: speciesName(k), n: String(n), v: String(p), c: String(c) })} onclick={() => more(k)}>
                    <span class="ic"><OfficialArt key={it.art} size={46} /></span>
                    <span class="nm">{speciesName(k)}</span>
                    <span class="price"><span class="mini" aria-hidden="true"><OfficialArt key={findArt('cowrie')} size={14} /></span>{formatNum(p)}</span>
                    <span class="count" aria-hidden="true">{c ? `${c}/${n}` : `×${n}`}</span>
                  </button>
                  {#if c}<button type="button" class="less" data-shop-less={k} data-sfx="tick" aria-label={t('shop.less', { name: speciesName(k) })} onclick={() => less(k)}>−</button>{/if}
                </li>
              {/each}
            </ul>
          {/each}
        </div>
      {:else}
        <p class="empty" data-shop-empty>{t('shop.emptyPocket')}</p>
      {/if}
      {#if pocket.length}
        <div class="bar">
          <p class="sum" data-shop-offer={pickedV}>{pickedN ? t('shop.offer', { n: String(pickedN), v: formatNum(pickedV) }) : t('shop.pickHint')}</p>
          <button type="button" class="btn small paper" data-shop-all data-sfx="tick" onclick={all}>{t('shop.all')}</button>
          <button type="button" class="btn small" data-shop-sell data-sfx="self" aria-disabled={!pickedN} onclick={sellPicked}>{t('shop.sell')}</button>
        </div>
      {/if}
    {:else}
      <h2 class="sec-label">{t('shop.today')}</h2>
      {#if stock.length}
        <ul class="grid" data-shop-stock>
          {#each stock as code (code)}{@render piece(code)}{/each}
        </ul>
      {:else if week.model}
        <p class="empty" data-shop-sold-out>{t('shop.soldOut')}</p>
      {/if}
      <div class="bar">
        <p class="sum" data-shop-pick={pick ?? ''}>{pick ? `${itemName(pick)} · ${formatNum(buyPrice(pick) ?? 0)}` : t('shop.buyHint')}</p>
        <button type="button" class="btn small" data-shop-buy data-sfx="self" aria-disabled={!pick || !!why} onclick={buyPicked}>{t('shop.buy')}</button>
      </div>
    {/if}
  </section>
</main>

{#snippet piece(code: string)}
  {@const owned = shop.owned.includes(code)}
  <li class="tile" class:on={pick === code} class:owned>
    <button type="button" class="pickable" data-shop-item={code} data-price={buyPrice(code)} data-owned={owned} data-sfx="self" aria-pressed={pick === code}
      aria-label={t(owned ? 'shop.itemOwned' : 'shop.itemLabel', { name: itemName(code), v: formatNum(buyPrice(code) ?? 0) })} onclick={() => choose(code)}>
      <span class="ic"><img src={iconUrl(code)} alt="" width="46" height="46" loading="lazy" decoding="async" /></span>
      <span class="nm">{itemName(code)}</span>
      {#if owned}<span class="price owned-tag">{t('shop.owned')}</span>
      {:else}<span class="price"><span class="mini" aria-hidden="true"><OfficialArt key={findArt('cowrie')} size={14} /></span>{formatNum(buyPrice(code) ?? 0)}</span>{/if}
    </button>
  </li>
{/snippet}

<style>
  /* NH's Nook's Cranny: honey wood planks on the walls, a darker floor, the shop's sign, the twins behind a wooden
     counter; under it the counter's menu as NH draws it, a cream panel (fixed cream at every time of day, ink text: a
     game object, as the HUD's). At dusk and night the wood warms under the lamp and the window goes dark. */
  .shop {
    --wood: #E7B877; --wood-2: #DDA862; --wood-dark: #9C6A3C;
    position: relative; max-width: var(--col); margin: 0 auto; min-height: var(--vh-fill); height: var(--vh-fill);
    display: flex; flex-direction: column; overflow: hidden; color: var(--c-ink);
    background: repeating-linear-gradient(90deg, var(--wood) 0 38px, var(--wood-2) 38px 40px);
  }
  .shop.night { --wood: #B9895A; --wood-2: #A97B4E; }
  .shop.night::before {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0;
    background: radial-gradient(60% 34% at 50% 18%, rgb(255 214 140 / .38), transparent 70%);
  }
  .top {
    position: absolute; z-index: 3; left: calc(var(--side) + var(--safe-left)); right: calc(var(--side) + var(--safe-right));
    top: calc(var(--ui-top) + 8px); display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; pointer-events: none;
  }
  .top > :global(*) { pointer-events: auto; }
  .wallet {
    margin: 0; display: inline-flex; align-items: center; gap: 6px; height: var(--hit); padding: 0 14px 0 8px; border-radius: var(--r-pill);
    background: var(--c-cream); box-shadow: 0 var(--lip-h) 0 var(--c-lip); color: var(--c-ink);
  }
  .shell { display: inline-flex; width: 30px; justify-content: center; line-height: 0; }
  .num { font: 700 var(--fs-talk)/1 var(--font-num); font-variant-numeric: tabular-nums; }

  .counter { position: relative; z-index: 1; flex: none; height: clamp(250px, 38vh, 330px); padding-top: calc(var(--ui-top) + 56px); }
  .window {
    position: absolute; right: 9%; top: calc(var(--ui-top) + 70px); width: 64px; height: 56px; border-radius: 10px 10px 4px 4px;
    background: linear-gradient(#9FE0F2, #D7F3F7); box-shadow: inset 0 0 0 5px var(--wood-dark), inset 0 0 0 7px #F3D9A8;
  }
  .window::after { content: ''; position: absolute; left: 50%; top: 5px; bottom: 5px; width: 4px; margin-left: -2px; background: var(--wood-dark); }
  .night .window { background: radial-gradient(circle at 70% 30%, #FFF6C9 0 2px, transparent 3px), linear-gradient(#20345E, #3B4F7E); }
  .sign {
    position: absolute; left: 50%; top: calc(var(--ui-top) + 58px); translate: -50% 0; z-index: 1;
    padding: 6px 18px 5px; border-radius: 10px; background: #5DAA5F; color: #FFF9E3;
    box-shadow: inset 0 0 0 3px #3F8743, 0 3px 0 #2F6B33; font: 700 var(--fs-body)/1.1 var(--font-ui); letter-spacing: .12em; white-space: nowrap;
  }
  .twins { position: absolute; left: 50%; bottom: 52px; width: min(62%, 270px); translate: -50% 0; z-index: 1; line-height: 0; }
  .say {
    position: absolute; z-index: 2; left: 50%; bottom: 12px; translate: -50% 0; width: max-content; max-width: min(86%, 340px); margin: 0;
    padding: 8px 14px; border-radius: 18px; background: var(--c-cream); color: var(--c-ink);
    box-shadow: 0 3px 0 var(--c-lip), var(--sh-float); font: 700 var(--fs-body)/1.35 var(--font-ui); text-align: center;
  }
  .desk {
    position: absolute; z-index: 1; left: 0; right: 0; bottom: 0; height: 64px;
    background-image: linear-gradient(#D9A066, #C98E55 12px, #8E5D33 12px, #8E5D33 16px, transparent 16px),
      repeating-linear-gradient(90deg, #B47A45 0 46px, #A56E3D 46px 48px);
    box-shadow: inset 0 2px 0 #EBC08A;
  }
  .register { position: absolute; right: 8%; bottom: 62px; width: 44px; height: 26px; border-radius: 6px 6px 3px 3px; background: #6E7C86; box-shadow: inset 0 -6px 0 #56626B, inset 0 4px 0 #8E9CA6; }

  .menu {
    position: relative; z-index: 2; flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; gap: 10px;
    padding: 14px var(--side) 0; background: var(--c-cream); border-radius: var(--r-card) var(--r-card) 0 0;
    box-shadow: 0 -4px 0 var(--c-lip); overflow-y: auto; overscroll-behavior: contain;
    /* the panel's own controls keep the day's look (fixed cream, ink) at every time of day */
    --text: var(--c-ink); --text-soft: var(--c-ink-soft); --ctl: var(--c-card); --ctl-sel: var(--c-yuzu); --ctl-off: #EADBB8;
    --sh-ctl: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); --sh-ctl-press: inset 0 0 0 2px var(--c-edge), 0 2px 0 var(--c-edge);
  }
  .pocket { display: flex; flex-direction: column; gap: 10px; }
  .grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 10px; }
  .tile { position: relative; }
  .pickable {
    appearance: none; border: 0; cursor: pointer; width: 100%; min-height: 118px; padding: 10px 6px 8px; border-radius: var(--r-btn);
    display: grid; justify-items: center; align-content: start; gap: 4px; background: var(--c-card); color: var(--c-ink);
    box-shadow: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .pickable:active { transform: translateY(2px); box-shadow: inset 0 0 0 2px var(--c-edge), 0 2px 0 var(--c-edge); }
  .pickable:focus-visible { outline: 3px solid var(--c-ink); outline-offset: 2px; }
  .on .pickable { background: var(--c-yuzu); }
  .owned .pickable { background: #F1E6CC; }
  .owned .ic { opacity: .55; }
  .ic { width: 46px; height: 46px; display: grid; place-items: center; line-height: 0; }
  .ic img { width: 46px; height: 46px; object-fit: contain; }
  /* a long name breaks between its kana where it must, balanced (アウトド / アベンチ, not アウトドアベン / チ) */
  .nm { font: 700 var(--fs-s)/1.2 var(--font-ui); text-align: center; word-break: normal; overflow-wrap: anywhere; text-wrap: balance; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .price { display: inline-flex; align-items: center; gap: 3px; font: 700 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; }
  .mini { display: inline-flex; line-height: 0; }
  .owned-tag { font-family: var(--font-ui); color: var(--c-leaf-text); }
  .count {
    position: absolute; top: 6px; right: 8px; padding: 2px 6px; border-radius: var(--r-pill); background: var(--c-paper);
    font: 700 var(--fs-s)/1.1 var(--font-num); font-variant-numeric: tabular-nums;
  }
  .on .count { background: var(--c-cream); }
  .less {
    position: absolute; top: -8px; left: -6px; width: 32px; height: 32px; border-radius: 50%; border: 0; cursor: pointer;
    background: var(--c-card); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), 0 2px 0 var(--c-edge);
    font: 700 var(--fs-talk)/1 var(--font-ui);
  }
  .less::after { content: ''; position: absolute; inset: -6px; }
  .empty { margin: 18px 4px; text-align: center; color: var(--c-ink-soft); font-weight: 700; }
  .bar {
    position: sticky; bottom: 0; margin: auto calc(-1 * var(--side)) 0; padding: 10px var(--side) var(--pad-foot);
    display: flex; align-items: center; gap: 8px; background: var(--c-cream); box-shadow: 0 -2px 0 var(--c-lip);
  }
  .bar .btn { margin: 0; flex: none; }
  .sum { flex: 1 1 auto; min-width: 0; margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  @media (prefers-reduced-motion: reduce) { .pickable:active { transform: none; } }
</style>
