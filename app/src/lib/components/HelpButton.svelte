<script lang="ts">
  import Sheet from './Sheet.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { topic }: { topic: 'island' | 'jar' | 'us' } = $props();
  let open = $state(false);
</script>

<button type="button" class="icon-btn" aria-label={t('common.help')} onclick={() => (open = true)}>?</button>
<Sheet bind:open label={t('common.help')}>
  <div class="help">
    <svg viewBox="0 0 100 100" class="juni" aria-hidden="true"><use href="#v-juni" /></svg>
    <p>{t(`help.${topic}`)}</p>
  </div>
  <button type="button" class="btn quiet" onclick={() => (open = false)}>{t('common.close')}</button>
</Sheet>

<style>
  .help { display: flex; gap: 14px; align-items: flex-start; margin: 4px 0 18px; }
  .juni { width: 64px; height: 64px; flex: none; }
  p { margin: 6px 0 0; font-size: var(--fs-body-lg); font-weight: 700; line-height: 1.55; }
</style>
