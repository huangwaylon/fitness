<script lang="ts" generics="C">
  // A part of a sheet in its own chunk, the one way to await a dynamic import in markup: the import goes through reload.ts
  // `lazy`, so a chunk a deploy removed reloads the page into the newer build; one that still fails (offline, or the
  // running build is the deployed one) says so in its place with もういちど instead of leaving the slot blank. もういちど
  // asks for it again; failing again online, it reloads the page (lazySheet's way: WebKit keeps a failed module import
  // for the page's life). Nothing while it loads. Use: <Lazy load={() => import('./X.svelte')}>{#snippet children(X)}<X />{/snippet}</Lazy>
  // `floating`: a whole sheet's (the HUD's), its failure a card over the island instead of a line in its slot.
  import type { Snippet } from 'svelte';
  import { lazy, safeReload } from '#lib/ui-state/reload.ts';
  import { t } from '#lib/i18n/index.ts';

  let { load, children, floating = false }: { load: () => Promise<{ default: C }>; children: Snippet<[C]>; floating?: boolean } = $props();
  const get = lazy(() => load());
  /** もういちど's taps: each asks again (lazy forgets a failed load). */
  let tries = $state(0);
  const attempt = (n: number) =>
    get().catch((e: unknown) => {
      if (n > 0 && navigator.onLine) safeReload(Date.now(), 'chunk');
      throw e;
    });
</script>

{#key tries}
  {#await attempt(tries) then m}
    {@render children(m.default)}
  {:catch}
    <p class="failed" class:floating role="alert" data-lazy-failed>
      {t('common.loadFailed')}
      <button type="button" class="btn small paper" data-sfx="tick" onclick={() => tries++}>{t('panel.sheetRetry')}</button>
    </p>
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
  .floating {
    position: fixed;
    z-index: var(--z-toast);
    left: 50%;
    top: calc(var(--hud-top) + 56px);
    transform: translateX(-50%);
    margin: 0;
    padding: 10px 14px;
    width: max-content;
    max-width: calc(100vw - 32px);
    border-radius: 14px;
    background: var(--card);
    box-shadow: 0 2px 0 var(--lip);
  }
</style>
