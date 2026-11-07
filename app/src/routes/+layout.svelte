<script lang="ts">
  import { asset, resolve } from '$app/paths';
  import { routeOf } from '#lib/ui-state/paths.ts';
  // Fredoka (numbers): the latin woff2 only (no hebrew / latin-ext subsets, no .woff fallbacks).
  import '@fontsource/fredoka/latin-600.css';
  import '@fontsource/fredoka/latin-700.css';
  // Zen Maru Gothic trimmed to the slices the app uses (scripts/font-subsets.ts).
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
  import { startWeather } from '#lib/components/island/weatherNow.svelte.ts';
  import { startViewport } from '#lib/ui-state/viewport.ts';
  import { doorTransition } from '#lib/ui-state/doorTransition.ts';
  import { isChunkError, lazy, newWorker, reloadUnlessLeaving, safeReload } from '#lib/ui-state/reload.ts';
  import { registerLate, releaseWorker } from '#lib/ui-state/swLate.ts';
  import { opensIsland } from '#lib/ui-state/boot.ts';
  import { musicNow, startSound } from '#lib/sound/sound.svelte.ts';
  import { acked, bindStage, hear, hush, request, stage } from '#lib/sound/stage.svelte.ts';
  import { hooksOn } from '#lib/ui-state/preview.ts';
  import { world } from '#lib/store/world.svelte.ts';
  import { startTaps } from '#lib/sound/taps.ts';
  import { startExactTaps } from '#lib/ui-state/exactTaps.ts';
  import { startModality } from '#lib/components/ui/modality.ts';
  import { count, startLog } from '#lib/sync/log.ts';
  import { logUrl } from '#lib/sync/transport.ts';
  import { queued } from '#lib/sync/queue.ts';
  import { frameRate } from '#lib/store/frameRate.svelte.ts';
  import { version } from '$app/env';
  import { setLiveBuild } from '#lib/sync/live.ts';
  import { t } from '#lib/i18n/index.ts';

  let { children }: { children: Snippet } = $props();

  // the live socket's hello says the build (the relay logs it: docs/ops/observability.md)
  setLiveBuild(version);

  const route = $derived(routeOf(page.url.pathname));
  const onPair = $derived(route.startsWith('/pair'));
  const pageKind = $derived(route.startsWith('/tent') ? 'tent' : 'island');

  let laterFor = $state<string | null>(null);
  /** The harvest being finished: kept through the end card even after confirming drops it from the view. */
  let kept = $state<HarvestView | null>(null);
  const harvest = $derived(kept ?? week.view?.harvest ?? null);
  const showHarvest = $derived(
    !onPair && !page.error && !!week.view && week.view.viewer !== 'G' && !!harvest && (!!kept || (!harvest.confirmedBy.includes(week.view.me) && laterFor !== harvest.weekKey))
  );
  // Pages hold their toasts while the harvest is up.
  ui.provideOverlay(() => showHarvest);
  /** The overlay is loaded the first time a harvest opens (Sunday evening), not on every route. */
  const loadHarvest = lazy(() => import('#lib/components/sheets/HarvestOverlay.svelte'));
  let Harvest = $state<typeof import('#lib/components/sheets/HarvestOverlay.svelte').default | null>(null);
  // Loaded in script, so the page goes inert only once the overlay can show; a failed load (and no reload) leaves the
  // island usable and treats it as あとで, instead of an inert page with nothing on it.
  $effect(() => {
    if (!showHarvest || Harvest) return;
    const wk = harvest?.weekKey ?? null;
    loadHarvest().then((m) => (Harvest = m.default), () => (laterFor = wk));
  });

  // A new deploy (Kit checks _app/version.json when the app comes back to the front): reload into it once nothing
  // is open, so a resident PWA never keeps running an old build against new chunks. Only once the new build's service
  // worker controls the page (newWorker): it serves the reload its own shell, from its cache (before, the reload was
  // the old build's cached shell again). Its install failed or can't be had now: asked again as the app comes back.
  let workerReady = $state(false);
  let askWorker = $state(0);
  $effect(() => {
    void askWorker;
    if (updated.current && !workerReady) void newWorker().then((ok) => (workerReady = ok));
  });
  $effect(() => {
    if (workerReady && !onPair && !showHarvest && !ui.sheets.length) safeReload(Date.now(), 'update');
  });

  // the service worker once the island is up (ui-state/swLate.ts); a screen with no island coming releases it
  $effect(() => {
    if (week.status === 'unconfigured' || (!week.view && week.status === 'error')) releaseWorker();
  });

  // the log's coarse usage: which routes are opened (sync/log.ts `use`)
  $effect(() => {
    count(`route:${route.split('/')[1] || 'island'}`);
  });

  // 島 ⇄ テント: NH's door, a black iris on the door we go through.
  doorTransition();

  onMount(() => {
    registerLate(route === '/' && opensIsland());
    const stopTheme = startTheme();
    const stopWeather = startWeather();
    week.init();
    if (!routeOf(location.pathname).startsWith('/pair')) week.refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') askWorker++;
      if (document.visibilityState === 'visible' && !routeOf(location.pathname).startsWith('/pair')) week.refresh({ background: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    // Any other chunk that fails to load (Vite's preload helper reports it): a stale build, reload once (not as we leave).
    // Only a chunk not fetched: the helper reports every lazy import that rejects, a module that threw as it ran too
    // (the sound's renderer, the villagers' birthdays, K.K.'s songs), which a reload doesn't cure.
    const onStale = (e: Event) => {
      if (isChunkError((e as Event & { payload?: unknown }).payload)) void reloadUnlessLeaving();
    };
    window.addEventListener('vite:preloadError', onStale);
    const stopViewport = startViewport();
    // a touch's click where the finger was, over the island and in the rooms (no snapping onto a door nearby)
    const stopExactTaps = startExactTaps();
    // Sound (all off by default): unlocks on the first tap, muffles the music under a sheet, the panel or the harvest.
    const stopSound = startSound({ muffled: () => ui.sheets.length > 0 || showHarvest });
    // the shared music stages (K.K., the stereos: sound/stage.svelte.ts) over the shared world's relay; the e2e's look
    bindStage({ send: (i) => i.kind === 'music' && world.tell(i), serverNow: () => world.serverNow(), me: () => world.me });
    const offStage = [world.hear((m) => m.kind === 'music' && hear(m)), world.onAck(acked)];
    if (week.demo || hooksOn(new URLSearchParams(location.search))) window.__music = { now: musicNow, stage: () => $state.snapshot(stage), request, hush };
    // every tap's sound (data-sfx) and the "can't" boop (aria-disabled): after startSound, so its unlock runs first
    const stopTaps = startTaps();
    // no focus ring after a touch (focus is still restored for keyboard and VoiceOver users)
    const stopModality = startModality();
    // the log (sync/log.ts, docs/ops/observability.md): errors, the lifecycle, the island's load and frames
    const stopLog = startLog({
      build: version, url: logUrl(), demo: !!week.demo, route: () => routeOf(location.pathname),
      ready: () => !!document.querySelector('canvas[data-w3d][data-loaded]'),
      queue: () => {
        const q = queued();
        return { n: q.length, ageMs: q.length ? Date.now() - Math.min(...q.map((e) => e.queuedAt)) : 0 };
      },
      fpsPref: () => frameRate.fps
    });
    return () => {
      stopLog();
      stopModality();
      stopTaps();
      stopSound();
      offStage.forEach((f) => f());
      stopViewport();
      stopExactTaps();
      stopTheme();
      stopWeather();
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

<!-- The harvest is a real modal, so everything behind it is inert. -->
<div class="page" data-page={onPair ? 'pair' : pageKind} inert={showHarvest && !!Harvest}>
{#if week.status === 'unconfigured'}
  <main class="state sheet-copy">
    <span class="nook"><OfficialArt key="host/tom-nook" alt="" size="var(--nook-h)" eager>
      {#snippet fallback()}<Host pose="stand" size={96} />{/snippet}
    </OfficialArt></span>
    <h1><span lang="ja">{t('state.notSetUp', undefined, 'ja')}</span><small lang="en">{t('state.notSetUp', undefined, 'en')}</small></h1>
    <a class="btn" href={resolve('/') + '?demo'} data-sveltekit-reload data-sfx="confirm">{t('state.tryDemo', undefined, 'ja')} · {t('state.tryDemo', undefined, 'en')}</a>
  </main>
{:else if onPair}
  {@render children()}
{:else if !week.view && week.status === 'error'}
  <main class="state sheet-copy">
    <span class="nook"><OfficialArt key="host/tom-nook" alt="" size="var(--nook-h)" eager>
      {#snippet fallback()}<Host pose="stand" size={96} />{/snippet}
    </OfficialArt></span>
    <Bubble text={t('state.error')} host={false} name={t('host.nook')} />
    <button type="button" class="btn" data-sfx="sync" onclick={() => week.refresh()}>{t('state.retry')}</button>
  </main>
{:else if !week.view}
  <main class="state sheet-copy" aria-busy="true">
    <span class="bob"><Host size={96} animate={false} eager /></span>
    <p>{t('state.loading')}</p>
  </main>
{:else}
  {@render children()}
{/if}
</div>

{#if showHarvest && week.view && harvest && Harvest}
  <Harvest view={week.view} {harvest} onlater={() => (laterFor = harvest.weekKey)}
    onkeep={() => (kept = $state.snapshot(harvest))} ondone={() => (kept = null)} />
{/if}

<!-- Inside the open sheet when there is one (Sheet.svelte): outside a modal dialog it would be inert. -->
{#if !showHarvest && !ui.sheets.length}<ToastHost />{/if}

<style>
  .page { min-height: var(--vh-page); background: var(--bg); }
  /* 島: the island floats in the flat map sea, which runs on under the dialogue box and the action. */
  .page[data-page='island'] { background: var(--sea-flat); }
  .page[data-page='tent'] { background: #2a1f17; }
  /* not set up / error: on the tan panel, not the sea (the soft ink line is only 2.1:1 on the sea blue) */
  .page[data-page='island']:has(> .state:not([aria-busy])) { background: var(--bg); }
  /* Not set up / error / loading: one figure, one line, one action. */
  .state {
    --nook-h: 120px;
    max-width: 380px; margin: 0 auto;
    min-height: var(--vh-page); display: grid; place-content: center stretch; justify-items: center; gap: 16px; text-align: center;
    padding: calc(var(--ui-top) + 24px) calc(var(--side) + 6px) calc(var(--pad-bottom) + 24px);
  }
  .state :global(.talk) { width: 100%; }
  .nook { line-height: 0; }
  .state h1 { display: grid; gap: 4px; text-wrap: balance; }
  .state h1 small { font-size: var(--fs-body); color: var(--text-soft); }
  .state p { margin: 0; font-size: var(--fs-talk); font-weight: 700; color: var(--text-soft); }
  .bob { display: block; transform-origin: 50% 100%; animation: if-hop 1.1s var(--ease-idle) infinite; }
  @media (max-height: 700px), (max-width: 359px) { .state { --nook-h: 96px; gap: 12px; } }
</style>
