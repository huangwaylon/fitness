<script lang="ts">
  // ききみみ's ずかん (docs/kikimimi-ux.md §6.10): four sections over one Segmented, ことば · こえ · なかま · スタンプ, each its
  // own chunk; what they read loaded once as it opens (data.svelte.ts). Pushed from the hub's tile (ことば first), the
  // path's 「ことば ずかん」 or a unit page's phrases (ことば on that unit's). The section kept while the page is open. Its own
  // chunk; my own (the partner sees none of it).
  import { onMount } from 'svelte';
  import type { Item } from '#lib/kikimimi/bank.ts';
  import type { Who } from '#lib/types.ts';
  import Segmented from '../../ui/Segmented.svelte';
  import { ZukanData } from './data.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  type Tab = 'words' | 'voices' | 'friends' | 'stamps';
  let { me, unit = null, onreview }: { me: Who; unit?: string | null; onreview: (items: Item[]) => void } = $props();
  let tab = $state<Tab>('words');
  const TABS: readonly { id: Tab; label: string }[] = (['words', 'voices', 'friends', 'stamps'] as const).map((id) => ({ id, label: t(`kiki.zukan.tab.${id}`) }));
  const data = new ZukanData();
  onMount(() => {
    data.start();
    return () => data.dispose();
  });
  function pick(id: Tab) {
    data.stop();
    tab = id;
  }
</script>

<div class="kz" data-kiki-page="zukan" data-kiki-zukan-tab-on={tab}>
  <Segmented label={t('kiki.zukan.tabs')} attr="kiki-zukan-tab" value={tab} items={TABS} onpick={pick} />
  {#if tab === 'words'}
    {#await import('./Words.svelte') then { default: Words }}<Words {data} {me} {unit} {onreview} />{/await}
  {:else if tab === 'voices'}
    {#await import('./Voices.svelte') then { default: Voices }}<Voices {data} />{/await}
  {:else if tab === 'friends'}
    {#await import('./Friends.svelte') then { default: Friends }}<Friends {data} {me} />{/await}
  {:else}
    {#await import('./Stamps.svelte') then { default: Stamps }}<Stamps {me} />{/await}
  {/if}
</div>

<style>
  .kz { display: grid; gap: 12px; }
</style>
