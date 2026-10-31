<script lang="ts">
  // Money mark (design.md "Official art"): the official Bells bag next to ベル amounts. `kind="leaf"` = the NH leaf (small accents). A drawn coin is the fallback.
  //   <LeafCoin size={22} />  <LeafCoin size="1.1em" />  <LeafCoin kind="leaf" size={18} />
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { moneyArt } from '#lib/art.ts';

  interface Props {
    size?: number | string;
    kind?: 'bells' | 'leaf';
    eager?: boolean;
  }
  let { size = 22, kind = 'bells', eager = false }: Props = $props();
  const dim = $derived(typeof size === 'number' ? `${size}px` : size);
</script>

<span class="money-mark" aria-hidden="true">
  <OfficialArt key={moneyArt(kind)} size={dim} {eager}>
    {#snippet fallback()}
      <svg class="coin" viewBox="0 0 24 24" style:width={dim} style:height={dim}>
        <circle cx="12" cy="12" r="10" fill="#F7C548" stroke="#D9962A" stroke-width="2" />
        <path d="M17.6 4.6 Q19.4 0.6 23.6 1.2 Q22.4 5.6 17.6 4.6 Z" fill="#7BC67E" stroke="#4A3A2C" stroke-width="1.2" />
      </svg>
    {/snippet}
  </OfficialArt>
</span>

<style>
  .money-mark { display: inline-block; flex: none; vertical-align: middle; line-height: 0; }
  .coin { display: block; overflow: visible; }
</style>
