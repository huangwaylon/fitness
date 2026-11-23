<script lang="ts">
  // A full-bleed map's ＋ − (docs/design.md "Maps"; トレイル, 保存した場所; the trip's embedded pane has none): theme.css
  // .disc stacked top-right under the NavBar's ✕ (its drawn edge on the bar's), inert while a sheet covers the map.
  import Icon from '../ui/Icon.svelte';
  import { i18n } from '#lib/i18n/index.ts';
  import { MS } from './strings.ts';

  let { onzoom, inert = false, el = $bindable() }: { onzoom: (by: 1 | -1) => void; inert?: boolean; el?: HTMLElement } = $props();
  const L = $derived(i18n.locale);
</script>

<div class="zoom" {inert} bind:this={el}>
  <button type="button" class="disc" data-sfx="tick" aria-label={MS.zoomIn[L]} onclick={() => onzoom(1)}><Icon name="plus" size={18} stroke={2.4} /></button>
  <button type="button" class="disc" data-sfx="tick" aria-label={MS.zoomOut[L]} onclick={() => onzoom(-1)}><Icon name="minus" size={18} stroke={2.4} /></button>
</div>

<style>
  .zoom { position: absolute; z-index: 500; top: calc(var(--ui-top) + 52px); right: calc(6px + var(--safe-right)); display: flex; flex-direction: column; }
</style>
