<script lang="ts">
  // One section of the shared menu (ADR 0022) as a card: its mark and name (🍦 まいにちのごほうび · ✈️ 旅のごほうび), a quiet
  // ✎ to change it, then two columns of item tiles (picture, name, price). An item the wallet can't pay for yet is
  // aria-disabled (a tap boops, as NH's shop does) and says how much is missing. Tap → `onbuy` (the page asks first).
  import type { MenuSection, WalletItem } from '#lib/types.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Glyph from '../kiroku/Glyph.svelte';
  import { itemArt, sectionIcon } from './icons.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';

  interface Props {
    section: MenuSection;
    items: WalletItem[];
    balance: number;
    onbuy: (item: WalletItem) => void;
    onedit: () => void;
  }
  let { section, items, balance, onbuy, onedit }: Props = $props();
  const hid = $props.id();
</script>

<section class="card shelf-card" aria-labelledby="{hid}-h" data-section={section}>
  <header class="sh">
    <svg class="mark" viewBox="0 0 48 48" aria-hidden="true"><use href="#{sectionIcon(section)}" /></svg>
    <h2 id="{hid}-h">{t(`menu.${section}.title`)}</h2>
    <button type="button" class="edit" data-sfx="open" onclick={onedit} aria-label={t('menu.edit', { section: t(`menu.${section}.title`) })}>
      <Glyph kind="pen" size={18} />
    </button>
  </header>
  {#if items.length}
    <div class="shelf">
      {#each items as item (item.id)}
        {@const short = item.bells - balance}
        {@const art = itemArt(item.id)}
        <button type="button" class="item" aria-disabled={short > 0} data-sfx="open" onclick={() => onbuy(item)}
          aria-label="{item.label} {formatBells(item.bells)}{short > 0 ? ' ' + t('menu.left', { bells: formatBells(short) }) : ''}">
          {#if art}<span class="ic"><OfficialArt key={art} size="36px" /></span>
          {:else}<svg class="ic" viewBox="0 0 48 48" aria-hidden="true"><use href="#{sectionIcon(section)}" /></svg>{/if}
          <b class="nm">{item.label}</b>
          <span class="pr money">{formatBells(item.bells)}</span>
          {#if short > 0}<span class="short">{t('menu.left', { bells: formatBells(short) })}</span>{/if}
        </button>
      {/each}
    </div>
  {:else}
    <p class="empty">{t('menu.empty')}</p>
  {/if}
</section>

<style>
  .shelf-card { display: grid; gap: 10px; padding: 12px 14px 16px; }
  .sh { display: flex; align-items: center; gap: 10px; min-height: var(--hit); }
  .mark { width: 32px; height: 32px; flex: none; }
  h2 { flex: 1; min-width: 0; margin: 0; font-size: var(--fs-talk); line-height: 1.2; }
  .edit {
    appearance: none; border: 0; cursor: pointer; flex: none; width: var(--hit); height: var(--hit); padding: 0;
    display: grid; place-items: center; border-radius: var(--r-btn); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .edit:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .shelf { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .item {
    appearance: none; border: 0; cursor: pointer; font: inherit; color: var(--text); min-width: 0; min-height: 92px;
    display: grid; justify-items: center; align-content: center; gap: 1px; padding: 8px 6px; text-align: center;
    border-radius: var(--r-btn); background: var(--ctl); box-shadow: var(--sh-ctl);
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  .item:active:not([aria-disabled='true']) { transform: translateY(3px) scale(1.04, .94); box-shadow: var(--sh-ctl-press); transition-duration: var(--dur-tap); }
  .item[aria-disabled='true'] { cursor: default; box-shadow: none; background: var(--ctl-off); color: var(--text-soft); transform: translateY(4px); }
  .item[aria-disabled='true'] .ic { opacity: .5; filter: saturate(.3); }
  .ic { width: 36px; height: 36px; margin-bottom: 2px; display: grid; place-items: center; line-height: 0; }
  .nm { max-width: 100%; font-size: var(--fs-body); line-height: 1.2; overflow-wrap: anywhere; word-break: auto-phrase; }
  .pr { font-size: var(--fs-body); }
  .short { font-size: var(--fs-s); font-weight: 700; }
  .empty { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
</style>
