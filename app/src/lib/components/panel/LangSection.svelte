<script lang="ts">
  // 設定 → 言語: one native dropdown (health/Pick, the kit's: iOS's own picker), 日本語 (the default) | English.
  import Pick from '../health/Pick.svelte';
  import { setLanguage } from '#lib/store/actions.ts';
  import { t, i18n, type Locale } from '#lib/i18n/index.ts';

  const LANGS: { id: Locale; label: string }[] = [{ id: 'ja', label: '日本語' }, { id: 'en', label: 'English' }];
</script>

<Pick kind="lang" value={i18n.locale} options={LANGS} label={t('panel.lang')} onpick={(l) => l !== i18n.locale && setLanguage(l)} />
