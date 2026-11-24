<script lang="ts">
  import { asset } from '$app/paths';
  import { isBare, routeOf } from '#lib/ui-state/paths.ts';
  // Fredoka (numbers): the latin woff2 only (no hebrew / latin-ext subsets, no .woff fallbacks).
  import '#lib/styles/fredoka.css';
  // Zen Maru Gothic: kana, 常用 and the app's other kanji, a file each a weight (scripts/font-subsets.ts).
  import '#lib/styles/fonts.css';
  import '#lib/styles/tokens.css';
  import '#lib/styles/theme.css';
  import { onMount, type Snippet } from 'svelte';
  import { page } from '$app/state';
  import Sprites from '#lib/components/ui/Sprites.svelte';
  import ToastHost from '#lib/components/ui/ToastHost.svelte';
  import { shot } from '#lib/components/rooms/shot.svelte.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { startViewport } from '#lib/ui-state/viewport.ts';
  import { startModality } from '#lib/components/ui/modality.ts';
  import { t } from '#lib/i18n/index.ts';

  let { children }: { children: Snippet } = $props();

  const route = $derived(routeOf(page.url.pathname));
  /** A 共有リンク's page (routes/s) or the LINE menu's ジム (routes/gym): bare, a phone without the app's key (no sync, no
   *  room, no sound, no log, no service worker), so the app's shell (./AppShell.svelte: the week, the world, the sound,
   *  the log, the harvest) is never loaded for it: a stranger's first load is the page's own chunks. index.html
   *  modulepreloads the shell (scripts/headers.ts), so the island's import of it is no wave of its own. */
  const onShare = $derived(isBare(route));
  let Shell = $state<typeof import('./AppShell.svelte').default | null>(null);
  let asked = false;
  $effect(() => {
    if (onShare || asked) return;
    asked = true;
    // a chunk not fetched: a stale build, reloaded once (ui-state/reload.ts, imported only then: it holds the log)
    void import('./AppShell.svelte').then((m) => (Shell = m.default), (e: unknown) => import('#lib/ui-state/reload.ts').then((r) => {
      if (r.isChunkError(e)) void r.reloadUnlessLeaving();
    }));
  });

  // (no scene theme here: the page is the paper, its theme-color the head's, never the island's sky)
  onMount(() => {
    if (!isBare(routeOf(location.pathname))) return;
    const stops = [startViewport(), startModality()];
    return () => stops.forEach((f) => f());
  });
</script>

<svelte:head>
  <!-- (a bare page names itself: ジム, 共有リンク) -->
  {#if !onShare}<title>{t('app.name')}</title>{/if}
  <meta name="theme-color" content="#FFF9E3" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="しまの貯金箱" />
  <link rel="apple-touch-icon" href={asset('icons/apple-touch-icon-180.png')} />
</svelte:head>

{#if onShare}
  <Sprites />
  <div class="page" data-page={route === '/gym' ? 'gym' : 'share'}>{@render children()}</div>
  <!-- Inside the open sheet when there is one (Sheet.svelte): outside a modal dialog it would be inert. -->
  {#if !ui.sheets.length && !shot.bare}<ToastHost />{/if}
{:else if Shell}
  <Shell {children} />
{/if}

<style>
  .page { min-height: var(--vh-page); background: var(--bg); }
</style>
