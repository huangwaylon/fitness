<script lang="ts">
  // しまフォン → ことば: 日本語 | English.
  import { roving } from '../ui/roving.ts';
  import { setLanguage } from '#lib/store/actions.ts';
  import { t, i18n, type Locale } from '#lib/i18n/index.ts';

  const LANGS: { id: Locale; label: string }[] = [{ id: 'ja', label: '日本語' }, { id: 'en', label: 'English' }];
</script>

<div class="prows" role="radiogroup" aria-label={t('panel.lang')} {@attach roving}>
  {#each LANGS as l (l.id)}
    {@const on = i18n.locale === l.id}
    <button type="button" class="prow" role="radio" lang={l.id} aria-checked={on} tabindex={on ? 0 : -1} data-sfx={on ? 'none' : 'tick'} onclick={() => !on && setLanguage(l.id)}>
      <span class="prl">{l.label}</span><span class="radio" aria-hidden="true"></span>
    </button>
  {/each}
</div>

<style>
  .radio { width: 26px; height: 26px; border-radius: 50%; background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge); flex: none; }
  .prow[aria-checked='true'] .radio { background: radial-gradient(circle, var(--c-card) 0 5px, var(--c-leaf-edge) 6px); box-shadow: none; }
</style>
