<script lang="ts">
  // A savings amount: the Bells bag (official, Leaf-coin fallback) before `¥146,200` (§A).
  import OfficialArt from './OfficialArt.svelte';
  import LeafCoin from './LeafCoin.svelte';
  import { moneyArt } from '#lib/client/assets.ts';
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

<span class="yen money {cls}">
  <span class="bag" style:height={bag} style:width={bag}>
    <OfficialArt key={moneyArt('bells')} size={bag}>
      {#snippet fallback()}<LeafCoin size={bag} />{/snippet}
    </OfficialArt>
  </span>{sign}{formatYen(yen)}
</span>

<style>
  .yen { display: inline-flex; align-items: center; gap: .25em; white-space: nowrap; }
  .bag { display: inline-grid; place-items: center; flex: none; }
</style>
