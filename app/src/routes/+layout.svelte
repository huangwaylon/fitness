<script lang="ts">
  import { asset, resolve } from '$app/paths';
  import { routeOf } from '#lib/ui-state/paths.ts';
  // Fredoka (numbers): the latin woff2 only (no hebrew / latin-ext subsets, no .woff fallbacks; round 8).
  import '@fontsource/fredoka/latin-600.css';
  import '@fontsource/fredoka/latin-700.css';
  // Zen Maru Gothic trimmed to the slices the app uses (round 5 P6; scripts/font-subsets.ts).
  import '#lib/styles/fonts.css';
  import '#lib/styles/tokens.css';
  import '#lib/styles/theme.css';
  import { onMount, type Snippet } from 'svelte';
  import type { HarvestView } from '#lib/types.ts';
  import { page, updated } from '$app/state';
  import Sprites from '#lib/components/ui/Sprites.svelte';
  import Bubble from '#lib/components/ui/Bubble.svelte';
  import Host from '#lib/components/characters/Host.svelte';
  import ToastHost from '#lib/components/ui/ToastHost.svelte';
  import OfficialArt from '#lib/components/characters/OfficialArt.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { startTheme } from '#lib/ui-state/theme.svelte.ts';
  import { jarTransition } from '#lib/ui-state/jarTransition.ts';
  import { lazy, safeReload } from '#lib/ui-state/reload.ts';
  import { t } from '#lib/i18n/index.ts';

  let { children }: { children: Snippet } = $props();

  const route = $derived(routeOf(page.url.pathname));
  const onPair = $derived(route.startsWith('/pair'));
  const pageKind = $derived(route.startsWith('/jar') ? 'jar' : 'island');

  let laterFor = $state<string | null>(null);
  /** The harvest being finished: kept through the end card even after confirming drops it from the view (U5). */
  let kept = $state<HarvestView | null>(null);
  const harvest = $derived(kept ?? week.view?.harvest ?? null);
  const showHarvest = $derived(
    !onPair && !!week.view && !!harvest && (!!kept || (!harvest.confirmedBy.includes(week.view.me) && laterFor !== harvest.weekKey))
  );
  // Pages hold their toasts while the harvest is up (U6).
  ui.provideOverlay(() => showHarvest);
  /** The overlay is loaded the first time a harvest opens (Sunday evening), not on every route (round 8). */
  const loadHarvest = lazy(() => import('#lib/components/sheets/HarvestOverlay.svelte'));

  // A new deploy (Kit checks _app/version.json when the app comes back to the front): reload into it once nothing
  // is open, so a resident PWA never keeps running an old build against new chunks.
  $effect(() => {
    if (updated.current && !onPair && !showHarvest && !ui.sheets.length) safeReload();
  });

  // 島 ⇄ 旅の壺: a zoom into the jar and back out of it.
  jarTransition();

  onMount(() => {
    const stopTheme = startTheme();
    week.init();
    if (!routeOf(location.pathname).startsWith('/pair')) week.refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !routeOf(location.pathname).startsWith('/pair')) week.refresh({ background: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    // Any other chunk that fails to load (Vite's preload helper reports it): a stale build, reload once.
    const onStale = () => safeReload();
    window.addEventListener('vite:preloadError', onStale);
    return () => {
      stopTheme();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('vite:preloadError', onStale);
    };
  });
</script>

<svelte:head>
  <title>{t('app.name')}</title>
  <meta name="theme-color" content="#FFF9E3" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="しまの貯金箱" />
  <link rel="apple-touch-icon" href={asset('icons/apple-touch-icon-180.png')} />
</svelte:head>

<Sprites />

<!-- U9: the harvest is a real modal, so everything behind it is inert. -->
<div class="page" data-page={onPair ? 'pair' : pageKind} inert={showHarvest}>
{#if week.status === 'unconfigured'}
  <main class="state">
    <span class="nook"><OfficialArt key="host/tom-nook" alt="" size="var(--nook-h)" eager>
      {#snippet fallback()}<Host pose="stand" size={96} />{/snippet}
    </OfficialArt></span>
    <h1><span lang="ja">{t('state.notSetUp', undefined, 'ja')}</span><small lang="en">{t('state.notSetUp', undefined, 'en')}</small></h1>
    <a class="btn" href={resolve('/') + '?demo'} data-sveltekit-reload>{t('state.tryDemo', undefined, 'ja')} · {t('state.tryDemo', undefined, 'en')}</a>
  </main>
{:else if onPair}
  {@render children()}
{:else if !week.view && week.status === 'error'}
  <main class="state">
    <span class="nook"><OfficialArt key="host/tom-nook" alt="" size="var(--nook-h)" eager>
      {#snippet fallback()}<Host pose="stand" size={96} />{/snippet}
    </OfficialArt></span>
    <Bubble text={t('state.error')} host={false} name={t('host.nook')} />
    <button type="button" class="btn" onclick={() => week.refresh()}>{t('state.retry')}</button>
  </main>
{:else if !week.view}
  <main class="state" aria-busy="true">
    <span class="bob"><Host size={96} animate={false} eager /></span>
    <p>{t('state.loading')}</p>
  </main>
{:else}
  {@render children()}
{/if}
</div>

{#if showHarvest && week.view && harvest}
  {#await loadHarvest() then { default: HarvestOverlay }}
    <HarvestOverlay view={week.view} {harvest} onlater={() => (laterFor = harvest.weekKey)}
      onkeep={() => (kept = $state.snapshot(harvest))} ondone={() => (kept = null)} />
  {/await}
{/if}

<!-- Inside the open sheet when there is one (Sheet.svelte): outside a modal dialog it would be inert (round 7 F1). -->
{#if !showHarvest && !ui.sheets.length}<ToastHost />{/if}

<style>
  .page { min-height: var(--vh-page); background: var(--bg); }
  /* 島: the island floats in the flat map sea, which runs on under the dialogue box and the action. */
  .page[data-page='island'] { background: var(--sea-flat); }
  /* Not set up / error / loading: one figure, one line, one action. */
  .state {
    --nook-h: 120px;
    max-width: 380px; margin: 0 auto;
    min-height: var(--vh-page); display: grid; place-content: center; justify-items: center; gap: 16px; text-align: center;
    padding: calc(var(--safe-top) + 24px) calc(var(--side) + 6px) calc(var(--pad-bottom) + 24px);
  }
  .state :global(.talk) { width: 100%; }
  .nook { line-height: 0; }
  .state h1 { display: grid; gap: 4px; text-wrap: balance; word-break: auto-phrase; }
  .state h1 small { font-size: var(--fs-body); color: var(--text-soft); }
  .state p { margin: 0; font-size: var(--fs-talk); font-weight: 700; color: var(--text-soft); }
  .bob { display: block; transform-origin: 50% 100%; animation: if-hop 1.1s var(--ease-idle) infinite; }
  @media (max-height: 700px), (max-width: 359px) { .state { --nook-h: 96px; gap: 12px; } }
</style>
