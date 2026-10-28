<script lang="ts">
  // リーフコイン (style guide v2 §4.5): a gold ¥ coin with a leaf sprouting from its rim.
  // <LeafCoin size spin />: `spin` plays one if-coin flip; pass a changing number to replay it.
  interface Props {
    size?: number | string;
    spin?: boolean | number;
    label?: string;
  }
  let { size = 22, spin = false, label }: Props = $props();
  const dim = $derived(typeof size === 'number' ? `${size}px` : size);
</script>

{#key spin}
  <svg
    class="leafcoin" class:spin={spin !== false && spin !== 0} viewBox="0 0 24 24" style:width={dim} style:height={dim}
    role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}
  >
    <circle cx="12" cy="13" r="10" fill="#D9962A" />
    <circle cx="12" cy="12.2" r="10" fill="#F7C548" stroke="#D9962A" stroke-width="2" />
    <circle cx="12" cy="12.2" r="7.4" fill="none" stroke="#D9962A" stroke-width="1" opacity=".4" />
    <path d="M5.2 8.4 A8 8 0 0 1 11 4.3" fill="none" stroke="#FFF1B8" stroke-width="1.8" stroke-linecap="round" />
    <g fill="none" stroke="#B9791C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8.6 7.6 L12 11.6 L15.4 7.6 M12 11.6 V17 M9.2 12.4 H14.8 M9.2 14.8 H14.8" />
    </g>
    <path d="M17.6 4.6 Q19.4 0.6 23.6 1.2 Q22.4 5.6 17.6 4.6 Z" fill="#7BC67E" stroke="#4A3A2C" stroke-width="1.2" stroke-linejoin="round" />
    <path d="M17 5.2 Q18.4 3.6 20.6 2.6" fill="none" stroke="#4A3A2C" stroke-width="1" stroke-linecap="round" />
  </svg>
{/key}

<style>
  .leafcoin { display: inline-block; flex: none; vertical-align: middle; overflow: visible; }
  .spin { animation: if-coin var(--dur-slow, 600ms) var(--ease-soft, ease) 1; }
  @media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
</style>
