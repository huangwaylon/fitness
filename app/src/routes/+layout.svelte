<script lang="ts">
  import { asset } from '$app/paths';
  import { routeOf } from '#lib/client/paths.ts';
  import '@fontsource/fredoka/600.css';
  import '@fontsource/fredoka/700.css';
  import '@fontsource/zen-maru-gothic/500.css';
  import '@fontsource/zen-maru-gothic/700.css';
  import '#lib/styles/tokens.css';
  import '#lib/styles/theme.css';
  import { onMount, type Snippet } from 'svelte';
  import { page } from '$app/state';
  import Sprites from '#lib/components/Sprites.svelte';
  import TabBar from '#lib/components/TabBar.svelte';
  import Bubble from '#lib/components/Bubble.svelte';
  import Host from '#lib/components/Host.svelte';
  import Toast from '#lib/components/Toast.svelte';
  import OfficialArt from '#lib/components/OfficialArt.svelte';
  import HarvestOverlay from '#lib/components/HarvestOverlay.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { ui } from '#lib/client/ui.svelte.ts';
  import { startTheme } from '#lib/client/theme.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { children }: { children: Snippet } = $props();

  const route = $derived(routeOf(page.url.pathname));
  const onPair = $derived(route.startsWith('/pair'));
  /** Page pattern (style guide §3): island dots, jar sand stripes. */
  const pageKind = $derived(route.startsWith('/jar') ? 'jar' : 'island');

  let laterFor = $state<string | null>(null);
  const harvest = $derived(week.view?.harvest ?? null);
  const showHarvest = $derived(
    !onPair && !!week.view && !!harvest && !harvest.confirmedBy.includes(week.view.me) && laterFor !== harvest.weekKey
  );
  // Pages hold their toasts while the harvest is up (U6).
  $effect(() => {
    ui.overlay = showHarvest;
  });

  onMount(() => {
    const stopTheme = startTheme();
    week.init();
    if (!routeOf(location.pathname).startsWith('/pair')) week.refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !routeOf(location.pathname).startsWith('/pair')) week.refresh({ background: true });
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
  <link rel="apple-touch-icon" href={asset('icons/apple-touch-icon-180.png')} />
  <link rel="icon" href={asset('icons/icon.svg')} type="image/svg+xml" />
</svelte:head>

<Sprites />

<!-- U9: the harvest is a real modal, so everything behind it is inert. -->
<div class="page" data-page={onPair ? 'pair' : pageKind} inert={showHarvest}>
{#if onPair}
  {@render children()}
{:else if !week.view && week.status === 'error'}
  <main class="state">
    <OfficialArt key="host/tom-nook" alt="" size={120} eager>
      {#snippet fallback()}<Host pose="stand" size={120} />{/snippet}
    </OfficialArt>
    <Bubble text={t('state.error')} host={false} />
    <button type="button" class="btn" onclick={() => week.refresh()}>{t('state.retry')}</button>
  </main>
{:else if !week.view}
  <main class="state" aria-busy="true">
    <span class="bob"><Host size={120} animate={false} eager /></span>
    <p>{t('state.loading')}</p>
    <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
  </main>
{:else}
  {@render children()}
{/if}
</div>

{#if !onPair}<div inert={showHarvest}><TabBar /></div>{/if}

{#if showHarvest && week.view && harvest}
  <HarvestOverlay view={week.view} {harvest} onlater={() => (laterFor = harvest.weekKey)} />
{/if}

{#if week.toast && !showHarvest}
  {#key week.toast.id}<Toast text={week.toast.text} />{/key}
{/if}

<style>
  .page { min-height: 100dvh; background: var(--pat-dots), var(--bg); }
  .page[data-page='jar'] { background: var(--pat-stripes), var(--bg); }
  .state {
    max-width: 360px; margin: 0 auto;
    min-height: 100dvh; display: grid; place-content: center; justify-items: center; gap: 14px; text-align: center;
    padding: var(--safe-top) 24px calc(var(--tabbar-h) + var(--safe-bottom) + 24px);
  }
  .state :global(.talk) { width: 100%; }
  .state p { margin: 0; font-size: var(--fs-talk); font-weight: 700; color: var(--text-soft); }
  .bob { display: block; transform-origin: 50% 100%; animation: if-hop 1.1s var(--ease-idle) infinite; }
  .dots { display: flex; gap: 8px; }
  .dots i { width: 10px; height: 10px; border-radius: 50%; background: var(--c-leaf); animation: if-nudge .9s var(--ease-idle) infinite; }
  .dots i:nth-child(2) { animation-delay: .15s; background: var(--c-yuzu); }
  .dots i:nth-child(3) { animation-delay: .3s; background: var(--c-coral); }
</style>
