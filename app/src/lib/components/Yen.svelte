<script lang="ts">
  // A savings amount: the Bells bag (LeafCoin) before `¥146,200` (style guide v3 §A).
  import LeafCoin from './LeafCoin.svelte';
  import { formatYen } from '#lib/i18n/index.ts';

  interface Props {
    yen: number;
    /** Bag height (CSS length); default 1.1em. */
    bag?: string;
    class?: string;
  }
  let { yen, bag = '1.1em', class: cls = '' }: Props = $props();
</script>

<span class="yen money {cls}"><LeafCoin size={bag} eager />{formatYen(yen)}</span>

<style>
  .yen { display: inline-flex; align-items: center; gap: .25em; white-space: nowrap; }
</style>
