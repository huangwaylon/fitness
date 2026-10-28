<script lang="ts">
  // Money mark (style guide v3 §A): the official Bells bag next to every savings ¥ amount
  // (amounts stay ¥). `kind="leaf"` = the NH leaf (language / small accents). Our drawn リーフコイン
  // is the fallback if the art is missing (or `kind="coin"` to force it).
  //   <LeafCoin size={22} />  <LeafCoin size="1.1em" />  <LeafCoin size={48} spin={total} />
  // `spin` plays one if-coin flip; pass a changing number to replay it.
  import OfficialArt from './OfficialArt.svelte';
  import { moneyArt } from '#lib/client/assets.ts';

  interface Props {
    size?: number | string;
    spin?: boolean | number;
    label?: string;
    kind?: 'bells' | 'leaf' | 'coin';
    /** Treat purse: the same bag, slightly smaller (85%). */
    purse?: boolean;
    eager?: boolean;
  }
  let { size = 22, spin = false, label, kind = 'bells', purse = false, eager = false }: Props = $props();
  const dim = $derived(typeof size === 'number' ? `${size}px` : size);
  const key = $derived(kind === 'coin' ? null : moneyArt(kind));
</script>

{#key spin}
  <span
    class="money-mark" class:spin={spin !== false && spin !== 0} class:purse
    style:--d={dim}
    role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}
  >
    <OfficialArt {key} size={dim} {eager}>
      {#snippet fallback()}
        <svg class="coin" viewBox="0 0 24 24" style:width={dim} style:height={dim}>
          <circle cx="12" cy="13" r="10" fill="#D9962A" />
          <circle cx="12" cy="12.2" r="10" fill="#F7C548" stroke="#D9962A" stroke-width="2" />
          <circle cx="12" cy="12.2" r="7.4" fill="none" stroke="#D9962A" stroke-width="1" opacity=".4" />
          <path d="M5.2 8.4 A8 8 0 0 1 11 4.3" fill="none" stroke="#FFF1B8" stroke-width="1.8" stroke-linecap="round" />
          <path d="M8.6 7.6 L12 11.6 L15.4 7.6 M12 11.6 V17 M9.2 12.4 H14.8 M9.2 14.8 H14.8" fill="none" stroke="#B9791C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M17.6 4.6 Q19.4 0.6 23.6 1.2 Q22.4 5.6 17.6 4.6 Z" fill="#7BC67E" stroke="#4A3A2C" stroke-width="1.2" stroke-linejoin="round" />
        </svg>
      {/snippet}
    </OfficialArt>
  </span>
{/key}

<style>
  .money-mark { display: inline-block; flex: none; vertical-align: middle; line-height: 0; transform-origin: 50% 60%; }
  .money-mark.purse { scale: .85; }
  .coin { display: block; overflow: visible; }
  .spin { animation: if-pop var(--dur-pop, 360ms) var(--ease-bounce, ease) 1; }
  @media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
</style>
