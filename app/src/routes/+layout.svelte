<script lang="ts">
  import '@fontsource/fredoka/500.css';
  import '@fontsource/fredoka/600.css';
  import '@fontsource/fredoka/700.css';
  import '@fontsource/zen-maru-gothic/500.css';
  import '@fontsource/zen-maru-gothic/700.css';
  import '#lib/components/theme.css';
  import { onMount, type Snippet } from 'svelte';
  import { page } from '$app/state';
  import Sprites from '#lib/components/Sprites.svelte';
  import TabBar from '#lib/components/TabBar.svelte';
  import HarvestOverlay from '#lib/components/HarvestOverlay.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { startTheme } from '#lib/client/theme.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { children }: { children: Snippet } = $props();

  const onPair = $derived(page.url.pathname.startsWith('/pair'));
  let laterFor = $state<string | null>(null);
  const harvest = $derived(week.view?.harvest ?? null);
  const showHarvest = $derived(
    !onPair && !!week.view && !!harvest && !harvest.confirmedBy.includes(week.view.me) && laterFor !== harvest.weekKey
  );

  onMount(() => {
    const stopTheme = startTheme();
    week.init();
    if (!location.pathname.startsWith('/pair')) week.refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !location.pathname.startsWith('/pair')) week.refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopTheme();
      document.removeEventListener('visibilitychange', onVisible);
    };
  });
</script>

<svelte:head>
  <title>{t('app.name')}</title>
  <meta name="theme-color" content="#FFF8E7" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="しまの貯金箱" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
  <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
</svelte:head>

<Sprites />

{#if onPair}
  {@render children()}
{:else if !week.view && week.status === 'error'}
  <main class="state">
    <svg viewBox="0 0 100 100" class="juni" aria-hidden="true"><use href="#v-juni" /></svg>
    <p>{t('state.error')}</p>
    <button type="button" class="btn small" onclick={() => week.refresh()}>{t('state.retry')}</button>
  </main>
{:else if !week.view}
  <main class="state" aria-busy="true">
    <svg viewBox="0 0 100 100" class="juni bob" aria-hidden="true"><use href="#v-juni" /></svg>
    <p>{t('state.loading')}</p>
  </main>
{:else}
  {@render children()}
{/if}

{#if !onPair}<TabBar />{/if}

{#if showHarvest && week.view && harvest}
  <HarvestOverlay view={week.view} {harvest} onlater={() => (laterFor = harvest.weekKey)} />
{/if}

{#if week.toast}
  {#key week.toast.id}
    <div class="toast" role="status">{week.toast.text}</div>
  {/key}
{/if}

<style>
  .state {
    min-height: 100dvh; display: grid; place-content: center; justify-items: center; gap: 14px; text-align: center;
    padding: var(--safe-top) 24px calc(var(--tabbar-h) + var(--safe-bottom) + 24px);
  }
  .state p { margin: 0; font-size: var(--fs-body-lg); font-weight: 700; color: var(--text-soft); }
  .juni { width: 96px; height: 96px; }
  .bob { animation: bob 1.2s ease-in-out infinite; }
  .toast {
    position: fixed; z-index: 80; left: 0; right: 0; margin: 0 auto; width: max-content; max-width: calc(100vw - 48px);
    top: calc(var(--safe-top) + 12px); padding: 12px 18px; border-radius: var(--r-pill);
    background: #fff; color: var(--ink); border: 2px solid var(--leaf); box-shadow: var(--sh-float);
    font-weight: 700; animation: drop .5s var(--ease-bounce) both;
  }
</style>
