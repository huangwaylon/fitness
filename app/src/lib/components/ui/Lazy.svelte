<script lang="ts" generics="C">
  // A part of a sheet in its own chunk, the one way to await a dynamic import in markup: the import goes through reload.ts
  // `lazy`, so a chunk a deploy removed reloads the page into the newer build; one that still fails (offline, or the
  // running build is the deployed one) says so in its place with もう一度 instead of leaving the slot blank. もう一度
  // asks for it again; failing again online, it reloads the page (lazySheet's way: WebKit keeps a failed module import
  // for the page's life). Nothing while it loads. Use: <Lazy load={() => import('./X.svelte')}>{#snippet children(X)}<X />{/snippet}</Lazy>
  // `floating`: a whole sheet's (the HUD's): its failure is lazySheet's, the island's toast with もう一度 (it goes by
  // itself), nothing left over the island.
  import type { Snippet } from 'svelte';
  import { lazy, safeReload } from '#lib/ui-state/reload.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { load, children, floating = false }: { load: () => Promise<{ default: C }>; children: Snippet<[C]>; floating?: boolean } = $props();
  const get = lazy(() => load());
  /** もう一度's taps: each asks again (lazy forgets a failed load). */
  let tries = $state(0);
  const attempt = (n: number) =>
    get().catch((e: unknown) => {
      if (n > 0 && navigator.onLine && safeReload(Date.now(), 'chunk')) throw e;
      if (floating) toasts.show(t(navigator.onLine ? 'common.loadFailed' : 'panel.sheetOffline'), 6000, { action: { label: t('panel.sheetRetry'), run: () => tries++ } });
      throw e;
    });
</script>

{#key tries}
  {#await attempt(tries) then m}
    {@render children(m.default)}
  {:catch}
    {#if !floating}
      <p class="failed" role="alert" data-lazy-failed>
        {t('common.loadFailed')}
        <button type="button" class="btn small paper" data-sfx="tick" onclick={() => tries++}>{t('state.retry')}</button>
      </p>
    {/if}
  {/await}
{/key}

<style>
  .failed {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 16px auto;
    color: var(--text-soft);
    font-size: 15px;
  }
</style>
