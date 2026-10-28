<script lang="ts">
  import '@fontsource/fredoka/500.css';
  import '@fontsource/fredoka/600.css';
  import '@fontsource/fredoka/700.css';
  import '@fontsource/zen-maru-gothic/500.css';
  import '@fontsource/zen-maru-gothic/700.css';
  import '@fontsource/zen-maru-gothic/900.css';
  import '#lib/styles/tokens.css';
  import '#lib/components/theme.css';
  import { onMount, type Snippet } from 'svelte';
  import { page } from '$app/state';
  import Sprites from '#lib/components/Sprites.svelte';
  import TabBar from '#lib/components/TabBar.svelte';
  import Bubble from '#lib/components/Bubble.svelte';
  import Juniper from '#lib/components/Juniper.svelte';
  import HarvestOverlay from '#lib/components/HarvestOverlay.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { startTheme } from '#lib/client/theme.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { children }: { children: Snippet } = $props();

  const onPair = $derived(page.url.pathname.startsWith('/pair'));
  /** Page pattern (style guide §3): island dots, jar sand stripes, us pink dots. */
  const pageKind = $derived(page.url.pathname.startsWith('/jar') ? 'jar' : page.url.pathname.startsWith('/us') ? 'us' : 'island');

  /** Toasts go in the top layer (popover) so they sit above an open sheet's scrim. */
  function topLayer(node: HTMLElement) {
    try {
      node.showPopover?.();
    } catch {
      /* no popover support: stays a fixed element */
    }
  }
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

<div class="page" data-page={onPair ? 'pair' : pageKind}>
{#if onPair}
  {@render children()}
{:else if !week.view && week.status === 'error'}
  <main class="state">
    <Bubble text={t('state.error')} side="none" juniper={false} />
    <Juniper expression="surprised" size={120} />
    <button type="button" class="btn" onclick={() => week.refresh()}>{t('state.retry')}</button>
  </main>
{:else if !week.view}
  <main class="state" aria-busy="true">
    <span class="bob"><Juniper size={120} /></span>
    <p>{t('state.loading')}</p>
    <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
  </main>
{:else}
  {@render children()}
{/if}
</div>

{#if !onPair}<TabBar />{/if}

{#if showHarvest && week.view && harvest}
  <HarvestOverlay view={week.view} {harvest} onlater={() => (laterFor = harvest.weekKey)} />
{/if}

{#if week.toast}
  {#key week.toast.id}
    <div class="toast" role="status" popover="manual" use:topLayer>{week.toast.text}</div>
  {/key}
{/if}

<style>
  .page { min-height: 100dvh; background: var(--pat-dots), var(--bg); }
  .page[data-page='jar'] { background: var(--pat-stripes), var(--bg); }
  .page[data-page='us'] { background: var(--pat-dots-pink), var(--bg); }
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
  .toast {
    position: fixed; inset: auto 0; margin: 0 auto; width: max-content; max-width: calc(100vw - 48px);
    top: calc(var(--safe-top) + 12px); padding: 12px 20px; border-radius: var(--r-bubble); z-index: 90; overflow: visible;
    background: var(--toast-bg); color: var(--c-ink-talk); border: 0; box-shadow: 0 4px 0 var(--c-paper-2), var(--sh-float);
    font-weight: 700; font-size: var(--fs-body-lg); animation: if-pop var(--dur-pop) var(--ease-bounce) both;
  }
  .toast:popover-open { inset: auto 0; top: calc(var(--safe-top) + 12px); }
</style>
