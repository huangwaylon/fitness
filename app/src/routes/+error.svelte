<script lang="ts">
  // Any route error or unknown URL (round 5 U1): Tom Nook and a cozy bilingual line instead of SvelteKit's raw
  // "500 Internal Error", with safe areas, and two ways back: the island and the demo.
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import OfficialArt from '#lib/components/OfficialArt.svelte';
  import Host from '#lib/components/Host.svelte';
  import { t } from '#lib/i18n/index.ts';

  const notFound = $derived(page.status === 404);
  const title = (l: 'ja' | 'en') => t(notFound ? 'error.notFound' : 'error.title', undefined, l);
</script>

<svelte:head><title>{t('app.name')}</title></svelte:head>

<main class="err">
  <span class="nook"><OfficialArt key="host/tom-nook" alt="" size="var(--nook-h)" eager>
    {#snippet fallback()}<Host pose="stand" size={96} animate={false} />{/snippet}
  </OfficialArt></span>
  <h1><span lang="ja">{title('ja')}</span><span lang="en">{title('en')}</span></h1>
  {#if !notFound}
    <p><span lang="ja">{t('error.hint', undefined, 'ja')}</span> <span lang="en">{t('error.hint', undefined, 'en')}</span></p>
  {/if}
  <a class="btn" href={resolve('/')} data-sveltekit-reload>
    <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-island" /></svg>
    <span class="two"><span lang="ja">{t('error.home', undefined, 'ja')}</span><small lang="en">{t('error.home', undefined, 'en')}</small></span>
  </a>
  <a class="demo" href={resolve('/') + '?demo'} data-sveltekit-reload>{t('state.tryDemo', undefined, 'ja')} · {t('state.tryDemo', undefined, 'en')}</a>
</main>

<style>
  .err {
    --nook-h: 120px;
    max-width: 380px; margin: 0 auto; min-height: 100dvh; display: grid; place-content: center; justify-items: center; gap: 14px;
    text-align: center; background: var(--pat-dots), var(--bg); color: var(--text);
    padding: calc(var(--safe-top) + 24px) calc(var(--side) + var(--safe-right) + 6px) calc(var(--dock-h) + var(--dock-bottom) + 24px) calc(var(--side) + var(--safe-left) + 6px);
  }
  .nook { line-height: 0; }
  h1 { margin: 0; display: grid; gap: 4px; font-size: var(--fs-h2); text-wrap: balance; word-break: auto-phrase; }
  h1 [lang='en'] { font-size: .85em; color: var(--text-soft); }
  p { margin: 0; font-weight: 700; color: var(--text-soft); text-wrap: balance; }
  .btn { width: 100%; text-decoration: none; }
  .two { display: grid; line-height: 1.2; text-align: left; }
  .two small { font-size: var(--fs-caption); }
  .btn svg { width: 22px; height: 22px; }
  .demo { min-height: 44px; display: inline-flex; align-items: center; font-weight: 700; color: var(--text-soft); }
  @media (max-height: 700px), (max-width: 359px) { .err { --nook-h: 96px; gap: 10px; } }
</style>
