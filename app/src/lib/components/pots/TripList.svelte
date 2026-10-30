<script lang="ts">
  // 旅's trip types (ADR 0019 §5): one row per type, cheapest first: picture, name, price, a bar of the pot toward it
  // and あと N ベル, or 「行ける！」 (a leaf button → `onbuy`, the page asks first) once the pot can pay for it.
  import type { MenuItem } from '#lib/types.ts';
  import Rope from '../ui/Rope.svelte';
  import { itemIcon } from './icons.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';

  let { items, balance, onbuy }: { items: MenuItem[]; balance: number; onbuy: (item: MenuItem) => void } = $props();
  const sorted = $derived([...items].sort((a, b) => a.bells - b.bells));
</script>

{#if sorted.length}
  <ul class="trips">
    {#each sorted as item (item.id)}
      {@const ok = balance >= item.bells}
      <li class:ok>
        <svg class="ic" viewBox="0 0 48 48" aria-hidden="true"><use href="#{itemIcon('trip', item.id)}" /></svg>
        <span class="body">
          <span class="top"><b class="nm">{item.label}</b><span class="pr money">{formatBells(item.bells)}</span></span>
          {#if ok}
            <span class="ready">{t('pots.trip.ready')}</span>
          {:else}
            <Rope pct={(balance / item.bells) * 100} height={10} label="{item.label} {Math.floor((balance / item.bells) * 100)}%" />
            <span class="left money">{t('pots.left', { bells: formatBells(item.bells - balance) })}</span>
          {/if}
        </span>
        {#if ok}<button type="button" class="btn small go" data-sfx="open" onclick={() => onbuy(item)} aria-label="{item.label} {formatBells(item.bells)}: {t('pots.trip.go')}">{t('pots.trip.go')}</button>{/if}
      </li>
    {/each}
  </ul>
{:else}
  <p class="empty">{t('pots.trip.empty')}</p>
{/if}

<style>
  .trips { list-style: none; margin: 0; padding: 0; display: grid; }
  li { display: flex; align-items: center; gap: 10px; min-height: 60px; padding: 8px 0; }
  li + li { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 45%, transparent); }
  .ic { width: 36px; height: 36px; flex: none; }
  .body { flex: 1; min-width: 0; display: grid; gap: 5px; }
  .top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .nm { min-width: 0; font-size: var(--fs-body); line-height: 1.2; overflow-wrap: anywhere; word-break: auto-phrase; }
  .pr { flex: none; font-size: var(--fs-s); color: var(--text-soft); }
  .left { font-size: var(--fs-s); color: var(--text-soft); }
  .ready { font-size: var(--fs-s); font-weight: 700; color: var(--c-leaf-lip); }
  :global(:root[data-tod='night']) .ready { color: var(--c-leaf); }
  .go { flex: none; margin-bottom: 4px; padding: 0 14px; }
  .empty { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
</style>
