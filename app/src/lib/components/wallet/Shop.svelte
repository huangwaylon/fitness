<script lang="ts">
  // The two rewards (config/rules.ts SHOP) as two tiles: the item's NH art, its name and the price. One the wallet
  // can't pay for yet is aria-disabled (a tap boops, as NH's shop does). Tap → `onbuy` (the page asks first). At each
  // tile's top-right a small round ⓘ (a 44px target) shows what counts as that reward (おやつ: たこやき・アイス…) in a
  // little cream speech bubble under it: ⓘ again, a tap anywhere else or Esc folds it; one at a time.
  import type { ShopItemId } from '#lib/types.ts';
  import { SHOP } from '#lib/config/rules.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { itemArt } from './icons.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';

  let { balance, onbuy }: { balance: number; onbuy: (item: ShopItemId) => void } = $props();

  /** The reward whose examples are shown. */
  let info = $state<ShopItemId | null>(null);

  // shown: a tap outside the bubble and its ⓘ folds it (capture: the tap still goes where it was aimed), Esc too
  $effect(() => {
    if (!info) return;
    const down = (e: PointerEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest('[data-info], [data-info-tip]')) info = null;
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // only the bubble closes (the panel stays)
      e.stopPropagation();
      e.preventDefault();
      info = null;
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('keydown', key, true);
    };
  });
</script>

<section class="shop" aria-label={t('wallet.title')}>
  {#each SHOP as item (item.id)}
    {@const short = item.bells - balance}
    {@const label = t(`shop.${item.id}`)}
    <div class="tile">
      <button type="button" class="item" aria-disabled={short > 0} data-sfx="open" data-item={item.id} onclick={() => onbuy(item.id)}
        aria-label="{label} {formatBells(item.bells)}">
        <span class="ic"><OfficialArt key={itemArt(item.id)} size="72px" /></span>
        <b class="nm">{label}</b>
        <span class="pr money" data-price={item.bells}>{formatBells(item.bells)}</span>
      </button>
      <button type="button" class="info" data-info={item.id} aria-label={t('wallet.info', { label })} aria-expanded={info === item.id}
        aria-controls="info-{item.id}" data-sfx="tick" onclick={() => (info = info === item.id ? null : item.id)}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="5.6" r="1.6" /><rect x="8.5" y="8.4" width="3" height="7.4" rx="1.5" /></svg>
      </button>
      {#if info === item.id}
        <p class="tip" id="info-{item.id}" role="note" data-info-tip={item.id}>{t(`shop.${item.id}.ex`)}</p>
      {/if}
    </div>
  {/each}
</section>

<style>
  .shop { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .tile { position: relative; min-width: 0; display: grid; }
  .item {
    appearance: none; border: 0; cursor: pointer; font: inherit; color: var(--text); min-width: 0;
    display: grid; justify-items: center; align-content: start; gap: 4px; padding: 14px 10px 12px; text-align: center;
    border-radius: var(--r-card); background: var(--ctl); box-shadow: var(--sh-ctl);
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  .item:active:not([aria-disabled='true']) { transform: translateY(3px) scale(1.04, .94); box-shadow: var(--sh-ctl-press); transition-duration: var(--dur-tap); }
  .item[aria-disabled='true'] { cursor: default; box-shadow: none; background: var(--ctl-off); color: var(--text-soft); transform: translateY(4px); }
  .item[aria-disabled='true'] .ic { opacity: .5; filter: saturate(.3); }
  .ic { width: 72px; height: 72px; display: grid; place-items: center; line-height: 0; }
  .nm { max-width: 100%; font-size: var(--fs-talk); line-height: 1.25; }
  .pr { font-size: var(--fs-talk); }

  /* ⓘ: a 24px cream-on-soft-brown disc in the tile's top-right corner, its 44px target grown by ::after */
  .info {
    position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; margin: 0; padding: 0; display: grid; place-items: center;
    appearance: none; border: 0; border-radius: 50%; cursor: pointer; background: var(--c-lip); color: var(--c-cream);
    -webkit-tap-highlight-color: transparent; touch-action: manipulation; transition: transform 120ms var(--ease-squash), background-color 160ms;
  }
  .info::after { content: ''; position: absolute; inset: -10px; border-radius: 50%; }
  .info svg { width: 14px; height: 14px; fill: currentColor; }
  .info:active { transform: scale(.88); }
  .info[aria-expanded='true'] { background: var(--c-yuzu-lip); color: var(--c-ink); }
  .info:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

  /* the examples: a small cream speech bubble hanging from the ⓘ (its tail under the disc), over the tile's art,
     popping in on NH's bounce */
  .tip {
    position: absolute; z-index: 3; top: 40px; right: 2px; left: 2px; margin: 0; padding: 10px 12px;
    border-radius: 16px; background: var(--c-cream); color: var(--c-ink); box-shadow: 0 3px 0 var(--c-lip), 0 8px 18px rgb(60 40 20 / .18);
    font: 700 var(--fs-s)/1.5 var(--font-ui); text-align: left; text-wrap: pretty;
    transform-origin: calc(100% - 18px) -8px; animation: tip 260ms var(--ease-bounce);
  }
  .tip::before {
    content: ''; position: absolute; top: -7px; right: 13px; width: 14px; height: 14px; rotate: 45deg; border-radius: 3px 0 0 0;
    background: var(--c-cream);
  }
  @keyframes tip { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .tip { animation: tip-fade 120ms linear; } @keyframes tip-fade { from { opacity: 0; } } }
</style>
