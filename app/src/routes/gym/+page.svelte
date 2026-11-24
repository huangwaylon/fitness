<script lang="ts">
  // `/gym#<key>`: the LINE menu's 📱 アプリで設定 (gym/README.md), ジム's page alone (components/bots/GymPage.svelte)
  // with the link's key (lib/gym/linkKey.ts): LINE's browser has no key of its own. Served as its own shell
  // (build-pages/gym.html: scripts/headers.ts); the root layout runs bare here, as for 共有リンク (routes/s).
  import { onMount } from 'svelte';
  import '#lib/i18n/bots.ts';
  import { t } from '#lib/i18n/index.ts';
  import { takeLinkKey } from '#lib/gym/linkKey.ts';
  import GymPage from '#lib/components/bots/GymPage.svelte';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import Phrases from '#lib/components/ui/Phrases.svelte';

  let shown = $state<'wait' | 'page' | 'none'>('wait');

  onMount(() => {
    const key = takeLinkKey(location.hash);
    if (location.hash) history.replaceState(history.state, '', location.pathname + location.search); // the key leaves the URL
    shown = key ? 'page' : 'none';
  });
</script>

<main class="gym-link sheet-copy" data-gym-link={shown}>
  <NavBar title={t('bots.gym')} pad />
  <div class="body">
    {#if shown === 'page'}
      <GymPage />
    {:else if shown === 'none'}
      <p class="card pad none" data-gym-link-none><Phrases text={t('bots.link.none')} /></p>
    {/if}
  </div>
</main>

<style>
  .gym-link { min-height: var(--vh-page); background: var(--bg); display: flex; flex-direction: column; }
  /* BotsSheet's scroller's rhythm, the page's own scroll */
  .body {
    width: min(560px, 100%); margin: 0 auto; box-sizing: border-box; display: flex; flex-direction: column; gap: 14px;
    padding: 6px calc(16px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(16px + var(--safe-left));
  }
  .body > :global(*) { flex: none; }
  .none { margin: 24px 0 0; text-align: center; }
</style>
