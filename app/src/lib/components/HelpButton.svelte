<script lang="ts">
  // The しまフォン button (top right): a 44px phone glyph that opens the launcher.
  import ShimaPhone from './ShimaPhone.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { topic }: { topic: 'island' | 'jar' | 'us' } = $props();
  let open = $state(false);
</script>

<button type="button" class="icon-btn phone-btn" aria-label={t('phone.open')} onclick={() => (open = true)}>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5.5" y="2.5" width="13" height="19" rx="4" fill="var(--phone-bg)" stroke="currentColor" stroke-width="2" />
    <rect x="8" y="6" width="3.2" height="3.2" rx="1" fill="var(--app-island)" /><rect x="12.8" y="6" width="3.2" height="3.2" rx="1" fill="var(--app-jar)" />
    <rect x="8" y="10.8" width="3.2" height="3.2" rx="1" fill="var(--app-us)" /><rect x="12.8" y="10.8" width="3.2" height="3.2" rx="1" fill="var(--app-help)" />
    <path d="M10.5 18h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>
</button>
<ShimaPhone bind:open {topic} />

<style>
  .phone-btn svg { width: 28px; height: 28px; color: var(--c-ink); }
  :global(:root[data-theme="night"]) .phone-btn svg { color: var(--text); }
</style>
