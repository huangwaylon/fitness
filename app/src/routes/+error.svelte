<script lang="ts">
  // Any route error or unknown URL: Tom Nook and a cozy bilingual line instead of SvelteKit's raw
  // "500 Internal Error", with safe areas, and a way back to the island.
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import NookScreen from '#lib/components/ui/NookScreen.svelte';
  import { loadEnglish, t as tr } from '#lib/i18n/index.ts';

  // the English lines once its catalog is in (it loads lazily; until then nothing is shown twice)
  let en = $state(false);
  $effect(() => void loadEnglish().then(() => (en = true), () => {}));
  const t = (key: string, params: undefined, l: 'ja' | 'en') => (l === 'en' && !en ? '' : tr(key, params, l));
  const notFound = $derived(page.status === 404);
  const title = (l: 'ja' | 'en') => t(notFound ? 'error.notFound' : 'error.title', undefined, l);
</script>

<svelte:head><title>{tr('app.name')}</title></svelte:head>

<NookScreen>
  <h1><span lang="ja">{title('ja')}</span><small lang="en">{title('en')}</small></h1>
  {#if !notFound}
    <p><span lang="ja">{t('error.hint', undefined, 'ja')}</span> <span lang="en">{t('error.hint', undefined, 'en')}</span></p>
  {/if}
  <a class="btn" href={resolve('/')} data-sveltekit-reload data-sfx="confirm" data-error-home>
    <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-island" /></svg>
    <span class="two"><span lang="ja">{t('error.home', undefined, 'ja')}</span><small lang="en">{t('error.home', undefined, 'en')}</small></span>
  </a>
</NookScreen>

<style>
  .btn { text-decoration: none; }
  .two { display: grid; line-height: 1.2; text-align: left; }
  .two small { font-size: var(--fs-s); }
  .btn svg { width: 22px; height: 22px; }
</style>
