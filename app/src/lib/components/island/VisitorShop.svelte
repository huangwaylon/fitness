<script lang="ts">
  // A guest's shop (docs/design.md "Visitors: roles"; visitorShop.ts): the few pieces they brought today, their prices
  // and 買う, as the shop's かう (its tiles: shop/PieceTile.svelte; shop/stock.ts buyPiece, one piece at a time; a bought
  // one 持っている and in my もようがえ, 取り消す for a moment). My かいがら at the top, as the shop's chip. Its own chunk: opened from their choice box.
  import Sheet from '../ui/Sheet.svelte';
  import PieceTile from '../shop/PieceTile.svelte';
  import { iconUrl } from '../tent/items.ts';
  import { buyPrice } from '#lib/contract/stock.ts';
  import { buyPiece, buyRefusal, foundBefore, shortBy } from '../shop/stock.ts';
  import { offerOf } from './visitorShop.ts';
  import type { GuestId } from '#lib/world/visitorRoles.ts';
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
  const pickPrice = $derived(pick ? (buyPrice(pick) ?? 0) : 0);
  function choose(code: string) {
    pick = pick === code ? null : code;
    cue('tick');
  }
  function buy() {
    if (!pick || why) return void cue('boop');
    const r = buyPiece(pick, offer);
    if (!r.ok) return void cue('boop');
    cue('buy');
    undoBanner(t('shop.bought', { name: itemName(pick) }), r);
    pick = null;
  }
</script>

<Sheet bind:open title={t('guestShop.title', { name })} name="guestShop">
  <div class="gs sheet-copy" data-guest-shop={id}>
    <span class="chip s wallet" data-guest-shells={mine?.shells ?? 0}>{t('shop.wallet', { v: formatNum(mine?.shells ?? 0) })}</span>
    <ul class="grid">
      {#each offer as code (code)}
        {@const owned = !!mine?.owned.includes(code)}
        <PieceTile name={itemName(code)} price={buyPrice(code) ?? 0} on={pick === code} {owned} short={owned ? 0 : shortBy(buyPrice(code) ?? 0, mine?.shells ?? 0)} data-guest-item={code} data-price={buyPrice(code)} data-owned={owned}
          aria-pressed={pick === code} aria-label={t(owned ? 'shop.itemOwned' : 'shop.itemLabel', { name: itemName(code), v: formatNum(buyPrice(code) ?? 0) })}
          onclick={() => choose(code)}>
          {#snippet icon()}<img src={iconUrl(code)} alt="" width="46" height="46" loading="lazy" decoding="async" />{/snippet}
        </PieceTile>
      {/each}
    </ul>
    <div class="bar">
      <!-- as the shop's かう: what's picked or how many かいがら short, its price on the button -->
      <p class="sum">{!pick ? t('shop.buyHint') : why === 'wallet' ? t('shop.short', { n: formatNum(shortBy(pickPrice, mine?.shells ?? 0)) }) : itemName(pick)}</p>
      <button type="button" class="btn small" data-guest-buy data-sfx="self" aria-disabled={!pick || !!why} onclick={buy}>
        {pick && why !== 'owned' ? t('shop.buyFor', { v: formatNum(pickPrice) }) : t('shop.buy')}</button>
    </div>
  </div>
</Sheet>

<style>
  .gs { display: grid; gap: 10px; padding-bottom: 8px; }
  .wallet { justify-self: start; cursor: default; font-variant-numeric: tabular-nums; }
  .wallet:active { transform: none; }
  .grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 10px; }
  .bar { display: flex; align-items: center; gap: 8px; }
  .bar .btn { margin: 0; flex: none; }
  .sum { flex: 1 1 auto; min-width: 0; margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
</style>
