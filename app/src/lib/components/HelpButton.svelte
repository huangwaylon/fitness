<script lang="ts">
  // The しまフォン button (status row, top right, 44×44): the NookPhone on a cream circle. Opens the launcher.
  import ShimaPhone from './ShimaPhone.svelte';
  import OfficialArt from './OfficialArt.svelte';
  import { NOOKPHONE } from '#lib/client/assets.ts';
  import { t } from '#lib/i18n/index.ts';

  /** Bindable so the island page can pause the scene while the phone is open. */
  let { open = $bindable(false) }: { open?: boolean } = $props();
</script>

<button type="button" class="icon-btn phone-btn" aria-label={t('phone.open')} onclick={() => (open = true)}>
  <OfficialArt key={NOOKPHONE} size={30} eager>
    {#snippet fallback()}
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5.5" y="2.5" width="13" height="19" rx="4" fill="var(--c-bubble)" stroke="currentColor" stroke-width="2" />
        <rect x="8" y="6" width="3.2" height="3.2" rx="1" fill="var(--app-island)" /><rect x="12.8" y="6" width="3.2" height="3.2" rx="1" fill="var(--app-jar)" />
        <rect x="8" y="10.8" width="3.2" height="3.2" rx="1" fill="var(--app-lang)" /><rect x="12.8" y="10.8" width="3.2" height="3.2" rx="1" fill="var(--app-share)" />
      </svg>
    {/snippet}
  </OfficialArt>
</button>
<ShimaPhone bind:open />

<style>
  .phone-btn { background: var(--phone-bg); }
  .phone-btn svg { width: 28px; height: 28px; }
</style>
