<script lang="ts">
  import { page } from '$app/state';
  import { t } from '#lib/i18n/index.ts';

  const tabs = [
    { href: '/', icon: 'i-island', key: 'tab.island' },
    { href: '/jar', icon: 'i-jar', key: 'tab.jar' },
    { href: '/us', icon: 'i-us', key: 'tab.us' }
  ];
  const path = $derived(page.url.pathname);
</script>

<nav class="tabbar" aria-label={t('tab.label')}>
  {#each tabs as tab (tab.href)}
    {@const on = tab.href === '/' ? path === '/' : path.startsWith(tab.href)}
    <a class="tab" class:on href={tab.href} aria-current={on ? 'page' : undefined}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#{tab.icon}" /></svg>
      <span>{t(tab.key)}</span>
    </a>
  {/each}
</nav>

<style>
  .tabbar {
    position: fixed; z-index: 40; left: 0; right: 0; margin: 0 auto; width: calc(min(100vw, var(--col)) - 24px);
    bottom: calc(var(--safe-bottom) + 8px); height: var(--tabbar-h);
    background: var(--tabbar-bg); border: 2px solid var(--edge); border-radius: 28px; box-shadow: var(--sh-float);
    display: grid; grid-template-columns: repeat(3, 1fr); align-items: center; padding: 0 6px;
    backdrop-filter: blur(8px);
  }
  .tab {
    display: flex; flex-direction: column; align-items: center; gap: 2px; min-height: 52px; justify-content: center;
    color: var(--text-faint); font: 700 var(--fs-micro)/1 var(--font-body); text-decoration: none; position: relative;
    isolation: isolate; user-select: none;
  }
  .tab svg { width: 26px; height: 26px; }
  .tab.on { color: var(--text); }
  .tab.on::before {
    content: ''; position: absolute; top: 1px; width: 50px; height: 34px; border-radius: var(--r-blob);
    background: var(--sand); z-index: -1;
  }
  :global(:root[data-theme="night"]) .tab.on::before { background: var(--night-edge); }
</style>
