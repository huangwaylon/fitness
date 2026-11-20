<script module lang="ts">
  // The visitor's language (日本語 / English): the one kept this session (sessionStorage: never the app's own locale,
  // localStorage's, a member's phone opening the link keeps its own), else the browser's (navigator.language ja*: 日本語).
  import { setLocale, type Locale } from '#lib/i18n/index.ts';

  const KEY = 'island.share.lang';
  const kv = (): Storage | null => {
    try {
      return sessionStorage;
    } catch {
      return null;
    }
  };

  export function startLang(): void {
    const kept = kv()?.getItem(KEY);
    setLocale(kept === 'ja' || kept === 'en' ? kept : /^ja\b/i.test(navigator.language ?? '') ? 'ja' : 'en');
  }

  function pickLang(l: Locale): void {
    setLocale(l);
    try {
      kv()?.setItem(KEY, l);
    } catch {
      /* this page only */
    }
  }
</script>

<script lang="ts">
  import { i18n, t } from '#lib/i18n/index.ts';
  import Segmented from '../ui/Segmented.svelte';

  const ITEMS = [{ id: 'ja', label: '日本語' }, { id: 'en', label: 'English' }] as const;
</script>

<div class="lang"><Segmented items={ITEMS} value={i18n.locale} label={t('link.lang')} attr="share-lang" size="s" onpick={pickLang} /></div>

<style>
  .lang { display: flex; align-items: center; }
</style>
