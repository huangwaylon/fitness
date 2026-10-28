<script lang="ts">
  // A savings amount: the Bells bag (LeafCoin) before `¥146,200` (style guide v3 §A).
  import LeafCoin from './LeafCoin.svelte';
  import { formatYen } from '#lib/i18n/index.ts';

  interface Props {
    yen: number;
    /** Prefix, e.g. '+'. */
    sign?: string;
    /** Bag height (CSS length); default 1.1em. */
    bag?: string;
    class?: string;
  }
  let { yen, sign = '', bag = '1.1em', class: cls = '' }: Props = $props();
</script>

<span class="yen money {cls}"><LeafCoin size={bag} eager />{sign}{formatYen(yen)}</span>

<style>
  .yen { display: inline-flex; align-items: center; gap: .25em; white-space: nowrap; }
</style>
