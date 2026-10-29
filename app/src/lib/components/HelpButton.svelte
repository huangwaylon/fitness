<script lang="ts">
  // The NookPhone button (HUD, top right): the bare official NookPhone, 40 tall in a 44px hit area. Opens the launcher.
  import ShimaPhone from './ShimaPhone.svelte';
  import OfficialArt from './OfficialArt.svelte';
  import { NOOKPHONE } from '#lib/client/assets.ts';
  import { t } from '#lib/i18n/index.ts';

  /** Bindable so the island page can pause the scene while the phone is open. */
  let { open = $bindable(false) }: { open?: boolean } = $props();
</script>

<button type="button" class="phone-btn" aria-label={t('phone.open')} onclick={() => (open = true)}>
  <OfficialArt key={NOOKPHONE} size={40} eager>
    {#snippet fallback()}
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5.5" y="2.5" width="13" height="19" rx="4" fill="var(--c-cream)" />
        <rect x="8" y="6" width="3.2" height="3.2" rx="1" fill="var(--c-mint)" /><rect x="12.8" y="6" width="3.2" height="3.2" rx="1" fill="var(--c-yuzu)" />
      </svg>
    {/snippet}
  </OfficialArt>
</button>
<ShimaPhone bind:open />

<style>
  .phone-btn {
    appearance: none; border: 0; padding: 0; background: none; cursor: pointer; width: 52px; height: 52px; margin-top: -4px;
    display: grid; place-items: center; border-radius: var(--r-btn); transition: transform var(--dur-base) var(--ease-bounce);
  }
  .phone-btn:active { transform: scale(1.1, .9); transition-duration: var(--dur-tap); }
  .phone-btn svg { width: 40px; height: 40px; }
</style>
