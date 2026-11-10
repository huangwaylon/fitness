<script lang="ts">
  // A guest's shop (docs/design.md "Visitors: roles"; visitorShop.ts): the few pieces they brought today, their prices
  // and 買う, as the shop's かう (shop/stock.ts buyPiece, one piece at a time; a bought one 持っている and in my
  // もようがえ, 取り消す for a moment). My かいがら at the top. Its own chunk: opened from their choice box.
  import Sheet from '../ui/Sheet.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { iconUrl } from '../tent/items.ts';
  import { findArt } from './beach.ts';
  import { buyPrice } from '#lib/contract/stock.ts';
  import { buyPiece, buyRefusal, foundBefore } from '../shop/stock.ts';
  import { offerOf } from './visitorShop.ts';
  import type { GuestId } from './visitorRoles.ts';
  import { shopView } from '#lib/model/shop.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { undoBanner } from '#lib/store/actions.ts';
  import { localDateAt, ZONE_OFFSET_MS, dateMs } from '#lib/time/dates.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { formatNum, i18n, t } from '#lib/i18n/index.ts';
  import { loadTentNames } from '#lib/i18n/tent.ts';

  let { open = $bindable(), id, pool, name }: { open: boolean; id: GuestId; pool: 'dear' | 'any'; name: string } = $props();

  let names = $state(0);
  $effect(() => void loadTentNames(i18n.locale).then(() => names++, () => {}));
  const itemName = (code: string) => (void names, t(`tent.item.${code}`));
  const m = $derived(week.model);
  const mine = $derived(m ? shopView(m.state, m.me) : null);
  const offer = $derived.by(() => {
    if (!m) return [];
    const date = localDateAt(m.now);
    return offerOf(id, pool, date, foundBefore(m.state, dateMs(date) - ZONE_OFFSET_MS));
  });
  let pick = $state<string | null>(null);
  const why = $derived(pick ? (void mine, buyRefusal(pick, offer)) : null);
  function choose(code: string) {
    pick = pick === code ? null : code;
    cue('tick');
  }
  function buy() {
    if (!pick || why) return void cue('boop');
    const r = buyPiece(pick, offer);
    if (!r.ok) return void cue('boop');
    cue('buy');
    undoBanner(t('shop.bought', { name: itemName(pick), v: formatNum(r.price ?? 0) }), r);
    pick = null;
  }
</script>

<Sheet bind:open label={t('guestShop.title', { name })} title={t('guestShop.title', { name })}>
  <div class="gs sheet-copy" data-guest-shop={id}>
    <p class="wallet" data-guest-shells={mine?.shells ?? 0}>
      <span class="mini" aria-hidden="true"><OfficialArt key={findArt('cowrie')} size={18} /></span>{formatNum(mine?.shells ?? 0)}
    </p>
    <ul class="grid">
      {#each offer as code (code)}
        {@const owned = !!mine?.owned.includes(code)}
        <li class="tile" class:on={pick === code} class:owned>
          <button type="button" class="pickable" data-guest-item={code} data-price={buyPrice(code)} data-owned={owned} data-sfx="self" aria-pressed={pick === code}
            aria-label={t(owned ? 'shop.itemOwned' : 'shop.itemLabel', { name: itemName(code), v: formatNum(buyPrice(code) ?? 0) })} onclick={() => choose(code)}>
            <img src={iconUrl(code)} alt="" width="46" height="46" loading="lazy" decoding="async" />
            <span class="nm">{itemName(code)}</span>
            {#if owned}<span class="price owned-tag">{t('shop.owned')}</span>
            {:else}<span class="price"><span class="mini" aria-hidden="true"><OfficialArt key={findArt('cowrie')} size={14} /></span>{formatNum(buyPrice(code) ?? 0)}</span>{/if}
          </button>
        </li>
      {/each}
    </ul>
    <div class="bar">
      <p class="sum">{pick ? `${itemName(pick)} · ${formatNum(buyPrice(pick) ?? 0)}` : t('shop.buyHint')}</p>
      <button type="button" class="btn small" data-guest-buy data-sfx="self" aria-disabled={!pick || !!why} onclick={buy}>{t('shop.buy')}</button>
    </div>
  </div>
</Sheet>

<style>
  .gs { display: grid; gap: 10px; padding-bottom: 8px; }
  .wallet { margin: 0; justify-self: end; display: inline-flex; align-items: center; gap: 4px; font: 700 var(--fs-body)/1 var(--font-num); }
  .mini { display: inline-flex; line-height: 0; }
  .grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 10px; }
  .pickable {
    appearance: none; border: 0; cursor: pointer; width: 100%; min-height: 118px; padding: 10px 6px 8px; border-radius: var(--r-btn);
    display: grid; justify-items: center; align-content: start; gap: 4px; background: var(--ctl); color: var(--text);
    box-shadow: var(--sh-ctl); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .pickable img { width: 46px; height: 46px; object-fit: contain; }
  .pickable:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .on .pickable { background: var(--ctl-sel); color: var(--c-ink); }
  .owned .pickable img { opacity: .55; }
  .nm { font: 700 var(--fs-s)/1.2 var(--font-ui); text-align: center; overflow-wrap: anywhere; text-wrap: balance; }
  .price { display: inline-flex; align-items: center; gap: 3px; font: 700 var(--fs-s)/1 var(--font-num); }
  .owned-tag { font-family: var(--font-ui); color: var(--leaf-text); }
  .bar { display: flex; align-items: center; gap: 8px; }
  .bar .btn { margin: 0; flex: none; }
  .sum { flex: 1 1 auto; min-width: 0; margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
</style>
