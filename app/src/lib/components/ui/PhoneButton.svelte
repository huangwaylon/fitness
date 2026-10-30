<script lang="ts">
  // The NookPhone button: the bare official NookPhone. `big` (島, round 18): the island's one control, bottom centre in
  // the thumb zone, the phone 56px tall in a 72 × 84 hit area with 「しまフォン」 under it. Otherwise 40px in a 52px area.
  // Opens the launcher (the phone is the hub: きろく, あそびかた, …).
  import ShimaPhone from '../phone/ShimaPhone.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { NOOKPHONE } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  /** Bindable so the island page can pause the scene while the phone is open. */
  let { open = $bindable(false), big = false }: { open?: boolean; big?: boolean } = $props();
  const size = $derived(big ? 56 : 40);
</script>

<button type="button" class="phone-btn" class:big data-sfx="self" aria-label={t('phone.open')} onclick={() => (open = true)}>
  <span class="art">
    <OfficialArt key={NOOKPHONE} {size} eager>
      {#snippet fallback()}
        <svg viewBox="0 0 24 24" aria-hidden="true" width={size} height={size}>
          <rect x="5.5" y="2.5" width="13" height="19" rx="4" fill="var(--c-cream)" />
          <rect x="8" y="6" width="3.2" height="3.2" rx="1" fill="var(--c-mint)" /><rect x="12.8" y="6" width="3.2" height="3.2" rx="1" fill="var(--c-yuzu)" />
        </svg>
      {/snippet}
    </OfficialArt>
  </span>
  {#if big}<span class="lbl" aria-hidden="true">{t('phone.name')}</span>{/if}
</button>
<ShimaPhone bind:open />

<style>
  .phone-btn {
    appearance: none; border: 0; padding: 0; background: none; cursor: pointer; width: 52px; height: 52px;
    display: grid; place-items: center; border-radius: var(--r-btn); -webkit-tap-highlight-color: transparent;
  }
  .art { display: grid; place-items: center; line-height: 0; transition: transform var(--dur-base) var(--ease-bounce); }
  .phone-btn:active .art { transform: scale(1.1, .9); transition-duration: var(--dur-tap); }
  .phone-btn:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* the island's control: a cream disc under the phone (a game object, always light), the name on a plate below */
  .big { width: 84px; height: auto; min-height: 84px; gap: 2px; align-content: center; }
  .big .art {
    width: 68px; height: 68px; border-radius: 50%; background: var(--c-cream); box-shadow: var(--sh-obj);
  }
  .big .art :global(.official), .big .art svg { rotate: -8deg; }
  .lbl {
    padding: 2px 10px; border-radius: var(--r-pill); background: var(--c-cream); color: var(--c-ink);
    font: 700 var(--fs-s)/1.3 var(--font-ui); box-shadow: 0 2px 0 var(--c-lip); white-space: nowrap;
  }
</style>
