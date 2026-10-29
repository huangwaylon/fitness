<script lang="ts">
  // しまフォン → ことば: 日本語 | English.
  import { roving } from '../ui/roving.ts';
  import { setLanguage } from '#lib/store/actions.ts';
  import { t, i18n, type Locale } from '#lib/i18n/index.ts';

  const LANGS: { id: Locale; label: string }[] = [{ id: 'ja', label: '日本語' }, { id: 'en', label: 'English' }];
</script>

<div class="prows" role="radiogroup" aria-label={t('phone.app.lang')} {@attach roving}>
  {#each LANGS as l (l.id)}
    {@const on = i18n.locale === l.id}
    <button type="button" class="prow" role="radio" lang={l.id} aria-checked={on} tabindex={on ? 0 : -1} onclick={() => !on && setLanguage(l.id)}>
      <span class="prl">{l.label}</span><span class="radio" aria-hidden="true"></span>
    </button>
  {/each}
</div>

<style>
  .radio { width: 26px; height: 26px; border-radius: 50%; background: color-mix(in srgb, var(--lip) 60%, transparent); flex: none; }
  .prow[aria-checked='true'] .radio { background: radial-gradient(circle, var(--c-cream) 0 5px, var(--c-leaf) 6px); }
</style>
