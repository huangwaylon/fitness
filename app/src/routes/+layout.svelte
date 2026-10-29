<script lang="ts">
  import { asset, resolve } from '$app/paths';
  import { routeOf } from '#lib/client/paths.ts';
  import '@fontsource/fredoka/600.css';
  import '@fontsource/fredoka/700.css';
  import '@fontsource/zen-maru-gothic/500.css';
  import '@fontsource/zen-maru-gothic/700.css';
  import '#lib/styles/tokens.css';
  import '#lib/styles/theme.css';
  import { onMount, type Snippet } from 'svelte';
  import type { HarvestView } from '#lib/types.ts';
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
  /** Page background (style guide §3): island cream dots, jar Miles+ periwinkle. */
  const pageKind = $derived(route.startsWith('/jar') ? 'jar' : 'island');

  let laterFor = $state<string | null>(null);
  /** The harvest being finished: kept through the end card even after confirming drops it from the view (U5). */
  let kept = $state<HarvestView | null>(null);
  const harvest = $derived(kept ?? week.view?.harvest ?? null);
  const showHarvest = $derived(
    !onPair && !!week.view && !!harvest && (!!kept || (!harvest.confirmedBy.includes(week.view.me) && laterFor !== harvest.weekKey))
  );
  // Pages hold their toasts while the harvest is up (U6).
  $effect(() => {
    ui.overlay = showHarvest;
  });

  // v4 palette for the browser chrome (§1.2). theme.svelte.ts (read-only here) still writes the v3 colours
  // into <meta name="theme-color">, so translate them whenever it does.
  const META: Record<string, string> = { '#1F2A44': '#33417A', '#FFF8E7': '#FFF9E3' };
  function themeColor() {
    const m = document.querySelector('meta[name="theme-color"]');
    if (!m) return () => {};
    const fix = () => {
      const c = m.getAttribute('content') ?? '';
      if (META[c]) m.setAttribute('content', META[c]);
    };
    fix();
    const mo = new MutationObserver(fix);
    mo.observe(m, { attributes: true, attributeFilter: ['content'] });
    return () => mo.disconnect();
  }

  /** Banner reaction icon for the store's toasts (§T.3): the text says which event it was. */
  function reactionFor(text: string): string {
    const map: [string, string][] = [
      ['state.saveFailed', 'sheepishness'], ['pending.saved', 'pleased'],
      ['jar.paydayNoted', 'pleased'], ['purse.enjoy', 'joy'], ['purse.waiting', 'thought']
    ];
    return map.find(([k]) => t(k) === text)?.[1] ?? 'happiness';
  }

  onMount(() => {
    const stopTheme = startTheme();
    const stopMeta = themeColor();
    week.init();
    if (!routeOf(location.pathname).startsWith('/pair')) week.refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !routeOf(location.pathname).startsWith('/pair')) week.refresh({ background: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopTheme();
      stopMeta();
      document.removeEventListener('visibilitychange', onVisible);
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
  <link rel="icon" href={asset('icons/icon.svg')} type="image/svg+xml" />
</svelte:head>

<Sprites />

<!-- U9: the harvest is a real modal, so everything behind it is inert. -->
<div class="page" data-page={onPair ? 'pair' : pageKind} inert={showHarvest}>
{#if week.status === 'unconfigured'}
  <main class="state">
    <span class="nook"><OfficialArt key="host/tom-nook" alt="" size="var(--nook-h)" eager>
      {#snippet fallback()}<Host pose="stand" size={96} />{/snippet}
    </OfficialArt></span>
    <h1 class="unset"><span lang="ja">{t('state.notSetUp', undefined, 'ja')}</span><span lang="en">{t('state.notSetUp', undefined, 'en')}</span></h1>
    <p lang="ja">{t('state.notSetUpHint', undefined, 'ja')}</p>
    <p lang="en" class="en">{t('state.notSetUpHint', undefined, 'en')}</p>
    <a class="btn" href={resolve('/') + '?demo'} data-sveltekit-reload>{t('state.tryDemo', undefined, 'ja')} · {t('state.tryDemo', undefined, 'en')}</a>
  </main>
{:else if onPair}
  {@render children()}
{:else if !week.view && week.status === 'error'}
  <main class="state">
    <span class="nook"><OfficialArt key="host/tom-nook" alt="" size="var(--nook-h)" eager>
      {#snippet fallback()}<Host pose="stand" size={96} />{/snippet}
    </OfficialArt></span>
    <Bubble text={t('state.error')} host={false} name={t('host.nook')} tag="var(--card-teal)" />
    <button type="button" class="btn" onclick={() => week.refresh()}>{t('state.retry')}</button>
  </main>
{:else if !week.view}
  <main class="state" aria-busy="true">
    <span class="bob"><Host size={96} animate={false} eager /></span>
    <p>{t('state.loading')}</p>
    <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
  </main>
{:else}
  {@render children()}
{/if}
</div>

{#if !onPair && week.status !== 'unconfigured'}<div inert={showHarvest}><TabBar /></div>{/if}

{#if showHarvest && week.view && harvest}
  <HarvestOverlay view={week.view} {harvest} onlater={() => (laterFor = harvest.weekKey)}
    onkeep={() => (kept = $state.snapshot(harvest))} ondone={() => (kept = null)} />
{/if}

{#if week.toast && !showHarvest}
  {#key week.toast.id}<Toast text={week.toast.text} reaction={week.toast.reaction ?? reactionFor(week.toast.text)}
    action={week.toast.action} />{/key}
{/if}

<style>
  .page { min-height: 100dvh; background: var(--pat-dots), var(--bg); }
  .page[data-page='jar'] { background: var(--page-jar); }
  .state {
    --nook-h: 120px;
    max-width: 380px; margin: 0 auto;
    min-height: 100dvh; display: grid; place-content: center; justify-items: center; gap: 14px; text-align: center;
    padding: calc(var(--safe-top) + 24px) calc(var(--side) + 6px) calc(var(--dock-h) + var(--dock-bottom) + 24px);
  }
  .state :global(.talk) { width: 100%; }
  .nook { line-height: 0; }
  .unset { margin: 0; display: grid; gap: 2px; font-size: var(--fs-h2); }
  .unset [lang='en'], .state .en { font-size: .85em; }
  .state p { margin: 0; font-size: var(--fs-body-lg); font-weight: 700; color: var(--text-soft); text-wrap: balance; }
  .bob { display: block; transform-origin: 50% 100%; animation: if-hop 1.1s var(--ease-idle) infinite; }
  .dots { display: flex; gap: 8px; }
  .dots i { width: 10px; height: 10px; border-radius: 50%; background: var(--c-leaf); animation: if-nudge .9s var(--ease-idle) infinite; }
  .dots i:nth-child(2) { animation-delay: .15s; background: var(--c-yuzu); }
  .dots i:nth-child(3) { animation-delay: .3s; background: var(--c-coral); }
  @media (max-height: 700px), (max-width: 359px) { .state { --nook-h: 96px; gap: 10px; } }
</style>
